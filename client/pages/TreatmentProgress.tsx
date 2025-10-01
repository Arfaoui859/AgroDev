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
  Activity, 
  Calendar, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Eye,
  Heart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Camera,
  FileText,
  Plus,
  Edit,
  Star,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Target,
  Zap,
  DollarSign,
  Timer,
  Users,
  MessageSquare,
  Award,
  Shield,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';

interface TreatmentHistory {
  historyId: string;
  userId: string;
  planId: string;
  cropId: string;
  startDate: Date;
  endDate?: Date;
  status: 'Active' | 'Completed' | 'Paused' | 'Failed' | 'Cancelled';
  progress: {
    completedSteps: number[];
    currentStep: number;
    effectiveness: number;
    sideEffects: string[];
    farmerNotes: string[];
  };
  results: {
    diseaseEliminated: boolean;
    cropRecovery: number;
    yieldImpact: number;
    costActual: number;
    timeToRecovery: number;
  };
  followUpAlerts: string[];
}

interface ProgressUpdate {
  date: Date;
  stepCompleted?: number;
  effectiveness: number;
  notes: string;
  sideEffects: string[];
  photos?: File[];
  symptoms: {
    spreading: boolean;
    severity: 'Improving' | 'Same' | 'Worsening';
    newSymptoms: string[];
  };
}

