'use client';

import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { formatDate, getDaysUntil, cn } from '@/lib/helpers';
import type { Assignment } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';

async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch('/api/assignments');
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

const MAX_ITEMS = 8;

function DeadlinesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
          <Skeleton className="size-5 rounded-md mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function CountdownBadge({ days }: { days: number }) {
  const isOverdue = days < 0;
  const isUrgent = days >= 0 && days <= 2;
  const isSoon = days >= 0 && days <= 5;

  return (
    <span
      className={cn(
        'text-xs font-medium tabular-nums font-mono',
        isOverdue && 'text-red-600',
        !isOverdue && isUrgent && 'text-orange-600',
        !isOverdue && !isUrgent && isSoon && 'text-amber-600',
        !isOverdue && !isUrgent && !isSoon && 'text-muted-foreground',
      )}
    >
      {isOverdue
        ? `逾期 ${Math.abs(days)} 天`
        : days === 0
          ? '今天截止'
          : `还剩 ${days} 天`}
    </span>
  );
}

export function UpcomingDeadlines() {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });

  const toggleMutation = useMutation({
    mutationFn: async (assignment: Assignment) => {
      const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assignment, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update assignment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('状态已更新');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const upcomingAssignments = useMemo(() => {
    return assignments
      .filter((a) => a.status !== 'completed')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, MAX_ITEMS);
  }, [assignments]);

  const pendingCount = useMemo(() => {
    return assignments.filter((a) => a.status !== 'completed').length;
  }, [assignments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>📋</span>
          <span>近期待办</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="tabular-nums font-mono text-xs">
              {pendingCount}
            </Badge>
          )}
        </h3>
      </div>

      {/* Content */}
      {isLoading ? (
        <DeadlinesSkeleton />
      ) : upcomingAssignments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center mb-3">
            <div className="size-14 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-950/40 flex items-center justify-center animate-float">
              <span className="text-2xl">✨</span>
            </div>
          </div>
          <p>没有待办事项</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[340px] -mx-1 px-1">
          <div className="space-y-1">
            {upcomingAssignments.map((assignment, index) => {
              const isOverdue = assignment.status === 'overdue';
              const daysUntil = assignment.dueDate ? getDaysUntil(assignment.dueDate) : null;

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors group',
                    isOverdue && 'bg-red-50/50 dark:bg-red-950/20',
                  )}
                >
                  {/* Status toggle button */}
                  <button
                    onClick={() => toggleMutation.mutate(assignment)}
                    disabled={toggleMutation.isPending}
                    className={cn(
                      'mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
                      isOverdue
                        ? 'border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/40'
                        : 'border-border hover:border-primary/40',
                      toggleMutation.isPending && 'opacity-50 cursor-wait',
                    )}
                    aria-label={
                      isOverdue
                        ? '标记为已完成'
                        : '切换完成状态'
                    }
                  >
                    {isOverdue && <AlertTriangle className="size-3 text-red-500" />}
                  </button>

                  {/* Assignment info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        isOverdue ? 'text-red-700 dark:text-red-400' : 'text-foreground',
                      )}
                    >
                      {assignment.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {assignment.course && (
                        <span className="text-xs text-muted-foreground truncate">
                          {assignment.course.name}
                        </span>
                      )}
                      {assignment.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" />
                          <span className="font-mono tabular-nums">
                            {formatDate(assignment.dueDate, 'MM/dd')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Countdown / Status */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {daysUntil !== null && <CountdownBadge days={daysUntil} />}
                    <Badge
                      className={cn(
                        'text-[10px] px-1.5 py-0 cursor-default',
                        isOverdue
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : assignment.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200',
                      )}
                      variant="outline"
                    >
                      {STATUS_LABELS[assignment.status] || assignment.status}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}
