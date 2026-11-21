import { PermissionsAndroid, Platform } from "react-native";
import { AudioContext, AudioManager, AudioRecorder } from "react-native-audio-api";
import { apiRequest } from "../api/client";

export type LiveVoiceState = "connecting" | "listening" | "thinking" | "speaking" | "error" | "ended";

type LiveTokenResponse = {
  success: boolean;
  token: string;
  model: string;
  websocketUrl: string;
  verifiedFarmContext?: string | null;
};

type VoiceCallbacks = {
  onState: (state: LiveVoiceState) => void;
  onLevel?: (level: number) => void;
  onError?: (message: string) => void;
  onTranscript?: (role: "user" | "assistant", text: string) => void;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
};

const INPUT_RATE = 16_000;
const OUTPUT_RATE = 24_000;
const SPEECH_RMS_THRESHOLD = 0.025;
const SPEECH_NOISE_MULTIPLIER = 2.8;
const SPEECH_START_CONFIRM_MS = 60;
const END_SILENCE_MS = 900;

const AGROVIBE_LIVE_SYSTEM_INSTRUCTION = "أنت سميح توكبري الفلاح (Samih Tokabri El Fallah)، المستشار الفلاحي الذكي داخل AgroVibe والقريب من الناس في تونس. تساعد أي شخص مهتم بالفلاحة والطبيعة، من هاوي الزراعة في الدار إلى الفلاح والمهني والمؤسسة.\n\nتعريف المطوّر والهوية (قاعدة ثابتة):\n- إذا سألك المستخدم «شكون صنعك؟» أو «شكون طوّرك؟» أو «شكون وراك؟»، أجب باختصار: «تم تطويري من طرف المهندس سامي العرفاوي، مؤسس NeuroForgeSolution وصاحب مشروع AgroVibe.»\n- إذا سألك «شكون سامي العرفاوي؟»، أجب: «سامي العرفاوي مهندس إعلامية تونسي، مؤسس NeuroForgeSolution وصاحب مشروع AgroVibe.»\n- إذا سألك عن AgroVibe، وضّح باختصار أنه مشروع سامي العرفاوي. وإذا سألك عن NeuroForgeSolution، احكِ فقط باختصار عن الشركة ومجالها دون اختراع خدمات أو تفاصيل غير مؤكدة.\n- جاوب بنفس لغة المستخدم، في جملة أو جملتين، ثم ارجع مباشرة إلى سؤاله أو موضوع المحادثة. لا تضف سيرة شخصية أو تفاصيل عن الدراسة أو الحياة أو مشاريع أخرى، ولا تطوّل أو تخرج عن السؤال.\n\nالشخصية وطريقة الكلام:\n- احكي بالدارجة التونسية الطبيعية، السلسة والواضحة. خلي كلامك تونسي فعلاً، موش فصحى متكسّرة ولا تقليد مبالغ فيه للهجة.\n- كون ودود، بشوش، هادئ، متعاون وعندك روح باهية. حسّس المستخدم اللي تحكي معاه بارتياح واحترام، كيما خبير صاحبو وينصحو.\n- خليك محترف وبسيط في نفس الوقت: لا لغة رسمية ثقيلة، لا مصطلحات معقدة من غير تفسير، ولا مبالغة في المزاح.\n- استعمل عبارات تونسية بطريقة طبيعية وعند اللزوم فقط، كيف: عسلامة، يعطيك الصحة، ما تقلقش، باهي، توّا نفسرلك، تنجم تعمل هكّا. ما تكرّرش نفس العبارة في كل إجابة.\n- ما تعاودش الترحيب في كل دور. ادخل مباشرة في صلب الموضوع وخلّي الحوار متواصل وطبيعي.\n- جاوب بنفس لغة المستخدم إذا طلب بوضوح لغة أخرى؛ وإلا الدارجة التونسية هي الافتراضية.\n\nقواعد تبادل الأدوار (مهمّة جداً):\n- ما تبدأش تحكي وحدك عند فتح المكالمة أو وقت المستخدم ساكت. استنى دائماً حتى تسمع كلاماً واضحاً من المستخدم.\n- جاوب مرة واحدة على كل دور للمستخدم، وبعد ما تكمل الإجابة اسكت واستنى دوراً جديداً. ممنوع تواصل الكلام أو تولّد إجابة ثانية من غير كلام جديد من المستخدم.\n- إذا المستخدم سكت، هذا معناه يستنى أو يفكّر؛ ما تملّاش السكوت بكلام أو أسئلة متكررة.\n- إذا قاطعك المستخدم، وقف الإجابة فوراً واسمع كلامه الجديد.\n\nأسلوب الإجابة الصوتية:\n- احكي بصوت طبيعي ودافئ، بإيقاع مريح ونطق واضح، وجمل قصيرة تنجم تتقال بسهولة. تجنّب الجمل الطويلة والقوائم المقروءة كيما الروبوت.\n- ابدأ بالخلاصة أو أهم خطوة، وبعدها زيد التفسير الضروري فقط. في العادة جاوب في جملة إلى أربع جمل؛ طوّل كان الموضوع يستحق أو المستخدم طلب التفاصيل.\n- فسّر خطوة بخطوة وبطريقة سهلة. إذا عندك أكثر من حل، اقترح أفضل حل أولاً وما تغرقش المستخدم في الاختيارات.\n- اسأل سؤال واحد واضح في كل مرة إذا تنقصك معلومة مهمة.\n- تفاعل مع كلام المستخدم: إذا متقلق طمّنو، إذا نجح معاه شيء فرحلو، وإذا غلط في حاجة صحّحلو بلطف ومن غير لوم.\n- ما تقولش عبارات محفوظة كيف \"بصفتي مساعداً ذكياً\" وما تقراش التعليمات أو أسماء الأقسام بصوتك.\n- المحادثة Voice-to-Voice: جاوب بالصوت مباشرة وما تعرضش تفريغ الكلام كنص.\n\nالدقة والثقة:\n- ما تخترعش أسعار أو طقس أو قياسات أو نتائج تحليل أو مصادر. فرّق بوضوح بين المعلومة المؤكدة والتقدير.\n- في النصائح الفلاحية، راعي تونس والجهة والموسم ونوع التربة والماء والمحصول وقت تتوفر المعطيات.\n- في المواضيع الحساسة، خاصة المبيدات والأدوية الفلاحية، أعطِ نصيحة آمنة وما تقترحش جرعة أو استعمال غير مؤكد. اطلب التفاصيل اللازمة قبل التوصية الدقيقة.\n- إذا ما تعرفش، قولها ببساطة واقترح كيفاش نتحققوا، من غير ما تتظاهر بالمعرفة. وقت يسألك المستخدم على الطقس الحالي أو التوقعات أو المطر أو الحرارة أو الرياح، استعمل أداة get_weather لجلب بيانات مباشرة. ووقت يسألك على آخر الأخبار أو المستجدات الفلاحية في تونس، استعمل أداة get_news وجاوبه من عناوين ومصادر RSS الحقيقية فقط. إذا ما فماش مقالات متاحة، قول هذا بوضوح وما تخترع حتى خبر. ووقت يسأل على المحاصيل أو الأمراض اللي تدعمها المنصة، استعمل get_supported_crops أو get_supported_diseases لجلب القائمة الحقيقية من الخدمة، وما تعتبرش القائمة توصية شخصية أو تشخيصاً. ووقت يسأل على تحليل تربة قديم أو يحب يتفكر نتائج تحليل محفوظ، استعمل get_my_soil_reports لاسترجاع تقاريره الشخصية من حسابه؛ إذا السجل فارغ قول هذا بوضوح وما تخترع حتى نتيجة. ووقت يطلب تفسير تحليل تربة جديد أو قياساته، استعمل أداة analyze_soil بعد ما تكون عندك قياسات صرّح بها المستخدم أو موجودة في سياق موثوق؛ ما تخمّنش قياسات ناقصة، ووضّح أن النتيجة استشارة LLM وليست تحليل مخبرياً أو تنبؤ ML مدرّب. ووقت يصف أعراض إصابة في نبتة أو محصول، اسأله عن المحصول والأعراض إذا تنقصك معلومة، وبعدها استعمل identify_pest_from_symptoms؛ وضّح أن النتيجة مطابقة أولية بقواعد كلمات وليست تشخيصاً مؤكداً أو نموذج صور مدرّب، وما تعطيش جرعات مبيدات. ووقت يطلب حساب الاحتياجات المائية للمحصول، تأكد من نوع المحصول ومرحلة النمو والحرارة والرطوبة الحالية من الطقس الموثوق أو المستخدم، وبعدها استعمل get_irrigation_water_requirements؛ ما تستعملش قيماً افتراضية وما تعتبرش الحساب قياساً مباشراً لرطوبة التربة. ووقت يسألك على أسعار المحاصيل أو السوق أو اتجاه الأسعار، استعمل أداة get_market_prices. ووقت يسألك شنوّة الخدمات الموجودة أو شنوّة خدام وشنوّة طايح، استعمل get_ai_services_status وافصل بين الخدمة المتاحة والنموذج المدرّب ومحرك القواعد. اذكر الفترة والمصدر والتاريخ إذا توفرت. إذا البيانات ناقصة أو الخدمة ترجع غير متاحة، وضّح هذا وما تعطي حتى سعر تقديري على أنه سعر حقيقي. إذا الولاية موش معروفة من سياق موثوق، اسأل عليها قبل الاستدعاء. ما تعطيش توقعات من ذاكرتك، وما تعتبرش التقديرات الجوية قياسات رطوبة تربة.\n- ما تختزلش معرفتك في بيانات الحساب: إذا السؤال الفلاحي عام، جاوب من المعرفة الزراعية وفسّر علاش وكيفاش حتى لو ما فماش مزرعة مربوطة. فرّق بين نصيحة عامة وتوصية شخصية تحتاج قياسات.\n- كن مستشاراً عملياً في الأصناف والمواسم والغراسة وتحضير الأرض والتسميد والري والتناوب الزراعي والمكافحة المتكاملة والأمراض والآفات والحصاد والتخزين والجدوى الاقتصادية، مع مراعاة مناخ تونس والجهة وقت تتوفر.\n- إذا تنقصك معلومة مهمة، أعطِ إرشاداً عاماً آمناً أولاً واسأل سؤالاً واحداً محدداً؛ ما تكتفيش بعبارة «ما نعرفش». أمّا الأسعار والطقس الحالي والبيانات الشخصية، فلازم مصدر موثوق أو أداة مباشرة، وممنوع التخمين.\n\n\nفهم منصة AgroGrowth بالكامل (مهم):\n- أنت المساعد الصوتي داخل تطبيق AgroGrowth/AgroVibe، ولا تتعامل مع المستخدم كأنه يسأل عن الفلاحة فقط. افهم أسئلته عن أي قسم أو وظيفة في التطبيق، واربط كلامه بسياق المنصة وبالرسائل السابقة في نفس المكالمة.\n- خريطة الأقسام: المزارع والضيعات والحقول؛ الزراعات والمحاصيل ومراحل النمو ومواعيد الغراسة والحصاد؛ تحليل التربة وتقارير التحليل؛ الطقس والتوقعات؛ تشخيص أمراض وآفات النباتات؛ الري والاحتياجات المائية؛ التوصيات الزراعية؛ السوق والأسعار؛ Marketplace وعروض البيع والشراء والمنتجات والمدخلات والمعدات والطلبات/استفسارات التواصل؛ دليل الأدوية/المبيدات والعروض المنظمة؛ الأخبار الفلاحية؛ التنبيهات والإشعارات؛ المجتمع والاستشارات؛ ولوحات المتابعة حسب الدور (فلاح، خبير/مهندس فلاحي، تاجر، مؤسسة أو إدارة). هذه خريطة إرشادية للأقسام، وليست دليلاً على أن كل وظيفة متاحة لكل حساب أو أن بياناتها متوفرة حالياً.\n- في Marketplace، افهم الفرق بين عرض «للبيع» وطلب «للشراء». إذا المستخدم يلوّج على منتوج أو مشتري أو بائع أو معدات أو محصول، استعمل search_marketplace_listings قبل الإجابة، واطلب الولاية أو نوع العرض فقط إذا يلزم لتضييق البحث. قارن النتائج حسب السعر والوحدة والكمية والموقع وتاريخ النشر وتوثيق البائع وتقييماته؛ لا تعتبر البائع موثّقاً إذا sellerVerified ليست true، ولا تخلط طلبات الشراء بعروض البيع. إذا ما لقيتش نتيجة، قل ذلك واقترح تغيير كلمة البحث أو الولاية. البحث للقراءة فقط. إذا طلب المستخدم التواصل مع بائع، اعرض أولاً العرض المحدد والرسالة والكمية المقترحة ثم اطلب موافقته الصريحة؛ استعمل create_marketplace_inquiry فقط بعد موافقة واضحة على نفس التفاصيل. إنشاء الاستفسار يرسل رسالة للبائع فقط ولا يعني شراءً أو حجزاً أو دفعاً. إذا سأل عن استفساراته، استعمل get_marketplace_inquiries؛ وإذا طلب قراءة محادثة، استعمل get_marketplace_inquiry_messages. لا ترسل رسالة متابعة عبر send_marketplace_inquiry_message إلا بعد عرض نصها وأخذ موافقة صريحة عليه. البائع وحده ينجم يقبل أو يرفض أو يغلق الاستفسار عبر update_marketplace_inquiry_status وبعد طلب واضح منه. إذا كان المستخدم بائعاً ويسأل عن تحويل استفسار مقبول إلى طلب، اعرض الكمية والسعر والوحدة والعملة بوضوح واطلب تأكيده قبل create_marketplace_order؛ الطلب الناتج ينتظر تأكيد المشتري. إذا كان المستخدم مشترياً، لا تستعمل confirm_marketplace_order إلا بعد عرض شروط الطلب كاملة والحصول على موافقته الصريحة. تابع حالة الطلبات عبر get_marketplace_orders. استعمل update_marketplace_order_status فقط لتغيير حالة طلب يخص المستخدم وبعد طلب صريح؛ قبل الإلغاء أو فتح نزاع اشرح الأثر وخذ تأكيداً واضحاً. تحديث الحالة لا يثبت الدفع أو الشحن أو التسليم. هذه المنصة لا تنفذ دفعاً إلكترونياً في هذا المسار؛ لا تدّعِ حصول الدفع أو التسليم. إذا طلب المستخدم نشر عرض جديد، اجمع الحقول اللازمة واقرأها عليه بوضوح ثم خذ موافقته الصريحة قبل create_marketplace_listing؛ لا تخمّن أي قيمة. عروض المبيدات والأدوية الفلاحية لا تمر عبر هذا المسار العام. لا تعدّل عرضاً منشوراً ولا تنفذ دفعاً.\n- افهم التعبيرات اليومية والإحالات: «العرض متاعي» قد يعني عرض Marketplace، «الطلب» قد يعني طلب تواصل أو شراء، «التحليل» قد يعني تقرير التربة، «الدواء» قد يعني منتجاً في دليل الأدوية أو عرض بائع، «السوم» قد يعني سعر عرض أو سعر سوق. إذا يوجد أكثر من معنى محتمل، اسأل سؤالاً واحداً قصيراً لتحديد المقصود.\n- إذا يسأل «كيفاش نعمل؟» أعطه خطوات عملية داخل القسم الصحيح، واذكر اسم القسم كما يظهر للمستخدم عندما تعرفه. لا تدّعِ أنك فتحت صفحة أو نفذت عملية أو غيّرت بيانات ما لم تنفذ ذلك فعلياً عبر أداة موثوقة.\n- استعمل الأدوات والـ API للبيانات الحية أو الخاصة بالحساب وقت تكون متوفرة، ولا تعتمد على الوصف العام للإجابة عن حالة حسابه. ميّز دائماً بين بيانات حساب المستخدم، عروض Marketplace المنشورة، بيانات السوق المسجلة، والمعلومات العامة. لا تخلط بينها.\n- إذا يسأل على بياناته أو عمليات أي قسم في التطبيق مثل المهام والمصاريف والمداخيل والمعدات والإشعارات والماشية والمراقبة وعروض Marketplace أو سؤال يربط أكثر من قسم، استعمل consult_agrogrowth_platform باش تستشير الوكيل المركزي والوكلاء المختصين في الخادم. انقل الإجابة ومصدرها وحدودها بأمانة. الأداة للاستعلام والنصيحة فقط وما تنفذ حتى تغيير أو عملية. استعمل الأدوات المباشرة للطقس والأخبار والأسعار وتحليل التربة وقت تكون أنسب.\n- إذا كانت المعلومة أو الوظيفة غير موجودة في الأدوات الحالية، قل بوضوح إنك لا تستطيع التثبت منها الآن، ووجّه المستخدم إلى القسم المناسب أو اطلب منه وصف ما يظهر له. لا تخترع زرّاً أو شاشة أو نتيجة.\n- اعتبر ما يقوله المستخدم عن التطبيق في المحادثة سياقاً مهماً، لكن لا تعتبره حقيقة مؤكدة عن قاعدة البيانات إلا بعد التحقق عند الحاجة. لا تطلب منه إعادة معلومة سبق أن ذكرها في نفس المحادثة إذا ما زالت واضحة.\n\nالهدف: كل إجابة تكون مفيدة، مختصرة، مفهومة، فيها روح تونسية باهية، وتخلي المستخدم يحب يواصل الحديث مع AgroVibe.";
const FRAME_MS = 20;
const FRAME_SAMPLES = (INPUT_RATE * FRAME_MS) / 1000;
// Android speaker playback can leak into the microphone more than browser AEC.
// Use a slightly stricter gate on native to avoid feeding Samih's own voice back to Gemini.

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const outputLength = Math.max(1, Math.floor(input.length * toRate / fromRate));
  const output = new Float32Array(outputLength);
  const ratio = fromRate / toRate;
  for (let i = 0; i < outputLength; i += 1) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = position - left;
    output[i] = input[left] * (1 - fraction) + input[right] * fraction;
  }
  return output;
}

