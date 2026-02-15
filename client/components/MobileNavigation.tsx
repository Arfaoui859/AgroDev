import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  BarChart3,
  Camera,
  DollarSign,
  Settings,
  Bell,
  Plus,
  Leaf,
  Activity,
  TrendingUp,
  Map,
  BookOpen,
  ChevronUp,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  labelArabic: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  isNew?: boolean;
  color: string;
}

interface QuickAction {
  id: string;
  label: string;
  labelArabic: string;
  icon: React.ComponentType<any>;
  path: string;
  color: string;
}

const MobileNavigation: React.FC = () => {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const mainNavItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      labelArabic: "الرئيسية",
      icon: Home,
      path: "/",
      color: "text-green-600",
    },
    {
      id: "dashboard",
      label: "Dashboard",
      labelArabic: "لوحة التحكم",
      icon: BarChart3,
      path: "/farmer-dashboard",
      color: "text-blue-600",
    },
    {
      id: "analysis",
      label: "Analysis",
      labelArabic: "التحليل",
      icon: Activity,
      path: "/enhanced-analysis",
      color: "text-purple-600",
      isNew: true,
    },
    {
      id: "market",
      label: "Market",
      labelArabic: "السوق",
      icon: TrendingUp,
      path: "/market-dashboard",
      color: "text-orange-600",
    },
    {
      id: "more",
      label: "More",
      labelArabic: "المزيد",
      icon: Settings,
      path: "/settings",
      badge: notifications,
      color: "text-gray-600",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: "camera",
      label: "Disease Scan",
      labelArabic: "فحص الأمراض",
      icon: Camera,
      path: "/disease-upload",
      color: "bg-red-500",
    },
    {
      id: "soil",
      label: "Soil Test",
      labelArabic: "فحص التربة",
      icon: Leaf,
      path: "/enhanced-analysis",
      color: "bg-green-500",
    },
    {
      id: "weather",
      label: "Weather",
      labelArabic: "الطقس",
      icon: Map,
      path: "/weather-alerts",
      color: "bg-blue-500",
    },
    {
      id: "guide",
      label: "Guide",
      labelArabic: "الدليل",
      icon: BookOpen,
      path: "/disease-guide",
      color: "bg-purple-500",
    },
  ];

  const isActive = (path: string): boolean => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (showQuickActions) {
      setShowQuickActions(false);
    }
  };

  const toggleQuickActions = () => {
    setShowQuickActions(!showQuickActions);
  };

  return (
    <>
      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setShowQuickActions(false)}
        >
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-80 max-w-[90vw]">
            <div className="bg-white rounded-t-3xl p-6 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isArabic ? "إجراءات سريعة" : "Quick Actions"}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleNavigation(action.path)}
                      className="flex flex-col items-center p-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <div
                        className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-3 shadow-lg`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 text-center">
                        {isArabic ? action.labelArabic : action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-5 h-16">
            {mainNavItems.slice(0, 2).map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex flex-col items-center justify-center relative transition-all duration-200 ${
                    active
                      ? "text-green-600 bg-green-50"
                      : "text-gray-500 hover:text-gray-700 active:scale-95"
                  }`}
                >
                  <div className="relative">
                    <IconComponent
                      className={`w-6 h-6 ${active ? "scale-110" : ""} transition-transform`}
                    />
                    {item.badge && item.badge > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs bg-red-500 text-white rounded-full p-0 flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                    {item.isNew && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">
                    {isArabic ? item.labelArabic : item.label}
                  </span>
                  {active && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-green-600 rounded-b-full"></div>
                  )}
                </button>
              );
            })}

            {/* Center Plus Button */}
            <button
              onClick={toggleQuickActions}
              className={`flex flex-col items-center justify-center relative transition-all duration-300 ${
                showQuickActions
                  ? "scale-110"
                  : "hover:scale-105 active:scale-95"
              }`}
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg flex items-center justify-center transform -translate-y-2 transition-all duration-300 ${
                  showQuickActions ? "rotate-45 shadow-xl" : "hover:shadow-xl"
                }`}
              >
                <Plus className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 mt-1">
                {isArabic ? "إضافة" : "Add"}
              </span>
            </button>

            {mainNavItems.slice(2, 4).map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex flex-col items-center justify-center relative transition-all duration-200 ${
                    active
                      ? "text-green-600 bg-green-50"
                      : "text-gray-500 hover:text-gray-700 active:scale-95"
                  }`}
                >
                  <div className="relative">
                    <IconComponent
                      className={`w-6 h-6 ${active ? "scale-110" : ""} transition-transform`}
                    />
                    {item.isNew && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">
                    {isArabic ? item.labelArabic : item.label}
                  </span>
                  {active && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-green-600 rounded-b-full"></div>
                  )}
                </button>
              );
            })}

            {/* More/Settings */}
            {mainNavItems.slice(4).map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex flex-col items-center justify-center relative transition-all duration-200 ${
                    active
                      ? "text-green-600 bg-green-50"
                      : "text-gray-500 hover:text-gray-700 active:scale-95"
                  }`}
                >
                  <div className="relative">
                    <IconComponent
                      className={`w-6 h-6 ${active ? "scale-110" : ""} transition-transform`}
                    />
                    {item.badge && item.badge > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs bg-red-500 text-white rounded-full p-0 flex items-center justify-center">
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">
                    {isArabic ? item.labelArabic : item.label}
                  </span>
                  {active && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-green-600 rounded-b-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Safe area padding for content */}
      <div className="h-16 md:hidden"></div>
    </>
  );
};

export default MobileNavigation;
