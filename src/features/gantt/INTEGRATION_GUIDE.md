# 🚀 Gantt Feature Integration Guide

Complete step-by-step guide to integrate the Gantt feature into your project.

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] React 18+ project
- [ ] TypeScript 5+
- [ ] Tailwind CSS configured
- [ ] shadcn/ui components (or similar UI library)
- [ ] Supabase project setup
- [ ] Package manager (npm, yarn, or pnpm)

---

## 🔧 Step-by-Step Integration

### Step 1: Copy Files

Copy the entire `gantt` folder to your project:

```bash
# From this project
cp -r src/features/gantt /path/to/your-project/src/features/

# Or if you're inside your target project
mkdir -p src/features
cp -r /path/to/gantt-project/src/features/gantt src/features/
```

### Step 2: Install Dependencies

```bash
npm install @tanstack/react-query zustand date-fns
npm install @dnd-kit/core @dnd-kit/sortable
npm install lucide-react sonner
npm install @supabase/supabase-js
```

Or with yarn:
```bash
yarn add @tanstack/react-query zustand date-fns
yarn add @dnd-kit/core @dnd-kit/sortable
yarn add lucide-react sonner
yarn add @supabase/supabase-js
```

### Step 3: Database Setup

#### 3.1 Create Required Tables

Run these migrations in your Supabase SQL editor:

```sql
-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  duration INTEGER,
  progress INTEGER DEFAULT 0,
  status_id UUID REFERENCES task_statuses(id),
  priority TEXT DEFAULT 'medium',
  is_milestone BOOLEAN DEFAULT false,
  wbs TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Task statuses
CREATE TABLE task_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#gray',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task labels
CREATE TABLE task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task label assignments
CREATE TABLE task_label_assignments (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES task_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- Task dependencies
CREATE TABLE task_dependencies (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'FS',
  PRIMARY KEY (task_id, depends_on_task_id)
);

-- Task allocations
CREATE TABLE task_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  allocated_hours DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#purple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Baselines
CREATE TABLE baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Baseline tasks (snapshot)
CREATE TABLE baseline_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baseline_id UUID NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  task_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View settings
CREATE TABLE view_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_task_allocations_task_id ON task_allocations(task_id);
CREATE INDEX idx_task_allocations_employee_id ON task_allocations(employee_id);
```

#### 3.2 Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_settings ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your needs)
CREATE POLICY "Users can view tasks in their projects"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their projects"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Repeat similar policies for other tables
```

### Step 4: Create Configuration File

Create `src/config/gantt.config.ts`:

```typescript
import { configureGantt } from '@/features/gantt/adapters';
import type { IGanttConfig } from '@/features/gantt/adapters';

// Import your dependencies
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// Import all other required UI components
// See config.example.ts for complete list

export function setupGanttFeature() {
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
      // ... add all other UI components
      // See src/features/gantt/adapters/index.ts for complete list
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
      user: null, // You'll implement this based on your auth system
      isLoading: false,
    },
  };

  configureGantt(config);
}
```

### Step 5: Initialize in Your App

In your `src/main.tsx` or `src/App.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupGanttFeature } from '@/config/gantt.config';
import App from './App';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize Gantt feature
setupGanttFeature();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Step 6: Use in Your Project

#### Basic Usage

```typescript
import { GanttView } from '@/features/gantt';

function ProjectPage() {
  const projectId = 'your-project-id';
  
  return (
    <div className="h-screen">
      <GanttView
        projectId={projectId}
        projectMembers={[
          { id: '1', name: 'John Doe' },
          { id: '2', name: 'Jane Smith' },
        ]}
        holidays={[]}
        settings={{ working_days: [1, 2, 3, 4, 5] }}
      />
    </div>
  );
}
```

#### Advanced Usage with Data Hooks

```typescript
import { GanttView } from '@/features/gantt';
import { useGetTasks } from '@/features/gantt/hooks';

function ProjectPage() {
  const projectId = 'your-project-id';
  const { data: tasks, isLoading } = useGetTasks(projectId);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <GanttView
      projectId={projectId}
      projectMembers={members}
      holidays={holidays}
      settings={settings}
    />
  );
}
```

---

## 🧪 Testing with Mock Data

To test without database:

1. Set environment variable:
```bash
# .env.local
VITE_USE_MOCK=true
```

2. The feature will automatically use mock services

3. Check `src/features/gantt/services/mocks/` for mock data

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Gantt chart renders without errors
- [ ] Can create new tasks
- [ ] Can edit existing tasks
- [ ] Can delete tasks
- [ ] Task dependencies work
- [ ] Drag and drop works
- [ ] Timeline scrolling works
- [ ] Zoom controls work
- [ ] Filters work
- [ ] Dialogs open and close properly
- [ ] Data persists to database
- [ ] Real-time updates work (if using collaboration)

---

## 🔍 Troubleshooting

### Issue: "Gantt feature is not configured"

**Cause**: `configureGantt()` was not called before using components

**Solution**: Ensure `setupGanttFeature()` is called in your main app file before rendering any Gantt components

### Issue: Components not rendering

**Cause**: Missing UI component adapters

**Solution**: Check `adapters/index.ts` for required UI components and ensure all are provided in config

### Issue: Data not loading

**Cause**: Database tables don't exist or RLS policies are blocking access

**Solution**: 
1. Verify tables exist in Supabase
2. Check RLS policies
3. Verify user has access to project

### Issue: TypeScript errors

**Cause**: Missing type definitions or incorrect adapter implementation

**Solution**: Ensure all adapter interfaces are properly implemented according to `adapters/index.ts`

---

## 📚 Next Steps

1. Customize styling to match your app
2. Configure working days and holidays
3. Set up task statuses and labels
4. Enable collaboration features (optional)
5. Add custom columns
6. Implement export functionality
7. Add custom business logic

---

## 🆘 Support

- Check [README.md](./README.md) for full documentation
- See [config.example.ts](./config.example.ts) for complete config example
- Review [adapters/index.ts](./adapters/index.ts) for adapter interfaces

---

**Happy coding! 🎉**
