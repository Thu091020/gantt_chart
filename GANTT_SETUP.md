# Gantt Feature Setup Guide

## Quick Start (Mock Mode)

The Gantt feature is now configured to automatically use **mock data** when Supabase environment variables are not set. This allows you to test the feature without API setup.

### Testing with Mock Data

Simply start the dev server:

```bash
npm run dev
```

The app will automatically:

1. Detect missing Supabase environment variables
2. Switch to **mock adapter mode**
3. Load sample tasks and allocations
4. Allow full CRUD operations on mock data (all changes are in-memory)

Check the browser console for logs like:

```
[Gantt] Using MOCK database adapter
[Mock] Task created...
```

## Switch Between Mock and Real API

### Option 1: Environment Variables (Automatic)

Create a `.env.local` file:

```env
# Leave these commented to use mock mode
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_key

# Or explicitly set gantt mode
VITE_GANTT_MODE=mock
```

### Option 2: Runtime Toggle (in Browser Console)

```javascript
// Switch to mock mode
window.__setGanttMode__('mock');

// Switch to real mode (if Supabase is configured)
window.__setGanttMode__('real');

// Check current mode
window.__getGanttMode__();
```

## API Configuration (When Ready)

To use real Supabase data, set these environment variables in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GANTT_MODE=real
```

## Features

### Mock Mode Features

- ✅ Create, read, update, delete tasks
- ✅ Manage task allocations
- ✅ Add/remove task statuses and labels
- ✅ Create/restore baselines
- ✅ All changes stored in memory (persist on page reload with storage)

### Real Mode Features

- ✅ Same as mock, but data persists to Supabase
- ✅ Real-time collaboration (when implemented)
- ✅ Multiple user access

## Troubleshooting

### "Missing Supabase environment variables" Error

- **Solution**: This is now expected. The app automatically switches to mock mode.
- Check browser console for `[Gantt] Using MOCK database adapter` message

### Task Creation Not Working

- Verify browser console doesn't show errors
- Check DevTools Network tab for API calls (should be none in mock mode)
- Verify `[Mock] Task created` log appears when creating tasks

### Want Real Supabase?

1. Create a Supabase project at https://supabase.com
2. Get your Project URL and Anon Key from Supabase dashboard
3. Add to `.env.local` as shown in "API Configuration" section
4. Restart dev server

## Architecture

```
ProjectDetail.tsx
  ↓ calls
configureGantt() with:
  - database: createDatabaseAdapter() ← auto-detects mock vs real
  - ui: shadcn/ui components
  - utils: utilities (cn, toast)
  - auth: current user info
  ↓
GanttViewWrapper
  ↓ uses
GanttContext + hooks
  ↓ calls
Mock or Real database adapter
```

The adapter is automatically selected based on:

1. `VITE_GANTT_MODE` env var (if set)
2. Supabase env var availability (if VITE_GANTT_MODE not set)
3. Falls back to 'mock' if Supabase not available
