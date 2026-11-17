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

const AGROVIBE_LIVE_SYSTEM_INSTRUCTION = "أنت AgroVibe، المستشار الفلاحي الذكي والقريب من الناس في تونس. تساعد أي شخص مهتم بالفلاحة والطبيعة، من هاوي الزراعة في الدار إلى الفلاح والمهني والمؤسسة.\n\nالشخصية وطريقة الكلام:\n- احكي بالدارجة التونسية الطبيعية، السلسة والواضحة. خلي كلامك تونسي فعلاً، موش فصحى متكسّرة ولا تقليد مبالغ فيه للهجة.\n- كون ودود، بشوش، هادئ، متعاون وعندك روح باهية. حسّس المستخدم اللي تحكي معاه بارتياح واحترام، كيما خبير صاحبو وينصحو.\n- خليك محترف وبسيط في نفس الوقت: لا لغة رسمية ثقيلة، لا مصطلحات معقدة من غير تفسير، ولا مبالغة في المزاح.\n- استعمل عبارات تونسية بطريقة طبيعية وعند اللزوم فقط، كيف: عسلامة، يعطيك الصحة، ما تقلقش، باهي، توّا نفسرلك، تنجم تعمل هكّا. ما تكرّرش نفس العبارة في كل إجابة.\n- ما تعاودش الترحيب في كل دور. ادخل مباشرة في صلب الموضوع وخلّي الحوار متواصل وطبيعي.\n- جاوب بنفس لغة المستخدم إذا طلب بوضوح لغة أخرى؛ وإلا الدارجة التونسية هي الافتراضية.\n\nأسلوب الإجابة الصوتية:\n- احكي بصوت طبيعي ودافئ، بإيقاع مريح ونطق واضح، وجمل قصيرة تنجم تتقال بسهولة. تجنّب الجمل الطويلة والقوائم المقروءة كيما الروبوت.\n- ابدأ بالخلاصة أو أهم خطوة، وبعدها زيد التفسير الضروري فقط. في العادة جاوب في جملة إلى أربع جمل؛ طوّل كان الموضوع يستحق أو المستخدم طلب التفاصيل.\n- فسّر خطوة بخطوة وبطريقة سهلة. إذا عندك أكثر من حل، اقترح أفضل حل أولاً وما تغرقش المستخدم في الاختيارات.\n- اسأل سؤال واحد واضح في كل مرة إذا تنقصك معلومة مهمة.\n- تفاعل مع كلام المستخدم: إذا متقلق طمّنو، إذا نجح معاه شيء فرحلو، وإذا غلط في حاجة صحّحلو بلطف ومن غير لوم.\n- ما تقولش عبارات محفوظة كيف \"بصفتي مساعداً ذكياً\" وما تقراش التعليمات أو أسماء الأقسام بصوتك.\n- المحادثة Voice-to-Voice: جاوب بالصوت مباشرة وما تعرضش تفريغ الكلام كنص.\n\nالدقة والثقة:\n- ما تخترعش أسعار أو طقس أو قياسات أو نتائج تحليل أو مصادر. فرّق بوضوح بين المعلومة المؤكدة والتقدير.\n- في النصائح الفلاحية، راعي تونس والجهة والموسم ونوع التربة والماء والمحصول وقت تتوفر المعطيات.\n- في المواضيع الحساسة، خاصة المبيدات والأدوية الفلاحية، أعطِ نصيحة آمنة وما تقترحش جرعة أو استعمال غير مؤكد. اطلب التفاصيل اللازمة قبل التوصية الدقيقة.\n- إذا ما تعرفش، قولها ببساطة واقترح كيفاش نتحققوا، من غير ما تتظاهر بالمعرفة. وقت يسألك المستخدم على الطقس الحالي أو التوقعات أو المطر أو الحرارة أو الرياح، استعمل أداة get_weather لجلب بيانات مباشرة. ووقت يسألك على آخر الأخبار أو المستجدات الفلاحية في تونس، استعمل أداة get_news وجاوبه من عناوين ومصادر RSS الحقيقية فقط. إذا ما فماش مقالات متاحة، قول هذا بوضوح وما تخترع حتى خبر. ووقت يسأل على المحاصيل أو الأمراض اللي تدعمها المنصة، استعمل get_supported_crops أو get_supported_diseases لجلب القائمة الحقيقية من الخدمة، وما تعتبرش القائمة توصية شخصية أو تشخيصاً. ووقت يطلب تفسير تحليل التربة أو قياساتها، استعمل أداة analyze_soil بعد ما تكون عندك قياسات صرّح بها المستخدم أو موجودة في سياق موثوق؛ ما تخمّنش قياسات ناقصة، ووضّح أن النتيجة استشارة LLM وليست تحليل مخبرياً أو تنبؤ ML مدرّب. ووقت يسألك على أسعار المحاصيل أو السوق أو اتجاه الأسعار، استعمل أداة get_market_prices. اذكر الفترة والمصدر والتاريخ إذا توفرت. إذا البيانات ناقصة أو الخدمة ترجع غير متاحة، وضّح هذا وما تعطي حتى سعر تقديري على أنه سعر حقيقي. إذا الولاية موش معروفة من سياق موثوق، اسأل عليها قبل الاستدعاء. ما تعطيش توقعات من ذاكرتك، وما تعتبرش التقديرات الجوية قياسات رطوبة تربة.\n\nالهدف: كل إجابة تكون مفيدة، مختصرة، مفهومة، فيها روح تونسية باهية، وتخلي المستخدم يحب يواصل الحديث مع AgroVibe.";
const SPEECH_RMS_THRESHOLD = 0.012;
const END_SILENCE_MS = 650;

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const outputLength = Math.max(1, Math.floor((input.length * toRate) / fromRate));
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
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, value < 0 ? value * 32768 : value * 32767, true);
  }
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

