import { getStoragePath, extractMediaFromText, isImage, isVideo } from '../../lib/media';
import { uploadFileToSupabase } from '../../lib/upload';
import { getOrderNumber } from "../../lib/helpers";
import { useAdminApp } from "./useAdminApp";
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";
import { motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../lib/storage";
import { PriceDisplay } from "../../components/PriceDisplay";
import { db } from "../../lib/db";
import { SchemaValidator } from "../../utils/schemaValidation";
import { PhotoQualityGuide } from "../../components/PhotoQualityGuide";
import {
  Product,
  Order,
  OrderStatusLog,
  Promotion,
  Message,
  Customer,
  Coupon,
  Niche,
  SellerProfile,
  SubscriptionPlan,
  PromotionalBanner,
  Category,
} from "../../types";
import {
  Plus,
  Trash,
  Edit,
  Check,
  X,
  Image as ImageIcon,
  Search,
  Copy,
  CheckCircle2,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Calendar,
  ExternalLink,
  MessageSquare,
  History,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Ticket,
  FileText,
  LogOut,
  Store,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Bell,
  Lock,
  Paperclip,
  Download,
  Clock,
  ArrowUpRight,
  Truck,
  ShieldCheck,
  Smartphone,
  Shirt,
  Sofa,
  Heart,
  CarFront,
  Sparkles,
  Award,
  Barcode,
  Camera,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Megaphone,
  Bot,
  Cpu,
  Activity,
  Laptop,
  Baby,
  Palette,
  Coffee,
  Dumbbell,
  Scissors,
  Briefcase,
  Gift,
  Headphones,
  Cake,
  Watch,
  Bike,
  Key,
  BookOpen,
  Leaf,
  Flame,
  Music,
  Gem,
  Tv,
  Compass,
  Footprints,
  Crown,
  GlassWater,
  Wrench,
  Flower2,
  Anchor,
  Apple,
  Banana,
  Beer,
  Bone,
  Box,
  Brain,
  Brush,
  Bus,
  Calculator,
  Candy,
  Cat,
  ChefHat,
  Clapperboard,
  Cloud,
  Coins,
  Cookie,
  Dog,
  Dices,
  Disc,
  Egg,
  Fan,
  Feather,
  Fish,
  Gamepad2,
  Gavel,
  Guitar,
  Hammer,
  IceCream,
  Joystick,
  Lightbulb,
  Luggage,
  Map as MapIcon,
  Mic,
  Microscope,
  Moon,
  Mountain,
  Paintbrush,
  PenTool,
  Pill,
  Pizza,
  Plane,
  Plug,
  Printer,
  Puzzle,
  Radio,
  Receipt,
  Rocket,
  Ruler,
  Scale,
  Server,
  Shell,
  ShowerHead,
  Shovel,
  Sprout,
  Stethoscope,
  Sun,
  Table,
  Tablet,
  Tent,
  Thermometer,
  Trophy,
  Umbrella,
  Utensils,
  Wallet,
  Wine,
  Globe,
  Armchair,
  Bath,
  Battery,
  Bed,
  Beef,
  BellRing,
  Bird,
  Book,
  Castle,
  Clover,
  Construction,
  Container,
  CupSoda,
  Glasses,
  GraduationCap,
  HardHat,
  Heater,
  Martini,
  Notebook,
  PackageOpen,
  PawPrint,
  Pen,
  Pencil,
  PiggyBank,
  PlugZap,
  Rabbit,
  Refrigerator,
  Salad,
  Sandwich,
  ShoppingBasket,
  Smile,
  Snowflake,
  Soup,
  Speaker,
  Target,
  Telescope,
  Terminal,
  ToyBrick,
  Train,
  Trees,
  Volleyball,
  Wand,
  Warehouse,
  WashingMachine,
  Waves,
  Webcam,
  Wheat,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Lang, t } from "../../lib/i18nAdmin";
import { FinancesAdmin } from "../../components/admin/FinancesAdmin";
import { StaffAdmin } from "../../components/admin/StaffAdmin";
import { AdsAdmin } from "../../components/admin/AdsAdmin";
import { CampaignsAdmin } from "../../components/admin/CampaignsAdmin";
import { PaymentLogsAdmin } from "../../components/admin/PaymentLogsAdmin";
const SellerApp = lazy(() => import("../SellerApp"));
import VisitorsAnalyticsView from "../../components/VisitorsAnalytics";
import { ApplySellerModal } from "../../components/client/ClientSubcomponents";
import { LoadingOverlay } from "../../components/LoadingOverlay";

import {
  AdvancedSellerAnalytics,
  SellersAdmin,
  PayoutsAdmin,
  StatCard,
  StockNotificationsAdmin,
  ProductsAdmin,
  OrdersAdmin,
  PromosAdmin,
  MessagesAdmin,
  CustomersAdmin,
  SettingsAdmin,
  InvoiceModal,
  SellerSettingsSelf,
  AIPilotEngine,
  TalkLogsAdmin,
  CouponsAdmin
} from './components';













interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: "sw",
  setLang: () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

const TanzaniaFlag = () => (
  <svg
    viewBox="0 0 300 200"
    className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-slate-200"
    fill="none"
  >
    <polygon points="0,0 300,0 0,200" fill="#1eb53a" />
    <polygon points="0,200 300,200 300,0" fill="#00a3dd" />
    <line
      x1="-20"
      y1="220"
      x2="320"
      y2="-20"
      stroke="#fcd116"
      strokeWidth="54"
    />
    <line
      x1="-20"
      y1="220"
      x2="320"
      y2="-20"
      stroke="#000000"
      strokeWidth="34"
    />
  </svg>
);

const UKFlag = () => (
  <svg
    viewBox="0 0 60 30"
    className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-slate-200"
    fill="none"
  >
    <clipPath id="uk-flag-clip-admin">
      <path d="M0,0 L30,15 L0,15 z M0,30 L30,15 L30,30 z M60,30 L30,15 L60,15 z M60,0 L30,15 L30,0 z" />
    </clipPath>
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path
      d="M0,0 L60,30 M60,0 L0,30"
      stroke="#C8102E"
      strokeWidth="4"
      clipPath="url(#uk-flag-clip-admin)"
    />
    <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

export interface OrderItemRowProps {
  order: Order;
  isSelected: boolean;
  onToggleSelection: (id: string, isChecked: boolean) => void;
  lang: string;
  onUpdateStatus: (id: string, status: string) => void;
  onSendInvoice: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onShipClick: (order: Order) => void;
}

export const OrderItemRow = React.memo(function OrderItemRow({
  order,
  isSelected,
  onToggleSelection,
  lang,
  onUpdateStatus,
  onSendInvoice,
  onDeleteOrder,
  onShipClick,
}: OrderItemRowProps) {
  const prevStatusRef = useRef(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showApproveFundsConfirm, setShowApproveFundsConfirm] = useState(false);

  useEffect(() => {
    if (prevStatusRef.current !== order.status) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 2000);
      prevStatusRef.current = order.status;
      setShowApproveFundsConfirm(false);
      return () => clearTimeout(timer);
    }
  }, [order.status]);

  

  const statusUpper = order.status ? order.status.toUpperCase() : "CREATED";

  return (
    <tr className="border-b last:border-0 border-slate-100">
      <td className="p-4 w-12 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelection(order.id, e.target.checked)}
          className="rounded text-accent focus:ring-accent w-4 h-4 cursor-pointer"
        />
      </td>
      <td className="p-4 items-center">
        <div className="font-mono font-bold text-accent text-sm">
          #{getOrderNumber(order.id)}
        </div>
        <div
          className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]"
          title={`ID ya Mfumo: ${order.id}`}
        >
          {order.id}
        </div>
        <div className="text-xs text-slate-500 tracking-wide font-medium mt-1">
          {new Date(order.date).toLocaleDateString("sw-TZ")}
        </div>
      </td>
      <td className="p-4">
        <div className="font-medium text-sm">{order.customerDetails.name}</div>
        <div className="text-xs text-slate-500">
          {order.customerDetails.phone}
        </div>
      </td>
      <td className="p-4">
        <ul className="text-sm list-disc pl-4 text-slate-600">
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.quantity}x {i.name}
            </li>
          ))}
        </ul>
      </td>
      <td className="p-4 font-bold">{formatCurrency(order.total)}</td>
      <td className="p-4 whitespace-nowrap min-w-[125px]">
        <motion.span
          key={order.status}
          initial={{ scale: 0.85, opacity: 0.7 }}
          animate={{
            scale: isUpdating ? [1, 1.25, 0.9, 1.1, 1] : 1,
            opacity: 1,
            boxShadow: isUpdating
              ? "0 4px 12px rgba(79, 70, 229, 0.3)"
              : "0 0px 0px rgba(0,0,0,0)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: isUpdating ? 450 : 350,
            damping: isUpdating ? 14 : 22,
          }}
          className={`inline-flex items-center justify-center whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide text-center shrink-0 max-w-full select-none transition-all duration-300 border shadow-sm ${
            isUpdating ? "ring-2 ring-indigo-500 ring-offset-1 font-black" : ""
          } ${
            statusUpper === "RELEASED"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : statusUpper === "DISPUTED"
                ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                : statusUpper === "SHIPPED"
                  ? "bg-sky-50 text-sky-700 border-sky-305 animate-pulse"
                  : statusUpper === "DELIVERED"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : statusUpper === "BUYER_CONFIRMED"
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : statusUpper === "PAYMENT_HELD" ||
                          statusUpper === "PROCESSING"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : statusUpper === "CANCELLED" ||
                            statusUpper === "REFUNDED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-205"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              statusUpper === "RELEASED"
                ? "bg-emerald-500"
                : statusUpper === "DISPUTED"
                  ? "bg-rose-500"
                  : statusUpper === "SHIPPED"
                    ? "bg-sky-500 animate-ping"
                    : "bg-current"
            }`}
          ></span>
          {statusUpper === "CREATED" &&
            (lang === "sw" ? "Imepokelewa" : "Created")}
          {statusUpper === "AWAITING_PAYMENT" &&
            (lang === "sw" ? "Inasubiri Malipo" : "Awaiting Payment")}
          {statusUpper === "PAYMENT_HELD" &&
            (lang === "sw" ? "Escrow: Held" : "Escrow: Held")}
          {statusUpper === "PROCESSING" &&
            (lang === "sw" ? "Inandaliwa" : "Processing")}
          {statusUpper === "SHIPPED" &&
            (lang === "sw" ? "Mzigo Njiani" : "Transit")}
          {statusUpper === "DELIVERED" &&
            (lang === "sw"
              ? "Imefika / Thibitisha"
              : "Delivered / Confirm Receipt")}
          {statusUpper === "BUYER_CONFIRMED" &&
            (lang === "sw" ? "Imeidhinishwa" : "Receipt Confirmed")}
          {statusUpper === "DISPUTED" &&
            (lang === "sw" ? "Mgogoro" : "Disputed (Escrow Locked)")}
          {statusUpper === "RELEASED" &&
            (lang === "sw" ? "Fedha Zimetolewa" : "Completed & Disbursed")}
          {statusUpper === "REFUNDED" &&
            (lang === "sw" ? "Imerejeshwa" : "Refunded")}
          {statusUpper === "CANCELLED" &&
            (lang === "sw" ? "Imeghairiwa" : "Cancelled")}
        </motion.span>
        {(() => {
          const displayId = (order as any).legacy_id || order.id;
          const proofs = JSON.parse(
            localStorage.getItem("orbi_payment_proofs") || "{}",
          );
          const proof = proofs[displayId];
          const refId =
            order.paymentReference || (proof && proof.transactionId);
          if (refId) {
            return (
              <div className="text-[9px] mt-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg px-2 py-1 font-mono font-black tracking-wide max-w-[130px] flex items-center gap-1">
                <span className="font-semibold text-emerald-600">💰 REF:</span>{" "}
                {refId}
              </div>
            );
          }
          return null;
        })()}
      </td>
      <td className="p-4 flex gap-2 flex-wrap">
        {(statusUpper === "CREATED" || statusUpper === "AWAITING_PAYMENT") && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, "PAYMENT_HELD")}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs flex items-center gap-1 font-bold shadow-sm transition cursor-pointer"
            >
              <Check size={13} strokeWidth={2.5} />{" "}
              {lang === "sw" ? "Kubali Malipo (Escrow)" : "Approve Escrow"}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
              className="px-3 py-1 bg-red-500 hover:bg-red-650 text-white rounded text-xs flex items-center gap-1 cursor-pointer transition"
            >
              <X size={13} /> {lang === "sw" ? "Ghairi" : "Cancel"}
            </button>
          </>
        )}
        {statusUpper === "PAYMENT_HELD" && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, "PROCESSING")}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center gap-1 font-bold shadow-sm cursor-pointer transition"
            >
              <Check size={13} strokeWidth={2.5} />{" "}
              {lang === "sw" ? "Anza Kuandaa" : "Prepare Order"}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
              className="px-3 py-1 bg-red-500 hover:bg-red-650 text-white rounded text-xs flex items-center gap-1 cursor-pointer transition"
            >
              <X size={13} />{" "}
              {lang === "sw" ? "Refund / Ghairi" : "Refund / Cancel"}
            </button>
          </>
        )}
        {statusUpper === "PROCESSING" && (
          <>
            <button
              onClick={() => onShipClick(order)}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs flex items-center gap-1 font-bold transition shadow-sm cursor-pointer"
            >
              <Barcode size={13} strokeWidth={2.5} />{" "}
              {lang === "sw" ? "Kamilisha & Ship" : "Confirm Ship (SKU)"}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
              className="px-3 py-1 bg-red-500 hover:bg-red-650 text-white rounded text-xs flex items-center gap-1 cursor-pointer transition"
            >
              <X size={13} />{" "}
              {lang === "sw" ? "Refund / Ghairi" : "Refund / Cancel"}
            </button>
          </>
        )}
        {statusUpper === "SHIPPED" && (
          <>
            <div className="flex flex-col gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 p-1.5 rounded-lg max-w-[140px] truncate">
              <span className="font-bold text-slate-700">
                🚚 Rider Delivery:
              </span>
              <span className="truncate">
                {order.riderName || "In Transit"}
              </span>
            </div>
            <button
              onClick={() => onUpdateStatus(order.id, "DELIVERED")}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center gap-1 font-bold shadow-sm transition cursor-pointer"
            >
              {lang === "sw" ? "Fanya Imefika" : "Force Delivered"}
            </button>
          </>
        )}
        {statusUpper === "DELIVERED" && (
          <div className="flex flex-col gap-1 text-[11px] text-slate-600 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg max-w-[150px]">
            <span className="font-bold flex items-center gap-1 text-amber-800">
              <span className="animate-ping rounded-full h-1.5 w-1.5 bg-amber-600 mr-0.5" />
              Inasubiri Mteja Atume Thibitisho...
            </span>
          </div>
        )}
        {statusUpper === "BUYER_CONFIRMED" && (
          <div className="flex flex-col gap-1.5 min-w-[155px]">
            {!showApproveFundsConfirm ? (
              <button
                onClick={() => setShowApproveFundsConfirm(true)}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs flex items-center gap-1 font-extrabold shadow-sm cursor-pointer transition select-none justify-center"
              >
                🔒 {lang === "sw" ? "Idhinisha Malipo" : "Approve Funds"}
              </button>
            ) : (
              <div className="bg-slate-900 border border-slate-800 text-white p-2 rounded-lg flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-200">
                <span className="text-[9px] text-slate-350 font-bold block leading-relaxed text-center">
                  ⚠️{" "}
                  {lang === "sw"
                    ? "Idhibitishe ili Kumaliza?"
                    : "Finalize Release?"}
                </span>
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => {
                      onUpdateStatus(order.id, "RELEASED");
                    }}
                    className="flex-1 py-0.5 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-black transition cursor-pointer text-center"
                  >
                    ✓ {lang === "sw" ? "Sawa" : "Yes"}
                  </button>
                  <button
                    onClick={() => setShowApproveFundsConfirm(false)}
                    className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-semibold transition cursor-pointer text-center"
                  >
                    ✕ {lang === "sw" ? "La" : "No"}
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => onSendInvoice(order)}
              className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-white rounded text-xs flex items-center gap-1 font-bold cursor-pointer transition select-none justify-center border border-slate-750"
            >
              {lang === "sw" ? "Tuma Ankara" : "Send Invoice"}
            </button>
          </div>
        )}
        {statusUpper === "RELEASED" && (
          <span className="px-2 py-1 bg-emerald-50 rounded text-xs text-emerald-800 flex items-center gap-1 font-extrabold border border-emerald-255 shrink-0">
            <Check className="text-emerald-600" size={13} strokeWidth={3} />
            {lang === "sw" ? "Fedha Zimechukuliwa" : "Funds Disbursed"}
          </span>
        )}
        {statusUpper === "DISPUTED" && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, "DELIVERED")}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs flex items-center gap-1 font-bold shadow-sm transition cursor-pointer"
            >
              📥{" "}
              {lang === "sw"
                ? "Malizia Mgogoro (Fanya Imefika)"
                : "Resolve & Force Deliver"}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center gap-1 font-bold shadow-sm transition cursor-pointer"
            >
              ↩ {lang === "sw" ? "Rejesha Malipo" : "Approve Full Refund"}
            </button>
          </>
        )}
        <button
          onClick={() => onDeleteOrder(order)}
          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer border border-rose-650"
          title="Futa Oda"
        >
          <Trash size={13} /> Futa
        </button>
      </td>
    </tr>
  );
});

