'use client';

import { useEffect, useRef, useCallback } from 'react';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SENT_NOTIFICATIONS_KEY = 'edutrack-sent-notifications';
const NOTIFICATION_ENABLED_KEY = 'edutrack-browser-notifications';

function getSentNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SENT_NOTIFICATIONS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function addSentNotificationId(id: string) {
  const ids = getSentNotificationIds();
  ids.add(id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SENT_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
  }
}

function isNotificationEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(NOTIFICATION_ENABLED_KEY);
    if (raw !== null) return JSON.parse(raw);
  } catch { /* ignore */ }
  return true; // Default to enabled
}

function generateNotificationId(type: string, itemId: string, trigger: string): string {
  // Include the date so the same notification resets each day
  const today = new Date().toISOString().slice(0, 10);
  return `${type}:${itemId}:${trigger}:${today}`;
}

async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function NotificationServiceWrapper() {
  useNotificationService();
  return null;
}

function useNotificationService() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAndNotify = useCallback(async () => {
    // Check if browser notifications are enabled
    if (!isNotificationEnabled()) return;

    // Check permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const sentIds = getSentNotificationIds();

    try {
      // Fetch assignments
      const assignRes = await fetch('/api/assignments');
      if (!assignRes.ok) return;
      const assignments: Array<{
        id: string;
        title: string;
        dueDate: string | null;
        status: string;
        course?: { name: string };
      }> = await assignRes.json();

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

      for (const assignment of assignments) {
        if (assignment.status === 'completed') continue;
        if (!assignment.dueDate) continue;

        const dueDate = new Date(assignment.dueDate);
        const courseName = assignment.course?.name || '';

        // Due today
        if (dueDate >= startOfToday && dueDate < startOfTomorrow) {
          const notifId = generateNotificationId('assignment', assignment.id, 'today');
          if (!sentIds.has(notifId)) {
            new Notification('📋 作业今日截止', {
              body: courseName ? `「${assignment.title}」(${courseName}) 今天截止！` : `「${assignment.title}」今天截止！`,
              tag: notifId,
            });
            addSentNotificationId(notifId);
          }
        }

        // Due tomorrow
        const startOfTomorrowEnd = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000);
        if (dueDate >= startOfTomorrow && dueDate < startOfTomorrowEnd) {
          const notifId = generateNotificationId('assignment', assignment.id, 'tomorrow');
          if (!sentIds.has(notifId)) {
            new Notification('📋 作业明日截止', {
              body: courseName ? `「${assignment.title}」(${courseName}) 明天截止！` : `「${assignment.title}」明天截止！`,
              tag: notifId,
            });
            addSentNotificationId(notifId);
          }
        }
      }

      // Fetch exams
      const examRes = await fetch('/api/exams');
      if (!examRes.ok) return;
      const exams: Array<{
        id: string;
        title: string;
        date: string;
        type: string;
        course?: { name: string };
      }> = await examRes.json();

      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      for (const exam of exams) {
        const examDate = new Date(exam.date);
        const courseName = exam.course?.name || '';

        // Exam within 3 days (from now)
        if (examDate >= now && examDate <= threeDaysFromNow) {
          const daysUntil = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const triggerKey = daysUntil <= 0 ? 'today' : daysUntil <= 1 ? 'tomorrow' : '3days';
          const notifId = generateNotificationId('exam', exam.id, triggerKey);

          if (!sentIds.has(notifId)) {
            const daysText = daysUntil <= 0 ? '今天' : daysUntil === 1 ? '明天' : `${daysUntil} 天后`;
            new Notification('📝 考试提醒', {
              body: courseName
                ? `「${exam.title}」(${courseName}) ${daysText}开考！`
                : `「${exam.title}」${daysText}开考！`,
              tag: notifId,
            });
            addSentNotificationId(notifId);
          }
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    // Initial check after a short delay (let page load first)
    const initialTimeout = setTimeout(() => {
      checkAndNotify();
    }, 3000);

    // Periodic check every 5 minutes
    intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAndNotify]);
}
