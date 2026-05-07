'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  Import,
  Loader2,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/helpers';
import { generateColor } from '@/lib/helpers';

/* ---------- Types ---------- */

interface RecognizedCourse {
  name: string;
  teacher: string | null;
  location: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startWeek: number;
  endWeek: number;
  credit: number;
}

interface RecognizedGrade {
  courseName: string;
  credit: number;
  score: number | null;
  gradePoint: number | null;
}

interface RecognitionData {
  type: 'schedule';
  courses: RecognizedCourse[];
}

interface GradesRecognitionData {
  type: 'grades';
  semester: string;
  grades: RecognizedGrade[];
}

const DAY_NAMES_MAP: Record<number, string> = {
  1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日',
};

/* ---------- Props ---------- */

interface RecognitionResultProps {
  data: RecognitionData | GradesRecognitionData;
  rawText?: string;
  onCancel: () => void;
  onDone: () => void;
}

/* ---------- Editable Cell ---------- */

function EditableCell({
  value,
  onChange,
  className,
  type = 'text',
}: {
  value: string | number | null;
  onChange: (val: string) => void;
  className?: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  const handleBlur = () => {
    setEditing(false);
    onChange(draft);
  };

  if (editing) {
    return (
      <Input
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur();
          if (e.key === 'Escape') {
            setEditing(false);
            setDraft(String(value ?? ''));
          }
        }}
        className={cn('h-7 text-xs px-1.5 py-0', className)}
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(String(value ?? ''));
        setEditing(true);
      }}
      className={cn(
        'text-xs text-left hover:bg-secondary/60 rounded px-1.5 py-0.5 transition-colors cursor-text min-w-[40px]',
        className
      )}
    >
      {value ?? <span className="text-muted-foreground/50 italic">--</span>}
    </button>
  );
}

/* ---------- Schedule Result ---------- */

