import React, { useState } from "react";
import * as RC from "recharts";
import { BudgetExecutionSmartQuery } from "../components/BudgetExecutionSmartQuery.jsx";
import { BudgetExecutionStoryline } from "../components/BudgetExecutionStoryline.jsx";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const fcT = (en, ar, zh) => ({ en, ar, zh });
const monthLabels = Array.from({ length: 24 }, (_, index) => {
  const date = new Date(2026, 6 + index, 1);
  return date.toLocaleString("en-US", { month: "short" }) + "'" + String(date.getFullYear()).slice(2);
});
const quarterLabel = (bucket) => {
  const index = 6 + bucket * 3;
  const year = 2026 + Math.floor(index / 12);
  const quarter = Math.floor((index % 12) / 3) + 1;
  return "Q" + quarter + "'" + String(year).slice(2);
};
const forecastMonths = Array.from({ length: 24 }, (_, index) => ({
  cap: +(0.37 + 0.018 * Math.sin(index / 2.6) + (index > 8 ? 0.012 : 0)).toFixed(3),
  conf: +(0.24 + 0.055 * Math.sin(index / 2.1) + index * 0.0025).toFixed(3),
  prob: +(0.075 + 0.022 * Math.sin(index / 1.8 + 0.7)).toFixed(3),
  fut: +(0.038 + 0.016 * Math.sin(index / 2.7 + 1.1)).toFixed(3),
}));
const conversionRate = 0.78;
const futureConversionRate = 0.6;
const forecastCeiling = 4.28;
const entities = [
  fcT("Budget Execution Department", "إدارة تنفيذ الميزانية", "预算执行部"),
  fcT("Riyadh execution portfolio", "محفظة تنفيذ الرياض", "利雅得执行组合"),
  fcT("Jeddah execution portfolio", "محفظة تنفيذ جدة", "吉达执行组合"),
  fcT("Cross-city execution pool", "مجمع التنفيذ بين المدن", "跨城市执行池"),
];
const services = [
  fcT("All execution lines", "كل بنود التنفيذ", "全部执行预算行"),
  fcT("Roads & infrastructure", "الطرق والبنية", "道路与基建"),
  fcT("Housing", "الإسكان", "住房"),
  fcT("Environment & waste", "البيئة والنفايات", "环境与废弃物"),
];
const types = [
  { key: "fixed", name: fcT("Fixed-price", "سعر ثابت", "固定价"), risk: "low" },
  { key: "cost", name: fcT("Cost-reimbursement", "سداد التكلفة", "成本补偿"), risk: "med" },
  { key: "tm", name: fcT("Time & Materials (T&M)", "الوقت والمواد", "工料(T&M)"), risk: "med" },
  { key: "idiq", name: fcT("IDIQ", "IDIQ", "不定期不定量(IDIQ)"), risk: "high" },
];
const actionNames = {
  reneg: fcT("Renegotiate", "إعادة تفاوض", "重新谈判"),
  cap: fcT("Cap / ceiling", "سقف", "设定上限"),
  resched: fcT("Reschedule", "إعادة جدولة", "重排付款"),
};
const riskText = {
  high: fcT("High", "مرتفع", "高"),
  med: fcT("Medium", "متوسط", "中"),
  low: fcT("Low", "منخفض", "低"),
};
const confidenceText = {
  high: fcT("High", "مرتفع", "高"),
  med: fcT("Medium", "متوسط", "中"),
  low: fcT("Low", "منخفض", "低"),
};
const serviceKeys = ["all", "roads", "housing", "env"];

const sumMetric = (key) => UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics[key] || 0), 0);
const amountB = (value) => "SAR " + Number(value).toFixed(2) + "B";
const toB = (valueInMillions) => +(valueInMillions / 1000).toFixed(2);
const typeForRow = (row, index) => {
  if (row.statusDetail.en.includes("without invoice")) return "idiq";
  if (row.statusDetail.en.includes("payment plan")) return "tm";
  if (row.statusDetail.en.includes("Available but idle")) return "cost";
  return types[index % types.length].key;
};
const serviceForRow = (row) => {
  const text = `${row.project} ${row.name.en}`.toLowerCase();
  if (text.includes("housing")) return "housing";
  if (text.includes("waste") || text.includes("environment")) return "env";
  return "roads";
};
const buildApprovedRows = () => UC17_BUDGET_ROWS.map((row, index) => ({
  id: `C-${row.code.slice(-4)}`,
  code: row.code,
  name: row.name,
  type: typeForRow(row, index),
  service: serviceForRow(row),
  amount: toB(row.metrics.committed || row.metrics.budget),
  plan: !row.statusDetail.en.includes("payment plan") && row.metrics.invoice > 0,
  status: row.status,
}));
const buildProcessRows = () => UC17_BUDGET_ROWS
  .filter((row) => row.status === "risk" || row.metrics.available > 250)
  .map((row, index) => ({
    id: `P-${row.code.slice(-4)}`,
    code: row.code,
    name: row.name,
    type: typeForRow(row, index + 1),
    service: serviceForRow(row),
    amount: toB(row.metrics.available + Math.max(row.metrics.reserved || 0, 0)),
    prob: row.status === "risk" ? 0.55 + (index % 3) * 0.08 : 0.78,
    statusDetail: row.statusDetail,
  }));
