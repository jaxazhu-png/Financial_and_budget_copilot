# Excel-Driven Presentation Data

## Goal

Use a repository-tracked Excel workbook as the single editable source for the demo's KPI values and numerical chart series. Page structure, routing, component visibility, table copy, and narrative text remain code-owned.

## Deployment Flow

```text
config/MOMAH_Demo_Presentation_Data.xlsx
  -> schema and uniqueness validation
  -> src/generated/presentation-config.json
  -> Vite application build
  -> Vercel preview / production deployment
```

Local development compiles the workbook before Vite starts and watches it for changes. GitHub pushes trigger Vercel builds; a valid workbook produces a new preview or production deployment. A structurally invalid workbook fails the build, leaving the previous Vercel deployment active.

## Workbook Contract

The workbook contains these editable sheets:

- `KPI配置`: `route`, `metric_key`, display value, optional numeric value, status, and description.
- `图表数据`: `route`, `chart_key`, `item_key`, dimension label, series key, numeric value, optional display value, status, and description.
- `使用说明`: editing and publishing instructions.
- `枚举说明`: supported routes, chart keys, series keys, and value conventions.

The compound keys `route + metric_key` and `route + chart_key + item_key + series_key` must be unique. Identifiers are immutable; editors normally change only value, display-value, and status columns.

## Runtime Boundaries

- Department KPI carousels resolve workbook overrides at the shared `KpiCarousel` boundary.
- Platform and storyline KPI cards resolve workbook overrides through shared KPI helpers.
- UC06 dashboards apply overrides to the complete dashboard model returned by `getDashboardData`.
- App-level charts resolve workbook series through stable route, chart, item, and series identifiers.
- Missing workbook entries fall back to the existing code value so a partial workbook cannot blank a page.

## Error Handling

- Missing workbook or required worksheet: build failure.
- Missing required column, duplicate compound key, invalid numeric chart value, or empty identifier: build failure with row number.
- Missing optional metric: runtime fallback to the current code value.
- Unknown extra row: retained in generated JSON and reported as a warning; it does not break rendering.

## GitHub and Vercel

The canonical workbook lives inside the repository. Saving it locally updates the running Vite demo through the watcher. Updating a deployed demo requires committing and pushing the workbook; Vercel then validates, builds, and deploys it. Because Excel is binary, one person should edit the canonical workbook at a time. If parallel department ownership becomes necessary, split the workbook by department in a later change.

## Verification

- Compile the untouched workbook and compare representative KPI and chart values with current defaults.
- Change one department KPI and one chart point, recompile, and verify the generated JSON and rendered page.
- Confirm duplicate keys and nonnumeric chart values fail validation.
- Run the production Vite build used by Vercel.
- Check Financial Performance, Budget Execution, Revenue Collection, Assets, Reporting, and the platform home page.

## Rollback

Revert the workbook commit. GitHub/Vercel will rebuild the previous configuration. No database or external state is involved.
