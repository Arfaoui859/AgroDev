import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { readProvenance, type DataProvenance } from '@/lib/dataProvenance';
import { supabase } from '@/lib/supabase';

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

// Notifications are loaded from the authenticated, user-scoped Supabase feed.

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
  priority?: string;
  title?: string;
  titleArabic?: string;
  message?: string;
  messageArabic?: string;
  timestamp?: string;
  isRead?: boolean;
  actionRequired?: boolean;
  actions?: Array<{ label?: string; labelArabic?: string; action?: string }>;
  data?: Record<string, unknown>;
  read_at?: string | null;
  created_at?: string;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
}

function mapServerNotification(raw: ServerNotification): Notification {
  const firstAction = raw.actions?.[0];
  const rawCategory = raw.category ?? 'system';
  const category = rawCategory === 'agrogrowth_agent' ? 'alert' : rawCategory;
  const priority = (raw.priority === 'normal' ? 'medium' : raw.priority ?? 'medium') as Notification['priority'];
  return {
    id: String(raw.id),
    title: raw.title ?? '',
    titleArabic: raw.titleArabic ?? raw.title ?? '',
    message: raw.message ?? '',
    messageArabic: raw.messageArabic ?? raw.message ?? '',
    type: CLIENT_TYPE[raw.type ?? 'info'] ?? (priority === 'high' || priority === 'urgent' ? 'warning' : 'info'),
    category: (category as Notification['category']) ?? 'system',
    categoryArabic: raw.categoryArabic ?? CATEGORY_ARABIC[category] ?? 'نظام',
    priority,
    isRead: Boolean(raw.read_at || raw.isRead),
    timestamp: raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
    action: firstAction
      ? {
          label: firstAction.label ?? '',
          labelArabic: firstAction.labelArabic ?? firstAction.label ?? '',
          url: raw.action_url ?? firstAction.action ?? '#',
        }
      : raw.action_url ? { label: 'Open', labelArabic: 'فتح', url: raw.action_url } : undefined,
    metadata: raw.metadata ?? raw.data,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setNotifications([]);
        setProvenance({ simulated: false });
        return;
      }
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
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
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const priority = notification.priority === 'critical' ? 'urgent' :
          notification.priority === 'medium' ? 'normal' : notification.priority;
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: notification.type,
            title: notification.titleArabic || notification.title,
            message: notification.messageArabic || notification.message,
            priority,
            category: notification.category,
            action_url: notification.action?.url,
            metadata: notification.metadata || {},
          }),
        });
        if (!response.ok) throw new Error(`Notification create failed: HTTP ${response.status}`);
        await refreshNotifications();
      } catch (error) {
        console.error('Could not persist notification:', error);
      }
    })();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${session.access_token}` },
      });
    })();
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch('/api/notifications/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'read', ids: notifications.map((item) => item.id) }),
        });
      }
    })();
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` },
      });
    })();
  };

  const clearAllNotifications = () => {
    const ids = notifications.map((item) => item.id);
    setNotifications([]);
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && ids.length) await fetch('/api/notifications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'delete', ids }),
      });
    })();
  };

  const getNotificationsByCategory = (category: string) => {
    return notifications.filter(n => n.category === category);
  };

  const getNotificationsByPriority = (priority: string) => {
    return notifications.filter(n => n.priority === priority);
  };

  const subscribeToRealTimeNotifications = () => {
    // This is authenticated in-app polling, not browser push or a live sensor stream.
    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, 60000);
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
