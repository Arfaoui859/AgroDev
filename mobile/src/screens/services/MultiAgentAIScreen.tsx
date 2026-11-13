import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiRequest } from '../../api/client';
import { AIAgentInfo } from '../../types';

interface MultiAgentAIScreenProps {
  onBack: () => void;
  onLaunchAgent?: (agentId: string) => void;
}

export const MultiAgentAIScreen: React.FC<MultiAgentAIScreenProps> = ({
  onBack,
  onLaunchAgent,
}) => {
  const { t, isRtl } = useLanguage();
  const [agents, setAgents] = useState<AIAgentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'specialists'>('all');

  const defaultAgents: AIAgentInfo[] = [
    {
      id: 'soil_analysis',
      name: 'Soil Analysis Specialist',
      nameAr: 'وكيل تحليل التربة والتسميد',
      role: 'Chemical and spectral soil evaluation & AFSIS ML models',
      roleAr: 'تحليل تركيز NPK، درجة الحموضة pH، وتقدير الكربون العضوي',
      status: 'active',
      port: 8001,
      engine: 'Scikit-Learn (AFSIS) + Heuristic Rules',
      provenance: 'Rule-based expert knowledge & trained spatial soil models',
      provenanceAr: 'قواعد زراعية خبيرة ونماذج AFSIS للتربة',
    },
    {
      id: 'crop_recommendation',
      name: 'Crop Matcher & Economics Agent',
      nameAr: 'وكيل مطابقة واقتراح المحاصيل',
      role: 'Climate-soil crop compatibility and financial return estimates',
      roleAr: 'مطابقة المحاصيل مع الظروف المناخية وحساب هوامش الربح',
      status: 'active',
      port: 8002,
      engine: 'AgroKnowledge Engine (Tunisia)',
      provenance: 'Tunisian agronomic suitability dataset',
      provenanceAr: 'قاعدة بيانات الأصناف الزراعية التونسية',
    },
    {
      id: 'image_diagnosis',
      name: 'Computer Vision Plant Doctor',
      nameAr: 'وكيل التشخيص البصري للأمراض',
      role: 'Multimodal leaf scanning and visual symptom classification',
      roleAr: 'فحص صور أوراق النباتات وتحديد الأمراض الفطرية والحشرية',
      status: 'active',
      port: 8003,
      engine: 'Google Gemini Multimodal / Heuristic Vision',
      provenance: 'Configured vision provider with disease catalog',
      provenanceAr: 'نموذج رؤية حاسوبية مدعوم بدليل الأمراض النباتية',
    },
    {
      id: 'market_prediction',
      name: 'Market Intelligence Agent',
      nameAr: 'وكيل ذكاء السوق والأسعار',
      role: 'Commodity price tracking and regional wholesale analytics',
      roleAr: 'رصد أسعار السلع الفلاحية وتتبع مؤشرات العرض والطلب',
      status: 'active',
      port: 8004,
      engine: 'Market Trend Analyzer',
      provenance: 'Tunisian wholesale markets reference data',
      provenanceAr: 'بيانات أسواق الجملة التونسية',
    },
    {
      id: 'intelligent_agent',
      name: 'Agricultural Dialogue Assistant',
      nameAr: 'وكيل الحوار والإرشاد الزراعي',
      role: 'Dialect-aware conversational agronomist chatbot',
      roleAr: 'مستشار زراعي يفهم اللهجة التونسية ويقدم إرشادات الحقل',
      status: 'active',
      port: 8005,
      engine: 'Conversational LLM + Tunisian Agronomy Base',
      provenance: 'Multi-lingual agricultural LLM with safety filters',
      provenanceAr: 'نموذج لغوي زراعي ذكي مع فلاتر أمان',
    },
    {
      id: 'weather_yield_intelligence',
      name: 'Weather & Yield Forecaster',
      nameAr: 'وكيل الطقس وتوقعات الإنتاجية',
      role: 'Micro-climate monitoring and seasonal planning',
      roleAr: 'متابعة تقلبات الطقس والتنبيه بالصقيع والرياح الشهيلي',
      status: 'active',
      port: 8006,
      engine: 'Open-Meteo API + Yield Planner',
      provenance: 'Live meteorological stations & planning rules',
      provenanceAr: 'محطات الرصد الجوي التونسية ونماذج التخطيط',
    },
    {
      id: 'pest_control',
      name: 'Integrated Pest Management Agent',
      nameAr: 'وكيل الإدارة المتكاملة للآفات',
      role: 'Biological and chemical pest treatments',
      roleAr: 'تحديد بروتوكولات مكافحة الحشرات والفطريات',
      status: 'active',
      port: 8007,
      engine: 'Pest IPM Engine',
      provenance: 'Approved agricultural treatment standards',
      provenanceAr: 'المعايير المعتمدة لحماية النباتات',
    },
    {
      id: 'irrigation_optimization',
      name: 'Water Balance & Irrigation Agent',
      nameAr: 'وكيل تحسين وترشيد مياه الري',
      role: 'Evapotranspiration and crop water schedule optimization',
      roleAr: 'حساب البخر-نتح وجدولة الري بالتنقيط لتوفير المياه',
      status: 'active',
      port: 8008,
      engine: 'Water Balance Scheduler',
      provenance: 'FAO-56 water requirements formula',
      provenanceAr: 'معادلة الفاو (FAO-56) للاحتياجات المائية',
    },
  ];

  const loadCapabilities = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any>('/api/ai/capabilities');
      if (res.isOnline && res.data && Array.isArray(res.data.capabilities)) {
        // Map backend capabilities
        const mapped = defaultAgents.map((ag) => {
          const found = res.data.capabilities.find((c: any) => c.id.includes(ag.id.replace('_', '-')));
          if (found) {
            return {
              ...ag,
              status: found.engine !== 'unavailable' ? ('active' as const) : ('standby' as const),
              provenance: found.provenance || ag.provenance,
              provenanceAr: found.provenanceAr || ag.provenanceAr,
            };
          }
          return ag;
        });
        setAgents(mapped);
      } else {
        setAgents(defaultAgents);
      }
    } catch {
      setAgents(defaultAgents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapabilities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCapabilities();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header Info */}
      <View style={styles.headerBox}>
        <View style={[styles.titleRow, isRtl && styles.rtlRow]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="brain" size={28} color={colors.primary} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.mainTitle, isRtl && styles.rtlText]}>
              منظومة الوكلاء الأذكياء المتعددين
            </Text>
            <Text style={[styles.mainSub, isRtl && styles.rtlText]}>
              شبكة من 8 وكلاء ذكاء اصطناعي متخصصين يعملون بتكامل لدعم كافة القرارات الزراعية
            </Text>
          </View>
        </View>
      </View>

      {/* Orchestrator Architecture Card */}
      <Card variant="elevated" style={styles.orchestratorCard}>
        <View style={[styles.orchHeader, isRtl && styles.rtlRow]}>
          <MaterialCommunityIcons name="sitemap" size={24} color={colors.primary} />
          <Text style={[styles.orchTitle, isRtl && styles.rtlText]}>
            الموجّه والموزّع الذكي (AI Orchestrator)
          </Text>
          <Badge label="بنية نشطة" variant="success" size="sm" />
        </View>
        <Text style={[styles.orchDesc, isRtl && styles.rtlText]}>
          يحلل هذا النظام نوع الطلب الفلاحي، ويوجّهه فورياً إلى الوكيل المتخصص (تحليل تربة، فحص أمراض بالرؤية، طقس، ري، أو أسعار) ثم يدمج النتائج لتقديم توصية فلاحية موحدة وموثوقة.
        </Text>
      </Card>

      {/* Agents Counter */}
      <View style={[styles.counterRow, isRtl && styles.rtlRow]}>
        <Text style={styles.counterText}>
          الوكلاء المتخصصون المتاحون ({agents.length} وكلاء)
        </Text>
        <Badge label="شفافية البيانات 100%" variant="primary" size="sm" />
      </View>

      {/* Agents Cards List */}
      <View style={styles.agentList}>
        {agents.map((agent) => (
          <Card key={agent.id} variant="elevated" style={styles.agentCard}>
            <View style={[styles.agentHeader, isRtl && styles.rtlRow]}>
              <View style={styles.agentIconBox}>
                <MaterialCommunityIcons
                  name={
                    agent.id === 'soil_analysis'
                      ? 'flask-outline'
                      : agent.id === 'crop_recommendation'
                        ? 'sprout'
                        : agent.id === 'image_diagnosis'
                          ? 'camera-iris'
                          : agent.id === 'market_prediction'
                            ? 'chart-line'
                            : agent.id === 'intelligent_agent'
                              ? 'robot'
                              : agent.id === 'weather_yield_intelligence'
                                ? 'weather-partly-cloudy'
                                : agent.id === 'pest_control'
                                  ? 'bug'
                                  : 'water-pump'
                  }
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View style={styles.agentTitleArea}>
                <Text style={[styles.agentNameAr, isRtl && styles.rtlText]}>{agent.nameAr}</Text>
                <Text style={[styles.agentNameEn, isRtl && styles.rtlText]}>{agent.name}</Text>
              </View>

              <Badge
                label={agent.status === 'active' ? 'نشط' : 'جاهز'}
                variant={agent.status === 'active' ? 'success' : 'secondary'}
                size="sm"
              />
            </View>

            <Text style={[styles.agentRoleText, isRtl && styles.rtlText]}>{agent.roleAr}</Text>

            {/* Technical Provenance Disclosure */}
            <View style={styles.provenanceBox}>
              <View style={[styles.provRow, isRtl && styles.rtlRow]}>
                <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
                <Text style={styles.provTitle}>مصدر وطبيعة البيانات (Data Provenance):</Text>
              </View>
              <Text style={[styles.provDetail, isRtl && styles.rtlText]}>{agent.provenanceAr}</Text>
              <Text style={[styles.engineText, isRtl && styles.rtlText]}>
                المحرك: {agent.engine} • المنفذ: :{agent.port}
              </Text>
            </View>

            {/* Launch Action */}
            <Button
              title="تفعيل واستخدام الوكيل"
              variant="outline"
              size="md"
              onPress={() => onLaunchAgent?.(agent.id)}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ))}
      </View>

      <Button
        title={t.back}
        variant="secondary"
        onPress={onBack}
        style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  headerBox: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  mainSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  orchestratorCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  orchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  orchTitle: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  orchDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  counterText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  agentList: {
    gap: spacing.md,
  },
  agentCard: {
    padding: spacing.md,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  agentIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentTitleArea: {
    flex: 1,
  },
  agentNameAr: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  agentNameEn: {
    fontSize: 10,
    color: colors.textMuted,
  },
  agentRoleText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  provenanceBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  provRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  provTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  provDetail: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
  },
  engineText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
