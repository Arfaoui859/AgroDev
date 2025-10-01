import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  AlertTriangle, 
  ExternalLink, 
  Settings, 
  Zap, 
  RefreshCw,
  Terminal,
  Database,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';

interface ServiceNotAvailableProps {
  serviceName: string;
  serviceId: string;
  description?: string;
  error?: string;
  requiresLocal?: boolean;
  lastChecked?: Date;
  responseTime?: number;
  showRetry?: boolean;
  onRetry?: () => void;
  compact?: boolean;
}

export const ServiceNotAvailable: React.FC<ServiceNotAvailableProps> = ({
  serviceName,
  serviceId,
  description,
  error,
  requiresLocal = false,
  lastChecked,
  responseTime,
  showRetry = true,
  onRetry,
  compact = false
}) => {
  const getErrorCategory = () => {
    if (!error) return 'unknown';
    
    if (error.includes('timeout') || error.includes('network')) return 'network';
    if (error.includes('401') || error.includes('403')) return 'auth';
    if (error.includes('404')) return 'notfound';
    if (error.includes('500')) return 'server';
    if (requiresLocal && error.includes('connection')) return 'local';
    
    return 'unknown';
  };

  const getErrorMessage = () => {
    const category = getErrorCategory();
    
    switch (category) {
      case 'network':
        return 'مشكلة في الاتصال بالشبكة';
      case 'auth':
        return 'مشكلة في المصادقة أو الصلاحيات';
      case 'notfound':
        return 'الخدمة غير موجودة';
      case 'server':
        return 'خطأ في الخادم';
      case 'local':
        return 'الخدمات المحلية غير مُشغّلة';
      default:
        return error || 'سبب غير معروف';
    }
  };

  const getSetupInstructions = () => {
    if (requiresLocal) {
      return {
        title: 'تشغيل الخدمات المحلية',
        steps: [
          'تأكد من تثبيت Docker',
          'انتقل إلى مجلد agrogrowth-ai/',
          'شغّل: docker-compose up -d',
          'انتظر تحميل النماذج (5-10 دقائق)',
          'حدّث الصفحة'
        ]
      };
    } else if (serviceId.includes('supabase')) {
      return {
        title: 'إعداد قاعدة البيانات',
        steps: [
          'تحقق من إعدادات Supabase',
          'تأكد من صحة API Keys',
          'فحص حالة الشبكة',
          'مراجعة Database URL'
        ]
      };
    } else {
      return {
        title: 'استكشاف الأخطاء',
        steps: [
          'تحقق من حالة الشبكة',
          'أعد تحميل الصفحة',
          'راجع إعدادات النظام',
          'اتصل بالدعم الفني'
        ]
      };
    }
  };

  if (compact) {
    return (
      <Alert variant="destructive" className="border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          خدمة غير متاحة
          <Badge variant="outline" className="text-xs">{serviceId}</Badge>
        </AlertTitle>
        <AlertDescription>
          {serviceName} غير متاح حالياً. {getErrorMessage()}
        </AlertDescription>
      </Alert>
    );
  }

  const instructions = getSetupInstructions();

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50" dir="rtl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <WifiOff className="h-8 w-8 text-orange-600" />
        </div>
        <CardTitle className="text-orange-900 flex items-center justify-center gap-2 text-xl">
          {serviceName}
          <Badge variant="destructive">غير متاح</Badge>
        </CardTitle>
        {description && (
          <CardDescription className="text-orange-700 text-base">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error Details */}
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">تفاصيل المشكلة</AlertTitle>
          <AlertDescription className="text-red-800 space-y-2">
            <div><strong>السبب:</strong> {getErrorMessage()}</div>
            {error && (
              <div className="text-xs font-mono bg-red-100 p-2 rounded border">
                {error}
              </div>
            )}
            {lastChecked && (
              <div className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                آخر فحص: {lastChecked.toLocaleTimeString('ar-EG')}
                {responseTime && ` (${responseTime}ms)`}
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Setup Instructions */}
        <Alert className="border-blue-200 bg-blue-50">
          <Settings className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">{instructions.title}</AlertTitle>
          <AlertDescription className="text-blue-800">
            <ol className="list-decimal list-inside space-y-1 mt-2">
              {instructions.steps.map((step, index) => (
                <li key={index} className="text-sm">{step}</li>
              ))}
            </ol>
          </AlertDescription>
        </Alert>

        {/* Service Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">معلومات الخدمة</h4>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>المعرّف:</span>
              <code className="bg-gray-200 px-1 rounded">{serviceId}</code>
            </div>
            <div className="flex justify-between">
              <span>النوع:</span>
              <span>{requiresLocal ? 'خدمة محلية' : 'خدمة سحابية'}</span>
            </div>
            <div className="flex justify-between">
              <span>الحالة:</span>
              <Badge variant="destructive" className="text-xs">غير متصل</Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {showRetry && onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة المحاولة
            </Button>
          )}
          
          <Button 
            variant="outline"
            asChild
            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Link to="/service-status">
              <Database className="h-4 w-4 mr-2" />
              عرض حالة جميع الخدمات
            </Link>
          </Button>

          {requiresLocal && (
            <Button 
              variant="outline"
              asChild
              className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
            >
              <a 
                href="https://github.com/your-repo/agrogrowth-ai/README.md" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Terminal className="h-4 w-4 mr-2" />
                دليل الإعداد
              </a>
            </Button>
          )}
        </div>

        {/* Footer Help */}
        <div className="text-xs text-gray-600 text-center pt-4 border-t border-orange-200">
          <div className="space-y-1">
            <div>هذه الصفحة تظهر لأن النظام لا يحتوي على بيانات وهمية</div>
            <div>
              <code className="bg-gray-200 px-1 rounded">VITE_FALLBACK_TO_MOCK=false</code>
            </div>
            <div>لعرض بيانا�� تجريبية، غيّر هذا الإعداد إلى <code>true</code></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceNotAvailable;
