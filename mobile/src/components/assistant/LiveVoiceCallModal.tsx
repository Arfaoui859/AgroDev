import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../theme/colors";
import { LiveVoiceSession, LiveVoiceState } from "../../services/liveVoiceSession";

type Props = {
  visible: boolean;
  language: string;
  onClose: () => void;
};

const copy = (language: string) => {
  if (language === "fr") {
    return {
      title: "AgroVibe Live",
      subtitle: "Votre conseiller agricole, en conversation directe",
      start: "Démarrer la conversation",
      end: "Terminer l'appel",
      ready: "Prêt à vous écouter",
      connecting: "Connexion sécurisée…",
      listening: "Je vous écoute",
      thinking: "Je réfléchis…",
      speaking: "AgroVibe vous répond",
      ended: "Conversation terminée",
      error: "La connexion a échoué",
      retry: "Réessayer",
      privacy: "Conversation vocale en direct. Aucun texte de transcription n'est affiché.",
      close: "Fermer",
    };
  }
  if (language === "en") {
    return {
      title: "AgroVibe Live",
      subtitle: "Your agricultural advisor, in a direct voice conversation",
      start: "Start conversation",
      end: "End call",
      ready: "Ready to listen",
      connecting: "Connecting securely…",
      listening: "Listening to you",
      thinking: "Thinking…",
      speaking: "AgroVibe is speaking",
      ended: "Conversation ended",
      error: "Connection failed",
      retry: "Try again",
      privacy: "Live voice conversation. No speech transcript is displayed.",
      close: "Close",
    };
  }
  return {
    title: "AgroVibe Live",
    subtitle: "مستشارك الفلاحي، محادثة صوتية مباشرة",
    start: "ابدأ المحادثة الصوتية",
    end: "إنهاء المكالمة",
    ready: "جاهز باش نسمعك",
    connecting: "جاري الاتصال الآمن…",
    listening: "نسمع فيك",
    thinking: "نفكّر في الإجابة…",
    speaking: "AgroVibe يجاوبك",
    ended: "وفات المحادثة",
    error: "تعذّر الاتصال",
    retry: "عاود حاول",
    privacy: "محادثة صوتية مباشرة، من غير ما نعرضوا تحويل الكلام إلى نص.",
    close: "إغلاق",
  };
};

