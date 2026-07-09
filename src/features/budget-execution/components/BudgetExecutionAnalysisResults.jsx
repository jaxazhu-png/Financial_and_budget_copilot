import React from "react";
import { BudgetExecutionSection } from "./BudgetExecutionSection.jsx";

/**
 * AI analysis table generated from the current filters and selected analysis dimension.
 */
export function BudgetExecutionAnalysisResults({ tr, rows, dimension, selectedId, onSelectRow }) {
  return (
    <BudgetExecutionSection
      tr={tr}
      title={{ en: "AI analysis result table", ar: "جدول نتائج تحليل الذكاء الاصطناعي", zh: "AI 分析结果表" }}
      sub={{ en: "Analysis is regenerated from the selected period, city, project, supplier and business dimension.", ar: "تتم إعادة توليد التحليل من الفترة والمدينة والمشروع والمورد وبعد الأعمال المختار.", zh: "根据当前时期、城市、项目、供应商和分析维度自动生成分析结论。" }}
      agent={{ en: "Agent: Availability & Reconciliation Analysis Agent", ar: "الوكيل: تحليل التوافر والمطابقة", zh: "Agent：Availability & Reconciliation Analysis Agent" }}
    >
      <div className="be17-analysis-head">
        <div>
          <span>{tr({ en: "Active dimension", ar: "البعد النشط", zh: "当前分析维度" })}</span>
          <b>{tr(dimension.label)}</b>
        </div>
      </div>
      <div className="be17-table-wrap compact">
        <table className="be17-table be17-analysis-table">
          <thead>
            <tr>
              <th>{tr({ en: "Period / City", ar: "الفترة / المدينة", zh: "时期 / 城市" })}</th>
              <th>{tr({ en: "Project / Supplier", ar: "المشروع / المورد", zh: "项目 / 供应商" })}</th>
              <th>{tr({ en: "Dimension value", ar: "قيمة البعد", zh: "维度数值" })}</th>
              <th>{tr({ en: "AI conclusion", ar: "استنتاج الذكاء الاصطناعي", zh: "AI 分析结论" })}</th>
              <th>{tr({ en: "Suggested next action", ar: "الإجراء التالي المقترح", zh: "建议下一步" })}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="be17-empty">{tr({ en: "No analysis rows match the filters.", ar: "لا توجد نتائج تحليل تطابق عوامل التصفية.", zh: "没有符合筛选条件的分析结果。" })}</td></tr>}
            {rows.map((item) => (
              <tr
                key={item.id}
                className={item.row.id === selectedId ? "on linked" : "linked"}
                onClick={() => onSelectRow?.(item.row.id)}
              >
                <td><strong>{item.row.period}</strong><span>{item.row.city}</span></td>
                <td><strong>{item.row.project}</strong><span>{item.row.supplier}</span></td>
                <td><b className={`be17-analysis-value ${item.tone}`}>{item.value}</b></td>
                <td>{tr(item.conclusion)}</td>
                <td>
                  <span className={`be17-analysis-pill ${item.tone}`}>
                    {tr(item.tone === "risk"
                      ? { en: "Route to exception review", ar: "توجيه إلى مراجعة الاستثناء", zh: "进入异常复核" }
                      : item.tone === "opportunity"
                        ? { en: "Assess transfer candidate", ar: "تقييم مرشح المناقلة", zh: "评估转移候选" }
                        : { en: "Keep monitoring", ar: "الاستمرار في المراقبة", zh: "继续监控" })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BudgetExecutionSection>
  );
}

/**
 * Bottom approval action for the reviewed monitoring package.
 */
export function BudgetExecutionApprovalDock({ tr, onSubmit, onSaveDraft }) {
  return (
    <div className="be17-approval-dock">
      <div className="be17-approval-actions">
        <button className="btn" type="button" onClick={onSubmit}>
          {tr({ en: "Submit for approval", ar: "إرسال للاعتماد", zh: "提交审批" })}
        </button>
        <button className="btn secondary" type="button" onClick={onSaveDraft}>
          {tr({ en: "Save draft", ar: "حفظ المسودة", zh: "保存草稿" })}
        </button>
      </div>
    </div>
  );
}
