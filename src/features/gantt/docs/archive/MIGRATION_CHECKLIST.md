# Migration Checklist - Gantt Feature

Danh sách theo dõi quá trình migration từ code cũ sang kiến trúc mới.

## ✅ Phase 1: Foundation (HOÀN THÀNH)

- [x] Tạo cấu trúc thư mục `src/feature/gantt/`
- [x] Định nghĩa Types
  - [x] `task.types.ts` - Task, TaskLabel, TaskStatus, Input types
  - [x] `allocation.types.ts` - Allocation, Query params, Input types
  - [x] `gantt.types.ts` - ViewSettings, UI types, Baseline, Milestone

## ✅ Phase 2: Service Layer (HOÀN THÀNH)

- [x] Service Interfaces
  - [x] `task.interface.ts` - ITaskService contract
  - [x] `allocation.interface.ts` - IAllocationService contract
  - [x] `settings.interface.ts` - ISettingsService contract

- [x] Supabase Implementation
  - [x] `api/task.service.ts` - Real task operations
  - [x] `api/allocation.service.ts` - Real allocation operations
  - [x] `api/settings.service.ts` - Real settings operations

- [x] Mock Implementation
  - [x] `mocks/data/mock-tasks.ts` - Fake task data
  - [x] `mocks/data/mock-allocations.ts` - Fake allocation data
  - [x] `mocks/task.mock.ts` - Mock task service
  - [x] `mocks/allocation.mock.ts` - Mock allocation service
  - [x] `mocks/index.ts` - Mock exports

- [x] Service Factory
  - [x] `factory.ts` - Environment-based service switcher

## ✅ Phase 3: State Management (HOÀN THÀNH)

- [x] Zustand Store
  - [x] `store/slices/view-slice.ts` - View mode, zoom, dates
  - [x] `store/slices/ui-slice.ts` - Dialogs, selections, drag state
  - [x] `store/slices/task-slice.ts` - Task filters
  - [x] `store/gantt.store.ts` - Combined store
  - [x] `store/gantt.selector.ts` - Memoized selectors

## ✅ Phase 4: React Query Hooks (HOÀN THÀNH)

- [x] Query Hooks
  - [x] `hooks/queries/useTaskQueries.ts` - Task data fetching
  - [x] `hooks/queries/useAllocationQueries.ts` - Allocation data fetching
  - [x] `hooks/queries/useSettingQueries.ts` - Settings, baselines, milestones

- [x] Mutation Hooks
  - [x] `hooks/mutations/useTaskMutations.ts` - Task CRUD operations
  - [x] `hooks/mutations/useAllocationMutations.ts` - Allocation operations

## ✅ Phase 4.5: Utilities & UI Hooks (HOÀN THÀNH)

- [x] **Utility Functions**
  - [x] `lib/date-utils.ts` - Date calculations, working days, holidays (132 dòng)
  - [x] `lib/tree-utils.ts` - Task tree operations, WBS, hierarchy (153 dòng)
  - [x] `lib/gantt-utils.ts` - Timeline generation, position calculations (171 dòng)

- [x] **UI Hooks**
  - [x] `hooks/ui/useGanttScroll.ts` - Synchronized scrolling (50 dòng)
  - [x] `hooks/ui/useGanttZoom.ts` - Timeline zoom & navigation (68 dòng)
  - [x] `hooks/ui/useGanttDnd.ts` - Drag & drop task reordering (95 dòng)

## 🚧 Phase 5: Component Migration (ĐANG CHỜ)

### Components cần migrate từ `src/components/gantt/` sang `src/feature/gantt/components/`

- [ ] **GanttView.tsx** (2373 dòng) → `pages/GanttChart.tsx`
  - Thay đổi imports sang dùng hooks mới
  - Sử dụng `useGanttStore` thay vì local state
  - Refactor logic vào custom hooks

- [ ] **GanttChart.tsx** (532 dòng) → `components/timeline/ChartArea.tsx`
  - Tách logic vẽ timeline
  - Optimize rendering

- [ ] **GanttToolbar.tsx** (636 dòng) → `components/toolbar/`
  - Kết nối với store actions
  - Component composition

- [ ] **TaskGrid.tsx** (827 dòng) → `components/columns/TaskListTable.tsx`
  - Sử dụng tanstack table
  - Virtual scrolling

- [ ] **TaskFormDialog.tsx** (481 dòng) → `components/dialogs/CreateTaskDialog.tsx`
  - React Hook Form integration
  - Validation schemas

- [ ] **BaselineDialog.tsx** (310 dòng) → `components/dialogs/BaselineManagerDialog.tsx`
  - Sử dụng baseline hooks mới

- [ ] **MilestoneDialog.tsx** (222 dòng) → Components riêng trong timeline
  
