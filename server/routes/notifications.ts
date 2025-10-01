import { RequestHandler } from 'express';

// ============ TYPES & INTERFACES ============

interface IoTSensor {
  id: string;
  name: string;
  nameArabic: string;
  type: 'soil_moisture' | 'soil_ph' | 'temperature' | 'humidity' | 'light' | 'pressure' | 'wind' | 'rainfall';
  typeArabic: string;
  fieldId: string;
  fieldName: string;
  location: {
    lat: number;
    lng: number;
    description: string;
    descriptionArabic: string;
  };
  status: 'online' | 'offline' | 'warning' | 'error';
  statusArabic: string;
  batteryLevel: number;
  signalStrength: number;
  lastReading: {
    value: number;
    unit: string;
    timestamp: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  thresholds: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
  calibrationDate: string;
  manufacturer: string;
  model: string;
  installationDate: string;
}

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  typeArabic: string;
  category: 'system' | 'weather' | 'crop' | 'market' | 'sensor' | 'security' | 'admin' | 'ai_prediction';
  categoryArabic: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  priorityArabic: string;
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  data?: any;
  actionRequired: boolean;
  actions?: Array<{
    label: string;
    labelArabic: string;
    action: string;
    type: 'primary' | 'secondary' | 'danger';
  }>;
  channels: Array<'in_app' | 'push' | 'email' | 'sms' | 'whatsapp'>;
  source: {
    type: 'iot_sensor' | 'ai_model' | 'api' | 'user' | 'system';
    id: string;
    name: string;
  };
  targetUsers: string[];
  targetRoles: string[];
  targetRegions?: string[];
  timestamp: string;
  readAt?: string;
  archivedAt?: string;
  respondedAt?: string;
  response?: string;
  isRead: boolean;
  isArchived: boolean;
  isStarred: boolean;
  confidence?: number;
  expiresAt?: string;
  metadata?: any;
}

interface NotificationRule {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  isActive: boolean;
  conditions: any;
  actions: any;
  createdBy: string;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface RealTimeData {
  timestamp: string;
  sensors: { [sensorId: string]: any };
  weather: any;
  systemHealth: any;
}

// ============ MOCK DATA ============

let mockSensors: IoTSensor[] = [
  {
    id: 'sensor-001',
    name: 'Soil Moisture Sensor #1',
    nameArabic: 'حساس رطوبة التربة #1',
    type: 'soil_moisture',
    typeArabic: 'رطوبة التربة',
    fieldId: 'field-001',
    fieldName: 'North Field',
    location: {
      lat: 32.1970,
      lng: 35.6185,
      description: 'North Field Center',
      descriptionArabic: 'وسط الحقل الشمالي'
    },
    status: 'online',
    statusArabic: 'متصل',
    batteryLevel: 87,
    signalStrength: 92,
    lastReading: {
      value: 35.2,
      unit: '%',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      quality: 'excellent'
    },
    thresholds: {
      min: 25,
      max: 80,
      optimal: { min: 40, max: 70 }
    },
    calibrationDate: '2024-01-01',
    manufacturer: 'AgroSense',
    model: 'SM-Pro-2024',
    installationDate: '2023-12-15'
  },
  {
    id: 'sensor-002',
    name: 'pH Sensor #1',
    nameArabic: 'حساس الحموضة #1',
    type: 'soil_ph',
    typeArabic: 'حموضة التربة',
    fieldId: 'field-001',
    fieldName: 'North Field',
    location: {
      lat: 32.1968,
      lng: 35.6183,
      description: 'North Field East Side',
      descriptionArabic: 'الجانب الشرقي للحقل الشمالي'
    },
    status: 'warning',
    statusArabic: 'تحذير',
    batteryLevel: 23,
    signalStrength: 78,
    lastReading: {
      value: 5.8,
      unit: 'pH',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      quality: 'good'
    },
    thresholds: {
      min: 5.5,
      max: 8.0,
      optimal: { min: 6.0, max: 7.5 }
    },
    calibrationDate: '2024-01-01',
    manufacturer: 'SoilTech',
    model: 'pH-Monitor-v3',
    installationDate: '2023-12-20'
  }
];

let mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'critical',
    typeArabic: 'حرج',
    category: 'sensor',
    categoryArabic: 'حساس',
    priority: 'critical',
    priorityArabic: 'حرج',
    title: 'Soil Moisture Critical Level',
    titleArabic: 'مستوى رطوبة التربة حرج',
    message: 'Soil moisture in North Field has dropped to 15%. Immediate irrigation required.',
    messageArabic: 'انخفضت رطوبة التربة في الحقل الشمالي إلى 15%. مطلوب ري فوري.',
    actionRequired: true,
    actions: [
      {
        label: 'Start Irrigation',
        labelArabic: 'بدء الري',
        action: 'start_irrigation',
        type: 'primary'
      },
      {
        label: 'View Field',
        labelArabic: 'عرض الحقل',
        action: 'view_field',
        type: 'secondary'
      }
    ],
    channels: ['in_app', 'push', 'sms'],
    source: {
      type: 'iot_sensor',
      id: 'sensor-001',
      name: 'Soil Moisture Sensor #1'
    },
    targetUsers: ['user-001'],
    targetRoles: ['farmer'],
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    isRead: false,
    isArchived: false,
    isStarred: true,
    metadata: {
      relatedFieldId: 'field-001',
      sensorData: {
        currentValue: 15,
        previousValue: 25,
        threshold: 25
      }
    }
  }
];

