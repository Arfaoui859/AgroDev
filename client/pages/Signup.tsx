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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  Phone,
  Building,
  AlertCircle,
} from "lucide-react";

export default function Signup() {
  const { signUp, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    full_name_ar: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "" as
      | "farmer"
      | "agronomist"
      | "trader"
      | "veterinarian"
      | "admin"
      | "inspector"
      | "",
    location: "",
    specialization: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    { value: "farmer", label: "Farmer", labelArabic: "فلاح" },
    { value: "agronomist", label: "Agronomist", labelArabic: "خبير زراعي" },
    { value: "trader", label: "Trader", labelArabic: "تاجر" },
    { value: "veterinarian", label: "Veterinarian", labelArabic: "طبيب بيطري" },
    { value: "inspector", label: "Field Inspector", labelArabic: "مراقب حقول" },
  ];

  const governorateOptions = [
    { value: "tunis", label: "Tunis", labelArabic: "تونس" },
    { value: "ariana", label: "Ariana", labelArabic: "أريانة" },
    { value: "ben_arous", label: "Ben Arous", labelArabic: "بن عروس" },
    { value: "manouba", label: "Manouba", labelArabic: "منوبة" },
    { value: "nabeul", label: "Nabeul", labelArabic: "نابل" },
    { value: "zaghouan", label: "Zaghouan", labelArabic: "زغوان" },
    { value: "bizerte", label: "Bizerte", labelArabic: "بنزرت" },
    { value: "beja", label: "Beja", labelArabic: "باجة" },
    { value: "jendouba", label: "Jendouba", labelArabic: "جندوبة" },
    { value: "le_kef", label: "Le Kef", labelArabic: "الكاف" },
    { value: "siliana", label: "Siliana", labelArabic: "سليانة" },
    { value: "sousse", label: "Sousse", labelArabic: "سوسة" },
    { value: "monastir", label: "Monastir", labelArabic: "المنستير" },
    { value: "mahdia", label: "Mahdia", labelArabic: "المهدية" },
    { value: "sfax", label: "Sfax", labelArabic: "صفاقس" },
    { value: "kairouan", label: "Kairouan", labelArabic: "القيروان" },
    { value: "kasserine", label: "Kasserine", labelArabic: "القصرين" },
    { value: "sidi_bouzid", label: "Sidi Bouzid", labelArabic: "سيدي بوزيد" },
    { value: "gabes", label: "Gabes", labelArabic: "قابس" },
    { value: "medenine", label: "Medenine", labelArabic: "مدنين" },
    { value: "tataouine", label: "Tataouine", labelArabic: "تطاوين" },
    { value: "gafsa", label: "Gafsa", labelArabic: "قفصة" },
    { value: "tozeur", label: "Tozeur", labelArabic: "توزر" },
    { value: "kebili", label: "Kebili", labelArabic: "قبلي" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email || !formData.password || !formData.full_name) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (formData.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (!formData.role) {
      setError("يرجى اختيار الدور المناسب");
      return;
    }

    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      setError("يرجى الموافقة على الشروط وسياسة الخصوصية");
      return;
    }

    try {
      // Prepare user data for Supabase
      const userData = {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
        location: formData.location,
        specialization: formData.specialization,
      };

      await signUp(formData.email, formData.password, userData);

      // Show success message and redirect
      alert("تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.");
      navigate("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(
        error.message.includes("already registered")
          ? "هذا البريد الإلكتروني مُسجل مسبقاً"
          : "فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى",
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-2 sm:p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg sm:max-w-2xl space-y-4 sm:space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            AgroGrowth
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            إنشاء حساب جديد في المنصة الزراعية
          </p>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-center">
              إنشاء حساب جديد
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-center">
              أدخل بياناتك لإنشاء حساب في المنصة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم بالإنجليزية *</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="pr-10 h-11 sm:h-10 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name_ar">الاسم بالعربية *</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="full_name_ar"
                      name="full_name_ar"
                      type="text"
                      value={formData.full_name_ar}
                      onChange={handleChange}
                      placeholder="الاسم الكامل"
                      className="pr-10 h-11 sm:h-10 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="أدخل بريدك الإلكتروني"
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+216 XX XXX XXX"
                      className="pr-10"
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور *</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="أدخل كلمة المرور"
                      className="pr-10 pl-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="أعد إدخال كلمة المرور"
                      className="pr-10 pl-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">الدور *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر دورك في المنصة" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.labelArabic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">الموقع</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("location", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      {governorateOptions.map((gov) => (
                        <SelectItem key={gov.value} value={gov.value}>
                          {gov.labelArabic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specialization */}
              <div className="space-y-2">
                <Label htmlFor="specialization">التخصص أو الخبرة</Label>
                <div className="relative">
                  <Building className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="مثال: زراعة الحبوب، تربية الماشية، الخضروات العضوية..."
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Terms and Privacy */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        acceptTerms: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    أوافق على{" "}
                    <Link
                      to="/terms"
                      className="text-green-600 hover:text-green-700"
                    >
                      شروط الاستخدام
                    </Link>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        acceptPrivacy: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="acceptPrivacy" className="text-sm">
                    أوافق على{" "}
                    <Link
                      to="/privacy"
                      className="text-green-600 hover:text-green-700"
                    >
                      سياسة الخصوصية
                    </Link>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                لديك حساب بالفعل؟{" "}
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
