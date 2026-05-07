'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, AlertTriangle, CalendarDays, Check, CheckCheck, ClipboardList } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/helpers';

const SEEN_NOTIFICATIONS_KEY = 'edutrack-seen-notifications';

interface DeadlineNotification {
  id: string;
  type: 'assignment' | 'exam';
  title: string;
  courseName: string;
  deadline: Date;
  message: string;
  urgency: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'normal';
}

function getSeenNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function markNotificationsAsSeen(ids: string[]) {
  if (typeof window === 'undefined') return;
  const existing = getSeenNotificationIds();
  const updated = new Set([...existing, ...ids]);
  localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify([...updated]));
}

function clearSeenNotifications() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SEEN_NOTIFICATIONS_KEY);
}

function NotificationIcon({ urgency }: { urgency: DeadlineNotification['urgency'] }) {
  switch (urgency) {
    case 'overdue':
      return <AlertTriangle className="size-4 text-red-500 shrink-0" />;
    case 'today':
      return <AlertTriangle className="size-4 text-orange-500 shrink-0" />;
    case 'tomorrow':
      return <Clock className="size-4 text-amber-500 shrink-0" />;
    case 'soon':
      return <CalendarDays className="size-4 text-sky-500 shrink-0" />;
    default:
      return <ClipboardList className="size-4 text-muted-foreground shrink-0" />;
  }
}

function UrgencyBadge({ urgency }: { urgency: DeadlineNotification['urgency'] }) {
  const config: Record<string, { label: string; className: string }> = {
    overdue: { label: '已逾期', className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
    today: { label: '今天', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' },
    tomorrow: { label: '明天', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
    soon: { label: '3天内', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400' },
    normal: { label: '即将', className: 'bg-muted text-muted-foreground' },
  };
  const { label, className } = config[urgency] || config.normal;
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none', className)}>
      {label}
    </span>
  );
}

function formatDeadline(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `已逾期 ${Math.abs(diffDays)} 天`;
  if (diffDays === 0) return '今天截止';
  if (diffDays === 1) return '明天截止';
  if (diffDays <= 3) return `${diffDays} 天后截止`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => getSeenNotificationIds());
  const { setCurrentPage } = useAppStore();

  // Fetch data
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const res = await fetch('/api/assignments');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await fetch('/api/exams');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Generate notifications from deadlines
  const notifications = useMemo<DeadlineNotification[]>(() => {
    const result: DeadlineNotification[] = [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Assignments due within 3 days (not completed)
    for (const a of assignments) {
      if (a.status === 'completed') continue;
      if (!a.dueDate) continue;

      const dueDate = new Date(a.dueDate);
      const daysUntil = Math.ceil((dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        result.push({
          id: `assignment-overdue-${a.id}`,
          type: 'assignment',
          title: a.title,
          courseName: a.course?.name || '',
          deadline: dueDate,
          message: `「${a.title}」${a.course?.name ? `(${a.course.name})` : ''}已逾期！`,
          urgency: 'overdue',
        });
      } else if (daysUntil === 0) {
        result.push({
          id: `assignment-today-${a.id}`,
          type: 'assignment',
          title: a.title,
          courseName: a.course?.name || '',
          deadline: dueDate,
          message: `「${a.title}」${a.course?.name ? `(${a.course.name})` : ''}今天截止！`,
          urgency: 'today',
        });
      } else if (daysUntil === 1) {
        result.push({
          id: `assignment-tomorrow-${a.id}`,
          type: 'assignment',
          title: a.title,
          courseName: a.course?.name || '',
          deadline: dueDate,
          message: `「${a.title}」${a.course?.name ? `(${a.course.name})` : ''}明天截止！`,
          urgency: 'tomorrow',
        });
      } else if (daysUntil <= 3) {
        result.push({
          id: `assignment-soon-${a.id}`,
          type: 'assignment',
          title: a.title,
          courseName: a.course?.name || '',
          deadline: dueDate,
          message: `「${a.title}」${a.course?.name ? `(${a.course.name})` : ''} ${daysUntil} 天后截止`,
          urgency: 'soon',
        });
      }
    }

    // Exams within 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    for (const exam of exams) {
      const examDate = new Date(exam.date);
      if (examDate < now || examDate > sevenDaysFromNow) continue;

      const daysUntil = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let urgency: DeadlineNotification['urgency'] = 'normal';
      if (daysUntil <= 0) urgency = 'today';
      else if (daysUntil === 1) urgency = 'tomorrow';
      else if (daysUntil <= 3) urgency = 'soon';

      result.push({
        id: `exam-${exam.id}`,
        type: 'exam',
        title: exam.title,
        courseName: exam.course?.name || '',
        deadline: examDate,
        message: `「${exam.title}」${exam.course?.name ? `(${exam.course.name})` : ''} ${daysUntil <= 0 ? '今天开考' : `${daysUntil} 天后开考`}`,
        urgency,
      });
    }

    // Sort by urgency (overdue first, then today, tomorrow, soon, normal)
    const urgencyOrder: Record<string, number> = {
      overdue: 0, today: 1, tomorrow: 2, soon: 3, normal: 4,
    };
    result.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return result;
  }, [assignments, exams]);

  // Calculate unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenIds.has(n.id)).length,
    [notifications, seenIds],
  );

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    markNotificationsAsSeen(allIds);
    setSeenIds(new Set(allIds));
  }, [notifications]);

  // Navigate to relevant page
  const handleNotificationClick = useCallback(
    (notification: DeadlineNotification) => {
      // Mark as seen
      markNotificationsAsSeen([notification.id]);
      setSeenIds((prev) => new Set([...prev, notification.id]));

      // Navigate to the relevant page
      if (notification.type === 'assignment') {
        setCurrentPage('assignments');
      } else if (notification.type === 'exam') {
        setCurrentPage('exams');
      }
      setOpen(false);
    },
    [setCurrentPage],
  );

  // Auto mark as seen when popover opens
  const handlePopoverOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && notifications.length > 0) {
      const ids = notifications.map((n) => n.id);
      markNotificationsAsSeen(ids);
      setSeenIds(new Set(ids));
    }
  }, [notifications]);

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative size-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`通知${unreadCount > 0 ? ` (${unreadCount} 未读)` : ''}`}
        >
          <Bell className="size-[18px]" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-mono leading-none"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">截止提醒</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-mono leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <CheckCheck className="size-3" />
              全部已读
            </Button>
          )}
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="py-10 px-4 flex flex-col items-center gap-2 text-muted-foreground">
            <Bell className="size-8 opacity-30" />
            <p className="text-sm">暂无截止提醒</p>
            <p className="text-xs opacity-70">当有即将到期的作业或考试时，这里会显示提醒</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="py-1">
              {notifications.map((notification) => {
                const isUnread = !seenIds.has(notification.id);
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex items-start gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                      isUnread && 'bg-primary/[0.03]',
                    )}
                  >
                    <NotificationIcon urgency={notification.urgency} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-foreground truncate font-medium">
                          {notification.message}
                        </p>
                        {isUnread && (
                          <span className="size-1.5 rounded-full bg-primary shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <UrgencyBadge urgency={notification.urgency} />
                        <span className="text-[11px] text-muted-foreground">
                          {formatDeadline(notification.deadline)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <button
              onClick={clearSeenNotifications}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Check className="size-3" />
              清除已读记录
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
