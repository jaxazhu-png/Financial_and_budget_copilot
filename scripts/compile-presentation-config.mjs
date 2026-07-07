import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import XLSX from "xlsx";

const root = process.cwd();
const workbookPath = path.join(root, "config", "MOMAH_Demo_Presentation_Data.xlsx");
const pageConfigWorkbookPath = path.join(root, "config", "MOMAH_Demo_Page_Config.xlsx");
const kpiChartConfigWorkbookPath = path.join(root, "config", "MOMAH_Demo_KPI_Chart_Config.xlsx");
const smartQueryConfigPath = path.join(root, "config", "MOMAH_Demo_Smart_Query_Config.json");
const outputPath = path.join(root, "src", "generated", "presentation-config.json");

const KPI_SHEET = "KPI配置";
const CHART_SHEET = "图表数据";
const PAGE_CONTENT_SHEET = "页面内容";
const ALGORITHM_SHEET = "算法标注";
const KPI_REQUIRED = ["route", "metric_key", "展示值"];
const CHART_REQUIRED = ["route", "chart_key", "item_key", "series_key", "数值"];
const PAGE_CONTENT_REQUIRED = ["route", "collection_key", "item_key", "payload_json"];
const ALGORITHM_REQUIRED = ["route", "page_key", "algorithm_key", "算法中文名", "Algorithm Name"];

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

function readOptionalRows(workbook, sheetName, requiredColumns) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return readRows(workbook, sheetName, requiredColumns);
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

function keyify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/<=|≤/g, " le ")
    .replace(/>=|≥/g, " ge ")
    .replace(/>/g, " gt ")
    .replace(/</g, " lt ")
    .replace(/\+/g, " plus ")
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseJsonCell(value, sheetName, rowNumber, column) {
  const raw = String(value ?? "").trim();
  if (!raw) fail(`工作表“${sheetName}”第 ${rowNumber} 行“${column}”不能为空`);
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`工作表“${sheetName}”第 ${rowNumber} 行“${column}”不是有效 JSON：${error.message}`);
  }
}