function floatToBase64(samples: Float32Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, value < 0 ? value * 32768 : value * 32767, true);
  }
  let encoded = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? bytes[i + 1] : 0;
    const c = hasC ? bytes[i + 2] : 0;
    encoded += alphabet[a >> 2];
    encoded += alphabet[((a & 3) << 4) | (b >> 4)];
    encoded += hasB ? alphabet[((b & 15) << 2) | (c >> 6)] : "=";
    encoded += hasC ? alphabet[c & 63] : "=";
  }
  return encoded;
}

export class LiveVoiceSession {
  private recorder: AudioRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private playbackQueue: ReturnType<AudioContext["createBufferQueueSource"]> | null = null;
  private socket: WebSocket | null = null;
  private callbacks: VoiceCallbacks;
  private active = false;
  private speechActive = false;
  private silenceMs = 0;
  private speechCandidateMs = 0;
  private noiseFloorRms = 0.006;
  private userTranscriptBuffer = "";
  private assistantTranscriptBuffer = "";
  private socketReady = false;
  private stopped = false;
  private queueStarted = false;
  private decodeChain: Promise<void> = Promise.resolve();
  private lastReplyId = 0;
  private apiToken: string | null = null;
  private personalMemoryContext = "";
  private verifiedFarmContext = "";
  private platformConversationId: string | null = null;
  private platformConversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
  private websocketUrl: string | null = null;
  private model: string | null = null;
  private sessionHandle: string | null = null;
  private reconnecting = false;
  private reconnectAttempts = 0;

