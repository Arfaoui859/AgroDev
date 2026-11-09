import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AutonomousAgentPanel from '../components/AutonomousAgentPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
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
  Tag,
  Paperclip
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: 'ar' | 'en' | 'fr';
  metadata?: {
    /**
     * Where the answer actually came from. "llm" only when a configured model
     * produced it; "rule-based" when the backend's agronomic engine did;
     * "local-fallback" when the browser answered from its own static text
     * because the advisor service was unreachable.
     */
    dataSource?: 'llm' | 'rule-based';
    /** Model that wrote the answer, e.g. "openai:gpt-4o-mini". */
    modelSource?: string;
    sources?: string[];
    suggestions?: string[];
    actionItems?: string[];
    relatedTopics?: string[];
    /** Persisted disease record ID used to refresh its private image URL. */
    diseaseRecordId?: string;
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
    name: '',
    location: '',
    language: 'ar',
    farmSize: 0,
    crops: [],
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingCropAction, setPendingCropAction] = useState<{cropName:string; farmId:string; plantingDate:string; areaHectares:string} | null>(null);
  const [assistantFarms, setAssistantFarms] = useState<Array<{id:string;name:string;size_hectares:number}>>([]);
  const [assistantCultivations, setAssistantCultivations] = useState<Array<{id:string;farm_id:string;crop_name:string;status:string}>>([]);
  const [pendingDiseaseSave, setPendingDiseaseSave] = useState<{file:File;farmId:string;cultivationId:string;cropType:string;diseaseName:string;severity:string;confidence:number|null;analysisResult:Record<string, unknown>} | null>(null);
  const [pendingSatelliteRequest, setPendingSatelliteRequest] = useState<{farmId:string;periodDays:string} | null>(null);
  const [actionSaving, setActionSaving] = useState(false);

  useEffect(() => {
    initializeChatbot();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChatbot = async () => {
    setIsLoading(true);

    const welcomeMessage: ChatMessage = {
      id: 'welcome-1',
      type: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date().toISOString(),
      language: language,
      metadata: {
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

  const sendImageForAnalysis = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type) || file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, {
        id: "image-error-" + Date.now(),
        type: "assistant",
        content: language === "ar" ? "الصورة لازم تكون JPEG أو PNG أو WebP وحجمها أقل من 10MB." : "Image must be JPEG, PNG or WebP and under 10MB.",
        timestamp: new Date().toISOString(),
        language,
        category: "general"
      }]);
      return;
    }

    const imageContext = input.trim();
    const cropPatterns: Array<[RegExp, string]> = [
      [/طماطم|بندورة|tomato/i, "tomato"],
      [/قمح|wheat/i, "wheat"],
      [/زيتون|olive/i, "olive"],
      [/شعير|barley/i, "barley"],
      [/بطاطا|بطاطس|potato/i, "potato"],
      [/فلفل|pepper/i, "pepper"],
      [/بصل|onion/i, "onion"],
      [/عنب|grape/i, "grape"],
      [/تفاح|apple/i, "apple"],
    ];
    const cropType = cropPatterns.find(([pattern]) => pattern.test(imageContext))?.[1];

    setImageUploading(true);
    setInput("");
    const imageUserMessage: ChatMessage = {
      id: "image-user-" + Date.now(),
      type: "user",
      content: (imageContext ? imageContext + "\n" : "") +
        (language === "ar" ? "صورة للتحليل: " : "Image for analysis: ") + file.name,
      timestamp: new Date().toISOString(),
      language,
      category: "agriculture"
    };
    setMessages(prev => [...prev, imageUserMessage]);

    try {
      const form = new FormData();
      form.append("file", file);
      if (cropType) form.append("plant_type", cropType);
      if (imageContext) form.append("symptoms", imageContext);

      const response = await fetch("/api/ai/images/detect-disease", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || payload.detail?.message || ("HTTP " + response.status));

      const primary = payload.disease_detection?.primary_disease || payload.primary_disease || {};
      const severity = payload.severity_assessment?.severity_level || primary.severity_level || primary.severity;
      const symptoms = primary.symptoms || payload.disease_detection?.symptoms || [];
      const treatment = payload.treatment_plan?.immediate_treatment || payload.treatment?.immediate_treatment || [];
      const prevention = payload.treatment_plan?.prevention_measures || [];
      const confidence = Number(primary.probability ?? payload.confidence ?? NaN);
      const modelSource = payload.modelSource || payload.model_source || payload.provider || "غير معلن";
      const diseaseName = primary.disease_name_ar || primary.disease || payload.disease || "غير محدد";
      const lines = language === "ar"
        ? [
            "تحليل بصري أولي للصورة — موش تشخيص مخبري.",
            "المحصول: " + (cropType || "غير محدد"),
            "الاشتباه: " + diseaseName,
            severity ? "مستوى الشدة المقدّر: " + severity : "",
            Number.isFinite(confidence) && confidence > 0 ? "ثقة النموذج: " + Math.round(confidence * 100) + "% (تقدير آلي، موش نسبة إصابة مؤكدة)." : "",
            primary.description || "",
            Array.isArray(symptoms) && symptoms.length ? "الملاحظات البصرية:\n• " + symptoms.join("\n• ") : "",
            Array.isArray(treatment) && treatment.length ? "خطوات أولية مقترحة:\n• " + treatment.join("\n• ") : "",
            Array.isArray(prevention) && prevention.length ? "الوقاية والمتابعة:\n• " + prevention.join("\n• ") : "",
            "ما تمش قياس صحة النبتة العامة أو العناصر الغذائية من الصورة. قبل استعمال مبيد أو تسميد، يلزم تثبّت مختص ومراعاة المحصول ومرحلة النمو.",
            cropType ? "" : "باش نفسّر النتيجة بدقة أكثر: شنوّة نوع المحصول؟"
          ].filter(Boolean).join("\n\n")
        : [
            "Preliminary visual assessment — not a laboratory diagnosis.",
            "Crop: " + (cropType || "not specified"),
            "Suspected condition: " + diseaseName,
            severity ? "Estimated severity: " + severity : "",
            Number.isFinite(confidence) && confidence > 0 ? "Model confidence: " + Math.round(confidence * 100) + "% (model estimate, not confirmed infection prevalence)." : "",
            primary.description || "",
            Array.isArray(symptoms) && symptoms.length ? "Visible observations:\n• " + symptoms.join("\n• ") : "",
            Array.isArray(treatment) && treatment.length ? "Initial suggestions:\n• " + treatment.join("\n• ") : "",
            Array.isArray(prevention) && prevention.length ? "Prevention and follow-up:\n• " + prevention.join("\n• ") : "",
            "The image does not measure overall plant health or nutrient levels. Verify with an agronomist before pesticide or fertilizer decisions.",
            cropType ? "" : "What crop is shown? I can refine the interpretation with that context."
          ].filter(Boolean).join("\n\n");

      const imageAssistantMessage: ChatMessage = {
        id: "image-result-" + Date.now(),
        type: "assistant",
        content: lines,
        timestamp: new Date().toISOString(),
        language,
        metadata: {
          dataSource: payload.dataSource === "llm" || payload.dataSource === "llm-generated" || payload.data_source === "vision-model" || payload.data_source === "llm-generated" ? "llm" : undefined,
          modelSource,
          sources: [modelSource],
          suggestions: cropType ? ["شنوّة نعمل توا؟", "كيفاش نمنع انتشار المرض؟"] : ["المحصول طماطم", "المحصول زيتون"]
        },
        category: "agriculture"
      };
      setMessages(prev => [...prev, imageAssistantMessage]);
      await updateActiveConversation(imageUserMessage, imageAssistantMessage);
      // Keep the original image and verified response available for an explicit,
      // user-approved save into the selected farm/cultivation record.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const farmResponse = await fetch("/api/assistant/farms", {
          headers: { Authorization: "Bearer " + session.access_token }
        });
        const farmPayload = await farmResponse.json();
        if (farmResponse.ok && farmPayload.success === true && Array.isArray(farmPayload.data) && farmPayload.data.length) {
          setAssistantFarms(farmPayload.data);
          setPendingDiseaseSave({
            file,
            farmId: farmPayload.data.length === 1 ? farmPayload.data[0].id : "",
            cultivationId: "",
            cropType: cropType || "",
            diseaseName,
            severity: severity ? String(severity) : "unknown",
            confidence: Number.isFinite(confidence) && confidence >= 0 && confidence <= 1 ? confidence : null,
            analysisResult: payload,
          });
          if (farmPayload.data.length === 1) {
            const cultivationResponse = await fetch("/api/assistant/cultivations?farm_id=" + encodeURIComponent(farmPayload.data[0].id), {
              headers: { Authorization: "Bearer " + session.access_token }
            });
            const cultivationPayload = await cultivationResponse.json();
            setAssistantCultivations(cultivationResponse.ok && cultivationPayload.success === true ? cultivationPayload.data || [] : []);
          }
        } else {
          setMessages(prev => [...prev, {
            id: "disease-save-unavailable-" + Date.now(), type: "assistant",
            content: language === "ar" ? "التحليل حاضر، أما ما لقيتش مزرعة مسجّلة نربط بيها الصورة. سجّل مزرعتك أو عاود بعد ربط الحساب." : "The analysis is ready, but no registered farm was found to link this image to.",
            timestamp: new Date().toISOString(), language, category: "general"
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          id: "disease-login-required-" + Date.now(), type: "assistant",
          content: language === "ar" ? "تنجم تشوف التحليل، ولحفظ الصورة في سجلّ المزرعة يلزمك تدخل لحسابك." : "You can view the analysis; sign in to save the image in a farm record.",
          timestamp: new Date().toISOString(), language, category: "general"
        }]);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "IMAGE_ANALYSIS_UNAVAILABLE";
      setMessages(prev => [...prev, {
        id: "image-error-" + Date.now(),
        type: "assistant",
        content: language === "ar"
          ? "تعذّر تحليل الصورة حالياً: " + reason + ". ما عطيتكش تشخيص تخميني. تنجم تعاود وقت ترجع الخدمة."
          : "Image analysis is unavailable: " + reason + ". No guessed diagnosis was substituted.",
        timestamp: new Date().toISOString(),
        language,
        category: "general"
      }]);
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const prepareCropAction = async (message: string) => {
    const plantingIntent = /نحب|باش|بش|راني|نزرع|نغرس|سنية|نضيف|ازرع|أزرع|plant|grow|sow|add crop|cultivate/i.test(message);
    if (!plantingIntent) return;
    const crops: Array<[RegExp,string]> = [
      [/طماطم|بندورة|tomato/i, "طماطم"],
      [/قمح|wheat/i, "قمح"],
      [/زيتون|olive/i, "زيتون"],
      [/شعير|barley/i, "شعير"],
      [/بطاطا|بطاطس|potato/i, "بطاطا"],
      [/فلفل|pepper/i, "فلفل"],
      [/بصل|onion/i, "بصل"]
    ];
    const found = crops.find(([pattern]) => pattern.test(message));
    if (!found) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("VERIFIED_SESSION_REQUIRED");
      const response = await fetch("/api/assistant/farms", {
        headers: { Authorization: "Bearer " + session.access_token }
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload.code || "FARM_LOOKUP_FAILED");
      const farms = payload.data || [];
      setAssistantFarms(farms);
      if (!farms.length) {
        setMessages(prev => [...prev, {
          id: "no-farm-" + Date.now(), type: "assistant",
          content: language === "ar" ? "ما عندك حتى مزرعة مسجلة في حسابك. سجّل المزرعة أولاً وبعد نجم نضيف المحصول." : "No farm is registered on your account yet. Register a farm first.",
          timestamp: new Date().toISOString(), language, category: "general"
        }]);
        return;
      }
      setPendingCropAction({
        cropName: found[1],
        farmId: farms.length === 1 ? farms[0].id : "",
        plantingDate: new Date().toISOString().slice(0,10),
        areaHectares: ""
      });
      setMessages(prev => [...prev, {
        id: "crop-proposal-" + Date.now(), type: "assistant",
        content: language === "ar"
          ? "فهمتك. حضّرت مسودة لإضافة " + found[1] + ". اختار المزرعة والمساحة وتاريخ الغراسة، وبعد راجع واضغط تأكيد. ما نحفظ شيء قبل موافقتك."
          : "I prepared a draft to register " + found[1] + ". Choose the farm, area and planting date, then confirm. Nothing is saved before your approval.",
        timestamp: new Date().toISOString(), language, category: "agriculture"
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: "crop-proposal-error-" + Date.now(), type: "assistant",
        content: language === "ar"
          ? "ما نجمتش نجيب مزارعك بحساب موثّق. تأكد من تسجيل الدخول وربط قاعدة البيانات."
          : "I could not load your farms using a verified session. Check sign-in and database setup.",
        timestamp: new Date().toISOString(), language, category: "general"
      }]);
    }
  };

  const confirmCropAction = async () => {
    if (!pendingCropAction || !pendingCropAction.farmId || !pendingCropAction.plantingDate ||
        !Number.isFinite(Number(pendingCropAction.areaHectares)) || Number(pendingCropAction.areaHectares) <= 0) return;
    setActionSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("VERIFIED_SESSION_REQUIRED");
      const response = await fetch("/api/assistant/actions/cultivations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({
          farm_id: pendingCropAction.farmId,
          crop_name: pendingCropAction.cropName,
          planting_date: pendingCropAction.plantingDate,
          area_hectares: Number(pendingCropAction.areaHectares)
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload.message || payload.code || "CULTIVATION_SAVE_FAILED");
      setMessages(prev => [...prev, {
        id: "crop-saved-" + Date.now(), type: "assistant",
        content: language === "ar"
          ? "تم حفظ " + pendingCropAction.cropName + " في سجل المزرعة. رقم العملية: " + payload.data.id
          : "Saved " + pendingCropAction.cropName + " in the farm register. Record ID: " + payload.data.id,
        timestamp: new Date().toISOString(), language,
        metadata: { sources: ["Supabase · crop_cultivations"] }, category: "agriculture"
      }]);
      setPendingCropAction(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "CULTIVATION_SAVE_FAILED";
      setMessages(prev => [...prev, {
        id: "crop-save-error-" + Date.now(), type: "assistant",
        content: language === "ar" ? "ما تمش حفظ المحصول: " + reason + ". ما نعتبرش العملية ناجحة قبل تأكيد قاعدة البيانات." : "The crop was not saved: " + reason,
        timestamp: new Date().toISOString(), language, category: "general"
      }]);
    } finally {
      setActionSaving(false);
    }
  };

  const loadAssistantCultivations = async (farmId: string) => {
    if (!farmId) { setAssistantCultivations([]); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const response = await fetch("/api/assistant/cultivations?farm_id=" + encodeURIComponent(farmId), {
      headers: { Authorization: "Bearer " + session.access_token }
    });
    const payload = await response.json();
    setAssistantCultivations(response.ok && payload.success === true ? payload.data || [] : []);
  };

  const confirmDiseaseSave = async () => {
    if (!pendingDiseaseSave?.farmId) return;
    setActionSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("VERIFIED_SESSION_REQUIRED");
      const form = new FormData();
      form.append("file", pendingDiseaseSave.file);
      form.append("farm_id", pendingDiseaseSave.farmId);
      if (pendingDiseaseSave.cultivationId && pendingDiseaseSave.cultivationId !== "none") {
        form.append("cultivation_id", pendingDiseaseSave.cultivationId);
      }
      form.append("plant_type", pendingDiseaseSave.cropType);
      form.append("primary_disease", pendingDiseaseSave.diseaseName);
      form.append("severity_level", pendingDiseaseSave.severity);
      if (pendingDiseaseSave.confidence !== null) form.append("disease_confidence", String(pendingDiseaseSave.confidence));
      form.append("analysis_result", JSON.stringify(pendingDiseaseSave.analysisResult));
      const response = await fetch("/api/assistant/actions/disease-detections", {
        method: "POST",
        headers: { Authorization: "Bearer " + session.access_token },
        body: form
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload.code || "DISEASE_RECORD_SAVE_FAILED");
      const diseaseSavedMessage: ChatMessage = {
        id: "disease-saved-" + Date.now(), type: "assistant",
        content: language === "ar"
          ? "تم حفظ الصورة وسجلّ المتابعة وربطهما بالمزرعة" + (payload.data?.cultivation_id ? " والمحصول المسجّل" : "") + ". رقم السجل: " + payload.data.id + ". النتيجة تتطلب تثبّتاً ميدانياً."
          : "The image and follow-up record were saved and linked to the farm. Record ID: " + payload.data.id + ". Field verification is still required.",
        timestamp: new Date().toISOString(), language,
        metadata: { sources: ["Supabase · plant_disease_detections", "Supabase Storage · private evidence bucket"], diseaseRecordId: payload.data.id },
        attachments: payload.data?.image_signed_url ? [{ type: "image", url: payload.data.image_signed_url, name: pendingDiseaseSave.file.name }] : undefined,
        category: "agriculture"
      };
      setMessages(prev => [...prev, diseaseSavedMessage]);
      await persistAssistantMessage(diseaseSavedMessage);
      setPendingDiseaseSave(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "DISEASE_RECORD_SAVE_FAILED";
      setMessages(prev => [...prev, {
        id: "disease-save-error-" + Date.now(), type: "assistant",
        content: language === "ar" ? "ما تمش حفظ الصورة والسجل: " + reason + ". ما نعتبرش العملية ناجحة قبل تأكيد قاعدة البيانات." : "The image and record were not saved: " + reason,
        timestamp: new Date().toISOString(), language, category: "general"
      }]);
    } finally {
      setActionSaving(false);
    }
  };

  const prepareSatelliteAction = async (message: string) => {
    const satelliteIntent = /(ساتلايت|قمر صناعي|صور فضائية|ndvi|satellite|sentinel|remote sensing)/i.test(message);
    const actionIntent = /(حلل|شوف|راقب|اعمل|اعمللي|جيب|ورّيني|check|analyse|analyze|monitor|get|show|look up)/i.test(message);
    if (!satelliteIntent || !actionIntent) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("VERIFIED_SESSION_REQUIRED");
      const response = await fetch("/api/assistant/farms", {
        headers: { Authorization: "Bearer " + session.access_token }
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload.code || "FARM_LOOKUP_FAILED");
      const farms = payload.data || [];
      setAssistantFarms(farms);
      if (!farms.length) {
        setMessages(prev => [...prev, {
          id: "satellite-no-farm-" + Date.now(), type: "assistant",
          content: language === "ar" ? "ما عندك حتى مزرعة مسجّلة. سجّل المزرعة وحدّد حدودها الجغرافية أولاً." : "No farm is registered. Register a farm and draw its geographic boundary first.",
          timestamp: new Date().toISOString(), language, category: "agriculture"
        }]);
        return;
      }
      setPendingSatelliteRequest({ farmId: farms.length === 1 ? farms[0].id : "", periodDays: "90" });
      setMessages(prev => [...prev, {
        id: "satellite-proposal-" + Date.now(), type: "assistant",
        content: language === "ar"
          ? "نجم نطلب تحليل Sentinel-2 NDVI للمزرعة من Copernicus. اختار المزرعة والفترة، وبعد أكّد الطلب. يلزم حدود GeoJSON محفوظة وبيانات Copernicus مهيّأة في الخادم."
          : "I can request Sentinel-2 NDVI statistics from Copernicus. Choose a farm and period, then confirm. A saved GeoJSON boundary and server-side Copernicus credentials are required.",
        timestamp: new Date().toISOString(), language, category: "agriculture"
      }]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "SATELLITE_REQUEST_PREPARATION_FAILED";
      setMessages(prev => [...prev, {
        id: "satellite-prepare-error-" + Date.now(), type: "assistant",
        content: language === "ar" ? "ما نجمتش نجهّز طلب الساتلايت: " + reason : "Could not prepare the satellite request: " + reason,
        timestamp: new Date().toISOString(), language, category: "general"
      }]);
    }
  };

  const confirmSatelliteRequest = async () => {
    if (!pendingSatelliteRequest?.farmId) return;
    setActionSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("VERIFIED_SESSION_REQUIRED");
      const response = await fetch("/api/assistant/satellite/ndvi", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({ farm_id: pendingSatelliteRequest.farmId, period_days: Number(pendingSatelliteRequest.periodDays) })
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) {
        const code = payload.code || "SATELLITE_ANALYSIS_FAILED";
        if (code === "SATELLITE_CREDENTIALS_NOT_CONFIGURED") throw new Error("COPERNICUS_CLIENT_ID / COPERNICUS_CLIENT_SECRET غير مهيّئين في Render");
        if (code === "FARM_BOUNDARY_REQUIRED" || code === "VALID_FARM_GEOJSON_BOUNDARY_REQUIRED") throw new Error("حدود المزرعة GeoJSON موش محفوظة أو غير صالحة");
        throw new Error(code);
      }
      const rows = payload.data || [];
      const summary = rows.map((row: any) => "• " + row.observed_from + " → " + row.observed_to + ": NDVI mean " + Number(row.mean_value).toFixed(3) + " (min " + Number(row.min_value).toFixed(3) + ", max " + Number(row.max_value).toFixed(3) + "; pixels " + row.sample_count + ")").join("\n");
      const satelliteResultMessage: ChatMessage = {
        id: "satellite-result-" + Date.now(), type: "assistant",
        content: (language === "ar" ? "تم جلب وحفظ نتائج Sentinel-2 للمزرعة " : "Sentinel-2 results retrieved and saved for farm ") + payload.farm.name + ":\n" + summary + "\n\n" + (language === "ar" ? "NDVI يقيس خضرة الغطاء النباتي، موش تشخيص مرض ولا قياس مباشر للمردودية. النتائج دورية وتتأثر بالسحب وعدد البكسلات الصالحة." : "NDVI measures vegetation greenness, not disease or direct yield. Observations are periodic and affected by clouds and valid-pixel count."),
        timestamp: new Date().toISOString(), language,
        metadata: { sources: [payload.provenance?.provider || "Copernicus Data Space Ecosystem · Sentinel Hub"] },
        category: "agriculture"
      };
      setMessages(prev => [...prev, satelliteResultMessage]);
      await persistAssistantMessage(satelliteResultMessage);
      setPendingSatelliteRequest(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "SATELLITE_ANALYSIS_FAILED";
      setMessages(prev => [...prev, {
        id: "satellite-error-" + Date.now(), type: "assistant",
        content: language === "ar" ? "ما تمش تحليل الساتلايت: " + reason + ". ما سجّلنا حتى نتيجة." : "Satellite analysis failed: " + reason + ". No result was saved.",
        timestamp: new Date().toISOString(), language, category: "general"
      }]);
    } finally {
      setActionSaving(false);
    }
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
      const aiResponse = await generateAIResponse(messageContent);
      setMessages(prev => [...prev, aiResponse]);
      await prepareCropAction(messageContent);
      await prepareSatelliteAction(messageContent);

      // Update conversation
      await updateActiveConversation(userMessage, aiResponse);

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

  /**
   * Ask the AgroGrowth Farm Advisor backend. The backend uses the configured LLM
   * when available and otherwise answers from its rule-based engine, always
   * reporting which source produced the answer.
   */
  const callAdvisorApi = async (
    messageContent: string
  ): Promise<{ answer: string; dataSource: string; language?: string; note?: string }> => {
    const history = messages.slice(-6).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content
    }));
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/ai/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ message: messageContent, language, history })
    });
    if (!response.ok) {
      throw new Error(`Advisor API error: ${response.status}`);
    }
    return response.json();
  };

  const generateAIResponse = async (userInput: string): Promise<ChatMessage> => {
    try {
      const result = await callAdvisorApi(userInput);
      const source = result.dataSource === 'llm' ? 'llm' : 'rule-based';
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.answer,
        timestamp: new Date().toISOString(),
        language: (result.language as 'ar' | 'en' | 'fr') || language,
        metadata: {
          dataSource: source,
          modelSource: (result as { modelSource?: string }).modelSource,
          sources:
            source === 'llm'
              ? [`نموذج لغوي (LLM): ${(result as { modelSource?: string }).modelSource ?? ''}`.trim()]
              : ['محرك قواعد زراعية'],
          suggestions: quickActions.slice(0, 4),
          relatedTopics: ['زراعة', 'أسواق', 'طقس', 'استثمار']
        },
        category: 'general'
      };
    } catch (error) {
      console.error('AgroGrowth advisor unavailable:', error);
      return {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: language === 'ar'
          ? 'خدمة المساعد غير متاحة حالياً. لم أستبدلها بإجابة تخمينية أو بيانات تجريبية. حاول مجدداً بعد عودة الخدمة.'
          : language === 'fr'
            ? "Le service assistant est indisponible. Aucune réponse fictive n'a été substituée. Réessayez lorsque le service sera rétabli."
            : 'The assistant service is currently unavailable. No guessed or demo answer was substituted. Please try again when the service is restored.',
        timestamp: new Date().toISOString(),
        language,
        metadata: { sources: ['service unavailable'] },
        category: 'general'
      };
    }
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

  const loadConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setConversations([]);
        return;
      }
      const response = await fetch("/api/assistant/conversations", {
        headers: { Authorization: "Bearer " + session.access_token },
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload.code || "CONVERSATION_LIST_FAILED");
      setConversations((payload.data || []).map((row: any): Conversation => ({
        id: row.id,
        title: row.title,
        messages: [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        category: row.category || "general",
        tags: [],
      })));
    } catch (error) {
      console.error("Could not load persistent assistant conversations:", error);
      setConversations([]);
    }
  };

  const openConversation = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("VERIFIED_SESSION_REQUIRED");
      const response = await fetch(`/api/assistant/conversations/${encodeURIComponent(conversationId)}/messages`, {
        headers: { Authorization: "Bearer " + session.access_token },
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload.code || "CONVERSATION_MESSAGES_FAILED");
      const loaded: ChatMessage[] = (payload.data || []).map((row: any): ChatMessage => ({
        id: row.id,
        type: row.role,
        content: row.content,
        timestamp: row.created_at,
        language: row.language || language,
        metadata: {
          ...(row.metadata || {}),
          dataSource: row.data_source === "llm" || row.data_source === "rule-based" ? row.data_source : undefined,
          modelSource: row.model_source || undefined,
        },
        category: "general",
      }));
      // Re-issue short-lived private image URLs when opening historical chats.
      const withEvidence = await Promise.all(loaded.map(async message => {
        const recordId = message.metadata?.diseaseRecordId;
        if (message.type !== "assistant" || typeof recordId !== "string") return message;
        try {
          const evidenceResponse = await fetch("/api/assistant/disease-detections/" + encodeURIComponent(recordId) + "/evidence-url", {
            headers: { Authorization: "Bearer " + session.access_token }
          });
          const evidencePayload = await evidenceResponse.json();
          if (!evidenceResponse.ok || evidencePayload.success !== true || !evidencePayload.data?.signedUrl) return message;
          return { ...message, attachments: [{ type: "image" as const, url: evidencePayload.data.signedUrl, name: "Saved plant image" }] };
        } catch {
          return message;
        }
      }));
      setActiveConversation(conversationId);
      setMessages(withEvidence);
    } catch (error) {
      console.error("Could not open assistant conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateActiveConversation = async (userMessage: ChatMessage, aiMessage: ChatMessage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("VERIFIED_SESSION_REQUIRED");
      const headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session.access_token,
      };
      let conversationId = activeConversation;
      if (!conversationId) {
        const createResponse = await fetch("/api/assistant/conversations", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: userMessage.content.slice(0, 180),
            language,
            category: aiMessage.category || "general",
          }),
        });
        const created = await createResponse.json();
        if (!createResponse.ok || created.success !== true) throw new Error(created.code || "CONVERSATION_CREATE_FAILED");
        conversationId = created.data.id;
        setActiveConversation(conversationId);
      }

      for (const message of [userMessage, aiMessage]) {
        const saveResponse = await fetch(`/api/assistant/conversations/${encodeURIComponent(conversationId)}/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            role: message.type,
            content: message.content,
            language: message.language,
            dataSource: message.metadata?.dataSource,
            modelSource: message.metadata?.modelSource,
            metadata: message.metadata || {},
          }),
        });
        const saved = await saveResponse.json();
        if (!saveResponse.ok || saved.success !== true) throw new Error(saved.code || "CONVERSATION_MESSAGE_SAVE_FAILED");
      }
      await loadConversations();
    } catch (error) {
      console.error("Assistant answer was generated but conversation persistence failed:", error);
      setMessages(prev => [...prev, {
        id: "memory-save-warning-" + Date.now(),
        type: "assistant",
        content: language === "ar"
          ? "تنبيه: تم توليد الإجابة، لكن تعذّر حفظ سجل المحادثة في قاعدة البيانات. راجع إعدادات قاعدة البيانات أو أعد المحاولة."
          : "The answer was generated, but its conversation history could not be saved to the database.",
        timestamp: new Date().toISOString(),
        language,
        category: "general",
      }]);
    }
  };

  const persistAssistantMessage = async (message: ChatMessage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const headers = { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token };
      let conversationId = activeConversation;
      if (!conversationId) {
        const createResponse = await fetch("/api/assistant/conversations", {
          method: "POST", headers,
          body: JSON.stringify({ title: message.content.slice(0, 180), language: message.language, category: message.category || "general" })
        });
        const created = await createResponse.json();
        if (!createResponse.ok || created.success !== true) throw new Error(created.code || "CONVERSATION_CREATE_FAILED");
        conversationId = created.data.id;
        setActiveConversation(conversationId);
      }
      const response = await fetch("/api/assistant/conversations/" + encodeURIComponent(conversationId) + "/messages", {
        method: "POST", headers,
        body: JSON.stringify({
          role: "assistant",
          content: message.content,
          language: message.language,
          dataSource: message.metadata?.dataSource,
          modelSource: message.metadata?.modelSource,
          metadata: message.metadata || {},
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true) throw new Error(payload.code || "CONVERSATION_MESSAGE_SAVE_FAILED");
      await loadConversations();
    } catch (error) {
      console.error("Assistant action result could not be persisted:", error);
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

        <AutonomousAgentPanel />

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
                    onClick={() => void openConversation(conv.id)}
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
                      {language === 'ar' ? 'مصدر الإجابة موضّح' : language === 'en' ? 'Answer source disclosed' : 'Source de réponse indiquée'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setActiveConversation(null); }}>
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
                        {message.attachments?.filter(attachment => attachment.type === "image").map((attachment, index) => (
                          <a key={index} href={attachment.url} target="_blank" rel="noreferrer" className="block">
                            <img src={attachment.url} alt={attachment.name} loading="lazy" className="max-h-64 max-w-full rounded-lg border object-contain" />
                            <span className="text-xs text-blue-700 underline">{attachment.name}</span>
                          </a>
                        ))}

                        {/* Metadata for AI messages */}
                        {message.type === 'assistant' && message.metadata && (
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            {/* Answer provenance */}
                            {message.metadata.dataSource && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Star className="h-3 w-3" />
                                <span>
                                  {message.metadata.dataSource === 'llm'
                                    ? (language === 'ar' ? 'إجابة نموذج لغوي' : language === 'fr' ? 'Réponse du modèle' : 'Model answer')
                                    : message.metadata.dataSource === 'rule-based'
                                      ? (language === 'ar' ? 'إجابة محرك القواعد' : language === 'fr' ? 'Moteur de règles' : 'Rule engine answer')
                                      : (language === 'ar' ? 'إرشادات محلية (الخدمة غير متاحة)' : language === 'fr' ? 'Conseils locaux (service indisponible)' : 'Local guidance (service unavailable)')}
                                </span>
                                {message.metadata.modelSource && (
                                  <span className="text-gray-400">· {message.metadata.modelSource}</span>
                                )}
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

                {pendingCropAction && (
                  <div className="mx-2 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-right">
                    <div className="mb-3 font-semibold text-emerald-950">
                      {language === "ar" ? "مراجعة وتأكيد إضافة المحصول" : "Review and confirm crop"}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "المزرعة" : "Farm"}</label>
                        <Select value={pendingCropAction.farmId} onValueChange={(farmId) => setPendingCropAction(p => p ? {...p, farmId} : p)}>
                          <SelectTrigger><SelectValue placeholder="اختر المزرعة" /></SelectTrigger>
                          <SelectContent>
                            {assistantFarms.map(farm => <SelectItem key={farm.id} value={farm.id}>{farm.name} · {farm.size_hectares} ha</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "المحصول" : "Crop"}</label>
                        <Input value={pendingCropAction.cropName} readOnly />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "المساحة (هكتار)" : "Area (ha)"}</label>
                        <Input type="number" min="0.01" step="0.01" value={pendingCropAction.areaHectares} onChange={e => setPendingCropAction(p => p ? {...p, areaHectares: e.target.value} : p)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "تاريخ الغراسة" : "Planting date"}</label>
                        <Input type="date" value={pendingCropAction.plantingDate} onChange={e => setPendingCropAction(p => p ? {...p, plantingDate: e.target.value} : p)} />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={confirmCropAction} disabled={actionSaving || !pendingCropAction.areaHectares || Number(pendingCropAction.areaHectares) <= 0}>
                        {actionSaving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "تأكيد الإضافة" : "Confirm")}
                      </Button>
                      <Button variant="outline" onClick={() => setPendingCropAction(null)} disabled={actionSaving}>
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-emerald-900/80">
                      {language === "ar" ? "يتم التثبت من ملكية المزرعة والمساحة قبل الحفظ." : "Farm ownership and available area are checked before saving."}
                    </p>
                  </div>
                )}

                {pendingDiseaseSave && (
                  <div className="mx-2 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-right">
                    <div className="mb-2 font-semibold text-amber-950">
                      {language === "ar" ? "ربط الصورة بسجلّ المزرعة" : "Link image to a farm record"}
                    </div>
                    <p className="mb-3 text-xs text-amber-950/80">
                      {language === "ar" ? "اختار المزرعة والمحصول الصحيحين. الصورة لن تُحفظ إلا بعد ضغطك على تأكيد." : "Choose the correct farm and cultivation. The image is only saved after you confirm."}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "المزرعة" : "Farm"}</label>
                        <Select value={pendingDiseaseSave.farmId} onValueChange={farmId => {
                          setPendingDiseaseSave(current => current ? { ...current, farmId, cultivationId: "" } : current);
                          void loadAssistantCultivations(farmId);
                        }}>
                          <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختار المزرعة" : "Choose farm"} /></SelectTrigger>
                          <SelectContent>
                            {assistantFarms.map(farm => <SelectItem key={farm.id} value={farm.id}>{farm.name} · {farm.size_hectares} ha</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "المحصول / الحقل" : "Cultivation / plot"}</label>
                        <Select value={pendingDiseaseSave.cultivationId || "none"} onValueChange={cultivationId => setPendingDiseaseSave(current => current ? { ...current, cultivationId } : current)}>
                          <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختار المحصول (اختياري)" : "Choose cultivation (optional)"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{language === "ar" ? "ربط بالمزرعة فقط" : "Farm only"}</SelectItem>
                            {assistantCultivations.filter(c => c.farm_id === pendingDiseaseSave.farmId).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.crop_name} · {c.status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={confirmDiseaseSave} disabled={actionSaving || !pendingDiseaseSave.farmId}>
                        {actionSaving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "تأكيد حفظ الصورة والسجل" : "Confirm image and record")}
                      </Button>
                      <Button variant="outline" onClick={() => setPendingDiseaseSave(null)} disabled={actionSaving}>
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-amber-950/80">
                      {language === "ar" ? "السجل يحفظ النتيجة كما وردت من التحليل، ولا يحوّلها إلى تشخيص ميداني مؤكد." : "The stored result remains an unverified image assessment, not a confirmed field diagnosis."}
                    </p>
                  </div>
                )}

                {pendingSatelliteRequest && (
                  <div className="mx-2 mb-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-right">
                    <div className="mb-2 font-semibold text-sky-950">
                      {language === "ar" ? "تحليل الحقل بالأقمار الصناعية" : "Satellite field analysis"}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "المزرعة" : "Farm"}</label>
                        <Select value={pendingSatelliteRequest.farmId} onValueChange={farmId => setPendingSatelliteRequest(current => current ? { ...current, farmId } : current)}>
                          <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختار المزرعة" : "Choose farm"} /></SelectTrigger>
                          <SelectContent>
                            {assistantFarms.map(farm => <SelectItem key={farm.id} value={farm.id}>{farm.name} · {farm.size_hectares} ha</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">{language === "ar" ? "الفترة" : "Period"}</label>
                        <Select value={pendingSatelliteRequest.periodDays} onValueChange={periodDays => setPendingSatelliteRequest(current => current ? { ...current, periodDays } : current)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={confirmSatelliteRequest} disabled={actionSaving || !pendingSatelliteRequest.farmId}>
                        {actionSaving ? (language === "ar" ? "جاري طلب البيانات..." : "Requesting data...") : (language === "ar" ? "تأكيد تحليل Sentinel-2" : "Confirm Sentinel-2 analysis")}
                      </Button>
                      <Button variant="outline" onClick={() => setPendingSatelliteRequest(null)} disabled={actionSaving}>
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-sky-950/80">
                      {language === "ar" ? "يتطلب حدود GeoJSON للمزرعة وحساب Copernicus OAuth مهيّأ في الخادم. لا توجد مراقبة لحظية." : "Requires a farm GeoJSON boundary and Copernicus OAuth credentials on the server. This is not live monitoring."}
                    </p>
                  </div>
                )}

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
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => void sendImageForAnalysis(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageUploading || isLoading}
                    title={language === "ar" ? "إرفاق صورة نبات" : "Attach plant image"}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
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
