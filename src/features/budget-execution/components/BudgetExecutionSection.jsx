import React from "react";

/**
 * Section frame that shows the agent responsible for the analysis block.
 */
export function BudgetExecutionSection({ tr, title, sub, agent, children, className = "" }) {
  return (
    <section className={`g03-section be17-section ${className}`}>
      <div className="g03-section-head">
        <div>
          <h2>{tr(title)}</h2>
          {sub && <p>{tr(sub)}</p>}
        </div>
        <span className="be17-agent">{tr(agent)}</span>
      </div>
      {children}
    </section>
  );
}
