import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  FileText, 
  Target, 
  Zap, 
  Brain, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Users,
  DollarSign,
  ArrowUpRight,
  Lightbulb,
  Settings,
  Activity,
  Clock,
  ThumbsUp,
  Star,
  Globe,
  Building,
  Eye,
  Filter,
  Search,
  Plus,
  Download,
  Upload,
  Award,
  Lock,
  Unlock,
  TrendingUp,
  Database,
  Gavel,
  Copyright,
  Scale
} from 'lucide-react';

interface Patent {
  id: string;
  title: string;
  description: string;
  inventors: string[];
  assignee: string;
  applicationNumber: string;
  publicationNumber?: string;
  grantNumber?: string;
  filingDate: string;
  publicationDate?: string;
  grantDate?: string;
  expiryDate: string;
  status: 'draft' | 'filed' | 'published' | 'granted' | 'expired' | 'rejected' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  jurisdiction: string[];
  claims: string[];
  technologies: string[];
  relatedPatents: string[];
  commercialValue: number;
  maintenanceFees: { year: number; amount: number; paid: boolean; dueDate: string }[];
  prosecutionHistory: { date: string; action: string; description: string }[];
  licensing: {
    isLicensed: boolean;
    licensees: string[];
    royaltyRate?: number;
    revenue: number;
  };
  opposition?: {
    hasOpposition: boolean;
    opponents: string[];
    status: string;
  };
  attachment: string[];
}

interface Trademark {
  id: string;
  mark: string;
  type: 'word' | 'logo' | 'combined' | 'sound' | 'color';
  description: string;
  classes: number[];
  applicant: string;
  applicationNumber: string;
  registrationNumber?: string;
  filingDate: string;
  registrationDate?: string;
  expiryDate: string;
  status: 'applied' | 'examined' | 'opposed' | 'registered' | 'expired' | 'rejected';
  jurisdiction: string;
  goodsServices: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  renewalHistory: { date: string; period: number; fee: number }[];
  oppositions: { opponent: string; date: string; status: string; grounds: string }[];
  usage: {
    firstUse: string;
    commercialUse: string;
    marketValue: number;
  };
}

interface Copyright {
  id: string;
  title: string;
  type: 'literary' | 'artistic' | 'musical' | 'software' | 'database';
  description: string;
  author: string;
  owner: string;
  creationDate: string;
  registrationDate?: string;
  registrationNumber?: string;
  jurisdiction: string;
  duration: string;
  status: 'unregistered' | 'registered' | 'expired';
  commercialValue: number;
  licensing: {
    isLicensed: boolean;
    licensees: string[];
    revenue: number;
  };
  infringements: { date: string; infringer: string; status: string; resolution?: string }[];
}

interface License {
  id: string;
  type: 'patent' | 'trademark' | 'copyright';
  ipId: string;
  ipTitle: string;
  licensee: string;
  licensor: string;
  licenseType: 'exclusive' | 'non-exclusive' | 'sole';
  territory: string[];
  field: string;
  startDate: string;
  endDate: string;
  royaltyRate: number;
  minimumRoyalty: number;
  upfrontPayment: number;
  totalRevenue: number;
  status: 'active' | 'expired' | 'terminated' | 'suspended';
  terms: string[];
  milestones: { description: string; date: string; completed: boolean }[];
}

