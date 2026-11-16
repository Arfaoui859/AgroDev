import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getCommunityPosts, CommunityPost } from '../../api/client';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/SectionHeader';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { rtlStyles } from '../../theme/rtl';

interface HomeCommunityPreviewProps {
  onOpenCommunity: () => void;
  onOpenProfile: () => void;
}

export const HomeCommunityPreview: React.FC<HomeCommunityPreviewProps> = ({ onOpenCommunity, onOpenProfile }) => {
  const { isAuthenticated } = useAuth();
  const { language, isRtl } = useLanguage();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setPosts([]);
      return () => { active = false; };
    }
    setLoading(true);
    getCommunityPosts().then((result) => {
      if (active) setPosts(result.data.slice(0, 2));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [isAuthenticated]);

  const labels = language === 'ar'
    ? { title: 'من المجتمع الفلاحي', subtitle: 'تجارب وأسئلة من أعضاء AgriVibe', join: 'اكتشف المجتمع', signIn: 'سجّل الدخول للمشاركة', empty: 'ما فماش منشورات جديدة توّة', comments: 'تعليقات', likes: 'إعجاب' }
    : language === 'fr'
      ? { title: 'Communauté agricole', subtitle: 'Expériences et questions des membres', join: 'Découvrir la communauté', signIn: 'Connectez-vous pour participer', empty: 'Pas encore de nouvelles publications', comments: 'commentaires', likes: 'J’aime' }
      : { title: 'From the community', subtitle: 'Experiences and questions from AgriVibe members', join: 'Explore community', signIn: 'Sign in to participate', empty: 'No new posts yet', comments: 'comments', likes: 'likes' };

  return (
    <View style={styles.section}>
      <SectionHeader title={labels.title} subtitle={labels.subtitle} actionLabel={labels.join} onAction={onOpenCommunity} />
      {!isAuthenticated ? (
        <Card variant="outlined" style={styles.invite}>
          <MaterialCommunityIcons name="account-group-outline" size={26} color={colors.primary} />
          <Text style={[styles.inviteText, isRtl && rtlStyles.rtlText]}>{labels.signIn}</Text>
          <TouchableOpacity onPress={onOpenProfile} style={styles.actionButton} accessibilityRole="button">
            <Text style={styles.actionText}>{language === 'ar' ? 'الملف الشخصي' : language === 'fr' ? 'Profil' : 'Profile'}</Text>
            <MaterialCommunityIcons name={isRtl ? 'arrow-left' : 'arrow-right'} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Card>
      ) : loading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : posts.length ? (
        posts.map((post) => (
          <TouchableOpacity key={post.id} activeOpacity={0.85} onPress={onOpenCommunity}>
            <Card variant="elevated" style={styles.post}>
              <View style={[styles.postTop, isRtl && rtlStyles.rtlRow]}>
                <View style={styles.avatar}><MaterialCommunityIcons name="account" size={16} color={colors.primaryDark} /></View>
                <Text style={styles.author} numberOfLines={1}>{post.author?.full_name || (language === 'ar' ? 'عضو في المجتمع' : 'Community member')}</Text>
                <Text style={styles.meta}>{post.likes_count} ♥</Text>
              </View>
              <Text style={[styles.postText, isRtl && rtlStyles.rtlText]} numberOfLines={3}>{post.content}</Text>
              <Text style={styles.meta}>{post.comments_count} {labels.comments}</Text>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <TouchableOpacity onPress={onOpenCommunity} activeOpacity={0.85}>
          <Card variant="outlined" style={styles.empty}>
            <MaterialCommunityIcons name="sprout-outline" size={24} color={colors.primary} />
            <Text style={styles.emptyText}>{labels.empty}</Text>
          </Card>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  invite: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  inviteText: { flex: 1, minWidth: 140, color: colors.textSecondary, fontSize: typography.fontSizes.sm },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionText: { color: '#FFFFFF', fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold },
  loading: { paddingVertical: spacing.lg, alignItems: 'center' },
  post: { padding: spacing.md, gap: spacing.sm },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  author: { flex: 1, color: colors.text, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold },
  meta: { color: colors.textMuted, fontSize: typography.fontSizes.xs },
  postText: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, lineHeight: 21 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: typography.fontSizes.sm },
});
