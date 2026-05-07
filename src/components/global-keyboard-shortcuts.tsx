'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import type { PageType } from '@/lib/types';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  StickyNote,
  CalendarDays,
  BarChart3,
  Camera,
  Settings,
  Keyboard,
  Search,
} from 'lucide-react';

interface ShortcutItem {
  key: string;
  label: string;
  icon: React.ElementType;
  page: PageType;
}

const shortcuts: ShortcutItem[] = [
  { key: 'Alt + 1', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { key: 'Alt + 2', label: '课程管理', icon: BookOpen, page: 'courses' },
  { key: 'Alt + 3', label: '作业管理', icon: ClipboardList, page: 'assignments' },
  { key: 'Alt + 4', label: '学习笔记', icon: StickyNote, page: 'notes' },
  { key: 'Alt + 5', label: '考试管理', icon: CalendarDays, page: 'exams' },
  { key: 'Alt + 6', label: '学业统计', icon: BarChart3, page: 'statistics' },
  { key: 'Alt + 7', label: '截图识别', icon: Camera, page: 'recognize' },
  { key: 'Alt + 8', label: '设置', icon: Settings, page: 'settings' },
];

function isInputFocused(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function GlobalKeyboardShortcuts() {
  const { setCurrentPage, searchOpen, setSearchOpen } = useAppStore();
  const [helpOpen, setHelpOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle search dialog
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
        return;
      }

      // Skip if user is typing in an input
      if (isInputFocused(e)) return;

      // Alt + 1-8 for navigation
      if (e.altKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 8) {
          e.preventDefault();
          const shortcut = shortcuts[num - 1];
          if (shortcut) {
            setCurrentPage(shortcut.page);
          }
          return;
        }
      }

      // ? key for help dialog
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    },
    [setCurrentPage, searchOpen, setSearchOpen],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-4" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            使用快捷键快速导航到不同页面
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-1">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <kbd className="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground shadow-sm">
                  {item.key}
                </kbd>
              </div>
            );
          })}
          <div className="border-t border-border my-2" />
          <div className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <Search className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">全局搜索</span>
            </div>
            <kbd className="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground shadow-sm">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-secondary/80 transition-colors">
            <span className="text-sm text-foreground">快捷键帮助</span>
            <kbd className="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground shadow-sm">
              ?
            </kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
