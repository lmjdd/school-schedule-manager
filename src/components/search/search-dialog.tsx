'use client';

import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useAppStore } from '@/lib/store';
import {
  BookOpen,
  ClipboardList,
  CalendarDays,
  Search,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'course' | 'assignment' | 'exam';
  action: () => void;
}

export function SearchDialog() {
  const { searchOpen, setSearchOpen, setCurrentPage, setEditingCourse, setEditingAssignment, setEditingExam } =
    useAppStore();

  // Fetch all searchable data
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchOpen,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const res = await fetch('/api/assignments');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchOpen,
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await fetch('/api/exams');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchOpen,
  });

  // Build search results when data is loaded
  const allResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];

    for (const course of courses) {
      results.push({
        id: `course-${course.id}`,
        title: course.name,
        subtitle: course.teacher || '未设置教师',
        type: 'course',
        action: () => {
          setEditingCourse(course);
          setCurrentPage('courses');
        },
      });
    }

    for (const assignment of assignments) {
      results.push({
        id: `assignment-${assignment.id}`,
        title: assignment.title,
        subtitle: assignment.course?.name || '未关联课程',
        type: 'assignment',
        action: () => {
          setEditingAssignment(assignment);
          setCurrentPage('assignments');
        },
      });
    }

    for (const exam of exams) {
      results.push({
        id: `exam-${exam.id}`,
        title: exam.title,
        subtitle: exam.course?.name || '未关联课程',
        type: 'exam',
        action: () => {
          setEditingExam(exam);
          setCurrentPage('exams');
        },
      });
    }

    return results;
  }, [courses, assignments, exams, setEditingCourse, setEditingAssignment, setEditingExam, setCurrentPage]);

  // cmdk handles filtering based on the `value` prop of CommandItem
  // So we don't need a custom filterFn

  // Group results by type
  const courseResults = useMemo(
    () => allResults.filter((r) => r.type === 'course'),
    [allResults],
  );
  const assignmentResults = useMemo(
    () => allResults.filter((r) => r.type === 'assignment'),
    [allResults],
  );
  const examResults = useMemo(
    () => allResults.filter((r) => r.type === 'exam'),
    [allResults],
  );

  const handleSelect = (result: SearchResult) => {
    result.action();
    setSearchOpen(false);
  };

  // Close on Escape when search input is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput placeholder="搜索课程、作业、考试..." />
      <CommandList>
        <CommandEmpty className="py-8">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Search className="size-5 opacity-50" />
            <p className="text-sm">未找到相关结果</p>
          </div>
        </CommandEmpty>

        {courseResults.length > 0 && (
          <CommandGroup heading="课程">
            {courseResults.map((result) => (
              <CommandItem
                key={result.id}
                value={`course ${result.title} ${result.subtitle}`}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <BookOpen className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.subtitle}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {assignmentResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="作业">
              {assignmentResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`assignment ${result.title} ${result.subtitle}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <ClipboardList className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {examResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="考试">
              {examResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`exam ${result.title} ${result.subtitle}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
