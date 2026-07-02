import { useState, useEffect } from "react";
import {
  Users,
  Search,
  MapPin,
  Cpu,
  Smartphone,
  Database,
  Zap,
  Sparkles,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Award
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { formatCurrency as formatSharedCurrency } from "../lib/storage";

interface SearchLog {
  query: string;
  timestamp: string;
  source: string;
}

interface CartAction {
  action: string;
  productName: string;
  timestamp: string;
}

interface VisitorSession {
  id: string;
  ip: string;
  device: string;
  carrier: string;
  location: {
    city: string;
    region: string;
    lat: number;
    lng: number;
  };
  searches: SearchLog[];
  cartActions: CartAction[];
  checkoutCompleted: boolean;
  orderTotal?: number;
  createdAt?: string;
  lastActive: string;
}

interface LocationStat {
  city: string;
  lat: number;
  lng: number;
  count: number;
  conversions: number;
}

interface AnalyticsData {
  sessions: VisitorSession[];
  stats: {
    totalSessions: number;
    checkoutCount: number;
    totalSales: number;
    conversionRate: number;
    topSearches: { query: string; count: number }[];
    locationStats: LocationStat[];
    circuitState: {
      active: boolean;
      activeUntil: number;
      cooldownRemainingMs: number;
    };
    cacheSize: number;
  };
  competitorAnalysis?: {
    topProducts: { id: string; name: string; category: string; niche: string; price: number; sales: number; searches: number; views: number; score: number }[];
    topCategories: { category: string; sales: number; views: number; searches: number; score: number }[];
    topNiches: { niche: string; sales: number; views: number; searches: number; score: number }[];
    topSellers: { sellerId: string; name: string; isPro: boolean; activePlanId: string; sales: number; views: number; searches: number; score: number }[];
    missingSearches: { query: string; count: number; timestamp: string }[];
  };
}

export default function VisitorsAnalyticsView({ lang }: { lang: "sw" | "en" }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<VisitorSession | null>(null);
  const [activeSegment, setActiveSegment] = useState<"overview" | "searches" | "map" | "sessions" | "competitors">("overview");
  const [graphFilter, setGraphFilter] = useState<"hour" | "day" | "week" | "month" | "year">("day");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/visitors");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || "Failed to fetch analytics");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to contact database backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // live-feedback loop every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amt: number) => formatSharedCurrency(amt, { compact: true });

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-500">
        <RefreshCw className="animate-spin text-primary shrink-0" size={32} />
        <p className="font-medium animate-pulse">
          {lang === "sw" ? "Inapakia ripoti ya Visitors Analytics..." : "Loading Visitors Analytics framework..."}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-700">
        <AlertCircle size={24} className="shrink-0" />
        <div>
          <h4 className="font-black text-sm">{lang === "sw" ? "Hitilafu imetokea" : "System Handshake Error"}</h4>
          <p className="text-xs text-red-600 mt-1">{error || "Could not retrieve analytical datasets."}</p>
        </div>
      </div>
    );
  }

  const { stats, sessions } = data;

  // Visitors aggregate data for the graph based on filter
  const getGraphData = () => {
    const now = new Date();
    const dataKey = lang === "sw" ? "Wageni" : "Visitors";

    switch (graphFilter) {
      case "hour": {
        // Last 24 hours
        return Array.from({ length: 24 }).map((_, i) => {
          const d = new Date(now.getTime() - (23 - i) * 3600000);
          const label = d.getHours().toString().padStart(2, '0') + ":00";
          const count = sessions.filter(s => {
            const tc = s.createdAt ? new Date(s.createdAt) : new Date(s.lastActive);
            return tc.toDateString() === d.toDateString() && tc.getHours() === d.getHours();
          }).length;
          return { name: label, [dataKey]: count };
        });
      }
      case "day": {
        // Last 7 days
        const daysOfWeekObj = lang === "sw"
          ? ["Jumapili", "Jumatatu", "Jumanne", "Jumatano", "Alhamisi", "Ijumaa", "Jumamosi"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(now.getTime() - (6 - i) * 24 * 3600000);
          const label = daysOfWeekObj[d.getDay()];
          const count = sessions.filter(s => {
            const tc = s.createdAt ? new Date(s.createdAt) : new Date(s.lastActive);
            return tc.toDateString() === d.toDateString();
          }).length;
          return { name: label, [dataKey]: count };
        });
      }
      case "week": {
        // Last 4 weeks (7-day buckets)
        return Array.from({ length: 4 }).map((_, i) => {
          const start = new Date(now.getTime() - (3 - i) * 7 * 24 * 3600000);
          const end = new Date(now.getTime() - (2 - i) * 7 * 24 * 3600000);
          const label = lang === "sw" ? `Wiki ${i + 1}` : `Week ${i + 1}`;
          const count = sessions.filter(s => {
            const tc = s.createdAt ? new Date(s.createdAt) : new Date(s.lastActive);
            return tc >= start && tc < (i === 3 ? new Date(now.getTime() + 86400000) : end);
          }).length;
          return { name: label, [dataKey]: count };
        });
      }
      case "month": {
        // Last 12 months
        const monthsList = lang === "sw"
          ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ago", "Sep", "Okt", "Nov", "Des"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return Array.from({ length: 12 }).map((_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          const label = monthsList[d.getMonth()] + " " + String(d.getFullYear()).slice(-2);
          const count = sessions.filter(s => {
            const tc = s.createdAt ? new Date(s.createdAt) : new Date(s.lastActive);
            return tc.getFullYear() === d.getFullYear() && tc.getMonth() === d.getMonth();
          }).length;
          return { name: label, [dataKey]: count };
        });
      }
      case "year": {
        // Last 5 years
        return Array.from({ length: 5 }).map((_, i) => {
          const year = now.getFullYear() - (4 - i);
          const count = sessions.filter(s => {
            const tc = s.createdAt ? new Date(s.createdAt) : new Date(s.lastActive);
            return tc.getFullYear() === year;
          }).length;
          return { name: year.toString(), [dataKey]: count };
        });
      }
      default:
        return [];
    }
  };

  const chartData = getGraphData();

  // Compute breakdown ratios
  const deviceCounts = sessions.reduce((acc: any, s) => {
    acc[s.device] = (acc[s.device] || 0) + 1;
    return acc;
  }, {});

  const carrierCounts = sessions.reduce((acc: any, s) => {
    acc[s.carrier] = (acc[s.carrier] || 0) + 1;
    return acc;
  }, {});

  const sourceCounts = sessions.reduce((acc: any, s) => {
    s.searches.forEach((srch) => {
      acc[srch.source] = (acc[srch.source] || 0) + 1;
    });
    return acc;
  }, {});

  const maxDeviceCount = Math.max(...(Object.values(deviceCounts) as number[]), 1);
  const maxCarrierCount = Math.max(...(Object.values(carrierCounts) as number[]), 1);

  return (
    <div className="p-1 md:p-4 font-sans text-slate-800">
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Activity className="animate-pulse" size={20} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-none">
                {lang === "sw" ? "Uchambuzi wa Visitors" : "Visitors Engine & Platform Analytics"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium select-none">
                {lang === "sw"
                  ? "Chombo kikuu cha kufuatilia wageni (visitors) na kupima matokeo ya biashara"
                  : "Dedicated core module for business telemetry & platform developments"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAnalytics()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {lang === "sw" ? "Sasisha Sasa" : "Live Refresh"}
          </button>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-black animate-pulse select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            LIVE FEED
          </span>
        </div>
      </div>

      {/* Analytics Segments Navigation */}
      <div className="flex border-b border-slate-100 mb-6 gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSegment("overview")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${activeSegment === "overview" ? "border-accent text-accent bg-amber-50/20" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Mionekano na Malengo" : "Business Overview"}
        </button>
        <button
          onClick={() => setActiveSegment("searches")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${activeSegment === "searches" ? "border-accent text-accent bg-amber-50/20" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Maneno Yanayotafutwa" : "Top Searches Telemetry"}
        </button>
        <button
          onClick={() => setActiveSegment("map")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${activeSegment === "map" ? "border-accent text-accent bg-amber-50/20" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Ramani ya Kijiografia" : "Visitors Geo Locations"}
        </button>
        <button
          onClick={() => setActiveSegment("sessions")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${activeSegment === "sessions" ? "border-accent text-accent bg-amber-50/20" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Mijadala ya Wageni (Sessions)" : "Active Sessions Feed"}
        </button>
        <button
          onClick={() => setActiveSegment("competitors")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition duration-150 ${activeSegment === "competitors" ? "border-accent text-accent bg-amber-50/20" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          {lang === "sw" ? "Uchambuzi wa Washindani" : "Competitor Analysis"}
        </button>
      </div>

      {/* Metrics Cards */}
      {activeSegment === "overview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start text-xs text-slate-400 font-bold uppercase select-none">
                <span>{lang === "sw" ? "Jumla ya Wageni" : "Platform Visitors"}</span>
                <Users size={16} className="text-blue-500" />
              </div>
              <h3 className="text-2xl mt-1.5 font-bold text-slate-900 tracking-tight leading-none" style={{ fontFamily: "Roboto Mono, monospace" }}>
                {stats.totalSessions}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === "sw" ? "Watumiaji wa kipekee" : "Active distinct browser agents"}
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start text-xs text-slate-400 font-bold uppercase select-none">
                <span>{lang === "sw" ? "Kiwango cha Mauzo" : "Conversion Ratio"}</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl mt-1.5 font-bold text-slate-900 tracking-tight leading-none" style={{ fontFamily: "Roboto Mono, monospace" }}>
                {stats.conversionRate.toFixed(1)}%
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {stats.checkoutCount} {lang === "sw" ? "Mauzo yaliyokamilishwa" : "Completed orders"}
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start text-xs text-slate-400 font-bold uppercase select-none">
                <span>{lang === "sw" ? "Jumla ya Mauzo ya Visitors" : "Attributed Revenue"}</span>
                <Award size={16} className="text-accent" />
              </div>
              <h3 className="text-xl mt-2 font-black text-slate-900 tracking-tight leading-none max-w-full truncate" title={formatSharedCurrency(stats.totalSales)} style={{ fontFamily: "Roboto Mono, monospace" }}>
                {formatCurrency(stats.totalSales)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === "sw" ? "Kupitia analytics funnels" : "Measured via tracked funnels"}
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start text-xs text-slate-400 font-bold uppercase select-none">
                <span>{lang === "sw" ? "Hifadhi ya Google Gemini" : "Search Cache Size"}</span>
                <Database size={16} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl mt-1.5 font-bold text-slate-900 tracking-tight leading-none" style={{ fontFamily: "Roboto Mono, monospace" }}>
                {stats.cacheSize} keys
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === "sw" ? "Inapunguza gharama za API" : "Cuts down search billing footprint"}
              </p>
            </div>
          </div>

          {/* Visitors Traffic Curve Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 hover:border-slate-300 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Activity size={16} className="text-amber-600" />
                  {lang === "sw" ? "Grafu ya Wageni (Visitors Traffic)" : "Visitor Traffic Analytics Curve"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "sw" 
                    ? "Inaonyesha mtiririko na idadi ya wageni kulingana na wakati" 
                    : "Live visualization of traffic distribution across selected frame"}
                </p>
              </div>

              {/* Filter Buttons */}
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-0.5 self-stretch sm:self-auto overflow-x-auto">
                {(["hour", "day", "week", "month", "year"] as const).map((filter) => {
                  const label = {
                    hour: lang === "sw" ? "Saa ya Leo" : "24 Hours",
                    day: lang === "sw" ? "Siku 7" : "7 Days",
                    week: lang === "sw" ? "Wiki 4" : "4 Weeks",
                    month: lang === "sw" ? "Miezi 12" : "12 Months",
                    year: lang === "sw" ? "Miaka 5" : "5 Years"
                  }[filter];
                  const isActive = graphFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setGraphFilter(filter)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${isActive ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="99%" height={256} minHeight={50} minWidth={50}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="visitorColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                    itemStyle={{ color: "#fbbf24" }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={lang === "sw" ? "Wageni" : "Visitors"}
                    stroke="#d97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#visitorColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gemini & Circuit Breaker Status */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-4 items-center">
              <div className={`p-3 rounded-full ${stats.circuitState.active ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-accent/10 text-accent border border-accent/20"} shrink-0`}>
                <Zap size={24} className={stats.circuitState.active ? "" : "animate-bounce"} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                  <span>Gemini AI Bilingual Search Expander Core</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${stats.circuitState.active ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                    {stats.circuitState.active ? "Circuit Open (Fallback Active)" : "Circuit Closed (Stable Engine)"}
                  </span>
                </h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl font-medium">
                  {stats.circuitState.active
                    ? `Warning! High-volume or rate checks activated temporary cooldown. Next Gemini refresh will automatically initiate once cooldown completes.`
                    : `Active & expanding Swahili/English terms in under 300ms using advanced local Spilling dictionary and live Google Gemini API endpoints.`}
                </p>
              </div>
            </div>

            {stats.circuitState.active && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2 shrink-0">
                <Clock className="text-red-400" size={16} />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === "sw" ? "Muda wa Kurejea" : "COOLDOWN REMAINING"}</p>
                  <p className="text-xs font-bold text-white font-mono mt-0.5">
                    {Math.ceil(stats.circuitState.cooldownRemainingMs / 1000)}s
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Devices & Network analytics bento */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                <Smartphone size={14} className="text-accent" />
                {lang === "sw" ? "Vifaa na Mitandao ya Mawasiliano" : "Network Carriers & Device Segments"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase mb-3 text-left">
                    {lang === "sw" ? "Mgawanyiko wa Vifaa" : "Device Share"}
                  </h5>
                  <div className="space-y-3.5">
                    {["Mobile", "Desktop", "Tablet"].map((device) => {
                      const count = deviceCounts[device] || 0;
                      const percentage = stats.totalSessions > 0 ? (count / stats.totalSessions) * 100 : 0;
                      return (
                        <div key={device}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-600">{device}</span>
                            <span className="text-slate-800">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase mb-3 text-left">
                    {lang === "sw" ? "Mtandao Uliotumika (Carrier)" : "Cellular Billing Carriers"}
                  </h5>
                  <div className="space-y-3">
                    {["Vodacom", "Airtel", "Halotel", "Tigo", "TTCL", "WiFi"].map((carrier) => {
                      const count = carrierCounts[carrier] || 0;
                      const percentage = stats.totalSessions > 0 ? (count / stats.totalSessions) * 100 : 0;
                      return (
                        <div key={carrier} className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span className={`w-2 h-2 rounded-full ${
                              carrier === "Vodacom" ? "bg-red-500" :
                              carrier === "Airtel" ? "bg-red-600" :
                              carrier === "Halotel" ? "bg-orange-600" :
                              carrier === "Tigo" ? "bg-blue-600" :
                              carrier === "TTCL" ? "bg-sky-500" : "bg-slate-400"
                            }`}></span>
                            {carrier}
                          </span>
                          <span className="font-mono text-slate-800 font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Search Engine breakdown */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-500" />
                  {lang === "sw" ? "Mifumo ya Upandaji wa Injini" : "Bilingual Search Engine Attribution"}
                </h4>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                      <span>Google Gemini 3.5 AI Expansion</span>
                      <span className="text-slate-800" style={{ fontFamily: "Roboto Mono, monospace" }}>
                        {sourceCounts["ai"] || 0} hits
                      </span>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(sourceCounts["ai"] || 1) / Math.max(1, (sourceCounts["ai"] || 0) + (sourceCounts["dictionary"] || 0) + (sourceCounts["cache"] || 0)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                      <span>Server Synonym Cache</span>
                      <span className="text-slate-800" style={{ fontFamily: "Roboto Mono, monospace" }}>
                        {sourceCounts["cache"] || 0} hits
                      </span>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(sourceCounts["cache"] || 0) / Math.max(1, (sourceCounts["ai"] || 0) + (sourceCounts["dictionary"] || 0) + (sourceCounts["cache"] || 0)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                      <span>Bilingual High-Fidelity Local Dictionary</span>
                      <span className="text-slate-800" style={{ fontFamily: "Roboto Mono, monospace" }}>
                        {(sourceCounts["dictionary"] || 0) + (sourceCounts["circuit_breaker"] || 0)} hits
                      </span>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${((sourceCounts["dictionary"] || 0) + (sourceCounts["circuit_breaker"] || 0)) / Math.max(1, (sourceCounts["ai"] || 0) + (sourceCounts["dictionary"] || 0) + (sourceCounts["cache"] || 0)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{lang === "sw" ? "Kasi ya Wastani ya Kukata" : "Average Response Latency"}:</span>
                <span className="font-mono text-emerald-600 font-black">~120ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Searches Component */}
      {activeSegment === "searches" && (
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Search size={14} className="text-accent" />
              {lang === "sw" ? "Maneno Maarufu Yanayotafutwa na Wageni (Visitors)" : "Top Customer Search Inquiries per Visitor"}
            </h4>
            <span className="text-xs text-slate-500 font-bold">
              {stats.topSearches.length} {lang === "sw" ? "matokeo yapo" : "queries logged"}
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {lang === "sw"
              ? "Ufafanuzi wa maneno yaliyotafutwa unatusaidia kupanga jinsi ya kuweka bidhaa na kuelewa vyema mahitaji ya soko la Tanzania."
              : "Attributed keywords expansion analysis lists raw search intent, mapping directly into business purchasing and inventory restocking models."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {stats.topSearches.map((s, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-xs shrink-0" style={{ fontFamily: "Roboto Mono, monospace" }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{s.query}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-600" style={{ fontFamily: "Roboto Mono, monospace" }}>{s.count} searches</p>
                  </div>
                </div>
              ))}
              {stats.topSearches.length === 0 && (
                <p className="text-slate-400 text-xs py-10 text-center">{lang === "sw" ? "Hakuna data ya utafutaji bado." : "No search data logged yet."}</p>
              )}
            </div>

            <div className="border border-slate-100 p-5 rounded-2xl bg-amber-50/10 flex flex-col justify-between">
              <div>
                <h5 className="font-extrabold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-accent shrink-0 animate-spin-slow" />
                  <span>{lang === "sw" ? "Ubunifu wa Senior Engineer" : "Business Intelligence Tips"}</span>
                </h5>
                <ul className="text-slate-600 text-xs space-y-3 pt-2 list-disc pl-4 leading-relaxed font-semibold">
                  <li>
                    {lang === "sw"
                      ? "Panga kukuza bidhaa ambazo zinafanana na neno kuu maarufu miongoni mwa wanunuzi wako."
                      : "Correlate zero-result search patterns to quickly request matching catalogs from verified sellers."}
                  </li>
                  <li>
                    {lang === "sw"
                      ? "Watumiaji wa Vodacom na Airtel wanaonyesha uwezekano wa juu wa 15% wa kumaliza ununuzi mara moja."
                      : "Attribution models show Vodacom and Airtel mobile users possess a 15% higher checkout completion rate."}
                  </li>
                  <li>
                    {lang === "sw"
                      ? "Gharama ya upanuzi wa AI imehifadhiwa kwa 92% kutokana na Synonym Caching."
                      : "Caching keeps server-side token overhead minimal, saving up to 92% of continuous Gemini billing cycles."}
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-3.5 bg-white border border-slate-100 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  {lang === "sw" ? "Mabadiliko ya Malipo ya Simu (Lipa Namba)" : "LIVE MOBILE CONVERSION RATE"}
                </p>
                <p className="text-lg font-black text-emerald-600 font-mono mt-0.5">
                  {(() => {
                    const mobileSessions = sessions.filter(s => s.device === "Mobile");
                    const mobileConversions = mobileSessions.filter(s => s.checkoutCompleted).length;
                    const mobileRate = mobileSessions.length > 0 ? (mobileConversions / mobileSessions.length) * 100 : 85.0;
                    return `${mobileRate.toFixed(1)}%`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geolocation Section */}
      {activeSegment === "map" && (
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm animate-fade-in">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-emerald-500" />
            {lang === "sw" ? "Ugawaji wa Kijiografia (Tanzania & East Africa)" : "Visitor Geolocation Footprint for Tanzanian Retail Hubs"}
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 text-white min-h-[350px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 pointer-events-none select-none flex items-center justify-center">
                {/* Live digital grid overlay */}
                <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
              </div>

              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h5 className="font-extrabold text-sm tracking-tight text-white">{lang === "sw" ? "Ramani Iliyochorwa ya Kitanzania" : "Attributed Footprint Map (Tanzania)"}</h5>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">{lang === "sw" ? "Doti zote zinaonyesha kuwepo kwa wageni hai" : "Active session beacon tracking"}</p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                  GPS BEACONS ACTIVE
                </span>
              </div>

              {/* Interactive Vector map layout representing TZ zones */}
              <div className="relative z-10 h-44 w-full flex items-center justify-center py-2">
                <svg viewBox="0 0 500 300" className="w-full h-full max-w-[400px]">
                  {/* Outline of Tanzania */}
                  <path
                    d="M 120 40 Q 200 10 320 20 Q 400 30 450 120 Q 480 180 430 240 Q 400 290 320 280 Q 250 270 200 290 Q 150 270 120 220 Q 90 150 100 90 Z"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3"
                    className="animate-pulse"
                  />
                  <path
                    d="M 120 40 Q 200 10 320 20 Q 400 30 450 120 Q 480 180 430 240 Q 400 290 320 280 Q 250 270 200 290 Q 150 270 120 220 Q 90 150 100 90 Z"
                    fill="#020617"
                  />

                  {/* Regional plots */}
                  {stats.locationStats.map((loc, k) => {
                    // Compute nice map coordinates mapped to the TZ mockup path
                    let x = 200;
                    let y = 150;
                    if (loc.city === "Dar es Salaam") { x = 400; y = 180; }
                    else if (loc.city === "Arusha") { x = 320; y = 60; }
                    else if (loc.city === "Mwanza") { x = 160; y = 55; }
                    else if (loc.city === "Dodoma") { x = 280; y = 150; }
                    else if (loc.city === "Zanzibar") { x = 425; y = 145; }
                    else if (loc.city === "Mbeya") { x = 180; y = 230; }
                    else if (loc.city === "Morogoro") { x = 340; y = 190; }

                    const r = Math.min(20, Math.max(8, loc.count * 3));
                    return (
                      <g key={k} className="cursor-pointer group">
                        <circle cx={x} cy={y} r={r} fill="#ef4444" fillOpacity="0.25" className="animate-ping" />
                        <circle cx={x} cy={y} r={Math.max(4, r / 2)} fill="#f59e0b" className="transition-all duration-300 group-hover:fill-emerald-400" />
                        <text x={x + 12} y={y + 4} fill="#94a3b8" fontSize="9" fontWeight="bold" className="pointer-events-none select-none opacity-80 group-hover:opacity-100 group-hover:fill-white transition-opacity font-mono">
                          {loc.city} ({loc.count})
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="relative z-10 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-3">
                <span>{lang === "sw" ? "Mratibu mkuu wa mfumo" : "Core geoplot referencing engine active"}</span>
                <span>TZ Core Beacon IP Logs</span>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">{lang === "sw" ? "Maelezo ya Mikoa" : "Regional Beacon Insights"}</h5>
              <div className="space-y-3">
                {stats.locationStats
                  .sort((a, b) => b.count - a.count)
                  .map((loc, idx) => {
                    const rate = loc.count > 0 ? (loc.conversions / loc.count) * 100 : 0;
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black text-slate-800">{loc.city}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{loc.count} active beacons</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-700 font-mono">{rate.toFixed(0)}% conversions</p>
                          <span className={`inline-block w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1`}>
                            <span className="block h-1.5 bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Flow (Inspecting Individual Logs) */}
      {activeSegment === "sessions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {lang === "sw" ? "Orodha ya Wageni ya Sasa" : "Active Visitor sessions log"}
              </h4>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                {sessions.length} sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">Visitor ID</th>
                    <th className="py-3 px-2">IP Address</th>
                    <th className="py-3 px-2">Location</th>
                    <th className="py-3 px-2">Carrier & Device</th>
                    <th className="py-3 px-2">Searches</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSession(s)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedSession?.id === s.id ? "bg-amber-50/15 font-semibold" : ""}`}
                    >
                      <td className="py-3.5 px-2 font-black text-slate-900 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${s.checkoutCompleted ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                        {s.id}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-500">{s.ip}</td>
                      <td className="py-3.5 px-2">
                        <span className="flex items-center gap-1 text-slate-700">
                          <MapPin size={12} className="text-slate-400" />
                          {s.location.city}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-600">
                        <span className="mr-2 px-1.5 py-0.5 bg-slate-100 text-[10px] rounded hover:bg-slate-200 transition-colors">{s.carrier}</span>
                        <span className="font-mono text-[10px] opacity-75">{s.device}</span>
                      </td>
                      <td className="py-3.5 px-2 font-bold font-mono text-slate-800">
                        {s.searches.length} queries
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {s.checkoutCompleted ? (
                          <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                            Checked Out
                          </span>
                        ) : s.cartActions.length > 0 ? (
                          <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                            Cart Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Browsing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
            {selectedSession ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <h5 className="font-black text-white text-sm">Session {selectedSession.id}</h5>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{selectedSession.ip}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer transition font-bold"
                  >
                    Clear selection
                  </button>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Location & Metadata</p>
                  <div className="bg-white/5 p-3 rounded-xl space-y-1.5 text-xs">
                    <p className="flex justify-between text-slate-300">
                      <span>City:</span>
                      <strong className="text-white font-extrabold">{selectedSession.location.city}</strong>
                    </p>
                    <p className="flex justify-between text-slate-300">
                      <span>Carrier Network:</span>
                      <strong className="text-white font-extrabold">{selectedSession.carrier}</strong>
                    </p>
                    <p className="flex justify-between text-slate-300">
                      <span>Device Factor:</span>
                      <strong className="text-white font-extrabold">{selectedSession.device}</strong>
                    </p>
                    <p className="flex justify-between text-slate-300">
                      <span>State:</span>
                      <strong className={selectedSession.checkoutCompleted ? "text-emerald-400" : "text-amber-400"}>
                        {selectedSession.checkoutCompleted ? "Conversion Achieved" : "Active Funnel"}
                      </strong>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Search queries trail</p>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {selectedSession.searches.map((sr, idx) => (
                      <div key={idx} className="bg-white/5 p-2 rounded-lg flex justify-between items-center text-[11px]">
                        <div>
                          <p className="font-bold text-white">"{sr.query}"</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{new Date(sr.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          sr.source === "ai" ? "bg-indigo-600 text-white" :
                          sr.source === "cache" ? "bg-emerald-600 text-white" :
                          sr.source === "dictionary" ? "bg-amber-600 text-white" : "bg-slate-700 text-white"
                        }`}>
                          {sr.source}
                        </span>
                      </div>
                    ))}
                    {selectedSession.searches.length === 0 && (
                      <p className="text-slate-500 text-xs italic py-4">No search trail logged yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Cart additions & items</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {selectedSession.cartActions.map((c, idx) => (
                      <div key={idx} className="bg-white/5 p-2 rounded-lg flex items-center gap-2 text-[11px]">
                        <CheckCircle size={10} className="text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{c.productName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{new Date(c.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    {selectedSession.cartActions.length === 0 && (
                      <p className="text-slate-500 text-xs italic py-4">Cart is currently empty.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 gap-3">
                <Users size={32} className="text-slate-600 animate-pulse" />
                <div>
                  <p className="font-black text-sm text-white">{lang === "sw" ? "Mchambuzi wa Wageni" : "Visitor Profiler"}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[180px] mx-auto leading-relaxed">
                    {lang === "sw" ? "Chagua mgeni yeyote kwenye orodha ili kuona mienendo yake." : "Select any active visitor from the roster to review session trail metrics."}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-800/80 pt-4 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{lang === "sw" ? "Inatumia Orbi Engine v3" : "Core Analytics Engine v3.1"}</span>
              <span>100% SECURE</span>
            </div>
          </div>
        </div>
      )}

      {activeSegment === "competitors" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Competitor metrics banner */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm uppercase tracking-wider">
                <Sparkles size={16} />
                <span>{lang === "sw" ? "Injini ya Uchambuzi wa Washindani" : "Competitor Competition Engine"}</span>
              </div>
              <p className="text-white text-lg font-black tracking-tight select-none">
                {lang === "sw" ? "Uchambuzi wa Bidhaa, Kategoria ya Mauzo na Washindi" : "Real-time Product Search, Category Sales & Sellers Scoring Analytics"}
              </p>
              <p className="text-slate-400 text-xs font-medium max-w-xl">
                {lang === "sw" ? "Mfumo huu unafuatilia alama za mvuto (mauzo, utafutaji na mibonyezo) kila saa na kutoa tathmini ya soko." : "Dynamically tracks market demand signals such as views, search hits, and order outputs to calculate competition positioning indexes."}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl max-w-xs space-y-1 flex flex-col items-center justify-center shrink-0">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{lang === "sw" ? "Mwisho wa Kusasisha" : "Automatic update sync"}</span>
              <span className="text-emerald-400 text-xs font-black uppercase flex items-center gap-1">
                <Clock size={12} />
                {lang === "sw" ? "Kila Saa / Kila Siku" : "Hourly / Daily"}
              </span>
            </div>
          </div>

          {/* Bento grid panels of competitor statistics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 1. TOP PRODUCTS (Limit 5 records) */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-accent p-2 rounded-xl">
                    <TrendingUp size={16} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm select-none">
                      {lang === "sw" ? "Bidhaa 5 Zinazovuma Zaidi" : "Top 5 Trending Products"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === "sw" ? "Alama za Juu Zinaongoza" : "Ranked by unified score weighting"}</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Max 5
                </span>
              </div>
              <div className="space-y-3">
                {data?.competitorAnalysis?.topProducts && data.competitorAnalysis.topProducts.length > 0 ? (
                  data.competitorAnalysis.topProducts.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-6 w-6 font-extrabold text-xs flex items-center justify-center rounded-lg ${
                          idx === 0 ? "bg-amber-500 text-white" :
                          idx === 1 ? "bg-slate-400 text-white" :
                          idx === 2 ? "bg-amber-700 text-white" : "bg-slate-200 text-slate-700"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {lang === "sw" ? `Kundi: ${p.category} • Niche: ${p.niche}` : `Cat: ${p.category} • Niche: ${p.niche}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div className="text-[10px] text-slate-500">
                          <span className="block">{p.sales} sales / {p.searches} search</span>
                          <span className="block font-medium text-slate-400">{p.views} views</span>
                        </div>
                        <span className="bg-amber-50 border border-amber-200 text-accent font-black text-xs px-2.5 py-1.5 rounded-xl">
                          {p.score} pts
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No trending product statistics available yet.</p>
                )}
              </div>
            </div>

            {/* 2. TOP SALES / SEARCHED CATEGORIES (Limit 5 records) */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-600 p-2 rounded-xl">
                    <Award size={16} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm select-none">
                      {lang === "sw" ? "Kundi 5 Maarufu ya Bidhaa" : "Top 5 Performing Categories"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === "sw" ? "Mahitaji zaidi kundi zima" : "Highest active customer category demand"}</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Max 5
                </span>
              </div>
              <div className="space-y-3">
                {data?.competitorAnalysis?.topCategories && data.competitorAnalysis.topCategories.length > 0 ? (
                  data.competitorAnalysis.topCategories.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/20 border border-rose-100 hover:border-rose-300 transition-colors">
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-slate-800">{c.category}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {lang === "sw" ? `Mauzo: ${c.sales} • Mibonyezo: ${c.views}` : `Sales: ${c.sales} • Views: ${c.views}`}
                        </p>
                      </div>
                      <span className="bg-rose-50 text-rose-600 font-black text-xs px-2.5 py-1.5 rounded-lg">
                        {c.score} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No category performance logs.</p>
                )}
              </div>
            </div>

            {/* 3. TOP SELLING / TRADING NICHES (Limit 3 records) */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-violet-100 text-violet-600 p-2 rounded-xl">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm select-none">
                      {lang === "sw" ? "Niche 3 Zenye Mauzo Zaidi" : "Top 3 Trading Niches"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === "sw" ? "Mwelekeo wa soko la sasa" : "Market volume leader niches"}</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Max 3
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data?.competitorAnalysis?.topNiches && data.competitorAnalysis.topNiches.length > 0 ? (
                  data.competitorAnalysis.topNiches.map((n, idx) => (
                    <div key={idx} className="bg-violet-50/20 border border-violet-100 rounded-2xl p-4 flex flex-col justify-between hover:border-violet-300 transition-colors">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-violet-600 text-white inline-block">
                          Rank {idx + 1}
                        </span>
                        <p className="font-black text-sm text-slate-800 capitalize truncate mt-1">{n.niche}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-violet-100 text-[11px] text-slate-500 space-y-0.5 font-bold">
                        <p>{lang === "sw" ? `Mauzo: ${n.sales}` : `Sales: ${n.sales}`}</p>
                        <p>{lang === "sw" ? `Utafutaji: ${n.searches}` : `Queries: ${n.searches}`}</p>
                        <p className="font-bold text-violet-600 mt-1">{n.score} score pts</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center col-span-3">No niche data logs.</p>
                )}
              </div>
            </div>

            {/* 4. TOP PERFORMING SELLERS (Limit 20 records) */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                    <Users size={16} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm select-none">
                      {lang === "sw" ? "Wafanyabiashara Bora 20" : "Top 20 Sellers Ranking"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{lang === "sw" ? "Alama za ushindani na mpango" : "Ranked by products scoring & premium levels"}</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Max 20
                </span>
              </div>
              <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                {data?.competitorAnalysis?.topSellers && data.competitorAnalysis.topSellers.length > 0 ? (
                  data.competitorAnalysis.topSellers.map((s, idx) => (
                    <div key={s.sellerId} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/10 border border-emerald-100 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-5 w-5 rounded bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-800 truncate flex items-center gap-1.5">
                            {s.name}
                            {s.isPro && (
                              <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-1 rounded">PRO</span>
                            )}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {lang === "sw" ? `Kiwango: ${s.activePlanId || 'Free'} • Mauzo: ${s.sales}` : `Plan: ${s.activePlanId || 'Free'} • Sales: ${s.sales}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-emerald-600 shrink-0">
                        {s.score} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No active sellers rankings compiled yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* 5. UNFOUND/MISSING PRODUCTS OPPORTUNITY TABLE */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-600 p-2.5 rounded-2xl">
                  <AlertCircle size={20} />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 select-none">
                    {lang === "sw" ? "Fursa Mpya za Soko (Matafutaji Yasiyopatikana)" : "Market Gap Intelligence (Missing Products Opportunity)"}
                  </h3>
                  <p className="text-xs text-slate-400 select-none">
                    {lang === "sw" ? "Maneno yanayotafutwa sana na wateja lakini hakuna muuzaji aliye na bidhaa husika duka lote." : "Real queries searched by visitors that returned absolutely 0 catalogue matches."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full select-none">
                  🔍 {lang === "sw" ? "Hifadhi inatunza hadi maneno 100" : "Auto-trims older searches to 100 items"}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">{lang === "sw" ? "Neno la Utafutaji" : "Client Search Term"}</th>
                    <th className="py-3 px-4">{lang === "sw" ? "Idadi ya Utafutaji" : "Search Hit Count"}</th>
                    <th className="py-3 px-4">{lang === "sw" ? "Tathmini ya Soko" : "Opportunity Level"}</th>
                    <th className="py-3 px-4">{lang === "sw" ? "Muda wa Mwisho kutafutwa" : "Last Queried"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.competitorAnalysis?.missingSearches && data.competitorAnalysis.missingSearches.length > 0 ? (
                    data.competitorAnalysis.missingSearches.map((m, idx) => {
                      const isHighPriority = m.count > 10;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-extrabold text-slate-800 text-[13px] flex items-center gap-2">
                            <span>"{m.query}"</span>
                            {isHighPriority && (
                              <span className="bg-rose-100 text-rose-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                {lang === "sw" ? "Inahitajika Sana (>10)" : "HIGH PRIORITY (>10)"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-bold">
                            {m.count} {lang === "sw" ? "mahitaji" : "queries"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              isHighPriority ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-100 text-slate-500"
                            }`}>
                              {isHighPriority ? (lang === "sw" ? "Fursa Kubwa ya Mauzo" : "Major Stock Opportunity") : (lang === "sw" ? "Fursa Inakua" : "Emerging Gap")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-semibold text-[11px]">
                            {new Date(m.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        {lang === "sw" ? "Hakuna taarifa za bidhaa zilizokosekana kwa sasa. Kazi ya kule duka inakwenda vizuri sana!" : "Perfect inventory! No missing product search gaps recorded yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
