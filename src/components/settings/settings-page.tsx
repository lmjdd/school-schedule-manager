'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Download,
  Upload,
  Trash2,
  Save,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  AlertTriangle,
  Info,
  Loader2,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/helpers';

/* ---------- Local storage settings ---------- */

interface AppSettings {
  currentSemester: string;
  totalCreditsRequired: number;
  gpaTarget: number;
}

const SETTINGS_KEY = 'edutrack-settings';
const NOTIFICATION_ENABLED_KEY = 'edutrack-browser-notifications';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return { currentSemester: '2024-2025-2', totalCreditsRequired: 160, gpaTarget: 3.5 };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { currentSemester: '2024-2025-2', totalCreditsRequired: 160, gpaTarget: 3.5 };
}

function saveSettingsToLS(settings: AppSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

/* ---------- Data fetchers ---------- */

async function fetchCourses(): Promise<{ id: string }[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

async function fetchAssignments(): Promise<{ id: string }[]> {
  const res = await fetch('/api/assignments');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

async function fetchExams(): Promise<{ id: string }[]> {
  const res = await fetch('/api/exams');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

async function fetchGrades(): Promise<{ id: string }[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

/* ---------- Stat Card ---------- */

function StatItem({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
    >
      <div className={cn('size-8 rounded-lg flex items-center justify-center', color)}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold font-mono tabular-nums text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

/* ---------- Main Component ---------- */

export function SettingsPage() {
  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    currentSemester: '2024-2025-2',
    totalCreditsRequired: 160,
    gpaTarget: 3.5,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  // Import state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Data queries for stats
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: assignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: fetchAssignments });
  const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: fetchExams });
  const { data: grades = [] } = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
    setSettingsLoaded(true);
    // Load notification preference
    try {
      const raw = localStorage.getItem(NOTIFICATION_ENABLED_KEY);
      if (raw !== null) setBrowserNotificationsEnabled(JSON.parse(raw));
    } catch { /* ignore */ }
    // Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleSaveSettings = () => {
    saveSettingsToLS(settings);
    toast.success('设置已保存');
  };

  /* ---------- Export ---------- */

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `edutrack-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('数据已导出');
    } catch {
      toast.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  /* ---------- Import ---------- */

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImportFile(file);
    setShowImportDialog(true);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return;
    setIsImporting(true);
    setShowImportDialog(false);

    try {
      const text = await pendingImportFile.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Import failed');

      toast.success('数据导入成功，页面即将刷新...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error('导入失败，请检查文件格式');
    } finally {
      setIsImporting(false);
      setPendingImportFile(null);
    }
  };

  /* ---------- Clear ---------- */

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: [], assignments: [], exams: [], grades: [] }),
      });

      if (!res.ok) throw new Error('Clear failed');

      toast.success('所有数据已清空，页面即将刷新...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error('清空失败，请重试');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          ⚙️ 设置
        </h1>
      </motion.div>

      {/* Data Management Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="rounded-lg border-border/60 notion-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DatabaseIcon className="size-4 text-muted-foreground" />
              数据管理
            </CardTitle>
            <CardDescription className="text-xs">
              导出备份、导入恢复、或清空所有数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-1.5"
              >
                {isExporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                导出数据
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => importInputRef.current?.click()}
                disabled={isImporting}
                className="gap-1.5"
              >
                {isImporting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                导入数据
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isClearing}
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    {isClearing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    清空数据
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认清空所有数据？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将删除所有课程、作业、考试和成绩记录，且无法恢复。建议先导出备份。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      确认清空
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
              <AlertTriangle className="size-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                导入数据将覆盖所有现有数据，请谨慎操作。建议在导入前先导出当前数据作为备份。
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Semester Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="rounded-lg border-border/60 notion-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              学期设置
            </CardTitle>
            <CardDescription className="text-xs">
              配置当前学期和学业目标
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Semester */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">当前学期</Label>
                <Input
                  value={settings.currentSemester}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, currentSemester: e.target.value }))
                  }
                  placeholder="2024-2025-2"
                  className="h-9 text-sm"
                />
              </div>

              {/* Total Credits Required */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">总学分要求</Label>
                <Input
                  type="number"
                  value={settings.totalCreditsRequired}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      totalCreditsRequired: Number(e.target.value) || 160,
                    }))
                  }
                  min={0}
                  max={300}
                  className="h-9 text-sm font-mono"
                />
              </div>

              {/* GPA Target */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">GPA 目标</Label>
                <Input
                  type="number"
                  step={0.1}
                  value={settings.gpaTarget}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      gpaTarget: Number(e.target.value) || 3.5,
                    }))
                  }
                  min={0}
                  max={4.0}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveSettings}
                disabled={!settingsLoaded}
                className="gap-1.5"
              >
                <Save className="size-3.5" />
                保存设置
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="rounded-lg border-border/60 notion-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              通知设置
            </CardTitle>
            <CardDescription className="text-xs">
              管理浏览器通知和截止提醒
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">浏览器推送通知</p>
                <p className="text-xs text-muted-foreground">
                  在作业截止或考试临近时发送浏览器通知
                </p>
              </div>
              <Switch
                checked={browserNotificationsEnabled}
                onCheckedChange={(checked) => {
                  setBrowserNotificationsEnabled(checked);
                  localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(checked));
                  if (checked && notifPermission === 'default') {
                    Notification.requestPermission().then((perm) => {
                      setNotifPermission(perm);
                      if (perm === 'granted') {
                        toast.success('通知权限已开启');
                      } else if (perm === 'denied') {
                        toast.error('通知权限被拒绝，请在浏览器设置中开启');
                      }
                    });
                  }
                }}
              />
            </div>

            {browserNotificationsEnabled && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
                <Info className="size-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {notifPermission === 'granted'
                    ? '浏览器通知已授权，系统将每 5 分钟检查一次截止日期并发送提醒。'
                    : notifPermission === 'denied'
                      ? '浏览器通知已被拒绝，请在浏览器地址栏的权限设置中重新开启通知权限。'
                      : '首次开启时将请求通知权限，请点击「允许」以接收截止提醒。'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Statistics Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="rounded-lg border-border/60 notion-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChartIcon className="size-4 text-muted-foreground" />
              数据统计
            </CardTitle>
            <CardDescription className="text-xs">
              当前数据概览
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <StatItem
                icon={BookOpen}
                label="课程数量"
                value={courses.length}
                color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                delay={0}
              />
              <StatItem
                icon={ClipboardList}
                label="作业数量"
                value={assignments.length}
                color="bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                delay={0.05}
              />
              <StatItem
                icon={FileText}
                label="考试数量"
                value={exams.length}
                color="bg-sky-50 text-sky-600 dark:bg-sky-950/30"
                delay={0.1}
              />
              <StatItem
                icon={GraduationCap}
                label="成绩记录"
                value={grades.length}
                color="bg-violet-50 text-violet-600 dark:bg-violet-950/30"
                delay={0.15}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <Card className="rounded-lg border-border/60 notion-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="size-4 text-muted-foreground" />
              关于
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 to-violet-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                E
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">EduTrack</h3>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs py-0 px-1.5">
                    v1.0.0
                  </Badge>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              EduTrack 是一款 Notion 风格的学生事务管理助手，帮助你高效管理课程、作业、考试和成绩，
              并通过截图识别功能快速导入教务数据。让学习管理更轻松、更有条理。
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hidden import file input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFileSelect}
        className="hidden"
        aria-label="导入数据文件"
      />

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认导入数据？</AlertDialogTitle>
            <AlertDialogDescription>
              导入数据将覆盖所有现有的课程、作业、考试和成绩记录。
              文件名：<strong>{pendingImportFile?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingImportFile(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              确认导入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- Helper Icon Components ---------- */

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