function multilingual(row, zhColumn, enColumn, arColumn) {
  const zh = String(row[zhColumn] ?? row[enColumn] ?? row[arColumn] ?? "").trim();
  const en = String(row[enColumn] ?? row[zhColumn] ?? row[arColumn] ?? "").trim();
  const ar = String(row[arColumn] ?? row[enColumn] ?? row[zhColumn] ?? "").trim();
  return { zh, en, ar };
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

function compilePageContent(rows) {
  const result = {};
  const seen = new Set();
  rows.forEach((row, index) => {
    if (!isEnabled(row["启用"])) return;
    const rowNumber = index + 2;
    const route = requiredText(row.route, PAGE_CONTENT_SHEET, rowNumber, "route");
    const collectionKey = requiredText(row.collection_key, PAGE_CONTENT_SHEET, rowNumber, "collection_key");
    const itemKey = requiredText(row.item_key, PAGE_CONTENT_SHEET, rowNumber, "item_key");
    const compoundKey = `${route}::${collectionKey}::${itemKey}`;
    if (seen.has(compoundKey)) fail(`工作表“${PAGE_CONTENT_SHEET}”第 ${rowNumber} 行存在重复键：${compoundKey}`);
    seen.add(compoundKey);
    result[route] ??= {};
    result[route][collectionKey] ??= [];
    result[route][collectionKey].push({
      key: itemKey,
      order: optionalNumber(row["排序"], PAGE_CONTENT_SHEET, rowNumber, "排序") ?? result[route][collectionKey].length + 1,
      algorithmKey: String(row["算法ID"] ?? "").trim(),
      payload: parseJsonCell(row.payload_json, PAGE_CONTENT_SHEET, rowNumber, "payload_json"),
      description: String(row["描述"] ?? "").trim(),
    });
  });
  Object.values(result).forEach((collections) => {
    Object.values(collections).forEach((items) => items.sort((a, b) => a.order - b.order));
  });
  return result;
}

function compileAlgorithms(rows) {
  const result = {};
  const seen = new Set();
  rows.forEach((row, index) => {
    if (!isEnabled(row["启用"])) return;
    const rowNumber = index + 2;
    const route = requiredText(row.route, ALGORITHM_SHEET, rowNumber, "route");
    const pageKey = requiredText(row.page_key, ALGORITHM_SHEET, rowNumber, "page_key");
    const algorithmKey = requiredText(row.algorithm_key, ALGORITHM_SHEET, rowNumber, "algorithm_key");
    const compoundKey = `${route}::${pageKey}::${algorithmKey}`;
    if (seen.has(compoundKey)) fail(`工作表“${ALGORITHM_SHEET}”第 ${rowNumber} 行存在重复键：${compoundKey}`);
    seen.add(compoundKey);
    result[route] ??= [];
    result[route].push({
      key: algorithmKey,
      pageKey,
      order: optionalNumber(row["排序"], ALGORITHM_SHEET, rowNumber, "排序") ?? result[route].length + 1,
      position: String(row["展示位置"] ?? "page").trim() || "page",
      title: {
        zh: requiredText(row["算法中文名"], ALGORITHM_SHEET, rowNumber, "算法中文名"),
        en: requiredText(row["Algorithm Name"], ALGORITHM_SHEET, rowNumber, "Algorithm Name"),
        ar: String(row["算法阿文名"] ?? row["Algorithm Name"] ?? "").trim(),
      },
      inputs: multilingual(row, "输入", "Inputs", "المدخلات"),
      method: multilingual(row, "方法", "Method", "الطريقة"),
      output: multilingual(row, "输出", "Output", "المخرجات"),
      confidence: String(row["置信度"] ?? "").trim(),
      description: multilingual(row, "说明", "Description", "الوصف"),
    });
  });
  Object.values(result).forEach((items) => items.sort((a, b) => a.order - b.order));
  return result;
}

function cleanPageCell(row, column) {
  const raw = String(row[column] ?? "").trim();
  if (raw === "40" && column !== "value" && column !== "sort_order") return "";
  if (raw === "40" && ["page_header", "page_meta", "smart_question", "filter", "action", "copilot_prompt"].includes(String(row.component_type ?? "").trim())) {
    return "";
  }
  return raw;
}

function firstText(row, columns) {
  for (const column of columns) {
    const value = cleanPageCell(row, column);
    if (value) return value;
  }
  return "";
}

function parseOptionalJson(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "40") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function looseNumber(value) {
  const match = String(value ?? "").replaceAll(",", "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function configNumber(value, fallbackValue = "") {
  if (value === "" || value === null || value === undefined) return looseNumber(fallbackValue);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : looseNumber(value) ?? looseNumber(fallbackValue);
}

function boolOrNull(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "y", "是", "启用"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "否", "停用"].includes(normalized)) return false;
  return null;
}

function pageRoutes(value) {
  return String(value ?? "")
    .split(/[\/,;|]/)
    .map((route) => route.trim())
    .filter(Boolean);
}

function compilePageWorkbook(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const result = {};
  workbook.SheetNames.forEach((sheetName) => {
    if (sheetName === "README") return;
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
    rows.forEach((row, index) => {
      if (!("component_type" in row) || !("component_key" in row) || !("route" in row)) return;
      if (!isEnabled(row.enabled)) return;
      const routes = pageRoutes(row.route);
      const type = cleanPageCell(row, "component_type");
      const key = cleanPageCell(row, "component_key");
      if (type === "algorithm_note") return;
      if (!routes.length || !type || !key) return;
      const item = {
        key,
        type,
        pageKey: cleanPageCell(row, "page_key") || sheetName,
        section: {
          en: cleanPageCell(row, "section_en"),
          zh: cleanPageCell(row, "section_zh"),
        },
        displayName: {
          en: cleanPageCell(row, "display_name_en"),
          zh: cleanPageCell(row, "display_name_zh"),
        },
        value: cleanPageCell(row, "value"),
        unit: cleanPageCell(row, "unit"),
        note: {
          en: cleanPageCell(row, "note_en"),
          zh: cleanPageCell(row, "note_zh"),
        },
        dataSource: cleanPageCell(row, "data_source"),
        formulaOrAlgorithm: {
          en: cleanPageCell(row, "formula_or_algorithm_en"),
          zh: cleanPageCell(row, "formula_or_algorithm_zh"),
        },
        visualType: cleanPageCell(row, "visual_type"),
        dimension: cleanPageCell(row, "dimension"),
        metric: cleanPageCell(row, "metric"),
        sampleData: parseOptionalJson(row.sample_data_json),
        target: cleanPageCell(row, "target_route_or_action"),
        order: optionalNumber(row.sort_order, sheetName, index + 2, "sort_order") ?? index + 1,
      };
      routes.forEach((route) => {
        result[route] ??= [];
        result[route].push(item);
      });
    });
  });
  Object.values(result).forEach((items) => items.sort((a, b) => a.order - b.order));
  return result;
}

