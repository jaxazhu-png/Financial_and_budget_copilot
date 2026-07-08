import React from "react";
import { BudgetExecutionPageHeader } from "../components/BudgetExecutionPageHeader.jsx";
import { BudgetExecutionSection } from "../components/BudgetExecutionSection.jsx";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const FORECAST_PERIODS = [
  { period: "FY2026 Q3", execution: 590, committed: 1120, invoice: 610, available: 890, forecastNeed: 990, ceiling: 1040 },
  { period: "FY2026 Q4", execution: 760, committed: 1380, invoice: 740, available: 710, forecastNeed: 1260, ceiling: 1120 },
  { period: "FY2027 Q1", execution: 820, committed: 1210, invoice: 680, available: 640, forecastNeed: 1180, ceiling: 1090 },
  { period: "FY2027 Q2", execution: 690, committed: 980, invoice: 560, available: 770, forecastNeed: 930, ceiling: 1030 },
];

const sumMetric = (key) => UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics[key] || 0), 0);

/**
 * G03 forecast page copied from the G02 rolling-forecast logic, now seeded by UC17 execution data.
 */
export function BudgetExecutionForecastPage({ store }) {
  const { tr, route, setRoute, setBackRoute, pushLog } = store;
  const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");
  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec-forecast");
    pushLog?.(logText);
    setRoute(targetRoute);
  };
  const navigateStory = (targetRoute) => {
    if (targetRoute === "budexec-forecast") return;
    openRoute(targetRoute, `Budget execution forecast opened ${targetRoute}`);
  };
  const forecastGap = FORECAST_PERIODS.reduce((total, row) => total + Math.max(row.forecastNeed - row.ceiling, 0), 0);
  const peak = FORECAST_PERIODS.slice().sort((a, b) => (b.forecastNeed - b.ceiling) - (a.forecastNeed - a.ceiling))[0];

  return (
    <div className="page g03-page be17-page wb">
      <BudgetExecutionPageHeader
        tr={tr}
        current="forecast"
        title={{ en: "Future Obligations & Rolling Funding Forecast", ar: "الالتزامات المستقبلية والتنبؤ المتجدد بالتمويل", zh: "未来义务与资金滚动预测" }}
        subtitle={{ en: "Use execution ledger actuals to forecast future obligations, funding pressure and available fiscal room.", ar: "استخدام فعليات دفتر التنفيذ للتنبؤ بالالتزامات المستقبلية وضغط التمويل.", zh: "基于执行台账实际数据，预测未来义务、资金压力与可用财政空间。" }}
        alertCount={riskRows.length}
        onBack={() => openRoute("budexec17", "Back to execution ledger")}
        onAlerts={() => openRoute("budexec-alerts", "Open execution warning data")}
        onNavigate={navigateStory}
      />

      <section className="bp-aisum be17-ai-summary be17-forecast-ready">
        <span className="bp-aisum-ic">✦</span>
        <div className="bp-aisum-tx be17-aisum-tx">
          <span className="bp-aisum-lab">{tr({ en: "EXECUTION DATA READY FOR FORECAST", ar: "بيانات التنفيذ جاهزة للتنبؤ", zh: "执行数据已就绪，可用于滚动预测" })}</span>
          <span className="be17-ai-line">
            {tr({
              en: `UC17 execution data is ready: ${UC17_BUDGET_ROWS.length} budget lines, ${formatSar(sumMetric("committed"))} committed, ${formatSar(sumMetric("invoice"))} invoiced and ${formatSar(sumMetric("available"))} available. This page uses those actual execution signals as the baseline for rolling financial forecasting.`,
              ar: `بيانات التنفيذ جاهزة: ${UC17_BUDGET_ROWS.length} بنود، التزامات ${formatSar(sumMetric("committed"))} وفواتير ${formatSar(sumMetric("invoice"))} ومتاح ${formatSar(sumMetric("available"))}. تستخدم هذه الصفحة إشارات التنفيذ كأساس للتنبؤ المالي المتجدد.`,
              zh: `UC17 执行数据已就绪：${UC17_BUDGET_ROWS.length} 条预算行、已承诺 ${formatSar(sumMetric("committed"))}、收票 ${formatSar(sumMetric("invoice"))}、可用资金 ${formatSar(sumMetric("available"))}。本页面以这些执行实际数作为滚动财务预测的基线。`,
            })}
          </span>
        </div>
        <div className="be17-summary-side">
          <div className="be17-summary-actionbar">
            <button className="btn secondary sm" type="button" onClick={() => openRoute("budexec-alerts", "Forecast pressure checked against warnings")}>{tr({ en: "Check warnings", ar: "فحص التحذيرات", zh: "查看预警" })}</button>
            <button className="btn sm" type="button" onClick={() => openRoute("budexec-reports", "Forecast included in report generation")}>{tr({ en: "Generate report", ar: "إنشاء تقرير", zh: "生成报告" })}</button>
          </div>
          <span className="bp-agent bp-aisum-ag">{tr({ en: "Rolling Forecasting Agent", ar: "وكيل التنبؤ المتجدد", zh: "Rolling Forecasting Agent" })}</span>
        </div>
      </section>

      <div className="g03-kpi-grid be17-forecast-kpis">
        <div className="g03-kpi"><span>{tr({ en: "Execution baseline", ar: "أساس التنفيذ", zh: "执行基线" })}</span><b>{formatSar(sumMetric("budget"))}</b><small>SAP/Asas · Etimad · UC17 ledger</small></div>
        <div className="g03-kpi warn"><span>{tr({ en: "Forecast funding gap", ar: "فجوة التمويل المتوقعة", zh: "预测资金缺口" })}</span><b>{formatSar(forecastGap)}</b><small>{tr({ en: "from execution-driven pressure", ar: "من ضغط التنفيذ", zh: "由执行压力推导" })}</small></div>
        <div className="g03-kpi bad"><span>{tr({ en: "Peak pressure period", ar: "فترة ذروة الضغط", zh: "压力峰值期" })}</span><b>{peak.period}</b><small>{tr({ en: "forecast need above ceiling", ar: "الحاجة فوق السقف", zh: "预测需求高于上限" })}</small></div>
        <div className="g03-kpi good"><span>{tr({ en: "Forecast confidence", ar: "ثقة التنبؤ", zh: "预测置信度" })}</span><b>91%</b><small>{tr({ en: "execution ledger reconciled", ar: "دفتر التنفيذ مطابق", zh: "执行台账已对账" })}</small></div>
      </div>

      <BudgetExecutionSection
        tr={tr}
        title={{ en: "Rolling forecast based on execution actuals", ar: "تنبؤ متجدد بناء على فعليات التنفيذ", zh: "基于执行实际数的滚动预测" }}
        sub={{ en: "This mirrors the G02 forecasting view, but its baseline comes from G03 execution stages: commitments, invoices, payments, balances and available funds.", ar: "يعكس عرض التنبؤ في التخطيط، لكن الأساس هنا من مراحل التنفيذ.", zh: "该页面沿用 G02 滚动预测的呈现方式，但基线来自 G03 执行阶段：承诺、发票、付款、余额与可用资金。" }}
        agent={{ en: "Agent: Financial Forecasting Agent", ar: "الوكيل: التنبؤ المالي", zh: "Agent：Financial Forecasting Agent" }}
      >
        <div className="be17-forecast-bars">
          {FORECAST_PERIODS.map((item) => {
            const pressure = Math.max(item.forecastNeed - item.ceiling, 0);
            const usedWidth = Math.min(100, Math.round((item.forecastNeed / item.ceiling) * 86));
            return (
              <div key={item.period} className="be17-forecast-bar">
                <div className="be17-forecast-row">
                  <strong>{item.period}</strong>
                  <span>{tr({ en: "Forecast need", ar: "الحاجة المتوقعة", zh: "预测需求" })}: {formatSar(item.forecastNeed)} · {tr({ en: "Ceiling", ar: "السقف", zh: "上限" })}: {formatSar(item.ceiling)}</span>
                </div>
                <div className="be17-pressure-track">
                  <i style={{ width: `${usedWidth}%` }} />
                  <em />
                </div>
                <div className="be17-forecast-meta">
                  <span>{tr({ en: "committed", ar: "ملتزم", zh: "已承诺" })}: {formatSar(item.committed)}</span>
                  <span>{tr({ en: "invoice", ar: "فاتورة", zh: "收票" })}: {formatSar(item.invoice)}</span>
                  <span className={pressure > 0 ? "risk" : "good"}>{pressure > 0 ? tr({ en: "gap", ar: "فجوة", zh: "缺口" }) + ` ${formatSar(pressure)}` : tr({ en: "within capacity", ar: "ضمن القدرة", zh: "能力内" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </BudgetExecutionSection>

      <BudgetExecutionSection
        tr={tr}
        title={{ en: "Execution-to-forecast input ledger", ar: "دفتر مدخلات التنفيذ إلى التنبؤ", zh: "执行到预测输入台账" }}
        sub={{ en: "Risk and idle-budget signals from UC17 become forecast drivers instead of separate Excel assumptions.", ar: "تصبح إشارات المخاطر والخمول من التنفيذ محركات للتنبؤ بدلاً من افتراضات إكسل منفصلة.", zh: "UC17 的风险与闲置信号直接成为预测驱动，而不再依赖单独 Excel 假设。" }}
        agent={{ en: "Agent: Execution-to-Forecast Bridge Agent", ar: "الوكيل: جسر التنفيذ إلى التنبؤ", zh: "Agent：Execution-to-Forecast Bridge Agent" }}
      >
        <div className="be17-table-wrap compact">
          <table className="be17-table be17-analysis-table">
            <thead>
              <tr>
                <th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th>
                <th>{tr({ en: "Execution signal", ar: "إشارة التنفيذ", zh: "执行信号" })}</th>
                <th>{tr({ en: "Forecast use", ar: "استخدام التنبؤ", zh: "预测用途" })}</th>
                <th>{tr({ en: "Amount", ar: "المبلغ", zh: "金额" })}</th>
              </tr>
            </thead>
            <tbody>
              {UC17_BUDGET_ROWS.filter((row) => row.status === "risk" || row.metrics.available > 300).map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.code}</strong><span>{tr(row.name)}</span></td>
                  <td>{tr(row.statusDetail)}</td>
                  <td>{row.status === "risk" ? tr({ en: "Increase liquidity-pressure probability and owner review queue.", ar: "رفع احتمال ضغط السيولة وقائمة مراجعة المالك.", zh: "提高流动性压力概率，并进入负责人复核队列。" }) : tr({ en: "Assess available idle balance as fiscal-space buffer.", ar: "تقييم الرصيد الخامل كاحتياطي حيز مالي.", zh: "评估闲置可用余额作为财政空间缓冲。" })}</td>
                  <td>{formatSar(row.metrics.available)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BudgetExecutionSection>
    </div>
  );
}
