'use client';

import React from 'react';
import { Settings, GripVertical, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useWidgetLayoutStore,
  WIDGET_IDS,
  WIDGET_META,
  type WidgetId,
} from '@/lib/store';
import { useHydrated } from '@/hooks/use-hydrated';

export function WidgetCustomizer() {
  const widgetOrder = useWidgetLayoutStore((s) => s.widgetOrder);
  const hiddenWidgets = useWidgetLayoutStore((s) => s.hiddenWidgets);
  const setWidgetOrder = useWidgetLayoutStore((s) => s.setWidgetOrder);
  const toggleWidgetVisibility = useWidgetLayoutStore(
    (s) => s.toggleWidgetVisibility,
  );
  const resetWidgetLayout = useWidgetLayoutStore((s) => s.resetWidgetLayout);
  const hydrated = useHydrated();

  // On first render before hydration, use default order to avoid flash
  const order = hydrated ? widgetOrder : [...WIDGET_IDS];
  const hidden = hydrated ? hiddenWidgets : [];

  const visibleCount = WIDGET_IDS.length - hidden.length;

  const handleMoveUp = (widgetId: WidgetId) => {
    const index = order.indexOf(widgetId);
    if (index <= 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setWidgetOrder(newOrder);
  };

  const handleMoveDown = (widgetId: WidgetId) => {
    const index = order.indexOf(widgetId);
    if (index < 0 || index >= order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setWidgetOrder(newOrder);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          aria-label="自定义仪表盘"
        >
          <Settings className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[300px] p-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">自定义仪表盘</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              {visibleCount}/{WIDGET_IDS.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            显示、隐藏或重新排列小组件
          </p>
        </div>

        {/* Widget list */}
        <ScrollArea className="max-h-[320px]">
          <div className="p-1.5">
            {order.map((widgetId, index) => {
              const meta = WIDGET_META[widgetId];
              const isHidden = hidden.includes(widgetId);
              const isFirst = index === 0;
              const isLast = index === order.length - 1;

              return (
                <div
                  key={widgetId}
                  className={`
                    flex items-center gap-2 px-2.5 py-2 rounded-md
                    transition-colors group
                    ${isHidden ? 'opacity-50' : 'hover:bg-accent/50'}
                  `}
                >
                  {/* Grip handle */}
                  <GripVertical className="size-3.5 text-muted-foreground/30 shrink-0 cursor-grab" />

                  {/* Icon */}
                  <span className="text-sm shrink-0 w-5 text-center">
                    {meta.icon}
                  </span>

                  {/* Label */}
                  <span
                    className={`
                      text-sm flex-1 truncate
                      ${isHidden ? 'text-muted-foreground line-through' : ''}
                    `}
                  >
                    {meta.label}
                  </span>

                  {/* Up / Down arrows */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(widgetId)}
                      disabled={isFirst}
                      className="
                        size-6 flex items-center justify-center rounded
                        hover:bg-accent disabled:opacity-20 disabled:pointer-events-none
                        transition-colors
                      "
                      aria-label={`${meta.label} 上移`}
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(widgetId)}
                      disabled={isLast}
                      className="
                        size-6 flex items-center justify-center rounded
                        hover:bg-accent disabled:opacity-20 disabled:pointer-events-none
                        transition-colors
                      "
                      aria-label={`${meta.label} 下移`}
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>

                  {/* Toggle switch */}
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => toggleWidgetVisibility(widgetId)}
                    aria-label={`切换 ${meta.label} 可见性`}
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer with reset */}
        <Separator />
        <div className="px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetWidgetLayout}
            className="w-full text-xs text-muted-foreground hover:text-foreground justify-center gap-1.5"
          >
            <RotateCcw className="size-3" />
            重置为默认布局
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
