import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  Construction, 
  ArrowLeft, 
  ExternalLink, 
  Calendar,
  Users,
  MessageCircle,
  Lightbulb
} from 'lucide-react';

interface FeatureNotAvailableProps {
  featureName: string;
  description?: string;
  expectedCompletion?: string;
  relatedFeatures?: Array<{
    name: string;
    href: string;
    isAvailable: boolean;
  }>;
  contactInfo?: {
    email?: string;
    github?: string;
    discord?: string;
  };
}

export const FeatureNotAvailable: React.FC<FeatureNotAvailableProps> = ({
  featureName,
  description,
  expectedCompletion,
  relatedFeatures = [],
  contactInfo
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      {/* Main Feature Card */}
      <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Construction className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-yellow-900 text-2xl mb-2">
            {featureName}
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 mx-auto">
            قيد التطوير
          </Badge>
          {description && (
            <CardDescription className="text-yellow-700 text-lg mt-4">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Information */}
          <Alert className="border-blue-200 bg-blue-50">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">حالة التطوير</AlertTitle>
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <div>هذه الميزة مخططة للتطوير ولكنها غير متاحة حالياً</div>
                {expectedCompletion && (
                  <div>
                    <strong>التاريخ المتوقع للإكمال:</strong> {expectedCompletion}
                  </div>
                )}
                <div className="text-sm">
                  نحن لا نعرض بيانات وهمية للميزات غير المطورة - تحصل على تجربة حقيقية فقط
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Alternative Features */}
          {relatedFeatures.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">ميزات بديلة متاحة</AlertTitle>
              <AlertDescription className="text-green-800">
                <div className="space-y-2 mt-2">
                  {relatedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{feature.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={feature.isAvailable ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {feature.isAvailable ? "متاح" : "غير متاح"}
                        </Badge>
                        {feature.isAvailable && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={feature.href}>
                              جرب الآن
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Contact Information */}
          {contactInfo && (
            <Alert className="border-purple-200 bg-purple-50">
              <MessageCircle className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-900">طلب الميزة أو التواصل</AlertTitle>
              <AlertDescription className="text-purple-800">
                <div className="space-y-2 mt-2">
                  <div>إذا كنت تحتاج هذه الميزة بشكل عاجل، يمكنك التواصل معنا:</div>
                  <div className="flex flex-wrap gap-2">
                    {contactInfo.email && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${contactInfo.email}`}>
                          📧 إرسال إيميل
                        </a>
                      </Button>
                    )}
                    {contactInfo.github && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={contactInfo.github} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {contactInfo.discord && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={contactInfo.discord} target="_blank" rel="noopener noreferrer">
                          <Users className="h-3 w-3 mr-1" />
                          Discord
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة للصفحة الرئيسية
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/service-status">
                عرض حالة جميع الخدمات
              </Link>
            </Button>
          </div>

          {/* Development Note */}
          <div className="text-center text-sm text-gray-600 pt-4 border-t border-yellow-200">
            <div className="space-y-1">
              <div>🚫 لا توجد بيانات وهمية - تجربة حقيقية فقط</div>
              <div>
                النظام مُعدّ بـ 
                <code className="bg-gray-200 px-1 mx-1 rounded">VITE_FALLBACK_TO_MOCK=false</code>
                لضمان الشفافية
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureNotAvailable;
