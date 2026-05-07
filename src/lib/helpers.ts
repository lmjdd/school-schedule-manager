import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Grade } from './types';

export function formatGPA(gpa: number): string {
  return gpa.toFixed(2);
}

export function calculateGPA(grades: Grade[]): number {
  const validGrades = grades.filter((g) => g.gradePoint !== null && g.gradePoint !== undefined && g.credit > 0);
  if (validGrades.length === 0) return 0;

  const totalWeightedPoints = validGrades.reduce((sum, g) => sum + (g.gradePoint! * g.credit), 0);
  const totalCredits = validGrades.reduce((sum, g) => sum + g.credit, 0);

  return totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
}

export function calculateTotalCredits(grades: Grade[]): number {
  return grades.reduce((sum, g) => sum + g.credit, 0);
}

export function getGPAColor(gpa: number): string {
  if (gpa >= 3.7) return 'text-emerald-600';
  if (gpa >= 3.0) return 'text-blue-600';
  if (gpa >= 2.0) return 'text-amber-600';
  return 'text-red-600';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

export function getGradeLevel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '中等';
  if (score >= 60) return '及格';
  return '不及格';
}

export function scoreToGradePoint(score: number): number {
  if (score >= 90) return 4.0;
  if (score >= 85) return 3.7;
  if (score >= 82) return 3.3;
  if (score >= 78) return 3.0;
  if (score >= 75) return 2.7;
  if (score >= 72) return 2.3;
  if (score >= 68) return 2.0;
  if (score >= 64) return 1.5;
  if (score >= 60) return 1.0;
  return 0;
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isBefore(new Date(dueDate), startOfDay(new Date()));
}

export function getDaysUntil(date: string | Date): number {
  const target = startOfDay(new Date(date));
  const today = startOfDay(new Date());
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd'): string {
  return format(new Date(date), pattern, { locale: zhCN });
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

export function getRelativeDueDate(date: string | null): string {
  if (!date) return '';
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    if (diffDays === -1) return '昨天截止';
    return `已逾期 ${Math.abs(diffDays)} 天`;
  }
  if (diffDays === 0) return '今天截止';
  if (diffDays === 1) return '明天截止';
  if (diffDays <= 7) return `${diffDays} 天后截止`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} 周后截止`;
  return `${Math.ceil(diffDays / 30)} 个月后截止`;
}

export function getExamCountdown(date: string | Date): { text: string; urgent: 'critical' | 'warning' | 'normal' | 'past' } {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMs < 0) return { text: '已结束', urgent: 'past' };
  if (diffMinutes < 60) return { text: `${diffMinutes} 分钟后`, urgent: 'critical' };
  if (diffHours < 24) return { text: `${diffHours} 小时后`, urgent: 'critical' };
  if (diffDays === 0) return { text: '今天', urgent: 'critical' };
  if (diffDays === 1) return { text: '明天', urgent: 'critical' };
  if (diffDays <= 3) return { text: `${diffDays} 天后`, urgent: 'warning' };
  if (diffDays <= 7) return { text: `${diffDays} 天后`, urgent: 'warning' };
  return { text: `${diffDays} 天后`, urgent: 'normal' };
}

export function getPriorityBorderColor(priority: number): string {
  switch (priority) {
    case 3: return 'border-l-red-500';
    case 2: return 'border-l-amber-500';
    case 1: return 'border-l-green-500';
    default: return 'border-l-gray-300';
  }
}

export function getPriorityBgColor(priority: number): string {
  switch (priority) {
    case 3: return 'bg-red-500';
    case 2: return 'bg-amber-500';
    case 1: return 'bg-green-500';
    default: return 'bg-gray-400';
  }
}

export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 3: return '紧急';
    case 2: return '高';
    case 1: return '中';
    default: return '低';
  }
}

export function getPriorityDotColor(priority: number): string {
  switch (priority) {
    case 3: return 'bg-red-500';
    case 2: return 'bg-amber-500';
    case 1: return 'bg-green-500';
    default: return 'bg-gray-400';
  }
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function getCurrentWeek(startDate?: string): number {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, weeks);
}

export function getCoursesForDay(courses: any[], dayOfWeek: number, week: number): any[] {
  return courses.filter(
    (c) => c.dayOfWeek === dayOfWeek && week >= c.startWeek && week <= c.endWeek
  );
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getAssignmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || colors.pending;
}

export function generateColor(index: number): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    '#a855f7', '#d946ef', '#f59e0b', '#10b981', '#0ea5e9',
  ];
  return colors[index % colors.length];
}
