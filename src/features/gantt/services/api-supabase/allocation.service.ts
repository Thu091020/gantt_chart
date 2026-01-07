/**
 * Allocation Service - Supabase Implementation
 * Handles all allocation-related database operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAllocationService } from '../interfaces/allocation.interface';
import type { 
  Allocation, 
  AllocationQueryParams,
  CreateAllocationInput,
  UpdateAllocationInput,
  BulkAllocationInput
} from '../../types/allocation.types';

export class AllocationService implements IAllocationService {
  constructor(private supabase: SupabaseClient) {}
  private readonly PAGE_SIZE = 1000;

  async getAllocations(params?: AllocationQueryParams): Promise<Allocation[]> {
    const { projectId, employeeId, startDate, endDate } = params || {};
    
    let allData: Allocation[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = this.supabase
        .from('allocations')
        .select('*');
      
      // Apply filters
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      // Pagination
      query = query
        .order('date', { ascending: true })
        .range(from, from + this.PAGE_SIZE - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        allData = [...allData, ...(data as Allocation[])];
        from += this.PAGE_SIZE;
        hasMore = data.length === this.PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return allData;
  }

  async getAllocationById(allocationId: string): Promise<Allocation> {
    const { data, error } = await this.supabase
      .from('allocations')
      .select('*')
      .eq('id', allocationId)
      .single();
    
    if (error) throw error;
    return data as Allocation;
  }

  async createAllocation(input: CreateAllocationInput): Promise<Allocation> {
    const { data, error } = await this.supabase
      .from('allocations')
      .insert({
        ...input,
        source: input.source || 'manual'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Allocation;
  }

  async updateAllocation(allocationId: string, updates: UpdateAllocationInput): Promise<Allocation> {
    const { data, error } = await this.supabase
      .from('allocations')
      .update(updates)
      .eq('id', allocationId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Allocation;
  }

  async deleteAllocation(allocationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('allocations')
      .delete()
      .eq('id', allocationId);
    
    if (error) throw error;
  }

  async bulkSetAllocations(allocations: BulkAllocationInput[]): Promise<Allocation[]> {
    const results: Allocation[] = [];
    
    for (const allocation of allocations) {
      const { employeeId, projectId, date, effort, source = 'manual' } = allocation;
      
      if (effort === 0) {
        // Delete allocation if effort is 0
        const { error } = await this.supabase
          .from('allocations')
          .delete()
          .eq('employee_id', employeeId)
          .eq('project_id', projectId)
          .eq('date', date);
        
        if (error) throw error;
      } else {
        // Upsert allocation
        const { data, error } = await this.supabase
          .from('allocations')
          .upsert(
            {
              employee_id: employeeId,
              project_id: projectId,
              date,
              effort,
              source
            },
            { onConflict: 'employee_id,project_id,date' }
          )
          .select()
          .single();
        
        if (error) throw error;
        if (data) results.push(data as Allocation);
      }
    }
    
    return results;
  }

  async upsertAllocation(input: CreateAllocationInput): Promise<Allocation> {
    const { data, error } = await this.supabase
      .from('allocations')
      .upsert(
        {
          ...input,
          source: input.source || 'manual'
        },
        { onConflict: 'employee_id,project_id,date' }
      )
      .select()
      .single();
    
    if (error) throw error;
    return data as Allocation;
  }
}

// Factory function to create AllocationService with supabase client
export function createAllocationService(supabase: SupabaseClient): IAllocationService {
  return new AllocationService(supabase);
}
