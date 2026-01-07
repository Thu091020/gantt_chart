import React from 'react';
import { GanttProvider } from '../context/GanttContext';
import { GanttView } from './GanttView';

interface GanttViewWrapperProps {
  projectId: string;  // dự án id
  projectMembers: { id: string; name: string }[];  // thành viên thuộc dự án 
  holidays: {  // cấu hình ngày nghỉ
    id: string;  
    date: string;
    end_date: string | null;
    name: string;
    is_recurring: boolean;
  }[];
  settings: any;  // cấu hình cài đặt
}

/*
* Đay là wrapper function to bọc chứa toàn bộ gantt 
*
**/
export function GanttViewWrapper(props: GanttViewWrapperProps) {
  return (
    <GanttProvider> 
      {/* Higher order component */}
      <GanttView {...props} />
    </GanttProvider>
  );
}

export { GanttView };
export type { GanttViewMode } from '../components/toolbar/GanttToolbar';
