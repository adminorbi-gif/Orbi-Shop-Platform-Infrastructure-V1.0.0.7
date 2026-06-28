import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { SitemapStream, streamToPromise } from "sitemap";

const router = Router();

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};

router.get("/", async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.get("host");
    const baseUrl = process.env.NODE_ENV === "production" 
      ? "https://shop.orbifinancial.com" 
      : `${protocol}://${host}`;

    res.header("Content-Type", "application/xml");
    
    const smStream = new SitemapStream({ hostname: baseUrl });

    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });

    const { data: products } = await supabase
      .from("products")
      .select("id, name, updated_at, category")
      .limit(1000);

    if (products) {
      products.forEach((p: any) => {
        const lastMod = p.updated_at
          ? new Date(p.updated_at).toISOString()
          : new Date().toISOString();

        const catRaw = typeof p.category === "string" ? p.category : "";
        const parts = catRaw.split("::");
        const niche = parts.length > 1 ? parts[0] : "Electronics";
        const subCategory = parts.length > 1 ? parts.slice(1).join("::") : catRaw;

        const nicheSlug = slugify(niche);
        const subCategoryPath = subCategory
          .split("::")
          .map((part) => slugify(part))
          .filter(Boolean)
          .join("/");

        const productSlug = slugify(p.name);
        const fullCategoryPath = subCategoryPath
          ? `${nicheSlug}/${subCategoryPath}`
          : nicheSlug;
        const productPath = `/shop/${fullCategoryPath}/${productSlug}--${p.id}`;

        smStream.write({
          url: productPath,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: lastMod
        });
      });
    }

    smStream.end();
    
    const sitemapOutput = await streamToPromise(smStream);
    res.send(sitemapOutput.toString());

  } catch (err: any) {
    console.error("Sitemap Error:", err);
    res.status(500).end();
  }
});

export default router;
