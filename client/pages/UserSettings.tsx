import React, { useState } from 'react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
         AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
         AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Settings, Bell, Shield, Download, Upload, Trash2, Save,
         Camera, MapPin, Crop, Globe, Palette, Monitor, Smartphone,
         Mail, Clock, DollarSign, Thermometer, Droplets, AlertTriangle,
         Lock, Key, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import TwoFactorAuth from '../components/TwoFactorAuth';

export default function UserSettings() {
  const { isArabic } = useLanguage();
  const { profile, preferences, updateProfile, updatePreferences, resetPreferences, 
          exportUserData, importUserData, deleteAccount } = useUserPreferences();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [show2FADialog, setShow2FADialog] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      updateProfile(localProfile);
      toast({
        title: isArabic ? 'تم حفظ الملف الشخصي' : 'Profile Saved',
        description: isArabic ? 'تم تحديث معلوماتك الشخصية بنجاح' : 'Your profile information has been updated successfully.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الملف الشخصي' : 'Failed to save profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      updatePreferences(localPreferences);
      toast({
        title: isArabic ? 'تم حفظ التفضيلات' : 'Preferences Saved',
        description: isArabic ? 'تم تحديث تفضيلاتك بنجاح' : 'Your preferences have been updated successfully.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ التفضيلات' : 'Failed to save preferences'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agrogrowth-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: isArabic ? 'تم تصدير البيانات' : 'Data Exported',
        description: isArabic ? 'تم تصدير بياناتك بنجاح' : 'Your data has been exported successfully.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تصدير البيانات' : 'Failed to export data'
      });
    }
  };

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text();
      const success = await importUserData(text);
      
      if (success) {
        setLocalProfile(profile);
        setLocalPreferences(preferences);
        toast({
          title: isArabic ? 'تم استيراد البيانات' : 'Data Imported',
          description: isArabic ? 'تم استيراد بياناتك بنجاح' : 'Your data has been imported successfully.'
        });
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في استيراد البيانات' : 'Failed to import data'
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const success = await deleteAccount();
      if (success) {
        toast({
          title: isArabic ? 'تم حذف الحساب' : 'Account Deleted',
          description: isArabic ? 'تم حذف حسابك بنجاح' : 'Your account has been deleted successfully.'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حذف الحساب' : 'Failed to delete account'
      });
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isArabic ? 'إعدادات الحساب' : 'Account Settings'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic ? 'إدارة ملفك الشخصي وتفضيلاتك' : 'Manage your profile and preferences'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {isArabic ? 'تصدير البيانات' : 'Export Data'}
          </Button>
          <Button onClick={handleSaveProfile} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isArabic ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            {isArabic ? 'الملف الشخصي' : 'Profile'}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            {isArabic ? 'التفضيلات' : 'Preferences'}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            {isArabic ? 'الإشعارات' : 'Notifications'}
          </TabsTrigger>
          <TabsTrigger value="agricultural" className="gap-2">
            <Crop className="h-4 w-4" />
            {isArabic ? 'الزراعة' : 'Agricultural'}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            {isArabic ? 'الخصوصية' : 'Privacy'}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'تحديث معلوماتك الشخصية وتفاصيل الاتصال' : 'Update your personal information and contact details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={localProfile.avatar} />
                  <AvatarFallback className="text-lg">
                    {localProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{isArabic ? localProfile.nameArabic : localProfile.name}</h3>
                  <p className="text-gray-600">{localProfile.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    {isArabic ? localProfile.roleArabic : localProfile.role}
                  </Badge>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Camera className="h-4 w-4" />
                      {isArabic ? 'تغيير الصورة' : 'Change Photo'}
                    </Button>
                    <Button size="sm" variant="ghost">
                      {isArabic ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{isArabic ? 'الاسم (بالإنجليزية)' : 'Name (English)'}</Label>
                  <Input
                    id="name"
                    value={localProfile.name}
                    onChange={(e) => setLocalProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameArabic">{isArabic ? 'الاسم (بالعربية)' : 'Name (Arabic)'}</Label>
                  <Input
                    id="nameArabic"
                    value={localProfile.nameArabic}
                    onChange={(e) => setLocalProfile(prev => ({ ...prev, nameArabic: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={localProfile.email}
                    onChange={(e) => setLocalProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{isArabic ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input
                    id="phone"
                    value={localProfile.phone}
                    onChange={(e) => setLocalProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Location Information */}
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {isArabic ? 'معلومات الموقع' : 'Location Information'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isArabic ? 'المحافظة' : 'Governorate'}</Label>
                    <Input
                      value={isArabic ? localProfile.location.governorateArabic : localProfile.location.governorate}
                      onChange={(e) => setLocalProfile(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          [isArabic ? 'governorateArabic' : 'governorate']: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? 'المدينة' : 'City'}</Label>
                    <Input
                      value={isArabic ? localProfile.location.cityArabic : localProfile.location.city}
                      onChange={(e) => setLocalProfile(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          [isArabic ? 'cityArabic' : 'city']: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? 'البلد' : 'Country'}</Label>
                    <Input
                      value={isArabic ? localProfile.location.countryArabic : localProfile.location.country}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Farm Information */}
              {localProfile.farmInfo && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Crop className="h-4 w-4" />
                      {isArabic ? 'معلومات المزرعة' : 'Farm Information'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isArabic ? 'اسم المزرعة' : 'Farm Name'}</Label>
                        <Input
                          value={isArabic ? localProfile.farmInfo.nameArabic : localProfile.farmInfo.name}
                          onChange={(e) => setLocalProfile(prev => ({
                            ...prev,
                            farmInfo: prev.farmInfo ? {
                              ...prev.farmInfo,
                              [isArabic ? 'nameArabic' : 'name']: e.target.value
                            } : undefined
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? 'المساحة (هكتار)' : 'Size (Hectares)'}</Label>
                        <Input
                          type="number"
                          value={localProfile.farmInfo.size}
                          onChange={(e) => setLocalProfile(prev => ({
                            ...prev,
                            farmInfo: prev.farmInfo ? {
                              ...prev.farmInfo,
                              size: Number(e.target.value)
                            } : undefined
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? 'نوع الزراعة' : 'Farming Type'}</Label>
                        <Select
                          value={localProfile.farmInfo.farmingType}
                          onValueChange={(value: any) => setLocalProfile(prev => ({
                            ...prev,
                            farmInfo: prev.farmInfo ? {
                              ...prev.farmInfo,
                              farmingType: value
                            } : undefined
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="organic">{isArabic ? 'عضوي' : 'Organic'}</SelectItem>
                            <SelectItem value="conventional">{isArabic ? 'تقليدي' : 'Conventional'}</SelectItem>
                            <SelectItem value="mixed">{isArabic ? 'مختلط' : 'Mixed'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{isArabic ? 'سنة التأسيس' : 'Established Year'}</Label>
                        <Input
                          type="number"
                          value={localProfile.farmInfo.establishedYear}
                          onChange={(e) => setLocalProfile(prev => ({
                            ...prev,
                            farmInfo: prev.farmInfo ? {
                              ...prev.farmInfo,
                              establishedYear: Number(e.target.value)
                            } : undefined
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language & Localization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {isArabic ? 'اللغة والتوطين' : 'Language & Localization'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{isArabic ? 'اللغة' : 'Language'}</Label>
                  <Select
                    value={localPreferences.language}
                    onValueChange={(value: any) => setLocalPreferences(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'تنسيق التاريخ' : 'Date Format'}</Label>
                  <Select
                    value={localPreferences.dateFormat}
                    onValueChange={(value: any) => setLocalPreferences(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'تنسيق الوقت' : 'Time Format'}</Label>
                  <Select
                    value={localPreferences.timeFormat}
                    onValueChange={(value: any) => setLocalPreferences(prev => ({ ...prev, timeFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'العملة' : 'Currency'}</Label>
                  <Select
                    value={localPreferences.currency}
                    onValueChange={(value: any) => setLocalPreferences(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JOD">JOD (Jordanian Dinar)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* UI & Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {isArabic ? 'الواجهة والمظهر' : 'UI & Appearance'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{isArabic ? 'المظهر' : 'Theme'}</Label>
                  <Select
                    value={localPreferences.theme}
                    onValueChange={(value: any) => setLocalPreferences(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{isArabic ? 'فاتح' : 'Light'}</SelectItem>
                      <SelectItem value="dark">{isArabic ? 'داكن' : 'Dark'}</SelectItem>
                      <SelectItem value="auto">{isArabic ? 'تلقائي' : 'Auto'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'تخط��ط لوحة التحكم' : 'Dashboard Layout'}</Label>
                  <Select
                    value={localPreferences.dashboardLayout}
                    onValueChange={(value: any) => setLocalPreferences(prev => ({ ...prev, dashboardLayout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">{isArabic ? 'مضغوط' : 'Compact'}</SelectItem>
                      <SelectItem value="comfortable">{isArabic ? 'مريح' : 'Comfortable'}</SelectItem>
                      <SelectItem value="spacious">{isArabic ? 'واسع' : 'Spacious'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sidebar-collapsed">{isArabic ? 'إخفاء الشريط الجانبي' : 'Collapse Sidebar'}</Label>
                  <Switch
                    id="sidebar-collapsed"
                    checked={localPreferences.sidebarCollapsed}
                    onCheckedChange={(checked) => setLocalPreferences(prev => ({ ...prev, sidebarCollapsed: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={isLoading}>
              {isArabic ? 'حفظ التفضيلات' : 'Save Preferences'}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'تخصيص كيفية ووقت تلقي الإشعارات' : 'Customize how and when you receive notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div>
                <h4 className="font-medium mb-4">{isArabic ? 'قنوات الإشعارات' : 'Notification Channels'}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label>{isArabic ? 'البريد الإلكتروني' : 'Email Notifications'}</Label>
                        <p className="text-sm text-gray-500">
                          {isArabic ? 'تلقي الإشعارات عبر البريد الإلكتروني' : 'Receive notifications via email'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={localPreferences.notifications.email}
                      onCheckedChange={(checked) => setLocalPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label>{isArabic ? 'إشعارات المتصفح' : 'Browser Notifications'}</Label>
                        <p className="text-sm text-gray-500">
                          {isArabic ? 'إشعارات فورية في المتصفح' : 'Instant notifications in browser'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={localPreferences.notifications.browser}
                      onCheckedChange={(checked) => setLocalPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, browser: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <div>
                        <Label>{isArabic ? 'إشعارات الجوال' : 'Mobile Notifications'}</Label>
                        <p className="text-sm text-gray-500">
                          {isArabic ? 'إشعارات على التطبيق المحمول' : 'Push notifications on mobile app'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={localPreferences.notifications.mobile}
                      onCheckedChange={(checked) => setLocalPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, mobile: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Types */}
              <div>
                <h4 className="font-medium mb-4">{isArabic ? 'أنواع الإشعارات' : 'Notification Types'}</h4>
                <div className="space-y-4">
                  {[
                    { key: 'weatherAlerts', label: isArabic ? 'تنبيهات الطقس' : 'Weather Alerts', icon: '🌤️' },
                    { key: 'diseaseAlerts', label: isArabic ? 'تنبيهات الأمراض' : 'Disease Alerts', icon: '🦠' },
                    { key: 'marketUpdates', label: isArabic ? 'تحديثات السوق' : 'Market Updates', icon: '📈' },
                    { key: 'irrigationReminders', label: isArabic ? 'تذكيرات الري' : 'Irrigation Reminders', icon: '💧' },
                    { key: 'systemNotifications', label: isArabic ? 'إشعارات النظام' : 'System Notifications', icon: '⚙️' }
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        <Label>{label}</Label>
                      </div>
                      <Switch
                        checked={localPreferences.notifications[key as keyof typeof localPreferences.notifications] as boolean}
                        onCheckedChange={(checked) => setLocalPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notification Frequency */}
              <div>
                <h4 className="font-medium mb-4">{isArabic ? 'تكرار الإشعارات' : 'Notification Frequency'}</h4>
                <Select
                  value={localPreferences.notifications.frequency}
                  onValueChange={(value: any) => setLocalPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, frequency: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">{isArabic ? 'فوري' : 'Immediate'}</SelectItem>
                    <SelectItem value="hourly">{isArabic ? 'كل ساعة' : 'Hourly'}</SelectItem>
                    <SelectItem value="daily">{isArabic ? 'يومي' : 'Daily'}</SelectItem>
                    <SelectItem value="weekly">{isArabic ? 'أسبوعي' : 'Weekly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agricultural Tab */}
        <TabsContent value="agricultural" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Crop Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crop className="h-5 w-5" />
                  {isArabic ? 'تفضيلات المحاصيل' : 'Crop Preferences'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>{isArabic ? 'المحاصيل المفضلة' : 'Preferred Crops'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {localPreferences.cropPreferences.map((crop, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {crop}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => setLocalPreferences(prev => ({
                            ...prev,
                            cropPreferences: prev.cropPreferences.filter((_, i) => i !== index)
                          }))}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {isArabic ? 'عتبات التنبيهات' : 'Alert Thresholds'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    {isArabic ? 'درجة الحرارة (°س)' : 'Temperature (°C)'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={isArabic ? 'الحد الأدنى' : 'Min'}
                      value={localPreferences.alertThresholds.temperature.min}
                      onChange={(e) => setLocalPreferences(prev => ({
                        ...prev,
                        alertThresholds: {
                          ...prev.alertThresholds,
                          temperature: { ...prev.alertThresholds.temperature, min: Number(e.target.value) }
                        }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder={isArabic ? 'الحد الأقصى' : 'Max'}
                      value={localPreferences.alertThresholds.temperature.max}
                      onChange={(e) => setLocalPreferences(prev => ({
                        ...prev,
                        alertThresholds: {
                          ...prev.alertThresholds,
                          temperature: { ...prev.alertThresholds.temperature, max: Number(e.target.value) }
                        }
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    {isArabic ? 'رطوبة التربة (%)' : 'Soil Moisture (%)'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={isArabic ? 'الحد الأدنى' : 'Min'}
                      value={localPreferences.alertThresholds.soilMoisture.min}
                      onChange={(e) => setLocalPreferences(prev => ({
                        ...prev,
                        alertThresholds: {
                          ...prev.alertThresholds,
                          soilMoisture: { ...prev.alertThresholds.soilMoisture, min: Number(e.target.value) }
                        }
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder={isArabic ? 'الحد الأقصى' : 'Max'}
                      value={localPreferences.alertThresholds.soilMoisture.max}
                      onChange={(e) => setLocalPreferences(prev => ({
                        ...prev,
                        alertThresholds: {
                          ...prev.alertThresholds,
                          soilMoisture: { ...prev.alertThresholds.soilMoisture, max: Number(e.target.value) }
                        }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {isArabic ? 'الخصوصية والأمان' : 'Privacy & Security'}
              </CardTitle>
              <CardDescription>
                {isArabic ? 'إدارة خصوصية بياناتك وإعدادات الأمان' : 'Manage your data privacy and security settings'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Sharing */}
              <div>
                <h4 className="font-medium mb-4">{isArabic ? 'مشاركة البيانات' : 'Data Sharing'}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{isArabic ? 'التحليلات والإحصائيات' : 'Analytics & Statistics'}</Label>
                      <p className="text-sm text-gray-500">
                        {isArabic ? 'مشاركة البيانات لتحسين الخدمة' : 'Share data to improve service quality'}
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.dataSharing.analytics}
                      onCheckedChange={(checked) => setLocalPreferences(prev => ({
                        ...prev,
                        dataSharing: { ...prev.dataSharing, analytics: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{isArabic ? 'البحث العلمي' : 'Research Purposes'}</Label>
                      <p className="text-sm text-gray-500">
                        {isArabic ? 'استخدام البيانات للبحث الزراعي' : 'Use data for agricultural research'}
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.dataSharing.research}
                      onCheckedChange={(checked) => setLocalPreferences(prev => ({
                        ...prev,
                        dataSharing: { ...prev.dataSharing, research: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div>
                <h4 className="font-medium mb-4">{isArabic ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        user?.is2FAEnabled ? "bg-green-100" : "bg-gray-100"
                      )}>
                        {user?.is2FAEnabled ? (
                          <Lock className="h-5 w-5 text-green-600" />
                        ) : (
                          <Shield className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Label className="text-base">{isArabic ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}</Label>
                        <p className="text-sm text-gray-500">
                          {user?.is2FAEnabled
                            ? (isArabic ? 'مفعلة - حسابك محمي بطبقة أمان إضافية' : 'Enabled - Your account is protected with an extra security layer')
                            : (isArabic ? 'غير مفعلة - أضف طبقة حماية إضافية لحسابك' : 'Disabled - Add an extra layer of security to your account')
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.is2FAEnabled && (
                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                          {isArabic ? 'مفعل' : 'Active'}
                        </Badge>
                      )}
                      <Button
                        variant={user?.is2FAEnabled ? "outline" : "default"}
                        size="sm"
                        onClick={() => setShow2FADialog(true)}
                        className="gap-2"
                      >
                        {user?.is2FAEnabled ? (
                          <>
                            <Settings className="h-4 w-4" />
                            {isArabic ? 'إدارة' : 'Manage'}
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4" />
                            {isArabic ? 'تفعيل' : 'Enable'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {user?.is2FAEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <QrCode className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">{isArabic ? 'تطبيق المصادقة' : 'Authenticator App'}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'الطريقة النشطة' : 'Active Method'}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Key className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">{isArabic ? 'رموز احتياطية' : 'Backup Codes'}</p>
                        <p className="text-xs text-gray-600">{isArabic ? '8 متبقية' : '8 remaining'}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium">{isArabic ? 'آخر استخدام' : 'Last Used'}</p>
                        <p className="text-xs text-gray-600">{isArabic ? 'منذ ساعتين' : '2 hours ago'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Data Management */}
              <div>
                <h4 className="font-medium mb-4">{isArabic ? 'إدارة البيانات' : 'Data Management'}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{isArabic ? 'النسخ الاحتياطي التلقائي' : 'Automatic Backup'}</Label>
                      <p className="text-sm text-gray-500">
                        {isArabic ? 'إنشاء نسخ احتياطية من بياناتك تلقائياً' : 'Automatically backup your data'}
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.autoBackup}
                      onCheckedChange={(checked) => setLocalPreferences(prev => ({ ...prev, autoBackup: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isArabic ? 'فترة الاحتفاظ بالبيانات' : 'Data Retention Period'}</Label>
                    <Select
                      value={localPreferences.dataRetention}
                      onValueChange={(value: any) => setLocalPreferences(prev => ({ ...prev, dataRetention: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1year">{isArabic ? 'سنة واحدة' : '1 Year'}</SelectItem>
                        <SelectItem value="2years">{isArabic ? 'سنتان' : '2 Years'}</SelectItem>
                        <SelectItem value="5years">{isArabic ? '5 سنوات' : '5 Years'}</SelectItem>
                        <SelectItem value="indefinite">{isArabic ? 'إلى أجل غير مسمى' : 'Indefinite'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {isArabic ? 'منطقة الخطر' : 'Danger Zone'}
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-red-900">{isArabic ? 'إعادة تعيين جميع التفضيلات' : 'Reset All Preferences'}</Label>
                      <p className="text-sm text-red-600">
                        {isArabic ? 'سيؤدي هذا إلى إعادة تعيين جميع إعداداتك إلى القيم الافتراضية' : 'This will reset all your settings to default values'}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                          {isArabic ? 'إعادة تعيين' : 'Reset'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{isArabic ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isArabic ? 
                              'سيؤدي هذا الإجراء إلى حذف جميع التفضيلات المخصصة وإعادة تعيينها إلى القيم الافتراضية. لا يمكن التراجع عن هذا الإجراء.' :
                              'This action will delete all your custom preferences and reset them to default values. This cannot be undone.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction onClick={resetPreferences} className="bg-red-600 hover:bg-red-700">
                            {isArabic ? 'إعادة تعيين' : 'Reset'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-red-900">{isArabic ? 'حذف الحساب' : 'Delete Account'}</Label>
                      <p className="text-sm text-red-600">
                        {isArabic ? 'حذف نهائي لحسابك وجميع البيانات المرتبطة به' : 'Permanently delete your account and all associated data'}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          {isArabic ? 'حذف الحساب' : 'Delete Account'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{isArabic ? 'تأكيد حذف الحساب' : 'Confirm Account Deletion'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isArabic ? 
                              'سيؤدي هذا الإجراء إلى حذف حسابك نهائياً مع جميع البيانات والملفات والإعدادات. لا يمكن التراجع عن هذا الإجراء.' :
                              'This action will permanently delete your account along with all data, files, and settings. This cannot be undone.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                            {isArabic ? 'حذف نهائي' : 'Delete Permanently'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Two-Factor Authentication Dialog */}
      <TwoFactorAuth
        isOpen={show2FADialog}
        onClose={() => setShow2FADialog(false)}
      />
    </div>
  );
}
