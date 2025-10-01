import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  History,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  DollarSign,
  Target,
  Award,
  Activity,
  Eye,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pause,
  RotateCcw,
  Star,
  ThumbsUp,
  ThumbsDown,
  FileText,
  ChevronDown,
  ExternalLink,
  PieChart,
  BarChart2,
  LineChart
} from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart as RechartsLineChart, Line, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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

interface TreatmentStats {
  totalTreatments: number;
  completed: number;
  active: number;
  successRate: number;
  averageRecovery: number;
  totalCost: number;
  averageDuration: number;
}

const TreatmentHistory: React.FC = () => {
  const navigate = useNavigate();
  
  const [treatments, setTreatments] = useState<TreatmentHistory[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<TreatmentHistory[]>([]);
  const [stats, setStats] = useState<TreatmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    status: 'all',
    cropType: 'all',
    dateFrom: '',
    dateTo: '',
    successOnly: false
  });

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Paused: 'bg-yellow-100 text-yellow-800',
    Failed: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    Active: Activity,
    Completed: CheckCircle,
    Paused: Pause,
    Failed: XCircle,
    Cancelled: AlertTriangle
  };

  const fetchTreatmentHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/disease-treatment/history/user-123');
      const data = await response.json();

      if (data.success) {
        const treatmentHistory = data.data.map((treatment: any) => ({
          ...treatment,
          startDate: new Date(treatment.startDate),
          endDate: treatment.endDate ? new Date(treatment.endDate) : undefined
        }));
        setTreatments(treatmentHistory);
      }
    } catch (error) {
      console.error('Error fetching treatment history:', error);
      toast.error('فشل في جلب تاريخ العلاجات');
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatmentStats = async () => {
    try {
      const response = await fetch('/api/disease-treatment/stats/user-123');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching treatment stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...treatments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(treatment =>
        treatment.cropId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(treatment => treatment.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(treatment => treatment.startDate >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(treatment => treatment.startDate <= toDate);
    }

    // Success only filter
    if (filters.successOnly) {
      filtered = filtered.filter(treatment => 
        treatment.status === 'Completed' && treatment.results.diseaseEliminated
      );
    }

    // Sort by start date (newest first)
    filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    setFilteredTreatments(filtered);
  };

  const exportToCSV = () => {
    const headers = ['التاريخ', 'المحصول', 'الحالة', 'المدة', 'الفعالية', 'التكلفة', 'النجاح'];
    const csvData = filteredTreatments.map(treatment => [
      treatment.startDate.toLocaleDateString('ar-EG'),
      treatment.cropId,
      treatment.status,
      treatment.endDate 
        ? Math.ceil((treatment.endDate.getTime() - treatment.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : '--',
      `${treatment.progress.effectiveness}%`,
      `${treatment.results.costActual.toFixed(2)} د.ت`,
      treatment.results.diseaseEliminated ? 'نجح' : 'لم ينجح'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تاريخ_العلاجات_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} د.ت`;
  };

  const getDuration = (startDate: Date, endDate?: Date) => {
    const end = endDate || new Date();
    const diffTime = end.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Chart data preparation
  const getSuccessRateData = () => {
    const completed = treatments.filter(t => t.status === 'Completed');
    const successful = completed.filter(t => t.results.diseaseEliminated);
    const failed = completed.filter(t => !t.results.diseaseEliminated);
    
    return [
      { name: 'نجح', value: successful.length, color: '#10b981' },
      { name: 'فشل', value: failed.length, color: '#ef4444' },
      { name: 'قيد التنفيذ', value: treatments.filter(t => t.status === 'Active').length, color: '#3b82f6' }
    ];
  };

  const getEffectivenessData = () => {
    return treatments.slice(0, 10).map((treatment, index) => ({
      name: `${treatment.cropId.slice(-3)}`,
      effectiveness: treatment.progress.effectiveness,
      recovery: treatment.results.cropRecovery,
      cost: treatment.results.costActual
    }));
  };

  const getCostTrendData = () => {
    const sortedTreatments = [...treatments]
      .filter(t => t.status === 'Completed')
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(-12);

    return sortedTreatments.map(treatment => ({
      date: treatment.startDate.toLocaleDateString('ar-EG', { month: 'short' }),
      cost: treatment.results.costActual,
      effectiveness: treatment.progress.effectiveness
    }));
  };

  useEffect(() => {
    fetchTreatmentHistory();
    fetchTreatmentStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [treatments, searchTerm, filters]);

  const successRateData = getSuccessRateData();
  const effectivenessData = getEffectivenessData();
  const costTrendData = getCostTrendData();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button
            onClick={() => navigate('/treatment-recommendations')}
          >
            علاج جديد
          </Button>
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          تاريخ العلاجات والتحليلات
        </h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalTreatments}</div>
              <div className="text-sm text-muted-foreground">إجمالي العلاجات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">نسبة النجاح</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageRecovery.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">متوسط التعافي</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalCost)}</div>
              <div className="text-sm text-muted-foreground">إجمالي التكلفة</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">تاريخ العلاجات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="insights">الرؤى والتوصيات</TabsTrigger>
        </TabsList>

        {/* Treatment History Tab */}
        <TabsContent value="history" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                الفلاتر والبحث
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>البحث</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="ابحث في المحاصيل..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="Active">نشط</option>
                    <option value="Completed">مكتمل</option>
                    <option value="Paused">متوقف</option>
                    <option value="Failed">فاشل</option>
                    <option value="Cancelled">ملغي</option>
                  </select>
                </div>
                <div>
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.successOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, successOnly: e.target.checked }))}
                    />
                    <span className="text-sm">العلاجات الناجحة فقط</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  عرض {filteredTreatments.length} من {treatments.length} علاج
                </div>
                <CardTitle>قائمة العلاجات</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredTreatments.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد علاجات</h3>
                  <p className="text-muted-foreground mb-4">
                    لا توجد علاجات تطابق معايير البحث
                  </p>
                  <Button onClick={() => navigate('/treatment-recommendations')}>
                    إنشاء علاج جديد
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTreatments.map((treatment) => {
                    const StatusIcon = statusIcons[treatment.status];
                    const duration = getDuration(treatment.startDate, treatment.endDate);
                    
                    return (
                      <Card key={treatment.historyId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/treatment-progress/${treatment.historyId}`)}
                                  >
                                    <Eye className="h-4 w-4 ml-2" />
                                    عرض التفاصيل
                                  </DropdownMenuItem>
                                  {treatment.status === 'Active' && (
                                    <DropdownMenuItem>
                                      <Activity className="h-4 w-4 ml-2" />
                                      تحديث التقدم
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            <div className="flex-1 text-right">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={`${statusColors[treatment.status]} text-sm px-3 py-1`}>
                                    <StatusIcon className="h-3 w-3 ml-1" />
                                    {treatment.status === 'Active' && 'نشط'}
                                    {treatment.status === 'Completed' && 'مكتمل'}
                                    {treatment.status === 'Paused' && 'متوقف'}
                                    {treatment.status === 'Failed' && 'فاشل'}
                                    {treatment.status === 'Cancelled' && 'ملغي'}
                                  </Badge>
                                  {treatment.results.diseaseEliminated && (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 ml-1" />
                                      نجح
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-semibold">{treatment.cropId}</h4>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-muted-foreground">تاريخ البدء: </span>
                                  <span className="font-medium">{treatment.startDate.toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">المدة: </span>
                                  <span className="font-medium">{duration} يوم</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">الفعالية: </span>
                                  <span className="font-medium">{treatment.progress.effectiveness}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">التكلفة: </span>
                                  <span className="font-medium">{formatCurrency(treatment.results.costActual)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                  تعافي المحصول: {treatment.results.cropRecovery}%
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">التقدم:</span>
                                  <Progress 
                                    value={(treatment.progress.completedSteps.length / 3) * 100} 
                                    className="w-20 h-2" 
                                  />
                                  <span className="text-xs font-medium">
                                    {treatment.progress.completedSteps.length}/3
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع نتائج العلاجات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={successRateData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {successRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Effectiveness Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  فعالية العلاجات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={effectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="effectiveness" fill="#3b82f6" name="الفعالية %" />
                    <Bar dataKey="recovery" fill="#10b981" name="التعافي %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  اتجاه التكلفة والفعالية عبر الزمن
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={costTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="cost" orientation="right" />
                    <YAxis yAxisId="effectiveness" orientation="left" />
                    <Tooltip />
                    <Line 
                      yAxisId="cost"
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="التكلفة (د.ت)"
                    />
                    <Line 
                      yAxisId="effectiveness"
                      type="monotone" 
                      dataKey="effectiveness" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="الفعالية %"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  أفضل الممارسات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">العلاجات التي تم تطبيقها في الوقت المناسب كانت أكثر نجاحاً بنسبة 35%</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">استخدام العلاجات المتكاملة يقلل التكلفة بمتوسط 20%</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">المتابعة الدورية تزيد نسبة نجاح العلاج إلى 85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  توصيات للتحسين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">ركز على الكشف المبكر ��تقليل شدة الإصابة</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">استخدم العلاجات الوقائية في المواسم عالية الخطورة</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">طبق نظام المراقبة المنتظمة لتقليل فقدان المحصول</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreatmentHistory;
