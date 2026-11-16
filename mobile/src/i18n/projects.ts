import { Language } from './index';

/**
 * Strings for the "My Agricultural Projects" module: the persistent project
 * list, the server-backed daily tracker (`farm_tasks`) and the financial result
 * (`farm_expenses` / `farm_revenues`). Kept in a dedicated table so the large
 * `extra.ts` stays readable. Every locale is authored, not machine-translated.
 */
export interface ProjectTranslations {
  title: string;
  subtitle: string;
  tileTitle: string;
  tileDesc: string;
  tileBadge: string;

  // Project list
  projectsHeading: string;
  noProjects: string;
  noProjectsHint: string;
  openProject: string;
  closeProject: string;
  statusActive: string;
  statusHarvested: string;
  statusFailed: string;
  statusPlanned: string;
  areaLabel: string;
  plantedOn: string;
  expectedHarvest: string;
  growthStage: string;
  stageGermination: string;
  stageSeedling: string;
  stageVegetative: string;
  stageFlowering: string;
  stageFruiting: string;
  stageMaturity: string;
  stageHarvesting: string;
  stagePostHarvest: string;
  cropLabel: string;
  noStage: string;

  // Daily tracking
  trackingHeading: string;
  trackingSubtitle: string;
  noTasks: string;
  noTasksHint: string;
  addTask: string;
  newTask: string;
  taskTitle: string;
  taskTitlePlaceholder: string;
  taskType: string;
  taskPriority: string;
  taskDueDate: string;
  taskDueDateHint: string;
  saveTask: string;
  saving: string;
  cancel: string;
  taskPending: string;
  taskInProgress: string;
  taskCompleted: string;
  taskCancelled: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityUrgent: string;
  typePlanting: string;
  typeIrrigation: string;
  typeFertilization: string;
  typePestControl: string;
  typeHarvesting: string;
  typeMaintenance: string;
  typeInspection: string;
  typeGeneral: string;
  markDone: string;
  reopen: string;
  tasksUnavailable: string;
  taskCreated: string;

  // Financial result
  financeHeading: string;
  financeScopeNote: string;
  totalExpenses: string;
  grossRevenue: string;
  salesCosts: string;
  netProfit: string;
  recordExpense: string;
  recordRevenue: string;
  expenseAmount: string;
  expenseCategory: string;
  expenseDate: string;
  expenseDescription: string;
  expenseSupplier: string;
  revenueAmount: string;
  revenueQuantity: string;
  revenueUnitPrice: string;
  revenueBuyer: string;
  saveExpense: string;
  saveRevenue: string;
  financeUnavailable: string;
  noFinanceData: string;
  currency: string;
  expenseCreated: string;
  revenueCreated: string;
  catSeeds: string;
  catFertilizers: string;
  catPesticides: string;
  catLabor: string;
  catEquipment: string;
  catFuel: string;
  catMaintenance: string;
  catUtilities: string;
  catInsurance: string;
  catOther: string;

  // Honest states
  roleBlockedTitle: string;
  roleBlockedBody: string;
  saveFailed: string;
  invalidAmount: string;
  invalidDate: string;
  invalidTitle: string;
  overviewHint: string;

  // Disease evidence persistence
  saveDiagnosisToFarm: string;
  saveDiagnosisHeading: string;
  linkDiagnosisToProject: string;
  noProjectLink: string;
  savingDiagnosis: string;
  diagnosisSaved: string;
  diagnosisSaveFailed: string;
  chooseFarmToSave: string;
  noFarmToSave: string;
  diagnosisNotFieldVerified: string;
}

