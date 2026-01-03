/**
 * Example: Basic Gantt Integration Test
 *
 * This file demonstrates how to use the gantt feature in a new project
 * by providing all required adapters and configurations.
 */

// ============= SETUP (In your App.tsx) =============

import React, { useEffect } from 'react';
import { configureGantt } from '@/features/gantt';

// 1. Import UI Components from your project
import {
  Button,
  Input,
  Label,
  Checkbox,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Calendar,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Textarea,
  ScrollArea,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui';

// 2. Import utilities
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// 3. Import Supabase client
import { supabase } from '@/integrations/supabase';

// 4. Import auth hook
import { useAuth } from '@/hooks/useAuth';

/**
 * Initialize Gantt Feature
 * Call this ONCE when app starts
 */
export function initializeGantt() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    configureGantt({
      // === REQUIRED: UI Components ===
      uiComponents: {
        // Basic UI
        Button,
        Input,
        Label,
        Checkbox,
        Separator,
        // Dialogs
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
        DialogTrigger,
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
        AlertDialogTrigger,
        // Popover
        Popover,
        PopoverContent,
        PopoverTrigger,
        // Select
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
        // Other
        Calendar,
        Tooltip,
        TooltipContent,
        TooltipProvider,
        TooltipTrigger,
        Textarea,
        ScrollArea,
        ResizablePanelGroup,
        ResizablePanel,
        ResizableHandle,
      },

      // === REQUIRED: Utilities ===
      utilities: {
        cn,
        toast: {
          success: (msg: string) => toast.success(msg),
          error: (msg: string) => toast.error(msg),
          info: (msg: string) => toast.info(msg),
          warning: (msg: string) => toast.warning(msg),
          (msg: string) => toast(msg),
        },
      },

      // === REQUIRED: Database ===
      database: {
        supabaseClient: supabase,
      },

      // === OPTIONAL: Auth ===
      auth: {
        user: user
          ? {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name,
            }
          : null,
        isLoading,
      },
    });

    console.log('✅ Gantt feature configured successfully');
  }, [user, isLoading]);
}

// ============= USAGE =============

import { GanttViewWrapper, isGanttConfigured } from '@/features/gantt';

export default function ProjectPage() {
  const projectId = 'project-123';

  // Verify configuration before rendering
  if (!isGanttConfigured()) {
    return <div>Error: Gantt feature not configured</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">My Project</h1>
        <p className="text-muted-foreground">Gantt chart view</p>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1">
        <GanttViewWrapper projectId={projectId} />
      </div>
    </div>
  );
}

// ============= DETAILED SETUP EXAMPLE =============

/**
 * Advanced setup with custom configuration
 */
export function setupGanttWithCustomConfig() {
  const { user } = useAuth();
  const { data: employees } = useEmployees(); // Custom hook
  const { data: settings } = useSettings(); // Custom hook

  // Custom adapter implementations
  const customEmployeesAdapter = {
    employees: employees || [],
    isLoading: false,
    error: null,
  };

  const customSettingsAdapter = {
    viewSettings: {
      project_id: 'project-123',
      user_id: user?.id || '',
      settings: {
        task_bar_labels: {
          show_task_name: true,
          show_assignees: true,
          show_progress: true,
          show_dates: true,
        },
      },
    },
    isLoading: false,
    saveViewSettings: async (newSettings) => {
      // Save to your backend
      console.log('Saving view settings:', newSettings);
    },
  };

  configureGantt({
    // ... (all required configs above)
    uiComponents: { /* ... */ },
    utilities: { /* ... */ },
    database: { /* ... */ },
    auth: { /* ... */ },

    // Optional: Custom data adapters
    employees: customEmployeesAdapter,
    viewSettings: customSettingsAdapter,
  });
}

// ============= ERROR HANDLING =============

export function handleGanttErrors() {
  try {
    // Try to use gantt feature
    const config = getGanttConfig();
    console.log('Gantt is configured:', config);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not configured')) {
      console.error('❌ Gantt feature not configured!');
      console.error('Call initializeGantt() in your App component first');

      // Show user-friendly error
      toast.error('Gantt feature failed to initialize. Please refresh the page.');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// ============= TEST CHECKLIST =============

/**
 * Verify gantt feature works correctly
 */
export async function testGanttIntegration() {
  const tests = {
    isConfigured: false,
    hasUIComponents: false,
    hasUtilities: false,
    hasDatabase: false,
    hasAuth: false,
  };

  try {
    const config = getGanttConfig();

    // Check configuration
    tests.isConfigured = config !== null;
    tests.hasUIComponents = config.ui !== undefined && config.ui.Button !== undefined;
    tests.hasUtilities = config.utils !== undefined && config.utils.cn !== undefined;
    tests.hasDatabase = config.database !== undefined;
    tests.hasAuth = config.auth !== undefined;

    // Log results
    console.table(tests);

    if (Object.values(tests).every((v) => v === true)) {
      console.log('✅ All checks passed! Gantt feature is ready to use');
      return true;
    } else {
      console.error('❌ Some checks failed. See above for details');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to test Gantt integration:', error);
    return false;
  }
}

// ============= COMMON PATTERNS =============

// Pattern 1: Conditional rendering based on configuration
export function ConditionalGantt() {
  const projectId = 'project-123';

  if (!isGanttConfigured()) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Gantt feature is not available</p>
      </div>
    );
  }

  return <GanttViewWrapper projectId={projectId} />;
}

// Pattern 2: Loading state during configuration
export function GanttWithLoadingState() {
  const { isLoading: isAuthLoading } = useAuth();
  const projectId = 'project-123';

  if (isAuthLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isGanttConfigured()) {
    return <div className="text-center text-red-500">Configuration failed</div>;
  }

  return <GanttViewWrapper projectId={projectId} />;
}

// Pattern 3: Error boundary wrapper
export function GanttErrorBoundary({ projectId }: { projectId: string }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!isGanttConfigured()) {
        setHasError(true);
      }
    } catch (error) {
      console.error('Gantt error:', error);
      setHasError(true);
    }
  }, []);

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-bold text-red-900">Gantt Feature Error</h3>
        <p className="text-sm text-red-700">
          Failed to load Gantt feature. Please check configuration.
        </p>
      </div>
    );
  }

  return <GanttViewWrapper projectId={projectId} />;
}

export default ProjectPage;
