export type DeliverySettings = {
  basePriceTzs: number;
  costPerKmTzs: number;
  costPerKgTzs: number;
  volumetricDivisor: number;
  maxDistanceKm: number;
  maxTotalWeightKg: number;
  maxPackageWeightKg: number;
  maxPackageVolumetricKg: number;
  extraPackageFeeTzs: number;
  extraPackageDistanceMultiplier: number;
  bulkyThresholdKg: number;
  bulkySurchargeTzs: number;
  fuelSurchargePercent: number;
  insuranceEnabled: boolean;
  insuranceRatePercent: number;
  insuranceMinFeeTzs: number;
  insuranceMaxCoverageTzs: number;
  fallbackEnabled: boolean;
  routeQuoteRequired: boolean;
  doorstepMaxDistanceKm: number;
  ruralPickupThresholdKm: number;
  busCargoMaxWeightKg: number;
  busCargoMaxVolumetricKg: number;
  cargoMaxWeightKg: number;
  cargoMaxVolumetricKg: number;
};

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  basePriceTzs: 1800,
  costPerKmTzs: 900,
  costPerKgTzs: 350,
  volumetricDivisor: 5000,
  maxDistanceKm: 1200,
  maxTotalWeightKg: 120,
  maxPackageWeightKg: 25,
  maxPackageVolumetricKg: 30,
  extraPackageFeeTzs: 1800,
  extraPackageDistanceMultiplier: 0.18,
  bulkyThresholdKg: 20,
  bulkySurchargeTzs: 3500,
  fuelSurchargePercent: 0,
  insuranceEnabled: true,
  insuranceRatePercent: 1.25,
  insuranceMinFeeTzs: 500,
  insuranceMaxCoverageTzs: 1000000,
  fallbackEnabled: false,
  routeQuoteRequired: true,
  doorstepMaxDistanceKm: 65,
  ruralPickupThresholdKm: 85,
  busCargoMaxWeightKg: 40,
  busCargoMaxVolumetricKg: 55,
  cargoMaxWeightKg: 250,
  cargoMaxVolumetricKg: 320,
};

