import { useEffect, useMemo, useState } from "react";
import { UC17_ANALYSIS_DIMENSIONS, UC17_BUDGET_ROWS, UC17_PERIODS } from "../data/uc17BudgetExecutionData.js";

const ALL = "all";

const uniqueValues = (rows, key) => Array.from(new Set(rows.map((row) => row[key]))).filter(Boolean);

const matches = (value, filter) => filter === ALL || value === filter;

const metricValueByDimension = (row, dimension) => {
  if (dimension === "consumed") return row.metrics.invoice + row.metrics.paid;
  if (dimension === "reserved") return row.metrics.reserved;
  if (dimension === "reconciliation") return row.metrics.reconciliation;
  return row.metrics[dimension] || 0;
};

const buildAnalysisTone = (row, dimension) => {
  if (row.status === "risk") return "risk";
  if (dimension === "freeCost" || dimension === "balance") return "opportunity";
  return "normal";
};

const buildAnalysisConclusion = (row, dimension) => {
  if (dimension === "reconciliation" && row.metrics.reconciliation !== 0) {
    return {
      en: "Etimad and SAP/Asas timing difference must be classified before report generation.",
      ar: "يجب تصنيف فرق التوقيت بين اعتماد وساب/أساس قبل إنشاء التقرير.",
      zh: "Etimad 与 SAP/Asas 存在时间性差异，生成报告前需完成差异分类。",
    };
  }
  if (row.status === "risk" && row.statusDetail.zh.includes("长期")) {
    return {
      en: "Committed amount is stale and should feed liquidity-pressure review before release.",
      ar: "الالتزام متقادم ويجب إدخاله في مراجعة ضغط السيولة قبل التحرير.",
      zh: "承诺长期未形成付款，应先进入流动性压力复核，再判断是否释放。",
    };
  }
  if (row.status === "risk" && row.metrics.available > 300) {
    return {
      en: "Available balance is idle and can become a transfer candidate after source-owner confirmation.",
      ar: "الرصيد المتاح خامل ويمكن أن يصبح مرشح مناقلة بعد تأكيد مالك المصدر.",
      zh: "可用余额处于闲置状态，经来源负责人确认后可进入转移候选池。",
    };
  }
  return {
    en: "Budget line is traceable across PR, PO, contract, invoice, payment and balance stages.",
    ar: "يمكن تتبع بند الميزانية عبر طلب الشراء وأمر الشراء والعقد والفاتورة والدفع والرصيد.",
    zh: "预算行可贯穿 PR、PO、合同、发票、付款和余额阶段追踪。",
  };
};

const buildQuestionAnswer = (tr, row, questionId) => {
  if (!row) return "";
  const base = `${row.code} · ${tr(row.name)}`;
  if (questionId === "balance") {
    return tr({
      en: `${base}: balance is ${formatSar(row.metrics.balance)}. The change is mainly driven by commitments of ${formatSar(row.metrics.committed)}, invoices of ${formatSar(row.metrics.invoice)}, payments of ${formatSar(row.metrics.paid)}, and transfer movement of ${formatSar(row.metrics.transfer)}.`,
      ar: `${base}: الرصيد ${formatSar(row.metrics.balance)}. التغير مدفوع أساساً بالتزامات ${formatSar(row.metrics.committed)} وفواتير ${formatSar(row.metrics.invoice)} ومدفوعات ${formatSar(row.metrics.paid)} وحركة مناقلة ${formatSar(row.metrics.transfer)}.`,
      zh: `${base}：当前余额为 ${formatSar(row.metrics.balance)}。余额变化主要由已承诺 ${formatSar(row.metrics.committed)}、收票 ${formatSar(row.metrics.invoice)}、实际付款 ${formatSar(row.metrics.paid)} 和转移 ${formatSar(row.metrics.transfer)} 共同造成。`,
    });
  }
  if (questionId === "stale") {
    return tr({
      en: `${base}: ${row.status === "risk" ? tr(row.statusDetail) : "no stale commitment is detected. Current payment cadence is within the expected range."}`,
      ar: `${base}: ${row.status === "risk" ? tr(row.statusDetail) : "لم يتم اكتشاف التزام متقادم، وإيقاع الدفع ضمن النطاق المتوقع."}`,
      zh: `${base}：${row.status === "risk" ? tr(row.statusDetail) : "未发现长期无发票/付款的承诺，当前付款节奏处于正常范围。"}`,
    });
  }
  return tr({
    en: `${base}: available funds are ${formatSar(row.metrics.available)}. AI recommends ${row.status === "risk" ? "holding risk-tagged funds and reviewing the suggested transfer path" : "keeping the line in normal monitoring"}.`,
    ar: `${base}: الأموال المتاحة ${formatSar(row.metrics.available)}. يوصي الذكاء الاصطناعي ${row.status === "risk" ? "بحجز الأموال ذات المخاطر ومراجعة مسار المناقلة المقترح" : "بإبقاء البند ضمن المراقبة الطبيعية"}.`,
    zh: `${base}：当前可用资金为 ${formatSar(row.metrics.available)}。AI 建议${row.status === "risk" ? "暂缓风险资金释放，并复核建议转移路径" : "保持常规监控，无需转移处理"}。`,
  });
};

