import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
    setImageUploading(true);
    setMessages(prev => [...prev, {
      id: "image-user-" + Date.now(),
      type: "user",
      content: (language === "ar" ? "صورة للتحليل: " : "Image for analysis: ") + file.name,
      timestamp: new Date().toISOString(),
      language,
      category: "agriculture"
    }]);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/ai/images/detect-disease", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || ("HTTP " + response.status));
      const diagnosis = payload.diagnosis || payload.primary_disease || payload.disease || payload.result || payload;
      setMessages(prev => [...prev, {
        id: "image-result-" + Date.now(),
        type: "assistant",
        content: (language === "ar" ? "نتيجة تحليل الصورة (يلزم التثبت ميدانياً):\n" : "Image analysis result (verify in the field):\n") +
          (typeof diagnosis === "string" ? diagnosis : JSON.stringify(diagnosis, null, 2)),
        timestamp: new Date().toISOString(),
        language,
        metadata: { sources: [payload.model_source || payload.modelSource || "Image diagnosis service"] },
        category: "agriculture"
      }]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "IMAGE_ANALYSIS_UNAVAILABLE";
      setMessages(prev => [...prev, {
        id: "image-error-" + Date.now(),
        type: "assistant",
        content: language === "ar"
          ? "تعذّر تحليل الصورة حالياً: " + reason + ". تنجم تفتح صفحة تشخيص الصور: /disease-upload"
          : "Image analysis unavailable: " + reason + ". Open /disease-upload.",
        timestamp: new Date().toISOString(),
        language,
        category: "general"
      }]);
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
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
    const response = await fetch('/api/ai/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
