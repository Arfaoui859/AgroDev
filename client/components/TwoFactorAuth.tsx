import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone, Mail, Key, QrCode, Shield, CheckCircle, AlertTriangle, 
  Copy, Download, Eye, EyeOff, Loader2, RefreshCw, Clock, MessageSquare,
  Phone, Globe, Lock, Unlock, Settings, HelpCircle, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  method?: 'sms' | 'email' | 'authenticator';
}

interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: string;
}

export default function TwoFactorAuth({ isOpen, onClose, method = 'authenticator' }: TwoFactorSetupProps) {
  const { isArabic } = useLanguage();
  const { user, enable2FA, disable2FA, verify2FA, generateBackupCodes } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<'select' | 'setup' | 'verify' | 'backup' | 'complete'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email' | 'authenticator'>(method);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const startCountdown = () => {
    setCountdown(30); // 30 seconds cooldown
  };

  const handleMethodSetup = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      let setupData: any = {};

      switch (selectedMethod) {
        case 'sms':
          if (!phoneNumber) {
            setErrors({ phone: isArabic ? 'رقم الهاتف مطلوب' : 'Phone number is required' });
            return;
          }
          setupData.phoneNumber = phoneNumber;
          break;
        case 'email':
          if (!email) {
            setErrors({ email: isArabic ? 'البريد الإلكتروني مطلوب' : 'Email is required' });
            return;
          }
          setupData.email = email;
          break;
        case 'authenticator':
          // No additional data needed
          break;
      }

      const result = await enable2FA(selectedMethod);

      if (result.success) {
        if (selectedMethod === 'authenticator' && result.qrCode) {
          setQrCodeUrl(result.qrCode);
          setSecretKey('JBSWY3DPEHPK3PXP'); // Mock secret key
        }
        
        if (result.backupCodes) {
          setBackupCodes(result.backupCodes.map(code => ({ code, used: false })));
        }
        
        setStep('verify');
        startCountdown();
        
        toast({
          title: isArabic ? 'تم الإعداد بنجاح' : 'Setup Successful',
          description: isArabic ? 'تم إرسال رمز التحقق' : 'Verification code has been sent'
        });
      } else {
        setErrors({ setup: result.error || (isArabic ? 'فشل في الإعداد' : 'Setup failed') });
      }
    } catch (error) {
      setErrors({ setup: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode) {
      setErrors({ code: isArabic ? 'رمز التحقق مطلوب' : 'Verification code is required' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await verify2FA(verificationCode);

      if (result.success) {
        setStep('backup');
        toast({
          title: isArabic ? 'تم التحقق بنجاح' : 'Verification Successful',
          description: isArabic ? 'تم تفعيل المصادقة الثنائية' : 'Two-factor authentication enabled'
        });
      } else {
        setErrors({ code: result.error || (isArabic ? 'رمز غير صحيح' : 'Invalid code') });
      }
    } catch (error) {
      setErrors({ code: isArabic ? 'حدث خطأ في التحقق' : 'Verification error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!verificationCode) {
      setErrors({ code: isArabic ? 'أدخل رمز التحقق لإلغاء التفعيل' : 'Enter verification code to disable' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await disable2FA(verificationCode);

      if (result.success) {
        onClose();
        toast({
          title: isArabic ? 'تم إلغاء التفعيل' : 'Disabled Successfully',
          description: isArabic ? 'تم إلغاء تفعيل المصادقة الثنائية' : 'Two-factor authentication disabled'
        });
      } else {
        setErrors({ code: result.error || (isArabic ? 'رمز غير صحيح' : 'Invalid code') });
      }
    } catch (error) {
      setErrors({ code: isArabic ? 'حدث خطأ' : 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewBackupCodes = async () => {
    setIsLoading(true);
    try {
      const result = await generateBackupCodes();
      if (result.success && result.codes) {
        setBackupCodes(result.codes.map(code => ({ code, used: false })));
        toast({
          title: isArabic ? 'تم إنشاء رموز جديدة' : 'New Codes Generated',
          description: isArabic ? 'احفظ الرموز الجديدة في مكان آمن' : 'Save the new codes in a safe place'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إنشاء رموز جديدة' : 'Failed to generate new codes'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: isArabic ? 'تم النسخ' : 'Copied',
      description: isArabic ? 'تم نسخ النص إلى الحافظة' : 'Text copied to clipboard'
    });
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.map(backup => backup.code).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrogrowth-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      // Simulate resending code
      await new Promise(resolve => setTimeout(resolve, 1000));
      startCountdown();
      toast({
        title: isArabic ? 'تم إعادة الإرسال' : 'Code Resent',
        description: isArabic ? 'تم إرسال رمز جديد' : 'A new code has been sent'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إعادة الإرسال' : 'Failed to resend code'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            {isArabic ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}
          </DialogTitle>
          <DialogDescription>
            {user?.is2FAEnabled 
              ? (isArabic ? 'إدارة إعدادات المصادقة الثنائية الخاصة بك' : 'Manage your two-factor authentication settings')
              : (isArabic ? 'قم بإعداد طبقة حماية إضافية لحسابك' : 'Set up an extra layer of security for your account')
            }
          </DialogDescription>
        </DialogHeader>

        {user?.is2FAEnabled ? (
          /* 2FA Management for existing users */
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {isArabic ? 'المصادقة الثنائية مفعلة حالياً' : 'Two-factor authentication is currently enabled'}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{isArabic ? 'طريقة المصادقة' : 'Authentication Method'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    <span>{isArabic ? 'تطبيق المصادقة' : 'Authenticator App'}</span>
                    <Badge variant="secondary">{isArabic ? 'نشط' : 'Active'}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{isArabic ? 'آخر استخدام' : 'Last Used'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {isArabic ? 'منذ ساعتين' : '2 hours ago'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="backup-codes" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="backup-codes">{isArabic ? 'رموز احتياطية' : 'Backup Codes'}</TabsTrigger>
                <TabsTrigger value="settings">{isArabic ? 'الإعدادات' : 'Settings'}</TabsTrigger>
                <TabsTrigger value="disable">{isArabic ? 'إلغاء التفعيل' : 'Disable'}</TabsTrigger>
              </TabsList>

              <TabsContent value="backup-codes" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{isArabic ? 'رموز الطوارئ' : 'Emergency Codes'}</h4>
                    <p className="text-sm text-gray-600">
                      {isArabic ? 'استخدم هذه الرموز إذا فقدت جهازك' : 'Use these codes if you lose your device'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={generateNewBackupCodes} disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                      {isArabic ? 'إنشاء جديدة' : 'Generate New'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                      <Download className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                      {isArabic ? 'تحميل' : 'Download'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                      <code className="text-sm font-mono">{`${Math.random().toString(36).substring(2, 8).toUpperCase()}`}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(`CODE-${i + 1}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {isArabic 
                      ? 'احفظ ��ذه الرموز في مكان آمن. كل رمز يمكن استخدامه مرة واحدة فقط.' 
                      : 'Store these codes in a safe place. Each code can only be used once.'
                    }
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{isArabic ? 'تطبيق المصادقة' : 'Authenticator App'}</Label>
                      <p className="text-sm text-gray-600">
                        {isArabic ? 'Google Authenticator أو Microsoft Authenticator' : 'Google Authenticator or Microsoft Authenticator'}
                      </p>
                    </div>
                    <Badge variant="secondary">{isArabic ? 'نشط' : 'Active'}</Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{isArabic ? 'إشعارات الأمان' : 'Security Notifications'}</Label>
                      <p className="text-sm text-gray-600">
                        {isArabic ? 'تلقي تنبيهات عند استخدام 2FA' : 'Receive alerts when 2FA is used'}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{isArabic ? 'تذكر الجهاز' : 'Remember Device'}</Label>
                      <p className="text-sm text-gray-600">
                        {isArabic ? 'عدم طلب 2FA لمدة 30 يوم على هذا الجهاز' : "Don't ask for 2FA for 30 days on this device"}
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="disable" className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {isArabic 
                      ? 'تحذير: إلغاء تفعيل المصادقة الثنائية سيقلل من أمان حسابك.' 
                      : 'Warning: Disabling two-factor authentication will reduce your account security.'
                    }
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="disable-code">{isArabic ? 'رمز ��لتحقق' : 'Verification Code'}</Label>
                    <Input
                      id="disable-code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder={isArabic ? 'أدخل الرمز من تطبيق المصادقة' : 'Enter code from authenticator app'}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                    {errors.code && (
                      <p className="text-sm text-red-600 mt-1">{errors.code}</p>
                    )}
                  </div>

                  <Button 
                    variant="destructive" 
                    onClick={handleDisable2FA} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />
                        {isArabic ? 'جاري الإلغاء...' : 'Disabling...'}
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                        {isArabic ? 'إلغاء تفعيل المصادقة الثنائية' : 'Disable Two-Factor Authentication'}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* 2FA Setup for new users */
          <div className="space-y-6">
            {step === 'select' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isArabic ? 'اختر طريقة المصادقة' : 'Choose Authentication Method'}
                  </h3>
                  <p className="text-gray-600">
                    {isArabic ? 'حدد الطريقة المفضلة لديك للمصادقة الثنائية' : 'Select your preferred method for two-factor authentication'}
                  </p>
                </div>

                <div className="grid gap-4">
                  <Card 
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedMethod === 'authenticator' ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedMethod('authenticator')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Smartphone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{isArabic ? 'تطبيق المصادقة' : 'Authenticator App'}</h4>
                          <p className="text-sm text-gray-600">
                            {isArabic ? 'استخدم Google Authenticator أو Microsoft Authenticator' : 'Use Google Authenticator or Microsoft Authenticator'}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {isArabic ? 'الأكثر أماناً' : 'Most Secure'}
                          </Badge>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedMethod === 'sms' ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedMethod('sms')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <MessageSquare className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{isArabic ? 'رسالة نصية (SMS)' : 'SMS Text Message'}</h4>
                          <p className="text-sm text-gray-600">
                            {isArabic ? 'استقبل رموز التحقق عبر الرسائل النصية' : 'Receive verification codes via text messages'}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {isArabic ? 'سهل الاستخدام' : 'Easy to Use'}
                          </Badge>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedMethod === 'email' ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedMethod('email')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Mail className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{isArabic ? 'البريد الإلكتروني' : 'Email Verification'}</h4>
                          <p className="text-sm text-gray-600">
                            {isArabic ? 'استقبل رموز التحقق عبر البريد الإلكتروني' : 'Receive verification codes via email'}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {isArabic ? 'متاح دائماً' : 'Always Available'}
                          </Badge>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedMethod === 'sms' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
                    <div className="flex gap-2">
                      <select className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="+962">🇯🇴 +962</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                      <Input
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={isArabic ? '79 123 4567' : '79 123 4567'}
                        className="flex-1"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                )}

                {selectedMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="email">{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isArabic ? 'your@email.com' : 'your@email.com'}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                )}

                {errors.setup && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errors.setup}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button onClick={handleMethodSetup} disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />
                        {isArabic ? 'جاري الإعداد...' : 'Setting up...'}
                      </>
                    ) : (
                      <>
                        {isArabic ? 'متابعة' : 'Continue'}
                        <ChevronRight className="ml-2 rtl:mr-2 rtl:ml-0 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                    {selectedMethod === 'authenticator' && <QrCode className="h-8 w-8 text-blue-600" />}
                    {selectedMethod === 'sms' && <MessageSquare className="h-8 w-8 text-blue-600" />}
                    {selectedMethod === 'email' && <Mail className="h-8 w-8 text-blue-600" />}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isArabic ? 'تحقق من الإع��اد' : 'Verify Setup'}
                  </h3>
                  <p className="text-gray-600">
                    {selectedMethod === 'authenticator' 
                      ? (isArabic ? 'امسح رمز QR أو أدخل المفتاح يدوياً' : 'Scan the QR code or enter the key manually')
                      : (isArabic ? 'أدخل الرمز المرسل إليك' : 'Enter the code sent to you')
                    }
                  </p>
                </div>

                {selectedMethod === 'authenticator' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                        <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                          <QrCode className="h-16 w-16 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {isArabic ? 'امسح هذا الرمز بتطبيق المصادقة' : 'Scan this code with your authenticator app'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>{isArabic ? 'أو أدخل المفتاح يدوياً' : 'Or enter the key manually'}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={secretKey}
                          readOnly
                          type={showSecretKey ? "text" : "password"}
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(secretKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verification-code">{isArabic ? 'رمز التحقق' : 'Verification Code'}</Label>
                  <Input
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-600">{errors.code}</p>
                  )}
                </div>

                {(selectedMethod === 'sms' || selectedMethod === 'email') && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={resendCode}
                      disabled={countdown > 0 || isLoading}
                      size="sm"
                    >
                      {countdown > 0 ? (
                        <>
                          <Clock className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                          {isArabic ? `إعادة الإرسال خلال ${countdown}s` : `Resend in ${countdown}s`}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                          {isArabic ? 'إعادة إرسال الرمز' : 'Resend Code'}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                    {isArabic ? 'رجوع' : 'Back'}
                  </Button>
                  <Button onClick={handleVerification} disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />
                        {isArabic ? 'جاري التحقق...' : 'Verifying...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                        {isArabic ? 'تحقق' : 'Verify'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'backup' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                    <Key className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isArabic ? 'رموز الطوارئ' : 'Emergency Backup Codes'}
                  </h3>
                  <p className="text-gray-600">
                    {isArabic ? 'احفظ هذه الرموز في مكان آمن للوصول لحسابك في حالة فقدان الجهاز' : 'Save these codes in a safe place to access your account if you lose your device'}
                  </p>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {isArabic 
                      ? 'هذه الرموز ستظهر مرة واحدة فقط. احفظها في مكان آمن.' 
                      : 'These codes will only be shown once. Save them in a safe place.'
                    }
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                  {backupCodes.map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <code className="text-sm font-mono">{backup.code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(backup.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                    <Download className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" />
                    {isArabic ? 'تحميل كملف' : 'Download as File'}
                  </Button>
                  <Button onClick={() => setStep('complete')} className="flex-1">
                    {isArabic ? 'إنهاء الإعداد' : 'Complete Setup'}
                  </Button>
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-6 text-center">
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    {isArabic ? 'تم تفعيل المصادقة الثنائية!' : 'Two-Factor Authentication Enabled!'}
                  </h3>
                  <p className="text-gray-600">
                    {isArabic ? 'حسابك الآن محمي بطبقة أمان إضافية' : 'Your account is now protected with an extra layer of security'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {isArabic ? 'ما التالي؟' : "What's Next?"}
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• {isArabic ? 'احفظ رموز الطوارئ' : 'Save your emergency codes'}</li>
                      <li>• {isArabic ? 'جرب تسجيل الدخول' : 'Test your login'}</li>
                      <li>• {isArabic ? 'أضف أجهزة موثوقة' : 'Add trusted devices'}</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">
                      {isArabic ? 'نصائح أمنية' : 'Security Tips'}
                    </h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• {isArabic ? 'لا تشارك رموز 2FA' : "Don't share your 2FA codes"}</li>
                      <li>• {isArabic ? 'احتفظ بنسخة من الرموز' : 'Keep backup of codes'}</li>
                      <li>• {isArabic ? 'حدث تطبيق المصادقة' : 'Update authenticator app'}</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={onClose} className="w-full">
                  {isArabic ? 'تم' : 'Done'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
