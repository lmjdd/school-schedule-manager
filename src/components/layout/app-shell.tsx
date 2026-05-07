'use client';

import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar, SidebarMobileTrigger } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { FloatingActionButton } from '@/components/layout/floating-action-button';
import { GlobalKeyboardShortcuts } from '@/components/global-keyboard-shortcuts';
import { SearchDialog } from '@/components/search/search-dialog';
import { DeadlineNotifier } from '@/components/dashboard/deadline-notifier';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { NotificationServiceWrapper } from '@/components/notifications/notification-service';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <GlobalKeyboardShortcuts />
      <SearchDialog />
      <DeadlineNotifier />
      <NotificationServiceWrapper />
      <div className="min-h-screen flex">
        {/* Sidebar — fixed on desktop, Sheet on mobile */}
        <AppSidebar />

        {/* Main content area */}
        <div
          className={
            isMobile
              ? 'flex-1 flex flex-col min-w-0'
              : 'flex-1 flex flex-col min-w-0 ml-60'
          }
        >
          {/* Top bar for mobile — hidden when mobile bottom nav is shown */}
          {!isMobile && (
            <header className="sticky top-0 z-20 flex items-center justify-end border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-1.5">
              <NotificationBell />
            </header>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div
              className={
                isMobile
                  ? 'mx-auto max-w-5xl px-4 py-4 pb-20'
                  : 'mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8'
              }
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}

      {/* Floating Action Button for Mobile Quick Entry */}
      {isMobile && <FloatingActionButton />}
    </SidebarProvider>
  );
}
