/**
 * Allocation Mock Store
 * Manages allocation state for mock services
 */

import type { Allocation } from '../../../types/allocation.types';
import { mockAllocations } from '../data/mock-allocations';

interface AllocationStoreState {
  allocations: Allocation[];
  
  setAllocations: (allocations: Allocation[]) => void;
  addAllocation: (allocation: Allocation) => void;
  updateAllocation: (allocationId: string, updates: Partial<Allocation>) => void;
  deleteAllocation: (allocationId: string) => void;
  bulkSetAllocations: (allocations: Allocation[]) => void;
  upsertAllocation: (allocation: Allocation) => void;
  
  reset: () => void;
  getState: () => AllocationStoreState;
  subscribe: (listener: () => void) => () => void;
}

class AllocationStore implements AllocationStoreState {
  allocations: Allocation[] = [...mockAllocations];

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

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  setAllocations = (allocations: Allocation[]) => {
    this.allocations = [...allocations];
    this.notify();
  };

  addAllocation = (allocation: Allocation) => {
    this.allocations.push(allocation);
    this.notify();
  };

  updateAllocation = (allocationId: string, updates: Partial<Allocation>) => {
    const index = this.allocations.findIndex(a => a.id === allocationId);
    if (index === -1) {
      throw new Error(`Allocation ${allocationId} not found`);
    }
    this.allocations[index] = {
      ...this.allocations[index],
      ...updates
    };
    this.notify();
  };

  deleteAllocation = (allocationId: string) => {
    this.allocations = this.allocations.filter(a => a.id !== allocationId);
    this.notify();
  };

  bulkSetAllocations = (allocations: Allocation[]) => {
    // Remove existing allocations that match the new ones
    allocations.forEach(newAlloc => {
      const existingIndex = this.allocations.findIndex(
        a => a.employee_id === newAlloc.employee_id &&
             a.project_id === newAlloc.project_id &&
             a.date === newAlloc.date
      );

      if (existingIndex >= 0) {
        this.allocations[existingIndex] = newAlloc;
      } else {
        this.allocations.push(newAlloc);
      }
    });
    this.notify();
  };

  upsertAllocation = (allocation: Allocation) => {
    const existingIndex = this.allocations.findIndex(
      a => a.employee_id === allocation.employee_id &&
           a.project_id === allocation.project_id &&
           a.date === allocation.date
    );

    if (existingIndex >= 0) {
      this.allocations[existingIndex] = allocation;
    } else {
      this.allocations.push(allocation);
    }
    this.notify();
  };

  reset = () => {
    this.allocations = [...mockAllocations];
    this.notify();
  };

  getState = (): AllocationStoreState => ({
    allocations: this.allocations,
    setAllocations: this.setAllocations,
    addAllocation: this.addAllocation,
    updateAllocation: this.updateAllocation,
    deleteAllocation: this.deleteAllocation,
    bulkSetAllocations: this.bulkSetAllocations,
    upsertAllocation: this.upsertAllocation,
    reset: this.reset,
    getState: this.getState,
    subscribe: this.subscribe
  });
}

// Export singleton instance
export const allocationStore = new AllocationStore();

