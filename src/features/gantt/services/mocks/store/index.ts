/**
 * Mock Store Index
 * Centralized store management cho mock services
 * Export tất cả stores và utility functions
 */

export { taskStore } from './taskStore';
export { allocationStore } from './allocationStore';
export { settingsStore } from './settingsStore';

/**
 * Reset all stores về trạng thái ban đầu
 * Sử dụng khi cần reset toàn bộ mock data
 * 
 * @example
 * ```typescript
 * import { resetAllStores } from './mocks/store';
 * resetAllStores();
 * ```
 */
export function resetAllStores() {
  const { taskStore } = require('./taskStore');
  const { allocationStore } = require('./allocationStore');
  const { settingsStore } = require('./settingsStore');
  
  taskStore.reset();
  allocationStore.reset();
  settingsStore.reset();
  
  console.log('[Mock Store] All stores reset to initial state');
}

/**
 * Get tất cả store states (dùng cho debugging)
 * Trả về snapshot của tất cả stores hiện tại
 * 
 * @returns Object chứa state của tất cả stores
 * 
 * @example
 * ```typescript
 * import { getAllStoreStates } from './mocks/store';
 * const states = getAllStoreStates();
 * console.log('Tasks:', states.tasks.tasks);
 * console.log('Allocations:', states.allocations.allocations);
 * ```
 */
export function getAllStoreStates() {
  const { taskStore } = require('./taskStore');
  const { allocationStore } = require('./allocationStore');
  const { settingsStore } = require('./settingsStore');
  
  return {
    tasks: taskStore.getState(),
    allocations: allocationStore.getState(),
    settings: settingsStore.getState()
  };
}

/**
 * Subscribe to changes in all stores
 * Gọi callback khi bất kỳ store nào thay đổi
 * 
 * @param listener Callback function
 * @returns Unsubscribe function
 * 
 * @example
 * ```typescript
 * import { subscribeToAllStores } from './mocks/store';
 * const unsubscribe = subscribeToAllStores(() => {
 *   console.log('Store changed!');
 * });
 * // Later...
 * unsubscribe();
 * ```
 */
export function subscribeToAllStores(listener: () => void) {
  const { taskStore } = require('./taskStore');
  const { allocationStore } = require('./allocationStore');
  const { settingsStore } = require('./settingsStore');
  
  const unsubscribeTask = taskStore.subscribe(listener);
  const unsubscribeAllocation = allocationStore.subscribe(listener);
  const unsubscribeSettings = settingsStore.subscribe(listener);
  
  return () => {
    unsubscribeTask();
    unsubscribeAllocation();
    unsubscribeSettings();
  };
}

