import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function SetupDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-green-700" />
            إعداد حسابات AgroGrowth
          </CardTitle>
          <CardDescription>
            إنشاء الحسابات يتم عبر مسار المصادقة الرسمي، وليس عبر كلمات مرور تجريبية مشتركة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              تم تعطيل إنشاء حسابات Demo الجاهزة لحماية حسابات المستخدمين ومنع إنشاء مسؤول بكلمة مرور معروفة.
              أنشئ حساباً من صفحة التسجيل، أو أضف حسابات الاختبار من لوحة Supabase Auth في مشروع تطوير معتمد.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link to="/signup">إنشاء حساب جديد</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">العودة إلى تسجيل الدخول</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
