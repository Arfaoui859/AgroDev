import { Request, Response } from "express";

// Types for farmer segmentation
interface FarmerProfile {
  id: string;
  name: string;
  nameArabic: string;
  email: string;
  location: string;
  locationArabic: string;
  joinDate: string;
  farmSize: number; // hectares
  primaryCrops: string[];
  primaryCropsArabic: string[];
  farmingType: "traditional" | "organic" | "modern" | "mixed";
  experience: number; // years
  education: "basic" | "secondary" | "vocational" | "university";
  age: number;
  annualRevenue: number; // USD
  technologyAdoption: number; // 1-10 scale
  sustainabilityPractices: number; // 1-10 scale
}

interface FarmerActivity {
  farmerId: string;
  activityType:
    | "soil_analysis"
    | "disease_detection"
    | "crop_recommendation"
    | "weather_check"
    | "market_check"
    | "consultation"
    | "forum_post"
    | "chat_message";
  timestamp: string;
  metadata: Record<string, any>;
  value: number; // engagement value
  success: boolean;
  platform: "web" | "mobile" | "api";
}

interface EngagementMetrics {
  farmerId: string;
  totalActivities: number;
  uniqueActivitiesCount: number;
  avgActivitiesPerWeek: number;
  avgActivitiesPerMonth: number;
  lastActivityDate: string;
  mostActiveTimeOfDay: number; // hour 0-23
  mostActiveDay: number; // 0-6 (Sunday to Saturday)
  preferredPlatform: string;
  sessionDuration: number; // average minutes
  featureUsage: Record<string, number>;
  consultationFrequency: number;
  communityParticipation: number;
  contentCreation: number;
  helpSeeking: number;
  helpProviding: number;
}

interface FarmerSegment {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  color: string;
  icon: string;
  criteria: {
    farmSize: { min: number; max: number };
    experience: { min: number; max: number };
    technologyAdoption: { min: number; max: number };
    engagementLevel: { min: number; max: number };
    annualRevenue: { min: number; max: number };
    activityFrequency: { min: number; max: number };
  };
  characteristics: string[];
  characteristicsArabic: string[];
  recommendedServices: string[];
  recommendedServicesArabic: string[];
  marketingPriority: number; // 1-10
  supportLevel: "basic" | "standard" | "premium" | "enterprise";
  predictiveInsights: {
    growthPotential: number; // 1-10
    churnRisk: number; // 1-10
    upsellOpportunity: number; // 1-10
    referralLikelihood: number; // 1-10
  };
}

interface SegmentationResult {
  farmerId: string;
  segmentId: string;
  confidence: number; // 0-1
  alternativeSegments: Array<{
    segmentId: string;
    confidence: number;
  }>;
  keyFactors: Array<{
    factor: string;
    factorArabic: string;
    impact: number; // -1 to 1
    weight: number; // 0-1
  }>;
  recommendations: Array<{
    type: string;
    typeArabic: string;
    priority: number; // 1-10
    description: string;
    descriptionArabic: string;
    expectedImpact: number; // 1-10
  }>;
  lastSegmented: string;
  segmentHistory: Array<{
    segmentId: string;
    date: string;
    confidence: number;
  }>;
}

// Mock data
let farmerProfiles: FarmerProfile[] = [
  {
    id: "farmer_001",
    name: "Ahmed Al-Mahmoud",
    nameArabic: "أحمد المحمود",
    email: "ahmed@example.com",
    location: "North Tunisia",
    locationArabic: "شمال تونس",
    joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    farmSize: 25.5,
    primaryCrops: ["Wheat", "Barley"],
    primaryCropsArabic: ["القمح", "الشعير"],
    farmingType: "modern",
    experience: 15,
    education: "secondary",
    age: 45,
    annualRevenue: 35000,
    technologyAdoption: 8,
    sustainabilityPractices: 7,
  },
  {
    id: "farmer_002",
    name: "Fatima Ben Ali",
    nameArabic: "فاطمة بن علي",
    email: "fatima@example.com",
    location: "Central Tunisia",
    locationArabic: "وسط تونس",
    joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    farmSize: 5.2,
    primaryCrops: ["Tomatoes", "Peppers"],
    primaryCropsArabic: ["الطماطم", "الفلفل"],
    farmingType: "organic",
    experience: 8,
    education: "vocational",
    age: 38,
    annualRevenue: 18000,
    technologyAdoption: 6,
    sustainabilityPractices: 9,
  },
  {
    id: "farmer_003",
    name: "Omar Khaled",
    nameArabic: "عمر خالد",
    email: "omar@example.com",
    location: "South Tunisia",
    locationArabic: "جنوب تونس",
    joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    farmSize: 3.8,
    primaryCrops: ["Dates", "Olives"],
    primaryCropsArabic: ["التمر", "الزيتون"],
    farmingType: "traditional",
    experience: 25,
    education: "basic",
    age: 58,
    annualRevenue: 12000,
    technologyAdoption: 3,
    sustainabilityPractices: 5,
  },
];

