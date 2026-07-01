import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import XLSX from "xlsx";

const root = process.cwd();
const workbookPath = path.join(root, "config", "MOMAH_Demo_Presentation_Data.xlsx");
const outputPath = path.join(root, "src", "generated", "presentation-config.json");

const KPI_SHEET = "KPI配置";
const CHART_SHEET = "图表数据";
const KPI_REQUIRED = ["route", "metric_key", "展示值"];
const CHART_REQUIRED = ["route", "chart_key", "item_key", "series_key", "数值"];

function fail(message) {
  throw new Error(`[presentation-config] ${message}`);
}

function readRows(workbook, sheetName, requiredColumns) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) fail(`缺少工作表“${sheetName}”`);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  if (!rows.length) fail(`工作表“${sheetName}”没有数据`);
  const columns = new Set(Object.keys(rows[0]));
  for (const column of requiredColumns) {
    if (!columns.has(column)) fail(`工作表“${sheetName}”缺少必填列“${column}”`);
  }
  return rows;
}

function isEnabled(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return !["0", "false", "no", "否", "停用"].includes(normalized);
}

function requiredText(value, sheetName, rowNumber, column) {
  const result = String(value ?? "").trim();
  if (!result) fail(`工作表“${sheetName}”第 ${rowNumber} 行“${column}”不能为空`);
  return result;
}

function optionalNumber(value, sheetName, rowNumber, column, required = false) {
  if (value === "" || value === null || value === undefined) {
    if (required) fail(`工作表“${sheetName}”第 ${rowNumber} 行“${column}”必须是数字`);
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(String(value).replaceAll(",", "").trim());
  if (!Number.isFinite(parsed)) fail(`工作表“${sheetName}”第 ${rowNumber} 行“${column}”不是有效数字：${value}`);
  return parsed;
}

function compileKpis(rows) {
  const result = {};
  const seen = new Set();
  rows.forEach((row, index) => {
    if (!isEnabled(row["启用"])) return;
    const rowNumber = index + 2;
    const route = requiredText(row.route, KPI_SHEET, rowNumber, "route");
    const metricKey = requiredText(row.metric_key, KPI_SHEET, rowNumber, "metric_key");
    const compoundKey = `${route}::${metricKey}`;
    if (seen.has(compoundKey)) fail(`工作表“${KPI_SHEET}”第 ${rowNumber} 行存在重复键：${compoundKey}`);
    seen.add(compoundKey);
    result[route] ??= {};
    result[route][metricKey] = {
      displayValue: requiredText(row["展示值"], KPI_SHEET, rowNumber, "展示值"),
      numericValue: optionalNumber(row["数值"], KPI_SHEET, rowNumber, "数值"),
      unit: String(row["单位"] ?? "").trim(),
      status: String(row["状态"] ?? "").trim(),
      labelZh: String(row["指标中文名"] ?? "").trim(),
      labelEn: String(row["指标英文名"] ?? "").trim(),
      description: String(row["描述"] ?? "").trim(),
    };
  });
  return result;
}

function compileCharts(rows) {
  const result = {};
  const seen = new Set();
  rows.forEach((row, index) => {
    if (!isEnabled(row["启用"])) return;
    const rowNumber = index + 2;
    const route = requiredText(row.route, CHART_SHEET, rowNumber, "route");
    const chartKey = requiredText(row.chart_key, CHART_SHEET, rowNumber, "chart_key");
    const itemKey = requiredText(row.item_key, CHART_SHEET, rowNumber, "item_key");
    const seriesKey = requiredText(row.series_key, CHART_SHEET, rowNumber, "series_key");
    const compoundKey = `${route}::${chartKey}::${itemKey}::${seriesKey}`;
    if (seen.has(compoundKey)) fail(`工作表“${CHART_SHEET}”第 ${rowNumber} 行存在重复键：${compoundKey}`);
    seen.add(compoundKey);
    result[route] ??= {};
    result[route][chartKey] ??= {};
    result[route][chartKey][itemKey] ??= {};
    result[route][chartKey][itemKey][seriesKey] = {
      value: optionalNumber(row["数值"], CHART_SHEET, rowNumber, "数值", true),
      displayValue: String(row["展示值"] ?? "").trim(),
      unit: String(row["单位"] ?? "").trim(),
      status: String(row["状态"] ?? "").trim(),
      dimensionLabel: String(row["维度标签"] ?? "").trim(),
      seriesLabel: String(row["系列名称"] ?? "").trim(),
      description: String(row["描述"] ?? "").trim(),
    };
  });
  return result;
}

function writeIfChanged(filePath, value) {
  const next = `${JSON.stringify(value, null, 2)}\n`;
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (current === next) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next);
  return true;
}

if (!fs.existsSync(workbookPath)) fail(`找不到配置文件：${workbookPath}`);
const workbook = XLSX.readFile(workbookPath, { cellDates: false });
const kpiRows = readRows(workbook, KPI_SHEET, KPI_REQUIRED);
const chartRows = readRows(workbook, CHART_SHEET, CHART_REQUIRED);
const compiled = {
  schemaVersion: 1,
  source: "config/MOMAH_Demo_Presentation_Data.xlsx",
  kpis: compileKpis(kpiRows),
  charts: compileCharts(chartRows),
};
const changed = writeIfChanged(outputPath, compiled);
console.log(`[presentation-config] ${changed ? "已生成" : "无需更新"} ${path.relative(root, outputPath)} · KPI ${kpiRows.length} 行 · 图表 ${chartRows.length} 行`);
