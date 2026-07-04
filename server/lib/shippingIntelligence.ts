import { DeliverySettings } from "./deliverySettings.js";

type Coordinate = { lat: number; lng: number };

type PackageSummary = {
  chargeableWeightKg: number;
  totalVolumetricWeightKg: number;
  packageCount: number;
};

type ShippingPlanInput = {
  destination: Coordinate;
  routeSummary: {
    maxDistanceKm: number;
    maxDurationMinutes: number;
    provider: string;
  };
  packageSummary: PackageSummary;
  settings: DeliverySettings;
  lang?: string;
};

const PICKUP_HUBS = [
  { id: "dar-ubungo", name: "Dar es Salaam - Ubungo Cargo", city: "Dar es Salaam", lat: -6.7924, lng: 39.2083 },
  { id: "dar-kariakoo", name: "Dar es Salaam - Kariakoo Pickup", city: "Dar es Salaam", lat: -6.8235, lng: 39.2695 },
  { id: "mwanza-nyamagana", name: "Mwanza - Nyamagana Cargo", city: "Mwanza", lat: -2.5164, lng: 32.9175 },
  { id: "arusha-bus", name: "Arusha - Central Bus Cargo", city: "Arusha", lat: -3.3869, lng: 36.6830 },
  { id: "dodoma-cbd", name: "Dodoma - City Pickup", city: "Dodoma", lat: -6.1630, lng: 35.7516 },
  { id: "mbeya-cbd", name: "Mbeya - City Cargo", city: "Mbeya", lat: -8.9094, lng: 33.4608 },
  { id: "morogoro-cbd", name: "Morogoro - Msamvu Cargo", city: "Morogoro", lat: -6.8229, lng: 37.6618 },
];

const haversineKm = (a: Coordinate, b: Coordinate) => {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const nearestPickupHub = (destination: Coordinate) =>
  PICKUP_HUBS
    .map((hub) => ({
      ...hub,
      distanceKm: Number(haversineKm(destination, hub).toFixed(1)),
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${hub.lat},${hub.lng}`,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];

const buildShippingOptions = (settings: DeliverySettings) => [
  {
    id: "doorstep",
    labelSw: "Delivery mpaka mlangoni",
    labelEn: "Doorstep delivery",
    maxDistanceKm: settings.doorstepMaxDistanceKm,
    maxWeightKg: settings.maxPackageWeightKg,
    maxVolumetricKg: settings.maxPackageVolumetricKg,
    pickupRequired: false,
  },
  {
    id: "bus_cargo",
    labelSw: "Basi / Cargo Pickup",
    labelEn: "Bus / Cargo pickup",
    maxDistanceKm: settings.maxDistanceKm,
    maxWeightKg: settings.busCargoMaxWeightKg,
    maxVolumetricKg: settings.busCargoMaxVolumetricKg,
    pickupRequired: true,
  },
  {
    id: "cargo",
    labelSw: "Cargo maalum",
    labelEn: "Dedicated cargo",
    maxDistanceKm: settings.maxDistanceKm,
    maxWeightKg: settings.cargoMaxWeightKg,
    maxVolumetricKg: settings.cargoMaxVolumetricKg,
    pickupRequired: true,
  },
];

export const resolveShippingPlan = ({
  destination,
  routeSummary,
  packageSummary,
  settings,
  lang = "sw",
}: ShippingPlanInput) => {
  const options = buildShippingOptions(settings);
  const isRuralOrLongDistance = routeSummary.maxDistanceKm > settings.ruralPickupThresholdKm;
  const fits = (option: any) =>
    routeSummary.maxDistanceKm <= option.maxDistanceKm &&
    packageSummary.chargeableWeightKg <= option.maxWeightKg &&
    packageSummary.totalVolumetricWeightKg <= option.maxVolumetricKg;

  const eligibleOptions = options.filter(fits).map((option) => ({
    id: option.id,
    label: lang === "sw" ? option.labelSw : option.labelEn,
    pickupRequired: option.pickupRequired || isRuralOrLongDistance,
    maxDistanceKm: option.maxDistanceKm,
    maxWeightKg: option.maxWeightKg,
    maxVolumetricKg: option.maxVolumetricKg,
  }));

  const pickupHub = isRuralOrLongDistance ? nearestPickupHub(destination) : null;
  const recommended =
    eligibleOptions.find((option) => !option.pickupRequired && !isRuralOrLongDistance) ||
    eligibleOptions.find((option) => option.id === "bus_cargo") ||
    eligibleOptions.find((option) => option.id === "cargo") ||
    null;

  if (!recommended) {
    return {
      available: false,
      reason: lang === "sw"
        ? "Mzigo huu unazidi uwezo wa shipping types zilizopo. Inahitaji quote maalum ya cargo."
        : "This shipment exceeds configured shipping type limits and requires a custom cargo quote.",
      shippingOptions: eligibleOptions,
      pickupHub,
      ruralOrLongDistance: isRuralOrLongDistance,
    };
  }

  return {
    available: true,
    recommended,
    shippingOptions: eligibleOptions,
    pickupHub,
    ruralOrLongDistance: isRuralOrLongDistance,
    message: isRuralOrLongDistance && pickupHub
      ? lang === "sw"
        ? `Eneo hili linaonekana kuwa nje ya doorstep delivery. Tunapendekeza pickup ya karibu: ${pickupHub.name}.`
        : `This area is outside safe doorstep delivery. Recommended nearest pickup: ${pickupHub.name}.`
      : lang === "sw"
        ? "Shipping type imechaguliwa kiotomatiki kulingana na route na ukubwa wa mzigo."
        : "Shipping type selected automatically from route and package size.",
  };
};
