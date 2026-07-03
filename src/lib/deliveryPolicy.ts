import type { Product } from "../types";

export type DeliveryPolicyInference = Pick<
  Product,
  | "deliveryClass"
  | "weightKg"
  | "fragile"
  | "oversized"
  | "requiresColdChain"
  | "digitalProduct"
  | "requiresDeliveryQuote"
  | "deliveryScope"
  | "deliveryPolicySource"
  | "deliveryHandlingNotes"
>;

const hasAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export const inferDeliveryPolicy = (input: Partial<Product>): DeliveryPolicyInference => {
  const text = [
    input.name,
    input.niche,
    input.category,
    input.family,
    input.description,
    ...(Array.isArray(input.tags) ? input.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const policy: DeliveryPolicyInference = {
    deliveryClass: "standard",
    weightKg: Math.max(1, Number(input.weightKg || 1)),
    fragile: Boolean(input.fragile),
    oversized: Boolean(input.oversized),
    requiresColdChain: Boolean(input.requiresColdChain),
    digitalProduct: Boolean(input.digitalProduct),
    requiresDeliveryQuote: Boolean(input.requiresDeliveryQuote),
    deliveryScope: input.deliveryScope || "national",
    deliveryPolicySource: "auto",
    deliveryHandlingNotes: "",
  };

  if (hasAny(text, ["digital", "ebook", "e-book", "software", "license", "voucher", "airtime"])) {
    return {
      ...policy,
      deliveryClass: "digital",
      digitalProduct: true,
      weightKg: 0,
      deliveryScope: "national",
      deliveryHandlingNotes: "Digital product: instant fulfillment, no physical delivery fee.",
    };
  }

  const isVehicle = hasAny(text, ["car", "vehicle", "gari", "suv", "truck", "lorry", "pickup", "motorcycle", "pikipiki", "bajaj"]);
  if (isVehicle) {
    return {
      ...policy,
      deliveryClass: "vehicle",
      weightKg: Math.max(Number(input.weightKg || 1200), 1200),
      oversized: true,
      requiresDeliveryQuote: true,
      deliveryScope: "custom_quote",
      deliveryHandlingNotes: "Vehicle delivery requires custom quote: driver, fuel, distance, inspection, and handover handling.",
    };
  }

  const isFreshFood = hasAny(text, ["fresh", "mbichi", "samaki", "nyama", "maziwa", "milk", "vegetable", "mboga", "fruit", "matunda", "cake", "keki", "ice cream"]);
  const isProcessedFood = hasAny(text, ["processed", "packaged", "canned", "dried", "kusindikwa", "unga", "rice", "mchele", "maharage", "snack", "juice", "asali"]);
  if (isFreshFood && !isProcessedFood) {
    return {
      ...policy,
      deliveryClass: "fresh_food",
      weightKg: Math.max(Number(input.weightKg || 1), 1),
      requiresColdChain: hasAny(text, ["frozen", "ice", "maziwa", "milk", "nyama", "samaki", "ice cream"]),
      deliveryScope: "local_only",
      deliveryHandlingNotes: "Fresh/perishable food: local delivery only unless seller enables cold-chain logistics.",
    };
  }

  if (isProcessedFood) {
    return {
      ...policy,
      deliveryClass: "processed_food",
      weightKg: Math.max(Number(input.weightKg || 1), 1),
      deliveryScope: "regional",
      deliveryHandlingNotes: "Processed/packaged food: regional delivery allowed when packaging is suitable.",
    };
  }

  if (hasAny(text, ["fridge", "refrigerator", "freezer", "sofa", "bed", "mattress", "furniture", "tv 55", "tv 65", "washing machine"])) {
    return {
      ...policy,
      deliveryClass: "bulky",
      weightKg: Math.max(Number(input.weightKg || 15), 15),
      oversized: true,
      deliveryScope: "regional",
      deliveryHandlingNotes: "Bulky item: freight-style delivery rules apply.",
    };
  }

  if (hasAny(text, ["glass", "ceramic", "screen", "tv", "monitor", "mirror", "fragile", "breakable"])) {
    return {
      ...policy,
      deliveryClass: "standard",
      weightKg: Math.max(Number(input.weightKg || 3), 3),
      fragile: true,
      deliveryScope: "national",
      deliveryHandlingNotes: "Fragile product: handling surcharge and safer packaging required.",
    };
  }

  return policy;
};

export const summarizeDeliveryPolicy = (policy: DeliveryPolicyInference, lang = "sw") => {
  const classLabels: Record<string, { sw: string; en: string }> = {
    standard: { sw: "Kawaida", en: "Standard" },
    bulky: { sw: "Kubwa", en: "Bulky" },
    heavy: { sw: "Nzito", en: "Heavy" },
    vehicle: { sw: "Gari/Vehicle", en: "Vehicle" },
    fresh_food: { sw: "Chakula kibichi", en: "Fresh food" },
    processed_food: { sw: "Chakula kilichosindikwa", en: "Processed food" },
    digital: { sw: "Digital", en: "Digital" },
  };
  const scopeLabels: Record<string, { sw: string; en: string }> = {
    local_only: { sw: "Eneo la karibu tu", en: "Local only" },
    regional: { sw: "Mikoa iliyochaguliwa", en: "Selected regions" },
    national: { sw: "Nchi nzima", en: "National" },
    custom_quote: { sw: "Quote maalum", en: "Custom quote" },
  };

  const deliveryClass = policy.deliveryClass || "standard";
  const scope = policy.deliveryScope || "national";
  return {
    title: `${classLabels[deliveryClass]?.[lang as "sw" | "en"] || deliveryClass} · ${scopeLabels[scope]?.[lang as "sw" | "en"] || scope}`,
    notes: policy.deliveryHandlingNotes || (lang === "sw" ? "Mfumo umetengeneza makadirio ya usafirishaji." : "The system generated a delivery estimate."),
  };
};
