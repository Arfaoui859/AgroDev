import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { 
  Heart, 
  Dna, 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  Star,
  Baby,
  Users,
  BarChart3,
  PieChart,
  Sparkles,
  Plus,
  Edit,
  Eye,
  Calculator,
  Lightbulb,
  Activity,
  Zap,
  Shield
} from 'lucide-react';

interface Animal {
  id: string;
  earTag: string;
  name?: string;
  species: 'cattle' | 'sheep' | 'goat' | 'chicken' | 'turkey' | 'duck';
  breed: string;
  gender: 'male' | 'female';
  birthDate: string;
  weight: number;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'dry' | 'quarantine';
  geneticData?: GeneticProfile;
  productionHistory: ProductionRecord[];
}

interface GeneticProfile {
  bloodline: string;
  heritabilityTraits: {
    milkProduction?: number;
    eggProduction?: number;
    growthRate?: number;
    diseaseResistance?: number;
    fertilityRate?: number;
    meatQuality?: number;
  };
  inbreedingCoefficient: number;
  parentalLineage: string[];
}

interface ProductionRecord {
  id: string;
  date: string;
  type: 'milk' | 'eggs' | 'wool' | 'meat';
  quantity: number;
  unit: string;
  quality: 'A' | 'B' | 'C' | 'rejected';
}

interface BreedingRecommendation {
  male: Animal;
  female: Animal;
  compatibilityScore: number;
  recommendedDate: string;
  expectedOutcome: string;
  geneticAdvantages: string[];
  potentialRisks: string[];
  recommendations: string[];
}

interface BreedingSchedule {
  recommendedPairings: BreedingRecommendation[];
  seasonalRecommendations: string[];
}

