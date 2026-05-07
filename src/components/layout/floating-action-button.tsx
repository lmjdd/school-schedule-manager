'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, ClipboardList, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Course } from '@/lib/types';

// ── Sub-button definitions ──────────────────────────────────────────────────

interface SubAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  onClick: () => void;
}

// ── Quick Note Dialog ───────────────────────────────────────────────────────

function QuickNoteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '创建失败');
      }
      toast.success('笔记已保存');
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建笔记失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">📝</span> 快速笔记
          </DialogTitle>
          <DialogDescription>快速记录你的想法和灵感</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note-title">标题</Label>
            <Input
              id="note-title"
              placeholder="输入笔记标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note-content">内容</Label>
            <Textarea
              id="note-content"
              placeholder="输入笔记内容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={saving}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={saving}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Quick Assignment Dialog ─────────────────────────────────────────────────

function QuickAssignmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setCourseId('');
    setDueDate(undefined);
  }, []);

  // Fetch courses when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCourses(data);
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入作业标题');
      return;
    }
    if (!courseId) {
      toast.error('请选择课程');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        courseId,
      };
      if (dueDate) {
        body.dueDate = dueDate.toISOString();
      }
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '创建失败');
      }
      toast.success('作业已创建');
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建作业失败');
    } finally {
      setSaving(false);
    }
  };

  // Deduplicate courses by name for the select dropdown
  const uniqueCourses = courses.reduce<Course[]>((acc, c) => {
    if (!acc.find((x) => x.name === c.name)) acc.push(c);
    return acc;
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">📋</span> 快速作业
          </DialogTitle>
          <DialogDescription>快速添加一条新的作业记录</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assign-title">作业标题</Label>
            <Input
              id="assign-title"
              placeholder="输入作业标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>所属课程</Label>
            <Select value={courseId} onValueChange={setCourseId} disabled={saving || loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? '加载中...' : '选择课程'} />
              </SelectTrigger>
              <SelectContent>
                {uniqueCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>截止日期（可选）</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={saving}
                >
                  {dueDate ? (
                    dueDate.toLocaleDateString('zh-CN')
                  ) : (
                    <span className="text-muted-foreground">选择日期</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => {
                    setDueDate(d);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={saving}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Floating Action Button ──────────────────────────────────────────────────

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close FAB menu when a dialog opens
  useEffect(() => {
    if (noteOpen || assignOpen) {
      setIsOpen(false);
    }
  }, [noteOpen, assignOpen]);

  // Handle check-in
  const handleCheckIn = async () => {
    close();
    setCheckingIn(true);
    try {
      // 1. Fetch all courses
      const coursesRes = await fetch('/api/courses');
      if (!coursesRes.ok) throw new Error('获取课程失败');
      const allCourses: Course[] = await coursesRes.json();

      // 2. Filter courses that match today's dayOfWeek
      const today = new Date();
      const currentDay = today.getDay(); // 0=Sun, 1=Mon, ...
      const todayCourses = allCourses.filter((c) => c.dayOfWeek === currentDay);

      if (todayCourses.length === 0) {
        toast.info('今天没有课程需要打卡');
        setCheckingIn(false);
        return;
      }

      // 3. POST attendance for each today's course
      const todayISO = today.toISOString().split('T')[0];
      let successCount = 0;

      await Promise.all(
        todayCourses.map(async (c) => {
          try {
            const res = await fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courseId: c.id,
                date: todayISO,
                status: 'present',
              }),
            });
            if (res.ok) successCount++;
          } catch {
            // skip individual failures
          }
        }),
      );

      if (successCount > 0) {
        toast.success(`已为 ${successCount} 门课程打卡`);
      } else {
        toast.error('打卡失败，请稍后重试');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '打卡失败');
    } finally {
      setCheckingIn(false);
    }
  };

  const subActions: SubAction[] = [
    {
      id: 'note',
      label: '快速笔记',
      icon: <FileText className="size-5 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-300',
      onClick: () => setNoteOpen(true),
    },
    {
      id: 'assignment',
      label: '快速作业',
      icon: <ClipboardList className="size-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      onClick: () => setAssignOpen(true),
    },
    {
      id: 'checkin',
      label: '完成打卡',
      icon: checkingIn ? (
        <Loader2 className="size-5 text-primary animate-spin" />
      ) : (
        <CheckCircle2 className="size-5 text-primary" />
      ),
      color: 'bg-primary/10 border-primary/30',
      textColor: 'text-primary',
      onClick: handleCheckIn,
    },
  ];

  return (
    <>
      {/* Only render on mobile — hidden on md+ */}
      <div className="md:hidden">
        {/* Backdrop overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Speed-dial sub-buttons */}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3">
              {subActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 25,
                    delay: index * 0.06,
                  }}
                >
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-md shadow-sm ${action.textColor} bg-background/90 backdrop-blur-sm border`}
                  >
                    {action.label}
                  </span>
                  <button
                    type="button"
                    onClick={action.onClick}
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border cursor-pointer transition-colors active:scale-95 ${action.color}`}
                    aria-label={action.label}
                  >
                    {action.icon}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          type="button"
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center cursor-pointer active:scale-95"
          onClick={toggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isOpen ? '关闭菜单' : '快速操作'}
          aria-expanded={isOpen}
        >
          <motion.span
            className="flex items-center justify-center"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Plus className="size-6" />
          </motion.span>
        </motion.button>
      </div>

      {/* Dialogs */}
      <QuickNoteDialog open={noteOpen} onOpenChange={setNoteOpen} />
      <QuickAssignmentDialog open={assignOpen} onOpenChange={setAssignOpen} />
    </>
  );
}
