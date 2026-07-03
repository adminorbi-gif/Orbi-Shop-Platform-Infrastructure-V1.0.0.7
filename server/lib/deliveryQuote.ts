import { DEFAULT_DELIVERY_SETTINGS, DeliverySettings, mapDeliverySettings } from "./deliverySettings.js";

const DEFAULT_ZONES = [
  { id: "dar-es-salaam", name: "Dar es Salaam", label_sw: "Dar es Salaam", label_en: "Dar es Salaam", price: 2500, min_days: 1, max_days: 2, is_active: true, sort_order: 1 },
  { id: "nearby-regions", name: "Mikoa ya karibu", label_sw: "Mikoa ya karibu", label_en: "Nearby regions", price: 4500, min_days: 2, max_days: 3, is_active: true, sort_order: 2 },
  { id: "other-regions", name: "Mikoa mingine", label_sw: "Mikoa mingine", label_en: "Other regions", price: 6500, min_days: 3, max_days: 5, is_active: true, sort_order: 3 },
];

const normalizeZone = (row: any) => ({
  id: String(row?.id || row?.name || "dar-es-salaam"),
  name: row?.name || "Dar es Salaam",
  labelSw: row?.label_sw || row?.labelSw || row?.name || "Dar es Salaam",
  labelEn: row?.label_en || row?.labelEn || row?.name || "Dar es Salaam",
  price: Number(row?.price || 0),
  minDays: Number(row?.min_days ?? row?.minDays ?? 1),
  maxDays: Number(row?.max_days ?? row?.maxDays ?? row?.min_days ?? row?.minDays ?? 1),
  isActive: row?.is_active ?? row?.isActive ?? true,
  sortOrder: Number(row?.sort_order ?? row?.sortOrder ?? 0),
});

const buildDefaultRules = (zones: any[]) =>
  zones.flatMap((zone) => [
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
      sortOrder: 2,
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
      sortOrder: 3,
    },
  ]);

export const mapDeliveryRule = (row: any) => ({
  id: row?.id,
  zoneId: String(row?.zone_id || row?.zoneId || ""),
  deliveryClass: String(row?.delivery_class || row?.deliveryClass || "standard").toLowerCase(),
  minWeightKg: Number(row?.min_weight_kg ?? row?.minWeightKg ?? 0),
  maxWeightKg: row?.max_weight_kg ?? row?.maxWeightKg ?? null,
  baseFee: Number(row?.base_fee ?? row?.baseFee ?? 0),
  perKgFee: Number(row?.per_kg_fee ?? row?.perKgFee ?? 0),
  fragileFee: Number(row?.fragile_fee ?? row?.fragileFee ?? 0),
  oversizedFee: Number(row?.oversized_fee ?? row?.oversizedFee ?? 0),
  coldChainFee: Number(row?.cold_chain_fee ?? row?.coldChainFee ?? 0),
  minDays: Number(row?.min_days ?? row?.minDays ?? 1),
  maxDays: Number(row?.max_days ?? row?.maxDays ?? row?.min_days ?? row?.minDays ?? 1),
  isAvailable: row?.is_available ?? row?.isAvailable ?? true,
  reasonIfUnavailable: row?.reason_if_unavailable || row?.reasonIfUnavailable || "",
  sortOrder: Number(row?.sort_order ?? row?.sortOrder ?? 0),
});

export const getProductDeliveryClass = (product: any) => {
  if (product?.digitalProduct || product?.digital_product) return "digital";
  if (product?.deliveryClass || product?.delivery_class) return String(product.deliveryClass || product.delivery_class).toLowerCase();
  if (product?.oversized) return "bulky";
  const weight = Number(product?.weightKg ?? product?.weight_kg ?? 0);
  if (weight >= 30) return "heavy";
  if (weight >= 8) return "bulky";
  return "standard";
};

const getBillableWeightKg = (product: any, volumetricDivisor = DEFAULT_DELIVERY_SETTINGS.volumetricDivisor) => {
  const actual = Math.max(0.1, Number(product?.weightKg ?? product?.weight_kg ?? 1));
  const length = Number(product?.lengthCm ?? product?.length_cm ?? 0);
  const width = Number(product?.widthCm ?? product?.width_cm ?? 0);
  const height = Number(product?.heightCm ?? product?.height_cm ?? 0);
  const volumetric = length > 0 && width > 0 && height > 0 ? (length * width * height) / Math.max(1, volumetricDivisor) : 0;
  return Math.max(actual, volumetric);
};