- [ ] **StatusSettingsDialog.tsx** (221 dòng) → `components/dialogs/`
  
- [ ] **LabelSettingsDialog.tsx** (221 dòng) → `components/dialogs/LabelSettingsDialog.tsx`

- [ ] **GanttPanels.tsx** (186 dòng) → Layout component

### Utility Components cần tạo mới

- [ ] `components/bars/TaskBar.tsx`
- [ ] `components/bars/MilestoneDiamond.tsx`
- [ ] `components/bars/ProgressBar.tsx`
- [ ] `components/bars/DependencyLine.tsx`
- [ ] `components/timeline/TimelineHeader.tsx`
- [ ] `components/timeline/TimelineGrid.tsx`
- [ ] `components/timeline/TimeMarker.tsx`
- [ ] `components/columns/TaskRow.tsx`
- [ ] `components/columns/columns-def.tsx`

## 🚧 Phase 6: Utility Functions (ĐANG CHỜ)

- [ ] `lib/date-utils.ts`
  - Working days calculation
  - Date range generation
  - Holiday checking

- [ ] `lib/gantt-utils.ts`
  - Task tree building
  - WBS calculation
  - Dependency resolution

- [ ] `lib/tree-utils.ts`
  - Flatten/unflatten tree
  - Find parent/children
  - Path calculation

## 🚧 Phase 7: Custom UI Hooks (ĐANG CHỜ)

- [ ] `hooks/ui/useGanttScroll.ts` - Sync scroll between panels
- [ ] `hooks/ui/useGanttZoom.ts` - Zoom in/out timeline
- [ ] `hooks/ui/useGanttDnd.ts` - Drag & drop tasks

## 🚧 Phase 8: Integration (ĐANG CHỜ)

- [ ] Update `src/pages/ProjectDetail.tsx`
  - Import từ `@/feature/gantt`
  - Xóa imports cũ
  - Test functionality

- [ ] Update routing nếu cần

- [ ] Update `package.json` - thêm dependencies nếu thiếu:
  - [ ] `zustand`
  - [ ] `@tanstack/react-table` (nếu dùng cho table)
  - [ ] `react-hook-form` (nếu dùng cho forms)

## 🧹 Phase 9: Cleanup (ĐANG CHỜ)

- [ ] Xóa file cũ (sau khi đã migrate xong):
  - [ ] `src/components/gantt/` (toàn bộ folder)
  - [ ] `src/hooks/useTasks.ts`
  - [ ] `src/hooks/useTaskStatuses.ts`
  - [ ] `src/hooks/useTaskLabels.ts`
  - [ ] `src/hooks/useBaselines.ts`
  - [ ] `src/hooks/useProjectMilestones.ts`
  - [ ] `src/hooks/useAllocations.ts`
  - [ ] `src/hooks/useViewSettings.ts`

- [ ] Update imports trong các file khác nếu có reference

## 🧪 Phase 10: Testing (ĐANG CHỜ)

- [ ] Test với Mock data (`VITE_USE_MOCK=true`)
  - [ ] Tạo task
  - [ ] Sửa task
  - [ ] Xóa task
  - [ ] Bulk operations

- [ ] Test với Real data (Supabase)
  - [ ] CRUD operations
  - [ ] Optimistic updates
  - [ ] Error handling

- [ ] Test UI interactions
  - [ ] Zoom in/out
  - [ ] Scroll sync
  - [ ] Drag & drop
  - [ ] Filter/search

- [ ] Performance testing
  - [ ] Large dataset (1000+ tasks)
  - [ ] Virtual scrolling
  - [ ] Re-render optimization

## 📊 Progress Summary

- ✅ **Foundation**: 100% (3/3 type files)
- ✅ **Service Layer**: 100% (8/8 files)
- ✅ **State Management**: 100% (5/5 files)
- ✅ **Hooks**: 100% (5/5 files)
- 🚧 **Components**: 0% (0/20+ components)
- 🚧 **Utils**: 0% (0/3 files)
- 🚧 **Integration**: 0%
- 🚧 **Testing**: 0%

**Tổng tiến độ**: ~50% (Infrastructure hoàn thành, UI components chờ migrate)

## 🎯 Next Steps

1. **Migrate GanttView.tsx** - Component chính, ưu tiên cao nhất
2. **Tạo utility functions** - Cần thiết cho component hoạt động
3. **Migrate các dialog components** - Độc lập, dễ test
4. **Migrate grid/chart components** - Phức tạp hơn
5. **Testing & cleanup** - Bước cuối cùng

## 📝 Notes

- Giữ backward compatibility bằng cách export aliases (vd: `useTasks = useGetTasks`)
- Test kỹ trước khi xóa code cũ
- Document breaking changes (nếu có)
- Update README.md với hướng dẫn sử dụng mới
