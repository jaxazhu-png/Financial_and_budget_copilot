import presentationConfig from "../generated/presentation-config.json";

const GROUP_ROUTE = { g02: "perf", g03: "budexec", g06: "rcreports" };

export function keyify(value) {
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

export function getKpiOverride(route, metricKey) {
  return presentationConfig.kpis?.[route]?.[metricKey] ?? null;
}

export function getKpiDisplay(route, metricKey, fallback) {
  return getKpiOverride(route, metricKey)?.displayValue ?? fallback;
}

export function getChartPoint(route, chartKey, itemKey, seriesKey) {
  return presentationConfig.charts?.[route]?.[chartKey]?.[String(itemKey)]?.[seriesKey] ?? null;
}

export function getChartNumber(route, chartKey, itemKey, seriesKey, fallback) {
  return getChartPoint(route, chartKey, itemKey, seriesKey)?.value ?? fallback;
}

export function getChartDisplay(route, chartKey, itemKey, seriesKey, fallback) {
  const item = getChartPoint(route, chartKey, itemKey, seriesKey);
  return item?.displayValue || fallback;
}

export function getPageContent(route, collectionKey, fallback = []) {
  const items = presentationConfig.pages?.[route]?.[collectionKey];
  if (!Array.isArray(items) || !items.length) return fallback;
  return items.map((item) => item.payload);
}

export function getPageCollection(route, collectionKey) {
  const items = presentationConfig.pages?.[route]?.[collectionKey];
  return Array.isArray(items) ? items : [];
}

export function getPageItem(route, collectionKey, itemKey, fallback = null) {
  const item = getPageCollection(route, collectionKey).find((entry) => entry.key === itemKey);
  return item?.payload ?? fallback;
}

export function getAlgorithmAnnotations(route, pageKey, fallback = []) {
  const items = presentationConfig.algorithms?.[route];
  if (!Array.isArray(items) || !items.length) return fallback;
  const filtered = pageKey ? items.filter((item) => item.pageKey === pageKey || item.pageKey === "*") : items;
  return filtered.length ? filtered : fallback;
}

export function getPageConfigComponents(route, types = null) {
  const items = presentationConfig.pageConfig?.[route];
  if (!Array.isArray(items) || !items.length) return [];
  if (!types) return items;
  const typeSet = new Set(Array.isArray(types) ? types : [types]);
  return items.filter((item) => typeSet.has(item.type));
}

export function getPageConfigComponent(route, componentKey, fallback = null) {
  if (!componentKey) return fallback;
  return getPageConfigComponents(route).find((item) => item.key === componentKey) ?? fallback;
}

function sameConfigName(item, label) {
  const key = keyify(typeof label === "object" ? (label.en || label.zh || label.ar) : label);
  if (!key) return false;
  return keyify(item.displayName?.en) === key || keyify(item.displayName?.zh) === key || keyify(item.displayName?.ar) === key;
}

export function findPageConfigComponent(route, { componentKeys = [], label = null, types = null } = {}) {
  const keySet = new Set((Array.isArray(componentKeys) ? componentKeys : [componentKeys]).filter(Boolean));
  const items = getPageConfigComponents(route, types);
  return items.find((item) => keySet.has(item.key)) || (label ? items.find((item) => sameConfigName(item, label)) : null) || null;
}

function localizedFromComponent(component, field, fallback) {
  const value = component?.[field] || {};
  const next = {
    en: value.en || value.zh || value.ar || "",
    zh: value.zh || value.en || value.ar || "",
    ar: value.ar || value.en || value.zh || "",
  };
  if (typeof fallback === "string") return next.en || next.zh || fallback;
  return {
    ...(fallback || {}),
    en: next.en || fallback?.en || "",
    zh: next.zh || fallback?.zh || next.en || "",
    ar: next.ar || fallback?.ar || next.en || "",
  };
}

export function localizedComponentTitle(component, fallback) {
  return localizedFromComponent(component, "displayName", fallback);
}

export function localizedComponentNote(component, fallback) {
  return localizedFromComponent(component, "note", fallback);
}

function hasLocalizedText(value) {
  return !!(value && typeof value === "object" && (value.en || value.zh || value.ar));
}

function mergeLocalized(fallback, override) {
  if (!hasLocalizedText(override)) return fallback;
  if (typeof fallback === "string") return override.en || override.zh || override.ar || fallback;
  return {
    ...(fallback || {}),
    en: override.en || fallback?.en || override.zh || override.ar || "",
    zh: override.zh || fallback?.zh || override.en || override.ar || "",
    ar: override.ar || fallback?.ar || override.en || override.zh || "",
  };
}

export function getOrchestratorConfig(route) {
  return presentationConfig.orchestrators?.[route] ?? null;
}

function configuredArray(fallback, override) {
  if (!Array.isArray(override) || !override.length) return fallback;
  if (Array.isArray(fallback) && fallback.length > 1 && override.length === 1) return fallback;
  return override;
}

export function applyOrchestratorConfig(route, cfg) {
  const override = getOrchestratorConfig(route);
  if (!override) return cfg;
  const next = { ...cfg };
  if (override.uc) next.uc = override.uc;
  if (override.run) next.run = override.run;
  if (override.agent) next.agent = mergeLocalized(cfg.agent, override.agent);
  if (override.defaultPrompt) next.defaultPrompt = mergeLocalized(cfg.defaultPrompt, override.defaultPrompt);
  if (override.startLog) next.startLog = mergeLocalized(cfg.startLog, override.startLog);
  if (override.reviewLog) next.reviewLog = mergeLocalized(cfg.reviewLog, override.reviewLog);
  if (override.approveLog) next.approveLog = mergeLocalized(cfg.approveLog, override.approveLog);
  if (override.returnLog) next.returnLog = mergeLocalized(cfg.returnLog, override.returnLog);
  if (override.reviewBody) next.reviewBody = mergeLocalized(cfg.reviewBody, override.reviewBody);
  if (override.approveLabel) next.approveLabel = mergeLocalized(cfg.approveLabel, override.approveLabel);
  if (override.approvedChip) next.approvedChip = mergeLocalized(cfg.approvedChip, override.approvedChip);
  if (override.returnBody) next.returnBody = mergeLocalized(cfg.returnBody, override.returnBody);
  if (Array.isArray(override.chips) && override.chips.length) next.chips = override.chips;
  next.prompts = configuredArray(cfg.prompts, override.prompts);
  next.tlMeta = configuredArray(cfg.tlMeta, override.tlMeta);
  next.diff = configuredArray(cfg.diff, override.diff);
  next.nextActions = configuredArray(cfg.nextActions, override.nextActions);
  if (Array.isArray(override.dataBindings) && override.dataBindings.length) next.dataBindings = override.dataBindings;
  return next;
}

function applyPageConfigToKpiCard(route, card, componentKeys, label) {
  const component = findPageConfigComponent(route, {
    componentKeys,
    label,
    types: ["carousel_metric", "kpi_card"],
  });
  if (!component) return card;
  const next = { ...card };
  if (component.value) next.v = component.value;
  return next;
}

function routeSmartQueries(route) {
  const items = presentationConfig.smartQueries;
  if (!Array.isArray(items) || !items.length) return [];
  return items.filter((item) => item?.enabled !== false && item?.scope?.route === route);
}

function routeSourceLabel(items) {
  const sourceTypes = new Set(items.map((item) => item?.mockData?.[0]?.sourceType).filter(Boolean));
  if (sourceTypes.has("MIXED_SAMPLE")) {
    return {
      en: "sample + assumptions",
      zh: "样例数据 + 假设",
      ar: "عينة + افتراضات",
    };
  }
  if (sourceTypes.has("REAL_SAMPLE")) {
    return {
      en: "sample-backed",
      zh: "样例数据支撑",
      ar: "مدعوم بالعينة",
    };
  }
  if (sourceTypes.has("MOCK")) {
    return {
      en: "mock where sample is unavailable",
      zh: "样例缺失处使用 mock",
      ar: "محاكاة عند غياب العينة",
    };
  }
  return {
    en: "configured",
    zh: "已配置",
    ar: "مهيأ",
  };
}

export function getSmartQueryFabConfig(route, fallbackScope = null, fallbackPrompts = []) {
  const items = routeSmartQueries(route);
  if (items.length) {
    const first = items[0];
    const source = routeSourceLabel(items);
    return {
      scope: {
        en: `Scope: ${first.scope?.pageEn || first.scope?.page || route} · ${source.en}`,
        zh: `范围:${first.scope?.page || first.scope?.pageEn || route} · ${source.zh}`,
        ar: `النطاق: ${first.scope?.pageEn || first.scope?.page || route} · ${source.ar}`,
      },
      prompts: items.map((item) => ({
        en: item.userQuestion?.en || item.userQuestion?.zh || item.id,
        zh: item.userQuestion?.zh || item.userQuestion?.en || item.id,
        ar: item.userQuestion?.ar || item.userQuestion?.en || item.userQuestion?.zh || item.id,
        configId: item.id,
      })),
      items,
    };
  }
  const orchestrator = getOrchestratorConfig(route);
  if (orchestrator?.prompts?.length) {
    return {
      scope: fallbackScope,
      prompts: orchestrator.prompts.map((prompt) => ({
        en: prompt.t?.en || prompt.t?.zh || "",
        zh: prompt.t?.zh || prompt.t?.en || "",
        ar: prompt.t?.ar || prompt.t?.en || prompt.t?.zh || "",
      })).filter((prompt) => prompt.en || prompt.zh || prompt.ar),
      items: [],
    };
  }
  return { scope: fallbackScope, prompts: fallbackPrompts, items: [] };
}

export function applyKpiSlides(route, slides) {
  return slides.map((cards, slideIndex) => cards.map((card, cardIndex) => {
    const label = card.lab?.en ?? card.lab?.zh ?? "metric";
    const baseKey = `slide.${slideIndex + 1}.${keyify(label)}`;
    const positionalKeys = [
      baseKey,
      `carousel.s${slideIndex + 1}.${cardIndex + 1}`,
      `kpi.s${slideIndex + 1}.${cardIndex + 1}`,
      `kpi.${cardIndex + 1}`,
      keyify(label),
    ];
    if (card.aging) {
      const configuredAgingCard = {
        ...card,
        aging: card.aging.map((bucket) => {
          const item = getKpiOverride(route, `${baseKey}.bucket.${keyify(bucket[0])}`);
          return item ? [bucket[0], item.numericValue ?? bucket[1], item.displayValue] : bucket;
        }),
      };
      return applyPageConfigToKpiCard(route, configuredAgingCard, positionalKeys, card.lab);
    }
    if (card.act) {
      return {
        ...card,
        esc: getKpiDisplay(route, `${baseKey}.escalations`, card.esc),
        total: getKpiDisplay(route, `${baseKey}.total`, card.total),
        items: (card.items || []).map((item, itemIndex) => ({
          ...item,
          v: getKpiDisplay(route, `${baseKey}.action.${itemIndex + 1}`, item.v),
        })),
      };
    }
    const item = getKpiOverride(route, baseKey);
    const configuredCard = item ? { ...card, v: item.displayValue, configStatus: item.status || card.configStatus } : card;
    return applyPageConfigToKpiCard(route, configuredCard, positionalKeys, card.lab);
  }));
}

function overrideRows(route, chartKey, rows, fieldMap, getItemKey = (row) => row.key) {
  return (rows || []).map((row, index) => {
    const itemKey = String(getItemKey(row, index));
    const next = { ...row };
    Object.entries(fieldMap).forEach(([field, seriesKey]) => {
      next[field] = getChartNumber(route, chartKey, itemKey, seriesKey, row[field]);
    });
    return next;
  });
}

function overrideRegionalMap(route, regionalMap) {
  if (!regionalMap) return regionalMap;
  if (regionalMap.variant === "matrix") {
    return {
      ...regionalMap,
      rows: regionalMap.rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => ({
          ...cell,
          value: getChartNumber(route, "regional_map", `${row.key}.${cell.key}`, "execution_rate", cell.value),
        })),
      })),
    };
  }
  return {
    ...regionalMap,
    regions: regionalMap.regions.map((region) => ({
      ...region,
      colorMetric: getChartNumber(route, "regional_map", region.key, "color_metric", region.colorMetric),
      tooltipRows: region.tooltipRows.map((row) => {
        const seriesKey = keyify(row.label);
        const point = getChartPoint(route, "regional_map", region.key, seriesKey);
        return point ? { ...row, value: point.displayValue || String(point.value) } : row;
      }),
    })),
  };
}

