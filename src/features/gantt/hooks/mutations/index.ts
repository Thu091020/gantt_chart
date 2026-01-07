/**
 * Mutation Hooks
 * 
 * Custom hooks for data mutations (create, update, delete operations)
 */

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
} from './useTaskMutations';

export { 
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
  useSetAllocation,
  useBulkSetAllocations,
  useUpsertAllocation,
} from './useAllocationMutations';
