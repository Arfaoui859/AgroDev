import { Language } from './index';

/**
 * Supplementary strings for features added after the initial mobile build
 * (auth flows, offline handling, notifications, honest-state copy).
 * Kept separate so the main translation table stays readable.
 */
export interface ExtraTranslations {
  // Auth
  authSignIn: string;
  authSignUp: string;
  authReset: string;
  authEmail: string;
  authPassword: string;
  authFullName: string;
  authPhone: string;
  authSignInBtn: string;
  authSignUpBtn: string;
  authResetBtn: string;
  authNeedAccount: string;
  authHaveAccount: string;
  authForgot: string;
  authConfirmEmail: string;
  authWelcomeBack: string;
  authCreateAccount: string;
  authSubtitle: string;
  authErrEmailRequired: string;
  authErrPasswordShort: string;
  authErrFullNameRequired: string;
  authErrSignInFailed: string;
  authErrSignUpFailed: string;
  authErrResetFailed: string;
  authErrUnreachable: string;
  authConfirmTitle: string;
  authResetSentTitle: string;
  authResetSentBody: string;
  authAccountType: string;
  roleFarmer: string;
  roleGardener: string;
  roleAgronomist: string;
  roleVeterinarian: string;
  roleCompany: string;
  roleTrader: string;
  roleInvestor: string;
  roleInspector: string;
  roleGovernment: string;

  // Onboarding
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingContinue: string;
  onboardingSkip: string;
  personaGardenerTitle: string;
  personaGardenerSub: string;
  personaGardenerBadge: string;
  personaFarmerTitle: string;
  personaFarmerSub: string;
  personaFarmerBadge: string;
  personaAgronomistTitle: string;
  personaAgronomistSub: string;
  personaAgronomistBadge: string;
  personaCompanyTitle: string;
  personaCompanySub: string;
  personaCompanyBadge: string;
  personaTraderTitle: string;
  personaTraderSub: string;
  personaTraderBadge: string;
  personaInspectorTitle: string;
  personaInspectorSub: string;
  personaInspectorBadge: string;
  personaVeterinarianTitle: string;
  personaVeterinarianSub: string;
  personaVeterinarianBadge: string;
  personaInvestorTitle: string;
  personaInvestorSub: string;
  personaInvestorBadge: string;
  personaGovernmentTitle: string;
  personaGovernmentSub: string;
  personaGovernmentBadge: string;

  // Login gate
  loginRequired: string;
  loginRequiredDesc: string;
  loginToContinue: string;

  // States
  stateLoading: string;
  stateEmpty: string;
  stateError: string;
  stateOffline: string;
  stateUnavailable: string;
  crashTitle: string;
  crashMessage: string;
  retry: string;
  cachedNotice: string;
  offlineBanner: string;
  notice: string;
  successTitle: string;

  // Notifications
  notificationsTitle: string;
  notificationsEmpty: string;
  markAllRead: string;
  notificationUnread: string;

  // Scanner
  scannerCapture: string;
  scannerReview: string;
  scannerReviewSub: string;
  scannerConfirm: string;
  scannerRetake: string;
  scannerPermissionTitle: string;
  scannerPermissionDesc: string;
  scannerGrant: string;
  scannerFromGallery: string;
  scannerGuidance: string;
  scannerAnalyzing: string;
  scannerUnavailableTitle: string;
  scannerUnavailableDesc: string;
  scannerSymptomsLabel: string;
  scannerSymptomsPlaceholder: string;
  scannerCaptureFailed: string;
  scannerGalleryDenied: string;
  scannerAnalysisFailed: string;
  scannerNoConfidenceLong: string;
  scannerSeverityLabel: string;
  scannerSeverityLow: string;
  scannerSeverityMedium: string;
  scannerSeverityHigh: string;
  scannerSeverityCritical: string;
  scannerSeverityUnknown: string;
  scannerSectionTreatment: string;
  scannerSectionPrevention: string;
  scannerScanAnother: string;

  // AI capabilities
  aiCapTitle: string;
  aiCapSubtitle: string;
  aiSummaryTotal: string;
  aiSummaryAvailable: string;
  aiSummaryModelPowered: string;
  aiEngineLlm: string;
  aiEngineVision: string;
  aiEngineTrained: string;
  aiEngineRuleBased: string;
  aiEngineUnavailable: string;
  aiAvailable: string;
  aiNotConfigured: string;
  aiEngineProvenanceTitle: string;
  aiRequires: string;
  aiNote: string;
  aiNoCapabilities: string;
  aiProviderConfigured: string;
  aiProviderNone: string;

  // Disease detection screen
  diseaseStepImage: string;
  diseaseStepCrop: string;
  diseaseStepPart: string;
  diseaseAnalyzeButton: string;
  diseaseConfidenceLabel: string;
  diseaseNoConfidence: string;
  diseaseSymptoms: string;
  diseaseTreatment: string;
  diseasePrevention: string;
  diseaseLimitationsTitle: string;
  diseaseLimitationsText: string;
  diseaseGalleryDenied: string;
  diseasePickFirst: string;
  cropOlive: string;
  cropTomato: string;
  cropWheat: string;
  cropCitrus: string;
  cropDates: string;
  cropPotato: string;
  partLeaves: string;
  partFruit: string;
  partStem: string;
  partRoot: string;

  // Pest
  pestSymptomInput: string;
  pestSymptomPlaceholder: string;
  pestIdentify: string;
  pestNoResult: string;

  // Irrigation
  irrigationCrop: string;
  irrigationStage: string;
  irrigationCompute: string;
  irrigationUnavailable: string;

  // Crop recommendation inputs
  cropSoilPh: string;
  cropTemperature: string;
  cropRainfall: string;
  cropSalinity: string;
  cropArea: string;
  cropCompute: string;
  cropInputsHint: string;
  cropInvalidInput: string;

  // Assistant
  assistantUnavailable: string;
  assistantProvenanceLlm: string;
  assistantProvenanceRules: string;

  // Home
  homeNoAlerts: string;
  homeAlertsUnavailable: string;
  homeWeatherUnavailable: string;
  /** Heading for the Home weather-advice card. */
  homeWeatherAdviceTitle: string;
  homeGuest: string;
  metricHumidity: string;
  metricWind: string;
  priorityCritical: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  heroBadgeAnalyze: string;
  heroBadgeLivestock: string;
  heroBadgeMarkets: string;
  heroBadgeManage: string;
  heroBadgeInspect: string;
  heroBadgeIndicators: string;
  heroBadgeNews: string;

  // Agricultural news (real RSS feeds)
  newsTitle: string;
  newsSubtitle: string;
  newsSearchPlaceholder: string;
  newsAllCategories: string;
  newsEmpty: string;
  newsEmptyDesc: string;
  newsReadMore: string;
  newsUnknownSource: string;
  newsSomeSourcesDown: string;

  // Home — agricultural learning videos (curated, real)
  videoCatPruning: string;
  videoCatIrrigation: string;
  videoCatSoilPrep: string;
  videoCatComposting: string;
  videoCatPlantProtection: string;
  videoCatVegetableGrowing: string;
  videoCatLivestock: string;
  videoCatGreenhouse: string;
  videoCatHarvest: string;
  videoDurationMinutes: string;
  videoLanguageArabic: string;
  videoLanguageEnglish: string;

  // AgriVibe Academy
  academyTitle: string;
  academySubtitle: string;
  academyOpenVideos: string;
  academyOpenService: string;
  academyPlanting: string;
  academyPlantingDesc: string;
  academySoil: string;
  academySoilDesc: string;
  academyIrrigation: string;
  academyIrrigationDesc: string;
  academyFertilisation: string;
  academyFertilisationDesc: string;
  academyDiseases: string;
  academyDiseasesDesc: string;
  academyPest: string;
  academyPestDesc: string;
  academyPruning: string;
  academyPruningDesc: string;
  academyHarvest: string;
  academyHarvestDesc: string;
  academyLivestock: string;
  academyLivestockDesc: string;
  academyTechnology: string;
  academyTechnologyDesc: string;

  // Home — seasonal agenda (generic, indicative)
  seasonWinter: string;
  seasonSpring: string;
  seasonSummer: string;
  seasonAutumn: string;
  seasonWinterTip: string;
  seasonSpringTip: string;
  seasonSummerTip: string;
  seasonAutumnTip: string;

  // Profile
  profileSignInPrompt: string;
  profileSignOutConfirm: string;
  profileSignedInAs: string;
  profileServerReachable: string;
  profileCacheCleared: string;
  profileClearCache: string;
  profileSupabaseUnconfigured: string;

  // Farm
  farmAddField: string;
  farmFieldName: string;
  farmFieldArea: string;
  farmEmpty: string;
  farmLoginToManage: string;
  farmAddFarm: string;
  farmName: string;
  farmRegion: string;
  farmSize: string;
  farmNoFarmYet: string;
  farmCreateHint: string;
  farmSaveFarm: string;

  // Services catalogue
  svcBadgeSoil: string;
  svcBadgeCrops: string;
  svcBadgeDisease: string;
  svcBadgePest: string;
  svcBadgeIrrigation: string;
  svcBadgeWeather: string;
  svcBadgeFarms: string;
  svcBadgeLivestock: string;
  svcBadgeCommunity: string;
  svcBadgeExpert: string;
  svcBadgeMultiAgent: string;
  svcBadgeNews: string;
  svcBadgeHistory: string;
  svcBadgeLearning: string;
  recentAnalysesTitle: string;
  recentAnalysesDesc: string;
  servicesLaunch: string;
  servicesNoMatch: string;

  // Soil analysis screen
  soilFormHeading: string;
  soilPhLabel: string;
  soilPhHint: string;
  soilNitrogenLabel: string;
  soilPhosphorusLabel: string;
  soilPotassiumLabel: string;
  soilOrganicMatterLabel: string;
  soilMoistureLabel: string;
  soilAnalyzeButton: string;
  soilFertilityScore: string;
  soilProblems: string;
  soilMissingMeasurements: string;
  soilFindings: string;
  soilRecommendations: string;
  /** Shown when the user submits the form with every measurement blank. */
  soilNeedOneMeasurement: string;
  /** Shown when a field holds text that is not a valid number. */
  soilInvalidInput: string;
  /** Note that blank fields are reported as missing, never substituted. */
  soilBlankNote: string;

  // Weather screen
  weatherSubtitle: string;
  weatherLiveBadge: string;
  weatherHumidity: string;
  weatherRainToday: string;
  weatherWindSpeed: string;
  weatherForecast: string;
  weatherForecastEmpty: string;
  weatherLoading: string;
  weatherUseMyLocation: string;
  weatherLocating: string;
  weatherLocationDenied: string;
  weatherLocationFailed: string;
  weatherMyLocationLabel: string;

  // Crop recommendation screen
  cropEmptyResult: string;
  cropSuitabilityShort: string;
  cropEstimatedProfit: string;
  cropWaterRequirement: string;
  cropHistorySummary: string;

  // Recent analyses screen
  recentAnalysesSubtitle: string;
  recentAnalysesEmptyTitle: string;
  recentAnalysesEmptyMsg: string;
  recentAnalysesClear: string;
  recentAnalysesClearConfirm: string;
  recentAnalysesViewImage: string;
  recentAnalysesTapHint: string;
  weatherOpenDetail: string;
  articleOpenSource: string;
  recentAnalysesRunAgain: string;

  // Secondary services (irrigation / pest / disabled services)
  svcUnavailableTitle: string;
  expertDisabledNote: string;
  communityDisabledNote: string;
  svcNotWiredNote: string;
  irrigationUnavailableTitle: string;
  pestUnavailableTitle: string;
  pestSeparatorHint: string;
  pestCropOptional: string;
  pestCropPlaceholder: string;
  pestMethodPrefix: string;
  pestSymptomsUsed: string;
  pestNoConfidenceNote: string;
  irrigationNoDetails: string;
  irrigationRecommendations: string;
  metricDailyRequirement: string;
  metricWeeklyRequirement: string;
  metricEt0: string;
  metricCropCoefficient: string;
  metricWaterEfficiency: string;
  irrigationRawUnknown: string;
  irrigationWeatherSource: string;

  // Crop / growth-stage labels
  stageVegetative: string;
  stageFlowering: string;
  stageFruiting: string;
  stageMaturity: string;
  farmSaved: string;
  farmRequiredFields: string;
  /** Shown when a farm/field area is not a positive number. */
  farmInvalidArea: string;
  farmError: string;
  farmFieldsSection: string;
  farmCurrentCrop: string;
  farmSoilType: string;
  farmTotalArea: string;
  farmFieldCount: string;
  farmCropCount: string;
  farmSizeUnit: string;

  // Livestock
  livestockSummary: string;
  livestockTotal: string;
  livestockHealthy: string;
  livestockSick: string;
  livestockEmpty: string;
  livestockUnavailable: string;
  livestockUnavailableDesc: string;
  livestockLoginRequired: string;
  livestockEarTag: string;
  livestockSpecies: string;
  livestockValue: string;
  livestockAge: string;
  livestockWeight: string;
  livestockBreeding: string;
  livestockHealth: string;

  // Common
  close: string;
  clearSearch: string;
  save: string;
  cancel: string;
  seeAll: string;
  poweredBy: string;
  dataProvenance: string;

  // Profile screen
  profileUserFallback: string;
  profileGuest: string;
  profileNotSignedIn: string;
  profileTestConnection: string;
  profileOfflineDesc: string;

  // Marketplace screen
  marketNoPrices: string;
  marketNoMatch: string;
  marketAboutTitle: string;
  marketAboutBody: string;
  marketIntelTitle: string;
  marketIntelNote: string;
  marketIntelForecast: string;
  marketIntelSupplyDemand: string;
  marketIntelUnavailableHint: string;

  // AI assistant screen
  assistantErrorReply: string;
  assistantPreparing: string;

  // Units
  unitKg: string;
  currencyTnd: string;
  unitMm: string;
  unitKmh: string;
  farmDefaultSoil: string;
  farmDefaultCrop: string;

