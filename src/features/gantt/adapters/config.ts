/**
 * Gantt Adapter Configuration
 * Switch between mock and real database adapters
 * Also handles UI components and utilities
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockDatabaseAdapter } from './mockDatabase';
import { createRealDatabaseAdapter } from './realDatabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Configuration mode for Gantt feature
 * 'mock' - uses mock data for testing/development
 * 'real' - uses actual Supabase calls
 */
export type GanttAdapterMode = 'mock' | 'real';

// Detect if Supabase is available
const hasSupabaseEnvVars = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

// Store current mode (can be toggled via window.__GANTT_MODE__)
// Default to 'mock' if Supabase is not configured, otherwise use env var or default to 'real'
let currentMode: GanttAdapterMode = (import.meta.env.VITE_GANTT_MODE as GanttAdapterMode) || (hasSupabaseEnvVars ? 'real' : 'mock');

export function setGanttAdapterMode(mode: GanttAdapterMode) {
  currentMode = mode;
  console.log(`[Gantt] Switched to ${mode} adapter mode`);
}

export function getGanttAdapterMode(): GanttAdapterMode {
  return currentMode;
}

/**
 * Create configured database adapter based on current mode
 */
export function createDatabaseAdapter(
  supabaseClient: SupabaseClient,
  projectId: string
) {
  if (currentMode === 'mock') {
    console.log('[Gantt] Using MOCK database adapter');
    return createMockDatabaseAdapter(supabaseClient);
  } else {
    console.log('[Gantt] Using REAL database adapter');
    return createRealDatabaseAdapter(supabaseClient, projectId);
  }
}

/**
 * UI Components adapter - provides consistent shadcn/ui components
 */
export const uiAdapter = {
  // Basic components
  Button: Button as any,
  Input: Input as any,
  Label: Label as any,
  Checkbox: Checkbox as any,
  Separator: Separator as any,
  Textarea: Textarea as any,

  // Dialog
  Dialog: Dialog as any,
  DialogContent: DialogContent as any,
  DialogHeader: DialogHeader as any,
  DialogTitle: DialogTitle as any,
  DialogFooter: DialogFooter as any,
  DialogTrigger: DialogTrigger as any,

  // Alert Dialog
  AlertDialog: AlertDialog as any,
  AlertDialogAction: AlertDialogAction as any,
  AlertDialogCancel: AlertDialogCancel as any,
  AlertDialogContent: AlertDialogContent as any,
  AlertDialogDescription: AlertDialogDescription as any,
  AlertDialogFooter: AlertDialogFooter as any,
  AlertDialogHeader: AlertDialogHeader as any,
  AlertDialogTitle: AlertDialogTitle as any,
  AlertDialogTrigger: AlertDialogTrigger as any,

  // Popover
  Popover: Popover as any,
  PopoverContent: PopoverContent as any,
  PopoverTrigger: PopoverTrigger as any,

  // Select
  Select: Select as any,
  SelectContent: SelectContent as any,
  SelectItem: SelectItem as any,
  SelectTrigger: SelectTrigger as any,
  SelectValue: SelectValue as any,

  // Calendar
  Calendar: Calendar as any,

  // Tooltip
  Tooltip: Tooltip as any,
  TooltipContent: TooltipContent as any,
  TooltipProvider: TooltipProvider as any,
  TooltipTrigger: TooltipTrigger as any,

  // Scroll Area
  ScrollArea: ScrollArea as any,

  // Resizable
  ResizablePanelGroup: ResizablePanelGroup as any,
  ResizablePanel: ResizablePanel as any,
  ResizableHandle: ResizableHandle as any,
};

/**
 * Utilities adapter
 */
export const utilsAdapter = {
  cn,
  toast: toast as any,
};

// Make mode configurable via window for debugging
if (typeof window !== 'undefined') {
  (window as any).__GANTT_MODE__ = currentMode;
  (window as any).__setGanttMode__ = setGanttAdapterMode;
  (window as any).__getGanttMode__ = getGanttAdapterMode;
}
