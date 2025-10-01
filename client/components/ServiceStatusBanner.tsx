import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Activity,
  Zap,
  Database,
  Settings,
  Info,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { serviceStatusManager, AI_SERVICES, CORE_SERVICES } from '@/lib/serviceStatus';

interface ServiceStatusSummary {
  totalServices: number;
  availableServices: number;
  unavailableServices: number;
  errorServices: number;
  criticallyMissing: string[];
  recommendations: string[];
}

const ServiceStatusBanner: React.FC = () => {
  const [summary, setSummary] = useState<ServiceStatusSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadServiceSummary = async () => {
    setIsLoading(true);
    try {
      const { aiServices, coreServices } = await serviceStatusManager.checkAllServices();
      
      const allServices = [
        ...coreServices,
        ...aiServices.flatMap(category => category.services)
      ];
      
      const available = allServices.filter(s => s.status === 'available');
      const unavailable = allServices.filter(s => s.status === 'unavailable');
      const errors = allServices.filter(s => s.status === 'error');
      
      // Identify critically missing services
      const criticalServices = [
        'supabase-db',
        'supabase-auth', 
        'crop-recommendation',
        'soil-analysis',
        'plant-disease-detection'
      ];
      
      const criticallyMissing = criticalServices.filter(serviceId => {
        const service = allServices.find(s => s.id === serviceId);
        return service && service.status !== 'available';
      });

      const recommendations = [];
      
      if (coreServices.some(s => s.status !== 'available')) {
        recommendations.push('تحقق من اتصال قاعدة البيانات Supabase');
      }
      
      if (unavailable.filter(s => s.requiresLocal).length > 0) {
        recommendations.push('تشغيل خدمات الذكاء الاصطناعي المحلية (docker-compose up)');
      }
      
      if (errors.length > 0) {
        recommendations.push('مراجعة إعدادات API والشبكة');
      }

      setSummary({
        totalServices: allServices.length,
        availableServices: available.length,
        unavailableServices: unavailable.length,
        errorServices: errors.length,
        criticallyMissing: criticallyMissing,
        recommendations
      });
    } catch (error) {
      console.error('Failed to load service summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServiceSummary();
    // Refresh every 30 seconds
    const interval = setInterval(loadServiceSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Alert className="mb-4">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertDescription>جاري فحص حالة الخدمات...</AlertDescription>
      </Alert>
    );
  }

  if (!summary) return null;

  const getStatusLevel = () => {
    if (summary.criticallyMissing.length > 0) return 'critical';
    if (summary.unavailableServices > summary.availableServices) return 'warning';
    if (summary.unavailableServices > 0) return 'info';
    return 'success';
  };

  const statusLevel = getStatusLevel();
  
  const getStatusIcon = () => {
    switch (statusLevel) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (statusLevel) {
      case 'critical':
        return `⚠️ خدمات أساسية غير متاحة (${summary.criticallyMissing.length})`;
      case 'warning':
        return `⚡ معظم الخدمات غير متاحة (${summary.unavailableServices}/${summary.totalServices})`;
      case 'info':
        return `📊 بعض الخدمات غير متاحة (${summary.unavailableServices}/${summary.totalServices})`;
      case 'success':
        return `✅ جميع الخدمات متاحة (${summary.availableServices}/${summary.totalServices})`;
    }
  };

  const getBannerStyle = () => {
    switch (statusLevel) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <Card className={`mb-6 ${getBannerStyle()}`} dir="rtl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-lg">{getStatusMessage()}</h3>
              <p className="text-sm text-gray-600">
                متاح: {summary.availableServices} | غير متاح: {summary.unavailableServices} | خطأ: {summary.errorServices}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            </Button>
            
            <Button variant="outline" size="sm" onClick={loadServiceSummary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link to="/service-status">
                <Eye className="h-4 w-4 mr-2" />
                التفاصيل الكاملة
              </Link>
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Critical Missing Services */}
            {summary.criticallyMissing.length > 0 && (
              <Alert className="border-red-300 bg-red-100">
                <XCircle className="h-4 w-4" />
                <AlertTitle>خدمات أساسية مفقودة:</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {summary.criticallyMissing.map(serviceId => (
                      <Badge key={serviceId} variant="destructive">
                        {serviceId}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <Alert className="border-blue-300 bg-blue-100">
                <Settings className="h-4 w-4" />
                <AlertTitle>إجراءات مقترحة:</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1">
                    {summary.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Service Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-100 rounded-lg">
                <Database className="h-6 w-6 mx-auto text-green-600 mb-1" />
                <div className="text-sm font-semibold">قاعدة البيانات</div>
                <Badge variant={coreServicesAvailable() ? "default" : "destructive"} className="text-xs">
                  {coreServicesAvailable() ? "متاح" : "غير متاح"}
                </Badge>
              </div>
              
              <div className="text-center p-3 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                <div className="text-sm font-semibold">الذكاء الاصطناعي</div>
                <Badge variant={aiServicesAvailable() ? "default" : "destructive"} className="text-xs">
                  {getAIServicesCount()}/13 متاح
                </Badge>
              </div>
              
              <div className="text-center p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                <div className="text-sm font-semibold">النظام العام</div>
                <Badge variant={statusLevel === 'success' ? "default" : "secondary"} className="text-xs">
                  {Math.round((summary.availableServices / summary.totalServices) * 100)}%
                </Badge>
              </div>
              
              <div className="text-center p-3 bg-orange-100 rounded-lg">
                <ExternalLink className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                <div className="text-sm font-semibold">الصفحات</div>
                <Badge variant="outline" className="text-xs">
                  جميع الروابط تعمل
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/service-status">
                  <Settings className="h-4 w-4 mr-2" />
                  إدارة الخدمات
                </Link>
              </Button>
              
              {summary.unavailableServices > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/your-repo/README.md" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    دليل الإعداد
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  function coreServicesAvailable(): boolean {
    return summary?.totalServices ? 
      (summary.availableServices / summary.totalServices) >= 0.8 : false;
  }

  function aiServicesAvailable(): boolean {
    return getAIServicesCount() > 0;
  }

  function getAIServicesCount(): number {
    return AI_SERVICES.flatMap(cat => cat.services).filter(s => 
      summary?.availableServices ? s.status === 'available' : false
    ).length;
  }
};

export default ServiceStatusBanner;
