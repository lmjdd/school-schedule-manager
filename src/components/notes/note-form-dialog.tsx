'use client';

import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NOTE_TAGS } from '@/lib/types';
import type { Course, Note } from '@/lib/types';
import { toast } from 'sonner';
import { Pin } from 'lucide-react';
import { MarkdownSplitEditor } from './markdown-split-editor';

interface NoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null; // null = add mode, Note = edit mode
}

interface FormData {
  title: string;
  content: string;
  courseId: string;
  tag: string;
  isPinned: boolean;
}

interface FormErrors {
  title?: string;
}

const DEFAULT_FORM: FormData = {
  title: '',
  content: '',
  courseId: '',
  tag: '',
  isPinned: false,
};

function getInitialForm(note: Note | null): FormData {
  if (!note) return DEFAULT_FORM;
  return {
    title: note.title,
    content: note.content || '',
    courseId: note.courseId || '',
    tag: note.tag || '',
    isPinned: note.isPinned,
  };
}

function NoteForm({
  note,
  onSuccess,
}: {
  note: Note | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!note;

  const [form, setForm] = useState<FormData>(() => getInitialForm(note));
  const [errors, setErrors] = useState<FormErrors>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch courses for the select dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
  });

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = '请输入笔记标题';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('创建笔记失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('笔记创建成功');
      onSuccess();
    },
    onError: () => {
      toast.error('创建笔记失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('更新笔记失败');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('笔记更新成功');
      onSuccess();
    },
    onError: () => {
      toast.error('更新笔记失败，请重试');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      courseId: form.courseId || null,
      tag: form.tag || null,
      isPinned: form.isPinned,
    };

    if (isEdit && note?.id) {
      updateMutation.mutate({ ...payload, id: note.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <div className="grid gap-4 py-2">
        {/* Title */}
        <div className="grid gap-1.5">
          <Label htmlFor="note-title">
            笔记标题 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="note-title"
            placeholder="如：高数第三章重点总结"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className={errors.title ? 'border-red-400' : ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Content */}
        <div className="grid gap-1.5">
          <Label>笔记内容</Label>
          <MarkdownSplitEditor
            value={form.content}
            onChange={(val) => updateField('content', val)}
            textareaRef={textareaRef}
            placeholder="在这里记录你的学习笔记..."
            minEditorHeight={200}
          />
        </div>

        {/* Course + Tag row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Course selector */}
          <div className="grid gap-1.5">
            <Label>关联课程</Label>
            <Select
              value={form.courseId}
              onValueChange={(val) => updateField('courseId', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择课程（可选）" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: course.color || '#6366f1' }}
                      />
                      {course.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag selector */}
          <div className="grid gap-1.5">
            <Label>标签</Label>
            <Select
              value={form.tag}
              onValueChange={(val) => updateField('tag', val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择标签（可选）" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pin toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Pin className="size-4 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">置顶笔记</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                置顶的笔记将显示在列表最前面
              </p>
            </div>
          </div>
          <Switch
            checked={form.isPinned}
            onCheckedChange={(checked) => updateField('isPinned', checked)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onSuccess}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          ) : (
            '保存'
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function NoteFormDialog({ open, onOpenChange, note }: NoteFormDialogProps) {
  const isEdit = !!note;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑笔记' : '新建笔记'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改你的学习笔记' : '记录你的学习心得和重点'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <NoteForm
            key={note?.id ?? '__new__'}
            note={note}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
