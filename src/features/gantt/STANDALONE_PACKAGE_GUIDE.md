# 📦 Gantt Chart Feature - Standalone Package Guide

## Tổng quan

Feature `gantt` được thiết kế theo **Service-Repository + Feature-Sliced Design** để có thể:
- ✅ **Standalone**: Copy sang dự án khác mà không cần dependency phức tạp
- ✅ **Self-contained**: Tất cả logic nằm trong 1 folder
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Testable**: Mock services cho development/testing

---

## 🚀 Cách sử dụng Feature như Package

### 1. Copy toàn bộ folder

```bash
# Copy folder gantt sang dự án mới
cp -r src/feature/gantt /path/to/new-project/src/features/
```

### 2. Dependencies cần thiết

Trong `package.json` của dự án mới:

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "date-fns": "^3.x",
    "lucide-react": "^0.x",
    "sonner": "^1.x"
  }
}
```

### 3. UI Components (shadcn/ui)

Feature sử dụng các shared UI components từ `@/components/ui/*`:

```bash
# Trong dự án mới, cài shadcn/ui components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input dialog label ...
```

Hoặc copy folder `components/ui` từ dự án cũ.

### 4. Supabase Client

Feature cần Supabase client. Tạo file `integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 5. Path Aliases

Cấu hình `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Và `vite.config.ts`:

```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 6. React Query Provider

Wrap app với QueryClientProvider:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

### 7. Import và sử dụng

```typescript
import { GanttChart } from '@/features/gantt';

function ProjectPage() {
  return (
    <GanttChart
      projectId="project-123"
      projectMembers={members}
      holidays={holidays}
      settings={settings}
    />
  );
}
```

---

## 🔧 Development Mode (Mock Data)

Feature có built-in mock services để development không cần database:

### Enable Mock Mode

```bash
# .env.local
VITE_USE_MOCK=true
```

Khi enable:
- ✅ Không cần Supabase connection
- ✅ Có 15 tasks mẫu với hierarchy
- ✅ Có 13 allocations mẫu
- ✅ UI hoạt động bình thường
- ✅ Có thể test CRUD operations (data in-memory)

### Production Mode

```bash
# .env.local
VITE_USE_MOCK=false
# hoặc không set biến này
```

Sẽ connect tới Supabase thực tế.

---

## 📁 Folder Structure (Self-contained)

```
feature/gantt/
├── index.ts                    # Central export point
├── types/                      # TypeScript types
│   ├── task.types.ts
│   ├── allocation.types.ts
│   └── gantt.types.ts
├── services/                   # Data layer
│   ├── factory.ts             # Service switcher (mock/real)
│   ├── interfaces/            # Service contracts
│   ├── api/                   # Supabase implementations
│   └── mocks/                 # Mock implementations + data
├── hooks/                      # React hooks
│   ├── queries/               # React Query - data fetching
│   ├── mutations/             # React Query - data updates
│   └── ui/                    # UI state hooks
├── store/                      # Zustand global state
│   ├── gantt.store.ts
│   ├── gantt.selector.ts
│   └── slices/
├── lib/                        # Utility functions
│   ├── date-utils.ts          # Working days, holidays
│   ├── tree-utils.ts          # Task hierarchy, WBS
│   └── gantt-utils.ts         # Timeline calculations
├── components/                 # UI components
│   ├── dialogs/
│   ├── toolbar/
│   ├── columns/
│   ├── timeline/
│   └── bars/
├── pages/                      # Main page component
│   └── GanttChart.tsx
├── context/                    # React Context (optional)
│   └── GanttContext.tsx
└── docs/                       # Documentation
    ├── README.md
    ├── QUICKSTART.md
    ├── MIGRATION_GUIDE.md
    └── UI_MIGRATION_GUIDE.md
```

---

## 🎯 External Dependencies

### Bắt buộc (Shared Infrastructure)

Những thứ **KHÔNG** nằm trong feature/gantt và phải có trong dự án:

```
src/
├── components/ui/              # shadcn/ui components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── popover.tsx
│   ├── calendar.tsx
│   ├── checkbox.tsx
│   ├── scroll-area.tsx
│   ├── separator.tsx
│   ├── tabs.tsx
│   ├── alert-dialog.tsx
│   ├── tooltip.tsx
│   └── resizable.tsx
│
├── lib/
│   └── utils.ts               # cn() utility (classnames merge)
│
├── integrations/
│   └── supabase/
│       └── client.ts          # Supabase client instance
│
└── hooks/
    └── useAuth.ts             # Current user info (optional)
```

### Optional Dependencies

Nếu không có, feature vẫn hoạt động nhưng thiếu một số tính năng:

- `@/hooks/useEmployees` - For employee list in allocations
- `@/hooks/useHolidays` - For holiday calendar
- `@/hooks/useSettings` - For company settings
- `@/components/collaboration/*` - For real-time collaboration

---

## 🔌 API Contract (Supabase Schema)

Feature expect các tables sau trong Supabase:

### Tables

```sql
-- Tasks
tasks (
  id uuid,
  project_id uuid,
  parent_id uuid,
  name text,
  start_date date,
  end_date date,
  duration integer,
  progress integer,
  assignees uuid[],
  predecessors uuid[],
  sort_order integer,
  ...
)

-- Allocations  
allocations (
  id uuid,
  employee_id uuid,
  project_id uuid,
  date date,
  effort numeric,
  source text,
  ...
)

-- Task Statuses
task_statuses (
  id uuid,
  project_id uuid,
  name text,
  color text,
  sort_order integer,
  is_default boolean
)

-- Task Labels
task_labels (
  id uuid,
  project_id uuid,
  name text,
  color text,
  sort_order integer,
  is_default boolean
)

-- Baselines
baselines (
  id uuid,
  project_id uuid,
  name text,
  description text,
  snapshot jsonb,
  created_at timestamp
)

-- Project Milestones
project_milestones (
  id uuid,
  project_id uuid,
  name text,
  date date,
  color text,
  description text
)

-- View Settings
view_settings (
  id uuid,
  user_id uuid,
  settings jsonb
)
```

---

## 🧪 Testing Feature Standalone

### 1. Tạo dự án test mới

```bash
npm create vite@latest test-gantt -- --template react-ts
cd test-gantt
npm install
```

### 2. Cài dependencies

```bash
npm install @tanstack/react-query zustand date-fns lucide-react sonner
npm install -D @types/node
npx shadcn-ui@latest init
```

### 3. Copy feature

```bash
mkdir -p src/features
cp -r /path/to/old-project/src/feature/gantt src/features/
```

### 4. Setup path aliases

Update `vite.config.ts` và `tsconfig.json` như hướng dẫn ở trên.

### 5. Enable mock mode

```bash
echo "VITE_USE_MOCK=true" > .env.local
```

### 6. Test import

```typescript
// src/App.tsx
import { GanttChart } from './features/gantt';

function App() {
  return (
    <div className="h-screen">
      <GanttChart
        projectId="test-project"
        projectMembers={[]}
        holidays={[]}
        settings={{}}
      />
    </div>
  );
}

export default App;
```

### 7. Run

```bash
npm run dev
```

Nếu chạy được → Feature hoàn toàn standalone! ✅

---

## 🎨 Customization

### Thay đổi theme

Feature sử dụng CSS variables từ dự án chủ:

```css
:root {
  --background: ...;
  --foreground: ...;
  --primary: ...;
  --secondary: ...;
  --muted: ...;
  --border: ...;
}
```

### Override styles

```css
/* Trong global CSS */
.gantt-chart {
  /* Custom styles */
}

