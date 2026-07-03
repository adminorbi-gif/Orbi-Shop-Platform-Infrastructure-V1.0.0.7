const hasAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export const inferProductDeliveryPolicy = (input: any) => {
  const text = [
    input?.name,
    input?.niche,
    input?.category,
    input?.family,
    input?.description,
    ...(Array.isArray(input?.tags) ? input.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const base = {
    deliveryClass: "standard",
    weightKg: Math.max(1, Number(input?.weightKg || input?.weight_kg || 1)),
    fragile: Boolean(input?.fragile),
    oversized: Boolean(input?.oversized),
    requiresColdChain: Boolean(input?.requiresColdChain || input?.requires_cold_chain),
    hazardous: Boolean(input?.hazardous),
    digitalProduct: Boolean(input?.digitalProduct || input?.digital_product),
    requiresDeliveryQuote: Boolean(input?.requiresDeliveryQuote || input?.requires_delivery_quote),
    deliveryScope: input?.deliveryScope || input?.delivery_scope || "national",
    deliveryPolicySource: "auto",
    deliveryHandlingNotes: "",
  };

  if (hasAny(text, ["digital", "ebook", "e-book", "software", "license", "voucher", "airtime"])) {
    return { ...base, deliveryClass: "digital", digitalProduct: true, weightKg: 0, deliveryScope: "national", deliveryHandlingNotes: "Digital product: instant fulfillment, no physical delivery fee." };
  }

  if (hasAny(text, ["car", "vehicle", "gari", "suv", "truck", "lorry", "pickup", "motorcycle", "pikipiki", "bajaj"])) {
    return { ...base, deliveryClass: "vehicle", weightKg: Math.max(Number(input?.weightKg || 1200), 1200), oversized: true, requiresDeliveryQuote: true, deliveryScope: "custom_quote", deliveryHandlingNotes: "Vehicle delivery requires custom quote: driver, fuel, distance, inspection, and handover handling." };
  }

  const isFreshFood = hasAny(text, ["fresh", "mbichi", "samaki", "nyama", "maziwa", "milk", "vegetable", "mboga", "fruit", "matunda", "cake", "keki", "ice cream"]);
  const isProcessedFood = hasAny(text, ["processed", "packaged", "canned", "dried", "kusindikwa", "unga", "rice", "mchele", "maharage", "snack", "juice", "asali"]);
  if (isFreshFood && !isProcessedFood) {
    return {
      ...base,
      deliveryClass: "fresh_food",
      weightKg: Math.max(Number(input?.weightKg || 1), 1),
      requiresColdChain: hasAny(text, ["frozen", "ice", "maziwa", "milk", "nyama", "samaki", "ice cream"]),
      deliveryScope: "local_only",
      deliveryHandlingNotes: "Fresh/perishable food: local delivery only unless seller enables cold-chain logistics.",
    };
  }

  if (isProcessedFood) {
    return { ...base, deliveryClass: "processed_food", weightKg: Math.max(Number(input?.weightKg || 1), 1), deliveryScope: "regional", deliveryHandlingNotes: "Processed/packaged food: regional delivery allowed when packaging is suitable." };
  }

  if (hasAny(text, ["fridge", "refrigerator", "freezer", "sofa", "bed", "mattress", "furniture", "tv 55", "tv 65", "washing machine"])) {
    return { ...base, deliveryClass: "bulky", weightKg: Math.max(Number(input?.weightKg || 15), 15), oversized: true, deliveryScope: "regional", deliveryHandlingNotes: "Bulky item: freight-style delivery rules apply." };
  }

  if (hasAny(text, ["glass", "ceramic", "screen", "tv", "monitor", "mirror", "fragile", "breakable"])) {
    return { ...base, deliveryClass: "standard", weightKg: Math.max(Number(input?.weightKg || 3), 3), fragile: true, deliveryScope: "national", deliveryHandlingNotes: "Fragile product: handling surcharge and safer packaging required." };
  }

  return base;
};

export const shouldAutoInferDeliveryPolicy = (product: any) => {
  if (product?.deliveryPolicySource === "manual" || product?.delivery_policy_source === "manual") return false;
  const hasExplicitNonDefault =
    product?.deliveryClass && product.deliveryClass !== "standard" ||
    product?.delivery_class && product.delivery_class !== "standard" ||
    product?.requiresDeliveryQuote ||
    product?.requires_delivery_quote ||
    product?.deliveryScope && product.deliveryScope !== "national" ||
    product?.delivery_scope && product.delivery_scope !== "national" ||
    product?.fragile ||
    product?.oversized ||
    product?.requiresColdChain ||
    product?.requires_cold_chain ||
    product?.digitalProduct ||
    product?.digital_product;
  return !hasExplicitNonDefault;
};
