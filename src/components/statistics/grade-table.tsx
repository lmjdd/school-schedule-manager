'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  calculateGPA,
  calculateTotalCredits,
  formatGPA,
  getScoreColor,
  getGradeLevel,
  cn,
} from '@/lib/helpers';
import type { Grade, Course } from '@/lib/types';
import { toast } from 'sonner';
import { GradeFormDialog } from './grade-form-dialog';
import { QuickGradeEntrySheet } from './quick-grade-entry-sheet';

async function fetchGrades(): Promise<Grade[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) throw new Error('Failed to fetch grades');
  return res.json();
}

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

type SortKey = 'courseName' | 'score' | 'gradePoint' | 'credit' | 'semester';
type SortDir = 'asc' | 'desc';

interface GradeTableProps {
  semester?: string | null;
}

export function GradeTable({ semester }: GradeTableProps) {
  const queryClient = useQueryClient();
  const [sortKey, setSortKey] = useState<SortKey>('semester');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Grade | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  const { data: allGrades = [], isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  const grades = useMemo(() => {
    if (!semester) return allGrades;
    return allGrades.filter((g) => g.semester === semester);
  }, [allGrades, semester]);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);

  const sortedGrades = useMemo(() => {
    return [...grades].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortKey) {
        case 'courseName': {
          const nameA = courseMap.get(a.courseId)?.name || '未知';
          const nameB = courseMap.get(b.courseId)?.name || '未知';
          valA = nameA;
          valB = nameB;
          break;
        }
        case 'score':
          valA = a.score ?? -1;
          valB = b.score ?? -1;
          break;
        case 'gradePoint':
          valA = a.gradePoint ?? -1;
          valB = b.gradePoint ?? -1;
          break;
        case 'credit':
          valA = a.credit;
          valB = b.credit;
          break;
        case 'semester':
          valA = a.semester || '';
          valB = b.semester || '';
          break;
        default:
          return 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [grades, courseMap, sortKey, sortDir]);

  const stats = useMemo(() => {
    const gradedGrades = grades.filter((g) => g.score !== null && g.score !== undefined);
    const totalScore = gradedGrades.reduce((sum, g) => sum + (g.score as number), 0);
    const avgScore = gradedGrades.length > 0 ? totalScore / gradedGrades.length : 0;
    const totalCredits = calculateTotalCredits(grades);
    const gpa = calculateGPA(grades);
    const maxScore = gradedGrades.length > 0 ? Math.max(...gradedGrades.map((g) => g.score as number)) : 0;

    return { avgScore, totalCredits, gpa, maxScore, count: grades.length };
  }, [grades]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }, [sortKey]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/grades?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('成绩已删除');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('删除成绩失败');
    },
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
      >
        <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>📋</span>
                <span>成绩明细</span>
                {grades.length > 0 && (
                  <Badge variant="secondary" className="font-mono tabular-nums text-xs">
                    {grades.length}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickEntryOpen(true)}
                className="gap-1.5 text-xs h-8 shrink-0"
              >
                <Zap className="size-3 text-amber-500" />
                快速录入
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : grades.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <div className="flex items-center justify-center mb-3">
                  <div className="size-14 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950/40 dark:to-blue-950/40 flex items-center justify-center animate-float">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
                <p>暂无成绩记录</p>
                <p className="text-xs mt-1">点击下方按钮添加成绩</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">
                        <button onClick={() => handleSort('courseName')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <span>课程名</span>
                          {sortKey === 'courseName' ? (sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      </TableHead>
                      <TableHead className="min-w-[60px]">
                        <button onClick={() => handleSort('credit')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <span>学分</span>
                          {sortKey === 'credit' ? (sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      </TableHead>
                      <TableHead className="min-w-[60px]">
                        <button onClick={() => handleSort('score')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <span>成绩</span>
                          {sortKey === 'score' ? (sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      </TableHead>
                      <TableHead className="min-w-[60px]">
                        <button onClick={() => handleSort('gradePoint')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <span>绩点</span>
                          {sortKey === 'gradePoint' ? (sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      </TableHead>
                      <TableHead className="min-w-[60px]">等级</TableHead>
                      <TableHead className="min-w-[110px]">
                        <button onClick={() => handleSort('semester')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <span>学期</span>
                          {sortKey === 'semester' ? (sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      </TableHead>
                      <TableHead className="w-[70px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {sortedGrades.map((grade, index) => {
                        const course = courseMap.get(grade.courseId);
                        const courseName = course?.name || '未知课程';
                        const score = grade.score;
                        const gp = grade.gradePoint;
                        const gradeLevel = score !== null && score !== undefined ? getGradeLevel(score) : '--';
                        const scoreColor = score !== null && score !== undefined ? getScoreColor(score) : '';

                        return (
                          <motion.tr
                            key={grade.id}
                            layout
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="hover:bg-muted/50 border-b transition-colors group"
                          >
                            <TableCell className="font-medium text-sm">
                              <div className="flex items-center gap-2">
                                {course && (
                                  <div
                                    className="size-2 rounded-full shrink-0"
                                    style={{ backgroundColor: course.color }}
                                  />
                                )}
                                <span className="truncate max-w-[200px]">{courseName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono tabular-nums text-sm">
                              {grade.credit}
                            </TableCell>
                            <TableCell>
                              <span className={cn('font-mono tabular-nums text-sm font-medium', scoreColor)}>
                                {score !== null && score !== undefined ? score : '--'}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono tabular-nums text-sm">
                              {gp !== null && gp !== undefined ? gp.toFixed(1) : '--'}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{gradeLevel}</span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {grade.semester}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0"
                                  onClick={() => {
                                    setEditingGrade(grade);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => setDeleteTarget(grade)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                  {grades.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium text-xs text-muted-foreground">
                          平均 / 总计
                        </TableCell>
                        <TableCell className="font-mono tabular-nums text-xs font-medium">
                          {stats.totalCredits}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums text-xs font-medium">
                          {stats.avgScore > 0 ? Math.round(stats.avgScore) : '--'}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums text-xs font-medium">
                          {formatGPA(stats.gpa)}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Grade Entry Sheet */}
      <QuickGradeEntrySheet
        open={quickEntryOpen}
        onOpenChange={setQuickEntryOpen}
      />

      {/* Edit/Add Dialog */}
      <GradeFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGrade(null);
        }}
        grade={editingGrade}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget ? courseMap.get(deleteTarget.courseId)?.name || '该课程' : ''}」的成绩记录吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
