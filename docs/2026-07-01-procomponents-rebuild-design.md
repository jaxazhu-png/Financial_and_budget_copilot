# ProComponents Rebuild Design

Date: 2026-07-01

## Goal

Create a new isolated demo workspace based on `Vite + React + antd + ProComponents`, while preserving the current demo as-is.

Phase 1 focuses on platform shell first, then business backfill:

- new isolated workspace
- ProComponents-based layout and routing
- shared department workspace shell
- Planning Department workspace
- Financial Performance Analysis Department workspace
- shared mock and config system

The first phase prioritizes functional recovery over visual reinvention.

## New Workspace

Recommended new folder:

`03_Demo/Financial_Budgeting_Copilot_Demo_pro`

This folder is independent from the current demo and does not modify the existing runtime or source tree.

## Technical Stack

- Vite
- React
- antd
- `@ant-design/pro-components`
- lightweight app state via React context + hooks
- local mock-driven rendering

No Redux or Zustand in phase 1 unless the shell becomes too state-heavy.

## Architectural Direction

Use a platform-shell-first approach:

1. build the shared application shell
2. build reusable workspace modules
3. register department configs and route maps
4. backfill Planning and FPA workspaces into the shell
5. later migrate drill pages one by one

This keeps the rebuild expandable to more departments without repeating page-level layout code.

## Route Strategy

Primary routes in phase 1:

- `/login`
- `/`
- `/departments/planning/workspace`
- `/departments/fpa/workspace`

Reserved route groups for later:

- `/departments/planning/*`
- `/departments/fpa/*`

The shell uses `ProLayout` for the overall app frame, but the business workspace content is rendered through a shared department workspace page rather than raw Ant Design Pro templates.

## Page Shell Strategy

Both department workspaces share a common page frame:

- page header
- department responsibility summary
- storyline summary
- KPI carousel area
- Business Plaza area
- Smart Query area
- Multi-Agent Flow preview area
- quick actions area

The reusable host component is:

- `DepartmentWorkspacePage`

Each department injects its own config and mock payload instead of rebuilding the structure separately.

## Suggested Directory Structure

```text
Financial_Budgeting_Copilot_Demo_pro/
  src/
    app/
    layouts/
    config/
    mocks/
    shared/
    modules/
      workspace/
      business-plaza/
      flow/
      query/
    pages/
      planning/
      fpa/
```

### Module responsibilities

- `src/app`
  app bootstrap, providers, route entry, i18n bootstrap
- `src/layouts`
  `ProLayout`, top bar, side nav, app shell
- `src/config`
  department registry, menu model, route declarations, locale keys
- `src/mocks`
  shared schemas and page data
- `src/shared`
  common UI pieces, hooks, utils, formatting helpers, constants
- `src/modules/workspace`
  shared workspace page composition
- `src/modules/business-plaza`
  plaza list, detail expansion, status model, drill entry actions
- `src/modules/flow`
  flow preview container and later department-specific flow adapters
- `src/modules/query`
  Smart Query container, prompt presets, mock response surface
- `src/pages/planning`
  Planning Department workspace and later drill pages
- `src/pages/fpa`
  FPA workspace and later drill pages

## State Strategy

Global state is intentionally small in phase 1:

- current language
- current user role
- current department selection
- global drawers / notifications

Page-local interactive state remains inside each page or module:

- selected KPI slide
- selected Business Plaza card
- selected query prompt
- selected flow highlight

This reduces early complexity and keeps the migration easier to reason about.

## Mock Strategy

Mocks are organized by shared schema plus department/page payloads.

Shared model types:

- KPI item
- Business Plaza card
- feature status
- flow node / edge
- smart query prompt / response
- alert item

Phase 1 mock sets:

- Planning workspace mock
- FPA workspace mock
- shared business plaza statuses
- shared query and flow payload contracts

## Core Reusable Components

- `DepartmentWorkspacePage`
- `WorkspaceHero`
- `KpiCarouselPanel`
- `BusinessPlazaPanel`
- `BusinessFeatureCard`
- `BusinessFeatureDetail`
- `SmartQueryPanel`
- `FlowPreviewPanel`
- `QuickActionPanel`

These components should be designed to work from config objects and mock payloads rather than embedded business constants.

## Department Strategy For Phase 1

### Planning Department

Phase 1 scope:

- workspace shell
- KPI area
- Business Plaza cards
- Smart Query container
- Flow preview container
- quick action entry

### Financial Performance Analysis Department

Phase 1 scope:

- workspace shell
- KPI area
- Business Plaza cards
- Smart Query container
- Flow preview container
- Exception Detection quick action

Drill pages can be added after workspace parity is stable.

## Implementation Plan

### Step 1

Scaffold the new isolated project and install:

- `react`
- `react-dom`
- `antd`
- `@ant-design/pro-components`
- routing and utility dependencies required by the shell

### Step 2

Build the application shell:

- `ProLayout`
- menu model
- route registry
- language switch
- shared page container

### Step 3

Build shared modules:

- workspace composition
- KPI panel
- Business Plaza panel
- Smart Query panel
- flow preview panel
- quick action panel

### Step 4

Build shared config and mocks:

- department registry
- locale resource model
- workspace mock schema
- Planning and FPA workspace payloads

### Step 5

Render Planning and FPA workspaces inside the new shell.

### Step 6

Verify:

- routes load correctly
- both department workspaces render
- no interference with the legacy demo
- local build succeeds

## Risks

- the legacy demo mixes structure, mock, state, and presentation into very large files
- some behaviors may need selective simplification before full parity
- `Uc06App.jsx` is especially large and should not be fully migrated in phase 1

## Recommendation

Use the platform-shell-first path, but keep the first two departments close to current functional behavior.

That gives us:

- safer migration
- lower risk of breaking the current demo
- reusable structure for later department migration
