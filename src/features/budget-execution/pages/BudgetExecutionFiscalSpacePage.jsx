import React, { useMemo, useState } from "react";
import { BudgetExecutionPageHeader } from "../components/BudgetExecutionPageHeader.jsx";
import { BudgetExecutionSection } from "../components/BudgetExecutionSection.jsx";
import { BudgetExecutionSmartQuery } from "../components/BudgetExecutionSmartQuery.jsx";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const FORECAST_PRESSURE = 230;
const EXPECTED_CLAIMS = 310;
const CARRY_OVER_DEBT = 420;

const sumMetric = (key) => UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics[key] || 0), 0);

const classifyCandidate = (row) => {
  if (row.status === "risk" && row.statusDetail.en.includes("Available but idle")) {
    return {
      type: { en: "Available but idle", ar: "متاح لكنه خامل", zh: "可用但闲置" },
      tone: "opportunity",
      path: { en: "Release clean available balance to Q4 payment pressure pool.", ar: "تحرير الرصيد النظيف إلى مجمع ضغط الربع الرابع.", zh: "将干净可用余额释放至 Q4 支付压力池。" },
    };
  }
  if (row.status === "risk" && row.statusDetail.en.includes("without invoice")) {
    return {
      type: { en: "Long commitment without invoice/payment", ar: "التزام طويل بلا فاتورة أو دفع", zh: "长期承诺无发票/付款" },
      tone: "risk",
      path: { en: "Keep committed reserve; move unused balance after owner confirmation.", ar: "إبقاء احتياطي الالتزام ونقل الرصيد غير المستخدم بعد تأكيد المالك.", zh: "保留已承诺准备，负责人确认后转移未用可用资金。" },
    };
  }
  if (row.status === "risk" && row.metrics.available < 120) {
    return {
      type: { en: "Financial entitlements liquidity pressure linked", ar: "مرتبط بضغط سيولة الاستحقاقات المالية", zh: "关联财务权益流动性压力" },
      tone: "pressure",
      path: { en: "Freeze unverified free cost and route to forecast pressure review.", ar: "تجميد التكلفة الحرة وتمريرها لمراجعة ضغط التنبؤ.", zh: "冻结未核验自由成本并送入预测压力复核。" },
    };
  }
  return {
    type: { en: "Low-risk fiscal-space review", ar: "مراجعة حيز مالي منخفضة المخاطر", zh: "低风险财政空间复核" },
    tone: "normal",
    path: { en: "Retain as buffer or release through low-risk transfer review.", ar: "إبقاؤه كاحتياطي أو تحريره عبر مراجعة منخفضة المخاطر.", zh: "保留为缓冲或进入低风险转移复核。" },
  };
};

