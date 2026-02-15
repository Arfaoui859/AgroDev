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
import {
  cloudConfig,
  checkAllServicesHealth,
  getDeploymentInfo,
  validateEnvironment,
  type ServiceStatus,
} from "@/lib/cloud-config";
import { useAIServices } from "@/hooks/useAIServices";

interface DeploymentInfo {
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  useCloudServices: boolean;
  apiBaseUrl: string;
  buildTime: string;
  version: string;
}

const CloudServicesStatus: React.FC = () => {
  const [servicesStatus, setServicesStatus] = useState<ServiceStatus[]>([]);
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(
    null,
  );
  const [environmentValidation, setEnvironmentValidation] = useState<{
    isValid: boolean;
    missing: string[];
  }>({
    isValid: true,
    missing: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [aiHealthStatus, setAiHealthStatus] = useState<any>(null);

  const { checkAIServicesHealth } = useAIServices();

  // Check all services health
  const checkServicesHealth = async () => {
    setIsLoading(true);
    try {
      // Check cloud services
      const cloudServicesStatus = await checkAllServicesHealth();
      setServicesStatus(cloudServicesStatus);

      // Check AI services through main API
      const aiHealth = await checkAIServicesHealth();
      setAiHealthStatus(aiHealth);

      setLastChecked(new Date());
    } catch (error) {
      console.error("Error checking services health:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const deployment = getDeploymentInfo();
    setDeploymentInfo(deployment);

    const envValidation = validateEnvironment();
    setEnvironmentValidation(envValidation);

    checkServicesHealth();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkServicesHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (isHealthy: boolean): string => {
    return isHealthy ? "bg-green-500" : "bg-red-500";
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (isHealthy: boolean) => {
    return (
      <Badge variant={isHealthy ? "default" : "destructive"}>
        {isHealthy ? "متاح" : "غير متاح"}
      </Badge>
    );
  };

  const healthyServicesCount = servicesStatus.filter((s) => s.isHealthy).length;
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

        {/* Environment Validation Alert */}
        {!environmentValidation.isValid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              متغيرات البيئة المفقودة:{" "}
              {environmentValidation.missing.join(", ")}
            </AlertDescription>
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
                حالة الخدمات المصغرة للذكاء الاصطناعي على Railway/Render
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
                      key={service.service}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.isHealthy)}
                        <div>
                          <div className="font-medium">{service.service}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {service.url}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        {getStatusBadge(service.isHealthy)}
                        {service.responseTime && (
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
                حالة ��لخدمات من خلال API الرئيسي
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiHealthStatus ? (
                <div className="space-y-3">
                  {Object.entries(aiHealthStatus).map(([key, value]) => {
                    if (
                      key === "overall_status" ||
                      key === "error_message" ||
                      key === "timestamp"
                    ) {
                      return null;
                    }
                    const isHealthy = value === "healthy";
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(isHealthy)}
                          <div className="font-medium">
                            {key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        </div>
                        {getStatusBadge(isHealthy)}
                      </div>
                    );
                  })}

                  {aiHealthStatus.overall_status && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <strong>الحالة العامة:</strong>{" "}
                        {aiHealthStatus.overall_status}
                      </div>
                      {aiHealthStatus.error_message && (
                        <div className="text-sm text-red-600 mt-1">
                          <strong>رسالة الخطأ:</strong>{" "}
                          {aiHealthStatus.error_message}
                        </div>
                      )}
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
                    <span className="font-medium">الخدمات السحابية</span>
                  </div>
                  <Badge
                    variant={
                      deploymentInfo.useCloudServices ? "default" : "secondary"
                    }
                  >
                    {deploymentInfo.useCloudServices ? "مُفعلة" : "معطلة"}
                  </Badge>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-sm">تحل��ل التربة:</label>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {cloudConfig.soilAnalysisUrl}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-sm">
                    توصيات المحاصيل:
                  </label>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {cloudConfig.cropRecommendationUrl}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-sm">تشخيص الصور:</label>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {cloudConfig.imageDiagnosisUrl}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-sm">
                    التنبؤ بالأسعار:
                  </label>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {cloudConfig.marketPredictionUrl}
                  </p>
                </div>
              </div>
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
                    راجع دل��ل النشر السحابي: <code>CLOUD_DEPLOYMENT.md</code>
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
