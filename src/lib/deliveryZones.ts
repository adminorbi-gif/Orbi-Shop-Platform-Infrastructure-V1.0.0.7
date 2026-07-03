import type { DeliveryQuote, DeliveryQuoteItem, DeliveryRule, DeliveryZone, Product } from "../types";
import { formatCurrency } from "./storage";

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "dar-es-salaam",
    name: "Dar es Salaam",
    labelSw: "Dar es Salaam",
    labelEn: "Dar es Salaam",
    price: 2500,
    minDays: 1,
    maxDays: 2,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "nearby-regions",
    name: "Mikoa ya karibu",
    labelSw: "Mikoa ya karibu",
    labelEn: "Nearby regions",
    price: 4500,
    minDays: 2,
    maxDays: 3,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "other-regions",
    name: "Mikoa mingine",
    labelSw: "Mikoa mingine",
    labelEn: "Other regions",
    price: 6500,
    minDays: 3,
    maxDays: 5,
    isActive: true,
    sortOrder: 3,
  },
];

export const DEFAULT_DELIVERY_RULES: DeliveryRule[] = DEFAULT_DELIVERY_ZONES.flatMap((zone) => [
  {
    zoneId: zone.id,
    deliveryClass: "standard",
    minWeightKg: 0,
    maxWeightKg: 5,
    baseFee: zone.price,
    perKgFee: 350,
    fragileFee: 1000,
    oversizedFee: 2500,
    coldChainFee: 3500,
    minDays: zone.minDays,
    maxDays: zone.maxDays,
    isAvailable: true,
    sortOrder: 1,
  },
  {
    zoneId: zone.id,
    deliveryClass: "fresh_food",
    minWeightKg: 0,
    maxWeightKg: 15,
    baseFee: Math.round(zone.price * 1.15),
    perKgFee: 300,
    fragileFee: 500,
    oversizedFee: 1500,
    coldChainFee: 2500,
    minDays: Math.max(0, zone.minDays - 1),
    maxDays: Math.max(1, zone.minDays),
    isAvailable: zone.sortOrder === 1,
    reasonIfUnavailable: "Fresh food is local-delivery only.",
    sortOrder: 2,
  },
  {
    zoneId: zone.id,
    deliveryClass: "processed_food",
    minWeightKg: 0,
    maxWeightKg: 20,
    baseFee: Math.round(zone.price * 1.2),
    perKgFee: 450,
    fragileFee: 500,
    oversizedFee: 1500,
    coldChainFee: 0,
    minDays: zone.minDays,
    maxDays: zone.maxDays + 1,
    isAvailable: true,
    sortOrder: 3,
  },
  {
    zoneId: zone.id,
    deliveryClass: "bulky",
    minWeightKg: 0,
    maxWeightKg: 30,
    baseFee: Math.round(zone.price * 1.8),
    perKgFee: 650,
    fragileFee: 2500,
    oversizedFee: 5000,
    coldChainFee: 5000,
    minDays: zone.minDays + 1,
    maxDays: zone.maxDays + 2,
    isAvailable: true,
    sortOrder: 4,
  },
  {
    zoneId: zone.id,
    deliveryClass: "heavy",
    minWeightKg: 0,
    maxWeightKg: 80,
    baseFee: Math.round(zone.price * 2.6),
    perKgFee: 950,
    fragileFee: 3500,
    oversizedFee: 7500,
    coldChainFee: 7500,
    minDays: zone.minDays + 2,
    maxDays: zone.maxDays + 3,
    isAvailable: true,
    sortOrder: 5,
  },
]);

