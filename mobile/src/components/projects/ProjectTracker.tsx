import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { rtlStyles } from '../../theme/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme/colors';
import { rowGapSm, spaceBetween, stackSm, stackedCard } from '../../theme/layout';
import {
  cardHeading,
  labelSemibold,
  mutedCaptionTop,
  subtitleMetaSm,
  titleSmSemibold,
} from '../../theme/typographyStyles';
import { useLanguage } from '../../context/LanguageContext';
import { getProjects } from '../../i18n/projects';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { FormField } from '../ui/FormField';
import { StateView } from '../ui/StateView';
import { ProvenanceBar } from '../ui/ProvenanceBar';
import { createProjectTask, getProjectTasks, updateProjectTask } from '../../api/client';
import { FarmTask, FarmTaskPriority, FarmTaskType, ProvenanceMeta } from '../../types';
import {
  taskPriorityLabel,
  taskPriorityOptions,
  taskStatusLabel,
  taskTypeLabel,
  taskTypeOptions,
} from '../../utils/projectLabels';

interface ProjectTrackerProps {
  farmId: string;
  cultivationId?: string;
}

/** A task's status pill: honest colour by lifecycle state, never by guess. */
function statusVariant(status: string): 'success' | 'warning' | 'secondary' | 'danger' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Daily tracking for one project. Tasks are persisted server-side
 * (`farm_tasks`, farmer-role guarded). A 403 is surfaced as an explicit
 * "not available for this account" state, not as a red failure — the backend
 * genuinely restricts these writes by role.
 */
