import express from 'express';

const router = express.Router();

interface SoilData {
  ph: number;
  moisture: number;
  temperature: number;
  nutrients: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  lastUpdated: string;
}

interface CropData {
  id: string;
  name: string;
  nameArabic: string;
  variety: string;
  plantingDate: string;
  growthStage: string;
  growthStageArabic: string;
  progress: number;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  alerts: Array<{
    type: 'disease' | 'watering' | 'fertilizer' | 'harvest';
    message: string;
    messageArabic: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
  }>;
  expectedHarvest: string;
  area: number;
}

interface TaskData {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  type: 'watering' | 'fertilizer' | 'pruning' | 'harvest' | 'planting' | 'pest_control';
  cropId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  estimatedDuration: number;
  requiredMaterials?: string[];
}

interface AlertData {
  id: string;
  type: 'weather' | 'disease' | 'irrigation' | 'pest' | 'soil' | 'market';
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  actionable: boolean;
  actionText?: string;
  actionTextArabic?: string;
  resolved: boolean;
}

interface MarketPrice {
  crop: string;
  cropArabic: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  unit: string;
  lastUpdated: string;
  marketTrend: 'rising' | 'falling' | 'stable';
}

interface IoTSensorData {
  sensorId: string;
  type: 'soil_moisture' | 'temperature' | 'humidity' | 'ph' | 'light';
  value: number;
  unit: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  lastReading: string;
}

interface ExpertCommunication {
  id: string;
  expertName: string;
  expertType: 'agronomist' | 'veterinarian' | 'economist' | 'technician';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'online' | 'offline' | 'busy';
}

interface FinancialSummary {
  totalInvestment: number;
  currentExpenses: number;
  expectedRevenue: number;
  profitMargin: number;
  seasonalROI: number;
}

// Mock data generators
const generateMockSoilData = (): SoilData => ({
  ph: 6.8 + Math.random() * 0.8,
  moisture: 45 + Math.random() * 20,
  temperature: 22 + Math.random() * 8,
  nutrients: {
    nitrogen: 85 + Math.random() * 30,
    phosphorus: 45 + Math.random() * 25,
    potassium: 120 + Math.random() * 40
  },
  lastUpdated: new Date().toISOString()
});

const generateMockCrops = (): CropData[] => [
  {
    id: '1',
    name: 'Wheat',
    nameArabic: 'قمح',
    variety: 'Durum',
    plantingDate: '2024-11-01',
    growthStage: 'Tillering',
    growthStageArabic: 'التفريع',
    progress: 35,
    health: 'good',
    alerts: [
      {
        type: 'watering',
        message: 'Irrigation needed within 2 days',
        messageArabic: 'الري مطلوب خلال يومين',
        priority: 'medium',
        actionRequired: true
      }
    ],
    expectedHarvest: '2024-06-15',
    area: 2.5
  },
  {
    id: '2',
    name: 'Olive Trees',
    nameArabic: 'زيتون',
    variety: 'Chemlali',
    plantingDate: '2020-03-15',
    growthStage: 'Fruit Development',
    growthStageArabic: 'نمو الثمار',
    progress: 70,
    health: 'excellent',
    alerts: [
      {
        type: 'fertilizer',
        message: 'Apply potassium fertilizer next week',
        messageArabic: 'تطبيق سماد البوتاسيوم الأسبوع القادم',
        priority: 'low',
        actionRequired: false
      }
    ],
    expectedHarvest: '2024-10-20',
    area: 5.0
  },
  {
    id: '3',
    name: 'Tomatoes',
    nameArabic: 'طماطم',
    variety: 'Roma',
    plantingDate: '2024-09-15',
    growthStage: 'Flowering',
    growthStageArabic: 'الإزهار',
    progress: 60,
    health: 'fair',
    alerts: [
      {
        type: 'disease',
        message: 'Early blight detected - treatment recommended',
        messageArabic: 'تم اكتشاف اللفحة المبكرة - العلاج موصى به',
        priority: 'high',
        actionRequired: true
      }
    ],
    expectedHarvest: '2024-12-10',
    area: 1.2
  }
];

