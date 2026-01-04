# Gantt Chart Color System

## Overview

The Gantt chart feature includes a completely self-contained color design system with built-in dark/light mode support. This system has **zero external dependencies** and can be easily ported to other projects.

## File Structure

```
src/features/gantt/lib/
├── colors.ts              # TypeScript color definitions and utilities
└── design-tokens.json     # JSON reference for design tokens
```

## Usage

### 1. In React Components

Use the `useGanttTheme()` hook to access colors:

```typescript
import { useGanttTheme } from '../lib/colors';

function MyGanttComponent() {
  const { colors, tailwind, isDark } = useGanttTheme();
  
  return (
    <div style={{ 
      backgroundColor: colors.background,
      color: colors.textPrimary 
    }}>
      Content here
    </div>
  );
}
```

### 2. Direct Color Access

Get specific colors without React hook:

```typescript
import { getGanttColors, getGanttColor } from '../lib/colors';

// Get all colors for current theme
const colors = getGanttColors(); // Returns LIGHT_COLORS or DARK_COLORS

// Get specific color
const primaryText = getGanttColor('textPrimary');
const successColor = getGanttColor('statusSuccess');
```

### 3. Status Colors

Get colors for task status badges:

```typescript
import { getStatusColors } from '../lib/colors';

const { bg, text, border } = getStatusColors('done');
// Returns: { bg: '#dcfce7', text: '#14532d', border: '#86efac' }
```

### 4. Tailwind Class Names

Get Tailwind utility class names (for dynamic styling):

```typescript
import { getTailwindClasses } from '../lib/colors';

const classes = getTailwindClasses('textPrimary');
// Returns: 'text-slate-900' (light mode) or 'text-slate-100' (dark mode)
```

### 5. CSS Variables

Generate CSS custom properties for global styling:

```typescript
import { generateCSSVariables, isDarkMode } from '../lib/colors';

const cssVars = generateCSSVariables(isDarkMode());
// Use in <style> tag or inline styles
```

## Available Colors

### Background & Surface Colors

- `background` - Main background color
- `surfacePrimary` - Primary surface for cards, panels
- `surfaceSecondary` - Secondary surface (slightly darker)
- `surfaceTertiary` - Tertiary surface (darker still)

### Text Colors

- `textPrimary` - Main text color
- `textSecondary` - Secondary text (lower contrast)
- `textTertiary` - Tertiary text (even lower contrast)
- `textMuted` - Muted text (lowest contrast)

### Border Colors

- `borderPrimary` - Main borders
- `borderSecondary` - Secondary borders
- `borderLight` - Light borders

### Status Colors

- `statusSuccess` - Success/completed
- `statusWarning` - Warning/attention needed
- `statusError` - Error/failed
- `statusInfo` - Info/neutral
- `statusTodo` - Todo items
- `statusInProgress` - In progress tasks
- `statusDone` - Done/completed
- `statusBlocked` - Blocked/blocked tasks

### Component-Specific Colors

- `taskBarBackground` - Task bar fill color
- `taskBarBorder` - Task bar border
- `taskBarHover` - Task bar on hover
- `taskBarSelected` - Task bar when selected
- `taskBarProgress` - Task progress indicator

### Timeline Colors

- `timelineGrid` - Grid lines
- `timelineHeader` - Header background
- `timelineToday` - Today's cell background
- `timelineTodayMarker` - Today's date indicator line
- `nonWorkingDay` - Non-working day background
- `holiday` - Holiday background
- `weekend` - Weekend background

### Other Utility Colors

- `dependencyLine` - Dependency arrow color
- `milestoneDiamond` - Milestone marker color
- `selectionBackground` - Selection highlight
- `focusRing` - Focus outline color
- `allocationManual` - Manual allocation indicator
- `allocationAuto` - Auto allocation indicator
- `allocationOverload` - Overload indicator
- `scrollBar` - Scrollbar color
- `resizeHandle` - Resize handle color

## Dark Mode Support

The color system automatically detects dark mode by:

