import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { StateCard } from '../ui/StateCard';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/SectionHeader';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { getAgriNews } from '../../api/client';
import { NewsResult } from '../../types';
import { formatDate } from '../../utils/date';
import { newsCategoryLabel } from '../../utils/newsLabels';

interface HomeNewsPreviewProps {
  /** Open the full Agri News screen. */
  onOpenAll: () => void;
}

/**
 * A short preview of the latest real agricultural headlines
 * (`GET /api/news` — publisher RSS feeds). Only real articles are shown; the
 * full list, search and category filters live on the dedicated news screen.
 */
export const HomeNewsPreview: React.FC<HomeNewsPreviewProps> = ({ onOpenAll }) => {
  const { t, x, isRtl, language } = useLanguage();
  const [result, setResult] = useState<NewsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await getAgriNews({ language, pageSize: 4 });
    setResult(res.data);
    setError(res.error);
  }, [language]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const articles = result?.articles?.slice(0, 3) ?? [];

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t.homeNewsTitle}
        subtitle={t.homeNewsSubtitle}
        actionLabel={t.homeNewsOpenAll}
        onAction={onOpenAll}
      />

      {loading ? (
        <StateCard cardStyle={styles.card} kind="loading" title={x.stateLoading} compact />
      ) : error && articles.length === 0 ? (
        <StateCard cardStyle={styles.card} kind="error" title={x.newsEmpty} message={error} onRetry={load} retryLabel={x.retry} compact />
      ) : articles.length === 0 ? (
        <StateCard cardStyle={styles.card} kind="empty" title={x.newsEmpty} message={x.newsEmptyDesc} compact />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {articles.map((article) => (
            <Card
              key={article.id}
              variant="elevated"
              style={styles.articleCard}
              onPress={() => article.link && Linking.openURL(article.link).catch(() => {})}
              accessibilityLabel={article.title}
              accessibilityHint={x.articleOpenSource}
            >
              <View style={[styles.articleRow, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.articleTextWrap}>
                  <Text style={[styles.articleTitle, isRtl && rtlStyles.rtlText]} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <View style={[styles.articleMeta, isRtl && rtlStyles.rtlRow]}>
                    <Text style={styles.articleSource} numberOfLines={1}>
                      {article.sourceName || x.newsUnknownSource}
                    </Text>
                    <Text style={styles.articleDot}>•</Text>
                    <Text style={styles.articleDate}>{formatDate(article.publishedAt, language)}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name={isRtl ? 'chevron-left' : 'chevron-right'}
                  size={20}
                  color={colors.textMuted}
                />
              </View>
              {article.categories[0] ? (
                <View style={[styles.catRow, isRtl && rtlStyles.rtlRow]}>
                  <View style={styles.catTag}>
                    <Text style={styles.catTagText}>{newsCategoryLabel(article.categories[0], language)}</Text>
                  </View>
                </View>
              ) : null}
            </Card>
          ))}
          {result?.meta ? (
            <View style={[styles.provRow, isRtl && rtlStyles.rtlRow]}>
              <ProvenanceBadge meta={result.meta} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  card: { paddingVertical: spacing.xs },
  articleCard: { padding: spacing.md, ...shadows.sm },
  articleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  articleTextWrap: { flex: 1 },
  articleTitle: { fontSize: typography.fontSizes.sm, lineHeight: typography.lineHeights.sm, fontWeight: typography.fontWeights.bold, color: colors.text },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  articleSource: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.primaryDark, fontWeight: typography.fontWeights.semibold, maxWidth: 180 },
  articleDot: { fontSize: typography.fontSizes.xs, color: colors.textMuted },
  articleDate: { fontSize: typography.fontSizes.xs, lineHeight: typography.lineHeights.xs, color: colors.textMuted },
  catRow: { flexDirection: 'row', marginTop: spacing.xs },
  catTag: { backgroundColor: colors.secondaryLight, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  catTagText: { fontSize: typography.fontSizes.xs, lineHeight: 18, color: colors.secondaryDark, fontWeight: typography.fontWeights.semibold },
  provRow: { flexDirection: 'row', marginTop: 2 },
});
