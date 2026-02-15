import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Droplets,
  Shield,
  Target,
  Zap,
  Star,
  ThumbsUp,
  ThumbsDown,
  FileText,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Bell,
  Info,
  Leaf,
  Beaker,
  Bug,
  Heart,
  Eye,
  Calculator,
  MapPin,
  Users,
  Award,
  Lightbulb,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface TreatmentProduct {
  id: string;
  name: string;
  activeIngredient: string;
  type: 'Fungicide' | 'Insecticide' | 'Bactericide' | 'Herbicide' | 'Organic' | 'Biological';
  brand: string;
  availability: 'High' | 'Medium' | 'Low';
  cost: number;
  effectiveness: number;
  safetyRating: 'A' | 'B' | 'C' | 'D';
  organicApproved: boolean;
  resistanceRisk: 'Low' | 'Medium' | 'High';
  applicationMethod: 'Spray' | 'Soil' | 'Seed' | 'Injection' | 'Fumigation';
  compatibleCrops: string[];
  restrictions: string[];
}

interface TreatmentStep {
  stepNumber: number;
  title: string;
  description: string;
  timing: string;
  products: {
    productId: string;
    dosage: string;
    concentration: string;
    applicationMethod: string;
    waterVolume?: string;
  }[];
  conditions: string[];
  precautions: string[];
  expectedResults: string;
  costEstimate: number;
}

interface TreatmentPlan {
  planId: string;
  diseaseId: string;
  diseaseName: string;
  cropType: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  approach: 'Chemical' | 'Organic' | 'Integrated' | 'Biological';
  totalDuration: number;
  totalCost: number;
  successRate: number;
  steps: TreatmentStep[];
  preventionMeasures: string[];
  followUpSchedule: {
    checkDays: number[];
    monitoringPoints: string[];
    alertTriggers: string[];
  };
  emergencyActions: string[];
  createdAt: Date;
  aiConfidence: number;
  riskFactors: string[];
  alternativeTreatments: string[];
}

