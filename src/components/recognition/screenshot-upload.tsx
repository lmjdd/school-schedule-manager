'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  ImagePlus,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  FileBarChart,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/helpers';

export type RecognitionType = 'auto' | 'schedule' | 'grades';

interface ScreenshotUploadProps {
  onRecognize: (imageDataUrl: string, type: RecognitionType) => void;
  isRecognizing: boolean;
}

const TYPE_OPTIONS: { value: RecognitionType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'auto', label: '自动检测', icon: Wand2, desc: '自动判断课表或成绩单' },
  { value: 'schedule', label: '课表识别', icon: CalendarDays, desc: '识别课程时间表' },
  { value: 'grades', label: '成绩单识别', icon: FileBarChart, desc: '识别成绩信息' },
];

export function ScreenshotUpload({ onRecognize, isRecognizing }: ScreenshotUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recognitionType, setRecognitionType] = useState<RecognitionType>('auto');
  const [progress, setProgress] = useState(0);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isRecognizing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) processFile(file);
          return;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isRecognizing, processFile]);

  // Simulate progress during recognition
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRecognizing) return;

    const timeout = setTimeout(() => {
      setProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 300);
    }, 0);

    return () => {
      clearTimeout(timeout);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isRecognizing]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  const handleClearImage = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setProgress(0);
  }, []);

  const handleStartRecognize = useCallback(() => {
    if (!imagePreview) return;
    onRecognize(imagePreview, recognitionType);
  }, [imagePreview, recognitionType, onRecognize]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setRecognitionType(opt.value)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm transition-all cursor-pointer',
                recognitionType === opt.value
                  ? 'border-primary bg-primary/5 text-primary font-medium shadow-sm'
                  : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              <span>{opt.label}</span>
              <span className="hidden sm:inline text-xs opacity-60">· {opt.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Drop Zone */}
      <AnimatePresence mode="wait">
        {!imagePreview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border/80 hover:border-primary/50 hover:bg-muted/30'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
              <motion.div
                animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'size-16 rounded-2xl flex items-center justify-center',
                  isDragging
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                <ImagePlus className="size-7" />
              </motion.div>

              <div className="text-center space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? '松开以上传截图' : '上传教务系统截图'}
                </p>
                <p className="text-xs text-muted-foreground">
                  拖拽图片到此处，或点击选择文件
                </p>
                <p className="text-xs text-muted-foreground/60">
                  支持 Ctrl+V 粘贴截图 · JPG / PNG / WebP
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="size-3.5" />
                选择图片
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="上传截图"
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative rounded-xl border border-border/60 overflow-hidden bg-card notion-card"
          >
            {/* Image Preview */}
            <div className="relative max-h-[400px] overflow-hidden">
              <img
                src={imagePreview}
                alt="截图预览"
                className="w-full h-full object-contain max-h-[400px]"
              />

              {/* Clear button */}
              {!isRecognizing && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 right-3 size-8 rounded-full bg-background/90 backdrop-blur-sm shadow-sm opacity-70 hover:opacity-100 transition-opacity"
                  onClick={handleClearImage}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            {/* File info + action */}
            <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="size-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {imageFile?.name || '粘贴的图片'}
                </span>
              </div>

              <Button
                size="sm"
                onClick={handleStartRecognize}
                disabled={isRecognizing}
                className="gap-1.5"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    正在识别中...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    开始识别
                  </>
                )}
              </Button>
            </div>

            {/* Progress bar */}
            <AnimatePresence>
              {isRecognizing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 3 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full bg-muted overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-primary/70 rounded-r-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(progress, 95)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
