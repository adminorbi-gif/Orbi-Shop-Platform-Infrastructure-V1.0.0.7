import React, { useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Gift,
  KeyRound,
  Lock,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { formatCurrency } from "../lib/storage";

interface ScratchCardProps {
  userId: string;
  lang: string;
  pPoints: number;
  orders: any[];
  onRewardClaimed: (pointsWon: number) => void;
}

type GameId = "scratch" | "spin" | "vault";

type GameConfig = {
  id: GameId;
  labelSw: string;
  labelEn: string;
  helperSw: string;
  helperEn: string;
  icon: React.ElementType;
  tone: string;
};

type GameMove = {
  id: string;
  labelSw: string;
  labelEn: string;
  helperSw: string;
  helperEn: string;
  multiplier: number;
  tone: string;
};

type PuzzleMove = GameMove & {
  displayCode: string;
  metricLabel: string;
  metricValue: string;
  distance: number;
  correct: boolean;
};

type PuzzleProfile = {
  titleSw: string;
  titleEn: string;
  instructionSw: string;
  instructionEn: string;
  levelStorySw: string;
  levelStoryEn: string;
  targetLabel: string;
  targetValue: string;
  moves: PuzzleMove[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAILY_TRIALS = 3;
const MAX_LEVEL = 20;

const levelStories = [
  ["Starter checksum", "Jifunze kusoma target na code rahisi."],
  ["Pattern reader", "Tambua tofauti kati ya codes zinazofanana."],
  ["Fast matcher", "Linganishia matokeo bila kutegemea kubahatisha."],
  ["Logic runner", "Hesabu expression ndogo kwa umakini."],
  ["Code scout", "Chuja option zinazoonekana karibu lakini si sahihi."],
  ["Signal keeper", "Soma alama ya game na tumia target kwa usahihi."],
  ["Matrix learner", "Expressions zinaanza kuwa na hatua tatu."],
  ["Vault analyst", "Checksum inahitaji kuangalia namba zaidi ya moja."],
  ["Spin engineer", "Tafuta landing inayolingana na zone kwa hesabu."],
  ["Control specialist", "Usikimbilie kuchagua, linganisha kila card."],
  ["Secure solver", "Kila code ina modifier, kosa dogo linabadilisha matokeo."],
  ["Risk filter", "Ondoa majibu ya mtego kabla ya kuchagua."],
  ["Prime tracker", "Target sasa inahitaji modulo kubwa zaidi."],
  ["Pattern architect", "Hesabu inahitaji order sahihi ya operations."],
  ["Advanced operator", "Chagua expression inayotimiza target ngumu."],
  ["Core calibrator", "Codes zinafanana sana, accuracy ni lazima."],
  ["Master validator", "Target inahitaji double-check kabla ya submit."],
  ["Elite puzzle", "Mistari michache inaonekana sahihi, moja tu ndio sahihi."],
  ["Institutional grade", "Challenge ya juu inayopima calculation na patience."],
  ["Grand master", "Kiwango cha mwisho: code ngumu, reward kubwa zaidi."],
] as const;

const games: GameConfig[] = [
  {
    id: "scratch",
    labelSw: "Scratch Logic",
    labelEn: "Scratch Logic",
    helperSw: "Soma checksum, chagua kadi inayolingana.",
    helperEn: "Read the checksum and pick the matching card.",
    icon: Sparkles,
    tone: "from-fuchsia-500 to-rose-600",
  },
  {
    id: "spin",
    labelSw: "Spin Calibrator",
    labelEn: "Spin Calibrator",
    helperSw: "Chagua spin itakayokaribia green zone.",
    helperEn: "Choose the spin closest to the green zone.",
    icon: Shuffle,
    tone: "from-blue-500 to-indigo-600",
  },
  {
    id: "vault",
    labelSw: "Vault Code",
    labelEn: "Vault Code",
    helperSw: "Linganishia key na vault checksum.",
    helperEn: "Match the key with the vault checksum.",
    icon: KeyRound,
    tone: "from-emerald-500 to-teal-600",
  },
];

const gameMoves: Record<GameId, GameMove[]> = {
  scratch: [
    {
      id: "card-a",
      labelSw: "Kadi A",
      labelEn: "Card A",
      helperSw: "Angalia namba ya mwisho ya code.",
      helperEn: "Check the final checksum digit.",
      multiplier: 1.1,
      tone: "from-orange-400 to-amber-600",
    },
    {
      id: "card-b",
      labelSw: "Kadi B",
      labelEn: "Card B",
      helperSw: "Linganishia sum na target.",
      helperEn: "Match the sum against the target.",
      multiplier: 1.55,
      tone: "from-slate-400 to-slate-700",
    },
    {
      id: "card-c",
      labelSw: "Kadi C",
      labelEn: "Card C",
      helperSw: "Kadi sahihi hutoa multiplier bora.",
      helperEn: "The right card unlocks a better multiplier.",
      multiplier: 2.1,
      tone: "from-cyan-400 to-blue-700",
    },
  ],
  spin: [
    {
      id: "spin-low",
      labelSw: "Low Spin",
      labelEn: "Low Spin",
      helperSw: "Nguvu ndogo, movement thabiti.",
      helperEn: "Low power, stable movement.",
      multiplier: 1.15,
      tone: "from-sky-400 to-blue-600",
    },
    {
      id: "spin-mid",
      labelSw: "Core Spin",
      labelEn: "Core Spin",
      helperSw: "Nguvu ya kati, balance nzuri.",
      helperEn: "Medium power, balanced landing.",
      multiplier: 1.6,
      tone: "from-indigo-500 to-violet-700",
    },
    {
      id: "spin-high",
      labelSw: "Turbo Spin",
      labelEn: "Turbo Spin",
      helperSw: "Nguvu kubwa, inahitaji usahihi zaidi.",
      helperEn: "High power, requires stronger accuracy.",
      multiplier: 2.25,
      tone: "from-rose-500 to-red-700",
    },
  ],
  vault: [
    {
      id: "key-safe",
      labelSw: "Key 1",
      labelEn: "Key 1",
      helperSw: "Hesabu checksum yake ulinganishe na target.",
      helperEn: "Calculate its checksum and compare with the target.",
      multiplier: 1.2,
      tone: "from-emerald-500 to-teal-600",
    },
    {
      id: "key-prime",
      labelSw: "Key 2",
      labelEn: "Key 2",
      helperSw: "Key yenye pattern ya kati.",
      helperEn: "A key with a medium pattern.",
      multiplier: 1.7,
      tone: "from-violet-500 to-indigo-700",
    },
    {
      id: "key-master",
      labelSw: "Key 3",
      labelEn: "Key 3",
      helperSw: "Key yenye vault multiplier.",
      helperEn: "A key with a vault multiplier.",
      multiplier: 2.35,
      tone: "from-amber-500 to-orange-700",
    },
  ],
};

const readInt = (key: string, fallback = 0) => {
  const raw = localStorage.getItem(key);
  const parsed = raw ? parseInt(raw, 10) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const seedNumber = (seed: string, modulo = 1000) =>
  seed.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 7), 23) %
  modulo;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const makePuzzle = (gameId: GameId, userId: string, plays: number, level: number): PuzzleProfile => {
  const moves = gameMoves[gameId];
  const day = todayKey();
  const safeLevel = clamp(level, 1, MAX_LEVEL);
  const modulus = safeLevel >= 16 ? 19 : safeLevel >= 11 ? 17 : safeLevel >= 6 ? 13 : 10;
  const target = seedNumber(`${userId}-${day}-${gameId}-target-${safeLevel}`, modulus - 1) + 1;
  const correctIndex = seedNumber(`${userId}-${day}-${gameId}-index-${safeLevel}`, moves.length);
  const story = levelStories[safeLevel - 1];

  const buildValue = (index: number, moveId: string) => {
    const a = seedNumber(`${userId}-${day}-${gameId}-${moveId}-a-${safeLevel}`, 9 + safeLevel) + 1;
    const b = seedNumber(`${userId}-${day}-${gameId}-${moveId}-b-${safeLevel}`, 8 + safeLevel) + 1;
    const c = seedNumber(`${userId}-${day}-${gameId}-${moveId}-c-${safeLevel}`, 7 + safeLevel) + 1;
    const modifier = seedNumber(`${userId}-${day}-${gameId}-${moveId}-m-${safeLevel}`, 5) + 1;
    const wrongValue = ((a + b + c + modifier + index + safeLevel) % modulus) || modulus;
    const value = index === correctIndex ? target : wrongValue === target ? (target % modulus) + 1 : wrongValue;

    if (safeLevel >= 16) {
      return {
        expression: `(${a}×2 + ${b} - ${c} + ${modifier}) mod ${modulus}`,
        value,
      };
    }
    if (safeLevel >= 11) {
      return {
        expression: `(${a} + ${b} + ${c} + ${modifier}) mod ${modulus}`,
        value,
      };
    }
    if (safeLevel >= 6) {
      return {
        expression: `(${a} + ${b} + ${modifier}) mod ${modulus}`,
        value,
      };
    }
    return {
      expression: `${a} + ${b}`,
      value,
    };
  };

  if (gameId === "spin") {
    const enriched = moves.map((move, index) => {
      const puzzleValue = buildValue(index, move.id);
      const distance = Math.abs(puzzleValue.value - target);
      return {
        ...move,
        displayCode: puzzleValue.expression,
        metricLabel: "Result",
        metricValue: String(puzzleValue.value),
        distance,
        correct: puzzleValue.value === target,
      };
    });
    return {
      titleSw: "Calibrate Spin",
      titleEn: "Calibrate Spin",
      instructionSw: "Tatua expression ya kila spin, chagua ile inayotoa target.",
      instructionEn: "Solve each spin expression and choose the one that equals the target.",
      levelStorySw: story[1],
      levelStoryEn: story[0],
      targetLabel: `Target mod ${modulus}`,
      targetValue: String(target),
      moves: enriched,
    };
  }

  if (gameId === "vault") {
    const enriched = moves.map((move, index) => {
      const puzzleValue = buildValue(index, move.id);
      const distance = Math.abs(puzzleValue.value - target);
      return {
        ...move,
        displayCode: puzzleValue.expression,
        metricLabel: "Checksum",
        metricValue: String(puzzleValue.value),
        distance,
        correct: puzzleValue.value === target,
      };
    });
    return {
      titleSw: "Open Vault Code",
      titleEn: "Open Vault Code",
      instructionSw: "Fungua vault kwa key yenye checksum inayolingana na target.",
      instructionEn: "Open the vault with the key whose checksum equals the target.",
      levelStorySw: story[1],
      levelStoryEn: story[0],
      targetLabel: `Vault mod ${modulus}`,
      targetValue: String(target),
      moves: enriched,
    };
  }

  const enriched = moves.map((move, index) => {
    const puzzleValue = buildValue(index, move.id);
    const distance = Math.abs(puzzleValue.value - target);
    return {
      ...move,
      displayCode: puzzleValue.expression,
      metricLabel: "Answer",
      metricValue: String(puzzleValue.value),
      distance,
      correct: puzzleValue.value === target,
    };
  });

  return {
    titleSw: "Scratch Checksum",
    titleEn: "Scratch Checksum",
    instructionSw: "Tatua kila kadi, chagua answer inayolingana na target.",
    instructionEn: "Solve each card and choose the answer that matches the target.",
    levelStorySw: story[1],
    levelStoryEn: story[0],
    targetLabel: `Target mod ${modulus}`,
    targetValue: String(target),
    moves: enriched,
  };
};

export default function ScratchCardChallenge({
  userId,
  lang,
  pPoints,
  orders = [],
  onRewardClaimed,
}: ScratchCardProps) {
  const prefix = `orbi_reward_games_${userId}`;
  const lastPlayKey = `${prefix}_last_play`;
  const streakKey = `${prefix}_streak`;
  const playsKey = `${prefix}_plays`;
  const rewardsKey = `${prefix}_rewarded_plays`;
  const totalPointsKey = `${prefix}_total_points`;
  const lastRewardKey = `orbi_puzzle_last_reward_${userId}`;
  const lastGameKey = `${prefix}_last_game`;
  const masterCompletionsKey = `${prefix}_master_completions`;
  const trialDayKey = `${prefix}_trial_day`;
  const trialsLeftKey = `${prefix}_trials_left`;
  const dailyWonKey = `${prefix}_daily_won`;

  const [selectedGame, setSelectedGame] = useState<GameId>(
    () => (localStorage.getItem(lastGameKey) as GameId) || "scratch",
  );
  const [lastPlay, setLastPlay] = useState(() => localStorage.getItem(lastPlayKey) || "");
  const [streak, setStreak] = useState(() => readInt(streakKey));
  const [totalPlays, setTotalPlays] = useState(() => readInt(playsKey));
  const [rewardedPlays, setRewardedPlays] = useState(() => readInt(rewardsKey));
  const [totalRewardedPoints, setTotalRewardedPoints] = useState(() => readInt(totalPointsKey));
  const [gameLevels, setGameLevels] = useState<Record<GameId, number>>(() => ({
    scratch: clamp(readInt(`${prefix}_level_scratch`, 1), 1, MAX_LEVEL),
    spin: clamp(readInt(`${prefix}_level_spin`, 1), 1, MAX_LEVEL),
    vault: clamp(readInt(`${prefix}_level_vault`, 1), 1, MAX_LEVEL),
  }));
  const [masterCompletions, setMasterCompletions] = useState(() =>
    readInt(masterCompletionsKey),
  );
  const [trialsLeft, setTrialsLeft] = useState(() => {
    if (localStorage.getItem(trialDayKey) !== todayKey()) return MAX_DAILY_TRIALS;
    return clamp(readInt(trialsLeftKey, MAX_DAILY_TRIALS), 0, MAX_DAILY_TRIALS);
  });
  const [dailyWon, setDailyWon] = useState(() => {
    if (localStorage.getItem(trialDayKey) !== todayKey()) return false;
    return localStorage.getItem(dailyWonKey) === "true";
  });
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [result, setResult] = useState<{
    won: boolean;
    points: number;
    message: string;
  } | null>(() => {
    const lastReward = readInt(lastRewardKey);
    if (!lastReward && !localStorage.getItem(`orbi_puzzle_last_${userId}`)) return null;
    return {
      won: lastReward > 0,
      points: lastReward,
      message:
        lastReward > 0
          ? lang === "sw"
            ? "Zawadi yako ya mwisho imeongezwa kwenye salio lako."
            : "Your latest reward was added to your balance."
          : lang === "sw"
            ? "Jaribu tena kwenye mzunguko ujao."
            : "Try again on the next daily round.",
    };
  });

  const now = Date.now();
  const lastPlayMs = Number(lastPlay || localStorage.getItem(`orbi_puzzle_last_${userId}`) || 0);
  const dailyLocked = dailyWon || trialsLeft <= 0;
  const hoursLeft = dailyLocked
    ? Math.max(1, Math.ceil((DAY_MS - (now - (lastPlayMs || now))) / (60 * 60 * 1000)))
    : 0;

  const confirmedOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["confirmed", "shipped", "delivered", "customer_confirmed"].includes(
          String(order.status || "").toLowerCase(),
        ),
      ),
    [orders],
  );

  const totalSpentAmount = useMemo(
    () => confirmedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    [confirmedOrders],
  );

  const rewardProfile = useMemo(() => {
    const spendTier =
      totalSpentAmount >= 1500000
        ? 140
        : totalSpentAmount >= 500000
          ? 100
          : totalSpentAmount >= 150000
            ? 70
            : totalSpentAmount > 0
              ? 45
              : 30;
    const pointsTier = pPoints >= 3000 ? 80 : pPoints >= 1000 ? 50 : pPoints >= 300 ? 25 : 10;
    const streakBonus = Math.min(75, streak * 15);
    const base = clamp(spendTier + pointsTier + streakBonus, 25, 350);

    return {
      base,
      cashValue: Math.round(base / 10),
      trustScore: Math.min(100, 40 + Math.floor(pPoints / 100) + streak * 4),
    };
  }, [pPoints, streak, totalSpentAmount]);

  const activeLevel = gameLevels[selectedGame] || 1;
  const isMastered = activeLevel >= MAX_LEVEL;
  const puzzle = useMemo(
    () => makePuzzle(selectedGame, userId, totalPlays, activeLevel),
    [activeLevel, selectedGame, totalPlays, userId],
  );
  const activeGame = games.find((game) => game.id === selectedGame) || games[0];
  const ActiveIcon = activeGame.icon;
  const canPlay = !dailyLocked;

  const selectGame = (gameId: GameId) => {
    if (dailyLocked) return;
    setSelectedGame(gameId);
    setSelectedMove(null);
    localStorage.setItem(lastGameKey, gameId);
  };

  const playMove = (move: PuzzleMove) => {
    if (dailyLocked) return;

    setSelectedMove(move.id);
    const accuracyMultiplier = move.correct ? 1 : 0;
    const loyaltyBoost = Math.min(90, streak * 10 + (pPoints >= 1000 ? 30 : 0));
    const levelMultiplier = isMastered ? 2.6 : 1 + (activeLevel - 1) * 0.12;
    const rawReward =
      accuracyMultiplier > 0
        ? Math.round(((rewardProfile.base + loyaltyBoost) * move.multiplier * levelMultiplier) / 5) *
          5
        : 0;
    const pointsWon = Math.min(isMastered ? 750 : 900, Math.max(0, rawReward));

    const nextPlays = totalPlays + 1;
    const nextRewarded = rewardedPlays + (pointsWon > 0 ? 1 : 0);
    const nextStreak = move.correct ? streak + 1 : 0;
    const nextTotalPoints = totalRewardedPoints + pointsWon;
    const nextTrialsLeft = move.correct ? trialsLeft : Math.max(0, trialsLeft - 1);
    const nextLevel = move.correct && !isMastered ? Math.min(MAX_LEVEL, activeLevel + 1) : activeLevel;
    const nextGameLevels = { ...gameLevels, [selectedGame]: nextLevel };
    const nextMasterCompletions = move.correct && isMastered ? masterCompletions + 1 : masterCompletions;
    const timestamp = Date.now().toString();

    localStorage.setItem(trialDayKey, todayKey());
    localStorage.setItem(trialsLeftKey, String(nextTrialsLeft));
    localStorage.setItem(dailyWonKey, move.correct ? "true" : "false");
    localStorage.setItem(lastPlayKey, timestamp);
    localStorage.setItem(`orbi_puzzle_last_${userId}`, timestamp);
    localStorage.setItem(streakKey, String(nextStreak));
    localStorage.setItem(`orbi_puzzle_streak_${userId}`, String(nextStreak));
    localStorage.setItem(playsKey, String(nextPlays));
    localStorage.setItem(`orbi_puzzle_plays_${userId}`, String(nextPlays));
    localStorage.setItem(rewardsKey, String(nextRewarded));
    localStorage.setItem(`orbi_puzzle_rewards_${userId}`, String(nextRewarded));
    localStorage.setItem(totalPointsKey, String(nextTotalPoints));
    localStorage.setItem(lastRewardKey, String(pointsWon));
    localStorage.setItem(`${prefix}_level_${selectedGame}`, String(nextLevel));
    localStorage.setItem(masterCompletionsKey, String(nextMasterCompletions));

    setLastPlay(timestamp);
    setTotalPlays(nextPlays);
    setRewardedPlays(nextRewarded);
    setStreak(nextStreak);
    setTotalRewardedPoints(nextTotalPoints);
    setTrialsLeft(nextTrialsLeft);
    setDailyWon(move.correct);
    setGameLevels(nextGameLevels);
    setMasterCompletions(nextMasterCompletions);
    setResult({
      won: pointsWon > 0,
      points: pointsWon,
      message:
        pointsWon > 0
          ? isMastered
            ? lang === "sw"
              ? "Master Challenge imeshindwa. Badge yako imeimarishwa na pointi zimeongezwa."
              : "Master Challenge solved. Your badge was reinforced and points were added."
            : lang === "sw"
              ? `Jibu sahihi. Level ${nextLevel} imefunguka na pointi zimeongezwa.`
              : `Correct answer. Level ${nextLevel} unlocked and points were added.`
          : lang === "sw"
            ? `Jibu halijalingana. Trial zimebaki ${nextTrialsLeft}.`
            : `The answer did not match. ${nextTrialsLeft} trials left.`,
    });
    onRewardClaimed(pointsWon);
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="relative overflow-hidden bg-slate-950 text-white p-4 sm:p-5">
        <div className="absolute -top-10 right-0 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <ActiveIcon size={24} className="text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-200 font-black">
                {lang === "sw" ? "Technical Reward Games" : "Technical Reward Games"}
              </p>
              <h3 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                {lang === "sw" ? "Chagua puzzle moja ucheze leo" : "Choose one puzzle to play today"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {lang === "sw"
                  ? "Soma target, hesabu code, kisha chagua jibu sahihi. Pointi hutolewa kwa challenge iliyoshindwa kwa usahihi."
                  : "Read the target, solve the code, then choose the correct answer. Points are awarded only for a solved challenge."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 lg:min-w-[360px]">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
              <p className="text-[9px] uppercase text-slate-400 font-black">Level</p>
              <p className="text-lg font-black">{isMastered ? "MAX" : activeLevel}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
              <p className="text-[9px] uppercase text-slate-400 font-black">
                {lang === "sw" ? "Trials" : "Trials"}
              </p>
              <p className="text-lg font-black">{trialsLeft}/{MAX_DAILY_TRIALS}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
              <p className="text-[9px] uppercase text-slate-400 font-black">
                {lang === "sw" ? "Salio" : "Points"}
              </p>
              <p className="text-lg font-black">{pPoints}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
              <p className="text-[9px] uppercase text-slate-400 font-black">Trust</p>
              <p className="text-lg font-black">{rewardProfile.trustScore}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {games.map((game) => {
            const Icon = game.icon;
            const active = game.id === selectedGame;
            return (
              <button
                key={game.id}
                type="button"
                disabled={dailyLocked}
                onClick={() => selectGame(game.id)}
                className={`min-h-[112px] rounded-3xl border p-4 text-left transition-all touch-manipulation active:scale-[0.99] ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                    : "border-slate-200 bg-slate-50 hover:bg-white"
                } disabled:opacity-75 disabled:cursor-not-allowed`}
              >
                <div
                  className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${game.tone} text-white flex items-center justify-center mb-3 shadow-sm`}
                >
                  <Icon size={20} />
                </div>
                <p className="font-black text-sm sm:text-base">
                  {lang === "sw" ? game.labelSw : game.labelEn}
                </p>
                <p className={`text-xs mt-1 leading-relaxed ${active ? "text-slate-300" : "text-slate-500"}`}>
                  {lang === "sw" ? game.helperSw : game.helperEn}
                </p>
                <div
                  className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                    active ? "bg-white/10 text-emerald-200" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {(gameLevels[game.id] || 1) >= MAX_LEVEL
                    ? lang === "sw"
                      ? "Mastered"
                      : "Mastered"
                    : `Level ${gameLevels[game.id] || 1}/${MAX_LEVEL}`}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                {lang === "sw" ? "Puzzle objective" : "Puzzle objective"}
              </p>
              <h4 className="text-base font-black text-slate-950">
                {lang === "sw" ? puzzle.titleSw : puzzle.titleEn}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {lang === "sw" ? puzzle.instructionSw : puzzle.instructionEn}
              </p>
              <p className="mt-2 rounded-2xl bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                {isMastered
                  ? lang === "sw"
                    ? `Master Challenge · ${masterCompletions} completions`
                    : `Master Challenge · ${masterCompletions} completions`
                  : `Level ${activeLevel}/20`} · {lang === "sw" ? puzzle.levelStorySw : puzzle.levelStoryEn}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-600"
                  style={{ width: `${(Math.min(activeLevel, MAX_LEVEL) / MAX_LEVEL) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 min-w-[220px]">
              <div className="rounded-2xl bg-white border border-slate-200 px-3 py-2">
                <p className="text-[9px] uppercase text-slate-400 font-black">{puzzle.targetLabel}</p>
                <p className="text-lg font-black text-slate-950">{puzzle.targetValue}</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 px-3 py-2">
                <p className="text-[9px] uppercase text-slate-400 font-black">
                  {lang === "sw" ? "Base" : "Base"}
                </p>
                <p className="text-sm font-black text-slate-950">
                  {rewardProfile.base} pts · {formatCurrency(rewardProfile.cashValue)}
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 px-3 py-2 col-span-2">
                <p className="text-[9px] uppercase text-slate-400 font-black">
                  {lang === "sw" ? "Trials za leo" : "Today's trials"}
                </p>
                <div className="mt-2 flex gap-1.5">
                  {Array.from({ length: MAX_DAILY_TRIALS }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-2.5 flex-1 rounded-full ${
                        index < trialsLeft ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {puzzle.moves.map((move) => {
              const active = selectedMove === move.id;
              return (
                <button
                  key={move.id}
                  type="button"
                  disabled={!canPlay}
                  onClick={() => playMove(move)}
                  className={`relative min-h-[150px] rounded-3xl border p-4 text-left overflow-hidden transition-all touch-manipulation active:scale-[0.99] ${
                    active
                      ? "border-slate-950 bg-white shadow-lg"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  <div
                    className={`absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${move.tone} opacity-20 blur-xl`}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${move.tone} text-white flex items-center justify-center shadow-sm`}
                      >
                        {selectedGame === "scratch" ? (
                          <Target size={20} />
                        ) : selectedGame === "spin" ? (
                          <Zap size={20} />
                        ) : (
                          <KeyRound size={20} />
                        )}
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                        {lang === "sw" ? "Scale" : "Scale"} {move.multiplier}x
                      </span>
                    </div>
                    <p className="font-black text-slate-950 text-base mt-4">
                      {lang === "sw" ? move.labelSw : move.labelEn}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {lang === "sw" ? move.helperSw : move.helperEn}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-2">
                        <p className="text-[9px] uppercase text-slate-400 font-black">Code</p>
                        <p className="font-black text-slate-900">{move.displayCode}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-2">
                        <p className="text-[9px] uppercase text-slate-400 font-black">
                          {move.metricLabel}
                        </p>
                        <p className="font-black text-slate-900">
                          {selectedMove === move.id || dailyLocked
                            ? move.metricValue
                            : lang === "sw"
                              ? "Hesabu"
                              : "Solve"}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              {dailyLocked ? (
                <Clock size={18} className="text-amber-600" />
              ) : result?.won ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : (
                <Award size={18} className="text-slate-700" />
              )}
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">
                {dailyLocked
                  ? dailyWon
                    ? lang === "sw"
                      ? isMastered
                        ? "Master Challenge ya leo imekamilika"
                        : `Umeshinda leo. Level ijayo: ${activeLevel}`
                      : isMastered
                        ? "Today's Master Challenge is complete"
                        : `Solved today. Next level: ${activeLevel}`
                    : lang === "sw"
                      ? `Trials zimeisha. Rudi baada ya saa ${hoursLeft}`
                      : `Trials finished. Come back in ${hoursLeft}h`
                  : result
                    ? result.won
                      ? lang === "sw"
                        ? `Umeshinda +${result.points} points`
                        : `You won +${result.points} points`
                      : lang === "sw"
                        ? "Puzzle imekamilika"
                        : "Puzzle completed"
                    : lang === "sw"
                      ? "Chagua game, soma target, kisha jibu"
                      : "Choose a game, read the target, then answer"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {result?.message ||
                  (lang === "sw"
                    ? "Una trials 3 kwa siku. Jibu sahihi pekee ndilo linatoa pointi."
                    : "You get 3 trials per day. Only the correct answer earns points.")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] uppercase text-slate-400 font-black">
              {lang === "sw" ? "Michezo" : "Plays"}
            </p>
            <p className="font-black text-slate-900">{totalPlays}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] uppercase text-slate-400 font-black">
              {lang === "sw" ? "Ushindi" : "Wins"}
            </p>
            <p className="font-black text-slate-900">{rewardedPlays}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] uppercase text-slate-400 font-black">
              {lang === "sw" ? "Jumla" : "Earned"}
            </p>
            <p className="font-black text-slate-900">{totalRewardedPoints}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
          <Lock size={15} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {lang === "sw"
              ? "Security: akaunti moja ina trials 3 kwa siku. Baada ya level 20, game huingia Master Challenge yenye reward cap na badge completions badala ya kupanda level bila mwisho."
              : "Security: one account gets 3 trials per day. After level 20, the game enters a capped Master Challenge with badge completions instead of endless level farming."}
          </p>
        </div>
      </div>
    </section>
  );
}
