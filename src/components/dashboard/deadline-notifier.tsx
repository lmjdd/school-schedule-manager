'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  course?: { name: string };
}

const CHECK_INTERVAL = 60 * 1000; // 60 seconds

export function DeadlineNotifier() {
  const notifiedIds = useRef<Set<string>>(new Set());
  const toastedIds = useRef<Set<string>>(new Set());

  const checkDeadlines = useCallback(async () => {
    try {
      const res = await fetch('/api/assignments');
      if (!res.ok) return;
      const assignments: Assignment[] = await res.json();

      const now = Date.now();

      for (const assignment of assignments) {
        // Skip completed assignments
        if (assignment.status === 'completed') continue;
        if (!assignment.dueDate) continue;

        const dueTime = new Date(assignment.dueDate).getTime();
        // Skip past deadlines
        if (dueTime <= now) continue;

        const hoursLeft = (dueTime - now) / (1000 * 60 * 60);

        // Browser notification: due within 24 hours
        if (hoursLeft <= 24 && !notifiedIds.current.has(assignment.id)) {
          // Request permission if not granted
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
              await Notification.requestPermission();
            }
            if (Notification.permission === 'granted') {
              const hoursText = hoursLeft < 1
                ? '不到 1 小时'
                : `${Math.floor(hoursLeft)} 小时`;
              new Notification('⏰ 作业提醒', {
                body: `「${assignment.title}」将在 ${hoursText}后截止`,
                tag: `ddl-${assignment.id}`,
              });
            }
          }
          notifiedIds.current.add(assignment.id);
        }

        // In-app toast: due within 1 hour
        if (hoursLeft <= 1 && !toastedIds.current.has(assignment.id)) {
          const minutesLeft = Math.floor(hoursLeft * 60);
          const timeText = minutesLeft <= 0
            ? '即将截止'
            : `${minutesLeft} 分钟`;
          toast.warning('⏰ 作业即将截止', {
            description: `「${assignment.title}」将在 ${timeText}后截止`,
            duration: 6000,
          });
          toastedIds.current.add(assignment.id);
        }
      }
    } catch {
      // Silently fail - this is a background check
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkDeadlines();

    // Periodic check
    const interval = setInterval(checkDeadlines, CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [checkDeadlines]);

  // This component renders nothing visible
  return null;
}
