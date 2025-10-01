import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Users,
  BookOpen,
  Video,
  Phone,
  Star,
  Send,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  UserCheck,
  Lightbulb,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Reply,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  nameArabic: string;
  userType: string;
  userTypeArabic: string;
  profileImage?: string;
  rating: number;
  reviewCount: number;
  specializations: string[];
  specializationsArabic: string[];
  location: string;
  locationArabic: string;
  experience: number;
  verified: boolean;
  online: boolean;
  lastSeen: string;
}

interface ChatRoom {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  type: string;
  participants: string[];
  lastActivity: string;
  category: string;
  categoryArabic: string;
  messageCount: number;
  active: boolean;
}

interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  messageType: string;
  timestamp: string;
  user?: User;
  reactions: Array<{
    userId: string;
    emoji: string;
    timestamp: string;
  }>;
  replyTo?: string;
}

interface Consultation {
  id: string;
  farmerId: string;
  expertId?: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  category: string;
  categoryArabic: string;
  urgency: string;
  status: string;
  images: string[];
  tags: string[];
  createdAt: string;
  sessionType: string;
  farmer?: User;
  expert?: User;
  responses: Array<{
    id: string;
    expertId: string;
    response: string;
    responseArabic: string;
    timestamp: string;
    helpful: number;
    expert?: User;
  }>;
  rating?: {
    score: number;
    review: string;
    reviewArabic: string;
  };
}

interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  titleArabic: string;
  content: string;
  contentArabic: string;
  category: string;
  categoryArabic: string;
  tags: string[];
  pinned: boolean;
  views: number;
  likes: number;
  dislikes: number;
  replyCount: number;
  lastReplyAt?: string;
  createdAt: string;
  featured: boolean;
  author?: User;
}

