import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const sumMetric = (key) => UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics[key] || 0), 0);
const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");

const configs = {
  uc17: {
    scope: { en: "Scope: G03-UC17 execution ledger · SAP/Asas + Etimad", ar: "النطاق: دفتر تنفيذ G03-UC17", zh: "范围：G03-UC17 执行台账 · SAP/Asas + Etimad" },
    prompts: [
      { en: "Which budget line should I review first?", ar: "أي بند أراجع أولاً؟", zh: "优先复核哪条预算行？" },
      { en: "How much available funding remains?", ar: "كم التمويل المتاح؟", zh: "当前还剩多少可用资金？" },
      { en: "Explain the selected line risk.", ar: "اشرح مخاطر البند المحدد.", zh: "解释当前预算行风险。" },
    ],
    answer: ({ selectedRow, tr }) => {
      const row = selectedRow || riskRows[0] || UC17_BUDGET_ROWS[0];
      return {
        en: `UC17 monitors ${UC17_BUDGET_ROWS.length} budget lines. Available funds total ${formatSar(sumMetric("available"))}; ${riskRows.length} rows are under warning. Selected line ${row.code}: ${tr(row.statusDetail)}`,
        ar: `يراقب UC17 عدد ${UC17_BUDGET_ROWS.length} بنود. المتاح ${formatSar(sumMetric("available"))}، والتحذيرات ${riskRows.length}.`,
        zh: `UC17 当前监控 ${UC17_BUDGET_ROWS.length} 条预算行，可用资金合计 ${formatSar(sumMetric("available"))}，其中 ${riskRows.length} 条进入预警。当前预算行 ${row.code}：${tr(row.statusDetail)}`,
      };
    },
  },
  uc02: {
    scope: { en: "Scope: G03-UC02 warning queue · sourced from UC17", ar: "النطاق: تحذيرات UC02", zh: "范围：G03-UC02 预警队列 · 来源 UC17" },
    prompts: [
      { en: "What are the top warnings?", ar: "ما أهم التحذيرات؟", zh: "当前最高优先级预警是什么？" },
      { en: "Which warnings feed UC04?", ar: "أي تحذيرات تغذي UC04؟", zh: "哪些预警会送入 UC04？" },
      { en: "How much commitment is exposed?", ar: "كم الالتزام المكشوف؟", zh: "预警承诺金额是多少？" },
    ],
    answer: () => ({
      en: `${riskRows.length} warning rows are active. Warning exposure includes ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.committed, 0))} committed and ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.available, 0))} available-funds review pool.`,
      ar: `يوجد ${riskRows.length} تحذيرات نشطة.`,
      zh: `当前有 ${riskRows.length} 条 UC17 预警行，预警暴露包括已承诺 ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.committed, 0))}，以及可用资金复核池 ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.available, 0))}。`,
    }),
  },
  uc04: {
    scope: { en: "Scope: G03-UC04 rolling forecast · UC17 actuals", ar: "النطاق: تنبؤ UC04", zh: "范围：G03-UC04 滚动预测 · UC17 实际数" },
    prompts: [
      { en: "When does need exceed the ceiling?", ar: "متى تتجاوز الحاجة السقف؟", zh: "需求何时超上限？" },
      { en: "What feeds this forecast?", ar: "ما مصادر التنبؤ؟", zh: "这个预测由哪些数据驱动？" },
      { en: "Can this be sent to UC07?", ar: "هل يرسل إلى UC07؟", zh: "这些预测能送入 UC07 吗？" },
    ],
    answer: () => ({
      en: `UC04 uses UC17 committed, invoice, paid, balance and available-funds records. The current forecast shows a funding-pressure signal that should be routed to UC07 after owner review.`,
      ar: `يستخدم UC04 بيانات UC17 ويولد إشارة ضغط تمويل.`,
      zh: `UC04 使用 UC17 的承诺、发票、付款、余额与可用资金数据。当前预测形成资金压力信号，负责人复核后应送入 UC07 做财政空间判断。`,
    }),
  },
  uc07: {
    scope: { en: "Scope: G03-UC07 fiscal space · transfer scenarios", ar: "النطاق: الحيز المالي UC07", zh: "范围：G03-UC07 财政空间 · 转移场景" },
    prompts: [
      { en: "What fiscal space is available?", ar: "ما الحيز المالي؟", zh: "可用资金空间是多少？" },
      { en: "Which transfer scenario is recommended?", ar: "أي سيناريو موصى به؟", zh: "推荐哪个转移方案？" },
      { en: "Can I generate the impact report?", ar: "هل أنشئ تقرير الأثر؟", zh: "可以生成财务影响报告吗？" },
    ],
    answer: () => ({
      en: `UC07 should prioritize idle available balances and preserve committed reserves. The recommended controlled transfer covers forecast pressure while keeping an approval buffer.`,
      ar: `يوصي UC07 بمناقلة مضبوطة مع الحفاظ على الاحتياطي.`,
      zh: `UC07 优先使用可用但闲置余额，同时保留已承诺准备。推荐受控转移方案，用于覆盖 UC04 预测压力并保留审批缓冲。`,
    }),
  },
  uc10: {
    scope: { en: "Scope: G03-UC10 report library · UC17/UC02/UC04 evidence", ar: "النطاق: تقارير UC10", zh: "范围：G03-UC10 报告库 · UC17/UC02/UC04 证据" },
    prompts: [
      { en: "What data is in this report?", ar: "ما بيانات التقرير؟", zh: "报告包含哪些数据？" },
      { en: "Which UC sources are traceable?", ar: "ما المصادر القابلة للتتبع؟", zh: "哪些 UC 来源可追溯？" },
      { en: "What is pending approval?", ar: "ما بانتظار الاعتماد؟", zh: "哪些内容待审批？" },
    ],
    answer: () => ({
      en: `UC10 traces values to UC17 execution rows, UC02 warning rows and UC04 forecast evidence. The report package includes total budget ${formatSar(sumMetric("budget"))}, committed ${formatSar(sumMetric("committed"))}, paid ${formatSar(sumMetric("paid"))} and available funds ${formatSar(sumMetric("available"))}.`,
      ar: `يرتبط تقرير UC10 ببيانات UC17 وUC02 وUC04.`,
      zh: `UC10 报告可追溯到 UC17 执行行、UC02 预警行和 UC04 预测依据。报告包包含预算总额 ${formatSar(sumMetric("budget"))}、已承诺 ${formatSar(sumMetric("committed"))}、已付款 ${formatSar(sumMetric("paid"))}、可用资金 ${formatSar(sumMetric("available"))}。`,
    }),
  },
};

