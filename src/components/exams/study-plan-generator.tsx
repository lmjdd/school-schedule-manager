'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, CheckCircle2, Clock, Lightbulb, PenTool,
  FileQuestion, Trophy, CalendarDays, Brain, Coffee,
} from 'lucide-react';
import { cn } from '@/lib/helpers';
import { formatDate } from '@/lib/helpers';
import type { Exam } from '@/lib/types';

interface StudyPlanGeneratorProps {
  exam: Exam;
  daysRemaining: number;
}

interface StudyDay {
  day: number;
  label: string;
  description: string;
  icon: React.ElementType;
  hours: number;
  color: string;
}

function generateStudyPlan(daysRemaining: number, exam: Exam): {
  dailyHours: number;
  totalHours: number;
  studyDays: StudyDay[];
} {
  // Calculate suggested daily study hours based on days remaining
  let dailyHours: number;
  if (daysRemaining <= 1) {
    dailyHours = 8;
  } else if (daysRemaining <= 3) {
    dailyHours = 6;
  } else if (daysRemaining <= 7) {
    dailyHours = 4;
  } else if (daysRemaining <= 14) {
    dailyHours = 3;
  } else {
    dailyHours = 2;
  }

  const totalHours = dailyHours * daysRemaining;

  // Generate study timeline
  const studyDays: StudyDay[] = [];

  if (daysRemaining <= 1) {
    // Emergency: 1 day plan
    studyDays.push(
      { day: 0, label: '今天', description: '全速复习：通读教材重点 + 刷题', icon: Zap, hours: 8, color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
    );
  } else if (daysRemaining <= 3) {
    // Urgent: compact plan
    studyDays.push(
      { day: daysRemaining - 1, label: '通读教材', description: '快速浏览教材，标记重点章节', icon: BookOpen, hours: dailyHours, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
      { day: daysRemaining - 2, label: '重点笔记', description: '整理核心知识点和公式', icon: PenTool, hours: dailyHours, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
      { day: daysRemaining - 3, label: '刷题练习', description: '完成课后习题和历年真题', icon: FileQuestion, hours: dailyHours, color: 'text-violet-500 bg-violet-950/30' },
      { day: 0, label: '模拟测试', description: '考前模拟 + 查漏补缺', icon: Trophy, hours: Math.min(dailyHours, 4), color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
    );
  } else if (daysRemaining <= 7) {
    // Standard: 7 day plan
    studyDays.push(
      { day: daysRemaining - 1, label: '通读教材', description: '全面阅读教材，理解知识框架', icon: BookOpen, hours: dailyHours, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
      { day: Math.max(daysRemaining - 3, 3), label: '整理笔记', description: '归纳重点、整理思维导图', icon: PenTool, hours: dailyHours, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
      { day: Math.max(daysRemaining - 4, 2), label: '重点突破', description: '攻克难点和薄弱环节', icon: Brain, hours: dailyHours, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
      { day: Math.max(daysRemaining - 5, 2), label: '刷题练习', description: '完成习题集和模拟题', icon: FileQuestion, hours: dailyHours, color: 'text-violet-500 bg-violet-950/30' },
      { day: 0, label: '模拟测试', description: '全真模拟 + 回顾错题', icon: Trophy, hours: Math.min(dailyHours, 4), color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
    );
  } else {
    // Extended: 14 day plan
    studyDays.push(
      { day: daysRemaining - 1, label: '通读教材', description: '系统阅读，建立知识框架', icon: BookOpen, hours: dailyHours, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
      { day: Math.max(daysRemaining - 4, 6), label: '重点笔记', description: '整理笔记和核心概念', icon: PenTool, hours: dailyHours, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
      { day: Math.max(daysRemaining - 7, 4), label: '重点突破', description: '针对薄弱环节专项训练', icon: Brain, hours: dailyHours, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
      { day: Math.max(daysRemaining - 9, 3), label: '刷题练习', description: '系统刷题 + 整理错题本', icon: FileQuestion, hours: dailyHours, color: 'text-violet-500 bg-violet-950/30' },
      { day: 2, label: '巩固复习', description: '回顾错题 + 强化记忆', icon: Coffee, hours: dailyHours, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' },
      { day: 0, label: '模拟测试', description: '考前冲刺 + 调整心态', icon: Trophy, hours: Math.min(dailyHours, 4), color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
    );
  }

  return { dailyHours, totalHours, studyDays };
}

function getDayLabel(daysBeforeExam: number, totalDays: number): string {
  if (daysBeforeExam === 0) return '考前当天';
  if (daysBeforeExam === 1) return '考前1天';
  if (daysBeforeExam === totalDays) return '今天';
  return `${daysBeforeExam}天后开始`;
}

export function StudyPlanGenerator({ exam, daysRemaining }: StudyPlanGeneratorProps) {
  const { dailyHours, totalHours, studyDays } = generateStudyPlan(daysRemaining, exam);

  const courseName = exam.course?.name || exam.title;

  return (
    <div className="space-y-4">
      {/* Plan Header */}
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
          <Lightbulb className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-foreground">
            {courseName} · 备考计划
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              建议每日 <span className="font-mono tabular-nums font-semibold text-foreground">{dailyHours}h</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              共计 <span className="font-mono tabular-nums font-semibold text-foreground">{totalHours}h</span>
            </span>
          </div>
        </div>
      </div>

      {/* Study Timeline */}
      <div className="space-y-2">
        {studyDays.map((step, index) => {
          const Icon = step.icon;
          const examDate = new Date(exam.date);
          const startFrom = new Date(examDate.getTime() - step.day * 24 * 60 * 60 * 1000);
          const dayLabel = getDayLabel(step.day, daysRemaining);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border border-border/30',
                'bg-card/60 hover:bg-card/80 transition-colors',
              )}
            >
              {/* Step number + Icon */}
              <div className={cn(
                'flex items-center justify-center size-8 rounded-lg shrink-0',
                step.color,
              )}>
                <Icon className="size-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {step.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="size-2.5" />
                      {dayLabel}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                      {step.hours}h
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <CheckCircle2 className="size-3.5 text-primary/70" />
          <span className="text-[10px] font-semibold text-primary/80">复习策略提示</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {daysRemaining <= 3
            ? '时间紧迫！建议优先复习高频考点和老师强调的重点内容，配合历年真题快速掌握出题规律。'
            : '建议采用"艾宾浩斯遗忘曲线"复习法：第一天通读教材建立框架 → 第二天整理重点笔记 → 第三天开始刷题巩固 → 考前一天全真模拟测试。每天结束时花10分钟回顾当天所学。'
          }
        </p>
      </div>
    </div>
  );
}
