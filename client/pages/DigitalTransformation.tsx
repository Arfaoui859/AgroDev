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
  Rocket, 
  TrendingUp, 
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
  Shield,
  Building
} from 'lucide-react';

interface TransformationProject {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'planning' | 'in-progress' | 'testing' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  budget: number;
  actualCost: number;
  startDate: string;
  expectedCompletion: string;
  team: string[];
  technologies: string[];
  businessImpact: string;
  risks: { level: string; description: string }[];
  kpis: { metric: string; current: number; target: number; unit: string }[];
}

interface Innovation {
  id: string;
  title: string;
  description: string;
  category: string;
  submittedBy: string;
  submissionDate: string;
  stage: 'idea' | 'evaluation' | 'prototyping' | 'pilot' | 'implementation' | 'scaled';
  votes: number;
  comments: number;
  potentialImpact: 'low' | 'medium' | 'high';
  feasibility: 'low' | 'medium' | 'high';
  expectedROI: number;
  requiredInvestment: number;
  timeline: string;
}

interface DigitalMaturity {
  area: string;
  currentLevel: number;
  targetLevel: number;
  initiatives: string[];
  score: number;
}

export default function DigitalTransformation() {
  const [transformationProjects, setTransformationProjects] = useState<TransformationProject[]>([]);
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [digitalMaturity, setDigitalMaturity] = useState<DigitalMaturity[]>([]);
  const [selectedProject, setSelectedProject] = useState<TransformationProject | null>(null);
  const [newProject, setNewProject] = useState<Partial<TransformationProject>>({});
  const [newInnovation, setNewInnovation] = useState<Partial<Innovation>>({});
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadTransformationProjects();
    loadInnovations();
    loadDigitalMaturity();
  }, []);

  const loadTransformationProjects = async () => {
    try {
      const response = await fetch('/api/digital-transformation/projects');
      const data = await response.json();
      setTransformationProjects(data);
    } catch (error) {
      console.error('Error loading transformation projects:', error);
    }
  };

  const loadInnovations = async () => {
    try {
      const response = await fetch('/api/digital-transformation/innovations');
      const data = await response.json();
      setInnovations(data);
    } catch (error) {
      console.error('Error loading innovations:', error);
    }
  };

  const loadDigitalMaturity = async () => {
    try {
      const response = await fetch('/api/digital-transformation/maturity');
      const data = await response.json();
      setDigitalMaturity(data);
    } catch (error) {
      console.error('Error loading digital maturity:', error);
    }
  };

  const createProject = async () => {
    try {
      const response = await fetch('/api/digital-transformation/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (response.ok) {
        loadTransformationProjects();
        setNewProject({});
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const submitInnovation = async () => {
    try {
      const response = await fetch('/api/digital-transformation/innovations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInnovation)
      });
      if (response.ok) {
        loadInnovations();
        setNewInnovation({});
      }
    } catch (error) {
      console.error('Error submitting innovation:', error);
    }
  };

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const response = await fetch(`/api/digital-transformation/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        loadTransformationProjects();
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'testing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
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

  const getTotalBudget = () => transformationProjects.reduce((sum, project) => sum + project.budget, 0);
  const getTotalActualCost = () => transformationProjects.reduce((sum, project) => sum + project.actualCost, 0);
  const getAverageProgress = () => {
    if (transformationProjects.length === 0) return 0;
    return transformationProjects.reduce((sum, project) => sum + project.progress, 0) / transformationProjects.length;
  };

  const getDashboardMetrics = () => {
    const activeProjects = transformationProjects.filter(p => p.status === 'in-progress').length;
    const completedProjects = transformationProjects.filter(p => p.status === 'completed').length;
    const totalInnovations = innovations.length;
    const avgMaturityScore = digitalMaturity.reduce((sum, area) => sum + area.score, 0) / Math.max(digitalMaturity.length, 1);

    return { activeProjects, completedProjects, totalInnovations, avgMaturityScore };
  };

  const metrics = getDashboardMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Rocket className="h-10 w-10 text-blue-600" />
            إدارة التحول الرقمي والابتكار الزراعي
          </h1>
          <p className="text-xl text-gray-600">
            منصة شاملة لإدارة مشاريع التحول الرقمي وتتبع الاب��كارات في القطاع الزراعي
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              المشاريع
            </TabsTrigger>
            <TabsTrigger value="innovations" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              الابتكارات
            </TabsTrigger>
            <TabsTrigger value="maturity" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              النضج الرقمي
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">مشاريع نشطة</p>
                      <p className="text-3xl font-bold">{metrics.activeProjects}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">مشاريع مكتملة</p>
                      <p className="text-3xl font-bold">{metrics.completedProjects}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">إجمالي الابتكارات</p>
                      <p className="text-3xl font-bold">{metrics.totalInnovations}</p>
                    </div>
                    <Lightbulb className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">متوسط النضج الرقمي</p>
                      <p className="text-3xl font-bold">{metrics.avgMaturityScore.toFixed(1)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    نظرة عامة على المشاريع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>إجمالي الميزانية</span>
                      <span className="font-bold text-green-600">${getTotalBudget().toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>التكلفة الفعلية</span>
                      <span className="font-bold text-blue-600">${getTotalActualCost().toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>متوسط التقدم</span>
                      <span className="font-bold text-purple-600">{getAverageProgress().toFixed(1)}%</span>
                    </div>
                    <Progress value={getAverageProgress()} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    أحدث الابتكارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {innovations.slice(0, 4).map((innovation) => (
                      <div key={innovation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{innovation.title}</p>
                          <p className="text-sm text-gray-500">{innovation.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{innovation.votes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  التنبيهات والمخاطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transformationProjects
                    .filter(project => project.risks && project.risks.length > 0)
                    .slice(0, 3)
                    .map((project) => (
                      <Alert key={project.id}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{project.name}</AlertTitle>
                        <AlertDescription>
                          {project.risks[0]?.description}
                        </AlertDescription>
                      </Alert>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">مشاريع التحول الرقمي</h2>
              <Button onClick={() => setSelectedProject({} as TransformationProject)}>
                <Target className="h-4 w-4 mr-2" />
                مشروع جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transformationProjects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(project.priority)}`} />
                      </div>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>التقدم</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                      
                      <div className="flex justify-between text-sm">
                        <span>الميزانية</span>
                        <span>${project.budget?.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>الفريق</span>
                        <span>{project.team?.length} عضو</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>التاريخ المتوقع</span>
                        <span>{project.expectedCompletion}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedProject(project)}
                      >
                        عرض التفاصيل
                      </Button>
                      <Select onValueChange={(value) => updateProjectStatus(project.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="تحديث الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">تخطيط</SelectItem>
                          <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
                          <SelectItem value="testing">اختبار</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="on-hold">متوقف</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="innovations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">بنك الابتكارات</h2>
              <Button onClick={() => setNewInnovation({})}>
                <Lightbulb className="h-4 w-4 mr-2" />
                فكرة جديدة
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {innovations.map((innovation) => (
                    <Card key={innovation.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{innovation.title}</CardTitle>
                            <CardDescription>{innovation.category}</CardDescription>
                          </div>
                          <Badge className={`${innovation.stage === 'implementation' ? 'bg-green-100 text-green-800' : 
                            innovation.stage === 'pilot' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                            {innovation.stage}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{innovation.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-sm">
                            <span className="text-gray-500">التأثير المتوقع:</span>
                            <Badge className="mr-2" variant={innovation.potentialImpact === 'high' ? 'default' : 'secondary'}>
                              {innovation.potentialImpact}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">إمكانية التنفيذ:</span>
                            <Badge className="mr-2" variant={innovation.feasibility === 'high' ? 'default' : 'secondary'}>
                              {innovation.feasibility}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">العائد المتوقع:</span>
                            <span className="font-medium text-green-600">{innovation.expectedROI}%</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">الاستثمار المطلوب:</span>
                            <span className="font-medium">${innovation.requiredInvestment?.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{innovation.votes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{innovation.comments} تعليق</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            مقدم بواسطة {innovation.submittedBy}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>إحصائيات الابتكار</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{innovations.length}</div>
                        <div className="text-sm text-gray-500">إجمالي الأفكار</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {innovations.filter(i => i.stage === 'implementation').length}
                        </div>
                        <div className="text-sm text-gray-500">قيد التنفيذ</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {innovations.filter(i => i.potentialImpact === 'high').length}
                        </div>
                        <div className="text-sm text-gray-500">تأثير عالي</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="maturity" className="space-y-6">
            <h2 className="text-2xl font-bold">مؤشر النضج الرقمي</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {digitalMaturity.map((area) => (
                <Card key={area.area}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {area.area}
                      <Badge variant="outline">{area.score}/5</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>المستوى الحالي</span>
                          <span>{area.currentLevel}/5</span>
                        </div>
                        <Progress value={area.currentLevel * 20} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>المستوى المستهدف</span>
                          <span>{area.targetLevel}/5</span>
                        </div>
                        <Progress value={area.targetLevel * 20} className="h-2 bg-blue-100" />
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">المبادرات الحالية:</h4>
                        <ul className="space-y-1">
                          {area.initiatives.map((initiative, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {initiative}
                            </li>
                          ))}
                        </ul>
                      </div>
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
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">${getTotalBudget().toLocaleString()}</div>
                  <div className="text-sm text-gray-500">إجمالي الاستث��ار</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <ArrowUpRight className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{getAverageProgress().toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">متوسط التقدم</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {transformationProjects.filter(p => p.status === 'in-progress').length}
                  </div>
                  <div className="text-sm text-gray-500">مشاريع نشطة</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {innovations.reduce((sum, i) => sum + i.votes, 0)}
                  </div>
                  <div className="text-sm text-gray-500">إجمالي التصويتات</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">إعدادات النظام</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات المشاريع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>مدة التنبيه للمشاريع المتأخرة (أيام)</Label>
                    <Input type="number" defaultValue={7} />
                  </div>
                  <div>
                    <Label>حد الميزانية للتنبيه (%)</Label>
                    <Input type="number" defaultValue={90} />
                  </div>
                  <div>
                    <Label>عدد المشاريع المعروضة في الصفحة</Label>
                    <Input type="number" defaultValue={10} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الابتكار</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الحد الأدنى للتصويتات للمراجعة</Label>
                    <Input type="number" defaultValue={5} />
                  </div>
                  <div>
                    <Label>مدة التقييم الأولي (أيام)</Label>
                    <Input type="number" defaultValue={14} />
                  </div>
                  <div>
                    <Label>تفعيل التنبيهات للأفكار الجديدة</Label>
                    <Select defaultValue="enabled">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">مفعل</SelectItem>
                        <SelectItem value="disabled">معطل</SelectItem>
                      </SelectContent>
                    </Select>
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
