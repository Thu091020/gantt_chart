// Queries - Data fetching
export { 
  useGetTasks,
  useGetTask,
  useGetTaskLabels,
  useGetTaskStatuses,
} from './queries/useTaskQueries';

export { 
  useGetAllocations,
} from './queries/useAllocationQueries';

export { 
  useGetViewSettings,
  useGetBaselines,
  useGetBaseline,
  useGetProjectMilestones,
} from './queries/useSettingQueries';

// Mutations - Data updates
export { 
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useCreateTaskLabel,
  useUpdateTaskLabel,
  useDeleteTaskLabel,
  useCreateTaskStatus,
  useUpdateTaskStatus,
  useDeleteTaskStatus,
} from './mutations/useTaskMutations';

export { 
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
  useSetAllocation,
  useBulkSetAllocations,
  useUpsertAllocation,
} from './mutations/useAllocationMutations';
