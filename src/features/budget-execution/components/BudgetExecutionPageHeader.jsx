import React from "react";
import { BudgetExecutionStoryline } from "./BudgetExecutionStoryline.jsx";

/**
 * Shared budget execution page header with the same storyline treatment.
 */
export function BudgetExecutionPageHeader({ tr, title, subtitle, current, onBack, onNavigate, alertCount = 0, onAlerts }) {
  return (
    <div className="card pad wb-head be17-head">
      <div className="be17-head-copy">
        <div className="wb-title">
          <button className="pg-back" type="button" onClick={onBack}>‹</button>
          <span className="wb-dot green" />
          {tr({ en: "Budget Execution Department", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" })}
          {" · "}
          {tr(title)}
          {onAlerts && (
            <button
              className="al-bell"
              type="button"
              onClick={onAlerts}
              title={tr({ en: "Execution warnings", ar: "تنبيهات التنفيذ", zh: "执行预警" })}
            >
              🔔 {alertCount ? <span>{alertCount}</span> : null}
            </button>
          )}
        </div>
        <div className="wb-subt">{tr(subtitle)}</div>
      </div>
      <div className="bp-wrap-story be17-wrap-story">
        <BudgetExecutionStoryline tr={tr} current={current} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
