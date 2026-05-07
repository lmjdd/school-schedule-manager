'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, CalendarDays, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/helpers';
import type { Course } from '@/lib/types';
import { CourseFormDialog } from '@/components/courses/course-form-dialog';
import { CourseListView } from '@/components/courses/course-list-view';
import { WeeklyScheduleView } from '@/components/courses/weekly-schedule-view';
import { AttendanceTracker } from '@/components/courses/attendance-tracker';

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export function CoursesPage() {
  const { courseView, setCourseView } = useAppStore();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleAddCourse = () => {
    setEditingCourse(null);
    setDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingCourse(null);
    }
  };

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
            📚 课程管理
          </h1>
          {!isLoading && (
            <Badge variant="secondary" className="font-mono tabular-nums text-xs">
              {courses.length} 门
            </Badge>
          )}
          {isLoading && (
            <Skeleton className="h-5 w-12 rounded-full" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs gap-1.5',
                courseView === 'list'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setCourseView('list')}
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline">列表</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs gap-1.5',
                courseView === 'schedule'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setCourseView('schedule')}
            >
              <CalendarDays className="size-3.5" />
              <span className="hidden sm:inline">课表</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs gap-1.5',
                courseView === 'attendance'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setCourseView('attendance')}
            >
              <ClipboardCheck className="size-3.5" />
              <span className="hidden sm:inline">考勤</span>
            </Button>
          </div>

          {/* Add Course Button */}
          <Button size="sm" onClick={handleAddCourse} className="gap-1.5">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">添加课程</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {courseView === 'list' && (
          <CourseListView key="list" onEdit={handleEditCourse} onAdd={handleAddCourse} />
        )}
        {courseView === 'schedule' && (
          <WeeklyScheduleView key="schedule" />
        )}
        {courseView === 'attendance' && (
          <AttendanceTracker key="attendance" />
        )}
      </AnimatePresence>

      {/* Form Dialog */}
      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        course={editingCourse}
      />
    </motion.div>
  );
}


