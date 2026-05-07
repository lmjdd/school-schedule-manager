'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Armchair, Pencil, Trash2, Clock, AlertTriangle, Plus, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate, getDaysUntil, cn, getExamCountdown } from '@/lib/helpers';
import { EXAM_TYPES } from '@/lib/types';
import type { Exam } from '@/lib/types';
import { toast } from 'sonner';

interface ExamListProps {
  onEdit: (exam: Exam) => void;
  onAdd?: () => void;
}

async function fetchExams(): Promise<Exam[]> {
  const res = await fetch('/api/exams');
  if (!res.ok) throw new Error('Failed to fetch exams');
  return res.json();
}

const EXAM_TYPE_COLORS: Record<string, string> = {
  '期中考试': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40',
  '期末考试': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40',
  '随堂测验': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800/40',
  '模拟考试': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/40',
};

const EXAM_TYPE_DOT_COLORS: Record<string, string> = {
  '期中考试': 'bg-amber-500',
  '期末考试': 'bg-red-500',
  '随堂测验': 'bg-sky-500',
  '模拟考试': 'bg-violet-500',
};

const URGENCY_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  critical: { bg: 'bg-red-100/80 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
  warning: { bg: 'bg-amber-100/80 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', icon: Timer },
  normal: { bg: 'bg-emerald-100/80 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', icon: Clock },
  past: { bg: 'bg-muted/60', text: 'text-muted-foreground', icon: Clock },
};

function ExamCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-5 rounded-lg border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="pt-2 border-t border-border/30 flex justify-end gap-1">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CountdownBadge({ date }: { date: string }) {
  const [countdown, setCountdown] = useState(getExamCountdown(date));

  useEffect(() => {
    // Update every 60 seconds for live countdown
    const interval = setInterval(() => {
      setCountdown(getExamCountdown(date));
    }, 60000);
    return () => clearInterval(interval);
  }, [date]);

  const style = URGENCY_STYLES[countdown.urgent];
  const Icon = style.icon;

  if (countdown.urgent === 'past') {
    return (
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium mb-3', style.bg, style.text)}>
        <Icon className="size-3.5" />
        <span>已结束</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium mb-3', style.bg, style.text)}>
      <Icon className="size-3.5" />
      <span className="tabular-nums font-mono">{countdown.text}</span>
    </div>
  );
}

function ExamCard({ exam, index, onEdit, onDelete }: {
  exam: Exam;
  index: number;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}) {
  const daysUntil = getDaysUntil(exam.date);
  const isPast = daysUntil < 0;
  const isUrgent = daysUntil >= 0 && daysUntil <= 3;
  const isWarning = daysUntil >= 0 && daysUntil <= 7;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className={cn(
        'p-5 rounded-lg border transition-all duration-200 group interactive-card',
        isPast
          ? 'bg-muted/30 border-border/30 opacity-75 hover:opacity-90'
          : isUrgent
            ? 'bg-gradient-to-br from-red-50/60 to-orange-50/40 dark:from-red-950/20 dark:to-orange-950/10 border-red-200/70 dark:border-red-800/40 hover:border-red-300/70'
            : isWarning
              ? 'bg-gradient-to-br from-amber-50/40 to-yellow-50/20 dark:from-amber-950/15 dark:to-yellow-950/10 border-amber-200/60 dark:border-amber-800/30 hover:border-amber-300/70'
              : 'bg-card border-border/40 hover:bg-card/80 hover:border-border/70',
      )}
    >
      {/* Header: name + type */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3
          className={cn(
            'text-sm font-semibold truncate',
            isPast ? 'text-muted-foreground line-through' : 'text-foreground',
          )}
        >
          {exam.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {isPast && (
            <Badge className="bg-muted text-muted-foreground border-border text-[10px] px-1.5 py-0" variant="outline">
              已结束
            </Badge>
          )}
          <Badge
            className={cn(
              'text-[10px] px-1.5 py-0 gap-1',
              EXAM_TYPE_COLORS[exam.type] || 'bg-secondary text-secondary-foreground',
            )}
            variant="outline"
          >
            <span className={cn('size-1.5 rounded-full', EXAM_TYPE_DOT_COLORS[exam.type] || 'bg-muted-foreground')} />
            {exam.type}
          </Badge>
        </div>
      </div>

      {/* Course name */}
      {exam.course && (
        <div className="flex items-center gap-2 mb-2">
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: exam.course.color || '#6366f1' }}
          />
          <span className="text-xs text-muted-foreground truncate">{exam.course.name}</span>
        </div>
      )}

      {/* Date & Time */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <Calendar className="size-3.5 shrink-0" />
        <span className="font-mono tabular-nums">
          {formatDate(exam.date, 'yyyy年MM月dd日 HH:mm')}
        </span>
      </div>

      {/* Location & Seat */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {exam.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span>{exam.location}</span>
          </span>
        )}
        {exam.seat && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
            <Armchair className="size-3 shrink-0" />
            <span className="font-mono tabular-nums">{exam.seat}号</span>
          </span>
        )}
      </div>

      {/* Countdown Badge with live update */}
      <CountdownBadge date={exam.date} />

      {/* Actions */}
      <div className="pt-3 border-t border-border/30 flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(exam)}
        >
          <Pencil className="size-3.5 text-muted-foreground" />
          <span className="sr-only">编辑</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(exam)}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">删除</span>
        </Button>
      </div>
    </motion.div>
  );
}

