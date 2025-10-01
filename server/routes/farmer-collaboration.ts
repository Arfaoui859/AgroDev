import { Request, Response } from "express";

// Types for collaboration system
interface User {
  id: string;
  name: string;
  nameArabic: string;
  email: string;
  userType: "farmer" | "expert" | "agronomist" | "veterinarian" | "trader";
  userTypeArabic: string;
  profileImage?: string;
  rating: number; // 1-5 stars
  reviewCount: number;
  specializations: string[];
  specializationsArabic: string[];
  location: string;
  locationArabic: string;
  experience: number; // years
  verified: boolean;
  online: boolean;
  lastSeen: string;
  joinDate: string;
}

interface ChatRoom {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  type: "public" | "private" | "expert_consultation";
  participants: string[]; // user IDs
  createdBy: string;
  createdAt: string;
  lastActivity: string;
  category: string;
  categoryArabic: string;
  tags: string[];
  messageCount: number;
  active: boolean;
}

interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  contentArabic?: string;
  messageType: "text" | "image" | "file" | "voice" | "location";
  timestamp: string;
  edited: boolean;
  editedAt?: string;
  replyTo?: string; // message ID
  reactions: Array<{
    userId: string;
    emoji: string;
    timestamp: string;
  }>;
  attachments: Array<{
    url: string;
    type: string;
    size: number;
    name: string;
  }>;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
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
  urgency: "low" | "medium" | "high" | "emergency";
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  images: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    addressArabic: string;
  };
  tags: string[];
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  estimatedDuration: number; // minutes
  consultationFee?: number;
  currency?: string;
  sessionType: "chat" | "video_call" | "on_site" | "phone";
  responses: Array<{
    id: string;
    expertId: string;
    response: string;
    responseArabic: string;
    timestamp: string;
    helpful: number; // count of helpful votes
    attachments: string[];
  }>;
  rating?: {
    score: number;
    review: string;
    reviewArabic: string;
    timestamp: string;
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
  images: string[];
  pinned: boolean;
  locked: boolean;
  views: number;
  likes: number;
  dislikes: number;
  replyCount: number;
  lastReplyAt?: string;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  moderatorNotes?: string;
}

interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  contentArabic: string;
  parentReplyId?: string; // for nested replies
  images: string[];
  likes: number;
  dislikes: number;
  helpful: number;
  createdAt: string;
  edited: boolean;
  editedAt?: string;
  moderatorApproved: boolean;
}

interface ExpertProfile {
  userId: string;
  credentials: Array<{
    title: string;
    titleArabic: string;
    institution: string;
    institutionArabic: string;
    year: number;
    verified: boolean;
  }>;
  consultationRates: Array<{
    sessionType: string;
    rate: number;
    currency: string;
    duration: number; // minutes
  }>;
  availability: Array<{
    dayOfWeek: number; // 0-6
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    timezone: string;
  }>;
  languages: string[];
  languagesArabic: string[];
  successfulConsultations: number;
  totalEarnings: number;
  responseTime: number; // average in minutes
  clientSatisfaction: number; // percentage
}

