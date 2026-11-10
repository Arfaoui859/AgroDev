import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Droplets,
  Sprout,
  AlertTriangle,
  MessageCircle,
  Camera,
  Zap,
  Bug,
  CloudRain,
  Activity,
  Send,
  CheckCircle,
  Clock,
  Users,
  Phone
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  icon: React.ElementType;
  category: 'irrigation' | 'fertilizer' | 'emergency' | 'communication' | 'monitoring' | 'weather';
  priority: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  estimatedTime?: number;
}

interface QuickActionPanelProps {
  isArabic?: boolean;
  onActionExecute?: (actionId: string, data?: any) => void;
}

const quickActions: QuickAction[] = [
  {
    id: 'emergency_irrigation',
    title: 'Emergency Irrigation',
    titleArabic: 'ري طارئ',
    description: 'Open the irrigation workspace to review a plan. No irrigation starts automatically.',
    descriptionArabic: 'افتح مساحة الري لمراجعة الخطة؛ لا يبدأ الري تلقائياً.',
    icon: Droplets,
    category: 'irrigation',
    priority: 'critical',
    color: 'bg-blue-500 hover:bg-blue-600',
    estimatedTime: 30
  },
  {
    id: 'pest_alert',
    title: 'Report Pest Outbreak',
    titleArabic: 'بلاغ انتشار آفات',
    description: 'Open pest control to review and record an infestation.',
    descriptionArabic: 'افتح مكافحة الآفات لمراجعة الإصابة وتسجيلها.',
    icon: Bug,
    category: 'emergency',
    priority: 'critical',
    color: 'bg-red-500 hover:bg-red-600',
    estimatedTime: 15
  },
  {
    id: 'disease_photo',
    title: 'Disease Detection',
    titleArabic: 'كشف الأمراض',
    description: 'Open disease diagnosis to upload and review a plant image.',
    descriptionArabic: 'افتح تشخيص الأمراض لرفع صورة النبات ومراجعتها.',
    icon: Camera,
    category: 'monitoring',
    priority: 'high',
    color: 'bg-orange-500 hover:bg-orange-600',
    estimatedTime: 10
  },
  {
    id: 'weather_alert',
    title: 'Weather Emergency',
    titleArabic: 'طوارئ جوية',
    description: 'Open weather alerts to review conditions and create a report.',
    descriptionArabic: 'افتح تنبيهات الطقس لمراجعة الحالة وتسجيل البلاغ.',
    icon: CloudRain,
    category: 'weather',
    priority: 'critical',
    color: 'bg-purple-500 hover:bg-purple-600',
    estimatedTime: 5
  },
  {
    id: 'expert_call',
    title: 'Emergency Expert Call',
    titleArabic: 'مكالمة خبير طارئة',
    description: 'Open the collaboration workspace. No call is placed automatically.',
    descriptionArabic: 'افتح مساحة التواصل؛ لا يتم إجراء مكالمة تلقائياً.',
    icon: Phone,
    category: 'communication',
    priority: 'high',
    color: 'bg-green-500 hover:bg-green-600',
    estimatedTime: 20
  },
  {
    id: 'fertilizer_urgent',
    title: 'Urgent Fertilization',
    titleArabic: 'تسميد عاجل',
    description: 'Open fertilizer recommendations. No fertilizer is applied automatically.',
    descriptionArabic: 'افتح توصيات التسميد؛ لا يتم تطبيق أي سماد تلقائياً.',
    icon: Sprout,
    category: 'fertilizer',
    priority: 'high',
    color: 'bg-yellow-500 hover:bg-yellow-600',
    estimatedTime: 45
  },
  {
    id: 'soil_test',
    title: 'Urgent Soil Test',
    titleArabic: 'فحص تربة عاجل',
    description: 'Open soil analysis to submit measured data. No test runs automatically.',
    descriptionArabic: 'افتح تحليل التربة لإدخال القياسات؛ لا يبدأ التحليل تلقائياً.',
    icon: Activity,
    category: 'monitoring',
    priority: 'medium',
    color: 'bg-teal-500 hover:bg-teal-600',
    estimatedTime: 60
  },
  {
    id: 'chat_expert',
    title: 'Quick Expert Chat',
    titleArabic: 'دردشة سريعة مع خبير',
    description: 'Open the collaboration workspace. No message is sent automatically.',
    descriptionArabic: 'افتح مساحة التواصل؛ لا تُرسل رسالة تلقائياً.',
    icon: MessageCircle,
    category: 'communication',
    priority: 'medium',
    color: 'bg-indigo-500 hover:bg-indigo-600',
    estimatedTime: 10
  }
];

