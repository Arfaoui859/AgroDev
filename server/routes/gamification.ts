import { Request, Response } from "express";

// Types for gamification system
interface UserReward {
  id: string;
  userId: string;
  currentXP: number;
  currentLevel: number;
  totalXP: number;
  badges: Badge[];
  achievements: Achievement[];
  lastActivityDate: string;
  streak: number;
}

interface Badge {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedAt: string;
  category: string;
}

interface Achievement {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: string;
  category: string;
  reward: {
    xp: number;
    badge?: string;
  };
}

interface XPEvent {
  action: string;
  xp: number;
  description: string;
  descriptionArabic: string;
}

// XP rewards configuration
const XP_REWARDS: Record<string, XPEvent> = {
  soil_analysis: {
    action: "soil_analysis",
    xp: 15,
    description: "Soil analysis completed",
    descriptionArabic: "تحليل التربة مكتمل",
  },
  crop_recommendation: {
    action: "crop_recommendation",
    xp: 20,
    description: "Got crop recommendations",
    descriptionArabic: "حصلت على توصيات المحاصيل",
  },
  disease_detection: {
    action: "disease_detection",
    xp: 25,
    description: "Plant disease detected",
    descriptionArabic: "تشخيص مرض النبات",
  },
  daily_login: {
    action: "daily_login",
    xp: 5,
    description: "Daily login bonus",
    descriptionArabic: "مكافأة الدخول اليومي",
  },
  share_experience: {
    action: "share_experience",
    xp: 10,
    description: "Shared farming experience",
    descriptionArabic: "شارك التجربة الزراعية",
  },
  complete_task: {
    action: "complete_task",
    xp: 30,
    description: "Task completed",
    descriptionArabic: "مهمة مكتملة",
  },
  upload_image: {
    action: "upload_image",
    xp: 8,
    description: "Image uploaded for analysis",
    descriptionArabic: "صورة رفعت للتحليل",
  },
  profile_completion: {
    action: "profile_completion",
    xp: 50,
    description: "Profile completed",
    descriptionArabic: "الملف الشخصي مكتمل",
  },
};

// Level progression (XP required for each level)
const LEVEL_PROGRESSION = [
  0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2900, 3500, 4200, 5000, 5900,
  6900, 8000, 9200, 10500, 12000, 13600, 15300, 17100, 19000, 21000, 23100,
  25300, 27600, 30000, 32500, 35100,
];

// Badges configuration
const AVAILABLE_BADGES: Omit<Badge, "id" | "earnedAt">[] = [
  {
    name: "Soil Expert",
    nameArabic: "خبير التربة",
    description: "Completed 10 soil analyses",
    descriptionArabic: "أكمل 10 تحاليل تربة",
    icon: "🌱",
    rarity: "common",
    category: "soil",
  },
  {
    name: "Disease Hunter",
    nameArabic: "صائد الأمراض",
    description: "Detected 25 plant diseases",
    descriptionArabic: "اكتشف 25 مرض نباتي",
    icon: "🔬",
    rarity: "rare",
    category: "disease",
  },
  {
    name: "Smart Farmer",
    nameArabic: "المزارع الذ��ي",
    description: "Used AI recommendations 50 times",
    descriptionArabic: "استخدم توصيات الذكاء الاصطناعي 50 مرة",
    icon: "🧠",
    rarity: "epic",
    category: "ai",
  },
  {
    name: "Community Leader",
    nameArabic: "قائد المجتمع",
    description: "Helped 100 farmers with advice",
    descriptionArabic: "ساعد 100 مزارع بالنصائح",
    icon: "👑",
    rarity: "legendary",
    category: "community",
  },
  {
    name: "Early Adopter",
    nameArabic: "المستخدم المبكر",
    description: "Joined in the first month",
    descriptionArabic: "انضم في الشهر الأول",
    icon: "⭐",
    rarity: "rare",
    category: "special",
  },
  {
    name: "Streak Master",
    nameArabic: "محترف الاستمرارية",
    description: "30-day login streak",
    descriptionArabic: "دخول يومي لمدة 30 يوم",
    icon: "🔥",
    rarity: "epic",
    category: "engagement",
  },
];

// Mock database - في الإنتاج، سيتم استبدالها بقاعدة بيانات حقيقية
let userRewards: UserReward[] = [];
let userActivities: Array<{
  userId: string;
  action: string;
  xp: number;
  timestamp: string;
  metadata?: any;
}> = [];

