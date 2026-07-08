import React from "react";

const STAGES = [
  ["pr", { en: "Purchase request (PR)", ar: "طلب الشراء", zh: "采购申请(PR)" }],
  ["po", { en: "Purchase order (PO)", ar: "أمر الشراء", zh: "采购订单(PO)" }],
  ["contract", { en: "Contract", ar: "العقد", zh: "合同" }],
  ["invoice", { en: "Invoice", ar: "الفاتورة", zh: "发票" }],
  ["transfer", { en: "Transfer", ar: "المناقلة", zh: "转移" }],
  ["balance", { en: "Balance", ar: "الرصيد", zh: "余额" }],
];

const QUESTIONS = [
  { id: "available", label: { en: "How much available funding remains?", ar: "كم تبقى من التمويل المتاح؟", zh: "这个预算项还有多少可用资金" } },
  { id: "balance", label: { en: "Why did the balance change?", ar: "لماذا تغير الرصيد؟", zh: "为什么余额变化" } },
  { id: "stale", label: { en: "Which commitments have no invoice/payment?", ar: "ما الالتزامات بلا فاتورة أو دفع؟", zh: "哪些承诺长期没有发票/付款" } },
];

/**
 * Selected budget line stage breakdown and Copilot question flow.
 */
export function BudgetExecutionSidePanel({
  tr,
  selectedRow,
  questionId,
  setQuestionId,
  customQuestion,
  setCustomQuestion,
  askCustomQuestion,
  qaAnswer,
}) {
  const selectedQuestion = QUESTIONS.find((question) => question.id === questionId) || QUESTIONS[0];

  return (
    <aside className="be17-side-card" aria-label={tr({ en: "Budget execution Copilot", ar: "مساعد تنفيذ الميزانية", zh: "预算执行 Copilot" })}>
      <div className="be17-side-head">
        <div>
          <span>{tr({ en: "Selected budget line", ar: "بند الميزانية المختار", zh: "已选预算行" })}</span>
          <b>{selectedRow.code} · {tr(selectedRow.name)}</b>
          <small>{selectedRow.city} · {selectedRow.supplier}</small>
        </div>
        <span className="be17-agent compact">{tr({ en: "Agent: Budget Execution Copilot", ar: "الوكيل: مساعد تنفيذ الميزانية", zh: "Agent：Budget Execution Copilot" })}</span>
      </div>

      <div className="be17-side-body">
        <div className="be17-stage-grid">
          {STAGES.map(([key, label]) => {
            const stage = selectedRow.stages[key];
            return (
              <div key={key}>
                <span>{tr(label)}</span>
                <b>{stage.value}</b>
                <small>{stage.state} · {stage.ref}</small>
              </div>
            );
          })}
        </div>

        <div className="be17-qa-card">
          <div className="be17-qa-head">
            <div>
              <span>{tr({ en: "Budget line Copilot", ar: "مساعد بند الميزانية", zh: "预算项智能问数" })}</span>
              <b>{tr({ en: "Ask, explain, reconcile", ar: "اسأل واشرح وطابق", zh: "提问、解释、对账" })}</b>
            </div>
            <em>{tr({ en: "grounded", ar: "موثق", zh: "有依据" })}</em>
          </div>

          <div className="be17-question-pills" role="group" aria-label={tr({ en: "Preset Copilot questions", ar: "أسئلة جاهزة", zh: "预设问题" })}>
            {QUESTIONS.map((question) => (
              <button
                key={question.id}
                className={questionId === question.id ? "on" : ""}
                type="button"
                onClick={() => setQuestionId(question.id)}
              >
                {tr(question.label)}
              </button>
            ))}
          </div>

          <div className="be17-chat-log" aria-live="polite">
            <div className="be17-chat-turn user">
              <span>{tr({ en: "Question", ar: "السؤال", zh: "问题" })}</span>
              <p>{tr(selectedQuestion.label)}</p>
            </div>
            <div className="be17-chat-turn assistant">
              <span>{tr({ en: "Budget Execution Copilot", ar: "مساعد تنفيذ الميزانية", zh: "Budget Execution Copilot" })}</span>
              <p>{qaAnswer}</p>
              <div className="be17-evidence-row">
                <i>SAP/Asas</i>
                <i>Etimad</i>
                <i>{selectedRow.code}</i>
              </div>
            </div>
          </div>

          <div className="be17-chat-input">
            <input
              value={customQuestion}
              onChange={(event) => setCustomQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") askCustomQuestion();
              }}
              placeholder={tr({ en: "Ask about SAP movement, availability or balance...", ar: "اسأل عن حركة SAP أو التوافر أو الرصيد...", zh: "询问 SAP movement、可用资金或余额..." })}
            />
            <button className="btn sm" type="button" onClick={askCustomQuestion}>{tr({ en: "Ask", ar: "اسأل", zh: "提问" })}</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