export const ProjectTracker: React.FC<ProjectTrackerProps> = ({ farmId, cultivationId }) => {
  const { x, isRtl, language } = useLanguage();
  const p = useMemo(() => getProjects(language), [language]);

  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [meta, setMeta] = useState<ProvenanceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleBlocked, setRoleBlocked] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<FarmTaskType>('general');
  const [priority, setPriority] = useState<FarmTaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjectTasks({ farmId, cultivationId });
      setTasks(res.data);
      setMeta(res.meta);
      setError(res.error);
      setRoleBlocked(res.roleBlocked);
    } catch {
      setError(p.tasksUnavailable);
    } finally {
      setLoading(false);
    }
  }, [farmId, cultivationId, p.tasksUnavailable]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const submit = async () => {
    if (!title.trim()) {
      setFormError(p.invalidTitle);
      return;
    }
    if (dueDate.trim()) {
      const parsedDate = new Date(dueDate.trim() + 'T00:00:00.000Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim()) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== dueDate.trim()) {
        setFormError(p.invalidDate);
        return;
      }
    }
    setSaving(true);
    setFormError(null);
    let res;
    try {
      res = await createProjectTask({
        farm_id: farmId,
        cultivation_id: cultivationId,
        title: title.trim(),
        task_type: taskType,
        priority,
        due_date: dueDate.trim() || undefined,
      });
    } catch {
      setFormError(p.saveFailed);
      return;
    } finally {
      setSaving(false);
    }
    if (res.roleBlocked) {
      setRoleBlocked(true);
      return;
    }
    if (res.error || !res.data) {
      setFormError(res.error || p.saveFailed);
      return;
    }
    const created = res.data;
    setTasks((prev) => [created, ...prev]);
    setTitle('');
    setDueDate('');
    setTaskType('general');
    setPriority('medium');
    setShowForm(false);
  };

  const toggleDone = async (task: FarmTask) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    setBusyTaskId(task.id);
    setActionError(null);
    try {
      const res = await updateProjectTask(task.id, {
        title: task.title,
        status: nextStatus,
        task_type: task.task_type,
        priority: task.priority,
        due_date: task.due_date,
        description: task.description,
      });
      if (res.roleBlocked) {
        setRoleBlocked(true);
        return;
      }
      if (res.error || !res.data) {
        setActionError(res.error || p.saveFailed);
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data! : t)));
    } catch {
      setActionError(p.saveFailed);
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={[styles.head, isRtl && rtlStyles.rtlRow]}>
        <View style={styles.headText}>
          <Text style={[styles.headTitle, isRtl && rtlStyles.rtlText]}>{p.trackingHeading}</Text>
          <Text style={[styles.headSub, isRtl && rtlStyles.rtlText]}>{p.trackingSubtitle}</Text>
        </View>
        {!roleBlocked ? (
          <TouchableOpacity
            onPress={() => setShowForm((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={p.addTask}
            style={styles.addBtn}
          >
            <MaterialCommunityIcons
              name={showForm ? 'close' : 'plus'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {roleBlocked ? (
        <StateView kind="unavailable" title={p.roleBlockedTitle} message={p.roleBlockedBody} compact />
      ) : loading ? (
        <StateView kind="loading" title={p.trackingHeading} compact />
      ) : error ? (
        <StateView kind="error" message={error} onRetry={load} retryLabel={x.retry} compact />
      ) : (
        <>
          {showForm ? (
            <View style={styles.form}>
              <FormField
                label={p.taskTitle}
                value={title}
                onChangeText={setTitle}
                placeholder={p.taskTitlePlaceholder}
                keyboard="default"
              />
              <Text style={[styles.pickerLabel, isRtl && rtlStyles.rtlText]}>{p.taskType}</Text>
              <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
                {taskTypeOptions(p).map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={taskType === opt.value}
                    onPress={() => setTaskType(opt.value)}
                  />
                ))}
              </View>
              <Text style={[styles.pickerLabel, isRtl && rtlStyles.rtlText]}>{p.taskPriority}</Text>
              <View style={[styles.chipRow, isRtl && rtlStyles.rtlRow]}>
                {taskPriorityOptions(p).map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={priority === opt.value}
                    onPress={() => setPriority(opt.value)}
                  />
                ))}
              </View>
              <FormField
                label={p.taskDueDate}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                hint={p.taskDueDateHint}
                keyboard="default"
              />
              {formError ? (
                <Text style={[styles.formError, isRtl && rtlStyles.rtlText]}>{formError}</Text>
              ) : null}
              <Button
                title={saving ? p.saving : p.saveTask}
                onPress={submit}
                loading={saving}
                disabled={saving}
                fullWidth
              />
            </View>
          ) : null}

          {actionError ? <Text style={[styles.formError, isRtl && rtlStyles.rtlText]}>{actionError}</Text> : null}
          {tasks.length === 0 ? (
            <StateView kind="empty" title={p.noTasks} message={p.noTasksHint} compact />
          ) : (
            <View style={styles.list}>
              {tasks.map((task) => {
                const done = task.status === 'completed';
                return (
                  <View key={task.id} style={[styles.taskRow, isRtl && rtlStyles.rtlRow]}>
                    <TouchableOpacity
                      onPress={() => toggleDone(task)}
                      disabled={busyTaskId === task.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: done }}
                      accessibilityLabel={done ? p.reopen : p.markDone}
                      style={styles.checkbox}
                    >
                      <MaterialCommunityIcons
                        name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={24}
                        color={done ? colors.success : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <View style={styles.taskBody}>
                      <Text
                        style={[
                          styles.taskTitle,
                          done && styles.taskTitleDone,
                          isRtl && rtlStyles.rtlText,
                        ]}
                      >
                        {task.title}
                      </Text>
                      <View style={[styles.taskMeta, isRtl && rtlStyles.rtlRow]}>
                        <Badge label={taskTypeLabel(task.task_type, p)} variant="secondary" size="sm" />
                        <Badge
                          label={taskStatusLabel(task.status, p)}
                          variant={statusVariant(task.status)}
                          size="sm"
                        />
                        <Badge
                          label={taskPriorityLabel(task.priority, p)}
                          variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'secondary'}
                          size="sm"
                        />
                        {task.due_date ? <Text style={styles.due}>{task.due_date}</Text> : null}
                      </View>
                      {task.description?.trim() ? (
                        <View style={styles.descriptionWrap}>
                          <Text
                            style={[styles.taskDescription, isRtl && rtlStyles.rtlText]}
                            numberOfLines={expandedTaskIds[task.id] ? undefined : 3}
                          >
                            {task.description}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setExpandedTaskIds((current) => ({ ...current, [task.id]: !current[task.id] }))}
                            accessibilityRole="button"
                            style={styles.detailsToggle}
                          >
                            <Text style={styles.detailsToggleText}>
                              {expandedTaskIds[task.id]
                                ? (language === 'ar' ? 'عرض أقل' : language === 'fr' ? 'Voir moins' : 'Show less')
                                : (language === 'ar' ? 'التفاصيل كاملة' : language === 'fr' ? 'Voir les détails' : 'View details')}
                            </Text>
                            <MaterialCommunityIcons name={expandedTaskIds[task.id] ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryDark} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {meta && !roleBlocked ? <ProvenanceBar meta={meta} style={styles.provenance} /> : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { ...stackedCard },
  head: { ...spaceBetween, marginBottom: spacing.sm },
  headText: { flex: 1 },
  headTitle: cardHeading,
  headSub: { ...mutedCaptionTop, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  form: { ...stackSm, marginBottom: spacing.md },
  pickerLabel: { ...labelSemibold, marginTop: spacing.sm, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  formError: { ...mutedCaptionTop, color: colors.danger },
  list: { ...stackSm },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: { paddingTop: 2 },
  taskBody: { flex: 1 },
  taskTitle: titleSmSemibold,
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  descriptionWrap: { marginTop: spacing.xs, backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs },
  taskDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  detailsToggle: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 },
  detailsToggleText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  taskMeta: { ...rowGapSm, flexWrap: 'wrap', marginTop: spacing.xs },
  due: { ...subtitleMetaSm, color: colors.textMuted },
  provenance: { marginTop: spacing.sm },
});