  // API client messages (localised at render time)
  apiUnavailable: string;
  apiTimeout: string;
  apiOffline: string;
  weatherFetchFailed: string;
  diseaseServiceUnconfigured: string;
  diseaseAnalysisFailed: string;
  soilAnalysisFailed: string;
  soilGradeUnknown: string;
  soilGradeHigh: string;
  soilGradeMedium: string;
  soilGradeLow: string;
  soilGradePoor: string;
  /** Fallback one-line provenance note when the server omits its disclaimer. */
  soilGenericDisclaimer: string;
  /** Fallback disease name when the model returns none. */
  diseaseUnknownName: string;
  /** Fallback one-line description when the model returns none. */
  diseaseGenericDescription: string;
  cropFetchFailed: string;
  soilAdvisoryUnavailable: string;
  soilReportFetchFailed: string;
  cropRequiresPersistedSoil: string;
  cultivationCreateFailed: string;
  cultivationLoadFailed: string;
  pestNeedSymptom: string;
  pestServiceUnconfigured: string;
  pestNoMatch: string;
  irrigationServiceUnconfigured: string;
  irrigationComputeFailed: string;
  assistantNoAnswer: string;
  fieldCreateFailed: string;
  farmCreateFailed: string;
  notificationsUnavailable: string;
  notificationUpdateFailed: string;
  apiLivestockUnavailable: string;
  newsFetchFailed: string;
  newsSourceSeparator: string;
  authFullNamePlaceholder: string;
  languageArabicLabel: string;
  listSeparator: string;
  arabicOnlyNote: string;
  // Multi-agent orchestration
  agentsTraceTitle: string;
  agentsTraceSubtitle: string;
  agentsPlanTitle: string;
  agentsRejectedPlan: string;
  agentsPlannedByLlm: string;
  agentsPlannedByKeywords: string;
  agentsConcurrency: string;
  agentsDuration: string;
  agentsRunTitle: string;
  agentsStepFindings: string;
  agentsStepNote: string;
  agentsStepAttempts: string;
  agentsStatusOk: string;
  agentsStatusInsufficient: string;
  agentsStatusUnavailable: string;
  agentsStatusBlocked: string;
  agentsStatusFailed: string;
  agentsSourceRuleBased: string;
  agentsSourceOpenMeteo: string;
  agentsSourceRecords: string;
  agentsSourceRss: string;
  agentsSourceTrained: string;
  agentsSourceLlm: string;
  agentsSourceNone: string;
  agentsConfidenceHigh: string;
  agentsConfidenceMedium: string;
  agentsConfidenceLow: string;
  agentsConfidenceUnknown: string;
  agentsShowTrace: string;
  agentsHideTrace: string;
  agentsRegistryTitle: string;
  agentsRegistrySubtitle: string;
  agentsRegistryLoadFailed: string;
  agentsSpecialistCount: string;
  agentsDependsOn: string;
  agentsNoDependencies: string;
  agentsInAction: string;
  agentsPreamble: string;
}

