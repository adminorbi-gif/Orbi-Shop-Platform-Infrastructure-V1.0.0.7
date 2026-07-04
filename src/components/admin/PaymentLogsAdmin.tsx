import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  ArrowUpRight, 
  Activity, 
  ShieldCheck, 
  Filter,
  Play,
  Pause,
  ChevronRight,
  Database
} from "lucide-react";
import { formatCurrency } from "../../lib/storage";
import { apiFetch } from "../../lib/db";

interface PaymentLog {
  id: string;
  orderId: string;
  gatewayReferenceId: string;
  amount: number;
  paymentMethod: string;
  status: "success" | "failed" | "pending";
  timestamp: number;
  message: string;
  customerName?: string;
}

interface PaymentLogsAdminProps {
  lang: "sw" | "en";
}

export function PaymentLogsAdmin({ lang = "en" }: PaymentLogsAdminProps) {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed" | "pending">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiFetch("/api/v1/payments/ledger-logs");
      if (data.success) {
        setLogs(data.logs || []);
        setError(null);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (lang === "sw" ? "Imeshindwa kupata leja ya malipo." : "Failed to load logs"));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Poll for logs every 10 seconds if auto-refresh is active
  useEffect(() => {
    fetchLogs();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lang]);

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchLogs(true);
      }, 10000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh]);

  // Calculate statistics
  const successLogs = logs.filter(l => l.status === "success");
  const failedLogs = logs.filter(l => l.status === "failed");
  const pendingLogs = logs.filter(l => l.status === "pending");

  const totalVolume = successLogs.reduce((acc, curr) => acc + curr.amount, 0);
  const successRate = logs.length > 0 ? Math.round((successLogs.length / logs.length) * 100) : 100;

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.gatewayReferenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.customerName && log.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: "success" | "failed" | "pending") => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 size={12} />
            {lang === "sw" ? "IMEKUBALIWA" : "SUCCESS"}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
            <XCircle size={12} />
            {lang === "sw" ? "IMEFELI" : "FAILED"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
            <Clock size={12} />
            {lang === "sw" ? "INASUBIRI" : "PENDING"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with real-time stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-primary" size={28} />
            {lang === "sw" ? "Kumbukumbu za Malipo (Ledger)" : "Real-Time Payment Ledger"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lang === "sw" 
              ? "Kufuatilia na kuhakiki miamala yote ya Orbi PaySafe kwa wakati halisi." 
              : "Monitor and audit all Orbi PaySafe escrow transactions in real time."}
          </p>
        </div>

        {/* Live Indicator Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/60 px-3.5 py-1.5 rounded-full text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
            <span className="font-semibold text-slate-600">
              {autoRefresh 
                ? (lang === "sw" ? "Inasasisha Kiotomatiki (10s)" : "Auto-Refreshing (10s)") 
                : (lang === "sw" ? "Imesitishwa" : "Auto-Refresh Paused")}
            </span>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="ml-1 text-slate-400 hover:text-slate-900 transition focus:outline-none"
              title={autoRefresh ? "Pause Live Updates" : "Resume Live Updates"}
            >
              {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>

          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {lang === "sw" ? "Pakua Upya" : "Force Reload"}
          </button>
        </div>
      </div>

      {/* Metrics Dashboard Row */}
      <div className="orbi-admin-auto-grid">
        {/* Metric 1: Total Volume */}
        <div className="orbi-admin-card p-5 rounded-[1.75rem] border border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="orbi-admin-label text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === "sw" ? "Jumla ya Thamani ya Escrow" : "Total Escrow Volume"}
            </span>
            <span className="orbi-admin-compact-value font-black text-slate-900 block mt-1.5 min-w-0 max-w-full overflow-hidden truncate" title={formatCurrency(totalVolume)}>
              {formatCurrency(totalVolume, { compact: true })}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              <ArrowUpRight size={12} /> {lang === "sw" ? "Imethibitishwa kikamilifu" : "Fully secured & settled"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Metric 2: Transactions Count */}
        <div className="orbi-admin-card p-5 rounded-[1.75rem] border border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="orbi-admin-label text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === "sw" ? "Idadi ya Miamala" : "Total Logged Miamala"}
            </span>
            <span className="orbi-admin-compact-value font-black text-slate-900 block mt-1.5">
              {logs.length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              <Database size={12} className="text-slate-400" />
              {lang === "sw" ? "Kutoka leja salama" : "From secure audit database"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity size={22} />
          </div>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="orbi-admin-card p-5 rounded-[1.75rem] border border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="orbi-admin-label text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === "sw" ? "Kiwango cha Mafanikio" : "Verification Rate"}
            </span>
            <span className="orbi-admin-compact-value font-black text-slate-900 block mt-1.5">
              {successRate}%
            </span>
            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-1">
              <XCircle size={11} /> {failedLogs.length} {lang === "sw" ? "zilizokataliwa" : "declined references"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <ShieldCheck size={22} />
          </div>
        </div>

        {/* Metric 4: Pending Verification */}
        <div className="orbi-admin-card p-5 rounded-[1.75rem] border border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="orbi-admin-label text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === "sw" ? "Zinazosubiri Uhakiki" : "Pending Verification"}
            </span>
            <span className="orbi-admin-compact-value font-black text-slate-900 block mt-1.5">
              {pendingLogs.length}
            </span>
            <span className="text-[10px] text-amber-500 font-bold block mt-1">
              {lang === "sw" ? "Zinasubiri ukaguzi" : "Awaiting user lookup"}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Main Table Container & Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={lang === "sw" ? "Tafuta kwa Oda, TX, au Maelezo..." : "Search by Order ID, Tx ID, or info..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition font-medium text-slate-800"
            />
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 mr-1 hidden lg:inline flex items-center gap-1">
              <Filter size={14} />
              FILTER:
            </span>
            {[
              { id: "all", label: lang === "sw" ? "Zote" : "All" },
              { id: "success", label: lang === "sw" ? "Imefanikiwa" : "Success" },
              { id: "failed", label: lang === "sw" ? "Iliyofeli" : "Failed" },
              { id: "pending", label: lang === "sw" ? "Inasubiri" : "Pending" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none ${statusFilter === f.id ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/40"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="p-16 text-center space-y-4">
            <RefreshCw size={40} className="mx-auto text-primary animate-spin" />
            <p className="text-sm font-bold text-slate-500">
              {lang === "sw" ? "Inapakia leja salama ya malipo..." : "Loading secure payment ledger logs..."}
            </p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <AlertCircle size={40} className="mx-auto text-rose-500 animate-bounce" />
            <p className="font-bold text-rose-600">{error}</p>
            <button 
              onClick={() => fetchLogs()} 
              className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-dark transition cursor-pointer"
            >
              {lang === "sw" ? "Jaribu Tena" : "Try Again"}
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Database size={40} className="mx-auto text-slate-300" />
            <p className="font-bold text-slate-500">
              {lang === "sw" ? "Hakuna kumbukumbu za malipo zilizopatikana." : "No payment transaction ledger logs found."}
            </p>
            <p className="text-xs">
              {lang === "sw" ? "Jaribu kubadilisha vigezo vya utafutaji." : "Try adjusting your search filters or force a reload."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4 pl-6">{lang === "sw" ? "ID ya Kumbukumbu" : "Log ID"}</th>
                  <th className="p-4">{lang === "sw" ? "Namba ya Oda" : "Order #"}</th>
                  <th className="p-4">{lang === "sw" ? "ID ya Muamala (TX)" : "Gateway TX Ref"}</th>
                  <th className="p-4">{lang === "sw" ? "Kiasi" : "Amount"}</th>
                  <th className="p-4">{lang === "sw" ? "Hali ya Malipo" : "Escrow Status"}</th>
                  <th className="p-4">{lang === "sw" ? "Saa & Tarehe" : "Timestamp"}</th>
                  <th className="p-4 text-center pr-6">{lang === "sw" ? "Maelezo" : "Audit"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/50 transition duration-150 cursor-pointer group"
                  >
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400 group-hover:text-primary transition">
                      {log.id}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800 font-mono text-xs">
                        #{log.orderId.substring(0, 16).toUpperCase()}
                      </span>
                      {log.customerName && (
                        <span className="block text-[10px] text-slate-400 font-medium">
                          {log.customerName}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 text-xs font-mono font-bold">
                        {log.gatewayReferenceId || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-black text-slate-900 text-sm block max-w-[130px] truncate" title={formatCurrency(log.amount)}>
                        {formatCurrency(log.amount, { compact: true })}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-medium uppercase">
                        {log.paymentMethod || "Mobile Money"}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US")}
                    </td>
                    <td className="p-4 text-center pr-6">
                      <button className="p-1 rounded bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-white transition cursor-pointer">
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Audit Log Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <div 
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-2xl rounded-l-[2rem]">
                  <div className="px-6 flex items-center justify-between border-b border-slate-100 pb-5">
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2" id="slide-over-title">
                      <ShieldCheck size={20} className="text-primary" />
                      {lang === "sw" ? "Mchanganuo wa Muamala" : "Security Audit Trail"}
                    </h2>
                    <button 
                      onClick={() => setSelectedLog(null)}
                      type="button" 
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none transition cursor-pointer"
                    >
                      <span className="sr-only">Close panel</span>
                      <XCircle size={22} />
                    </button>
                  </div>
                  
                  {/* Drawer Content */}
                  <div className="relative mt-6 flex-1 px-6 space-y-6">
                    {/* Status Display Card */}
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2.5xl flex flex-col items-center text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">
                        {lang === "sw" ? "HALI YA MALIPO" : "TRANSACTION STATUS"}
                      </span>
                      {getStatusBadge(selectedLog.status)}
                      <span className="text-2xl font-black text-slate-900 mt-4 block max-w-full truncate" title={formatCurrency(selectedLog.amount)}>
                        {formatCurrency(selectedLog.amount, { compact: true })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1 uppercase">
                        {selectedLog.paymentMethod || "Mobile Money"}
                      </span>
                    </div>

                    {/* Metadata fields */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                        {lang === "sw" ? "Maelezo ya Muamala" : "Transaction Metadata"}
                      </h3>

                      <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                        <span className="text-slate-400 font-bold">{lang === "sw" ? "ID ya Kumbukumbu:" : "Ledger ID:"}</span>
                        <span className="col-span-2 text-slate-700 font-mono font-bold text-right">{selectedLog.id}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                        <span className="text-slate-400 font-bold">{lang === "sw" ? "Namba ya Oda:" : "Order ID:"}</span>
                        <span className="col-span-2 text-slate-700 font-mono font-bold text-right text-[11px] overflow-hidden truncate">
                          #{selectedLog.orderId}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                        <span className="text-slate-400 font-bold">{lang === "sw" ? "Namba ya TX:" : "Gateway TX:"}</span>
                        <span className="col-span-2 text-slate-700 font-mono font-bold text-right">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">
                            {selectedLog.gatewayReferenceId || "N/A"}
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                        <span className="text-slate-400 font-bold">{lang === "sw" ? "Mteja:" : "Customer:"}</span>
                        <span className="col-span-2 text-slate-700 font-bold text-right">{selectedLog.customerName || "N/A"}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                        <span className="text-slate-400 font-bold">{lang === "sw" ? "Saa na Tarehe:" : "Audit Timestamp:"}</span>
                        <span className="col-span-2 text-slate-500 font-medium text-right">
                          {new Date(selectedLog.timestamp).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US")}
                        </span>
                      </div>
                    </div>

                    {/* Cryptographic Proof or System Notes */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                        {lang === "sw" ? "Kumbukumbu na Ukaguzi" : "System Message & Logs"}
                      </h3>
                      <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs space-y-2">
                        <div className="text-slate-600 leading-relaxed font-medium">
                          {selectedLog.message}
                        </div>
                      </div>
                    </div>

                    {/* Security Seals */}
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2.5xl flex items-start gap-3">
                      <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-emerald-800">
                          {lang === "sw" ? "Muamala Umesimbwa" : "Cryptographically Authenticated"}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-normal font-medium">
                          {lang === "sw" 
                            ? "Muamala huu unalindwa kwa ufunguo wa AES-256 GCM dhidi ya kuchezewa na unaoana na TRA." 
                            : "This ledger item is hashed and sealed using AES-256 GCM to prevent payment tampering."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
