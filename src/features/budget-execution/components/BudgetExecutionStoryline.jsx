import React from "react";

export const BUDGET_EXECUTION_FLOW_STEPS = [
  { key: "data", route: "budexec-data", label: { en: "Data unification", ar: "توحيد البيانات", zh: "数据统一" } },
  { key: "ledger", route: "budexec17", label: { en: "Execution ledger", ar: "دفتر التنفيذ", zh: "执行台账" } },
  { key: "exceptions", route: "budexec-alerts", label: { en: "Deviation detection", ar: "كشف الانحرافات", zh: "偏差检测" } },
  { key: "forecast", route: "budexec-forecast", label: { en: "Rolling forecast", ar: "التنبؤ المتجدد", zh: "滚动预测" } },
  { key: "space", route: "budexec-space", label: { en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" } },
  { key: "query", route: "budexec-query", label: { en: "Smart query", ar: "الاستعلام الذكي", zh: "智能查询" } },
  { key: "reports", route: "budexec-reports", label: { en: "Report generation", ar: "إنشاء التقارير", zh: "报告生成" } },
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
              title={tr(step.label)}
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
