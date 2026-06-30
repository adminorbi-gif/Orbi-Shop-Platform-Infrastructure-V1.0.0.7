import React from 'react';
import { Customer, Order } from '../../../types';
import { ArrowLeft, ShoppingCart, DollarSign, User, Mail, Phone, Calendar, Shield, ChevronRight, Activity } from 'lucide-react';

interface CustomerDetailViewProps {
  customer: Customer;
  orders: Order[];
  onBack: () => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, orders, onBack }) => {
  const customerOrders = orders.filter(o => o.customerId === customer.id || o.customer_id === customer.id);
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-900 transition-colors font-medium">
        <ArrowLeft size={20} /> Back to Customers
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-3xl shadow-lg">
                {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 className="text-4xl font-extrabold text-slate-950 tracking-tight">{customer.name || customer.email}</h2>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}`}>
                        {customer.status || 'Active'}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">ID: {customer.id.substring(0, 8)}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all">Message Customer</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Orders', value: customerOrders.length, icon: ShoppingCart, color: 'text-emerald-600' },
          { label: 'Total Spent', value: `Tsh ${totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600' },
          { label: 'Orders Completed', value: customerOrders.filter(o => o.status === 'completed').length, icon: Activity, color: 'text-indigo-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-2xl bg-slate-100 ${stat.color}`}>
                <stat.icon size={24} />
            </div>
            <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                <div className="text-2xl font-black text-slate-950 mt-1">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm">
            <h3 className="text-xl font-black text-slate-950 mb-6">Order History</h3>
            <div className="space-y-4">
                {customerOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div>
                            <div className="font-bold text-slate-900 text-sm">Order #{order.id.substring(0,6)}</div>
                            <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-sm font-black text-slate-900">Tsh {order.total.toLocaleString()}</div>
                        <ChevronRight className="text-slate-400" size={16} />
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/50 shadow-sm">
            <h3 className="text-lg font-black text-slate-950 mb-6">Customer Profile</h3>
            <div className="space-y-4 text-sm text-slate-600">
                <p className="flex items-center gap-3"><Mail size={18} className="text-slate-400" /> {customer.email || 'N/A'}</p>
                <p className="flex items-center gap-3"><Phone size={18} className="text-slate-400" /> {customer.phone || 'N/A'}</p>
                <p className="flex items-center gap-3"><Calendar size={18} className="text-slate-400" /> Joined: {new Date(customer.registeredAt).toLocaleDateString()}</p>
                <p className="flex items-center gap-3"><Shield size={18} className="text-slate-400" /> TIN: {customer.tin || 'N/A'}</p>
            </div>
        </div>
      </div>
    </div>
  );
};