const ar: ProjectTranslations = {
  title: 'مشاريعي الزراعية',
  subtitle: 'من تحضير الأرض إلى الحصاد والنتيجة المالية، متابَدة يوماً بيوم',
  tileTitle: 'مشاريعي الزراعية',
  tileDesc: 'متابعة المحاصيل والمهام اليومية والنتيجة المالية',
  tileBadge: 'متابعة',

  projectsHeading: 'المشاريع',
  noProjects: 'لا توجد مشاريع بعد',
  noProjectsHint: 'ابدأ بتحليل التربة ثم توصية المحصول لإنشاء مشروعك الأول.',
  openProject: 'فتح المشروع',
  closeProject: 'إغلاق',
  statusActive: 'نشط',
  statusHarvested: 'محصود',
  statusFailed: 'فاشل',
  statusPlanned: 'مخطّط',
  areaLabel: 'المساحة',
  plantedOn: 'تاريخ الزراعة',
  expectedHarvest: 'الحصاد المتوقّع',
  growthStage: 'طور النمو',
  stageGermination: 'الإنبات',
  stageSeedling: 'البادرة',
  stageVegetative: 'النمو الخضري',
  stageFlowering: 'الإزهار',
  stageFruiting: 'الإثمار',
  stageMaturity: 'النضج',
  stageHarvesting: 'الحصاد',
  stagePostHarvest: 'ما بعد الحصاد',
  cropLabel: 'المحصول',
  noStage: 'غير محدّد',

  trackingHeading: 'المتابعة اليومية',
  trackingSubtitle: 'مهام محفوظة على الخادم ومرتبطة بمزرعة المشروع',
  noTasks: 'لا توجد مهام بعد',
  noTasksHint: 'أضف أول مهمة لتحضير الأرض أو السقي أو المتابعة.',
  addTask: 'إضافة مهمة',
  newTask: 'مهمة جديدة',
  taskTitle: 'عنوان المهمة',
  taskTitlePlaceholder: 'مثال: حراثة أولية للقطعة',
  taskType: 'نوع المهمة',
  taskPriority: 'الأولوية',
  taskDueDate: 'تاريخ الاستحقاق',
  taskDueDateHint: 'الصيغة: YYYY-MM-DD (اختياري)',
  saveTask: 'حفظ المهمة',
  saving: 'جارٍ الحفظ…',
  cancel: 'إلغاء',
  taskPending: 'قيد الانتظار',
  taskInProgress: 'قيد التنفيذ',
  taskCompleted: 'منجزة',
  taskCancelled: 'ملغاة',
  priorityLow: 'منخفضة',
  priorityMedium: 'متوسطة',
  priorityHigh: 'عالية',
  priorityUrgent: 'عاجلة',
  typePlanting: 'زراعة',
  typeIrrigation: 'سقي',
  typeFertilization: 'تسميد',
  typePestControl: 'مكافحة آفات',
  typeHarvesting: 'حصاد',
  typeMaintenance: 'صيانة',
  typeInspection: 'تفقّد',
  typeGeneral: 'عامة',
  markDone: 'إنجاز',
  reopen: 'إعادة الفتح',
  tasksUnavailable: 'تعذّر تحميل المهام من الخادم.',
  taskCreated: 'تم حفظ المهمة.',

  financeHeading: 'النتيجة المالية',
  financeScopeNote:
    'الأرقام محسوبة فقط من المصاريف والمداخيل المرتبطة بهذا المشروع الزراعي.',
  totalExpenses: 'مجموع المصاريف',
  grossRevenue: 'المداخيل الإجمالية',
  salesCosts: 'تكاليف البيع',
  netProfit: 'الربح الصافي',
  recordExpense: 'تسجيل مصروف',
  recordRevenue: 'تسجيل مدخول',
  expenseAmount: 'المبلغ (د.ت)',
  expenseCategory: 'الصنف',
  expenseDate: 'التاريخ',
  expenseDescription: 'الوصف',
  expenseSupplier: 'المورّد',
  revenueAmount: 'المبلغ (د.ت)',
  revenueQuantity: 'الكمية',
  revenueUnitPrice: 'سعر الوحدة',
  revenueBuyer: 'المشتري',
  saveExpense: 'حفظ المصروف',
  saveRevenue: 'حفظ المدخول',
  financeUnavailable: 'تعذّر تحميل النتيجة المالية.',
  noFinanceData: 'لا توجد مصاريف أو مداخيل مسجّلة بعد.',
  currency: 'د.ت',
  expenseCreated: 'تم حفظ المصروف.',
  revenueCreated: 'تم حفظ المدخول.',
  catSeeds: 'بذور',
  catFertilizers: 'أسمدة',
  catPesticides: 'مبيدات',
  catLabor: 'أجرة عمل',
  catEquipment: 'تجهيزات',
  catFuel: 'وقود',
  catMaintenance: 'صيانة',
  catUtilities: 'خدمات',
  catInsurance: 'تأمين',
  catOther: 'أخرى',

  roleBlockedTitle: 'غير متاح لهذا الحساب',
  roleBlockedBody:
    'المتابعة اليومية والنتيجة المالية محفوظتان على الخادم وتتطلبان حساب فلّاح موثّق. حسابك الحالي لا يملك هذه الصلاحية.',
  saveFailed: 'تعذّر الحفظ. تحقّق من الاتصال ومن صحة البيانات.',
  invalidAmount: 'أدخل مبلغاً صحيحاً أكبر من صفر.',
  invalidDate: 'أدخل تاريخاً صحيحاً بالصيغة YYYY-MM-DD.',
  invalidTitle: 'أدخل عنواناً للمهمة.',
  overviewHint: 'اضغط على مشروع لعرض متابعته اليومية ونتيجته المالية.',

  saveDiagnosisToFarm: 'حفظ في سجل المزرعة',
  saveDiagnosisHeading: 'حفظ التشخيص في المزرعة',
  linkDiagnosisToProject: 'ربط التشخيص بمشروع زراعي (اختياري)',
  noProjectLink: 'دون ربط بمشروع',
  savingDiagnosis: 'جارٍ الحفظ…',
  diagnosisSaved: 'تم حفظ التشخيص والصورة في سجل المزرعة.',
  diagnosisSaveFailed: 'تعذّر حفظ التشخيص في سجل المزرعة.',
  chooseFarmToSave: 'اختر المزرعة لحفظ التشخيص فيها',
  noFarmToSave: 'لا توجد مزرعة مسجّلة لحفظ التشخيص فيها. أنشئ مزرعة أولاً.',
  diagnosisNotFieldVerified: 'النتيجة البصرية تتطلّب تثبّتاً ميدانياً؛ الحفظ يسجّل التشخيص فقط.',
};

