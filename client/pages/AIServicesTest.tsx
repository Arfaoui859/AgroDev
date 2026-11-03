import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Zap,
  Database,
  Bot,
  Eye,
  BarChart3,
  MessageSquare
} from 'lucide-react';

interface ServiceHealth {
  name: string;
  nameAr: string;
  status: 'available' | 'unavailable' | 'unknown';
  url: string;
  lastChecked: string;
  responseTime?: number;
  error?: string;
  /** Model provenance the service declares in its own /health payload. */
  modelSource?: string | null;
  /** True when the service reports a synthetic/heuristic model, not a trained one. */
  modelTrainedOnSyntheticData?: boolean;
}

interface AIHealthResponse {
  overview: {
    totalServices: number;
    availableServices: number;
    unavailableServices: number;
    /** Reachable services that self-report synthetic/heuristic models. */
    syntheticModelServices?: number;
    lastUpdated: string;
  };
  services: ServiceHealth[];
  /** Whether a real LLM provider is wired up, and which one. */
  llm?: {
    configured: boolean;
    credentialAvailable: boolean;
    provider: string;
    model: string;
  };
  fallbackEngine?: {
    available: boolean;
    type: string;
    description: string;
  };
  note?: string;
  error?: string;
}

const AIServicesTest: React.FC = () => {
  const [healthData, setHealthData] = useState<AIHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');

  const fetchAIServicesHealth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/health');
      const data = await response.json();
      setHealthData(data);
      setLastChecked(new Date().toLocaleString('ar-TN'));
    } catch (error) {
      console.error('Error fetching AI services health:', error);
      setHealthData({
        overview: {
          totalServices: 0,
          availableServices: 0,
          unavailableServices: 0,
          lastUpdated: new Date().toISOString()
        },
        services: [],
        error: 'فشل في الاتصال بخدمات الذكاء الاصطناعي'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIServicesHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'unavailable':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-700 border-green-200">متاح</Badge>;
      case 'unavailable':
        return <Badge className="bg-red-100 text-red-700 border-red-200">غير متاح</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">غير معروف</Badge>;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('soil') || serviceName.includes('تربة')) {
      return <Database className="h-6 w-6 text-brown-600" />;
    } else if (serviceName.includes('crop') || serviceName.includes('محصول')) {
      return <Bot className="h-6 w-6 text-green-600" />;
    } else if (serviceName.includes('image') || serviceName.includes('صورة')) {
      return <Eye className="h-6 w-6 text-blue-600" />;
    } else if (serviceName.includes('market') || serviceName.includes('سوق')) {
      return <BarChart3 className="h-6 w-6 text-purple-600" />;
    } else if (serviceName.includes('assistant') || serviceName.includes('مساعد')) {
      return <MessageSquare className="h-6 w-6 text-orange-600" />;
    }
    return <Zap className="h-6 w-6 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              اختبار خدمات الذكاء الاصطناعي
            </h1>
            <p className="text-muted-foreground mt-2">
              فحص حالة وتوفر خدمات الذكاء الاصطناعي في النظام
            </p>
          </div>
          <Button 
            onClick={fetchAIServicesHealth} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'جاري الفحص...' : 'إعادة فحص'}
          </Button>
        </div>

        {/* Overview Cards */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي الخدمات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.overview.totalServices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  الخدمات المتاحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {healthData.overview.availableServices}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  الخدمات غير المتاحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {healthData.overview.unavailableServices}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  آخر فحص
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{lastChecked}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {healthData?.error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{healthData.error}</AlertDescription>
          </Alert>
        )}

        {/* Reachability is not the same as a trained model. The bundled services
            answer /health while declaring synthetic/heuristic models, so state
            that plainly instead of implying validated inference. */}
        {healthData && (healthData.overview.syntheticModelServices ?? 0) > 0 && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {healthData.overview.syntheticModelServices} من الخدمات المتاحة تُصرّح بأنها
              مدرّبة على بيانات اصطناعية (model_source: synthetic-demo / heuristic-demo)،
              وليست مدرّبة على بيانات حقلية موثّقة. نتائجها مؤشرات مساعدة وليست توصيات
              معتمدة.
            </AlertDescription>
          </Alert>
        )}

        {/* Honest AI-backend disclosure: a microservice answering /health is not
            the same as a trained model producing its output. Show whether a real
            LLM provider is wired up, and name the rule-based fallback when it is
            what will actually answer. */}
        {healthData && (
          <Alert
            className={
              healthData.llm?.credentialAvailable
                ? 'border-green-300 bg-green-50 text-green-900'
                : 'border-amber-300 bg-amber-50 text-amber-900'
            }
          >
            {healthData.llm?.credentialAvailable ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {healthData.llm?.credentialAvailable ? (
                <>
                  مزوّد الذكاء الاصطناعي الحقيقي مُفعّل: {healthData.llm.provider} (
                  {healthData.llm.model}). تُنتَج إجابات النموذج اللغوي فعلياً من هذا المزوّد.
                </>
              ) : (
                <>
                  لا يوجد مفتاح لمزوّد ذكاء اصطناعي حقيقي، لذا تُجاب الطلبات بمحرّك
                  قواعد زراعية ({healthData.fallbackEngine?.type ?? 'rule-based'}) وتُوسَم
                  النتائج بـ isRealData=false. أضف بيانات اعتماد المزوّد لتفعيل استدلال
                  النموذج اللغوي.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Services List */}
        {healthData?.services && (
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الخدمات</CardTitle>
              <CardDescription>
                حالة كل خدمة من خدمات الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthData.services.map((service, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getServiceIcon(service.name)}
                      <div>
                        <h3 className="font-medium">{service.nameAr}</h3>
                        <p className="text-sm text-muted-foreground">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.url}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {service.modelTrainedOnSyntheticData && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-800"
                          title={`model_source: ${service.modelSource}`}
                        >
                          بيانات اصطناعية
                        </Badge>
                      )}
                      {service.responseTime && (
                        <div className="text-xs text-muted-foreground">
                          {service.responseTime}ms
                        </div>
                      )}
                      {getStatusIcon(service.status)}
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !healthData && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>جاري فحص خدمات الذكاء الاصطناعي...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIServicesTest;
