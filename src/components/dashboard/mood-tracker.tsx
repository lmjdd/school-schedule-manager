'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/helpers';

// ── Types ────────────────────────────────────────────────────────────────────

interface MoodEntry {
  date: string;
  mood: string;
  note?: string;
}

interface MoodOption {
  key: string;
  emoji: string;
  label: string;
  color: string;
  bg: string;
  activeBg: string;
  messages: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'edutrack-mood-history';

const MOOD_OPTIONS: MoodOption[] = [
  {
    key: 'productive',
    emoji: '🔥',
    label: '高效学习',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    activeBg: 'bg-red-100 dark:bg-red-950/60 ring-red-300 dark:ring-red-800',
    messages: [
      '太棒了！继续保持这个状态！',
      '效率拉满！你就是学霸本霸 📚',
      '这个状态太赞了，冲就完事了！',
    ],
  },
  {
    key: 'good',
    emoji: '😊',
    label: '状态不错',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    activeBg: 'bg-amber-100 dark:bg-amber-950/60 ring-amber-300 dark:ring-amber-800',
    messages: [
      '状态不错，稳步前进！',
      '保持节奏，每天进步一点点 💪',
      '很好的学习状态，继续加油！',
    ],
  },
  {
    key: 'okay',
    emoji: '😐',
    label: '一般般',
    color: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    activeBg: 'bg-slate-100 dark:bg-slate-900/60 ring-slate-300 dark:ring-slate-700',
    messages: [
      '一般般也没关系，慢慢来～',
      '调整一下，换个科目试试？',
      '每个人都有低潮期，不着急 🌱',
    ],
  },
  {
    key: 'tired',
    emoji: '😫',
    label: '有点疲惫',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    activeBg: 'bg-orange-100 dark:bg-orange-950/60 ring-orange-300 dark:ring-orange-800',
    messages: [
      '辛苦了！休息一下再出发吧 ☕',
      '累了就歇歇，效率比时长更重要',
      '身体是革命的本钱，照顾好自己 ❤️',
    ],
  },
  {
    key: 'rest',
    emoji: '😴',
    label: '需要休息',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    activeBg: 'bg-purple-100 dark:bg-purple-950/60 ring-purple-300 dark:ring-purple-800',
    messages: [
      '今天已经够努力了，好好休息！',
      '休息是为了走更远的路 🌙',
      '放松一下，明天又是新的一天！',
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(): string {
  const now = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];
  return `${month}月${day}日 周${weekday}`;
}

function loadMoodHistory(): MoodEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MoodEntry[];
  } catch {
    return [];
  }
}

function saveMoodHistory(history: MoodEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
}

function getMoodOption(key: string): MoodOption | undefined {
  return MOOD_OPTIONS.find((o) => o.key === key);
}

function getLast7DaysDates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return dates;
}

// ── Component ────────────────────────────────────────────────────────────────

