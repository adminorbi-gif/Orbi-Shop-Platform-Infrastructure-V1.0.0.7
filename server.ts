import dotenv from "dotenv";
dotenv.config();

// Global crash prevention hooks to prevent server crashes resulting in 502 Bad Gateway
process.on("uncaughtException", (err) => {
  console.error("CRITICAL: UNCAUGHT EXCEPTION PREVENTED CRASH:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: UNHANDLED REJECTION PREVENTED CRASH:", reason);
});

import express from "express";
import path from "path";
import fs from "fs";

import { supabase } from "./server/lib/supabase.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";

import adminRouter from "./server/routes/admin.js";
import adsRouter from "./server/routes/ads.js";
import aiRouter from "./server/routes/ai.js";
import analyticsRouter from "./server/routes/analytics.js";
import authRouter from "./server/routes/auth.js";
import checkoutRouter from "./server/routes/checkout.js";
import customersRouter from "./server/routes/customers.js";
import deliveryRouter from "./server/routes/delivery.js";
import messagesRouter from "./server/routes/messages.js";
import newslettersRouter from "./server/routes/newsletters.js";
import ordersRouter from "./server/routes/orders.js";
import paymentsRouter from "./server/routes/payments.js";
import placesRouter from "./server/routes/places.js";
import productsRouter from "./server/routes/products.js";
import promotionsRouter from "./server/routes/promotions.js";
import reviewsRouter from "./server/routes/reviews.js";
import searchRouter from "./server/routes/search.js";
import settingsRouter from "./server/routes/settings.js";
import sitemapRouter from "./server/routes/sitemap.js";
import stockNotificationsRouter from "./server/routes/stockNotifications.js";
import priceAlertsRouter from "./server/routes/priceAlerts.js";
import storageRouter from "./server/routes/storage.js";
import subscriptionsRouter from "./server/routes/subscriptions.js";
import talkRouter from "./server/routes/talk.js";
import traRouter from "./server/routes/tra.js";

const ORBI_SHOP_LOGO = "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 155) {
  return value.length > max ? `${value.slice(0, max - 1).trim()}...` : value;
}