const positiveNumber = (value: any, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const mapDeliverySettings = (row: any = {}): DeliverySettings => ({
  basePriceTzs: positiveNumber(row.base_price_tzs ?? row.basePriceTzs, DEFAULT_DELIVERY_SETTINGS.basePriceTzs),
  costPerKmTzs: positiveNumber(row.cost_per_km_tzs ?? row.costPerKmTzs, DEFAULT_DELIVERY_SETTINGS.costPerKmTzs),
  costPerKgTzs: positiveNumber(row.cost_per_kg_tzs ?? row.costPerKgTzs, DEFAULT_DELIVERY_SETTINGS.costPerKgTzs),
  volumetricDivisor: Math.max(1, positiveNumber(row.volumetric_divisor ?? row.volumetricDivisor, DEFAULT_DELIVERY_SETTINGS.volumetricDivisor)),
  maxDistanceKm: positiveNumber(row.max_distance_km ?? row.maxDistanceKm, DEFAULT_DELIVERY_SETTINGS.maxDistanceKm),
  maxTotalWeightKg: positiveNumber(row.max_total_weight_kg ?? row.maxTotalWeightKg, DEFAULT_DELIVERY_SETTINGS.maxTotalWeightKg),
  maxPackageWeightKg: Math.max(1, positiveNumber(row.max_package_weight_kg ?? row.maxPackageWeightKg, DEFAULT_DELIVERY_SETTINGS.maxPackageWeightKg)),
  maxPackageVolumetricKg: Math.max(1, positiveNumber(row.max_package_volumetric_kg ?? row.maxPackageVolumetricKg, DEFAULT_DELIVERY_SETTINGS.maxPackageVolumetricKg)),
  extraPackageFeeTzs: positiveNumber(row.extra_package_fee_tzs ?? row.extraPackageFeeTzs, DEFAULT_DELIVERY_SETTINGS.extraPackageFeeTzs),
  extraPackageDistanceMultiplier: positiveNumber(row.extra_package_distance_multiplier ?? row.extraPackageDistanceMultiplier, DEFAULT_DELIVERY_SETTINGS.extraPackageDistanceMultiplier),
  bulkyThresholdKg: positiveNumber(row.bulky_threshold_kg ?? row.bulkyThresholdKg, DEFAULT_DELIVERY_SETTINGS.bulkyThresholdKg),
  bulkySurchargeTzs: positiveNumber(row.bulky_surcharge_tzs ?? row.bulkySurchargeTzs, DEFAULT_DELIVERY_SETTINGS.bulkySurchargeTzs),
  fuelSurchargePercent: positiveNumber(row.fuel_surcharge_percent ?? row.fuelSurchargePercent, DEFAULT_DELIVERY_SETTINGS.fuelSurchargePercent),
  insuranceEnabled: row.insurance_enabled ?? row.insuranceEnabled ?? DEFAULT_DELIVERY_SETTINGS.insuranceEnabled,
  insuranceRatePercent: positiveNumber(row.insurance_rate_percent ?? row.insuranceRatePercent, DEFAULT_DELIVERY_SETTINGS.insuranceRatePercent),
  insuranceMinFeeTzs: positiveNumber(row.insurance_min_fee_tzs ?? row.insuranceMinFeeTzs, DEFAULT_DELIVERY_SETTINGS.insuranceMinFeeTzs),
  insuranceMaxCoverageTzs: positiveNumber(row.insurance_max_coverage_tzs ?? row.insuranceMaxCoverageTzs, DEFAULT_DELIVERY_SETTINGS.insuranceMaxCoverageTzs),
  fallbackEnabled: row.fallback_enabled ?? row.fallbackEnabled ?? DEFAULT_DELIVERY_SETTINGS.fallbackEnabled,
  routeQuoteRequired: row.route_quote_required ?? row.routeQuoteRequired ?? DEFAULT_DELIVERY_SETTINGS.routeQuoteRequired,
  doorstepMaxDistanceKm: positiveNumber(row.doorstep_max_distance_km ?? row.doorstepMaxDistanceKm, DEFAULT_DELIVERY_SETTINGS.doorstepMaxDistanceKm),
  ruralPickupThresholdKm: positiveNumber(row.rural_pickup_threshold_km ?? row.ruralPickupThresholdKm, DEFAULT_DELIVERY_SETTINGS.ruralPickupThresholdKm),
  busCargoMaxWeightKg: positiveNumber(row.bus_cargo_max_weight_kg ?? row.busCargoMaxWeightKg, DEFAULT_DELIVERY_SETTINGS.busCargoMaxWeightKg),
  busCargoMaxVolumetricKg: positiveNumber(row.bus_cargo_max_volumetric_kg ?? row.busCargoMaxVolumetricKg, DEFAULT_DELIVERY_SETTINGS.busCargoMaxVolumetricKg),
  cargoMaxWeightKg: positiveNumber(row.cargo_max_weight_kg ?? row.cargoMaxWeightKg, DEFAULT_DELIVERY_SETTINGS.cargoMaxWeightKg),
  cargoMaxVolumetricKg: positiveNumber(row.cargo_max_volumetric_kg ?? row.cargoMaxVolumetricKg, DEFAULT_DELIVERY_SETTINGS.cargoMaxVolumetricKg),
});

export const toDeliverySettingsRow = (settings: Partial<DeliverySettings>) => {
  const merged = mapDeliverySettings(settings);
  return {
    id: 1,
    base_price_tzs: merged.basePriceTzs,
    cost_per_km_tzs: merged.costPerKmTzs,
    cost_per_kg_tzs: merged.costPerKgTzs,
    volumetric_divisor: merged.volumetricDivisor,
    max_distance_km: merged.maxDistanceKm,
    max_total_weight_kg: merged.maxTotalWeightKg,
    max_package_weight_kg: merged.maxPackageWeightKg,
    max_package_volumetric_kg: merged.maxPackageVolumetricKg,
    extra_package_fee_tzs: merged.extraPackageFeeTzs,
    extra_package_distance_multiplier: merged.extraPackageDistanceMultiplier,
    bulky_threshold_kg: merged.bulkyThresholdKg,
    bulky_surcharge_tzs: merged.bulkySurchargeTzs,
    fuel_surcharge_percent: merged.fuelSurchargePercent,
    insurance_enabled: merged.insuranceEnabled,
    insurance_rate_percent: merged.insuranceRatePercent,
    insurance_min_fee_tzs: merged.insuranceMinFeeTzs,
    insurance_max_coverage_tzs: merged.insuranceMaxCoverageTzs,
    fallback_enabled: merged.fallbackEnabled,
    route_quote_required: merged.routeQuoteRequired,
    doorstep_max_distance_km: merged.doorstepMaxDistanceKm,
    rural_pickup_threshold_km: merged.ruralPickupThresholdKm,
    bus_cargo_max_weight_kg: merged.busCargoMaxWeightKg,
    bus_cargo_max_volumetric_kg: merged.busCargoMaxVolumetricKg,
    cargo_max_weight_kg: merged.cargoMaxWeightKg,
    cargo_max_volumetric_kg: merged.cargoMaxVolumetricKg,
    updated_at: new Date().toISOString(),
  };
};

export const getDeliverySettings = async (client: any): Promise<DeliverySettings> => {
  try {
    const { data, error } = await client
      .from("delivery_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT_DELIVERY_SETTINGS;
    return mapDeliverySettings(data);
  } catch {
    return DEFAULT_DELIVERY_SETTINGS;
  }
};