let mockRules: NotificationRule[] = [
  {
    id: 'rule-001',
    name: 'Soil Moisture Alert',
    nameArabic: 'تنبيه رطوبة التربة',
    description: 'Alert when soil moisture drops below 25%',
    descriptionArabic: 'تنبيه عند انخفاض رطوبة التربة أقل من 25%',
    isActive: true,
    conditions: {
      sensorType: 'soil_moisture',
      thresholdValue: 25,
      operator: 'less_than'
    },
    actions: {
      notificationLevel: 'critical',
      channels: ['in_app', 'push', 'sms'],
      targetRoles: ['farmer']
    },
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastTriggered: '2024-01-20T14:30:00Z',
    triggerCount: 12
  }
];

// ============ API HANDLERS ============

// Get all notifications
export const getNotifications: RequestHandler = async (req, res) => {
  try {
    const { 
      category, 
      priority, 
      status, 
      limit = 50, 
      offset = 0, 
      search,
      userId 
    } = req.query;

    let filteredNotifications = mockNotifications;

    // Apply filters
    if (category && category !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.category === category);
    }

    if (priority && priority !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
    }

    if (status) {
      switch (status) {
        case 'unread':
          filteredNotifications = filteredNotifications.filter(n => !n.isRead);
          break;
        case 'read':
          filteredNotifications = filteredNotifications.filter(n => n.isRead);
          break;
        case 'starred':
          filteredNotifications = filteredNotifications.filter(n => n.isStarred);
          break;
        case 'archived':
          filteredNotifications = filteredNotifications.filter(n => n.isArchived);
          break;
        case 'active':
          filteredNotifications = filteredNotifications.filter(n => !n.isArchived);
          break;
      }
    }

    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredNotifications = filteredNotifications.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.titleArabic.includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower) ||
        n.messageArabic.includes(searchLower)
      );
    }

    if (userId) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.targetUsers.includes(userId.toString())
      );
    }

    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        total: filteredNotifications.length,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: endIndex < filteredNotifications.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

// Get notification by ID
export const getNotificationById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = mockNotifications.find(n => n.id === id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification'
    });
  }
};

// Create new notification
export const createNotification: RequestHandler = async (req, res) => {
  try {
    const notificationData = req.body;

    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      ...notificationData,
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      isStarred: false
    };

    mockNotifications.unshift(newNotification);

    // Simulate real-time delivery
    // In a real app, this would trigger WebSocket/push notifications
    
    res.status(201).json({
      success: true,
      data: newNotification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
};

// Update notification
export const updateNotification: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const notificationIndex = mockNotifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    mockNotifications[notificationIndex] = {
      ...mockNotifications[notificationIndex],
      ...updates
    };

    res.json({
      success: true,
      data: mockNotifications[notificationIndex],
      message: 'Notification updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
};

// Mark notification as read
export const markAsRead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const notificationIndex = mockNotifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    mockNotifications[notificationIndex].isRead = true;
    mockNotifications[notificationIndex].readAt = new Date().toISOString();

    res.json({
      success: true,
      data: mockNotifications[notificationIndex],
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark notification as unread
export const markAsUnread: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const notificationIndex = mockNotifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    mockNotifications[notificationIndex].isRead = false;
    mockNotifications[notificationIndex].readAt = undefined;

    res.json({
      success: true,
      data: mockNotifications[notificationIndex],
      message: 'Notification marked as unread'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as unread'
    });
  }
};

// Toggle star status
export const toggleStar: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const notificationIndex = mockNotifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    mockNotifications[notificationIndex].isStarred = !mockNotifications[notificationIndex].isStarred;

    res.json({
      success: true,
      data: mockNotifications[notificationIndex],
      message: 'Notification star status updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update notification star status'
    });
  }
};

// Archive notification
export const archiveNotification: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const notificationIndex = mockNotifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    mockNotifications[notificationIndex].isArchived = true;
    mockNotifications[notificationIndex].archivedAt = new Date().toISOString();

    res.json({
      success: true,
      data: mockNotifications[notificationIndex],
      message: 'Notification archived successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to archive notification'
    });
  }
};

