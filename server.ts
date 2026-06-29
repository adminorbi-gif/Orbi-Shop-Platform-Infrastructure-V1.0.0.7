import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";

import { supabase } from "./server/lib/supabase.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";

import adminRouter from "./server/routes/admin.js";
import aiRouter from "./server/routes/ai.js";
import analyticsRouter from "./server/routes/analytics.js";
import authRouter from "./server/routes/auth.js";
import checkoutRouter from "./server/routes/checkout.js";
import customersRouter from "./server/routes/customers.js";
import messagesRouter from "./server/routes/messages.js";
import newslettersRouter from "./server/routes/newsletters.js";
import ordersRouter from "./server/routes/orders.js";
import paymentsRouter from "./server/routes/payments.js";
import productsRouter from "./server/routes/products.js";
import promotionsRouter from "./server/routes/promotions.js";
import reviewsRouter from "./server/routes/reviews.js";
import searchRouter from "./server/routes/search.js";
import settingsRouter from "./server/routes/settings.js";
import sitemapRouter from "./server/routes/sitemap.js";
import stockNotificationsRouter from "./server/routes/stockNotifications.js";
import storageRouter from "./server/routes/storage.js";
import subscriptionsRouter from "./server/routes/subscriptions.js";
import talkRouter from "./server/routes/talk.js";
import traRouter from "./server/routes/tra.js";

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = Number(process.env.PORT || 3000);

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
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://orbifinancial.com", "https://shop.orbifinancial.com"] // Allow only your domains in production
          : "*", // Allow all in development
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  );

  // 3. Rate Limiting for API routes
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  // Add JSON body parser middleware which is necessary for Express POST endpoints
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mount API Routes
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/v1/checkout", checkoutRouter);
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/messages", messagesRouter);
  app.use("/api/v1/newsletters", newslettersRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/orbi-pay", paymentsRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/campaigns", promotionsRouter);
  app.use("/api/v1/reviews", reviewsRouter);
  app.use("/api/v1/search", searchRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/sitemap", sitemapRouter);
  app.use("/sitemap.xml", sitemapRouter);
  app.use("/api/v1/stock-notifications", stockNotificationsRouter);
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
      const productMatch = url.match(/\/shop\/.*--([a-zA-Z0-9-]+)(?:\?.*)?$/);
      
      if (productMatch) {
        try {
          const productId = productMatch[1];
          if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) throw new Error("Missing required Supabase frontend environment variables.");
          
          const { data: product } = await supabase.from("products").select("name, nameSw, description, price, images").eq("id", productId).single();
          
          if (product) {
            let html = await fs.promises.readFile(path.join(process.cwd(), "index.html"), "utf-8");
            html = await vite.transformIndexHtml(url, html);
            
            const title = `Bei ya ${product.nameSw || product.name} | Orbi Shop`;
            const desc = `Nunua ${product.nameSw || product.name} kwa bei ya TSh ${product.price}. ${product.description ? product.description.substring(0, 150) : ''}...`;
            const image = product.images && product.images[0] ? product.images[0] : "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";
            
            html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
            html = html.replace(/<meta name="description".*?>/, `<meta name="description" content="${desc}" />`);
            html = html.replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${title}" />`);
            html = html.replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="${desc}" />`);
            html = html.replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${image}" />`);
            
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
    app.use(express.static(distPath, { index: false }));
    
    app.get("*", async (req, res) => {
      const url = req.originalUrl;
      const productMatch = url.match(/\/shop\/.*--([a-zA-Z0-9-]+)(?:\?.*)?$/);
      let html = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
      
      if (productMatch) {
        try {
          const productId = productMatch[1];
          if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) throw new Error("Missing required Supabase frontend environment variables.");
          
          const { data: product } = await supabase.from("products").select("name, nameSw, description, price, images").eq("id", productId).single();
          
          if (product) {
            const title = `Bei ya ${product.nameSw || product.name} | Orbi Shop`;
            const desc = `Nunua ${product.nameSw || product.name} kwa bei ya TSh ${product.price}. ${product.description ? product.description.substring(0, 150) : ''}...`;
            const image = product.images && product.images[0] ? product.images[0] : "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png";
            
            html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
            html = html.replace(/<meta name="description".*?>/, `<meta name="description" content="${desc}" />`);
            html = html.replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${title}" />`);
            html = html.replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="${desc}" />`);
            html = html.replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${image}" />`);
          }
        } catch (e) {
          console.error("Error injecting SEO tags in production:", e);
        }
      }
      
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
