import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Star,
  Zap,
  TrendingUp,
  Award,
  Target,
  Activity,
  Users,
  Crown,
  Flame,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface UserProfile {
  id: string;
  userId: string;
  currentXP: number;
  currentLevel: number;
  totalXP: number;
  badges: BadgeType[];
  achievements: Achievement[];
  lastActivityDate: string;
  streak: number;
  nextLevelXP: number;
  currentLevelXP: number;
  progressToNext: number;
  xpToNextLevel: number;
}

interface BadgeType {
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

interface LeaderboardEntry {
  rank: number;
  userId: string;
  currentLevel: number;
  totalXP: number;
  badgeCount: number;
  streak: number;
  topBadges: BadgeType[];
}

interface Activity {
  userId: string;
  action: string;
  xp: number;
  timestamp: string;
  metadata?: any;
  event: {
    action: string;
    xp: number;
    description: string;
    descriptionArabic: string;
  };
}

const GamificationDashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const profileResponse = await fetch(
        "/api/gamification/profile?userId=demo-user",
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData.data);
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch(
        "/api/gamification/leaderboard?limit=10",
      );
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.data.leaderboard);
      }

      // Fetch achievements
      const achievementsResponse = await fetch(
        "/api/gamification/achievements?userId=demo-user",
      );
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        setAchievements(achievementsData.data);
      }

      // Fetch activities
      const activitiesResponse = await fetch(
        "/api/gamification/activity?userId=demo-user&limit=10",
      );
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.data);
      }
    } catch (error) {
      console.error("Error fetching gamification data:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات نظام الحوافز",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const awardXP = async (action: string, metadata?: any) => {
    try {
      const response = await fetch("/api/gamification/award-xp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "demo-user",
          action,
          metadata,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: result.data.leveledUp ? "🎉 مستوى جديد!" : "⭐ نقاط خبرة!",
          description: result.data.leveledUp
            ? `تهانينا! وصلت للمستوى ${result.data.currentLevel}`
            : `حصلت على ${result.data.xpAwarded} نقطة خبرة`,
        });

        if (result.data.newBadges.length > 0) {
          toast({
            title: "🏆 شارة جديدة!",
            description: `حصلت على: ${result.data.newBadges[0].nameArabic}`,
          });
        }

        // Refresh data
        await fetchGamificationData();
      }
    } catch (error) {
      console.error("Error awarding XP:", error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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
          🎮 نظام الحوافز والإنجازات
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          اكسب نقاط الخبرة، احصل على الشارات، وتنافس مع المزارعين الآخرين في
          رحلتك نحو الزراعة الذكية
        </p>
      </div>

      {/* User Profile Overview */}
      {userProfile && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-green-500 text-white text-lg">
                  {userProfile.currentLevel}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl">المستوى {userProfile.currentLevel}</h2>
                <p className="text-sm text-muted-foreground">
                  {userProfile.totalXP.toLocaleString()} نقطة خبرة إجمالية
                </p>
              </div>
              <div className="mr-auto flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">{userProfile.streak} يوم</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>التقدم للمستوى التالي</span>
                <span>{userProfile.xpToNextLevel} نقطة متبقية</span>
              </div>
              <Progress value={userProfile.progressToNext} className="h-3" />
            </div>

            <div className="flex flex-wrap gap-2">
              {userProfile.badges.slice(0, 5).map((badge) => (
                <Badge
                  key={badge.id}
                  variant="outline"
                  className={`${getRarityColor(badge.rarity)} px-3 py-1`}
                >
                  {badge.icon} {badge.nameArabic}
                </Badge>
              ))}
              {userProfile.badges.length > 5 && (
                <Badge variant="outline" className="px-3 py-1">
                  +{userProfile.badges.length - 5} أخرى
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            إجراءات سريعة لكسب النقاط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={() => awardXP("soil_analysis")}
              className="h-auto p-4 flex-col"
              variant="outline"
            >
              <Activity className="h-6 w-6 mb-2 text-green-600" />
              <span className="font-medium">ت��ليل التربة</span>
              <span className="text-xs text-muted-foreground">+15 نقطة</span>
            </Button>

            <Button
              onClick={() => awardXP("disease_detection")}
              className="h-auto p-4 flex-col"
              variant="outline"
            >
              <Target className="h-6 w-6 mb-2 text-red-600" />
              <span className="font-medium">اكتشاف المرض</span>
              <span className="text-xs text-muted-foreground">+25 نقطة</span>
            </Button>

            <Button
              onClick={() => awardXP("crop_recommendation")}
              className="h-auto p-4 flex-col"
              variant="outline"
            >
              <Star className="h-6 w-6 mb-2 text-blue-600" />
              <span className="font-medium">توصية محصول</span>
              <span className="text-xs text-muted-foreground">+20 نقطة</span>
            </Button>

            <Button
              onClick={() => awardXP("daily_login")}
              className="h-auto p-4 flex-col"
              variant="outline"
            >
              <CheckCircle className="h-6 w-6 mb-2 text-purple-600" />
              <span className="font-medium">دخو�� يومي</span>
              <span className="text-xs text-muted-foreground">+5 نقاط</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">الإنجازات</TabsTrigger>
          <TabsTrigger value="leaderboard">المتصدرون</TabsTrigger>
          <TabsTrigger value="activity">النشاط</TabsTrigger>
          <TabsTrigger value="badges">الشارات</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={
                  achievement.completed ? "bg-green-50 border-green-200" : ""
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {achievement.completed && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {achievement.nameArabic}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.descriptionArabic}
                      </p>
                    </div>
                    <Badge
                      variant={achievement.completed ? "default" : "secondary"}
                    >
                      +{achievement.reward.xp} XP
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>التقدم</span>
                      <span>
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.progress / achievement.target) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                لوحة المتصدرين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      index < 3
                        ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-yellow-400">
                      {entry.rank === 1 && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                      {entry.rank === 2 && (
                        <Award className="h-4 w-4 text-gray-600" />
                      )}
                      {entry.rank === 3 && (
                        <Award className="h-4 w-4 text-orange-600" />
                      )}
                      {entry.rank > 3 && (
                        <span className="text-sm font-bold">{entry.rank}</span>
                      )}
                    </div>

                    <Avatar>
                      <AvatarFallback className="bg-green-500 text-white">
                        {entry.currentLevel}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h4 className="font-medium">
                        مزارع #{entry.userId.slice(-4)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        المستوى {entry.currentLevel} •{" "}
                        {entry.totalXP.toLocaleString()} نقطة
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {entry.badgeCount} شارة
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        {entry.streak} يوم
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                آخر الأنشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium">
                        {activity.event.descriptionArabic}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString(
                          "ar-SA",
                        )}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-300"
                    >
                      +{activity.xp} XP
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userProfile?.badges.map((badge) => (
              <Card
                key={badge.id}
                className={`${getRarityColor(badge.rarity)} border-2`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{badge.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{badge.nameArabic}</h3>
                  <p className="text-sm mb-4">{badge.descriptionArabic}</p>
                  <Badge variant="outline" className="mb-2">
                    {badge.rarity === "common" && "عادي"}
                    {badge.rarity === "rare" && "نادر"}
                    {badge.rarity === "epic" && "ملحمي"}
                    {badge.rarity === "legendary" && "أسطوري"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    حصلت عليها في{" "}
                    {new Date(badge.earnedAt).toLocaleDateString("ar-SA")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationDashboard;