// Delete notification
export const deleteNotification: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const notificationIndex = mockNotifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    mockNotifications.splice(notificationIndex, 1);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

// Bulk operations
export const bulkUpdateNotifications: RequestHandler = async (req, res) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification IDs'
      });
    }

    let updatedCount = 0;

    for (const id of ids) {
      const notificationIndex = mockNotifications.findIndex(n => n.id === id);
      if (notificationIndex !== -1) {
        switch (action) {
          case 'mark_read':
            mockNotifications[notificationIndex].isRead = true;
            mockNotifications[notificationIndex].readAt = new Date().toISOString();
            break;
          case 'mark_unread':
            mockNotifications[notificationIndex].isRead = false;
            mockNotifications[notificationIndex].readAt = undefined;
            break;
          case 'archive':
            mockNotifications[notificationIndex].isArchived = true;
            mockNotifications[notificationIndex].archivedAt = new Date().toISOString();
            break;
          case 'delete':
            mockNotifications.splice(notificationIndex, 1);
            break;
          case 'star':
            mockNotifications[notificationIndex].isStarred = true;
            break;
          case 'unstar':
            mockNotifications[notificationIndex].isStarred = false;
            break;
        }
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `${updatedCount} notifications updated successfully`,
      updatedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation'
    });
  }
};

// Get IoT sensors
export const getSensors: RequestHandler = async (req, res) => {
  try {
    const { fieldId, status } = req.query;

    let filteredSensors = mockSensors;

    if (fieldId) {
      filteredSensors = filteredSensors.filter(s => s.fieldId === fieldId);
    }

    if (status) {
      filteredSensors = filteredSensors.filter(s => s.status === status);
    }

    res.json({
      success: true,
      data: filteredSensors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensors'
    });
  }
};

// Get real-time data
export const getRealTimeData: RequestHandler = async (req, res) => {
  try {
    const realTimeData: RealTimeData = {
      timestamp: new Date().toISOString(),
      sensors: mockSensors.reduce((acc, sensor) => {
        acc[sensor.id] = {
          value: sensor.lastReading.value + (Math.random() - 0.5) * 2,
          status: sensor.status,
          change: Math.random() > 0.5 ? 'increase' : 'decrease',
          changePercent: (Math.random() - 0.5) * 10
        };
        return acc;
      }, {} as any),
      weather: {
        temperature: 24.5 + (Math.random() - 0.5) * 2,
        humidity: 65 + (Math.random() - 0.5) * 10,
        windSpeed: 12 + (Math.random() - 0.5) * 5,
        pressure: 1013.2 + (Math.random() - 0.5) * 5,
        precipitation: Math.random() * 5,
        condition: 'partly_cloudy'
      },
      systemHealth: {
        connectedSensors: mockSensors.filter(s => s.status === 'online').length,
        totalSensors: mockSensors.length,
        dataLatency: 120 + Math.random() * 50,
        errorRate: Math.random() * 10
      }
    };

    res.json({
      success: true,
      data: realTimeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time data'
    });
  }
};

// Get notification rules
export const getNotificationRules: RequestHandler = async (req, res) => {
  try {
    const { isActive } = req.query;

    let filteredRules = mockRules;

    if (isActive !== undefined) {
      filteredRules = filteredRules.filter(r => r.isActive === (isActive === 'true'));
    }

    res.json({
      success: true,
      data: filteredRules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification rules'
    });
  }
};

