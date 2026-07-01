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

export function applyKpiSlides(route, slides) {
  return slides.map((cards, slideIndex) => cards.map((card) => {
    const label = card.lab?.en ?? card.lab?.zh ?? "metric";
    const baseKey = `slide.${slideIndex + 1}.${keyify(label)}`;
    if (card.aging) {
      return {
        ...card,
        aging: card.aging.map((bucket) => {
          const item = getKpiOverride(route, `${baseKey}.bucket.${keyify(bucket[0])}`);
          return item ? [bucket[0], item.numericValue ?? bucket[1], item.displayValue] : bucket;
        }),
      };
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
    if (!item) return card;
    return { ...card, v: item.displayValue, configStatus: item.status || card.configStatus };
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
