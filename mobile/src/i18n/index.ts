import { I18nManager } from 'react-native';

export type Language = 'ar' | 'fr' | 'en';

export interface Translations {
  appName: string;
  tagline: string;
  // Navigation
  navHome: string;
  navServices: string;
  navAssistant: string;
  navMarketplace: string;
  navProfile: string;

  // Home Screen
  greeting: string;
  welcomeSub: string;
  weatherTitle: string;
  urgentAlerts: string;
  quickActions: string;
  todaysTasks: string;
  assistantPrompt: string;
  askAssistant: string;
  viewAll: string;
  noAlerts: string;
  allClear: string;

  // Quick Action Buttons
  actionScanDisease: string;
  actionScanDiseaseSub: string;
  actionSoilTest: string;
  actionSoilTestSub: string;
  actionCropRecommend: string;
  actionCropRecommendSub: string;
  actionMarketPrices: string;
  actionMarketPricesSub: string;
  actionWeatherDetail: string;
  actionWeatherDetailSub: string;
  actionIrrigation: string;
  actionIrrigationSub: string;

  // Services Screen
  servicesTitle: string;
  servicesSubtitle: string;
  searchServices: string;
  catSoilAndCrops: string;
  catHealthAndProtection: string;
  catWaterAndClimate: string;
  catOperationsAndFinance: string;
  catCommunityAndAdvice: string;

  // Service Details
  soilAnalysisName: string;
  soilAnalysisDesc: string;
  cropRecommendName: string;
  cropRecommendDesc: string;
  diseaseDiagnosisName: string;
  diseaseDiagnosisDesc: string;
  weatherIntelligenceName: string;
  weatherIntelligenceDesc: string;
  marketIntelligenceName: string;
  marketIntelligenceDesc: string;
  smartIrrigationName: string;
  smartIrrigationDesc: string;
  livestockName: string;
  livestockDesc: string;
  farmManagementName: string;
  farmManagementDesc: string;
  pestControlName: string;
  pestControlDesc: string;
  expertConsultationName: string;
  expertConsultationDesc: string;
  communityForumName: string;
  communityForumDesc: string;

  // AI Assistant Screen
  assistantTitle: string;
  assistantSubtitle: string;
  assistantGreeting: string;
  typeYourMessage: string;
  send: string;
  suggestedPromptsTitle: string;
  promptIrrigation: string;
  promptPest: string;
  promptSoil: string;
  promptMarket: string;
  disclaimerAI: string;

  // Marketplace Screen
  marketTitle: string;
  marketSubtitle: string;
  cropPrices: string;
  currencyPerKg: string;
  marketLocation: string;
  priceTrend: string;
  rising: string;
  falling: string;
  stable: string;
  filterByGovernorate: string;
  searchCrop: string;

  // Profile Screen
  profileTitle: string;
  userRole: string;
  roleFarmer: string;
  roleAgronomist: string;
  roleTrader: string;
  roleVeterinarian: string;
  roleInspector: string;
  roleAdmin: string;
  languageSelect: string;
  connectionStatus: string;
  serverOnline: string;
  serverOffline: string;
  offlineMode: string;
  syncData: string;
  loginBtn: string;
  logoutBtn: string;
  demoModeSwitch: string;
  demoModeNotice: string;

  // Actions & Feedback
  save: string;
  cancel: string;
  confirm: string;
  loading: string;
  analyzing: string;
  success: string;
  error: string;
  retry: string;
  back: string;
  takePhoto: string;
  chooseGallery: string;
  uploadPhoto: string;
  resultTitle: string;
  recommendations: string;
  provenanceReal: string;
  provenanceRuleBased: string;
  provenanceSimulated: string;

  // Multi-Agent AI & History
  multiAgentAiName: string;
  multiAgentAiDesc: string;
}