// Mock data storage
let users: User[] = [
  {
    id: "user_farmer_1",
    name: "Ahmed Al-Mahmoud",
    nameArabic: "أحمد المحمود",
    email: "ahmed@example.com",
    userType: "farmer",
    userTypeArabic: "مزارع",
    rating: 4.5,
    reviewCount: 23,
    specializations: ["Wheat farming", "Olive cultivation"],
    specializationsArabic: ["زراعة القمح", "زراعة الزيتون"],
    location: "North Tunisia",
    locationArabic: "شمال تونس",
    experience: 15,
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user_expert_1",
    name: "Dr. Fatima Benali",
    nameArabic: "د. فاطمة بن علي",
    email: "fatima@example.com",
    userType: "expert",
    userTypeArabic: "خبير",
    rating: 4.9,
    reviewCount: 156,
    specializations: ["Plant pathology", "Soil science", "Crop management"],
    specializationsArabic: ["أمراض النبات", "علوم التربة", "إدارة المحاصيل"],
    location: "Tunis",
    locationArabic: "تونس",
    experience: 12,
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    joinDate: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user_agronomist_1",
    name: "Samir Khaled",
    nameArabic: "سمير خالد",
    email: "samir@example.com",
    userType: "agronomist",
    userTypeArabic: "مهندس زراعي",
    rating: 4.7,
    reviewCount: 89,
    specializations: ["Irrigation systems", "Fertilization", "Crop rotation"],
    specializationsArabic: ["أنظمة الري", "التسميد", "دوران المحاصيل"],
    location: "Central Tunisia",
    locationArabic: "وسط تونس",
    experience: 8,
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    joinDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let chatRooms: ChatRoom[] = [
  {
    id: "room_general",
    name: "General Discussion",
    nameArabic: "النقاش العام",
    description: "General farming discussions and community chat",
    descriptionArabic: "نقاشات الزراعة العامة والدردشة المجتمعية",
    type: "public",
    participants: ["user_farmer_1", "user_expert_1", "user_agronomist_1"],
    createdBy: "system",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date().toISOString(),
    category: "general",
    categoryArabic: "عام",
    tags: ["farming", "community", "help"],
    messageCount: 234,
    active: true,
  },
  {
    id: "room_wheat",
    name: "Wheat Farmers Group",
    nameArabic: "مجموعة مزارعي القمح",
    description: "Discussion group for wheat farmers",
    descriptionArabic: "مجموعة نقاش لمزارعي القمح",
    type: "public",
    participants: ["user_farmer_1"],
    createdBy: "user_farmer_1",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: "crops",
    categoryArabic: "المحاصيل",
    tags: ["wheat", "cereals", "tips"],
    messageCount: 87,
    active: true,
  },
];

let messages: Message[] = [
  {
    id: "msg_1",
    roomId: "room_general",
    userId: "user_farmer_1",
    content: "Hello everyone! I need advice on wheat irrigation timing.",
    contentArabic: "مرحباً بالجميع! أحتاج نصيحة حول توقيت ري القمح.",
    messageType: "text",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    edited: false,
    reactions: [
      {
        userId: "user_expert_1",
        emoji: "👍",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ],
    attachments: [],
    readBy: [
      {
        userId: "user_expert_1",
        readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: "user_agronomist_1",
        readAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "msg_2",
    roomId: "room_general",
    userId: "user_expert_1",
    content:
      "For wheat, irrigation timing depends on the growth stage. During tillering and grain filling stages, consistent moisture is crucial.",
    contentArabic:
      "بالنسبة للقمح، يع��مد توقيت الري على مرحلة النمو. خلال مراحل التفريع وامتلاء الحبوب، الرطوبة المستمرة ضرورية.",
    messageType: "text",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    edited: false,
    replyTo: "msg_1",
    reactions: [
      {
        userId: "user_farmer_1",
        emoji: "🙏",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        userId: "user_agronomist_1",
        emoji: "💯",
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
    ],
    attachments: [],
    readBy: [
      {
        userId: "user_farmer_1",
        readAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
  },
];

let consultations: Consultation[] = [
  {
    id: "consult_1",
    farmerId: "user_farmer_1",
    expertId: "user_expert_1",
    title: "Wheat leaf spots identification",
    titleArabic: "تحديد بقع أوراق القمح",
    description:
      "I noticed some brown spots on my wheat leaves. Can you help identify the issue?",
    descriptionArabic:
      "لاحظت بعض البقع البنية على أوراق القمح. هل يمكنك المساعدة في تحديد المشكلة؟",
    category: "plant_disease",
    categoryArabic: "أمراض النبات",
    urgency: "medium",
    status: "completed",
    images: ["/uploads/wheat_spots_1.jpg", "/uploads/wheat_spots_2.jpg"],
    location: {
      latitude: 36.8065,
      longitude: 10.1815,
      address: "Tunis, Tunisia",
      addressArabic: "تونس، تونس",
    },
    tags: ["wheat", "disease", "spots"],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedDuration: 30,
    consultationFee: 25,
    currency: "USD",
    sessionType: "chat",
    responses: [
      {
        id: "resp_1",
        expertId: "user_expert_1",
        response:
          "Based on the images, this appears to be septoria leaf blotch. I recommend applying a fungicide treatment.",
        responseArabic:
          "بناءً على الصور، يبدو أن هذا مرض تبقع الأوراق السبتوري. أنصح بتطبيق علاج مبيد فطري.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        helpful: 5,
        attachments: ["/uploads/treatment_guide.pdf"],
      },
    ],
    rating: {
      score: 5,
      review: "Excellent diagnosis and treatment recommendation. Very helpful!",
      reviewArabic: "تشخيص ممتاز وتوصية علاج مفيدة جداً!",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

let forumPosts: ForumPost[] = [
  {
    id: "post_1",
    authorId: "user_farmer_1",
    title: "Best practices for organic wheat farming",
    titleArabic: "أفضل الممارسات لزراعة القمح العضوي",
    content:
      "I want to share my experience with organic wheat farming. Here are some tips that have worked well for me...",
    contentArabic:
      "أريد مشاركة تجربتي في زراعة القمح العضوي. إليكم بعض النصائح التي نجحت معي...",
    category: "tips_and_guides",
    categoryArabic: "نصائح وأدلة",
    tags: ["organic", "wheat", "best_practices"],
    images: ["/uploads/organic_wheat_1.jpg"],
    pinned: false,
    locked: false,
    views: 245,
    likes: 34,
    dislikes: 2,
    replyCount: 12,
    lastReplyAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    featured: true,
    moderatorNotes: "High-quality content, featured by moderator",
  },
  {
    id: "post_2",
    authorId: "user_expert_1",
    title: "Common tomato diseases in Mediterranean climate",
    titleArabic: "أمراض الطماطم الشائعة في المناخ المتوسطي",
    content:
      "In Mediterranean climates like Tunisia, tomato plants face several common diseases. Here's a comprehensive guide...",
    contentArabic:
      "في المناخ المتوسطي مثل تونس، تواجه نباتات الطماطم عدة أمراض شائعة. إليكم دليل شامل...",
    category: "plant_disease",
    categoryArabic: "أمراض النبات",
    tags: ["tomato", "disease", "mediterranean", "guide"],
    images: ["/uploads/tomato_disease_guide.jpg"],
    pinned: true,
    locked: false,
    views: 567,
    likes: 89,
    dislikes: 3,
    replyCount: 28,
    lastReplyAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    featured: true,
    moderatorNotes: "Expert content, pinned for visibility",
  },
];

let forumReplies: ForumReply[] = [
  {
    id: "reply_1",
    postId: "post_1",
    authorId: "user_expert_1",
    content:
      "Excellent tips! I would also add that soil preparation is crucial for organic wheat. Testing soil pH and nutrients before planting makes a big difference.",
    contentArabic:
      "نصائح ممتازة! أود أيضاً أن أضيف أن إعداد التربة أمر بالغ الأهمية للقمح العضوي. فحص حموضة التربة والمغذيات قبل الزراعة يُحدث فرقاً كبيراً.",
    images: [],
    likes: 15,
    dislikes: 0,
    helpful: 8,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    edited: false,
    moderatorApproved: true,
  },
];

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getUserById(userId: string): User | undefined {
  return users.find((u) => u.id === userId);
}

// API Endpoints

export const getChatRooms = async (req: Request, res: Response) => {
  try {
    const { userId, type, category, search } = req.query;

    let filteredRooms = [...chatRooms];

    // Filter by user participation
    if (userId) {
      filteredRooms = filteredRooms.filter(
        (room) =>
          room.participants.includes(userId as string) ||
          room.type === "public",
      );
    }

    // Filter by type
    if (type) {
      filteredRooms = filteredRooms.filter((room) => room.type === type);
    }

    // Filter by category
    if (category) {
      filteredRooms = filteredRooms.filter(
        (room) => room.category === category,
      );
    }

    // Search filter
    if (search) {
      filteredRooms = filteredRooms.filter(
        (room) =>
          room.name.toLowerCase().includes((search as string).toLowerCase()) ||
          room.nameArabic.includes(search as string) ||
          room.description
            .toLowerCase()
            .includes((search as string).toLowerCase()) ||
          room.descriptionArabic.includes(search as string),
      );
    }

    // Sort by last activity
    filteredRooms.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
    );

    res.json({
      success: true,
      data: filteredRooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get chat rooms",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getRoomMessages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    let roomMessages = messages
      .filter((msg) => msg.roomId === roomId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(Number(offset), Number(offset) + Number(limit));

    // Add user information to messages
    const messagesWithUsers = roomMessages.map((msg) => ({
      ...msg,
      user: getUserById(msg.userId),
    }));

    res.json({
      success: true,
      data: messagesWithUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get room messages",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const {
      roomId,
      userId,
      content,
      messageType = "text",
      replyTo,
      attachments = [],
    } = req.body;

    if (!roomId || !userId || !content) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "roomId, userId, and content are required",
      });
    }

    const newMessage: Message = {
      id: `msg_${generateId()}`,
      roomId,
      userId,
      content,
      messageType,
      timestamp: new Date().toISOString(),
      edited: false,
      replyTo,
      reactions: [],
      attachments,
      readBy: [{ userId, readAt: new Date().toISOString() }],
    };

    messages.push(newMessage);

    // Update room last activity
    const room = chatRooms.find((r) => r.id === roomId);
    if (room) {
      room.lastActivity = new Date().toISOString();
      room.messageCount += 1;
    }

    // Add user information
    const messageWithUser = {
      ...newMessage,
      user: getUserById(userId),
    };

    res.json({
      success: true,
      data: messageWithUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to send message",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getConsultations = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      userType,
      status,
      category,
      urgency,
      limit = 20,
    } = req.query;

    let filteredConsultations = [...consultations];

    // Filter by user involvement
    if (userId) {
      if (userType === "farmer") {
        filteredConsultations = filteredConsultations.filter(
          (c) => c.farmerId === userId,
        );
      } else if (userType === "expert") {
        filteredConsultations = filteredConsultations.filter(
          (c) => c.expertId === userId || !c.expertId,
        );
      }
    }

    // Filter by status
    if (status) {
      filteredConsultations = filteredConsultations.filter(
        (c) => c.status === status,
      );
    }

    // Filter by category
    if (category) {
      filteredConsultations = filteredConsultations.filter(
        (c) => c.category === category,
      );
    }

    // Filter by urgency
    if (urgency) {
      filteredConsultations = filteredConsultations.filter(
        (c) => c.urgency === urgency,
      );
    }

    // Sort by creation date (newest first)
    filteredConsultations.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Limit results
    filteredConsultations = filteredConsultations.slice(0, Number(limit));

    // Add user information
    const consultationsWithUsers = filteredConsultations.map(
      (consultation) => ({
        ...consultation,
        farmer: getUserById(consultation.farmerId),
        expert: consultation.expertId
          ? getUserById(consultation.expertId)
          : null,
        responses: consultation.responses.map((response) => ({
          ...response,
          expert: getUserById(response.expertId),
        })),
      }),
    );

    res.json({
      success: true,
      data: consultationsWithUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get consultations",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createConsultation = async (req: Request, res: Response) => {
  try {
    const {
      farmerId,
      title,
      titleArabic,
      description,
      descriptionArabic,
      category,
      categoryArabic,
      urgency = "medium",
      images = [],
      location,
      tags = [],
      sessionType = "chat",
      estimatedDuration = 30,
    } = req.body;

    if (!farmerId || !title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "farmerId, title, description, and category are required",
      });
    }

    const newConsultation: Consultation = {
      id: `consult_${generateId()}`,
      farmerId,
      title,
      titleArabic: titleArabic || title,
      description,
      descriptionArabic: descriptionArabic || description,
      category,
      categoryArabic: categoryArabic || category,
      urgency,
      status: "open",
      images,
      location,
      tags,
      createdAt: new Date().toISOString(),
      estimatedDuration,
      sessionType,
      responses: [],
    };

    consultations.push(newConsultation);

    res.json({
      success: true,
      data: newConsultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create consultation",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getForumPosts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      featured,
      pinned,
      search,
      sortBy = "createdAt",
      order = "desc",
      limit = 20,
      offset = 0,
    } = req.query;

    let filteredPosts = [...forumPosts];

    // Apply filters
    if (category) {
      filteredPosts = filteredPosts.filter(
        (post) => post.category === category,
      );
    }

    if (featured === "true") {
      filteredPosts = filteredPosts.filter((post) => post.featured);
    }

    if (pinned === "true") {
      filteredPosts = filteredPosts.filter((post) => post.pinned);
    }

    if (search) {
      filteredPosts = filteredPosts.filter(
        (post) =>
          post.title.toLowerCase().includes((search as string).toLowerCase()) ||
          post.titleArabic.includes(search as string) ||
          post.content
            .toLowerCase()
            .includes((search as string).toLowerCase()) ||
          post.contentArabic.includes(search as string) ||
          post.tags.some((tag) =>
            tag.toLowerCase().includes((search as string).toLowerCase()),
          ),
      );
    }

    // Sort
    filteredPosts.sort((a, b) => {
      // Pinned posts always come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      const aValue = a[sortBy as keyof ForumPost];
      const bValue = b[sortBy as keyof ForumPost];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return order === "desc"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      return order === "desc"
        ? (bValue as number) - (aValue as number)
        : (aValue as number) - (bValue as number);
    });

    // Paginate
    const paginatedPosts = filteredPosts.slice(
      Number(offset),
      Number(offset) + Number(limit),
    );

    // Add author information
    const postsWithAuthors = paginatedPosts.map((post) => ({
      ...post,
      author: getUserById(post.authorId),
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithAuthors,
        total: filteredPosts.length,
        offset: Number(offset),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get forum posts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createForumPost = async (req: Request, res: Response) => {
  try {
    const {
      authorId,
      title,
      titleArabic,
      content,
      contentArabic,
      category,
      categoryArabic,
      tags = [],
      images = [],
    } = req.body;

    if (!authorId || !title || !content || !category) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "authorId, title, content, and category are required",
      });
    }

    const newPost: ForumPost = {
      id: `post_${generateId()}`,
      authorId,
      title,
      titleArabic: titleArabic || title,
      content,
      contentArabic: contentArabic || content,
      category,
      categoryArabic: categoryArabic || category,
      tags,
      images,
      pinned: false,
      locked: false,
      views: 0,
      likes: 0,
      dislikes: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      featured: false,
    };

    forumPosts.push(newPost);

    // Add author information
    const postWithAuthor = {
      ...newPost,
      author: getUserById(authorId),
    };

    res.json({
      success: true,
      data: postWithAuthor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create forum post",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPostReplies = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    let postReplies = forumReplies
      .filter((reply) => reply.postId === postId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .slice(Number(offset), Number(offset) + Number(limit));

    // Add author information
    const repliesWithAuthors = postReplies.map((reply) => ({
      ...reply,
      author: getUserById(reply.authorId),
    }));

    res.json({
      success: true,
      data: repliesWithAuthors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get post replies",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getOnlineExperts = async (req: Request, res: Response) => {
  try {
    const { specialization, limit = 10 } = req.query;

    let experts = users.filter(
      (user) => user.userType === "expert" && user.verified && user.online,
    );

    // Filter by specialization
    if (specialization) {
      experts = experts.filter(
        (expert) =>
          expert.specializations.some((spec) =>
            spec
              .toLowerCase()
              .includes((specialization as string).toLowerCase()),
          ) ||
          expert.specializationsArabic.some((spec) =>
            spec.includes(specialization as string),
          ),
      );
    }

    // Sort by rating
    experts.sort((a, b) => b.rating - a.rating);

    // Limit results
    experts = experts.slice(0, Number(limit));

    res.json({
      success: true,
      data: experts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get online experts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getCollaborationStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = users.length;
    const onlineUsers = users.filter((u) => u.online).length;
    const totalExperts = users.filter((u) => u.userType === "expert").length;
    const verifiedExperts = users.filter(
      (u) => u.userType === "expert" && u.verified,
    ).length;
    const totalConsultations = consultations.length;
    const activeConsultations = consultations.filter(
      (c) => c.status === "in_progress" || c.status === "assigned",
    ).length;
    const completedConsultations = consultations.filter(
      (c) => c.status === "completed",
    ).length;
    const totalForumPosts = forumPosts.length;
    const totalChatRooms = chatRooms.filter((r) => r.active).length;
    const totalMessages = messages.length;

    const averageExpertRating =
      verifiedExperts > 0
        ? users
            .filter((u) => u.userType === "expert" && u.verified)
            .reduce((sum, expert) => sum + expert.rating, 0) / verifiedExperts
        : 0;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          online: onlineUsers,
          experts: totalExperts,
          verifiedExperts,
        },
        consultations: {
          total: totalConsultations,
          active: activeConsultations,
          completed: completedConsultations,
          completionRate:
            totalConsultations > 0
              ? (completedConsultations / totalConsultations) * 100
              : 0,
        },
        forum: {
          totalPosts: totalForumPosts,
          featuredPosts: forumPosts.filter((p) => p.featured).length,
          totalReplies: forumReplies.length,
        },
        chat: {
          totalRooms: totalChatRooms,
          totalMessages,
          averageMessagesPerRoom:
            totalChatRooms > 0 ? totalMessages / totalChatRooms : 0,
        },
        quality: {
          averageExpertRating: Math.round(averageExpertRating * 100) / 100,
          totalReviews: users.reduce((sum, user) => sum + user.reviewCount, 0),
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get collaboration stats",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
