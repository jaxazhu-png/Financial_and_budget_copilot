import React from "react";

export const BUDGET_EXECUTION_FLOW_STEPS = [
  { key: "data", route: "budexec-data", code: "UC01", label: { en: "Data unification", ar: "توحيد البيانات", zh: "数据统一" } },
  { key: "ledger", route: "budexec17", code: "UC17", label: { en: "Budget execution tracking", ar: "تتبع تنفيذ الميزانية", zh: "预算执行情况跟踪" } },
  { key: "exceptions", route: "budexec-alerts", code: "UC02", label: { en: "Deviation detection", ar: "كشف الانحرافات", zh: "偏差检测" } },
  { key: "forecast", route: "budexec-forecast", code: "UC04", label: { en: "Forecast", ar: "التنبؤ", zh: "预测" } },
  { key: "space", route: "budexec-space", code: "UC07", label: { en: "Budget planning", ar: "تخطيط الميزانية", zh: "预算规划" } },
  { key: "query", route: "budexec-query", code: "UC03", label: { en: "Smart query", ar: "الاستعلام الذكي", zh: "智能查询" } },
  { key: "reports", route: "budexec-reports", code: "UC10", label: { en: "Reports", ar: "التقارير", zh: "报告" } },
];

/**
 * Compact budget execution storyline shown in the page header.
 */
export function BudgetExecutionStoryline({ tr, onNavigate, current = "ledger" }) {
  const positionLabel = {
    up: { en: "UPSTREAM", ar: "منبع", zh: "上游" },
    here: { en: "THIS", ar: "هذه", zh: "这" },
    down: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" },
  };
  const currentIndex = Math.max(0, BUDGET_EXECUTION_FLOW_STEPS.findIndex((step) => step.key === current));

  return (
    <div className="wb-chain be17-chain" aria-label={tr({ en: "Budget execution storyline", ar: "مسار تنفيذ الميزانية", zh: "预算执行业务流程" })}>
      <span className="wb-clab">{tr({ en: "Storyline · downstream evolution", ar: "القصة · التطور اللاحق", zh: "故事情节 · 下游演化" })}</span>
      {BUDGET_EXECUTION_FLOW_STEPS.map((step, index) => {
        const position = step.key === current ? "here" : index < currentIndex ? "up" : "down";
        return (
          <React.Fragment key={step.key}>
            {index > 0 && <span className="wb-carr">→</span>}
            <button
              className={`wb-cpill be17-cpill ${position}`}
              type="button"
              onClick={() => onNavigate(step.route)}
              title={`${step.code} · ${tr(step.label)}`}
            >
              <span className="wb-cpos">{tr(positionLabel[position])}</span>
              {position === "here" ? "★ " : ""}{tr(step.label)}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
