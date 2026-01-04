#!/usr/bin/env node

/**
 * GANTT FEATURE - QUICK START GUIDE
 * 
 * This guide shows how to use the self-contained Gantt feature in your project.
 * 
 * ✅ Everything is self-contained - no external dependencies needed!
 * ✅ Just copy the feature folder and install required libraries
 * ✅ Fully supports dark/light mode
 * ✅ Complete color system included
 */

// ============================================================================
// 1. BASIC SETUP
// ============================================================================

/**
 * In your main app component (e.g., App.tsx):
 */

import React, { useState } from 'react';
import GanttView from './features/gantt/pages/GanttView';

export function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <html className={isDark ? 'dark' : ''}>
      <body>
        {/* Your app content */}
        <GanttView />
        
        {/* Dark mode toggle */}
        <button onClick={() => setIsDark(!isDark)}>
          Toggle Dark Mode
        </button>
      </body>
    </html>
  );
}

// ============================================================================
// 2. COLOR SYSTEM USAGE
// ============================================================================

/**
 * Option 1: Use the React hook (recommended for components)
 */

import { useGanttTheme } from './features/gantt/lib/colors';

function MyTaskCard() {
  const { colors, isDark } = useGanttTheme();

  return (
    <div style={{
      backgroundColor: colors.surfacePrimary,
      color: colors.textPrimary,
      border: `1px solid ${colors.borderPrimary}`,
      padding: '16px',
      borderRadius: '8px'
    }}>
      Task Card
    </div>
  );
}

/**
 * Option 2: Direct color access (when you don't need React)
 */

import { getGanttColor, getGanttColors } from './features/gantt/lib/colors';

// Get single color
const textColor = getGanttColor('textPrimary');
console.log('Primary text color:', textColor);

// Get all colors
const allColors = getGanttColors();
console.log('All colors:', allColors);

/**
 * Option 3: Status colors (for task badges)
 */

import { getStatusColors } from './features/gantt/lib/colors';

const statusColors = getStatusColors('done');
console.log('Done status colors:', statusColors);
// Output: { bg: '#dcfce7', text: '#14532d', border: '#86efac' }

/**
 * Option 4: Tailwind classes (for dynamic styling)
 */

import { getTailwindClasses } from './features/gantt/lib/colors';

const textColorClass = getTailwindClasses('textPrimary');
console.log('Tailwind class:', textColorClass);
// Output: 'text-slate-900' (light) or 'text-slate-100' (dark)

// ============================================================================
// 3. DARK MODE SETUP
// ============================================================================

/**
 * The color system automatically detects dark mode by checking:
 * 1. If document.documentElement has 'dark' class
 * 2. If OS prefers dark mode (prefers-color-scheme: dark)
 * 
 * You can enable dark mode in multiple ways:
 */

// Method 1: Add class to HTML element
document.documentElement.classList.toggle('dark', true);

// Method 2: Use HTML attribute
document.documentElement.className = isDark ? 'dark' : '';

// Method 3: Let OS preference handle it (automatic)
// Just don't add 'dark' class, system will use prefers-color-scheme

// ============================================================================
// 4. CUSTOM COLORS
// ============================================================================

/**
 * To customize colors for your project:
 * 
 * Edit src/features/gantt/lib/colors.ts
 * 
 * Find the LIGHT_COLORS object:
 */

export const LIGHT_COLORS = {
  // Change these values to your brand colors
  taskBarBackground: '#YOUR_BRAND_BLUE',  // Default: '#dbeafe'
  taskBarBorder: '#YOUR_BRAND_DARKER_BLUE',  // Default: '#3b82f6'
  statusSuccess: '#YOUR_BRAND_GREEN',     // Default: '#10b981'
  statusWarning: '#YOUR_BRAND_ORANGE',    // Default: '#f59e0b'
  statusError: '#YOUR_BRAND_RED',         // Default: '#ef4444'
  
  // ... and update DARK_COLORS the same way
};

// ============================================================================
// 5. PORTABILITY - USING IN ANOTHER PROJECT
// ============================================================================

/**
 * To use the Gantt feature in a different project:
 * 
 * 1. Copy the entire gantt folder:
 *    cp -r src/features/gantt /path/to/other-project/src/features/
 * 
 * 2. Install required dependencies (if not already installed):
 *    npm install react typescript
 *    npm install date-fns lucide-react sonner
 *    npm install @radix-ui/react-select @radix-ui/react-scroll-area
 *    npm install -D tailwindcss
 * 
 * 3. Import and use:
 *    import GanttView from './features/gantt/pages/GanttView';
 * 
 * That's it! The color system comes with it automatically.
 */

// ============================================================================
// 6. COMPLETE COMPONENT EXAMPLE
// ============================================================================

import { useGanttTheme, getStatusColors } from './features/gantt/lib/colors';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'inProgress' | 'done' | 'blocked';
  startDate: Date;
  endDate: Date;
}

