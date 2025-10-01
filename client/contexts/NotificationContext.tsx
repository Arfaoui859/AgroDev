import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  category: 'weather' | 'disease' | 'market' | 'irrigation' | 'system' | 'reminder' | 'alert';
  categoryArabic: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  timestamp: string;
  action?: {
    label: string;
    labelArabic: string;
    url: string;
  };
  metadata?: {
    farmId?: string;
    cropType?: string;
    location?: string;
    severity?: string;
    [key: string]: any;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsByPriority: (priority: string) => Notification[];
  subscribeToRealTimeNotifications: () => void;
  unsubscribeFromRealTimeNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Mock real-time notifications generator
const generateMockNotification = (): Omit<Notification, 'id' | 'timestamp' | 'isRead'> => {
  const mockNotifications = [
    {
      title: 'Weather Alert',
      titleArabic: 'تنبيه طقس',
      message: 'Heavy rain expected in your area. Ensure proper drainage for your crops.',
      messageArabic: 'متوقع هطول أمطار غزيرة في منطقتك. تأكد من الصرف المناسب لمحاصيلك.',
      type: 'warning' as const,
      category: 'weather' as const,
      categoryArabic: 'طقس',
      priority: 'high' as const,
      action: { label: 'View Weather', labelArabic: 'عرض الطقس', url: '/weather-alerts' }
    },
    {
      title: 'Disease Detection',
      titleArabic: 'كشف مرض',
      message: 'Possible fungal infection detected in tomato crops. Immediate action recommended.',
      messageArabic: 'تم كشف عدوى فطرية محتملة في محاصيل الطماطم. يُنصح باتخاذ إجراء فوري.',
      type: 'error' as const,
      category: 'disease' as const,
      categoryArabic: 'مرض',
      priority: 'critical' as const,
      action: { label: 'View Details', labelArabic: 'عرض التفاصيل', url: '/disease-diagnosis/123' }
    },
    {
      title: 'Market Price Update',
      titleArabic: 'تحديث أسعار السوق',
      message: 'Wheat prices increased by 8% this week. Good time to sell your harvest.',
      messageArabic: 'ارتفعت أسعار القمح بنسبة 8% هذا الأسبوع. وقت جيد لبيع محصولك.',
      type: 'success' as const,
      category: 'market' as const,
      categoryArabic: 'سوق',
      priority: 'medium' as const,
      action: { label: 'Check Prices', labelArabic: 'تحقق من الأسعار', url: '/market-dashboard' }
    },
    {
      title: 'Irrigation Reminder',
      titleArabic: 'تذكير الري',
      message: 'Your scheduled irrigation for Field A is due in 30 minutes.',
      messageArabic: 'موعد الري المجدول للحقل A خلال 30 دقيقة.',
      type: 'info' as const,
      category: 'irrigation' as const,
      categoryArabic: 'ري',
      priority: 'medium' as const,
      action: { label: 'Manage Irrigation', labelArabic: 'إدارة الري', url: '/smart-irrigation' }
    },
    {
      title: 'Soil Analysis Complete',
      titleArabic: 'اكتمل تحليل التربة',
      message: 'Your soil analysis results are ready. Review recommendations for optimal growth.',
      messageArabic: 'نتائج تحليل التربة جاهزة. راجع التوصيات للنمو الأمثل.',
      type: 'success' as const,
      category: 'system' as const,
      categoryArabic: 'نظام',
      priority: 'low' as const,
      action: { label: 'View Results', labelArabic: 'عرض النتائج', url: '/analysis' }
    },
    {
      title: 'Fertilizer Application Due',
      titleArabic: 'موعد تطبيق السماد',
      message: 'Time to apply nitrogen fertilizer to your corn crops for optimal yield.',
      messageArabic: 'حان وقت تطبيق السماد النيتروجيني على محاصيل الذرة للحصول على أفضل إنتاجية.',
      type: 'info' as const,
      category: 'reminder' as const,
      categoryArabic: 'تذكير',
      priority: 'medium' as const,
      action: { label: 'View Schedule', labelArabic: 'عرض الجدول', url: '/treatment-schedule' }
    }
  ];

  return mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [realtimeSubscription, setRealtimeSubscription] = useState<NodeJS.Timeout | null>(null);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agroGrowthNotifications');
    if (saved) {
      try {
        const parsedNotifications = JSON.parse(saved);
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    } else {
      // Initialize with some sample notifications
      const initialNotifications: Notification[] = [
        {
          id: '1',
          title: 'Welcome to AgroGrowth',
          titleArabic: 'مرحباً بك في أجرو جروث',
          message: 'Your smart farming journey begins here. Explore all the features and boost your productivity.',
          messageArabic: 'رحلتك الزراعية الذكية تبدأ هنا. استكشف جميع الميزات وعزز إنتاجيتك.',
          type: 'info',
          category: 'system',
          categoryArabic: 'نظام',
          priority: 'low',
          isRead: false,
          timestamp: new Date().toISOString(),
          action: { label: 'Get Started', labelArabic: 'ابدأ الآن', url: '/farmer-dashboard' }
        }
      ];
      setNotifications(initialNotifications);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('agroGrowthNotifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/placeholder.svg',
        badge: '/placeholder.svg'
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationsByCategory = (category: string) => {
    return notifications.filter(n => n.category === category);
  };

  const getNotificationsByPriority = (priority: string) => {
    return notifications.filter(n => n.priority === priority);
  };

  const subscribeToRealTimeNotifications = () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Simulate real-time notifications
    const interval = setInterval(() => {
      // Randomly generate notifications (in a real app, this would be WebSocket/SSE)
      if (Math.random() < 0.3) { // 30% chance every interval
        const mockNotification = generateMockNotification();
        addNotification(mockNotification);
      }
    }, 30000); // Every 30 seconds

    setRealtimeSubscription(interval);
  };

  const unsubscribeFromRealTimeNotifications = () => {
    if (realtimeSubscription) {
      clearInterval(realtimeSubscription);
      setRealtimeSubscription(null);
    }
  };

  // Auto-subscribe to real-time notifications on mount
  useEffect(() => {
    subscribeToRealTimeNotifications();
    return () => unsubscribeFromRealTimeNotifications();
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotificationsByCategory,
    getNotificationsByPriority,
    subscribeToRealTimeNotifications,
    unsubscribeFromRealTimeNotifications
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