const fr: ProjectTranslations = {
  title: 'Mes projets agricoles',
  subtitle: 'De la préparation du sol à la récolte et au résultat financier, suivi au jour le jour',
  tileTitle: 'Mes projets agricoles',
  tileDesc: 'Suivi des cultures, des tâches quotidiennes et du résultat financier',
  tileBadge: 'Suivi',

  projectsHeading: 'Projets',
  noProjects: 'Aucun projet pour le moment',
  noProjectsHint: 'Commencez par une analyse du sol puis une recommandation de culture pour créer votre premier projet.',
  openProject: 'Ouvrir le projet',
  closeProject: 'Fermer',
  statusActive: 'Actif',
  statusHarvested: 'Récolté',
  statusFailed: 'Échoué',
  statusPlanned: 'Planifié',
  areaLabel: 'Surface',
  plantedOn: 'Date de plantation',
  expectedHarvest: 'Récolte prévue',
  growthStage: 'Stade de croissance',
  stageGermination: 'Germination',
  stageSeedling: 'Plantule',
  stageVegetative: 'Croissance végétative',
  stageFlowering: 'Floraison',
  stageFruiting: 'Fructification',
  stageMaturity: 'Maturation',
  stageHarvesting: 'Récolte',
  stagePostHarvest: 'Après récolte',
  cropLabel: 'Culture',
  noStage: 'Non renseigné',

  trackingHeading: 'Suivi quotidien',
  trackingSubtitle: 'Tâches enregistrées côté serveur, liées à la ferme du projet',
  noTasks: 'Aucune tâche',
  noTasksHint: 'Ajoutez une première tâche de préparation, d’irrigation ou de suivi.',
  addTask: 'Ajouter une tâche',
  newTask: 'Nouvelle tâche',
  taskTitle: 'Titre de la tâche',
  taskTitlePlaceholder: 'Ex. : labour initial de la parcelle',
  taskType: 'Type de tâche',
  taskPriority: 'Priorité',
  taskDueDate: 'Échéance',
  taskDueDateHint: 'Format : AAAA-MM-JJ (facultatif)',
  saveTask: 'Enregistrer la tâche',
  saving: 'Enregistrement…',
  cancel: 'Annuler',
  taskPending: 'En attente',
  taskInProgress: 'En cours',
  taskCompleted: 'Terminée',
  taskCancelled: 'Annulée',
  priorityLow: 'Basse',
  priorityMedium: 'Moyenne',
  priorityHigh: 'Haute',
  priorityUrgent: 'Urgente',
  typePlanting: 'Plantation',
  typeIrrigation: 'Irrigation',
  typeFertilization: 'Fertilisation',
  typePestControl: 'Lutte antiparasitaire',
  typeHarvesting: 'Récolte',
  typeMaintenance: 'Maintenance',
  typeInspection: 'Inspection',
  typeGeneral: 'Générale',
  markDone: 'Terminer',
  reopen: 'Rouvrir',
  tasksUnavailable: 'Impossible de charger les tâches depuis le serveur.',
  taskCreated: 'Tâche enregistrée.',

  financeHeading: 'Résultat financier',
  financeScopeNote:
    'Les chiffres incluent uniquement les dépenses et recettes liées à ce projet agricole.',
  totalExpenses: 'Total des dépenses',
  grossRevenue: 'Recettes brutes',
  salesCosts: 'Frais de vente',
  netProfit: 'Bénéfice net',
  recordExpense: 'Enregistrer une dépense',
  recordRevenue: 'Enregistrer une recette',
  expenseAmount: 'Montant (TND)',
  expenseCategory: 'Catégorie',
  expenseDate: 'Date',
  expenseDescription: 'Description',
  expenseSupplier: 'Fournisseur',
  revenueAmount: 'Montant (TND)',
  revenueQuantity: 'Quantité',
  revenueUnitPrice: 'Prix unitaire',
  revenueBuyer: 'Acheteur',
  saveExpense: 'Enregistrer la dépense',
  saveRevenue: 'Enregistrer la recette',
  financeUnavailable: 'Impossible de charger le résultat financier.',
  noFinanceData: 'Aucune dépense ni recette enregistrée pour le moment.',
  currency: 'TND',
  expenseCreated: 'Dépense enregistrée.',
  revenueCreated: 'Recette enregistrée.',
  catSeeds: 'Semences',
  catFertilizers: 'Engrais',
  catPesticides: 'Pesticides',
  catLabor: 'Main-d’œuvre',
  catEquipment: 'Équipement',
  catFuel: 'Carburant',
  catMaintenance: 'Maintenance',
  catUtilities: 'Charges',
  catInsurance: 'Assurance',
  catOther: 'Autre',

  roleBlockedTitle: 'Non disponible pour ce compte',
  roleBlockedBody:
    'Le suivi quotidien et le résultat financier sont stockés côté serveur et nécessitent un compte agriculteur vérifié. Votre compte n’a pas cette autorisation.',
  saveFailed: 'Échec de l’enregistrement. Vérifiez la connexion et la validité des données.',
  invalidAmount: 'Saisissez un montant valide supérieur à zéro.',
  invalidDate: 'Saisissez une date valide au format AAAA-MM-JJ.',
  invalidTitle: 'Saisissez un titre pour la tâche.',
  overviewHint: 'Touchez un projet pour voir son suivi quotidien et son résultat financier.',

  saveDiagnosisToFarm: 'Enregistrer dans le registre',
  saveDiagnosisHeading: 'Enregistrer le diagnostic dans la ferme',
  linkDiagnosisToProject: 'Lier le diagnostic à un projet agricole (facultatif)',
  noProjectLink: 'Sans projet associé',
  savingDiagnosis: 'Enregistrement…',
  diagnosisSaved: 'Diagnostic et image enregistrés dans le registre de la ferme.',
  diagnosisSaveFailed: 'Échec de l\u2019enregistrement du diagnostic dans la ferme.',
  chooseFarmToSave: 'Choisissez la ferme où enregistrer le diagnostic',
  noFarmToSave: 'Aucune ferme enregistrée pour y sauvegarder le diagnostic. Créez d\u2019abord une ferme.',
  diagnosisNotFieldVerified: 'Le diagnostic visuel nécessite une confirmation sur le terrain ; l\u2019enregistrement ne fait que le consigner.',
};