.task-bar {
  /* Override task bar appearance */
}
```

### Extend types

```typescript
// Trong dự án mới
import { Task } from './features/gantt';

interface ExtendedTask extends Task {
  customField: string;
}
```

---

## 📊 Performance Considerations

### React Query Caching

Feature sử dụng aggressive caching:

```typescript
// Query stale time: 5 minutes
// Cache time: 10 minutes
```

Có thể customize trong `queryClient`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
    },
  },
});
```

### Zustand Persistence

Store được persist vào localStorage:

```typescript
// Có thể disable persistence
const useGanttStore = create(
  persist(
    (set, get) => ({
      // ... state
    }),
    {
      name: 'gantt-storage', // localStorage key
      // partialize: (state) => ({ ... }), // Chỉ persist 1 phần
    }
  )
);
```

### Virtual Scrolling

Với > 1000 tasks, nên enable virtual scrolling (TODO).

---

## 🐛 Troubleshooting

### Import errors

```
Module not found: Can't resolve '@/components/ui/button'
```

→ Chưa cài shadcn/ui components hoặc path alias chưa đúng.

### Supabase errors

```
supabase is not defined
```

→ Chưa setup Supabase client. Enable mock mode để test UI:

```bash
VITE_USE_MOCK=true
```

### Type errors

```
Property 'xxx' does not exist on type 'Task'
```

→ Schema khác với type definitions. Update types trong `types/` folder.

### Hook errors

```
useQuery is not defined
```

→ Chưa wrap app với QueryClientProvider.

---

## 📚 Additional Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

## ✅ Checklist: Feature hoàn toàn Standalone

- [ ] Tất cả logic nằm trong `feature/gantt/`
- [ ] Chỉ depend vào shared UI (`@/components/ui/*`)
- [ ] Chỉ depend vào shared utils (`@/lib/utils`)
- [ ] Có mock mode để test không cần database
- [ ] Export types, hooks, components qua `index.ts`
- [ ] Documentation đầy đủ
- [ ] Zero TypeScript errors
- [ ] Có thể copy sang dự án khác và chạy được

**Khi tất cả ✅ → Feature sẵn sàng publish như package riêng!** 🎉
