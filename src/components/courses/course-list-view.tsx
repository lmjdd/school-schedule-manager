'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, MapPin, Clock, User, BookOpen, Plus } from 'lucide-react';
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
import { DAY_NAMES, COURSE_CATEGORIES } from '@/lib/types';
import type { Course } from '@/lib/types';
import { toast } from 'sonner';

interface CourseListViewProps {
  onEdit: (course: Course) => void;
  onAdd?: () => void;
}

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

function getCategoryBadgeStyle(category: string): string {
  switch (category) {
    case '必修':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case '选修':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case '通识':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case '实践':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

function CourseListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg border border-border/40"
        >
          <Skeleton className="size-4 rounded-full shrink-0" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16 hidden sm:block" />
          <Skeleton className="h-4 w-20 hidden md:block" />
          <Skeleton className="h-4 w-28 hidden lg:block" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CourseListView({ onEdit, onAdd }: CourseListViewProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = React.useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('课程已删除');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  // Sort by day of week, then by start time
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* List header (desktop) */}
      <div className="hidden lg:grid lg:grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] gap-3 items-center px-4 py-2 text-xs text-muted-foreground font-medium border-b border-border/50 mb-1">
        <span className="w-4" />
        <span>课程名</span>
        <span className="w-20 text-center">教师</span>
        <span className="w-20 text-center">地点</span>
        <span className="w-28 text-center">时间</span>
        <span className="w-12 text-center">学分</span>
        <span className="w-12 text-center">类别</span>
        <span className="w-20 text-right">操作</span>
      </div>

      {isLoading ? (
        <CourseListSkeleton />
      ) : sortedCourses.length === 0 ? (
        <div className="py-16 text-center">
          <div className="flex items-center justify-center mb-5">
            <div className="size-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center animate-gradient">
              <span className="text-4xl animate-float">📚</span>
            </div>
          </div>
          <p className="text-foreground text-sm font-medium mb-1">还没有课程</p>
          <p className="text-muted-foreground text-xs mb-4">点击上方按钮添加你的第一门课程</p>
          {onAdd && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              添加课程
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {sortedCourses.map((course, index) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, delay: index * 0.03, ease: 'easeOut' }}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/40 hover:bg-secondary/40 hover:border-border transition-all group cursor-default interactive-card"
              >
                {/* Color indicator */}
                <div
                  className="size-3.5 rounded-full shrink-0 ring-2 ring-background"
                  style={{ backgroundColor: course.color || '#6366f1' }}
                />

                {/* Course name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {course.name}
                  </p>
                  {/* Mobile-only details */}
                  <div className="flex items-center gap-2 mt-0.5 lg:hidden text-xs text-muted-foreground flex-wrap">
                    {course.teacher && (
                      <span className="flex items-center gap-0.5">
                        <User className="size-3" />
                        {course.teacher}
                      </span>
                    )}
                    {course.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="size-3" />
                        {course.location}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Clock className="size-3" />
                      {DAY_NAMES[course.dayOfWeek]}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {course.credit}学分
                    </Badge>
                  </div>
                </div>

                {/* Teacher (desktop) */}
                {course.teacher && (
                  <span className="hidden lg:block w-20 text-center text-sm text-muted-foreground truncate">
                    {course.teacher}
                  </span>
                )}

                {/* Location (desktop) */}
                {course.location && (
                  <span className="hidden lg:flex items-center gap-1 w-20 text-center text-sm text-muted-foreground justify-center">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{course.location}</span>
                  </span>
                )}

                {/* Time (desktop) */}
                <span className="hidden lg:block w-28 text-center text-sm text-muted-foreground">
                  <span className="font-mono tabular-nums text-xs">
                    {DAY_NAMES[course.dayOfWeek]} {course.startTime}-{course.endTime}
                  </span>
                </span>

                {/* Credits (desktop) */}
                <span className="hidden lg:block w-12 text-center text-sm text-muted-foreground font-mono tabular-nums">
                  {course.credit}
                </span>

                {/* Category (desktop) */}
                <span className="hidden lg:block w-12 flex justify-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full border ${getCategoryBadgeStyle(course.category)}`}
                  >
                    {course.category}
                  </span>
                </span>

                {/* Actions */}
                <div className="flex gap-1 shrink-0 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity lg:opacity-100"
                    onClick={() => onEdit(course)}
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                    <span className="sr-only">编辑</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity lg:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(course)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">删除</span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除课程 &quot;{deleteTarget?.name}&quot; 吗？此操作不可撤销。
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
