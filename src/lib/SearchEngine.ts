import { Product } from "../types";
import { BILINGUAL_DICTIONARY } from "./searchDictionary";

export class BilingualSearchEngine {
  private static synonymToKeys: Map<string, string[]> | null = null;
  private static knownTokens: Set<string> | null = null;
  private static productWordsCache = new Map<string, string[]>();
  private static productTextsCache = new Map<string, string[]>();
  private static productNameWordsCache = new Map<string, string[]>();

  /**
   * Safe, high-precision matching of search terms inside text, enforcing boundary rules.
   * Prevents matching sub-parts of words for short queries (e.g., "ac" matching "jacket" or "gas" matching "sunglasses").
   */
  public static containsWholeWord(text: string, word: string): boolean {
    const lowText = text.toLowerCase();
    const lowWord = word.toLowerCase().trim();
    if (!lowWord) return false;

    // For very short query terms (like "ac"), we MUST do a strict whole-word check
    if (lowWord.length <= 3) {
      const escaped = lowWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Require word boundaries or non-alphanumeric wraps on BOTH sides
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i');
      return regex.test(lowText);
    }

    // For medium/long words, allow prefix matching but only on a word start boundary
    const escaped = lowWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}`, 'i');
    return regex.test(lowText);
  }

  private static initDictionary() {
    if (this.synonymToKeys) return;

    const map = new Map<string, string[]>();
    const allTokens = new Set<string>();

    for (const [key, synonyms] of Object.entries(BILINGUAL_DICTIONARY)) {
      const lowKey = key.toLowerCase();
      const entryList = [lowKey, ...synonyms.map(s => s.toLowerCase())];
      
      for (const token of entryList) {
        if (!map.has(token)) {
          map.set(token, []);
        }
        const entries = map.get(token)!;
        if (!entries.includes(lowKey)) {
          entries.push(lowKey);
        }
        allTokens.add(token);
      }
    }

    this.synonymToKeys = map;
    this.knownTokens = allTokens;
  }

  public static getResolvedKeys(token: string): string[] {
    this.initDictionary();
    const lowToken = token.toLowerCase();
    
    // Exact match in dictionary
    if (this.knownTokens!.has(lowToken)) {
      return this.synonymToKeys!.get(lowToken) || [];
    }

    // Try spelling matching on known tokens
    for (const known of this.knownTokens!) {
      if (this.wordsAreSimilar(lowToken, known)) {
        return this.synonymToKeys!.get(known) || [];
      }
    }

    return [];
  }

  public static getProductWords(product: Product): string[] {
    const cacheKey = product.id || `${product.name}-${product.category}`;
    if (this.productWordsCache.has(cacheKey)) {
      return this.productWordsCache.get(cacheKey)!;
    }

    const prodTexts = this.getProductTexts(product);
    const words = new Set<string>();
    for (const text of prodTexts) {
      const parts = text.split(/[\s,.\-\/]+/).filter(w => w.length >= 2);
      for (const p of parts) {
        words.add(p);
      }
    }

    const result = Array.from(words);
    this.productWordsCache.set(cacheKey, result);
    return result;
  }

  public static getProductTexts(product: Product): string[] {
    const cacheKey = product.id || `${product.name}-${product.category}`;
    if (this.productTextsCache.has(cacheKey)) {
      return this.productTextsCache.get(cacheKey)!;
    }
    const prodTexts = [
      product.name.toLowerCase(),
      (product.description || "").toLowerCase(),
      ...(product.tags || []).map(t => t.toLowerCase()),
      (product.niche || "").toLowerCase(),
      (product.category || "").toLowerCase(),
      (product.vibe || "").toLowerCase(),
      (product.arrangeTier || "").toLowerCase(),
      (product.presentationStyle || "").toLowerCase(),
      ...(product.features || []).map(f => `${f.name} ${f.description}`.toLowerCase())
    ].filter(Boolean);
    this.productTextsCache.set(cacheKey, prodTexts);
    return prodTexts;
  }

  public static getProductNameWords(product: Product): string[] {
    const cacheKey = product.id || product.name;
    if (this.productNameWordsCache.has(cacheKey)) {
      return this.productNameWordsCache.get(cacheKey)!;
    }
    const words = product.name.toLowerCase().split(/[\s,.\-\/]+/).filter(w => w.length >= 3);
    this.productNameWordsCache.set(cacheKey, words);
    return words;
  }

  /**
   * Calculates the Levenshtein distance between two strings to measure spelling difference.
   */
  public static getLevenshteinDistance(a: string, b: string): number {
    const tmp: number[][] = [];
    for (let i = 0; i <= a.length; i++) {
      tmp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      tmp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1, // deletion
          tmp[i][j - 1] + 1, // insertion
          tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
        );
      }
    }
    return tmp[a.length][b.length];
  }

  /**
   * Determines if two words are a spelling match with localized typo-tolerance.
   */
  public static wordsAreSimilar(w1: string, w2: string): boolean {
    const s1 = w1.toLowerCase().trim();
    const s2 = w2.toLowerCase().trim();
    if (s1 === s2) return true;
    if (s1.length < 3 || s2.length < 3) return false;

    const dist = this.getLevenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    // Dynamic typo allowance based on word length
    let allowedTypos = 1;
    if (maxLength >= 8) {
      allowedTypos = 2; // e.g. "viyoyozi" vs "viyoyozo"
    }

    return dist <= allowedTypos;
  }

  /**
   * Returns a matching score for sorting/prioritization.
   * Priority: Exactly matches product name (100+) -> matches category (80) -> matches niche (60) -> others (10-50)
   */
  public static getRelevanceScore(product: Product, searchVal: string, aiExpandedKeywords: string[] = []): number {
    if (!searchVal) return 0;
    const searchLower = searchVal.toLowerCase().trim();
    const nameLower = product.name.toLowerCase();
    const catLower = (product.category || "").toLowerCase();
    const nicheLower = (product.niche || "").toLowerCase();

    // 1. Exact or partial match on product name (enforcing whole word/prefix boundaries)
    if (this.containsWholeWord(nameLower, searchLower)) {
      // Prioritize startsWith over includes, and shorter names to get more exact matches first
      return 100 + (nameLower.startsWith(searchLower) ? 10 : 0) - nameLower.length * 0.01;
    }

    // 2. Tokenized match on product name
    const tokens = searchLower.split(/\s+/).filter(Boolean);
    let nameTokenMatches = 0;
    for (const token of tokens) {
      if (this.containsWholeWord(nameLower, token)) {
        nameTokenMatches++;
      }
    }
    if (nameTokenMatches > 0 && tokens.length > 0) {
      return 90 + (nameTokenMatches / tokens.length) * 9;
    }

    // 3. Category match
    if (catLower && (this.containsWholeWord(catLower, searchLower) || this.containsWholeWord(searchLower, catLower))) {
      return 80;
    }

    // 4. Niche match
    if (nicheLower && (this.containsWholeWord(nicheLower, searchLower) || this.containsWholeWord(searchLower, nicheLower))) {
      return 60;
    }

    // 5. Pre-expanded matches (enforcing boundaries)
    if (aiExpandedKeywords && aiExpandedKeywords.length > 0) {
      const aiMatchName = aiExpandedKeywords.some(kw => this.containsWholeWord(nameLower, kw));
      if (aiMatchName) return 50;

      const aiMatchCat = aiExpandedKeywords.some(kw => this.containsWholeWord(catLower, kw));
      if (aiMatchCat) return 45;

      const aiMatchNiche = aiExpandedKeywords.some(kw => this.containsWholeWord(nicheLower, kw));
      if (aiMatchNiche) return 40;
    }

    // 6. Typo-tolerant or Synonym match
    let synonymMatch = false;
    let typoMatch = false;

    for (const token of tokens) {
      const resolvedKeys = this.getResolvedKeys(token);

      for (const key of resolvedKeys) {
        const synonyms = BILINGUAL_DICTIONARY[key];
        if (synonyms) {
          if (synonyms.some(syn => this.containsWholeWord(nameLower, syn))) {
            synonymMatch = true;
            break;
          }
        }
      }
      if (synonymMatch) break;

      // Typo matching in name words
      const wordsInProd = this.getProductNameWords(product);
      if (wordsInProd.some(pw => this.wordsAreSimilar(token, pw))) {
        typoMatch = true;
        break;
      }
    }

    if (synonymMatch) return 30;
    if (typoMatch) return 20;

    // Feature attributes match
    const featuresList = product.features || [];
    if (featuresList.some(f => this.containsWholeWord((f.name || "").toLowerCase(), searchLower) || this.containsWholeWord((f.description || "").toLowerCase(), searchLower))) {
      return 15;
    }

    // Last resort secondary matches: matches in description or tags
    const descLower = (product.description || "").toLowerCase();
    if (this.containsWholeWord(descLower, searchLower)) return 10;

    if (product.tags && product.tags.some(t => this.containsWholeWord(t, searchLower))) return 5;

    return 0;
  }

  /**
   * Core search engine matching method. Returns true if the product matches the user's search tokenized query.
   * Utilizes either user's raw text (with localized dictionary expansion) or the AI expanded/synonym keyword list.
   */
  public static matches(product: Product, searchVal: string, aiExpandedKeywords: string[] = []): boolean {
    if (!searchVal) return true;
    const searchLower = searchVal.toLowerCase().trim();

    // Direct exact check
    const prodTexts = this.getProductTexts(product);
    if (prodTexts.some(text => this.containsWholeWord(text, searchLower))) {
      return true;
    }

    // Case 1: Match using Gemini AI pre-expanded keywords (if available)
    if (aiExpandedKeywords && aiExpandedKeywords.length > 0) {
      // 1. Direct inclusion with word boundary safety
      if (aiExpandedKeywords.some(kw => prodTexts.some(text => this.containsWholeWord(text, kw)))) {
        return true;
      }
      // 2. Typo-tolerant keyword matching (split on word boundaries to match exact items, preventing cross-niche pollution)
      const wordsInProd = this.getProductWords(product).filter(w => w.length >= 3);
      for (const kw of aiExpandedKeywords) {
        const kwWords = kw.toLowerCase().split(/\s+/).filter(Boolean);
        if (kwWords.every(kwW => wordsInProd.some(pw => this.wordsAreSimilar(kwW, pw)))) {
          return true;
        }
      }
    }

    // Case 2: Match using Dedicated Local Bilingual Rule-Engine Dictionary
    const searchTokens = searchLower.split(/\s+/).filter(Boolean);
    if (searchTokens.length === 0) return false;

    const wordsInProd = this.getProductWords(product).filter(w => w.length >= 3);

    return searchTokens.every(token => {
      // Step A: Substring inclusion check with whole word/prefix boundaries
      if (prodTexts.some(text => this.containsWholeWord(text, token))) {
        return true;
      }

      // Step B: Typo resemblance check with exact product words (helps match "viyoyozi" -> "ac" when AC is in name)
      if (wordsInProd.some(pw => this.wordsAreSimilar(token, pw))) {
        return true;
      }

      // Step C: Try to map the search token to the extensive bilingual dictionary matching rule-pairs
      const resolvedKeys = this.getResolvedKeys(token);

      for (const key of resolvedKeys) {
        // Direct key check
        if (prodTexts.some(text => this.containsWholeWord(text, key))) {
          return true;
        }

        const synonyms = BILINGUAL_DICTIONARY[key];
        if (synonyms) {
          // Direct check of synonyms against text fields
          if (synonyms.some(syn => prodTexts.some(text => this.containsWholeWord(text, syn)))) {
            return true;
          }
          // Typo-tolerant check of synonyms against text words
          for (const syn of synonyms) {
            const synLower = syn.toLowerCase();
            if (wordsInProd.some(pw => this.wordsAreSimilar(synLower, pw))) {
              return true;
            }
          }
        }
      }

      return false;
    });
  }

  /**
   * Expands a list of tokens by adding all their matched bilingual synonyms.
   */
  public static expandToken(token: string): string[] {
    this.initDictionary();
    const lowToken = token.trim().toLowerCase();
    const result = new Set<string>([lowToken]);
    
    const keys = this.getResolvedKeys(lowToken);
    for (const k of keys) {
      result.add(k);
      const synonyms = BILINGUAL_DICTIONARY[k];
      if (synonyms) {
        for (const syn of synonyms) {
          result.add(syn.toLowerCase());
        }
      }
    }
    return Array.from(result);
  }
}

export interface ProductIndex {
  // word -> set of product IDs
  wordToProducts: Map<string, Set<string>>;
  // product ID -> Product
  products: Map<string, Product>;
}

export class InvertedIndexBuilder {
  public static build(products: Product[]): ProductIndex {
    const wordToProducts = new Map<string, Set<string>>();
    const productsMap = new Map<string, Product>();

    for (const p of products) {
      if (!p.id) continue;
      productsMap.set(p.id, p);
      
      const words = BilingualSearchEngine.getProductWords(p);
      for (const w of words) {
        const lowW = w.trim().toLowerCase();
        if (!lowW) continue;
        if (!wordToProducts.has(lowW)) {
          wordToProducts.set(lowW, new Set());
        }
        wordToProducts.get(lowW)!.add(p.id);
      }
    }
    return { wordToProducts, products: productsMap };
  }
}

export class InvertedIndexSearch {
  private index: ProductIndex;

  constructor(products: Product[]) {
    this.index = InvertedIndexBuilder.build(products);
  }

  /**
   * For a single query token, retrieve all candidate matched product IDs using inverted mapping.
   */
  private getProductIdsForToken(token: string, vocabulary: string[]): Set<string> {
    const matchedIds = new Set<string>();
    
    // 1. Expand synonyms for O(1) exact mapping match
    const expanded = BilingualSearchEngine.expandToken(token);
    for (const exp of expanded) {
      const ids = this.index.wordToProducts.get(exp);
      if (ids) {
        for (const id of ids) {
          matchedIds.add(id);
        }
      }
    }
    
    // 2. Localized typo-tolerance & prefix matches against active index vocabulary keys
    for (const vocabWord of vocabulary) {
      // Direct string containment with whole word/prefix boundaries, typo tolerance or similarity comparison
      if (BilingualSearchEngine.containsWholeWord(vocabWord, token) || BilingualSearchEngine.wordsAreSimilar(token, vocabWord)) {
        const ids = this.index.wordToProducts.get(vocabWord);
        if (ids) {
          for (const id of ids) {
            matchedIds.add(id);
          }
        }
      }
    }
    
    return matchedIds;
  }

  /**
   * High performance query search matching, intersecting standard search query terms
   * while incorporating synonym expansions and AI advanced keywords context.
   */
  public search(query: string, aiExpandedKeywords: string[] = []): Product[] {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0 && !aiExpandedKeywords?.length) {
      return Array.from(this.index.products.values());
    }

    const vocabulary = Array.from(this.index.wordToProducts.keys());
    let intersectedIds: Set<string> | null = null;

    // 1. Core user query tokens resolution via AND intersection
    if (tokens.length > 0) {
      for (const token of tokens) {
        const tokenProductIds = this.getProductIdsForToken(token, vocabulary);
        
        if (intersectedIds === null) {
          intersectedIds = new Set(tokenProductIds);
        } else {
          intersectedIds = new Set([...intersectedIds].filter(id => tokenProductIds.has(id)));
        }
      }
    }

    // 2. Union with AI expanded keywords context matched results (for fallback/supplementary discovery)
    if (aiExpandedKeywords && aiExpandedKeywords.length > 0) {
      const aiMatchedIds = new Set<string>();
      for (const kw of aiExpandedKeywords) {
        const kwLower = kw.toLowerCase().trim();
        if (!kwLower) continue;
        
        for (const vocabWord of vocabulary) {
          if (
            BilingualSearchEngine.containsWholeWord(vocabWord, kwLower) || 
            BilingualSearchEngine.containsWholeWord(kwLower, vocabWord) || 
            BilingualSearchEngine.wordsAreSimilar(kwLower, vocabWord)
          ) {
            const ids = this.index.wordToProducts.get(vocabWord);
            if (ids) {
              for (const id of ids) {
                aiMatchedIds.add(id);
              }
            }
          }
        }
      }

      if (intersectedIds === null || intersectedIds.size === 0) {
        // If no core keywords matched or found active products, activate AI synonym/related discovery as fallback
        intersectedIds = aiMatchedIds;
      } else {
        // If we already have robust exact core matches, do NOT union with arbitrary keyword matches (e.g. "screen" protector) 
        // to prevent unrelated products from cluttering the bottom of the results. 
        // Note: Any high-fidelity synonyms of the query (like "television" for "tv") are already matched above in Step 1.
      }
    }

    if (!intersectedIds || intersectedIds.size === 0) return [];

    const result: Product[] = [];
    for (const id of intersectedIds) {
      const p = this.index.products.get(id);
      if (p) {
        result.push(p);
      }
    }
    return result;
  }
}
