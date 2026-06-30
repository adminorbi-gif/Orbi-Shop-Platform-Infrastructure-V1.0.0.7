import React from 'react';
import { SellerProfile, Product, Order } from '../../../types';
import { ArrowLeft, Package, ShoppingCart, DollarSign, Store, Mail, Phone, MapPin, User, Shield, CreditCard, Calendar, ChevronRight } from 'lucide-react';

interface SellerDetailViewProps {
  seller: SellerProfile;
  products: Product[];
  orders: Order[];
  onBack: () => void;
}

export const SellerDetailView: React.FC<SellerDetailViewProps> = ({ seller, products, orders, onBack }) => {
  const sellerProducts = products.filter(p => p.sellerId === seller.id);
  const sellerOrders = orders.filter(o => o.items.some(item => sellerProducts.some(p => p.id === item.productId)));
  const totalSales = sellerOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <button onClick={onBack} className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-900 transition-colors font-medium">
        <ArrowLeft size={20} /> Back to Sellers
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
            {seller.avatar && <img src={seller.avatar} alt={seller.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />}
            <div>
                <h2 className="text-4xl font-extrabold text-slate-950 tracking-tight">{seller.storeName || seller.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${seller.status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}`}>
                        {seller.status || 'Active'}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">ID: {seller.id.substring(0, 8)}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all">Edit Profile</button>
            <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all text-slate-700">Message Seller</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Products', value: sellerProducts.length, icon: Package, color: 'text-indigo-600' },
          { label: 'Total Orders', value: sellerOrders.length, icon: ShoppingCart, color: 'text-emerald-600' },
          { label: 'Total Revenue', value: `Tsh ${totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600' },
          { label: 'Subscription', value: seller.isPro ? 'Pro' : 'Free', icon: Shield, color: 'text-amber-600' },
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
            <h3 className="text-xl font-black text-slate-950 mb-6">Recent Orders</h3>
            <div className="space-y-4">
                {sellerOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{order.customerEmail.charAt(0).toUpperCase()}</div>
                            <div>
                                <div className="font-bold text-slate-900 text-sm">Order #{order.id.substring(0,6)}</div>
                                <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="text-sm font-black text-slate-900">Tsh {order.total.toLocaleString()}</div>
                        <ChevronRight className="text-slate-400" size={16} />
                    </div>
                ))}
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm">
                <h3 className="text-lg font-black text-slate-950 mb-4">Profile Info</h3>
                <div className="space-y-4 text-sm text-slate-600">
                    <p className="flex items-center gap-3"><Store size={18} className="text-slate-400" /> <span className="font-medium text-slate-900">{seller.name}</span></p>
                    <p className="flex items-center gap-3"><Mail size={18} className="text-slate-400" /> {seller.email || 'N/A'}</p>
                    <p className="flex items-center gap-3"><Phone size={18} className="text-slate-400" /> {seller.phone || 'N/A'}</p>
                    <p className="flex items-center gap-3"><MapPin size={18} className="text-slate-400" /> {seller.location || 'N/A'}</p>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm">
                <h3 className="text-lg font-black text-slate-950 mb-4">Administration</h3>
                <div className="space-y-3 text-sm text-slate-600">
                    <p><span className="text-slate-400 font-medium">Business:</span> <span className="font-semibold text-slate-900">{seller.businessType || 'N/A'}</span></p>
                    <p><span className="text-slate-400 font-medium">TIN:</span> <span className="font-semibold text-slate-900">{seller.tin || 'N/A'}</span></p>
                    <p><span className="text-slate-400 font-medium">Pro Until:</span> <span className="font-semibold text-slate-900">{seller.proUntil ? new Date(seller.proUntil).toLocaleDateString() : 'N/A'}</span></p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
