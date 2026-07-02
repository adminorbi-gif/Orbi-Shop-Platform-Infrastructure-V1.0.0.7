import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../lib/db";
import { formatCurrency } from "../../lib/storage";
import { uploadFileViaStorageApi } from "../../lib/upload";
import { Product, MarketplaceAd } from "../../types";
import {
  Megaphone,
  Plus,
  Trash,
  Edit,
  Check,
  X,
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
  MousePointerClick,
  Eye,
  Percent,
  AlertCircle,
  Sparkles,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle,
  HelpCircle,
  Play,
  Pause,
  Upload
} from "lucide-react";

// Auto-calculate current status of a given advertisement based on metrics, dates, and budgets
export function getAdLiveStatus(ad: MarketplaceAd): MarketplaceAd["status"] {
  if (ad.status === "paused") return "paused";
  if (ad.status === "pending") return "pending";
  if (ad.totalSpent >= ad.budgetLimit) return "completed";
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (ad.endDate && now > ad.endDate) return "completed";
  if (ad.startDate && now < ad.startDate) return "scheduled";
  return "active";
}

interface AdsAdminProps {
  lang: "sw" | "en";
  products: Product[];
  currentStaff?: any;
}

export function AdsAdmin({ lang, products, currentStaff }: AdsAdminProps) {
  const [ads, setAds] = useState<MarketplaceAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [alert, setAlert] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form Mode & State
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<MarketplaceAd | null>(null);

  // Form Fields
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adImage, setAdImage] = useState("");
  const [adLink, setAdLink] = useState("");
  const [bidAmount, setBidAmount] = useState(250); // standard TZS bid per click
  const [budgetLimit, setBudgetLimit] = useState(200000); // total prepaid budget limit TZS
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [visible, setVisible] = useState(true);

  // File uploading inside ad creator
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Bid forecasting simulator
  const [simImpressions, setSimImpressions] = useState(15000);
  const [simCtr, setSimCtr] = useState(1.8); // standard avg CTR
  const [simBid, setSimBid] = useState(250);

  // Load existing paid placement ads
  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await db.getAds();
      // Ensure all loaded ads have automated live statuses
      const validatedAds = data.map((ad) => ({
        ...ad,
        status: getAdLiveStatus(ad),
      }));
      setAds(validatedAds);
    } catch (e: any) {
      triggerAlert(lang === "sw" ? "Imeshindwa kupakia matangazo" : "Failed to load ads database", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const triggerAlert = (text: string, type: "success" | "error") => {
    setAlert({ text, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsUploading(true);
    setUploadProgress(15);
    try {
      // Validate bounds
      if (file.size > 15 * 1024 * 1024) {
        throw new Error(lang === "sw" ? "Ukubwa usizidi 15MB" : "Size exceeds 15MB");
      }
      setUploadProgress(40);
      const url = await uploadFileViaStorageApi(file, "promotions");
      setUploadProgress(100);
      setAdImage(url);
      triggerAlert(lang === "sw" ? "Picha imepakiwa vizuri!" : "Image uploaded successfully!", "success");
    } catch (err: any) {
      triggerAlert(err.message, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Create or Update Placement Ad
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim() || !contactEmail.trim() || !adTitle.trim() || !adImage.trim()) {
      triggerAlert(
        lang === "sw" ? "Tafadhali jaza taarifa zote kuu za lazima" : "Please fill out all mandatory fields",
        "error"
      );
      return;
    }

    const adPayload: MarketplaceAd = {
      id: editingAd ? editingAd.id : `AD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      businessName: businessName.trim(),
      contactEmail: contactEmail.trim(),
      title: adTitle.trim(),
      description: adDescription.trim(),
      image: adImage.trim(),
      link: adLink.trim() || "/",
      bidAmount: Number(bidAmount) || 200,
      budgetLimit: Number(budgetLimit) || 100000,
      totalSpent: editingAd ? editingAd.totalSpent : 0,
      startDate: startDate,
      endDate: endDate,
      visible: visible,
      status: "active", // temporary placeholder that gets filtered by getAdLiveStatus
      metrics: editingAd ? editingAd.metrics : { impressions: 0, clicks: 0, ctr: 0 },
      createdAt: editingAd ? editingAd.createdAt : Date.now(),
    };

    adPayload.status = getAdLiveStatus(adPayload);

    // Save list to marketplace SYSTEM_MARKETPLACE_ADS
    const updatedList = editingAd
      ? ads.map((item) => (item.id === editingAd.id ? adPayload : item))
      : [adPayload, ...ads];

    try {
      await db.saveAds(updatedList);
      setAds(updatedList);
      setShowModal(false);
      setEditingAd(null);
      resetForm();
      triggerAlert(
        lang === "sw" ? "Matangazo yamehifadhiwa kikamilifu!" : "Ad Placement saved successfully!",
        "success"
      );
    } catch (err: any) {
      triggerAlert(lang === "sw" ? "Imeshindwa kuhifadhi mabadiliko" : "Could not save campaign details", "error");
    }
  };

  const resetForm = () => {
    setBusinessName("");
    setContactEmail("");
    setAdTitle("");
    setAdDescription("");
    setAdImage("");
    setAdLink("");
    setBidAmount(250);
    setBudgetLimit(200000);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setVisible(true);
    setEditingAd(null);
  };

  const handleEdit = (ad: MarketplaceAd) => {
    setEditingAd(ad);
    setBusinessName(ad.businessName);
    setContactEmail(ad.contactEmail);
    setAdTitle(ad.title);
    setAdDescription(ad.description);
    setAdImage(ad.image);
    setAdLink(ad.link);
    setBidAmount(ad.bidAmount);
    setBudgetLimit(ad.budgetLimit);
    setStartDate(ad.startDate);
    setEndDate(ad.endDate);
    setVisible(ad.visible);
    setShowModal(true);
  };

  const handleToggleStatus = async (adId: string) => {
    const updatedList = ads.map((item) => {
      if (item.id === adId) {
        const nextVisible = !item.visible;
        const nextAd = { ...item, visible: nextVisible };
        nextAd.status = nextVisible ? "active" : "paused";
        // Recalculate based on real scheduling limits
        nextAd.status = getAdLiveStatus(nextAd);
        return nextAd;
      }
      return item;
    });

    try {
      await db.saveAds(updatedList);
      setAds(updatedList);
      triggerAlert(
        lang === "sw" ? "Hali ya tangazo imebadilishwa kikamilifu" : "Campaign status toggled successfully",
        "success"
      );
    } catch (e: any) {
      triggerAlert(lang === "sw" ? "Imeshindwa kubadili hali" : "Could not toggle campaign status", "error");
    }
  };

  const handleDelete = async (adId: string) => {
    if (!window.confirm(lang === "sw" ? "Futa kabisa tangazo hili la kulipia?" : "Remove this paid ad campaign permanently?")) return;

    const updatedList = ads.filter((item) => item.id !== adId);
    try {
      await db.saveAds(updatedList);
      setAds(updatedList);
      triggerAlert(
        lang === "sw" ? "Tangazo limefutwa kutoka sokoni" : "Ad package deleted successfully",
        "success"
      );
    } catch (e: any) {
      triggerAlert(lang === "sw" ? "Imeshindwa kufuta tangazo" : "Could not delete campaign placement", "error");
    }
  };

  const handleApprovePendingAd = async (adId: string) => {
    const updatedList = ads.map((item) => {
      if (item.id === adId) {
        const nextAd = { ...item, status: "active" as const };
        nextAd.status = getAdLiveStatus(nextAd);
        return nextAd;
      }
      return item;
    });

    try {
      await db.saveAds(updatedList);
      setAds(updatedList);
      triggerAlert(
        lang === "sw" ? "Tangazo limeidhinishwa na kuanza kurushwa!" : "Ad approved & scheduling is live!",
        "success"
      );
    } catch (e: any) {
      triggerAlert(lang === "sw" ? "Imeshindwa kuidhinisha tangazo" : "Failed to approve campaign", "error");
    }
  };

  // Perform overall metric summations
  const stats = useMemo(() => {
    return ads.reduce(
      (acc, item) => {
        acc.totalImpressions += item.metrics.impressions;
        acc.totalClicks += item.metrics.clicks;
        acc.totalSpent += item.totalSpent;
        acc.totalBudgetLimit += item.budgetLimit;
        return acc;
      },
      { totalImpressions: 0, totalClicks: 0, totalSpent: 0, totalBudgetLimit: 0 }
    );
  }, [ads]);

  const avgCtr = useMemo(() => {
    if (stats.totalImpressions === 0) return 0;
    return Number(((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2));
  }, [stats]);

  // Filters logic
  const filteredAds = useMemo(() => {
    return ads
      .filter((ad) => {
        const matchesSearch =
          ad.businessName.toLowerCase().includes(search.toLowerCase()) ||
          ad.title.toLowerCase().includes(search.toLowerCase());

        const liveStatus = getAdLiveStatus(ad);
        if (statusFilter === "all") return matchesSearch;
        if (statusFilter === "active") return matchesSearch && liveStatus === "active";
        if (statusFilter === "paused") return matchesSearch && liveStatus === "paused";
        if (statusFilter === "pending") return matchesSearch && liveStatus === "pending";
        if (statusFilter === "completed") return matchesSearch && liveStatus === "completed";
        if (statusFilter === "scheduled") return matchesSearch && liveStatus === "scheduled";

        return matchesSearch;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [ads, search, statusFilter]);

  // Forecast calculator estimations
  const forecastEstimates = useMemo(() => {
    const clicks = Math.round(simImpressions * (simCtr / 100));
    const cost = clicks * simBid;
    return { clicks, cost };
  }, [simImpressions, simCtr, simBid]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-15 translate-x-12 -translate-y-6 select-none pointer-events-none">
          <Megaphone size={180} />
        </div>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <Megaphone size={16} />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
              {lang === "sw" ? "Soko la Matangazo ya Kulipia" : "Paid Campaigns (Sponsor Space)"}
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight font-sans">
            {lang === "sw" ? "Soko la Matangazo ya Washirika" : "Ad Placement & Marketplace Hub"}
          </h1>
          <p className="text-slate-300 text-xs">
            {lang === "sw"
              ? "Weka, thibitisha, dhibiti matangazo ya kulipia, kadi za sponsa, ratiba na mahesabu ya zabuni (CPC)."
              : "Manage prepaid third-party business placements, set bidding click prices, track impressions, CPC billing."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-4 py-2.5 rounded-xl cursor-pointer transition active:scale-[0.98] flex items-center gap-1.5 shadow"
          >
            <Plus size={14} />
            {lang === "sw" ? "Sajili Tangazo" : "Deploy Ad Campaign"}
          </button>
        </div>
      </div>

      {/* Metric Notifications */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-3 ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-red-50 border-red-100 text-red-800"
          }`}
        >
          {alert.type === "success" ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <p className="text-xs font-bold leading-tight">{alert.text}</p>
        </div>
      )}

      {/* KPI Performance Dashboard */}
      <div className="orbi-admin-auto-grid">
        <div className="orbi-admin-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="orbi-admin-label text-[10px] font-black uppercase tracking-wider">
              {lang === "sw" ? "Mionekano / Impressions" : "Total Impressions"}
            </span>
            <Eye size={16} />
          </div>
          <div className="mt-2.5">
            <p className="orbi-admin-compact-value font-black text-slate-900 font-mono">
              {stats.totalImpressions.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {lang === "sw" ? "Mionekano ya kurasa mfululizo" : "Organic banner page loads"}
            </p>
          </div>
        </div>

        <div className="orbi-admin-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="orbi-admin-label text-[10px] font-black uppercase tracking-wider">
              {lang === "sw" ? "Bofya za Kulipia / Clicks" : "Ad Click Events"}
            </span>
            <MousePointerClick size={16} />
          </div>
          <div className="mt-2.5">
            <p className="orbi-admin-compact-value font-black text-slate-900 font-mono">
              {stats.totalClicks.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {lang === "sw" ? "Idadi ya kubofya bidhaa/viungo" : "Redirect links click actions"}
            </p>
          </div>
        </div>

        <div className="orbi-admin-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="orbi-admin-label text-[10px] font-black uppercase tracking-wider">
              {lang === "sw" ? "Kiwango cha Uvutio (CTR)" : "Average CTR Ratio"}
            </span>
            <Percent size={16} />
          </div>
          <div className="mt-2.5">
            <p className="orbi-admin-compact-value font-black text-emerald-600 font-mono">{avgCtr}%</p>
            <p className="text-[10px] text-slate-500 font-medium">
              {lang === "sw" ? "Uhai na ufanisi wa matangazo" : "Click-through effectiveness ratio"}
            </p>
          </div>
        </div>

        <div className="orbi-admin-card p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="orbi-admin-label text-[10px] font-black uppercase tracking-wider">
              {lang === "sw" ? "Dola za Matangazo / Spent" : "Total Ad Revenue Saved"}
            </span>
            <DollarSign size={16} />
          </div>
          <div className="mt-2.5">
            <p className="orbi-admin-compact-value font-black text-indigo-600 font-mono">
              {formatCurrency(stats.totalSpent)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {lang === "sw" ? "Kati ya bajeti kuu ya " : "Out of total prepaid budget "}{formatCurrency(stats.totalBudgetLimit)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            className="w-full bg-slate-50 hover:bg-slate-50/70 border border-slate-100 focus:border-slate-300 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition"
            placeholder={lang === "sw" ? "Tafuta kwa jina la biashara au kichwa..." : "Search partner business name or campaign title..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto shrink-0 pb-1 md:pb-0 font-sans">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 shrink-0 px-1">
            <Filter size={12} />
            {lang === "sw" ? "Chuja hali:" : "Filter Status:"}
          </span>
          {[
            { id: "all", label: lang === "sw" ? "Yote" : "All" },
            { id: "active", label: lang === "sw" ? "Kurushwa (Active)" : "Active" },
            { id: "pending", label: lang === "sw" ? "Idhini (Pending)" : "Pending" },
            { id: "scheduled", label: lang === "sw" ? "Ratibishwa" : "Scheduled" },
            { id: "paused", label: lang === "sw" ? "Mapumziko" : "Paused" },
            { id: "completed", label: lang === "sw" ? "Malizika" : "Ended" },
          ].map((filt) => (
            <button
              key={filt.id}
              onClick={() => setStatusFilter(filt.id)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap cursor-pointer transition select-none ${
                statusFilter === filt.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Campaign Management Arena */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ad Placements List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-500" />
              {lang === "sw" ? "Orodha ya Matangazo ya Kulipia" : "Partner Placements & Active Ads"}
              <span className="font-mono text-slate-500">({filteredAds.length})</span>
            </h2>
          </div>

          {filteredAds.length === 0 ? (
            <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <Megaphone size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-xs font-bold text-slate-600">
                {lang === "sw" ? "Hakuna matangazo yaliyopatikana" : "No active placements matching your filter"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">
                {lang === "sw"
                  ? "Sajili tangazo jipya la biashara ya mshirika kwa kubonyeza kitufe kilicho juu."
                  : "Create a new placement campaign above to deploy active advertising banners."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAds.map((ad) => {
                const liveStatus = getAdLiveStatus(ad);
                const percentSpent = Math.min(100, Math.round((ad.totalSpent / ad.budgetLimit) * 100));

                return (
                  <div
                    key={ad.id}
                    className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all"
                  >
                    {/* Header Banner */}
                    <div className="relative h-28 bg-slate-100 overflow-hidden shrink-0">
                      <img src={ad.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"} alt={ad.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex gap-1">
                        {liveStatus === "active" && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider shadow animate-pulse">
                            {lang === "sw" ? "LIVE / INARUSHA" : "LIVE / RUNNING"}
                          </span>
                        )}
                        {liveStatus === "pending" && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                            {lang === "sw" ? "IDHINI" : "APPROVAL"}
                          </span>
                        )}
                        {liveStatus === "scheduled" && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                            {lang === "sw" ? "IMERATIBIWA" : "SCHEDULED"}
                          </span>
                        )}
                        {liveStatus === "paused" && (
                          <span className="px-2 py-0.5 rounded bg-slate-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                            {lang === "sw" ? "MAPUMZIKO" : "PAUSED"}
                          </span>
                        )}
                        {liveStatus === "completed" && (
                          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
                            {lang === "sw" ? "IMEKWISHA" : "BUDGET MET"}
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest truncate">
                          {ad.businessName}
                        </p>
                        <h3 className="text-xs font-black truncate leading-tight mt-0.5">{ad.title}</h3>
                      </div>
                    </div>

                    {/* Meta stats */}
                    <div className="p-4 flex-1 space-y-3.5">
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {ad.description || (lang === "sw" ? "Kahawa halisi toka kilimanjaro..." : "Premium quality partner service details...")}
                      </p>

                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50/70 rounded-xl text-center">
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">
                            {lang === "sw" ? "Vipimo / Views" : "Impressions"}
                          </p>
                          <p className="text-[11px] font-black text-slate-900 font-mono mt-0.5">{ad.metrics.impressions}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-400 font-sans">
                            {lang === "sw" ? "Bofya / Clicks" : "Clicks"}
                          </p>
                          <p className="text-[11px] font-black text-slate-900 font-mono mt-0.5">{ad.metrics.clicks}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">CTR</p>
                          <p className="text-[11px] font-black text-emerald-600 font-mono mt-0.5">
                            {ad.metrics.impressions > 0
                              ? ((ad.metrics.clicks / ad.metrics.impressions) * 100).toFixed(2) + "%"
                              : "0.0%"}
                          </p>
                        </div>
                      </div>

                      {/* Spend Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500">
                            {lang === "sw" ? "Matumizi:" : "Spent amount:"} <strong className="text-slate-800">{formatCurrency(ad.totalSpent)}</strong>
                          </span>
                          <span className="text-slate-400">
                            {lang === "sw" ? "Kati ya " : "Of "}{formatCurrency(ad.budgetLimit)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentSpent >= 100 ? "bg-red-500" : percentSpent > 75 ? "bg-amber-500" : "bg-emerald-600"
                            }`}
                            style={{ width: `${percentSpent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Scheduling timelines */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {ad.startDate} {lang === "sw" ? "hadi" : "to"} {ad.endDate}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md">
                          CPC: {formatCurrency(ad.bidAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Footer Operations */}
                    <div className="bg-slate-50/50 p-3.5 border-t border-slate-100 flex items-center justify-between shrink-0">
                      <div className="flex gap-2">
                        {liveStatus === "pending" && (
                          <button
                            onClick={() => handleApprovePendingAd(ad.id)}
                            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 border border-emerald-500/10 text-[9px] font-black uppercase px-2.5 py-1.5 rounded cursor-pointer transition active:scale-[0.98]"
                          >
                            {lang === "sw" ? "Idhinisha" : "Approve Now"}
                          </button>
                        )}

                        {liveStatus !== "completed" && liveStatus !== "pending" && (
                          <button
                            onClick={() => handleToggleStatus(ad.id)}
                            className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded border cursor-pointer transition active:scale-[0.98] flex items-center gap-1 ${
                              ad.visible
                                ? "bg-amber-50/70 text-amber-700 border-amber-400/20 hover:bg-amber-100"
                                : "bg-emerald-50/70 text-emerald-700 border-emerald-400/20 hover:bg-emerald-100"
                            }`}
                          >
                            {ad.visible ? (
                              <>
                                <Pause size={10} />
                                {lang === "sw" ? "Sitisha" : "Pause"}
                              </>
                            ) : (
                              <>
                                <Play size={10} />
                                {lang === "sw" ? "Anza" : "Start"}
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg cursor-pointer transition active:scale-[0.95]"
                          title={lang === "sw" ? "Hariri na ubadili" : "Edit settings"}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg cursor-pointer transition active:scale-[0.95]"
                          title={lang === "sw" ? "Futa placement" : "Delete campaign"}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ad Forecasting / Billing Sandbox Simulator */}
        <div className="space-y-4">
          <div className="bg-slate-950 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden border border-slate-800">
            <div className="absolute right-0 bottom-0 opacity-[0.03] translate-x-3 translate-y-3 pointer-events-none">
              <Sparkles size={160} />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="p-1 px-2 bg-emerald-600/30 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                {lang === "sw" ? "Zabuni Simulator" : "Prepaid Forecaster"}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Sandbox</span>
            </div>

            <h3 className="text-sm font-black font-sans leading-tight">
              {lang === "sw" ? "Mkokotoaji wa Bajeti ya Matangazo" : "Third-Party Bidding & Yield Simulator"}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {lang === "sw"
                ? "Simulia na upime jinsi washirika wanaovutiwa wanavyoweza kupanga zabuni zao na uone makadirio ya makato ya fedha."
                : "Predict customer click costs, dynamic CTR yields and estimates on daily billing rates for businesses."}
            </p>

            <div className="space-y-4 mt-5 pt-4 border-t border-slate-800">
              {/* Simulator Slider impressions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">{lang === "sw" ? "Mionekano (Impressions):" : "Impressions:"}</span>
                  <span className="font-mono text-emerald-400 font-bold">{simImpressions.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="500"
                  className="w-full accent-emerald-500 bg-slate-800 h-1 rounded"
                  value={simImpressions}
                  onChange={(e) => setSimImpressions(Number(e.target.value))}
                />
              </div>

              {/* Simulator Slider CTR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">{lang === "sw" ? "Kiwango cha Click action (CTR):" : "Forecasted CTR:"}</span>
                  <span className="font-mono text-emerald-400 font-bold">{simCtr}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  className="w-full accent-emerald-500 bg-slate-800 h-1 rounded"
                  value={simCtr}
                  onChange={(e) => setSimCtr(Number(e.target.value))}
                />
              </div>

              {/* Simulator Slider Bid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">{lang === "sw" ? "Gharama kwa kila Bofya (CPC):" : "Prepaid CPC Bid:"}</span>
                  <span className="font-mono text-indigo-400 font-bold">{formatCurrency(simBid)}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="25"
                  className="w-full accent-indigo-500 bg-slate-800 h-1 rounded"
                  value={simBid}
                  onChange={(e) => setSimBid(Number(e.target.value))}
                />
              </div>

              {/* Output estimations block */}
              <div className="mt-6 p-4 bg-slate-900 rounded-2xl border border-slate-800/80 space-y-3 font-sans">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">🎯 {lang === "sw" ? "Idadi ya Bofya zote (Clicks):" : "Estimated Clicks:"}</span>
                  <strong className="text-slate-100 font-mono text-xs">{forecastEstimates.clicks.toLocaleString()} clicks</strong>
                </div>

                <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-800">
                  <span className="text-slate-400 font-bold">💳 {lang === "sw" ? "Makato Mabaya ya Kupunguza:" : "Billable Deductions:"}</span>
                  <strong className="text-emerald-400 font-mono text-xs font-black">
                    {formatCurrency(forecastEstimates.cost)}
                  </strong>
                </div>

                <div className="text-[10px] p-2 bg-indigo-950/10 border border-indigo-500/15 rounded text-indigo-300 font-medium leading-relaxed">
                  📢 <strong>{lang === "sw" ? "Ukweli wa Mafanikio:" : "Sponsorship insights:"}</strong> {
                    lang === "sw"
                      ? "Pamoja na kiwango cha uchezaji hapo juu, biashara mshirika inatakiwa kupakia muonekano mwangavu ili kuhakikisha wateja wanavutiwa zaidi."
                      : "For a prepaid bid of 250 TZS on Orbi Shop listings, click interactions are naturally higher for organic, high-contrast white bitmap WebP graphics."
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Megaphone className="text-emerald-400" size={18} />
                <h3 className="font-black text-xs uppercase tracking-wider">
                  {editingAd
                    ? lang === "sw"
                      ? "Hariri Tangazo la Kulipia"
                      : "Edit Placement Campaign"
                    : lang === "sw"
                    ? "Sajili Tangazo jipya la Ushirika"
                    : "Add New Partner Ad Placements"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAd(null);
                }}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSaveAd} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Advertiser Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Jina la Mshirika / Biashara" : "Partner / Business Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wengi Coffee Traders"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-semibold outline-none transition"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Barua Pepe ya Wasilisho" : "Contact Email"} *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sponsor@branding.com"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-semibold outline-none transition"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Headline & Link */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Kichwa Kuu la Tangazo (Ad Title Headline)" : "Ad Headline (Title)"} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pata kahawa bora ya Kilimanjaro kwa punguzo la asilimia 15!"
                  className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-bold outline-none transition"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Maelezo ya Kukuza Biashara (Description)" : "Campaign Description"}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    lang === "sw"
                      ? "Eleza bidhaa hapa ili kuelekeza wateja juu ya uzuri na faida zake..."
                      : "Brief copy to describe the promotion and call to action..."
                  }
                  className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-medium outline-none transition resize-none"
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                />
              </div>

              {/* Ad Image configuration with uploader */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Pakia Jalada Kuu la Picha / Bango" : "Campaign Creative Image Cover"} *
                </label>

                {/* File Upload Selector */}
                <div className="border border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl text-center relative hover:bg-slate-50/80 transition text-slate-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={18} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-700">
                      {lang === "sw" ? "Bofya hapa au pakia picha ya tangazo" : "Click here to upload ad creative image"}
                    </p>
                    <p className="text-[9px] text-slate-400">Max size: 15MB</p>
                  </div>
                </div>

                {/* Progress bar loader */}
                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold text-indigo-600">
                      <span>{lang === "sw" ? "Inapakia..." : "Uploading creative..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* URL Direct Pasting */}
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or raw image URL"
                  className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-semibold outline-none transition"
                  value={adImage}
                  onChange={(e) => setAdImage(e.target.value)}
                />

                {adImage && (
                  <div className="relative aspect-video rounded-xl bg-slate-100 overflow-hidden border border-slate-200 mt-2">
                    <img src={adImage} alt="Creative banner preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAdImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition active:scale-95 shadow"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Click-through link */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw" ? "Kiungo cha kuelekeza duka (Redirect Link)" : "Target Redirect Path / Link"} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. /?category=Electronics or direct URL"
                  className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-semibold outline-none transition"
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                />
              </div>

              {/* Bidding and budget limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Zabuni ya Bofya (TZS CPC)" : "CPC Bid Price (TZS)"} *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    max="5000"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-mono font-bold outline-none transition"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Kikomo cha Bajeti (TZS Limit)" : "Total Campaign Budget (TZS)"} *
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-mono font-bold outline-none transition"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Scheduling timelines */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Tarehe ya kuanza" : "Start Promotion Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-semibold outline-none transition"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {lang === "sw" ? "Tarehe ya Kumaliza" : "End Promotion Date"} *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 p-3 rounded-xl text-xs font-semibold outline-none transition"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Visibility and active states */}
              <div className="pt-2 flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600">
                  {lang === "sw" ? "Anza tangazo hili kiotomatiki sasa" : "Set campaign active immediately"}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                    {visible ? (lang === "sw" ? "NDIYO" : "YES") : (lang === "sw" ? "KWA SASA HAPANA" : "NO")}
                  </span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                  />
                </div>
              </div>

              {/* Submit Area */}
              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-900 text-white py-3.5 rounded-xl font-bold text-[11px] uppercase cursor-pointer transition active:scale-[0.98] pt-3.5 shadow-md flex items-center justify-center gap-1"
              >
                <Check size={14} />
                {lang === "sw" ? "Hifadhi Tangazo na Lipia" : "Finalize & Launch Placement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
