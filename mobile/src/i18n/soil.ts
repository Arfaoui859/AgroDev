import { Language } from './index';

/**
 * Strings for the Soil Analysis → Crop Recommendation → Cultivation Project
 * workflow. Kept in a dedicated table so the (already large) extra.ts stays
 * readable. Every locale is authored, not machine-translated at runtime.
 */
export interface SoilTranslations {
  // Stepper
  step1Title: string;
  step2Title: string;
  step3Title: string;
  step1Short: string;
  step2Short: string;
  step3Short: string;
  next: string;
  previous: string;

  // Plot selection
  plotHeading: string;
  plotSubtitle: string;
  chooseFarm: string;
  chooseFarmHint: string;
  noFarmsYet: string;
  createFirstFarm: string;
  choosePlot: string;
  choosePlotHint: string;
  noPlotsYet: string;
  createPlot: string;
  plotName: string;
  plotNamePlaceholder: string;
  plotAreaHa: string;
  plotSoilType: string;
  currentCropLabel: string;
  currentCropPlaceholder: string;
  optionalFieldNote: string;
  farmName: string;
  farmRegion: string;
  farmAreaHa: string;
  selectGovernorate: string;
  creatingFarm: string;
  creatingPlot: string;
  plotRequired: string;
  plotSoilTypeRequired: string;
  farmRequired: string;
  createFarmFailed: string;

  // Measurements
  measurementsHeading: string;
  measurementsSubtitle: string;
  groupCore: string;
  groupNutrients: string;
  groupTexture: string;
  groupAdvanced: string;
  groupWater: string;
  groupContext: string;
  showAdvanced: string;
  hideAdvanced: string;
  unitLabel: string;
  unitMethodLabel: string;
  ecUnitLabel: string;
  sampleDepthLabel: string;
  samplingDateLabel: string;
  irrigationMethodLabel: string;
  waterEcLabel: string;
  waterEcUnitLabel: string;
  waterPhLabel: string;
  targetCropLabel: string;
  targetCropHint: string;
  nutrientUnitHint: string;
  textureHint: string;
  optionalSuffix: string;

  // Measurement help (why it matters)
  helpPh: string;
  helpEc: string;
  helpN: string;
  helpP: string;
  helpK: string;
  helpOm: string;
  helpMoisture: string;
  helpTexture: string;
  helpCec: string;
  helpCaMgS: string;
  helpMicro: string;
  helpCaco3: string;
  helpSar: string;
  helpWater: string;

  // Measurement names (short labels)
  mPh: string;
  mEc: string;
  mN: string;
  mP: string;
  mK: string;
  mOm: string;
  mMoisture: string;
  mSand: string;
  mSilt: string;
  mClay: string;
  mCa: string;
  mMg: string;
  mS: string;
  mFe: string;
  mZn: string;
  mMn: string;
  mCu: string;
  mB: string;
  mCec: string;
  mCaco3Total: string;
  mCaco3Active: string;
  mNa: string;
  mSar: string;
  mEsp: string;

  // Report chrome
  reportTitle: string;
  reportExecutive: string;
  reportConfidence: string;
  reportDataQuality: string;
  reportProvided: string;
  reportMissing: string;
  reportLimitations: string;
  reportConsistency: string;
  reportIndicators: string;
  reportTexture: string;
  reportChemical: string;
  reportPhysical: string;
  reportFindings: string;
  reportConstraints: string;
  reportStrengths: string;
  reportCropSuitability: string;
  reportCropAvoid: string;
  reportTargetPlan: string;
  reportGaps: string;
  reportActions: string;
  reportFertilization: string;
  reportFertStages: string;
  reportOrganicOptions: string;
  reportWater: string;
  reportCalendar: string;
  reportRisks: string;
  reportRecommendations: string;
  reportFollowUp: string;
  reportExtraInfo: string;
  reportReview: string;
  reportDisclaimers: string;
  reportFirstAction: string;
  reportRetestWhen: string;
  reportNoSection: string;

  confidenceLow: string;
  confidenceModerate: string;
  confidenceHigh: string;
  confidenceNotAssessed: string;

  feasibilityFeasible: string;
  feasibilityCorrection: string;
  feasibilityNotRecommended: string;
  feasibilityNotAssessed: string;

  priorityNow: string;
  priorityBeforePlanting: string;
  priorityDuringSeason: string;
  priorityFollowUp: string;

  severityInformational: string;
  severityLow: string;
  severityModerate: string;
  severityHigh: string;
  severityNotAssessed: string;

  fertStageBasal: string;
  fertStageEstablishment: string;
  fertStageVegetative: string;
  fertStageFlowering: string;

  reportLanguageNote: string;
  reportPersistedNote: string;
  reportNotPersistedNote: string;
  reportReportOf: string;

  // Marketplace
  marketMatchTitle: string;
  marketMatchSubtitle: string;
  marketMatchSearch: string;
  marketMatchEmpty: string;
  marketMatchUnavailable: string;
  marketMatchOpen: string;
  marketPriceLabel: string;
  marketSellerLabel: string;
  marketLocationLabel: string;

  // Soil → crop handoff
  findCropsCta: string;
  findCropsCtaSub: string;
  reuseDataNote: string;
  reusingSoilData: string;
  cropFromPlotTitle: string;
  cropRequiresSoil: string;
  cropCompareHint: string;
  cropSelectCta: string;
  cropEvaluateOwn: string;
  cropEvaluateOwnPlaceholder: string;
  cropEvaluateOwnCta: string;
  cropOwnResultTitle: string;
  cropSuitability: string;
  cropReasons: string;
  cropWater: string;
  cropSeason: string;
  cropDaysToMaturity: string;
  cropDaysUnit: string;
  cropSelectThis: string;

  // Cultivation project
  projectConfirmTitle: string;
  projectConfirmSubtitle: string;
  projectCrop: string;
  projectFarm: string;
  projectPlot: string;
  projectArea: string;
  projectPlantingDate: string;
  projectExpectedHarvest: string;
  projectPlantingDatePlaceholder: string;
  projectCreate: string;
  projectCreating: string;
  projectCreateFailed: string;
  projectCreatedTitle: string;
  projectCreatedSubtitle: string;
  projectOpen: string;
  projectMyProjects: string;
  projectNone: string;
  projectNoneHint: string;
  projectTasksTitle: string;
  projectTasksSubtitle: string;
  projectTaskDone: string;
  projectTaskUndone: string;
  projectHarvest: string;
  projectStagePlanned: string;
  projectCycleNote: string;

