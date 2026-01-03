#!/usr/bin/env python3
"""
Auto-refactor script to replace @/ imports with relative imports in gantt components
"""

import os
import re
from pathlib import Path

# Mapping of old imports to new imports
IMPORT_REPLACEMENTS = {
    # UI Components - from @/components/ui/* to ../components/internal/ui
    r"from ['\"]@/components/ui/button['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/input['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/label['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/dialog['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/select['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/checkbox['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/separator['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/popover['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/calendar['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/tooltip['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/alert-dialog['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/resizable['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/scroll-area['\"]": "from '../components/internal/ui'",
    r"from ['\"]@/components/ui/textarea['\"]": "from '../components/internal/ui'",
    
    # Utils
    r"from ['\"]@/lib/utils['\"]": "from '../components/internal/utils'",
    
    # Types from hooks - move to gantt.types.ts
    r"import \{ Task \} from ['\"]@/hooks/useTasks['\"]": "import type { Task } from '../types/gantt.types'",
    r"import \{ TaskLabel \} from ['\"]@/hooks/useTaskLabels['\"]": "import type { TaskLabel } from '../types/gantt.types'",
    r"import \{ TaskStatus \} from ['\"]@/hooks/useTaskStatuses['\"]": "import type { TaskStatus } from '../types/gantt.types'",
    r"import \{ ProjectMilestone \} from ['\"]@/hooks/useProjectMilestones['\"]": "import type { ProjectMilestone } from '../types/gantt.types'",
    r"import \{ TaskBarLabels \} from ['\"]@/hooks/useViewSettings['\"]": "import type { TaskBarLabels } from '../types/gantt.types'",
    r"import \{ Baseline \} from ['\"]@/hooks/useBaselines['\"]": "import type { Baseline } from '../types/gantt.types'",
    
    # Export types
    r"export type \{ TaskBarLabels \} from ['\"]@/hooks/useViewSettings['\"]": "export type { TaskBarLabels } from '../types/gantt.types'",
    r"export type \{ Task \} from ['\"]@/hooks/useTasks['\"]": "export type { Task } from '../types/gantt.types'",
}

def refactor_file(filepath):
    """Refactor a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for pattern, replacement in IMPORT_REPLACEMENTS.items():
            content = re.sub(pattern, replacement, content)
        
        # Also handle multi-import statements
        # import { Button, Input } from '@/components/ui/button' -> consolidate
        content = refactor_multi_imports(content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error refactoring {filepath}: {e}")
        return False

def refactor_multi_imports(content):
    """Handle consolidated imports from same module"""
    # This is complex, so we'll do it in two passes
    
    # Pass 1: Consolidate all UI imports
    ui_components = set()
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        # Detect UI component imports
        if re.search(r"from ['\"]@/components/ui/", line):
            # Extract component names
            match = re.search(r"import \{ ([^}]+) \}", line)
            if match:
                components = match.group(1)
                for comp in components.split(','):
                    ui_components.add(comp.strip())
            # Don't add this line, we'll consolidate later
        elif re.search(r"from ['\"]\.\./(components/internal/ui|components/internal/utils)['\"]", line):
            # Keep existing consolidated imports
            new_lines.append(line)
        else:
            new_lines.append(line)
    
    # Add consolidated import if we found UI components
    if ui_components:
        # Check if we already have a consolidated import
        has_ui_import = any("from '../components/internal/ui'" in line for line in new_lines)
        if not has_ui_import:
            # Find the right place to insert (after other imports)
            insert_pos = 0
            for i, line in enumerate(new_lines):
                if line.startswith('import '):
                    insert_pos = i + 1
            
            components_str = ', '.join(sorted(ui_components))
            new_lines.insert(insert_pos, f"import {{ {components_str} }} from '../components/internal/ui';")
    
    return '\n'.join(new_lines)

def main():
    """Main function"""
    gantt_dir = Path('src/features/gantt')
    
    if not gantt_dir.exists():
        print(f"Error: {gantt_dir} does not exist")
        return
    
    # Find all .tsx files
    tsx_files = list(gantt_dir.rglob('*.tsx'))
    
    print(f"Found {len(tsx_files)} .tsx files")
    
    refactored = 0
    for filepath in tsx_files:
        if refactor_file(filepath):
            refactored += 1
            print(f"✓ Refactored {filepath}")
    
    print(f"\nTotal refactored: {refactored} files")

if __name__ == '__main__':
    main()
