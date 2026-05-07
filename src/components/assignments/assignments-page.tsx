'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Zap, Inbox, Loader2, AlertCircle, Clock, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/helpers';
import type { Course, Assignment } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import { AssignmentFormDialog } from '@/components/assignments/assignment-form-dialog';
import { AssignmentList } from '@/components/assignments/assignment-list';

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch('/api/assignments');
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

const FILTER_TABS = [
  { value: 'all', label: '全部', icon: Inbox },
  { value: 'pending', label: '待完成', icon: AlertCircle },
  { value: 'in_progress', label: '进行中', icon: Play },
  { value: 'completed', label: '已完成', icon: CheckCircle },
  { value: 'overdue', label: '已逾期', icon: Clock },
] as const;

export function AssignmentsPage() {
  const { assignmentFilter, setAssignmentFilter } = useAppStore();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Quick add state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCourseId, setQuickCourseId] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setDialogOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingAssignment(null);
    }
  };

  // Quick add mutation
  const quickAddMutation = useMutation({
    mutationFn: async () => {
      if (!quickTitle.trim() || !quickCourseId) throw new Error('标题和课程为必填');
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          courseId: quickCourseId,
          dueDate: quickDueDate ? new Date(quickDueDate).toISOString() : null,
          status: 'pending',
          priority: 1,
          remindDays: 1,
        }),
      });
      if (!res.ok) throw new Error('创建作业失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setQuickTitle('');
      setQuickDueDate('');
      // Don't reset courseId so user can quickly add multiple assignments for same course
    },
    onError: () => {
      // handled silently - validation below prevents most errors
    },
  });

  const handleQuickAdd = useCallback(() => {
    if (!quickTitle.trim()) return;
    if (!quickCourseId) {
      // Auto-select first course if only one exists
      if (courses.length === 1) {
        setQuickCourseId(courses[0].id);
      }
      return;
    }
    quickAddMutation.mutate();
  }, [quickTitle, quickCourseId, courses, quickAddMutation]);

  // Keyboard shortcut: N to open add dialog (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleAddAssignment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen]);

  // Get counts per filter for badges
  const filterCounts = React.useMemo(() => {
    const now = new Date();
    const counts: Record<string, number> = {
      all: assignments.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    };
    for (const a of assignments) {
      if (a.status === 'pending') {
        // Check if it's actually overdue
        if (a.dueDate && new Date(a.dueDate) < now) {
          counts.overdue++;
        } else {
          counts.pending++;
        }
      } else {
        counts[a.status] = (counts[a.status] || 0) + 1;
      }
    }
    return counts;
  }, [assignments]);

  // Completion progress
  const completedCount = React.useMemo(
    () => assignments.filter((a) => a.status === 'completed').length,
    [assignments],
  );
  const totalAssignments = assignments.length;
  const completionPercent = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

  const isLoading = coursesLoading || assignmentsLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            📋 作业管理
          </h1>
          {!isLoading && (
            <Badge variant="secondary" className="font-mono tabular-nums text-xs">
              {assignments.length} 项
            </Badge>
          )}
          {isLoading && (
            <Skeleton className="h-5 w-12 rounded-full" />
          )}
        </div>

        <Button size="sm" onClick={handleAddAssignment} className="gap-1.5">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">添加作业</span>
        </Button>
      </div>

      {/* Quick Add Bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors"
      >
        <Zap className="size-4 text-muted-foreground shrink-0 hidden sm:block" />
        <Input
          placeholder="快速添加作业..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
          className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <Select value={quickCourseId} onValueChange={setQuickCourseId}>
            <SelectTrigger className="h-8 w-[120px] text-xs border-border/60">
              <SelectValue placeholder="选择课程" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: course.color || '#6366f1' }}
                    />
                    <span className="truncate max-w-[80px]">{course.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="datetime-local"
            value={quickDueDate}
            onChange={(e) => setQuickDueDate(e.target.value)}
            className="h-8 w-[155px] text-xs border-border/60"
          />
          <Button
            size="sm"
            onClick={handleQuickAdd}
            disabled={!quickTitle.trim() || !quickCourseId || quickAddMutation.isPending}
            className="h-8 px-3 text-xs gap-1"
          >
            {quickAddMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            <span className="hidden md:inline">添加</span>
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTER_TABS.map((tab) => {
          const isActive = assignmentFilter === tab.value;
          const count = filterCounts[tab.value] || 0;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setAssignmentFilter(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              )}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'text-xs tabular-nums font-mono px-1.5 py-0 rounded-full min-w-[20px] text-center',
                    isActive ? 'bg-background/60' : 'bg-muted',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Completion Progress Bar */}
      {assignments.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 h-1 rounded-full bg-secondary/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums font-mono whitespace-nowrap">
            已完成 {completedCount}/{totalAssignments} ({completionPercent}%)
          </span>
        </motion.div>
      )}

      {/* Assignment List */}
      <AssignmentList filter={assignmentFilter} onEdit={handleEditAssignment} onAdd={handleAddAssignment} />

      {/* Form Dialog */}
      <AssignmentFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        assignment={editingAssignment}
      />
    </motion.div>
  );
}