  // Actionable tasks (derived from the report, not invented)
  taskDoMeasurement: string;
  taskPrepareSoil: string;
  taskAmend: string;
  taskIrrigation: string;
  taskPlant: string;
  taskMonitor: string;
  taskRetest: string;

  // Errors
  soilAdvisoryUnavailable: string;
  soilReportFetchFailed: string;
  cropRequiresPersistedSoil: string;
  cultivationCreateFailed: string;
  cultivationLoadFailed: string;
  needPhMoisture: string;
  invalidNumbers: string;
  ecUnitRequired: string;
  textureTogether: string;
  stepOf: string;
}

const ar: SoilTranslations = {
  step1Title: 'اختر الأرض',
  step2Title: 'أدخل القياسات',
  step3Title: 'التقرير والتوصيات',
  step1Short: 'الأرض',
  step2Short: 'القياسات',
  step3Short: 'التقرير',
  next: 'التالي',
  previous: 'السابق',

  plotHeading: 'حدّد المزرعة والقطعة',
  plotSubtitle: 'اختر مزرعة وقطعة موجودتين، أو أنشئ قطعة جديدة لتسجيل قياساتها.',
  chooseFarm: 'المزرعة',
  chooseFarmHint: 'اختر المزرعة التي تنتمي إليها هذه القطعة.',
  noFarmsYet: 'لا توجد مزرعة مسجّلة بعد.',
  createFirstFarm: 'أنشئ مزرعتك الأولى',
  choosePlot: 'القطعة',
  choosePlotHint: 'اختر القطعة التي أخذت منها عينة التربة.',
  noPlotsYet: 'لا توجد قطعة مسجّلة في هذه المزرعة بعد.',
  createPlot: 'إنشاء قطعة جديدة',
  plotName: 'اسم القطعة',
  plotNamePlaceholder: 'مثال: القطعة الشمالية',
  plotAreaHa: 'المساحة (هكتار)',
  plotSoilType: 'نوع التربة',
  currentCropLabel: 'المحصول الحالي (اختياري)',
  currentCropPlaceholder: 'مثال: زيتون، قمح…',
  optionalFieldNote: 'الحقول الاختيارية يمكن تركها فارغة دون توقف التحليل.',
  farmName: 'اسم المزرعة',
  farmRegion: 'الولاية',
  farmAreaHa: 'مساحة المزرعة (هكتار)',
  selectGovernorate: 'اختر الولاية',
  creatingFarm: 'جارٍ إنشاء المزرعة…',
  creatingPlot: 'جارٍ إنشاء القطعة…',
  plotRequired: 'اختر قطعة أو أنشئ واحدة للمتابعة.',
  plotSoilTypeRequired: 'حدّد نوع تربة القطعة عند إنشائها.',
  farmRequired: 'اختر مزرعة أو أنشئ واحدة للمتابعة.',
  createFarmFailed: 'تعذّر إنشاء المزرعة.',

  measurementsHeading: 'قياسات التربة',
  measurementsSubtitle: 'أدخل القيم المتوفرة من التحليل المخبري أو الميداني. اترك ما لا تتوفر عليه فارغاً.',
  groupCore: 'الأساسيات',
  groupNutrients: 'العناصر الكبرى (NPK)',
  groupTexture: 'التركيبة (الرمل/الغرين/الطين)',
  groupAdvanced: 'قياسات متقدمة (اختياري)',
  groupWater: 'ماء الري (اختياري)',
  groupContext: 'سياق الحقل (اختياري)',
  showAdvanced: 'إظهار القياسات المتقدمة',
  hideAdvanced: 'إخفاء القياسات المتقدمة',
  unitLabel: 'الوحدة',
  unitMethodLabel: 'وحدة/طريقة التحليل',
  ecUnitLabel: 'وحدة التوصيل الكهربائي',
  sampleDepthLabel: 'عمق العينة (سم)',
  samplingDateLabel: 'تاريخ أخذ العينة',
  irrigationMethodLabel: 'طريقة الري',
  waterEcLabel: 'توصيل ماء الري (EC)',
  waterEcUnitLabel: 'وحدة توصيل ماء الري',
  waterPhLabel: 'pH ماء الري',
  targetCropLabel: 'المحصول المستهدف (اختياري)',
  targetCropHint: 'اذكره لتحصل على خطة تصحيح مخصّصة له.',
  nutrientUnitHint: 'مثال: mg/kg، ppm، meq/100g — اذكره مع طريقة التحليل إن توفّرت.',
  textureHint: 'يجب إدخال الرمل والغرين والطين معاً وأن يكون مجموعها ≈ 100%.',
  optionalSuffix: 'اختياري',

  helpPh: 'الحموضة/القلوية تحدّد توفّر العناصر. معظم المحاصيل تفضّل 6–7.5.',
  helpEc: 'التوصيل الكهربائي مؤشر الملوحة. يجب ذكر الوحدة وطريقة الاستخلاص.',
  helpN: 'الآزوت يغذّي النمو الخضري؛ نقصه يصفّر الأوراق.',
  helpP: 'الفوسفور مهم للجذور والإزهار؛ نقصه يبطئ النمو.',
  helpK: 'البوتاسيوم يقوّي المقاومة وجودة الثمر.',
  helpOm: 'المادة العضوية تحسّن البنية والاحتفاظ بالماء والغذاء.',
  helpMoisture: 'رطوبة التربة توجّه جدولة الري.',
  helpTexture: 'التركيبة تحدد الاحتفاظ بالماء والصرف وسلوك التربة.',
  helpCec: 'السعة التبادلية تعبّر عن قدرة التربة على الاحتفاظ بالعناصر.',
  helpCaMgS: 'الكالسيوم والمغنيسيوم والكبريت عناصر ثانوية مهمة.',
  helpMicro: 'العناصر الصغرى تُدخل بوحدات وطرق محدّدة؛ اذكرها لتفادي تفسير خاطئ.',
  helpCaco3: 'كربونات الكالسيوم تفسّر القلوية وارتفاع pH.',
  helpSar: 'SAR/ESP يقيسان خطر الصودية؛ يحتاجان Na وCa وMg.',
  helpWater: 'جودة ماء الري تؤثر على الملوحة والترسّبات.',

  mPh: 'درجة الحموضة (pH)',
  mEc: 'التوصيل الكهربائي (EC)',
  mN: 'الآزوت (N)',
  mP: 'الفوسفور (P)',
  mK: 'البوتاسيوم (K)',
  mOm: 'المادة العضوية (%)',
  mMoisture: 'الرطوبة (%)',
  mSand: 'الرمل (%)',
  mSilt: 'الغرين (%)',
  mClay: 'الطين (%)',
  mCa: 'الكالسيوم (Ca)',
  mMg: 'المغنيسيوم (Mg)',
  mS: 'الكبريت (S)',
  mFe: 'الحديد (Fe)',
  mZn: 'الزنك (Zn)',
  mMn: 'المنغنيز (Mn)',
  mCu: 'النحاس (Cu)',
  mB: 'البورون (B)',
  mCec: 'السعة التبادلية (CEC)',
  mCaco3Total: 'كربونات الكالسيوم الكلية (%)',
  mCaco3Active: 'كربونات الكالسيوم النشطة (%)',
  mNa: 'الصوديوم (Na)',
  mSar: 'SAR',
  mEsp: 'ESP (%)',

  reportTitle: 'تقرير تحليل التربة',
  reportExecutive: 'الخلاصة التنفيذية',
  reportConfidence: 'درجة الثقة',
  reportDataQuality: 'جودة البيانات',
  reportProvided: 'القياسات المقدَّمة',
  reportMissing: 'قياسات ناقصة',
  reportLimitations: 'محدوديات',
  reportConsistency: 'فحوصات الاتساق',
  reportIndicators: 'جدول المؤشرات',
  reportTexture: 'التركيبة',
  reportChemical: 'الخصائص الكيميائية',
  reportPhysical: 'الخصائص الفيزيائية',
  reportFindings: 'النتائج التفصيلية',
  reportConstraints: 'العوائق المرتّبة',
  reportStrengths: 'نقاط القوة',
  reportCropSuitability: 'ملاءمة المحاصيل',
  reportCropAvoid: 'محاصيل يُفضّل تجنّبها',
  reportTargetPlan: 'خطة المحصول المستهدف',
  reportGaps: 'الفجوات الحالية/المطلوبة',
  reportActions: 'الإجراءات',
  reportFertilization: 'خطة التسميد',
  reportFertStages: 'مراحل التسميد',
  reportOrganicOptions: 'بدائل عضوية',
  reportWater: 'الماء والري',
  reportCalendar: 'التقويم (12 أسبوعاً)',
  reportRisks: 'المخاطر والتنبيهات',
  reportRecommendations: 'التوصيات',
  reportFollowUp: 'خطة المتابعة',
  reportExtraInfo: 'معلومات إضافية مطلوبة',
  reportReview: 'المراجعة المهنية',
  reportDisclaimers: 'إخلاء المسؤولية',
  reportFirstAction: 'أول إجراء',
  reportRetestWhen: 'موعد إعادة التحليل',
  reportNoSection: 'لا تتوفر عناصر في هذا القسم بسبب نقص البيانات.',

  confidenceLow: 'منخفضة',
  confidenceModerate: 'متوسطة',
  confidenceHigh: 'عالية',
  confidenceNotAssessed: 'غير مُقيَّمة',

  feasibilityFeasible: 'ممكنة',
  feasibilityCorrection: 'ممكنة بعد التصحيح',
  feasibilityNotRecommended: 'غير موصى بها',
  feasibilityNotAssessed: 'غير مُقيَّمة',

  priorityNow: 'الآن',
  priorityBeforePlanting: 'قبل الزراعة',
  priorityDuringSeason: 'خلال الموسم',
  priorityFollowUp: 'متابعة',

  severityInformational: 'معلوماتي',
  severityLow: 'منخفض',
  severityModerate: 'متوسط',
  severityHigh: 'عالٍ',
  severityNotAssessed: 'غير مُقيَّم',

  fertStageBasal: 'التسميد الأساسي',
  fertStageEstablishment: 'التأسيس',
  fertStageVegetative: 'النمو الخضري',
  fertStageFlowering: 'الإزهار/الإثمار',

  reportLanguageNote: 'التقرير مُولَّد بالذكاء التوليدي (LLM) بالعربية. القياسات مدخلة من المستخدم وغير موثّقة مخبرياً، والجرعات التسميدية محجوبة لغياب بيانات موثوقة.',
  reportPersistedNote: 'تم حفظ هذا التقرير في حسابك ويمكنك الرجوع إليه بعد تسجيل الدخول.',
  reportNotPersistedNote: 'لم يُحفظ التقرير لعدم ربطه بقطعة أرض.',
  reportReportOf: 'تقرير القطعة',

  marketMatchTitle: 'منتجات مطابقة في السوق',
  marketMatchSubtitle: 'منتجات وعروض بائعين مسجّلين في منصة AgroGrowth، عند توفّرها.',
  marketMatchSearch: 'ابحث عن منتج أو سماد…',
  marketMatchEmpty: 'لا يوجد منتج مطابق مسجّل حالياً. لم نخترع أي منتج أو سعر.',
  marketMatchUnavailable: 'سوق المنتجات الزراعية غير متاح حتى ربط عروض بائعين ومخزون محفوظ في قاعدة البيانات.',
  marketMatchOpen: 'فتح المنتج',
  marketPriceLabel: 'السعر',
  marketSellerLabel: 'البائع',
  marketLocationLabel: 'الموقع',

  findCropsCta: 'ابحث عن أفضل المحاصيل لهذه القطعة',
  findCropsCtaSub: 'يعيد استخدام قياسات هذه القطعة المحفوظة دون إعادة إدخالها.',
  reuseDataNote: 'سنعيد استخدام بيانات القطعة وتحليل التربة تلقائياً.',
  reusingSoilData: 'جارٍ استخدام بيانات التربة المحفوظة للقطعة…',
  cropFromPlotTitle: 'محاصيل مقترحة لهذه القطعة',
  cropRequiresSoil: 'لا يوجد تحليل تربة محفوظ لهذه القطعة بعد. أنجز تحليل التربة أولاً لتظهر التوصيات المرتبطة بالقطعة.',
  cropCompareHint: 'اضغط على محصول لعرض تفاصيله واختياره.',
  cropSelectCta: 'اختر هذا المحصول',
  cropEvaluateOwn: 'قيّم محصولاً تريد زراعته',
  cropEvaluateOwnPlaceholder: 'اكتب اسم المحصول…',
  cropEvaluateOwnCta: 'قيّم الملاءمة',
  cropOwnResultTitle: 'ملاءمة المحصول المطلوب',
  cropSuitability: 'الملاءمة',
  cropReasons: 'الأسباب',
  cropWater: 'الاحتياج المائي',
  cropSeason: 'الموسم',
  cropDaysToMaturity: 'مدة النمو',
  cropDaysUnit: 'يوم',
  cropSelectThis: 'اختيار',

  projectConfirmTitle: 'أنشئ مشروع زراعتي',
  projectConfirmSubtitle: 'سيُحفظ المشروع مع القطعة وتحليل التربة والمحصول المختار لمتابعته حتى الحصاد.',
  projectCrop: 'المحصول',
  projectFarm: 'المزرعة',
  projectPlot: 'القطعة',
  projectArea: 'المساحة (هكتار)',
  projectPlantingDate: 'تاريخ الزراعة',
  projectExpectedHarvest: 'تاريخ الحصاد المتوقع',
  projectPlantingDatePlaceholder: 'YYYY-MM-DD',
  projectCreate: 'إنشاء المشروع',
  projectCreating: 'جارٍ إنشاء المشروع…',
  projectCreateFailed: 'تعذّر إنشاء المشروع. تحقّق من البيانات وحاول مجدداً.',
  projectCreatedTitle: 'تم إنشاء مشروعك الزراعي',
  projectCreatedSubtitle: 'يمكنك الآن متابعة دورة المحصول خطوة بخطوة.',
  projectOpen: 'فتح المشروع',
  projectMyProjects: 'مشاريعي الزراعية',
  projectNone: 'لا توجد مشاريع زراعية بعد.',
  projectNoneHint: 'ابدأ من تحليل تربة ثم اختر محصولاً لإنشاء مشروعك.',
  projectTasksTitle: 'ما يجب فعله الآن',
  projectTasksSubtitle: 'مهام مبنية على تقرير التربة والمحصول المختار. أنجزها بالترتيب.',
  projectTaskDone: 'تم',
  projectTaskUndone: 'تحديد كمنجز',
  projectHarvest: 'الحصاد',
  projectStagePlanned: 'مخطّط',
  projectCycleNote: 'تُحفظ حالة المهام على هذا الجهاز؛ بيانات المشروع نفسه محفوظة في حسابك.',

  taskDoMeasurement: 'أكمل قياس التربة الناقص',
  taskPrepareSoil: 'جهّز التربة قبل الزراعة',
  taskAmend: 'أضف المُحسّن الموصى به',
  taskIrrigation: 'جهّز الري',
  taskPlant: 'ابدأ الزراعة',
  taskMonitor: 'راقب نمو المحصول',
  taskRetest: 'جدول إعادة تحليل التربة',

  soilAdvisoryUnavailable: 'خدمة الاستشارة الذكية غير مهيأة؛ تم استخدام المحرك الإرشادي بدلاً منها.',
  soilReportFetchFailed: 'تعذّر استرجاع التقرير.',
  cropRequiresPersistedSoil: 'يلزم تحليل تربة محفوظ لهذه القطعة قبل التوصيات.',
  cultivationCreateFailed: 'تعذّر حفظ المشروع الزراعي.',
  cultivationLoadFailed: 'تعذّر تحميل المشاريع الزراعية.',
  needPhMoisture: 'أدخل على الأقل درجة الحموضة (pH) والرطوبة لإنشاء تقرير مفيد. اترك ما لا تتوفر عليه فارغاً.',
  invalidNumbers: 'تحقّق من الأرقام المدخلة؛ بعض الحقول تحتوي قيماً غير صالحة.',
  ecUnitRequired: 'حدّد وحدة التوصيل الكهربائي (EC) عند إدخال قيمته.',
  textureTogether: 'أدخل الرمل والغرين والطين معاً وأن يكون مجموعها ≈ 100%.',
  stepOf: 'الخطوة {n} من 3',
};

