import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Sprout, 
  ShieldCheck, 
  DollarSign, 
  Leaf, 
  AlertTriangle, 
  CheckCircle,
  Calculator,
  Calendar,
  TrendingUp,
  Droplets,
  Target,
  TreePine,
  Zap,
  ArrowRight,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FertilizerRecommendation {
  id: string;
  name: string;
  type: string;
  composition: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  suitabilityScore: number;
  recommendedDosage: {
    dosagePerHectare: string;
    totalRequired: string;
    applicationMethod: string;
  };
  totalCost: number;
  organic: boolean;
  benefits: string[];
  precautions: string[];
  applicationSchedule: Array<{
    stage: string;
    timing: string;
    percentage: number;
  }>;
}

interface PesticideRecommendation {
  id: string;
  name: string;
  type: string;
  target_pests: string[];
  suitabilityScore: number;
  safety_level: string;
  organic_approved: boolean;
  totalCost: number;
  benefits: string[];
  precautions: string[];
  applicationSchedule: {
    frequency: string;
    maxApplications: number;
    preHarvestInterval: string;
  };
  safetyInstructions: string[];
}

const cropOptions = [
  { id: 'olive', name: 'الزيتون' },
  { id: 'tomato', name: 'الطماطم' },
  { id: 'wheat', name: 'القمح' },
  { id: 'citrus', name: 'الحمضيات' },
  { id: 'potato', name: 'البطاطا' },
  { id: 'dates', name: 'التمر' },
  { id: 'barley', name: 'الشعير' },
  { id: 'artichoke', name: 'الخرشوف' },
  { id: 'almond', name: 'اللوز' },
];

const growthStages = [
  { id: 'planting', name: 'مرحلة الزراعة' },
  { id: 'growth', name: 'النمو الخضري' },
  { id: 'flowering', name: 'الإزهار' },
  { id: 'fruiting', name: 'الإثمار' },
  { id: 'harvest', name: 'ما قبل القطف' }
];

const seasons = [
  { id: 'spring', name: 'الربيع' },
  { id: 'summer', name: 'الصيف' },
  { id: 'autumn', name: 'الخريف' },
  { id: 'winter', name: 'الشتاء' }
];