const FarmerCollaboration = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [onlineExperts, setOnlineExperts] = useState<User[]>([]);
  const [collaborationStats, setCollaborationStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    urgency: "",
  });
  const [newConsultation, setNewConsultation] = useState({
    title: "",
    titleArabic: "",
    description: "",
    descriptionArabic: "",
    category: "",
    urgency: "medium",
    sessionType: "chat",
  });
  const [newPost, setNewPost] = useState({
    title: "",
    titleArabic: "",
    content: "",
    contentArabic: "",
    category: "",
    tags: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch chat rooms
      const roomsResponse = await fetch(
        "/api/collaboration/chat-rooms?userId=user_farmer_1",
      );
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setChatRooms(roomsData.data);
        if (roomsData.data.length > 0) {
          setSelectedRoom(roomsData.data[0]);
          await fetchRoomMessages(roomsData.data[0].id);
        }
      }

      // Fetch consultations
      const consultationsResponse = await fetch(
        "/api/collaboration/consultations?userId=user_farmer_1&userType=farmer",
      );
      if (consultationsResponse.ok) {
        const consultationsData = await consultationsResponse.json();
        setConsultations(consultationsData.data);
      }

      // Fetch forum posts
      const postsResponse = await fetch(
        "/api/collaboration/forum/posts?limit=15",
      );
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setForumPosts(postsData.data.posts);
      }

      // Fetch online experts
      const expertsResponse = await fetch("/api/collaboration/experts/online");
      if (expertsResponse.ok) {
        const expertsData = await expertsResponse.json();
        setOnlineExperts(expertsData.data);
      }

      // Fetch collaboration stats
      const statsResponse = await fetch("/api/collaboration/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCollaborationStats(statsData.data);
      }
    } catch (error) {
      console.error("Error fetching collaboration data:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات التعاون",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomMessages = async (roomId: string) => {
    try {
      const response = await fetch(
        `/api/collaboration/rooms/${roomId}/messages`,
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.reverse()); // Reverse to show chronological order
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const response = await fetch("/api/collaboration/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          userId: "user_farmer_1",
          content: newMessage,
          messageType: "text",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    }
  };

  const createConsultation = async () => {
    if (
      !newConsultation.title ||
      !newConsultation.description ||
      !newConsultation.category
    ) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/collaboration/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmerId: "user_farmer_1",
          ...newConsultation,
          tags: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConsultations((prev) => [data.data, ...prev]);
        setNewConsultation({
          title: "",
          titleArabic: "",
          description: "",
          descriptionArabic: "",
          category: "",
          urgency: "medium",
          sessionType: "chat",
        });

        toast({
          title: "تم بنجاح!",
          description: "تم إنشاء طلب الاستشارة",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الاستشارة",
        variant: "destructive",
      });
    }
  };

  const createForumPost = async () => {
    if (!newPost.title || !newPost.content || !newPost.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/collaboration/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorId: "user_farmer_1",
          ...newPost,
          tags: newPost.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setForumPosts((prev) => [data.data, ...prev]);
        setNewPost({
          title: "",
          titleArabic: "",
          content: "",
          contentArabic: "",
          category: "",
          tags: "",
        });

        toast({
          title: "تم بنجاح!",
          description: "تم نشر المقال في المنتدى",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في نشر المقال",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "مفتوح";
      case "assigned":
        return "مخصص";
      case "in_progress":
        return "قيد التنفيذ";
      case "completed":
        return "مكتمل";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-orange-600";
      case "emergency":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "low":
        return "منخفض";
      case "medium":
        return "متوسط";
      case "high":
        return "عالي";
      case "emergency":
        return "طارئ";
      default:
        return urgency;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          👥 مركز التعاون الزراعي
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          تواصل مع الخبراء، شارك التجارب، واحصل على الاستشارات من المختصين في
          المجتمع الزراعي
        </p>
      </div>

      {/* Stats Overview */}
      {collaborationStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    المستخدمون النشطون
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {collaborationStats.users.online}/
                    {collaborationStats.users.total}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    الخبراء المتاحون
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {collaborationStats.users.verifiedExperts}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    الاستشارات النشطة
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {collaborationStats.consultations.active}
                  </p>
                </div>
                <HelpCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    مقالات المنتدى
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {collaborationStats.forum.totalPosts}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">المحادثات</TabsTrigger>
          <TabsTrigger value="consultations">الاستشارات</TabsTrigger>
          <TabsTrigger value="forum">المنتدى</TabsTrigger>
          <TabsTrigger value="experts">الخبراء</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chat Rooms List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  غرف ال��حادثة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoom?.id === room.id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedRoom(room);
                      fetchRoomMessages(room.id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{room.nameArabic}</h4>
                      <Badge variant="outline" className="text-xs">
                        {room.categoryArabic}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {room.descriptionArabic}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{room.messageCount} رسالة</span>
                      <span>{room.participants.length} عضو</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedRoom?.nameArabic || "اختر غرفة محادثة"}</span>
                  {selectedRoom && (
                    <Badge variant="outline">
                      {selectedRoom.participants.length} عضو
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRoom ? (
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto space-y-3 p-4 border rounded-lg bg-gray-50">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.userId === "user_farmer_1"
                              ? "flex-row-reverse"
                              : ""
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-500 text-white text-xs">
                              {message.user?.nameArabic?.charAt(0) || "ج"}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex-1 ${message.userId === "user_farmer_1" ? "text-right" : ""}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {message.user?.nameArabic}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.timestamp).toLocaleTimeString(
                                  "ar-SA",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            <div
                              className={`p-3 rounded-lg max-w-xs ${
                                message.userId === "user_farmer_1"
                                  ? "bg-blue-500 text-white ml-auto"
                                  : "bg-white border"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            {message.reactions.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {message.reactions.map((reaction, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-gray-200 rounded px-1"
                                  >
                                    {reaction.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>اختر غرفة محادثة للبدء</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consultations Tab */}
        <TabsContent value="consultations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">الاستشارات الزراعية</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  طلب استشارة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>طلب استشارة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">العنوان</label>
                    <Input
                      value={newConsultation.title}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          title: e.target.value,
                        })
                      }
                      placeholder="عنوان المشكلة"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">الوصف</label>
                    <Textarea
                      value={newConsultation.description}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          description: e.target.value,
                        })
                      }
                      placeholder="وصف تفصيلي للمشكلة"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">التصنيف</label>
                    <Select
                      value={newConsultation.category}
                      onValueChange={(value) =>
                        setNewConsultation({
                          ...newConsultation,
                          category: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plant_disease">
                          أمراض النبات
                        </SelectItem>
                        <SelectItem value="soil_issues">
                          مشاكل التربة
                        </SelectItem>
                        <SelectItem value="irrigation">الري</SelectItem>
                        <SelectItem value="fertilization">التسميد</SelectItem>
                        <SelectItem value="pest_control">
                          مكافحة الآفات
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">الأولوية</label>
                    <Select
                      value={newConsultation.urgency}
                      onValueChange={(value) =>
                        setNewConsultation({
                          ...newConsultation,
                          urgency: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                        <SelectItem value="emergency">طارئ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createConsultation} className="w-full">
                    إرسال طلب الاستشارة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {consultations.map((consultation) => (
              <Card key={consultation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {consultation.titleArabic}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {consultation.categoryArabic}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(consultation.status)}>
                        {getStatusLabel(consultation.status)}
                      </Badge>
                      <span
                        className={`text-sm font-medium ${getUrgencyColor(consultation.urgency)}`}
                      >
                        {getUrgencyLabel(consultation.urgency)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{consultation.descriptionArabic}</p>

                  {consultation.expert && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {consultation.expert.nameArabic.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {consultation.expert.nameArabic}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {consultation.expert.userTypeArabic}
                        </p>
                      </div>
                    </div>
                  )}

                  {consultation.responses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">الردود:</h4>
                      {consultation.responses.map((response) => (
                        <div
                          key={response.id}
                          className="p-3 bg-blue-50 rounded-lg"
                        >
                          <p className="text-sm">{response.responseArabic}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {response.expert?.nameArabic}
                            </span>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              <span className="text-xs">
                                {response.helpful}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {consultation.rating && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < consultation.rating!.score
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {consultation.rating.score}/5
                        </span>
                      </div>
                      <p className="text-sm">
                        {consultation.rating.reviewArabic}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(consultation.createdAt).toLocaleDateString(
                        "ar-SA",
                      )}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {consultation.sessionType === "chat"
                          ? "محادثة"
                          : consultation.sessionType === "video_call"
                            ? "مكالمة فيديو"
                            : consultation.sessionType === "phone"
                              ? "مكالمة هاتفية"
                              : "زيارة ميدانية"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Forum Tab */}
        <TabsContent value="forum" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">منتدى المزارعين</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  نشر مقال جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>نشر مقال جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">العنوان</label>
                    <Input
                      value={newPost.title}
                      onChange={(e) =>
                        setNewPost({ ...newPost, title: e.target.value })
                      }
                      placeholder="عنوان المقال"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">المحتوى</label>
                    <Textarea
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost({ ...newPost, content: e.target.value })
                      }
                      placeholder="محتوى المقال"
                      rows={6}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">التصنيف</label>
                    <Select
                      value={newPost.category}
                      onValueChange={(value) =>
                        setNewPost({ ...newPost, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tips_and_guides">
                          نصائح وأدلة
                        </SelectItem>
                        <SelectItem value="plant_disease">
                          أمراض النبات
                        </SelectItem>
                        <SelectItem value="success_stories">
                          قصص نجاح
                        </SelectItem>
                        <SelectItem value="questions">أسئلة</SelectItem>
                        <SelectItem value="market_news">أخبار السوق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      العلامات (مفصولة بفواصل)
                    </label>
                    <Input
                      value={newPost.tags}
                      onChange={(e) =>
                        setNewPost({ ...newPost, tags: e.target.value })
                      }
                      placeholder="مثال: قمح, زراعة, نصائح"
                    />
                  </div>
                  <Button onClick={createForumPost} className="w-full">
                    نشر المقال
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {forumPosts.map((post) => (
              <Card
                key={post.id}
                className={
                  post.featured ? "border-yellow-200 bg-yellow-50" : ""
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.pinned && <Badge variant="secondary">مثبت</Badge>}
                        {post.featured && (
                          <Badge
                            variant="outline"
                            className="border-yellow-400 text-yellow-700"
                          >
                            مميز
                          </Badge>
                        )}
                        <Badge variant="outline">{post.categoryArabic}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {post.titleArabic}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.contentArabic}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-green-500 text-white text-xs">
                            {post.author?.nameArabic?.charAt(0) || "ج"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {post.author?.nameArabic}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Reply className="h-4 w-4" />
                        {post.replyCount}
                      </span>
                    </div>
                  </div>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Experts Tab */}
        <TabsContent value="experts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">الخبراء المتاحون</h2>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {onlineExperts.length} خبير متاح الآن
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {onlineExperts.map((expert) => (
              <Card
                key={expert.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {expert.nameArabic.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {expert.online && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{expert.nameArabic}</h3>
                        {expert.verified && (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {expert.userTypeArabic}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(expert.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({expert.reviewCount} تقييم)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">التخصصات:</h4>
                      <div className="flex flex-wrap gap-1">
                        {expert.specializationsArabic
                          .slice(0, 3)
                          .map((spec, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                        {expert.specializationsArabic.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{expert.specializationsArabic.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {expert.locationArabic}
                      </span>
                      <span>{expert.experience} سنة خبرة</span>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 ml-2" />
                        محادثة
                      </Button>
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmerCollaboration;
