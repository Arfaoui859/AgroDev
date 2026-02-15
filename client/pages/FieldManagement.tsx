import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Droplets,
  Thermometer,
  Camera,
  Calendar,
  BarChart3,
  Map,
  Eye,
  FileText,
  Settings,
  Bell,
  History,
  RotateCcw,
  Sprout,
  Wheat,
  Flower2,
  Sprout as Seedling,
  TreePine,
  ArrowRight,
  Save,
  Users,
  Target,
  DollarSign,
  TrendingDown,
  Import,
  ExternalLink,
  Database,
  MapIcon,
  Globe,
  Satellite,
  Navigation
} from 'lucide-react';

// ============ TYPES & INTERFACES ============

interface Field {
  id: string;
  name: string;
  nameArabic: string;
  farmId: string;
  area: number; // in hectares
  coordinates: {
    lat: number;
    lng: number;
    boundary?: Array<{lat: number, lng: number}>;
  };
  soilType: {
    type: 'clay' | 'sandy' | 'loam' | 'silt' | 'rocky';
    typeArabic: string;
    ph: number;
    organicMatter: number;
    nutrients: {
      nitrogen: number;
      phosphorus: number;
      potassium: number;
    };
  };
  status: 'active' | 'inactive' | 'renovation' | 'fallow';
  statusArabic: string;
  elevation: number;
  slope: number;
  images: Array<{
    url: string;
    type: 'satellite' | 'drone' | 'ground';
    date: string;
    description: string;
  }>;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

interface Farm {
  id: string;
  name: string;
  nameArabic: string;
  owner: string;
  location: {
    address: string;
    addressArabic: string;
    governorate: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  totalArea: number;
  fields: Field[];
  establishedDate: string;
  farmType: 'organic' | 'conventional' | 'mixed';
  farmTypeArabic: string;
  description: string;
  descriptionArabic: string;
}

interface CropHistory {
  id: string;
  fieldId: string;
  cropType: string;
  cropTypeArabic: string;
  variety: string;
  varietyArabic: string;
  plantingDate: string;
  harvestDate?: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonArabic: string;
  growthStages: Array<{
    stage: 'planting' | 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity' | 'harvest';
    stageArabic: string;
    date: string;
    status: 'completed' | 'in_progress' | 'delayed' | 'skipped';
    notes: string;
    images?: string[];
  }>;
  yield: {
    quantity: number;
    unit: 'kg' | 'ton' | 'quintal';
    qualityGrade: 'A' | 'B' | 'C';
  };
  financials: {
    costs: {
      seeds: number;
      fertilizers: number;
      pesticides: number;
      labor: number;
      equipment: number;
      irrigation: number;
      other: number;
    };
    revenue: number;
    profit: number;
  };
  weatherData: {
    avgTemperature: number;
    totalRainfall: number;
    sunshineHours: number;
  };
  issues: Array<{
    type: 'pest' | 'disease' | 'weather' | 'soil' | 'other';
    typeArabic: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    dateReported: string;
    resolved: boolean;
    treatment?: string;
  }>;
  recommendations: Array<{
    type: 'fertilizer' | 'irrigation' | 'pest_control' | 'soil_improvement' | 'crop_rotation';
    description: string;
    descriptionArabic: string;
    priority: 'low' | 'medium' | 'high';
    implemented: boolean;
  }>;
}

interface FieldAlert {
  id: string;
  fieldId: string;
  type: 'weather' | 'growth_delay' | 'soil_issue' | 'irrigation' | 'pest' | 'disease' | 'rotation_warning';
  typeArabic: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityArabic: string;
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
  actionRequired: boolean;
  recommendations: string[];
  aiConfidence: number;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'import';
  actionArabic: string;
  entityType: 'farm' | 'field' | 'crop' | 'alert';
  entityId: string;
  entityName: string;
  changes?: {
    before: any;
    after: any;
  };
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface FieldPerformanceMetrics {
  fieldId: string;
  period: {
    start: string;
    end: string;
  };
  productivity: {
    yieldPerHectare: number;
    averageYield: number;
    bestYield: number;
    worstYield: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  profitability: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    roi: number; // Return on Investment
  };
  environmentalHealth: {
    soilHealthScore: number;
    waterUsageEfficiency: number;
    carbonFootprint: number;
    biodiversityIndex: number;
  };
  recommendations: {
    cropRotation: string[];
    soilImprovement: string[];
    costOptimization: string[];
  };
}

// ============ MOCK DATA ============

const mockFarms: Farm[] = [
  {
    id: 'farm-001',
    name: 'Al-Mahmoud Agricultural Farm',
    nameArabic: 'مزرعة المحمود الزراعية',
    owner: 'Ahmed Al-Mahmoud',
    location: {
      address: 'Northern Jordan Valley, Irbid Governorate',
      addressArabic: 'الأغوار الشمالية، محافظة إربد',
      governorate: 'Irbid',
      city: 'Deir Alla',
      coordinates: {
        lat: 32.1967,
        lng: 35.6180
      }
    },
    totalArea: 25.5,
    fields: [],
    establishedDate: '2018-03-15',
    farmType: 'mixed',
    farmTypeArabic: 'مختلط',
    description: 'Family-owned farm specializing in vegetables and citrus fruits',
    descriptionArabic: 'مزرعة عائلية متخصصة في الخضروات والحمضيات'
  }
];

const mockFields: Field[] = [
  {
    id: 'field-001',
    name: 'North Field',
    nameArabic: 'الحقل الشمالي',
    farmId: 'farm-001',
    area: 5.2,
    coordinates: {
      lat: 32.1970,
      lng: 35.6185,
      boundary: [
        {lat: 32.1968, lng: 35.6180},
        {lat: 32.1972, lng: 35.6180},
        {lat: 32.1972, lng: 35.6190},
        {lat: 32.1968, lng: 35.6190}
      ]
    },
    soilType: {
      type: 'loam',
      typeArabic: 'طينية طمية',
      ph: 7.2,
      organicMatter: 3.8,
      nutrients: {
        nitrogen: 140,
        phosphorus: 35,
        potassium: 180
      }
    },
    status: 'active',
    statusArabic: 'نشط',
    elevation: 245,
    slope: 2.5,
    images: [
      {
        url: '/placeholder.svg',
        type: 'satellite',
        date: '2024-01-15',
        description: 'Latest satellite view'
      }
    ],
    createdAt: '2022-03-01',
    updatedAt: '2024-01-15',
    notes: 'Excellent soil quality, good drainage'
  },
  {
    id: 'field-002',
    name: 'South Field',
    nameArabic: 'الحقل الجنوبي',
    farmId: 'farm-001',
    area: 8.3,
    coordinates: {
      lat: 32.1960,
      lng: 35.6175,
      boundary: [
        {lat: 32.1955, lng: 35.6170},
        {lat: 32.1965, lng: 35.6170},
        {lat: 32.1965, lng: 35.6180},
        {lat: 32.1955, lng: 35.6180}
      ]
    },
    soilType: {
      type: 'clay',
      typeArabic: 'طينية',
      ph: 6.8,
      organicMatter: 4.2,
      nutrients: {
        nitrogen: 120,
        phosphorus: 28,
        potassium: 165
      }
    },
    status: 'active',
    statusArabic: 'نشط',
    elevation: 240,
    slope: 1.8,
    images: [
      {
        url: '/placeholder.svg',
        type: 'drone',
        date: '2024-01-10',
        description: 'Drone survey of current crops'
      }
    ],
    createdAt: '2022-03-01',
    updatedAt: '2024-01-10',
    notes: 'Slightly heavy soil, requires better drainage'
  }
];

const mockCropHistory: CropHistory[] = [
  {
    id: 'crop-001',
    fieldId: 'field-001',
    cropType: 'tomato',
    cropTypeArabic: 'طماطم',
    variety: 'Early Girl',
    varietyArabic: 'إيرلي جيرل',
    plantingDate: '2023-09-15',
    harvestDate: '2024-01-20',
    season: 'autumn',
    seasonArabic: 'خريف',
    growthStages: [
      {
        stage: 'planting',
        stageArabic: 'الزراعة',
        date: '2023-09-15',
        status: 'completed',
        notes: 'Seeds planted in optimal conditions'
      },
      {
        stage: 'germination',
        stageArabic: 'الإنبات',
        date: '2023-09-22',
        status: 'completed',
        notes: '95% germination rate achieved'
      },
      {
        stage: 'vegetative',
        stageArabic: 'النمو الخضري',
        date: '2023-10-15',
        status: 'completed',
        notes: 'Healthy vegetative growth'
      },
      {
        stage: 'flowering',
        stageArabic: 'التزهير',
        date: '2023-11-10',
        status: 'completed',
        notes: 'Abundant flowering stage'
      },
      {
        stage: 'fruiting',
        stageArabic: 'الإثمار',
        date: '2023-12-01',
        status: 'completed',
        notes: 'Good fruit set'
      },
      {
        stage: 'maturity',
        stageArabic: 'النضج',
        date: '2024-01-10',
        status: 'completed',
        notes: 'Fruits reaching maturity'
      },
      {
        stage: 'harvest',
        stageArabic: 'الحصاد',
        date: '2024-01-20',
        status: 'completed',
        notes: 'Successful harvest completed'
      }
    ],
    yield: {
      quantity: 18.5,
      unit: 'ton',
      qualityGrade: 'A'
    },
    financials: {
      costs: {
        seeds: 450,
        fertilizers: 890,
        pesticides: 320,
        labor: 1250,
        equipment: 560,
        irrigation: 340,
        other: 180
      },
      revenue: 7400,
      profit: 3410
    },
    weatherData: {
      avgTemperature: 22.5,
      totalRainfall: 145,
      sunshineHours: 2100
    },
    issues: [
      {
        type: 'pest',
        typeArabic: 'آفة',
        description: 'Minor aphid infestation',
        severity: 'low',
        dateReported: '2023-10-28',
        resolved: true,
        treatment: 'Organic insecticide spray'
      }
    ],
    recommendations: [
      {
        type: 'crop_rotation',
        description: 'Plant legumes next season to improve soil nitrogen',
        descriptionArabic: 'زراعة البقوليات الموسم القادم لتحسين النيتروجين في التربة',
        priority: 'medium',
        implemented: false
      }
    ]
  }
];

const mockAlerts: FieldAlert[] = [
  {
    id: 'alert-001',
    fieldId: 'field-001',
    type: 'weather',
    typeArabic: 'طقس',
    severity: 'high',
    severityArabic: 'عالي',
    title: 'Heavy Rain Warning',
    titleArabic: 'تحذير من أمطار غزيرة',
    message: 'Heavy rainfall expected in the next 48 hours. Check drainage systems.',
    messageArabic: 'أمطار غزيرة متوقعة خلال 48 ساعة القادمة. تحقق من أنظمة الصرف.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    isResolved: false,
    actionRequired: true,
    recommendations: [
      'Check field drainage systems',
      'Prepare protective covers for young plants',
      'Monitor soil moisture levels'
    ],
    aiConfidence: 87
  },
  {
    id: 'alert-002',
    fieldId: 'field-002',
    type: 'growth_delay',
    typeArabic: 'تأخر في النمو',
    severity: 'medium',
    severityArabic: 'متوسط',
    title: 'Growth Stage Delay Detected',
    titleArabic: 'تم اكتشاف تأخر في مرحلة النمو',
    message: 'Crops are 5 days behind expected flowering stage. Consider nutrition check.',
    messageArabic: 'المحاصيل متأخرة 5 أيام عن مرحلة التزهير المتوقعة. فكر في فحص التغذية.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: true,
    isResolved: false,
    actionRequired: true,
    recommendations: [
      'Conduct soil nutrition analysis',
      'Check irrigation schedule',
      'Consider fertilizer application'
    ],
    aiConfidence: 92
  }
];

// ============ MAIN COMPONENT ============

export default function FieldManagement() {
  const { isArabic } = useLanguage();
  
  // State management
  const [farms] = useState<Farm[]>(mockFarms);
  const [fields, setFields] = useState<Field[]>(mockFields);
  const [selectedFarm, setSelectedFarm] = useState<Farm>(mockFarms[0]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [cropHistory] = useState<CropHistory[]>(mockCropHistory);
  const [alerts, setAlerts] = useState<FieldAlert[]>(mockAlerts);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [showFieldDetails, setShowFieldDetails] = useState(false);
  const [newField, setNewField] = useState<Partial<Field>>({});

  // Get unread alerts count
  const unreadAlertsCount = alerts.filter(alert => !alert.isRead).length;

  // Calculate farm statistics
  const farmStats = {
    totalFields: fields.length,
    activeFields: fields.filter(f => f.status === 'active').length,
    totalArea: fields.reduce((sum, field) => sum + field.area, 0),
    avgYield: cropHistory.length > 0 ? 
      cropHistory.reduce((sum, crop) => sum + crop.yield.quantity, 0) / cropHistory.length : 0
  };

  // Handle field selection
  const handleFieldSelect = (field: Field) => {
    setSelectedField(field);
    setShowFieldDetails(true);
  };

  // Mark alert as read
  const markAlertAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  // Resolve alert
  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, isResolved: true, isRead: true } : alert
    ));
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {isArabic ? 'إدارة الحقول والتاريخ الزراعي' : 'Field Management & Agricultural History'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? 'نظام متقدم لإدارة المزارع والحقول مع التتبع الذكي للمحاصيل' : 'Advanced farm and field management system with smart crop tracking'}
          </p>
        </div>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadAlertsCount}
              </Badge>
            )}
          </Button>
          <Button onClick={() => setShowAddFieldDialog(true)}>
            <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isArabic ? 'إضافة حقل' : 'Add Field'}
          </Button>
        </div>
      </div>

      {/* Farm Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Map className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'إجمالي الحقول' : 'Total Fields'}
                </p>
                <p className="text-2xl font-bold">{farmStats.totalFields}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'الحقول النشطة' : 'Active Fields'}
                </p>
                <p className="text-2xl font-bold">{farmStats.activeFields}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'المساحة الكلية' : 'Total Area'}
                </p>
                <p className="text-2xl font-bold">{farmStats.totalArea.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'هكتار' : 'hectares'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wheat className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'متوسط الإنتاج' : 'Avg Yield'}
                </p>
                <p className="text-2xl font-bold">{farmStats.avgYield.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'طن/هكتار' : 'ton/ha'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>{isArabic ? 'تنبيهات الحقول الذكية' : 'Smart Field Alerts'}</span>
              <Badge variant="secondary">{alerts.filter(a => !a.isResolved).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(alert => !alert.isResolved).slice(0, 3).map((alert) => (
                <Alert key={alert.id} className={`${!alert.isRead ? 'border-orange-200 bg-orange-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                        <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                          {isArabic ? alert.severityArabic : alert.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {isArabic ? alert.typeArabic : alert.type}
                        </span>
                      </div>
                      <h4 className="font-medium">{isArabic ? alert.titleArabic : alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isArabic ? alert.messageArabic : alert.message}
                      </p>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                        <span className="text-xs text-muted-foreground">
                          {isArabic ? 'ثقة الذكاء الاصطناعي:' : 'AI Confidence:'}
                        </span>
                        <Progress value={alert.aiConfidence} className="w-16 h-2" />
                        <span className="text-xs">{alert.aiConfidence}%</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      {!alert.isRead && (
                        <Button size="sm" variant="outline" onClick={() => markAlertAsRead(alert.id)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">{isArabic ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="fields">{isArabic ? 'الحقول' : 'Fields'}</TabsTrigger>
          <TabsTrigger value="crops">{isArabic ? 'المحاصيل' : 'Crops'}</TabsTrigger>
          <TabsTrigger value="maps">{isArabic ? 'الخرائط' : 'Maps'}</TabsTrigger>
          <TabsTrigger value="analytics">{isArabic ? 'التحليلات' : 'Analytics'}</TabsTrigger>
          <TabsTrigger value="history">{isArabic ? 'السجل' : 'History'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'معلومات المزر��ة' : 'Farm Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-medium">{isArabic ? 'اسم المزرعة' : 'Farm Name'}</Label>
                  <p>{isArabic ? selectedFarm.nameArabic : selectedFarm.name}</p>
                </div>
                <div>
                  <Label className="font-medium">{isArabic ? 'الموقع' : 'Location'}</Label>
                  <p>{isArabic ? selectedFarm.location.addressArabic : selectedFarm.location.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">{isArabic ? 'المساحة الكلية' : 'Total Area'}</Label>
                    <p>{selectedFarm.totalArea} {isArabic ? 'هكتار' : 'hectares'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">{isArabic ? 'نوع الزراعة' : 'Farm Type'}</Label>
                    <p>{isArabic ? selectedFarm.farmTypeArabic : selectedFarm.farmType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'أداء الموسم الحالي' : 'Current Season Performance'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>{isArabic ? 'الإنتاجية' : 'Productivity'}</span>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Progress value={78} className="w-24" />
                      <span className="text-sm">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{isArabic ? 'الربحية' : 'Profitability'}</span>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Progress value={85} className="w-24" />
                      <span className="text-sm">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{isArabic ? 'صحة التربة' : 'Soil Health'}</span>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Progress value={92} className="w-24" />
                      <span className="text-sm">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <History className="h-5 w-5" />
                <span>{isArabic ? 'النشاطات الأخيرة' : 'Recent Activities'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    action: isArabic ? 'تم زراعة الطماطم في الحقل الشمالي' : 'Tomatoes planted in North Field',
                    time: isArabic ? 'منذ 3 أيام' : '3 days ago',
                    icon: Seedling,
                    color: 'text-green-600'
                  },
                  {
                    action: isArabic ? 'تحديث تحليل التربة للحقل الجنوبي' : 'Soil analysis updated for South Field',
                    time: isArabic ? 'منذ 5 أيام' : '5 days ago',
                    icon: Activity,
                    color: 'text-blue-600'
                  },
                  {
                    action: isArabic ? 'حصاد القمح من الحقل الغربي' : 'Wheat harvested from West Field',
                    time: isArabic ? 'منذ أسبوع' : '1 week ago',
                    icon: Wheat,
                    color: 'text-yellow-600'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse p-3 border rounded-lg">
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <Card key={field.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleFieldSelect(field)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{isArabic ? field.nameArabic : field.name}</CardTitle>
                    <Badge variant={field.status === 'active' ? 'default' : 'secondary'}>
                      {isArabic ? field.statusArabic : field.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <MapIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{field.area} {isArabic ? 'هكتار' : 'hectares'}</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Leaf className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{isArabic ? field.soilType.typeArabic : field.soilType.type}</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">pH: {field.soilType.ph}</span>
                    </div>
                    {field.images.length > 0 && (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {field.images.length} {isArabic ? 'صورة' : 'images'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {isArabic ? 'آخر تحديث:' : 'Last updated:'}
                      </span>
                      <span className="text-sm">
                        {new Date(field.updatedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Crops Tab */}
        <TabsContent value="crops" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Sprout className="h-5 w-5" />
                <span>{isArabic ? 'تاريخ المحاصيل والدورات الزراعية' : 'Crop History & Rotation'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cropHistory.map((crop) => (
                  <div key={crop.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-lg">
                          {isArabic ? crop.cropTypeArabic : crop.cropType} - {isArabic ? crop.varietyArabic : crop.variety}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {fields.find(f => f.id === crop.fieldId)?.nameArabic || fields.find(f => f.id === crop.fieldId)?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {isArabic ? crop.seasonArabic : crop.season}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(crop.plantingDate).toLocaleDateString()} - {crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : isArabic ? 'جاري' : 'Ongoing'}
                        </p>
                      </div>
                    </div>

                    {/* Growth Stages */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">{isArabic ? 'مراحل النمو' : 'Growth Stages'}</h4>
                      <div className="flex flex-wrap gap-2">
                        {crop.growthStages.map((stage, index) => (
                          <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                            <div className={`w-3 h-3 rounded-full ${
                              stage.status === 'completed' ? 'bg-green-500' :
                              stage.status === 'in_progress' ? 'bg-yellow-500' :
                              stage.status === 'delayed' ? 'bg-red-500' : 'bg-gray-300'
                            }`} />
                            <span className="text-sm">{isArabic ? stage.stageArabic : stage.stage}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">{isArabic ? 'الإنتاج' : 'Yield'}</p>
                        <p className="font-medium">{crop.yield.quantity} {crop.yield.unit}</p>
                        <p className="text-xs text-muted-foreground">{isArabic ? 'درجة' : 'Grade'} {crop.yield.qualityGrade}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">{isArabic ? 'الإيرادات' : 'Revenue'}</p>
                        <p className="font-medium">{crop.financials.revenue} {isArabic ? 'د.أ' : 'JOD'}</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-600">{isArabic ? 'الربح' : 'Profit'}</p>
                        <p className="font-medium">{crop.financials.profit} {isArabic ? 'د.أ' : 'JOD'}</p>
                      </div>
                    </div>

                    {/* Issues and Recommendations */}
                    {(crop.issues.length > 0 || crop.recommendations.length > 0) && (
                      <div className="mt-4 space-y-2">
                        {crop.issues.filter(issue => !issue.resolved).map((issue, index) => (
                          <Alert key={index} className="border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{isArabic ? issue.typeArabic : issue.type}:</strong> {issue.description}
                            </AlertDescription>
                          </Alert>
                        ))}
                        
                        {crop.recommendations.filter(rec => !rec.implemented).slice(0, 2).map((rec, index) => (
                          <Alert key={index} className="border-blue-200 bg-blue-50">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>{isArabic ? 'توصية' : 'Recommendation'}:</strong> {isArabic ? rec.descriptionArabic : rec.description}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maps Tab */}
        <TabsContent value="maps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Satellite className="h-5 w-5" />
                <span>{isArabic ? 'الخرائط الذكية للحقول' : 'Smart Field Maps'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Map Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <Select defaultValue="satellite">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="satellite">{isArabic ? 'صور القمر الصناعي' : 'Satellite View'}</SelectItem>
                        <SelectItem value="terrain">{isArabic ? 'التضاريس' : 'Terrain View'}</SelectItem>
                        <SelectItem value="hybrid">{isArabic ? 'مختلط' : 'Hybrid View'}</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Label className="text-sm">{isArabic ? 'طبقات البيانات:' : 'Data Layers:'}</Label>
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <Badge variant="secondary" className="cursor-pointer">
                          {isArabic ? 'حدود الحقول' : 'Field Boundaries'}
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer">
                          {isArabic ? 'المحاصيل' : 'Crops'}
                        </Badge>
                        <Badge variant="secondary" className="cursor-pointer">
                          {isArabic ? 'التربة' : 'Soil Data'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline">
                    <Navigation className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {isArabic ? 'تحديد المواقع' : 'Location Services'}
                  </Button>
                </div>

                {/* Map Placeholder */}
                <div className="h-96 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      {isArabic ? 'خريطة تفاعلية للحقول' : 'Interactive Field Map'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic ? 'خريطة تفاعلية مع طبقات البيانات الذكية' : 'Interactive map with smart data layers'}
                    </p>
                  </div>
                </div>

                {/* Field List with Map Integration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <Card key={field.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{isArabic ? field.nameArabic : field.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {field.area} {isArabic ? 'هكتار' : 'hectares'}
                            </p>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {field.coordinates.lat.toFixed(4)}, {field.coordinates.lng.toFixed(4)}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <BarChart3 className="h-5 w-5" />
                  <span>{isArabic ? 'مؤشرات أداء الحقول' : 'Field Performance Metrics'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{isArabic ? field.nameArabic : field.name}</h4>
                        <Badge variant="outline">{field.area} {isArabic ? 'هكتار' : 'ha'}</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isArabic ? 'الإنتاجية' : 'Productivity'}</span>
                            <span>85%</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isArabic ? 'الربحية' : 'Profitability'}</span>
                            <span>78%</span>
                          </div>
                          <Progress value={78} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isArabic ? 'الصحة البيئية' : 'Environmental Health'}</span>
                            <span>92%</span>
                          </div>
                          <Progress value={92} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">
                            {isArabic ? 'محسن بـ 12%' : 'Improved by 12%'}
                          </span>
                        </div>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                          {isArabic ? 'تقرير' : 'Report'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Target className="h-5 w-5" />
                  <span>{isArabic ? 'توصيات الذكاء الاصطناعي' : 'AI Recommendations'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{isArabic ? 'دورة المحاصيل:' : 'Crop Rotation:'}</strong> 
                      {isArabic ? ' يُنصح بزراعة البقوليات في الحقل الشمالي الموسم القادم لتحسين النيتروجين' : ' Recommend planting legumes in North Field next season to improve nitrogen levels'}
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-green-200 bg-green-50">
                    <Leaf className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{isArabic ? 'تحسين التربة:' : 'Soil Improvement:'}</strong> 
                      {isArabic ? ' إضافة 3 طن من الكومبوست للحقل الجنوبي سيحسن صحة التربة بنسبة 15%' : ' Adding 3 tons of compost to South Field will improve soil health by 15%'}
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{isArabic ? 'تحسين التكاليف:' : 'Cost Optimization:'}</strong> 
                      {isArabic ? ' تقليل استخدام الأسمدة في الحقل الغربي بنسبة 20% مع الحفاظ على الإنتاجية' : ' Reduce fertilizer use in West Field by 20% while maintaining productivity'}
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-purple-200 bg-purple-50">
                    <Droplets className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{isArabic ? 'كفاءة المياه:' : 'Water Efficiency:'}</strong> 
                      {isArabic ? ' تطبيق نظام الري بالتنقيط سيوفر 30% من استهلاك المياه' : ' Implementing drip irrigation will save 30% water consumption'}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{isArabic ? 'سجل النشاطات والتعديلات' : 'Activity & Edit History'}</h3>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {isArabic ? 'تصدير' : 'Export'}
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {isArabic ? 'استيراد' : 'Import'}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  {
                    user: 'Ahmed Al-Mahmoud',
                    action: isArabic ? 'أضاف حقل جديد' : 'Added new field',
                    entity: isArabic ? 'الحقل الشرقي' : 'East Field',
                    time: isArabic ? 'منذ ساعتين' : '2 hours ago',
                    icon: Plus,
                    color: 'text-green-600'
                  },
                  {
                    user: 'Sara Hussein',
                    action: isArabic ? 'حدث تحليل التربة' : 'Updated soil analysis',
                    entity: isArabic ? 'الحقل الشمالي' : 'North Field',
                    time: isArabic ? 'منذ 4 ساعات' : '4 hours ago',
                    icon: Edit3,
                    color: 'text-blue-600'
                  },
                  {
                    user: 'System AI',
                    action: isArabic ? 'أنشأ تنبيه طقس' : 'Created weather alert',
                    entity: isArabic ? 'جميع الحقول' : 'All fields',
                    time: isArabic ? 'منذ 6 ساعات' : '6 hours ago',
                    icon: Bell,
                    color: 'text-orange-600'
                  },
                  {
                    user: 'Ahmed Al-Mahmoud',
                    action: isArabic ? 'صدر تقرير المحصول' : 'Exported crop report',
                    entity: isArabic ? 'محصول الطماطم' : 'Tomato crop',
                    time: isArabic ? 'منذ يوم' : '1 day ago',
                    icon: Download,
                    color: 'text-purple-600'
                  },
                  {
                    user: 'Omar Khalil',
                    action: isArabic ? 'بدأ مرحلة جديدة' : 'Started new growth stage',
                    entity: isArabic ? 'الحقل الجنوبي' : 'South Field',
                    time: isArabic ? 'منذ يومين' : '2 days ago',
                    icon: Sprout,
                    color: 'text-green-500'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse p-4 hover:bg-muted/50">
                    <div className={`p-2 rounded-full bg-background border`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.user} {activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.entity}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                    <Button size="sm" variant="ghost">
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Field Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'إضافة حقل جديد' : 'Add New Field'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'أدخل تفاصيل الحقل الجديد لإضافته إلى المزرعة' : 'Enter the details for the new field to add it to your farm'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isArabic ? 'اسم الحقل' : 'Field Name'}</Label>
              <Input 
                placeholder={isArabic ? 'مثل: الحقل الشرقي' : 'e.g., East Field'}
                value={newField.name || ''}
                onChange={(e) => setNewField({...newField, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{isArabic ? 'المساحة (هكتار)' : 'Area (hectares)'}</Label>
              <Input 
                type="number"
                placeholder="5.2"
                value={newField.area || ''}
                onChange={(e) => setNewField({...newField, area: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'نوع التربة' : 'Soil Type'}</Label>
              <Select onValueChange={(value) => setNewField({...newField, soilType: {...newField.soilType, type: value as any}})}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'اختر نوع التربة' : 'Select soil type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clay">{isArabic ? 'طينية' : 'Clay'}</SelectItem>
                  <SelectItem value="sandy">{isArabic ? 'رملية' : 'Sandy'}</SelectItem>
                  <SelectItem value="loam">{isArabic ? 'طينية طمية' : 'Loam'}</SelectItem>
                  <SelectItem value="silt">{isArabic ? 'غرينية' : 'Silt'}</SelectItem>
                  <SelectItem value="rocky">{isArabic ? 'صخرية' : 'Rocky'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'درجة الحموضة (pH)' : 'pH Level'}</Label>
              <Input 
                type="number"
                step="0.1"
                placeholder="7.2"
                value={newField.soilType?.ph || ''}
                onChange={(e) => setNewField({
                  ...newField, 
                  soilType: {...newField.soilType, ph: parseFloat(e.target.value)}
                })}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>{isArabic ? 'إحداثيات GPS' : 'GPS Coordinates'}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder={isArabic ? 'خط العرض' : 'Latitude'} />
                <Input placeholder={isArabic ? 'خط الطول' : 'Longitude'} />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea 
                placeholder={isArabic ? 'أي ملاحظات إضافية حول الحقل...' : 'Any additional notes about the field...'}
                value={newField.notes || ''}
                onChange={(e) => setNewField({...newField, notes: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button variant="outline" onClick={() => setShowAddFieldDialog(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={() => {
              // Handle field creation
              setShowAddFieldDialog(false);
              setNewField({});
            }}>
              <Save className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isArabic ? 'حفظ الحقل' : 'Save Field'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Details Dialog */}
      <Dialog open={showFieldDetails} onOpenChange={setShowFieldDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedField && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{isArabic ? selectedField.nameArabic : selectedField.name}</span>
                  <Badge variant={selectedField.status === 'active' ? 'default' : 'secondary'}>
                    {isArabic ? selectedField.statusArabic : selectedField.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {isArabic ? 'تفاصيل شاملة للحقل مع البيانات والتاريخ' : 'Comprehensive field details with data and history'}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">{isArabic ? 'التفاصيل' : 'Details'}</TabsTrigger>
                  <TabsTrigger value="soil">{isArabic ? 'التربة' : 'Soil'}</TabsTrigger>
                  <TabsTrigger value="crops">{isArabic ? 'المحاصيل' : 'Crops'}</TabsTrigger>
                  <TabsTrigger value="images">{isArabic ? 'الصور' : 'Images'}</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">{isArabic ? 'المساحة' : 'Area'}</Label>
                      <p>{selectedField.area} {isArabic ? 'هكتار' : 'hectares'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">{isArabic ? 'الارتفاع' : 'Elevation'}</Label>
                      <p>{selectedField.elevation} {isArabic ? 'متر' : 'meters'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">{isArabic ? 'الانحدار' : 'Slope'}</Label>
                      <p>{selectedField.slope}%</p>
                    </div>
                    <div>
                      <Label className="font-medium">{isArabic ? 'تاريخ الإنشاء' : 'Created Date'}</Label>
                      <p>{new Date(selectedField.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="font-medium">{isArabic ? 'الإحداثيات' : 'Coordinates'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedField.coordinates.lat.toFixed(6)}, {selectedField.coordinates.lng.toFixed(6)}
                    </p>
                  </div>

                  {selectedField.notes && (
                    <div>
                      <Label className="font-medium">{isArabic ? 'الملاحظات' : 'Notes'}</Label>
                      <p className="text-sm">{selectedField.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="soil" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">{isArabic ? 'نوع التربة' : 'Soil Type'}</Label>
                      <p>{isArabic ? selectedField.soilType.typeArabic : selectedField.soilType.type}</p>
                    </div>
                    <div>
                      <Label className="font-medium">{isArabic ? 'درجة الحموضة' : 'pH Level'}</Label>
                      <p>{selectedField.soilType.ph}</p>
                    </div>
                    <div>
                      <Label className="font-medium">{isArabic ? 'المادة العضوية' : 'Organic Matter'}</Label>
                      <p>{selectedField.soilType.organicMatter}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="font-medium">{isArabic ? 'العناصر الغذائية (ppm)' : 'Nutrients (ppm)'}</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">{isArabic ? 'النيتروجين' : 'Nitrogen'}</p>
                        <p className="font-medium">{selectedField.soilType.nutrients.nitrogen}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">{isArabic ? 'الفوسفور' : 'Phosphorus'}</p>
                        <p className="font-medium">{selectedField.soilType.nutrients.phosphorus}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">{isArabic ? 'البوتاسيوم' : 'Potassium'}</p>
                        <p className="font-medium">{selectedField.soilType.nutrients.potassium}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="crops" className="space-y-4">
                  <div className="space-y-4">
                    {cropHistory.filter(crop => crop.fieldId === selectedField.id).map((crop) => (
                      <div key={crop.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{isArabic ? crop.cropTypeArabic : crop.cropType}</h4>
                            <p className="text-sm text-muted-foreground">{isArabic ? crop.varietyArabic : crop.variety}</p>
                          </div>
                          <Badge variant="outline">{isArabic ? crop.seasonArabic : crop.season}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{isArabic ? 'الزراعة:' : 'Planted:'}</span>
                            <p>{new Date(crop.plantingDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isArabic ? 'الحصاد:' : 'Harvested:'}</span>
                            <p>{crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : isArabic ? 'جاري' : 'Ongoing'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{isArabic ? 'الإنتاج:' : 'Yield:'}</span>
                            <p>{crop.yield.quantity} {crop.yield.unit}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedField.images.map((image, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium capitalize">{image.type}</p>
                          <p className="text-sm text-muted-foreground">{image.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(image.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
