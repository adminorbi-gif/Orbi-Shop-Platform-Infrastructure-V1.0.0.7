
import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion } from "motion/react";
import { supabase, supabaseUrl, supabaseKey } from "../../lib/supabase";
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
  TalkLogsAdmin
} from './components';

import { useDialog } from "../../components/CustomDialogContext";
import { CameraBarcodeScanner } from "../../components/CameraBarcodeScanner";

export function useAdminApp() {
const { showAlert } = useDialog();
  const [isLogged, setIsLogged] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>("sw");
  const [showApplyModal, setShowApplyModal] = useState(() => {
    return window.location.search.includes("seller-signup=true") || window.location.search.includes("seller-apply=true") || window.location.hash.includes("#seller-signup") || window.location.hash.includes("#seller-apply");
  });

  useEffect(() => {
    const handleUrlChangeOnAdmin = () => {
      const activeSignup = window.location.search.includes("seller-signup=true") || window.location.search.includes("seller-apply=true") || window.location.hash.includes("#seller-signup") || window.location.hash.includes("#seller-apply");
      if (activeSignup) {
        setShowApplyModal(true);
      } else if (window.location.search.includes("seller-login=true") || window.location.search.includes("admin=true")) {
        setShowApplyModal(false);
      }
    };
    window.addEventListener("popstate", handleUrlChangeOnAdmin);
    const intervalAdmin = setInterval(handleUrlChangeOnAdmin, 400);

    return () => {
      window.removeEventListener("popstate", handleUrlChangeOnAdmin);
      clearInterval(intervalAdmin);
    };
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLogged(!!session);
      setLoading(false);
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLogged(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data = await res.json();

      if (!data.success && data.error === "Invalid login credentials") {
        // Auto register if missing
        res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: "Admin" }),
        });
        data = await res.json();
      }

      if (data.success && data.session) {
        await supabase.auth.setSession(data.session);
      } else {
        showAlert(
          data.error === "Invalid login credentials"
            ? "Barua pepe au nenosiri sio sahihi / Invalid email or password"
            : data.error,
          "error",
        );
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }

    setLoading(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
  };

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

  
  return {
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
  };
}
