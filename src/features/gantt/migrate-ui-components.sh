#!/bin/bash

# Migration Script: Copy UI components from old structure to new feature/gantt structure
# This script copies and updates imports to make feature/gantt standalone

set -e

SOURCE_DIR="src/components/gantt"
TARGET_DIR="src/feature/gantt"

echo "🚀 Starting Gantt Chart UI Components Migration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Copy dialog components
echo "📋 Step 1: Migrating Dialog Components..."
cp "$SOURCE_DIR/BaselineDialog.tsx" "$TARGET_DIR/components/dialogs/BaselineManagerDialog.tsx"
cp "$SOURCE_DIR/TaskFormDialog.tsx" "$TARGET_DIR/components/dialogs/CreateTaskDialog.tsx"
cp "$SOURCE_DIR/LabelSettingsDialog.tsx" "$TARGET_DIR/components/dialogs/LabelSettingsDialog.tsx"
cp "$SOURCE_DIR/StatusSettingsDialog.tsx" "$TARGET_DIR/components/dialogs/StatusSettingsDialog.tsx"
cp "$SOURCE_DIR/MilestoneDialog.tsx" "$TARGET_DIR/components/dialogs/MilestoneDialog.tsx"
echo "  ✅ 5 dialog components copied"

# Step 2: Copy toolbar components
echo "📋 Step 2: Migrating Toolbar Components..."
cp "$SOURCE_DIR/GanttToolbar.tsx" "$TARGET_DIR/components/toolbar/GanttToolbar.tsx"
echo "  ✅ Toolbar components copied"

# Step 3: Copy table/column components
echo "📋 Step 3: Migrating Table Components..."
cp "$SOURCE_DIR/TaskGrid.tsx" "$TARGET_DIR/components/columns/TaskListTable.tsx"
echo "  ✅ Table components copied"

# Step 4: Copy timeline/chart components
echo "📋 Step 4: Migrating Timeline Components..."
cp "$SOURCE_DIR/GanttChart.tsx" "$TARGET_DIR/components/timeline/ChartArea.tsx"
cp "$SOURCE_DIR/GanttPanels.tsx" "$TARGET_DIR/components/timeline/GanttPanels.tsx"
echo "  ✅ Timeline components copied"

# Step 5: Copy main page component
echo "📋 Step 5: Migrating Main Page Component..."
cp "$SOURCE_DIR/GanttView.tsx" "$TARGET_DIR/pages/GanttChart.tsx"
echo "  ✅ Main page component copied"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FILE COPY COMPLETE!"
echo ""
echo "📝 Next Steps:"
echo "1. Update imports in copied files:"
echo "   - Replace @/hooks/useBaselines → ../../hooks/queries/useSettingQueries"
echo "   - Replace @/hooks/useTasks → ../../hooks/queries/useTaskQueries"
echo "   - Replace @/hooks/useTaskLabels → ../../hooks/queries/useTaskQueries"
echo "   - Replace @/hooks/useTaskStatuses → ../../hooks/queries/useTaskQueries"
echo "   - Replace @/hooks/useProjectMilestones → ../../hooks/queries/useSettingQueries"
echo "   - Replace @/hooks/useAllocations → ../../hooks/queries/useAllocationQueries"
echo "   - Keep @/components/ui/* imports (shared UI library)"
echo "   - Keep @/lib/utils imports (shared utilities)"
echo ""
echo "2. Run TypeScript check:"
echo "   npm run type-check"
echo ""
echo "3. Fix any remaining import errors"
echo ""
echo "4. Test the migrated components"
echo ""
echo "5. Once confirmed working, delete old components/gantt folder"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
