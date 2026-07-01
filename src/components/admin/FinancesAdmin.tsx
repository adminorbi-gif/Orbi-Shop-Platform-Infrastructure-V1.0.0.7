import React, { useMemo } from "react";
import { Order } from "../../types";
import { useI18n } from "../../pages/AdminApp";
import {
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function FinancesAdmin({ orders }: { orders: Order[] }) {
  const { lang, t } = useI18n();
  const totalPaid = orders
    .filter((o) => o.status === "confirmed")
    .reduce((acc, o) => acc + o.total, 0);
  const totalPending = orders
    .filter((o) => o.status === "pending")
    .reduce((acc, o) => acc + o.total, 0);

  const monthlyRevenueData = useMemo(() => {
    const last12Months: { name: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", {
        month: "short",
      });
      const revenue = orders
        .filter((o) => {
          const date = new Date(o.date);
          return (
            o.status === "confirmed" &&
            date.getMonth() === month.getMonth() &&
            date.getFullYear() === month.getFullYear()
          );
        })
        .reduce((acc, o) => acc + o.total, 0);
      last12Months.push({ name: monthName, revenue });
    }
    return last12Months;
  }, [orders, lang]);

  const projectionData = useMemo(() => {
    const N = monthlyRevenueData.length;
    let W = 0;
    let sumWX = 0;
    let sumWY = 0;
    let sumWXY = 0;
    let sumWX2 = 0;

    monthlyRevenueData.forEach((d, i) => {
      const w = i + 1; // Assign higher weight to more recent months
      W += w;
      sumWX += w * i;
      sumWY += w * d.revenue;
      sumWXY += w * i * d.revenue;
      sumWX2 += w * i * i;
    });

    // WLS formulas
    const denominator = (W * sumWX2 - sumWX * sumWX);
    const m = denominator === 0 ? 0 : (W * sumWXY - sumWX * sumWY) / denominator;
    const c = (sumWY - m * sumWX) / W;

    const dataWithProjection = monthlyRevenueData.map((d, i) => ({
      ...d,
      projection: Math.max(0, m * i + c)
    }));
    
    dataWithProjection.push({
        name: "Next",
        revenue: 0,
        projection: Math.max(0, m * 12 + c)
    });

    return dataWithProjection;
  }, [monthlyRevenueData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto w-full" id="finances-admin-panel">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Finances & PaySafe
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Manage payouts, held PaySafe amounts, and ORBI Financial status.
            </p>
          </div>
          <a
            href="#"
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition"
          >
            <DollarSign size={18} /> Orbi Financial Login
          </a>
        </div>

        {/* Overview Cards */}
        <div className="orbi-admin-auto-grid">
          <div className="orbi-admin-card p-6 rounded-[2rem] border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="text-emerald-500 mb-4 relative">
              <CheckCircle2 size={32} />
            </div>
            <div className="orbi-admin-label text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative">
              Released Payouts
            </div>
            <div className="orbi-admin-metric-value font-black text-slate-900 relative">
              TZS {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium relative flex items-center gap-1">
              <ArrowUpRight size={14} /> Funds cleared to seller account.
            </p>
          </div>

          <div className="orbi-admin-card p-6 rounded-[2rem] border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="text-orange-500 mb-4 relative">
              <Lock size={32} />
            </div>
            <div className="orbi-admin-label text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative">
              In PaySafe (Pending)
            </div>
            <div className="orbi-admin-metric-value font-black text-slate-900 relative">
              TZS {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-orange-600 mt-2 font-medium relative flex items-center gap-1">
              <Lock size={14} /> Awaiting customer delivery confirmation.
            </p>
          </div>

          <div className="orbi-admin-card bg-slate-900 p-6 rounded-[2rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="text-white/60 mb-4 relative">
              <ShieldCheck size={32} />
            </div>
            <div className="orbi-admin-label text-xs font-bold text-white/60 uppercase tracking-widest mb-1 relative">
              ORBI PaySafe Protect
            </div>
            <div className="orbi-admin-compact-value font-black relative drop-shadow">
              Active & Verified
            </div>
            <p className="text-xs text-white/50 mt-2 relative">
              All marketplace transactions are secured.
            </p>
          </div>
        </div>

        {/* Monthly Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <h2 className="text-lg font-black text-slate-900 mb-6">Monthly Revenue Trend (Last 12 Months)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "1rem", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="projection" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions / Ledger Table */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              PaySafe Ledger
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4">Transaction Ref</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">PaySafe Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {o.id.substring(0, 12).toUpperCase()}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(o.date).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {o.customerDetails?.name || "Unknown"}
                    </td>
                    <td className="p-4 font-black text-slate-900 text-base">
                      TZS {formatCurrency(o.total)}
                    </td>
                    <td className="p-4">
                      {o.status === "confirmed" ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[11px] uppercase tracking-wider">
                          <CheckCircle2 size={14} /> Cleared
                        </div>
                      ) : o.status === "cancelled" ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold text-[11px] uppercase tracking-wider">
                          <X size={14} /> Refunded
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 font-bold text-[11px] uppercase tracking-wider">
                          <Lock size={14} /> Held in PaySafe
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      No financial transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
