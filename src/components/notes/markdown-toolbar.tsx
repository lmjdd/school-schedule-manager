'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Quote,
  Link,
  Minus,
  ChevronDown,
} from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface MarkdownAction {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  prefix: string;
  suffix?: string;
  placeholder?: string;
  block?: boolean;
}

/** Static toolbar action config — no closures, no refs */
const INLINE_ACTIONS: MarkdownAction[] = [
  { icon: <Bold className="size-3.5" />, label: '粗体', shortcut: 'Ctrl+B', prefix: '**', suffix: '**', placeholder: '粗体文本' },
  { icon: <Italic className="size-3.5" />, label: '斜体', shortcut: 'Ctrl+I', prefix: '*', suffix: '*', placeholder: '斜体文本' },
  { icon: <Strikethrough className="size-3.5" />, label: '删除线', shortcut: 'Ctrl+D', prefix: '~~', suffix: '~~', placeholder: '删除文本' },
];

const LIST_ACTIONS: MarkdownAction[] = [
  { icon: <List className="size-3.5" />, label: '无序列表', prefix: '- ', block: true, placeholder: '列表项' },
  { icon: <ListOrdered className="size-3.5" />, label: '有序列表', prefix: '1. ', block: true, placeholder: '列表项' },
];

const CODE_ACTIONS: MarkdownAction[] = [
  { icon: <Code className="size-3.5" />, label: '行内代码', shortcut: 'Ctrl+E', prefix: '`', suffix: '`', placeholder: 'code' },
];

const BLOCK_ACTIONS: MarkdownAction[] = [
  { icon: <Code className="size-3.5" />, label: '代码块', prefix: '```\n', suffix: '\n```', placeholder: '代码' },
  { icon: <Quote className="size-3.5" />, label: '引用', prefix: '>', block: true, placeholder: '引用文本' },
  { icon: <Link className="size-3.5" />, label: '链接', prefix: '[', suffix: '](url)', placeholder: '链接文本' },
  { icon: <Minus className="size-3.5" />, label: '分割线', prefix: '\n---\n', block: true, placeholder: '' },
];

const HEADING_ACTIONS: MarkdownAction[] = [
  { icon: <Heading1 className="size-3.5" />, label: '标题 1', prefix: '#', block: true, placeholder: '标题' },
  { icon: <Heading2 className="size-3.5" />, label: '标题 2', prefix: '##', block: true, placeholder: '标题' },
  { icon: <Heading3 className="size-3.5" />, label: '标题 3', prefix: '###', block: true, placeholder: '标题' },
];

// Keyboard shortcut map: key -> MarkdownAction config
const SHORTCUT_MAP: Record<string, Omit<MarkdownAction, 'icon' | 'label'>> = {
  b: { prefix: '**', suffix: '**', placeholder: '粗体文本' },
  i: { prefix: '*', suffix: '*', placeholder: '斜体文本' },
  e: { prefix: '`', suffix: '`', placeholder: 'code' },
  d: { prefix: '~~', suffix: '~~', placeholder: '删除文本' },
};

/**
 * Insert or wrap text in a textarea at the cursor position.
 */
