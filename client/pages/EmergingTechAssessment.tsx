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
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap, 
  Brain, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Users,
  ArrowUpRight,
  Lightbulb,
  Settings,
  Activity,
  Clock,
  ThumbsUp,
  Star,
  Globe,
  Shield,
  Building,
  Radar,
  Cpu,
  Database,
  TrendingDown,
  Eye,
  Filter,
  Search,
  Plus,
  Download,
  Upload
} from 'lucide-react';

interface Technology {
  id: string;
  name: string;
  description: string;
  category: string;
  maturityLevel: 'emerging' | 'developing' | 'mature' | 'declining';
  readinessLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // TRL scale
  potentialImpact: 'low' | 'medium' | 'high' | 'transformative';
  marketSize: number;
  adoptionRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  competitiveAdvantage: number;
  timeToMarket: string;
  requiredInvestment: number;
  expectedROI: number;
  keyBenefits: string[];
  challenges: string[];
  competitors: string[];
  patents: number;
  publications: number;
  fundingReceived: number;
  evaluationScore: number;
  lastUpdated: string;
  evaluator: string;
  sources: string[];
}

interface Investment {
  id: string;
  technologyId: string;
  technologyName: string;
  amount: number;
  type: 'R&D' | 'acquisition' | 'partnership' | 'licensing' | 'equity';
  stage: 'planning' | 'approved' | 'executing' | 'completed' | 'cancelled';
  startDate: string;
  expectedCompletion: string;
  actualROI?: number;
  milestones: { name: string; completed: boolean; date: string }[];
  risks: { level: string; description: string; mitigation: string }[];
  team: string[];
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  kpis: { metric: string; target: number; current: number; unit: string }[];
}

interface MarketTrend {
  id: string;
  name: string;
  description: string;
  category: string;
  impact: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
  timeframe: string;
  relatedTechnologies: string[];
  opportunities: string[];
  threats: string[];
}

