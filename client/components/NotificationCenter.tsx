import React, { useState } from 'react';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Bell, BellRing, X, Check, CheckCheck, Trash2, Filter, AlertTriangle, 
         Info, CheckCircle, AlertCircle, Zap, Calendar, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { isArabic } = useLanguage();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotificationsByCategory,
    getNotificationsByPriority
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const getTypeIcon = (type: Notification['type']) => {
    const iconMap = {
      info: <Info className="h-4 w-4 text-blue-500" />,
      success: <CheckCircle className="h-4 w-4 text-green-500" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      error: <AlertCircle className="h-4 w-4 text-red-500" />,
      urgent: <Zap className="h-4 w-4 text-purple-500" />
    };
    return iconMap[type];
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    const colorMap = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colorMap[priority];
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
  };

  const filteredNotifications = () => {
    let filtered = notifications;

    // Apply basic filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'priority':
        filtered = filtered.filter(n => n.priority === 'high' || n.priority === 'critical');
        break;
      default:
        break;
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }

    return filtered.sort((a, b) => {
      // Sort by read status first (unread first), then by priority, then by timestamp
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  const categories = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'weather', label: isArabic ? 'طقس' : 'Weather' },
    { value: 'disease', label: isArabic ? 'أمراض' : 'Disease' },
    { value: 'market', label: isArabic ? 'سوق' : 'Market' },
    { value: 'irrigation', label: isArabic ? 'ري' : 'Irrigation' },
    { value: 'system', label: isArabic ? 'نظام' : 'System' },
    { value: 'reminder', label: isArabic ? 'تذكير' : 'Reminder' },
    { value: 'alert', label: isArabic ? 'تنبيه' : 'Alert' }
  ];

  return (
    <div className={cn("relative", className)} style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-orange-500" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute top-full right-0 rtl:left-0 rtl:right-auto mt-2 w-96 max-w-sm bg-white rounded-lg shadow-xl border z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold">
                  {isArabic ? 'الإشعارات' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} {isArabic ? 'جديد' : 'new'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    title={isArabic ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {isArabic ? 'تصفية' : 'Filter'}
                </span>
              </div>
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isArabic ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="unread">{isArabic ? 'غير مقروء' : 'Unread'}</SelectItem>
                    <SelectItem value="priority">{isArabic ? 'أولوي�� عالية' : 'High Priority'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1 max-h-96">
              <div className="p-2">
                {filteredNotifications().length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications().map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 rounded-lg border transition-colors group relative",
                          notification.isRead 
                            ? "bg-gray-50 border-gray-200" 
                            : "bg-blue-50 border-blue-200 shadow-sm"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm font-medium",
                                !notification.isRead && "font-semibold"
                              )}>
                                {isArabic ? notification.titleArabic : notification.title}
                              </h4>
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getPriorityColor(notification.priority))}
                                >
                                  {isArabic ? 
                                    (notification.priority === 'low' ? 'منخفض' :
                                     notification.priority === 'medium' ? 'متوسط' :
                                     notification.priority === 'high' ? 'عالي' : 'حرج') :
                                    notification.priority
                                  }
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {isArabic ? notification.messageArabic : notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {formatTime(notification.timestamp)}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="h-6 w-6 p-0"
                                    title={isArabic ? 'تحديد كمقروء' : 'Mark as read'}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0"
                                  title={isArabic ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 h-7 text-xs"
                                onClick={() => {
                                  if (notification.action?.url) {
                                    window.location.href = notification.action.url;
                                  }
                                  if (!notification.isRead) {
                                    markAsRead(notification.id);
                                  }
                                }}
                              >
                                {isArabic ? notification.action.labelArabic : notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                    {isArabic ? 'مسح الكل' : 'Clear All'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                    {isArabic ? 'الإعدادات' : 'Settings'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
