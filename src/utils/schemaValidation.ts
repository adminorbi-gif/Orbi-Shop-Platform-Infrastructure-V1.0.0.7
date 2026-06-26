import { Product, Order } from "../types";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * A lightweight, custom Zod-like declarative validation engine.
 */
class SchemaValidator {
  /**
   * Validates a Product payload before catalog insertion or update.
   */
  static validateProduct(data: any, lang: "sw" | "en" = "en"): ValidationResult<Partial<Product>> {
    console.debug("[SchemaValidator] Validating product payload:", data);

    if (!data || typeof data !== "object") {
      return {
        success: false,
        error: lang === "sw" ? "Payload ya bidhaa haipo au si sahihi!" : "Product payload is empty or invalid!"
      };
    }

    // 1. Name Check (Min 2 chars)
    const name = String(data.name || "").trim();
    if (!name || name.length < 2) {
      return {
        success: false,
        error: lang === "sw" 
          ? "Jina la bidhaa ni lazima na liwe na herufi zisizopungua 2!" 
          : "Product Name is required and must have at least 2 characters!"
      };
    }

    // 2. SKU Check (Must be non-empty and formatted or min 3 alphanumeric characters)
    const sku = String(data.sku || "").trim();
    if (!sku) {
      return {
        success: false,
        error: lang === "sw"
          ? "Msimbo wa SKU / Barcode ni lazima kwa uhakiki wa usafirishaji!"
          : "SKU / Barcode is required for shipping inventory tracking!"
      };
    }
    
    const skuRegex = /^[A-Za-z0-9\-_#]{3,40}$/;
    if (!skuRegex.test(sku)) {
      return {
        success: false,
        error: lang === "sw"
          ? `Msimbo wa SKU ("${sku}") si sahihi! Lazima uwe na urefu wa herufi 3-40 na usitumie alama maalum zisizoruhusiwa.`
          : `Invalid SKU code ("${sku}")! It must be 3-40 alphanumeric characters (hyphens, underscores, hashes allowed).`
      };
    }

    // 3. Price Validation (Positive number)
    const price = Number(data.price);
    if (isNaN(price) || price <= 0) {
      return {
        success: false,
        error: lang === "sw"
          ? "Bei ya bidhaa lazima iwe namba sahihi kubwa kuliko sifuri!"
          : "Price must be a valid positive number greater than zero!"
      };
    }

    // 4. Stock Validation (Non-negative integer)
    const stock = Number(data.stock);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      return {
        success: false,
        error: lang === "sw"
          ? "Kiwango cha Stoki lazima kiwe namba nzima isiyo duni na sifuri (>= 0)!"
          : "Stock level must be a non-negative integer (>= 0)!"
      };
    }

    // 5. Category validation
    const category = String(data.category || "").trim();
    if (!category) {
      return {
        success: false,
        error: lang === "sw" ? "Tafadhali chagua kategoria ya bidhaa!" : "Product category is required!"
      };
    }

    const cleanDesc = String(data.description || "").trim();

    const validated: Partial<Product> = {
      ...(data.id ? { id: String(data.id) } : {}),
      name,
      sku,
      niche: String(data.niche || "Electronics").trim(),
      category,
      price,
      oldPrice: data.oldPrice ? Number(data.oldPrice) : undefined,
      stock,
      description: cleanDesc,
      images: Array.isArray(data.images) ? data.images : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      visible: typeof data.visible === "boolean" ? data.visible : true,
      sellerId: data.sellerId ? String(data.sellerId) : undefined,
      createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
      taxCode: typeof data.taxCode === "number" ? data.taxCode : 1,
      arrangeTier: data.arrangeTier ? String(data.arrangeTier) : undefined,
      vibe: data.vibe ? String(data.vibe) : undefined,
      presentationStyle: data.presentationStyle ? String(data.presentationStyle) : undefined,
      warranty: data.warranty ? String(data.warranty).trim() : undefined,
      features: Array.isArray(data.features) ? data.features : [],
      wholesaleTiers: Array.isArray(data.wholesaleTiers)
        ? data.wholesaleTiers.map((t: any) => ({
            minQty: Number(t.minQty || 0),
            maxQty: t.maxQty ? Number(t.maxQty) : undefined,
            price: Number(t.price || 0),
          }))
        : undefined,
    };

    console.info("[SchemaValidator] Product validated success:", validated);
    return { success: true, data: validated };
  }

  /**
   * Validates Order shipping status and details before dispatching updates.
   */
  static validateShippingState(data: any, lang: "sw" | "en" = "en"): ValidationResult<Partial<Order>> {
    console.debug("[SchemaValidator] Validating shipping state payload:", data);

    if (!data || typeof data !== "object") {
      return {
        success: false,
        error: lang === "sw" ? "Taarifa za oda hazipo au si sahihi!" : "Order data is empty or malformed!"
      };
    }

    // 1. Order ID Check
    if (!data.id) {
      return {
        success: false,
        error: lang === "sw" ? "Kitambulisho cha Oda (ID) kinahitajika!" : "Order ID is required!"
      };
    }

    // 2. Customer Details Check (Address, Phone, Name)
    const details = data.customerDetails;
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: lang === "sw"
          ? "Maelezo ya mteja (customerDetails) hayapo kwenye oda hii!"
          : "Customer details object is missing from this order record!"
      };
    }

    const cName = String(details.name || "").trim();
    const cPhone = String(details.phone || "").trim();
    const cAddress = String(details.address || "").trim();

    if (!cName) {
      return {
        success: false,
        error: lang === "sw" ? "Jina la mteja ni lazima kwenye maelezo ya oda!" : "Customer Name is required in shipping metadata!"
      };
    }

    if (!cPhone || cPhone.length < 5) {
      return {
        success: false,
        error: lang === "sw" ? "Namba ya simu ya mteja haipo au si sahihi!" : "Customer phone number is missing or too short!"
      };
    }

    if (!cAddress || cAddress.length < 3) {
      return {
        success: false,
        error: lang === "sw" ? "Anuani ya usafirishaji ni lazima ili kutuma mzigo!" : "Shipping address details are required for courier tracking!"
      };
    }

    // 3. Status validation
    const status = data.status;
    const statusLower = String(status || "").toLowerCase();
    const allowedStatuses = [
      'pending', 'confirmed', 'cancelled', 'shipped', 'delivered', 'customer_confirmed',
      'created', 'awaiting_payment', 'payment_held', 'processing', 'buyer_confirmed', 'disputed', 'released', 'refunded'
    ];
    if (!allowedStatuses.includes(statusLower)) {
      return {
        success: false,
        error: lang === "sw"
          ? `Hali ya oda ("${status}") si sahihi! Hali zilizoruhusiwa kisheria ni: created, payment_held, processing, transit, au mteja thibitisha.`
          : `Invalid order status ("${status}")! Valid workflow statuses are: created, payment_held, processing, transit, or client confirms.`
      };
    }

    const validated: Partial<Order> = {
      id: String(data.id),
      customerDetails: {
        name: cName,
        phone: cPhone,
        address: cAddress
      },
      status: data.status,
      paymentReference: data.paymentReference ? String(data.paymentReference) : undefined,
      total: typeof data.total === "number" ? data.total : 0,
      paymentMethod: data.paymentMethod ? String(data.paymentMethod) : undefined,
      paymentMethodName: data.paymentMethodName ? String(data.paymentMethodName) : undefined
    };

    console.info("[SchemaValidator] Shipping state validated successfully:", validated);
    return { success: true, data: validated };
  }
}

export { SchemaValidator };
