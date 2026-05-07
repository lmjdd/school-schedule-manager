'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { CoursesPage } from '@/components/courses/courses-page';
import { AssignmentsPage } from '@/components/assignments/assignments-page';
import { NotesPage } from '@/components/notes/notes-page';
import { ExamsPage } from '@/components/exams/exams-page';
import { StatisticsPage } from '@/components/statistics/statistics-page';
import { RecognizePage } from '@/components/recognition/recognize-page';
import { SettingsPage } from '@/components/settings/settings-page';
import { useAppStore } from '@/lib/store';

function PageContent() {
  const { currentPage } = useAppStore();

  switch (currentPage) {
    case 'courses':
      return <CoursesPage />;
    case 'assignments':
      return <AssignmentsPage />;
    case 'notes':
      return <NotesPage />;
    case 'exams':
      return <ExamsPage />;
    case 'statistics':
      return <StatisticsPage />;
    case 'recognize':
      return <RecognizePage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
}

export default function Home() {
  const { currentPage } = useAppStore();

  return (
    <Providers>
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <PageContent />
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </Providers>
  );
}
