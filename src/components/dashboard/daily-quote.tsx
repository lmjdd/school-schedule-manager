'use client';

import React from 'react';
import { RefreshCw, Heart } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DailyQuote() {
  const { currentQuote, refreshQuote, toggleFavoriteQuote, favoriteQuoteIds } =
    useAppStore();

  const isFavorite = favoriteQuoteIds.includes(currentQuote.id);

  return (
    <div className="rounded-lg bg-muted/50 border border-border/50 p-5 md:p-6 notion-card">
      <div className="flex items-start justify-between gap-3">
        {/* Quote mark decoration */}
        <span
          className="text-3xl md:text-4xl leading-none select-none text-muted-foreground/40 font-serif"
          aria-hidden
        >
          &ldquo;
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={refreshQuote}
            aria-label="换一条格言"
          >
            <RefreshCw className="size-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => toggleFavoriteQuote(currentQuote.id)}
            aria-label={isFavorite ? '取消收藏' : '收藏格言'}
          >
            <Heart
              className={cn(
                'size-4 transition-colors duration-200',
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-muted-foreground',
              )}
            />
          </Button>
        </div>
      </div>

      {/* Quote text */}
      <blockquote className="mt-2 mb-3">
        <p className="text-sm md:text-base italic text-foreground/80 leading-relaxed">
          {currentQuote.content}
        </p>
      </blockquote>

      {/* Author */}
      <p className="text-xs text-muted-foreground">
        — {currentQuote.author}
        {currentQuote.source && (
          <span className="ml-1 text-muted-foreground/70">
            {currentQuote.source}
          </span>
        )}
      </p>
    </div>
  );
}