// Create notification rule
export const createNotificationRule: RequestHandler = async (req, res) => {
  try {
    const ruleData = req.body;

    const newRule: NotificationRule = {
      id: `rule-${Date.now()}`,
      ...ruleData,
      createdAt: new Date().toISOString(),
      triggerCount: 0
    };

    mockRules.push(newRule);

    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Notification rule created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create notification rule'
    });
  }
};

// Update notification rule
export const updateNotificationRule: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ruleIndex = mockRules.findIndex(r => r.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification rule not found'
      });
    }

    mockRules[ruleIndex] = {
      ...mockRules[ruleIndex],
      ...updates
    };

    res.json({
      success: true,
      data: mockRules[ruleIndex],
      message: 'Notification rule updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update notification rule'
    });
  }
};

// Delete notification rule
export const deleteNotificationRule: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const ruleIndex = mockRules.findIndex(r => r.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification rule not found'
      });
    }

    mockRules.splice(ruleIndex, 1);

    res.json({
      success: true,
      message: 'Notification rule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification rule'
    });
  }
};

// Get notification statistics
export const getNotificationStats: RequestHandler = async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    const now = Date.now();
    let timeRangeMs = 24 * 60 * 60 * 1000; // 24 hours by default

    switch (timeRange) {
      case '1h':
        timeRangeMs = 60 * 60 * 1000;
        break;
      case '6h':
        timeRangeMs = 6 * 60 * 60 * 1000;
        break;
      case '24h':
        timeRangeMs = 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeRangeMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeRangeMs = 30 * 24 * 60 * 60 * 1000;
        break;
    }

    const recentNotifications = mockNotifications.filter(n => 
      now - new Date(n.timestamp).getTime() <= timeRangeMs
    );

    const stats = {
      total: recentNotifications.length,
      unread: recentNotifications.filter(n => !n.isRead).length,
      critical: recentNotifications.filter(n => n.type === 'critical').length,
      warning: recentNotifications.filter(n => n.type === 'warning').length,
      info: recentNotifications.filter(n => n.type === 'info').length,
      success: recentNotifications.filter(n => n.type === 'success').length,
      byCategory: {
        sensor: recentNotifications.filter(n => n.category === 'sensor').length,
        weather: recentNotifications.filter(n => n.category === 'weather').length,
        crop: recentNotifications.filter(n => n.category === 'crop').length,
        market: recentNotifications.filter(n => n.category === 'market').length,
        ai_prediction: recentNotifications.filter(n => n.category === 'ai_prediction').length,
        system: recentNotifications.filter(n => n.category === 'system').length
      },
      averageResponseTime: recentNotifications
        .filter(n => n.readAt)
        .reduce((sum, n) => {
          const responseTime = new Date(n.readAt!).getTime() - new Date(n.timestamp).getTime();
          return sum + responseTime;
        }, 0) / recentNotifications.filter(n => n.readAt).length || 0
    };

    res.json({
      success: true,
      data: stats,
      timeRange
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics'
    });
  }
};

// Send manual notification
export const sendManualNotification: RequestHandler = async (req, res) => {
  try {
    const { 
      title, 
      titleArabic, 
      message, 
      messageArabic, 
      type = 'info', 
      priority = 'medium',
      channels = ['in_app'],
      targetUsers = [],
      targetRoles = []
    } = req.body;

    const notification: Notification = {
      id: `manual-${Date.now()}`,
      type,
      typeArabic: type === 'critical' ? 'حرج' : type === 'warning' ? 'تحذير' : type === 'success' ? 'نجح' : 'معلومات',
      category: 'admin',
      categoryArabic: 'إداري',
      priority,
      priorityArabic: priority === 'critical' ? 'حرج' : priority === 'high' ? 'عالي' : priority === 'low' ? 'منخفض' : 'متوسط',
      title,
      titleArabic,
      message,
      messageArabic,
      actionRequired: false,
      channels,
      source: {
        type: 'user',
        id: 'admin',
        name: 'Administrator'
      },
      targetUsers,
      targetRoles,
      timestamp: new Date().toISOString(),
      isRead: false,
      isArchived: false,
      isStarred: false
    };

    mockNotifications.unshift(notification);

    // Simulate external delivery
    // In a real app, this would send push notifications, emails, SMS, etc.

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Manual notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send manual notification'
    });
  }
};
