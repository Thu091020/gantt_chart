# Changelog

All notable changes to the Gantt Feature will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-03

### 🎉 Initial Standalone Release

Complete restructure to create a portable, standalone Gantt chart feature.

### ✨ Added

#### Configuration & Architecture
- **Adapter Pattern**: Added `adapters/` folder with dependency injection interfaces
  - `IGanttConfig` for overall configuration
  - `IGanttDatabaseAdapter` for database clients
  - `IGanttUIComponents` for UI component injection
  - `IGanttUtilityFunctions` for utility functions (cn, toast)
  - `IGanttAuthAdapter` for authentication
  - Optional adapters for external data hooks
- **Configuration System**: `configureGantt()` function for setup
- **Service Factory**: Auto-switch between real and mock services
- **Clean Public API**: Comprehensive exports in `index.ts`

#### Documentation
- **START_HERE.md**: Quick start guide and navigation
- **README.md**: Comprehensive documentation with architecture, features, and API reference
- **INTEGRATION_GUIDE.md**: Step-by-step integration instructions
- **RESTRUCTURE_SUMMARY.md**: Summary of restructuring changes
- **CURRENT_STRUCTURE.md**: Current folder structure reference
- **config.example.ts**: Complete configuration example
- **package.json**: NPM package configuration

#### Features
- Timeline views (Day, Week, Month, Quarter)
- Drag & Drop task management
- Task dependencies with visual lines
- Progress tracking with visual bars
- Project milestones
- Customizable task labels and statuses
- Multi-user task assignments
- Baseline comparison
- Advanced filtering
- Configurable grid columns
- Mock data support for testing
- Real-time collaboration support (optional)

#### Core Modules
- **Types**: Complete TypeScript definitions
  - `task.types.ts`: Task, TaskDependency, TaskPriority
  - `allocation.types.ts`: TaskAllocation, AllocationWithEmployee
  - `gantt.types.ts`: CustomColumn, TimelineColumn, TaskBarDimensions
- **Services**: Data access layer
  - API services for Supabase
  - Mock services for testing
  - Service interfaces
  - Service factory for switching
- **Store**: Zustand state management
  - View state slice
  - Task state slice
  - UI state slice
  - Memoized selectors
- **Hooks**: React hooks for all functionality
  - Query hooks (React Query)
  - Mutation hooks
  - UI hooks (DnD, Scroll, Zoom)
  - Business logic hooks
- **Components**: Full UI component library
  - Task bars and visualizations
  - Grid columns
  - Timeline rendering
  - Toolbar and controls
  - Dialog modals
- **Utilities**: Helper functions
  - Date calculations with working days
  - Tree operations (WBS, hierarchy)
  - Gantt-specific utilities

### 🔄 Changed

- **Architecture**: Migrated from direct dependencies to adapter pattern
- **Exports**: Consolidated all exports into clean public API
- **Dependencies**: Changed from hard-coded imports to injected dependencies
- **Documentation**: Reorganized from 20+ scattered files to 7 focused documents

### 🗑️ Removed

- Hard-coded external dependencies
- Direct imports from `@/hooks`, `@/components`, `@/integrations`
- Scattered documentation files (moved to `docs/archive/`)

### 📦 Package Info

- **Name**: @your-org/gantt-feature
- **Version**: 1.0.0
- **Type**: Standalone React Feature Module
- **License**: MIT

### 🛠️ Technical Details

#### Dependencies
- React 18+
- TypeScript 5+
- @tanstack/react-query ^5.0.0
- zustand ^4.0.0
- date-fns ^2.30.0 || ^3.0.0
- @supabase/supabase-js ^2.0.0
- @dnd-kit/core ^6.0.0 (optional)
- @dnd-kit/sortable ^8.0.0 (optional)

#### Peer Dependencies
All major dependencies are peer dependencies to avoid version conflicts.

#### File Structure
```
gantt/
├── adapters/        - Dependency injection
├── types/           - Type definitions
├── services/        - Data layer
├── store/           - State management
├── hooks/           - React hooks
├── lib/             - Utilities
├── components/      - UI components
├── pages/           - Page components
├── context/         - React context
└── docs/            - Documentation
```

### 🎯 Breaking Changes

This is the initial standalone release. Previous versions were tightly coupled with the host application.

**Migration Path**:
1. Copy the entire `gantt/` folder to your project
2. Create a configuration file (see `config.example.ts`)
3. Call `configureGantt()` in your app initialization
4. Update imports to use the new public API

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed migration instructions.

### 🔮 Future Plans

- [ ] Extract as standalone npm package
- [ ] Add comprehensive unit tests
- [ ] Add E2E tests
- [ ] Performance optimizations
- [ ] More export formats (PDF, Excel, etc.)
- [ ] Advanced collaboration features
- [ ] Plugin system for extensibility
- [ ] Theming system
- [ ] Accessibility improvements
- [ ] Mobile responsiveness

---

## [0.x.x] - Pre-release versions

Previous versions were part of the main application codebase and are not tracked here.
See `docs/archive/` for historical documentation.

---

## Legend

- ✨ Added: New features
- 🔄 Changed: Changes in existing functionality
- 🗑️ Removed: Removed features
- 🐛 Fixed: Bug fixes
- 🔒 Security: Security fixes
- 📦 Dependencies: Dependency updates
- 📚 Documentation: Documentation changes
- 🎨 Style: Code style changes
- ♻️ Refactor: Code refactoring
- ⚡ Performance: Performance improvements

---

**Note**: This changelog follows [semantic versioning](https://semver.org/). Breaking changes are clearly marked and migration guides are provided.