function base64ToPcm(base64: string): Float32Array {
  const binary = atob(base64);
  const sampleCount = Math.floor(binary.length / 2);
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    const value = (binary.charCodeAt(i * 2) & 0xff) | ((binary.charCodeAt(i * 2 + 1) & 0xff) << 8);
    const signed = value >= 0x8000 ? value - 0x10000 : value;
    samples[i] = signed < 0 ? signed / 32768 : signed / 32767;
  }
  return samples;
}

/**
 * Browser implementation selected automatically by Expo for web.
 * The native implementation remains in liveVoiceSession.ts.
 */
export class LiveVoiceSession {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private silentGain: GainNode | null = null;
  private playbackSources = new Set<AudioBufferSourceNode>();
  private nextPlaybackTime = 0;
  private socket: WebSocket | null = null;
  private callbacks: VoiceCallbacks;
  private active = false;
  private socketReady = false;
  private stopped = false;
  private speechActive = false;
  private silenceMs = 0;
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

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("المتصفح لا يدعم الوصول إلى الميكروفون. استعمل Chrome أو Edge عبر HTTPS.");
    }

    // Ask for microphone access before minting the short-lived Gemini token.
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    if (this.stopped) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      return;
    }

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

    const BrowserAudioContext = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;
    if (!BrowserAudioContext) throw new Error("المتصفح لا يدعم Web Audio API.");

    this.audioContext = new BrowserAudioContext();
    if (this.audioContext.state === "suspended") await this.audioContext.resume();
    if (this.stopped) return;

    this.mediaSource = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.silentGain = this.audioContext.createGain();
    this.silentGain.gain.value = 0;
    this.processor.onaudioprocess = (event) => this.handleMicrophoneFrame(event);
    this.mediaSource.connect(this.processor);
    this.processor.connect(this.silentGain);
    this.silentGain.connect(this.audioContext.destination);

    this.sessionHandle = null;
    this.reconnectAttempts = 0;
    await this.connectSocket(false);
  }

  private handleMicrophoneFrame(event: AudioProcessingEvent): void {
    if (!this.active || !this.socketReady || this.socket?.readyState !== WebSocket.OPEN) return;
    const input = event.inputBuffer.getChannelData(0);
    if (!input.length || !this.audioContext) return;

    // Gemini Live's browser session uses server-side VAD. Stream every PCM
    // frame (including silence) instead of client-side activityStart/activityEnd:
    // manual endpointing is not supported by the constrained Live endpoint.
    let energy = 0;
    for (let i = 0; i < input.length; i += 1) energy += input[i] * input[i];
    const rms = Math.sqrt(energy / input.length);
    this.callbacks.onLevel?.(Math.min(1, rms * 9));

    if (rms >= SPEECH_RMS_THRESHOLD) {
      if (!this.speechActive) this.interruptPlayback();
      this.speechActive = true;
      this.callbacks.onState("listening");
    } else if (this.speechActive) {
      this.silenceMs += (input.length / this.audioContext.sampleRate) * 1000;
      if (this.silenceMs >= END_SILENCE_MS) {
        this.speechActive = false;
        this.silenceMs = 0;
      }
    }

    const pcm = resample(input, this.audioContext.sampleRate, INPUT_RATE);
    this.socket.send(JSON.stringify({
      realtimeInput: {
        audio: { mimeType: "audio/pcm;rate=16000", data: floatToBase64(pcm) },
      },
    }));
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
              name: "get_market_prices",
              description: "Retrieve current Tunisian agricultural market intelligence and recorded prices from the AgroGrowth backend. Use for questions about crop prices, market prices, price trends, and selling/buying decisions. Never estimate or invent a price. If the backend reports insufficient or unavailable data, say no verified price data is currently available.",
              parameters: {
                type: "OBJECT",
                properties: {
                  period: { type: "INTEGER", enum: [7, 30, 90], description: "Lookback period in days. Default 30." },
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
          automaticActivityDetection: { disabled: false },
          activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
        },
        sessionResumption: resumeHandle ? { handle: resumeHandle } : {},
        contextWindowCompression: { slidingWindow: {} },
      },
    }));
  }

  private async connectSocket(resume: boolean): Promise<void> {
    if (!this.apiToken || !this.websocketUrl) throw new Error("بيانات الاتصال الصوتي غير متوفرة.");

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
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("انتهت مهلة الاتصال بالخدمة الصوتية."));
        socket.close();
      }, 15000);

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
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
          // Gemini Live can deliver WebSocket payloads as text, Blob, or
          // ArrayBuffer depending on the browser/runtime. Ignoring binary
          // event.data silently drops setupComplete and leaves the UI stuck
          // forever on "Connecting".
          let payload: string;
          if (typeof event.data === "string") {
            payload = event.data;
          } else if (event.data instanceof Blob) {
            payload = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            payload = new TextDecoder().decode(event.data);
          } else if (ArrayBuffer.isView(event.data)) {
            payload = new TextDecoder().decode(event.data as ArrayBufferView);
          } else {
            throw new Error("صيغة رسالة Gemini Live غير مدعومة.");
          }
          message = JSON.parse(payload);
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Invalid server message";
          this.callbacks.onError?.(`تعذّرت قراءة ردّ Gemini Live: ${detail}`);
          fail(new Error("وصل ردّ غير مفهوم من خدمة الصوت المباشر."));
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
          window.clearTimeout(timeout);
          settled = true;
          this.socketReady = true;
          if (resume) {
            this.reconnecting = false;
            this.reconnectAttempts = 0;
            this.callbacks.onState("listening");
            resolve();
          } else {
            this.active = true;
            this.callbacks.onState("listening");
            resolve();
          }
          return;
        }

        if (message.goAway) {
          void this.reconnectSession();
          return;
        }
        this.handleServerMessage(message);
      };

      socket.onerror = () => fail(new Error("تعذّر الاتصال بخدمة الصوت المباشر."));
      socket.onclose = (event) => {
        window.clearTimeout(timeout);
        if (!setupComplete) {
          fail(new Error("تم إغلاق الاتصال قبل بدء المحادثة الصوتية."));
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
    if (!this.active || this.reconnecting || !this.sessionHandle || !this.apiToken || !this.websocketUrl) return;
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
        window.setTimeout(() => void this.reconnectSession(), delay);
        return;
      }
      this.callbacks.onError?.(error instanceof Error ? error.message : "تعذّرت استعادة الاتصال الصوتي.");
      void this.stop();
    }
  }

  private interruptPlayback(): void {
    this.lastReplyId += 1;
    for (const source of this.playbackSources) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.playbackSources.clear();
    this.nextPlaybackTime = this.audioContext?.currentTime ?? 0;
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
    if (parts.some((part: any) => part.inlineData?.data)) this.callbacks.onState("speaking");
    if (serverContent.turnComplete && !this.speechActive) this.callbacks.onState("listening");
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

      if (call.name === "get_market_prices") {
        const requestedPeriod = Number(call.args?.period);
        const period = [7, 30, 90].includes(requestedPeriod) ? requestedPeriod : 30;
        const result = await apiRequest<any>(`/api/agro-market/intelligence?period=${period}`, { method: "GET" });
        const market = result.data;
        const hasUsableData =
          !result.error &&
          market?.success !== false &&
          market?.dataAvailable !== false &&
          market?.status !== "unavailable" &&
          market?.data != null;

        const response = hasUsableData
          ? {
              success: true,
              isRealData: market.isRealData === true || market.data?.isRealData === true,
              dataSource: market.dataSource ?? market.data?.dataSource ?? market.provenance?.source ?? null,
              periodDays: period,
              generatedAt: market.generatedAt ?? market.data?.generatedAt ?? null,
              marketData: market.data,
              provenance: market.provenance ?? market.data?.provenance ?? null,
              instruction: "Use only prices explicitly present in marketData. If no numeric price records are present, say that no price is available. Never calculate or guess missing prices.",
            }
          : {
              success: false,
              isRealData: false,
              dataAvailable: false,
              periodDays: period,
              error: "لا توجد حالياً ملاحظات أسعار كافية وموثوقة للفترة المطلوبة، أو خدمة السوق غير متاحة. وضّح للمستخدم هذا ولا تخترع أسعاراً أو اتجاهات.",
              code: market?.code ?? null,
              message: market?.message ?? result.error ?? null,
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
    try {
      if (!this.audioContext || replyId !== this.lastReplyId) return;
      const samples = base64ToPcm(base64Audio);
      if (!samples.length) return;
      const buffer = this.audioContext.createBuffer(1, samples.length, OUTPUT_RATE);
      buffer.copyToChannel(samples, 0);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.onended = () => this.playbackSources.delete(source);
      const startAt = Math.max(this.audioContext.currentTime + 0.02, this.nextPlaybackTime);
      source.start(startAt);
      this.nextPlaybackTime = startAt + buffer.duration;
      this.playbackSources.add(source);
    } catch (error) {
      this.callbacks.onError?.(error instanceof Error ? error.message : "تعذّر تشغيل الرد الصوتي.");
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.active = false;
    this.socketReady = false;
    this.speechActive = false;
    this.lastReplyId += 1;
    if (this.processor) {
      this.processor.onaudioprocess = null;
      try { this.processor.disconnect(); } catch { /* already disconnected */ }
    }
    try { this.mediaSource?.disconnect(); } catch { /* already disconnected */ }
    try { this.silentGain?.disconnect(); } catch { /* already disconnected */ }
    this.processor = null;
    this.mediaSource = null;
    this.silentGain = null;
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.socket?.close(1000, "User ended voice session");
    this.socket = null;
    for (const source of this.playbackSources) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.playbackSources.clear();
    if (this.audioContext) await this.audioContext.close().catch(() => undefined);
    this.audioContext = null;
    this.nextPlaybackTime = 0;
    this.apiToken = null;
    this.websocketUrl = null;
    this.model = null;
    this.sessionHandle = null;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.callbacks.onState("ended");
  }
}
