import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Cloud, 
  Bug, 
  Droplets, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Eye,
  X,
  ChevronLeft,
  Filter,
  RotateCcw
} from 'lucide-react';

interface AlertData {
  alertId: string;
  userId: string;
  cropId?: string;
  type: 'Irrigation' | 'Disease' | 'Weather' | 'Market' | 'Fertilizer' | 'Pest' | 'Harvest' | 'Planting';
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Unread' | 'Seen' | 'Resolved' | 'Dismissed';
  createdAt: Date;
  scheduledFor?: Date;
  relatedData?: any;
  actionSuggestions: string[];
  urgencyScore: number;
}

interface AlertFeedProps {
  userId?: string;
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
  onAlertClick?: (alert: AlertData) => void;
}

const AlertFeed: React.FC<AlertFeedProps> = ({ 
  userId = 'user-123', 
  maxItems = 10,
  showFilters = true,
  compact = false,
  onAlertClick 
}) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    type: 'all'
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const alertIcons = {
    Weather: Cloud,
    Disease: Bug,
    Irrigation: Droplets,
    Market: TrendingUp,
    Fertilizer: Droplets,
    Pest: Bug,
    Harvest: CheckCircle,
    Planting: Clock
  };

  const priorityColors = {
    High: 'destructive',
    Medium: 'default',
    Low: 'secondary'
  };

  const statusColors = {
    Unread: 'destructive',
    Seen: 'default',
    Resolved: 'secondary',
    Dismissed: 'outline'
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: maxItems.toString(),
        ...(filter.status !== 'all' && { status: filter.status }),
        ...(filter.priority !== 'all' && { priority: filter.priority }),
        ...(filter.type !== 'all' && { type: filter.type })
      });

      const response = await fetch(`/api/alerts/user/${userId}?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setAlerts(data.data.map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt),
          scheduledFor: alert.scheduledFor ? new Date(alert.scheduledFor) : undefined
        })));
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('فشل في جلب التنبيهات:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Seen' })
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.alertId === alertId 
            ? { ...alert, status: 'Seen' as const }
            : alert
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('فشل في تحديث حالة التنبيه:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/resolve/${alertId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.alertId === alertId 
            ? { ...alert, status: 'Resolved' as const }
            : alert
        ));
      }
    } catch (error) {
      console.error('فشل في حل التنبيه:', error);
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  const handleAlertClick = (alert: AlertData) => {
    if (alert.status === 'Unread') {
      markAsRead(alert.alertId);
    }
    if (onAlertClick) {
      onAlertClick(alert);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter, userId]);

  useEffect(() => {
    // Auto-refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-right">
            <Bell className="h-5 w-5" />
            تنبيهات المحاصيل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            {showFilters && (
              <div className="flex gap-2">
                <select
                  value={filter.priority}
                  onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">كل الأولويات</option>
                  <option value="High">عالية</option>
                  <option value="Medium">متوسطة</option>
                  <option value="Low">منخفضة</option>
                </select>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">كل الحالات</option>
                  <option value="Unread">غير مقروءة</option>
                  <option value="Seen">مقروءة</option>
                  <option value="Resolved">محلولة</option>
                </select>
              </div>
            )}
          </div>
          <CardTitle className="flex items-center gap-2 text-right">
            <Bell className="h-5 w-5" />
            تنبيهات المحاصيل
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد تنبيهات حالياً</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert, index) => {
              const IconComponent = alertIcons[alert.type];
              
              return (
                <div key={alert.alertId}>
                  <div
                    className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                      alert.status === 'Unread' 
                        ? 'bg-red-50 border-red-200' 
                        : alert.status === 'Resolved'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAlert(alert.alertId);
                          }}
                          className="h-6 w-6 p-0"
                          disabled={alert.status === 'Resolved'}
                        >
                          <CheckCircle className={`h-4 w-4 ${
                            alert.status === 'Resolved' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </Button>
                        {alert.status === 'Unread' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(alert.alertId);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={statusColors[alert.status] as any}
                              className="text-xs"
                            >
                              {alert.status === 'Unread' && 'غير مقروء'}
                              {alert.status === 'Seen' && 'مقروء'}
                              {alert.status === 'Resolved' && 'محلول'}
                              {alert.status === 'Dismissed' && 'مرفوض'}
                            </Badge>
                            <Badge 
                              variant={priorityColors[alert.priority] as any}
                              className="text-xs"
                            >
                              {alert.priority === 'High' && 'عالية'}
                              {alert.priority === 'Medium' && 'متوسطة'}
                              {alert.priority === 'Low' && 'منخفضة'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(alert.createdAt)}
                            </span>
                          </div>
                          <IconComponent className={`h-5 w-5 ${
                            alert.priority === 'High' 
                              ? 'text-red-600' 
                              : alert.priority === 'Medium'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`} />
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-1 text-right leading-tight">
                          {alert.title}
                        </h4>
                        
                        {!compact && (
                          <p className="text-xs text-muted-foreground text-right leading-relaxed line-clamp-2">
                            {alert.description}
                          </p>
                        )}
                        
                        {alert.urgencyScore > 0.8 && (
                          <div className="flex items-center gap-1 mt-2 justify-end">
                            <span className="text-xs text-red-600 font-medium">
                              عاجل جداً
                            </span>
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!compact && alert.actionSuggestions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-muted-foreground text-right">
                          💡 {alert.actionSuggestions[0]}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {index < alerts.length - 1 && <Separator className="my-2" />}
                </div>
              );
            })}
          </div>
        )}
        
        {alerts.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Navigate to full alerts page
                window.location.href = '/alert-history';
              }}
            >
              عرض جميع التنبيهات
              <ChevronLeft className="h-4 w-4 mr-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertFeed;
