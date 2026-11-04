import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { readProvenance, type DataProvenance } from '@/lib/dataProvenance';

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
  /** Provenance of the current list, so the UI can disclose demo content. */
  provenance: DataProvenance;
  isLoading: boolean;
  refreshNotifications: () => void;
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

// The backend exposes demo notifications until a per-user feed exists. They are
// mapped to this context's shape and disclosed via the server's provenance
// header; the client never invents farm-specific alerts of its own.

const CLIENT_TYPE: Record<string, Notification['type']> = {
  critical: 'urgent',
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'success',
};

const CATEGORY_ARABIC: Record<string, string> = {
  weather: 'طقس',
  crop: 'محاصيل',
  market: 'سوق',
  sensor: 'استشعار',
  security: 'أمان',
  admin: 'إداري',
  system: 'نظام',
  ai_prediction: 'توقع ذكي',
};

interface ServerNotification {
  id: string;
  type?: string;
  category?: string;
  categoryArabic?: string;
  priority?: Notification['priority'];
  title?: string;
  titleArabic?: string;
  message?: string;
  messageArabic?: string;
  timestamp?: string;
  isRead?: boolean;
  actionRequired?: boolean;
  actions?: Array<{ label?: string; labelArabic?: string; action?: string }>;
  data?: Record<string, unknown>;
}

function mapServerNotification(raw: ServerNotification): Notification {
  const firstAction = raw.actions?.[0];
  const category = raw.category ?? 'system';
  return {
    id: String(raw.id),
    title: raw.title ?? '',
    titleArabic: raw.titleArabic ?? raw.title ?? '',
    message: raw.message ?? '',
    messageArabic: raw.messageArabic ?? raw.message ?? '',
    type: CLIENT_TYPE[raw.type ?? 'info'] ?? 'info',
    category: (category as Notification['category']) ?? 'system',
    categoryArabic: raw.categoryArabic ?? CATEGORY_ARABIC[category] ?? 'نظام',
    priority: raw.priority ?? 'medium',
    isRead: Boolean(raw.isRead),
    timestamp: raw.timestamp ?? new Date().toISOString(),
    action: firstAction
      ? {
          label: firstAction.label ?? '',
          labelArabic: firstAction.labelArabic ?? firstAction.label ?? '',
          url: firstAction.action ?? '#',
        }
      : undefined,
    metadata: raw.data,
  };
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [provenance, setProvenance] = useState<DataProvenance>({ simulated: false });
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeSubscription, setRealtimeSubscription] = useState<NodeJS.Timeout | null>(null);

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      const list: ServerNotification[] = Array.isArray(body?.data) ? body.data : [];
      setNotifications(list.map(mapServerNotification));
      setProvenance(readProvenance(response.headers, body));
    } catch (error) {
      // Never fabricate a feed on failure: surface an empty, honest state.
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setProvenance({ simulated: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

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
    void fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    void fetch(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
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

    // Poll the real endpoint. The previous implementation fabricated farm
    // alerts with Math.random(), presenting invented data as real.
    const interval = setInterval(() => {
      void refreshNotifications();
    }, 60000); // Refresh every minute

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
    provenance,
    isLoading,
    refreshNotifications,
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