const ar: ExtraTranslations = {
  authSignIn: 'تسجيل الدخول',
  authSignUp: 'حساب جديد',
  authReset: 'استعادة كلمة المرور',
  authEmail: 'البريد الإلكتروني',
  authPassword: 'كلمة المرور',
  authFullName: 'الاسم الكامل',
  authPhone: 'رقم الهاتف (اختياري)',
  authSignInBtn: 'دخول إلى حسابي',
  authSignUpBtn: 'إنشاء حساب',
  authResetBtn: 'إرسال رابط الاستعادة',
  authNeedAccount: 'ليس لديك حساب؟',
  authHaveAccount: 'لديك حساب بالفعل؟',
  authForgot: 'نسيت كلمة المرور؟',
  authConfirmEmail: 'تم إنشاء الحساب. يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول.',
  authWelcomeBack: 'مرحباً بعودتك',
  authCreateAccount: 'إنشاء حساب AgriVibe',
  authSubtitle: 'سجّل الدخول للوصول إلى بيانات مزرعتك وأدواتك الزراعية',
  authErrEmailRequired: 'يرجى إدخال البريد الإلكتروني',
  authErrPasswordShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  authErrFullNameRequired: 'يرجى إدخال الاسم الكامل',
  authErrSignInFailed: 'تعذّر تسجيل الدخول',
  authErrSignUpFailed: 'تعذّر إنشاء الحساب',
  authErrResetFailed: 'تعذّر إرسال رابط الاستعادة',
  authErrUnreachable: 'تعذّر الاتصال بخدمة الحساب. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.',
  authConfirmTitle: 'تأكيد البريد الإلكتروني',
  authResetSentTitle: 'استعادة كلمة المرور',
  authResetSentBody: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.',
  authAccountType: 'نوع الحساب',
  roleFarmer: 'فلاح / مزارع',
  roleGardener: 'زراعة منزلية وحدائق',
  roleAgronomist: 'مهندس / خبير زراعي',
  roleVeterinarian: 'طبيب بيطري',
  roleCompany: 'شركة / تعاونية فلاحية',
  roleTrader: 'تاجر / مستثمر',
  roleInvestor: 'مستثمر / مؤسسة مالية',
  roleInspector: 'مراقب / إدارة حكومية',
  roleGovernment: 'إدارة حكومية',

  onboardingTitle: 'اختر نوع استخدامك',
  onboardingSubtitle: 'نخصص الواجهة والخدمات الأكثر ملاءمة لاحتياجاتك',
  onboardingContinue: 'متابعة',
  onboardingSkip: 'تخطّي',
  personaGardenerTitle: 'زراعة منزلية وحدائق',
  personaGardenerSub: 'رعاية نباتات الحديقة المنزلية، فحص الأوراق السريع، وجداول السقي البسيطة.',
  personaGardenerBadge: 'مبتدئ وعائلي',
  personaFarmerTitle: 'فلاح ومزارع محترف',
  personaFarmerSub: 'إدارة الحقول، تسميد التربة، الطقس الزراعي الحي، وجدولة الري بالتنقيط.',
  personaFarmerBadge: 'الوضع الأساسي',
  personaAgronomistTitle: 'مهندس وخبير زراعي',
  personaAgronomistSub: 'تحاليل التربة الدقيقة، خطط العلاج، وإرشاد الفلاحين.',
  personaAgronomistBadge: 'متقدم وخبير',
  personaCompanyTitle: 'شركات وتعاونيات فلاحية',
  personaCompanySub: 'إدارة إنتاج مزارع كبرى، تتبع سلاسل التوريد، ومراقبة الجودة.',
  personaCompanyBadge: 'إدارة وتخطيط',
  personaTraderTitle: 'تاجر ومستثمر زراعي',
  personaTraderSub: 'مؤشرات أسعار أسواق الجملة، توقعات الطلب والمواسم، ودراسات الربحية.',
  personaTraderBadge: 'تجارة واستثمار',
  personaInspectorTitle: 'مراقب جودة ومؤسسات',
  personaInspectorSub: 'تقارير السلامة النباتية، رقابة الجودة، والبيانات الإحصائية.',
  personaInspectorBadge: 'رقابة ومطابقة',
  personaVeterinarianTitle: 'طبيب بيطري',
  personaVeterinarianSub: 'متابعة صحة القطعان، التلقيح، وسجلات الثروة الحيوانية.',
  personaVeterinarianBadge: 'صحة الحيوان',
  personaInvestorTitle: 'مستثمر ومؤسسات مالية',
  personaInvestorSub: 'مؤشرات السوق، دراسات الجدوى، وفرص الاستثمار الفلاحي.',
  personaInvestorBadge: 'تمويل واستثمار',
  personaGovernmentTitle: 'إدارة حكومية وبحثية',
  personaGovernmentSub: 'البيانات الإحصائية، الأخبار الزراعية، ومتابعة السياسات الفلاحية.',
  personaGovernmentBadge: 'إدارة عامة',

  loginRequired: 'يلزم تسجيل الدخول',
  loginRequiredDesc: 'هذه الخدمة مرتبطة ببيانات حسابك الخاصة ومزرعتك.',
  loginToContinue: 'تسجيل الدخول للمتابعة',

  stateLoading: 'جاري التحميل...',
  stateEmpty: 'لا توجد بيانات لعرضها',
  stateError: 'تعذّر تحميل البيانات',
  stateOffline: 'لا يوجد اتصال بالإنترنت',
  stateUnavailable: 'هذه الخدمة غير متاحة حالياً',
  crashTitle: 'حدث خطأ غير متوقّع',
  crashMessage: 'تعذّر عرض هذا القسم. يمكنك إعادة المحاولة أو متابعة استخدام بقية التطبيق.',
  retry: 'إعادة المحاولة',
  cachedNotice: 'يتم عرض آخر بيانات محفوظة (وضع عدم الاتصال)',
  offlineBanner: 'أنت غير متصل بالإنترنت — تُعرض البيانات المحفوظة',
  notice: 'تنبيه',
  successTitle: 'نجاح',

  notificationsTitle: 'الإشعارات',
  notificationsEmpty: 'لا توجد إشعارات جديدة',
  markAllRead: 'تعليم الكل كمقروء',
  notificationUnread: 'غير مقروء',

  scannerCapture: 'التقاط صورة',
  scannerReview: 'مراجعة صورة النبات',
  scannerReviewSub: 'تأكد من وضوح الورقة أو البقع قبل التحليل',
  scannerConfirm: 'تأكيد وتحليل بالذكاء الاصطناعي',
  scannerRetake: 'إعادة الالتقاط',
  scannerPermissionTitle: 'إذن الكاميرا مطلوب',
  scannerPermissionDesc: 'يحتاج التطبيق للكاميرا لفحص أوراق النباتات واكتشاف الأمراض.',
  scannerGrant: 'منح إذن الكاميرا',
  scannerFromGallery: 'اختيار من المعرض',
  scannerGuidance: 'وجّه الكاميرا نحو الورقة بمسافة 15-20 سم',
  scannerAnalyzing: 'جاري تحليل الصورة...',
  scannerUnavailableTitle: 'خدمة تحليل الصور غير مُهيّأة',
  scannerUnavailableDesc: 'لا يوجد نموذج رؤية مُهيّأ على الخادم حالياً. لم يتم اختلاق أي نتيجة. يمكنك رفع الصورة بعد تهيئة خدمة الرؤية.',
  scannerSymptomsLabel: 'أعراض إضافية (اختياري)',
  scannerSymptomsPlaceholder: 'مثال: بقع صفراء دائرية، جفاف الأطراف...',
  scannerCaptureFailed: 'تعذّر التقاط الصورة',
  scannerGalleryDenied: 'يرجى منح إذن الوصول إلى معرض الصور',
  scannerAnalysisFailed: 'فشل تحليل الصورة',
  scannerNoConfidenceLong: 'لم يُبلّغ النموذج عن درجة ثقة رقمية لهذه الحالة.',
  scannerSeverityLabel: 'درجة الخطورة',
  scannerSeverityLow: 'منخفضة',
  scannerSeverityMedium: 'متوسطة',
  scannerSeverityHigh: 'مرتفعة',
  scannerSeverityCritical: 'حرجة',
  scannerSeverityUnknown: 'غير محدّدة',
  scannerSectionTreatment: 'العلاج',
  scannerSectionPrevention: 'الوقاية',
  scannerScanAnother: 'فحص صورة أخرى',

  // AI capabilities
  aiCapTitle: 'قدرات الذكاء الاصطناعي',
  aiCapSubtitle: 'حالة كل خدمة كما يعلنها الخادم فعلياً (GET /api/ai/capabilities) — لا نتائج مُختلقة',
  aiSummaryTotal: 'إجمالي القدرات',
  aiSummaryAvailable: 'متاحة',
  aiSummaryModelPowered: 'مدعومة بنموذج',
  aiEngineLlm: 'نموذج لغوي (LLM)',
  aiEngineVision: 'نموذج رؤية',
  aiEngineTrained: 'خدمة نموذج مدرّب',
  aiEngineRuleBased: 'محرك قواعد حتمي',
  aiEngineUnavailable: 'غير متاح',
  aiAvailable: 'متاح',
  aiNotConfigured: 'غير مُهيّأ',
  aiEngineProvenanceTitle: 'المحرّك ومصدر البيانات',
  aiRequires: 'يتطلب',
  aiNote: 'يعتمد المستشار الزراعي على منظومة تنسيق متعددة الوكلاء على الخادم (تخطيط، تنفيذ محدود التزامن، وأثر تشخيصي). لا يخلق هذا التطبيق أي نتيجة بنفسه؛ بل يعرض ما يرجعه الخادم مع تحديد مصدره.',
  aiNoCapabilities: 'لم يعلن الخادم عن أي قدرة ذكاء اصطناعي متاحة حالياً. لن يعرض التطبيق أي قدرة وهمية.',
  aiProviderConfigured: 'مزوّد الذكاء التوليدي مُهيّأ',
  aiProviderNone: 'لا يوجد مزوّد ذكاء توليدي مُهيّأ — تُستخدم محركات القواعد',

  diseaseStepImage: '1. صورة النبات أو الورقة المصابة',
  diseaseStepCrop: '2. نوع المحصول',
  diseaseStepPart: '3. الجزء المصاب',
  diseaseAnalyzeButton: 'تحليل الصورة',
  diseaseConfidenceLabel: 'ثقة النموذج',
  diseaseNoConfidence: 'لم يُبلّغ النموذج عن درجة ثقة',
  diseaseSymptoms: 'الأعراض',
  diseaseTreatment: 'خطة العلاج والمكافحة الفورية',
  diseasePrevention: 'الوقاية',
  diseaseLimitationsTitle: 'حدود الاستخدام',
  diseaseLimitationsText: 'النتيجة إرشادية مبنية على الصورة المرفوعة وقد تختلف عن التشخيص المخبري. يُنصح بتأكيدها مع مهندس زراعي قبل أي معالجة كيميائية.',
  diseaseGalleryDenied: 'يرجى منح إذن الوصول إلى معرض الصور.',
  diseasePickFirst: 'يرجى التقاط صورة أو اختيارها من المعرض أولاً.',
  cropOlive: 'شجر الزيتون',
  cropTomato: 'الطماطم',
  cropWheat: 'القمح والحبوب',
  cropCitrus: 'القوارص',
  cropDates: 'النخيل والتمور',
  cropPotato: 'البطاطا',
  partLeaves: 'الأوراق',
  partFruit: 'الثمار',
  partStem: 'الساق والأغصان',
  partRoot: 'الجذور',

  pestSymptomInput: 'وصف الأعراض',
  pestSymptomPlaceholder: 'مثال: أوراق مجعّدة، ثقوب في الأوراق، حشرات صغيرة...',
  pestIdentify: 'تحديد الآفة',
  pestNoResult: 'لم يتم التعرف على آفة من الأعراض المُدخلة.',

  irrigationCrop: 'نوع المحصول',
  irrigationStage: 'مرحلة النمو',
  irrigationCompute: 'حساب احتياجات الري',
  irrigationUnavailable: 'خدمة الري الذكي غير مُهيّأة على الخادم حالياً.',

  cropSoilPh: 'حموضة التربة (pH)',
  cropTemperature: 'متوسط الحرارة (°م)',
  cropRainfall: 'الأمطار السنوية (مم)',
  cropSalinity: 'الملوحة (dS/m)',
  cropArea: 'المساحة (هكتار)',
  cropCompute: 'احسب المحاصيل المناسبة',
  cropInputsHint: 'اترك الحقول فارغة لاستخدام القيم المرجعية العامة. القيم الفارغة تعني أن المحرك لا يأخذها في الحسبان.',
  cropInvalidInput: 'يرجى إدخال أرقام صحيحة أو ترك الحقول فارغة.',

  assistantUnavailable: 'تعذّر الحصول على إجابة من المستشار.',
  assistantProvenanceLlm: 'إجابة من نموذج لغوي مُهيّأ',
  assistantProvenanceRules: 'إجابة من محرك القواعد الزراعية المحلي',

  homeNoAlerts: 'لا توجد تنبيهات عاجلة اليوم',
  homeAlertsUnavailable: 'تعذّر تحميل التنبيهات؛ مخزن التنبيهات غير متاح حالياً.',
  homeWeatherUnavailable: 'تعذّر جلب بيانات الطقس',
  homeWeatherAdviceTitle: 'نصيحة الطقس لليوم',
  homeGuest: 'الفلاح الكريم',
  metricHumidity: 'رطوبة',
  metricWind: 'كم/س',
  priorityCritical: 'حرج',
  priorityHigh: 'مرتفع',
  priorityMedium: 'متوسط',
  priorityLow: 'منخفض',
  heroBadgeAnalyze: 'تحليل',
  heroBadgeLivestock: 'قطيع',
  heroBadgeMarkets: 'أسواق',
  heroBadgeManage: 'إدارة',
  heroBadgeInspect: 'فحص',
  heroBadgeIndicators: 'مؤشرات',
  heroBadgeNews: 'أخبار',

  newsTitle: 'الأخبار الزراعية التونسية',
  newsSubtitle: 'عناوين من مصادر نشر حقيقية عبر خلاصات RSS، مع اسم الناشر ورابط المقال الأصلي.',
  newsSearchPlaceholder: 'ابحث في الأخبار الزراعية...',
  newsAllCategories: 'كل الأقسام',
  newsEmpty: 'لا توجد أخبار مطابقة',
  newsEmptyDesc: 'لم تُرجع المصادر أي مقال مطابق حالياً. جرّب تحديث الصفحة أو تغيير كلمة البحث.',
  newsReadMore: 'قراءة المقال الأصلي',
  newsUnknownSource: 'مصدر غير معروف',
  newsSomeSourcesDown: 'مصادر لم تستجب في هذا التحديث:',

  videoCatPruning: 'التقليم',
  videoCatIrrigation: 'الري',
  videoCatSoilPrep: 'تحضير التربة',
  videoCatComposting: 'التسميد والكمبوست',
  videoCatPlantProtection: 'وقاية النبات',
  videoCatVegetableGrowing: 'زراعة الخضروات',
  videoCatLivestock: 'تربية المواشي',
  videoCatGreenhouse: 'البيوت المحمية',
  videoCatHarvest: 'الحصاد',
  videoDurationMinutes: 'دقيقة',
  videoLanguageArabic: 'بالعربية',
  videoLanguageEnglish: 'بالإنجليزية',

  academyTitle: 'أكاديمية AgriVibe',
  academySubtitle: 'مواضيع زراعية مرتبطة بمحتوى حقيقي وخدمات فعلية.',
  academyOpenVideos: 'دروس مصوّرة',
  academyOpenService: 'افتح الخدمة',
  academyPlanting: 'الزراعة والبذر',
  academyPlantingDesc: 'اختيار المحاصيل المناسبة وموعد الزراعة.',
  academySoil: 'التربة والتسميد',
  academySoilDesc: 'تحليل التربة وتوصيات التسميد.',
  academyIrrigation: 'الري',
  academyIrrigationDesc: 'تقنيات الري وترشيد المياه.',
  academyFertilisation: 'التسميد العضوي',
  academyFertilisationDesc: 'الكمبوست وتغذية النبات.',
  academyDiseases: 'أمراض النباتات',
  academyDiseasesDesc: 'التشخيص بالصورة وعلامات المرض.',
  academyPest: 'مكافحة الآفات',
  academyPestDesc: 'التعرّف على الآفات من الأعراض.',
  academyPruning: 'التقليم',
  academyPruningDesc: 'تقليم الأشجار والمحاصيل.',
  academyHarvest: 'الحصاد',
  academyHarvestDesc: 'تقنيات الحصاد وما بعد الحصاد.',
  academyLivestock: 'تربية المواشي',
  academyLivestockDesc: 'رعاية الأغنام والأبقار.',
  academyTechnology: 'التقنية الزراعية',
  academyTechnologyDesc: 'الذكاء الاصطناعي في الفلاحة.',

  seasonWinter: 'الشتاء',
  seasonSpring: 'الربيع',
  seasonSummer: 'الصيف',
  seasonAutumn: 'الخريف',
  seasonWinterTip: 'التقليم الرئيسي لأشجار الزيتون والثمار، وحراثة التربة، والاستعداد لموسم الأمطار.',
  seasonSpringTip: 'التسميد، ومكافحة الآفات، وزرع الخضروات الصيفية، ومتابعة الري.',
  seasonSummerTip: 'الري المنتظم، والحماية من الحرارة، والحصاد المبكر للمحاصيل الصيفية.',
  seasonAutumnTip: 'بدء موسم الزيتون، وتحضير الأرض، وزرع المحاصيل الشتوية.',

  profileSignInPrompt: 'سجّل الدخول للوصول إلى بياناتك',
  profileSignOutConfirm: 'هل تريد تسجيل الخروج من حسابك؟',
  profileSignedInAs: 'مسجّل الدخول باسم',
  profileServerReachable: 'تم الاتصال بخادم AgriVibe بنجاح.',
  profileCacheCleared: 'تم مسح البيانات المؤقتة المخزّنة على الجهاز.',
  profileClearCache: 'مسح البيانات المؤقتة',
  profileSupabaseUnconfigured: 'Supabase غير مُهيّأ (تحقق من متغيرات البيئة).',

  farmAddField: 'إضافة حقل',
  farmFieldName: 'اسم الحقل',
  farmFieldArea: 'المساحة (هكتار)',
  farmEmpty: 'لم تُسجّل أي حقول بعد',
  farmLoginToManage: 'سجّل الدخول لإدارة حقولك ومزارعك',
  farmAddFarm: 'تسجيل مزرعة جديدة',
  farmName: 'اسم المزرعة',
  farmRegion: 'الولاية / المنطقة',
  farmSize: 'المساحة الإجمالية (هكتار)',
  farmNoFarmYet: 'لا توجد مزرعة مسجّلة في حسابك',
  farmCreateHint: 'ابدأ بتسجيل مزرعتك ثم أضف حقولها وقطع أراضيها لمتابعتها في الميدان.',
  farmSaveFarm: 'حفظ المزرعة في قاعدة البيانات',

  // Services catalogue
  svcBadgeSoil: 'تسميد علمي',
  svcBadgeCrops: 'ربحية أعلى',
  svcBadgeDisease: 'فحص بالصورة',
  svcBadgePest: 'مكافحة متكاملة',
  svcBadgeIrrigation: 'توفير المياه',
  svcBadgeWeather: 'محطات تونسية',
  svcBadgeFarms: 'خرائط الحقول',
  svcBadgeLivestock: 'أغنام وأبقار',
  svcBadgeCommunity: 'مجتمع الفلاحين',
  svcBadgeExpert: 'مهندسون وبياطرة',
  svcBadgeMultiAgent: 'وكلاء متخصصون',
  svcBadgeNews: 'RSS حقيقي',
  svcBadgeHistory: 'سجل مؤرخ',
  svcBadgeLearning: 'يوتيوب حقيقي',
  recentAnalysesTitle: 'سجل التحاليل السابقة',
  recentAnalysesDesc: 'مراجعة كافة نتائج تشخيص الأمراض وتحاليل التربة المحفوظة مع توصياتها وتاريخ إجرائها.',
  servicesLaunch: 'ابدأ الاستخدام',
  servicesNoMatch: 'لا توجد خدمة مطابقة لبحثك. جرّب كلمة أخرى أو اختر فئة مختلفة.',

  // Soil analysis screen
  soilFormHeading: 'أدخل نتائج تحليل عينة التربة (اترك الحقل فارغاً إذا لم تتوفر القيمة)',
  soilPhLabel: 'درجة حموضة التربة (pH)',
  soilPhHint: 'المثالي: 6.5 - 7.8',
  soilNitrogenLabel: 'الآزوت N (ملغ/كغ)',
  soilPhosphorusLabel: 'الفسفور P (ملغ/كغ)',
  soilPotassiumLabel: 'البوتاسيوم K (ملغ/كغ)',
  soilOrganicMatterLabel: 'المادة العضوية (%)',
  soilMoistureLabel: 'رطوبة التربة (%) — اختياري',
  soilAnalyzeButton: 'تحليل خصوبة التربة',
  soilFertilityScore: 'تقييم الخصوبة',
  soilProblems: 'مشاكل تم رصدها',
  soilMissingMeasurements: 'قياسات ناقصة (تحتاج تحليلاً مخبرياً)',
  soilFindings: 'قراءة المؤشرات',
  soilRecommendations: 'التوصيات الزراعية',
  soilNeedOneMeasurement: 'أدخل قياساً واحداً على الأقل من نتائج التحليل المخبري. الحقول الفارغة تُعامل كقياسات ناقصة ولا تُخترع لها قيم.',
  soilInvalidInput: 'يرجى إدخال أرقام صحيحة أو ترك الحقول فارغة.',
  soilBlankNote: 'الحقول الفارغة تُرسل كقياسات ناقصة؛ لا يُستبدل أي قياس بقيمة افتراضية.',

  // Weather screen
  weatherSubtitle: 'بيانات حية مباشرة من محطات الرصد الجوي التونسية (Open-Meteo)',
  weatherLiveBadge: 'بيانات حية',
  weatherHumidity: 'الرطوبة',
  weatherRainToday: 'أمطار اليوم',
  weatherWindSpeed: 'سرعة الرياح',
  weatherForecast: 'توقعات الأيام القادمة',
  weatherForecastEmpty: 'لا تتوفر توقعات يومية من مزوّد الطقس حالياً.',
  weatherLoading: 'جاري جلب أحدث بيانات الرصد الجوي...',
  weatherUseMyLocation: 'استخدم موقعي',
  weatherLocating: 'جارٍ تحديد موقعك...',
  weatherLocationDenied: 'تم رفض إذن الموقع. اختر ولاية من القائمة.',
  weatherLocationFailed: 'تعذّر تحديد الموقع. اختر ولاية من القائمة.',
  weatherMyLocationLabel: 'موقعي الحالي',

  // Crop recommendation screen
  cropEmptyResult: 'لم تُرجع خدمة التوصيات أي محصول مطابق.',
  cropSuitabilityShort: 'ملاءمة',
  cropEstimatedProfit: 'العائد التقديري للهكتار',
  cropWaterRequirement: 'الاحتياج المائي',
  cropHistorySummary: '{score}% ملاءمة • {count} محصول مقترح',

  // Recent analyses screen
  recentAnalysesSubtitle: 'مراجعة نتائج التشخيص الزراعي وخطط العلاج المحفوظة لحقولك',
  recentAnalysesEmptyTitle: 'لا يوجد سجل بعد',
  recentAnalysesEmptyMsg: 'ستظهر هنا نتائج الفحوصات والتحاليل التي تُجريها على هذا الجهاز.',
  recentAnalysesClear: 'مسح السجل',
  recentAnalysesClearConfirm: 'سيتم حذف جميع التحاليل المحفوظة على هذا الجهاز. لا يمكن التراجع عن هذا الإجراء.',
  recentAnalysesViewImage: 'عرض الصورة المرفقة',
  recentAnalysesTapHint: 'اضغط على أي عنصر لعرض التفاصيل.',
  weatherOpenDetail: 'اضغط لعرض تفاصيل الطقس.',
  articleOpenSource: 'اضغط لفتح المقال في المتصفح.',
  recentAnalysesRunAgain: 'إعادة إجراء التحليل',

  // Secondary services (irrigation / pest / disabled services)
  svcUnavailableTitle: 'غير متاح بعد',
  expertDisabledNote: 'خدمة الاستشارات موجودة على الخادم لكنها معطّلة حالياً (503) لأن بياناتها غير مثبّتة في قاعدة البيانات. لن نعرض أي بيانات مختلقة. يمكنك في الأثناء استخدام المستشار الزراعي الذكي.',
  communityDisabledNote: 'منتدى المجتمع موجود على الخادم لكنه معطّل حالياً (503) لأن المنشورات مخزّنة مؤقتاً في الذاكرة وليست مثبّتة. لن نعرض أي بيانات مختلقة.',
  svcNotWiredNote: 'هذه الخدمة غير مرتبطة بواجهة برمجية موثّقة على الخادم.',
  irrigationUnavailableTitle: 'خدمة الري غير مُهيّأة',
  pestUnavailableTitle: 'خدمة الآفات غير مُهيّأة',
  pestSeparatorHint: 'افصل بين الأعراض بفاصلة. تُطابق الخدمة الأعراض مع قاعدة كلمات مفتاحية ولا تخمّن أي تحديد.',
  pestCropOptional: 'نوع المحصول (اختياري)',
  pestCropPlaceholder: 'olive / tomato / wheat',
  pestMethodPrefix: 'طريقة التحديد',
  pestSymptomsUsed: 'الأعراض المستخدمة',
  pestNoConfidenceNote: 'لا تُعرض أي درجة ثقة لأن أداة المطابقة بالكلمات المفتاحية غير مُعايَرة.',
  irrigationNoDetails: 'لا توجد تفاصيل إضافية من الخدمة.',
  irrigationRecommendations: 'توصيات',
  metricDailyRequirement: 'الاحتياج اليومي',
  metricWeeklyRequirement: 'الاحتياج الأسبوعي',
  metricEt0: 'التبخر-النتح المرجعي (ET₀)',
  metricCropCoefficient: 'معامل المحصول (Kc)',
  metricWaterEfficiency: 'كفاءة استخدام المياه',
  irrigationRawUnknown: 'أعادت الخدمة ردّاً بلا حقول معروفة. القيم الخام غير معروضة لأنها غير مُفسّرة.',
  irrigationWeatherSource: 'درجة الحرارة والرطوبة المرسلتان إلى خدمة الري من الطقس الحي (Open-Meteo) لولايتك.',

  // Crop / growth-stage labels
  stageVegetative: 'نمو خضري',
  stageFlowering: 'إزهار',
  stageFruiting: 'إثمار',
  stageMaturity: 'نضج',
  farmSaved: 'تم حفظ المزرعة بنجاح.',
  farmRequiredFields: 'يرجى إدخال اسم المزرعة والمنطقة والمساحة.',
  farmInvalidArea: 'أدخل مساحة صحيحة بالهكتار (رقم أكبر من صفر).',
  farmError: 'تعذّر إتمام العملية.',
  farmFieldsSection: 'حقول وقطع المزرعة',
  farmCurrentCrop: 'المحصول الحالي',
  farmSoilType: 'نوع التربة',
  farmTotalArea: 'إجمالي المساحة المستغلة',
  farmFieldCount: 'عدد الحقول',
  farmCropCount: 'المحاصيل المسجّلة',
  farmSizeUnit: 'هكتار',

  livestockSummary: 'ملخص الثروة الحيوانية',
  livestockTotal: 'إجمالي الرؤوس',
  livestockHealthy: 'بحالة جيدة',
  livestockSick: 'تحتاج متابعة',
  livestockEmpty: 'لم تُسجّل أي حيوانات بعد.',
  livestockUnavailable: 'جدول الثروة الحيوانية غير مهيّأ على الخادم',
  livestockUnavailableDesc: 'لا توجد جداول ثروة حيوانية مُهيّأة في قاعدة البيانات حالياً. لم نعرض أي بيانات مختلقة.',
  livestockLoginRequired: 'سجّل الدخول لعرض سجل حيواناتك المحفوظ.',
  livestockEarTag: 'رقم الأذن',
  livestockSpecies: 'النوع',
  livestockValue: 'القيمة التقديرية',
  livestockAge: 'العمر',
  livestockWeight: 'الوزن',
  livestockBreeding: 'الحالة التناسلية',
  livestockHealth: 'الحالة الصحية',

  close: 'إغلاق',
  clearSearch: 'مسح البحث',
  save: 'حفظ',
  cancel: 'إلغاء',
  seeAll: 'عرض الكل',
  poweredBy: 'مصدر البيانات',
  dataProvenance: 'مصدر البيانات',

  // Profile screen
  profileUserFallback: 'مستخدم AgriVibe',
  profileGuest: 'زائر',
  profileNotSignedIn: 'غير مسجّل الدخول',
  profileTestConnection: 'اختبار الاتصال بالخادم الآن',
  profileOfflineDesc: 'يتم حفظ بيانات الطقس، الحقول، والتشخيص محلياً لتصفحها في الحقل دون إنترنت.',

  // Marketplace screen
  marketNoPrices: 'لا توجد أسعار مسجّلة حالياً في قاعدة بيانات المنصة.',
  marketNoMatch: 'لا يوجد محصول مطابق لبحثك.',
  marketAboutTitle: 'حول هذه الأسعار',
  marketAboutBody: 'هذه القيم مسجّلة في قاعدة بيانات المنصة وتمثل أسعاراً مرصودة. لا تُعرض أي اتجاهات (صعود/هبوط) إلا إذا وفّرها الخادم فعلياً. تحقق من أسواق الجملة المحلية قبل البيع.',
  marketIntelTitle: 'ذكاء السوق',
  marketIntelNote: 'حالة خدمات التحليل السوقي كما يعلنها الخادم الآن — لا نعرض توقعات مختلقة.',
  marketIntelForecast: 'توقّع الأسعار',
  marketIntelSupplyDemand: 'العرض والطلب',
  marketIntelUnavailableHint: 'غير متاح حتى يتم ربط مصدر سوق موثّق ومؤرّخ ونموذج متحقّق منه. تحقق من أسواق الجملة المحلية قبل القرار.',

  // AI assistant screen
  assistantErrorReply: 'عذراً، حدث خطأ أثناء معالجة السؤال. يرجى التأكد من الاتصال والمحاولة ثانية.',
  assistantPreparing: 'جاري إعداد الإجابة الزراعية...',

  // Units
  unitKg: 'كغ',
  currencyTnd: 'د.ت',
  unitMm: 'مم',
  unitKmh: 'كم/س',
  farmDefaultSoil: 'طينية خصبة',
  farmDefaultCrop: 'زيتون شملالي',

  // API client messages (localised at render time)
  apiUnavailable: 'الخدمة غير متاحة حالياً على الخادم',
  apiTimeout: 'انتهت مهلة الاتصال بالخادم',
  apiOffline: 'تعذر الاتصال بخادم AgriVibe',
  weatherFetchFailed: 'تعذّر جلب بيانات الطقس الحية',
  diseaseServiceUnconfigured: 'خدمة تشخيص الصور غير مُهيّأة',
  diseaseAnalysisFailed: 'فشل تحليل الصورة',
  soilAnalysisFailed: 'تعذّر تحليل التربة',
  soilGradeUnknown: 'غير محدد',
  soilGradeHigh: 'عالية',
  soilGradeMedium: 'متوسطة',
  soilGradeLow: 'منخفضة',
  soilGradePoor: 'ضعيفة',
  soilGenericDisclaimer: 'تحليل مبني على قواعد زراعية ثابتة (وليس نموذج تعلّم آلي).',
  diseaseUnknownName: 'حالة نباتية',
  diseaseGenericDescription: 'تحليل صورة النبتة.',
  cropFetchFailed: 'تعذّر جلب توصيات المحاصيل',
  soilAdvisoryUnavailable: 'خدمة الاستشارة الذكية غير مهيأة؛ تم استخدام المحرك الإرشادي بدلاً منها.',
  soilReportFetchFailed: 'تعذّر استرجاع التقرير.',
  cropRequiresPersistedSoil: 'يلزم تحليل تربة محفوظ لهذه القطعة قبل التوصيات.',
  cultivationCreateFailed: 'تعذّر حفظ المشروع الزراعي.',
  cultivationLoadFailed: 'تعذّر تحميل المشاريع الزراعية.',
  pestNeedSymptom: 'يرجى وصف عرض واحد على الأقل',
  pestServiceUnconfigured: 'خدمة مكافحة الآفات غير مُهيّأة',
  pestNoMatch: 'لم يتم التعرف على الآفة',
  irrigationServiceUnconfigured: 'خدمة الري الذكي غير مُهيّأة',
  irrigationComputeFailed: 'تعذّر حساب جدولة الري',
  assistantNoAnswer: 'تعذّر الحصول على إجابة',
  fieldCreateFailed: 'تعذّر إنشاء الحقل',
  farmCreateFailed: 'تعذّر إنشاء المزرعة',
  notificationsUnavailable: 'الإشعارات غير متاحة',
  notificationUpdateFailed: 'تعذّر تحديث حالة الإشعار',
  apiLivestockUnavailable: 'بيانات الثروة الحيوانية غير متاحة',
  newsFetchFailed: 'تعذّر جلب الأخبار الزراعية',
  newsSourceSeparator: '، ',
  authFullNamePlaceholder: 'محمد علي',
  languageArabicLabel: 'العربية (تونس)',
  listSeparator: '، ',
  arabicOnlyNote: 'ملاحظة: النصوص التفصيلية لهذه النتيجة مُصاغة بالعربية فقط من محرّك القواعد على الخادم.',
  agentsTraceTitle: 'تنسيق الوكلاء المتعدّدين',
  agentsTraceSubtitle: 'كيف وزّع الخادم سؤالك على الوكلاء المتخصّصين ودمج نتائجهم.',
  agentsPlanTitle: 'الخطة التنفيذية',
  agentsRejectedPlan: 'اقترح النموذج وكلاء خارج القائمة المسموح بها وتم تجاهلهم:',
  agentsPlannedByLlm: 'اختار النموذج اللغوي الخطة',
  agentsPlannedByKeywords: 'اختيرت الخطة بالكلمات المفتاحية',
  agentsConcurrency: 'التزامن',
  agentsDuration: 'المدة',
  agentsRunTitle: 'نتائج الوكلاء',
  agentsStepFindings: 'النتائج',
  agentsStepNote: 'ملاحظة',
  agentsStepAttempts: 'المحاولات',
  agentsStatusOk: 'تم',
  agentsStatusInsufficient: 'بيانات ناقصة',
  agentsStatusUnavailable: 'غير متاح',
  agentsStatusBlocked: 'محجوب',
  agentsStatusFailed: 'فشل',
  agentsSourceRuleBased: 'قواعد حتمية',
  agentsSourceOpenMeteo: 'طقس حقيقي (Open-Meteo)',
  agentsSourceRecords: 'سجلات محفوظة',
  agentsSourceRss: 'خلاصات RSS حقيقية',
  agentsSourceTrained: 'نموذج مدرّب',
  agentsSourceLlm: 'نموذج لغوي توليدي',
  agentsSourceNone: 'لا مصدر',
  agentsConfidenceHigh: 'ثقة عالية',
  agentsConfidenceMedium: 'ثقة متوسطة',
  agentsConfidenceLow: 'ثقة منخفضة',
  agentsConfidenceUnknown: 'ثقة غير محدّدة',
  agentsShowTrace: 'اعرض مسار التنسيق',
  agentsHideTrace: 'أخفِ مسار التنسيق',
  agentsRegistryTitle: 'سجلّ الوكلاء المتخصّصين',
  agentsRegistrySubtitle: 'القائمة المقيّدة التي ينفّذها المنسّق فعلياً على الخادم.',
  agentsRegistryLoadFailed: 'تعذّر جلب سجلّ الوكلاء.',
  agentsSpecialistCount: 'عدد الوكلاء',
  agentsDependsOn: 'يعتمد على',
  agentsNoDependencies: 'مستقل',
  agentsInAction: 'الوكلاء أثناء العمل',
  agentsPreamble: 'كل إجابة من المساعد تمرّ عبر منسّق مركزي يختار الوكلاء المتخصّصين حسب سؤالك، ينفّذهم ضمن خطة محدودة، ثم يدمج نتائجهم الموسومة بمصادرها.',
};

