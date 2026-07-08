import React from "react";
import { BudgetExecutionPageHeader } from "../components/BudgetExecutionPageHeader.jsx";
import { BudgetExecutionSection } from "../components/BudgetExecutionSection.jsx";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const sumMetric = (key) => UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics[key] || 0), 0);

/**
 * G03 report generation page seeded by the current UC17 execution ledger.
 */
export function BudgetExecutionReportPage({ store }) {
  const { tr, route, setRoute, setBackRoute, pushLog } = store;
  const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");
  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec-reports");
    pushLog?.(logText);
    setRoute(targetRoute);
  };
  const navigateStory = (targetRoute) => {
    if (targetRoute === "budexec-reports") return;
    openRoute(targetRoute, `Budget execution report opened ${targetRoute}`);
  };
  const reportRows = [
    { label: { en: "Total budget", ar: "إجمالي الميزانية", zh: "预算总额" }, value: formatSar(sumMetric("budget")), source: "SAP/Asas budget ledger" },
    { label: { en: "Committed amount", ar: "المبلغ الملتزم", zh: "已承诺金额" }, value: formatSar(sumMetric("committed")), source: "SAP/Asas commitments" },
    { label: { en: "Total invoices", ar: "إجمالي الفواتير", zh: "收票总额" }, value: formatSar(sumMetric("invoice")), source: "Etimad + SAP invoices" },
    { label: { en: "Actual payment", ar: "الدفع الفعلي", zh: "实际付款" }, value: formatSar(sumMetric("paid")), source: "SAP payment movement" },
    { label: { en: "Available funds", ar: "الأموال المتاحة", zh: "可用资金" }, value: formatSar(sumMetric("available")), source: "Availability report" },
  ];

  return (
    <div className="page g03-page be17-page wb">
      <BudgetExecutionPageHeader
        tr={tr}
        current="reports"
        title={{ en: "Report Generation from Execution Ledger", ar: "إنشاء التقرير من دفتر التنفيذ", zh: "基于执行台账的报告生成" }}
        subtitle={{ en: "Generate a management report package from UC17 budget execution rows, warnings and forecast-ready evidence.", ar: "إنشاء حزمة تقرير إداري من بنود التنفيذ والتحذيرات وأدلة التنبؤ.", zh: "从 UC17 预算执行行、预警和预测输入证据生成管理报告包。" }}
        alertCount={riskRows.length}
        onBack={() => openRoute("budexec17", "Back to execution ledger")}
        onAlerts={() => openRoute("budexec-alerts", "Open execution warning data")}
        onNavigate={navigateStory}
      />

      <section className="bp-aisum be17-ai-summary">
        <span className="bp-aisum-ic">✦</span>
        <div className="bp-aisum-tx be17-aisum-tx">
          <span className="bp-aisum-lab">{tr({ en: "REPORT DRAFT READY", ar: "مسودة التقرير جاهزة", zh: "报告草稿已生成" })}</span>
          <span className="be17-ai-line">
            {tr({
              en: `The report has been generated from the current execution ledger: ${UC17_BUDGET_ROWS.length} rows, ${riskRows.length} warning rows, ${formatSar(sumMetric("available"))} available funds and ${formatSar(sumMetric("committed"))} committed amount. Evidence includes SAP/Asas movements, Etimad invoices and availability reports.`,
              ar: `تم إنشاء التقرير من دفتر التنفيذ الحالي: ${UC17_BUDGET_ROWS.length} بنود، ${riskRows.length} تحذيرات، أموال متاحة ${formatSar(sumMetric("available"))} والتزامات ${formatSar(sumMetric("committed"))}.`,
              zh: `报告已基于当前执行台账生成：${UC17_BUDGET_ROWS.length} 条预算行、${riskRows.length} 条预警行、可用资金 ${formatSar(sumMetric("available"))}、已承诺 ${formatSar(sumMetric("committed"))}。证据包括 SAP/Asas movement、Etimad 发票和可用性报告。`,
            })}
          </span>
        </div>
        <div className="be17-summary-side">
          <div className="be17-summary-actionbar">
            <button className="btn secondary sm" type="button" onClick={() => openRoute("budexec-forecast", "Report checked against rolling forecast")}>{tr({ en: "Check forecast basis", ar: "فحص أساس التنبؤ", zh: "查看预测依据" })}</button>
            <button className="btn sm" type="button" onClick={() => pushLog?.({ en: "Budget execution report draft regenerated", ar: "أعيد إنشاء مسودة التقرير", zh: "预算执行报告草稿已重新生成" })}>{tr({ en: "Regenerate draft", ar: "إعادة توليد المسودة", zh: "重新生成草稿" })}</button>
          </div>
          <span className="bp-agent bp-aisum-ag">{tr({ en: "Financial Reports Generation Agent", ar: "وكيل إنشاء التقارير المالية", zh: "Financial Reports Generation Agent" })}</span>
        </div>
      </section>

      <div className="be17-report-grid">
        <BudgetExecutionSection
          tr={tr}
          title={{ en: "Management report outline", ar: "مخطط التقرير الإداري", zh: "管理报告结构" }}
          sub={{ en: "The narrative is tied to the selected execution ledger and current warning queue.", ar: "السرد مرتبط بدفتر التنفيذ وقائمة التحذيرات.", zh: "报告叙述绑定当前执行台账和预警队列。" }}
          agent={{ en: "Agent: Narrative Commentary Agent", ar: "الوكيل: التعليق السردي", zh: "Agent：Narrative Commentary Agent" }}
        >
          <div className="be17-report-outline">
            {[
              { h: { en: "Executive summary", ar: "الملخص التنفيذي", zh: "执行摘要" }, d: { en: "Budget execution is traceable across PR, PO, contract, invoice, payment, transfer and balance stages.", ar: "تنفيذ الميزانية قابل للتتبع عبر المراحل.", zh: "预算执行可贯穿 PR、PO、合同、发票、付款、转移、余额阶段追踪。" } },
              { h: { en: "Warnings and transfer candidates", ar: "التحذيرات ومرشحات المناقلة", zh: "预警与转移候选" }, d: { en: `${riskRows.length} warning rows require owner review before release or transfer.`, ar: `${riskRows.length} بنود تتطلب مراجعة المالك.`, zh: `${riskRows.length} 条预警预算行需要负责人复核后再释放或转移。` } },
              { h: { en: "Forecast implication", ar: "أثر التنبؤ", zh: "预测影响" }, d: { en: "Execution actuals are ready to feed rolling forecast and liquidity-pressure review.", ar: "فعليات التنفيذ جاهزة للتنبؤ المتجدد.", zh: "执行实际数已可输入滚动预测与流动性压力复核。" } },
            ].map((item, index) => (
              <div key={index} className="be17-report-section">
                <b>{index + 1}. {tr(item.h)}</b>
                <p>{tr(item.d)}</p>
              </div>
            ))}
          </div>
        </BudgetExecutionSection>

        <BudgetExecutionSection
          tr={tr}
          title={{ en: "Report data basis", ar: "أساس بيانات التقرير", zh: "报告数据底稿" }}
          sub={{ en: "Current values are generated from UC17 rows, not a static Excel export.", ar: "القيم مولدة من بنود التنفيذ الحالية.", zh: "当前数值来自 UC17 执行行，而不是静态 Excel 导出。" }}
          agent={{ en: "Agent: Evidence & Audit Trace Agent", ar: "الوكيل: الأدلة وسجل التدقيق", zh: "Agent：Evidence & Audit Trace Agent" }}
        >
          <div className="be17-table-wrap compact">
            <table className="be17-table be17-report-table">
              <thead>
                <tr>
                  <th>{tr({ en: "Metric", ar: "المؤشر", zh: "指标" })}</th>
                  <th>{tr({ en: "Value", ar: "القيمة", zh: "数值" })}</th>
                  <th>{tr({ en: "Evidence source", ar: "مصدر الدليل", zh: "证据来源" })}</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.source}>
                    <td><strong>{tr(row.label)}</strong></td>
                    <td>{row.value}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BudgetExecutionSection>
      </div>

      <BudgetExecutionSection
        tr={tr}
        title={{ en: "Budget lines included in this report", ar: "بنود الميزانية المشمولة في التقرير", zh: "本报告包含的预算行" }}
        sub={{ en: "The report package keeps the original budget line, project, supplier, status and suggested handling path.", ar: "تحتفظ الحزمة بالبند والمشروع والمورد والحالة ومسار المعالجة.", zh: "报告包保留原预算行、项目、供应商、状态和建议处理路径。" }}
        agent={{ en: "Agent: Financial Reports Generation Agent", ar: "الوكيل: إنشاء التقارير المالية", zh: "Agent：Financial Reports Generation Agent" }}
      >
        <div className="be17-table-wrap compact">
          <table className="be17-table be17-analysis-table">
            <thead>
              <tr>
                <th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th>
                <th>{tr({ en: "Project / supplier", ar: "المشروع / المورد", zh: "项目 / 供应商" })}</th>
                <th>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</th>
                <th>{tr({ en: "Report note", ar: "ملاحظة التقرير", zh: "报告说明" })}</th>
              </tr>
            </thead>
            <tbody>
              {UC17_BUDGET_ROWS.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.code}</strong><span>{tr(row.name)}</span></td>
                  <td><strong>{row.project}</strong><span>{row.supplier}</span></td>
                  <td><span className={`be17-analysis-pill ${row.status === "risk" ? "risk" : "normal"}`}>{tr(row.status === "risk" ? { en: "Warning", ar: "تحذير", zh: "预警" } : { en: "Normal", ar: "طبيعي", zh: "正常" })}</span></td>
                  <td>{row.status === "risk" ? tr(row.statusDetail) : tr({ en: "No exception; retain in regular monitoring section.", ar: "لا استثناء؛ يبقى في المراقبة العادية.", zh: "无异常，保留在常规监控章节。" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BudgetExecutionSection>
    </div>
  );
}