const QuickActionPanel: React.FC<QuickActionPanelProps> = ({ 
  isArabic = false, 
  onActionExecute 
}) => {
  const navigate = useNavigate();
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionData, setActionData] = useState<any>({});
  const [isExecuting, setIsExecuting] = useState(false);

  const handleActionClick = (action: QuickAction) => {
    setSelectedAction(action);
    setActionData({});
    setActionError(null);
  };

  const handleExecuteAction = async () => {
    if (!selectedAction) return;
    if (!onActionExecute) {
      setActionError(isArabic ? "هذه العملية غير مربوطة بخدمة تنفيذ حالياً." : "This action is not connected to an execution handler yet.");
      return;
    }

    setIsExecuting(true);
    setActionError(null);
    try {
      await onActionExecute(selectedAction.id, actionData);
      setSelectedAction(null);
      setActionData({});
    } catch (error) {
      setActionError(error instanceof Error ? error.message : (isArabic ? "تعذّر فتح الخدمة المطلوبة." : "Could not open the requested service."));
    } finally {
      setIsExecuting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const criticalActions = quickActions.filter(action => action.priority === 'critical');
  const regularActions = quickActions.filter(action => action.priority !== 'critical');

  return (
    <div className={`space-y-6 ${isArabic ? 'rtl' : 'ltr'}`}>
      {/* Emergency Actions */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span>{isArabic ? 'إجراءات طارئة' : 'Emergency Actions'}</span>
          </CardTitle>
          <CardDescription className="text-red-600">
            {isArabic ? 'إجراءات سريعة للمواقف الطارئة' : 'Quick actions for emergency situations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {criticalActions.map((action) => (
              <Dialog key={action.id}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-auto p-4 flex flex-col items-center space-y-2 ${action.color} text-white border-none hover:scale-105 transition-transform`}
                    onClick={() => handleActionClick(action)}
                  >
                    <action.icon className="h-6 w-6" />
                    <span className="text-xs text-center font-medium">
                      {isArabic ? action.titleArabic : action.title}
                    </span>
                    {action.estimatedTime && (
                      <div className="flex items-center space-x-1 text-xs opacity-90">
                        <Clock className="h-3 w-3" />
                        <span>{action.estimatedTime} {isArabic ? 'دقيقة' : 'min'}</span>
                      </div>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <action.icon className="h-5 w-5" />
                      <span>{isArabic ? action.titleArabic : action.title}</span>
                    </DialogTitle>
                    <DialogDescription>
                      {isArabic ? action.descriptionArabic : action.description}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert><AlertDescription>
                      {isArabic ? 'هذا الاختصار يفتح مساحة العمل المناسبة فقط؛ لا ينفّذ ريّاً أو علاجاً أو بلاغاً تلقائياً.' : 'This shortcut only opens the relevant workspace; it does not automatically irrigate, apply treatment, or submit a report.'}
                    </AlertDescription></Alert>
                    {action.id === 'emergency_irrigation' && (
                      <div className="space-y-3">
                        <Select onValueChange={(value) => setActionData({...actionData, zone: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? 'اختر المنطقة' : 'Select zone'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="zone1">{isArabic ? 'المنطقة 1 - القمح' : 'Zone 1 - Wheat'}</SelectItem>
                            <SelectItem value="zone2">{isArabic ? 'المنطقة 2 - الطماطم' : 'Zone 2 - Tomatoes'}</SelectItem>
                            <SelectItem value="zone3">{isArabic ? 'المنطقة 3 - الزيتون' : 'Zone 3 - Olives'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder={isArabic ? 'مدة الري (دقائق)' : 'Duration (minutes)'}
                          type="number"
                          value={actionData.duration || ''}
                          onChange={(e) => setActionData({...actionData, duration: e.target.value})}
                        />
                      </div>
                    )}
                    
                    {action.id === 'pest_alert' && (
                      <div className="space-y-3">
                        <Select onValueChange={(value) => setActionData({...actionData, pestType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? 'نوع الآفة' : 'Pest type'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aphids">{isArabic ? 'المن' : 'Aphids'}</SelectItem>
                            <SelectItem value="caterpillars">{isArabic ? 'الديدان' : 'Caterpillars'}</SelectItem>
                            <SelectItem value="beetles">{isArabic ? 'الخنافس' : 'Beetles'}</SelectItem>
                            <SelectItem value="other">{isArabic ? 'أخرى' : 'Other'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder={isArabic ? 'وصف الإصابة...' : 'Describe the infestation...'}
                          value={actionData.description || ''}
                          onChange={(e) => setActionData({...actionData, description: e.target.value})}
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? 'لرفع صورة، افتح صفحة تشخيص الأمراض؛ رفع الصور غير متاح من هذا الاختصار.' : 'To upload an image, open Disease Diagnosis; image upload is not available in this shortcut.'}
                        </p>
                      </div>
                    )}

                    {action.id === 'weather_alert' && (
                      <div className="space-y-3">
                        <Select onValueChange={(value) => setActionData({...actionData, weatherType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder={isArabic ? 'نوع الحالة الجوية' : 'Weather condition'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hail">{isArabic ? 'برَد' : 'Hail'}</SelectItem>
                            <SelectItem value="strong_wind">{isArabic ? 'رياح قوية' : 'Strong wind'}</SelectItem>
                            <SelectItem value="frost">{isArabic ? 'صقيع' : 'Frost'}</SelectItem>
                            <SelectItem value="flood">{isArabic ? 'فيضان' : 'Flood'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder={isArabic ? 'تفاصيل الحالة الجوية...' : 'Weather condition details...'}
                          value={actionData.details || ''}
                          onChange={(e) => setActionData({...actionData, details: e.target.value})}
                          rows={2}
                        />
                      </div>
                    )}

                    {actionError && <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert>}
                    <Button 
                      onClick={handleExecuteAction} 
                      disabled={isExecuting}
                      className="w-full"
                    >
                      {isExecuting ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          {isArabic ? 'جاري التنفيذ...' : 'Executing...'}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {isArabic ? 'فتح الخدمة المناسبة' : 'Open related workspace'}
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regular Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>{isArabic ? 'إجراءات سريعة' : 'Quick Actions'}</span>
          </CardTitle>
          <CardDescription>
            {isArabic ? 'أدوات سريعة للعمليات اليومية' : 'Quick tools for daily operations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {regularActions.map((action) => (
              <Dialog key={action.id}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                    onClick={() => handleActionClick(action)}
                  >
                    <action.icon className="h-6 w-6" />
                    <span className="text-xs text-center font-medium">
                      {isArabic ? action.titleArabic : action.title}
                    </span>
                    <Badge className={getPriorityColor(action.priority)} variant="outline">
                      {action.priority}
                    </Badge>
                    {action.estimatedTime && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{action.estimatedTime} {isArabic ? 'دقيقة' : 'min'}</span>
                      </div>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <action.icon className="h-5 w-5" />
                      <span>{isArabic ? action.titleArabic : action.title}</span>
                    </DialogTitle>
                    <DialogDescription>
                      {isArabic ? action.descriptionArabic : action.description}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Generic action form */}
                    <Textarea
                      placeholder={isArabic ? 'ملاحظات إضافية...' : 'Additional notes...'}
                      value={actionData.notes || ''}
                      onChange={(e) => setActionData({...actionData, notes: e.target.value})}
                      rows={3}
                    />
                    <Button 
                      onClick={handleExecuteAction} 
                      disabled={isExecuting}
                      className="w-full"
                    >
                      {isExecuting ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          {isArabic ? 'جاري التنفيذ...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isArabic ? 'فتح الخدمة المناسبة' : 'Open related workspace'}
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real platform contact routes; no fabricated expert profiles or phone numbers. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{isArabic ? 'التواصل والمساعدة' : 'Help and communication'}</span>
          </CardTitle>
          <CardDescription>
            {isArabic ? 'افتح مساحة التواصل داخل AgroGrowth أو اسأل المساعد الذكي.' : 'Open AgroGrowth collaboration or ask the AI assistant.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/farmer-collaboration')}>
            <MessageCircle className="h-4 w-4 mr-2" />{isArabic ? 'مساحة التواصل' : 'Collaboration'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/ai-assistant')}>
            <Zap className="h-4 w-4 mr-2" />{isArabic ? 'المساعد الذكي' : 'AI assistant'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActionPanel;