const generateMockTasks = (): TaskData[] => [
  {
    id: '1',
    title: 'Irrigate wheat field',
    titleArabic: 'ري حقل القمح',
    description: 'Water the wheat field thoroughly, focus on areas with lower moisture',
    descriptionArabic: 'ري حقل القمح بشكل جيد، التركيز على المناطق ذات الرطوبة المنخفضة',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'watering',
    cropId: '1',
    status: 'pending',
    estimatedDuration: 120,
    requiredMaterials: ['irrigation system', 'water']
  },
  {
    id: '2',
    title: 'Apply fungicide to tomatoes',
    titleArabic: 'تطبيق مبيد الفطريات على الطماطم',
    description: 'Spray tomato plants with fungicide to treat early blight',
    descriptionArabic: 'رش نباتات الطماطم بمبيد الفطريات لعلاج اللفحة المبكرة',
    priority: 'urgent',
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    type: 'pest_control',
    cropId: '3',
    status: 'pending',
    estimatedDuration: 90,
    requiredMaterials: ['fungicide', 'sprayer', 'protective gear']
  },
  {
    id: '3',
    title: 'Prune olive trees',
    titleArabic: 'تقليم أشجار الزيتون',
    description: 'Remove dead branches and shape trees for better fruit production',
    descriptionArabic: 'إزالة الأغصان الميتة وتشكيل الأشجار لإنتاج أفضل للثمار',
    priority: 'medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'pruning',
    cropId: '2',
    status: 'pending',
    estimatedDuration: 240,
    requiredMaterials: ['pruning shears', 'ladder']
  },
  {
    id: '4',
    title: 'Soil testing',
    titleArabic: 'فحص التربة',
    description: 'Collect soil samples for laboratory analysis',
    descriptionArabic: 'جمع عينات التربة للتحليل المختبري',
    priority: 'medium',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'fertilizer',
    status: 'pending',
    estimatedDuration: 60,
    requiredMaterials: ['soil sample containers', 'shovel']
  }
];

const generateMockAlerts = (): AlertData[] => [
  {
    id: '1',
    type: 'weather',
    title: 'Strong winds expected',
    titleArabic: 'رياح قوية متوقعة',
    message: 'Strong winds (45 km/h) expected tomorrow. Secure irrigation equipment.',
    messageArabic: 'رياح قوية (45 كم/س) متوقعة غداً. تأمين معدات الري.',
    priority: 'high',
    timestamp: new Date().toISOString(),
    actionable: true,
    actionText: 'Secure equipment',
    actionTextArabic: 'تأمين المعدات',
    resolved: false
  },
  {
    id: '2',
    type: 'disease',
    title: 'Early blight detected',
    titleArabic: 'تم اكتشاف اللفحة المبكرة',
    message: 'Early blight detected on tomato plants. Immediate treatment required.',
    messageArabic: 'تم اكتشاف اللفحة المبكرة على نباتات الطماطم. العلاج الفوري مطلوب.',
    priority: 'critical',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionable: true,
    actionText: 'Apply treatment',
    actionTextArabic: 'تطبيق العلاج',
    resolved: false
  },
  {
    id: '3',
    type: 'irrigation',
    title: 'Low soil moisture',
    titleArabic: 'رطوبة التربة منخفضة',
    message: 'Soil moisture below optimal level in wheat field zone 2.',
    messageArabic: 'رطوبة التربة تحت المستوى الأمثل في منطقة حقل القمح 2.',
    priority: 'medium',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    actionable: true,
    actionText: 'Start irrigation',
    actionTextArabic: 'بدء الري',
    resolved: false
  },
  {
    id: '4',
    type: 'market',
    title: 'Price increase alert',
    titleArabic: 'تنبيه زيادة الأسعار',
    message: 'Olive oil prices increased by 12% - good time to sell.',
    messageArabic: 'ارتفعت أسعار زيت الزيتون بنسبة 12% - وقت جيد للبيع.',
    priority: 'low',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actionable: true,
    actionText: 'View market',
    actionTextArabic: 'عرض السوق',
    resolved: false
  }
];

const generateMockMarketPrices = (): MarketPrice[] => [
  {
    crop: 'Wheat',
    cropArabic: 'قمح',
    currentPrice: 2.85,
    previousPrice: 2.78,
    change: 2.5,
    unit: 'TND/kg',
    lastUpdated: new Date().toISOString(),
    marketTrend: 'rising'
  },
  {
    crop: 'Olive Oil',
    cropArabic: 'زيت زيتون',
    currentPrice: 28.50,
    previousPrice: 25.40,
    change: 12.2,
    unit: 'TND/L',
    lastUpdated: new Date().toISOString(),
    marketTrend: 'rising'
  },
  {
    crop: 'Tomatoes',
    cropArabic: 'طماطم',
    currentPrice: 1.95,
    previousPrice: 2.10,
    change: -7.1,
    unit: 'TND/kg',
    lastUpdated: new Date().toISOString(),
    marketTrend: 'falling'
  },
  {
    crop: 'Barley',
    cropArabic: 'شعير',
    currentPrice: 2.20,
    previousPrice: 2.22,
    change: -0.9,
    unit: 'TND/kg',
    lastUpdated: new Date().toISOString(),
    marketTrend: 'stable'
  }
];

