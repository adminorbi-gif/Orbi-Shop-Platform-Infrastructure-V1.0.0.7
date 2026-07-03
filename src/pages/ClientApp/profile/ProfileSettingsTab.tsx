import {
  Check,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";

type ProfileSettingsTabProps = {
  lang: string;
  user: any;
  editName: string;
  editPhone: string;
  editEmail: string;
  editAddress: string;
  isEditMode: boolean;
  isSavingProfile: boolean;
  localOrdersCount: number;
  points: number;
  unreadCount: number;
  onSetEditName: (value: string) => void;
  onSetEditPhone: (value: string) => void;
  onSetEditEmail: (value: string) => void;
  onSetEditAddress: (value: string) => void;
  onToggleEdit: () => void;
  onSaveProfile: () => void;
  onLogout?: () => void;
  onClose: () => void;
  onGoOrders: () => void;
  onGoMessages: () => void;
  onGoRewards: () => void;
};

export function ProfileSettingsTab({
  lang,
  user,
  editName,
  editPhone,
  editEmail,
  editAddress,
  isEditMode,
  isSavingProfile,
  localOrdersCount,
  points,
  unreadCount,
  onSetEditName,
  onSetEditPhone,
  onSetEditEmail,
  onSetEditAddress,
  onToggleEdit,
  onSaveProfile,
  onLogout,
  onClose,
  onGoOrders,
  onGoMessages,
  onGoRewards,
}: ProfileSettingsTabProps) {
  const details = [
    {
      icon: User,
      label: lang === "sw" ? "Jina" : "Name",
      value: user.name,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: Phone,
      label: lang === "sw" ? "Simu" : "Phone",
      value: user.phone || "N/A",
      tone: "bg-amber-50 text-amber-600",
    },
    {
      icon: Mail,
      label: lang === "sw" ? "Barua pepe" : "Email",
      value: user.email || "N/A",
      tone: "bg-teal-50 text-teal-600",
    },
    {
      icon: MapPin,
      label: lang === "sw" ? "Anwani ya kufikisha" : "Delivery address",
      value:
        editAddress || (lang === "sw" ? "Haijawekwa bado" : "Not set yet"),
      tone: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary font-black">
              {lang === "sw" ? "Akaunti yangu" : "My account"}
            </p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              {lang === "sw" ? "Taarifa na mipangilio" : "Profile and settings"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              {lang === "sw"
                ? "Badili taarifa za mawasiliano, anwani ya kufikisha, usalama na mapendeleo ya app."
                : "Update contact details, delivery address, security, and app preferences."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="min-h-11 px-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 font-black text-xs flex items-center gap-2 hover:bg-rose-100 transition"
              >
                <LogOut size={15} />
                {lang === "sw" ? "Ondoka" : "Logout"}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleEdit}
              className={`min-h-11 px-4 rounded-2xl font-black text-xs flex items-center gap-2 transition ${
                isEditMode
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-slate-950 text-white hover:bg-slate-800"
              }`}
            >
              {isEditMode ? <X size={15} /> : <Settings size={15} />}
              {isEditMode
                ? lang === "sw"
                  ? "Ghairi"
                  : "Cancel"
                : lang === "sw"
                  ? "Hariri"
                  : "Edit"}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {isEditMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {lang === "sw" ? "Jina kamili" : "Full name"}
                </span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => onSetEditName(e.target.value)}
                  className="min-h-12 bg-slate-50 border border-slate-200 text-slate-900 px-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {lang === "sw" ? "Namba ya simu" : "Phone number"}
                </span>
                <input
                  type="tel"
                  name="settings_phone"
                  autoComplete="tel"
                  value={editPhone}
                  onChange={(e) => onSetEditPhone(e.target.value)}
                  className="min-h-12 bg-slate-50 border border-slate-200 text-slate-900 px-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {lang === "sw" ? "Barua pepe" : "Email address"}
                </span>
                <input
                  type="email"
                  name="settings_email"
                  autoComplete="email"
                  value={editEmail}
                  onChange={(e) => onSetEditEmail(e.target.value)}
                  className="min-h-12 bg-slate-50 border border-slate-200 text-slate-900 px-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {lang === "sw"
                    ? "Anwani ya uwasilishaji"
                    : "Default delivery address"}
                </span>
                <textarea
                  rows={4}
                  value={editAddress}
                  onChange={(e) => onSetEditAddress(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-y min-h-[110px]"
                  placeholder={
                    lang === "sw"
                      ? "Mfano: Kijitonyama, Dar es Salaam"
                      : "e.g. Kijitonyama, Dar es Salaam"
                  }
                />
              </label>
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={onSaveProfile}
                className="sm:col-span-2 min-h-12 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    {lang === "sw" ? "Inahifadhi..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {lang === "sw" ? "Hifadhi mabadiliko" : "Save changes"}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {details.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-start gap-3"
                  >
                    <span
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.tone}`}
                    >
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
                        {item.label}
                      </p>
                      <p
                        className="text-sm font-bold text-slate-800 break-words"
                        title={String(item.value)}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <p className="font-black text-slate-900 text-sm">
              {lang === "sw" ? "Usalama wa akaunti" : "Account security"}
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "sw"
              ? "Endelea kutumia simu/barua pepe sahihi. Mabadiliko nyeti yatathibitishwa kabla ya kuhifadhiwa."
              : "Keep your phone/email updated. Sensitive changes are verified before they are saved."}
          </p>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={18} className="text-primary" />
            <p className="font-black text-slate-900 text-sm">
              {lang === "sw" ? "Mapendeleo ya app" : "App preferences"}
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "sw"
              ? "Lugha na hali ya app zinadhibitiwa na mipangilio ya Orbi Shop kwenye kifaa chako."
              : "Language and app behavior follow your Orbi Shop device preferences."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onGoOrders}
          className="min-h-14 rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md transition"
        >
          <Package size={18} className="text-primary mb-2" />
          <p className="font-black text-slate-900 text-sm">
            {lang === "sw" ? "Oda zangu" : "My orders"}
          </p>
          <p className="text-xs text-slate-500">
            {localOrdersCount} {lang === "sw" ? "jumla" : "total"}
          </p>
        </button>
        <button
          type="button"
          onClick={onGoMessages}
          className="min-h-14 rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md transition"
        >
          <MessageSquare size={18} className="text-primary mb-2" />
          <p className="font-black text-slate-900 text-sm">
            {lang === "sw" ? "Msaada" : "Support"}
          </p>
          <p className="text-xs text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} ${lang === "sw" ? "mpya" : "new"}`
              : lang === "sw"
                ? "Hakuna mpya"
                : "No new messages"}
          </p>
        </button>
        <button
          type="button"
          onClick={onGoRewards}
          className="min-h-14 rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-sm hover:border-primary/30 hover:shadow-md transition"
        >
          <Sparkles size={18} className="text-amber-500 mb-2" />
          <p className="font-black text-slate-900 text-sm">
            {lang === "sw" ? "Zawadi" : "Rewards"}
          </p>
          <p className="text-xs text-slate-500">
            {points} {lang === "sw" ? "alama" : "points"}
          </p>
        </button>
      </div>
    </div>
  );
}
