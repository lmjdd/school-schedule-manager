'use client';

import React, { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarkdownToolbar } from './markdown-toolbar';
import { renderMarkdown } from './note-detail-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Eye, Edit3 } from 'lucide-react';

// --- Constants ---

const STORAGE_MODE_KEY = 'edutrack-editor-mode';
const STORAGE_POSITION_KEY = 'edutrack-split-position';

type EditorMode = 'split' | 'edit-only';

const MIN_EDITOR_WIDTH = 200;
const MIN_PREVIEW_WIDTH = 200;
const DIVIDER_WIDTH = 4;
const DEFAULT_SPLIT_RATIO = 0.5;

// --- Preference store (module-level pub/sub) ---
// This avoids calling setState in an effect by using useSyncExternalStore.

const prefListeners = new Set<() => void>();

function emitPrefChange() {
  prefListeners.forEach((fn) => fn());
}

function subscribeToPref(fn: () => void) {
  prefListeners.add(fn);
  return () => {
    prefListeners.delete(fn);
  };
}

// --- LocalStorage helpers ---

function readStoredMode(): EditorMode | null {
  try {
    const val = localStorage.getItem(STORAGE_MODE_KEY);
    if (val === 'split' || val === 'edit-only') return val;
  } catch {
    // ignore
  }
  return null;
}

