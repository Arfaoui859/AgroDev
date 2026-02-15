import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageCircle,
  Phone,
  Video,
  Users,
  Star,
  Search,
  Send,
  Paperclip,
  Image,
  Mic,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Plus,
  Filter,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  DollarSign,
  Leaf,
  Settings,
  Bell,
  Shield,
  Verified,
  Heart,
  ThumbsUp,
  MessageSquare,
  FileText,
  Download,
  Upload,
  Camera,
  Volume2,
  Smile,
  MoreHorizontal,
  Edit,
  Trash,
  Share,
  BookmarkPlus,
  Flag,
  Eye,
} from "lucide-react";

interface Expert {
  id: string;
  name: string;
  nameArabic: string;
  title: string;
  titleArabic: string;
  specialization: string;
  specializationArabic: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  location: string;
  locationArabic: string;
  languages: string[];
  languagesArabic: string[];
  status: "online" | "busy" | "offline";
  responseTime: number; // minutes
  consultationFee: number;
  currency: string;
  verified: boolean;
  lastActive: string;
  expertise: string[];
  expertiseArabic: string[];
  avatar?: string;
  bio: string;
  bioArabic: string;
  education: string[];
  certifications: string[];
  successfulConsultations: number;
}

interface Trader {
  id: string;
  name: string;
  nameArabic: string;
  companyName: string;
  companyNameArabic: string;
  type: "supplier" | "buyer" | "both";
  location: string;
  locationArabic: string;
  rating: number;
  reviewCount: number;
  status: "online" | "busy" | "offline";
  productsServices: string[];
  productsServicesArabic: string[];
  verified: boolean;
  lastActive: string;
  avatar?: string;
  bio: string;
  bioArabic: string;
  dealCount: number;
  businessSince: string;
  paymentMethods: string[];
  deliveryOptions: string[];
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type:
    | "text"
    | "image"
    | "file"
    | "voice"
    | "video_call"
    | "consultation_request";
  status: "sent" | "delivered" | "read";
  attachments?: {
    type: "image" | "file" | "audio";
    url: string;
    name: string;
    size: number;
  }[];
  replyTo?: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantNameArabic: string;
  participantType: "expert" | "trader";
  participantAvatar?: string;
  lastMessage: Message;
  unreadCount: number;
  isActive: boolean;
  pinned: boolean;
  tags: string[];
}