const getActualWeightKg = (product: any) =>
  Math.max(0.1, Number(product?.weightKg ?? product?.weight_kg ?? 1));

const getVolumetricWeightKg = (product: any, volumetricDivisor = DEFAULT_DELIVERY_SETTINGS.volumetricDivisor) => {
  const length = Number(product?.lengthCm ?? product?.length_cm ?? 0);
  const width = Number(product?.widthCm ?? product?.width_cm ?? 0);
  const height = Number(product?.heightCm ?? product?.height_cm ?? 0);
  return length > 0 && width > 0 && height > 0
    ? (length * width * height) / Math.max(1, volumetricDivisor)
    : 0;
};

export const getCartDeliveryMetrics = (cart: any[], settingsInput?: Partial<DeliverySettings>) => {
  const settings = mapDeliverySettings(settingsInput || DEFAULT_DELIVERY_SETTINGS);
  const totalItems = cart.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  const totalActualWeightKg = cart.reduce((sum, item) => {
    const product = item.product || item;
    const qty = Math.max(1, Number(item.quantity || 1));
    return sum + getActualWeightKg(product) * qty;
  }, 0);
  const totalVolumetricWeightKg = cart.reduce((sum, item) => {
    const product = item.product || item;
    const qty = Math.max(1, Number(item.quantity || 1));
    return sum + getVolumetricWeightKg(product, settings.volumetricDivisor) * qty;
  }, 0);
  const chargeableWeightKg = Math.max(totalActualWeightKg, totalVolumetricWeightKg);
  const packagesByActualWeight = Math.ceil(totalActualWeightKg / Math.max(1, settings.maxPackageWeightKg));
  const packagesByVolumetricWeight = Math.ceil(totalVolumetricWeightKg / Math.max(1, settings.maxPackageVolumetricKg));
  const packageCount = Math.max(1, packagesByActualWeight, packagesByVolumetricWeight);
  const declaredValueTzs = cart.reduce((sum, item) => {
    const product = item.product || item;
    const qty = Math.max(1, Number(item.quantity || 1));
    return sum + Number(product?.price ?? product?.unit_price_tzs ?? 0) * qty;
  }, 0);

  return {
    totalItems,
    totalActualWeightKg: Number(totalActualWeightKg.toFixed(3)),
    totalVolumetricWeightKg: Number(totalVolumetricWeightKg.toFixed(3)),
    chargeableWeightKg: Number(chargeableWeightKg.toFixed(3)),
    packageCount,
    declaredValueTzs: Math.round(declaredValueTzs),
    packagesByActualWeight,
    packagesByVolumetricWeight,
  };
};

const calculateInsuranceFee = (declaredValueTzs: number, settings: DeliverySettings, applyInsurance = false) => {
  if (!applyInsurance || !settings.insuranceEnabled || declaredValueTzs <= 0) {
    return { fee: 0, coverage: 0 };
  }
  const rawFee = declaredValueTzs * (settings.insuranceRatePercent / 100);
  const fee = Math.round(Math.max(settings.insuranceMinFeeTzs, rawFee));
  const coverage = Math.min(declaredValueTzs, settings.insuranceMaxCoverageTzs);
  return { fee, coverage };
};

