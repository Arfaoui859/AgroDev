import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Calendar,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Target,
  Droplets,
  Sprout,
  Bug,
  TrendingUp,
  AlertCircle,
  CalendarDays,
  Timer,
  Sun,
  CloudRain
} from 'lucide-react';

interface TaskData {
  taskId: string;
  userId: string;
  cropId?: string;
  title: string;
  description: string;
  type: 'Daily' | 'Weekly' | 'Monthly' | 'Seasonal' | 'OneTime';
  category: 'Irrigation' | 'Fertilizer' | 'Pesticide' | 'Pruning' | 'Harvest' | 'Planting' | 'Soil' | 'General';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'InProgress' | 'Completed' | 'Overdue' | 'Cancelled';
  scheduledDate: Date;
  estimatedDuration: number;
  createdAt: Date;
  completedAt?: Date;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'Daily' | 'Weekly' | 'Monthly';
    interval: number;
    endDate?: Date;
  };
  cropStage?: string;
  weatherDependency?: boolean;
}

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    cropId: 'all'
  });
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    scheduledDate: new Date().toISOString().slice(0, 16),
    estimatedDuration: 30,
    isRecurring: false,
    frequency: 'Daily',
    interval: 1
  });
  const [groupBy, setGroupBy] = useState<'date' | 'crop' | 'category'>('date');

  const categoryIcons = {
    Irrigation: Droplets,
    Fertilizer: Sprout,
    Pesticide: Bug,
    Pruning: Edit,
    Harvest: CheckCircle2,
    Planting: Sprout,
    Soil: Target,
    General: Calendar
  };

  const priorityColors = {
    High: 'destructive',
    Medium: 'default',
    Low: 'secondary'
  };

  const statusColors = {
    Pending: 'outline',
    InProgress: 'default',
    Completed: 'secondary',
    Overdue: 'destructive',
    Cancelled: 'outline'
  };

  const fetchTasks = async (timeframe: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...(filter.status !== 'all' && { status: filter.status }),
        ...(filter.priority !== 'all' && { priority: filter.priority }),
        ...(filter.category !== 'all' && { category: filter.category }),
        ...(filter.cropId !== 'all' && { cropId: filter.cropId })
      });

      const response = await fetch(`/api/tasks/user/user-123/${timeframe}?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data.map((task: any) => ({
          ...task,
          scheduledDate: new Date(task.scheduledDate),
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        })));
      }
    } catch (error) {
      console.error('فشل في جلب المهام:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.taskId === taskId 
            ? { 
                ...task, 
                status: status as any,
                completedAt: status === 'Completed' ? new Date() : undefined
              }
            : task
        ));
      }
    } catch (error) {
      console.error('فشل في تحديث حالة المهمة:', error);
    }
  };

  const createTask = async () => {
    try {
      const taskData = {
        ...newTask,
        userId: 'user-123',
        scheduledDate: new Date(newTask.scheduledDate),
        type: newTask.isRecurring ? newTask.frequency : 'OneTime',
        ...(newTask.isRecurring && {
          recurrencePattern: {
            frequency: newTask.frequency,
            interval: newTask.interval
          }
        })
      };

      const response = await fetch('/api/tasks/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        setShowNewTaskDialog(false);
        setNewTask({
          title: '',
          description: '',
          category: 'General',
          priority: 'Medium',
          scheduledDate: new Date().toISOString().slice(0, 16),
          estimatedDuration: 30,
          isRecurring: false,
          frequency: 'Daily',
          interval: 1
        });
        fetchTasks(activeTab);
      }
    } catch (error) {
      console.error('فشل في إنشاء المهمة:', error);
    }
  };

  const getTasksStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'InProgress').length;
    const overdue = tasks.filter(t => t.status === 'Overdue').length;
    
    return { total, completed, pending, inProgress, overdue };
  };

  const groupTasks = (tasks: TaskData[]) => {
    if (groupBy === 'date') {
      const grouped = tasks.reduce((acc, task) => {
        const dateKey = task.scheduledDate.toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
        return acc;
      }, {} as Record<string, TaskData[]>);
      
      return Object.entries(grouped).sort(([a], [b]) => 
        new Date(a).getTime() - new Date(b).getTime()
      );
    } else if (groupBy === 'category') {
      const grouped = tasks.reduce((acc, task) => {
        if (!acc[task.category]) acc[task.category] = [];
        acc[task.category].push(task);
        return acc;
      }, {} as Record<string, TaskData[]>);
      
      return Object.entries(grouped);
    } else {
      const grouped = tasks.reduce((acc, task) => {
        const cropKey = task.cropId || 'عام';
        if (!acc[cropKey]) acc[cropKey] = [];
        acc[cropKey].push(task);
        return acc;
      }, {} as Record<string, TaskData[]>);
      
      return Object.entries(grouped);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'غداً';
    } else {
      return date.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getTaskDurationText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours} ساعة و ${remainingMinutes} دقيقة`
        : `${hours} ساعة`;
    }
  };

  useEffect(() => {
    fetchTasks(activeTab);
  }, [activeTab, filter]);

  const stats = getTasksStats();
  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTasks(activeTab)}
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 ml-2" />
                تجميع حسب
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setGroupBy('date')}>
                التاريخ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('category')}>
                الفئة
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('crop')}>
                المحصول
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                مهمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">إضافة مهمة جديدة</DialogTitle>
                <DialogDescription className="text-right">
                  أدخل تفاصيل المهمة الجديدة وحدد موعد تنفيذها
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-right block">عنوان المهمة</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: ري الطماطم"
                    className="text-right"
                  />
                </div>
                
                <div>
                  <Label className="text-right block">الوصف</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف تفصيلي للمهمة..."
                    className="text-right"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-right block">الفئة</Label>
                    <select
                      value={newTask.category}
                      onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm text-right"
                    >
                      <option value="General">عام</option>
                      <option value="Irrigation">ري</option>
                      <option value="Fertilizer">تسميد</option>
                      <option value="Pesticide">مبيدات</option>
                      <option value="Pruning">تقليم</option>
                      <option value="Harvest">حصاد</option>
                      <option value="Planting">زراعة</option>
                      <option value="Soil">تربة</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-right block">الأولوية</Label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm text-right"
                    >
                      <option value="Low">منخفضة</option>
                      <option value="Medium">متوسطة</option>
                      <option value="High">عالية</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-right block">التاريخ والوقت</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.scheduledDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-right block">المدة المتوقعة (دقيقة)</Label>
                    <Input
                      type="number"
                      value={newTask.estimatedDuration}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                      min="5"
                      max="480"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newTask.isRecurring}
                      onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, isRecurring: checked }))}
                    />
                    <Label>مهمة متكررة</Label>
                  </div>
                  
                  {newTask.isRecurring && (
                    <div className="flex gap-2">
                      <select
                        value={newTask.frequency}
                        onChange={(e) => setNewTask(prev => ({ ...prev, frequency: e.target.value }))}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="Daily">يومياً</option>
                        <option value="Weekly">أسبوعياً</option>
                        <option value="Monthly">شهرياً</option>
                      </select>
                      <Input
                        type="number"
                        value={newTask.interval}
                        onChange={(e) => setNewTask(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                        min="1"
                        max="30"
                        className="w-16 text-center"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={createTask} disabled={!newTask.title.trim()}>
                  إضافة المهمة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <h1 className="text-3xl font-bold">المهام اليومية</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">إجمالي المهام</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">مكتملة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">في الانتظار</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">متأخرة</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{completionRate.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground">نسبة الإكمال</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">اليوم</TabsTrigger>
          <TabsTrigger value="week">هذا الأسبوع</TabsTrigger>
          <TabsTrigger value="month">هذا الشهر</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مهام</h3>
                <p className="text-muted-foreground mb-4">
                  لا توجد مهام مجدولة لهذه الفترة
                </p>
                <Button onClick={() => setShowNewTaskDialog(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  أضف مهمة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupTasks(tasks).map(([groupKey, groupTasks]) => (
                <Card key={groupKey}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-right">
                      {groupBy === 'date' ? formatDate(new Date(groupKey)) : groupKey}
                      <Badge variant="outline" className="mr-2">
                        {groupTasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {groupTasks.map((task) => {
                        const IconComponent = categoryIcons[task.category];
                        const isOverdue = task.status === 'Pending' && new Date(task.scheduledDate) < new Date();
                        
                        return (
                          <div
                            key={task.taskId}
                            className={`p-4 border rounded-lg transition-all ${
                              task.status === 'Completed' 
                                ? 'bg-green-50 border-green-200' 
                                : isOverdue
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {task.status === 'Pending' && (
                                      <DropdownMenuItem 
                                        onClick={() => updateTaskStatus(task.taskId, 'InProgress')}
                                      >
                                        <Play className="h-4 w-4 ml-2" />
                                        بدء التنفيذ
                                      </DropdownMenuItem>
                                    )}
                                    {task.status === 'InProgress' && (
                                      <>
                                        <DropdownMenuItem 
                                          onClick={() => updateTaskStatus(task.taskId, 'Completed')}
                                        >
                                          <CheckCircle2 className="h-4 w-4 ml-2" />
                                          إكمال المهمة
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => updateTaskStatus(task.taskId, 'Pending')}
                                        >
                                          <Pause className="h-4 w-4 ml-2" />
                                          إيقاف مؤقت
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {task.status === 'Completed' && (
                                      <DropdownMenuItem 
                                        onClick={() => updateTaskStatus(task.taskId, 'Pending')}
                                      >
                                        <RotateCcw className="h-4 w-4 ml-2" />
                                        إعادة فتح
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                
                                {task.status !== 'Completed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateTaskStatus(task.taskId, 'Completed')}
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="flex-1 text-right">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={statusColors[task.status] as any}
                                      className="text-xs"
                                    >
                                      {task.status === 'Pending' && 'في الانتظار'}
                                      {task.status === 'InProgress' && 'قيد التنفيذ'}
                                      {task.status === 'Completed' && 'مكتملة'}
                                      {task.status === 'Overdue' && 'متأخرة'}
                                      {task.status === 'Cancelled' && 'ملغاة'}
                                    </Badge>
                                    <Badge 
                                      variant={priorityColors[task.priority] as any}
                                      className="text-xs"
                                    >
                                      {task.priority === 'High' && 'عالية'}
                                      {task.priority === 'Medium' && 'متوسطة'}
                                      {task.priority === 'Low' && 'منخفضة'}
                                    </Badge>
                                    {task.weatherDependency && (
                                      <Badge variant="outline" className="text-xs">
                                        <CloudRain className="h-3 w-3 ml-1" />
                                        طقس
                                      </Badge>
                                    )}
                                  </div>
                                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                                </div>
                                
                                <h4 className="font-semibold text-right mb-1">{task.title}</h4>
                                <p className="text-sm text-muted-foreground text-right mb-2">
                                  {task.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-3 w-3" />
                                      {getTaskDurationText(task.estimatedDuration)}
                                    </span>
                                    {task.isRecurring && (
                                      <span className="flex items-center gap-1">
                                        <RotateCcw className="h-3 w-3" />
                                        {task.recurrencePattern?.frequency === 'Daily' && 'يومياً'}
                                        {task.recurrencePattern?.frequency === 'Weekly' && 'أسبوعياً'}
                                        {task.recurrencePattern?.frequency === 'Monthly' && 'شهرياً'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.scheduledDate.toLocaleTimeString('ar-EG', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                
                                {isOverdue && (
                                  <div className="flex items-center gap-1 mt-2 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">مهمة متأخرة</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTasks;