const IntelligentBreedingManager: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [breedingSchedule, setBreedingSchedule] = useState<BreedingSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [isBreedingDialogOpen, setIsBreedingDialogOpen] = useState(false);
  const [selectedMale, setSelectedMale] = useState<string>('');
  const [selectedFemale, setSelectedFemale] = useState<string>('');
  const [compatibilityResult, setCompatibilityResult] = useState<any>(null);

  useEffect(() => {
    fetchAnimals();
    fetchBreedingRecommendations();
  }, [selectedSpecies]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSpecies) params.append('species', selectedSpecies);
      
      const response = await fetch(`/api/animals?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAnimals(data.data);
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBreedingRecommendations = async () => {
    try {
      const response = await fetch('/api/breeding-recommendations');
      const data = await response.json();
      
      if (data.success) {
        setBreedingSchedule(data.data);
      }
    } catch (error) {
      console.error('Error fetching breeding recommendations:', error);
    }
  };

  const checkCompatibility = async () => {
    if (!selectedMale || !selectedFemale) return;
    
    try {
      const male = animals.find(a => a.id === selectedMale);
      const female = animals.find(a => a.id === selectedFemale);
      
      if (!male || !female) return;
      
      // Mock compatibility calculation for demo
      const mockResult = {
        compatibilityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        geneticAdvantages: [
          'تنوع جيني ممتاز يقلل من مخاطر الأمراض الوراثية',
          'وراثة ممتازة لصفة إنتاج الحليب',
          'أعمار مثالية للتناسل'
        ],
        potentialRisks: [
          'مراقبة مطلوبة لحالة الأم الصحية',
          'تأكد من التغذية المناسبة قبل التلقيح'
        ],
        recommendations: [
          'التلقيح الموصى به في الربيع القادم',
          'تعزيز التغذية قبل شهر من التلقيح',
          'مراقبة دورية للحالة الصحية'
        ]
      };
      
      setCompatibilityResult(mockResult);
    } catch (error) {
      console.error('Error checking compatibility:', error);
    }
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

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    if (score >= 60) return 'مقبول';
    return 'ضعيف';
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    
    if (months < 12) {
      return `${months} شهر`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 ? `${years} سنة و ${remainingMonths} شهر` : `${years} سنة`;
    }
  };

  const breedingAnimals = animals.filter(animal => 
    animal.gender === 'female' && 
    ['healthy', 'dry'].includes(animal.status)
  );

  const maleAnimals = animals.filter(animal => 
    animal.gender === 'male' && 
    animal.status === 'healthy'
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة التناسل الذكية</h1>
          <p className="text-gray-600">تحسين وراثي بالذكاء الاصطناعي وتوصيات تزاوج متقدمة</p>
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

          <Dialog open={isBreedingDialogOpen} onOpenChange={setIsBreedingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Calculator className="h-4 w-4" />
                فحص التوافق الوراثي
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>فحص التوافق الوراثي</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الذكر</Label>
                    <Select value={selectedMale} onValueChange={setSelectedMale}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الذكر" />
                      </SelectTrigger>
                      <SelectContent>
                        {maleAnimals.map(animal => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {getSpeciesIcon(animal.species)} {animal.earTag} - {animal.breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الأنثى</Label>
                    <Select value={selectedFemale} onValueChange={setSelectedFemale}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الأنثى" />
                      </SelectTrigger>
                      <SelectContent>
                        {breedingAnimals.map(animal => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {getSpeciesIcon(animal.species)} {animal.earTag} - {animal.breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={checkCompatibility} 
                  disabled={!selectedMale || !selectedFemale}
                  className="w-full gap-2"
                >
                  <Dna className="h-4 w-4" />
                  تحليل التوافق الوراثي
                </Button>

                {compatibilityResult && (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        نتائج التحليل الوراثي
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getCompatibilityColor(compatibilityResult.compatibilityScore)}`}>
                          {compatibilityResult.compatibilityScore}%
                        </div>
                        <p className="text-lg font-medium">
                          {getCompatibilityLabel(compatibilityResult.compatibilityScore)}
                        </p>
                        <Progress value={compatibilityResult.compatibilityScore} className="mt-2" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-green-700 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            المزايا الوراثية
                          </h4>
                          <ul className="space-y-1">
                            {compatibilityResult.geneticAdvantages.map((advantage: string, idx: number) => (
                              <li key={idx} className="text-sm text-green-600">• {advantage}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-orange-700 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            المخاطر المحتملة
                          </h4>
                          <ul className="space-y-1">
                            {compatibilityResult.potentialRisks.map((risk: string, idx: number) => (
                              <li key={idx} className="text-sm text-orange-600">• {risk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          التوصيات
                        </h4>
                        <ul className="space-y-1">
                          {compatibilityResult.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-blue-600">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إناث للتلقيح</CardTitle>
            <Heart className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {breedingAnimals.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              جاهزة للموسم الجديد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ذكور مخصبة</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {maleAnimals.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              في حالة صحية ممتازة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حيوانات حامل</CardTitle>
            <Baby className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {animals.filter(a => a.status === 'pregnant').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              في فترات مختلفة من الحمل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة النجاح</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              87%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              للعام الماضي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          <TabsTrigger value="genetics">التحليل الوراثي</TabsTrigger>
          <TabsTrigger value="schedule">جدولة التناسل</TabsTrigger>
          <TabsTrigger value="performance">تحليل الأداء</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {breedingSchedule && breedingSchedule.recommendedPairings.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                أفضل الزوجات المقترحة
              </h2>
              
              {breedingSchedule.recommendedPairings.map((pairing, index) => (
                <Card key={index} className="border-2 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-800 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {getSpeciesIcon(pairing.male.species)} {pairing.male.earTag} × {pairing.female.earTag}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {pairing.male.breed} × {pairing.female.breed}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getCompatibilityColor(pairing.compatibilityScore)}`}>
                          {pairing.compatibilityScore}%
                        </div>
                        <p className="text-sm text-gray-600">توافق وراثي</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          المزايا الوراثية
                        </h4>
                        <ul className="space-y-1">
                          {pairing.geneticAdvantages.map((advantage, idx) => (
                            <li key={idx} className="text-sm text-green-600">• {advantage}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          المخاطر المحتملة
                        </h4>
                        <ul className="space-y-1">
                          {pairing.potentialRisks.map((risk, idx) => (
                            <li key={idx} className="text-sm text-orange-600">• {risk}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                          التوصيات
                        </h4>
                        <ul className="space-y-1">
                          {pairing.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-600">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-800">التاريخ المقترح للتلقيح</p>
                          <p className="text-sm text-blue-600">
                            {new Date(pairing.recommendedDate).toLocaleDateString('ar-TN')}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">النتيجة المتوقعة</p>
                          <p className="text-sm text-blue-600">{pairing.expectedOutcome}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="gap-1">
                        <Calendar className="h-4 w-4" />
                        جدولة التلقيح
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        تفاصيل أكثر
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Heart className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p className="text-gray-500">لا توجد توصيات تناسل حالياً</p>
                <p className="text-sm text-gray-400">تأكد من وجود ذكور وإناث مناسبة للتناسل</p>
              </CardContent>
            </Card>
          )}

          {/* Seasonal Recommendations */}
          {breedingSchedule && breedingSchedule.seasonalRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  التوصيات الموسمية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {breedingSchedule.seasonalRecommendations.map((rec, idx) => (
                    <Alert key={idx}>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Genetics Tab */}
        <TabsContent value="genetics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {animals.filter(animal => animal.geneticData).map((animal) => (
              <Card key={animal.id} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{getSpeciesIcon(animal.species)}</span>
                    {animal.earTag} - الملف الوراثي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {animal.geneticData && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">السلالة النقية</p>
                          <p className="font-medium">{animal.geneticData.bloodline}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">معامل التزاوج الداخلي</p>
                          <p className="font-medium">{(animal.geneticData.inbreedingCoefficient * 100).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">الصفات الوراثية</h4>
                        <div className="space-y-2">
                          {Object.entries(animal.geneticData.heritabilityTraits).map(([trait, value]) => {
                            const traitLabels = {
                              milkProduction: 'إنتاج الحليب',
                              eggProduction: 'إنتاج البيض',
                              growthRate: 'معدل النمو',
                              diseaseResistance: 'مقاومة الأمراض',
                              fertilityRate: 'معدل الخصوبة',
                              meatQuality: 'جودة اللحم'
                            };
                            
                            return (
                              <div key={trait} className="flex items-center justify-between">
                                <span className="text-sm">{traitLabels[trait as keyof typeof traitLabels]}</span>
                                <div className="flex items-center gap-2">
                                  <Progress value={value} className="w-20 h-2" />
                                  <span className="text-sm font-medium w-8">{value}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">السلسلة الوراثية</h4>
                        <div className="flex flex-wrap gap-2">
                          {animal.geneticData.parentalLineage.map((lineage, idx) => (
                            <Badge key={idx} variant="outline">{lineage}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                جدولة التناسل
              </CardTitle>
              <CardDescription>
                خطة زمنية مثالية للتناسل حسب الموسم والظروف المناخية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['الربيع', 'الصيف', 'الخريف', 'الشتاء'].map((season, idx) => (
                    <Card key={season} className="border-2">
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold mb-2">{season}</h3>
                        <div className="text-2xl mb-2">
                          {idx === 0 ? '🌸' : idx === 1 ? '☀️' : idx === 2 ? '🍂' : '❄️'}
                        </div>
                        <p className="text-sm text-gray-600">
                          {idx === 0 ? 'موسم مثالي للأبقار' :
                           idx === 1 ? 'فترة راحة' :
                           idx === 2 ? 'موسم الأغنام والماعز' :
                           'تحضير للموسم القادم'}
                        </p>
                        <div className="mt-2">
                          <Progress value={idx === 0 ? 90 : idx === 2 ? 80 : 30} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  معدلات النجاح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>معدل الحمل</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="font-bold">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>معدل الولادة الآمنة</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-20" />
                      <span className="font-bold">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>معدل بقاء الصغار</span>
                    <div className="flex items-center gap-2">
                      <Progress value={88} className="w-20" />
                      <span className="font-bold">88%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع الأنواع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['cattle', 'sheep', 'goat', 'chicken'].map((species) => {
                    const count = animals.filter(a => a.species === species).length;
                    const percentage = animals.length > 0 ? (count / animals.length) * 100 : 0;
                    
                    return (
                      <div key={species} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getSpeciesIcon(species)}</span>
                          <span>{getSpeciesLabel(species)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-16" />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentBreedingManager;