function mergePageConfig(...sources) {
  const result = {};
  sources.forEach((source) => {
    Object.entries(source || {}).forEach(([route, items]) => {
      result[route] ??= [];
      items.forEach((item) => {
        const existingIndex = result[route].findIndex((current) => current.type === item.type && current.key === item.key);
        if (existingIndex >= 0) result[route][existingIndex] = item;
        else result[route].push(item);
      });
    });
  });
  Object.values(result).forEach((items) => items.sort((a, b) => a.order - b.order));
  return result;
}

function mergeDeep(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] ??= {};
      mergeDeep(target[key], value);
    } else {
      target[key] = value;
    }
  });
  return target;
}

function compileKpiChartWorkbook(filePath) {
  const empty = { kpis: {}, charts: {}, pageConfig: {}, rows: 0 };
  if (!fs.existsSync(filePath)) return empty;
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const result = { kpis: {}, charts: {}, pageConfig: {}, rows: 0 };

  function cellText(value) {
    return String(value ?? "").trim();
  }

  function isBlankRow(row) {
    return !row || row.every((cell) => cellText(cell) === "");
  }

  function sheetMatrix(sheetName) {
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: true });
  }

  function findSection(matrix, title) {
    return matrix.findIndex((row) => cellText(row?.[0]) === title);
  }

  function rowObject(headers, values) {
    const row = {};
    headers.forEach((header, index) => {
      if (header) row[header] = values[index] ?? "";
    });
    return row;
  }

  function pageMeta(matrix, sheetName) {
    const index = findSection(matrix, "页面元信息");
    if (index < 0) return null;
    const headers = (matrix[index + 1] || []).map(cellText);
    const values = matrix[index + 2] || [];
    const meta = rowObject(headers, values);
    const route = cellText(meta.route);
    if (!route) fail(`工作表“${sheetName}”页面元信息缺少 route`);
    return {
      route,
      pageId: cellText(meta.page_id) || sheetName,
      group: cellText(meta.group),
      ucCode: cellText(meta.uc_code),
      pageCn: cellText(meta.page_cn),
      pageEn: cellText(meta.page_en),
      note: cellText(meta["备注"]),
    };
  }

  function sectionRows(matrix, title) {
    const titleIndex = findSection(matrix, title);
    if (titleIndex < 0) return [];
    const headerIndex = titleIndex + 1;
    const headers = (matrix[headerIndex] || []).map(cellText);
    const rows = [];
    for (let rowIndex = headerIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
      const row = matrix[rowIndex] || [];
      const first = cellText(row[0]);
      if (["页面元信息", "KPI配置区", "Chart配置区"].includes(first)) break;
      if (isBlankRow(row)) {
        if (rows.length) break;
        continue;
      }
      rows.push({ rowNumber: rowIndex + 1, row: rowObject(headers, row) });
    }
    return rows;
  }

  function inferKpiType(key) {
    if (/^(carousel|slide)\./i.test(key)) return "carousel_metric";
    if (/report/i.test(key)) return "report_indicator";
    return "kpi_card";
  }

  function addKpi(meta, entry, sheetName) {
    const row = entry.row;
    const key = requiredText(row.kpi_key, sheetName, entry.rowNumber, "kpi_key");
    const displayValue = cellText(row["指标值"]);
    const displayName = {
      en: cellText(row["英文名称"]) || key,
      zh: cellText(row["中文名称"]) || cellText(row["英文名称"]) || key,
      ar: cellText(row["英文名称"]) || cellText(row["中文名称"]) || key,
    };
    const item = {
      key,
      type: inferKpiType(key),
      pageKey: meta.pageId,
      section: {
        en: "KPI configuration",
        zh: "KPI配置区",
      },
      displayName,
      value: displayValue,
      unit: cellText(row["单位"]),
      note: {
        en: cellText(row["备注"]),
        zh: cellText(row["备注"]),
        ar: cellText(row["备注"]),
      },
      dataSource: cellText(row["数据来源"]),
      sampleSourceType: cellText(row["数据标记"]),
      sampleBatch: cellText(row["样例数据批次"]),
      sampleFieldMapping: cellText(row["样例字段或口径"]),
      formulaOrAlgorithm: {
        en: cellText(row["指标算法"]),
        zh: cellText(row["指标算法"]),
      },
      visualType: inferKpiType(key) === "carousel_metric" ? "metric_card" : "kpi_card",
      dimension: "",
      metric: key,
      sampleData: null,
      target: "",
      order: result.pageConfig[meta.route]?.length ? result.pageConfig[meta.route].length + 1 : entry.rowNumber,
    };
    result.pageConfig[meta.route] ??= [];
    result.pageConfig[meta.route].push(item);
    const payload = {
      displayValue,
      numericValue: configNumber(displayValue),
      unit: item.unit,
      status: "",
      labelZh: displayName.zh,
      labelEn: displayName.en,
      description: item.note.zh || item.formulaOrAlgorithm.zh,
      sampleImportMode: "",
      sampleGroup: meta.group,
      sampleDataset: meta.pageId,
      samplePath: item.dataSource,
      sampleField: key,
      sampleSourceType: item.sampleSourceType,
      sampleBatch: item.sampleBatch,
      sampleFieldMapping: item.sampleFieldMapping,
      summaryAggregation: "",
    };
    result.kpis[meta.route] ??= {};
    result.kpis[meta.route][key] = payload;
    const nameKey = keyify(displayName.en || displayName.zh);
    if (nameKey) result.kpis[meta.route][nameKey] = payload;
    result.rows += 1;
  }

  function chartPointPayload(point, fallback = {}) {
    return {
      value: point.value,
      displayValue: cellText(point.displayValue ?? point.value ?? ""),
      unit: cellText(point.unit ?? fallback.unit),
      status: cellText(point.status ?? ""),
      dimensionLabel: cellText(point.dimensionLabel ?? point.dimension ?? fallback.dimension),
      seriesLabel: cellText(point.seriesLabel ?? point.metric ?? fallback.seriesLabel),
      description: cellText(point.description ?? fallback.description),
      sampleImportMode: cellText(point.sampleImportMode ?? fallback.sampleImportMode),
      sampleGroup: cellText(point.sampleGroup ?? fallback.sampleGroup),
      sampleDataset: cellText(point.sampleDataset ?? fallback.sampleDataset),
      samplePath: cellText(point.samplePath ?? fallback.samplePath),
      sampleField: cellText(point.sampleField ?? fallback.sampleField),
      sampleSourceType: cellText(point.sampleSourceType ?? fallback.sampleSourceType),
      sampleBatch: cellText(point.sampleBatch ?? fallback.sampleBatch),
      sampleFieldMapping: cellText(point.sampleFieldMapping ?? fallback.sampleFieldMapping),
      summaryAggregation: cellText(point.summaryAggregation ?? fallback.summaryAggregation),
    };
  }

  function addChartValue(route, chartKey, itemKey, seriesKey, point) {
    const value = configNumber(point.value ?? point.displayValue);
    if (value === null) return;
    result.charts[route] ??= {};
    result.charts[route][chartKey] ??= {};
    result.charts[route][chartKey][itemKey] ??= {};
    result.charts[route][chartKey][itemKey][seriesKey] = chartPointPayload({ ...point, value });
  }

  function addChart(meta, entry, sheetName) {
    const row = entry.row;
    const chartKey = requiredText(row.chart_key, sheetName, entry.rowNumber, "chart_key");
    const params = parseJsonCell(row["chart配置参数_json"], sheetName, entry.rowNumber, "chart配置参数_json");
    const componentType = cellText(params.componentType || params.type || row["chart类型"] || "chart_point");
    const componentKey = cellText(params.componentKey || `${chartKey}.${entry.rowNumber}`);
    const displayValue = cellText(params.displayValue ?? params.value ?? "");
    const item = {
      key: componentKey,
      type: componentType,
      pageKey: meta.pageId,
      section: {
        en: "Chart configuration",
        zh: "Chart配置区",
      },
      displayName: {
        en: cellText(row["chart英文名称"]) || chartKey,
        zh: cellText(row["chart中文名"]) || cellText(row["chart英文名称"]) || chartKey,
        ar: cellText(row["chart英文名称"]) || cellText(row["chart中文名"]) || chartKey,
      },
      value: displayValue,
      unit: cellText(params.unit),
      note: {
        en: cellText(row["备注"]),
        zh: cellText(row["备注"]),
        ar: cellText(row["备注"]),
      },
      dataSource: cellText(row["数据来源"] || params.samplePath),
      sampleSourceType: cellText(row["数据标记"] || params.sampleSourceType),
      sampleBatch: cellText(row["样例数据批次"] || params.sampleBatch),
      sampleFieldMapping: cellText(row["样例字段或口径"] || params.sampleFieldMapping),
      formulaOrAlgorithm: {
        en: "",
        zh: "",
      },
      visualType: cellText(row["chart类型"] || params.visualType || componentType),
      dimension: cellText(params.dimension || params.dimensionLabel),
      metric: cellText(params.metric || params.seriesKey),
      chartKey: cellText(params.chartKey || chartKey),
      itemKey: cellText(params.itemKey || componentKey),
      seriesKey: cellText(params.seriesKey || params.metric || "value"),
      sampleImportMode: cellText(params.sampleImportMode),
      sampleGroup: cellText(params.sampleGroup || meta.group),
      sampleDataset: cellText(params.sampleDataset || meta.pageId),
      samplePath: cellText(params.samplePath || row["数据来源"]),
      sampleFilter: params.sampleFilter || null,
      sampleField: cellText(params.sampleField),
      sampleSourceType: cellText(row["数据标记"] || params.sampleSourceType),
      sampleBatch: cellText(row["样例数据批次"] || params.sampleBatch),
      sampleFieldMapping: cellText(row["样例字段或口径"] || params.sampleFieldMapping),
      summaryAggregation: cellText(params.summaryAggregation),
      sampleData: params.sampleData ?? null,
      target: "",
      order: result.pageConfig[meta.route]?.length ? result.pageConfig[meta.route].length + 1 : entry.rowNumber,
    };
    result.pageConfig[meta.route] ??= [];
    result.pageConfig[meta.route].push(item);
    const fallback = {
      unit: item.unit,
      dimension: item.dimension,
      seriesLabel: item.metric,
      description: item.note.zh || item.note.en,
      sampleImportMode: item.sampleImportMode,
      sampleGroup: item.sampleGroup,
      sampleDataset: item.sampleDataset,
      samplePath: item.samplePath,
      sampleField: item.sampleField,
      sampleSourceType: item.sampleSourceType,
      sampleBatch: item.sampleBatch,
      sampleFieldMapping: item.sampleFieldMapping,
      summaryAggregation: item.summaryAggregation,
    };
    const points = [];
    if (Array.isArray(params.points)) points.push(...params.points);
    if (Array.isArray(params.series)) points.push(...params.series);
    if (!points.length && (params.value !== undefined || params.displayValue !== undefined)) points.push(params);
    points.forEach((point) => {
      const pointChartKey = cellText(point.chartKey || params.chartKey || chartKey);
      const itemKey = cellText(point.itemKey || point.dimensionKey || params.itemKey || componentKey);
      const seriesKey = cellText(point.seriesKey || point.metricKey || params.seriesKey || params.metric || "value");
      addChartValue(meta.route, pointChartKey, itemKey, seriesKey, { ...fallback, ...point });
    });
    result.rows += 1;
  }

  workbook.SheetNames.forEach((sheetName) => {
    const matrix = sheetMatrix(sheetName);
    const meta = pageMeta(matrix, sheetName);
    if (!meta) return;
    sectionRows(matrix, "KPI配置区").forEach((entry) => {
      if (!cellText(entry.row.kpi_key)) return;
      addKpi(meta, entry, sheetName);
    });
    sectionRows(matrix, "Chart配置区").forEach((entry) => {
      if (!cellText(entry.row.chart_key)) return;
      addChart(meta, entry, sheetName);
    });
  });
  Object.values(result.pageConfig).forEach((items) => items.sort((a, b) => a.order - b.order));
  return result;
}

