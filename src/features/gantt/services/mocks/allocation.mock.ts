/**
 * Allocation Mock Service
 * Returns fake data for development/testing
 */

import type { IAllocationService } from '../interfaces/allocation.interface';
import type { 
  Allocation, 
  AllocationQueryParams,
  CreateAllocationInput,
  UpdateAllocationInput,
  BulkAllocationInput
} from '../../types/allocation.types';
import { mockAllocations } from './data/mock-allocations';

const MOCK_DELAY = 300;

export class AllocationMockService implements IAllocationService {
  private allocations: Allocation[] = [...mockAllocations];

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  }

  async getAllocations(params?: AllocationQueryParams): Promise<Allocation[]> {
    await this.delay();
    
    let result = [...this.allocations];

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
    
    const allocation = this.allocations.find(a => a.id === allocationId);
    if (!allocation) throw new Error(`Allocation ${allocationId} not found`);
    return allocation;
  }

  async createAllocation(input: CreateAllocationInput): Promise<Allocation> {
    await this.delay();
    
    const newAllocation: Allocation = {
      id: `alloc-${Date.now()}`,
      employee_id: input.employee_id,
      project_id: input.project_id,
      date: input.date,
      effort: input.effort,
      source: input.source || 'manual',
      created_at: new Date().toISOString()
    };

    this.allocations.push(newAllocation);
    return newAllocation;
  }

  async updateAllocation(allocationId: string, updates: UpdateAllocationInput): Promise<Allocation> {
    await this.delay();
    
    const index = this.allocations.findIndex(a => a.id === allocationId);
    if (index === -1) throw new Error(`Allocation ${allocationId} not found`);

    this.allocations[index] = {
      ...this.allocations[index],
      ...updates
    };

    return this.allocations[index];
  }

  async deleteAllocation(allocationId: string): Promise<void> {
    await this.delay();
    
    this.allocations = this.allocations.filter(a => a.id !== allocationId);
  }

  async bulkSetAllocations(allocations: BulkAllocationInput[]): Promise<Allocation[]> {
    await this.delay();
    
    const results: Allocation[] = [];

    for (const allocation of allocations) {
      const { employeeId, projectId, date, effort, source = 'manual' } = allocation;
      
      if (effort === 0) {
        // Delete if exists
        this.allocations = this.allocations.filter(
          a => !(a.employee_id === employeeId && a.project_id === projectId && a.date === date)
        );
      } else {
        // Upsert
        const existingIndex = this.allocations.findIndex(
          a => a.employee_id === employeeId && a.project_id === projectId && a.date === date
        );

        if (existingIndex >= 0) {
          this.allocations[existingIndex] = {
            ...this.allocations[existingIndex],
            effort,
            source
          };
          results.push(this.allocations[existingIndex]);
        } else {
          const newAlloc: Allocation = {
            id: `alloc-${Date.now()}-${Math.random()}`,
            employee_id: employeeId,
            project_id: projectId,
            date,
            effort,
            source,
            created_at: new Date().toISOString()
          };
          this.allocations.push(newAlloc);
          results.push(newAlloc);
        }
      }
    }

    return results;
  }

  async upsertAllocation(input: CreateAllocationInput): Promise<Allocation> {
    await this.delay();
    
    const existingIndex = this.allocations.findIndex(
      a => a.employee_id === input.employee_id && 
           a.project_id === input.project_id && 
           a.date === input.date
    );

    if (existingIndex >= 0) {
      this.allocations[existingIndex] = {
        ...this.allocations[existingIndex],
        effort: input.effort,
        source: input.source || 'manual'
      };
      return this.allocations[existingIndex];
    } else {
      return this.createAllocation(input);
    }
  }
}

// Export singleton instance
export const allocationMockService = new AllocationMockService();
