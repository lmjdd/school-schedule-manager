'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from 'recharts';
import type { Grade } from '@/lib/types';

async function fetchGrades(): Promise<Grade[]> {
  const res = await fetch('/api/grades');
  if (!res.ok) throw new Error('Failed to fetch grades');
  return res.json();
}

const chartConfig = {
  count: { label: '课程数', color: 'var(--chart-1)' },
};

const GRADE_RANGES = [
  { key: 'excellent', label: '优秀', range: '90-100', min: 90, max: 100 },
  { key: 'good', label: '良好', range: '80-89', min: 80, max: 89 },
  { key: 'average', label: '中等', range: '70-79', min: 70, max: 79 },
  { key: 'pass', label: '及格', range: '60-69', min: 60, max: 69 },
  { key: 'fail', label: '不及格', range: '<60', min: 0, max: 59 },
];

/** Color gradient from green (high) to red (low) */
const GRADE_COLORS = [
  '#10b981', // excellent - emerald-500
  '#34d399', // good - emerald-400
  '#fbbf24', // average - amber-400
  '#fb923c', // pass - orange-400
  '#ef4444', // fail - red-500
];

/** Custom label renderer for percentage on top of bars */
function PercentageLabel(props: any) {
  const { x, y, width, value, total } = props;
  if (!value || value === 0 || !total) return null;
  const pct = ((Number(value) / Number(total)) * 100).toFixed(0);
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fill="currentColor"
      className="fill-muted-foreground text-[10px] font-mono tabular-nums font-medium"
    >
      {pct}%
    </text>
  );
}

interface GradeDistributionProps {
  semester?: string | null;
}

export function GradeDistribution({ semester }: GradeDistributionProps) {
  const { data: allGrades = [], isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
  });

  const grades = useMemo(() => {
    if (!semester) return allGrades;
    return allGrades.filter((g) => g.semester === semester);
  }, [allGrades, semester]);

  const distributionData = useMemo(() => {
    return GRADE_RANGES.map((range, index) => {
      const count = grades.filter((g) => {
        if (g.score === null || g.score === undefined) return false;
        return g.score >= range.min && g.score <= range.max;
      }).length;
      return {
        ...range,
        count,
        fill: GRADE_COLORS[index],
      };
    });
  }, [grades]);

  const totalCount = useMemo(
    () => distributionData.reduce((sum, d) => sum + d.count, 0),
    [distributionData],
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      >
        <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
    >
      <Card className="rounded-lg border-border/60 notion-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>📊</span>
              <span>成绩分布</span>
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {totalCount === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <div className="flex items-center justify-center mb-3">
                <div className="size-14 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/40 dark:to-indigo-950/40 flex items-center justify-center animate-float">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
              <p>暂无成绩数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <BarChart
                  data={distributionData}
                  margin={{ top: 20, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    {GRADE_COLORS.map((color, i) => (
                      <linearGradient key={i} id={`barGradient${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.65} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--accent) / 0.15)' }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item) => {
                          const pct = totalCount > 0 ? ((Number(value) / totalCount) * 100).toFixed(1) : 0;
                          return (
                            <div className="space-y-1 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-2.5 rounded-sm"
                                  style={{ backgroundColor: item.payload.fill }}
                                />
                                <span className="text-xs font-medium text-foreground">{item.payload.label}</span>
                                <span className="text-[10px] text-muted-foreground">{item.payload.range}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-muted-foreground">课程数</span>
                                <span className="text-xs font-mono font-bold">{value} 门</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs text-muted-foreground">占比</span>
                                <span className="text-xs font-mono font-medium">{pct}%</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {distributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#barGradient${index})`}
                        className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      content={<PercentageLabel total={totalCount} />}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>

              {/* Summary pills */}
              <div className="flex flex-wrap gap-2">
                {distributionData.filter((d) => d.count > 0).map((d) => {
                  const pct = totalCount > 0 ? ((d.count / totalCount) * 100).toFixed(0) : 0;
                  return (
                    <motion.div
                      key={d.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2.5 py-1 hover:bg-secondary/80 transition-colors cursor-default"
                    >
                      <div
                        className="size-2 rounded-full"
                        style={{ backgroundColor: d.fill }}
                      />
                      <span className="text-xs text-muted-foreground">{d.label}</span>
                      <span className="text-xs font-mono font-medium tabular-nums">
                        {d.count}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        ({pct}%)
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