export default function FertilizerRecommendations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fertilizer');
  const [formData, setFormData] = useState({
    cropType: 'olive',
    farmSize: 1,
    budget: 1000,
    organicPreference: false,
    growthStage: 'growth',
    season: 'spring',
    environmentalConcern: true,
    soilData: {
      ph: 7.0,
      nitrogen: 15,
      phosphorus: 10,
      potassium: 20,
      organicMatter: 2.5
    }
  });
  
  const [fertilizerRecommendations, setFertilizerRecommendations] = useState<FertilizerRecommendation[]>([]);
  const [pesticideRecommendations, setPesticideRecommendations] = useState<PesticideRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchFertilizerRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fertilizer/recommendations/fertilizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setFertilizerRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching fertilizer recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPesticideRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fertilizer/recommendations/pesticide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          detectedDiseases: [
            { id: 'olive_leaf_spot', name: 'تبقع أوراق الزيتون', severity: 'medium' }
          ]
        }),
      });
      const data = await response.json();
      setPesticideRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching pesticide recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fertilizer') {
      fetchFertilizerRecommendations();
    } else {
      fetchPesticideRecommendations();
    }
  }, [activeTab, formData.cropType, formData.organicPreference]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSoilData = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      soilData: {
        ...prev.soilData,
        [field]: value
      }
    }));
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'very_low': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSafetyText = (level: string) => {
    switch (level) {
      case 'very_low': return 'آمن جداً';
      case 'low': return 'آمن';
      case 'medium': return 'متوسط الأمان';
      case 'high': return 'يتطلب حذر';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">توصيات الأسمدة والمبيدات</h1>
          <p className="text-muted-foreground">
            توصيات ذكية ومخصصة لتحسين إنتاجية المحاصيل
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'إخفاء' : 'إظهار'} الإعدادات المتقدمة
        </Button>
      </div>

      {/* AI Service Integration */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">تحليل التربة الذكي للتسميد</h3>
              <p className="text-sm text-gray-600 font-normal">احصل على توصيات دقيقة للأسمدة بناءً على تحليل شامل للتربة</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Sprout className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تحليل التربة</h4>
                  <p className="text-xs text-gray-600">تحليل شامل لخصائص التربة</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">توصيات مخصصة</h4>
                  <p className="text-xs text-gray-600">أسمدة مناسبة لمحصولك</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تحسين التكلفة</h4>
                  <p className="text-xs text-gray-600">أفضل عائد لاستثمارك</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => navigate('/ai-intelligence-dashboard?tab=soil-analysis')}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                جرب تحليل التربة الذكي الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 ml-2" />
            إعدادات المزرعة والمحصول
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="cropType">نوع المحصول</Label>
              <Select value={formData.cropType} onValueChange={(value) => updateFormData('cropType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحصول" />
                </SelectTrigger>
                <SelectContent>
                  {cropOptions.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="farmSize">مساحة المزرعة (هكتار)</Label>
              <Input
                id="farmSize"
                type="number"
                value={formData.farmSize}
                onChange={(e) => updateFormData('farmSize', parseFloat(e.target.value) || 1)}
                min="0.1"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="budget">الميزانية (د.ت)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => updateFormData('budget', parseFloat(e.target.value) || 1000)}
                min="100"
                step="50"
              />
            </div>

            <div>
              <Label htmlFor="season">الموسم</Label>
              <Select value={formData.season} onValueChange={(value) => updateFormData('season', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموسم" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              id="organic"
              checked={formData.organicPreference}
              onCheckedChange={(checked) => updateFormData('organicPreference', checked)}
            />
            <Label htmlFor="organic">تفضيل المنتجات العضوية</Label>
          </div>

          {showAdvanced && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold">بيانات التربة المتقدمة</h4>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="ph">درجة الحموضة (pH)</Label>
                    <Input
                      id="ph"
                      type="number"
                      value={formData.soilData.ph}
                      onChange={(e) => updateSoilData('ph', parseFloat(e.target.value) || 7.0)}
                      min="4"
                      max="9"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nitrogen">النيتروجين (ppm)</Label>
                    <Input
                      id="nitrogen"
                      type="number"
                      value={formData.soilData.nitrogen}
                      onChange={(e) => updateSoilData('nitrogen', parseFloat(e.target.value) || 15)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phosphorus">الفوسفور (ppm)</Label>
                    <Input
                      id="phosphorus"
                      type="number"
                      value={formData.soilData.phosphorus}
                      onChange={(e) => updateSoilData('phosphorus', parseFloat(e.target.value) || 10)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="potassium">البوتاسيوم (ppm)</Label>
                    <Input
                      id="potassium"
                      type="number"
                      value={formData.soilData.potassium}
                      onChange={(e) => updateSoilData('potassium', parseFloat(e.target.value) || 20)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="organicMatter">المادة العضوية (%)</Label>
                    <Input
                      id="organicMatter"
                      type="number"
                      value={formData.soilData.organicMatter}
                      onChange={(e) => updateSoilData('organicMatter', parseFloat(e.target.value) || 2.5)}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fertilizer">توصيات الأسمدة</TabsTrigger>
          <TabsTrigger value="pesticide">ت��صيات المبيدات</TabsTrigger>
        </TabsList>

        <TabsContent value="fertilizer" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">توصيات الأسمدة المخصصة</h2>
            <Button onClick={fetchFertilizerRecommendations} disabled={isLoading}>
              {isLoading ? 'جاري التحليل...' : 'تحديث التوصيات'}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Sprout className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">جاري تحليل التربة وتوليد التوصيات...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {fertilizerRecommendations.map((fertilizer, index) => (
                <Card key={fertilizer.id} className={cn(
                  "hover:shadow-md transition-shadow",
                  index === 0 && "ring-2 ring-primary ring-opacity-50"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="p-3 bg-primary/20 rounded-full">
                          <Sprout className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{fertilizer.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            نوع: {fertilizer.type === 'complex' ? 'مركب' : 
                                   fertilizer.type === 'organic' ? 'عضوي' : 'بسيط'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left rtl:text-right">
                        <div className="text-2xl font-bold text-primary">
                          {fertilizer.suitabilityScore}/10
                        </div>
                        <p className="text-xs text-muted-foreground">درجة الملاءمة</p>
                        {index === 0 && (
                          <Badge className="mt-1">الأفضل</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <TreePine className="h-4 w-4 ml-1" />
                          التركيب
                        </h4>
                        <div className="text-sm space-y-1">
                          <div>نيتروجين: {fertilizer.composition.nitrogen}%</div>
                          <div>فوسفور: {fertilizer.composition.phosphorus}%</div>
                          <div>بوتاسيوم: {fertilizer.composition.potassium}%</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <Calculator className="h-4 w-4 ml-1" />
                          الجرعة الموصى بها
                        </h4>
                        <div className="text-sm space-y-1">
                          <div>لكل هكتار: {fertilizer.recommendedDosage.dosagePerHectare}</div>
                          <div>الإجمالي المطلوب: {fertilizer.recommendedDosage.totalRequired}</div>
                          <div>طريقة التطبيق: {fertilizer.recommendedDosage.applicationMethod === 'soil' ? 'تربة' : 'ورقي'}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <DollarSign className="h-4 w-4 ml-1" />
                          التكلفة
                        </h4>
                        <div className="text-lg font-bold text-green-600">
                          {fertilizer.totalCost.toFixed(2)} د.ت
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {fertilizer.organic && (
                            <Badge variant="outline" className="text-green-700">
                              <Leaf className="h-3 w-3 ml-1" />
                              عضوي
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium flex items-center mb-2">
                          <CheckCircle className="h-4 w-4 ml-1 text-green-600" />
                          الفوائد
                        </h4>
                        <ul className="text-sm space-y-1">
                          {fertilizer.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-600 ml-2">•</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 ml-1 text-yellow-600" />
                          تحذيرات مهمة
                        </h4>
                        <ul className="text-sm space-y-1">
                          {fertilizer.precautions.map((precaution, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-yellow-600 ml-2">•</span>
                              {precaution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div>
                      <h4 className="font-medium flex items-center mb-3">
                        <Calendar className="h-4 w-4 ml-1" />
                        جدول التطبيق الموصى به
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {fertilizer.applicationSchedule.map((schedule, idx) => (
                          <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                            <div className="font-medium text-sm">{schedule.stage}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {schedule.timing}
                            </div>
                            <div className="text-sm font-medium text-primary mt-1">
                              {schedule.percentage}% من الكمية
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pesticide" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">توصيات المبيدات والعلاج</h2>
            <Button onClick={fetchPesticideRecommendations} disabled={isLoading}>
              {isLoading ? 'جاري التحليل...' : 'تحديث التوصيات'}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <ShieldCheck className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">جاري تحليل الأمراض وتوليد التوصيات...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pesticideRecommendations.map((pesticide, index) => (
                <Card key={pesticide.id} className={cn(
                  "hover:shadow-md transition-shadow",
                  index === 0 && "ring-2 ring-primary ring-opacity-50"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <ShieldCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{pesticide.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            نوع: {pesticide.type === 'fungicide' ? 'مبيد فطري' : 
                                   pesticide.type === 'insecticide' ? 'مبيد حشري' : 'مبيد بيولوجي'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left rtl:text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {pesticide.suitabilityScore}/10
                        </div>
                        <p className="text-xs text-muted-foreground">درجة الملاءمة</p>
                        <Badge className={getSafetyColor(pesticide.safety_level)}>
                          {getSafetyText(pesticide.safety_level)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <Target className="h-4 w-4 ml-1" />
                          الآفات المستهدفة
                        </h4>
                        <div className="text-sm space-y-1">
                          {pesticide.target_pests.map((pest, idx) => (
                            <div key={idx}>• {pest}</div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <Calendar className="h-4 w-4 ml-1" />
                          جدول التطبيق
                        </h4>
                        <div className="text-sm space-y-1">
                          <div>التكرار: {pesticide.applicationSchedule.frequency}</div>
                          <div>الحد الأقصى: {pesticide.applicationSchedule.maxApplications} مرات</div>
                          <div>قبل القطف: {pesticide.applicationSchedule.preHarvestInterval}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center">
                          <DollarSign className="h-4 w-4 ml-1" />
                          التكلفة
                        </h4>
                        <div className="text-lg font-bold text-blue-600">
                          {pesticide.totalCost.toFixed(2)} د.ت
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          {pesticide.organic_approved && (
                            <Badge variant="outline" className="text-green-700">
                              <Leaf className="h-3 w-3 ml-1" />
                              معتمد عضوياً
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium flex items-center mb-2">
                          <CheckCircle className="h-4 w-4 ml-1 text-green-600" />
                          الفوائد
                        </h4>
                        <ul className="text-sm space-y-1">
                          {pesticide.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-600 ml-2">•</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium flex items-center mb-2">
                          <AlertTriangle className="h-4 w-4 ml-1 text-red-600" />
                          تعليمات السلامة
                        </h4>
                        <ul className="text-sm space-y-1">
                          {pesticide.safetyInstructions.map((instruction, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-red-600 ml-2">•</span>
                              {instruction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
