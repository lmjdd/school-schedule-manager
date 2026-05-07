'use client';

import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  StickyNote,
  CalendarDays,
  BarChart3,
  Camera,
  Settings,
  GraduationCap,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import type { PageType } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  id: PageType;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'courses', label: '课程管理', icon: BookOpen },
  { id: 'assignments', label: '作业管理', icon: ClipboardList },
  { id: 'notes', label: '学习笔记', icon: StickyNote },
  { id: 'exams', label: '考试管理', icon: CalendarDays },
  { id: 'statistics', label: '学业统计', icon: BarChart3 },
  { id: 'recognize', label: '截图识别', icon: Camera },
  { id: 'settings', label: '设置', icon: Settings },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
        'hover:bg-secondary/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'text-muted-foreground hover:text-foreground',
      )}
      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {theme === 'dark' ? (
        <Sun className="size-[18px] shrink-0" />
      ) : (
        <Moon className="size-[18px] shrink-0" />
      )}
      <span>{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
    </button>
  );
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-mono leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SmallBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { currentPage, setCurrentPage } = useAppStore();

  // Fetch data for badges and footer using shared query keys
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) return [];
      return res.json();
    },
  });

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

  // Compute badge counts
  const pendingAssignmentsCount = React.useMemo(
    () => assignments.filter((a: any) => a.status !== 'completed').length,
    [assignments],
  );

  const upcomingExamsCount = React.useMemo(() => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return exams.filter((e: any) => {
      const examDate = new Date(e.date);
      return examDate >= now && examDate <= sevenDaysLater;
    }).length;
  }, [exams]);

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page);
    onItemClick?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Accent gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-chart-1 via-chart-3 to-chart-2 shrink-0"><span></span></div>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-gradient-to-br from-chart-1/10 to-chart-3/10 dark:from-chart-1/20 dark:to-chart-3/20 flex items-center justify-center">
            <span className="text-lg">📚</span>
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-foreground tracking-tight">
              EduTrack
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-muted-foreground">
                学生事务管理助手
              </p>
              <span className="inline-flex items-center rounded px-1.5 py-0 text-[10px] font-mono text-muted-foreground/60 bg-muted/50">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Search Trigger */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => useAppStore.getState().setSearchOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm transition-all duration-150 hover:border-primary/40 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground"
          aria-label="搜索"
        >
          <Search className="size-[16px] shrink-0" />
          <span className="flex-1 text-left text-xs">搜索...</span>
          <kbd className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70 leading-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5" aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          // Determine badge for this nav item
          let badge: React.ReactNode = null;
          if (item.id === 'assignments') {
            badge = <NotificationBadge count={pendingAssignmentsCount} />;
          } else if (item.id === 'exams') {
            badge = <SmallBadge count={upcomingExamsCount} />;
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                'hover:bg-secondary/80',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isActive
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator bar */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ transformOrigin: 'center' }}
                  />
                )}
              </AnimatePresence>
              <span className="relative shrink-0">
                <Icon
                  className={cn(
                    'size-[18px]',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                />
                {badge}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <div className="px-3 pb-2">
        <ThemeToggle />
      </div>

      <Separator />

      {/* Bottom Quick Stats */}
      <SidebarFooter
        coursesCount={courses.length}
        pendingCount={assignments.filter((a: any) => a.status !== 'completed').length}
      />

      {/* Branding footer */}
      <div className="mt-auto px-4 pb-4 pt-2">
        <p className="text-[10px] text-muted-foreground/40 text-center tracking-wide">
          EduTrack © 2025
        </p>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 120, damping: 24, mass: 0.5 });
  const display = useTransform(spring, (v: number) => Math.round(v));
  const [text, setText] = React.useState('0');

  React.useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (v: number) => {
      setText(String(v));
    });
    return unsubscribe;
  }, [value, spring, display]);

  return <>{text}</>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accentColor?: string;
}) {
  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2.5 border border-border/30 transition-colors duration-200',
        'hover:bg-secondary/60 hover:border-border/50',
        value > 0 && accentColor ? accentColor : 'bg-secondary/40',
      )}
    >
      <div className={cn(
        'size-7 rounded-md flex items-center justify-center shrink-0',
        'bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10',
      )}>
        <Icon className="size-3.5 text-primary/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground truncate leading-tight">
          {label}
        </p>
      </div>
      <span className="text-sm font-semibold text-foreground tabular-nums font-mono leading-none">
        <AnimatedNumber value={value} />
      </span>
    </motion.div>
  );
}

function SidebarFooter({
  coursesCount,
  pendingCount,
}: {
  coursesCount: number;
  pendingCount: number;
}) {
  return (
    <div className="px-3 py-3 space-y-1.5">
      <StatCard
        icon={GraduationCap}
        label="本学期课程"
        value={coursesCount}
      />
      <StatCard
        icon={ClipboardList}
        label="待完成作业"
        value={pendingCount}
        accentColor={pendingCount > 0 ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/40 dark:border-amber-800/30' : undefined}
      />
    </div>
  );
}

export function AppSidebar() {
  const isMobile = useIsMobile();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  // Mobile: render inside a Sheet
  if (isMobile) {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-60 p-0 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>导航菜单</SheetTitle>
            <SheetDescription>EduTrack 主导航</SheetDescription>
          </SheetHeader>
          <SidebarContent onItemClick={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-60 bg-gradient-to-b from-sidebar via-sidebar to-sidebar border-r border-sidebar-border flex flex-col">
      <SidebarContent />
    </aside>
  );
}

export function SidebarMobileTrigger() {
  const setMobileSidebarOpen = useAppStore((s) => s.setMobileSidebarOpen);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 md:hidden"
      onClick={() => setMobileSidebarOpen(true)}
      aria-label="打开导航菜单"
    >
      <svg
        className="size-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </Button>
  );
}
