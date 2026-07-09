import React from "react";
import { BudgetExecutionPageHeader } from "../components/BudgetExecutionPageHeader.jsx";
import { BudgetExecutionSection } from "../components/BudgetExecutionSection.jsx";
import { BudgetExecutionSmartQuery } from "../components/BudgetExecutionSmartQuery.jsx";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const buildWarningType = (row) => {
  if (row.statusDetail.en.includes("without invoice")) {
    return { en: "Committed with no invoice/payment", ar: "التزام بلا فاتورة أو دفع", zh: "已承诺但长期未付款" };
  }
  if (row.statusDetail.en.includes("Available but idle")) {
    return { en: "Idle available budget line", ar: "بند متاح وخامل", zh: "可用但闲置预算行" };
  }
  if (row.statusDetail.en.includes("payment plan is missing")) {
    return { en: "Missing payment plan", ar: "خطة دفع مفقودة", zh: "付款计划缺失" };
  }
  return { en: "Reconciliation timing difference", ar: "فرق توقيت في المطابقة", zh: "对账时间差异" };
};

/**
 * Exception monitoring page sourced from the current execution ledger.
 */
export function BudgetExecutionAlertsPage({ store }) {
  const { tr, route, setRoute, setBackRoute, pushLog } = store;
  const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");
  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec-alerts");
    pushLog?.(logText);
    setRoute(targetRoute);
  };
  const navigateStory = (targetRoute) => {
    if (targetRoute === "budexec-alerts") return;
    openRoute(targetRoute, `Budget execution exceptions opened ${targetRoute}`);
  };

  return (
    <div className="page g03-page be17-page wb">
      <BudgetExecutionPageHeader
        tr={tr}
        current="exceptions"
        title={{ en: "Execution Warnings & Exception Monitoring", ar: "تنبيهات التنفيذ ومراقبة الاستثناءات", zh: "执行预警与异常监控" }}
        subtitle={{ en: "Current execution warnings are tied to budget line, movement stage and proposed handling path.", ar: "ترتبط التحذيرات الحالية ببند الميزانية ومرحلة الحركة ومسار المعالجة المقترح.", zh: "呈现当前执行预警数据，并保留每条预警对应的预算行、movement 阶段和建议处理路径。" }}
        alertCount={riskRows.length}
        onBack={() => openRoute("budexec17", "Back to execution ledger")}
        onNavigate={navigateStory}
      />

      <section className="bp-aisum be17-ai-summary">
        <span className="bp-aisum-ic">✦</span>
        <div className="bp-aisum-tx be17-aisum-tx">
          <span className="bp-aisum-lab">{tr({ en: "AI WARNING SUMMARY", ar: "ملخص التحذيرات", zh: "AI 预警摘要" })}</span>
          <span className="be17-ai-line">
            {tr({
              en: `${riskRows.length} warning budget lines were received from the execution ledger. AI has classified stale commitments, idle available funds, missing payment plans and reconciliation timing differences for review.`,
              ar: `تم استلام ${riskRows.length} بنود تحذير من دفتر التنفيذ. صنف الذكاء الاصطناعي الالتزامات المتقادمة والأرصدة الخاملة وخطط الدفع المفقودة وفروقات المطابقة.`,
              zh: `已从执行台账接收 ${riskRows.length} 条预警预算行。AI 已按长期承诺未付款、可用闲置、付款计划缺失、对账时间差异完成分类。`,
            })}
          </span>
        </div>
        <div className="be17-summary-side">
          <div className="be17-summary-actionbar">
            <button className="btn secondary sm" type="button" onClick={() => openRoute("budexec-forecast", "Warnings routed to rolling forecast")}>{tr({ en: "Send to forecast", ar: "إرسال للتنبؤ", zh: "送入滚动预测" })}</button>
            <button className="btn sm" type="button" onClick={() => openRoute("budexec17", "Warnings reviewed against execution ledger")}>{tr({ en: "Review ledger", ar: "مراجعة الدفتر", zh: "回看执行台账" })}</button>
          </div>
          <span className="bp-agent bp-aisum-ag">{tr({ en: "Exception Monitoring Agent", ar: "وكيل مراقبة الاستثناءات", zh: "Exception Monitoring Agent" })}</span>
        </div>
      </section>

      <div className="g03-kpi-grid be17-alert-kpis">
        <div className="g03-kpi bad"><span>{tr({ en: "Risk budget lines", ar: "بنود عالية المخاطر", zh: "风险预算行" })}</span><b>{riskRows.length}</b><small>{tr({ en: "from execution ledger", ar: "من دفتر التنفيذ", zh: "来自执行台账" })}</small></div>
        <div className="g03-kpi warn"><span>{tr({ en: "Committed amount under warning", ar: "التزامات تحت التحذير", zh: "预警承诺金额" })}</span><b>{formatSar(riskRows.reduce((sum, row) => sum + row.metrics.committed, 0))}</b><small>{tr({ en: "requires owner review", ar: "تتطلب مراجعة المالك", zh: "需业务负责人复核" })}</small></div>
        <div className="g03-kpi good"><span>{tr({ en: "Transfer candidates", ar: "مرشحات المناقلة", zh: "转移候选" })}</span><b>{formatSar(riskRows.reduce((sum, row) => sum + Math.max(row.metrics.available, 0), 0))}</b><small>{tr({ en: "available-funds review pool", ar: "مجمع مراجعة الأموال المتاحة", zh: "可用资金复核池" })}</small></div>
        <div className="g03-kpi"><span>{tr({ en: "Latest source refresh", ar: "آخر تحديث للمصدر", zh: "最新来源刷新" })}</span><b>2026-05-01</b><small>SAP/Asas · Etimad Plus</small></div>
      </div>

      <BudgetExecutionSection
        tr={tr}
        title={{ en: "Current warning data", ar: "بيانات التحذير الحالية من التنفيذ", zh: "当前预警数据" }}
        sub={{ en: "Each warning remains traceable to the selected execution budget line, movement stage and suggested transfer path.", ar: "كل تحذير قابل للتتبع إلى بند الميزانية ومرحلة الحركة ومسار المناقلة المقترح.", zh: "每条预警均可追溯到执行预算行、movement 阶段和建议转移路径。" }}
        agent={{ en: "Agent: Exception Monitoring Agent", ar: "الوكيل: مراقبة الاستثناءات", zh: "Agent：Exception Monitoring Agent" }}
      >
        <div className="be17-table-wrap compact">
          <table className="be17-table be17-alert-table">
            <thead>
              <tr>
                <th>{tr({ en: "Warning type", ar: "نوع التحذير", zh: "预警类型" })}</th>
                <th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th>
                <th>{tr({ en: "Execution evidence", ar: "دليل التنفيذ", zh: "执行证据" })}</th>
                <th>{tr({ en: "Financial exposure", ar: "التعرض المالي", zh: "财务暴露" })}</th>
                <th>{tr({ en: "Next handling path", ar: "مسار المعالجة التالي", zh: "下一步处理路径" })}</th>
              </tr>
            </thead>
            <tbody>
              {riskRows.map((row) => (
                <tr key={row.id}>
                  <td><span className="be17-analysis-pill risk">{tr(buildWarningType(row))}</span></td>
                  <td><strong>{row.code}</strong><span>{tr(row.name)}</span><small>{row.city} · {row.supplier}</small></td>
                  <td>{tr(row.statusDetail)}<small>{row.source} · {row.updatedAt}</small></td>
                  <td><strong>{formatSar(row.metrics.committed)}</strong><span>{tr({ en: "available", ar: "المتاح", zh: "可用" })}: {formatSar(row.metrics.available)}</span></td>
                  <td>{tr({ en: "Exception review → transfer-path review → rolling forecast pressure check", ar: "مراجعة الاستثناء ← مسار المناقلة ← ضغط التنبؤ", zh: "异常复核 → 转移路径复核 → 滚动预测压力检查" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BudgetExecutionSection>
      <BudgetExecutionSmartQuery tr={tr} pushLog={pushLog} page="uc02" />
    </div>
  );
}
