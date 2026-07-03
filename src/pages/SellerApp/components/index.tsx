import { Sparkles, RefreshCw, Send, Store, FileText, ShieldCheck, Camera } from "lucide-react";
import { uploadFileViaStorageApi } from "../../../lib/upload";
import React, { useState, useMemo } from "react";
import { db } from "../../../lib/db";
import { SchemaValidator } from "../../../utils/schemaValidation";
import { PhotoQualityGuide } from "../../../components/PhotoQualityGuide";
import { supabase } from "../../../lib/supabase";
import { formatCurrency } from "../../../lib/storage";
import { PriceDisplay } from "../../../components/PriceDisplay";
import GooglePlacePicker from "../../../components/GooglePlacePicker";
import { Product, Order, SellerProfile, Niche, GooglePlaceDetails } from "../../../types";


export function AICopilotWidget({
  lang,
  seller,
  sellerProducts,
}: {
  lang: "sw" | "en";
  seller: SellerProfile;
  sellerProducts: Product[];
}) {
  const [customerMessage, setCustomerMessage] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetchAiSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerMessage.trim()) return;

    setLoading(true);
    setSuggestion("");
    try {
      const dbProdsCtx = sellerProducts
        .map(
          (p) =>
            `Name: ${p.name}, category: ${p.category}, price: TSh ${p.price}`,
        )
        .join("\n");
      const resp = await fetch("/api/v1/ai/copilot-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerMessage,
          customInstruction: `Draft a response specifically representing the store seller: ${seller.name}. Ensure it speaks directly about our products: ${dbProdsCtx || "No products initialized yet"}. ${customInstruction}`,
        }),
      });

      const data = await resp.json();
      if (data.success) {
        setSuggestion(data.suggestion);
      } else {
        setSuggestion(
          "Inashindwa kukamilisha ushauri hivi sasa. (Failed to gather helper from Gemini service proxy API)",
        );
      }
    } catch (err: any) {
      setSuggestion(
        "Hitilafu ya mtandao wakati wa mawasiliano na AI. (Network communication issue)",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:max-w-4xl animate-in fade-in duration-200">
      <div className="bg-linear-to-r from-orange-500/10 to-amber-500/10 border border-orange-200/60 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-5">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
          <Sparkles size={24} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
            {lang === "sw"
              ? "Orbi Merchant AI Co-Pilot"
              : "Orbi Merchant AI Co-Pilot"}
          </h3>
          <p className="text-slate-600 text-xs font-medium mt-1 leading-relaxed">
            {lang === "sw"
              ? "Uza zaidi, andika matangazo, na ujibu wateja haraka kwa msaada wa akili mnemba ya Google Gemini. AI hii inajua katalogi yako kikamilifu!"
              : "Increase sales, generate gorgeous product listings, optimize marketing lines, and respond to buyer inquiries instantly using official server-side Google Gemini models!"}
          </p>
        </div>
      </div>

      {/* Main core chat form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <form
          onSubmit={handleFetchAiSuggestion}
          className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {lang === "sw"
                  ? "Andika Swali la Mteja au Lengo ya Tangazo"
                  : "Customer inquiry/Prompt theme"}
              </label>
              <textarea
                required
                rows={3}
                placeholder={
                  lang === "sw"
                    ? "Mteja anauliza kama tuna ofa... au nisaidie kuandika maelezo ya kuvutia kwa bidhaa zangu..."
                    : "e.g. Help me draft a professional Swahili description for my newly listed phone..."
                }
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-4 rounded-2xl text-xs font-medium outline-none focus:border-amber-500 focus:bg-white resize-none transition"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {lang === "sw"
                  ? "Maelekezo ya ziada ya Mtindo (Sauti / Lugha)"
                  : "Additional tone instructions (Optional)"}
              </label>
              <input
                type="text"
                placeholder={
                  lang === "sw"
                    ? "Andika kwa lugha ya kirafiki sana / andika kwa Kiingereza na Swahili zote..."
                    : "e.g. Write in a luxury, elegant mood with emoji accents, purely in Swahili"
                }
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-4 py-3.5 rounded-2xl text-xs font-medium outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 border border-slate-900 text-white font-black text-xs uppercase py-3.5 rounded-2xl shadow-md cursor-pointer hover:bg-slate-800 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw
                  className="animate-spin text-white shrink-0"
                  size={14}
                />
                <span>
                  {lang === "sw"
                    ? "Akili ya AI Inatafakari..."
                    : "AI Engine brainstorming..."}
                </span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>
                  {lang === "sw"
                    ? "Tengeneza Maelezo kwa AI"
                    : "Generate AI response"}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Suggestion block */}
        <div className="bg-slate-900 text-slate-100 p-6 sm:p-7 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col">
          <div className="pb-3 border-b border-white/5 flex items-center justify-between text-[10px] font-black tracking-widest uppercase text-amber-400">
            <span>
              {lang === "sw"
                ? "MAPENDEKEZO YA CO-PILOT"
                : "CO-PILOT OPTIMIZATION"}
            </span>
            <Sparkles size={14} className="text-amber-400" />
          </div>

          <div className="flex-1 mt-4 overflow-y-auto text-xs leading-relaxed font-semibold max-h-[250px] md:max-h-none scrollbar-none">
            {loading ? (
              <div className="space-y-3.5 animate-pulse">
                <div className="h-4 bg-white/10 rounded-sm w-3/4"></div>
                <div className="h-4 bg-white/10 rounded-sm w-5/6"></div>
                <div className="h-4 bg-white/10 rounded-sm w-2/3"></div>
                <div className="h-4 bg-white/10 rounded-sm w-4/5"></div>
              </div>
            ) : suggestion ? (
              <div className="whitespace-pre-line text-slate-300 text-[11px] leading-relaxed select-text tracking-wide bg-white/5 p-4 rounded-2xl border border-white/5">
                {suggestion}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12 space-y-2">
                <p>
                  {lang === "sw"
                    ? "Andika swali lako kushoto kisha bonyeza kupata maoni bora."
                    : "Type your query on the left pane and generate drafts backed directly by our product inventories."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* SUBCOMPONENT: Store Settings Invoice customizer Form */
export { OrderProgressIndicator } from "./OrderProgressIndicator";

export function StoreSettingsForm({
  seller,
  displayAlert,
  onRefreshData,
  lang,
}: {
  seller: SellerProfile;
  displayAlert: any;
  onRefreshData: any;
  lang: "sw" | "en";
}) {
  const [bName, setBName] = useState(seller.name || "");
  const [bDesc, setBDesc] = useState(seller.description || "");
  const [avatar, setAvatar] = useState(seller.avatar || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [invCompany, setInvCompany] = useState(seller.invoiceCompanyName || "");
  const [invAddress, setInvAddress] = useState(seller.invoiceAddress || "");
  const [pickupPlace, setPickupPlace] = useState<GooglePlaceDetails | null>(
    seller.pickupLat && seller.pickupLng
      ? {
          placeId: seller.pickupPlaceId || "",
          formattedAddress: seller.pickupAddress || seller.invoiceAddress || "",
          lat: Number(seller.pickupLat),
          lng: Number(seller.pickupLng),
        }
      : null,
  );
  const [invPhone, setInvPhone] = useState(seller.invoicePhone || "");
  const [invEmail, setInvEmail] = useState(seller.invoiceEmail || "");
  const [invTerms, setInvTerms] = useState(seller.invoiceTerms || "");
  const [tin, setTin] = useState(seller.tin || "");
  const [saving, setSaving] = useState(false);
  const [autoTaxSales, setAutoTaxSales] = useState(false);
  const [subTab, setSubTab] = useState<"profile" | "invoice" | "tax">(
    "profile",
  );

  React.useEffect(() => {
    async function loadTra() {
      try {
        const config = await db.getTraConfig();
        if (config) {
          setAutoTaxSales(!!config.autoTaxSales);
        }
      } catch (err) {
        console.warn(
          "Failed to load TRA configuration on seller setting:",
          err,
        );
      }
    }
    loadTra();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFileViaStorageApi(
        e.target.files[0],
        "messages",
        () => {},
      );
      setAvatar(url);
      displayAlert(
        lang === "sw"
          ? "Picha ya wasifu imepakiwa!"
          : "Profile avatar uploaded successfully!",
        "success",
      );
    } catch (err: any) {
      displayAlert(
        lang === "sw"
          ? "Imeshindwa kupakia picha: " + err.message
          : "Failed to upload avatar: " + err.message,
        "error",
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Direct PostgreSQL or fallback upsert via supabase interface
      await db.updateSellerProfile(seller.id, {
        name: bName,
        description: bDesc,
        invoice_company_name: invCompany,
        invoice_address: invAddress,
        pickup_address: pickupPlace?.formattedAddress || invAddress,
        pickup_place_id: pickupPlace?.placeId || seller.pickupPlaceId || null,
        pickup_lat: pickupPlace?.lat ?? null,
        pickup_lng: pickupPlace?.lng ?? null,
        invoice_phone: invPhone,
        invoice_email: invEmail,
        invoice_terms: invTerms,
        tin: tin,
        avatar: avatar,
      });

      // Update Auto TAX settings for TRA too
      await db.saveTraConfig({ autoTaxSales, tin: tin });

      displayAlert(
        lang === "sw"
          ? "Mipangilio ya duka imehifadhiwa kikamilifu!"
          : "Store and Invoicing configurations saved successfully on cloud!",
        "success",
      );
      onRefreshData();
    } catch (err: any) {
      displayAlert(err.message || "Failed to update seller settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const subTabs = [
    {
      id: "profile",
      label: lang === "sw" ? "Wasifu & Brand" : "Profile & Brand",
      icon: Store,
    },
    {
      id: "invoice",
      label: lang === "sw" ? "Taarifa za Invoice" : "Invoice Template",
      icon: FileText,
    },
    {
      id: "tax",
      label: lang === "sw" ? "Kodi na TRA" : "Tax & TRA",
      icon: ShieldCheck,
    },
  ];

  return (
    <form onSubmit={handleUpdateStore} className="space-y-6">
      {/* Category Pill Navigation */}
      <div className="flex border-b border-slate-100 pb-3 gap-2 overflow-x-auto scrollbar-none">
        {subTabs.map((tabItem) => {
          const Icon = tabItem.icon;
          const active = subTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setSubTab(tabItem.id as any)}
              className={`p-3 px-4 rounded-2xl transition flex items-center gap-2.5 text-xs font-bold shrink-0 cursor-pointer ${
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <Icon
                size={14}
                className={active ? "text-emerald-400" : "text-slate-500"}
              />
              <span>{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Contents display */}
      <div className="min-h-[200px] text-left">
        {subTab === "profile" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1.5 border-b border-slate-100">
                {lang === "sw"
                  ? "TAARIFA ZA MIKOBA NA BRAND"
                  : "STORE BRANDING PROFILE"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {lang === "sw"
                  ? "Weka taarifa za jina na chapa ya biashara yako inayowasilishwa kwa wateja."
                  : "Update your store brand name and service pitch details displayed on catalogs."}
              </p>
            </div>

            {/* Seller Avatar / Brand Logo Upload */}
            <div className="flex flex-col sm:flex-row gap-5 items-center p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
              <div className="relative w-16 h-16 rounded-full bg-white border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-300 flex items-center justify-center">
                    <Store size={22} />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest">
                    ...
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {lang === "sw"
                    ? "Picha ya Wasifu (Store Avatar / Logo)"
                    : "Store Profile Avatar / Logo"}
                </label>
                <div className="flex gap-2 items-center justify-center sm:justify-start">
                  <label className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl cursor-pointer transition select-none flex items-center gap-1.5 shadow-sm">
                    <Camera size={12} className="text-emerald-400" />
                    <span>
                      {uploadingAvatar
                        ? lang === "sw"
                          ? "Inapakia..."
                          : "Uploading..."
                        : lang === "sw"
                          ? "Badilisha Picha"
                          : "Upload Picture"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar("")}
                      className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-[10px] px-3.5 py-2 rounded-xl transition cursor-pointer"
                    >
                      {lang === "sw" ? "Ondoa" : "Remove"}
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 leading-snug">
                  {lang === "sw"
                    ? "Inapendekezwa kutumia picha ya chapa yako au nembo duara, itaonekana kwenye wasifu wa ukurasa wa bidhaa na duka la mteja."
                    : "Recommended as a circular brand insignia or profile picture. Renders on products and unified storefront views."}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {lang === "sw"
                  ? "Jina la Duka / Outlet"
                  : "Storefront Outlet Name"}
              </label>
              <input
                required
                type="text"
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {lang === "sw"
                  ? "Maelezo ya Biashara"
                  : "Business Pitch & Details"}
              </label>
              <textarea
                rows={4}
                value={bDesc}
                onChange={(e) => setBDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-medium outline-none focus:border-slate-900 focus:bg-white resize-none transition"
                placeholder="e.g. Trusted vendor providing high quality electronics under full payment protection..."
              />
            </div>
          </div>
        )}

        {subTab === "invoice" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1.5 border-b border-slate-100">
                {lang === "sw"
                  ? "NEMBO YA RISITI (INVOICE TEMPLATE)"
                  : "RECEIPT & INVOICE TEMPLATE"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {lang === "sw"
                  ? "Weka maelezo yanayoandikwa kwenye invoice na risiti za malipo ya wateja wako."
                  : "Configure parameters printed on physical/digital receipts issued to consumers."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.55">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {lang === "sw"
                    ? "Jina la Kampuni Kisheria"
                    : "Legal Company Title"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Orbi Electronics Ltd"
                  value={invCompany}
                  onChange={(e) => setInvCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.55">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {lang === "sw"
                    ? "Namba ya Simu Kwenye Invoice"
                    : "Invoicing phone Contact"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. +255 764 ..."
                  value={invPhone}
                  onChange={(e) => setInvPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.55">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Email Register
                </label>
                <input
                  type="email"
                  placeholder="e.g. finance@store.com"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition"
                />
              </div>
              <div className="space-y-1.55">
                <GooglePlacePicker
                  lang={lang}
                  value={invAddress}
                  selectedPlace={pickupPlace}
                  onAddressChange={setInvAddress}
                  onPlaceSelect={setPickupPlace}
                  compact
                  label={lang === "sw" ? "Eneo la Duka / Pickup" : "Store / Pickup Location"}
                  placeholder={
                    lang === "sw"
                      ? "Tafuta eneo la duka kwenye Google Maps..."
                      : "Search store location on Google Maps..."
                  }
                  helperText={
                    lang === "sw"
                      ? "Eneo hili hutumika kuhesabu distance kutoka duka hadi kwa mteja."
                      : "This location is used to calculate distance from store to customer."
                  }
                />
              </div>
            </div>

            <div className="space-y-1.55">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {lang === "sw"
                  ? "Sheria na Vigezo vya Mauzo (Invoice terms)"
                  : "Terms of service details"}
              </label>
              <input
                type="text"
                placeholder="e.g. Warranty is valid for 6 months only under manufacturer defects. Goods non-refundable."
                value={invTerms}
                onChange={(e) => setInvTerms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-semibold outline-none focus:border-slate-900 focus:bg-white transition"
              />
            </div>
          </div>
        )}

        {subTab === "tax" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pb-1.5 border-b border-slate-100">
                {lang === "sw"
                  ? "NEMBO YA TRA NA MAREJESHO YA KODI"
                  : "GOVERNMENT TAXATION MODULES"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {lang === "sw"
                  ? "Sanidi namba ya kodi ya duka kwanza ili kuwezesha mwasilisho wa risiti za kielektroniki za kodi TRA."
                  : "Provide your corporate Taxpayer Identification Number and automated telemetry configurations."}
              </p>
            </div>

            <div className="space-y-1.55">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {lang === "sw"
                  ? "Namba ya TIN ya Duka / Seller TIN"
                  : "Seller TIN Number"}
              </label>
              <input
                type="text"
                placeholder="e.g. 144893102"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 hover:border-slate-300 p-3.5 rounded-2xl text-xs font-mono font-bold outline-none focus:border-slate-900 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.55 pt-2">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <div className="text-left pr-4">
                  <label className="block text-[10px] font-black uppercase text-slate-800 tracking-widest">
                    {lang === "sw"
                      ? "Auto TAX Sales Submission"
                      : "Auto TAX Sales Submission"}
                  </label>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                    {lang === "sw"
                      ? "Sajili risiti TRA moja kwa moja baada ya oda kuwasilishwa (Confirm Delivery)"
                      : "Automatically submit invoice receipt to TRA EFDMS upon final delivery confirmation"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTaxSales(!autoTaxSales)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center shrink-0 ${autoTaxSales ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"}`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-7 py-3.5 rounded-2xl shadow-md transition whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          {saving
            ? lang === "sw"
              ? "Inahifadhi..."
              : "Saving details..."
            : lang === "sw"
              ? "Hifadhi Mipangilio Yote"
              : "Apply invoice configuration"}
        </button>
      </div>
    </form>
  );
}
