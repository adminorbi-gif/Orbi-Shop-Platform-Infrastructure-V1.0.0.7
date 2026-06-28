import express from "express";
import path from "path";
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
  const PORT = 3000;

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
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
