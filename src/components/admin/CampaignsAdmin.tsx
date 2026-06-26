import React, { useState, useEffect } from "react";
import { 
  Megaphone, 
  Users, 
  Trash, 
  Send, 
  History, 
  Tag, 
  Eye, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  ArrowRight, 
  Mail, 
  Phone, 
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useI18n } from "../../pages/AdminApp";
import { useDialog } from "../CustomDialogContext";

interface CampaignHistoryItem {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  couponCode?: string;
  recipientsCount: number;
  filters: {
    role: string;
    status: string;
    sellerCriteria?: string;
    buyerCriteria?: string;
    messageType: string;
  };
  results?: Array<{
    recipientName: string;
    recipientType: string;
    email: string;
    phone: string;
    smsStatus: string;
    emailStatus: string;
    smsError?: string | null;
    emailError?: string | null;
  }>;
}

export function CampaignsAdmin() {
  const { lang, t } = useI18n();
  const { showAlert } = useDialog();

  // Campaign configurations
  const [role, setRole] = useState<"all" | "sellers" | "buyers">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sellerCriteria, setSellerCriteria] = useState<"all" | "no_recent_orders" | "confirmed_unfulfilled" | "top_sellers">("all");
  const [buyerCriteria, setBuyerCriteria] = useState<"all" | "first_time_buyers" | "vip_customers" | "abandoned_cart" | "has_points">("all");
  const [messageType, setMessageType] = useState<"sms" | "email" | "both">("both");

  // Editorial details
  const [promoTitle, setPromoTitle] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [ctaLink, setCtaLink] = useState("https://orbishop.co");

  // Linked Products and Weekend Promo elements
  const [products, setProducts] = useState<any[]>([]);
  const [linkedProductId, setLinkedProductId] = useState("");
  const [isWeekendOffer, setIsWeekendOffer] = useState(false);
  const [linkBasedOnHistory, setLinkBasedOnHistory] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState("");

  // Estimation and stats
  const [allConsumers, setAllConsumers] = useState<any[]>([]);
  const [allSellersList, setAllSellersList] = useState<any[]>([]);
  const [estimatedCount, setEstimatedCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // App running states
  const [sending, setSending] = useState(false);
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CampaignHistoryItem | null>(null);

  // Active sub-view: "compose" | "logs" | "autopilot"
  const [activeScreen, setActiveScreen] = useState<"compose" | "logs" | "autopilot">("compose");

  // Autopilot specific state
  const [autopilotDryRun, setAutopilotDryRun] = useState(true);
  const [autopilotDiscount, setAutopilotDiscount] = useState("ORBISAVE10");
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [autopilotDiagnosticRun, setAutopilotDiagnosticRun] = useState<any | null>(null);
  const [autopilotSuccessReport, setAutopilotSuccessReport] = useState<string | null>(null);

  // Points expiry automation specific state
  const [expiryTaskLoading, setExpiryTaskLoading] = useState(false);
  const [expiryDiagnosticRun, setExpiryDiagnosticRun] = useState<any | null>(null);
  const [expirySuccessReport, setExpirySuccessReport] = useState<string | null>(null);

  // Load baseline customer and seller lists for real-time estimation
  const loadEstimatesBaseline = async () => {
    try {
      setIsLoadingCounts(true);
      
      const cRes = await fetch("/api/v1/customers");
      const cData = await cRes.json();
      
      const sRes = await fetch("/api/v1/settings/sellers");
      const sData = await sRes.json();

      const pRes = await fetch("/api/v1/products");
      const pData = await pRes.json();

      setAllConsumers(Array.isArray(cData) ? cData : (cData.data || []));
      setAllSellersList(Array.isArray(sData) ? sData : (sData.data || []));
      setProducts(pData.success && Array.isArray(pData.data) ? pData.data : []);
    } catch (err) {
      console.error("Failed to load estimation details:", err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Run dynamic target count estimation whenever filtering attributes change
  useEffect(() => {
    let count = 0;
    
    if (role === "all" || role === "buyers") {
      allConsumers.forEach((c, index) => {
        const cStatus = c.status || "active";
        if (status === "active" && cStatus !== "active") return;
        if (status === "inactive" && cStatus === "active") return;

        // Apply buyerCriteria filters matching backend rules
        const pts = c.points !== undefined ? c.points : (130 + ((index * 79) % 870));
        if (buyerCriteria === "has_points" && pts < 150) return;
        if (buyerCriteria === "first_time_buyers" && (index % 3 !== 1)) return;
        if (buyerCriteria === "vip_customers" && (index % 4 !== 0)) return;
        if (buyerCriteria === "abandoned_cart" && (index % 5 !== 2)) return;

        count++;
      });
    }

    if (role === "all" || role === "sellers") {
      allSellersList.forEach((s, index) => {
        const sStatus = s.status || "active";
        if (status === "active" && sStatus !== "active") return;
        if (status === "inactive" && sStatus === "active") return;

        // Apply seller filters matching backend rules
        if (sellerCriteria === "no_recent_orders" && (index % 3 !== 0)) return;
        if (sellerCriteria === "confirmed_unfulfilled" && (index % 4 !== 1)) return;
        if (sellerCriteria === "top_sellers" && (index % 5 !== 3)) return;

        count++;
      });
    }

    setEstimatedCount(count);
  }, [role, status, sellerCriteria, buyerCriteria, allConsumers, allSellersList]);

  // Fetch campaign histories
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/v1/campaigns/history");
      const result = await res.json();
      if (result.success) {
        setCampaignHistory(result.data || []);
      }
    } catch (err) {
      console.error("Error loading campaign history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadEstimatesBaseline();
    fetchHistory();
  }, []);

  const handleExpiryTaskTrigger = async (isRealRun: boolean) => {
    try {
      setExpiryTaskLoading(true);
      setExpirySuccessReport(null);
      
      const res = await fetch("/api/v1/campaigns/trigger-points-expiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: !isRealRun
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Loyalty points expiry scanner task failed");
      }

      setExpiryDiagnosticRun(data);
      if (isRealRun) {
        setExpirySuccessReport(
          lang === "sw" 
            ? `Arifa za Alama Zinazoisha zimetumwa kwa wateja walengwa ${data.matchedTargetsCount}. Wamepewa linki yao binafsi ya 'Komboa Sasa'.`
            : `Success! Expiring point notifications dispatched to ${data.matchedTargetsCount} target customers with single-click 'Redeem Now' paths.`
        );
        showAlert(
          lang === "sw" ? "Mchakato wa Kiotomatiki Umemalizika!" : "Points Expiry Alert Task Finished",
          lang === "sw" 
            ? `Wateja wote walio na alama zinazoisha baada ya siku 7 wametumwa ujumbe wa dharura yenye kiungo cha kuokoa.`
            : `Automated campaign executed. Target messages dispatched containing the Redeem Now CTA button.`
        );
        fetchHistory();
      } else {
        showAlert(
          lang === "sw" ? "Uchunguzi wa Alama Umekamilika (Simulated)" : "Loyalty Expiry Scan Complete (Simulated)",
          lang === "sw"
            ? `Wateja ${data.scannedCount} wamekaguliwa. Wateja ${data.matchedTargetsCount} walengwa walitambuliwa.`
            : `Scanned ${data.scannedCount} customer reward profiles. Identified ${data.matchedTargetsCount} shoppers set to expire in 7 days.`
        );
      }
    } catch (err: any) {
      console.error("Points expiry checker task error:", err);
      showAlert(
        lang === "sw" ? "Mchakato Imeshindikana!" : "Task Execution Failed!",
        err.message || "An error occurred during points checking schedule.",
        "error"
      );
    } finally {
      setExpiryTaskLoading(false);
    }
  };

  const handleAutopilotTrigger = async (isRealRun: boolean) => {
    try {
      setAutopilotLoading(true);
      setAutopilotSuccessReport(null);
      
      const res = await fetch("/api/v1/campaigns/trigger-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: !isRealRun,
          discountCode: autopilotDiscount
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Autopilot event dispatch failed");
      }

      setAutopilotDiagnosticRun(data);
      if (isRealRun) {
        setAutopilotSuccessReport(
          lang === "sw" 
            ? `Mafanikio! Kampeni imetumwa kwa wateja ${data.processedCount}. SMS/Email zimerushwa kupitia Orbi Talk Gateway.`
            : `Success! Autopilot reminders dispatched to ${data.processedCount} customers through the Orbi Talk gateway.`
        );
        showAlert(
          lang === "sw" ? "AI Autopilot Imekamilika!" : "AI Autopilot Complete",
          lang === "sw" 
            ? `Kampeni ya kiotomatiki imekamilika! Wateja ${data.processedCount} wamefikiwa kwa mafanikio.`
            : `Autopilot notifications successfully processed and tracked for ${data.processedCount} targets.`
        );
        // Refresh histories so they show up in logs
        fetchHistory();
      } else {
        showAlert(
          lang === "sw" ? "Uchunguzi wa AI Umekamilika" : "AI Diagnostics Completed",
          lang === "sw"
            ? `Mchakato umemaliza uchunguzi. Rukwama ${data.pendingCartsAnalyzed} na Oda ${data.uncompletedOrdersAnalyzed} zimechambuliwa kwa mafanikio.`
            : `Evaluated ${data.pendingCartsAnalyzed} abandoned carts and ${data.uncompletedOrdersAnalyzed} uncompleted orders.`
        );
      }
    } catch (err: any) {
      console.error(err);
      showAlert(
        lang === "sw" ? "Hitilafu ya Autopilot" : "Autopilot Execution Failed",
        err.message || "An unexpected error occurred during execution."
      );
    } finally {
      setAutopilotLoading(false);
    }
  };

  // Built-in campaign & promo templates
  const presets = [
    {
      id: "promo_sellers_guide",
      titleSw: "Ongeza Mauzo ya Duka Lako - Mwongozo wa ORBI Shop kwa Wauzaji",
      titleEn: "Grow Your Store - ORBI Shop Seller Guide",
      bodySw: "Habari [Muuzaji Name], ORBI Shop imekuandalia mwongozo wa kuongeza mauzo, kuboresha orodha ya bidhaa zako, na kujenga uaminifu kwa wateja. Fungua mwongozo hapa: [Link]",
      bodyEn: "Hello [Muuzaji Name], ORBI Shop has prepared a seller guide to help you boost sales, improve your listings, and build buyer trust. Open the guide here: [Link]",
      role: "sellers",
      sellerCriteria: "all",
      messageType: "both"
    },
    {
      id: "promo_buyers_deals",
      titleSw: "Ofa Kubwa ya Wiki! Fursa ya Kununua kwa Bei Nafuu",
      titleEn: "Weekly Deal Alert! Buy Safely at Better Prices",
      bodySw: "Habari [Customer Name], kuna ofa mpya kwenye ORBI Shop kwa ajili yako. Nunua kwa amani kupitia mfumo salama wa escrow na upate bidhaa kutoka kwa wauzaji waliothibitishwa. Fungua ofa hapa: [Link]",
      bodyEn: "Hello [Customer Name], there is a new ORBI Shop offer waiting for you. Shop with confidence through our secure escrow system and verified sellers. Open the offer here: [Link]",
      role: "buyers",
      buyerCriteria: "all",
      messageType: "both"
    },
    {
      id: "promo_discount",
      titleSw: "Punguzo Kabambe la Orbi Shop!",
      titleEn: "Exclusive Orbi Shop Discounts!",
      bodySw: "Habari [Customer Name], tunakuletea punguzo maalumu kwa siku ya leo! Tumia msimbo wa [PROMO_CODE] kupata punguzo duka zima sasa. Tembelea hapa: [Link]",
      bodyEn: "Hi [Customer Name], we have a special discount just for you today! Enter coupon code [PROMO_CODE] at checkout to redeem. Shop here: [Link]",
      role: "buyers",
      buyerCriteria: "all",
      messageType: "both"
    },
    {
      id: "points_redemption",
      titleSw: "Mtumie Zawadi: Badilisha Alama zako kuwa Pesa/Bidhaa!",
      titleEn: "Redeem Your Accumulated Loyalty Points Now!",
      bodySw: "Habari [Customer Name], una jumla ya alama za zawadi [POINTS] ambazo ni sawa na punguzo la [POINTS_VALUE] leo! Je, ungependa kupata bidhaa ya [PRODUCT_NAME] inayouzwa kwa [PRODUCT_PRICE]? Kamilisha ununuzi hapa ili uokoe pesa: [Link]",
      bodyEn: "Hi [Customer Name], you currently hold [POINTS] reward points worth a total of [POINTS_VALUE] cash discount! Use them to claim the featured product [PRODUCT_NAME] today (priced at [PRODUCT_PRICE]) at checkout: [Link]",
      role: "buyers",
      buyerCriteria: "has_points",
      messageType: "both"
    },
    {
      id: "weekend_special",
      titleSw: "Ofa ya Mlipuko ya Wikiendi hii tu!",
      titleEn: "Special Weekend Flash Sale Madness!",
      bodySw: "Mambo vipi [Customer Name], tunakuletea orodha ya bidhaa za wikiendi hii pekee! Bidhaa yetu ya leo ni [PRODUCT_NAME] kwa [PRODUCT_PRICE] tu! Nunua hapa upate na kuponi ya [PROMO_CODE]: [Link]",
      bodyEn: "Hi [Customer Name], dive into our exclusive Weekend Flash Sale! Featured item: [PRODUCT_NAME] for only [PRODUCT_PRICE]! Apply coupon code [PROMO_CODE] during order completion: [Link]",
      role: "buyers",
      buyerCriteria: "all",
      messageType: "both"
    },
    {
      id: "top_sellers_boost",
      titleSw: "Hongera kwa Kuwa miongoni mwa Wauzaji Maarufu!",
      titleEn: "Congratulations Top Seller!",
      bodySw: "Mambo vipi [Muuzaji Name], duka lako limetambuliwa kama Top Seller leo! Tembelea kiungo chako kuweka bidhaa zaidi na kuongeza nafasi ya kuonekana: [Link]",
      bodyEn: "Hello [Muuzaji Name], you have been recognized as a Top Seller today! Update your products to capture double visibility: [Link]",
      role: "sellers",
      sellerCriteria: "top_sellers",
      messageType: "email"
    },
    {
      id: "inactive_seller",
      titleSw: "Hakuna mauzo ya duka kwa siku 30?",
      titleEn: "No shop orders in the last 30 days?",
      bodySw: "Ndugu [Muuzaji Name], tangu uanze haujapata mauzo mapya hivi karibuni. Angalia bidhaa zako, boresha picha, na uanze kuvutia wateja wetu wepesi leo kwa kupakia katalogi mpya hapa: [Link]",
      bodyEn: "Dear [Muuzaji Name], we noticed no recent orders over the past month. Revamp your item listings, upgrade your photos and publish fresh stock now to stimulate demand: [Link]",
      role: "sellers",
      sellerCriteria: "no_recent_orders",
      messageType: "sms"
    },
    {
      id: "abandoned_cart",
      titleSw: "Umesahau Kikapu Chako?",
      titleEn: "Did you forget your shopping cart?",
      bodySw: "Habari [Customer Name], bado una bidhaa zilizobaki kwenye kikapu chako! Hatua moja tu imebaki kukamilisha ununuzi. Tumia kuponi [PROMO_CODE] kupata punguzo la duka sasa: [Link]",
      bodyEn: "Hi [Customer Name], you still have items pending in your standard shopping cart! Complete your checkout in light speed with code [PROMO_CODE] today: [Link]",
      role: "buyers",
      buyerCriteria: "abandoned_cart",
      messageType: "both"
    }
  ];

  const loadPreset = (presetId: string) => {
    const pr = presets.find(p => p.id === presetId);
    if (!pr) return;

    setSelectedPresetId(presetId);
    setPromoTitle(lang === "sw" ? pr.titleSw : pr.titleEn);
    setMessageBody(lang === "sw" ? pr.bodySw : pr.bodyEn);
    setRole(pr.role as any);
    setMessageType(pr.messageType as any);
    
    if (pr.role === "sellers") {
      setSellerCriteria(pr.sellerCriteria as any);
    } else {
      setBuyerCriteria(pr.buyerCriteria as any);
    }

    // Smart default triggers based on preset type
    if (presetId === "weekend_special") {
      setIsWeekendOffer(true);
    } else {
      setIsWeekendOffer(false);
    }

    if (presetId === "points_redemption") {
      setDiscountCode("LOYALTY5");
    } else {
      setDiscountCode(presetId.includes("discount") || presetId.includes("cart") ? "DUKA20" : "");
    }

    // Link first product as default if available and linked product tags present
    if (products.length > 0 && (presetId === "points_redemption" || presetId === "weekend_special")) {
      setLinkedProductId(products[0].id);
    }

    showAlert(
      lang === "sw" ? "Template ya Kampeni Imepakiwa!" : "Campaign Template Loaded!",
      lang === "sw" ? "Maudhui ya utangazaji na vigezo vimebadilishwa." : "Preset placeholders and filters successfully applied."
    );
  };

  const insertVariable = (tag: string) => {
    setMessageBody(prev => prev + tag);
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim()) {
      showAlert(lang === "sw" ? "Tafadhali weka kichwa cha habari!" : "Please provide a campaign title!", "error");
      return;
    }
    if (!messageBody.trim()) {
      showAlert(lang === "sw" ? "Tafadhali andika ujumbe!" : "Please write a campaign body text!", "error");
      return;
    }

    const confirmMsg = lang === "sw" 
      ? `Je, una uhakika unataka kutuma ujumbe huu kwa takriban watumiaji waliolengwa sahihi?`
      : `Are you absolutely sure you want to broadcast this targeted message to the matched cohort?`;
    
    if (!confirm(confirmMsg)) return;

    setSending(true);

    try {
      const response = await fetch("/api/v1/campaigns/send-targeted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          status,
          sellerCriteria,
          buyerCriteria,
          messageType,
          promoTitle,
          discountCode,
          messageBody,
          ctaLink,
          linkedProductId: linkedProductId || undefined,
          isWeekendOffer,
          presetId: selectedPresetId
        })
      });

      const data = await response.json();
      if (data.success) {
        showAlert(
          lang === "sw" 
            ? `Kampeni imetumwa salama kwa wateja ${data.sentCount}!`
            : `Campaign broadcast completed to ${data.sentCount} users successfully!`,
          "success"
        );
        // Reset inputs
        setPromoTitle("");
        setMessageBody("");
        setDiscountCode("");
        setSelectedPresetId("");
        // Load counts & history anew
        loadEstimatesBaseline();
        fetchHistory();
      } else {
        showAlert(data.error || "Broadcast error occurred.", "error");
      }
    } catch (err: any) {
      showAlert(err.message || "Failed to initiate campaign broadcast.", "error");
    } finally {
      setSending(false);
    }
  };

  const getMatchedStyle = (status: string) => {
    switch (status) {
      case "sent":
      case "simulated":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "failed":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm" id="campaigns-and-custom-broadcasts">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-6 mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Megaphone className="text-accent animate-pulse" size={24} />
            {lang === "sw" ? "Kampeni & Matangazo ya Kulenga" : "Targeted Broadcasts & Campaigns"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === "sw" 
              ? "Unda na utume barua pepe au SMS kwa wauzaji na wanunuzi ukitumia vigezo vya mienendo." 
              : "Dispatch transactional coupons, status boosts or customer prompts via SMS/Email using cohort filters."}
          </p>
        </div>

        {/* NAVIGATION TOGGLES */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto gap-0.5">
          <button
            onClick={() => { setActiveScreen("compose"); setSelectedLog(null); }}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 text-[11px] font-black uppercase rounded-xl flex-1 sm:flex-initial transition ${activeScreen === "compose" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Plus size={13} />
            {lang === "sw" ? "Unda Kampeni" : "New Campaign"}
          </button>
          
          <button
            onClick={() => { setActiveScreen("autopilot"); setSelectedLog(null); }}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 text-[11px] font-black uppercase rounded-xl flex-1 sm:flex-initial transition ${activeScreen === "autopilot" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
          >
            <Megaphone size={13} className="text-indigo-600 animate-pulse" />
            {lang === "sw" ? "AI Kiotomatiki" : "AI Autopilot"}
          </button>

          <button
            onClick={() => setActiveScreen("logs")}
            className={`flex items-center justify-center gap-2 px-3.5 py-2 text-[11px] font-black uppercase rounded-xl flex-1 sm:flex-initial transition ${activeScreen === "logs" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
          >
            <History size={13} />
            {lang === "sw" ? "Kumbukumbu" : "History Log"}
          </button>
        </div>
      </div>

      {activeScreen === "compose" ? (
        <form onSubmit={handleSendCampaign} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: FILTER SEGMENT OPTIONS AND PRESET TEMPLATES */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* AUDIENCE MATCH CARD */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-6 rounded-3xl border border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8"></div>
              <h3 className="text-xs font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5 mb-3">
                <Users size={14} />
                {lang === "sw" ? "Kikundi Kilicholengwa" : "Matched Cohort Size"}
              </h3>
              
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-black text-slate-900">
                  {isLoadingCounts ? (
                    <span className="inline-block animate-bounce">...</span>
                  ) : (
                    estimatedCount
                  )}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {lang === "sw" ? "watumiaji kulingana na vigezo" : "matched contacts"}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-200/50 flex flex-col gap-2 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Target:</span>
                  <strong className="uppercase">{role === "all" ? "Sellers & Buyers" : role}</strong>
                </div>
                {role === "sellers" && sellerCriteria !== "all" && (
                  <div className="flex justify-between">
                    <span>Seller Class:</span>
                    <strong className="text-orange-700 uppercase">{sellerCriteria.replace(/_/g, " ")}</strong>
                  </div>
                )}
                {role === "buyers" && buyerCriteria !== "all" && (
                  <div className="flex justify-between">
                    <span>Buyer Class:</span>
                    <strong className="text-indigo-800 uppercase">{buyerCriteria.replace(/_/g, " ")}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  <strong className="uppercase">{status === "all" ? "Both active & inactive" : status}</strong>
                </div>
              </div>
            </div>

            {/* SEGMENTATION FORM */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                {lang === "sw" ? "Vigezo vya Kulenga" : "Audiences Filtering Settings"}
              </h3>

              {/* ROLE FILTER */}
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">{lang === "sw" ? "Kundi la Watengenezaji" : "User Type"}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="rounded-xl border-slate-300 text-sm focus:ring-accent focus:border-accent p-2 bg-white"
                >
                  <option value="all">{lang === "sw" ? "Zote (Wanunuzi na Wauzaji)" : "All (Buyers & Sellers)"}</option>
                  <option value="sellers">{lang === "sw" ? "Wauzaji Tu (Sellers)" : "Sellers Only"}</option>
                  <option value="buyers">{lang === "sw" ? "Wanunuzi Tu (Buyers / Consumers)" : "Buyers Only"}</option>
                </select>
              </div>

              {/* USER ACCOUNT STATUS */}
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">{lang === "sw" ? "Hali ya Akaunti" : "Account Status"}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="rounded-xl border-slate-300 text-sm focus:ring-accent focus:border-accent p-2 bg-white"
                >
                  <option value="all">{lang === "sw" ? "Akaunti Zote" : "Both Active & Frozen"}</option>
                  <option value="active">{lang === "sw" ? "Akaunti Zinazofanya kazi tu" : "Active Profiles Only"}</option>
                  <option value="inactive">{lang === "sw" ? "Akaunti Zilizogandishwa tu" : "Frozen/Inactive Only"}</option>
                </select>
              </div>

              {/* SELLER SPECIFIC FILTER */}
              {role === "sellers" && (
                <div className="flex flex-col gap-1 p-3 bg-orange-100/50 rounded-2xl border border-orange-200/50">
                  <label className="text-orange-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {lang === "sw" ? "Vigezo Maalumu vya Wauzaji" : "Dynamic Seller Rule"}
                  </label>
                  <select
                    value={sellerCriteria}
                    onChange={(e) => setSellerCriteria(e.target.value as any)}
                    className="rounded-xl border-orange-200 mt-1.5 text-sm p-2 bg-white"
                  >
                    <option value="all">{lang === "sw" ? "Wauzaji Wote" : "All Eligible Stores"}</option>
                    <option value="no_recent_orders">{lang === "sw" ? "Hakuna mauzo kwa siku 30" : "Inactive last 30 days"}</option>
                    <option value="confirmed_unfulfilled">{lang === "sw" ? "Wana oda zisizoshughulikiwa" : "With unfulfilled active orders"}</option>
                    <option value="top_sellers">{lang === "sw" ? "Muuzaji Maarufu (High Volume)" : "Top Traders (High Performance)"}</option>
                  </select>
                </div>
              )}

              {/* BUYER SPECIFIC FILTER */}
              {role === "buyers" && (
                <div className="flex flex-col gap-1 p-3 bg-indigo-100/40 rounded-2xl border border-indigo-200/40">
                  <label className="text-indigo-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    {lang === "sw" ? "Vigezo Maalumu vya Wanunuzi" : "Dynamic Buyer Rule"}
                  </label>
                  <select
                    value={buyerCriteria}
                    onChange={(e) => setBuyerCriteria(e.target.value as any)}
                    className="rounded-xl border-indigo-200 mt-1.5 text-sm p-2 bg-white"
                  >
                    <option value="all">{lang === "sw" ? "Wateja Wote" : "All Registered Customers"}</option>
                    <option value="has_points">{lang === "sw" ? "Wateja Walio na Alama/Pointi za Uaminifu" : "Target Customers with Active Loyalty Points"}</option>
                    <option value="first_time_buyers">{lang === "sw" ? "Wanunuzi wa Mara ya Kwanza (Oda 1)" : "First-time Buyers (Exactly 1 log)"}</option>
                    <option value="vip_customers">{lang === "sw" ? "Wateja Mashuhuri (VIP)" : "VIP Buyers (3+ logs / High Value)"}</option>
                    <option value="abandoned_cart">{lang === "sw" ? "Walioacha Kikapu Nyeupe (Oda 0)" : "Abandoned cart (0 successful orders)"}</option>
                  </select>
                </div>
              )}

              {/* DELIVERY METHOD CHANNELS */}
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold text-xs uppercase tracking-wider">{lang === "sw" ? "Njia ya Kusafirisha Ujumbe" : "Dissemination Channel"}</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(["both", "sms", "email"] as const).map(ch => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => setMessageType(ch)}
                      className={`py-2 px-1 text-xs font-black uppercase tracking-wider rounded-xl border text-center transition ${messageType === ch ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                    >
                      {ch === "both" ? "ZOTE" : ch.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PRESET CAMPAIGNS & PROMOTIONAL TEMPLATES */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Tag size={14} className="text-accent" />
                {lang === "sw" ? "Mifano ya Templates" : "Promo Templates Presets"}
              </h3>
              <p className="text-[11px] text-slate-500 p-1 bg-white rounded-lg leading-relaxed border border-slate-100">
                {lang === "sw" 
                  ? "Bofya template chini ili upandishe vigezo na andiko la kiswahili au kiingereza papo hapo!" 
                  : "Load a fast targeted draft with prefilled parameters instantly."}
              </p>

              <div className="flex flex-col gap-2">
                {presets.map(ps => (
                  <button
                    type="button"
                    key={ps.id}
                    onClick={() => loadPreset(ps.id)}
                    className="p-3 text-left rounded-xl bg-white border border-slate-200 hover:border-slate-800 hover:shadow-xs transition flex flex-col gap-1"
                  >
                    <span className="text-xs font-black font-semibold uppercase tracking-tight text-slate-800 shrink-0">
                      {ps.id.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-full">
                      {lang === "sw" ? ps.titleSw : ps.titleEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: MESSAGE COMPOSER AND PREVIEW */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col gap-4">
              
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                {lang === "sw" ? "Andaa Ujumbe Wako Maalum" : "Campaign & Broadcast Composer"}
              </h3>

              {/* PROP: TITLE */}
              <div className="flex flex-col gap-1">
                <label className="text-slate-600 font-semibold text-xs">{lang === "sw" ? "Kichwa cha Kampeni / Subject:" : "Campaign Title / Email Subject:"}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === "sw" ? "Mf. Zawadi Maalumu ya Wiki..." : "E.g. Weekend Special Gift For You..."}
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="rounded-xl border-slate-300 text-sm focus:ring-accent focus:border-accent p-2.5 bg-white"
                />
              </div>

              {/* GRID: COUPON CODE AND TARGET CTA LINK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-600 font-semibold text-xs">{lang === "sw" ? "Kuponi ya Punguzo (Hiari):" : "Coupon Discount (Optional):"}</label>
                  <input
                    type="text"
                    placeholder="Mf. ORBI20"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="rounded-xl border-slate-300 text-sm focus:ring-accent focus:border-accent p-2.5 bg-white font-mono uppercase"
                  />
                  <span className="text-[10px] text-slate-500 tracking-wide">
                    {lang === "sw" ? "Hii kadi itaingizwa badala ya [PROMO_CODE]" : "Will substitute parameter [PROMO_CODE]"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-600 font-semibold text-xs">{lang === "sw" ? "Kiungo Maalum cha CTA (Hiari):" : "Action CTA Link (Optional):"}</label>
                  <input
                    type="text"
                    placeholder="https://orbishop.co"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="rounded-xl border-slate-300 text-sm focus:ring-accent focus:border-accent p-2.5 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 tracking-wide">
                    {lang === "sw" ? "Hai hitaji imeingizwa badala ya [Link]" : "Will substitute parameter [Link]"}
                  </span>
                </div>
              </div>

              {/* BRAND NEW: PROMO ENHANCERS, LINKED PRODUCTS & WEEKEND SPECIALS */}
              <div className="p-4 bg-amber-50/75 rounded-2xl border border-amber-200/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Select Linked to Campaign based on user interest/history */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-amber-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    {lang === "sw" ? "Unganisha Bidhaa kwa Promoshoni" : "Link Targeted Product for Promotion"}
                  </label>
                  <select
                    value={linkedProductId}
                    onChange={(e) => {
                      setLinkedProductId(e.target.value);
                      if (e.target.value) {
                        const prod = products.find(p => p.id === e.target.value);
                        if (prod && !messageBody.includes("[PRODUCT_NAME]")) {
                          showAlert(
                            lang === "sw" ? "Kidokezo cha Kazi!" : "Useful Protip!",
                            lang === "sw" 
                              ? "Kumbuka kutumia [PRODUCT_NAME] na [PRODUCT_PRICE] kwenye ujumbe kuingiza taarifa za bidhaa hii kiotomatiki!"
                              : "Be sure to insert [PRODUCT_NAME] and [PRODUCT_PRICE] in the text area to feed product detail dynamic values!"
                          );
                        }
                      }
                    }}
                    className="rounded-xl border-amber-200 text-sm p-2 bg-white text-slate-800"
                  >
                    <option value="">{lang === "sw" ? "-- Hakuna Kitu Chochote kilichounganishwa --" : "-- No Linked Product --"}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (TSh {Number(p.price).toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="checkbox"
                      id="linkBasedOnHistory"
                      checked={linkBasedOnHistory}
                      onChange={(e) => setLinkBasedOnHistory(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <label htmlFor="linkBasedOnHistory" className="text-[10px] text-amber-800 cursor-pointer">
                      {lang === "sw" 
                        ? "Pekecha kiotomatiki kulingana na historia ya ununuzi ya mteja" 
                        : "Match dynamically using each user's purchase history categories"}
                    </label>
                  </div>
                </div>

                {/* Weekend Promotion Urgency toggle */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-amber-200 shadow-3xs">
                    <input
                      type="checkbox"
                      id="isWeekendOfferCheck"
                      checked={isWeekendOffer}
                      onChange={(e) => setIsWeekendOffer(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 mt-0.5"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="isWeekendOfferCheck" className="text-amber-900 font-bold text-xs select-none cursor-pointer flex items-center gap-1">
                        🚀 {lang === "sw" ? "Ofa ya Wikiendi (Weekend Special)" : "Weekend Deal Trigger"}
                      </label>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {lang === "sw"
                          ? "Inaweka nembo ya Mlipuko ya Wikiendi wiki hii mwanzo na mwishoni mwa ujumbe kiotomatiki!"
                          : "Auto-wraps campaign text with High-converted Weekend Special graphics and limits!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTRAL WRITE-UP AREA */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 font-semibold text-xs">
                    {lang === "sw" ? "Mwili wa Ujumbe wako:" : "Campaign Message Body Content:"}
                  </label>
                  
                  {/* INSERTABLE DYNAMIC DATA VARIABLES HELPERS */}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider mr-1 uppercase">Bofya kuingiza:</span>
                    {(["[Customer Name]", "[Muuzaji Name]", "[PROMO_CODE]", "[Discount]", "[Link]", "[POINTS]", "[POINTS_VALUE]", "[PRODUCT_NAME]", "[PRODUCT_PRICE]"] as const).map(tag => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => insertVariable(tag)}
                        className="text-[9px] font-mono font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-850 rounded px-1.5 py-0.5 transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  required
                  rows={8}
                  placeholder={
                    lang === "sw" 
                      ? "Andika andiko lako la uendelezaji hapa..." 
                      : "Type your promo or custom campaign copy here..."
                  }
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="rounded-3xl border-slate-300 text-sm focus:ring-accent focus:border-accent p-4 bg-white font-sans text-slate-800 leading-relaxed"
                />
              </div>

              {/* COMPOSITION SUBMIT TRIGGER */}
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto bg-primary text-white hover:opacity-90 px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {sending ? (
                    <>
                      <span className="inline-block animate-spin mr-1">⌛</span>
                      {lang === "sw" ? "KUTUMA..." : "SENDING BROADCAST..."}
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      {lang === "sw" ? "TUMA ILIYOANDALIWA" : "SEND BROADCAST NOW"}
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* LIVE CONTEXTUAL BRAND PREVIEWS */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-4 flex items-center gap-1.5">
                <Eye size={14} className="text-accent" />
                {lang === "sw" ? "Uhakiki wa Muonekano" : "Live Visual Rendering Mockups"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SMS MOCKUP */}
                {(messageType === "sms" || messageType === "both") && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Phone size={10} /> {lang === "sw" ? "Kwenye Simu (SMS Preview)" : "Incoming SMS Alert"}
                    </span>
                    <div className="bg-slate-900 text-white rounded-[2rem] p-4 font-mono select-none border-4 border-slate-800 shadow-md">
                      <div className="flex justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2 mb-2 font-semibold">
                        <span>💬 SMS Alert</span>
                        <span>Now</span>
                      </div>
                      <div className="text-slate-100 text-[11px] leading-relaxed break-words font-sans bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
                        <strong className="text-accent block text-xs uppercase mb-1">ORBI SHOP</strong>
                        {messageBody ? messageBody
                          .replace(/\[Customer Name\]/g, "Amadi Peter")
                          .replace(/\[Muuzaji Name\]/g, "Musa Apparel")
                          .replace(/\[PROMO_CODE\]/g, discountCode || "DUKA20")
                          .replace(/\[Link\]/g, ctaLink)
                          .replace(/\[Discount\]/g, discountCode ? `${discountCode}` : "DUKA20")
                          : "Ujumbe wako utaonekana hapa..."
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* EMAIL MOCKUP */}
                {(messageType === "email" || messageType === "both") && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Mail size={10} /> {lang === "sw" ? "Kwenye Barua Pepe (Email Preview)" : "Incoming Email Screen"}
                    </span>
                    <div className="bg-white text-slate-800 rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col font-sans select-none max-h-[280px] overflow-hidden">
                      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 mb-3 text-xs text-slate-500">
                        <div>
                          <strong>From:</strong> Orbi Shop notifications@orbishop.co
                        </div>
                        <div>
                          <strong>Subject:</strong> <span className="font-semibold text-slate-800">{promoTitle || "Habari Mpya"}</span>
                        </div>
                      </div>
                      <div className="text-slate-700 text-xs leading-relaxed overflow-y-auto pr-1">
                        <p className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 mb-2 font-black uppercase text-accent tracking-tighter w-max">
                          ORBI SHOP
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {messageBody ? messageBody
                            .replace(/\[Customer Name\]/g, "Amadi Peter")
                            .replace(/\[Muuzaji Name\]/g, "Musa Apparel")
                            .replace(/\[PROMO_CODE\]/g, discountCode || "DUKA20")
                            .replace(/\[Link\]/g, ctaLink)
                            .replace(/\[Discount\]/g, discountCode ? `${discountCode}` : "DUKA20")
                            : "Mwili wa barua pepe utaonekana hapa..."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </form>
      ) : activeScreen === "autopilot" ? (
        
        /* AI AUTOPILOT MODULE VIEW */
        <div className="flex flex-col gap-6 animate-fade-in text-slate-900">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AUTOPILOT AI CAMPAIGN CARD */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-7 rounded-[2rem] border border-indigo-900 flex flex-col justify-between min-h-[300px] relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-20 -translate-y-20 blur-2xl font-semibold"></div>
              <div>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-indigo-400/30">
                  {lang === "sw" ? "AI Kampeni Kiotomatiki" : "AI Autonomous Autopilot"}
                </span>
                <h3 className="text-xl font-bold mt-3 tracking-tight">
                  {lang === "sw" ? "Nguvu ya Generative AI nchini Tanzania" : "Recover Carts with Bilingual GenAI"}
                </h3>
                <p className="text-[11px] text-indigo-200 mt-2 leading-relaxed max-w-lg">
                  {lang === "sw"
                    ? "Mfumo wetu wa AI unachambua rukwama zilizoachwa na oda zisizokamilika, uatengeneza ujumbe wa utangazaji na maelekezo ya kipekee ya Kiswahili na Kiingereza kisha kuwatumia wateja moja kwa moja."
                    : "Inspect real-time shopper carts and stuck orders. Gemini drafts bilingual, localized Swahili and English reminders, sending them instantly through the integrated Orbi Talk gateway."}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                      {lang === "sw" ? "Kuponi ya Ofa" : "Voucher Code"}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono tracking-wider text-white focus:ring-1 focus:ring-indigo-500 uppercase"
                      value={autopilotDiscount}
                      onChange={(e) => setAutopilotDiscount(e.target.value.toUpperCase())}
                      placeholder="ORBISAVE10"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                      {lang === "sw" ? "Lookback (Masaa)" : "Lookback (Hours)"}
                    </label>
                    <select
                      className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-2.5 py-1.5 text-xs font-sans text-white focus:ring-1 focus:ring-indigo-500"
                      defaultValue="24"
                    >
                      <option value="12">12 {lang === "sw" ? "Masaa" : "Hours"}</option>
                      <option value="24">24 {lang === "sw" ? "Masaa" : "Hours"}</option>
                      <option value="48">48 {lang === "sw" ? "Masaa" : "Hours"}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-5 pt-2 border-t border-indigo-900">
                <button
                  type="button"
                  disabled={autopilotLoading}
                  onClick={() => handleAutopilotTrigger(false)}
                  className="bg-white hover:bg-slate-100 text-indigo-950 font-black text-[10px] uppercase px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {autopilotLoading ? <span className="inline-block animate-spin">●</span> : "🔍"}
                  {lang === "sw" ? "Anza Uchunguzi" : "AI Diagnostics"}
                </button>
                <button
                  type="button"
                  disabled={autopilotLoading}
                  onClick={() => handleAutopilotTrigger(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[10px] uppercase px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {autopilotLoading ? <span className="inline-block animate-spin">●</span> : "⚡"}
                  {lang === "sw" ? "Rusha Ujumbe" : "Dispatch AI Reminders"}
                </button>
              </div>
            </div>

            {/* LOYALTY POINTS EXPIRY AUTOMATED TASK CARD */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 text-white p-7 rounded-[2rem] border border-emerald-950 flex flex-col justify-between min-h-[300px] relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full translate-x-20 -translate-y-20 blur-2xl"></div>
              <div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-400/30">
                  {lang === "sw" ? "Mfumo wa Alama wa Kiotomatiki" : "System Loyalty Task Schedule"}
                </span>
                <h3 className="text-xl font-bold mt-3 tracking-tight flex items-center gap-1.5">
                  ⏰ {lang === "sw" ? "Ofa ya Siku 7 Kabla Pointi wepesi Kwisha" : "7-Day Points Expiry Task"}
                </h3>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed max-w-lg">
                  {lang === "sw"
                    ? "Inakagua hifadhidata ya wateja na kuwatambulia wale ambao alama zao za uaminifu zitaisha baada ya siku 7 haswa. Mfumo hutuma barua pepe na SMS zenye dharura kubwa na kitufe cha 'Pawakidhi Sasa / Redeem Now'."
                    : "Task automatically sweeps the customer registry. When a registered buyer has points balance maturing inside 7 days, they receive warning notifications with a prominent direct 'Redeem Now' CTA."}
                </p>

                <div className="bg-emerald-950/20 border border-emerald-800/20 p-3 rounded-2xl mt-4 text-[11px] text-slate-300 flex items-center gap-2">
                  <span className="text-base">🎁</span>
                  <div>
                    <strong>{lang === "sw" ? "Njia ya Haraka ya Ukomboaji:" : "Direct Customer Conversion Path:"}</strong>
                    <span className="block text-[10px] text-emerald-300/80 font-mono mt-0.5">?action=redeem-points (Auto Scroll)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-5 pt-2 border-t border-slate-900">
                <button
                  type="button"
                  disabled={expiryTaskLoading}
                  onClick={() => handleExpiryTaskTrigger(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-white/10"
                >
                  {expiryTaskLoading ? <span className="inline-block animate-spin">●</span> : "🔍"}
                  {lang === "sw" ? "Tazama Walengwa" : "Scan Rewards (Dry)"}
                </button>
                <button
                  type="button"
                  disabled={expiryTaskLoading}
                  onClick={() => handleExpiryTaskTrigger(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {expiryTaskLoading ? <span className="inline-block animate-spin">●</span> : "⚡"}
                  {lang === "sw" ? "Gawa Arifa Moja kwa Moja" : "Dispatch Warning Campaign"}
                </button>
              </div>
            </div>

          </div>

          {autopilotSuccessReport && (
            <div className="bg-emerald-50 text-emerald-800 p-4 px-6 rounded-2xl border border-emerald-100 flex items-center gap-3 text-xs font-bold leading-relaxed shadow-3xs">
              <Check size={18} className="text-emerald-600 flex-shrink-0 animate-pulse" />
              <div>{autopilotSuccessReport}</div>
            </div>
          )}

          {expirySuccessReport && (
            <div className="bg-emerald-50 text-emerald-800 p-4 px-6 rounded-2xl border border-emerald-110 flex items-center gap-3 text-xs font-bold leading-relaxed shadow-3xs animate-fade-in">
              <Check size={18} className="text-emerald-600 flex-shrink-0 animate-bounce" />
              <div>{expirySuccessReport}</div>
            </div>
          )}

          {/* DIAGNOSTIC RUNS RESULTS DISPLAYED IN BEAUTIFUL ACCORDIONS */}
          {autopilotLoading || expiryTaskLoading ? (
            <div className="bg-slate-50 py-20 text-center rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 animate-pulse">
              <span className={`w-10 h-10 border-4 ${expiryTaskLoading ? 'border-emerald-600' : 'border-indigo-600'} border-t-transparent rounded-full animate-spin`}></span>
              <p className="text-xs font-black uppercase text-slate-500 tracking-wider mt-2">
                {expiryTaskLoading 
                  ? (lang === "sw" ? "Inakagua Pointi na Kuandaa Arifa za Siku 7..." : "Sweeping loyalty ledger & generating 7-day alert drafts...") 
                  : (lang === "sw" ? "AI Analeta Taarifa na Kutengeneza Swahili Reminders..." : "AI analyzing carts & synthesizing reminder copies...")
                }
              </p>
            </div>
          ) : expiryDiagnosticRun ? (
            /* POINTS EXPIRY RUN PREVIEWS */
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xs flex flex-col gap-4 animate-fade-in text-slate-900 animate-fade-in">
              <div className="border-b border-slate-100 pb-4 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <span className="text-base font-normal">📅</span>
                    {lang === "sw" ? "Matokeo ya Ukaguzi wa Pointi (7-Day Expiry)" : "7-Day Loyalty Expiry Scan Results"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "sw" 
                      ? "Wateja wafuatao wana alama za uaminifu zinazokaribia kuisha baada ya siku 7."
                      : "The following registered patrons were detected with active rewards set to expire in exactly 7 days."}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <div className="bg-slate-50 text-slate-750 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 flex items-center gap-1 font-mono">
                    👥 {expiryDiagnosticRun.scannedCount} {lang === "sw" ? "Wamekaguliwa" : "Scanned"}
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 text-[10px] font-black rounded-lg border border-emerald-100 flex items-center gap-1">
                    ⏰ {expiryDiagnosticRun.matchedTargetsCount} {lang === "sw" ? "Walengwa Siku 7" : "7-Day Warning Targets"}
                  </div>
                </div>
              </div>

              {expiryDiagnosticRun.results && expiryDiagnosticRun.results.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  {lang === "sw" ? "Hakuna mteja mwenye alama zinazoisha baada ya siku 7 kwa sasa!" : "No buyers found with loyalty balances expiring in exactly 7 days today."}
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-1">
                  {(expiryDiagnosticRun.results || []).map((res: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="border border-emerald-100 p-5 rounded-2xl flex flex-col gap-3 bg-emerald-50/10 hover:border-emerald-300 transition text-slate-950"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">{res.recipientName}</span>
                          </div>
                          {res.phone && (
                            <div className="flex items-center gap-1 text-[11px] font-mono">
                              <span className="opacity-60">📞</span> {res.phone}
                            </div>
                          )}
                          {res.email && (
                            <div className="flex items-center gap-1 text-[11px] font-mono">
                              <span className="opacity-60">✉️</span> {res.email}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <span className="bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                            🪙 {res.points} Pts
                          </span>
                          <span className="bg-rose-50 text-rose-700 font-bold text-[9px] px-2 py-0.5 rounded-md border border-rose-150">
                            Expires: {res.expiryDate}
                          </span>
                        </div>
                      </div>

                      {/* TEXT BOXES FOR SMS AND EMAIL PREVIEWS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {/* SMS CARD */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between shadow-3xs">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block mb-1">
                              💬 SMS Broadcast Copysheet
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/50 p-3 rounded-lg border border-slate-100 break-words font-medium">
                              "{res.smsBody}"
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Channel: Orbi SMS Gateway</span>
                            <span className={res.smsStatus === "simulated" ? "text-amber-500" : res.smsStatus === "sent" ? "text-emerald-500" : "text-slate-450"}>
                              Status: {res.smsStatus}
                            </span>
                          </div>
                        </div>

                        {/* EMAIL CARD */}
                        <div className="bg-white p-4 rounded-xl border border-slate-120 flex flex-col justify-between shadow-3xs">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block mb-1">
                              📧 Styled HTML Email Blueprint
                            </span>
                            <div className="text-xs text-slate-700 space-y-2">
                              <p className="font-bold border-b border-slate-100 pb-1 text-slate-800 bg-slate-50/50 px-2 py-1 rounded">
                                <span className="opacity-60">Subject:</span> {res.emailSubject}
                              </p>
                              
                              {/* SIMULATED HTML EMAIL PREVIEW WITH PROMINENT GREEN CTA REDEEM BUTTON */}
                              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/20 max-h-[160px] overflow-y-auto font-sans text-[11px]">
                                <div className="text-center font-bold text-xs text-emerald-600 mb-2">⏰ Orbi Loyalty Service</div>
                                <p className="mb-2">Hello <strong>{res.recipientName}</strong>,</p>
                                <p className="mb-2">This is an urgent alert that your loyalty balance of <strong>{res.points} active points</strong> expires on <strong>{res.expiryDate}</strong> (literally 7 days from now!).</p>
                                
                                {/* ACTUAL CTA BUTTON IN PREVIEW */}
                                <div className="text-center my-3">
                                  <span className="inline-block bg-emerald-500 text-white font-extrabold text-[10px] px-4 py-2 rounded-lg shadow-sm uppercase select-none cursor-pointer">
                                    🎁 REDEEM NOW / KOMBOA SASA
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-450 text-center">Expires strictly soon. Converts to immediate cash equivalents.</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Channel: Orbi SMTP Secure</span>
                            <span className={res.emailStatus === "simulated" ? "text-amber-500" : res.emailStatus === "sent" ? "text-emerald-500" : "text-slate-450"}>
                              Status: {res.emailStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : autopilotDiagnosticRun ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
              <div className="border-b border-slate-100 pb-4 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <span>📑</span>
                    {lang === "sw" ? "Matokeo ya Uchunguzi wa Autopilot" : "AI Autopilot Diagnostic Analysis"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "sw" 
                      ? "Ifuatayo ni orodha ya wateja waliolengwa pamoja na maudhui yaliyozalishwa na Gemini."
                      : "The following targets were identified. Previews show the personalized copies generated by Gemini."}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <div className="bg-amber-50 text-amber-700 px-3 py-1 text-[10px] font-bold rounded-lg border border-amber-100 flex items-center gap-1">
                    <span>🛒</span> {autopilotDiagnosticRun.pendingCartsAnalyzed} {lang === "sw" ? "Rukwama" : "Carts"}
                  </div>
                  <div className="bg-rose-50 text-rose-700 px-3 py-1 text-[10px] font-bold rounded-lg border border-rose-100 flex items-center gap-1">
                    <span>📦</span> {autopilotDiagnosticRun.uncompletedOrdersAnalyzed} {lang === "sw" ? "Oda" : "Orders"}
                  </div>
                </div>
              </div>

              {autopilotDiagnosticRun.results && autopilotDiagnosticRun.results.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  {lang === "sw" ? "Hakuna wateja waliolengwa kwa sasa kulingana na vigezo vyako!" : "No target buyers identified matching the criteria. All clear!"}
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-1">
                  {(autopilotDiagnosticRun.results || []).map((res: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`border p-5 rounded-2xl flex flex-col gap-3 transition hover:border-slate-300 relative overflow-hidden bg-slate-50/50 ${res.recipientType === "abandoned_cart" ? "border-amber-100" : "border-rose-100"}`}
                    >
                      {/* BANNER TAG */}
                      <div className="absolute top-0 right-0">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl inline-block text-white ${res.recipientType === "abandoned_cart" ? "bg-amber-500" : "bg-rose-500"}`}>
                          {res.recipientType === "abandoned_cart" ? (lang === "sw" ? "Rukwama" : "Abandoned Cart") : (lang === "sw" ? "Oda Isiyokamilika" : "Stuck Order")}
                        </span>
                      </div>

                      {/* CUSTOMER DIRECT REPORT */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600">
                        <div>
                          <span className="font-bold text-slate-800">{res.recipientName}</span>
                        </div>
                        {res.phone && (
                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            <span className="opacity-60">📞</span> {res.phone}
                          </div>
                        )}
                        {res.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="opacity-60">✉️</span> {res.email}
                          </div>
                        )}
                      </div>

                      {/* TEXT BOXES FOR SMS AND EMAIL PREVIEWS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {/* SMS CARD */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-1">
                              💬 Generated SMS Blueprint
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                              "{res.smsBody}"
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Channel: Orbi SMS</span>
                            <span className={res.smsStatus === "simulated" ? "text-amber-500" : res.smsStatus === "sent" ? "text-emerald-500" : "text-slate-400"}>
                              Status: {res.smsStatus}
                            </span>
                          </div>
                        </div>

                        {/* EMAIL CARD */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-1">
                              📧 Generated Email Blueprint
                            </span>
                            <div className="text-xs text-slate-700 space-y-2">
                              <p className="font-bold border-b border-slate-100 pb-1 text-slate-800 bg-slate-50/50 px-2 py-1 rounded">
                                <span className="opacity-60">Subject:</span> {res.emailSubject}
                              </p>
                              <div className="max-h-[100px] overflow-y-auto text-[11px] text-slate-500 leading-relaxed font-normal p-2 whitespace-pre-line">
                                {res.emailBody}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Channel: Orbi Email</span>
                            <span className={res.emailStatus === "simulated" ? "text-amber-500" : res.emailStatus === "sent" ? "text-emerald-500" : "text-slate-400"}>
                              Status: {res.emailStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* EMPTY INITIAL STATE CARD */
            <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <Megaphone className="mx-auto mb-3 opacity-30 text-indigo-500 animate-bounce" size={32} />
              <h4 className="text-sm font-bold text-slate-700">{lang === "sw" ? "Je, uko tayari kurusha mialiko ya AI Autopilot?" : "Ready to pilot Autonomous reminders?"}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {lang === "sw" 
                  ? "Bofya kitufe cha 'Anza Uchunguzi wa AI' hapo juu ili mfumo ukusanye taarifa za rukwama tupu au wateja wenye matatizo na kupendekeza nakala ya Kiswahili ya kutuma."
                  : "Click 'Run AI Diagnostics' to analyze recent shoppers and preview personalized reminder emails generated by Gemini."}
              </p>
            </div>
          )}

        </div>
      ) : (
        
        /* CAMPAIGN HISTORIES LIST VIEW */
        <div className="flex flex-col gap-6">
          
          {loadingHistory && campaignHistory.length === 0 ? (
            <div className="py-20 text-center text-slate-500 font-bold uppercase tracking-wider animate-pulse">
              {lang === "sw" ? "Inapakia kumbukumbu..." : "Loading historical campaign list..."}
            </div>
          ) : campaignHistory.length === 0 ? (
            <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <Megaphone className="mx-auto mb-3 opacity-30 text-slate-500" size={32} />
              <p className="text-sm font-semibold text-slate-500">{lang === "sw" ? "Hakuna kampeni yoyote iliyotumwa bado." : "No campaigns dispatched in history."}</p>
              <button
                onClick={() => setActiveScreen("compose")}
                className="mt-4 inline-flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-black uppercase shadow-sm cursor-pointer"
              >
                {lang === "sw" ? "Unda ya Kwanza Hapa" : "Compose First Campaign"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* HISTORIC CAMPAIGN LIST PANEL */}
              <div className={`flex flex-col gap-3 ${selectedLog ? "lg:col-span-6" : "lg:col-span-12"}`}>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-1">
                  {lang === "sw" ? "Maudhui ya Matoleo Yaliyopita" : "Previous Targeted Dispatches"}
                </h3>

                <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
                  {campaignHistory.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLog(item)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition select-none flex justify-between items-center ${selectedLog?.id === item.id ? "bg-primary/5 border-primary shadow-xs" : "bg-white border-slate-200 hover:border-slate-800"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-primary font-bold px-1.5 py-0.5 rounded-md bg-primary/10 tracking-widest">
                            {item.filters.role}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-semibold">
                            <Clock size={10} />
                            {new Date(item.sentAt).toLocaleString("sw-TZ")}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 truncate pr-4">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-1 mt-1 pr-6">
                          {item.body}
                        </p>

                        <div className="mt-2.5 flex items-center gap-6 text-[11px] text-slate-500">
                          <div>
                            Recipients: <strong className="text-slate-800">{item.recipientsCount}</strong>
                          </div>
                          <div>
                            Channel: <strong className="text-slate-800 font-bold uppercase">{item.filters.messageType}</strong>
                          </div>
                          {item.couponCode && (
                            <div className="bg-orange-50/80 border border-orange-100 text-orange-950 font-bold font-mono px-1 rounded">
                              Code: {item.couponCode}
                            </div>
                          )}
                        </div>
                      </div>

                      <ChevronDown className="text-slate-400 rotate-275 shrink-0 ml-2" size={16} />
                    </div>
                  ))}
                </div>
              </div>

              {/* DYNAMIC SELECTED CAMPAIGN AUDIENCE DELIVERY DETAILS */}
              {selectedLog && (
                <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                  <div className="flex justify-between items-center border-b border-sidebar-divider pb-4 mb-2">
                    <div>
                      <h4 className="font-display font-black text-slate-900 text-sm">
                        {selectedLog.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-widest font-semibold flex items-center gap-1">
                        <Clock size={11} /> {new Date(selectedLog.sentAt).toLocaleString("sw-TZ")}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="bg-white border border-slate-200 hover:border-slate-900 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow-xs transition"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* COHORT DESCRIPTION */}
                  <div className="text-xs bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 leading-relaxed">
                    <strong className="text-slate-900 uppercase text-[10px] tracking-wider font-extrabold text-indigo-900">Broadcasting Message Content:</strong>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedLog.body}</p>
                    
                    {selectedLog.couponCode && (
                      <div className="mt-1 flex items-center gap-2 font-mono text-xs">
                        <span>Coupon Attached:</span>
                        <strong className="bg-orange-100/60 border border-orange-200 text-orange-850 px-1.5 py-0.5 rounded font-black tracking-wide">{selectedLog.couponCode}</strong>
                      </div>
                    )}
                  </div>

                  {/* DELIVERY TRACE RESULTS */}
                  <div className="flex flex-col gap-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex justify-between items-center leading-none mt-2">
                      <span>Detailed Broadcast Delivery Auditing</span>
                      <span className="text-indigo-950 bg-indigo-50 border border-indigo-100 text-[9px] px-1 rounded">{selectedLog.recipientsCount} matched</span>
                    </h5>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto bg-white border border-slate-200 p-3 rounded-2xl">
                      {!selectedLog.results || selectedLog.results.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          {lang === "sw" ? "Hakuna rekodi ya usafirishaji kamili." : "No explicit delivery logs linked inside history metadata."}
                        </div>
                      ) : (
                        selectedLog.results.map((r, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-slate-100 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <strong className="text-slate-900 font-bold truncate max-w-[120px]" title={r.recipientName}>
                                  {r.recipientName}
                                </strong>
                                <span className="text-[8px] bg-slate-150 text-slate-600 px-1 rounded-sm tracking-wider uppercase">
                                  {r.recipientType}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex flex-wrap gap-2 leading-none">
                                {r.phone && <span className="flex items-center gap-0.5"><Phone size={8} /> {r.phone}</span>}
                                {r.email && <span className="flex items-center gap-0.5"><Mail size={8} /> {r.email}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap shrink-0">
                              {r.phone && (
                                <span
                                  className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${getMatchedStyle(r.smsStatus)}`}
                                  title={r.smsStatus === "failed" ? r.smsError || "Fail in talk channel" : "SMS dished via Orbi Talk Gateway"}
                                >
                                  SMS: {r.smsStatus}
                                </span>
                              )}
                              {r.email && (
                                <span
                                  className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${getMatchedStyle(r.emailStatus)}`}
                                  title={r.emailStatus === "failed" ? r.emailError || "Fail in mail server" : "Email delivered"}
                                >
                                  EMAIL: {r.emailStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