const TreatmentRecommendations: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [products, setProducts] = useState<TreatmentProduct[]>([]);
  
  // Form state for generating recommendations
  const [formData, setFormData] = useState({
    diseaseId: searchParams.get('diseaseId') || '',
    diseaseName: searchParams.get('diseaseName') || '',
    cropType: searchParams.get('cropType') || '',
    severity: searchParams.get('severity') || 'Moderate',
    approach: 'Chemical',
    budget: 100,
    urgency: 'Medium',
    organicPreference: false,
    experienceLevel: 'Intermediate'
  });

  const [startTreatmentData, setStartTreatmentData] = useState({
    cropId: '',
    fieldLocation: '',
    affectedArea: '',
    notes: ''
  });

  const severityColors = {
    Mild: 'bg-green-100 text-green-800',
    Moderate: 'bg-yellow-100 text-yellow-800',
    Severe: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800'
  };

  const approachIcons = {
    Chemical: Beaker,
    Organic: Leaf,
    Integrated: Zap,
    Biological: Bug
  };

  const generateTreatmentPlan = async () => {
    if (!formData.diseaseId || !formData.diseaseName || !formData.cropType) {
      toast.error('يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/disease-treatment/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diseaseId: formData.diseaseId,
          diseaseName: formData.diseaseName,
          cropType: formData.cropType,
          severity: formData.severity,
          farmerPreferences: {
            approach: formData.approach,
            budget: formData.budget,
            urgency: formData.urgency,
            organicPreference: formData.organicPreference,
            experienceLevel: formData.experienceLevel
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setTreatmentPlan({
          ...data.data,
          createdAt: new Date(data.data.createdAt)
        });
        toast.success('تم توليد خطة العلاج بنجاح');
      } else {
        toast.error(data.message || 'فشل في توليد خطة العلاج');
      }
    } catch (error) {
      console.error('Error generating treatment plan:', error);
      toast.error('حدث خطأ في توليد خطة العلاج');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/disease-treatment/products?cropType=${formData.cropType}&approach=${formData.approach}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const startTreatment = async () => {
    if (!treatmentPlan || !startTreatmentData.cropId) {
      toast.error('يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    try {
      const response = await fetch('/api/disease-treatment/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: treatmentPlan.planId,
          userId: 'user-123',
          cropId: startTreatmentData.cropId,
          fieldLocation: startTreatmentData.fieldLocation,
          affectedArea: startTreatmentData.affectedArea,
          notes: startTreatmentData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('تم بدء خطة العلاج بنجاح');
        setShowStartDialog(false);
        // Navigate to treatment progress tracker
        navigate(`/treatment-progress/${data.data.historyId}`);
      } else {
        toast.error(data.message || 'فشل في بدء العلاج');
      }
    } catch (error) {
      console.error('Error starting treatment:', error);
      toast.error('حدث خطأ في بدء العلاج');
    }
  };

  const getProductById = (productId: string): TreatmentProduct | undefined => {
    return products.find(p => p.id === productId);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.ت`;
  };

  useEffect(() => {
    if (formData.diseaseId && formData.diseaseName && formData.cropType) {
      generateTreatmentPlan();
    }
  }, []);

  useEffect(() => {
    if (formData.cropType && formData.approach) {
      fetchProducts();
    }
  }, [formData.cropType, formData.approach]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          العودة
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          توصيات العلاج الذكية
        </h1>
      </div>

      {/* Treatment Plan Generation Form */}
      {!treatmentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              إنشاء خطة علاج مخصصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>اسم المرض</Label>
                <Input
                  value={formData.diseaseName}
                  onChange={(e) => setFormData(prev => ({ ...prev, diseaseName: e.target.value }))}
                  placeholder="مثال: اللفحة المتأخرة"
                />
              </div>
              <div>
                <Label>نوع المحصول</Label>
                <select
                  value={formData.cropType}
                  onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">اختر المحصول</option>
                  <option value="tomato">طماطم</option>
                  <option value="olive">زيتون</option>
                  <option value="citrus">حمضيات</option>
                  <option value="wheat">قمح</option>
                  <option value="pepper">فلفل</option>
                  <option value="potato">بطاطس</option>
                </select>
              </div>
              <div>
                <Label>شدة المرض</Label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Mild">خفيف</option>
                  <option value="Moderate">متوسط</option>
                  <option value="Severe">شديد</option>
                  <option value="Critical">حرج</option>
                </select>
              </div>
              <div>
                <Label>نهج العلاج المفضل</Label>
                <select
                  value={formData.approach}
                  onChange={(e) => setFormData(prev => ({ ...prev, approach: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Chemical">كيميائي</option>
                  <option value="Organic">عضوي</option>
                  <option value="Integrated">متكامل</option>
                  <option value="Biological">حيوي</option>
                </select>
              </div>
              <div>
                <Label>الميزانية المتاحة (د.ت)</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                  min="20"
                  max="1000"
                />
              </div>
              <div>
                <Label>مستوى الخبرة</Label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Beginner">مبتدئ</option>
                  <option value="Intermediate">متوسط</option>
                  <option value="Expert">خبير</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={generateTreatmentPlan} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'جاري التحليل...' : 'توليد خطة العلاج'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Treatment Plan Display */}
      {treatmentPlan && (
        <div className="space-y-6">
          {/* Plan Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowStartDialog(true)}
                    size="lg"
                  >
                    <PlayCircle className="h-5 w-5 ml-2" />
                    بدء العلاج
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setTreatmentPlan(null)}
                  >
                    <RotateCcw className="h-4 w-4 ml-2" />
                    خطة جديدة
                  </Button>
                </div>
                <CardTitle className="text-xl">
                  خطة علاج: {treatmentPlan.diseaseName}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{treatmentPlan.totalDuration}</div>
                    <div className="text-sm text-muted-foreground">يوم</div>
                    <div className="text-xs text-muted-foreground">مدة العلاج</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{treatmentPlan.successRate}%</div>
                    <div className="text-sm text-muted-foreground">نسبة النجاح</div>
                    <div className="text-xs text-muted-foreground">متوقعة</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(treatmentPlan.totalCost)}</div>
                    <div className="text-sm text-muted-foreground">التكلفة</div>
                    <div className="text-xs text-muted-foreground">المقدرة</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{(treatmentPlan.aiConfidence * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">ثقة الذكاء</div>
                    <div className="text-xs text-muted-foreground">الاصطناعي</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={`${severityColors[treatmentPlan.severity]} text-sm px-3 py-1`}>
                  {treatmentPlan.severity === 'Mild' && 'خفيف'}
                  {treatmentPlan.severity === 'Moderate' && 'متوسط'}
                  {treatmentPlan.severity === 'Severe' && 'شديد'}
                  {treatmentPlan.severity === 'Critical' && 'حرج'}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {React.createElement(approachIcons[treatmentPlan.approach], { className: "h-4 w-4 ml-1" })}
                  {treatmentPlan.approach === 'Chemical' && 'كيميائي'}
                  {treatmentPlan.approach === 'Organic' && 'عضوي'}
                  {treatmentPlan.approach === 'Integrated' && 'متكامل'}
                  {treatmentPlan.approach === 'Biological' && 'حيوي'}
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Leaf className="h-4 w-4 ml-1" />
                  {treatmentPlan.cropType}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Treatment Content */}
          <Tabs defaultValue="steps" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="steps">خطوات العلاج</TabsTrigger>
              <TabsTrigger value="products">المنتجات</TabsTrigger>
              <TabsTrigger value="prevention">الوقاية</TabsTrigger>
              <TabsTrigger value="monitoring">المتابعة</TabsTrigger>
              <TabsTrigger value="risks">المخاطر</TabsTrigger>
            </TabsList>

            {/* Treatment Steps */}
            <TabsContent value="steps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    خطوات العلاج التفصيلية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {treatmentPlan.steps.map((step, index) => (
                      <Card key={step.stepNumber} className={`${activeStep === step.stepNumber ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader 
                          className="cursor-pointer"
                          onClick={() => setActiveStep(step.stepNumber)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                activeStep === step.stepNumber ? 'bg-primary' : 'bg-gray-400'
                              }`}>
                                {step.stepNumber}
                              </div>
                              <div>
                                <h4 className="font-semibold">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.timing}</p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {formatCurrency(step.costEstimate)}
                            </Badge>
                          </div>
                        </CardHeader>

                        {activeStep === step.stepNumber && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <p className="text-sm leading-relaxed">{step.description}</p>

                              {/* Products for this step */}
                              {step.products.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-2">المنتجات المطلوبة:</h5>
                                  <div className="space-y-3">
                                    {step.products.map((product, pidx) => {
                                      const productInfo = getProductById(product.productId);
                                      return (
                                        <div key={pidx} className="p-3 bg-gray-50 rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <h6 className="font-medium">{productInfo?.name || 'منتج غير معروف'}</h6>
                                            <Badge variant="secondary">{productInfo?.type}</Badge>
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                            <div>
                                              <span className="font-medium">الجرعة: </span>
                                              {product.dosage}
                                            </div>
                                            <div>
                                              <span className="font-medium">التركيز: </span>
                                              {product.concentration}
                                            </div>
                                            <div>
                                              <span className="font-medium">طريقة التطبيق: </span>
                                              {product.applicationMethod}
                                            </div>
                                            {product.waterVolume && (
                                              <div>
                                                <span className="font-medium">كمية الماء: </span>
                                                {product.waterVolume}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Conditions */}
                              {step.conditions.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-2 flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    الشروط والظروف:
                                  </h5>
                                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                    {step.conditions.map((condition, cidx) => (
                                      <li key={cidx}>{condition}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Precautions */}
                              {step.precautions.length > 0 && (
                                <div>
                                  <h5 className="font-medium mb-2 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-yellow-600" />
                                    احتياطات السلامة:
                                  </h5>
                                  <ul className="list-disc list-inside text-sm space-y-1 text-red-600">
                                    {step.precautions.map((precaution, pidx) => (
                                      <li key={pidx}>{precaution}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Expected Results */}
                              <div className="p-3 bg-green-50 rounded-lg">
                                <h5 className="font-medium mb-1 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-green-600" />
                                  النتائج المتوقعة:
                                </h5>
                                <p className="text-sm text-green-700">{step.expectedResults}</p>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5" />
                    منتجات العلاج المقترحة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <Card key={product.id} className="h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{product.name}</h4>
                            <Badge variant={product.organicApproved ? 'default' : 'secondary'}>
                              {product.organicApproved ? 'عضوي' : product.type}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>المادة الفع��لة:</span>
                              <span className="font-medium">{product.activeIngredient}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>العلامة التجارية:</span>
                              <span>{product.brand}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>التكلفة:</span>
                              <span className="font-medium">{formatCurrency(product.cost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>التوفر:</span>
                              <Badge variant={
                                product.availability === 'High' ? 'default' : 
                                product.availability === 'Medium' ? 'secondary' : 'destructive'
                              }>
                                {product.availability === 'High' && 'متوفر'}
                                {product.availability === 'Medium' && 'متوسط'}
                                {product.availability === 'Low' && 'نادر'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>الفعالية:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={product.effectiveness * 100} className="w-16 h-2" />
                                <span>{(product.effectiveness * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span>تقييم الأمان:</span>
                              <Badge variant={
                                product.safetyRating === 'A' ? 'default' :
                                product.safetyRating === 'B' ? 'secondary' :
                                product.safetyRating === 'C' ? 'outline' : 'destructive'
                              }>
                                {product.safetyRating}
                              </Badge>
                            </div>
                          </div>

                          {product.restrictions.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <h5 className="text-xs font-medium text-red-600 mb-1">تحذيرات:</h5>
                              <ul className="text-xs text-red-500 space-y-1">
                                {product.restrictions.slice(0, 2).map((restriction, idx) => (
                                  <li key={idx}>• {restriction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prevention Tab */}
            <TabsContent value="prevention" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    إجراءات الوقاية طويلة المدى
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">إجراءات وقائية عامة:</h4>
                      <ul className="space-y-2">
                        {treatmentPlan.preventionMeasures.map((measure, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{measure}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">إجراءات الطوارئ:</h4>
                      <ul className="space-y-2">
                        {treatmentPlan.emergencyActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    جدول المتابعة والمراقبة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">أيام المراقبة:</h4>
                      <div className="flex flex-wrap gap-2">
                        {treatmentPlan.followUpSchedule.checkDays.map((day) => (
                          <Badge key={day} variant="outline" className="text-sm">
                            اليوم {day}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">نقاط المراقبة:</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {treatmentPlan.followUpSchedule.monitoringPoints.map((point, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">محفزات التنبيه:</h4>
                      <ul className="space-y-2">
                        {treatmentPlan.followUpSchedule.alertTriggers.map((trigger, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">{trigger}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    المخاطر والبدائل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-red-600">عوامل الخطر:</h4>
                      <ul className="space-y-2">
                        {treatmentPlan.riskFactors.map((risk, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-blue-600">خيارات العلاج البديلة:</h4>
                      <ul className="space-y-2">
                        {treatmentPlan.alternativeTreatments.map((alternative, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{alternative}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Start Treatment Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">بدء خطة العلاج</DialogTitle>
            <DialogDescription className="text-right">
              أدخل تفاصيل الحقل لبدء تطبيق خطة العلاج
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>رقم أو اسم الحقل</Label>
              <Input
                value={startTreatmentData.cropId}
                onChange={(e) => setStartTreatmentData(prev => ({ ...prev, cropId: e.target.value }))}
                placeholder="مثال: حقل رقم 1 - طماطم"
              />
            </div>
            
            <div>
              <Label>موقع الحقل</Label>
              <Input
                value={startTreatmentData.fieldLocation}
                onChange={(e) => setStartTreatmentData(prev => ({ ...prev, fieldLocation: e.target.value }))}
                placeholder="مثال: منطقة الدلتا، قطعة A-12"
              />
            </div>
            
            <div>
              <Label>المساحة المصابة</Label>
              <Input
                value={startTreatmentData.affectedArea}
                onChange={(e) => setStartTreatmentData(prev => ({ ...prev, affectedArea: e.target.value }))}
                placeholder="مثال: 50% من الحقل"
              />
            </div>
            
            <div>
              <Label>ملاحظات إضافية</Label>
              <Textarea
                value={startTreatmentData.notes}
                onChange={(e) => setStartTreatmentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات أو معلومات إضافية..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={startTreatment} disabled={!startTreatmentData.cropId}>
              بدء العلاج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreatmentRecommendations;
