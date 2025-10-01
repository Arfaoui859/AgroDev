import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Activity, 
  Heart, 
  Thermometer, 
  Eye, 
  Brain,
  Zap,
  Target,
  Calendar,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Stethoscope,
  Pill,
  FileText,
  BarChart3,
  PieChart,
  Users,
  Lightbulb,
  RefreshCw,
  Plus,
  Download
} from 'lucide-react';

interface Animal {
  id: string;
  earTag: string;
  name?: string;
  species: 'cattle' | 'sheep' | 'goat' | 'chicken' | 'turkey' | 'duck';
  breed: string;
  age: number;
  weight: number;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'quarantine';
  currentLocation: string;
}

interface DiseaseRiskAssessment {
  animalId: string;
  diseaseType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  symptoms: string[];
  riskFactors: string[];
  preventionMeasures: string[];
  recommendedActions: string[];
  aiConfidence: number;
  lastAssessment: string;
  weatherImpact?: number;
  seasonalRisk?: number;
  groupRisk?: number;
}

interface DiseasePrediction {
  id: string;
  animalId: string;
  predictedDisease: string;
  probability: number;
  earlyWarningDays: number;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  symptoms: string[];
  preventionPlan: string[];
  treatmentSuggestions: string[];
  monitoringRequired: string[];
  createdAt: string;
  status: 'active' | 'resolved' | 'false_positive';
}

