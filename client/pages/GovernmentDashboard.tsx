import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, TrendingUp, TrendingDown, MapPin, FileText, Settings, 
         BarChart3, Users, DollarSign, AlertTriangle, CheckCircle, Clock,
         Shield, Target, Zap, Activity, ChevronRight, Eye, Briefcase,
         PieChart, LineChart, Globe, Flag, Award, Search, Filter } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart } from 'recharts';

interface Region {
  regionId: string;
  regionName: string;
  regionNameArabic: string;
  production: number;
  farmCount: number;
}

interface KeyMetrics {
  totalProduction: number;
  totalRevenue: number;
  activePolicies: number;
  totalBeneficiaries: number;
  activeAlerts: number;
  complianceRate: number;
  totalRegions: number;
  totalFarms: number;
}

interface CropPerformance {
  cropType: string;
  cropTypeArabic: string;
  production: number;
  revenue: number;
  efficiency: number;
}

interface MonthlyTrend {
  month: number;
  production: number;
  averagePrice: number;
  qualityScore: number;
}

interface Policy {
  id: string;
  title: string;
  titleArabic: string;
  type: string;
  typeArabic: string;
  status: string;
  statusArabic: string;
  budgetAllocated: number;
  budgetSpent: number;
  beneficiaries: number;
  effectivenessScore: number;
  impact: {
    productionIncrease: number;
    qualityImprovement: number;
    farmerSatisfaction: number;
    economicBenefit: number;
  };
}

interface CrisisAlert {
  id: string;
  type: string;
  typeArabic: string;
  severity: string;
  severityArabic: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  affectedRegions: string[];
  estimatedImpact: {
    productionLoss: number;
    economicLoss: number;
    farmersAffected: number;
    areaAffected: number;
  };
  status: string;
  statusArabic: string;
  reportedAt: string;
}