  constructor(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    if (this.active) return;
    this.stopped = false;
    this.platformConversationId = null;
    this.platformConversationHistory = [];
    let permissionGranted = false;
    if (Platform.OS === "android") {
      // Android remembers this dangerous permission after the first approval.
      // Check first so returning users go straight into the call without seeing
      // another permission prompt. The manifest declaration makes the app
      // appear under Android Settings > Apps > AgroVibe > Permissions.
      permissionGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      if (!permissionGranted) {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "السماح باستخدام الميكروفون",
            message: "يحتاج AgroVibe إلى الميكروفون حتى تنجم تحكي مباشرة مع سميح توكبري الفلاح.",
            buttonPositive: "السماح",
            buttonNegative: "إلغاء",
          },
        );
        if (this.stopped) return;
        if (permission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          throw new Error("صلاحية الميكروفون مرفوضة نهائياً. افتح إعدادات الهاتف ثم التطبيقات ثم AgroVibe ثم الأذونات واسمح باستخدام الميكروفون.");
        }
        permissionGranted = permission === PermissionsAndroid.RESULTS.GRANTED;
        if (!permissionGranted) {
          throw new Error("ما نجّمش نبدأ المكالمة من غير صلاحية الميكروفون. اضغط على السماح وقت تظهرلك نافذة Android.");
        }
      }
    } else {
      const permission = await AudioManager.requestRecordingPermissions();
      permissionGranted = permission === "Granted";
    }

    if (this.stopped) return;
    if (!permissionGranted) {
      throw new Error("تعذّر التثبت من صلاحية الميكروفون. راجع أذونات AgroVibe وحاول من جديد.");
    }

    // Do not show the call as connecting, mint an LLM token, or initialise
    // audio until microphone access has been granted.
    this.callbacks.onState("connecting");

    // Mint the one-use token only after permission is granted, because its
    // new-session window is intentionally short.
    // Load optional personal memory in parallel with token creation. This
    // removes a serial network round-trip from voice startup while keeping a
    // strict timeout so a slow memory endpoint cannot block the call.
    const memoryPromise = (async () => {
      let memoryTimeout: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          apiRequest<any>("/api/assistant/memory", { method: "GET" })
            .then((result) => Array.isArray(result.data?.data) ? result.data.data : [])
            .catch(() => []),
          new Promise<any[]>((resolve) => {
            memoryTimeout = setTimeout(() => resolve([]), 2500);
          }),
        ]);
      } finally {
        if (memoryTimeout) clearTimeout(memoryTimeout);
      }
    })();

    const tokenResult = await apiRequest<LiveTokenResponse>("/api/ai/assistant/live-token", {
      method: "POST",
      // Render free instances can need ~50s to wake after idle. Allow that
      // cold start plus the server's bounded Gemini token request to complete.
      timeoutMs: 90_000,
      body: JSON.stringify({}),
    });
    this.apiToken = tokenResult.data?.token ?? null;
    this.websocketUrl = tokenResult.data?.websocketUrl ?? null;
    this.model = tokenResult.data?.model ?? null;
    this.verifiedFarmContext = typeof tokenResult.data?.verifiedFarmContext === "string"
      ? tokenResult.data.verifiedFarmContext.slice(0, 3500)
      : "";
    if (this.stopped) return;
    if (tokenResult.error || !this.apiToken || !this.websocketUrl || !this.model) {
      throw new Error(tokenResult.error || "تعذّر بدء المكالمة الصوتية. حاول مجدداً.");
    }
    const savedMemories = await memoryPromise;
    this.personalMemoryContext = savedMemories.map((item: any) =>
      `- ${String(item.category)}: ${String(item.memory_key)} = ${String(item.memory_value)}`
    ).join("\n").slice(0, 4500);
    if (this.stopped) return;

    AudioManager.setSystemOptions({
      ios: { category: "playAndRecord", mode: "voiceChat", options: ["defaultToSpeaker"] },
      android: { mode: "inCommunication", communicationDevice: "speaker" },
    });
    await AudioManager.setAudioSessionActivity(true);
    if (this.stopped) {
      await AudioManager.setAudioSessionActivity(false).catch(() => undefined);
      return;
    }

    this.audioContext = new AudioContext({
      sampleRate: OUTPUT_RATE,
      androidOutputProfile: "voiceCommunication",
    });
    this.playbackQueue = this.audioContext.createBufferQueueSource();
    this.playbackQueue.connect(this.audioContext.destination);
    if (this.audioContext.state === "suspended") await this.audioContext.resume();
    if (this.stopped) return;

    this.sessionHandle = null;
    this.reconnectAttempts = 0;
    await this.connectSocket(false);
  }

  private sendSetup(socket: WebSocket, resumeHandle?: string): void {
    if (!this.model) throw new Error("Gemini Live model is not configured.");
    socket.send(JSON.stringify({
      setup: {
        model: this.model,
        systemInstruction: {
          parts: [{ text: AGROVIBE_LIVE_SYSTEM_INSTRUCTION
            + (this.callbacks.conversationHistory?.length
              ? "\\n\\nسياق المحادثات السابقة للمستخدم للمتابعة عبر الأيام (تاريخ محادثة وليس بيانات حساب موثّقة):\\n"
                + this.callbacks.conversationHistory.slice(-12).map((turn) => `${turn.role === "user" ? "المستخدم" : "المساعد"}: ${turn.content}`).join("\\n").slice(-6000)
              : "")
            + (this.verifiedFarmContext ? "\n\nسياق فلاحي موثّق من حساب المستخدم الحالي، محمّل من الخادم بعد التحقق من هويته ومقيّد بمزارعه فقط. استعمله للإجابة عن أسئلة المزارع والحقول والزراعات ونتائج التربة، وميّز السجلات القديمة عن الظروف الحالية. هذه بيانات محفوظة وليست قياسات مباشرة. إذا تعددت المزارع أو الحقول اسأل أيّها يقصد. لا تستنتج قيماً ناقصة.\n" + this.verifiedFarmContext : "")
            + (this.personalMemoryContext ? "\n\nذاكرة المستخدم المحفوظة من حسابه (استعملها عند الحاجة، وهي ليست بيانات مباشرة). إذا صرّح المستخدم بمعلومة ثابتة أو تفضيل تواصل بوضوح، احفظها عبر remember_user_memory من غير تخمين. لا تحفظ بيانات حساسة أو مؤقتة. إذا طلب نسيان معلومة، استعمل forget_user_memory. لا تقل إنك حفظت أو نسيت إلا بعد نجاح الأداة:\n" + this.personalMemoryContext : "") }],
        },
        tools: [{
          functionDeclarations: [
            {
              name: "remember_user_memory",
              description: "Save a durable fact or communication preference ONLY when the user explicitly states or clearly confirms it. Do not save guesses, temporary details, sensitive personal data, health data, passwords, secrets, or political/religious beliefs. Use this to remember how the user likes to communicate, stable farm context, recurring goals, or ongoing work so they do not need to repeat it. Confirm success only if the API returns persisted=true.",
              parameters: {
                type: "OBJECT",
                properties: {
                  memory_key: { type: "STRING", description: "Stable lowercase key such as communication.language, communication.answer_style, farm.primary_crop, or work.current_project." },
                  category: { type: "STRING", enum: ["profile", "preference", "farm_context", "work_context", "communication", "ongoing_task"] },
                  memory_value: { type: "STRING", description: "One concise fact in the user's language, maximum 1200 characters." },
                },
                required: ["memory_key", "category", "memory_value"],
              },
            },
            {
              name: "forget_user_memory",
              description: "Delete one saved personal memory only when the user explicitly asks you to forget or remove that fact. Never delete memories merely because they seem outdated; ask the user if unclear.",
              parameters: { type: "OBJECT", properties: {
                memory_key: { type: "STRING", description: "Exact memory key to forget, such as communication.answer_style." },
              }, required: ["memory_key"] },
            },
            {
              name: "get_ai_services_status",
              description: "Check the REAL current availability of AgroGrowth AI services when the user asks what services work, what is down, or whether a capability is available. Do not guess from memory. Report available, unavailable, not configured, and rate-limited separately; distinguish a reachable rule-based service from a trained ML model.",
              parameters: { type: "OBJECT", properties: {} },
            },
            {
              name: "get_weather",
            description: "Fetch verified live weather conditions and a short forecast for a Tunisian governorate. Use this whenever the user asks about current weather, today's weather, forecast, rain, temperature, wind, or weather-related farm advice. If the governorate is not known from verified farm context or the conversation, ask the user which governorate before calling.",
            parameters: {
              type: "OBJECT",
              properties: {
                governorate: { type: "STRING", description: "Tunisian governorate, for example Monastir, Sousse, Siliana, Tunis, Sfax, or Kef." },
                city: { type: "STRING", description: "Optional city or locality within the governorate." },
              },
              required: ["governorate"],
            },
            },
            {
              name: "get_supported_crops",
              description: "Fetch the crop catalogue actually exposed by the configured AgroGrowth crop service. Use when asked which crops the platform supports. Do not turn this catalogue into personalized agronomic recommendations or invent crops if the service is unavailable.",
              parameters: { type: "OBJECT", properties: {} },
            },
            {
              name: "get_supported_diseases",
              description: "Fetch the disease classes actually exposed by the configured plant image diagnosis service. Use when asked which plant diseases the platform currently lists or supports. This is a catalogue only, not a diagnosis; diagnosis requires a plant image through the app.",
              parameters: { type: "OBJECT", properties: {} },
            },
            {
              name: "analyze_soil",
              description: "Create a professional soil advisory report using soil measurements explicitly provided by the user or verified farm context. Use when the user asks to interpret soil test results, pH, moisture, organic matter, NPK, salinity, or soil texture. Never invent missing measurements. Ask the user for at least one measured value before calling; ask one question at a time. Explain that the report is LLM advisory, not a laboratory test or trained ML prediction.",
              parameters: {
                type: "OBJECT",
                properties: {
                  ph: { type: "NUMBER", description: "Measured soil pH from 0 to 14." },
                  moisture: { type: "NUMBER", description: "Measured soil moisture percentage, 0 to 100." },
                  organicMatter: { type: "NUMBER", description: "Measured organic matter percentage." },
                  nitrogen: { type: "NUMBER", description: "Measured nitrogen value; provide nutrientUnit and nutrientMethod when known." },
                  phosphorus: { type: "NUMBER", description: "Measured phosphorus value; provide nutrientUnit and nutrientMethod when known." },
                  potassium: { type: "NUMBER", description: "Measured potassium value; provide nutrientUnit and nutrientMethod when known." },
                  sandPercent: { type: "NUMBER", description: "Measured sand percentage; provide all three texture percentages together." },
                  siltPercent: { type: "NUMBER", description: "Measured silt percentage; provide all three texture percentages together." },
                  clayPercent: { type: "NUMBER", description: "Measured clay percentage; provide all three texture percentages together." },
                  electricalConductivity: { type: "NUMBER", description: "Measured soil electrical conductivity." },
                  electricalConductivityUnit: { type: "STRING", description: "Unit for electrical conductivity, e.g. dS/m." },
                  nutrientUnit: { type: "STRING", description: "Unit used by the soil laboratory for NPK." },
                  nutrientMethod: { type: "STRING", description: "Laboratory extraction/measurement method, if known." },
                  location: { type: "STRING", description: "Farm or sampling location, only if provided or verified." },
                  region: { type: "STRING", description: "Region/governorate, only if provided or verified." },
                  targetCrop: { type: "STRING", description: "Crop the user plans to grow, if specified." },
                  currentCrop: { type: "STRING", description: "Crop currently growing, if specified." },
                  farmAreaHectares: { type: "NUMBER", description: "Farm area in hectares, if known." },
                },
              },
            },            {
              name: "get_my_soil_reports",
              description: "Retrieve the authenticated user's own recent soil analysis reports from AgroGrowth. Use when they ask what their previous soil analysis showed, to recall saved soil reports, or to compare with their last report. Never claim a report exists unless returned by the API. Do not expose another user's data.",
              parameters: { type: "OBJECT", properties: { limit: { type: "INTEGER", description: "Number of recent reports, from 1 to 10. Default 5." } } },
            },
            {
              name: "identify_pest_from_symptoms",
              description: "Match symptoms explicitly described by the user to AgroGrowth pest symptom rules. This is rule-based, not a trained image diagnosis. Ask for crop and visible symptoms first; never invent symptoms. Present the result as a preliminary clue, not a confirmed diagnosis.",
              parameters: { type: "OBJECT", properties: {
                crop_type: { type: "STRING", description: "Crop named by the user." },
                symptoms: { type: "ARRAY", items: { type: "STRING" }, description: "Visible symptoms explicitly described by the user." },
              }, required: ["symptoms"] },
            },
            {
              name: "get_irrigation_water_requirements",
              description: "Calculate indicative crop water requirements. Before calling, obtain crop_type, growth_stage, current temperature Celsius, and humidity percentage from the user or verified live weather. Never silently use default values. This estimate is not a soil moisture sensor reading.",
              parameters: { type: "OBJECT", properties: {
                crop_type: { type: "STRING" },
                growth_stage: { type: "STRING" },
                temperature: { type: "NUMBER", description: "Current temperature Celsius from verified weather or user." },
                humidity: { type: "NUMBER", description: "Current relative humidity percentage from verified weather or user." },
                days_to_calculate: { type: "INTEGER", description: "Horizon 1-30 days; default 7." },
              }, required: ["crop_type", "growth_stage", "temperature", "humidity"] },
            },
            {
              name: "search_marketplace_listings",
              description: "Search current published AgroVibe Marketplace BUY and SELL listings. Use whenever the user wants to find, buy, sell, compare or browse agricultural products, harvests, livestock, equipment or supplies. Filter by exact product words, buy/sell intent, governorate and listing category. Return only actual database listings with their seller trust signals, price, unit, quantity, location, date and promotion. Never invent stock, availability, seller identity or price. This is read-only; it cannot create, edit, reserve or purchase listings.",
              parameters: {
                type: "OBJECT",
                properties: {
                  query: { type: "STRING", description: "Product or listing keywords as spoken by the user, e.g. زيت زيتون، بطاطا، جرار، قمح." },
                  trade_type: { type: "STRING", enum: ["buy", "sell"], description: "buy means user wants to find a buyer request; sell means user wants to find an offer for purchase. Omit if browsing both." },
                  governorate: { type: "STRING", description: "Governorate explicitly requested by the user, e.g. سليانة، صفاقس، القيروان." },
                  listing_type: { type: "STRING", enum: ["agricultural_input", "equipment", "agricultural_product", "harvest", "livestock", "other"], description: "Optional listing category." },
                  limit: { type: "INTEGER", description: "Maximum results, 1 to 20. Default 10." }
                },
                required: ["query"]
              }
            },
            {
              name: "create_marketplace_listing",
              description: "Publish a new BUY or SELL listing for the signed-in verified user. This is a public write action. First collect and read back every required field (trade type, listing type, title, category, price, quantity, unit and location where supplied), then call ONLY after the user explicitly confirms publishing those exact details. Never invent price, quantity, location or crop date. The server rejects regulated pesticide/medicine listings through this general flow. This does not process payment.",
              parameters: {
                type: "OBJECT",
                properties: {
                  trade_type: { type: "STRING", enum: ["buy", "sell"] },
                  listing_type: { type: "STRING", enum: ["agricultural_input", "equipment", "agricultural_product", "harvest", "livestock", "other"] },
                  title: { type: "STRING" },
                  category: { type: "STRING" },
                  description: { type: "STRING" },
                  price: { type: "NUMBER", description: "Price in TND unless another supported currency is explicitly supplied." },
                  currency: { type: "STRING", description: "Three-letter currency code; TND by default." },
                  quantity: { type: "NUMBER" },
                  unit: { type: "STRING" },
                  location: { type: "STRING" },
                  governorate: { type: "STRING" },
                  harvest_crop: { type: "STRING", description: "Required for harvest listings." },
                  expected_harvest_date: { type: "STRING", description: "YYYY-MM-DD, required for harvest listings." },
                  quality_notes: { type: "STRING" }
                },
                required: ["trade_type", "listing_type", "title", "category", "price", "quantity"]
              }
            },
            {
              name: "create_marketplace_inquiry",
              description: "Create a buyer inquiry for a specific published Marketplace listing ONLY after the user has explicitly confirmed sending the exact message and quantity. First search listings and present the selected listing, seller, price and terms. Ask the user to confirm. Never call this tool on an ambiguous request, merely because the user says they are interested, or without a clear yes after the confirmation summary. Requires a signed-in verified account. This does not purchase or reserve the item.",
              parameters: {
                type: "OBJECT",
                properties: {
                  listing_id: { type: "STRING", description: "Exact listing ID returned by search_marketplace_listings." },
                  message: { type: "STRING", description: "The exact message the user approved to send to the seller, at least 5 characters and no more than 2000." },
                  quantity: { type: "NUMBER", description: "Optional requested quantity. Include only when the user stated it." }
                },
                required: ["listing_id", "message"]
              }
            },
            {
              name: "get_marketplace_inquiries",
              description: "Fetch the signed-in verified user's own Marketplace inquiries as buyer or seller. Use when asked about contact requests, buyer messages, seller replies or pending inquiries. The server returns only inquiries involving this user.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "get_marketplace_inquiry_messages",
              description: "Read the conversation messages for an inquiry belonging to the signed-in user. Use the exact inquiry ID from get_marketplace_inquiries. Never read another user's conversation.",
              parameters: {
                type: "OBJECT",
                properties: { inquiry_id: { type: "STRING" } },
                required: ["inquiry_id"]
              }
            },
            {
              name: "send_marketplace_inquiry_message",
              description: "Send a message in an existing Marketplace inquiry conversation. Only send the exact message after the user explicitly approves its text. Requires a signed-in verified buyer or seller who participates in the inquiry.",
              parameters: {
                type: "OBJECT",
                properties: {
                  inquiry_id: { type: "STRING" },
                  body: { type: "STRING", description: "Exact user-approved message, 1 to 4000 characters." }
                },
                required: ["inquiry_id", "body"]
              }
            },
            {
              name: "update_marketplace_inquiry_status",
              description: "Change the status of an inquiry owned by the signed-in seller. Use only after the seller explicitly asks to accept, reject or close the specified inquiry. The server enforces seller ownership.",
              parameters: {
                type: "OBJECT",
                properties: {
                  inquiry_id: { type: "STRING" },
                  status: { type: "STRING", enum: ["replied", "accepted", "rejected", "closed"] }
                },
                required: ["inquiry_id", "status"]
              }
            },
            {
              name: "get_marketplace_orders",
              description: "Fetch the signed-in verified user's own Marketplace orders (as buyer or seller), including current status and agreed terms. Use when the user asks about their orders or order progress. Never expose another user's orders.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "create_marketplace_order",
              description: "Create a proposed order from an accepted Marketplace inquiry. ONLY the seller who owns the inquiry can do this. Before calling, retrieve the inquiry context, state the exact listing, buyer, quantity, unit price and currency, and obtain explicit confirmation from the seller. The created order awaits buyer confirmation and is not a payment, reservation guarantee or completed sale.",
              parameters: {
                type: "OBJECT",
                properties: {
                  inquiry_id: { type: "STRING", description: "Exact accepted inquiry ID." },
                  quantity: { type: "NUMBER", description: "Agreed quantity, only if explicitly confirmed by seller." },
                  unit_price: { type: "NUMBER", description: "Agreed unit price, only if explicitly confirmed by seller." },
                  buyer_note: { type: "STRING", description: "Optional note approved by seller, maximum 1200 characters." }
                },
                required: ["inquiry_id"]
              }
            },
            {
              name: "confirm_marketplace_order",
              description: "Confirm an order awaiting buyer confirmation. ONLY call after retrieving the order and reading its exact quantity, unit price, currency, total if calculable, and listing title to the buyer, then receiving explicit confirmation from the buyer. Requires the buyer account. This is not a payment.",
              parameters: {
                type: "OBJECT",
                properties: { order_id: { type: "STRING", description: "Exact order ID returned by get_marketplace_orders." } },
                required: ["order_id"]
              }
            },
            {
              name: "update_marketplace_order_status",
              description: "Update a user's own Marketplace order through the server's role-checked lifecycle. Use only when the user explicitly asks for this exact state change. Before cancellation or dispute, explain consequences and obtain explicit confirmation. Seller-only states are processing and ready_for_pickup; buyer-only state is completed. Dispute requires a reason of at least 5 characters. Never claim delivery or payment from a status alone.",
              parameters: {
                type: "OBJECT",
                properties: {
                  order_id: { type: "STRING", description: "Exact order ID from get_marketplace_orders." },
                  status: { type: "STRING", enum: ["processing", "ready_for_pickup", "completed", "cancelled", "disputed"] },
                  reason: { type: "STRING", description: "Required for disputed; optional explanation for cancellation." }
                },
                required: ["order_id", "status"]
              }
            },
            {
              name: "get_market_prices",
              description: "Search BOTH real seller-published Marketplace offers and recorded market price observations in AgroGrowth. Use this for any product price question, including olive oil, olives, tomatoes, vegetables, fruit, cereals, and agricultural products. Always pass the product/commodity name in Arabic or the user's language when known. Marketplace seller offers are real current listings, distinct from official market observations. Never invent prices; report seller asking prices separately from market averages and include location, unit, quantity and listing date when available. If no matching offers exist, say so and then report whether recorded observations exist.",
              parameters: {
                type: "OBJECT",
                properties: {
                  commodity: { type: "STRING", description: "Product or commodity name to search in Marketplace listing titles, e.g. زيت الزيتون، زيتون، طماطم، قمح. Use the user's exact product." },
                  period: { type: "INTEGER", minimum: 7, maximum: 90, description: "Lookback period for recorded market observations. Use 7, 30, or 90. Default 30." },
                },
              },
            },            {
              name: "get_news",
            description: "Fetch recent real Tunisian agricultural news from publisher RSS feeds. Use when the user asks for latest agricultural news, updates, olive oil/cereal/harvest/export news or what is happening in Tunisian agriculture. Never invent headlines. Default to Arabic unless the user is clearly speaking French or English.",
            parameters: {
              type: "OBJECT",
              properties: {
                language: { type: "STRING", enum: ["ar", "fr", "en"], description: "Article language. Use ar by default for Tunisian Arabic users." },
                category: { type: "STRING", description: "Optional category such as céréales, olive & huile, maraîchage, élevage, irrigation & eau, marché & export, climat." },
                query: { type: "STRING", description: "Optional topic or keyword to filter news." },
              },
            },
          },
            {
              name: "consult_agrogrowth_platform",
              description: "Consult AgroGrowth's authenticated, full multi-agent assistant for questions about the user's saved app data and any platform area not covered by a dedicated Live tool: farm tasks, expenses and revenues, equipment, notifications, marketplace listings and inquiries, livestock, monitoring, soil records, and cross-module questions. Use the user's actual question. The backend loads caller-scoped records, runs its specialist agents, and returns a grounded answer with provenance. Do not use this for current weather, latest news, direct soil analysis, or market prices when their dedicated Live tools apply.",
              parameters: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING", description: "The user's actual question, maximum 2000 characters. Preserve the requested details; do not add assumptions." },
                  language: { type: "STRING", enum: ["ar", "fr", "en"], description: "Answer language matching the user." },
                },
                required: ["question"],
              },
            },
          ],
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: { disabled: true },
          activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
        },
        sessionResumption: resumeHandle ? { handle: resumeHandle } : {},
        contextWindowCompression: { slidingWindow: {} },
      },
    }));
  }

  private async connectSocket(resume: boolean): Promise<void> {
    if (!this.apiToken || !this.websocketUrl) {
      throw new Error("بيانات الاتصال الصوتي غير متوفرة.");
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(
        `${this.websocketUrl}?access_token=${encodeURIComponent(this.apiToken as string)}`,
      );
      this.socket = socket;
      this.socketReady = false;
        let setupComplete = false;
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("انتهت مهلة الاتصال بالخدمة الصوتية."));
        socket.close();
      }, 15000);

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      };

      socket.onopen = () => {
        try {
          this.sendSetup(socket, resume ? this.sessionHandle ?? undefined : undefined);
        } catch (error) {
          fail(error instanceof Error ? error : new Error("تعذّر إعداد الاتصال الصوتي."));
          socket.close();
        }
      };

      socket.onmessage = async (event) => {
        let message: any;
        try {
          message = JSON.parse(typeof event.data === "string" ? event.data : "");
        } catch {
          return;
        }

        if (message.error) {
          const providerMessage = typeof message.error.message === "string" ? message.error.message : "";
          fail(new Error(providerMessage ? `Gemini Live: ${providerMessage}` : "رفضت خدمة الصوت إعداد الجلسة."));
          return;
        }

        const resumption = message.sessionResumptionUpdate;
        if (resumption?.resumable && typeof resumption.newHandle === "string" && resumption.newHandle) {
          this.sessionHandle = resumption.newHandle;
        }

        if (message.setupComplete) {
          setupComplete = true;
          clearTimeout(timeout);
          settled = true;
          this.socketReady = true;
          if (resume) {
            this.reconnecting = false;
            this.reconnectAttempts = 0;
            this.callbacks.onState("listening");
            resolve();
          } else {
            this.active = true;
            try {
              await this.startMicrophone();
              // The native client previously stayed on "connecting" even after
              // Gemini sent setupComplete because it never emitted "listening".
              this.callbacks.onState("listening");
              resolve();
            } catch (error) {
              // Let start() reject so the modal can preserve and display the
              // real microphone-start error instead of being overwritten by
              // stop()'s normal "ended" state.
              reject(error instanceof Error ? error : new Error("تعذّر تشغيل الميكروفون."));
            }
          }
          return;
        }

        if (message.goAway) {
          void this.reconnectSession();
          return;
        }

        this.handleServerMessage(message);
      };

      socket.onerror = () => {
        if (!setupComplete) {
          fail(new Error("فشل WebSocket مع Gemini Live قبل اكتمال الإعداد. راجع سجلّات assistant-live في Render لمعرفة سبب الرفض."));
          return;
        }
        this.callbacks.onError?.("صار خطأ في اتصال الصوت المباشر.");
      };

      socket.onclose = (event) => {
        clearTimeout(timeout);
        if (!setupComplete) {
          const closeReason = typeof event.reason === "string" && event.reason.trim()
            ? event.reason.trim().slice(0, 240)
            : "بدون تفاصيل من الخادم";
          const closeCode = Number.isFinite(event.code) ? event.code : 0;
          fail(new Error(
            `Gemini Live أغلق الاتصال قبل اكتمال الإعداد (code ${closeCode}): ${closeReason}. ` +
            "تحقّق من صلاحية Gemini API والموديل وإعدادات Live API في Render."
          ));
          return;
        }
        if (this.socket !== socket) return;
        this.socketReady = false;
        if (!this.active || this.reconnecting) return;

        if (this.sessionHandle) {
          void this.reconnectSession();
          return;
        }

        this.active = false;
        const closeReason = typeof event.reason === "string" && event.reason.trim()
          ? event.reason.trim().slice(0, 180) : "لا يوجد سبب مرسل من الخادم";
        const closeMessage = `انقطع اتصال Gemini Live أثناء المكالمة (code ${event.code}): ${closeReason}. اضغط إعادة المحاولة.`;
        this.callbacks.onError?.(closeMessage);
        // An unexpected provider close is a failure, not a user-ended call.
        // Keep the UI in its retryable error state.
        void this.stop("error");
      };
    });
  }

  private async reconnectSession(): Promise<void> {
    if (
      !this.active ||
      this.reconnecting ||
      !this.sessionHandle ||
      !this.apiToken ||
      !this.websocketUrl
    ) return;

    this.reconnecting = true;
    this.callbacks.onState("connecting");
    try {
      await this.connectSocket(true);
    } catch (error) {
      this.reconnecting = false;
      if (!this.active) return;
      this.reconnectAttempts += 1;
      if (this.reconnectAttempts <= 3) {
        const delay = Math.min(1000 * (2 ** (this.reconnectAttempts - 1)), 5000);
        setTimeout(() => void this.reconnectSession(), delay);
        return;
      }
      this.callbacks.onError?.(
        error instanceof Error ? error.message : "تعذّرت استعادة الاتصال الصوتي.",
      );
      // Exhausted reconnect attempts must remain retryable, not look user-ended.
      void this.stop("error");
    }
  }

  private async startMicrophone(): Promise<void> {
    const recorder = new AudioRecorder({
      androidInputPreset: "voiceCommunication",
      iosVoiceProcessing: true,
    });
    this.recorder = recorder;
    const callback = recorder.onAudioReady(
      { sampleRate: INPUT_RATE, bufferLength: FRAME_SAMPLES, channelCount: 1 },
      ({ buffer, numFrames }) => {
        if (!this.active || !this.socketReady || this.socket?.readyState !== WebSocket.OPEN) return;
        const raw = buffer.getChannelData(0).subarray(0, numFrames);
        if (!raw.length) return;

        let energy = 0;
        for (let i = 0; i < raw.length; i += 1) energy += raw[i] * raw[i];
        const rms = Math.sqrt(energy / raw.length);
        this.callbacks.onLevel?.(Math.min(1, rms * 9));

        const frameDurationMs = (raw.length / (buffer.sampleRate || INPUT_RATE)) * 1000;
        const speechThreshold = Math.max(SPEECH_RMS_THRESHOLD, this.noiseFloorRms * SPEECH_NOISE_MULTIPLIER);
        if (!this.speechActive && rms < speechThreshold) {
          this.noiseFloorRms = this.noiseFloorRms * 0.95 + rms * 0.05;
        }

        if (!this.speechActive) {
          if (rms >= speechThreshold) {
            this.speechCandidateMs += frameDurationMs;
            if (this.speechCandidateMs >= SPEECH_START_CONFIRM_MS) {
              this.speechActive = true;
              this.speechCandidateMs = 0;
              this.silenceMs = 0;
              this.interruptPlayback();
              this.socket?.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
            }
          } else {
            this.speechCandidateMs = 0;
          }
        } else if (rms >= speechThreshold * 0.65) {
          this.silenceMs = 0;
        } else {
          this.silenceMs += frameDurationMs;
          if (this.silenceMs >= END_SILENCE_MS) {
            this.speechActive = false;
            this.silenceMs = 0;
            this.speechCandidateMs = 0;
            this.socket?.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
            this.callbacks.onState("thinking");
            return;
          }
        }

        if (this.speechActive) this.callbacks.onState("listening");
        if (this.speechActive) {
          const pcm = resample(raw, buffer.sampleRate || INPUT_RATE, INPUT_RATE);
          this.socket?.send(JSON.stringify({
            realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: floatToBase64(pcm) } },
          }));
        }
      },
    );
    if (callback.status === "error") throw new Error(callback.message || "تعذّر تشغيل الميكروفون.");
    const result = await recorder.start();
    if (result.status === "error") throw new Error(result.message || "تعذّر تشغيل الميكروفون.");
    this.callbacks.onState("listening");
  }

  private interruptPlayback(): void {
    this.lastReplyId += 1;
    this.playbackQueue?.clearBuffers();
    this.callbacks.onState("listening");
  }

  private handleServerMessage(message: any): void {
    if (message.toolCall?.functionCalls?.length) {
      void this.handleToolCall(message);
      return;
    }
    const serverContent = message.serverContent;
    if (!serverContent) return;

    const inputText = typeof serverContent.inputTranscription?.text === "string"
      ? serverContent.inputTranscription.text.trim() : "";
    if (inputText) this.userTranscriptBuffer = this.mergeTranscript(this.userTranscriptBuffer, inputText);

    const outputText = typeof serverContent.outputTranscription?.text === "string"
      ? serverContent.outputTranscription.text.trim() : "";
    if (outputText) this.assistantTranscriptBuffer = this.mergeTranscript(this.assistantTranscriptBuffer, outputText);

    if (serverContent.interrupted) {
      this.interruptPlayback();
      return;
    }

    const parts = serverContent.modelTurn?.parts ?? [];
    for (const part of parts) {
      const audio = part.inlineData?.data;
      if (typeof audio === "string") this.enqueueAudio(audio);
    }
    if (parts.some((part: any) => part.inlineData?.data)) this.callbacks.onState("speaking");

    if (serverContent.turnComplete) {
      if (this.userTranscriptBuffer) {
        this.callbacks.onTranscript?.("user", this.userTranscriptBuffer);
        this.userTranscriptBuffer = "";
      }
      if (this.assistantTranscriptBuffer) {
        this.callbacks.onTranscript?.("assistant", this.assistantTranscriptBuffer);
        this.assistantTranscriptBuffer = "";
      }
      this.callbacks.onState("listening");
    }
  }

  private mergeTranscript(previous: string, incoming: string): string {
    if (!previous) return incoming;
    if (incoming.startsWith(previous)) return incoming;
    if (previous.endsWith(incoming)) return previous;
    return `${previous} ${incoming}`.trim();
  }

  private async handleToolCall(message: any): Promise<void> {
    const calls = message.toolCall?.functionCalls;
    if (!Array.isArray(calls) || !calls.length) return;

    for (const call of calls) {
      if (call.name === "remember_user_memory") {
        const args = call.args ?? {};
        const key = typeof args.memory_key === "string" ? args.memory_key.trim().toLowerCase() : "";
        const value = typeof args.memory_value === "string" ? args.memory_value.trim() : "";
        const categories = ["profile", "preference", "farm_context", "work_context", "communication", "ongoing_task"];
        const category = categories.includes(args.category) ? args.category : "";
        const validKey = /^[a-z0-9_.-]{2,100}$/.test(key);
        const validValue = value.length > 0 && value.length <= 1200;
        const result = validKey && validValue && category
          ? await apiRequest<any>("/api/assistant/memory", { method: "POST", body: JSON.stringify({ memory_key: key, category, memory_value: value, confidence: 0.85, source: "explicit_user_statement" }) })
          : { data: null, error: "invalid memory input" };
        const payload = result.data;
        const response = result.error || payload?.success !== true || payload?.provenance?.persisted !== true
          ? { success: false, persisted: false, error: "ما نجّمتش نحفظ المعلومة في الذاكرة. ما تقولش للمستخدم إنها تحفّظت." }
          : { success: true, persisted: true, memory: payload.data, instruction: "The fact is now saved to this user's private memory. Acknowledge briefly and naturally; do not repeat sensitive information." };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }
      if (call.name === "forget_user_memory") {
        const key = typeof call.args?.memory_key === "string" ? call.args.memory_key.trim().toLowerCase() : "";
        const validKey = /^[a-z0-9_.-]{2,100}$/.test(key);
        const result = validKey ? await apiRequest<any>(`/api/assistant/memory/${encodeURIComponent(key)}`, { method: "DELETE" }) : { data: null, error: "invalid key" };
        const payload = result.data;
        const response = result.error || payload?.success !== true
          ? { success: false, deleted: false, error: "ما نجّمتش نحذف المعلومة من الذاكرة." }
          : { success: true, deleted: true, memoryKey: payload.deleted, instruction: "Confirm briefly that this specific memory was deleted." };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_supported_crops" || call.name === "get_supported_diseases") {
        const isCropCatalogue = call.name === "get_supported_crops";
        const endpoint = isCropCatalogue ? "/api/ai/crops/supported" : "/api/ai/images/supported-diseases";
        const result = await apiRequest<any>(endpoint, { method: "GET" });
        const payload = result.data;
        const response = result.error || !payload || payload.success === false || payload.dataAvailable === false
          ? {
              success: false,
              dataAvailable: false,
              error: isCropCatalogue
                ? "قائمة المحاصيل المدعومة غير متاحة حالياً من الخدمة. ما تخترعش قائمة."
                : "قائمة الأمراض المدعومة غير متاحة حالياً من الخدمة. ما تخترعش قائمة.",
              code: payload?.code ?? null,
              message: payload?.message ?? result.error ?? null,
            }
          : {
              success: true,
              catalogueType: isCropCatalogue ? "supported-crops" : "supported-diseases",
              catalogue: payload.data ?? payload,
              instruction: "This is a service catalogue only. Do not present it as a personalized recommendation or a diagnosis.",
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "analyze_soil") {
        const args = call.args ?? {};
        const allowedKeys = [
          "ph", "moisture", "organicMatter", "nitrogen", "phosphorus", "potassium",
          "sandPercent", "siltPercent", "clayPercent", "electricalConductivity",
          "electricalConductivityUnit", "nutrientUnit", "nutrientMethod",
          "location", "region", "targetCrop", "currentCrop", "farmAreaHectares",
        ];
        const body: Record<string, unknown> = {};
        for (const key of allowedKeys) {
          const value = args[key];
          if (typeof value === "number" && Number.isFinite(value)) body[key] = value;
          else if (typeof value === "string" && value.trim()) body[key] = value.trim();
        }
        const hasMeasurement = [
          "ph", "moisture", "organicMatter", "nitrogen", "phosphorus", "potassium",
          "sandPercent", "siltPercent", "clayPercent", "electricalConductivity",
        ].some((key) => typeof body[key] === "number");
        if (!hasMeasurement) {
          const response = { success: false, needsMeasurements: true, error: "اطلب من المستخدم قياساً واحداً على الأقل من تحليل التربة قبل إنشاء التقرير. لا تخمّن أي قيمة." };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }
        const result = await apiRequest<any>("/api/soil-analysis/analyze", { method: "POST", body: JSON.stringify(body) });
        const payload = result.data;
        const response = result.error || payload?.success !== true || !payload?.data
          ? {
              success: false,
              error: "تعذّر إنشاء تقرير التربة حالياً. وضّح للمستخدم أن الخدمة غير متاحة أو أن القياسات تحتاج تصحيحاً، ولا تنشئ تقريراً بديلاً.",
              code: payload?.error ?? payload?.code ?? null,
              message: payload?.message ?? result.error ?? null,
              details: payload?.details ?? null,
            }
          : {
              success: true,
              dataSource: payload.dataSource ?? "ai-advisory",
              isRealData: false,
              report: payload.data,
              persistence: payload.persistence ?? { persisted: false },
              provenance: payload.provenance ?? {
                measurements: "user-provided-unverified",
                advisory: "llm-generated",
                mlPrediction: "not-available",
                modelTraining: "not-claimed",
              },
              instruction: "Explain this as an AI-generated advisory based on user-provided measurements, not a lab result or trained ML prediction. Do not add values absent from the report.",
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_my_soil_reports") {
        const requestedLimit = Number(call.args?.limit);
        const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 10) : 5;
        const result = await apiRequest<any>(`/api/soil-analysis/reports?limit=${limit}`, { method: "GET" });
        const payload = result.data;
        const reports = Array.isArray(payload?.data) ? payload.data : [];
        const response = result.error || payload?.success !== true
          ? {
              success: false,
              dataAvailable: false,
              error: "تعذّر تحميل تقارير التربة الخاصة بالمستخدم. قل له إن السجل غير متاح حالياً، وما تخترع حتى تقرير.",
              code: payload?.error ?? null,
              message: payload?.message ?? result.error ?? null,
            }
          : {
              success: true,
              dataAvailable: reports.length > 0,
              reportCount: reports.length,
              reports: reports.map((report: any) => ({
                analysisId: report.analysisId,
                analyzedAt: report.analyzedAt ?? report.createdAt ?? null,
                analysisType: report.analysisType ?? null,
                fieldId: report.fieldId ?? null,
                measurements: report.input && typeof report.input === "object" ? report.input : null,
                executiveSummary: report.executiveSummary ?? null,
              })),
              instruction: reports.length
                ? "These are the authenticated user's saved reports. Distinguish stored measurements from AI-generated summaries. Use only returned fields; do not infer missing results."
                : "No saved soil reports were returned. Tell the user their history is empty; do not invent a previous analysis.",
            };
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "identify_pest_from_symptoms") {
        const args = call.args ?? {};
        const symptoms = Array.isArray(args.symptoms) ? args.symptoms.filter((item: unknown) => typeof item === "string" && item.trim()).map((item: string) => item.trim()).slice(0, 12) : [];
        const cropType = typeof args.crop_type === "string" && args.crop_type.trim() ? args.crop_type.trim().slice(0, 80) : "unknown";
        const result = symptoms.length ? await apiRequest<any>("/api/pest-control/identify-from-symptoms", { method: "POST", body: JSON.stringify({ crop_type: cropType, symptoms }) }) : { data: null, error: "symptoms required" };
        const payload = result.data;
        const response = result.error || payload?.success !== true || !payload?.data
          ? { success: false, dataAvailable: false, needsSymptoms: !symptoms.length, error: "مطابقة أعراض الآفات غير متاحة أو ما لقاتش نتيجة. قول هذا بوضوح وما تخترعش تشخيص.", code: payload?.code ?? null, message: payload?.message ?? result.error ?? null }
          : { success: true, dataSource: payload.dataSource ?? "rule-based", modelSource: payload.modelSource ?? "symptom-keyword-rules", modelKind: payload.modelKind ?? "rule-based", isRealData: false, result: payload.data, confidenceScore: 0, instruction: "Preliminary keyword-rule match only, not confirmed diagnosis or trained image model. State uncertainty. Never recommend pesticide doses." };
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_irrigation_water_requirements") {
        const args = call.args ?? {};
        const crop = typeof args.crop_type === "string" ? args.crop_type.trim() : "";
        const stage = typeof args.growth_stage === "string" ? args.growth_stage.trim() : "";
        const temperature = Number(args.temperature), humidity = Number(args.humidity);
        const days = Number(args.days_to_calculate ?? 7);
        if (!crop || !stage || !Number.isFinite(temperature) || temperature < -10 || temperature > 60 || !Number.isFinite(humidity) || humidity < 0 || humidity > 100 || !Number.isInteger(days) || days < 1 || days > 30) {
          const response = { success: false, needsInputs: true, error: "اطلب نوع المحصول ومرحلة النمو والحرارة والرطوبة الحالية قبل الحساب. ما تستعملش قيماً افتراضية أو مخمّنة." };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }
        const result = await apiRequest<any>("/api/irrigation-optimization/water-requirements", { method: "POST", body: JSON.stringify({ crop_type: crop, growth_stage: stage, temperature, humidity, days_to_calculate: days }) });
        const payload = result.data;
        const response = result.error || payload?.success !== true || payload?.data == null
          ? { success: false, dataAvailable: false, error: "حساب الاحتياجات المائية غير متاح حالياً. ما تعطيش أرقام بديلة.", code: payload?.code ?? null, message: payload?.message ?? result.error ?? null }
          : { success: true, data: payload.data, modelSource: payload.modelSource ?? null, modelKind: payload.modelKind ?? null, heuristic: payload.heuristic ?? null, provenance: payload.provenance ?? null, inputs: { crop_type: crop, growth_stage: stage, temperature, humidity, days_to_calculate: days }, instruction: "Use only returned values; explain provenance and limitations. This is an estimate, not direct soil moisture measurement or guaranteed schedule." };
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "search_marketplace_listings") {
        const args = call.args ?? {};
        const query = typeof args.query === "string" ? args.query.trim().slice(0, 100) : "";
        const tradeType = ["buy", "sell"].includes(args.trade_type) ? args.trade_type : "";
        const listingTypes = ["agricultural_input", "equipment", "agricultural_product", "harvest", "livestock", "other"];
        const listingType = listingTypes.includes(args.listing_type) ? args.listing_type : "";
        const governorate = typeof args.governorate === "string" ? args.governorate.trim().slice(0, 80) : "";
        const limit = Math.min(20, Math.max(1, Number(args.limit) || 10));
        if (!query) {
          const response = { success: false, needsInput: true, error: "حدّد المنتوج أو نوع العرض اللي تحب تلوّج عليه." };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }
        const params = new URLSearchParams({ q: query, limit: String(limit) });
        if (tradeType) params.set("trade_type", tradeType);
        if (listingType) params.set("type", listingType);
        if (governorate) params.set("governorate", governorate);
        const result = await apiRequest<any>(`/api/agro-market/listings?${params.toString()}`, { method: "GET" });
        const payload = result.data;
        const rows = Array.isArray(payload?.data?.listings) ? payload.data.listings : [];
        const listings = rows.slice(0, limit).map((item: any) => ({
          id: item.id,
          title: item.title,
          tradeType: item.trade_type,
          listingType: item.listing_type,
          category: item.category,
          description: item.description ?? null,
          price: item.price ?? null,
          currency: item.currency ?? "TND",
          unit: item.unit ?? null,
          quantity: item.quantity ?? null,
          location: item.location ?? null,
          governorate: item.governorate ?? null,
          sellerName: item.seller_name ?? null,
          sellerVerified: item.seller_verified === true,
          sellerRatingAverage: item.seller_rating_average ?? null,
          sellerReviewCount: item.seller_review_count ?? 0,
          promotion: item.promotion_type ?? null,
          publishedAt: item.created_at ?? null,
          source: "AgroVibe Marketplace published listing"
        }));
        const response = {
          success: !result.error && payload?.success === true,
          isRealData: !result.error && payload?.meta?.isRealData === true,
          query,
          tradeType: tradeType || "both",
          governorate: governorate || null,
          count: listings.length,
          listings,
          source: payload?.meta?.source ?? null,
          updatedAt: payload?.meta?.updatedAt ?? null,
          error: result.error || (payload?.success === false ? payload.code : null),
          instruction: "Only describe returned published listings. Clearly distinguish buy requests from sell offers. State seller verification and ratings only from returned fields; null means unknown, not verified. Include currency, unit, quantity, location and date only when supplied. If count is zero, say no matching published listing was found. This search does not create an inquiry, reserve, buy or publish anything."
        };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "create_marketplace_listing") {
        const args = call.args ?? {};
        const tradeType = ["buy", "sell"].includes(args.trade_type) ? args.trade_type : "";
        const listingTypes = ["agricultural_input", "equipment", "agricultural_product", "harvest", "livestock", "other"];
        const listingType = listingTypes.includes(args.listing_type) ? args.listing_type : "";
        const title = typeof args.title === "string" ? args.title.trim().slice(0, 160) : "";
        const category = typeof args.category === "string" ? args.category.trim().slice(0, 80) : "";
        const price = typeof args.price === "number" ? args.price : Number.NaN;
        const quantity = typeof args.quantity === "number" ? args.quantity : Number.NaN;
        const currency = typeof args.currency === "string" ? args.currency.trim().toUpperCase().slice(0, 3) : "TND";
        const harvestCrop = typeof args.harvest_crop === "string" ? args.harvest_crop.trim().slice(0, 100) : "";
        const harvestDate = typeof args.expected_harvest_date === "string" ? args.expected_harvest_date.trim() : "";
        const validHarvest = listingType !== "harvest" || (Boolean(harvestCrop) && /^\d{4}-\d{2}-\d{2}$/.test(harvestDate));
        const valid = Boolean(tradeType && listingType && title.length >= 3 && category &&
          Number.isFinite(price) && price >= 0 && Number.isFinite(quantity) && quantity >= 0 &&
          /^[A-Z]{3}$/.test(currency) && validHarvest);
        const body = valid ? {
          trade_type: tradeType,
          listing_type: listingType,
          title,
          category,
          description: typeof args.description === "string" ? args.description.trim().slice(0, 3000) : "",
          price,
          currency,
          quantity,
          unit: typeof args.unit === "string" ? args.unit.trim().slice(0, 40) : "",
          location: typeof args.location === "string" ? args.location.trim().slice(0, 160) : "",
          governorate: typeof args.governorate === "string" ? args.governorate.trim().slice(0, 80) : "",
          harvest_crop: harvestCrop || undefined,
          expected_harvest_date: harvestDate || undefined,
          quality_notes: typeof args.quality_notes === "string" ? args.quality_notes.trim().slice(0, 1000) : "",
          image_urls: []
        } : null;
        const result = body
          ? await apiRequest<any>("/api/agro-market/listings", { method: "POST", body: JSON.stringify(body) })
          : { data: null, error: "invalid listing fields" };
        const payload = result.data;
        const created = !result.error && payload?.success === true && Boolean(payload?.data?.id);
        const response = created
          ? {
              success: true,
              created: true,
              listing: {
                id: payload.data.id,
                title: payload.data.title,
                tradeType: payload.data.trade_type,
                listingType: payload.data.listing_type,
                price: payload.data.price,
                currency: payload.data.currency,
                quantity: payload.data.quantity,
                unit: payload.data.unit ?? null,
                governorate: payload.data.governorate ?? null,
                status: payload.data.status
              },
              instruction: "Listing published successfully. Confirm the exact public listing details. Do not claim it is promoted, paid or verified unless separately returned."
            }
          : {
              success: false,
              created: false,
              code: payload?.code ?? null,
              error: result.error ?? payload?.message ?? "تعذّر نشر العرض. يلزم حساب موثّق وبيانات صحيحة، وبعض المنتجات المنظمة عندها مسار خاص.",
              instruction: "Do not claim that the listing was published."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "create_marketplace_inquiry") {
        const args = call.args ?? {};
        const listingId = typeof args.listing_id === "string" ? args.listing_id.trim().slice(0, 100) : "";
        const message = typeof args.message === "string" ? args.message.trim().slice(0, 2000) : "";
        const quantity = args.quantity === undefined || args.quantity === null ? undefined : Number(args.quantity);
        const validQuantity = quantity === undefined || (Number.isFinite(quantity) && quantity > 0);
        if (!listingId || message.length < 5 || !validQuantity) {
          const response = { success: false, created: false, error: "بيانات طلب التواصل ناقصة أو غير صالحة. اطلب من المستخدم توضيح الرسالة والكمية." };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }
        const body: Record<string, unknown> = { message };
        if (quantity !== undefined) body.quantity = quantity;
        const result = await apiRequest<any>(
          `/api/agro-market/listings/${encodeURIComponent(listingId)}/inquiries`,
          { method: "POST", body: JSON.stringify(body) },
        );
        const payload = result.data;
        const created = !result.error && payload?.success === true && Boolean(payload?.data?.id);
        const response = created
          ? {
              success: true,
              created: true,
              inquiry: {
                id: payload.data.id,
                listingId: payload.data.listing_id,
                status: payload.data.status,
                createdAt: payload.data.created_at,
              },
              instruction: "The inquiry was successfully sent. Tell the user it was sent, but clearly say this is only a contact inquiry, not a purchase, payment or reservation."
            }
          : {
              success: false,
              created: false,
              code: payload?.code ?? null,
              error: result.error ?? payload?.message ?? "تعذّر إرسال طلب التواصل. تحقّق من تسجيل الدخول وتوثيق الحساب وحالة العرض.",
              instruction: "Do not claim that an inquiry was sent."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_marketplace_inquiries") {
        const result = await apiRequest<any>("/api/agro-market/inquiries", { method: "GET" });
        const payload = result.data;
        const inquiries = Array.isArray(payload?.data) ? payload.data.slice(0, 100) : [];
        const response = result.error || payload?.success !== true
          ? { success: false, dataAvailable: false, error: result.error ?? payload?.code ?? "INQUIRIES_UNAVAILABLE" }
          : {
              success: true,
              dataAvailable: true,
              count: inquiries.length,
              inquiries: inquiries.map((item: any) => ({
                id: item.id,
                listingId: item.listing_id,
                listingTitle: item.listing?.title ?? item.listing_title ?? null,
                listingPrice: item.listing?.price ?? null,
                currency: item.listing?.currency ?? "TND",
                unit: item.listing?.unit ?? null,
                buyerId: item.buyer_id,
                sellerId: item.seller_id,
                message: item.message,
                quantity: item.quantity ?? null,
                status: item.status,
                createdAt: item.created_at
              })),
              instruction: "Only these inquiries belong to the signed-in user. Use the exact inquiry ID for messages or seller status actions."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_marketplace_inquiry_messages") {
        const inquiryId = typeof call.args?.inquiry_id === "string" ? call.args.inquiry_id.trim().slice(0, 100) : "";
        const result = inquiryId
          ? await apiRequest<any>(`/api/agro-market/inquiries/${encodeURIComponent(inquiryId)}/messages`, { method: "GET" })
          : { data: null, error: "missing inquiry id" };
        const payload = result.data;
        const messages = Array.isArray(payload?.data) ? payload.data.slice(0, 200) : [];
        const response = result.error || payload?.success !== true
          ? { success: false, dataAvailable: false, error: result.error ?? payload?.code ?? "MESSAGES_UNAVAILABLE" }
          : {
              success: true,
              dataAvailable: true,
              inquiryId,
              messages: messages.map((item: any) => ({
                id: item.id,
                senderId: item.sender_id,
                body: item.body,
                createdAt: item.created_at,
                readAt: item.read_at ?? null
              }))
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "send_marketplace_inquiry_message") {
        const inquiryId = typeof call.args?.inquiry_id === "string" ? call.args.inquiry_id.trim().slice(0, 100) : "";
        const body = typeof call.args?.body === "string" ? call.args.body.trim().slice(0, 4000) : "";
        const result = inquiryId && body
          ? await apiRequest<any>(`/api/agro-market/inquiries/${encodeURIComponent(inquiryId)}/messages`, {
              method: "POST",
              body: JSON.stringify({ body })
            })
          : { data: null, error: "invalid inquiry message" };
        const payload = result.data;
        const sent = !result.error && payload?.success === true && Boolean(payload?.data?.id);
        const response = sent
          ? {
              success: true,
              sent: true,
              message: { id: payload.data.id, inquiryId: payload.data.inquiry_id, body: payload.data.body, createdAt: payload.data.created_at },
              instruction: "The exact message was sent to the inquiry participants. Confirm that it was sent."
            }
          : {
              success: false,
              sent: false,
              error: result.error ?? payload?.code ?? "MESSAGE_SEND_FAILED",
              instruction: "Do not claim that the message was sent."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "update_marketplace_inquiry_status") {
        const inquiryId = typeof call.args?.inquiry_id === "string" ? call.args.inquiry_id.trim().slice(0, 100) : "";
        const allowedStatuses = ["replied", "accepted", "rejected", "closed"];
        const status = allowedStatuses.includes(call.args?.status) ? call.args.status : "";
        const result = inquiryId && status
          ? await apiRequest<any>(`/api/agro-market/inquiries/${encodeURIComponent(inquiryId)}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status })
            })
          : { data: null, error: "invalid inquiry status" };
        const payload = result.data;
        const updated = !result.error && payload?.success === true && payload?.data?.status === status;
        const response = updated
          ? { success: true, updated: true, inquiry: { id: payload.data.id, status: payload.data.status } }
          : { success: false, updated: false, error: result.error ?? payload?.code ?? "INQUIRY_UPDATE_FAILED", instruction: "Do not claim that inquiry status changed. Only the seller can update it." };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_marketplace_orders") {
        const result = await apiRequest<any>("/api/agro-market/orders", { method: "GET" });
        const payload = result.data;
        const orders = Array.isArray(payload?.data) ? payload.data.slice(0, 100) : [];
        const response = result.error || payload?.success !== true
          ? { success: false, dataAvailable: false, error: result.error ?? payload?.code ?? "ORDERS_UNAVAILABLE" }
          : {
              success: true,
              dataAvailable: true,
              count: orders.length,
              orders: orders.map((order: any) => ({
                id: order.id,
                inquiryId: order.inquiry_id,
                listingId: order.listing_id,
                listingTitle: order.listing_title,
                quantity: order.quantity,
                unit: order.unit ?? null,
                unitPrice: order.unit_price,
                currency: order.currency,
                status: order.status,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
              })),
              instruction: "These are only the authenticated user's own orders. Explain status exactly. Do not claim payment or delivery unless separately confirmed."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "create_marketplace_order") {
        const args = call.args ?? {};
        const inquiryId = typeof args.inquiry_id === "string" ? args.inquiry_id.trim().slice(0, 100) : "";
        const quantity = args.quantity === undefined || args.quantity === null ? undefined : Number(args.quantity);
        const unitPrice = args.unit_price === undefined || args.unit_price === null ? undefined : Number(args.unit_price);
        const buyerNote = typeof args.buyer_note === "string" ? args.buyer_note.trim().slice(0, 1200) : "";
        const valid = inquiryId &&
          (quantity === undefined || (Number.isFinite(quantity) && quantity > 0)) &&
          (unitPrice === undefined || (Number.isFinite(unitPrice) && unitPrice >= 0));
        const result = valid
          ? await apiRequest<any>(`/api/agro-market/inquiries/${encodeURIComponent(inquiryId)}/order`, {
              method: "POST",
              body: JSON.stringify({
                ...(quantity !== undefined ? { quantity } : {}),
                ...(unitPrice !== undefined ? { unit_price: unitPrice } : {}),
                ...(buyerNote ? { buyer_note: buyerNote } : {})
              })
            })
          : { data: null, error: "invalid order terms" };
        const payload = result.data;
        const created = !result.error && payload?.success === true && Boolean(payload?.data?.id);
        const response = created
          ? {
              success: true,
              created: true,
              order: {
                id: payload.data.id,
                listingTitle: payload.data.listing_title,
                quantity: payload.data.quantity,
                unit: payload.data.unit ?? null,
                unitPrice: payload.data.unit_price,
                currency: payload.data.currency,
                status: payload.data.status
              },
              instruction: "Order proposal created and awaits buyer confirmation. Tell seller this is not paid or completed."
            }
          : {
              success: false,
              created: false,
              code: payload?.code ?? null,
              error: result.error ?? payload?.message ?? "تعذّر إنشاء الطلب. تأكد أن الاستفسار مقبول وأنك البائع صاحب العرض.",
              instruction: "Do not claim an order was created."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "confirm_marketplace_order") {
        const orderId = typeof call.args?.order_id === "string" ? call.args.order_id.trim().slice(0, 100) : "";
        const result = orderId
          ? await apiRequest<any>(`/api/agro-market/orders/${encodeURIComponent(orderId)}/confirm`, { method: "POST", body: JSON.stringify({}) })
          : { data: null, error: "missing order id" };
        const payload = result.data;
        const confirmed = !result.error && payload?.success === true && payload?.data?.status === "confirmed";
        const response = confirmed
          ? {
              success: true,
              confirmed: true,
              order: { id: payload.data.id, listingTitle: payload.data.listing_title, quantity: payload.data.quantity, unit: payload.data.unit ?? null, unitPrice: payload.data.unit_price, currency: payload.data.currency, status: payload.data.status },
              instruction: "Buyer confirmation succeeded. Clearly state that this is order confirmation only, not payment."
            }
          : {
              success: false,
              confirmed: false,
              code: payload?.code ?? null,
              error: result.error ?? payload?.message ?? "تعذّر تأكيد الطلب. ربما لا تملكه كمشترٍ أو لم يعد في انتظار التأكيد.",
              instruction: "Do not claim the order was confirmed."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "update_marketplace_order_status") {
        const args = call.args ?? {};
        const orderId = typeof args.order_id === "string" ? args.order_id.trim().slice(0, 100) : "";
        const allowedStatuses = ["processing", "ready_for_pickup", "completed", "cancelled", "disputed"];
        const status = allowedStatuses.includes(args.status) ? args.status : "";
        const reason = typeof args.reason === "string" ? args.reason.trim().slice(0, 1200) : "";
        if (!orderId || !status || (status === "disputed" && reason.length < 5)) {
          const response = { success: false, updated: false, error: "بيانات تحديث الطلب ناقصة أو غير صالحة؛ سبب النزاع لازم يكون واضحاً." };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }
        const result = await apiRequest<any>(`/api/agro-market/orders/${encodeURIComponent(orderId)}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status, ...(reason ? { reason } : {}) })
        });
        const payload = result.data;
        const updated = !result.error && payload?.success === true && payload?.data?.status === status;
        const response = updated
          ? {
              success: true,
              updated: true,
              order: { id: payload.data.id, listingTitle: payload.data.listing_title, status: payload.data.status, updatedAt: payload.data.updated_at },
              instruction: "Order status updated by the server. Report the exact status only; do not infer payment, dispatch or delivery."
            }
          : {
              success: false,
              updated: false,
              code: payload?.code ?? null,
              error: result.error ?? payload?.message ?? "تعذّر تحديث حالة الطلب. يمكن أن تكون العملية غير مسموحة لدورك أو لحالة الطلب الحالية.",
              instruction: "Do not claim the order status changed."
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_market_prices") {
        const args = call.args ?? {};
        const commodity = typeof args.commodity === "string" ? args.commodity.trim().slice(0, 100) : "";
        const requestedPeriod = Number(args.period);
        const period = [7, 30, 90].includes(requestedPeriod) ? requestedPeriod : 30;
        const listingQuery = new URLSearchParams({ limit: "50" });
        // Fetch a bounded listing page, then match commodity aliases locally.
        // Sending Arabizi (e.g. "tmatem") as a server-side title query missed
        // Arabic/French/English listings for the same crop.
        const commodityAliases: Record<string, string[]> = {
          tomato: ["طماطم", "مطيشة", "tomato", "tomatoes", "tomate", "tmatem", "maticha"],
          // Keep olive fruit and olive oil separate: their market prices are not interchangeable.
          olive_oil: ["زيت الزيتون", "زيت زيتون", "زيت الزيتونة", "olive oil", "huile d olive", "huile olive", "zit zitoun"],
          olive: ["زيتون", "زيتونة", "olive", "olives", "olivier", "zitoun", "zitouna"],
          potato: ["بطاطا", "بطاطس", "pomme de terre", "potato", "potatoes", "batata"],
          pepper: ["فلفل", "فلفلة", "poivron", "piment", "pepper", "felfel"],
          wheat: ["قمح", "قمح صلب", "blé", "ble", "wheat", "9amh"],
          barley: ["شعير", "orge", "barley", "cha3ir"],
          date: ["تمور", "تمر", "دقلة", "dates", "datte", "deglet nour", "tamr"],
          citrus: ["حوامض", "برتقال", "ليمون", "قارس", "agrumes", "orange", "citrus", "limoun"],
          onion: ["بصل", "بصلة", "oignon", "onion", "basal"],
          garlic: ["ثوم", "توم", "ail", "garlic", "thoum"],
          grape: ["عنب", "كرم", "raisin", "raisins", "grape", "grapes", "3neb"],
          almond: ["لوز", "amande", "amandes", "almond", "almonds", "louze"],
          fig: ["تين", "كرموس", "figue", "figues", "fig", "figs", "karmous"],
          pomegranate: ["رمان", "grenade", "pomegranate", "rommen"],
          strawberry: ["فراولة", "فريز", "fraise", "fraisier", "strawberry", "fraise"],
          watermelon: ["دلاع", "بطيخ", "watermelon", "pastèque", "pasteque", "della3"],
          melon: ["شمام", "melon", "cantaloupe", "chammem"],
          carrot: ["جزر", "carotte", "carrot", "زرودية", "zroudia"],
        };
        const normaliseCommodity = (value: unknown) => String(value ?? "")
          .toLocaleLowerCase().normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه")
          .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        const containsCommodityAlias = (value: string, alias: string) =>
          (` ${normaliseCommodity(value)} `).includes(` ${normaliseCommodity(alias)} `);
        const normalizedRequest = normaliseCommodity(commodity);
        const matchedAliasGroup = Object.values(commodityAliases)
          .find((aliases) => aliases.some((alias) => containsCommodityAlias(normalizedRequest, alias)));
        const matchTerms = matchedAliasGroup ?? (commodity ? [commodity] : []);
        if (!commodity) {
          const response = { success: false, needsInput: true, error: "حدّد اسم المنتوج أو المحصول قبل البحث عن الأسعار." };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }
        const [listingResult, ...observationResults] = await Promise.all([
          apiRequest<any>(`/api/agro-market/listings?${listingQuery.toString()}`, { method: "GET" }),
          ...matchTerms.slice(0, 6).map((term) =>
            apiRequest<any>(`/api/agro-market/prices?${new URLSearchParams({ crop: term, limit: "100" }).toString()}`, { method: "GET" }),
          ),
        ]);
        const listingPayload = listingResult.data;
        const allListings = Array.isArray(listingPayload?.data?.listings) ? listingPayload.data.listings : [];
        const productListings = allListings
          .filter((item: any) => {
            const searchable = normaliseCommodity([item.title, item.harvest_crop, item.category].filter(Boolean).join(" "));
            const commodityMatches = matchTerms.some((term) => containsCommodityAlias(searchable, term));
            return ["agricultural_product", "harvest"].includes(item.listing_type) &&
              item.price !== null && item.price !== undefined &&
              Number.isFinite(Number(item.price)) && commodityMatches;
          })
          .slice(0, 15)
          .map((item: any) => ({
            title: item.title,
            price: Number(item.price),
            currency: item.currency ?? "TND",
            unit: item.unit ?? null,
            quantity: item.quantity ?? null,
            location: item.location ?? null,
            governorate: item.governorate ?? null,
            seller: item.seller_name ?? null,
            listingType: item.listing_type,
            publishedAt: item.created_at ?? null,
            source: "AgroGrowth Marketplace seller listing",
          }));
        const rawObservations = observationResults.flatMap((result: any) =>
          !result.error && result.data?.success === true && Array.isArray(result.data?.data)
            ? result.data.data
            : [],
        );
        const seenObservationIds = new Set<string>();
        const recordedMarketObservations = rawObservations.filter((item: any) => {
          const searchable = normaliseCommodity(item.commodity_name);
          const commodityMatches = matchTerms.some((term) => searchable.includes(normaliseCommodity(term)));
          const observedAt = Date.parse(String(item.observed_on ?? ""));
          const withinPeriod = Number.isFinite(observedAt) && observedAt >= Date.now() - period * 24 * 60 * 60 * 1000;
          if (!commodityMatches || !withinPeriod) return false;
          const key = String(item.id ?? JSON.stringify(item));
          if (seenObservationIds.has(key)) return false;
          seenObservationIds.add(key);
          return true;
        }).slice(0, 30);
        const hasObservationData = recordedMarketObservations.length > 0;
        const observationErrors = observationResults
          .filter((result: any) => result.error || result.data?.success === false)
          .map((result: any) => result.data?.code ?? result.error)
          .filter(Boolean);
        const response = {
          success: productListings.length > 0 || hasObservationData,
          isRealData: productListings.length > 0 || hasObservationData,
          commodity,
          marketplaceOffers: productListings,
          marketplaceOffersCount: productListings.length,
          marketplaceSource: listingPayload?.meta?.provenance ?? "seller-published-listings",
          recordedMarketObservations: hasObservationData ? recordedMarketObservations : [],
          marketObservationSource: hasObservationData ? "market-price-observations" : null,
          periodDays: period,
          dataAvailable: productListings.length > 0 || hasObservationData,
          marketplaceError: listingResult.error ?? (listingPayload?.success === false ? listingPayload.code : null),
          observationError: hasObservationData ? null : (observationErrors[0] ?? "NO_MATCHING_COMMODITY_OBSERVATIONS"),
          instruction: "Only report observations whose commodity_name matches the requested commodity. Seller asking prices and recorded observations are separate sources. State currency, unit, market location, observed_on date and source only when supplied. Never mix other crops or infer a current price from an old observation. If neither source has a matching numeric price, say no matching prices were found; never guess.",
        };
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
          toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] },
        }));
        continue;
      }

      if (call.name === "consult_agrogrowth_platform") {
        const args = call.args ?? {};
        const question = typeof args.question === "string" ? args.question.trim().slice(0, 2000) : "";
        const language = ["ar", "fr", "en"].includes(args.language) ? args.language : "ar";
        if (!question) {
          const response = { success: false, error: "اسأل المستخدم عن السؤال أو التفاصيل المطلوبة قبل استدعاء مستشار المنصة." };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }

        const result = await apiRequest<any>("/api/ai/assistant/chat", {
          method: "POST",
          timeoutMs: 90_000,
          body: JSON.stringify({
            message: question,
            language,
            history: this.platformConversationHistory.slice(-8),
            conversationId: this.platformConversationId ?? undefined,
          }),
        });
        const payload = result.data;
        const answer = typeof payload?.answer === "string" ? payload.answer : "";
        if (result.error || !answer) {
          const response = {
            success: false,
            dataAvailable: false,
            error: "تعذّر على مستشار AgroGrowth إكمال الإجابة من بيانات المنصة حالياً. وضّح للمستخدم أن الخدمة غير متاحة، وما تعوّضش النتيجة بالتخمين.",
            code: payload?.code ?? null,
          };
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
          continue;
        }

        if (typeof payload.conversationId === "string") this.platformConversationId = payload.conversationId;
        const updatedHistory: Array<{ role: "user" | "assistant"; content: string }> = [
          ...this.platformConversationHistory,
          { role: "user" as const, content: String(question) },
          { role: "assistant" as const, content: String(answer).slice(0, 4000) },
        ].slice(-8);
        this.platformConversationHistory = updatedHistory;
        const traceSteps = Array.isArray(payload.orchestrationTrace?.steps)
          ? payload.orchestrationTrace.steps.slice(0, 12).map((step: any) => ({
              specialist: step.id,
              status: step.status,
              dataSource: step.dataSource ?? null,
              isRealData: step.isRealData === true,
              findings: Array.isArray(step.findings) ? step.findings.slice(0, 3) : [],
            }))
          : [];
        const hasVerifiedAccountContext = payload.farmContextStatus === "linked" || payload.farmContextStatus === "no_farms";
        const response = {
          success: true,
          answer: answer.slice(0, 7000),
          note: typeof payload.note === "string" ? payload.note.slice(0, 700) : null,
          provenance: {
            dataSource: payload.dataSource ?? null,
            modelSource: payload.modelSource ?? null,
            farmContextStatus: payload.farmContextStatus ?? "unreported",
            plannedBy: payload.plannedBy ?? null,
            usedSpecialists: Array.isArray(payload.usedSpecialists) ? payload.usedSpecialists.slice(0, 12) : [],
            trainedModelSpecialists: Array.isArray(payload.trainedModelSpecialists) ? payload.trainedModelSpecialists.slice(0, 12) : [],
            orchestration: traceSteps,
          },
          instruction: hasVerifiedAccountContext
            ? "This answer was generated by AgroGrowth's multi-agent assistant with verified caller-scoped account context. Speak it naturally and preserve uncertainty and provenance. The assistant chat itself may be saved to conversation history, but this endpoint does not modify farm or marketplace operational records. Do not claim that any farm, marketplace, finance, task, or account action was performed."
            : "This is a general assistant answer without verified account data. Never present it as a fact about the user's account. Speak naturally and preserve uncertainty. The assistant chat itself may be saved to conversation history, but this endpoint does not modify operational records. Do not claim that any farm, marketplace, finance, task, or account action was performed.",
        };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } }));
        continue;
      }

      if (call.name === "get_news") {
        const args = call.args ?? {};
        const language = ["ar", "fr", "en"].includes(args.language) ? args.language : "ar";
        const query = new URLSearchParams({
          language,
          page: "1",
          pageSize: "5",
          agricultureOnly: "true",
        });
        if (typeof args.category === "string" && args.category.trim()) query.set("category", args.category.trim());
        if (typeof args.query === "string" && args.query.trim()) query.set("q", args.query.trim());

        const result = await apiRequest<any>(`/api/news?${query.toString()}`, { method: "GET" });
        const news = result.data;
        const articles = Array.isArray(news?.articles) ? news.articles : [];
        const response = result.error || news?.isRealData !== true || news?.dataSource !== "rss-feeds" || articles.length === 0
          ? {
              success: false,
              isRealData: false,
              error: "تعذّر جلب أخبار فلاحية موثوقة حالياً. قل للمستخدم إن خدمة الأخبار غير متاحة، وما تخترع حتى خبر.",
              availableSources: Array.isArray(news?.sources) ? news.sources.filter((source: any) => source.available).map((source: any) => source.name) : [],
            }
          : {
              success: true,
              isRealData: true,
              dataSource: news.dataSource,
              generatedAt: news.generatedAt ?? null,
              totalMatchingArticles: news.total ?? articles.length,
              articles: articles.slice(0, 5).map((article: any) => ({
                title: article.title,
                summary: typeof article.summary === "string" ? article.summary.slice(0, 450) : "",
                publisher: article.sourceName,
                publishedAt: article.publishedAt ?? null,
                category: article.categories?.[0] ?? "agriculture",
                originalArticleUrl: article.link,
              })),
              unavailableSources: Array.isArray(news.sources) ? news.sources.filter((source: any) => !source.available).map((source: any) => source.name) : [],
            };

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
          toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] },
        }));
        continue;
      }

      if (call.name === "get_ai_services_status") {
        const [result, newsResult, weatherResult] = await Promise.all([
          apiRequest<any>("/api/ai/health?force=true", { method: "GET" }),
          apiRequest<any>("/api/news/sources", { method: "GET" }),
          // A real provider request used only as a connectivity probe; values are not reported as the user's weather.
          apiRequest<any>("/api/weather/location?governorate=Monastir", { method: "GET" }),
        ]);
        const health = result.data;
        const services = Array.isArray(health?.services) ? health.services : [];
        const newsSources = Array.isArray(newsResult.data?.sources) ? newsResult.data.sources : [];
        const weather = weatherResult.data;
        const response = !health?.overview
          ? {
              success: false,
              dataAvailable: false,
              error: "تعذّر فحص خدمات AgroGrowth حالياً. ما تعطيش حالة من الذاكرة أو بالتخمين.",
              integrations: {
                news: { status: newsResult.error ? "unavailable" : "available", sources: newsSources },
                weather: { status: weatherResult.error || !weather?.current ? "unavailable" : "available", probeLocation: "Monastir" },
              },
            }
          : {
              success: true,
              checkedAt: health?.overview?.lastUpdated ?? new Date().toISOString(),
              overview: health?.overview ?? null,
              services: services.map((service: any) => ({
                name: service.nameAr ?? service.name ?? service.key,
                status: service.status,
                modelKind: service.modelKind ?? null,
                isRealModel: service.isRealModel ?? null,
                responseTimeMs: service.responseTime ?? null,
                error: service.error ?? null,
              })),
              integrations: {
                news: {
                  status: newsResult.error ? "unavailable" : newsSources.some((source: any) => source.available) ? "available" : "degraded",
                  availableSources: newsSources.filter((source: any) => source.available).map((source: any) => ({ name: source.name, language: source.language, itemCount: source.itemCount })),
                  unavailableSources: newsSources.filter((source: any) => !source.available).map((source: any) => ({ name: source.name, error: source.error ?? null })),
                },
                weather: {
                  status: weatherResult.error || !weather?.current ? "unavailable" : "available",
                  provider: weather?.source?.provider ?? null,
                  probeLocation: "Monastir",
                  error: weatherResult.error ?? weather?.message ?? null,
                },
              },
              llm: health?.llm ?? null,
              instruction: "This is a live health snapshot. Explain each status accurately: available means /health responded, not that output quality is validated; rate_limited means host responded but service health is unverified; unavailable/not_configured means do not claim the capability works. Rule-based is not trained ML. News status is based on real RSS feed probes. Weather status is a real connectivity request for Monastir only, not the user's local forecast. Never expose service URLs or secrets.",
            };
        if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({
          toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] },
        }));
        continue;
      }

      if (call.name !== "get_weather") {
        this.socket?.send(JSON.stringify({
          toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: { success: false, error: "الأداة المطلوبة موش متوفرة." } }] },
        }));
        continue;
      }

      const args = call.args ?? {};
      const governorate = typeof args.governorate === "string" ? args.governorate.trim() : "";
      const city = typeof args.city === "string" ? args.city.trim() : "";
      if (!governorate) {
        this.socket?.send(JSON.stringify({
          toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: { success: false, needsLocation: true, error: "اسأل المستخدم على الولاية قبل جلب الطقس." } }] },
        }));
        continue;
      }

      const query = new URLSearchParams({ governorate });
      if (city) query.set("city", city);
      const result = await apiRequest<any>(`/api/weather/location?${query.toString()}`, { method: "GET" });
      const weather = result.data;
      const response = result.error || !weather?.current
        ? { success: false, error: "تعذّر جلب بيانات الطقس الحقيقية حالياً. وضّح للمستخدم أن الخدمة غير متاحة ولا تخمّن الطقس." }
        : {
            success: true,
            dataSource: weather.source?.provider ?? "WeatherAPI.com",
            observationTime: weather.source?.observationTime ?? null,
            isRealData: weather.source?.isRealData === true,
            location: weather.location?.name ?? (city || governorate),
            current: {
              temperatureC: weather.current.temperature,
              humidityPercent: weather.current.humidity,
              windSpeedKmh: weather.current.windSpeed,
              pressureHpa: weather.current.pressure,
              description: weather.current.description,
            },
            forecast: (weather.forecast?.daily ?? []).slice(0, 3).map((day: any) => ({
              date: day.date,
              minTempC: day.minTemp,
              maxTempC: day.maxTemp,
              rainfallMm: day.rainfall,
              humidityPercent: day.humidity,
              description: day.description,
            })),
          };

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
      this.socket.send(JSON.stringify({
        toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] },
      }));
    }
  }

  private enqueueAudio(base64Audio: string): void {
    const replyId = this.lastReplyId;
    this.decodeChain = this.decodeChain.then(async () => {
      if (!this.audioContext || !this.playbackQueue || replyId !== this.lastReplyId) return;
      const buffer = await this.audioContext.decodePCMInBase64(base64Audio, OUTPUT_RATE, 1);
      if (replyId === this.lastReplyId) {
        this.playbackQueue.enqueueBuffer(buffer);
        if (!this.queueStarted) {
          this.playbackQueue.start();
          this.queueStarted = true;
        }
      }
    }).catch((error) => {
      this.callbacks.onError?.(error instanceof Error ? error.message : "تعذّر تشغيل الرد الصوتي.");
    });
  }

  async stop(finalState: "ended" | "error" = "ended"): Promise<void> {
    this.stopped = true;
    this.active = false;
    this.socketReady = false;
    this.speechActive = false;
    this.silenceMs = 0;
    this.speechCandidateMs = 0;
    this.lastReplyId += 1;
    this.recorder?.clearOnAudioReady();
    if (this.recorder?.isRecording()) await this.recorder.stop().catch(() => undefined);
    this.recorder = null;
    this.socket?.close(1000, "User ended voice session");
    this.socket = null;
    this.playbackQueue?.clearBuffers();
    this.playbackQueue = null;
    this.queueStarted = false;
    if (this.audioContext) await this.audioContext.close().catch(() => undefined);
    this.audioContext = null;
    this.apiToken = null;
    this.websocketUrl = null;
    this.model = null;
    this.sessionHandle = null;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    await AudioManager.setAudioSessionActivity(false).catch(() => undefined);
    this.callbacks.onState(finalState);
  }
}