export default function EmergingTechAssessment() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    category: '',
    maturityLevel: '',
    potentialImpact: '',
    riskLevel: ''
  });

  useEffect(() => {
    loadTechnologies();
    loadInvestments();
    loadMarketTrends();
  }, []);

  const loadTechnologies = async () => {
    try {
      const response = await fetch('/api/emerging-tech/technologies');
      const data = await response.json();
      setTechnologies(data);
    } catch (error) {
      console.error('Error loading technologies:', error);
    }
  };

  const loadInvestments = async () => {
    try {
      const response = await fetch('/api/emerging-tech/investments');
      const data = await response.json();
      setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  };

  const loadMarketTrends = async () => {
    try {
      const response = await fetch('/api/emerging-tech/market-trends');
      const data = await response.json();
      setMarketTrends(data);
    } catch (error) {
      console.error('Error loading market trends:', error);
    }
  };

  const createInvestment = async (techId: string, investmentData: Partial<Investment>) => {
    try {
      const response = await fetch('/api/emerging-tech/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...investmentData, technologyId: techId })
      });
      if (response.ok) {
        loadInvestments();
      }
    } catch (error) {
      console.error('Error creating investment:', error);
    }
  };

  const updateTechScore = async (techId: string, score: number) => {
    try {
      const response = await fetch(`/api/emerging-tech/technologies/${techId}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationScore: score })
      });
      if (response.ok) {
        loadTechnologies();
      }
    } catch (error) {
      console.error('Error updating tech score:', error);
    }
  };

  const getMaturityColor = (level: string) => {
    switch (level) {
      case 'emerging': return 'bg-blue-100 text-blue-800';
      case 'developing': return 'bg-yellow-100 text-yellow-800';
      case 'mature': return 'bg-green-100 text-green-800';
      case 'declining': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'transformative': return 'bg-purple-500';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'very-high': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTechnologies = technologies.filter(tech => {
    return (!filters.category || tech.category === filters.category) &&
           (!filters.maturityLevel || tech.maturityLevel === filters.maturityLevel) &&
           (!filters.potentialImpact || tech.potentialImpact === filters.potentialImpact) &&
           (!filters.riskLevel || tech.riskLevel === filters.riskLevel);
  });

  const getDashboardMetrics = () => {
    const totalTechnologies = technologies.length;
    const highImpactTech = technologies.filter(t => t.potentialImpact === 'high' || t.potentialImpact === 'transformative').length;
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeInvestments = investments.filter(inv => inv.stage === 'executing').length;
    const avgTechScore = technologies.reduce((sum, tech) => sum + tech.evaluationScore, 0) / Math.max(technologies.length, 1);

    return { totalTechnologies, highImpactTech, totalInvestments, activeInvestments, avgTechScore };
  };

  const metrics = getDashboardMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Radar className="h-10 w-10 text-purple-600" />
            تقييم التقنيات الزراعية الناشئة وإدارة الاستثمار التقني
          </h1>
          <p className="text-xl text-gray-600">
            منصة شاملة لتقييم وتتبع التقنيات الزراعية الناشئة وإدارة الاستثمارات التقنية
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="technologies" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              التقنيات
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              الاستثمارات
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              اتجاهات السوق
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">إجمالي التقنيات</p>
                      <p className="text-3xl font-bold">{metrics.totalTechnologies}</p>
                    </div>
                    <Cpu className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">تقنيات عالية التأثير</p>
                      <p className="text-3xl font-bold">{metrics.highImpactTech}</p>
                    </div>
                    <Zap className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">إجمالي الاستثمارات</p>
                      <p className="text-3xl font-bold">${(metrics.totalInvestments / 1000000).toFixed(1)}M</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">استثمارات نشطة</p>
                      <p className="text-3xl font-bold">{metrics.activeInvestments}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">متوسط التقييم</p>
                      <p className="text-3xl font-bold">{metrics.avgTechScore.toFixed(1)}</p>
                    </div>
                    <Star className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    أهم التقنيات الناشئة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {technologies
                      .sort((a, b) => b.evaluationScore - a.evaluationScore)
                      .slice(0, 5)
                      .map((tech) => (
                        <div key={tech.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{tech.name}</p>
                            <p className="text-sm text-gray-500">{tech.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getImpactColor(tech.potentialImpact)}`} />
                            <span className="text-sm font-bold">{tech.evaluationScore}/10</span>
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
                    نظرة عامة على الاستثمارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>إجمالي المخصص</span>
                      <span className="font-bold text-green-600">
                        ${investments.reduce((sum, inv) => sum + inv.budget.allocated, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>المصروف</span>
                      <span className="font-bold text-blue-600">
                        ${investments.reduce((sum, inv) => sum + inv.budget.spent, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>المتبقي</span>
                      <span className="font-bold text-purple-600">
                        ${investments.reduce((sum, inv) => sum + inv.budget.remaining, 0).toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={(investments.reduce((sum, inv) => sum + inv.budget.spent, 0) / 
                             Math.max(investments.reduce((sum, inv) => sum + inv.budget.allocated, 0), 1)) * 100} 
                      className="w-full" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  تنبيهات الاستثمار والمخاطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-3">تقنيات عالية المخاطر</h4>
                    <div className="space-y-2">
                      {technologies
                        .filter(tech => tech.riskLevel === 'high' || tech.riskLevel === 'very-high')
                        .slice(0, 3)
                        .map((tech) => (
                          <Alert key={tech.id}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-sm">{tech.name}</AlertTitle>
                            <AlertDescription className="text-xs">
                              مستوى المخاطر: {tech.riskLevel}
                            </AlertDescription>
                          </Alert>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">استثمارات تحتاج متابعة</h4>
                    <div className="space-y-2">
                      {investments
                        .filter(inv => inv.stage === 'executing')
                        .slice(0, 3)
                        .map((inv) => (
                          <Alert key={inv.id}>
                            <Clock className="h-4 w-4" />
                            <AlertTitle className="text-sm">{inv.technologyName}</AlertTitle>
                            <AlertDescription className="text-xs">
                              متوقع الانتهاء: {inv.expectedCompletion}
                            </AlertDescription>
                          </Alert>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technologies" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">مكتبة التقنيات الزراعية الناشئة</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  رفع تقنية جديدة
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة تقنية
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
                    <Label>الفئة</Label>
                    <Select onValueChange={(value) => setFilters({...filters, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الفئات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع الفئات</SelectItem>
                        <SelectItem value="AI/ML">الذكاء الاصطناعي</SelectItem>
                        <SelectItem value="IoT">إنترنت الأشياء</SelectItem>
                        <SelectItem value="Robotics">الروبوتات</SelectItem>
                        <SelectItem value="Biotechnology">التكنولوجيا الحيوية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>مستوى النضج</Label>
                    <Select onValueChange={(value) => setFilters({...filters, maturityLevel: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع المستويات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المستويات</SelectItem>
                        <SelectItem value="emerging">ناشئة</SelectItem>
                        <SelectItem value="developing">متطورة</SelectItem>
                        <SelectItem value="mature">ناضجة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>التأثير المحتمل</Label>
                    <Select onValueChange={(value) => setFilters({...filters, potentialImpact: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع المستويات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المستويات</SelectItem>
                        <SelectItem value="transformative">تحويلي</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="low">منخفض</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>مستوى المخاطر</Label>
                    <Select onValueChange={(value) => setFilters({...filters, riskLevel: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع المستويات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المستويات</SelectItem>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="very-high">عالي جداً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTechnologies.map((tech) => (
                <Card key={tech.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{tech.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getMaturityColor(tech.maturityLevel)}>
                          {tech.maturityLevel}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getImpactColor(tech.potentialImpact)}`} />
                      </div>
                    </div>
                    <CardDescription>{tech.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{tech.description.substring(0, 120)}...</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">TRL:</span>
                          <span className="font-medium mr-1">{tech.readinessLevel}/9</span>
                        </div>
                        <div>
                          <span className="text-gray-500">التقييم:</span>
                          <span className="font-medium mr-1">{tech.evaluationScore}/10</span>
                        </div>
                        <div>
                          <span className="text-gray-500">السوق:</span>
                          <span className="font-medium mr-1">${(tech.marketSize / 1000000).toFixed(0)}M</span>
                        </div>
                        <div>
                          <span className="text-gray-500">العائد المتوقع:</span>
                          <span className="font-medium mr-1">{tech.expectedROI}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>مستوى المخاطر</span>
                        <div className={`px-2 py-1 rounded-full text-white text-xs ${getRiskColor(tech.riskLevel)}`}>
                          {tech.riskLevel}
                        </div>
                      </div>
                      
                      <Progress value={tech.adoptionRate} className="w-full" />
                      <div className="text-xs text-gray-500">معدل التبني: {tech.adoptionRate}%</div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedTech(tech)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        عرض التفاصيل
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => createInvestment(tech.id, {
                          type: 'R&D',
                          amount: tech.requiredInvestment,
                          stage: 'planning'
                        })}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        استثمار
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="investments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة الاستثمارات التقنية</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                استثمار جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['planning', 'approved', 'executing', 'completed'].map((stage) => (
                <Card key={stage}>
                  <CardHeader>
                    <CardTitle className="text-center">
                      {stage === 'planning' && 'قيد التخطيط'}
                      {stage === 'approved' && 'معتمد'}
                      {stage === 'executing' && 'قيد التنفيذ'}
                      {stage === 'completed' && 'مكتمل'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {investments
                        .filter(inv => inv.stage === stage)
                        .map((investment) => (
                          <Card key={investment.id} className="p-3 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">{investment.technologyName}</h4>
                              <div className="flex justify-between text-xs">
                                <span>المبلغ:</span>
                                <span className="font-medium">${investment.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>النوع:</span>
                                <Badge variant="outline" className="text-xs">
                                  {investment.type}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>المصروف:</span>
                                <span className="font-medium">
                                  ${investment.budget.spent.toLocaleString()}
                                </span>
                              </div>
                              <Progress 
                                value={(investment.budget.spent / investment.budget.allocated) * 100} 
                                className="h-1" 
                              />
                            </div>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <h2 className="text-2xl font-bold">اتجاهات السوق والتقنيات الناشئة</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {marketTrends.map((trend) => (
                <Card key={trend.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{trend.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={trend.impact === 'high' ? 'bg-red-100 text-red-800' : 
                                        trend.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-green-100 text-green-800'}>
                          {trend.impact}
                        </Badge>
                        <Badge variant="outline">
                          {trend.confidence}% ثقة
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{trend.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{trend.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">الفرص:</h4>
                        <ul className="text-sm space-y-1">
                          {trend.opportunities.slice(0, 2).map((opportunity, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {opportunity}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">التهديدات:</h4>
                        <ul className="text-sm space-y-1">
                          {trend.threats.slice(0, 2).map((threat, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              {threat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">الإطار الزمني: {trend.timeframe}</span>
                      <span className="text-gray-500">
                        {trend.relatedTechnologies.length} تقنية مرتبطة
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">تحليلات الاستثمار والأداء</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {(investments.reduce((sum, inv) => sum + (inv.actualROI || 0), 0) / Math.max(investments.filter(inv => inv.actualROI).length, 1)).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">متوسط العائد الفعلي</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {technologies.filter(t => t.readinessLevel >= 7).length}
                  </div>
                  <div className="text-sm text-gray-500">تقنيات جاهزة للسوق</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {technologies.filter(t => t.riskLevel === 'low' || t.riskLevel === 'medium').length}
                  </div>
                  <div className="text-sm text-gray-500">تقنيات منخفضة المخاطر</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Building className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {technologies.reduce((sum, tech) => sum + tech.patents, 0)}
                  </div>
                  <div className="text-sm text-gray-500">إجمالي البراءات</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">التقارير والتحليلات</h2>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                تصدير التقرير
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تقرير الاستثمارات الشهري</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>إجمالي الاستثمارات الجديدة</span>
                      <span className="font-bold">${investments.filter(inv => 
                        new Date(inv.startDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ).reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المشاريع المكتملة</span>
                      <span className="font-bold">{investments.filter(inv => inv.stage === 'completed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط فترة الاستثمار</span>
                      <span className="font-bold">8.5 أشهر</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>تقرير أداء التقنيات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>أعلى تقنية تقييماً</span>
                      <span className="font-bold">
                        {technologies.sort((a, b) => b.evaluationScore - a.evaluationScore)[0]?.name || 'غير متوفر'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>أسرع تقنية نمواً</span>
                      <span className="font-bold">
                        {technologies.sort((a, b) => b.adoptionRate - a.adoptionRate)[0]?.name || 'غير متوفر'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>أكبر سوق محتمل</span>
                      <span className="font-bold">
                        ${(technologies.sort((a, b) => b.marketSize - a.marketSize)[0]?.marketSize / 1000000 || 0).toFixed(0)}M
                      </span>
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