const generateMockIoTData = (): IoTSensorData[] => [
  {
    sensorId: 'SOIL_001',
    type: 'soil_moisture',
    value: 42.5,
    unit: '%',
    location: 'Wheat Field Zone 1',
    status: 'online',
    lastReading: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    sensorId: 'TEMP_001',
    type: 'temperature',
    value: 24.8,
    unit: '°C',
    location: 'Main Field',
    status: 'online',
    lastReading: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    sensorId: 'PH_001',
    type: 'ph',
    value: 6.9,
    unit: 'pH',
    location: 'Tomato Greenhouse',
    status: 'warning',
    lastReading: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    sensorId: 'LIGHT_001',
    type: 'light',
    value: 850,
    unit: 'lux',
    location: 'Greenhouse A',
    status: 'offline',
    lastReading: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

const generateMockExperts = (): ExpertCommunication[] => [
  {
    id: '1',
    expertName: 'Dr. Ahmed Ben Salem',
    expertType: 'agronomist',
    lastMessage: 'The soil analysis results look good. I recommend...',
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    unreadCount: 2,
    status: 'online'
  },
  {
    id: '2',
    expertName: 'Eng. Fatma Karoui',
    expertType: 'technician',
    lastMessage: 'Your irrigation system needs calibration.',
    lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    status: 'offline'
  },
  {
    id: '3',
    expertName: 'Prof. Mohamed Trabelsi',
    expertType: 'economist',
    lastMessage: 'Market trends suggest holding onto your olive harvest.',
    lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 1,
    status: 'busy'
  }
];

const generateMockFinancials = (): FinancialSummary => ({
  totalInvestment: 45800,
  currentExpenses: 23400,
  expectedRevenue: 68200,
  profitMargin: 34.2,
  seasonalROI: 48.9
});

// API Routes

// Get complete farmer dashboard data
router.get('/overview', (req, res) => {
  try {
    const dashboardData = {
      soil: generateMockSoilData(),
      crops: generateMockCrops(),
      tasks: generateMockTasks(),
      alerts: generateMockAlerts(),
      marketPrices: generateMockMarketPrices(),
      iotSensors: generateMockIoTData(),
      experts: generateMockExperts(),
      financialSummary: generateMockFinancials(),
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Farmer dashboard data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving farmer dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get soil status only
router.get('/soil-status', (req, res) => {
  try {
    const soilData = generateMockSoilData();
    res.json({
      success: true,
      data: soilData,
      message: 'Soil status retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving soil status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current crops with alerts
router.get('/crops', (req, res) => {
  try {
    const cropsData = generateMockCrops();
    res.json({
      success: true,
      data: cropsData,
      message: 'Crops data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving crops data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get today's tasks
router.get('/tasks/today', (req, res) => {
  try {
    const allTasks = generateMockTasks();
    const today = new Date();
    const todayTasks = allTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today.toDateString();
    });

    res.json({
      success: true,
      data: todayTasks,
      message: 'Today\'s tasks retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving today\'s tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all tasks
router.get('/tasks', (req, res) => {
  try {
    const tasksData = generateMockTasks();
    res.json({
      success: true,
      data: tasksData,
      message: 'Tasks data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving tasks data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update task status
router.put('/tasks/:taskId/status', (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    // In a real implementation, update the task in the database
    res.json({
      success: true,
      data: { taskId, status, notes, updatedAt: new Date().toISOString() },
      message: 'Task status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get active alerts
router.get('/alerts/active', (req, res) => {
  try {
    const allAlerts = generateMockAlerts();
    const activeAlerts = allAlerts.filter(alert => !alert.resolved);

    res.json({
      success: true,
      data: activeAlerts,
      message: 'Active alerts retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving active alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resolve alert
router.put('/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution_note } = req.body;

    // In a real implementation, update the alert in the database
    res.json({
      success: true,
      data: { alertId, resolved: true, resolvedAt: new Date().toISOString(), resolution_note },
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market prices
router.get('/market-prices', (req, res) => {
  try {
    const marketData = generateMockMarketPrices();
    res.json({
      success: true,
      data: marketData,
      message: 'Market prices retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving market prices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get IoT sensor data
router.get('/iot-sensors', (req, res) => {
  try {
    const iotData = generateMockIoTData();
    res.json({
      success: true,
      data: iotData,
      message: 'IoT sensor data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving IoT sensor data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get expert communications
router.get('/experts', (req, res) => {
  try {
    const expertsData = generateMockExperts();
    res.json({
      success: true,
      data: expertsData,
      message: 'Expert communications retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving expert communications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get financial summary
router.get('/financial-summary', (req, res) => {
  try {
    const financialData = generateMockFinancials();
    res.json({
      success: true,
      data: financialData,
      message: 'Financial summary retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving financial summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