const fr: SoilTranslations = {
  step1Title: 'Choisir la parcelle',
  step2Title: 'Saisir les mesures',
  step3Title: 'Rapport et recommandations',
  step1Short: 'Parcelle',
  step2Short: 'Mesures',
  step3Short: 'Rapport',
  next: 'Suivant',
  previous: 'Précédent',

  plotHeading: 'Sélectionnez la ferme et la parcelle',
  plotSubtitle: 'Choisissez une ferme et une parcelle existantes, ou créez-en une nouvelle.',
  chooseFarm: 'Ferme',
  chooseFarmHint: 'Choisissez la ferme à laquelle appartient cette parcelle.',
  noFarmsYet: 'Aucune ferme enregistrée pour le moment.',
  createFirstFarm: 'Créer votre première ferme',
  choosePlot: 'Parcelle',
  choosePlotHint: 'Choisissez la parcelle où l’échantillon a été prélevé.',
  noPlotsYet: 'Aucune parcelle enregistrée dans cette ferme.',
  createPlot: 'Créer une parcelle',
  plotName: 'Nom de la parcelle',
  plotNamePlaceholder: 'Ex. : Parcelle Nord',
  plotAreaHa: 'Superficie (ha)',
  plotSoilType: 'Type de sol',
  currentCropLabel: 'Culture actuelle (facultatif)',
  currentCropPlaceholder: 'Ex. : olivier, blé…',
  optionalFieldNote: 'Les champs facultatifs peuvent rester vides sans bloquer l’analyse.',
  farmName: 'Nom de la ferme',
  farmRegion: 'Gouvernorat',
  farmAreaHa: 'Superficie de la ferme (ha)',
  selectGovernorate: 'Choisir le gouvernorat',
  creatingFarm: 'Création de la ferme…',
  creatingPlot: 'Création de la parcelle…',
  plotRequired: 'Sélectionnez ou créez une parcelle pour continuer.',
  plotSoilTypeRequired: 'Indiquez le type de sol de la parcelle à sa création.',
  farmRequired: 'Sélectionnez ou créez une ferme pour continuer.',
  createFarmFailed: 'Impossible de créer la ferme.',

  measurementsHeading: 'Mesures du sol',
  measurementsSubtitle: 'Saisissez les valeurs disponibles (laboratoire ou terrain). Laissez vide ce qui est indisponible.',
  groupCore: 'Essentiels',
  groupNutrients: 'Éléments majeurs (NPK)',
  groupTexture: 'Texture (sable/limon/argile)',
  groupAdvanced: 'Mesures avancées (facultatif)',
  groupWater: 'Eau d’irrigation (facultatif)',
  groupContext: 'Contexte de la parcelle (facultatif)',
  showAdvanced: 'Afficher les mesures avancées',
  hideAdvanced: 'Masquer les mesures avancées',
  unitLabel: 'Unité',
  unitMethodLabel: 'Unité/méthode d’analyse',
  ecUnitLabel: 'Unité de conductivité',
  sampleDepthLabel: 'Profondeur (cm)',
  samplingDateLabel: 'Date de prélèvement',
  irrigationMethodLabel: 'Méthode d’irrigation',
  waterEcLabel: 'CE de l’eau d’irrigation',
  waterEcUnitLabel: 'Unité CE de l’eau',
  waterPhLabel: 'pH de l’eau d’irrigation',
  targetCropLabel: 'Culture cible (facultatif)',
  targetCropHint: 'Indiquez-la pour obtenir un plan de correction dédié.',
  nutrientUnitHint: 'Ex. : mg/kg, ppm, meq/100g — précisez la méthode si connue.',
  textureHint: 'Sable, limon et argile doivent être saisis ensemble et totaliser ≈ 100 %.',
  optionalSuffix: 'facultatif',

  helpPh: 'L’acidité/ alcalinité conditionne la disponibilité des éléments. La plupart des cultures préfèrent 6–7,5.',
  helpEc: 'La conductivité indique la salinité. Précisez l’unité et la méthode d’extraction.',
  helpN: 'L’azote nourrit la croissance végétative.',
  helpP: 'Le phosphore est essentiel aux racines et à la floraison.',
  helpK: 'Le potassium renforce la résistance et la qualité.',
  helpOm: 'La matière organique améliore la structure et la rétention d’eau.',
  helpMoisture: 'L’humidité guide la planification de l’irrigation.',
  helpTexture: 'La texture détermine la rétention d’eau et le drainage.',
  helpCec: 'La CEC reflète la capacité du sol à retenir les éléments.',
  helpCaMgS: 'Calcium, magnésium et soufre sont des éléments secondaires importants.',
  helpMicro: 'Les oligo-éléments dépendent de l’unité et de la méthode.',
  helpCaco3: 'Le calcaire explique l’alcalinité et le pH élevé.',
  helpSar: 'SAR/ESP évaluent le risque sodique ; nécessitent Na, Ca et Mg.',
  helpWater: 'La qualité de l’eau d’irrigation affecte la salinité.',

  mPh: 'pH',
  mEc: 'Conductivité (CE)',
  mN: 'Azote (N)',
  mP: 'Phosphore (P)',
  mK: 'Potassium (K)',
  mOm: 'Matière organique (%)',
  mMoisture: 'Humidité (%)',
  mSand: 'Sable (%)',
  mSilt: 'Limon (%)',
  mClay: 'Argile (%)',
  mCa: 'Calcium (Ca)',
  mMg: 'Magnésium (Mg)',
  mS: 'Soufre (S)',
  mFe: 'Fer (Fe)',
  mZn: 'Zinc (Zn)',
  mMn: 'Manganèse (Mn)',
  mCu: 'Cuivre (Cu)',
  mB: 'Bore (B)',
  mCec: 'CEC',
  mCaco3Total: 'Calcaire total (%)',
  mCaco3Active: 'Calcaire actif (%)',
  mNa: 'Sodium (Na)',
  mSar: 'SAR',
  mEsp: 'ESP (%)',

  reportTitle: 'Rapport d’analyse du sol',
  reportExecutive: 'Résumé exécutif',
  reportConfidence: 'Niveau de confiance',
  reportDataQuality: 'Qualité des données',
  reportProvided: 'Mesures fournies',
  reportMissing: 'Mesures manquantes',
  reportLimitations: 'Limites',
  reportConsistency: 'Contrôles de cohérence',
  reportIndicators: 'Tableau des indicateurs',
  reportTexture: 'Texture',
  reportChemical: 'Propriétés chimiques',
  reportPhysical: 'Propriétés physiques',
  reportFindings: 'Constats détaillés',
  reportConstraints: 'Contraintes classées',
  reportStrengths: 'Points forts',
  reportCropSuitability: 'Aptitude des cultures',
  reportCropAvoid: 'Cultures à éviter',
  reportTargetPlan: 'Plan de la culture cible',
  reportGaps: 'Écarts actuel/requis',
  reportActions: 'Actions',
  reportFertilization: 'Plan de fertilisation',
  reportFertStages: 'Étapes de fertilisation',
  reportOrganicOptions: 'Options organiques',
  reportWater: 'Eau et irrigation',
  reportCalendar: 'Calendrier (12 semaines)',
  reportRisks: 'Risques et alertes',
  reportRecommendations: 'Recommandations',
  reportFollowUp: 'Plan de suivi',
  reportExtraInfo: 'Informations complémentaires requises',
  reportReview: 'Revue professionnelle',
  reportDisclaimers: 'Avertissements',
  reportFirstAction: 'Première action',
  reportRetestWhen: 'Quand réanalyser',
  reportNoSection: 'Aucun élément disponible dans cette section faute de données.',

  confidenceLow: 'Faible',
  confidenceModerate: 'Modérée',
  confidenceHigh: 'Élevée',
  confidenceNotAssessed: 'Non évaluée',

  feasibilityFeasible: 'Faisable',
  feasibilityCorrection: 'Faisable après correction',
  feasibilityNotRecommended: 'Non recommandée',
  feasibilityNotAssessed: 'Non évaluée',

  priorityNow: 'Maintenant',
  priorityBeforePlanting: 'Avant plantation',
  priorityDuringSeason: 'Pendant la saison',
  priorityFollowUp: 'Suivi',

  severityInformational: 'Informatif',
  severityLow: 'Faible',
  severityModerate: 'Modérée',
  severityHigh: 'Élevée',
  severityNotAssessed: 'Non évaluée',

  fertStageBasal: 'Fond',
  fertStageEstablishment: 'Installation',
  fertStageVegetative: 'Croissance végétative',
  fertStageFlowering: 'Floraison/nouaison',

  reportLanguageNote: 'Le rapport est généré par IA générative (LLM) en arabe. Les mesures sont saisies par l’utilisateur et non vérifiées en laboratoire ; les doses sont retenues faute de données fiables.',
  reportPersistedNote: 'Ce rapport est enregistré dans votre compte et restera consultable après reconnexion.',
  reportNotPersistedNote: 'Le rapport n’a pas été enregistré (aucune parcelle associée).',
  reportReportOf: 'Rapport de la parcelle',

  marketMatchTitle: 'Produits correspondants sur le marché',
  marketMatchSubtitle: 'Produits et offres de vendeurs enregistrés sur AgroGrowth, lorsqu’ils existent.',
  marketMatchSearch: 'Rechercher un produit ou un engrais…',
  marketMatchEmpty: 'Aucun produit correspondant enregistré. Aucun produit ni prix n’a été inventé.',
  marketMatchUnavailable: 'Le marché agricole est indisponible tant que les offres et stocks ne sont pas connectés à la base.',
  marketMatchOpen: 'Ouvrir le produit',
  marketPriceLabel: 'Prix',
  marketSellerLabel: 'Vendeur',
  marketLocationLabel: 'Localisation',

  findCropsCta: 'Trouver les meilleures cultures pour cette parcelle',
  findCropsCtaSub: 'Réutilise les mesures enregistrées de cette parcelle sans ressaisie.',
  reuseDataNote: 'Les données de la parcelle et du sol seront réutilisées automatiquement.',
  reusingSoilData: 'Utilisation des données de sol enregistrées…',
  cropFromPlotTitle: 'Cultures suggérées pour cette parcelle',
  cropRequiresSoil: 'Aucune analyse de sol enregistrée pour cette parcelle. Réalisez d’abord l’analyse du sol.',
  cropCompareHint: 'Touchez une culture pour voir ses détails et la choisir.',
  cropSelectCta: 'Choisir cette culture',
  cropEvaluateOwn: 'Évaluer une culture que vous voulez planter',
  cropEvaluateOwnPlaceholder: 'Nom de la culture…',
  cropEvaluateOwnCta: 'Évaluer l’aptitude',
  cropOwnResultTitle: 'Aptitude de la culture demandée',
  cropSuitability: 'Aptitude',
  cropReasons: 'Raisons',
  cropWater: 'Besoin en eau',
  cropSeason: 'Saison',
  cropDaysToMaturity: 'Durée de croissance',
  cropDaysUnit: 'jours',
  cropSelectThis: 'Choisir',

  projectConfirmTitle: 'Créer mon projet de culture',
  projectConfirmSubtitle: 'Le projet sera enregistré avec la parcelle, l’analyse du sol et la culture choisie, jusqu’à la récolte.',
  projectCrop: 'Culture',
  projectFarm: 'Ferme',
  projectPlot: 'Parcelle',
  projectArea: 'Superficie (ha)',
  projectPlantingDate: 'Date de plantation',
  projectExpectedHarvest: 'Récolte prévue',
  projectPlantingDatePlaceholder: 'AAAA-MM-JJ',
  projectCreate: 'Créer le projet',
  projectCreating: 'Création du projet…',
  projectCreateFailed: 'Impossible de créer le projet. Vérifiez les données et réessayez.',
  projectCreatedTitle: 'Votre projet de culture est créé',
  projectCreatedSubtitle: 'Vous pouvez maintenant suivre le cycle de la culture étape par étape.',
  projectOpen: 'Ouvrir le projet',
  projectMyProjects: 'Mes projets de culture',
  projectNone: 'Aucun projet de culture pour le moment.',
  projectNoneHint: 'Commencez par une analyse du sol puis choisissez une culture.',
  projectTasksTitle: 'À faire maintenant',
  projectTasksSubtitle: 'Tâches dérivées du rapport de sol et de la culture choisie. Faites-les dans l’ordre.',
  projectTaskDone: 'Fait',
  projectTaskUndone: 'Marquer comme fait',
  projectHarvest: 'Récolte',
  projectStagePlanned: 'Planifié',
  projectCycleNote: 'L’état des tâches est conservé sur cet appareil ; le projet lui-même est enregistré dans votre compte.',

  taskDoMeasurement: 'Compléter une mesure de sol manquante',
  taskPrepareSoil: 'Préparer le sol avant plantation',
  taskAmend: 'Appliquer l’amendement recommandé',
  taskIrrigation: 'Préparer l’irrigation',
  taskPlant: 'Commencer la plantation',
  taskMonitor: 'Surveiller la croissance',
  taskRetest: 'Planifier la prochaine analyse',

  soilAdvisoryUnavailable: 'Le service d’avis n’est pas configuré ; le moteur expert a été utilisé à la place.',
  soilReportFetchFailed: 'Impossible de récupérer le rapport.',
  cropRequiresPersistedSoil: 'Une analyse de sol enregistrée est requise pour cette parcelle.',
  cultivationCreateFailed: 'Impossible d’enregistrer le projet.',
  cultivationLoadFailed: 'Impossible de charger les projets.',
  needPhMoisture: 'Saisissez au moins le pH et l’humidité pour un rapport utile. Laissez vide le reste.',
  invalidNumbers: 'Vérifiez les valeurs saisies ; certains champs sont invalides.',
  ecUnitRequired: 'Précisez l’unité de conductivité (CE) si vous saisissez sa valeur.',
  textureTogether: 'Saisissez sable, limon et argile ensemble, total ≈ 100 %.',
  stepOf: 'Étape {n} sur 3',
};