// Helper functions
function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_PROGRESSION.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_PROGRESSION[i]) {
      return i;
    }
  }
  return 0;
}

function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_PROGRESSION.length - 1) {
    return 0; // Max level reached
  }
  return LEVEL_PROGRESSION[currentLevel + 1];
}

function generateUserId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function initializeUserRewards(userId: string): UserReward {
  const newUser: UserReward = {
    id: generateUserId(),
    userId,
    currentXP: 0,
    currentLevel: 0,
    totalXP: 0,
    badges: [],
    achievements: [],
    lastActivityDate: new Date().toISOString(),
    streak: 1,
  };
  userRewards.push(newUser);
  return newUser;
}

function getUserRewards(userId: string): UserReward {
  let user = userRewards.find((u) => u.userId === userId);
  if (!user) {
    user = initializeUserRewards(userId);
  }
  return user;
}

function checkBadgeEligibility(
  userId: string,
  userReward: UserReward,
): Badge[] {
  const newBadges: Badge[] = [];
  const userActivitiesCount = userActivities.filter((a) => a.userId === userId);

  AVAILABLE_BADGES.forEach((badgeTemplate) => {
    // Check if user already has this badge
    if (userReward.badges.some((b) => b.name === badgeTemplate.name)) {
      return;
    }

    let eligible = false;

    switch (badgeTemplate.category) {
      case "soil":
        eligible =
          userActivitiesCount.filter((a) => a.action === "soil_analysis")
            .length >= 10;
        break;
      case "disease":
        eligible =
          userActivitiesCount.filter((a) => a.action === "disease_detection")
            .length >= 25;
        break;
      case "ai":
        eligible =
          userActivitiesCount.filter((a) => a.action === "crop_recommendation")
            .length >= 50;
        break;
      case "engagement":
        eligible = userReward.streak >= 30;
        break;
      case "special":
        // Early adopter badge - implement based on join date
        eligible = false; // Would check actual join date
        break;
    }

    if (eligible) {
      const newBadge: Badge = {
        ...badgeTemplate,
        id: generateUserId(),
        earnedAt: new Date().toISOString(),
      };
      newBadges.push(newBadge);
    }
  });

  return newBadges;
}

