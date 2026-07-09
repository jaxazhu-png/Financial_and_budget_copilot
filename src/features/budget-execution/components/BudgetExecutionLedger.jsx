import React from "react";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";
import { BudgetExecutionSection } from "./BudgetExecutionSection.jsx";

const FINANCIAL_COLUMNS = [
  ["budget", { en: "Total budget", ar: "إجمالي الميزانية", zh: "预算总额" }],
  ["committed", { en: "Committed", ar: "ملتزم", zh: "已承诺金额" }],
  ["invoice", { en: "Invoices", ar: "الفواتير", zh: "收票总额" }],
  ["paid", { en: "Paid", ar: "مدفوع", zh: "实际付款" }],
  ["balance", { en: "Balance", ar: "الرصيد", zh: "当前余额" }],
  ["available", { en: "Available", ar: "المتاح", zh: "可用资金" }],
];

/**
 * Budget row ledger with status marker and financial columns.
 */
export function BudgetExecutionLedger({
  tr,
  rows,
  selectedId,
  setSelectedId,
  aside,
}) {
  const ledgerTable = (
      <div className="be17-table-wrap">
        <table className="be17-table">
          <thead>
            <tr>
              <th>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</th>
              <th>{tr({ en: "Budget line", ar: "بند الميزانية", zh: "预算项" })}</th>
              <th>{tr({ en: "Project / City / Supplier", ar: "المشروع / المدينة / المورد", zh: "项目 / 城市 / 供应商" })}</th>
              <th>{tr({ en: "Plan vs actual", ar: "الخطة مقابل الفعلي", zh: "计划 vs 实际" })}</th>
              {FINANCIAL_COLUMNS.map(([key, label]) => <th key={key}>{tr(label)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="be17-empty">{tr({ en: "No budget rows match the filters.", ar: "لا توجد بنود ميزانية تطابق عوامل التصفية.", zh: "没有符合当前筛选条件的预算行。" })}</td></tr>
            )}
            {rows.map((row) => {
              const selected = row.id === selectedId;
              return (
                <tr key={row.id} className={selected ? "on" : ""} onClick={() => setSelectedId(row.id)}>
                  <td>
                    <span className="be17-status-wrap" aria-label={tr(row.statusDetail)}>
                      <span className={`be17-status-dot ${row.status}`} />
                      <b className={`be17-status-label ${row.status}`}>{tr(row.status === "risk" ? { en: "Risk", ar: "مخاطر", zh: "风险" } : { en: "Normal", ar: "طبيعي", zh: "正常" })}</b>
                      <span className="be17-status-tip">{tr(row.statusDetail)}</span>
                    </span>
                  </td>
                  <td>
                    <strong>{row.code}</strong>
                    <span>{tr(row.name)}</span>
                    <small>{tr(row.org)}</small>
                  </td>
                  <td>
                    <strong>{row.project}</strong>
                    <span>{row.city} · {row.supplier}</span>
                  </td>
                  <td><span className="be17-variance">{row.planVsActual}</span></td>
                  {FINANCIAL_COLUMNS.map(([key]) => <td key={key}>{formatSar(row.metrics[key])}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
  );
  return (
    <BudgetExecutionSection
      tr={tr}
      title={{ en: "Budget line ledger", ar: "دفتر بنود الميزانية", zh: "预算行列表" }}
      sub={
        aside
          ? { en: "Click a budget line to inspect its lifecycle stages and ask the Copilot.", ar: "انقر على بند ميزانية لعرض مراحل دورة حياته وسؤال المساعد.", zh: "点击预算行，查看其生命周期阶段数据并向 Copilot 提问。" }
          : { en: "Click a budget line to inspect its lifecycle stages in the side panel.", ar: "انقر على بند ميزانية لعرض مراحل دورة حياته في اللوحة الجانبية.", zh: "点击预算行后，在右侧同步展示采购申请、采购订单、合同、发票、转移、余额等阶段数据。" }
      }
      agent={{ en: "Agent: SAP Movement Translation Agent", ar: "الوكيل: وكيل ترجمة حركات SAP", zh: "Agent：SAP Movement Translation Agent" }}
      className={aside ? "be17-ledger-section be17-merged" : "be17-ledger-section"}
    >
      {aside ? (
        <div className="be17-merged-grid">{ledgerTable}{aside}</div>
      ) : (
        ledgerTable
      )}
    </BudgetExecutionSection>
  );
}