const en: SoilTranslations = {
  step1Title: 'Choose the plot',
  step2Title: 'Enter measurements',
  step3Title: 'Report and recommendations',
  step1Short: 'Plot',
  step2Short: 'Measurements',
  step3Short: 'Report',
  next: 'Next',
  previous: 'Back',

  plotHeading: 'Select the farm and plot',
  plotSubtitle: 'Pick an existing farm and plot, or create a new plot to record its measurements.',
  chooseFarm: 'Farm',
  chooseFarmHint: 'Choose the farm this plot belongs to.',
  noFarmsYet: 'No farm registered yet.',
  createFirstFarm: 'Create your first farm',
  choosePlot: 'Plot',
  choosePlotHint: 'Choose the plot where the sample was taken.',
  noPlotsYet: 'No plot registered in this farm yet.',
  createPlot: 'Create a new plot',
  plotName: 'Plot name',
  plotNamePlaceholder: 'e.g. North plot',
  plotAreaHa: 'Area (hectares)',
  plotSoilType: 'Soil type',
  currentCropLabel: 'Current crop (optional)',
  currentCropPlaceholder: 'e.g. olive, wheat…',
  optionalFieldNote: 'Optional fields can stay empty without blocking the analysis.',
  farmName: 'Farm name',
  farmRegion: 'Governorate',
  farmAreaHa: 'Farm area (hectares)',
  selectGovernorate: 'Select governorate',
  creatingFarm: 'Creating farm…',
  creatingPlot: 'Creating plot…',
  plotRequired: 'Select or create a plot to continue.',
  plotSoilTypeRequired: 'Set the plot soil type when creating it.',
  farmRequired: 'Select or create a farm to continue.',
  createFarmFailed: 'Could not create the farm.',

  measurementsHeading: 'Soil measurements',
  measurementsSubtitle: 'Enter the values you have (lab or field). Leave anything unavailable empty.',
  groupCore: 'Essentials',
  groupNutrients: 'Macronutrients (NPK)',
  groupTexture: 'Texture (sand/silt/clay)',
  groupAdvanced: 'Advanced measurements (optional)',
  groupWater: 'Irrigation water (optional)',
  groupContext: 'Field context (optional)',
  showAdvanced: 'Show advanced measurements',
  hideAdvanced: 'Hide advanced measurements',
  unitLabel: 'Unit',
  unitMethodLabel: 'Unit/analysis method',
  ecUnitLabel: 'EC unit',
  sampleDepthLabel: 'Sample depth (cm)',
  samplingDateLabel: 'Sampling date',
  irrigationMethodLabel: 'Irrigation method',
  waterEcLabel: 'Irrigation water EC',
  waterEcUnitLabel: 'Water EC unit',
  waterPhLabel: 'Irrigation water pH',
  targetCropLabel: 'Target crop (optional)',
  targetCropHint: 'Name it to get a dedicated correction plan.',
  nutrientUnitHint: 'e.g. mg/kg, ppm, meq/100g — add the method if known.',
  textureHint: 'Sand, silt and clay must be entered together and total ≈ 100%.',
  optionalSuffix: 'optional',

  helpPh: 'Acidity/alkalinity drives nutrient availability. Most crops prefer 6–7.5.',
  helpEc: 'Electrical conductivity indicates salinity. State the unit and extraction method.',
  helpN: 'Nitrogen fuels vegetative growth.',
  helpP: 'Phosphorus matters for roots and flowering.',
  helpK: 'Potassium strengthens resistance and quality.',
  helpOm: 'Organic matter improves structure and water retention.',
  helpMoisture: 'Soil moisture guides irrigation scheduling.',
  helpTexture: 'Texture determines water retention and drainage.',
  helpCec: 'CEC reflects the soil’s ability to hold nutrients.',
  helpCaMgS: 'Calcium, magnesium and sulfur are important secondary nutrients.',
  helpMicro: 'Micronutrients depend on the unit and method.',
  helpCaco3: 'Carbonates explain alkalinity and high pH.',
  helpSar: 'SAR/ESP assess sodicity risk; they need Na, Ca and Mg.',
  helpWater: 'Irrigation water quality affects salinity.',

  mPh: 'pH',
  mEc: 'Electrical conductivity (EC)',
  mN: 'Nitrogen (N)',
  mP: 'Phosphorus (P)',
  mK: 'Potassium (K)',
  mOm: 'Organic matter (%)',
  mMoisture: 'Moisture (%)',
  mSand: 'Sand (%)',
  mSilt: 'Silt (%)',
  mClay: 'Clay (%)',
  mCa: 'Calcium (Ca)',
  mMg: 'Magnesium (Mg)',
  mS: 'Sulfur (S)',
  mFe: 'Iron (Fe)',
  mZn: 'Zinc (Zn)',
  mMn: 'Manganese (Mn)',
  mCu: 'Copper (Cu)',
  mB: 'Boron (B)',
  mCec: 'CEC',
  mCaco3Total: 'Total CaCO3 (%)',
  mCaco3Active: 'Active CaCO3 (%)',
  mNa: 'Sodium (Na)',
  mSar: 'SAR',
  mEsp: 'ESP (%)',

  reportTitle: 'Soil analysis report',
  reportExecutive: 'Executive summary',
  reportConfidence: 'Confidence level',
  reportDataQuality: 'Data quality',
  reportProvided: 'Provided measurements',
  reportMissing: 'Missing measurements',
  reportLimitations: 'Limitations',
  reportConsistency: 'Consistency checks',
  reportIndicators: 'Indicator table',
  reportTexture: 'Texture',
  reportChemical: 'Chemical properties',
  reportPhysical: 'Physical properties',
  reportFindings: 'Detailed findings',
  reportConstraints: 'Ranked constraints',
  reportStrengths: 'Strengths',
  reportCropSuitability: 'Crop suitability',
  reportCropAvoid: 'Crops to avoid',
  reportTargetPlan: 'Target crop plan',
  reportGaps: 'Current vs required gaps',
  reportActions: 'Actions',
  reportFertilization: 'Fertilization plan',
  reportFertStages: 'Fertilization stages',
  reportOrganicOptions: 'Organic options',
  reportWater: 'Water and irrigation',
  reportCalendar: 'Calendar (12 weeks)',
  reportRisks: 'Risks and alerts',
  reportRecommendations: 'Recommendations',
  reportFollowUp: 'Follow-up plan',
  reportExtraInfo: 'Additional information needed',
  reportReview: 'Professional review',
  reportDisclaimers: 'Disclaimers',
  reportFirstAction: 'First action',
  reportRetestWhen: 'When to retest',
  reportNoSection: 'No items available in this section due to missing data.',

  confidenceLow: 'Low',
  confidenceModerate: 'Moderate',
  confidenceHigh: 'High',
  confidenceNotAssessed: 'Not assessed',

  feasibilityFeasible: 'Feasible',
  feasibilityCorrection: 'Feasible with correction',
  feasibilityNotRecommended: 'Not recommended',
  feasibilityNotAssessed: 'Not assessed',

  priorityNow: 'Now',
  priorityBeforePlanting: 'Before planting',
  priorityDuringSeason: 'During season',
  priorityFollowUp: 'Follow-up',

  severityInformational: 'Informational',
  severityLow: 'Low',
  severityModerate: 'Moderate',
  severityHigh: 'High',
  severityNotAssessed: 'Not assessed',

  fertStageBasal: 'Basal',
  fertStageEstablishment: 'Establishment',
  fertStageVegetative: 'Vegetative growth',
  fertStageFlowering: 'Flowering/filling',

  reportLanguageNote: 'The report is generated by generative AI (LLM) in Arabic. Measurements are user-entered and not lab-verified; doses are withheld for lack of reliable data.',
  reportPersistedNote: 'This report is saved to your account and remains available after you sign in again.',
  reportNotPersistedNote: 'The report was not saved (no plot was associated).',
  reportReportOf: 'Plot report',

  marketMatchTitle: 'Matching products on the marketplace',
  marketMatchSubtitle: 'Products and seller offers registered on AgroGrowth, when available.',
  marketMatchSearch: 'Search a product or fertilizer…',
  marketMatchEmpty: 'No matching product is registered. No product or price was invented.',
  marketMatchUnavailable: 'The agricultural marketplace is unavailable until seller offers and stock are connected to the database.',
  marketMatchOpen: 'Open product',
  marketPriceLabel: 'Price',
  marketSellerLabel: 'Seller',
  marketLocationLabel: 'Location',

  findCropsCta: 'Find the best crops for this plot',
  findCropsCtaSub: 'Reuses this plot’s saved measurements — no re-entry.',
  reuseDataNote: 'The plot and soil data will be reused automatically.',
  reusingSoilData: 'Using the plot’s saved soil data…',
  cropFromPlotTitle: 'Suggested crops for this plot',
  cropRequiresSoil: 'No saved soil analysis for this plot yet. Run the soil analysis first.',
  cropCompareHint: 'Tap a crop to see details and choose it.',
  cropSelectCta: 'Choose this crop',
  cropEvaluateOwn: 'Evaluate a crop you want to plant',
  cropEvaluateOwnPlaceholder: 'Crop name…',
  cropEvaluateOwnCta: 'Evaluate suitability',
  cropOwnResultTitle: 'Suitability of the requested crop',
  cropSuitability: 'Suitability',
  cropReasons: 'Reasons',
  cropWater: 'Water need',
  cropSeason: 'Season',
  cropDaysToMaturity: 'Growth duration',
  cropDaysUnit: 'days',
  cropSelectThis: 'Choose',

  projectConfirmTitle: 'Create my cultivation project',
  projectConfirmSubtitle: 'The project keeps the plot, soil analysis and chosen crop so you can follow it to harvest.',
  projectCrop: 'Crop',
  projectFarm: 'Farm',
  projectPlot: 'Plot',
  projectArea: 'Area (hectares)',
  projectPlantingDate: 'Planting date',
  projectExpectedHarvest: 'Expected harvest',
  projectPlantingDatePlaceholder: 'YYYY-MM-DD',
  projectCreate: 'Create project',
  projectCreating: 'Creating project…',
  projectCreateFailed: 'Could not create the project. Check the data and try again.',
  projectCreatedTitle: 'Your cultivation project is created',
  projectCreatedSubtitle: 'You can now follow the crop cycle step by step.',
  projectOpen: 'Open project',
  projectMyProjects: 'My cultivation projects',
  projectNone: 'No cultivation projects yet.',
  projectNoneHint: 'Start with a soil analysis then choose a crop to create one.',
  projectTasksTitle: 'What to do now',
  projectTasksSubtitle: 'Tasks derived from the soil report and the chosen crop. Do them in order.',
  projectTaskDone: 'Done',
  projectTaskUndone: 'Mark as done',
  projectHarvest: 'Harvest',
  projectStagePlanned: 'Planned',
  projectCycleNote: 'Task state is kept on this device; the project itself is saved in your account.',

  taskDoMeasurement: 'Complete a missing soil measurement',
  taskPrepareSoil: 'Prepare the soil before planting',
  taskAmend: 'Apply the recommended amendment',
  taskIrrigation: 'Prepare irrigation',
  taskPlant: 'Start planting',
  taskMonitor: 'Monitor crop growth',
  taskRetest: 'Schedule the next soil test',

  soilAdvisoryUnavailable: 'The advisory service is not configured; the expert rule engine was used instead.',
  soilReportFetchFailed: 'Could not retrieve the report.',
  cropRequiresPersistedSoil: 'A saved soil analysis is required for this plot.',
  cultivationCreateFailed: 'Could not save the cultivation project.',
  cultivationLoadFailed: 'Could not load cultivation projects.',
  needPhMoisture: 'Enter at least pH and moisture for a useful report. Leave the rest empty.',
  invalidNumbers: 'Check the values entered; some fields are invalid.',
  ecUnitRequired: 'State the EC unit when you enter its value.',
  textureTogether: 'Enter sand, silt and clay together, totalling ≈ 100%.',
  stepOf: 'Step {n} of 3',
};

export const soilTranslations: Record<Language, SoilTranslations> = { ar, fr, en };

export function getSoil(lang: Language): SoilTranslations {
  return soilTranslations[lang] || soilTranslations.ar;
}