export function BudgetExecutionSmartQuery({ tr, pushLog, page = "uc17", selectedRow }) {
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const panelRef = useRef(null);
  const config = configs[page] || configs.uc17;
  const answer = useMemo(() => config.answer({ selectedRow, tr }), [config, selectedRow, tr]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = panelRef.current.scrollHeight;
  }, [messages, thinking]);

  const send = (question) => {
    const value = (question || ask).trim();
    if (!value || thinking) return;
    pushLog?.({ en: `G03 smart query: ${value}`, ar: `استعلام G03: ${value}`, zh: `G03 智能问数：${value}` });
    setMessages((current) => [...current, { role: "u", text: value }]);
    setAsk("");
    setShowPrompts(false);
    setThinking(true);
    setTimeout(() => {
      setMessages((current) => [...current, { role: "a", text: tr(answer) }]);
      setThinking(false);
    }, 420);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <button className="wb-qfab g03-smart-query-fab" type="button" onClick={() => setOpen((value) => !value)} title={tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能问数" })} aria-label={tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能问数" })}>
        🤖
      </button>
      {open && (
        <div className="wb-qpanel qa g03-smart-query-panel">
          <div className="wb-qph">
            <span className="wb-dot violet" />
            <b>{tr({ en: "Smart Query · G03 Budget Execution", ar: "استعلام ذكي · تنفيذ الميزانية", zh: "智能问数 · G03 预算执行" })}</b>
            <span className="g03-sq-badge">{page.toUpperCase()}</span>
            <button className="wb-qx" type="button" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="wb-pb wb-qbody">
            <div className="wb-src g03-sq-scope">{tr(config.scope)}</div>
            <div className="wb-qa sq-conv" ref={panelRef}>
              {messages.length === 0 && !thinking && <div className="sq-empty">{tr({ en: "Ask this page's budget execution agent, or choose a suggested question below.", ar: "اسأل وكيل تنفيذ الميزانية أو اختر سؤالاً.", zh: "向本页面预算执行智能体提问，或点击下方建议问题。" })}</div>}
              {messages.map((message, index) => <div className={`wb-qm ${message.role}`} key={`${message.role}-${index}`}><div className="bb">{message.text}</div></div>)}
              {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
            </div>
            <div className={`wb-sqh${messages.length > 0 ? " tog" : ""}`} onClick={() => messages.length > 0 && setShowPrompts((value) => !value)}>
              {tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}
              {messages.length > 0 && <span className="sqtg">{showPrompts ? "▾" : "▸"}</span>}
            </div>
            {(messages.length === 0 || showPrompts) && config.prompts.map((prompt) => (
              <button className="wb-sq g03-sq-prompt" type="button" key={prompt.en} onClick={() => send(tr(prompt))}>
                {tr(prompt)} <span className="ar">→</span>
              </button>
            ))}
            <div className="wb-askh">{tr({ en: "Ask the G03 agent...", ar: "اسأل وكيل G03...", zh: "向 G03 智能体提问..." })}</div>
            <div className="wb-ask">
              <input value={ask} onChange={(event) => setAsk(event.target.value)} placeholder={tr({ en: "Type your question...", ar: "اكتب سؤالك...", zh: "输入你的问题..." })} onKeyDown={(event) => event.key === "Enter" && send()} />
              <button className="btn sm" type="button" onClick={() => send()}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
