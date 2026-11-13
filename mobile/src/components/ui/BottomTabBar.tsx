import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

export type TabKey = 'home' | 'services' | 'assistant' | 'marketplace' | 'profile';

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const { t, isRtl } = useLanguage();

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    badge?: boolean;
  }> = [
    { key: 'home', label: t.navHome, icon: 'home-variant' },
    { key: 'services', label: t.navServices, icon: 'grid-large' },
    { key: 'assistant', label: t.navAssistant, icon: 'robot', badge: true },
    { key: 'marketplace', label: t.navMarketplace, icon: 'storefront' },
    { key: 'profile', label: t.navProfile, icon: 'account-circle' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.inner, isRtl && styles.rtlRow]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isAssistant = tab.key === 'assistant';

          if (isAssistant) {
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => onTabChange(tab.key)}
                style={styles.assistantTabItem}
              >
                <View style={[styles.assistantButton, isActive && styles.assistantButtonActive]}>
                  <MaterialCommunityIcons name="robot-outline" size={26} color={colors.textInverse} />
                </View>
                <Text
                  style={[
                    styles.assistantLabel,
                    { color: isActive ? colors.primary : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onTabChange(tab.key)}
              style={styles.tabItem}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={24}
                  color={isActive ? colors.primary : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                  isActive && styles.activeTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  iconWrapper: {
    padding: 2,
    borderRadius: radius.md,
  },
  activeIconWrapper: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontWeight: typography.fontWeights.normal,
  },
  activeTabLabel: {
    fontWeight: typography.fontWeights.bold,
  },
  assistantTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16, // Prominent floating center action
  },
  assistantButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  assistantButtonActive: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 1.05 }],
  },
  assistantLabel: {
    fontSize: typography.fontSizes.xs,
    marginTop: 3,
    fontWeight: typography.fontWeights.bold,
  },
});
