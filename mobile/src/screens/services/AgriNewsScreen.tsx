import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StateView } from '../../components/ui/StateView';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge';
import { getAgriNews } from '../../api/client';
import { NewsArticle, NewsResult } from '../../types';
import { formatDate } from '../../utils/date';
import { newsCategoryLabel } from '../../utils/newsLabels';

interface AgriNewsScreenProps {
  onBack: () => void;
}

/**
 * Tunisian agricultural news from real publisher RSS feeds
 * (`GET /api/news`). Each article shows its publisher and links to the original
 * article. A source that is down is reported and contributes no items — no
 * headline is ever invented.
 */
export const AgriNewsScreen: React.FC<AgriNewsScreenProps> = ({ onBack }) => {
  const { t, x, isRtl, language } = useLanguage();
  const [result, setResult] = useState<NewsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { q?: string; cat?: string | null } = {}) => {
      setError(null);
      const res = await getAgriNews({
        language,
        query: opts.q,
        category: opts.cat ?? undefined,
        pageSize: 20,
      });
      setResult(res.data);
      setError(res.error);
    },
    [language],
  );

  React.useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load({ q: query, cat: category });
    setRefreshing(false);
  };

  const applyCategory = async (cat: string | null) => {
    setCategory(cat);
    setLoading(true);
    await load({ q: query, cat });
    setLoading(false);
  };

  const submitSearch = async () => {
    setLoading(true);
    await load({ q: query, cat: category });
    setLoading(false);
  };

  const openArticle = (article: NewsArticle) => {
    if (article.link) Linking.openURL(article.link).catch(() => {});
  };

  const articles = result?.articles ?? [];
  const unavailableSources = (result?.sources ?? []).filter((s) => !s.available);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <ServiceHeader
        icon="newspaper-variant-outline"
        iconColor={colors.secondary}
        iconBg={colors.secondaryLight}
        title={x.newsTitle}
        subtitle={x.newsSubtitle}
      />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={x.newsSearchPlaceholder}
        clearLabel={x.clearSearch}
        onSubmit={submitSearch}
        submitLabel={x.newsSearchPlaceholder}
      />

      {result?.categories?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.catScroll, isRtl && styles.rtlRow]}>
          <CategoryPill label={x.newsAllCategories} selected={category === null} onPress={() => applyCategory(null)} />
          {result.categories.map((cat) => (
            <CategoryPill
              key={cat}
              label={newsCategoryLabel(cat, language)}
              selected={category === cat}
              onPress={() => applyCategory(cat)}
            />
          ))}
        </ScrollView>
      ) : null}

      {loading && articles.length === 0 ? (
        <Card variant="outlined">
          <StateView kind="loading" title={x.stateLoading} compact />
        </Card>
      ) : error && articles.length === 0 ? (
        <Card variant="outlined">
          <StateView kind="error" title={x.stateError} message={error} onRetry={() => load({ q: query, cat: category })} retryLabel={x.retry} />
        </Card>
      ) : articles.length === 0 ? (
        <Card variant="outlined">
          <StateView
            kind={error ? 'unavailable' : 'empty'}
            title={x.newsEmpty}
            message={error || x.newsEmptyDesc}
            onRetry={() => load({ q: query, cat: category })}
            retryLabel={x.retry}
          />
        </Card>
      ) : (
        <>
          <View style={[styles.provBar, isRtl && styles.rtlRow]}>
            {result?.meta ? <ProvenanceBadge meta={result.meta} detailed /> : null}
          </View>

          {articles.map((article) => (
            <Card
              key={article.id}
              variant="elevated"
              style={styles.articleCard}
              onPress={() => openArticle(article)}
              accessibilityLabel={article.title}
              accessibilityHint={x.articleOpenSource}
            >
              <View style={[styles.articleHeader, isRtl && styles.rtlRow]}>
                <Badge label={article.sourceName || x.newsUnknownSource} variant="secondary" size="sm" />
                {article.categories[0] ? (
                  <Badge label={newsCategoryLabel(article.categories[0], language)} variant="info" size="sm" />
                ) : null}
              </View>
              <Text style={[styles.articleTitle, isRtl && styles.rtlText]} numberOfLines={3}>
                {article.title}
              </Text>
              {article.summary ? (
                <Text style={[styles.articleSummary, isRtl && styles.rtlText]} numberOfLines={3}>
                  {article.summary}
                </Text>
              ) : null}
              <View style={[styles.articleFooter, isRtl && styles.rtlRow]}>
                <Text style={styles.articleDate}>{formatDate(article.publishedAt, language)}</Text>
                <View style={[styles.readMore, isRtl && styles.rtlRow]}>
                  <Text style={styles.readMoreText}>{x.newsReadMore}</Text>
                  <MaterialCommunityIcons name={isRtl ? 'arrow-left' : 'arrow-right'} size={14} color={colors.primary} />
                </View>
              </View>
            </Card>
          ))}

          {unavailableSources.length > 0 ? (
            <Card variant="outlined" style={styles.sourcesNote}>
              <Text style={styles.sourcesNoteText}>
                {x.newsSomeSourcesDown} {unavailableSources.map((s) => s.name).join(x.newsSourceSeparator)}
              </Text>
            </Card>
          ) : null}
        </>
      )}

      <Button title={t.back} variant="outline" onPress={onBack} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }} />
    </ScrollView>
  );
};

const CategoryPill: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={label}
    style={[styles.catPill, selected && styles.catPillSelected]}
  >
    <Text style={[styles.catPillText, selected && styles.catPillTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  catScroll: { gap: spacing.xs, paddingBottom: spacing.md },
  catPill: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  catPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  catPillText: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, lineHeight: 20 },
  catPillTextSelected: { color: colors.textInverse, fontWeight: typography.fontWeights.bold },
  provBar: { marginBottom: spacing.sm },
  articleCard: { padding: spacing.md, marginBottom: spacing.sm },
  articleHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' },
  articleTitle: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.bold, color: colors.text, lineHeight: 22 },
  articleSummary: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 21 },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  articleDate: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 20 },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  readMoreText: { fontSize: typography.fontSizes.xs, color: colors.primary, fontWeight: typography.fontWeights.semibold, lineHeight: 20 },
  sourcesNote: { padding: spacing.md, backgroundColor: colors.surfaceSubtle, marginTop: spacing.xs },
  sourcesNoteText: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: 21 },
});
