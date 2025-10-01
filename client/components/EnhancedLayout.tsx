import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  BarChart3,
  TrendingUp,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Moon,
  Sun,
  Globe,
  Wifi,
  WifiOff,
  Leaf,
  Activity,
  Target,
  Zap,
  Shield,
  Heart,
  MessageSquare,
  Calendar,
  BookOpen,
  Award,
  Smartphone,
  HelpCircle,
  ChevronDown,
  Plus,
} from "lucide-react";

interface NavigationItem {
  id: string;
  title: string;
  titleArabic: string;
  href: string;
  icon: any;
  badge?: string | number;
  children?: NavigationItem[];
  category?: string;
  categoryArabic?: string;
}

interface EnhancedLayoutProps {
  children: React.ReactNode;
}

const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({ children }) => {
  const { isArabic, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "online" | "offline"
  >("online");
  const [notifications, setNotifications] = useState(3);

  // Navigation structure
  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      titleArabic: "لوحة التحكم",
      href: "/",
      icon: Home,
      category: "Main",
      categoryArabic: "الرئيسية",
    },
    {
      id: "farms",
      title: "Farm Management",
      titleArabic: "إدارة المزارع",
      href: "/field-management",
      icon: Leaf,
      badge: 5,
      category: "Main",
      categoryArabic: "الرئيسية",
    },
    {
      id: "analytics",
      title: "Analytics",
      titleArabic: "التحليلات",
      href: "/analysis",
      icon: BarChart3,
      category: "Main",
      categoryArabic: "الرئيسية",
      children: [
        {
          id: "soil-analysis",
          title: "Soil Analysis",
          titleArabic: "تحليل التربة",
          href: "/analysis",
          icon: Activity,
        },
        {
          id: "crop-analysis",
          title: "Crop Performance",
          titleArabic: "أداء المحاصيل",
          href: "/crop-history",
          icon: TrendingUp,
        },
        {
          id: "market-analysis",
          title: "Market Intelligence",
          titleArabic: "ذكاء السوق",
          href: "/market-intelligence",
          icon: Target,
        },
      ],
    },
    {
      id: "smart-tools",
      title: "Smart Tools",
      titleArabic: "الأدوات الذكية",
      href: "/ai-intelligence",
      icon: Zap,
      badge: "AI",
      category: "AI Tools",
      categoryArabic: "أدوات الذكاء الاصطناعي",
      children: [
        {
          id: "disease-detection",
          title: "Disease Detection",
          titleArabic: "كشف الأمراض",
          href: "/disease-upload",
          icon: Shield,
        },
        {
          id: "recommendations",
          title: "AI Recommendations",
          titleArabic: "توصيات الذكاء الاصطناعي",
          href: "/recommendations",
          icon: Zap,
        },
        {
          id: "irrigation-optimizer",
          title: "Irrigation Optimizer",
          titleArabic: "محسن الري",
          href: "/irrigation-optimization",
          icon: Activity,
        },
        {
          id: "pest-control",
          title: "Pest Control",
          titleArabic: "مكافحة الآفات",
          href: "/pest-control",
          icon: Shield,
        },
      ],
    },
    {
      id: "market",
      title: "Market & Trading",
      titleArabic: "السوق والتجارة",
      href: "/market-dashboard",
      icon: TrendingUp,
      category: "Business",
      categoryArabic: "الأعمال",
      children: [
        {
          id: "market-dashboard",
          title: "Market Dashboard",
          titleArabic: "لوحة السوق",
          href: "/enhanced-market",
          icon: BarChart3,
        },
        {
          id: "price-forecasts",
          title: "Price Forecasts",
          titleArabic: "توقعات الأسعار",
          href: "/price-forecasts",
          icon: TrendingUp,
        },
      ],
    },
    {
      id: "collaboration",
      title: "Collaboration",
      titleArabic: "التعاون",
      href: "/farmer-collaboration",
      icon: Users,
      badge: 12,
      category: "Social",
      categoryArabic: "اجتماعي",
    },
    {
      id: "training",
      title: "Learning Center",
      titleArabic: "مركز التعلم",
      href: "/disease-guide",
      icon: BookOpen,
      category: "Learning",
      categoryArabic: "التعلم",
    },
  ];

  // Group items by category
  const groupedNavigation = navigationItems.reduce(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, NavigationItem[]>,
  );

  // Network status simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(Math.random() > 0.1 ? "online" : "offline");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here
    if (query.trim()) {
      // Navigate to search results or filter navigation
      console.log("Searching for:", query);
    }
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find((item) => {
      if (item.href === location.pathname) return true;
      return item.children?.some((child) => child.href === location.pathname);
    });

    if (currentItem) {
      const child = currentItem.children?.find(
        (child) => child.href === location.pathname,
      );
      if (child) {
        return isArabic ? child.titleArabic : child.title;
      }
      return isArabic ? currentItem.titleArabic : currentItem.title;
    }

    return isArabic ? "لوحة التحكم" : "Dashboard";
  };

  const renderNavigationItem = (item: NavigationItem, isCollapsed = false) => {
    const isActive =
      location.pathname === item.href ||
      item.children?.some((child) => child.href === location.pathname);

    return (
      <div key={item.id} className="space-y-1">
        <Link
          to={item.href}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
            isActive
              ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon
            className={`h-5 w-5 ${isActive ? "text-green-600" : "text-gray-500 group-hover:text-gray-700"}`}
          />
          {!isCollapsed && (
            <>
              <span className="flex-1 font-medium">
                {isArabic ? item.titleArabic : item.title}
              </span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
              {item.children && (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </>
          )}
        </Link>

        {/* Render children if expanded and has children */}
        {!isCollapsed && item.children && isActive && (
          <div className="ml-6 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.id}
                to={child.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  location.pathname === child.href
                    ? "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <child.icon className="h-4 w-4" />
                <span>{isArabic ? child.titleArabic : child.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Sidebar = ({ collapsed = false }) => (
    <div
      className={`${collapsed ? "w-16" : "w-64"} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          {collapsed ? (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
              <Leaf className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-xl font-bold text-gray-900 dark:text-white"
                  style={{ fontFamily: "Cairo, sans-serif" }}
                >
                  AgroGrowth
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isArabic ? "منصة زراعية ذكية" : "Smart Farming Platform"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            {Object.entries(groupedNavigation).map(([category, items]) => (
              <div key={category}>
                {!collapsed && (
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    {isArabic ? items[0]?.categoryArabic || category : category}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => renderNavigationItem(item, collapsed))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              {connectionStatus === "online" ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span>
                {isArabic
                  ? connectionStatus === "online"
                    ? "متصل"
                    : "غير متصل"
                  : connectionStatus}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isArabic ? "rtl" : "ltr"}`}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side={isArabic ? "right" : "left"} className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                </Sheet>

                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {getCurrentPageTitle()}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isArabic
                      ? "مرحباً بك في منصة AgroGrowth"
                      : "Welcome to AgroGrowth Platform"}
                  </p>
                </div>
              </div>

              {/* Center Search */}
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={
                      isArabic ? "البحث في النظام..." : "Search in system..."
                    }
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                {/* Quick Actions */}
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  {isArabic ? "إضافة" : "Add"}
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {notifications}
                    </Badge>
                  )}
                </Button>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>

                {/* Language Toggle */}
                <Button variant="ghost" size="sm" onClick={toggleLanguage}>
                  <Globe className="h-4 w-4 mr-1" />
                  {isArabic ? "EN" : "ع"}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                        <AvatarFallback className="bg-green-100 text-green-800">
                          {user?.name?.[0] || (isArabic ? "م" : "U")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user?.name || (isArabic ? "المستخدم" : "User")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email || "user@agrogrowth.com"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{isArabic ? "الملف الشخصي" : "Profile"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{isArabic ? "الإعدادات" : "Settings"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>{isArabic ? "المساعدة" : "Help"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isArabic ? "تسجيل الخروج" : "Sign out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedLayout;
