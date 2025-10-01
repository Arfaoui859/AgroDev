import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  Bot,
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Settings,
  User,
  Lightbulb,
  TrendingUp,
  Calendar,
  MapPin,
  Leaf,
  Droplets,
  Sun,
  CloudRain,
  DollarSign,
  BarChart3,
  Zap,
  Brain,
  Globe,
  Phone,
  Star,
  FileText,
  Download,
  Share2,
  Copy,
  RefreshCw,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Bookmark,
  Tag
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: 'ar' | 'en' | 'fr';
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestions?: string[];
    actionItems?: string[];
    relatedTopics?: string[];
  };
  attachments?: {
    type: 'image' | 'document' | 'chart';
    url: string;
    name: string;
  }[];
  reactions?: {
    helpful: number;
    thumbsUp: number;
    thumbsDown: number;
  };
  category?: 'agriculture' | 'finance' | 'weather' | 'market' | 'general';
}

interface UserProfile {
  name: string;
  location: string;
  language: 'ar' | 'en' | 'fr';
  farmSize: number;
  crops: string[];
  experience: 'beginner' | 'intermediate' | 'expert';
  preferences: {
    notifications: boolean;
    voiceEnabled: boolean;
    autoTranslate: boolean;
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
}

const AIAssistantChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en' | 'fr'>('ar');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'أحمد المزارع',
    location: 'الرياض، السعودية',
    language: 'ar',
    farmSize: 150,
    crops: ['قمح', 'ذرة', 'طماطم'],
    experience: 'intermediate',
    preferences: {
      notifications: true,
      voiceEnabled: false,
      autoTranslate: false
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChatbot();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatbot = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const welcomeMessage: ChatMessage = {
      id: 'welcome-1',
      type: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date().toISOString(),
      language: language,
      metadata: {
        confidence: 100,
        suggestions: [
          'ما هو أفضل محصول للزراعة في موسمي؟',
          'كيف يمكنني تحسين إنتاجية مزرعتي؟',
          'ما هي أسعار السوق الحالية؟',
          'متى أفضل وقت لبيع المحصول؟'
        ],
        relatedTopics: ['زراعة', 'استثمار', 'طقس', 'أسواق']
      },
      category: 'general'
    };

    setMessages([welcomeMessage]);
    generateQuickActions();
    loadConversations();
    setIsLoading(false);
  };

  const getWelcomeMessage = () => {
    const messages = {
      ar: `مرحباً بك في المساعد الذكي للقرارات الزراعية! 🌱

أنا هنا لمساعدت�� في:
🌾 اختيار أفضل المحاصيل
💧 تحسين أنظمة الري
📈 تحليل الأسواق والأسعار
🌤️ التنبؤات المناخية
💰 تحليل الربحية والاستثمار
🔬 تشخيص الأمراض والآفات

يمكنني التحدث باللغة العربية والإنجليزية والفرنسية. كيف يمكنني مساعدتك اليوم؟`,
      en: `Welcome to the Smart Agricultural Decision Assistant! 🌱

I'm here to help you with:
🌾 Choosing the best crops
💧 Optimizing irrigation systems
📈 Market and price analysis
🌤️ Weather forecasting
💰 Profitability and investment analysis
🔬 Disease and pest diagnosis

I can communicate in Arabic, English, and French. How can I help you today?`,
      fr: `Bienvenue dans l'Assistant Intelligent pour les Décisions Agricoles! 🌱

Je suis là pour vous aider avec:
🌾 Choisir les meilleures cultures
💧 Optimiser les systèmes d'irrigation
📈 Analyse du marché et des prix
🌤️ Prévisions météorologiques
💰 Analyse de rentabilité et d'investissement
🔬 Diagnostic des maladies et ravageurs

Je peux communiquer en arabe, anglais et français. Comment puis-je vous aider aujourd'hui?`
    };
    return messages[language];
  };

  const generateQuickActions = () => {
    const actions = {
      ar: [
        'أفضل محصول للموسم القادم',
        'تحليل ربحية المحاصيل',
        'توقعات الطقس',
        'أسعار السوق اليوم',
        'نصائح الري',
        'تشخيص أمراض النباتات'
      ],
      en: [
        'Best crop for next season',
        'Crop profitability analysis',
        'Weather forecast',
        'Today\'s market prices',
        'Irrigation tips',
        'Plant disease diagnosis'
      ],
      fr: [
        'Meilleure culture pour la saison',
        'Analyse de rentabilité',
        'Prévisions météo',
        'Prix du marché aujourd\'hui',
        'Conseils d\'irrigation',
        'Diagnostic des maladies'
      ]
    };
    setQuickActions(actions[language]);
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || input;
    if (!messageContent.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      language: language,
      category: 'general'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

      const aiResponse = await generateAIResponse(messageContent);
      setMessages(prev => [...prev, aiResponse]);

      // Update conversation
      updateActiveConversation(userMessage, aiResponse);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getErrorMessage(),
        timestamp: new Date().toISOString(),
        language: language,
        category: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userInput: string): Promise<ChatMessage> => {
    const input = userInput.toLowerCase();
    
    // Agricultural advice responses
    if (input.includes('محصول') || input.includes('زراعة') || input.includes('crop') || input.includes('culture')) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getCropAdviceResponse(),
        timestamp: new Date().toISOString(),
        language: language,
        metadata: {
          confidence: 92,
          sources: ['بيانات المناخ', 'أسعار السوق', 'خبرة المزارعين'],
          suggestions: [
            'تفاصيل زراعة الطماطم',
            'أفضل أوقات الزراعة',
            'متطلبات التربة'
          ],
          actionItems: [
            'تحليل التربة',
            'تجهيز الأرض',
            'شراء البذور',
            'وضع خطة الري'
          ],
          relatedTopics: ['تسميد', 'ري', 'مكافحة آفات']
        },
        category: 'agriculture'
      };
    }

