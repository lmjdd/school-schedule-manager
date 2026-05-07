'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  ClipboardList,
  StickyNote,
  MoreHorizontal,
  CalendarDays,
  BarChart3,
  Camera,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PageType } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavTab {
  id: PageType;
  label: string;
  icon: React.ElementType;
}

const bottomTabs: NavTab[] = [
  { id: 'dashboard', label: '首页', icon: Home },
  { id: 'courses', label: '课程', icon: BookOpen },
  { id: 'assignments', label: '作业', icon: ClipboardList },
  { id: 'notes', label: '笔记', icon: StickyNote },
];

const moreTabs: NavTab[] = [
  { id: 'exams', label: '考试管理', icon: CalendarDays },
  { id: 'statistics', label: '学业统计', icon: BarChart3 },
  { id: 'recognize', label: '截图识别', icon: Camera },
  { id: 'settings', label: '设置', icon: Settings },
];

export function MobileNav() {
  const { currentPage, setCurrentPage } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleTabClick = (page: PageType) => {
    setCurrentPage(page);
    setMoreOpen(false);
  };

  const isBottomTabActive = bottomTabs.some((t) => t.id === currentPage);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 safe-area-bottom"
        aria-label="底部导航"
      >
        <div className="flex items-center justify-around h-14">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    className={cn(
                      'size-5 transition-colors duration-150',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] leading-none transition-colors duration-150',
                    isActive ? 'font-medium text-primary' : 'font-normal text-muted-foreground',
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* "More" tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              !isBottomTabActive && !moreOpen ? 'text-primary' : 'text-muted-foreground',
            )}
            aria-label="更多"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <MoreHorizontal
                className={cn(
                  'size-5 transition-colors duration-150',
                  !isBottomTabActive ? 'text-primary' : 'text-muted-foreground',
                )}
                strokeWidth={!isBottomTabActive ? 2.2 : 1.8}
              />
            </motion.div>
            <span
              className={cn(
                'text-[10px] leading-none transition-colors duration-150',
                !isBottomTabActive ? 'font-medium text-primary' : 'font-normal text-muted-foreground',
              )}
            >
              更多
            </span>
          </button>
        </div>
      </nav>

      {/* More Sheet / Drawer */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl p-0 max-h-[60vh]">
          <SheetHeader className="px-4 pt-4 pb-2">
            {/* Drag handle */}
            <div className="flex justify-center mb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <SheetTitle className="text-sm text-center">更多页面</SheetTitle>
            <SheetDescription className="text-xs text-center text-muted-foreground">
              选择其他功能页面
            </SheetDescription>
          </SheetHeader>

          <div className="px-2 pb-6 space-y-1">
            {moreTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = currentPage === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4.5 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="more-active-indicator"
                      className="ml-auto size-2 rounded-full bg-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
