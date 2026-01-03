import React from 'react';
import { GanttProvider } from '../context/GanttContext';
import { GanttView } from './GanttView';

interface GanttViewWrapperProps {
  projectId: string;
  projectMembers: { id: string; name: string }[];
  holidays: {
    id: string;
    date: string;
    end_date: string | null;
    name: string;
    is_recurring: boolean;
  }[];
  settings: any;
}

/**
 * GanttViewWrapper - Wraps GanttView with GanttProvider
 * This ensures all child components have access to the adapter context
 */
export function GanttViewWrapper(props: GanttViewWrapperProps) {
  return (
    <GanttProvider>
      <GanttView {...props} />
    </GanttProvider>
  );
}

export { GanttView };
export type { GanttViewMode } from '../components/toolbar/GanttToolbar';