import { useDialog } from "../../components/CustomDialogContext";
import { CameraBarcodeScanner } from "../../components/CameraBarcodeScanner";

import { ErrorBoundary } from "../../ErrorBoundary";

export default function AdminApp() {
  const {
    showAlert,
    isLogged,
    setIsLogged,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isRegistering,
    setIsRegistering,
    loading,
    setLoading,
    lang,
    setLang,
    showApplyModal,
    setShowApplyModal,
    handleAuth,
    logout
  } = useAdminApp();

  if (loading) return <LoadingOverlay />;

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-sm w-full">
          <div className="flex flex-col items-center mb-6">
            <img
              src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
              alt="Orbi Shop"
              className="h-16 mb-4 object-contain"
            />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {lang === "sw" ? "Ingia kwenye Dashibodi" : "Admin Login"}
            </h2>
            <p className="text-slate-500 text-sm">
              {lang === "sw"
                ? "Jisajili au ingia."
                : "Sign in or create account."}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {lang === "sw" ? "Barua pepe" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {lang === "sw" ? "Nenosiri" : "Password"}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPass"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="showPass" className="text-sm text-slate-600">
                {lang === "sw" ? "Onyesha nenosiri" : "Show password"}
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold rounded-lg py-3 hover:bg-slate-800 transition disabled:opacity-50 mt-4"
            >
              {loading ? "..." : lang === "sw" ? "Ingia" : "Sign In"}
            </button>
          </form>
          <div className="mt-4 text-center flex flex-col gap-2">
            <button
              onClick={() => setShowApplyModal(true)}
              className="text-xs font-black text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer uppercase tracking-wider border border-amber-200"
            >
              {lang === "sw" ? "Jiunge kama Muuzaji" : "Join as Seller"}
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="text-sm text-slate-500 hover:text-slate-600 underline transition cursor-pointer"
            >
              {lang === "sw" ? "Rudi Ukurasa Mkuu" : "Back to Main App"}
            </button>
          </div>
        </div>
        {showApplyModal && (
          <ApplySellerModal
            lang={lang}
            onClose={() => setShowApplyModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <I18nContext.Provider value={{ lang: lang || "sw", setLang }}>
        <AdminDashboard onLogout={logout} />
      </I18nContext.Provider>
    </ErrorBoundary>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { lang, setLang } = useI18n();
  const getShortLabel = (id: string, currentLang: string) => {
    const isSw = currentLang === "sw";
    switch (id) {
      case "dashboard":
        return isSw ? "Dash" : "Dash";
      case "finances":
        return isSw ? "Hesabu" : "PaySafe";
      case "products":
        return isSw ? "Bidhaa" : "Catalog";
      case "orders":
        return isSw ? "Oda" : "Orders";
      case "promos":
        return isSw ? "Matoleo" : "Deals";
      case "coupons":
        return isSw ? "Kuponi" : "Coupons";
      case "ads":
        return isSw ? "Matangazo" : "Ads";
      case "sellers":
        return isSw ? "Wauzaji" : "Sellers";
      case "staff":
        return isSw ? "Staff" : "Staff";
      case "payouts":
        return isSw ? "Malipo" : "Payouts";
      case "notifications":
        return isSw ? "Taarifa" : "Alerts";
      case "ai-pilot":
        return isSw ? "AI Bot" : "AI Bot";
      case "visitors-analytics":
        return isSw ? "Wageni" : "Visits";
      case "messages":
        return isSw ? "Chats" : "Chats";
      case "customers":
        return isSw ? "Wateja" : "Clients";
      case "settings":
        return isSw ? "Seti" : "Settings";
      case "seller_settings":
        return isSw ? "Seti" : "Settings";
      case "payment-logs":
        return isSw ? "Leja" : "Ledger";
      default:
        return id;
    }
  };
  const [tab, setTab] = useState<
    | "dashboard"
    | "products"
    | "orders"
    | "promos"
    | "messages"
    | "customers"
    | "settings"
    | "coupons"
    | "finances"
    | "payouts"
    | "ads"
    | "ai-pilot"
    | "campaigns"
    | "sellers"
    | "staff"
    | "notifications"
    | "visitors-analytics"
    | "talk-logs"
    | "payment-logs"
  >("dashboard");

  // App UI State
  const [dashboardChartsOpen, setDashboardChartsOpen] = useState(false);

  // Screen size detection to avoid rendering hidden 0x0 size layout charts on mobile/tablet viewports
  const [isLgScreen, setIsLgScreen] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsLgScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  // Auth User & Registered Seller lookup
  const [currentSeller, setCurrentSeller] = useState<SellerProfile | null>(
    null,
  );
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Dynamic Subscription Upgrading Fields
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState("");
  const [upgradePhoneNumber, setUpgradePhoneNumber] = useState("");
  const [upgradeReference, setUpgradeReference] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // States for Forced Password Change upon entry
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [savingNewPassword, setSavingNewPassword] = useState(false);

  // States for Orbi Security Policy - Merchant Verification Form
  const [verifyFullName, setVerifyFullName] = useState("");
  const [verifyBusinessName, setVerifyBusinessName] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyLocation, setVerifyLocation] = useState("");
  const [verifyTin, setVerifyTin] = useState("");

  // Simulated OTP verification states
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpSentMessage, setOtpSentMessage] = useState(false);
  const [isVerifyingPhoneState, setIsVerifyingPhoneState] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);

  const { showAlert } = useDialog();

  const saveOrderWithValidation = async (
    orderPayload: any,
    customBaseOrder?: Order,
  ) => {
    // 1. Find the existing full order in the 'orders' state array if available, to ensure we have any populated fallback details
    const existingOrder =
      customBaseOrder || orders.find((o) => o.id === orderPayload.id);

    // 2. Synthesize and merge all required fields to form a complete Order object
    const finalCustomerDetails = {
      name: (
        orderPayload.customerDetails?.name ||
        existingOrder?.customerDetails?.name ||
        existingOrder?.customer?.name ||
        ""
      ).trim(),
      phone: (
        orderPayload.customerDetails?.phone ||
        existingOrder?.customerDetails?.phone ||
        existingOrder?.customer?.phone ||
        ""
      ).trim(),
      address: (
        orderPayload.customerDetails?.address ||
        existingOrder?.customerDetails?.address ||
        existingOrder?.customer?.address ||
        ""
      ).trim(),
      tin:
        orderPayload.customerDetails?.tin ||
        existingOrder?.customerDetails?.tin ||
        undefined,
    };

    const completePayload = {
      ...existingOrder,
      ...orderPayload,
      customerDetails: finalCustomerDetails,
      total:
        typeof orderPayload.total === "number"
          ? orderPayload.total
          : (existingOrder?.total ?? 0),
      paymentMethod:
        orderPayload.paymentMethod || existingOrder?.paymentMethod || undefined,
      paymentMethodName:
        orderPayload.paymentMethodName ||
        existingOrder?.paymentMethodName ||
        undefined,
      status: orderPayload.status || existingOrder?.status || "pending",
    };

    // 3. Strictly run the SchemaValidator's validation
    const validationResult = SchemaValidator.validateShippingState(
      completePayload,
      lang === "sw" ? "sw" : "en",
    );

    // 4. Client-side validation check opposing API firing if invalid
    if (!validationResult.success || !validationResult.data) {
      console.warn("[Client-Side Validation Failed]", validationResult.error);
      showAlert(
        validationResult.error ||
          (lang === "sw"
            ? "Uhakiki wa oda ulishindikana! Tafadhali hakiki taarifa za mteja."
            : "Order validation failed! Please check customer details."),
        "error",
      );
      throw new Error(
        validationResult.error || "Client-side validation failed",
      );
    }

    // 5. Fire the actual db.saveOrder call
    await db.saveOrder(completePayload);
  };

  useEffect(() => {
    if (currentSeller) {
      setVerifyFullName(currentSeller.fullName || "");
      setVerifyBusinessName(currentSeller.name || "");
      setVerifyPhone(currentSeller.phone || "");
      setVerifyLocation(currentSeller.location || "");
      setVerifyTin(currentSeller.tin || "");
      if (currentSeller.isVerifiedSeller && currentSeller.phone) {
        setPhoneVerified(true);
      } else {
        setPhoneVerified(false);
      }
    }
  }, [currentSeller]);

  // Keep track of which SYSTEM messages have been visually shown as a Toast Alert
  const notifiedSysMsgsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Check for any unread system alerts in messages
    const systemAlerts = messages.filter(
      (m) =>
        (m.phone === "SYSTEM" ||
          m.customerId === "system_alert" ||
          m.customerId === "00000000-0000-0000-0000-000000000000") &&
        !m.isRead,
    );

    if (systemAlerts.length > 0) {
      let isChanged = false;
      systemAlerts.forEach((alert) => {
        const alertId = alert.id || alert.message || "";
        if (alertId && !notifiedSysMsgsRef.current.has(alertId)) {
          notifiedSysMsgsRef.current.add(alertId);
          isChanged = true;
          // Display a gorgeous administrative toast!
          showAlert(alert.message, "success");

          // Synthesize a beautiful indicator frequency to grab admin's attention
          try {
            const audioCtx = new (
              window.AudioContext || (window as any).webkitAudioContext
            )();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch (e) {
            // Ignore browser restrictions on AudioContext
          }

          // Mark as Read in DB so it doesn't return as new
          db.saveMessage({ ...alert, isRead: true }).catch(console.error);
        }
      });

      if (isChanged) {
        setMessages((prev: Message[]) =>
          prev.map((msg) => {
            const match = systemAlerts.some((sa) => sa.id === msg.id);
            if (match) {
              return { ...msg, isRead: true };
            }
            return msg;
          }),
        );
      }
    }
  }, [messages, showAlert]);

  const refreshData = async () => {
    try {
      const pD = await db.getProducts();
      setProducts(pD || []);
    } catch (e) {
      console.warn("Failed to load products in refreshData:", e);
    }

    let oD: any[] = [];
    try {
      oD = await db.getOrders();
    } catch (e) {
      console.warn("Failed to load orders in refreshData:", e);
    }
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const processedOrders = (oD || []).map((o) => {
      if (
        [
          "delivered",
          "cancelled",
          "customer_confirmed",
          "released",
          "refunded",
        ].includes(String(o.status || "").toLowerCase()) &&
        o.date < thirtyDaysAgo
      ) {
        saveOrderWithValidation({ ...o, status: "archived" as const }, o).catch(
          console.error,
        );
        return { ...o, status: "archived" as const };
      }
      return o;
    });
    setOrders(processedOrders);

    try {
      const prs = await db.getPromotions();
      setPromos(prs || []);
    } catch (e) {
      console.warn("Failed to load promos in refreshData:", e);
    }

    try {
      const msgs = await db.getMessages();
      setMessages(msgs || []);
    } catch (e) {
      console.warn("Failed to load messages in refreshData:", e);
    }

    try {
      const custs = await db.getCustomers();
      setCustomers(custs || []);
    } catch (e) {
      console.warn("Failed to load customers in refreshData:", e);
    }

    try {
      const slls = await db.getSellers();
      setSellers(slls || []);
    } catch (e) {
      console.warn("Failed to load sellers in refreshData:", e);
    }

    try {
      const payList = await db.getPayouts();
      setPayouts(payList || []);
    } catch (e) {
      console.warn("Failed to load payouts:", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const refreshDataWithState = async () => {
      try {
        const pD = await db.getProducts();
        if (isMounted) setProducts(pD || []);
      } catch (e) {
        console.warn("Failed to load products in refreshDataWithState:", e);
      }

      try {
        const cD = await db.getCustomers();
        if (isMounted) setCustomers(cD || []);
      } catch (e) {
        console.warn("Failed to load customers in refreshDataWithState:", e);
      }

      let oD: any[] = [];
      try {
        oD = await db.getOrders();
      } catch (e) {
        console.warn("Failed to load orders in refreshDataWithState:", e);
      }

      if (isMounted && oD) {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const processedOrders = oD.map((o) => {
          if (
            [
              "delivered",
              "cancelled",
              "customer_confirmed",
              "released",
              "refunded",
            ].includes(String(o.status || "").toLowerCase()) &&
            o.date < thirtyDaysAgo
          ) {
            saveOrderWithValidation(
              { ...o, status: "archived" as const },
              o,
            ).catch(console.error);
            return { ...o, status: "archived" as const };
          }
          return o;
        });
        setOrders(processedOrders);
      }

      try {
        const mD = await db.getMessages();
        if (isMounted) setMessages(mD || []);
      } catch (e) {
        console.warn("Failed to load messages in refreshDataWithState:", e);
      }

      try {
        const prD = await db.getPromotions();
        if (isMounted) setPromos(prD || []);
      } catch (e) {
        console.warn("Failed to load promos in refreshDataWithState:", e);
      }

      try {
        const sD = await db.getSellers();
        if (isMounted) setSellers(sD || []);
      } catch (e) {
        console.warn("Failed to load sellers in refreshDataWithState:", e);
      }

      try {
        const payList = await db.getPayouts();
        if (isMounted) setPayouts(payList || []);
      } catch (e) {
        console.warn("Failed to fetch payouts in interval:", e);
      }
    };

    refreshDataWithState();

    // Replaced direct Supabase DB WebSocket with safe API-based polling
    const interval = setInterval(refreshDataWithState, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Determine current user email & registered seller profile mapping
  const [currentStaff, setCurrentStaff] = useState<any | null>(null);

  useEffect(() => {
    async function determineRole() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const emailLower = session.user.email.toLowerCase();
        setCurrentUserEmail(emailLower);

        // Check for Seller
        const matchedSeller = sellers.find(
          (s) => s.email?.toLowerCase() === emailLower,
        );
        if (matchedSeller) {
          if (matchedSeller.isApproved === false) {
            showAlert(
              lang === "sw"
                ? "Ombi lako la kuwa muuzaji bado linasubiri idhini kutoka kwa Msimamizi/Admin."
                : "Your merchant registration request is currently pending Administrator approval.",
              "error",
            );
            await supabase.auth.signOut();
            localStorage.removeItem("Orbishop_seller");
            window.location.href = "/";
            return;
          }
          setCurrentSeller(matchedSeller);
          return;
        }

        // Check for Staff explicitly from db (or stored from login redirect)
        const staffList = await db.getStaff();
        const matchedStaff = staffList.find(
          (s) => s.email?.toLowerCase() === emailLower,
        );
        if (matchedStaff) {
          setCurrentStaff(matchedStaff);
          return;
        }

        // Hardcoded root admin fallback
        if (emailLower === "admin.orbi@gmail.com") {
          setCurrentStaff({
            id: "root-admin-00",
            name: "Orbi Root Admin",
            email: emailLower,
            phone: "+255000000000",
            role: "super_admin",
            permissions: ["*"],
            status: "active",
            registeredAt: Date.now(),
          });
          return;
        }
      }
    }
    determineRole();
  }, [sellers]);

  // Load plans
  useEffect(() => {
    async function loadPlans() {
      const subPlans = await db.getSubscriptionPlans();
      setAllPlans(subPlans || []);
    }
    loadPlans();
  }, []);

  // Filter products by seller if logged in as a seller
  const displayedProducts = useMemo(() => {
    if (currentSeller) {
      return products.filter((p) => p.sellerId === currentSeller.id);
    }
    return products;
  }, [products, currentSeller]);

  // Filter orders by seller if logged in as a seller
  const displayedOrders = useMemo(() => {
    if (currentSeller) {
      return orders.filter((o) =>
        o.items.some((item) => {
          const prod = products.find((p) => p.id === item.productId);
          return prod?.sellerId === currentSeller.id;
        }),
      );
    }
    return orders;
  }, [orders, products, currentSeller]);

  // For totalSales, sum of verified item proceeds belonging to the active seller
  const totalSales = useMemo(() => {
    return displayedOrders
      .filter((o) => {
        const norm = String(o.status || "").toLowerCase();
        return [
          "confirmed",
          "shipped",
          "delivered",
          "customer_confirmed",
          "payment_held",
          "processing",
          "buyer_confirmed",
          "released",
          "disputed",
        ].includes(norm);
      })
      .reduce((acc, o) => {
        if (currentSeller) {
          const sellerItemsSum = o.items.reduce((sum, item) => {
            const prod = products.find((p) => p.id === item.productId);
            if (prod?.sellerId === currentSeller.id) {
              return sum + item.price * item.quantity;
            }
            return sum;
          }, 0);
          return acc + sellerItemsSum;
        }
        return acc + o.total;
      }, 0);
  }, [displayedOrders, products, currentSeller]);

  // Derived Analytics Data of scoped orders
  const salesByMonth = useMemo(() => {
    return displayedOrders.reduce(
      (acc, order) => {
        const norm = String(order.status || "").toLowerCase();
        const isValid = [
          "confirmed",
          "payment_held",
          "processing",
          "released",
          "buyer_confirmed",
          "shipped",
          "delivered",
        ].includes(norm);
        if (isValid) {
          const month = new Date(order.date).toLocaleString("default", {
            month: "short",
          });
          if (currentSeller) {
            const sellerItemsSum = order.items.reduce((sum, item) => {
              const prod = products.find((p) => p.id === item.productId);
              if (prod?.sellerId === currentSeller.id) {
                return sum + item.price * item.quantity;
              }
              return sum;
            }, 0);
            acc[month] = (acc[month] || 0) + sellerItemsSum;
          } else {
            acc[month] = (acc[month] || 0) + order.total;
          }
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [displayedOrders, products, currentSeller]);

  const salesData = useMemo(() => {
    return Object.keys(salesByMonth).map((month) => ({
      name: month,
      sales: salesByMonth[month],
    }));
  }, [salesByMonth]);

  // Pending Payouts Sum
  const pendingPayoutsSum = useMemo(() => {
    return payouts
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [payouts]);

  // Total Revenue This Month
  const totalRevenueThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return displayedOrders
      .filter((o) => {
        const norm = String(o.status || "").toLowerCase();
        if (norm === "cancelled" || norm === "archived") return false;
        const isVerified = [
          "confirmed",
          "customer_confirmed",
          "shipped",
          "delivered",
          "payment_held",
          "processing",
          "buyer_confirmed",
          "released",
        ].includes(norm);
        if (!isVerified) return false;

        const d = new Date(o.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, o) => {
        if (currentSeller) {
          const sellerItemsSum = o.items.reduce((sum, item) => {
            const prod = products.find((p) => p.id === item.productId);
            if (prod?.sellerId === currentSeller.id) {
              return sum + item.price * item.quantity;
            }
            return sum;
          }, 0);
          return acc + sellerItemsSum;
        }
        return acc + o.total;
      }, 0);
  }, [displayedOrders, products, currentSeller]);

  // Active Customers Count (not frozen or deleted)
  const activeCustomersCount = useMemo(() => {
    return customers.filter((c) => c.status !== "frozen" && !c.deleteRequested)
      .length;
  }, [customers]);

  const customersByMonth = customers.reduce(
    (acc, customer) => {
      const month = new Date(customer.registeredAt).toLocaleString("default", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const customerData = Object.keys(customersByMonth).map((month) => ({
    name: month,
    customers: customersByMonth[month],
  }));

  // Enhanced Analytics: Peak Hourly Trends
  const hourlyTrendsData = useMemo(() => {
    const hoursMap: { [hour: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      hoursMap[i] = 0;
    }

    orders.forEach((o) => {
      const date = new Date(o.date);
      const h = date.getHours();
      hoursMap[h] = (hoursMap[h] || 0) + 1;
    });

    return Object.keys(hoursMap).map((h) => {
      const hourNum = Number(h);
      const period = hourNum >= 12 ? "PM" : "AM";
      const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
      return {
        name: `${displayHour} ${period}`,
        ordersCount: hoursMap[hourNum],
      };
    });
  }, [orders]);

  // Enhanced Analytics: Inventory Category & Niche Revenue performance
  const categoryPerformanceData = useMemo(() => {
    const performance: { [nicheId: string]: number } = {};
    orders.forEach((o) => {
      if (o.status !== "cancelled") {
        o.items.forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          if (prod && prod.nicheId) {
            const nicheName = prod.nicheId;
            performance[nicheName] =
              (performance[nicheName] || 0) + item.price * item.quantity;
          } else {
            performance["Mengineyo"] =
              (performance["Mengineyo"] || 0) + item.price * item.quantity;
          }
        });
      }
    });

    return Object.keys(performance)
      .map((nicheId) => {
        // Human-readable labels
        let displayLabel = nicheId;
        if (nicheId === "electronics")
          displayLabel = lang === "sw" ? "Meme" : "Meme (Electronics)";
        else if (nicheId === "nyumbani")
          displayLabel = lang === "sw" ? "Vyombo na Nyumba" : "Home & Living";
        else if (
          nicheId === "fashion" ||
          nicheId === "kike" ||
          nicheId === "kiume"
        )
          displayLabel = lang === "sw" ? "Mavazi" : "Apparel & Fashion";
        else if (nicheId === "afya")
          displayLabel = lang === "sw" ? "Afya na Urembo" : "Health & Beauty";

        return {
          name: displayLabel.toUpperCase(),
          revenue: performance[nicheId],
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders, products, lang]);

  const adminUnreadCount = useMemo(() => {
    return messages.filter((m) => {
      const isAdminInitiated =
        m.message === "Ujumbe kutoka Orbi Shop" ||
        m.message === "Admin initiated dummy" ||
        m.message === "Ujumbe toka kwa Admin" ||
        m.message === "Ujumbe toka kwa Orbi Shop";
      return !isAdminInitiated && !m.isRead;
    }).length;
  }, [messages]);

  const sellersNotificationCount = useMemo(() => {
    return (messages || [])
      .filter((msg) => msg.message && msg.message.includes("Maombi ya Kuwa Muuzaji"))
      .filter((msg) => {
        let email = "";
        const lines = msg.message.split("\n");
        lines.forEach((line) => {
          if (line.toLowerCase().includes("barua pepe:")) {
            email = line.split(/barua pepe:/i)[1]?.trim() || "";
          }
        });
        const lowerEmail = email.toLowerCase().trim();
        if (!lowerEmail || lowerEmail === "n/a" || !lowerEmail.includes("@")) {
          return true;
        }
        const isAlreadySeller = sellers?.some(
          (s) => s.email?.toLowerCase().trim() === lowerEmail
        );
        return !isAlreadySeller;
      }).length;
  }, [messages, sellers]);

  const topSellingProducts = useMemo(() => {
    const counts = orders.reduce(
      (acc, order) => {
        if (order.status === "confirmed") {
          order.items.forEach((item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
          });
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return products
      .map((p) => ({ ...p, sales: counts[p.id] || 0 }))
      .filter((p) => p.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders, products]);

  const handleProcessUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeller || !selectedUpgradePlanId) return;

    setIsSubscribing(true);
    try {
      const response = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: currentSeller.id,
          planId: selectedUpgradePlanId,
          paymentDetails: {
            phone: upgradePhoneNumber,
            reference: upgradeReference,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        showAlert(
          lang === "sw"
            ? `Hongera! Umefanikiwa kujiunga na mpango wa PRO! (Kumbukumbu ya Malipo: ${result.transactionId})`
            : `Success! You have upgraded to PRO subscription! (TXID: ${result.transactionId})`,
          "success",
        );
        setShowUpgradeModal(false);
        // Refresh sellers
        const updatedSellers = await db.getSellers();
        setSellers(updatedSellers);
      } else {
        showAlert(result.message || "Failed to subscribe", "error");
      }
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || "Network error", "error");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleForcePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 6) {
      showAlert(
        lang === "sw"
          ? "Nenosiri lazima liwe na herufi angalau 6."
          : "Password must be at least 6 characters.",
        "error",
      );
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      showAlert(
        lang === "sw"
          ? "Nenosiri jipya hazilingani!"
          : "New passwords do not match!",
        "error",
      );
      return;
    }

    try {
      setSavingNewPassword(true);
      // Update this seller status in local sellers roster lists
      const updatedSellers = sellers.map((s) => {
        if (s.id === currentSeller?.id) {
          return {
            ...s,
            password: newPassword.trim(),
            mustChangePassword: false,
          };
        }
        return s;
      });

      setSellers(updatedSellers);
      await db.saveSellers(updatedSellers);

      // Also update local storage session
      const updatedSellerObj = {
        ...currentSeller,
        password: newPassword.trim(),
        mustChangePassword: false,
      };
      localStorage.setItem("Orbishop_seller", JSON.stringify(updatedSellerObj));
      setCurrentSeller(updatedSellerObj as SellerProfile);

      showAlert(
        lang === "sw"
          ? "Nenosiri limebadilishwa kwa mafanikio! Karibu kwenye dashibodi yako."
          : "Password changed successfully! Welcome to your merchant dashboard.",
        "success",
      );
    } catch (err: any) {
      showAlert(err.message || "Failed to save new password", "error");
    } finally {
      setSavingNewPassword(false);
    }
  };

  const handleSendSimulatedOtp = async () => {
    if (!verifyPhone || verifyPhone.trim().length < 8) {
      showAlert(
        lang === "sw"
          ? "Tafadhali weka nambari sahihi ya simu kwanza."
          : "Please enter a valid phone number first.",
        "error",
      );
      return;
    }

    try {
      setIsVerifyingPhoneState(true);
      const res = await fetch("/api/talk/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: verifyPhone.trim(),
          email: currentSeller?.email || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to initiate OTP check");
      }

      setOtpSentMessage(true);

      if (data.simulated && data.debugCode) {
        setSimulatedOtp(data.debugCode);
        showAlert(
          lang === "sw"
            ? `[MSIMBO WA SIMU ORBI (SIMULATED)] Nenosiri la mara moja ni: ${data.debugCode}. Tumetuma msimbo huu kwa nambari yako ya simu na barua pepe.`
            : `[ORBI OTP SERVICE (SIMULATED)] Your security verification code is: ${data.debugCode} (Sent to ${verifyPhone} & email).`,
          "success",
        );
      } else {
        const hasEmail = data.emailSent;
        showAlert(
          lang === "sw"
            ? `Nenosiri la mara moja (OTP) limetumwa kwenda kwa ${verifyPhone}${hasEmail ? " na barua pepe yako." : "."}`
            : `One-time password (OTP) was successfully sent to ${verifyPhone}${hasEmail ? " and your email address." : "."}`,
          "success",
        );
      }
    } catch (err: any) {
      showAlert(err.message || "Failed to dispatch verification code", "error");
    } finally {
      setIsVerifyingPhoneState(false);
    }
  };

  const handleVerifyEnteredOtp = async () => {
    if (!enteredOtp || enteredOtp.trim().length === 0) {
      showAlert(
        lang === "sw"
          ? "Tafadhali weka msimbo wa OTP kwanza."
          : "Please enter the OTP code first.",
        "error",
      );
      return;
    }

    try {
      const res = await fetch("/api/talk/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: verifyPhone.trim(),
          code: enteredOtp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "The code you entered is incorrect.");
      }

      setPhoneVerified(true);
      showAlert(
        lang === "sw"
          ? "Nambari yako ya simu imehakikiwa kwa ufanisi dhabiti!"
          : "Your phone number has been verified successfully!",
        "success",
      );
    } catch (err: any) {
      showAlert(err.message || "Failed to verify code", "error");
    }
  };

  const handleSaveSecurityVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verifyFullName.trim()) {
      showAlert(
        lang === "sw"
          ? "Jina Kamili la Muuzaji linahitajika!"
          : "Full seller name is required!",
        "error",
      );
      return;
    }
    if (!verifyBusinessName.trim()) {
      showAlert(
        lang === "sw"
          ? "Jina la Biashara linahitajika!"
          : "Business name is required!",
        "error",
      );
      return;
    }
    if (!verifyLocation.trim()) {
      showAlert(
        lang === "sw"
          ? "Mahali pa duka/biashara panahitajika!"
          : "Store location is required!",
        "error",
      );
      return;
    }
    const tinClean = verifyTin.replace(/\D/g, "");
    if (tinClean.length !== 9) {
      showAlert(
        lang === "sw"
          ? "TIN (Nambari ya Mlipakodi) lazima iwe na tarakimu 9 za namba tu (Mfano: 123456789)."
          : "TIN must be exactly a 9-digit number (e.g. 123456789).",
        "error",
      );
      return;
    }
    if (!phoneVerified) {
      showAlert(
        lang === "sw"
          ? "Sera ya usalama ya Orbi inahitaji uhakiki wa nambari ya simu kupitia OTP kwanza!"
          : "Orbi security policy requires phone number OTP verification first!",
        "error",
      );
      return;
    }

    try {
      setSavingVerification(true);
      const updatedSellers = sellers.map((s) => {
        if (s.id === currentSeller?.id) {
          return {
            ...s,
            fullName: verifyFullName.trim(),
            name: verifyBusinessName.trim(),
            phone: verifyPhone.trim(),
            location: verifyLocation.trim(),
            tin: tinClean,
            isVerifiedSeller: true,
          };
        }
        return s;
      });

      setSellers(updatedSellers);
      await db.saveSellers(updatedSellers);

      const updatedSellerObj = {
        ...currentSeller,
        fullName: verifyFullName.trim(),
        name: verifyBusinessName.trim(),
        phone: verifyPhone.trim(),
        location: verifyLocation.trim(),
        tin: tinClean,
        isVerifiedSeller: true,
      };

      localStorage.setItem("Orbishop_seller", JSON.stringify(updatedSellerObj));
      setCurrentSeller(updatedSellerObj as SellerProfile);

      showAlert(
        lang === "sw"
          ? "Taarifa za biashara zimehifadhiwa kulingana na sera ya salama ya Orbi!"
          : "Business information successfully verified adhering to Orbi security guidelines!",
        "success",
      );
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || "Failed to save security verification", "error");
    } finally {
      setSavingVerification(false);
    }
  };

  if (currentSeller) {
    if (currentSeller.mustChangePassword) {
      return (
        <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="bg-emerald-50 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-display font-black text-slate-800 tracking-tight">
                {lang === "sw"
                  ? "Fanya Nenosiri Lako Kuwa Salama"
                  : "Secure Your Account"}
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {lang === "sw"
                  ? "Ili kulinda akaunti yako ya muuzaji, tafadhali badilisha nenosiri la muda lililotolewa na msimamizi kabla ya kuendelea kwenye dashibodi."
                  : "To guarantee your store's security, you must update the temporary login password provided by the administrator before continuing."}
              </p>
            </div>

            <form onSubmit={handleForcePasswordSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  {lang === "sw" ? "Nenosiri Jipya" : "New Password"}
                </label>
                <input
                  required
                  type="password"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 p-3.5 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  {lang === "sw"
                    ? "Thibitisha Nenosiri Jipya"
                    : "Confirm New Password"}
                </label>
                <input
                  required
                  type="password"
                  placeholder="••••••"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full border border-slate-300 p-3.5 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={savingNewPassword}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 mt-6 text-xs uppercase tracking-wider cursor-pointer"
              >
                {savingNewPassword
                  ? lang === "sw"
                    ? "Inahifadhi..."
                    : "Saving..."
                  : lang === "sw"
                    ? "Hifadhi & Ingia Dashibodi"
                    : "Update Password & Continue"}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 font-bold py-3 rounded-xl transition text-xs uppercase cursor-pointer"
              >
                {lang === "sw" ? "Ondoka kwenye akaunti" : "Cancel & Logout"}
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (!currentSeller.isVerifiedSeller) {
      let completionScore = 0;
      if (verifyFullName.trim()) completionScore += 20;
      if (verifyBusinessName.trim()) completionScore += 20;
      if (verifyLocation.trim()) completionScore += 20;
      if (verifyTin.replace(/\D/g, "").length === 9) completionScore += 20;
      if (phoneVerified) completionScore += 20;

      return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-2xl border border-slate-150 overflow-hidden animate-in fade-in duration-200">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
              <div className="absolute right-6 top-6 opacity-10">
                <ShieldCheck size={120} />
              </div>
              <div className="flex items-center gap-3.5 mb-2">
                <span className="bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {lang === "sw"
                    ? "Sera ya Usalama ya Orbi"
                    : "Orbi Security Alliance"}
                </span>
                <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {lang === "sw" ? "Inahitajika" : "MANDATORY"}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight">
                {lang === "sw"
                  ? "Uhakiki wa Taarifa za Biashara"
                  : "Merchant Business Verification"}
              </h2>
              <p className="text-emerald-100 text-xs mt-1.5 max-w-lg leading-relaxed font-bold">
                {lang === "sw"
                  ? "Kulingana na sera ya usalama ya Orbi, wauzaji wote wanapaswa kuhakiki taarifa zao za biashara kabla ya kufikia dashibodi ya duka lao."
                  : "To fulfill Orbi trust and compliance standards, please complete your merchant profile with verified contact details, business location, and tax registers."}
              </p>
            </div>

            {/* Completion Indicator */}
            <div className="px-8 pt-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5 flex-row">
                <span>
                  {lang === "sw"
                    ? "Uhakiki Kukamilika:"
                    : "Verification Score:"}
                </span>
                <span
                  className={
                    completionScore === 100
                      ? "text-emerald-600"
                      : "text-amber-500"
                  }
                >
                  {completionScore}%{" "}
                  {completionScore === 100
                    ? lang === "sw"
                      ? "(Imekamilika)"
                      : "- Compliant ✅"
                    : ""}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
            </div>

            <form
              onSubmit={handleSaveSecurityVerification}
              className="p-8 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Seller Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    {lang === "sw"
                      ? "Jina Kamili la Muuzaji"
                      : "Full Seller Name"}
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={verifyFullName}
                      onChange={(e) => setVerifyFullName(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 p-3.5 pl-10 rounded-xl outline-none font-medium text-sm transition bg-slate-50/50"
                      placeholder="e.g. Salim Said Hamad"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                </div>

                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    {lang === "sw"
                      ? "Jina la Duka / Biashara"
                      : "Official Business Name"}
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={verifyBusinessName}
                      onChange={(e) => setVerifyBusinessName(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 p-3.5 pl-10 rounded-xl outline-none font-medium text-sm transition bg-slate-50/50"
                      placeholder="e.g. Kariakoo Electronics"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Store size={18} />
                    </div>
                  </div>
                </div>

                {/* Business Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    {lang === "sw"
                      ? "Mahali pa Biashara / Duka"
                      : "Business Location"}
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={verifyLocation}
                      onChange={(e) => setVerifyLocation(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 p-3.5 pl-10 rounded-xl outline-none font-medium text-sm transition bg-slate-50/50"
                      placeholder="e.g. Mtaa wa Msimbazi, Dar es Salaam"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      📍
                    </div>
                  </div>
                </div>

                {/* TIN Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>TIN (Namba ya Mlipakodi)</span>
                    <span className="text-[10px] text-slate-450 font-bold lowercase">
                      exactly 9 digits
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      maxLength={11}
                      value={verifyTin}
                      onChange={(e) => setVerifyTin(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 p-3.5 pl-10 rounded-xl outline-none font-mono text-sm transition bg-slate-50/50"
                      placeholder="e.g. 123456789"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <FileText size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Phone Section */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-start justify-between flex-row">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Smartphone size={18} className="text-emerald-600" />
                      {lang === "sw"
                        ? "Uhakiki wa Nambari ya Simu"
                        : "Phone Verification Engine"}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      {lang === "sw"
                        ? "Tunatuma nenosiri la mara moja (OTP) kuhakikisha nambari hii ni yako na inaweza kupokea malipo."
                        : "Required step to protect your shop registry and ensure reliable cashouts."}
                    </p>
                  </div>
                  {phoneVerified && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Check size={12} strokeWidth={3} />
                      {lang === "sw" ? "Imethibitishwa" : "Verified"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      disabled={phoneVerified}
                      type="tel"
                      value={verifyPhone}
                      onChange={(e) => setVerifyPhone(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 p-3.5 pl-10 rounded-xl outline-none font-bold text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      placeholder="e.g. +255 712 345 678"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={16} />
                    </div>
                  </div>

                  {!phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendSimulatedOtp}
                      className="whitespace-nowrap bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-3.5 rounded-xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap size={14} />
                      {lang === "sw" ? "Tuma OTP" : "Send OTP"}
                    </button>
                  )}
                </div>

                {/* OTP Input display once sent */}
                {!phoneVerified && otpSentMessage && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between flex-row">
                      <label className="block text-xs font-black text-slate-700 uppercase">
                        {lang === "sw"
                          ? "Weka Msimbo wa OTP"
                          : "Enter Verification OTP"}
                      </label>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                        {lang === "sw" ? "Msimbo umetumwa" : "OTP simulated!"}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="flex-1 border border-slate-250 focus:border-emerald-500 p-3 rounded-xl outline-none font-mono text-center tracking-[0.25em] text-lg font-bold bg-slate-50"
                        placeholder="••••"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEnteredOtp}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-xl transition text-xs uppercase cursor-pointer"
                      >
                        {lang === "sw" ? "Thibitisha" : "Confirm Code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 border border-slate-250 hover:bg-slate-50 text-slate-500 font-bold py-4 rounded-xl transition text-xs uppercase cursor-pointer text-center"
                >
                  {lang === "sw" ? "Ondoka" : "Cancel & Logout"}
                </button>
                <button
                  type="submit"
                  disabled={savingVerification}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer font-bold"
                >
                  {savingVerification
                    ? lang === "sw"
                      ? "Inahifadhi..."
                      : "Verifying & Saving..."
                    : lang === "sw"
                      ? "Kamilisha Usajili"
                      : "Submit & Verify Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        </div>
      }>
        <SellerApp
          seller={currentSeller}
          products={products}
          orders={orders}
          onLogout={onLogout}
          lang={lang}
          setLang={setLang}
          onRefreshData={refreshData}
        />
      </Suspense>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-50 font-sans text-primary flex flex-col md:flex-row overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row w-full h-full">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0 flex flex-col items-stretch">
          {/* DESKTOP/TABLET SIDEBAR HEADER */}
          <div className="hidden md:flex p-6 border-b border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-display font-black tracking-tight text-slate-900">
                  {t(lang, "sidebar.title")}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                  {t(lang, "sidebar.desc")}
                </div>
              </div>
              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                className="hover:scale-110 transition bg-white shadow-sm border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold cursor-pointer"
                title={
                  lang === "sw"
                    ? "Switch to English"
                    : "Badili kwenda Kiswahili"
                }
              >
                {lang === "sw" ? <TanzaniaFlag /> : <UKFlag />}
              </button>
            </div>
            {currentStaff && (
              <div className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm text-center">
                Staff: {currentStaff.role}
              </div>
            )}
          </div>

          {/* MOBILE SLIM HEADER */}
          <div className="flex md:hidden px-4 py-2.5 border-b border-slate-200 items-center justify-between bg-white w-full shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight text-slate-900 leading-none">
                {t(lang, "sidebar.title")}
              </span>
              {currentStaff && (
                <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider mt-0.5 w-max">
                  {currentStaff.role.replace("_", " ")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                className="hover:scale-105 active:scale-95 transition bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold"
              >
                {lang === "sw" ? "EN" : "SW"}
              </button>

              <a
                href="/"
                className="text-slate-500 hover:text-slate-800 bg-slate-50 p-1.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0"
              >
                <Store size={13} />
              </a>

              <button
                onClick={onLogout}
                className="text-rose-600 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-100/70 flex items-center justify-center shrink-0"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* DESKTOP/TABLET VERTICAL NAVIGATION */}
          <nav className="hidden md:flex p-4 flex-col gap-1 text-[13px] font-bold uppercase tracking-widest flex-1 overflow-y-auto">
            {currentSeller && (
              <div className="mx-2 my-2 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 text-center relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-12 h-12 bg-orange-400 opacity-5 rounded-full translate-x-4 -translate-y-4"></div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-[10px] font-black text-orange-800 uppercase tracking-wider">
                    {currentSeller.isPro &&
                    currentSeller.proUntil &&
                    currentSeller.proUntil > Date.now()
                      ? lang === "sw"
                        ? "UANACHAMA: PRO"
                        : "MEMBERSHIP: PRO"
                      : lang === "sw"
                        ? "UANACHAMA: BASIC"
                        : "MEMBERSHIP: FREE"}
                  </span>
                  <span className="bg-orange-500 text-white text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded shadow-sm">
                    {currentSeller.isPro &&
                    currentSeller.proUntil &&
                    currentSeller.proUntil > Date.now()
                      ? "PRO"
                      : "Basic"}
                  </span>
                </div>
                {currentSeller.isPro &&
                currentSeller.proUntil &&
                currentSeller.proUntil > Date.now() ? (
                  <div className="text-[10px] text-slate-500 font-bold leading-tight mb-2">
                    {lang === "sw"
                      ? `${Math.ceil((currentSeller.proUntil - Date.now()) / (1000 * 60 * 60 * 24))} siku zilizobaki`
                      : `${Math.ceil((currentSeller.proUntil - Date.now()) / (1000 * 60 * 60 * 24))} days left`}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-bold leading-tight mb-2">
                    {lang === "sw"
                      ? "Jiunge sasa kuongeza mauzo duka lako"
                      : "Renew or upgrade to earn trust badge"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUpgradePlanId(
                      allPlans.filter((p) => p.active)?.[0]?.id || "",
                    );
                    setShowUpgradeModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-1.5 rounded-xl text-[10px] font-black hover:opacity-90 shadow-sm transition uppercase cursor-pointer"
                >
                  {currentSeller.isPro &&
                  currentSeller.proUntil &&
                  currentSeller.proUntil > Date.now()
                    ? lang === "sw"
                      ? "Ongeza Muda"
                      : "Renew Plan"
                    : lang === "sw"
                      ? "Jiunge na PRO"
                      : "Upgrade now"}
                </button>
                <a
                  href={`/?seller=${currentSeller.id}`}
                  className="mt-2 block w-full bg-slate-900 text-white py-1.5 rounded-xl text-[10px] font-black hover:opacity-90 shadow-sm transition uppercase cursor-pointer"
                >
                  {lang === "sw" ? "Tembelea Duka Lako" : "View Your Store"}
                </a>
              </div>
            )}

            {(currentSeller
              ? [
                  {
                    id: "dashboard",
                    label: t(lang, "sidebar.dashboard"),
                    icon: LayoutDashboard,
                  },
                  {
                    id: "products",
                    label: lang === "sw" ? "Bidhaa Zangu" : "My Products",
                    icon: Package,
                  },
                  {
                    id: "orders",
                    label: lang === "sw" ? "Oda Zangu" : "My Orders",
                    icon: ShoppingCart,
                  },
                  {
                    id: "seller_settings",
                    label: lang === "sw" ? "Mipangilio Yangu" : "My Settings",
                    icon: SettingsIcon,
                  },
                ]
              : currentStaff && currentStaff.role !== "super_admin"
                ? (() => {
                    const role = currentStaff.role;
                    if (role === "human_resources")
                      return [
                        {
                          id: "dashboard",
                          label: t(lang, "sidebar.dashboard"),
                          icon: LayoutDashboard,
                        },
                        { id: "staff", label: "Staff", icon: Users },
                      ];
                    if (role === "accountant")
                      return [
                        {
                          id: "dashboard",
                          label: t(lang, "sidebar.dashboard"),
                          icon: LayoutDashboard,
                        },
                        {
                          id: "orders",
                          label: t(lang, "sidebar.orders"),
                          icon: ShoppingCart,
                        },
                        { id: "payouts", label: "Payouts", icon: DollarSign },
                        { id: "finances", label: "Finances", icon: DollarSign },
                      ];
                    if (role === "support")
                      return [
                        {
                          id: "dashboard",
                          label: t(lang, "sidebar.dashboard"),
                          icon: LayoutDashboard,
                        },
                        {
                          id: "messages",
                          label: t(lang, "sidebar.messages"),
                          icon: MessageSquare,
                          badge: adminUnreadCount,
                        },
                        {
                          id: "customers",
                          label: t(lang, "sidebar.customers"),
                          icon: Users,
                        },
                        {
                          id: "orders",
                          label: t(lang, "sidebar.orders"),
                          icon: ShoppingCart,
                        },
                      ];
                    // Default worker
                    return [
                      {
                        id: "dashboard",
                        label: t(lang, "sidebar.dashboard"),
                        icon: LayoutDashboard,
                      },
                      {
                        id: "products",
                        label: t(lang, "sidebar.products"),
                        icon: Package,
                      },
                      {
                        id: "orders",
                        label: t(lang, "sidebar.orders"),
                        icon: ShoppingCart,
                      },
                    ];
                  })()
                : [
                    {
                      id: "dashboard",
                      label: t(lang, "sidebar.dashboard"),
                      icon: LayoutDashboard,
                    },
                    {
                      id: "finances",
                      label: "Finances / PaySafe",
                      icon: DollarSign,
                    },
                    {
                      id: "products",
                      label: t(lang, "sidebar.products"),
                      icon: Package,
                    },
                    {
                      id: "orders",
                      label: t(lang, "sidebar.orders"),
                      icon: ShoppingCart,
                    },
                    {
                      id: "promos",
                      label: t(lang, "sidebar.promos"),
                      icon: Tag,
                    },
                    {
                      id: "campaigns",
                      label: t(lang, "sidebar.campaigns"),
                      icon: Megaphone,
                    },
                    {
                      id: "coupons",
                      label: lang === "sw" ? "Kuponi" : "Coupons",
                      icon: Ticket,
                    },
                    {
                      id: "ads",
                      label:
                        lang === "sw" ? "Soko la Matangazo" : "Ad Marketplace",
                      icon: Megaphone,
                    },
                    {
                      id: "sellers",
                      label: lang === "sw" ? "Wauzaji" : "Sellers",
                      icon: Store,
                      badge: sellersNotificationCount,
                    },
                    { id: "staff", label: "Staff", icon: Users },
                    { id: "payouts", label: "Payouts", icon: DollarSign },
                    { id: "notifications", label: "Notifications", icon: Bell },
                    {
                      id: "ai-pilot",
                      label:
                        lang === "sw"
                          ? "Msaidizi wa AI/Bot"
                          : "AI/Bot Pilot Engine",
                      icon: Bot,
                    },
                    {
                      id: "visitors-analytics",
                      label:
                        lang === "sw"
                          ? "Uchambuzi wa Visitors"
                          : "Visitors Analytics Engine",
                      icon: Activity,
                    },
                    { id: "talk-logs", label: "Orbi Talk", icon: History },
                    {
                      id: "payment-logs",
                      label:
                        lang === "sw"
                          ? "Kumbukumbu za Malipo"
                          : "Payment Ledger Logs",
                      icon: ShieldCheck,
                    },
                    {
                      id: "messages",
                      label: t(lang, "sidebar.messages"),
                      icon: MessageSquare,
                      badge: adminUnreadCount,
                    },
                    {
                      id: "customers",
                      label: t(lang, "sidebar.customers"),
                      icon: Users,
                    },
                    {
                      id: "settings",
                      label: t(lang, "sidebar.settings"),
                      icon: SettingsIcon,
                    },
                  ]
            ).map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id as any)}
                className={`flex items-center justify-between text-left px-4 py-3 rounded-xl whitespace-nowrap transition cursor-pointer select-none ${tab === tabItem.id ? "bg-primary text-white shadow-sm font-bold" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
              >
                <div className="flex items-center gap-3">
                  <tabItem.icon size={18} />
                  <span>{tabItem.label}</span>
                </div>
                {tabItem.badge && tabItem.badge > 0 ? (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${tab === tabItem.id ? "bg-white text-primary" : "bg-red-500 text-white animate-pulse"}`}
                  >
                    {tabItem.badge}
                  </span>
                ) : null}
              </button>
            ))}
            <div className="mt-auto pt-8 flex flex-col gap-2">
              <button
                onClick={onLogout}
                className="flex items-center gap-3 text-red-500 px-4 py-3 hover:bg-red-50 rounded-xl w-full text-left transition cursor-pointer"
              >
                <LogOut size={18} /> {t(lang, "sidebar.logout")}
              </button>
              <a
                href="/"
                className="flex items-center gap-3 text-slate-500 px-4 py-3 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition cursor-pointer"
              >
                <Store size={18} /> {t(lang, "sidebar.store")}
              </a>
            </div>
          </nav>

          {/* MOBILE HORIZONTAL ICON STRIP NAVIGATION */}
          <div className="flex md:hidden bg-slate-50/90 py-1.5 px-2 overflow-x-auto scrollbar-none border-b border-slate-200/60 gap-1.5 w-full items-center select-none sticky top-[48px] z-20 backdrop-blur-md">
            {(currentSeller
              ? [
                  {
                    id: "dashboard",
                    label: t(lang, "sidebar.dashboard"),
                    icon: LayoutDashboard,
                  },
                  {
                    id: "products",
                    label: lang === "sw" ? "Bidhaa" : "Products",
                    icon: Package,
                  },
                  {
                    id: "orders",
                    label: lang === "sw" ? "Oda" : "Orders",
                    icon: ShoppingCart,
                  },
                  {
                    id: "seller_settings",
                    label: lang === "sw" ? "Mipangilio" : "Settings",
                    icon: SettingsIcon,
                  },
                ]
              : currentStaff && currentStaff.role !== "super_admin"
                ? (() => {
                    const role = currentStaff.role;
                    if (role === "human_resources")
                      return [
                        {
                          id: "dashboard",
                          label: "Dash",
                          icon: LayoutDashboard,
                        },
                        { id: "staff", label: "Staff", icon: Users },
                      ];
                    if (role === "accountant")
                      return [
                        {
                          id: "dashboard",
                          label: "Dash",
                          icon: LayoutDashboard,
                        },
                        { id: "orders", label: "Oda", icon: ShoppingCart },
                        { id: "payouts", label: "Pay", icon: DollarSign },
                        { id: "finances", label: "Cash", icon: DollarSign },
                      ];
                    if (role === "support")
                      return [
                        {
                          id: "dashboard",
                          label: "Dash",
                          icon: LayoutDashboard,
                        },
                        {
                          id: "messages",
                          label: "Chats",
                          icon: MessageSquare,
                          badge: adminUnreadCount,
                        },
                        { id: "customers", label: "Clients", icon: Users },
                        { id: "orders", label: "Oda", icon: ShoppingCart },
                      ];
                    return [
                      { id: "dashboard", label: "Dash", icon: LayoutDashboard },
                      { id: "products", label: "Catalog", icon: Package },
                      { id: "orders", label: "Oda", icon: ShoppingCart },
                    ];
                  })()
                : [
                    { id: "dashboard", label: "Dash", icon: LayoutDashboard },
                    { id: "orders", label: "Oda", icon: ShoppingCart },
                    { id: "products", label: "Bidhaa", icon: Package },
                    { id: "finances", label: "Hesabu", icon: DollarSign },
                    {
                      id: "messages",
                      label: "Chats",
                      icon: MessageSquare,
                      badge: adminUnreadCount,
                    },
                    { id: "promos", label: "Soko", icon: Tag },
                    { id: "campaigns", label: "Kampeni", icon: Megaphone },
                    { id: "coupons", label: "Coupon", icon: Ticket },
                    { id: "ads", label: "Ads", icon: Megaphone },
                    { id: "sellers", label: "Wauzaji", icon: Store, badge: sellersNotificationCount },
                    { id: "staff", label: "Staff", icon: Users },
                    { id: "payouts", label: "Payouts", icon: DollarSign },
                    { id: "notifications", label: "Noti", icon: Bell },
                    { id: "ai-pilot", label: "AI Bot", icon: Bot },
                    {
                      id: "visitors-analytics",
                      label: "Wageni",
                      icon: Activity,
                    },
                    { id: "talk-logs", label: "Talk", icon: History },
                    { id: "payment-logs", label: "Leja", icon: ShieldCheck },
                    { id: "customers", label: "Clients", icon: Users },
                    { id: "settings", label: "Seti", icon: SettingsIcon },
                  ]
            ).map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id as any)}
                className={`flex flex-col items-center justify-center min-w-[62px] max-w-[80px] px-2.5 py-2.5 rounded-2xl transition-all duration-150 cursor-pointer shrink-0 ${
                  tab === tabItem.id
                    ? "bg-primary text-white shadow-sm font-black scale-[1.03]"
                    : "bg-white text-slate-500 border border-slate-200/50 hover:bg-slate-55"
                }`}
              >
                <div className="relative leading-none">
                  <tabItem.icon
                    size={15}
                    className={
                      tab === tabItem.id ? "text-white" : "text-slate-400"
                    }
                  />
                  {tabItem.badge && tabItem.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[8px] px-1 py-0.2 rounded-full leading-none animate-pulse">
                      {tabItem.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[9px] font-bold mt-1 text-center truncate w-full block leading-none">
                  {getShortLabel(tabItem.id, lang)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 p-6 sm:p-8 md:p-10 flex flex-col gap-6 items-center bg-white ${tab === "messages" ? "overflow-hidden h-full min-h-0" : "overflow-auto"}`}
        >
          <div className="w-full max-w-7xl flex flex-col flex-1 h-full min-h-0">
            {tab === "dashboard" && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="bg-white border-b border-slate-200 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-display font-black tracking-tight text-slate-800">
                      {t(lang, "dash.title")}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {t(lang, "dash.desc")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 lg:gap-5">
                  <StatCard
                    onClick={() => setTab("products")}
                    title={t(lang, "dash.tot_prod")}
                    value={products.length}
                    icon={<ShoppingBag size={20} className="text-blue-500" />}
                  />
                  <StatCard
                    onClick={() => setTab("customers")}
                    title={t(lang, "dash.new_cust")}
                    value={customers.length}
                    icon={<Users size={20} className="text-purple-500" />}
                  />
                  <StatCard
                    onClick={() => setTab("orders")}
                    title={t(lang, "dash.tot_ord")}
                    value={orders.length}
                    icon={<TrendingUp size={20} className="text-amber-500" />}
                  />
                  <StatCard
                    onClick={() => setTab("invoice")}
                    title={t(lang, "dash.tot_sales")}
                    value={<PriceDisplay amount={totalSales} />}
                    icon={<DollarSign size={20} className="text-emerald-500" />}
                  />
                  <StatCard
                    onClick={() => setTab("payouts")}
                    title={
                      lang === "sw" ? "Malipo Kusubiri" : "Pending Payouts"
                    }
                    value={<PriceDisplay amount={pendingPayoutsSum} />}
                    icon={<Wallet size={20} className="text-indigo-500" />}
                  />
                  <StatCard
                    onClick={() => setTab("finances")}
                    title={
                      lang === "sw"
                        ? "Mauzo ya Mwezi Huu"
                        : "Revenue This Month"
                    }
                    value={<PriceDisplay amount={totalRevenueThisMonth} />}
                    icon={<Calendar size={20} className="text-pink-500" />}
                  />
                  <StatCard
                    onClick={() => setTab("customers")}
                    title={
                      lang === "sw" ? "Wateja Amilifu" : "Active Customers"
                    }
                    value={activeCustomersCount}
                    icon={<Users size={20} className="text-cyan-500" />}
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={() => setTab("products")}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 transition"
                  >
                    <Plus size={16} /> {t(lang, "dash.quick_add_prod")}
                  </button>
                  <button
                    onClick={() => setTab("promos")}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 transition"
                  >
                    <Plus size={16} /> {t(lang, "dash.quick_add_promo")}
                  </button>
                  <button
                    onClick={() => setTab("messages")}
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 transition"
                  >
                    <MessageSquare size={16} /> {t(lang, "dash.quick_msg")}
                  </button>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 transition ml-auto"
                  >
                    <ExternalLink size={16} /> {t(lang, "dash.quick_store")}
                  </a>
                </div>

                {isLgScreen && (
                  <div className="hidden lg:grid grid-cols-2 gap-6 mt-4">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">
                          {t(lang, "dash.sales_growth")}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {t(lang, "dash.sales_growth_desc")}
                        </p>
                      </div>
                      <div className="h-80 sm:h-96 w-full mt-2 font-mono">
                        <ResponsiveContainer
                          width="100%"
                          height={320}
                          minHeight={50}
                          minWidth={50}
                        >
                          <AreaChart
                            data={salesData}
                            margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                          >
                            <defs>
                              <linearGradient
                                id="colorSales"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#10b981"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#10b981"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              width={45}
                              tickFormatter={(val) =>
                                val >= 1000000
                                  ? (val / 1000000).toFixed(1) + "M"
                                  : val >= 1000
                                    ? (val / 1000).toFixed(0) + "k"
                                    : val
                              }
                              dx={-5}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow:
                                  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                              }}
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Mauzo",
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="sales"
                              stroke="#10b981"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorSales)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">
                          {t(lang, "dash.cust_reg")}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {t(lang, "dash.cust_reg_desc")}
                        </p>
                      </div>
                      <div className="h-80 sm:h-96 w-full mt-2 font-mono">
                        <ResponsiveContainer
                          width="100%"
                          height={320}
                          minHeight={50}
                          minWidth={50}
                        >
                          <BarChart
                            data={customerData}
                            margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              width={45}
                              tickFormatter={(val) =>
                                val >= 1000000
                                  ? (val / 1000000).toFixed(1) + "M"
                                  : val >= 1000
                                    ? (val / 1000).toFixed(0) + "k"
                                    : val
                              }
                              dx={-5}
                            />
                            <Tooltip
                              cursor={{ fill: "#f8fafc" }}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow:
                                  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                              }}
                              formatter={(value: number) => [value, "Wateja"]}
                            />
                            <Bar
                              dataKey="customers"
                              fill="#6366f1"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Enhanced Analytics: Hourly Peak Traffic Chart */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">
                          {lang === "sw"
                            ? "Muda wa Juu wa Oda (Peak Hours)"
                            : "Peak Order Distribution"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {lang === "sw"
                            ? "Mchanganuo wa masaa 24 unasaidia staff kuajiri au kujiandaa na usafirishaji."
                            : "24-hour heat trends helping staff optimize delivery preparation."}
                        </p>
                      </div>
                      <div className="h-80 sm:h-96 w-full mt-2 font-mono">
                        <ResponsiveContainer
                          width="100%"
                          height={320}
                          minHeight={50}
                          minWidth={50}
                        >
                          <AreaChart
                            data={hourlyTrendsData}
                            margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                          >
                            <defs>
                              <linearGradient
                                id="colorHours"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#f97316"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#f97316"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fill: "#64748b" }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              width={45}
                              tickFormatter={(val) =>
                                val >= 1000000
                                  ? (val / 1000000).toFixed(1) + "M"
                                  : val >= 1000
                                    ? (val / 1000).toFixed(0) + "k"
                                    : val
                              }
                              dx={-5}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                              formatter={(value: number) => [
                                value,
                                lang === "sw" ? "Idadi ya Oda" : "Orders count",
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="ordersCount"
                              stroke="#f97316"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorHours)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Enhanced Analytics: High-Performing Categories Revenue */}
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">
                          {lang === "sw"
                            ? "Mapato kwa Makundi (Niche Revenue)"
                            : "Category Performance"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {lang === "sw"
                            ? "Mchanganuo wa mapato kamilifu yanayotokana na kila kundi la bidhaa."
                            : "True category performance breakdown by total sales volume."}
                        </p>
                      </div>
                      <div className="h-80 sm:h-96 w-full mt-2 font-mono">
                        <ResponsiveContainer
                          width="100%"
                          height={320}
                          minHeight={50}
                          minWidth={50}
                        >
                          <BarChart
                            data={categoryPerformanceData}
                            margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 9, fill: "#64748b" }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              width={45}
                              tickFormatter={(val) =>
                                val >= 1000000
                                  ? (val / 1000000).toFixed(1) + "M"
                                  : val >= 1000
                                    ? (val / 1000).toFixed(0) + "k"
                                    : val
                              }
                              dx={-5}
                            />
                            <Tooltip
                              cursor={{ fill: "#f8fafc" }}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                              formatter={(val: number) => [
                                formatCurrency(val),
                                lang === "sw" ? "Mapato" : "Revenue",
                              ]}
                            />
                            <Bar
                              dataKey="revenue"
                              fill="#10b981"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Graphic charts - Mobile Button */}
                <div className="lg:hidden mt-4">
                  <button
                    type="button"
                    onClick={() => setDashboardChartsOpen(true)}
                    className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-left"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {lang === "sw"
                          ? "Takwimu Kamili (Chati)"
                          : "Full Analytics (Charts)"}
                      </h3>
                      <p className="text-slate-500 text-xs font-medium mt-1">
                        {lang === "sw"
                          ? "Bonyeza kuona mwendo wa biashara"
                          : "Tap to view business trends"}
                      </p>
                    </div>
                    <Activity className="text-emerald-500" size={24} />
                  </button>
                </div>

                {/* Top Selling Products */}
                <div className="mt-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Top Selling Products
                  </h3>
                  <div className="space-y-4">
                    {topSellingProducts.length > 0 ? (
                      topSellingProducts.map((p, i) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-slate-400 w-6">
                              #{i + 1}
                            </span>
                            <img
                              src={p.images && p.images[0] ? p.images[0] : ""}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <span className="font-semibold text-slate-700">
                              {p.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">
                            {p.sales} Sold
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-400 text-center py-4">
                        {lang === "sw" ? "Hakuna mauzo bado." : "No sales yet."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Orders Overview */}
                <div className="mt-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {t(lang, "dash.recent_orders")}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {t(lang, "dash.recent_orders_desc")}
                      </p>
                    </div>
                    <button
                      onClick={() => setTab("orders")}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      {t(lang, "dash.see_all")}
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 font-medium">
                            {t(lang, "word.id")}
                          </th>
                          <th className="pb-3 font-medium">
                            {t(lang, "word.name")}
                          </th>
                          <th className="pb-3 font-medium">
                            {t(lang, "word.date")}
                          </th>
                          <th className="pb-3 font-medium">
                            {t(lang, "word.total")}
                          </th>
                          <th className="pb-3 font-medium">
                            {t(lang, "word.status")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .slice()
                          .reverse()
                          .slice(0, 5)
                          .map((o) => (
                            <tr
                              key={o.id}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                            >
                              <td className="py-3 font-mono text-xs text-slate-500">
                                {o.id}
                              </td>
                              <td className="py-3 font-bold text-slate-800">
                                {o.customerDetails.name}
                              </td>
                              <td className="py-3 text-slate-500">
                                {new Date(o.date).toLocaleDateString("sw-TZ")}
                              </td>
                              <td className="py-3 font-bold text-emerald-600">
                                {formatCurrency(o.total)}
                              </td>
                              <td className="py-3">
                                {(() => {
                                  const orderStatusUpper = o.status
                                    ? o.status.toUpperCase()
                                    : "CREATED";
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-1 justify-center whitespace-nowrap text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide border shadow-sm ${
                                        orderStatusUpper === "RELEASED"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : orderStatusUpper === "DISPUTED"
                                            ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                                            : orderStatusUpper === "SHIPPED"
                                              ? "bg-sky-50 text-sky-700 border-sky-305 animate-pulse"
                                              : orderStatusUpper === "DELIVERED"
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : orderStatusUpper ===
                                                    "BUYER_CONFIRMED"
                                                  ? "bg-teal-50 text-teal-700 border-teal-200"
                                                  : orderStatusUpper ===
                                                        "PAYMENT_HELD" ||
                                                      orderStatusUpper ===
                                                        "PROCESSING"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : orderStatusUpper ===
                                                          "CANCELLED" ||
                                                        orderStatusUpper ===
                                                          "REFUNDED"
                                                      ? "bg-red-50 text-red-700 border-red-200"
                                                      : "bg-amber-50 text-amber-700 border-amber-205"
                                      }`}
                                    >
                                      <span
                                        className={`w-1 h-1 rounded-full ${
                                          orderStatusUpper === "RELEASED"
                                            ? "bg-emerald-500"
                                            : orderStatusUpper === "DISPUTED"
                                              ? "bg-rose-500"
                                              : orderStatusUpper === "SHIPPED"
                                                ? "bg-sky-500 animate-ping"
                                                : "bg-current"
                                        }`}
                                      ></span>
                                      {orderStatusUpper === "CREATED" &&
                                        (lang === "sw"
                                          ? "Imepokelewa"
                                          : "Created")}
                                      {orderStatusUpper ===
                                        "AWAITING_PAYMENT" &&
                                        (lang === "sw"
                                          ? "Inasubiri"
                                          : "Awaiting")}
                                      {orderStatusUpper === "PAYMENT_HELD" &&
                                        (lang === "sw" ? "Escrow" : "Escrow")}
                                      {orderStatusUpper === "PROCESSING" &&
                                        (lang === "sw" ? "Inandaliwa" : "Prep")}
                                      {orderStatusUpper === "SHIPPED" &&
                                        (lang === "sw" ? "Njiani" : "Transit")}
                                      {orderStatusUpper === "DELIVERED" &&
                                        (lang === "sw"
                                          ? "Imefika"
                                          : "Delivered")}
                                      {orderStatusUpper === "BUYER_CONFIRMED" &&
                                        (lang === "sw"
                                          ? "Thibitisho"
                                          : "Confirmed")}
                                      {orderStatusUpper === "DISPUTED" &&
                                        (lang === "sw"
                                          ? "Mgogoro"
                                          : "Disputed")}
                                      {orderStatusUpper === "RELEASED" &&
                                        (lang === "sw"
                                          ? "Completed"
                                          : "Completed")}
                                      {orderStatusUpper === "REFUNDED" &&
                                        (lang === "sw"
                                          ? "Imerejeshwa"
                                          : "Refunded")}
                                      {orderStatusUpper === "CANCELLED" &&
                                        (lang === "sw"
                                          ? "Imeghairiwa"
                                          : "Cancelled")}
                                    </span>
                                  );
                                })()}
                              </td>
                            </tr>
                          ))}
                        {orders.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-6 text-center text-slate-500 text-sm"
                            >
                              {t(lang, "dash.none")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === "finances" && (
              <div className="flex-1">
                <FinancesAdmin orders={orders} />
              </div>
            )}
            {tab === "products" && (
              <div className="flex-1">
                <ProductsAdmin
                  products={displayedProducts}
                  setProducts={setProducts}
                  currentSeller={currentSeller}
                />
              </div>
            )}
            {tab === "orders" && (
              <div className="flex-1">
                <OrdersAdmin
                  orders={displayedOrders}
                  setOrders={setOrders}
                  products={products}
                  setProducts={setProducts}
                  currentStaff={currentStaff}
                />
              </div>
            )}
            {tab === "promos" && (
              <div className="flex-1">
                <PromosAdmin
                  promos={promos}
                  setPromos={setPromos}
                  products={products}
                />
              </div>
            )}
            {tab === "coupons" && (
              <div className="flex-1">
                <CouponsAdmin
                  products={products}
                  customers={customers}
                  orders={orders}
                />
              </div>
            )}
            {tab === "ads" && (
              <div className="flex-1">
                <AdsAdmin
                  lang={lang}
                  products={products}
                  currentStaff={currentStaff}
                />
              </div>
            )}
            {tab === "sellers" && (
              <div className="flex-1">
                <SellersAdmin
                  sellers={sellers}
                  setSellers={setSellers}
                  products={products}
                  orders={orders}
                  currentStaff={currentStaff}
                  messages={messages}
                />
              </div>
            )}
            {tab === "campaigns" && (
              <div className="flex-1">
                <CampaignsAdmin />
              </div>
            )}
            {tab === "staff" && (
              <div className="flex-1">
                <StaffAdmin currentStaff={currentStaff} />
              </div>
            )}
            {tab === "payouts" && (
              <div className="flex-1">
                <PayoutsAdmin />
              </div>
            )}
            {tab === "notifications" && (
              <div className="flex-1">
                <StockNotificationsAdmin />
              </div>
            )}
            {tab === "messages" && (
              <div className="flex-1 h-full min-h-0 flex flex-col">
                <MessagesAdmin
                  messages={messages}
                  setMessages={setMessages}
                  products={products}
                  sellers={sellers}
                  setSellers={setSellers}
                />
              </div>
            )}
            {tab === "customers" && (
              <div className="flex-1">
                <CustomersAdmin
                  customers={customers}
                  setCustomers={setCustomers}
                  orders={orders}
                  currentStaff={currentStaff}
                />
              </div>
            )}
            {tab === "ai-pilot" && (
              <div className="flex-1">
                <AIPilotEngine
                  products={products}
                  orders={orders}
                  messages={messages}
                  sellers={sellers}
                  lang={lang}
                />
              </div>
            )}
            {tab === "visitors-analytics" && (
              <div className="flex-1">
                <VisitorsAnalyticsView lang={lang} />
              </div>
            )}
            {tab === "talk-logs" && (
              <div className="flex-1">
                <TalkLogsAdmin lang={lang} />
              </div>
            )}
            {tab === "payment-logs" && (
              <div className="flex-1">
                <PaymentLogsAdmin lang={lang} />
              </div>
            )}
            {tab === "settings" && (
              <div className="flex-1">
                <SettingsAdmin />
              </div>
            )}
            {tab === "seller_settings" && currentSeller && (
              <div className="flex-1">
                <SellerSettingsSelf
                  seller={currentSeller}
                  sellers={sellers}
                  setSellers={setSellers}
                  lang={lang}
                />
              </div>
            )}

            {tab !== "messages" && (
              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-center gap-0 text-xs text-slate-400 font-medium">
                <span>Powered by</span>
                <img
                  src="https://media-stock.orbifinancial.com/ORBI_LOGO_Blue.png"
                  alt="ORBI Financial Technologies"
                  title="ORBI Financial Technologies"
                  className="h-10 w-auto object-contain ml-[-2px] opacity-80"
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* DASHBOARD CHARTS MODAL (MOBILE) */}
      {dashboardChartsOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex flex-col justify-end p-0 lg:hidden">
          <div className="bg-slate-50 w-full h-[90dvh] rounded-t-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex-shrink-0 p-6 flex justify-between items-center bg-white border-b border-slate-100 z-10 sticky top-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {lang === "sw"
                    ? "Takwimu Kamili (Chati)"
                    : "Full Analytics (Charts)"}
                </h3>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  {lang === "sw" ? "Ufuatiliaji wa kina" : "In-depth tracking"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDashboardChartsOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2.5 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    {t(lang, "dash.sales_growth")}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {t(lang, "dash.sales_growth_desc")}
                  </p>
                </div>
                <div className="h-[300px] sm:h-[400px] w-full mt-2 font-mono">
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                    minHeight={50}
                    minWidth={50}
                  >
                    <AreaChart
                      data={salesData}
                      margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorSalesMobileAdmin"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        width={45}
                        tickFormatter={(val) =>
                          val >= 1000000
                            ? (val / 1000000).toFixed(1) + "M"
                            : val >= 1000
                              ? (val / 1000).toFixed(0) + "k"
                              : val
                        }
                        dx={-5}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow:
                            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSalesMobileAdmin)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    {t(lang, "dash.cust_reg")}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {t(lang, "dash.cust_reg_desc")}
                  </p>
                </div>
                <div className="h-[300px] sm:h-[400px] w-full mt-2 font-mono">
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                    minHeight={50}
                    minWidth={50}
                  >
                    <BarChart
                      data={customerData}
                      margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        width={45}
                        tickFormatter={(val) =>
                          val >= 1000000
                            ? (val / 1000000).toFixed(1) + "M"
                            : val >= 1000
                              ? (val / 1000).toFixed(0) + "k"
                              : val
                        }
                        dx={-5}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow:
                            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="customers"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    {lang === "sw"
                      ? "Muda wa Juu wa Oda (Peak Hours)"
                      : "Peak Order Distribution"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {lang === "sw"
                      ? "Msongamano wa oda kwa saa kuruhusu kujiandaa zaidi."
                      : "24-hour heat trends helping staff optimize delivery preparation."}
                  </p>
                </div>
                <div className="h-[300px] sm:h-[400px] w-full mt-2 font-mono">
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                    minHeight={50}
                    minWidth={50}
                  >
                    <AreaChart
                      data={hourlyTrendsData}
                      margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorHoursMobileAdmin"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f97316"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f97316"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        width={45}
                        tickFormatter={(val) =>
                          val >= 1000000
                            ? (val / 1000000).toFixed(1) + "M"
                            : val >= 1000
                              ? (val / 1000).toFixed(0) + "k"
                              : val
                        }
                        dx={-5}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow:
                            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#f97316"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorHoursMobileAdmin)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    {lang === "sw"
                      ? "Mapato kwa Makundi (Niche Revenue)"
                      : "Category Performance"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {lang === "sw"
                      ? "Msingi wa kuonyesha makundi ya bidhaa yanayoingiza sana."
                      : "True category performance breakdown by total sales volume."}
                  </p>
                </div>
                <div className="h-[300px] sm:h-[400px] w-full mt-2 font-mono">
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                    minHeight={50}
                    minWidth={50}
                  >
                    <BarChart
                      data={categoryPerformanceData}
                      margin={{ top: 5, right: 0, left: -25, bottom: -5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        width={45}
                        tickFormatter={(val) =>
                          val >= 1000000
                            ? (val / 1000000).toFixed(1) + "M"
                            : val >= 1000
                              ? (val / 1000).toFixed(0) + "k"
                              : val
                        }
                        dx={-5}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow:
                            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELLER PRO UPGRADE MODAL */}
      {showUpgradeModal && currentSeller && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Store className="text-orange-500" size={24} />
                <h3 className="text-xl font-black text-slate-800">
                  {lang === "sw"
                    ? "Upgrade kuwa Wauzaji wa PRO"
                    : "Upgrade to PRO Seller"}
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-slate-600 transition bg-slate-50 p-2 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100 mb-6 relative overflow-hidden">
              <h4 className="font-extrabold text-orange-900 text-sm mb-1 uppercase tracking-wider">
                {lang === "sw" ? "Kwanini uwe PRO?" : "Why Become PRO?"}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mb-3">
                {lang === "sw"
                  ? "Jiunge sasa ili bidhaa zako zionyeshwe mwanzo wa duka, upewe lebo maalum ya PRO kwa wateja, na uweze kuongeza bidhaa zisizo na kikomo kwenye mtandao!"
                  : "Join today to prioritize your listings on search, earn the high-trust verified PRO seller badge on your products, and gain unlimited slots for custom store setups."}
              </p>
              {currentSeller.isPro &&
              currentSeller.proUntil &&
              currentSeller.proUntil > Date.now() ? (
                <div className="text-[11px] font-black text-amber-700 bg-amber-100/50 inline-block px-3 py-1 rounded-full">
                  {lang === "sw"
                    ? `Tayari wewe ni PRO hadi: ${new Date(currentSeller.proUntil).toLocaleDateString()}`
                    : `You are currently PRO until: ${new Date(currentSeller.proUntil).toLocaleDateString()}`}
                </div>
              ) : null}
            </div>

            <form onSubmit={handleProcessUpgrade} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">
                  {lang === "sw"
                    ? "1. Chagua Mpango wako"
                    : "1. Choose Your Plan"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {allPlans
                    .filter((p) => p.active)
                    .map((plan) => {
                      const isSelected = selectedUpgradePlanId === plan.id;
                      return (
                        <button
                          type="button"
                          key={plan.id}
                          onClick={() => setSelectedUpgradePlanId(plan.id)}
                          className={`border-2 rounded-2xl p-4 text-center flex flex-col justify-between transition-all relative cursor-pointer outline-none ${isSelected ? "border-orange-500 bg-orange-50/10 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                        >
                          {isSelected && (
                            <span className="absolute top-2 right-2 text-orange-500 bg-orange-100 p-0.5 rounded-full">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                          <div>
                            <div className="font-extrabold text-xs text-slate-800 tracking-tight">
                              {lang === "sw" && plan.nameSw
                                ? plan.nameSw
                                : plan.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {plan.days} {lang === "sw" ? "Siku" : "Days"}
                            </div>
                          </div>
                          <div className="font-black text-sm text-slate-900 mt-3">
                            {formatCurrency(plan.price)}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {selectedUpgradePlanId && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                      {lang === "sw"
                        ? "2. Maelekezo ya Malipo (M-PESA / TIGO PESA)"
                        : "2. Payment Instructions (Mobile Money)"}
                    </h5>
                    <div className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      {lang === "sw" ? (
                        <>
                          Lipia kiasi cha{" "}
                          <span className="text-slate-900 font-bold">
                            {formatCurrency(
                              allPlans.find(
                                (p) => p.id === selectedUpgradePlanId,
                              )?.price || 0,
                            )}
                          </span>{" "}
                          kwenda:
                          <br />
                          <span className="text-orange-600 font-black">
                            LIPA NAMBA (TIGO/MPESA): 4488219
                          </span>
                          <br />
                          Jina la Biashara:{" "}
                          <span className="font-black text-slate-800">
                            ORBI SHOPPING SERVICE
                          </span>
                        </>
                      ) : (
                        <>
                          Send total of{" "}
                          <span className="text-slate-900 font-bold">
                            {formatCurrency(
                              allPlans.find(
                                (p) => p.id === selectedUpgradePlanId,
                              )?.price || 0,
                            )}
                          </span>{" "}
                          TZS to:
                          <br />
                          <span className="text-orange-600 font-black">
                            LIPA NUMBER (TIGO/MPESA): 4488219
                          </span>
                          <br />
                          Merchant Name:{" "}
                          <span className="font-black text-slate-800">
                            ORBI SHOPPING SERVICE
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === "sw"
                          ? "Namba yako ya Simu"
                          : "Your Phone Number"}
                      </label>
                      <input
                        required
                        type="text"
                        value={upgradePhoneNumber}
                        onChange={(e) => setUpgradePhoneNumber(e.target.value)}
                        className="w-full border border-slate-300 p-3 rounded-xl outline-none font-medium text-sm"
                        placeholder="e.g. 0712345678"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {lang === "sw"
                          ? "Kumbukumbu ya Malipo (TXID)"
                          : "Payment Reference (TXID / SMS)"}
                      </label>
                      <input
                        required
                        type="text"
                        value={upgradeReference}
                        onChange={(e) => setUpgradeReference(e.target.value)}
                        className="w-full border border-slate-300 p-3 rounded-xl outline-none font-bold uppercase text-sm"
                        placeholder="e.g. 9F847XJ21"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition rounded-xl font-bold text-sm cursor-pointer"
                >
                  {lang === "sw" ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubscribing || !selectedUpgradePlanId}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-95 transition rounded-xl font-black text-sm shadow-sm disabled:opacity-50 cursor-pointer text-center"
                >
                  {isSubscribing
                    ? lang === "sw"
                      ? "Inasubiri..."
                      : "Processing..."
                    : lang === "sw"
                      ? "Kamilisha Usajili"
                      : "Complete Upgrade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
