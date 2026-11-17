import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadows, spacing, typography } from '../../theme/colors';
import { rtlStyles } from '../../theme/rtl';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ServiceHeader } from '../../components/ui/ServiceHeader';
import { CategoryPill } from '../../components/ui/CategoryPill';
import {
  CommunityComment,
  CommunityPost,
  createCommunityComment,
  createCommunityPost,
  getCommunityComments,
  getCommunityPosts,
  toggleCommunityPostLike,
} from '../../api/client';

interface CommunityScreenProps {
  onBack: () => void;
  onOpenProfile: () => void;
}

type CommunityCategory = 'all' | 'general' | 'crops' | 'soil' | 'irrigation' | 'plant_protection';

const CATEGORIES: CommunityCategory[] = ['all', 'general', 'crops', 'soil', 'irrigation', 'plant_protection'];

const categoryLabel = (category: CommunityCategory, language: string) => {
  const labels: Record<CommunityCategory, Record<string, string>> = {
    all: { ar: 'الكل', fr: 'Tout', en: 'All' },
    general: { ar: 'عام', fr: 'Général', en: 'General' },
    crops: { ar: 'المحاصيل', fr: 'Cultures', en: 'Crops' },
    soil: { ar: 'التربة', fr: 'Sol', en: 'Soil' },
    irrigation: { ar: 'الري', fr: 'Irrigation', en: 'Irrigation' },
    plant_protection: { ar: 'حماية النباتات', fr: 'Protection des plantes', en: 'Plant protection' },
  };
  return labels[category][language] ?? labels[category].en;
};