function overrideTimeComparison(route, data) {
  if (!data) return data;
  return {
    ...data,
    series: data.series.map((row) => ({
      ...row,
      budget: getChartNumber(route, "time_comparison", keyify(row.label), "primary", row.budget),
      actual: getChartNumber(route, "time_comparison", keyify(row.label), "secondary", row.actual),
    })),
  };
}

export function applyDashboardPresentationConfig(groupContext, dashboard) {
  const route = GROUP_ROUTE[groupContext];
  if (!route) return dashboard;
  return {
    ...dashboard,
    kpis: dashboard.kpis.map((kpi) => {
      const item = getKpiOverride(route, `dashboard.${kpi.key}`);
      return item ? { ...kpi, value: item.displayValue, status: item.status || kpi.status } : kpi;
    }),
    regionalMap: overrideRegionalMap(route, dashboard.regionalMap),
    timeComparison: overrideTimeComparison(route, dashboard.timeComparison),
    doorAnalysis: overrideRows(route, "door_analysis", dashboard.doorAnalysis, { budget: "budget", planned: "planned", actual: "actual", remaining: "remaining", rate: "rate", variance: "variance" }),
    serviceAnalysis: overrideRows(route, "service_analysis", dashboard.serviceAnalysis, { revised: "budget", spent: "actual", remaining: "remaining", rate: "rate" }),
    initiativeAnalysis: overrideRows(route, "initiative_analysis", dashboard.initiativeAnalysis, { budgetValue: "budget", actualValue: "actual", remainingValue: "remaining" }),
    contractAnalysis: overrideRows(route, "contract_analysis", dashboard.contractAnalysis, { count: "count", share: "share" }),
    revenueSourceAnalysis: overrideRows(route, "revenue_sources", dashboard.revenueSourceAnalysis, { target: "target", netInvoiced: "net_invoiced", collected: "collected", collectionRate: "collection_rate", sourceWeight: "source_weight", yoy: "yoy" }),
    receivableProgress: overrideRows(route, "receivables", dashboard.receivableProgress, { amount: "amount" }),
    regionalCollectionAnalysis: overrideRows(route, "regional_collection", dashboard.regionalCollectionAnalysis, { annualTarget: "annual_target", netInvoiced: "net_invoiced", collected: "collected", actualRate: "actual_rate", targetRate: "target_rate", collectionGap: "collection_gap" }),
  };
}

export default presentationConfig;
