# 🧪 Integration Test & Setup Guide

> Hướng dẫn test gantt feature khi import sang dự án khác

## 1️⃣ Copy Feature sang Project Mới

```bash
# Copy toàn bộ folder gantt vào project mới
cp -r src/features/gantt /path/to/new-project/src/features/
```

## 2️⃣ Setup Adapters (Bắt buộc!)

### Step 1: Import và configure gantt

```typescript
// src/app.tsx hoặc main.tsx
import { configureGantt } from '@/features/gantt';
import { Button, Input, Dialog, ... } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase';

// Configure gantt adapters
configureGantt({
  // UI Components (required)
  uiComponents: {
    Button,
    Input,
    Label,
    Checkbox,
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

  // Utilities (required)
  utilities: {
    cn,
    toast: {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
      info: (msg) => toast.info(msg),
      warning: (msg) => toast.warning(msg),
    },
  },

  // Database (required)
  database: {
    supabaseClient: supabase,
  },

  // Auth (optional but recommended)
  auth: {
    user: user, // từ useAuth() hook
    isLoading: isLoading,
  },

  // Data hooks (optional - for custom data source)
  hooks: {
    // Nếu sử dụng mock data hoặc custom API
    useTasks: () => useTasksCustom(),
    useAllocations: () => useAllocationsCustom(),
    // ...
  },
});
```

## 3️⃣ Sử dụng Gantt View

### Basic Usage

```typescript
import { GanttViewWrapper } from '@/features/gantt';

export default function MyProject() {
  const projectId = 'abc123';

  return (
    <div className="h-screen">
      <GanttViewWrapper projectId={projectId} />
    </div>
  );
}
```

### Advanced Usage

```typescript
import {
  GanttProvider,
  GanttChart,
  useGanttContext,
} from '@/features/gantt';

export default function MyGanttPage() {
  const projectId = 'abc123';

  return (
    <GanttProvider projectId={projectId}>
      <GanttContent />
    </GanttProvider>
  );
}

function GanttContent() {
  const { tasks, allocations } = useGanttContext();

  return (
    <div>
      {/* Custom header */}
      <div className="p-4 border-b">
        <h1>Project: {projectId}</h1>
        <p>Tasks: {tasks.length}</p>
      </div>

      {/* Gantt chart */}
      <div className="flex-1">
        <GanttChart />
      </div>
    </div>
  );
}
```

## 4️⃣ Verify Configuration ✅

```typescript
import { isGanttConfigured, getGanttConfig } from '@/features/gantt';

// Check if configured
if (!isGanttConfigured()) {
  console.error('Gantt feature not configured!');
  // Handle error
}

// Get current config
const config = getGanttConfig();
console.log('Gantt config:', config);
```

## 5️⃣ Database Requirements

Feature sử dụng các table trong Supabase:

### Tables cần thiết:
```sql
-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  parent_id UUID,
  progress INT,
  -- ... more fields
);

-- Allocations (effort tracking)
CREATE TABLE project_allocations (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  date DATE NOT NULL,
  effort DECIMAL(3,2),
  source VARCHAR(50),
  created_at TIMESTAMP,
);

-- Project members
CREATE TABLE project_members (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- ... more fields
);

-- Holidays
CREATE TABLE holidays (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  end_date DATE,
  -- ... more fields
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY,
  is_saturday_working_day BOOLEAN,
  -- ... more fields
);
```

## 6️⃣ Minimal Test Setup

```typescript
// src/features/gantt/__test__/setup.ts

import { configureGantt } from '../index';
import * as mockUI from '@/components/ui';
import { cn } from '@/lib/utils';

export function setupGanttForTesting() {
  configureGantt({
    uiComponents: mockUI,
    utilities: {
      cn,
      toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warning: jest.fn(),
      },
    },
    database: {
      supabaseClient: mockSupabase,
    },
  });
}
```

## 7️⃣ Type Safety

All types available from main entry:

```typescript
import type {
  Task,
  TaskAllocation,
  CustomColumn,
  ViewMode,
  GanttContextType,
} from '@/features/gantt/types';

// Use in your components
const myTask: Task = {
  id: '1',
  title: 'My Task',
  // ...
};
```

## 8️⃣ Common Issues & Solutions

### Issue 1: "Gantt feature not configured"
```typescript
// Solution: Make sure configureGantt() is called BEFORE rendering
// Usually in App.tsx or main.tsx root
```

### Issue 2: Missing UI components
```typescript
// Check: Do all required components exist in target project?
// If not, install: npm install @/components/ui
```

### Issue 3: Toast not showing
```typescript
// Check: Sonner provider is added to App
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <YourApp />
      <Toaster />
    </>
  );
}
```

### Issue 4: Database connection failing
```typescript
// Check: Supabase credentials configured
// Check: RLS policies allow access to required tables
// Check: Tables exist and have correct schema
```

## 9️⃣ Features Available

After configuration, you get:

✅ Gantt chart visualization  
✅ Task management (CRUD)  
✅ Resource allocation (effort tracking)  
✅ Timeline views (day/week/month/quarter)  
✅ Filtering & search  
✅ Baseline comparison  
✅ Export functionality  
✅ Multi-language support  
✅ Drag & drop  
✅ Responsive design  

## 🔟 File Structure in New Project

```
new-project/
├── src/
│   ├── features/
│   │   └── gantt/                    # ← Copied feature
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── store/
│   │       ├── types/
│   │       ├── lib/
│   │       ├── context/
│   │       ├── adapters/
│   │       ├── constants.ts
│   │       ├── utils.ts
│   │       └── index.ts              # ← Main export
│   ├── integrations/
│   │   └── supabase/
│   └── App.tsx                       # ← Configure here
```

## ✅ Verification Checklist

- [ ] Feature copied to new project
- [ ] configureGantt() called in App.tsx
- [ ] All UI components provided
- [ ] Database credentials configured
- [ ] Supabase tables created
- [ ] Types imported correctly
- [ ] No import errors
- [ ] Gantt feature renders
- [ ] Data loads correctly
- [ ] Interactions work (click, drag, edit)

---

**Status**: ✅ Ready for production use  
**Last Updated**: January 3, 2026
