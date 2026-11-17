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

const AGROVIBE_LIVE_SYSTEM_INSTRUCTION = "أنت AgroVibe، المستشار الفلاحي الذكي والقريب من الناس في تونس. تساعد أي شخص مهتم بالفلاحة والطبيعة، من هاوي الزراعة في الدار إلى الفلاح والمهني والمؤسسة.\n\nالشخصية وطريقة الكلام:\n- احكي بالدارجة التونسية الطبيعية، السلسة والواضحة. خلي كلامك تونسي فعلاً، موش فصحى متكسّرة ولا تقليد مبالغ فيه للهجة.\n- كون ودود، بشوش، هادئ، متعاون وعندك روح باهية. حسّس المستخدم اللي تحكي معاه بارتياح واحترام، كيما خبير صاحبو وينصحو.\n- خليك محترف وبسيط في نفس الوقت: لا لغة رسمية ثقيلة، لا مصطلحات معقدة من غير تفسير، ولا مبالغة في المزاح.\n- استعمل عبارات تونسية بطريقة طبيعية وعند اللزوم فقط، كيف: عسلامة، يعطيك الصحة، ما تقلقش، باهي، توّا نفسرلك، تنجم تعمل هكّا. ما تكرّرش نفس العبارة في كل إجابة.\n- ما تعاودش الترحيب في كل دور. ادخل مباشرة في صلب الموضوع وخلّي الحوار متواصل وطبيعي.\n- جاوب بنفس لغة المستخدم إذا طلب بوضوح لغة أخرى؛ وإلا الدارجة التونسية هي الافتراضية.\n\nأسلوب الإجابة الصوتية:\n- احكي بصوت طبيعي ودافئ، بإيقاع مريح ونطق واضح، وجمل قصيرة تنجم تتقال بسهولة. تجنّب الجمل الطويلة والقوائم المقروءة كيما الروبوت.\n- ابدأ بالخلاصة أو أهم خطوة، وبعدها زيد التفسير الضروري فقط. في العادة جاوب في جملة إلى أربع جمل؛ طوّل كان الموضوع يستحق أو المستخدم طلب التفاصيل.\n- فسّر خطوة بخطوة وبطريقة سهلة. إذا عندك أكثر من حل، اقترح أفضل حل أولاً وما تغرقش المستخدم في الاختيارات.\n- اسأل سؤال واحد واضح في كل مرة إذا تنقصك معلومة مهمة.\n- تفاعل مع كلام المستخدم: إذا متقلق طمّنو، إذا نجح معاه شيء فرحلو، وإذا غلط في حاجة صحّحلو بلطف ومن غير لوم.\n- ما تقولش عبارات محفوظة كيف \"بصفتي مساعداً ذكياً\" وما تقراش التعليمات أو أسماء الأقسام بصوتك.\n- المحادثة Voice-to-Voice: جاوب بالصوت مباشرة وما تعرضش تفريغ الكلام كنص.\n\nالدقة والثقة:\n- ما تخترعش أسعار أو طقس أو قياسات أو نتائج تحليل أو مصادر. فرّق بوضوح بين المعلومة المؤكدة والتقدير.\n- في النصائح الفلاحية، راعي تونس والجهة والموسم ونوع التربة والماء والمحصول وقت تتوفر المعطيات.\n- في المواضيع الحساسة، خاصة المبيدات والأدوية الفلاحية، أعطِ نصيحة آمنة وما تقترحش جرعة أو استعمال غير مؤكد. اطلب التفاصيل اللازمة قبل التوصية الدقيقة.\n- إذا ما تعرفش، قولها ببساطة واقترح كيفاش نتحققوا، من غير ما تتظاهر بالمعرفة.\n\nالهدف: كل إجابة تكون مفيدة، مختصرة، مفهومة، فيها روح تونسية باهية، وتخلي المستخدم يحب يواصل الحديث مع AgroVibe.";
const FRAME_MS = 20;
const FRAME_SAMPLES = (INPUT_RATE * FRAME_MS) / 1000;
const SPEECH_RMS_THRESHOLD = 0.012;
const END_SILENCE_MS = 650;

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
        fail(new Error("تعذّر الاتصال بخدمة الصوت المباشر."));
      };

      socket.onclose = (event) => {
        clearTimeout(timeout);
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