interface CommunicationHubProps {
  isArabic?: boolean;
  currentUserId?: string;
  onStartConsultation?: (expertId: string, consultationType: string) => void;
  onInitiateTrade?: (traderId: string, tradeType: string) => void;
}

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  isArabic = false,
  currentUserId = "farmer_001",
  onStartConsultation,
  onInitiateTrade,
}) => {
  const [activeTab, setActiveTab] = useState("experts");
  const [experts, setExperts] = useState<Expert[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [showChatDialog, setShowChatDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data
  const mockExperts: Expert[] = [
    {
      id: "expert_001",
      name: "Dr. Ahmed Ben Salem",
      nameArabic: "د. أحمد بن سالم",
      title: "Senior Agricultural Engineer",
      titleArabic: "مهندس زراعي أول",
      specialization: "Crop Diseases & Plant Pathology",
      specializationArabic: "أمراض المحاصيل وعلم أمراض النبات",
      rating: 4.9,
      reviewCount: 342,
      experienceYears: 15,
      location: "Tunis, Tunisia",
      locationArabic: "تونس، تونس",
      languages: ["Arabic", "French", "English"],
      languagesArabic: ["العربية", "الفرنسية", "الإنجليزية"],
      status: "online",
      responseTime: 5,
      consultationFee: 25,
      currency: "TND",
      verified: true,
      lastActive: new Date().toISOString(),
      expertise: [
        "Disease Diagnosis",
        "Organic Farming",
        "Integrated Pest Management",
        "Soil Health",
      ],
      expertiseArabic: [
        "تشخيص الأمراض",
        "الزراعة العضوية",
        "الإدارة المتكاملة للآفات",
        "صحة التربة",
      ],
      bio: "Specialized in plant pathology with 15+ years experience helping farmers across Tunisia.",
      bioArabic:
        "متخصص في علم أمراض النبات مع أكثر من 15 سنة خبرة في مساعدة المزارعين عبر تونس.",
      education: [
        "PhD Plant Pathology - University of Tunis",
        "MSc Agricultural Engineering",
      ],
      certifications: [
        "Certified Plant Pathologist",
        "Organic Farming Specialist",
      ],
      successfulConsultations: 1247,
    },
    {
      id: "expert_002",
      name: "Dr. Fatma Karoui",
      nameArabic: "د. فاطمة الكروي",
      title: "Irrigation Specialist",
      titleArabic: "أخصائية الري",
      specialization: "Water Management & Precision Agriculture",
      specializationArabic: "إدارة المياه والزراعة الدقيقة",
      rating: 4.8,
      reviewCount: 298,
      experienceYears: 12,
      location: "Sfax, Tunisia",
      locationArabic: "صفاقس، تونس",
      languages: ["Arabic", "French"],
      languagesArabic: ["العربية", "الفرنسية"],
      status: "busy",
      responseTime: 15,
      consultationFee: 30,
      currency: "TND",
      verified: true,
      lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expertise: [
        "Smart Irrigation",
        "Water Conservation",
        "Drip Systems",
        "Hydroponics",
      ],
      expertiseArabic: [
        "الري الذكي",
        "توفير المياه",
        "أنظمة التنقيط",
        "الزراعة المائية",
      ],
      bio: "Expert in modern irrigation techniques and water-efficient farming systems.",
      bioArabic: "خبيرة في تقنيات الري الحديثة وأنظمة الزراعة الموفرة للمياه.",
      education: [
        "PhD Agricultural Engineering",
        "MSc Water Resources Management",
      ],
      certifications: [
        "Certified Irrigation Designer",
        "Water Efficiency Specialist",
      ],
      successfulConsultations: 892,
    },
    {
      id: "expert_003",
      name: "Prof. Mohamed Trabelsi",
      nameArabic: "أ. محمد الطرابلسي",
      title: "Agricultural Economist",
      titleArabic: "اقتصادي زراعي",
      specialization: "Farm Economics & Market Analysis",
      specializationArabic: "اقتصاد المزرعة وتحليل السوق",
      rating: 4.7,
      reviewCount: 156,
      experienceYears: 20,
      location: "Sousse, Tunisia",
      locationArabic: "سوسة، تونس",
      languages: ["Arabic", "French", "English"],
      languagesArabic: ["العربية", "الفرنسية", "الإنجليزية"],
      status: "online",
      responseTime: 10,
      consultationFee: 35,
      currency: "TND",
      verified: true,
      lastActive: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      expertise: [
        "Financial Planning",
        "Crop Insurance",
        "Market Trends",
        "Investment Analysis",
      ],
      expertiseArabic: [
        "التخطي�� المالي",
        "تأمين المحاصيل",
        "اتجاهات السوق",
        "تحليل الاستثمار",
      ],
      bio: "Professor of Agricultural Economics with expertise in farm profitability and market strategies.",
      bioArabic:
        "أستاذ الاقتصاد الزراعي مع خبرة في ربحية المزارع واستراتيجيات السوق.",
      education: ["PhD Agricultural Economics", "MBA Finance"],
      certifications: [
        "Agricultural Financial Advisor",
        "Market Analysis Expert",
      ],
      successfulConsultations: 634,
    },
  ];

  const mockTraders: Trader[] = [
    {
      id: "trader_001",
      name: "Ali Ben Jemaa",
      nameArabic: "علي بن جمعة",
      companyName: "AgroSupply Tunisia",
      companyNameArabic: "أجرو سبلاي تونس",
      type: "supplier",
      location: "Tunis, Tunisia",
      locationArabic: "تونس، تونس",
      rating: 4.6,
      reviewCount: 89,
      status: "online",
      productsServices: [
        "Seeds",
        "Fertilizers",
        "Pesticides",
        "Farm Equipment",
      ],
      productsServicesArabic: [
        "البذور",
        "الأسمدة",
        "��لمبيدات",
        "معدات المزرعة",
      ],
      verified: true,
      lastActive: new Date().toISOString(),
      bio: "Leading supplier of quality agricultural inputs in Tunisia. 10+ years in business.",
      bioArabic:
        "مورد رائد لمدخلات زراعية عالية الجودة في تونس. أكثر من 10 سنوات في العمل.",
      dealCount: 456,
      businessSince: "2014",
      paymentMethods: ["Cash", "Bank Transfer", "Credit"],
      deliveryOptions: ["Pickup", "Delivery", "Express"],
    },
    {
      id: "trader_002",
      name: "Leila Mansouri",
      nameArabic: "ليلى المنصوري",
      companyName: "Fresh Harvest Co.",
      companyNameArabic: "شركة الحصاد الطازج",
      type: "buyer",
      location: "Sousse, Tunisia",
      locationArabic: "سوسة، تونس",
      rating: 4.8,
      reviewCount: 127,
      status: "busy",
      productsServices: ["Fruits", "Vegetables", "Olive Oil", "Grains"],
      productsServicesArabic: ["الفواكه", "الخضروات", "زيت الزيتون", "الحبوب"],
      verified: true,
      lastActive: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      bio: "Wholesale buyer of fresh produce for export and local distribution.",
      bioArabic: "مشتري بالجملة لل��نتجات الطازجة للتصدير والتوزيع المحلي.",
      dealCount: 312,
      businessSince: "2016",
      paymentMethods: ["Bank Transfer", "LC", "Cash"],
      deliveryOptions: ["Pickup", "Arranged Transport"],
    },
  ];

  const mockConversations: Conversation[] = [
    {
      id: "conv_001",
      participantId: "expert_001",
      participantName: "Dr. Ahmed Ben Salem",
      participantNameArabic: "د. أحمد بن سالم",
      participantType: "expert",
      lastMessage: {
        id: "msg_001",
        senderId: "expert_001",
        receiverId: "farmer_001",
        content:
          "I recommend applying copper-based fungicide for your tomato early blight issue.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: "text",
        status: "delivered",
      },
      unreadCount: 2,
      isActive: true,
      pinned: true,
      tags: ["disease", "tomatoes"],
    },
    {
      id: "conv_002",
      participantId: "trader_001",
      participantName: "Ali Ben Jemaa",
      participantNameArabic: "علي بن جمعة",
      participantType: "trader",
      lastMessage: {
        id: "msg_002",
        senderId: "farmer_001",
        receiverId: "trader_001",
        content: "Do you have organic fertilizer available for 5 hectares?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "text",
        status: "read",
      },
      unreadCount: 0,
      isActive: false,
      pinned: false,
      tags: ["fertilizer", "organic"],
    },
  ];

  useEffect(() => {
    setExperts(mockExperts);
    setTraders(mockTraders);
    setConversations(mockConversations);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      receiverId: activeConversation.participantId,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
      status: "sent",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Update conversation
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation.id
          ? { ...conv, lastMessage: message }
          : conv,
      ),
    );
  };

  const handleStartChat = (
    participant: Expert | Trader,
    type: "expert" | "trader",
  ) => {
    const conversation: Conversation = {
      id: `conv_new_${Date.now()}`,
      participantId: participant.id,
      participantName: participant.name,
      participantNameArabic: participant.nameArabic,
      participantType: type,
      participantAvatar: participant.avatar,
      lastMessage: {
        id: "initial",
        senderId: currentUserId,
        receiverId: participant.id,
        content: isArabic ? "مرحباً" : "Hello",
        timestamp: new Date().toISOString(),
        type: "text",
        status: "sent",
      },
      unreadCount: 0,
      isActive: false,
      pinned: false,
      tags: [],
    };

    setConversations((prev) => [conversation, ...prev]);
    setActiveConversation(conversation);
    setMessages([]);
    setShowChatDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatLastActive = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return isArabic ? "نشط الآن" : "Active now";
    if (diffInMinutes < 60)
      return isArabic ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return isArabic ? `منذ ${diffInHours} ساعة` : `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return isArabic ? `منذ ${diffInDays} يوم` : `${diffInDays}d ago`;
  };

  const filteredExperts = experts.filter((expert) => {
    const matchesSearch =
      expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.nameArabic.includes(searchQuery) ||
      expert.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.specializationArabic.includes(searchQuery);

    const matchesSpecialization =
      !filterSpecialization ||
      filterSpecialization === "all" ||
      expert.expertise.some((exp) =>
        exp.toLowerCase().includes(filterSpecialization.toLowerCase()),
      );

    return matchesSearch && matchesSpecialization;
  });

  const filteredTraders = traders.filter((trader) => {
    const matchesSearch =
      trader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trader.nameArabic.includes(searchQuery) ||
      trader.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trader.companyNameArabic.includes(searchQuery);

    return matchesSearch;
  });

  return (
    <div className={`space-y-6 ${isArabic ? "rtl" : "ltr"}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>
              {isArabic
                ? "مركز التواصل الزراعي"
                : "Agricultural Communication Hub"}
            </span>
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "تواصل مع الخبراء الزراعيين والتجار المتخصصين"
              : "Connect with agricultural experts and specialized traders"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="experts">
                {isArabic ? "الخبراء" : "Experts"}
              </TabsTrigger>
              <TabsTrigger value="traders">
                {isArabic ? "التجار" : "Traders"}
              </TabsTrigger>
              <TabsTrigger value="conversations">
                {isArabic ? "المحادثات" : "Conversations"}
              </TabsTrigger>
              <TabsTrigger value="consultations">
                {isArabic ? "الاستشارات" : "Consultations"}
              </TabsTrigger>
            </TabsList>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={isArabic ? "ا��بحث..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {activeTab === "experts" && (
                <Select
                  value={filterSpecialization}
                  onValueChange={setFilterSpecialization}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue
                      placeholder={isArabic ? "التخصص" : "Specialization"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {isArabic ? "جميع التخصصات" : "All Specializations"}
                    </SelectItem>
                    <SelectItem value="disease">
                      {isArabic ? "أمراض النبات" : "Plant Diseases"}
                    </SelectItem>
                    <SelectItem value="irrigation">
                      {isArabic ? "الري" : "Irrigation"}
                    </SelectItem>
                    <SelectItem value="economics">
                      {isArabic ? "الاقتصاد الزراعي" : "Agricultural Economics"}
                    </SelectItem>
                    <SelectItem value="organic">
                      {isArabic ? "الزراعة العضوية" : "Organic Farming"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Experts Tab */}
            <TabsContent value="experts" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExperts.map((expert) => (
                  <Card
                    key={expert.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={expert.avatar} />
                            <AvatarFallback>
                              {expert.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(expert.status)}`}
                          />
                          {expert.verified && (
                            <Verified className="absolute -top-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {isArabic ? expert.nameArabic : expert.name}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            {isArabic ? expert.titleArabic : expert.title}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">
                              {expert.rating} ({expert.reviewCount})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="text-xs text-gray-600">
                          {isArabic
                            ? expert.specializationArabic
                            : expert.specialization}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {isArabic ? expert.locationArabic : expert.location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {isArabic
                              ? `يرد خلال ${expert.responseTime} دقيقة`
                              : `Responds in ${expert.responseTime}m`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">
                            {expert.consultationFee} {expert.currency}
                          </span>
                          <span className="text-gray-500">
                            {isArabic ? "/استشارة" : "/consultation"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(isArabic ? expert.expertiseArabic : expert.expertise)
                          .slice(0, 2)
                          .map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        {expert.expertise.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{expert.expertise.length - 2}
                          </Badge>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStartChat(expert, "expert")}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {isArabic ? "محادثة" : "Chat"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedExpert(expert)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={expert.avatar} />
                                  <AvatarFallback>
                                    {expert.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span>
                                  {isArabic ? expert.nameArabic : expert.name}
                                </span>
                                {expert.verified && (
                                  <Verified className="h-4 w-4 text-blue-500" />
                                )}
                              </DialogTitle>
                              <DialogDescription>
                                {isArabic ? expert.titleArabic : expert.title}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">
                                  {isArabic ? "النبذة" : "Bio"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {isArabic ? expert.bioArabic : expert.bio}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">
                                  {isArabic ? "الخبرة" : "Experience"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {expert.experienceYears}{" "}
                                  {isArabic ? "سنة" : "years"}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">
                                  {isArabic
                                    ? "الاستشارات الناجحة"
                                    : "Successful Consultations"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {expert.successfulConsultations}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  className="flex-1"
                                  onClick={() => {
                                    handleStartChat(expert, "expert");
                                    setSelectedExpert(null);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  {isArabic ? "بدء محادثة" : "Start Chat"}
                                </Button>
                                <Button variant="outline" className="flex-1">
                                  <Video className="h-4 w-4 mr-2" />
                                  {isArabic ? "استشارة مرئية" : "Video Call"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Traders Tab */}
            <TabsContent value="traders" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTraders.map((trader) => (
                  <Card
                    key={trader.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={trader.avatar} />
                            <AvatarFallback>
                              {trader.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(trader.status)}`}
                          />
                          {trader.verified && (
                            <Shield className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {isArabic ? trader.nameArabic : trader.name}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            {isArabic
                              ? trader.companyNameArabic
                              : trader.companyName}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">
                              {trader.rating} ({trader.reviewCount})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <Badge
                          variant={
                            trader.type === "supplier"
                              ? "default"
                              : trader.type === "buyer"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {trader.type === "supplier"
                            ? isArabic
                              ? "مورد"
                              : "Supplier"
                            : trader.type === "buyer"
                              ? isArabic
                                ? "مشتري"
                                : "Buyer"
                              : isArabic
                                ? "مورد ومشتري"
                                : "Both"}
                        </Badge>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {isArabic ? trader.locationArabic : trader.location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <TrendingUp className="h-3 w-3" />
                          <span>
                            {trader.dealCount} {isArabic ? "صفقة" : "deals"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(isArabic
                          ? trader.productsServicesArabic
                          : trader.productsServices
                        )
                          .slice(0, 2)
                          .map((product, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {product}
                            </Badge>
                          ))}
                        {trader.productsServices.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{trader.productsServices.length - 2}
                          </Badge>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStartChat(trader, "trader")}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {isArabic ? "محادثة" : "Chat"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTrader(trader)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={trader.avatar} />
                                  <AvatarFallback>
                                    {trader.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span>
                                  {isArabic ? trader.nameArabic : trader.name}
                                </span>
                                {trader.verified && (
                                  <Shield className="h-4 w-4 text-green-500" />
                                )}
                              </DialogTitle>
                              <DialogDescription>
                                {isArabic
                                  ? trader.companyNameArabic
                                  : trader.companyName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">
                                  {isArabic ? "النبذة" : "Bio"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {isArabic ? trader.bioArabic : trader.bio}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">
                                  {isArabic
                                    ? "المنتجات والخدمات"
                                    : "Products & Services"}
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {(isArabic
                                    ? trader.productsServicesArabic
                                    : trader.productsServices
                                  ).map((product, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {product}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  className="flex-1"
                                  onClick={() => {
                                    handleStartChat(trader, "trader");
                                    setSelectedTrader(null);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  {isArabic ? "بدء محادثة" : "Start Chat"}
                                </Button>
                                <Button variant="outline" className="flex-1">
                                  <Phone className="h-4 w-4 mr-2" />
                                  {isArabic ? "اتصال" : "Call"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-96">
                {/* Conversation List */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {isArabic ? "المحادثات" : "Conversations"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-80">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b ${
                            activeConversation?.id === conversation.id
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => setActiveConversation(conversation)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={conversation.participantAvatar}
                              />
                              <AvatarFallback>
                                {conversation.participantName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">
                                  {isArabic
                                    ? conversation.participantNameArabic
                                    : conversation.participantName}
                                </h4>
                                {conversation.unreadCount > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {conversation.lastMessage.content}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatLastActive(
                                  conversation.lastMessage.timestamp,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2">
                  {activeConversation ? (
                    <>
                      <CardHeader className="pb-3 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={activeConversation.participantAvatar}
                              />
                              <AvatarFallback>
                                {activeConversation.participantName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-sm">
                                {isArabic
                                  ? activeConversation.participantNameArabic
                                  : activeConversation.participantName}
                              </h3>
                              <p className="text-xs text-gray-600">
                                {activeConversation.participantType === "expert"
                                  ? isArabic
                                    ? "خبير زراعي"
                                    : "Agricultural Expert"
                                  : isArabic
                                    ? "تاجر"
                                    : "Trader"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Video className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-64 p-4">
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                    message.senderId === currentUserId
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      message.senderId === currentUserId
                                        ? "text-blue-100"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {new Date(
                                      message.timestamp,
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        </ScrollArea>
                        <div className="p-4 border-t">
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder={
                                isArabic ? "اكتب رسالة..." : "Type a message..."
                              }
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleSendMessage()
                              }
                              className="flex-1"
                            />
                            <Button variant="ghost" size="sm">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Smile className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleSendMessage} size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex items-center justify-center h-80">
                      <div className="text-center text-gray-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>
                          {isArabic
                            ? "اختر محادثة للبدء"
                            : "Select a conversation to start"}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Consultations Tab */}
            <TabsContent value="consultations" className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  {isArabic
                    ? "جدولة الاستشارات والمتابعة"
                    : "Schedule consultations and follow-ups"}
                </AlertDescription>
              </Alert>
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  {isArabic
                    ? "لا توجد استشارات مجدولة"
                    : "No scheduled consultations"}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {isArabic ? "جدولة استشارة" : "Schedule Consultation"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chat Dialog for Mobile */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-md h-96">
          <DialogHeader>
            <DialogTitle>
              {activeConversation &&
                (isArabic
                  ? activeConversation.participantNameArabic
                  : activeConversation.participantName)}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.senderId === currentUserId
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === currentUserId
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder={isArabic ? "اكتب رسالة..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationHub;