export const formatSar = (value) => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) return `${sign}SAR ${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 2)}B`;
  return `${sign}SAR ${abs.toFixed(0)}M`;
};

/**
 * Owns UC17 filtering, selected budget row, Copilot answers and analysis rows.
 */
export function useBudgetExecutionMonitoring(store) {
  const { tr, route, setRoute, setBackRoute, pushLog } = store;
  const [filters, setFilters] = useState({ period: "FY2026 Q2", city: ALL, project: ALL, supplier: ALL, dimension: "consumed" });
  const [selectedId, setSelectedId] = useState(UC17_BUDGET_ROWS[0].id);
  const [questionId, setQuestionId] = useState("available");
  const [customQuestion, setCustomQuestion] = useState("");
  const [approvalState, setApprovalState] = useState("draft");

  const filteredRows = useMemo(() => UC17_BUDGET_ROWS.filter((row) =>
    matches(row.period, filters.period) &&
    matches(row.city, filters.city) &&
    matches(row.project, filters.project) &&
    matches(row.supplier, filters.supplier)
  ), [filters]);

  useEffect(() => {
    if (!filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(filteredRows[0]?.id || UC17_BUDGET_ROWS[0].id);
    }
  }, [filteredRows, selectedId]);

  const selectedRow = filteredRows.find((row) => row.id === selectedId) || filteredRows[0] || UC17_BUDGET_ROWS[0];
  const dimension = UC17_ANALYSIS_DIMENSIONS.find((item) => item.key === filters.dimension) || UC17_ANALYSIS_DIMENSIONS[0];

  const analysisRows = useMemo(() => filteredRows.map((row) => ({
    id: `${row.id}-${filters.dimension}`,
    row,
    dimension,
    value: filters.dimension === "spendRate" ? `${row.metrics.spendRate}%` : formatSar(metricValueByDimension(row, filters.dimension)),
    tone: buildAnalysisTone(row, filters.dimension),
    conclusion: buildAnalysisConclusion(row, filters.dimension),
  })), [filteredRows, filters.dimension, dimension]);

  const qaAnswer = useMemo(() => buildQuestionAnswer(tr, selectedRow, questionId), [tr, selectedRow, questionId]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const askCustomQuestion = () => {
    const text = customQuestion.toLowerCase();
    if (text.includes("balance") || text.includes("余额") || text.includes("رصيد")) {
      setQuestionId("balance");
      return;
    }
    if (text.includes("commit") || text.includes("承诺") || text.includes("invoice") || text.includes("付款") || text.includes("التزام")) {
      setQuestionId("stale");
      return;
    }
    setQuestionId("available");
  };

  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec17");
    pushLog?.(logText);
    setRoute(targetRoute);
  };

  const submitApproval = () => {
    setApprovalState("submitted");
    pushLog?.("Budget execution monitoring package submitted for approval");
  };

  return {
    tr,
    filters,
    updateFilter,
    periods: UC17_PERIODS,
    dimensions: UC17_ANALYSIS_DIMENSIONS,
    cities: uniqueValues(UC17_BUDGET_ROWS, "city"),
    projects: uniqueValues(UC17_BUDGET_ROWS, "project"),
    suppliers: uniqueValues(UC17_BUDGET_ROWS, "supplier"),
    rows: filteredRows,
    selectedRow,
    selectedId,
    setSelectedId,
    questionId,
    setQuestionId,
    customQuestion,
    setCustomQuestion,
    askCustomQuestion,
    qaAnswer,
    analysisRows,
    selectedDimension: dimension,
    approvalState,
    submitApproval,
    openRoute,
  };
}