const fr: ExtraTranslations = {
  authSignIn: 'Connexion',
  authSignUp: 'Nouveau compte',
  authReset: 'Mot de passe oublié',
  authEmail: 'Adresse e-mail',
  authPassword: 'Mot de passe',
  authFullName: 'Nom complet',
  authPhone: 'Téléphone (optionnel)',
  authSignInBtn: 'Se connecter',
  authSignUpBtn: 'Créer un compte',
  authResetBtn: 'Envoyer le lien de réinitialisation',
  authNeedAccount: 'Pas encore de compte ?',
  authHaveAccount: 'Vous avez déjà un compte ?',
  authForgot: 'Mot de passe oublié ?',
  authConfirmEmail: 'Compte créé. Confirmez votre e-mail puis connectez-vous.',
  authWelcomeBack: 'Bon retour',
  authCreateAccount: 'Créer un compte AgriVibe',
  authSubtitle: 'Connectez-vous pour accéder aux données de votre exploitation',
  authErrEmailRequired: 'Veuillez saisir votre adresse e-mail',
  authErrPasswordShort: 'Le mot de passe doit comporter au moins 6 caractères',
  authErrFullNameRequired: 'Veuillez saisir votre nom complet',
  authErrSignInFailed: 'Connexion impossible',
  authErrSignUpFailed: 'Création du compte impossible',
  authErrResetFailed: 'Envoi du lien de réinitialisation impossible',
  authErrUnreachable: 'Service de compte injoignable. Vérifiez votre connexion internet et réessayez.',
  authConfirmTitle: 'Confirmation de l’e-mail',
  authResetSentTitle: 'Réinitialisation du mot de passe',
  authResetSentBody: 'Un lien de réinitialisation a été envoyé à votre adresse e-mail.',
  authAccountType: 'Type de compte',
  roleFarmer: 'Agriculteur / Exploitant',
  roleGardener: 'Jardinage familial',
  roleAgronomist: 'Ingénieur / Expert agricole',
  roleVeterinarian: 'Vétérinaire',
  roleCompany: 'Société / Coopérative',
  roleTrader: 'Commerçant / Investisseur',
  roleInvestor: 'Investisseur / Institution',
  roleInspector: 'Inspecteur / Administration',
  roleGovernment: 'Administration publique',

  onboardingTitle: 'Choisissez votre profil',
  onboardingSubtitle: 'Nous adaptons l’interface et les services à vos besoins',
  onboardingContinue: 'Continuer',
  onboardingSkip: 'Passer',
  personaGardenerTitle: 'Jardinage familial',
  personaGardenerSub: 'Entretien des plantes du jardin, diagnostic rapide des feuilles et arrosage simple.',
  personaGardenerBadge: 'Débutant & familial',
  personaFarmerTitle: 'Agriculteur professionnel',
  personaFarmerSub: 'Gestion des parcelles, fertilisation, météo agricole en direct et irrigation goutte-à-goutte.',
  personaFarmerBadge: 'Mode principal',
  personaAgronomistTitle: 'Ingénieur & expert agricole',
  personaAgronomistSub: 'Analyses de sol précises, plans de traitement et conseil aux agriculteurs.',
  personaAgronomistBadge: 'Avancé & expert',
  personaCompanyTitle: 'Sociétés & coopératives',
  personaCompanySub: 'Gestion de la production, suivi des chaînes d’approvisionnement et contrôle qualité.',
  personaCompanyBadge: 'Gestion & planification',
  personaTraderTitle: 'Commerçant & investisseur',
  personaTraderSub: 'Indicateurs des prix de gros, prévisions de demande et études de rentabilité.',
  personaTraderBadge: 'Commerce & investissement',
  personaInspectorTitle: 'Inspecteur qualité & institutions',
  personaInspectorSub: 'Rapports de santé végétale, contrôle qualité et données statistiques.',
  personaInspectorBadge: 'Contrôle & conformité',
  personaVeterinarianTitle: 'Vétérinaire',
  personaVeterinarianSub: 'Suivi sanitaire des troupeaux, vaccination et registres d’élevage.',
  personaVeterinarianBadge: 'Santé animale',
  personaInvestorTitle: 'Investisseur & institutions',
  personaInvestorSub: 'Indicateurs de marché, études de faisabilité et opportunités d’investissement.',
  personaInvestorBadge: 'Finance & investissement',
  personaGovernmentTitle: 'Administration & recherche',
  personaGovernmentSub: 'Données statistiques, actualités agricoles et suivi des politiques.',
  personaGovernmentBadge: 'Administration publique',

  loginRequired: 'Connexion requise',
  loginRequiredDesc: 'Ce service est lié aux données de votre compte et de votre exploitation.',
  loginToContinue: 'Se connecter pour continuer',

  stateLoading: 'Chargement...',
  stateEmpty: 'Aucune donnée à afficher',
  stateError: 'Échec du chargement',
  stateOffline: 'Pas de connexion Internet',
  stateUnavailable: 'Ce service est actuellement indisponible',
  crashTitle: 'Une erreur inattendue est survenue',
  crashMessage: 'Impossible d’afficher cette section. Réessayez ou continuez à utiliser le reste de l’application.',
  retry: 'Réessayer',
  cachedNotice: 'Affichage des dernières données enregistrées (hors ligne)',
  offlineBanner: 'Vous êtes hors ligne — données enregistrées affichées',
  notice: 'Attention',
  successTitle: 'Succès',

  notificationsTitle: 'Notifications',
  notificationsEmpty: 'Aucune nouvelle notification',
  markAllRead: 'Tout marquer comme lu',
  notificationUnread: 'Non lu',

  scannerCapture: 'Prendre une photo',
  scannerReview: 'Vérifier la photo',
  scannerReviewSub: 'Assurez-vous que la feuille ou les taches sont nettes',
  scannerConfirm: 'Confirmer et analyser',
  scannerRetake: 'Reprendre',
  scannerPermissionTitle: 'Autorisation caméra requise',
  scannerPermissionDesc: 'L’application a besoin de la caméra pour analyser les feuilles.',
  scannerGrant: 'Autoriser la caméra',
  scannerFromGallery: 'Choisir dans la galerie',
  scannerGuidance: 'Cadrez la feuille à 15-20 cm',
  scannerAnalyzing: 'Analyse de l’image...',
  scannerUnavailableTitle: 'Analyse d’image non configurée',
  scannerUnavailableDesc: 'Aucun modèle de vision n’est configuré côté serveur. Aucun résultat n’a été inventé.',
  scannerSymptomsLabel: 'Symptômes supplémentaires (optionnel)',
  scannerSymptomsPlaceholder: 'Ex. : taches jaunes, dessèchement des bords...',
  scannerCaptureFailed: 'Échec de la prise de vue',
  scannerGalleryDenied: 'Veuillez autoriser l’accès à la galerie photos',
  scannerAnalysisFailed: 'Échec de l’analyse de l’image',
  scannerNoConfidenceLong: 'Le modèle n’a pas rapporté de score de confiance numérique pour ce cas.',
  scannerSeverityLabel: 'Gravité',
  scannerSeverityLow: 'Faible',
  scannerSeverityMedium: 'Moyenne',
  scannerSeverityHigh: 'Élevée',
  scannerSeverityCritical: 'Critique',
  scannerSeverityUnknown: 'Non précisée',
  scannerSectionTreatment: 'Traitement',
  scannerSectionPrevention: 'Prévention',
  scannerScanAnother: 'Analyser une autre photo',

  // AI capabilities
  aiCapTitle: 'Capacités d’IA',
  aiCapSubtitle: 'État de chaque service tel que déclaré par le serveur (GET /api/ai/capabilities) — aucun résultat inventé',
  aiSummaryTotal: 'Total des capacités',
  aiSummaryAvailable: 'Disponibles',
  aiSummaryModelPowered: 'Basées sur un modèle',
  aiEngineLlm: 'Modèle de langage (LLM)',
  aiEngineVision: 'Modèle de vision',
  aiEngineTrained: 'Service de modèle entraîné',
  aiEngineRuleBased: 'Moteur de règles déterministe',
  aiEngineUnavailable: 'Indisponible',
  aiAvailable: 'Disponible',
  aiNotConfigured: 'Non configuré',
  aiEngineProvenanceTitle: 'Moteur et source des données',
  aiRequires: 'Nécessite',
  aiNote: 'L’assistant agricole repose sur une orchestration multi-agents côté serveur (planification, exécution à concurrence limitée et trace de diagnostic). L’application ne crée aucun résultat elle-même : elle affiche ce que le serveur renvoie en indiquant sa source.',
  aiNoCapabilities: 'Le serveur ne déclare aucune capacité d’IA disponible pour l’instant. L’application n’affichera aucune capacité fictive.',
  aiProviderConfigured: 'Fournisseur d’IA générative configuré',
  aiProviderNone: 'Aucun fournisseur d’IA générative configuré — moteurs de règles utilisés',

  diseaseStepImage: '1. Photo de la plante ou de la feuille atteinte',
  diseaseStepCrop: '2. Type de culture',
  diseaseStepPart: '3. Partie atteinte',
  diseaseAnalyzeButton: 'Analyser l’image',
  diseaseConfidenceLabel: 'Confiance du modèle',
  diseaseNoConfidence: 'Le modèle n’a pas rapporté de score de confiance',
  diseaseSymptoms: 'Symptômes',
  diseaseTreatment: 'Plan de traitement immédiat',
  diseasePrevention: 'Prévention',
  diseaseLimitationsTitle: 'Limites d’utilisation',
  diseaseLimitationsText: 'Le résultat est indicatif, fondé sur l’image envoyée, et peut différer d’un diagnostic en laboratoire. Faites-le confirmer par un ingénieur agronome avant tout traitement chimique.',
  diseaseGalleryDenied: 'Veuillez autoriser l’accès à la galerie photos.',
  diseasePickFirst: 'Veuillez d’abord prendre ou choisir une photo.',
  cropOlive: 'Olivier',
  cropTomato: 'Tomate',
  cropWheat: 'Blé et céréales',
  cropCitrus: 'Agrumes',
  cropDates: 'Palmier-dattier',
  cropPotato: 'Pomme de terre',
  partLeaves: 'Feuilles',
  partFruit: 'Fruits',
  partStem: 'Tige et rameaux',
  partRoot: 'Racines',

  pestSymptomInput: 'Description des symptômes',
  pestSymptomPlaceholder: 'Ex. : feuilles crispées, trous, petits insectes...',
  pestIdentify: 'Identifier le ravageur',
  pestNoResult: 'Aucun ravageur identifié à partir des symptômes saisis.',

  irrigationCrop: 'Culture',
  irrigationStage: 'Stade de croissance',
  irrigationCompute: 'Calculer les besoins en eau',
  irrigationUnavailable: 'Le service d’irrigation n’est pas configuré sur le serveur.',

  cropSoilPh: 'pH du sol',
  cropTemperature: 'Température moyenne (°C)',
  cropRainfall: 'Pluviométrie annuelle (mm)',
  cropSalinity: 'Salinité (dS/m)',
  cropArea: 'Superficie (ha)',
  cropCompute: 'Calculer les cultures adaptées',
  cropInputsHint: 'Laissez un champ vide pour utiliser la référence générale. Un champ vide signifie que le moteur ne le prend pas en compte.',
  cropInvalidInput: 'Saisissez des nombres valides ou laissez les champs vides.',

  assistantUnavailable: 'Impossible d’obtenir une réponse de l’assistant.',
  assistantProvenanceLlm: 'Réponse d’un modèle de langage configuré',
  assistantProvenanceRules: 'Réponse du moteur de règles local',

  homeNoAlerts: 'Aucune alerte urgente aujourd’hui',
  homeAlertsUnavailable: 'Alertes indisponibles : le stockage des notifications est injoignable.',
  homeWeatherUnavailable: 'Météo indisponible',
  homeWeatherAdviceTitle: 'Conseil météo du jour',
  homeGuest: 'Cher agriculteur',
  metricHumidity: 'humidité',
  metricWind: 'km/h',
  priorityCritical: 'Critique',
  priorityHigh: 'Élevée',
  priorityMedium: 'Moyenne',
  priorityLow: 'Faible',
  heroBadgeAnalyze: 'Analyse',
  heroBadgeLivestock: 'Cheptel',
  heroBadgeMarkets: 'Marchés',
  heroBadgeManage: 'Gestion',
  heroBadgeInspect: 'Inspection',
  heroBadgeIndicators: 'Indicateurs',
  heroBadgeNews: 'Actualités',

  newsTitle: 'Actualités agricoles tunisiennes',
  newsSubtitle: 'Titres issus de vrais flux RSS d’éditeurs, avec le nom de l’éditeur et le lien vers l’article original.',
  newsSearchPlaceholder: 'Rechercher dans les actualités...',
  newsAllCategories: 'Toutes les rubriques',
  newsEmpty: 'Aucune actualité correspondante',
  newsEmptyDesc: 'Aucun article correspondant n’a été renvoyé. Actualisez la page ou modifiez votre recherche.',
  newsReadMore: 'Lire l’article original',
  newsUnknownSource: 'Source inconnue',
  newsSomeSourcesDown: 'Sources n’ayant pas répondu lors de cette mise à jour :',

  videoCatPruning: 'Taille',
  videoCatIrrigation: 'Irrigation',
  videoCatSoilPrep: 'Préparation du sol',
  videoCatComposting: 'Compostage & fertilisation',
  videoCatPlantProtection: 'Protection des plantes',
  videoCatVegetableGrowing: 'Culture maraîchère',
  videoCatLivestock: 'Élevage',
  videoCatGreenhouse: 'Serres',
  videoCatHarvest: 'Récolte',
  videoDurationMinutes: 'min',
  videoLanguageArabic: 'en arabe',
  videoLanguageEnglish: 'en anglais',

  academyTitle: 'Académie AgriVibe',
  academySubtitle: 'Des thèmes agricoles liés à du contenu réel et à de vrais services.',
  academyOpenVideos: 'Tutoriels vidéo',
  academyOpenService: 'Ouvrir le service',
  academyPlanting: 'Plantation & semis',
  academyPlantingDesc: 'Choisir les cultures adaptées et la période de semis.',
  academySoil: 'Sol & fertilisation',
  academySoilDesc: 'Analyse du sol et recommandations de fertilisation.',
  academyIrrigation: 'Irrigation',
  academyIrrigationDesc: 'Techniques d’irrigation et économie d’eau.',
  academyFertilisation: 'Fertilisation organique',
  academyFertilisationDesc: 'Compostage et nutrition des plantes.',
  academyDiseases: 'Maladies des plantes',
  academyDiseasesDesc: 'Diagnostic par image et signes de maladie.',
  academyPest: 'Lutte antiparasitaire',
  academyPestDesc: 'Identifier les ravageurs à partir des symptômes.',
  academyPruning: 'Taille',
  academyPruningDesc: 'Taille des arbres et des cultures.',
  academyHarvest: 'Récolte',
  academyHarvestDesc: 'Techniques de récolte et post-récolte.',
  academyLivestock: 'Élevage',
  academyLivestockDesc: 'Soins des ovins et des bovins.',
  academyTechnology: 'Technologie agricole',
  academyTechnologyDesc: 'L’intelligence artificielle au service de l’agriculture.',

  seasonWinter: 'Hiver',
  seasonSpring: 'Printemps',
  seasonSummer: 'Été',
  seasonAutumn: 'Automne',
  seasonWinterTip: 'Taille principale des oliviers et arbres fruitiers, labour du sol et préparation à la saison des pluies.',
  seasonSpringTip: 'Fertilisation, lutte contre les ravageurs, plantation des cultures d’été et suivi de l’irrigation.',
  seasonSummerTip: 'Irrigation régulière, protection contre la chaleur et récolte précoce des cultures d’été.',
  seasonAutumnTip: 'Début de la campagne oléicole, préparation du sol et semis des cultures d’hiver.',

  profileSignInPrompt: 'Connectez-vous pour accéder à vos données',
  profileSignOutConfirm: 'Voulez-vous vous déconnecter ?',
  profileSignedInAs: 'Connecté en tant que',
  profileServerReachable: 'Connexion au serveur AgriVibe réussie.',
  profileCacheCleared: 'Données en cache effacées de cet appareil.',
  profileClearCache: 'Effacer le cache',
  profileSupabaseUnconfigured: 'Supabase non configuré (vérifiez les variables d’environnement).',

  farmAddField: 'Ajouter une parcelle',
  farmFieldName: 'Nom de la parcelle',
  farmFieldArea: 'Surface (ha)',
  farmEmpty: 'Aucune parcelle enregistrée',
  farmLoginToManage: 'Connectez-vous pour gérer vos parcelles',
  farmAddFarm: 'Enregistrer une exploitation',
  farmName: 'Nom de l’exploitation',
  farmRegion: 'Gouvernorat / région',
  farmSize: 'Surface totale (ha)',
  farmNoFarmYet: 'Aucune exploitation enregistrée sur votre compte',
  farmCreateHint: 'Commencez par enregistrer votre exploitation, puis ajoutez ses parcelles pour les suivre sur le terrain.',
  farmSaveFarm: 'Enregistrer l’exploitation',

  // Services catalogue
  svcBadgeSoil: 'Fertilisation scientifique',
  svcBadgeCrops: 'Rentabilité supérieure',
  svcBadgeDisease: 'Diagnostic par image',
  svcBadgePest: 'Lutte intégrée',
  svcBadgeIrrigation: 'Économie d’eau',
  svcBadgeWeather: 'Stations tunisiennes',
  svcBadgeFarms: 'Cartes des parcelles',
  svcBadgeLivestock: 'Ovins & bovins',
  svcBadgeCommunity: 'Communauté agricole',
  svcBadgeExpert: 'Ingénieurs & vétérinaires',
  svcBadgeMultiAgent: 'Agents spécialisés',
  svcBadgeNews: 'RSS réel',
  svcBadgeHistory: 'Historique daté',
  svcBadgeLearning: 'YouTube réel',
  recentAnalysesTitle: 'Historique des analyses',
  recentAnalysesDesc: 'Consultez tous les diagnostics de maladies et analyses de sol enregistrés, avec leurs recommandations et leur date.',
  servicesLaunch: 'Commencer',
  servicesNoMatch: 'Aucun service ne correspond à votre recherche. Essayez un autre mot ou une autre catégorie.',

  // Soil analysis screen
  soilFormHeading: 'Saisissez les résultats d’analyse de l’échantillon de sol (laissez vide si la valeur est indisponible)',
  soilPhLabel: 'Acidité du sol (pH)',
  soilPhHint: 'Optimal : 6,5 - 7,8',
  soilNitrogenLabel: 'Azote N (mg/kg)',
  soilPhosphorusLabel: 'Phosphore P (mg/kg)',
  soilPotassiumLabel: 'Potassium K (mg/kg)',
  soilOrganicMatterLabel: 'Matière organique (%)',
  soilMoistureLabel: 'Humidité du sol (%) — facultatif',
  soilAnalyzeButton: 'Analyser la fertilité du sol',
  soilFertilityScore: 'Évaluation de la fertilité',
  soilProblems: 'Problèmes détectés',
  soilMissingMeasurements: 'Mesures manquantes (analyse de laboratoire requise)',
  soilFindings: 'Lecture des indicateurs',
  soilRecommendations: 'Recommandations agronomiques',
  soilNeedOneMeasurement: 'Saisissez au moins une mesure issue de l’analyse de laboratoire. Les champs vides sont traités comme des mesures manquantes et ne sont jamais remplacés par une valeur inventée.',
  soilInvalidInput: 'Saisissez des nombres valides ou laissez les champs vides.',
  soilBlankNote: 'Les champs vides sont envoyés comme mesures manquantes ; aucune valeur par défaut n’est substituée.',

  // Weather screen
  weatherSubtitle: 'Données en direct des stations météo tunisiennes (Open-Meteo)',
  weatherLiveBadge: 'Données en direct',
  weatherHumidity: 'Humidité',
  weatherRainToday: 'Pluie du jour',
  weatherWindSpeed: 'Vitesse du vent',
  weatherForecast: 'Prévisions des prochains jours',
  weatherForecastEmpty: 'Aucune prévision journalière fournie par le service météo pour le moment.',
  weatherLoading: 'Récupération des dernières données météo…',
  weatherUseMyLocation: 'Utiliser ma position',
  weatherLocating: 'Localisation en cours…',
  weatherLocationDenied: 'Autorisation de localisation refusée. Choisissez un gouvernorat.',
  weatherLocationFailed: 'Localisation impossible. Choisissez un gouvernorat.',
  weatherMyLocationLabel: 'Ma position',

  // Crop recommendation screen
  cropEmptyResult: 'Le service de recommandation n’a renvoyé aucune culture correspondante.',
  cropSuitabilityShort: 'Adéquation',
  cropEstimatedProfit: 'Rendement estimé par hectare',
  cropWaterRequirement: 'Besoin en eau',
  cropHistorySummary: '{score} % d’adéquation • {count} cultures proposées',

  // Recent analyses screen
  recentAnalysesSubtitle: 'Consultez les diagnostics agricoles et plans de traitement enregistrés pour vos parcelles',
  recentAnalysesEmptyTitle: 'Aucun historique pour l’instant',
  recentAnalysesEmptyMsg: 'Les diagnostics et analyses que vous effectuez sur cet appareil apparaîtront ici.',
  recentAnalysesClear: 'Effacer l’historique',
  recentAnalysesClearConfirm: 'Toutes les analyses enregistrées sur cet appareil seront supprimées. Cette action est irréversible.',
  recentAnalysesViewImage: 'Voir l’image jointe',
  recentAnalysesTapHint: 'Touchez un élément pour voir les détails.',
  weatherOpenDetail: 'Touchez pour voir le détail de la météo.',
  articleOpenSource: 'Touchez pour ouvrir l’article dans le navigateur.',
  recentAnalysesRunAgain: 'Relancer l’analyse',

  // Secondary services (irrigation / pest / disabled services)
  svcUnavailableTitle: 'Pas encore disponible',
  expertDisabledNote: 'Le service de consultation existe côté serveur mais il est actuellement désactivé (503) car ses données ne sont pas persistées en base. Aucune donnée inventée ne sera affichée. En attendant, vous pouvez utiliser l’assistant agricole intelligent.',
  communityDisabledNote: 'Le forum communautaire existe côté serveur mais il est actuellement désactivé (503) car les publications sont stockées en mémoire et non persistées. Aucune donnée inventée ne sera affichée.',
  svcNotWiredNote: 'Ce service n’est relié à aucune API documentée du serveur.',
  irrigationUnavailableTitle: 'Service d’irrigation non configuré',
  pestUnavailableTitle: 'Service de ravageurs non configuré',
  pestSeparatorHint: 'Séparez les symptômes par une virgule. Le service compare les symptômes à une base de mots-clés et ne devine aucune identification.',
  pestCropOptional: 'Type de culture (facultatif)',
  pestCropPlaceholder: 'olive / tomato / wheat',
  pestMethodPrefix: 'Méthode d’identification',
  pestSymptomsUsed: 'Symptômes utilisés',
  pestNoConfidenceNote: 'Aucun niveau de confiance n’est affiché car l’outil de correspondance par mots-clés n’est pas calibré.',
  irrigationNoDetails: 'Aucun détail supplémentaire renvoyé par le service.',
  irrigationRecommendations: 'Recommandations',
  metricDailyRequirement: 'Besoin quotidien',
  metricWeeklyRequirement: 'Besoin hebdomadaire',
  metricEt0: 'Évapotranspiration de référence (ET₀)',
  metricCropCoefficient: 'Coefficient cultural (Kc)',
  metricWaterEfficiency: 'Efficacité d’utilisation de l’eau',
  irrigationRawUnknown: 'Le service a renvoyé une réponse sans champs connus. Les valeurs brutes ne sont pas affichées car elles ne sont pas interprétées.',
  irrigationWeatherSource: 'Température et humidité envoyées au service d’irrigation depuis la météo en direct (Open-Meteo) de votre gouvernorat.',

  // Crop / growth-stage labels
  stageVegetative: 'Croissance végétative',
  stageFlowering: 'Floraison',
  stageFruiting: 'Fructification',
  stageMaturity: 'Maturité',
  farmSaved: 'Exploitation enregistrée avec succès.',
  farmRequiredFields: 'Veuillez saisir le nom, la région et la surface.',
  farmInvalidArea: 'Saisissez une surface valide en hectares (un nombre supérieur à zéro).',
  farmError: 'L’opération a échoué.',
  farmFieldsSection: 'Parcelles de l’exploitation',
  farmCurrentCrop: 'Culture actuelle',
  farmSoilType: 'Type de sol',
  farmTotalArea: 'Surface exploitée totale',
  farmFieldCount: 'Nombre de parcelles',
  farmCropCount: 'Cultures enregistrées',
  farmSizeUnit: 'ha',

  livestockSummary: 'Synthèse du cheptel',
  livestockTotal: 'Total têtes',
  livestockHealthy: 'En bonne santé',
  livestockSick: 'À surveiller',
  livestockEmpty: 'Aucun animal enregistré.',
  livestockUnavailable: 'Table du cheptel non configurée sur le serveur',
  livestockUnavailableDesc: 'Les tables de cheptel ne sont pas configurées dans la base. Aucune donnée inventée n’est affichée.',
  livestockLoginRequired: 'Connectez-vous pour voir votre cheptel enregistré.',
  livestockEarTag: 'Boucle',
  livestockSpecies: 'Espèce',
  livestockValue: 'Valeur estimée',
  livestockAge: 'Âge',
  livestockWeight: 'Poids',
  livestockBreeding: 'Statut reproductif',
  livestockHealth: 'État sanitaire',

  close: 'Fermer',
  clearSearch: 'Effacer la recherche',
  save: 'Enregistrer',
  cancel: 'Annuler',
  seeAll: 'Voir tout',
  poweredBy: 'Source des données',
  dataProvenance: 'Source des données',

  // Profile screen
  profileUserFallback: 'Utilisateur AgriVibe',
  profileGuest: 'Invité',
  profileNotSignedIn: 'Non connecté',
  profileTestConnection: 'Tester la connexion au serveur',
  profileOfflineDesc: 'Les données météo, parcelles et diagnostics sont enregistrées localement pour être consultées au champ sans Internet.',

  // Marketplace screen
  marketNoPrices: 'Aucun prix enregistré pour l’instant dans la base de données de la plateforme.',
  marketNoMatch: 'Aucune culture ne correspond à votre recherche.',
  marketAboutTitle: 'À propos de ces prix',
  marketAboutBody: 'Ces valeurs sont enregistrées dans la base de données de la plateforme et représentent des prix observés. Aucune tendance (hausse/baisse) n’est affichée sauf si le serveur la fournit réellement. Vérifiez les marchés de gros locaux avant de vendre.',
  marketIntelTitle: 'Intelligence de marché',
  marketIntelNote: 'État réel des analyses de marché tel que déclaré par le serveur — aucune prévision inventée.',
  marketIntelForecast: 'Prévision des prix',
  marketIntelSupplyDemand: 'Offre et demande',
  marketIntelUnavailableHint: 'Indisponible tant qu’une source de marché vérifiée et horodatée et un modèle validé ne sont pas connectés. Vérifiez les marchés de gros locaux avant de décider.',

  // AI assistant screen
  assistantErrorReply: 'Désolé, une erreur s’est produite lors du traitement de la question. Vérifiez la connexion et réessayez.',
  assistantPreparing: 'Préparation de la réponse agricole…',

  // Units
  unitKg: 'kg',
  currencyTnd: 'DT',
  unitMm: 'mm',
  unitKmh: 'km/h',
  farmDefaultSoil: 'Argileux fertile',
  farmDefaultCrop: 'Olivier Chetoui',

  // API client messages (localised at render time)
  apiUnavailable: 'Service actuellement indisponible sur le serveur',
  apiTimeout: 'Délai de connexion au serveur dépassé',
  apiOffline: 'Impossible de joindre le serveur AgriVibe',
  weatherFetchFailed: 'Impossible de récupérer les données météo en direct',
  diseaseServiceUnconfigured: 'Service de diagnostic par image non configuré',
  diseaseAnalysisFailed: 'Échec de l’analyse de l’image',
  soilAnalysisFailed: 'Échec de l’analyse du sol',
  soilGradeUnknown: 'Non déterminé',
  soilGradeHigh: 'Élevée',
  soilGradeMedium: 'Moyenne',
  soilGradeLow: 'Faible',
  soilGradePoor: 'Très faible',
  soilGenericDisclaimer: 'Analyse fondée sur des règles agronomiques fixes (et non un modèle entraîné).',
  diseaseUnknownName: 'État de la plante',
  diseaseGenericDescription: 'Analyse d’une image de plante.',
  cropFetchFailed: 'Impossible de récupérer les recommandations de cultures',
  soilAdvisoryUnavailable: 'Le service d’avis n’est pas configuré ; le moteur expert a été utilisé à la place.',
  soilReportFetchFailed: 'Impossible de récupérer le rapport.',
  cropRequiresPersistedSoil: 'Une analyse de sol enregistrée est requise pour cette parcelle.',
  cultivationCreateFailed: 'Impossible d’enregistrer le projet.',
  cultivationLoadFailed: 'Impossible de charger les projets.',
  pestNeedSymptom: 'Veuillez décrire au moins un symptôme',
  pestServiceUnconfigured: 'Service de lutte contre les ravageurs non configuré',
  pestNoMatch: 'Aucun ravageur identifié',
  irrigationServiceUnconfigured: 'Service d’irrigation intelligent non configuré',
  irrigationComputeFailed: 'Impossible de calculer le calendrier d’irrigation',
  assistantNoAnswer: 'Impossible d’obtenir une réponse',
  fieldCreateFailed: 'Impossible de créer la parcelle',
  farmCreateFailed: 'Impossible de créer l’exploitation',
  notificationsUnavailable: 'Notifications indisponibles',
  notificationUpdateFailed: 'Impossible de mettre à jour la notification',
  apiLivestockUnavailable: 'Données d’élevage indisponibles',
  newsFetchFailed: 'Impossible de récupérer les actualités agricoles',
  newsSourceSeparator: ', ',
  authFullNamePlaceholder: 'Mohamed Ali',
  languageArabicLabel: 'العربية (Tunisie)',
  listSeparator: ', ',
  arabicOnlyNote: 'Remarque : les textes détaillés de ce résultat ne sont rédigés qu’en arabe par le moteur de règles du serveur.',
  agentsTraceTitle: 'Orchestration multi-agents',
  agentsTraceSubtitle: 'Comment le serveur a réparti votre question entre les agents spécialisés et fusionné leurs résultats.',
  agentsPlanTitle: 'Plan d’exécution',
  agentsRejectedPlan: 'Agents proposés par le modèle mais hors liste autorisée (ignorés) :',
  agentsPlannedByLlm: 'Plan choisi par le modèle de langage',
  agentsPlannedByKeywords: 'Plan choisi par mots-clés',
  agentsConcurrency: 'Concurrence',
  agentsDuration: 'Durée',
  agentsRunTitle: 'Résultats des agents',
  agentsStepFindings: 'Constats',
  agentsStepNote: 'Remarque',
  agentsStepAttempts: 'Tentatives',
  agentsStatusOk: 'OK',
  agentsStatusInsufficient: 'Données manquantes',
  agentsStatusUnavailable: 'Indisponible',
  agentsStatusBlocked: 'Bloqué',
  agentsStatusFailed: 'Échec',
  agentsSourceRuleBased: 'Règles déterministes',
  agentsSourceOpenMeteo: 'Météo réelle (Open-Meteo)',
  agentsSourceRecords: 'Enregistrements stockés',
  agentsSourceRss: 'Flux RSS réels',
  agentsSourceTrained: 'Modèle entraîné',
  agentsSourceLlm: 'Modèle de langage génératif',
  agentsSourceNone: 'Aucune source',
  agentsConfidenceHigh: 'Confiance élevée',
  agentsConfidenceMedium: 'Confiance moyenne',
  agentsConfidenceLow: 'Confiance faible',
  agentsConfidenceUnknown: 'Confiance indéterminée',
  agentsShowTrace: 'Afficher la trace d’orchestration',
  agentsHideTrace: 'Masquer la trace d’orchestration',
  agentsRegistryTitle: 'Registre des agents spécialisés',
  agentsRegistrySubtitle: 'La liste autorisée que l’orchestrateur exécute réellement sur le serveur.',
  agentsRegistryLoadFailed: 'Impossible de charger le registre des agents.',
  agentsSpecialistCount: 'Nombre d’agents',
  agentsDependsOn: 'Dépend de',
  agentsNoDependencies: 'Indépendant',
  agentsInAction: 'Les agents en action',
  agentsPreamble: 'Chaque réponse de l’assistant passe par un orchestrateur central qui choisit les agents spécialisés selon votre question, les exécute selon un plan borné, puis fusionne leurs résultats étiquetés par source.',

};

