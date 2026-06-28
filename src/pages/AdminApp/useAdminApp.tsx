
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
