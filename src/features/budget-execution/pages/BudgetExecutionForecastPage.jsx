import React from "react";
import * as RC from "recharts";
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
  const chartRows = FORECAST_PERIODS.map((item) => ({
    period: item.period.replace("FY2026 ", "").replace("FY2027 ", "27 "),
    committed: +(item.committed / 1000).toFixed(2),
    invoice: +(item.invoice / 1000).toFixed(2),
    forecastNeed: +(item.forecastNeed / 1000).toFixed(2),
    ceiling: +(item.ceiling / 1000).toFixed(2),
  }));
  const totalBudget = sumMetric("budget");
  const committed = sumMetric("committed");
  const invoiced = sumMetric("invoice");
  const paid = sumMetric("paid");
  const available = sumMetric("available");
  const annualNeed = FORECAST_PERIODS.reduce((total, row) => total + row.forecastNeed, 0);
  const annualCeiling = FORECAST_PERIODS.reduce((total, row) => total + row.ceiling, 0);
  const confidence = riskRows.length > 3 ? 86 : 91;

  return (
    <div className="fade wb be17-page">
      <div className="card pad wb-frame">
        <BudgetExecutionPageHeader
          tr={tr}
          current="forecast"
          title={{ en: "G03-UC04 Commitment Forecast", ar: "G03-UC04 تنبؤ الالتزامات", zh: "G03-UC04 承诺与未来需求预测" }}
          subtitle={{ en: "Planning Department commitment-forecast workspace reused for G03, with UC17 execution actuals replacing the planning baseline.", ar: "إعادة استخدام مساحة تنبؤ الالتزامات مع فعليات تنفيذ UC17.", zh: "复用规划部门·承诺预测界面，数据口径改为 UC17 执行台账实际数。" }}
          alertCount={riskRows.length}
          onBack={() => openRoute("budexec17", "Back to execution ledger")}
          onAlerts={() => openRoute("budexec-alerts", "Open execution warning data")}
          onNavigate={navigateStory}
        />

        <div className="fc-draft">
          <span className="fc-draft-dot" />
          <b>{tr({ en: "Forecast v3 · DRAFT", ar: "مسودة التنبؤ v3", zh: "预测 v3 · 草稿" })}</b>
          <span className="fc-conf high" title="SAP/Asas · Etimad · Availability report">
            {tr({ en: "Confidence", ar: "الثقة", zh: "置信度" })} {confidence}% · {tr({ en: "High", ar: "مرتفعة", zh: "高" })}
          </span>
          <span className="fc-draft-meta">{tr({ en: "source", ar: "المصدر", zh: "数据来源" })} UC17 · {UC17_BUDGET_ROWS.length} {tr({ en: "budget lines", ar: "بنود", zh: "条预算行" })}</span>
          <span className="fc-draft-acts">
            <button className="sc-mini" type="button" onClick={() => openRoute("budexec-alerts", "Forecast warning review opened")}>🔔 {tr({ en: "Warnings", ar: "التحذيرات", zh: "预警" })}</button>
            <button className="sc-mini primary" type="button" onClick={() => openRoute("budexec-reports", "Forecast sent to UC10 report")}>{tr({ en: "Generate report", ar: "إنشاء تقرير", zh: "生成报告" })}</button>
          </span>
        </div>

        <div className="wb-actbar">
          <span className="bp-agent wb-ab-agent">{tr({ en: "Financial Forecasting Agent", ar: "وكيل التنبؤ المالي", zh: "财务预测智能体" })}</span>
          <div className="wb-ab-top">
            <div className="wb-ab-spark">✦</div>
            <div className="wb-ab-tt">
              <div>
                <span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى وإجراءات", zh: "AI 洞察与后续行动" })}</span>
                <span className="wb-ab-meta">UC17 → UC04 · {tr({ en: "Execution actuals reconciled", ar: "فعليات التنفيذ مطابقة", zh: "执行实际数已对账" })}</span>
              </div>
              <div className="wb-ab-insight">
                {tr({
                  en: `UC17 execution data is ready: ${UC17_BUDGET_ROWS.length} budget lines, ${formatSar(committed)} committed, ${formatSar(invoiced)} invoiced, ${formatSar(paid)} paid and ${formatSar(available)} available. UC04 now forecasts ${formatSar(annualNeed)} expected need against ${formatSar(annualCeiling)} ceiling, with a ${formatSar(forecastGap)} funding gap.`,
                  ar: `بيانات UC17 جاهزة: ${UC17_BUDGET_ROWS.length} بنود، التزامات ${formatSar(committed)} وفواتير ${formatSar(invoiced)} ومدفوع ${formatSar(paid)} ومتاح ${formatSar(available)}. يتنبأ UC04 بالحاجة مقابل السقف مع فجوة ${formatSar(forecastGap)}.`,
                  zh: `UC17 执行数据已就绪：${UC17_BUDGET_ROWS.length} 条预算行、已承诺 ${formatSar(committed)}、收票 ${formatSar(invoiced)}、已付款 ${formatSar(paid)}、可用资金 ${formatSar(available)}。UC04 基于这些执行数据预测未来需求 ${formatSar(annualNeed)}，对比上限 ${formatSar(annualCeiling)}，形成资金缺口 ${formatSar(forecastGap)}。`,
                })}
              </div>
              <div className="sc-rec-review">⚑ {tr({ en: "Forecast output remains a draft until reviewed by budget execution and planning owners.", ar: "تبقى المخرجات مسودة حتى المراجعة.", zh: "预测输出仍为草稿，需预算执行与规划负责人复核。" })}</div>
            </div>
          </div>
        </div>

        <div className="fc-scope">
          <span className="fc-flab">{tr({ en: "FORECAST SCOPE", ar: "نطاق التنبؤ", zh: "预测范围" })}</span>
          <label className="fc-sf">{tr({ en: "Source", ar: "المصدر", zh: "来源" })}<select className="sc-in sm" value="uc17" readOnly><option value="uc17">UC17 · SAP/Asas movement</option></select></label>
          <label className="fc-sf">{tr({ en: "Period", ar: "الفترة", zh: "周期" })}<select className="sc-in sm" value="quarter" readOnly><option value="quarter">{tr({ en: "Quarterly", ar: "ربعي", zh: "季度" })}</option></select></label>
          <label className="fc-sf">{tr({ en: "Commitment type", ar: "نوع الالتزام", zh: "承诺类型" })}<select className="sc-in sm" value="execution" readOnly><option value="execution">{tr({ en: "Execution actuals + forecast need", ar: "فعليات التنفيذ + الحاجة", zh: "执行实际数 + 预测需求" })}</option></select></label>
        </div>

        <div className="bp-kpis">
          <div className="bp-kpi"><div className="l">{tr({ en: "Execution baseline", ar: "أساس التنفيذ", zh: "执行基线" })}</div><div className="v">{formatSar(totalBudget)}</div><div className="s">SAP/Asas · Etimad · UC17</div></div>
          <div className="bp-kpi"><div className="l">{tr({ en: "Existing obligations", ar: "الالتزامات القائمة", zh: "已有义务" })}</div><div className="v">{formatSar(committed)}</div><div className="s">{tr({ en: "committed from execution ledger", ar: "من دفتر التنفيذ", zh: "来自执行台账的已承诺金额" })}</div></div>
          <div className="bp-kpi danger"><div className="l">{tr({ en: "Expected need vs ceiling", ar: "الحاجة مقابل السقف", zh: "预期需求 vs 上限" })}</div><div className="v">{formatSar(annualNeed)}</div><div className="s">{tr({ en: "ceiling", ar: "السقف", zh: "上限" })} {formatSar(annualCeiling)}</div></div>
          <div className="bp-kpi danger"><div className="l">{tr({ en: "Deficit / fiscal-space gap", ar: "فجوة العجز", zh: "赤字 / 财政空间缺口" })}</div><div className="v">{formatSar(forecastGap)}</div><div className="s">{tr({ en: "peak", ar: "الذروة", zh: "峰值期" })} {peak.period}</div></div>
        </div>

        <div className="uf-sec">
          <div className="uf-h">{tr({ en: "Ceiling pressure timeline (per period)", ar: "الخط الزمني لضغط السقف", zh: "上限压力时间线(按周期)" })} <span className="bp-agent">Rolling Forecasting Agent</span></div>
          <RC.ResponsiveContainer width="100%" height={240}>
            <RC.AreaChart data={chartRows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <RC.CartesianGrid stroke="#eef1f6" vertical={false} />
              <RC.XAxis dataKey="period" tick={{ fontSize: 9 }} />
              <RC.YAxis tick={{ fontSize: 9 }} />
              <RC.Tooltip formatter={(value) => `SAR ${value}B`} />
              <RC.Legend wrapperStyle={{ fontSize: 10 }} />
              <RC.Area type="monotone" dataKey="committed" stackId="1" stroke="#1B8354" fill="#1B8354" fillOpacity={0.72} name={tr({ en: "Committed", ar: "ملتزم", zh: "已承诺" })} />
              <RC.Area type="monotone" dataKey="invoice" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.45} name={tr({ en: "Invoices", ar: "الفواتير", zh: "收票" })} />
              <RC.Area type="monotone" dataKey="forecastNeed" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.22} name={tr({ en: "Forecast need", ar: "الحاجة المتوقعة", zh: "预测需求" })} />
              <RC.Line type="monotone" dataKey="ceiling" stroke="#e0524a" strokeWidth={2} strokeDasharray="5 4" dot={false} name={tr({ en: "Ceiling", ar: "السقف", zh: "上限" })} />
            </RC.AreaChart>
          </RC.ResponsiveContainer>
          <div className="uf-note">{tr({ en: "This is the planning commitment-forecast view reused for G03; the baseline is UC17 committed, invoiced, paid, balance and available-funds data.", ar: "يعاد استخدام عرض تنبؤ الالتزامات مع بيانات UC17.", zh: "此处复用规划部门承诺预测界面；基线数据改为 UC17 的承诺、发票、付款、余额与可用资金。" })}</div>
        </div>

        <div className="bp-grid2">
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Approved execution obligations", ar: "التزامات التنفيذ المعتمدة", zh: "已确认执行义务" })} <span className="bp-agent">from UC17</span></div>
            <div className="fc-tscroll">
              <table className="wb-table fc-ctable fc-stick">
                <thead><tr><th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算行" })}</th><th>{tr({ en: "Project", ar: "المشروع", zh: "项目" })}</th><th style={{ textAlign: "end" }}>{tr({ en: "Committed", ar: "ملتزم", zh: "已承诺" })}</th><th>{tr({ en: "Plan", ar: "الخطة", zh: "计划" })}</th></tr></thead>
                <tbody>{UC17_BUDGET_ROWS.map((row) => <tr key={row.id} className={row.status === "risk" ? "deficit" : ""}><td><span className="fc-cid">{row.code}</span> {tr(row.name)}</td><td>{row.project}</td><td className="bp-mono" style={{ textAlign: "end" }}>{formatSar(row.metrics.committed)}</td><td>{row.status === "risk" ? <span style={{ color: "#c53b32", fontWeight: 700 }}>{tr({ en: "review", ar: "مراجعة", zh: "待复核" })}</span> : "✓"}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="uf-sec">
            <div className="uf-h">{tr({ en: "Forecast pressure drivers", ar: "محركات ضغط التنبؤ", zh: "预测压力驱动" })} <span className="bp-agent">Execution-to-Forecast Bridge</span></div>
            <div className="fc-mitigs">
              {riskRows.map((row) => <div key={row.id} className="fc-mitig">
                <div className="fc-mitig-top"><b>{row.code} · {tr(row.name)}</b><span className="sc-riskbadge r-high">{tr({ en: "High", ar: "مرتفع", zh: "高" })}</span><em>{formatSar(row.metrics.available)}</em></div>
                <div className="fc-mitig-why">{tr(row.statusDetail)}</div>
                <div className="fc-mitig-acts"><button className="fc-mact" type="button" onClick={() => openRoute("budexec-alerts", "Forecast driver opened in UC02")}>{tr({ en: "Open warning", ar: "فتح التحذير", zh: "查看预警" })}</button><button className="fc-mact" type="button" onClick={() => openRoute("budexec-reports", "Forecast driver included in report")}>{tr({ en: "Add to report", ar: "إضافة للتقرير", zh: "加入报告" })}</button></div>
              </div>)}
            </div>
          </div>
        </div>

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
    </div>
  );
}
