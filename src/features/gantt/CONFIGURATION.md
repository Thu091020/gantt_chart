/**
 * Gantt Feature Configuration Guide
 * 
 * This file explains how to configure and use the Gantt feature with mock or real data.
 */

// ==================== MODE SWITCHING ====================

/**
 * The Gantt feature supports two modes:
 * 
 * 1. MOCK mode - Uses local mock data for testing/development
 *    - No API calls required
 *    - Data stored in memory (lost on refresh)
 *    - Perfect for UI testing and demonstrations
 * 
 * 2. REAL mode - Uses actual Supabase API calls
 *    - Requires configured Supabase client
 *    - Data persisted in database
 *    - Production ready
 */

// ==================== CONFIGURATION ====================

/**
 * In your ProjectDetail.tsx (or wherever you initialize Gantt):
 * 
 * import {
 *   configureGantt,
 *   createDatabaseAdapter,
 *   uiAdapter,
 *   utilsAdapter,
 *   setGanttAdapterMode,
 * } from '@/features/gantt';
 * 
 * // Optional: Set mode BEFORE configuration
 * setGanttAdapterMode('mock'); // or 'real'
 * 
 * // Configure with proper adapters
 * configureGantt({
 *   database: createDatabaseAdapter(supabaseClient, projectId),
 *   ui: uiAdapter,
 *   utils: utilsAdapter,
 *   auth: {
 *     user: currentUser,
 *     isLoading: false,
 *   },
 * });
 */

// ==================== ENVIRONMENT VARIABLES ====================

/**
 * Set the default mode via environment variable:
 * 
 * In .env.local:
 * VITE_GANTT_MODE=mock    # or 'real'
 * 
 * The mode is read at startup from:
 * (import.meta.env.VITE_GANTT_MODE as GanttAdapterMode) || 'real'
 */

// ==================== SWITCHING MODES AT RUNTIME ====================

/**
 * In your browser console, you can switch modes:
 * 
 * // Get current mode
 * window.__getGanttMode__()
 * 
 * // Switch to mock mode
 * window.__setGanttMode__('mock')
 * 
 * // Switch to real mode
 * window.__setGanttMode__('real')
 * 
 * NOTE: Changes take effect on next Gantt operation
 */

// ==================== EXAMPLE: MOCK MODE SETUP ====================

/**
 * To use mock mode in development:
 * 
 * 1. Create .env.local in your project root:
 *    VITE_GANTT_MODE=mock
 * 
 * 2. Or set at runtime:
 *    import { setGanttAdapterMode } from '@/features/gantt';
 *    
 *    useEffect(() => {
 *      // Set mock mode for testing
 *      if (process.env.NODE_ENV === 'development') {
 *        setGanttAdapterMode('mock');
 *      }
 *    }, []);
 * 
 * 3. Configure Gantt normally:
 *    configureGantt({
 *      database: createDatabaseAdapter(supabaseClient, projectId),
 *      ui: uiAdapter,
 *      utils: utilsAdapter,
 *      auth: { user: currentUser, isLoading: false },
 *    });
 * 
 * The createDatabaseAdapter will return mock data automatically
 * based on the configured mode.
 */

// ==================== MOCK DATA ====================

/**
 * Mock data is defined in src/features/gantt/adapters/mockDatabase.ts
 * 
 * It includes:
 * - 2 sample tasks (root + subtask)
 * - Basic employees
 * - Task statuses (Not Started, In Progress, Completed)
 * - Task labels (Bug, Feature, Documentation)
 * - Project milestones
 * - Baselines
 * 
 * To modify mock data:
 * 1. Edit mockDatabase.ts
 * 2. Update the arrays at the top of the file
 * 3. Changes take effect immediately in mock mode
 */

// ==================== TESTING CHECKLIST ====================

/**
 * When testing Gantt feature with mock mode:
 * 
 * ✓ Can create tasks
 * ✓ Can edit tasks
 * ✓ Can delete tasks
 * ✓ Can drag tasks to reorder
 * ✓ Can drag task edges to resize
 * ✓ Can create allocations
 * ✓ Can save view settings
 * ✓ Can create/delete baselines
 * ✓ Can restore baselines
 * ✓ No console errors
 * ✓ Dialogs work properly
 * ✓ Toolbar buttons functional
 */

// ==================== DEBUGGING ====================

/**
 * Mock mode logs all operations to console:
 * 
 * Example output:
 * [Gantt] Using MOCK database adapter
 * Mock: Task created { id: "3", name: "New Task", ... }
 * Mock: Task updated { id: "2", name: "Updated Task", ... }
 * Mock: Task deleted 1
 * Mock: Tasks bulk updated
 * Mock: Allocations bulk set
 * Mock: View settings saved
 * 
 * Real mode shows:
 * [Gantt] Using REAL database adapter
 * [Gantt] Task created successfully
 * [Gantt] Task updated successfully
 */

export {};
