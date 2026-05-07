export interface Course {
  id: string;
  name: string;
  teacher: string | null;
  location: string | null;
  credit: number;
  category: string;
  color: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startWeek: number;
  endWeek: number;
  semester: string;
  createdAt: string;
  updatedAt: string;
  assignments?: Assignment[];
  exams?: Exam[];
  grades?: Grade[];
}

export interface Subtask {
  id: string;
  assignmentId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  course?: Course;
  description: string | null;
  dueDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: number;
  remindDays: number;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  course?: Course;
  date: string;
  location: string | null;
  seat: string | null;
  type: string;
  remindDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  courseId: string;
  course?: Course;
  semester: string;
  score: number | null;
  gradePoint: number | null;
  credit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  courseId: string | null;
  course?: Course;
  tag: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  courseId: string;
  course?: Course;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'leave'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: '出勤',
  absent: '缺勤',
  late: '迟到',
  leave: '请假',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; dot: string; ring: string }> = {
  present: { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  absent: { bg: 'bg-red-100 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800' },
  late: { bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-800' },
  leave: { bg: 'bg-sky-100 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', ring: 'ring-sky-200 dark:ring-sky-800' },
};

export interface DailyQuote {
  id: number;
  content: string;
  author: string;
  source?: string;
}

export type PageType = 'dashboard' | 'courses' | 'assignments' | 'notes' | 'exams' | 'statistics' | 'settings' | 'recognize';

export const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;
export const DAY_NAMES_SHORT = ['日', '一', '二', '三', '四', '五', '六'] as const;

export const COURSE_CATEGORIES = ['必修', '选修', '通识', '实践'] as const;

export const TIME_SLOTS = [
  { label: '第1-2节', start: '08:00', end: '09:40' },
  { label: '第3-4节', start: '10:00', end: '11:40' },
  { label: '第5-6节', start: '14:00', end: '15:40' },
  { label: '第7-8节', start: '16:00', end: '17:40' },
  { label: '第9-10节', start: '19:00', end: '20:40' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: '待完成',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已逾期',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

export const EXAM_TYPES = ['期中考试', '期末考试', '随堂测验', '模拟考试'] as const;

export const NOTE_TAGS = ['重点', '复习', '公式', '笔记', '作业', '考试'] as const;