const ar: Translations = {
  appName: 'AgroGrowth',
  tagline: 'منصة زراعية ذكية متكاملة لتونس',
  navHome: 'الرئيسية',
  navServices: 'الخدمات',
  navAssistant: 'المساعد الذكي',
  navMarketplace: 'السوق والأسعار',
  navProfile: 'حسابي',

  greeting: 'أهلاً بك',
  welcomeSub: 'يوم زراعي مبارك ومثمر',
  weatherTitle: 'حالة الطقس والتنبيهات',
  urgentAlerts: 'تنبيهات عاجلة لمزرعتك',
  quickActions: 'خدمات سريعة بنقرة واحدة',
  todaysTasks: 'مهام اليوم الموصى بها',
  assistantPrompt: 'هل لديك سؤال حول حقلك أو محاصيلك؟',
  askAssistant: 'اسأل المستشار الزراعي الذكي',
  viewAll: 'عرض الكل',
  noAlerts: 'لا توجد تنبيهات عاجلة اليوم',
  allClear: 'الحالة ممتازة ومستقرة في حقولك',

  actionScanDisease: 'فحص النباتات بالصورة',
  actionScanDiseaseSub: 'التقط صورة لورقة نبات مصابة لاكتشاف المرض فوراً',
  actionSoilTest: 'فحص وتحليل التربة',
  actionSoilTestSub: 'أدخل مؤشرات التربة لمعرفة خصوبتها والمحصول المناسب',
  actionCropRecommend: 'توصيات المحاصيل',
  actionCropRecommendSub: 'اكتشف أفضل المحاصيل لمناخك وتربتك مع تقدير الأرباح',
  actionMarketPrices: 'أسعار السوق اليوم',
  actionMarketPricesSub: 'تابع أسعار الجملة المحدثة في أسواق تونس وسوسة وصفاقس',
  actionWeatherDetail: 'توقعات الطقس والري',
  actionWeatherDetailSub: 'جدول ري مخصص حسب سرعة الرياح ودرجة الحرارة',
  actionIrrigation: 'جدولة الري الذكي',
  actionIrrigationSub: 'ترشيد استهلاك المياه وتحديد مواعيد السقي بدقة',

  servicesTitle: 'جميع الخدمات الزراعية',
  servicesSubtitle: 'اختر الخدمة التي تحتاجها لمزرعتك بكل سهولة ووضوح',
  searchServices: 'ابحث عن خدمة، تشخيص، أو تحليل...',
  catSoilAndCrops: 'التربة والمحاصيل',
  catHealthAndProtection: 'صحة النبات والوقاية',
  catWaterAndClimate: 'الري والمناخ',
  catOperationsAndFinance: 'إدارة المزرعة والمالية',
  catCommunityAndAdvice: 'المجتمع والاستشارات',

  soilAnalysisName: 'تحليل التربة والتسميد',
  soilAnalysisDesc: 'تحليل دقيق لدرجة الحموضة (pH) والعناصر الغذائية مع برنامج تسميد مخصص.',
  cropRecommendName: 'اقتراح المحاصيل المثالية',
  cropRecommendDesc: 'مطابقة ذكية لخصائص أرضك ومناخ منطقتك لاقتراح المحاصيل الأكثر ربحية.',
  diseaseDiagnosisName: 'كاشف أمراض النبات بالصورة',
  diseaseDiagnosisDesc: 'تشخيص فوري للأمراض الفطرية والحشرية عبر الذكاء الاصطناعي مع خطة علاج.',
  weatherIntelligenceName: 'الطقس الزراعي والتنبيهات',
  weatherIntelligenceDesc: 'بيانات حية مباشرة من محطات الرصد التونسية وتنبيهات الجليد والرياح.',
  marketIntelligenceName: 'ذكاء السوق والأسعار',
  marketIntelligenceDesc: 'أسعار الجملة الرسمية وتوقعات الطلب وتوجيهات لتسويق منتجاتك بأفضل سعر.',
  smartIrrigationName: 'الري الذكي وترشيد المياه',
  smartIrrigationDesc: 'حساب الاحتياجات المائية بدقة حسب نوع المحصول وحالة الجو لتوفير الماء والكهرباء.',
  livestockName: 'إدارة الثروة الحيوانية',
  livestockDesc: 'متابعة صحة الماشية والأغنام، جداول التغذية، والوقاية من الأمراض الوبائية.',
  farmManagementName: 'إدارة الحقول والمزارع',
  farmManagementDesc: 'تسجيل مساحات الحقول، المحاصيل المزروعة، وتاريخ الدورات الزراعية.',
  pestControlName: 'مكافحة الآفات والحشرات',
  pestControlDesc: 'طرق عضوية وكيميائية معتمدة لمكافحة الآفات الزراعية الشائعة في تونس.',
  expertConsultationName: 'استشارة خبير زراعي',
  expertConsultationDesc: 'تواصل مباشر مع مهندسين زراعيين وأطباء بياطرة معتمدين.',
  communityForumName: 'منتدى الفلاحين',
  communityForumDesc: 'تبادل التجارب والحلول مع فلاحي مختلف الولايات التونسية.',

  assistantTitle: 'المستشار الزراعي الذكي',
  assistantSubtitle: 'اسأل عن أي موضوع زراعي وتلقى إجابات علمية مخصصة ومجربة',
  assistantGreeting: 'مرحباً بك! أنا مستشارك الزراعي الذكي في AgroGrowth. كيف أستطيع مساعدتك اليوم في مزرعتك؟',
  typeYourMessage: 'اكتب سؤالك هنا بالعامية التونسية أو الفصحى...',
  send: 'إرسال',
  suggestedPromptsTitle: 'أسئلة شائعة يمكنك تجربتها:',
  promptIrrigation: 'متى أفضل وقت لري أشجار الزيتون في هذا الفصل؟',
  promptPest: 'عندي بقع بنية وصفراء على أوراق الطماطم، ما العلاج؟',
  promptSoil: 'تربتي تميل للملوحة، ما هي الأسمدة والمحاصيل المناسبة؟',
  promptMarket: 'ما هي مؤشرات أسعار زيت الزيتون والقمح في تونس؟',
  disclaimerAI: 'الإجابات مبنية على نماذج الذكاء الاصطناعي وقاعدة المعرفة الزراعية التونسية.',

  marketTitle: 'أسعار السلع الزراعية',
  marketSubtitle: 'مؤشرات الأسعار اليومية في أسواق الجملة التونسية بالدينار (TND)',
  cropPrices: 'أسعار المحاصيل',
  currencyPerKg: 'د.ت / كغ',
  marketLocation: 'السوق',
  priceTrend: 'المسار',
  rising: 'ارتفاع',
  falling: 'انخفاض',
  stable: 'مستقر',
  filterByGovernorate: 'تصفية حسب الولاية',
  searchCrop: 'ابحث عن محصول (زيتون، قمح، طماطم...)',

  profileTitle: 'الملف الشخصي والإعدادات',
  userRole: 'الصفة / الدور المهني',
  roleFarmer: 'فلاح / مزارع',
  roleAgronomist: 'مهندس / خبير زراعي',
  roleTrader: 'تاجر / مسوق منتجات',
  roleVeterinarian: 'طبيب بيطري',
  roleInspector: 'مراقب جودة وحقول',
  roleAdmin: 'مدير المنصة',
  languageSelect: 'لغة التطبيق',
  connectionStatus: 'حالة الاتصال بالنظام',
  serverOnline: 'متصل بالنظام والسحابة',
  serverOffline: 'يعمل محلياً (وضع عدم الاتصال)',
  offlineMode: 'حفظ البيانات محلياً',
  syncData: 'مزامنة البيانات الآن',
  loginBtn: 'تسجيل الدخول',
  logoutBtn: 'تسجيل الخروج',
  demoModeSwitch: 'تبديل الحساب التجريبي',
  demoModeNotice: 'يمكنك التبديل بين الأدوار المختلفة لتجربة كافة خصائص المنصة',

  save: 'حفظ',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  loading: 'جاري التحميل...',
  analyzing: 'جاري التحليل بالذكاء الاصطناعي...',
  success: 'تمت العملية بنجاح',
  error: 'حدث خطأ، يرجى المحاولة ثانية',
  retry: 'إعادة المحاولة',
  back: 'رجوع',
  takePhoto: 'التقاط صورة بالكاميرا',
  chooseGallery: 'اختيار صورة من المعرض',
  uploadPhoto: 'رفع صورة للفحص',
  resultTitle: 'نتيجة التشخيص والتوصيات',
  recommendations: 'خطة الإجراءات الموصى بها',
  provenanceReal: 'بيانات حقيقية معتمدة',
  provenanceRuleBased: 'نظام إرشادي زراعي دقيق',
  provenanceSimulated: 'بيانات استرشادية توضيحية',
  multiAgentAiName: 'نظام الوكلاء الأذكياء المتعددين',
  multiAgentAiDesc: '8 وكلاء ذكاء اصطناعي متخصصين يعملون بتنسيق مشترك لتحليل شامل ومتكامل لمزرعتك.',
};

