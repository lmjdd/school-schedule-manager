'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect, useReducer } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Pencil, Trash2, AlertTriangle, Check, Plus, GripVertical, ListChecks, CheckCircle2, X, Square, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  formatDate,
  getDaysUntil,
  cn,
  getAssignmentStatusColor,
  getRelativeDueDate,
  getPriorityBorderColor,
  getPriorityBgColor,
  getPriorityDotColor,
  getPriorityLabel,
} from '@/lib/helpers';
import { STATUS_LABELS } from '@/lib/types';
import type { Assignment } from '@/lib/types';
import { toast } from 'sonner';
import { SubtaskChecklist, SubtaskProgressBadge } from '@/components/assignments/subtask-checklist';

interface AssignmentListProps {
  filter: string;
  onEdit: (assignment: Assignment) => void;
  onAdd?: () => void;
}

async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch('/api/assignments');
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

const FILTER_EMPTY_MESSAGES: Record<string, { icon: string; text: string; sub: string }> = {
  all: { icon: '📋', text: '还没有作业', sub: '点击上方"添加作业"按钮开始添加' },
  pending: { icon: '⏳', text: '没有待完成的作业', sub: '所有作业都已处理' },
  in_progress: { icon: '🔄', text: '没有进行中的作业', sub: '选择一个作业开始工作吧' },
  completed: { icon: '🎉', text: '没有已完成的作业', sub: '完成作业后会在这里显示' },
  overdue: { icon: '😅', text: '没有逾期的作业', sub: '太棒了，继续保持！' },
};

function AssignmentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-lg border border-border/40 border-l-[3px]"
        >
          <Skeleton className="size-5 rounded-md shrink-0" />
          <Skeleton className="size-2.5 rounded-full shrink-0" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <div className="flex gap-1 ml-auto">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
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
        'text-xs font-medium tabular-nums font-mono whitespace-nowrap',
        isOverdue && 'text-red-600 dark:text-red-400',
        !isOverdue && isUrgent && 'text-orange-600 dark:text-orange-400',
        !isOverdue && !isUrgent && isSoon && 'text-amber-600 dark:text-amber-400',
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

interface SortableAssignmentItemProps {
  assignment: Assignment & { effectiveStatus?: string };
  index: number;
  onToggle: (assignment: Assignment) => void;
  togglePending: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  batchMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

function SortableAssignmentItem({
  assignment,
  index,
  onToggle,
  togglePending,
  onEdit,
  onDelete,
  batchMode,
  isSelected,
  onSelect,
  isExpanded,
  onToggleExpand,
}: SortableAssignmentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative' as const,
  };

  const isCompleted = assignment.status === 'completed';
  const isOverdue = assignment.status === 'overdue' || assignment.effectiveStatus === 'overdue';
  const daysUntil = assignment.dueDate ? getDaysUntil(assignment.dueDate) : null;
  const relativeDue = assignment.dueDate ? getRelativeDueDate(assignment.dueDate) : null;
  const priorityBorder = getPriorityBorderColor(assignment.priority);
  const priorityBg = getPriorityBgColor(assignment.priority);
  const priorityDot = getPriorityDotColor(assignment.priority);
  const priorityLabel = getPriorityLabel(assignment.priority);

  const hasSubtasks = assignment.subtasks && assignment.subtasks.length > 0;

