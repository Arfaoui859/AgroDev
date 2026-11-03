import express from "express";

/**
 * Digital Training API.
 *
 * Serves the course catalogue, enrollments, AI tutor models, live sessions and
 * learning paths consumed by client/pages/DigitalTraining.tsx.
 *
 * NOTE: AgroGrowth has no licensed training-content provider wired in, so the
 * catalogue is a curated in-memory demonstration dataset. Every response that
 * carries this content is flagged with `dataSource: "simulated"` so it is never
 * mistaken for a live content feed. Enrollment writes are kept in memory for
 * the session (no persistence layer yet).
 */

const router = express.Router();

const PROVENANCE = {
  dataSource: "simulated" as const,
  isRealData: false,
  disclaimer:
    "محتوى تدريبي توضيحي داخل المنصة وليس مصدراً خارجياً مباشراً.",
};

type Level = "beginner" | "intermediate" | "advanced" | "expert";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: Level;
  duration: number;
  instructor: string;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  price: number;
  language: string;
  tags: string[];
  thumbnail: string;
  syllabus: {
    module: string;
    lessons: { title: string; duration: number; type: string }[];
  }[];
  prerequisites: string[];
  learningOutcomes: string[];
  certification: boolean;
  aiTutor: boolean;
  interactiveElements: string[];
  status: "draft" | "published" | "archived";
  createdDate: string;
  lastUpdated: string;
}

const courses: Course[] = [
  {
    id: "course-irrigation-101",
    title: "أساسيات الري الفعّال",
    description:
      "تعلّم مبادئ الري بالتنقيط والرشّ وحساب الاحتياج المائي للمحاصيل التونسية.",
    category: "irrigation",
    level: "beginner",
    duration: 8,
    instructor: "م. سارة أحمد",
    enrolledCount: 412,
    rating: 4.6,
    reviewCount: 118,
    price: 0,
    language: "ar",
    tags: ["ري", "مياه", "تنقيط"],
    thumbnail: "/images/courses/irrigation.jpg",
    syllabus: [
      {
        module: "المياه والتربة",
        lessons: [
          { title: "دورة الماء في الحقل", duration: 45, type: "video" },
          { title: "قياس رطوبة التربة", duration: 30, type: "interactive" },
        ],
      },
    ],
    prerequisites: [],
    learningOutcomes: ["حساب الاحتياج المائي", "اختيار نظام الري المناسب"],
    certification: true,
    aiTutor: true,
    interactiveElements: ["محاكي الري", "اختبار قصير"],
    status: "published",
    createdDate: "2024-01-12",
    lastUpdated: "2024-06-01",
  },
  {
    id: "course-soil-health",
    title: "صحة التربة والتسميد المتوازن",
    description:
      "تحليل pH والعناصر الغذائية وبناء برنامج تسميد متوازن حسب نتائج التحاليل.",
    category: "soil",
    level: "intermediate",
    duration: 12,
    instructor: "د. أحمد بن صالح",
    enrolledCount: 268,
    rating: 4.8,
    reviewCount: 74,
    price: 45,
    language: "ar",
    tags: ["تربة", "تسميد", "NPK"],
    thumbnail: "/images/courses/soil.jpg",
    syllabus: [
      {
        module: "قراءة تحليل التربة",
        lessons: [
          { title: "pH والملوحة", duration: 40, type: "video" },
          { title: "حساب جرعات NPK", duration: 60, type: "quiz" },
        ],
      },
    ],
    prerequisites: ["course-irrigation-101"],
    learningOutcomes: ["قراءة تقرير تحليل التربة", "بناء برنامج تسميد"],
    certification: true,
    aiTutor: true,
    interactiveElements: ["حاسبة التسميد"],
    status: "published",
    createdDate: "2024-02-03",
    lastUpdated: "2024-05-20",
  },
  {
    id: "course-disease-management",
    title: "إدارة أمراض النبات بالصور",
    description:
      "التعرّف على الأمراض الشائعة في الطماطم والزيتون والحمضيات وطرق الوقاية.",
    category: "crop-protection",
    level: "advanced",
    duration: 10,
    instructor: "م. ليلى المنصوري",
    enrolledCount: 187,
    rating: 4.5,
    reviewCount: 52,
    price: 60,
    language: "fr",
    tags: ["أمراض", "وقاية", "مبيدات"],
    thumbnail: "/images/courses/disease.jpg",
    syllabus: [
      {
        module: "التشخيص البصري",
        lessons: [
          { title: "علامات الإصابة المبكرة", duration: 35, type: "video" },
          { title: "تدريب على الصور", duration: 50, type: "interactive" },
        ],
      },
    ],
    prerequisites: ["course-soil-health"],
    learningOutcomes: ["التشخيص البصري", "خطة وقاية متكاملة"],
    certification: true,
    aiTutor: true,
    interactiveElements: ["مختبر صور"],
    status: "published",
    createdDate: "2024-03-08",
    lastUpdated: "2024-06-10",
  },
];

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  enrollmentDate: string;
  progress: number;
  completedLessons: string[];
  currentLesson: string;
  timeSpent: number;
  lastAccessed: string;
  certificateEarned: boolean;
  certificateDate?: string;
  finalScore?: number;
  status: "active" | "completed" | "dropped" | "paused";
}