const fr: Translations = {
  appName: 'AgroGrowth',
  tagline: 'Plateforme Agricole Intelligente pour la Tunisie',
  navHome: 'Accueil',
  navServices: 'Services',
  navAssistant: 'Assistant IA',
  navMarketplace: 'Marché',
  navProfile: 'Profil',

  greeting: 'Bonjour',
  welcomeSub: 'Excellente journée agricole et productive',
  weatherTitle: 'Météo et Alertes',
  urgentAlerts: 'Alertes urgentes pour votre ferme',
  quickActions: 'Actions rapides en un clic',
  todaysTasks: 'Tâches recommandées aujourd’hui',
  assistantPrompt: 'Une question sur vos parcelles ou vos cultures ?',
  askAssistant: 'Consulter l’assistant agronomique IA',
  viewAll: 'Voir tout',
  noAlerts: 'Aucune alerte urgente aujourd’hui',
  allClear: 'Conditions optimales sur vos parcelles',

  actionScanDisease: 'Scanner une plante',
  actionScanDiseaseSub: 'Prenez une photo de feuille pour identifier la maladie',
  actionSoilTest: 'Analyser mon sol',
  actionSoilTestSub: 'Évaluez la fertilité et les cultures adaptées',
  actionCropRecommend: 'Cultures idéales',
  actionCropRecommendSub: 'Découvrez les cultures les plus rentables',
  actionMarketPrices: 'Prix du marché',
  actionMarketPricesSub: 'Consultez les cours de gros en Tunisie (TND)',
  actionWeatherDetail: 'Météo & Irrigation',
  actionWeatherDetailSub: 'Prévisions et recommandations d’arrosage',
  actionIrrigation: 'Irrigation intelligente',
  actionIrrigationSub: 'Optimisez l’eau et réduisez vos dépenses énergétiques',

  servicesTitle: 'Tous les Services Agricoles',
  servicesSubtitle: 'Accédez à l’ensemble des outils AgroGrowth en toute simplicité',
  searchServices: 'Rechercher un service, une maladie...',
  catSoilAndCrops: 'Sol & Cultures',
  catHealthAndProtection: 'Santé & Protection',
  catWaterAndClimate: 'Eau & Météo',
  catOperationsAndFinance: 'Gestion & Finances',
  catCommunityAndAdvice: 'Communauté & Conseils',

  soilAnalysisName: 'Analyse du Sol & Fertilisation',
  soilAnalysisDesc: 'Mesure du pH, NPK, matière organique et plan de fertilisation sur mesure.',
  cropRecommendName: 'Recommandation de Cultures',
  cropRecommendDesc: 'Optimisation du choix des cultures selon votre climat et rentabilité.',
  diseaseDiagnosisName: 'Diagnostic des Maladies',
  diseaseDiagnosisDesc: 'Détection visuelle par IA des maladies foliaires avec traitements adaptés.',
  weatherIntelligenceName: 'Météo Agricole & Alertes',
  weatherIntelligenceDesc: 'Données en direct des stations météo tunisiennes et alertes gel/sirocco.',
  marketIntelligenceName: 'Intelligence du Marché',
  marketIntelligenceDesc: 'Cours des marchés de gros (Tunis, Sfax, Sousse) et tendances.',
  smartIrrigationName: 'Irrigation Optimisée',
  smartIrrigationDesc: 'Calcul précis des besoins hydriques pour économiser l’eau.',
  livestockName: 'Gestion du Bétail',
  livestockDesc: 'Suivi de la santé animale, rationnement et prévention sanitaire.',
  farmManagementName: 'Gestion des Parcelles',
  farmManagementDesc: 'Cartographie des champs, assolements et historique cultural.',
  pestControlName: 'Lutte Antiparasitaire',
  pestControlDesc: 'Guides de lutte biologique et chimique agréés en Tunisie.',
  expertConsultationName: 'Consultation d’Experts',
  expertConsultationDesc: 'Échangez avec des agronomes et vétérinaires agréés.',
  communityForumName: 'Forum des Agriculteurs',
  communityForumDesc: 'Partage d’expériences entre agriculteurs de toutes les régions.',

  assistantTitle: 'Conseiller Agricole IA',
  assistantSubtitle: 'Posez vos questions agronomiques et obtenez des réponses claires',
  assistantGreeting: 'Bonjour ! Je suis votre conseiller AgroGrowth. Comment puis-je vous aider aujourd’hui ?',
  typeYourMessage: 'Posez votre question ici...',
  send: 'Envoyer',
  suggestedPromptsTitle: 'Questions suggérées :',
  promptIrrigation: 'Quel est le meilleur moment pour irriguer mes oliviers ?',
  promptPest: 'Feuilles de tomates tachées de jaune et brun, que faire ?',
  promptSoil: 'Mon sol est calcaire, quelles cultures privilégier ?',
  promptMarket: 'Quelles sont les tendances des prix de l’huile d’olive ?',
  disclaimerAI: 'Réponses générées par l’IA selon les données agronomiques tunisiennes.',

  marketTitle: 'Marché & Cours Agricoles',
  marketSubtitle: 'Prix indicatifs sur les marchés de gros tunisiens en Dinars (TND)',
  cropPrices: 'Prix des produits',
  currencyPerKg: 'DT / kg',
  marketLocation: 'Marché',
  priceTrend: 'Tendance',
  rising: 'En hausse',
  falling: 'En baisse',
  stable: 'Stable',
  filterByGovernorate: 'Filtrer par gouvernorat',
  searchCrop: 'Rechercher un produit (olives, blé, tomates...)',

  profileTitle: 'Mon Profil & Paramètres',
  userRole: 'Rôle professionnel',
  roleFarmer: 'Agriculteur / Éleveur',
  roleAgronomist: 'Ingénieur agronome',
  roleTrader: 'Commerçant / Grossiste',
  roleVeterinarian: 'Vétérinaire',
  roleInspector: 'Inspecteur agricole',
  roleAdmin: 'Administrateur',
  languageSelect: 'Langue de l’application',
  connectionStatus: 'Statut de connexion',
  serverOnline: 'Connecté au serveur',
  serverOffline: 'Mode hors ligne actif',
  offlineMode: 'Stockage local des données',
  syncData: 'Synchroniser maintenant',
  loginBtn: 'Se connecter',
  logoutBtn: 'Se déconnecter',
  demoModeSwitch: 'Changer d’utilisateur démo',
  demoModeNotice: 'Changez de rôle pour tester les différentes vues de la plateforme',

  save: 'Enregistrer',
  cancel: 'Annuler',
  confirm: 'Confirmer',
  loading: 'Chargement...',
  analyzing: 'Analyse par l’IA en cours...',
  success: 'Opération réussie',
  error: 'Une erreur est survenue, veuillez réessayer',
  retry: 'Réessayer',
  back: 'Retour',
  takePhoto: 'Prendre une photo',
  chooseGallery: 'Choisir depuis la galerie',
  uploadPhoto: 'Téléverser pour diagnostic',
  resultTitle: 'Résultat du diagnostic',
  recommendations: 'Plan d’action recommandé',
  provenanceReal: 'Données réelles certifiées',
  provenanceRuleBased: 'Système expert agronomique',
  provenanceSimulated: 'Données indicatives de démonstration',
  multiAgentAiName: 'Système Multi-Agents IA',
  multiAgentAiDesc: '8 agents IA spécialisés travaillant en coordination pour une analyse agricole complète.',
};

