/**
 * Allocation Service Interface - Contract for all allocation operations
 */

import type { 
  Allocation, 
  AllocationQueryParams,
  CreateAllocationInput,
  UpdateAllocationInput,
  BulkAllocationInput
} from '../../types/allocation.types';

export interface IAllocationService {
  // Query allocations
  getAllocations(params?: AllocationQueryParams): Promise<Allocation[]>;
  getAllocationById(allocationId: string): Promise<Allocation>;
  
  // Create allocation
  createAllocation(input: CreateAllocationInput): Promise<Allocation>;
  
  // Update allocation
  updateAllocation(allocationId: string, updates: UpdateAllocationInput): Promise<Allocation>;
  
  // Delete allocation
  deleteAllocation(allocationId: string): Promise<void>;
  
  // Bulk operations
  bulkSetAllocations(allocations: BulkAllocationInput[]): Promise<Allocation[]>;
  
  // Upsert operation (create or update)
  upsertAllocation(input: CreateAllocationInput): Promise<Allocation>;
}