export function BudgetExecutionFiscalSpacePage({ store }) {
  const { tr, route, setRoute, setBackRoute, pushLog } = store;
  const [plan, setPlan] = useState("balanced");
  const [weights, setWeights] = useState({ available: 92, commitment: 74, forecast: 86, risk: 68, liquidity: 80, urgency: 76 });
  const [reserve, setReserve] = useState(8);
  const [revenue, setRevenue] = useState(2);
  const [rolling, setRolling] = useState(true);
  const [overrides, setOverrides] = useState({});
  const [status, setStatus] = useState("draft");
  const [done, setDone] = useState(null);
  const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");
  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec-space");
    pushLog?.(logText);
    setRoute(targetRoute);
  };
  const navigateStory = (targetRoute) => {
    if (targetRoute === "budexec-space") return;
    openRoute(targetRoute, `Fiscal-space planning opened ${targetRoute}`);
  };

  const budgetCeiling = sumMetric("budget");
  const deductions = sumMetric("reserved");
  const establishedLiabilities = sumMetric("committed");
  const paymentPlanAmount = sumMetric("invoice") + EXPECTED_CLAIMS + CARRY_OVER_DEBT;
  const availableFiscalSpace = budgetCeiling - deductions - establishedLiabilities - paymentPlanAmount;
  const systemAvailable = sumMetric("available");
  const transferPool = UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics.available > 300 ? row.metrics.available : 0), 0);
  const candidates = useMemo(() => UC17_BUDGET_ROWS
    .filter((row) => row.status === "risk" || row.metrics.available > 300)
    .map((row) => ({ ...row, candidate: classifyCandidate(row) })), []);
  const planningOptions = [
    {
      id: "balanced",
      name: { en: "AI recommended · controlled transfer", ar: "موصى به · مناقلة مضبوطة", zh: "AI 推荐 · 受控转移" },
      rec: 91,
      note: { en: "Uses idle balances while protecting committed reserves and payment-plan coverage.", ar: "يستخدم الأرصدة الخاملة مع حماية الاحتياطيات.", zh: "使用闲置可用余额，同时保护已承诺准备和付款计划覆盖。" },
      source: "300070220 / 300090710",
      amount: 352,
      weights: { available: 92, commitment: 74, forecast: 86, risk: 68, liquidity: 80, urgency: 76 },
    },
  ];
  const activePlan = planningOptions.find((item) => item.id === plan) || planningOptions[0];
  const weightLabels = [
    ["available", { en: "Available idle balance", ar: "الرصيد الخامل المتاح", zh: "可用闲置余额" }, 100],
    ["commitment", { en: "Committed reserve protection", ar: "حماية احتياطي الالتزام", zh: "承诺准备保护" }, 100],
    ["forecast", { en: "Rolling forecast pressure", ar: "ضغط التنبؤ المتجدد", zh: "滚动预测压力" }, 100],
    ["risk", { en: "Audit / timing risk", ar: "مخاطر التدقيق والتوقيت", zh: "审计/时间差风险" }, 100],
    ["liquidity", { en: "Financial entitlements liquidity signal", ar: "إشارة سيولة الاستحقاقات المالية", zh: "财务权益流动性信号" }, 100],
    ["urgency", { en: "Payment urgency", ar: "إلحاح الدفع", zh: "付款紧迫度" }, 100],
  ];
  const setSlider = (key, value) => {
    setWeights((current) => ({ ...current, [key]: value }));
    setPlan("");
    setStatus("draft");
  };
  const applyPlan = (option) => {
    setPlan(option.id);
    setWeights(option.weights);
    setStatus("draft");
    setDone(null);
  };
  const maxWeight = Math.max(...Object.values(weights), 1);
  const focusWeights = weightLabels.filter(([key]) => weights[key] === maxWeight).map(([, label]) => tr(label));
  const baseTransfer = Object.values(overrides).reduce((total, value) => total + value, activePlan.amount);
  const adjustedTransfer = Math.max(0, +(baseTransfer * (1 + revenue / 100) * (1 - reserve / 100)).toFixed(0));
  const postTransferSpace = availableFiscalSpace + adjustedTransfer - FORECAST_PRESSURE;
  const forecastSpace = rolling ? postTransferSpace - 70 : postTransferSpace;
  const deficitCount = postTransferSpace < 0 ? 1 : 0;
  const surplusCount = postTransferSpace >= 0 ? candidates.length : Math.max(candidates.length - 1, 0);
  const paperRisk = rolling && postTransferSpace > 0 && forecastSpace < postTransferSpace ? 1 : 0;
  const detailRows = candidates.slice(0, 5).map((row, index) => {
    const recommended = index === 0 ? adjustedTransfer * 0.45 : index === 1 ? adjustedTransfer * 0.28 : Math.min(row.metrics.available, adjustedTransfer * 0.12);
    const allocation = overrides[row.id] ?? Math.round(recommended);
    const occupied = row.metrics.committed + row.metrics.invoice;
    const space = allocation - Math.min(occupied * 0.08, 90);
    return { row, allocation, occupied, space, status: space < 0 ? "deficit" : space < 80 ? "tight" : "surplus" };
  });
  const detailTotal = detailRows.reduce((total, item) => total + item.allocation, 0);
  const allocationDelta = adjustedTransfer - activePlan.amount;
  const aiSummary = {
    en: `Current plan "${tr(activePlan.name)}" reallocates ${formatSar(adjustedTransfer)} from execution ledger balances with ${reserve}% reserve. Key change: ${formatSar(allocationDelta)} vs the base scenario. Risk items: ${deficitCount ? "1 funding gap remains" : "no funding gap"}${paperRisk ? ", 1 paper-surplus line turns tight under rolling forecast" : ", rolling forecast remains covered"}. Recommendation: ${deficitCount ? "fund the gap from surplus before approval" : "submit as an independent scenario copy after review"}.`,
    ar: `تعيد الخطة الحالية توزيع ${formatSar(adjustedTransfer)} مع احتياطي ${reserve}%.`,
    zh: `当前方案「${tr(activePlan.name)}」从执行台账余额中重分配 **${formatSar(adjustedTransfer)}**，储备比例 **${reserve}%**。**关键变化**：相对基础方案 ${allocationDelta >= 0 ? "+" : ""}${formatSar(allocationDelta)}；权重侧重 **${focusWeights.join(" / ")}**。**风险项**：${deficitCount ? "仍有 1 个资金缺口" : "无资金缺口"}${paperRisk ? "，1 条纸面盈余在滚动预测下转紧张" : "，滚动预测下仍可覆盖"}。**优化建议**：${deficitCount ? "先从盈余资金批量补足缺口，再提交审批" : "复核后作为独立场景提交审批"}。`,
  };

  return (
    <div className="page g03-page be17-page wb">
      <BudgetExecutionPageHeader
        tr={tr}
        current="space"
        title={{ en: "Budget Planning, Ceiling Allocation & Fiscal Space", ar: "تخطيط الميزانية وتوزيع السقف والحيز المالي", zh: "预算规划、上限分配与财务空间" }}
        subtitle={{ en: "Real-time fiscal-space update from execution facts, rolling forecast and exception status.", ar: "تحديث فوري للحيز المالي من حقائق التنفيذ والتنبؤ والاستثناءات.", zh: "基于执行事实、滚动预测和异常状态，实时更新财政空间、上限余额与可转移预算候选集合。" }}
        alertCount={riskRows.length}
        onBack={() => openRoute("budexec17", "Back to execution ledger")}
        onAlerts={() => openRoute("budexec-alerts", "Open warning status")}
        onNavigate={navigateStory}
      />

      <div className="bp-aisum be17-space-summary">
        <span className="bp-aisum-ic">✦</span>
        <div className="bp-aisum-tx">
          <span className="bp-aisum-lab">{tr({ en: "AI PLAN SUMMARY", ar: "ملخص خطة الذكاء", zh: "AI 方案摘要" })}</span>
          <span>{tr(aiSummary)}</span>
        </div>
        <span className="bp-agent bp-aisum-ag">{tr({ en: "Rolling Forecasting Agent", ar: "وكيل التنبؤ المتجدد", zh: "Rolling Forecasting Agent" })}</span>
      </div>

      <div className="g03-kpi-grid be17-space-kpis">
        <div className="g03-kpi good"><span>{tr({ en: "Available fiscal space", ar: "الحيز المالي المتاح", zh: "可用资金空间" })}</span><b>{formatSar(availableFiscalSpace)}</b><small>{tr({ en: "ceiling minus deductions, liabilities and payment obligations", ar: "السقف بعد الخصومات والالتزامات", zh: "上限扣除占用后余额" })}</small></div>
        <div className="g03-kpi"><span>{tr({ en: "System available balance", ar: "الرصيد المتاح بالنظام", zh: "系统可用余额" })}</span><b>{formatSar(systemAvailable)}</b><small>{tr({ en: "before commitment-quality classification", ar: "قبل تصنيف جودة الالتزام", zh: "未扣除承诺质量前" })}</small></div>
        <div className="g03-kpi warn"><span>{tr({ en: "Transfer candidate pool", ar: "مجمع مرشحي المناقلة", zh: "可转移候选池" })}</span><b>{formatSar(transferPool)}</b><small>{candidates.length} {tr({ en: "candidate budget lines", ar: "بنود مرشحة", zh: "条候选预算行" })}</small></div>
        <div className="g03-kpi bad"><span>{tr({ en: "Forecast / liquidity pressure", ar: "ضغط التنبؤ والسيولة", zh: "预测/流动性压力" })}</span><b>{formatSar(FORECAST_PRESSURE)}</b><small>{tr({ en: "forecast + liquidity linked signal", ar: "إشارة مرتبطة بالتنبؤ والسيولة", zh: "预测与流动性关联信号" })}</small></div>
      </div>

      <BudgetExecutionSection
        tr={tr}
        title={{ en: "Candidate budget lines", ar: "بنود الميزانية المرشحة", zh: "候选预算行列表" }}
        sub={{ en: "Available-but-idle lines, long commitments without invoice/payment, and liquidity-pressure linked rows.", ar: "بنود متاحة وخاملة أو التزامات طويلة أو مرتبطة بضغط السيولة.", zh: "展示可用但闲置、长期承诺无发票/付款、流动性压力关联的预算行，并给出建议转移路径。" }}
        agent={{ en: "Agent: Fiscal Space Control Agent", ar: "الوكيل: مراقبة الحيز المالي", zh: "Agent：Fiscal Space Control Agent" }}
      >
        <div className="be17-table-wrap compact">
          <table className="be17-table be17-space-table">
            <thead>
              <tr>
                <th>{tr({ en: "Candidate type", ar: "نوع المرشح", zh: "候选类型" })}</th>
                <th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th>
                <th>{tr({ en: "Available / occupied", ar: "المتاح / المشغول", zh: "可用 / 占用" })}</th>
                <th>{tr({ en: "Suggested transfer path", ar: "مسار المناقلة المقترح", zh: "建议转移路径" })}</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((row) => (
                <tr key={row.id}>
                  <td><span className={`be17-space-pill ${row.candidate.tone}`}>{tr(row.candidate.type)}</span></td>
                  <td><strong>{row.code}</strong><span>{tr(row.name)}</span><small>{row.city} · {row.project}</small></td>
                  <td><strong>{formatSar(row.metrics.available)}</strong><span>{tr({ en: "committed", ar: "ملتزم", zh: "已承诺" })}: {formatSar(row.metrics.committed)} · {tr({ en: "invoice", ar: "فاتورة", zh: "收票" })}: {formatSar(row.metrics.invoice)}</span></td>
                  <td>{tr(row.candidate.path)}<small>{tr(row.statusDetail)}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BudgetExecutionSection>

      <div className="uf-sec bp-planbox be17-planbox">
        <div className="uf-h">{tr({ en: "AI planning options & allocation weights", ar: "خيارات التخطيط وأوزان التوزيع", zh: "AI 规划方案与分配权重" })} <span className="bp-agent">{tr({ en: "Budget Optimization Agent · live", ar: "وكيل تحسين الميزانية · حي", zh: "Budget Optimization Agent · 实时" })}</span></div>
        <div className="bp-tabs">
          {planningOptions.map((option) => (
            <button key={option.id} className={`bp-tab${plan === option.id ? " on" : ""}`} type="button" onClick={() => applyPlan(option)}>
              <span className="bp-tab-n">{tr(option.name)}</span>
              <span className={`bp-tab-rec${option.rec >= 88 ? " top" : ""}`}>{tr({ en: "rec", ar: "توصية", zh: "推荐指数" })} {option.rec}</span>
            </button>
          ))}
        </div>
        <div className="bp-plan-ai bp-plan-ai-full">
          <div className="bp-plan-ai-h"><span className="bp-plan-ai-ic">✦</span>{tr({ en: "AI plan interpretation", ar: "تفسير خطة الذكاء", zh: "AI 方案解读" })}</div>
          <div className="bp-plan-ai-b">
            {tr({
              en: `${tr(activePlan.name)} uses ${activePlan.source} and emphasizes ${focusWeights.join(" / ")}. It covers the rolling-forecast ${formatSar(FORECAST_PRESSURE)} pressure with ${formatSar(Math.max(postTransferSpace, 0))} post-transfer buffer.`,
              ar: `الخطة تستخدم ${activePlan.source}.`,
              zh: `「${tr(activePlan.name)}」使用 ${activePlan.source} 作为资金来源，权重侧重 ${focusWeights.join(" / ")}。该方案覆盖滚动预测的 ${formatSar(FORECAST_PRESSURE)} 压力，并形成 ${formatSar(Math.max(postTransferSpace, 0))} 的转移后缓冲。`,
            })}
          </div>
        </div>
        <div className="bp-planrow">
          <div className="bp-pcell bp-locked">
            <div className="bp-diff-h">{tr({ en: "Allocation weights · live", ar: "أوزان التوزيع · حي", zh: "分配权重 · 实时" })}</div>
            {weightLabels.map(([key, label, max]) => (
              <div className="bp-slider" key={key}>
                <span className="bp-slk">{tr(label)}</span>
                <input type="range" min="0" max={max} value={weights[key]} disabled onChange={(event) => setSlider(key, +event.target.value)} />
                <span className="bp-slv">{weights[key]}</span>
              </div>
            ))}
            <div className="bp-slider"><span className="bp-slk">{tr({ en: "Reserve %", ar: "الاحتياطي %", zh: "储备金比例" })}</span><input type="range" min="0" max="20" value={reserve} disabled onChange={(event) => { setReserve(+event.target.value); setStatus("draft"); }} /><span className="bp-slv">{reserve}%</span></div>
            <div className="bp-slider"><span className="bp-slk">{tr({ en: "Revenue forecast %", ar: "توقع الإيراد %", zh: "收入预测" })}</span><input type="range" min="-5" max="8" value={revenue} disabled onChange={(event) => { setRevenue(+event.target.value); setStatus("draft"); }} /><span className="bp-slv">{revenue > 0 ? "+" : ""}{revenue}%</span></div>
          </div>
          <div className="bp-pcell">
            <div className="bp-diff-h">{tr({ en: "Weight-dimension profile", ar: "ملف بُعد الأوزان", zh: "权重维度画像" })}</div>
            <div className="bp-wbars">{weightLabels.map(([key, label]) => <div className="bp-wbar" key={key}><span className="bp-wbar-k">{tr(label)}</span><div className="bp-wbar-t"><i className={weights[key] === maxWeight ? "top" : ""} style={{ width: `${(weights[key] / maxWeight) * 100}%` }} /></div><b>{weights[key]}</b></div>)}</div>
          </div>
          <div className="bp-pcell">
            <div className="bp-diff-h">{tr({ en: "Rolling forecast", ar: "التنبؤ المتجدد", zh: "滚动预测" })} <label className="bp-toggle"><input type="checkbox" checked={rolling} onChange={(event) => { setRolling(event.target.checked); setStatus("draft"); }} /> {tr({ en: "Apply", ar: "تطبيق", zh: "应用" })}</label></div>
            <div className="bp-roll">
              <div className="bp-roll-row"><span>{tr({ en: "Paper space", ar: "الحيز الورقي", zh: "纸面空间" })}</span><b>{formatSar(postTransferSpace)}</b></div>
              <div className="bp-roll-row"><span>{tr({ en: "Forecast space", ar: "الحيز المتوقع", zh: "预测空间" })}</span><b className={forecastSpace < postTransferSpace ? "warn" : ""}>{formatSar(forecastSpace)}</b></div>
              <div className="bp-roll-d">{tr({ en: "Apply rolling forecast to avoid over-estimating fiscal space from idle balances.", ar: "طبّق التنبؤ لتجنب تضخيم الحيز.", zh: "应用滚动预测，避免高估闲置余额形成的财政空间。" })}</div>
            </div>
          </div>
          <div className="bp-pcell">
            <div className="bp-diff-h">{tr({ en: "Version comparison (vs base)", ar: "مقارنة النسخ", zh: "版本对比(相对基础方案)" })}</div>
            <div className="bp-cmp-sum"><b className={allocationDelta >= 0 ? "up" : "down"}>{allocationDelta >= 0 ? "+" : ""}{formatSar(allocationDelta)}</b> {tr({ en: "vs base scenario", ar: "مقابل الأساس", zh: "对比基础方案" })}</div>
            {detailRows.slice(0, 4).map((item) => <div className="bp-cmp-row" key={item.row.id}><span className="bp-cmp-n">{item.row.code}</span><span className="bp-cmp-bars"><i className={item.space >= 0 ? "up" : "down"} style={{ width: `${Math.min(100, Math.abs(item.space) / 3) + 18}%` }} /></span><span className={`bp-cmp-d ${item.space >= 0 ? "up" : "down"}`}>{item.space >= 0 ? "+" : ""}{formatSar(item.space)}</span></div>)}
          </div>
        </div>
        <div className="bp-planbox-tbl">
          <div className="bp-sub-h">↳ {tr({ en: "Budget detail per execution line", ar: "تفصيل الميزانية لكل بند تنفيذ", zh: "预算明细表(按执行预算行展开)" })} {rolling && <span className="bp-fc-tag">{tr({ en: "rolling forecast", ar: "تنبؤ متجدد", zh: "滚动预测口径" })}</span>}</div>
          <div className="bp-tbl-tools">
            <span className="bp-tbl-tools-l">{tr({ en: "Batch adjust", ar: "تعديل جماعي", zh: "批量调整" })}:</span>
            <button type="button" onClick={() => setOverrides(Object.fromEntries(detailRows.map((item) => [item.row.id, Math.max(0, Math.round(item.allocation * 0.98))])))}>−2%</button>
            <button type="button" onClick={() => setOverrides(Object.fromEntries(detailRows.map((item) => [item.row.id, Math.round(item.allocation * 1.02)])))}>+2%</button>
            <button className="bp-tbl-realloc" type="button" onClick={() => { setOverrides(Object.fromEntries(detailRows.map((item) => [item.row.id, Math.round(item.allocation + Math.max(0, -item.space))]))); setStatus("draft"); }}>⇄ {tr({ en: "Fund gap from surplus", ar: "تغطية الفجوة من الفائض", zh: "盈余补缺口" })}</button>
            <button type="button" onClick={() => { setOverrides({}); setStatus("draft"); }}>↺ {tr({ en: "Reset", ar: "إعادة", zh: "复位" })}</button>
          </div>
          <table className="wb-table bp-table">
            <thead><tr><th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Budget ceiling", ar: "سقف الميزانية", zh: "预算上限" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Deductions", ar: "الخصومات", zh: "扣除项" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Committed", ar: "ملتزم", zh: "已承诺" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Payment plan", ar: "خطة الدفع", zh: "支付计划" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Surplus / realloc", ar: "الفائض / إعادة التوزيع", zh: "盈余再分配" })}</th></tr></thead>
            <tbody>{detailRows.map((item) => <tr key={item.row.id} className={item.status}><td>{item.row.code}<small>{tr(item.row.name)}</small></td><td className="bp-mono" style={{ textAlign: "end" }}><input className="bp-edit" value={item.allocation} onChange={(event) => { const value = parseFloat(event.target.value); setOverrides((current) => ({ ...current, [item.row.id]: Number.isNaN(value) ? 0 : value })); setStatus("draft"); }} /></td><td className="bp-mono" style={{ textAlign: "end", color: "#8a5a2b" }}>−{formatSar(item.occupied)}</td><td className="bp-mono" style={{ textAlign: "end" }}>{formatSar(item.row.metrics.committed)}</td><td className="bp-mono" style={{ textAlign: "end" }}>{formatSar(item.row.metrics.invoice)}</td><td className="bp-mono" style={{ textAlign: "end" }}><span className={`bp-realloc-cell ${item.status}`}>{item.space >= 0 ? "+" : ""}{formatSar(item.space)}<span className={`bp-st ${item.status}`}>{tr(item.status === "surplus" ? { en: "surplus", ar: "فائض", zh: "盈余" } : item.status === "deficit" ? { en: "deficit", ar: "عجز", zh: "赤字" } : { en: "tight", ar: "ضيق", zh: "紧张" })}</span></span></td></tr>)}</tbody>
            <tfoot><tr className="bp-drv-foot"><td>{tr({ en: "Σ Total", ar: "الإجمالي", zh: "合计" })}</td><td className="bp-mono" style={{ textAlign: "end", fontWeight: 800 }}>{formatSar(detailTotal)}</td><td className="bp-mono" style={{ textAlign: "end" }}>−{formatSar(detailRows.reduce((total, item) => total + item.occupied, 0))}</td><td className="bp-mono" style={{ textAlign: "end" }}>{formatSar(establishedLiabilities)}</td><td className="bp-mono" style={{ textAlign: "end" }}>{formatSar(sumMetric("invoice"))}</td><td className="bp-mono" style={{ textAlign: "end", fontWeight: 800, color: postTransferSpace < 0 ? "var(--danger)" : "#166534" }}>{postTransferSpace >= 0 ? "+" : ""}{formatSar(postTransferSpace)}</td></tr></tfoot>
          </table>
        </div>
      </div>

      <div className="uf-sec bp-actions be17-space-decision">
        <div className="uf-h">{tr({ en: "Decision", ar: "القرار", zh: "决定 / 审核" })} <span className="bp-agent">{tr({ en: "Approval Orchestrator", ar: "منسق الاعتماد", zh: "Approval Orchestrator" })}</span></div>
        {status === "submitted" ? (
          <div className="bp-next">
            <div className="bp-next-h">✓ {tr({ en: "Submitted for approval", ar: "قُدّم للاعتماد", zh: "已提交审批" })}</div>
            <div className="bp-next-b">{tr({ en: "Scenario BUDGET-SPACE-SCN-2026-Q2 routed to approval owners with execution, forecast and warning evidence attached.", ar: "تم توجيه السيناريو للاعتماد مع أدلة التنفيذ والتنبؤ والتحذيرات.", zh: "场景 BUDGET-SPACE-SCN-2026-Q2 已提交给审批负责人，并附带执行、预测与预警证据。" })}</div>
            <div className="bp-next-owner">👤 Aisha Al-Dosari · {tr({ en: "Budget Execution Planner", ar: "مخططة تنفيذ الميزانية", zh: "预算执行规划员" })} · 📞 +966 50 771 3329</div>
            <button className="dw-btn" type="button" onClick={() => setStatus("draft")}>↺ {tr({ en: "Recall to draft", ar: "استرجاع", zh: "撤回为草稿" })}</button>
          </div>
        ) : (
          <>
            <div className="pc-appr-sum">
              <div className="pc-appr-l">{tr({ en: "Approval object · fiscal-space allocation summary", ar: "موضوع الاعتماد · ملخص الحيز المالي", zh: "审批对象 · 财政空间分配汇总" })}</div>
              <div className="pc-appr-row">
                <div className="pc-appr-cell"><span>{tr({ en: "Plan", ar: "الخطة", zh: "方案" })}</span><b className="pc-appr-nm">{tr(activePlan.name)}</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "Σ BUDGET CEILING", ar: "Σ سقف الميزانية", zh: "Σ 预算上限" })}</span><b>{formatSar(budgetCeiling)}</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "Σ DEDUCTIONS", ar: "Σ الخصومات", zh: "Σ 扣除项" })}</span><b style={{ color: "#b06a1f" }}>−{formatSar(deductions)}</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "POST-TRANSFER SPACE", ar: "الحيز بعد المناقلة", zh: "转移后空间" })}</span><b>{formatSar(postTransferSpace)}</b></div>
              </div>
            </div>
            {deficitCount > 0 && <div className="bp-defwarn">⚠ {tr({ en: "Deficit present — submission blocked. Fund the gap from surplus, then submit.", ar: "يوجد عجز — التقديم محظور.", zh: "存在缺口 — 提交被阻止。请先从盈余资金补足缺口，再提交。" })}</div>}
            <div className="bp-act-btns">
              <button className="dw-btn primary" type="button" disabled={deficitCount > 0} onClick={() => { setStatus("submitted"); pushLog?.({ en: "Fiscal-space scenario submitted", ar: "تم تقديم سيناريو الحيز المالي", zh: "财政空间方案已提交审批" }); }}>{tr({ en: "Submit for approval", ar: "تقديم للاعتماد", zh: "提交审批" })}</button>
              <button className="dw-btn" type="button" onClick={() => setDone({ en: "Draft saved · BUDGET-SPACE-DRAFT", ar: "حُفظت المسودة", zh: "草稿已保存 · BUDGET-SPACE-DRAFT" })}>{tr({ en: "Save draft", ar: "حفظ مسودة", zh: "保存草稿" })}</button>
              <button className="dw-btn" type="button" onClick={() => setDone({ en: "Plan exported (PDF/Excel)", ar: "صُدّرت", zh: "方案已导出(PDF/Excel)" })}>{tr({ en: "Export plan", ar: "تصدير", zh: "导出方案" })}</button>
              <button className="dw-btn primary" type="button" onClick={() => openRoute("budexec-reports", "Fiscal-space financial impact report generated")}>{tr({ en: "Generate financial impact report", ar: "إنشاء تقرير الأثر المالي", zh: "生成财务影响报告" })}</button>
            </div>
            {done && <div className="bp-done">✓ {tr(done)}</div>}
          </>
        )}
      </div>
      <BudgetExecutionSmartQuery tr={tr} pushLog={pushLog} page="uc07" />
    </div>
  );
}