1. Checking if document has `dark` class: `document.documentElement.classList.contains('dark')`
2. Checking OS preference: `window.matchMedia('(prefers-color-scheme: dark)').matches`

### Enabling Dark Mode

Add `dark` class to your root element:

```html
<html class="dark">
  <!-- Dark mode is active -->
</html>
```

Or use CSS media query:

```html
<html>
  <!-- Uses OS preference -->
</html>
```

## Customizing Colors

To customize colors for your project:

1. **Edit design-tokens.json** for reference documentation
2. **Edit colors.ts** and modify the `LIGHT_COLORS` or `DARK_COLORS` objects
3. Update any component-specific color references

Example:

```typescript
export const LIGHT_COLORS = {
  // ...existing colors...
  taskBarBackground: '#YOUR_CUSTOM_COLOR', // Change this
  statusSuccess: '#YOUR_CUSTOM_GREEN',      // Or this
};
```

## Portability

To use this color system in another project:

1. Copy `src/features/gantt/lib/colors.ts`
2. Copy `src/features/gantt/lib/design-tokens.json` (optional, for reference)
3. Install required dependencies:
   ```bash
   npm install react typescript
   ```
4. Import and use as shown in the "Usage" section above

**No additional setup required** - the color system is completely self-contained.

## Type Safety

All color keys are well-documented. For TypeScript autocomplete, reference the `LIGHT_COLORS` or `DARK_COLORS` object keys:

```typescript
import { LIGHT_COLORS } from '../lib/colors';

type ColorKey = keyof typeof LIGHT_COLORS;
// Now ColorKey is typed with all available color names
```

## Performance Notes

- Color detection happens once when the module is imported
- The `isDarkMode()` function uses efficient DOM checks and media query matching
- CSS variable generation is lazy (only when called)
- No runtime color calculations or transformations

## Examples

### Task Status Badge

```typescript
import { getStatusColors } from '../lib/colors';

function TaskStatusBadge({ status }: { status: 'todo' | 'done' | 'blocked' }) {
  const colors = getStatusColors(status);
  
  return (
    <span style={{
      backgroundColor: colors.bg,
      color: colors.text,
      borderColor: colors.border,
      borderWidth: '1px',
      padding: '4px 8px',
      borderRadius: '4px'
    }}>
      {status}
    </span>
  );
}
```

### Theme-Aware Container

```typescript
import { useGanttTheme } from '../lib/colors';

function GanttContainer() {
  const { colors } = useGanttTheme();
  
  return (
    <div style={{
      backgroundColor: colors.surfacePrimary,
      color: colors.textPrimary,
      border: `1px solid ${colors.borderPrimary}`,
      padding: '16px',
      borderRadius: '8px'
    }}>
      Gantt chart content
    </div>
  );
}
```

### Dynamic Task Bar Color

```typescript
import { getGanttColor } from '../lib/colors';

function TaskBar({ isSelected }: { isSelected: boolean }) {
  const color = isSelected 
    ? getGanttColor('taskBarSelected')
    : getGanttColor('taskBarBackground');
  
  return (
    <div style={{
      backgroundColor: color,
      height: '24px',
      borderRadius: '4px'
    }}>
      Task
    </div>
  );
}
```

## Migration Guide

If you're replacing hardcoded colors in existing components:

**Before:**
```typescript
<div style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
  Content
</div>
```

**After:**
```typescript
import { useGanttTheme } from '../lib/colors';

function Component() {
  const { colors } = useGanttTheme();
  return (
    <div style={{ 
      backgroundColor: colors.surfaceSecondary, 
      color: colors.textPrimary 
    }}>
      Content
    </div>
  );
}
```

## Contributing

When adding new colors:

1. Add to both `LIGHT_COLORS` and `DARK_COLORS` objects in colors.ts
2. Maintain clear naming conventions (e.g., `componentName` + `purpose`)
3. Update design-tokens.json for documentation
4. Add example usage in this README

---

**Last Updated:** 2026-01-04  
**Version:** 1.0.0  
**Status:** Completely Self-Contained ✓
