import React, { useState, useRef } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { chatWithAIAssistant } from '../api/client';
import { ChatMessage } from '../types';
import { ProvenanceBadge } from '../components/ui/ProvenanceBadge';
import { formatTime } from '../utils/date';

let messageSeq = 0;
function nextMessageId(): string {
  messageSeq += 1;
  return `${Date.now()}-${messageSeq}`;
}

export const AIAssistantScreen: React.FC = () => {
  const { t, x, isRtl, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  // The persisted thread id returned by the gateway for a verified session.
  // Threaded back so the server keeps one conversation instead of creating a
  // new one per turn; it stays null for anonymous (unverified) callers.
  const conversationIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<any>(null);

  // The welcome bubble is derived at render time (not stored) so switching
  // language updates it immediately instead of leaving it in the old language.
  const displayMessages: ChatMessage[] = [
    { id: 'welcome', sender: 'assistant', text: t.assistantGreeting, timestamp: formatTime(new Date(), language) },
    ...messages,
  ];

  const suggestedPrompts = [
    t.promptIrrigation,
    t.promptPest,
    t.promptSoil,
    t.promptMarket,
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: nextMessageId(),
      sender: 'user',
      text: textToSend,
      timestamp: formatTime(new Date(), language),
    };

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
      style={styles.container}
    >
      {/* Header Info Banner */}
      <View style={[styles.headerBanner, isRtl && styles.rtlRow]}>
        <View style={styles.assistantAvatar}>
          <MaterialCommunityIcons name="robot" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, isRtl && styles.rtlText]}>{t.assistantTitle}</Text>
          <Text style={[styles.headerSub, isRtl && styles.rtlText]}>{t.assistantSubtitle}</Text>
        </View>
      </View>

      {/* Suggested Quick Prompt Chips */}
      <View style={styles.chipsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipsScroll, isRtl && styles.rtlRow]}
        >
          {suggestedPrompts.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleSend(prompt)}
              accessibilityRole="button"
              accessibilityLabel={prompt}
              style={[styles.promptChip, isRtl && styles.rtlRow]}
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
                    isRtl && styles.rtlText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    isUser ? styles.userTime : styles.assistantTime,
                    isRtl && styles.rtlText,
                  ]}
                >
                  {msg.timestamp}
                </Text>
                {!isUser && msg.meta ? (
                  <View style={styles.provRow}>
                    <ProvenanceBadge meta={msg.meta} />
                  </View>
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
            <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble, isRtl && styles.rtlRow]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{x.assistantPreparing}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputContainer, isRtl && styles.rtlRow]}>
        <TextInput
          style={[styles.input, isRtl && styles.rtlText]}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assistantAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSizes.base, lineHeight: 24,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  headerSub: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 1,
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
    gap: 4,
    minHeight: 48,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 240,
  },
  promptChipText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
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
    marginBottom: 4,
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
    lineHeight: 20,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
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
  loadingText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 20,
    color: colors.textSecondary,
  },
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
    fontSize: typography.fontSizes.sm, lineHeight: 21,
    color: colors.text,
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