// API Endpoints

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || "demo-user";
    const userReward = getUserRewards(userId);

    // Update streak if necessary
    const lastActivity = new Date(userReward.lastActivityDate);
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24),
    );

    if (diffDays === 1) {
      userReward.streak += 1;
      userReward.lastActivityDate = today.toISOString();
    } else if (diffDays > 1) {
      userReward.streak = 1;
      userReward.lastActivityDate = today.toISOString();
    }

    const nextLevelXP = getXPForNextLevel(userReward.currentLevel);
    const currentLevelXP =
      userReward.currentLevel > 0
        ? LEVEL_PROGRESSION[userReward.currentLevel]
        : 0;
    const progressToNext =
      nextLevelXP > 0
        ? ((userReward.totalXP - currentLevelXP) /
            (nextLevelXP - currentLevelXP)) *
          100
        : 100;

    res.json({
      success: true,
      data: {
        ...userReward,
        nextLevelXP,
        currentLevelXP,
        progressToNext: Math.min(progressToNext, 100),
        xpToNextLevel: Math.max(nextLevelXP - userReward.totalXP, 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get user profile",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const awardXP = async (req: Request, res: Response) => {
  try {
    const { userId = "demo-user", action, metadata } = req.body;

    const xpEvent = XP_REWARDS[action];
    if (!xpEvent) {
      return res.status(400).json({
        success: false,
        error: "Invalid action",
        message: `Action '${action}' not found`,
      });
    }

    let userReward = getUserRewards(userId);
    const oldLevel = userReward.currentLevel;

    // Award XP
    userReward.totalXP += xpEvent.xp;
    userReward.currentXP = userReward.totalXP;
    userReward.currentLevel = calculateLevel(userReward.totalXP);
    userReward.lastActivityDate = new Date().toISOString();

    // Record activity
    userActivities.push({
      userId,
      action,
      xp: xpEvent.xp,
      timestamp: new Date().toISOString(),
      metadata,
    });

    // Check for level up
    const leveledUp = userReward.currentLevel > oldLevel;

    // Check for new badges
    const newBadges = checkBadgeEligibility(userId, userReward);
    userReward.badges.push(...newBadges);

    res.json({
      success: true,
      data: {
        xpAwarded: xpEvent.xp,
        totalXP: userReward.totalXP,
        currentLevel: userReward.currentLevel,
        leveledUp,
        levelsGained: userReward.currentLevel - oldLevel,
        newBadges,
        event: xpEvent,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to award XP",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = 10, category = "overall" } = req.query;

    // Sort users by total XP
    const sortedUsers = [...userRewards]
      .sort((a, b) => b.totalXP - a.totalXP)
      .slice(0, Number(limit));

    const leaderboard = sortedUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      currentLevel: user.currentLevel,
      totalXP: user.totalXP,
      badgeCount: user.badges.length,
      streak: user.streak,
      topBadges: user.badges
        .filter((b) => b.rarity === "legendary" || b.rarity === "epic")
        .slice(0, 3),
    }));

    res.json({
      success: true,
      data: {
        leaderboard,
        category,
        totalUsers: userRewards.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get leaderboard",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAvailableAchievements = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || "demo-user";
    const userReward = getUserRewards(userId);
    const userActivitiesCount = userActivities.filter(
      (a) => a.userId === userId,
    );

    // Create achievements based on current progress
    const achievements: Achievement[] = [
      {
        id: "soil_master",
        name: "Soil Master",
        nameArabic: "سيد التربة",
        description: "Complete 50 soil analyses",
        descriptionArabic: "أكمل 50 تحليل تربة",
        progress: userActivitiesCount.filter(
          (a) => a.action === "soil_analysis",
        ).length,
        target: 50,
        completed:
          userActivitiesCount.filter((a) => a.action === "soil_analysis")
            .length >= 50,
        category: "soil",
        reward: { xp: 100, badge: "soil_master" },
      },
      {
        id: "disease_expert",
        name: "Disease Expert",
        nameArabic: "خبير الأمراض",
        description: "Detect 100 plant diseases",
        descriptionArabic: "اكتشف 100 مرض نباتي",
        progress: userActivitiesCount.filter(
          (a) => a.action === "disease_detection",
        ).length,
        target: 100,
        completed:
          userActivitiesCount.filter((a) => a.action === "disease_detection")
            .length >= 100,
        category: "disease",
        reward: { xp: 200, badge: "disease_expert" },
      },
      {
        id: "ai_enthusiast",
        name: "AI Enthusiast",
        nameArabic: "عاشق الذكاء الاصطناعي",
        description: "Use AI recommendations 200 times",
        descriptionArabic: "استخدم توصيات الذكاء الاصطناعي 200 مرة",
        progress: userActivitiesCount.filter(
          (a) => a.action === "crop_recommendation",
        ).length,
        target: 200,
        completed:
          userActivitiesCount.filter((a) => a.action === "crop_recommendation")
            .length >= 200,
        category: "ai",
        reward: { xp: 300, badge: "ai_enthusiast" },
      },
      {
        id: "consistency_king",
        name: "Consistency King",
        nameArabic: "ملك الاستمرارية",
        description: "Maintain a 60-day login streak",
        descriptionArabic: "حافظ على دخول يومي لمدة 60 يوم",
        progress: userReward.streak,
        target: 60,
        completed: userReward.streak >= 60,
        category: "engagement",
        reward: { xp: 500, badge: "consistency_king" },
      },
    ];

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get achievements",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || "demo-user";
    const { limit = 20 } = req.query;

    const activities = userActivities
      .filter((a) => a.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, Number(limit))
      .map((activity) => ({
        ...activity,
        event: XP_REWARDS[activity.action],
      }));

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get user activity",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getGamificationStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = userRewards.length;
    const totalActivities = userActivities.length;
    const totalXPAwarded = userActivities.reduce(
      (sum, activity) => sum + activity.xp,
      0,
    );
    const averageLevel =
      userRewards.length > 0
        ? userRewards.reduce((sum, user) => sum + user.currentLevel, 0) /
          userRewards.length
        : 0;

    const topLevelUser = userRewards.reduce(
      (top, user) => (user.currentLevel > top.currentLevel ? user : top),
      userRewards[0] || { currentLevel: 0 },
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        totalActivities,
        totalXPAwarded,
        averageLevel: Math.round(averageLevel * 10) / 10,
        highestLevel: topLevelUser?.currentLevel || 0,
        totalBadgesEarned: userRewards.reduce(
          (sum, user) => sum + user.badges.length,
          0,
        ),
        availableBadges: AVAILABLE_BADGES.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get gamification stats",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