    // Market and pricing responses
    if (input.includes('سعر') || input.includes('سوق') || input.includes('بيع') || input.includes('price') || input.includes('market') || input.includes('prix')) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getMarketAnalysisResponse(),
        timestamp: new Date().toISOString(),
        language: language,
        metadata: {
          confidence: 88,
          sources: ['بيانات البورصة', 'تقارير السوق', 'التحليل الفني'],
          suggestions: [
            'توقعات الأسعار لـ30 يوم',
            'أفضل منافذ ال��يع',
            'توقيت البيع المثالي'
          ],
          relatedTopics: ['تصدير', 'تسويق', 'تخزين']
        },
        category: 'market'
      };
    }

    // Weather and climate responses
    if (input.includes('طقس') || input.includes('مناخ') || input.includes('مطر') || input.includes('weather') || input.includes('climate') || input.includes('météo')) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getWeatherAdviceResponse(),
        timestamp: new Date().toISOString(),
        language: language,
        metadata: {
          confidence: 85,
          sources: ['الأرصاد الجوية', 'النماذج المناخية', 'البيانات التاريخية'],
          suggestions: [
            'تحضيرات للموجة الحارة',
            'خطة الحماية من الأمطار',
            'جدولة الري'
          ],
          relatedTopics: ['حماية المحاصيل', 'البيوت المحمية', 'التأمين الزراعي']
        },
        category: 'weather'
      };
    }

    // Irrigation responses
    if (input.includes('ري') || input.includes('مياه') || input.includes('irrigation') || input.includes('water') || input.includes('irrigation')) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getIrrigationAdviceResponse(),
        timestamp: new Date().toISOString(),
        language: language,
        metadata: {
          confidence: 90,
          sources: ['هندسة الري', 'كفاءة المياه', 'التقنيات الحديثة'],
          suggestions: [
            'حساب احتياجات المياه',
            'أنظمة الري الذكية',
            'توفير المياه'
          ],
          relatedTopics: ['تنقيط', 'رش', 'أتمتة']
        },
        category: 'agriculture'
      };
    }

    // Financial advice responses
    if (input.includes('ربح') || input.includes('تكلفة') || input.includes('استثمار') || input.includes('profit') || input.includes('investment') || input.includes('investissement')) {
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getFinancialAdviceResponse(),
        timestamp: new Date().toISOString(),
        language: language,
        metadata: {
          confidence: 87,
          sources: ['التحليل المالي', 'دراسات الجدوى', 'الخبرة العملية'],
          suggestions: [
            'حساب ��لعائد على الاستثمار',
            'تقليل التكاليف',
            'زيادة الإيرادات'
          ],
          relatedTopics: ['قروض زراعية', 'تأمين', 'ضرائب']
        },
        category: 'finance'
      };
    }

    // Default response
    return {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: getDefaultResponse(),
      timestamp: new Date().toISOString(),
      language: language,
      metadata: {
        confidence: 75,
        suggestions: quickActions.slice(0, 4),
        relatedTopics: ['زراعة', 'أسواق', 'طقس', 'استثمار']
      },
      category: 'general'
    };
  };

  const getCropAdviceResponse = () => {
    const responses = {
      ar: `🌱 **توصياتي للمحاصيل الموسمية:**

📊 **التحليل الحالي:**
• الطقس: مثالي للزراعة (24°C، رطوبة 62%)
• السوق: طلب عالي على الخضروات
• التربة: حالة جيدة (pH 6.8)

🎯 **أفضل الخيارات:**
1️⃣ **الطماطم** - ربحية 45%
   • موسم الذروة قادم
   • أسعار مرتفعة (3.25 ريال/كغ)
   • دورة نمو 3-4 أشهر

2️⃣ **الخضروات الورقية** - عائد س��يع
   • الخس والجرجير والسبانخ
   • دورة 6-8 أسابيع
   • طلب مستمر من المطاعم

3️⃣ **الخيار** - استقرار السوق
   • أسعار ثابتة
   • مقاومة الأمراض
   • متطلبات مياه معتدلة

💡 **نصائح إضافية:**
• ازرع على دفعات للحصول على محصول مستمر
• استخدم الري بالتنقيط لتوفير المياه
• راقب تقلبات السوق قبل الحصاد`,

      en: `🌱 **My Seasonal Crop Recommendations:**

📊 **Current Analysis:**
• Weather: Ideal for planting (24°C, 62% humidity)
• Market: High demand for vegetables
• Soil: Good condition (pH 6.8)

🎯 **Best Options:**
1️⃣ **Tomatoes** - 45% profitability
   • Peak season approaching
   • High prices (3.25 SAR/kg)
   • 3-4 month growth cycle

2️⃣ **Leafy Greens** - Quick returns
   • Lettuce, arugula, spinach
   • 6-8 week cycle
   • Continuous restaurant demand

3️⃣ **Cucumber** - Market stability
   • Stable prices
   • Disease resistance
   • Moderate water requirements

💡 **Additional Tips:**
• Plant in batches for continuous harvest
• Use drip irrigation to save water
• Monitor market fluctuations before harvest`,

      fr: `🌱 **Mes Recommandations de Cultures Saisonnières:**

📊 **Analyse Actuelle:**
• Météo: Idéale pour la plantation (24°C, 62% d'humidité)
• Marché: Forte demande pour les légumes
• Sol: Bonne condition (pH 6.8)

🎯 **Meilleures Options:**
1️⃣ **Tomates** - 45% de rentabilité
   • Saison de pointe approche
   • Prix élevés (3.25 SAR/kg)
   • Cycle de croissance 3-4 mois

2️⃣ **Légumes Verts** - Retours rapides
   • Laitue, roquette, épinards
   • Cycle de 6-8 semaines
   • Demande continue des restaurants

3️⃣ **Concombre** - Stabilité du marché
   • Prix stables
   • Résistance aux maladies
   • Besoins en eau modérés

💡 **Conseils Supplémentaires:**
• Plantez par lots pour une récolte continue
• Utilisez l'irrigation goutte à goutte pour économiser l'eau
• Surveillez les fluctuations du marché avant la récolte`
    };
    return responses[language];
  };

  const getMarketAnalysisResponse = () => {
    const responses = {
      ar: `📈 **تحليل السوق والأسعار:**

💰 **الأسعار الحالية (ريال/كغ):**
• طماطم: 3.25 ↗️ (+25%)
• قمح: 0.48 ↗️ (+15%)
• ذرة: 0.42 ➡️ (مستقر)
• زيتون: 4.80 ↘️ (-5%)
• بطاطس: 1.95 ↗️ (+18%)

📊 **التوقعات (30 يوم):**
• الطماطم: ارتفاع إلى 3.45 ريال
• القمح: ارتفاع إلى 0.52 ريال
• البطاطس: ارتفاع إ��ى 2.10 ريال

🎯 **توصيات البيع:**
✅ **بع الآن:** الطماطم والبطاطس
• الطلب في ذروته
• الأسعار مرتفعة

⏳ **انتظر 2-3 أسابيع:** القمح
• توقعات ارتفاع إضافي 8-10%
• العرض منخفض عالمياً

📍 **أفضل منافذ البيع:**
• السوق المركزي (أعلى أسعار)
• التعاقد المباشر مع المطاعم
• التصدير لدول الخليج

💡 **نصائح تسويقية:**
• فرز المنتج حسب الجودة
• التعبئة الجذابة تزيد السعر 10%
• التوقيت المناسب يحدد الربح`,

      en: `📈 **Market & Price Analysis:**

💰 **Current Prices (SAR/kg):**
• Tomatoes: 3.25 ↗️ (+25%)
• Wheat: 0.48 ↗️ (+15%)
• Corn: 0.42 ➡️ (stable)
• Olives: 4.80 ↘️ (-5%)
• Potatoes: 1.95 ↗️ (+18%)

📊 **30-Day Forecast:**
• Tomatoes: Rise to 3.45 SAR
• Wheat: Rise to 0.52 SAR
• Potatoes: Rise to 2.10 SAR

🎯 **Selling Recommendations:**
✅ **Sell Now:** Tomatoes and Potatoes
• Demand at peak
• High prices

⏳ **Wait 2-3 weeks:** Wheat
• Expected additional 8-10% increase
• Low global supply

📍 **Best Sales Outlets:**
• Central Market (highest prices)
• Direct restaurant contracts
• Export to Gulf countries

💡 **Marketing Tips:**
• Sort products by quality
• Attractive packaging increases price 10%
• Proper timing determines profit`,

      fr: `📈 **Analyse du Marché et des Prix:**

💰 **Prix Actuels (SAR/kg):**
• Tomates: 3.25 ↗️ (+25%)
• Blé: 0.48 ↗️ (+15%)
• Maïs: 0.42 ➡️ (stable)
• Olives: 4.80 ↘️ (-5%)
• Pommes de terre: 1.95 ↗️ (+18%)

📊 **Prévisions (30 jours):**
• Tomates: Hausse à 3.45 SAR
• Blé: Hausse à 0.52 SAR
• Pommes de terre: Hausse à 2.10 SAR

🎯 **Recommandations de Vente:**
✅ **Vendez maintenant:** Tomates et pommes de terre
• Demande au sommet
• Prix élevés

⏳ **Attendez 2-3 semaines:** Blé
• Augmentation supplémentaire attendue de 8-10%
• Offre mondiale faible

📍 **Meilleurs Points de Vente:**
• Marché central (prix les plus élevés)
• Contrats directs avec restaurants
• Export vers pays du Golfe

💡 **Conseils Marketing:**
• Trier les produits par qualité
• Emballage attractif augmente prix de 10%
• Le bon timing détermine le profit`
    };
    return responses[language];
  };

  const getWeatherAdviceResponse = () => {
    const responses = {
      ar: `🌤️ **التوقعات الم��اخية والنصائح:**

📊 **الوضع الحالي:**
• درجة الحرارة: 24°C (مثالية)
• الرطوبة: 62% (معتدلة)
• الأمطار: 8mm (خفيفة)
• الرياح: 15 كم/س (معتدلة)

📅 **توقعات الأسبوع:**
🌡️ **الأيام القادمة:**
• السبت-الأحد: 25-26°C، مشمس
• الاثنين-الثلاثاء: 22-23°C، أمطار خفيفة
• الأربعاء-الخميس: 24-27°C، غائم جزئياً
• الجمعة: 28°C، مشمس

⚠️ **تنبيهات مهمة:**
🔥 **موجة حارة قادمة:**
• الأسبوع القادم: 35-38°C
• مدة التأثير: 4-5 أيام
• خطر على المحاصيل الحساسة

🌧️ **أمطار متوقعة:**
• الثلاثاء-الأربعاء: 15-20mm
• فرصة رعد: 30%
• تحسن الرطوبة في التربة

💡 **إجراءات وقائية:**
🛡️ **للموجة الحارة:**
• زيادة الري 30-40%
• ري في الساعات المبكرة (4-6 ص)
• تظليل المحاصيل الحساسة
• فحص أنظمة التبريد

🌧️ **للأمطار:**
• تفقد أنظمة التصريف
• حماية المحاصيل من التشبع
• استعداد لجمع مياه الأمطار
• تجنب الحراثة في الطين`,

      en: `🌤️ **Weather Forecast & Advice:**

📊 **Current Conditions:**
• Temperature: 24°C (ideal)
• Humidity: 62% (moderate)
• Rainfall: 8mm (light)
• Wind: 15 km/h (moderate)

📅 **Weekly Forecast:**
🌡️ **Coming Days:**
• Sat-Sun: 25-26°C, sunny
• Mon-Tue: 22-23°C, light rain
• Wed-Thu: 24-27°C, partly cloudy
• Friday: 28°C, sunny

⚠️ **Important Alerts:**
🔥 **Heat Wave Coming:**
• Next week: 35-38°C
• Duration: 4-5 days
• Risk to sensitive crops

🌧️ **Expected Rainfall:**
• Tue-Wed: 15-20mm
• Thunder chance: 30%
• Soil moisture improvement

💡 **Preventive Measures:**
🛡️ **For Heat Wave:**
• Increase irrigation 30-40%
• Water early hours (4-6 AM)
• Shade sensitive crops
• Check cooling systems

🌧️ **For Rainfall:**
• Check drainage systems
• Protect crops from waterlogging
• Prepare for rainwater collection
• Avoid tilling in mud`,

      fr: `🌤️ **Prévisions Météorologiques et Conseils:**

📊 **Conditions Actuelles:**
• Température: 24°C (idéale)
• Humidité: 62% (modérée)
• Précipitations: 8mm (légères)
• Vent: 15 km/h (modéré)

📅 **Prévisions Hebdomadaires:**
🌡️ **Jours à Venir:**
• Sam-Dim: 25-26°C, ensoleillé
• Lun-Mar: 22-23°C, pluie légère
• Mer-Jeu: 24-27°C, partiellement nuageux
• Vendredi: 28°C, ensoleillé

⚠️ **Alertes Importantes:**
🔥 **Vague de Chaleur Approche:**
• Semaine prochaine: 35-38°C
• Durée: 4-5 jours
• Risque pour cultures sensibles

🌧️ **Précipitations Attendues:**
• Mar-Mer: 15-20mm
• Chance d'orage: 30%
• Amélioration humidité sol

💡 **Mesures Préventives:**
🛡️ **Pour la Vague de Chaleur:**
• Augmenter irrigation 30-40%
• Arroser tôt le matin (4-6h)
• Ombrager cultures sensibles
• Vérifier systèmes de refroidissement

🌧️ **Pour les Précipitations:**
• Vérifier systèmes de drainage
• Protéger cultures de l'engorgement
• Préparer collecte eau de pluie
• Éviter labour dans la boue`
    };
    return responses[language];
  };

  const getIrrigationAdviceResponse = () => {
    const responses = {
      ar: `💧 **نصائح تحسين نظام الري:**

🔍 **تقييم الوضع الحالي:**
• نوع النظام: ${userProfile.farmSize > 100 ? 'ري محوري/تنقيط' : 'تنقيط/رش'}
• كفاءة الاستخدام: 65% (يمكن تحسينها)
• استهلاك المياه: ${Math.round(userProfile.farmSize * 4.5)} لتر/يوم
• تكلفة المياه: ${Math.round(userProfile.farmSize * 0.12)} ريال/يوم

⚡ **حلول توفير المياه:**
1️⃣ **نظام الري الذكي**
   • توفير: 30-40% من المياه
   • تكلفة التركيب: ${Math.round(userProfile.farmSize * 80)} ريال
   • عائد الاستثمار: 18 شهر

2️⃣ **أجهزة استشعار الرطوبة**
   • مراقبة دقيقة لحاجة النبات
   • منع الري المفرط
   • تحسين جودة المحصول

3️⃣ **جدولة الري المثلى**
   • الري في ساعات البرد (4-6 ص، 7-9 م)
   • تقليل التبخر بنسبة 25%
   • توزيع متوازن للمياه

📊 **حساب الاحتياجات:**
🌱 **المحاصيل الحالية:**`,

      en: `💧 **Irrigation System Optimization Tips:**

🔍 **Current Status Assessment:**
• System type: ${userProfile.farmSize > 100 ? 'Center pivot/Drip' : 'Drip/Sprinkler'}
• Usage efficiency: 65% (can be improved)
• Water consumption: ${Math.round(userProfile.farmSize * 4.5)} L/day
• Water cost: ${Math.round(userProfile.farmSize * 0.12)} SAR/day

⚡ **Water Saving Solutions:**
1️⃣ **Smart Irrigation System**
   • Savings: 30-40% water
   • Installation cost: ${Math.round(userProfile.farmSize * 80)} SAR
   • ROI: 18 months

2️⃣ **Soil Moisture Sensors**
   • Precise plant need monitoring
   • Prevent over-irrigation
   • Improve crop quality

3️⃣ **Optimal Irrigation Scheduling**
   • Water during cool hours (4-6 AM, 7-9 PM)
   • Reduce evaporation by 25%
   • Balanced water distribution

📊 **Needs Calculation:**
🌱 **Current Crops:**`,

      fr: `💧 **Conseils d'Optimisation du Système d'Irrigation:**

🔍 **Évaluation de l'État Actuel:**
• Type de système: ${userProfile.farmSize > 100 ? 'Pivot central/Goutte-à-goutte' : 'Goutte-à-goutte/Aspersion'}
• Efficacité d'utilisation: 65% (peut être améliorée)
• Consommation d'eau: ${Math.round(userProfile.farmSize * 4.5)} L/jour
• Coût de l'eau: ${Math.round(userProfile.farmSize * 0.12)} SAR/jour

⚡ **Solutions d'Économie d'Eau:**
1️⃣ **Système d'Irrigation Intelligent**
   • Économies: 30-40% d'eau
   • Coût d'installation: ${Math.round(userProfile.farmSize * 80)} SAR
   • ROI: 18 mois

2️⃣ **Capteurs d'Humidité du Sol**
   • Surveillance précise des besoins des plantes
   • Éviter la sur-irrigation
   • Améliorer la qualité des cultures

3️⃣ **Programmation Optimale de l'Irrigation**
   • Arroser pendant les heures fraîches (4-6h, 19-21h)
   • Réduire l'évaporation de 25%
   • Distribution équilibrée de l'eau

📊 **Calcul des Besoins:**
🌱 **Cultures Actuelles:**`
    };
    return responses[language];
  };

  const getFinancialAdviceResponse = () => {
    const responses = {
      ar: `💰 **التحليل المالي والاستثماري:**

📊 **الوضع المالي الحالي:**
• حجم المزرعة: ${userProfile.farmSize} هكتار
• القيمة المقدرة: ${(userProfile.farmSize * 25000).toLocaleString()} ريال
• الإيرادات الشهرية: ${(userProfile.farmSize * 850).toLocaleString()} ريال
• التكاليف الشهرية: ${(userProfile.farmSize * 420).toLocaleString()} ريال
• صافي الربح: ${(userProfile.farmSize * 430).toLocaleString()} ريال

📈 **فرص تحسين الربحية:**
1️⃣ **تنويع المحاصيل** (+25% ربحية)
   • زراعة محاصيل عالية القيمة
   • تقليل المخاطر السوقية
   • استغلال المواسم المختلفة

2️⃣ **تحسين كفاءة الإنتاج** (+20% توفير)
   • أتمتة أنظمة الري
   • استخدام الأسمدة الذكية
   • مراقبة المحاصيل بالتقنيات الحديثة

3️⃣ **التس��يق المباشر** (+35% هامش ربح)
   • البيع للمستهلك مباشرة
   • التعاقد مع المطاعم والفنادق
   • المنصات الإلكترونية

💡 **استثمارات مقترحة:**
🌱 **قصيرة المدى (3-6 أشهر):**
• نظام ري ذكي: ${Math.round(userProfile.farmSize * 80)} ريال
• عائد متوقع: 35% سنوياً

🌳 **متوسطة المدى (1-2 سنة):**
• بيوت محمية: ${Math.round(userProfile.farmSize * 200)} ريال
• عائد متوقع: 45% سنوياً

🏭 **طويلة المدى (3-5 سنوات):**
• معدات تصنيع: ${Math.round(userProfile.farmSize * 500)} ريال
• عائد متوقع: 25% سنوياً

🛡️ **إدارة المخاطر:**
• تأمين زراعي: 2% من قيمة المحصول
• صندوق طوارئ: 10% من الأرباح
• تنويع مصادر الدخل`,

      en: `💰 **Financial & Investment Analysis:**

📊 **Current Financial Position:**
• Farm size: ${userProfile.farmSize} hectares
• Estimated value: ${(userProfile.farmSize * 25000).toLocaleString()} SAR
• Monthly revenue: ${(userProfile.farmSize * 850).toLocaleString()} SAR
• Monthly costs: ${(userProfile.farmSize * 420).toLocaleString()} SAR
• Net profit: ${(userProfile.farmSize * 430).toLocaleString()} SAR

📈 **Profitability Improvement Opportunities:**
1️⃣ **Crop Diversification** (+25% profitability)
   • Grow high-value crops
   • Reduce market risks
   • Utilize different seasons

2️⃣ **Production Efficiency** (+20% savings)
   • Automate irrigation systems
   • Use smart fertilizers
   • Monitor crops with modern technology

3️⃣ **Direct Marketing** (+35% profit margin)
   • Sell directly to consumers
   • Contract with restaurants and hotels
   • Electronic platforms

💡 **Recommended Investments:**
🌱 **Short-term (3-6 months):**
• Smart irrigation: ${Math.round(userProfile.farmSize * 80)} SAR
• Expected return: 35% annually

🌳 **Medium-term (1-2 years):**
• Greenhouses: ${Math.round(userProfile.farmSize * 200)} SAR
• Expected return: 45% annually

🏭 **Long-term (3-5 years):**
• Processing equipment: ${Math.round(userProfile.farmSize * 500)} SAR
• Expected return: 25% annually

🛡️ **Risk Management:**
• Agricultural insurance: 2% of crop value
• Emergency fund: 10% of profits
• Income source diversification`,

      fr: `💰 **Analyse Financière et d'Investissement:**

📊 **Position Financière Actuelle:**
• Taille de la ferme: ${userProfile.farmSize} hectares
• Valeur estimée: ${(userProfile.farmSize * 25000).toLocaleString()} SAR
• Revenus mensuels: ${(userProfile.farmSize * 850).toLocaleString()} SAR
• Coûts mensuels: ${(userProfile.farmSize * 420).toLocaleString()} SAR
• Profit net: ${(userProfile.farmSize * 430).toLocaleString()} SAR

📈 **Opportunités d'Amélioration de la Rentabilité:**
1️⃣ **Diversification des Cultures** (+25% rentabilité)
   • Cultiver des cultures à haute valeur
   • Réduire les risques de marché
   • Utiliser différentes saisons

2️⃣ **Efficacité de Production** (+20% économies)
   • Automatiser systèmes d'irrigation
   • Utiliser engrais intelligents
   • Surveiller cultures avec technologie moderne

3️⃣ **Marketing Direct** (+35% marge bénéficiaire)
   • Vendre directement aux consommateurs
   • Contracter avec restaurants et hôtels
   • Plateformes électroniques

💡 **Investissements Recommandés:**
🌱 **Court terme (3-6 mois):**
• Irrigation intelligente: ${Math.round(userProfile.farmSize * 80)} SAR
• Retour attendu: 35% annuellement

🌳 **Moyen terme (1-2 ans):**
• Serres: ${Math.round(userProfile.farmSize * 200)} SAR
• Retour attendu: 45% annuellement

🏭 **Long terme (3-5 ans):**
• Équipement de transformation: ${Math.round(userProfile.farmSize * 500)} SAR
• Retour attendu: 25% annuellement

🛡️ **Gestion des Risques:**
• Assurance agricole: 2% de la valeur des cultures
• Fonds d'urgence: 10% des profits
• Diversification des sources de revenus`
    };
    return responses[language];
  };

  const getDefaultResponse = () => {
    const responses = {
      ar: `أفهم استفسارك وأقدر ثقتك بي. كمساعد ذكي متخصص في القرارات الزراعية، يمكنني مساعدتك في:

🌾 **المجالات الزراعية:**
• اختيار أفضل المحاصيل للموسم
• تحسين أنظمة الري والتسميد
• مكافحة الآفات والأمراض
• تحليل التربة والظروف المناخية

📊 **التحليل الاقتصادي:**
• دراسة الأسواق والأسعار
• حساب الربحية والعائد على الاستثمار
• تحليل التكاليف والمخاطر
• فرص التمويل والدعم

🌤️ **المعلومات المناخية:**
• التنبؤات الجوية وتأثيرها
• أفضل أوقات الزراعة والحصاد
• الاستعداد للظروف الجوية الطارئة

💡 **يمكنك سؤالي عن:**
• "ما أفضل محصول للزراعة الآن؟"
• "كيف أحسن من ربحية مزرعتي؟"
• "متى أفضل وقت لبيع المحصول؟"
• "كيف أوفر في استهلاك المياه؟"

كيف يمكنني مساعدتك اليوم؟`,

      en: `I understand your question and appreciate your trust in me. As a smart assistant specialized in agricultural decisions, I can help you with:

🌾 **Agricultural Areas:**
• Choosing the best crops for the season
• Improving irrigation and fertilization systems
• Pest and disease control
• Soil analysis and climate conditions

📊 **Economic Analysis:**
• Market and price studies
• Profitability and ROI calculations
• Cost and risk analysis
• Financing and support opportunities

🌤️ **Climate Information:**
• Weather forecasts and their impact
• Best planting and harvesting times
• Preparation for emergency weather conditions

💡 **You can ask me about:**
• "What's the best crop to plant now?"
• "How can I improve my farm's profitability?"
• "When is the best time to sell crops?"
• "How can I save on water consumption?"

How can I help you today?`,

      fr: `Je comprends votre question et j'apprécie votre confiance en moi. En tant qu'assistant intelligent spécialisé dans les décisions agricoles, je peux vous aider avec:

🌾 **Domaines Agricoles:**
• Choisir les meilleures cultures pour la saison
• Améliorer les systèmes d'irrigation et de fertilisation
• Contrôle des ravageurs et maladies
• Analyse du sol et conditions climatiques

📊 **Analyse Économique:**
• Études de marché et des prix
• Calculs de rentabilité et ROI
• Analyse des coûts et risques
• Opportunités de financement et de soutien

🌤️ **Informations Climatiques:**
• Prévisions météorologiques et leur impact
• Meilleurs moments de plantation et récolte
• Préparation aux conditions météorologiques d'urgence

💡 **Vous pouvez me demander:**
• "Quelle est la meilleure culture à planter maintenant?"
• "Comment puis-je améliorer la rentabilité de ma ferme?"
• "Quand est le meilleur moment pour vendre les récoltes?"
• "Comment puis-je économiser sur la consommation d'eau?"

Comment puis-je vous aider aujourd'hui?`
    };
    return responses[language];
  };

  const getErrorMessage = () => {
    const messages = {
      ar: 'عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى أو إعادة صياغة سؤالك.',
      en: 'Sorry, a system error occurred. Please try again or rephrase your question.',
      fr: 'Désolé, une erreur système s\'est produite. Veuillez réessayer ou reformuler votre question.'
    };
    return messages[language];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR';
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };
    }
  };

  const toggleLanguage = (newLang: 'ar' | 'en' | 'fr') => {
    setLanguage(newLang);
    setUserProfile(prev => ({ ...prev, language: newLang }));
    generateQuickActions();
  };

  const loadConversations = () => {
    // Demo conversations
    const demoConversations: Conversation[] = [
      {
        id: 'conv-1',
        title: language === 'ar' ? 'استشارة حول زراعة الطماطم' : 
               language === 'en' ? 'Tomato Growing Consultation' : 
               'Consultation Culture de Tomates',
        messages: [],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'agriculture',
        tags: ['طماطم', 'زراعة', 'استشارة']
      },
      {
        id: 'conv-2',
        title: language === 'ar' ? 'تحليل أسعار السوق' : 
               language === 'en' ? 'Market Price Analysis' : 
               'Analyse des Prix du Marché',
        messages: [],
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'market',
        tags: ['أسعار', 'سوق', 'تحليل']
      }
    ];
    setConversations(demoConversations);
  };

  const updateActiveConversation = (userMessage: ChatMessage, aiMessage: ChatMessage) => {
    if (!activeConversation) {
      // Create new conversation
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
        messages: [userMessage, aiMessage],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: aiMessage.category || 'general',
        tags: []
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv.id);
    } else {
      // Update existing conversation
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, messages: [...conv.messages, userMessage, aiMessage], updatedAt: new Date().toISOString() }
          : conv
      ));
    }
  };

  const reactToMessage = (messageId: string, reaction: 'helpful' | 'thumbsUp' | 'thumbsDown') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? {
            ...msg, 
            reactions: {
              ...msg.reactions,
              [reaction]: (msg.reactions?.[reaction] || 0) + 1
            }
          }
        : msg
    ));
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'ar' ? 'المساعد الذكي الزراعي' :
                 language === 'en' ? 'Smart Agricultural Assistant' :
                 'Assistant Agricole Intelligent'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <Select value={language} onValueChange={toggleLanguage}>
                <SelectTrigger className="w-[120px]">
                  <Languages className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>

              {/* Voice Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={voiceEnabled ? 'bg-green-100' : ''}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              {/* Settings */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-gray-600">
            {language === 'ar' ? 'مساعدك الذكي في اتخاذ أفضل القرارات الزراعية والاستثمارية' :
             language === 'en' ? 'Your smart assistant for making the best agricultural and investment decisions' :
             'Votre assistant intelligent pour prendre les meilleures décisions agricoles et d\'investissement'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Quick Actions & History */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {language === 'ar' ? 'أسئلة سريعة' :
                   language === 'en' ? 'Quick Questions' :
                   'Questions Rapides'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => sendMessage(action)}
                  >
                    {action}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Conversations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {language === 'ar' ? 'المحادثات السابقة' :
                   language === 'en' ? 'Recent Conversations' :
                   'Conversations Récentes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {conversations.slice(0, 5).map((conv) => (
                  <div
                    key={conv.id}
                    className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                    onClick={() => setActiveConversation(conv.id)}
                  >
                    <p className="font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {conv.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {language === 'ar' ? 'محادثة مع المساعد الذكي' :
                     language === 'en' ? 'Chat with Smart Assistant' :
                     'Chat avec l\'Assistant Intelligent'}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {language === 'ar' ? 'متصل' : language === 'en' ? 'Online' : 'En Ligne'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border shadow-sm'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="space-y-2">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>

                        {/* Metadata for AI messages */}
                        {message.type === 'assistant' && message.metadata && (
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            {/* Confidence Score */}
                            {message.metadata.confidence && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Star className="h-3 w-3" />
                                <span>
                                  {language === 'ar' ? 'الثقة' : language === 'en' ? 'Confidence' : 'Confiance'}: 
                                  {message.metadata.confidence}%
                                </span>
                                <Progress value={message.metadata.confidence} className="flex-1 h-1" />
                              </div>
                            )}

                            {/* Quick Suggestions */}
                            {message.metadata.suggestions && message.metadata.suggestions.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-600 mb-1">
                                  {language === 'ar' ? 'اقتراحات:' : language === 'en' ? 'Suggestions:' : 'Suggestions:'}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {message.metadata.suggestions.slice(0, 3).map((suggestion, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-6"
                                      onClick={() => sendMessage(suggestion)}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                          
                          {message.type === 'assistant' && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyMessage(message.content)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => reactToMessage(message.id, 'thumbsUp')}
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {message.reactions?.thumbsUp && (
                                  <span className="ml-1">{message.reactions.thumbsUp}</span>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => reactToMessage(message.id, 'thumbsDown')}
                              >
                                <ThumbsDown className="h-3 w-3" />
                                {message.reactions?.thumbsDown && (
                                  <span className="ml-1">{message.reactions.thumbsDown}</span>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-600">
                          {language === 'ar' ? 'يفكر المساعد...' :
                           language === 'en' ? 'Assistant is thinking...' :
                           'L\'assistant réfléchit...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      language === 'ar' ? 'اكتب رسالتك هنا... (اضغط Enter للإرسال)' :
                      language === 'en' ? 'Type your message here... (Press Enter to send)' :
                      'Tapez votre message ici... (Appuyez sur Entrée pour envoyer)'
                    }
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                  
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !input.trim()}
                      size="sm"
                      className="h-10"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    
                    {voiceEnabled && 'webkitSpeechRecognition' in window && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10"
                        onClick={startVoiceInput}
                        disabled={isLoading}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>
                    {language === 'ar' ? 'يدعم العربية، الإنجليزية، والفرنسية' :
                     language === 'en' ? 'Supports Arabic, English, and French' :
                     'Supporte l\'arabe, l\'anglais et le français'}
                  </span>
                  <span>
                    {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' :
                     language === 'en' ? 'Powered by AI' :
                     'Alimenté par IA'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'إعدادات المساعد' :
                 language === 'en' ? 'Assistant Settings' :
                 'Paramètres de l\'Assistant'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">
                  {language === 'ar' ? 'معلومات المزرعة' :
                   language === 'en' ? 'Farm Information' :
                   'Informations de la Ferme'}
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-gray-600">
                      {language === 'ar' ? 'الاسم' : language === 'en' ? 'Name' : 'Nom'}
                    </label>
                    <Input value={userProfile.name} onChange={(e) => 
                      setUserProfile(prev => ({ ...prev, name: e.target.value }))
                    } />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      {language === 'ar' ? 'الموقع' : language === 'en' ? 'Location' : 'Localisation'}
                    </label>
                    <Input value={userProfile.location} onChange={(e) => 
                      setUserProfile(prev => ({ ...prev, location: e.target.value }))
                    } />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      {language === 'ar' ? 'مساحة المزرعة (هكتار)' : 
                       language === 'en' ? 'Farm Size (hectares)' : 
                       'Taille de la Ferme (hectares)'}
                    </label>
                    <Input 
                      type="number" 
                      value={userProfile.farmSize} 
                      onChange={(e) => 
                        setUserProfile(prev => ({ ...prev, farmSize: Number(e.target.value) }))
                      } 
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">
                  {language === 'ar' ? 'تفضيلات المساعد' :
                   language === 'en' ? 'Assistant Preferences' :
                   'Préférences de l\'Assistant'}
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {language === 'ar' ? 'التنبيهات الصوتية' :
                       language === 'en' ? 'Voice Notifications' :
                       'Notifications Vocales'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserProfile(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, voiceEnabled: !prev.preferences.voiceEnabled }
                      }))}
                    >
                      {userProfile.preferences.voiceEnabled ? 'تشغيل' : 'إيقاف'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {language === 'ar' ? 'الترجمة التلقائية' :
                       language === 'en' ? 'Auto Translation' :
                       'Traduction Automatique'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserProfile(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, autoTranslate: !prev.preferences.autoTranslate }
                      }))}
                    >
                      {userProfile.preferences.autoTranslate ? 'تشغيل' : 'إيقاف'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIAssistantChatbot;