const actualRows = [
  { period: "Q1'26", forecast: 1.58, actual: 1.64 },
  { period: "Q2'26", forecast: 1.72, actual: 1.61 },
  { period: "Q3'26", forecast: 1.84, actual: 1.91 },
];
const changeRows = [
  { type: "new", name: fcT("Execution rows loaded into forecast", "تحميل بنود التنفيذ في التنبؤ", "执行行已装入预测"), amount: 0.42, why: fcT("latest SAP/Asas movement refresh", "آخر تحديث للحركات", "最新 SAP/Asas movement 刷新") },
  { type: "mod", name: fcT("Stale commitment probability adjusted", "تعديل احتمال الالتزامات القديمة", "长期承诺概率已调整"), amount: 0.18, why: fcT("warning classification", "تصنيف التحذيرات", "预警分类") },
  { type: "cancel", name: fcT("Idle balance excluded from hard need", "استبعاد الرصيد الخامل", "闲置余额从硬需求中剔除"), amount: -0.09, why: fcT("available-funds review", "مراجعة الأموال المتاحة", "可用资金复核") },
];
const changeTone = { new: "n", mod: "m", cancel: "c" };
const changeLabel = {
  new: fcT("New", "جديد", "新增"),
  mod: fcT("Modified", "معدّل", "修改"),
  cancel: fcT("Cancelled", "ملغى", "取消"),
};

function buildForecast(period, commitmentType, actions) {
  const includeHard = commitmentType !== "soft";
  const includeSoft = commitmentType !== "hard";
  const capFactor = 1 + (actions.accel ? 0.06 : 0) + (actions.realloc ? 0.04 : 0);
  const capAdd = actions.supp ? 0.05 : 0;
  const months = forecastMonths.map((month, index) => {
    const confirmed = includeHard ? month.conf : 0;
    const toConfirm = includeSoft ? month.prob : 0;
    const future = includeSoft ? month.fut : 0;
    const expected = confirmed + toConfirm * conversionRate + future * futureConversionRate;
    const ceiling = month.cap * capFactor + capAdd;
    const adjustedExpected = expected * (actions.defer ? (index < 12 ? 0.9 : 1.08) : 1);
    return {
      index,
      confirmed,
      toConfirm: toConfirm * conversionRate,
      future: future * futureConversionRate,
      nominalTotal: confirmed + toConfirm + future,
      nominalSoft: toConfirm + future,
      ceiling,
      expected: adjustedExpected,
      gap: Math.max(0, adjustedExpected - ceiling),
    };
  });
  const groupSize = period === "month" ? 1 : period === "quarter" ? 3 : 12;
  const buckets = [];
  for (let bucket = 0; bucket < 24 / groupSize; bucket += 1) {
    let confirmed = 0;
    let toConfirm = 0;
    let future = 0;
    let ceiling = 0;
    for (let offset = 0; offset < groupSize; offset += 1) {
      const month = months[bucket * groupSize + offset];
      confirmed += month.confirmed;
      toConfirm += month.toConfirm;
      future += month.future;
      ceiling += month.ceiling;
    }
    const label = period === "month" ? monthLabels[bucket] : period === "quarter" ? quarterLabel(bucket) : `${monthLabels[bucket * 12]}→${monthLabels[bucket * 12 + 11]}`;
    buckets.push({ label, confirmed, toConfirm, future, ceiling });
  }
  return {
    months,
    chart: buckets.map((row) => ({
      label: row.label,
      confirmed: +row.confirmed.toFixed(2),
      toConfirm: +row.toConfirm.toFixed(2),
      forecast: +row.future.toFixed(2),
      ceiling: +row.ceiling.toFixed(2),
    })),
  };
}

/**
 * Forecast page keeps the commitment-forecast logic with execution data.
 */
