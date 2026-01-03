/**
 * Example Configuration for Gantt Feature
 *
 * Copy this file and customize it for your project.
 * This shows how to configure the Gantt feature with your project's dependencies.
 */

import { configureGantt } from './adapters';
import type { IGanttConfig } from './adapters';

// Import your project's dependencies
import { supabase } from '@/integrations/supabase/client';
import { cn } from '../internal/utils';
import { toast } from 'sonner';

// UI Components
import { Button } from '../internal/ui';
import { Input } from '../internal/ui';
import { Label } from '../internal/ui';
import { Checkbox } from '../internal/ui';
import { Separator } from '../internal/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../internal/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../internal/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../internal/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../internal/ui';
import { Calendar } from '../internal/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../internal/ui';
import { Textarea } from '../internal/ui';
import { ScrollArea } from '../internal/ui';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../internal/ui';

// Optional: Your data hooks
import { useEmployees } from '@/hooks/useEmployees';
import { useTaskStatuses } from '@/hooks/useTaskStatuses';
import { useTaskLabels } from '@/hooks/useTaskLabels';
import { useProjectMilestones } from '@/hooks/useProjectMilestones';
import { useHolidays } from '@/hooks/useHolidays';
import { useBaselines } from '@/hooks/useBaselines';
import { useViewSettings } from '@/hooks/useViewSettings';
import { useAuth } from '@/hooks/useAuth';

// Optional: Collaboration
import {
  CollaborationOverlay,
  CollaborationAvatars,
} from '@/components/collaboration/CollaborationOverlay';

/**
 * Configure the Gantt feature with your project's dependencies
 */
export function setupGanttFeature() {
  const config: IGanttConfig = {
    // Database
    database: {
      supabaseClient: supabase,
    },

    // UI Components
    ui: {
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
    },

    // Utilities
    utils: {
      cn,
      toast: Object.assign(
        (message: string, options?: any) => toast(message, options),
        {
          success: (message: string) => toast.success(message),
          error: (message: string) => toast.error(message),
          info: (message: string) => toast.info(message),
          warning: (message: string) => toast.warning(message),
        }
      ),
    },

    // Auth (example with useAuth hook)
    auth: {
      get user() {
        // You might need to use a hook or context here
        // This is just an example
        const { user } = useAuth();
        return user;
      },
      get isLoading() {
        const { isLoading } = useAuth();
        return isLoading;
      },
    },

    // Optional: Provide adapters for external data hooks
    // If not provided, the Gantt feature will use its internal implementations
    collaboration: {
      CollaborationOverlay,
      CollaborationAvatars,
    },
  };

  configureGantt(config);
}

/**
 * Alternative: Minimal configuration (using internal implementations)
 * Use this if you want the Gantt feature to be completely self-contained
 */
export function setupGanttFeatureMinimal() {
  const config: IGanttConfig = {
    database: {
      supabaseClient: supabase,
    },
    ui: {
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
    },
    utils: {
      cn,
      toast: Object.assign(
        (message: string, options?: any) => toast(message, options),
        {
          success: (message: string) => toast.success(message),
          error: (message: string) => toast.error(message),
          info: (message: string) => toast.info(message),
          warning: (message: string) => toast.warning(message),
        }
      ),
    },
    auth: {
      user: null,
      isLoading: false,
    },
  };

  configureGantt(config);
}