const copy = (language: string) => ({
  ar: {
    title: 'مجتمع AgriVibe',
    subtitle: 'تبادل الخبرات مع الفلاحين والخبراء',
    compose: 'شنوّة تحب تشارك مع المجتمع؟',
    publish: 'انشر',
    publishing: 'جاري النشر…',
    empty: 'ما فماش منشورات في التصنيف هذا. كن أول من يشارك!',
    loadError: 'تعذّر تحميل المنشورات. جرّب مرة أخرى.',
    comments: 'التعليقات',
    addComment: 'اكتب تعليقك…',
    send: 'إرسال',
    noComments: 'ما فماش تعليقات بعد.',
    verified: 'منشور محفوظ',
    role: 'عضو',
    login: 'يلزمك تسجيل دخول موثّق باش تشارك وتتفاعل.',
    back: 'رجوع',
  },
  fr: {
    title: 'Communauté AgriVibe',
    subtitle: 'Échangez avec les agriculteurs et les experts',
    compose: 'Que souhaitez-vous partager avec la communauté ?',
    publish: 'Publier',
    publishing: 'Publication…',
    empty: 'Aucune publication dans cette catégorie. Soyez le premier !',
    loadError: 'Impossible de charger les publications. Réessayez.',
    comments: 'Commentaires',
    addComment: 'Écrire un commentaire…',
    send: 'Envoyer',
    noComments: 'Aucun commentaire pour le moment.',
    verified: 'Publication enregistrée',
    role: 'Membre',
    login: 'Une session vérifiée est nécessaire pour publier et interagir.',
    back: 'Retour',
  },
  en: {
    title: 'AgriVibe Community',
    subtitle: 'Share experience with farmers and experts',
    compose: 'What would you like to share with the community?',
    publish: 'Publish',
    publishing: 'Publishing…',
    empty: 'No posts in this category yet. Be the first to share!',
    loadError: 'Could not load posts. Please try again.',
    comments: 'Comments',
    addComment: 'Write a comment…',
    send: 'Send',
    noComments: 'No comments yet.',
    verified: 'Saved post',
    role: 'Member',
    login: 'A verified sign-in is required to post and interact.',
    back: 'Back',
  },
});

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ onBack, onOpenProfile }) => {
  const { language, isRtl } = useLanguage();
  const { isAuthenticated } = useAuth();
  const translations = copy(language);
  const text = translations[language as keyof typeof translations] ?? translations.en;
  const [category, setCategory] = useState<CommunityCategory>('all');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentDraft, setCommentDraft] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!isAuthenticated) return;
    const result = await getCommunityPosts(category);
    setPosts(result.data);
    setError(result.error);
  }, [category, isAuthenticated]);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setPosts([]);
      setError(null);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    getCommunityPosts(category).then((result) => {
      if (!active) return;
      setPosts(result.data);
      setError(result.error);
      setLoading(false);
    }).catch(() => {
      if (active) {
        setPosts([]);
        setError(text.loadError);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [category, text.loadError, isAuthenticated]);

  const refresh = async () => {
    setRefreshing(true);
    try { await loadPosts(); } finally { setRefreshing(false); }
  };

  const publish = async () => {
    const content = draft.trim();
    if (!content || publishing) return;
    setPublishing(true);
    setInteractionError(null);
    try {
      const result = await createCommunityPost(content, category === 'all' ? 'general' : category);
      if (result.data) {
        setPosts((current) => [result.data as CommunityPost, ...current]);
        setDraft('');
      } else {
        setInteractionError(result.error || text.loadError);
      }
    } catch {
      setInteractionError(text.loadError);
    } finally {
      setPublishing(false);
    }
  };

  const toggleLike = async (post: CommunityPost) => {
    setInteractionError(null);
    try {
      const result = await toggleCommunityPostLike(post.id);
      if (result.liked === null) {
        setInteractionError(result.error || text.loadError);
        return;
      }
      setPosts((current) => current.map((item) => item.id === post.id ? {
        ...item,
        liked_by_me: result.liked as boolean,
        likes_count: Math.max(0, item.likes_count + (result.liked ? 1 : -1)),
      } : item));
    } catch {
      setInteractionError(text.loadError);
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      setCommentDraft('');
      return;
    }
    setExpandedPost(postId);
    setInteractionError(null);
    try {
      const result = await getCommunityComments(postId);
      if (result.error) setInteractionError(result.error);
      else setComments((current) => ({ ...current, [postId]: result.data }));
    } catch {
      setInteractionError(text.loadError);
    }
  };

  const sendComment = async (postId: string) => {
    const content = commentDraft.trim();
    if (!content || sendingComment) return;
    setSendingComment(true);
    setInteractionError(null);
    try {
      const result = await createCommunityComment(postId, content);
      if (result.data) {
        setComments((current) => ({ ...current, [postId]: [...(current[postId] ?? []), result.data as CommunityComment] }));
        setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post));
        setCommentDraft('');
      } else {
        setInteractionError(result.error || text.loadError);
      }
    } catch {
      setInteractionError(text.loadError);
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.8} accessibilityRole="button" style={[styles.back, isRtl && rtlStyles.rtlRow]}>
        <MaterialCommunityIcons name={isRtl ? 'arrow-right' : 'arrow-left'} size={18} color={colors.textSecondary} />
        <Text style={styles.backText}>{text.back}</Text>
      </TouchableOpacity>

      <ServiceHeader
        icon="account-group"
        iconColor={colors.primary}
        iconBg={colors.primaryLight}
        title={text.title}
        subtitle={text.subtitle}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
      >
        {!isAuthenticated ? (
          <Card variant="elevated" style={styles.loginCard}>
            <MaterialCommunityIcons name="account-lock-outline" size={30} color={colors.primary} />
            <Text style={[styles.loginText, isRtl && rtlStyles.rtlText]}>{text.login}</Text>
            <TouchableOpacity onPress={onOpenProfile} style={styles.publishButton} accessibilityRole="button">
              <Text style={styles.publishText}>{language === 'ar' ? 'افتح الملف الشخصي' : language === 'fr' ? 'Ouvrir le profil' : 'Open profile'}</Text>
              <MaterialCommunityIcons name={isRtl ? 'arrow-left' : 'arrow-right'} size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Card>
        ) : (
          <Card variant="elevated" style={styles.composer}>
          <View style={[styles.composerHeader, isRtl && rtlStyles.rtlRow]}>
            <View style={styles.composerIcon}>
              <MaterialCommunityIcons name="feather" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.composerTitle, isRtl && rtlStyles.rtlText]}>{text.compose}</Text>
          </View>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={text.compose}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={5000}
            textAlignVertical="top"
            style={[styles.input, isRtl && rtlStyles.rtlText]}
            accessibilityLabel={text.compose}
          />
          <View style={[styles.composerFooter, isRtl && rtlStyles.rtlRow]}>
            <Text style={styles.counter}>{draft.length}/5000</Text>
            <TouchableOpacity
              onPress={publish}
              disabled={!draft.trim() || publishing}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={[styles.publishButton, (!draft.trim() || publishing) && styles.disabledButton, isRtl && rtlStyles.rtlRow]}
            >
              {publishing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />}
              <Text style={styles.publishText}>{publishing ? text.publishing : text.publish}</Text>
            </TouchableOpacity>
          </View>
        </Card>
        )}

        {isAuthenticated ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.categories, isRtl && rtlStyles.rtlRow]}>
          {CATEGORIES.map((item) => (
            <CategoryPill key={item} label={categoryLabel(item, language)} selected={category === item} onPress={() => setCategory(item)} />
          ))}
        </ScrollView> : null}

        {isAuthenticated && interactionError ? <Text style={styles.errorText}>{interactionError}</Text> : null}
        {isAuthenticated && error ? <View style={styles.errorBox}><Text style={styles.errorText}>{text.loadError}</Text><TouchableOpacity onPress={refresh}><Text style={styles.retry}>{text.send}</Text></TouchableOpacity></View> : null}

        {!isAuthenticated ? null : loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : posts.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="sprout-outline" size={38} color={colors.textMuted} />
            <Text style={styles.emptyText}>{text.empty}</Text>
          </View>
        ) : posts.map((post) => (
          <Card key={post.id} variant="elevated" style={styles.postCard}>
            <View style={[styles.postHeader, isRtl && rtlStyles.rtlRow]}>
              <View style={styles.avatar}><MaterialCommunityIcons name="account" size={20} color={colors.primaryDark} /></View>
              <View style={styles.authorBlock}>
                <Text style={[styles.authorName, isRtl && rtlStyles.rtlText]}>{post.author?.full_name || text.role}</Text>
                <Text style={[styles.authorMeta, isRtl && rtlStyles.rtlText]}>{[post.author?.role, post.author?.governorate].filter(Boolean).join(' · ') || text.role} · {new Date(post.created_at).toLocaleDateString(language)}</Text>
              </View>
              <Badge label={categoryLabel((CATEGORIES.includes(post.category as CommunityCategory) ? post.category : 'general') as CommunityCategory, language)} variant="secondary" size="sm" />
            </View>
            <Text style={[styles.postContent, isRtl && rtlStyles.rtlText]}>{post.content}</Text>
            <View style={[styles.postActions, isRtl && rtlStyles.rtlRow]}>
              <TouchableOpacity onPress={() => toggleLike(post)} activeOpacity={0.8} style={[styles.action, isRtl && rtlStyles.rtlRow]}>
                <MaterialCommunityIcons name={post.liked_by_me ? 'heart' : 'heart-outline'} size={19} color={post.liked_by_me ? colors.danger : colors.textSecondary} />
                <Text style={styles.actionText}>{post.likes_count}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleComments(post.id)} activeOpacity={0.8} style={[styles.action, isRtl && rtlStyles.rtlRow]}>
                <MaterialCommunityIcons name="comment-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.actionText}>{post.comments_count} · {text.comments}</Text>
              </TouchableOpacity>
            </View>

            {expandedPost === post.id ? (
              <View style={styles.commentsBox}>
                {(comments[post.id] ?? []).map((comment) => (
                  <View key={comment.id} style={styles.comment}>
                    <Text style={[styles.commentAuthor, isRtl && rtlStyles.rtlText]}>{comment.author?.full_name || text.role}</Text>
                    <Text style={[styles.commentContent, isRtl && rtlStyles.rtlText]}>{comment.content}</Text>
                  </View>
                ))}
                {(comments[post.id] ?? []).length === 0 ? <Text style={styles.emptyComment}>{text.noComments}</Text> : null}
                <View style={[styles.commentComposer, isRtl && rtlStyles.rtlRow]}>
                  <TextInput
                    value={commentDraft}
                    onChangeText={setCommentDraft}
                    placeholder={text.addComment}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.commentInput, isRtl && rtlStyles.rtlText]}
                    maxLength={2000}
                  />
                  <TouchableOpacity onPress={() => sendComment(post.id)} disabled={!commentDraft.trim() || sendingComment} style={styles.sendButton} accessibilityRole="button">
                    {sendingComment ? <ActivityIndicator size="small" color="#FFFFFF" /> : <MaterialCommunityIcons name="send" size={17} color="#FFFFFF" />}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  backText: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium },
  content: { paddingBottom: spacing['3xl'], gap: spacing.md },
  loginCard: { alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  loginText: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, textAlign: 'center', lineHeight: 22 },
  composer: { padding: spacing.md, gap: spacing.md },
  composerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  composerIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  composerTitle: { flex: 1, color: colors.text, fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold },
  input: { minHeight: 104, maxHeight: 180, backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, color: colors.text, fontSize: typography.fontSizes.sm, lineHeight: 22 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { color: colors.textMuted, fontSize: typography.fontSizes.xs },
  publishButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  disabledButton: { opacity: 0.45 },
  publishText: { color: '#FFFFFF', fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
  categories: { gap: spacing.xs, paddingVertical: spacing.xs },
  errorText: { color: colors.danger, fontSize: typography.fontSizes.xs, lineHeight: 18 },
  errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  retry: { color: colors.primaryDark, fontWeight: typography.fontWeights.bold },
  loading: { paddingVertical: spacing['3xl'], alignItems: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, textAlign: 'center' },
  postCard: { padding: spacing.md, gap: spacing.md },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  authorBlock: { flex: 1 },
  authorName: { color: colors.text, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold },
  authorMeta: { color: colors.textMuted, fontSize: typography.fontSizes.xs, marginTop: 2 },
  postContent: { color: colors.text, fontSize: typography.fontSizes.sm, lineHeight: 23 },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 36 },
  actionText: { color: colors.textSecondary, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.medium },
  commentsBox: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm, gap: spacing.sm },
  comment: { backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  commentAuthor: { color: colors.text, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold },
  commentContent: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, lineHeight: 20 },
  emptyComment: { color: colors.textMuted, fontSize: typography.fontSizes.xs },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  commentInput: { flex: 1, minHeight: 44, backgroundColor: colors.surfaceSubtle, borderRadius: radius.full, paddingHorizontal: spacing.md, color: colors.text, fontSize: typography.fontSizes.sm },
  sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
});
