/**
 * Real Database Adapter
 * Uses actual application hooks from @/hooks to fetch real data from Supabase
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export function createRealDatabaseAdapter(
  supabaseClient: SupabaseClient,
  projectId: string
): Record<string, any> {
  return {
    supabaseClient,

    // ==================== Tasks ====================
    getTasks: async () => {
      const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },

    addTask: async (taskData: any) => {
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateTask: async (taskId: string, _projectId: string, data: any) => {
      const { data: result, error } = await supabaseClient
        .from('tasks')
        .update(data)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },

    deleteTask: async (taskId: string, _projectId: string) => {
      const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },

    bulkUpdateTasks: async (_projectId: string, updates: any[]) => {
      for (const update of updates) {
        const { error } = await supabaseClient
          .from('tasks')
          .update(update.data)
          .eq('id', update.id);
        if (error) throw error;
      }
    },

    // ==================== Allocations ====================
    getAllocations: async () => {
      const { data, error } = await supabaseClient
        .from('allocations')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },

    bulkSetAllocations: async (_projectId: string, allocations: any[]) => {
      // Delete existing allocations
      await supabaseClient.from('allocations').delete().eq('project_id', projectId);

      // Insert new allocations
      if (allocations.length > 0) {
        const { error } = await supabaseClient
          .from('allocations')
          .insert(allocations.map((a) => ({ ...a, project_id: projectId })));

        if (error) throw error;
      }
    },

    // ==================== Employees ====================
    getEmployees: async () => {
      const { data, error } = await supabaseClient.from('employees').select('*');
      if (error) throw error;
      return data || [];
    },

    // ==================== Task Statuses ====================
    getTaskStatuses: async () => {
      const { data, error } = await supabaseClient
        .from('task_statuses')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },

    addTaskStatus: async (status: any) => {
      const { data, error } = await supabaseClient
        .from('task_statuses')
        .insert([{ ...status, project_id: projectId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateTaskStatus: async (id: string, updates: any) => {
      const { data, error } = await supabaseClient
        .from('task_statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    deleteTaskStatus: async (id: string) => {
      const { error } = await supabaseClient.from('task_statuses').delete().eq('id', id);
      if (error) throw error;
    },

    // ==================== Task Labels ====================
    getTaskLabels: async () => {
      const { data, error } = await supabaseClient
        .from('task_labels')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },

    addTaskLabel: async (label: any) => {
      const { data, error } = await supabaseClient
        .from('task_labels')
        .insert([{ ...label, project_id: projectId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateTaskLabel: async (id: string, updates: any) => {
      const { data, error } = await supabaseClient
        .from('task_labels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    deleteTaskLabel: async (id: string) => {
      const { error } = await supabaseClient.from('task_labels').delete().eq('id', id);
      if (error) throw error;
    },

    // ==================== Project Milestones ====================
    getProjectMilestones: async () => {
      const { data, error } = await supabaseClient
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },

    addProjectMilestone: async (milestone: any) => {
      const { data, error } = await supabaseClient
        .from('project_milestones')
        .insert([{ ...milestone, project_id: projectId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateProjectMilestone: async (id: string, updates: any) => {
      const { data, error } = await supabaseClient
        .from('project_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    deleteProjectMilestone: async (id: string) => {
      const { error } = await supabaseClient
        .from('project_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    // ==================== Baselines ====================
    getBaselines: async () => {
      const { data, error } = await supabaseClient
        .from('baselines')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },

    addBaseline: async (baseline: any) => {
      const { data, error } = await supabaseClient
        .from('baselines')
        .insert([{ ...baseline, project_id: projectId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    deleteBaseline: async (id: string) => {
      const { error } = await supabaseClient.from('baselines').delete().eq('id', id);
      if (error) throw error;
    },

    restoreBaseline: async (id: string) => {
      // Implementation depends on your baseline structure
      console.log('Restoring baseline:', id);
    },

    // ==================== View Settings ====================
    saveViewSettings: async (settings: any) => {
      const { data, error } = await supabaseClient
        .from('view_settings')
        .upsert([{ ...settings, project_id: projectId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // ==================== Project ====================
    updateProject: async (projectId: string, updates: any) => {
      const { data, error } = await supabaseClient
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  };
}