const enrollments: Enrollment[] = [
  {
    id: "enr-1",
    userId: "user-123",
    courseId: "course-irrigation-101",
    courseName: "أساسيات الري الفعّال",
    enrollmentDate: "2024-05-01",
    progress: 62,
    completedLessons: ["دورة الماء في الحقل"],
    currentLesson: "قياس رطوبة التربة",
    timeSpent: 190,
    lastAccessed: "2024-06-12T09:30:00.000Z",
    certificateEarned: false,
    status: "active",
  },
];

const aiModels = [
  {
    id: "ai-tutor-reco",
    name: "محرّك التوصيات التعليمية",
    type: "recommendation" as const,
    description: "يقترح المسار والدورات المناسبة حسب ملف المزارع واحتياجاته.",
    accuracy: 82,
    trainingData: "بيانات تفاعل داخلية (محاكاة)",
    lastTrained: "2024-05-30",
    usage: 1420,
    status: "active" as const,
    metrics: { precision: 0.79, recall: 0.74, f1Score: 0.76, userSatisfaction: 4.2 },
    applications: ["اقتراح دورات", "تخصيص المحتوى"],
  },
  {
    id: "ai-assessor",
    name: "مقيّم المهارات الزراعية",
    type: "assessment" as const,
    description: "يقيّم مستوى المتعلّم عبر اختبارات تفاعلية قصيرة.",
    accuracy: 76,
    trainingData: "بنك أسئلة داخلي (محاكاة)",
    lastTrained: "2024-04-18",
    usage: 860,
    status: "testing" as const,
    metrics: { precision: 0.72, recall: 0.69, f1Score: 0.7, userSatisfaction: 3.9 },
    applications: ["تقييم المستوى"],
  },
];

const sessions = [
  {
    id: "sess-1",
    title: "ورشة مباشرة: الري الذكي",
    type: "live" as const,
    instructor: "م. سارة أحمد",
    startTime: "2024-06-25T14:00:00.000Z",
    duration: 90,
    capacity: 100,
    enrolled: 64,
    description: "ورشة تطبيقية حول جدولة الري باستخدام بيانات الطقس.",
    materials: ["عرض تقديمي", "ورقة عمل"],
    category: "irrigation",
    level: "intermediate",
    language: "ar",
    price: 0,
    status: "scheduled" as const,
    feedback: [],
  },
];

const learningPaths = [
  {
    id: "path-smart-farming",
    name: "مسار الزراعة الذكية",
    description: "مسار متكامل من الري إلى إدارة الأمراض باستخدام أدوات المنصة.",
    category: "smart-farming",
    difficulty: "intermediate" as const,
    estimatedDuration: 8,
    courses: ["course-irrigation-101", "course-soil-health", "course-disease-management"],
    prerequisites: [],
    outcomes: ["إدارة مزرعة ذكية", "اتخاذ قرارات مبنية على البيانات"],
    certification: "شهادة الزراعة الذكية",
    enrolledCount: 156,
    completionRate: 47,
    aiPersonalized: true,
    adaptiveContent: true,
  },
];

router.get("/courses", (req, res) => {
  const { category, level, language } = req.query;
  let result = courses.filter((c) => c.status === "published");
  if (category) result = result.filter((c) => c.category === category);
  if (level) result = result.filter((c) => c.level === level);
  if (language) result = result.filter((c) => c.language === language);
  res.json(result);
});

router.get("/courses/:courseId", (req, res) => {
  const course = courses.find((c) => c.id === req.params.courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

router.get("/enrollments", (_req, res) => {
  res.json(enrollments);
});

router.post("/enrollments", (req, res) => {
  const { courseId, userId = "user-123" } = req.body ?? {};
  const course = courses.find((c) => c.id === courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const existing = enrollments.find(
    (e) => e.courseId === courseId && e.userId === userId,
  );
  if (existing) return res.status(409).json({ error: "Already enrolled", enrollment: existing });

  const enrollment: Enrollment = {
    id: `enr-${Date.now()}`,
    userId,
    courseId,
    courseName: course.title,
    enrollmentDate: new Date().toISOString(),
    progress: 0,
    completedLessons: [],
    currentLesson: course.syllabus[0]?.lessons[0]?.title ?? "",
    timeSpent: 0,
    lastAccessed: new Date().toISOString(),
    certificateEarned: false,
    status: "active",
  };
  enrollments.push(enrollment);
  course.enrolledCount += 1;
  res.status(201).json(enrollment);
});

router.patch("/enrollments/:enrollmentId/progress", (req, res) => {
  const enrollment = enrollments.find((e) => e.id === req.params.enrollmentId);
  if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

  const progress = Number(req.body?.progress);
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    return res.status(400).json({ error: "progress must be a number between 0 and 100" });
  }
  enrollment.progress = Math.round(progress);
  enrollment.lastAccessed = new Date().toISOString();
  if (enrollment.progress >= 100) {
    enrollment.status = "completed";
    enrollment.certificateEarned = true;
    enrollment.certificateDate = new Date().toISOString();
  }
  res.json(enrollment);
});

router.get("/ai-models", (_req, res) => {
  res.json(aiModels);
});

router.get("/sessions", (_req, res) => {
  res.json(sessions);
});

router.get("/learning-paths", (_req, res) => {
  res.json(learningPaths);
});

router.get("/dashboard", (_req, res) => {
  res.json({
    totalCourses: courses.length,
    totalEnrollments: enrollments.length,
    activeLearners: new Set(enrollments.map((e) => e.userId)).size,
    completedCourses: enrollments.filter((e) => e.status === "completed").length,
    averageProgress:
      enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length,
          )
        : 0,
    ...PROVENANCE,
  });
});

export default router;