let farmerActivities: FarmerActivity[] = [
  // High-engagement farmer (Ahmed)
  ...Array.from({ length: 150 }, (_, i) => ({
    farmerId: "farmer_001",
    activityType: [
      "soil_analysis",
      "disease_detection",
      "crop_recommendation",
      "weather_check",
      "market_check",
    ][Math.floor(Math.random() * 5)] as any,
    timestamp: new Date(
      Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    metadata: { result: "successful" },
    value: 5 + Math.random() * 5,
    success: Math.random() > 0.2,
    platform: Math.random() > 0.3 ? "web" : ("mobile" as any),
  })),
  // Medium-engagement farmer (Fatima)
  ...Array.from({ length: 75 }, (_, i) => ({
    farmerId: "farmer_002",
    activityType: [
      "soil_analysis",
      "disease_detection",
      "consultation",
      "forum_post",
    ][Math.floor(Math.random() * 4)] as any,
    timestamp: new Date(
      Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    metadata: { result: "successful" },
    value: 3 + Math.random() * 4,
    success: Math.random() > 0.25,
    platform: Math.random() > 0.5 ? "web" : ("mobile" as any),
  })),
  // Low-engagement farmer (Omar)
  ...Array.from({ length: 20 }, (_, i) => ({
    farmerId: "farmer_003",
    activityType: ["weather_check", "market_check", "consultation"][
      Math.floor(Math.random() * 3)
    ] as any,
    timestamp: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    metadata: { result: "viewed" },
    value: 1 + Math.random() * 2,
    success: Math.random() > 0.4,
    platform: "web" as any,
  })),
];

// Define farmer segments
const farmerSegments: FarmerSegment[] = [
  {
    id: "tech_pioneer",
    name: "Technology Pioneer",
    nameArabic: "رائد التكنولوجيا",
    description:
      "Advanced farmers who actively adopt new technologies and drive innovation",
    descriptionArabic:
      "مزارعون متقدمون يتبنون التقنيات الجديدة بنشاط ويقودون الابتكار",
    color: "#3b82f6",
    icon: "🚀",
    criteria: {
      farmSize: { min: 10, max: 1000 },
      experience: { min: 10, max: 50 },
      technologyAdoption: { min: 7, max: 10 },
      engagementLevel: { min: 8, max: 10 },
      annualRevenue: { min: 25000, max: 1000000 },
      activityFrequency: { min: 20, max: 1000 },
    },
    characteristics: [
      "High technology adoption",
      "Active platform engagement",
      "Large farm operations",
      "Strong revenue generation",
      "Innovation focused",
    ],
    characteristicsArabic: [
      "تبني عالي للتكنولوجيا",
      "مشاركة نشطة في المنصة",
      "عمليات زراعية كبيرة",
      "توليد إيرادات قوي",
      "مركز على الابتكار",
    ],
    recommendedServices: [
      "Premium AI analytics",
      "Advanced crop monitoring",
      "Market intelligence",
      "Investment opportunities",
      "Expert consultations",
    ],
    recommendedServicesArabic: [
      "تحليلات ذكية متميزة",
      "مراقبة محاصيل متقدمة",
      "ذكاء السوق",
      "فرص استثمارية",
      "استشارات خبراء",
    ],
    marketingPriority: 9,
    supportLevel: "enterprise",
    predictiveInsights: {
      growthPotential: 9,
      churnRisk: 2,
      upsellOpportunity: 8,
      referralLikelihood: 8,
    },
  },
  {
    id: "engaged_modernizer",
    name: "Engaged Modernizer",
    nameArabic: "المطور المشارك",
    description: "Medium-scale farmers actively modernizing their practices",
    descriptionArabic: "مزارعون متوسطو الحجم يطورون ممارساتهم بنشاط",
    color: "#10b981",
    icon: "🌱",
    criteria: {
      farmSize: { min: 5, max: 25 },
      experience: { min: 5, max: 20 },
      technologyAdoption: { min: 5, max: 8 },
      engagementLevel: { min: 6, max: 9 },
      annualRevenue: { min: 15000, max: 40000 },
      activityFrequency: { min: 10, max: 30 },
    },
    characteristics: [
      "Moderate technology adoption",
      "Regular platform usage",
      "Growing operations",
      "Sustainable practices focus",
      "Learning oriented",
    ],
    characteristicsArabic: [
      "تبني معتدل للتكنولوجيا",
      "استخدام منتظم للمنصة",
      "عمليات متنامية",
      "تركيز على الممارسات المستدامة",
      "موجه للتعلم",
    ],
    recommendedServices: [
      "Standard analytics",
      "Crop recommendations",
      "Weather alerts",
      "Community forums",
      "Basic consultations",
    ],
    recommendedServicesArabic: [
      "تحليلات قياسية",
      "توصيات المحاصيل",
      "تنبيهات الطقس",
      "منتديات المجتمع",
      "استشارات أساسية",
    ],
    marketingPriority: 7,
    supportLevel: "premium",
    predictiveInsights: {
      growthPotential: 7,
      churnRisk: 4,
      upsellOpportunity: 6,
      referralLikelihood: 6,
    },
  },
  {
    id: "traditional_learner",
    name: "Traditional Learner",
    nameArabic: "المتعلم التقليدي",
    description: "Traditional farmers beginning to explore modern techniques",
    descriptionArabic: "مزارعون تقليديون يبدؤون في استكشاف التقنيات الحديثة",
    color: "#f59e0b",
    icon: "📚",
    criteria: {
      farmSize: { min: 1, max: 10 },
      experience: { min: 15, max: 40 },
      technologyAdoption: { min: 2, max: 5 },
      engagementLevel: { min: 3, max: 6 },
      annualRevenue: { min: 5000, max: 20000 },
      activityFrequency: { min: 3, max: 15 },
    },
    characteristics: [
      "Limited technology use",
      "Occasional platform visits",
      "Small-scale operations",
      "Traditional methods",
      "Seeking guidance",
    ],
    characteristicsArabic: [
      "استخدام محدود للتكنولوجيا",
      "زيارات متقطعة للمنصة",
      "عمليات صغيرة الحجم",
      "طرق تقليدية",
      "يبحث عن الإرشاد",
    ],
    recommendedServices: [
      "Basic weather info",
      "Simple crop guides",
      "Market prices",
      "Educational content",
      "Community support",
    ],
    recommendedServicesArabic: [
      "معلومات طقس أساسية",
      "أدلة محاصيل بسيطة",
      "أسعار السوق",
      "محتوى تعليمي",
      "دعم المجتمع",
    ],
    marketingPriority: 5,
    supportLevel: "standard",
    predictiveInsights: {
      growthPotential: 5,
      churnRisk: 6,
      upsellOpportunity: 4,
      referralLikelihood: 4,
    },
  },
  {
    id: "dormant_potential",
    name: "Dormant Potential",
    nameArabic: "الإمكانات الكامنة",
    description: "Inactive users with potential for re-engagement",
    descriptionArabic: "مستخدمون غير نشطين لديهم إمكانية لإعادة المشاركة",
    color: "#ef4444",
    icon: "💤",
    criteria: {
      farmSize: { min: 0, max: 100 },
      experience: { min: 0, max: 50 },
      technologyAdoption: { min: 0, max: 10 },
      engagementLevel: { min: 0, max: 3 },
      annualRevenue: { min: 0, max: 50000 },
      activityFrequency: { min: 0, max: 5 },
    },
    characteristics: [
      "Very low engagement",
      "Infrequent platform use",
      "Unclear farming profile",
      "Potential for growth",
      "Needs activation",
    ],
    characteristicsArabic: [
      "مشاركة منخفضة جداً",
      "استخدام نادر للمنصة",
      "ملف زراعي غير واضح",
      "إمكانية للنمو",
      "يحتاج تفعيل",
    ],
    recommendedServices: [
      "Onboarding program",
      "Basic tutorials",
      "Welcome incentives",
      "Simplified interface",
      "Personal outreach",
    ],
    recommendedServicesArabic: [
      "برنامج الإعداد",
      "دروس أساسية",
      "حوافز الترحيب",
      "واجهة مبسطة",
      "تواصل شخصي",
    ],
    marketingPriority: 3,
    supportLevel: "basic",
    predictiveInsights: {
      growthPotential: 6,
      churnRisk: 8,
      upsellOpportunity: 2,
      referralLikelihood: 2,
    },
  },
];

// Helper functions
function calculateEngagementMetrics(farmerId: string): EngagementMetrics {
  const activities = farmerActivities.filter((a) => a.farmerId === farmerId);

  if (activities.length === 0) {
    return {
      farmerId,
      totalActivities: 0,
      uniqueActivitiesCount: 0,
      avgActivitiesPerWeek: 0,
      avgActivitiesPerMonth: 0,
      lastActivityDate: "",
      mostActiveTimeOfDay: 12,
      mostActiveDay: 1,
      preferredPlatform: "web",
      sessionDuration: 0,
      featureUsage: {},
      consultationFrequency: 0,
      communityParticipation: 0,
      contentCreation: 0,
      helpSeeking: 0,
      helpProviding: 0,
    };
  }

  const now = new Date();
  const joinDate = new Date(
    farmerProfiles.find((f) => f.id === farmerId)?.joinDate || now,
  );
  const daysSinceJoin = Math.max(
    1,
    (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const totalActivities = activities.length;
  const uniqueActivitiesCount = new Set(activities.map((a) => a.activityType))
    .size;
  const avgActivitiesPerWeek = (totalActivities / daysSinceJoin) * 7;
  const avgActivitiesPerMonth = (totalActivities / daysSinceJoin) * 30;

  const lastActivityDate = activities
    .reduce((latest, activity) => {
      const activityDate = new Date(activity.timestamp);
      return activityDate > latest ? activityDate : latest;
    }, new Date(0))
    .toISOString();

  // Calculate most active time of day
  const hourCounts = activities.reduce(
    (acc, activity) => {
      const hour = new Date(activity.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );
  const mostActiveTimeOfDay = Object.entries(hourCounts).reduce((a, b) =>
    hourCounts[Number(a[0])] > hourCounts[Number(b[0])] ? a : b,
  )[0];

  // Calculate preferred platform
  const platformCounts = activities.reduce(
    (acc, activity) => {
      acc[activity.platform] = (acc[activity.platform] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const preferredPlatform = Object.entries(platformCounts).reduce((a, b) =>
    platformCounts[a[0]] > platformCounts[b[0]] ? a : b,
  )[0];

  // Calculate feature usage
  const featureUsage = activities.reduce(
    (acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate specialized metrics
  const consultationFrequency = activities.filter(
    (a) => a.activityType === "consultation",
  ).length;
  const communityParticipation = activities.filter((a) =>
    ["forum_post", "chat_message"].includes(a.activityType),
  ).length;
  const contentCreation = activities.filter(
    (a) => a.activityType === "forum_post",
  ).length;

  return {
    farmerId,
    totalActivities,
    uniqueActivitiesCount,
    avgActivitiesPerWeek,
    avgActivitiesPerMonth,
    lastActivityDate,
    mostActiveTimeOfDay: Number(mostActiveTimeOfDay),
    mostActiveDay: 1, // Simplified
    preferredPlatform,
    sessionDuration: 15 + Math.random() * 30, // Mock session duration
    featureUsage,
    consultationFrequency,
    communityParticipation,
    contentCreation,
    helpSeeking: consultationFrequency,
    helpProviding: contentCreation,
  };
}

function calculateSegmentMatch(
  farmer: FarmerProfile,
  segment: FarmerSegment,
  engagement: EngagementMetrics,
): number {
  let score = 0;
  let totalWeight = 0;

  // Farm size score
  const farmSizeScore =
    farmer.farmSize >= segment.criteria.farmSize.min &&
    farmer.farmSize <= segment.criteria.farmSize.max
      ? 1
      : Math.max(
          0,
          1 -
            Math.abs(
              farmer.farmSize -
                (segment.criteria.farmSize.min +
                  segment.criteria.farmSize.max) /
                  2,
            ) /
              50,
        );
  score += farmSizeScore * 0.15;
  totalWeight += 0.15;

  // Experience score
  const expScore =
    farmer.experience >= segment.criteria.experience.min &&
    farmer.experience <= segment.criteria.experience.max
      ? 1
      : Math.max(
          0,
          1 -
            Math.abs(
              farmer.experience -
                (segment.criteria.experience.min +
                  segment.criteria.experience.max) /
                  2,
            ) /
              25,
        );
  score += expScore * 0.1;
  totalWeight += 0.1;

  // Technology adoption score
  const techScore =
    farmer.technologyAdoption >= segment.criteria.technologyAdoption.min &&
    farmer.technologyAdoption <= segment.criteria.technologyAdoption.max
      ? 1
      : Math.max(
          0,
          1 -
            Math.abs(
              farmer.technologyAdoption -
                (segment.criteria.technologyAdoption.min +
                  segment.criteria.technologyAdoption.max) /
                  2,
            ) /
              5,
        );
  score += techScore * 0.25;
  totalWeight += 0.25;

  // Engagement level score
  const engagementLevel = Math.min(10, engagement.avgActivitiesPerWeek);
  const engagementScore =
    engagementLevel >= segment.criteria.engagementLevel.min &&
    engagementLevel <= segment.criteria.engagementLevel.max
      ? 1
      : Math.max(
          0,
          1 -
            Math.abs(
              engagementLevel -
                (segment.criteria.engagementLevel.min +
                  segment.criteria.engagementLevel.max) /
                  2,
            ) /
              5,
        );
  score += engagementScore * 0.3;
  totalWeight += 0.3;

  // Revenue score
  const revenueScore =
    farmer.annualRevenue >= segment.criteria.annualRevenue.min &&
    farmer.annualRevenue <= segment.criteria.annualRevenue.max
      ? 1
      : Math.max(
          0,
          1 -
            Math.abs(
              farmer.annualRevenue -
                (segment.criteria.annualRevenue.min +
                  segment.criteria.annualRevenue.max) /
                  2,
            ) /
              50000,
        );
  score += revenueScore * 0.15;
  totalWeight += 0.15;

  // Activity frequency score
  const activityScore =
    engagement.totalActivities >= segment.criteria.activityFrequency.min &&
    engagement.totalActivities <= segment.criteria.activityFrequency.max
      ? 1
      : Math.max(
          0,
          1 -
            Math.abs(
              engagement.totalActivities -
                (segment.criteria.activityFrequency.min +
                  segment.criteria.activityFrequency.max) /
                  2,
            ) /
              100,
        );
  score += activityScore * 0.05;
  totalWeight += 0.05;

  return Math.min(1, Math.max(0, score / totalWeight));
}

function generateRecommendations(
  farmer: FarmerProfile,
  segment: FarmerSegment,
  engagement: EngagementMetrics,
): Array<{
  type: string;
  typeArabic: string;
  priority: number;
  description: string;
  descriptionArabic: string;
  expectedImpact: number;
}> {
  const recommendations = [];

  // Technology adoption recommendations
  if (farmer.technologyAdoption < 5) {
    recommendations.push({
      type: "technology_training",
      typeArabic: "تدريب تكنولوجي",
      priority: 8,
      description: "Provide basic technology training and onboarding",
      descriptionArabic: "توفير تدريب تكنولوجي أساسي وإعداد",
      expectedImpact: 7,
    });
  }

  // Engagement recommendations
  if (engagement.avgActivitiesPerWeek < 2) {
    recommendations.push({
      type: "engagement_program",
      typeArabic: "برنامج المشاركة",
      priority: 9,
      description: "Implement targeted engagement program with incentives",
      descriptionArabic: "تنفيذ برنامج مشاركة مستهدف مع حوافز",
      expectedImpact: 8,
    });
  }

  // Revenue optimization
  if (farmer.annualRevenue < 20000) {
    recommendations.push({
      type: "revenue_optimization",
      typeArabic: "تحسين الإيرادات",
      priority: 7,
      description: "Provide market intelligence and crop optimization guidance",
      descriptionArabic: "توفير ذكاء السوق وإرشادات تحسين المحاصيل",
      expectedImpact: 6,
    });
  }

  // Community participation
  if (engagement.communityParticipation < 5) {
    recommendations.push({
      type: "community_integration",
      typeArabic: "التكامل المجتمعي",
      priority: 6,
      description: "Encourage participation in forums and discussions",
      descriptionArabic: "تشجيع المشاركة في المنتديات والنقاشات",
      expectedImpact: 5,
    });
  }

  // Feature adoption
  if (engagement.uniqueActivitiesCount < 3) {
    recommendations.push({
      type: "feature_exploration",
      typeArabic: "استكشاف الميزات",
      priority: 5,
      description: "Guide through unused platform features",
      descriptionArabic: "توجيه عبر ميزات المنصة غير المستخدمة",
      expectedImpact: 4,
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// API Endpoints

export const getFarmerSegments = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: farmerSegments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get farmer segments",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const segmentFarmer = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.params;

    const farmer = farmerProfiles.find((f) => f.id === farmerId);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: "Farmer not found",
        message: `Farmer with ID ${farmerId} not found`,
      });
    }

    const engagement = calculateEngagementMetrics(farmerId);

    // Calculate scores for all segments
    const segmentScores = farmerSegments
      .map((segment) => ({
        segment,
        confidence: calculateSegmentMatch(farmer, segment, engagement),
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const primarySegment = segmentScores[0];
    const alternativeSegments = segmentScores.slice(1, 4).map((s) => ({
      segmentId: s.segment.id,
      confidence: s.confidence,
    }));

    // Generate key factors
    const keyFactors = [
      {
        factor: "Technology Adoption",
        factorArabic: "تبني التكنولوجيا",
        impact: (farmer.technologyAdoption - 5) / 5,
        weight: 0.25,
      },
      {
        factor: "Engagement Level",
        factorArabic: "مستوى المشاركة",
        impact: (Math.min(10, engagement.avgActivitiesPerWeek) - 5) / 5,
        weight: 0.3,
      },
      {
        factor: "Farm Size",
        factorArabic: "حجم المزرعة",
        impact: (Math.min(50, farmer.farmSize) - 25) / 25,
        weight: 0.15,
      },
      {
        factor: "Experience",
        factorArabic: "الخبرة",
        impact: (Math.min(30, farmer.experience) - 15) / 15,
        weight: 0.1,
      },
      {
        factor: "Revenue",
        factorArabic: "الإيرادات",
        impact: (Math.min(100000, farmer.annualRevenue) - 25000) / 37500,
        weight: 0.15,
      },
    ];

    const recommendations = generateRecommendations(
      farmer,
      primarySegment.segment,
      engagement,
    );

    const result: SegmentationResult = {
      farmerId,
      segmentId: primarySegment.segment.id,
      confidence: primarySegment.confidence,
      alternativeSegments,
      keyFactors,
      recommendations,
      lastSegmented: new Date().toISOString(),
      segmentHistory: [
        {
          segmentId: primarySegment.segment.id,
          date: new Date().toISOString(),
          confidence: primarySegment.confidence,
        },
      ],
    };

    res.json({
      success: true,
      data: {
        farmer,
        engagement,
        segmentation: result,
        segment: primarySegment.segment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to segment farmer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllFarmersSegmentation = async (
  req: Request,
  res: Response,
) => {
  try {
    const { includeMetrics = "false" } = req.query;

    const results = farmerProfiles.map((farmer) => {
      const engagement = calculateEngmentMetrics(farmer.id);

      const segmentScores = farmerSegments
        .map((segment) => ({
          segment,
          confidence: calculateSegmentMatch(farmer, segment, engagement),
        }))
        .sort((a, b) => b.confidence - a.confidence);

      const primarySegment = segmentScores[0];

      const basicResult = {
        farmerId: farmer.id,
        farmerName: farmer.nameArabic,
        segmentId: primarySegment.segment.id,
        segmentName: primarySegment.segment.nameArabic,
        confidence: primarySegment.confidence,
        lastSegmented: new Date().toISOString(),
      };

      if (includeMetrics === "true") {
        return {
          ...basicResult,
          farmer,
          engagement,
          segment: primarySegment.segment,
        };
      }

      return basicResult;
    });

    // Calculate distribution
    const distribution = results.reduce(
      (acc, result) => {
        acc[result.segmentId] = (acc[result.segmentId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({
      success: true,
      data: {
        segmentations: results,
        distribution,
        totalFarmers: farmerProfiles.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get all farmers segmentation",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getSegmentationAnalytics = async (req: Request, res: Response) => {
  try {
    const segmentStats = farmerSegments.map((segment) => {
      const farmersInSegment = farmerProfiles.filter((farmer) => {
        const engagement = calculateEngagementMetrics(farmer.id);
        const score = calculateSegmentMatch(farmer, segment, engagement);
        return score > 0.6; // Threshold for segment membership
      });

      const totalRevenue = farmersInSegment.reduce(
        (sum, farmer) => sum + farmer.annualRevenue,
        0,
      );
      const avgRevenue =
        farmersInSegment.length > 0
          ? totalRevenue / farmersInSegment.length
          : 0;
      const avgFarmSize =
        farmersInSegment.length > 0
          ? farmersInSegment.reduce((sum, farmer) => sum + farmer.farmSize, 0) /
            farmersInSegment.length
          : 0;
      const avgTechAdoption =
        farmersInSegment.length > 0
          ? farmersInSegment.reduce(
              (sum, farmer) => sum + farmer.technologyAdoption,
              0,
            ) / farmersInSegment.length
          : 0;

      return {
        segment,
        farmerCount: farmersInSegment.length,
        percentage: (farmersInSegment.length / farmerProfiles.length) * 100,
        totalRevenue,
        avgRevenue,
        avgFarmSize,
        avgTechAdoption,
        growthPotential: segment.predictiveInsights.growthPotential,
        marketingPriority: segment.marketingPriority,
      };
    });

    const insights = {
      totalSegments: farmerSegments.length,
      mostPopularSegment: segmentStats.reduce((max, stat) =>
        stat.farmerCount > max.farmerCount ? stat : max,
      ),
      highestRevenueSegment: segmentStats.reduce((max, stat) =>
        stat.avgRevenue > max.avgRevenue ? stat : max,
      ),
      highestGrowthPotential: segmentStats.reduce((max, stat) =>
        stat.growthPotential > max.growthPotential ? stat : max,
      ),
      recommendedFocus: segmentStats.filter(
        (stat) => stat.marketingPriority >= 7,
      ),
    };

    res.json({
      success: true,
      data: {
        segmentStats,
        insights,
        lastAnalyzed: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get segmentation analytics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateFarmerProfile = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.params;
    const updates = req.body;

    const farmerIndex = farmerProfiles.findIndex((f) => f.id === farmerId);
    if (farmerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Farmer not found",
        message: `Farmer with ID ${farmerId} not found`,
      });
    }

    // Update farmer profile
    farmerProfiles[farmerIndex] = {
      ...farmerProfiles[farmerIndex],
      ...updates,
    };

    // Re-segment the farmer
    const engagement = calculateEngagementMetrics(farmerId);
    const segmentScores = farmerSegments
      .map((segment) => ({
        segment,
        confidence: calculateSegmentMatch(
          farmerProfiles[farmerIndex],
          segment,
          engagement,
        ),
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const newSegment = segmentScores[0];

    res.json({
      success: true,
      data: {
        farmer: farmerProfiles[farmerIndex],
        newSegment: newSegment.segment,
        confidence: newSegment.confidence,
      },
      message: "Farmer profile updated and re-segmented successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update farmer profile",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Fix typo in function name
function calculateEngmentMetrics(farmerId: string): EngagementMetrics {
  return calculateEngagementMetrics(farmerId);
}
