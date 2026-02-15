import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Database,
  Zap,
  Settings,
  ExternalLink,
  Clock,
  Server,
  Bug,
  Info,
  Wifi,
  WifiOff,
  Timer,
  Terminal,
  Globe
} from 'lucide-react';
import { useServiceHealthChecker } from '@/hooks/useServiceHealthChecker';
import { AI_SERVICES, CORE_SERVICES } from '@/lib/serviceStatus';

const ServiceStatusPage: React.FC = () => {
  const { 
    systemHealth, 
    isChecking, 
    checkAllServices, 
    healthChecks,
    isSystemHealthy,
    hasCriticalIssues 
  } = useServiceHealthChecker();

  const getHealthCheckForService = (serviceId: string) => {
    return healthChecks.find(check => check.serviceId === serviceId);
  };

  const getStatusIcon = (isAvailable: boolean, error?: string) => {
    if (isAvailable) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (error?.includes('timeout') || error?.includes('connection')) {
      return <WifiOff className="h-5 w-5 text-red-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadgeVariant = (isAvailable: boolean) => {
    return isAvailable ? 'default' : 'destructive';
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 1000) return 'text-green-600';
    if (responseTime < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          حالة الخدمات والأنظمة
        </h1>
        <p className="text-gray-600">
          فحص مباشر لحالة جميع خدمات الذكاء الاصطناعي والخدمات الأساسية
        </p>
        {systemHealth && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              {isSystemHealthy ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${isSystemHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.overall === 'healthy' ? 'النظام سليم' : 
                 systemHealth.overall === 'degraded' ? 'النظام متدهور' : 'النظام معطل'}
              </span>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              آخر فحص: {systemHealth.lastUpdate.toLocaleTimeString('ar-EG')}
            </div>
          </div>
        )}
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card className={`mb-6 ${
          systemHealth.overall === 'healthy' ? 'border-green-200 bg-green-50' :
          systemHealth.overall === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth.availableServices}</div>
                <div className="text-sm text-gray-600">خدمات متاحة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {systemHealth.totalServices - systemHealth.availableServices}
                </div>
                <div className="text-sm text-gray-600">خدمات غير متاحة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemHealth.coreServicesCount}</div>
                <div className="text-sm text-gray-600">خدمات أساسية</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemHealth.aiServicesCount}</div>
                <div className="text-sm text-gray-600">خدمات ذ.اصطناعي</div>
              </div>
            </div>
            
            {/* Health Percentage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>الصحة العامة للنظام</span>
                <span>{Math.round((systemHealth.availableServices / systemHealth.totalServices) * 100)}%</span>
              </div>
              <Progress 
                value={(systemHealth.availableServices / systemHealth.totalServices) * 100} 
                className="h-3"
              />
            </div>

            {/* Critical Issues */}
            {hasCriticalIssues && (
              <Alert className="mt-4 border-red-300 bg-red-100">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>مشاكل حرجة تتطلب انتباه</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {systemHealth.criticalIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <Button onClick={checkAllServices} disabled={isChecking} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'جاري الفحص...' : 'فحص الحالة'}
        </Button>
        
        <Alert className="max-w-md">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>لا توجد بيانات وهمية</strong> - جميع البيانات حقيقية من الخدمات الفعلية
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="core-services" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="core-services">
            <Database className="w-4 h-4 ml-2" />
            الخدمات الأساسية
          </TabsTrigger>
          <TabsTrigger value="ai-services">
            <Zap className="w-4 h-4 ml-2" />
            خدمات الذكاء الاصطناعي
          </TabsTrigger>
        </TabsList>

        {/* Core Services Tab */}
        <TabsContent value="core-services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                الخدمات الأساسية
              </CardTitle>
              <CardDescription>
                خدمات قاعدة البيانات والمصادقة والتخزين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {CORE_SERVICES.map((service, index) => {
                  const healthCheck = getHealthCheckForService(service.id);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(healthCheck?.isAvailable || false, healthCheck?.error)}
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          {healthCheck?.lastChecked && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {healthCheck.lastChecked.toLocaleTimeString('ar-EG')}
                              {healthCheck.responseTime > 0 && (
                                <span className={getResponseTimeColor(healthCheck.responseTime)}>
                                  ({healthCheck.responseTime}ms)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <Badge variant={getStatusBadgeVariant(healthCheck?.isAvailable || false)}>
                          {healthCheck?.isAvailable ? 'متاح' : 'غير متاح'}
                        </Badge>
                        
                        {service.endpoint && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(service.endpoint, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            اختبار
                          </Button>
                        )}
                        
                        {healthCheck?.error && (
                          <div className="text-xs text-red-600 max-w-64">
                            <div className="flex items-center gap-1">
                              <Bug className="h-3 w-3" />
                              خطأ:
                            </div>
                            <div className="truncate font-mono bg-red-100 p-1 rounded mt-1" title={healthCheck.error}>
                              {healthCheck.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Database Status Alert */}
          {systemHealth && (
            systemHealth.availableServices > 0 ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>الخدمات الأساسية متصلة</AlertTitle>
                <AlertDescription>
                  تم الاتصال بنجاح بقاعدة البيانات والخدمات الأساسية. النظام جاهز للاستخدام.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertTitle>مشكلة في الخدمات الأساسية</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <div>لا يمكن الاتصال بالخدمات الأساسية. تحقق من:</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>إعدادات Supabase والاتصال بالإنترنت</li>
                      <li>صحة API Keys في متغيرات البيئة</li>
                      <li>حالة خوادم Supabase</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )
          )}
        </TabsContent>

        {/* AI Services Tab */}
        <TabsContent value="ai-services" className="space-y-6">
          {AI_SERVICES.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {category.name}
                </CardTitle>
                <CardDescription>
                  {category.services.length} خدمة ذكاء اصطناعي
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.services.map((service, serviceIndex) => {
                    const healthCheck = getHealthCheckForService(service.id);
                    return (
                      <div key={serviceIndex} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(healthCheck?.isAvailable || false, healthCheck?.error)}
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            {healthCheck?.lastChecked && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {healthCheck.lastChecked.toLocaleTimeString('ar-EG')}
                                {healthCheck.responseTime > 0 && (
                                  <span className={getResponseTimeColor(healthCheck.responseTime)}>
                                    ({healthCheck.responseTime}ms)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <Badge variant={getStatusBadgeVariant(healthCheck?.isAvailable || false)}>
                            {healthCheck?.isAvailable ? 'متاح' : 'غير متاح'}
                          </Badge>
                          
                          {service.requiresLocal && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Terminal className="h-3 w-3" />
                              يتطلب خدمات محلية
                            </div>
                          )}
                          
                          {healthCheck?.error && (
                            <div className="text-xs text-red-600 max-w-64">
                              <div className="flex items-center gap-1">
                                <Bug className="h-3 w-3" />
                                خطأ:
                              </div>
                              <div className="truncate font-mono bg-red-100 p-1 rounded mt-1" title={healthCheck.error}>
                                {healthCheck.error}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Setup Instructions for AI Services */}
          <Alert className="border-blue-200 bg-blue-50">
            <Terminal className="h-4 w-4" />
            <AlertTitle>تعليمات إعداد خدمات الذكاء الاصطناعي</AlertTitle>
            <AlertDescription>
              <div className="space-y-3 mt-2">
                <p>لتشغيل خدمات الذكاء الاصطناعي محلياً:</p>
                <div className="bg-blue-100 p-3 rounded border font-mono text-sm">
                  <div># تأكد من تثبيت Docker</div>
                  <div>cd agrogrowth-ai/</div>
                  <div>docker-compose up -d</div>
                  <div># انتظر 5-10 دقائق لتحميل النماذج</div>
                </div>
                <div className="text-sm text-blue-700">
                  <strong>ملاحظة:</strong> هذه الخدمات تتطلب موارد نظام كبيرة (4GB+ RAM) وقد تستغرق وقتاً للبدء
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Separator />
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>
          🚫 هذا النظام مُعدّ بـ <code className="bg-gray-200 px-1 rounded">VITE_FALLBACK_TO_MOCK=false</code>
        </p>
        <p>
          لا توجد بيانات وهمية - جميع المعلومات تأتي من فحص حقيقي للخدمات
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              العودة للصفحة الرئيسية
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a href="https://github.com/your-repo/README.md" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              دليل الإعداد
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceStatusPage;