const en: ExtraTranslations = {
  authSignIn: 'Sign In',
  authSignUp: 'Sign Up',
  authReset: 'Reset Password',
  authEmail: 'Email address',
  authPassword: 'Password',
  authFullName: 'Full name',
  authPhone: 'Phone (optional)',
  authSignInBtn: 'Sign in',
  authSignUpBtn: 'Create account',
  authResetBtn: 'Send reset link',
  authNeedAccount: "Don't have an account?",
  authHaveAccount: 'Already have an account?',
  authForgot: 'Forgot password?',
  authConfirmEmail: 'Account created. Confirm your email, then sign in.',
  authWelcomeBack: 'Welcome back',
  authCreateAccount: 'Create an AgriVibe account',
  authSubtitle: 'Sign in to access your farm data and tools',
  authErrEmailRequired: 'Please enter your email address',
  authErrPasswordShort: 'Password must be at least 6 characters',
  authErrFullNameRequired: 'Please enter your full name',
  authErrSignInFailed: 'Could not sign in',
  authErrSignUpFailed: 'Could not create the account',
  authErrResetFailed: 'Could not send the reset link',
  authErrUnreachable: 'The account service is unreachable. Check your internet connection and try again.',
  authConfirmTitle: 'Confirm your email',
  authResetSentTitle: 'Password reset',
  authResetSentBody: 'A reset link has been sent to your email address.',
  authAccountType: 'Account type',
  roleFarmer: 'Farmer / Grower',
  roleGardener: 'Home growing & gardening',
  roleAgronomist: 'Agronomist / Expert',
  roleVeterinarian: 'Veterinarian',
  roleCompany: 'Company / Cooperative',
  roleTrader: 'Trader / Investor',
  roleInvestor: 'Investor / Institution',
  roleInspector: 'Inspector / Government',
  roleGovernment: 'Government administration',

  onboardingTitle: 'Choose your profile',
  onboardingSubtitle: 'We tailor the interface and services to your needs',
  onboardingContinue: 'Continue',
  onboardingSkip: 'Skip',
  personaGardenerTitle: 'Home growing & gardening',
  personaGardenerSub: 'Home garden plant care, quick leaf checks and simple watering schedules.',
  personaGardenerBadge: 'Beginner & family',
  personaFarmerTitle: 'Professional farmer',
  personaFarmerSub: 'Field management, soil fertilisation, live agri-weather and drip irrigation scheduling.',
  personaFarmerBadge: 'Default mode',
  personaAgronomistTitle: 'Agronomist & specialist',
  personaAgronomistSub: 'Precise soil analyses, treatment plans and farmer advisory.',
  personaAgronomistBadge: 'Advanced & expert',
  personaCompanyTitle: 'Agri-business & cooperatives',
  personaCompanySub: 'Large-scale production management, supply-chain tracking and quality control.',
  personaCompanyBadge: 'Management & planning',
  personaTraderTitle: 'Trader & agri-investor',
  personaTraderSub: 'Wholesale price indicators, demand and season forecasts, profitability studies.',
  personaTraderBadge: 'Trade & investment',
  personaInspectorTitle: 'Quality inspector & institutions',
  personaInspectorSub: 'Plant health reports, quality control and statistical data.',
  personaInspectorBadge: 'Control & compliance',
  personaVeterinarianTitle: 'Veterinarian',
  personaVeterinarianSub: 'Herd health monitoring, vaccination and livestock records.',
  personaVeterinarianBadge: 'Animal health',
  personaInvestorTitle: 'Investor & institutions',
  personaInvestorSub: 'Market indicators, feasibility studies and agricultural investment opportunities.',
  personaInvestorBadge: 'Finance & investment',
  personaGovernmentTitle: 'Government & research',
  personaGovernmentSub: 'Statistical data, agricultural news and policy monitoring.',
  personaGovernmentBadge: 'Public administration',

  loginRequired: 'Sign-in required',
  loginRequiredDesc: 'This service is tied to your account and farm data.',
  loginToContinue: 'Sign in to continue',

  stateLoading: 'Loading...',
  stateEmpty: 'Nothing to show yet',
  stateError: 'Failed to load data',
  stateOffline: 'No Internet connection',
  stateUnavailable: 'This service is currently unavailable',
  crashTitle: 'Something went wrong',
  crashMessage: 'This section could not be displayed. You can retry or keep using the rest of the app.',
  retry: 'Retry',
  cachedNotice: 'Showing last saved data (offline mode)',
  offlineBanner: 'You are offline — showing saved data',
  notice: 'Notice',
  successTitle: 'Success',

  notificationsTitle: 'Notifications',
  notificationsEmpty: 'No new notifications',
  markAllRead: 'Mark all as read',
  notificationUnread: 'Unread',

  scannerCapture: 'Take a photo',
  scannerReview: 'Review plant photo',
  scannerReviewSub: 'Make sure the leaf or spots are clearly visible',
  scannerConfirm: 'Confirm and analyze',
  scannerRetake: 'Retake',
  scannerPermissionTitle: 'Camera permission required',
  scannerPermissionDesc: 'The app needs the camera to scan plant leaves and detect diseases.',
  scannerGrant: 'Allow camera',
  scannerFromGallery: 'Choose from gallery',
  scannerGuidance: 'Frame the leaf at 15-20 cm',
  scannerAnalyzing: 'Analyzing image...',
  scannerUnavailableTitle: 'Image analysis not configured',
  scannerUnavailableDesc: 'No vision model is configured on the server. No result has been invented.',
  scannerSymptomsLabel: 'Additional symptoms (optional)',
  scannerSymptomsPlaceholder: 'e.g. yellow circular spots, drying edges...',
  scannerCaptureFailed: 'Could not capture the photo',
  scannerGalleryDenied: 'Please grant access to the photo gallery',
  scannerAnalysisFailed: 'Image analysis failed',
  scannerNoConfidenceLong: 'The model did not report a numeric confidence score for this case.',
  scannerSeverityLabel: 'Severity',
  scannerSeverityLow: 'Low',
  scannerSeverityMedium: 'Medium',
  scannerSeverityHigh: 'High',
  scannerSeverityCritical: 'Critical',
  scannerSeverityUnknown: 'Not specified',
  scannerSectionTreatment: 'Treatment',
  scannerSectionPrevention: 'Prevention',
  scannerScanAnother: 'Scan another photo',

  // AI capabilities
  aiCapTitle: 'AI capabilities',
  aiCapSubtitle: 'State of each service exactly as the server declares it (GET /api/ai/capabilities) — no invented results',
  aiSummaryTotal: 'Total capabilities',
  aiSummaryAvailable: 'Available',
  aiSummaryModelPowered: 'Model-powered',
  aiEngineLlm: 'Language model (LLM)',
  aiEngineVision: 'Vision model',
  aiEngineTrained: 'Trained-model service',
  aiEngineRuleBased: 'Deterministic rule engine',
  aiEngineUnavailable: 'Unavailable',
  aiAvailable: 'Available',
  aiNotConfigured: 'Not configured',
  aiEngineProvenanceTitle: 'Engine and data source',
  aiRequires: 'Requires',
  aiNote: 'The farming advisor relies on a server-side multi-agent orchestration (planning, bounded-concurrency execution and a diagnostic trace). This app creates no result itself; it shows what the server returns together with its source.',
  aiNoCapabilities: 'The server reports no AI capability as available yet. The app will not show any fictional capability.',
  aiProviderConfigured: 'Generative AI provider configured',
  aiProviderNone: 'No generative AI provider configured — rule engines are used',

  diseaseStepImage: '1. Photo of the affected plant or leaf',
  diseaseStepCrop: '2. Crop type',
  diseaseStepPart: '3. Affected part',
  diseaseAnalyzeButton: 'Analyse image',
  diseaseConfidenceLabel: 'Model confidence',
  diseaseNoConfidence: 'The model did not report a confidence score',
  diseaseSymptoms: 'Symptoms',
  diseaseTreatment: 'Immediate treatment plan',
  diseasePrevention: 'Prevention',
  diseaseLimitationsTitle: 'Limits of use',
  diseaseLimitationsText: 'The result is indicative, based on the uploaded image, and may differ from a laboratory diagnosis. Have it confirmed by an agronomist before any chemical treatment.',
  diseaseGalleryDenied: 'Please grant access to the photo gallery.',
  diseasePickFirst: 'Please capture or choose a photo first.',
  cropOlive: 'Olive tree',
  cropTomato: 'Tomato',
  cropWheat: 'Wheat and cereals',
  cropCitrus: 'Citrus',
  cropDates: 'Date palm',
  cropPotato: 'Potato',
  partLeaves: 'Leaves',
  partFruit: 'Fruit',
  partStem: 'Stem and branches',
  partRoot: 'Roots',

  pestSymptomInput: 'Describe symptoms',
  pestSymptomPlaceholder: 'e.g. curled leaves, holes, small insects...',
  pestIdentify: 'Identify pest',
  pestNoResult: 'No pest identified from the symptoms provided.',

  irrigationCrop: 'Crop',
  irrigationStage: 'Growth stage',
  irrigationCompute: 'Calculate water needs',
  irrigationUnavailable: 'The irrigation service is not configured on the server.',

  cropSoilPh: 'Soil pH',
  cropTemperature: 'Average temperature (°C)',
  cropRainfall: 'Annual rainfall (mm)',
  cropSalinity: 'Salinity (dS/m)',
  cropArea: 'Area (hectares)',
  cropCompute: 'Find suitable crops',
  cropInputsHint: 'Leave a field empty to use the general reference. An empty field means the engine ignores it.',
  cropInvalidInput: 'Enter valid numbers or leave the fields empty.',

  assistantUnavailable: 'Could not get a reply from the assistant.',
  assistantProvenanceLlm: 'Answer from a configured language model',
  assistantProvenanceRules: 'Answer from the local rule-based engine',

  homeNoAlerts: 'No urgent alerts today',
  homeAlertsUnavailable: 'Alerts unavailable: the notification store could not be reached.',
  metricHumidity: 'humidity',
  metricWind: 'km/h',
  priorityCritical: 'Critical',
  priorityHigh: 'High',
  priorityMedium: 'Medium',
  priorityLow: 'Low',
  heroBadgeAnalyze: 'Analysis',
  heroBadgeLivestock: 'Livestock',
  heroBadgeMarkets: 'Markets',
  heroBadgeManage: 'Manage',
  heroBadgeInspect: 'Inspect',
  heroBadgeIndicators: 'Indicators',
  heroBadgeNews: 'News',
  homeWeatherUnavailable: 'Weather unavailable',
  homeWeatherAdviceTitle: 'Today’s weather advice',
  homeGuest: 'Dear farmer',

  newsTitle: 'Tunisian agricultural news',
  newsSubtitle: 'Headlines from real publisher RSS feeds, with the publisher name and a link to the original article.',
  newsSearchPlaceholder: 'Search agricultural news...',
  newsAllCategories: 'All categories',
  newsEmpty: 'No matching news',
  newsEmptyDesc: 'No matching article was returned right now. Refresh the page or change your search.',
  newsReadMore: 'Read the original article',
  newsUnknownSource: 'Unknown source',
  newsSomeSourcesDown: 'Sources that did not respond in this update:',

  videoCatPruning: 'Pruning',
  videoCatIrrigation: 'Irrigation',
  videoCatSoilPrep: 'Soil preparation',
  videoCatComposting: 'Composting & fertilising',
  videoCatPlantProtection: 'Plant protection',
  videoCatVegetableGrowing: 'Vegetable growing',
  videoCatLivestock: 'Livestock',
  videoCatGreenhouse: 'Greenhouses',
  videoCatHarvest: 'Harvest',
  videoDurationMinutes: 'min',
  videoLanguageArabic: 'in Arabic',
  videoLanguageEnglish: 'in English',

  academyTitle: 'AgriVibe Academy',
  academySubtitle: 'Farming topics linked to real content and real services.',
  academyOpenVideos: 'Video tutorials',
  academyOpenService: 'Open service',
  academyPlanting: 'Planting & sowing',
  academyPlantingDesc: 'Choose the right crops and sowing window.',
  academySoil: 'Soil & fertilisation',
  academySoilDesc: 'Soil analysis and fertilisation guidance.',
  academyIrrigation: 'Irrigation',
  academyIrrigationDesc: 'Irrigation techniques and water saving.',
  academyFertilisation: 'Organic fertilisation',
  academyFertilisationDesc: 'Composting and plant nutrition.',
  academyDiseases: 'Plant diseases',
  academyDiseasesDesc: 'Image diagnosis and disease signs.',
  academyPest: 'Pest control',
  academyPestDesc: 'Identify pests from symptoms.',
  academyPruning: 'Pruning',
  academyPruningDesc: 'Pruning trees and crops.',
  academyHarvest: 'Harvest',
  academyHarvestDesc: 'Harvest and post-harvest techniques.',
  academyLivestock: 'Livestock',
  academyLivestockDesc: 'Sheep and cattle care.',
  academyTechnology: 'Agricultural technology',
  academyTechnologyDesc: 'Artificial intelligence in farming.',

  seasonWinter: 'Winter',
  seasonSpring: 'Spring',
  seasonSummer: 'Summer',
  seasonAutumn: 'Autumn',
  seasonWinterTip: 'Main pruning of olive and fruit trees, soil tillage and preparation for the rainy season.',
  seasonSpringTip: 'Fertilising, pest control, planting summer crops and irrigation follow-up.',
  seasonSummerTip: 'Regular irrigation, heat protection and early harvest of summer crops.',
  seasonAutumnTip: 'Start of the olive campaign, soil preparation and sowing of winter crops.',

  profileSignInPrompt: 'Sign in to access your data',
  profileSignOutConfirm: 'Do you want to sign out?',
  profileSignedInAs: 'Signed in as',
  profileServerReachable: 'Connected to the AgriVibe server successfully.',
  profileCacheCleared: 'Cached data cleared from this device.',
  profileClearCache: 'Clear cached data',
  profileSupabaseUnconfigured: 'Supabase is not configured (check the environment variables).',

  farmAddField: 'Add field',
  farmFieldName: 'Field name',
  farmFieldArea: 'Area (hectares)',
  farmEmpty: 'No fields recorded yet',
  farmLoginToManage: 'Sign in to manage your farms and fields',
  farmAddFarm: 'Register a farm',
  farmName: 'Farm name',
  farmRegion: 'Governorate / region',
  farmSize: 'Total area (hectares)',
  farmNoFarmYet: 'No farm registered on your account yet',
  farmCreateHint: 'Start by registering your farm, then add its fields to track them in the field.',
  farmSaveFarm: 'Save farm to database',

  // Services catalogue
  svcBadgeSoil: 'Scientific fertilisation',
  svcBadgeCrops: 'Higher profitability',
  svcBadgeDisease: 'Image diagnosis',
  svcBadgePest: 'Integrated control',
  svcBadgeIrrigation: 'Water savings',
  svcBadgeWeather: 'Tunisian stations',
  svcBadgeFarms: 'Field maps',
  svcBadgeLivestock: 'Sheep & cattle',
  svcBadgeCommunity: 'Farmer community',
  svcBadgeExpert: 'Agronomists & vets',
  svcBadgeMultiAgent: 'Specialist agents',
  svcBadgeNews: 'Real RSS',
  svcBadgeHistory: 'Dated history',
  svcBadgeLearning: 'Real YouTube',
  recentAnalysesTitle: 'Previous analyses',
  recentAnalysesDesc: 'Review all saved disease diagnoses and soil analyses, with their recommendations and dates.',
  servicesLaunch: 'Get started',
  servicesNoMatch: 'No service matches your search. Try another word or a different category.',

  // Soil analysis screen
  soilFormHeading: 'Enter the soil sample analysis results (leave a field empty if the value is unavailable)',
  soilPhLabel: 'Soil acidity (pH)',
  soilPhHint: 'Optimal: 6.5 - 7.8',
  soilNitrogenLabel: 'Nitrogen N (mg/kg)',
  soilPhosphorusLabel: 'Phosphorus P (mg/kg)',
  soilPotassiumLabel: 'Potassium K (mg/kg)',
  soilOrganicMatterLabel: 'Organic matter (%)',
  soilMoistureLabel: 'Soil moisture (%) — optional',
  soilAnalyzeButton: 'Analyse soil fertility',
  soilFertilityScore: 'Fertility rating',
  soilProblems: 'Detected problems',
  soilMissingMeasurements: 'Missing measurements (lab analysis required)',
  soilFindings: 'Indicator readings',
  soilRecommendations: 'Agronomic recommendations',
  soilNeedOneMeasurement: 'Enter at least one measurement from the lab analysis. Blank fields are treated as missing measurements and are never filled with an invented value.',
  soilInvalidInput: 'Enter valid numbers or leave the fields empty.',
  soilBlankNote: 'Blank fields are sent as missing measurements; no default value is substituted.',

  // Weather screen
  weatherSubtitle: 'Live data from Tunisian weather stations (Open-Meteo)',
  weatherLiveBadge: 'Live data',
  weatherHumidity: 'Humidity',
  weatherRainToday: 'Rain today',
  weatherWindSpeed: 'Wind speed',
  weatherForecast: 'Next-days forecast',
  weatherForecastEmpty: 'No daily forecast is provided by the weather service right now.',
  weatherLoading: 'Fetching the latest weather data…',
  weatherUseMyLocation: 'Use my location',
  weatherLocating: 'Locating you…',
  weatherLocationDenied: 'Location permission denied. Choose a governorate.',
  weatherLocationFailed: 'Could not determine your location. Choose a governorate.',
  weatherMyLocationLabel: 'My location',

  // Crop recommendation screen
  cropEmptyResult: 'The recommendation service returned no matching crop.',
  cropSuitabilityShort: 'Suitability',
  cropEstimatedProfit: 'Estimated profit per hectare',
  cropWaterRequirement: 'Water requirement',
  cropHistorySummary: '{score}% suitability • {count} suggested crops',

  // Recent analyses screen
  recentAnalysesSubtitle: 'Review the saved agricultural diagnoses and treatment plans for your fields',
  recentAnalysesEmptyTitle: 'No history yet',
  recentAnalysesEmptyMsg: 'Diagnoses and analyses you run on this device will appear here.',
  recentAnalysesClear: 'Clear history',
  recentAnalysesClearConfirm: 'All analyses saved on this device will be deleted. This cannot be undone.',
  recentAnalysesViewImage: 'View attached image',
  recentAnalysesTapHint: 'Tap an entry to view details.',
  weatherOpenDetail: 'Tap to view weather details.',
  articleOpenSource: 'Tap to open the article in the browser.',
  recentAnalysesRunAgain: 'Run analysis again',

  // Secondary services (irrigation / pest / disabled services)
  svcUnavailableTitle: 'Not available yet',
  expertDisabledNote: 'The consultation service exists on the server but is currently disabled (503) because its data is not persisted in the database. No fabricated data will be shown. Meanwhile you can use the smart farming advisor.',
  communityDisabledNote: 'The community forum exists on the server but is currently disabled (503) because posts are stored in memory and not persisted. No fabricated data will be shown.',
  svcNotWiredNote: 'This service is not connected to any documented server API.',
  irrigationUnavailableTitle: 'Irrigation service not configured',
  pestUnavailableTitle: 'Pest service not configured',
  pestSeparatorHint: 'Separate symptoms with a comma. The service matches symptoms against a keyword base and never guesses an identification.',
  pestCropOptional: 'Crop type (optional)',
  pestCropPlaceholder: 'olive / tomato / wheat',
  pestMethodPrefix: 'Identification method',
  pestSymptomsUsed: 'Symptoms used',
  pestNoConfidenceNote: 'No confidence score is shown because the keyword-matching tool is not calibrated.',
  irrigationNoDetails: 'No further detail returned by the service.',
  irrigationRecommendations: 'Recommendations',
  metricDailyRequirement: 'Daily requirement',
  metricWeeklyRequirement: 'Weekly requirement',
  metricEt0: 'Reference evapotranspiration (ET₀)',
  metricCropCoefficient: 'Crop coefficient (Kc)',
  metricWaterEfficiency: 'Water-use efficiency',
  irrigationRawUnknown: 'The service returned a response with no known fields. Raw values are not shown because they are not interpreted.',
  irrigationWeatherSource: 'Temperature and humidity sent to the irrigation service from the live weather (Open-Meteo) of your governorate.',

  // Crop / growth-stage labels
  stageVegetative: 'Vegetative growth',
  stageFlowering: 'Flowering',
  stageFruiting: 'Fruiting',
  stageMaturity: 'Maturity',
  farmSaved: 'Farm saved successfully.',
  farmRequiredFields: 'Please enter the farm name, region and area.',
  farmInvalidArea: 'Enter a valid area in hectares (a number greater than zero).',
  farmError: 'The operation failed.',
  farmFieldsSection: 'Farm fields',
  farmCurrentCrop: 'Current crop',
  farmSoilType: 'Soil type',
  farmTotalArea: 'Total cultivated area',
  farmFieldCount: 'Fields',
  farmCropCount: 'Crops recorded',
  farmSizeUnit: 'ha',

  livestockSummary: 'Livestock summary',
  livestockTotal: 'Total head',
  livestockHealthy: 'In good health',
  livestockSick: 'Needs attention',
  livestockEmpty: 'No animals recorded yet.',
  livestockUnavailable: 'Livestock table not configured on the server',
  livestockUnavailableDesc: 'The livestock tables are not configured in the database. No invented data is shown.',
  livestockLoginRequired: 'Sign in to view your recorded animals.',
  livestockEarTag: 'Ear tag',
  livestockSpecies: 'Species',
  livestockValue: 'Estimated value',
  livestockAge: 'Age',
  livestockWeight: 'Weight',
  livestockBreeding: 'Breeding status',
  livestockHealth: 'Health status',

  close: 'Close',
  clearSearch: 'Clear search',
  save: 'Save',
  cancel: 'Cancel',
  seeAll: 'See all',
  poweredBy: 'Data source',
  dataProvenance: 'Data source',

  // Profile screen
  profileUserFallback: 'AgriVibe user',
  profileGuest: 'Guest',
  profileNotSignedIn: 'Not signed in',
  profileTestConnection: 'Test server connection now',
  profileOfflineDesc: 'Weather, field and diagnosis data are stored locally so you can browse them in the field without internet.',

  // Marketplace screen
  marketNoPrices: 'No prices recorded in the platform database yet.',
  marketNoMatch: 'No crop matches your search.',
  marketAboutTitle: 'About these prices',
  marketAboutBody: 'These values are recorded in the platform database and represent observed prices. No trend (up/down) is shown unless the server actually provides one. Check local wholesale markets before selling.',
  marketIntelTitle: 'Market intelligence',
  marketIntelNote: 'The real state of market analysis services as declared by the server — no forecast is invented.',
  marketIntelForecast: 'Price forecast',
  marketIntelSupplyDemand: 'Supply & demand',
  marketIntelUnavailableHint: 'Unavailable until a verified, timestamped market source and a validated model are connected. Check local wholesale markets before deciding.',

  // AI assistant screen
  assistantErrorReply: 'Sorry, an error occurred while processing the question. Please check your connection and try again.',
  assistantPreparing: 'Preparing the agricultural answer…',

  // Units
  unitKg: 'kg',
  currencyTnd: 'TND',
  unitMm: 'mm',
  unitKmh: 'km/h',
  farmDefaultSoil: 'Fertile clay',
  farmDefaultCrop: 'Chetoui olive',

  // API client messages (localised at render time)
  apiUnavailable: 'Service currently unavailable on the server',
  apiTimeout: 'Server connection timed out',
  apiOffline: 'Could not reach the AgriVibe server',
  weatherFetchFailed: 'Could not fetch live weather data',
  diseaseServiceUnconfigured: 'Image diagnosis service not configured',
  diseaseAnalysisFailed: 'Image analysis failed',
  soilAnalysisFailed: 'Soil analysis failed',
  soilGradeUnknown: 'Not determined',
  soilGradeHigh: 'High',
  soilGradeMedium: 'Medium',
  soilGradeLow: 'Low',
  soilGradePoor: 'Poor',
  soilGenericDisclaimer: 'Analysis based on fixed agronomic rules (not a trained model).',
  diseaseUnknownName: 'Plant condition',
  diseaseGenericDescription: 'Plant image analysis.',
  cropFetchFailed: 'Could not fetch crop recommendations',
  soilAdvisoryUnavailable: 'The advisory service is not configured; the expert rule engine was used instead.',
  soilReportFetchFailed: 'Could not retrieve the report.',
  cropRequiresPersistedSoil: 'A saved soil analysis is required for this plot.',
  cultivationCreateFailed: 'Could not save the cultivation project.',
  cultivationLoadFailed: 'Could not load cultivation projects.',
  pestNeedSymptom: 'Please describe at least one symptom',
  pestServiceUnconfigured: 'Pest control service not configured',
  pestNoMatch: 'No pest was identified',
  irrigationServiceUnconfigured: 'Smart irrigation service not configured',
  irrigationComputeFailed: 'Could not compute the irrigation schedule',
  assistantNoAnswer: 'Could not get an answer',
  fieldCreateFailed: 'Could not create the field',
  farmCreateFailed: 'Could not create the farm',
  notificationsUnavailable: 'Notifications unavailable',
  notificationUpdateFailed: 'Could not update the notification',
  apiLivestockUnavailable: 'Livestock data unavailable',
  newsFetchFailed: 'Could not fetch agricultural news',
  newsSourceSeparator: ', ',
  authFullNamePlaceholder: 'Mohamed Ali',
  languageArabicLabel: 'Arabic (Tunisia)',
  listSeparator: ', ',
  arabicOnlyNote: 'Note: the detailed text of this result is authored in Arabic only by the server’s rule engine.',
  agentsTraceTitle: 'Multi-agent orchestration',
  agentsTraceSubtitle: 'How the server split your question across specialised agents and merged their results.',
  agentsPlanTitle: 'Execution plan',
  agentsRejectedPlan: 'Agents the model proposed but that are not allow-listed (dropped):',
  agentsPlannedByLlm: 'Plan chosen by the language model',
  agentsPlannedByKeywords: 'Plan chosen by keywords',
  agentsConcurrency: 'Concurrency',
  agentsDuration: 'Duration',
  agentsRunTitle: 'Agent results',
  agentsStepFindings: 'Findings',
  agentsStepNote: 'Note',
  agentsStepAttempts: 'Attempts',
  agentsStatusOk: 'OK',
  agentsStatusInsufficient: 'Insufficient input',
  agentsStatusUnavailable: 'Unavailable',
  agentsStatusBlocked: 'Blocked',
  agentsStatusFailed: 'Failed',
  agentsSourceRuleBased: 'Deterministic rules',
  agentsSourceOpenMeteo: 'Live weather (Open-Meteo)',
  agentsSourceRecords: 'Stored records',
  agentsSourceRss: 'Live RSS feeds',
  agentsSourceTrained: 'Trained model',
  agentsSourceLlm: 'Generative language model',
  agentsSourceNone: 'No source',
  agentsConfidenceHigh: 'High confidence',
  agentsConfidenceMedium: 'Medium confidence',
  agentsConfidenceLow: 'Low confidence',
  agentsConfidenceUnknown: 'Unknown confidence',
  agentsShowTrace: 'Show orchestration trace',
  agentsHideTrace: 'Hide orchestration trace',
  agentsRegistryTitle: 'Specialist agent registry',
  agentsRegistrySubtitle: 'The allow-listed set the orchestrator actually runs on the server.',
  agentsRegistryLoadFailed: 'Could not load the agent registry.',
  agentsSpecialistCount: 'Agent count',
  agentsDependsOn: 'Depends on',
  agentsNoDependencies: 'Independent',
  agentsInAction: 'Agents in action',
  agentsPreamble: 'Every assistant answer passes through a central orchestrator that selects specialised agents from your question, runs them under a bounded plan, then merges their source-labelled findings.',

};

export const extraTranslations: Record<Language, ExtraTranslations> = { ar, fr, en };

export function getExtra(lang: Language): ExtraTranslations {
  return extraTranslations[lang] || extraTranslations.ar;
}