export const normalizeDeliveryZones = (zones?: DeliveryZone[] | null) => {
  const active = (zones || [])
    .filter((zone) => zone && zone.isActive !== false)
    .map((zone, index) => ({
      ...zone,
      id: String(zone.id || zone.name || `delivery-zone-${index}`),
      price: Number(zone.price || 0),
      minDays: Math.max(0, Number(zone.minDays || 0)),
      maxDays: Math.max(Number(zone.minDays || 0), Number(zone.maxDays || zone.minDays || 0)),
      sortOrder: Number(zone.sortOrder ?? index),
    }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return active.length > 0 ? active : DEFAULT_DELIVERY_ZONES;
};

export const normalizeDeliveryRules = (rules?: DeliveryRule[] | null) => {
  const normalized = (rules || [])
    .filter((rule) => rule && rule.zoneId && rule.deliveryClass)
    .map((rule, index) => ({
      ...rule,
      zoneId: String(rule.zoneId),
      deliveryClass: String(rule.deliveryClass || "standard").toLowerCase(),
      minWeightKg: Math.max(0, Number(rule.minWeightKg || 0)),
      maxWeightKg: rule.maxWeightKg === null || rule.maxWeightKg === undefined ? null : Math.max(0, Number(rule.maxWeightKg || 0)),
      baseFee: Math.max(0, Number(rule.baseFee || 0)),
      perKgFee: Math.max(0, Number(rule.perKgFee || 0)),
      fragileFee: Math.max(0, Number(rule.fragileFee || 0)),
      oversizedFee: Math.max(0, Number(rule.oversizedFee || 0)),
      coldChainFee: Math.max(0, Number(rule.coldChainFee || 0)),
      minDays: Math.max(0, Number(rule.minDays || 0)),
      maxDays: Math.max(Math.max(0, Number(rule.minDays || 0)), Number(rule.maxDays || rule.minDays || 0)),
      isAvailable: rule.isAvailable !== false,
      sortOrder: Number(rule.sortOrder ?? index),
    }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return normalized.length > 0 ? normalized : DEFAULT_DELIVERY_RULES;
};

export const getDeliveryZoneName = (zone: DeliveryZone, lang: string) => {
  return lang === "sw"
    ? zone.labelSw || zone.name
    : zone.labelEn || zone.name;
};

const normalizeLocationToken = (value?: string | null) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const inferDeliveryZoneIdFromLocation = (
  location: string | undefined | null,
  zones: DeliveryZone[],
) => {
  const normalizedLocation = normalizeLocationToken(location);
  if (!normalizedLocation) return undefined;

  const normalizedZones = normalizeDeliveryZones(zones);
  const exact = normalizedZones.find((zone) => {
    const tokens = [zone.id, zone.name, zone.labelSw, zone.labelEn].map(normalizeLocationToken);
    return tokens.some((token) => token && (normalizedLocation === token || normalizedLocation.includes(token) || token.includes(normalizedLocation)));
  });
  if (exact) return exact.id;

  if (/\bdar\b|dar es salaam|daressalaam|dsm/.test(normalizedLocation)) {
    return normalizedZones.find((zone) => normalizeLocationToken(`${zone.id} ${zone.name} ${zone.labelSw} ${zone.labelEn}`).includes("dar"))?.id;
  }

  return undefined;
};

export const isSameDeliveryZone = (product: Partial<Product>, zone: DeliveryZone) => {
  const originZoneId = product.sellerOriginZoneId;
  return Boolean(originZoneId && String(originZoneId) === String(zone.id));
};

export const formatSameZoneDeliveryEta = (lang: string) =>
  lang === "sw" ? "Ndani ya saa 2-6 za kazi" : "Within 2-6 business hours";

const getEtaDayValue = (eta: string) => {
  const value = String(eta || "").toLowerCase();
  if (value.includes("saa") || value.includes("hour")) return 0;
  const match = value.match(/(\d+)(?:-(\d+))?/);
  return match ? Number(match[2] || match[1]) : 0;
};

export const formatDeliveryDays = (zone: DeliveryZone, lang: string) => {
  const min = Number(zone.minDays || 0);
  const max = Math.max(min, Number(zone.maxDays || min));
  const unit = lang === "sw" ? "siku" : "days";
  if (min === 0 && max === 0) return lang === "sw" ? "Leo" : "Today";
  if (min === max) return `${max} ${unit}`;
  return `${min}-${max} ${unit}`;
};

export const formatDeliveryZoneSummary = (zone: DeliveryZone, lang: string) => {
  return `${getDeliveryZoneName(zone, lang)} ${formatDeliveryDays(zone, lang)} | ${formatCurrency(zone.price)}`;
};

export const getProductDeliveryClass = (product: Partial<Product>) => {
  if (product.digitalProduct) return "digital";
  if (product.deliveryClass) return String(product.deliveryClass).toLowerCase();
  if (product.oversized) return "bulky";
  const weight = Number(product.weightKg || 0);
  if (weight >= 30) return "heavy";
  if (weight >= 8) return "bulky";
  return "standard";
};

export const getBillableWeightKg = (product: Partial<Product>) => {
  const actual = Math.max(0.1, Number(product.weightKg || 1));
  const length = Number(product.lengthCm || 0);
  const width = Number(product.widthCm || 0);
  const height = Number(product.heightCm || 0);
  const volumetric = length > 0 && width > 0 && height > 0 ? (length * width * height) / 5000 : 0;
  return Math.max(actual, volumetric);
};

export const quoteProductDelivery = (
  product: Partial<Product>,
  quantity: number,
  zone: DeliveryZone,
  rules: DeliveryRule[],
  lang: string,
): DeliveryQuoteItem => {
  const qty = Math.max(1, Number(quantity || 1));
  const productId = String(product.id || "");
  const name = String(product.name || "Product");

  if (product.requiresDeliveryQuote || product.deliveryScope === "custom_quote") {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: lang === "sw"
        ? "Bidhaa hii inahitaji makadirio maalum ya usafirishaji kabla ya malipo."
        : "This product requires a custom delivery quote before payment.",
      deliveryClass: getProductDeliveryClass(product),
    };
  }

  if (product.digitalProduct) {
    return {
      productId,
      name,
      quantity: qty,
      available: true,
      fee: 0,
      eta: lang === "sw" ? "Mara moja" : "Instant",
      deliveryClass: "digital",
    };
  }

  const scope = String(product.deliveryScope || "national");
  if (scope === "local_only" && Number(zone.sortOrder || 0) > 1) {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: lang === "sw"
        ? "Bidhaa hii inafikishwa eneo la karibu tu."
        : "This product is available for local delivery only.",
      deliveryClass: getProductDeliveryClass(product),
    };
  }
  if (scope === "regional" && Number(zone.sortOrder || 0) > 2) {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: lang === "sw"
        ? "Bidhaa hii inafikishwa kwenye maeneo yaliyochaguliwa tu."
        : "This product is available only in selected regions.",
      deliveryClass: getProductDeliveryClass(product),
    };
  }

  const blockedZones = Array.isArray(product.blockedDeliveryZoneIds) ? product.blockedDeliveryZoneIds.map(String) : [];
  if (blockedZones.includes(String(zone.id))) {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: lang === "sw" ? "Bidhaa hii haifiki eneo hili." : "This product is not deliverable to this zone.",
      deliveryClass: getProductDeliveryClass(product),
    };
  }

  const deliveryClass = getProductDeliveryClass(product);
  const billableWeight = getBillableWeightKg(product) * qty;
  const normalizedRules = normalizeDeliveryRules(rules);
  const zoneRules = normalizedRules.filter((rule) => String(rule.zoneId) === String(zone.id));
  const matchingRule =
    zoneRules.find((rule) =>
      rule.deliveryClass === deliveryClass &&
      billableWeight >= Number(rule.minWeightKg || 0) &&
      (rule.maxWeightKg === null || rule.maxWeightKg === undefined || billableWeight <= Number(rule.maxWeightKg)),
    ) ||
    zoneRules.find((rule) => rule.deliveryClass === "standard") ||
    normalizedRules.find((rule) => rule.deliveryClass === deliveryClass) ||
    normalizedRules.find((rule) => rule.deliveryClass === "standard");

  if (!matchingRule) {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: lang === "sw" ? "Hakuna kanuni ya delivery kwa bidhaa hii." : "No delivery rule is configured for this product.",
      deliveryClass,
    };
  }

  if (matchingRule.isAvailable === false) {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: matchingRule.reasonIfUnavailable || (lang === "sw" ? "Delivery haipatikani kwa eneo hili." : "Delivery is unavailable for this zone."),
      deliveryClass,
    };
  }

  const extras =
    (product.fragile ? Number(matchingRule.fragileFee || 0) : 0) +
    (product.oversized ? Number(matchingRule.oversizedFee || 0) : 0) +
    (product.requiresColdChain ? Number(matchingRule.coldChainFee || 0) : 0);
  const fee = Math.round(Number(matchingRule.baseFee || 0) + billableWeight * Number(matchingRule.perKgFee || 0) + extras);
  const etaZone = {
    ...zone,
    minDays: matchingRule.minDays,
    maxDays: matchingRule.maxDays,
  };
  const sameZone = isSameDeliveryZone(product, zone);

  return {
    productId,
    name,
    quantity: qty,
    available: true,
    fee,
    eta: sameZone ? formatSameZoneDeliveryEta(lang) : formatDeliveryDays(etaZone, lang),
    deliveryClass,
  };
};

export const quoteCartDelivery = (
  cart: { product: Partial<Product>; quantity: number }[],
  zone: DeliveryZone,
  rules: DeliveryRule[],
  lang = "sw",
): DeliveryQuote => {
  const items = cart.map((item) => quoteProductDelivery(item.product, item.quantity, zone, rules, lang));
  const unavailableItems = items.filter((item) => !item.available);
  const totalFee = items.reduce((sum, item) => sum + (item.available ? item.fee : 0), 0);
  const maxEta = items
    .filter((item) => item.available)
    .map((item) => getEtaDayValue(item.eta))
    .reduce((max, days) => Math.max(max, days), 0);
  const firstHourlyEta = items.find((item) => item.available && getEtaDayValue(item.eta) === 0 && /saa|hour/i.test(item.eta))?.eta;

  return {
    zoneId: String(zone.id),
    zoneName: getDeliveryZoneName(zone, lang),
    totalFee,
    eta: maxEta > 0 ? `${maxEta} ${lang === "sw" ? "siku" : "days"}` : firstHourlyEta || formatDeliveryDays(zone, lang),
    available: unavailableItems.length === 0,
    items,
    unavailableItems,
  };
};
