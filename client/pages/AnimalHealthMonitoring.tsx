import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  Heart, 
  Calendar as CalendarIcon, 
  Syringe, 
  AlertTriangle, 
  FileText, 
  Plus,
  Bell,
  Activity,
  Thermometer,
  Weight,
  Stethoscope,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VaccinationRecord {
  vaccineType: string;
  dateAdministered: string;
  nextDueDate: string;
  veterinarian: string;
  batchNumber: string;
  sideEffects?: string;
}

interface HealthRecord {
  id: string;
  animalId: string;
  date: string;
  checkType: 'routine' | 'illness' | 'injury' | 'vaccination' | 'breeding';
  veterinarian: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  notes?: string;
  followUpDate?: string;
  cost: number;
}

interface Animal {
  id: string;
  earTag: string;
  species: string;
  breed: string;
  healthStatus: string;
  lastHealthCheck: string;
  vaccinationStatus: VaccinationRecord[];
}

interface HealthAlert {
  id: string;
  animalId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  dateCreated: string;
  resolved: boolean;
}

const checkTypeTranslation = {
  routine: 'فحص دوري',
  illness: 'مرض',
  injury: 'إصابة',
  vaccination: 'تطعيم',
  breeding: 'تناسل'
};

const severityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

export default function AnimalHealthMonitoring() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      // Fetch animals
      const animalsResponse = await fetch('/api/livestock-management/animals');
      const animalsData = await animalsResponse.json();
      
      // Fetch health alerts
      const alertsResponse = await fetch('/api/livestock-management/health-alerts');
      const alertsData = await alertsResponse.json();
      
      if (animalsData.success) setAnimals(animalsData.data);
      if (alertsData.success) setAlerts(alertsData.data);
      
      // Generate sample health records
      setHealthRecords(generateHealthRecords(animalsData.data || []));
      
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHealthRecords = (animalsList: Animal[]): HealthRecord[] => {
    const records: HealthRecord[] = [];
    const checkTypes = ['routine', 'illness', 'vaccination', 'breeding'] as const;
    const veterinarians = [
      'د. أحمد محمد الطبيب البيطري',
      'د. فاطمة علي البيطرية',
      'د. محمود حسن الاختصاصي',
      'د. سارة يوسف البيطرية'
    ];
    
    animalsList.forEach((animal, animalIndex) => {
      // Generate 3-8 health records per animal
      const recordCount = 3 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < recordCount; i++) {
        const checkType = checkTypes[Math.floor(Math.random() * checkTypes.length)];
        const date = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        
        records.push({
          id: `health_${animalIndex}_${i}`,
          animalId: animal.id,
          date: date.toISOString().split('T')[0],
          checkType,
          veterinarian: veterinarians[Math.floor(Math.random() * veterinarians.length)],
          symptoms: checkType === 'illness' ? getRandomSymptoms() : undefined,
          diagnosis: checkType === 'illness' ? getRandomDiagnosis() : undefined,
          treatment: getRandomTreatment(checkType),
          medications: checkType !== 'routine' ? getRandomMedications() : undefined,
          notes: getRandomNotes(checkType),
          followUpDate: Math.random() > 0.7 ? 
            new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
            undefined,
          cost: Math.round((50 + Math.random() * 200) * 10) / 10
        });
      }
    });
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getRandomSymptoms = (): string[] => {
    const symptoms = [
      'انخفاض الشهية',
      'ارتفاع درجة الحرارة',
      'إفرازات أنفية',
      'سعال',
      'إسهال',
      'عرج',
      'خمول',
      'فقدان الوزن',
      'صعوبة التنفس',
      'تورم'
    ];
    
    const count = 1 + Math.floor(Math.random() * 3);
    return symptoms.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const getRandomDiagnosis = (): string => {
    const diagnoses = [
      'التهاب الجهاز التنفسي',
      'اضطرابات هضمية',
      'التهاب المفاصل',
      'عدوى بكتيرية',
      'نقص فيتامينات',
      'طفيليات داخلية',
      'التهاب الضرع',
      'حمى الحليب',
      'التهاب الحوافر',
      'اضطرابات تناسلية'
    ];
    
    return diagnoses[Math.floor(Math.random() * diagnoses.length)];
  };

  const getRandomTreatment = (checkType: string): string => {
    const treatments = {
      routine: 'ف��ص شامل وقائي',
      illness: 'علاج دوائي مع المتابعة',
      injury: 'تنظيف الجرح وتضميده',
      vaccination: 'إعطاء اللقاح المقرر',
      breeding: 'فحص الجهاز التناسلي'
    };
    
    return treatments[checkType as keyof typeof treatments] || 'علاج عام';
  };

  const getRandomMedications = (): string[] => {
    const medications = [
      'مضاد حيوي - أموكسيسيلين',
      'مضاد التهاب - ديكلوفيناك',
      'مسكن ألم - ميتاميزول',
      'فيتامينات متعددة',
      'مضاد طفيليات',
      'مقوي عام',
      'مكمل معدني',
      'دواء مضاد للحمى'
    ];
    
    const count = 1 + Math.floor(Math.random() * 2);
    return medications.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const getRandomNotes = (checkType: string): string => {
    const notes = {
      routine: 'الحيوان في حالة صحية جيدة، يُنصح بالمتابعة الدورية',
      illness: 'تم وصف العلاج المناسب، يتطلب متابعة خلال أسبوع',
      injury: 'إصابة طفيفة، الشفاء متوقع خلال أسبوعين',
      vaccination: 'تم إعطاء الل��اح بنجاح، مراقبة أي أعراض جانبية',
      breeding: 'الفحص إيجابي، متابعة الحمل ضرورية'
    };
    
    return notes[checkType as keyof typeof notes] || 'لا توجد ملاحظات إضافية';
  };

  const getUpcomingVaccinations = () => {
    const upcoming: { animal: Animal; vaccination: VaccinationRecord }[] = [];
    
    animals.forEach(animal => {
      animal.vaccinationStatus.forEach(vaccination => {
        const dueDate = new Date(vaccination.nextDueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysUntilDue >= 0 && daysUntilDue <= 30) {
          upcoming.push({ animal, vaccination });
        }
      });
    });
    
    return upcoming.sort((a, b) => 
      new Date(a.vaccination.nextDueDate).getTime() - new Date(b.vaccination.nextDueDate).getTime()
    );
  };

  const getHealthStatistics = () => {
    const totalAnimals = animals.length;
    const healthyAnimals = animals.filter(a => ['excellent', 'good'].includes(a.healthStatus)).length;
    const sickAnimals = animals.filter(a => a.healthStatus === 'sick').length;
    const recentCheckups = healthRecords.filter(r => {
      const recordDate = new Date(r.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return recordDate >= thirtyDaysAgo;
    }).length;
    
    return {
      totalAnimals,
      healthyAnimals,
      sickAnimals,
      healthyPercentage: Math.round((healthyAnimals / totalAnimals) * 100),
      recentCheckups
    };
  };

  const filteredRecords = healthRecords.filter(record => {
    if (selectedAnimal !== 'all' && record.animalId !== selectedAnimal) return false;
    return true;
  });

  const upcomingVaccinations = getUpcomingVaccinations();
  const healthStats = getHealthStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل بيانات المراقبة الصحية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">مراقبة صحة الحي��انات</h1>
          <p className="text-muted-foreground">نظام متكامل للمراقبة الصحية والتطعيمات والسجلات الطبية</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 ml-2" />
          إضافة فحص جديد
        </Button>
      </div>

      {/* Health Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحيوانات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthStats.totalAnimals}</div>
            <p className="text-xs text-muted-foreground">جميع الحيوانات المسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحيوانات السليمة</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthStats.healthyAnimals}</div>
            <p className="text-xs text-muted-foreground">{healthStats.healthyPercentage}% من الإجمالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحيوانات المريضة</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{healthStats.sickAnimals}</div>
            <p className="text-xs text-muted-foreground">تحتاج عناية طبية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفحوصات الأخيرة</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{healthStats.recentCheckups}</div>
            <p className="text-xs text-muted-foreground">خلال 30 يوم الماضية</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Health Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              التنبيهات الصحية النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(alert => !alert.resolved).slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${severityColors[alert.severity]}`} />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.dateCreated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity === 'critical' ? 'حرج' :
                       alert.severity === 'high' ? 'عالي' :
                       alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                    <Button variant="outline" size="sm">حل</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="records" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records">السجلات الطبية</TabsTrigger>
          <TabsTrigger value="vaccinations">جدول التطعيمات</TabsTrigger>
          <TabsTrigger value="schedule">جدولة الفحوصات</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={selectedAnimal}
                  onChange={(e) => setSelectedAnimal(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">جميع الحيوانات</option>
                  {animals.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.earTag} - {animal.breed}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Health Records */}
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const animal = animals.find(a => a.id === record.animalId);
              return (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          فحص {animal?.earTag} - {checkTypeTranslation[record.checkType]}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.date), 'PPP', { locale: ar })} - {record.veterinarian}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {record.cost} د.ت
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {record.symptoms && (
                        <div>
                          <h4 className="font-medium mb-2">الأعراض:</h4>
                          <ul className="text-sm text-muted-foreground">
                            {record.symptoms.map((symptom, index) => (
                              <li key={index}>• {symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {record.diagnosis && (
                        <div>
                          <h4 className="font-medium mb-2">التشخيص:</h4>
                          <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium mb-2">العلاج:</h4>
                        <p className="text-sm text-muted-foreground">{record.treatment}</p>
                      </div>
                      
                      {record.medications && (
                        <div>
                          <h4 className="font-medium mb-2">الأدوية:</h4>
                          <ul className="text-sm text-muted-foreground">
                            {record.medications.map((medication, index) => (
                              <li key={index}>• {medication}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {record.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">ملاحظات:</h4>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                    
                    {record.followUpDate && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                        <Clock className="h-4 w-4" />
                        موعد المتابعة: {format(new Date(record.followUpDate), 'PPP', { locale: ar })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="vaccinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                التطعيمات المقررة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingVaccinations.map((item, index) => {
                  const daysUntilDue = Math.ceil(
                    (new Date(item.vaccination.nextDueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
                  );
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          daysUntilDue <= 2 ? 'bg-red-500' :
                          daysUntilDue <= 7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <h4 className="font-medium">{item.animal.earTag} - {item.vaccination.vaccineType}</h4>
                          <p className="text-sm text-muted-foreground">
                            موعد الاستحقاق: {format(new Date(item.vaccination.nextDueDate), 'PPP', { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={daysUntilDue <= 2 ? 'destructive' : daysUntilDue <= 7 ? 'secondary' : 'outline'}>
                          {daysUntilDue} يوم
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Syringe className="w-4 h-4 ml-1" />
                          تطعيم
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {upcomingVaccinations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد تطعيمات مقررة خلال الشهر القادم
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  ��قويم الفحوصات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Scheduled Checkups */}
            <Card>
              <CardHeader>
                <CardTitle>الفحوصات المقررة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  سيتم تطوير جدولة الفحوصات قريباً...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
