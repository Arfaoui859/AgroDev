import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Camera,
  AlertTriangle,
  CheckCircle,
  Shield,
  Zap,
  Eye,
  Calendar,
  MapPin,
  Leaf,
  Beaker,
  Target,
  BookOpen,
  Download,
  Share2,
  Stethoscope,
  TrendingUp,
  Clock,
  Star,
  Activity,
  ArrowRight,
  Play
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DiagnosisData {
  id: string;
  images: string[];
  cropType: string;
  plantPart: string;
  symptoms?: string;
  additionalInfo?: string;
  timestamp: string;
  confidence: number;
  diagnosis: {
    disease: string;
    confidence: number;
    severity: string;
    description: string;
    treatment: string[];
    prevention: string[];
  };
}

export default function DiseaseDiagnosis() {
  const { diagnosisId } = useParams();
  const navigate = useNavigate();
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load diagnosis data from localStorage
    const currentDiagnosis = localStorage.getItem('currentDiagnosis');
    if (currentDiagnosis) {
      setDiagnosisData(JSON.parse(currentDiagnosis));
    } else {
      // Fallback: look in history
      const history = JSON.parse(localStorage.getItem('diseaseHistory') || '[]');
      const found = history.find((d: DiagnosisData) => d.id === diagnosisId);
      if (found) {
        setDiagnosisData(found);
      }
    }
    setIsLoading(false);
  }, [diagnosisId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p>جاري تحميل نتائج التشخيص...</p>
        </div>
      </div>
    );
  }

  if (!diagnosisData) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Stethoscope className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">التشخيص غير موجود</h2>
        <p className="text-muted-foreground mb-6">
          لم يتم العثور على بيانات التشخيص المطلوب
        </p>
        <Button onClick={() => navigate('/disease-upload')}>
          <Camera className="w-4 h-4 ml-2" />
          إجراء تشخيص جديد
        </Button>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'منخفض':
      case 'low':
        return 'bg-green-500';
      case 'متوسط':
      case 'medium':
        return 'bg-yellow-500';
      case 'عالي':
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (confidence >= 70) return <Activity className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const cropTypeMap: { [key: string]: string } = {
    'olive': 'زيتون',
    'citrus': 'حمضيات',
    'wheat': 'قمح صلب',
    'tomato': 'طماطم',
    'artichoke': 'خرشوف',
    'pepper': 'فلفل',
    'potato': 'بطاطس',
    'grape': 'عنب',
    'fig': 'تين',
    'pomegranate': 'رمان',
    'other': 'أخرى'
  };

  const plantPartMap: { [key: string]: string } = {
    'leaves': 'أوراق',
    'fruit': 'ثمار',
    'stem': 'ساق',
    'roots': 'جذور',
    'flowers': 'أزهار',
    'bark': 'لحاء',
    'whole-plant': 'النبات كاملاً'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/disease-upload')} variant="outline">
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة للتشخيص
        </Button>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 ml-2" />
            مشاركة
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Stethoscope className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">نتائج التشخيص الذكي</h1>
        <p className="text-muted-foreground">
          تشخيص دقيق بالذكاء الاصطناعي مع توصيات العلاج المناسبة
        </p>
      </div>

      {/* Main Results */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {getConfidenceIcon(diagnosisData.diagnosis.confidence)}
              <span>التشخيص الرئيسي</span>
            </div>
            <Badge className={`${getSeverityColor(diagnosisData.diagnosis.severity)} text-white`}>
              خطورة: {diagnosisData.diagnosis.severity}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">
                {diagnosisData.diagnosis.disease}
              </h2>
              <p className="text-muted-foreground">
                {diagnosisData.diagnosis.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg bg-white">
                <div className="text-3xl font-bold text-primary">
                  {Math.round(diagnosisData.diagnosis.confidence)}%
                </div>
                <div className="text-sm text-muted-foreground">دقة التشخيص</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-white">
                <div className="text-lg font-bold">
                  {cropTypeMap[diagnosisData.cropType] || diagnosisData.cropType}
                </div>
                <div className="text-sm text-muted-foreground">نوع المحصول</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-white">
                <div className="text-lg font-bold">
                  {plantPartMap[diagnosisData.plantPart] || diagnosisData.plantPart}
                </div>
                <div className="text-sm text-muted-foreground">الجزء المصاب</div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Progress value={diagnosisData.diagnosis.confidence} className="w-full max-w-md h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Alert */}
      {diagnosisData.diagnosis.confidence < 70 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>تنبيه:</strong> دقة التشخيص أقل من 70%. ينصح بمراجعة خبير زراعي للتأكد من التشخيص والعلاج المناسب.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Treatment Recommendation Integration */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">خطة العلاج الذكية</h3>
              <p className="text-sm text-gray-600 font-normal">احصل على خطة علاج مفصلة ومخصصة بالذكاء الاصطناعي</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">توصيات مخصصة</h4>
                <p className="text-sm text-gray-600">
                  خطة علاج شاملة تشمل الجرعات المحددة، الجدول الزمني، ومراقبة الفعالية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">متابعة تلقائية</h4>
                <p className="text-sm text-gray-600">
                  تذكيرات تلقائية لمواعيد العلاج ومتابعة التطورات مع تنبيهات ذكية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-purple-200">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">تحليل الفعالية</h4>
                <p className="text-sm text-gray-600">
                  متابعة نجاح العلاج وإحصائيات مفصلة لتحسين النتائج المستقبلية
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="flex-1 max-w-xs bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  onClick={() => {
                    const treatmentData = localStorage.getItem('treatmentRedirectData');
                    if (treatmentData) {
                      const data = JSON.parse(treatmentData);
                      const params = new URLSearchParams({
                        diseaseId: data.diseaseId,
                        diseaseName: data.diseaseName,
                        cropType: data.cropType,
                        severity: data.severity
                      });
                      navigate(`/treatment-recommendations?${params.toString()}`);
                    } else {
                      // Fallback with current diagnosis data
                      const params = new URLSearchParams({
                        diseaseId: `${diagnosisData.cropType}_${diagnosisData.diagnosis.disease.replace(/\s+/g, '_')}`,
                        diseaseName: diagnosisData.diagnosis.disease,
                        cropType: diagnosisData.cropType,
                        severity: diagnosisData.diagnosis.severity === 'عالي' ? 'Severe' : diagnosisData.diagnosis.severity === 'متوسط' ? 'Moderate' : 'Mild'
                      });
                      navigate(`/treatment-recommendations?${params.toString()}`);
                    }
                  }}
                >
                  <Play className="w-5 h-5 ml-2" />
                  إنشاء خطة العلاج الذكية
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 max-w-xs border-gray-300"
                  onClick={() => navigate('/treatment-history')}
                >
                  <Activity className="w-5 h-5 ml-2" />
                  عرض العلاجات السابقة
                </Button>
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  💡 خطة العلاج مجانية ومدعومة بالذكاء الاصطناعي المتطور
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="treatment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="treatment">العلاج</TabsTrigger>
          <TabsTrigger value="prevention">ال��قاية</TabsTrigger>
          <TabsTrigger value="details">التفاصيل</TabsTrigger>
          <TabsTrigger value="images">الصور</TabsTrigger>
        </TabsList>

        <TabsContent value="treatment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Beaker className="w-5 h-5" />
                <span>خطة العلاج الموصى بها</span>
              </CardTitle>
              <CardDescription>
                توصيات علاجية مخصصة للمر�� المشخص
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosisData.diagnosis.treatment.map((treatment, index) => (
                  <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{treatment}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {diagnosisData.diagnosis.severity === 'عالي' && (
                <Alert className="mt-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>تحذير:</strong> المرض في مرحلة متقدمة. ابدأ العلاج فوراً واستشر خبير زراعي إذا لم تتحسن الحالة خلال أسبوع.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Calendar className="w-5 h-5" />
                <span>الجدول الزمني للعلاج</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 border-r-4 border-green-500 bg-green-50">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">اليوم الأول</p>
                    <p className="text-sm text-muted-foreground">ابدأ العلاج فوراً</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 border-r-4 border-yellow-500 bg-yellow-50">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">الأسبوع الأول</p>
                    <p className="text-sm text-muted-foreground">راقب التحسن وكرر الرش إذا لزم الأمر</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 border-r-4 border-blue-500 bg-blue-50">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">الأسبوع الثاني</p>
                    <p className="text-sm text-muted-foreground">تقييم النتائج والتأكد من الشفاء</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prevention" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Shield className="w-5 h-5" />
                <span>إرشادات الوقاية</span>
              </CardTitle>
              <CardDescription>
                خطوات وقائية لتجنب تكرار المرض في المستقبل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {diagnosisData.diagnosis.prevention.map((prevention, index) => (
                  <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse p-4 border rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>{prevention}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نصائح عامة للوقاية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-green-700">الممارسات الجيدة</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>فحص دوري للنباتات</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>تهوية جيدة للمحصول</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>إزالة النباتات المصابة</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>تعقيم الأدوات الزراعية</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-700">إدارة البيئة</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>تنظيم الري لتجنب الرطوبة الزائدة</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>تحسين تصريف التربة</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>تجنب الكثافة الزراعية العالية</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>استخدام أصناف مقاومة</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل التشخيص</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">معلومات العينة</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع المحصول:</span>
                        <span>{cropTypeMap[diagnosisData.cropType] || diagnosisData.cropType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الجزء المصاب:</span>
                        <span>{plantPartMap[diagnosisData.plantPart] || diagnosisData.plantPart}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ التشخيص:</span>
                        <span>{format(new Date(diagnosisData.timestamp), 'dd MMM yyyy', { locale: ar })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">عدد الصور:</span>
                        <span>{diagnosisData.images.length}</span>
                      </div>
                    </div>
                  </div>

                  {diagnosisData.symptoms && (
                    <div>
                      <h4 className="font-medium mb-2">الأعراض الملاحظة</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {diagnosisData.symptoms}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">تفاصيل التشخيص</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">دقة الذكاء الاصطناعي:</span>
                        <span className="font-medium">{Math.round(diagnosisData.diagnosis.confidence)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">مستوى الخطورة:</span>
                        <Badge className={`${getSeverityColor(diagnosisData.diagnosis.severity)} text-white text-xs`}>
                          {diagnosisData.diagnosis.severity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">حالة العلاج:</span>
                        <span className="text-green-600">قابل للعلاج</span>
                      </div>
                    </div>
                  </div>

                  {diagnosisData.additionalInfo && (
                    <div>
                      <h4 className="font-medium mb-2">معلومات إضافية</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {diagnosisData.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Camera className="w-5 h-5" />
                <span>الصور المحللة</span>
              </CardTitle>
              <CardDescription>
                الصور التي تم رفعها وتحليلها بواسطة الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diagnosisData.images.map((imageName, index) => (
                  <div key={index} className="space-y-2">
                    <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">{imageName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-full justify-center">
                      صورة {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <Alert className="mt-6">
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  تم تحليل جميع الصور المرفوعة للوصول إلى التشخيص الأكثر دقة. النتائج تعتمد على جودة الصور والأعراض الظاهرة.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Service Integration */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">التشخيص المتقدم بالذكاء الاصطناعي</h3>
              <p className="text-sm text-gray-600 font-normal">احصل على تشخيص شامل ودقيق بأحدث تقنيات الذكاء الاصطناعي</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تحليل صور متقدم</h4>
                  <p className="text-xs text-gray-600">تشخيص أكثر دقة بالذكاء الاصطناعي المتطور</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-200">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تحليل التغذية</h4>
                  <p className="text-xs text-gray-600">كشف نقص العناصر الغذائية من الأوراق</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                onClick={() => navigate('/ai-intelligence-dashboard?tab=disease-detection')}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                جرب التشخيص المتقدم الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => navigate('/disease-upload')}>
          <Camera className="w-4 h-4 ml-2" />
          تشخيص جديد
        </Button>
        <Button onClick={() => navigate('/disease-history')} variant="outline">
          <BookOpen className="w-4 h-4 ml-2" />
          سجل التشخيصات
        </Button>
        <Button onClick={() => navigate('/disease-guide')} variant="outline">
          <TrendingUp className="w-4 h-4 ml-2" />
          دليل الأمراض
        </Button>
      </div>
    </div>
  );
}
