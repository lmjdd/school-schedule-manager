'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Note } from '@/lib/types';

interface NoteCardProps {
  note: Note;
  index: number;
  onClick: (note: Note) => void;
  onDelete: (note: Note) => void;
  searchQuery?: string;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

// Tag color accents
const TAG_ACCENT_COLORS: Record<string, string> = {
  '重点': 'border-l-red-500',
  '复习': 'border-l-blue-500',
  '公式': 'border-l-purple-500',
  '笔记': 'border-l-green-500',
  '作业': 'border-l-amber-500',
  '考试': 'border-l-rose-500',
};

const TAG_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  '重点': { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400' },
  '复习': { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400' },
  '公式': { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400' },
  '笔记': { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400' },
  '作业': { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
  '考试': { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400' },
};

// Highlight matching text in the title
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (regex.test(part)) {
      // Reset regex lastIndex for the same string
      regex.lastIndex = 0;
      return (
        <mark
          key={i}
          className="bg-yellow-200/70 dark:bg-yellow-500/30 text-inherit rounded-sm px-0.5"
        >
          {part}
        </mark>
      );
    }
    regex.lastIndex = 0;
    return part;
  });
}

// Get the first line of content (strip markdown)
function getFirstLine(content: string): string {
  if (!content) return '';
  const firstLine = content.split('\n')[0];
  // Strip markdown headings (# ## ###)
  const stripped = firstLine.replace(/^#{1,3}\s+/, '').trim();
  return stripped || '';
}

export function NoteCard({ note, index, onClick, onDelete, searchQuery }: NoteCardProps) {
  const courseColor = note.course?.color || '#6366f1';

  // Determine the border-left accent color: tag-based takes priority, then course color
  const tagAccent = note.tag ? TAG_ACCENT_COLORS[note.tag] : null;
  const borderLeftClass = tagAccent || '';
  const borderLeftStyle = !tagAccent ? { borderLeftWidth: '3px', borderLeftColor: courseColor } : {};

  const tagBadge = note.tag ? TAG_BADGE_STYLES[note.tag] : null;
  const firstLine = getFirstLine(note.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        ease: 'easeOut',
      }}
      className="group relative flex flex-col rounded-lg border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all cursor-pointer interactive-card"
      style={borderLeftStyle}
      onClick={() => onClick(note)}
    >
      {/* Apply tag accent via class if available (overrides inline style) */}
      {tagAccent && (
        <div
          className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-l-lg ${tagAccent}`}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {note.isPinned && (
            <motion.div
              initial={{ scale: 0, rotate: 45 }}
              animate={{ scale: 1, rotate: -45 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.04 + 0.2 }}
              className="shrink-0"
            >
              <Pin className="size-3.5 text-amber-500 fill-amber-500/30" />
            </motion.div>
          )}
          <h3 className="text-sm font-semibold text-foreground truncate leading-snug">
            {searchQuery ? highlightText(note.title, searchQuery) : note.title}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          className="shrink-0 size-7 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          aria-label="删除笔记"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* First line preview (if content exists and is different from title area) */}
      {firstLine && (
        <p className="px-4 pb-1.5 text-xs text-muted-foreground/70 leading-relaxed truncate">
          {firstLine}
        </p>
      )}

      {/* Content preview */}
      {note.content && (
        <p className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {note.content.length > 100
            ? note.content.slice(0, 100) + '...'
            : note.content}
        </p>
      )}

      {/* Hover hint */}
      <div className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/80 text-background text-xs font-medium backdrop-blur-sm">
          <Eye className="size-3" />
          点击查看
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-1 flex-wrap">
        {note.course && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 font-medium"
            style={{
              backgroundColor: courseColor + '15',
              color: courseColor,
              borderColor: courseColor + '30',
            }}
          >
            {note.course.name}
          </Badge>
        )}
        {note.tag && tagBadge && (
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-5 font-normal ${tagBadge.bg} ${tagBadge.text}`}
          >
            {note.tag}
          </Badge>
        )}
        {note.tag && !tagBadge && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 font-normal"
          >
            {note.tag}
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground/70 ml-auto tabular-nums">
          {getRelativeTime(note.updatedAt)}
        </span>
      </div>
    </motion.div>
  );
}
