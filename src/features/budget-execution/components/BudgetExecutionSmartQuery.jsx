import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const sumMetric = (key) => UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics[key] || 0), 0);
const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");

const configs = {
  uc17: {
    badge: { en: "Execution ledger", ar: "دفتر التنفيذ", zh: "执行台账" },
    scope: { en: "Scope: execution ledger · SAP/Asas + Etimad", ar: "النطاق: دفتر التنفيذ", zh: "范围：执行台账 · SAP/Asas + Etimad" },
    prompts: [
      { en: "Which budget line should I review first?", ar: "أي بند أراجع أولاً؟", zh: "优先复核哪条预算行？" },
      { en: "How much available funding remains?", ar: "كم التمويل المتاح؟", zh: "当前还剩多少可用资金？" },
      { en: "Explain the selected line risk.", ar: "اشرح مخاطر البند المحدد.", zh: "解释当前预算行风险。" },
    ],
    answer: ({ selectedRow, tr }) => {
      const row = selectedRow || riskRows[0] || UC17_BUDGET_ROWS[0];
      return {
        en: `The execution ledger monitors ${UC17_BUDGET_ROWS.length} budget lines. Available funds total ${formatSar(sumMetric("available"))}; ${riskRows.length} rows are under warning. Selected line ${row.code}: ${tr(row.statusDetail)}`,
        ar: `يراقب دفتر التنفيذ عدد ${UC17_BUDGET_ROWS.length} بنود. المتاح ${formatSar(sumMetric("available"))}، والتحذيرات ${riskRows.length}.`,
        zh: `执行台账当前监控 ${UC17_BUDGET_ROWS.length} 条预算行，可用资金合计 ${formatSar(sumMetric("available"))}，其中 ${riskRows.length} 条进入预警。当前预算行 ${row.code}：${tr(row.statusDetail)}`,
      };
    },
  },
  uc02: {
    badge: { en: "Warning queue", ar: "قائمة التحذيرات", zh: "预警队列" },
    scope: { en: "Scope: warning queue · sourced from the execution ledger", ar: "النطاق: قائمة التحذيرات من دفتر التنفيذ", zh: "范围：预警队列 · 来源执行台账" },
    prompts: [
      { en: "What are the top warnings?", ar: "ما أهم التحذيرات؟", zh: "当前最高优先级预警是什么？" },
      { en: "Which warnings feed rolling forecast?", ar: "أي تحذيرات تغذي التنبؤ؟", zh: "哪些预警会送入滚动预测？" },
      { en: "How much commitment is exposed?", ar: "كم الالتزام المكشوف؟", zh: "预警承诺金额是多少？" },
    ],
    answer: () => ({
      en: `${riskRows.length} warning rows are active. Warning exposure includes ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.committed, 0))} committed and ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.available, 0))} available-funds review pool.`,
      ar: `يوجد ${riskRows.length} تحذيرات نشطة.`,
      zh: `当前有 ${riskRows.length} 条执行预警行，预警暴露包括已承诺 ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.committed, 0))}，以及可用资金复核池 ${formatSar(riskRows.reduce((sum, row) => sum + row.metrics.available, 0))}。`,
    }),
  },
  uc04: {
    badge: { en: "Rolling forecast", ar: "التنبؤ المتجدد", zh: "滚动预测" },
    scope: { en: "Scope: rolling forecast · execution actuals", ar: "النطاق: التنبؤ المتجدد من الفعليات", zh: "范围：滚动预测 · 执行实际数" },
    prompts: [
      { en: "When does need exceed the ceiling?", ar: "متى تتجاوز الحاجة السقف؟", zh: "需求何时超上限？" },
      { en: "What feeds this forecast?", ar: "ما مصادر التنبؤ؟", zh: "这个预测由哪些数据驱动？" },
      { en: "Can this be sent to fiscal-space planning?", ar: "هل يرسل إلى تخطيط الحيز المالي؟", zh: "这些预测能送入财政空间规划吗？" },
    ],
    answer: () => ({
      en: "The rolling forecast uses committed, invoice, paid, balance and available-funds records from the execution ledger. The current forecast shows a funding-pressure signal that should be routed to fiscal-space planning after owner review.",
      ar: "يستخدم التنبؤ المتجدد بيانات دفتر التنفيذ ويولد إشارة ضغط تمويل.",
      zh: "滚动预测使用执行台账中的承诺、发票、付款、余额与可用资金数据。当前预测形成资金压力信号，负责人复核后应送入财政空间规划判断。",
    }),
  },
  uc07: {
    badge: { en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" },
    scope: { en: "Scope: fiscal space · transfer scenarios", ar: "النطاق: الحيز المالي وسيناريوهات المناقلة", zh: "范围：财政空间 · 转移场景" },
    prompts: [
      { en: "What fiscal space is available?", ar: "ما الحيز المالي؟", zh: "可用资金空间是多少？" },
      { en: "Which transfer scenario is recommended?", ar: "أي سيناريو موصى به؟", zh: "推荐哪个转移方案？" },
      { en: "Can I generate the impact report?", ar: "هل أنشئ تقرير الأثر؟", zh: "可以生成财务影响报告吗？" },
    ],
    answer: () => ({
      en: "Fiscal-space planning should prioritize idle available balances and preserve committed reserves. The recommended controlled transfer covers forecast pressure while keeping an approval buffer.",
      ar: "يوصي تخطيط الحيز المالي بمناقلة مضبوطة مع الحفاظ على الاحتياطي.",
      zh: "财政空间规划优先使用可用但闲置余额，同时保留已承诺准备。推荐受控转移方案，用于覆盖滚动预测压力并保留审批缓冲。",
    }),
  },
  uc10: {
    badge: { en: "Report generation", ar: "إنشاء التقارير", zh: "报告生成" },
    scope: { en: "Scope: report library · ledger / warnings / forecast evidence", ar: "النطاق: مكتبة التقارير والأدلة", zh: "范围：报告库 · 台账 / 预警 / 预测证据" },
    prompts: [
      { en: "What data is in this report?", ar: "ما بيانات التقرير؟", zh: "报告包含哪些数据？" },
      { en: "Which sources are traceable?", ar: "ما المصادر القابلة للتتبع؟", zh: "哪些来源可追溯？" },
      { en: "What is pending approval?", ar: "ما بانتظار الاعتماد؟", zh: "哪些内容待审批？" },
    ],
    answer: () => ({
      en: `Report generation traces values to execution rows, warning rows and forecast evidence. The report package includes total budget ${formatSar(sumMetric("budget"))}, committed ${formatSar(sumMetric("committed"))}, paid ${formatSar(sumMetric("paid"))} and available funds ${formatSar(sumMetric("available"))}.`,
      ar: "يرتبط التقرير ببيانات التنفيذ والتحذيرات وأدلة التنبؤ.",
      zh: `报告生成可追溯到执行行、预警行和预测依据。报告包包含预算总额 ${formatSar(sumMetric("budget"))}、已承诺 ${formatSar(sumMetric("committed"))}、已付款 ${formatSar(sumMetric("paid"))}、可用资金 ${formatSar(sumMetric("available"))}。`,
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
    pushLog?.({ en: `Budget execution smart query: ${value}`, ar: `استعلام تنفيذ الميزانية: ${value}`, zh: `预算执行智能问数：${value}` });
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
            <b>{tr({ en: "Smart Query · Budget Execution", ar: "استعلام ذكي · تنفيذ الميزانية", zh: "智能问数 · 预算执行" })}</b>
            <span className="g03-sq-badge">{tr(config.badge)}</span>
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
            <div className="wb-askh">{tr({ en: "Ask the budget execution agent...", ar: "اسأل وكيل تنفيذ الميزانية...", zh: "向预算执行智能体提问..." })}</div>
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
