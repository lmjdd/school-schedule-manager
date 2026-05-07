'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, StickyNote, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/lib/store';
import type { Course, Note } from '@/lib/types';
import { NoteCard } from '@/components/notes/note-card';
import { NoteFormDialog } from '@/components/notes/note-form-dialog';
import { NoteDetailDialog } from '@/components/notes/note-detail-dialog';

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch('/api/notes');
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

async function fetchCourses(): Promise<Course[]> {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export function NotesPage() {
  const { noteSearch, setNoteSearch, noteFilter, setNoteFilter } = useAppStore();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  // Form dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Detail dialog state
  const [detailNote, setDetailNote] = useState<Note | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const handleAddNote = () => {
    setEditingNote(null);
    setDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  const handleViewNote = (note: Note) => {
    setDetailNote(note);
    setDetailOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingNote(null);
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除笔记失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setDeleteTarget(null);
    },
    onError: () => {
      // handled silently
    },
  });

  const handleDeleteNote = (note: Note) => {
    setDeleteTarget(note);
  };

  // Pin/unpin mutation
  const pinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPinned }),
      });
      if (!res.ok) throw new Error('更新失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  // Filter notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by course
    if (noteFilter && noteFilter !== 'all') {
      result = result.filter((n) => n.courseId === noteFilter);
    }

    // Filter by search
    if (noteSearch.trim()) {
      const search = noteSearch.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.content.toLowerCase().includes(search) ||
          n.tag?.toLowerCase().includes(search),
      );
    }

    return result;
  }, [notes, noteFilter, noteSearch]);

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  const isSearching = noteSearch.trim().length > 0;

  const isLoading = notesLoading || coursesLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            📝 学习笔记
          </h1>
          {!isLoading && (
            <Badge variant="secondary" className="font-mono tabular-nums text-xs">
              {isSearching
                ? `${filteredNotes.length} / ${notes.length} 条`
                : `${notes.length} 条`}
            </Badge>
          )}
          {isLoading && (
            <Skeleton className="h-5 w-12 rounded-full" />
          )}
        </div>

        <Button size="sm" onClick={handleAddNote} className="gap-1.5">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">新建笔记</span>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索笔记标题、内容或标签..."
            value={noteSearch}
            onChange={(e) => setNoteSearch(e.target.value)}
            className="pl-8 pr-8 h-9 text-sm"
          />
          <AnimatePresence>
            {isSearching && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => setNoteSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="清空搜索"
              >
                <X className="size-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <Select value={noteFilter} onValueChange={setNoteFilter}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="筛选课程" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部课程</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: course.color || '#6366f1' }}
                  />
                  <span className="truncate max-w-[100px]">{course.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSearching && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNoteSearch('')}
            className="text-xs text-muted-foreground hover:text-foreground gap-1 h-9"
          >
            <X className="size-3" />
            清空搜索
          </Button>
        )}
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border/60 bg-card p-4 space-y-3"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 blur-xl" />
            <div className="relative flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-800/30">
              <StickyNote className="size-7 text-amber-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            {noteSearch || noteFilter !== 'all' ? '没有找到匹配的笔记' : '还没有学习笔记'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-[240px]">
            {noteSearch || noteFilter !== 'all'
              ? '尝试调整搜索条件或筛选条件'
              : '开始记录你的学习心得和重点吧'}
          </p>
          {!noteSearch && noteFilter === 'all' && (
            <Button size="sm" variant="outline" onClick={handleAddNote} className="gap-1.5">
              <Plus className="size-3.5" />
              新建第一条笔记
            </Button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Pinned notes section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  📌 置顶
                </span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={i}
                    onClick={handleViewNote}
                    onDelete={handleDeleteNote}
                    searchQuery={isSearching ? noteSearch : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unpinned notes section */}
          {unpinnedNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    所有笔记
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedNotes.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={pinnedNotes.length + i}
                    onClick={handleViewNote}
                    onDelete={handleDeleteNote}
                    searchQuery={isSearching ? noteSearch : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <NoteDetailDialog
        note={detailNote}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailNote(null);
        }}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
      />

      {/* Form Dialog */}
      <NoteFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        note={editingNote}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除笔记？</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除笔记「{deleteTarget?.title}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  删除中...
                </span>
              ) : (
                '删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
