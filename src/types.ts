export interface Category {
  name: string;
  families: string[];
  image?: string;
}

export interface Niche {
  id?: string;
  name: string;
  icon: string;
  categories: Category[];
}

export interface ProductFeature {
  name: string;
  description: string;
}

export interface PaymentOption {
  id: string;
  name: string;
  details: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  labelSw?: string;
  labelEn?: string;
  price: number;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  sortOrder?: number;
  sellerId?: string | null;
}

export interface DeliveryRule {
  id?: string;
  zoneId: string;
  deliveryClass: string;
  minWeightKg: number;
  maxWeightKg?: number | null;
  baseFee: number;
  perKgFee: number;
  fragileFee?: number;
  oversizedFee?: number;
  coldChainFee?: number;
  minDays: number;
  maxDays: number;
  isAvailable: boolean;
  reasonIfUnavailable?: string;
  sortOrder?: number;
}

export interface DeliverySettings {
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
}

export interface DeliveryQuoteItem {
  productId: string;
  name: string;
  quantity: number;
  available: boolean;
  fee: number;
  eta: string;
  reason?: string;
  deliveryClass?: string;
  quoteMode?: "route_exact" | "route_estimate" | "zone_fallback" | "route_required";
  routeProvider?: "google_routes" | "distance_estimate" | "zone_rules";
  route?: {
    distanceKm: number;
    durationMinutes: number;
    provider: string;
    cached?: boolean;
  };
}

export interface DeliveryQuote {
  zoneId: string;
  zoneName: string;
  totalFee: number;
  eta: string;
  available: boolean;
  items: DeliveryQuoteItem[];
  unavailableItems: DeliveryQuoteItem[];
  quoteMode?: "route_exact" | "route_estimate" | "zone_fallback" | "route_required";
  routeProvider?: "google_routes" | "distance_estimate" | "zone_rules";
  reason?: string;
  shippingPlan?: {
    available: boolean;
    recommended?: {
      id: string;
      label: string;
      pickupRequired: boolean;
    } | null;
    shippingOptions?: Array<{
      id: string;
      label: string;
      pickupRequired: boolean;
      maxDistanceKm: number;
      maxWeightKg: number;
      maxVolumetricKg: number;
    }>;
    pickupHub?: {
      id: string;
      name: string;
      city: string;
      lat: number;
      lng: number;
      distanceKm: number;
      googleMapsUri: string;
    } | null;
    ruralOrLongDistance?: boolean;
    message?: string;
  };
  selectedShippingType?: {
    id: string;
    label: string;
    pickupRequired: boolean;
  } | null;
  packageSummary?: {
    totalItems: number;
    totalActualWeightKg: number;
    totalVolumetricWeightKg: number;
    chargeableWeightKg: number;
    packageCount: number;
    declaredValueTzs: number;
    packagesByActualWeight: number;
    packagesByVolumetricWeight: number;
  };
  insurance?: {
    enabled: boolean;
    selected: boolean;
    fee: number;
    coverage: number;
    ratePercent: number;
  };
  costBreakdown?: Record<string, any>;
}

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface GooglePlaceSuggestion {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

export interface GooglePlaceDetails extends GeoCoordinate {
  placeId: string;
  name?: string;
  formattedAddress: string;
  googleMapsUri?: string;
  addressComponents?: any[];
}

export interface InvoiceSettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  mobilePaymentDetails?: string; // Legacy
  bankPaymentDetails?: string; // Legacy
  paymentOptions: PaymentOption[];
  terms: string;
  businessLogo?: string;
}

export interface SellerProfile {
  id: string;
  name: string;
  storeName?: string;
  description: string;
  avatar?: string;
  banner?: string;
  isPro?: boolean;
  proUntil?: number;
  email?: string; // Links seller to logged-in user email
  activePlanId?: string; // Current subscription plan ID
  subscriptionPaidAt?: number; // Timestamp of purchase
  status?: "active" | "frozen";
  deleteRequested?: boolean;
  invoiceCompanyName?: string;
  invoiceAddress?: string;
  invoicePhone?: string;
  invoiceEmail?: string;
  invoiceTerms?: string;
  businessLogo?: string;
  tin?: string;
  password?: string;
  isApproved?: boolean;
  mustChangePassword?: boolean;
  fullName?: string;
  phone?: string;
  location?: string;
  pickupAddress?: string;
  pickupPlaceId?: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupZoneId?: string;
  isVerifiedSeller?: boolean;
  niche?: string;
  businessType?: string;
  estimatedOrders?: string;
}


