'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Camera,
  BarChart3,
  Download,
  Upload,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PageType, Course } from '@/lib/types';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  page?: PageType;
  action?: () => void;
  color: string;
}

function useQuickActions(): QuickAction[] {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    try {
      const [coursesRes, assignmentsRes, gradesRes, examsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/assignments'),
        fetch('/api/grades'),
        fetch('/api/exams'),
      ]);

      const [courses, assignments, grades, exams] = await Promise.all([
        coursesRes.json(),
        assignmentsRes.json(),
        gradesRes.json(),
        examsRes.json(),
      ]);

      const data = {
        exportDate: new Date().toISOString(),
        version: 1,
        courses,
        assignments,
        grades,
        exams,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edutrack-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('数据已导出');
    } catch {
      toast.error('导出失败，请重试');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') throw new Error('Invalid file');
        const data = JSON.parse(content);

        if (!data.version || !data.courses) {
          toast.error('文件格式不正确');
          return;
        }

        // Re-import each entity type
        const importPromises: Promise<Response>[] = [];

        if (Array.isArray(data.courses)) {
          for (const course of data.courses) {
            const { id, assignments, exams, grades, createdAt, updatedAt, ...courseData } = course as Record<string, unknown>;
            importPromises.push(
              fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData),
              }),
            );
          }
        }

        await Promise.allSettled(importPromises);
        toast.success(`数据导入成功`);
        window.location.reload();
      } catch {
        toast.error('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
  };

  return [
    {
      label: '添加课程',
      icon: BookOpen,
      page: 'courses',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: '添加作业',
      icon: Plus,
      page: 'assignments',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: '截图识别',
      icon: Camera,
      page: 'recognize',
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30',
    },
    {
      label: '查看统计',
      icon: BarChart3,
      page: 'statistics',
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30',
    },
    {
      label: '导出数据',
      icon: Download,
      action: handleExport,
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/30',
    },
    {
      label: '导入数据',
      icon: Upload,
      action: () => fileInputRef.current?.click(),
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    },
  ];
}

export function QuickActions() {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actions = useQuickActions();
  const [seeding, setSeeding] = useState(false);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const hasNoCourses = courses.length === 0;

  const handleClick = (action: QuickAction) => {
    if (action.page) {
      setCurrentPage(action.page);
    } else if (action.action) {
      action.action();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24, ease: 'easeOut' }}
        className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
      >
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>⚡</span>
            <span>快捷操作</span>
          </h3>
        </div>

        {/* Action grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.3 + index * 0.04, ease: 'easeOut' }}
                onClick={() => handleClick(action)}
                className="flex flex-col items-center gap-2 p-3.5 rounded-lg border border-transparent hover:bg-secondary/60 hover:border-border/40 transition-all cursor-pointer group text-center interactive-card"
              >
                <div
                  className={`size-9 rounded-lg flex items-center justify-center ${action.color} transition-transform group-hover:scale-110`}
                >
                  <Icon className="size-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Seed data button when no courses */}
        {hasNoCourses && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <button
              onClick={async () => {
                setSeeding(true);
                try {
                  const res = await fetch('/api/seed', { method: 'POST' });
                  if (res.ok) {
                    toast.success('示例数据已填充');
                    queryClient.invalidateQueries();
                  } else {
                    toast.error('填充失败，请重试');
                  }
                } catch {
                  toast.error('填充失败，请重试');
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {seeding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {seeding ? '正在填充...' : '填充示例数据'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const content = event.target?.result;
              if (typeof content !== 'string') throw new Error('Invalid file');
              const data = JSON.parse(content);

              if (!data.version || !data.courses) {
                toast.error('文件格式不正确');
                return;
              }

              const importPromises: Promise<Response>[] = [];

              if (Array.isArray(data.courses)) {
                for (const course of data.courses) {
                  const { id, assignments, exams, grades, createdAt, updatedAt, ...courseData } = course as Record<string, unknown>;
                  importPromises.push(
                    fetch('/api/courses', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(courseData),
                    }),
                  );
                }
              }

              if (Array.isArray(data.assignments)) {
                for (const assignment of data.assignments) {
                  const { id, course, createdAt, updatedAt, ...assignmentData } = assignment as Record<string, unknown>;
                  importPromises.push(
                    fetch('/api/assignments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(assignmentData),
                    }),
                  );
                }
              }

              if (Array.isArray(data.exams)) {
                for (const exam of data.exams) {
                  const { id, course, createdAt, updatedAt, ...examData } = exam as Record<string, unknown>;
                  importPromises.push(
                    fetch('/api/exams', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(examData),
                    }),
                  );
                }
              }

              if (Array.isArray(data.grades)) {
                for (const grade of data.grades) {
                  const { id, course, createdAt, updatedAt, ...gradeData } = grade as Record<string, unknown>;
                  importPromises.push(
                    fetch('/api/grades', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(gradeData),
                    }),
                  );
                }
              }

              await Promise.allSettled(importPromises);
              toast.success('数据导入成功');
              window.location.reload();
            } catch {
              toast.error('导入失败，请检查文件格式');
            }
          };
          reader.readAsText(file);
          e.target.value = '';
        }}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
}
