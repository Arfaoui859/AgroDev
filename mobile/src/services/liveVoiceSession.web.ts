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
