import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Smartphone, Zap, Globe, Shield } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const { isArabic } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Check if we should show the prompt
    const lastDismissed = localStorage.getItem("pwa-install-dismissed");
    const shouldShow =
      !lastDismissed ||
      Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000; // 7 days

    if (!isInstalled && shouldShow) {
      // Delay showing the prompt
      setTimeout(() => {
        setShowPrompt(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 3000);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem("pwa-installed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.setItem("pwa-installed", "true");
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowPrompt(false);
      localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    }, 300);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  const features = [
    {
      icon: Zap,
      title: isArabic ? "أسرع في الأداء" : "Faster Performance",
      description: isArabic
        ? "يعمل بسرعة أكبر من المتصفح"
        : "Works faster than browser",
    },
    {
      icon: Globe,
      title: isArabic ? "يعمل بدون إنترنت" : "Works Offline",
      description: isArabic
        ? "استخدم التطبيق حتى بدون اتصال"
        : "Use the app even without connection",
    },
    {
      icon: Shield,
      title: isArabic ? "أكثر أماناً" : "More Secure",
      description: isArabic
        ? "حماية محسنة لبياناتك"
        : "Enhanced protection for your data",
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-4 transition-all duration-300 ${
        isVisible ? "bg-black/50" : "bg-black/0 pointer-events-none"
      }`}
    >
      <Card
        className={`w-full max-w-md mx-auto transition-all duration-300 transform ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <CardContent className="p-6" dir={isArabic ? "rtl" : "ltr"}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-transparent rounded-xl flex items-center justify-center">
                <Logo size={48} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">AgroGrowth</h3>
                <p className="text-sm text-gray-600">
                  {isArabic
                    ? "منصة زراعية ذكية"
                    : "Smart Agricultural Platform"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 -mt-2 -mr-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {isArabic ? "قم بتثبيت التطبيق" : "Install the App"}
            </h4>
            <p className="text-gray-600 mb-4">
              {isArabic
                ? "احصل على تجربة أفضل مع التطبيق المحسن للهاتف المحمول"
                : "Get a better experience with our mobile-optimized app"}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {feature.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {deferredPrompt ? (
              <Button
                onClick={handleInstall}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                {isArabic ? "تثبيت التطبيق" : "Install App"}
              </Button>
            ) : isIOS ? (
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {isArabic ? "لتثبيت التطبيق على iOS:" : "To install on iOS:"}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span>1. اضغط</span>
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs">⬆</span>
                  </div>
                  <span>2. "إضافة للشاشة الرئيسية"</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1"
              >
                {isArabic ? "ليس الآن" : "Not Now"}
              </Button>
            )}

            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-gray-500"
            >
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          </div>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {isArabic ? "تعليمات iOS" : "iOS Instructions"}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                {isArabic
                  ? 'اضغط على زر المشاركة في المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية"'
                  : 'Tap the share button in your browser, then select "Add to Home Screen"'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
