import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  FileText,
  BarChart3,
  History,
  Menu,
  X,
  MapPin,
  Lightbulb,
  TrendingUp,
  Camera,
  Search,
  BookOpen,
  AlertTriangle,
  DollarSign,
  LineChart,
  Bell,
  Sprout,
  Calendar,
  BarChart2,
  CloudRain,
  Droplets,
  CalendarDays,
  Zap,
  Activity,
  Users,
  Heart,
  Baby,
  Wheat,
  Brain,
  Target,
  Smartphone,
  Sparkles,
  RefreshCw,
  CheckSquare,
  Archive,
  Stethoscope,
  Recycle,
  Calculator,
  Wallet,
  TrendingUp as TrendingUpIcon,
  FileSpreadsheet,
  PiggyBank,
  Dna,
  Shield,
  Milk,
  Scale,
  User,
  ShoppingCart,
  Award,
  ChevronDown,
  ChevronRight,
  Home,
  Settings,
  HelpCircle,
  Eye,
  Flag,
  MapPin as MapPinIcon,
  TestTube,
  CreditCard,
  Package,
} from "lucide-react";
import { useState } from "react";
import UnifiedSearch from "./UnifiedSearch";
import NotificationCenter from "./NotificationCenter";

interface LayoutProps {
  children: ReactNode;
}

interface NavigationCategory {
  name: string;
  nameArabic: string;
  icon: React.ElementType;
  items: NavigationItem[];
  allowedRoles: string[]; // Add role-based access control
}

interface NavigationItem {
  name: string;
  nameArabic: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isNew?: boolean;
  allowedRoles: string[]; // Add role-based access control
}

interface QuickActionItem {
  name: string;
  nameArabic: string;
  href: string;
  icon: React.ElementType;
  color: string;
  allowedRoles: string[];
}

// Define role-based quick actions
const quickActions: QuickActionItem[] = [
  {
    name: "Farmer Dashboard",
    nameArabic: "لوحة الفلاح",
    href: "/farmer-dashboard",
    icon: User,
    color: "text-green-600",
    allowedRoles: ["farmer", "admin"],
  },
  {
    name: "Agronomist Dashboard",
    nameArabic: "لوحة الخبير",
    href: "/agronomist-dashboard",
    icon: Award,
    color: "text-blue-600",
    allowedRoles: ["agronomist", "admin"],
  },
  {
    name: "Trader Dashboard",
    nameArabic: "لوحة التاجر",
    href: "/trader-dashboard",
    icon: ShoppingCart,
    color: "text-purple-600",
    allowedRoles: ["trader", "admin"],
  },
  {
    name: "Veterinarian Dashboard",
    nameArabic: "لوح�� البيطري",
    href: "/veterinarian-dashboard",
    icon: Stethoscope,
    color: "text-teal-600",
    allowedRoles: ["veterinarian", "admin"],
  },
  {
    name: "Farm Management",
    nameArabic: "الإدارة الشاملة",
    href: "/comprehensive-farm-management",
    icon: Home,
    color: "text-green-600",
    allowedRoles: ["farmer", "admin", "supervisor"],
  },
  {
    name: "Field Inspector",
    nameArabic: "مراقب الحقول",
    href: "/field-inspector-dashboard",
    icon: Eye,
    color: "text-blue-600",
    allowedRoles: ["inspector", "admin"],
  },
  {
    name: "Admin Panel",
    nameArabic: "مدير المنصة",
    href: "/admin-panel",
    icon: Settings,
    color: "text-red-600",
    allowedRoles: ["admin"],
  },
  {
    name: "Government Panel",
    nameArabic: "مسؤول حكومي",
    href: "/government-dashboard",
    icon: Flag,
    color: "text-purple-600",
    allowedRoles: ["government", "admin"],
  },
];