function writeStoredMode(mode: EditorMode) {
  try {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

function readStoredPosition(): number | null {
  try {
    const val = localStorage.getItem(STORAGE_POSITION_KEY);
    if (val) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0.2 && num < 0.8) return num;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeStoredPosition(ratio: number) {
  try {
    localStorage.setItem(STORAGE_POSITION_KEY, String(ratio));
  } catch {
    // ignore
  }
}

// --- In-memory cache for drag position (avoids localStorage writes on every mousemove) ---
let positionCache: number | null = null;

function getPositionSnapshot(): number {
  if (positionCache !== null) return positionCache;
  return readStoredPosition() || DEFAULT_SPLIT_RATIO;
}

function getPositionServerSnapshot(): number {
  return DEFAULT_SPLIT_RATIO;
}

function getModeSnapshot(): EditorMode {
  return readStoredMode() || 'split';
}

function getModeServerSnapshot(): EditorMode {
  return 'split';
}

// --- Component ---

interface MarkdownSplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  minEditorHeight?: number;
}

export function MarkdownSplitEditor({
  value,
  onChange,
  textareaRef,
  placeholder = '在这里记录你的学习笔记...',
  minEditorHeight = 200,
}: MarkdownSplitEditorProps) {
  const isMobile = useIsMobile();

  // Read persisted preferences via useSyncExternalStore (SSR-safe, no setState in effects)
  const mode = useSyncExternalStore(subscribeToPref, getModeSnapshot, getModeServerSnapshot);
  const splitRatio = useSyncExternalStore(subscribeToPref, getPositionSnapshot, getPositionServerSnapshot);

  // Mobile tab: 'edit' or 'preview'
  const [mobileTab, setMobileTab] = React.useState<'edit' | 'preview'>('edit');

  // Refs for panes
  const containerRef = useRef<HTMLDivElement>(null);
  const editorPaneRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Track which pane is being scrolled to avoid infinite sync loops
  const scrollingFromRef = useRef<'editor' | 'preview' | null>(null);

  // --- Computed values ---

  const isSplitMode = !isMobile && mode === 'split';

  const renderedHtml = useMemo(() => {
    return renderMarkdown(value);
  }, [value]);

  // --- Handlers ---

  const toggleMode = useCallback(() => {
    const next: EditorMode = mode === 'split' ? 'edit-only' : 'split';
    writeStoredMode(next);
    emitPrefChange();
  }, [mode]);

  // --- Drag-to-resize ---

  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width - DIVIDER_WIDTH;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingRef.current) return;
        const offsetX = moveEvent.clientX - containerRect.left;
        const ratio = Math.max(
          MIN_EDITOR_WIDTH / containerWidth,
          Math.min(1 - MIN_PREVIEW_WIDTH / containerWidth, offsetX / containerWidth),
        );
        // Write to in-memory cache (fast) — don't hit localStorage on every move
        positionCache = ratio;
        emitPrefChange();
      };

      const handleMouseUp = () => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        // Persist final position to localStorage and clear cache
        if (positionCache !== null) {
          writeStoredPosition(positionCache);
          positionCache = null;
          emitPrefChange();
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [],
  );

  // --- Sync scrolling ---

  const handleEditorScroll = useCallback(() => {
    if (scrollingFromRef.current === 'preview') return;
    scrollingFromRef.current = 'editor';
    const editorEl = editorPaneRef.current;
    const previewEl = previewPaneRef.current;
    if (!editorEl || !previewEl) return;

    const editorMax = editorEl.scrollHeight - editorEl.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    if (editorMax <= 0 || previewMax <= 0) return;

    const ratio = editorEl.scrollTop / editorMax;
    previewEl.scrollTop = ratio * previewMax;

    requestAnimationFrame(() => {
      scrollingFromRef.current = null;
    });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (scrollingFromRef.current === 'editor') return;
    scrollingFromRef.current = 'preview';
    const editorEl = editorPaneRef.current;
    const previewEl = previewPaneRef.current;
    if (!editorEl || !previewEl) return;

    const editorMax = editorEl.scrollHeight - editorEl.clientHeight;
    const previewMax = previewEl.scrollHeight - previewEl.clientHeight;
    if (editorMax <= 0 || previewMax <= 0) return;

    const ratio = previewEl.scrollTop / previewMax;
    editorEl.scrollTop = ratio * editorMax;

    requestAnimationFrame(() => {
      scrollingFromRef.current = null;
    });
  }, []);

  // --- Inline styles for split layout ---

  const editorStyle: React.CSSProperties = isSplitMode
    ? { width: `${splitRatio * 100}%` }
    : {};

  // --- Render ---

  return (
    <div className="space-y-1.5">
      {/* Top bar: toolbar + mode toggle */}
      <div className="flex items-center gap-2">
        <MarkdownToolbar textareaRef={textareaRef} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mode toggle — desktop only */}
        {!isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className="size-7 p-0 text-muted-foreground hover:text-foreground"
              >
                {mode === 'split' ? (
                  <PanelLeftClose className="size-3.5" />
                ) : (
                  <PanelLeftOpen className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {mode === 'split' ? '仅编辑模式' : '分屏预览模式'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Mobile tab bar */}
      {isMobile && (
        <div className="flex items-center rounded-md border border-border/60 bg-muted/30 p-0.5">
          <Button
            type="button"
            variant={mobileTab === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMobileTab('edit')}
            className="flex-1 gap-1.5 text-xs h-7"
          >
            <Edit3 className="size-3" />
            编辑
          </Button>
          <Button
            type="button"
            variant={mobileTab === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMobileTab('preview')}
            className="flex-1 gap-1.5 text-xs h-7"
          >
            <Eye className="size-3" />
            预览
          </Button>
        </div>
      )}

      {/* Editor / Preview container */}
      <div
        ref={containerRef}
        className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden"
        style={{ minHeight: minEditorHeight }}
      >
        {isMobile ? (
          /* ---- Mobile: stacked with tab toggle ---- */
          <AnimatePresence mode="wait">
            {mobileTab === 'edit' ? (
              <motion.div
                key="mobile-editor"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <textarea
                  ref={textareaRef}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full h-[300px] sm:h-[400px] resize-none bg-transparent px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  spellCheck={false}
                />
              </motion.div>
            ) : (
              <motion.div
                key="mobile-preview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="w-full h-[300px] sm:h-[400px] overflow-y-auto px-4 py-3">
                  {value ? (
                    <div
                      className="prose-sm prose-neutral dark:prose-invert max-w-none
                        [&_pre]:font-mono [&_pre]:text-xs
                        [&_blockquote]:not-italic
                        [&_a]:break-all"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <p className="text-sm text-muted-foreground/60">
                        暂无预览内容
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* ---- Desktop: side-by-side or edit-only ---- */
          <div className="flex h-[400px]">
            {/* Editor pane */}
            <div
              ref={editorPaneRef}
              style={editorStyle}
              className="overflow-y-auto shrink-0"
              onScroll={isSplitMode ? handleEditorScroll : undefined}
            >
              <textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-full resize-none bg-transparent px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                spellCheck={false}
              />
            </div>

            {/* Divider — only in split mode */}
            <AnimatePresence>
              {isSplitMode && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: DIVIDER_WIDTH, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 cursor-col-resize group relative flex items-center justify-center"
                  onMouseDown={handleDividerMouseDown}
                >
                  <div className="w-1 h-8 rounded-full bg-border/60 group-hover:bg-primary/50 group-active:bg-primary transition-colors duration-150" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview pane */}
            <AnimatePresence>
              {isSplitMode && (
                <motion.div
                  ref={previewPaneRef}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: `${(1 - splitRatio) * 100}%` }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-y-auto border-l border-border/40 shrink-0"
                  onScroll={handlePreviewScroll}
                >
                  <div className="px-4 py-3">
                    {value ? (
                      <div
                        className="prose-sm prose-neutral dark:prose-invert max-w-none
                          [&_pre]:font-mono [&_pre]:text-xs
                          [&_blockquote]:not-italic
                          [&_a]:break-all"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <p className="text-sm text-muted-foreground/60">
                          开始输入以预览...
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