function localizedFromValue(value, fallback = "") {
  if (value && typeof value === "object") {
    const en = String(value.en ?? value.zh ?? value.ar ?? fallback ?? "").trim();
    const zh = String(value.zh ?? value.en ?? value.ar ?? fallback ?? "").trim();
    const ar = String(value.ar ?? value.en ?? value.zh ?? fallback ?? "").trim();
    return { en, zh, ar };
  }
  const text = String(value ?? fallback ?? "").trim();
  return { en: text, zh: text, ar: text };
}

function compileSmartQueryConfig(filePath) {
  const empty = { orchestrators: {}, items: [] };
  if (!fs.existsSync(filePath)) return empty;
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`智能问数配置不是有效 JSON：${error.message}`);
  }
  const items = Array.isArray(raw.items) ? raw.items.filter((item) => isEnabled(item.enabled)) : [];
  const base = raw.orchestrators && typeof raw.orchestrators === "object" ? raw.orchestrators : {};
  const result = {};

  function ensureOrch(route) {
    const fromBase = base[route] || {};
    const orch = result[route] ??= {
      chips: Array.isArray(fromBase.chips) ? fromBase.chips : [],
      prompts: [],
      tlMeta: Array.isArray(fromBase.tlMeta) ? fromBase.tlMeta : [],
      diff: Array.isArray(fromBase.diff) ? fromBase.diff : [],
      nextActions: Array.isArray(fromBase.nextActions) ? fromBase.nextActions : [],
      dataBindings: [],
    };
    ["uc", "run", "agent", "defaultPrompt", "startLog", "reviewLog", "approveLog", "returnLog", "reviewBody", "approveLabel", "approvedChip", "returnBody"].forEach((key) => {
      if (fromBase[key] !== undefined && orch[key] === undefined) orch[key] = fromBase[key];
    });
    return orch;
  }

  Object.keys(base).forEach(ensureOrch);

  items.forEach((item, index) => {
    const route = String(item.scope?.route ?? "").trim();
    if (!route) fail(`智能问数配置第 ${index + 1} 条缺少 scope.route`);
    const orch = ensureOrch(route);
    const mock = Array.isArray(item.mockData) ? item.mockData[0] || {} : {};
    orch.prompts.push({
      order: index + 1,
      t: localizedFromValue(item.userQuestion, item.id),
      s: localizedFromValue(item.businessIntentLabel, item.businessIntent),
      sampleImportMode: String(mock.mode ?? "").trim(),
      sampleGroup: String(mock.group ?? item.scope?.group ?? "").trim(),
      sampleDataset: String(mock.dataset ?? "").trim(),
      samplePath: String(mock.sourcePath ?? "").trim(),
      sampleSourceType: String(mock.sourceType ?? "").trim(),
      sampleBatch: String(mock.sampleBatch ?? "").trim(),
      sampleFields: Array.isArray(mock.sampleFields) ? mock.sampleFields : [],
    });
    (Array.isArray(item.mockData) ? item.mockData : []).forEach((binding, bindingIndex) => {
      orch.dataBindings.push({
        order: index * 100 + bindingIndex + 1,
        key: String(binding.ref ?? `${item.id}.data.${bindingIndex + 1}`).trim(),
        mode: String(binding.mode ?? "").trim(),
        group: String(binding.group ?? item.scope?.group ?? "").trim(),
        dataset: String(binding.dataset ?? "").trim(),
        path: String(binding.sourcePath ?? "").trim(),
        filter: binding.filter ?? null,
        field: String(binding.field ?? "").trim(),
        aggregation: String(binding.aggregation ?? "").trim(),
        sourceType: String(binding.sourceType ?? "").trim(),
        sampleBatch: String(binding.sampleBatch ?? "").trim(),
        sampleFields: Array.isArray(binding.sampleFields) ? binding.sampleFields : [],
        sourceKpis: "KPI配置区",
        sourceCharts: "Chart配置区",
        outputSchema: {
          answerBlocks: item.answerBlocks || [],
          table: item.table || null,
          chart: item.chart || null,
          evidence: item.evidence || [],
          nextActions: item.nextActions || [],
        },
      });
    });
    (Array.isArray(item.nextActions) ? item.nextActions : []).forEach((action, actionIndex) => {
      orch.nextActions.push({
        order: index * 100 + actionIndex + 1,
        act: localizedFromValue({ en: action.labelEn, zh: action.labelZh }, action.action),
        owner: String(action.owner ?? "").trim(),
        role: localizedFromValue(action.role ?? action.target ?? ""),
        phone: String(action.phone ?? "").trim(),
      });
    });
  });

  Object.values(result).forEach((orch) => {
    ["prompts", "dataBindings", "nextActions"].forEach((key) => {
      const seen = new Set();
      orch[key] = (orch[key] || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .filter((item) => {
          const signature = key === "prompts" ? `${item.t?.zh || item.t?.en}` : `${item.key || item.act?.zh || item.act?.en}`;
          if (!signature || seen.has(signature)) return false;
          seen.add(signature);
          return true;
        })
        .map(({ order, ...item }) => item);
    });
  });
  return { orchestrators: result, items };
}