  const handleCardClick = useCallback(() => {
    if (batchMode && onSelect) {
      onSelect(assignment.id);
      return;
    }
    onToggleExpand(assignment.id);
  }, [batchMode, onSelect, assignment.id, onToggleExpand]);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(assignment.id);
  }, [assignment.id, onToggleExpand]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isDragging ? 0.3 : 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={handleCardClick}
      className={cn(
        'rounded-lg border border-border/40 border-l-[3px] transition-shadow duration-200 group cursor-default overflow-hidden',
        priorityBorder,
        isCompleted && !isExpanded && 'opacity-60',
        !isCompleted && !isOverdue && 'hover:-translate-y-[1px] hover:shadow-md hover:border-border/70',
        isOverdue && !isCompleted && 'bg-gradient-to-r from-red-50/60 to-transparent dark:from-red-950/20 dark:to-transparent border-red-200/60 dark:border-red-800/40 hover:-translate-y-[1px] hover:shadow-md hover:shadow-red-100/50 dark:hover:shadow-red-950/30',
        isDragging && 'shadow-xl ring-2 ring-primary/20 scale-[1.02]',
        batchMode && 'cursor-pointer select-none',
        batchMode && isSelected && 'ring-2 ring-primary/30 bg-primary/5 dark:bg-primary/10 border-primary/40',
      )}
    >
      {/* Main row */}
      <div className={cn(
        'flex items-center gap-3 sm:gap-4 p-3 sm:p-4',
        'cursor-pointer',
      )}>
      {/* Batch selection checkbox — only in batch mode */}
      {batchMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(assignment.id)}
            className="size-5 rounded-[4px]"
            aria-label={isSelected ? '取消选择' : '选择作业'}
          />
        </div>
      )}

      {/* Drag handle — only this element triggers drag */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="size-5 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors touch-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        {...attributes}
        {...listeners}
        aria-label="拖拽排序"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Status checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(assignment); }}
        disabled={togglePending}
        className={cn(
          'notion-checkbox mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer',
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : isOverdue
              ? 'border-red-300 bg-red-100 hover:border-red-400'
              : 'border-border hover:border-primary/40',
          togglePending && 'opacity-50 cursor-wait',
        )}
        aria-label={isCompleted ? '标记为未完成' : '标记为已完成'}
      >
        {isCompleted && <Check className="size-3" strokeWidth={3} />}
        {!isCompleted && isOverdue && <AlertTriangle className="size-3 text-red-500" />}
      </button>

      {/* Priority badge with colored dot */}
      <span
        className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
        style={{
          backgroundColor: priorityBg + '18',
          color: priorityBg,
        }}
      >
        <span className={cn('size-1.5 rounded-full', priorityDot)} />
        <span>{priorityLabel}</span>
      </span>

      {/* Title + mobile info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isCompleted && 'line-through text-muted-foreground',
            !isCompleted && isOverdue && 'text-red-700 dark:text-red-400',
            !isCompleted && !isOverdue && 'text-foreground',
          )}
        >
          {assignment.title}
        </p>
        {/* Mobile info row */}
        <div className="flex items-center gap-2 mt-0.5 sm:hidden text-xs text-muted-foreground flex-wrap">
          {assignment.course && (
            <span className="truncate">{assignment.course.name}</span>
          )}
          {assignment.dueDate && (
            <span className="font-mono tabular-nums">
              {formatDate(assignment.dueDate, 'MM/dd HH:mm')}
            </span>
          )}
          {relativeDue && (
            <span className={cn(
              'text-[10px] font-medium',
              isOverdue ? 'text-red-500' : 'text-muted-foreground',
            )}>
              {relativeDue}
            </span>
          )}
        </div>
      </div>

      {/* Course badge (desktop) */}
      {assignment.course && (
        <span
          className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border shrink-0"
          style={{
            backgroundColor: (assignment.course.color || '#6366f1') + '15',
            borderColor: (assignment.course.color || '#6366f1') + '30',
            color: assignment.course.color || '#6366f1',
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: assignment.course.color || '#6366f1' }}
          />
          <span className="truncate max-w-[100px]">{assignment.course.name}</span>
        </span>
      )}

      {/* Due date + countdown (desktop) */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
        {assignment.dueDate ? (
          <>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              <span className="font-mono tabular-nums">
                {formatDate(assignment.dueDate, 'MM/dd HH:mm')}
              </span>
            </span>
            <CountdownBadge days={daysUntil!} />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">无截止日期</span>
        )}
      </div>

      {/* Status badge */}
      <Badge
        className={cn(
          'text-[10px] px-1.5 py-0 shrink-0 cursor-default',
          getAssignmentStatusColor(assignment.status === 'completed' ? 'completed' : isOverdue ? 'overdue' : assignment.status),
        )}
        variant="outline"
      >
        {STATUS_LABELS[isOverdue && !isCompleted ? 'overdue' : assignment.status] || assignment.status}
      </Badge>

      {/* Subtask expand chevron */}
      <button
        onClick={handleExpandClick}
        className="shrink-0 size-6 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/50 transition-all"
        aria-label={isExpanded ? '收起子任务' : '展开子任务'}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="size-3.5" />
        </motion.div>
      </button>

      {/* Subtask progress badge */}
      <SubtaskProgressBadge subtasks={assignment.subtasks} assignmentId={assignment.id} />

      {/* Actions */}
      <div className="flex gap-1 shrink-0 ml-auto sm:ml-0">
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100"
          onClick={(e) => { e.stopPropagation(); onEdit(assignment); }}
        >
          <Pencil className="size-3.5 text-muted-foreground" />
          <span className="sr-only">编辑</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(assignment); }}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">删除</span>
        </Button>
      </div>
      </div>

      {/* Expanded Subtask Checklist */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pl-[46px] sm:pl-[58px]">
              <SubtaskChecklist
                assignmentId={assignment.id}
                initialSubtasks={assignment.subtasks}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DragOverlayItem({ assignment }: { assignment: Assignment & { effectiveStatus?: string } }) {
  const isCompleted = assignment.status === 'completed';
  const isOverdue = assignment.status === 'overdue' || assignment.effectiveStatus === 'overdue';
  const priorityBg = getPriorityBgColor(assignment.priority);
  const priorityDot = getPriorityDotColor(assignment.priority);
  const priorityLabel = getPriorityLabel(assignment.priority);
  const priorityBorder = getPriorityBorderColor(assignment.priority);

  return (
    <div
      className={cn(
        'flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-l-[3px] shadow-xl ring-2 ring-primary/20 bg-background scale-[1.02]',
        priorityBorder,
        isOverdue && !isCompleted && 'border-red-200/60',
      )}
    >
      <div className="size-5 flex items-center justify-center shrink-0">
        <GripVertical className="size-4 text-primary" />
      </div>
      <div className={cn(
        'notion-checkbox mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0',
        isCompleted
          ? 'bg-emerald-500 border-emerald-500 text-white'
          : isOverdue
            ? 'border-red-300 bg-red-100'
            : 'border-border',
      )}>
        {isCompleted && <Check className="size-3" strokeWidth={3} />}
      </div>
      <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
        style={{ backgroundColor: priorityBg + '18', color: priorityBg }}>
        <span className={cn('size-1.5 rounded-full', priorityDot)} />
        <span>{priorityLabel}</span>
      </span>
      <p className="text-sm font-medium truncate flex-1">{assignment.title}</p>
      {assignment.course && (
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border shrink-0"
          style={{
            backgroundColor: (assignment.course.color || '#6366f1') + '15',
            borderColor: (assignment.course.color || '#6366f1') + '30',
            color: assignment.course.color || '#6366f1',
          }}>
          <span className="truncate max-w-[100px]">{assignment.course.name}</span>
        </span>
      )}
    </div>
  );
}

/* ──────────────────────────── Batch Action Bar ──────────────────────────── */

function BatchActionBar({
  count,
  allSelected,
  onSelectAll,
  onDeselectAll,
  onMarkComplete,
  onDelete,
  onExit,
  loading,
}: {
  count: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMarkComplete: () => void;
  onDelete: () => void;
  onExit: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-4 left-1/2 z-50 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-xl"
      style={{ transform: 'translateX(-50%)' }}
    >
      {/* Selected count */}
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        已选择 <span className="text-primary font-bold tabular-nums font-mono">{count}</span> 项
      </span>

      <div className="w-px h-5 bg-border/60 shrink-0" />

      {/* Select All / Deselect All */}
      <Button
        variant="ghost"
        size="sm"
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="h-8 px-2 text-xs gap-1"
      >
        {allSelected ? (
          <>
            <Square className="size-3.5" />
            <span className="hidden sm:inline">取消全选</span>
          </>
        ) : (
          <>
            <Check className="size-3.5" />
            <span className="hidden sm:inline">全选</span>
          </>
        )}
      </Button>

      <div className="w-px h-5 bg-border/60 shrink-0" />

      {/* Mark Complete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onMarkComplete}
        disabled={count === 0 || loading}
        className="h-8 px-2 text-xs gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="size-3.5" />
        )}
        <span className="hidden sm:inline">标记完成</span>
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={count === 0 || loading}
        className="h-8 px-2 text-xs gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        <span className="hidden sm:inline">删除</span>
      </Button>

      <div className="w-px h-5 bg-border/60 shrink-0" />

      {/* Exit batch mode */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="h-8 px-2 text-xs gap-1"
      >
        <X className="size-3.5" />
        <span className="hidden sm:inline">取消选择</span>
      </Button>
    </motion.div>
  );
}

/* ──────────────────────────── Assignment List ──────────────────────────── */

export function AssignmentList({ filter, onEdit, onAdd }: AssignmentListProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = React.useState<Assignment | null>(null);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  /* ── Batch mode state ── */
  const [batchMode, setBatchMode] = useState(false);
  const selectedIds = useRef(new Set<string>());
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('作业已删除');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  const filteredAndSorted = useMemo(() => {
    const now = new Date();
    const items = assignments.map((a) => {
      let effectiveStatus = a.status;
      if (a.dueDate && new Date(a.dueDate) < now && a.status !== 'completed' && a.status !== 'overdue') {
        effectiveStatus = 'overdue';
      }
      return { ...a, effectiveStatus };
    });

    let filtered = items;
    if (filter === 'pending') {
      filtered = items.filter((a) => a.status === 'pending');
    } else if (filter === 'in_progress') {
      filtered = items.filter((a) => a.status === 'in_progress');
    } else if (filter === 'completed') {
      filtered = items.filter((a) => a.status === 'completed');
    } else if (filter === 'overdue') {
      filtered = items.filter((a) => a.status === 'overdue' || a.effectiveStatus === 'overdue');
    }

    let sorted = [...filtered].sort((a, b) => {
      const aOverdue = a.status === 'overdue' || a.effectiveStatus === 'overdue';
      const bOverdue = b.status === 'overdue' || b.effectiveStatus === 'overdue';
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      if (a.dueDate && b.dueDate) {
        const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateDiff !== 0) return dateDiff;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      return b.priority - a.priority;
    });

    if (localOrder) {
      const orderMap = new Map(localOrder.map((id, idx) => [id, idx]));
      sorted = [...sorted].sort((a, b) => {
        const aIdx = orderMap.get(a.id) ?? Infinity;
        const bIdx = orderMap.get(b.id) ?? Infinity;
        return aIdx - bIdx;
      });
    }

    return sorted;
  }, [assignments, filter, localOrder]);

  /* ── Reset selections when filter changes ── */
  useEffect(() => {
    selectedIds.current.clear();
    forceUpdate();
    setBatchMode(false);
  }, [filter, forceUpdate]);

  /* ── Batch selection handlers ── */
  const toggleSelect = useCallback((id: string) => {
    if (selectedIds.current.has(id)) {
      selectedIds.current.delete(id);
    } else {
      selectedIds.current.add(id);
    }
    forceUpdate();
  }, [forceUpdate]);

  const selectAll = useCallback(() => {
    for (const a of filteredAndSorted) {
      selectedIds.current.add(a.id);
    }
    forceUpdate();
  }, [filteredAndSorted, forceUpdate]);

  const deselectAll = useCallback(() => {
    selectedIds.current.clear();
    forceUpdate();
  }, [forceUpdate]);

  const exitBatchMode = useCallback(() => {
    selectedIds.current.clear();
    forceUpdate();
    setBatchMode(false);
  }, [forceUpdate]);

  /* ── Batch mark complete ── */
  const handleBatchMarkComplete = useCallback(async () => {
    const ids = Array.from(selectedIds.current);
    if (ids.length === 0) return;
    setBatchActionLoading(true);
    try {
      const toUpdate = filteredAndSorted.filter((a) => ids.includes(a.id));
      await Promise.all(
        toUpdate.map((a) =>
          fetch('/api/assignments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...a, status: 'completed' }),
          }).then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          }),
        ),
      );
      toast.success(`已将 ${ids.length} 项作业标记为完成`);
      selectedIds.current.clear();
      forceUpdate();
      setBatchMode(false);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    } catch {
      toast.error('批量操作失败，请重试');
    } finally {
      setBatchActionLoading(false);
    }
  }, [filteredAndSorted, forceUpdate, queryClient]);

  /* ── Batch delete ── */
  const handleBatchDelete = useCallback(async () => {
    const ids = Array.from(selectedIds.current);
    if (ids.length === 0) return;
    setBatchActionLoading(true);
    setBatchDeleteDialogOpen(false);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/assignments?id=${id}`, { method: 'DELETE' }).then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          }),
        ),
      );
      toast.success(`已删除 ${ids.length} 项作业`);
      selectedIds.current.clear();
      forceUpdate();
      setBatchMode(false);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    } catch {
      toast.error('批量删除失败，请重试');
    } finally {
      setBatchActionLoading(false);
    }
  }, [forceUpdate, queryClient]);

  const selectedCount = selectedIds.current.size;
  const allSelected = filteredAndSorted.length > 0 && selectedCount === filteredAndSorted.length;

  const activeItem = activeId
    ? filteredAndSorted.find((a) => a.id === activeId) ?? null
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = filteredAndSorted.findIndex((a) => a.id === active.id);
      const newIndex = filteredAndSorted.findIndex((a) => a.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(filteredAndSorted, oldIndex, newIndex);
      setLocalOrder(reordered.map((a) => a.id));
    },
    [filteredAndSorted],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  /* ── Expand/Collapse subtasks ── */
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const emptyMsg = FILTER_EMPTY_MESSAGES[filter] || FILTER_EMPTY_MESSAGES.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {isLoading ? (
        <AssignmentListSkeleton />
      ) : filteredAndSorted.length === 0 ? (
        <div className="py-16 text-center">
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <div className="size-24 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-center">
                <span className="text-5xl animate-float">{emptyMsg.icon}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-950/30 dark:to-orange-950/30 flex items-center justify-center">
                <Plus className="size-3.5 text-muted-foreground/60" />
              </div>
            </div>
          </div>
          <p className="text-foreground text-sm font-medium mb-1">{emptyMsg.text}</p>
          <p className="text-muted-foreground text-xs mb-4">{emptyMsg.sub}</p>
          {onAdd && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              添加作业
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Batch mode toolbar */}
          <div className="flex items-center justify-end mb-3">
            <Button
              variant={batchMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (batchMode) {
                  exitBatchMode();
                } else {
                  setBatchMode(true);
                }
              }}
              className={cn(
                'gap-1.5 text-xs transition-all',
                batchMode
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:border-primary/40',
              )}
            >
              <ListChecks className="size-3.5" />
              {batchMode ? '退出批量' : '批量操作'}
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={filteredAndSorted.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredAndSorted.map((assignment, index) => (
                    <SortableAssignmentItem
                      key={assignment.id}
                      assignment={assignment}
                      index={index}
                      onToggle={(a) => toggleMutation.mutate(a)}
                      togglePending={toggleMutation.isPending}
                      onEdit={onEdit}
                      onDelete={(a) => setDeleteTarget(a)}
                      batchMode={batchMode}
                      isSelected={selectedIds.current.has(assignment.id)}
                      onSelect={toggleSelect}
                      isExpanded={expandedIds.has(assignment.id)}
                      onToggleExpand={toggleExpand}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeItem ? <DragOverlayItem assignment={activeItem} /> : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {/* ── Batch Action Bar (floating) ── */}
      <AnimatePresence>
        {batchMode && (
          <BatchActionBar
            count={selectedCount}
            allSelected={allSelected}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onMarkComplete={handleBatchMarkComplete}
            onDelete={() => setBatchDeleteDialogOpen(true)}
            onExit={exitBatchMode}
            loading={batchActionLoading}
          />
        )}
      </AnimatePresence>

      {/* ── Batch Delete Confirmation Dialog ── */}
      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除 {selectedCount} 项作业？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchActionLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={batchActionLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {batchActionLoading ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除作业 &quot;{deleteTarget?.title}&quot; 吗？此操作不可撤销。
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
