import { Router } from "express";

const router = Router();

const getGoogleMapsKey = () =>
  process.env.GOOGLE_MAPS_PLACES_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_ROUTES_API_KEY ||
  "";

const normalizeLang = (lang: any) => (String(lang || "sw").toLowerCase().startsWith("sw") ? "sw" : "en");

const normalizePlaceSuggestion = (item: any) => {
  const prediction = item?.placePrediction || item;
  const structured = prediction?.structuredFormat || {};
  const mainText = structured?.mainText?.text || prediction?.structured_formatting?.main_text || prediction?.description || prediction?.text?.text || "";
  const secondaryText = structured?.secondaryText?.text || prediction?.structured_formatting?.secondary_text || "";
  return {
    placeId: prediction?.placeId || prediction?.place_id || "",
    description: prediction?.text?.text || prediction?.description || [mainText, secondaryText].filter(Boolean).join(", "),
    mainText,
    secondaryText,
  };
};

const searchPlacesNew = async (input: string, lang: string, apiKey: string) => {
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["tz"],
      languageCode: lang,
    }),
  });

  if (!response.ok) {
    throw new Error(`PLACES_AUTOCOMPLETE_HTTP_${response.status}`);
  }

  const json = await response.json();
  return (json?.suggestions || [])
    .map(normalizePlaceSuggestion)
    .filter((item: any) => item.placeId && item.description);
};

const searchPlacesLegacy = async (input: string, lang: string, apiKey: string) => {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("components", "country:tz");
  url.searchParams.set("language", lang);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PLACES_LEGACY_AUTOCOMPLETE_HTTP_${response.status}`);
  }

  const json = await response.json();
  if (json.status && !["OK", "ZERO_RESULTS"].includes(json.status)) {
    throw new Error(json.error_message || json.status);
  }

  return (json.predictions || [])
    .map(normalizePlaceSuggestion)
    .filter((item: any) => item.placeId && item.description);
};

const getPlaceDetailsNew = async (placeId: string, lang: string, apiKey: string) => {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${encodeURIComponent(lang)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,googleMapsUri,addressComponents",
    },
  });

  if (!response.ok) {
    throw new Error(`PLACE_DETAILS_HTTP_${response.status}`);
  }

  const json = await response.json();
  const lat = Number(json?.location?.latitude);
  const lng = Number(json?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("PLACE_DETAILS_MISSING_COORDINATES");
  }

  return {
    placeId: json.id || placeId,
    name: json?.displayName?.text || "",
    formattedAddress: json.formattedAddress || "",
    lat,
    lng,
    googleMapsUri: json.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    addressComponents: json.addressComponents || [],
  };
};

const getPlaceDetailsLegacy = async (placeId: string, lang: string, apiKey: string) => {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "place_id,name,formatted_address,geometry,url,address_component");
  url.searchParams.set("language", lang);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PLACE_LEGACY_DETAILS_HTTP_${response.status}`);
  }

  const json = await response.json();
  if (json.status && json.status !== "OK") {
    throw new Error(json.error_message || json.status);
  }

  const result = json.result || {};
  const lat = Number(result?.geometry?.location?.lat);
  const lng = Number(result?.geometry?.location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("PLACE_LEGACY_DETAILS_MISSING_COORDINATES");
  }

  return {
    placeId: result.place_id || placeId,
    name: result.name || "",
    formattedAddress: result.formatted_address || "",
    lat,
    lng,
    googleMapsUri: result.url || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    addressComponents: result.address_components || [],
  };
};

router.get("/autocomplete", async (req, res) => {
  try {
    const apiKey = getGoogleMapsKey();
    const input = String(req.query.q || req.query.input || "").trim();
    const lang = normalizeLang(req.query.lang);

    if (!apiKey) {
      return res.status(503).json({ success: false, error: "GOOGLE_MAPS_API_KEY_NOT_CONFIGURED" });
    }
    if (input.length < 2) {
      return res.json({ success: true, data: [] });
    }

    let suggestions: any[] = [];
    try {
      suggestions = await searchPlacesNew(input, lang, apiKey);
    } catch (newApiError) {
      console.warn("[Places] New autocomplete failed, trying legacy API:", (newApiError as any)?.message || newApiError);
      suggestions = await searchPlacesLegacy(input, lang, apiKey);
    }

    res.json({ success: true, data: suggestions.slice(0, 8) });
  } catch (error: any) {
    console.error("GET /api/v1/places/autocomplete error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || "PLACES_AUTOCOMPLETE_FAILED" });
  }
});

router.get("/details", async (req, res) => {
  try {
    const apiKey = getGoogleMapsKey();
    const placeId = String(req.query.placeId || req.query.place_id || "").trim();
    const lang = normalizeLang(req.query.lang);

    if (!apiKey) {
      return res.status(503).json({ success: false, error: "GOOGLE_MAPS_API_KEY_NOT_CONFIGURED" });
    }
    if (!placeId) {
      return res.status(400).json({ success: false, error: "PLACE_ID_REQUIRED" });
    }

    let place: any;
    try {
      place = await getPlaceDetailsNew(placeId, lang, apiKey);
    } catch (newApiError) {
      console.warn("[Places] New details failed, trying legacy API:", (newApiError as any)?.message || newApiError);
      place = await getPlaceDetailsLegacy(placeId, lang, apiKey);
    }

    res.json({ success: true, data: place });
  } catch (error: any) {
    console.error("GET /api/v1/places/details error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || "PLACE_DETAILS_FAILED" });
  }
});

router.get("/static-map", async (req, res) => {
  try {
    const apiKey = getGoogleMapsKey();
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const zoom = Math.min(18, Math.max(8, Number(req.query.zoom || 15)));
    const size = String(req.query.size || "640x260").replace(/[^0-9x]/g, "") || "640x260";

    if (!apiKey) {
      return res.status(503).json({ success: false, error: "GOOGLE_MAPS_API_KEY_NOT_CONFIGURED" });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, error: "VALID_LAT_LNG_REQUIRED" });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
    url.searchParams.set("center", `${lat},${lng}`);
    url.searchParams.set("zoom", String(zoom));
    url.searchParams.set("size", size);
    url.searchParams.set("scale", "2");
    url.searchParams.set("maptype", "roadmap");
    url.searchParams.set("markers", `color:orange|label:O|${lat},${lng}`);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url);
    if (!response.ok || !response.body) {
      return res.status(response.status || 502).json({ success: false, error: "STATIC_MAP_FAILED" });
    }

    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (error: any) {
    console.error("GET /api/v1/places/static-map error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || "STATIC_MAP_FAILED" });
  }
});

export default router;
