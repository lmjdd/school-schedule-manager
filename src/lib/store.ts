import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageType, Course, Assignment, Exam, Grade, DailyQuote, Note } from './types';
import { getDailyQuote, getRandomQuote } from './quotes';

// ── Widget Layout Constants ──────────────────────────────────────────────

export const WIDGET_IDS = [
  'WELCOME_BANNER',
  'WEEKLY_OVERVIEW',
  'TODAY_COURSES',
  'UPCOMING_DEADLINES',
  'POMODORO_TIMER',
  'FOCUS_CHART',
  'ASSIGNMENT_TIMELINE',
  'DAILY_SUMMARY',
  'STUDY_HEATMAP',
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

export const WIDGET_META: Record<WidgetId, { label: string; icon: string }> = {
  WELCOME_BANNER: { label: '欢迎横幅', icon: '✨' },
  WEEKLY_OVERVIEW: { label: '本周概览', icon: '📈' },
  TODAY_COURSES: { label: '今日课程', icon: '📅' },
  UPCOMING_DEADLINES: { label: '即将截止', icon: '⏰' },
  POMODORO_TIMER: { label: '番茄钟', icon: '🍅' },
  FOCUS_CHART: { label: '专注历史', icon: '📊' },
  ASSIGNMENT_TIMELINE: { label: '作业时间线', icon: '📋' },
  DAILY_SUMMARY: { label: '每日总结', icon: '📝' },
  STUDY_HEATMAP: { label: '学习热力图', icon: '🔥' },
};

// ── Widget Layout Store (persisted to localStorage) ─────────────────────

interface WidgetLayoutState {
  widgetOrder: WidgetId[];
  hiddenWidgets: WidgetId[];
  setWidgetOrder: (order: WidgetId[]) => void;
  toggleWidgetVisibility: (widgetId: WidgetId) => void;
  resetWidgetLayout: () => void;
}

export const useWidgetLayoutStore = create<WidgetLayoutState>()(
  persist(
    (set) => ({
      widgetOrder: [...WIDGET_IDS],
      hiddenWidgets: [],
      setWidgetOrder: (order) => set({ widgetOrder: order }),
      toggleWidgetVisibility: (widgetId) =>
        set((state) => ({
          hiddenWidgets: state.hiddenWidgets.includes(widgetId)
            ? state.hiddenWidgets.filter((id) => id !== widgetId)
            : [...state.hiddenWidgets, widgetId],
        })),
      resetWidgetLayout: () =>
        set({
          widgetOrder: [...WIDGET_IDS],
          hiddenWidgets: [],
        }),
    }),
    { name: 'edutrack-widget-layout' },
  ),
);

interface AppState {
  // Navigation
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;

  // Daily Quote
  currentQuote: DailyQuote;
  favoriteQuoteIds: number[];
  refreshQuote: () => void;
  toggleFavoriteQuote: (id: number) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Course filter
  courseView: 'list' | 'schedule' | 'attendance';
  setCourseView: (view: 'list' | 'schedule' | 'attendance') => void;
  currentWeek: number;
  setCurrentWeek: (week: number) => void;

  // Assignment filter
  assignmentFilter: string;
  setAssignmentFilter: (filter: string) => void;

  // Modal state
  editingCourse: Course | null;
  setEditingCourse: (course: Course | null) => void;
  editingAssignment: Assignment | null;
  setEditingAssignment: (assignment: Assignment | null) => void;
  editingExam: Exam | null;
  setEditingExam: (exam: Exam | null) => void;

  // Note filter
  noteSearch: string;
  setNoteSearch: (search: string) => void;
  noteFilter: string;
  setNoteFilter: (filter: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Daily Quote
  currentQuote: getDailyQuote(),
  favoriteQuoteIds: [],
  refreshQuote: () => {
    let newQuote = getRandomQuote();
    let attempts = 0;
    while (newQuote.id === get().currentQuote.id && attempts < 10) {
      newQuote = getRandomQuote();
      attempts++;
    }
    set({ currentQuote: newQuote });
  },
  toggleFavoriteQuote: (id) => {
    const current = get().favoriteQuoteIds;
    if (current.includes(id)) {
      set({ favoriteQuoteIds: current.filter((qid) => qid !== id) });
    } else {
      set({ favoriteQuoteIds: [...current, id] });
    }
  },

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Course filter
  courseView: 'schedule',
  setCourseView: (view) => set({ courseView: view }),

  currentWeek: 1,
  setCurrentWeek: (week) => set({ currentWeek: week }),

  // Assignment filter
  assignmentFilter: 'all',
  setAssignmentFilter: (filter) => set({ assignmentFilter: filter }),

  // Modal state
  editingCourse: null,
  setEditingCourse: (course) => set({ editingCourse: course }),
  editingAssignment: null,
  setEditingAssignment: (assignment) => set({ editingAssignment: assignment }),
  editingExam: null,
  setEditingExam: (exam) => set({ editingExam: exam }),

  // Note filter
  noteSearch: '',
  setNoteSearch: (search) => set({ noteSearch: search }),
  noteFilter: 'all',
  setNoteFilter: (filter) => set({ noteFilter: filter }),
}));