export function MoodTracker() {
  const didMount = useRef(false);

  // Default state (SSR-safe)
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [motivationalMsg, setMotivationalMsg] = useState('今天学习状态如何？');

  // Restore from localStorage after mount
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      // Use rAF to avoid setState-in-effect lint
      requestAnimationFrame(() => {
        const history = loadMoodHistory();
        const todayStr = getTodayDateStr();
        const todayEntry = history.find((e) => e.date === todayStr);

        setMoodHistory(history);
        if (todayEntry) {
          setSelectedMood(todayEntry.mood);
          setNote(todayEntry.note ?? '');
          const option = getMoodOption(todayEntry.mood);
          if (option) {
            setMotivationalMsg(option.messages[Math.floor(Math.random() * option.messages.length)]);
          }
        }
      });
    }
  }, []);

  const handleSelectMood = useCallback(
    (key: string) => {
      const option = getMoodOption(key);
      if (!option) return;

      setSelectedMood(key);

      // Update motivational message
      setMotivationalMsg(option.messages[Math.floor(Math.random() * option.messages.length)]);

      // Save to localStorage
      const todayStr = getTodayDateStr();
      const entry: MoodEntry = { date: todayStr, mood: key, note: note || undefined };

      setMoodHistory((prev) => {
        // Remove existing today entry if any
        const filtered = prev.filter((e) => e.date !== todayStr);
        const updated = [...filtered, entry];
        saveMoodHistory(updated);
        return updated;
      });
    },
    [note]
  );

  const handleNoteChange = useCallback(
    (value: string) => {
      if (value.length > 100) return;
      setNote(value);

      // Auto-save note if mood is selected
      if (selectedMood) {
        const todayStr = getTodayDateStr();
        setMoodHistory((prev) => {
          const filtered = prev.filter((e) => e.date !== todayStr);
          const entry: MoodEntry = { date: todayStr, mood: selectedMood, note: value || undefined };
          const updated = [...filtered, entry];
          saveMoodHistory(updated);
          return updated;
        });
      }
    },
    [selectedMood]
  );

  // Compute last 7 days history strip (client-only)
  const historyStrip = React.useMemo(() => {
    if (moodHistory.length === 0) return [];
    const last7 = getLast7DaysDates();
    return last7.map((date) => {
      const entry = moodHistory.find((e) => e.date === date);
      if (entry) {
        const option = getMoodOption(entry.mood);
        return { date, emoji: option?.emoji ?? '❓', hasEntry: true };
      }
      return { date, emoji: '·', hasEntry: false };
    });
  }, [moodHistory]);

  // Calculate streak (consecutive days with mood)
  const streak = React.useMemo(() => {
    if (moodHistory.length === 0) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (moodHistory.some((e) => e.date === dateStr)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [moodHistory]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <span>学习心情</span>
        </h3>
        <span className="text-xs text-muted-foreground">{formatDisplayDate()}</span>
      </div>

      {/* Motivational Message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={motivationalMsg}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className="text-xs text-muted-foreground mb-4 h-4 flex items-center"
        >
          {motivationalMsg}
        </motion.p>
      </AnimatePresence>

      {/* Mood Selection Buttons */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = selectedMood === option.key;
          return (
            <motion.button
              key={option.key}
              onClick={() => handleSelectMood(option.key)}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border transition-all duration-200 cursor-pointer',
                isSelected
                  ? cn('border-transparent ring-2', option.activeBg)
                  : 'border-transparent bg-secondary/30 hover:bg-secondary/60'
              )}
            >
              <motion.span
                className="text-xl leading-none"
                animate={isSelected ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {option.emoji}
              </motion.span>
              <span
                className={cn(
                  'text-[10px] leading-tight text-center font-medium',
                  isSelected ? option.color : 'text-muted-foreground'
                )}
              >
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Quick Note */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          快速笔记
          <span className="text-muted-foreground/50 ml-1">（选填）</span>
        </label>
        <div className="relative">
          <textarea
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="今天有什么想记录的..."
            maxLength={100}
            rows={2}
            className={cn(
              'w-full text-xs bg-secondary/30 border border-border/50 rounded-md px-3 py-2',
              'placeholder:text-muted-foreground/40 text-foreground resize-none',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
              'transition-all duration-200'
            )}
          />
          <span
            className={cn(
              'absolute bottom-1.5 right-2 text-[10px] tabular-nums',
              note.length >= 90 ? 'text-amber-500' : 'text-muted-foreground/40'
            )}
          >
            {note.length}/100
          </span>
        </div>
      </div>

      {/* Streak indicator */}
      {streak > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20 w-fit"
        >
          <span className="text-xs">🔥</span>
          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
            已连续记录 {streak} 天
          </span>
        </motion.div>
      )}

      {/* Last 7 Days History Strip */}
      <div className="pt-3 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground/60 mb-2">近 7 天</p>
        <div className="flex items-center justify-between">
          {historyStrip.map((day, i) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <motion.span
                className={cn(
                  'text-base leading-none',
                  day.hasEntry ? '' : 'text-muted-foreground/20'
                )}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                {day.hasEntry ? day.emoji : '·'}
              </motion.span>
              <span
                className={cn(
                  'text-[9px] tabular-nums',
                  i === 6
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground/40'
                )}
              >
                {(() => {
                  const d = new Date(day.date + 'T00:00:00');
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                })()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
