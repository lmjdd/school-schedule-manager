'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, CalendarX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatDate, getRelativeDueDate, getPriorityLabel, getPriorityDotColor } from '@/lib/helpers';
import { useAppStore } from '@/lib/store';
import type { Assignment } from '@/lib/types';

async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch('/api/assignments');
  if (!res.ok) return [];
  return res.json();
}

type TimeGroup = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later';

interface GroupedAssignments {
  label: string;
  icon: string;
  accentClass: string;
  dotClass: string;
  lineClass: string;
  badgeClass: string;
  items: Assignment[];
}

const GROUP_CONFIG: Record<TimeGroup, Omit<GroupedAssignments, 'items' | 'label'>> = {
  overdue: {
    icon: '🔴',
    accentClass: 'text-red-600 dark:text-red-400',
    dotClass: 'bg-red-500 ring-red-200 dark:ring-red-800',
    lineClass: 'border-l-red-300 dark:border-l-red-800',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
  },
  today: {
    icon: '🟡',
    accentClass: 'text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500 ring-amber-200 dark:ring-amber-800',
    lineClass: 'border-l-amber-300 dark:border-l-amber-800',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
  },
  tomorrow: {
    icon: '🟠',
    accentClass: 'text-orange-600 dark:text-orange-400',
    dotClass: 'bg-orange-500 ring-orange-200 dark:ring-orange-800',
    lineClass: 'border-l-orange-300 dark:border-l-orange-800',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
  },
  thisWeek: {
    icon: '🔵',
    accentClass: 'text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500 ring-blue-200 dark:ring-blue-800',
    lineClass: 'border-l-blue-300 dark:border-l-blue-800',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  },
  later: {
    icon: '⚪',
    accentClass: 'text-muted-foreground',
    dotClass: 'bg-muted-foreground/40 ring-muted-foreground/20',
    lineClass: 'border-l-border',
    badgeClass: 'bg-muted text-muted-foreground',
  },
};

const GROUP_LABELS: Record<TimeGroup, string> = {
  overdue: '已逾期',
  today: '今天截止',
  tomorrow: '明天截止',
  thisWeek: '本周内',
  later: '稍后',
};

const MAX_VISIBLE_ITEMS = 12;

function getTimeGroup(dueDate: string | null): TimeGroup {
  if (!dueDate) return 'later';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate);
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const todayMs = todayStart.getTime();
  const dueMs = dueStart.getTime();
  const tomorrowMs = todayMs + 24 * 60 * 60 * 1000;
  const weekEndMs = todayMs + 7 * 24 * 60 * 60 * 1000;

  if (dueMs < todayMs) return 'overdue';
  if (dueMs === todayMs) return 'today';
  if (dueMs === tomorrowMs) return 'tomorrow';
  if (dueMs < weekEndMs) return 'thisWeek';
  return 'later';
}