export const applyCartDeliveryAdjustments = (
  quote: any,
  cart: any[],
  settingsInput?: Partial<DeliverySettings>,
  options: { applyInsurance?: boolean } = {},
) => {
  const settings = mapDeliverySettings(settingsInput || DEFAULT_DELIVERY_SETTINGS);
  const metrics = getCartDeliveryMetrics(cart, settings);

  if (metrics.chargeableWeightKg > settings.maxTotalWeightKg) {
    return {
      ...quote,
      available: false,
      reason: `DELIVERY_MAX_WEIGHT_EXCEEDED:${metrics.chargeableWeightKg}:${settings.maxTotalWeightKg}`,
      totalFee: 0,
      packageSummary: metrics,
      costBreakdown: {
        ...(quote?.costBreakdown || {}),
        settings,
        packageSummary: metrics,
      },
    };
  }

  const baseDeliveryFee = Math.max(0, Number(quote?.totalFee || 0));
  const extraPackageCount = Math.max(0, metrics.packageCount - 1);
  const extraPackageFee = Math.round(extraPackageCount * settings.extraPackageFeeTzs);
  const fuelSurcharge = Math.round((baseDeliveryFee + extraPackageFee) * (settings.fuelSurchargePercent / 100));
  const insurance = calculateInsuranceFee(metrics.declaredValueTzs, settings, Boolean(options.applyInsurance));
  const totalFee = Math.max(0, Math.round(baseDeliveryFee + extraPackageFee + fuelSurcharge + insurance.fee));

  return {
    ...quote,
    totalFee,
    packageSummary: metrics,
    insurance: {
      enabled: settings.insuranceEnabled,
      selected: Boolean(options.applyInsurance),
      fee: insurance.fee,
      coverage: insurance.coverage,
      ratePercent: settings.insuranceRatePercent,
    },
    costBreakdown: {
      ...(quote?.costBreakdown || {}),
      baseDeliveryFee,
      extraPackageFee,
      fuelSurcharge,
      insuranceFee: insurance.fee,
      insuranceCoverage: insurance.coverage,
      totalFee,
      settings: {
        volumetricDivisor: settings.volumetricDivisor,
        maxTotalWeightKg: settings.maxTotalWeightKg,
        maxPackageWeightKg: settings.maxPackageWeightKg,
        maxPackageVolumetricKg: settings.maxPackageVolumetricKg,
        extraPackageFeeTzs: settings.extraPackageFeeTzs,
        fuelSurchargePercent: settings.fuelSurchargePercent,
      },
      packageSummary: metrics,
    },
  };
};

const formatDays = (minDays: number, maxDays: number, lang = "sw") => {
  const min = Math.max(0, Number(minDays || 0));
  const max = Math.max(min, Number(maxDays || min));
  const unit = lang === "sw" ? "siku" : "days";
  if (min === 0 && max === 0) return lang === "sw" ? "Mara moja" : "Instant";
  if (min === max) return `${max} ${unit}`;
  return `${min}-${max} ${unit}`;
};

const formatSameZoneDeliveryEta = (lang = "sw") =>
  lang === "sw" ? "Ndani ya saa 2-6 za kazi" : "Within 2-6 business hours";

const isSameDeliveryZone = (product: any, zone: any) => {
  const originZoneId = product?.sellerOriginZoneId || product?.seller_origin_zone_id;
  return Boolean(originZoneId && String(originZoneId) === String(zone?.id));
};

const getEtaDayValue = (eta: string) => {
  const value = String(eta || "").toLowerCase();
  if (value.includes("saa") || value.includes("hour")) return 0;
  const match = value.match(/(\d+)(?:-(\d+))?/);
  return match ? Number(match[2] || match[1]) : 0;
};