interface PreventionPlan {
  id: string;
  title: string;
  targetDisease: string;
  species: string[];
  duration: number; // days
  actions: {
    day: number;
    action: string;
    type: 'vaccination' | 'medication' | 'hygiene' | 'nutrition' | 'monitoring';
    cost: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  effectiveness: number;
  cost: number;
  notes: string;
}

const LivestockDiseasePredictor: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<DiseaseRiskAssessment[]>([]);
  const [predictions, setPredictions] = useState<DiseasePrediction[]>([]);
  const [preventionPlans, setPreventionPlans] = useState<PreventionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchAnimals();
    generateMockData();
  }, [selectedSpecies, selectedRiskLevel]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/animals');
      const data = await response.json();
      
      if (data.success) {
        const animalsWithAge = data.data.map((animal: any) => ({
          ...animal,
          age: calculateAge(animal.birthDate)
        }));
        setAnimals(animalsWithAge);
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    // Mock risk assessments
    const mockRiskAssessments: DiseaseRiskAssessment[] = [
      {
        animalId: '1',
        diseaseType: 'التهاب الضرع',
        riskLevel: 'high',
        probability: 75,
        symptoms: ['انتفاخ الضرع', 'حرارة مرتفعة', 'تغير لون الحليب'],
        riskFactors: ['عمر متقدم', 'موسم رطب', 'إنتاج حليب عالي'],
        preventionMeasures: ['تطهير منطقة الحلب', 'تحسين التهوية', 'مراقبة درجة الحرارة'],
        recommendedActions: ['فحص فوري', 'تحليل الحليب', 'استشارة بيطرية'],
        aiConfidence: 0.85,
        lastAssessment: new Date().toISOString(),
        weatherImpact: 60,
        seasonalRisk: 70,
        groupRisk: 45
      },
      {
        animalId: '2',
        diseaseType: 'الإسهال المعدي',
        riskLevel: 'medium',
        probability: 45,
        symptoms: ['إسهال', 'فقدان شهية', 'جفاف'],
        riskFactors: ['تغيير في النظام الغذائي', 'إجهاد', 'مياه ملوثة'],
        preventionMeasures: ['تحسين جودة المياه', 'نظافة العلف', 'تقليل الإجهاد'],
        recommendedActions: ['مراقبة الأعراض', 'تحسين النظافة', 'فحص دوري'],
        aiConfidence: 0.72,
        lastAssessment: new Date().toISOString(),
        weatherImpact: 35,
        seasonalRisk: 50,
        groupRisk: 30
      }
    ];

    // Mock predictions
    const mockPredictions: DiseasePrediction[] = [
      {
        id: '1',
        animalId: '1',
        predictedDisease: 'التهاب المفاصل',
        probability: 68,
        earlyWarningDays: 7,
        severity: 'moderate',
        symptoms: ['عرج طفيف', 'تيبس في المشي', 'تجنب الحركة'],
        preventionPlan: [
          'تحسين فراش الحيوان',
          'إضافة مكملات غذائية للمفاصل',
          'تقليل الحمولة الزائدة',
          'تمارين خفيفة منتظمة'
        ],
        treatmentSuggestions: [
          'مضادات الالتهاب الطبيعية',
          'تدليك المفاصل',
          'كمادات دافئة',
          'استشارة بيطرية متخصصة'
        ],
        monitoringRequired: [
          'مراقبة طريقة المشي يومياً',
          'قياس درجة الحرارة',
          'تسجيل مستوى النشاط',
          'فحص المفاصل أسبوعياً'
        ],
        createdAt: new Date().toISOString(),
        status: 'active'
      }
    ];

    // Mock prevention plans
    const mockPreventionPlans: PreventionPlan[] = [
      {
        id: '1',
        title: 'برنامج الوقاية من التهاب الضرع',
        targetDisease: 'التهاب الضرع',
        species: ['cattle'],
        duration: 30,
        actions: [
          {
            day: 1,
            action: 'تطهير منطقة الحلب بمحلول اليود',
            type: 'hygiene',
            cost: 5,
            priority: 'high'
          },
          {
            day: 7,
            action: 'فحص شامل للضرع',
            type: 'monitoring',
            cost: 20,
            priority: 'high'
          },
          {
            day: 14,
            action: 'تحليل عينة حليب',
            type: 'monitoring',
            cost: 15,
            priority: 'medium'
          },
          {
            day: 21,
            action: 'تطعيم وقائي',
            type: 'vaccination',
            cost: 25,
            priority: 'high'
          }
        ],
        effectiveness: 85,
        cost: 65,
        notes: 'يُطبق هذا البرنامج على الأبقار المرضعة في المواسم الرطبة'
      }
    ];

    setRiskAssessments(mockRiskAssessments);
    setPredictions(mockPredictions);
    setPreventionPlans(mockPreventionPlans);
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  };

  const getSpeciesIcon = (species: string) => {
    const icons = {
      cattle: '🐄',
      sheep: '🐑',
      goat: '🐐',
      chicken: '🐔',
      turkey: '🦃',
      duck: '🦆'
    };
    return icons[species as keyof typeof icons] || '🐾';
  };

  const getSpeciesLabel = (species: string) => {
    const labels = {
      cattle: 'أبقار',
      sheep: 'أغنام',
      goat: 'ماعز',
      chicken: 'دجاج',
      turkey: 'ديك رومي',
      duck: 'بط'
    };
    return labels[species as keyof typeof labels] || species;
  };

  const getRiskColor = (riskLevel: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[riskLevel as keyof typeof colors] || 'text-gray-600';
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[riskLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskLabel = (riskLevel: string) => {
    const labels = {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      critical: 'حرج'
    };
    return labels[riskLevel as keyof typeof labels] || riskLevel;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      mild: 'text-green-600',
      moderate: 'text-yellow-600',
      severe: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600';
  };

  const getActionTypeIcon = (type: string) => {
    const icons = {
      vaccination: <Shield className="h-4 w-4 text-blue-600" />,
      medication: <Pill className="h-4 w-4 text-purple-600" />,
      hygiene: <Heart className="h-4 w-4 text-green-600" />,
      nutrition: <Target className="h-4 w-4 text-orange-600" />,
      monitoring: <Eye className="h-4 w-4 text-gray-600" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  const filteredRiskAssessments = riskAssessments.filter(assessment => {
    const animal = animals.find(a => a.id === assessment.animalId);
    const speciesMatch = !selectedSpecies || (animal && animal.species === selectedSpecies);
    const riskMatch = !selectedRiskLevel || assessment.riskLevel === selectedRiskLevel;
    return speciesMatch && riskMatch;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">نظام التنبؤ بالأمراض</h1>
          <p className="text-gray-600">ذكاء اصطناعي متقدم للتنبؤ المبكر بأمراض الثروة الحيوانية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="جميع الأنواع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الأنواع</SelectItem>
              <SelectItem value="cattle">أبقار</SelectItem>
              <SelectItem value="sheep">أغنام</SelectItem>
              <SelectItem value="goat">ماعز</SelectItem>
              <SelectItem value="chicken">دجاج</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="جميع المخاطر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع المخاطر</SelectItem>
              <SelectItem value="low">منخف��</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="high">عالي</SelectItem>
              <SelectItem value="critical">حرج</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={generateMockData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث التنبؤات
          </Button>

          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة تقييم يدوي
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حيوانات معرضة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {riskAssessments.filter(r => ['high', 'critical'].includes(r.riskLevel)).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              تحتاج متابعة فورية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنبؤات نشطة</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {predictions.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              قيد المراقبة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">خطط الوقاية</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {preventionPlans.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              برامج متاحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">دقة التنبؤ</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              87%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              آخر 30 يوماً
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">وقت التحذير</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              5.2
            </div>
            <p className="text-xs text-gray-600 mt-1">
              أيام متوسط
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
          <TabsTrigger value="predictions">التنبؤات</TabsTrigger>
          <TabsTrigger value="prevention">خطط الوقاية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              تقييمات المخاطر الحالية
            </h2>
            
            {filteredRiskAssessments.length > 0 ? (
              filteredRiskAssessments.map((assessment) => {
                const animal = animals.find(a => a.id === assessment.animalId);
                
                return (
                  <Card key={assessment.animalId} className="border-r-4 border-r-orange-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {animal && (
                            <>
                              <span className="text-2xl">{getSpeciesIcon(animal.species)}</span>
                              <div>
                                <h3 className="font-semibold text-lg">{animal.earTag}</h3>
                                <p className="text-sm text-gray-600">
                                  {getSpeciesLabel(animal.species)} - {animal.breed}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={getRiskBadgeColor(assessment.riskLevel)}>
                            {getRiskLabel(assessment.riskLevel)}
                          </Badge>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getRiskColor(assessment.riskLevel)}`}>
                              {assessment.probability}%
                            </div>
                            <p className="text-xs text-gray-600">احتمالية الإصابة</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            المرض المتوقع: {assessment.diseaseType}
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-700">الأعراض المتوقعة:</p>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {assessment.symptoms.map((symptom, idx) => (
                                  <li key={idx}>{symptom}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">عوامل الخطر:</p>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {assessment.riskFactors.map((factor, idx) => (
                                  <li key={idx}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            إجراءات الوقاية والعلاج
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-700">تدابير الوقاية:</p>
                              <ul className="text-sm text-blue-600 list-disc list-inside">
                                {assessment.preventionMeasures.map((measure, idx) => (
                                  <li key={idx}>{measure}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">الإجراءات الموصى بها:</p>
                              <ul className="text-sm text-green-600 list-disc list-inside">
                                {assessment.recommendedActions.map((action, idx) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {assessment.weatherImpact}%
                          </div>
                          <p className="text-xs text-gray-600">تأثير الطقس</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {assessment.seasonalRisk}%
                          </div>
                          <p className="text-xs text-gray-600">المخاطر الموسمية</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {assessment.groupRisk}%
                          </div>
                          <p className="text-xs text-gray-600">مخاطر القطيع</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-gray-600">
                            ثقة الذكاء الاصطناعي: {(assessment.aiConfidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 ml-1" />
                            تفاصيل أكثر
                          </Button>
                          <Button size="sm">
                            <Stethoscope className="h-4 w-4 ml-1" />
                            بدء الوقاية
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                  <p className="text-gray-500">لا توجد مخاطر مرضية عالية حالياً</p>
                  <p className="text-sm text-gray-400">جميع الحيوانات في حالة جيدة!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              التنبؤات النشطة
            </h2>
            
            {predictions.filter(p => p.status === 'active').map((prediction) => {
              const animal = animals.find(a => a.id === prediction.animalId);
              
              return (
                <Card key={prediction.id} className="border-2 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {animal && (
                          <>
                            <span className="text-2xl">{getSpeciesIcon(animal.species)}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{animal.earTag}</h3>
                              <p className="text-sm text-gray-600">
                                التنبؤ: {prediction.predictedDisease}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {prediction.earlyWarningDays} أيام
                          </div>
                          <p className="text-xs text-gray-600">تحذير مبكر</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getSeverityColor(prediction.severity)}`}>
                            {prediction.probability}%
                          </div>
                          <p className="text-xs text-gray-600">احتمالية</p>
                        </div>
                      </div>
                    </div>

                    <Tabs defaultValue="symptoms" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="symptoms">الأعراض</TabsTrigger>
                        <TabsTrigger value="prevention">الوقاية</TabsTrigger>
                        <TabsTrigger value="treatment">العلاج</TabsTrigger>
                        <TabsTrigger value="monitoring">المراقبة</TabsTrigger>
                      </TabsList>

                      <TabsContent value="symptoms">
                        <ul className="space-y-2">
                          {prediction.symptoms.map((symptom, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>

                      <TabsContent value="prevention">
                        <ul className="space-y-2">
                          {prediction.preventionPlan.map((plan, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{plan}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>

                      <TabsContent value="treatment">
                        <ul className="space-y-2">
                          {prediction.treatmentSuggestions.map((treatment, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{treatment}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>

                      <TabsContent value="monitoring">
                        <ul className="space-y-2">
                          {prediction.monitoringRequired.map((monitor, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-purple-500" />
                              <span className="text-sm">{monitor}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                      <span className="text-sm text-gray-600">
                        تم إنشاؤه: {new Date(prediction.createdAt).toLocaleDateString('ar-TN')}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <XCircle className="h-4 w-4 ml-1" />
                          إيقاف التنبؤ
                        </Button>
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 ml-1" />
                          تأكيد التشخيص
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Prevention Tab */}
        <TabsContent value="prevention" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              خطط الوقاية المتاحة
            </h2>
            
            {preventionPlans.map((plan) => (
              <Card key={plan.id} className="border-2 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.title}</h3>
                      <p className="text-sm text-gray-600">
                        الهدف: {plan.targetDisease} | المدة: {plan.duration} يوم
                      </p>
                      <div className="flex gap-2 mt-2">
                        {plan.species.map((species, idx) => (
                          <Badge key={idx} variant="outline">
                            {getSpeciesIcon(species)} {getSpeciesLabel(species)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {plan.effectiveness}%
                      </div>
                      <p className="text-xs text-gray-600">فعالية</p>
                      <p className="text-sm font-medium mt-1">
                        التكلفة: {plan.cost} د.ت
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">الإجراءات المطلوبة:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plan.actions.map((action, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                          {getActionTypeIcon(action.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">اليوم {action.day}</p>
                            <p className="text-sm text-gray-600">{action.action}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {action.cost} د.ت
                              </span>
                              <Badge 
                                variant="outline" 
                                className={
                                  action.priority === 'high' ? 'text-red-600' :
                                  action.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                }
                              >
                                {action.priority === 'high' ? 'عالي' :
                                 action.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan.notes && (
                    <Alert className="mt-4">
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>{plan.notes}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 ml-1" />
                      تفاصيل كاملة
                    </Button>
                    <Button size="sm">
                      <Calendar className="h-4 w-4 ml-1" />
                      تطبيق الخطة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  توزيع المخاطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['critical', 'high', 'medium', 'low'].map((level, idx) => {
                    const count = riskAssessments.filter(r => r.riskLevel === level).length;
                    const percentage = riskAssessments.length > 0 ? (count / riskAssessments.length) * 100 : 0;
                    
                    return (
                      <div key={level} className="flex items-center justify-between">
                        <span className="text-sm">{getRiskLabel(level)}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-20" />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  أكثر الأمراض شيوعاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['التهاب الضرع', 'الإسهال المعدي', 'التهاب المفاصل', 'أمراض الجهاز التنفسي'].map((disease, idx) => {
                    const percentage = [35, 25, 20, 20][idx];
                    
                    return (
                      <div key={disease} className="flex items-center justify-between">
                        <span className="text-sm">{disease}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-16" />
                          <span className="text-sm font-medium w-8">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                إحصائيات الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">87%</div>
                  <p className="text-sm text-gray-600">دقة التنبؤ</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">5.2</div>
                  <p className="text-sm text-gray-600">أيام تحذير مبكر</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">92%</div>
                  <p className="text-sm text-gray-600">نجاح الوقاية</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">73%</div>
                  <p className="text-sm text-gray-600">تقليل التكاليف</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LivestockDiseasePredictor;