function ScheduleResult({
  data,
  onImport,
  isImporting,
}: {
  data: RecognitionData;
  onImport: (selectedIndices: number[]) => Promise<void>;
  isImporting: boolean;
}) {
  const [courses, setCourses] = useState<RecognizedCourse[]>(data.courses);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(data.courses.map((_, i) => i))
  );
  const [expanded, setExpanded] = useState(true);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === courses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(courses.map((_, i) => i)));
    }
  };

  const updateCourse = (index: number, field: keyof RecognizedCourse, value: string) => {
    setCourses((prev) => {
      const next = [...prev];
      const course = { ...next[index] };
      if (['dayOfWeek', 'startWeek', 'endWeek', 'credit'].includes(field)) {
        (course as Record<string, unknown>)[field] = Number(value) || 0;
      } else {
        (course as Record<string, unknown>)[field] = value;
      }
      next[index] = course;
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) {
      toast.error('请至少选择一项导入');
      return;
    }
    await onImport(Array.from(selected));
  };

  return (
    <Card className="rounded-lg border-border/60 notion-card">
      <CardContent className="p-0">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-border/40 cursor-pointer hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-4 text-emerald-500" />
            <span className="text-sm font-medium text-foreground">
              识别到 {courses.length} 门课程
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              已选 {selected.size} 项
            </Badge>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <ScrollArea className="max-h-[420px]">
                <div className="divide-y divide-border/30">
                  {/* Select all row */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted/20">
                    <Checkbox
                      checked={selected.size === courses.length && courses.length > 0}
                      onCheckedChange={toggleAll}
                      className="size-4"
                    />
                    <span className="text-xs text-muted-foreground font-medium">全选 / 取消全选</span>
                  </div>

                  {/* Course rows */}
                  {courses.map((course, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors',
                        selected.has(index) ? 'bg-background' : 'bg-muted/20 opacity-60'
                      )}
                    >
                      <div className="pt-1">
                        <Checkbox
                          checked={selected.has(index)}
                          onCheckedChange={() => toggleSelect(index)}
                          className="size-4"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Course name + day */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-background"
                            style={{ backgroundColor: generateColor(index) }}
                          />
                          <EditableCell
                            value={course.name}
                            onChange={(val) => updateCourse(index, 'name', val)}
                            className="font-medium text-foreground"
                          />
                          <Badge variant="outline" className="text-xs py-0 px-1.5">
                            {DAY_NAMES_MAP[course.dayOfWeek] || `周${course.dayOfWeek}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs py-0 px-1.5 font-mono">
                            {course.startTime}-{course.endTime}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span>教师:</span>
                            <EditableCell
                              value={course.teacher}
                              onChange={(val) => updateCourse(index, 'teacher', val)}
                              className="text-xs inline"
                            />
                          </span>
                          <span className="flex items-center gap-1">
                            <span>地点:</span>
                            <EditableCell
                              value={course.location}
                              onChange={(val) => updateCourse(index, 'location', val)}
                              className="text-xs inline"
                            />
                          </span>
                          <span className="flex items-center gap-1">
                            <span>学分:</span>
                            <EditableCell
                              value={course.credit}
                              onChange={(val) => updateCourse(index, 'credit', val)}
                              type="number"
                              className="text-xs inline font-mono"
                            />
                          </span>
                          <span className="flex items-center gap-1">
                            <span>周次:</span>
                            <EditableCell
                              value={`${course.startWeek}-${course.endWeek}`}
                              onChange={(val) => {
                                const parts = val.split('-');
                                updateCourse(index, 'startWeek', parts[0] || '1');
                                updateCourse(index, 'endWeek', parts[1] || '16');
                              }}
                              className="text-xs inline font-mono"
                            />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Action bar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  点击文字可编辑 · 已选择 <span className="font-mono font-medium text-foreground">{selected.size}</span> 门课程
                </p>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={isImporting || selected.size === 0}
                  className="gap-1.5"
                >
                  {isImporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Import className="size-3.5" />
                  )}
                  确认导入 ({selected.size})
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/* ---------- Grades Result ---------- */

function GradesResult({
  data,
  onImport,
  isImporting,
}: {
  data: GradesRecognitionData;
  onImport: (selectedIndices: number[]) => Promise<void>;
  isImporting: boolean;
}) {
  const [grades, setGrades] = useState<RecognizedGrade[]>(data.grades);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(data.grades.map((_, i) => i))
  );
  const [expanded, setExpanded] = useState(true);

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === grades.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(grades.map((_, i) => i)));
    }
  };

  const updateGrade = (index: number, field: keyof RecognizedGrade, value: string) => {
    setGrades((prev) => {
      const next = [...prev];
      const grade = { ...next[index] };
      if (['credit', 'score', 'gradePoint'].includes(field)) {
        (grade as Record<string, unknown>)[field] = value === '' ? null : Number(value);
      } else {
        (grade as Record<string, unknown>)[field] = value;
      }
      next[index] = grade;
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) {
      toast.error('请至少选择一项导入');
      return;
    }
    await onImport(Array.from(selected));
  };

  return (
    <Card className="rounded-lg border-border/60 notion-card">
      <CardContent className="p-0">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-border/40 cursor-pointer hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <GraduationCap className="size-4 text-violet-500" />
            <span className="text-sm font-medium text-foreground">
              识别到 {grades.length} 条成绩记录
            </span>
            {data.semester && (
              <Badge variant="outline" className="text-xs">{data.semester}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              已选 {selected.size} 项
            </Badge>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <ScrollArea className="max-h-[420px]">
                <div className="divide-y divide-border/30">
                  {/* Select all row */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted/20">
                    <Checkbox
                      checked={selected.size === grades.length && grades.length > 0}
                      onCheckedChange={toggleAll}
                      className="size-4"
                    />
                    <span className="text-xs text-muted-foreground font-medium">全选 / 取消全选</span>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-4 py-2 bg-muted/10 text-xs font-medium text-muted-foreground">
                    <span>课程名称</span>
                    <span className="text-center">学分</span>
                    <span className="text-center">成绩</span>
                    <span className="text-center">绩点</span>
                  </div>

                  {/* Grade rows */}
                  {grades.map((grade, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        'grid grid-cols-[auto_1fr_60px_60px_60px] gap-2 items-center px-4 py-2.5 transition-colors',
                        selected.has(index) ? 'bg-background' : 'bg-muted/20 opacity-60'
                      )}
                    >
                      <Checkbox
                        checked={selected.has(index)}
                        onCheckedChange={() => toggleSelect(index)}
                        className="size-4"
                      />
                      <EditableCell
                        value={grade.courseName}
                        onChange={(val) => updateGrade(index, 'courseName', val)}
                        className="font-medium text-foreground"
                      />
                      <EditableCell
                        value={grade.credit}
                        onChange={(val) => updateGrade(index, 'credit', val)}
                        type="number"
                        className="text-center font-mono"
                      />
                      <EditableCell
                        value={grade.score}
                        onChange={(val) => updateGrade(index, 'score', val)}
                        type="number"
                        className="text-center font-mono"
                      />
                      <EditableCell
                        value={grade.gradePoint}
                        onChange={(val) => updateGrade(index, 'gradePoint', val)}
                        type="number"
                        className="text-center font-mono"
                      />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Action bar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  <Pencil className="size-3 inline mr-1" />
                  点击文字可编辑 · 已选择 <span className="font-mono font-medium text-foreground">{selected.size}</span> 条记录
                </p>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={isImporting || selected.size === 0}
                  className="gap-1.5"
                >
                  {isImporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Import className="size-3.5" />
                  )}
                  确认导入 ({selected.size})
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/* ---------- Raw Result ---------- */

function RawResult({ text }: { text: string }) {
  return (
    <Card className="rounded-lg border-border/60 notion-card">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-foreground">识别结果</span>
          <Badge variant="secondary" className="text-xs">纯文本</Badge>
        </div>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed bg-muted/30 rounded-lg p-3.5">
            {text}
          </pre>
        </div>
        <p className="text-xs text-muted-foreground mt-2.5">
          未能自动解析为结构化数据。请尝试使用更清晰的截图，或手动录入。
        </p>
      </CardContent>
    </Card>
  );
}

/* ---------- Main Component ---------- */

export function RecognitionResult({
  data,
  rawText,
  onCancel,
  onDone,
}: RecognitionResultProps) {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const handleImportSchedule = async (selectedIndices: number[]) => {
    setIsImporting(true);
    try {
      const scheduleData = data as RecognitionData;
      const promises = selectedIndices.map((i) => {
        const course = scheduleData.courses[i];
        return fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: course.name,
            teacher: course.teacher,
            location: course.location,
            dayOfWeek: course.dayOfWeek,
            startTime: course.startTime,
            endTime: course.endTime,
            startWeek: course.startWeek,
            endWeek: course.endWeek,
            credit: course.credit,
            category: '必修',
            color: generateColor(i),
            semester: '2024-2025-2',
          }),
        });
      });

      const results = await Promise.allSettled(promises);
      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(`成功导入 ${successCount} 门课程`);
      onDone();
    } catch {
      toast.error('导入失败，请重试');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportGrades = async (selectedIndices: number[]) => {
    setIsImporting(true);
    try {
      const gradesData = data as GradesRecognitionData;
      const semester = gradesData.semester || '2024-2025-2';

      // For each grade, we need to first ensure a course exists
      const promises = selectedIndices.map(async (i) => {
        const grade = gradesData.grades[i];

        // Create a placeholder course for this grade
        const courseRes = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: grade.courseName,
            teacher: null,
            location: null,
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '09:40',
            startWeek: 1,
            endWeek: 16,
            credit: grade.credit,
            category: '必修',
            color: generateColor(i),
            semester: semester,
          }),
        });

        const course = await courseRes.json();
        if (!course.id) return;

        // Create the grade
        return fetch('/api/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.id,
            semester: semester,
            score: grade.score,
            gradePoint: grade.gradePoint,
            credit: grade.credit,
          }),
        });
      });

      const results = await Promise.allSettled(promises);
      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success(`成功导入 ${successCount} 条成绩记录`);
      onDone();
    } catch {
      toast.error('导入失败，请重试');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Result header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="size-4 text-emerald-500" />
          <span className="text-sm font-medium text-foreground">识别完成</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5 text-muted-foreground">
          <X className="size-3.5" />
          返回重新识别
        </Button>
      </div>

      {/* Result content */}
      {rawText ? (
        <RawResult text={rawText} />
      ) : data.type === 'schedule' ? (
        <ScheduleResult
          data={data as RecognitionData}
          onImport={handleImportSchedule}
          isImporting={isImporting}
        />
      ) : (
        <GradesResult
          data={data as GradesRecognitionData}
          onImport={handleImportGrades}
          isImporting={isImporting}
        />
      )}
    </motion.div>
  );
}
