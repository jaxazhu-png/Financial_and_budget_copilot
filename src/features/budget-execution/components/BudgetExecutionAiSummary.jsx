import React from "react";

const formatSar = (value) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}SAR ${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 2)}B`;
  return `${sign}SAR ${abs.toFixed(0)}M`;
};

/**
 * AI summary strip for the budget execution ledger.
 */
export function BudgetExecutionAiSummary({ tr, selectedRow, rowCount, onForecast, onReport }) {
  return (
    <section className="bp-aisum be17-ai-summary">
      <span className="bp-aisum-ic">✦</span>
      <div className="bp-aisum-tx be17-aisum-tx">
        <span className="bp-aisum-lab">{tr({ en: "AI EXECUTION SUMMARY", ar: "ملخص تنفيذ الذكاء الاصطناعي", zh: "AI 执行摘要" })}</span>
        <span className="be17-ai-line">
          {tr({ en: "Execution ledger translates SAP/Asas movement into PR, PO, contract, invoice, transfer, balance and available-funds stages.", ar: "يترجم دفتر التنفيذ حركات SAP/Asas إلى مراحل طلب الشراء وأمر الشراء والعقد والفاتورة والمناقلة والرصيد والأموال المتاحة.", zh: "执行台账已将 SAP/Asas movement 转换为 PR、PO、合同、发票、转移、余额与可用资金阶段。" })}
          {" "}
          <strong>{tr({ en: "Selected budget line", ar: "بند الميزانية المختار", zh: "当前预算项" })}: {selectedRow.code}</strong>
          {" · "}
          <strong>{tr({ en: "Available", ar: "المتاح", zh: "可用资金" })}: {formatSar(selectedRow.metrics.available)}</strong>
          {" · "}
          {tr({
            en: `${rowCount} rows are monitored; ${selectedRow.status === "risk" ? "risk marker is ready for exception handling and transfer-path review" : "current line remains within normal monitoring"}.`,
            ar: `تتم مراقبة ${rowCount} بنود؛ ${selectedRow.status === "risk" ? "مؤشر المخاطر جاهز لمعالجة الاستثناءات ومراجعة مسار المناقلة" : "البند الحالي ضمن المراقبة الطبيعية"}.`,
            zh: `当前监控 ${rowCount} 条预算行；${selectedRow.status === "risk" ? "风险标记已可进入异常处理与转移路径复核" : "当前预算项保持正常监控"}。`,
          })}
        </span>
      </div>
      <div className="be17-summary-side">
        <div className="be17-summary-actionbar" aria-label={tr({ en: "Budget execution next actions", ar: "الإجراءات التالية لتنفيذ الميزانية", zh: "预算执行下一步操作" })}>
          <button className="btn secondary sm" type="button" onClick={onForecast}>
            {tr({ en: "Run rolling forecast", ar: "تشغيل التنبؤ المتجدد", zh: "运行滚动预测" })}
          </button>
          <button className="btn sm" type="button" onClick={onReport}>
            {tr({ en: "Generate report", ar: "إنشاء تقرير", zh: "生成报告" })}
          </button>
        </div>
        <span className="bp-agent bp-aisum-ag">{tr({ en: "SAP Movement Translation Agent", ar: "وكيل ترجمة حركات SAP", zh: "SAP Movement Translation Agent" })}</span>
      </div>
    </section>
  );
}
