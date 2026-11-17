import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rtlStyles } from '../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { flex1, screenStyles } from '../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { subtleCaption } from '../theme/typographyStyles';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { chatWithAIAssistant } from '../api/client';
import { ChatMessage } from '../types';
import { ProvenanceBar } from '../components/ui/ProvenanceBar';
import { OrchestrationTraceView } from '../components/ui/OrchestrationTraceView';
import { ScreenHeading } from '../components/ui/ScreenHeading';
import { formatTime } from '../utils/date';
import { LiveVoiceCallModal } from '../components/assistant/LiveVoiceCallModal';

let messageSeq = 0;
function nextMessageId(): string {
  messageSeq += 1;
  return `${Date.now()}-${messageSeq}`;
}

/** Clean markdown and split long replies into device-safe speech chunks. */
function splitSpeechText(value: string): string[] {
  const clean = value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/^\s{0,3}#{1,6}\s/gm, '')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/[|*_~`]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?؟。]+[.!?؟。]?/gu) ?? [clean];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) continue;
    if (current && (current.length + part.length + 1 > 2400)) {
      chunks.push(current);
      current = part;
    } else {
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export const AIAssistantScreen: React.FC = () => {
  const { t, x, isRtl, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveVoiceVisible, setLiveVoiceVisible] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  // The persisted thread id returned by the gateway for a verified session.
  // Threaded back so the server keeps one conversation instead of creating a
  // new one per turn; it stays null for anonymous (unverified) callers.
  const conversationIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<any>(null);
  const threadStorageKey = user?.id ? `agrogrowth.assistant.${user.id}` : null;
  const [threadReadyKey, setThreadReadyKey] = useState<string | null>(null);

  // Keep each verified user's local conversation separate on shared devices.
  useEffect(() => {
    let active = true;
    conversationIdRef.current = null;
    if (!threadStorageKey) {
      Promise.resolve().then(() => {
        if (!active) return;
        setMessages([]);
        setThreadReadyKey('anonymous');
      });
      return () => { active = false; };
    }
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(threadStorageKey);
        if (!active) return;
        if (raw) {
          const saved = JSON.parse(raw);
          setMessages(Array.isArray(saved.messages) ? saved.messages.slice(-40) : []);
          conversationIdRef.current = typeof saved.conversationId === 'string' ? saved.conversationId : null;
        } else {
          setMessages([]);
        }
      } catch {
        if (active) {
          setMessages([]);
          conversationIdRef.current = null;
        }
      } finally {
        if (active) setThreadReadyKey(threadStorageKey);
      }
    })();
    return () => { active = false; };
  }, [threadStorageKey]);

  useEffect(() => {
    if (!threadStorageKey || threadReadyKey !== threadStorageKey) return;
    void AsyncStorage.setItem(threadStorageKey, JSON.stringify({
      conversationId: conversationIdRef.current,
      messages: messages.slice(-40),
    })).catch(() => undefined);
  }, [messages, threadStorageKey, threadReadyKey]);

  // Never render a previous account's in-memory messages while the next
  // account's local thread is still loading.
  const messagesReady = threadStorageKey ? threadReadyKey === threadStorageKey : threadReadyKey === 'anonymous';

  const speechLocale = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';

  useEffect(() => () => { void Speech.stop(); }, []);

  const handleSpeak = async (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      await Speech.stop();
      setSpeakingMessageId(null);
      return;
    }
    await Speech.stop();
    const chunks = splitSpeechText(text);
    if (!chunks.length) return;
    setSpeakingMessageId(messageId);
    const speakChunk = (index: number) => {
      if (index >= chunks.length) {
        setSpeakingMessageId((current) => current === messageId ? null : current);
        return;
      }
      Speech.speak(chunks[index], {
        language: speechLocale,
        rate: 0.94,
        pitch: 1,
        onDone: () => speakChunk(index + 1),
        onStopped: () => setSpeakingMessageId((current) => current === messageId ? null : current),
        onError: () => setSpeakingMessageId((current) => current === messageId ? null : current),
      });
    };
    speakChunk(0);
  };

  // The welcome bubble is derived at render time (not stored) so switching
  // language updates it immediately instead of leaving it in the old language.
  const displayMessages: ChatMessage[] = [
    { id: 'welcome', sender: 'assistant', text: t.assistantGreeting, timestamp: formatTime(new Date(), language) },
    ...(messagesReady ? messages : []),
  ];

  const suggestedPrompts = [
    t.promptIrrigation,
    t.promptPest,
    t.promptSoil,
    t.promptMarket,
  ];

  const handleSend = async (messageText?: string) => {
    if (!messagesReady) return;
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: nextMessageId(),
      sender: 'user',
      text: textToSend,
      timestamp: formatTime(new Date(), language),
    };

    void Speech.stop();
    setSpeakingMessageId(null);
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Send the prior turns (from the same state update) so the model has
    // context; the welcome bubble is derived and not part of the server thread.
    const history = [...messages, userMsg]
      .map((m) => ({ role: m.sender, content: m.text }))
      .slice(-12);

    try {
      const response = await chatWithAIAssistant(textToSend, language, {
        history,
        conversationId: conversationIdRef.current,
      });
      if (response.data?.conversationId) {
        conversationIdRef.current = response.data.conversationId;
      }
      const assistantMsg: ChatMessage = {
        id: nextMessageId(),
        sender: 'assistant',
        text: response.data?.reply || x.assistantUnavailable,
        timestamp: formatTime(new Date(), language),
        meta: response.data?.meta,
        orchestration: response.data?.orchestration,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: nextMessageId(),
        sender: 'assistant',
        text: x.assistantErrorReply,
        timestamp: formatTime(new Date(), language),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      style={screenStyles.container}
    >
      {/* Header Info Banner */}
      <View style={styles.headerBanner}>
        <ScreenHeading
          title={t.assistantTitle}
          subtitle={t.assistantSubtitle}
          style={styles.headingFlush}
          leading={
            <View style={styles.assistantAvatar}>
              <MaterialCommunityIcons name="robot" size={24} color={colors.primary} />
            </View>
          }
        />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setLiveVoiceVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={language === 'fr' ? 'Démarrer une conversation vocale en direct' : language === 'en' ? 'Start a live voice conversation' : 'ابدأ محادثة صوتية مباشرة'}
          style={[styles.liveCallButton, isRtl && rtlStyles.rtlRow]}
        >
          <MaterialCommunityIcons name="phone-in-talk" size={19} color={colors.textInverse} />
          <Text style={styles.liveCallButtonText}>
            {language === 'fr' ? 'Conversation vocale' : language === 'en' ? 'Live voice conversation' : 'محادثة صوتية مباشرة'}
          </Text>
        </TouchableOpacity>
      </View>

      <LiveVoiceCallModal
        visible={liveVoiceVisible}
        language={language}
        onClose={() => setLiveVoiceVisible(false)}
      />

      {/* Suggested Quick Prompt Chips */}
      <View style={styles.chipsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipsScroll, isRtl && rtlStyles.rtlRow]}
        >
          {suggestedPrompts.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleSend(prompt)}
              accessibilityRole="button"
              accessibilityLabel={prompt}
              style={[styles.promptChip, isRtl && rtlStyles.rtlRow]}
            >
              <MaterialCommunityIcons name="lightbulb-outline" size={14} color={colors.primary} />
              <Text style={styles.promptChipText} numberOfLines={1}>
                {prompt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {displayMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.assistantRow,
                isRtl && (isUser ? styles.rtlUserRow : styles.rtlAssistantRow),
              ]}
            >
              {!isUser && (
                <View style={styles.botIcon}>
                  <MaterialCommunityIcons name="sprout" size={16} color={colors.primary} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.assistantText,
                    isRtl && rtlStyles.rtlText,
                  ]}
                >
                  {msg.text}
                </Text>
                {!isUser && msg.id !== 'welcome' ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => void handleSpeak(msg.id, msg.text)}
                    accessibilityRole="button"
                    accessibilityLabel={speakingMessageId === msg.id ? x.stopSpeaking : x.speakAnswer}
                    style={[styles.speakButton, isRtl && rtlStyles.rtlRow]}
                  >
                    <MaterialCommunityIcons
                      name={speakingMessageId === msg.id ? 'stop-circle-outline' : 'volume-high'}
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.speakButtonText}>
                      {speakingMessageId === msg.id ? x.stopSpeaking : x.speakAnswer}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <Text
                  style={[
                    styles.messageTime,
                    isUser ? styles.userTime : styles.assistantTime,
                    isRtl && rtlStyles.rtlText,
                  ]}
                >
                  {msg.timestamp}
                </Text>
                {!isUser && msg.meta ? (
                  <ProvenanceBar meta={msg.meta} style={styles.provRow} />
                ) : null}
                {!isUser && msg.orchestration ? (
                  <OrchestrationTraceView trace={msg.orchestration} />
                ) : null}
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.messageRow, styles.assistantRow, isRtl && styles.rtlAssistantRow]}>
            <View style={styles.botIcon}>
              <MaterialCommunityIcons name="sprout" size={16} color={colors.primary} />
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble, isRtl && rtlStyles.rtlRow]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{x.assistantPreparing}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputContainer, isRtl && rtlStyles.rtlRow]}>
        <TextInput
          style={[styles.input, isRtl && rtlStyles.rtlText]}
          placeholder={t.typeYourMessage}
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          accessibilityLabel={t.typeYourMessage}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setLiveVoiceVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={language === 'fr' ? 'Conversation vocale en direct' : language === 'en' ? 'Live voice conversation' : 'محادثة صوتية مباشرة'}
          style={styles.liveMicButton}
        >
          <MaterialCommunityIcons
            name="phone-in-talk"
            size={21}
            color={colors.textInverse}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSend()}
          disabled={loading || inputText.trim() === ''}
          accessibilityRole="button"
          accessibilityLabel={t.send}
          accessibilityState={{ disabled: loading || inputText.trim() === '' }}
          style={[
            styles.sendButton,
            (loading || inputText.trim() === '') && styles.sendButtonDisabled,
          ]}
        >
          <MaterialCommunityIcons
            name={isRtl ? 'arrow-left' : 'arrow-right'}
            size={22}
            color={colors.textInverse}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  provRow: { marginTop: 6 },
  headerBanner: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headingFlush: { marginBottom: 0 },
  liveCallButton: {
    minHeight: 44,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  liveCallButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  assistantAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsSection: {
    backgroundColor: colors.card,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 240,
  },
  promptChipText: subtleCaption,
  messagesContainer: flex1,
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginVertical: 2,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  rtlUserRow: {
    justifyContent: 'flex-start',
  },
  rtlAssistantRow: {
    justifyContent: 'flex-end',
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.xs,
  },
  assistantBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  messageText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 22,
  },
  userText: {
    color: colors.textInverse,
  },
  assistantText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    marginTop: spacing.xs,
  },
  userTime: {
    color: colors.onBrandFaint,
  },
  assistantTime: {
    color: colors.textMuted,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: subtleCaption,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm,
    color: colors.text,
  },
  liveMicButton: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMicButtonActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
  },
  speakButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderStrong,
  },
});
