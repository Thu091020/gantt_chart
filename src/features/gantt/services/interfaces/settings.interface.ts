/**
 * Settings Service Interface - Contract for view settings operations
 */

import type { ViewSettings, Baseline, ProjectMilestone } from '../../types/gantt.types';

export interface ISettingsService {
  // View Settings
  getViewSettings(): Promise<ViewSettings>;
  saveViewSettings(settings: ViewSettings): Promise<void>;
  
  // Baselines
  getBaselines(projectId: string): Promise<Baseline[]>;
  getBaselineById(baselineId: string): Promise<Baseline>;
  createBaseline(baseline: {
    projectId: string;
    name: string;
    description?: string;
    tasks: unknown[];
    allocations: unknown[];
  }): Promise<Baseline>;
  deleteBaseline(baselineId: string): Promise<void>;
  restoreBaseline(baselineId: string, projectId: string): Promise<void>;
  
  // Project Milestones
  getProjectMilestones(projectId: string): Promise<ProjectMilestone[]>;
  createProjectMilestone(milestone: Omit<ProjectMilestone, 'id' | 'created_at'>): Promise<ProjectMilestone>;
  updateProjectMilestone(milestoneId: string, updates: Partial<ProjectMilestone>): Promise<ProjectMilestone>;
  deleteProjectMilestone(milestoneId: string): Promise<void>;
}
