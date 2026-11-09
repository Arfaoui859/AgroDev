import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function SetupDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
              <CardTitle>إعداد الحسابات التجريبية معطّل</CardTitle>
            </div>
            <CardDescription>
              تم تعطيل الحسابات وكلمات المرور الافتراضية لحماية AgroGrowth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              إنشاء حساب المسؤول أو تغيير أدوار المستخدمين عملية إدارية حساسة،
              ولا تتم من واجهة المتصفح أو عبر بيانات دخول ثابتة.
            </p>
            <p>
              يجب تنفيذ التهيئة من بيئة الخادم باستخدام مسار إداري محمي
              ومتغير ADMIN_API_TOKEN، مع كلمة مرور قوية يحددها مسؤول النظام.
            </p>
            <p className="text-gray-500">
              الحسابات الجديدة تبدأ بصلاحية فلاح، وأي صلاحية مهنية أو إدارية
              إضافية تتطلب موافقة مسؤول النظام.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
