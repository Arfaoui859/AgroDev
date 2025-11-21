import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function Login() {
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    try {
      await signIn(formData.email, formData.password);
      // Navigation will be handled by the AuthContext
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى";

      if (error.message === "Invalid login credentials") {
        errorMessage =
          "بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage =
          "يرجى تأكيد البريد الإلكتروني أولاً من خلال الرابط المرسل إليك.";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "البريد الإلكتروني غير صحيح.";
      }

      setError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-2 sm:p-4"
      dir="rtl"
    >
      <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-transparent rounded-full mb-4">
            <Logo size={64} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            AgroGrowth
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            منصة زراعية ذكية متكاملة
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-center">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-center">
              أدخل بياناتك للدخول إلى المنصة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="أدخل بريدك الإلكتروني"
                    className="pr-10 h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="أدخل كلمة المرور"
                    className="pr-10 pl-10 h-12 text-base"
                    required
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/signup"
                className="text-sm text-green-600 hover:text-green-700"
              >
                ليس لديك حساب؟ إنشاء حساب جديد
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">
              بيانات اختبار توضيحية
            </CardTitle>
            <CardDescription className="text-sm text-blue-700">
              استخدم هذه البيانات لاختبار المنصة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agricole User */}
            <div className="space-y-3 pb-4 border-b border-blue-200">
              <h3 className="text-sm font-bold text-blue-900">المستخدم الزراعي (Agricole)</h3>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-800">البريد الإلكتروني:</p>
                <p className="text-sm font-mono bg-white p-2 rounded border border-blue-200 break-all">
                  sami.arfaoui.itservice@gmail.com
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-800">كلمة المرور:</p>
                <p className="text-sm font-mono bg-white p-2 rounded border border-blue-200">
                  adminstartup
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFormData({
                    email: "sami.arfaoui.itservice@gmail.com",
                    password: "adminstartup",
                  });
                }}
              >
                تعبئة بيانات المزارع
              </Button>
            </div>

            {/* Admin User */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-blue-900">المسؤول (Admin)</h3>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-800">البريد الإلكتروني:</p>
                <p className="text-sm font-mono bg-white p-2 rounded border border-blue-200 break-all">
                  admin@agrogrowth.com
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-800">كلمة المرور:</p>
                <p className="text-sm font-mono bg-white p-2 rounded border border-blue-200">
                  admin123
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-purple-50 hover:bg-purple-100 border-purple-200"
                onClick={() => {
                  setFormData({
                    email: "admin@agrogrowth.com",
                    password: "admin123",
                  });
                }}
              >
                تعبئة بيانات المسؤول
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-600">
          <p>
            بتسجيل الدخول، فإنك توافق على
            <Link
              to="/terms"
              className="text-green-600 hover:text-green-700 mx-1"
            >
              شروط الاستخدام
            </Link>
            و
            <Link
              to="/privacy"
              className="text-green-600 hover:text-green-700 mx-1"
            >
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
