'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileQuestion,
  Flame,
  BarChart3,
  CalendarCheck,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/helpers';
import {
  type Course,
  type Attendance,
  type AttendanceStatus,
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
} from '@/lib/types';
import { toast } from 'sonner';

// ─── Helpers ───────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getTodayStr(): string {
  const now = new Date();
  return formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

function getMonthName(month: number): string {
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return names[month];
}

const STATUS_ICONS: Record<AttendanceStatus, React.ReactNode> = {
  present: <CheckCircle2 className="size-3" />,
  absent: <XCircle className="size-3" />,
  late: <Clock className="size-3" />,
  leave: <FileQuestion className="size-3" />,
};

const STATUS_DOT_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  late: 'bg-amber-500',
  leave: 'bg-sky-500',
};

const QUICK_BUTTON_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20',
  absent: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-500/20',
  late: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-500/20',
  leave: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-500/20',
};

// ─── Fetch helpers ─────────────────────────────────────────────────────

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

async function fetchAttendance(params: Record<string, string>): Promise<Attendance[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/attendance?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
}

// ─── Sub-components ────────────────────────────────────────────────────

function CalendarGridSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 6 }).map((_, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, dayIdx) => (
            <div key={dayIdx} className="aspect-square rounded-md bg-muted/30 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/40 p-3 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function AttendanceTracker() {
  const queryClient = useQueryClient();

  // Navigation state
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editNote, setEditNote] = useState('');

  // Quick attendance: today's date
  const todayStr = useMemo(() => getTodayStr(), []);

  // Compute date range for the viewed month
  const dateFrom = useMemo(() => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`, [viewYear, viewMonth]);
  const dateTo = useMemo(
    () => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(getDaysInMonth(viewYear, viewMonth)).padStart(2, '0')}`,
    [viewYear, viewMonth]
  );

  // Queries
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const queryParams = useMemo(
    () => ({
      dateFrom,
      dateTo,
      ...(selectedCourseId !== 'all' ? { courseId: selectedCourseId } : {}),
    }),
    [dateFrom, dateTo, selectedCourseId]
  );

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['attendance', queryParams],
    queryFn: () => fetchAttendance(queryParams),
  });

  // Today's records for quick attendance
  const todayParams = useMemo(() => ({ dateFrom: todayStr, dateTo: todayStr }), [todayStr]);
  const { data: todayRecords = [], isLoading: todayLoading } = useQuery({
    queryKey: ['attendance-today', todayParams],
    queryFn: () => fetchAttendance(todayParams),
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: { courseId: string; date: string; status: AttendanceStatus; note?: string }) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('保存失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('考勤记录已保存');
      setEditDialogOpen(false);
      setEditingRecord(null);
    },
    onError: () => toast.error('保存失败，请重试'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/attendance?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('考勤记录已删除');
      setEditDialogOpen(false);
      setEditingRecord(null);
    },
    onError: () => toast.error('删除失败'),
  });

  // ─── Calendar helpers ──────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build a map: dateStr -> AttendanceStatus for quick lookup
  const attendanceMap = useMemo(() => {
    const map: Record<string, Attendance> = {};
    records.forEach((r) => {
      map[r.date] = r;
    });
    return map;
  }, [records]);

  const todayAttendanceMap = useMemo(() => {
    const map: Record<string, Attendance> = {};
    todayRecords.forEach((r) => {
      map[r.courseId] = r;
    });
    return map;
  }, [todayRecords]);

  // ─── Statistics ────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        rate: 0,
        streak: 0,
      };
    }

    const present = records.filter((r) => r.status === 'present').length;
    const late = records.filter((r) => r.status === 'late').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    const total = records.length;
    const rate = Math.round(((present + late) / total) * 100);

    // Calculate consecutive present/late streak from today backwards
    let streak = 0;
    const d = new Date();
    // Only count streak within the viewed month
    for (let i = 0; i < daysInMonth; i++) {
      const checkDate = new Date(viewYear, viewMonth, d.getDate() - i);
      // Ensure it's still in the same month
      if (checkDate.getMonth() !== viewMonth || checkDate.getFullYear() !== viewYear) break;
      const ds = formatDateStr(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      // Check if any record for this date is present or late
      const dayRecords = records.filter((r) => r.date === ds);
      if (dayRecords.length === 0) break; // No records = streak broken
      const hasGoodRecord = dayRecords.some((r) => r.status === 'present' || r.status === 'late');
      if (hasGoodRecord) streak++;
      else break;
    }

    return { total, present, absent, late, leave, rate, streak };
  }, [records, viewYear, viewMonth, daysInMonth]);

  // Per-course stats
  const courseStats = useMemo(() => {
    if (selectedCourseId !== 'all') return [];
    const map: Record<string, { course: Course; total: number; present: number; rate: number }> = {};
    records.forEach((r) => {
      if (!map[r.courseId] && r.course) {
        map[r.courseId] = { course: r.course, total: 0, present: 0, rate: 0 };
      }
      if (map[r.courseId]) {
        map[r.courseId].total++;
        if (r.status === 'present' || r.status === 'late') map[r.courseId].present++;
      }
    });
    return Object.values(map).map((c) => ({
      ...c,
      rate: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
    }));
  }, [records, selectedCourseId]);

  // ─── Navigation handlers ──────────────────────────────────────────

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    const n = new Date();
    setViewYear(n.getFullYear());
    setViewMonth(n.getMonth());
  };

  // ─── Edit dialog handlers ─────────────────────────────────────────

  const openEditDialog = (record: Attendance | null, defaultStatus: AttendanceStatus = 'present') => {
    setEditingRecord(record);
    setEditStatus(record ? record.status : defaultStatus);
    setEditNote(record?.note || '');
    setEditDialogOpen(true);
  };

  const handleSaveRecord = () => {
    if (editingRecord) {
      saveMutation.mutate({
        courseId: editingRecord.courseId,
        date: editingRecord.date,
        status: editStatus,
        note: editNote,
      });
    }
  };

  const handleQuickAttendance = (course: Course, status: AttendanceStatus) => {
    const existing = todayAttendanceMap[course.id];
    saveMutation.mutate({
      courseId: course.id,
      date: todayStr,
      status,
      note: existing?.note || '',
    });
  };

  // ─── Get courses for today (based on day of week) ────────────────

  const todayDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sun=0 to 7 for display

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* ── Quick Attendance for Today ── */}
      <Card className="border-border/40 overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CalendarCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">今日考勤</h3>
                <p className="text-xs text-muted-foreground">
                  {todayStr} · {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {todayRecords.length}/{courses.length}
            </Badge>
          </div>

          {todayLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {courses.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">暂无课程，请先添加课程</p>
              ) : (
                courses.map((course) => {
                  const existing = todayAttendanceMap[course.id];
                  const currentStatus: AttendanceStatus | null = existing?.status || null;

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: courses.indexOf(course) * 0.03 }}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors group"
                    >
                      <div
                        className="size-2.5 rounded-full shrink-0 ring-2 ring-background"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="text-xs font-medium text-foreground truncate flex-1 min-w-0">
                        {course.name}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {ATTENDANCE_STATUS.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleQuickAttendance(course, status)}
                            disabled={saveMutation.isPending}
                            className={cn(
                              'flex items-center gap-0.5 px-1.5 py-1 rounded-md border text-[10px] font-medium transition-all',
                              'disabled:opacity-50',
                              currentStatus === status
                                ? cn(QUICK_BUTTON_STYLES[status], 'ring-1 ring-current/20')
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                            title={ATTENDANCE_STATUS_LABELS[status]}
                          >
                            {STATUS_ICONS[status]}
                            <span className="hidden sm:inline">{ATTENDANCE_STATUS_LABELS[status]}</span>
                          </button>
                        ))}

                        {existing && (
                          <button
                            onClick={() => openEditDialog(existing)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-0.5"
                            title="编辑备注"
                          >
                            <MessageSquare className="size-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── Statistics Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-lg border border-border/40 p-3 space-y-1"
        >
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BarChart3 className="size-3" />
            出勤率
          </p>
          {recordsLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <p className={cn('text-lg font-bold tabular-nums', stats.rate >= 80 ? 'text-emerald-600' : stats.rate >= 60 ? 'text-amber-600' : 'text-red-600')}>
              {stats.total > 0 ? `${stats.rate}%` : '--'}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-lg border border-border/40 p-3 space-y-1"
        >
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Flame className="size-3 text-orange-500" />
            连续出勤
          </p>
          {recordsLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <p className="text-lg font-bold tabular-nums text-orange-600">
              {stats.streak > 0 ? `${stats.streak} 天` : '--'}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
          className="rounded-lg border border-border/40 p-3 space-y-1"
        >
          <p className="text-xs text-muted-foreground">总记录</p>
          {recordsLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <p className="text-lg font-bold tabular-nums text-foreground">{stats.total}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-lg border border-border/40 p-3 space-y-1"
        >
          <p className="text-xs text-muted-foreground">缺勤/请假</p>
          {recordsLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <p className="text-lg font-bold tabular-nums">
              <span className="text-red-600">{stats.absent}</span>
              <span className="text-muted-foreground mx-0.5">/</span>
              <span className="text-sky-600">{stats.leave}</span>
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Per-Course Stats (when showing all courses) ── */}
      <AnimatePresence>
        {selectedCourseId === 'all' && courseStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-xs text-muted-foreground font-medium px-1">各课程出勤率</p>
            <div className="space-y-1.5">
              {courseStats.map((cs) => (
                <div key={cs.course.id} className="flex items-center gap-2.5 px-1 group">
                  <div
                    className="size-2 rounded-full shrink-0 ring-1 ring-background"
                    style={{ backgroundColor: cs.course.color }}
                  />
                  <span className="text-xs text-foreground truncate flex-1 min-w-0">{cs.course.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cs.rate}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          cs.rate >= 80 ? 'bg-emerald-500' : cs.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                      />
                    </div>
                    <span className={cn(
                      'text-[10px] font-medium tabular-nums w-8 text-right',
                      cs.rate >= 80 ? 'text-emerald-600' : cs.rate >= 60 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {cs.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Monthly Calendar ── */}
      <Card className="border-border/40 overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-[140px] h-7 text-xs">
                  <SelectValue placeholder="全部课程" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部课程</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="size-7 p-0" onClick={goToPrevMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium"
                onClick={goToToday}
              >
                {viewYear} 年 {getMonthName(viewMonth)}
              </Button>
              <Button variant="ghost" size="sm" className="size-7 p-0" onClick={goToNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 gap-1">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div
                key={day}
                className={cn(
                  'text-center text-[10px] font-medium text-muted-foreground py-1',
                  day === '日' || day === '六' ? 'text-muted-foreground/60' : ''
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {recordsLoading ? (
            <CalendarGridSkeleton />
          ) : (
            <div className="space-y-1">
              {Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) }).map((_, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const dayNum = weekIdx * 7 + dayIdx - firstDay + 1;
                    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                    const isToday =
                      isCurrentMonth &&
                      viewYear === now.getFullYear() &&
                      viewMonth === now.getMonth() &&
                      dayNum === now.getDate();
                    const dateStr = isCurrentMonth ? formatDateStr(viewYear, viewMonth, dayNum) : '';
                    const record = dateStr ? attendanceMap[dateStr] : null;
                    const status = record?.status as AttendanceStatus | undefined;
                    const isWeekend = dayIdx === 0 || dayIdx === 6;

                    return (
                      <motion.button
                        key={dayIdx}
                        whileHover={isCurrentMonth ? { scale: 1.1 } : undefined}
                        whileTap={isCurrentMonth && record ? { scale: 0.95 } : undefined}
                        onClick={() => {
                          if (record) openEditDialog(record);
                        }}
                        disabled={!isCurrentMonth}
                        className={cn(
                          'aspect-square rounded-md flex flex-col items-center justify-center transition-all relative text-xs',
                          !isCurrentMonth && 'opacity-0 cursor-default',
                          isCurrentMonth && !record && 'hover:bg-muted/50 cursor-default',
                          isCurrentMonth && record && 'cursor-pointer',
                          isToday && 'ring-1 ring-primary/30',
                          isWeekend && isCurrentMonth && !record && 'text-muted-foreground/40'
                        )}
                      >
                        {isCurrentMonth && (
                          <>
                            <span
                              className={cn(
                                'text-[10px] font-medium leading-none',
                                isToday ? 'text-primary font-bold' : 'text-foreground/70'
                              )}
                            >
                              {dayNum}
                            </span>
                            {status && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: weekIdx * 0.02 + dayIdx * 0.01 }}
                                className="mt-0.5"
                              >
                                {React.cloneElement(STATUS_ICONS[status] as React.ReactElement, {
                                  className: cn('size-2.5', status === 'present' && 'text-emerald-500', status === 'absent' && 'text-red-500', status === 'late' && 'text-amber-500', status === 'leave' && 'text-sky-500'),
                                })}
                              </motion.div>
                            )}
                            {/* Multiple records indicator */}
                            {!status && dateStr && records.filter((r) => r.date === dateStr).length > 0 && (
                              <div className="flex gap-0.5 mt-0.5">
                                {records
                                  .filter((r) => r.date === dateStr)
                                  .slice(0, 3)
                                  .map((r) => (
                                    <div
                                      key={r.id}
                                      className={cn('size-1 rounded-full', STATUS_DOT_COLORS[r.status as AttendanceStatus])}
                                    />
                                  ))}
                              </div>
                            )}
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 pt-1 border-t border-border/30">
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">出勤</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">缺勤</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">迟到</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-sky-500" />
              <span className="text-[10px] text-muted-foreground">请假</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <div className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground">无记录</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Edit / Note Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              编辑考勤记录
              {editingRecord?.course && (
                <span className="text-muted-foreground font-normal ml-2">· {editingRecord.course.name}</span>
              )}
            </DialogTitle>
            {editingRecord && (
              <p className="text-xs text-muted-foreground">{editingRecord.date}</p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Status selector */}
            <div className="space-y-1.5">
              <Label className="text-xs">考勤状态</Label>
              <div className="grid grid-cols-4 gap-2">
                {ATTENDANCE_STATUS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditStatus(s)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all',
                      editStatus === s
                        ? cn(QUICK_BUTTON_STYLES[s], 'ring-1 ring-current/20')
                        : 'border-border/40 text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <span className={cn(
                      editStatus === s ? '' : 'text-muted-foreground/60',
                    )}>
                      {STATUS_ICONS[s]}
                    </span>
                    <span className="text-[10px] font-medium">{ATTENDANCE_STATUS_LABELS[s]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label className="text-xs">备注（可选）</Label>
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="添加备注信息..."
                className="text-sm min-h-[60px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {editingRecord && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(editingRecord.id)}
                disabled={deleteMutation.isPending}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 mr-auto"
              >
                {deleteMutation.isPending && <Loader2 className="size-3 animate-spin mr-1" />}
                删除
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRecord}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="size-3 animate-spin mr-1" />}
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
