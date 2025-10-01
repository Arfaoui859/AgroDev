import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield,
  AlertTriangle,
  Zap,
  Target,
  Brain,
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Settings,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Save,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Map,
  Route,
  Navigation,
  Compass,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Siren,
  Truck,
  Wrench,
  Stethoscope,
  Droplets,
  Thermometer,
  Wind,
  CloudRain,
  Sun,
  Bug,
  Sprout,
  TreePine,
  Leaf,
  Database,
  Cpu,
  Radio,
  Wifi,
  Smartphone,
  Headphones,
  Video,
  Camera,
  FileText,
  Clipboard,
  BookOpen,
  Lightbulb,
  Star,
  Flag,
  AlertCircle,
  Info,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface EmergencyScenario {
  id: string;
  name: string;
  type: 'weather' | 'disease' | 'pest' | 'equipment' | 'fire' | 'flood' | 'drought' | 'market_crash';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  trigger_conditions: string[];
  affected_areas: string[];
  estimated_impact: {
    financial_loss: number;
    crop_damage: number;
    area_affected: number;
    recovery_time: string;
  };
  response_plans: ResponsePlan[];
  automatic_actions: AutomatedAction[];
  manual_actions: ManualAction[];
  resources_needed: Resource[];
  success_probability: number;
  last_activated: string;
  activation_count: number;
  status: 'active' | 'standby' | 'testing' | 'disabled';
}

interface ResponsePlan {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  execution_time: string;
  steps: ResponseStep[];
  prerequisites: string[];
  success_criteria: string[];
  rollback_plan: string[];
  estimated_cost: number;
  resource_requirements: string[];
  responsible_team: string[];
}

interface ResponseStep {
  id: string;
  sequence: number;
  description: string;
  action_type: 'automatic' | 'manual' | 'notification' | 'assessment';
  estimated_duration: string;
  dependencies: string[];
  equipment_needed: string[];
  personnel_required: number;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  completion_time?: string;
  notes?: string;
}

interface AutomatedAction {
  id: string;
  name: string;
  trigger_threshold: number;
  action_type: 'irrigation_control' | 'chemical_application' | 'equipment_shutdown' | 'alert_dispatch' | 'data_backup';
  parameters: Record<string, any>;
  execution_time: number; // in seconds
  success_rate: number;
  last_executed: string;
  execution_count: number;
  is_enabled: boolean;
}

interface ManualAction {
  id: string;
  title: string;
  description: string;
  urgency: 'immediate' | 'within_hour' | 'within_day' | 'when_possible';
  estimated_time: string;
  required_skills: string[];
  safety_requirements: string[];
  tools_needed: string[];
  instructions: string[];
  completion_checklist: string[];
}

interface Resource {
  id: string;
  name: string;
  type: 'equipment' | 'personnel' | 'chemical' | 'tool' | 'vehicle' | 'communication';
  quantity_available: number;
  quantity_needed: number;
  location: string;
  availability_status: 'available' | 'in_use' | 'maintenance' | 'unavailable';
  estimated_arrival_time: string;
  cost_per_unit: number;
  supplier_contact: string;
}

interface ScenarioSimulation {
  id: string;
  scenario_id: string;
  simulation_name: string;
  parameters: Record<string, any>;
  results: {
    success_rate: number;
    estimated_damage: number;
    response_time: number;
    resource_utilization: number;
    recommendations: string[];
  };
  run_date: string;
  duration: number;
  notes: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  specialty: string[];
  availability: '24/7' | 'business_hours' | 'emergency_only';
  response_time: string;
  location: string;
  backup_contact: string;
}

