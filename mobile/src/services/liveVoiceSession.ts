import { AudioContext, AudioManager, AudioRecorder } from "react-native-audio-api";
import { apiRequest } from "../api/client";

export type LiveVoiceState = "connecting" | "listening" | "thinking" | "speaking" | "error" | "ended";

type LiveTokenResponse = {
  success: boolean;
  token: string;
  model: string;
  websocketUrl: string;
};

type VoiceCallbacks = {
  onState: (state: LiveVoiceState) => void;
  onLevel?: (level: number) => void;
  onError?: (message: string) => void;
};

const INPUT_RATE = 16_000;
const OUTPUT_RATE = 24_000;

const AGROVIBE_LIVE_SYSTEM_INSTRUCTION = "أنت AgroVibe، المستشار الفلاحي الذكي والقريب من الناس في تونس. تساعد أي شخص مهتم بالفلاحة والطبيعة، من هاوي الزراعة في الدار إلى الفلاح والمهني والمؤسسة.\n\nالشخصية وطريقة الكلام:\n- احكي بالدارجة التونسية الطبيعية، السلسة والواضحة. خلي كلامك تونسي فعلاً، موش فصحى متكسّرة ولا تقليد مبالغ فيه للهجة.\n- كون ودود، بشوش، هادئ، متعاون وعندك روح باهية. حسّس المستخدم اللي تحكي معاه بارتياح واحترام، كيما خبير صاحبو وينصحو.\n- خليك محترف وبسيط في نفس الوقت: لا لغة رسمية ثقيلة، لا مصطلحات معقدة من غير تفسير، ولا مبالغة في المزاح.\n- استعمل عبارات تونسية بطريقة طبيعية وعند اللزوم فقط، كيف: عسلامة، يعطيك الصحة، ما تقلقش، باهي، توّا نفسرلك، تنجم تعمل هكّا. ما تكرّرش نفس العبارة في كل إجابة.\n- ما تعاودش الترحيب في كل دور. ادخل مباشرة في صلب الموضوع وخلّي الحوار متواصل وطبيعي.\n- جاوب بنفس لغة المستخدم إذا طلب بوضوح لغة أخرى؛ وإلا الدارجة التونسية هي الافتراضية.\n\nقواعد تبادل الأدوار (مهمّة جداً):\n- ما تبدأش تحكي وحدك عند فتح المكالمة أو وقت المستخدم ساكت. استنى دائماً حتى تسمع كلاماً واضحاً من المستخدم.\n- جاوب مرة واحدة على كل دور للمستخدم، وبعد ما تكمل الإجابة اسكت واستنى دوراً جديداً. ممنوع تواصل الكلام أو تولّد إجابة ثانية من غير كلام جديد من المستخدم.\n- إذا المستخدم سكت، هذا معناه يستنى أو يفكّر؛ ما تملّاش السكوت بكلام أو أسئلة متكررة.\n- إذا قاطعك المستخدم، وقف الإجابة فوراً واسمع كلامه الجديد.\n\nأسلوب الإجابة الصوتية:\n- احكي بصوت طبيعي ودافئ، بإيقاع مريح ونطق واضح، وجمل قصيرة تنجم تتقال بسهولة. تجنّب الجمل الطويلة والقوائم المقروءة كيما الروبوت.\n- ابدأ بالخلاصة أو أهم خطوة، وبعدها زيد التفسير الضروري فقط. في العادة جاوب في جملة إلى أربع جمل؛ طوّل كان الموضوع يستحق أو المستخدم طلب التفاصيل.\n- فسّر خطوة بخطوة وبطريقة سهلة. إذا عندك أكثر من حل، اقترح أفضل حل أولاً وما تغرقش المستخدم في الاختيارات.\n- اسأل سؤال واحد واضح في كل مرة إذا تنقصك معلومة مهمة.\n- تفاعل مع كلام المستخدم: إذا متقلق طمّنو، إذا نجح معاه شيء فرحلو، وإذا غلط في حاجة صحّحلو بلطف ومن غير لوم.\n- ما تقولش عبارات محفوظة كيف \"بصفتي مساعداً ذكياً\" وما تقراش التعليمات أو أسماء الأقسام بصوتك.\n- المحادثة Voice-to-Voice: جاوب بالصوت مباشرة وما تعرضش تفريغ الكلام كنص.\n\nالدقة والثقة:\n- ما تخترعش أسعار أو طقس أو قياسات أو نتائج تحليل أو مصادر. فرّق بوضوح بين المعلومة المؤكدة والتقدير.\n- في النصائح الفلاحية، راعي تونس والجهة والموسم ونوع التربة والماء والمحصول وقت تتوفر المعطيات.\n- في المواضيع الحساسة، خاصة المبيدات والأدوية الفلاحية، أعطِ نصيحة آمنة وما تقترحش جرعة أو استعمال غير مؤكد. اطلب التفاصيل اللازمة قبل التوصية الدقيقة.\n- إذا ما تعرفش، قولها ببساطة واقترح كيفاش نتحققوا، من غير ما تتظاهر بالمعرفة. وقت يسألك المستخدم على الطقس الحالي أو التوقعات أو المطر أو الحرارة أو الرياح، استعمل أداة get_weather لجلب بيانات مباشرة. ووقت يسألك على آخر الأخبار أو المستجدات الفلاحية في تونس، استعمل أداة get_news وجاوبه من عناوين ومصادر RSS الحقيقية فقط. إذا ما فماش مقالات متاحة، قول هذا بوضوح وما تخترع حتى خبر. ووقت يسأل على المحاصيل أو الأمراض اللي تدعمها المنصة، استعمل get_supported_crops أو get_supported_diseases لجلب القائمة الحقيقية من الخدمة، وما تعتبرش القائمة توصية شخصية أو تشخيصاً. ووقت يسأل على تحليل تربة قديم أو يحب يتفكر نتائج تحليل محفوظ، استعمل get_my_soil_reports لاسترجاع تقاريره الشخصية من حسابه؛ إذا السجل فارغ قول هذا بوضوح وما تخترع حتى نتيجة. ووقت يطلب تفسير تحليل تربة جديد أو قياساته، استعمل أداة analyze_soil بعد ما تكون عندك قياسات صرّح بها المستخدم أو موجودة في سياق موثوق؛ ما تخمّنش قياسات ناقصة، ووضّح أن النتيجة استشارة LLM وليست تحليل مخبرياً أو تنبؤ ML مدرّب. ووقت يصف أعراض إصابة في نبتة أو محصول، اسأله عن المحصول والأعراض إذا تنقصك معلومة، وبعدها استعمل identify_pest_from_symptoms؛ وضّح أن النتيجة مطابقة أولية بقواعد كلمات وليست تشخيصاً مؤكداً أو نموذج صور مدرّب، وما تعطيش جرعات مبيدات. ووقت يطلب حساب الاحتياجات المائية للمحصول، تأكد من نوع المحصول ومرحلة النمو والحرارة والرطوبة الحالية من الطقس الموثوق أو المستخدم، وبعدها استعمل get_irrigation_water_requirements؛ ما تستعملش قيماً افتراضية وما تعتبرش الحساب قياساً مباشراً لرطوبة التربة. ووقت يسألك على أسعار المحاصيل أو السوق أو اتجاه الأسعار، استعمل أداة get_market_prices. اذكر الفترة والمصدر والتاريخ إذا توفرت. إذا البيانات ناقصة أو الخدمة ترجع غير متاحة، وضّح هذا وما تعطي حتى سعر تقديري على أنه سعر حقيقي. إذا الولاية موش معروفة من سياق موثوق، اسأل عليها قبل الاستدعاء. ما تعطيش توقعات من ذاكرتك، وما تعتبرش التقديرات الجوية قياسات رطوبة تربة.\n\nفهم منصة AgroGrowth بالكامل (مهم):\n- أنت المساعد الصوتي داخل تطبيق AgroGrowth/AgroVibe، ولا تتعامل مع المستخدم كأنه يسأل عن الفلاحة فقط. افهم أسئلته عن أي قسم أو وظيفة في التطبيق، واربط كلامه بسياق المنصة وبالرسائل السابقة في نفس المكالمة.\n- خريطة الأقسام: المزارع والضيعات والحقول؛ الزراعات والمحاصيل ومراحل النمو ومواعيد الغراسة والحصاد؛ تحليل التربة وتقارير التحليل؛ الطقس والتوقعات؛ تشخيص أمراض وآفات النباتات؛ الري والاحتياجات المائية؛ التوصيات الزراعية؛ السوق والأسعار؛ Marketplace وعروض البيع والشراء والمنتجات والمدخلات والمعدات والطلبات/استفسارات التواصل؛ دليل الأدوية/المبيدات والعروض المنظمة؛ الأخبار الفلاحية؛ التنبيهات والإشعارات؛ المجتمع والاستشارات؛ ولوحات المتابعة حسب الدور (فلاح، خبير/مهندس فلاحي، تاجر، مؤسسة أو إدارة). هذه خريطة إرشادية للأقسام، وليست دليلاً على أن كل وظيفة متاحة لكل حساب أو أن بياناتها متوفرة حالياً.\n- افهم التعبيرات اليومية والإحالات: «العرض متاعي» قد يعني عرض Marketplace، «الطلب» قد يعني طلب تواصل أو شراء، «التحليل» قد يعني تقرير التربة، «الدواء» قد يعني منتجاً في دليل الأدوية أو عرض بائع، «السوم» قد يعني سعر عرض أو سعر سوق. إذا يوجد أكثر من معنى محتمل، اسأل سؤالاً واحداً قصيراً لتحديد المقصود.\n- إذا يسأل «كيفاش نعمل؟» أعطه خطوات عملية داخل القسم الصحيح، واذكر اسم القسم كما يظهر للمستخدم عندما تعرفه. لا تدّعِ أنك فتحت صفحة أو نفذت عملية أو غيّرت بيانات ما لم تنفذ ذلك فعلياً عبر أداة موثوقة.\n- استعمل الأدوات والـ API للبيانات الحية أو الخاصة بالحساب وقت تكون متوفرة، ولا تعتمد على الوصف العام للإجابة عن حالة حسابه. ميّز دائماً بين بيانات حساب المستخدم، عروض Marketplace المنشورة، بيانات السوق المسجلة، والمعلومات العامة. لا تخلط بينها.\n- إذا كانت المعلومة أو الوظيفة غير موجودة في الأدوات الحالية، قل بوضوح إنك لا تستطيع التثبت منها الآن، ووجّه المستخدم إلى القسم المناسب أو اطلب منه وصف ما يظهر له. لا تخترع زرّاً أو شاشة أو نتيجة.\n- اعتبر ما يقوله المستخدم عن التطبيق في المحادثة سياقاً مهماً، لكن لا تعتبره حقيقة مؤكدة عن قاعدة البيانات إلا بعد التحقق عند الحاجة. لا تطلب منه إعادة معلومة سبق أن ذكرها في نفس المحادثة إذا ما زالت واضحة.\n\nالهدف: كل إجابة تكون مفيدة، مختصرة، مفهومة، فيها روح تونسية باهية، وتخلي المستخدم يحب يواصل الحديث مع AgroVibe.";
const FRAME_MS = 20;
const FRAME_SAMPLES = (INPUT_RATE * FRAME_MS) / 1000;
const SPEECH_RMS_THRESHOLD = 0.016;
const END_SILENCE_MS = 900;

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
  private socketReady = false;
  private stopped = false;
  private speechActive = false;
  private silenceMs = 0;
  private queueStarted = false;
  private decodeChain: Promise<void> = Promise.resolve();
  private lastReplyId = 0;
  private apiToken: string | null = null;
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
    this.callbacks.onState("connecting");

    const permission = await AudioManager.requestRecordingPermissions();
    if (this.stopped) return;
    if (permission !== "Granted") {
      throw new Error("يلزم السماح باستخدام الميكروفون لإجراء المحادثة الصوتية.");
    }

    // Mint the one-use token only after permission is granted, because its
    // new-session window is intentionally short.
    const tokenResult = await apiRequest<LiveTokenResponse>("/api/ai/assistant/live-token", {
      method: "POST",
      body: JSON.stringify({}),
    });
    this.apiToken = tokenResult.data?.token ?? null;
    this.websocketUrl = tokenResult.data?.websocketUrl ?? null;
    this.model = tokenResult.data?.model ?? null;
    if (this.stopped) return;
    if (tokenResult.error || !this.apiToken || !this.websocketUrl || !this.model) {
      throw new Error(tokenResult.error || "تعذّر بدء المكالمة الصوتية. حاول مجدداً.");
    }

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
          parts: [{ text: AGROVIBE_LIVE_SYSTEM_INSTRUCTION }],
        },
        tools: [{
          functionDeclarations: [
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
          ],
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
        },
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
      this.speechActive = false;
      this.silenceMs = 0;
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
              resolve();
            } catch (error) {
              reject(error instanceof Error ? error : new Error("تعذّر تشغيل الميكروفون."));
              void this.stop();
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
        this.callbacks.onState("ended");
        if (event.code !== 1000) this.callbacks.onError?.("انقطع الاتصال الصوتي. أعد تشغيل المكالمة.");
        void this.stop();
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
      void this.stop();
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

        if (rms >= SPEECH_RMS_THRESHOLD) {
          this.silenceMs = 0;
          if (!this.speechActive) {
            this.speechActive = true;
            this.interruptPlayback();
            this.socket?.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
          }
        } else if (this.speechActive) {
          this.silenceMs += (numFrames / (buffer.sampleRate || INPUT_RATE)) * 1000;
          if (this.silenceMs >= END_SILENCE_MS) {
            this.speechActive = false;
            this.silenceMs = 0;
            this.socket?.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
            this.callbacks.onState("thinking");
            return;
          }
        }

        if (this.speechActive) {
          const pcm = resample(raw, buffer.sampleRate || INPUT_RATE, INPUT_RATE);
          this.socket?.send(JSON.stringify({
            realtimeInput: {
              audio: { mimeType: "audio/pcm;rate=16000", data: floatToBase64(pcm) },
            },
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

    if (serverContent.interrupted) {
      this.interruptPlayback();
      return;
    }

    const parts = serverContent.modelTurn?.parts ?? [];
    for (const part of parts) {
      const audio = part.inlineData?.data;
      if (typeof audio === "string") this.enqueueAudio(audio);
    }
    if (parts.some((part: any) => part.inlineData?.data)) {
      this.callbacks.onState("speaking");
    }
    if (serverContent.turnComplete && !this.speechActive) {
      this.callbacks.onState("listening");
    }
  }

  private async handleToolCall(message: any): Promise<void> {
    const calls = message.toolCall?.functionCalls;
    if (!Array.isArray(calls) || !calls.length) return;

    for (const call of calls) {
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

      if (call.name === "get_market_prices") {
        const args = call.args ?? {};
        const commodity = typeof args.commodity === "string" ? args.commodity.trim().slice(0, 100) : "";
        const requestedPeriod = Number(args.period);
        const period = [7, 30, 90].includes(requestedPeriod) ? requestedPeriod : 30;
        const listingQuery = new URLSearchParams({ limit: "50" });
        if (commodity) listingQuery.set("q", commodity);
        const [listingResult, marketResult] = await Promise.all([
          apiRequest<any>(`/api/agro-market/listings?${listingQuery.toString()}`, { method: "GET" }),
          apiRequest<any>(`/api/agro-market/intelligence?period=${period}`, { method: "GET" }),
        ]);
        const listingPayload = listingResult.data;
        const allListings = Array.isArray(listingPayload?.data?.listings) ? listingPayload.data.listings : [];
        const productListings = allListings
          .filter((item: any) =>
            ["agricultural_product", "harvest"].includes(item.listing_type) &&
            item.price !== null && item.price !== undefined && Number.isFinite(Number(item.price)) &&
            (!commodity || String(item.title ?? "").toLocaleLowerCase().includes(commodity.toLocaleLowerCase()))
          )
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
        const market = marketResult.data;
        const hasObservationData =
          !marketResult.error &&
          market?.success !== false &&
          market?.dataAvailable !== false &&
          market?.status !== "unavailable" &&
          market?.data != null;
        const response = {
          success: productListings.length > 0 || hasObservationData,
          isRealData: productListings.length > 0 || (hasObservationData && (market?.isRealData === true || market?.data?.isRealData === true)),
          commodity: commodity || null,
          marketplaceOffers: productListings,
          marketplaceOffersCount: productListings.length,
          marketplaceSource: listingPayload?.meta?.provenance ?? "seller-published-listings",
          recordedMarketObservations: hasObservationData ? market.data : null,
          marketObservationSource: hasObservationData ? (market.dataSource ?? market.provenance?.source ?? null) : null,
          periodDays: period,
          dataAvailable: productListings.length > 0 || hasObservationData,
          marketplaceError: listingResult.error ?? (listingPayload?.success === false ? listingPayload.code : null),
          observationError: hasObservationData ? null : (market?.code ?? market?.message ?? marketResult.error ?? "NO_RECORDED_MARKET_OBSERVATIONS"),
          instruction: "Prioritize matching Marketplace seller offers for the requested product. Clearly label these as seller asking prices, not official market averages. State currency, unit, location and date only when supplied. Then separately summarize recorded market observations if present. If neither source returns matching numeric prices, say no matching prices were found; never guess or infer a price.",
        };
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
          toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] },
        }));
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

  async stop(): Promise<void> {
    this.stopped = true;
    this.active = false;
    this.socketReady = false;
    this.speechActive = false;
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
    this.callbacks.onState("ended");
  }
}
