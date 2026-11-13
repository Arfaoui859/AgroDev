import { apiFetch } from '@/lib/apiFetch';
import { asArray } from '@/lib/dashboardData';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
import { SimulatedDataNotice } from '@/components/SimulatedDataNotice';

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
  cost?: number;
}

interface Animal {
  id: string;
  earTag: string;
  species: string;
  breed: string;
  healthStatus: string;
  lastHealthCheck: string;
  vaccinationStatus: VaccinationRecord[];
  breedingHistory?: {
    matingDate: string;
    success: boolean;
  }[];
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
  const [loadError, setLoadError] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAnimal, setSelectedAnimal] = useState<string>('all');

  const { toast } = useToast();
  const [eventOpen, setEventOpen] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    animalId: '',
    eventType: 'checkup',
    severity: 'low',
    eventDate: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    treatment: '',
    veterinarian: '',
  });
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      // Fetch animals
      const animalsResponse = await apiFetch('/api/livestock-management/animals');
      const animalsData = await animalsResponse.json();
      
      // Fetch health alerts
      const alertsResponse = await apiFetch('/api/livestock-management/health-alerts');
      const alertsData = await alertsResponse.json();
      
      if (animalsData.success) setAnimals(asArray<Animal>(animalsData.data));
      if (alertsData.success) setAlerts(asArray<HealthAlert>(alertsData.data));
      setIsSimulated(animalsData.isRealData === false);

      // Records are built from the herd's own fields (vaccinations, last health
      // check, breeding events). Nothing is invented, so an animal with no
      // recorded illness simply shows no illness record.
      setHealthRecords(buildHealthRecords(asArray<Animal>(animalsData.data)));
    } catch (error) {
      console.error('Error fetching health data:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const openEventDialog = (animalId?: string, eventType = 'checkup') => {
    setEventForm({
      animalId: animalId ?? (animals[0]?.id ?? ''),
      eventType,
      severity: 'low',
      eventDate: new Date().toISOString().slice(0, 10),
      diagnosis: '',
      treatment: '',
      veterinarian: '',
    });
    setEventError(null);
    setEventOpen(true);
  };

  const submitHealthEvent = async () => {
    if (!eventForm.animalId) {
      setEventError('اختر الحيوان أولاً.');
      return;
    }
    setEventSaving(true);
    setEventError(null);
    try {
      const response = await apiFetch('/api/livestock-management/health-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setEventError('تعذّر حفظ الفحص. تحقّق من البيانات وحاول مجدداً.');
        return;
      }
      setEventOpen(false);
      toast({ title: 'تم حفظ الفحص الصحي' });
      await fetchHealthData();
    } catch {
      setEventError('تعذّر الاتصال بالخادم. لم يُحفظ أي شيء.');
    } finally {
      setEventSaving(false);
    }
  };

  const resolveAlert = async (alert: HealthAlert) => {
    // Only alerts backed by a real health-event row (UUID id) can be resolved;
    // status-derived alerts have no row to update.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alert.id)) return;
    setResolvingId(alert.id);
    try {
      const response = await apiFetch(`/api/livestock-management/health-events/${alert.id}/resolve`, {
        method: 'PATCH',
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        toast({ title: 'تم وضع علامة حل على التنبيه' });
        await fetchHealthData();
      } else {
        toast({ title: 'تعذّر تحديث التنبيه', variant: 'destructive' });
      }
    } finally {
      setResolvingId(null);
    }
  };

  const buildHealthRecords = (animalsList: Animal[]): HealthRecord[] => {
    const records: HealthRecord[] = [];

    animalsList.forEach((animal) => {
      animal.vaccinationStatus?.forEach((vax, i) => {
        records.push({
          id: `health_${animal.id}_vax_${i}`,
          animalId: animal.id,
          date: vax.dateAdministered,
          checkType: 'vaccination',
          veterinarian: vax.veterinarian,
          notes: `${vax.vaccineType} (دفعة ${vax.batchNumber})`,
        });
      });

      if (animal.lastHealthCheck) {
        records.push({
          id: `health_${animal.id}_check`,
          animalId: animal.id,
          date: animal.lastHealthCheck,
          checkType: 'routine',
          veterinarian: '—',
          notes: 'آخر فحص صحي مسجّل',
        });
      }

      animal.breedingHistory?.forEach((rec, i) => {
        records.push({
          id: `health_${animal.id}_breed_${i}`,
          animalId: animal.id,
          date: rec.matingDate,
          checkType: 'breeding',
          veterinarian: '—',
          notes: rec.success ? 'تناسل ناجح' : 'تناسل غير ناجح',
        });
      });
    });

    return records.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
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
      healthyPercentage:
        totalAnimals > 0 ? Math.round((healthyAnimals / totalAnimals) * 100) : 0,
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

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">تعذّر تحميل بيانات المراقبة الصحية</p>
          <p className="mt-2 text-sm text-muted-foreground">تحقّق من اتصال الخادم ثم أعد المحاولة.</p>
          <Button className="mt-4" onClick={fetchHealthData}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">مراقبة صحة الحيوانات</h1>
          <p className="text-muted-foreground">نظام متكامل للمراقبة الصحية والتطعيمات والسجلات الطبية</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => openEventDialog()}
          disabled={animals.length === 0}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة فحص جديد
        </Button>
      </div>

      {isSimulated && <SimulatedDataNotice />}

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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resolvingId === alert.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alert.id)}
                      onClick={() => void resolveAlert(alert)}
                    >
                      {resolvingId === alert.id ? 'جارٍ الحل…' : 'حل'}
                    </Button>
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
                      {record.cost !== undefined && (
                        <Badge variant="outline">{record.cost} د.ت</Badge>
                      )}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEventDialog(item.animal.id, 'vaccination')}
                        >
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
                  تقويم الفحوصات
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

      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل فحص صحي</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>الحيوان</Label>
              <Select
                value={eventForm.animalId}
                onValueChange={(v) => setEventForm((p) => ({ ...p, animalId: v }))}
              >
                <SelectTrigger><SelectValue placeholder="اختر الحيوان" /></SelectTrigger>
                <SelectContent>
                  {animals.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.earTag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>نوع الفحص</Label>
                <Select
                  value={eventForm.eventType}
                  onValueChange={(v) => setEventForm((p) => ({ ...p, eventType: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkup">فحص دوري</SelectItem>
                    <SelectItem value="vaccination">تطعيم</SelectItem>
                    <SelectItem value="treatment">علاج</SelectItem>
                    <SelectItem value="illness">مرض</SelectItem>
                    <SelectItem value="injury">إصابة</SelectItem>
                    <SelectItem value="deworming">مكافحة الديدان</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>الخطورة</Label>
                <Select
                  value={eventForm.severity}
                  onValueChange={(v) => setEventForm((p) => ({ ...p, severity: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="critical">حرجة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="eventDate">التاريخ</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm((p) => ({ ...p, eventDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vet">الطبيب البيطري</Label>
                <Input
                  id="vet"
                  value={eventForm.veterinarian}
                  onChange={(e) => setEventForm((p) => ({ ...p, veterinarian: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="diagnosis">التشخيص</Label>
              <Textarea
                id="diagnosis"
                value={eventForm.diagnosis}
                onChange={(e) => setEventForm((p) => ({ ...p, diagnosis: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="treatment">العلاج</Label>
              <Textarea
                id="treatment"
                value={eventForm.treatment}
                onChange={(e) => setEventForm((p) => ({ ...p, treatment: e.target.value }))}
              />
            </div>
            {eventError && <p className="text-sm text-red-600">{eventError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventOpen(false)} disabled={eventSaving}>
              إلغاء
            </Button>
            <Button onClick={() => void submitHealthEvent()} disabled={eventSaving}>
              {eventSaving ? 'جارٍ الحفظ…' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
