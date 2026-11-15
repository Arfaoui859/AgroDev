import React, { useCallback, useState } from 'react';
import { rtlStyles } from '../../theme/rtl';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Linking,
} from 'react-native';
import { screenStyles } from '../../theme/layout';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { CategoryPill } from '../../components/ui/CategoryPill';
import { ProvenanceBar } from '../../components/ui/ProvenanceBar';
import { StateCard } from '../../components/ui/StateCard';
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
      style={screenStyles.container}
      contentContainerStyle={screenStyles.content}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.catScroll, isRtl && rtlStyles.rtlRow]}>
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
        <StateCard kind="loading" title={x.stateLoading} compact />
      ) : error && articles.length === 0 ? (
        <StateCard
          kind="error"
          title={x.stateError}
          message={error}
          onRetry={() => load({ q: query, cat: category })}
          retryLabel={x.retry}
        />
      ) : articles.length === 0 ? (
        <StateCard
          kind={error ? 'unavailable' : 'empty'}
          title={x.newsEmpty}
          message={error || x.newsEmptyDesc}
          onRetry={() => load({ q: query, cat: category })}
          retryLabel={x.retry}
        />
      ) : (
        <>
          {result?.meta ? <ProvenanceBar meta={result.meta} detailed style={styles.provBar} /> : null}

          {articles.map((article) => (
            <Card
              key={article.id}
              variant="elevated"
              style={styles.articleCard}
              onPress={() => openArticle(article)}
              accessibilityLabel={article.title}
              accessibilityHint={x.articleOpenSource}
            >
              <View style={[styles.articleHeader, isRtl && rtlStyles.rtlRow]}>
                <Badge label={article.sourceName || x.newsUnknownSource} variant="secondary" size="sm" />
                {article.categories[0] ? (
                  <Badge label={newsCategoryLabel(article.categories[0], language)} variant="info" size="sm" />
                ) : null}
              </View>
              <Text style={[styles.articleTitle, isRtl && rtlStyles.rtlText]} numberOfLines={3}>
                {article.title}
              </Text>
              {article.summary ? (
                <Text style={[styles.articleSummary, isRtl && rtlStyles.rtlText]} numberOfLines={3}>
                  {article.summary}
                </Text>
              ) : null}
              <View style={[styles.articleFooter, isRtl && rtlStyles.rtlRow]}>
                <Text style={styles.articleDate}>{formatDate(article.publishedAt, language)}</Text>
                <View style={[styles.readMore, isRtl && rtlStyles.rtlRow]}>
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

const styles = StyleSheet.create({
  catScroll: { gap: spacing.xs, paddingBottom: spacing.md },
  provBar: { marginBottom: spacing.sm },
  articleCard: { padding: spacing.md, marginBottom: spacing.sm },
  articleHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' },
  articleTitle: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.bold, color: colors.text, lineHeight: 22 },
  articleSummary: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: typography.lineHeights.sm },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  articleDate: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.lineHeights.xs },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  readMoreText: { fontSize: typography.fontSizes.xs, color: colors.primary, fontWeight: typography.fontWeights.semibold, lineHeight: typography.lineHeights.xs },
  sourcesNote: { padding: spacing.md, backgroundColor: colors.surfaceSubtle, marginTop: spacing.xs },
  sourcesNoteText: { fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.lineHeights.sm },
});