export const LiveVoiceCallModal: React.FC<Props> = ({ visible, language, onClose }) => {
  const [state, setState] = useState<LiveVoiceState | "ready">("ready");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const sessionRef = useRef<LiveVoiceSession | null>(null);
  const levelRef = useRef(0);
  const copyText = copy(language);
  const isRtl = language === "ar";

  useEffect(() => {
    if (!visible) {
      void sessionRef.current?.stop();
      sessionRef.current = null;
      setState("ready");
      setLevel(0);
      levelRef.current = 0;
      setError("");
    }
  }, [visible]);

  useEffect(() => () => {
    void sessionRef.current?.stop();
    sessionRef.current = null;
  }, []);

  const start = async () => {
    setError("");
    setState("connecting");
    const session = new LiveVoiceSession({
      onState: setState,
      onLevel: (nextLevel) => {
        if (Math.abs(nextLevel - levelRef.current) > 0.07) {
          levelRef.current = nextLevel;
          setLevel(nextLevel);
        }
      },
      onError: setError,
    });
    sessionRef.current = session;
    try {
      await session.start();
    } catch (reason) {
      setState("error");
      setError(reason instanceof Error ? reason.message : copyText.error);
      await session.stop();
      sessionRef.current = null;
    }
  };

  const end = async () => {
    await sessionRef.current?.stop();
    sessionRef.current = null;
    setState("ended");
    setLevel(0);
    levelRef.current = 0;
  };

  const statusText = state === "ready" ? copyText.ready
    : state === "connecting" ? copyText.connecting
      : state === "listening" ? copyText.listening
        : state === "thinking" ? copyText.thinking
          : state === "speaking" ? copyText.speaking
            : state === "error" ? copyText.error : copyText.ended;

  const inCall = state === "connecting" || state === "listening" || state === "thinking" || state === "speaking";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#082b1a" />
        <View style={styles.container}>
          <View style={[styles.topBar, isRtl && styles.rtl]}>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={copyText.close} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>{copyText.title}</Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.center}>
            <View style={[styles.orbit, inCall && styles.orbitActive]}>
              <View style={[styles.avatar, state === "speaking" && styles.avatarSpeaking]}>
                <MaterialCommunityIcons name="sprout" size={54} color="#ffffff" />
              </View>
            </View>

            <Text style={styles.title}>{copyText.title}</Text>
            <Text style={styles.subtitle}>{copyText.subtitle}</Text>

            <View style={styles.statusRow}>
              {state === "connecting" || state === "thinking" ? (
                <ActivityIndicator size="small" color="#a7d9b7" />
              ) : (
                <View style={[styles.statusDot, state === "listening" ? styles.dotListening : state === "speaking" ? styles.dotSpeaking : null]} />
              )}
              <Text style={styles.statusText}>{statusText}</Text>
            </View>

            <View style={styles.waveform} accessibilityLabel={statusText}>
              {Array.from({ length: 19 }, (_, index) => {
                const shape = 0.25 + Math.abs(Math.sin(index * 1.17)) * 0.75;
                const activeLevel = state === "listening" ? Math.max(0.12, level) : state === "speaking" ? 0.62 : 0.08;
                return (
                  <View
                    key={index}
                    style={[
                      styles.waveBar,
                      { height: 9 + shape * 46 * activeLevel * (state === "thinking" ? 0.25 : 1) },
                    ]}
                  />
                );
              })}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Text style={styles.privacy}>{copyText.privacy}</Text>
          </View>

          <View style={styles.controls}>
            {inCall ? (
              <TouchableOpacity onPress={() => void end()} style={styles.endButton} accessibilityRole="button">
                <MaterialCommunityIcons name="phone-hangup" size={27} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => void start()} style={styles.startButton} accessibilityRole="button">
                <MaterialCommunityIcons name="microphone" size={26} color="#ffffff" />
                <Text style={styles.startText}>{state === "error" ? copyText.retry : copyText.start}</Text>
              </TouchableOpacity>
            )}
            {state === "ended" || state === "error" || state === "ready" ? (
              <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>{copyText.close}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#082b1a" },
  container: { flex: 1, backgroundColor: "#082b1a", paddingHorizontal: spacing.lg },
  topBar: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rtl: { flexDirection: "row-reverse" },
  closeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  topTitle: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: spacing.xl },
  orbit: { width: 184, height: 184, borderRadius: 92, borderWidth: 1, borderColor: "rgba(167,217,183,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 30 },
  orbitActive: { borderColor: "rgba(167,217,183,0.7)", backgroundColor: "rgba(167,217,183,0.06)" },
  avatar: { width: 132, height: 132, borderRadius: 66, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarSpeaking: { backgroundColor: "#287b4a" },
  title: { color: "#ffffff", fontSize: 25, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#b8d2c1", fontSize: 14, textAlign: "center", lineHeight: 22 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 34 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#93a99b" },
  dotListening: { backgroundColor: "#7de3a0" },
  dotSpeaking: { backgroundColor: "#73c9ff" },
  statusText: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
  waveform: { height: 70, marginTop: 26, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  waveBar: { width: 4, minHeight: 8, borderRadius: 4, backgroundColor: "#9ddab0" },
  errorText: { color: "#ffb4ab", fontSize: 13, textAlign: "center", marginTop: 18, lineHeight: 20 },
  privacy: { color: "#8fae9b", fontSize: 12, textAlign: "center", marginTop: 22, lineHeight: 19, maxWidth: 290 },
  controls: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 16, paddingBottom: spacing.xl },
  startButton: { minHeight: 58, paddingHorizontal: 26, borderRadius: radius.full, backgroundColor: "#1e8b4d", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  startText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  endButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#d74747", alignItems: "center", justifyContent: "center" },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 18 },
  secondaryText: { color: "#b8d2c1", fontSize: 14 },
});
