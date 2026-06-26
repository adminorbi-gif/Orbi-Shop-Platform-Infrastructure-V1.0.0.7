import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sparkles, Trophy, Shuffle, Zap, Target, TrendingUp, HelpCircle, X } from 'lucide-react';
import { formatCurrency } from '../lib/storage';

interface ScratchCardProps {
  userId: string;
  lang: string;
  pPoints: number;
  orders: any[];
  onRewardClaimed: (pointsWon: number) => void;
}

export default function SkillScratchPuzzle({
  userId,
  lang,
  pPoints,
  orders = [],
  onRewardClaimed
}: ScratchCardProps) {
  // ---------- 1. ALL HOOKS (unconditional, top-level) ----------
  const cooldownKey = `orbi_puzzle_last_${userId}`;
  const [lastPlayTimestamp, setLastPlayTimestamp] = useState(() => 
    localStorage.getItem(cooldownKey) || "0"
  );
  const cooldownHours = 24;
  const timePassed = Date.now() - Number(lastPlayTimestamp);
  const hasPlayedToday = timePassed < cooldownHours * 60 * 60 * 1000;
  const timeLeftMs = (cooldownHours * 60 * 60 * 1000) - timePassed;
  const hoursLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60));

  const [phase, setPhase] = useState<'foil' | 'precision' | 'revealed'>(() => {
    return hasPlayedToday ? 'revealed' : 'foil';
  });

  const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'shipped');
  const totalSpentAmount = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
  const isNewCustomer = totalSpentAmount < 50000;

  // Streak and stats
  const [streak, setStreak] = useState(() => {
    const stored = localStorage.getItem(`orbi_puzzle_streak_${userId}`);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [totalPlays, setTotalPlays] = useState(() => {
    const stored = localStorage.getItem(`orbi_puzzle_plays_${userId}`);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [totalRewards, setTotalRewards] = useState(() => {
    const stored = localStorage.getItem(`orbi_puzzle_rewards_${userId}`);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Base points
  const [basePoints, setBasePoints] = useState(50);
  // Scratch canvas
  const [scratchPercent, setScratchPercent] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScratching, setIsScratching] = useState(false);
  // Precision timing
  const [timingPos, setTimingPos] = useState(0);
  const [timingDir, setTimingDir] = useState(1);
  const [precisionMult, setPrecisionMult] = useState(1.0);
  const [hitGrade, setHitGrade] = useState<'perfect' | 'great' | 'good' | null>(null);
  const [finalReward, setFinalReward] = useState(0);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem(`orbi_puzzle_tutorial_seen_${userId}`) !== "true";
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Scroll lock effect for the modal
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // ---------- 2. DERIVED VALUES (useMemo to keep stable) ----------
  const spentTier = useMemo(() => {
    if (isNewCustomer) {
      return {
        title: lang === "sw" ? "Mteja Mpya (Bonus ya Karibu 🎁)" : "New Explorer (Welcome Kit 🎁)",
        multiplier: 3.5,
        baseBonus: 350,
        badgeColor: "from-indigo-500 to-purple-600"
      };
    }
    if (totalSpentAmount >= 1500000) {
      return {
        title: lang === "sw" ? "Mfalme wa Ununuzi (Tycoon 👑)" : "Master Tycoon 👑",
        multiplier: 3.0,
        baseBonus: 500,
        badgeColor: "from-amber-500 to-orange-600"
      };
    }
    if (totalSpentAmount >= 500000) {
      return {
        title: lang === "sw" ? "Mnunuzi Mkubwa (VIP 💎)" : "High Spender VIP 💎",
        multiplier: 2.0,
        baseBonus: 250,
        badgeColor: "from-emerald-500 to-teal-600"
      };
    }
    if (totalSpentAmount >= 150000) {
      return {
        title: lang === "sw" ? "Mnunuzi Amilifu (Active 🛍️)" : "Active Shopper 🛍️",
        multiplier: 1.5,
        baseBonus: 100,
        badgeColor: "from-orange-500 to-amber-600"
      };
    }
    return {
      title: lang === "sw" ? "Mnunuzi wa Kawaida" : "Casual Shopper",
      multiplier: 1.2,
      baseBonus: 50,
      badgeColor: "from-slate-500 to-gray-600"
    };
  }, [isNewCustomer, totalSpentAmount, lang]);

  const loyaltyBonus = useMemo(() => {
    if (pPoints >= 6000) return 200;
    if (pPoints >= 3000) return 100;
    if (pPoints >= 1000) return 50;
    if (pPoints >= 300) return 20;
    return 0;
  }, [pPoints]);

  const revealChance = useMemo(() => {
    let base = 0.45;
    const streakBonus = Math.min(0.3, streak * 0.05);
    base += streakBonus;
    if (pPoints >= 6000) base += 0.10;
    else if (pPoints >= 3000) base += 0.07;
    else if (pPoints >= 1000) base += 0.05;
    else if (pPoints >= 300) base += 0.03;
    if (totalSpentAmount >= 1500000) base += 0.08;
    else if (totalSpentAmount >= 500000) base += 0.06;
    else if (totalSpentAmount >= 150000) base += 0.04;
    return Math.min(0.75, Math.max(0.30, base));
  }, [streak, pPoints, totalSpentAmount]);

  const timingSpeed = useMemo(() => {
    if (isNewCustomer) return 4.5;
    if (streak >= 5) return 14;
    if (totalSpentAmount >= 1500000) return 13;
    if (totalSpentAmount >= 500000) return 11;
    return 8;
  }, [isNewCustomer, streak, totalSpentAmount]);

  // ---------- 3. REWARD AVAILABILITY (sync with localStorage without breaking hooks) ----------
  const [isRewardAvailable, setIsRewardAvailable] = useState<boolean>(false);

  // Effect to initialise / sync reward availability
  useEffect(() => {
    if (hasPlayedToday) {
      setIsRewardAvailable(false);
      return;
    }
    const stored = localStorage.getItem("orbi_puzzle_reward_available");
    if (stored !== null) {
      setIsRewardAvailable(stored === "true");
      return;
    }
    const val = Math.random() < revealChance;
    localStorage.setItem("orbi_puzzle_reward_available", val ? "true" : "false");
    setIsRewardAvailable(val);
  }, [hasPlayedToday, revealChance]);

  // Effect to set base points when pPoints changes
  useEffect(() => {
    const bases = [40, 50, 60, 80, 100, 120];
    let maxIdx = pPoints >= 3000 ? 5 : pPoints >= 1000 ? 4 : 3;
    setBasePoints(bases[Math.floor(Math.random() * (maxIdx + 1))]);
  }, [pPoints]);

  // Precision timing loop
  useEffect(() => {
    if (phase !== 'precision') return;
    const interval = setInterval(() => {
      setTimingPos(prev => {
        let next = prev + timingDir * timingSpeed;
        if (next >= 100) {
          next = 100;
          setTimingDir(-1);
        } else if (next <= 0) {
          next = 0;
          setTimingDir(1);
        }
        return next;
      });
    }, 24);
    return () => clearInterval(interval);
  }, [phase, timingDir, timingSpeed]);

  // Draw foil canvas
  useEffect(() => {
    if (phase !== 'foil' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 320;
    canvas.height = 180;

    // Premium metallic silver-grey reflective gradient
    const grad = ctx.createLinearGradient(0, 0, 320, 180);
    grad.addColorStop(0, '#f8fafc'); // bright white highlight
    grad.addColorStop(0.2, '#e2e8f0'); // bright silver
    grad.addColorStop(0.5, '#cbd5e1'); // shiny metal
    grad.addColorStop(0.8, '#94a3b8'); // steel gray
    grad.addColorStop(1, '#475569'); // deep metal slate
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 320, 180);

    // Glowing diagonal light beams for shiny realistic finish
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(80, 0);
    ctx.lineTo(0, 180);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(130, 0);
    ctx.lineTo(240, 0);
    ctx.lineTo(60, 180);
    ctx.fill();

    // Metallic flake sparkles
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 320, Math.random() * 180, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bold solid borders to frame the card beautifully
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 308, 168);

    // Golden inner decorative dashes
    ctx.strokeStyle = '#ea580c'; // premium copper/orange
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(12, 12, 296, 156);
    ctx.setLineDash([]); // clear dash state

    ctx.fillStyle = '#0f172a'; // Deepest contrast color for guaranteed legibility
    ctx.font = '900 14px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lang === "sw" ? "★ ORBI REWARDS ★" : "★ ORBI LOYALTY CARD ★", 160, 48);

    ctx.font = 'extrabold 18px "Inter", sans-serif';
    ctx.fillStyle = '#4f46e5'; // Rich royal indigo
    ctx.fillText(lang === "sw" ? "FUTA SASA USHINDE!" : "SCRATCH & WIN NOW!", 160, 92);

    ctx.font = 'black 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText(lang === "sw" ? "Futa asilimia ≥75% uone Zawadi" : "Scratch ≥75% to reveal reward", 160, 135);
  }, [phase, lang]);

  // ---------- 4. EVENT HANDLERS ----------
  const handleScratch = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current || phase !== 'foil') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    setIsScratching(true);

    // Highly responsive tracking: evaluate on every move with high performance (i += 128)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    let total = 0;
    for (let i = 3; i < imgData.data.length; i += 128) {
      if (imgData.data[i] === 0) cleared++;
      total++;
    }
    const percent = Math.min(100, Math.floor((cleared / total) * 100));
    setScratchPercent(percent);
    if (percent >= 75) {
      // Gentle success sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 587.33;
        gain.gain.value = 0.05;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {}
      setPhase('precision');
    }
  }, [phase]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    handleScratch(e.clientX, e.clientY);
  }, [handleScratch]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    if (e.touches.length) handleScratch(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleScratch]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    if (e.touches.length) handleScratch(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleScratch]);

  const handleLockTiming = useCallback(() => {
    if (phase !== 'precision') return;

    let mult = 1.0;
    let grade: 'perfect' | 'great' | 'good' = 'good';

    const perfectRange = streak >= 5 ? [48, 52] : [46, 54];
    const greatRange = streak >= 5 ? [42, 58] : [38, 62];

    if (timingPos >= perfectRange[0] && timingPos <= perfectRange[1]) {
      mult = 2.5;
      grade = 'perfect';
    } else if (timingPos >= greatRange[0] && timingPos <= greatRange[1]) {
      mult = 1.5;
      grade = 'great';
    }

    setPrecisionMult(mult);
    setHitGrade(grade);

    const rewardAmount = isRewardAvailable 
      ? Math.round(((basePoints * spentTier.multiplier) + loyaltyBonus + spentTier.baseBonus) * mult)
      : 0;
    setFinalReward(rewardAmount);

    // Update stats
    const newPlays = totalPlays + 1;
    setTotalPlays(newPlays);
    localStorage.setItem(`orbi_puzzle_plays_${userId}`, newPlays.toString());

    if (rewardAmount > 0) {
      const newRewards = totalRewards + 1;
      setTotalRewards(newRewards);
      localStorage.setItem(`orbi_puzzle_rewards_${userId}`, newRewards.toString());
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem(`orbi_puzzle_streak_${userId}`, newStreak.toString());
    } else {
      setStreak(0);
      localStorage.setItem(`orbi_puzzle_streak_${userId}`, "0");
    }

    localStorage.setItem(cooldownKey, Date.now().toString());
    setLastPlayTimestamp(Date.now().toString());
    localStorage.setItem(`orbi_puzzle_last_reward_${userId}`, rewardAmount.toString());
    onRewardClaimed(rewardAmount);

    // Play feedback sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (rewardAmount > 0) {
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.value = 440;
        gain.gain.value = 0.08;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {}

    setPhase('revealed');
  }, [phase, timingPos, isRewardAvailable, basePoints, spentTier, loyaltyBonus, streak, totalPlays, totalRewards, cooldownKey, userId, onRewardClaimed]);

  const handleResetPuzzle = useCallback(() => {
    localStorage.removeItem(cooldownKey);
    localStorage.removeItem("orbi_puzzle_reward_available");
    setScratchPercent(0);
    setPhase('foil');
    setHitGrade(null);
    setPrecisionMult(1.0);
    setTimingPos(0);
    setTimingDir(1);
    // Reset reward availability will be re-evaluated in useEffect
  }, [cooldownKey]);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem(`orbi_puzzle_tutorial_seen_${userId}`, "true");
  }, [userId]);

  // ---------- 5. RENDER (all conditional returns are AFTER hooks) ----------
  
  // Inline Preview Card (default display on the page panel)
  if (!isModalOpen) {
    const lastReward = localStorage.getItem(`orbi_puzzle_last_reward_${userId}`) || "0";
    return (
      <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden ring-4 ring-orange-200/50 group animate-in fade-in duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-orange-600 flex items-center justify-center shadow-lg shadow-orange-750/35 shrink-0">
              <Trophy size={26} className="animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 font-sans text-white">
              <div className="flex items-center gap-1.5 text-xs text-yellow-250 font-black tracking-widest font-mono select-none">
                <Sparkles size={12} className="fill-yellow-400 text-yellow-300" />
                <span>{lang === "sw" ? "MCHEZO WA ZAWADI ZA KWELI" : "DAILY LOYALTY SCRATCH CHALLENGE"}</span>
              </div>
              <h3 className="text-white font-extrabold text-lg sm:text-xl mt-1 tracking-tight">
                {lang === "sw" ? "Scratch & Shinda Real Points!" : "Orbi Lucky Scratch Challenge!"}
              </h3>
              <p className="text-orange-50/90 text-xs mt-1.5 max-w-md font-semibold leading-relaxed">
                {lang === "sw" 
                  ? "Cheza kila masaa 24: futa ganda kukomboa alama za ununuzi halisi ambazo utazifanya punguzo la bei moja kwa moja wakati wa kulipia!"
                  : "Enjoy a physical scratch-out card every 24 hours to win real, active Shopping Points! Use them as instant cash discounts at checkout!"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end justify-center shrink-0 min-w-[160px] gap-2">
            <span className="inline-flex self-start sm:self-auto items-center gap-1.5 text-[10.5px] uppercase font-bold tracking-widest font-mono px-3.5 py-1.5 bg-black/25 text-yellow-300 rounded-full border border-white/10 shadow-sm">
              {streak} {lang === "sw" ? "siku mfululizo" : "day streak"} 🔥
            </span>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-white text-orange-700 hover:bg-yellow-50 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/15"
            >
              {hasPlayedToday && phase === 'revealed' ? (
                <>
                  <span>{lang === "sw" ? "Fungua Matokeo" : "View Won Points"}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-mono font-bold font-sans animate-pulse">+{lastReward} pts</span>
                </>
              ) : (
                <>
                  <span>{lang === "sw" ? "Cheza sasa" : "Play & Win Points"}</span>
                  <span className="animate-ping rounded-full h-2.5 w-2.5 bg-orange-600"></span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full Screen Stable Modal Rendering when isModalOpen is true
  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={() => setIsModalOpen(false)}
    >
      <div 
        className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col pointer-events-auto sm:my-auto my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek header border border glows */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Trophy size={18} />
            </div>
            <div>
              <h2 className="text-white text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                {lang === "sw" ? "Scratch & Reflex Puzzle" : "Orbi Scratch & Timing"}
                <span className="hidden sm:inline-block bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full font-mono tracking-wider">
                  {lang === "sw" ? "ZABADI YA UAMINIFU" : "LOYALTY GAME"}
                </span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTutorial(true)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-80 z-10 transition text-xs flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle size={15} />
              <span className="hidden sm:inline">{lang === "sw" ? "Maelezo" : "Guide"}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-slate-400 hover:text-white p-2 bg-slate-800/60 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body Frame */}
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          
          {showTutorial ? (
            <div className="max-w-xl mx-auto py-4">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-indigo-400" size={24} />
                <h3 className="text-white font-black text-xl font-sans tracking-tight">
                  {lang === "sw" ? "Jinsi ya Kucheza & Shinda" : "How to Play & Claim"}
                </h3>
              </div>
              <div className="space-y-4 text-slate-300 text-sm font-sans">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0 mt-0.5">1</div>
                  <p><strong>{lang === "sw" ? "Futa Ganda" : "Scratch the Metallic Foil"}</strong> – {lang === "sw" ? "Tumia kidole au mouse kufunua asilimia 75 ya zawadi iliyofichwa chini ya ganda la fedha." : "Use your finger or mouse to rub away and reveal at least 75% of the hidden silver foil card."}</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0 mt-0.5">2</div>
                  <p><strong>{lang === "sw" ? "Mchezo wa Kasi ya Sekunde" : "Precision timing target"}</strong> – {lang === "sw" ? "Bonyeza LOCK TIMING kusimamisha kishale katikati kabisa ya eneo la kijani kibichi ili kuzidisha pointi zako hadi mara 2.5x!" : "Press the LOCK TIMING button to freeze the marker in the center green zone to boost your won points by up to 2.5x!"}</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0 mt-0.5">3</div>
                  <p><strong>{lang === "sw" ? "Kiwango cha Streak ya Kila Siku" : "Daily Streak Bonus"}</strong> – {lang === "sw" ? "Kucheza kila siku kunaongeza odds zako za uaminifu na kutoa zawadi kubwa zaidi za kuanzia!" : "Enjoying the challenge every 24 hours locks in your consecutive streak, inflating base rewards for major payouts!"}</p>
                </div>
                <div className="bg-emerald-500/15 p-3.5 rounded-xl border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed font-semibold">
                  💸 {lang === "sw" ? "Jipatie alama za kweli za ununuzi ambazo unaweza kuzitumia mara moja kama punguzo la pesa wakati wa kulipia (checkout) au kuzibadilisha kuwa vocha za duka! Ni 100% bure na halali kwa oda zote." : "Earn real shopping points that you can instantly use as cash discounts at checkout or redeem for active store vouchers! 100% free and valid for all orders."}
                </div>
              </div>
              <button
                onClick={handleCloseTutorial}
                className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/10 active:scale-95 cursor-pointer text-center"
              >
                {lang === "sw" ? "Nimeelewa, Anza sasa!" : "Let's Play & Win Real Points!"}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Interactive Module */}
              <div className="col-span-12 md:col-span-6 flex flex-col items-center justify-center py-4">
                
                {phase === 'foil' && (
                  <div className="relative w-[320px] h-[180px] bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center border border-yellow-300">
                    {/* Animated glowing golden reward backdrop hidden behind the scratch foil */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-100 via-amber-400 to-amber-700 opacity-90 animate-pulse"></div>
                    
                    {/* Glowing golden light beams */}
                    <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-t from-transparent via-white/10 to-transparent rotate-12 scale-150 transform origin-center"></div>

                    {/* Highly enticing gift content visible underneath when scratched */}
                    <div className="relative z-0 text-center flex flex-col items-center justify-center p-4 select-none">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white mb-2 shadow-inner border border-white/20">
                        <Trophy size={24} className="text-yellow-100 animate-bounce" />
                      </div>
                      <div className="text-white font-black text-sm uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        {lang === "sw" ? "★ ZAWADI IMELUNDIKANA ★" : "★ LUCKY MATCH VALUE ★"}
                      </div>
                      <p className="text-yellow-100 font-extrabold font-mono text-xs drop-shadow-sm mt-0.5 uppercase tracking-tight">
                        {lang === "sw" ? "Karibu kwenye Kipimo cha Kasi!" : "Unlock timing puzzle for 2.5x!"}
                      </p>
                    </div>

                    {/* Absolutly positioned scratchoff canvas perfectly overlapping */}
                    <canvas
                      ref={canvasRef}
                      onMouseMove={handleMouseMove}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none rounded-xl"
                      style={{ touchAction: 'none' }}
                    />
                    
                    {isScratching && (
                      <div className="absolute bottom-2 right-2 z-20 bg-slate-950/90 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-bold text-amber-400 border border-amber-500/30 shadow-lg uppercase tracking-wider">
                        {scratchPercent}% {lang === "sw" ? "Kufunuliwa" : "Scratched"}
                      </div>
                    )}
                  </div>
                )}

                {phase === 'precision' && (
                  <div className="w-full max-w-[320px] p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/40 rounded-2xl text-center space-y-4 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                      <Zap size={24} className="animate-pulse text-indigo-300" />
                    </div>
                    <div className="font-sans">
                      <span className="text-[10px] text-indigo-400 font-extrabold tracking-widest font-mono uppercase bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        {lang === "sw" ? "KIPIMO CHA USHAHIDI" : "PRECISION TIMING TEST"}
                      </span>
                      <p className="text-white font-bold mt-3 text-sm">{lang === "sw" ? "Simamisha kishale ndani ya eneo la kijani!" : "Freeze the controller marker inside the green zone!"}</p>
                      <p className="text-slate-400 text-xs mt-1">{lang === "sw" ? "Perfect = 2.5x Punguzo | Great = 1.5x" : "Perfect Lock = 2.5x Multiplier | Great = 1.5x"}</p>
                    </div>

                    <div className="relative h-9 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner p-1">
                      {/* Center Green Target Zone */}
                      <div className="absolute inset-0 flex justify-center">
                        <div className="w-1/4 h-full bg-gradient-to-r from-emerald-500/25 via-emerald-400/50 to-emerald-500/25 border-x border-emerald-400/60 flex items-center justify-center">
                          <span className="text-[7.5px] font-black text-emerald-300 tracking-widest uppercase scale-75">TARGET</span>
                        </div>
                      </div>
                      {/* Moving Marker */}
                      <div 
                        className="absolute w-4 h-[28px] top-[3px] bg-gradient-to-b from-indigo-300 via-indigo-500 to-indigo-600 rounded-full shadow-[0_0_15px_#6366f1] transition-all duration-75 flex items-center justify-center border border-white/20"
                        style={{ left: `${timingPos}%`, transform: 'translateX(-50%)' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </div>
                    </div>

                    <button
                      onClick={handleLockTiming}
                      className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-extrabold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/15 font-mono tracking-tight cursor-pointer text-sm"
                    >
                      🎯 LOCK TIMING NOW
                    </button>
                  </div>
                )}

                {phase === 'revealed' && (
                  <div className="w-full max-w-[320px] p-6 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl relative overflow-hidden">
                    {isRewardAvailable ? (
                      <>
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2.5xl"></div>
                        <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-300 p-[2px] mx-auto shadow-lg shadow-amber-500/20">
                          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
                            <Trophy className="animate-bounce" size={32} />
                          </div>
                        </div>
                        <div className="font-sans relative z-10">
                          <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-extrabold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase">
                            {lang === "sw" ? "POINTI ZA KWELI ZILIZOSHINDWA" : "REAL POINTS WINNER!"}
                          </span>
                          <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-emerald-400 mt-3 font-mono">
                            +{finalReward} PTS
                          </p>
                          {hitGrade && (
                            <div className={`mt-2 text-[10px] font-black tracking-widest ${
                              hitGrade === 'perfect' 
                                ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25' 
                                : hitGrade === 'great' 
                                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' 
                                  : 'text-slate-400 bg-slate-400/10 border-slate-400/25'
                            } border rounded-full px-2 py-0.5 w-fit mx-auto`}>
                              {hitGrade === 'perfect' ? '⭐ PERFECT TIMING ⭐' : hitGrade === 'great' ? '✨ GREAT TIMING ✨' : '👍 GOOD TIMING'}
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-4 px-2 leading-relaxed">
                            {lang === "sw" 
                              ? "Pointi hizi ni halisi na zilizoingizwa kwenye salio lako la duka instantly! Zitumie kupata punguzo ukiwa unalipia." 
                              : "This reward is 100% active and has been stored in your profile wallet. Apply as an instant cash discount on your next cart!"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-755 flex items-center justify-center mx-auto text-slate-500">
                          <Shuffle size={28} />
                        </div>
                        <div className="font-sans">
                          <span className="text-[10px] text-slate-500 font-mono tracking-wider font-bold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full uppercase">
                            {lang === "sw" ? "BAHATI MBAYA" : "TRY AGAIN TOMORROW"}
                          </span>
                          <p className="text-white font-extrabold mt-3 text-sm">{lang === "sw" ? "Hakuna zawadi mzunguko huu" : "No points won this round"}</p>
                          <p className="text-slate-400 text-xs mt-2 leading-relaxed px-2">
                            {lang === "sw" 
                              ? "Weka mfululizo wako hai! Kila siku unayocheza mfululizo huongeza nafasi yako ya kupata multipliers kubwa zaidi." 
                              : "Keep your daily streak active! Consecutive play increases your multipliers and chances of secure wins."}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
 
              {/* Right Column: Multipliers, Current Stats & Formula Details */}
              <div className="col-span-12 md:col-span-6 space-y-4 text-left">
                <div className="bg-slate-850/40 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-lg">
                  <h4 className="text-slate-400 text-[10px] font-mono tracking-widest font-bold border-b border-slate-800 pb-2">
                    {lang === "sw" ? "YAKO MAZIDISHO (FORMULA)" : "YOUR REWARD MULTIPLIERS"}
                  </h4>
                  
                  {/* Spent Tier Multiplier Block */}
                  <div className={`bg-gradient-to-r ${spentTier.badgeColor} bg-opacity-15 p-3.5 rounded-xl border border-white/5 shadow-md flex justify-between items-center`}>
                     <div className="font-sans">
                      <span className="text-white text-xs font-black block tracking-tight uppercase leading-none">{spentTier.title}</span>
                      <span className="text-slate-300 text-[10px] mt-1.5 block">+{spentTier.baseBonus} {lang === "sw" ? "pointi za kuanzia" : "base points reward"}</span>
                    </div>
                    <span className="text-white font-mono text-xl font-bold bg-black/30 px-2 py-1 rounded shrink-0">{spentTier.multiplier}x</span>
                  </div>
 
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/40 text-xs text-sans font-sans">
                      <span className="text-slate-400">{lang === "sw" ? "Pointi za Msingi za mchezo" : "Base puzzle reward value"}</span>
                      <span className="text-white font-bold font-mono">{basePoints} pts</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/40 text-xs text-sans font-sans">
                      <span className="text-slate-400">{lang === "sw" ? "Kiwango cha Ukarimu" : "Loyalty reward bonus"}</span>
                      <span className="text-indigo-400 font-bold font-mono">+{loyaltyBonus} pts</span>
                    </div>
                  </div>
                </div>
 
                {/* Streak Card */}
                <div className="bg-slate-850/40 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
                  <div className="space-y-1 font-sans">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono tracking-widest font-bold">
                      <TrendingUp size={11} className="text-emerald-400" />
                      <span>{lang === "sw" ? "MCHAKATO WA STREAK" : "STREAK MULTIPLIER ACTIVE"}</span>
                    </div>
                    <p className="text-white text-xs leading-relaxed">
                      {lang === "sw" 
                        ? `Streak yako ya sasa: `
                        : `Your consecutive login streak: `}
                      <strong className="text-emerald-400 text-sm font-mono">{streak}</strong> {lang === "sw" ? "siku" : "days"} 🔥
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <TrendingUp size={18} />
                  </div>
                </div>
 
                {/* Cooldown or stats footer */}
                <div className="bg-slate-850/40 border border-slate-800/80 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed font-sans space-y-1 shadow-lg">
                  <span className="text-white font-black block text-[9.5px] uppercase tracking-wider font-mono text-slate-500">{lang === "sw" ? "KANUNI ZA SKILL CHANCE" : "SKILL PUZZLE SYSTEM"}</span>
                  <p>🎯 {lang === "sw" ? "Usahihi wako wa mda hutoa hadi mara multipliers 2.5x zaidi." : "Stopping the needle closer to the center gives up to 2.5x point scaling."}</p>
                  {hasPlayedToday && (
                    <div className="pt-2 border-t border-slate-800/80 mt-2 text-indigo-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse font-sans"></span>
                      <span>
                        {lang === "sw" 
                          ? `Inayofuata inapatikana baada ya: ${hoursLeft} hrs` 
                          : `Next daily challenge unlocks in: ${hoursLeft} hrs`}
                      </span>
                    </div>
                  )}
                </div>
 
              </div>
 
            </div>
          )}
 
        </div>
 
        {/* Modal footer indicators / feedback */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 text-center flex flex-wrap items-center justify-between gap-3 relative z-10 text-xs text-slate-500 font-sans">
          <span>{lang === "sw" ? "Inamilikiwa na Orbi Loyalty Services" : "Powered by Orbi Rewards Program"}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
            >
              {lang === "sw" ? "Funga na Uendelee" : "Close Challenge"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}