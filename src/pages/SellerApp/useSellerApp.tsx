import { uploadFileViaStorageApi } from "../../lib/upload";

import React, { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { SchemaValidator } from "../../utils/schemaValidation";
import { PhotoQualityGuide } from "../../components/PhotoQualityGuide";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../lib/storage";
import { PriceDisplay } from "../../components/PriceDisplay";
import { Product, Order, SellerProfile, Niche } from "../../types";

import {
  AICopilotWidget,
  StoreSettingsForm
} from './components';
import {
  Package,
  ShoppingCart,
  Settings as SettingsIcon,
  LayoutDashboard,
  LogOut,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  FileText,
  BadgeAlert,
  Coins,
  Send,
  Building,
  Megaphone,
  Zap,
  Tag,
  Store,
  ShieldCheck,
  Bot,
  Camera,
} from "lucide-react";
import { SellerMarketing } from "../../components/seller/SellerMarketing";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface SellerAppProps {
  seller: SellerProfile;
  products: Product[];
  orders: Order[];
  onLogout: () => void;
  lang: "sw" | "en";
  setLang: (lang: "sw" | "en") => void;
  onRefreshData: () => Promise<void>;
  addToast?: (message: string, type: "success" | "error") => void;
}

export function useSellerApp({ seller, products, orders, onLogout, lang, setLang, onRefreshData, addToast }: SellerAppProps) {
  // ... rest of the hook implementation ...
  // inside handleSaveProduct, replace displayAlert with addToast if available
  const [payouts, setPayouts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [batchUpdateModalOpen, setBatchUpdateModalOpen] = useState(false);

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const clearProductSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleBatchUpdate = async (stockUpdates: { productId: string, stock: number }[]) => {
    setSavingProduct(true);
    try {
        await Promise.all(stockUpdates.map(async (update) => {
            const product = products.find(p => p.id === update.productId);
            if (product) {
                await db.saveProduct({ ...product, stock: update.stock });
            }
        }));
        displayAlert(
            lang === "sw" 
                ? "Stoki zimesasishwa kwa mafanikio!" 
                : "Stock levels updated successfully!", 
            "success"
        );
        clearProductSelection();
        setBatchUpdateModalOpen(false);
        onRefreshData();
    } catch (err: any) {
        displayAlert(err.message || "Failed to update stock", "error");
    } finally {
        setSavingProduct(false);
    }
  };

  React.useEffect(() => {
    async function loadPayouts() {
      try {
        const list = await db.getPayouts();
        setPayouts(list.filter((p: any) => p.sellerId === seller.id));
      } catch (err) {
        console.error("Failed to load payouts inside useSellerApp", err);
      }
    }
    loadPayouts();
  }, [seller.id]);

const [tab, setTab] = useState<
    | "dashboard"
    | "products"
    | "orders"
    | "ai_copilot"
    | "marketing"
    | "settings"
    | "booster"
  >("dashboard");
  const [isPayoutRequesting, setIsPayoutRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Screen size detection to avoid rendering hidden 0x0 size layout charts on mobile
  const [isMdScreen, setIsMdScreen] = useState(false);
  React.useEffect(() => {
    const handleResize = () => {
      setIsMdScreen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Premium Booster Checkout states
  const [selectedPlanId, setSelectedPlanId] = useState("sub-gold");
  const [boosterPhone, setBoosterPhone] = useState("");
  const [boosterRef, setBoosterRef] = useState("");
  const [isUpdatingBooster, setIsUpdatingBooster] = useState(false);

  // Order filter state
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  
  // Dialog or Alerts
  const [alertMsg, setAlertMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const displayAlert = (text: string, type: "success" | "error") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const [submittingTraId, setSubmittingTraId] = useState<string | null>(null);

  const handlePostSellerToTra = async (orderId: string) => {
    try {
      setSubmittingTraId(orderId);
      const res = await db.submitTraReceipt(orderId);
      if (res.success) {
        displayAlert("Receipt submitted successfully to TRA!", "success");
        if (typeof onRefreshData === "function") {
          onRefreshData();
        } else {
          window.location.reload();
        }
      }
    } catch (err: any) {
      displayAlert("Posting failed: " + err.message, "error");
    } finally {
      setSubmittingTraId(null);
    }
  };

  // Product state manager
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [nichesList, setNichesList] = useState<Niche[]>([]);

  // Product form states
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodWarranty, setProdWarranty] = useState("");
  const [prodNiche, setProdNiche] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodFamily, setProdFamily] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOldPrice, setProdOldPrice] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodPricingMode, setProdPricingMode] = useState<
    "retail" | "wholesale"
  >("retail");
  const [prodWholesaleTiers, setProdWholesaleTiers] = useState<
    { minQty: number; maxQty?: number; price: number }[]
  >([]);
  const [prodDescription, setProdDescription] = useState("");
  const [prodFeatures, setProdFeatures] = useState<
    { name: string; description: string }[]
  >([]);
  const [showFeatureImport, setShowFeatureImport] = useState(false);
  const [featureImportText, setFeatureImportText] = useState("");
  const [featureImportMode, setFeatureImportMode] = useState<
    "append" | "replace"
  >("append");

  const handleImportFeaturesAction = (text: string) => {
    if (!text.trim()) return;

    const lines = text.split(/\r?\n/);
    const parsed: { name: string; description: string }[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const colonIndex = trimmed.indexOf(":");
      const equalIndex = trimmed.indexOf("=");

      let splitIndex = -1;
      if (colonIndex !== -1 && equalIndex !== -1) {
        splitIndex = Math.min(colonIndex, equalIndex);
      } else if (colonIndex !== -1) {
        splitIndex = colonIndex;
      } else if (equalIndex !== -1) {
        splitIndex = equalIndex;
      }

      if (splitIndex !== -1) {
        const rawKey = trimmed.substring(0, splitIndex).trim();
        const rawVal = trimmed.substring(splitIndex + 1).trim();

        const cleanKey = rawKey.replace(/^[\s\-\*\•\d\.\)]+/, "").trim();
        if (cleanKey) {
          parsed.push({ name: cleanKey, description: rawVal });
        }
      } else {
        const cleanKey = trimmed.replace(/^[\s\-\*\•\d\.\)]+/, "").trim();
        if (cleanKey) {
          parsed.push({ name: cleanKey, description: "" });
        }
      }
    });

    if (parsed.length > 0) {
      if (featureImportMode === "replace") {
        setProdFeatures(parsed);
      } else {
        setProdFeatures([...prodFeatures, ...parsed]);
      }
      setFeatureImportText("");
      setShowFeatureImport(false);
    }
  };

  const handleFeatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("text/") && !file.name.endsWith(".txt")) {
      alert(
        lang === "sw"
          ? "Tafadhali chagua faili la maandishi (.txt)"
          : "Please select a text file (.txt)",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setFeatureImportText(text);
      }
    };
    reader.readAsText(file);
  };
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodVisible, setProdVisible] = useState(true);
  const [prodTaxCode, setProdTaxCode] = useState(1);
  const [prodArrangeTier, setProdArrangeTier] = useState("all");
  const [prodVibe, setProdVibe] = useState("all");
  const [prodPresentationStyle, setProdPresentationStyle] = useState("all");
  const [savingProduct, setSavingProduct] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showQualityGuide, setShowQualityGuide] = useState(false);

  const handleImageFiles = async (inputFiles: File[]) => {
    const slicedFiles = inputFiles.slice(0, 5 - prodImages.length);
    if (slicedFiles.length === 0) return;

    setIsUploading(true);

    // Dynamic Client-side Quality Checker to auto-cancel and reject low quality images for sellers
    const validationResults = await Promise.all(
      slicedFiles.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          return {
            file,
            valid: false,
            reason:
              lang === "sw"
                ? "Aina hii ya faili haikubaliki. Tafadhali pakia picha pekee."
                : "Unsupported file type. Please upload images only.",
          };
        }

        if (file.type.startsWith("video/")) {
          if (file.size > 45 * 1024 * 1024) {
            return {
              file,
              valid: false,
              reason: `Ukubwa wa video umezidi kiwango cha juu cha 45MB (Imeongezeka hadi ${Math.round(file.size / (1024 * 1024))}MB).`,
            };
          }
          return { file, valid: true };
        }

        const check = await new Promise<{ valid: boolean; reason?: string }>(
          (resolve) => {
            // Reject files exceeding max size limits (45MB)
            if (file.size > 45 * 1024 * 1024) {
              resolve({
                valid: false,
                reason: `Ukubwa wa faili umezidi bando la 45MB (${Math.round(file.size / (1024 * 1024))}MB).`,
              });
              return;
            }

            // Reject files under 15 KB (typically extremely small thumbnails or icon files)
            if (file.size < 15360) {
              resolve({
                valid: false,
                reason: `Ukubwa wa faili ni mdogo mno (${Math.round(file.size / 1024)} KB). Tafadhali weka picha iliyohaririwa ya ubora wa juu.`,
              });
              return;
            }

            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              // Height or width less than 500 contains insufficient detail for product display
              if (img.width < 500 || img.height < 500) {
                resolve({
                  valid: false,
                  reason: `Azimio lililogundulika (${img.width}x${img.height}px) ni dogo sana. Inatakiwa iwe angalau 500x500px.`,
                });
                return;
              }

              // Canvas analysis for heavy blur and monochromatic low-contrast indicators
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  canvas.width = Math.min(img.width, 200);
                  canvas.height = Math.min(img.height, 200);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const imgData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                  );
                  const data = imgData.data;

                  let totalLuma = 0;
                  const len = data.length;
                  for (let i = 0; i < len; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
                  }
                  const avgLuma = totalLuma / (len / 4);

                  let varianceSum = 0;
                  for (let i = 0; i < len; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                    varianceSum += Math.pow(luma - avgLuma, 2);
                  }
                  const stdDev = Math.sqrt(varianceSum / (len / 4));

                  // A standard deviation value under 12 typically indicates extreme blurred image or single solid colors
                  if (stdDev < 12) {
                    resolve({
                      valid: false,
                      reason: `Picha inaonekana haina utofautishi mzuri au ina ukungu mwingi sana (Extreme blur or low contrast).`,
                    });
                    return;
                  }
                }
              } catch (e) {
                // Gracefully bypass if canvas context restrictions apply
              }

              resolve({ valid: true });
            };

            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve({
                valid: false,
                reason: "Faili hili si faili la picha halali au limeharibika.",
              });
            };

            img.src = objectUrl;
          },
        );

        return { file, ...check };
      }),
    );

    const validFiles = validationResults
      .filter((r) => r.valid)
      .map((r) => r.file);
    const invalidFiles = validationResults.filter((r) => !r.valid);

    if (invalidFiles.length > 0) {
      const reasonsList = invalidFiles
        .map((r) => `• ${r.file.name}: ${r.reason}`)
        .join("\n");
      displayAlert(
        `Picha zifuatazo zimekataliwa kiotomatiki kwa sababu ya ubora duni au faili kubwa mno (Auto-Cancelled due to quality parameters/limits):\n\n${reasonsList}`,
        "error",
      );
    }

    if (validFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    // Auto-convert valid image files into space-saving compressed high-quality WebP images
    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        if (file.type.startsWith("video/")) {
          return file;
        }
        try {
          const webImage = await new Promise<File>((resolve) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(file);
                return;
              }
              // Compress to 1600px edge bounds for optimized display and size
              let width = img.width;
              let height = img.height;
              const maxDim = 1600;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const originalName = file.name;
                    const baseName =
                      originalName.substring(
                        0,
                        originalName.lastIndexOf("."),
                      ) || originalName;
                    const webFileName = `${baseName}.webp`;
                    const webpCompFile = new File([blob], webFileName, {
                      type: "image/webp",
                      lastModified: Date.now(),
                    });
                    resolve(webpCompFile);
                  } else {
                    resolve(file);
                  }
                },
                "image/webp",
                0.82,
              );
            };
            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(file);
            };
            img.src = objectUrl;
          });
          return webImage;
        } catch (e) {
          return file;
        }
      }),
    );

    const files = processedFiles;

    // Create tracking objects for new uploads
    const newUploads = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      progress: 0,
    }));
    setUploadingFiles(newUploads);

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tracker = newUploads[i];
        const url = await uploadFileViaStorageApi(file, "products", (progress) => {
          setUploadingFiles((prev) =>
            prev.map((item) =>
              item.id === tracker.id
                ? { ...item, progress: Math.round(progress) }
                : item,
            ),
          );
        });
        urls.push(url);
      }
      setProdImages((prev) => {
        // If there is only the default placeholder, replace it. Otherwise append.
        const filtered = prev.filter(
          (p) => !p.includes("photo-1546868871-7041f2a55e12"),
        );
        return [...filtered, ...urls];
      });
    } catch (err: any) {
      displayAlert("Imeshindwa kupakia picha: " + err.message, "error");
    } finally {
      setUploadingFiles([]);
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleImageFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  // Load Niches dynamically from PostgreSQL Drizzle/Supabase cache
  React.useEffect(() => {
    async function loadNiches() {
      try {
        const list = await db.getNiches();
        setNichesList(list || []);
      } catch (err) {
        console.error("Failed to load niches inside SellerApp", err);
      }
    }
    loadNiches();
  }, []);

  // Form helpers
  const openProductForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.name || "");
      setProdSku(product.sku || "");
      setProdWarranty(product.warranty || "");
      setProdNiche(product.niche || "");
      setProdCategory(product.category || "");
      setProdFamily(product.family || "");
      setProdPrice(product.price ? product.price.toString() : "");
      setProdOldPrice(product.oldPrice ? product.oldPrice.toString() : "");
      setProdStock(product.stock ? product.stock.toString() : "0");
      setProdDescription(product.description || "");
      setProdFeatures(product.features || []);
      setProdImages(product.images || []);
      setProdVisible(product.visible !== false);
      setProdTaxCode(product.taxCode || 1);
      setProdArrangeTier(product.arrangeTier || "all");
      setProdVibe(product.vibe || "all");
      setProdPresentationStyle(product.presentationStyle || "all");
      if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
        setProdPricingMode("wholesale");
        setProdWholesaleTiers(product.wholesaleTiers);
      } else {
        setProdPricingMode("retail");
        setProdWholesaleTiers([]);
      }
  } else {
      setEditingProduct(null);
      setProdName("");
      const randNum = Math.floor(100000 + Math.random() * 900000);
      setProdSku(`ORB-${randNum}`);
      setProdWarranty("");
      setProdNiche(nichesList.length > 0 ? nichesList[0].name : "");
      setProdCategory("");
      setProdFamily("");
      setProdPrice("");
      setProdOldPrice("");
      setProdStock("10");
      setProdDescription("");
      setProdFeatures([]);
      setProdImages([]);
      setProdVisible(false);
      setProdTaxCode(1);
      setProdArrangeTier("all");
      setProdVibe("all");
      setProdPresentationStyle("all");
      setProdPricingMode("retail");
      setProdWholesaleTiers([]);
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    let priceNum = parseFloat(prodPrice) || 0;
    const stockNum = parseInt(prodStock) || 0;

    let finalWholesaleTiers =
      prodPricingMode === "wholesale"
        ? prodWholesaleTiers.filter((t) => t.minQty > 0 && t.price > 0)
        : [];
    finalWholesaleTiers = [...finalWholesaleTiers].sort(
      (a, b) => a.minQty - b.minQty,
    );

    if (
      prodPricingMode === "wholesale" &&
      finalWholesaleTiers.length > 0 &&
      !priceNum
    ) {
      const sorted = [...finalWholesaleTiers].sort(
        (a, b) => a.minQty - b.minQty,
      );
      priceNum = sorted[0].price;
    }

    const cleanImages = prodImages
      .map((img) => String(img || "").trim())
      .filter((img) => img && !img.includes("photo-1546868871-7041f2a55e12"));
    const cleanCategory = prodCategory.trim();
    const cleanDescription = prodDescription.trim();

    if (prodVisible) {
      if (!cleanImages.length) {
        displayAlert(
          lang === "sw"
            ? "Huwezi kuchapisha bidhaa live bila angalau picha moja halisi ya bidhaa."
            : "You cannot publish a live product without at least one real product image.",
          "error",
        );
        return;
      }
      if (!prodNiche || !cleanCategory) {
        displayAlert(
          lang === "sw"
            ? "Chagua niche na category kabla ya kuchapisha bidhaa live."
            : "Select both niche and category before publishing the product live.",
          "error",
        );
        return;
      }
      if (cleanDescription.length < 20) {
        displayAlert(
          lang === "sw"
            ? "Maelezo ya bidhaa ni mafupi sana. Ongeza maelezo ya kutosha kabla ya kuchapisha live."
            : "Product description is too short. Add enough detail before publishing live.",
          "error",
        );
        return;
      }
    }

    if (prodOldPrice && Number(prodOldPrice) > 0 && Number(prodOldPrice) <= priceNum) {
      displayAlert(
        lang === "sw"
          ? "Bei ya zamani lazima iwe kubwa kuliko bei ya kuuza ili ionyeshe punguzo sahihi."
          : "Old price must be greater than the selling price to show a valid discount.",
        "error",
      );
      return;
    }

    if (prodPricingMode === "wholesale") {
      const duplicateMinQty = finalWholesaleTiers.some(
        (tier, index) =>
          finalWholesaleTiers.findIndex((item) => item.minQty === tier.minQty) !==
          index,
      );
      if (duplicateMinQty) {
        displayAlert(
          lang === "sw"
            ? "Bei za jumla haziwezi kuwa na kiwango cha idadi kinachojirudia."
            : "Wholesale tiers cannot have duplicate minimum quantities.",
          "error",
        );
        return;
      }
    }

    const payload: Partial<Product> = {
      name: prodName.trim(),
      sku: prodSku.trim(),
      warranty: prodWarranty.trim(),
      niche: prodNiche,
      category: cleanCategory || prodNiche,
      family: prodFamily.trim(),
      price: priceNum,
      oldPrice: prodOldPrice ? parseFloat(prodOldPrice) : undefined,
      stock: stockNum,
      description: cleanDescription,
      features: prodFeatures.filter(
        (f) => f.name.trim() && f.description.trim(),
      ),
      images: cleanImages,
      visible: prodVisible,
      taxCode: prodTaxCode,
      arrangeTier: prodArrangeTier,
      vibe: prodVibe,
      presentationStyle: prodPresentationStyle,
      sellerId: seller.id,
      wholesaleTiers: finalWholesaleTiers,
      tags: [],
    };

    if (editingProduct) {
      payload.id = editingProduct.id;
    }

    // Run custom Zod-like structural validation
    const validation = SchemaValidator.validateProduct(
      payload,
      lang === "sw" ? "sw" : "en",
    );
    if (!validation.success || !validation.data) {
      displayAlert(validation.error || "Product validation failed", "error");
      return;
    }

    setSavingProduct(true);
    try {
      await db.saveProduct(validation.data);
      displayAlert(
        lang === "sw"
          ? "Bidhaa imehifadhiwa kwa ufanisi kwenye duka!"
          : "Product saved successfully into your storefront catalog!",
        "success",
      );

      // Automatic Low Stock Alert
      if (stockNum > 0 && stockNum < 5) {
        const oldProduct = products.find((p) => p.id === payload.id);
        if (!oldProduct || oldProduct.stock >= 5) {
          await sendStockAlert(seller.email, prodName, stockNum, "email", lang);
          if (seller.phone) {
             await sendStockAlert(seller.phone, prodName, stockNum, "sms", lang);
          }
          if (addToast) {
            addToast(
              lang === "sw" 
                ? "Tahadhari ya akiba imetumwa!" 
                : "Stock alert sent!", 
              "success"
            );
          }
        }
      }

      setProductModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      displayAlert(err.message || "Failed to save product", "error");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmMsg =
      lang === "sw"
        ? "Je, uko tayari kufuta kabisa bidhaa hii kutoka kwenye jukwaa?"
        : "Are you sure you want to permanently delete this product from the platform?";
    if (window.confirm(confirmMsg)) {
      try {
        await db.deleteProduct(productId);
        displayAlert(
          lang === "sw"
            ? "Bidhaa imefutwa kikamilifu!"
            : "Product deleted successfully from your storefront!",
          "success",
        );
        onRefreshData();
      } catch (err: any) {
        displayAlert(err.message || "Failed to delete product", "error");
      }
    }
  };

  // 1. Scoped Products belonging to this Seller
  const sellerProducts = useMemo(() => {
    return products.filter((p) => p.sellerId === seller.id);
  }, [products, seller.id]);

  // 2. Scoped Orders belonging to this Seller's products
  const sellerOrders = useMemo(() => {
    return orders.filter((o) =>
      o.items.some((item) => {
        const prod = products.find((p) => p.id === item.productId);
        return prod?.sellerId === seller.id;
      }),
    );
  }, [orders, products, seller.id]);

  const discountSuggestions = useMemo(() => {
    // Select active products FOR THIS SELLER with stock > 0 that have no discount (or oldPrice <= price)
    const eligible = sellerProducts.filter(
      (p) => !!p.id && p.stock > 0 && (!p.oldPrice || p.oldPrice <= p.price),
    );

    // Sort oldest first (to surface older items for sales/promotions)
    const sorted = [...eligible].sort(
      (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
    );

    return sorted.slice(0, 3).map((p) => {
      // Find similar products from OTHER sellers via full products array
      const similarProducts = products.filter(
        (other) =>
          other.sellerId !== p.sellerId &&
          (other.category === p.category || other.niche === p.niche),
      );

      let discountPct = 0;
      let targetPrice = p.price;
      let reasonEn = "";
      let reasonSw = "";

      if (similarProducts.length > 0) {
        const lowestCompetitorPrice = Math.min(
          ...similarProducts.map((s) => s.price),
        );
        if (lowestCompetitorPrice < p.price) {
          const beatPrice = Math.floor(lowestCompetitorPrice * 0.95);
          let rawDiscount = Math.ceil(((p.price - beatPrice) / p.price) * 100);
          discountPct = Math.max(5, Math.min(50, rawDiscount));
          targetPrice = Math.round((p.price * (100 - discountPct)) / 100);
          reasonEn = `Competitors sell similar items as low as ${formatCurrency(lowestCompetitorPrice)}. A ${discountPct}% off matches/beats them to push this item up the Shopping Centre ranks!`;
          reasonSw = `Washindani wanauza chini hadi ${formatCurrency(lowestCompetitorPrice)}. Punguzo la ${discountPct}% litakupa ushindani na kuipandisha bidhaa!`;
        } else {
          discountPct = p.stock > 10 ? 10 : 5;
          targetPrice = Math.round((p.price * (100 - discountPct)) / 100);
          reasonEn = `You're competitive, but this item is unsold. Drop it by ${discountPct}% to feature on the Top Picks section!`;
          reasonSw = `Bei inashindana, lakini mzigo (${p.stock}) umebaki. ${discountPct}% litairudisha kwenye chati!`;
        }
      } else {
        discountPct = p.stock > 10 ? 15 : 10;
        targetPrice = Math.round((p.price * (100 - discountPct)) / 100);
        reasonEn = `High stock (${p.stock}), no discount. A ${discountPct}% off promotion will push this to front page!`;
        reasonSw = `Akiba (${p.stock}) haina punguzo. Promo ya ${discountPct}% itaisukuma mbele kwa wateja!`;
      }

      return {
        product: p,
        discountPct,
        suggestedPrice: targetPrice,
        reasonEn,
        reasonSw,
      };
    });
  }, [sellerProducts, products]);

  const applyQuickDiscount = async (
    prod: Partial<Product>,
    pct: number,
    targetPrice: number,
  ) => {
    try {
      displayAlert(
        lang === "sw"
          ? `Inaweka punguzo la ${pct}% kwa ${prod.name}...`
          : `Applying ${pct}% discount to ${prod.name}...`,
        "success",
      );

      const updatedProd: Partial<Product> = {
        ...prod,
        oldPrice: prod.price,
        price: targetPrice,
      };

      await db.saveProduct(updatedProd);
      onRefreshData();

      displayAlert(
        lang === "sw"
          ? `Punguzo limewekwa kwa mafanikio!`
          : `Discount successfully applied!`,
        "success",
      );
    } catch (e: any) {
      displayAlert(e.message || "Failed to save discount", "error");
    }
  };

  // 3. Financial Computations
  const computedStats = useMemo(() => {
    // Total confirmed earnings from seller's items
    const confirmedOrders = sellerOrders.filter(
      (o) =>
        o.status === "confirmed" ||
        o.status === "shipped" ||
        o.status === "delivered",
    );
    let totalSales = 0;
    let totalItemsSold = 0;

    confirmedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod?.sellerId === seller.id) {
          totalSales += item.price * item.quantity;
          totalItemsSold += item.quantity;
        }
      });
    });

    // Simple month grouping for the Area Chart
    const salesByDay: Record<string, number> = {};
    const swahiliMonths = [
      "Jan",
      "Feb",
      "Mac",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const englishMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const months = lang === "sw" ? swahiliMonths : englishMonths;

    // Prefill last 6 months
    const curMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const mIdx = (curMonth - i + 12) % 12;
      salesByDay[months[mIdx]] = 0;
    }

    confirmedOrders.forEach((o) => {
      const date = new Date(o.date);
      const mLabel = months[date.getMonth()];
      if (salesByDay[mLabel] !== undefined) {
        o.items.forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          if (prod?.sellerId === seller.id) {
            salesByDay[mLabel] += item.price * item.quantity;
          }
        });
      }
    });

    const chartData = Object.keys(salesByDay).map((key) => ({
      name: key,
      Mauzo: salesByDay[key],
    }));

    // Stock level indicators
    const outOfStockCount = sellerProducts.filter((p) => p.stock <= 0).length;
    const lowStockCount = sellerProducts.filter(
      (p) => p.stock > 0 && p.stock <= 5,
    ).length;

    // Retrieve requested payouts
    return {
      totalSales,
      totalItemsSold,
      chartData,
      outOfStockCount,
      lowStockCount,
    };
  }, [sellerOrders, sellerProducts, products, seller.id, lang]);

  // Request payout trigger
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(payoutAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      displayAlert(
        lang === "sw"
          ? "Tafadhali weka kiasi halali cha kutoa."
          : "Please enter a valid payout amount.",
        "error",
      );
      return;
    }
    if (parsedAmount > computedStats.totalSales) {
      displayAlert(
        lang === "sw"
          ? "Kiasi kilichoombwa kinazidi mauzo yako ya jumla."
          : "Requested amount exceeds your aggregate total verified sales completed.",
        "error",
      );
      return;
    }

    setSubmittingPayout(true);
    try {
      await db.savePayout({
        sellerId: seller.id,
        amount: parsedAmount,
        status: "pending",
      });
      displayAlert(
        lang === "sw"
          ? "Ombi la malipo limewasilishwa kwa usahihi kwa Benki ya Orbi!"
          : "Payout request sent successfully to Orbi Bank Admin authorization!",
        "success",
      );
      setPayoutAmount("");
      setIsPayoutRequesting(false);
      onRefreshData();
    } catch (err: any) {
      displayAlert(err.message || "Failed to submit payout", "error");
    } finally {
      setSubmittingPayout(false);
    }
  };

  
  return {
    tab,
    setTab,
    orderStatusFilter,
    setOrderStatusFilter,
    isPayoutRequesting,
    setIsPayoutRequesting,
    payoutAmount,
    setPayoutAmount,
    submittingPayout,
    setSubmittingPayout,
    isMdScreen,
    setIsMdScreen,
    selectedPlanId,
    setSelectedPlanId,
    boosterPhone,
    setBoosterPhone,
    boosterRef,
    setBoosterRef,
    isUpdatingBooster,
    setIsUpdatingBooster,
    alertMsg,
    setAlertMsg,
    displayAlert,
    submittingTraId,
    setSubmittingTraId,
    handlePostSellerToTra,
    productModalOpen,
    setProductModalOpen,
    chartModalOpen,
    setChartModalOpen,
    editingProduct,
    setEditingProduct,
    nichesList,
    setNichesList,
    prodName,
    setProdName,
    prodSku,
    setProdSku,
    prodWarranty,
    setProdWarranty,
    prodNiche,
    setProdNiche,
    prodCategory,
    setProdCategory,
    prodFamily,
    setProdFamily,
    prodPrice,
    setProdPrice,
    prodOldPrice,
    setProdOldPrice,
    prodStock,
    setProdStock,
    prodPricingMode,
    setProdPricingMode,
    prodWholesaleTiers,
    setProdWholesaleTiers,
    prodDescription,
    setProdDescription,
    prodFeatures,
    setProdFeatures,
    showFeatureImport,
    setShowFeatureImport,
    featureImportText,
    setFeatureImportText,
    featureImportMode,
    setFeatureImportMode,
    handleImportFeaturesAction,
    handleFeatureFileChange,
    prodImages,
    setProdImages,
    prodVisible,
    setProdVisible,
    prodTaxCode,
    setProdTaxCode,
    prodArrangeTier,
    setProdArrangeTier,
    prodVibe,
    setProdVibe,
    prodPresentationStyle,
    setProdPresentationStyle,
    savingProduct,
    setSavingProduct,
    isGeneratingDesc,
    setIsGeneratingDesc,
    isUploading,
    setIsUploading,
    uploadingFiles,
    setUploadingFiles,
    isDragActive,
    setIsDragActive,
    showQualityGuide,
    setShowQualityGuide,
    handleImageFiles,
    handleImageUpload,
    openProductForm,
    handleSaveProduct,
    handleDeleteProduct,
    selectedProductIds,
    toggleProductSelection,
    clearProductSelection,
    batchUpdateModalOpen,
    setBatchUpdateModalOpen,
    handleBatchUpdate,
    sellerProducts,
    sellerOrders,
    discountSuggestions,
    applyQuickDiscount,
    computedStats,
    handleRequestPayout,
    payouts,
    sendStockAlert
  };
}

export async function sendStockAlert(recipient: string, productName: string, currentStock: number, channel: 'email' | 'sms', language: 'sw' | 'en') {
  const response = await fetch('/api/talk/send-stock-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, productName, currentStock, channel, language })
  });
  return response.json();
}