export interface SubscriptionPlan {
  id: string;
  name: string;
  nameSw?: string;
  price: number;
  days: number;
  description: string;
  descriptionSw?: string;
  active: boolean;
}

export interface Review {
  id: string;
  productId?: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number;
}

export interface WholesaleTier {
  minQty: number;
  maxQty?: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  nameSw?: string;
  niche: string;
  category: string;
  family?: string;
  price: number;
  oldPrice?: number;
  stock: number;
  images: string[];
  tags: string[];
  description: string;
  createdAt: number;
  features?: ProductFeature[];
  visible?: boolean;
  reviews?: Review[];
  sellerId?: string;
  sku?: string;
  warranty?: string;
  taxCode?: number;
  arrangeTier?: string;
  vibe?: string;
  presentationStyle?: string;
  wholesaleTiers?: WholesaleTier[];
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  deliveryClass?: string;
  fragile?: boolean;
  oversized?: boolean;
  requiresColdChain?: boolean;
  hazardous?: boolean;
  digitalProduct?: boolean;
  requiresDeliveryQuote?: boolean;
  deliveryScope?: "local_only" | "regional" | "national" | "custom_quote";
  deliveryPolicySource?: "auto" | "manual";
  deliveryHandlingNotes?: string;
  blockedDeliveryZoneIds?: string[];
  sellerOriginZoneId?: string;
  sellerPickupAddress?: string;
  sellerPickupPlaceId?: string;
  sellerPickupLat?: number;
  sellerPickupLng?: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  images?: string[];
  link?: string;
  visible: boolean;
  createdAt: number;
  cardBgColor?: string;
  cardBgGradient?: string;
  cardTextColor?: string;
  cardButtonBg?: string;
  cardButtonText?: string;
  cardOverlayOpacity?: number;
  badgeText?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId?: string;
  customer_id?: string;
  customerDetails: { name: string; phone: string; address: string; tin?: string };
  customer_tin?: string;
  paymentMethod?: string;
  paymentMethodName?: string;
  paymentReference?: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus?: string;
  date: number;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  deliveryFee?: number;
  deliveryEta?: string;
}

export interface OrderStatusLog {
  id: string;
  orderId: string;
  previousStatus: string | null;
  newStatus: string;
  staffName: string;
  staffEmail: string;
  notificationStatus?: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  registeredAt: number;
  status?: "active" | "frozen";
  deleteRequested?: boolean;
  tin?: string;
  preferredLanguage?: string;
  preferred_language?: string;
}

export interface Message {
  id: string;
  name: string;
  phone: string;
  message: string;
  date: number;
  customerId?: string;
  adminReply?: string;
  isRead?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  expiresAt: string;
  active: boolean;
  isUsed?: boolean;
  applicableProduct?: string;
  applicableCategory?: string;
  targetCustomer?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StockNotification {
  id: string;
  productId: string;
  email: string;
  phone: string;
  notified: boolean;
  createdAt: number;
}

export interface MarketplaceAd {
  id: string;
  businessName: string;
  contactEmail: string;
  title: string;
  description: string;
  image: string;
  link: string;
  bidAmount: number; // Cost-Per-Click CPC
  budgetLimit: number; // Max total budget
  totalSpent: number; // Total spent so far
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  visible: boolean;
  status: "pending" | "active" | "paused" | "completed" | "scheduled";
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  createdAt: number;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  titleSw?: string;
  description: string;
  descriptionSw?: string;
  image: string;
  link: string; // SKU or web link or product ID
  startDate: string; // DateTime ISO / YYYY-MM-DDTHH:mm
  endDate: string; // Countdown target ISO / YYYY-MM-DDTHH:mm
  visible: boolean;
  bgColor?: string;
  textColor?: string;
  buttonText?: string;
  buttonTextSw?: string;
  createdAt: number;
}