function GanttTaskBadge({ task }: { task: Task }) {
  const { colors } = useGanttTheme();
  const statusColor = getStatusColors(task.status);

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px',
      backgroundColor: colors.surfacePrimary,
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: '8px'
    }}>
      {/* Task title */}
      <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
        {task.title}
      </span>

      {/* Status badge */}
      <span style={{
        backgroundColor: statusColor.bg,
        color: statusColor.text,
        border: `1px solid ${statusColor.border}`,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500
      }}>
        {task.status}
      </span>

      {/* Timeline indicator */}
      <div style={{
        flex: 1,
        height: '24px',
        backgroundColor: colors.taskBarBackground,
        border: `1px solid ${colors.taskBarBorder}`,
        borderRadius: '4px',
        marginTop: '-6px',
        marginBottom: '-6px'
      }} />
    </div>
  );
}

// ============================================================================
// 7. CSS VARIABLES USAGE
// ============================================================================

/**
 * For global styling with CSS variables:
 */

import { generateCSSVariables, isDarkMode } from './features/gantt/lib/colors';

function GlobalStyles() {
  const cssVars = generateCSSVariables(isDarkMode());

  return (
    <style>{`
      :root {
        ${cssVars}
      }
    `}</style>
  );
}

// Then use CSS variables in your styles:
// background-color: var(--gantt-background);
// color: var(--gantt-text-primary);
// border-color: var(--gantt-border-primary);

// ============================================================================
// 8. TESTING COLORS IN DIFFERENT MODES
// ============================================================================

/**
 * You can test colors programmatically:
 */

import { isDarkMode, getGanttColor } from './features/gantt/lib/colors';

function testColors() {
  console.log('Dark mode enabled:', isDarkMode());
  console.log('Primary color:', getGanttColor('textPrimary'));
  console.log('Success color:', getGanttColor('statusSuccess'));

  // Toggle dark mode and check colors change
  document.documentElement.classList.toggle('dark');
  console.log('After toggle:');
  console.log('Dark mode enabled:', isDarkMode());
  console.log('Primary color:', getGanttColor('textPrimary'));
}

// ============================================================================
// 9. DEPENDENCIES SUMMARY
// ============================================================================

/**
 * The Gantt feature requires these npm packages:
 * 
 * Core (essential):
 * - react ^18.0.0
 * - typescript ^5.0.0 (optional but recommended)
 * - tailwindcss ^3.0.0
 * 
 * Data & Utilities:
 * - date-fns ^2.30.0
 * - @supabase/supabase-js ^2.0.0
 * 
 * UI Components:
 * - lucide-react ^0.263.0
 * - sonner ^1.0.0
 * - @radix-ui/react-select ^latest
 * - @radix-ui/react-scroll-area ^latest
 * - @radix-ui/react-dialog ^latest
 * - @radix-ui/react-dropdown-menu ^latest
 * - ... (other shadcn components)
 * 
 * Install all with:
 * npm install react date-fns lucide-react sonner @supabase/supabase-js
 * 
 * The COLOR SYSTEM has ZERO additional dependencies!
 */

// ============================================================================
// 10. TROUBLESHOOTING
// ============================================================================

/**
 * Q: Colors aren't changing in dark mode?
 * A: Make sure 'dark' class is on the HTML element or OS preference is set
 * 
 * Q: Can I use different colors for different themes?
 * A: Yes, customize LIGHT_COLORS and DARK_COLORS in colors.ts
 * 
 * Q: How do I export colors for my design system?
 * A: Use design-tokens.json as reference, or copy the values
 * 
 * Q: Can I add new colors?
 * A: Yes, add to LIGHT_COLORS and DARK_COLORS, then update STATUS_COLORS if needed
 * 
 * Q: Do I need to install anything else?
 * A: No! Just copy the gantt folder and use it. Only library dependencies matter.
 */

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * ✅ Gantt Feature - Completely Self-Contained
 * 
 * What's included:
 * ✓ Full Gantt chart visualization
 * ✓ Task management
 * ✓ Timeline with dependencies
 * ✓ Dark/light mode support
 * ✓ Self-contained color system
 * ✓ No external color dependencies
 * ✓ Responsive design
 * ✓ Error handling
 * ✓ Type-safe (TypeScript)
 * 
 * How to use:
 * 1. Copy src/features/gantt folder
 * 2. Install: npm install react date-fns lucide-react sonner @supabase/supabase-js
 * 3. Import: import GanttView from './features/gantt/pages/GanttView'
 * 4. Use colors: import { useGanttTheme } from './features/gantt/lib/colors'
 * 5. Done!
 * 
 * For questions: See src/features/gantt/COLORS_README.md
 */

export default {
  MyTaskCard,
  GanttTaskBadge,
  testColors,
  GlobalStyles
};
