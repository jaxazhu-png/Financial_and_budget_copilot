import React, { useMemo, useState } from "react";
import { BudgetExecutionPageHeader } from "../components/BudgetExecutionPageHeader.jsx";
import { BudgetExecutionSection } from "../components/BudgetExecutionSection.jsx";
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
      type: { en: "G04 liquidity pressure linked", ar: "مرتبط بضغط سيولة G04", zh: "关联 G04 流动性压力" },
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
  const [selectedScenario, setSelectedScenario] = useState("balanced");
  const [decision, setDecision] = useState("draft");
  const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");
  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec-space");
    pushLog?.(logText);
    setRoute(targetRoute);
  };
  const navigateStory = (targetRoute) => {
    if (targetRoute === "budexec-space") return;
    openRoute(targetRoute, `G03-UC07 opened ${targetRoute}`);
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
  const scenarios = [
    {
      id: "balanced",
      recommended: true,
      title: { en: "AI recommended · controlled transfer", ar: "موصى به · مناقلة مضبوطة", zh: "AI 推荐 · 受控转移" },
      source: "300070220 / 300090710",
      target: { en: "Q4 payment pressure pool + G04 liquidity signal", ar: "مجمع ضغط الربع الرابع + إشارة G04", zh: "Q4 支付压力池 + G04 流动性信号" },
      amount: 352,
      risk: { en: "Medium", ar: "متوسط", zh: "中" },
      reason: { en: "Uses idle available balances while preserving committed reserves and payment-plan coverage.", ar: "يستخدم الأرصدة الخاملة مع حماية الاحتياطيات.", zh: "使用闲置可用余额，同时保护已承诺准备和付款计划覆盖。" },
      impact: { en: "Covers UC04 SAR 230M forecast gap and leaves SAR 122M buffer.", ar: "يغطي فجوة UC04 ويترك احتياطياً.", zh: "覆盖 UC04 的 SAR 230M 预测缺口，并保留 SAR 122M 缓冲。" },
    },
    {
      id: "conservative",
      title: { en: "Conservative · hold risk lines", ar: "محافظ · حجز بنود المخاطر", zh: "保守 · 暂缓风险行" },
      source: "300090710 only",
      target: { en: "Central liquidity buffer", ar: "احتياطي السيولة المركزي", zh: "中央流动性缓冲" },
      amount: 160,
      risk: { en: "Low", ar: "منخفض", zh: "低" },
      reason: { en: "Transfers only low-risk available balance and waits for owner confirmation on stalled commitments.", ar: "ينقل الرصيد منخفض المخاطر فقط.", zh: "仅转移低风险可用余额，等待滞留承诺负责人确认。" },
      impact: { en: "Reduces pressure but leaves SAR 70M of UC04 gap unresolved.", ar: "يخفض الضغط ويبقي جزءاً من الفجوة.", zh: "降低压力，但仍有 SAR 70M UC04 缺口未解决。" },
    },
    {
      id: "aggressive",
      title: { en: "Aggressive · release all idle pool", ar: "مكثف · تحرير كامل الرصيد الخامل", zh: "积极 · 释放全部闲置池" },
      source: "300060010 / 300040110 / 300070220",
      target: { en: "Payment pressure + short-term liquidity", ar: "ضغط المدفوعات + السيولة", zh: "支付压力 + 短期流动性" },
      amount: 684,
      risk: { en: "High", ar: "مرتفع", zh: "高" },
      reason: { en: "Maximizes available-space reuse but touches lines with open SAP/Etimad timing differences.", ar: "يزيد إعادة الاستخدام لكنه يمس فروقات توقيت.", zh: "最大化复用可用空间，但涉及 SAP/Etimad 时间差异行。" },
      impact: { en: "Clears forecast gap and creates larger buffer; requires stronger audit note.", ar: "يغلق الفجوة ويتطلب مذكرة تدقيق أقوى.", zh: "清除预测缺口并形成更大缓冲，但需要更强审计说明。" },
    },
  ];
  const activeScenario = scenarios.find((item) => item.id === selectedScenario) || scenarios[0];
  const scenarioSpace = availableFiscalSpace + activeScenario.amount - FORECAST_PRESSURE;

  const approveScenario = () => {
    setDecision("approved");
    pushLog?.({ en: "G03-UC07 transfer scenario approved as independent draft copy", ar: "تم اعتماد سيناريو UC07 كنسخة مستقلة", zh: "G03-UC07 转移方案已作为独立副本批准" });
  };

  return (
    <div className="page g03-page be17-page wb">
      <BudgetExecutionPageHeader
        tr={tr}
        current="space"
        title={{ en: "G03-UC07 Budget Planning, Ceiling Allocation & Fiscal Space", ar: "G03-UC07 تخطيط الميزانية وتوزيع السقف والحيز المالي", zh: "G03-UC07 预算规划、上限分配与财务空间" }}
        subtitle={{ en: "Real-time fiscal-space update from UC17 execution facts, UC04 rolling forecast and UC02 exception status.", ar: "تحديث فوري للحيز المالي من UC17 وUC04 وUC02.", zh: "基于 UC17 执行事实、UC04 滚动预测和 UC02 异常状态，实时更新财政空间、上限余额与可转移预算候选集合。" }}
        alertCount={riskRows.length}
        onBack={() => openRoute("budexec17", "Back to execution ledger")}
        onAlerts={() => openRoute("budexec-alerts", "Open UC02 warning status")}
        onNavigate={navigateStory}
      />

      <section className="bp-aisum be17-ai-summary be17-space-summary">
        <span className="bp-aisum-ic">∑</span>
        <div className="bp-aisum-tx be17-aisum-tx">
          <span className="bp-aisum-lab">{tr({ en: "REAL-TIME FISCAL SPACE", ar: "الحيز المالي الفوري", zh: "实时财务空间" })}</span>
          <span className="be17-ai-line">
            {tr({
              en: `Available fiscal space = budget ceiling ${formatSar(budgetCeiling)} − deductions ${formatSar(deductions)} − established liabilities ${formatSar(establishedLiabilities)} − payment plans / expected claims / carry-over debt ${formatSar(paymentPlanAmount)} = ${formatSar(availableFiscalSpace)}.`,
              ar: `الحيز المالي = السقف ${formatSar(budgetCeiling)} − الخصومات ${formatSar(deductions)} − الالتزامات ${formatSar(establishedLiabilities)} − خطط الدفع والمطالبات والدين ${formatSar(paymentPlanAmount)} = ${formatSar(availableFiscalSpace)}.`,
              zh: `可用资金空间 = 预算上限 ${formatSar(budgetCeiling)} − 扣除项 ${formatSar(deductions)} − 既定负债 ${formatSar(establishedLiabilities)} − 付款计划/预期索赔/结转债务 ${formatSar(paymentPlanAmount)} = ${formatSar(availableFiscalSpace)}。`,
            })}
          </span>
        </div>
        <div className="be17-summary-side">
          <div className="be17-summary-actionbar">
            <button className="btn sm" type="button" onClick={() => openRoute("budexec-reports", "UC07 financial impact report generated")}>{tr({ en: "Generate financial impact report", ar: "إنشاء تقرير الأثر المالي", zh: "生成财务影响报告" })}</button>
          </div>
          <span className="bp-agent bp-aisum-ag">{tr({ en: "Budget Optimization Agent", ar: "وكيل تحسين الميزانية", zh: "Budget Optimization Agent" })}</span>
        </div>
      </section>

      <div className="g03-kpi-grid be17-space-kpis">
        <div className="g03-kpi good"><span>{tr({ en: "Available fiscal space", ar: "الحيز المالي المتاح", zh: "可用资金空间" })}</span><b>{formatSar(availableFiscalSpace)}</b><small>{tr({ en: "ceiling minus deductions, liabilities and payment obligations", ar: "السقف بعد الخصومات والالتزامات", zh: "上限扣除占用后余额" })}</small></div>
        <div className="g03-kpi"><span>{tr({ en: "System available balance", ar: "الرصيد المتاح بالنظام", zh: "系统可用余额" })}</span><b>{formatSar(systemAvailable)}</b><small>{tr({ en: "before commitment-quality classification", ar: "قبل تصنيف جودة الالتزام", zh: "未扣除承诺质量前" })}</small></div>
        <div className="g03-kpi warn"><span>{tr({ en: "Transfer candidate pool", ar: "مجمع مرشحي المناقلة", zh: "可转移候选池" })}</span><b>{formatSar(transferPool)}</b><small>{candidates.length} {tr({ en: "candidate budget lines", ar: "بنود مرشحة", zh: "条候选预算行" })}</small></div>
        <div className="g03-kpi bad"><span>{tr({ en: "Forecast / liquidity pressure", ar: "ضغط التنبؤ والسيولة", zh: "预测/流动性压力" })}</span><b>{formatSar(FORECAST_PRESSURE)}</b><small>UC04 + G04 {tr({ en: "linked signal", ar: "إشارة مرتبطة", zh: "关联信号" })}</small></div>
      </div>

      <BudgetExecutionSection
        tr={tr}
        title={{ en: "Candidate budget lines", ar: "بنود الميزانية المرشحة", zh: "候选预算行列表" }}
        sub={{ en: "Available-but-idle lines, long commitments without invoice/payment, and G04 liquidity-pressure linked rows.", ar: "بنود متاحة وخاملة أو التزامات طويلة أو مرتبطة بضغط G04.", zh: "展示可用但闲置、长期承诺无发票/付款、G04 流动性压力关联的预算行，并给出建议转移路径。" }}
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

      <BudgetExecutionSection
        tr={tr}
        title={{ en: "AI transfer / reallocation scenarios", ar: "سيناريوهات المناقلة وإعادة التوزيع", zh: "AI 转移/重分配场景卡片" }}
        sub={{ en: "Each option is saved as an independent scenario copy and never overwrites the approved ceiling.", ar: "كل خيار محفوظ كنسخة مستقلة ولا يستبدل السقف المعتمد.", zh: "每个方案保留为独立场景，不覆盖已批准上限。" }}
        agent={{ en: "Agent: Budget Optimization Agent", ar: "الوكيل: تحسين الميزانية", zh: "Agent：Budget Optimization Agent" }}
      >
        <div className="bp-scenario-grid be17-scenario-grid">
          {scenarios.map((scenario) => (
            <button key={scenario.id} className={`bp-scenario-card ${selectedScenario === scenario.id ? "on" : ""}`} type="button" onClick={() => setSelectedScenario(scenario.id)}>
              <div className="bp-scenario-head"><span>{tr(scenario.title)}</span>{scenario.recommended && <em>{tr({ en: "Recommended", ar: "موصى به", zh: "推荐" })}</em>}</div>
              <p>{tr(scenario.reason)}</p>
              <div className="bp-scenario-metrics">
                <div><small>{tr({ en: "Source", ar: "المصدر", zh: "资金来源" })}</small><b>{scenario.source}</b></div>
                <div><small>{tr({ en: "Amount", ar: "المبلغ", zh: "金额" })}</small><b>{formatSar(scenario.amount)}</b></div>
                <div><small>{tr({ en: "Risk", ar: "المخاطر", zh: "风险等级" })}</small><b>{tr(scenario.risk)}</b></div>
              </div>
              <strong>{tr(scenario.impact)}</strong>
            </button>
          ))}
        </div>
      </BudgetExecutionSection>

      <div className="be17-space-bottom">
        <BudgetExecutionSection
          tr={tr}
          title={{ en: "Selected scenario impact", ar: "أثر السيناريو المختار", zh: "选中方案影响" }}
          sub={{ en: "Funding source, impact target, risk level and post-transfer fiscal position.", ar: "المصدر والهدف والخطر والحيز بعد المناقلة.", zh: "展示资金来源、影响对象、风险等级和转移后的财政空间。" }}
          agent={{ en: "Agent: Financial Impact Agent", ar: "الوكيل: الأثر المالي", zh: "Agent：Financial Impact Agent" }}
        >
          <div className="be17-space-impact">
            <div><span>{tr({ en: "Funding source", ar: "مصدر التمويل", zh: "资金来源" })}</span><b>{activeScenario.source}</b></div>
            <div><span>{tr({ en: "Impact target", ar: "الهدف", zh: "影响对象" })}</span><b>{tr(activeScenario.target)}</b></div>
            <div><span>{tr({ en: "Scenario amount", ar: "مبلغ السيناريو", zh: "方案金额" })}</span><b>{formatSar(activeScenario.amount)}</b></div>
            <div><span>{tr({ en: "Post-transfer space", ar: "الحيز بعد المناقلة", zh: "转移后空间" })}</span><b>{formatSar(scenarioSpace)}</b></div>
          </div>
        </BudgetExecutionSection>

        <BudgetExecutionSection
          tr={tr}
          title={{ en: "Human approval panel", ar: "لوحة الاعتماد البشري", zh: "人工审批面板" }}
          sub={{ en: "Authorized staff can approve, return or keep the scenario as a draft.", ar: "اعتماد أو إرجاع أو حفظ كمسودة.", zh: "授权人员可审批、退回或保存草稿。" }}
          agent={{ en: "Agent: Approval Orchestrator", ar: "الوكيل: منسق الاعتماد", zh: "Agent：Approval Orchestrator" }}
        >
          <div className={`be17-space-approval ${decision}`}>
            <strong>{decision === "approved" ? tr({ en: "Scenario approved as independent copy", ar: "اعتمد السيناريو كنسخة مستقلة", zh: "方案已作为独立副本批准" }) : decision === "returned" ? tr({ en: "Scenario returned for revision", ar: "أعيد السيناريو للتعديل", zh: "方案已退回修改" }) : tr({ en: "Scenario draft ready", ar: "مسودة السيناريو جاهزة", zh: "方案草稿已就绪" })}</strong>
            <p>{tr({ en: "Approved ceilings remain unchanged. This scenario is stored as G03-UC07-SCN-2026-Q2 and can be attached to the UC10 financial impact report.", ar: "لا يتغير السقف المعتمد. تُحفظ النسخة ويمكن إرفاقها بتقرير UC10.", zh: "已批准上限不被覆盖。本方案保存为 G03-UC07-SCN-2026-Q2，可附入 UC10 财务影响报告。" })}</p>
            <div className="be17-space-actions">
              <button className="btn sm" type="button" onClick={approveScenario}>{tr({ en: "Approve scenario", ar: "اعتماد السيناريو", zh: "审批方案" })}</button>
              <button className="btn ghost sm" type="button" onClick={() => setDecision("returned")}>{tr({ en: "Return", ar: "إرجاع", zh: "退回" })}</button>
              <button className="btn secondary sm" type="button" onClick={() => setDecision("draft")}>{tr({ en: "Save draft", ar: "حفظ المسودة", zh: "保存草稿" })}</button>
              <button className="btn sm" type="button" onClick={() => openRoute("budexec-reports", "UC07 financial impact report generated")}>{tr({ en: "Generate financial impact report", ar: "إنشاء تقرير الأثر المالي", zh: "生成财务影响报告" })}</button>
            </div>
          </div>
        </BudgetExecutionSection>
      </div>
    </div>
  );
}
