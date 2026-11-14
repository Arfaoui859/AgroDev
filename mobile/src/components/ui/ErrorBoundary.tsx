import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { Button } from './Button';
import { getTranslations } from '../../i18n';
import { getExtra } from '../../i18n/extra';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Current UI language, so the fallback copy is localised. */
  language: 'ar' | 'fr' | 'en';
  /** Called after the user taps "retry"; the boundary resets its own state. */
  onReset?: () => void;
  /** Optional reset key: changing it clears a captured error automatically. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  hasError: boolean;
  /** Bumped on retry so the subtree remounts fresh instead of resuming. */
  attempt: number;
}

/**
 * Catches render-time exceptions so one broken screen cannot blank the whole
 * app. The fallback is localised and offers a retry that remounts the subtree;
 * it never shows the raw error (which could leak internals).
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Keep the message in the dev log only; it is never rendered.
    console.warn('Unhandled UI error:', error?.message);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, attempt: this.state.attempt + 1 });
    }
  }

  private handleRetry = () => {
    // Bump `attempt` so the subtree is remounted rather than resuming a
    // possibly-corrupt tree, then let the owner react (e.g. refetch).
    this.setState((s) => ({ hasError: false, attempt: s.attempt + 1 }));
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
    }

    const t = getTranslations(this.props.language);
    const x = getExtra(this.props.language);
    const isRtl = this.props.language === 'ar';

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="alert-decagram-outline" size={40} color={colors.danger} />
        </View>
        <Text style={[styles.title, isRtl && styles.rtlText]}>{x.crashTitle}</Text>
        <Text style={[styles.message, isRtl && styles.rtlText]}>{x.crashMessage}</Text>
        <Button title={t.retry} onPress={this.handleRetry} style={styles.retry} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  rtlText: { textAlign: 'center', writingDirection: 'rtl' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
  },
  title: {
    fontSize: typography.fontSizes.base,
    lineHeight: 24,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retry: { marginTop: spacing.md, minWidth: 160 },
});