function insertMarkdown(
  textarea: HTMLTextAreaElement,
  options: {
    prefix: string;
    suffix?: string;
    placeholder?: string;
    block?: boolean;
  }
) {
  const { prefix, suffix = '', placeholder = '', block = false } = options;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;

  // Handle React's synthetic event sync by using native setter
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(textarea, '');
  }

  if (block) {
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    const needsNewline = beforeText.length > 0 && !beforeText.endsWith('\n');
    const linePrefix = needsNewline ? '\n' + prefix : prefix;

    if (start !== end) {
      const selectedText = value.substring(start, end);
      textarea.value = beforeText + linePrefix + ' ' + selectedText + '\n' + afterText;
      textarea.selectionStart = start + linePrefix.length + 1;
      textarea.selectionEnd = start + linePrefix.length + 1 + selectedText.length;
    } else {
      textarea.value = beforeText + linePrefix + ' ' + placeholder + '\n' + afterText;
      const placeholderStart = start + linePrefix.length + 1;
      textarea.selectionStart = placeholderStart;
      textarea.selectionEnd = placeholderStart + placeholder.length;
    }
  } else if (start !== end) {
    const selectedText = value.substring(start, end);
    textarea.value = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    textarea.selectionStart = start + prefix.length;
    textarea.selectionEnd = end + prefix.length;
  } else {
    textarea.value = value.substring(0, start) + prefix + placeholder + suffix + value.substring(end);
    const placeholderStart = start + prefix.length;
    textarea.selectionStart = placeholderStart;
    textarea.selectionEnd = placeholderStart + placeholder.length;
  }

  // Dispatch input event so React re-renders
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function ToolbarButton({
  action,
  onClick,
}: {
  action: MarkdownAction;
  onClick: (action: MarkdownAction) => void;
}) {
  const handleClick = useCallback(() => {
    onClick(action);
  }, [action, onClick]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleClick}
        >
          {action.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {action.label}
        {action.shortcut && (
          <kbd className="ml-1.5 inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
            {action.shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-border/60" />;
}

export function MarkdownToolbar({ textareaRef }: MarkdownToolbarProps) {
  const isComposingRef = useRef(false);

  const execAction = useCallback(
    (opts: { prefix: string; suffix?: string; placeholder?: string; block?: boolean }) => {
      const textarea = textareaRef.current;
      if (!textarea || isComposingRef.current) return;
      insertMarkdown(textarea, opts);
    },
    [textareaRef]
  );

  // Keyboard shortcuts attached to the textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComposingRef.current) return;

      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      const shortcut = SHORTCUT_MAP[e.key.toLowerCase()];
      if (shortcut) {
        e.preventDefault();
        execAction(shortcut);
      }
    };

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };
    const handleCompositionEnd = () => {
      isComposingRef.current = false;
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('compositionstart', handleCompositionStart);
    textarea.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('compositionstart', handleCompositionStart);
      textarea.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [textareaRef, execAction]);

  const handleClick = useCallback(
    (action: MarkdownAction) => {
      execAction({
        prefix: action.prefix,
        suffix: action.suffix,
        placeholder: action.placeholder,
        block: action.block,
      });
    },
    [execAction]
  );

  const handleHeadingClick = useCallback(
    (action: MarkdownAction) => {
      execAction({
        prefix: action.prefix,
        placeholder: action.placeholder,
        block: action.block,
      });
    },
    [execAction]
  );

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-1 py-0.5">
      {/* Heading dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7 gap-0.5 p-0 px-1.5 text-muted-foreground hover:text-foreground"
              >
                <Heading2 className="size-3.5" />
                <ChevronDown className="size-2.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            标题
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-[120px]">
          {HEADING_ACTIONS.map((h) => (
            <DropdownMenuItem
              key={h.label}
              onClick={() => handleHeadingClick(h)}
              className="gap-2 text-sm"
            >
              {h.icon}
              {h.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Divider />

      {/* Inline formatting */}
      {INLINE_ACTIONS.map((action) => (
        <ToolbarButton key={action.label} action={action} onClick={handleClick} />
      ))}

      <Divider />

      {/* Lists */}
      {LIST_ACTIONS.map((action) => (
        <ToolbarButton key={action.label} action={action} onClick={handleClick} />
      ))}

      <Divider />

      {/* Inline code */}
      {CODE_ACTIONS.map((action) => (
        <ToolbarButton key={action.label} action={action} onClick={handleClick} />
      ))}

      <Divider />

      {/* Block elements */}
      {BLOCK_ACTIONS.map((action) => (
        <ToolbarButton key={action.label} action={action} onClick={handleClick} />
      ))}
    </div>
  );
}
