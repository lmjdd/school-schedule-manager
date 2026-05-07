'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Calendar,
  BookOpen,
  Tag,
  Type,
  Hash,
} from 'lucide-react';
import type { Note } from '@/lib/types';

// --- Simple Markdown Renderer (regex-based, no external library) ---

export function renderMarkdown(content: string): string {
  if (!content) return '';

  let html = content;

  // Escape HTML entities
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```language\ncode\n```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, _lang, code) => {
      return `<pre class="bg-muted rounded-lg p-3 my-3 overflow-x-auto text-sm"><code>${code.trim()}</code></pre>`;
    },
  );

  // Inline code (`code`)
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );

  // Blockquotes (> text)
  html = html.replace(
    /^&gt;\s?(.*)$/gm,
    '<blockquote class="border-l-3 border-primary/30 pl-4 my-2 text-muted-foreground italic">$1</blockquote>',
  );

  // Headers (### → h3, ## → h2, # → h1)
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-base font-semibold mt-5 mb-2 text-foreground">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-lg font-semibold mt-6 mb-2 text-foreground">$1</h2>',
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>',
  );

  // Bold (**text**)
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-foreground">$1</strong>',
  );

  // Italic (*text*)
  html = html.replace(
    /\*(.+?)\*/g,
    '<em>$1</em>',
  );

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Unordered lists (- item)
  html = html.replace(
    /^[\-\*]\s+(.+)$/gm,
    '<li class="ml-4 list-disc text-foreground/90">$1</li>',
  );

  // Ordered lists (1. item)
  html = html.replace(
    /^\d+\.\s+(.+)$/gm,
    '<li class="ml-4 list-decimal text-foreground/90">$1</li>',
  );

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(
    /(<li class="ml-4 list-disc[^>]*>[^<]*<\/li>\n?)+/g,
    (match) => `<ul class="my-2 space-y-1">${match}</ul>`,
  );
  html = html.replace(
    /(<li class="ml-4 list-decimal[^>]*>[^<]*<\/li>\n?)+/g,
    (match) => `<ol class="my-2 space-y-1">${match}</ol>`,
  );

  // Horizontal rules (--- or ***)
  html = html.replace(/^[-*]{3,}$/gm, '<hr class="my-4 border-border" />');

  // Paragraphs: convert double newlines to paragraph breaks
  html = html.replace(/\n\n/g, '</p><p class="my-2 text-foreground/90 leading-relaxed">');
  html = html.replace(/\n/g, '<br />');

  return `<p class="text-foreground/90 leading-relaxed">${html}</p>`;
}

// --- Helper: Word count (Chinese + English) ---

function countWords(text: string): { chars: number; words: number } {
  if (!text) return { chars: 0, words: 0 };
  const chars = text.length;
  // Count Chinese characters as individual words, English words as space-separated
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = text
    .replace(/[\u4e00-\u9fff]/g, '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return { chars, words: chineseChars + englishWords };
}

// --- Tag Color Map ---

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '重点': { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  '复习': { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  '公式': { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  '笔记': { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  '作业': { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  '考试': { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
};

const DEFAULT_TAG_COLOR = { bg: 'bg-secondary', text: 'text-foreground', border: 'border-border' };

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || DEFAULT_TAG_COLOR;
}

// --- Component ---

interface NoteDetailDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteDetailDialog({
  note,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: NoteDetailDialogProps) {
  // Keyboard shortcuts: Ctrl+E to edit, Escape already handled by Dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (note) {
          onEdit(note);
          onOpenChange(false);
        }
      }
    },
    [note, onEdit, onOpenChange],
  );

  const content = note?.content ?? '';
  const renderedContent = content ? renderMarkdown(content) : '';
  const wordCount = content ? countWords(content) : { chars: 0, words: 0 };

  const courseColor = note?.course?.color || '#6366f1';
  const tagColor = note?.tag ? getTagColor(note.tag) : null;

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground leading-tight">
                {note.title}
              </DialogTitle>
            </div>
            {/* Pin indicator */}
            {note.isPinned && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="shrink-0"
              >
                <Pin className="size-4 text-amber-500 rotate-[-45deg] fill-amber-500" />
              </motion.div>
            )}
          </div>
        </DialogHeader>

        {/* Body: Metadata + Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Panel: Metadata */}
            <div className="md:w-56 shrink-0 space-y-3">
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                {/* Course */}
                {note.course && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">课程:</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-5 font-medium ml-auto"
                      style={{
                        backgroundColor: courseColor + '15',
                        color: courseColor,
                        borderColor: courseColor + '30',
                      }}
                    >
                      {note.course.name}
                    </Badge>
                  </div>
                )}

                {/* Tag */}
                {note.tag && tagColor && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">标签:</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 font-normal ml-auto ${tagColor.bg} ${tagColor.text} ${tagColor.border}`}
                    >
                      {note.tag}
                    </Badge>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">创建:</span>
                  <span className="text-xs text-foreground/70 ml-auto tabular-nums">
                    {new Date(note.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Updated Date */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">更新:</span>
                  <span className="text-xs text-foreground/70 ml-auto tabular-nums">
                    {new Date(note.updatedAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Pinned status */}
                <div className="flex items-center gap-2 text-sm">
                  {note.isPinned ? (
                    <Pin className="size-3.5 text-amber-500 shrink-0 rotate-[-45deg]" />
                  ) : (
                    <PinOff className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-muted-foreground">状态:</span>
                  <span className="text-xs text-foreground/70 ml-auto">
                    {note.isPinned ? '已置顶' : '普通'}
                  </span>
                </div>
              </div>

              {/* Word & Character Count */}
              <div className="flex items-center gap-4 px-1 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <Type className="size-3" />
                  {wordCount.words} 字
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="size-3" />
                  {wordCount.chars} 字符
                </span>
              </div>
            </div>

            {/* Right Panel: Markdown Content */}
            <div className="flex-1 min-w-0">
              {note.content ? (
                <div
                  className="prose-sm prose-neutral dark:prose-invert max-w-none
                    [&_pre]:font-mono [&_pre]:text-xs
                    [&_blockquote]:not-italic
                    [&_a]:break-all"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">暂无笔记内容</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Action buttons */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border/60 bg-muted/20 shrink-0">
          <span className="text-[10px] text-muted-foreground/50 hidden sm:inline-flex items-center gap-1">
            <kbd className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0 font-mono text-[10px] leading-none">
              Ctrl
            </kbd>
            +
            <kbd className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0 font-mono text-[10px] leading-none">
              E
            </kbd>
            {' '}编辑
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit(note);
                onOpenChange(false);
              }}
              className="gap-1.5 text-xs"
            >
              <Pencil className="size-3.5" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDelete(note);
                onOpenChange(false);
              }}
              className="gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200/60 dark:border-red-800/40"
            >
              <Trash2 className="size-3.5" />
              删除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
