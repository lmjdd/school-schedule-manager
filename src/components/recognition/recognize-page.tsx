'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScreenshotUpload, RecognitionType } from './screenshot-upload';
import { RecognitionResult } from './recognition-result';

type Step = 1 | 2 | 3;

interface RecognitionData {
  type: 'schedule';
  courses: Record<string, unknown>[];
}

interface GradesRecognitionData {
  type: 'grades';
  semester?: string;
  grades: Record<string, unknown>[];
}

export function RecognizePage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionData | GradesRecognitionData | null>(null);
  const [rawText, setRawText] = useState<string | undefined>(undefined);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleRecognize = useCallback(async (imageDataUrl: string, type: RecognitionType) => {
    setIsRecognizing(true);
    setRawText(undefined);
    setRecognitionResult(null);

    try {
      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl, type }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '识别请求失败' }));
        throw new Error(err.error || '识别请求失败');
      }

      const result = await res.json();

      if (result.success) {
        if (result.raw) {
          setRawText(result.data);
          setCurrentStep(2);
        } else {
          setRecognitionResult(result.data);
          setCurrentStep(2);
        }
      } else {
        throw new Error('识别失败');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '识别失败，请重试';
      toast.error(message);
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setRecognitionResult(null);
    setRawText(undefined);
    setCurrentImage(null);
    setCurrentStep(1);
  }, []);

  const handleDone = useCallback(() => {
    setRecognitionResult(null);
    setRawText(undefined);
    setCurrentImage(null);
    setCurrentStep(3);
    // After a short delay, reset to step 1
    setTimeout(() => setCurrentStep(1), 2000);
  }, []);

  const steps = [
    { num: 1, label: '上传截图', icon: ImagePlus },
    { num: 2, label: '查看结果', icon: Search },
    { num: 3, label: '导入完成', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          📷 截图识别
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          上传教务系统截图，自动识别课程和成绩信息
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center justify-center gap-0"
      >
        {steps.map((step, index) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.num}>
              {index > 0 && (
                <div
                  className={`w-12 sm:w-20 h-px transition-colors duration-500 ${
                    isCompleted ? 'bg-primary' : 'bg-border/60'
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`size-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary scale-105'
                      : isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </motion.div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <ScreenshotUpload
            onRecognize={(image, type) => {
              setCurrentImage(image);
              handleRecognize(image, type);
            }}
            isRecognizing={isRecognizing}
          />
        )}

        {currentStep === 2 && recognitionResult && (
          <RecognitionResult
            data={recognitionResult as RecognitionData & GradesRecognitionData}
            rawText={rawText}
            onCancel={handleCancel}
            onDone={handleDone}
          />
        )}

        {currentStep === 2 && rawText && !recognitionResult && (
          <RecognitionResult
            data={{ type: 'schedule', courses: [] }}
            rawText={rawText}
            onCancel={handleCancel}
            onDone={handleDone}
          />
        )}

        {currentStep === 3 && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-16 gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="size-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"
            >
              <CheckCircle2 className="size-8" />
            </motion.div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground">导入完成！</p>
              <p className="text-sm text-muted-foreground">数据已成功添加到你的账户</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
