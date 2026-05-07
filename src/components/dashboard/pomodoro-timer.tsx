'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { AmbientSoundPlayer } from '@/components/dashboard/ambient-sound-player';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/helpers';

type TimerMode = 'focus' | 'break';
type TimerRunningState = 'running' | 'paused' | 'stopped';

interface PomodoroPersistState {
  mode: TimerMode;
  runningState: TimerRunningState;
  timeLeft: number;
  focusMinutes: number;
  sessions: number;
  totalFocusSeconds: number;
  date: string;
  lastTick: number; // timestamp (ms) when last saved
}

const DURATION_OPTIONS = [15, 20, 25, 30, 45, 60];
const DEFAULT_FOCUS_MINUTES = 25;
const BREAK_DURATION = 5 * 60; // 5 minutes

const PERSIST_KEY = 'edutrack-pomodoro-state';
const SESSIONS_KEY = 'edutrack-pomodoro-sessions';
const FOCUS_TIME_KEY = 'edutrack-pomodoro-focus-time';

const TOAST_MESSAGES = [
  '🎉 太棒了！又一个番茄完成！',
  '🔥 你正在高效学习！继续保持！',
  '💪 专注力满分！休息一下吧～',
  '✨ 超越自己，你是最棒的！',
  '📚 知识就是力量，你又强大了一点！',
  '🎯 专注力惊人！下一轮继续冲！',
  '🚀 效率爆表！劳逸结合更持久！',
  '🌟 优秀！休息几分钟再战！',
];

const MOTIVATIONAL_MESSAGES: Record<number, string[]> = {
  0: ['准备开始专注吧！', '今天也要加油哦 🌱'],
  1: ['保持专注！', '好的开始是成功的一半 ✨'],
  2: ['节奏很好！', '连续专注中 💪'],
  3: ['太棒了！', '即将完成一组 🎯'],
  4: ['一组完成！休息一下吧~', '☕ 来杯水放松一下'],
  5: ['满血复活！', '继续挑战！🚀'],
  6: ['专注达人！', '已经超过大多数人了 🏆'],
  7: ['保持这个节奏！', '知识在不断积累 📚'],
  8: ['势不可挡！', '今天的效率爆表 🔥'],
};

function getMotivationalMessage(sessions: number): string {
  const key = Math.min(sessions, 8);
  const messages = MOTIVATIONAL_MESSAGES[key] || MOTIVATIONAL_MESSAGES[8];
  return messages[Math.floor(Math.random() * messages.length)];
}

function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatFocusTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Load persisted timer state from localStorage */
function loadPersistedState(): PomodoroPersistState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PomodoroPersistState;
    // Only restore if same day
    if (parsed.date !== getTodayDateStr()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Save timer state to localStorage */
function savePersistedState(state: PomodoroPersistState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

/** Clear persisted state */
function clearPersistedState() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PERSIST_KEY);
  } catch {
    // ignore
  }
}

/** Load sessions count from localStorage (legacy compat) */
function loadSessions(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { count: number; date: string };
    if (parsed.date !== getTodayDateStr()) return 0;
    return parsed.count;
  } catch {
    return 0;
  }
}

/** Load total focus seconds for today */
function loadFocusTime(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(FOCUS_TIME_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { seconds: number; date: string };
    if (parsed.date !== getTodayDateStr()) return 0;
    return parsed.seconds;
  } catch {
    return 0;
  }
}

/** Save total focus seconds */
function saveFocusTime(seconds: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FOCUS_TIME_KEY, JSON.stringify({ seconds, date: getTodayDateStr() }));
  } catch {
    // ignore
  }
}

