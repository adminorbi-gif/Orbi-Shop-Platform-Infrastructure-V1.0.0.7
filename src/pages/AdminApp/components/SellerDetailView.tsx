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
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <button onClick={onBack} className="p-2 -ml-2 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors font-medium flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-5">
              {seller.avatar ? (
                <img src={seller.avatar} alt={seller.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-lg border border-slate-100 shrink-0" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-lg shrink-0">
                    {seller.storeName ? seller.storeName.charAt(0).toUpperCase() : seller.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight truncate">{seller.storeName || seller.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest ${seller.status === 'frozen' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {seller.status === 'frozen' ? 'Frozen' : 'Active'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest ${seller.isApproved === false ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                          {seller.isApproved === false ? 'Pending' : 'Approved'}
                      </span>
                      {seller.isPro && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1">
                            <Shield size={12} /> PRO
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 hidden sm:inline-block">ID: {seller.id}</span>
                  </div>
              </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-slate-950 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm">
              Message
            </button>
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
              Edit Settings
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Products', value: sellerProducts.length, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Orders', value: sellerOrders.length, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Revenue', value: `Tsh ${totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Member Since', value: new Date(seller.createdAt || Date.now()).getFullYear(), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-3 group hover:border-slate-300 transition-colors">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
                <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 truncate">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-950">Recent Orders</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{sellerOrders.length} Total</span>
                </div>
                <div className="flex-1 p-0">
                    {sellerOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium">No orders found for this seller yet.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {sellerOrders.slice(0, 10).map(order => (
                                <div key={order.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            {order.customerEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                                              Order #{order.id.substring(0,8)}
                                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider
                                                ${order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                                  order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {order.status}
                                              </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                      <div className="text-sm font-black text-slate-900 truncate max-w-[100px] sm:max-w-none">Tsh {order.total.toLocaleString()}</div>
                                      <ChevronRight className="text-slate-300 group-hover:text-slate-500" size={16} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Profile & Info */}
        <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">Seller Profile</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Store size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owner Name</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{seller.name || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Mail size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{seller.email || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Phone size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{seller.phone || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{seller.location || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">Administration</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <CreditCard size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business Type</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{seller.businessType || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Shield size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TIN Number</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{seller.tin || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-amber-500 shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pro Expiry</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{seller.proUntil ? new Date(seller.proUntil).toLocaleDateString() : 'Free Tier'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