interface ComplianceStats {
  compliant: number;
  partial: number;
  nonCompliant: number;
  pending: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function GovernmentDashboard() {
  const { isArabic } = useLanguage();
  const [overviewData, setOverviewData] = useState<any>(null);
  const [productionData, setProductionData] = useState<any>(null);
  const [policiesData, setPoliciesData] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [crisisData, setCrisisData] = useState<any>(null);
  const [regionsData, setRegionsData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedPolicy, setSelectedPolicy] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch('/api/government-dashboard/overview').then(res => res.json()),
      fetch('/api/government-dashboard/production').then(res => res.json()),
      fetch('/api/government-dashboard/policies').then(res => res.json()),
      fetch('/api/government-dashboard/compliance').then(res => res.json()),
      fetch('/api/government-dashboard/crisis-alerts').then(res => res.json()),
      fetch('/api/government-dashboard/regions').then(res => res.json()),
      fetch('/api/government-dashboard/budget').then(res => res.json())
    ]).then(([overview, production, policies, compliance, crisis, regions, budget]) => {
      setOverviewData(overview.data);
      setProductionData(production.data);
      setPoliciesData(policies.data);
      setComplianceData(compliance.data);
      setCrisisData(crisis.data);
      setRegionsData(regions.data);
      setBudgetData(budget.data);
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching government dashboard data:', error);
      setLoading(false);
    });
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return `$${formatNumber(num)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {isArabic ? 'جاري تحميل بيانات لوحة التحكم الحكومية...' : 'Loading Government Dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  const keyMetrics: KeyMetrics = overviewData?.keyMetrics || {};
  const productionByRegion: Region[] = overviewData?.productionByRegion || [];
  const cropPerformance: CropPerformance[] = overviewData?.cropPerformance || [];
  const monthlyTrends: MonthlyTrend[] = overviewData?.monthlyTrends || [];

  return (
    <div className="space-y-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isArabic ? 'لوحة تحكم مسؤول الجهة الحكومية' : 'Government Official Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'مراقبة الإنتاج الزراعي وإدارة السياسات الحكومية' : 'Agricultural production monitoring and policy management'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            {isArabic ? 'تصدير التقرير' : 'Export Report'}
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700">
            <Settings className="h-4 w-4" />
            {isArabic ? 'إعدادات السياسة' : 'Policy Settings'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              {isArabic ? 'إجمالي الإنتاج' : 'Total Production'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatNumber(keyMetrics.totalProduction)} {isArabic ? 'طن' : 'tons'}</div>
            <p className="text-xs text-green-600">
              {isArabic ? `عبر ${keyMetrics.totalRegions} مناطق` : `Across ${keyMetrics.totalRegions} regions`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(keyMetrics.totalRevenue)}</div>
            <p className="text-xs text-blue-600">
              {isArabic ? `من ${keyMetrics.totalFarms} مزرعة` : `From ${keyMetrics.totalFarms} farms`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              {isArabic ? 'السياسات النشطة' : 'Active Policies'}
            </CardTitle>
            <Flag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{keyMetrics.activePolicies}</div>
            <p className="text-xs text-purple-600">
              {isArabic ? `${formatNumber(keyMetrics.totalBeneficiaries)} مستفيد` : `${formatNumber(keyMetrics.totalBeneficiaries)} beneficiaries`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              {isArabic ? 'معدل الامتثال' : 'Compliance Rate'}
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{keyMetrics.complianceRate}%</div>
            <p className="text-xs text-orange-600">
              {keyMetrics.activeAlerts > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {isArabic ? `${keyMetrics.activeAlerts} تنبيه نشط` : `${keyMetrics.activeAlerts} active alerts`}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="text-xs">{isArabic ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="production" className="text-xs">{isArabic ? 'الإنتاج' : 'Production'}</TabsTrigger>
          <TabsTrigger value="policies" className="text-xs">{isArabic ? 'السياسات' : 'Policies'}</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs">{isArabic ? 'الامتثال' : 'Compliance'}</TabsTrigger>
          <TabsTrigger value="crisis" className="text-xs">{isArabic ? 'إدارة الأزمات' : 'Crisis Mgmt'}</TabsTrigger>
          <TabsTrigger value="budget" className="text-xs">{isArabic ? 'الميزان��ة' : 'Budget'}</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">{isArabic ? 'التحليلات' : 'Analytics'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production by Region */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  {isArabic ? 'الإنتاج حسب المنطقة' : 'Production by Region'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={productionByRegion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={isArabic ? "regionNameArabic" : "regionName"} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="production" fill="#10b981" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Crops */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  {isArabic ? 'أفضل المحاصيل أداءً' : 'Top Performing Crops'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cropPerformance.slice(0, 5).map((crop, index) => (
                    <div key={crop.cropType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold
                          ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{isArabic ? crop.cropTypeArabic : crop.cropType}</p>
                          <p className="text-sm text-gray-600">{formatNumber(crop.production)} {isArabic ? 'طن' : 'tons'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(crop.revenue)}</p>
                        <p className="text-sm text-gray-600">{crop.efficiency.toFixed(2)} {isArabic ? 'كفاءة' : 'efficiency'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-purple-600" />
                {isArabic ? 'الاتجاهات الشهرية' : 'Monthly Trends'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="production" stroke="#10b981" strokeWidth={3} name={isArabic ? 'الإنتاج' : 'Production'} />
                  <Line yAxisId="right" type="monotone" dataKey="averagePrice" stroke="#3b82f6" strokeWidth={2} name={isArabic ? 'متوسط السعر' : 'Avg Price'} />
                  <Line yAxisId="right" type="monotone" dataKey="qualityScore" stroke="#f59e0b" strokeWidth={2} name={isArabic ? 'نقاط الجودة' : 'Quality Score'} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          {overviewData?.recentAlerts && overviewData.recentAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  {isArabic ? 'التنبيهات الحديثة' : 'Recent Alerts'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overviewData.recentAlerts.slice(0, 3).map((alert: CrisisAlert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{isArabic ? alert.titleArabic : alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{isArabic ? alert.descriptionArabic : alert.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>{isArabic ? 'المزارعون المتأثرون:' : 'Affected farmers:'} {alert.estimatedImpact.farmersAffected}</span>
                            <span>{isArabic ? 'الخسائر الاقتصادية:' : 'Economic loss:'} {formatCurrency(alert.estimatedImpact.economicLoss)}</span>
                          </div>
                        </div>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {isArabic ? alert.severityArabic : alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? 'اختر المنطقة' : 'Select Region'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? 'جميع المناطق' : 'All Regions'}</SelectItem>
                {regionsData?.regions?.map((region: any) => (
                  <SelectItem key={region.id} value={region.id}>
                    {isArabic ? region.nameArabic : region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production by Crop */}
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'الإنتاج حسب المحصول' : 'Production by Crop'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={productionData?.productionByCrop || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="volume"
                      label={(entry) => isArabic ? entry.cropTypeArabic : entry.cropType}
                    >
                      {(productionData?.productionByCrop || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'توزيع الجودة' : 'Quality Distribution'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productionData?.qualityDistribution && Object.entries(productionData.qualityDistribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${
                          grade === 'A' ? 'bg-green-500' : 
                          grade === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span>{isArabic ? `الدرجة ${grade}` : `Grade ${grade}`}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'ملخص الإنتاج' : 'Production Summary'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{formatNumber(productionData?.summary?.totalVolume || 0)}</div>
                  <div className="text-sm text-green-600">{isArabic ? 'إجمالي الحجم (طن)' : 'Total Volume (tons)'}</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{formatNumber(productionData?.summary?.totalArea || 0)}</div>
                  <div className="text-sm text-blue-600">{isArabic ? 'إجمالي المساحة (هكتار)' : 'Total Area (hectares)'}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{formatCurrency(productionData?.summary?.totalRevenue || 0)}</div>
                  <div className="text-sm text-purple-600">{isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">{productionData?.summary?.averageYield || 0}</div>
                  <div className="text-sm text-orange-600">{isArabic ? 'متوسط الإنتاجية' : 'Average Yield'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{policiesData?.summary?.total || 0}</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'إجمالي السياسات' : 'Total Policies'}</p>
                  </div>
                  <Flag className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{policiesData?.summary?.active || 0}</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'السياسات النشطة' : 'Active Policies'}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(policiesData?.summary?.totalBudget || 0)}</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'إجمالي الميزانية' : 'Total Budget'}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(policiesData?.summary?.totalBeneficiaries || 0)}</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'إجمالي المستفيدين' : 'Total Beneficiaries'}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'قائمة السياسات' : 'Policy List'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policiesData?.policies?.map((policy: Policy) => (
                  <div key={policy.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{isArabic ? policy.titleArabic : policy.title}</h4>
                        <p className="text-sm text-gray-600">{isArabic ? policy.descriptionArabic : policy.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                          {isArabic ? policy.statusArabic : policy.status}
                        </Badge>
                        <Badge variant="outline">
                          {isArabic ? policy.typeArabic : policy.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">{isArabic ? 'الميزانية:' : 'Budget:'}</span>
                        <span className="font-semibold ml-1">{formatCurrency(policy.budgetAllocated)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{isArabic ? 'المستفيدون:' : 'Beneficiaries:'}</span>
                        <span className="font-semibold ml-1">{formatNumber(policy.beneficiaries)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{isArabic ? 'الفعالية:' : 'Effectiveness:'}</span>
                        <span className="font-semibold ml-1">{policy.effectivenessScore}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{isArabic ? 'الاستخدام:' : 'Utilization:'}</span>
                        <span className="font-semibold ml-1">{Math.round((policy.budgetSpent / policy.budgetAllocated) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {complianceData?.statistics && Object.entries(complianceData.statistics).map(([status, count]) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{count as number}</p>
                      <p className="text-sm text-gray-600">
                        {isArabic ? 
                          (status === 'compliant' ? 'ملتزم' : 
                           status === 'partial' ? 'جزئي' : 
                           status === 'nonCompliant' ? 'غير ملتزم' : 'قيد المراجعة') :
                          status
                        }
                      </p>
                    </div>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      status === 'compliant' ? 'bg-green-100' : 
                      status === 'partial' ? 'bg-yellow-100' : 
                      status === 'nonCompliant' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {status === 'compliant' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                       status === 'partial' ? <Clock className="h-4 w-4 text-yellow-600" /> :
                       status === 'nonCompliant' ? <AlertCircle className="h-4 w-4 text-red-600" /> :
                       <Eye className="h-4 w-4 text-gray-600" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'معدل الامتثال العام' : 'Overall Compliance Rate'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{complianceData?.complianceRate || 0}%</div>
                <p className="text-gray-600">{isArabic ? 'من إجمالي السجلات' : 'of total records'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crisis Management Tab */}
        <TabsContent value="crisis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {crisisData?.alertsByType && Object.entries(crisisData.alertsByType).map(([type, count]) => (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{count as number}</p>
                      <p className="text-sm text-gray-600">
                        {isArabic ? 
                          (type === 'weather' ? 'طقس' : 
                           type === 'disease' ? 'مرض' : 
                           type === 'pest' ? 'آفة' : 
                           type === 'market' ? 'سوق' : 'إمداد') :
                          type
                        }
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'التنبيهات حسب الشدة' : 'Alerts by Severity'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={crisisData?.alertsBySeverity ? Object.entries(crisisData.alertsBySeverity).map(([severity, count]) => ({
                        name: isArabic ? 
                          (severity === 'low' ? 'منخفض' : 
                           severity === 'medium' ? 'متوسط' : 
                           severity === 'high' ? 'عالي' : 'حرج') : severity,
                        value: count
                      })) : []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {Object.entries(crisisData?.alertsBySeverity || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'ملخص التأثير' : 'Impact Summary'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">{isArabic ? 'الخسائر الاقتصادية' : 'Economic Loss'}</span>
                    <span className="font-semibold text-red-600">{formatCurrency(crisisData?.impactSummary?.totalEconomicLoss || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm">{isArabic ? 'المزارعون المتأثرون' : 'Farmers Affected'}</span>
                    <span className="font-semibold text-orange-600">{formatNumber(crisisData?.impactSummary?.totalFarmersAffected || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">{isArabic ? 'المساحة المتأثرة' : 'Area Affected'}</span>
                    <span className="font-semibold text-yellow-600">{formatNumber(crisisData?.impactSummary?.totalAreaAffected || 0)} {isArabic ? 'هكتار' : 'ha'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'التنبيهات النشطة' : 'Active Alerts'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crisisData?.alerts?.filter((alert: CrisisAlert) => alert.status === 'active').map((alert: CrisisAlert) => (
                  <div key={alert.id} className={`p-4 border-l-4 rounded-lg ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{isArabic ? alert.titleArabic : alert.title}</h4>
                        <p className="text-gray-600 mt-1">{isArabic ? alert.descriptionArabic : alert.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-500">{isArabic ? 'المزارعون:' : 'Farmers:'}</span>
                            <span className="font-semibold ml-1">{alert.estimatedImpact.farmersAffected}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{isArabic ? 'المساحة:' : 'Area:'}</span>
                            <span className="font-semibold ml-1">{formatNumber(alert.estimatedImpact.areaAffected)} {isArabic ? 'هكتار' : 'ha'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{isArabic ? 'فقدان الإنتاج:' : 'Production Loss:'}</span>
                            <span className="font-semibold ml-1">{alert.estimatedImpact.productionLoss}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{isArabic ? 'الخسائر:' : 'Loss:'}</span>
                            <span className="font-semibold ml-1">{formatCurrency(alert.estimatedImpact.economicLoss)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {isArabic ? alert.severityArabic : alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {isArabic ? alert.typeArabic : alert.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(budgetData?.summary?.totalAllocated || 0)}</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'إجمالي المخصص' : 'Total Allocated'}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(budgetData?.summary?.totalSpent || 0)}</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'إجمالي المنفق' : 'Total Spent'}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{budgetData?.summary?.overallUtilization || 0}%</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'معدل الاستخدام' : 'Utilization Rate'}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(budgetData?.summary?.totalBeneficiaries || 0)}</p>
                    <p className="text-sm text-gray-600">{isArabic ? 'إجمالي المستفيدين' : 'Total Beneficiaries'}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'الميزانية حسب الفئة' : 'Budget by Category'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={budgetData?.budgets || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={isArabic ? "categoryArabic" : "category"} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="allocated" fill="#3b82f6" name={isArabic ? 'مخصص' : 'Allocated'} />
                    <Bar dataKey="spent" fill="#10b981" name={isArabic ? 'منفق' : 'Spent'} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'أداء البرامج' : 'Program Performance'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetData?.budgets?.flatMap((budget: any) => budget.programs || []).map((program: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{isArabic ? program.nameArabic : program.name}</h4>
                        <span className="text-sm font-semibold text-green-600">{program.impact}% {isArabic ? 'تأثير' : 'impact'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">{isArabic ? 'الميزانية:' : 'Budget:'}</span>
                          <span className="font-semibold ml-1">{formatCurrency(program.budget)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{isArabic ? 'المنفق:' : 'Spent:'}</span>
                          <span className="font-semibold ml-1">{formatCurrency(program.spent)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{isArabic ? 'المستفيدون:' : 'Beneficiaries:'}</span>
                          <span className="font-semibold ml-1">{program.beneficiaries}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'اتجاهات الإنتاجية' : 'Productivity Trends'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="production" stackId="1" stroke="#10b981" fill="#10b981" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'كفاءة السياسات' : 'Policy Efficiency'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {policiesData?.policies?.slice(0, 5).map((policy: Policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{isArabic ? policy.titleArabic : policy.title}</h4>
                        <p className="text-sm text-gray-600">{formatNumber(policy.beneficiaries)} {isArabic ? 'مستفيد' : 'beneficiaries'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">{policy.effectivenessScore}%</div>
                        <div className="text-sm text-gray-600">{isArabic ? 'فعالية' : 'effectiveness'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? 'المؤشرات الرئيسية للأداء' : 'Key Performance Indicators'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-green-700 mb-2">+15%</div>
                  <div className="text-sm text-green-600">{isArabic ? 'نمو الإنتاج السنوي' : 'Annual Production Growth'}</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-blue-700 mb-2">{keyMetrics.complianceRate}%</div>
                  <div className="text-sm text-blue-600">{isArabic ? 'معدل الامتثال' : 'Compliance Rate'}</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-purple-700 mb-2">87%</div>
                  <div className="text-sm text-purple-600">{isArabic ? 'كفاءة السياسات' : 'Policy Efficiency'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