export function PomodoroTimer() {
  // Hydration guard: use ref to track mount
  const didMount = useRef(false);

  // Initialize with safe defaults (matching SSR output)
  const [mode, setMode] = useState<TimerMode>('focus');
  const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);
  const [motivationalMsg, setMotivationalMsg] = useState('准备开始专注吧！');

  // Restore from localStorage after mount — use a timeout to avoid lint setState-in-effect
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      const persisted = loadPersistedState();
      if (persisted) {
        setMode(persisted.mode);
        setFocusMinutes(persisted.focusMinutes);
        if (persisted.runningState === 'running') {
          const elapsedMs = Date.now() - persisted.lastTick;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          const newTimeLeft = Math.max(0, persisted.timeLeft - elapsedSeconds);
          setTimeLeft(newTimeLeft);
          setIsRunning(newTimeLeft > 0);
        } else {
          setTimeLeft(persisted.timeLeft);
        }
        setSessions(persisted.sessions);
        setTotalFocusSeconds(persisted.totalFocusSeconds);
        setMotivationalMsg(getMotivationalMessage(persisted.sessions));
      } else {
        const legacySessions = loadSessions();
        if (legacySessions > 0) {
          setSessions(legacySessions);
          setTotalFocusSeconds(legacySessions * DEFAULT_FOCUS_MINUTES * 60);
          setMotivationalMsg(getMotivationalMessage(legacySessions));
        }
      }
    }
  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionTriggered = useRef(false);
  const stateRef = useRef({ mode, timeLeft, isRunning, sessions, focusMinutes, totalFocusSeconds });

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = { mode, timeLeft, isRunning, sessions, focusMinutes, totalFocusSeconds };
  });

  const focusDuration = focusMinutes * 60;
  const totalTime = mode === 'focus' ? focusDuration : BREAK_DURATION;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // Persist state to localStorage whenever relevant state changes
  useEffect(() => {
    const runningState: TimerRunningState = isRunning ? 'running' : (timeLeft === totalTime ? 'stopped' : 'paused');
    savePersistedState({
      mode,
      runningState,
      timeLeft,
      focusMinutes,
      sessions,
      totalFocusSeconds,
      date: getTodayDateStr(),
      lastTick: Date.now(),
    });
  }, [mode, isRunning, timeLeft, focusMinutes, sessions, totalFocusSeconds, totalTime]);

  // Save focus time separately for easy access
  useEffect(() => {
    saveFocusTime(totalFocusSeconds);
  }, [totalFocusSeconds]);

  const reset = useCallback(() => {
    setIsRunning(false);
    completionTriggered.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeft(mode === 'focus' ? focusDuration : BREAK_DURATION);
  }, [mode, focusDuration]);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setIsRunning(false);
    completionTriggered.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeft(newMode === 'focus' ? focusDuration : BREAK_DURATION);
  }, [mode, focusDuration]);

  const cycleDuration = useCallback(() => {
    const currentIndex = DURATION_OPTIONS.indexOf(focusMinutes);
    const nextIndex = (currentIndex + 1) % DURATION_OPTIONS.length;
    const nextMinutes = DURATION_OPTIONS[nextIndex];
    setFocusMinutes(nextMinutes);
    if (!isRunning && mode === 'focus') {
      setTimeLeft(nextMinutes * 60);
    }
  }, [focusMinutes, isRunning, mode]);

  // Update motivational message when sessions change
  useEffect(() => {
    setMotivationalMsg(getMotivationalMessage(sessions));
  }, [sessions]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            const { mode: currentMode, sessions: currentSessions, focusMinutes: fm } = stateRef.current;
            if (currentMode === 'focus' && !completionTriggered.current) {
              completionTriggered.current = true;
              setSessions((s) => {
                const newCount = s + 1;
                return newCount;
              });
              // Add focus time
              setTotalFocusSeconds((prevSeconds) => prevSeconds + fm * 60);
              // Show motivating toast
              const msg = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)];
              toast.success(msg, {
                description: `今日已专注 ${currentSessions + 1} 个番茄 🍅`,
                duration: 4000,
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Calculate circle dash offset for SVG ring
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Session dot groups (4 per group)
  const totalGroups = Math.ceil(sessions / 4) || 1;
  const currentGroupSessions = sessions % 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.32, ease: 'easeOut' }}
      className="rounded-lg bg-card border border-border/60 p-5 md:p-6 notion-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>🍅</span>
          <span>专注计时</span>
        </h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: i < currentGroupSessions ? [1, 1.3, 1] : 1,
                backgroundColor: i < currentGroupSessions
                  ? (mode === 'focus' ? '#f87171' : '#34d399')
                  : 'var(--border)',
              }}
              transition={{ duration: 0.3 }}
              className="size-2 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={motivationalMsg}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.25 }}
          className="text-xs text-muted-foreground mb-3 h-4 flex items-center"
        >
          {motivationalMsg}
        </motion.p>
      </AnimatePresence>

      {/* Timer Ring */}
      <div className="flex flex-col items-center py-2">
        <motion.div
          className="relative size-32 md:size-36"
          animate={isRunning ? {
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0)',
              '0 0 0 8px rgba(239, 68, 68, 0.08)',
              '0 0 0 0 rgba(239, 68, 68, 0)',
            ],
          } : {}}
          transition={isRunning ? {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        >
          {/* SVG Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-secondary/60"
            />
            {/* Progress ring */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className={cn(
                mode === 'focus'
                  ? 'text-red-400 dark:text-red-500'
                  : 'text-emerald-400 dark:text-emerald-500'
              )}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              initial={false}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl md:text-4xl font-bold font-mono tabular-nums text-foreground tracking-tight"
              animate={isRunning ? { opacity: [1, 0.85, 1] } : { opacity: 1 }}
              transition={isRunning ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {formatTime(timeLeft)}
            </motion.span>
            <span className={cn(
              'text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full',
              mode === 'focus'
                ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            )}>
              {mode === 'focus' ? '专注中' : '休息中'}
            </span>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={reset}
            disabled={!isRunning && timeLeft === totalTime}
          >
            <RotateCcw className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              'gap-1.5 min-w-[80px]',
              mode === 'focus'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white',
            )}
          >
            {isRunning ? (
              <>
                <Pause className="size-3.5" />
                <span className="text-xs">暂停</span>
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                <span className="text-xs">{timeLeft === totalTime ? '开始' : '继续'}</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={toggleMode}
          >
            {mode === 'focus' ? (
              <Coffee className="size-3.5 text-emerald-500" />
            ) : (
              <Brain className="size-3.5 text-red-500" />
            )}
          </Button>
        </div>
      </div>

      {/* Ambient Sound Player */}
      <AmbientSoundPlayer />

      {/* Session history dots */}
      {sessions > 4 && (
        <div className="flex items-center justify-center gap-1 mt-2 mb-1">
          {Array.from({ length: totalGroups }).map((_, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-0.5">
              {Array.from({ length: 4 }).map((_, dotIdx) => {
                const dotNumber = groupIdx * 4 + dotIdx + 1;
                const isFilled = dotNumber <= sessions;
                return (
                  <div
                    key={dotIdx}
                    className={cn(
                      'size-1.5 rounded-full transition-colors duration-300',
                      isFilled
                        ? 'bg-red-400 dark:bg-red-500'
                        : 'bg-border'
                    )}
                  />
                );
              })}
              {groupIdx < totalGroups - 1 && (
                <div className="w-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">
            今日完成 <span className="font-mono tabular-nums font-medium text-foreground">{sessions}</span> 个番茄
          </span>
          {totalFocusSeconds > 0 && (
            <span className="text-[10px] text-muted-foreground/70">
              累计专注 <span className="font-mono tabular-nums">{formatFocusTime(totalFocusSeconds)}</span>
            </span>
          )}
        </div>
        <button
          onClick={cycleDuration}
          disabled={isRunning}
          className={cn(
            'text-[11px] font-mono tabular-nums px-2 py-1 rounded-md transition-colors',
            isRunning
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer'
          )}
          title="点击切换时长"
        >
          {mode === 'focus' ? `${focusMinutes} 分钟` : '5 分钟'}
          {mode === 'focus' && !isRunning && (
            <span className="ml-0.5 text-[9px] opacity-50">↻</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