export const quoteProductDelivery = (product: any, quantity: number, zone: any, rules: any[], lang = "sw", settingsInput?: Partial<DeliverySettings>) => {
  const settings = mapDeliverySettings(settingsInput || DEFAULT_DELIVERY_SETTINGS);
  const qty = Math.max(1, Number(quantity || 1));
  const normalizedZone = normalizeZone(zone);
  const productId = String(product?.id || "");
  const name = String(product?.name || "Product");
  const deliveryClass = getProductDeliveryClass(product);

  if (product?.requiresDeliveryQuote || product?.requires_delivery_quote || product?.deliveryScope === "custom_quote" || product?.delivery_scope === "custom_quote") {
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
      deliveryClass,
    };
  }

  if (deliveryClass === "digital") {
    return { productId, name, quantity: qty, available: true, fee: 0, eta: formatDays(0, 0, lang), deliveryClass };
  }

  const scope = String(product?.deliveryScope || product?.delivery_scope || "national");
  if (scope === "local_only" && Number(normalizedZone.sortOrder || 0) > 1) {
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
      deliveryClass,
    };
  }
  if (scope === "regional" && Number(normalizedZone.sortOrder || 0) > 2) {
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
      deliveryClass,
    };
  }

  const blockedZones = Array.isArray(product?.blockedDeliveryZoneIds)
    ? product.blockedDeliveryZoneIds.map(String)
    : Array.isArray(product?.blocked_delivery_zone_ids)
      ? product.blocked_delivery_zone_ids.map(String)
      : [];
  if (blockedZones.includes(String(normalizedZone.id))) {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: lang === "sw" ? "Bidhaa hii haifiki eneo hili." : "This product is not deliverable to this zone.",
      deliveryClass,
    };
  }

  const normalizedRules = rules.length > 0 ? rules.map(mapDeliveryRule) : buildDefaultRules([normalizedZone]);
  const billableWeight = getBillableWeightKg(product, settings.volumetricDivisor) * qty;
  const zoneRules = normalizedRules.filter((rule) => String(rule.zoneId) === String(normalizedZone.id));
  const matchingRule: any =
    zoneRules.find((rule) =>
      rule.deliveryClass === deliveryClass &&
      billableWeight >= Number(rule.minWeightKg || 0) &&
      (rule.maxWeightKg === null || rule.maxWeightKg === undefined || billableWeight <= Number(rule.maxWeightKg)),
    ) ||
    zoneRules.find((rule) => rule.deliveryClass === "standard") ||
    normalizedRules.find((rule) => rule.deliveryClass === deliveryClass) ||
    normalizedRules.find((rule) => rule.deliveryClass === "standard");

  if (!matchingRule || matchingRule.isAvailable === false) {
    return {
      productId,
      name,
      quantity: qty,
      available: false,
      fee: 0,
      eta: "",
      reason: matchingRule?.reasonIfUnavailable || (lang === "sw" ? "Delivery haipatikani kwa eneo hili." : "Delivery is unavailable for this zone."),
      deliveryClass,
    };
  }

  const extras =
    (product?.fragile ? Number(matchingRule.fragileFee || 0) : 0) +
    (product?.oversized ? Number(matchingRule.oversizedFee || 0) : 0) +
    ((product?.requiresColdChain || product?.requires_cold_chain) ? Number(matchingRule.coldChainFee || 0) : 0);
  const fee = Math.round(Number(matchingRule.baseFee || 0) + billableWeight * Number(matchingRule.perKgFee || 0) + extras);

  return {
    productId,
    name,
    quantity: qty,
    available: true,
    fee,
    eta: isSameDeliveryZone(product, normalizedZone)
      ? formatSameZoneDeliveryEta(lang)
      : formatDays(matchingRule.minDays, matchingRule.maxDays, lang),
    deliveryClass,
  };
};

export const quoteCartDelivery = (
  cart: any[],
  zone: any,
  rules: any[],
  lang = "sw",
  settingsInput?: Partial<DeliverySettings>,
  options: { applyInsurance?: boolean } = {},
) => {
  const settings = mapDeliverySettings(settingsInput || DEFAULT_DELIVERY_SETTINGS);
  const normalizedZone = normalizeZone(zone || DEFAULT_ZONES[0]);
  const items = cart.map((item) => quoteProductDelivery(item.product || item, item.quantity, normalizedZone, rules, lang, settings));
  const unavailableItems = items.filter((item) => !item.available);
  const totalFee = items.reduce((sum, item) => sum + (item.available ? Number(item.fee || 0) : 0), 0);
  const maxEta = items
    .filter((item) => item.available)
    .map((item) => getEtaDayValue(item.eta))
    .reduce((max, value) => Math.max(max, value), 0);
  const firstHourlyEta = items.find((item) => item.available && getEtaDayValue(item.eta) === 0 && /saa|hour/i.test(item.eta))?.eta;

  return applyCartDeliveryAdjustments({
    zoneId: normalizedZone.id,
    zoneName: lang === "sw" ? normalizedZone.labelSw : normalizedZone.labelEn,
    totalFee,
    eta: maxEta > 0 ? `${maxEta} ${lang === "sw" ? "siku" : "days"}` : firstHourlyEta || formatDays(normalizedZone.minDays, normalizedZone.maxDays, lang),
    available: unavailableItems.length === 0,
    items,
    unavailableItems,
    quoteMode: "zone_fallback",
    routeProvider: "zone_rules",
  }, cart, settings, options);
};
