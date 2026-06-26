import React from "react";
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

export function FinancesAdmin({ orders }: { orders: Order[] }) {
  const { lang, t } = useI18n();
  const totalPaid = orders
    .filter((o) => o.status === "confirmed")
    .reduce((acc, o) => acc + o.total, 0);
  const totalPending = orders
    .filter((o) => o.status === "pending")
    .reduce((acc, o) => acc + o.total, 0);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="text-emerald-500 mb-4 relative">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative">
              Released Payouts
            </div>
            <div className="text-3xl font-black text-slate-900 relative">
              TZS {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium relative flex items-center gap-1">
              <ArrowUpRight size={14} /> Funds cleared to seller account.
            </p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="text-orange-500 mb-4 relative">
              <Lock size={32} />
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 relative">
              In PaySafe (Pending)
            </div>
            <div className="text-3xl font-black text-slate-900 relative">
              TZS {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-orange-600 mt-2 font-medium relative flex items-center gap-1">
              <Lock size={14} /> Awaiting customer delivery confirmation.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2rem] shadow-sm text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="text-white/60 mb-4 relative">
              <ShieldCheck size={32} />
            </div>
            <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1 relative">
              ORBI PaySafe Protect
            </div>
            <div className="text-2xl font-black relative drop-shadow">
              Active & Verified
            </div>
            <p className="text-xs text-white/50 mt-2 relative">
              All marketplace transactions are secured.
            </p>
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
