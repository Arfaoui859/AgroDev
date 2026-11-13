import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cloud,
  Database,
  Cpu,
  Globe,
  Clock,
  Zap,
  Server,
  Wifi,
  Shield,
} from "lucide-react";
import { cloudConfig, getDeploymentInfo } from "@/lib/cloud-config";
import { useAIServices } from "@/hooks/useAIServices";

interface DeploymentInfo {
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  buildTime: string;
  version: string;
}

/**
 * One entry of the backend's `/api/ai/health` snapshot. This is the single
 * source of truth: the browser must never probe the microservice hosts
 * directly (the VITE_* URLs are unset in production, and the snapshot is
 * provenance-aware). See `server/routes/ai-services-gateway.ts`.
 */
interface AIServiceEntry {
  name: string;
  nameAr?: string;
  key: string;
  status: "available" | "unavailable" | "not_configured" | "rate_limited" | string;
  modelSource?: string | null;
  modelKind?: "unknown" | "synthetic" | "rule-based" | "llm" | "trained" | string;
  isRealModel?: boolean;
  modelTrainedOnSyntheticData?: boolean;
  responseTime?: number;
  lastChecked?: string;
  error?: string | null;
}

interface AIHealthSnapshot {
  overview?: {
    totalServices: number;
    availableServices: number;
    reachableServices?: number;
    unavailableServices: number;
    notConfiguredServices?: number;
    rateLimitedServices?: number;
    syntheticModelServices?: number;
    ruleBasedServices?: number;
    lastUpdated: string;
    checkDuration: number;
  };
  services?: AIServiceEntry[];
  llm?: {
    configured?: boolean;
    credentialAvailable?: boolean;
    provider?: string | null;
    model?: string | null;
  };
  note?: string;
}

