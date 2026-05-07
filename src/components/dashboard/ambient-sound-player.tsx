'use client';

import React, { useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/helpers';
import { useHydrated } from '@/hooks/use-hydrated';
import {
  type SoundType,
  type ActiveSound,
  SOUND_OPTIONS,
  startSound,
  stopSound,
  setSoundVolume,
} from '@/lib/ambient-sounds';

const STORAGE_KEY = 'edutrack-ambient-sound';

interface AmbientSoundState {
  activeSound: SoundType | null;
  volume: number;
}

// ─── useSyncExternalStore helpers for reading persisted volume ───

let volumeVersion = 0;
const volumeListeners = new Set<() => void>();

function subscribeVolume(callback: () => void) {
  volumeListeners.add(callback);
  return () => { volumeListeners.delete(callback); };
}

function getVolumeSnapshot(): number {
  // Touch version so the store knows to re-read
  void volumeVersion;
  if (typeof window === 'undefined') return 50;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AmbientSoundState;
      return parsed.volume ?? 50;
    }
  } catch { /* ignore */ }
  return 50;
}

function setVolumeAndNotify(vol: number) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: AmbientSoundState = raw
      ? (JSON.parse(raw) as AmbientSoundState)
      : { activeSound: null, volume: 50 };
    existing.volume = vol;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
  volumeVersion++;
  volumeListeners.forEach((l) => l());
}

function saveActiveSoundToStorage(soundType: SoundType | null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: AmbientSoundState = raw
      ? (JSON.parse(raw) as AmbientSoundState)
      : { activeSound: null, volume: 50 };
    existing.activeSound = soundType;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

// ─── Animated sound wave bars ───

function SoundWave({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span className="flex items-end gap-[2px] h-3 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-[2px] rounded-full bg-emerald-500"
          animate={{
            height: ['4px', '10px', '6px', '12px', '4px'],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

// ─── Main Component ───

export function AmbientSoundPlayer() {
  const hydrated = useHydrated();
  const activeSoundRef = useRef<ActiveSound | null>(null);
  const [activeSound, setActiveSound] = React.useState<SoundType | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  // Volume from localStorage via useSyncExternalStore (no setState-in-effect)
  const volume = useSyncExternalStore(subscribeVolume, getVolumeSnapshot, () => 50);

  const handleVolumeChange = useCallback((val: number[]) => {
    const newVol = val[0];
    setVolumeAndNotify(newVol);
    if (activeSoundRef.current) {
      setSoundVolume(activeSoundRef.current, newVol / 100);
    }
  }, []);

  const toggleSound = useCallback((soundId: SoundType) => {
    if (activeSoundRef.current) {
      stopSound(activeSoundRef.current);
      activeSoundRef.current = null;
    }

    if (activeSound === soundId) {
      // Stop playing
      setActiveSound(null);
      saveActiveSoundToStorage(null);
      return;
    }

    // Start new sound
    const vol = volume / 100;
    const sound = startSound(soundId, vol);
    activeSoundRef.current = sound;
    setActiveSound(soundId);
    saveActiveSoundToStorage(soundId);
  }, [activeSound, volume]);

  const stopAll = useCallback(() => {
    if (activeSoundRef.current) {
      stopSound(activeSoundRef.current);
      activeSoundRef.current = null;
    }
    setActiveSound(null);
    saveActiveSoundToStorage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeSoundRef.current) {
        stopSound(activeSoundRef.current);
        activeSoundRef.current = null;
      }
    };
  }, []);

  if (!hydrated) {
    // Render a placeholder to avoid hydration mismatch
    return (
      <div className="mt-3 flex items-center justify-center">
        <div className="size-8" />
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-center gap-1 size-8 rounded-md transition-colors cursor-pointer',
              'hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeSound ? 'text-emerald-500' : 'text-muted-foreground',
            )}
            aria-label={activeSound ? '环境音效播放中' : '打开环境音效'}
          >
            <AnimatePresence mode="wait">
              {activeSound ? (
                <motion.div
                  key="playing"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <Volume2 className="size-4" />
                  <SoundWave active />
                </motion.div>
              ) : (
                <motion.div
                  key="muted"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Volume2 className="size-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="center"
          className="w-56 p-3"
        >
          {/* Sound grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {SOUND_OPTIONS.map((sound) => (
              <button
                key={sound.id}
                onClick={() => toggleSound(sound.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all cursor-pointer',
                  'hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeSound === sound.id
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 ring-1 ring-emerald-300 dark:ring-emerald-700'
                    : 'bg-secondary/40',
                )}
              >
                <span className="text-base leading-none">{sound.emoji}</span>
                <span className={cn(
                  'text-[10px] font-medium leading-tight',
                  activeSound === sound.id
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}>
                  {sound.label}
                </span>
                {activeSound === sound.id && (
                  <motion.div
                    layoutId="sound-indicator"
                    className="size-1 rounded-full bg-emerald-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <Volume2 className="size-3 text-muted-foreground shrink-0" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground w-7 text-right">
              {volume}%
            </span>
          </div>

          {/* Stop button */}
          {activeSound && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={stopAll}
                className="w-full h-7 text-xs text-muted-foreground hover:text-red-500 gap-1.5"
              >
                <VolumeX className="size-3" />
                停止播放
              </Button>
            </motion.div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