const TreatmentProgress: React.FC = () => {
  const { historyId } = useParams();
  const navigate = useNavigate();
  
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate>({
    date: new Date(),
    effectiveness: 50,
    notes: '',
    sideEffects: [],
    symptoms: {
      spreading: false,
      severity: 'Same',
      newSymptoms: []
    }
  });

  const [completionData, setCompletionData] = useState({
    diseaseEliminated: false,
    cropRecovery: 0,
    yieldImpact: 0,
    costActual: 0,
    overallRating: 5,
    wouldRecommend: true,
    finalNotes: ''
  });

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Paused: 'bg-yellow-100 text-yellow-800',
    Failed: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-800'
  };

  const fetchTreatmentHistory = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch specific treatment history by ID
      const response = await fetch(`/api/disease-treatment/history/user-123`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // For demo, use the first item
        const history = {
          ...data.data[0],
          startDate: new Date(data.data[0].startDate),
          endDate: data.data[0].endDate ? new Date(data.data[0].endDate) : undefined
        };
        setTreatmentHistory(history);
      }
    } catch (error) {
      console.error('Error fetching treatment history:', error);
      toast.error('فشل في جلب تاريخ العلاج');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    if (!treatmentHistory) return;

    try {
      const response = await fetch(`/api/disease-treatment/progress/${treatmentHistory.historyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepCompleted: progressUpdate.stepCompleted,
          effectiveness: progressUpdate.effectiveness,
          notes: progressUpdate.notes,
          sideEffects: progressUpdate.sideEffects
        })
      });

      const data = await response.json();

      if (data.success) {
        setTreatmentHistory(data.data);
        setShowUpdateDialog(false);
        toast.success('تم تحديث التقدم بنجاح');
        
        // Reset form
        setProgressUpdate({
          date: new Date(),
          effectiveness: 50,
          notes: '',
          sideEffects: [],
          symptoms: {
            spreading: false,
            severity: 'Same',
            newSymptoms: []
          }
        });
      } else {
        toast.error(data.message || 'فشل في تحديث التقدم');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('حدث خطأ في تحديث التقدم');
    }
  };

  const completeTreatment = async () => {
    if (!treatmentHistory) return;

    try {
      const response = await fetch(`/api/disease-treatment/complete/${treatmentHistory.historyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: completionData
        })
      });

      const data = await response.json();

      if (data.success) {
        setTreatmentHistory(data.data);
        setShowCompleteDialog(false);
        toast.success('تم إنهاء العلاج بنجاح');
      } else {
        toast.error(data.message || 'فشل في إنهاء العلاج');
      }
    } catch (error) {
      console.error('Error completing treatment:', error);
      toast.error('حدث خطأ في إنهاء العلاج');
    }
  };

  const calculateProgressPercentage = () => {
    if (!treatmentHistory) return 0;
    
    const totalSteps = 3; // Assuming 3 steps in treatment plan
    const completedSteps = treatmentHistory.progress.completedSteps.length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const getDaysInTreatment = () => {
    if (!treatmentHistory) return 0;
    
    const endDate = treatmentHistory.endDate || new Date();
    const diffTime = endDate.getTime() - treatmentHistory.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.ت`;
  };

  useEffect(() => {
    fetchTreatmentHistory();
  }, [historyId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!treatmentHistory) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">سجل العلاج غير موجود</h3>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على سجل العلاج المطلوب
            </p>
            <Button onClick={() => navigate('/treatment-history')}>
              عرض تاريخ العلاجات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = calculateProgressPercentage();
  const daysInTreatment = getDaysInTreatment();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/treatment-history')}
          >
            تاريخ العلاجات
          </Button>
          {treatmentHistory.status === 'Active' && (
            <>
              <Button
                onClick={() => setShowUpdateDialog(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                تحديث التقدم
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(true)}
              >
                <CheckCircle className="h-4 w-4 ml-2" />
                إنهاء العلاج
              </Button>
            </>
          )}
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          متابعة العلاج
        </h1>
      </div>

      {/* Treatment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className={`${statusColors[treatmentHistory.status]} text-sm px-3 py-1`}>
              {treatmentHistory.status === 'Active' && 'نشط'}
              {treatmentHistory.status === 'Completed' && 'مكتمل'}
              {treatmentHistory.status === 'Paused' && 'متوقف'}
              {treatmentHistory.status === 'Failed' && 'فاشل'}
              {treatmentHistory.status === 'Cancelled' && 'ملغي'}
            </Badge>
            <CardTitle className="text-xl">
              علاج: {treatmentHistory.cropId}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{daysInTreatment}</div>
                <div className="text-sm text-muted-foreground">يوم في العلاج</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{progressPercentage}%</div>
                <div className="text-sm text-muted-foreground">نسبة الإنجاز</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{treatmentHistory.progress.effectiveness}%</div>
                <div className="text-sm text-muted-foreground">الفعالية</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(treatmentHistory.results.costActual)}
                </div>
                <div className="text-sm text-muted-foreground">التكلفة الفعلية</div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>الخطوة {treatmentHistory.progress.currentStep} من 3</span>
              <span>التقدم الإجمالي</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Treatment Dates */}
          <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>بدأ في: {treatmentHistory.startDate.toLocaleDateString('ar-EG')}</span>
            </div>
            {treatmentHistory.endDate && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>انتهى في: {treatmentHistory.endDate.toLocaleDateString('ar-EG')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="progress">التقدم</TabsTrigger>
          <TabsTrigger value="notes">الملاحظات</TabsTrigger>
          <TabsTrigger value="results">النتائج</TabsTrigger>
          <TabsTrigger value="timeline">الجدول الزمني</TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Treatment Steps Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  خطوات العلاج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        treatmentHistory.progress.completedSteps.includes(step) 
                          ? 'bg-green-600' 
                          : treatmentHistory.progress.currentStep === step
                          ? 'bg-blue-600'
                          : 'bg-gray-400'
                      }`}>
                        {treatmentHistory.progress.completedSteps.includes(step) ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          step
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          خطوة {step}: {
                            step === 1 ? 'العلاج الأولي' :
                            step === 2 ? 'العلاج التكميلي' :
                            'الوقاية طويلة المدى'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {treatmentHistory.progress.completedSteps.includes(step) 
                            ? 'مكتملة' 
                            : treatmentHistory.progress.currentStep === step
                            ? 'جاري��'
                            : 'في الانتظار'
                          }
                        </div>
                      </div>
                      <Badge variant={
                        treatmentHistory.progress.completedSteps.includes(step) 
                          ? 'default' 
                          : treatmentHistory.progress.currentStep === step
                          ? 'secondary'
                          : 'outline'
                      }>
                        {treatmentHistory.progress.completedSteps.includes(step) 
                          ? 'مكتمل' 
                          : treatmentHistory.progress.currentStep === step
                          ? 'نشط'
                          : 'معلق'
                        }
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Effectiveness Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مؤشرات الفعالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">فعالية العلاج</span>
                      <span className="text-sm text-muted-foreground">{treatmentHistory.progress.effectiveness}%</span>
                    </div>
                    <Progress value={treatmentHistory.progress.effectiveness} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">تعافي المحصول</span>
                      <span className="text-sm text-muted-foreground">{treatmentHistory.results.cropRecovery}%</span>
                    </div>
                    <Progress value={treatmentHistory.results.cropRecovery} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {treatmentHistory.results.diseaseEliminated ? 'نجح' : 'جاري'}
                      </div>
                      <div className="text-xs text-muted-foreground">القضاء على المرض</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {treatmentHistory.results.timeToRecovery || '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">أيام للتعافي</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Effects Alert */}
          {treatmentHistory.progress.sideEffects.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>أعراض جانبية محتملة:</strong>
                <ul className="list-disc list-inside mt-2">
                  {treatmentHistory.progress.sideEffects.map((effect, index) => (
                    <li key={index}>{effect}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                ملاحظات المزارع
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatmentHistory.progress.farmerNotes.length > 0 ? (
                <div className="space-y-3">
                  {treatmentHistory.progress.farmerNotes.map((note, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد ملاحظات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  نتائج العلاج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>القضاء على المرض</span>
                    <Badge variant={treatmentHistory.results.diseaseEliminated ? 'default' : 'secondary'}>
                      {treatmentHistory.results.diseaseEliminated ? 'نجح' : 'جاري'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>تعافي المحصول</span>
                    <span className="font-medium">{treatmentHistory.results.cropRecovery}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>تأثير على الإنتاج</span>
                    <span className={`font-medium ${
                      treatmentHistory.results.yieldImpact >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {treatmentHistory.results.yieldImpact >= 0 ? '+' : ''}{treatmentHistory.results.yieldImpact}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>وقت التعافي</span>
                    <span className="font-medium">{treatmentHistory.results.timeToRecovery || '--'} يوم</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  التحليل المالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>التكلفة الفعلية</span>
                    <span className="font-medium">{formatCurrency(treatmentHistory.results.costActual)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>التوفير المتوقع</span>
                    <span className="font-medium text-green-600">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>العائد على الاستثمار</span>
                    <span className="font-medium">--</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                الجدول الزمني للعلاج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">بدء العلاج</div>
                    <div className="text-sm text-muted-foreground">
                      {treatmentHistory.startDate.toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                </div>
                
                {treatmentHistory.progress.completedSteps.map((step) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">اكتمال الخطوة {step}</div>
                      <div className="text-sm text-muted-foreground">
                        تم بنجاح
                      </div>
                    </div>
                  </div>
                ))}

                {treatmentHistory.endDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">انتهاء العلاج</div>
                      <div className="text-sm text-muted-foreground">
                        {treatmentHistory.endDate.toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Progress Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تحديث تقدم العلاج</DialogTitle>
            <DialogDescription className="text-right">
              سجل التطورات الحديثة في حالة المحصول
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>خطوة مكتملة (اختياري)</Label>
              <select
                value={progressUpdate.stepCompleted || ''}
                onChange={(e) => setProgressUpdate(prev => ({ 
                  ...prev, 
                  stepCompleted: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">لم تكتمل خطوة جديدة</option>
                <option value="1">الخطوة 1: العلاج الأولي</option>
                <option value="2">الخطوة 2: العلاج التكميلي</option>
                <option value="3">الخطوة 3: الوقاية طويلة المدى</option>
              </select>
            </div>
            
            <div>
              <Label>فعالية العلاج الحالية (%)</Label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressUpdate.effectiveness}
                  onChange={(e) => setProgressUpdate(prev => ({ 
                    ...prev, 
                    effectiveness: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
                <div className="text-center text-sm font-medium">
                  {progressUpdate.effectiveness}%
                </div>
              </div>
            </div>
            
            <div>
              <Label>ملاحظات ومشاهدات</Label>
              <Textarea
                value={progressUpdate.notes}
                onChange={(e) => setProgressUpdate(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="صف التطورات التي لاحظتها في حالة المحصول..."
                rows={4}
              />
            </div>
            
            <div>
              <Label>أعراض جانبية (إن وجدت)</Label>
              <Input
                value={progressUpdate.sideEffects.join(', ')}
                onChange={(e) => setProgressUpdate(prev => ({ 
                  ...prev, 
                  sideEffects: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                }))}
                placeholder="مثال: اصفرار الأوراق، تأخر النمو"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={updateProgress}>
              حفظ التحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Treatment Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إنهاء العلاج</DialogTitle>
            <DialogDescription className="text-right">
              أدخل النتائج النهائية للعلاج
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={completionData.diseaseEliminated}
                onChange={(e) => setCompletionData(prev => ({ 
                  ...prev, 
                  diseaseEliminated: e.target.checked 
                }))}
              />
              <Label>تم القضاء على المرض بنجاح</Label>
            </div>
            
            <div>
              <Label>نسبة تعافي المحصول (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={completionData.cropRecovery}
                onChange={(e) => setCompletionData(prev => ({ 
                  ...prev, 
                  cropRecovery: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div>
              <Label>تأثير على الإنتاج (% تغيير)</Label>
              <Input
                type="number"
                min="-100"
                max="100"
                value={completionData.yieldImpact}
                onChange={(e) => setCompletionData(prev => ({ 
                  ...prev, 
                  yieldImpact: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div>
              <Label>التكلفة الفعلية (د.ت)</Label>
              <Input
                type="number"
                min="0"
                value={completionData.costActual}
                onChange={(e) => setCompletionData(prev => ({ 
                  ...prev, 
                  costActual: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div>
              <Label>تقييم العلاج (1-10)</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setCompletionData(prev => ({ ...prev, overallRating: rating }))}
                    className={`w-8 h-8 rounded-full text-sm font-medium ${
                      rating <= completionData.overallRating
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label>ملاحظات نهائية</Label>
              <Textarea
                value={completionData.finalNotes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, finalNotes: e.target.value }))}
                placeholder="ملاحظات نهائية عن تجربة العلاج..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={completeTreatment}>
              إنهاء العلاج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreatmentProgress;