function groupAssignments(assignments: Assignment[]): GroupedAssignments[] {
  const groups: Record<TimeGroup, Assignment[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };

  for (const a of assignments) {
    const group = getTimeGroup(a.dueDate);
    groups[group].push(a);
  }

  // Sort within each group by dueDate
  for (const key of Object.keys(groups) as TimeGroup[]) {
    groups[key].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  const orderedGroups: TimeGroup[] = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later'];
  return orderedGroups
    .filter((key) => groups[key].length > 0)
    .map((key) => ({
      ...GROUP_CONFIG[key],
      label: GROUP_LABELS[key],
      items: groups[key],
    }));
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="w-0.5 h-12 mt-1" />
          </div>
          <div className="flex-1 space-y-1.5 py-0.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function TimelineEntry({
  assignment,
  index,
  group,
  isFirstInGroup,
  isLastInGroup,
  isLastOverall,
}: {
  assignment: Assignment;
  index: number;
  group: GroupedAssignments;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isLastOverall: boolean;
}) {
  const relativeTime = assignment.dueDate ? getRelativeDueDate(assignment.dueDate) : '';
  const priorityLabel = getPriorityLabel(assignment.priority);
  const priorityDotColor = getPriorityDotColor(assignment.priority);
  const courseColor = assignment.course?.color || '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className="flex items-start gap-3 group"
    >
      {/* Timeline track */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        {/* Dot */}
        <div
          className={cn(
            'size-3 rounded-full ring-[3px] shrink-0 z-10 transition-transform group-hover:scale-125',
            group.dotClass,
          )}
        />
        {/* Connecting line */}
        {!isLastOverall && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[16px] mt-1',
              group.lineClass,
              isLastInGroup && 'border-l border-dashed',
              !isLastInGroup && 'bg-border/40',
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 min-w-0 pb-3',
        isLastOverall && 'pb-0',
      )}>
        <div className="flex items-start gap-2">
          {/* Course color indicator */}
          <div
            className="size-2 rounded-full shrink-0 mt-1.5 ring-1 ring-offset-1 ring-offset-background"
            style={{ backgroundColor: courseColor }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-medium truncate leading-snug',
              group.accentClass,
            )}>
              {assignment.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {assignment.course && (
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {assignment.course.name}
                </span>
              )}
              {assignment.course && assignment.dueDate && (
                <span className="text-muted-foreground/40 text-[10px]">·</span>
              )}
              {assignment.dueDate && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums font-mono">
                  <CalendarX className="size-2.5 shrink-0 opacity-60" />
                  {formatDate(assignment.dueDate, 'MM/dd')}
                </span>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {relativeTime && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 font-normal border-0',
                  group.badgeClass,
                )}
              >
                <Clock className="size-2.5 mr-0.5 opacity-70" />
                {relativeTime}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-normal border-0"
            >
              <span className={cn('size-1.5 rounded-full', priorityDotColor)} />
              {priorityLabel}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AssignmentTimeline() {
  const { setCurrentPage } = useAppStore();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });

  const upcomingAssignments = useMemo(() => {
    return assignments.filter((a) => a.status !== 'completed');
  }, [assignments]);

  const grouped = useMemo(() => {
    return groupAssignments(upcomingAssignments);
  }, [upcomingAssignments]);

  const totalVisible = useMemo(() => {
    let count = 0;
    for (const group of grouped) {
      if (count + group.items.length > MAX_VISIBLE_ITEMS) {
        count = MAX_VISIBLE_ITEMS;
        break;
      }
      count += group.items.length;
    }
    return count;
  }, [grouped]);

  // Calculate flat index for stagger animation
  let globalIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>⏰</span>
          <span>近期截止时间线</span>
          {upcomingAssignments.length > 0 && (
            <Badge variant="secondary" className="tabular-nums font-mono text-xs">
              {upcomingAssignments.length}
            </Badge>
          )}
        </h3>
        {upcomingAssignments.length > 0 && (
          <button
            onClick={() => setCurrentPage('assignments')}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group/link"
          >
            查看全部
            <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <TimelineSkeleton />
      ) : upcomingAssignments.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          <div className="flex items-center justify-center mb-3">
            <div className="size-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center animate-float">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
          <p className="text-sm font-medium">没有待完成的作业</p>
          <p className="text-xs mt-1 opacity-60">所有作业都已按时完成</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[420px]">
          <div className="-mx-1 px-1">
            {grouped.map((group, groupIdx) => {
              const isLastGroup = groupIdx === grouped.length - 1;
              let remaining = MAX_VISIBLE_ITEMS - globalIndex;
              const visibleItems = group.items.slice(0, Math.max(0, remaining));

              if (visibleItems.length === 0) return null;

              const isFirst = globalIndex === 0;

              return (
                <div key={group.label}>
                  {/* Group header */}
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: globalIndex * 0.05 }}
                    className="flex items-center gap-2 mb-2 mt-2 first:mt-0"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {group.icon} {group.label}
                    </span>
                    <span className={cn(
                      'text-[10px] font-mono tabular-nums px-1.5 py-0 rounded-full',
                      group.badgeClass,
                    )}>
                      {group.items.length}
                    </span>
                  </motion.div>

                  {/* Timeline entries */}
                  <div className="relative">
                    {/* Background line - only for groups that are not the last */}
                    {!isFirst && (
                      <div className="absolute left-[5px] top-0 bottom-0 w-0 bg-border/30 -translate-y-1/2" />
                    )}

                    {visibleItems.map((assignment, itemIdx) => {
                      const idx = globalIndex;
                      globalIndex++;

                      const isLastInGroup = itemIdx === visibleItems.length - 1;
                      const isLastOverall = idx >= totalVisible - 1 || (isLastGroup && isLastInGroup);

                      return (
                        <TimelineEntry
                          key={assignment.id}
                          assignment={assignment}
                          index={idx}
                          group={group}
                          isFirstInGroup={itemIdx === 0}
                          isLastInGroup={isLastInGroup}
                          isLastOverall={isLastOverall}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* "Show more" indicator if truncated */}
            {upcomingAssignments.length > MAX_VISIBLE_ITEMS && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="text-center pt-3 mt-2 border-t border-border/30"
              >
                <button
                  onClick={() => setCurrentPage('assignments')}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  还有 {upcomingAssignments.length - MAX_VISIBLE_ITEMS} 项...
                  <ArrowRight className="size-3" />
                </button>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}
