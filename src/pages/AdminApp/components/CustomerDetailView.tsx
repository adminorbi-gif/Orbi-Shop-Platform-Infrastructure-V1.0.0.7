import React from 'react';
import { Customer, Order } from '../../../types';
import { ArrowLeft, ShoppingCart, DollarSign, User, Mail, Phone, Calendar, Shield, ChevronRight, Activity, MapPin, MessageSquare, Lock, Trash } from 'lucide-react';

interface CustomerDetailViewProps {
  customer: Customer;
  orders: Order[];
  onBack: () => void;
  onMessage?: () => void;
  onResetPassword?: () => void;
  onToggleFreeze?: () => void;
  onDelete?: () => void;
  canAdministrate?: boolean;
  currentStaffRole?: string;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  orders,
  onBack,
  onMessage,
  onResetPassword,
  onToggleFreeze,
  onDelete,
  canAdministrate,
  currentStaffRole,
}) => {
  const customerOrders = orders.filter(o => o.customerId === customer.id || o.customer_id === customer.id);
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);

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
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-lg shrink-0">
                  {customer.name ? customer.name.charAt(0).toUpperCase() : customer.email?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight truncate">{customer.name || customer.email}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest ${customer.status === 'frozen' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {customer.status === 'frozen' ? 'Frozen' : 'Active'}
                      </span>
                      {customer.deleteRequested && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                            Delete Requested
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 hidden sm:inline-block">ID: {customer.id}</span>
                  </div>
              </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10 w-full md:w-auto">
            <button onClick={onMessage} className="flex-1 md:flex-none px-4 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-1.5">
              <MessageSquare size={14} /> Message
            </button>
            <button onClick={onResetPassword} className="flex-1 md:flex-none px-4 py-2.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs font-black hover:bg-amber-100 transition-all shadow-sm flex items-center justify-center gap-1.5">
              <Lock size={14} /> Reset
            </button>
            {canAdministrate && (
              <>
                <button
                  onClick={onToggleFreeze}
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                    customer.status === "frozen"
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : "bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  {customer.status === "frozen" ? "Activate" : "Freeze"}
                </button>
                <button
                  onClick={onDelete}
                  disabled={customer.deleteRequested && currentStaffRole === "human_resources"}
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                    customer.deleteRequested && currentStaffRole === "human_resources"
                      ? "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-red-50 border border-red-100 text-red-700 hover:bg-red-100"
                  }`}
                >
                  <Trash size={14} /> {currentStaffRole === "super_admin" ? "Delete" : customer.deleteRequested ? "Requested" : "Request"}
                </button>
              </>
            )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="orbi-admin-auto-grid">
        {[
          { label: 'Total Orders', value: customerOrders.length, icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Spent', value: `Tsh ${totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Orders Completed', value: customerOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Member Since', value: new Date(customer.registeredAt).getFullYear(), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="orbi-admin-card p-5 rounded-3xl border border-slate-200/60 flex flex-col gap-3 group hover:border-slate-300 transition-colors">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
                <div className="orbi-admin-label text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
                <div className="orbi-admin-compact-value font-black text-slate-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-950">Recent Orders</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{customerOrders.length} Total</span>
                </div>
                <div className="flex-1 p-0">
                    {customerOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium">No orders found for this customer.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {customerOrders.slice(0, 10).map(order => (
                                <div key={order.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <ShoppingCart size={18} />
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
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">Contact Information</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Mail size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{customer.email || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Phone size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{customer.phone || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{customer.location || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-5">Account Details</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered Date</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{new Date(customer.registeredAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <Shield size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TIN Number</div>
                            <div className="text-sm font-semibold text-slate-800 truncate">{customer.tin || 'Not Provided'}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            <User size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</div>
                            <div className="text-sm font-semibold text-slate-800 truncate capitalize">{customer.role || 'Customer'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

