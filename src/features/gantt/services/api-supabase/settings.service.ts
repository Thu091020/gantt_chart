  /**
   * Settings Service - Supabase Implementation
   * Handles view settings, baselines, and milestones
   */

  import type { SupabaseClient } from '@supabase/supabase-js';
  import type { ISettingsService } from '../interfaces/settings.interface';
  import type { ViewSettings, Baseline, ProjectMilestone } from '../../types/gantt.types';

  const SETTINGS_KEY = 'gantt_view';

  export class SettingsService implements ISettingsService {
    constructor(private supabase: SupabaseClient) {}

    // ==================== VIEW SETTINGS ====================
    
    async getViewSettings(): Promise<ViewSettings> {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await this.supabase
        .from('view_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (error) throw error;
      
      return (data?.value as ViewSettings) || {};
    }

    async saveViewSettings(settings: ViewSettings): Promise<void> {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await this.supabase
        .from('view_settings')
        .upsert(
          { 
            user_id: user.id,
            key: SETTINGS_KEY, 
            value: settings as never,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,key' }
        );
      
      if (error) throw error;
    }

    // ==================== BASELINES ====================
    
    async getBaselines(projectId: string): Promise<Baseline[]> {
      const { data, error } = await this.supabase
        .from('baselines')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Baseline[];
    }

    async getBaselineById(baselineId: string): Promise<Baseline> {
      const { data, error } = await this.supabase
        .from('baselines')
        .select('*')
        .eq('id', baselineId)
        .single();
      
      if (error) throw error;
      return data as Baseline;
    }

    async createBaseline(baseline: {
      projectId: string;
      name: string;
      description?: string;
      tasks: unknown[];
      allocations: unknown[];
    }): Promise<Baseline> {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      const { data, error } = await this.supabase
        .from('baselines')
        .insert({
          project_id: baseline.projectId,
          name: baseline.name,
          description: baseline.description || null,
          snapshot: { 
            tasks: baseline.tasks, 
            allocations: baseline.allocations 
          } as never, // Cast to never to satisfy Json type
          created_by: user?.id || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Baseline;
    }

    async deleteBaseline(baselineId: string): Promise<void> {
      const { error } = await this.supabase
        .from('baselines')
        .delete()
        .eq('id', baselineId);
      
      if (error) throw error;
    }

    async restoreBaseline(baselineId: string, projectId: string): Promise<void> {
      // Get baseline snapshot
      const baseline = await this.getBaselineById(baselineId);
      
      if (!baseline.snapshot) {
        throw new Error('Baseline snapshot not found');
      }

      const { tasks, allocations } = baseline.snapshot;

      // Delete current tasks and allocations
      await this.supabase.from('tasks').delete().eq('project_id', projectId);
      await this.supabase.from('allocations').delete().eq('project_id', projectId);

      // Restore tasks
      if (tasks && tasks.length > 0) {
        const { error: tasksError } = await this.supabase
          .from('tasks')
          .insert(tasks as never); // Cast to never to bypass type checking for snapshot data
        
        if (tasksError) throw tasksError;
      }

      // Restore allocations
      if (allocations && allocations.length > 0) {
        const { error: allocError } = await this.supabase
          .from('allocations')
          .insert(allocations as never); // Cast to never to bypass type checking for snapshot data
        
        if (allocError) throw allocError;
      }
    }

    // ==================== PROJECT MILESTONES ====================
    
    async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
      const { data, error } = await this.supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as ProjectMilestone[];
    }

    async createProjectMilestone(milestone: Omit<ProjectMilestone, 'id' | 'created_at'>): Promise<ProjectMilestone> {
      const { data, error } = await this.supabase
        .from('project_milestones')
        .insert(milestone)
        .select()
        .single();
      
      if (error) throw error;
      return data as ProjectMilestone;
    }

    async updateProjectMilestone(milestoneId: string, updates: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
      const { data, error } = await this.supabase
        .from('project_milestones')
        .update(updates)
        .eq('id', milestoneId)
        .select()
        .single();
      
      if (error) throw error;
      return data as ProjectMilestone;
    }

    async deleteProjectMilestone(milestoneId: string): Promise<void> {
      const { error } = await this.supabase
        .from('project_milestones')
        .delete()
        .eq('id', milestoneId);
      
      if (error) throw error;
    }
  }

  // Factory function to create SettingsService with supabase client
  export function createSettingsService(supabase: SupabaseClient): ISettingsService {
    return new SettingsService(supabase);
  }
