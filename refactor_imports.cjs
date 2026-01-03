#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Auto-refactor @/ imports to relative imports in gantt feature
 */

const REPLACEMENTS = [
  // Replace @/components/ui/* with ../components/internal/ui
  [/from ['"]@\/components\/ui\/button['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/input['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/label['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/dialog['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/select['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/checkbox['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/separator['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/popover['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/calendar['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/tooltip['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/alert-dialog['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/resizable['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/scroll-area['"]/g, "from '../internal/ui'"],
  [/from ['"]@\/components\/ui\/textarea['"]/g, "from '../internal/ui'"],
  
  // Replace @/lib/utils with ../internal/utils
  [/from ['"]@\/lib\/utils['"]/g, "from '../internal/utils'"],
  
  // Replace @/hooks type imports
  [/import \{ Task \} from ['"]@\/hooks\/useTasks['"]/g, "import type { Task } from '../../types/gantt.types'"],
  [/import \{ TaskLabel \} from ['"]@\/hooks\/useTaskLabels['"]/g, "import type { TaskLabel } from '../../types/gantt.types'"],
  [/import \{ TaskStatus \} from ['"]@\/hooks\/useTaskStatuses['"]/g, "import type { TaskStatus } from '../../types/gantt.types'"],
  [/import \{ ProjectMilestone \} from ['"]@\/hooks\/useProjectMilestones['"]/g, "import type { ProjectMilestone } from '../../types/gantt.types'"],
  [/import \{ TaskBarLabels \} from ['"]@\/hooks\/useViewSettings['"]/g, "import type { TaskBarLabels } from '../../types/gantt.types'"],
  [/import \{ Baseline \} from ['"]@\/hooks\/useBaselines['"]/g, "import type { Baseline } from '../../types/gantt.types'"],
  
  // Export types
  [/export type \{ TaskBarLabels \} from ['"]@\/hooks\/useViewSettings['"]/g, "export type { TaskBarLabels } from '../../types/gantt.types'"],
];

function refactorFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    for (const [pattern, replacement] of REPLACEMENTS) {
      content = content.replace(pattern, replacement);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error refactoring ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

// Start refactoring
const ganttDir = path.join(__dirname, 'src/features/gantt');

if (!fs.existsSync(ganttDir)) {
  console.error(`Error: ${ganttDir} does not exist`);
  process.exit(1);
}

let count = 0;
walkDir(ganttDir, (filePath) => {
  if (refactorFile(filePath)) {
    count++;
    console.log(`✓ Refactored ${path.relative(process.cwd(), filePath)}`);
  }
});

console.log(`\n✅ Total refactored: ${count} files`);