const en: ProjectTranslations = {
  title: 'My Agricultural Projects',
  subtitle: 'From land preparation to harvest and financial result, tracked day by day',
  tileTitle: 'My Agricultural Projects',
  tileDesc: 'Crop tracking, daily tasks and financial result',
  tileBadge: 'Tracking',

  projectsHeading: 'Projects',
  noProjects: 'No projects yet',
  noProjectsHint: 'Start with a soil analysis then a crop recommendation to create your first project.',
  openProject: 'Open project',
  closeProject: 'Close',
  statusActive: 'Active',
  statusHarvested: 'Harvested',
  statusFailed: 'Failed',
  statusPlanned: 'Planned',
  areaLabel: 'Area',
  plantedOn: 'Planted on',
  expectedHarvest: 'Expected harvest',
  growthStage: 'Growth stage',
  stageGermination: 'Germination',
  stageSeedling: 'Seedling',
  stageVegetative: 'Vegetative growth',
  stageFlowering: 'Flowering',
  stageFruiting: 'Fruiting',
  stageMaturity: 'Maturity',
  stageHarvesting: 'Harvesting',
  stagePostHarvest: 'Post-harvest',
  cropLabel: 'Crop',
  noStage: 'Not set',

  trackingHeading: 'Daily tracking',
  trackingSubtitle: 'Server-stored tasks linked to the project farm',
  noTasks: 'No tasks yet',
  noTasksHint: 'Add a first preparation, irrigation or monitoring task.',
  addTask: 'Add task',
  newTask: 'New task',
  taskTitle: 'Task title',
  taskTitlePlaceholder: 'e.g. initial tillage of the plot',
  taskType: 'Task type',
  taskPriority: 'Priority',
  taskDueDate: 'Due date',
  taskDueDateHint: 'Format: YYYY-MM-DD (optional)',
  saveTask: 'Save task',
  saving: 'Saving…',
  cancel: 'Cancel',
  taskPending: 'Pending',
  taskInProgress: 'In progress',
  taskCompleted: 'Completed',
  taskCancelled: 'Cancelled',
  priorityLow: 'Low',
  priorityMedium: 'Medium',
  priorityHigh: 'High',
  priorityUrgent: 'Urgent',
  typePlanting: 'Planting',
  typeIrrigation: 'Irrigation',
  typeFertilization: 'Fertilization',
  typePestControl: 'Pest control',
  typeHarvesting: 'Harvesting',
  typeMaintenance: 'Maintenance',
  typeInspection: 'Inspection',
  typeGeneral: 'General',
  markDone: 'Complete',
  reopen: 'Reopen',
  tasksUnavailable: 'Could not load tasks from the server.',
  taskCreated: 'Task saved.',

  financeHeading: 'Financial result',
  financeScopeNote:
    'Figures include only expenses and revenues linked to this cultivation project.',
  totalExpenses: 'Total expenses',
  grossRevenue: 'Gross revenue',
  salesCosts: 'Sales costs',
  netProfit: 'Net profit',
  recordExpense: 'Record expense',
  recordRevenue: 'Record revenue',
  expenseAmount: 'Amount (TND)',
  expenseCategory: 'Category',
  expenseDate: 'Date',
  expenseDescription: 'Description',
  expenseSupplier: 'Supplier',
  revenueAmount: 'Amount (TND)',
  revenueQuantity: 'Quantity',
  revenueUnitPrice: 'Unit price',
  revenueBuyer: 'Buyer',
  saveExpense: 'Save expense',
  saveRevenue: 'Save revenue',
  financeUnavailable: 'Could not load the financial result.',
  noFinanceData: 'No expenses or revenues recorded yet.',
  currency: 'TND',
  expenseCreated: 'Expense saved.',
  revenueCreated: 'Revenue saved.',
  catSeeds: 'Seeds',
  catFertilizers: 'Fertilizers',
  catPesticides: 'Pesticides',
  catLabor: 'Labor',
  catEquipment: 'Equipment',
  catFuel: 'Fuel',
  catMaintenance: 'Maintenance',
  catUtilities: 'Utilities',
  catInsurance: 'Insurance',
  catOther: 'Other',

  roleBlockedTitle: 'Not available for this account',
  roleBlockedBody:
    'Daily tracking and the financial result are stored server-side and require a verified farmer account. Your account does not have this permission.',
  saveFailed: 'Could not save. Check the connection and the validity of the data.',
  invalidAmount: 'Enter a valid amount greater than zero.',
  invalidDate: 'Enter a valid date in YYYY-MM-DD format.',
  invalidTitle: 'Enter a title for the task.',
  overviewHint: 'Tap a project to see its daily tracking and financial result.',

  saveDiagnosisToFarm: 'Save to farm record',
  saveDiagnosisHeading: 'Save diagnosis to a farm',
  linkDiagnosisToProject: 'Link diagnosis to an agricultural project (optional)',
  noProjectLink: 'No project link',
  savingDiagnosis: 'Saving…',
  diagnosisSaved: 'Diagnosis and image saved to the farm record.',
  diagnosisSaveFailed: 'Could not save the diagnosis to the farm record.',
  chooseFarmToSave: 'Choose the farm to save the diagnosis in',
  noFarmToSave: 'No farm recorded to save the diagnosis in. Create a farm first.',
  diagnosisNotFieldVerified: 'The visual diagnosis needs field confirmation; saving only records it.',
};

export const projectTranslations: Record<Language, ProjectTranslations> = { ar, fr, en };

export function getProjects(lang: Language): ProjectTranslations {
  return projectTranslations[lang] || projectTranslations.ar;
}
