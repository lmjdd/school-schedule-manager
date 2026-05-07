'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X, Trash2, ListChecks, Loader2 } from 'lucide-react';
import { cn } from '@/lib/helpers';
import type { Subtask } from '@/lib/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface SubtaskChecklistProps {
  assignmentId: string;
  /** Initial subtasks data (may be empty if server uses fallback) */
  initialSubtasks?: Subtask[];
}

function SubtaskProgressBar({ completed, total }: { completed: number; total: number }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 h-1 rounded-full bg-secondary/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full transition-colors',
            percent === 100
              ? 'bg-emerald-500'
              : percent > 0
                ? 'bg-primary'
                : 'bg-transparent',
          )}
        />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums font-mono whitespace-nowrap">
        {completed}/{total}
      </span>
    </div>
  );
}

function SubtaskItem({
  subtask,
  onToggle,
  onDelete,
}: {
  subtask: Subtask;
  onToggle: (subtask: Subtask) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    onDelete(subtask.id);
  }, [subtask.id, onDelete]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="group/subtask flex items-center gap-2 py-0.5"
    >
      {/* Animated Checkbox */}
      <button
        onClick={() => onToggle(subtask)}
        className={cn(
          'notion-checkbox shrink-0 size-4 rounded-[4px] border-2 flex items-center justify-center transition-all cursor-pointer',
          subtask.isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-border/60 hover:border-primary/50 hover:bg-primary/5',
        )}
        aria-label={subtask.isCompleted ? '取消完成' : '标记完成'}
      >
        <AnimatePresence mode="wait">
          {subtask.isCompleted && (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="size-2.5" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-xs leading-relaxed transition-colors',
          subtask.isCompleted
            ? 'line-through text-muted-foreground/70'
            : 'text-foreground/80',
        )}
      >
        {subtask.title}
      </span>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={cn(
          'shrink-0 size-5 rounded flex items-center justify-center transition-opacity',
          'opacity-0 group-hover/subtask:opacity-100',
          'text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30',
          deleting && 'opacity-100 animate-pulse',
        )}
        aria-label="删除子任务"
      >
        <Trash2 className="size-3" />
      </button>
    </motion.div>
  );
}

async function fetchSubtasks(assignmentId: string): Promise<Subtask[]> {
  const res = await fetch(`/api/subtasks?assignmentId=${assignmentId}`);
  if (!res.ok) throw new Error('Failed to fetch subtasks');
  return res.json();
}

export function SubtaskChecklist({ assignmentId, initialSubtasks }: SubtaskChecklistProps) {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');

  const queryKey = ['subtasks', assignmentId];

  const { data: subtasks = initialSubtasks ?? [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchSubtasks(assignmentId),
    // Use initial data while loading
    initialData: initialSubtasks,
    staleTime: 1000 * 30,
  });

  const completedCount = subtasks.filter((s) => s.isCompleted).length;
  const totalCount = subtasks.length;

  const invalidateSubtasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['assignments'] });
  }, [queryClient, queryKey]);

  const addMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, title }),
      });
      if (!res.ok) throw new Error('Failed to add subtask');
      return res.json();
    },
    onSuccess: () => {
      invalidateSubtasks();
      setInputValue('');
    },
    onError: () => {
      toast.error('添加子任务失败');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (subtask: Subtask) => {
      const res = await fetch(`/api/subtasks?id=${subtask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !subtask.isCompleted }),
      });
      if (!res.ok) throw new Error('Failed to toggle subtask');
      return res.json();
    },
    onSuccess: () => {
      invalidateSubtasks();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subtasks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete subtask');
      return res.json();
    },
    onSuccess: () => {
      invalidateSubtasks();
    },
    onError: () => {
      toast.error('删除子任务失败');
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/subtasks?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to edit subtask');
      return res.json();
    },
    onSuccess: () => {
      invalidateSubtasks();
    },
    onError: () => {
      toast.error('编辑子任务失败');
    },
  });

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || addMutation.isPending) return;
    addMutation.mutate(trimmed);
  }, [inputValue, addMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  return (
    <div className="pt-2 mt-1 border-t border-border/30">
      {isLoading && !initialSubtasks ? (
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-[4px]" />
              <Skeleton className="h-3 w-32 flex-1" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Progress bar */}
          {totalCount > 0 && (
            <SubtaskProgressBar completed={completedCount} total={totalCount} />
          )}

          {/* Subtask list */}
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={toggleMutation.mutate}
                  onDelete={deleteMutation.mutate}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Inline add input */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="size-4 rounded-[4px] border-2 border-dashed border-border/40 shrink-0 flex items-center justify-center">
              <Plus className="size-2 text-muted-foreground/40" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={totalCount === 0 ? '添加子任务...' : '继续添加...'}
              disabled={addMutation.isPending}
              className="flex-1 h-6 text-xs bg-transparent border-0 outline-none placeholder:text-muted-foreground/40 text-foreground/80"
            />
            {inputValue.trim() && (
              <button
                onClick={() => setInputValue('')}
                className="shrink-0 size-4 rounded flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Empty state */}
          {totalCount === 0 && !inputValue && (
            <div className="flex items-center gap-1.5 py-1">
              <ListChecks className="size-3 text-muted-foreground/30" />
              <span className="text-[11px] text-muted-foreground/40">
                拆分任务为更小的步骤
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ──────────────── Subtask Progress Badge (for assignment card) ──────────────── */

interface SubtaskProgressBadgeProps {
  subtasks?: Subtask[];
  assignmentId?: string;
}

export function SubtaskProgressBadge({ subtasks, assignmentId }: SubtaskProgressBadgeProps) {
  // If subtasks are embedded, use them directly
  if (subtasks && subtasks.length > 0) {
    const completed = subtasks.filter((s) => s.isCompleted).length;
    const total = subtasks.length;
    const allDone = completed === total;

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums font-mono shrink-0',
          allDone
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-secondary/70 text-muted-foreground',
        )}
      >
        <Check className="size-2.5" strokeWidth={allDone ? 3 : 2} />
        {completed}/{total}
      </span>
    );
  }

  // Fetch subtask count from API for progress badge
  if (assignmentId) {
    return <SubtaskProgressBadgeFetcher assignmentId={assignmentId} />;
  }

  return null;
}

function SubtaskProgressBadgeFetcher({ assignmentId }: { assignmentId: string }) {
  const { data: subtasks } = useQuery({
    queryKey: ['subtasks', assignmentId],
    queryFn: () => fetchSubtasks(assignmentId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  if (!subtasks || subtasks.length === 0) return null;

  const completed = subtasks.filter((s) => s.isCompleted).length;
  const total = subtasks.length;
  const allDone = completed === total;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums font-mono shrink-0',
        allDone
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'bg-secondary/70 text-muted-foreground',
      )}
    >
      <Check className="size-2.5" strokeWidth={allDone ? 3 : 2} />
      {completed}/{total}
    </span>
  );
}