const CloudServicesStatus: React.FC = () => {
  const [servicesStatus, setServicesStatus] = useState<AIServiceEntry[]>([]);
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [aiHealthStatus, setAiHealthStatus] = useState<AIHealthSnapshot | null>(
    null,
  );
  const [healthError, setHealthError] = useState<string | null>(null);

  const { checkAIServicesHealth } = useAIServices();

  // Check all services health. Every probe goes through the backend's
  // provenance-aware `/api/ai/health` snapshot; the browser never contacts the
  // microservice hosts directly.
  const checkServicesHealth = async () => {
    setIsLoading(true);
    setHealthError(null);
    try {
      const aiHealth = (await checkAIServicesHealth()) as AIHealthSnapshot;
      if (aiHealth && Array.isArray(aiHealth.services)) {
        setServicesStatus(aiHealth.services);
        setAiHealthStatus(aiHealth);
      } else {
        // A legacy/flat response carries no per-service array; surface that
        // honestly instead of rendering object keys as if they were services.
        setServicesStatus([]);
        setAiHealthStatus(null);
        setHealthError("استجابة فحص الصحة لا تحتوي على قائمة خدمات صالحة.");
      }

      setLastChecked(new Date());
    } catch (error) {
      console.error("Error checking services health:", error);
      setHealthError(
        error instanceof Error ? error.message : "تعذّر فحص حالة الخدمات.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const deployment = getDeploymentInfo();
    setDeploymentInfo(deployment);

    checkServicesHealth();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkServicesHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  // "Available" means the service answered /health AND its provenance is
  // acceptable. `rate_limited` and `not_configured` are distinct states and
  // are never presented as healthy.
  const isServiceAvailable = (s: AIServiceEntry): boolean =>
    s.status === "available";

  const serviceStatusLabel = (s: AIServiceEntry): string => {
    switch (s.status) {
      case "available":
        return "متاح";
      case "rate_limited":
        return "محدود الطلبات";
      case "not_configured":
        return "غير مُهيّأ";
      default:
        return "غير متاح";
    }
  };

  const serviceStatusVariant = (
    s: AIServiceEntry,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (s.status) {
      case "available":
        return "default";
      case "rate_limited":
      case "not_configured":
        return "secondary";
      default:
        return "destructive";
    }
  };

  const healthyServicesCount = servicesStatus.filter(isServiceAvailable).length;
  const totalServicesCount = servicesStatus.length;
  const healthPercentage =
    totalServicesCount > 0
      ? (healthyServicesCount / totalServicesCount) * 100
      : 0;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Cloud className="h-10 w-10 text-blue-600" />
            حالة الخدمات السحابية
          </h1>
          <p className="text-xl text-gray-600">
            مراقبة وإدارة خدمات منصة AgroGrowth السحابية
          </p>
        </div>

        {/* Health probe error */}
        {healthError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{healthError}</AlertDescription>
          </Alert>
        )}

        {/* Overall Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              الحالة العامة للخدمات
            </CardTitle>
            <CardDescription>
              آخر فحص: {lastChecked?.toLocaleString("ar-TN")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">
                  الخدمات المتاحة: {healthyServicesCount} من{" "}
                  {totalServicesCount}
                </span>
                <Button
                  onClick={checkServicesHealth}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  تحديث
                </Button>
              </div>
              <Progress value={healthPercentage} className="h-3" />
              <div className="text-sm text-gray-600">
                {healthPercentage === 100
                  ? "🟢 جميع الخدمات تعمل بشكل طبيعي"
                  : healthPercentage >= 50
                    ? "🟡 معظم الخدمات متاحة مع بعض المشاكل"
                    : "🔴 مشاكل كبيرة في الخدمات"}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cloud Services Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                خدمات الذكاء الاصطناعي السحابية
              </CardTitle>
              <CardDescription>
                حالة الخدمات المصغرة للذكاء الاصطناعي من خلال الخادم (Render)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicesStatus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>جاري فحص الخدمات...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {servicesStatus.map((service) => (
                    <div
                      key={service.key}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(isServiceAvailable(service))}
                        <div>
                          <div className="font-medium">
                            {service.nameAr || service.name}
                          </div>
                          {service.modelSource && (
                            <div className="text-xs text-gray-500">
                              المصدر: {service.modelSource}
                              {service.modelKind
                                ? ` (${service.modelKind})`
                                : ""}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge variant={serviceStatusVariant(service)}>
                          {serviceStatusLabel(service)}
                        </Badge>
                        {typeof service.responseTime === "number" && (
                          <div className="text-xs text-gray-500 mt-1">
                            {service.responseTime}ms
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main API Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                حالة API الرئيسي
              </CardTitle>
              <CardDescription>
                حالة الخدمات من خلال API الرئيسي
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiHealthStatus?.overview ? (
                <div className="space-y-3">
                  {[
                    {
                      label: "إجمالي الخدمات",
                      value: aiHealthStatus.overview.totalServices,
                    },
                    {
                      label: "متاحة",
                      value: aiHealthStatus.overview.availableServices,
                    },
                    {
                      label: "قابلة للوصول",
                      value: aiHealthStatus.overview.reachableServices ?? 0,
                    },
                    {
                      label: "غير متاحة",
                      value: aiHealthStatus.overview.unavailableServices,
                    },
                    {
                      label: "غير مُهيّأة",
                      value: aiHealthStatus.overview.notConfiguredServices ?? 0,
                    },
                    {
                      label: "محدودة الطلبات",
                      value: aiHealthStatus.overview.rateLimitedServices ?? 0,
                    },
                    {
                      label: "نماذج اصطناعية",
                      value:
                        aiHealthStatus.overview.syntheticModelServices ?? 0,
                    },
                    {
                      label: "محركات قواعد",
                      value: aiHealthStatus.overview.ruleBasedServices ?? 0,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="font-medium">{label}</div>
                      <div className="font-bold">{value}</div>
                    </div>
                  ))}

                  {aiHealthStatus.llm && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <strong>مزوّد النموذج اللغوي:</strong>{" "}
                        {aiHealthStatus.llm.configured
                          ? `${aiHealthStatus.llm.provider ?? "unknown"} / ${aiHealthStatus.llm.model ?? "unknown"}`
                          : "غير مُهيّأ (يعمل المحرك القائم على القواعد)"}
                      </div>
                    </div>
                  )}

                  {aiHealthStatus.note && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                      {aiHealthStatus.note}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>جاري فحص API الرئيسي...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deployment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              معلومات النشر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deploymentInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">البيئة</span>
                  </div>
                  <Badge
                    variant={
                      deploymentInfo.isProduction ? "default" : "secondary"
                    }
                  >
                    {deploymentInfo.environment}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-green-600" />
                    <span className="font-medium">بوابة الذكاء الاصطناعي</span>
                  </div>
                  <Badge variant="default">عبر الخادم</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">الإصدار</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {deploymentInfo.version}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">وقت البناء</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(deploymentInfo.buildTime).toLocaleDateString(
                      "ar-TN",
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              تكوين الخدمات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="font-medium text-sm">API الرئيسي:</label>
                <p className="text-sm text-gray-600 mt-1">
                  {cloudConfig.apiBaseUrl}
                </p>
              </div>

              <Separator />

              <p className="text-sm text-gray-600">
                تُوجَّه جميع طلبات خدمات الذكاء الاصطناعي عبر خادم
                AgroGrowth (<code dir="ltr">/api/ai/*</code>)، الذي يتحقق من
                مصدر النموذج ويرفض الإخراج الاصطناعي غير الموثّق. لا يتصل
                المتصفح بخدمات الخدمات المصغّرة مباشرةً.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips and Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>نصائح لاستكشاف الأخطاء وإصلاحها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  إذا كانت الخدمات السحابية غير متاحة:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>تحقق من إعدادات النشر على Railway أو Render</li>
                  <li>راجع logs الخدمات للبحث عن أخطاء</li>
                  <li>تأكد من تكوين متغيرات البيئة بشكل صحيح</li>
                  <li>تحقق من حالة قواعد البيانات (Supabase/Neon)</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  في وضع التطوير:
                </h4>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>الخدمات تعمل في وضع المحاكاة (Mock Data)</li>
                  <li>للحصول على بيانات حقيقية، قم بتشغيل docker-compose</li>
                  <li>أو قم بتفعيل الخدمات السحابية عبر متغيرات البيئة</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">
                  للنشر الإنتاجي:
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>
                    راجع دليل النشر السحابي: <code>CLOUD_DEPLOYMENT.md</code>
                  </li>
                  <li>
                    تأكد من تكوين جميع المتغيرات في <code>.env.cloud</code>
                  </li>
                  <li>
                    استخدم سكريبت النشر: <code>./scripts/deploy-cloud.sh</code>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudServicesStatus;
