import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Package, 
  BarChart3, 
  PieChart, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Plus,
  Calendar,
  Target,
  Award,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  nameAr: string;
  role: 'farmer' | 'agronomist' | 'trader' | 'consultant' | 'investor';
  type: 'free' | 'basic' | 'professional' | 'enterprise';
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  featuresAr: string[];
  maxUsers: number;
  maxFarms: number;
  isPopular: boolean;
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
  lastPayment?: {
    amount: number;
    date: string;
    method: string;
    status: 'success' | 'failed' | 'pending';
  };
}

interface PlatformMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  trialUsers: number;
  conversionRate: number;
  churnRate: number;
  averageRevenuePerUser: number;
  growthRate: number;
}

interface UsageAnalytics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  topFeatures: Array<{
    name: string;
    nameAr: string;
    usage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  usersByRole: Record<string, number>;
  usersByRegion: Record<string, number>;
}

const SaaSManagement: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, analyticsRes, subscriptionsRes, plansRes] = await Promise.all([
        fetch(`/api/saas/metrics?period=${selectedPeriod}`),
        fetch(`/api/saas/analytics?period=${selectedPeriod}`),
        fetch('/api/saas/subscriptions'),
        fetch('/api/saas/plans')
      ]);

      const [metricsData, analyticsData, subscriptionsData, plansData] = await Promise.all([
        metricsRes.json(),
        analyticsRes.json(),
        subscriptionsRes.json(),
        plansRes.json()
      ]);

      if (metricsData.success) setMetrics(metricsData.data);
      if (analyticsData.success) setAnalytics(analyticsData.data);
      if (subscriptionsData.success) setSubscriptions(subscriptionsData.data);
      if (plansData.success) setPlans(plansData.data);
    } catch (error) {
      console.error('Error fetching SaaS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      farmer: 'مزارع',
      agronomist: 'مهندس زراعي',
      trader: 'تاجر',
      consultant: 'مستشار',
      investor: 'مستثمر'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'نشط',
      trial: 'تجريبي',
      expired: 'منتهي',
      cancelled: 'ملغي',
      pending: 'قيد الانتظار'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  if (loading && !metrics) {
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة منصة SaaS</h1>
          <p className="text-gray-600">لوحة تحكم شاملة للاشتراكات والتحليلات والإيرادات</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 أيام</SelectItem>
              <SelectItem value="30d">30 يوم</SelectItem>
              <SelectItem value="90d">90 يوم</SelectItem>
              <SelectItem value="1y">سنة</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchDashboardData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          <Button className="gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalUsers.toLocaleString('ar-TN')}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">+{metrics.growthRate}%</span>
                <span className="text-xs text-gray-500">هذا الشهر</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.activeSubscriptions.toLocaleString('ar-TN')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                معدل التحويل: {metrics.conversionRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(metrics.monthlyRevenue)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                متوسط الإيراد لكل مستخدم: {formatCurrency(metrics.averageRevenuePerUser)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون التجريبيون</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.trialUsers.toLocaleString('ar-TN')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                معدل الانسحاب: {metrics.churnRate}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="billing">الفوترة</TabsTrigger>
          <TabsTrigger value="referrals">الإحالات</TabsTrigger>
          <TabsTrigger value="ai-insights">رؤى ذكية</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Analytics Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  أكثر الميزات استخداماً
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {analytics.topFeatures.map((feature, index) => (
                      <div key={feature.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{feature.nameAr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(feature.trend)}
                          <span className="font-bold">{feature.usage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Distribution by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع المستخدمين حسب الدور
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {Object.entries(analytics.usersByRole).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="font-medium">{getRoleLabel(role)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{count}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ 
                                width: `${analytics ? (count / Object.values(analytics.usersByRole).reduce((a, b) => a + b, 0)) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                النشاط ال��خير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    تم تحديث نماذج الذكاء الاصطناعي بنجاح - تحسن دقة التوصيات بنسبة 15%
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    ارتفاع معدل التحويل من التجربة المجانية إلى الاشتراك المدفوع إلى 24%
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    تحذير: 15 مستخدم تجريبي ستنتهي صلاحيتهم خلال 3 أيام
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {subscriptions.slice(0, 9).map((subscription) => {
              const plan = plans.find(p => p.id === subscription.planId);
              const daysLeft = subscription.endDate ? 
                Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <Card key={subscription.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan?.nameAr}</CardTitle>
                        <p className="text-sm text-gray-600">{getRoleLabel(plan?.role || '')}</p>
                      </div>
                      <Badge className={getStatusColor(subscription.status)}>
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">السعر</p>
                        <p className="font-bold text-lg">{plan ? formatCurrency(plan.price) : 'مجاني'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">المدة المتبقية</p>
                        <p className="font-medium">{daysLeft} يوم</p>
                      </div>
                    </div>

                    {subscription.status === 'trial' && subscription.trialEndDate && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">فترة تجريبية</p>
                        <p className="text-sm">
                          تنتهي في: {new Date(subscription.trialEndDate).toLocaleDateString('ar-TN')}
                        </p>
                      </div>
                    )}

                    {subscription.lastPayment && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">آخر دفعة</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            {formatCurrency(subscription.lastPayment.amount)}
                          </span>
                          <Badge className={subscription.lastPayment.status === 'success' ? 
                            'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {subscription.lastPayment.status === 'success' ? 'نجح' : 'فشل'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        تفاصيل
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        إدارة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab - More detailed analytics will be here */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الاستخدام اليومي</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>المستخدمون النشطون يومياً</span>
                      <span className="font-bold text-2xl text-blue-600">
                        {analytics.dailyActiveUsers.toLocaleString('ar-TN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>المستخدمون النشطون شهرياً</span>
                      <span className="font-bold text-2xl text-green-600">
                        {analytics.monthlyActiveUsers.toLocaleString('ar-TN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>متوسط مدة الجلسة</span>
                      <span className="font-bold text-2xl text-orange-600">
                        {Math.round(analytics.averageSessionDuration / 60)} دقيقة
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التوزيع الجغرافي</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-3">
                    {Object.entries(analytics.usersByRegion).map(([region, count]) => (
                      <div key={region} className="flex items-center justify-between">
                        <span className="font-medium">{region}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ 
                                width: `${(count / Object.values(analytics.usersByRegion).reduce((a, b) => a + b, 0)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs will be implemented in subsequent components */}
        <TabsContent value="billing">
          <Card>
            <CardContent className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-gray-500">نظام الفوترة قيد التطوير</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardContent className="text-center py-8">
              <Award className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-gray-500">برنامج الإحالات قيد التطوير</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights">
          <Card>
            <CardContent className="text-center py-8">
              <Zap className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-gray-500">الرؤى الذكية قيد التطوير</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SaaSManagement;