// Define role-based navigation categories
const navigationCategories: NavigationCategory[] = [
  {
    name: "Dashboards",
    nameArabic: "لوحات التحكم",
    icon: BarChart3,
    allowedRoles: [
      "farmer",
      "agronomist",
      "trader",
      "veterinarian",
      "inspector",
      "admin",
      "government",
    ],
    items: [
      {
        name: "Farmer Dashboard",
        nameArabic: "لوحة تحكم الفلاح",
        href: "/farmer-dashboard",
        icon: User,
        badge: "New",
        allowedRoles: ["farmer", "admin"],
      },
      {
        name: "Agronomist Dashboard",
        nameArabic: "لوحة تحكم الخبير الزراعي",
        href: "/agronomist-dashboard",
        icon: Award,
        badge: "New",
        allowedRoles: ["agronomist", "admin"],
      },
      {
        name: "Trader Dashboard",
        nameArabic: "لوحة تحكم التاجر",
        href: "/trader-dashboard",
        icon: ShoppingCart,
        badge: "New",
        allowedRoles: ["trader", "admin"],
      },
      {
        name: "Veterinarian Dashboard",
        nameArabic: "لوحة تحكم الطبيب البيطري",
        href: "/veterinarian-dashboard",
        icon: Stethoscope,
        badge: "New",
        allowedRoles: ["veterinarian", "admin"],
      },
      {
        name: "Comprehensive Farm Management",
        nameArabic: "إدارة المزرعة الشاملة",
        href: "/comprehensive-farm-management",
        icon: Home,
        badge: "NEW",
        allowedRoles: ["farmer", "admin", "supervisor"],
      },
      {
        name: "Field Inspector Dashboard",
        nameArabic: "لوحة تحكم مراقب الحقول",
        href: "/field-inspector-dashboard",
        icon: Eye,
        badge: "NEW",
        allowedRoles: ["inspector", "admin"],
      },
      {
        name: "AI Intelligence",
        nameArabic: "لوحة الذكاء الاصطناعي",
        href: "/ai-intelligence",
        icon: Brain,
        badge: "AI",
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Admin Panel",
        nameArabic: "لوحة تحكم مدير المنصة",
        href: "/admin-panel",
        icon: Settings,
        badge: "ADMIN",
        allowedRoles: ["admin"],
      },
      {
        name: "Government Official",
        nameArabic: "مسؤول الجهة الحكومية",
        href: "/government-dashboard",
        icon: Flag,
        badge: "GOV",
        allowedRoles: ["government", "admin"],
      },
    ],
  },
  {
    name: "Soil Analysis",
    nameArabic: "تحليل التربة",
    icon: Activity,
    allowedRoles: ["farmer", "agronomist", "inspector", "admin"],
    items: [
      {
        name: "Data Input",
        nameArabic: "إدخال البيانات",
        href: "/data-input",
        icon: FileText,
        allowedRoles: ["farmer", "agronomist", "inspector", "admin"],
      },
      {
        name: "Soil Analysis",
        nameArabic: "تحليل التربة",
        href: "/analysis",
        icon: BarChart3,
        allowedRoles: ["farmer", "agronomist", "inspector", "admin"],
      },
      {
        name: "Data History",
        nameArabic: "سجل البيانات",
        href: "/history",
        icon: History,
        allowedRoles: ["farmer", "agronomist", "inspector", "admin"],
      },
      {
        name: "Location Selection",
        nameArabic: "اختيار الموقع",
        href: "/location",
        icon: MapPin,
        allowedRoles: ["farmer", "agronomist", "inspector", "admin"],
      },
      {
        name: "Smart Soil Detection",
        nameArabic: "كاشف مشاكل التربة الذكي",
        href: "/soil-problem-detection",
        icon: Brain,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Ideal Soil Comparison",
        nameArabic: "مقارنة مع التربة المثالية",
        href: "/ideal-soil-comparison",
        icon: Target,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Soil Alert System",
        nameArabic: "نظام التنبيهات الذكي",
        href: "/soil-alert-system",
        icon: Smartphone,
        allowedRoles: ["farmer", "agronomist", "inspector", "admin"],
      },
    ],
  },
  {
    name: "Crop Management",
    nameArabic: "إدارة المحاصيل",
    icon: Leaf,
    allowedRoles: ["farmer", "agronomist", "admin"],
    items: [
      {
        name: "Crop Recommendations",
        nameArabic: "توصيات المحاصيل",
        href: "/recommendations",
        icon: Lightbulb,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Smart Crop Suggestions",
        nameArabic: "اقتراحات الزراعة الذكية",
        href: "/smart-crop-suggestions",
        icon: Sparkles,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Crop Rotation Planner",
        nameArabic: "مخطط الدورة الزراعية",
        href: "/crop-rotation-planner",
        icon: RefreshCw,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Recommendation History",
        nameArabic: "سجل التوصيات",
        href: "/crop-history",
        icon: TrendingUp,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Crop Alerts",
        nameArabic: "تنبيهات المحاصيل",
        href: "/alert-history",
        icon: Bell,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Daily Tasks",
        nameArabic: "المهام اليومية",
        href: "/my-tasks",
        icon: CheckSquare,
        allowedRoles: ["farmer", "admin"],
      },
    ],
  },
  {
    name: "Disease Detection",
    nameArabic: "كشف الأمراض",
    icon: Camera,
    allowedRoles: ["farmer", "agronomist", "veterinarian", "admin"],
    items: [
      {
        name: "Disease Diagnosis",
        nameArabic: "تشخيص الأمراض",
        href: "/disease-upload",
        icon: Camera,
        allowedRoles: ["farmer", "agronomist", "veterinarian", "admin"],
      },
      {
        name: "Diagnosis History",
        nameArabic: "سجل التشخيص",
        href: "/disease-history",
        icon: Search,
        allowedRoles: ["farmer", "agronomist", "veterinarian", "admin"],
      },
      {
        name: "Disease Guide",
        nameArabic: "دليل الأمراض",
        href: "/disease-guide",
        icon: BookOpen,
        allowedRoles: ["farmer", "agronomist", "veterinarian", "admin"],
      },
      {
        name: "Smart Treatment",
        nameArabic: "توصيا�� العلاج الذكية",
        href: "/treatment-recommendations",
        icon: Stethoscope,
        allowedRoles: ["farmer", "agronomist", "veterinarian", "admin"],
      },
      {
        name: "Treatment History",
        nameArabic: "تاريخ العلاجات",
        href: "/treatment-history",
        icon: Archive,
        allowedRoles: ["farmer", "agronomist", "veterinarian", "admin"],
      },
    ],
  },
  {
    name: "Market Intelligence",
    nameArabic: "ذكاء السوق",
    icon: DollarSign,
    allowedRoles: ["farmer", "trader", "admin"],
    items: [
      {
        name: "Smart Market",
        nameArabic: "السوق الذكي",
        href: "/market-dashboard",
        icon: DollarSign,
        allowedRoles: ["farmer", "trader", "admin"],
      },
      {
        name: "Price Forecasts",
        nameArabic: "توقعات الأسعار",
        href: "/price-forecasts",
        icon: LineChart,
        allowedRoles: ["farmer", "trader", "admin"],
      },
      {
        name: "Market Alerts",
        nameArabic: "تنبيهات السوق",
        href: "/market-alerts",
        icon: Bell,
        allowedRoles: ["farmer", "trader", "admin"],
      },
    ],
  },
  {
    name: "Fertilizer & Treatment",
    nameArabic: "الأسمدة والعلاج",
    icon: Sprout,
    allowedRoles: ["farmer", "agronomist", "admin"],
    items: [
      {
        name: "Fertilizer Recommendations",
        nameArabic: "توصيا�� الأسمدة",
        href: "/fertilizer-recommendations",
        icon: Sprout,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Treatment Schedule",
        nameArabic: "جدول الرش والتسميد",
        href: "/treatment-schedule",
        icon: Calendar,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Effectiveness Reports",
        nameArabic: "تقارير الفعالية",
        href: "/effectiveness-reports",
        icon: BarChart2,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
    ],
  },
  {
    name: "Water Management",
    nameArabic: "إدارة المياه",
    icon: Droplets,
    allowedRoles: ["farmer", "agronomist", "admin"],
    items: [
      {
        name: "Smart Irrigation",
        nameArabic: "نظام الري الذكي",
        href: "/smart-irrigation",
        icon: Droplets,
        badge: "AI",
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Irrigation Scheduler",
        nameArabic: "جدولة الري الذكية",
        href: "/irrigation-scheduler",
        icon: Droplets,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Water Analytics",
        nameArabic: "تحليل استهلاك المياه",
        href: "/water-analytics",
        icon: Zap,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Water Conservation",
        nameArabic: "تحليلات توفير المياه",
        href: "/water-conservation",
        icon: Recycle,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
    ],
  },
  {
    name: "Weather & Planning",
    nameArabic: "الطقس والتخطيط",
    icon: CloudRain,
    allowedRoles: ["farmer", "agronomist", "admin"],
    items: [
      {
        name: "Crop Calendar",
        nameArabic: "تقويم الزراعة",
        href: "/crop-planner",
        icon: CalendarDays,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Weather Alerts",
        nameArabic: "تنبيهات الطقس",
        href: "/weather-alerts",
        icon: CloudRain,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
      {
        name: "Smart Task Planning",
        nameArabic: "تخط��ط المهام الذكي",
        href: "/weather-crop-planner",
        icon: Activity,
        allowedRoles: ["farmer", "agronomist", "admin"],
      },
    ],
  },
  {
    name: "Field & Farm Management",
    nameArabic: "إدارة الحقول والمزارع",
    icon: Home,
    allowedRoles: ["farmer", "inspector", "admin"],
    items: [
      {
        name: "Field Management",
        nameArabic: "إدارة الحقول",
        href: "/field-management",
        icon: MapPinIcon,
        badge: "4.x",
        allowedRoles: ["farmer", "inspector", "admin"],
      },
      {
        name: "Farm Setup",
        nameArabic: "إعداد المزرعة",
        href: "/field-management?tab=overview",
        icon: Home,
        allowedRoles: ["farmer", "admin"],
      },
      {
        name: "Smart Maps",
        nameArabic: "الخرائط الذكية",
        href: "/field-management?tab=maps",
        icon: MapPinIcon,
        allowedRoles: ["farmer", "inspector", "admin"],
      },
      {
        name: "Crop History",
        nameArabic: "التاريخ الزراعي",
        href: "/field-management?tab=crops",
        icon: History,
        allowedRoles: ["farmer", "inspector", "admin"],
      },
      {
        name: "Field Analytics",
        nameArabic: "تحليلات الحقول",
        href: "/field-management?tab=analytics",
        icon: BarChart3,
        allowedRoles: ["farmer", "inspector", "admin"],
      },
      {
        name: "Activity Logs",
        nameArabic: "سجل النشاطات",
        href: "/field-management?tab=history",
        icon: FileText,
        allowedRoles: ["farmer", "inspector", "admin"],
      },
    ],
  },
  {
    name: "Livestock Management",
    nameArabic: "إدارة الثروة الحيوانية",
    icon: Users,
    allowedRoles: ["farmer", "veterinarian", "admin"],
    items: [
      {
        name: "Livestock Dashboard",
        nameArabic: "إدارة الثروة الحيوانية",
        href: "/livestock-dashboard",
        icon: Users,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Advanced Livestock",
        nameArabic: "لوحة الثروة الحيوانية المتقدمة",
        href: "/advanced-livestock",
        icon: Users,
        badge: "Pro",
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Animal Health",
        nameArabic: "مراقبة صحة الحيوانات",
        href: "/animal-health-monitoring",
        icon: Heart,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Breeding Management",
        nameArabic: "إدارة التناسل",
        href: "/breeding-management",
        icon: Baby,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Smart Breeding",
        nameArabic: "التناسل الذكي",
        href: "/intelligent-breeding",
        icon: Dna,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Feed Management",
        nameArabic: "إدارة الأعلاف",
        href: "/feed-management",
        icon: Wheat,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Smart Feed Manager",
        nameArabic: "إدارة الأعلاف الذكية",
        href: "/smart-feed-manager",
        icon: Wheat,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Disease Prediction",
        nameArabic: "التنبؤ بالأمراض",
        href: "/livestock-disease-predictor",
        icon: Shield,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
      {
        name: "Production Analytics",
        nameArabic: "تحليلات الإنتاج",
        href: "/livestock-production-analytics",
        icon: BarChart3,
        allowedRoles: ["farmer", "veterinarian", "admin"],
      },
    ],
  },
  {
    name: "Financial Management",
    nameArabic: "الإدارة ��لمالية",
    icon: Calculator,
    allowedRoles: ["farmer", "trader", "admin"],
    items: [
      {
        name: "Financial Dashboard",
        nameArabic: "لوحة المالية",
        href: "/financial-dashboard",
        icon: Calculator,
        allowedRoles: ["farmer", "trader", "admin"],
      },
      {
        name: "Expense Tracker",
        nameArabic: "تتبع المصروفات",
        href: "/expense-tracker",
        icon: Wallet,
        allowedRoles: ["farmer", "trader", "admin"],
      },
      {
        name: "Revenue Analysis",
        nameArabic: "تحليل الإيرادات",
        href: "/revenue-analysis",
        icon: TrendingUpIcon,
        allowedRoles: ["farmer", "trader", "admin"],
      },
      {
        name: "Profitability Reports",
        nameArabic: "تقارير الربحية",
        href: "/profitability-reports",
        icon: FileSpreadsheet,
        allowedRoles: ["farmer", "trader", "admin"],
      },
      {
        name: "Budget Planning",
        nameArabic: "تخطيط الميزانية",
        href: "/budget-planning",
        icon: PiggyBank,
        allowedRoles: ["farmer", "trader", "admin"],
      },
    ],
  },
  {
    name: "System Testing",
    nameArabic: "اختبار النظام",
    icon: Shield,
    allowedRoles: ["admin"],
    items: [
      {
        name: "System Test",
        nameArabic: "اختب��ر النظام الشامل",
        href: "/system-test",
        icon: TestTube,
        badge: "TEST",
        allowedRoles: ["admin"],
      },
    ],
  },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isArabic, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth(); // Get user info from auth context
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Dashboards",
    "Soil Analysis",
  ]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName],
    );
  };

  const isItemActive = (href: string) => location.pathname === href;

  const isCategoryActive = (category: NavigationCategory) =>
    category.items.some((item) => isItemActive(item.href));

  // Filter categories and items based on user role
  const filteredCategories = navigationCategories
    .filter((category) => {
      if (!isAuthenticated || !user) return false;
      return category.allowedRoles.includes(user.role);
    })
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.allowedRoles.includes(user?.role || ""),
      ),
    }));

  // Filter quick actions based on user role
  const filteredQuickActions = quickActions.filter((action) => {
    if (!isAuthenticated || !user) return false;
    return action.allowedRoles.includes(user.role);
  });

  // Layout now assumes user is authenticated (handled by AppRouter)

  return (
    <div
      className="min-h-screen bg-gray-50 flex"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 z-50 h-full w-80 transform bg-white shadow-xl transition-transform duration-200 ease-in-out",
          isSidebarOpen
            ? "translate-x-0"
            : isArabic
              ? "translate-x-full"
              : "-translate-x-full",
          "md:translate-x-0 md:relative md:block",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="p-2 bg-green-100 rounded-lg">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AgroGrowth</h1>
                <p
                  className="text-sm text-gray-500"
                  style={{ fontFamily: "Cairo, sans-serif" }}
                >
                  منصة زراعية ذكية متكاملة
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {isArabic ? user.nameArabic : user.name}
                </p>
                <p className="text-sm text-gray-500">
                  {isArabic ? user.roleArabic : user.role}
                </p>
              </div>
            </div>
          </div>

          {/* Role-based Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
              <div
                className={cn(
                  "grid gap-1",
                  filteredQuickActions.length <= 4
                    ? "grid-cols-4"
                    : "grid-cols-6",
                )}
              >
                {filteredQuickActions.map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    className="flex flex-col items-center p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <action.icon className={`h-5 w-5 ${action.color} mb-1`} />
                    <span
                      className="text-xs font-medium text-center"
                      style={{ fontFamily: "Cairo, sans-serif" }}
                    >
                      {isArabic ? action.nameArabic : action.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Role-based Navigation */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-2">
              {filteredCategories.map((category) => {
                const isExpanded = expandedCategories.includes(category.name);
                const categoryActive = isCategoryActive(category);

                return (
                  <div key={category.name} className="space-y-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-medium",
                        categoryActive && "bg-green-50 text-green-700",
                      )}
                      onClick={() => toggleCategory(category.name)}
                    >
                      <category.icon className="h-5 w-5 mr-3 rtl:ml-3 rtl:mr-0" />
                      <span
                        className="flex-1 text-left rtl:text-right"
                        style={{ fontFamily: "Cairo, sans-serif" }}
                      >
                        {isArabic ? category.nameArabic : category.name}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {isExpanded && (
                      <div
                        className={`ml-6 rtl:mr-6 rtl:ml-0 space-y-1 ${category.name === "Dashboards" ? "p-3 rounded-lg bg-gradient-to-r from-green-50 to-blue-50" : ""}`}
                      >
                        {category.items.map((item) => {
                          const isActive = isItemActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              className={cn(
                                "flex items-center py-2 px-3 rounded-md text-sm transition-colors group",
                                isActive
                                  ? "bg-green-100 text-green-700 font-medium"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                              )}
                              onClick={() => setIsSidebarOpen(false)}
                            >
                              <item.icon className="h-4 w-4 mr-3 rtl:ml-3 rtl:mr-0" />
                              <span
                                className="flex-1"
                                style={{ fontFamily: "Cairo, sans-serif" }}
                              >
                                {isArabic ? item.nameArabic : item.name}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "ml-2 rtl:mr-2 rtl:ml-0 text-xs",
                                    item.badge === "New" &&
                                      "bg-green-100 text-green-700",
                                    item.badge === "AI" &&
                                      "bg-blue-100 text-blue-700",
                                    item.badge === "Pro" &&
                                      "bg-purple-100 text-purple-700",
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-2 sm:p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-xs sm:text-sm p-2 h-8 sm:h-9"
              >
                {isArabic ? "🇺🇸 EN" : "🇹🇳 العربية"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-8 sm:h-9"
              >
                {isArabic ? "تسجيل خروج" : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900">
                  {isArabic ? "أهلاً بك" : "Welcome"},{" "}
                  <span className="hidden sm:inline">
                    {isArabic ? user.nameArabic : user.name}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isArabic ? user.roleArabic : user.role} •{" "}
                  <span className="hidden sm:inline">
                    {isArabic ? "منصة أجرو جروث" : "AgroGrowth Platform"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
              <div className="hidden sm:block">
                <UnifiedSearch />
              </div>
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-3 sm:p-6 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
