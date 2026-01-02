/**
 * Mock Allocation Data
 */

import type { Allocation } from '../../types/allocation.types';

export const mockAllocations: Allocation[] = [
  // Employee 1 allocations for January 2026
  {
    id: 'alloc-1',
    employee_id: 'emp-1',
    project_id: 'project-1',
    date: '2026-01-05',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-2',
    employee_id: 'emp-1',
    project_id: 'project-1',
    date: '2026-01-06',
    effort: 0.5,
    source: 'manual',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-3',
    employee_id: 'emp-1',
    project_id: 'project-1',
    date: '2026-01-07',
    effort: 0.5,
    source: 'manual',
    created_at: '2024-01-01T00:00:00Z'
  },
  
  // Employee 2 allocations
  {
    id: 'alloc-4',
    employee_id: 'emp-2',
    project_id: 'project-1',
    date: '2026-01-05',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-5',
    employee_id: 'emp-2',
    project_id: 'project-1',
    date: '2026-01-06',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-6',
    employee_id: 'emp-2',
    project_id: 'project-1',
    date: '2026-01-07',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-7',
    employee_id: 'emp-2',
    project_id: 'project-1',
    date: '2026-01-08',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-8',
    employee_id: 'emp-2',
    project_id: 'project-1',
    date: '2026-01-09',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  
  // Employee 3 allocations
  {
    id: 'alloc-9',
    employee_id: 'emp-3',
    project_id: 'project-1',
    date: '2026-01-10',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-10',
    employee_id: 'emp-3',
    project_id: 'project-1',
    date: '2026-01-13',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-11',
    employee_id: 'emp-3',
    project_id: 'project-1',
    date: '2026-01-14',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-12',
    employee_id: 'emp-3',
    project_id: 'project-1',
    date: '2026-01-15',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'alloc-13',
    employee_id: 'emp-3',
    project_id: 'project-1',
    date: '2026-01-16',
    effort: 1,
    source: 'gantt',
    created_at: '2024-01-01T00:00:00Z'
  }
];
