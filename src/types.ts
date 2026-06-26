export interface Category {
  name: string;
  families: string[];
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
}

export interface OrderStatusLog {
  id: string;
  orderId: string;
  previousStatus: string | null;
  newStatus: string;
  staffName: string;
  staffEmail: string;
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

