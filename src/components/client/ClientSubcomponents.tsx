import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Shirt,
  Sofa,
  Heart,
  CarFront,
  ShoppingBag,
  X,
  Store,
} from "lucide-react";
import { Lang, t } from "../../lib/i18nClient";
import { useDialog } from "../CustomDialogContext";
import { supabase } from "../../lib/supabase";
import { db } from "../../lib/db";

export function AboutUsSection({ lang }: { lang: Lang }) {
  return (
    <div className="relative z-10 w-full mb-6 rounded-[2rem] overflow-hidden bg-white shadow-sm border border-slate-200/60 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center text-center" id="about-us-section">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent -z-10"></div>

      {/* Center Content */}
      <div className="flex flex-col items-center relative z-10 w-full max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3 drop-shadow-sm leading-tight text-balance">
          {t(lang, "hero.title")}
        </h1>
        <p className="text-[10px] sm:text-xs text-orange-600 uppercase tracking-[0.2em] font-bold mb-3 sm:mb-4">
          {t(lang, "hero.subtitle")}
        </p>
        <p className="text-sm border-l-2 border-orange-500/30 pl-3 md:text-base text-slate-500 font-medium leading-relaxed mb-6 sm:mb-8 w-full max-w-xl text-balance">
          {t(lang, "hero.desc")}
        </p>

        {/* Trust Badges - Marquee */}
        <div className="w-full overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="flex flex-row flex-nowrap w-max gap-3 text-[10px] sm:text-xs font-bold text-slate-700 animate-marquee">
            {/* NICHE SET */}
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche1")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Shirt className="w-3.5 h-3.5 text-pink-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche2")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Sofa className="w-3.5 h-3.5 text-amber-600 shrink-0" />{" "}
              <span>{t(lang, "feat.niche3")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche4")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <CarFront className="w-3.5 h-3.5 text-slate-800 shrink-0" />{" "}
              <span>{t(lang, "feat.niche5")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche6")}</span>
            </div>

            {/* NICHE DUPLICATE SET FOR SEAMLESS LOOP */}
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche1")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Shirt className="w-3.5 h-3.5 text-pink-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche2")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Sofa className="w-3.5 h-3.5 text-amber-600 shrink-0" />{" "}
              <span>{t(lang, "feat.niche3")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche4")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <CarFront className="w-3.5 h-3.5 text-slate-800 shrink-0" />{" "}
              <span>{t(lang, "feat.niche5")}</span>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 bg-slate-50 px-3 py-2 rounded-full border border-slate-100 text-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{" "}
              <span>{t(lang, "feat.niche6")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApplySellerModal({
  lang,
  onClose,
}: {
  lang: any;
  onClose: () => void;
}) {
  useEffect(() => {
    // Prefetch the SellerApp chunk so it's ready if they navigate after applying
    const p = import("../../pages/SellerApp");
    p.catch(() => {});
  }, []);

  const [loading, setLoading] = useState(false);
  const { showAlert } = useDialog();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [info, setInfo] = useState("");

  // Expanded fields under policy checklist
  const [inchesList, setInchesList] = useState<{ name: string }[]>([]);
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [location, setLocation] = useState("");
  const [tin, setTin] = useState("");
  const [businessType, setBusinessType] = useState("Individual");
  const [estimatedOrders, setEstimatedOrders] = useState("1-10");
  const [agreePolicy, setAgreePolicy] = useState(false);

  useEffect(() => {
    async function loadNiches() {
      try {
        const fetched = await db.getNiches();
        if (fetched && fetched.length > 0) {
          setInchesList(fetched);
          setNiche(fetched[0].name);
        } else {
          setInchesList([]);
          setNiche("");
        }
      } catch (err) {
        console.warn("Failed to load niches inside modal:", err);
        setInchesList([]);
        setNiche("");
      }
    }
    loadNiches();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreePolicy) {
      showAlert(
        lang === "sw"
          ? "Tafadhali kwanza thibitisha kuwa unakubaliana na sera zetu za wauzaji."
          : "Please agree to our merchant policies and guidelines before submitting.",
        "error"
      );
      return;
    }

    setLoading(true);

    const mainNiche = niche === "Other" || niche === "Mengineyo" ? customNiche : niche;

    try {
      // Structure the request text message carefully to allow the backend/admin to parse all fields cleanly
      const formattedMessage = [
        "Maombi ya Kuwa Muuzaji:",
        `Jina Kamili: ${name}`,
        `Barua pepe: ${email}`,
        `Duka: ${storeName}`,
        `Niche ya Biashara: ${mainNiche || "General"}`,
        `Nchi/Eneo: ${location || "Tanzania"}`,
        `Namba ya TIN: ${tin.trim() || "N/A"}`,
        `Aina ya Biashara: ${businessType}`,
        `Kiwango cha Mauzo: ${estimatedOrders}`,
        `Maelezo zaidi: ${info || "N/A"}`
      ].join("\n");

      await db.saveMessage({
        id: "",
        name,
        phone,
        message: formattedMessage,
        date: Date.now()
      });

      showAlert(
        lang === "sw"
          ? "Ombi lako la muuzaji limepokelewa na litafanyiwa kazi! Tutakutafuta hivi punde."
          : "Your seller application has been received! Our registration team will review and contact you shortly.",
        "success",
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert(
        lang === "sw"
          ? "Imeshindwa kutuma ombi, tafadhali jaribu tena baadae."
          : "Failed to submit application, please try again later.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm" id="apply-seller-modal">
      <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none outline-none bg-transparent"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-full flex items-center justify-center mb-3 shadow-md animate-pulse">
            <Store size={30} />
          </div>
          <h2 className="text-2xl font-black text-center text-slate-900 tracking-tight">
            {lang === "sw" ? "Omba Kuwa Muuzaji" : "Apply as Seller"}
          </h2>
          <p className="text-xs text-slate-500 text-center mt-1.5 px-4 leading-relaxed font-semibold">
            {lang === "sw"
              ? "Uza bidhaa zako kupitia Orbi Shop. Tuna kufuata sheria na sera za kuhakiki wauzaji."
              : "Expand your reach on Orbi Shop. Please fill out the registration form below in line with our merchant policy."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 text-left">
          {/* Section: Contact Info */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
              {lang === "sw" ? "Taarifa za Mawasiliano" : "Contact Information"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                type="text"
                placeholder={lang === "sw" ? "Jina Kamili" : "Full Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm transition-all"
              />
              <input
                required
                type="email"
                placeholder={lang === "sw" ? "Barua Pepe yako" : "Email Address"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm transition-all"
              />
            </div>
            <input
              required
              type="text"
              placeholder={lang === "sw" ? "Namba ya Simu (e.g. 0744111222)" : "Phone Number (e.g. 0744111222)"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm transition-all mt-3"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Section: Store Profile & Policy Fields */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
              {lang === "sw" ? "Profaili ya Duka na Bidhaa" : "Store & Product Profile"}
            </label>
            
            <div className="space-y-3">
              <input
                required
                type="text"
                placeholder={
                  lang === "sw"
                    ? "Jina Linalopendekezwa la Duka"
                    : "Proposed Store Name"
                }
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-semibold text-sm transition-all"
              />

              {/* Niche selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === "sw" ? "Unauza nini? (Niche Kuu)" : "What do you sell? (Primary Niche)"}
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm"
                >
                  {inchesList.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                  <option value="Other">{lang === "sw" ? "Mengineyo / Niche nyingine" : "Other / Custom Niche"}</option>
                </select>
              </div>

              {(niche === "Other" || niche === "Mengineyo") && (
                <input
                  required
                  type="text"
                  placeholder={lang === "sw" ? "Taja jina la Niche yako" : "Specify your custom niche"}
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  className="w-full bg-slate-50 border border-orange-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm animate-in slide-in-from-top-2 duration-150"
                />
              )}

              {/* Physical Location Input */}
              <input
                required
                type="text"
                placeholder={lang === "sw" ? "Eneo Duka Lilipo (Mji/Mkoa)" : "Store Physical Location (City/Region)"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm transition-all"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Legal & Volume Policy Fields */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
              {lang === "sw" ? "Utekelezaji wa kisheria & Kiwango" : "Regulatory Compliance & Expected Volume"}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === "sw" ? "Aina ya Mfumo wa Biashara" : "Business Entity Type"}
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm"
                >
                  <option value="Individual">{lang === "sw" ? "Mtu Binafsi / Mjasiriamali" : "Individual / Sole Proprietor"}</option>
                  <option value="Registered Company">{lang === "sw" ? "Kampuni Iliyosajiliwa (Ltd)" : "Registered Company (Ltd)"}</option>
                  <option value="Partnership">{lang === "sw" ? "Ushirikiano (Partnership)" : "Partnership"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {lang === "sw" ? "Makadirio ya Agizo kwa Mwezi" : "Estimated Monthly Orders"}
                </label>
                <select
                  value={estimatedOrders}
                  onChange={(e) => setEstimatedOrders(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-sm"
                >
                  <option value="1-10">1 - 10 orders</option>
                  <option value="11-50">11 - 50 orders</option>
                  <option value="51-200">51 - 200 orders</option>
                  <option value="200+">200+ orders</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {lang === "sw" ? "Namba ya TIN (Lazima)" : "TIN Number (Mandatory)"}
              </label>
              <input
                required
                type="text"
                maxLength={20}
                placeholder={lang === "sw" ? "Weka Namba yako ya TIN ya biashara" : "Enter your business TIN number"}
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-mono text-sm transition-all"
              />
            </div>
          </div>

          <textarea
            required
            placeholder={
              lang === "sw"
                ? "Taja mifano ya bidhaa zako na maelezo unayotaka tusajili mapema (Lazima)"
                : "Describe your specific catalog brands, models, products, or logistics you require (Mandatory)"
            }
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-xs min-h-[70px] resize-none"
          />

          {/* Policy Agreement Checkbox */}
          <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                required
                type="checkbox"
                checked={agreePolicy}
                onChange={(e) => setAgreePolicy(e.target.checked)}
                className="w-5 h-5 accent-orange-600 rounded cursor-pointer mt-0.5 shrink-0"
              />
              <span className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                {lang === "sw"
                  ? "Ninakubaliana na Sera za Wauzaji za Orbi Shop: Nitatoa bidhaa halisi zenye ubora, nitasaibiwa rejesho ndani ya siku 30 ikitokea tatizo, na ninakubali ada ya asilimia ya huduma."
                  : "I declare that all information is honest. I pledge to adhere to Orbi Shop Merchant Policies: maintaining genuine catalogs, honoring 30-day merchant refunds protection, and payment of setup/service charges."}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold mt-4 disabled:opacity-50 transition-all shadow-md cursor-pointer border-none text-sm uppercase tracking-wider"
          >
            {loading
              ? lang === "sw"
                ? "Inatuma Maombi..."
                : "Submitting..."
              : lang === "sw"
                ? "Tuma Maombi ya Muuzaji"
                : "Submit Seller Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
