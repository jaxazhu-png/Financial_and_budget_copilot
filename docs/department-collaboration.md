# Department Collaboration Guide

This document explains how the current demo is split by department, which files each team should own, and how to collaborate safely with Git.

## Current structure

The current split has two layers:

1. Department ownership files
   These are the new files under `src/departments/`. They define the collaboration boundary for each department.
2. Runtime implementation
   Most live workspace configuration and UI logic still runs from `src/App.jsx`. This means the ownership split is already in place, but some implementation is still centralized and will be moved gradually.

For collaboration right now, each department should start from its own `src/departments/*.js` file and only touch `src/App.jsx` when the required runtime code for that department still lives there.

## Department-to-file mapping

| Department | Ownership file | Main route(s) | Current runtime implementation |
| --- | --- | --- | --- |
| Financial Performance Analysis Department | `src/departments/financialPerformanceAnalysis.js` | `fpawork`, `perf`, `g02fpaflow` | `src/App.jsx` (`WS_CFG_FPA`, `FpaWorkspace`) + `src/uc06/Uc06App.jsx` |
| Planning Department | `src/departments/planning.js` | `plnwork`, `planning`, `g02flow` | `src/App.jsx` (`WS_CFG_PLANNING`, `PlanningWorkspace`) |
| Budget Execution Department | `src/departments/budgetExecution.js` | `buwork`, `budexec`, `budget`, `g03flow` | `src/App.jsx` (`WS_CFG_BUDEXEC`, `BudgetExecWorkspace`) |
| Financial Entitlements Department | `src/departments/financialEntitlements.js` | `entwork`, `claims`, `g04entflow` | `src/App.jsx` (`WS_CFG_ENT`, `EntitlementsWorkspace`) |
| Audit Department | `src/departments/audit.js` | `audwork`, `g04audflow`, `alerts` | `src/App.jsx` (`WS_CFG_AUDIT`, `AuditWorkspace`) |
| Financial Reporting Department | `src/departments/financialReporting.js` | `frepwork`, `reporting`, `g05repflow`, `reports` | `src/App.jsx` (`WS_CFG_REPORTING`, `ReportingWorkspace`) |
| Compliance Department | `src/departments/compliance.js` | `compwork`, `compmemo`, `g05compflow` | `src/App.jsx` (`WS_CFG_COMPLIANCE`, `ComplianceWorkspace`) |
| Cost Management Department | `src/departments/costManagement.js` | `costwork`, `csfunds`, `g05costflow` | `src/App.jsx` (`WS_CFG_COST`, `CostWorkspace`) |
| Accounting Department | `src/departments/accounting.js` | `acctwork`, `g05acctflow`, `compmemo` | `src/App.jsx` (`WS_CFG_ACCT`, `AccountingWorkspace`) |
| Revenue Collection Department | `src/departments/revenueCollection.js` | `rcwork`, `rcbench`, `rcdata`, `rcdatav1`, `rcreports`, `revassets` | `src/App.jsx` (`RcWorkspace`, `RcWorkbench`, `RcDataFlow`, embedded UC-06 launch) |
| Assets Department | `src/departments/assets.js` | `aswork`, `asbench`, `revassets`, `csfunds`, `compmemo` | `src/App.jsx` (`AssetsWorkspace`, `AssetsWorkbench`) |

## Which file should each collaborator edit?

Use this rule:

- If the change is about department identity, ownership, route scope, or file-level responsibility, edit `src/departments/<department>.js`.
- If the change is about the actual UI, KPI cards, workflow steps, prompt copy, or charts, the logic may still be in `src/App.jsx` today.
- If the change is specific to the UC-06 embedded flow, check `src/uc06/Uc06App.jsx`, `src/uc06/locales.js`, and `src/uc06/dataTemplates.jsx`.

## Safe collaboration rules

### Rule 1: One department, one branch

Each person should work in a separate branch.

Recommended branch names:

- `feat/fpa`
- `feat/planning`
- `feat/budget-execution`
- `feat/revenue-collection`
- `feat/assets`
- `feat/financial-entitlements`
- `feat/audit`
- `feat/financial-reporting`
- `feat/compliance`
- `feat/cost-management`
- `feat/accounting`

### Rule 2: Own your department file first

Before changing shared code, update your own department ownership file first. That keeps responsibility visible and makes reviews easier.

### Rule 3: Minimize shared-file edits

`src/App.jsx` is still the main conflict hotspot. If two people need to touch it in the same time window, coordinate before coding.

### Rule 4: Merge through an integration branch

Recommended flow:

1. Everyone branches from `main`
2. Each department finishes its own branch
3. Merge department branches into `integration/departments`
4. Test the full demo there
5. Merge `integration/departments` into `main`

This is safer than merging every branch directly into `main`.

## Simple Git workflow

For each collaborator:

```bash
git checkout main
git pull
git checkout -b feat/<department-name>
```

While working:

```bash
git add .
git commit -m "feat: update <department-name> demo"
git push -u origin feat/<department-name>
```

For the integrator:

```bash
git checkout main
git pull
git checkout -b integration/departments
git merge feat/<department-name-1>
git merge feat/<department-name-2>
git merge feat/<department-name-3>
```

After integration testing:

```bash
git checkout main
git merge integration/departments
git push origin main
```

## How to think about merge conflicts

Git does not merge "ideas"; it merges line changes.

- If two people change different files, Git usually merges automatically.
- If two people change different parts of the same file, Git often still merges automatically.
- If two people change the same lines in the same file, Git raises a conflict and someone must choose the final version manually.

In this repo, the highest-risk file is `src/App.jsx`, so department-level ownership should reduce how often multiple people edit the same lines there.

## Recommended next refactor

To reduce future merge conflicts further, the next step should be:

1. Move each `WS_CFG_*` department config out of `src/App.jsx`
2. Put each config next to its department ownership file
3. Keep `App.jsx` only as router + shell

Once that is done, collaboration will become much cleaner.
