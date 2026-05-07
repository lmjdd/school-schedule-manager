'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, CalendarClock, CalendarRange, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import type { Exam } from '@/lib/types';
import { ExamFormDialog } from '@/components/exams/exam-form-dialog';
import { ExamList } from '@/components/exams/exam-list';
import { ExamCountdownDashboard } from '@/components/exams/exam-countdown-dashboard';

async function fetchExams(): Promise<Exam[]> {
  const res = await fetch('/api/exams');
  if (!res.ok) throw new Error('Failed to fetch exams');
  return res.json();
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay?: number;
}

function SummaryCard({ icon, label, value, color, delay = 0 }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + delay * 0.06, ease: 'easeOut' }}
      className={`rounded-lg border border-border/40 bg-card p-4 hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-center gap-3">
        <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold font-mono tabular-nums text-foreground leading-tight">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function ExamsPage() {
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const handleAddExam = () => {
    setEditingExam(null);
    setDialogOpen(true);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingExam(null);
    }
  };

  // Summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const in7Days = exams.filter((e) => {
      const examDate = new Date(e.date);
      return examDate >= today && examDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    const thisMonth = exams.filter((e) => {
      const examDate = new Date(e.date);
      return (
        examDate.getMonth() === now.getMonth() &&
        examDate.getFullYear() === now.getFullYear()
      );
    });

    return {
      in7Days: in7Days.length,
      thisMonth: thisMonth.length,
      total: exams.length,
    };
  }, [exams]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            📝 考试管理
          </h1>
          {!isLoading && (
            <Badge variant="secondary" className="font-mono tabular-nums text-xs">
              {exams.length} 场
            </Badge>
          )}
          {isLoading && (
            <Skeleton className="h-5 w-12 rounded-full" />
          )}
        </div>

        <Button size="sm" onClick={handleAddExam} className="gap-1.5">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">添加考试</span>
        </Button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<CalendarClock className="size-4 text-orange-600" />}
          label="近7天内考试"
          value={isLoading ? -1 : stats.in7Days}
          color="bg-orange-50 border border-orange-100"
          delay={0}
        />
        <SummaryCard
          icon={<CalendarRange className="size-4 text-emerald-600" />}
          label="本月考试"
          value={isLoading ? -1 : stats.thisMonth}
          color="bg-emerald-50 border border-emerald-100"
          delay={1}
        />
        <SummaryCard
          icon={<GraduationCap className="size-4 text-sky-600" />}
          label="总考试数"
          value={isLoading ? -1 : stats.total}
          color="bg-sky-50 border border-sky-100"
          delay={2}
        />
      </div>

      {/* Exam Countdown Dashboard */}
      <ExamCountdownDashboard />

      {/* Exam List */}
      <ExamList onEdit={handleEditExam} onAdd={handleAddExam} />

      {/* Form Dialog */}
      <ExamFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        exam={editingExam}
      />
    </motion.div>
  );
}
