import { applyCartDeliveryAdjustments, quoteCartDelivery, quoteProductDelivery, getProductDeliveryClass } from "./deliveryQuote.js";
import { DEFAULT_DELIVERY_SETTINGS, DeliverySettings, mapDeliverySettings } from "./deliverySettings.js";
import { resolveShippingPlan } from "./shippingIntelligence.js";

type Coordinate = {
  lat: number;
  lng: number;
};

type RouteContext = {
  origin?: Coordinate | null;
  destination?: Coordinate | null;
  lang?: string;
};

const GOOGLE_ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const ROUTE_CACHE_TTL_MS = Math.max(5, Number(process.env.DELIVERY_ROUTE_CACHE_MINUTES || 20)) * 60 * 1000;

type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  provider: "google_routes" | "distance_estimate";
};

const routeCache = new Map<string, RouteResult & { cachedAt: number; expiresAt: number }>();

const routeMetrics = {
  googleCalls: 0,
  googleFailures: 0,
  cacheHits: 0,
  cacheMisses: 0,
  fallbackEstimates: 0,
  lastGoogleOkAt: "",
  lastGoogleErrorAt: "",
  lastGoogleError: "",
  lastProvider: "zone_rules",
};

const toCoordinate = (value: any): Coordinate | null => {
  const lat = Number(value?.lat ?? value?.latitude);
  const lng = Number(value?.lng ?? value?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

const getProductOrigin = (product: any, fallback?: Coordinate | null) =>
  toCoordinate({
    lat: product?.sellerPickupLat ?? product?.seller_pickup_lat ?? product?.pickupLat ?? product?.pickup_lat,
    lng: product?.sellerPickupLng ?? product?.seller_pickup_lng ?? product?.pickupLng ?? product?.pickup_lng,
  }) || fallback || null;

const parseGoogleDurationSeconds = (duration: any) => {
  if (typeof duration === "number") return duration;
  const match = String(duration || "").match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Number(match[1]) : 0;
};

const haversineDistanceMeters = (origin: Coordinate, destination: Coordinate) => {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const estimateRoadRoute = (origin: Coordinate, destination: Coordinate) => {
  const straightMeters = haversineDistanceMeters(origin, destination);
  const roadDistanceMeters = Math.round(straightMeters * 1.28);
  const urbanSpeedKph = roadDistanceMeters <= 50000 ? 28 : 55;
  const durationSeconds = Math.round((roadDistanceMeters / 1000 / urbanSpeedKph) * 3600);
  return {
    distanceMeters: roadDistanceMeters,
    durationSeconds,
    provider: "distance_estimate" as const,
  };
};

const computeGoogleRoute = async (origin: Coordinate, destination: Coordinate) => {
  const apiKey = process.env.GOOGLE_MAPS_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  routeMetrics.googleCalls += 1;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(GOOGLE_ROUTES_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: { latitude: destination.lat, longitude: destination.lng },
          },
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        units: "METRIC",
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("[Route Delivery] Google Routes failed:", response.status, text.slice(0, 180));
      routeMetrics.googleFailures += 1;
      routeMetrics.lastGoogleErrorAt = new Date().toISOString();
      routeMetrics.lastGoogleError = `HTTP ${response.status}`;
      return null;
    }

    const payload: any = await response.json();
    const route = payload?.routes?.[0];
    if (!route?.distanceMeters) return null;
    routeMetrics.lastGoogleOkAt = new Date().toISOString();
    routeMetrics.lastProvider = "google_routes";
    return {
      distanceMeters: Number(route.distanceMeters),
      durationSeconds: parseGoogleDurationSeconds(route.duration),
      provider: "google_routes" as const,
    };
  } catch (error: any) {
    console.warn("[Route Delivery] Google Routes unavailable:", error?.message || error);
    routeMetrics.googleFailures += 1;
    routeMetrics.lastGoogleErrorAt = new Date().toISOString();
    routeMetrics.lastGoogleError = String(error?.message || error || "Google Routes unavailable").slice(0, 160);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const routeCacheKey = (origin: Coordinate, destination: Coordinate) => {
  const point = (coord: Coordinate) => `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;
  return `${point(origin)}>${point(destination)}`;
};

const getCachedRoute = (origin: Coordinate, destination: Coordinate) => {
  const key = routeCacheKey(origin, destination);
  const cached = routeCache.get(key);
  if (!cached || cached.expiresAt < Date.now()) {
    if (cached) routeCache.delete(key);
    routeMetrics.cacheMisses += 1;
    return null;
  }
  routeMetrics.cacheHits += 1;
  return cached;
};

const setCachedRoute = (origin: Coordinate, destination: Coordinate, route: RouteResult) => {
  routeCache.set(routeCacheKey(origin, destination), {
    ...route,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ROUTE_CACHE_TTL_MS,
  });
};

const getRouteForCoordinates = async (origin: Coordinate, destination: Coordinate) => {
  const cached = getCachedRoute(origin, destination);
  if (cached) return { ...cached, cached: true };

  const googleRoute = await computeGoogleRoute(origin, destination);
  const route = googleRoute || estimateRoadRoute(origin, destination);
  if (!googleRoute) {
    routeMetrics.fallbackEstimates += 1;
    routeMetrics.lastProvider = "distance_estimate";
  }
  setCachedRoute(origin, destination, route);
  return { ...route, cached: false };
};

const getClassRatePerKm = (deliveryClass: string) => {
  switch (deliveryClass) {
    case "fresh_food":
      return 1100;
    case "processed_food":
      return 1000;
    case "bulky":
      return 1600;
    case "heavy":
      return 2200;
    default:
      return 900;
  }
};

const routeEta = (durationSeconds: number, deliveryClass: string, lang = "sw") => {
  const handlingMinutes =
    deliveryClass === "fresh_food" ? 45 :
    deliveryClass === "bulky" || deliveryClass === "heavy" ? 180 :
    90;
  const totalMinutes = Math.max(45, Math.round(durationSeconds / 60) + handlingMinutes);

  if (totalMinutes <= 8 * 60) {
    const minHours = Math.max(1, Math.ceil(totalMinutes / 60));
    const maxHours = Math.max(minHours + 1, Math.ceil((totalMinutes + 90) / 60));
    return lang === "sw"
      ? `Ndani ya saa ${minHours}-${maxHours} za kazi`
      : `Within ${minHours}-${maxHours} business hours`;
  }

  const minDays = Math.max(1, Math.ceil(totalMinutes / (8 * 60)));
  const maxDays = Math.max(minDays, minDays + 1);
  return lang === "sw" ? `${minDays}-${maxDays} siku` : `${minDays}-${maxDays} days`;
};

const routeFee = (product: any, quantity: number, distanceMeters: number, fallbackFee: number) => {
  const deliveryClass = getProductDeliveryClass(product);
  const distanceKm = Math.max(1, distanceMeters / 1000);
  const baseFee = deliveryClass === "heavy" ? 5000 : deliveryClass === "bulky" ? 3500 : 1800;
  const classDistanceFee = distanceKm * getClassRatePerKm(deliveryClass);
  const handlingFee =
    (product?.fragile ? 1000 : 0) +
    (product?.oversized ? 2500 : 0) +
    ((product?.requiresColdChain || product?.requires_cold_chain) ? 2500 : 0);
  const quantityMultiplier = Math.max(1, Math.sqrt(Math.max(1, Number(quantity || 1))));
  const calculated = Math.round((baseFee + classDistanceFee + handlingFee) * quantityMultiplier);

  // Route pricing should improve local accuracy, but not silently undercharge long/complex orders.
  return distanceKm <= 35 ? calculated : Math.max(calculated, Math.round(Number(fallbackFee || 0) * 0.75));
};

export const quoteCartRouteDelivery = async (
  cart: any[],
  zone: any,
  rules: any[],
  context: RouteContext,
  settingsInput?: Partial<DeliverySettings>,
  options: { applyInsurance?: boolean } = {},
) => {
  const lang = context.lang || "sw";
  const settings = mapDeliverySettings(settingsInput || DEFAULT_DELIVERY_SETTINGS);
  const destination = toCoordinate(context.destination);
  const fallback = quoteCartDelivery(cart, zone, rules, lang, settings, options);
  if (!destination && settings.routeQuoteRequired) {
    return {
      ...fallback,
      available: false,
      totalFee: 0,
      eta: "",
      reason: lang === "sw"
        ? "Chagua eneo halisi kupitia Google Maps ili mfumo ukokotoe route na gharama sahihi."
        : "Select an exact Google Maps location so the system can calculate the live route and delivery fee.",
      quoteMode: "route_required",
      routeProvider: "google_routes",
    };
  }

  if (!destination || !fallback.available) {
    return {
      ...fallback,
      quoteMode: "zone_fallback",
      routeProvider: "zone_rules",
    };
  }

  const fallbackOrigin = toCoordinate(context.origin);
  const items = await Promise.all(
    cart.map(async (item) => {
      const product = item.product || item;
      const origin = getProductOrigin(product, fallbackOrigin);
      const fallbackItem = quoteProductDelivery(product, item.quantity, zone, rules, lang, settings);
      if (!origin || !fallbackItem.available) {
        return {
          ...fallbackItem,
          quoteMode: "zone_fallback",
          routeProvider: "zone_rules",
        };
      }

      const route = await getRouteForCoordinates(origin, destination);
      const deliveryClass = getProductDeliveryClass(product);
      return {
        ...fallbackItem,
        fee: routeFee(product, item.quantity, route.distanceMeters, fallbackItem.fee),
        eta: routeEta(route.durationSeconds, deliveryClass, lang),
        quoteMode: route.provider === "google_routes" ? "route_exact" : "route_estimate",
        routeProvider: route.provider,
        route: {
          distanceKm: Number((route.distanceMeters / 1000).toFixed(1)),
          durationMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
          provider: route.provider,
          cached: route.cached,
        },
      };
    }),
  );

  const unavailableItems = items.filter((item) => !item.available);
  const totalFee = items.reduce((sum, item) => sum + (item.available ? Number(item.fee || 0) : 0), 0);
  const routeItems = items.filter((item: any) => item.route);
  const routeSummary = {
    maxDistanceKm: Math.max(...routeItems.map((item: any) => Number(item.route?.distanceKm || 0)), 0),
    maxDurationMinutes: Math.max(...routeItems.map((item: any) => Number(item.route?.durationMinutes || 0)), 0),
    provider: routeItems.find((item: any) => item.routeProvider === "google_routes") ? "google_routes" : (routeItems[0] as any)?.routeProvider || "zone_rules",
  };
  const slowest = items
    .filter((item) => item.available)
    .sort((a: any, b: any) => Number(b.route?.durationMinutes || 0) - Number(a.route?.durationMinutes || 0))[0] as any;

  const adjustedQuote = applyCartDeliveryAdjustments({
    ...fallback,
    totalFee,
    eta: slowest?.eta || fallback.eta,
    available: unavailableItems.length === 0,
    items,
    unavailableItems,
    quoteMode: items.some((item) => item.quoteMode === "route_exact")
      ? "route_exact"
      : items.some((item) => item.quoteMode === "route_estimate")
        ? "route_estimate"
        : "zone_fallback",
    routeProvider: items.find((item) => item.routeProvider && item.routeProvider !== "zone_rules")?.routeProvider || "zone_rules",
    routeSummary,
  }, cart, settings, options);

  const shippingPlan = resolveShippingPlan({
    destination,
    routeSummary,
    packageSummary: adjustedQuote.packageSummary,
    settings,
    lang,
  });

  return {
    ...adjustedQuote,
    available: adjustedQuote.available && shippingPlan.available,
    reason: shippingPlan.available ? adjustedQuote.reason : shippingPlan.reason,
    shippingPlan,
    selectedShippingType: shippingPlan.recommended || null,
    pickupHub: shippingPlan.pickupHub || null,
  };
};

export const getRouteDeliveryHealth = () => {
  const apiKeyConfigured = Boolean(process.env.GOOGLE_MAPS_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY);
  const googleStatus =
    !apiKeyConfigured ? "not_configured" :
    routeMetrics.lastGoogleOkAt ? "ok" :
    routeMetrics.lastGoogleErrorAt ? "degraded" :
    "ready";

  return {
    routesApi: {
      status: googleStatus,
      apiKeyConfigured,
      lastOkAt: routeMetrics.lastGoogleOkAt || null,
      lastErrorAt: routeMetrics.lastGoogleErrorAt || null,
      lastError: routeMetrics.lastGoogleError || null,
      googleCalls: routeMetrics.googleCalls,
      googleFailures: routeMetrics.googleFailures,
    },
    routeCache: {
      status: "ok",
      ttlMinutes: Math.round(ROUTE_CACHE_TTL_MS / 60000),
      entries: routeCache.size,
      hits: routeMetrics.cacheHits,
      misses: routeMetrics.cacheMisses,
    },
    fallback: {
      status: "ok",
      estimatesUsed: routeMetrics.fallbackEstimates,
      lastProvider: routeMetrics.lastProvider,
    },
  };
};
