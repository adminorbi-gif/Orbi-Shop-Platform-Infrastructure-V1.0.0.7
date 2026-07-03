import { Router } from "express";
import { getSupabase } from "../lib/supabase.js";
import { quoteCartDelivery } from "../lib/deliveryQuote.js";
import { quoteCartRouteDelivery } from "../lib/routeDeliveryQuote.js";
import { getDeliverySettings } from "../lib/deliverySettings.js";

const router = Router();

const isValidUUID = (id: any): boolean =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const mapDbProduct = (row: any, fallback: any = {}) => {
  const tagsList = Array.isArray(row?.tags) ? row.tags : [];
  const sellerTag = tagsList.find((tag: string) => typeof tag === "string" && tag.startsWith("seller_id:"));
  const categoryRaw = typeof row?.category === "string" ? row.category : "";
  const [niche = fallback.niche || "Mengineyo", category = fallback.category || "General", family = fallback.family || ""] = categoryRaw.split("::");

  return {
    ...fallback,
    id: row?.id || fallback.id,
    name: row?.name || fallback.name || "Product",
    niche,
    category,
    family,
    price: Number(row?.price ?? fallback.price ?? 0),
    stock: Number(row?.stock ?? fallback.stock ?? 0),
    sellerId: row?.seller_id || (sellerTag ? sellerTag.split(":")[1] : fallback.sellerId) || "system",
    weightKg: Number(row?.weight_kg ?? fallback.weightKg ?? 1),
    lengthCm: row?.length_cm ?? fallback.lengthCm,
    widthCm: row?.width_cm ?? fallback.widthCm,
    heightCm: row?.height_cm ?? fallback.heightCm,
    deliveryClass: row?.delivery_class || fallback.deliveryClass || "standard",
    fragile: row?.fragile ?? fallback.fragile ?? false,
    oversized: row?.oversized ?? fallback.oversized ?? false,
    requiresColdChain: row?.requires_cold_chain ?? fallback.requiresColdChain ?? false,
    hazardous: row?.hazardous ?? fallback.hazardous ?? false,
    digitalProduct: row?.digital_product ?? fallback.digitalProduct ?? false,
    requiresDeliveryQuote: row?.requires_delivery_quote ?? fallback.requiresDeliveryQuote ?? false,
    deliveryScope: row?.delivery_scope || fallback.deliveryScope || "national",
    deliveryPolicySource: row?.delivery_policy_source || fallback.deliveryPolicySource || "auto",
    deliveryHandlingNotes: row?.delivery_handling_notes || fallback.deliveryHandlingNotes || "",
    blockedDeliveryZoneIds: Array.isArray(row?.blocked_delivery_zone_ids) ? row.blocked_delivery_zone_ids : (fallback.blockedDeliveryZoneIds || []),
    sellerOriginZoneId: row?.seller_origin_zone_id || fallback.sellerOriginZoneId,
    sellerPickupAddress: row?.seller_pickup_address || fallback.sellerPickupAddress,
    sellerPickupPlaceId: row?.seller_pickup_place_id || fallback.sellerPickupPlaceId,
    sellerPickupLat: row?.seller_pickup_lat ?? fallback.sellerPickupLat,
    sellerPickupLng: row?.seller_pickup_lng ?? fallback.sellerPickupLng,
  };
};

const attachSellerPickupLocations = async (client: any, cart: any[]) => {
  const sellerIds = Array.from(new Set(
    cart
      .map((item) => item.product?.sellerId)
      .filter((id) => id && id !== "system")
      .map(String),
  ));
  if (sellerIds.length === 0) return cart;

  const uuidIds = sellerIds.filter(isValidUUID);
  const legacyIds = sellerIds.filter((id) => !isValidUUID(id));
  const sellerRows: any[] = [];

  if (uuidIds.length > 0) {
    const { data, error } = await client
      .from("sellers")
      .select("id, legacy_id, pickup_address, pickup_place_id, pickup_lat, pickup_lng, pickup_zone_id")
      .in("id", uuidIds);
    if (!error && data) sellerRows.push(...data);
  }

  if (legacyIds.length > 0) {
    const { data, error } = await client
      .from("sellers")
      .select("id, legacy_id, pickup_address, pickup_place_id, pickup_lat, pickup_lng, pickup_zone_id")
      .in("legacy_id", legacyIds);
    if (!error && data) sellerRows.push(...data);
  }

  const sellersById = new Map<string, any>();
  sellerRows.forEach((seller) => {
    sellersById.set(String(seller.id), seller);
    if (seller.legacy_id) sellersById.set(String(seller.legacy_id), seller);
  });

  return cart.map((item) => {
    const seller = sellersById.get(String(item.product?.sellerId || ""));
    if (!seller) return item;
    return {
      ...item,
      product: {
        ...item.product,
        sellerOriginZoneId: item.product.sellerOriginZoneId || seller.pickup_zone_id,
        sellerPickupAddress: item.product.sellerPickupAddress || seller.pickup_address,
        sellerPickupPlaceId: item.product.sellerPickupPlaceId || seller.pickup_place_id,
        sellerPickupLat: item.product.sellerPickupLat ?? seller.pickup_lat,
        sellerPickupLng: item.product.sellerPickupLng ?? seller.pickup_lng,
      },
    };
  });
};

const handleDeliveryQuote = async (req: any, res: any) => {
  try {
    const { cart, zoneId, lang = "sw", origin, destination, applyInsurance } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, error: "CART_REQUIRED" });
    }
    if (!zoneId) {
      return res.status(400).json({ success: false, error: "DELIVERY_ZONE_REQUIRED" });
    }

    const client = getSupabase(req);
    const { data: zones, error: zoneError } = await client
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (zoneError) throw zoneError;

    const zone = (zones || []).find((item: any) => String(item.id) === String(zoneId));
    if (!zone) {
      return res.status(404).json({ success: false, error: "DELIVERY_ZONE_NOT_FOUND" });
    }

    const { data: rules, error: ruleError } = await client
      .from("delivery_rules")
      .select("*")
      .order("sort_order", { ascending: true });
    if (ruleError) {
      console.warn("[Delivery Quote] Falling back to default rules:", ruleError.message);
    }

    const validatedCartRaw = await Promise.all(
      cart.map(async (item: any) => {
        const productId = item.product?.id || item.productId || item.id;
        let query = client.from("products").select("*");
        query = isValidUUID(productId) ? query.eq("id", productId) : query.eq("legacy_id", productId);
        const { data: product, error } = await query.maybeSingle();
        if (error) throw error;
        if (!product) throw new Error(`Product "${item.product?.name || productId}" not found.`);
        return {
          product: mapDbProduct(product, item.product || {}),
          quantity: parseInt(item.quantity, 10) || 1,
        };
      }),
    );
    const validatedCart = await attachSellerPickupLocations(client, validatedCartRaw);
    const deliverySettings = await getDeliverySettings(client);

    const quote = destination
      ? await quoteCartRouteDelivery(validatedCart, zone, rules || [], { origin, destination, lang }, deliverySettings, { applyInsurance })
      : quoteCartDelivery(validatedCart, zone, rules || [], lang, deliverySettings, { applyInsurance });
    res.json({ success: true, data: quote });
  } catch (error: any) {
    console.error("POST /api/v1/delivery quote error:", error.message || error);
    res.status(500).json({ success: false, error: error.message || "DELIVERY_QUOTE_FAILED" });
  }
};

router.post("/quote", handleDeliveryQuote);
router.post("/route-quote", handleDeliveryQuote);

export default router;
