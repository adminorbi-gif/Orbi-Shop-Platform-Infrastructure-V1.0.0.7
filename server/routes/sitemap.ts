import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lvkyttxfgrmsxafvtcxw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ThBuOrA98M6awmeGKc3cw_nrV-mJtO';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws as any,
  },
});

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

router.get("/", async (req, res) => {
  try {
    // Fetch visible products for the sitemap
    const { data: products } = await supabase
      .from('products')
      .select('id, name, updated_at, category')
      .limit(1000);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    if (products) {
      products.forEach((p: any) => {
        const lastMod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        // Parse niche and sub-categories from the category column "Niche::Sub1::Sub2"
        const catRaw = typeof p.category === 'string' ? p.category : '';
        const parts = catRaw.split('::');
        const niche = parts.length > 1 ? parts[0] : 'Electronics';
        const subCategory = parts.length > 1 ? parts.slice(1).join('::') : catRaw;

        const nicheSlug = slugify(niche);
        const subCategoryPath = subCategory
          .split('::')
          .map(part => slugify(part))
          .filter(Boolean)
          .join('/');
        
        const productSlug = slugify(p.name);
        const fullCategoryPath = subCategoryPath ? `${nicheSlug}/${subCategoryPath}` : nicheSlug;
        const productPath = `/shop/${fullCategoryPath}/${productSlug}--${p.id}`;
        
        xml += `
  <url>
    <loc>${baseUrl}${productPath}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    }

    xml += `\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error("Sitemap generation error:", err.message);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
