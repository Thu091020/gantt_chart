# 📊 Gantt Chart Feature - Standalone Package

> **Self-contained, portable Gantt chart feature** that can be integrated into any React + Supabase project.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Folder Structure](#folder-structure)

---

## 🎯 Overview

This Gantt chart feature is designed as a **self-contained, portable module** that can be easily integrated into any React project. It follows modern React patterns and best practices:

- ✅ **Fully typed** with TypeScript
- ✅ **Adapter pattern** for external dependencies
- ✅ **Service layer** with mock support
- ✅ **State management** with Zustand
- ✅ **React Query** for data fetching
- ✅ **Modular architecture** for easy maintenance

---

## ✨ Features

### Core Functionality
- 📅 **Timeline Views**: Day, Week, Month, Quarter views
- 🔄 **Drag & Drop**: Reorder tasks, change dates, resize bars
- 📊 **Progress Tracking**: Visual progress bars on tasks
- 🔗 **Dependencies**: Task dependencies with visual lines
- 📌 **Milestones**: Project milestone markers
- 🏷️ **Labels & Status**: Customizable task labels and statuses
- 👥 **Assignments**: Multi-user task assignments
- 📸 **Baselines**: Save and compare project snapshots
- 🔍 **Filtering**: Filter by assignee, status, labels
- 📐 **Custom Columns**: Configurable grid columns

### Advanced Features
- 🌐 **Real-time Collaboration** (optional)
- 📊 **Effort Tracking** with allocations
- 🎨 **Theming**: Light/Dark mode support
- 📱 **Responsive**: Works on desktop and tablet
- ⚡ **Performance**: Optimized for 1000+ tasks
- 💾 **Auto-save**: Automatic background saves
- 🔄 **Undo/Redo**: Task modifications

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Your Application               │
│  (Provides UI, Auth, Database Client)   │
└──────────────┬──────────────────────────┘
               │ configureGantt()
               ▼
┌─────────────────────────────────────────┐
│         Gantt Feature Module            │
│  ┌───────────────────────────────────┐  │
│  │  Adapters (Interfaces)            │  │
│  │  - UI Components                  │  │
│  │  - Database Client                │  │
│  │  - Utilities (cn, toast)          │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Services (Data Layer)            │  │
│  │  - TaskService                    │  │
│  │  - AllocationService              │  │
│  │  - SettingsService                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Store (State Management)         │  │
│  │  - View State                     │  │
│  │  - Selection State                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Hooks (Business Logic)           │  │
│  │  - Queries (React Query)          │  │
│  │  - Mutations                      │  │
│  │  - UI Hooks (DnD, Scroll, Zoom)   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Components (Presentation)        │  │
│  │  - GanttChart, Timeline, Grid     │  │
│  │  - Toolbar, Dialogs               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Key Design Patterns

1. **Adapter Pattern**: External dependencies injected through adapters
2. **Service-Repository**: Data access abstracted through services
3. **Feature-Sliced Design**: Organized by feature domains
4. **Separation of Concerns**: UI, logic, and data clearly separated

---

## 📦 Installation & Setup

### Prerequisites

- React 18+
- TypeScript 5+
- Supabase client
- Tailwind CSS
- shadcn/ui components (or compatible UI library)

### Step 1: Copy the Feature

Copy the entire `features/gantt` folder into your project:

```bash
cp -r features/gantt /path/to/your/project/src/features/
```

### Step 2: Install Dependencies

```bash
npm install @tanstack/react-query zustand date-fns @supabase/supabase-js
npm install @dnd-kit/core @dnd-kit/sortable
npm install lucide-react sonner
```

### Step 3: Database Setup

Run the required database migrations:

```sql
-- See supabase/migrations/ for complete schema
-- Required tables:
-- - tasks
-- - task_allocations
-- - task_statuses
-- - task_labels
-- - project_milestones
-- - baselines
-- - view_settings
```

---

## 🚀 Quick Start

### 1. Configure the Gantt Feature

Create a configuration file (e.g., `src/config/gantt.config.ts`):

```typescript
import { configureGantt } from '@/features/gantt/adapters';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import your UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// ... import other UI components

export function setupGantt() {
  configureGantt({
    database: {
      supabaseClient: supabase,
    },
    ui: {
      Button,
      Input,
      Label,
      // ... provide all required UI components
      // See adapters/index.ts for complete list
    },
    utils: {
      cn,
      toast: Object.assign(
        (msg: string, opts?: any) => toast(msg, opts),
        {
          success: (msg: string) => toast.success(msg),
          error: (msg: string) => toast.error(msg),
          info: (msg: string) => toast.info(msg),
          warning: (msg: string) => toast.warning(msg),
        }
      ),
    },
    auth: {
      user: null, // Provide current user
      isLoading: false,
    },
  });
}
```

See [config.example.ts](./config.example.ts) for complete configuration example.

### 2. Initialize in Your App

In your main app file (e.g., `App.tsx` or `main.tsx`):

```typescript
import { setupGantt } from '@/config/gantt.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Configure Gantt on app start
setupGantt();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app content */}
    </QueryClientProvider>
  );
}
```

### 3. Use the Gantt Chart

```typescript
import { GanttView } from '@/features/gantt';

function ProjectPage({ projectId }: { projectId: string }) {
  return (
    <GanttView
      projectId={projectId}
      projectMembers={[
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
      ]}
      holidays={[
        {
          id: '1',
          date: '2024-01-01',
          end_date: null,
          name: 'New Year',
          is_recurring: true,
        },
      ]}
      settings={{
        working_days: [1, 2, 3, 4, 5], // Monday to Friday
      }}
    />
  );
}
```

---

## ⚙️ Configuration

### Required Adapters

#### 1. Database Adapter
```typescript
database: {
  supabaseClient: SupabaseClient
}
```

#### 2. UI Components Adapter
```typescript
ui: {
  Button, Input, Label, Checkbox, Separator,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  AlertDialog, AlertDialogAction, AlertDialogCancel, ...
  Popover, PopoverContent, PopoverTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Calendar, Tooltip, Textarea, ScrollArea,
  ResizablePanelGroup, ResizablePanel, ResizableHandle,
  // See adapters/index.ts for complete list
}
```

#### 3. Utilities Adapter
```typescript
utils: {
  cn: (...inputs: any[]) => string,
  toast: {
    (message: string, options?: any): void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  }
}
```

#### 4. Auth Adapter
```typescript
auth: {
  user: { id: string, email?: string, name?: string } | null,
  isLoading: boolean
}
```

### Optional Adapters

You can optionally provide custom implementations for:
- Employees/Users data
- Task statuses management
- Task labels management
- Project milestones
- Holidays
- Baselines
- View settings
- Collaboration features

If not provided, the Gantt feature will use its internal implementations.

---

## 📚 Usage Examples

### Basic Usage

```typescript
import { GanttView } from '@/features/gantt';

<GanttView
  projectId="project-123"
  projectMembers={members}
  holidays={holidays}
  settings={settings}
/>
```

### With Custom Hooks

```typescript
import { useTaskQueries } from '@/features/gantt/hooks';

function MyGanttWrapper() {
  const { data: tasks, isLoading } = useTaskQueries('project-123');
  
  if (isLoading) return <Loading />;
  
  return <GanttView projectId="project-123" ... />;
}
```

### Using Store Directly

```typescript
import { useGanttStore, ganttSelectors } from '@/features/gantt/store';

function MyComponent() {
  const selectedTaskIds = useGanttStore(ganttSelectors.selectedTaskIds);
  const setSelectedTaskIds = useGanttStore(state => state.setSelectedTaskIds);
  
  // Your custom logic
}
```

### Running with Mock Data

Set environment variable:
```bash
VITE_USE_MOCK=true
```

The feature will use mock services instead of real Supabase queries.

---

## 📖 API Reference

### Main Components

#### `<GanttView>`
Main Gantt chart component.

**Props:**
- `projectId: string` - The project ID
- `projectMembers: Array<{id: string, name: string}>` - Project team members
- `holidays: Array<Holiday>` - Company/project holidays
- `settings: Settings` - Project settings (working days, etc.)

### Hooks

#### Query Hooks
- `useTaskQueries(projectId)` - Fetch tasks
- `useAllocationQueries(projectId)` - Fetch allocations
- `useSettingQueries(projectId)` - Fetch settings

#### Mutation Hooks
- `useTaskMutations()` - Task CRUD operations
- `useAllocationMutations()` - Allocation CRUD operations

#### UI Hooks
- `useGanttScroll()` - Scroll management
- `useGanttZoom()` - Zoom levels
- `useGanttDnd()` - Drag and drop

#### Business Logic Hooks
- `useGanttCalculations()` - WBS, hierarchy calculations
- `useGanttTimeline()` - Timeline generation
- `useGanttState()` - Component state
- `useGanttHandlers()` - Event handlers

### Utilities

```typescript
import {
  calculateWorkingDays,
  addWorkingDays,
  isWorkingDay,
  generateTimelineColumns,
  buildTaskTree,
  calculateWBS,
} from '@/features/gantt/lib';
```

---

## 📁 Folder Structure

```
src/features/gantt/
├── adapters/              # External dependency interfaces
│   └── index.ts           # Adapter definitions & config
├── types/                 # TypeScript type definitions
│   ├── task.types.ts      # Task-related types
│   ├── allocation.types.ts # Allocation types
│   └── gantt.types.ts     # Gantt-specific types
├── services/              # Data access layer
│   ├── interfaces/        # Service contracts
│   ├── api/               # Real Supabase services
│   ├── mocks/             # Mock services for testing
│   └── factory.ts         # Service factory (real/mock)
├── store/                 # Zustand state management
│   ├── slices/            # State slices
│   ├── gantt.store.ts     # Main store
│   └── gantt.selector.ts  # Selectors
├── hooks/                 # React hooks
│   ├── queries/           # React Query data fetching
│   ├── mutations/         # Data mutations
│   ├── ui/                # UI interaction hooks
│   └── index.ts           # Hook exports
├── lib/                   # Utility functions
│   ├── date-utils.ts      # Date calculations
│   ├── tree-utils.ts      # Tree operations
│   └── gantt-utils.ts     # Gantt-specific utils
├── components/            # React components
│   ├── bars/              # Task bars, milestones
│   ├── columns/           # Grid columns
│   ├── timeline/          # Timeline components
│   ├── toolbar/           # Toolbar controls
│   ├── dialogs/           # Modal dialogs
│   └── GanttChart.tsx     # Main chart component
├── pages/                 # Page components
│   ├── GanttView.tsx      # Main view page
│   └── index.ts           # Page exports
├── context/               # React Context
│   └── GanttContext.tsx   # Gantt context provider
├── config.example.ts      # Configuration example
├── index.ts               # Main export file
└── README.md              # This file
```

---

## 🤝 Integration Checklist

When integrating into a new project:

- [ ] Copy `features/gantt` folder to your project
- [ ] Install required dependencies
- [ ] Run database migrations
- [ ] Create configuration file (`gantt.config.ts`)
- [ ] Call `configureGantt()` on app initialization
- [ ] Wrap app with `QueryClientProvider`
- [ ] Import and use `<GanttView>` component
- [ ] Test with mock data first (`VITE_USE_MOCK=true`)
- [ ] Configure all required UI components
- [ ] Configure auth adapter
- [ ] Test with real Supabase data
- [ ] Customize styling if needed

---

## 🔧 Development

### Key Principles

1. **Separation of Concerns**
   - Components only handle UI
   - Hooks handle business logic
   - Services handle data access

2. **Type Safety**
   - All code is fully typed
   - No `any` types allowed
   - Strict TypeScript configuration

3. **Performance**
   - Memoization for expensive calculations
   - Virtual scrolling for large datasets
   - Optimized re-renders

4. **Testability**
   - Mock services for testing
   - Pure functions in utilities
   - Dependency injection

---

## 📚 Additional Resources

- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Detailed folder structure explanation
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - Visual architecture diagrams
- [config.example.ts](./config.example.ts) - Complete configuration example
- [adapters/index.ts](./adapters/index.ts) - All adapter interface definitions

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Gantt feature is not configured"
- **Solution**: Make sure you call `configureGantt()` before using any Gantt components

**Issue**: UI components not rendering correctly
- **Solution**: Verify all required UI components are provided in the config

**Issue**: Data not loading
- **Solution**: Check database connection and ensure tables exist

**Issue**: TypeScript errors
- **Solution**: Ensure all adapter interfaces are properly implemented

---

**Made with ❤️ for modern React projects**
