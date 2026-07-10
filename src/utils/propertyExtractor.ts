import { Product, ProductFeature } from "../types";

export function parseKeyAttributes(description: string = "", features: ProductFeature[] = []): { key: string; value: string }[] {
  const list: { key: string; value: string }[] = [];
  const seenKeys = new Set<string>();

  // 1. Add explicit features first
  if (features && Array.isArray(features)) {
    features.forEach(f => {
      const k = f.name?.trim();
      const v = f.description?.trim();
      if (k && v && !seenKeys.has(k.toLowerCase())) {
        list.push({ key: k, value: v });
        seenKeys.add(k.toLowerCase());
      }
    });
  }

  // 2. Parse from description attributes
  if (description) {
    const lines = description.split("\n").map(l => l.trim()).filter(Boolean);
    
    // Check if we have Key: Value format
    let hasColonFormat = false;
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && colonIdx < 40) {
        const key = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        // Allow keys of 2-35 chars with standard labels, not URLs
        if (key.length >= 2 && key.length <= 35 && value.length > 0 && value.length < 200 && !key.includes(".") && !key.includes(",") && !key.toLowerCase().startsWith("http")) {
          hasColonFormat = true;
          break;
        }
      }
    }

    if (hasColonFormat) {
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0 && colonIdx < 40) {
          const key = line.substring(0, colonIdx).trim();
          const value = line.substring(colonIdx + 1).trim();
          if (
            key.length >= 2 && 
            key.length <= 35 && 
            value.length > 0 && 
            value.length < 200 && 
            !key.includes(".") && 
            !key.includes(",") && 
            !key.includes("?") && 
            !key.includes("!") &&
            !seenKeys.has(key.toLowerCase())
          ) {
            list.push({ key, value });
            seenKeys.add(key.toLowerCase());
          }
        }
      }
    } else {
      // Check alternating line format if no colons found
      let i = 0;
      while (i < lines.length - 1) {
        const lineVal1 = lines[i];
        const lineVal2 = lines[i + 1];
        
        const isKeyCandidate = 
          lineVal1.length >= 2 && 
          lineVal1.length <= 35 && 
          !lineVal1.includes(".") && 
          !lineVal1.includes(",") && 
          !lineVal1.includes("?") && 
          !lineVal1.includes("!") &&
          !lineVal1.includes(":") &&
          !lineVal1.toLowerCase().includes("show more");
          
        const isValueCandidate = 
          lineVal2.length > 0 && 
          lineVal2.length <= 250;

        if (isKeyCandidate && isValueCandidate) {
          const lKey = lineVal1.toLowerCase();
          if (!seenKeys.has(lKey)) {
            list.push({ key: lineVal1, value: lineVal2 });
            seenKeys.add(lKey);
          }
          // Move two lines forward
          i += 2;
        } else {
          i++;
        }
      }
    }
  }

  return list;
}

export interface DynamicPropertyMap {
  [key: string]: Set<string>;
}

export function extractFamilyProperties(products: Product[]): DynamicPropertyMap {
  const propertyMap: DynamicPropertyMap = {};

  products.forEach(product => {
    const attrs = parseKeyAttributes(product.description, product.features || []);
    attrs.forEach(({ key, value }) => {
      // Normalize key slightly to avoid duplicates with different casing
      // Let's use Capitalized version for display
      const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
      
      if (!propertyMap[displayKey]) {
        propertyMap[displayKey] = new Set<string>();
      }
      
      // Clean up value, handle lists if needed? For now just add it.
      propertyMap[displayKey].add(value.trim());
    });
  });

  // Filter out keys that only have 1 value or too many unique values (e.g., > 30)
  // as they are likely useless for filtering
  const filteredMap: DynamicPropertyMap = {};
  for (const key in propertyMap) {
    const size = propertyMap[key].size;
    if (size > 1 && size <= 30) {
      filteredMap[key] = propertyMap[key];
    }
  }

  return filteredMap;
}