const en: Translations = {
  appName: 'AgroGrowth',
  tagline: 'Smart Agricultural Platform for Tunisia',
  navHome: 'Home',
  navServices: 'Services',
  navAssistant: 'AI Assistant',
  navMarketplace: 'Market',
  navProfile: 'Profile',

  greeting: 'Welcome',
  welcomeSub: 'Have a productive farming day',
  weatherTitle: 'Weather & Field Alerts',
  urgentAlerts: 'Urgent Farm Alerts',
  quickActions: 'Quick 1-Tap Actions',
  todaysTasks: 'Recommended Tasks Today',
  assistantPrompt: 'Have a question about your field or crops?',
  askAssistant: 'Ask the Smart Agronomist Assistant',
  viewAll: 'View All',
  noAlerts: 'No urgent alerts today',
  allClear: 'Conditions in your fields are healthy and clear',

  actionScanDisease: 'Scan Plant Leaves',
  actionScanDiseaseSub: 'Snap a photo to identify crop diseases instantly',
  actionSoilTest: 'Analyze Soil Quality',
  actionSoilTestSub: 'Check soil fertility, pH, and crop suitability',
  actionCropRecommend: 'Best Crops Guide',
  actionCropRecommendSub: 'Find high-yield crops matching your soil and climate',
  actionMarketPrices: 'Market Prices Today',
  actionMarketPricesSub: 'Check wholesale commodity prices in Tunisian dinars',
  actionWeatherDetail: 'Weather & Irrigation',
  actionWeatherDetailSub: 'Detailed forecast and customized irrigation schedule',
  actionIrrigation: 'Smart Irrigation',
  actionIrrigationSub: 'Save water and energy with smart irrigation schedules',

  servicesTitle: 'All Agricultural Services',
  servicesSubtitle: 'Intuitive access to every AgroGrowth platform feature',
  searchServices: 'Search services, diagnosis, or recommendations...',
  catSoilAndCrops: 'Soil & Crops',
  catHealthAndProtection: 'Plant Health & Protection',
  catWaterAndClimate: 'Water & Climate',
  catOperationsAndFinance: 'Farm Management & Finance',
  catCommunityAndAdvice: 'Community & Advisory',

  soilAnalysisName: 'Soil Analysis & Fertilizer',
  soilAnalysisDesc: 'Accurate evaluation of pH and NPK nutrients with tailored fertilizer plan.',
  cropRecommendName: 'Crop Recommendation',
  cropRecommendDesc: 'AI matching of your soil and regional climate to maximize profit.',
  diseaseDiagnosisName: 'Plant Disease Diagnosis',
  diseaseDiagnosisDesc: 'Computer vision analysis of crop leaves with instant treatment plans.',
  weatherIntelligenceName: 'Agro Weather & Alerts',
  weatherIntelligenceDesc: 'Live observations from Tunisian weather stations with frost warnings.',
  marketIntelligenceName: 'Market Intelligence & Prices',
  marketIntelligenceDesc: 'Wholesale prices across governorates and seasonal price trends.',
  smartIrrigationName: 'Smart Irrigation & Water Saving',
  smartIrrigationDesc: 'Precise crop water balance calculation to prevent over-watering.',
  livestockName: 'Livestock Management',
  livestockDesc: 'Animal health monitoring, intelligent breeding and smart feed planning.',
  farmManagementName: 'Farm & Plot Management',
  farmManagementDesc: 'Field mapping, crop rotation tracking, and historical logs.',
  pestControlName: 'Pest & Insect Control',
  pestControlDesc: 'Biological and approved chemical control guides for Tunisian crops.',
  expertConsultationName: 'Expert Consultations',
  expertConsultationDesc: 'Direct advisory sessions with certified agronomists and veterinarians.',
  communityForumName: 'Farmer Community Forum',
  communityForumDesc: 'Knowledge exchange with farmers across Tunisian governorates.',

  assistantTitle: 'Smart Agronomist AI',
  assistantSubtitle: 'Ask any farming question and get practical agronomic guidance',
  assistantGreeting: 'Welcome! I am your AgroGrowth assistant. What can I help you with on your farm today?',
  typeYourMessage: 'Type your question here (Arabic, French, or English)...',
  send: 'Send',
  suggestedPromptsTitle: 'Suggested questions:',
  promptIrrigation: 'When is the best time to irrigate olive trees this month?',
  promptPest: 'My tomato leaves have yellow spots with brown borders. What is it?',
  promptSoil: 'My soil has high salinity, what crops and amendments work best?',
  promptMarket: 'What are current wholesale prices for durum wheat in Tunisia?',
  disclaimerAI: 'Answers generated by AI backed by the Tunisian agronomy knowledge engine.',

  marketTitle: 'Agricultural Market Prices',
  marketSubtitle: 'Daily wholesale market commodity prices in Tunisian Dinars (TND)',
  cropPrices: 'Commodity Prices',
  currencyPerKg: 'TND / kg',
  marketLocation: 'Market',
  priceTrend: 'Trend',
  rising: 'Rising',
  falling: 'Falling',
  stable: 'Stable',
  filterByGovernorate: 'Filter by governorate',
  searchCrop: 'Search crop (olive, wheat, tomato...)',

  profileTitle: 'Profile & Settings',
  userRole: 'Professional Role',
  roleFarmer: 'Farmer / Producer',
  roleAgronomist: 'Agronomist / Consultant',
  roleTrader: 'Trader / Distributor',
  roleVeterinarian: 'Veterinarian',
  roleInspector: 'Field Inspector',
  roleAdmin: 'Platform Administrator',
  languageSelect: 'Application Language',
  connectionStatus: 'System Connection',
  serverOnline: 'Connected to AgroGrowth Cloud',
  serverOffline: 'Running in Local Offline Mode',
  offlineMode: 'Local Data Storage',
  syncData: 'Sync Data Now',
  loginBtn: 'Sign In',
  logoutBtn: 'Sign Out',
  demoModeSwitch: 'Switch Demo User',
  demoModeNotice: 'Switch user roles to preview all specialized platform tools',

  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  loading: 'Loading...',
  analyzing: 'Analyzing with AI...',
  success: 'Operation completed successfully',
  error: 'An error occurred, please try again',
  retry: 'Retry',
  back: 'Back',
  takePhoto: 'Take Photo with Camera',
  chooseGallery: 'Choose from Gallery',
  uploadPhoto: 'Upload for Diagnosis',
  resultTitle: 'Diagnostic Result & Treatment',
  recommendations: 'Recommended Action Plan',
  provenanceReal: 'Certified Live Observation',
  provenanceRuleBased: 'Agronomic Expert Rules',
  provenanceSimulated: 'Illustrative Demonstration Data',
  multiAgentAiName: 'Multi-Agent AI System',
  multiAgentAiDesc: '8 specialized AI agents working in coordination for comprehensive agricultural analysis.',
};

const translations: Record<Language, Translations> = { ar, fr, en };

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.ar;
}

export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}
