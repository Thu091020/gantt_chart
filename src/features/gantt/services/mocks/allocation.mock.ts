/**
 * Allocation Mock Service
 * Returns fake data for development/testing with store persistence
 */

import type { IAllocationService } from '../interfaces/allocation.interface';
import type { 
  Allocation, 
  AllocationQueryParams,
  CreateAllocationInput,
  UpdateAllocationInput,
  BulkAllocationInput
} from '../../types/allocation.types';
import { allocationStore } from './store/allocationStore';

const MOCK_DELAY = 300;

export class AllocationMockService implements IAllocationService {
  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  }

  async getAllocations(params?: AllocationQueryParams): Promise<Allocation[]> {
    await this.delay();
    
    let result = [...allocationStore.allocations];

    if (params?.projectId) {
      result = result.filter(a => a.project_id === params.projectId);
    }
    if (params?.employeeId) {
      result = result.filter(a => a.employee_id === params.employeeId);
    }
    if (params?.startDate) {
      result = result.filter(a => a.date >= params.startDate!);
    }
    if (params?.endDate) {
      result = result.filter(a => a.date <= params.endDate!);
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAllocationById(allocationId: string): Promise<Allocation> {
    await this.delay();
    
    const allocation = allocationStore.allocations.find(a => a.id === allocationId);
    if (!allocation) throw new Error(`Allocation ${allocationId} not found`);
    return allocation;
  }

  async createAllocation(input: CreateAllocationInput): Promise<Allocation> {
    await this.delay();
    
    const newAllocation: Allocation = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      employee_id: input.employee_id,
      project_id: input.project_id,
      date: input.date,
      effort: input.effort,
      source: input.source || 'manual',
      created_at: new Date().toISOString()
    };

    allocationStore.addAllocation(newAllocation);
    return newAllocation;
  }

  async updateAllocation(allocationId: string, updates: UpdateAllocationInput): Promise<Allocation> {
    await this.delay();
    
    allocationStore.updateAllocation(allocationId, updates);
    const updated = allocationStore.allocations.find(a => a.id === allocationId);
    if (!updated) throw new Error(`Allocation ${allocationId} not found`);
    return updated;
  }

  async deleteAllocation(allocationId: string): Promise<void> {
    await this.delay();
    allocationStore.deleteAllocation(allocationId);
  }

  async bulkSetAllocations(allocations: BulkAllocationInput[]): Promise<Allocation[]> {
    await this.delay();
    
    const results: Allocation[] = [];

    for (const allocation of allocations) {
      const { employeeId, projectId, date, effort, source = 'manual' } = allocation;
      
      if (effort === 0) {
        // Delete if exists
        const existing = allocationStore.allocations.find(
          a => a.employee_id === employeeId && a.project_id === projectId && a.date === date
        );
        if (existing) {
          allocationStore.deleteAllocation(existing.id);
        }
      } else {
        // Upsert
        const existing = allocationStore.allocations.find(
          a => a.employee_id === employeeId && a.project_id === projectId && a.date === date
        );

        if (existing) {
          allocationStore.updateAllocation(existing.id, { effort, source });
          results.push(allocationStore.allocations.find(a => a.id === existing.id)!);
        } else {
          const newAlloc: Allocation = {
            id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employee_id: employeeId,
            project_id: projectId,
            date,
            effort,
            source,
            created_at: new Date().toISOString()
          };
          allocationStore.addAllocation(newAlloc);
          results.push(newAlloc);
        }
      }
    }

    return results;
  }

  async upsertAllocation(input: CreateAllocationInput): Promise<Allocation> {
    await this.delay();
    
    const existing = allocationStore.allocations.find(
      a => a.employee_id === input.employee_id && 
           a.project_id === input.project_id && 
           a.date === input.date
    );

    if (existing) {
      allocationStore.updateAllocation(existing.id, {
        effort: input.effort,
        source: input.source || 'manual'
      });
      return allocationStore.allocations.find(a => a.id === existing.id)!;
    } else {
      return this.createAllocation(input);
    }
  }
}

// Export singleton instance
export const allocationMockService = new AllocationMockService();
