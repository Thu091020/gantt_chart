/**
 * Settings Mock Store
 * Quản lý view settings, baselines, và milestones state cho mock services
 * Hỗ trợ CRUD operations và subscription pattern
 */

import type { ViewSettings, Baseline, ProjectMilestone } from '../../../types/gantt.types';

interface SettingsStoreState {
  // Data
  viewSettings: ViewSettings;
  baselines: Baseline[];
  milestones: ProjectMilestone[];
  
  // View Settings Actions
  setViewSettings: (settings: ViewSettings) => void;
  updateViewSettings: (updates: Partial<ViewSettings>) => void;
  
  // Baseline Actions
  setBaselines: (baselines: Baseline[]) => void;
  addBaseline: (baseline: Baseline) => void;
  updateBaseline: (baselineId: string, updates: Partial<Baseline>) => void;
  deleteBaseline: (baselineId: string) => void;
  
  // Milestone Actions
  setMilestones: (milestones: ProjectMilestone[]) => void;
  addMilestone: (milestone: ProjectMilestone) => void;
  updateMilestone: (milestoneId: string, updates: Partial<ProjectMilestone>) => void;
  deleteMilestone: (milestoneId: string) => void;
  
  // Utility
  reset: () => void;
  getState: () => SettingsStoreState;
  subscribe: (listener: () => void) => () => void;
}

class SettingsStore implements SettingsStoreState {
  viewSettings: ViewSettings = {};
  baselines: Baseline[] = [];
  milestones: ProjectMilestone[] = [];

  // Listeners for state changes
  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to store changes
   * @param listener Callback function to call when store changes
   * @returns Unsubscribe function
   */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Notify all listeners of state changes
   */
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // ==================== VIEW SETTINGS ACTIONS ====================
  
  /**
   * Set view settings (replace entire object)
   */
  setViewSettings = (settings: ViewSettings) => {
    this.viewSettings = { ...settings };
    this.notify();
  };

  /**
   * Update view settings (merge with existing)
   */
  updateViewSettings = (updates: Partial<ViewSettings>) => {
    this.viewSettings = {
      ...this.viewSettings,
      ...updates
    };
    this.notify();
  };

  // ==================== BASELINE ACTIONS ====================
  
  /**
   * Set all baselines (replace entire array)
   */
  setBaselines = (baselines: Baseline[]) => {
    this.baselines = [...baselines];
    this.notify();
  };

  /**
   * Add a new baseline
   */
  addBaseline = (baseline: Baseline) => {
    this.baselines.push(baseline);
    this.notify();
  };

  /**
   * Update an existing baseline
   */
  updateBaseline = (baselineId: string, updates: Partial<Baseline>) => {
    const index = this.baselines.findIndex(b => b.id === baselineId);
    if (index === -1) {
      throw new Error(`Baseline ${baselineId} not found`);
    }
    this.baselines[index] = {
      ...this.baselines[index],
      ...updates
    };
    this.notify();
  };

  /**
   * Delete a baseline
   */
  deleteBaseline = (baselineId: string) => {
    this.baselines = this.baselines.filter(b => b.id !== baselineId);
    this.notify();
  };

  // ==================== MILESTONE ACTIONS ====================
  
  /**
   * Set all milestones (replace entire array)
   */
  setMilestones = (milestones: ProjectMilestone[]) => {
    this.milestones = [...milestones];
    this.notify();
  };

  /**
   * Add a new milestone
   */
  addMilestone = (milestone: ProjectMilestone) => {
    this.milestones.push(milestone);
    this.notify();
  };

  /**
   * Update an existing milestone
   */
  updateMilestone = (milestoneId: string, updates: Partial<ProjectMilestone>) => {
    const index = this.milestones.findIndex(m => m.id === milestoneId);
    if (index === -1) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }
    this.milestones[index] = {
      ...this.milestones[index],
      ...updates
    };
    this.notify();
  };

  /**
   * Delete a milestone
   */
  deleteMilestone = (milestoneId: string) => {
    this.milestones = this.milestones.filter(m => m.id !== milestoneId);
    this.notify();
  };

  // ==================== UTILITY ====================
  
  /**
   * Reset store to initial state
   */
  reset = () => {
    this.viewSettings = {};
    this.baselines = [];
    this.milestones = [];
    this.notify();
  };

  /**
   * Get current store state
   */
  getState = (): SettingsStoreState => ({
    viewSettings: this.viewSettings,
    baselines: this.baselines,
    milestones: this.milestones,
    setViewSettings: this.setViewSettings,
    updateViewSettings: this.updateViewSettings,
    setBaselines: this.setBaselines,
    addBaseline: this.addBaseline,
    updateBaseline: this.updateBaseline,
    deleteBaseline: this.deleteBaseline,
    setMilestones: this.setMilestones,
    addMilestone: this.addMilestone,
    updateMilestone: this.updateMilestone,
    deleteMilestone: this.deleteMilestone,
    reset: this.reset,
    getState: this.getState,
    subscribe: this.subscribe
  });
}

// Export singleton instance
export const settingsStore = new SettingsStore();