export function ExamList({ onEdit, onAdd }: ExamListProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = React.useState<Exam | null>(null);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/exams?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('考试已删除');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  const sortedExams = useMemo(() => {
    const now = new Date();
    const upcoming = exams.filter((e) => new Date(e.date) >= now);
    const past = exams.filter((e) => new Date(e.date) < now);

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return [...upcoming, ...past];
  }, [exams]);

  // Compute stats
  const examStats = useMemo(() => {
    const now = new Date();
    const upcoming = exams.filter((e) => new Date(e.date) >= now);
    const urgent = upcoming.filter((e) => getDaysUntil(e.date) <= 3);
    const week = upcoming.filter((e) => getDaysUntil(e.date) <= 7);
    return { total: exams.length, upcoming: upcoming.length, urgent: urgent.length, week: week.length };
  }, [exams]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {isLoading ? (
        <ExamCardSkeleton />
      ) : sortedExams.length === 0 ? (
        <div className="py-16 text-center">
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <div className="size-24 rounded-full bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 flex items-center justify-center">
                <span className="text-5xl animate-float">📝</span>
              </div>
              <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/30 dark:to-purple-950/30 flex items-center justify-center">
                <Plus className="size-3.5 text-muted-foreground/60" />
              </div>
            </div>
          </div>
          <p className="text-foreground text-sm font-medium mb-1">暂无考试安排</p>
          <p className="text-muted-foreground text-xs mb-4">点击上方按钮添加你的第一场考试</p>
          {onAdd && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              添加考试
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Exam Stats Bar */}
          {examStats.upcoming > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/30"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">即将到来</span>
                <span className="text-sm font-semibold tabular-nums font-mono text-foreground">{examStats.upcoming}</span>
                <span className="text-xs text-muted-foreground">场</span>
              </div>
              {examStats.urgent > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100/80 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                  <AlertTriangle className="size-3" />
                  <span className="text-xs font-medium">{examStats.urgent} 场紧急</span>
                </div>
              )}
              {examStats.week > 0 && examStats.week !== examStats.urgent && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                  <Timer className="size-3" />
                  <span className="text-xs font-medium">{examStats.week} 场本周</span>
                </div>
              )}
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedExams.map((exam, index) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  index={index}
                  onEdit={onEdit}
                  onDelete={(e) => setDeleteTarget(e)}
                />
              ))}
            </div>
          </AnimatePresence>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除考试 &quot;{deleteTarget?.title}&quot; 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
