import React from "react";
import { Award, Sparkles, Zap, Gift, Camera } from "lucide-react";
import { PriceDisplay } from "../PriceDisplay";
import ScratchCardChallenge from "../ScratchCardChallenge";
import { formatCurrency } from "../../lib/storage";

interface RewardsViewProps {
  user: any;
  lang: string;
  pPoints: number;
  orders: any[];
  invSettings: any;
  rewardsCategory: "available" | "claimed";
  setRewardsCategory: (v: "available" | "claimed") => void;
  forcePointsUpdate: number;
  pointsRequiredPerTzsDiscount: number;
  handleReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isParsingReceipt: boolean;
  parsedReceiptData: any;
  handleClaimReceiptPoints: () => void;
  setParsedReceiptData: (v: any) => void;
  parsingError: string | null;
  handleRedeemVoucher: (v: any) => void;
  coupons: any[];
  userId: string;
  setForcePointsUpdate?: (v: any) => void;
}

export function RewardsView({
  user,
  lang,
  pPoints,
  orders,
  invSettings,
  rewardsCategory,
  setRewardsCategory,
  forcePointsUpdate,
  pointsRequiredPerTzsDiscount,
  handleReceiptUpload,
  isParsingReceipt,
  parsedReceiptData,
  handleClaimReceiptPoints,
  setParsedReceiptData,
  parsingError,
  handleRedeemVoucher,
  coupons,
  userId,
  setForcePointsUpdate
}: RewardsViewProps) {
  // Tier calculation
  let currentTier = "Bronze";
  let nextTier = "Silver";
  let nextPointsThreshold = 300;
  let tierColor = "from-amber-700 to-amber-900";
  let ringColor = "text-amber-500 animate-pulse";
  let tierBadge = lang === "sw" ? "🥉 Mwanachama wa Shaba" : "🥉 Bronze Member";

  if (pPoints >= 6000) {
    currentTier = "Orbi Elite VIP";
    nextTier = lang === "sw" ? "Kiwango cha Juu" : "Elite VIP Max";
    nextPointsThreshold = 6000;
    tierColor = "from-amber-900 via-rose-950 to-orange-950";
    ringColor = "text-amber-500";
    tierBadge = lang === "sw" ? "👑 Orbi Super Elite VIP" : "👑 Orbi Super Elite VIP";
  } else if (pPoints >= 3000) {
    currentTier = "Platinum";
    nextTier = "Orbi Elite VIP";
    nextPointsThreshold = 6000;
    tierColor = "from-slate-700 via-slate-900 to-emerald-950";
    ringColor = "text-teal-400";
    tierBadge = lang === "sw" ? "💎 Mwanachama wa Platinamu" : "💎 Platinum Member";
  } else if (pPoints >= 1000) {
    currentTier = "Gold";
    nextTier = "Platinum";
    nextPointsThreshold = 3000;
    tierColor = "from-amber-500 via-yellow-750 to-amber-955";
    ringColor = "text-amber-400";
    tierBadge = lang === "sw" ? "🥇 Mwanachama wa Dhahabu" : "🥇 Gold Member";
  } else if (pPoints >= 300) {
    currentTier = "Silver";
    nextTier = "Gold";
    nextPointsThreshold = 1000;
    tierColor = "from-slate-500 via-slate-700 to-slate-900";
    ringColor = "text-slate-300";
    tierBadge = lang === "sw" ? "🥈 Mwanachama wa Fedha" : "🥈 Silver Member";
  }

  const percentProgress = nextPointsThreshold === pPoints ? 100 : Math.min(100, Math.floor((pPoints / nextPointsThreshold) * 100));
  const strokeDashoffset = 251.2 - (251.2 * percentProgress) / 100;

  const v5kCost = invSettings?.v_5k_cost !== undefined ? Number(invSettings.v_5k_cost) : 100;
  const v15Cost = invSettings?.v_15_vip_cost !== undefined ? Number(invSettings.v_15_vip_cost) : 250;
  const vShipCost = invSettings?.v_free_ship_cost !== undefined ? Number(invSettings.v_free_ship_cost) : 50;

  const redeemableVouchers = [
    {
      id: "v_5k",
      nameSw: "Punguzo TSh 5,000",
      nameEn: "TSh 5,000 Discount Coupon",
      points: v5kCost,
      percent: 5,
      descSw: `Inahitaji alama ${v5kCost} kukomboa`,
      descEn: `Requires ${v5kCost} points to unlock`,
    },
    {
      id: "v_15_vip",
      nameSw: "Punguzo la 15% VIP",
      nameEn: "15% Special VIP Voucher",
      points: v15Cost,
      percent: 15,
      descSw: `Inahitaji alama ${v15Cost} kukomboa`,
      descEn: `Requires ${v15Cost} points to unlock`,
    },
    {
      id: "v_free_ship",
      nameSw: "Uwasilishaji Orbi PaySafe Bure",
      nameEn: "Orbi PaySafe Free Delivery Coupon",
      points: vShipCost,
      percent: 10,
      descSw: `Inahitaji alama ${vShipCost} kukomboa`,
      descEn: `Requires ${vShipCost} points to unlock`,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200" key={forcePointsUpdate}>
      <div className={`bg-gradient-to-br ${tierColor} rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl border border-white/10 flex flex-col lg:flex-row gap-6 items-center justify-between`}>
        <div className="absolute top-0 right-0 p-8 scale-150 rotate-12 opacity-5 pointer-events-none select-none">
          <Award size={180} />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 w-full lg:w-auto">
          <div className="relative w-28 h-28 flex items-center justify-center bg-black/30 rounded-full p-2 border border-white/10 shadow-inner shrink-0 leading-none">
            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.2)]" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="40" className="text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" />
              <circle cx="56" cy="56" r="40" className={ringColor} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black font-sans tracking-tight text-white leading-none">{percentProgress}%</span>
              <span className="text-[8px] uppercase tracking-wider text-white/70 font-black mt-1">{lang === "sw" ? "Maendeleo" : "Progress"}</span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/10 leading-none inline-block">
              {tierBadge}
            </span>
            <h3 className="text-2xl font-black mt-3 tracking-tight font-sans text-white">{user.name}</h3>
            <p className="text-[10px] text-white/50 font-mono tracking-wider mt-1.5 uppercase font-semibold">
              VIP STATUS: {currentTier} • {nextPointsThreshold - pPoints > 0 ? (lang === "sw" ? `Alama ${nextPointsThreshold - pPoints} zimebaki kuelekea ${nextTier}` : `${nextPointsThreshold - pPoints} points left to ${nextTier}`) : (lang === "sw" ? "Umekamilisha viwango vyote" : "Max Membership unlocked")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 bg-black/20 border border-white/10 p-5 rounded-2xl shadow-inner w-full lg:w-auto min-w-[280px] justify-between z-10 font-sans font-semibold">
          <div>
            <span className="text-[10px] text-white/60 uppercase font-black tracking-wider block">{lang === "sw" ? "Alama Zilizopo" : "Points Balance"}</span>
            <span className="text-4xl font-black text-amber-400 font-sans tracking-tight block mt-1.5 leading-none">{pPoints}</span>
          </div>
          <div className="h-10 border-l border-white/10"></div>
          <div className="text-right">
            <span className="text-[10px] text-white/60 uppercase font-black tracking-wider block">{lang === "sw" ? "Thamani Punguzo" : "Cash Discount Value"}</span>
            <span className="text-lg font-bold text-emerald-400 block mt-1.5 leading-none font-sans font-semibold">
              {formatCurrency(Math.round(pPoints / pointsRequiredPerTzsDiscount))}
            </span>
          </div>
        </div>
      </div>

      <div id="scratch-challenge-widget">
        <ScratchCardChallenge
          userId={userId}
          lang={lang}
          pPoints={pPoints}
          orders={orders}
          onRewardClaimed={(pointsWon) => {
            const currentPts = pPoints;
            if (setForcePointsUpdate) {
               // Logic handled by caller normally, but we can emit if needed
            }
          }}
        />
      </div>

      <div id="receipt-ocr-uploader-container" className="bg-gradient-to-br from-amber-50 via-slate-50 to-amber-50/20 p-5 rounded-3xl border border-amber-100 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-5 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 border border-amber-200 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none">
            <Sparkles size={11} className="text-amber-600 animate-pulse" />
            <span>{lang === "sw" ? "Skana za Risiti za AI" : "Smart AI OCR Scanning"}</span>
          </div>
          <h3 className="text-base font-black text-slate-800">{lang === "sw" ? "Mkombozi wa Risiti & Ankara" : "Visual Receipt & Invoice Parser"}</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {lang === "sw" ? "Piga picha au pakia risiti ya malipo ya Kariakoo ama duka lingine. AI itasoma maelezo na kuweka alama za uaminifu moja kwa moja kama shukrani!" : "Snap or upload any external store invoice or checkout receipt. Our OCR AI extracts total text dynamically to award instant loyalty credits."}
          </p>
        </div>

        <div className="md:col-span-7 flex flex-col items-center justify-center w-full">
          <div className="w-full bg-white rounded-2xl border-2 border-dashed border-amber-200 hover:border-amber-400 p-6 flex flex-col items-center justify-center transition-all bg-radial relative overflow-hidden group">
            <input type="file" accept="image/*" id="receipt-ocr-uploader" onChange={handleReceiptUpload} disabled={isParsingReceipt} className="hidden" />

            {isParsingReceipt ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-3" />
                <p className="text-xs font-black text-slate-700 animate-pulse uppercase tracking-wider">{lang === "sw" ? "AI inasoma risiti yako..." : "AI parsing physical text..."}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{lang === "sw" ? "Tafadhali subiri sekunde kidogo." : "Running Gemini OCR Engine."}</p>
              </div>
            ) : parsedReceiptData ? (
              <div className="w-full text-left space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider items-center flex gap-1">
                    📝 <span>{lang === "sw" ? "Hakiki Ankara" : "Audit Parsed Receipt"}</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">Vendor: {parsedReceiptData.vendor || "External Merchant"}</span>
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-100 rounded-xl p-2.5 bg-slate-50 divide-y divide-slate-100">
                  {parsedReceiptData.items && parsedReceiptData.items.map((it: any, k: number) => (
                    <div key={`${it.name}-${k}`} className="flex justify-between py-1.5 text-xs font-semibold text-slate-700">
                      <span>{it.name} <span className="text-slate-400">x{it.quantity || 1}</span></span>
                      <span><PriceDisplay amount={it.price || 0} size="xs" colorClass="text-slate-700 font-semibold" /></span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{lang === "sw" ? "Jumla Kuu" : "Receipt Grand Total"}</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5"><PriceDisplay amount={parsedReceiptData.total} size="sm" colorClass="text-slate-800" /></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{lang === "sw" ? "Zawadi ya Alama" : "Loyalty Points Award"}</p>
                    <p className="text-xs font-black text-amber-700 mt-0.5 flex items-center justify-end gap-1"><Zap size={14} className="fill-amber-400 text-amber-500" /><span>+{parsedReceiptData.estimatedLoyaltyPoints || Math.floor(parsedReceiptData.total / 2000) || 50}</span></p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button type="button" onClick={handleClaimReceiptPoints} className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-md text-[11px] uppercase tracking-wider transition cursor-pointer shadow-md shadow-amber-200/50">
                    🎉 {lang === "sw" ? "Ingiza Alama Kwenye Akaunti" : "Claim Loyalty Points"}
                  </button>
                  <button type="button" onClick={() => setParsedReceiptData(null)} className="px-4 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-md text-[11px] transition cursor-pointer">{lang === "sw" ? "Ghairi" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <label htmlFor="receipt-ocr-uploader" className="flex flex-col items-center justify-center cursor-pointer w-full p-4 h-full">
                <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition duration-300 shadow-sm mb-3 animate-pulse"><Camera size={22} className="text-amber-600" /></div>
                <p className="text-sm font-bold text-slate-800 text-center">{lang === "sw" ? "Piga picha au chagua faili risiti hapa" : "Snap or upload receipt picture"}</p>
                <p className="text-[10.5px] text-slate-400 mt-1 font-semibold text-center uppercase tracking-wider">PNG, JPG, PDF • Dynamic Gemini OCR Parser</p>
              </label>
            )}

            {parsingError && <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-bold text-center w-full animate-pulse">⚠️ {parsingError}</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5"><Gift size={18} className="text-amber-500 animate-bounce" /><span>{lang === "sw" ? "Kibeti cha Zawadi na Kuponi" : "🎁 Unlockable VIP Rewards Showcase"}</span></h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 font-sans">{lang === "sw" ? "Badilisha alama zako kuwa kuponi halisi za mabezi" : "Redeem your accumulated points to instantly generate active coupon cards."}</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto shrink-0 border border-slate-200">
            <button type="button" onClick={() => setRewardsCategory("available")} className={`px-3 py-1.5 rounded-lg text-xs font-black transition uppercase tracking-wide cursor-pointer ${rewardsCategory === "available" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{lang === "sw" ? "Zilizopo Sasa" : "Available"}</button>
            <button type="button" onClick={() => setRewardsCategory("claimed")} className={`px-3 py-1.5 rounded-lg text-xs font-black transition uppercase tracking-wide cursor-pointer flex items-center gap-1 ${rewardsCategory === "claimed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <span>{lang === "sw" ? "Kuponi Zangu" : "My Coupons"}</span>
              {coupons.filter(c => (c.targetCustomer === userId || c.target_customer === userId)).length > 0 && <span className="bg-amber-100 text-amber-800 text-[10px] font-black h-4 px-1.5 rounded-full flex items-center justify-center">{coupons.filter(c => (c.targetCustomer === userId || c.target_customer === userId)).length}</span>}
            </button>
          </div>
        </div>

        {rewardsCategory === "available" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans font-semibold">
            {redeemableVouchers.map((v) => {
              const sufficient = pPoints >= v.points;
              const progressPct = Math.min(100, Math.floor((pPoints / v.points) * 100));
              const cardBg = sufficient ? "bg-gradient-to-br from-amber-50/40 via-white to-white border-amber-200 hover:-translate-y-1 hover:shadow-md cursor-pointer" : "bg-slate-50/50 border-slate-150 opacity-80";

              return (
                <div key={v.id} className={`border rounded-2xl p-5 flex flex-col justify-between transition-all select-none relative overflow-hidden ${cardBg}`}>
                  <div className="absolute -left-2 top-[55%] w-4 h-4 rounded-full bg-slate-50 border-r border-slate-150 shrink-0 z-10" />
                  <div className="absolute -right-2 top-[55%] w-4 h-4 rounded-full bg-slate-50 border-l border-slate-150 shrink-0 z-10" />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded border leading-none ${sufficient ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{v.points} {lang === "sw" ? "Alama" : "Points"}</span>
                      {sufficient ? <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">🔓 {lang === "sw" ? "Tayari" : "Unlocked"}</span> : <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">🔒 {v.points - pPoints} pts left</span>}
                    </div>
                    <div className="pt-2">
                      <h4 className="text-base font-black text-slate-800 tracking-tight leading-snug">{lang === "sw" ? v.nameSw : v.nameEn}</h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">{lang === "sw" ? v.descSw : v.descEn}</p>
                    </div>
                    {!sufficient && (
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400"><span>PROGRESS TO UNLOCK</span><span>{progressPct}%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className="bg-amber-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} /></div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dashed border-slate-150 my-4 shrink-0" />
                  <button type="button" onClick={() => handleRedeemVoucher(v)} disabled={!sufficient} className={`w-full py-2.5 font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer outline-none border-none flex items-center justify-center gap-1.5 ${sufficient ? "bg-amber-500 hover:bg-slate-850 text-white shadow-sm hover:shadow-md transition active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                    {sufficient ? <><Sparkles size={12} className="text-amber-300" /><span>{lang === "sw" ? "Kombolea Sasa" : "Redeem Coupon"}</span></> : <span>{lang === "sw" ? "Alama Hazitoshi" : "Insufficient Balance"}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.filter(c => (c.targetCustomer === userId || c.target_customer === userId)).length > 0 ? (
              coupons.filter(c => (c.targetCustomer === userId || c.target_customer === userId)).map(c => (
                <div key={c.id} className="p-4 border border-slate-150 rounded-2xl bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-slate-800">{c.code}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{c.discountPercentage}% Discount • Exp: {c.expiresAt.slice(0, 10)}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(c.code); }} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-primary transition"><Sparkles size={14} /></button>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl"><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{lang === "sw" ? "Huna kuponi bado" : "No active coupons yet"}</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
