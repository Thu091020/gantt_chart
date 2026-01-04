/**
 * Gantt feature bootstrap
 *
 * Centralized helper to configure the feature with a single call.
 * - Scopes all UI imports to the feature-local shadcn bundle.
 * - Picks mock vs real database mode via env or explicit param.
 * - Keeps auth/collab wiring in one place so pages stay lean.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  configureGantt,
  type IGanttConfig,
} from './adapters';
import {
  createDatabaseAdapter,
  setGanttAdapterMode,
  getGanttAdapterMode,
  uiAdapter,
  utilsAdapter,
  type GanttAdapterMode,
} from './adapters/config';
import {
  CollaborationOverlay,
  CollaborationAvatars,
} from './components/collaboration';

export interface GanttSetupOptions {
  projectId: string;
  supabaseClient: SupabaseClient;
  auth?: {
    user: {
      id: string;
      email?: string;
      name?: string;
    } | null;
    isLoading?: boolean;
  };
  /** Force adapter mode. If omitted, falls back to VITE_GANTT_MODE or auto-detect. */
  mode?: GanttAdapterMode;
  /** Disable if you do not want to show collaboration UI. */
  useCollaboration?: boolean;
  /** Optional view settings adapter if you want to plug in your own. */
  viewSettingsAdapter?: IGanttConfig['viewSettings'];
}

function resolveMode(mode?: GanttAdapterMode): GanttAdapterMode {
  const envMode = (import.meta.env.VITE_GANTT_MODE as GanttAdapterMode | undefined) || undefined;
  const chosen = mode || envMode;
  if (chosen) {
    setGanttAdapterMode(chosen);
  }
  return getGanttAdapterMode();
}

export function setupGanttFeature(options: GanttSetupOptions) {
  const {
    projectId,
    supabaseClient,
    auth,
    mode,
    useCollaboration = true,
    viewSettingsAdapter,
  } = options;

  const effectiveMode = resolveMode(mode);

  const config: IGanttConfig = {
    database: createDatabaseAdapter(supabaseClient, projectId),
    ui: uiAdapter,
    utils: utilsAdapter,
    auth: {
      user: auth?.user ?? null,
      isLoading: auth?.isLoading ?? false,
    },
    viewSettings: viewSettingsAdapter,
    collaboration: useCollaboration
      ? { CollaborationOverlay, CollaborationAvatars }
      : undefined,
  };

  configureGantt(config);
  return effectiveMode;
}

export { setGanttAdapterMode, getGanttAdapterMode, type GanttAdapterMode };