export default function EmergencyResponse() {
  const [scenarios, setScenarios] = useState<EmergencyScenario[]>([]);
  const [responsePlans, setResponsePlans] = useState<ResponsePlan[]>([]);
  const [simulations, setSimulations] = useState<ScenarioSimulation[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [activeScenario, setActiveScenario] = useState<EmergencyScenario | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ResponsePlan | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadScenarios();
    loadResponsePlans();
    loadSimulations();
    loadEmergencyContacts();
  }, []);

  const loadScenarios = async () => {
    try {
      const response = await fetch('/api/emergency-response/scenarios');
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const loadResponsePlans = async () => {
    try {
      const response = await fetch('/api/emergency-response/plans');
      const data = await response.json();
      setResponsePlans(data);
    } catch (error) {
      console.error('Error loading response plans:', error);
    }
  };

  const loadSimulations = async () => {
    try {
      const response = await fetch('/api/emergency-response/simulations');
      const data = await response.json();
      setSimulations(data);
    } catch (error) {
      console.error('Error loading simulations:', error);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await fetch('/api/emergency-response/contacts');
      const data = await response.json();
      setEmergencyContacts(data);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const activateScenario = async (scenarioId: string) => {
    try {
      const response = await fetch(`/api/emergency-response/scenarios/${scenarioId}/activate`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setActiveScenario(data.scenario);
        loadScenarios();
      }
    } catch (error) {
      console.error('Error activating scenario:', error);
    }
  };

  const runSimulation = async (scenarioId: string, parameters: Record<string, any>) => {
    setIsSimulationRunning(true);
    try {
      const response = await fetch(`/api/emergency-response/scenarios/${scenarioId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameters })
      });
      if (response.ok) {
        const data = await response.json();
        loadSimulations();
        return data;
      }
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsSimulationRunning(false);
    }
  };

  const updateStepStatus = async (planId: string, stepId: string, status: string) => {
    try {
      const response = await fetch(`/api/emergency-response/plans/${planId}/steps/${stepId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        loadResponsePlans();
      }
    } catch (error) {
      console.error('Error updating step status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weather': return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'disease': return <Bug className="h-5 w-5 text-red-500" />;
      case 'pest': return <Bug className="h-5 w-5 text-orange-500" />;
      case 'equipment': return <Wrench className="h-5 w-5 text-gray-500" />;
      case 'fire': return <Zap className="h-5 w-5 text-red-600" />;
      case 'flood': return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'drought': return <Sun className="h-5 w-5 text-yellow-600" />;
      case 'market_crash': return <BarChart3 className="h-5 w-5 text-purple-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'standby': return 'bg-yellow-100 text-yellow-800';
      case 'testing': return 'bg-blue-100 text-blue-800';
      case 'disabled': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-500';
      case 'within_hour': return 'bg-orange-500';
      case 'within_day': return 'bg-yellow-500';
      case 'when_possible': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDashboardMetrics = () => {
    const activeScenarios = scenarios.filter(s => s.status === 'active').length;
    const standbyScenarios = scenarios.filter(s => s.status === 'standby').length;
    const totalPlans = responsePlans.length;
    const avgSuccessRate = scenarios.reduce((sum, s) => sum + s.success_probability, 0) / Math.max(scenarios.length, 1);
    const totalEstimatedDamage = scenarios.reduce((sum, s) => sum + s.estimated_impact.financial_loss, 0);

    return {
      activeScenarios,
      standbyScenarios,
      totalPlans,
      avgSuccessRate,
      totalEstimatedDamage
    };
  };

  const metrics = getDashboardMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="h-10 w-10 text-orange-600" />
            نظام الخطط البديلة والسيناريوهات الإنقاذية التلقائية
          </h1>
          <p className="text-xl text-gray-600">
            نظام متطور للاستجابة للطوارئ مع خطط بديلة ذكية وسيناريوهات إنقاذ تلقائية
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              السيناريوهات
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              خطط الاستجابة
            </TabsTrigger>
            <TabsTrigger value="simulation" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              المحاكاة
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              ال��وارد
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              جهات الاتصال
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">سيناريوهات نشطة</p>
                      <p className="text-3xl font-bold">{metrics.activeScenarios}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100">في وضع الاستعداد</p>
                      <p className="text-3xl font-bold">{metrics.standbyScenarios}</p>
                    </div>
                    <Shield className="h-8 w-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">خطط الاستجابة</p>
                      <p className="text-3xl font-bold">{metrics.totalPlans}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">معدل النجاح</p>
                      <p className="text-3xl font-bold">{metrics.avgSuccessRate.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">الأضرار المحتملة</p>
                      <p className="text-3xl font-bold">${(metrics.totalEstimatedDamage / 1000).toFixed(0)}K</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    السيناريوهات عالية الخطورة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scenarios
                      .filter(scenario => scenario.severity === 'critical' || scenario.severity === 'high')
                      .slice(0, 5)
                      .map((scenario) => (
                        <div key={scenario.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(scenario.type)}
                            <div>
                              <p className="font-medium text-red-900">{scenario.name}</p>
                              <p className="text-sm text-red-600">{scenario.affected_areas.join(', ')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getSeverityColor(scenario.severity)}>
                              {scenario.severity}
                            </Badge>
                            <div className="text-xs text-red-600 mt-1">
                              نجاح: {scenario.success_probability}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    الخطط النشطة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {responsePlans.slice(0, 5).map((plan) => {
                      const completedSteps = plan.steps.filter(step => step.completion_status === 'completed').length;
                      const totalSteps = plan.steps.length;
                      const progress = (completedSteps / Math.max(totalSteps, 1)) * 100;
                      
                      return (
                        <div key={plan.id} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-blue-900">{plan.name}</p>
                            <Badge className={plan.priority === 'critical' ? 'bg-red-500 text-white' : 
                                           plan.priority === 'high' ? 'bg-orange-500 text-white' : 
                                           'bg-yellow-500 text-white'}>
                              {plan.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Progress value={progress} className="flex-1 h-2" />
                            <span className="text-sm text-blue-600">{completedSteps}/{totalSteps}</span>
                          </div>
                          <div className="text-xs text-blue-600">
                            مدة التنفيذ: {plan.execution_time} • تكلفة: ${plan.estimated_cost.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    الإجراءات العاجلة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scenarios
                      .flatMap(scenario => scenario.manual_actions)
                      .filter(action => action.urgency === 'immediate' || action.urgency === 'within_hour')
                      .slice(0, 4)
                      .map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{action.title}</p>
                            <p className="text-xs text-gray-500">{action.estimated_time}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getUrgencyColor(action.urgency)}`} />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-500" />
                    الموارد المطلوبة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scenarios
                      .flatMap(scenario => scenario.resources_needed)
                      .filter(resource => resource.availability_status !== 'available')
                      .slice(0, 4)
                      .map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{resource.name}</p>
                            <p className="text-xs text-gray-500">{resource.type}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">{resource.quantity_needed}/{resource.quantity_available}</div>
                            <Badge className={resource.availability_status === 'unavailable' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}>
                              {resource.availability_status}
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
                    <Phone className="h-5 w-5 text-blue-500" />
                    جهات الاتصال الطارئة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emergencyContacts
                      .filter(contact => contact.availability === '24/7')
                      .slice(0, 4)
                      .map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="text-xs text-gray-500">{contact.role}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                              <Phone className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                              <Mail className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">سيناريوهات الطوار��</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  استيراد سيناريو
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  سيناريو جديد
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className={`border-l-4 ${
                  scenario.severity === 'critical' ? 'border-l-red-500' :
                  scenario.severity === 'high' ? 'border-l-orange-500' :
                  scenario.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(scenario.type)}
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(scenario.severity)}>
                          {scenario.severity}
                        </Badge>
                        <Badge className={getStatusColor(scenario.status)}>
                          {scenario.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">احتمالية النجاح:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={scenario.success_probability} className="flex-1 h-2" />
                            <span className="font-medium">{scenario.success_probability}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">المساحة المتأثرة:</span>
                          <p className="font-medium">{scenario.estimated_impact.area_affected} هكتار</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الخسارة المالية:</span>
                          <p className="font-medium text-red-600">${scenario.estimated_impact.financial_loss.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">وقت التعافي:</span>
                          <p className="font-medium">{scenario.estimated_impact.recovery_time}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">شروط التفعيل:</h4>
                        <ul className="text-xs space-y-1">
                          {scenario.trigger_conditions.slice(0, 3).map((condition, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">المناطق المتأثرة:</h4>
                        <div className="flex flex-wrap gap-1">
                          {scenario.affected_areas.map((area, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">خطط الاستجابة:</h4>
                        <div className="text-xs text-gray-600">
                          {scenario.response_plans.length} خطة • {scenario.automatic_actions.length} إجراء تلقائي • {scenario.manual_actions.length} إجراء يدوي
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => activateScenario(scenario.id)}
                        disabled={scenario.status === 'active'}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        تفعيل
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => runSimulation(scenario.id, {})}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        محاكاة
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        تعديل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">خطط الاستجابة للطوارئ</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                خطة جديدة
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {responsePlans.map((plan) => {
                const completedSteps = plan.steps.filter(step => step.completion_status === 'completed').length;
                const totalSteps = plan.steps.length;
                const progress = (completedSteps / Math.max(totalSteps, 1)) * 100;
                
                return (
                  <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge className={plan.priority === 'critical' ? 'bg-red-500 text-white' : 
                                       plan.priority === 'high' ? 'bg-orange-500 text-white' : 
                                       plan.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                       'bg-green-500 text-white'}>
                          {plan.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Progress value={progress} className="flex-1" />
                          <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">وقت التنفيذ:</span>
                            <p className="font-medium">{plan.execution_time}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">التكلفة المقدرة:</span>
                            <p className="font-medium">${plan.estimated_cost.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">الخطوات:</span>
                            <p className="font-medium">{completedSteps}/{totalSteps}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">الفريق المسؤول:</span>
                            <p className="font-medium">{plan.responsible_team.length} أعضاء</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">المتطلبات الأساسية:</h4>
                          <ul className="text-xs space-y-1">
                            {plan.prerequisites.slice(0, 3).map((req, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">معايير النجاح:</h4>
                          <ul className="text-xs space-y-1">
                            {plan.success_criteria.slice(0, 2).map((criteria, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <Target className="h-3 w-3 text-blue-500" />
                                {criteria}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          عرض الخطوات
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          تعديل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedPlan && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>خطوات تنفيذ الخطة: {selectedPlan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPlan.steps
                      .sort((a, b) => a.sequence - b.sequence)
                      .map((step) => (
                        <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">{step.sequence}</span>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium">{step.description}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                              <div>النوع: {step.action_type}</div>
                              <div>المدة: {step.estimated_duration}</div>
                              <div>العمالة: {step.personnel_required} شخص</div>
                              <div>المعدات: {step.equipment_needed.length} عنصر</div>
                            </div>
                            {step.dependencies.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                يعتمد على: {step.dependencies.join(', ')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
                            <Badge className={getStatusColor(step.completion_status)}>
                              {step.completion_status}
                            </Badge>
                            <div className="mt-2">
                              <Select onValueChange={(value) => updateStepStatus(selectedPlan.id, step.id, value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="تحديث" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">معلق</SelectItem>
                                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                                  <SelectItem value="completed">مكتمل</SelectItem>
                                  <SelectItem value="failed">فشل</SelectItem>
                                  <SelectItem value="skipped">تم تخطيه</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">محاكاة السيناريوهات</h2>
              <Button disabled={isSimulationRunning}>
                <Play className="h-4 w-4 mr-2" />
                {isSimulationRunning ? 'جاري التشغيل...' : 'تشغيل محاكاة جديدة'}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعداد المحاكاة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>اختيار السيناريو</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السيناريو" />
                      </SelectTrigger>
                      <SelectContent>
                        {scenarios.map((scenario) => (
                          <SelectItem key={scenario.id} value={scenario.id}>
                            {scenario.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>شدة الحدث (%)</Label>
                    <Input type="number" min="0" max="100" defaultValue="50" />
                  </div>
                  
                  <div>
                    <Label>مدة المحاكاة (دقائق)</Label>
                    <Input type="number" min="1" max="60" defaultValue="5" />
                  </div>
                  
                  <div>
                    <Label>الموارد المتاحة (%)</Label>
                    <Input type="number" min="0" max="100" defaultValue="100" />
                  </div>
                  
                  <Button className="w-full" disabled={isSimulationRunning}>
                    <Play className="h-4 w-4 mr-2" />
                    بدء المحاكاة
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>نتائج المحاكاة الأخيرة</CardTitle>
                </CardHeader>
                <CardContent>
                  {simulations.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">معدل النجاح:</span>
                          <p className="text-lg font-bold text-green-600">{simulations[0]?.results.success_rate}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الأضرار المقدرة:</span>
                          <p className="text-lg font-bold text-red-600">${simulations[0]?.results.estimated_damage?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">وقت الاستجابة:</span>
                          <p className="text-lg font-bold text-blue-600">{simulations[0]?.results.response_time} دقيقة</p>
                        </div>
                        <div>
                          <span className="text-gray-500">استخدام الموارد:</span>
                          <p className="text-lg font-bold text-purple-600">{simulations[0]?.results.resource_utilization}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">التوصيات:</h4>
                        <ul className="space-y-1">
                          {simulations[0]?.results.recommendations?.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <Lightbulb className="h-3 w-3 text-yellow-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">لا توجد محاكاة متاحة</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>سجل المحاكاة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {simulations.slice(0, 5).map((simulation) => (
                    <div key={simulation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{simulation.simulation_name}</h4>
                        <p className="text-sm text-gray-600">تاريخ التشغيل: {simulation.run_date}</p>
                        <p className="text-sm text-gray-600">المدة: {simulation.duration} دقيقة</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{simulation.results.success_rate}%</div>
                        <div className="text-sm text-gray-600">معدل النجاح</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <h2 className="text-2xl font-bold">إدارة موارد الطوارئ</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {scenarios
                .flatMap(scenario => scenario.resources_needed)
                .slice(0, 8)
                .map((resource) => (
                  <Card key={resource.id} className={`border-l-4 ${
                    resource.availability_status === 'available' ? 'border-l-green-500' :
                    resource.availability_status === 'in_use' ? 'border-l-yellow-500' :
                    resource.availability_status === 'maintenance' ? 'border-l-orange-500' :
                    'border-l-red-500'
                  }`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <Badge className={resource.availability_status === 'available' ? 'bg-green-500 text-white' :
                                        resource.availability_status === 'in_use' ? 'bg-yellow-500 text-white' :
                                        resource.availability_status === 'maintenance' ? 'bg-orange-500 text-white' :
                                        'bg-red-500 text-white'}>
                          {resource.availability_status}
                        </Badge>
                      </div>
                      <CardDescription>{resource.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">متاح:</span>
                            <p className="font-bold text-green-600">{resource.quantity_available}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">مطلوب:</span>
                            <p className="font-bold text-blue-600">{resource.quantity_needed}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">الموقع:</span>
                            <p className="font-medium">{resource.location}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">وقت الوصول:</span>
                            <p className="font-medium">{resource.estimated_arrival_time}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-500 text-sm">التكلفة لكل وحدة:</span>
                          <p className="font-bold text-lg">${resource.cost_per_unit}</p>
                        </div>
                        
                        <div>
                          <span className="text-gray-500 text-sm">المورد:</span>
                          <p className="text-sm">{resource.supplier_contact}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">جهات الاتصال الطارئة</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إضافة جهة اتصال
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emergencyContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                      <Badge className={contact.availability === '24/7' ? 'bg-green-500 text-white' : 
                                     contact.availability === 'business_hours' ? 'bg-yellow-500 text-white' :
                                     'bg-red-500 text-white'}>
                        {contact.availability}
                      </Badge>
                    </div>
                    <CardDescription>{contact.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <span>{contact.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-500" />
                          <span>{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span>{contact.location}</span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-500 text-sm">التخصصات:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contact.specialty.map((spec, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">وقت الاستجابة:</span>
                          <p className="font-medium">{contact.response_time}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">جهة احتياطية:</span>
                          <p className="font-medium">{contact.backup_contact}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm">
                        <Phone className="h-3 w-3 mr-1" />
                        اتصال
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-3 w-3 mr-1" />
                        إيميل
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        رسالة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