function categoryBreadcrumbs(pathname: string, baseUrl: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [
    { name: "Orbi Shop", item: `${baseUrl}/` },
  ];

  if (parts[0] === "shop") {
    let current = "/shop";
    parts.slice(1).forEach((part) => {
      current += `/${part}`;
      const cleanName = part
        .replace(/--[a-zA-Z0-9-]+$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      crumbs.push({ name: cleanName || "Product", item: `${baseUrl}${current}` });
    });
  }

  return crumbs;
}

function injectStructuredSeo(html: string, options: { appUrl: string; pathname: string; product?: any }) {
  const pathname = options.pathname.length > 1 ? options.pathname.replace(/\/+$/, "") : "/";
  const canonicalUrl = `${options.appUrl}${pathname}`;
  const product = options.product;
  const productName = product?.name ? String(product.name) : "";
  const productDescription = truncate(stripHtml(product?.description) || `Nunua ${productName || "bidhaa"} kwenye Orbi Shop Tanzania.`);
  const productImage = Array.isArray(product?.images) && product.images[0] ? product.images[0] : ORBI_SHOP_LOGO;
  const price = Number(product?.price || 0);
  const availability = Number(product?.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Orbi Shop",
      url: `${options.appUrl}/`,
      logo: ORBI_SHOP_LOGO,
      sameAs: ["https://shop.orbifinancial.com"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Orbi Shop",
      url: `${options.appUrl}/`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${options.appUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: categoryBreadcrumbs(pathname, options.appUrl).map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    },
  ];

  if (product) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": canonicalUrl,
      name: productName,
      description: productDescription,
      image: [productImage],
      sku: String(product.id || ""),
      category: product.category || undefined,
      brand: {
        "@type": "Brand",
        name: "Orbi Shop",
      },
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "TZS",
        price: Number.isFinite(price) ? price.toFixed(2) : "0.00",
        availability,
        itemCondition: "https://schema.org/NewCondition",
      },
    });
  }

  const title = product ? `Bei ya ${productName} | Orbi Shop` : "Orbi Shop";
  const description = product
    ? `Nunua ${productName} kwa bei ya TSh ${Number.isFinite(price) ? price.toLocaleString("en-US") : "0"}. ${productDescription}`
    : "Shop with Orbi - trusted e-commerce marketplace in Tanzania.";

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`)
    .replace(/<meta name="description".*?>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url".*?>/, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`)
    .replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${escapeHtml(productImage)}" />`)
    .replace(/<meta name="twitter:title".*?>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description".*?>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="twitter:image".*?>/, `<meta name="twitter:image" content="${escapeHtml(productImage)}" />`)
    .replace(
      /<script id="dynamic-seo-schema"><\/script>/,
      `<script id="dynamic-seo-schema" type="application/ld+json">${JSON.stringify(schemas)}</script>`,
    );
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const runtimePorts = [
    process.env.ORBI_SHOP_PORT,
    process.env.PORT,
    "3000",
  ]
    .map((port) => Number(port))
    .filter((port) => Number.isInteger(port) && port > 0 && port < 65536);
  const PORTS = Array.from(new Set(runtimePorts));
  const appUrl = (process.env.APP_URL || "https://shop.orbifinancial.com").replace(/\/$/, "");

  const healthPayload = () => ({
    status: "ok",
    service: "orbi-shop",
    publicHealthUrl: `${appUrl}/api/health`,
    timestamp: new Date().toISOString(),
  });

  // Keep platform probes before security, CORS, rate-limit, and body parsing.
  app.get("/health", (req, res) => {
    res.status(200).json(healthPayload());
  });

  app.get("/ready", (req, res) => {
    res.status(200).json(healthPayload());
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json(healthPayload());
  });

  // 1. Helmet Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP to prevent blocking Vite or inline scripts
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.includes("run.app") ||
          origin.includes("aistudio") ||
          origin.includes("google.com") ||
          origin.includes("orbifinancial.com")
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  );

  // 3. Rate Limiting for API routes
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  // Checkout payloads are intentionally lean, but allow room for admin/product APIs.
  app.use(express.json({ limit: "1mb" }));

  // Database proxy endpoint for frontend Supabase customProxyFetch
  app.post("/api/db/proxy", async (req, res) => {
    try {
      const { url, options } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Missing URL in proxy payload" });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      if (supabaseUrl && !url.startsWith(supabaseUrl)) {
        return res.status(403).json({ error: "Forbidden proxy destination URL" });
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
        },
      });

      const body = await response.text();

      // Forward content type and caching headers if present
      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === "content-type" || lowerKey === "cache-control") {
          res.setHeader(key, value);
        }
      });

      res.status(response.status).send(body);
    } catch (err: any) {
      console.error("[Database Proxy Error]:", err.message || err);
      res.status(500).json({ success: false, error: err.message || "Failed to proxy database request" });
    }
  });

  // Mount API Routes
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/ads", adsRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/v1/checkout", checkoutRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/delivery", deliveryRouter);
  app.use("/api/v1/messages", messagesRouter);
  app.use("/api/v1/newsletters", newslettersRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/orbi-pay", paymentsRouter);
  app.use("/api/v1/places", placesRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/campaigns", promotionsRouter);
  app.use("/api/v1/reviews", reviewsRouter);
  app.use("/api/v1/search", searchRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/sitemap", sitemapRouter);
  app.use("/sitemap.xml", sitemapRouter);
  app.use("/api/v1/stock-notifications", stockNotificationsRouter);
  app.use("/api/v1/price-alerts", priceAlertsRouter);
  app.use("/api/v1/storage", storageRouter);
  app.use("/api/v1/subscriptions", subscriptionsRouter);
  app.use("/api/talk", talkRouter);
  app.use("/api/v1/tra", traRouter);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Custom middleware to inject SEO tags in development
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      const pathname = req.path || "/";
      const productMatch = url.match(/\/shop\/.*--([a-zA-Z0-9-]+)(?:\?.*)?$/);
      
      if (productMatch) {
        try {
          const productId = productMatch[1];
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
          if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase server-side environment variables.");
          
          const { data: product } = await supabase
            .from("products")
            .select("id, name, description, price, images, stock, category")
            .eq("id", productId)
            .single();
          
          if (product) {
            let html = await fs.promises.readFile(path.join(process.cwd(), "index.html"), "utf-8");
            html = await vite.transformIndexHtml(url, html);
            html = injectStructuredSeo(html, { appUrl, pathname, product });
            
            return res.status(200).set({ "Content-Type": "text/html" }).end(html);
          }
        } catch (e) {
          console.error("Error injecting SEO tags:", e);
        }
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            return;
          }
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            return;
          }
          if (filePath.endsWith("sw.js") || filePath.endsWith("manifest.webmanifest")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      }),
    );

    app.get(/^\/assets\/.+/, (req, res) => {
      res
        .status(404)
        .type("text/plain")
        .send("Static asset not found. Refresh the app to load the latest version.");
    });

    app.get(/\.(?:css|js|mjs|map|png|jpg|jpeg|webp|svg|ico|json|txt|webmanifest)$/i, (req, res) => {
      res
        .status(404)
        .type("text/plain")
        .send("File not found.");
    });
    
    app.get("*", async (req, res) => {
      const url = req.originalUrl;
      const pathname = req.path || "/";
      const productMatch = url.match(/\/shop\/.*--([a-zA-Z0-9-]+)(?:\?.*)?$/);
      let html = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
      let structuredProduct: any = null;
      
      if (productMatch) {
        try {
          const productId = productMatch[1];
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
          if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase server-side environment variables.");
          
          const { data: product } = await supabase
            .from("products")
            .select("id, name, description, price, images, stock, category")
            .eq("id", productId)
            .single();
          structuredProduct = product || null;
        } catch (e) {
          console.error("Error injecting SEO tags in production:", e);
        }
      }

      html = injectStructuredSeo(html, { appUrl, pathname, product: structuredProduct });
      
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    });
  }

  for (const port of PORTS) {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check: ${appUrl}/api/health`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.warn(`Port ${port} is already in use; continuing with other listeners.`);
        return;
      }
      throw error;
    });
  }
}

startServer();