export default function PatentManagement() {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [trademarks, setTrademarks] = useState<Trademark[]>([]);
  const [copyrights, setCopyrights] = useState<Copyright[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedIP, setSelectedIP] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    jurisdiction: ''
  });

  useEffect(() => {
    loadPatents();
    loadTrademarks();
    loadCopyrights();
    loadLicenses();
  }, []);

  const loadPatents = async () => {
    try {
      const response = await fetch('/api/ip-management/patents');
      const data = await response.json();
      setPatents(data);
    } catch (error) {
      console.error('Error loading patents:', error);
    }
  };

  const loadTrademarks = async () => {
    try {
      const response = await fetch('/api/ip-management/trademarks');
      const data = await response.json();
      setTrademarks(data);
    } catch (error) {
      console.error('Error loading trademarks:', error);
    }
  };

  const loadCopyrights = async () => {
    try {
      const response = await fetch('/api/ip-management/copyrights');
      const data = await response.json();
      setCopyrights(data);
    } catch (error) {
      console.error('Error loading copyrights:', error);
    }
  };

  const loadLicenses = async () => {
    try {
      const response = await fetch('/api/ip-management/licenses');
      const data = await response.json();
      setLicenses(data);
    } catch (error) {
      console.error('Error loading licenses:', error);
    }
  };

  const updatePatentStatus = async (patentId: string, status: string) => {
    try {
      const response = await fetch(`/api/ip-management/patents/${patentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        loadPatents();
      }
    } catch (error) {
      console.error('Error updating patent status:', error);
    }
  };

  const createLicense = async (licenseData: Partial<License>) => {
    try {
      const response = await fetch('/api/ip-management/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licenseData)
      });
      if (response.ok) {
        loadLicenses();
      }
    } catch (error) {
      console.error('Error creating license:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'granted': 
      case 'registered': 
      case 'active': return 'bg-green-100 text-green-800';
      case 'filed': 
      case 'applied': 
      case 'examined': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'expired': 
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'rejected': 
      case 'abandoned': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDashboardMetrics = () => {
    const totalPatents = patents.length;
    const grantedPatents = patents.filter(p => p.status === 'granted').length;
    const totalTrademarks = trademarks.length;
    const registeredTrademarks = trademarks.filter(t => t.status === 'registered').length;
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter(l => l.status === 'active').length;
    const totalIPValue = [...patents, ...trademarks, ...copyrights].reduce((sum, ip) => 
      sum + (ip.commercialValue || 0), 0);
    const totalLicenseRevenue = licenses.reduce((sum, l) => sum + l.totalRevenue, 0);

    return { 
      totalPatents, 
      grantedPatents, 
      totalTrademarks, 
      registeredTrademarks, 
      totalLicenses, 
      activeLicenses, 
      totalIPValue, 
      totalLicenseRevenue 
    };
  };

  const metrics = getDashboardMetrics();

  const getMaintenanceDueAlerts = () => {
    const alerts: any[] = [];
    patents.forEach(patent => {
      patent.maintenanceFees.forEach(fee => {
        if (!fee.paid && new Date(fee.dueDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) {
          alerts.push({
            type: 'maintenance',
            title: patent.title,
            description: `رسوم الصيانة للسنة ${fee.year} مستحقة`,
            dueDate: fee.dueDate,
            amount: fee.amount
          });
        }
      });
    });
    return alerts.slice(0, 5);
  };

  const getRenewalAlerts = () => {
    const alerts: any[] = [];
    trademarks.forEach(trademark => {
      if (new Date(trademark.expiryDate) <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)) {
        alerts.push({
          type: 'renewal',
          title: trademark.mark,
          description: 'العلامة التجارية تحتاج للتجديد',
          expiryDate: trademark.expiryDate
        });
      }
    });
    return alerts.slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="h-10 w-10 text-indigo-600" />
            منصة إدارة براءات الاختراع والملكية الفكرية
          </h1>
          <p className="text-xl text-gray-600">
            نظام شامل لإدارة وحماية حقوق الملكية الفكرية والابتكارات الزراعية
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="patents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              البراءات
            </TabsTrigger>
            <TabsTrigger value="trademarks" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              العلامات التجارية
            </TabsTrigger>
            <TabsTrigger value="copyrights" className="flex items-center gap-2">
              <Copyright className="h-4 w-4" />
              حقوق التأليف
            </TabsTrigger>
            <TabsTrigger value="licenses" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              التراخيص
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              التقارير
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">إجمالي البراءات</p>
                      <p className="text-3xl font-bold">{metrics.totalPatents}</p>
                      <p className="text-sm text-blue-200">منح: {metrics.grantedPatents}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">العلامات التجارية</p>
                      <p className="text-3xl font-bold">{metrics.totalTrademarks}</p>
                      <p className="text-sm text-purple-200">مسجل: {metrics.registeredTrademarks}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">التراخيص النشطة</p>
                      <p className="text-3xl font-bold">{metrics.activeLicenses}</p>
                      <p className="text-sm text-green-200">من أصل {metrics.totalLicenses}</p>
                    </div>
                    <Scale className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">القيمة التجارية</p>
                      <p className="text-3xl font-bold">${(metrics.totalIPValue / 1000000).toFixed(1)}M</p>
                      <p className="text-sm text-orange-200">عائد التراخيص: ${(metrics.totalLicenseRevenue / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    أهم البراءات حسب القيمة التجارية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patents
                      .sort((a, b) => b.commercialValue - a.commercialValue)
                      .slice(0, 5)
                      .map((patent) => (
                        <div key={patent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{patent.title.substring(0, 40)}...</p>
                            <p className="text-sm text-gray-500">{patent.category}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${(patent.commercialValue / 1000).toFixed(0)}K
                            </div>
                            <Badge className={getStatusColor(patent.status)} variant="outline">
                              {patent.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    أداء التراخيص
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>إجمالي عائد التراخيص</span>
                      <span className="font-bold text-green-600">
                        ${metrics.totalLicenseRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>متوسط معدل الإتاوة</span>
                      <span className="font-bold text-blue-600">
                        {(licenses.reduce((sum, l) => sum + l.royaltyRate, 0) / Math.max(licenses.length, 1)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>التراخيص الحصرية</span>
                      <span className="font-bold text-purple-600">
                        {licenses.filter(l => l.licenseType === 'exclusive').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل النجاح</span>
                      <span className="font-bold text-orange-600">
                        {((metrics.activeLicenses / Math.max(metrics.totalLicenses, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    تنبيهات رسوم الصيانة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getMaintenanceDueAlerts().map((alert, idx) => (
                      <Alert key={idx}>
                        <Clock className="h-4 w-4" />
                        <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                        <AlertDescription className="text-xs">
                          {alert.description} - مستحق في {alert.dueDate} - ${alert.amount}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    تنبيهات التجديد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getRenewalAlerts().map((alert, idx) => (
                      <Alert key={idx}>
                        <Calendar className="h-4 w-4" />
                        <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                        <AlertDescription className="text-xs">
                          {alert.description} - تنتهي في {alert.expiryDate}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة براءات الاختراع</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  رفع براءة
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  بر��ءة جديدة
                </Button>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  فلاتر البحث
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>حالة البراءة</Label>
                    <Select onValueChange={(value) => setFilters({...filters, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع الحالات</SelectItem>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="filed">مودعة</SelectItem>
                        <SelectItem value="published">منشورة</SelectItem>
                        <SelectItem value="granted">ممنوحة</SelectItem>
                        <SelectItem value="expired">منتهية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>الفئة</Label>
                    <Select onValueChange={(value) => setFilters({...filters, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الفئات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع الفئات</SelectItem>
                        <SelectItem value="Agriculture">الزراعة</SelectItem>
                        <SelectItem value="Biotechnology">التكنولوجيا الحيوية</SelectItem>
                        <SelectItem value="Machinery">الآلات</SelectItem>
                        <SelectItem value="Software">البرمجيات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>الأولوية</Label>
                    <Select onValueChange={(value) => setFilters({...filters, priority: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع المستويا��" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المستويات</SelectItem>
                        <SelectItem value="critical">حرجة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="low">منخفضة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>السلطة القضائية</Label>
                    <Select onValueChange={(value) => setFilters({...filters, jurisdiction: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع السلطات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع السلطات</SelectItem>
                        <SelectItem value="SA">السعودية</SelectItem>
                        <SelectItem value="US">الولايات المتحدة</SelectItem>
                        <SelectItem value="EP">أوروبا</SelectItem>
                        <SelectItem value="CN">الصين</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patents.map((patent) => (
                <Card key={patent.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{patent.title.substring(0, 50)}...</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(patent.status)}>
                          {patent.status}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(patent.priority)}`} />
                      </div>
                    </div>
                    <CardDescription>{patent.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">رقم الطلب:</span>
                          <p className="font-medium">{patent.applicationNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">تاريخ الإيداع:</span>
                          <p className="font-medium">{patent.filingDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">القيمة التجارية:</span>
                          <p className="font-medium text-green-600">${(patent.commercialValue / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <span className="text-gray-500">تاريخ الانتهاء:</span>
                          <p className="font-medium">{patent.expiryDate}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">المخترعون:</span>
                        <p className="text-sm">{patent.inventors.join(', ')}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">التقنيات:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patent.technologies.slice(0, 3).map((tech, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>رسوم الصيانة المستحقة</span>
                        <span className="font-medium">
                          {patent.maintenanceFees.filter(f => !f.paid).length} رسوم
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedIP(patent)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        التفاصيل
                      </Button>
                      <Select onValueChange={(value) => updatePatentStatus(patent.id, value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="حديث" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="filed">مودعة</SelectItem>
                          <SelectItem value="published">منشورة</SelectItem>
                          <SelectItem value="granted">ممنوحة</SelectItem>
                          <SelectItem value="expired">منتهية</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm"
                        onClick={() => createLicense({
                          type: 'patent',
                          ipId: patent.id,
                          ipTitle: patent.title,
                          licenseType: 'non-exclusive'
                        })}
                      >
                        <Scale className="h-3 w-3 mr-1" />
                        ترخيص
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trademarks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة العلامات التجارية</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                علامة تجارية جديدة
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trademarks.map((trademark) => (
                <Card key={trademark.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{trademark.mark}</CardTitle>
                      <Badge className={getStatusColor(trademark.status)}>
                        {trademark.status}
                      </Badge>
                    </div>
                    <CardDescription>{trademark.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">رقم التطبيق:</span>
                          <p className="font-medium">{trademark.applicationNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">السلطة القضائية:</span>
                          <p className="font-medium">{trademark.jurisdiction}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الفئات:</span>
                          <p className="font-medium">{trademark.classes.join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">تاريخ الانتهاء:</span>
                          <p className="font-medium">{trademark.expiryDate}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">الخدمات/المنتجات:</span>
                        <p className="text-sm">{trademark.goodsServices.substring(0, 100)}...</p>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>القيمة السوقية</span>
                        <span className="font-medium text-green-600">
                          ${(trademark.usage.marketValue / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        التفاصيل
                      </Button>
                      <Button size="sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        تجديد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="copyrights" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة حقوق التأليف والنشر</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                حق تأليف جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {copyrights.map((copyright) => (
                <Card key={copyright.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{copyright.title}</CardTitle>
                      <Badge className={getStatusColor(copyright.status)}>
                        {copyright.status}
                      </Badge>
                    </div>
                    <CardDescription>{copyright.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">المؤلف:</span>
                          <p className="font-medium">{copyright.author}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">المالك:</span>
                          <p className="font-medium">{copyright.owner}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">تاريخ الإنشاء:</span>
                          <p className="font-medium">{copyright.creationDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">المدة:</span>
                          <p className="font-medium">{copyright.duration}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">الوصف:</span>
                        <p className="text-sm">{copyright.description.substring(0, 100)}...</p>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>القيمة التجارية</span>
                        <span className="font-medium text-green-600">
                          ${(copyright.commercialValue / 1000).toFixed(0)}K
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>عائد التراخيص</span>
                        <span className="font-medium text-blue-600">
                          ${(copyright.licensing.revenue / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        التفاصيل
                      </Button>
                      <Button size="sm">
                        <Scale className="h-3 w-3 mr-1" />
                        ترخيص
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="licenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة التراخيص</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                ترخيص جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['active', 'expired', 'terminated', 'suspended'].map((status) => (
                <Card key={status}>
                  <CardHeader>
                    <CardTitle className="text-center">
                      {status === 'active' && 'نشطة'}
                      {status === 'expired' && 'منتهية'}
                      {status === 'terminated' && 'منهية'}
                      {status === 'suspended' && 'معلقة'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {licenses
                        .filter(license => license.status === status)
                        .map((license) => (
                          <Card key={license.id} className="p-3 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">{license.ipTitle.substring(0, 30)}...</h4>
                              <div className="flex justify-between text-xs">
                                <span>المرخص له:</span>
                                <span className="font-medium">{license.licensee}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>نوع الترخيص:</span>
                                <Badge variant="outline" className="text-xs">
                                  {license.licenseType}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>معدل الإتاوة:</span>
                                <span className="font-medium">{license.royaltyRate}%</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>إجمالي العائد:</span>
                                <span className="font-medium text-green-600">
                                  ${license.totalRevenue.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                من {license.startDate} إلى {license.endDate}
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">تحليلات الأداء</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {((metrics.grantedPatents / Math.max(metrics.totalPatents, 1)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">معدل نجاح البراءات</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {trademarks.filter(t => t.oppositions && t.oppositions.length > 0).length}
                  </div>
                  <div className="text-sm text-gray-500">علامات تجارية متنازع عليها</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    ${(metrics.totalLicenseRevenue / Math.max(metrics.activeLicenses, 1) / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-gray-500">متوسط عائد الترخيص</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set([...patents.flatMap(p => p.jurisdiction), ...trademarks.map(t => t.jurisdiction)]).size}
                  </div>
                  <div className="text-sm text-gray-500">سلطات قضائية</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">التقارير والإحصائيات</h2>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                تصدير التقرير
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تقر��ر المحفظة الشهري</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>طلبات براءات جديدة</span>
                      <span className="font-bold">
                        {patents.filter(p => 
                          new Date(p.filingDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>براءات ممنوحة</span>
                      <span className="font-bold">{metrics.grantedPatents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>علامات تجارية مسجلة</span>
                      <span className="font-bold">{metrics.registeredTrademarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>رسوم الصيانة المدفوعة</span>
                      <span className="font-bold">
                        ${patents.flatMap(p => p.maintenanceFees)
                          .filter(f => f.paid)
                          .reduce((sum, f) => sum + f.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>تقرير الإيرادات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>إيرادات التراخيص</span>
                      <span className="font-bold">${metrics.totalLicenseRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>أعلى ترخيص</span>
                      <span className="font-bold">
                        ${Math.max(...licenses.map(l => l.totalRevenue), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط الإتاوة</span>
                      <span className="font-bold">
                        {(licenses.reduce((sum, l) => sum + l.royaltyRate, 0) / Math.max(licenses.length, 1)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>نمو الإيرادات</span>
                      <span className="font-bold text-green-600">+15.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
