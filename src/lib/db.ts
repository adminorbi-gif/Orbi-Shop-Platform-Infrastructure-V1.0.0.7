import { supabase } from './supabase';
import { Product, Promotion, Order, Customer, Message, Niche, SellerProfile, SubscriptionPlan, MarketplaceAd, Review, PromotionalBanner, OrderStatusLog } from '../types';

// Helper for calling modular backend API endpoints with standard response wrappers
const apiFetch = async (url: string, options: RequestInit = {}) => {
  let token = "";
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
    }
  } catch (e) {}

  const finalOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };
  try {
    const res = await fetch(url, finalOptions);
    if (!res.ok) {
      const textErr = await res.text();
      let errorMessage = textErr || `Server returned error status ${res.status}`;
      try {
        const jsonErr = JSON.parse(textErr);
        if (jsonErr.error) errorMessage = jsonErr.error;
        else if (jsonErr.message) errorMessage = jsonErr.message;
      } catch (e) {}
      throw new Error(errorMessage);
    }
    
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON response, but received: ${contentType.substring(0, 50)}`);
    }

    const json = await res.json();
    if (json && json.success === false) {
      throw new Error(json.error || 'API execution returned failed status');
    }
    return json;
  } catch (error: any) {
    console.warn(`[apiFetch] API Error on ${url}:`, error.message || error);
    throw error;
  }
};

export const db = {
  // Newsletters
  subscribeNewsletter: async (email: string) => {
    await apiFetch('/api/v1/newsletters/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  getNewsletters: async (): Promise<{id:string, email:string, created_at:string}[]> => {
    const res = await apiFetch('/api/v1/newsletters');
    return res.data || [];
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const res = await apiFetch('/api/v1/products');
    return res.data || [];
  },
  saveProduct: async (product: Partial<Product> & { id?: string }) => {
    const res = await apiFetch('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return res.id as string;
  },
  deleteProduct: async (id: string) => {
    await apiFetch(`/api/v1/products/${id}`, {
      method: 'DELETE'
    });
  },
  deleteProductsByNiche: async (niche: string) => {
    await apiFetch(`/api/v1/products/niche/${encodeURIComponent(niche)}`, {
      method: 'DELETE'
    });
  },
  renameProductsNiche: async (oldNiche: string, newNiche: string) => {
    await apiFetch(`/api/v1/products/niche/rename`, {
      method: 'POST',
      body: JSON.stringify({ oldNiche, newNiche })
    });
  },

  // Promotions
  getPromotions: async (): Promise<Promotion[]> => {
    try {
      const res = await apiFetch('/api/v1/campaigns');
      return res.data || [];
    } catch (err) {
      console.warn("Failed to retrieve promotions, using empty fallback.", err);
      return [];
    }
  },
  savePromo: async (promo: any) => {
    await apiFetch('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(promo)
    });
  },
  deletePromo: async (id: string) => {
    await apiFetch(`/api/v1/campaigns/${id}`, {
      method: 'DELETE'
    });
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const res = await apiFetch('/api/v1/orders');
    return res.data || [];
  },
  getOrder: async (id: string): Promise<Order | null> => {
    const res = await apiFetch(`/api/v1/orders/${id}`);
    if (res.success) return res.data;
    return null;
  },
  saveOrder: async (order: any) => {
    const res = await apiFetch('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    if (!res.success) throw new Error(res.error || 'Failed to save order');
    return res;
  },
  getOrderLogs: async (orderId: string): Promise<OrderStatusLog[]> => {
    const res = await apiFetch(`/api/v1/orders/${orderId}/logs`);
    return res.data || [];
  },
  deleteOrder: async (id: string) => {
    const res = await apiFetch(`/api/v1/orders/${id}`, {
      method: 'DELETE'
    });
    if (!res.success) throw new Error(res.error || 'Failed to delete order');
    return res;
  },

  // Messages
  getMessages: async (): Promise<Message[]> => {
    const res = await apiFetch('/api/v1/messages');
    return res.data || [];
  },
  saveMessage: async (msg: Message) => {
    await apiFetch('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify(msg)
    });
  },
  deleteMessage: async (id: string) => {
    const res = await apiFetch(`/api/v1/messages/${id}`, {
      method: 'DELETE'
    });
    if (!res.success) throw new Error(res.error || 'Failed to delete message');
    return res;
  },

  // Templates
  getMessage: async (templateName: string, language: string): Promise<any> => {
    const res = await apiFetch(`/api/talk/message?templateName=${encodeURIComponent(templateName)}&language=${encodeURIComponent(language)}`);
    return res.data || null;
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const res = await apiFetch('/api/v1/customers');
    return res.data || [];
  },
  deleteCustomer: async (id: string) => {
    await apiFetch(`/api/v1/customers/${id}`, {
      method: 'DELETE'
    });
  },
  updateCustomer: async (id: string, updates: any) => {
    await apiFetch(`/api/v1/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  resetCustomerPassword: async (id: string, password: string) => {
    await apiFetch(`/api/v1/customers/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  },
  // Password recovery
  initiateRecovery: async (email: string) => {
    return await apiFetch('/api/auth/initiate', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  verifyRecovery: async (customerId: string, phone: string) => {
    return await apiFetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ customerId, phone })
    });
  },
  verifyOtp: async (customerId: string, otp: string) => {
    return await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ customerId, otp })
    });
  },
  resetPassword: async (customerId: string, token: string, password: string) => {
    return await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ customerId, token, password })
    });
  },

  // Invoice Settings
  getInvoiceSettings: async () => {
    const savedPointsRate = localStorage.getItem("orbi_points_rate");
    const savedPointsWorth = localStorage.getItem("orbi_points_worth");
    const savedPointsRequiredPerTzsDiscount = localStorage.getItem("orbi_points_req_tzs_disc");
    const savedVoucher5k = localStorage.getItem("orbi_v_5k_cost");
    const savedVoucher15vip = localStorage.getItem("orbi_v_15_vip_cost");
    const savedVoucherFreeShip = localStorage.getItem("orbi_v_free_ship_cost");
    const savedAppBarBg = localStorage.getItem("orbi_app_bar_bg") || "";
    const savedAppBarBg2 = localStorage.getItem("orbi_app_bar_bg_2") || "";
    const savedAppBarBg3 = localStorage.getItem("orbi_app_bar_bg_3") || "";
    const savedAppBarColor = localStorage.getItem("orbi_app_bar_color") || "";

    try {
      const res = await apiFetch('/api/v1/settings/invoice');
      const data = res.data;
      return {
        ...data,
        pointsRate: data.pointsRate !== undefined ? data.pointsRate : (savedPointsRate ? parseInt(savedPointsRate, 10) : 1),
        pointsWorth: data.pointsWorth !== undefined ? data.pointsWorth : (savedPointsWorth ? parseInt(savedPointsWorth, 10) : 10),
        pointsRequiredPerTzsDiscount: data.pointsRequiredPerTzsDiscount !== undefined ? data.pointsRequiredPerTzsDiscount : (savedPointsRequiredPerTzsDiscount ? parseInt(savedPointsRequiredPerTzsDiscount, 10) : 10),
        v_5k_cost: data.v_5k_cost !== undefined ? data.v_5k_cost : (savedVoucher5k ? parseInt(savedVoucher5k, 10) : 100),
        v_15_vip_cost: data.v_15_vip_cost !== undefined ? data.v_15_vip_cost : (savedVoucher15vip ? parseInt(savedVoucher15vip, 10) : 250),
        v_free_ship_cost: data.v_free_ship_cost !== undefined ? data.v_free_ship_cost : (savedVoucherFreeShip ? parseInt(savedVoucherFreeShip, 10) : 50),
        appBarBackground: data.appBarBackground !== undefined ? data.appBarBackground : savedAppBarBg,
        appBarBackground2: data.appBarBackground2 !== undefined ? data.appBarBackground2 : savedAppBarBg2,
        appBarBackground3: data.appBarBackground3 !== undefined ? data.appBarBackground3 : savedAppBarBg3,
        appBarColor: data.appBarColor !== undefined ? data.appBarColor : savedAppBarColor,
        businessLogo: data.businessLogo !== undefined ? data.businessLogo : ""
      };
    } catch {
      return {
        companyName: "Orbi Shop",
        address: "",
        phone: "+255764258114",
        email: "shop@orbifinancial.com",
        paymentOptions: [],
        terms: "",
        pointsRate: savedPointsRate ? parseInt(savedPointsRate, 10) : 1,
        pointsWorth: savedPointsWorth ? parseInt(savedPointsWorth, 10) : 10,
        pointsRequiredPerTzsDiscount: savedPointsRequiredPerTzsDiscount ? parseInt(savedPointsRequiredPerTzsDiscount, 10) : 10,
        v_5k_cost: savedVoucher5k ? parseInt(savedVoucher5k, 10) : 100,
        v_15_vip_cost: savedVoucher15vip ? parseInt(savedVoucher15vip, 10) : 250,
        v_free_ship_cost: savedVoucherFreeShip ? parseInt(savedVoucherFreeShip, 10) : 50,
        appBarBackground: savedAppBarBg,
        appBarBackground2: savedAppBarBg2,
        appBarBackground3: savedAppBarBg3,
        appBarColor: savedAppBarColor,
        businessLogo: ""
      };
    }
  },
  saveInvoiceSettings: async (settings: any) => {
    // Save points settings & voucher costs to localStorage (fallback until refreshed)
    if (settings.appBarBackground !== undefined) localStorage.setItem("orbi_app_bar_bg", settings.appBarBackground);
    if (settings.appBarBackground2 !== undefined) localStorage.setItem("orbi_app_bar_bg_2", settings.appBarBackground2);
    if (settings.appBarBackground3 !== undefined) localStorage.setItem("orbi_app_bar_bg_3", settings.appBarBackground3);
    if (settings.appBarColor !== undefined) localStorage.setItem("orbi_app_bar_color", settings.appBarColor);
    if (settings.pointsRate !== undefined) localStorage.setItem("orbi_points_rate", settings.pointsRate.toString());
    if (settings.pointsWorth !== undefined) localStorage.setItem("orbi_points_worth", settings.pointsWorth.toString());
    if (settings.pointsRequiredPerTzsDiscount !== undefined) localStorage.setItem("orbi_points_req_tzs_disc", settings.pointsRequiredPerTzsDiscount.toString());
    if (settings.v_5k_cost !== undefined) localStorage.setItem("orbi_v_5k_cost", settings.v_5k_cost.toString());
    if (settings.v_15_vip_cost !== undefined) localStorage.setItem("orbi_v_15_vip_cost", settings.v_15_vip_cost.toString());
    if (settings.v_free_ship_cost !== undefined) localStorage.setItem("orbi_v_free_ship_cost", settings.v_free_ship_cost.toString());

    await apiFetch('/api/v1/settings/invoice', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  // Niches
  getNiches: async (): Promise<Niche[]> => {
    const res = await apiFetch('/api/v1/settings/niches');
    return res.data || [];
  },
  saveNiches: async (niches: Niche[]) => {
    await apiFetch('/api/v1/settings/niches', {
      method: 'POST',
      body: JSON.stringify(niches)
    });
  },
  getNicheSuggestions: async (): Promise<any> => {
    return await apiFetch('/api/v1/settings/niches/suggest', {
      method: 'POST'
    });
  },
  applyNicheSuggestions: async (suggestions: any[]): Promise<any> => {
    return await apiFetch('/api/v1/settings/niches/apply-suggestions', {
      method: 'POST',
      body: JSON.stringify({ suggestions })
    });
  },

  // Staff roles on platform
  getStaff: async (): Promise<any[]> => {
    const res = await apiFetch('/api/v1/settings/staff');
    return res.data || [];
  },
  saveStaff: async (staffList: any[]) => {
    await apiFetch('/api/v1/settings/staff', {
      method: 'POST',
      body: JSON.stringify(staffList)
    });
  },

  // Sellers registration profiles
  getSellers: async (): Promise<any[]> => {
    const res = await apiFetch('/api/v1/settings/sellers');
    return res.data || [];
  },
  saveSellers: async (sellers: any[]) => {
    await apiFetch('/api/v1/settings/sellers', {
      method: 'POST',
      body: JSON.stringify(sellers)
    });
  },
  updateSellerProfile: async (id: string, updates: any) => {
    await apiFetch(`/api/v1/settings/sellers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Coupons
  getCoupons: async () => {
    try {
      const res = await apiFetch('/api/v1/campaigns/coupons');
      return res.data || [];
    } catch (err) {
      console.warn("Failed to retrieve coupons, using empty fallback.", err);
      return [];
    }
  },
  saveCoupon: async (coupon: any) => {
    await apiFetch('/api/v1/campaigns/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon)
    });
  },
  markCouponUsed: async (code: string) => {
    await apiFetch('/api/v1/campaigns/coupons/use', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },
  deleteCoupon: async (id: string) => {
    await apiFetch(`/api/v1/campaigns/coupons/${id}`, {
      method: 'DELETE'
    });
  },

  // Stock notifications alerts queue
  getStockNotifications: async () => {
    const res = await apiFetch('/api/v1/stock-notifications');
    return res.data || [];
  },
  addStockNotification: async (notification: { productId: string, email: string, phone: string }) => {
    await apiFetch('/api/v1/stock-notifications', {
      method: 'POST',
      body: JSON.stringify({
        productId: notification.productId,
        phoneNumber: notification.phone
      })
    });
  },
  markStockNotificationAsNotified: async (id: string) => {
    await apiFetch(`/api/v1/stock-notifications/${id}/notified`, {
      method: 'POST'
    });
  },

  // Payout logs
  getPayouts: async () => {
    const res = await apiFetch('/api/v1/settings/payouts');
    return res.data || [];
  },
  savePayout: async (payout: any) => {
    await apiFetch('/api/v1/settings/payouts', {
      method: 'POST',
      body: JSON.stringify(payout)
    });
  },

  // Subscription plan rates
  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiFetch('/api/v1/settings/subscription-plans');
    return res.data || [];
  },
  saveSubscriptionPlans: async (plans: SubscriptionPlan[]) => {
    await apiFetch('/api/v1/settings/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(plans)
    });
  },

  // Dynamic board Ads
  getAds: async (): Promise<MarketplaceAd[]> => {
    try {
      const res = await apiFetch('/api/v1/campaigns/spotlights');
      return res.data || [];
    } catch (err) {
      console.warn("Failed to retrieve spotlights, using empty fallback.", err);
      return [];
    }
  },
  saveAds: async (ads: MarketplaceAd[]) => {
    await apiFetch('/api/v1/campaigns/spotlights', {
      method: 'POST',
      body: JSON.stringify(ads)
    });
  },

  // Autopilot configurations details
  getAiPilotSettings: async (): Promise<{autoApprove: boolean, autoCategorize: boolean, autoMessage: boolean, smartPromotion: boolean, securityMonitor: boolean}> => {
    try {
      const res = await apiFetch('/api/v1/settings/ai-pilot');
      return res.data || { autoApprove: true, autoCategorize: true, autoMessage: true, smartPromotion: true, securityMonitor: true };
    } catch (err) {
      console.warn("[db] Failed to fetch ai-pilot settings, returning safe default offline fallback:", err);
      return { autoApprove: true, autoCategorize: true, autoMessage: true, smartPromotion: true, securityMonitor: true };
    }
  },
  saveAiPilotSettings: async (settings: any) => {
    await apiFetch('/api/v1/settings/ai-pilot', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  // Promotional Banners Setup
  getPromotionalBanners: async (): Promise<PromotionalBanner[]> => {
    try {
      const res = await apiFetch('/api/v1/campaigns/billboards');
      return res.data || [];
    } catch (err) {
      console.warn("Failed to retrieve promotional banners, using empty fallback.", err);
      return [];
    }
  },
  savePromotionalBanners: async (banners: PromotionalBanner[]) => {
    await apiFetch('/api/v1/campaigns/billboards', {
      method: 'POST',
      body: JSON.stringify(banners)
    });
  },

  // Product reviews listings
  getReviews: async (productId?: string): Promise<Review[]> => {
    try {
      const url = productId ? `/api/v1/reviews?productId=${encodeURIComponent(productId)}` : '/api/v1/reviews';
      const res = await apiFetch(url);
      return res.data || [];
    } catch (err) {
      console.warn("Reviews API call failed, falls back to local storage.", err);
      const fallbackKey = 'orbishop_fallback_reviews_' + (productId || 'all');
      const stored = localStorage.getItem(fallbackKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
      return [];
    }
  },
  saveReview: async (review: { productId: string, customerName: string, rating: number, comment: string }): Promise<Review> => {
    try {
      const res = await apiFetch('/api/v1/reviews', {
        method: 'POST',
        body: JSON.stringify(review)
      });
      return res.data;
    } catch (err) {
      console.warn("Saving review to Supabase API failed, fallback to offline localStorage.", err);
      const id = Date.now().toString();
      const newReview: Review = {
        id,
        userName: review.customerName,
        rating: review.rating,
        comment: review.comment,
        createdAt: Date.now()
      };
      const fallbackKey = 'orbishop_fallback_reviews_' + review.productId;
      const current = localStorage.getItem(fallbackKey);
      let currentList: Review[] = [];
      if (current) {
        try {
          currentList = JSON.parse(current);
        } catch {}
      }
      currentList.unshift(newReview);
      localStorage.setItem(fallbackKey, JSON.stringify(currentList));

      const fallbackKeyAll = 'orbishop_fallback_reviews_all';
      const currentAll = localStorage.getItem(fallbackKeyAll);
      let currentListAll: Review[] = [];
      if (currentAll) {
        try {
          currentListAll = JSON.parse(currentAll);
        } catch {}
      }
      currentListAll.unshift(newReview);
      localStorage.setItem(fallbackKeyAll, JSON.stringify(currentListAll));

      return newReview;
    }
  },

  // TRA EFDMS Integration
  getTraConfig: async () => {
    const res = await apiFetch('/api/v1/tra/config');
    return res.data;
  },
  saveTraConfig: async (config: any) => {
    const res = await apiFetch('/api/v1/tra/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return res.data;
  },
  registerTraVfd: async () => {
    const res = await apiFetch('/api/v1/tra/register', {
      method: 'POST'
    });
    return res.data;
  },
  getTokenTra: async () => {
    const res = await apiFetch('/api/v1/tra/token', {
      method: 'POST'
    });
    return res.data;
  },
  submitTraReceipt: async (orderId: string) => {
    const res = await apiFetch('/api/v1/tra/submit-receipt', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
    return res;
  },
  submitTraZReport: async () => {
    const res = await apiFetch('/api/v1/tra/zreport', {
      method: 'POST'
    });
    return res;
  }
};
