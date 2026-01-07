/**
 * Settings Mock Service
 * Returns fake data for development/testing with store persistence
 */

import type { ISettingsService } from '../interfaces/settings.interface';
import type { ViewSettings, Baseline, ProjectMilestone } from '../../types/gantt.types';
import { settingsStore } from './store/settingsStore';

const MOCK_DELAY = 300;

export class SettingsMockService implements ISettingsService {
  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  }

  // ==================== VIEW SETTINGS ====================
  
  async getViewSettings(): Promise<ViewSettings> {
    await this.delay();
    return { ...settingsStore.viewSettings };
  }

  async saveViewSettings(settings: ViewSettings): Promise<void> {
    await this.delay();
    settingsStore.setViewSettings(settings);
  }

  // ==================== BASELINES ====================
  
  async getBaselines(projectId: string): Promise<Baseline[]> {
    await this.delay();
    return settingsStore.baselines.filter(b => b.project_id === projectId);
  }

  async getBaselineById(baselineId: string): Promise<Baseline> {
    await this.delay();
    const baseline = settingsStore.baselines.find(b => b.id === baselineId);
    if (!baseline) throw new Error(`Baseline ${baselineId} not found`);
    return baseline;
  }

  async createBaseline(baseline: {
    projectId: string;
    name: string;
    description?: string;
    tasks: unknown[];
    allocations: unknown[];
  }): Promise<Baseline> {
    await this.delay();
    
    const newBaseline: Baseline = {
      id: `baseline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project_id: baseline.projectId,
      name: baseline.name,
      description: baseline.description || null,
      snapshot: {
        tasks: baseline.tasks as any[],
        allocations: baseline.allocations as any[]
      },
      created_at: new Date().toISOString(),
      created_by: null
    };

    settingsStore.addBaseline(newBaseline);
    return newBaseline;
  }

  async deleteBaseline(baselineId: string): Promise<void> {
    await this.delay();
    settingsStore.deleteBaseline(baselineId);
  }

  async restoreBaseline(baselineId: string, projectId: string): Promise<void> {
    await this.delay();
    const baseline = settingsStore.baselines.find(b => b.id === baselineId);
    if (!baseline) throw new Error(`Baseline ${baselineId} not found`);
    
    // In a real implementation, this would restore tasks and allocations
    // For mock, we just log it
    console.log(`[Mock] Restoring baseline ${baselineId} for project ${projectId}`);
  }

  // ==================== PROJECT MILESTONES ====================
  
  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    await this.delay();
    return settingsStore.milestones.filter(m => m.project_id === projectId);
  }

  async createProjectMilestone(milestone: Omit<ProjectMilestone, 'id' | 'created_at'>): Promise<ProjectMilestone> {
    await this.delay();
    
    const newMilestone: ProjectMilestone = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...milestone,
      created_at: new Date().toISOString()
    };

    settingsStore.addMilestone(newMilestone);
    return newMilestone;
  }

  async updateProjectMilestone(milestoneId: string, updates: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    await this.delay();
    
    settingsStore.updateMilestone(milestoneId, updates);
    const updated = settingsStore.milestones.find(m => m.id === milestoneId);
    if (!updated) throw new Error(`Milestone ${milestoneId} not found`);
    return updated;
  }

  async deleteProjectMilestone(milestoneId: string): Promise<void> {
    await this.delay();
    settingsStore.deleteMilestone(milestoneId);
  }
}

// Export singleton instance
export const settingsMockService = new SettingsMockService();