function applyPageWorkbookKpiOverlay(compiled, pageConfig) {
  Object.entries(pageConfig).forEach(([route, items]) => {
    items.forEach((item) => {
      if (!["kpi_card", "carousel_metric", "report_indicator"].includes(item.type) || !item.value) return;
      compiled.kpis[route] ??= {};
      const payload = {
        displayValue: item.value,
        numericValue: looseNumber(item.value),
        unit: item.unit,
        status: "",
        labelZh: item.displayName.zh,
        labelEn: item.displayName.en,
        description: item.note.en || item.note.zh,
        sampleSourceType: item.sampleSourceType,
        sampleBatch: item.sampleBatch,
        sampleFieldMapping: item.sampleFieldMapping,
        samplePath: item.dataSource,
      };
      compiled.kpis[route][item.key] = payload;
      if (item.metric) compiled.kpis[route][item.metric] = payload;
      const nameKey = keyify(item.displayName.en || item.displayName.zh);
      if (nameKey) compiled.kpis[route][nameKey] = payload;
    });
  });
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
const pageContentRows = readOptionalRows(workbook, PAGE_CONTENT_SHEET, PAGE_CONTENT_REQUIRED);
const algorithmRows = readOptionalRows(workbook, ALGORITHM_SHEET, ALGORITHM_REQUIRED);
const basePageConfig = compilePageWorkbook(pageConfigWorkbookPath);
const kpiChartConfig = compileKpiChartWorkbook(kpiChartConfigWorkbookPath);
const pageConfig = mergePageConfig(basePageConfig, kpiChartConfig.pageConfig);
const smartQueryConfig = compileSmartQueryConfig(smartQueryConfigPath);
const orchestrators = smartQueryConfig.orchestrators;
const compiled = {
  schemaVersion: 2,
  source: [
    "config/MOMAH_Demo_Presentation_Data.xlsx",
    fs.existsSync(pageConfigWorkbookPath) ? "config/MOMAH_Demo_Page_Config.xlsx" : null,
    fs.existsSync(kpiChartConfigWorkbookPath) ? "config/MOMAH_Demo_KPI_Chart_Config.xlsx" : null,
    fs.existsSync(smartQueryConfigPath) ? "config/MOMAH_Demo_Smart_Query_Config.json" : null,
  ].filter(Boolean).join(" + "),
  kpis: compileKpis(kpiRows),
  charts: compileCharts(chartRows),
  pages: compilePageContent(pageContentRows),
  algorithms: compileAlgorithms(algorithmRows),
  pageConfig,
  orchestrators,
  smartQueries: smartQueryConfig.items,
};
mergeDeep(compiled.kpis, kpiChartConfig.kpis);
mergeDeep(compiled.charts, kpiChartConfig.charts);
applyPageWorkbookKpiOverlay(compiled, pageConfig);
const changed = writeIfChanged(outputPath, compiled);
const pageConfigRows = Object.values(pageConfig).reduce((sum, items) => sum + items.length, 0);
const orchestratorRoutes = Object.keys(orchestrators).length;
console.log(`[presentation-config] ${changed ? "已生成" : "无需更新"} ${path.relative(root, outputPath)} · KPI ${kpiRows.length} 行 · 图表 ${chartRows.length} 行 · 页面 ${pageContentRows.length} 行 · 算法 ${algorithmRows.length} 行 · 页面配置 ${pageConfigRows} 行 · KPI/图表配置 ${kpiChartConfig.rows} 行 · 智能问数 ${smartQueryConfig.items.length} 条 / ${orchestratorRoutes} 个工作台`);
