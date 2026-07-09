import React from "react";
import { BudgetExecutionAiSummary } from "../components/BudgetExecutionAiSummary.jsx";
import { BudgetExecutionAnalysisResults, BudgetExecutionApprovalDock } from "../components/BudgetExecutionAnalysisResults.jsx";
import { BudgetExecutionFilters } from "../components/BudgetExecutionFilters.jsx";
import { BudgetExecutionLedger } from "../components/BudgetExecutionLedger.jsx";
import { BudgetExecutionSidePanel } from "../components/BudgetExecutionSidePanel.jsx";
import { BudgetExecutionSmartQuery } from "../components/BudgetExecutionSmartQuery.jsx";
import { BudgetExecutionStoryline } from "../components/BudgetExecutionStoryline.jsx";
import { useBudgetExecutionMonitoring } from "../hooks/useBudgetExecutionMonitoring.js";

/**
 * Budget Execution Department monitoring and operational reconciliation page.
 */
export function BudgetExecutionMonitoringPage({ store }) {
  const {
    tr,
    filters,
    updateFilter,
    periods,
    dimensions,
    cities,
    projects,
    suppliers,
    rows,
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
    selectedDimension,
    approvalState,
    submitApproval,
    saveDraft,
    exportPlan,
    openRoute,
  } = useBudgetExecutionMonitoring(store);
  const riskCount = rows.filter((row) => row.status === "risk").length;

  const openStoryRoute = (targetRoute) => {
    if (targetRoute === "budexec17") return;
    openRoute(targetRoute, `Budget execution storyline opened ${targetRoute}`);
  };

  return (
    <div className="page g03-page be17-page wb">
      <div className="card pad wb-head be17-head">
        <div className="be17-head-copy">
          <div className="wb-title">
            <button className="pg-back" type="button" onClick={() => openRoute("buwork", "Back to Budget Execution Department workspace")}>‹</button>
            <span className="wb-dot green" />
            {tr({ en: "Budget Execution Department", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" })}
            {" · "}
            {tr({
              en: "Automated Budget Execution Monitoring & Operational Reconciliation",
              ar: "المراقبة الآلية لتنفيذ الميزانية والمطابقة التشغيلية",
              zh: "预算执行监控与运营对账自动化",
            })}
            <button className="al-bell" type="button" onClick={() => openRoute("budexec-alerts", "Open execution warning data from the ledger")} title={tr({ en: "Execution warnings", ar: "تنبيهات التنفيذ", zh: "执行预警" })}>🔔 {riskCount ? <span>{riskCount}</span> : null}</button>
          </div>
          <div className="wb-subt">
            {tr({
              en: "Translate SAP/Asas movements into business stages and reconcile commitments, invoices, payments, balances and available funds.",
              ar: "ترجمة حركات SAP/Asas إلى مراحل أعمال ومطابقة الالتزامات والفواتير والمدفوعات والأرصدة والأموال المتاحة.",
              zh: "将 SAP/Asas movement 转换为业务阶段，并对账承诺、发票、付款、余额与可用资金。",
            })}
          </div>
        </div>
        <div className="bp-wrap-story be17-wrap-story">
          <BudgetExecutionStoryline tr={tr} current="ledger" onNavigate={openStoryRoute} />
        </div>
      </div>

      <BudgetExecutionAiSummary
        tr={tr}
        selectedRow={selectedRow}
        rowCount={rows.length}
        onForecast={() => openRoute("budexec-forecast", "Execution data is ready and sent to rolling forecast")}
        onReport={() => openRoute("budexec-reports", "Execution analysis sent to report generation")}
      />

      <BudgetExecutionFilters
        tr={tr}
        filters={filters}
        updateFilter={updateFilter}
        periods={periods}
        cities={cities}
        projects={projects}
        suppliers={suppliers}
        dimensions={dimensions}
      />

      <div className="be17-main-grid">
        <BudgetExecutionLedger
          tr={tr}
          rows={rows}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
        <BudgetExecutionSidePanel
          tr={tr}
          selectedRow={selectedRow}
          questionId={questionId}
          setQuestionId={setQuestionId}
          customQuestion={customQuestion}
          setCustomQuestion={setCustomQuestion}
          askCustomQuestion={askCustomQuestion}
          qaAnswer={qaAnswer}
        />
      </div>

      <BudgetExecutionAnalysisResults
        tr={tr}
        rows={analysisRows}
        dimension={selectedDimension}
        selectedId={selectedId}
        onSelectRow={setSelectedId}
      />

      <BudgetExecutionApprovalDock tr={tr} state={approvalState} onSubmit={submitApproval} onSaveDraft={saveDraft} onExportPlan={exportPlan} />
      <BudgetExecutionSmartQuery tr={tr} pushLog={store.pushLog} page="uc17" selectedRow={selectedRow} />
    </div>
  );
}
