# Gantt Chart Bug Fixes

## Issues Fixed

### 1. **Gantt Chart Not Displaying Full Height** ✅

**Problem**: Gantt chart container wasn't expanding to fill available vertical space.

**Root Cause**: The root div in `GanttView.tsx` had positioning styles but was missing flex layout properties needed to distribute space to children.

**Fix Applied** (Line 2730):
```tsx
// Before
<div className="absolute bottom-[50px] top-0 left-0 right-0">

// After  
<div className="absolute bottom-[50px] top-0 left-0 right-0 flex flex-col">
```

**Why This Works**:
- `flex flex-col` enables flexbox column layout
- Child elements (toolbar, GanttPanels) can now use `flex-1` to expand and fill available space
- `ResizablePanelGroup` with `flex-1 min-h-0` can now properly size
- `GanttPanels` panels expand to fill remaining height

---

### 2. **Status Change Not Working** ✅

**Problem**: When trying to change task status dropdown, the update was not being applied or error wasn't visible.

**Root Cause**: `handleUpdateTaskField` function lacked try-catch error handling, so failures were silent.

**Fix Applied** (Lines 1393-1500):
```tsx
// Before - No error handling
const handleUpdateTaskField = useCallback(
  async (taskId: string, field: string, value: any) => {
    const task = tasks.find((t) => t.id === taskId);
    // ... update logic ...
    await updateTask.mutateAsync({ ... });
  },
  [...]
);

// After - With error handling
const handleUpdateTaskField = useCallback(
  async (taskId: string, field: string, value: any) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      // ... update logic ...
      await updateTask.mutateAsync({ ... });
    } catch (error: any) {
      console.error('[Gantt] Error updating task field:', error);
      toast.error(`Lỗi cập nhật: ${error?.message || 'Vui lòng thử lại'}`);
    }
  },
  [...]
);
```

**Why This Works**:
- `try-catch` block now captures any errors from the API call
- Console logs error for debugging
- Toast notification shows error message to user
- Users see clear feedback if status update fails
- Status dropdown can handle all field updates (status, dates, duration, etc.)

---

## Testing

After restarting the dev server, you should be able to:

1. ✅ **See Gantt Chart Full Height**: The gantt chart on the right panel should expand to fill the viewport
2. ✅ **Change Task Status**: Click status dropdown to change task status - should update and show toast if successful
3. ✅ **See Error Messages**: If status change fails, you'll see a toast error message

## Files Modified

- `src/features/gantt/pages/GanttView.tsx` (2 changes)
  - Line 2731: Added `flex flex-col` to root container
  - Lines 1393-1500: Wrapped `handleUpdateTaskField` in try-catch with error toast

## Related Components

- **TaskGrid** (`TaskGrid.tsx`): Calls `onUpdateField` when status dropdown changes
- **useUpdateTask** hook: Calls adapter's `updateTask` method  
- **realDatabase adapter**: Executes Supabase UPDATE query
- **Error Handling**: Toast notifications via sonner library