export function BudgetExecutionForecastPage({ store }) {
  const { tr, route, setRoute, setBackRoute, setDeptSub, pushLog } = store;
  const [draft, setDraft] = useState("draft");
  const [refreshTs, setRefreshTs] = useState("2026-07-07 10:04");
  const [entity, setEntity] = useState(0);
  const [service, setService] = useState(0);
  const [untilYear, setUntilYear] = useState(2028);
  const [period, setPeriod] = useState("quarter");
  const [commitmentType, setCommitmentType] = useState("all");
  const [plansMode, setPlansMode] = useState("complete");
  const [debtResolution, setDebtResolution] = useState(0);
  const [actions] = useState({ defer: false, accel: false, supp: false, realloc: false });
  const [selectedType, setSelectedType] = useState(null);
  const [mitigation, setMitigation] = useState({});
  const [actionMessage, setActionMessage] = useState(null);
  const [findMessage, setFindMessage] = useState(null);
  const [approvedQuery, setApprovedQuery] = useState("");
  const [processQuery, setProcessQuery] = useState("");
  const [approvedOnlyNoPlan, setApprovedOnlyNoPlan] = useState(false);
  const [processOnlyHigh, setProcessOnlyHigh] = useState(false);

  const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");
  const approvedRows = buildApprovedRows();
  const processRows = buildProcessRows();
  const mitigationRows = riskRows.slice(0, 3).map((row, index) => ({
    id: row.id,
    name: row.name,
    amount: toB(row.metrics.available + row.metrics.invoice),
    risk: index === 0 ? "high" : "med",
    why: row.statusDetail,
    actions: index === 0 ? ["reneg", "cap", "resched"] : ["reneg", "resched"],
  }));

  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec-forecast");
    pushLog?.(logText);
    setRoute(targetRoute);
  };
  const navigateStory = (targetRoute) => {
    if (targetRoute === "budexec-forecast") return;
    openRoute(targetRoute, `Budget execution forecast opened ${targetRoute}`);
  };
  const switchToPlanningForecast = () => {
    setBackRoute(route || "budexec-forecast");
    setDeptSub?.("plan");
    pushLog?.({ en: "Switched perspective from execution forecast to Planning Department funding forecast", ar: "تم التبديل إلى تنبؤ تمويل قسم التخطيط", zh: "视角已从执行预测切换到规划部门资金预测" });
    setRoute("plnforecast");
  };

  const { months, chart } = buildForecast(period, commitmentType, actions);
  const sum = (selector) => months.reduce((total, month) => total + selector(month), 0);
  const existing = +sum((month) => month.confirmed).toFixed(2);
  const potential = +sum((month) => month.nominalSoft).toFixed(2);
  const totalCommitment = +sum((month) => month.nominalTotal).toFixed(2);
  const softNominal = forecastMonths.reduce((total, month) => total + (commitmentType !== "hard" ? month.prob + month.fut : 0), 0);
  const softExpected = forecastMonths.reduce((total, month) => total + (commitmentType !== "hard" ? month.prob * conversionRate + month.fut * futureConversionRate : 0), 0);
  const softConversion = softNominal > 0 ? Math.round((softExpected / softNominal) * 100) : 100;
  const fundingGap = +sum((month) => month.gap).toFixed(2);
  const firstGapMonth = months.find((month) => month.gap > 0.001);
  const peakMonth = months.slice().sort((a, b) => b.gap - a.gap)[0];
  const annualNeed = +(totalCommitment / 2).toFixed(2);
  const needOverCeiling = annualNeed > forecastCeiling;
  const serviceKey = serviceKeys[service];
  const matchesQuery = (row, query) => {
    if (!query.trim()) return true;
    const haystack = `${row.id} ${row.code} ${row.name.en} ${row.name.zh} ${row.name.ar}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  };
  const approvedFiltered = approvedRows.filter((row) => (serviceKey === "all" || row.service === serviceKey) && (!selectedType || row.type === selectedType) && matchesQuery(row, approvedQuery));
  const processFiltered = processRows.filter((row) => (serviceKey === "all" || row.service === serviceKey) && (!selectedType || row.type === selectedType) && matchesQuery(row, processQuery));
  const noPlanRows = approvedFiltered.filter((row) => !row.plan);
  const highImpactRows = processFiltered.filter((row) => row.amount >= 0.3);
  const approvedShown = approvedOnlyNoPlan ? noPlanRows : approvedFiltered;
  const processShown = processOnlyHigh ? highImpactRows : processFiltered;
  const dataSources = ["Execution ledger", "SAP/Asas movement", "Etimad invoices", plansMode === "complete" ? "Payment Plans" : "Payment Plans(gap)", "Warning queue", "Availability report"];
  const idiqAmount = approvedRows.filter((row) => row.type === "idiq").reduce((total, row) => total + row.amount, 0);
  const totalApprovedAmount = approvedRows.reduce((total, row) => total + row.amount, 0);
  const idiqShare = totalApprovedAmount ? idiqAmount / totalApprovedAmount : 0;
  let confidencePct = Math.round(91 - idiqShare * 35 - noPlanRows.length * 3);
  if (plansMode === "missing") confidencePct = Math.min(confidencePct, 56);
  const confidenceLevel = confidencePct >= 80 ? "high" : confidencePct >= 65 ? "med" : "low";
  const carryDebt = 0.42;
  const debtTarget = 0.18;
  const residualDebt = +(carryDebt * (1 - debtResolution / 100)).toFixed(2);
  const nextCeiling = +(forecastCeiling - residualDebt).toFixed(2);
  const debtOverTarget = residualDebt > debtTarget;
  const appliedCount = Object.values(actions).filter(Boolean).length;
  const committed = sumMetric("committed");
  const invoiced = sumMetric("invoice");
  const paid = sumMetric("paid");
  const available = sumMetric("available");

  const setFlash = (message, column) => setFindMessage({ message, column });
  const refresh = () => {
    setRefreshTs("2026-07-07 " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    setDraft("draft");
    pushLog?.({ en: "Rolling forecast refreshed from execution data", ar: "تم تحديث التنبؤ من بيانات التنفيذ", zh: "已基于执行数据刷新滚动预测" });
    setActionMessage(fcT("Rolling forecast refreshed from execution data — actuals reconciled, future demand re-projected and reason documented.", "تم تحديث التنبؤ من بيانات التنفيذ.", "滚动预测已从执行数据刷新：实际数已对账，未来需求已重算，并记录原因。"));
  };
  const submit = () => {
    setDraft("submitted");
    pushLog?.({ en: "Rolling forecast v3 submitted for approval", ar: "تم تقديم التنبؤ المتجدد", zh: "滚动预测 v3 已提交审批" });
    setActionMessage(fcT("Forecast v3 submitted — no financial commitment is created without human approval.", "تم تقديم التنبؤ دون إنشاء التزام مالي.", "预测 v3 已提交审批 —— 未经人工批准不产生任何财务承诺。"));
  };
  const applyMitigation = (id, action) => {
    setMitigation((current) => ({ ...current, [id]: action }));
    const item = mitigationRows.find((row) => row.id === id);
    setFlash(fcT(`Mitigation '${tr(actionNames[action])}' applied to ${tr(item.name)}`, "تم تطبيق المعالجة", `已对「${tr(item.name)}」应用：${tr(actionNames[action])}`), "M");
  };
  const locateFinding = (key) => {
    if (key === "conv") {
      setSelectedType("idiq");
      setCommitmentType("soft");
    } else if (key === "market") {
      setSelectedType("cost");
    } else if (key === "gap") {
      setPeriod("month");
    }
    setFlash(fcT("Filtered and highlighted the related execution commitments.", "تمت تصفية الالتزامات المرتبطة.", "已按该信号筛选并高亮相关执行承诺。"), "L");
  };
  const clearType = () => setSelectedType(null);
  const typeName = (key) => tr((types.find((type) => type.key === key) || types[0]).name);
  const findings = [
    firstGapMonth
      ? { icon: "⚠", key: "gap", title: fcT("Ceiling pressure ahead", "ضغط السقف", "上限压力预警"), detail: fcT(`Need exceeds ceiling from ${monthLabels[firstGapMonth.index]} · peak ${amountB(peakMonth.gap)} at ${monthLabels[peakMonth.index]}`, `الحاجة تتجاوز السقف من ${monthLabels[firstGapMonth.index]}`, `自 ${monthLabels[firstGapMonth.index]} 起需求超上限 · 峰值 ${amountB(peakMonth.gap)}(${monthLabels[peakMonth.index]})`) }
      : { icon: "✓", key: "gap", title: fcT("Within ceiling", "ضمن السقف", "上限内"), detail: fcT("Expected need stays within capacity.", "الحاجة ضمن القدرة.", "预期需求全程在上限内。") },
    { icon: "◎", key: "conv", title: fcT("Conversion risk", "خطر التحويل", "转化风险"), detail: fcT("IDIQ and stale commitments are treated as probabilistic expectations.", "تُحسب التزامات IDIQ باحتمال.", "IDIQ 与长期承诺按概率化预期计入。") },
    { icon: "◆", key: "market", title: fcT("Execution-cost signal", "إشارة تكلفة التنفيذ", "执行成本信号"), detail: fcT("Risk rows lift cost-reimbursement pressure in the forecast.", "بنود المخاطر ترفع ضغط التكلفة.", "风险行推高成本补偿类压力。") },
  ];

  return (
    <div className="fade wb">
      <div className="card pad wb-frame">
        <div className="card pad wb-head">
          <div>
            <div className="wb-title">
              <button className="pg-back" type="button" onClick={() => openRoute("budexec17", "Back to execution ledger")}>‹</button>
              <span className="wb-dot green" />
              {tr({ en: "Budget Execution Department", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" })}
              {" · "}
              {tr({ en: "Commitment Forecast", ar: "تنبؤ الالتزامات", zh: "承诺与未来需求预测" })}
              <button className="al-bell" type="button" onClick={() => openRoute("budexec-alerts", "Open execution warning data")} title={tr({ en: "Exceptions", ar: "الاستثناءات", zh: "异常" })}>🔔 {riskRows.length ? <span>{riskRows.length}</span> : null}</button>
            </div>
            <div className="wb-subt">
              <span className="uc-tag">{tr({ en: "Execution-backed forecast", ar: "تنبؤ مدعوم بالتنفيذ", zh: "执行驱动预测" })}</span>
              {" "}
              {tr({
                en: "Forecasting Future Commitments and Needs · seeded by execution actuals",
                ar: "التنبؤ بالالتزامات والاحتياجات المستقبلية · من فعليات التنفيذ",
                zh: "承诺与未来需求预测 · 基于执行实际数",
              })}
            </div>
          </div>
          <div className="bp-wrap-story">
            <BudgetExecutionStoryline tr={tr} current="forecast" onNavigate={navigateStory} />
          </div>
        </div>

        <div className={"fc-draft " + (draft === "submitted" ? "sub" : "")}>
          <span className="fc-draft-dot" />
          <b>{draft === "submitted" ? tr({ en: "Forecast v3 · submitted", ar: "قُدّم v3", zh: "预测 v3 · 已提交审批" }) : tr({ en: "Forecast v3 · DRAFT", ar: "مسودة v3", zh: "预测 v3 · 草稿" })}</b>
          <span className={"fc-conf " + confidenceLevel} title={tr({ en: "Data sources: ", ar: "مصادر البيانات: ", zh: "数据来源：" }) + dataSources.join(", ")}>
            {tr({ en: "Confidence", ar: "الثقة", zh: "置信度" })} {confidencePct}% · {tr(confidenceText[confidenceLevel])}
          </span>
          <span className="fc-draft-meta">{tr({ en: "last refresh", ar: "آخر تحديث", zh: "最后刷新" })} {refreshTs} · {tr({ en: "until", ar: "حتى", zh: "至" })} {untilYear}</span>
          <span className="fc-draft-acts">
            <button className="sc-mini" type="button" onClick={switchToPlanningForecast} title={tr({ en: "Switch to Planning Department · Funding forecast", ar: "التبديل إلى قسم التخطيط · تنبؤ التمويل", zh: "视角切换到规划部门 · 资金预测" })}>⇄ {tr({ en: "Switch to Planning Dept", ar: "التبديل إلى التخطيط", zh: "视角切换到规划部门" })}</button>
            <button className="sc-mini" type="button" onClick={refresh}>↻ {tr({ en: "Refresh", ar: "تحديث", zh: "刷新" })}</button>
            <button className="sc-mini primary" type="button" onClick={submit} disabled={draft === "submitted"}>{draft === "submitted" ? "✓ " + tr({ en: "Submitted", ar: "قُدّم", zh: "已提交" }) : tr({ en: "Submit for approval", ar: "تقديم", zh: "提交审批" })}</button>
          </span>
        </div>
        {plansMode === "missing" && <div className="fc-sources"><span className="fc-lowconf">⚠ {tr({ en: "Payment plans missing — model falls back to execution actuals and historical timing, confidence lowered.", ar: "خطط الدفع مفقودة — ثقة منخفضة.", zh: "付款计划缺失 —— 回退执行实际数和历史节奏，置信度已下调。" })}</span></div>}

        <div className="wb-actbar">
          <span className="bp-agent wb-ab-agent">{tr({ en: "Financial Forecasting Agent", ar: "وكيل التنبؤ المالي", zh: "财务预测智能体" })}</span>
          <div className="wb-ab-top">
            <div className="wb-ab-spark">✦</div>
            <div className="wb-ab-tt">
              <div>
                <span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى وإجراءات", zh: "AI 洞察与后续行动" })}</span>
                <span className="wb-ab-meta">{tr({ en: "Execution ledger → Rolling forecast", ar: "دفتر التنفيذ ← التنبؤ المتجدد", zh: "执行台账 → 滚动预测" })} · {tr({ en: "Forecasting + Rolling + Market Trends", ar: "تنبؤ + متجدد + سوق", zh: "预测 + 滚动 + 市场趋势" })} · {tr({ en: "confidence", ar: "الثقة", zh: "置信度" })} {confidencePct}%</span>
              </div>
              <div className="wb-ab-insight">
                {tr({
                  en: `Execution data is ready: ${UC17_BUDGET_ROWS.length} budget lines, ${formatSar(committed)} committed, ${formatSar(invoiced)} invoiced, ${formatSar(paid)} paid and ${formatSar(available)} available. Expected need ${amountB(annualNeed)}/yr vs ceiling ${amountB(forecastCeiling)}. ${needOverCeiling ? "Need exceeds ceiling — early warning." : "Need stays within ceiling."} Existing ${amountB(existing)}, potential ${amountB(potential)} @ ${softConversion}%.`,
                  ar: `بيانات التنفيذ جاهزة. الحاجة المتوقعة ${amountB(annualNeed)} مقابل السقف ${amountB(forecastCeiling)}.`,
                  zh: `执行数据已就绪：${UC17_BUDGET_ROWS.length} 条预算行、已承诺 ${formatSar(committed)}、收票 ${formatSar(invoiced)}、已付款 ${formatSar(paid)}、可用资金 ${formatSar(available)}。预期需求 ${amountB(annualNeed)}/年 vs 上限 ${amountB(forecastCeiling)}。${needOverCeiling ? "需求超上限 —— 提前预警。" : "需求在上限内。"}已有 ${amountB(existing)}、潜在(概率化) ${amountB(potential)} @ ${softConversion}%。`,
                })}
              </div>
              <div className="sc-rec-review">⚑ {tr({ en: "Recommendations are pending approval; no commitment is created without human sign-off.", ar: "التوصيات بانتظار الاعتماد.", zh: "建议待审批；未经人工批准不产生承诺。" })}</div>
            </div>
          </div>
          <div className="wb-ab-rows hs-rows">
            <div className="wb-ab-col">
              <div className="wb-ab-h">◈ {tr({ en: "ANOMALY & RISK SIGNALS", ar: "إشارات المخاطر", zh: "异常与风险信号" })} <span className="hs-find-hint">{tr({ en: "single click filters & highlights", ar: "نقرة للتصفية", zh: "单击筛选并高亮" })}</span></div>
              <div className="hs-finds">
                {findings.map((finding, index) => (
                  <div className="hs-find-wrap" key={finding.key}>
                    <button className={"hs-find " + (finding.icon === "✓" ? "opt" : "anom")} type="button" onClick={() => locateFinding(finding.key)}>
                      <span className="hs-find-ic">{finding.icon}</span>
                      <div className="hs-find-tx"><b>{tr(finding.title)} <span className={"hs-find-cta " + (finding.icon === "✓" ? "opt" : "anom")}>{tr({ en: "+ filter", ar: "تصفية", zh: "+ 筛选" })}</span></b><span>{tr(finding.detail)}</span></div>
                    </button>
                    {findMessage && findMessage.column === "L" && index === 0 && <div className="hs-find-done">→ {tr(findMessage.message)}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="fc-scope">
          <span className="fc-flab">{tr({ en: "FORECAST SCOPE", ar: "نطاق التنبؤ", zh: "预测范围" })}</span>
          <label className="fc-sf">{tr({ en: "Entity *", ar: "الجهة *", zh: "实体 *" })}<select className="sc-in sm" value={entity} onChange={(event) => setEntity(+event.target.value)}>{entities.map((item, index) => <option key={tr(item)} value={index}>{tr(item)}</option>)}</select></label>
          <label className="fc-sf">{tr({ en: "Service/Item", ar: "الخدمة/البند", zh: "服务/条目" })}<select className="sc-in sm" value={service} onChange={(event) => setService(+event.target.value)}>{services.map((item, index) => <option key={tr(item)} value={index}>{tr(item)}</option>)}</select></label>
          <label className="fc-sf">{tr({ en: "Until year", ar: "حتى سنة", zh: "至年度" })}<select className="sc-in sm" value={untilYear} onChange={(event) => setUntilYear(+event.target.value)}>{[2027, 2028, 2029, 2030].map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          <label className="fc-sf" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{tr({ en: "Period", ar: "الفترة", zh: "时间周期" })}<span className="fc-seg">{["month", "quarter", "year"].map((item) => <button type="button" key={item} className={period === item ? "on" : ""} onClick={() => setPeriod(item)}>{tr({ month: { en: "Monthly", ar: "شهري", zh: "月度" }, quarter: { en: "Quarterly", ar: "ربعي", zh: "季度" }, year: { en: "Yearly", ar: "سنوي", zh: "年度" } }[item])}</button>)}</span></label>
          <label className="fc-sf" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{tr({ en: "Commitment type", ar: "نوع الالتزام", zh: "承诺类型" })}<span className="fc-seg">{[["all", { en: "All", ar: "الكل", zh: "全部" }], ["hard", { en: "Hard commit", ar: "التزام صلب", zh: "硬承诺" }], ["soft", { en: "Soft commit", ar: "التزام لين", zh: "软承诺" }]].map(([key, label]) => <button type="button" key={key} className={commitmentType === key ? "on" : ""} onClick={() => setCommitmentType(key)}>{tr(label)}</button>)}</span></label>
          {selectedType && <button className="sc-mini" type="button" onClick={clearType}>✕ {typeName(selectedType)}</button>}
          {service > 0 && <button className="sc-mini" type="button" onClick={() => setService(0)}>✕ {tr({ en: "Clear service", ar: "مسح", zh: "清除服务" })}</button>}
        </div>

        <div className="bp-kpis">
          <div className="bp-kpi"><div className="l">{tr({ en: "Existing obligations", ar: "الالتزامات القائمة", zh: "已有义务(确定)" })}</div><div className="v">{amountB(existing)}</div><div className="s">{tr({ en: "from committed execution amount", ar: "من التزامات التنفيذ", zh: "来自执行已承诺金额" })}</div></div>
          <div className="bp-kpi"><div className="l">{tr({ en: "Potential obligations", ar: "التزامات محتملة", zh: "潜在义务(概率)" })}</div><div className="v">{amountB(potential)}</div><div className="s">{tr({ en: `probabilistic · conv ${softConversion}%`, ar: "احتمالي", zh: `概率化 · 转化 ${softConversion}%` })}</div></div>
          <div className={"bp-kpi " + (needOverCeiling ? "danger" : "ok")}><div className="l">{tr({ en: "Expected need vs ceiling", ar: "الحاجة مقابل السقف", zh: "预期需求 vs 上限" })}</div><div className="v">{amountB(annualNeed)}</div><div className="s">{tr({ en: "ceiling ", ar: "السقف ", zh: "上限 " })}{amountB(forecastCeiling)} · {needOverCeiling ? tr({ en: "over", ar: "تجاوز", zh: "超出" }) : tr({ en: "within", ar: "ضمن", zh: "在内" })}</div></div>
          <div className={"bp-kpi " + (fundingGap > 0.01 ? "danger" : "ok")}><div className="l">{tr({ en: "Deficit / fiscal-space gap", ar: "فجوة العجز", zh: "赤字 / 财政空间缺口" })}</div><div className="v">{amountB(fundingGap)}</div><div className="s">{fundingGap > 0.01 ? (firstGapMonth ? tr({ en: "from ", ar: "من ", zh: "自 " }) + monthLabels[firstGapMonth.index] : "") + (appliedCount ? " · -" + appliedCount + tr({ en: " applied", ar: " مطبّق", zh: " 项应对" }) : "") : tr({ en: "surplus / within capacity", ar: "فائض", zh: "结余 / 在能力内" })}</div></div>
        </div>

        <div className="uf-sec">
          <div className="uf-h">{tr({ en: "Ceiling pressure timeline (per period)", ar: "الخط الزمني لضغط السقف", zh: "上限压力时间线(按周期)" })} <span className="bp-agent">Rolling Forecasting Agent</span></div>
          <RC.ResponsiveContainer width="100%" height={240}>
            <RC.AreaChart data={chart} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <RC.CartesianGrid stroke="#eef1f6" vertical={false} />
              <RC.XAxis dataKey="label" tick={{ fontSize: 9 }} interval={period === "month" ? 2 : 0} />
              <RC.YAxis tick={{ fontSize: 9 }} />
              <RC.Tooltip formatter={(value) => `SAR ${value}B`} />
              <RC.Legend wrapperStyle={{ fontSize: 10 }} />
              <RC.Area type="monotone" dataKey="confirmed" stackId="1" stroke="#1B8354" fill="#1B8354" fillOpacity={0.75} name={tr({ en: "Existing (confirmed)", ar: "قائم", zh: "已有(确定)" })} />
              <RC.Area type="monotone" dataKey="toConfirm" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.5} name={tr({ en: "Potential", ar: "محتمل", zh: "潜在" })} />
              <RC.Area type="monotone" dataKey="forecast" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} name={tr({ en: "Forecast", ar: "متوقع", zh: "预测" })} />
              <RC.Line type="monotone" dataKey="ceiling" stroke="#e0524a" strokeWidth={2} strokeDasharray="5 4" dot={false} name={tr({ en: "Ceiling", ar: "السقف", zh: "上限" })} />
            </RC.AreaChart>
          </RC.ResponsiveContainer>
          <div className="uf-note">{tr({ en: "Existing vs potential are shown separately; where the stack crosses the red ceiling line, the forecast creates an expected pressure signal for fiscal-space planning.", ar: "يظهر القائم والمحتمل بشكل منفصل.", zh: "已有与潜在分开呈现；某周期堆叠超过红色上限线时，滚动预测会生成面向财政空间规划的预期压力信号。" })}</div>
        </div>

        <div className="bp-grid2">
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Approved execution obligations", ar: "التزامات التنفيذ المعتمدة", zh: "已批准执行义务" })} <span className="bp-agent">{tr({ en: "from execution ledger", ar: "من دفتر التنفيذ", zh: "来自执行台账" })}</span> <span className="fc-hint">{approvedShown.length}/{approvedRows.length}</span></div>
            <div className="fc-search"><span className="fc-search-ic">🔍</span><input placeholder={tr({ en: "Search budget line / contract ID...", ar: "بحث عن بند / رقم...", zh: "搜索预算行 / 合同编号..." })} value={approvedQuery} onChange={(event) => setApprovedQuery(event.target.value)} />{approvedQuery && <button type="button" onClick={() => setApprovedQuery("")}>✕</button>}</div>
            {noPlanRows.length > 0 && <button className={"fc-warn fc-warn-btn" + (approvedOnlyNoPlan ? " on" : "")} type="button" onClick={() => setApprovedOnlyNoPlan((value) => !value)}>⚠ {noPlanRows.length} {tr({ en: "approved obligation(s) without a payment plan", ar: "التزامات دون خطة دفع", zh: "个已批准义务缺少付款计划" })} <em>{approvedOnlyNoPlan ? tr({ en: "· clear filter", ar: "· مسح", zh: "· 取消筛选" }) : tr({ en: "· click to filter", ar: "· انقر للتصفية", zh: "· 点击筛选" })}</em></button>}
            <div className="fc-tscroll">
              <table className="wb-table fc-ctable fc-stick">
                <thead><tr><th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th><th>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Amount", ar: "المبلغ", zh: "金额" })}</th><th>{tr({ en: "Plan", ar: "خطة", zh: "付款计划" })}</th></tr></thead>
                <tbody>{approvedShown.length ? approvedShown.map((row) => <tr key={row.id} className={row.plan ? "" : "deficit"}><td><span className="fc-cid">{row.code}</span> {tr(row.name)}</td><td>{typeName(row.type)}</td><td className="bp-mono" style={{ textAlign: "end" }}>{amountB(row.amount)}</td><td>{row.plan ? "✓" : <span style={{ color: "#c53b32", fontWeight: 700 }}>{tr({ en: "missing", ar: "مفقودة", zh: "缺失" })}</span>}</td></tr>) : <tr><td colSpan={4} className="fc-norow">{tr({ en: "No matching obligation found", ar: "لا يوجد تطابق", zh: "未找到匹配义务" })}</td></tr>}</tbody>
              </table>
            </div>
          </div>
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Execution rows under review (potential)", ar: "بنود قيد المراجعة", zh: "复核中的执行行(概率化预期)" })} <span className="bp-agent">Financial Forecasting Agent</span> <span className="fc-hint">{processShown.length}/{processRows.length}</span></div>
            <div className="fc-search"><span className="fc-search-ic">🔍</span><input placeholder={tr({ en: "Search budget line / risk...", ar: "بحث عن بند / خطر...", zh: "搜索预算行 / 风险..." })} value={processQuery} onChange={(event) => setProcessQuery(event.target.value)} />{processQuery && <button type="button" onClick={() => setProcessQuery("")}>✕</button>}</div>
            {highImpactRows.length > 0 && <button className={"fc-warn amber fc-warn-btn" + (processOnlyHigh ? " on" : "")} type="button" onClick={() => setProcessOnlyHigh((value) => !value)}>◭ {highImpactRows.length} {tr({ en: "row(s) potentially high-impact", ar: "بنود عالية الأثر", zh: "条预算行潜在高影响" })} <em>{processOnlyHigh ? tr({ en: "· clear filter", ar: "· مسح", zh: "· 取消筛选" }) : tr({ en: "· click to filter", ar: "· انقر للتصفية", zh: "· 点击筛选" })}</em></button>}
            <div className="fc-tscroll">
              <table className="wb-table fc-ctable fc-stick">
                <thead><tr><th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Amount", ar: "المبلغ", zh: "金额" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Convert prob.", ar: "احتمال", zh: "转化概率" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Expected", ar: "متوقع", zh: "概率期望" })}</th></tr></thead>
                <tbody>{processShown.length ? processShown.map((row) => <tr key={row.id} className={row.amount >= 0.3 ? "focus-row" : ""}><td><span className="fc-cid">{row.code}</span> {tr(row.name)}<span className="fc-prob-tag">{tr({ en: "probabilistic", ar: "احتمالي", zh: "概率化" })}</span></td><td className="bp-mono" style={{ textAlign: "end" }}>{amountB(row.amount)}</td><td className="bp-mono" style={{ textAlign: "end" }}>{Math.round(row.prob * 100)}%</td><td className="bp-mono" style={{ textAlign: "end", fontWeight: 700 }}>{amountB(+(row.amount * row.prob).toFixed(2))}</td></tr>) : <tr><td colSpan={4} className="fc-norow">{tr({ en: "No matching execution row found", ar: "لا يوجد تطابق", zh: "未找到匹配执行行" })}</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bp-grid2">
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Carried-over debt -> next-year ceiling", ar: "الدين المرحّل → سقف العام القادم", zh: "结转债务 → 次年上限" })}</div>
            <div className="fc-debt-row"><span>{tr({ en: "Carried-over debt", ar: "الدين المرحّل", zh: "结转债务" })}</span><b>{amountB(carryDebt)}</b><span>{tr({ en: "target", ar: "الهدف", zh: "目标" })} {amountB(debtTarget)}</span></div>
            <div className="bp-slider"><span className="bp-slk">{tr({ en: "Debt restructuring", ar: "إعادة هيكلة الدين", zh: "债务重组" })}</span><input type="range" min="0" max="100" value={debtResolution} onChange={(event) => setDebtResolution(+event.target.value)} /><span className="bp-slv">-{debtResolution}%</span></div>
            <div className="fc-debt-eff">{tr({ en: "Residual debt ", ar: "الدين المتبقي ", zh: "剩余债务 " })}<b style={{ color: debtOverTarget ? "#c53b32" : "#166534" }}>{amountB(residualDebt)}</b> → {tr({ en: "next-year ceiling ", ar: "سقف العام القادم ", zh: "次年上限 " })}<b>{amountB(nextCeiling)}</b> <span className="fc-debt-delta">({tr({ en: "was", ar: "كان", zh: "原" })} {amountB(forecastCeiling)})</span></div>
            {debtOverTarget && <div className="fc-warn">⚠ {tr({ en: "Outstanding debt is higher than target, so it compresses next year's forecast ceiling.", ar: "الدين أعلى من الهدف.", zh: "未偿债务高于目标，将压缩次年预测上限。" })}</div>}
          </div>
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Expectation vs reality (Rolling)", ar: "التوقع مقابل الواقع", zh: "预期 vs 实际(滚动追踪)" })} <span className="bp-agent">Rolling Forecasting Agent</span></div>
            <table className="wb-table fc-ctable">
              <thead><tr><th>{tr({ en: "Period", ar: "الفترة", zh: "周期" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Forecast", ar: "متوقع", zh: "预测" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Actual", ar: "فعلي", zh: "实际" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Deviation", ar: "انحراف", zh: "偏差" })}</th></tr></thead>
              <tbody>{actualRows.map((row) => { const deviation = +(((row.actual - row.forecast) / row.forecast) * 100).toFixed(1); return <tr key={row.period}><td>{row.period}</td><td className="bp-mono" style={{ textAlign: "end" }}>{amountB(row.forecast)}</td><td className="bp-mono" style={{ textAlign: "end" }}>{amountB(row.actual)}</td><td className="bp-mono" style={{ textAlign: "end", color: Math.abs(deviation) > 4 ? "#c53b32" : "#166534", fontWeight: 700 }}>{deviation >= 0 ? "+" : ""}{deviation}%</td></tr>; })}</tbody>
            </table>
            <div className="uf-note">{tr({ en: "Rolling Forecasting reconciles execution actuals and re-tunes future periods; large deviation lowers confidence.", ar: "التسوية المتجددة تضبط الفترات القادمة.", zh: "滚动预测对账执行实际数并校准未来周期；偏差过大会拉低置信度。" })}</div>
          </div>
        </div>

        <div className="bp-grid2">
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Change summary (reason documented)", ar: "ملخص التغييرات", zh: "变更摘要(已记录原因)" })} <span className="bp-agent">Rolling Forecasting Agent</span></div>
            <div className="fc-changes">{changeRows.map((row) => <div className="fc-change" key={tr(row.name)}><span className={"fc-chg-tag " + changeTone[row.type]}>{tr(changeLabel[row.type])}</span><span className="fc-chg-n">{tr(row.name)}<em className="fc-chg-why"> · {tr(row.why)}</em></span><span className="fc-chg-a" style={{ color: row.amount < 0 ? "#c53b32" : "#166534" }}>{row.amount >= 0 ? "+" : ""}{amountB(row.amount)}</span></div>)}</div>
          </div>
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Remediation for high-risk commitments", ar: "المعالجة للالتزامات عالية المخاطر", zh: "高风险承诺 · 缓解措施建议" })} <span className="bp-agent">Financial Forecasting Agent</span></div>
            <div className="fc-mitigs">
              {mitigationRows.map((row) => (
                <div className={"fc-mitig" + (mitigation[row.id] ? " done" : "")} key={row.id}>
                  <div className="fc-mitig-top"><b>{tr(row.name)}</b><span className={"sc-riskbadge r-" + row.risk}>{tr(riskText[row.risk])}</span><em>{amountB(row.amount)}</em></div>
                  <div className="fc-mitig-why">{tr(row.why)}</div>
                  {mitigation[row.id]
                    ? <div className="fc-mitig-done">✓ {tr({ en: "Applied: ", ar: "طُبّق: ", zh: "已应用：" })}{tr(actionNames[mitigation[row.id]])}</div>
                    : <div className="fc-mitig-acts">{row.actions.map((action) => <button className="fc-mact" type="button" key={action} onClick={() => applyMitigation(row.id, action)}>{tr(actionNames[action])}</button>)}</div>}
                </div>
              ))}
            </div>
            {findMessage && findMessage.column === "M" && <div className="wb-ab-done">✓ {tr(findMessage.message)}</div>}
          </div>
        </div>

        {actionMessage && <div className="uf-sec sc-actionbar" style={{ alignItems: "center" }}>
          <div className="sc-actmsg" style={{ flexBasis: "auto" }}>✓ {tr(actionMessage)}</div>
          <button className="dw-btn" type="button" onClick={() => setActionMessage(null)}>{tr({ en: "Dismiss", ar: "إغلاق", zh: "关闭" })}</button>
          <button className="dw-btn" type="button" onClick={() => openRoute("budexec-reports", "Forecast evidence sent to report generation")}>{tr({ en: "Generate report", ar: "إنشاء تقرير", zh: "生成报告" })}</button>
        </div>}
      </div>
      <BudgetExecutionSmartQuery tr={tr} pushLog={pushLog} page="uc04" />
    </div>
  );
}
