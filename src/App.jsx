import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import * as RC from "recharts";
import { ACTIVE_DEPARTMENT_IDS, DEPARTMENT_BY_ROUTE, DEPARTMENT_GROUPS } from "./departments";
import {
  DataReadinessDrawer,
  FutureObligationsPage,
  G02BusinessStoryline,
  HousingSupportPage,
  ProjectCostPage,
  ScenarioDecisionPage,
  SmartQueryAuditPage,
} from "./group02/Group02Pages";
import { createInitialGroup02State, mergeStoredGroup02State } from "./group02/model";
import { applyKpiSlides, applyOrchestratorConfig, getChartDisplay, getChartNumber, getKpiDisplay, getPageConfigComponent, getPageContent, getPageItem, getSmartQueryFabConfig, localizedComponentNote, localizedComponentTitle, keyify } from "./data/presentationConfig.js";
import "./group02/group02.css";

/* =========================================================================
   Financial & Budgeting Copilot (AI_SS_02) — interactive demo.
   MoMAH · Agency for Financial Affairs and Budget.
   One multi-agent platform with connected agentic journeys + the UC-06
   Financial Performance Analysis report builder (4 steps).
   Trilingual: Arabic (RTL) · English · 中文 (?ln=zh / ?ln=en / ?ln=ar).
   Every AI output is a DRAFT — nothing is a financial decision until approved.
   All figures are synthetic demo data (BRD V0.1).
   ========================================================================= */
const BUILD_TIME = (typeof BUILD_STAMP !== "undefined" && BUILD_STAMP) ? BUILD_STAMP : "@@BUILD@@";
const LANGS = ["ar", "en", "zh"];
const URL_LANG = (() => { try { const p = new URLSearchParams(window.location.search).get("ln"); return LANGS.indexOf(p) >= 0 ? p : null; } catch (e) { return null; } })();
const URL_ROUTE = (() => { try { return new URLSearchParams(window.location.search).get("route") || null; } catch (e) { return null; } })();
// ?uc=true reveals UC-xx / G-x annotations in the UI; hidden by default for client demos.
const SHOW_UC = (() => { try { return new URLSearchParams(window.location.search).get("uc") === "true"; } catch (e) { return false; } })();
function sanitizeUc(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/\s*[\(（](?:UC|G|ج)-[0-9０-９/\-、,\s]*[\)）]/g, "")
    .replace(/(?:UC|G|ج)-[0-9/\-]+\s*[·:：]\s*/g, "")
    .replace(/\s*·\s*(?:UC|G|ج)-[0-9/\-]+/g, "")
    .replace(/\s*(?:UC|G|ج)-[0-9/\-]+/g, "")
    .replace(/\(\s*\)|（\s*）/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
const GCODE = { planning: "G-02", budget: "G-03", claims: "G-04", reporting: "G-05", revassets: "G-06" };
const SCOPE = { en: "Ministry · FY2026", ar: "الوزارة · 2026", zh: "部级 · 2026" };

/* ---- Agents (engines) & data sources ---- */
// 13 agents from the BRD's "Agent roles and decision-making scopes" (1 Orchestrator + 12 specialized).
const ENGINES = [
  { key: "orch", icon: "✦", lvl: "L1" },
  { key: "forecast", icon: "📈", lvl: "L2" },
  { key: "rolling", icon: "🔄", lvl: "L2" },
  { key: "scenario", icon: "⚖", lvl: "L2" },
  { key: "optimize", icon: "🎯", lvl: "L2" },
  { key: "anomaly", icon: "◉", lvl: "L2" },
  { key: "trends", icon: "🌐", lvl: "L3" },
  { key: "insights", icon: "💡", lvl: "L3" },
  { key: "narrative", icon: "✍", lvl: "L3" },
  { key: "query", icon: "🔎", lvl: "L3" },
  { key: "reports", icon: "📄", lvl: "L3" },
  { key: "revenue", icon: "💰", lvl: "L2" },
  { key: "compliance", icon: "🛡", lvl: "L3" },
];
// 13 integration systems from the BRD's integrations table.
const SOURCES11 = [
  { key: "sap", status: "ok", sla: "daily", fresh: 99 }, { key: "grp", status: "ok", sla: "daily", fresh: 96 },
  { key: "etimad", status: "ok", sla: "daily", fresh: 97 }, { key: "etimadp", status: "amber", sla: "—", fresh: 60 },
  { key: "esnad", status: "ok", sla: "daily", fresh: 95 }, { key: "tahseel", status: "amber", sla: "weekly", fresh: 78 },
  { key: "makeen", status: "ok", sla: "weekly", fresh: 92 }, { key: "efaa", status: "ok", sla: "weekly", fresh: 90 },
  { key: "sanad", status: "ok", sla: "weekly", fresh: 91 }, { key: "bi", status: "ok", sla: "daily", fresh: 93 },
  { key: "balady", status: "ok", sla: "daily", fresh: 94 }, { key: "whiteland", status: "ok", sla: "monthly", fresh: 88 },
  { key: "hyperion", status: "amber", sla: "quarterly", fresh: 74 },
];

/* ---- hub charts ---- */
const UTIL_BY_AMANA = [
  { k: "RUH", v: 78 }, { k: "JED", v: 91 }, { k: "MAK", v: 63 },
  { k: "EAS", v: 69 }, { k: "MED", v: 54 }, { k: "ASR", v: 47 },
];

/* ---- alerts / deviations ---- */
const ALERTS = [
  { id: "DV-2041", sev: "red", src: "SAP · UC-02", scn: "q_overrun",
    t: { en: "Jeddah Amana · operating budget at 91% — projected overrun", ar: "أمانة جدة · تنفيذ تشغيلي 91٪ — تجاوز متوقع", zh: "吉达阿玛纳 · 运营预算执行 91%——预计超支" },
    rc: { en: "Execution outpaced the payment plan; projected SAR 96M overrun by year-end.", ar: "تجاوز التنفيذ خطة الدفع؛ تجاوز متوقع 96 مليون ريال بنهاية العام.", zh: "执行进度超过付款计划；预计年底超支 9,600 万里亚尔。" } },
  { id: "DV-2044", sev: "red", src: "Etimad · UC-02", scn: "q_duplicate",
    t: { en: "Suspected duplicate invoice · vendor 700412", ar: "اشتباه فاتورة مكررة · المورّد 700412", zh: "疑似重复发票 · 供应商 700412" },
    rc: { en: "Two claims of SAR 1.84M filed 6 days apart against contract CT-5520.", ar: "مطالبتان بقيمة 1.84 مليون ريال بفارق 6 أيام على العقد CT-5520.", zh: "针对合同 CT-5520，6 天内提交两笔各 184 万里亚尔的索赔。" } },
  { id: "DV-2050", sev: "amber", src: "Tahseel · UC-13", scn: "q_collection",
    t: { en: "Collection gap widened · Asir Amana", ar: "اتساع فجوة التحصيل · أمانة عسير", zh: "征收缺口扩大 · 阿西尔阿玛纳" },
    rc: { en: "Billing-vs-collection variance reached 14% (> 10% threshold).", ar: "بلغ الفرق بين الفوترة والتحصيل 14٪ (يتجاوز حد 10٪).", zh: "开票与征收差异达 14%(超过 10% 阈值)。" } },
  { id: "DV-2053", sev: "amber", src: "SAP · UC-09", scn: null,
    t: { en: "Abnormal trial-balance entry · account 2310", ar: "رصيد غير اعتيادي في ميزان المراجعة · الحساب 2310", zh: "试算平衡异常分录 · 科目 2310" },
    rc: { en: "Accrued-liabilities balance deviates from the 6-month pattern.", ar: "رصيد الالتزامات المستحقة ينحرف عن نمط 6 أشهر.", zh: "应计负债余额偏离过去 6 个月的模式。" } },
  { id: "DV-2057", sev: "info", src: "Esnad · UC-08", scn: null,
    t: { en: "Dormant contract · CT-8841 (92 days no activity)", ar: "عقد خامل · CT-8841 (92 يوماً دون حركة)", zh: "休眠合同 · CT-8841(92 天无活动)" },
    rc: { en: "No disbursement activity for 92 days — candidate for release.", ar: "لا حركة صرف منذ 92 يوماً — مرشح للإفراج عن المخصص.", zh: "92 天无支付活动——可考虑释放预算。" } },
];

/* ---- Assistant scenarios (scripted) ---- */
const SCN = {
  q_fiscal: { type: "single", engines: ["orch", "consol", "forecast"],
    steps: [["orch", "think_intent"], ["query", "think_route"], ["forecast", "think_run"], ["orch", "think_compose"]],
    a: { en: "Riyadh Region Amana has SAR 1.21B of available fiscal space: an approved ceiling of SAR 1.60B less SAR 0.31B commitments and SAR 0.08B reservations. Utilization is 78%.",
         ar: "يبلغ الحيز المالي المتاح لأمانة منطقة الرياض 1.21 مليار ريال: سقف معتمد 1.60 مليار ريال مخصوماً منه 0.31 مليار التزامات و0.08 مليار حجوزات. ونسبة التنفيذ 78٪.",
         zh: "利雅得地区阿玛纳的可用财政空间为 12.1 亿里亚尔:核定上限 16.0 亿里亚尔,扣除 3.1 亿承诺与 0.8 亿预留。执行率 78%。" },
    conf: 90, srcs: ["src_sap", "src_etimad", "src_gl"], viz: "util", report: "rep_fiscal" },
  q_overrun: { type: "cross", engines: ["orch", "deviation", "forecast"],
    steps: [["orch", "think_intent"], ["anomaly", "think_run"], ["forecast", "think_run"], ["orch", "think_compose"]],
    a: { en: "Jeddah Governorate Amana is the main risk: 91% operating-budget utilization with a projected SAR 96M overrun by year-end. A reallocation of SAR 120M from Asir under-execution is recommended — open the Budget Execution journey to review and approve it.",
         ar: "أمانة محافظة جدة هي الخطر الأبرز: 91٪ تنفيذ تشغيلي مع تجاوز متوقع 96 مليون ريال بنهاية العام. ويُوصى بإعادة توزيع 120 مليون ريال من نقص تنفيذ عسير — افتح مسار تنفيذ الميزانية للمراجعة والاعتماد.",
         zh: "吉达省阿玛纳是主要风险:运营预算执行率 91%,预计年底超支 9,600 万里亚尔。建议从阿西尔的执行不足中调拨 1.2 亿里亚尔——请打开「预算执行」流程进行复核与审批。" },
    conf: 87, srcs: ["src_sap", "src_etimad"], viz: "util", report: "rep_overrun", red: true,
    actions: [{ lk: "act_open_budget", to: "budget" }] },
  q_duplicate: { type: "cross", engines: ["orch", "deviation", "comply"],
    steps: [["orch", "think_intent"], ["anomaly", "think_run"], ["compliance", "think_run"], ["orch", "think_compose"]],
    a: { en: "One suspected duplicate this month: vendor 700412 filed INV-55021 and INV-55088 (each SAR 1.84M) 6 days apart against contract CT-5520. The Audit Agent recommends blocking INV-55021. This is a draft pending your approval — open the Claims & Disbursement journey to act.",
         ar: "تكرار واحد مشتبه به هذا الشهر: قدّم المورّد 700412 الفاتورتين INV-55021 وINV-55088 (كل منهما 1.84 مليون ريال) بفارق 6 أيام على العقد CT-5520. ويوصي وكيل التدقيق بحجب INV-55021. وهذه مسودة بانتظار اعتمادك — افتح مسار المطالبات والصرف.",
         zh: "本月有一笔疑似重复:供应商 700412 针对合同 CT-5520,6 天内提交了 INV-55021 与 INV-55088(各 184 万里亚尔)。审计智能体建议拦截 INV-55021。此为待您审批的草稿——请打开「索赔与支付」流程处理。" },
    conf: 94, srcs: ["src_etimad", "src_esnad"], report: "rep_dup", red: true,
    actions: [{ lk: "act_open_claims", to: "claims" }] },
  q_collection: { type: "single", engines: ["orch", "consol", "deviation"],
    steps: [["orch", "think_intent"], ["revenue", "think_route"], ["anomaly", "think_run"], ["orch", "think_compose"]],
    a: { en: "The overall collection rate is 88.6%, up 1.4 points month-on-month. The widest gap is Asir Amana, where billing-vs-collection variance reached 14% and raised an early-warning alert.",
         ar: "بلغت نسبة التحصيل الإجمالية 88.6٪، بارتفاع 1.4 نقطة شهرياً. وأكبر فجوة في أمانة عسير حيث بلغ الفرق بين الفوترة والتحصيل 14٪ وأطلق تنبيهاً مبكراً.",
         zh: "整体征收率为 88.6%,环比上升 1.4 个百分点。最大缺口在阿西尔阿玛纳,开票与征收差异达 14%,已触发预警。" },
    conf: 89, srcs: ["src_tahseel", "src_makeen"], report: "rep_collect" },
  q_vague: { type: "escalate", engines: ["orch"],
    steps: [["orch", "think_intent"], ["orch", "think_perm"]],
    a: { en: "I can't answer that. The request falls outside your permission scope and the platform is read-only for sensitive vendor and beneficiary records. I can instead provide aggregated, source-backed financial analytics.",
         ar: "لا أستطيع الإجابة على ذلك. يقع الطلب خارج نطاق صلاحياتك، والمنصة للقراءة فقط فيما يخص بيانات الموردين والمستفيدين الحساسة. ويمكنني بدلاً من ذلك تقديم تحليلات مالية مجمّعة ومدعومة بالمصادر.",
         zh: "我无法回答该请求。它超出了您的权限范围,且平台对敏感的供应商与受益人记录仅为只读。我可以改为提供聚合的、有数据来源支撑的财务分析。" },
    conf: null, srcs: [] },
};
const PRESETS = ["q_fiscal", "q_overrun", "q_duplicate", "q_collection", "q_vague"];

/* ---- Storyline G-03 (budget execution) ---- */
const STORY_BUDGET = {
  key: "budget",
  nodes: [
    { k: "consol", uc: "UC-01", kind: "data", icon: "⛁",
      title: { en: "Consolidate source data", ar: "تجميع بيانات المصدر", zh: "汇聚源数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull approved ceilings, commitments and payment plans from SAP, Etimad and GRP; standardize and validate.", ar: "سحب السقوف والالتزامات وخطط الدفع المعتمدة من ساب واعتماد وGRP؛ ثم التوحيد والتحقق.", zh: "从 SAP、Etimad 和 GRP 拉取核定上限、承诺与付款计划;标准化并校验。" },
      out: { en: "Standardized, validated budget dataset — 6 Amanas, FY2026.", ar: "مجموعة بيانات ميزانية موحّدة ومتحقق منها — 6 أمانات، 2026.", zh: "标准化、已校验的预算数据集——6 个阿玛纳,2026 财年。" },
      metric: { en: "6 Amanas", ar: "6 أمانات", zh: "6 个阿玛纳" } },
    { k: "deviation", uc: "UC-02", kind: "agent", icon: "◉",
      title: { en: "Deviation & execution scan", ar: "فحص الانحرافات والتنفيذ", zh: "偏差与执行扫描" },
      actor: { en: "Deviation Agent", ar: "وكيل الانحرافات", zh: "偏差智能体" },
      desc: { en: "Compare actual execution against ceilings and payment plans across departments.", ar: "مقارنة التنفيذ الفعلي بالسقوف وخطط الدفع عبر الإدارات.", zh: "将各部门的实际执行与上限和付款计划进行比对。" },
      table: { cols: { en: ["Amana", "Utilization", "Status"], ar: ["الأمانة", "نسبة التنفيذ", "الحالة"], zh: ["阿玛纳", "执行率", "状态"] },
        rows: [{ a: "Jeddah", v: "91%", f: "red" }, { a: "Riyadh", v: "78%", f: "amber" }, { a: "Asir", v: "47%", f: "info" }] },
      out: { en: "1 high-risk overrun (Jeddah), 1 under-execution (Asir).", ar: "تجاوز عالي الخطورة (جدة)، ونقص تنفيذ (عسير).", zh: "1 项高风险超支(吉达),1 项执行不足(阿西尔)。" },
      metric: { en: "1 RED", ar: "إنذار أحمر", zh: "1 个红色" } },
    { k: "fiscal", uc: "UC-07", kind: "fiscal", icon: "∑",
      title: { en: "Recompute fiscal space", ar: "إعادة حساب الحيز المالي", zh: "重新计算财政空间" },
      actor: { en: "Budget Planning Agent", ar: "وكيل تخطيط الميزانية", zh: "预算规划智能体" },
      desc: { en: "Fiscal space = approved ceiling − commitments − payment plan − reservations.", ar: "الحيز المالي = السقف المعتمد − الالتزامات − خطة الدفع − الحجوزات.", zh: "财政空间 = 核定上限 − 承诺 − 付款计划 − 预留。" },
      fiscal: { ceiling: 6.40, commit: 0.98, plan: 0.42, reserve: 0.18, space: 4.82 },
      out: { en: "Available fiscal space recalculated to SAR 4.82B.", ar: "إعادة حساب الحيز المالي المتاح إلى 4.82 مليار ريال.", zh: "可用财政空间重新计算为 48.2 亿里亚尔。" },
      metric: { en: "SAR 4.82B", ar: "4.82 مليار", zh: "48.2 亿" } },
    { k: "realloc", uc: "UC-08", kind: "review", icon: "✦",
      title: { en: "AI reallocation recommendation", ar: "توصية إعادة التوزيع", zh: "AI 调拨建议" },
      actor: { en: "Reallocation Agent → Human reviewer", ar: "وكيل إعادة التوزيع ← المراجع البشري", zh: "调拨智能体 → 人工复核" },
      desc: { en: "Within approved ceilings, the agent proposes a transfer to cover the Jeddah overrun from under-executed budgets.", ar: "ضمن السقوف المعتمدة، يقترح الوكيل مناقلة لتغطية تجاوز جدة من ميزانيات منخفضة التنفيذ.", zh: "在核定上限内,智能体建议从执行不足的预算中调拨以弥补吉达的超支。" },
      review: {
        headline: { en: "Reallocate SAR 120M from Asir under-execution to Jeddah operating budget.", ar: "إعادة توزيع 120 مليون ريال من نقص تنفيذ عسير إلى الميزانية التشغيلية لجدة.", zh: "从阿西尔执行不足中调拨 1.2 亿里亚尔至吉达运营预算。" },
        conf: 82,
        why: { en: "Asir is at 47% utilization with SAR 210M unspent and no committed pipeline this quarter, while Jeddah is projected to overrun by SAR 96M. The transfer stays within the regional operating ceiling and approved transfer rule BT-07.", ar: "عسير عند 47٪ تنفيذ مع 210 مليون ريال غير مصروفة ودون التزامات هذا الربع، بينما يُتوقع تجاوز جدة بمقدار 96 مليون ريال. وتبقى المناقلة ضمن السقف التشغيلي للمنطقة وقاعدة المناقلة المعتمدة BT-07.", zh: "阿西尔执行率 47%,本季度有 2.1 亿里亚尔未支出且无承诺管线,而吉达预计超支 9,600 万里亚尔。该调拨仍在地区运营上限及核定调拨规则 BT-07 之内。" },
        srcs: ["SAP · GL 5100", "Etimad", "Rule BT-07"],
        approveLog: { en: "Approved reallocation SAR 120M Asir → Jeddah (UC-08)", ar: "اعتماد إعادة توزيع 120 مليون ريال من عسير إلى جدة (UC-08)", zh: "已批准调拨 1.2 亿里亚尔 阿西尔 → 吉达(UC-08)" } },
      out: { en: "Transfer recorded; Jeddah projected overrun cleared.", ar: "تسجيل المناقلة؛ معالجة تجاوز جدة المتوقع.", zh: "已记录调拨;吉达的预计超支已化解。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { k: "report", uc: "UC-10", kind: "report", icon: "📄",
      title: { en: "Budget execution report", ar: "تقرير تنفيذ الميزانية", zh: "预算执行报告" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate a narrative report with the deviation, the recalculated fiscal space and the approved reallocation.", ar: "إنشاء تقرير سردي يتضمن الانحراف والحيز المالي المعاد حسابه والمناقلة المعتمدة.", zh: "生成包含偏差、重算财政空间与已批准调拨的叙述性报告。" },
      report: {
        title: { en: "Q2 Budget Execution — Jeddah / Asir", ar: "تنفيذ ميزانية الربع الثاني — جدة / عسير", zh: "二季度预算执行——吉达 / 阿西尔" },
        narrative: { en: "Q2 budget execution stands at 71.4% overall. Jeddah Amana reached 91% utilization, triggering a projected SAR 96M overrun; an approved transfer of SAR 120M from Asir under-execution restored balance within the regional ceiling. Available fiscal space stands at SAR 4.82B. All figures are traceable to SAP and Etimad source records.", ar: "بلغ تنفيذ ميزانية الربع الثاني 71.4٪ إجمالاً. وصلت أمانة جدة إلى 91٪، ما تسبب بتجاوز متوقع 96 مليون ريال؛ وأعادت مناقلة معتمدة بقيمة 120 مليون ريال من نقص تنفيذ عسير التوازن ضمن سقف المنطقة. ويبلغ الحيز المالي المتاح 4.82 مليار ريال. وجميع الأرقام قابلة للتتبع إلى سجلات ساب واعتماد.", zh: "二季度预算整体执行率为 71.4%。吉达阿玛纳达到 91%,引发预计 9,600 万里亚尔超支;一笔从阿西尔执行不足中调拨的 1.2 亿里亚尔(已批准)在地区上限内恢复了平衡。可用财政空间为 48.2 亿里亚尔。所有数字均可追溯至 SAP 与 Etimad 源记录。" },
        rows: [
          { l: { en: "Overall utilization", ar: "نسبة التنفيذ الإجمالية", zh: "整体执行率" }, v: "71.4%" },
          { l: { en: "Reallocation approved", ar: "المناقلة المعتمدة", zh: "已批准调拨" }, v: "SAR 120M" },
          { l: { en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" }, v: "SAR 4.82B" }] },
      out: { en: "Report ready for the General Budget Department.", ar: "التقرير جاهز للإدارة العامة للميزانية.", zh: "报告已就绪,提交给预算总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};

/* ---- Storyline G-04 (claims & disbursement) ---- */
const STORY_CLAIMS = {
  key: "claims",
  nodes: [
    { k: "consol", uc: "UC-01", kind: "data", icon: "⛁",
      title: { en: "Ingest claim & contract", ar: "استلام المطالبة والعقد", zh: "接收索赔与合同" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Claim CL-77310 received via Etimad, linked to contract CT-5520 and its disbursement plan.", ar: "استلام المطالبة CL-77310 عبر اعتماد، مرتبطة بالعقد CT-5520 وخطة صرفه.", zh: "通过 Etimad 接收索赔 CL-77310,关联合同 CT-5520 及其支付计划。" },
      out: { en: "Claim SAR 1.84M linked to contract CT-5520 (ceiling SAR 9.0M).", ar: "ربط مطالبة بقيمة 1.84 مليون ريال بالعقد CT-5520 (سقف 9.0 مليون ريال).", zh: "184 万里亚尔索赔关联至合同 CT-5520(上限 900 万里亚尔)。" },
      metric: { en: "CL-77310", ar: "CL-77310", zh: "CL-77310" } },
    { k: "deviation", uc: "UC-02", kind: "agent", icon: "◉",
      title: { en: "Audit & duplicate detection", ar: "التدقيق وكشف التكرار", zh: "审计与重复检测" },
      actor: { en: "Audit Agent", ar: "وكيل التدقيق", zh: "审计智能体" },
      desc: { en: "Run completeness checks and scan for duplicate invoices and contract overruns.", ar: "تشغيل فحوص الاكتمال والبحث عن الفواتير المكررة وتجاوزات العقد.", zh: "运行完整性检查,扫描重复发票与合同超支。" },
      table: { cols: { en: ["Check", "Result"], ar: ["الفحص", "النتيجة"], zh: ["检查", "结果"] },
        rows: [{ a: { en: "Completeness", ar: "الاكتمال", zh: "完整性" }, v: { en: "Pass", ar: "مجتاز", zh: "通过" }, f: "info" },
               { a: { en: "Duplicate invoice", ar: "فاتورة مكررة", zh: "重复发票" }, v: { en: "Match found", ar: "تطابق", zh: "发现匹配" }, f: "red" },
               { a: { en: "Contract ceiling", ar: "سقف العقد", zh: "合同上限" }, v: { en: "Within limit", ar: "ضمن الحد", zh: "在限额内" }, f: "info" }] },
      out: { en: "Potential duplicate of invoice INV-55021 (SAR 1.84M) detected.", ar: "اكتشاف تكرار محتمل للفاتورة INV-55021 (1.84 مليون ريال).", zh: "检测到发票 INV-55021(184 万里亚尔)可能重复。" },
      metric: { en: "1 duplicate", ar: "تكرار واحد", zh: "1 笔重复" } },
    { k: "comply", uc: "UC-11", kind: "fiscal", icon: "🛡",
      title: { en: "Compliance verification (IPSAS)", ar: "التحقق من الامتثال (IPSAS)", zh: "合规校验(IPSAS)" },
      actor: { en: "Compliance Agent", ar: "وكيل الامتثال", zh: "合规智能体" },
      desc: { en: "Verify accrual treatment and supporting documents against IPSAS and ministry policy.", ar: "التحقق من المعالجة على أساس الاستحقاق والمستندات الداعمة وفق IPSAS وسياسات الوزارة.", zh: "依据 IPSAS 与部委政策核验权责发生制处理与支持文件。" },
      fiscal: { ceiling: 9.00, commit: 6.20, plan: 1.84, reserve: 0, space: 0.96 },
      out: { en: "Compliant — 1 note: attach completion certificate before payment.", ar: "مطابق — ملاحظة واحدة: إرفاق شهادة الإنجاز قبل الصرف.", zh: "合规——1 条提示:付款前需附竣工证书。" },
      metric: { en: "Compliant", ar: "مطابق", zh: "合规" } },
    { k: "disb", uc: "UC-08", kind: "review", icon: "✦",
      title: { en: "AI disbursement recommendation", ar: "توصية الصرف", zh: "AI 支付建议" },
      actor: { en: "Disbursement Agent → Human reviewer", ar: "وكيل الصرف ← المراجع البشري", zh: "支付智能体 → 人工复核" },
      desc: { en: "Given the duplicate match, the agent recommends holding the duplicate and approving a single net payment.", ar: "نظراً للتطابق، يوصي الوكيل بإيقاف المكررة واعتماد دفعة صافية واحدة.", zh: "鉴于重复匹配,智能体建议拦截重复项并核准单笔净额付款。" },
      review: {
        headline: { en: "Reject duplicate INV-55021; issue one payment order of SAR 1.84M against CT-5520.", ar: "رفض الفاتورة المكررة INV-55021؛ وإصدار أمر صرف واحد بقيمة 1.84 مليون ريال على CT-5520.", zh: "拒绝重复发票 INV-55021;针对 CT-5520 开具一笔 184 万里亚尔的付款单。" },
        conf: 94,
        why: { en: "INV-55021 and INV-55088 share the same vendor, amount and line items, filed 6 days apart; only one matches a delivered milestone. Paying both would overrun the contract by SAR 1.84M.", ar: "تتشارك INV-55021 وINV-55088 المورّد ذاته والمبلغ والبنود، وقُدّمتا بفارق 6 أيام؛ وواحدة فقط تطابق مرحلة منجزة. ودفع كليهما يتجاوز العقد بمقدار 1.84 مليون ريال.", zh: "INV-55021 与 INV-55088 供应商、金额、明细相同,相隔 6 天提交;仅一笔匹配已交付里程碑。两笔均付将使合同超支 184 万里亚尔。" },
        srcs: ["Etimad invoices", "CT-5520", "Esnad milestones"],
        approveLog: { en: "Approved payment order SAR 1.84M; duplicate INV-55021 rejected (UC-08)", ar: "اعتماد أمر صرف 1.84 مليون ريال؛ ورفض المكررة INV-55021 (UC-08)", zh: "已核准付款单 184 万里亚尔;已拒绝重复项 INV-55021(UC-08)" } },
      out: { en: "Payment order approved; duplicate blocked; SAP entry proposed.", ar: "اعتماد أمر الصرف؛ حجب المكررة؛ واقتراح قيد ساب.", zh: "已核准付款单;已拦截重复项;已建议 SAP 分录。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { k: "report", uc: "UC-10", kind: "report", icon: "📄",
      title: { en: "Disbursement summary", ar: "ملخص الصرف", zh: "支付摘要" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Summarize the audit, the blocked duplicate and the approved payment, with full audit trail.", ar: "تلخيص التدقيق والمكررة المحجوبة والدفعة المعتمدة، مع سجل تدقيق كامل.", zh: "总结审计、被拦截的重复项与已核准付款,并附完整审计轨迹。" },
      report: {
        title: { en: "Disbursement Summary — CL-77310", ar: "ملخص الصرف — CL-77310", zh: "支付摘要——CL-77310" },
        narrative: { en: "Claim CL-77310 for SAR 1.84M against contract CT-5520 was audited; a duplicate invoice (INV-55021) was detected and blocked, preventing a SAR 1.84M contract overrun. A single net payment order of SAR 1.84M was approved by the authorized officer and a corresponding SAP entry proposed. The full chain — invoice, milestone, approval — is preserved in the audit trail.", ar: "تم تدقيق المطالبة CL-77310 بقيمة 1.84 مليون ريال على العقد CT-5520؛ واكتُشفت فاتورة مكررة (INV-55021) وحُجبت، ما منع تجاوزاً للعقد بقيمة 1.84 مليون ريال. واعتمد المسؤول المخوّل أمر صرف صافٍ واحد بقيمة 1.84 مليون ريال مع اقتراح قيد ساب مقابل. وسلسلة الإثبات الكاملة — الفاتورة والمرحلة والاعتماد — محفوظة في سجل التدقيق.", zh: "针对合同 CT-5520 的 184 万里亚尔索赔 CL-77310 已完成审计;检测并拦截了一张重复发票(INV-55021),避免了 184 万里亚尔的合同超支。授权官员核准了单笔 184 万里亚尔净额付款单,并建议了相应的 SAP 分录。完整链条——发票、里程碑、审批——均保存在审计轨迹中。" },
        rows: [
          { l: { en: "Claim", ar: "المطالبة", zh: "索赔" }, v: "CL-77310" },
          { l: { en: "Duplicate blocked", ar: "المكررة المحجوبة", zh: "拦截的重复项" }, v: "INV-55021" },
          { l: { en: "Payment approved", ar: "الدفعة المعتمدة", zh: "已核准付款" }, v: "SAR 1.84M" }] },
      out: { en: "Summary ready for the Audit Department.", ar: "الملخص جاهز لإدارة التدقيق.", zh: "摘要已就绪,提交给审计部门。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};

const LINEAGE = [
  { en: "Report: Fiscal space SAR 4.82B", ar: "التقرير: الحيز المالي 4.82 مليار", zh: "报告:财政空间 48.2 亿", node: "report" },
  { en: "Analysis: ceiling − commitments − plan − reserve", ar: "التحليل: السقف − الالتزامات − الخطة − الحجز", zh: "分析:上限 − 承诺 − 计划 − 预留", node: "analysis" },
  { en: "Standardized: GL 5100 consolidated", ar: "موحّد: تجميع الحساب 5100", zh: "标准化:科目 5100 汇总", node: "fact" },
  { en: "Source: SAP/Asas · Etimad", ar: "المصدر: ساب/أساس · اعتماد", zh: "来源:SAP/Asas · Etimad", node: "data" },
];

/* =========================================================================
   UC-06 — Financial Performance Analysis data
   ========================================================================= */
const UC_KPIS = [
  { key: "kp_orig", value: "16,532", unit: "M", tag: "flat", sub: "kp_orig_s" },
  { key: "kp_rev", value: "3,420", unit: "M", tag: "flat", sub: "kp_rev_s" },
  { key: "kp_cur", value: "17,370", unit: "M", tag: "up", sub: "kp_cur_s" },
  { key: "kp_act", value: "11,117", unit: "M", tag: "down", sub: "kp_act_s" },
  { key: "kp_rem", value: "6,253", unit: "M", tag: "flat", sub: "kp_rem_s" },
  { key: "kp_rate", value: "64.0", unit: "%", tag: "down", sub: "kp_rate_s" },
  { key: "kp_chg", value: "838", unit: "M", tag: "flat", sub: "kp_chg_s" },
];
const UC_MAP = [
  { id: "nb", x: 168, y: 46, rate: 71, name: { en: "Northern Borders", ar: "الحدود الشمالية", zh: "北部边境" } },
  { id: "jouf", x: 188, y: 60, rate: 80, name: { en: "Al Jouf", ar: "الجوف", zh: "焦夫" } },
  { id: "tabuk", x: 120, y: 88, rate: 66, name: { en: "Tabuk", ar: "تبوك", zh: "塔布克" } },
  { id: "hail", x: 215, y: 100, rate: 73, name: { en: "Hail", ar: "حائل", zh: "哈伊勒" } },
  { id: "qassim", x: 250, y: 122, rate: 77, name: { en: "Qassim", ar: "القصيم", zh: "卡西姆" } },
  { id: "east", x: 300, y: 152, rate: 62, name: { en: "Eastern Province", ar: "الشرقية", zh: "东部省" } },
  { id: "mad", x: 155, y: 140, rate: 54, name: { en: "Madinah", ar: "المدينة", zh: "麦地那" } },
  { id: "ruh", x: 272, y: 158, rate: 78, name: { en: "Riyadh", ar: "الرياض", zh: "利雅得" } },
  { id: "mak", x: 138, y: 188, rate: 63, name: { en: "Makkah", ar: "مكة", zh: "麦加" } },
  { id: "baha", x: 168, y: 206, rate: 41, name: { en: "Al Baha", ar: "الباحة", zh: "巴哈" } },
  { id: "asir", x: 190, y: 226, rate: 88, name: { en: "Asir", ar: "عسير", zh: "阿西尔" } },
  { id: "najran", x: 240, y: 238, rate: 69, name: { en: "Najran", ar: "نجران", zh: "纳季兰" } },
  { id: "jazan", x: 182, y: 256, rate: 58, name: { en: "Jazan", ar: "جازان", zh: "吉赞" } },
];
const UC_SPEND = [
  { m: "Jan", budget: 3127, actual: 1890 }, { m: "Feb", budget: 3821, actual: 2446 },
  { m: "Mar", budget: 4516, actual: 3002 }, { m: "Apr", budget: 5906, actual: 3780 },
];
const UC_SERVICES = [
  { name: { en: "Developmental Housing", ar: "الإسكان التنموي", zh: "发展性住房" }, pct: 96.8, actual: 4047, budget: 4181 },
  { name: { en: "Real Estate Development", ar: "التطوير العقاري", zh: "房地产开发" }, pct: 95.3, actual: 3749, budget: 3934 },
  { name: { en: "Parks", ar: "الحدائق", zh: "公园" }, pct: 97.6, actual: 2480, budget: 2539 },
  { name: { en: "Roads", ar: "الطرق", zh: "道路" }, pct: 95.3, actual: 2349, budget: 2465 },
  { name: { en: "Financial Support", ar: "الدعم المالي", zh: "财政支持" }, pct: 95.1, actual: 2104, budget: 2212 },
];
const UC_VISION = [
  { name: "Housing Program 2.0", port: { en: "Housing & Urban", ar: "الإسكان والحضري", zh: "住房与城市" }, b: 4531, a: 4525, r: 7, rate: "99.9%" },
  { name: "Supported Housing Financial Sc.", port: { en: "Housing Support", ar: "دعم الإسكان", zh: "住房支持" }, b: 4470, a: 4470, r: 0, rate: "100.0%" },
  { name: "Flood Risk Mitigation - Phase 1", port: { en: "Water & Drainage", ar: "المياه والصرف", zh: "水与排水" }, b: 2943, a: 2901, r: 41, rate: "98.6%" },
  { name: "Urban Roads Development - Ph.2", port: { en: "Roads & Mobility", ar: "الطرق والتنقل", zh: "道路与交通" }, b: 1919, a: 1893, r: 26, rate: "98.6%" },
  { name: "Land Expropriation", port: { en: "Land & Assets", ar: "الأراضي والأصول", zh: "土地与资产" }, b: 1806, a: 1524, r: 282, rate: "84.4%" },
  { name: "Riyadh Road Rehabilitation", port: { en: "Roads & Mobility", ar: "الطرق والتنقل", zh: "道路与交通" }, b: 1701, a: 1672, r: 30, rate: "98.3%" },
];
const REVENUE_SOURCES = [
  { key: "wl", name: { en: "White Lands Fees", ar: "رسوم الأراضي البيضاء", zh: "白地费" }, net: 2323, collected: 1580, weight: 32.6, color: "#1B8354" },
  { key: "tb", name: { en: "Tobacco Revenue", ar: "إيرادات التبغ", zh: "烟草收入" }, net: 1045, collected: 857, weight: 14.9, color: "#2563eb" },
  { key: "ac", name: { en: "Accommodation Revenue", ar: "إيرادات الإيواء", zh: "住宿收入" }, net: 1588, collected: 1175, weight: 21.0, color: "#F8C630" },
  { key: "pf", name: { en: "Penalties & Fines", ar: "الغرامات والمخالفات", zh: "罚款与罚金" }, net: 1412, collected: 1076, weight: 18.4, color: "#6d5ae6" },
  { key: "om", name: { en: "Other Municipal Revenues", ar: "إيرادات بلدية أخرى", zh: "其他市政收入" }, net: 927, collected: 661, weight: 13.0, color: "#e32700" },
];
const AR_LEGEND = [{ k: "rp_unpaid", v: "1260 M", c: "#e32700" }, { k: "rp_exec", v: "790 M", c: "#e29700" }, { k: "rp_done", v: "540 M", c: "#1B8354" }];
const AR_BUCKETS = ["buck_current", "1M", "2M", "3M", "4M", "5M", "6M+"];
const AR_MATRIX = [
  { m: "Nov 2025", v: [0.0, 0.2, 0.5, 1.0, 2.4, 5.2, 10.4] }, { m: "Dec 2025", v: [0.0, 0.3, 0.8, 1.5, 3.6, 5.6, 7.6] },
  { m: "Jan 2026", v: [0.2, 0.7, 1.6, 2.9, 4.9, 5.1, 4.9] }, { m: "Feb 2026", v: [0.5, 1.4, 2.9, 4.1, 4.9, 3.6, 2.1] },
  { m: "Mar 2026", v: [1.8, 3.2, 4.3, 4.0, 3.2, 1.5, 0.8] }, { m: "Apr 2026", v: [5.0, 4.5, 3.6, 2.5, 1.7, 0.6, 0.4] },
];
const REGIONAL_ACHIEVE = [
  { name: { en: "Riyadh Amana", ar: "أمانة الرياض", zh: "利雅得阿玛纳" }, pct: 79.4, target: 82.0 },
  { name: { en: "Eastern Province Amana", ar: "أمانة المنطقة الشرقية", zh: "东部省阿玛纳" }, pct: 90.2, target: 86.0 },
  { name: { en: "Al Madinah Amana", ar: "أمانة المدينة المنورة", zh: "麦地那阿玛纳" }, pct: 63.5, target: 75.0 },
  { name: { en: "Makkah Amana", ar: "أمانة مكة المكرمة", zh: "麦加阿玛纳" }, pct: 81.2, target: 80.0 },
  { name: { en: "Asir Amana", ar: "أمانة عسير", zh: "阿西尔阿玛纳" }, pct: 88.0, target: 84.0 },
];
function arHeat(v) { if (v <= 0.3) return ["#f7faf8", "#5c6b63"]; if (v <= 1) return ["#fef7e0", "#6b5210"]; if (v <= 2) return ["#fdeab8", "#6b5210"]; if (v <= 3) return ["#fcd987", "#6b4e10"]; if (v <= 4) return ["#f7b65d", "#5a3a08"]; if (v <= 5) return ["#ef8f4a", "#fff"]; if (v <= 6) return ["#e3683f", "#fff"]; if (v <= 8) return ["#d24a36", "#fff"]; return ["#b42318", "#fff"]; }
/* =========================================================================
   G-06 — Revenues & Assets storyline (function-labeled; no UC codes shown)
   ========================================================================= */
const REV_TOTALS = (function () { var b = 0, c = 0; REVENUE_SOURCES.forEach(function (s) { b += s.net; c += s.collected; }); return { billed: b, collected: c, rate: +(c / b * 100).toFixed(1), excl: 212 }; })();
function configuredRevenueSources() {
  return REVENUE_SOURCES.map((source) => ({
    ...source,
    net: getChartNumber("revassets", "revenue_sources", source.key, "net_invoiced", source.net),
    collected: getChartNumber("revassets", "revenue_sources", source.key, "collected", source.collected),
    weight: getChartNumber("revassets", "revenue_sources", source.key, "weight", source.weight),
  }));
}
function configuredRevenueTotals() {
  const sources = configuredRevenueSources();
  const billed = sources.reduce((sum, source) => sum + source.net, 0);
  const collected = sources.reduce((sum, source) => sum + source.collected, 0);
  return { billed, collected, rate: billed ? +(collected / billed * 100).toFixed(1) : 0, excl: REV_TOTALS.excl };
}
const REV_DEVIATIONS = [
  { a: { en: "Asir Amana · collection gap", ar: "أمانة عسير · فجوة تحصيل", zh: "阿西尔阿玛纳 · 征收缺口" }, v: "14%", f: "red" },
  { a: { en: "Penalties feed delay", ar: "تأخر تغذية الغرامات", zh: "罚款数据延迟" }, v: "> SLA", f: "amber" },
  { a: { en: "Other revenues", ar: "إيرادات أخرى", zh: "其他收入" }, v: "on plan", f: "info" },
];
const ASSET_REGISTER = [
  { cls: { en: "Land", ar: "الأراضي", zh: "土地" }, value: 6200, cap: 0, life: "—", ret: "—", status: "active" },
  { cls: { en: "Buildings", ar: "المباني", zh: "建筑" }, value: 3450, cap: 620, life: 40, ret: "4.2%", status: "active" },
  { cls: { en: "Roads infrastructure", ar: "البنية التحتية للطرق", zh: "道路基础设施" }, value: 4180, cap: 540, life: 25, ret: "—", status: "maint" },
  { cls: { en: "Stormwater networks", ar: "شبكات تصريف الأمطار", zh: "雨水管网" }, value: 1920, cap: 310, life: 30, ret: "—", status: "active" },
  { cls: { en: "Parks", ar: "الحدائق", zh: "公园" }, value: 1240, cap: 180, life: 20, ret: "3.1%", status: "active" },
  { cls: { en: "Equipment & vehicles", ar: "المعدات والمركبات", zh: "设备与车辆" }, value: 760, cap: 270, life: 8, ret: "—", status: "impair" },
];
const ASSET_CAP = { aucOpen: 3.10, capitalized: 1.92, aucClose: 1.18, impair: 3, maintDue: 12 };
const ASSIGNMENT_ORDERS = [
  { id: "AO-2207", proj: { en: "White Lands servicing", ar: "تطوير الأراضي البيضاء", zh: "白地配套" }, fund: { en: "Real Estate Dev Fund", ar: "صندوق التطوير العقاري", zh: "房地产开发基金" }, alloc: 320, spent: 235, unit: "SAR 142/m²", flag: "idle" },
  { id: "AO-2211", proj: { en: "Housing Program 2.0 plots", ar: "أراضي برنامج الإسكان 2.0", zh: "住房计划2.0地块" }, fund: { en: "Real Estate Dev Fund", ar: "صندوق التطوير العقاري", zh: "房地产开发基金" }, alloc: 540, spent: 533, unit: "SAR 310k/unit", flag: "ok" },
  { id: "AO-1185", proj: { en: "Industrial land preparation", ar: "تهيئة الأراضي الصناعية", zh: "工业用地整备" }, fund: { en: "Industrial Dev Fund", ar: "صندوق التنمية الصناعية", zh: "工业发展基金" }, alloc: 410, spent: 388, unit: "SAR 96/m²", flag: "ok" },
  { id: "AO-3302", proj: { en: "Park land compensation", ar: "تعويض أراضي الحدائق", zh: "公园用地补偿" }, fund: { en: "General", ar: "عام", zh: "一般" }, alloc: 180, spent: 96, unit: "—", flag: "pending" },
];
const STORY_REVENUE_ASSETS = {
  key: "revassets",
  nodes: [
    { kind: "data", icon: "⛁",
      title: { en: "Consolidate revenue & asset data", ar: "تجميع بيانات الإيرادات والأصول", zh: "汇聚收入与资产数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull billing & collection (Tahseel, Makeen, Efaa, Sanad), revenue exclusions, and asset records (SAP, Esnad, Balady); standardize and validate.", ar: "سحب الفوترة والتحصيل (تحصيل، مكين، إيفاء، سند)، والاستبعادات، وسجلات الأصول (ساب، إسناد، بلدي)؛ ثم التوحيد والتحقق.", zh: "拉取开票与征收(Tahseel、Makeen、Efaa、Sanad)、收入排除项及资产记录(SAP、Esnad、Balady);标准化并校验。" },
      out: { en: "Unified revenue & asset dataset — 6 Amanas, FY2026.", ar: "مجموعة بيانات موحّدة للإيرادات والأصول — 6 أمانات، 2026.", zh: "统一的收入与资产数据集——6 个阿玛纳,2026 财年。" },
      metric: { en: "6 Amanas", ar: "6 أمانات", zh: "6 个阿玛纳" } },
    { kind: "revenue", icon: "💰",
      title: { en: "Revenue & collection analysis", ar: "تحليل الإيرادات والتحصيل", zh: "收入与征收分析" },
      actor: { en: "Revenue Agent", ar: "وكيل الإيرادات", zh: "收入智能体" },
      desc: { en: "Consolidate billing → collection → exclusions across sources; compute net billed, collected and collection rate.", ar: "تجميع الفوترة ← التحصيل ← الاستبعادات عبر المصادر؛ وحساب صافي الفوترة والمحصّل ونسبة التحصيل.", zh: "跨来源汇总 开票→征收→排除;计算净开票、已征收与征收率。" },
      out: { en: "Net billed SAR 7.30B, collected SAR 5.35B (73.3%); SAR 212M exclusions flagged.", ar: "صافي الفوترة 7.30 مليار ريال، المحصّل 5.35 مليار (73.3٪)؛ ورصد 212 مليون استبعادات.", zh: "净开票 73.0 亿里亚尔,已征收 53.5 亿(73.3%);标记排除项 2.12 亿。" },
      metric: { en: "73.3% collected", ar: "73.3٪ تحصيل", zh: "征收率 73.3%" } },
    { kind: "perfdev", icon: "◉",
      title: { en: "Performance & deviation scan", ar: "فحص الأداء والانحراف", zh: "绩效与偏差扫描" },
      actor: { en: "Performance + Deviation Agents", ar: "وكيلا الأداء والانحراف", zh: "绩效 + 偏差智能体" },
      desc: { en: "Link revenue indicators to performance and scan for collection-gap and abnormal-revenue deviations.", ar: "ربط مؤشرات الإيراد بالأداء وفحص فجوات التحصيل والانحرافات غير الاعتيادية.", zh: "将收入指标关联绩效,并扫描征收缺口与异常收入偏差。" },
      out: { en: "1 high-risk collection gap (Asir 14%); revenue performance otherwise on plan.", ar: "فجوة تحصيل عالية الخطورة (عسير 14٪)؛ وبقية الأداء ضمن الخطة.", zh: "1 项高风险征收缺口(阿西尔 14%);其余收入绩效符合计划。" },
      metric: { en: "1 alert", ar: "تنبيه واحد", zh: "1 个告警" } },
    { kind: "assets", icon: "🏛",
      title: { en: "Asset classification, capitalization & returns", ar: "تصنيف الأصول والرسملة والعوائد", zh: "资产分类、资本化与回报" },
      actor: { en: "Asset Agent", ar: "وكيل الأصول", zh: "资产智能体" },
      desc: { en: "Classify assets by policy & useful life, capitalize completed assets-under-construction, and measure returns, maintenance and impairment.", ar: "تصنيف الأصول وفق السياسة والعمر الإنتاجي، ورسملة الأصول تحت الإنشاء المكتملة، وقياس العوائد والصيانة وانخفاض القيمة.", zh: "按政策与使用年限分类资产,资本化已完工的在建资产,并衡量回报、维护与减值。" },
      out: { en: "SAR 1.92B capitalized from AUC; 3 items flagged for impairment; 12 due maintenance.", ar: "رسملة 1.92 مليار ريال من أصول تحت الإنشاء؛ ورصد 3 أصول لانخفاض القيمة؛ و12 مستحقة للصيانة.", zh: "从在建资产资本化 19.2 亿里亚尔;3 项标记减值;12 项待维护。" },
      metric: { en: "SAR 1.92B capitalized", ar: "رسملة 1.92 مليار", zh: "资本化 19.2 亿" } },
    { kind: "cost", icon: "🧮",
      title: { en: "Cost, assignment orders & funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与基金" },
      actor: { en: "Cost + Compliance Agents", ar: "وكيلا التكاليف والامتثال", zh: "成本 + 合规智能体" },
      desc: { en: "Compute unit cost per assignment order, link orders to development funds, verify IPSAS capitalization/exclusion compliance, and surface idle fund surpluses.", ar: "حساب تكلفة الوحدة لكل أمر إسناد، وربط الأوامر بصناديق التطوير، والتحقق من رسملة IPSAS والاستبعاد، وإبراز فوائض الصناديق الخاملة.", zh: "计算每个派工单的单位成本,将派工单关联开发基金,核验 IPSAS 资本化/排除合规,并暴露闲置基金结余。" },
      out: { en: "Idle surplus SAR 85M on AO-2207 (Real Estate Dev Fund, 120 days no activity); compliance passed (1 note).", ar: "فائض خامل 85 مليون ريال على AO-2207 (صندوق التطوير العقاري، 120 يوماً دون حركة)؛ والامتثال ناجح (ملاحظة واحدة).", zh: "AO-2207 闲置结余 8,500 万里亚尔(房地产开发基金,120 天无活动);合规通过(1 条提示)。" },
      metric: { en: "SAR 85M idle", ar: "85 مليون خامل", zh: "8,500 万闲置" } },
    { kind: "review", icon: "✦",
      title: { en: "AI recommendation — surplus release & capitalization", ar: "توصية — الإفراج عن الفائض والرسملة", zh: "AI 建议——结余释放与资本化" },
      actor: { en: "Reallocation Agent → Human reviewer", ar: "وكيل إعادة التوزيع ← المراجع البشري", zh: "调拨智能体 → 人工复核" },
      desc: { en: "The agent proposes releasing the idle fund surplus and capitalizing completed assets — both within fund rules and accounting policy.", ar: "يقترح الوكيل الإفراج عن الفائض الخامل ورسملة الأصول المكتملة — ضمن قواعد الصندوق والسياسة المحاسبية.", zh: "智能体建议释放闲置基金结余并资本化已完工资产——均在基金规则与会计政策之内。" },
      review: {
        headline: { en: "Release SAR 85M idle surplus from assignment order AO-2207 to the central liquidity pool, and capitalize SAR 1.92B of completed assets-under-construction into in-service assets.", ar: "الإفراج عن فائض خامل 85 مليون ريال من أمر الإسناد AO-2207 إلى مجمع السيولة المركزي، ورسملة 1.92 مليار ريال من الأصول تحت الإنشاء المكتملة إلى أصول في الخدمة.", zh: "将派工单 AO-2207 的 8,500 万里亚尔闲置结余释放至中央流动性池,并将 19.2 亿里亚尔已完工在建资产资本化为在用资产。" },
        conf: 86,
        why: { en: "AO-2207 (Real Estate Development Fund) is allocated SAR 320M and has spent SAR 235M (73%), with no disbursement for 120 days and its milestone delivered — leaving SAR 85M idle. The completed assets-under-construction meet the approved useful-life and capitalization policy. Both actions stay within fund rules and accounting standards.", ar: "أمر الإسناد AO-2207 (صندوق التطوير العقاري) مخصّص له 320 مليون ريال وصُرف منه 235 مليون (73٪)، دون صرف منذ 120 يوماً ومع إنجاز مرحلته — ليتبقى 85 مليون خاملة. وتستوفي الأصول تحت الإنشاء المكتملة سياسة العمر الإنتاجي والرسملة المعتمدة. ويبقى الإجراءان ضمن قواعد الصندوق والمعايير المحاسبية.", zh: "AO-2207(房地产开发基金)分配 3.2 亿里亚尔,已花 2.35 亿(73%),120 天无支付且里程碑已交付——剩余 8,500 万闲置。已完工在建资产符合核定的使用年限与资本化政策。两项操作均在基金规则与会计准则之内。" },
        srcs: ["SAP · AUC ledger", "Esnad · AO-2207", "Real Estate Dev Fund", "Policy AP-17"],
        approveLog: { en: "Approved surplus release SAR 85M (AO-2207) and capitalization of SAR 1.92B AUC into service", ar: "اعتماد الإفراج عن فائض 85 مليون ريال (AO-2207) ورسملة 1.92 مليار من الأصول تحت الإنشاء", zh: "已批准结余释放 8,500 万里亚尔(AO-2207)及资本化 19.2 亿在建资产" } },
      out: { en: "Surplus release and capitalization reclass recorded after approval.", ar: "تسجيل الإفراج عن الفائض وإعادة تصنيف الرسملة بعد الاعتماد.", zh: "经批准后已记录结余释放与资本化重分类。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { kind: "report", icon: "📄",
      title: { en: "Revenue & assets report + audit", ar: "تقرير الإيرادات والأصول + التدقيق", zh: "收入与资产报告 + 审计" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate the revenue & assets narrative report and expose smart query, audit log and permission scope for the directorate.", ar: "إنشاء التقرير السردي للإيرادات والأصول وإتاحة الاستعلام الذكي وسجل التدقيق ونطاق الصلاحية للإدارة.", zh: "生成收入与资产叙述性报告,并向该总局提供智能查询、审计日志与权限范围。" },
      report: {
        title: { en: "Revenue & Assets — FY2026 Q2", ar: "الإيرادات والأصول — الربع الثاني 2026", zh: "收入与资产 — 2026 二季度" },
        narrative: { en: "Cumulative net billing reached SAR 7.30B with SAR 5.35B collected (73.3%); the widest collection gap is Asir Amana at 14%, which raised an early-warning. Assets-under-construction of SAR 1.92B were capitalized into service under the approved useful-life policy, with 3 equipment items flagged for impairment and road infrastructure maintenance due. An idle fund surplus of SAR 85M (assignment order AO-2207, Real Estate Development Fund, 120 days no activity) was released to the central liquidity pool after approval. All figures are traceable from Tahseel/Makeen collection records and SAP/Esnad asset registers.", ar: "بلغ صافي الفوترة التراكمي 7.30 مليار ريال مع تحصيل 5.35 مليار (73.3٪)؛ وأكبر فجوة تحصيل في أمانة عسير عند 14٪، ما أطلق تنبيهاً مبكراً. ورُسملت أصول تحت الإنشاء بقيمة 1.92 مليار ريال إلى الخدمة وفق سياسة العمر الإنتاجي المعتمدة، مع رصد 3 معدات لانخفاض القيمة واستحقاق صيانة البنية التحتية للطرق. وأُفرج عن فائض خامل 85 مليون ريال (أمر الإسناد AO-2207، صندوق التطوير العقاري، 120 يوماً دون حركة) إلى مجمع السيولة المركزي بعد الاعتماد. وجميع الأرقام قابلة للتتبع من سجلات تحصيل/مكين وسجلات أصول ساب/إسناد.", zh: "累计净开票达 73.0 亿里亚尔,已征收 53.5 亿(73.3%);最大征收缺口在阿西尔阿玛纳,达 14%,已触发预警。19.2 亿里亚尔在建资产按核定使用年限政策资本化入用,其中 3 项设备标记减值、道路基础设施待维护。经批准后,8,500 万里亚尔闲置基金结余(派工单 AO-2207,房地产开发基金,120 天无活动)已释放至中央流动性池。所有数字均可从 Tahseel/Makeen 征收记录与 SAP/Esnad 资产台账追溯。" },
        rows: [
          { l: { en: "Net billed", ar: "صافي الفوترة", zh: "净开票" }, v: "SAR 7.30B" },
          { l: { en: "Collected (73.3%)", ar: "المحصّل (73.3٪)", zh: "已征收(73.3%)" }, v: "SAR 5.35B" },
          { l: { en: "Capitalized", ar: "المرسمَل", zh: "已资本化" }, v: "SAR 1.92B" },
          { l: { en: "Surplus released", ar: "الفائض المُفرَج", zh: "释放结余" }, v: "SAR 85M" }] },
      queryaudit: true,
      out: { en: "Report ready for the Directorate of Revenues and Assets.", ar: "التقرير جاهز للإدارة العامة للإيرادات والأصول.", zh: "报告已就绪,提交给收入与资产总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};
/* =========================================================================
   G-02 (planning) & G-05 (reporting) storylines — adds forecasting (UC-04),
   scenario simulation (UC-05) and financial closing / reconciliation (UC-09).
   ========================================================================= */
const FORECAST_OBLIG = [
  { m: "M1", oblig: 980, space: 4820 }, { m: "M2", oblig: 1120, space: 4710 }, { m: "M3", oblig: 1290, space: 4560 },
  { m: "M4", oblig: 1480, space: 4380 }, { m: "M5", oblig: 1660, space: 4170 }, { m: "M6", oblig: 1880, space: 3920 },
];
const SCENARIOS = [
  { key: "opt", space: 5.40, oblig: 1.10, cover: "strong" },
  { key: "base", space: 4.82, oblig: 1.30, cover: "adequate", rec: true },
  { key: "pess", space: 4.10, oblig: 1.55, cover: "watch" },
];
const RECON_ROWS = [
  { ent: { en: "SAP GL", ar: "أستاذ ساب", zh: "SAP 总账" }, book: 12840, sys: 12840, diff: 0, st: "matched" },
  { ent: { en: "Etimad commitments", ar: "التزامات اعتماد", zh: "Etimad 承诺" }, book: 6210, sys: 6188, diff: 22, st: "ureview" },
  { ent: { en: "Esnad assignment", ar: "إسناد", zh: "Esnad 派工" }, book: 1920, sys: 1905, diff: 15, st: "adjust" },
  { ent: { en: "Tahseel revenue", ar: "تحصيل", zh: "Tahseel 收入" }, book: 5349, sys: 5361, diff: -12, st: "adjust" },
];
const STORY_PLANNING = {
  key: "planning",
  nodes: [
    { kind: "data", uc: "UC-01", icon: "⛁",
      title: { en: "Consolidate planning data", ar: "تجميع بيانات التخطيط", zh: "汇聚规划数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull approved ceilings, commitments, payment plans and historical actuals from SAP, Etimad and GRP; standardize and validate.", ar: "سحب السقوف والالتزامات وخطط الدفع والفعلي التاريخي من ساب واعتماد وGRP؛ ثم التوحيد والتحقق.", zh: "从 SAP、Etimad、GRP 拉取核定上限、承诺、付款计划与历史实绩;标准化并校验。" },
      out: { en: "Validated planning dataset — 6 Amanas, FY2026.", ar: "مجموعة بيانات تخطيط متحقق منها — 6 أمانات، 2026.", zh: "已校验的规划数据集——6 个阿玛纳,2026 财年。" },
      metric: { en: "6 Amanas", ar: "6 أمانات", zh: "6 个阿玛纳" } },
    { kind: "fiscal", uc: "UC-07", icon: "∑",
      title: { en: "Budget planning & fiscal space", ar: "تخطيط الميزانية والحيز المالي", zh: "预算规划与财政空间" },
      actor: { en: "Budget Planning Agent", ar: "وكيل تخطيط الميزانية", zh: "预算规划智能体" },
      desc: { en: "Allocate ceilings and compute available fiscal space = ceiling − commitments − payment plan − reservations.", ar: "توزيع السقوف وحساب الحيز المالي = السقف − الالتزامات − خطة الدفع − الحجوزات.", zh: "分配上限并计算可用财政空间 = 上限 − 承诺 − 付款计划 − 预留。" },
      fiscal: { ceiling: 6.40, commit: 0.98, plan: 0.42, reserve: 0.18, space: 4.82 },
      out: { en: "Available fiscal space SAR 4.82B established as the planning baseline.", ar: "تحديد الحيز المالي المتاح 4.82 مليار ريال كأساس للتخطيط.", zh: "确立可用财政空间 48.2 亿里亚尔作为规划基线。" },
      metric: { en: "SAR 4.82B", ar: "4.82 مليار", zh: "48.2 亿" } },
    { kind: "forecast", uc: "UC-04", icon: "📈",
      title: { en: "Forecast future obligations", ar: "التنبؤ بالالتزامات المستقبلية", zh: "预测未来义务" },
      actor: { en: "Forecasting Agent", ar: "وكيل التنبؤ", zh: "预测智能体" },
      desc: { en: "Produce a rolling forecast of obligations and needs against available fiscal space over the next 6 periods.", ar: "إنتاج تنبؤ متجدد للالتزامات والاحتياجات مقابل الحيز المالي المتاح لـ6 فترات قادمة.", zh: "对未来 6 期的义务与需求相对可用财政空间做滚动预测。" },
      out: { en: "Obligations forecast to rise to SAR 1.88B by M6 vs fiscal space declining to SAR 3.92B (MAPE ≤ 12%).", ar: "يُتوقع ارتفاع الالتزامات إلى 1.88 مليار ريال في الشهر 6 مقابل انخفاض الحيز إلى 3.92 مليار (MAPE ≤ 12٪).", zh: "预计义务到 M6 升至 18.8 亿里亚尔,财政空间降至 39.2 亿(MAPE ≤ 12%)。" },
      metric: { en: "MAPE ≤ 12%", ar: "MAPE ≤ 12٪", zh: "MAPE ≤ 12%" } },
    { kind: "scenario", uc: "UC-05", icon: "⚖",
      title: { en: "Scenario simulation", ar: "محاكاة السيناريوهات", zh: "情景模拟" },
      actor: { en: "Scenario Agent", ar: "وكيل السيناريوهات", zh: "情景智能体" },
      desc: { en: "Simulate optimistic / base / pessimistic scenarios for revenue and obligations and rank fiscal-space coverage.", ar: "محاكاة سيناريوهات متفائل / أساسي / متشائم للإيرادات والالتزامات وترتيب تغطية الحيز المالي.", zh: "对收入与义务模拟乐观/基准/悲观情景,并对财政空间覆盖排序。" },
      out: { en: "Base scenario keeps coverage adequate (space 4.82B vs obligations 1.30B); pessimistic drops to watch.", ar: "يبقي السيناريو الأساسي التغطية كافية (الحيز 4.82 مقابل التزامات 1.30)؛ والمتشائم ينخفض للمراقبة.", zh: "基准情景覆盖适当(空间 4.82 对义务 1.30);悲观降至关注。" },
      metric: { en: "3 scenarios", ar: "3 سيناريوهات", zh: "3 个情景" } },
    { kind: "agent", uc: "UC-06", icon: "◧",
      title: { en: "Performance & variance analysis", ar: "تحليل الأداء والانحراف", zh: "绩效与差异分析" },
      actor: { en: "Performance Agent", ar: "وكيل الأداء", zh: "绩效智能体" },
      desc: { en: "Compare execution to plan and surface the largest variances by area.", ar: "مقارنة التنفيذ بالخطة وإبراز أكبر الانحرافات حسب المجال.", zh: "将执行与计划比对,按领域突出最大差异。" },
      table: { cols: { en: ["Area", "Variance", "Status"], ar: ["المجال", "الانحراف", "الحالة"], zh: ["领域", "差异", "状态"] },
        rows: [{ a: { en: "Operating budget", ar: "الميزانية التشغيلية", zh: "运营预算" }, v: "+2.1%", f: "info" },
               { a: { en: "Capital projects", ar: "المشاريع الرأسمالية", zh: "资本项目" }, v: "-4.6%", f: "amber" },
               { a: { en: "Obligations vs plan", ar: "الالتزامات مقابل الخطة", zh: "义务对比计划" }, v: "+5.0%", f: "red" }] },
      out: { en: "Capital-project execution lags plan by 4.6%; obligations running 5% above plan.", ar: "تنفيذ المشاريع الرأسمالية متأخر 4.6٪؛ والالتزامات أعلى من الخطة بـ5٪.", zh: "资本项目执行落后计划 4.6%;义务高于计划 5%。" },
      metric: { en: "1 high variance", ar: "انحراف مرتفع", zh: "1 项高差异" } },
    { kind: "review", uc: "UC-07", icon: "✦",
      title: { en: "AI recommendation — adopt scenario & reserve", ar: "توصية — اعتماد السيناريو والاحتياطي", zh: "AI 建议——采纳情景与预留" },
      actor: { en: "Planning Agent → Human reviewer", ar: "وكيل التخطيط ← المراجع البشري", zh: "规划智能体 → 人工复核" },
      desc: { en: "The agent recommends adopting the base scenario and lifting the Q3 obligation reserve to preserve coverage.", ar: "يوصي الوكيل باعتماد السيناريو الأساسي ورفع احتياطي التزامات الربع الثالث للحفاظ على التغطية.", zh: "智能体建议采纳基准情景并上调三季度义务预留以维持覆盖。" },
      review: {
        headline: { en: "Adopt the base scenario and raise the Q3 obligation reserve by SAR 150M to keep fiscal-space coverage above 3.5x.", ar: "اعتماد السيناريو الأساسي ورفع احتياطي التزامات الربع الثالث بمقدار 150 مليون ريال للإبقاء على تغطية الحيز فوق 3.5x.", zh: "采纳基准情景,并将三季度义务预留上调 1.5 亿里亚尔,使财政空间覆盖保持在 3.5 倍以上。" },
        conf: 84,
        why: { en: "Across the three scenarios the base case keeps available fiscal space at SAR 4.82B against SAR 1.30B of new obligations (adequate coverage), while the pessimistic case erodes coverage to watch level. A SAR 150M reserve uplift absorbs the forecast obligation growth (MAPE ≤ 12%) without breaching approved ceilings.", ar: "عبر السيناريوهات الثلاثة يبقي السيناريو الأساسي الحيز عند 4.82 مليار مقابل 1.30 مليار التزامات جديدة (تغطية كافية)، بينما يقلّص المتشائم التغطية لمستوى المراقبة. ويستوعب رفع الاحتياطي 150 مليون نموّ الالتزامات المتوقع (MAPE ≤ 12٪) دون تجاوز السقوف.", zh: "三种情景中,基准情景将可用财政空间维持在 48.2 亿里亚尔、对应 13.0 亿新增义务(覆盖适当),而悲观情景将覆盖削弱至关注级。上调 1.5 亿预留可吸收预测的义务增长(MAPE ≤ 12%),且不突破核定上限。" },
        srcs: ["Forecast engine", "Scenario model", "Ceiling rule CR-03"],
        approveLog: { en: "Approved base scenario; Q3 obligation reserve raised by SAR 150M", ar: "اعتماد السيناريو الأساسي؛ ورفع احتياطي التزامات الربع الثالث بمقدار 150 مليون ريال", zh: "已批准基准情景;三季度义务预留上调 1.5 亿里亚尔" } },
      out: { en: "Scenario adopted and reserve adjustment recorded after approval.", ar: "اعتماد السيناريو وتسجيل تعديل الاحتياطي بعد الموافقة.", zh: "经批准后已记录采纳情景与预留调整。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { kind: "report", uc: "UC-10", icon: "📄",
      title: { en: "Planning & performance report", ar: "تقرير التخطيط والأداء", zh: "规划与绩效报告" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate the planning & performance narrative with the forecast, scenarios and approved decisions.", ar: "إنشاء تقرير التخطيط والأداء السردي مع التنبؤ والسيناريوهات والقرارات المعتمدة.", zh: "生成包含预测、情景与已批准决策的规划与绩效叙述报告。" },
      report: {
        title: { en: "Planning & Performance — FY2026 Q2", ar: "التخطيط والأداء — الربع الثاني 2026", zh: "规划与绩效 — 2026 二季度" },
        narrative: { en: "Rolling forecast projects obligations rising to SAR 1.88B by M6 against available fiscal space declining to SAR 3.92B — coverage stays adequate (MAPE ≤ 12%). Across optimistic/base/pessimistic scenarios the base case was adopted, with a SAR 150M Q3 obligation-reserve uplift approved to preserve coverage. Capital-project execution lags plan by 4.6% and is flagged for follow-up. All figures trace to consolidated budget and commitment records.", ar: "يتوقع التنبؤ المتجدد ارتفاع الالتزامات إلى 1.88 مليار ريال في الشهر 6 مقابل انخفاض الحيز إلى 3.92 مليار — وتبقى التغطية كافية (MAPE ≤ 12٪). وعبر السيناريوهات اعتُمد الأساسي مع رفع احتياطي التزامات الربع الثالث 150 مليون للحفاظ على التغطية. وتنفيذ المشاريع الرأسمالية متأخر 4.6٪ وقد رُصد للمتابعة. وجميع الأرقام قابلة للتتبع إلى سجلات الميزانية والالتزامات.", zh: "滚动预测显示义务到 M6 升至 18.8 亿里亚尔,可用财政空间降至 39.2 亿——覆盖保持适当(MAPE ≤ 12%)。在乐观/基准/悲观情景中采纳基准情景,并批准上调三季度义务预留 1.5 亿以维持覆盖。资本项目执行落后计划 4.6%,已标记跟进。所有数字均可追溯至合并预算与承诺记录。" },
        rows: [
          { l: { en: "Forecast obligations (M6)", ar: "الالتزامات المتوقعة (الشهر 6)", zh: "预测义务(M6)" }, v: "SAR 1.88B" },
          { l: { en: "Adopted scenario", ar: "السيناريو المعتمد", zh: "采纳情景" }, v: { en: "Base", ar: "أساسي", zh: "基准" } },
          { l: { en: "Reserve uplift", ar: "رفع الاحتياطي", zh: "预留上调" }, v: "SAR 150M" }] },
      out: { en: "Report ready for the Directorate of Planning and Financial Performance.", ar: "التقرير جاهز للإدارة العامة للتخطيط والأداء المالي.", zh: "报告已就绪,提交给规划与财务绩效总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};
const STORY_REPORTING = {
  key: "reporting",
  nodes: [
    { kind: "data", uc: "UC-01", icon: "⛁",
      title: { en: "Consolidate period data", ar: "تجميع بيانات الفترة", zh: "汇聚期间数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull period balances, commitments, revenue and asset records from SAP, Etimad, Esnad and Tahseel; standardize and validate.", ar: "سحب أرصدة الفترة والالتزامات والإيرادات وسجلات الأصول من ساب واعتماد وإسناد وتحصيل؛ ثم التوحيد والتحقق.", zh: "从 SAP、Etimad、Esnad、Tahseel 拉取期间余额、承诺、收入与资产记录;标准化并校验。" },
      out: { en: "Validated period dataset ready for closing.", ar: "مجموعة بيانات الفترة جاهزة للإقفال.", zh: "已校验的期间数据集,可供关账。" },
      metric: { en: "FY2026 · Q2", ar: "2026 · ربع 2", zh: "2026 · 二季度" } },
    { kind: "closing", uc: "UC-09", icon: "⇄",
      title: { en: "Financial closing & reconciliation", ar: "الإقفال المالي والتسوية", zh: "财务关账与对账" },
      actor: { en: "Reconciliation Agent", ar: "وكيل التسوية", zh: "对账智能体" },
      desc: { en: "Run pre-close validation, reconcile balances between entities and systems, and detect differences for adjustment.", ar: "تشغيل التحقق قبل الإقفال، وتسوية الأرصدة بين الجهات والأنظمة، وكشف الفروقات للتسوية.", zh: "执行关账前校验,在主体与系统间对账,并检出待调整差异。" },
      out: { en: "Pre-close validation passed; 2 reconciliation differences detected (net SAR 25M) for adjustment.", ar: "اجتياز التحقق قبل الإقفال؛ ورصد فرقين للتسوية (صافي 25 مليون ريال).", zh: "关账前校验通过;检出 2 项对账差异(净 2,500 万里亚尔)待调整。" },
      metric: { en: "2 differences", ar: "فرقان", zh: "2 项差异" } },
    { kind: "agent", uc: "UC-11", icon: "🛡",
      title: { en: "Compliance & accounting memos", ar: "الامتثال والمذكرات المحاسبية", zh: "合规与会计备忘" },
      actor: { en: "Compliance Agent", ar: "وكيل الامتثال", zh: "合规智能体" },
      desc: { en: "Verify IPSAS treatment, working papers and accounting memos for the closing.", ar: "التحقق من معالجة IPSAS وأوراق العمل والمذكرات المحاسبية للإقفال.", zh: "为关账核验 IPSAS 处理、工作底稿与会计备忘。" },
      table: { cols: { en: ["Check", "Result"], ar: ["الفحص", "النتيجة"], zh: ["检查", "结果"] },
        rows: [{ a: { en: "IPSAS accrual treatment", ar: "معالجة الاستحقاق IPSAS", zh: "IPSAS 权责发生制处理" }, v: { en: "Pass", ar: "مجتاز", zh: "通过" }, f: "info" },
               { a: { en: "Capitalization policy", ar: "سياسة الرسملة", zh: "资本化政策" }, v: { en: "Pass", ar: "مجتاز", zh: "通过" }, f: "info" },
               { a: { en: "Accounting memo", ar: "مذكرة محاسبية", zh: "会计备忘" }, v: { en: "1 note attached", ar: "ملاحظة مرفقة", zh: "已附 1 条说明" }, f: "amber" }] },
      out: { en: "Compliant — working papers and 1 accounting memo attached.", ar: "مطابق — أوراق العمل ومذكرة محاسبية مرفقة.", zh: "合规——已附工作底稿与 1 条会计备忘。" },
      metric: { en: "Compliant", ar: "مطابق", zh: "合规" } },
    { kind: "assets", uc: "UC-12", icon: "🏛",
      title: { en: "Costs & assets close", ar: "إقفال التكاليف والأصول", zh: "成本与资产结账" },
      actor: { en: "Cost + Asset Agents", ar: "وكيلا التكاليف والأصول", zh: "成本 + 资产智能体" },
      desc: { en: "Finalize cost allocation and asset capitalization/impairment for the closing period.", ar: "إنهاء توزيع التكاليف ورسملة/انخفاض قيمة الأصول لفترة الإقفال.", zh: "为关账期间最终确定成本分摊与资产资本化/减值。" },
      out: { en: "SAR 1.92B capitalized; 3 impairments and 12 maintenance items carried into the statements.", ar: "رسملة 1.92 مليار ريال؛ و3 انخفاضات قيمة و12 بند صيانة مدرجة في القوائم.", zh: "资本化 19.2 亿里亚尔;3 项减值与 12 项维护并入报表。" },
      metric: { en: "SAR 1.92B capitalized", ar: "رسملة 1.92 مليار", zh: "资本化 19.2 亿" } },
    { kind: "review", uc: "UC-09", icon: "✦",
      title: { en: "AI recommendation — adjusting entries", ar: "توصية — قيود التسوية", zh: "AI 建议——调整分录" },
      actor: { en: "Reconciliation Agent → Human reviewer", ar: "وكيل التسوية ← المراجع البشري", zh: "对账智能体 → 人工复核" },
      desc: { en: "The agent proposes corrective journal entries to clear reconciliation differences before close.", ar: "يقترح الوكيل قيود تصحيحية لإغلاق فروقات التسوية قبل الإقفال.", zh: "智能体提议更正分录以在关账前清除对账差异。" },
      review: {
        headline: { en: "Post 2 proposed corrective journal entries (net SAR 25M) to clear reconciliation differences, and confirm SAR 1.92B capitalization before close.", ar: "ترحيل قيدين تصحيحيين مقترحين (صافي 25 مليون ريال) لإغلاق فروقات التسوية، وتأكيد رسملة 1.92 مليار قبل الإقفال.", zh: "过账 2 笔建议的更正分录(净 2,500 万里亚尔)以清除对账差异,并在关账前确认 19.2 亿里亚尔资本化。" },
        conf: 88,
        why: { en: "Two reconciliation differences remain — Esnad assignment (SAR +15M) and Tahseel revenue (SAR −12M); the proposed entries align book to system within tolerance. The capitalization of completed assets-under-construction meets IPSAS policy. Posting clears the pre-close checklist for the period.", ar: "يتبقى فرقان — إسناد (+15 مليون) وتحصيل (−12 مليون)؛ والقيدان المقترحان يوائمان الدفتري مع النظام ضمن الحدود. وتستوفي رسملة الأصول المكتملة سياسة IPSAS. ويُغلق الترحيل قائمة التحقق قبل الإقفال.", zh: "尚余两项差异——Esnad 派工(+1,500 万)与 Tahseel 收入(−1,200 万);建议分录在容差内使账面与系统一致。已完工在建资产的资本化符合 IPSAS 政策。过账后清空本期关账前清单。" },
        srcs: ["SAP GL", "Esnad", "Tahseel", "IPSAS-17"],
        approveLog: { en: "Approved 2 corrective entries (net SAR 25M) and SAR 1.92B capitalization confirmation", ar: "اعتماد قيدين تصحيحيين (صافي 25 مليون ريال) وتأكيد رسملة 1.92 مليار", zh: "已批准 2 笔更正分录(净 2,500 万里亚尔)及 19.2 亿资本化确认" } },
      out: { en: "Adjusting entries posted and period cleared for close after approval.", ar: "ترحيل قيود التسوية وتجهيز الفترة للإقفال بعد الاعتماد.", zh: "经批准后已过账调整分录并使期间可关账。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { kind: "report", uc: "UC-10", icon: "📄",
      title: { en: "Financial statements & audit", ar: "القوائم المالية والتدقيق", zh: "财务报表与审计" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate the financial statements and closing report and expose smart query, audit log and permission scope.", ar: "إنشاء القوائم المالية وتقرير الإقفال وإتاحة الاستعلام الذكي وسجل التدقيق ونطاق الصلاحية.", zh: "生成财务报表与关账报告,并提供智能查询、审计日志与权限范围。" },
      report: {
        title: { en: "Financial Statements & Closing — FY2026 Q2", ar: "القوائم المالية والإقفال — الربع الثاني 2026", zh: "财务报表与关账 — 2026 二季度" },
        narrative: { en: "Pre-close validation passed after clearing 2 reconciliation differences (net SAR 25M); SAP, Etimad, Esnad and Tahseel balances are reconciled within tolerance. Completed assets-under-construction of SAR 1.92B were capitalized in line with IPSAS, and accounting memos were attached for 1 noted item. The period is ready to close and the financial statements were generated with full traceability and audit trail.", ar: "اجتاز التحقق قبل الإقفال بعد إغلاق فرقي تسوية (صافي 25 مليون ريال)؛ وأرصدة ساب واعتماد وإسناد وتحصيل مسوّاة ضمن الحدود. ورُسملت أصول تحت الإنشاء مكتملة بقيمة 1.92 مليار وفق IPSAS، وأُرفقت مذكرات محاسبية لبند واحد. والفترة جاهزة للإقفال وأُنشئت القوائم المالية بقابلية تتبع كاملة وسجل تدقيق.", zh: "在清除 2 项对账差异(净 2,500 万里亚尔)后,关账前校验通过;SAP、Etimad、Esnad、Tahseel 余额在容差内对平。已完工在建资产 19.2 亿里亚尔按 IPSAS 资本化,并为 1 个注记项附会计备忘。期间可关账,财务报表已生成,具备完整可追溯性与审计轨迹。" },
        rows: [
          { l: { en: "Differences cleared", ar: "الفروقات المغلقة", zh: "已清除差异" }, v: "SAR 25M" },
          { l: { en: "Capitalization", ar: "الرسملة", zh: "资本化" }, v: "SAR 1.92B" },
          { l: { en: "Pre-close checklist", ar: "قائمة ما قبل الإقفال", zh: "关账前清单" }, v: { en: "Ready", ar: "جاهزة", zh: "就绪" } }] },
      queryaudit: true,
      out: { en: "Statements ready for the Directorate of Financial Reporting.", ar: "القوائم جاهزة للإدارة العامة للتقارير المالية.", zh: "报表已就绪,提交给财务报告总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};
const UC_SLIDES = [
  { id: "syn", chart: "map", title: { en: "I. Executive Synthesis", ar: "أولاً. الخلاصة التنفيذية", zh: "一、执行综述" },
    narr: { en: "The executive report indicates that Asir Amana performs best at the moment, Al Baha Amana needs closer follow-up, and Developmental Housing plus Housing Program 2.0 remain the largest concentrations in the sample.", ar: "يشير التقرير التنفيذي إلى أن أمانة عسير هي الأفضل أداءً حالياً، وأن أمانة الباحة تحتاج إلى متابعة أدق، وأن الإسكان التنموي وبرنامج الإسكان 2.0 يظلان أكبر التركزات في العينة.", zh: "执行报告显示:阿西尔阿玛纳目前表现最佳,巴哈阿玛纳需更密切跟进,发展性住房与住房计划 2.0 仍是样本中最大的集中点。" } },
  { id: "kpi", chart: "kpi", title: { en: "II. Key Highlights", ar: "ثانياً. أبرز المؤشرات", zh: "二、关键要点" },
    narr: { en: "Current budget rose to SAR 17,370M against an original SAR 16,532M; actual spend of SAR 11,117M yields a 64.0% spending rate, leaving SAR 6,253M unspent for the period.", ar: "ارتفعت الميزانية الحالية إلى 17,370 مليون ريال مقابل 16,532 مليون أصلية؛ والإنفاق الفعلي 11,117 مليون يعطي نسبة إنفاق 64.0٪، ويتبقى 6,253 مليون غير مصروف للفترة.", zh: "现行预算升至 173.70 亿里亚尔(原始 165.32 亿);实际支出 111.17 亿,支出率 64.0%,本期尚余 62.53 亿未支出。" } },
  { id: "exp", chart: "spend", title: { en: "III. Preliminary Explanation", ar: "ثالثاً. التفسير الأولي", zh: "三、初步解释" },
    narr: { en: "Spending accelerated from January to April, with actual spend tracking below the rising current-budget line — consistent with a back-loaded execution pattern typical of project-heavy doors.", ar: "تسارع الإنفاق من يناير إلى أبريل، مع بقاء الإنفاق الفعلي دون خط الميزانية الحالية المتصاعد — بما يتسق مع نمط تنفيذ مؤجَّل يغلب على أبواب المشاريع.", zh: "支出从 1 月到 4 月加速,实际支出始终低于上升的现行预算线——与项目类预算门常见的后置执行模式一致。" } },
  { id: "svc", chart: "svc", title: { en: "IV. Service Concentration", ar: "رابعاً. تركّز الخدمات", zh: "四、服务集中度" },
    narr: { en: "Execution rates across the main services are tightly clustered between 95% and 98%, with Parks (97.6%) and Developmental Housing (96.8%) leading; concentration risk sits with the two largest housing lines.", ar: "تتركّز نسب التنفيذ للخدمات الرئيسية بين 95٪ و98٪، وتتصدّر الحدائق (97.6٪) والإسكان التنموي (96.8٪)؛ ويتركّز خطر التركّز في خطّي الإسكان الأكبر.", zh: "主要服务的执行率紧密集中在 95%–98%,公园(97.6%)与发展性住房(96.8%)领先;集中度风险落在两条最大的住房线上。" } },
  { id: "init", chart: "vision", title: { en: "V. Initiative Structure", ar: "خامساً. بنية المبادرات", zh: "五、举措结构" },
    narr: { en: "Vision-program execution is strong overall, but Land Expropriation lags at 84.4% with SAR 282M remaining — the main candidate for a follow-up review.", ar: "تنفيذ برامج الرؤية قوي إجمالاً، لكن نزع الملكية متأخر عند 84.4٪ مع تبقّي 282 مليون ريال — وهو المرشّح الأبرز للمراجعة.", zh: "愿景计划整体执行强劲,但土地征收落后于 84.4%,尚余 2.82 亿里亚尔——是后续复核的主要对象。" } },
  { id: "rec", chart: "none", title: { en: "VI. Recommendations", ar: "سادساً. التوصيات", zh: "六、建议" },
    narr: { en: "Recommend a targeted follow-up on Al Baha Amana (spend rate < 50%) and on Land Expropriation; maintain the current trajectory elsewhere. All recommendations are drafts pending human approval.", ar: "يُوصى بمتابعة موجّهة لأمانة الباحة (نسبة إنفاق < 50٪) ولنزع الملكية؛ والإبقاء على المسار الحالي في غير ذلك. وجميع التوصيات مسودات بانتظار الاعتماد البشري.", zh: "建议对巴哈阿玛纳(支出率 < 50%)和土地征收进行定向跟进;其余维持当前轨迹。所有建议均为待人工审批的草稿。" } },
];

/* =========================================================================
   i18n  (en · ar · zh)
   ========================================================================= */
const I18N = {
  en: {
    appName: "Financial & Budgeting Copilot",
    sso_title: "Momrah Single Sign-On", sso_sub: "Unified national access to the Ministry of Municipalities and Housing digital services.",
    brandLine: "Financial & Budgeting Copilot", signInTitle: "Sign In", identity: "Identity", password: "Password",
    securityCode: "Security code", or_: "or", login_btn: "Login",
    nic1: "NIC", nic2: "National Identity Card", noAccount: "Don't have an account?", createAccount: "Create New Account",
    loginHint: "Password is pre-filled for the demo (no real authentication).",
    copyright: "© 2026 — Ministry of Municipalities and Housing · Agency for Financial Affairs and Budget", syntheticData: "Synthetic demo data — not real records",
    logout: "Sign out", resetDemo: "Reset demo",
    analyst_full: "Financial Data Analyst", manager_full: "Budget Execution Manager", leader_full: "Senior Leadership",
    analyst_desc: "Asks the Orchestrator, runs analyses, handles alerts, builds UC-06 reports, drives budget & claims journeys.",
    manager_desc: "Reviews budget execution, approves reallocations within ceilings, monitors deviations.",
    leader_desc: "Reads executive dashboards and financial reports across the Ministry and its Amanas — read-only.",
    nav_hub: "Hub", nav_chat: "Conversational Analysis", nav_monitor: "Monitoring & Alerts",
    nav_perf: "Performance Analysis", nav_budget: "Budget Execution", nav_claims: "Claims & Disbursement", nav_reports: "Reports",
    eng_orch: "Orchestrator Agent", eng_consol: "Data Consolidation & Quality", eng_deviation: "Deviation & Early Warning",
    eng_forecast: "Forecasting & Scenarios", eng_close: "Reconciliation & Closing", eng_comply: "Compliance & Audit",
    engd_orch: "Routes inquiries across agents, composes outputs, generates reports.",
    engd_consol: "Consolidates & validates data from approved systems (UC-01).",
    engd_deviation: "Detects deviations, anomalies and duplicates; raises alerts (UC-02).",
    engd_forecast: "Rolling forecasts, fiscal space and scenario simulation (UC-04/05/07).",
    engd_close: "Pre-close validation, balance reconciliation and adjustments (UC-09).",
    engd_comply: "IPSAS compliance, accounting memos and audit trail (UC-11/10).",
    eng_orch: "Orchestrator Agent", engd_orch: "Coordinates the agents, schedules tasks and composes the official outputs.",
    eng_forecast: "Financial Forecasting Agent", engd_forecast: "Forecasts revenues, expenses, cash flows and liabilities.",
    eng_rolling: "Rolling Forecasting Agent", engd_rolling: "Continuously updates forecasts as new actuals arrive.",
    eng_scenario: "Scenario Simulation Agent", engd_scenario: "Tests what-if hypotheses and compares alternatives.",
    eng_optimize: "Budget Optimization Agent", engd_optimize: "Proposes the best allocation within approved ceilings.",
    eng_anomaly: "Anomaly Detection Agent", engd_anomaly: "Detects deviations, abnormal balances and duplicate invoices.",
    eng_trends: "Market Trends Agent", engd_trends: "Monitors market trends and cost drivers.",
    eng_insights: "Proactive Insights Agent", engd_insights: "Generates actionable insights and early warnings.",
    eng_narrative: "Narrative Commentary Agent", engd_narrative: "Produces narrative commentary for financial reports.",
    eng_query: "Data Querying Agent", engd_query: "Answers natural-language questions over financial data.",
    eng_reports: "Reports Generation Agent", engd_reports: "Compiles and formats periodic financial reports.",
    eng_revenue: "Revenue Analytics Agent", engd_revenue: "Analyzes billing, collection, exclusions and receivables.",
    eng_compliance: "Compliance / Rules Agent", engd_compliance: "Assesses compliance and supports accounting rules.",
    engines_title: "13 agents · Orchestrator-coordinated", sources_title: "13 integration systems · live health",
    src_etimadp: "Etimad+", src_whiteland: "White Land", src_hyperion: "Hyperion",
    online: "Online", autonomous: "autonomous",
    src_sap: "SAP / Asas", src_etimad: "Etimad", src_esnad: "Esnad", src_grp: "GRP", src_tahseel: "Tahseel",
    src_makeen: "Makeen", src_efaa: "Efaa", src_sanad: "Sanad", src_balady: "Balady", src_gl: "GL", src_bi: "BI Dash",
    hub_hello: "Welcome", hub_sub: "One multi-agent platform · connected financial journeys",
    k_fiscal: "Available fiscal space", k_alerts: "Open deviations", k_util: "Budget utilization", k_close: "Closing readiness",
    utilByAmana: "Budget utilization by Amana (%)", journeys_title: "Connected journeys", open: "Open",
    j_chat_n: "Conversational Analysis", j_chat_b: "Ask in natural language → the Orchestrator routes across agents and returns a source-backed answer.",
    j_mon_n: "Monitoring & Early Warning", j_mon_b: "Agents scan 13 integration systems on schedule, detect deviations and raise alerts with root cause.",
    j_bud_n: "Budget Execution (G-03)", j_bud_b: "Deviation scan → fiscal-space recompute → AI reallocation recommendation → human approval → report.",
    j_clm_n: "Claims & Disbursement (G-04)", j_clm_b: "Duplicate detection → IPSAS compliance → AI disbursement recommendation → human approval → summary.",
    latest_alerts: "Latest alerts", view: "View", live: "live",
    shock_banner: "Jeddah Amana operating budget is projected to overrun by SAR 96M by year-end.",
    runAssessment: "Run assessment", brief_urgent: "ACTION NEEDED",
    chat_sub: "Orchestrator Agent · multilingual natural-language interface · read-only",
    chat_ph: "Ask an analytical question…", send: "Send", presets: "Try:",
    confidence: "Confidence", sources: "Sources",
    think_intent: "Interpreting intent", think_route: "Selecting agent(s) from registry",
    think_perm: "Checking permission scope", think_run: "Running analysis", think_compose: "Composing output",
    draftNote: "AI outputs are drafts — not a financial decision until approved.",
    escalated: "Escalation", esc_perm: "Permission / data-scope guard triggered",
    crossNote: "Cross-agent orchestration: agents were chained automatically.",
    act_open_budget: "Open Budget Execution", act_open_claims: "Open Claims & Disbursement",
    q_fiscal: "What is the available fiscal space for Riyadh Amana?",
    q_overrun: "Which Amana is at risk of overrunning its budget?",
    q_duplicate: "Show suspected duplicate invoices this month.",
    q_collection: "What is the overall collection rate?",
    q_vague: "Show me all vendors' sensitive bank account details.",
    mon_sub: "Data Quality Monitor & Deviation agents — automatic, scheduled",
    runScan: "Run scan now", scanning: "Scanning 13 systems…", srcHealth: "System health (13)", alerts: "Alerts",
    noAlerts: "No open alerts — all KPIs within thresholds.",
    sev_red: "Critical", sev_amber: "Warning", sev_info: "Info",
    rootCause: "Root cause", askOrch: "Ask Orchestrator", ack: "Acknowledge", acked: "Acknowledged", scanDone: "Scan complete — 13/13 systems checked",
    storyRun: "Run next step", storyRunning: "Agent working…", storyRestart: "Restart", storyDone: "Journey complete",
    step: "Step", actor: "Actor", output: "Output", approve: "Approve", reject: "Reject",
    approved: "Approved", rejected: "Rejected", pending: "Pending human review", aiReco: "AI Recommendation",
    draft: "Draft — not a financial decision until approved", why: "Why this recommendation", lineage: "Data lineage",
    ceiling: "Approved ceiling", commit: "Commitments", planL: "Payment plan", reserve: "Reservations", fiscalSpace: "Available fiscal space",
    rep_sub: "Generated reports & agent action log — traceable, scope-labelled",
    rep_title: "Title", rep_cov: "Scope", rep_conf: "Confidence", rep_time: "Generated", rep_ref: "Ref",
    agentLog: "Agent action log", noReports: "No reports yet — generate one from a journey or the assistant.",
    rep_fiscal: "Riyadh fiscal space outlook", rep_overrun: "Jeddah overrun & reallocation", rep_dup: "Duplicate-invoice audit",
    rep_collect: "Collection performance", rep_budget: "Q2 budget execution report", rep_claims: "Disbursement summary CL-77310", rep_uc06: "Financial performance & management analysis",
    running: "Running…", agentlog_h: "Agent activity",
    log_route: "Orchestrator routed inquiry to agents", log_alert: "Anomaly Detection agent raised a deviation alert",
    log_scan: "Anomaly Detection agent scanned 13 integration systems — 10 green, 3 watch",
    log_report: "Report generated · ref", log_approve: "Authorized officer approved a recommendation",
    log_idle: "Data Querying agent indexed the inquiry for traceability", log_uc06: "Performance analysis agent assembled a report",
    redline: "The platform only recommends and is read-only — it never edits source data, executes payments, or auto-approves.",
    // UC-06
    uc_title: "Financial Performance Analysis", uc_sub: "UC-06 · performance, regional gaps, service concentration and initiative structure.",
    uc_dept_a: "General Department of Financial Planning and Performance", uc_dept_b: "Financial Performance Analysis Department",
    uc_registry: "Financial Performance Analysis Registry", uc_new: "Create New Report",
    uc_total: "Total Reports", uc_pub: "Published", uc_appr: "Approved", uc_inrev: "In Review",
    uc_back: "Back",
    s1: "Operational Parameters", s2: "Generate Dashboard", s3: "Review Commentary", s4: "Report Detail",
    uc_cfg: "Configure Filter Parameters", uc_cfg_sub: "Define the analysis scope and dimensional filter criteria to generate the dashboard.",
    f_level: "Level of Analysis", f_amana: "Amana", f_muni: "Municipality", f_fy: "Fiscal Year", f_period: "Period Type", f_specific: "Specific Period",
    opt_ministry: "Ministry", opt_allAmanas: "All Amanas", opt_allMuni: "All Municipalities", opt_monthly: "Monthly", opt_quarterly: "Quarterly",
    uc_generate: "Generate Analytical Dashboard",
    reason_h: "AI Analysis & Reasoning Engine", reason_sub: "Please wait, the AI agent is performing dynamic financial reasoning…",
    rstep1: "Financial Performance Analysis Agent starting, ingesting departmental performance metrics…",
    rstep2: "Orchestrating 'Performance & Variance Analysis' workflow, calculating KPIs and deviations…",
    rstep3: "Orchestrating 'Narrative Commentary Generation' workflow, synthesizing explanations for performance gaps…",
    rstep4: "Orchestrating 'Decision Dashboard Assembly' workflow, compiling visual performance layouts…",
    scope_sum: "Scope Summary", obj_sum: "Objective Data Summary", balance_check: "Mathematical balance check: Passed",
    viewData: "View Supporting Data", ai_brief: "AI Brief", goCommentary: "Go to Commentary Review",
    kp_orig: "Original Budget", kp_orig_s: "Original budget before adjustments.",
    kp_rev: "Budget vs Revenue", kp_rev_s: "Approved budget against realized revenue.",
    kp_cur: "Current Budget", kp_cur_s: "Current approved budget in the selected scope.",
    kp_act: "Actual Spend", kp_act_s: "Actual spend for the selected period.",
    kp_rem: "Remaining Balance", kp_rem_s: "Unspent balance from the current budget.",
    kp_rate: "Spending Rate", kp_rate_s: "Actual spend divided by current budget.",
    kp_chg: "Increases / Decreases", kp_chg_s: "Difference between current and original budget.",
    tag_up: "IMPROVING", tag_flat: "STABLE", tag_down: "SLIPPING",
    map_title: "Regional Financial Performance Map", map_sub: "Selected regions are colored by adjusted spend rate after deferred-debt adjustment.",
    lg_green: "Green · Strong ≥75%", lg_yellow: "Yellow · Watch 50–74%", lg_red: "Red · Alert <50%",
    spend_title: "Spending Performance", spend_budget: "Current Budget", spend_actual: "Actual Spend", spend_trend: "Actual Spend Trend",
    fdetail: "Financial Detail Analysis", door_title: "Budget Door Analysis", door_sub: "Budget doors → executing entity → final use", door_total: "Displayed flow total",
    svc_title: "Main Service Analysis", vision_title: "Vision Programs",
    vp_init: "Initiative / Project", vp_port: "Portfolio", vp_budget: "Current Budget", vp_actual: "Actual Spend", vp_rem: "Remaining", vp_rate: "Execution Rate",
    rev_split: "Revenue Source Split", rs_collected: "Collected", rs_outstanding: "Outstanding", rs_weight: "Source Weight",
    col_rate: "Collection Rate by Source", cc_collected: "Collected", cc_net: "Net Invoiced",
    recv_prog: "Receivable Progression", rp_caption: "AR bucket migration based on invoiced and open receivable balances",
    rp_unpaid: "Unpaid Receivables", rp_exec: "Executable Receivables", rp_done: "Executed Collections",
    rp_matrix: "Invoiced Amount / AR Migration Across Aging Buckets", rp_unit: "Unit: % of displayed receivable base", buck_current: "Current",
    reg_ach: "Regional Collection Achievement", ra_target: "Target", ra_gap: "Gap",
    st_above: "Above target", st_near: "Near target", st_below: "Below target",
    mapNote: "Markers are indicative; colored by adjusted spend rate.",
    nav_revassets: "Revenues & Assets", j_rev_n: "Revenues & Assets (G-06)", j_rev_b: "Consolidate revenue & assets → collection analysis → performance & deviation → asset capitalization → cost & funds → AI recommendation → report & audit.",
    rev_billed: "Net billed", rev_collected: "Collected", rev_rate: "Collection rate", rev_source: "Revenue source", rev_excl: "Exclusions",
    pd_growth: "Billing growth (YoY)", pd_excl: "Exclusions", pd_signal: "Signal", pd_value: "Value", pd_status: "Status",
    as_auc: "AUC (opening)", as_cap: "Capitalized", as_impair: "Impairment flagged", as_maint: "Maintenance due", as_class: "Asset class", as_value: "Gross value (M)", as_capd: "Capitalized (M)", as_life: "Useful life (yr)", as_ret: "Return",
    st_active: "Active", st_maint: "Maintenance", st_impair: "Impaired", st_idle: "Idle surplus", st_ok: "On track", st_pending: "Pending",
    co_ao: "Assignment order", co_proj: "Project", co_fund: "Fund", co_alloc: "Allocated (M)", co_spent: "Spent (M)", co_unit: "Unit cost", co_comp: "IPSAS capitalization & exclusion compliance verified",
    qa_title: "Smart query & audit", qa_scope: "Scope: Revenues & Assets · read-only", qa_a: "Asir Amana net collection is SAR 0.31B (71% rate, 14% below the regional target) — the widest gap this period; an early-warning was raised and routed to the Revenue department.", qa_log1: "Capitalization reclass SAR 1.92B — approved by authorized officer", qa_log2: "Idle surplus release SAR 85M (AO-2207) — approved by authorized officer",
    rep_revassets: "Revenue & assets performance report",
    flow_steps: "Journey steps", nav_planning: "Planning & Performance", nav_reporting: "Financial Reporting",
    j_plan_n: "Planning & Financial Performance (G-02)", j_plan_b: "Consolidate → budget planning & fiscal space → forecast obligations → scenario simulation → performance analysis → AI recommendation → report & alerts.",
    j_rep_n: "Financial Reporting (G-05)", j_rep_b: "Consolidate → financial closing & reconciliation → compliance & memos → costs & assets → AI adjusting entries → financial report & audit.",
    rep_planning: "Planning & performance report", rep_reporting: "Financial statements & closing report",
    fc_oblig: "Projected obligations", fc_space: "Available fiscal space", fc_mape: "Rolling forecast · MAPE ≤ 12%",
    sc_opt: "Optimistic", sc_base: "Base", sc_pess: "Pessimistic", sc_space: "Fiscal space", sc_oblig: "New obligations", sc_cover: "Coverage", sc_rec: "Recommended", cover_strong: "Strong", cover_adequate: "Adequate", cover_watch: "Watch",
    cl_check: "Pre-close validation", cl_complete: "Completeness", cl_abnormal: "Abnormal balances", cl_missing: "Missing entries", cl_pass: "Pass", cl_found: "found",
    cl_recon: "Balance reconciliation", cl_entity: "Source", cl_book: "Book (M)", cl_system: "System (M)", cl_diff: "Diff (M)", cl_matched: "Matched", cl_ureview: "Under review", cl_adjust: "Adjust", cl_entries: "Proposed corrective entries",
    cw_title: "Interpretive Commentary Review Workspace", cw_sub: "The dashboard is generated first as a unified performance view. The final report type is then selected here to guide the commentary and report output.",
    finalType: "Final Report Type", rt_exec: "Executive Report", rt_init: "Initiatives Report", rt_detail: "Detailed Report",
    slidePages: "Slide Pages", dataTables: "Data Tables", addTables: "Add / Configure Tables",
    narrComment: "Narrative Commentary", aiConf: "AI Confidence Score", dataSrcLink: "Data Source Link", dataSrcVal: "National Portal (Budget Expenditures)",
    mathOk: "Mathematical consistency checked against source worksheets", chartLabel: "Chart", chart_map: "Regional Map", chart_kpi: "KPI Cards", chart_spend: "Spending Performance", chart_svc: "Service Analysis", chart_vision: "Vision Programs", chart_none: "Text only",
    copilot_h: "AI Co-pilot Chat Assistant", copilot_target: "Target Card for Conversation", copilot_hello: "Hi! Select any commentary card from the left to start rewriting it.", copilot_ph: "Type rewrite instructions (e.g., make it more concise)…",
    showDiff: "Show Diff", discussAI: "Discuss with AI", prev: "Back", next: "Next", assemble: "Assemble & Compile Final Draft",
    backWs: "Back to Report Workspace", submitReview: "Submit for Review", exportPptx: "Export to PPTX", exportPdf: "Export PDF",
    st_draft: "DRAFT", st_review: "IN REVIEW", page: "Page", of: "of",
    cover_country: "Kingdom of Saudi Arabia", cover_min: "Ministry of Municipalities and Housing", cover_persp: "Perspective: Planning & Financial Performance", cover_scope: "Scope", cover_agency: "Agency for Financial Affairs and Budget",
    submitted: "Report submitted for review", note_demo: "Synthetic data · drafts pending human approval",
  },
  ar: {
    appName: "مساعد الشؤون المالية والميزانية",
    sso_title: "الدخول الموحّد لوزارة الشؤون البلدية", sso_sub: "وصول وطني موحّد إلى الخدمات الرقمية لوزارة الشؤون البلدية والقروية والإسكان.",
    brandLine: "مساعد الشؤون المالية والميزانية", signInTitle: "تسجيل الدخول", identity: "الهوية", password: "كلمة المرور",
    securityCode: "رمز التحقق", or_: "أو", login_btn: "دخول",
    nic1: "النفاذ الوطني", nic2: "النفاذ الوطني الموحّد", noAccount: "ليس لديك حساب؟", createAccount: "إنشاء حساب جديد",
    loginHint: "كلمة المرور معبأة مسبقاً للعرض التجريبي (لا يوجد تحقق فعلي).",
    copyright: "© 2026 — وزارة الشؤون البلدية والقروية والإسكان · وكالة الشؤون المالية والميزانية", syntheticData: "بيانات تجريبية — ليست سجلات حقيقية",
    logout: "تسجيل الخروج", resetDemo: "إعادة ضبط العرض",
    analyst_full: "محلل البيانات المالية", manager_full: "مدير تنفيذ الميزانية", leader_full: "القيادة العليا",
    analyst_desc: "يسأل المنسّق، يشغّل التحليلات، يعالج التنبيهات، ينشئ تقارير UC-06، ويقود مسارات الميزانية والمطالبات.",
    manager_desc: "يراجع تنفيذ الميزانية، يعتمد المناقلات ضمن السقوف، ويراقب الانحرافات.",
    leader_desc: "يطّلع على اللوحات والتقارير المالية التنفيذية عبر الوزارة وأماناتها — للقراءة فقط.",
    nav_hub: "الرئيسية", nav_chat: "التحليل الحواري", nav_monitor: "المراقبة والتنبيهات",
    nav_perf: "تحليل الأداء", nav_budget: "تنفيذ الميزانية", nav_claims: "المطالبات والصرف", nav_reports: "التقارير",
    eng_orch: "وكيل التنسيق", eng_consol: "تجميع البيانات وجودتها", eng_deviation: "الانحرافات والإنذار المبكر",
    eng_forecast: "التنبؤ والسيناريوهات", eng_close: "التسوية والإقفال", eng_comply: "الامتثال والتدقيق",
    engd_orch: "يوجّه الاستعلامات بين الوكلاء، يركّب المخرجات، وينشئ التقارير.",
    engd_consol: "يجمّع ويتحقق من البيانات من الأنظمة المعتمدة (UC-01).",
    engd_deviation: "يكشف الانحرافات والشذوذ والتكرار؛ ويصدر التنبيهات (UC-02).",
    engd_forecast: "تنبؤات متجددة، حيز مالي، ومحاكاة سيناريوهات (UC-04/05/07).",
    engd_close: "تحقق قبل الإقفال، تسوية الأرصدة، وقيود تصحيحية (UC-09).",
    engd_comply: "امتثال IPSAS، مذكرات محاسبية، وسجل تدقيق (UC-11/10).",
    eng_orch: "وكيل التنسيق", engd_orch: "ينسّق الوكلاء ويجدول المهام ويركّب المخرجات الرسمية.",
    eng_forecast: "وكيل التنبؤ المالي", engd_forecast: "يتنبأ بالإيرادات والمصروفات والتدفقات النقدية والالتزامات.",
    eng_rolling: "وكيل التنبؤ المتجدد", engd_rolling: "يحدّث التنبؤات باستمرار مع ورود الفعلي.",
    eng_scenario: "وكيل محاكاة السيناريوهات", engd_scenario: "يختبر فرضيات ماذا-لو ويقارن البدائل.",
    eng_optimize: "وكيل تحسين الميزانية", engd_optimize: "يقترح أفضل توزيع ضمن السقوف المعتمدة.",
    eng_anomaly: "وكيل كشف الشذوذ", engd_anomaly: "يكشف الانحرافات والأرصدة غير الاعتيادية والفواتير المكررة.",
    eng_trends: "وكيل اتجاهات السوق", engd_trends: "يراقب اتجاهات السوق ومحرّكات التكلفة.",
    eng_insights: "وكيل الرؤى الاستباقية", engd_insights: "يولّد رؤى قابلة للتنفيذ وإنذارات مبكرة.",
    eng_narrative: "وكيل التعليق السردي", engd_narrative: "ينتج تعليقاً سردياً للتقارير المالية.",
    eng_query: "وكيل الاستعلام عن البيانات", engd_query: "يجيب عن الأسئلة باللغة الطبيعية على البيانات المالية.",
    eng_reports: "وكيل توليد التقارير", engd_reports: "يجمّع وينسّق التقارير المالية الدورية.",
    eng_revenue: "وكيل تحليل الإيرادات", engd_revenue: "يحلّل الفوترة والتحصيل والاستبعادات والذمم.",
    eng_compliance: "وكيل الامتثال / القواعد", engd_compliance: "يقيّم الامتثال ويدعم القواعد المحاسبية.",
    engines_title: "13 وكيلاً · بتنسيق المنسّق", sources_title: "13 نظام تكامل · الحالة المباشرة",
    src_etimadp: "اعتماد+", src_whiteland: "الأراضي البيضاء", src_hyperion: "هايبريون",
    online: "متصل", autonomous: "مستقل",
    src_sap: "ساب / أساس", src_etimad: "اعتماد", src_esnad: "إسناد", src_grp: "GRP", src_tahseel: "تحصيل",
    src_makeen: "مكين", src_efaa: "إيفاء", src_sanad: "سند", src_balady: "بلدي", src_gl: "الأستاذ", src_bi: "لوحة BI",
    hub_hello: "مرحباً", hub_sub: "منصة واحدة متعددة الوكلاء · مسارات مالية مترابطة",
    k_fiscal: "الحيز المالي المتاح", k_alerts: "انحرافات مفتوحة", k_util: "نسبة تنفيذ الميزانية", k_close: "جاهزية الإقفال",
    utilByAmana: "نسبة تنفيذ الميزانية حسب الأمانة (٪)", journeys_title: "المسارات المترابطة", open: "فتح",
    j_chat_n: "التحليل الحواري", j_chat_b: "اسأل باللغة الطبيعية ← يوجّه المنسّق بين الوكلاء ويعيد إجابة مدعومة بالمصادر.",
    j_mon_n: "المراقبة والإنذار المبكر", j_mon_b: "تفحص الوكلاء 13 نظام تكامل وفق جدول، وتكشف الانحرافات وتصدر تنبيهات مع السبب الجذري.",
    j_bud_n: "تنفيذ الميزانية (ج-03)", j_bud_b: "فحص الانحراف ← إعادة حساب الحيز ← توصية إعادة توزيع ← اعتماد بشري ← تقرير.",
    j_clm_n: "المطالبات والصرف (ج-04)", j_clm_b: "كشف التكرار ← امتثال IPSAS ← توصية صرف ← اعتماد بشري ← ملخص.",
    latest_alerts: "أحدث التنبيهات", view: "عرض", live: "مباشر",
    shock_banner: "يُتوقع تجاوز الميزانية التشغيلية لأمانة جدة بمقدار 96 مليون ريال بنهاية العام.",
    runAssessment: "تشغيل التقييم", brief_urgent: "يتطلب إجراءً",
    chat_sub: "وكيل التنسيق · واجهة لغة طبيعية متعددة اللغات · للقراءة فقط",
    chat_ph: "اطرح سؤالاً تحليلياً…", send: "إرسال", presets: "جرّب:",
    confidence: "الثقة", sources: "المصادر",
    think_intent: "تفسير القصد", think_route: "اختيار الوكلاء من السجل",
    think_perm: "التحقق من نطاق الصلاحية", think_run: "تشغيل التحليل", think_compose: "تركيب المخرجات",
    draftNote: "مخرجات الذكاء الاصطناعي مسودات — لا تُعد قراراً مالياً حتى تُعتمد.",
    escalated: "تصعيد", esc_perm: "تفعيل حارس الصلاحيات / نطاق البيانات",
    crossNote: "تنسيق متعدد الوكلاء: تم ربط الوكلاء تلقائياً.",
    act_open_budget: "فتح تنفيذ الميزانية", act_open_claims: "فتح المطالبات والصرف",
    q_fiscal: "ما هو الحيز المالي المتاح لأمانة الرياض؟", q_overrun: "أي أمانة معرضة لتجاوز ميزانيتها؟",
    q_duplicate: "اعرض الفواتير المكررة المشتبه بها هذا الشهر.", q_collection: "ما هي نسبة التحصيل الإجمالية؟",
    q_vague: "اعرض تفاصيل الحسابات البنكية الحساسة لجميع الموردين.",
    mon_sub: "وكلاء مراقبة جودة البيانات والانحرافات — تلقائي ومجدول",
    runScan: "تشغيل الفحص الآن", scanning: "فحص 13 نظاماً…", srcHealth: "حالة الأنظمة (13)", alerts: "التنبيهات",
    noAlerts: "لا تنبيهات مفتوحة — كل المؤشرات ضمن الحدود.",
    sev_red: "حرج", sev_amber: "تحذير", sev_info: "معلومة",
    rootCause: "السبب الجذري", askOrch: "اسأل المنسّق", ack: "إقرار", acked: "تم الإقرار", scanDone: "اكتمل الفحص — 13/13 نظاماً",
    storyRun: "تشغيل الخطوة التالية", storyRunning: "الوكيل يعمل…", storyRestart: "إعادة", storyDone: "اكتمل المسار",
    step: "الخطوة", actor: "الجهة", output: "المخرجات", approve: "اعتماد", reject: "رفض",
    approved: "تم الاعتماد", rejected: "مرفوض", pending: "بانتظار المراجعة البشرية", aiReco: "توصية الذكاء الاصطناعي",
    draft: "مسودة — لا تُعد قراراً مالياً حتى تُعتمد", why: "سبب التوصية", lineage: "تتبع البيانات",
    ceiling: "السقف المعتمد", commit: "الالتزامات", planL: "خطة الدفع", reserve: "الحجوزات", fiscalSpace: "الحيز المالي المتاح",
    rep_sub: "التقارير المُنشأة وسجل إجراءات الوكلاء — قابلة للتتبع وموسومة بالنطاق",
    rep_title: "العنوان", rep_cov: "النطاق", rep_conf: "الثقة", rep_time: "أُنشئ", rep_ref: "المرجع",
    agentLog: "سجل إجراءات الوكلاء", noReports: "لا تقارير بعد — أنشئ تقريراً من أحد المسارات أو المساعد.",
    rep_fiscal: "توقعات الحيز المالي للرياض", rep_overrun: "تجاوز جدة وإعادة التوزيع", rep_dup: "تدقيق الفواتير المكررة",
    rep_collect: "أداء التحصيل", rep_budget: "تقرير تنفيذ ميزانية الربع الثاني", rep_claims: "ملخص الصرف CL-77310", rep_uc06: "تقرير الأداء المالي والتحليل الإداري",
    running: "جارٍ…", agentlog_h: "نشاط الوكلاء",
    log_route: "وجّه المنسّق الاستعلام إلى الوكلاء", log_alert: "أصدر وكيل كشف الشذوذ تنبيه انحراف",
    log_scan: "فحص وكيل كشف الشذوذ 13 نظام تكامل — 10 خضراء، 3 مراقبة",
    log_report: "تم إنشاء تقرير · مرجع", log_approve: "اعتمد المسؤول المخوّل توصية",
    log_idle: "فهرس وكيل الاستعلام الطلب لأغراض التتبع", log_uc06: "جمّع وكيل تحليل الأداء تقريراً",
    redline: "المنصة توصي فقط وللقراءة فقط — لا تعدّل بيانات المصدر، ولا تنفّذ المدفوعات، ولا تعتمد تلقائياً.",
    uc_title: "تحليل الأداء المالي", uc_sub: "UC-06 · الأداء المالي والفجوات المكانية وتركّز الخدمات وبنية المبادرات.",
    uc_dept_a: "الإدارة العامة للتخطيط والأداء المالي", uc_dept_b: "إدارة تحليل الأداء المالي",
    uc_registry: "سجل تحليل الأداء المالي", uc_new: "إنشاء تقرير جديد",
    uc_total: "إجمالي التقارير", uc_pub: "منشور رسمياً", uc_appr: "معتمد", uc_inrev: "قيد المراجعة", uc_back: "رجوع",
    s1: "المعايير التشغيلية", s2: "إنشاء اللوحة", s3: "مراجعة التعليق", s4: "تفاصيل التقرير",
    uc_cfg: "ضبط معايير التصفية", uc_cfg_sub: "حدّد نطاق التحليل ومعايير التصفية لإنشاء اللوحة.",
    f_level: "مستوى التحليل", f_amana: "الأمانة", f_muni: "البلدية", f_fy: "السنة المالية", f_period: "نوع الفترة", f_specific: "فترة محددة",
    opt_ministry: "الوزارة", opt_allAmanas: "كل الأمانات", opt_allMuni: "كل البلديات", opt_monthly: "شهري", opt_quarterly: "ربع سنوي",
    uc_generate: "إنشاء اللوحة التحليلية",
    reason_h: "محرك التحليل والاستدلال بالذكاء الاصطناعي", reason_sub: "يرجى الانتظار، يقوم الوكيل بالاستدلال المالي الديناميكي…",
    rstep1: "بدء وكيل تحليل الأداء المالي واستيعاب مؤشرات أداء الإدارات…",
    rstep2: "تنسيق مسار 'تحليل الأداء والانحراف' وحساب المؤشرات والانحرافات…",
    rstep3: "تنسيق مسار 'توليد التعليق السردي' وتركيب تفسيرات فجوات الأداء…",
    rstep4: "تنسيق مسار 'تجميع لوحة القرار' وبناء التخطيطات البصرية للأداء…",
    scope_sum: "ملخص النطاق", obj_sum: "ملخص البيانات الموضوعية", balance_check: "فحص التوازن الحسابي: ناجح",
    viewData: "عرض البيانات الداعمة", ai_brief: "موجز الذكاء الاصطناعي", goCommentary: "الانتقال إلى مراجعة التعليق",
    kp_orig: "الميزانية الأصلية", kp_orig_s: "الميزانية قبل التعديلات.",
    kp_rev: "الميزانية مقابل الإيرادات", kp_rev_s: "الميزانية المعتمدة مقابل الإيراد المحقق.",
    kp_cur: "الميزانية الحالية", kp_cur_s: "الميزانية المعتمدة الحالية ضمن النطاق.",
    kp_act: "الإنفاق الفعلي", kp_act_s: "الإنفاق الفعلي للفترة المحددة.",
    kp_rem: "الرصيد المتبقي", kp_rem_s: "الرصيد غير المصروف من الميزانية الحالية.",
    kp_rate: "نسبة الإنفاق", kp_rate_s: "الإنفاق الفعلي مقسوماً على الميزانية الحالية.",
    kp_chg: "زيادات / تخفيضات", kp_chg_s: "الفرق بين الميزانية الحالية والأصلية.",
    tag_up: "متحسّن", tag_flat: "مستقر", tag_down: "متراجع",
    map_title: "خريطة الأداء المالي الإقليمي", map_sub: "تُلوَّن المناطق وفق نسبة الإنفاق المعدّلة بعد تسوية الديون المؤجّلة.",
    lg_green: "أخضر · قوي ≥75٪", lg_yellow: "أصفر · مراقبة 50–74٪", lg_red: "أحمر · إنذار <50٪",
    spend_title: "أداء الإنفاق", spend_budget: "الميزانية الحالية", spend_actual: "الإنفاق الفعلي", spend_trend: "اتجاه الإنفاق الفعلي",
    fdetail: "تحليل التفاصيل المالية", door_title: "تحليل أبواب الميزانية", door_sub: "أبواب الميزانية ← الجهة المنفّذة ← الاستخدام النهائي", door_total: "إجمالي التدفق المعروض",
    svc_title: "تحليل الخدمات الرئيسية", vision_title: "برامج الرؤية",
    vp_init: "المبادرة / المشروع", vp_port: "المحفظة", vp_budget: "الميزانية الحالية", vp_actual: "الإنفاق الفعلي", vp_rem: "المتبقي", vp_rate: "نسبة التنفيذ",
    rev_split: "تقسيم مصادر الإيراد", rs_collected: "المحصّل", rs_outstanding: "المتبقي", rs_weight: "وزن المصدر",
    col_rate: "نسبة التحصيل حسب المصدر", cc_collected: "المحصّل", cc_net: "صافي الفوترة",
    recv_prog: "تطوّر الذمم المدينة", rp_caption: "انتقال شرائح الذمم بناءً على الفوترة وأرصدة الذمم المفتوحة",
    rp_unpaid: "ذمم غير مدفوعة", rp_exec: "ذمم قابلة للتنفيذ", rp_done: "تحصيلات منفّذة",
    rp_matrix: "المبلغ المفوتر / انتقال الذمم عبر شرائح التقادم", rp_unit: "الوحدة: ٪ من قاعدة الذمم المعروضة", buck_current: "الحالي",
    reg_ach: "إنجاز التحصيل الإقليمي", ra_target: "المستهدف", ra_gap: "الفجوة",
    st_above: "فوق المستهدف", st_near: "قريب من المستهدف", st_below: "دون المستهدف",
    mapNote: "العلامات إرشادية؛ مُلوّنة وفق نسبة الإنفاق المعدّلة.",
    nav_revassets: "الإيرادات والأصول", j_rev_n: "الإيرادات والأصول (ج-06)", j_rev_b: "تجميع الإيرادات والأصول ← تحليل التحصيل ← الأداء والانحراف ← رسملة الأصول ← التكاليف والصناديق ← توصية ذكية ← تقرير وتدقيق.",
    rev_billed: "صافي الفوترة", rev_collected: "المحصّل", rev_rate: "نسبة التحصيل", rev_source: "مصدر الإيراد", rev_excl: "الاستبعادات",
    pd_growth: "نمو الفوترة (سنوي)", pd_excl: "الاستبعادات", pd_signal: "المؤشر", pd_value: "القيمة", pd_status: "الحالة",
    as_auc: "أصول تحت الإنشاء (افتتاحي)", as_cap: "المرسمَل", as_impair: "انخفاض قيمة مرصود", as_maint: "صيانة مستحقة", as_class: "فئة الأصل", as_value: "القيمة الإجمالية (م)", as_capd: "المرسمَل (م)", as_life: "العمر الإنتاجي (سنة)", as_ret: "العائد",
    st_active: "نشط", st_maint: "صيانة", st_impair: "منخفض القيمة", st_idle: "فائض خامل", st_ok: "ضمن المسار", st_pending: "معلّق",
    co_ao: "أمر الإسناد", co_proj: "المشروع", co_fund: "الصندوق", co_alloc: "المخصّص (م)", co_spent: "المصروف (م)", co_unit: "تكلفة الوحدة", co_comp: "تم التحقق من رسملة IPSAS وامتثال الاستبعاد",
    qa_title: "الاستعلام الذكي والتدقيق", qa_scope: "النطاق: الإيرادات والأصول · للقراءة فقط", qa_a: "صافي تحصيل أمانة عسير 0.31 مليار ريال (نسبة 71٪، أقل من المستهدف الإقليمي بـ14٪) — أكبر فجوة هذه الفترة؛ وأُطلق تنبيه مبكر ووُجّه إلى إدارة الإيرادات.", qa_log1: "إعادة تصنيف الرسملة 1.92 مليار ريال — معتمدة من المسؤول المخوّل", qa_log2: "الإفراج عن فائض خامل 85 مليون ريال (AO-2207) — معتمد من المسؤول المخوّل",
    rep_revassets: "تقرير أداء الإيرادات والأصول",
    flow_steps: "خطوات المسار", nav_planning: "التخطيط والأداء", nav_reporting: "التقارير المالية",
    j_plan_n: "التخطيط والأداء المالي (ج-02)", j_plan_b: "تجميع ← تخطيط الميزانية والحيز المالي ← التنبؤ بالالتزامات ← محاكاة السيناريوهات ← تحليل الأداء ← توصية ذكية ← تقرير وتنبيهات.",
    j_rep_n: "التقارير المالية (ج-05)", j_rep_b: "تجميع ← الإقفال والتسوية ← الامتثال والمذكرات ← التكاليف والأصول ← قيود تسوية بالذكاء الاصطناعي ← تقرير مالي وتدقيق.",
    rep_planning: "تقرير التخطيط والأداء", rep_reporting: "تقرير القوائم المالية والإقفال",
    fc_oblig: "الالتزامات المتوقعة", fc_space: "الحيز المالي المتاح", fc_mape: "تنبؤ متجدد · MAPE ≤ 12٪",
    sc_opt: "متفائل", sc_base: "أساسي", sc_pess: "متشائم", sc_space: "الحيز المالي", sc_oblig: "التزامات جديدة", sc_cover: "التغطية", sc_rec: "موصى به", cover_strong: "قوية", cover_adequate: "كافية", cover_watch: "مراقبة",
    cl_check: "التحقق قبل الإقفال", cl_complete: "الاكتمال", cl_abnormal: "أرصدة غير اعتيادية", cl_missing: "قيود ناقصة", cl_pass: "مجتاز", cl_found: "تم العثور",
    cl_recon: "تسوية الأرصدة", cl_entity: "المصدر", cl_book: "الدفتري (م)", cl_system: "النظام (م)", cl_diff: "الفرق (م)", cl_matched: "مطابَق", cl_ureview: "قيد المراجعة", cl_adjust: "تسوية", cl_entries: "قيود تصحيحية مقترحة",
    cw_title: "مساحة مراجعة التعليق التفسيري", cw_sub: "تُنشأ اللوحة أولاً كعرض موحّد للأداء، ثم يُحدَّد نوع التقرير النهائي هنا لتوجيه التعليق والمخرجات.",
    finalType: "نوع التقرير النهائي", rt_exec: "تقرير تنفيذي", rt_init: "تقرير المبادرات", rt_detail: "تقرير تفصيلي",
    slidePages: "صفحات الشرائح", dataTables: "جداول البيانات", addTables: "إضافة / ضبط الجداول",
    narrComment: "التعليق السردي", aiConf: "درجة ثقة الذكاء الاصطناعي", dataSrcLink: "رابط مصدر البيانات", dataSrcVal: "البوابة الوطنية (مصروفات الميزانية)",
    mathOk: "تم التحقق من الاتساق الحسابي مقابل أوراق العمل المصدرية", chartLabel: "المخطط", chart_map: "خريطة إقليمية", chart_kpi: "بطاقات المؤشرات", chart_spend: "أداء الإنفاق", chart_svc: "تحليل الخدمات", chart_vision: "برامج الرؤية", chart_none: "نص فقط",
    copilot_h: "مساعد الدردشة المرافق", copilot_target: "البطاقة المستهدفة للمحادثة", copilot_hello: "مرحباً! اختر أي بطاقة تعليق من اليسار لبدء إعادة الصياغة.", copilot_ph: "اكتب تعليمات إعادة الصياغة (مثل: اجعله أكثر إيجازاً)…",
    showDiff: "إظهار الفرق", discussAI: "مناقشة مع الذكاء الاصطناعي", prev: "رجوع", next: "التالي", assemble: "تجميع وتركيب المسودة النهائية",
    backWs: "العودة إلى مساحة العمل", submitReview: "إرسال للمراجعة", exportPptx: "تصدير PPTX", exportPdf: "تصدير PDF",
    st_draft: "مسودة", st_review: "قيد المراجعة", page: "صفحة", of: "من",
    cover_country: "المملكة العربية السعودية", cover_min: "وزارة الشؤون البلدية والقروية والإسكان", cover_persp: "المنظور: التخطيط والأداء المالي", cover_scope: "النطاق", cover_agency: "وكالة الشؤون المالية والميزانية",
    submitted: "تم إرسال التقرير للمراجعة", note_demo: "بيانات تجريبية · مسودات بانتظار الاعتماد البشري",
  },
  zh: {
    appName: "财务与预算智能助手",
    sso_title: "市政部统一登录", sso_sub: "统一的国家级入口,访问市政农村事务与住房部的数字服务。",
    brandLine: "财务与预算智能助手", signInTitle: "登录", identity: "身份", password: "密码",
    securityCode: "验证码", or_: "或", login_btn: "登录",
    nic1: "国家统一登录", nic2: "国家身份卡", noAccount: "还没有账户?", createAccount: "创建新账户",
    loginHint: "演示用密码已预填(无真实认证)。",
    copyright: "© 2026 — 市政农村事务与住房部 · 财务事务与预算署", syntheticData: "合成演示数据 — 非真实记录",
    logout: "退出登录", resetDemo: "重置演示",
    analyst_full: "财务数据分析师", manager_full: "预算执行经理", leader_full: "高层领导",
    analyst_desc: "向编排器提问、运行分析、处理告警、生成 UC-06 报告,并驱动预算与索赔流程。",
    manager_desc: "复核预算执行,在上限内批准调拨,监控偏差。",
    leader_desc: "查阅部委及各阿玛纳的执行级仪表盘与财务报告——仅只读。",
    nav_hub: "主页", nav_chat: "对话分析", nav_monitor: "监控与告警",
    nav_perf: "绩效分析", nav_budget: "预算执行", nav_claims: "索赔与支付", nav_reports: "报告",
    eng_orch: "编排智能体", eng_consol: "数据汇聚与质量", eng_deviation: "偏差与预警",
    eng_forecast: "预测与情景", eng_close: "对账与关账", eng_comply: "合规与审计",
    engd_orch: "在各智能体间路由查询、组织输出、生成报告。",
    engd_consol: "从核准系统汇聚并校验数据(UC-01)。",
    engd_deviation: "检测偏差、异常与重复;发出告警(UC-02)。",
    engd_forecast: "滚动预测、财政空间与情景模拟(UC-04/05/07)。",
    engd_close: "关账前校验、余额对账与调整(UC-09)。",
    engd_comply: "IPSAS 合规、会计备忘与审计轨迹(UC-11/10)。",
    eng_orch: "编排智能体", engd_orch: "协调各智能体、调度任务并组织正式输出。",
    eng_forecast: "财务预测智能体", engd_forecast: "预测收入、支出、现金流与负债。",
    eng_rolling: "滚动预测智能体", engd_rolling: "随新实绩到达持续更新预测。",
    eng_scenario: "情景模拟智能体", engd_scenario: "测试 What-if 假设并比较备选方案。",
    eng_optimize: "预算优化智能体", engd_optimize: "在核定上限内提出最优分配。",
    eng_anomaly: "异常检测智能体", engd_anomaly: "检测偏差、异常余额与重复发票。",
    eng_trends: "市场趋势智能体", engd_trends: "监测市场趋势与成本驱动。",
    eng_insights: "主动洞察智能体", engd_insights: "生成可执行洞察与预警。",
    eng_narrative: "叙述评论智能体", engd_narrative: "为财务报告生成叙述性评论。",
    eng_query: "数据查询智能体", engd_query: "以自然语言回答财务数据问题。",
    eng_reports: "报告生成智能体", engd_reports: "汇编并格式化周期性财务报告。",
    eng_revenue: "收入分析智能体", engd_revenue: "分析开票、征收、排除项与应收。",
    eng_compliance: "合规 / 规则智能体", engd_compliance: "评估合规并支持会计规则。",
    engines_title: "13 个智能体 · 由编排器协调", sources_title: "13 个集成系统 · 实时状态",
    src_etimadp: "Etimad+", src_whiteland: "白地平台", src_hyperion: "Hyperion",
    online: "在线", autonomous: "自主",
    src_sap: "SAP / Asas", src_etimad: "Etimad", src_esnad: "Esnad", src_grp: "GRP", src_tahseel: "Tahseel",
    src_makeen: "Makeen", src_efaa: "Efaa", src_sanad: "Sanad", src_balady: "Balady", src_gl: "总账", src_bi: "BI 看板",
    hub_hello: "欢迎", hub_sub: "一个多智能体平台 · 互联的财务流程",
    k_fiscal: "可用财政空间", k_alerts: "未处理偏差", k_util: "预算执行率", k_close: "关账就绪度",
    utilByAmana: "各阿玛纳预算执行率(%)", journeys_title: "互联流程", open: "打开",
    j_chat_n: "对话分析", j_chat_b: "用自然语言提问 → 编排器在各智能体间路由,返回有数据来源支撑的答案。",
    j_mon_n: "监控与预警", j_mon_b: "智能体按计划扫描 13 个集成系统,检测偏差并附根因发出告警。",
    j_bud_n: "预算执行(G-03)", j_bud_b: "偏差扫描 → 重算财政空间 → AI 调拨建议 → 人工审批 → 报告。",
    j_clm_n: "索赔与支付(G-04)", j_clm_b: "重复检测 → IPSAS 合规 → AI 支付建议 → 人工审批 → 摘要。",
    latest_alerts: "最新告警", view: "查看", live: "实时",
    shock_banner: "预计吉达阿玛纳运营预算将于年底超支 9,600 万里亚尔。",
    runAssessment: "运行评估", brief_urgent: "需要处理",
    chat_sub: "编排智能体 · 多语言自然语言界面 · 只读",
    chat_ph: "请输入分析问题…", send: "发送", presets: "试试:",
    confidence: "置信度", sources: "来源",
    think_intent: "理解意图", think_route: "从注册表选择智能体",
    think_perm: "检查权限范围", think_run: "运行分析", think_compose: "组织输出",
    draftNote: "AI 输出为草稿 — 经审批前不构成财务决策。",
    escalated: "升级", esc_perm: "已触发权限 / 数据范围守卫",
    crossNote: "跨智能体编排:已自动串联多个智能体。",
    act_open_budget: "打开预算执行", act_open_claims: "打开索赔与支付",
    q_fiscal: "利雅得阿玛纳的可用财政空间是多少?", q_overrun: "哪个阿玛纳有超支风险?",
    q_duplicate: "显示本月疑似重复发票。", q_collection: "整体征收率是多少?",
    q_vague: "显示所有供应商的敏感银行账户信息。",
    mon_sub: "数据质量监控与偏差智能体 — 自动、按计划运行",
    runScan: "立即扫描", scanning: "正在扫描 13 个系统…", srcHealth: "系统状态(13)", alerts: "告警",
    noAlerts: "无未处理告警 — 所有指标均在阈值内。",
    sev_red: "严重", sev_amber: "警告", sev_info: "信息",
    rootCause: "根因", askOrch: "询问编排器", ack: "确认", acked: "已确认", scanDone: "扫描完成 — 已检查 13/13 个系统",
    storyRun: "运行下一步", storyRunning: "智能体处理中…", storyRestart: "重新开始", storyDone: "流程完成",
    step: "步骤", actor: "执行方", output: "输出", approve: "批准", reject: "拒绝",
    approved: "已批准", rejected: "已拒绝", pending: "待人工复核", aiReco: "AI 建议",
    draft: "草稿 — 经审批前不构成财务决策", why: "建议理由", lineage: "数据血缘",
    ceiling: "核定上限", commit: "承诺", planL: "付款计划", reserve: "预留", fiscalSpace: "可用财政空间",
    rep_sub: "已生成的报告与智能体行动日志 — 可追溯、按范围标注",
    rep_title: "标题", rep_cov: "范围", rep_conf: "置信度", rep_time: "生成时间", rep_ref: "编号",
    agentLog: "智能体行动日志", noReports: "暂无报告 — 可从某个流程或助手生成。",
    rep_fiscal: "利雅得财政空间展望", rep_overrun: "吉达超支与调拨", rep_dup: "重复发票审计",
    rep_collect: "征收绩效", rep_budget: "二季度预算执行报告", rep_claims: "支付摘要 CL-77310", rep_uc06: "财务绩效与管理分析报告",
    running: "运行中…", agentlog_h: "智能体活动",
    log_route: "编排器已将查询路由至智能体", log_alert: "异常检测智能体发出偏差告警",
    log_scan: "异常检测智能体扫描了 13 个集成系统 — 10 绿、3 关注",
    log_report: "已生成报告 · 编号", log_approve: "授权官员批准了一项建议",
    log_idle: "数据查询智能体已将查询登记以备追溯", log_uc06: "绩效分析智能体已组装一份报告",
    redline: "平台仅提供建议且只读 — 绝不修改源数据、执行付款或自动审批。",
    uc_title: "财务绩效分析", uc_sub: "UC-06 · 财务绩效、区域差距、服务集中度与举措结构。",
    uc_dept_a: "财务规划与绩效总局", uc_dept_b: "财务绩效分析部",
    uc_registry: "财务绩效分析记录", uc_new: "创建新报告",
    uc_total: "报告总数", uc_pub: "正式发布", uc_appr: "已核准", uc_inrev: "审核中", uc_back: "返回",
    s1: "运营参数", s2: "生成仪表盘", s3: "复核评述", s4: "报告详情",
    uc_cfg: "配置筛选参数", uc_cfg_sub: "定义分析范围与维度筛选条件以生成仪表盘。",
    f_level: "分析层级", f_amana: "阿玛纳", f_muni: "市政", f_fy: "财政年度", f_period: "周期类型", f_specific: "具体周期",
    opt_ministry: "部级", opt_allAmanas: "全部阿玛纳", opt_allMuni: "全部市政", opt_monthly: "月度", opt_quarterly: "季度",
    uc_generate: "生成分析仪表盘",
    reason_h: "AI 分析与推理引擎", reason_sub: "请稍候,AI 智能体正在进行动态财务推理…",
    rstep1: "财务绩效分析智能体启动,正在摄取部门绩效指标…",
    rstep2: "编排「绩效与差异分析」工作流,计算 KPI 与偏差…",
    rstep3: "编排「叙述性评述生成」工作流,综合解释绩效差距…",
    rstep4: "编排「决策仪表盘装配」工作流,编排可视化绩效布局…",
    scope_sum: "范围摘要", obj_sum: "客观数据摘要", balance_check: "数学平衡校验:通过",
    viewData: "查看支撑数据", ai_brief: "AI 摘要", goCommentary: "前往评述复核",
    kp_orig: "原始预算", kp_orig_s: "调整前的原始预算。",
    kp_rev: "预算对比收入", kp_rev_s: "核定预算对比已实现收入。",
    kp_cur: "现行预算", kp_cur_s: "所选范围内的现行核定预算。",
    kp_act: "实际支出", kp_act_s: "所选周期的实际支出。",
    kp_rem: "剩余余额", kp_rem_s: "现行预算的未支出余额。",
    kp_rate: "支出率", kp_rate_s: "实际支出除以现行预算。",
    kp_chg: "增加 / 减少", kp_chg_s: "现行与原始预算之差。",
    tag_up: "改善中", tag_flat: "稳定", tag_down: "下滑中",
    map_title: "区域财务绩效地图", map_sub: "区域按递延债务调整后的调整支出率着色。",
    lg_green: "绿 · 良好 ≥75%", lg_yellow: "黄 · 关注 50–74%", lg_red: "红 · 预警 <50%",
    spend_title: "支出绩效", spend_budget: "现行预算", spend_actual: "实际支出", spend_trend: "实际支出趋势",
    fdetail: "财务明细分析", door_title: "预算门分析", door_sub: "预算门 → 执行主体 → 最终用途", door_total: "显示流量合计",
    svc_title: "主要服务分析", vision_title: "愿景计划",
    vp_init: "举措 / 项目", vp_port: "组合", vp_budget: "现行预算", vp_actual: "实际支出", vp_rem: "剩余", vp_rate: "执行率",
    rev_split: "收入来源拆分", rs_collected: "已征收", rs_outstanding: "未征收", rs_weight: "来源权重",
    col_rate: "各来源征收率", cc_collected: "已征收", cc_net: "净开票",
    recv_prog: "应收账款演进", rp_caption: "基于开票与未结应收余额的账龄迁移",
    rp_unpaid: "未付应收", rp_exec: "可执行应收", rp_done: "已执行征收",
    rp_matrix: "开票金额 / 账龄分桶迁移", rp_unit: "单位:占所示应收基数的 %", buck_current: "当前",
    reg_ach: "区域征收达成", ra_target: "目标", ra_gap: "缺口",
    st_above: "高于目标", st_near: "接近目标", st_below: "低于目标",
    mapNote: "标记为示意;按调整后支出率着色。",
    nav_revassets: "收入与资产", j_rev_n: "收入与资产(G-06)", j_rev_b: "汇聚收入与资产 → 征收分析 → 绩效与偏差 → 资产资本化 → 成本与基金 → AI 建议 → 报告与审计。",
    rev_billed: "净开票", rev_collected: "已征收", rev_rate: "征收率", rev_source: "收入来源", rev_excl: "排除项",
    pd_growth: "开票增长(同比)", pd_excl: "排除项", pd_signal: "信号", pd_value: "数值", pd_status: "状态",
    as_auc: "在建资产(期初)", as_cap: "已资本化", as_impair: "减值标记", as_maint: "待维护", as_class: "资产类别", as_value: "总值(百万)", as_capd: "资本化(百万)", as_life: "使用年限(年)", as_ret: "回报",
    st_active: "在用", st_maint: "维护", st_impair: "已减值", st_idle: "闲置结余", st_ok: "正常", st_pending: "待定",
    co_ao: "派工单", co_proj: "项目", co_fund: "基金", co_alloc: "分配(百万)", co_spent: "已花(百万)", co_unit: "单位成本", co_comp: "已核验 IPSAS 资本化与排除合规",
    qa_title: "智能查询与审计", qa_scope: "范围:收入与资产 · 只读", qa_a: "阿西尔阿玛纳净征收为 3.1 亿里亚尔(征收率 71%,低于区域目标 14%)——本期最大缺口;已触发预警并路由至收入部门。", qa_log1: "资本化重分类 19.2 亿里亚尔 — 已由授权官员批准", qa_log2: "闲置结余释放 8,500 万里亚尔(AO-2207)— 已由授权官员批准",
    rep_revassets: "收入与资产绩效报告",
    flow_steps: "流程步骤", nav_planning: "规划与绩效", nav_reporting: "财务报告",
    j_plan_n: "规划与财务绩效(G-02)", j_plan_b: "汇聚 → 预算规划与财政空间 → 义务预测 → 情景模拟 → 绩效分析 → AI 建议 → 报告与告警。",
    j_rep_n: "财务报告(G-05)", j_rep_b: "汇聚 → 关账与对账 → 合规与备忘 → 成本与资产 → AI 调整分录 → 财务报告与审计。",
    rep_planning: "规划与绩效报告", rep_reporting: "财务报表与关账报告",
    fc_oblig: "预测义务", fc_space: "可用财政空间", fc_mape: "滚动预测 · MAPE ≤ 12%",
    sc_opt: "乐观", sc_base: "基准", sc_pess: "悲观", sc_space: "财政空间", sc_oblig: "新增义务", sc_cover: "覆盖", sc_rec: "推荐", cover_strong: "充足", cover_adequate: "适当", cover_watch: "关注",
    cl_check: "关账前校验", cl_complete: "完整性", cl_abnormal: "异常余额", cl_missing: "缺失分录", cl_pass: "通过", cl_found: "发现",
    cl_recon: "余额对账", cl_entity: "来源", cl_book: "账面(百万)", cl_system: "系统(百万)", cl_diff: "差异(百万)", cl_matched: "已匹配", cl_ureview: "复核中", cl_adjust: "调整", cl_entries: "建议的更正分录",
    cw_title: "解释性评述复核工作区", cw_sub: "先生成统一的绩效视图仪表盘,然后在此选择最终报告类型,以指导评述与报告输出。",
    finalType: "最终报告类型", rt_exec: "执行报告", rt_init: "举措报告", rt_detail: "明细报告",
    slidePages: "幻灯片页", dataTables: "数据表", addTables: "添加 / 配置数据表",
    narrComment: "叙述性评述", aiConf: "AI 置信度", dataSrcLink: "数据源链接", dataSrcVal: "国家门户(预算支出)",
    mathOk: "已对照源工作表校验数学一致性", chartLabel: "图表", chart_map: "区域地图", chart_kpi: "KPI 卡片", chart_spend: "支出绩效", chart_svc: "服务分析", chart_vision: "愿景计划", chart_none: "纯文本",
    copilot_h: "AI 副驾驶聊天助手", copilot_target: "对话目标卡片", copilot_hello: "你好!从左侧选择任意评述卡片即可开始改写。", copilot_ph: "输入改写指令(例如:更简洁一些)…",
    showDiff: "显示差异", discussAI: "与 AI 讨论", prev: "上一步", next: "下一步", assemble: "装配并编译最终草稿",
    backWs: "返回报告工作区", submitReview: "提交审核", exportPptx: "导出 PPTX", exportPdf: "导出 PDF",
    st_draft: "草稿", st_review: "审核中", page: "第", of: "/",
    cover_country: "沙特阿拉伯王国", cover_min: "市政农村事务与住房部", cover_persp: "视角:规划与财务绩效", cover_scope: "范围", cover_agency: "财务事务与预算署",
    submitted: "报告已提交审核", note_demo: "合成数据 · 草稿待人工审批",
  },
};

/* =========================================================================
   Store
   ========================================================================= */
const Store = createContext(null);
function useStore() { return useContext(Store); }
let logSeq = 0;
const ROUTE_ALLOWLIST = new Set([
  "hub", "chat", "monitor", "budget", "claims", "planning", "plnbudget", "plncost", "plnhousing", "plnforecast", "plnscenario", "g02query", "reporting", "revassets",
  "rcwork", "rcbench", "rcdata", "rcdatav1", "g02flow", "g02fpaflow", "g03flow", "g04flow", "g04entflow", "g04audflow",
  "g05flow", "g05repflow", "g05compflow", "g05costflow", "g05acctflow", "aswork", "asbench", "csfunds", "compmemo",
  "alerts", "fpawork", "audwork", "buwork", "plnwork", "entwork", "acctwork", "costwork", "compwork", "frepwork",
  "reports", "perf", "rcreports", "budexec", "budexec17", "budexec-forecast", "budexec-space", "budexec-reports", "entclaims08", "entclose09"
]);
const LOGIN_DEFAULT_ROUTE = "fpawork";
const LOGIN_DEFAULT_DEPT = "fpa";
const DEFAULT_ROUTE = LOGIN_DEFAULT_ROUTE;
const replaceRouteInUrl = (nextRoute) => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("route", nextRoute);
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch (error) {
    /* URL sync is best effort for local/file previews. */
  }
};

function StoreProvider({ children }) {
  const [lang, setLang] = useState(URL_LANG || "en");
  const [user, setUser] = useState(null);
  const initialRoute = ROUTE_ALLOWLIST.has(URL_ROUTE) ? URL_ROUTE : DEFAULT_ROUTE;
  const [route, setRoute] = useState(initialRoute);
  const [deptSub, setDeptSub] = useState(() => DEPARTMENT_BY_ROUTE[initialRoute]?.id || "fpa");
  const [cov, setCov] = useState("consolidated");
  const [alerts, setAlerts] = useState(ALERTS.map(a => ({ ...a, ack: false })));
  const [log, setLog] = useState([]);
  const [reports, setReports] = useState([
    { name: "rep_uc06", cov: "consolidated", conf: "—", ts: "2026-06-01 10:24", ref: "FBC-2026-1042", status: "pub" },
  ]);
  const [pendingQ, setPendingQ] = useState(null);
  const [perfJump, setPerfJump] = useState(null);
  const [backRoute, setBackRoute] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);   // UC-02 modal side-drawer
  const [curMode, setCurMode] = useState("riyal");   // riyal (⃁) default | sar
  const [group02, setGroup02] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem("fbc-group02-state");
      return mergeStoredGroup02State(stored ? JSON.parse(stored) : null);
    } catch (error) {
      return createInitialGroup02State();
    }
  });

  const dir = lang === "ar" ? "rtl" : "ltr";
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = dir; }, [lang, dir]);
  useEffect(() => {
    try { window.sessionStorage.setItem("fbc-group02-state", JSON.stringify(group02)); } catch (error) { /* session persistence is best effort */ }
  }, [group02]);

  const t = (k) => { const v = (I18N[lang] && I18N[lang][k] != null ? I18N[lang][k] : (I18N.en[k] != null ? I18N.en[k] : k)); return SHOW_UC ? v : sanitizeUc(v); };
  const tr = (o) => { const v = (o && typeof o === "object" ? (o[lang] != null ? o[lang] : (o.en != null ? o.en : o.ar)) : o); return SHOW_UC ? v : sanitizeUc(v); };
  const clean = (s) => (SHOW_UC ? s : sanitizeUc(s));

  const pushLog = (textKeyOrObj, extra) => {
    const ts = new Date().toLocaleTimeString(lang === "ar" ? "ar-SA" : lang === "zh" ? "zh-CN" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const text = typeof textKeyOrObj === "object" ? tr(textKeyOrObj) : (t(textKeyOrObj) + (extra ? " " + extra : ""));
    setLog((l) => [{ id: ++logSeq, ts, text }, ...l].slice(0, 40));
  };
  const addReport = (r) => setReports((rs) => {
    const ref = "FBC-2026-" + String(1000 + Math.floor(Math.random() * 9000));
    const ts = new Date().toLocaleString(lang === "ar" ? "ar-SA" : lang === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    pushLog("log_report", ref);
    return [{ ref, ts, cov, status: "review", ...r }, ...rs];
  });
  const ackAlert = (id) => setAlerts((as) => as.map(a => a.id === id ? { ...a, ack: true } : a));
  const askOrchestrator = (scn) => { setPendingQ(scn); setRoute("chat"); };
  const login = (role) => {
    setUser(role);
    setRoute(LOGIN_DEFAULT_ROUTE);
    setDeptSub(LOGIN_DEFAULT_DEPT);
    setBackRoute(null);
    setPendingQ(null);
    setPerfJump(null);
    setAlertsOpen(false);
    replaceRouteInUrl(LOGIN_DEFAULT_ROUTE);
  };
  const reset = () => { setAlerts(ALERTS.map(a => ({ ...a, ack: false }))); setLog([]); setBackRoute(null); setRoute(LOGIN_DEFAULT_ROUTE); setDeptSub(LOGIN_DEFAULT_DEPT); setPendingQ(null); replaceRouteInUrl(LOGIN_DEFAULT_ROUTE); };
  const cycleLang = () => setLang(l => (l === "ar" ? "en" : "ar")); // UI toggle: AR/EN only (zh via ?ln=zh)

  const updateGroup02 = (section, patch, auditEvent) => setGroup02((current) => {
    const timestamp = new Date().toLocaleString(lang === "ar" ? "ar-SA" : lang === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    const audit = auditEvent ? [{ id: `AUD-${1060 + current.audit.length}`, at: timestamp, ...auditEvent }, ...current.audit].slice(0, 30) : current.audit;
    if (section === "audit") return { ...current, audit };
    return { ...current, [section]: { ...(current[section] || {}), ...(patch || {}) }, audit };
  });

  const value = { lang, setLang, cycleLang, dir, t, tr, clean, user, setUser, login, route, setRoute, deptSub, setDeptSub, cov, setCov,
    alerts, ackAlert, log, pushLog, reports, addReport, pendingQ, setPendingQ, perfJump, setPerfJump, backRoute, setBackRoute, alertsOpen, setAlertsOpen, curMode, setCurMode, askOrchestrator, reset,
    group02, setGroup02, updateGroup02 };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

/* =========================================================================
   Icons & atoms
   ========================================================================= */
const GlobeIcon = (<svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg>);
const ArrowIcon = (<svg className="ic-svg ic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>);
const UserIcon = (<svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" /></svg>);
const NEXT_LANG_LABEL = { ar: "العربية", en: "English", zh: "中文" };

function KPI({ label, value, sub, tone, metricKey, configRoute }) {
  const { route } = useStore();
  const resolvedValue = metricKey ? getKpiDisplay(configRoute || route, metricKey, value) : value;
  const color = tone === "good" ? "var(--green)" : tone === "bad" ? "var(--danger)" : tone === "warn" ? "var(--amber)" : "var(--ink)";
  return (<div className={"kpi" + (tone ? " kpi-" + tone : "")}><div className="label">{label}</div>
    <div className="value" style={{ color }}>{resolvedValue}</div>{sub && <div className="sub">{sub}</div>}</div>);
}
function Section({ title, sub, right, children, className }) {
  return (<div className={"card pad acc" + (className ? " " + className : "")} style={{ marginBottom: 16 }}>
    <div className="page-h" style={{ marginBottom: sub ? 12 : 8 }}>
      <div><h2 style={{ fontSize: 16 }}>{title}</h2>{sub && <div className="sub muted">{sub}</div>}</div>{right}</div>
    {children}</div>);
}
function PageHeader({ title, sub, right }) { return (<div className="page-h"><div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>{right}</div>); }
// Inline SVG Saudi Riyal glyph — renders identically on every browser/font (no U+20C1 charset issue).
function RiyalGlyph() {
  return (<svg className="riyal" viewBox="0 0 24 24" aria-label="SAR" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4.5 V13.5 Q8 17 11.5 17" /><path d="M14 4.5 V13.5 Q14 17 17.5 17" /><path d="M5.5 8.6 L18.5 6.4" /><path d="M5.5 12.2 L18.5 10" /></svg>);
}
// Currency renders as plain "SAR" text.
function Money({ v }) { return <React.Fragment>{v}</React.Fragment>; }
function Chip({ sev, children }) { const c = sev === "red" ? "danger" : sev === "amber" ? "amber" : sev === "info" ? "info" : "gray"; return <span className={"chip " + c}>{children}</span>; }

function LineagePop() {
  const { t, tr } = useStore(); const [open, setOpen] = useState(false);
  return (<span style={{ position: "relative", display: "inline-block" }}>
    <button className="btn ghost sm" onClick={() => setOpen(o => !o)}>⌥ {t("lineage")}</button>
    {open && (<div className="card pad" style={{ position: "absolute", zIndex: 30, marginTop: 6, width: 300, insetInlineStart: 0, boxShadow: "var(--shadow)" }}>
      <div className="timeline">{LINEAGE.map((c, i) => (<div className="ev" key={i} style={{ paddingBottom: 12 }}><div style={{ fontSize: 12.5 }}>{tr(c)}</div></div>))}</div>
    </div>)}
  </span>);
}

/* =========================================================================
   Login
   ========================================================================= */
const ROLE_KEYS = ["analyst", "manager", "leader"];
const Skyline = (
  <svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="bldsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13796a" /><stop offset="0.55" stopColor="#0d5a4f" /><stop offset="1" stopColor="#093b35" /></linearGradient></defs>
    <rect width="1440" height="700" fill="url(#bldsky)" />
    <circle cx="1180" cy="150" r="60" fill="#1aa07f" opacity="0.25" />
    <g fill="#0c4a40"><rect x="40" y="420" width="120" height="280" /><rect x="200" y="360" width="90" height="340" /><rect x="330" y="300" width="70" height="400" /><rect x="430" y="440" width="110" height="260" /><rect x="580" y="250" width="60" height="450" /><rect x="660" y="330" width="100" height="370" /><rect x="800" y="280" width="80" height="420" /><rect x="900" y="420" width="120" height="280" /><rect x="1060" y="320" width="80" height="380" /><rect x="1170" y="380" width="100" height="320" /><rect x="1300" y="300" width="90" height="400" /></g>
  </svg>
);
function genCode() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function Login() {
  const { t, login, cycleLang } = useStore();
  const [role, setRole] = useState("analyst");
  const [code, setCode] = useState(genCode);
  const [showPwd, setShowPwd] = useState(false);
  const fb = (e, base) => { const im = e.currentTarget, f = im.dataset.f || "0"; if (f === "0") { im.dataset.f = "1"; im.src = "public/assets/" + base; } else if (f === "1") { im.dataset.f = "2"; im.src = "assets/" + base; } else im.style.display = "none"; };
  return (<div className="bld-login">
    <div className="bld-bg">{Skyline}</div>
    <img className="bld-photo" src="/assets/building.jpg" alt="" onError={e => fb(e, "building.jpg")} />
    <div className="bld-overlay" />
    <div className="bld-center"><div className="bld-wrap"><div className="bld-row2">
      <div className="bld-brand-area">
        <div className="bld-logo">
          <img className="bld-logo-img" src="/assets/logo.png" alt="MoMAH" onError={e => fb(e, "logo.png")} />
          <span className="bld-logo-cap">{t("brandLine")}</span>
        </div>
        <h3 style={{ color: "#fff" }}>{t("sso_title")}</h3>
        <p>{t("sso_sub")}</p>
      </div>
      <div className="bld-card-col"><div className="bld-card fade">
        <h2>{t("signInTitle")}</h2>
        <div className="bld-fg"><label>{t("identity")}</label>
          <div className="bld-inp"><span className="ic">👤</span>
            <select value={role} onChange={e => setRole(e.target.value)}>{ROLE_KEYS.map(rk => <option key={rk} value={rk}>{t(rk + "_full")}</option>)}</select>
            <span className="caret">▾</span></div>
        </div>
        <div className="bld-fg"><label>{t("password")}</label>
          <div className="bld-inp has-eye"><span className="ic">🔒</span>
            <input type={showPwd ? "text" : "password"} value="********" readOnly />
            <span className="eye" onClick={() => setShowPwd(s => !s)} title="Show/Hide">👁</span></div>
        </div>
        <div className="bld-hint">{t("loginHint")}</div>
        <div className="bld-captcha"><div className="bld-code"><span>{code}</span></div>
          <button className="bld-refresh" onClick={() => setCode(genCode())} title="Refresh">⟳</button>
          <input placeholder={t("securityCode")} maxLength={6} /></div>
        <button className="bld-btn" onClick={() => login(role)}>{t("login_btn")}</button>
        <div className="bld-or">{t("or_")}</div>
        <button className="bld-nic" onClick={() => login(role)}>
          <div className="bld-nic-grid"><i className="g" /><i className="k" /><i className="o" /><i className="k" /><i className="g" /><i className="k" /><i className="o" /><i className="k" /><i className="g" /></div>
          <div><div className="l1">{t("nic1")}</div><div className="l2">{t("nic2")}</div></div></button>
        <div className="bld-create">{t("noAccount")} <button>{t("createAccount")}</button></div>
        <div className="bld-langrow"><button className="bld-lang2" onClick={cycleLang}>{GlobeIcon} العربية / English</button></div>
      </div></div>
    </div></div></div>
    <div className="bld-copy">{t("copyright")} · {t("syntheticData")}</div>
  </div>);
}

/* =========================================================================
   Shell
   ========================================================================= */
const NOTIFS = [
  { sev: "danger", t: { en: "Budget overrun — Housing Program 2.0 at 103% of allocation", ar: "تجاوز الميزانية — برنامج الإسكان 2.0 عند 103٪ من المخصص", zh: "预算超支——住房计划 2.0 已达拨款的 103%" }, time: { en: "2m ago", ar: "قبل دقيقتين", zh: "2 分钟前" } },
  { sev: "warn", t: { en: "Billing gap SAR 120M flagged in Revenue Collection · FY2026 Q3", ar: "فجوة فوترة SAR 120M في التحصيل · FY2026 Q3", zh: "收入征收发现征收缺口 SAR 120M · FY2026 Q3" }, time: { en: "18m ago", ar: "قبل 18 د", zh: "18 分钟前" } },
  { sev: "warn", t: { en: "42 contracts overdue >60 days in Riyadh-East Amanah", ar: "42 عقداً متأخراً >60 يوماً في أمانة الرياض-شرق", zh: "利雅得-东阿玛纳有 42 个合同逾期 >60 天" }, time: { en: "1h ago", ar: "قبل ساعة", zh: "1 小时前" } },
  { sev: "info", t: { en: "Forecast variance: Q3 spend projected 8% above plan", ar: "انحراف التنبؤ: إنفاق الربع 3 أعلى من الخطة بـ 8٪", zh: "预测偏差:Q3 支出预计高于计划 8%" }, time: { en: "3h ago", ar: "قبل 3 س", zh: "3 小时前" } },
];
function TopBar() {
  const { t, tr, lang, cycleLang, user, setUser, reset, setRoute, route, alerts } = useStore();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const notifCount = notifRead ? 0 : NOTIFS.length;
  const fb = (e, base) => { const im = e.currentTarget, f = im.dataset.f || "0"; if (f === "0") { im.dataset.f = "1"; im.src = "public/assets/" + base; } else if (f === "1") { im.dataset.f = "2"; im.src = "assets/" + base; } else im.style.display = "none"; };
  const nextLang = lang === "ar" ? "en" : "ar";
  const openAlerts = alerts.filter(a => !a.ack).length;
  const tbtns = [["hub", "◧", "nav_hub"], ["chat", "✦", "nav_chat"], ["monitor", "◉", "nav_monitor"], ["reports", "📄", "nav_reports"]];
  return (<div className="topbar">
    <div className="brand">
      <img className="topbar-logo" src="/assets/logo.png" alt="MoMAH" onError={e => fb(e, "logo.png")} />
      <span className="topbar-sep" /><span className="topbar-app">{t("appName")}</span>
    </div>
    <div className="right">
      {URL_LANG === "zh" && tbtns.map(([r, ic, k]) => (<button key={r} className={"tbtn" + (route === r ? " on" : "")} onClick={() => setRoute(r)}>
        <span>{ic}</span><span className="tbtn-lbl">{t(k)}</span>{r === "monitor" && openAlerts ? <span className="badge-count">{openAlerts}</span> : null}</button>))}
      {URL_LANG === "zh" && <span className="topbar-sep" />}
      <button className="tbtn lang-pill" onClick={cycleLang}>{GlobeIcon} <span>{NEXT_LANG_LABEL[nextLang]}</span></button>
      <div className="notifmenu">
        <button className="tbtn notif-btn" onClick={() => setNotifOpen(o => !o)} title={tr({ en: "Notifications", ar: "الإشعارات", zh: "通知" })}>🔔{notifCount > 0 ? <span className="badge-count">{notifCount}</span> : null}</button>
        {notifOpen && <div className="panel notif-panel" onMouseLeave={() => setNotifOpen(false)}>
          <div className="notif-h"><b>{tr({ en: "Notifications", ar: "الإشعارات", zh: "通知" })}</b><button className="notif-clear" onClick={() => setNotifRead(true)}>{tr({ en: "Mark all read", ar: "تعليم الكل كمقروء", zh: "全部标为已读" })}</button></div>
          {NOTIFS.map((n, i) => (<div className={"notif-row " + n.sev + (notifRead ? " read" : "")} key={i}><span className="ni" /><div className="nx"><div className="nt"><Money v={tr(n.t)} /></div><div className="ntime">{tr(n.time)}</div></div></div>))}
        </div>}
      </div>
      <div className="usermenu">
        <button className="tbtn" onClick={() => setOpen(o => !o)}>{UserIcon} {t(user + "_full")} ▾</button>
        {open && <div className="panel" onMouseLeave={() => setOpen(false)}>
          <div style={{ padding: "6px 8px", fontWeight: 700 }}>{t(user + "_full")}</div>
          <div style={{ padding: "2px 8px 10px", fontSize: 12 }} className="muted">{t(user + "_desc")}</div>
          <div className="divider" style={{ margin: "6px 0" }} />
          <button className="btn ghost sm" style={{ width: "100%", marginBottom: 6 }} onClick={() => { reset(); setOpen(false); }}>↺ {t("resetDemo")}</button>
          <button className="btn danger sm" style={{ width: "100%" }} onClick={() => setUser(null)}>⎋ {t("logout")}</button>
        </div>}
      </div>
    </div>
  </div>);
}
function Sidebar() {
  const { t, tr, route, setRoute, deptSub, setDeptSub, setBackRoute } = useStore();
  const groupForDept = (deptId) => (DEPARTMENT_GROUPS.find(group => group.subs.some(sub => sub.id === deptId)) || {}).key;
  const routeDeptId = DEPARTMENT_BY_ROUTE[route]?.id;
  const activeDeptId = ACTIVE_DEPARTMENT_IDS.has(deptSub) ? deptSub : (routeDeptId || deptSub);
  const [openG, setOpenG] = useState(() => groupForDept(activeDeptId) || DEPARTMENT_BY_ROUTE[route]?.group || "g02");
  useEffect(() => {
    const activeGroup = groupForDept(activeDeptId) || DEPARTMENT_BY_ROUTE[route]?.group;
    if (activeGroup) setOpenG(activeGroup);
  }, [activeDeptId, route]);
  return (<div className="sidebar">
    <div className="sidebar-sub">{t("appName")}</div>
    {DEPARTMENT_GROUPS.map(g => {
      const open = openG === g.key;
      return (<div className="dept" key={g.key}>
        <div className={"dept-head" + (open ? " open" : "")} onClick={() => setOpenG(open ? "" : g.key)}>
          <span style={{ flex: 1 }}>{tr(g.name)}</span><span className="chev">{open ? "▾" : "▸"}</span>
        </div>
        {open && <div className="dept-subs">{g.subs.map(s => { const on = ACTIVE_DEPARTMENT_IDS.has(s.id);
          return <div key={s.id} className={"dept-sub" + (activeDeptId === s.id ? " active" : "") + (on ? "" : " locked")} onClick={on ? () => { setBackRoute(null); setDeptSub(s.id); setRoute(s.route); } : undefined}>{tr(s.name)}{on ? null : <span className="lockic">🔒</span>}</div>;
        })}</div>}
      </div>);
    })}
  </div>);
}
function AgentLog() {
  const { t, log } = useStore(); const last = log[0];
  return (<div className="agentlog"><span className="alh"><span className="live-dot" />{t("agentlog_h")}</span>
    <span className="alline">{last ? (<><b>{last.ts}</b> · {last.text}</>) : "—"}</span></div>);
}

/* =========================================================================
   Hub
   ========================================================================= */
function EngineGrid() {
  const { t } = useStore();
  return (<div className="eng-grid">{ENGINES.map(e => (<div key={e.key} className={"eng" + (e.key === "orch" ? " orch" : "")}>
    <div className="et">{e.icon} {t("eng_" + e.key)}</div><div className="ed">{t("engd_" + e.key)}</div>
    <div className="es"><span className="pulse" />{t("online")} · {e.lvl} · {t("autonomous")}</div></div>))}</div>);
}
function SourceStrip() {
  const { t } = useStore();
  return (<div className="src11">{SOURCES11.map(s => { const col = s.status === "ok" ? "var(--green)" : s.status === "amber" ? "var(--amber)" : "var(--danger)";
    return (<div key={s.key} className="s" title={s.sla + " · " + s.fresh + "%"}><div className="sk">{t("src_" + s.key)}</div><div className="sd" style={{ background: col }} /></div>); })}</div>);
}
function UtilChart() {
  const C = RC; if (!C || !C.ResponsiveContainer) return null;
  const data = UTIL_BY_AMANA.map((item) => ({
    ...item,
    v: getChartNumber("hub", "util_by_amana", item.k, "utilization", item.v),
  }));
  return (<div style={{ width: "100%", height: 220 }}><C.ResponsiveContainer>
    <C.BarChart data={data} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
      <C.XAxis dataKey="k" tick={{ fontSize: 11 }} /><C.YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
      <C.Tooltip formatter={(v) => v + "%"} contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} />
      <C.Bar dataKey="v" radius={[6, 6, 0, 0]} fill="#1B8354" /></C.BarChart></C.ResponsiveContainer></div>);
}
function Hub() {
  const { t, user, setRoute, alerts, askOrchestrator } = useStore();
  const journeys = [
    { ic: "✦", col: "#2563eb", name: "j_chat_n", body: "j_chat_b", route: "chat" },
    { ic: "◉", col: "#e29700", name: "j_mon_n", body: "j_mon_b", route: "monitor" },
    { ic: "▦", col: "#1B8354", name: "j_bud_n", body: "j_bud_b", route: "budget" },
    { ic: "🧾", col: "#6d5ae6", name: "j_clm_n", body: "j_clm_b", route: "claims" },
    { ic: "◭", col: "#13796a", name: "j_plan_n", body: "j_plan_b", route: "planning" },
    { ic: "▤", col: "#475467", name: "j_rep_n", body: "j_rep_b", route: "reporting" },
    { ic: "◓", col: "#0b3b34", name: "j_rev_n", body: "j_rev_b", route: "revassets" },
  ];
  const open = alerts.filter(a => !a.ack);
  return (<div className="fade">
    <PageHeader title={t("hub_hello") + " · " + t(user + "_full")} sub={t("hub_sub")} />
    <div className="shock"><span className="si">⚡</span><span className="stxt">{t("shock_banner")}</span>
      <button className="btn" onClick={() => askOrchestrator("q_overrun")}>✦ {t("runAssessment")}</button><span className="spill">{t("brief_urgent")}</span></div>
    <div className="cols-4" style={{ marginBottom: 16 }}>
      <KPI label={t("k_fiscal")} value="SAR 4.82B" tone="good" metricKey="available_fiscal_space" configRoute="hub" />
      <KPI label={t("k_alerts")} value={open.length} tone={open.length ? "bad" : "good"} metricKey="open_alerts" configRoute="hub" />
      <KPI label={t("k_util")} value="71.4%" tone="warn" metricKey="overall_utilization" configRoute="hub" /><KPI label={t("k_close")} value="92%" tone="good" metricKey="closure_rate" configRoute="hub" />
    </div>
    <Section title={t("engines_title")}><EngineGrid /></Section>
    <Section title={t("sources_title")} right={<span className="chip">● 13 {t("live")}</span>}><SourceStrip /></Section>
    <div className="cols-2">
      <Section title={t("journeys_title")}><div className="cols-2">
        {journeys.map(j => (<div key={j.route} className="card pad jcard" onClick={() => setRoute(j.route)}>
          <div className="jh"><span className="jn" style={{ background: j.col }}>{j.ic}</span><strong>{t(j.name)}</strong></div>
          <div className="jbody">{t(j.body)}</div><div className="jgo">{t("open")} {ArrowIcon}</div></div>))}
      </div></Section>
      <Section title={t("utilByAmana")}><UtilChart /></Section>
    </div>
    <Section title={t("latest_alerts")} right={<button className="btn secondary sm" onClick={() => setRoute("monitor")}>{t("view")} {ArrowIcon}</button>}>
      {open.length === 0 ? <div className="muted">{t("noAlerts")}</div> : open.slice(0, 3).map(a => (<AlertRow key={a.id} a={a} compact />))}
    </Section>
  </div>);
}

/* =========================================================================
   Assistant (chat)
   ========================================================================= */
function Viz({ kind }) { if (kind === "util") return <UtilChart />; return null; }
function ThinkBlock({ scnKey, idx }) {
  const { t } = useStore(); const steps = SCN[scnKey].steps;
  return (<div className="msg bot"><div className="av">✦</div><div className="bubble" style={{ minWidth: 260 }}>
    <div className="ai-scan"><span /></div>
    <div className="think">{steps.map((s, i) => { const state = i < idx ? "ok" : i === idx ? "act" : "";
      return (<div key={i} className={"tl " + state}><span className="ti">{i < idx ? "✓" : i === idx ? "◐" : "○"}</span><span>{t(s[1])} · <b>{t("eng_" + s[0])}</b></span></div>); })}</div>
  </div></div>);
}
function BotMsg({ scnKey, onAction }) {
  const { t, tr } = useStore(); const scn = SCN[scnKey];
  return (<div className="msg bot"><div className="av">✦</div><div className="bubble">
    {scn.type === "escalate" && <div style={{ marginBottom: 6 }}><span className="chip danger">⚠ {t("escalated")}</span> <span className="muted" style={{ fontSize: 12 }}>{t("esc_perm")}</span></div>}
    {scn.type === "cross" && <div className="banner" style={{ marginBottom: 8 }}>↪ {t("crossNote")}</div>}
    <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>{tr(scn.a)}</div>
    {scn.viz && <Viz kind={scn.viz} />}
    <div className="meta">{scn.conf != null && <span className="chip">{t("confidence")}: {scn.conf}%</span>}{(scn.srcs || []).map(s => <span key={s} className="chip gray">{t(s)}</span>)}</div>
    {(scn.actions || []).length > 0 && <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>{scn.actions.map((a, i) => <button key={i} className="btn secondary sm" onClick={() => onAction(a.to)}>{t(a.lk)} {ArrowIcon}</button>)}</div>}
    <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>🛈 {t("draftNote")}</div>
  </div></div>);
}
function ChatAnalysis() {
  const { t, pushLog, addReport, pendingQ, setPendingQ, setRoute } = useStore();
  const [msgs, setMsgs] = useState([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [think, setThink] = useState(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, think]);
  const run = (key, userText) => {
    const scn = SCN[key]; if (!scn || busy) return;
    setMsgs(m => [...m, { role: "user", text: userText || t(key) }]); setBusy(true); setThink({ scn: key, idx: 0 }); pushLog("log_route");
    let i = 0; const steps = scn.steps;
    const tick = () => { i++; if (i < steps.length) { setThink({ scn: key, idx: i }); setTimeout(tick, 600); } else { setThink(null); setBusy(false); setMsgs(m => [...m, { role: "bot", scn: key }]); if (scn.report) addReport({ name: scn.report, conf: scn.conf || "—" }); } };
    setTimeout(tick, 600);
  };
  useEffect(() => { if (pendingQ) { const q = pendingQ; setPendingQ(null); setTimeout(() => run(q), 250); } }, [pendingQ]);
  const submit = () => { const v = input.trim(); if (!v) return; setInput(""); const q = v.toLowerCase(); let key = "q_fiscal";
    if (/(dupl|مكرر|فاتورة|invoice|重复|发票)/.test(q)) key = "q_duplicate";
    else if (/(overrun|risk|تجاوز|خطر|超支|风险)/.test(q)) key = "q_overrun";
    else if (/(collect|تحصيل|征收)/.test(q)) key = "q_collection";
    else if (/(bank|sensitive|حساب|حساس|银行|敏感)/.test(q)) key = "q_vague";
    run(key, v); };
  return (<div className="fade">
    <PageHeader title={t("nav_chat")} sub={t("chat_sub")} />
    <div className="card pad acc">
      <div className="preset-row"><span className="muted" style={{ fontSize: 12, fontWeight: 700, alignSelf: "center" }}>{t("presets")}</span>
        {PRESETS.map(p => (<button key={p} className={"preset" + (p === "q_vague" ? " alt" : "")} disabled={busy} onClick={() => run(p)}>{t(p)}</button>))}</div>
      <div className="chat-wrap"><div className="chat-scroll">
        {msgs.length === 0 && <div className="muted" style={{ textAlign: "center", padding: "30px 0" }}>{t("draftNote")}</div>}
        {msgs.map((m, i) => m.role === "user" ? (<div key={i} className="msg user"><div className="av">{UserIcon}</div><div className="bubble">{m.text}</div></div>) : (<BotMsg key={i} scnKey={m.scn} onAction={(to) => setRoute(to)} />))}
        {think && <ThinkBlock scnKey={think.scn} idx={think.idx} />}<div ref={endRef} />
      </div>
        <div className="chat-input"><input className="input" placeholder={t("chat_ph")} value={input} disabled={busy} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          <button className="btn" disabled={busy || !input.trim()} onClick={submit}>{t("send")}</button></div>
      </div>
    </div>
  </div>);
}

/* =========================================================================
   Monitoring
   ========================================================================= */
function AlertRow({ a, compact }) {
  const { t, tr, clean, ackAlert, askOrchestrator } = useStore();
  return (<div className={"mon " + (a.sev === "red" ? "red" : a.sev === "amber" ? "amber" : "")} style={{ marginBottom: 10 }}>
    <div className="mh"><span className="mname"><Chip sev={a.sev}>{t("sev_" + a.sev)}</Chip> <span className="wo">{a.id}</span></span><span className="muted" style={{ fontSize: 11.5 }}>{clean(a.src)}</span></div>
    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{tr(a.t)}</div>
    {!compact && <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}><b>{t("rootCause")}:</b> {tr(a.rc)}</div>}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {a.scn && <button className="btn sm" onClick={() => askOrchestrator(a.scn)}>✦ {t("askOrch")}</button>}
      {!compact && (a.ack ? <span className="chip">✓ {t("acked")}</span> : <button className="btn secondary sm" onClick={() => ackAlert(a.id)}>{t("ack")}</button>)}
    </div>
  </div>);
}
function Monitoring() {
  const { t, pushLog, alerts } = useStore(); const [scanning, setScanning] = useState(false);
  const open = alerts.filter(a => !a.ack);
  const runScan = () => { if (scanning) return; setScanning(true); pushLog("log_scan"); setTimeout(() => { setScanning(false); pushLog("scanDone"); }, 1600); };
  return (<div className="fade">
    <PageHeader title={t("nav_monitor")} sub={t("mon_sub")} right={<button className="btn" disabled={scanning} onClick={runScan}>{scanning ? t("scanning") : "◉ " + t("runScan")}</button>} />
    {scanning && <div className="scan-bar" style={{ marginBottom: 14 }}><span /></div>}
    <Section title={t("srcHealth")}><SourceStrip /></Section>
    <Section title={t("alerts")} right={<span className="chip danger">{open.length}</span>}>{alerts.length === 0 ? <div className="muted">{t("noAlerts")}</div> : alerts.map(a => <AlertRow key={a.id} a={a} />)}</Section>
  </div>);
}

/* =========================================================================
   Storyline
   ========================================================================= */
function StoryChain({ nodes, storyKey, ran, runningIdx, view, setView }) {
  const { t, tr } = useStore();
  return (<div className="chain">{nodes.map((nd, i) => { const s = i === runningIdx ? "run" : i < ran ? "done" : "idle"; const col = s === "done" ? "var(--green)" : s === "run" ? "#6d5ae6" : null;
    return (<div key={i} className={"node " + (s === "run" ? "run" : s === "done" ? "done" : "")} onClick={() => i < ran && setView(i)} style={{ cursor: i < ran ? "pointer" : "default", outline: i === view ? "2px solid var(--green-100)" : "none" }}>
      <span className="node-dot" style={{ background: col || "#cbd5d0" }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: col || "inherit" }}>{nd.icon} {tr(nd.title)} {SHOW_UC && nd.uc ? <span className="tag" style={{ marginInlineStart: 6 }}>{nd.uc}</span> : null}</span>
      <span className="chain-metric">{s === "run" ? t("running") : i < ran ? getKpiDisplay(storyKey, `story.${i + 1}.metric`, tr(nd.metric)) : "—"}</span></div>); })}</div>);
}
function FiscalBox({ f }) {
  const { t } = useStore(); const rows = [["ceiling", f.ceiling, ""], ["commit", f.commit, "−"], ["planL", f.plan, "−"], ["reserve", f.reserve, "−"]];
  return (<div className="card pad" style={{ background: "#f8fbf9" }}>{rows.map(([k, v, sg]) => (<div className="report-row" key={k}><span>{t(k)}</span><span className="mono">{sg} {v.toFixed(2)}</span></div>))}
    <div className="report-row" style={{ borderTop: "1px dashed var(--line)", marginTop: 4, paddingTop: 8 }}><strong style={{ color: "var(--green-dark)" }}>{t("fiscalSpace")}</strong><strong className="mono" style={{ color: "var(--green)", fontSize: 17 }}>{f.space.toFixed(2)} B</strong></div></div>);
}
function ReviewCard({ node, decision, onApprove, onReject }) {
  const { t, tr } = useStore(); const r = node.review; const decided = decision === "approved" || decision === "rejected";
  return (<div className="ai-eval" style={{ borderInlineStartColor: "#6d5ae6" }}>
    <div className="banner" style={{ marginBottom: 8 }}>🛈 {t("draft")}</div>
    <div className="ai-eval-top"><span className="ai-eval-ic">✦</span><span className="ai-eval-h">{t("aiReco")}{SHOW_UC && node.uc ? " · " + node.uc : ""}</span></div>
    <div className="ai-eval-t" style={{ color: "var(--ink)", fontWeight: 700 }}>{tr(r.headline)}</div>
    <div style={{ margin: "8px 0" }}><div className="report-row" style={{ borderBottom: "none", padding: 0 }}><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{t("confidence")}</span><span className="mono" style={{ color: "var(--green-dark)", fontWeight: 800 }}>{r.conf}%</span></div><div className="progress" style={{ marginTop: 4 }}><span style={{ width: r.conf + "%" }} /></div></div>
    <div className="card pad" style={{ background: "#fff", fontSize: 12.5 }}><b>{t("why")}:</b> {tr(r.why)}</div>
    <div className="meta" style={{ marginTop: 8 }}><span className="muted" style={{ fontSize: 11.5, fontWeight: 700 }}>{t("sources")}:</span>{r.srcs.map(s => <span key={s} className="chip gray">{s}</span>)}<LineagePop /></div>
    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
      {!decided && <><button className="btn" onClick={onApprove}>✓ {t("approve")}</button><button className="btn danger" onClick={onReject}>✕ {t("reject")}</button><span className="muted" style={{ fontSize: 11.5, marginInlineStart: "auto", fontWeight: 700, color: "var(--amber)" }}>{t("pending")}</span></>}
      {decision === "approved" && <span className="chip">✓ {t("approved")}</span>}{decision === "rejected" && <span className="chip danger">✕ {t("rejected")}</span>}
    </div>
  </div>);
}
function ReportCard({ rep }) {
  const { tr } = useStore();
  return (<div className="report-card"><div className="rch"><span className="rt">📄 {tr(rep.title)}</span><LineagePop /></div>
    <div className="rcb"><div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{tr(rep.narrative)}</div>{rep.rows.map((r, i) => (<div className="report-row" key={i}><span>{tr(r.l)}</span><strong className="mono">{r.v}</strong></div>))}</div></div>);
}
function MiniKpi({ label, value, color }) {
  return (<div className="mini-kpi"><div className="muted">{label}</div><div className="v" style={color ? { color } : null}>{value}</div></div>);
}
function RevenueMini() {
  const { t, tr } = useStore();
  const totals = configuredRevenueTotals();
  const sources = configuredRevenueSources();
  return (<div>
    <div className="cols-3" style={{ marginBottom: 12 }}>
      <MiniKpi label={t("rev_billed")} value={(totals.billed / 1000).toFixed(2) + " B"} />
      <MiniKpi label={t("rev_collected")} value={(totals.collected / 1000).toFixed(2) + " B"} />
      <MiniKpi label={t("rev_rate")} value={totals.rate + "%"} color="var(--green-dark)" />
    </div>
    <div className="scrollx"><table className="tbl"><thead><tr><th>{t("rev_source")}</th><th className="right-num">{t("cc_net")}</th><th className="right-num">{t("cc_collected")}</th><th className="right-num">{t("rev_rate")}</th></tr></thead>
      <tbody>{sources.map(s => { var rate = (s.collected / s.net * 100).toFixed(1); return (<tr key={s.key}><td style={{ fontWeight: 600 }}>{tr(s.name)}</td><td className="right-num mono">{s.net}</td><td className="right-num mono">{s.collected}</td><td className="right-num mono" style={{ fontWeight: 700, color: parseFloat(rate) < 75 ? "var(--amber)" : "var(--green-dark)" }}>{rate}%</td></tr>); })}</tbody></table></div>
    <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{t("rev_excl")}: {totals.excl} M</div>
  </div>);
}
function PerfDevBlock() {
  const { t, tr } = useStore();
  const totals = configuredRevenueTotals();
  return (<div>
    <div className="cols-3" style={{ marginBottom: 12 }}>
      <MiniKpi label={t("rev_rate")} value={totals.rate + "%"} />
      <MiniKpi label={t("pd_growth")} value="+6.4%" color="var(--green-dark)" />
      <MiniKpi label={t("pd_excl")} value={totals.excl + " M"} />
    </div>
    <table className="tbl"><thead><tr><th>{t("pd_signal")}</th><th className="right-num">{t("pd_value")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{REV_DEVIATIONS.map((d, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{tr(d.a)}</td><td className="right-num mono">{d.v}</td><td><Chip sev={d.f}>{t("sev_" + d.f)}</Chip></td></tr>))}</tbody></table>
  </div>);
}
function AssetsBlock() {
  const { t, tr } = useStore();
  const stMap = { active: ["info", "st_active"], maint: ["amber", "st_maint"], impair: ["red", "st_impair"] };
  return (<div>
    <div className="cols-4" style={{ marginBottom: 12 }}>
      <MiniKpi label={t("as_auc")} value={ASSET_CAP.aucOpen.toFixed(2) + " B"} />
      <MiniKpi label={t("as_cap")} value={ASSET_CAP.capitalized.toFixed(2) + " B"} color="var(--green-dark)" />
      <MiniKpi label={t("as_impair")} value={ASSET_CAP.impair} color="var(--danger)" />
      <MiniKpi label={t("as_maint")} value={ASSET_CAP.maintDue} color="var(--amber)" />
    </div>
    <div className="scrollx"><table className="tbl"><thead><tr><th>{t("as_class")}</th><th className="right-num">{t("as_value")}</th><th className="right-num">{t("as_capd")}</th><th className="right-num">{t("as_life")}</th><th className="right-num">{t("as_ret")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{ASSET_REGISTER.map((a, i) => { var st = stMap[a.status]; return (<tr key={i}><td style={{ fontWeight: 600 }}>{tr(a.cls)}</td><td className="right-num mono">{a.value}</td><td className="right-num mono">{a.cap || "—"}</td><td className="right-num mono">{a.life}</td><td className="right-num mono">{a.ret}</td><td><Chip sev={st[0]}>{t(st[1])}</Chip></td></tr>); })}</tbody></table></div>
  </div>);
}
function CostBlock() {
  const { t, tr } = useStore();
  const fmap = { idle: ["amber", "st_idle"], ok: ["info", "st_ok"], pending: ["amber", "st_pending"] };
  return (<div>
    <div className="scrollx"><table className="tbl" style={{ marginBottom: 10 }}><thead><tr><th>{t("co_ao")}</th><th>{t("co_proj")}</th><th>{t("co_fund")}</th><th className="right-num">{t("co_alloc")}</th><th className="right-num">{t("co_spent")}</th><th className="right-num">{t("co_unit")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{ASSIGNMENT_ORDERS.map((o, i) => { var f = fmap[o.flag]; return (<tr key={i}><td><span className="wo">{o.id}</span></td><td style={{ fontWeight: 600 }}>{tr(o.proj)}</td><td className="muted">{tr(o.fund)}</td><td className="right-num mono">{o.alloc}</td><td className="right-num mono">{o.spent}</td><td className="right-num mono">{o.unit}</td><td><Chip sev={f[0]}>{t(f[1])}</Chip></td></tr>); })}</tbody></table></div>
    <span className="chip">✓ {t("co_comp")}</span>
  </div>);
}
function QueryAudit() {
  const { t } = useStore();
  return (<div className="card pad" style={{ background: "#f8fbf9", marginTop: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
      <strong style={{ fontSize: 13 }}>🔎 {t("qa_title")}</strong><span className="chip">{t("qa_scope")}</span></div>
    <div className="msg bot" style={{ maxWidth: "100%" }}><div className="av" style={{ background: "#1B8354" }}>✦</div><div className="bubble" style={{ fontSize: 12.5 }}>{t("qa_a")}</div></div>
    <div className="timeline" style={{ marginTop: 10 }}>
      <div className="ev"><div style={{ fontSize: 12 }}>{t("qa_log1")}</div></div>
      <div className="ev"><div style={{ fontSize: 12 }}>{t("qa_log2")}</div></div>
    </div>
  </div>);
}
function ForecastBlock() {
  const { t } = useStore(); const C = RC; if (!C || !C.ResponsiveContainer) return null;
  const chartData = FORECAST_OBLIG.map((row) => ({
    ...row,
    oblig: getChartNumber("planning", "forecast_obligations", row.m, "obligations", row.oblig),
    space: getChartNumber("planning", "forecast_obligations", row.m, "fiscal_space", row.space),
  }));
  return (<div>
    <div style={{ width: "100%", height: 240 }}><C.ResponsiveContainer>
      <C.ComposedChart data={chartData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
        <C.XAxis dataKey="m" tick={{ fontSize: 11 }} /><C.YAxis tick={{ fontSize: 11 }} />
        <C.Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} /><C.Legend wrapperStyle={{ fontSize: 11 }} />
        <C.Area type="monotone" dataKey="space" name={t("fc_space")} stroke="#1B8354" fill="#cdeede" />
        <C.Line type="monotone" dataKey="oblig" name={t("fc_oblig")} stroke="#e32700" strokeWidth={2.4} dot={{ r: 3 }} />
      </C.ComposedChart></C.ResponsiveContainer></div>
    <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t("fc_mape")} · SAR M</div>
  </div>);
}
function ScenarioBlock() {
  const { t } = useStore();
  return (<div className="scn-grid">
    {SCENARIOS.map(s => (<div key={s.key} className={"scn " + (s.key === "opt" ? "opt" : s.key === "pess" ? "pess" : "base")}>
      <div className="sct">{s.rec ? "★ " : ""}{t("sc_" + s.key)} {s.rec ? <span className="chip" style={{ marginInlineStart: 6 }}>{t("sc_rec")}</span> : null}</div>
      <div className="scrow"><span>{t("sc_space")}</span><b>{s.space.toFixed(2)} B</b></div>
      <div className="scrow"><span>{t("sc_oblig")}</span><b>{s.oblig.toFixed(2)} B</b></div>
      <div className="scrow"><span>{t("sc_cover")}</span><b style={{ color: s.cover === "watch" ? "var(--amber)" : "var(--green-dark)" }}>{t("cover_" + s.cover)}</b></div>
    </div>))}
  </div>);
}
function ClosingBlock() {
  const { t, tr } = useStore();
  const stMap = { matched: ["info", "cl_matched"], ureview: ["amber", "cl_ureview"], adjust: ["amber", "cl_adjust"] };
  return (<div>
    <div className="ar-leg" style={{ marginBottom: 12 }}>
      <span className="lgc"><span className="d" style={{ background: "var(--green)" }} />{t("cl_complete")} <span className="v">{t("cl_pass")}</span></span>
      <span className="lgc"><span className="d" style={{ background: "var(--amber)" }} />{t("cl_abnormal")} <span className="v">1 {t("cl_found")}</span></span>
      <span className="lgc"><span className="d" style={{ background: "var(--amber)" }} />{t("cl_missing")} <span className="v">2</span></span>
    </div>
    <div className="flow-col-h" style={{ marginBottom: 6 }}>{t("cl_recon")}</div>
    <div className="scrollx"><table className="tbl"><thead><tr><th>{t("cl_entity")}</th><th className="right-num">{t("cl_book")}</th><th className="right-num">{t("cl_system")}</th><th className="right-num">{t("cl_diff")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{RECON_ROWS.map((r, i) => { var st = stMap[r.st]; return (<tr key={i}><td style={{ fontWeight: 600 }}>{tr(r.ent)}</td><td className="right-num mono">{r.book}</td><td className="right-num mono">{r.sys}</td><td className="right-num mono" style={{ color: r.diff !== 0 ? "var(--amber)" : "var(--muted)" }}>{r.diff > 0 ? "+" : ""}{r.diff}</td><td><Chip sev={st[0]}>{t(st[1])}</Chip></td></tr>); })}</tbody></table></div>
    <div className="chip" style={{ marginTop: 8 }}>✎ {t("cl_entries")}: 2</div>
  </div>);
}
function NodeDetail({ node, decision, onApprove, onReject }) {
  const { t, tr } = useStore();
  return (<div className="card pad acc fade">
    <div className="page-h" style={{ marginBottom: 8 }}><div>{SHOW_UC && node.uc ? <span className="tag">{node.uc}</span> : null}<h2 style={{ fontSize: 16, display: "inline-block", marginInlineStart: SHOW_UC && node.uc ? 8 : 0 }}>{tr(node.title)}</h2><div className="sub muted" style={{ marginTop: 4 }}><b>{t("actor")}:</b> {tr(node.actor)}</div></div></div>
    <div style={{ fontSize: 13, marginBottom: 12 }}>{tr(node.desc)}</div>
    {node.kind === "agent" && node.table && (<table className="tbl" style={{ marginBottom: 12 }}><thead><tr>{tr(node.table.cols).map(c => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{node.table.rows.map((r, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{typeof r.a === "object" ? tr(r.a) : r.a}</td><td>{typeof r.v === "object" ? tr(r.v) : r.v}</td>{r.f !== undefined && <td><Chip sev={r.f}>{t("sev_" + r.f)}</Chip></td>}</tr>))}</tbody></table>)}
    {node.kind === "fiscal" && <div style={{ marginBottom: 12 }}><FiscalBox f={node.fiscal} /></div>}
    {node.kind === "revenue" && <div style={{ marginBottom: 12 }}><RevenueMini /></div>}
    {node.kind === "perfdev" && <div style={{ marginBottom: 12 }}><PerfDevBlock /></div>}
    {node.kind === "assets" && <div style={{ marginBottom: 12 }}><AssetsBlock /></div>}
    {node.kind === "cost" && <div style={{ marginBottom: 12 }}><CostBlock /></div>}
    {node.kind === "forecast" && <div style={{ marginBottom: 12 }}><ForecastBlock /></div>}
    {node.kind === "scenario" && <div style={{ marginBottom: 12 }}><ScenarioBlock /></div>}
    {node.kind === "closing" && <div style={{ marginBottom: 12 }}><ClosingBlock /></div>}
    {node.kind === "review" && <ReviewCard node={node} decision={decision} onApprove={onApprove} onReject={onReject} />}
    {node.kind === "report" && <ReportCard rep={node.report} />}
    {node.kind === "report" && node.queryaudit && <QueryAudit />}
    <div className="banner" style={{ marginTop: 12, background: "var(--green-50)", border: "1px solid var(--green-100)", color: "var(--green-dark)" }}>✓ <b>{t("output")}:</b> {tr(node.out)}</div>
  </div>);
}
function Storyline({ story, title, sub }) {
  const { t, tr, pushLog, addReport } = useStore(); const nodes = story.nodes;
  const [ran, setRan] = useState(0); const [runningIdx, setRunningIdx] = useState(-1); const [view, setView] = useState(0); const [decision, setDecision] = useState(null); const [busy, setBusy] = useState(false);
  const cur = ran > 0 ? nodes[Math.min(view, ran - 1)] : null;
  const reviewIdx = nodes.findIndex(n => n.kind === "review");
  const awaitingDecision = reviewIdx >= 0 && decision === null && ran - 1 === reviewIdx;
  const finished = ran === nodes.length;
  const runNext = () => { if (busy || awaitingDecision || finished) return; const i = ran; setBusy(true); setRunningIdx(i);
    setTimeout(() => { setRunningIdx(-1); setRan(i + 1); setView(i); setBusy(false); const nd = nodes[i]; const suffix = SHOW_UC && nd.uc ? " — " + nd.uc : ""; pushLog({ en: tr(nd.title) + suffix, ar: tr(nd.title) + suffix, zh: tr(nd.title) + suffix }); if (nd.kind === "report") { const rm = { budget: "rep_budget", claims: "rep_claims", revassets: "rep_revassets", planning: "rep_planning", reporting: "rep_reporting" }; addReport({ name: rm[story.key] || "rep_budget", conf: "—" }); } }, 850); };
  const decide = (d) => { setDecision(d); if (d === "approved") { pushLog("log_approve"); pushLog(nodes[reviewIdx].review.approveLog); } };
  const restart = () => { setRan(0); setRunningIdx(-1); setView(0); setDecision(null); setBusy(false); };
  return (<div className="fade">
    <PageHeader title={title} sub={sub} right={<button className="btn ghost sm" onClick={restart}>↺ {t("storyRestart")}</button>} />
    <Section title={SHOW_UC ? GCODE[story.key] : t("flow_steps")}>
      <StoryChain nodes={nodes} storyKey={story.key} ran={ran} runningIdx={runningIdx} view={view} setView={setView} />
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        {!finished && !awaitingDecision && <button className="btn" disabled={busy} onClick={runNext}>{busy ? t("storyRunning") : "▶ " + t("storyRun") + " (" + (ran + 1) + "/" + nodes.length + ")"}</button>}
        {awaitingDecision && <span className="chip amber">⏳ {t("pending")}</span>}{finished && <span className="chip">✓ {t("storyDone")}</span>}
      </div>
    </Section>
    {cur && <NodeDetail node={cur} decision={cur.kind === "review" ? decision : null} onApprove={() => decide("approved")} onReject={() => decide("rejected")} />}
  </div>);
}

/* =========================================================================
   UC-06 — Financial Performance Analysis (4-step report builder)
   ========================================================================= */
function Robot() {
  return (<div className="robot"><span className="robot-ring" />
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* antenna */}
      <line x1="48" y1="10" x2="48" y2="20" stroke="#7fe0b3" strokeWidth="2.5" strokeLinecap="round" />
      <circle className="r-ant" cx="48" cy="8" r="4" fill="#46d39a" />
      {/* head */}
      <rect x="20" y="20" width="56" height="46" rx="13" fill="#0d5a4f" stroke="#46d39a" strokeWidth="2" />
      <rect x="26" y="26" width="44" height="34" rx="9" fill="#06302b" />
      {/* eyes */}
      <g className="r-eye" style={{ transformOrigin: "38px 41px" }}><circle cx="38" cy="41" r="6.5" fill="#46d39a" /><circle cx="38" cy="41" r="2.5" fill="#eafff6" /></g>
      <g className="r-eye" style={{ transformOrigin: "58px 41px" }}><circle cx="58" cy="41" r="6.5" fill="#46d39a" /><circle cx="58" cy="41" r="2.5" fill="#eafff6" /></g>
      {/* mouth */}
      <rect x="40" y="52" width="16" height="3" rx="1.5" fill="#2fae84" />
      {/* scan line */}
      <rect className="r-scan" x="28" y="30" width="40" height="2" rx="1" fill="#7fe0b3" opacity="0.5" />
      {/* ears */}
      <rect x="14" y="36" width="6" height="14" rx="3" fill="#13796a" /><rect x="76" y="36" width="6" height="14" rx="3" fill="#13796a" />
      {/* body hint */}
      <rect x="32" y="68" width="32" height="14" rx="6" fill="#0d5a4f" stroke="#46d39a" strokeWidth="1.5" />
    </svg></div>);
}
function mapColor(rate) { return rate >= 75 ? "#1B8354" : rate >= 50 ? "#e29700" : "#e32700"; }
/* Real Saudi Arabia silhouette — sampled from a true country outline, normalized to viewBox 0 0 420 300 (bbox x48..372 / y12..288). */
const KSA_PATH = "M116.7 12 L108.8 15.3 L100.4 17.8 L92 20.3 L85.1 23.5 L90.8 30.1 L96.5 36.7 L95.7 42.6 L90.7 49.4 L82.2 51.4 L76.4 57.4 L70.1 63.5 L61.5 62.3 L52.8 60.9 L50.5 69 L49 77.7 L47.7 84.2 L55.1 83.8 L60.3 90.7 L65 98 L69.6 105.3 L74.2 112.7 L79.4 119.5 L83.3 125.9 L87.8 133.3 L87.7 140.7 L92.1 148.2 L99.9 151.5 L106.5 156.9 L110.5 164.6 L114 172 L116.4 178.1 L114.9 186.4 L117.6 194.6 L118.8 202.8 L123.6 209.5 L129.8 215.1 L137.4 219.1 L143 224.8 L146.3 232.2 L149.7 239.4 L153.6 246.8 L157.9 254.4 L164.6 259.9 L168.6 266.8 L172.9 274.1 L178.1 275.9 L179.4 268.9 L182 261.1 L189.9 262.7 L198.4 261.5 L206.7 264.3 L214.8 267.6 L222.9 270.9 L229 275.6 L229 284.4 L231.3 288 L237.1 281.5 L242.9 274.9 L248.8 268.4 L254.6 261.8 L260.4 255.3 L266.3 248.7 L274.4 246.1 L283 244.1 L291.5 242.1 L300.1 240.1 L308.6 238 L317.1 235.9 L325.4 233 L333.7 230.1 L341.9 227.2 L350.2 224.3 L358.5 221.4 L364.7 216.5 L367.2 208.1 L369.8 199.7 L372.3 191.3 L371.7 183.2 L367 175.8 L358.8 175.3 L350.1 174.1 L341.4 172.9 L332.7 171.7 L324.7 169 L319.2 162.2 L313.7 155.3 L309 148.2 L308.6 143.2 L300.9 142.7 L295.8 136.3 L292.4 128.6 L289.8 124.4 L285.9 116.8 L288.2 111.9 L287.4 106.7 L280.8 101.6 L275 96.3 L272.1 92.4 L268 89 L264.3 82.8 L261 75.3 L252.2 75.1 L247.3 69.2 L239.7 66.3 L231.1 65.7 L222.3 65.2 L213.6 64.3 L204.9 63.4 L197.9 58.3 L191.1 52.8 L184.3 47.2 L177.6 41.6 L170.8 36 L164.1 30.4 L156.3 26.5 L148.7 22.2 L141.4 17.2 L133.6 13.6 L124.9 12 Z";
function KsaMap({ small }) {
  const { t, tr } = useStore();
  const [hov, setHov] = useState(null);
  const stObj = (r) => r >= 75 ? { en: "Strong", ar: "قوي", zh: "强" } : r >= 50 ? { en: "Watch", ar: "مراقبة", zh: "关注" } : { en: "Alert", ar: "تنبيه", zh: "预警" };
  return (<div>
    <svg viewBox="0 0 420 300" className="ksa-map-svg" style={small ? { width: "100%", height: 220 } : { width: "100%", maxWidth: 392, height: "auto", display: "block", margin: "0 auto" }}>
      <defs><clipPath id="ksaClip"><path d={KSA_PATH} /></clipPath></defs>
      {/* base land (soft yellow) */}
      <path d={KSA_PATH} fill="#fdf3d6" stroke="#1B8354" strokeWidth="1.6" strokeLinejoin="round" />
      {/* pastel administrative regions, clipped to the country outline */}
      <g clipPath="url(#ksaClip)">
        <ellipse cx="152" cy="46" rx="150" ry="52" fill="#fbe0e6" />
        <ellipse cx="100" cy="142" rx="74" ry="88" fill="#fbe0e6" />
        <ellipse cx="206" cy="277" rx="72" ry="30" fill="#fbe0e6" />
        <ellipse cx="198" cy="250" rx="42" ry="34" fill="#d6f0e0" />
      </g>
      {/* faint region dividers */}
      <g clipPath="url(#ksaClip)" stroke="#c8b696" strokeWidth="0.8" opacity="0.45" fill="none">
        <path d="M150 28 L182 120 L212 205" /><path d="M252 58 L242 160 L232 252" /><path d="M118 92 L210 132 L312 150" />
      </g>
      <path d={KSA_PATH} fill="none" stroke="#1B8354" strokeWidth="1.6" strokeLinejoin="round" />
      {UC_MAP.map(m => (<g key={m.id} className="map-mk" style={{ cursor: "pointer" }} onMouseEnter={() => setHov(m)} onMouseLeave={() => setHov(null)}>
        <circle cx={m.x} cy={m.y} r={hov === m ? (small ? 6.5 : 7.5) : (small ? 4.5 : 5.5)} fill={mapColor(m.rate)} stroke="#fff" strokeWidth="1.5" />
        {!small && <text x={m.x + 8} y={m.y + 3} className="map-mk-l">{tr(m.name)}</text>}</g>))}
      {hov && (() => { const lab = tr(hov.name) + " · " + hov.rate + "% · " + tr(stObj(hov.rate)); const w = Math.max(64, lab.length * 4.4 + 14);
        const tx = Math.min(Math.max(hov.x - w / 2, 4), 416 - w); const ty = hov.y - 24 < 4 ? hov.y + 12 : hov.y - 24;
        return (<g pointerEvents="none"><rect x={tx} y={ty} width={w} height="17" rx="4" fill="#16211c" opacity="0.94" />
          <text x={tx + 7} y={ty + 11.5} fill="#fff" fontSize="8.5" fontWeight="700">{lab}</text></g>); })()}
    </svg>
    {!small && <div className="map-legend"><span className="lg"><i style={{ background: "#1B8354" }} />{t("lg_green")}</span><span className="lg"><i style={{ background: "#e29700" }} />{t("lg_yellow")}</span><span className="lg"><i style={{ background: "#e32700" }} />{t("lg_red")}</span></div>}
  </div>);
}
function GMap() {
  const { t, tr } = useStore();
  return (<div>
    <div className="gmap-wrap">
      <iframe title="Saudi Arabia" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
        src="https://maps.google.com/maps?q=Saudi%20Arabia&t=&z=5&ie=UTF8&iwloc=&output=embed" />
      <div className="gmap-overlay">{UC_MAP.map(m => (<span key={m.id} className="gmap-pin" title={tr(m.name) + " · " + m.rate + "%"}
        style={{ left: (m.x / 420 * 100) + "%", top: (m.y / 300 * 100) + "%", background: mapColor(m.rate) }} />))}</div>
    </div>
    <div className="map-legend"><span className="lg"><i style={{ background: "#1B8354" }} />{t("lg_green")}</span><span className="lg"><i style={{ background: "#e29700" }} />{t("lg_yellow")}</span><span className="lg"><i style={{ background: "#e32700" }} />{t("lg_red")}</span></div>
    <div className="gmap-cap">{t("mapNote")}</div>
  </div>);
}
function SpendChart({ small }) {
  const { t } = useStore(); const C = RC; if (!C || !C.ResponsiveContainer) return null;
  return (<div style={{ width: "100%", height: small ? 200 : 250 }}><C.ResponsiveContainer>
    <C.ComposedChart data={UC_SPEND} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} /><C.XAxis dataKey="m" tick={{ fontSize: 11 }} /><C.YAxis tick={{ fontSize: 11 }} />
      <C.Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} /><C.Legend wrapperStyle={{ fontSize: 11 }} />
      <C.Bar dataKey="budget" name={t("spend_budget")} fill="#F8C630" radius={[5, 5, 0, 0]} /><C.Bar dataKey="actual" name={t("spend_actual")} fill="#1B8354" radius={[5, 5, 0, 0]} />
      <C.Line dataKey="actual" name={t("spend_trend")} stroke="#085D3A" strokeWidth={2} dot={{ r: 3 }} />
    </C.ComposedChart></C.ResponsiveContainer></div>);
}
function ServiceBars() {
  const { tr } = useStore();
  return (<div>{UC_SERVICES.map((s, i) => (<div className="svc-row" key={i}>
    <div className="sh"><span>{tr(s.name)}</span><span className="mono" style={{ color: "var(--green-dark)" }}>{s.pct}%</span></div>
    <div className="progress"><span style={{ width: s.pct + "%" }} /></div>
    <div className="ss">{tr({ en: "Actual", ar: "فعلي", zh: "实际" })}: {s.actual} M / {tr({ en: "Budget", ar: "ميزانية", zh: "预算" })}: {s.budget} M</div></div>))}</div>);
}
function VisionTable() {
  const { t, tr } = useStore();
  return (<table className="tbl"><thead><tr><th>{t("vp_init")}</th><th>{t("vp_port")}</th><th className="right-num">{t("vp_budget")}</th><th className="right-num">{t("vp_actual")}</th><th className="right-num">{t("vp_rem")}</th><th className="right-num">{t("vp_rate")}</th></tr></thead>
    <tbody>{UC_VISION.map((v, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{v.name}</td><td className="muted">{tr(v.port)}</td><td className="right-num mono">{v.b}</td><td className="right-num mono">{v.a}</td><td className="right-num mono">{v.r}</td><td className="right-num mono" style={{ fontWeight: 700, color: parseFloat(v.rate) < 90 ? "var(--amber)" : "var(--green-dark)" }}>{v.rate}</td></tr>))}</tbody></table>);
}
function RevenueSplit() {
  const { t, tr } = useStore(); const C = RC; if (!C || !C.ResponsiveContainer) return null;
  const data = configuredRevenueSources().map(s => ({ name: tr(s.name), collected: s.collected, outstanding: s.net - s.collected, weight: s.weight, color: s.color }));
  return (<div style={{ width: "100%", height: 280 }}><C.ResponsiveContainer>
    <C.ComposedChart data={data} margin={{ top: 22, right: 8, left: -14, bottom: 0 }}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
      <C.XAxis dataKey="name" tick={{ fontSize: 9.5 }} interval={0} /><C.YAxis yAxisId="l" tick={{ fontSize: 10 }} />
      <C.YAxis yAxisId="r" orientation="right" domain={[0, 40]} tickFormatter={v => v + "%"} tick={{ fontSize: 10 }} />
      <C.Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} /><C.Legend wrapperStyle={{ fontSize: 11 }} />
      <C.Bar yAxisId="l" dataKey="collected" name={t("rs_collected")} stackId="s">{data.map((d, i) => <C.Cell key={i} fill={d.color} />)}</C.Bar>
      <C.Bar yAxisId="l" dataKey="outstanding" name={t("rs_outstanding")} stackId="s" fill="#d0d5dd" radius={[5, 5, 0, 0]} />
      <C.Line yAxisId="r" dataKey="weight" name={t("rs_weight")} stroke="#e32700" strokeWidth={2} dot={{ r: 3, fill: "#e32700" }}>
        <C.LabelList dataKey="weight" position="top" formatter={v => v + "%"} style={{ fontSize: 10, fill: "#e32700", fontWeight: 700 }} /></C.Line>
    </C.ComposedChart></C.ResponsiveContainer></div>);
}
function CollectionRate() {
  const { t, tr } = useStore();
  return (<div className="fd-scroll">{configuredRevenueSources().map(s => { const rate = s.collected / s.net * 100;
    return (<div className="col-card" key={s.key}>
      <div className="cch"><span className="ccname">{tr(s.name)}</span><span className="ccpct">{rate.toFixed(1)}%</span></div>
      <div className="progress"><span style={{ width: rate + "%" }} /></div>
      <div className="ccgrid"><div><div className="ccl">{t("cc_collected")}</div><div className="ccv">{s.collected} M</div></div><div><div className="ccl">{t("cc_net")}</div><div className="ccv">{s.net} M</div></div></div>
    </div>); })}</div>);
}
function ReceivableProg() {
  const { t } = useStore();
  const matrix = AR_MATRIX.map((row) => ({
    ...row,
    v: row.v.map((value, index) => getChartNumber("revassets", "receivable_aging_matrix", `${keyify(row.m)}.${index + 1}`, `bucket_${index + 1}`, value)),
  }));
  return (<div>
    <div className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>{t("rp_caption")}</div>
    <div className="ar-leg">{AR_LEGEND.map(l => (<span className="lgc" key={l.k}><span className="d" style={{ background: l.c }} />{t(l.k)} <span className="v">{l.v}</span></span>))}</div>
    <div className="card pad" style={{ background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}><strong style={{ fontSize: 13 }}>{t("rp_matrix")}</strong><span className="muted" style={{ fontSize: 11 }}>{t("rp_unit")}</span></div>
      <div className="scrollx"><table className="heat"><thead><tr><th></th>{AR_BUCKETS.map(b => <th key={b}>{b === "buck_current" ? t("buck_current") : b}</th>)}</tr></thead>
        <tbody>{matrix.map(r => (<tr key={r.m}><td className="rh">{r.m}</td>{r.v.map((v, i) => { const c = arHeat(v); return <td key={i} className="cell" style={{ background: c[0], color: c[1] }}>{v.toFixed(1)}%</td>; })}</tr>))}</tbody></table></div>
    </div>
  </div>);
}
function RegionalAchieve() {
  const { t, tr } = useStore();
  const rows = REGIONAL_ACHIEVE.map((row) => {
    const itemKey = keyify(row.name.en);
    return {
      ...row,
      pct: getChartNumber("revassets", "regional_achievement", itemKey, "actual_rate", row.pct),
      target: getChartNumber("revassets", "regional_achievement", itemKey, "target_rate", row.target),
    };
  });
  return (<div className="fd-scroll">{rows.map((r, i) => { const gap = +(r.target - r.pct).toFixed(1); const status = gap <= 0 ? "above" : gap <= 3 ? "near" : "below";
    return (<div className="ach-card" key={i}>
      <div className="ach-head"><span className="ach-name">{tr(r.name)}</span><span className="ach-pct" style={{ color: status === "below" ? "var(--danger)" : "var(--green-dark)" }}>{r.pct}%</span></div>
      <div className="ach-track"><div className="ach-fill" style={{ width: r.pct + "%", background: status === "below" ? "var(--amber)" : "var(--green)" }} /><div className="ach-target" style={{ insetInlineStart: r.target + "%" }} /></div>
      <div className="ach-meta"><span>{t("ra_target")}: <b>{r.target}%</b></span><span>{t("ra_gap")}: <b>{gap}%</b></span><span className={"ach-status " + status}>{t("st_" + status)}</span></div>
    </div>); })}</div>);
}
function UcSteps({ step, setStep, reached }) {
  const { t } = useStore(); const labels = ["s1", "s2", "s3", "s4"];
  return (<div className="uc-steps">{labels.map((lb, i) => { const n = i + 1; const cls = step === n ? "on" : reached >= n ? "done" : "";
    return (<React.Fragment key={lb}>{i > 0 && <span className="uc-sep">›</span>}
      <button className={"uc-step " + cls} onClick={() => reached >= n && setStep(n)}><span className="n">{reached > n ? "✓" : n}</span>{t(lb)}</button></React.Fragment>); })}</div>);
}
function UcDashboard({ onCommentary }) {
  const { t } = useStore();
  const tagCls = { up: "up", flat: "flat", down: "down" };
  return (<div className="fade">
    <div className="cols-2" style={{ marginBottom: 16, alignItems: "start" }}>
      <div className="scope"><div className="sl">{t("scope_sum")}</div>
        <div style={{ margin: "6px 0", fontWeight: 700 }}>Ministry / All Amanas / All Municipalities / Apr 2026</div>
        <div className="objbar"><b>[{t("obj_sum")}]</b> Original 16,532M · Current 17,370M · Actual 11,117M · Remaining 6,253M · Rate 64.0% · Δ 838M · <b>{t("balance_check")}</b></div></div>
      <div style={{ textAlign: "end" }}><button className="btn secondary">{t("viewData")} 📊</button></div>
    </div>
    <div className="aibrief" style={{ marginBottom: 16 }}><div style={{ flex: 1 }}><div className="abh">✦ {t("ai_brief")}</div><div className="abx"><UcBriefText /></div></div><button className="btn" onClick={onCommentary}>{t("goCommentary")} {ArrowIcon}</button></div>
    <div className="cols-3" style={{ marginBottom: 14 }}>{UC_KPIS.slice(0, 3).map(k => (<div className="kpi k6" key={k.key}><span className={"ktag " + tagCls[k.tag]}>{t("tag_" + k.tag)}</span><div className="label">{t(k.key)}</div><div className="value">{k.value} <span style={{ fontSize: 16 }}>{k.unit === "%" ? "%" : k.unit + " SAR"}</span></div><div className="sub muted">{t(k.sub)}</div></div>))}</div>
    <div className="cols-4" style={{ marginBottom: 16 }}>{UC_KPIS.slice(3).map(k => (<div className="kpi k6" key={k.key}><span className={"ktag " + tagCls[k.tag]}>{t("tag_" + k.tag)}</span><div className="label">{t(k.key)}</div><div className="value" style={{ fontSize: 24 }}>{k.value}<span style={{ fontSize: 13 }}>{k.unit === "%" ? "%" : " " + k.unit}</span></div><div className="sub muted">{t(k.sub)}</div></div>))}</div>
    <div className="cols-2" style={{ alignItems: "start" }}>
      <Section title={t("map_title")} sub={t("map_sub")}><div className="ksa-map"><KsaMap /></div></Section>
      <Section title={t("spend_title")}><div className="spend-center"><SpendChart /></div></Section>
    </div>
    <h2 style={{ fontSize: 16, margin: "6px 0 12px" }}>{t("fdetail")}</h2>
    <div className="cols-2">
      <Section title={t("rev_split")}><RevenueSplit /></Section>
      <Section title={t("col_rate")}><CollectionRate /></Section>
    </div>
    <div className="cols-2">
      <Section title={t("recv_prog")}><ReceivableProg /></Section>
      <Section title={t("reg_ach")}><RegionalAchieve /></Section>
    </div>
    <div className="cols-2"><Section title={t("svc_title")}><ServiceBars /></Section><Section title={t("vision_title")}><div className="scrollx"><VisionTable /></div></Section></div>
  </div>);
}
function UcBriefText() { const { tr } = useStore(); return <>{tr({ en: "Asir Amana performs best at the moment, Al Baha Amana needs closer follow-up, and Developmental Housing plus Housing Program 2.0 remain the largest concentrations in the sample.", ar: "أمانة عسير هي الأفضل أداءً حالياً، وأمانة الباحة تحتاج متابعة أدق، ويظل الإسكان التنموي وبرنامج الإسكان 2.0 أكبر التركزات في العينة.", zh: "阿西尔阿玛纳目前表现最佳,巴哈阿玛纳需更密切跟进,发展性住房与住房计划 2.0 仍是样本中最大的集中点。" })}</>; }
function MiniChart({ kind }) {
  if (kind === "map") return <div className="ksa-map"><KsaMap small /></div>;
  if (kind === "spend") return <SpendChart small />;
  if (kind === "svc") return <ServiceBars />;
  if (kind === "vision") return <div className="scrollx"><VisionTable /></div>;
  if (kind === "kpi") { const { t } = useStore(); return (<div className="cols-2">{UC_KPIS.slice(0, 4).map(k => (<div className="kpi k6" key={k.key}><div className="label" style={{ fontSize: 12 }}>{t(k.key)}</div><div className="value" style={{ fontSize: 20 }}>{k.value}</div></div>))}</div>); }
  return <div className="muted" style={{ padding: 20, textAlign: "center" }}>—</div>;
}
const AI_OPT = { en: "[AI Optimized]: The executive report indicates that Asir Amana performs best at the moment, Al Baha Amana needs closer follow-up, and Developmental Housing plus Housing Program 2.0 remain the largest concentrations in the sample. (Adjusted specifically to emphasize the expenditure variance factors).", ar: "[محسّن بالذكاء الاصطناعي]: يشير التقرير التنفيذي إلى أن أمانة عسير هي الأفضل حالياً، وتحتاج أمانة الباحة إلى متابعة أوثق، ويبقى الإسكان التنموي وبرنامج الإسكان 2.0 أكبر التركّزات في العينة. (عُدّل خصيصاً لإبراز عوامل تباين الإنفاق).", zh: "[AI 优化]:执行报告显示 Asir Amana 目前表现最佳,Al Baha Amana 需要更密切跟进,发展性住房与住房计划 2.0 仍是样本中最大的集中点。(已专门调整以强调支出差异因素)。" };
function UcCommentary({ onAssemble }) {
  const { t, tr } = useStore();
  const [sel, setSel] = useState(0); const [rt, setRt] = useState("rt_exec");
  const slide = UC_SLIDES[sel];
  const [texts, setTexts] = useState(UC_SLIDES.map(s => tr(s.narr)));
  const setText = (v) => setTexts(ts => ts.map((x, i) => i === sel ? v : x));
  const [chat, setChat] = useState([{ role: "ai", text: t("copilot_hello") }]);
  const [cin, setCin] = useState(""); const [cbusy, setCbusy] = useState(false);
  const cRef = useRef(null);
  const sendChat = () => {
    if (!cin.trim() || cbusy) return; const u = cin.trim(); setCin(""); setCbusy(true);
    setChat(c => [...c, { role: "u", text: u }]);
    setTimeout(() => { setChat(c => [...c, { role: "ai", text: tr(AI_OPT), opt: true }]); setCbusy(false); }, 800);
  };
  useEffect(() => { const el = cRef.current; if (el) el.scrollTop = el.scrollHeight; }, [chat, cbusy]);
  return (<div className="fade">
    <div className="card pad cw-headcard"><PageHeader title={t("cw_title")} sub={t("cw_sub")} right={<span className="sect-right"><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{t("finalType")}:</span><select className="input" style={{ width: "auto" }} value={rt} onChange={e => setRt(e.target.value)}><option value="rt_exec">{t("rt_exec")}</option><option value="rt_init">{t("rt_init")}</option><option value="rt_detail">{t("rt_detail")}</option></select></span>} /></div>
    <div className="cw-shell">
      <div className="cw-main">
        <div className="cw-main-grid">
          <div className="slide-col"><div className="flow-col-h" style={{ marginBottom: 8 }}>{t("slidePages")}</div>
            <div className="slide-frame"><div className="slide-list">
              {UC_SLIDES.map((s, i) => (<div key={s.id} className={"slide-thumb" + (i === sel ? " sel" : "")} onClick={() => setSel(i)}><div className="stt"><span className="stchk">✓</span> {tr(s.title)}</div><div className="sk" /></div>))}
            </div></div>
            <div className="flow-col-h" style={{ margin: "16px 0 8px" }}>{t("dataTables")}</div>
            <div className="slide-tables">{t("addTables")} <span className="cyc">▾</span></div>
          </div>
          <div className="slide-card"><div className="sch"><span style={{ fontWeight: 700 }}>{tr(slide.title)}</span><span className="chip" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{t("aiConf")}: 94%</span></div>
            <div className="scb"><div><div className="flow-col-h" style={{ marginBottom: 6 }}>{t("narrComment")}</div>
              <textarea className="narr-edit" value={texts[sel]} onChange={e => setText(e.target.value)} />
              <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}><b>{t("dataSrcLink")}:</b> {t("dataSrcVal")}</div>
              <div className="chip" style={{ marginTop: 6 }}>✓ {t("mathOk")}</div></div>
              <div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span className="flow-col-h">{t("chartLabel")}</span><span className="tag">{t("chart_" + slide.chart)}</span></div><MiniChart kind={slide.chart} /></div></div>
          </div>
        </div>
        <div className="cw-actions">
          <span style={{ display: "flex", gap: 8 }}><button className="btn ghost sm">⇄ {t("showDiff")}</button><button className="btn secondary sm">💬 {t("discussAI")}</button></span>
          <button className="btn" onClick={onAssemble}>{t("assemble")} {ArrowIcon}</button>
        </div>
      </div>
      <div className="copilot"><div className="cph">💬 {t("copilot_h")}</div>
        <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>{t("copilot_target")}</div>
        <select className="input" style={{ marginBottom: 10 }} value={sel} onChange={e => setSel(+e.target.value)}>{UC_SLIDES.map((s, i) => <option key={s.id} value={i}>{tr(s.title)}</option>)}</select>
        <div className="cpmsgs" ref={cRef}>
          {chat.map((m, i) => (<div key={i} className={"cpmsg " + m.role + (m.opt ? " opt" : "")}>{m.text}</div>))}
          {cbusy && <div className="cpmsg ai think"><span className="wb-typing"><i /><i /><i /></span></div>}
        </div>
        <div style={{ marginTop: "auto" }}><div className="chat-input"><input className="input" value={cin} onChange={e => setCin(e.target.value)} placeholder={t("copilot_ph")} onKeyDown={e => e.key === "Enter" && sendChat()} /><button className="btn-ai btn" onClick={sendChat}>✦</button></div></div>
      </div>
    </div>
  </div>);
}
function UcReport({ onBack }) {
  const { t, tr, cov, addReport, pushLog } = useStore();
  const slides = [{ id: "cover", cover: true }].concat(UC_SLIDES);
  const [pg, setPg] = useState(0); const [submitted, setSubmitted] = useState(false);
  const total = slides.length; const s = slides[pg];
  const submit = () => { if (submitted) return; setSubmitted(true); addReport({ name: "rep_uc06", conf: "94" }); pushLog("log_uc06"); };
  return (<div className="fade">
    <div className="page-h"><button className="btn ghost sm" onClick={onBack}>↩ {t("backWs")}</button>
      <span className="sect-right"><span className={"status-pill " + (submitted ? "review" : "draft")}>{submitted ? t("st_review") : t("st_draft")}</span>
        <button className="btn" disabled={submitted} onClick={submit}>{submitted ? "✓ " + t("submitted") : t("submitReview") + " ✈"}</button>
        <button className="btn secondary sm" disabled>{t("exportPptx")}</button><button className="btn ghost sm" disabled>{t("exportPdf")}</button></span></div>
    <div className="deck-grid">
      <div><div className="flow-col-h" style={{ marginBottom: 8 }}>{t("slidePages")}</div><div className="slide-list">
        {slides.map((sl, i) => (<div key={i} className={"slide-thumb" + (i === pg ? " sel" : "")} onClick={() => setPg(i)}><div className="stt">{sl.cover ? "🏛 " + t("rt_exec") : tr(sl.title)}</div><div className="sk" /></div>))}
      </div></div>
      <div className="deck-card">
        <div className="deck-head"><strong>{s.cover ? "COVER" : tr(s.title)}</strong><span className="muted" style={{ fontSize: 12 }}>{t("cover_min")} · {t("page")} {pg + 1} {t("of")} {total}</span></div>
        {s.cover ? (<div className="deck-cover"><div className="dc-sub">{t("cover_country")}</div><div className="dc-sub">{t("cover_min")}</div>
          <div className="dc-title">{t("rt_exec")}</div>
          <div className="dc-meta">{t("cover_persp")} | {t("cover_scope")}: Ministry / All Amanas / Apr 2026</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 12, opacity: 0.85 }}><span>{t("cover_agency")}</span><span>2026-06-19</span></div></div>)
          : (<div className="deck-body deck-watermark"><div style={{ fontSize: 13.5, lineHeight: 1.8 }}>"{tr(s.narr)}"</div><div>{s.chart !== "none" ? <MiniChart kind={s.chart} /> : <div className="muted" style={{ padding: 20 }}>—</div>}</div></div>)}
        <div className="deck-head" style={{ borderTop: "1px solid var(--line)", borderBottom: "none" }}>
          <span className="muted" style={{ fontSize: 12 }}>{t("page")} {pg + 1} {t("of")} {total}</span>
          <span style={{ display: "flex", gap: 8 }}><button className="btn ghost sm" disabled={pg === 0} onClick={() => setPg(p => p - 1)}>{t("prev")}</button><button className="btn sm" disabled={pg === total - 1} onClick={() => setPg(p => p + 1)}>{t("next")}</button></span>
        </div>
      </div>
    </div>
  </div>);
}
function PerfAnalysis() {
  const { t, tr, reports, perfJump, setPerfJump, setRoute, setDeptSub } = useStore();
  const [mode, setMode] = useState(perfJump ? "wizard" : "registry"); // registry | wizard
  const [step, setStep] = useState(1); const [reached, setReached] = useState(1); const [loading, setLoading] = useState(false); const [ridx, setRidx] = useState(0);
  const [jumpNote] = useState(perfJump ? perfJump.note : null);
  useEffect(() => { if (perfJump) setPerfJump(null); }, []);   // consume the deep-link once
  const goStep = (n) => { setStep(n); setReached(r => Math.max(r, n)); };
  const generate = () => { setStep(2); setReached(2); setLoading(true); setRidx(0);
    [1, 2, 3].forEach(k => setTimeout(() => setRidx(k), k * 850));
    setTimeout(() => setLoading(false), 3400); };
  const ucReports = reports.filter(r => r.name === "rep_uc06");
  const counts = { total: ucReports.length, pub: ucReports.filter(r => r.status === "pub").length, appr: ucReports.filter(r => r.status === "appr").length, rev: ucReports.filter(r => r.status === "review").length };

  if (mode === "registry") {
    return (<div className="fade">
      <div className="muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t("uc_dept_a")} / {t("uc_dept_b")}</div>
      <PageHeader title={t("uc_title")} sub={t("uc_sub")} />
      <div className="cols-4" style={{ marginBottom: 16 }}>
        <KPI label={t("uc_total")} value={counts.total} /><KPI label={t("uc_pub")} value={counts.pub} tone="good" />
        <KPI label={t("uc_appr")} value={counts.appr} /><KPI label={t("uc_inrev")} value={counts.rev} tone="warn" />
      </div>
      <Section title={t("uc_registry")} right={<button className="btn" onClick={() => { setMode("wizard"); setStep(1); setReached(1); }}>{t("uc_new")} +</button>}>
        {ucReports.length === 0 ? <div className="muted">{t("noReports")}</div> :
          (<table className="tbl"><thead><tr><th>{t("rep_title")}</th><th>{t("rep_cov")}</th><th>{t("rep_time")}</th><th>{t("rep_conf")}</th><th>{t("rep_ref")}</th></tr></thead>
            <tbody>{ucReports.map((r, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{t(r.name)}</td><td>{tr(SCOPE)}</td><td className="muted">{r.ts}</td><td>{r.conf === "—" ? "—" : r.conf + "%"}</td><td className="wo">{r.ref}</td></tr>))}</tbody></table>)}
      </Section>
    </div>);
  }
  return (<div className="fade">
    <div className="page-h" style={{ alignItems: "center" }}>
      <button className="btn ghost sm" onClick={() => { if (jumpNote) { setRoute("rcwork"); } else setMode("registry"); }}>↩ {jumpNote ? tr({ en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" }) : t("uc_back")}</button>
      <UcSteps step={step} setStep={goStep} reached={reached} />
    </div>
    {jumpNote && <div className="jump-note">↪ {tr(jumpNote)}</div>}
    {step === 1 && (<div className="card pad acc" style={{ maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ fontSize: 17 }}>⚙ {t("uc_cfg")}</h2><div className="sub muted" style={{ marginBottom: 16 }}>{t("uc_cfg_sub")}</div>
      <div className="uc-filter">
        <div className="field"><label>1. {t("f_level")}</label><select className="input"><option>{t("opt_ministry")}</option></select></div>
        <div className="field"><label>2. {t("f_amana")}</label><select className="input"><option>{t("opt_allAmanas")}</option></select></div>
        <div className="field"><label>3. {t("f_muni")}</label><select className="input"><option>{t("opt_allMuni")}</option></select></div>
        <div className="field"><label>4. {t("f_fy")}</label><select className="input"><option>FY2026</option></select></div>
        <div className="field"><label>5. {t("f_period")}</label><select className="input"><option>{t("opt_monthly")}</option><option>{t("opt_quarterly")}</option></select></div>
        <div className="field"><label>6. {t("f_specific")}</label><select className="input"><option>Apr 2026</option></select></div>
      </div>
      <div style={{ textAlign: "end", marginTop: 8 }}><button className="btn" onClick={generate}>{t("uc_generate")} ⚡</button></div>
    </div>)}
    {step === 2 && (loading
      ? (<div className="reason"><Robot /><h3>{t("reason_h")}</h3><div className="rsub">{t("reason_sub")}</div>
        <div className="reason-steps">{["rstep1", "rstep2", "rstep3", "rstep4"].map((rs, i) => (<div key={rs} className={"rs " + (i < ridx ? "ok" : i === ridx ? "act" : "")}><span className="ri">{i < ridx ? "✓" : i === ridx ? "◐" : "○"}</span>{t(rs)}</div>))}</div></div>)
      : <UcDashboard onCommentary={() => goStep(3)} />)}
    {step === 3 && <UcCommentary onAssemble={() => goStep(4)} />}
    {step === 4 && <UcReport onBack={() => goStep(3)} />}
  </div>);
}

/* =========================================================================
   Revenue Collection Department — multi-agent Workspace
   ========================================================================= */
const RC_KPIS = [
  { k: { en: "Billing gap", ar: "فجوة الفوترة", zh: "开票缺口" }, v: "SAR 12.4M", dot: "#e32700", d: "↑" },
  { k: { en: "Collection rate", ar: "نسبة التحصيل", zh: "征收率" }, v: "87.3%", dot: "#1B8354", d: "+1.2pp" },
  { k: { en: "Overdue amount", ar: "المبلغ المتأخر", zh: "逾期金额" }, v: "SAR 3.1M", dot: "#e29700", d: "42 cases" },
  { k: { en: "Top-risk Amanas", ar: "أمانات عالية الخطورة", zh: "高风险阿玛纳" }, v: "3", dot: "#e29700", d: "of 13" },
];
const RC_PROMPTS = [
  { t: { en: "Detect billing gap", ar: "كشف فجوة الفوترة", zh: "检测开票缺口" }, s: { en: "last 30 days · all Amanas", ar: "آخر 30 يوماً · كل الأمانات", zh: "近 30 天 · 全部阿玛纳" } },
  { t: { en: "Identify overdue risks", ar: "تحديد مخاطر التأخر", zh: "识别逾期风险" }, s: { en: "contracts > 60 days", ar: "عقود > 60 يوماً", zh: "合同 > 60 天" } },
  { t: { en: "Draft collection note", ar: "صياغة مذكرة تحصيل", zh: "起草征收说明" }, s: { en: "for executive review", ar: "للمراجعة التنفيذية", zh: "供高管复核" } },
];
const RC_SOURCES = [
  { en: "ERP · Billing", ar: "ERP · الفوترة", zh: "ERP · 开票" }, { en: "CRM · Contracts", ar: "CRM · العقود", zh: "CRM · 合同" },
  { en: "Bank · Receipts", ar: "البنك · الإيصالات", zh: "银行 · 回款" }, { en: "Tax · Invoices", ar: "الضريبة · الفواتير", zh: "税务 · 发票" },
];
const RC_AGENTS = [
  { id: "a1", code: "UC-01", kind: "base", icon: "⛁", route: "rcdata",
    chips: [{ t: { en: "Enabled", ar: "مفعّل", zh: "已启用" }, cls: "" }, { t: { en: "Base", ar: "أساس", zh: "基础" }, cls: "gray" }],
    title: { en: "Financial Data Consolidation and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" },
    desc: { en: "Master-data layer. Reconciles ERP / CRM / Bank / Tax records, resolves duplicates and exposes a clean revenue dataset.", ar: "طبقة البيانات الرئيسية. توفّق سجلات ERP/CRM/البنك/الضريبة، وتعالج التكرار، وتوفّر مجموعة بيانات إيرادات نظيفة.", zh: "主数据层。对账 ERP/CRM/银行/税务记录,消除重复,输出干净的收入数据集。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Furas", ar: "Furas", zh: "Furas" }, { en: "Wusool", ar: "Wusool", zh: "Wusool" }, { en: "Oqood", ar: "Oqood", zh: "Oqood" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }] }] },
  { id: "a13", code: "UC-13", kind: "focus", icon: "★", route: null,
    chips: [{ t: { en: "NEW", ar: "جديد", zh: "新增" }, cls: "info" }, { t: { en: "Primary focus", ar: "التركيز الأساسي", zh: "主焦点" }, cls: "gray" }],
    title: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" },
    desc: { en: "Detects billing gap, scores overdue risk and proposes corrective collection actions for finance review.", ar: "يكشف فجوة الفوترة، ويقيّم مخاطر التأخر، ويقترح إجراءات تصحيحية للتحصيل لمراجعة المالية.", zh: "检测开票缺口,评估逾期风险,并提出供财务复核的纠正性征收措施。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Financial Unified data", ar: "بيانات مالية موحّدة", zh: "财务统一数据" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Collection rate", ar: "معدل التحصيل", zh: "征收率" }, { en: "Billing Gap", ar: "فجوة الفوترة", zh: "开票缺口" }, { en: "Overdue risk", ar: "مخاطر التأخر", zh: "逾期风险" }, { en: "Action Suggestions", ar: "اقتراحات الإجراءات", zh: "行动建议" }] }],
    mini: [
      { l: { en: "billing gap detected", ar: "فجوة فوترة", zh: "检出开票缺口" }, v: "SAR 12.4M", s: "▲ 8.2%", sTone: "danger" },
      { l: { en: "overdue risk · medium", ar: "مخاطر التأخر · متوسط", zh: "逾期风险 · 中" }, v: "42 cases", s: { en: "7 high", ar: "7 مرتفعة", zh: "7 高" }, sTone: "amber" },
      { l: { en: "recommended actions", ar: "إجراءات موصى بها", zh: "建议措施" }, v: { en: "14 corrections", ar: "14 تصحيحاً", zh: "14 项更正" }, s: { en: "5 escalations", ar: "5 تصعيدات", zh: "5 项升级" }, sTone: "strong" }],
    foot: { en: "Inputs · Data Quality (UC-01)   ·   Outputs · corrections, draft for Performance Analysis (UC-06)", ar: "مدخلات · جودة البيانات (UC-01)   ·   مخرجات · تصحيحات، مسودة لتحليل الأداء (UC-06)", zh: "输入 · 数据质量 (UC-01)   ·   输出 · 更正、绩效分析草稿 (UC-06)" },
    btn: { en: "Start analysis", ar: "بدء التحليل", zh: "开始分析" } },
  { id: "a6", code: "UC-06", kind: "existing", icon: "▦", route: "perf",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }, { t: { en: "Draft generated by UC-13", ar: "مسودة من UC-13", zh: "由 UC-13 起草" }, cls: "amber" }],
    title: { en: "Performance Analysis, Expenditure and Executive Reports", ar: "تحليل الأداء والإنفاق والتقارير التنفيذية", zh: "绩效分析、支出与执行报告" },
    desc: { en: "Compiles weekly & monthly executive briefs. Consumes UC-13 corrections to refresh KPI commentary automatically.", ar: "يجمّع موجزات تنفيذية أسبوعية وشهرية. ويستهلك تصحيحات UC-13 لتحديث تعليق المؤشرات تلقائياً.", zh: "编制周/月度执行简报。消费 UC-13 的更正以自动刷新 KPI 评述。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Revenue & Collections analysis results", ar: "نتائج تحليل وكيل الإيرادات والتحصيل", zh: "收入征收智能体分析结果" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Executive reports", ar: "تقارير تنفيذية", zh: "执行报告" }] }],
    btn: { en: "Open draft", ar: "فتح المسودة", zh: "打开草稿" } },
  { id: "a14", code: "UC-14", kind: "base", icon: "⇲",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Assets, Classification, Capitalization, Returns, and Maintenance", ar: "الأصول والتصنيف والرسملة والعوائد والصيانة", zh: "资产、分类、资本化、收益与维护" },
    desc: { en: "Turns signed contracts into live billing schedules — contract → billing live.", ar: "يحوّل العقود الموقّعة إلى جداول فوترة فعّالة — العقد ← الفوترة الحيّة.", zh: "将已签合同转为生效的计费计划——合同→计费上线。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Revenue config", ar: "إعداد الإيرادات", zh: "收入配置" }, { en: "Asset status", ar: "حالة الأصل", zh: "资产状态" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Active leases", ar: "عقود مفعّلة", zh: "生效租约" }] }] },
  { id: "a12", code: "UC-12", kind: "base", half: true, icon: "▤",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Costs, Assignment Orders, and Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" },
    desc: { en: "Generates invoices and accounts receivable from active leases (AR generation).", ar: "ينشئ الفواتير والذمم المدينة من العقود المفعّلة.", zh: "依据生效租约生成发票与应收账款(AR 生成)。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Active leases", ar: "عقود مفعّلة", zh: "生效租约" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Invoices (AR)", ar: "فواتير (ذمم)", zh: "发票(应收)" }] }] },
  { id: "a11", code: "UC-11", kind: "base", half: true, icon: "◧",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Compliance, Policies, and Accounting Memoranda", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘录" },
    desc: { en: "Records cash receipts and reconciles payments against invoices.", ar: "يسجّل المقبوضات النقدية ويطابقها مع الفواتير.", zh: "登记现金回款并与发票对账。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Invoices", ar: "فواتير", zh: "发票" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Cash receipts", ar: "مقبوضات نقدية", zh: "现金回款" }] }] },
  { id: "a10", code: "UC-10", kind: "base", half: true, icon: "▣",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Generating financial and administrative reports and narrative commentaries", ar: "إنشاء التقارير المالية والإدارية والتعليقات السردية", zh: "生成财务与行政报告及叙述性评述" },
    desc: { en: "Compiles executive revenue reports from collections (executive view).", ar: "يجمّع تقارير الإيرادات التنفيذية من بيانات التحصيل.", zh: "依据征收数据编制高管收入报告(执行视图)。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Collections data", ar: "بيانات التحصيل", zh: "征收数据" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Executive revenue report", ar: "تقرير إيرادات تنفيذي", zh: "高管收入报告" }] }] },
  { id: "a3", code: "UC-03", kind: "base", half: true, icon: "◆",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Smart Query, Audit Log, and Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" },
    desc: { en: "Computes portfolio-level asset performance KPIs.", ar: "يحسب مؤشرات أداء الأصول على مستوى المحفظة.", zh: "计算组合层面的资产绩效 KPI。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Revenue & asset data", ar: "بيانات الإيرادات والأصول", zh: "收入与资产数据" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Portfolio KPIs", ar: "مؤشرات المحفظة", zh: "组合 KPI" }] }] },
];
// ===== Business Plaza · two-lane (Revenue × Assets) model =====
const PLAZA_UCS = [
  { id: "uc01", lane: "rev", col: 0, code: "UC-01", title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" }, agents: ["Orchestrator", "Data Querying", "Proactive Insights"] },
  { id: "uc13", lane: "rev", col: 1, code: "UC-13", title: { en: "Revenues, Collection & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" }, agents: ["Revenue Analytics", "Data Querying", "Proactive Insights"], open: "rcbench" },
  { id: "uc06", lane: "rev", col: 2, code: "UC-06", title: { en: "Performance, Spend Analysis & Executive Reports", ar: "تحليل الأداء والإنفاق والتقارير التنفيذية", zh: "绩效、支出分析与执行报告" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"], open: "report" },
  { id: "uc02", lane: "rev", col: 3, code: "UC-02", title: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, agents: ["Anomaly Detection", "Proactive Insights", "Orchestrator"], open: "alerts" },
  { id: "uc10", lane: "rev", col: 4, code: "UC-10", star: 1, title: { en: "Reporting & Dashboards (Periodic / Executive)", ar: "التقارير ولوحات المعلومات (دورية / تنفيذية)", zh: "报告与仪表盘(周期 / 执行)" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"], open: "reports" },
  { id: "uc14", lane: "ast", col: 0, code: "UC-14", title: { en: "Assets: Classification, Capitalization, Return & Maintenance", ar: "الأصول: التصنيف والرسملة والعوائد والصيانة", zh: "资产:分类、资本化、收益与维护" }, agents: ["Data Querying", "Market Trends", "Compliance/Rules"], open: "asbench" },
  { id: "uc12", lane: "ast", col: 1, code: "UC-12", title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, agents: ["Data Querying", "Financial Reports Gen.", "Anomaly Detection"], open: "csfunds" },
  { id: "uc11", lane: "ast", col: 2, code: "UC-11", star: 1, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘录" }, agents: ["Compliance/Rules", "Financial Reports Gen.", "Data Querying"], open: "compmemo" },
  { id: "uc03", lane: "ast", col: 3, code: "UC-03", title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, agents: ["Data Querying", "Orchestrator", "Proactive Insights"] },
];
const PLAZA_INTRA = [["uc01", "uc13"], ["uc13", "uc06"], ["uc06", "uc02"], ["uc02", "uc10"], ["uc14", "uc12"], ["uc12", "uc11"], ["uc11", "uc03"]];
const PLAZA_CROSS = [
  { from: "uc13", to: "uc12", label: { en: "Revenue & collection signals for cost/fund reconciliation", ar: "إشارات الإيرادات والتحصيل لمطابقة التكاليف/الصناديق", zh: "收入与征收信号 → 成本/资金对账" } },
  { from: "uc14", to: "uc06", label: { en: "Asset cost basis for performance reports", ar: "أساس تكلفة الأصول لتقارير الأداء", zh: "资产成本基础 → 绩效报告" } },
  { from: "uc12", to: "uc10", label: { en: "Asset costs, assignment orders & fund balances for unified reports", ar: "تكاليف الأصول وأوامر الإسناد وأرصدة الصناديق للتقارير الموحّدة", zh: "资产成本/派工单/资金余额 → 统一报告" } },
  { from: "uc02", to: "uc11", label: { en: "Anomalies escalated to compliance review", ar: "تصعيد الانحرافات إلى مراجعة الامتثال", zh: "异常升级 → 合规复核" } },
  { from: "uc11", to: "uc10", label: { en: "Compliance findings & accounting memos for reports", ar: "نتائج الامتثال والمذكرات المحاسبية للتقارير", zh: "合规结论与会计备忘 → 报告" } },
  { from: "uc03", to: "uc10", label: { en: "Audit trail & permissioned data exports supporting reports", ar: "سجل التدقيق وتصدير البيانات المصرّح به لدعم التقارير", zh: "审计轨迹与授权数据导出 → 报告" } },
];
const RC_FLOW = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-13", label: { en: "Revenue, collections & exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" }, cls: "focus", star: true },
  { code: "UC-06 / UC-02", label: { en: "Performance & alerts", ar: "الأداء والتنبيهات", zh: "绩效与告警" }, cls: "down" },
  { code: "UC-14", label: { en: "Assets & capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" }, cls: "down" },
  { code: "UC-12 / UC-11", label: { en: "Costs & compliance", ar: "التكاليف والامتثال", zh: "成本与合规" }, cls: "down" },
  { code: "UC-10 / UC-03", label: { en: "Reports & smart query", ar: "التقارير والاستعلام", zh: "报告与智能查询" }, cls: "down" },
];
const AS_FLOW = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-13", label: { en: "Revenue, collections & exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" }, cls: "in" },
  { code: "UC-06 / UC-02", label: { en: "Performance & alerts", ar: "الأداء والتنبيهات", zh: "绩效与告警" }, cls: "in" },
  { code: "UC-14", label: { en: "Assets & capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" }, cls: "focus", star: true },
  { code: "UC-12 / UC-11", label: { en: "Costs & compliance", ar: "التكاليف والامتثال", zh: "成本与合规" }, cls: "down" },
  { code: "UC-10 / UC-03", label: { en: "Reports & smart query", ar: "التقارير والاستعلام", zh: "报告与智能查询" }, cls: "down" },
];
function ucl(code, name) { return SHOW_UC ? code + " · " + name : name; }

/* ======= Revenue Collection — Analysis Workbench (department landing) ======= */
const WB = {
  filters: [
    { lab: { en: "Fiscal Year / Month", ar: "السنة المالية / الشهر", zh: "财年 / 月份" }, opts: ["FY 2025 · Q2", "FY 2025 · Q3", "FY 2026 · Q1"] },
    { lab: { en: "Amanah", ar: "الأمانة", zh: "阿玛纳" }, opts: ["All Amanat (47)", "Riyadh-East", "Jeddah-Port", "Dammam-Ind."] },
    { lab: { en: "Revenue Type", ar: "نوع الإيراد", zh: "收入类型" }, opts: ["Fees · Fines · Leases", "Leases only", "Fees only", "Fines only"] },
    { lab: { en: "Contract Tags (optional)", ar: "وسوم العقد (اختياري)", zh: "合同标签(可选)" }, opts: ["Wusool · Oqood", "Wusool", "Oqood", "—"] },
  ],
  roles: [
    { name: { en: "Revenue Analytics Agent", ar: "وكيل تحليل الإيرادات", zh: "收入分析智能体" }, sub: { en: "Detects billing gaps, trends & overdue risk across revenue streams", ar: "يكشف فجوات الفوترة والاتجاهات ومخاطر التأخر عبر مصادر الإيراد", zh: "检测各收入流的开票缺口、趋势与逾期风险" }, status: "running", cls: "r-violet" },
    { name: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, sub: { en: "Aggregates Tahseel, Makeen, Efaa, Etimad & bank-statement data", ar: "يجمّع بيانات تحصيل ومكين وإفاء واعتماد وكشوف البنوك", zh: "聚合 Tahseel、Makeen、Efaa、Etimad 与银行流水数据" }, status: "active", cls: "r-blue" },
    { name: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" }, sub: { en: "Generates prioritized alerts & opportunity flags", ar: "يولّد تنبيهات مرتّبة وإشارات الفرص", zh: "生成排序告警与机会标记" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-01", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Unified Furas + SAP AR + Doors records (47 Amanat)", ar: "وحّد سجلات فرص + SAP AR + Doors (47 أمانة)", zh: "统一 Furas + SAP AR + Doors 记录(47 阿玛纳)" }, dot: "blue" },
    { tm: "10:03", h: { en: "Join & Mapping", ar: "الربط والمطابقة", zh: "联接与映射" }, d: { en: "Loaded 2,184 contracts and reconciled customer keys", ar: "حمّل 2,184 عقداً ووفّق مفاتيح العملاء", zh: "载入 2,184 份合同并对账客户主键" }, dot: "blue" },
    { tm: "10:04", h: { en: "Document RAG", ar: "استرجاع الوثائق", zh: "文档 RAG" }, d: { en: "Retrieved 18 contract clauses (penalties, escalation, terms)", ar: "استرجع 18 بنداً تعاقدياً (غرامات، تصعيد، شروط)", zh: "检索 18 条合同条款(罚则、升级、条款)" }, dot: "amber" },
    { tm: "10:05", h: { en: "Numeric Query", ar: "الاستعلام الرقمي", zh: "数值查询" }, d: { en: "Calculated billing gap = SAR 120M · aging 0-30/31-60/61-90/>90", ar: "احتسب فجوة الفوترة = 120 مليون ريال · تقادم 0-30/31-60/61-90/>90", zh: "计算开票缺口 = SAR 120M · 账龄 0-30/31-60/61-90/>90" }, dot: "blue" },
    { tm: "10:06", code: "UC-13", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Generated narrative · flagged 3 high-risk Amanat", ar: "ولّد السرد · حدّد 3 أمانات عالية الخطورة", zh: "生成叙述 · 标记 3 个高风险阿玛纳" }, dot: "violet" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting user follow-up question", ar: "بانتظار سؤال متابعة من المستخدم", zh: "等待用户追问" }, dot: "gray" },
  ],
  qs: [
    { en: "Where is today's billing gap?", ar: "أين فجوة الفوترة اليوم؟", zh: "今天的开票缺口在哪里?" },
    { en: "Which contracts drive most of the overdue?", ar: "ما العقود التي تقود معظم التأخر؟", zh: "哪些合同造成了大部分逾期?" },
    { en: "How does collection differ across Amanat?", ar: "كيف يختلف التحصيل بين الأمانات؟", zh: "各阿玛纳的征收有何差异?" },
  ],
  answers: [
    { en: "Today's billing gap is SAR 120M, concentrated in 3 Amanat — Riyadh-East (SAR 32M), Jeddah-Port (SAR 26M) and Dammam-Industrial (SAR 20M), together ~65% of the gap.", ar: "فجوة الفوترة اليوم 120 مليون ريال، مركّزة في 3 أمانات — الرياض-شرق (32) وجدة-الميناء (26) والدمام-الصناعية (20)، نحو 65% من الفجوة.", zh: "今天的开票缺口为 SAR 120M,集中在 3 个阿玛纳——利雅得-东(32M)、吉达-港(26M)、达曼-工业(20M),合计约占缺口的 65%。" },
    { en: "The top 5 contracts drive ~68% of overdue. CT-2025-0142 (Riyadh-East, SAR 32M) and CT-2025-0098 (Jeddah-Port, SAR 26M) lead, both aged beyond 60 days under Wusool lease terms.", ar: "أعلى 5 عقود تقود ~68% من التأخر. CT-2025-0142 (الرياض-شرق، 32) و CT-2025-0098 (جدة-الميناء، 26) في الصدارة، وكلاهما تجاوز 60 يوماً.", zh: "前 5 个合同造成约 68% 的逾期。CT-2025-0142(利雅得-东,32M)与 CT-2025-0098(吉达-港,26M)居首,均逾期超过 60 天(Wusool 租约条款)。" },
    { en: "Collection rate ranges 78%–94% across Amanat. Riyadh-East and Jeddah-Port lag near 80%, while Madinah-Central leads at 94%; lease-heavy Amanat collect ~10pp lower.", ar: "تتراوح نسبة التحصيل بين 78% و94% بين الأمانات. الرياض-شرق وجدة-الميناء قرب 80%، بينما المدينة-وسط الأعلى عند 94%.", zh: "各阿玛纳征收率介于 78%–94%。利雅得-东与吉达-港约 80% 偏低,麦地那-中以 94% 领先;租约占比高的阿玛纳低约 10 个百分点。" },
  ],
  genAns: { en: "From UC-13 unified data: collection rate 87% (+2.1% QoQ), collection gap SAR 120M, and 50% of overdue aged beyond 60 days — lease contracts are the primary driver.", ar: "من بيانات UC-13 الموحّدة: نسبة التحصيل 87% (+2.1%)، فجوة التحصيل 120 مليون ريال، و50% من التأخر تجاوز 60 يوماً — عقود الإيجار هي المحرّك الرئيسي.", zh: "依据 UC-13 统一数据:征收率 87%(环比 +2.1%),征收缺口 SAR 120M,50% 逾期超过 60 天——租约合同是主要成因。" },
  focus: [
    { id: "CT-2025-0142", am: { en: "Riyadh-East", ar: "الرياض-شرق", zh: "利雅得-东" }, od: "SAR 32M", risk: "high" },
    { id: "CT-2025-0098", am: { en: "Jeddah-Port", ar: "جدة-الميناء", zh: "吉达-港" }, od: "SAR 26M", risk: "high" },
    { id: "CT-2025-0211", am: { en: "Dammam-Ind.", ar: "الدمام-الصناعية", zh: "达曼-工业" }, od: "SAR 20M", risk: "med" },
    { id: "CT-2025-0167", am: { en: "Makkah-North", ar: "مكة-شمال", zh: "麦加-北" }, od: "SAR 14M", risk: "med" },
    { id: "CT-2025-0303", am: { en: "Madinah-Cent.", ar: "المدينة-وسط", zh: "麦地那-中" }, od: "SAR 9M", risk: "low" },
  ],
  dist: [
    { am: { en: "Riyadh-East", ar: "الرياض-شرق", zh: "利雅得-东" }, v: "SAR 32M", pct: 100, cls: "blue" },
    { am: { en: "Jeddah-Port", ar: "جدة-الميناء", zh: "吉达-港" }, v: "SAR 26M", pct: 81, cls: "blue" },
    { am: { en: "Dammam-Ind.", ar: "الدمام-الصناعية", zh: "达曼-工业" }, v: "SAR 20M", pct: 62, cls: "blue" },
    { am: { en: "Makkah-North", ar: "مكة-شمال", zh: "麦加-北" }, v: "SAR 14M", pct: 44, cls: "gray" },
    { am: { en: "Madinah-Cent.", ar: "المدينة-وسط", zh: "麦地那-中" }, v: "SAR 9M", pct: 28, cls: "gray" },
  ],
  next: [
    { t: { en: "Prioritize follow-up on Riyadh-East (SAR 32M)", ar: "أولوية متابعة الرياض-شرق (32 مليون)", zh: "优先跟进利雅得-东(SAR 32M)" }, d: { en: "Largest single gap — 27% of the SAR 120M total across 4 lease contracts aged > 60d. A focused 2-week dunning sprint recovers an est. SAR 18–22M this quarter.", ar: "أكبر فجوة مفردة — 27% من 120 مليون عبر 4 عقود إيجار > 60 يوماً؛ حملة مركّزة تسترد 18–22 مليون.", zh: "最大单点缺口——占 120M 的 27%,涉 4 份逾期>60天租约。集中 2 周催收本季可回收约 SAR 18–22M。" } },
    { t: { en: "Renegotiate Wusool lease terms (template v2)", ar: "إعادة التفاوض على شروط وصول (قالب v2)", zh: "重谈 Wusool 租约条款(模板 v2)" }, d: { en: "Lease-heavy Amanat collect ~10pp lower. Shorter cycles + milestone-linked invoicing cut the structural gap ~SAR 8–12M/qtr and lower DSO from 74 to ~60 days.", ar: "الأمانات كثيفة الإيجار أقل 10 نقاط؛ دورات أقصر تخفض الفجوة 8–12 مليون ربعياً وDSO إلى ~60.", zh: "租约重的阿玛纳征收率低约 10pp。缩短账期+里程碑开票季度减缺口约 SAR 8–12M,DSO 由 74 降至约 60 天。" } },
    { t: { en: "Open targeted dunning for > 90d contracts", ar: "فتح تحصيل موجّه للعقود > 90 يوماً", zh: "对 >90 天合同启动定向催收" }, d: { en: "50% of overdue is aged > 60d and 18 contracts crossed 90d. Auto-escalation + legal notice on the top 18 protects ~SAR 34M most at risk of write-off.", ar: "50% من التأخر > 60 يوماً و18 عقداً > 90؛ التصعيد يحمي ~34 مليون معرّضة للشطب.", zh: "50% 逾期超 60 天,18 个已过 90 天。对前 18 个自动升级+法律通知,保护最易核销的约 SAR 34M。" } },
  ],
  story: [
    { code: "UC-01", cap: { en: "Foundation", ar: "الأساس", zh: "基础" } },
    { code: "UC-13", cap: { en: "You are here", ar: "أنت هنا", zh: "当前位置" }, here: true },
    { code: "UC-06 / UC-02", cap: { en: "Summary / Alert", ar: "ملخص / تنبيه", zh: "摘要 / 告警" } },
    { code: "UC-14 / UC-12", cap: { en: "Operational follow-up", ar: "متابعة تشغيلية", zh: "运营跟进" } },
    { code: "UC-10 / UC-03", cap: { en: "Strategic loop", ar: "حلقة استراتيجية", zh: "战略闭环" } },
  ],
};
/* ======= Assets Department — Analysis Workbench (UC-14) data ======= */
const WB_AS = {
  filters: [
    { lab: { en: "Fiscal Year / Month", ar: "السنة المالية / الشهر", zh: "财年 / 月份" }, opts: ["FY 2025 · Q2", "FY 2025 · Q3", "FY 2026 · Q1"] },
    { lab: { en: "Amanah", ar: "الأمانة", zh: "阿玛纳" }, opts: ["All Amanat (47)", "Riyadh-East", "Jeddah-Port", "Makkah-North"] },
    { lab: { en: "Asset Class", ar: "فئة الأصل", zh: "资产类别" }, opts: ["All classes", "Land", "Buildings", "Infrastructure", "Equipment"] },
    { lab: { en: "Status", ar: "الحالة", zh: "状态" }, opts: ["AUC + In-service", "AUC only", "In-service", "Impaired"] },
  ],
  roles: [
    { name: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, sub: { en: "Queries & validates asset records across Asset Registry, SAP, Balady, Esnad", ar: "يستعلم ويتحقق من سجلات الأصول عبر سجل الأصول و SAP و بلدي و إسناد", zh: "跨资产台账、SAP、Balady、Esnad 查询并校验资产记录" }, status: "running", cls: "r-violet" },
    { name: { en: "Market Trends Detection Agent", ar: "وكيل كشف اتجاهات السوق", zh: "市场趋势检测智能体" }, sub: { en: "Benchmarks asset values vs construction costs & market", ar: "يقايس قيم الأصول مقابل تكاليف الإنشاء والسوق", zh: "对标资产价值与建造成本/市场" }, status: "active", cls: "r-blue" },
    { name: { en: "Compliance / Rules Agent", ar: "وكيل الامتثال / القواعد", zh: "合规 / 规则智能体" }, sub: { en: "Validates classification & capitalization vs policy & useful-life rules", ar: "يتحقق من التصنيف والرسملة وفق السياسة وقواعد العمر الإنتاجي", zh: "依政策与使用年限规则校验分类与资本化" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-01", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Unified Asset Registry + SAP + Balady + Esnad (47 Amanat)", ar: "وحّد سجل الأصول + SAP + بلدي + إسناد (47 أمانة)", zh: "统一资产台账 + SAP + Balady + Esnad(47 阿玛纳)" }, dot: "blue" },
    { tm: "10:03", h: { en: "Data Querying", ar: "استعلام البيانات", zh: "数据查询" }, d: { en: "Loaded 8,640 asset records · 312 AUC items reconciled", ar: "حمّل 8,640 سجل أصل · سوّى 312 بنداً تحت الإنشاء", zh: "载入 8,640 条资产记录 · 对账 312 项在建资产" }, dot: "blue" },
    { tm: "10:04", h: { en: "Market Trends", ar: "اتجاهات السوق", zh: "市场趋势" }, d: { en: "Benchmarked 1,204 assets vs construction-cost index", ar: "قايس 1,204 أصلاً مقابل مؤشر تكلفة الإنشاء", zh: "对标 1,204 项资产与建造成本指数" }, dot: "amber" },
    { tm: "10:05", h: { en: "Compliance / Rules", ar: "الامتثال / القواعد", zh: "合规 / 规则" }, d: { en: "Applied useful-life & capitalization policy · 3 exceptions", ar: "طبّق سياسة العمر الإنتاجي والرسملة · 3 استثناءات", zh: "应用使用年限与资本化政策 · 3 项例外" }, dot: "blue" },
    { tm: "10:06", code: "UC-14", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Capitalized SAR 1.92B AUC · flagged 3 impairment, 5 maintenance", ar: "رسمل 1.92 مليار تحت الإنشاء · رصد 3 انخفاض، 5 صيانة", zh: "资本化 SAR 1.92B 在建资产 · 标记 3 项减值、5 项维护" }, dot: "violet" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting user follow-up question", ar: "بانتظار سؤال متابعة من المستخدم", zh: "等待用户追问" }, dot: "gray" },
  ],
  qs: [
    { en: "Which assets are due for capitalization?", ar: "ما الأصول المستحقة للرسملة؟", zh: "哪些资产应予资本化?" },
    { en: "Where are impairment risks concentrated?", ar: "أين تتركّز مخاطر انخفاض القيمة؟", zh: "减值风险集中在哪里?" },
    { en: "Which assets need maintenance soon?", ar: "ما الأصول التي تحتاج صيانة قريباً؟", zh: "哪些资产即将需要维护?" },
  ],
  answers: [
    { en: "SAR 1.92B of completed assets-under-construction is due for capitalization this period — led by road infrastructure (SAR 0.84B) and buildings (SAR 0.61B), all meeting the approved useful-life policy.", ar: "1.92 مليار ريال من الأصول تحت الإنشاء المكتملة مستحقة للرسملة هذه الفترة — تقودها البنية التحتية للطرق (0.84 مليار) والمباني (0.61 مليار).", zh: "本期 SAR 1.92B 已完工在建资产应资本化——以道路基础设施(SAR 0.84B)与建筑(SAR 0.61B)为主,均符合核定使用年限政策。" },
    { en: "Impairment risk is concentrated in 3 equipment items (SAR 47M net book value) showing idle utilization and market-value decline beyond the policy threshold.", ar: "تتركّز مخاطر الانخفاض في 3 معدات (47 مليون ريال صافي قيمة دفترية) تُظهر تشغيلاً خاملاً وتراجعاً سوقياً.", zh: "减值风险集中于 3 项设备(账面净值 SAR 47M),呈现闲置利用与超阈值的市场价值下跌。" },
    { en: "5 infrastructure assets are due for maintenance within 60 days; road segments R-118 and R-204 carry the highest condition-deterioration scores.", ar: "5 أصول بنية تحتية مستحقة للصيانة خلال 60 يوماً؛ مقاطع الطرق R-118 و R-204 الأعلى تدهوراً.", zh: "5 项基础设施资产将在 60 天内到期维护;路段 R-118 与 R-204 的状况劣化评分最高。" },
  ],
  genAns: { en: "From UC-14 asset data: SAR 1.92B AUC capitalized, 3 impairment flags (SAR 47M), 5 maintenance-due assets, and data-quality score 96% — asset cost is fully traceable from assignment order to register.", ar: "من بيانات UC-14: رُسمل 1.92 مليار، 3 مؤشرات انخفاض (47 مليون)، 5 أصول مستحقة صيانة، وجودة بيانات 96% — تكلفة الأصل قابلة للتتبع من أمر الإسناد إلى السجل.", zh: "依据 UC-14 资产数据:资本化 SAR 1.92B,3 项减值标记(SAR 47M),5 项待维护资产,数据质量 96%——资产成本从派工单到台账全程可追溯。" },
  focus: [
    { id: "EQ-2024-0471", am: { en: "Equipment", ar: "معدات", zh: "设备" }, od: "SAR 22M", risk: "high", flag: { en: "impairment", ar: "انخفاض", zh: "减值" } },
    { id: "EQ-2024-0388", am: { en: "Equipment", ar: "معدات", zh: "设备" }, od: "SAR 16M", risk: "high", flag: { en: "impairment", ar: "انخفاض", zh: "减值" } },
    { id: "R-118", am: { en: "Infrastructure", ar: "بنية تحتية", zh: "基础设施" }, od: "SAR 9M", risk: "med", flag: { en: "maintenance", ar: "صيانة", zh: "维护" } },
    { id: "R-204", am: { en: "Infrastructure", ar: "بنية تحتية", zh: "基础设施" }, od: "SAR 7M", risk: "med", flag: { en: "maintenance", ar: "صيانة", zh: "维护" } },
    { id: "BLD-1192", am: { en: "Buildings", ar: "مبانٍ", zh: "建筑" }, od: "SAR 4M", risk: "low", flag: { en: "review", ar: "مراجعة", zh: "复核" } },
  ],
  dist: [
    { am: { en: "Infrastructure", ar: "بنية تحتية", zh: "基础设施" }, v: "SAR 0.84B", pct: 100, cls: "blue" },
    { am: { en: "Buildings", ar: "مبانٍ", zh: "建筑" }, v: "SAR 0.61B", pct: 73, cls: "blue" },
    { am: { en: "Land", ar: "أراضٍ", zh: "土地" }, v: "SAR 0.31B", pct: 37, cls: "blue" },
    { am: { en: "Equipment", ar: "معدات", zh: "设备" }, v: "SAR 0.12B", pct: 14, cls: "gray" },
    { am: { en: "Other", ar: "أخرى", zh: "其他" }, v: "SAR 0.04B", pct: 5, cls: "gray" },
  ],
  next: [
    { t: { en: "Capitalize SAR 1.92B completed AUC", ar: "رسملة 1.92 مليار من الأصول المكتملة", zh: "资本化 SAR 1.92B 已完工在建资产" }, d: { en: "312 AUC items are past their in-service date. Capitalizing now corrects the depreciation base, avoids understated asset value, and clears the pre-close checklist.", ar: "312 بنداً تجاوزت تاريخ التشغيل؛ الرسملة تصحّح أساس الإهلاك وتغلق قائمة ما قبل الإقفال.", zh: "312 项在建资产已过投用日。立即资本化修正折旧基数、避免资产低估,并清空关账前清单。" } },
    { t: { en: "Raise impairment memos — 3 equipment items (SAR 47M)", ar: "مذكرات انخفاض لـ 3 معدات (47 مليون)", zh: "为 3 项设备开具减值备忘(SAR 47M)" }, d: { en: "Idle utilization plus market value below the policy threshold. Timely impairment prevents an overstated SAR 47M NBV and a likely UC-03 audit finding at year-end.", ar: "تشغيل خامل وقيمة دون الحد؛ الانخفاض في وقته يمنع تضخّم 47 مليون وملاحظة تدقيق.", zh: "闲置利用+市值低于政策阈值。及时减值避免 SAR 47M 账面净值虚高及年末 UC-03 审计发现。" } },
    { t: { en: "Schedule maintenance — road segments R-118 / R-204", ar: "جدولة صيانة R-118 / R-204", zh: "安排路段 R-118 / R-204 维护" }, d: { en: "Condition index is below threshold; deferring raises whole-life cost ~18%. Bundling into the Q3 plan protects return-on-asset and avoids emergency-repair premiums.", ar: "مؤشر الحالة دون الحد؛ التأجيل يرفع كلفة العمر ~18%؛ الدمج في خطة الربع الثالث يحمي العائد.", zh: "状态指数低于阈值;推迟使全生命周期成本升约 18%。并入 Q3 计划保护资产回报、规避抢修溢价。" } },
  ],
};
/* ===== v1 BACKUP — UC-13 Revenue Collection Multi-Agent Flow (kept as a separate page) ===== */
const MF_V1 = {
  sources: [
    { k: "E", n: "Etimad", s: { en: "Contracts, payment orders", ar: "العقود وأوامر الدفع", zh: "合同、付款单" } },
    { k: "S", n: "SAP / Asas", s: { en: "Invoicing, receipts", ar: "الفوترة والإيصالات", zh: "开票、回款" } },
    { k: "T", n: "Tahseel", s: { en: "Collection records", ar: "سجلات التحصيل", zh: "征收记录" } },
    { k: "F", n: "Efaa", s: { en: "Exclusions, enforcement", ar: "الاستبعادات والتنفيذ", zh: "排除项、执行" } },
  ],
  agents: [
    { n: { en: "Document RAG Agent", ar: "وكيل استرجاع الوثائق", zh: "文档 RAG 智能体" }, d: { en: "Contracts, policies, credit notes retrieval", ar: "استرجاع العقود والسياسات والإشعارات الدائنة", zh: "检索合同、政策、贷项通知" }, tag: { en: "unstructured", ar: "غير منظّم", zh: "非结构化" } },
    { n: { en: "Numeric Query Agent", ar: "وكيل الاستعلام الرقمي", zh: "数值查询智能体" }, d: { en: "Billed vs collected, aging, KPIs", ar: "المفوتر مقابل المحصّل، التقادم، المؤشرات", zh: "已开票 vs 已收、账龄、KPI" }, tag: { en: "structured", ar: "منظّم", zh: "结构化" } },
    { n: { en: "Join & Mapping Agent", ar: "وكيل الربط والمطابقة", zh: "联接与映射智能体" }, d: { en: "Link contracts to doors, services, AR lines", ar: "ربط العقود بالأبواب والخدمات وسطور الذمم", zh: "关联 合同/门类/服务/应收行" }, tag: { en: "relational", ar: "علائقي", zh: "关系型" } },
  ],
  outputs: [
    { t: { en: "Collection rate", ar: "نسبة التحصيل", zh: "征收率" }, s: { en: "% billed to collected", ar: "% المفوتر إلى المحصّل", zh: "% 开票 到 已收" }, c: "#1B8354" },
    { t: { en: "Billing Gap", ar: "فجوة الفوترة", zh: "开票缺口" }, s: { en: "expected minus billed", ar: "المتوقّع ناقص المفوتر", zh: "应开 减 已开" }, c: "#caa204" },
    { t: { en: "Overdue risk", ar: "مخاطر التأخر", zh: "逾期风险" }, s: { en: "30 / 60 / 90+ buckets", ar: "فئات 30 / 60 / 90+", zh: "30 / 60 / 90+ 分桶" }, c: "#e0473c" },
    { t: { en: "Action Suggestions", ar: "اقتراحات الإجراءات", zh: "行动建议" }, s: { en: "prioritized next steps", ar: "خطوات تالية مرتّبة", zh: "排序的后续步骤" }, c: "#2563eb" },
  ],
  down: [
    { code: "UC-06", n: { en: "Financial Performance Analysis", ar: "تحليل الأداء المالي", zh: "财务绩效分析" }, agents: [{ en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成智能体" }, { en: "Financial Narrative Commentary Agent", ar: "وكيل السرد والتعليق المالي", zh: "财务叙述评述智能体" }, { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }], cls: "green" },
    { code: "UC-02", n: { en: "Detection of deviations, alerts, and exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "偏差、告警与异常检测" }, agents: [{ en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测智能体" }, { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" }, { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" }], cls: "green" },
    { code: "UC-14 / UC-12", n: { en: "Assets, Classification, Capitalization, Returns, and Maintenance", ar: "الأصول والتصنيف والرسملة والعوائد والصيانة", zh: "资产、分类、资本化、回报与维护" }, agents: [{ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, { en: "Market Trends Detection Agent", ar: "وكيل كشف اتجاهات السوق", zh: "市场趋势检测智能体" }, { en: "Compliance/Rules Agent", ar: "وكيل الامتثال/القواعد", zh: "合规/规则智能体" }], cls: "green" },
    { code: "UC-10 / UC-03", n: { en: "Smart Query, Audit Log, and Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, agents: [{ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" }, { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" }], cls: "green" },
  ],
};
function RcDataFlowV1() {
  const { tr, setRoute } = useStore();
  const colh = (code, name) => (SHOW_UC && code ? code + " · " : "") + name;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => { const w = wrapRef.current ? wrapRef.current.clientWidth : 1640; setScale(Math.min(1, w / 1640)); };
    calc(); window.addEventListener("resize", calc); return () => window.removeEventListener("resize", calc);
  }, []);
  return (<div className="fade mf">
    <div className="card pad mf-frame">
      <h1 style={{ fontSize: 21 }}><button className="pg-back" onClick={() => setRoute("rcdata")}>‹</button>{colh("UC-13", tr({ en: "Revenue Collection Exclusions — Multi-Agent Flow (v1)", ar: "التحصيل والاستبعادات — تدفّق متعدد الوكلاء (v1)", zh: "收入征收与排除项 — 多智能体流程 (v1)" }))}</h1>
      <div className="sub muted" style={{ marginTop: 3 }}>{tr({ en: "Archived previous version · UC-13 centric · sources to agents to outputs and downstream", ar: "نسخة محفوظة سابقة · محورها UC-13", zh: "已归档旧版 · 以 UC-13 为中心 · 数据源 到 智能体 到 输出与下游" })}</div>
      <div className="mf-canvas-wrap" ref={wrapRef} style={{ height: Math.ceil(880 * scale) }}><div className="mf-canvas" style={{ transform: "scale(" + scale + ")", transformOrigin: "top left" }}>
        <svg className="mf-svg" width="1640" height="880" viewBox="0 0 1640 880" fill="none">
          <defs>
            <marker id="mfag" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#9aa7b5" strokeWidth="1.6" /></marker>
            <marker id="mfab" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#2563eb" strokeWidth="1.8" /></marker>
          </defs>
          <path d="M190,93 C224,93 220,200 240,200" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M190,179 C224,179 224,255 240,255" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M190,265 C224,265 224,285 240,285" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M190,351 C224,351 224,330 240,330" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M475,270 C520,270 516,158 540,158" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M635,198 L635,531" stroke="#9aa7b5" strokeWidth="1.6" strokeDasharray="5 6" />
          <path d="M730,317 C760,317 756,430 778,430" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M730,455 C760,455 760,443 778,443" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M730,593 C760,593 758,458 778,458" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M896,443 C930,443 924,340 946,340" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M1276,150 C1370,135 1410,120 1440,120" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M1276,300 C1370,310 1410,320 1440,320" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M1276,470 C1370,500 1410,520 1440,520" stroke="#9aa7b5" strokeWidth="1.7" strokeDasharray="5 5" markerEnd="url(#mfag)" />
          <path d="M1276,600 C1370,665 1410,720 1440,720" stroke="#9aa7b5" strokeWidth="1.7" strokeDasharray="5 5" markerEnd="url(#mfag)" />
        </svg>
        <div className="node mf-colh" style={{ left: 10, top: 14, width: 185 }}>{tr({ en: "UPSTREAM · DATA SOURCES", ar: "المنبع · مصادر البيانات", zh: "上游 · 数据源" })}</div>
        <div className="node mf-colh" style={{ left: 240, top: 14, width: 235, textAlign: "center" }}>{colh("UC-01", tr({ en: "UNIFICATION", ar: "التوحيد", zh: "统一" }))}</div>
        <div className="node mf-colh" style={{ left: 540, top: 14, width: 230 }}>{tr({ en: "ORCHESTRATOR · PARALLEL AGENTS", ar: "المنسّق · وكلاء متوازون", zh: "编排器 · 并行智能体" })}</div>
        <div className="node mf-colh" style={{ left: 946, top: 14, width: 330, textAlign: "center" }}>{colh("UC-13", tr({ en: "REVENUE COLLECTION AGENTS", ar: "وكلاء تحصيل الإيرادات", zh: "收入征收智能体" }))}</div>
        <div className="node mf-colh" style={{ left: 1440, top: 14, width: 185, textAlign: "center" }}>{tr({ en: "DOWNSTREAM", ar: "اللاحق", zh: "下游" })}</div>
        {MF_V1.sources.map((s, i) => (<div className="node mf-src" style={{ left: 10, top: 60 + i * 86, width: 180 }} key={i}><span className="mf-badge">{s.k}</span><div><div className="t">{s.n}</div><div className="d">{tr(s.s)}</div></div></div>))}
        <div className="node mf-card u01" style={{ left: 240, top: 110, width: 235 }}>
          <div className="hd"><b>{colh("UC-01", tr({ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }))}</b><span className="chip">{tr({ en: "Data Foundation", ar: "أساس البيانات", zh: "数据基础" })}</span></div>
          <div className="row"><div className="k">{tr({ en: "Unification", ar: "التوحيد", zh: "统一" })}</div><div className="v">{tr({ en: "Cross-source entity resolution", ar: "حلّ الكيانات عبر المصادر", zh: "跨源实体解析" })}</div></div>
          <div className="row"><div className="k">{tr({ en: "Deduplication", ar: "إزالة التكرار", zh: "去重" })}</div><div className="v">{tr({ en: "Remove duplicate invoices/receipts", ar: "إزالة الفواتير/الإيصالات المكرّرة", zh: "去除重复发票/回款" })}</div></div>
          <div className="row"><div className="k">{tr({ en: "Mapping", ar: "المطابقة", zh: "映射" })}</div><div className="v">{tr({ en: "Furas to SAP AR to Doors / Services", ar: "فرص إلى SAP AR إلى الأبواب / الخدمات", zh: "Furas 到 SAP AR 到 门类/服务" })}</div></div>
          <div className="foot">{tr({ en: "Unified Revenue & Collection View", ar: "عرض موحّد للإيراد والتحصيل", zh: "统一收入与征收视图" })}</div>
        </div>
        <div className="node mf-orch" style={{ left: 540, top: 120, width: 190 }}><b>{tr({ en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" })}</b><span>{tr({ en: "Plan · Route · Aggregate", ar: "خطّط · وجّه · جمّع", zh: "规划 · 路由 · 汇聚" })}</span></div>
        <div className="node mf-dispatch" style={{ left: 645, top: 206 }}>{tr({ en: "dispatch", ar: "إرسال", zh: "派发" })}</div>
        {MF_V1.agents.map((a, i) => (<div className="node mf-card pa" style={{ left: 540, top: 255 + i * 138, width: 190 }} key={i}><div className="hd"><span className="pdot" /><b>{tr(a.n)}</b></div><div className="pd">{tr(a.d)}</div><span className="ptag">{tr(a.tag)}</span></div>))}
        <div className="node mf-aggr" style={{ left: 778, top: 408, width: 118 }}><b>{tr({ en: "Aggregator", ar: "المُجمِّع", zh: "汇聚器" })}</b><span>{tr({ en: "Merge · Validate · Reduce", ar: "دمج · تحقّق · اختزال", zh: "合并 · 校验 · 归约" })}</span></div>
        <div className="node mf-uc13" style={{ left: 946, top: 95, width: 330 }}>
          <div className="hd"><b>{colh("UC-13", tr({ en: "Revenue Analytics Agent", ar: "وكيل تحليلات الإيرادات", zh: "收入分析智能体" }))}</b><span className="core">{tr({ en: "CORE", ar: "أساسي", zh: "核心" })}</span></div>
          <div className="mf-narr"><div className="mf-narr-body">
            <div className="sct2">{tr({ en: "OUTPUTS", ar: "المخرجات", zh: "输出" })}</div>
            <div className="mf-outs">{MF_V1.outputs.map((o, i) => (<div className="mf-out" key={i}><div className="t"><span className="od" /> {tr(o.t)}</div><div className="s">{tr(o.s)}</div></div>))}</div>
          </div></div>
          <div className="mf-narr"><b>{tr({ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" })}<span className="core">{tr({ en: "CORE", ar: "أساسي", zh: "核心" })}</span></b>
            <div className="mf-narr-body">
              <div className="sct2">{tr({ en: "OUTPUTS", ar: "المخرجات", zh: "输出" })}</div>
              <div className="mf-outs">
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "AI Narratives", ar: "السرد الذكي", zh: "AI 叙述" })}</div><div className="s">{tr({ en: "natural-language explanations", ar: "تفسيرات بلغة طبيعية", zh: "自然语言解释" })}</div></div>
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Q&A", ar: "أسئلة وأجوبة", zh: "问答" })}</div><div className="s">{tr({ en: "conversational follow-ups", ar: "متابعات حوارية", zh: "对话式追问" })}</div></div>
              </div>
            </div>
          </div>
          <div className="mf-narr"><b>{tr({ en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" })}<span className="core">{tr({ en: "CORE", ar: "أساسي", zh: "核心" })}</span></b>
            <div className="mf-narr-body">
              <div className="sct2">{tr({ en: "OUTPUTS", ar: "المخرجات", zh: "输出" })}</div>
              <div className="mf-outs">
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Prioritize follow-up", ar: "أولوية المتابعة", zh: "优先跟进" })}</div><div className="s">{tr({ en: "top Amanat by gap", ar: "أعلى الأمانات فجوة", zh: "缺口最大阿玛纳" })}</div></div>
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Wusool template terms", ar: "شروط قالب وصول", zh: "Wusool 模板条款" })}</div><div className="s">{tr({ en: "review with legal", ar: "مراجعة مع القانونية", zh: "与法务复核" })}</div></div>
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Dunning workflow", ar: "مسار التحصيل", zh: "催收流程" })}</div><div className="s">{tr({ en: "contracts > 90 days", ar: "عقود > 90 يوماً", zh: "合同 > 90 天" })}</div></div>
              </div>
            </div>
          </div>
        </div>
        {MF_V1.down.map((d, i) => (<div className={"node mf-down " + d.cls} style={{ left: 1440, top: [30, 230, 430, 632][i], width: 185 }} key={i}><div className="t">{colh(d.code, tr(d.n))}</div>{d.agents ? <div className="mf-sublist">{d.agents.map((a, j) => (<div className="mf-subitem" key={j}><span className="sd" />{tr(a)}</div>))}</div> : <div className="s">{tr(d.s)}</div>}</div>))}
        <div className="node mf-edgelab" style={{ left: 480, top: 210 }}>{tr({ en: "unified data", ar: "بيانات موحّدة", zh: "统一数据" })}</div>
      </div></div>
    </div>
  </div>);
}
/* ===== UC-13 · Revenue Collection — Multi-Agent Flow ===== (rebuilt as full G-06 directorate flow) */
const F6_AG = {
  orch: { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器代理" },
  dataq: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询代理" },
  insight: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "主动洞察代理" },
  revan: { en: "Revenue Analysis Agent", ar: "وكيل تحليل الإيرادات", zh: "收入分析代理" },
  repgen: { en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成代理" },
  narr: { en: "Financial Narrative Commentary Agent", ar: "وكيل السرد المالي", zh: "财务叙述评论代理" },
  anom: { en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测代理" },
  market: { en: "Market Trends Detection Agent", ar: "وكيل اتجاهات السوق", zh: "市场趋势检测代理" },
  comp: { en: "Compliance / Rules Agent", ar: "وكيل الامتثال/القواعد", zh: "合规/规则代理" },
  fcast: { en: "Financial Forecasting Agent", ar: "وكيل التنبؤ المالي", zh: "财务预测代理" },
  roll: { en: "Rolling Forecasting Agent", ar: "وكيل التنبؤ المتجدد", zh: "滚动预测代理" },
  scen: { en: "Scenario Simulation Agent", ar: "وكيل محاكاة السيناريوهات", zh: "情景模拟代理" },
  budopt: { en: "Budget Optimization Agent", ar: "وكيل تحسين الميزانية", zh: "预算优化代理" },
};
const F6_SRC = ["SAP / Asas", "Etimad", "Esnad", "Tahseel", "Makeen", "Efaa", "Sanad", "Balady", "GRP", "BI", { en: "Local files", ar: "ملفات محلية", zh: "本地文件" }, { en: "Bank statements", ar: "كشوف بنكية", zh: "银行对账单" }, "Excel / PDF"];
const F6 = {
  uc01: { code: "UC-01", x: 300, y: 132, w: 236, h: 168, title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据统一 & 数据质量" }, ags: ["orch", "dataq", "insight"] },
  uc13: { code: "UC-13", x: 700, y: 132, w: 236, h: 168, title: { en: "Revenue, Collection & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、收款 & 排除项" }, ags: ["revan", "dataq", "insight"] },
  uc06: { code: "UC-06", x: 1100, y: 40, w: 236, h: 168, title: { en: "Financial Performance — Spend Analysis & Reporting", ar: "الأداء المالي — تحليل الإنفاق والتقارير", zh: "财务表现 — 支出分析与报告" }, ags: ["repgen", "narr", "dataq"] },
  uc02: { code: "UC-02", x: 1100, y: 250, w: 236, h: 168, title: { en: "Anomaly Detection — Alerts & Exceptions", ar: "كشف الشذوذ — التنبيهات والاستثناءات", zh: "异常检测 — 警报与异常" }, ags: ["anom", "insight", "orch"] },
  uc14: { code: "UC-14", x: 1474, y: 132, w: 230, h: 168, title: { en: "Assets — Classification, Capitalization, Returns & Maintenance", ar: "الأصول — التصنيف والرسملة والعوائد والصيانة", zh: "资产 — 分类、资本化、回报与维护" }, ags: ["dataq", "market", "comp"] },
  uc12: { code: "UC-12", x: 300, y: 524, w: 236, h: 168, title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、分配订单 & 资金" }, ags: ["dataq", "repgen", "anom"] },
  uc11: { code: "UC-11", x: 300, y: 732, w: 236, h: 168, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规性、政策 & 会计备忘" }, ags: ["comp", "repgen", "dataq"] },
  uc10: { code: "UC-10", x: 700, y: 524, w: 236, h: 168, title: { en: "Reports & Dashboards (Periodic / Executive)", ar: "التقارير ولوحات المعلومات (دوري/تنفيذي)", zh: "报告与仪表盘 (定期/执行)" }, ags: ["repgen", "narr", "dataq"] },
  uc03: { code: "UC-03", x: 700, y: 732, w: 236, h: 140, title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志 & 权限" }, ags: ["dataq", "insight"] },
};
const F6_GATE = { x: 1100, y: 606, w: 236, h: 188 };
const F6_DEL = { x: 1474, y: 620, w: 230, h: 152 };
function RcDataFlow() {
  const { tr, setRoute } = useStore();
  const colh = (code, name) => (SHOW_UC && code ? code + " · " : "") + name;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const CW = 1716, CH = 920;
  useEffect(() => {
    const calc = () => { const w = wrapRef.current ? wrapRef.current.clientWidth : CW; setScale(Math.min(1.3, w / CW)); };
    calc(); window.addEventListener("resize", calc); return () => window.removeEventListener("resize", calc);
  }, []);
  const aR = n => ({ x: n.x + n.w, y: n.y + n.h / 2 });
  const aL = n => ({ x: n.x, y: n.y + n.h / 2 });
  const aT = n => ({ x: n.x + n.w / 2, y: n.y });
  const aB = n => ({ x: n.x + n.w / 2, y: n.y + n.h });
  const o = (p, q) => { const mx = (p.x + q.x) / 2; return "M" + p.x + "," + p.y + " L" + mx + "," + p.y + " L" + mx + "," + q.y + " L" + q.x + "," + q.y; };
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const plen = (d) => { const pts = d.replace(/[ML]/g, "").trim().split(/\s+/).map(p => p.split(",").map(Number)); let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  const flyDur = (d) => Math.min(9, Math.max(1.8, plen(d) / 170));
  const F = F6, SRC = { x: 10, y: 64, w: 184, h: 300 };
  const b14 = aB(F.uc14);
  const w12 = "M" + b14.x + "," + b14.y + " L" + b14.x + ",462 L96,462 L96," + aL(F.uc12).y + " L" + aL(F.uc12).x + "," + aL(F.uc12).y;
  const w11 = "M" + (b14.x + 22) + "," + b14.y + " L" + (b14.x + 22) + ",488 L72,488 L72," + aL(F.uc11).y + " L" + aL(F.uc11).x + "," + aL(F.uc11).y;
  const E = [
    { d: o(aR(SRC), aL(F.uc01)), c: "g", lp: mid(aR(SRC), aL(F.uc01)), t: { en: "Raw revenue, asset feeds", ar: "بيانات خام", zh: "原始/资产数据" } },
    { d: o(aR(F.uc01), aL(F.uc13)), c: "b", lp: mid(aR(F.uc01), aL(F.uc13)), t: { en: "Unified revenue/collection data + DQ flags", ar: "موحّد + الجودة", zh: "统一+DQ标志" } },
    { d: o(aR(F.uc13), aL(F.uc06)), c: "b", lp: mid(aR(F.uc13), aL(F.uc06)), t: { en: "Net billed, collection rate & exclusions", ar: "الإنفاق والنسب", zh: "净开支/费率" } },
    { d: o(aR(F.uc13), aL(F.uc02)), c: "b", lp: mid(aR(F.uc13), aL(F.uc02)), t: { en: "Collection gaps & objection signals", ar: "الفجوات", zh: "缺口&异议" } },
    { d: o(aR(F.uc06), aL(F.uc14)), c: "b", lp: mid(aR(F.uc06), aL(F.uc14)), t: { en: "Spend & performance metrics", ar: "مؤشرات الأداء", zh: "支出绩效指标" } },
    { d: o(aR(F.uc02), aL(F.uc14)), c: "b", lp: mid(aR(F.uc02), aL(F.uc14)), t: { en: "Anomalies & exception list", ar: "الاستثناءات", zh: "异常列表" } },
    { d: w12, c: "b", lp: { x: 760, y: 452 }, t: { en: "Asset register, capitalization & cost", ar: "سجل الأصول والتكلفة", zh: "资产登记 / 资本化成本" } },
    { d: w11, c: "b", lp: { x: 360, y: 500 }, t: { en: "Asset classification & guide references", ar: "تصنيف الأصول والمراجع", zh: "资产分类 / 指标参考" } },
    { d: o(aR(F.uc12), aL(F.uc10)), c: "b", lp: mid(aR(F.uc12), aL(F.uc10)), t: { en: "Costs, assignment orders & fund balances", ar: "التكاليف والأرصدة", zh: "成本&资金余额" } },
    { d: o(aB(F.uc12), aT(F.uc11)), c: "b", lp: mid(aB(F.uc12), aT(F.uc11)), t: { en: "Compliance findings & memos", ar: "النتائج والمذكرات", zh: "合规结果&备忘" } },
    { d: o({ x: aR(F.uc11).x, y: aR(F.uc11).y + 16 }, aL(F.uc03)), c: "b", lp: mid(aR(F.uc11), aL(F.uc03)), t: { en: "Policy refs & audit traceability", ar: "السياسات والتدقيق", zh: "政策&审计追溯" } },
    { d: o({ x: aR(F.uc11).x, y: aR(F.uc11).y - 24 }, aL(F.uc10)), c: "b", lp: { x: 618, y: 690 }, t: { en: "Cost queries & lineage", ar: "استعلام التكلفة", zh: "成本查询&谱系" } },
    { d: o(aR(F.uc10), aL(F6_GATE)), c: "b", lp: mid(aR(F.uc10), aL(F6_GATE)), t: { en: "Draft executive & periodic reports", ar: "المسودات والتقارير", zh: "草案&双周报告" } },
    { d: o(aR(F.uc03), { x: F6_GATE.x, y: F6_GATE.y + F6_GATE.h - 44 }), c: "b", lp: mid(aR(F.uc03), aL(F6_GATE)), t: { en: "Query answers, audit trail & permissioned exports", ar: "الإجابات والتدقيق", zh: "答案/审计/许可" } },
    { d: o(aR(F6_GATE), aL(F6_DEL)), c: "o", lp: mid(aR(F6_GATE), aL(F6_DEL)), t: { en: "Approved Revenue & Asset Reports", ar: "تقارير معتمدة", zh: "已批准报告" } },
  ];
  const stroke = c => c === "g" ? "#9aa7b5" : c === "o" ? "#d98324" : "#2563eb";
  const marker = c => c === "g" ? "url(#mfag)" : c === "o" ? "url(#mfao)" : "url(#mfab)";
  const ucBox = (n) => (<div className="node mf-down green f6uc" style={{ left: n.x, top: n.y, width: n.w, minHeight: n.h }} key={n.code}>
    <div className="t"><span className="od" />{colh(n.code, tr(n.title))}</div>
    <div className="mf-sublist">{n.ags.map((k, i) => (<div className="mf-subitem" key={i}><span className="sd" />{tr(F6_AG[k])}</div>))}</div>
  </div>);
  return (<div className="fade mf">
    <div className="card pad mf-frame">
      <h1 style={{ fontSize: 21 }}><button className="pg-back" onClick={() => setRoute("rcwork")}>‹</button>{tr({ en: "G-06 Revenue & Assets Directorate — Use-case storyline & agent I/O flow", ar: "مديرية الإيرادات والأصول ج-06 — قصة حالات الاستخدام وتدفّق الوكلاء", zh: "G-06 收入与资产总局 — 使用案例故事情节及代理/输入输出流程" })}</h1>
      <div className="sub muted" style={{ marginTop: 3 }}>{tr({ en: "Full directorate flow · sources → UC chain (agents & I/O) → mandatory human gate → deliverables · wraps to a second row", ar: "تدفّق المديرية الكامل · المصادر ← سلسلة الحالات ← البوابة البشرية ← المخرجات", zh: "总局完整流程 · 数据源 → 各 UC(代理与输入/输出)→ 强制人工关卡 → 可交付成果 · 连线换行至第二排" })} · <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: 700 }} onClick={() => setRoute("rcdatav1")}>{tr({ en: "view v1", ar: "النسخة v1", zh: "查看旧版 v1" })} ↗</span></div>
      <div className="f6-legend"><span className="f6lg f6lg-main">{tr({ en: "Main flow", ar: "التدفّق الرئيسي", zh: "主流程" })}</span><span className="f6lg f6lg-gate">{tr({ en: "Mandatory human gate", ar: "بوابة بشرية إلزامية", zh: "强制人工关卡" })}</span><span className="f6lg f6lg-chip">{tr({ en: "Agent chip", ar: "شريحة وكيل", zh: "代理芯片" })}</span><span className="f6lg f6lg-src">{tr({ en: "Sources / deliverables", ar: "المصادر/المخرجات", zh: "数据源 / 成果" })}</span></div>

      <div className="mf-canvas-wrap" ref={wrapRef} style={{ height: Math.ceil(CH * scale) }}><div className="mf-canvas" style={{ width: CW, height: CH, transform: "scale(" + scale + ")", transformOrigin: "top left" }}>
        <svg className="mf-svg" width={CW} height={CH} viewBox={"0 0 " + CW + " " + CH} fill="none">
          <defs>
            <marker id="mfag" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#9aa7b5" strokeWidth="1.6" /></marker>
            <marker id="mfab" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#2563eb" strokeWidth="1.8" /></marker>
            <marker id="mfao" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#d98324" strokeWidth="1.8" /></marker>
          </defs>
          {E.map((e, i) => (<path key={i} d={e.d} stroke={stroke(e.c)} strokeWidth={e.c === "g" ? 1.7 : 2} fill="none" markerEnd={marker(e.c)} />))}
          {E.map((e, i) => (<circle key={"fly" + i} r="3.4" fill={stroke(e.c)}><animateMotion dur={flyDur(e.d) + "s"} begin={(i * 0.13) + "s"} repeatCount="indefinite" path={e.d} /></circle>))}
        </svg>

        <div className="node mf-down gray" style={{ left: SRC.x, top: SRC.y, width: SRC.w, minHeight: SRC.h }}>
          <div className="t">{tr({ en: "Data Sources", ar: "مصادر البيانات", zh: "数据源" })}</div>
          <div className="f6-srclist">{F6_SRC.map((s, i) => (<div key={i}>{typeof s === "string" ? s : tr(s)}</div>))}</div>
        </div>

        {Object.keys(F6).map(k => ucBox(F6[k]))}

        <div className="node mf-down gold" style={{ left: F6_GATE.x, top: F6_GATE.y, width: F6_GATE.w, minHeight: F6_GATE.h }}>
          <div className="t">⚖ {tr({ en: "Human Review · Mandatory Gate", ar: "مراجعة بشرية · بوابة إلزامية", zh: "人工审核 · 强制门" })}</div>
          <div className="s">{tr({ en: "Validate & approve · draft reports · query answers · authorize export", ar: "تحقّق واعتمد · المسودات · الإجابات · تفويض التصدير", zh: "验证并批准 · 草稿报告 · 查询答案 · 授权出口" })}</div>
        </div>
        <div className="node mf-down gray" style={{ left: F6_DEL.x, top: F6_DEL.y, width: F6_DEL.w, minHeight: F6_DEL.h }}>
          <div className="t">📦 {tr({ en: "Deliverables", ar: "المخرجات", zh: "可交付成果" })}</div>
          <div className="s">{tr({ en: "Revenue & Asset Reports · periodic / bi-weekly · approved & authorized", ar: "تقارير الإيرادات والأصول · دورية · معتمدة", zh: "收入 & 资产报告 · 定期 / 双周 · 已批准 & 授权" })}</div>
        </div>

        {E.map((e, i) => (<div className="node mf-edgelab" style={{ left: e.lp.x - 54, top: e.lp.y, width: 108, textAlign: "center", transform: "translateY(-50%)" }} key={"l" + i}>{tr(e.t)}</div>))}
      </div></div>
    </div>
  </div>);
}

/* ===== Generic directorate multi-agent flow (per BRD group) ===== */
function DirectorateFlow({ flow }) {
  const { tr, setRoute, backRoute, setBackRoute } = useStore();
  const colh = (code, name) => (SHOW_UC && code ? code + " · " : "") + name;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const _bx = [flow.src, flow.gate, flow.del].concat(Object.keys(flow.nodes).map(k => flow.nodes[k])).filter(Boolean);
  const CW = Math.max.apply(null, _bx.map(b => b.x + b.w)) + 28;
  const CH = Math.max.apply(null, _bx.map(b => b.y + b.h)) + 22;
  useEffect(() => {
    const calc = () => { const w = wrapRef.current ? wrapRef.current.clientWidth : CW; setScale(Math.min(1.12, w / CW)); };
    calc(); window.addEventListener("resize", calc); return () => window.removeEventListener("resize", calc);
  }, [CW]);
  const aR = n => ({ x: n.x + n.w, y: n.y + n.h / 2 });
  const aL = n => ({ x: n.x, y: n.y + n.h / 2 });
  const aT = n => ({ x: n.x + n.w / 2, y: n.y });
  const aB = n => ({ x: n.x + n.w / 2, y: n.y + n.h });
  const AN = { R: aR, L: aL, T: aT, B: aB };
  const o = (p, q) => { const mx = (p.x + q.x) / 2; return "M" + p.x + "," + p.y + " L" + mx + "," + p.y + " L" + mx + "," + q.y + " L" + q.x + "," + q.y; };
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const plen = (d) => { const pts = d.replace(/[ML]/g, "").trim().split(/\s+/).map(p => p.split(",").map(Number)); let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  const flyDur = (d) => Math.min(9, Math.max(1.8, plen(d) / 170));
  const N = (id) => id === "src" ? flow.src : id === "gate" ? flow.gate : id === "del" ? flow.del : flow.nodes[id];
  const E = flow.edges.map(e => {
    const p = AN[e.fa](N(e.from)), q = AN[e.ta](N(e.to));
    const d = e.d || o(p, q);
    const lp = e.lp || mid(p, q);
    return { d, c: e.c, lp, t: e.t };
  });
  const stroke = c => c === "g" ? "#9aa7b5" : c === "o" ? "#d98324" : "#2563eb";
  const marker = c => c === "g" ? "url(#mfag)" : c === "o" ? "url(#mfao)" : "url(#mfab)";
  const ucBox = (n) => (<div className="node mf-down green f6uc" style={{ left: n.x, top: n.y, width: n.w, minHeight: n.h }} key={n.code}>
    <div className="t"><span className="od" />{colh(n.code, tr(n.title))}</div>
    {n.desc && <div className="mf-ndesc">{tr(n.desc)}</div>}
    <div className="mf-sublist">{n.ags.map((k, i) => (<div className="mf-subitem" key={i}><span className="sd" />{tr(F6_AG[k])}</div>))}</div>
  </div>);
  const back = () => { if (backRoute) { const b = backRoute; setBackRoute(null); setRoute(b); } else setRoute(flow.back); };
  return (<div className="fade mf">
    <div className="card pad mf-frame">
      <h1 style={{ fontSize: 21 }}><button className="pg-back" onClick={back}>‹</button>{tr(flow.title)}</h1>
      <div className="sub muted" style={{ marginTop: 3 }}>{tr(flow.subtitle)}</div>
      <div className="f6-legend"><span className="f6lg f6lg-main">{tr({ en: "Main flow", ar: "التدفّق الرئيسي", zh: "主流程" })}</span>{flow.gate && <span className="f6lg f6lg-gate">{tr({ en: "Mandatory human gate", ar: "بوابة بشرية إلزامية", zh: "强制人工关卡" })}</span>}<span className="f6lg f6lg-chip">{tr({ en: "Agent chip", ar: "شريحة وكيل", zh: "代理芯片" })}</span><span className="f6lg f6lg-src">{tr({ en: "Sources / deliverables", ar: "المصادر/المخرجات", zh: "数据源 / 成果" })}</span></div>
      <div className="mf-canvas-wrap" ref={wrapRef} style={{ height: Math.ceil(CH * scale) }}><div style={{ width: Math.ceil(CW * scale), height: Math.ceil(CH * scale), margin: "0 auto", position: "relative" }}><div className="mf-canvas" style={{ width: CW, height: CH, transform: "scale(" + scale + ")", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <svg className="mf-svg" width={CW} height={CH} viewBox={"0 0 " + CW + " " + CH} fill="none">
          <defs>
            <marker id="mfag" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#9aa7b5" strokeWidth="1.6" /></marker>
            <marker id="mfab" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#2563eb" strokeWidth="1.8" /></marker>
            <marker id="mfao" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#d98324" strokeWidth="1.8" /></marker>
          </defs>
          {E.map((e, i) => (<path key={i} d={e.d} stroke={stroke(e.c)} strokeWidth={e.c === "g" ? 1.7 : 2} fill="none" markerEnd={marker(e.c)} />))}
          {E.map((e, i) => (<circle key={"fly" + i} r="3.4" fill={stroke(e.c)}><animateMotion dur={flyDur(e.d) + "s"} begin={(i * 0.13) + "s"} repeatCount="indefinite" path={e.d} /></circle>))}
        </svg>
        <div className="node mf-down gray" style={{ left: flow.src.x, top: flow.src.y, width: flow.src.w, minHeight: flow.src.h }}>
          <div className="t">{tr({ en: "Data Sources", ar: "مصادر البيانات", zh: "数据源" })}</div>
          <div className="f6-srclist">{flow.src.list.map((s, i) => (<div key={i}>{typeof s === "string" ? s : tr(s)}</div>))}</div>
        </div>
        {Object.keys(flow.nodes).map(k => ucBox(flow.nodes[k]))}
        {flow.gate && (flow.gate.items ? (
        <div className="mf-gate" style={{ left: flow.gate.x, top: flow.gate.y, width: flow.gate.w, minHeight: flow.gate.h }}>
          <div className="mf-gate-h">{tr(flow.gate.head)}</div>
          <div className="mf-gate-b">
            <p className="mf-gate-intro">{tr(flow.gate.intro)}</p>
            <div className="mf-gate-lab">{tr(flow.gate.ckLabel || { en: "Review checkpoints:", ar: "نقاط المراجعة:", zh: "复核检查点:" })}</div>
            <ul className="mf-gate-ul">{flow.gate.items.map((it, k) => (<li key={k}>{tr(it)}</li>))}</ul>
            {flow.gate.foot && <div className="mf-gate-foot">{tr(flow.gate.foot)}</div>}
          </div>
        </div>
        ) : (
        <div className="node mf-down gold" style={{ left: flow.gate.x, top: flow.gate.y, width: flow.gate.w, minHeight: flow.gate.h }}>
          <div className="t">⚖ {tr({ en: "Human Review · Mandatory Gate", ar: "مراجعة بشرية · بوابة إلزامية", zh: "人工审核 · 强制门" })}</div>
          <div className="s">{tr(flow.gate.sub)}</div>
        </div>
        ))}
        {flow.del && (flow.del.items ? (
        <div className="mf-deliv" style={{ left: flow.del.x, top: flow.del.y, width: flow.del.w, minHeight: flow.del.h }}>
          <div className="mf-deliv-h">{tr(flow.del.head || { en: "Outputs / Deliverables", ar: "المخرجات", zh: "输出 / 可交付成果" })}</div>
          {flow.del.items.map((it, k) => (<div className="mf-deliv-c" key={k}><b>{tr(it.t)}</b><span>{tr(it.d)}</span></div>))}
          {flow.del.foot && <div className="mf-deliv-f">{tr(flow.del.foot)}</div>}
        </div>
        ) : (
        <div className="node mf-down gray" style={{ left: flow.del.x, top: flow.del.y, width: flow.del.w, minHeight: flow.del.h }}>
          <div className="t">📦 {tr({ en: "Deliverables", ar: "المخرجات", zh: "可交付成果" })}</div>
          <div className="s">{tr(flow.del.sub)}</div>
        </div>
        ))}
        {E.map((e, i) => (<div className="node mf-edgelab" style={{ left: e.lp.x - 54, top: e.lp.y, width: 108, textAlign: "center", transform: "translateY(-50%)" }} key={"l" + i}>{tr(e.t)}</div>))}
      </div></div></div>
    </div>
  </div>);
}

/* ---- G-02 · Planning & Financial Performance (UC-04/05/06) ---- */
const MF_G02 = {
  back: "fpawork", cw: 1560, ch: 560,
  title: { en: "Planning & Financial Performance — Multi-Agent Flow (G-02)", ar: "التخطيط والأداء المالي — تدفّق متعدد الوكلاء (ج-02)", zh: "规划与财务绩效 — 多智能体流程(G-02)" },
  subtitle: { en: "Analysis & forecasting layer · data inputs → forecasting → scenarios → performance → outputs", ar: "طبقة التحليل والتنبؤ · المدخلات ← التنبؤ ← السيناريوهات ← الأداء ← المخرجات", zh: "分析与预测层 · 数据输入 → 预测 → 情景 → 绩效 → 输出" },
  src: { x: 14, y: 80, w: 188, h: 320, list: [
    { en: "Unified Data (UC-01) — structured financial data", ar: "بيانات موحّدة (UC-01)", zh: "统一数据(UC-01)— 结构化财务数据" },
    { en: "Budget Planning (UC-07) — ceilings & envelopes", ar: "تخطيط الميزانية (UC-07)", zh: "预算规划(UC-07)— 上限与额度" },
    { en: "Cost Drivers (UC-15) — external cost signals", ar: "محرّكات التكلفة (UC-15)", zh: "成本驱动(UC-15)— 外部成本信号" },
  ] },
  nodes: {
    uc04: { code: "UC-04", x: 276, y: 146, w: 244, h: 212, title: { en: "Financial Forecasting — Future Commitments", ar: "التنبؤ المالي — الالتزامات المستقبلية", zh: "财务预测 — 未来承诺" }, ags: ["fcast", "roll", "market"] },
    uc05: { code: "UC-05", x: 572, y: 146, w: 244, h: 212, title: { en: "Scenario Simulation — Alternatives", ar: "محاكاة السيناريوهات — البدائل", zh: "情景模拟 — 备选方案" }, ags: ["scen", "budopt", "insight"] },
    uc06: { code: "UC-06", x: 868, y: 146, w: 244, h: 212, title: { en: "Performance Analysis & Executive Reports", ar: "تحليل الأداء والتقارير التنفيذية", zh: "绩效分析与执行报告" }, ags: ["repgen", "narr", "dataq"] },
  },
  del: { x: 1240, y: 84, w: 244, h: 392,
    head: { en: "Outputs / Deliverables", ar: "المخرجات / المُسلّمات", zh: "输出 / 可交付成果" },
    items: [
      { t: { en: "Forecasted Commitments", ar: "التزامات متوقعة", zh: "预测承诺" }, d: { en: "Future needs & obligations", ar: "الاحتياجات والالتزامات", zh: "未来需求与义务" } },
      { t: { en: "Scenario Comparisons", ar: "مقارنات السيناريوهات", zh: "情景对比" }, d: { en: "Impact & trade-off analysis", ar: "تحليل الأثر والمفاضلات", zh: "影响与权衡分析" } },
      { t: { en: "Performance Dashboards", ar: "لوحات الأداء", zh: "绩效仪表盘" }, d: { en: "Executive reports & KPIs", ar: "تقارير تنفيذية ومؤشرات", zh: "执行报告与 KPI" } },
    ],
    foot: { en: "Downstream (G-02 storyline continuation) · G-02 storyline (UC-02/UC-03) deviations & corrections · financial reports dashboards & executive summaries · deviations & alerts exception notifications.", ar: "المصب (استمرار قصة ج-02) · قصة ج-02 (UC-02/UC-03) الانحرافات والتصحيحات · التقارير المالية لوحات وملخصات · الانحرافات والتنبيهات إشعارات الاستثناءات.", zh: "下游(G-02 故事线延续)· G-02 故事线(UC-02/UC-03)偏差与纠正 · 财务报告 仪表盘与执行摘要 · 偏差与告警 异常通知。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc04", ta: "L", c: "g", t: { en: "Unified data, ceilings, cost drivers", ar: "بيانات موحّدة وسقوف ومحرّكات", zh: "统一数据、上限、成本驱动" } },
    { from: "uc04", fa: "R", to: "uc05", ta: "L", c: "b", t: { en: "Forecasted commitments & needs", ar: "التزامات واحتياجات متوقعة", zh: "预测承诺与需求" } },
    { from: "uc05", fa: "R", to: "uc06", ta: "L", c: "b", t: { en: "Scenario comparisons & impact", ar: "مقارنات السيناريوهات والأثر", zh: "情景对比与影响" } },
    { from: "uc06", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Performance reports & outputs", ar: "تقارير الأداء والمخرجات", zh: "绩效报告与输出" } },
  ],
};

const MF_G03 = {
  back: "buwork", cw: 2020, ch: 820,
  title: { en: "Budget Execution Department — Multi-Agent Flow (G-03)", ar: "إدارة تنفيذ الميزانية — تدفّق متعدد الوكلاء (ج-03)", zh: "预算执行部 — 多智能体流程(G-03)" },
  subtitle: { en: "Second-level department · 7 use cases · central reconciliation core · UC-01 → UC-17 → UC-02 → UC-04 → UC-07 → UC-03 → UC-10 · all handoffs orchestrated with audit logging", ar: "إدارة من المستوى الثاني · 7 حالات · نواة تسوية مركزية · جميع عمليات التسليم منسّقة مع سجل تدقيق", zh: "二级部门 · 7 个用例 · 中央对账核心 · UC-01 → UC-17 → UC-02 → UC-04 → UC-07 → UC-03 → UC-10 · 所有交接由编排器协调并审计记录" },
  src: { x: 14, y: 96, w: 184, h: 320, list: [{ en: "SAP / Asas — ERP financial source", ar: "ساب / أساس — مصدر مالي", zh: "SAP / Asas — ERP 财务源" }, { en: "Etimad — MoF execution platform", ar: "اعتماد — منصة التنفيذ", zh: "Etimad — 执行平台" }, { en: "Hyperion / MTFP — planning & consolidation", ar: "هايبريون / MTFP — التخطيط والتجميع", zh: "Hyperion / MTFP — 规划与合并" }, { en: "Excel templates — manual / structured uploads", ar: "قوالب إكسل — رفع يدوي/منظّم", zh: "Excel 模板 — 手动/结构化上传" }] },
  nodes: {
    uc01: { code: "UC-01", x: 268, y: 100, w: 224, h: 184, title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据统一与数据质量" }, ags: ["orch", "dataq", "insight"] },
    uc17: { code: "UC-17", x: 560, y: 84, w: 250, h: 216, title: { en: "Budget Execution Tracking & Reconciliation", ar: "تتبّع تنفيذ الميزانية والتسوية", zh: "预算执行跟踪与对账" }, ags: ["orch", "dataq", "repgen", "anom", "narr", "insight"] },
    uc02: { code: "UC-02", x: 882, y: 100, w: 224, h: 184, title: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, ags: ["anom", "insight", "orch"] },
    uc04: { code: "UC-04", x: 1176, y: 100, w: 224, h: 184, title: { en: "Forecasting Commitments & Future Needs", ar: "التنبؤ بالالتزامات والاحتياجات المستقبلية", zh: "预测承诺与未来需求" }, ags: ["fcast", "roll", "market"] },
    uc07: { code: "UC-07", x: 1470, y: 100, w: 224, h: 184, title: { en: "Budget Planning, Ceilings & Fiscal Space", ar: "تخطيط الميزانية والسقوف والحيّز المالي", zh: "预算规划、上限与财政空间" }, ags: ["budopt", "scen", "roll"] },
    uc03: { code: "UC-03", x: 300, y: 520, w: 230, h: 176, title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, ags: ["dataq", "orch", "insight"] },
    uc10: { code: "UC-10", x: 742, y: 520, w: 262, h: 176, title: { en: "Financial & Mgmt Reports Generation & Narrative", ar: "توليد التقارير المالية والإدارية والسرد", zh: "财务与管理报告生成及叙述" }, ags: ["repgen", "narr", "dataq"] },
  },
  gate: { x: 1252, y: 470, w: 366, h: 296,
    head: { en: "Mandatory Human Review (Human-in-the-Loop)", ar: "مراجعة بشرية إلزامية (إنسان ضمن الحلقة)", zh: "强制人工复核(人在回路)" },
    intro: { en: "All use-case outputs from the Budget Execution Department are reviewed and approved by department officers before being released as official reports, alerts, or exports.", ar: "تُراجَع جميع مخرجات الحالات في إدارة تنفيذ الميزانية وتُعتمد من مسؤولي الإدارة قبل إصدارها كتقارير أو تنبيهات أو صادرات رسمية.", zh: "预算执行部所有用例输出在作为正式报告、告警或导出发布前,均由部门官员复核批准。" },
    ckLabel: { en: "Review checkpoints:", ar: "نقاط المراجعة:", zh: "复核检查点:" },
    items: [
      { en: "Validate reconciliation results before publication", ar: "التحقّق من نتائج التسوية قبل النشر", zh: "发布前校验对账结果" },
      { en: "Confirm anomalies and severity before alerting", ar: "تأكيد الانحرافات وخطورتها قبل التنبيه", zh: "告警前确认异常与严重度" },
      { en: "Approve forecasts and ceilings before commitment", ar: "اعتماد التنبؤات والسقوف قبل الالتزام", zh: "承诺前批准预测与上限" },
      { en: "Sign off narrative and final reports before export", ar: "اعتماد السرد والتقارير النهائية قبل التصدير", zh: "导出前签核叙述与最终报告" },
    ],
    foot: { en: "Gate between department workspace and external deliverables.", ar: "بوابة بين مساحة عمل الإدارة والمُسلّمات الخارجية.", zh: "部门工作区与对外交付物之间的关卡。" },
  },
  del: { x: 1748, y: 64, w: 244, h: 712,
    head: { en: "Outputs / Deliverables", ar: "المخرجات / المُسلّمات", zh: "输出 / 可交付成果" },
    items: [
      { t: { en: "Reconciliation reports", ar: "تقارير التسوية", zh: "对账报告" }, d: { en: "Etimad vs internal ledgers", ar: "اعتماد مقابل الدفاتر الداخلية", zh: "Etimad 与内部账簿核对" } },
      { t: { en: "Tracking dashboards", ar: "لوحات المتابعة", zh: "跟踪仪表盘" }, d: { en: "Execution KPIs · live", ar: "مؤشرات التنفيذ · حية", zh: "执行 KPI · 实时" } },
      { t: { en: "Deviation alerts", ar: "تنبيهات الانحراف", zh: "偏差告警" }, d: { en: "Threshold & anomaly based", ar: "حسب الحدود والشذوذ", zh: "基于阈值与异常" } },
      { t: { en: "Narrative analysis", ar: "تحليل سردي", zh: "叙述分析" }, d: { en: "Commentary & explanations", ar: "تعليقات وتفسيرات", zh: "评述与解释" } },
      { t: { en: "Excel / PDF exports", ar: "تصدير إكسل / PDF", zh: "Excel / PDF 导出" }, d: { en: "Formatted deliverables", ar: "مُسلّمات منسّقة", zh: "格式化交付物" } },
    ],
    foot: { en: "Released only after the mandatory human review checkpoint signs off.", ar: "يُصدر فقط بعد اعتماد نقطة المراجعة البشرية الإلزامية.", zh: "仅在强制人工复核检查点签核后发布。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc01", ta: "L", c: "g", t: { en: "Raw & reference source data", ar: "بيانات مصدرية خام ومرجعية", zh: "原始与参考源数据" } },
    { from: "uc01", fa: "R", to: "uc17", ta: "L", c: "b", t: { en: "Unified, validated data", ar: "بيانات موحّدة ومُتحقّقة", zh: "统一校验数据" } },
    { from: "uc17", fa: "R", to: "uc02", ta: "L", c: "b", t: { en: "Reconciled execution data", ar: "بيانات تنفيذ مسوّاة", zh: "对账后的执行数据" } },
    { from: "uc02", fa: "R", to: "uc04", ta: "L", c: "b", t: { en: "Exceptions & flags", ar: "الاستثناءات والإشارات", zh: "例外与标记" } },
    { from: "uc04", fa: "R", to: "uc07", ta: "L", c: "b", t: { en: "Forecast commitments & needs", ar: "الالتزامات والاحتياجات المتوقعة", zh: "预测承诺与需求" } },
    { from: "uc07", fa: "B", to: "uc03", ta: "T", c: "b", d: "M1582,284 L1582,444 L415,444 L415,520", lp: { x: 1000, y: 444 }, t: { en: "continue", ar: "متابعة", zh: "继续" } },
    { from: "uc03", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Query results & audit trail", ar: "نتائج الاستعلام وسجل التدقيق", zh: "查询结果与审计轨迹" } },
    { from: "uc10", fa: "R", to: "gate", ta: "L", c: "b", t: { en: "Reports & narrative for review", ar: "التقارير والسرد للمراجعة", zh: "报告与叙述待复核" } },
    { from: "gate", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Approved reports & alerts (after sign-off)", ar: "تقارير وتنبيهات معتمدة (بعد الاعتماد)", zh: "已批准报告与告警(签核后)" } },
  ],
};

const MF_G04 = {
  back: "entwork", cw: 2080, ch: 760,
  title: { en: "General Administration of Affairs Finance — Multi-Agent Flow (G-04)", ar: "الإدارة العامة لشؤون المالية — تدفّق متعدد الوكلاء (ج-04)", zh: "财务事务总局 — 多智能体流程(G-04)" },
  subtitle: { en: "Two sub-departments (Financial Entitlements + Audit) · data unification → entitlements → anomaly → closing → reports → smart query → governance gate → approved outputs", ar: "إدارتان (الاستحقاقات + التدقيق) · التوحيد ← الاستحقاقات ← الشذوذ ← الإقفال ← التقارير ← الاستعلام ← البوابة ← المخرجات", zh: "两个子部门(财务权益 + 审计)· 数据统一 → 权益 → 异常 → 关账 → 报告 → 智能查询 → 治理关卡 → 已批准输出" },
  src: { x: 14, y: 104, w: 190, h: 340, list: [
    { en: "SAP/Asas · Etimad", ar: "ساب/أساس · اعتماد", zh: "SAP/Asas · Etimad" },
    { en: "GRP · Hyperion/MTFP", ar: "GRP · هايبريون", zh: "GRP · Hyperion/MTFP" },
    { en: "BI · Tahseel", ar: "BI · تحصيل", zh: "BI · Tahseel" },
    { en: "Makeen/Balady · Efaa", ar: "مكين/بلدي · إيفاء", zh: "Makeen/Balady · Efaa" },
    { en: "Sanad · Esnad", ar: "سند · إسناد", zh: "Sanad · Esnad" },
    { en: "Excel / PDF files", ar: "ملفات إكسل / PDF", zh: "Excel / PDF 文件" },
  ] },
  nodes: {
    uc01: { code: "UC-01", x: 248, y: 120, w: 236, h: 204, title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据统一与质量" }, ags: ["orch", "dataq", "insight"] },
    uc08: { code: "UC-08", x: 516, y: 120, w: 236, h: 204, title: { en: "Contracts, Claims, Disbursement & Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" }, ags: ["anom", "orch", "comp"] },
    uc02: { code: "UC-02", x: 784, y: 120, w: 236, h: 204, title: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, ags: ["anom", "insight", "orch"] },
    uc09: { code: "UC-09", x: 1052, y: 120, w: 236, h: 204, title: { en: "Financial Closing, Reconciliation & Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" }, ags: ["repgen", "comp", "anom"] },
    uc10: { code: "UC-10", x: 1320, y: 120, w: 236, h: 204, title: { en: "Periodic Financial Reports & Disclosures", ar: "التقارير المالية الدورية والإفصاحات", zh: "周期财务报告与披露" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 1588, y: 120, w: 236, h: 204, title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, ags: ["dataq", "orch", "insight"] },
  },
  gate: { x: 1186, y: 500, w: 332, h: 204, sub: { en: "Governance gate · Human Review (mandatory) — finance officer validates entitlements, settlements, reconciliations & disclosures before final approval.", ar: "بوابة حوكمة · مراجعة بشرية إلزامية — يتحقق المسؤول المالي من الاستحقاقات والتسويات والإفصاحات قبل الاعتماد.", zh: "治理关卡 · 强制人工复核 —— 财务官在最终批准前核验权益、结算、对账与披露。" } },
  del: { x: 430, y: 484, w: 308, h: 220,
    head: { en: "Approved Disbursement / Closing Reports", ar: "الصرف / تقارير الإقفال المعتمدة", zh: "已批准拨付 / 关账报告" },
    items: [
      { t: { en: "Net entitlements", ar: "صافي الاستحقاقات", zh: "净权益" }, d: { en: "verified amounts due", ar: "مبالغ مستحقة متحققة", zh: "已核验应付额" } },
      { t: { en: "Final account", ar: "الحساب الختامي", zh: "决算账户" }, d: { en: "closed-period balances", ar: "أرصدة الفترة المقفلة", zh: "关账期余额" } },
      { t: { en: "Monthly tables", ar: "الجداول الشهرية", zh: "月度报表" }, d: { en: "period summaries", ar: "ملخصات الفترة", zh: "期间汇总" } },
      { t: { en: "Disclosures", ar: "الإفصاحات", zh: "披露" }, d: { en: "compliance notes", ar: "ملاحظات الامتثال", zh: "合规说明" } },
    ],
    foot: { en: "Released after the governance gate signs off.", ar: "تُصدر بعد اعتماد بوابة الحوكمة.", zh: "经治理关卡签核后发布。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc01", ta: "L", c: "g", t: { en: "Raw multi-system data", ar: "بيانات خام متعددة الأنظمة", zh: "原始多系统数据" } },
    { from: "uc01", fa: "R", to: "uc08", ta: "L", c: "b", t: { en: "Unified contracts / claims / disbursement", ar: "عقود / مطالبات / صرف موحّدة", zh: "统一的合同/索赔/拨付" } },
    { from: "uc08", fa: "R", to: "uc02", ta: "L", c: "b", t: { en: "Matching gaps & diffs", ar: "فجوات وفروق المطابقة", zh: "匹配缺口与差异" } },
    { from: "uc02", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Anomalies / exceptions", ar: "الانحرافات / الاستثناءات", zh: "异常 / 例外" } },
    { from: "uc09", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Reconciliation diffs & settlements", ar: "فروق المطابقة والتسويات", zh: "对账差异与结算" } },
    { from: "uc10", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Reports & figures for query/audit", ar: "التقارير والأرقام للاستعلام/التدقيق", zh: "报告与数据 → 查询/审计" } },
    { from: "uc03", fa: "B", to: "gate", ta: "T", c: "b", t: { en: "Answers · audit trail · permissioned export", ar: "الإجابات · سجل التدقيق · تصدير مصرّح", zh: "答案 · 审计轨迹 · 授权导出" } },
    { from: "gate", fa: "L", to: "del", ta: "R", c: "o", t: { en: "Approved disbursement / closing reports", ar: "الصرف / تقارير الإقفال المعتمدة", zh: "已批准拨付 / 关账报告" } },
  ],
};

const MF_G05 = {
  back: "frepwork", cw: 1760, ch: 840,
  title: { en: "G-05 Financial Reports Directorate — Use-case storyline & agent I/O flow", ar: "مديرية التقارير المالية ج-05 — قصة الحالات وتدفّق الوكلاء", zh: "G-05 财务报告总局 — 用例故事线与代理输入/输出流程" },
  subtitle: { en: "Shared directorate flow (Reporting + Compliance + Cost + Accounting depts) · sources → costs / closure / compliance → reporting → human gate → financial reports & memos", ar: "تدفّق مشترك (التقارير + الامتثال + التكاليف + المحاسبة) · المصادر ← التكاليف/الإقفال/الامتثال ← التقارير ← البوابة ← التقارير والمذكرات", zh: "总局共享流程(报告+合规+成本+会计部)· 数据源 → 成本/关账/合规 → 报告 → 人工关卡 → 财务报告与备忘" },
  src: { x: 10, y: 80, w: 184, h: 320, list: ["SAP / Asas", "Etimad", "Esnad", { en: "Invoices", ar: "الفواتير", zh: "发票" }, { en: "Completion certs", ar: "شهادات الإنجاز", zh: "完工证明" }, { en: "Policies / standards", ar: "السياسات/المعايير", zh: "政策/准则" }, { en: "Bank statements", ar: "كشوف بنكية", zh: "银行对账单" }, "Excel / PDF"] },
  nodes: {
    uc01: { code: "UC-01", x: 260, y: 300, w: 220, h: 150, title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات وجودتها", zh: "财务数据统一与质量" }, ags: ["orch", "dataq", "insight"] },
    uc08: { code: "UC-08", x: 260, y: 540, w: 220, h: 130, title: { en: "Contracts, Claims & Disbursements", ar: "العقود والمطالبات والصرف", zh: "合同、索赔与拨付" }, ags: ["dataq", "anom", "repgen"] },
    uc12: { code: "UC-12", x: 575, y: 110, w: 230, h: 160, title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, ags: ["dataq", "repgen", "anom"] },
    uc09: { code: "UC-09", x: 575, y: 330, w: 230, h: 160, title: { en: "Closure, Reconciliation & Adjustments", ar: "الإقفال والمطابقة والتسويات", zh: "关账、对账与调整" }, ags: ["dataq", "anom", "comp"] },
    uc11: { code: "UC-11", x: 575, y: 570, w: 230, h: 160, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات", zh: "合规、政策与会计备忘" }, ags: ["comp", "repgen", "dataq"] },
    uc14: { code: "UC-14", x: 905, y: 120, w: 220, h: 150, title: { en: "Assets — Capitalization (cost basis)", ar: "الأصول — الرسملة (أساس التكلفة)", zh: "资产 — 资本化(成本基础)" }, ags: ["dataq", "market", "comp"] },
    uc10: { code: "UC-10", x: 920, y: 380, w: 236, h: 170, title: { en: "Reports & Dashboards (Periodic / Executive)", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘(周期/执行)" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 905, y: 610, w: 220, h: 140, title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق", zh: "智能查询、审计日志与权限" }, ags: ["dataq", "orch", "insight"] },
  },
  gate: { x: 1290, y: 390, w: 220, h: 180, sub: { en: "Validate & approve · reports · memos & entries · authorize export", ar: "تحقّق واعتمد · التقارير · المذكرات والقيود · التصدير", zh: "验证并批准 · 报告 · 备忘与分录 · 授权导出" } },
  del: { x: 1560, y: 400, w: 190, h: 160, sub: { en: "Approved financial reports, memos & dashboards", ar: "تقارير ومذكرات ولوحات معتمدة", zh: "已批准的财务报告、备忘与仪表盘" } },
  edges: [
    { from: "src", fa: "R", to: "uc01", ta: "L", c: "g", t: { en: "Ledgers, invoices, policies", ar: "الدفاتر والفواتير والسياسات", zh: "总账/发票/政策" } },
    { from: "uc01", fa: "R", to: "uc12", ta: "L", c: "b", t: { en: "Unified cost & order data", ar: "بيانات التكاليف والأوامر", zh: "统一成本与派工数据" } },
    { from: "uc01", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Consolidated, validated data", ar: "بيانات موحّدة ومعتمدة", zh: "统一校验数据" } },
    { from: "uc08", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Claims & disbursement outputs", ar: "مخرجات المطالبات والصرف", zh: "索赔与拨付输出" } },
    { from: "uc12", fa: "R", to: "uc14", ta: "L", c: "b", t: { en: "Assignment-order costs", ar: "تكاليف أوامر الإسناد", zh: "派工单成本" } },
    { from: "uc09", fa: "B", to: "uc11", ta: "T", c: "b", t: { en: "Differences & proposed adjustments", ar: "الفروق والتسويات المقترحة", zh: "差异与建议调整" } },
    { from: "uc12", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Costs, unit cost & fund balances", ar: "التكاليف وأرصدة الصناديق", zh: "成本/单元成本/资金余额" } },
    { from: "uc09", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Closing entries & balances", ar: "قيود الإقفال والأرصدة", zh: "关账分录与余额" } },
    { from: "uc11", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Compliance findings & memos", ar: "نتائج الامتثال والمذكرات", zh: "合规结论与备忘" } },
    { from: "uc14", fa: "B", to: "uc10", ta: "T", c: "b", t: { en: "Asset cost basis", ar: "أساس تكلفة الأصول", zh: "资产成本基础" } },
    { from: "uc10", fa: "R", to: "gate", ta: "L", c: "b", t: { en: "Draft reports & narrative", ar: "مسودات التقارير والسرد", zh: "报告草稿与叙述" } },
    { from: "uc03", fa: "R", to: "gate", ta: "L", c: "b", t: { en: "Audit trail & exports", ar: "سجل التدقيق والتصدير", zh: "审计轨迹与导出" } },
    { from: "gate", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Approved reports & memos", ar: "تقارير ومذكرات معتمدة", zh: "已批准报告与备忘" } },
  ],
};

const MF_G04_ENT = {
  back: "entwork", cw: 1220, ch: 600,
  title: { en: "Financial Entitlements Department — Multi-Agent Flow (G-04)", ar: "إدارة الاستحقاقات المالية — تدفّق متعدد الوكلاء (ج-04)", zh: "财务权益部 — 多智能体流程(G-04)" },
  subtitle: { en: "UC-08-centric · data inputs → entitlements processing → deviation & financial close → downstream reports & smart query", ar: "متمحور حول UC-08 · المدخلات ← معالجة الاستحقاقات ← الانحرافات والإقفال ← التقارير والاستعلام", zh: "以 UC-08 为核心 · 数据输入 → 权益处理 → 偏差检测与财务关账 → 下游报告与智能查询" },
  src: { x: 14, y: 92, w: 200, h: 384, list: [
    { en: "SAP", ar: "ساب", zh: "SAP" }, { en: "Etimad", ar: "اعتماد", zh: "Etimad" }, { en: "Esnad", ar: "إسناد", zh: "Esnad" },
    { en: "Contracts", ar: "العقود", zh: "合同" }, { en: "Invoices", ar: "الفواتير", zh: "发票" }, { en: "Claims", ar: "المطالبات", zh: "索赔" }, { en: "Payment Orders", ar: "أوامر الدفع", zh: "付款单" },
  ] },
  nodes: {
    uc08: { code: "UC-08", x: 450, y: 182, w: 300, h: 232, title: { en: "Contracts, Claims, Disbursements & Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" }, ags: ["anom", "orch", "comp"] },
    uc02: { code: "UC-02", x: 920, y: 96, w: 280, h: 184, title: { en: "Deviation Detection", ar: "كشف الانحرافات", zh: "偏差检测" }, ags: ["anom", "insight", "orch"] },
    uc09: { code: "UC-09", x: 920, y: 372, w: 280, h: 184, title: { en: "Financial Close & Reconciliation", ar: "الإقفال المالي والمطابقة", zh: "财务关账与对账" }, ags: ["repgen", "comp", "anom"] },
    uc10: { code: "UC-10", x: 1380, y: 96, w: 300, h: 184, title: { en: "Financial Reports — consolidated reporting & dashboards", ar: "التقارير المالية — تقارير ولوحات موحّدة", zh: "财务报告 — 综合报告与仪表盘" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 1380, y: 372, w: 300, h: 184, title: { en: "Smart Query — natural-language queries on financial data", ar: "الاستعلام الذكي — استعلامات بلغة طبيعية", zh: "智能查询 — 财务数据的自然语言查询" }, ags: ["dataq", "orch", "insight"] },
  },
  edges: [
    { from: "src", fa: "R", to: "uc08", ta: "L", c: "g", t: { en: "Contracts, claims, invoices, payment orders, beneficiary data", ar: "عقود ومطالبات وفواتير وأوامر دفع وبيانات المستفيدين", zh: "合同、索赔、发票、付款单、受益人数据" } },
    { from: "uc08", fa: "R", to: "uc02", ta: "L", c: "b", t: { en: "Validated claims & compliance flags", ar: "مطالبات متحققة وأعلام امتثال", zh: "已核验索赔与合规标记" } },
    { from: "uc08", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Disbursement reports & entitlement verification", ar: "تقارير الصرف والتحقق من الاستحقاق", zh: "拨付报告与权益核验" } },
    { from: "uc02", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Deviation outputs (downstream)", ar: "مخرجات الانحراف (لاحقة)", zh: "偏差输出(下游)" } },
    { from: "uc09", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Reconciled figures for query (downstream)", ar: "أرقام مسوّاة للاستعلام (لاحقة)", zh: "对账数据供查询(下游)" } },
  ],
};
const MF_G04_AUD = {
  back: "audwork", cw: 950, ch: 640,
  title: { en: "Audit Department — Multi-Agent Flow (G-04)", ar: "إدارة التدقيق — تدفّق متعدد الوكلاء (ج-04)", zh: "审计部 — 多智能体流程(G-04)" },
  subtitle: { en: "Oversight on financial close & deviation detection · data inputs → close & reconciliation → deviation alerting → downstream reports & audit log", ar: "رقابة على الإقفال وكشف الانحرافات · المدخلات ← الإقفال والمطابقة ← التنبيه ← التقارير وسجل التدقيق", zh: "对财务关账与偏差检测的监督 · 数据输入 → 关账与对账 → 偏差告警 → 下游报告与审计日志" },
  src: { x: 14, y: 96, w: 200, h: 384, list: [
    { en: "SAP", ar: "ساب", zh: "SAP" }, { en: "Etimad", ar: "اعتماد", zh: "Etimad" }, { en: "Contracts", ar: "العقود", zh: "合同" },
    { en: "Claims", ar: "المطالبات", zh: "索赔" }, { en: "Payment Orders", ar: "أوامر الدفع", zh: "付款单" }, { en: "Financial Data", ar: "بيانات مالية", zh: "财务数据" },
  ] },
  nodes: {
    uc09: { code: "UC-09", x: 460, y: 110, w: 300, h: 204, title: { en: "Financial Close, Reconciliation & Adjustments", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与调整" }, ags: ["repgen", "comp", "anom"] },
    uc02: { code: "UC-02", x: 460, y: 392, w: 300, h: 204, title: { en: "Detection of Deviations, Alerts & Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "偏差检测、告警与例外" }, ags: ["anom", "insight", "orch"] },
    uc10: { code: "UC-10", x: 1120, y: 110, w: 320, h: 204, title: { en: "Financial Reports — consolidated statements & disclosures", ar: "التقارير المالية — قوائم موحّدة وإفصاحات", zh: "财务报告 — 合并报表与披露" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 1120, y: 392, w: 320, h: 204, title: { en: "Smart Query & Audit Log — intelligent querying & full audit trail", ar: "الاستعلام الذكي وسجل التدقيق — استعلام ذكي وسجل تدقيق كامل", zh: "智能查询与审计日志 — 智能查询与完整审计轨迹" }, ags: ["dataq", "orch", "insight"] },
  },
  edges: [
    { from: "src", fa: "R", to: "uc09", ta: "L", c: "g", t: { en: "Financial transactions, contracts, claims, payment data", ar: "معاملات مالية وعقود ومطالبات وبيانات الدفع", zh: "财务交易、合同、索赔、付款数据" } },
    { from: "uc09", fa: "B", to: "uc02", ta: "T", c: "b", t: { en: "reconciliation results", ar: "نتائج المطابقة", zh: "对账结果" } },
    { from: "uc09", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Reconciliation reports & compliance verification", ar: "تقارير المطابقة والتحقق من الامتثال", zh: "对账报告与合规核验" } },
    { from: "uc02", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Deviation alerts, exception lists & corrective actions", ar: "تنبيهات الانحراف وقوائم الاستثناءات والإجراءات", zh: "偏差告警、例外清单与纠正措施" } },
    { from: "uc10", fa: "B", to: "uc03", ta: "T", c: "b", t: { en: "audit log", ar: "سجل التدقيق", zh: "审计日志" } },
  ],
};
const MF_G05_REP = {
  back: "frepwork", cw: 1400, ch: 560,
  title: { en: "Financial Reporting Department — Multi-Agent Flow (G-05)", ar: "إدارة التقارير المالية — تدفّق متعدد الوكلاء (ج-05)", zh: "财务报告部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-10-centric · upstream UC-09/UC-11/UC-12/UC-14 + unified data → reports & narrative → parallel deviation & smart query → executive/exception outputs", ar: "متمحور حول UC-10 · المدخلات العليا ← التقارير والسرد ← الانحراف والاستعلام المتوازي ← المخرجات", zh: "以 UC-10 为核心 · 上游 UC-09/11/12/14 + 统一数据 → 报告与叙述 → 并行偏差与智能查询 → 执行/例外输出" },
  src: { x: 14, y: 96, w: 204, h: 372, list: [
    { en: "Financial Close Results (UC-09)", ar: "نتائج الإقفال (UC-09)", zh: "财务关账结果(UC-09)" },
    { en: "Compliance Reports (UC-11)", ar: "تقارير الامتثال (UC-11)", zh: "合规报告(UC-11)" },
    { en: "Cost Reports (UC-12)", ar: "تقارير التكاليف (UC-12)", zh: "成本报告(UC-12)" },
    { en: "Asset Reports (UC-14)", ar: "تقارير الأصول (UC-14)", zh: "资产报告(UC-14)" },
    { en: "Unified Data (UC-01)", ar: "بيانات موحّدة (UC-01)", zh: "统一数据(UC-01)" },
  ] },
  nodes: {
    uc10: { code: "UC-10", x: 450, y: 158, w: 310, h: 280, title: { en: "Financial & Administrative Reports + Narrative Commentary", ar: "التقارير المالية والإدارية والتعليق السردي", zh: "财务与行政报告 + 叙述评述" }, ags: ["repgen", "narr", "dataq"] },
    uc02: { code: "UC-02", x: 900, y: 110, w: 280, h: 178, title: { en: "Deviation Alerts (parallel)", ar: "تنبيهات الانحراف (متوازٍ)", zh: "偏差告警(并行)" }, ags: ["anom", "insight", "orch"] },
    uc03: { code: "UC-03", x: 900, y: 360, w: 280, h: 178, title: { en: "Smart Query & Audit (parallel)", ar: "الاستعلام والتدقيق (متوازٍ)", zh: "智能查询与审计(并行)" }, ags: ["dataq", "orch", "insight"] },
  },
  del: { x: 1360, y: 96, w: 320, h: 396,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Periodic Financial Reports", ar: "تقارير مالية دورية", zh: "周期财务报告" }, d: { en: "scheduled & ad-hoc", ar: "مجدولة وعند الطلب", zh: "定期与即席" } },
      { t: { en: "Executive Reports", ar: "تقارير تنفيذية", zh: "执行报告" }, d: { en: "leadership summaries", ar: "ملخصات للقيادة", zh: "领导摘要" } },
      { t: { en: "Exception Reports", ar: "تقارير الاستثناءات", zh: "例外报告" }, d: { en: "deviation highlights", ar: "أبرز الانحرافات", zh: "偏差要点" } },
      { t: { en: "Narrative Commentary", ar: "تعليق سردي", zh: "叙述评述" }, d: { en: "AI-generated analysis", ar: "تحليل بالذكاء الاصطناعي", zh: "AI 生成分析" } },
      { t: { en: "Performance Summaries", ar: "ملخصات الأداء", zh: "绩效摘要" }, d: { en: "KPI & metric dashboards", ar: "لوحات المؤشرات", zh: "KPI 与指标仪表盘" } },
    ],
    foot: { en: "Downstream consumers · Senior Leadership · External Stakeholders · Audit Bodies.", ar: "المستهلكون اللاحقون · القيادة · الجهات الخارجية · جهات التدقيق.", zh: "下游消费方 · 高层领导 · 外部相关方 · 审计机构。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc10", ta: "L", c: "g", t: { en: "Report templates, approved upstream data, KPIs, deviations", ar: "قوالب وبيانات معتمدة ومؤشرات وانحرافات", zh: "报告模板、批准的上游数据、KPI、偏差" } },
    { from: "uc10", fa: "R", to: "uc02", ta: "L", c: "b", t: { en: "Deviation alerts", ar: "تنبيهات الانحراف", zh: "偏差告警" } },
    { from: "uc10", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Reports for query / audit", ar: "تقارير للاستعلام / التدقيق", zh: "报告 → 查询/审计" } },
    { from: "uc10", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Periodic & executive reports", ar: "تقارير دورية وتنفيذية", zh: "周期与执行报告" } },
  ],
};

const MF_G05_COMP = {
  back: "compwork", cw: 1010, ch: 600,
  title: { en: "Compliance Department — Multi-Agent Flow (G-05)", ar: "إدارة الامتثال — تدفّق متعدد الوكلاء (ج-05)", zh: "合规部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-11-centric · standards & policy inputs → compliance, policies & memos → compliance outputs · upstream UC-09, downstream UC-10, parallel UC-12/UC-14 · all outputs require specialist review before finalization", ar: "متمحور حول UC-11 · المدخلات المعيارية ← الامتثال والسياسات والمذكرات ← المخرجات · كل المخرجات تتطلب مراجعة المختص قبل الاعتماد", zh: "以 UC-11 为核心 · 准则与政策输入 → 合规/政策/备忘 → 合规输出 · 上游 UC-09、下游 UC-10、并行 UC-12/UC-14 · 所有输出定稿前均需专家复核" },
  src: { x: 14, y: 80, w: 204, h: 488, list: [
    { en: "IPSAS Standards", ar: "معايير IPSAS", zh: "IPSAS 准则" }, { en: "Comprehensive Guide", ar: "الدليل الشامل", zh: "综合指南" },
    { en: "Policies & Procedures", ar: "السياسات والإجراءات", zh: "政策与程序" }, { en: "Royal Orders", ar: "الأوامر الملكية", zh: "皇室令" },
    { en: "MoF Instructions", ar: "تعليمات المالية", zh: "财政部指示" }, { en: "Chart of Accounts", ar: "دليل الحسابات", zh: "会计科目表" },
    { en: "Previous Memos", ar: "المذكرات السابقة", zh: "历史备忘" },
    { en: "Accounting Cases", ar: "حالات محاسبية", zh: "会计案例" }, { en: "Audit Observations", ar: "ملاحظات التدقيق", zh: "审计观察" },
    { en: "New Policies & Standards", ar: "سياسات ومعايير جديدة", zh: "新政策与准则" },
  ] },
  nodes: {
    uc11: { code: "UC-11", x: 460, y: 170, w: 320, h: 320, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘" }, ags: ["comp", "repgen", "dataq"] },
  },
  del: { x: 1040, y: 120, w: 320, h: 432,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Compliance Reports", ar: "تقارير الامتثال", zh: "合规报告" }, d: { en: "compliance assessment", ar: "تقييم الامتثال", zh: "合规评估" } },
      { t: { en: "Accounting Memos", ar: "مذكرات محاسبية", zh: "会计备忘" }, d: { en: "position memos", ar: "مذكرات موقف", zh: "立场备忘" } },
      { t: { en: "Proposed Journal Entries", ar: "قيود مقترحة", zh: "建议分录" }, d: { en: "draft entries for review", ar: "قيود مسودة للمراجعة", zh: "待复核草稿分录" } },
      { t: { en: "Policy Gap Analysis", ar: "تحليل فجوات السياسات", zh: "政策差距分析" }, d: { en: "current vs required", ar: "الحالي مقابل المطلوب", zh: "现状 vs 要求" } },
      { t: { en: "Audit Response Drafts", ar: "مسودات الرد على التدقيق", zh: "审计回应草稿" }, d: { en: "responses to observations", ar: "ردود على الملاحظات", zh: "对观察项的回应" } },
    ],
    foot: { en: "All outputs require specialist review before finalization.", ar: "كل المخرجات تتطلب مراجعة المختص قبل الاعتماد.", zh: "所有输出定稿前均需专家复核。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc11", ta: "L", c: "g", t: { en: "Standards, policies, prior memos, accounting cases, audit observations", ar: "المعايير والسياسات والمذكرات السابقة والحالات وملاحظات التدقيق", zh: "准则、政策、历史备忘、会计案例、审计观察" } },
    { from: "uc11", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Compliance reports, memos & outputs", ar: "تقارير الامتثال والمذكرات والمخرجات", zh: "合规报告、备忘与输出" } },
  ],
};

const MF_G05_COST = {
  back: "costwork", cw: 1280, ch: 560,
  title: { en: "Cost Management Department — Multi-Agent Flow (G-05)", ar: "إدارة التكاليف — تدفّق متعدد الوكلاء (ج-05)", zh: "成本管理部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-12-centric · cost & fund data → costs, assignment orders & funds → reports, surpluses & alerts · upstream UC-11, parallel UC-14, downstream UC-10", ar: "متمحور حول UC-12 · بيانات التكاليف والصناديق ← التكاليف وأوامر الإسناد والصناديق ← التقارير والفوائض والتنبيهات", zh: "以 UC-12 为核心 · 成本与资金数据 → 成本/派工单/资金 → 报告、结余与告警 · 上游 UC-11、并行 UC-14、下游 UC-10" },
  src: { x: 14, y: 90, w: 204, h: 424, list: [
    { en: "SAP", ar: "ساب", zh: "SAP" }, { en: "Etimad", ar: "اعتماد", zh: "Etimad" }, { en: "Esnad", ar: "إسناد", zh: "Esnad" },
    { en: "Invoices", ar: "الفواتير", zh: "发票" }, { en: "Completion Certificates", ar: "شهادات الإنجاز", zh: "完工证明" }, { en: "Liquidity Requests", ar: "طلبات السيولة", zh: "流动性申请" },
    { en: "Payment Orders", ar: "أوامر الدفع", zh: "付款单" }, { en: "Bank Statements", ar: "كشوف بنكية", zh: "银行对账单" }, { en: "Dev. Fund Data", ar: "بيانات صناديق التطوير", zh: "开发基金数据" },
  ] },
  nodes: {
    uc12: { code: "UC-12", x: 460, y: 150, w: 320, h: 300, title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, ags: ["dataq", "repgen", "anom"] },
  },
  del: { x: 1040, y: 96, w: 320, h: 424,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Assignment Order Reports", ar: "تقارير أوامر الإسناد", zh: "派工单报告" }, d: { en: "per order", ar: "لكل أمر", zh: "按单" } },
      { t: { en: "Cost per Unit / Land", ar: "تكلفة الوحدة / الأرض", zh: "单元/地块成本" }, d: { en: "unit costing", ar: "احتساب الوحدة", zh: "单元成本核算" } },
      { t: { en: "Financial Consideration", ar: "المقابل المالي", zh: "财务对价" }, d: { en: "compensation values", ar: "قيم التعويض", zh: "补偿金额" } },
      { t: { en: "Surpluses & Fund Reports", ar: "الفوائض وتقارير الصناديق", zh: "结余与基金报告" }, d: { en: "fund balances", ar: "أرصدة الصناديق", zh: "基金余额" } },
      { t: { en: "Matching Results & Alerts", ar: "نتائج المطابقة والتنبيهات", zh: "匹配结果与告警" }, d: { en: "reconciliation & anomalies", ar: "مطابقة وشذوذ", zh: "对账与异常" } },
    ],
    foot: { en: "Surplus tracking rule — surplus must be tracked from original order to beneficiary project.", ar: "قاعدة تتبّع الفائض — يجب تتبّع الفائض من الأمر الأصلي إلى المشروع المستفيد.", zh: "结余追踪规则 —— 结余须从原始派工单追踪至受益项目。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc12", ta: "L", c: "g", t: { en: "Assignment orders, invoices, liquidity reqs, completion certs, fund agreements", ar: "أوامر الإسناد والفواتير وطلبات السيولة والشهادات واتفاقيات الصناديق", zh: "派工单、发票、流动性申请、完工证明、基金协议" } },
    { from: "uc12", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Assignment-order reports, unit cost, surpluses, fund reports", ar: "تقارير الأوامر وتكلفة الوحدة والفوائض وتقارير الصناديق", zh: "派工单报告、单元成本、结余、基金报告" } },
  ],
};

const MF_G05_ACCT = {
  back: "acctwork", cw: 1280, ch: 540,
  title: { en: "Accounting Department — Multi-Agent Flow (G-05)", ar: "إدارة المحاسبة — تدفّق متعدد الوكلاء (ج-05)", zh: "会计部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-09-centric · financial transactions & balances → financial close, reconciliation & adjustments → close outputs · upstream UC-01/UC-08, downstream UC-11/UC-10 · cycle: trial balance → reconciliation → adjustments → close → reports", ar: "متمحور حول UC-09 · المعاملات والأرصدة ← الإقفال والمطابقة والتسويات ← المخرجات", zh: "以 UC-09 为核心 · 财务交易与余额 → 财务关账/对账/调整 → 关账输出 · 上游 UC-01/UC-08、下游 UC-11/UC-10 · 周期:试算 → 对账 → 调整 → 关账 → 报告" },
  src: { x: 14, y: 90, w: 204, h: 400, list: [
    { en: "SAP", ar: "ساب", zh: "SAP" }, { en: "GRP", ar: "GRP", zh: "GRP" }, { en: "Hyperion", ar: "هايبريون", zh: "Hyperion" },
    { en: "Chart of Accounts", ar: "دليل الحسابات", zh: "会计科目表" }, { en: "Journal Entries", ar: "قيود اليومية", zh: "日记账分录" }, { en: "Trial Balances", ar: "موازين المراجعة", zh: "试算平衡表" },
    { en: "Bank Statements", ar: "كشوف بنكية", zh: "银行对账单" }, { en: "Contracts", ar: "العقود", zh: "合同" },
  ] },
  nodes: {
    uc09: { code: "UC-09", x: 460, y: 150, w: 320, h: 290, title: { en: "Financial Close, Reconciliation & Adjustments", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与调整" }, ags: ["repgen", "comp", "anom"] },
  },
  del: { x: 1040, y: 96, w: 320, h: 406,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Reconciliation Reports", ar: "تقارير المطابقة", zh: "对账报告" }, d: { en: "reconciled balances", ar: "أرصدة مطابقة", zh: "对账后余额" } },
      { t: { en: "Adjustment Entries", ar: "قيود التسوية", zh: "调整分录" }, d: { en: "corrective entries", ar: "قيود تصحيحية", zh: "更正分录" } },
      { t: { en: "Trial Balance", ar: "ميزان المراجعة", zh: "试算平衡表" }, d: { en: "balanced ledger", ar: "دفتر متوازن", zh: "平衡账簿" } },
      { t: { en: "Financial Close Reports", ar: "تقارير الإقفال", zh: "关账报告" }, d: { en: "period close", ar: "إقفال الفترة", zh: "期末关账" } },
      { t: { en: "Compliance Verification", ar: "التحقق من الامتثال", zh: "合规核验" }, d: { en: "standards check", ar: "فحص المعايير", zh: "准则检查" } },
    ],
    foot: { en: "Upstream UC-01 / UC-08 · downstream UC-11 / UC-10.", ar: "أعلى UC-01 / UC-08 · أسفل UC-11 / UC-10.", zh: "上游 UC-01 / UC-08 · 下游 UC-11 / UC-10。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc09", ta: "L", c: "g", t: { en: "Financial transactions, trial balances, bank statements, contracts, policies", ar: "المعاملات وموازين المراجعة والكشوف والعقود والسياسات", zh: "财务交易、试算平衡、银行对账单、合同、政策" } },
    { from: "uc09", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Reconciliation reports, adjustments, trial balance, close reports", ar: "تقارير المطابقة والتسويات وميزان المراجعة وتقارير الإقفال", zh: "对账报告、调整、试算平衡、关账报告" } },
  ],
};

const MF_G02_FPA = {
  back: "fpawork",
  title: { en: "Financial Performance Analysis — Multi-Agent Flow (G-02)", ar: "تحليل الأداء المالي — تدفّق متعدد الوكلاء (ج-02)", zh: "财务绩效分析 — 多智能体流程(G-02)" },
  subtitle: { en: "Analysis & forecasting layer · data inputs → forecasting → scenarios → performance → outputs · downstream storyline continuation", ar: "طبقة التحليل والتنبؤ · المدخلات ← التنبؤ ← السيناريوهات ← الأداء ← المخرجات", zh: "分析与预测层 · 数据输入 → 预测 → 情景 → 绩效 → 输出 · 下游故事线延续" },
  src: { x: 14, y: 100, w: 206, h: 320, list: [
    { en: "Unified Data (UC-01) — structured financial data", ar: "بيانات موحّدة (UC-01)", zh: "统一数据(UC-01)— 结构化财务数据" },
    { en: "Budget Planning (UC-07) — ceilings & envelopes", ar: "تخطيط الميزانية (UC-07)", zh: "预算规划(UC-07)— 上限与额度" },
    { en: "Cost Drivers (UC-15) — external cost signals", ar: "محرّكات التكلفة (UC-15)", zh: "成本驱动(UC-15)— 外部成本信号" },
  ] },
  nodes: {
    uc04: { code: "UC-04", x: 340, y: 120, w: 286, h: 282, title: { en: "Financial Forecasting — Future Commitments", ar: "التنبؤ المالي — الالتزامات المستقبلية", zh: "财务预测 — 未来承诺" }, ags: ["fcast", "roll", "market"] },
    uc05: { code: "UC-05", x: 780, y: 120, w: 286, h: 282, title: { en: "Scenario Simulation — Alternatives", ar: "محاكاة السيناريوهات — البدائل", zh: "情景模拟 — 备选方案" }, ags: ["scen", "budopt", "insight"] },
    uc06: { code: "UC-06", x: 1220, y: 120, w: 286, h: 282, title: { en: "Performance Analysis & Executive Reports", ar: "تحليل الأداء والتقارير التنفيذية", zh: "绩效分析与执行报告" }, ags: ["repgen", "narr", "dataq"] },
    ds1: { code: "UC-02 / UC-03", x: 340, y: 488, w: 286, h: 132, title: { en: "Storyline Continuation", ar: "استمرار القصة", zh: "故事线延续" }, desc: { en: "Deviations & corrections", ar: "الانحرافات والتصحيحات", zh: "偏差与纠正" }, ags: [] },
    ds2: { code: "UC-10", x: 780, y: 488, w: 286, h: 132, title: { en: "Financial Reports", ar: "التقارير المالية", zh: "财务报告" }, desc: { en: "Dashboards & executive summaries", ar: "لوحات وملخصات تنفيذية", zh: "仪表盘与执行摘要" }, ags: [] },
    ds3: { code: "UC-02", x: 1220, y: 488, w: 286, h: 132, title: { en: "Deviations & Alerts", ar: "الانحرافات والتنبيهات", zh: "偏差与告警" }, desc: { en: "Exception notifications", ar: "إشعارات الاستثناءات", zh: "异常通知" }, ags: [] },
  },
  del: { x: 1660, y: 108, w: 290, h: 312,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Forecasted Commitments", ar: "التزامات متوقعة", zh: "预测承诺" }, d: { en: "Future needs & obligations", ar: "الاحتياجات والالتزامات", zh: "未来需求与义务" } },
      { t: { en: "Scenario Comparisons", ar: "مقارنات السيناريوهات", zh: "情景对比" }, d: { en: "Impact & trade-off analysis", ar: "تحليل الأثر والمفاضلات", zh: "影响与权衡分析" } },
      { t: { en: "Performance Dashboards", ar: "لوحات الأداء", zh: "绩效仪表盘" }, d: { en: "Executive reports & KPIs", ar: "تقارير تنفيذية ومؤشرات", zh: "执行报告与 KPI" } },
    ],
    foot: { en: "Executive & periodic deliverables for the directorate.", ar: "مخرجات تنفيذية ودورية للمديرية.", zh: "面向总局的执行与周期交付物。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc04", ta: "L", c: "g", t: { en: "Unified data, ceilings, cost drivers", ar: "بيانات موحّدة وسقوف ومحرّكات", zh: "统一数据、上限、成本驱动" } },
    { from: "uc04", fa: "R", to: "uc05", ta: "L", c: "b", t: { en: "Forecasts", ar: "التنبؤات", zh: "预测" } },
    { from: "uc05", fa: "R", to: "uc06", ta: "L", c: "b", t: { en: "Scenarios", ar: "السيناريوهات", zh: "情景" } },
    { from: "uc06", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Performance reports & outputs", ar: "تقارير الأداء والمخرجات", zh: "绩效报告与输出" } },
    { from: "uc04", fa: "B", to: "ds1", ta: "T", c: "b", t: { en: "Deviations & corrections", ar: "الانحرافات والتصحيحات", zh: "偏差与纠正" } },
    { from: "uc05", fa: "B", to: "ds2", ta: "T", c: "b", t: { en: "Dashboards & summaries", ar: "لوحات وملخصات", zh: "仪表盘与摘要" } },
    { from: "uc06", fa: "B", to: "ds3", ta: "T", c: "b", t: { en: "Exception notifications", ar: "إشعارات الاستثناءات", zh: "异常通知" } },
  ],
};

function FlowG02() { return <DirectorateFlow flow={MF_G02} />; }
function FlowG02Fpa() { return <DirectorateFlow flow={MF_G02_FPA} />; }

function FlowG03() { return <DirectorateFlow flow={MF_G03} />; }
function FlowG04() { return <DirectorateFlow flow={MF_G04} />; }
function FlowG04Ent() { return <DirectorateFlow flow={MF_G04_ENT} />; }
function FlowG04Aud() { return <DirectorateFlow flow={MF_G04_AUD} />; }
function FlowG05() { return <DirectorateFlow flow={MF_G05} />; }
function FlowG05Rep() { return <DirectorateFlow flow={MF_G05_REP} />; }
function FlowG05Comp() { return <DirectorateFlow flow={MF_G05_COMP} />; }
function FlowG05Cost() { return <DirectorateFlow flow={MF_G05_COST} />; }
function FlowG05Acct() { return <DirectorateFlow flow={MF_G05_ACCT} />; }

function configuredDistribution(route, chartKey, seriesKey, rows) {
  const configured = rows.map((row) => {
    const itemKey = keyify(row.am?.en || row.am?.zh || row.v);
    const fallback = Number.parseFloat(String(row.v).replace(/[^0-9.-]/g, "")) || 0;
    const value = getChartNumber(route, chartKey, itemKey, seriesKey, fallback);
    return { ...row, value, v: getChartDisplay(route, chartKey, itemKey, seriesKey, row.v) };
  });
  const max = Math.max(...configured.map((row) => row.value), 1);
  return configured.map((row) => ({ ...row, pct: Math.max(4, row.value / max * 100) }));
}

function RcWorkbench() {
  const { t, tr, setRoute, pushLog, setPerfJump, setBackRoute, setDeptSub, setAlertsOpen } = useStore();
  const [ask, setAsk] = useState("");
  const [feed, setFeed] = useState(WB.logs);
  const logRef = useRef(null);
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const qaRef = useRef(null);
  const [fsel, setFsel] = useState([2, 0, 0, 0]);
  const DEFAULT_SUMMARY = { en: "FY 2025 Q2 · collection rate held at **87%** (+2.1pp QoQ), but a ~~SAR 120M collection gap~~ persists — **65%** of it sits in just **3 Amanat** (Riyadh-East 32M · Jeddah-Port 26M · Dammam-Ind. 20M). Lease contracts drive **~50% of overdue**, and ~~18 contracts now exceed 90 days~~ — **SAR 34M at write-off risk** without dunning this quarter.", ar: "الربع الثاني 2025 · معدل التحصيل **87%** (+2.1)، لكن تبقى ~~فجوة تحصيل 120 مليون~~ — **65%** في **3 أمانات** (الرياض-شرق 32 · جدة 26 · الدمام 20). عقود الإيجار **~50% من التأخر**، و~~18 عقداً تجاوزت 90 يوماً~~ — **34 مليون معرّضة للشطب** دون تحصيل هذا الربع.", zh: "FY2025 Q2 · 征收率维持 **87%**(环比 +2.1pp),但仍有 ~~SAR 120M 征收缺口~~——其中 **65%** 集中在 **3 个阿玛纳**(利雅得-东 32M · 吉达-港 26M · 达曼-工业 20M)。租约合同造成 **约 50% 的逾期**,且 ~~18 个合同已逾期超 90 天~~——若本季不催收,**SAR 34M 面临核销风险**。" };
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [qaOpen, setQaOpen] = useState(false);
  const WB_CHAIN = [
    { code: "UC-01", pos: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, name: { en: "Financial Data Consolidation & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" } },
    { code: "UC-13", here: true, pos: { en: "THIS", ar: "هذه", zh: "本环节" }, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, name: { en: "Performance Reports / Anomaly Detection", ar: "تقارير الأداء / كشف الانحرافات", zh: "绩效报告 / 异常检测" } },
    { code: "UC-14", pos: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, name: { en: "Assets, Classification & Capitalization", ar: "الأصول والتصنيف والرسملة", zh: "资产、分类与资本化" } },
    { code: "UC-12 / UC-11", pos: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, name: { en: "Costs & Funds / Compliance & Memos", ar: "التكاليف والصناديق / الامتثال والمذكرات", zh: "成本与资金 / 合规与备忘" } },
    { code: "UC-10 / UC-03", pos: { en: "CONVERGE ★", ar: "تقارب ★", zh: "汇聚 ★" }, name: { en: "Reporting & Dashboards / Smart Query & Audit", ar: "التقارير / الاستعلام والتدقيق", zh: "报告与仪表盘 / 智能查询与审计" } },
  ];
  const WB_SOURCES = [
    { n: "Tahseel", s: "synced" }, { n: "Makeen", s: "synced" }, { n: "Efaa", s: "loading" }, { n: "Sanad", s: "synced" }, { n: "Etimad", s: "synced" },
    { n: "Revenue Sources", s: "synced" }, { n: "Invoices", s: "synced" }, { n: "Objections", s: "synced" }, { n: "Executions", s: "synced" }, { n: "White Land Files", s: "synced" },
  ];
  const WB_OUTPUTS = [
    { l: { en: "Net Billed Amount", ar: "صافي المفوتر", zh: "净开票额" }, v: "SAR 920M", s: { en: "Gross billed − exclusions", ar: "إجمالي المفوتر − الاستبعادات", zh: "总开票 − 排除项" }, tag: { en: "+2.1% QoQ", ar: "+2.1%", zh: "环比 +2.1%" }, rows: [
      { k: { en: "Gross billed", ar: "إجمالي المفوتر", zh: "总开票" }, v: "SAR 1.06B", pct: 100 },
      { k: { en: "− Judgment excl.", ar: "− استبعاد حكم", zh: "− 判决排除" }, v: "SAR 78M", pct: 7 },
      { k: { en: "− Objection holds", ar: "− تعليق اعتراض", zh: "− 异议挂起" }, v: "SAR 42M", pct: 4 },
      { k: { en: "− Written-off", ar: "− مشطوب", zh: "− 核销" }, v: "SAR 20M", pct: 2 },
    ] },
    { l: { en: "Exclusion Reports", ar: "تقارير الاستبعاد", zh: "排除项报告" }, v: "3 cat. · SAR 140M", s: { en: "Judgment · objection · written-off", ar: "حكم · اعتراض · شطب", zh: "判决 · 异议 · 核销" }, rows: [
      { k: { en: "Judgment (12 cases)", ar: "حكم (12)", zh: "判决(12 件)" }, v: "SAR 78M" },
      { k: { en: "Objection (9 cases)", ar: "اعتراض (9)", zh: "异议(9 件)" }, v: "SAR 42M" },
      { k: { en: "Written-off (21 cases)", ar: "مشطوب (21)", zh: "核销(21 件)" }, v: "SAR 20M" },
    ] },
    { l: { en: "Revenue Opportunity Alerts", ar: "تنبيهات فرص الإيراد", zh: "收入机会告警" }, v: "5 · SAR 23M", s: { en: "Under-billed / missed coverage", ar: "نقص فوترة / تغطية مفقودة", zh: "少开票 / 漏覆盖" }, rows: [
      { k: { en: "Under-billed leases (3)", ar: "إيجارات ناقصة (3)", zh: "少开票租约(3)" }, v: "SAR 12M" },
      { k: { en: "Missed fee coverage (2)", ar: "تغطية رسوم مفقودة (2)", zh: "漏收费覆盖(2)" }, v: "SAR 7M" },
      { k: { en: "Indexation gap (1)", ar: "فجوة الفهرسة (1)", zh: "指数化缺口(1)" }, v: "SAR 4M" },
    ] },
  ];
  const cyc = (i) => setFsel(s => s.map((v, j) => j === i ? (v + 1) % WB.filters[i].opts.length : v));
  const applyFilters = () => {
    const period = WB.filters[0].opts[fsel[0]], amanah = WB.filters[1].opts[fsel[1]];
    setSummary({ en: `For ${period}, ${amanah}: collection 87%, SAR 120M collection gap across high-risk Amanat; leases drive ~50% of overdue.`, ar: `لـ ${period}، ${amanah}: التحصيل 87%، فجوة 120 مليون ريال في الأمانات عالية الخطورة؛ الإيجارات ~50% من التأخر.`, zh: `${period} · ${amanah}:征收率 87%,SAR 120M 征收缺口集中于高风险阿玛纳;租约造成约 50% 逾期。` });
    pushLog({ en: "Filters applied — " + period + " · " + amanah, ar: "تم تطبيق عوامل التصفية — " + period, zh: "已应用筛选 — " + period + " · " + amanah });
  };
  const SCOPE_K = [{ en: "Period", ar: "الفترة", zh: "期间" }, { en: "Amanah", ar: "الأمانة", zh: "阿玛纳" }, { en: "Revenue", ar: "الإيراد", zh: "收入" }, { en: "Tags", ar: "وسوم", zh: "标签" }];
  const cycleScope = (i) => {
    const ns = fsel.map((v, j) => j === i ? (v + 1) % WB.filters[i].opts.length : v); setFsel(ns);
    const period = WB.filters[0].opts[ns[0]], amanah = WB.filters[1].opts[ns[1]];
    setSummary({ en: `For ${period}, ${amanah}: collection 87%, SAR 120M collection gap across high-risk Amanat; leases drive ~50% of overdue.`, ar: `لـ ${period}، ${amanah}: التحصيل 87%، فجوة 120 مليون ريال؛ الإيجارات ~50% من التأخر.`, zh: `${period} · ${amanah}:征收率 87%,SAR 120M 征收缺口集中于高风险阿玛纳;租约造成约 50% 逾期。` });
    pushLog({ en: "Scope changed — " + period + " · " + amanah, ar: "تغيّر النطاق — " + period, zh: "作用域已更改 — " + period + " · " + amanah });
  };
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n++; const base = WB.logs[n % WB.logs.length];
      const tm = "10:" + String((6 + n) % 60).padStart(2, "0");
      setFeed(f => [...f.slice(-7), { ...base, tm }]);
    }, 2300);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [feed]);
  const askQ = (idx, raw, ansObj) => {
    const q = idx >= 0 ? tr(WB.qs[idx]) : (raw || "").trim();
    if (!q || thinking) return;
    const a = ansObj ? tr(ansObj) : (idx >= 0 ? tr(WB.answers[idx]) : tr(WB.genAns));
    pushLog({ en: "Q&A → Revenue agent: " + q, ar: "سؤال → وكيل الإيرادات: " + q, zh: "提问 → 收入智能体:" + q });
    setShowSugs(false);
    setQa(p => [...p, { role: "u", text: q }]); setAsk(""); setThinking(true);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: a }]); setThinking(false); }, 850);
  };
  useEffect(() => { const el = qaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);
  const badge = (s) => s === "running" ? <span className="wb-badge run">{tr({ en: "running", ar: "يعمل", zh: "运行中" })}</span>
    : s === "focus" ? <span className="wb-badge foc">{tr({ en: "in focus", ar: "قيد التركيز", zh: "聚焦中" })}</span>
    : <span className="wb-badge act">{tr({ en: "active", ar: "نشط", zh: "活动" })}</span>;
  const risk = (r) => <span className={"wb-risk " + r}>{tr(r === "high" ? { en: "high", ar: "مرتفع", zh: "高" } : r === "med" ? { en: "med", ar: "متوسط", zh: "中" } : { en: "low", ar: "منخفض", zh: "低" })}</span>;
  const fAsk = (row) => askQ(-1, row.id + " · " + tr(row.am) + " — " + row.od, {
    en: row.id + " (" + tr(row.am) + ") is " + row.od + " overdue at " + row.risk + " risk. Main driver: lease arrears aged beyond 60 days under the Wusool template. Recommended: targeted dunning and an escalation-clause review with legal.",
    ar: row.id + " (" + tr(row.am) + ") متأخر بمقدار " + row.od + ". السبب الرئيسي: متأخرات إيجار تجاوزت 60 يوماً ضمن قالب وصول. الموصى به: تحصيل موجّه ومراجعة بنود التصعيد مع القانونية.",
    zh: row.id + "(" + tr(row.am) + ")逾期 " + row.od + ",风险 " + row.risk + "。主因:Wusool 模板下租约欠款逾期超过 60 天。建议:定向催收并与法务复核升级条款。",
  });
  return (<div className="fade wb">
    <div className="card pad wb-frame">
    {/* HEADER */}
    <div className="card pad wb-head">
      <div><div className="wb-title"><button className="pg-back" onClick={() => setRoute("rcwork")}>‹</button><span className="wb-dot blue" /> {tr({ en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" })} · {tr({ en: "Analysis Workbench", ar: "منصة التحليل", zh: "分析工作台" })}<button className="al-bell" onClick={() => setAlertsOpen(true)} title={ucl("UC-02", tr({ en: "Alerts & Exceptions Center", ar: "مركز التنبيهات", zh: "告警与异常中心" }))}>🔔 <span>3</span></button></div>
        <div className="wb-subt">{ucl("UC-13", tr({ en: "Revenue Collection & Billing Gap", ar: "التحصيل وفجوة الفوترة", zh: "收入征收与开票缺口" }))}</div></div>
      <div className="wb-chain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{WB_CHAIN.map((c, i) => (<React.Fragment key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></React.Fragment>))}</div>
    </div>
    {/* INSIGHT & NEXT ACTIONS */}
    <div className="wb-actbar">
      <div className="wb-ab-top">
        <div className="wb-ab-spark">✦</div>
        <div className="wb-ab-tt">
          <div><span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span><span className="wb-ab-meta">{SHOW_UC ? "UC-13 · " : ""}run #2041 · {tr({ en: "Revenue agent", ar: "وكيل الإيرادات", zh: "收入智能体" })} · {tr({ en: "scope", ar: "النطاق", zh: "作用域" })}: {WB.filters[0].opts[fsel[0]]} · {WB.filters[1].opts[fsel[1]]}</span></div>
          <div className="wb-ab-insight"><Hi t={tr(summary)} /></div>
        </div>
      </div>
      <div className="wb-ab-rows">
        <div className="wb-ab-col">
          <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
          <div className="wb-sugs">{WB.next.map((n, i) => (<button className="wb-sug" key={i} onClick={() => { pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) }); setQaOpen(true); }}><span className="pr">{i + 1}</span><span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span></button>))}</div>
        </div>
        <div className="wb-ab-col r">
          <div className="wb-ab-h">➜ {tr({ en: "HAND OFF DOWNSTREAM · actions", ar: "تسليم لاحق · إجراءات", zh: "下游交接 · 动作" })}</div>
          <div className="wb-ctas">
            <button className="wb-cta p" onClick={() => { setPerfJump({ tab: "dash", generate: true }); setBackRoute("rcbench"); setRoute("rcreports"); }}>{SHOW_UC && <span className="uc">UC-06</span>}{tr({ en: "Generate Executive Summary", ar: "إنشاء الملخص التنفيذي", zh: "生成执行摘要" })}<span className="ar">→</span></button>
            <button className="wb-cta s" onClick={() => setAlertsOpen(true)}>{SHOW_UC && <span className="uc">UC-02</span>}{tr({ en: "Create Alert / Case", ar: "إنشاء تنبيه / حالة", zh: "创建告警 / 案例" })}<span className="ar">→</span></button>
          </div>
        </div>
      </div>
    </div>
    {/* RESULTS + scope chips */}
    <div className="wb-sech shead">
      <div><h2>{tr({ en: "Collection & Billing Gap Results", ar: "نتائج التحصيل وفجوة الفوترة", zh: "征收与开票缺口结果" })}</h2><div className="muted">{ucl("UC-13", tr({ en: "UC-13 outputs · produced by agents", ar: "مخرجات UC-13 · أُنتجت بواسطة الوكلاء", zh: "UC-13 输出 · 由智能体生成" }))}</div></div>
      <div className="wb-scope"><span className="wb-sl">{tr({ en: "SCOPE", ar: "النطاق", zh: "作用域" })}</span>
        {WB.filters.map((f, i) => (<button className="wb-schip" key={i} onClick={() => cycleScope(i)} title={tr(f.lab)}><span className="k">{tr(SCOPE_K[i])}</span><span className="v">{f.opts[fsel[i]]}</span><span className="cv">▾</span></button>))}
        <span className="wb-auto">● {tr({ en: "auto-applied", ar: "تطبيق تلقائي", zh: "自动应用" })}</span>
      </div>
    </div>
    <div className="wb-ogrid">{WB_OUTPUTS.map((o, i) => (<div className="wb-ocard" key={i}><div className="oc-h">{tr(o.l)}{o.tag && <span className="oc-tag">{tr(o.tag)}</span>}</div><div className="oc-b"><div className="oc-v"><Money v={o.v} /></div><div className="oc-s">{tr(o.s)}</div></div>{o.rows && <div className="oc-rows">{o.rows.map((r, j) => (<div className="oc-row" key={j}><span className="k">{tr(r.k)}</span>{typeof r.pct === "number" && <span className="ocbar"><i style={{ width: r.pct + "%" }} /></span>}<span className="ov">{r.v}</span></div>))}</div>}</div>))}</div>
    <div className="wb-cols3">
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Collection Overview", ar: "نظرة عامة على التحصيل", zh: "征收概览" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl">{tr({ en: "OVERALL COLLECTION RATE", ar: "معدل التحصيل الإجمالي", zh: "整体征收率" })}</div>
          <div className="wb-krow"><span className="wb-big">87%</span><span className="chip">+2.1% QoQ</span></div>
          <div className="wb-bars">
            <div className="wb-bar"><div className="bl">{tr({ en: "Planned", ar: "مخطط", zh: "计划" })}</div><div className="bt"><span className="bf plan" style={{ width: "100%" }} /></div><div className="bv"><Money v="SAR 920M" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Collected", ar: "محصّل", zh: "已收" })}</div><div className="bt"><span className="bf coll" style={{ width: "87%" }} /></div><div className="bv"><Money v="SAR 800M" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Outstanding", ar: "مستحق", zh: "未收" })}</div><div className="bt"><span className="bf out" style={{ width: "13%" }} /></div><div className="bv"><Money v="SAR 120M" /></div></div>
          </div>
          <div className="wb-kk"><span>{tr({ en: "Overdue share (>60d)", ar: "نسبة التأخر (>60 يوماً)", zh: "逾期占比 (>60天)" })}</span><b className="red">50%</b></div>
          <div className="wb-kk"><span>{tr({ en: "Avg DSO", ar: "متوسط أيام التحصيل", zh: "平均回款天数" })}</span><b>74 {tr({ en: "days", ar: "يوم", zh: "天" })}</b></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Billing Gap · Focus List", ar: "فجوة الفوترة · قائمة التركيز", zh: "开票缺口 · 重点清单" })}</b><span className="wb-pm">{tr({ en: "top 5 overdue", ar: "أعلى 5 متأخرة", zh: "前 5 逾期" })}</span></div>
        <div className="wb-pb">
          <div className="wb-kl">{tr({ en: "TOTAL COLLECTION GAPS", ar: "إجمالي فجوات التحصيل", zh: "征收缺口总计" })}</div>
          <div className="wb-krow"><span className="wb-big">13%</span><span className="chip">{tr({ en: "SAR 120M uncollected", ar: "120 مليون غير محصّلة", zh: "SAR 120M 未收" })}</span></div>
          <table className="wb-table"><thead><tr><th>{tr({ en: "CONTRACT ID", ar: "رقم العقد", zh: "合同编号" })}</th><th>{tr({ en: "AMANAH", ar: "الأمانة", zh: "阿玛纳" })}</th><th>{tr({ en: "OVERDUE", ar: "متأخر", zh: "逾期" })}</th><th>{tr({ en: "RISK", ar: "الخطر", zh: "风险" })}</th><th>{tr({ en: "ASK", ar: "اسأل", zh: "提问" })}</th></tr></thead>
            <tbody>{WB.focus.map((r, i) => (<tr key={i} onClick={() => fAsk(r)}><td className="mono">{r.id}</td><td>{tr(r.am)}</td><td><Money v={r.od} /></td><td>{risk(r.risk)}</td><td><span className="wb-q" title={tr({ en: "Ask the agent", ar: "اسأل الوكيل", zh: "向智能体提问" })}>?</span></td></tr>))}</tbody></table>
          <div className="wb-tfoot"><span>{tr({ en: "Showing 5 of 47 · click any row to ask the agent", ar: "عرض 5 من 47 · انقر أي صف لسؤال الوكيل", zh: "显示 47 中的 5 条 · 点击任意行向智能体提问" })}</span><a onClick={() => askQ(2)}>{tr({ en: "View all →", ar: "عرض الكل →", zh: "查看全部 →" })}</a></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Amanah Distribution", ar: "توزيع الأمانات", zh: "阿玛纳分布" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl2">{tr({ en: "Top Amanat by billing gap", ar: "أعلى الأمانات حسب فجوة الفوترة", zh: "按开票缺口排序的阿玛纳" })}</div>
          {configuredDistribution("rcbench", "gap_by_amana", "gap_amount", WB.dist).map((d, i) => (<div className="wb-dist" key={i}><div className="dn">{tr(d.am)}</div><div className="dt"><span className={"df " + d.cls} style={{ width: d.pct + "%" }} /></div><div className="dv"><Money v={d.v} /></div></div>))}
          <div className="wb-other"><span>{tr({ en: "Other 42 Amanat", ar: "42 أمانة أخرى", zh: "其余 42 个阿玛纳" })}</span><b><Money v="SAR 19M" /></b></div>
        </div></div>
    </div>
    {/* MULTI-AGENT WORKSPACE */}
    <div className="wb-sech"><h2>{tr({ en: "Multi-Agent Workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</h2><div className="muted">{tr({ en: "Orchestrated agent roles & live action timeline", ar: "أدوار وكلاء منسّقة وخط زمني حي", zh: "编排的智能体角色与实时操作时间线" })}</div></div>
    <div className="wb-cols3 wb-work">
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot" style={{ background: "#1C8354" }} /> <b>{tr({ en: "Data Inputs · sources", ar: "مدخلات البيانات · المصادر", zh: "数据输入 · 源系统" })}</b><span className="wb-pm">{tr({ en: "10 systems", ar: "10 أنظمة", zh: "10 个系统" })}</span></div>
        <div className="wb-pb"><div className="wb-srclist">{WB_SOURCES.map((s, i) => (<div className="wb-src" key={i}><span className={"sd" + (s.s === "loading" ? " load" : "")} /><span className="sn">{s.n}</span><span className="ss">{tr(s.s === "loading" ? { en: "loading", ar: "تحميل", zh: "载入" } : { en: "synced", ar: "متزامن", zh: "已同步" })}</span></div>))}</div></div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot blue" /> <b>{tr({ en: "Orchestrator · Task Board", ar: "المنسّق · لوحة المهام", zh: "编排器 · 任务板" })}</b><span className="wb-orchpill"><span className="gear">⚙</span>{tr({ en: "Auto-orchestration · 3 agents", ar: "تنسيق تلقائي · 3 وكلاء", zh: "自动编排 · 3 个智能体" })}</span></div>
        <div className="wb-pb">{WB.roles.map((r, i) => (<div className={"wb-role " + (r.cls || "") + (r.focus ? " foc-card" : "")} key={i} onClick={r.focus ? () => setRoute("rcwork") : undefined}>
          <div className="rl"><div className="rt">{r.code ? ucl(r.code, tr(r.name)) : tr(r.name)}</div><div className="rs">{tr(r.sub)}</div></div>{badge(r.status)}
        </div>))}</div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot blue" /> <b>{tr({ en: "Agent Timeline · Logs", ar: "خط زمن الوكلاء · السجلات", zh: "智能体时间线 · 日志" })}</b><span className="wb-pm">{tr({ en: "last 5 min", ar: "آخر 5 د", zh: "最近 5 分钟" })}</span></div>
        <div className="wb-pb"><div className="wb-tl" ref={logRef}>{feed.map((e, i) => (<div className={"wb-ev" + (i === feed.length - 1 ? " live" : "")} key={i}><span className={"wb-dot2 " + e.dot} /><div className="wb-eh"><b>{e.tm}</b> · {e.code ? ucl(e.code, tr(e.h)) : tr(e.h)}</div><div className="wb-ed">{tr(e.d)}</div></div>))}</div></div></div>
    </div>
    <button className="wb-qfab" onClick={() => setQaOpen(o => !o)} aria-label="AI Narratives & Q&A" title={tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}>🤖</button>
    {qaOpen && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className="wb-dot violet" /> <b>{tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}</b><button className="wb-qx" onClick={() => setQaOpen(false)}>✕</button></div>
        <div className="wb-pb wb-qbody">
          {qa.length === 0 && !thinking && <div className="wb-narrwrap"><div className="wb-ntag">{ucl("UC-13", tr({ en: "NARRATIVE", ar: "السرد", zh: "叙述" }))}</div>
          <div className="wb-narr">
            <p>{tr({ en: "Collection performance is stable at 87% overall, but three Amanat (Riyadh-East, Jeddah-Port, Dammam-Industrial) account for SAR 78M of the SAR 120M gap.", ar: "أداء التحصيل مستقر عند 87% إجمالاً، لكن ثلاث أمانات (الرياض-شرق، جدة-الميناء، الدمام-الصناعية) تمثّل 78 مليون ريال من فجوة 120 مليون ريال.", zh: "整体征收表现稳定在 87%,但三个阿玛纳(利雅得-东、吉达-港、达曼-工业)占 SAR 120M 缺口中的 SAR 78M。" })}</p>
            <p>{tr({ en: "Lease contracts dominate overdue balances, with 50% of arrears aged beyond 60 days. RAG analysis shows weak escalation clauses in Wusool template v2.", ar: "عقود الإيجار تهيمن على الأرصدة المتأخرة، مع تقادم 50% من المتأخرات أكثر من 60 يوماً. يُظهر تحليل RAG ضعف بنود التصعيد في قالب وصول v2.", zh: "租约合同主导逾期余额,50% 的欠款账龄超过 60 天。RAG 分析显示 Wusool 模板 v2 的升级条款较弱。" })}</p>
            <div className="wb-rp">{tr({ en: "Recommended priorities:", ar: "الأولويات الموصى بها:", zh: "建议优先事项:" })}</div>
            <ul><li>{tr({ en: "Targeted follow-up on top 3 Amanat (SAR 78M)", ar: "متابعة موجّهة لأعلى 3 أمانات (78 مليون ريال)", zh: "针对前 3 个阿玛纳的定向跟进(SAR 78M)" })}</li>
              <li>{tr({ en: "Review lease template terms with legal", ar: "مراجعة شروط قالب الإيجار مع القانونية", zh: "与法务复核租约模板条款" })}</li>
              <li>{tr({ en: "Open alerts on contracts overdue >90 days", ar: "فتح تنبيهات للعقود المتأخرة >90 يوماً", zh: "对逾期 >90 天的合同开启告警" })}</li></ul>
            <div className="wb-src">{ucl("UC-01", tr({ en: "Source: unified data · Numeric Query Agent", ar: "المصدر: بيانات موحّدة · وكيل الاستعلام الرقمي", zh: "来源:统一数据 · 数值查询智能体" }))}</div>
          </div></div>}
          {(qa.length > 0 || thinking) && <div className="wb-qa" ref={qaRef}>
            {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb"><Money v={m.text} /></div></div>))}
            {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
          </div>}
          <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
          {(qa.length === 0 || showSugs) && WB.qs.map((q, i) => (<div className="wb-sq" key={i} onClick={() => askQ(i)}>{tr(q)} <span className="ar">→</span></div>))}
          <div className="wb-askh">{tr({ en: "Ask the Revenue agent…", ar: "اسأل وكيل الإيرادات…", zh: "向收入智能体提问…" })}</div>
          <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && askQ(-1, ask)} /><button className="btn sm" onClick={() => askQ(-1, ask)}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
        </div>
    </div>}
    </div>
  </div>);
}
// ===== KPI carousel (vertical slides + dots) — data from BRD Main outputs / KPIs =====
const RC_KPI_SLIDES = [
  [
    { lab: { en: "Collection Rate", ar: "معدل التحصيل", zh: "征收率" }, v: "87%", d: { en: "+2.1% QoQ", ar: "+2.1%", zh: "+2.1% 环比" }, up: true },
    { lab: { en: "Collection Gap", ar: "فجوة التحصيل", zh: "征收缺口" }, v: "SAR 120M", d: { en: "net billed 920 − collected 800", ar: "صافي المفوتر 920 − المحصّل 800", zh: "净开票 920 − 已收 800" } },
    { lab: { en: "Overdue Risk (30/60/90+)", ar: "مخاطر التأخر (30/60/90+)", zh: "逾期风险 (30/60/90+)" }, aging: [["30d", 47, "SAR 28M"], ["60d", 53, "SAR 32M"], ["90+", 100, "SAR 60M"]] },
    { lab: { en: "Prioritized Actions", ar: "إجراءات مرتّبة", zh: "优先行动" }, act: true, esc: "5", total: "14", items: [ { t: { en: "Riyadh-East overdue", ar: "تأخر الرياض-شرق", zh: "利雅得-东逾期" }, s: { en: "escalate to Amanah finance", ar: "تصعيد لمالية الأمانة", zh: "上报阿玛纳财务" }, v: "SAR 32M" }, { t: { en: "Jeddah-Port overdue", ar: "تأخر جدة-الميناء", zh: "吉达-港逾期" }, s: { en: "dunning + legal notice", ar: "تحصيل + إشعار قانوني", zh: "催收 + 法律通知" }, v: "SAR 26M" }, { t: { en: "Contracts > 90 days (18)", ar: "عقود > 90 يوماً (18)", zh: "逾期 >90 天合同(18)" }, s: { en: "auto-escalation", ar: "تصعيد تلقائي", zh: "自动升级" }, v: "SAR 34M" }, { t: { en: "Duplicate invoice INV-4471", ar: "فاتورة مكررة INV-4471", zh: "重复发票 INV-4471" }, s: { en: "block & correct", ar: "حجب وتصحيح", zh: "拦截并更正" }, v: "SAR 1.86M" }, { t: { en: "Wusool template v2 clauses", ar: "بنود قالب وصول v2", zh: "Wusool 模板 v2 条款" }, s: { en: "legal review", ar: "مراجعة قانونية", zh: "法务复核" }, v: "—" } ] },
  ],
  [
    { lab: { en: "Net Billed Amount", ar: "صافي المفوتر", zh: "净开票额" }, v: "SAR 920M", d: { en: "gross − exclusions", ar: "إجمالي − استبعادات", zh: "总开票 − 排除项" } },
    { lab: { en: "Collection Gaps", ar: "فجوات التحصيل", zh: "征收缺口" }, v: "13%", d: { en: "SAR 120M uncollected", ar: "120 مليون غير محصّلة", zh: "SAR 120M 未收" } },
    { lab: { en: "Exclusion Reports", ar: "تقارير الاستبعاد", zh: "排除项报告" }, v: "3 cat.", d: { en: "judgment · objection · written-off", ar: "حكم · اعتراض · شطب", zh: "判决 · 异议 · 核销" } },
    { lab: { en: "Revenue Opportunity Alerts", ar: "تنبيهات الفرص", zh: "收入机会告警" }, v: "5", d: { en: "under-billed / missed", ar: "نقص فوترة", zh: "少开票 / 漏覆盖" } },
  ],
  [
    { lab: { en: "Overdue Share (>60d)", ar: "نسبة التأخر (>60ي)", zh: "逾期占比 (>60天)" }, v: "50%", d: { en: "lease-driven", ar: "تقوده الإيجارات", zh: "租约主导" } },
    { lab: { en: "Avg DSO", ar: "متوسط أيام التحصيل", zh: "平均回款天数" }, v: "74", d: { en: "days outstanding", ar: "يوم تحصيل", zh: "天" } },
    { lab: { en: "Top-3 Amanat Gap", ar: "فجوة أعلى 3 أمانات", zh: "前3阿玛纳缺口" }, v: "SAR 78M", d: { en: "of SAR 120M total", ar: "من 120 مليون", zh: "占 SAR 120M" } },
    { lab: { en: "Actionable Recommendations", ar: "توصيات قابلة للتنفيذ", zh: "可执行建议" }, v: "14", d: { en: "ranked by impact", ar: "حسب الأثر", zh: "按影响排序" } },
  ],
];
const AS_KPI_SLIDES = [
  [
    { lab: { en: "Capitalized AUC", ar: "المرسمل من تحت الإنشاء", zh: "已资本化在建资产" }, v: "SAR 1.92B", d: { en: "62% of SAR 3.10B", ar: "62% من 3.10 مليار", zh: "占 SAR 3.10B 的 62%" }, up: true },
    { lab: { en: "Impairment Flagged", ar: "مرصود للانخفاض", zh: "减值标记" }, v: "3", d: { en: "items · SAR 47M NBV", ar: "بنود · 47 مليون", zh: "项 · 账面净值 SAR 47M" } },
    { lab: { en: "Maintenance Due (≤30/≤60/>60d)", ar: "صيانة مستحقة (≤30/≤60/>60ي)", zh: "待维护 (≤30/≤60/>60天)" }, aging: [["≤30d", 40, "2"], ["≤60d", 60, "3"], [">60d", 100, "5"]] },
    { lab: { en: "Data Quality Score", ar: "درجة جودة البيانات", zh: "数据质量分" }, v: "96%", d: "+1.4% QoQ", up: true },
  ],
  [
    { lab: { en: "Improved Asset Registry", ar: "سجل أصول محسّن", zh: "改进的资产台账" }, v: "8,640", d: { en: "records · 96% quality", ar: "سجلات · 96%", zh: "记录 · 质量 96%" } },
    { lab: { en: "Classification Recommendations", ar: "توصيات التصنيف", zh: "分类建议" }, v: "47", d: { en: "reclass proposals", ar: "مقترحات إعادة تصنيف", zh: "重分类提议" } },
    { lab: { en: "Capitalization Recommendations", ar: "توصيات الرسملة", zh: "资本化建议" }, v: "SAR 1.92B", d: { en: "312 AUC items", ar: "312 بنداً", zh: "312 项在建" } },
    { lab: { en: "Investment Opportunities", ar: "فرص استثمارية", zh: "投资机会" }, v: "5", d: { en: "reuse / disposal", ar: "إعادة / تصرّف", zh: "复用 / 处置" } },
  ],
  [
    { lab: { en: "Asset Cost Tracking", ar: "تتبّع تكلفة الأصل", zh: "资产成本追踪" }, v: "100%", d: { en: "invoice → register", ar: "الفاتورة ← السجل", zh: "发票 → 台账" } },
    { lab: { en: "AUC Opening", ar: "تحت الإنشاء (افتتاحي)", zh: "在建期初" }, v: "SAR 3.10B", d: { en: "this period", ar: "هذه الفترة", zh: "本期" } },
    { lab: { en: "Maintenance Alerts", ar: "تنبيهات الصيانة", zh: "维护告警" }, v: "5", d: { en: "infra-led · ≤60d", ar: "بنية تحتية", zh: "基础设施 · ≤60天" } },
    { lab: { en: "Impairment Alerts", ar: "تنبيهات الانخفاض", zh: "减值告警" }, v: "3", d: { en: "equipment · SAR 47M", ar: "معدات · 47 مليون", zh: "设备 · SAR 47M" } },
  ],
];
function KpiCarousel({ slides, tone, configRoute }) {
  const { tr, setAlertsOpen } = useStore();
  const [idx, setIdx] = useState(0);
  const [openAct, setOpenAct] = useState(false);
  const configuredSlides = useMemo(() => applyKpiSlides(configRoute, slides), [configRoute, slides]);
  const actCard = configuredSlides.flat().find(c => c.act);
  useEffect(() => { const id = setInterval(() => setIdx(i => (i + 1) % configuredSlides.length), 5000); return () => clearInterval(id); }, [configuredSlides.length]);
  const card = (c, i) => c.aging
    ? (<div className="ws-kpi2 km kmrisk" key={i}><div className="lab">{tr(c.lab)}</div>
        <div className="km-aging">{c.aging.map((b, j) => (<div className="ab" key={j}><div className="abar"><i style={{ width: b[1] + "%" }} /></div><div className="at">{b[0]}</div><div className="av">{b[2]}</div></div>))}</div></div>)
    : c.act
    ? (<div className={"ws-kpi2 km kmact" + (openAct ? " on" : "")} key={i} onClick={() => setOpenAct(o => !o)} title={tr({ en: "View escalation details", ar: "عرض تفاصيل التصعيد", zh: "查看升级详情" })}>
        <div className="lab">{tr(c.lab)} <span className="km-open">{openAct ? "▾" : "▸"}</span></div>
        <div className="km-actrow"><b className="kmbig">{c.esc}</b><span className="kmesc">{tr({ en: "escalations", ar: "تصعيدات", zh: "项升级" })}</span></div>
        <div className="kmsub">{tr({ en: "of " + c.total + " actions · by impact", ar: "من " + c.total + " إجراءً · حسب الأثر", zh: "共 " + c.total + " 项行动 · 按影响排序" })}</div>
      </div>)
    : (<div className="ws-kpi2 km" key={i}><div className="lab">{tr(c.lab)}</div><div className="v"><Money v={c.v} /> <span className={"d" + (c.up ? " up" : "")}>{typeof c.d === "string" ? c.d : tr(c.d)}</span></div></div>);
  return (<div className={"kpi-carousel " + (tone || "green")}>
    <div className="kpi-viewport">
      <div className="kpi-track" style={{ transform: `translateY(-${idx * 118}px)` }}>
        {configuredSlides.map((cards, si) => (<div className="kpi-slide" key={si}><div className="ws-kpirow km4">{cards.map(card)}</div></div>))}
      </div>
    </div>
    <div className="kpi-dots">{configuredSlides.map((_, i) => (<button key={i} className={"kpi-dot" + (i === idx ? " on" : "")} onClick={() => setIdx(i)} aria-label={"slide " + (i + 1)} />))}</div>
    {openAct && actCard && <div className="km-pop">
      <div className="km-poph"><b>{tr({ en: "5 escalations · prioritized by impact", ar: "5 تصعيدات · حسب الأثر", zh: "5 项升级 · 按影响排序" })}</b><button className="km-popx" onClick={(e) => { e.stopPropagation(); setOpenAct(false); }}>✕</button></div>
      {actCard.items.map((it, j) => (<div className="km-popr" key={j} onClick={() => { setOpenAct(false); setAlertsOpen(true); }}><span className="r">{j + 1}</span><div className="m"><div className="t">{tr(it.t)}</div><div className="s">{tr(it.s)}</div></div><span className="v">{it.v}</span></div>))}
      <div className="km-popf" onClick={() => { setOpenAct(false); setAlertsOpen(true); }}>{tr({ en: "Open Alerts & Exceptions Center →", ar: "فتح مركز التنبيهات →", zh: "打开告警与异常中心 →" })}</div>
    </div>}
  </div>);
}

// ===== Shared floating Smart Query (every workspace) =====
const SQ_GEN = { en: "Within the current scope, the agent cross-checked the linked records and source systems. Read: most indicators are within expected ranges except the items flagged above — open a highlighted row to see the contributing contracts/assets, then use a downstream hand-off action to route any approval. (Demo response; wire live data for exact figures.)", ar: "ضمن النطاق الحالي، راجع الوكيل السجلات والأنظمة المصدرية. النتيجة: معظم المؤشرات ضمن النطاقات المتوقعة عدا البنود المُعلَّمة أعلاه — افتح صفاً مميزاً لعرض العقود/الأصول، ثم استخدم إجراء تسليم لاحق للاعتماد. (إجابة عرض.)", zh: "在当前作用域内,智能体已交叉核对关联记录与源系统。结论:除上方标记项外,多数指标处于预期范围;点击任一高亮行可查看相关合同/资产,再用下游交接动作发起审批。(演示回答;接入实时数据后给出精确数值。)" };
function smartQuerySourceLabel(type) {
  if (type === "REAL_SAMPLE") return { en: "real sample data", ar: "بيانات عينة حقيقية", zh: "真实样例数据" };
  if (type === "MIXED_SAMPLE") return { en: "sample data + demo assumptions", ar: "بيانات عينة + افتراضات العرض", zh: "样例数据 + demo 假设" };
  if (type === "MOCK") return { en: "mock data", ar: "بيانات محاكاة", zh: "Mock 数据" };
  return { en: "configured data", ar: "بيانات مهيأة", zh: "配置数据" };
}

function SmartQueryFab({ scope, prompts, items = [], route = null }) {
  const { tr, pushLog } = useStore();
  const configured = useMemo(() => route ? getSmartQueryFabConfig(route, scope, prompts) : { scope, prompts, items }, [route, scope, prompts, items]);
  const activeScope = configured.scope;
  const activePrompts = configured.prompts || [];
  const activeItems = configured.items || [];
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const tRef = useRef(null);
  useEffect(() => { const el = tRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);
  const answerFromConfig = (item) => {
    if (!item) return tr(SQ_GEN);
    const data = item.mockData?.[0] || {};
    const sourceType = tr(smartQuerySourceLabel(data.sourceType));
    const blocks = (item.answerBlocks || []).map((block) => tr({ en: block.titleEn || block.type, zh: block.titleZh || block.type, ar: block.titleAr || block.titleEn || block.type })).join(" / ");
    const fields = Array.isArray(data.sampleFields) ? data.sampleFields.slice(0, 3).join("; ") : "";
    const next = item.nextActions?.[0] ? tr({ en: item.nextActions[0].labelEn, zh: item.nextActions[0].labelZh, ar: item.nextActions[0].labelAr || item.nextActions[0].labelEn }) : tr({ en: "No configured next action", ar: "لا يوجد إجراء تالٍ مهيأ", zh: "无配置的下一步动作" });
    return tr({
      en: `${item.businessIntentLabel?.en || item.businessIntent || "Configured query"} · Source: ${sourceType}. Data: ${data.sampleBatch || data.dataset || "configured dataset"}. Answer blocks: ${blocks || "summary / evidence"}. Evidence: ${fields || data.sourcePath || "configured evidence"}. Next action: ${next}.`,
      ar: `${item.businessIntentLabel?.ar || item.businessIntentLabel?.en || item.businessIntent || "استعلام مهيأ"} · المصدر: ${sourceType}. البيانات: ${data.sampleBatch || data.dataset || "مجموعة مهيأة"}. كتل الإجابة: ${blocks || "ملخص / دليل"}. الدليل: ${fields || data.sourcePath || "دليل مهيأ"}. الإجراء التالي: ${next}.`,
      zh: `${item.businessIntentLabel?.zh || item.businessIntent || "配置问数"} · 来源:${sourceType}。数据:${data.sampleBatch || data.dataset || "已配置数据集"}。回答块:${blocks || "摘要 / 证据"}。证据:${fields || data.sourcePath || "已配置证据"}。下一步:${next}。`,
    });
  };
  const send = (q) => {
    const promptObj = q && typeof q === "object" ? q : null;
    const v = (promptObj ? tr(promptObj) : (q || ask)).trim(); if (!v || thinking) return;
    const configuredItem = promptObj?.configId
      ? activeItems.find((item) => item.id === promptObj.configId)
      : activeItems.find((item) => [item.userQuestion?.en, item.userQuestion?.zh, item.userQuestion?.ar].some((text) => text && text === v));
    pushLog({ en: "Smart query → " + v, ar: "استعلام ذكي → " + v, zh: "智能查询 → " + v });
    setQa(p => [...p, { role: "u", text: v }]); setAsk(""); setThinking(true); setShowSugs(false);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: answerFromConfig(configuredItem) }]); setThinking(false); }, 800);
  };
  return (<React.Fragment>
    <button className="wb-qfab" onClick={() => setOpen(o => !o)} title={tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能查询" })}>🤖</button>
    {open && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className="wb-dot violet" /> <b>{tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能查询" })}</b>{SHOW_UC && <span style={{ fontSize: 9, fontWeight: 800, color: "#6d28d9", background: "#f5effe", borderRadius: 6, padding: "1px 6px", marginInlineStart: 6 }}>UC-03</span>}<button className="wb-qx" onClick={() => setOpen(false)}>✕</button></div>
      <div className="wb-pb wb-qbody">
        {activeScope && <div className="wb-src" style={{ marginBottom: 8 }}>{tr(activeScope)}</div>}
        <div className="wb-qa sq-conv" ref={tRef}>
          {qa.length === 0 && !thinking && <div className="sq-empty">{tr({ en: "Ask the department agent anything within this scope — or tap a suggested question below.", ar: "اسأل وكيل الإدارة ضمن هذا النطاق — أو اختر سؤالاً مقترحاً أدناه.", zh: "在此作用域内向部门智能体提问——或点击下方的建议问题。" })}</div>}
          {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb">{m.text}</div></div>))}
          {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
        </div>
        <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
        {(qa.length === 0 || showSugs) && activePrompts.map((q, i) => (<div className="wb-sq" key={q.configId || i} onClick={() => send(q)}>{tr(q)} <span className="ar">→</span></div>))}
        <div className="wb-askh">{tr({ en: "Ask the department agent…", ar: "اسأل وكيل الإدارة…", zh: "向部门智能体提问…" })}</div>
        <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && send()} /><button className="btn sm" onClick={() => send()}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
      </div>
    </div>}
  </React.Fragment>);
}

const PAGE_SMART_QUERY = {
  perf: {
    scope: { en: "Scope: Financial performance analysis · read-only", ar: "النطاق: تحليل الأداء المالي · للقراءة", zh: "范围:财务绩效分析 · 只读" },
    prompts: [
      { en: "Which region has the largest execution variance?", ar: "أي منطقة لديها أكبر انحراف في التنفيذ؟", zh: "哪个区域的执行偏差最大?" },
      { en: "Explain the service concentration risk", ar: "اشرح مخاطر تركز الخدمات", zh: "解释服务集中度风险" },
      { en: "Draft the executive performance comment", ar: "صغ تعليق الأداء التنفيذي", zh: "起草管理层绩效评述" },
    ],
  },
  alerts: {
    scope: { en: "Scope: exception monitoring · source-backed", ar: "النطاق: مراقبة الاستثناءات · مدعومة بالمصدر", zh: "范围:异常监控 · 可追溯" },
    prompts: [
      { en: "Which exception should be handled first?", ar: "أي استثناء يجب التعامل معه أولاً؟", zh: "哪个异常应该优先处理?" },
      { en: "Show source evidence for the critical alert", ar: "اعرض دليل المصدر للتنبيه الحرج", zh: "显示严重告警的来源证据" },
      { en: "Which alerts block downstream approval?", ar: "ما التنبيهات التي تمنع الاعتماد اللاحق؟", zh: "哪些告警会阻断下游审批?" },
    ],
  },
  plnbudget: {
    scope: { en: "Scope: budget planning and fiscal space", ar: "النطاق: تخطيط الميزانية والحيّز المالي", zh: "范围:预算规划与财政空间" },
    prompts: [
      { en: "How much fiscal space is left under this option?", ar: "كم الحيز المالي المتبقي في هذا الخيار؟", zh: "当前方案还剩多少财政空间?" },
      { en: "Which ceiling line is highest risk?", ar: "أي بند سقف هو الأعلى خطراً؟", zh: "哪条上限行风险最高?" },
      { en: "Which drill-down should feed forecasting?", ar: "أي تفصيل يجب إدخاله في التنبؤ؟", zh: "哪个下钻结果应该进入预测?" },
    ],
  },
  plncost: {
    scope: { en: "Scope: project cost drivers and benchmark evidence", ar: "النطاق: محركات تكلفة المشروع وأدلة المقارنة", zh: "范围:项目成本驱动与基准证据" },
    prompts: [
      { en: "Which cost driver explains the variance most?", ar: "أي محرك تكلفة يفسر الانحراف الأكبر؟", zh: "哪个成本驱动最能解释偏差?" },
      { en: "Why is the recommended estimate lower?", ar: "لماذا التقدير الموصى أقل؟", zh: "为什么建议估算更低?" },
      { en: "Can this reviewed amount feed the forecast?", ar: "هل يمكن إدخال المبلغ المراجع في التنبؤ؟", zh: "这个评审金额能否进入预测?" },
    ],
  },
  plnhousing: {
    scope: { en: "Scope: housing support impact and funding need", ar: "النطاق: أثر دعم الإسكان واحتياج التمويل", zh: "范围:住房支持影响与资金需求" },
    prompts: [
      { en: "Which support mix is recommended?", ar: "ما مزيج الدعم الموصى به؟", zh: "推荐哪种支持组合?" },
      { en: "Which region needs manual review?", ar: "أي منطقة تحتاج مراجعة يدوية؟", zh: "哪个区域需要人工复核?" },
      { en: "How much funding gap feeds the forecast?", ar: "كم فجوة التمويل التي تدخل التنبؤ؟", zh: "有多少资金缺口进入预测?" },
    ],
  },
  plnforecast: {
    scope: { en: "Scope: future obligations and funding pressure", ar: "النطاق: الالتزامات المستقبلية وضغط التمويل", zh: "范围:未来义务与资金压力" },
    prompts: [
      { en: "When does the first funding gap appear?", ar: "متى تظهر أول فجوة تمويل؟", zh: "首次资金缺口何时出现?" },
      { en: "Which obligation drives the peak gap?", ar: "أي التزام يقود ذروة الفجوة؟", zh: "哪个义务驱动峰值缺口?" },
      { en: "What should move into scenario testing?", ar: "ما الذي يجب نقله لاختبار السيناريو؟", zh: "哪些内容应进入情景试算?" },
    ],
  },
  plnscenario: {
    scope: { en: "Scope: scenario simulation and alternatives comparison", ar: "النطاق: محاكاة السيناريوهات ومقارنة البدائل", zh: "范围:情景模拟与备选方案比较" },
    prompts: [
      { en: "Which scenario has the best benefit-to-risk ratio?", ar: "أي سيناريو لديه أفضل نسبة منفعة إلى مخاطر؟", zh: "哪个情景的收益风险比最好?" },
      { en: "Explain the trade-off in the recommended package", ar: "اشرح المفاضلة في الحزمة الموصى بها", zh: "解释推荐方案的权衡" },
      { en: "Which assumptions need justification?", ar: "ما الافتراضات التي تحتاج تبريراً؟", zh: "哪些假设需要说明理由?" },
    ],
  },
  budexec17: {
    scope: { en: "Scope: budget execution monitoring and reconciliation", ar: "النطاق: متابعة تنفيذ الميزانية والمطابقة", zh: "范围:预算执行监控与运营对账" },
    prompts: [
      { en: "Explain the selected budget line stage", ar: "اشرح مرحلة بند الميزانية المحدد", zh: "解释所选预算行所处阶段" },
      { en: "Which rows have idle available budget?", ar: "ما البنود ذات ميزانية متاحة خاملة؟", zh: "哪些行存在可用但闲置预算?" },
      { en: "Generate a management report draft", ar: "أنشئ مسودة تقرير إداري", zh: "生成管理报告草稿" },
    ],
  },
  entclaims08: {
    scope: { en: "Scope: claims, evidence and disbursement readiness", ar: "النطاق: المطالبات والأدلة وجاهزية الصرف", zh: "范围:索赔、证据与拨付就绪度" },
    prompts: [
      { en: "Which claims are missing evidence?", ar: "ما المطالبات التي تفتقد الأدلة؟", zh: "哪些索赔缺少证据?" },
      { en: "Explain the duplicate payment risk", ar: "اشرح خطر الدفع المكرر", zh: "解释重复付款风险" },
      { en: "Which batch is ready for approval?", ar: "أي دفعة جاهزة للاعتماد؟", zh: "哪个批次可以审批?" },
    ],
  },
  entclose09: {
    scope: { en: "Scope: financial close, reconciliation and settlements", ar: "النطاق: الإقفال المالي والمطابقة والتسويات", zh: "范围:财务关账、对账与结算" },
    prompts: [
      { en: "Which reconciliation difference remains open?", ar: "أي فرق مطابقة ما زال مفتوحاً؟", zh: "还有哪些对账差异未关闭?" },
      { en: "Explain the settlement adjustment", ar: "اشرح تسوية القيد", zh: "解释结算调整" },
      { en: "What blocks period close approval?", ar: "ما الذي يمنع اعتماد إقفال الفترة؟", zh: "什么阻断期间关账审批?" },
    ],
  },
};
PAGE_SMART_QUERY["budexec-space"] = {
  scope: { en: "Scope: budget execution fiscal space and transfer candidates", ar: "النطاق: الحيز المالي لتنفيذ الميزانية ومرشحات المناقلة", zh: "范围:预算执行财政空间与转移候选" },
  prompts: [
    { en: "Which available balances can be released?", ar: "ما الأرصدة المتاحة التي يمكن تحريرها؟", zh: "哪些可用余额可以释放?" },
    { en: "Explain free cost after commitments and reservations", ar: "اشرح التكلفة الحرة بعد الالتزامات والحجوزات", zh: "解释承诺和预留后的自由成本" },
    { en: "Which lines should not be transferred?", ar: "ما البنود التي لا ينبغي مناقلتها؟", zh: "哪些预算行不应转移?" },
  ],
};
PAGE_SMART_QUERY["budexec-forecast"] = {
  scope: { en: "Scope: future obligations and liquidity pressure from execution data", ar: "النطاق: الالتزامات المستقبلية وضغط السيولة من بيانات التنفيذ", zh: "范围:来自执行数据的未来义务与流动性压力" },
  prompts: [
    { en: "When does the first funding pressure appear?", ar: "متى يظهر أول ضغط تمويلي؟", zh: "第一个资金压力点何时出现?" },
    { en: "Which contracts drive the liquidity pressure?", ar: "ما العقود التي تقود ضغط السيولة؟", zh: "哪些合同驱动流动性压力?" },
    { en: "Send the pressure result to fiscal space", ar: "أرسل نتيجة الضغط إلى الحيز المالي", zh: "把压力结果传给财政空间" },
  ],
};
PAGE_SMART_QUERY["budexec-reports"] = {
  scope: { en: "Scope: budget execution report generation and evidence package", ar: "النطاق: إنشاء تقارير تنفيذ الميزانية وحزمة الأدلة", zh: "范围:预算执行报告生成与证据包" },
  prompts: [
    { en: "Generate a consumption detail report draft", ar: "أنشئ مسودة تقرير تفاصيل الاستهلاك", zh: "生成消耗详情报告草稿" },
    { en: "Which evidence supports the Etimad reconciliation report?", ar: "ما الأدلة التي تدعم تقرير مطابقة اعتماد؟", zh: "Etimad 对账报告有哪些证据来源?" },
    { en: "List report types ready for leadership review", ar: "اسرد أنواع التقارير الجاهزة لمراجعة القيادة", zh: "列出可提交领导复核的报告类型" },
  ],
};

// ===== Shared Business Plaza · two-lane overview (Revenue × Assets) =====
const NEXT_ACTIONS_RC = [
  { act: { en: "Approve & route 14 billing corrections to collections", ar: "اعتماد وتوجيه 14 تصحيحاً للتحصيل", zh: "批准并下发 14 项开票更正至征收" }, owner: "Layla Al-Harbi", role: { en: "Revenue Collection Lead", ar: "قائدة التحصيل", zh: "收入征收负责人" }, phone: "+966 55 014 2207" },
  { act: { en: "Launch dunning on top 18 contracts > 90d", ar: "بدء التحصيل على أعلى 18 عقداً > 90 يوماً", zh: "对逾期>90天的前18个合同启动催收" }, owner: "Omar Al-Qahtani", role: { en: "Collections Officer", ar: "مسؤول التحصيل", zh: "催收专员" }, phone: "+966 50 663 1180" },
  { act: { en: "Escalate Riyadh-East gap to Amanah finance", ar: "تصعيد فجوة الرياض-شرق لمالية الأمانة", zh: "将利雅得-东缺口上报阿玛纳财务" }, owner: "Faisal Al-Dossari", role: { en: "Riyadh-East Finance Mgr", ar: "مدير مالية الرياض-شرق", zh: "利雅得-东财务经理" }, phone: "+966 53 991 4472" },
];
const NEXT_ACTIONS_AS = [
  { act: { en: "Post SAR 1.92B AUC capitalization for review", ar: "ترحيل رسملة 1.92 مليار للمراجعة", zh: "提交 SAR 1.92B 在建资产资本化待复核" }, owner: "Noura Al-Otaibi", role: { en: "Asset Accounting Lead", ar: "قائدة محاسبة الأصول", zh: "资产会计负责人" }, phone: "+966 55 207 3318" },
  { act: { en: "Issue impairment memos — 3 equipment items", ar: "إصدار مذكرات انخفاض لـ 3 معدات", zh: "为 3 项设备开具减值备忘" }, owner: "Khalid Al-Mutairi", role: { en: "Compliance Officer", ar: "مسؤول الامتثال", zh: "合规专员" }, phone: "+966 50 118 9043" },
  { act: { en: "Schedule R-118 / R-204 maintenance", ar: "جدولة صيانة R-118 / R-204", zh: "安排 R-118 / R-204 维护" }, owner: "Sara Al-Ghamdi", role: { en: "Facilities & Maintenance", ar: "المرافق والصيانة", zh: "设施与维护" }, phone: "+966 53 442 7765" },
];
function SyncBadge() {
  const { tr } = useStore();
  const [sec, setSec] = useState(7);
  useEffect(() => { const id = setInterval(() => setSec(s => (s >= 95 ? 0 : s + 1)), 1000); return () => clearInterval(id); }, []);
  const ago = sec < 3 ? { en: "just now", ar: "الآن", zh: "刚刚" }
    : sec < 60 ? { en: sec + "s ago", ar: "قبل " + sec + " ث", zh: sec + " 秒前" }
    : { en: Math.floor(sec / 60) + "m ago", ar: "قبل " + Math.floor(sec / 60) + " د", zh: Math.floor(sec / 60) + " 分钟前" };
  return (<span className="sync-badge" title={tr({ en: "Live data sync from source systems", ar: "مزامنة بيانات حية من الأنظمة المصدرية", zh: "源系统实时数据同步" })}><span className="sync-ic">⟳</span><b>{tr({ en: "Data sync", ar: "مزامنة البيانات", zh: "数据同步" })}</b> · {tr(ago)}</span>);
}
function DwActions({ buttons }) {
  const { tr, pushLog } = useStore();
  const [done, setDone] = useState(null);
  if (done) return (<div className="dw-pbtns done"><span className="dw-confirm">✓ {tr(done)}</span><button className="dw-btn ghost" onClick={() => setDone(null)}>{tr({ en: "Undo", ar: "تراجع", zh: "撤销" })}</button></div>);
  return (<div className="dw-pbtns">{buttons.map((b, i) => (<button key={i} className={"dw-btn " + (b.cls || "")} onClick={b.go ? b.go : () => { pushLog(b.confirm); setDone(b.confirm); }}>{tr(b.label)}{b.arrow ? " →" : ""}</button>))}</div>);
}
function Hi({ t }) {
  if (!t) return t;
  const out = []; const re = /(\*\*[^*]+\*\*|~~[^~]+~~)/g; let last = 0, m, k = 0;
  while ((m = re.exec(t)) !== null) {
    if (m.index > last) out.push(t.slice(last, m.index));
    const seg = m[0];
    if (seg.slice(0, 2) === "**") out.push(<b className="hi-b" key={k++}>{seg.slice(2, -2)}</b>);
    else out.push(<mark className="hi-m" key={k++}>{seg.slice(2, -2)}</mark>);
    last = m.index + seg.length;
  }
  if (last < t.length) out.push(t.slice(last));
  return <React.Fragment>{out}</React.Fragment>;
}
function OrchNext({ items }) {
  const { tr } = useStore();
  const actionItems = Array.isArray(items) ? items : [];
  if (!actionItems.length) return null;
  return (<div className="orch-next">
    <div className="onh">⚐ {tr({ en: "Next actions · owners", ar: "الإجراءات التالية · المسؤولون", zh: "下一步动作 · 负责人" })}</div>
    {actionItems.map((a, i) => (<div className="ona" key={i}>
      <span className="ona-i">{i + 1}</span>
      <div className="ona-m"><div className="ona-t">{tr(a.act)}</div><div className="ona-o">👤 {a.owner} · {tr(a.role)}</div></div>
      {a.phone ? <a className="ona-tel" href={"tel:" + a.phone.replace(/[^+\d]/g, "")} onClick={e => e.stopPropagation()}>📞 {a.phone}</a> : null}
    </div>))}
  </div>);
}

function smartText(value, fallback = "") {
  if (value && typeof value === "object") {
    return {
      en: value.en || value.zh || value.ar || fallback,
      zh: value.zh || value.en || value.ar || fallback,
      ar: value.ar || value.en || value.zh || fallback,
    };
  }
  const text = String(value || fallback || "");
  return { en: text, zh: text, ar: text };
}

function smartItemQuestion(item) {
  return smartText(item?.userQuestion, item?.id || "");
}

function compactSmartSource(source) {
  const parts = String(source || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split("/").filter(Boolean).pop() || part);
  if (!parts.length) return "";
  return parts.slice(0, 3).join(" | ") + (parts.length > 3 ? ` +${parts.length - 3}` : "");
}

function sameSmartQuestion(left, right) {
  const a = keyify(left);
  const b = keyify(right);
  return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
}

function findSmartItemForPrompt(prompt, promptText, smartItems) {
  if (!Array.isArray(smartItems) || !smartItems.length) return null;
  const candidates = [
    prompt?.t?.en, prompt?.t?.zh, prompt?.t?.ar,
    promptText,
  ].filter(Boolean);
  return smartItems.find((item) => {
    const q = smartItemQuestion(item);
    return candidates.some((candidate) => [q.en, q.zh, q.ar, item.id].some((target) => sameSmartQuestion(candidate, target)));
  }) || null;
}

function smartActionsToOrchNext(actions, fallback = []) {
  if (!Array.isArray(actions) || !actions.length) return fallback;
  return actions.map((action) => ({
    act: smartText({ en: action.labelEn, zh: action.labelZh, ar: action.labelAr }, action.action),
    owner: action.owner || "Orchestrator",
    role: smartText(action.role || { en: "current workbench", zh: "当前工作台", ar: "مساحة العمل الحالية" }, action.action || "configured action"),
    phone: action.phone || "",
  }));
}

function friendlyEvidenceSource(source, tr) {
  const text = String(source || "");
  if (!text) return tr({ en: "Configured evidence", ar: "دليل مهيأ", zh: "配置证据" });
  if (text.includes("SmartQueryFab")) {
    return tr({ en: "KPI, chart and data binding configuration", ar: "إعدادات المؤشرات والرسوم وربط البيانات", zh: "KPI、图表与数据绑定配置" });
  }
  return compactSmartSource(text) || text;
}

function smartTableRows(item, tr) {
  const data = item?.mockData?.[0] || {};
  const fields = Array.isArray(data.sampleFields) && data.sampleFields.length
    ? data.sampleFields
    : (item?.evidence || []).flatMap((ev) => ev.fields || []);
  const sourceType = tr(smartQuerySourceLabel(data.sourceType));
  const question = tr(smartItemQuestion(item));
  return [
    {
      item: question || tr({ en: "Configured query", ar: "استعلام مهيأ", zh: "配置问题" }),
      value: data.sampleBatch || data.dataset || tr({ en: "configured dataset", ar: "مجموعة مهيأة", zh: "配置数据集" }),
      variance: sourceType,
      status: data.sourceType || "CONFIG",
    },
    {
      item: tr({ en: "Data binding", ar: "ربط البيانات", zh: "数据绑定" }),
      value: data.dataset || data.group || tr({ en: "page data", ar: "بيانات الصفحة", zh: "页面数据" }),
      variance: data.mode || tr({ en: "configured", ar: "مهيأ", zh: "已配置" }),
      status: data.group || item?.scope?.group || "",
    },
    {
      item: tr({ en: "Evidence fields", ar: "حقول الدليل", zh: "证据字段" }),
      value: fields.slice(0, 2).join("; ") || tr({ en: "KPI and chart configuration", ar: "إعدادات المؤشرات والرسوم", zh: "KPI 与图表配置" }),
      variance: tableLabel(item?.table, tr),
      status: item?.mockData?.length ? tr({ en: "ready", ar: "جاهز", zh: "就绪" }) : tr({ en: "mock", ar: "محاكاة", zh: "mock" }),
    },
  ];
}

function tableLabel(table, tr) {
  return tr({ en: table?.titleEn || "configured detail table", zh: table?.titleZh || "配置明细表", ar: table?.titleAr || table?.titleEn || "جدول تفاصيل مهيأ" });
}

function OrchSmartResult({ item }) {
  const { tr } = useStore();
  if (!item) return null;
  const data = item.mockData?.[0] || {};
  const blocks = Array.isArray(item.answerBlocks) ? item.answerBlocks : [];
  const fields = Array.isArray(data.sampleFields) ? data.sampleFields : [];
  const evidence = Array.isArray(item.evidence) ? item.evidence : [];
  const table = item.table || {};
  const chart = item.chart || {};
  const columns = Array.isArray(table.columns) && table.columns.length ? table.columns : ["item", "value", "status"];
  const rows = smartTableRows(item, tr);
  return (<div className="orch-smart">
    <div className="orch-smart-head">
      <span>{tr({ en: "Smart query result", ar: "نتيجة الاستعلام الذكي", zh: "智能问数结果" })}</span>
      <b>{tr(smartQuerySourceLabel(data.sourceType))}</b>
    </div>
    <div className="orch-smart-grid">
      {blocks.map((block, i) => {
        const title = tr({ en: block.titleEn || block.type, zh: block.titleZh || block.type, ar: block.titleAr || block.titleEn || block.type });
        const body = block.type === "summary"
          ? tr({ en: `${tr(smartItemQuestion(item))} is answered from ${data.sampleBatch || data.dataset || "configured data"}.`, zh: `${tr(smartItemQuestion(item))} 已基于 ${data.sampleBatch || data.dataset || "配置数据"} 生成回答。`, ar: `${tr(smartItemQuestion(item))} تمت الإجابة بناءً على ${data.sampleBatch || data.dataset || "بيانات مهيأة"}.` })
          : block.type === "drivers"
          ? (fields.slice(0, 3).join("; ") || tr({ en: "KPI, chart and mock data bindings are used as drivers.", ar: "تُستخدم المؤشرات والرسوم وربط البيانات كمحركات.", zh: "以 KPI、图表和样例/mock 数据绑定作为驱动。" }))
          : (evidence[0]?.sampleBatch || friendlyEvidenceSource(evidence[0]?.source, tr) || data.sampleBatch || tr({ en: "Configured evidence", ar: "دليل مهيأ", zh: "配置证据" }));
        return (<div className="orch-smart-card" key={i}>
          <div className="osc-k">{title}</div>
          <div className="osc-v">{body}</div>
        </div>);
      })}
    </div>
    {table.enabled && <div className="orch-smart-table">
      <div className="ost-title">{tr({ en: table.titleEn || "Detail table", zh: table.titleZh || "明细表", ar: table.titleAr || table.titleEn || "Detail table" })}</div>
      <table><thead><tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{columns.map((col) => <td key={col}>{row[col] || ""}</td>)}</tr>)}</tbody></table>
    </div>}
    {chart.enabled && <div className="orch-smart-chart">
      <div className="ost-title">{tr({ en: chart.titleEn || "Chart linkage", zh: chart.titleZh || "图表联动", ar: chart.titleAr || chart.titleEn || "Chart linkage" })}</div>
      <div className="osc-bars">{fields.slice(0, 3).map((field, i) => <div className="osc-bar" key={field}><span>{field}</span><i style={{ width: `${86 - i * 18}%` }} /></div>)}</div>
    </div>}
    <div className="orch-smart-src">
      <b>{tr({ en: "Evidence", ar: "الدليل", zh: "证据" })}</b>
      <span>{data.sampleBatch || data.dataset || "DEMO_MOCK"}</span>
      {data.sourcePath && <small>{compactSmartSource(data.sourcePath)}</small>}
    </div>
  </div>);
}
/* ===== Business Plaza · per-BRD-group models (Ch.14 Use Cases) ===== */
const PZN = {
  uc01: { code: "UC-01", title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" }, agents: ["Orchestrator", "Data Querying", "Proactive Insights"] },
  uc02: { code: "UC-02", title: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, agents: ["Anomaly Detection", "Proactive Insights", "Orchestrator"] },
  uc03: { code: "UC-03", title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, agents: ["Data Querying", "Orchestrator", "Proactive Insights"] },
  uc04: { code: "UC-04", title: { en: "Forecasting Obligations & Needs", ar: "التنبؤ بالالتزامات والاحتياجات", zh: "预测未来义务与需求" }, agents: ["Financial Forecasting", "Rolling Forecasting", "Market Trends Detection"] },
  uc05: { code: "UC-05", title: { en: "Scenario Simulation & Alternatives", ar: "محاكاة السيناريوهات والبدائل", zh: "情景模拟与备选比较" }, agents: ["Scenario Simulation", "Financial Forecasting", "Proactive Insights"] },
  uc06: { code: "UC-06", title: { en: "Performance, Spend Analysis & Executive Reports", ar: "تحليل الأداء والإنفاق والتقارير التنفيذية", zh: "绩效、支出分析与执行报告" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"] },
  uc07: { code: "UC-07", title: { en: "Budget Planning, Ceilings Distribution & Fiscal Space", ar: "تخطيط الميزانية وتوزيع السقوف والحيّز المالي", zh: "预算规划、上限分配与财政空间" }, agents: ["Budget Optimization", "Scenario Simulation", "Rolling Forecasting"] },
  uc08: { code: "UC-08", title: { en: "Contracts, Claims, Disbursement & Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" }, agents: ["Anomaly Detection", "Orchestrator", "Compliance/Rules"] },
  uc09: { code: "UC-09", title: { en: "Financial Closing, Reconciliation & Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" }, agents: ["Financial Reports Gen.", "Compliance/Rules", "Anomaly Detection"] },
  uc10: { code: "UC-10", title: { en: "Reporting & Dashboards", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"] },
  uc11: { code: "UC-11", title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘" }, agents: ["Compliance/Rules", "Financial Reports Gen.", "Data Querying"] },
  uc12: { code: "UC-12", title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, agents: ["Data Querying", "Financial Reports Gen.", "Anomaly Detection"] },
  uc13: { code: "UC-13", title: { en: "Revenues, Collection & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" }, agents: ["Revenue Analytics", "Data Querying", "Proactive Insights"] },
  uc14: { code: "UC-14", title: { en: "Assets: Classification & Capitalization", ar: "الأصول: التصنيف والرسملة", zh: "资产:分类与资本化" }, agents: ["Data Querying", "Market Trends", "Compliance/Rules"] },
  uc17: { code: "UC-17", title: { en: "Automated Budget Execution Monitoring & Operational Reconciliation", ar: "المراقبة الآلية لتنفيذ الميزانية والتسوية التشغيلية", zh: "预算执行监控与运营对账自动化" }, agents: ["Orchestrator", "Data Querying", "Financial Reports Gen.", "Anomaly Detection", "Narrative Commentary", "Proactive Insights"] },
  uc15: { code: "UC-15", title: { en: "Key Cost Drivers", ar: "محرّكات التكلفة الرئيسية", zh: "关键成本驱动" }, agents: ["Scenario Simulation", "Budget Optimization", "Proactive Insights", "Market Trends Detection"] },
  uc16: { code: "UC-16", title: { en: "Housing Subsidy Impact Analysis (Financial & In-kind)", ar: "تحليل أثر دعم الإسكان (نقدي وعيني)", zh: "住房补贴影响分析(现金与实物)" }, agents: ["Scenario Simulation", "Budget Optimization", "Proactive Insights"] },
};
const PZ_OPEN = { uc02: "alerts", uc06: "perf", uc07: "plnbudget", uc15: "plncost", uc16: "plnhousing", uc04: "plnforecast", uc05: "plnscenario", uc10: "reports", uc11: "compmemo", uc12: "csfunds", uc17: "budexec17" };
function pzNode(id, lane, col, extra) { return Object.assign({ id: id, lane: lane, col: col, open: PZ_OPEN[id] }, PZN[id], extra || {}); }
const PZ_STATUS = {
  active: { label: { en: "Active", ar: "نشط", zh: "活跃" }, short: { en: "Active", ar: "نشط", zh: "活跃" } },
  available: { label: { en: "Available", ar: "متاح", zh: "可用" }, short: { en: "Available", ar: "متاح", zh: "可用" } },
  blocked: { label: { en: "Blocked", ar: "محجوب", zh: "阻断" }, short: { en: "Blocked", ar: "محجوب", zh: "阻断" } },
  unavailable: { label: { en: "Unavailable", ar: "غير متاح", zh: "不可用" }, short: { en: "Unavailable", ar: "غير متاح", zh: "不可用" } },
  running: { label: { en: "Running", ar: "قيد التشغيل", zh: "运行中" }, short: { en: "Running", ar: "قيد التشغيل", zh: "运行中" } },
  review: { label: { en: "Review Needed", ar: "تتطلب مراجعة", zh: "待复核" }, short: { en: "Review", ar: "مراجعة", zh: "复核" } },
};
function pzStatusMeta(key) { return PZ_STATUS[key] || PZ_STATUS.available; }
function pzStatusKey(n) { return n.status || "available"; }

/* G-06 — Revenue × Assets (reference, used by UC-13 / UC-14) */
const PLAZA_G06 = {
  top: { en: "REVENUE COLLECTION DEPARTMENT", ar: "إدارة التحصيل", zh: "收入征收部" },
  bot: { en: "ASSETS DEPARTMENT", ar: "إدارة الأصول", zh: "资产部" },
  title: { en: "Full flow — Revenue Collection × Assets (G-06)", ar: "المسار الكامل — التحصيل × الأصول (ج-06)", zh: "完整流程 — 收入征收 × 资产(G-06)" },
  nodes: PLAZA_UCS, intra: PLAZA_INTRA, cross: PLAZA_CROSS,
};

/* G-02 — Planning & Financial Performance (UC-04/05/06) */
const PLAZA_G02 = {
  top: { en: "PLANNING DEPARTMENT", ar: "إدارة التخطيط", zh: "规划部" },
  bot: { en: "FINANCIAL PERFORMANCE ANALYSIS DEPARTMENT", ar: "إدارة تحليل الأداء المالي", zh: "财务绩效分析部" },
  title: { en: "G-02 second-level departments — Planning × Financial Performance Analysis", ar: "إدارات ج-02 — التخطيط × تحليل الأداء المالي", zh: "G-02 二级部门 — 规划 × 财务绩效分析" },
  nodes: [
    pzNode("uc01", "rev", 0),
    pzNode("uc07", "rev", 1),
    pzNode("uc15", "rev", 2),
    pzNode("uc16", "rev", 3),
    pzNode("uc05", "rev", 4),
    pzNode("uc04", "ast", 0),
    pzNode("uc06", "ast", 1),
    pzNode("uc02", "ast", 2),
    pzNode("uc03", "ast", 3, { open: "g02query" }),
  ],
  intra: [],
  cross: [
    { from: "uc07", to: "uc04", label: { en: "Ceilings & fiscal space for forecasting", ar: "السقوف والحيّز المالي للتنبؤ", zh: "上限与财政空间 → 预测" } },
    { from: "uc07", to: "uc06", label: { en: "Ceilings & fiscal space for performance", ar: "السقوف والحيّز المالي للأداء", zh: "上限与财政空间 → 绩效" } },
    { from: "uc06", to: "uc07", label: { en: "Performance & spend feedback (next cycle)", ar: "تغذية الأداء والإنفاق (الدورة التالية)", zh: "绩效与支出反馈(下一周期)" } },
    { from: "uc15", to: "uc02", label: { en: "Cost estimates / subsidy impact", ar: "تقديرات التكلفة / أثر الدعم", zh: "成本估算 / 补贴影响" } },
    { from: "uc04", to: "uc05", label: { en: "Commitments & needs forecast", ar: "تنبؤ الالتزامات والاحتياجات", zh: "承诺与需求预测" } },
    { from: "uc05", to: "uc06", label: { en: "Approved scenario", ar: "السيناريو المعتمد", zh: "已批准情景" } },
    { from: "uc02", to: "uc16", label: { en: "Alerts & exceptions (broadcast to Planning)", ar: "تنبيهات واستثناءات (بثّ للتخطيط)", zh: "告警与例外(广播至规划)" } },
  ],
};

const PLAZA_G02_PLAN = {
  listMode: true,
  expandModel: PLAZA_G02,
  title: { en: "Planning Department · Business Plaza", ar: "إدارة التخطيط · ساحة الأعمال", zh: "规划部 · 业务广场" },
  nodes: [
    {
      ...PZN.uc01,
      id: "uc01",
      status: "available",
      contextDetail: true,
      openLabel: { en: "Context details", ar: "تفاصيل السياق", zh: "查看上下文" },
      desc: {
        en: "Shows whether the current planning-ready dataset is trustworthy enough to support fiscal-space, forecast, and scenario work.",
        ar: "يوضح ما إذا كانت نسخة البيانات الجاهزة للتخطيط موثوقة بما يكفي لدعم الحيّز المالي والتنبؤ والسيناريوهات.",
        zh: "说明当前规划就绪数据是否足以支撑财政空间、预测和情景分析。",
      },
    },
    {
      ...PZN.uc07,
      id: "uc07",
      open: "plnbudget",
      status: "active",
      desc: {
        en: "Builds the planning baseline, tracks ceiling pressure, and recommends reallocations within fiscal-space constraints.",
        ar: "يبني خط الأساس التخطيطي، ويراقب ضغط السقوف، ويقترح إعادة توزيع ضمن قيود الحيّز المالي.",
        zh: "形成规划基线，跟踪上限压力，并在财政空间约束内提出调剂建议。",
      },
      io: {
        en: "Outputs approved ceilings, planning baseline, and fiscal-space assumptions for downstream forecasting and performance tracking.",
        ar: "يُخرج السقوف المعتمدة وخط الأساس التخطيطي وافتراضات الحيّز المالي للتنبؤ ومتابعة الأداء.",
        zh: "输出已批准上限、规划基线和财政空间假设，供后续预测与绩效跟踪使用。",
      },
    },
    {
      ...PZN.uc15,
      id: "uc15",
      open: "plncost",
      status: "review",
      desc: {
        en: "Explains which project cost drivers are moving, how they compare with benchmarks, and how they affect affordability.",
        ar: "يوضح محرّكات تكلفة المشاريع المتغيرة، ومقارنتها بالمرجعيات، وأثرها على القدرة التمويلية.",
        zh: "解释项目成本驱动的变化、与基准的偏差，以及对预算可承受性的影响。",
      },
      blocker: { en: "Benchmark pack is waiting for analyst validation.", ar: "حزمة المقارنات بانتظار اعتماد المحلل.", zh: "基准包等待分析师校验。" },
    },
    {
      ...PZN.uc16,
      id: "uc16",
      open: "plnhousing",
      status: "available",
      desc: {
        en: "Compares cash, in-kind, and blended housing support options and highlights budget impact and sustainability.",
        ar: "يقارن بين الدعم النقدي والعيني والمختلط، ويبرز الأثر المالي والاستدامة.",
        zh: "对比现金、实物和混合住房支持模式，并突出预算影响与可持续性。",
      },
    },
    {
      ...PZN.uc04,
      id: "uc04",
      open: "plnforecast",
      status: "active",
      desc: {
        en: "Forecasts future obligations and funding pressure periods so planners can understand when the next fiscal gap appears.",
        ar: "يتنبأ بالالتزامات المستقبلية وفترات ضغط التمويل لفهم توقيت الفجوة المالية القادمة.",
        zh: "预测未来义务与资金压力期，帮助规划侧判断下一次财政缺口出现的时间。",
      },
    },
    {
      ...PZN.uc05,
      id: "uc05",
      open: "plnscenario",
      status: "review",
      desc: {
        en: "Compares candidate scenarios, explains trade-offs, and prepares a recommended option for human sign-off.",
        ar: "يقارن السيناريوهات المرشحة، ويشرح المفاضلات، ويجهز الخيار الموصى به للاعتماد البشري.",
        zh: "对比候选情景，解释权衡，并为人工签核准备推荐方案。",
      },
      blocker: { en: "Recommended scenario draft is ready for planning sign-off.", ar: "مسودة السيناريو الموصى جاهزة لاعتماد التخطيط.", zh: "推荐情景草案已准备好，等待规划签核。" },
    },
  ],
};

const PLAZA_G02_FPA = {
  listMode: true,
  expandModel: PLAZA_G02,
  title: { en: "Financial Performance Analysis Department · Business Plaza", ar: "إدارة تحليل الأداء المالي · ساحة الأعمال", zh: "财务绩效分析部 · 业务广场" },
  nodes: [
    {
      ...PZN.uc06,
      id: "uc06",
      status: "active",
      open: "perf",
      desc: {
        en: "Compares approved plan, rolling forecast, and actual execution to produce decision-ready performance views and leadership commentary.",
        ar: "يقارن الخطة المعتمدة والتنبؤ المتجدد والتنفيذ الفعلي لإنتاج عرض أداء جاهز للقرار وتعليق قيادي.",
        zh: "对比已批准计划、滚动预测与实际执行，形成可决策的绩效视图和管理层说明。",
      },
    },
    {
      ...PZN.uc02,
      id: "uc02",
      status: "running",
      open: "alerts",
      desc: {
        en: "Aggregates execution, forecast, and data-quality anomalies into one department-level alert and exception entry point.",
        ar: "يجمع شذوذات التنفيذ والتنبؤ وجودة البيانات في نقطة دخول موحدة للتنبيهات والاستثناءات على مستوى الإدارة.",
        zh: "将执行、预测和数据质量异常汇聚为部门级统一告警与例外入口。",
      },
      blocker: { en: "3 critical exceptions are still being investigated by monitoring agents.", ar: "هناك 3 استثناءات حرجة ما زالت قيد التحقيق من وكلاء المراقبة.", zh: "3 条严重异常仍在监控智能体处理中。" },
    },
  ],
};

const PLAZA_G03 = {
  top: { en: "BUDGET EXECUTION DEPARTMENT", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" },
  bot: { en: "DOWNSTREAM GOVERNANCE & REPORTING", ar: "الحوكمة والتقارير اللاحقة", zh: "下游治理与报告" },
  title: { en: "Budget execution flow — source, reconciliation, alerts, forecasting and reporting", ar: "مسار تنفيذ الميزانية — المصادر والمطابقة والتنبيهات والتنبؤ والتقارير", zh: "预算执行流程 — 来源、对账、预警、预测与报告" },
  nodes: [
    pzNode("uc01", "rev", 0),
    pzNode("uc17", "rev", 1),
    pzNode("uc02", "ast", 0, { open: "alerts" }),
    pzNode("uc04", "ast", 1, { open: "budexec-forecast" }),
    pzNode("uc07", "ast", 2, { open: "budexec-space", agents: ["Budget Optimization", "Scenario Simulation", "Rolling Forecasting"] }),
    pzNode("uc03", "ast", 3, { agents: ["Natural Language", "Query Interface", "Instant Insights"] }),
    pzNode("uc10", "ast", 4, { open: "budexec-reports", star: 1, agents: ["Structured Reports", "Dashboard Export", "Audit Trail"] }),
  ],
  intra: [["uc01", "uc17"], ["uc02", "uc04"], ["uc04", "uc07"], ["uc07", "uc03"], ["uc03", "uc10"]],
  cross: [
    { from: "uc17", to: "uc02", label: { en: "Reconciled execution data & variances for deviation detection", ar: "بيانات التنفيذ المسوّاة والانحرافات لكشف الانحرافات", zh: "对账后的执行数据与偏差 → 偏差检测" } },
  ],
};

const PLAZA_G04 = {
  top: { en: "FINANCIAL ENTITLEMENTS DEPARTMENT", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" },
  bot: { en: "AUDIT DEPARTMENT", ar: "إدارة التدقيق", zh: "审计部" },
  title: { en: "G-04 second-level departments — Entitlements × Audit", ar: "إدارات ج-04 — الاستحقاقات × التدقيق", zh: "G-04 二级部门 — 权益 × 审计" },
  nodes: [
    pzNode("uc01", "rev", 0),
    pzNode("uc08", "rev", 1, { open: "entclaims08" }),
    pzNode("uc09", "rev", 2, { open: "entclose09" }),
    pzNode("uc10", "rev", 3),
    pzNode("uc02", "ast", 1),
    pzNode("uc03", "ast", 3),
  ],
  intra: [],
  cross: [
    { from: "uc08", to: "uc02", label: { en: "Matching gaps & differences for monitoring", ar: "فجوات المطابقة والفروق للمراقبة", zh: "匹配缺口与差异 → 监控" } },
    { from: "uc09", to: "uc02", label: { en: "Reconciliation diffs & settlement exceptions", ar: "فروق المطابقة واستثناءات التسوية", zh: "对账差异与结算例外 → 监控" } },
    { from: "uc02", to: "uc08", label: { en: "Alerts, exception lists, suggested actions", ar: "تنبيهات وقوائم استثناءات وإجراءات مقترحة", zh: "告警、例外清单、建议措施 → 权益" } },
    { from: "uc03", to: "uc10", label: { en: "Cross-department queries & audit log / permissions", ar: "استعلامات بين الإدارات وسجل التدقيق / الصلاحيات", zh: "跨部门查询与审计日志 / 权限 → 报告" } },
  ],
};

const PLAZA_G05 = {
  lanes: [
    { key: "acct", label: { en: "ACCOUNTING DEPARTMENT", ar: "إدارة المحاسبة", zh: "会计部" }, cls: "rev" },
    { key: "comp", label: { en: "COMPLIANCE DEPARTMENT", ar: "إدارة الامتثال", zh: "合规部" }, cls: "ast" },
    { key: "cost", label: { en: "COST MANAGEMENT DEPARTMENT", ar: "إدارة التكاليف", zh: "成本管理部" }, cls: "c3" },
    { key: "rep", label: { en: "FINANCIAL REPORTING DEPARTMENT", ar: "إدارة التقارير المالية", zh: "财务报告部" }, cls: "c4" },
  ],
  title: { en: "G-05 second-level departments — Financial Reports directorate", ar: "إدارات ج-05 — التقارير المالية", zh: "G-05 二级部门 — 财务报告总局" },
  nodes: [
    pzNode("uc09", "acct", 2),
    pzNode("uc11", "comp", 1),
    pzNode("uc02", "comp", 4),
    pzNode("uc12", "cost", 1),
    pzNode("uc14", "cost", 2),
    pzNode("uc01", "rep", 0),
    pzNode("uc10", "rep", 3),
    pzNode("uc03", "rep", 4),
  ],
  intra: [],
  cross: [
    { from: "uc09", to: "uc11", label: { en: "Reconciliation diffs & settlements", ar: "فروق المطابقة والتسويات", zh: "对账差异与结算" } },
    { from: "uc11", to: "uc12", label: { en: "Compliant treatment & policy refs", ar: "المعالجة المتوافقة ومراجع السياسات", zh: "合规处理与政策依据" } },
    { from: "uc11", to: "uc14", label: { en: "Compliant treatment & policy refs", ar: "المعالجة المتوافقة ومراجع السياسات", zh: "合规处理与政策依据" } },
    { from: "uc12", to: "uc10", label: { en: "Cost / fund data", ar: "بيانات التكاليف / الصناديق", zh: "成本 / 资金数据" } },
    { from: "uc14", to: "uc10", label: { en: "Asset cost & capitalization", ar: "تكلفة الأصول والرسملة", zh: "资产成本与资本化" } },
    { from: "uc10", to: "uc02", label: { en: "Reports for monitoring", ar: "تقارير للمراقبة", zh: "报告 → 监控" } },
    { from: "uc10", to: "uc03", label: { en: "Reports for query / audit", ar: "تقارير للاستعلام / التدقيق", zh: "报告 → 查询 / 审计" } },
  ],
};

/* Oversight (Audit) — common control layer (G-01) monitoring all groups */
const PLAZA_AUDIT = {
  top: { en: "COMMON CONTROL LAYER (G-01)", ar: "طبقة الرقابة المشتركة (ج-01)", zh: "共同控制层(G-01)" },
  bot: { en: "MONITORED USE CASES (all groups)", ar: "حالات مراقَبة (كل المجموعات)", zh: "受监督用例(各组)" },
  title: { en: "Oversight flow — Audit across all groups", ar: "مسار الرقابة — التدقيق عبر كل المجموعات", zh: "监督流程 — 审计贯穿各组" },
  nodes: [
    pzNode("uc01", "rev", 0), pzNode("uc02", "rev", 2), pzNode("uc03", "rev", 3, { star: 1 }),
    pzNode("uc08", "ast", 0), pzNode("uc09", "ast", 1), pzNode("uc12", "ast", 2), pzNode("uc13", "ast", 3),
  ],
  intra: [["uc01", "uc02"], ["uc02", "uc03"]],
  cross: [
    { from: "uc08", to: "uc02", label: { en: "Claims discrepancies", ar: "فروق المطالبات", zh: "索赔差异" } },
    { from: "uc09", to: "uc02", label: { en: "Reconciliation differences", ar: "فروق المطابقة", zh: "对账差异" } },
    { from: "uc12", to: "uc02", label: { en: "Idle surplus & missing certificates", ar: "فائض خامل وشهادات مفقودة", zh: "闲置结余与缺证" } },
    { from: "uc13", to: "uc02", label: { en: "Collection & exclusion anomalies", ar: "شذوذ التحصيل والاستبعاد", zh: "征收与排除异常" } },
  ],
};

/* ===== Storyline · downstream evolution (per BRD group) ===== */
const FLOW_FPA = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-07", label: { en: "Budget planning & fiscal space", ar: "تخطيط الميزانية والحيّز المالي", zh: "预算规划与财政空间" }, cls: "in" },
  { code: "UC-04", label: { en: "Forecasting", ar: "التنبؤ", zh: "财务预测" }, cls: "in" },
  { code: "UC-05", label: { en: "Scenario simulation", ar: "محاكاة السيناريوهات", zh: "情景模拟" }, cls: "in" },
  { code: "UC-06", label: { en: "Performance & reports", ar: "الأداء والتقارير", zh: "绩效与报告" }, cls: "focus", star: true },
];
const FLOW_PLAN = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-07", label: { en: "Budget planning & fiscal space", ar: "تخطيط الميزانية والحيّز المالي", zh: "预算规划与财政空间" }, cls: "focus", star: true },
  { code: "UC-04", label: { en: "Forecasting", ar: "التنبؤ", zh: "财务预测" }, cls: "down" },
  { code: "UC-05", label: { en: "Scenario simulation", ar: "محاكاة السيناريوهات", zh: "情景模拟" }, cls: "down" },
  { code: "UC-06", label: { en: "Performance & reports", ar: "الأداء والتقارير", zh: "绩效与报告" }, cls: "down" },
];
const FLOW_BUD = [
  { code: "UC-01", label: { en: "Data unification", ar: "توحيد البيانات", zh: "数据统一" }, cls: "in" },
  { code: "UC-17", label: { en: "Budget execution tracking", ar: "تتبّع تنفيذ الميزانية", zh: "预算执行跟踪" }, cls: "focus", star: true },
  { code: "UC-02", label: { en: "Deviation detection", ar: "كشف الانحرافات", zh: "偏差检测" }, cls: "down" },
  { code: "UC-04", label: { en: "Forecasting", ar: "التنبؤ", zh: "财务预测" }, cls: "down" },
  { code: "UC-07", label: { en: "Budget planning", ar: "تخطيط الميزانية", zh: "预算规划" }, cls: "down" },
  { code: "UC-03", label: { en: "Smart query", ar: "الاستعلام الذكي", zh: "智能查询" }, cls: "down" },
  { code: "UC-10", label: { en: "Reports", ar: "التقارير", zh: "报告" }, cls: "down" },
]
const FLOW_ENT = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-08", label: { en: "Claims & entitlements", ar: "المطالبات والاستحقاقات", zh: "索赔与权益" }, cls: "focus", star: true },
  { code: "UC-02", label: { en: "Anomaly detection & alerts", ar: "كشف الانحرافات والتنبيهات", zh: "异常检测与告警" }, cls: "down" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "down" },
  { code: "UC-10", label: { en: "Periodic reports", ar: "تقارير دورية", zh: "周期报告" }, cls: "down" },
  { code: "UC-03", label: { en: "Smart query & audit", ar: "الاستعلام والتدقيق", zh: "智能查询与审计" }, cls: "down" },
];
const FLOW_AUD = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-08", label: { en: "Claims & entitlements", ar: "المطالبات والاستحقاقات", zh: "索赔与权益" }, cls: "in" },
  { code: "UC-02", label: { en: "Anomaly detection & alerts", ar: "كشف الانحرافات والتنبيهات", zh: "异常检测与告警" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-10", label: { en: "Periodic reports", ar: "تقارير دورية", zh: "周期报告" }, cls: "in" },
  { code: "UC-03", label: { en: "Smart query & audit", ar: "الاستعلام والتدقيق", zh: "智能查询与审计" }, cls: "focus", star: true },
];
const FLOW_ACCT = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "focus", star: true },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "down" },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "down" },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "down" },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];

function BusinessPlaza({ model, defaultSel }) {
  const M = model || PLAZA_G06;
  const { tr, setRoute, setPerfJump, setBackRoute, setAlertsOpen, route, group02 } = useStore();
  const plazaWrapRef = useRef(null);
  const [plazaBox, setPlazaBox] = useState({ w: 0, h: 0 });
  const [plazaSel, setPlazaSel] = useState(defaultSel || null);
  const [plazaModal, setPlazaModal] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  useEffect(() => {
    const el = plazaWrapRef.current; if (!el || typeof ResizeObserver === "undefined") return;
    const calc = () => setPlazaBox({ w: el.clientWidth, h: el.clientHeight });
    calc(); const ro = new ResizeObserver(calc); ro.observe(el); return () => ro.disconnect();
  }, []);
  const PZ = { W: 720, H: 400, NW: 130, NH: 88, colX: [8, 152, 296, 440, 584] };
  const pzById = {}; M.nodes.forEach(n => { pzById[n.id] = n; });
  const expandModel = M.expandModel || M;
  const laneCls = (n, sourceModel = M) => sourceModel.lanes ? ((sourceModel.lanes.find(l => l.key === n.lane) || {}).cls || "rev") : n.lane;
  const ovH = M.lanes ? (30 + M.lanes.length * 132 + 18) : PZ.H;
  const fullH = M.lanes ? (42 + M.lanes.length * 152 + 18) : 536;
  const pzOpen = (n) => {
    if (n.contextDetail) { setReadinessOpen(true); return; }
    if (!n.open) return;
    if (n.open === "perf") { setPerfJump({ tab: "dash" }); setBackRoute(route); setRoute("perf"); return; }
    if (n.open === "report") { setPerfJump({ tab: "params" }); setBackRoute(route); setRoute("rcreports"); return; }
    const targetRoute = { alerts: "alerts", rcbench: "rcbench", asbench: "asbench", csfunds: "csfunds", compmemo: "compmemo", reports: "reports", budexec17: "budexec17", plnbudget: "plnbudget", plncost: "plncost", plnhousing: "plnhousing", plnforecast: "plnforecast", plnscenario: "plnscenario", g02query: "g02query", entclaims08: "entclaims08", entclose09: "entclose09", "budexec-forecast": "budexec-forecast", "budexec-space": "budexec-space", "budexec-reports": "budexec-reports" }[n.open];
    if (targetRoute) { setBackRoute(route); setRoute(targetRoute); }
  };
  const renderListPlaza = () => (
    <div className="pz-list">
      {M.nodes.map((n) => {
        const sel = plazaSel === n.id;
        const canOpen = !!n.open || !!n.contextDetail;
        const statusKey = pzStatusKey(n);
        const statusMeta = pzStatusMeta(statusKey);
        return (
          <div
            key={n.id}
            className={"pz-row " + (sel ? "on " : "") + (canOpen ? "linked " : "pending ") + (n.lane || "rev")}
            onClick={() => setPlazaSel(sel ? null : n.id)}
          >
            <div className="pz-row-main">
              <div className="pz-row-top">
                <div className="pz-row-titlebox">
                  <span className={"pz-row-code " + (n.lane || "rev")}>{tr(statusMeta.short)}</span>
                  <b className="pz-row-title">{tr(n.title)}</b>
                </div>
                <span className={"pz-pill " + statusKey}>{tr(statusMeta.label)}</span>
              </div>
              <div className="pz-row-agents">{n.agents.join(" · ")}</div>
              {sel && (
                <div className="pz-row-expand">
                  <p className="pz-row-desc">{tr(n.desc || { en: "Business entry for this use case.", ar: "مدخل أعمال لهذه الحالة.", zh: "该用例的业务入口。" })}</p>
                  {n.blocker && <p className="pz-row-note"><b>{tr({ en: "Current note", ar: "الملاحظة الحالية", zh: "当前提示" })}:</b> {tr(n.blocker)}</p>}
                  {n.unlock && <p className="pz-row-note"><b>{tr({ en: "Unlock by", ar: "طريقة الفتح", zh: "解除方式" })}:</b> {tr(n.unlock)}</p>}
                  <div className="pz-row-meta">
                    <span className="pz-chiplabel">{tr({ en: "Agents", ar: "الوكلاء", zh: "智能体" })}</span>
                    <div>{n.agents.map((a, i) => <span className="pz-chip" key={i}>{a}</span>)}</div>
                  </div>
                  <div className="pz-row-actions">
                    <button className="btn sm" disabled={!canOpen} onClick={(ev) => { ev.stopPropagation(); if (canOpen) pzOpen(n); }}>
                      {tr(n.contextDetail ? { en: "View details", ar: "عرض التفاصيل", zh: "查看详情" } : canOpen ? { en: "Open page", ar: "فتح الصفحة", zh: "打开页面" } : (n.openLabel || { en: "Page pending", ar: "الصفحة لاحقاً", zh: "页面待接入" }))} {canOpen && !n.contextDetail ? "↗" : ""}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
  const ovScale = (plazaBox.w || 480) / PZ.W;
  const dScale = Math.min(1.12, ((typeof window !== "undefined" ? Math.min(840, window.innerWidth * 0.94) : 800) - 44) / PZ.W);
  const renderPlaza = (full, scale, sel, sourceModel = M) => {
    const modelRef = sourceModel;
    const mid = full ? "pzarF" : "pzar";
    if (modelRef.lanes) {
      const LN = modelRef.lanes, idx = {}; LN.forEach((l, i) => idx[l.key] = i);
      const stride = full ? 152 : 132;
      const pad = full ? 42 : 30;
      const Hn = full ? fullH : ovH;
      const pzByIdLocal = {};
      modelRef.nodes.forEach(n => { pzByIdLocal[n.id] = n; });
      const ntop = (id) => pad + idx[pzByIdLocal[id].lane] * stride + 26;
      const nbot = (id) => ntop(id) + PZ.NH;
      const ncx = (id) => PZ.colX[pzByIdLocal[id].col] + PZ.NW / 2;
      const ncross = (e, i) => {
        const ai = idx[pzByIdLocal[e.from].lane], bi = idx[pzByIdLocal[e.to].lane];
        const sx = ncx(e.from), sy = ai <= bi ? nbot(e.from) : ntop(e.from);
        const tx = ncx(e.to), ty = ai <= bi ? ntop(e.to) : nbot(e.to);
        const my = (sy + ty) / 2 + ((i % 3) - 1) * 9;
        return { d: `M${sx},${sy} L${sx},${my} L${tx},${my} L${tx},${ty}`, lx: Math.min(sx, tx) + Math.abs(tx - sx) / 2, ly: my };
      };
      return (<div className="pz-canvas" style={{ width: PZ.W, height: Hn, transform: "scale(" + scale + ")" }}>
        <svg className="pz-links" width={PZ.W} height={Hn} viewBox={"0 0 " + PZ.W + " " + Hn} fill="none">
          <defs><marker id={mid} viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="7" refY="5" orient="auto-start-reverse"><path d="M2,1 L8,5 L2,9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" /></marker></defs>
          {LN.map((l, i) => <rect key={"b" + i} x="2" y={pad + i * stride} width="716" height={stride - 14} rx="13" fill={i % 2 ? "#f7f3fc" : "#f3f6fd"} />)}
          {LN.map((l, i) => <text key={"t" + i} x="14" y={pad + i * stride + 18} className={"pz-lane " + l.cls}>{tr(l.label)}</text>)}
          {modelRef.cross.map((e, i) => { if (!(full || (sel && (e.from === sel || e.to === sel)))) return null; const q = ncross(e, i); return <path key={"c" + i} d={q.d} stroke="#e0524a" strokeWidth="1.6" strokeDasharray="5 4" fill="none" markerEnd={`url(#${mid})`} />; })}
        </svg>
        {modelRef.nodes.map(n => (
          <div key={n.id} className={"pz-node " + laneCls(n, modelRef) + (sel === n.id ? " on" : "") + (n.open ? " linked" : " ctx")} style={{ left: PZ.colX[n.col], top: ntop(n.id), width: PZ.NW, height: PZ.NH }} onClick={full ? undefined : (ev) => { ev.stopPropagation(); setPlazaSel(n.id); }}>
            <div className="pz-code">{n.star ? <span className="pz-star">★</span> : null}{n.open ? null : <span className="pz-ctxtag">{tr({ en: "context", ar: "سياق", zh: "上下文" })}</span>}</div>
            <div className="pz-ttl">{tr(n.title)}</div>
            <div className="pz-ag">{full ? n.agents.join(" · ") : n.agents.length + " agents"}</div>
            {!full && n.open && <button className="pz-go" title={tr({ en: "Open page (one-click)", ar: "فتح الصفحة", zh: "一键打开页面" })} onClick={(ev) => { ev.stopPropagation(); pzOpen(n); }}>↗</button>}
          </div>))}
        {full && modelRef.cross.map((e, i) => { const q = ncross(e, i); return <div key={"l" + i} className="pz-elab" style={{ left: q.lx - 100, top: q.ly - 15 }}>{tr(e.label)}</div>; })}
      </div>);
    }
    const astTop = full ? 424 : 280;
    const H = full ? 536 : PZ.H;
    const top = (id) => pzById[id].lane === "rev" ? 62 : astTop;
    const bot = (id) => top(id) + PZ.NH;
    const cy = (id) => top(id) + PZ.NH / 2;
    const cx = (id) => PZ.colX[pzById[id].col] + PZ.NW / 2;
    const cross = (e, i) => {
      const sx = cx(e.from), sy = pzById[e.from].lane === "rev" ? bot(e.from) : top(e.from);
      const tx = cx(e.to), ty = pzById[e.to].lane === "rev" ? bot(e.to) : top(e.to);
      const my = full ? (158 + i * 44) : (215 + (i - 2.5) * 12);
      return { d: `M${sx},${sy} L${sx},${my} L${tx},${my} L${tx},${ty}`, lx: Math.min(sx, tx) + Math.abs(tx - sx) / 2, ly: my };
    };
    return (<div className="pz-canvas" style={{ width: PZ.W, height: H, transform: "scale(" + scale + ")" }}>
      <svg className="pz-links" width={PZ.W} height={H} viewBox={"0 0 " + PZ.W + " " + H} fill="none">
        <defs><marker id={mid} viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="7" refY="5" orient="auto-start-reverse"><path d="M2,1 L8,5 L2,9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" /></marker></defs>
        <rect x="2" y="34" width="716" height="140" rx="14" fill="#f3f6fd" />
        <rect x="2" y={astTop - 30} width="716" height="132" rx="14" fill="#f7f3fc" />
        <text x="14" y="51" className="pz-lane rev">{tr(M.top)}</text>
        <text x="14" y={astTop - 12} className="pz-lane ast">{tr(M.bot)}</text>
        {modelRef.intra.map(([a, b], i) => { const y = cy(a); const x1 = PZ.colX[pzById[a].col] + PZ.NW, x2 = PZ.colX[pzById[b].col]; const c = pzById[a].lane === "rev" ? "#1f3a8a" : "#5b3a9e"; return <path key={i} d={`M${x1},${y} L${x2 - 3},${y}`} stroke={c} strokeWidth="2" fill="none" markerEnd={`url(#${mid})`} opacity={0.85} />; })}
        {modelRef.cross.map((e, i) => { if (!(full || (sel && (e.from === sel || e.to === sel)))) return null; const p = cross(e, i); return <path key={"c" + i} d={p.d} stroke="#e0524a" strokeWidth="1.7" strokeDasharray="5 4" fill="none" markerEnd={`url(#${mid})`} />; })}
      </svg>
      {modelRef.nodes.map(n => { return (
        <div key={n.id} className={"pz-node " + n.lane + (sel === n.id ? " on" : "") + (n.open ? " linked" : " ctx")} style={{ left: PZ.colX[n.col], top: top(n.id), width: PZ.NW, height: PZ.NH }} onClick={full ? undefined : (ev) => { ev.stopPropagation(); setPlazaSel(n.id); }}>
          <div className="pz-code">{n.star ? <span className="pz-star">★</span> : null}{n.open ? null : <span className="pz-ctxtag">{tr({ en: "context", ar: "سياق", zh: "上下文" })}</span>}</div>
          <div className="pz-ttl">{tr(n.title)}</div>
          <div className="pz-ag">{full ? n.agents.join(" · ") : n.agents.length + " agents"}</div>
          {!full && n.open && <button className="pz-go" title={tr({ en: "Open page (one-click)", ar: "فتح الصفحة", zh: "一键打开页面" })} onClick={(ev) => { ev.stopPropagation(); pzOpen(n); }}>↗</button>}
        </div>); })}
      {full && modelRef.cross.map((e, i) => { const p = cross(e, i); return <div key={"l" + i} className="pz-elab" style={{ left: p.lx - 100, top: p.ly - 15 }}>{tr(e.label)}</div>; })}
    </div>);
  };
  return (<React.Fragment>
    <div className="ws-plaza">
      <div className="plaza-head">
        <div><h2 style={{ fontSize: 16 }}>{tr({ en: "Business Plaza", ar: "ساحة الأعمال", zh: "业务广场" })}</h2><div className="sub muted">{tr({ en: "Select a feature to inspect its context · ↗ opens the mapped page · some entries stay as context only", ar: "اختر وظيفة لعرض سياقها · ↗ يفتح الصفحة المرتبطة · بعض العناصر تبقى للسياق فقط", zh: "选择功能查看上下文 · ↗ 打开对应页面 · 部分条目仅作上下文展示" })}</div></div>
        <div className="pz-tools"><button className="btn sm pz-expand" onClick={() => setPlazaModal(true)}>{tr({ en: "Expand", ar: "توسيع", zh: "展开" })} ↗</button></div>
      </div>
      {M.listMode
        ? renderListPlaza()
        : <div className="ws-flowwrap pz-wrap" ref={plazaWrapRef} style={{ height: Math.ceil(ovH * ovScale) }}>
            {renderPlaza(false, ovScale, plazaSel)}
          </div>}
      {!M.listMode && (() => { const cur = plazaSel || defaultSel; const n = pzById[cur]; if (!n) return null; const ios = M.cross.filter(e => e.from === cur || e.to === cur).map(e => ({ out: e.from === cur, code: pzById[e.from === cur ? e.to : e.from].code, label: e.label }));
        return (<div className="pz-detail">
          <div className="pz-dhead">{n.star ? <span className="pz-dstar">★</span> : null}<b>{tr(n.title)}</b>{n.open ? <button className="btn sm pz-openb" onClick={() => pzOpen(n)}>{tr({ en: "Open page", ar: "فتح الصفحة", zh: "一键打开页面" })} ↗</button> : <span className="pz-ctxonly">{tr({ en: "Context only · no dedicated page", ar: "للسياق فقط · لا صفحة مخصّصة", zh: "仅上下文 · 无独立页面" })}</span>}</div>
          <div className="pz-drow">
            <div className="pz-dcol"><div className="pz-dlab">{tr({ en: "Agents", ar: "الوكلاء", zh: "智能体" })}</div><div>{n.agents.map((a, i) => <span className="pz-chip" key={i}>{a}</span>)}</div></div>
            <div className="pz-dcol"><div className="pz-dlab">{tr({ en: "Cross-department I/O", ar: "التبادل بين الإدارات", zh: "跨部门 I/O" })}</div>{ios.length ? ios.map((x, i) => <p className="pz-io" key={i}>{x.out ? "→ " : "← "}{tr(x.label)}</p>) : <p className="pz-io muted">{tr({ en: "No cross-department links", ar: "لا روابط بين الإدارات", zh: "无跨部门连接" })}</p>}</div>
          </div>
        </div>); })()}
    </div>
    {plazaModal && createPortal(<div className="al-overlay" onClick={() => setPlazaModal(false)}>
      <div className="pz-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="pz-mhead"><b>{tr(expandModel.title)}</b><button className="pz-x" onClick={() => setPlazaModal(false)}>✕</button></div>
        <div className="pz-mscroll"><div className="pz-mcanvas" style={{ width: PZ.W * dScale, height: fullH * dScale }}>{renderPlaza(true, dScale, null, expandModel)}</div></div>
        <div className="pz-legend">{(expandModel.lanes ? expandModel.lanes : [{label:expandModel.top,cls:"rev"},{label:expandModel.bot,cls:"ast"}]).map((l, i) => <span key={i}><i className={"ln " + (l.cls||"rev")} />{tr(l.label)}</span>)}<span><i className="ln cross" />{tr({ en: "Cross-department I/O", ar: "التبادل بين الإدارات", zh: "跨部门 I/O" })}</span><span>★ {tr({ en: "convergence / focus", ar: "تقارب / تركيز", zh: "汇聚 / 焦点" })}</span><span className="pz-lgo">↗ {tr({ en: "opens its page", ar: "يفتح صفحتها", zh: "一键打开页面" })}</span></div>
      </div>
    </div>, document.body)}
    {readinessOpen && <DataReadinessDrawer tr={tr} state={group02} onClose={() => setReadinessOpen(false)} onAlerts={() => setAlertsOpen(true)} />}
  </React.Fragment>);
}


function RcWorkspace() {
  const { t, tr, setRoute, pushLog, lang } = useStore();
  const DEFAULT_PROMPT = { en: "Analyze billing gap for Q3 across all BU, flag overdue contracts > 60 days, and draft a collection note for executive review.", ar: "حلّل فجوة الفوترة للربع الثالث عبر كل الوحدات، وحدّد العقود المتأخرة > 60 يوماً، وصُغ مذكرة تحصيل للمراجعة التنفيذية.", zh: "分析第三季度各业务单元的开票缺口,标记逾期 > 60 天的合同,并起草供高管复核的征收说明。" };
  const smartQueryConfig = useMemo(() => getSmartQueryFabConfig("rcwork", null, []), []);
  const smartItems = smartQueryConfig.items || [];
  const [phase, setPhase] = useState("idle");            // idle | running | review | approved | returned
  const [prompt, setPrompt] = useState(tr(DEFAULT_PROMPT));
  const [sent, setSent] = useState(null);
  const [queuedSmartItem, setQueuedSmartItem] = useState(null);
  const [activeSmartItem, setActiveSmartItem] = useState(null);
  const [tl, setTl] = useState(["queued", "queued", "queued", "queued"]);
  const [thk, setThk] = useState(["queued", "queued", "queued", "queued"]);
  const [stage, setStage] = useState("idle"); // idle | think | timeline | result
  const [showDiff, setShowDiff] = useState(false);
  const timersRef = useRef([]);
  const bodyRef = useRef(null);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => { if (phase === "idle") setPrompt(tr(DEFAULT_PROMPT)); }, [lang]);   // keep default localized until edited
  useEffect(() => () => clearTimers(), []);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [tl, thk, phase, sent, showDiff, activeSmartItem]);   // auto-scroll chat
  const THINK_STEPS = [
    { en: "Interpreting intent", ar: "تفسير القصد", zh: "解析意图" },
    { en: "Checking permission scope", ar: "التحقق من نطاق الصلاحيات", zh: "检查权限范围" },
    { en: "Selecting agents", ar: "اختيار الوكلاء", zh: "选择智能体" },
    { en: "Planning subtasks", ar: "تخطيط المهام الفرعية", zh: "规划子任务" },
  ];
  const PH = {
    idle: { t: { en: "ready", ar: "جاهز", zh: "就绪" }, c: "var(--muted)" },
    running: { t: { en: "running", ar: "يعمل", zh: "运行中" }, c: "var(--info)" },
    review: { t: { en: "awaiting review", ar: "بانتظار المراجعة", zh: "待审批" }, c: "var(--amber)" },
    approved: { t: { en: "completed", ar: "اكتمل", zh: "已完成" }, c: "var(--green-dark)" },
    returned: { t: { en: "returned", ar: "أُعيد", zh: "已退回" }, c: "var(--danger)" },
  };
  const runOrch = () => {
    if (phase === "running" || !prompt.trim()) return;
    const matchedSmartItem = queuedSmartItem || findSmartItemForPrompt(null, prompt, smartItems) || null;
    clearTimers(); setShowDiff(false); setSent(prompt.trim()); setPhase("running"); setStage("think");
    setActiveSmartItem(matchedSmartItem);
    setThk(["think", "queued", "queued", "queued"]);
    setTl(["queued", "queued", "queued", "queued"]);
    pushLog(orchCfg.startLog);
    // 1) thinking process
    [[450, ["done", "think", "queued", "queued"]], [900, ["done", "done", "think", "queued"]], [1350, ["done", "done", "done", "think"]], [1750, ["done", "done", "done", "done"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setThk(p[1]), p[0])));
    // 2) agent timeline (after thinking)
    timersRef.current.push(setTimeout(() => { setStage("timeline"); setTl(["think", "queued", "queued", "queued"]); }, 1800));
    [[2500, ["done", "think", "queued", "queued"]], [3300, ["done", "done", "think", "queued"]], [4200, ["done", "done", "done", "think"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setTl(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setPhase("review"); pushLog(orchCfg.reviewLog); }, 4900));
  };
  const approve = () => {
    if (phase === "approved") return; clearTimers(); setPhase("approved"); setStage("result"); setTl(["done", "done", "done", "done"]);
    pushLog(orchCfg.approveLog);
  };
  const returnFix = () => {
    clearTimers(); setShowDiff(false); setPhase("returned"); setStage("result"); setTl(["done", "done", "done", "queued"]);
    pushLog(orchCfg.returnLog);
  };
  const tlMeta = [
    { code: "UC-01", t: { en: "pull unified dataset", ar: "سحب البيانات الموحّدة", zh: "拉取统一数据集" }, s: { en: "28,140 records reconciled · 0.8s", ar: "28,140 سجلاً · 0.8 ث", zh: "对账 28,140 条 · 0.8s" } },
    { code: "UC-13", t: { en: "detect billing gap", ar: "كشف فجوة الفوترة", zh: "检测开票缺口" }, s: { en: "SAR 12.4M gap · 14 corrections proposed", ar: "فجوة 12.4M · 14 تصحيحاً", zh: "缺口 12.4M · 提议 14 项更正" } },
    { code: "UC-13", t: { en: "score overdue risk", ar: "تقييم مخاطر التأخر", zh: "评估逾期风险" }, s: { en: "scanning 42 overdue contracts · ETA 6s", ar: "فحص 42 عقداً متأخراً · 6 ث", zh: "扫描 42 个逾期合同 · 约 6s" } },
    { code: "UC-06", t: { en: "draft executive note", ar: "صياغة المذكرة التنفيذية", zh: "起草执行说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
  ];
  const orchCfg = applyOrchestratorConfig("rcwork", {
    uc: "UC-13",
    run: "#2041",
    agent: { en: "Revenue Collection agent", ar: "وكيل التحصيل", zh: "收入征收智能体" },
    chips: ["scope: Q3/2026", "dept: RC only", "policy: BRD WL"],
    defaultPrompt: DEFAULT_PROMPT,
    startLog: { en: "Orchestrator started — analyzing billing gap & overdue risk (Q3, all BU)", ar: "بدأ المنسّق — تحليل فجوة الفوترة ومخاطر التأخر (الربع الثالث، كل الوحدات)", zh: "编排器已启动——分析开票缺口与逾期风险(Q3,全部业务单元)" },
    reviewLog: { en: "Draft ready — 14 corrections await human approval", ar: "المسودة جاهزة — 14 تصحيحاً بانتظار الاعتماد", zh: "草稿就绪——14 项更正等待人工审批" },
    approveLog: { en: "Finance Lead approved 14 corrections; executive note generated", ar: "اعتمد قائد المالية 14 تصحيحاً؛ وأُنشئت المذكرة التنفيذية", zh: "财务负责人批准 14 项更正;已生成执行说明" },
    returnLog: { en: "14 corrections returned to the Revenue agent for rework", ar: "أُعيدت 14 تصحيحاً لوكيل الإيرادات لإعادة المعالجة", zh: "14 项更正已退回收入智能体重新处理" },
    prompts: RC_PROMPTS,
    tlMeta,
    reviewBody: { en: "14 billing corrections require finance approval before the executive note is generated.", ar: "تتطلب 14 تصحيحاً اعتماد المالية قبل إنشاء المذكرة التنفيذية.", zh: "14 项开票更正需财务批准后方可生成执行说明。" },
    approveLabel: { en: "Approve corrections", ar: "اعتماد التصحيحات", zh: "批准更正" },
    approvedChip: { en: "Approved · executive note generated", ar: "معتمد · أُنشئت المذكرة", zh: "已批准 · 已生成执行说明" },
    diff: [
      { k: "rem", t: { en: "BU-12 · INV-4471 — SAR 0 (unbilled)", ar: "BU-12 · INV-4471 — صفر ريال (غير مفوتر)", zh: "BU-12 · INV-4471 — SAR 0(未开票)" } },
      { k: "add", t: { en: "BU-12 · INV-4471 — SAR 1.86M (corrected)", ar: "BU-12 · INV-4471 — 1.86 مليون ريال (مصحّح)", zh: "BU-12 · INV-4471 — SAR 1.86M(已更正)" } },
      { k: "rem", t: { en: "overdue flag · none", ar: "علم التأخر · لا شيء", zh: "逾期标记 · 无" } },
      { k: "add", t: { en: "overdue flag · 42 contracts > 60d", ar: "علم التأخر · 42 عقداً > 60 يوماً", zh: "逾期标记 · 42 个合同 > 60 天" } },
    ],
    returnBody: { en: "Corrections sent back to the Revenue agent. Edit the prompt and run again.", ar: "أُعيدت التصحيحات لوكيل الإيرادات. عدّل الطلب وأعد التشغيل.", zh: "更正已退回收入智能体。请修改提示后重新运行。" },
    nextActions: NEXT_ACTIONS_RC,
  });
  useEffect(() => { if (phase === "idle") setPrompt(tr(orchCfg.defaultPrompt)); }, [lang, phase]);
  const choosePrompt = (p) => {
    const title = tr(p.t);
    const subtitle = tr(p.s);
    const matchedSmartItem = findSmartItemForPrompt(p, title, smartItems);
    setQueuedSmartItem(matchedSmartItem);
    setPrompt(subtitle && !sameSmartQuestion(title, subtitle) ? `${title} · ${subtitle}` : title);
  };
  const activeNextActions = smartActionsToOrchNext(activeSmartItem?.nextActions, orchCfg.nextActions);
  return (<div className="fade"><div className="card pad ws-frame">
    <div className="ws-head">
      <SmartQueryFab route="rcwork" scope={{ en: "Scope: Revenue Collection · read-only", ar: "النطاق: التحصيل · للقراءة", zh: "范围:收入征收 · 只读" }} prompts={[{ en: "Where is today's billing gap?", ar: "أين فجوة الفوترة اليوم؟", zh: "今天的开票缺口在哪里?" }, { en: "Which contracts drive most of the overdue?", ar: "ما العقود التي تقود معظم التأخر؟", zh: "哪些合同造成大部分逾期?" }, { en: "Draft a collection note for review", ar: "صياغة مذكرة تحصيل", zh: "起草供复核的征收说明" }]} />
      <div className="ws-htext"><h1 style={{ fontSize: 22 }}>{tr({ en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" })}</h1>
        <div className="sub muted">{tr({ en: "Mandate: billing, collections & exclusions (UC-13). Workspace — operating type: KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: الفوترة والتحصيل والاستبعادات (UC-13). مساحة العمل — نوع تشغيلي: مؤشرات + ساحة الأعمال للتسليم بين الإدارات + استعلام ذكي عائم.", zh: "职责:开票、征收与排除项(UC-13)。Workspace — 运营生产型:关键指标 + Business Plaza 跨部门协同交付 + 浮动智能查询。" })}{SHOW_UC ? " · UC-13" : ""}</div></div>
      {/* compact downstream storyline (demo note) — right of header, no border */}
      <div className="ws-story-r">
        <div className="ws-story-h">{tr({ en: "G-06 storyline · downstream evolution", ar: "مسار ج-06 · التطور اللاحق", zh: "G-06 故事线 · 下游演进" })}</div>
        <div className="flowstrip mini">{RC_FLOW.map((f, i) => (<React.Fragment key={i}>{i > 0 && <span className="farr">➜</span>}
          <div className={"fb " + f.cls}>{f.star ? "★ " : ""}{SHOW_UC ? f.code : tr(f.label)}</div></React.Fragment>))}</div>
      </div>
    </div>
    {/* top KPI metrics — carousel */}
    <KpiCarousel tone="green" slides={RC_KPI_SLIDES} configRoute="rcwork" />
    <div className="ws-grid2">
      {/* LEFT (50%) — Business Plaza + Multi-Agent Flow */}
      <div className="ws-left">
        <BusinessPlaza defaultSel="uc13" />
      </div>
      {/* RIGHT (50%) — Smart query (top) + Multi-Agent Flow (below) */}
      <div className="ws-right">
      <div className="orch-cell"><div className="orch orch-chat">
        <div className="orch-h">{tr({ en: "Orchestrator", ar: "المنسّق", zh: "编排器" })} {phase === "running" && <span className="pulse" style={{ marginInlineStart: 2 }} />} <span style={{ fontSize: 12, color: PH[phase].c, fontWeight: 600, marginInlineStart: 4 }}>{tr(PH[phase].t)}</span></div>
        <div className="orch-sub">{SHOW_UC ? orchCfg.uc + " · " : ""}run {orchCfg.run} · {tr(orchCfg.agent)}</div>
        <div className="ctx-chips" style={{ marginBottom: 4 }}>{orchCfg.chips.map((chip, index) => <span className="chip gray" key={index}>{chip}</span>)}</div>
        <div className="orch-body" ref={bodyRef}>
          {!sent && <div className="orch-empty">
            <div>{tr({ en: "Type a request below — the orchestrator runs the agent timeline, then returns a human-in-the-loop review.", ar: "اكتب طلباً بالأسفل — يشغّل المنسّق الخط الزمني للوكلاء ثم يعيد مراجعة بشرية.", zh: "在下方输入请求——编排器会运行智能体时间线,随后返回人工审批。" })}</div>
            <div className="orch-sugs">{orchCfg.prompts.map((p, i) => (<button className="orch-sug" key={i} onClick={() => choosePrompt(p)}>↗ {tr(p.t)}</button>))}</div>
          </div>}
          {sent && <div className="chat-msg user"><div className="bubble">{sent}</div></div>}
          {stage === "think" && <div className="msg bot think-msg">
            <div className="av">✦</div>
            <div className="bubble"><div className="think">{THINK_STEPS.map((s, i) => { const st = thk[i]; const stt = st === "done" ? "ok" : st === "think" ? "act" : "";
              return (<div className={"tl " + stt} key={i}><span className="ti">{st === "done" ? "✓" : st === "think" ? "◐" : "○"}</span><span>{tr(s)}</span></div>); })}</div></div>
          </div>}
          {stage === "timeline" && <div className="chat-msg bot">
            <div className="ws-sec-h">{tr({ en: "Agent timeline", ar: "خط زمن الوكلاء", zh: "智能体时间线" })}</div>
            <div className="tl">{orchCfg.tlMeta.map((e, i) => { const st = tl[i]; const cur = st === "think";
              return (<div className={"ev" + (cur ? " cur" : "")} key={i}>
                <span className={"dotc " + (st === "done" ? "done" : st === "think" ? "think" : "")}>{st === "done" ? "✓" : st === "think" ? "◐" : ""}</span>
                <div className="et">{ucl(e.code, tr(e.t))} {st === "queued" ? <span className="chip gray">{tr({ en: "queued", ar: "في الانتظار", zh: "排队" })}</span> : st === "think" ? <span className="chip info">{tr({ en: "thinking…", ar: "يفكّر…", zh: "思考中…" })}</span> : <span className="chip">{tr({ en: "done", ar: "تم", zh: "完成" })}</span>}</div>
                <div className="es">{tr(e.s)}</div>
              </div>); })}</div>
          </div>}
          {(phase === "review" || phase === "approved" || phase === "returned") && <div className="chat-msg bot">
            {(phase === "review" || phase === "approved") && <OrchSmartResult item={activeSmartItem} />}
            {(phase === "review" || phase === "approved") && <div className="hitl">
              <div className="hh">⚑ {tr({ en: "HUMAN-IN-THE-LOOP REVIEW", ar: "مراجعة بشرية إلزامية", zh: "人工审批" })}</div>
              <div className="hb">{tr(orchCfg.reviewBody)}</div>
              {phase === "approved"
                ? <span className="chip">✓ {tr(orchCfg.approvedChip)}</span>
                : <React.Fragment><div className="hitl-btns"><button className="btn" onClick={approve}>✓ {tr(orchCfg.approveLabel)}</button><button className="btn danger sm" onClick={returnFix}>↺ {tr({ en: "Return for fix", ar: "إعادة للتصحيح", zh: "退回修正" })}</button><button className="btn ghost sm" onClick={() => setShowDiff(v => !v)}>⌥ {tr({ en: "View diff", ar: "عرض الفرق", zh: "查看差异" })}</button></div>
                  {showDiff && <div className="diffbox">{orchCfg.diff.map((d, i) => (<div className={"dl " + d.k} key={i}>{d.k === "rem" ? "− " : "+ "}{tr(d.t)}</div>))}</div>}</React.Fragment>}
            </div>}
            {phase === "returned" && <div className="hitl ret">
              <div className="hh">↺ {tr({ en: "RETURNED FOR FIX", ar: "أُعيد للتصحيح", zh: "已退回修正" })}</div>
              <div className="hb">{tr(orchCfg.returnBody)}</div>
            </div>}
            {(phase === "review" || phase === "approved") && <OrchNext items={activeNextActions} />}
          </div>}
        </div>
        <div className="orch-bar">
          <textarea className="orch-cin" rows={1} value={prompt} disabled={phase === "running"} onChange={e => { setPrompt(e.target.value); setQueuedSmartItem(null); }} placeholder={tr(orchCfg.defaultPrompt)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runOrch(); } }} />
          <button className="orch-send" disabled={phase === "running" || !prompt.trim()} onClick={runOrch}>{phase === "running" ? "…" : "SEND"}</button>
        </div>
      </div></div>
      <div className="ws-flowcard" onClick={() => setRoute("rcdata")} title={tr({ en: "Open Multi-Agent Flow", ar: "فتح تدفّق الوكلاء", zh: "打开多智能体流程" })}>
        <div className="ws-flowcard-h"><span>{tr({ en: "Multi-Agent Flow", ar: "تدفّق متعدد الوكلاء", zh: "多智能体流程" })}</span><span className="ws-flowcard-hr"><span className="at-tip at-tip-r" onClick={(e) => e.stopPropagation()} aria-label={tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })} tabIndex={0}>i<span className="at-tip-pop">{tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })}</span></span><span className="open">↗</span></span></div>
        <svg className="ws-flowthumb" viewBox="0 0 300 44" fill="none" preserveAspectRatio="xMidYMid meet">
          <rect x="4" y="5" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="14" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="23" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="32" width="20" height="7" rx="2" fill="#eef2f7" />
          <rect x="40" y="12" width="28" height="20" rx="4" fill="#fff" stroke="#2563eb" strokeWidth="1.4" />
          <rect x="86" y="5" width="40" height="9" rx="2.5" fill="#2563eb" /><rect x="86" y="18" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" /><rect x="86" y="31" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" />
          <rect x="138" y="16" width="20" height="12" rx="3.5" fill="#eef4ff" stroke="#cdddfb" strokeWidth="0.8" />
          <rect x="172" y="9" width="50" height="26" rx="5" fill="#2563eb" /><circle cx="197" cy="22" r="4" fill="#fff" />
          <rect x="236" y="11" width="40" height="9" rx="2.5" fill="#e9f7ef" stroke="#bfe6cf" strokeWidth="0.8" /><rect x="236" y="24" width="40" height="9" rx="2.5" fill="#fdf4d9" stroke="#f0dca6" strokeWidth="0.8" />
          <g stroke="#c2cbd6" strokeWidth="1"><path d="M24 22 H40" /><path d="M68 22 H86" /><path d="M126 22 H138" /><path d="M158 22 H172" /><path d="M222 22 H236" /></g>
        </svg>
      </div>
      </div>
    </div>
  </div></div>);
}

/* ======= Assets Department — Analysis Workbench (UC-14) ======= */
function AssetsWorkbench() {
  const { tr, setRoute, pushLog, setDeptSub, setBackRoute } = useStore();
  const [ask, setAsk] = useState("");
  const [feed, setFeed] = useState(WB_AS.logs);
  const logRef = useRef(null);
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const qaRef = useRef(null);
  const [fsel, setFsel] = useState([2, 0, 0, 0]);
  const DEFAULT_SUMMARY = { en: "FY 2026 Q1 · ~~SAR 1.92B~~ of completed AUC (**312 items** past in-service date) is ready to capitalize — delaying it understates asset value before close. ~~3 equipment items (SAR 47M NBV)~~ breach the impairment threshold; **5 infrastructure assets** are maintenance-due, and deferring raises whole-life cost **~18%**. Data-quality **96%** — cost is traceable from assignment order to register.", ar: "الربع الأول 2026 · ~~1.92 مليار~~ من الأصول المكتملة (**312 بنداً**) جاهزة للرسملة — التأجيل يقلّل القيمة قبل الإقفال. ~~3 معدات (47 مليون)~~ تتجاوز حد الانخفاض؛ **5 أصول** مستحقة للصيانة، والتأجيل يرفع الكلفة **~18%**. جودة البيانات **96%**.", zh: "FY2026 Q1 · ~~SAR 1.92B~~ 已完工在建资产(**312 项**已过投用日)可资本化——拖延将在关账前低估资产价值。~~3 项设备(账面净值 SAR 47M)~~ 触及减值阈值;**5 项基础设施**待维护,推迟将使全生命周期成本上升 **约 18%**。数据质量 **96%**——成本从派工单到台账可追溯。" };
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [qaOpen, setQaOpen] = useState(false);
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, PARA = { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, DOWN = { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, THIS = { en: "THIS", ar: "هذه", zh: "本环节" };
  const WB_CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Financial Data Consolidation & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" } },
    { code: "UC-13", pos: UP, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: UP, name: { en: "Performance Reports / Anomaly Detection", ar: "تقارير الأداء / كشف الانحرافات", zh: "绩效报告 / 异常检测" } },
    { code: "UC-14", here: true, pos: THIS, name: { en: "Assets, Classification & Capitalization", ar: "الأصول والتصنيف والرسملة", zh: "资产、分类与资本化" } },
    { code: "UC-12 / UC-11", pos: PARA, name: { en: "Costs & Funds / Compliance & Memos", ar: "التكاليف والصناديق / الامتثال والمذكرات", zh: "成本与资金 / 合规与备忘" } },
    { code: "UC-10 / UC-03", pos: DOWN, name: { en: "Reporting & Dashboards / Smart Query & Audit", ar: "التقارير / الاستعلام والتدقيق", zh: "报告与仪表盘 / 智能查询与审计" } },
  ];
  const WB_SOURCES = [
    { n: "Asset Registry", s: "synced" }, { n: "SAP", s: "synced" }, { n: "Balady Data", s: "synced" }, { n: "Esnad", s: "loading" }, { n: "Invoices", s: "synced" },
    { n: "Comprehensive Guide", s: "synced" }, { n: "Coordinates", s: "synced" }, { n: "Investment & Maint. Data", s: "synced" }, { n: "Secretariats Data", s: "synced" },
  ];
  const WB_OUTPUTS = [
    { l: { en: "Improved Asset Registry", ar: "سجل أصول محسّن", zh: "改进的资产台账" }, v: "8,640", s: { en: "records cleansed · 96% quality", ar: "سجلات منقّحة · جودة 96%", zh: "记录清洗 · 质量 96%" }, tag: { en: "DQ 96%", ar: "الجودة 96%", zh: "质量 96%" }, rows: [
      { k: { en: "Duplicates merged", ar: "تكرارات مدمجة", zh: "合并重复" }, v: "214" },
      { k: { en: "Fields filled", ar: "حقول مكمّلة", zh: "补全字段" }, v: "1,308" },
      { k: { en: "Class corrections", ar: "تصحيح التصنيف", zh: "分类更正" }, v: "96" },
    ] },
    { l: { en: "Capitalization Recommendations", ar: "توصيات الرسملة", zh: "资本化建议" }, v: "SAR 1.92B", s: { en: "312 AUC items ready", ar: "312 بنداً جاهزاً", zh: "312 项在建资产就绪" }, rows: [
      { k: { en: "Buildings (142)", ar: "مبانٍ (142)", zh: "建筑(142)" }, v: "SAR 1.12B", pct: 58 },
      { k: { en: "Infrastructure (121)", ar: "بنية تحتية (121)", zh: "基础设施(121)" }, v: "SAR 0.58B", pct: 30 },
      { k: { en: "Equipment (49)", ar: "معدات (49)", zh: "设备(49)" }, v: "SAR 0.22B", pct: 12 },
    ] },
    { l: { en: "Asset Cost Tracking", ar: "تتبّع تكلفة الأصل", zh: "资产成本追踪" }, v: "100%", s: { en: "invoice → register traceable", ar: "الفاتورة ← السجل قابل للتتبع", zh: "发票 → 台账可追溯" }, rows: [
      { k: { en: "Orders linked", ar: "أوامر مرتبطة", zh: "已关联派工单" }, v: "1,204" },
      { k: { en: "Invoices matched", ar: "فواتير مطابقة", zh: "已匹配发票" }, v: "3,310" },
      { k: { en: "Unmatched", ar: "غير مطابق", zh: "未匹配" }, v: "0" },
    ] },
    { l: { en: "Investment Opportunities", ar: "فرص استثمارية", zh: "投资机会" }, v: "5 · SAR 86M", s: { en: "reuse / disposal flags", ar: "إعادة استخدام / تصرّف", zh: "复用 / 处置标记" }, rows: [
      { k: { en: "Idle land reuse (2)", ar: "إعادة استخدام أرض (2)", zh: "闲置土地复用(2)" }, v: "SAR 54M" },
      { k: { en: "Equipment disposal (2)", ar: "تصرّف معدات (2)", zh: "设备处置(2)" }, v: "SAR 21M" },
      { k: { en: "Sublease (1)", ar: "إيجار فرعي (1)", zh: "转租(1)" }, v: "SAR 11M" },
    ] },
    { l: { en: "Maintenance Alerts", ar: "تنبيهات الصيانة", zh: "维护告警" }, v: "5", s: { en: "infra-led · ≤60 days", ar: "بنية تحتية · ≤60 يوماً", zh: "基础设施 · ≤60 天" }, rows: [
      { k: { en: "Roads R-118 / R-204", ar: "طرق R-118 / R-204", zh: "道路 R-118 / R-204" }, v: "≤30d" },
      { k: { en: "Buildings (2)", ar: "مبانٍ (2)", zh: "建筑(2)" }, v: "≤45d" },
      { k: { en: "Equipment (1)", ar: "معدات (1)", zh: "设备(1)" }, v: "≤60d" },
    ] },
  ];
  const cyc = (i) => setFsel(s => s.map((v, j) => j === i ? (v + 1) % WB_AS.filters[i].opts.length : v));
  const applyFilters = () => {
    const period = WB_AS.filters[0].opts[fsel[0]], cls = WB_AS.filters[2].opts[fsel[2]];
    setSummary({ en: `For ${period} · ${cls}: SAR 1.92B AUC ready for capitalization, 3 impairment flags (SAR 47M) and 5 maintenance-due assets; data quality 96%.`, ar: `لـ ${period} · ${cls}: 1.92 مليار جاهزة للرسملة، 3 مؤشرات انخفاض (47 مليون) و5 أصول صيانة؛ جودة 96%.`, zh: `${period} · ${cls}:SAR 1.92B 可资本化,3 项减值(SAR 47M),5 项待维护;数据质量 96%。` });
    pushLog({ en: "Filters applied — " + period + " · " + cls, ar: "تم تطبيق عوامل التصفية — " + period, zh: "已应用筛选 — " + period + " · " + cls });
  };
  const SCOPE_K = [{ en: "Period", ar: "الفترة", zh: "期间" }, { en: "Fund", ar: "الصندوق", zh: "基金" }, { en: "Class", ar: "الفئة", zh: "类别" }, { en: "Status", ar: "الحالة", zh: "状态" }];
  const cycleScope = (i) => {
    const ns = fsel.map((v, j) => j === i ? (v + 1) % WB_AS.filters[i].opts.length : v); setFsel(ns);
    const period = WB_AS.filters[0].opts[ns[0]], cls = WB_AS.filters[2].opts[ns[2]];
    setSummary({ en: `For ${period} · ${cls}: SAR 1.92B AUC ready for capitalization, 3 impairment flags (SAR 47M) and 5 maintenance-due assets; data quality 96%.`, ar: `لـ ${period} · ${cls}: 1.92 مليار جاهزة للرسملة، 3 مؤشرات انخفاض (47 مليون) و5 أصول صيانة؛ جودة 96%.`, zh: `${period} · ${cls}:SAR 1.92B 可资本化,3 项减值(SAR 47M),5 项待维护;数据质量 96%。` });
    pushLog({ en: "Scope changed — " + period + " · " + cls, ar: "تغيّر النطاق — " + period, zh: "作用域已更改 — " + period + " · " + cls });
  };
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n++; const base = WB_AS.logs[n % WB_AS.logs.length];
      const tm = "10:" + String((6 + n) % 60).padStart(2, "0");
      setFeed(f => [...f.slice(-7), { ...base, tm }]);
    }, 2300);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [feed]);
  const askQ = (idx, raw, ansObj) => {
    const q = idx >= 0 ? tr(WB_AS.qs[idx]) : (raw || "").trim();
    if (!q || thinking) return;
    const a = ansObj ? tr(ansObj) : (idx >= 0 ? tr(WB_AS.answers[idx]) : tr(WB_AS.genAns));
    pushLog({ en: "Q&A → Assets agent: " + q, ar: "سؤال → وكيل الأصول: " + q, zh: "提问 → 资产智能体:" + q });
    setShowSugs(false);
    setQa(p => [...p, { role: "u", text: q }]); setAsk(""); setThinking(true);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: a }]); setThinking(false); }, 850);
  };
  useEffect(() => { const el = qaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);
  const badge = (s) => s === "running" ? <span className="wb-badge run">{tr({ en: "running", ar: "يعمل", zh: "运行中" })}</span>
    : s === "focus" ? <span className="wb-badge foc">{tr({ en: "in focus", ar: "قيد التركيز", zh: "聚焦中" })}</span>
    : <span className="wb-badge act">{tr({ en: "active", ar: "نشط", zh: "活动" })}</span>;
  const risk = (r) => <span className={"wb-risk " + r}>{tr(r === "high" ? { en: "high", ar: "مرتفع", zh: "高" } : r === "med" ? { en: "med", ar: "متوسط", zh: "中" } : { en: "low", ar: "منخفض", zh: "低" })}</span>;
  const fAsk = (row) => askQ(-1, row.id + " · " + tr(row.am) + " — " + row.od, {
    en: row.id + " (" + tr(row.am) + ", NBV " + row.od + ") is flagged for " + tr(row.flag) + " at " + row.risk + " risk. Driver: utilization decline and market-value drop beyond the policy threshold. Recommended: raise an accounting memo and route to compliance review.",
    ar: row.id + " (" + tr(row.am) + "، 47 مليون) مرصود لـ " + tr(row.flag) + " بخطر " + row.risk + ". الموصى به: إصدار مذكرة محاسبية وتحويلها لمراجعة الامتثال.",
    zh: row.id + "(" + tr(row.am) + ",账面净值 " + row.od + ")被标记为" + tr(row.flag) + ",风险 " + row.risk + "。主因:利用率下降与市场价值跌破政策阈值。建议:开具会计备忘并转合规复核。",
  });
  return (<div className="fade wb">
    <div className="card pad wb-frame">
    {/* HEADER */}
    <div className="card pad wb-head">
      <div><div className="wb-title"><button className="pg-back" onClick={() => { setRoute("aswork"); }}>‹</button><span className="wb-dot violet" /> {tr({ en: "Assets Department", ar: "إدارة الأصول", zh: "资产部" })} · {tr({ en: "Analysis Workbench", ar: "منصة التحليل", zh: "分析工作台" })}</div>
        <div className="wb-subt">{ucl("UC-14", tr({ en: "Assets, Classification, Capitalization, Returns & Maintenance", ar: "الأصول والتصنيف والرسملة والعوائد والصيانة", zh: "资产、分类、资本化、收益与维护" }))}</div></div>
      <div className="wb-chain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{WB_CHAIN.map((c, i) => (<React.Fragment key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></React.Fragment>))}</div>
    </div>
    {/* INSIGHT & NEXT ACTIONS */}
    <div className="wb-actbar">
      <div className="wb-ab-top">
        <div className="wb-ab-spark">✦</div>
        <div className="wb-ab-tt">
          <div><span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span><span className="wb-ab-meta">{SHOW_UC ? "UC-14 · " : ""}run #3107 · {tr({ en: "Assets agent", ar: "وكيل الأصول", zh: "资产智能体" })} · {tr({ en: "scope", ar: "النطاق", zh: "作用域" })}: {WB_AS.filters[0].opts[fsel[0]]} · {WB_AS.filters[2].opts[fsel[2]]}</span></div>
          <div className="wb-ab-insight"><Hi t={tr(summary)} /></div>
        </div>
      </div>
      <div className="wb-ab-rows">
        <div className="wb-ab-col">
          <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
          <div className="wb-sugs">{WB_AS.next.map((n, i) => (<button className="wb-sug" key={i} onClick={() => { pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) }); setQaOpen(true); }}><span className="pr">{i + 1}</span><span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span></button>))}</div>
        </div>
        <div className="wb-ab-col r">
          <div className="wb-ab-h">➜ {tr({ en: "HAND OFF DOWNSTREAM · actions", ar: "تسليم لاحق · إجراءات", zh: "下游交接 · 动作" })}</div>
          <div className="wb-ctas">
            <button className="wb-cta p" onClick={() => { setBackRoute("asbench"); setRoute("csfunds"); }}>{SHOW_UC && <span className="uc">UC-12</span>}{tr({ en: "Send to Costs & Funds Close", ar: "إرسال إلى إقفال التكاليف والصناديق", zh: "推送至成本与资金结账" })}<span className="ar">→</span></button>
            <button className="wb-cta s" onClick={() => { setBackRoute("asbench"); setRoute("compmemo"); }}>{SHOW_UC && <span className="uc">UC-11</span>}{tr({ en: "Raise Compliance / Accounting Memo", ar: "إصدار مذكرة امتثال / محاسبية", zh: "发起合规 / 会计备忘" })}<span className="ar">→</span></button>
          </div>
        </div>
      </div>
    </div>
    {/* RESULTS + scope chips */}
    <div className="wb-sech shead">
      <div><h2>{tr({ en: "Asset Capitalization & Lifecycle Results", ar: "نتائج رسملة الأصول ودورة الحياة", zh: "资产资本化与生命周期结果" })}</h2><div className="muted">{ucl("UC-14", tr({ en: "UC-14 outputs · produced by agents", ar: "مخرجات UC-14 · أُنتجت بواسطة الوكلاء", zh: "UC-14 输出 · 由智能体生成" }))}</div></div>
      <div className="wb-scope"><span className="wb-sl">{tr({ en: "SCOPE", ar: "النطاق", zh: "作用域" })}</span>
        {WB_AS.filters.map((f, i) => (<button className="wb-schip" key={i} onClick={() => cycleScope(i)} title={tr(f.lab)}><span className="k">{tr(SCOPE_K[i])}</span><span className="v">{f.opts[fsel[i]]}</span><span className="cv">▾</span></button>))}
        <span className="wb-auto">● {tr({ en: "auto-applied", ar: "تطبيق تلقائي", zh: "自动应用" })}</span>
      </div>
    </div>
    <div className="wb-ogrid">{WB_OUTPUTS.map((o, i) => (<div className="wb-ocard" key={i}><div className="oc-h">{tr(o.l)}{o.tag && <span className="oc-tag">{tr(o.tag)}</span>}</div><div className="oc-b"><div className="oc-v"><Money v={o.v} /></div><div className="oc-s">{tr(o.s)}</div></div>{o.rows && <div className="oc-rows">{o.rows.map((r, j) => (<div className="oc-row" key={j}><span className="k">{tr(r.k)}</span>{typeof r.pct === "number" && <span className="ocbar"><i style={{ width: r.pct + "%" }} /></span>}<span className="ov">{r.v}</span></div>))}</div>}</div>))}</div>
    <div className="wb-cols3">
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Capitalization Overview", ar: "نظرة عامة على الرسملة", zh: "资本化概览" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl">{tr({ en: "AUC → CAPITALIZED (PERIOD)", ar: "تحت الإنشاء ← مرسمل (الفترة)", zh: "在建资产 → 已资本化(本期)" })}</div>
          <div className="wb-krow"><span className="wb-big">62%</span><span className="chip">SAR 1.92B</span></div>
          <div className="wb-bars">
            <div className="wb-bar"><div className="bl">{tr({ en: "AUC opening", ar: "تحت الإنشاء (افتتاحي)", zh: "在建期初" })}</div><div className="bt"><span className="bf plan" style={{ width: "100%" }} /></div><div className="bv"><Money v="SAR 3.10B" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Capitalized", ar: "مرسمل", zh: "已资本化" })}</div><div className="bt"><span className="bf coll" style={{ width: "50%" }} /></div><div className="bv"><Money v="SAR 1.92B" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Remaining AUC", ar: "متبقٍ تحت الإنشاء", zh: "剩余在建" })}</div><div className="bt"><span className="bf out" style={{ width: "38%" }} /></div><div className="bv"><Money v="SAR 1.18B" /></div></div>
          </div>
          <div className="wb-kk"><span>{tr({ en: "Avg useful life", ar: "متوسط العمر الإنتاجي", zh: "平均使用年限" })}</span><b>28 {tr({ en: "yr", ar: "سنة", zh: "年" })}</b></div>
          <div className="wb-kk"><span>{tr({ en: "Data quality score", ar: "درجة جودة البيانات", zh: "数据质量分" })}</span><b className="up">96%</b></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Impairment & Maintenance · Focus List", ar: "الانخفاض والصيانة · قائمة التركيز", zh: "减值与维护 · 重点清单" })}</b><span className="wb-pm">{tr({ en: "top 5", ar: "أعلى 5", zh: "前 5" })}</span></div>
        <div className="wb-pb">
          <table className="wb-table"><thead><tr><th>{tr({ en: "ASSET ID", ar: "رقم الأصل", zh: "资产编号" })}</th><th>{tr({ en: "CLASS", ar: "الفئة", zh: "类别" })}</th><th>{tr({ en: "NBV", ar: "ق. دفترية", zh: "账面净值" })}</th><th>{tr({ en: "FLAG", ar: "العلم", zh: "标记" })}</th><th>{tr({ en: "RISK", ar: "الخطر", zh: "风险" })}</th></tr></thead>
            <tbody>{WB_AS.focus.map((r, i) => (<tr key={i} onClick={() => fAsk(r)}><td className="mono">{r.id}</td><td>{tr(r.am)}</td><td><Money v={r.od} /></td><td><span className="chip gray">{tr(r.flag)}</span></td><td>{risk(r.risk)}</td></tr>))}</tbody></table>
          <div className="wb-tfoot"><span>{tr({ en: "Showing 5 of 18 · click any row to ask the agent", ar: "عرض 5 من 18 · انقر أي صف لسؤال الوكيل", zh: "显示 18 中的 5 条 · 点击任意行向智能体提问" })}</span><a onClick={() => askQ(1)}>{tr({ en: "View all →", ar: "عرض الكل →", zh: "查看全部 →" })}</a></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Asset Class Distribution", ar: "توزيع فئات الأصول", zh: "资产类别分布" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl2">{tr({ en: "Capitalized value by class", ar: "القيمة المرسملة حسب الفئة", zh: "按类别的已资本化价值" })}</div>
          {configuredDistribution("asbench", "capitalization_by_class", "capitalized_amount", WB_AS.dist).map((d, i) => (<div className="wb-dist" key={i}><div className="dn">{tr(d.am)}</div><div className="dt"><span className={"df " + d.cls} style={{ width: d.pct + "%" }} /></div><div className="dv"><Money v={d.v} /></div></div>))}
          <div className="wb-other"><span>{tr({ en: "Total capitalized", ar: "إجمالي المرسمل", zh: "已资本化合计" })}</span><b><Money v="SAR 1.92B" /></b></div>
        </div></div>
    </div>
    {/* MULTI-AGENT WORKSPACE */}
    <div className="wb-sech"><h2>{tr({ en: "Multi-Agent Workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</h2><div className="muted">{tr({ en: "Orchestrated agent roles & live action timeline", ar: "أدوار وكلاء منسّقة وخط زمني حي", zh: "编排的智能体角色与实时操作时间线" })}</div></div>
    <div className="wb-cols3 wb-work">
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot" style={{ background: "#5b3a9e" }} /> <b>{tr({ en: "Data Inputs · sources", ar: "مدخلات البيانات · المصادر", zh: "数据输入 · 源系统" })}</b><span className="wb-pm">{tr({ en: "9 systems", ar: "9 أنظمة", zh: "9 个系统" })}</span><button className="wb-impbtn" onClick={() => pushLog({ en: "Manual Excel / CSV import — flagged as temporary source (BR-04)", ar: "استيراد Excel / CSV يدوي — مصدر مؤقت (BR-04)", zh: "手动导入 Excel / CSV — 标记为临时来源(BR-04)" })} title={tr({ en: "Upload an Excel/CSV file when an API is unavailable (temporary source)", ar: "رفع ملف Excel/CSV عند عدم توفّر الواجهة (مصدر مؤقت)", zh: "当接口不可用时上传 Excel/CSV 文件(临时来源)" })}>⬆ {tr({ en: "Import Excel/CSV", ar: "استيراد Excel/CSV", zh: "导入 Excel/CSV" })}</button></div>
        <div className="wb-pb"><div className="wb-srclist">{WB_SOURCES.map((s, i) => (<div className="wb-src" key={i}><span className={"sd" + (s.s === "loading" ? " load" : "")} /><span className="sn">{s.n}</span><span className="ss">{tr(s.s === "loading" ? { en: "loading", ar: "تحميل", zh: "载入" } : { en: "synced", ar: "متزامن", zh: "已同步" })}</span></div>))}</div></div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Orchestrator · Task Board", ar: "المنسّق · لوحة المهام", zh: "编排器 · 任务板" })}</b><span className="wb-orchpill"><span className="gear">⚙</span>{tr({ en: "Auto-orchestration · 3 agents", ar: "تنسيق تلقائي · 3 وكلاء", zh: "自动编排 · 3 个智能体" })}</span></div>
        <div className="wb-pb">{WB_AS.roles.map((r, i) => (<div className={"wb-role " + (r.cls || "") + (r.focus ? " foc-card" : "")} key={i} onClick={r.focus ? () => { setRoute("aswork"); } : undefined}>
          <div className="rl"><div className="rt">{r.code ? ucl(r.code, tr(r.name)) : tr(r.name)}</div><div className="rs">{tr(r.sub)}</div></div>{badge(r.status)}
        </div>))}</div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Agent Timeline · Logs", ar: "خط زمن الوكلاء · السجلات", zh: "智能体时间线 · 日志" })}</b><span className="wb-pm">{tr({ en: "last 5 min", ar: "آخر 5 د", zh: "最近 5 分钟" })}</span></div>
        <div className="wb-pb"><div className="wb-tl" ref={logRef}>{feed.map((e, i) => (<div className={"wb-ev" + (i === feed.length - 1 ? " live" : "")} key={i}><span className={"wb-dot2 " + e.dot} /><div className="wb-eh"><b>{e.tm}</b> · {e.code ? ucl(e.code, tr(e.h)) : tr(e.h)}</div><div className="wb-ed">{tr(e.d)}</div></div>))}</div></div></div>
    </div>
    <button className="wb-qfab" onClick={() => setQaOpen(o => !o)} aria-label="AI Narratives & Q&A" title={tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}>🤖</button>
    {qaOpen && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className="wb-dot violet" /> <b>{tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}</b><button className="wb-qx" onClick={() => setQaOpen(false)}>✕</button></div>
        <div className="wb-pb wb-qbody">
          {qa.length === 0 && !thinking && <div className="wb-narrwrap"><div className="wb-ntag">{ucl("UC-14", tr({ en: "NARRATIVE", ar: "السرد", zh: "叙述" }))}</div>
          <div className="wb-narr">
            <p>{tr({ en: "SAR 1.92B of completed assets-under-construction is ready for capitalization this period, led by road infrastructure (SAR 0.84B) and buildings (SAR 0.61B).", ar: "1.92 مليار ريال من الأصول تحت الإنشاء المكتملة جاهزة للرسملة، تقودها البنية التحتية (0.84) والمباني (0.61).", zh: "本期 SAR 1.92B 已完工在建资产可资本化,以道路基础设施(SAR 0.84B)与建筑(SAR 0.61B)为主。" })}</p>
            <p>{tr({ en: "Three equipment items (SAR 47M NBV) breach the impairment threshold on idle utilization and market decline; five infrastructure assets are due for maintenance within 60 days.", ar: "ثلاث معدات (47 مليون) تتجاوز حد الانخفاض؛ وخمسة أصول بنية تحتية مستحقة للصيانة خلال 60 يوماً.", zh: "三项设备(账面净值 SAR 47M)因闲置利用与市场下跌突破减值阈值;五项基础设施资产将在 60 天内到期维护。" })}</p>
            <div className="wb-rp">{tr({ en: "Recommended priorities:", ar: "الأولويات الموصى بها:", zh: "建议优先事项:" })}</div>
            <ul><li>{tr({ en: "Capitalize SAR 1.92B completed AUC", ar: "رسملة 1.92 مليار من الأصول المكتملة", zh: "资本化 SAR 1.92B 已完工在建资产" })}</li>
              <li>{tr({ en: "Raise impairment memos for 3 equipment items", ar: "إصدار مذكرات انخفاض لـ 3 معدات", zh: "为 3 项设备开具减值备忘" })}</li>
              <li>{tr({ en: "Schedule maintenance for R-118 / R-204", ar: "جدولة صيانة لـ R-118 / R-204", zh: "为 R-118 / R-204 安排维护" })}</li></ul>
            <div className="wb-src">{ucl("UC-01", tr({ en: "Source: unified asset data · Data Querying Agent", ar: "المصدر: بيانات أصول موحّدة · وكيل الاستعلام", zh: "来源:统一资产数据 · 数据查询智能体" }))}</div>
          </div></div>}
          {(qa.length > 0 || thinking) && <div className="wb-qa" ref={qaRef}>
            {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb"><Money v={m.text} /></div></div>))}
            {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
          </div>}
          <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
          {(qa.length === 0 || showSugs) && WB_AS.qs.map((q, i) => (<div className="wb-sq" key={i} onClick={() => askQ(i)}>{tr(q)} <span className="ar">→</span></div>))}
          <div className="wb-askh">{tr({ en: "Ask the Assets agent…", ar: "اسأل وكيل الأصول…", zh: "向资产智能体提问…" })}</div>
          <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && askQ(-1, ask)} /><button className="btn sm" onClick={() => askQ(-1, ask)}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
        </div>
    </div>}
    </div>
  </div>);
}

/* ======= Assets Department — workspace (department landing) ======= */
function AssetsWorkspace() {
  const { tr, setRoute, pushLog, lang } = useStore();
  const DEFAULT_PROMPT = { en: "Review completed assets-under-construction for capitalization, flag impairment and maintenance risks, and draft an asset note for executive review.", ar: "راجع الأصول تحت الإنشاء المكتملة للرسملة، وحدّد مخاطر الانخفاض والصيانة، وصُغ مذكرة أصول للمراجعة التنفيذية.", zh: "复核已完工在建资产以进行资本化,标记减值与维护风险,并起草供高管复核的资产说明。" };
  const smartQueryConfig = useMemo(() => getSmartQueryFabConfig("aswork", null, []), []);
  const smartItems = smartQueryConfig.items || [];
  const [phase, setPhase] = useState("idle");
  const [prompt, setPrompt] = useState(tr(DEFAULT_PROMPT));
  const [sent, setSent] = useState(null);
  const [queuedSmartItem, setQueuedSmartItem] = useState(null);
  const [activeSmartItem, setActiveSmartItem] = useState(null);
  const [tl, setTl] = useState(["queued", "queued", "queued", "queued"]);
  const [thk, setThk] = useState(["queued", "queued", "queued", "queued"]);
  const [stage, setStage] = useState("idle");
  const [showDiff, setShowDiff] = useState(false);
  const timersRef = useRef([]);
  const bodyRef = useRef(null);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => { if (phase === "idle") setPrompt(tr(DEFAULT_PROMPT)); }, [lang]);
  useEffect(() => () => clearTimers(), []);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [tl, thk, phase, sent, showDiff, activeSmartItem]);
  const THINK_STEPS = [
    { en: "Interpreting intent", ar: "تفسير القصد", zh: "解析意图" },
    { en: "Checking permission scope", ar: "التحقق من نطاق الصلاحيات", zh: "检查权限范围" },
    { en: "Selecting agents", ar: "اختيار الوكلاء", zh: "选择智能体" },
    { en: "Planning subtasks", ar: "تخطيط المهام الفرعية", zh: "规划子任务" },
  ];
  const AS_PROMPTS = [
    { t: { en: "Capitalize completed AUC", ar: "رسملة الأصول المكتملة", zh: "资本化已完工在建资产" }, s: { en: "this period · all classes", ar: "هذه الفترة · كل الفئات", zh: "本期 · 全部类别" } },
    { t: { en: "Detect impairment risk", ar: "كشف مخاطر الانخفاض", zh: "检测减值风险" }, s: { en: "equipment & infrastructure", ar: "معدات وبنية تحتية", zh: "设备与基础设施" } },
    { t: { en: "Plan maintenance schedule", ar: "تخطيط جدول الصيانة", zh: "规划维护计划" }, s: { en: "next 60 days", ar: "الـ 60 يوماً القادمة", zh: "未来 60 天" } },
  ];
  const PH = {
    idle: { t: { en: "ready", ar: "جاهز", zh: "就绪" }, c: "var(--muted)" },
    running: { t: { en: "running", ar: "يعمل", zh: "运行中" }, c: "var(--info)" },
    review: { t: { en: "awaiting review", ar: "بانتظار المراجعة", zh: "待审批" }, c: "var(--amber)" },
    approved: { t: { en: "completed", ar: "اكتمل", zh: "已完成" }, c: "var(--green-dark)" },
    returned: { t: { en: "returned", ar: "أُعيد", zh: "已退回" }, c: "var(--danger)" },
  };
  const runOrch = () => {
    if (phase === "running" || !prompt.trim()) return;
    const matchedSmartItem = queuedSmartItem || findSmartItemForPrompt(null, prompt, smartItems) || null;
    clearTimers(); setShowDiff(false); setSent(prompt.trim()); setPhase("running"); setStage("think");
    setActiveSmartItem(matchedSmartItem);
    setThk(["think", "queued", "queued", "queued"]);
    setTl(["queued", "queued", "queued", "queued"]);
    pushLog(orchCfg.startLog);
    [[450, ["done", "think", "queued", "queued"]], [900, ["done", "done", "think", "queued"]], [1350, ["done", "done", "done", "think"]], [1750, ["done", "done", "done", "done"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setThk(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setStage("timeline"); setTl(["think", "queued", "queued", "queued"]); }, 1800));
    [[2500, ["done", "think", "queued", "queued"]], [3300, ["done", "done", "think", "queued"]], [4200, ["done", "done", "done", "think"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setTl(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setPhase("review"); pushLog(orchCfg.reviewLog); }, 4900));
  };
  const approve = () => {
    if (phase === "approved") return; clearTimers(); setPhase("approved"); setStage("result"); setTl(["done", "done", "done", "done"]);
    pushLog(orchCfg.approveLog);
  };
  const returnFix = () => {
    clearTimers(); setShowDiff(false); setPhase("returned"); setStage("result"); setTl(["done", "done", "done", "queued"]);
    pushLog(orchCfg.returnLog);
  };
  const tlMeta = [
    { code: "UC-01", t: { en: "pull unified asset dataset", ar: "سحب بيانات الأصول الموحّدة", zh: "拉取统一资产数据集" }, s: { en: "8,640 records reconciled · 0.9s", ar: "8,640 سجلاً · 0.9 ث", zh: "对账 8,640 条 · 0.9s" } },
    { code: "UC-14", t: { en: "detect capitalization candidates", ar: "كشف مرشحي الرسملة", zh: "检测资本化候选" }, s: { en: "SAR 1.92B AUC ready · 312 items", ar: "1.92 مليار جاهزة · 312 بنداً", zh: "SAR 1.92B 就绪 · 312 项" } },
    { code: "UC-14", t: { en: "score impairment & maintenance", ar: "تقييم الانخفاض والصيانة", zh: "评估减值与维护" }, s: { en: "3 impairment · 5 maintenance flagged", ar: "3 انخفاض · 5 صيانة", zh: "标记 3 减值 · 5 维护" } },
    { code: "UC-06", t: { en: "draft asset note", ar: "صياغة مذكرة الأصول", zh: "起草资产说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
  ];
  const orchCfg = applyOrchestratorConfig("aswork", {
    uc: "UC-14",
    run: "#3107",
    agent: { en: "Assets agent", ar: "وكيل الأصول", zh: "资产智能体" },
    chips: ["scope: FY26 Q1", "dept: Assets only", "policy: IPSAS · useful-life"],
    defaultPrompt: DEFAULT_PROMPT,
    startLog: { en: "Orchestrator started — reviewing AUC capitalization & impairment (FY26 Q1, all classes)", ar: "بدأ المنسّق — مراجعة الرسملة والانخفاض (الربع الأول 2026)", zh: "编排器已启动——复核在建资产资本化与减值(FY26 Q1,全部类别)" },
    reviewLog: { en: "Draft ready — 12 capitalization entries await human approval", ar: "المسودة جاهزة — 12 قيد رسملة بانتظار الاعتماد", zh: "草稿就绪——12 项资本化分录等待人工审批" },
    approveLog: { en: "Finance Lead approved 12 capitalization entries; asset note generated", ar: "اعتمد قائد المالية 12 قيداً؛ وأُنشئت مذكرة الأصول", zh: "财务负责人批准 12 项资本化分录;已生成资产说明" },
    returnLog: { en: "12 entries returned to the Assets agent for rework", ar: "أُعيدت 12 قيداً لوكيل الأصول لإعادة المعالجة", zh: "12 项分录已退回资产智能体重新处理" },
    prompts: AS_PROMPTS,
    tlMeta,
    reviewBody: { en: "12 capitalization entries require finance approval before the asset note is generated.", ar: "تتطلب 12 قيد رسملة اعتماد المالية قبل إنشاء مذكرة الأصول.", zh: "12 项资本化分录需财务批准后方可生成资产说明。" },
    approveLabel: { en: "Approve entries", ar: "اعتماد القيود", zh: "批准分录" },
    approvedChip: { en: "Approved · asset note generated", ar: "معتمد · أُنشئت المذكرة", zh: "已批准 · 已生成资产说明" },
    diff: [
      { k: "rem", t: { en: "AUC-2207 — SAR 0 (not capitalized)", ar: "AUC-2207 — صفر ريال (غير مرسمل)", zh: "AUC-2207 — SAR 0(未资本化)" } },
      { k: "add", t: { en: "AUC-2207 — SAR 1.92B (capitalized)", ar: "AUC-2207 — 1.92 مليار ريال (مرسمل)", zh: "AUC-2207 — SAR 1.92B(已资本化)" } },
      { k: "rem", t: { en: "impairment flag · none", ar: "علم الانخفاض · لا شيء", zh: "减值标记 · 无" } },
      { k: "add", t: { en: "impairment flag · 3 equipment items (SAR 47M)", ar: "علم الانخفاض · 3 معدات (47 مليون)", zh: "减值标记 · 3 项设备(SAR 47M)" } },
    ],
    returnBody: { en: "Entries sent back to the Assets agent. Edit the prompt and run again.", ar: "أُعيدت القيود لوكيل الأصول. عدّل الطلب وأعد التشغيل.", zh: "分录已退回资产智能体。请修改提示后重新运行。" },
    nextActions: NEXT_ACTIONS_AS,
  });
  useEffect(() => { if (phase === "idle") setPrompt(tr(orchCfg.defaultPrompt)); }, [lang, phase]);
  const choosePrompt = (p) => {
    const title = tr(p.t);
    const subtitle = tr(p.s);
    const matchedSmartItem = findSmartItemForPrompt(p, title, smartItems);
    setQueuedSmartItem(matchedSmartItem);
    setPrompt(subtitle && !sameSmartQuestion(title, subtitle) ? `${title} · ${subtitle}` : title);
  };
  const activeNextActions = smartActionsToOrchNext(activeSmartItem?.nextActions, orchCfg.nextActions);
  return (<div className="fade"><div className="card pad ws-frame">
    <div className="ws-head">
      <SmartQueryFab route="aswork" scope={{ en: "Scope: Assets · read-only", ar: "النطاق: الأصول · للقراءة", zh: "范围:资产 · 只读" }} prompts={[{ en: "Which assets are due for capitalization?", ar: "ما الأصول المستحقة للرسملة؟", zh: "哪些资产应予资本化?" }, { en: "Where are impairment risks concentrated?", ar: "أين تتركّز مخاطر الانخفاض؟", zh: "减值风险集中在哪里?" }, { en: "Which assets need maintenance soon?", ar: "ما الأصول التي تحتاج صيانة قريباً؟", zh: "哪些资产即将需要维护?" }]} />
      <div className="ws-htext"><h1 style={{ fontSize: 22 }}>{tr({ en: "Assets Department", ar: "إدارة الأصول", zh: "资产部" })}</h1>
        <div className="sub muted">{tr({ en: "Mandate: asset classification, capitalization, returns & maintenance (UC-14). Workspace — operating type: KPI metrics + Business Plaza hand-off to cost/compliance/reporting + floating Smart Query.", ar: "المهمة: تصنيف الأصول والرسملة والعوائد والصيانة (UC-14). مساحة العمل — نوع تشغيلي: مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:资产分类、资本化、回报与维护(UC-14)。Workspace — 运营生产型:关键指标 + Business Plaza 向成本/合规/报告交付 + 浮动智能查询。" })}{SHOW_UC ? " · UC-14" : ""}</div></div>
      <div className="ws-story-r">
        <div className="ws-story-h">{tr({ en: "G-06 storyline · downstream evolution", ar: "مسار ج-06 · التطور اللاحق", zh: "G-06 故事线 · 下游演进" })}</div>
        <div className="flowstrip mini">{AS_FLOW.map((f, i) => (<React.Fragment key={i}>{i > 0 && <span className="farr">➜</span>}
          <div className={"fb " + f.cls}>{f.star ? "★ " : ""}{SHOW_UC ? f.code : tr(f.label)}</div></React.Fragment>))}</div>
      </div>
    </div>
    {/* top KPI metrics — carousel (asset lifecycle + UC-14 outputs) */}
    <KpiCarousel tone="violet" slides={AS_KPI_SLIDES} configRoute="aswork" />
    <div className="ws-grid2">
      {/* LEFT (50%) — Business Plaza */}
      <div className="ws-left">
        <BusinessPlaza defaultSel="uc14" />
      </div>
      {/* RIGHT (50%) — Smart query (top) + Analysis Workbench entry (below) */}
      <div className="ws-right">
      <div className="orch-cell"><div className="orch orch-chat">
        <div className="orch-h">{tr({ en: "Orchestrator", ar: "المنسّق", zh: "编排器" })} {phase === "running" && <span className="pulse" style={{ marginInlineStart: 2 }} />} <span style={{ fontSize: 12, color: PH[phase].c, fontWeight: 600, marginInlineStart: 4 }}>{tr(PH[phase].t)}</span></div>
        <div className="orch-sub">{SHOW_UC ? orchCfg.uc + " · " : ""}run {orchCfg.run} · {tr(orchCfg.agent)}</div>
        <div className="ctx-chips" style={{ marginBottom: 4 }}>{orchCfg.chips.map((chip, index) => <span className="chip gray" key={index}>{chip}</span>)}</div>
        <div className="orch-body" ref={bodyRef}>
          {!sent && <div className="orch-empty">
            <div>{tr({ en: "Type a request below — the orchestrator runs the agent timeline, then returns a human-in-the-loop review.", ar: "اكتب طلباً بالأسفل — يشغّل المنسّق الخط الزمني للوكلاء ثم يعيد مراجعة بشرية.", zh: "在下方输入请求——编排器会运行智能体时间线,随后返回人工审批。" })}</div>
            <div className="orch-sugs">{orchCfg.prompts.map((p, i) => (<button className="orch-sug" key={i} onClick={() => choosePrompt(p)}>↗ {tr(p.t)}</button>))}</div>
          </div>}
          {sent && <div className="chat-msg user"><div className="bubble">{sent}</div></div>}
          {stage === "think" && <div className="msg bot think-msg">
            <div className="av">✦</div>
            <div className="bubble"><div className="think">{THINK_STEPS.map((s, i) => { const st = thk[i]; const stt = st === "done" ? "ok" : st === "think" ? "act" : "";
              return (<div className={"tl " + stt} key={i}><span className="ti">{st === "done" ? "✓" : st === "think" ? "◐" : "○"}</span><span>{tr(s)}</span></div>); })}</div></div>
          </div>}
          {stage === "timeline" && <div className="chat-msg bot">
            <div className="ws-sec-h">{tr({ en: "Agent timeline", ar: "خط زمن الوكلاء", zh: "智能体时间线" })}</div>
            <div className="tl">{orchCfg.tlMeta.map((e, i) => { const st = tl[i]; const cur = st === "think";
              return (<div className={"ev" + (cur ? " cur" : "")} key={i}>
                <span className={"dotc " + (st === "done" ? "done" : st === "think" ? "think" : "")}>{st === "done" ? "✓" : st === "think" ? "◐" : ""}</span>
                <div className="et">{ucl(e.code, tr(e.t))} {st === "queued" ? <span className="chip gray">{tr({ en: "queued", ar: "في الانتظار", zh: "排队" })}</span> : st === "think" ? <span className="chip info">{tr({ en: "thinking…", ar: "يفكّر…", zh: "思考中…" })}</span> : <span className="chip">{tr({ en: "done", ar: "تم", zh: "完成" })}</span>}</div>
                <div className="es">{tr(e.s)}</div>
              </div>); })}</div>
          </div>}
          {(phase === "review" || phase === "approved" || phase === "returned") && <div className="chat-msg bot">
            {(phase === "review" || phase === "approved") && <OrchSmartResult item={activeSmartItem} />}
            {(phase === "review" || phase === "approved") && <div className="hitl">
              <div className="hh">⚑ {tr({ en: "HUMAN-IN-THE-LOOP REVIEW", ar: "مراجعة بشرية إلزامية", zh: "人工审批" })}</div>
              <div className="hb">{tr(orchCfg.reviewBody)}</div>
              {phase === "approved"
                ? <span className="chip">✓ {tr(orchCfg.approvedChip)}</span>
                : <React.Fragment><div className="hitl-btns"><button className="btn" onClick={approve}>✓ {tr(orchCfg.approveLabel)}</button><button className="btn danger sm" onClick={returnFix}>↺ {tr({ en: "Return for fix", ar: "إعادة للتصحيح", zh: "退回修正" })}</button><button className="btn ghost sm" onClick={() => setShowDiff(v => !v)}>⌥ {tr({ en: "View diff", ar: "عرض الفرق", zh: "查看差异" })}</button></div>
                  {showDiff && <div className="diffbox">{orchCfg.diff.map((d, i) => (<div className={"dl " + d.k} key={i}>{d.k === "rem" ? "− " : "+ "}{tr(d.t)}</div>))}</div>}</React.Fragment>}
            </div>}
            {phase === "returned" && <div className="hitl ret">
              <div className="hh">↺ {tr({ en: "RETURNED FOR FIX", ar: "أُعيد للتصحيح", zh: "已退回修正" })}</div>
              <div className="hb">{tr(orchCfg.returnBody)}</div>
            </div>}
            {(phase === "review" || phase === "approved") && <OrchNext items={activeNextActions} />}
          </div>}
        </div>
        <div className="orch-bar">
          <textarea className="orch-cin" rows={1} value={prompt} disabled={phase === "running"} onChange={e => { setPrompt(e.target.value); setQueuedSmartItem(null); }} placeholder={tr(orchCfg.defaultPrompt)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runOrch(); } }} />
          <button className="orch-send" disabled={phase === "running" || !prompt.trim()} onClick={runOrch}>{phase === "running" ? "…" : "SEND"}</button>
        </div>
      </div></div>
      <div className="ws-flowcard" onClick={() => setRoute("rcdata")} title={tr({ en: "Open Multi-Agent Flow", ar: "فتح تدفّق الوكلاء", zh: "打开多智能体流程" })}>
        <div className="ws-flowcard-h"><span>{tr({ en: "Multi-Agent Flow", ar: "تدفّق متعدد الوكلاء", zh: "多智能体流程" })}</span><span className="ws-flowcard-hr"><span className="at-tip at-tip-r" onClick={(e) => e.stopPropagation()} aria-label={tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })} tabIndex={0}>i<span className="at-tip-pop">{tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })}</span></span><span className="open">↗</span></span></div>
        <svg className="ws-flowthumb" viewBox="0 0 300 44" fill="none" preserveAspectRatio="xMidYMid meet">
          <rect x="4" y="5" width="20" height="7" rx="2" fill="#f1ecfa" /><rect x="4" y="14" width="20" height="7" rx="2" fill="#f1ecfa" /><rect x="4" y="23" width="20" height="7" rx="2" fill="#f1ecfa" /><rect x="4" y="32" width="20" height="7" rx="2" fill="#f1ecfa" />
          <rect x="40" y="12" width="28" height="20" rx="4" fill="#fff" stroke="#5b3a9e" strokeWidth="1.4" />
          <rect x="86" y="5" width="40" height="9" rx="2.5" fill="#5b3a9e" /><rect x="86" y="18" width="40" height="9" rx="2.5" fill="#f3eefb" stroke="#e4d7fb" strokeWidth="0.8" /><rect x="86" y="31" width="40" height="9" rx="2.5" fill="#f3eefb" stroke="#e4d7fb" strokeWidth="0.8" />
          <rect x="138" y="16" width="20" height="12" rx="3.5" fill="#f3eefb" stroke="#e4d7fb" strokeWidth="0.8" />
          <rect x="172" y="9" width="50" height="26" rx="5" fill="#5b3a9e" /><circle cx="197" cy="22" r="4" fill="#fff" />
          <rect x="236" y="11" width="40" height="9" rx="2.5" fill="#e9f7ef" stroke="#bfe6cf" strokeWidth="0.8" /><rect x="236" y="24" width="40" height="9" rx="2.5" fill="#fdf4d9" stroke="#f0dca6" strokeWidth="0.8" />
          <g stroke="#c2cbd6" strokeWidth="1"><path d="M24 22 H40" /><path d="M68 22 H86" /><path d="M126 22 H138" /><path d="M158 22 H172" /><path d="M222 22 H236" /></g>
        </svg>
      </div>
      </div>
    </div>
  </div></div>);
}

/* ======= UC-12 · Costs, Assignment Orders & Funds — mode-driven console ======= */
const CF_LOGS = [
  { tm: "10:02", code: "UC-01", h: { en: "Data Querying", ar: "استعلام البيانات", zh: "数据查询" }, d: { en: "Matched 1,840 payment orders ↔ Etimad records · 0.9s", ar: "طابق 1,840 أمر دفع ↔ سجلات اعتماد · 0.9 ث", zh: "匹配 1,840 付款单 ↔ Etimad 记录 · 0.9s" }, dot: "blue" },
  { tm: "10:03", h: { en: "Data Querying", ar: "استعلام البيانات", zh: "数据查询" }, d: { en: "Reconciled 4 cash requests with payment orders & invoices", ar: "سوّى 4 طلبات نقدية مع أوامر الدفع والفواتير", zh: "对账 4 现金申请 ↔ 付款单 ↔ 发票" }, dot: "blue" },
  { tm: "10:04", h: { en: "Financial Reports Gen.", ar: "توليد التقارير", zh: "财务报告生成" }, d: { en: "Allocated SAR 2.14B project cost across 1,780 units", ar: "وزّع 2.14 مليار على 1,780 وحدة", zh: "将 SAR 2.14B 项目成本分摊至 1,780 单元" }, dot: "blue" },
  { tm: "10:05", h: { en: "Anomaly Detection", ar: "كشف الشذوذ", zh: "异常检测" }, d: { en: "Flagged INV-3410 (no completion certificate) · blocks approval", ar: "رصد INV-3410 (لا شهادة إنجاز) · يمنع الاعتماد", zh: "标记 INV-3410(缺完工证明)· 阻断审批" }, dot: "amber" },
  { tm: "10:06", code: "UC-12", h: { en: "Anomaly Detection", ar: "كشف الشذوذ", zh: "异常检测" }, d: { en: "Idle surplus SAR 85M traced to AO-2207 (Real-Estate Dev.)", ar: "فائض خامل 85 مليون يُعزى إلى AO-2207", zh: "闲置结余 SAR 85M 追溯至 AO-2207(房地产基金)" }, dot: "violet" },
  { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting user follow-up question", ar: "بانتظار سؤال متابعة", zh: "等待用户追问" }, dot: "gray" },
];
const CF_REC = [
  { t: { en: "Release SAR 85M idle surplus (AO-2207)", ar: "الإفراج عن فائض خامل 85 مليون (AO-2207)", zh: "释放 SAR 85M 闲置结余(AO-2207)" }, d: { en: "120 days with no disbursement and the milestone delivered. Releasing returns liquidity to the Real-Estate Dev. Fund and clears the open UC-03 audit flag on the order.", ar: "120 يوماً بلا صرف والمرحلة منجزة؛ الإفراج يعيد السيولة ويغلق ملاحظة التدقيق.", zh: "120 天无支付且里程碑已交付。释放将流动性返还房地产开发基金,并清除该单 UC-03 审计标记。" } },
  { t: { en: "Chase completion certificates — 9 aged orders (> 90d)", ar: "متابعة شهادات إنجاز لـ 9 أوامر (> 90 يوماً)", zh: "催办 9 个逾期(>90天)派工单完工证明" }, d: { en: "Missing certificates block final payment and capitalization. Closing them out unblocks ~SAR 60M in pending closeouts and prevents a quarter-end backlog.", ar: "غياب الشهادات يعيق الدفع والرسملة؛ إغلاقها يفكّ نحو 60 مليون معلّقة.", zh: "缺证阻塞尾款与资本化。结清释放约 SAR 60M 待结算项,避免季末积压。" } },
  { t: { en: "Resolve the 2% SAP↔Etimad mismatch (SAR 25M)", ar: "حل عدم تطابق ساب↔اعتماد 2% (25 مليون)", zh: "解决 2% SAP↔Etimad 差异(SAR 25M)" }, d: { en: "Two reconciliation items — Esnad assignment (+SAR 15M) and Tahseel revenue (−SAR 12M). Proposed adjusting entries align book-to-system within tolerance before close.", ar: "بندان — إسناد (+15) وتحصيل (−12)؛ القيود المقترحة توائم الدفتري مع النظام قبل الإقفال.", zh: "两项差异——Esnad 派工(+SAR 15M)与 Tahseel 收入(−SAR 12M)。建议调整分录关账前于容差内对齐。" } },
];
function CostFundsConsole() {
  const { tr, setRoute, pushLog, setDeptSub, setAlertsOpen, backRoute, setBackRoute } = useStore();
  const [mode, setMode] = useState("ao");
  const [qaOpen, setQaOpen] = useState(false);
  const [feed, setFeed] = useState(CF_LOGS);
  const logRef = useRef(null);
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => { n++; const base = CF_LOGS[n % CF_LOGS.length]; const tm = "10:" + String((6 + n) % 60).padStart(2, "0"); setFeed(f => [...f.slice(-7), { ...base, tm }]); }, 2300);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [feed]);
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, PARA = { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, DOWN = { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, THISP = { en: "THIS", ar: "هذه", zh: "本环节" };
  const CF_CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Data Consolidation & Quality", ar: "توحيد البيانات وجودتها", zh: "数据整合与质量" } },
    { code: "UC-13", pos: UP, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: UP, name: { en: "Performance / Anomaly", ar: "الأداء / الانحرافات", zh: "绩效 / 异常" } },
    { code: "UC-14", pos: UP, name: { en: "Assets & Capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" } },
    { code: "UC-12", here: true, pos: THISP, name: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" } },
    { code: "UC-11", pos: PARA, name: { en: "Compliance & Memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" } },
    { code: "UC-10 / UC-03", pos: DOWN, name: { en: "Reporting / Smart Query", ar: "التقارير / الاستعلام", zh: "报告 / 智能查询" } },
  ];
  const CF_SOURCES = [
    { n: "Esnad", s: "loading" }, { n: "Etimad", s: "synced" }, { n: "SAP", s: "synced" }, { n: "Invoices", s: "synced" }, { n: "Completion Certificates", s: "synced" },
    { n: "Liquidity Requests", s: "synced" }, { n: "Payment Orders", s: "synced" }, { n: "Bank Statements", s: "synced" }, { n: "Dev. Fund Agreements", s: "synced" },
  ];
  const CF_ROLES = [
    { n: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, s: { en: "Matches cash requests ↔ payment orders ↔ invoices across Esnad, Etimad, SAP", ar: "يطابق الطلبات النقدية ↔ أوامر الدفع ↔ الفواتير", zh: "跨 Esnad/Etimad/SAP 匹配 现金申请↔付款单↔发票" }, st: "running" },
    { n: { en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成智能体" }, s: { en: "Calculates unit/land cost & consideration; builds fund reports with aging", ar: "يحسب تكلفة الوحدة والمقابل؛ ويبني تقارير الصناديق", zh: "计算单元/地块成本与对价;生成基金 Aging 报告" }, st: "active" },
    { n: { en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测智能体" }, s: { en: "Flags SAP↔document discrepancies, missing certs & dormant surplus", ar: "يرصد فروق ساب↔المستندات والشهادات المفقودة والفائض الخامل", zh: "标记 SAP↔单据差异、缺证与闲置结余" }, st: "active" },
  ];
  const MODES = [
    { k: "ao", t: { en: "Assignment Orders", ar: "أوامر الإسناد", zh: "派工单" } },
    { k: "unit", t: { en: "Unit Cost", ar: "تكلفة الوحدة", zh: "单元成本" } },
    { k: "ind", t: { en: "Industrial Fund", ar: "الصندوق الصناعي", zh: "工业基金" } },
    { k: "ref", t: { en: "Real Estate Fund", ar: "صندوق العقار", zh: "房地产基金" } },
  ];
  const rbadge = (st) => st === "running" ? <span className="wb-badge run">{tr({ en: "running", ar: "يعمل", zh: "运行中" })}</span> : <span className="wb-badge act">{tr({ en: "active", ar: "نشط", zh: "活动" })}</span>;
  const cst = (k) => ({ ok: { en: "matched", ar: "مطابق", zh: "已匹配" }, ver: { en: "verified", ar: "مُتحقق", zh: "已核验" }, blk: { en: "blocked · no cert", ar: "محظور · لا شهادة", zh: "阻断 · 缺证" }, nc: { en: "non-compliant · Δ amount", ar: "غير مطابق · فرق مبلغ", zh: "不合规 · 金额差" } }[k]);
  return (<div className="fade wb">
    <div className="card pad wb-frame">
    {/* HEADER */}
    <div className={backRoute ? "card pad wb-head" : "wb-head"}>
      <div><div className="dw-eyebrow g" style={{ marginBottom: 4 }}>{tr({ en: "Department Workspace · operating", ar: "مساحة عمل الإدارة · تشغيلي", zh: "部门工作区 · 运营" })}</div><div className="wb-title" style={{ fontSize: 21 }}>{backRoute && <button className="pg-back" onClick={() => { const b = backRoute; setBackRoute(null); setRoute(b); }}>‹</button>}<span className="wb-dot violet" /> {tr({ en: "Cost Management Department", ar: "إدارة التكاليف", zh: "成本管理部" })} · {tr({ en: "Costs & Funds Console", ar: "وحدة التكاليف والصناديق", zh: "成本与资金控制台" })}<button className="al-bell" onClick={() => setAlertsOpen(true)} title={ucl("UC-02", tr({ en: "Alerts & Exceptions Center", ar: "مركز التنبيهات", zh: "告警与异常中心" }))}>🔔 <span>1</span></button></div>
        <div className="wb-subt">{ucl("UC-12", tr({ en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }))} · {tr({ en: "Operating type — matching & calculation + cross-dept hand-off", ar: "نوع تشغيلي — مطابقة واحتساب + تسليم بين الإدارات", zh: "运营生产型 — 匹配核算 + 跨部门交付" })}</div></div>
      <SmartQueryFab route="csfunds" scope={{ en: "Scope: Cost & Funds · read-only", ar: "النطاق: التكاليف · للقراءة", zh: "范围:成本与资金 · 只读" }} prompts={[{ en: "Why is AO-2207 surplus idle?", ar: "لماذا فائض AO-2207 خامل؟", zh: "AO-2207 结余为何闲置?" }, { en: "Which AOs lack completion certificates?", ar: "ما الأوامر بلا شهادات إنجاز؟", zh: "哪些派工单缺完工证明?" }, { en: "Resolve the SAP ↔ Etimad difference", ar: "تسوية فرق ساب↔اعتماد", zh: "对平 SAP↔Etimad 差异" }]} />
      <div className="wb-chain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{CF_CHAIN.map((c, i) => (<React.Fragment key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></React.Fragment>))}</div>
    </div>
    {/* INSIGHT & NEXT ACTIONS */}
    <div className="wb-actbar">
      <div className="wb-ab-top">
        <div className="wb-ab-spark">✦</div>
        <div className="wb-ab-tt">
          <div><span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span><span className="wb-ab-meta">{SHOW_UC ? "UC-12 · " : ""}run #3402 · {tr({ en: "Costs & Funds agent", ar: "وكيل التكاليف والصناديق", zh: "成本与资金智能体" })}</span></div>
          <div className="wb-ab-insight"><Hi t={tr({ en: "A ~~SAR 85M idle surplus~~ traces to **AO-2207** (Real-Estate Dev. Fund) — **120 days** without disbursement despite a delivered milestone, eligible for release. SAP↔Etimad matching is **98%**, leaving a ~~SAR 25M (2%) reconciliation gap~~ over 2 items (Esnad +15M · Tahseel −12M). **9 assignment orders > 90 days** still lack completion certificates, blocking **~SAR 60M** in closeouts.", ar: "~~فائض خامل 85 مليون~~ يُعزى إلى **AO-2207** — **120 يوماً** بلا صرف رغم إنجاز المرحلة. مطابقة ساب↔اعتماد **98%**، وتبقى ~~فجوة تسوية 25 مليون (2%)~~ عبر بندين (إسناد +15 · تحصيل −12). **9 أوامر إسناد > 90 يوماً** بلا شهادات إنجاز، ما يعيق **~60 مليون**.", zh: "~~SAR 85M 闲置结余~~ 追溯至 **AO-2207**(房地产开发基金)——**120 天** 无支付但里程碑已交付,可释放。SAP↔Etimad 对账率 **98%**,尚余 ~~SAR 25M(2%)对账差异~~,涉 2 项(Esnad +15M · Tahseel −12M)。**9 个派工单逾期 >90 天** 仍缺完工证明,阻塞 **约 SAR 60M** 结算。" })} /></div>
        </div>
      </div>
      <div className="wb-ab-rows">
        <div className="wb-ab-col">
          <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
          <div className="wb-sugs">{CF_REC.map((n, i) => (<button className="wb-sug" key={i} onClick={() => { pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) }); setQaOpen(true); }}><span className="pr">{i + 1}</span><span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span></button>))}</div>
        </div>
        <div className="wb-ab-col r">
          <div className="wb-ab-h">➜ {tr({ en: "HAND OFF DOWNSTREAM · actions", ar: "تسليم لاحق · إجراءات", zh: "下游交接 · 动作" })}</div>
          <div className="wb-ctas">
            <button className="wb-cta p" onClick={() => { setBackRoute("csfunds"); setRoute("reports"); }}>{SHOW_UC && <span className="uc">UC-10</span>}{tr({ en: "Open Fund & Cost Report", ar: "فتح تقرير التكاليف والصناديق", zh: "打开成本与资金报告" })}<span className="ar">→</span></button>
            <button className="wb-cta s" onClick={() => { setBackRoute("csfunds"); setRoute("compmemo"); }}>{SHOW_UC && <span className="uc">UC-11</span>}{tr({ en: "Raise Compliance / Accounting Memo", ar: "إصدار مذكرة امتثال / محاسبية", zh: "发起合规 / 会计备忘" })}<span className="ar">→</span></button>
          </div>
        </div>
      </div>
    </div>
    {/* RANGE SELECTION + Type of analysis */}
    <div className="cs-range">
      <span className="cs-talab">{tr({ en: "SCOPE", ar: "النطاق", zh: "作用域" })}</span>
      <div className="wb-field" title="Assignment / Initiative / Fund / Project"><div className="fl">{tr({ en: "Object type", ar: "نوع الكائن", zh: "对象类型" })}</div><div className="fv">{tr({ en: "Assignment", ar: "أمر إسناد", zh: "派工单" })} ▾</div></div>
      <div className="wb-field"><div className="fl">{tr({ en: "Value", ar: "القيمة", zh: "取值" })}</div><div className="fv">🔍 AO-2207 ▾</div></div>
      <span className="cs-rdiv" />
      <span className="cs-talab">{tr({ en: "TYPE OF ANALYSIS", ar: "نوع التحليل", zh: "分析类型" })}</span>
      <div className="cs-seg">{MODES.map(m => <button key={m.k} className={mode === m.k ? "on" : ""} onClick={() => setMode(m.k)}>{tr(m.t)}</button>)}</div>
      <span className="cs-rdiv" />
      <div className="wb-field"><div className="fl">{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div className="fv">FY 2026 · Q1 ▾</div></div>
    </div>
    <div className="cs-hint">{tr({ en: "Scope object = Assignment · Initiative · Fund · Project (what to analyze); Type of analysis = which view to render.", ar: "كائن النطاق = أمر إسناد · مبادرة · صندوق · مشروع؛ نوع التحليل = العرض المطلوب.", zh: "作用域对象 = 派工单 · 倡议 · 基金 · 项目(选对象);分析类型 = 渲染哪种视图。" })}</div>

    {/* ===== MODE: ASSIGNMENT ORDERS ===== */}
    {mode === "ao" && <React.Fragment>
      <div className="cs-banner"><span className="ic">!</span><div><b>{tr({ en: "Financial approval blocked.", ar: "تم منع الاعتماد المالي.", zh: "财务审批已阻断。" })}</b> {tr({ en: "1 invoice without completion certificate — INV-3410 (SAR 17M).", ar: "فاتورة بلا شهادة إنجاز — INV-3410 (17 مليون).", zh: "1 张发票缺完工证明 — INV-3410(SAR 17M)。" })}</div></div>
      <div className="wb-sech"><h2>{tr({ en: "Matching & Calculation", ar: "المطابقة والاحتساب", zh: "匹配与核算" })}</h2><div className="muted">{tr({ en: "assignment-order value · 3-way match · consideration", ar: "قيمة أمر الإسناد · مطابقة ثلاثية · المقابل", zh: "派工单价值 · 三方匹配 · 对价" })}</div></div>
      <div className="cs-ao">
        <div className="cs-aoh"><span className="cs-aoid">AO-2207</span><span className="cs-tag">{tr({ en: "Real-Estate Dev. Fund", ar: "صندوق العقار", zh: "房地产开发基金" })}</span><span className="cs-tag">Agreement REDF-2024-07</span><span className="cs-warn">{tr({ en: "120 days · no disbursement", ar: "120 يوماً · بلا صرف", zh: "120 天 · 无支付" })}</span></div>
        <div className="cs-aob">
          <div className="cs-mi"><div className="l">{tr({ en: "Original value", ar: "القيمة الأصلية", zh: "原值" })}</div><div className="v"><Money v="SAR 320M" /></div></div>
          <div className="cs-mi"><div className="l">{tr({ en: "Modified value", ar: "القيمة المعدّلة", zh: "修改值" })}</div><div className="v"><Money v="SAR 320M" /></div></div>
          <div className="cs-mi"><div className="l">{tr({ en: "Spent", ar: "المصروف", zh: "已花" })}</div><div className="v"><Money v="SAR 235M" /> <span style={{ fontSize: 11, color: "var(--muted)" }}>(73%)</span></div></div>
          <div className="cs-mi"><div className="l">{tr({ en: "Idle surplus", ar: "فائض خامل", zh: "闲置结余" })}</div><div className="v hot"><Money v="SAR 85M" /></div></div>
        </div>
      </div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "3-way Match · Cash Request ↔ Payment Order ↔ Invoice", ar: "مطابقة ثلاثية · طلب نقدي ↔ أمر دفع ↔ فاتورة", zh: "三方匹配 · 现金申请 ↔ 付款单 ↔ 发票" })}</b><span className="wb-pm">{tr({ en: "cert verified per invoice", ar: "شهادة لكل فاتورة", zh: "每张发票需完工证明" })}</span></div>
        <div className="wb-pb"><table className="wb-table"><thead><tr><th>{tr({ en: "CASH REQ.", ar: "طلب نقدي", zh: "现金申请" })}</th><th></th><th>{tr({ en: "PAYMENT ORDER", ar: "أمر الدفع", zh: "付款单" })}</th><th></th><th>{tr({ en: "INVOICE", ar: "الفاتورة", zh: "发票" })}</th><th>{tr({ en: "CERT.", ar: "شهادة", zh: "证明" })}</th><th>{tr({ en: "AMOUNT", ar: "المبلغ", zh: "金额" })}</th><th>{tr({ en: "STATUS", ar: "الحالة", zh: "状态" })}</th></tr></thead>
          <tbody>
            <tr><td className="mono">CR-5521</td><td className="cs-arrl">↔</td><td className="mono">PO-8841</td><td className="cs-arrl">↔</td><td className="mono">INV-3401</td><td className="mono">CC-1190</td><td><Money v="SAR 60M" /></td><td><span className="cs-st ok">{tr(cst("ok"))}</span></td></tr>
            <tr><td className="mono">CR-5522</td><td className="cs-arrl">↔</td><td className="mono">PO-8847</td><td className="cs-arrl">↔</td><td className="mono">INV-3402</td><td className="mono">CC-1191</td><td><Money v="SAR 32M" /></td><td><span className="cs-st ok">{tr(cst("ok"))}</span></td></tr>
            <tr><td className="mono">CR-5530</td><td className="cs-arrl">↔</td><td className="mono" style={{ color: "#b7791f" }}>{tr({ en: "PO pending", ar: "أمر معلّق", zh: "付款单待定" })}</td><td className="cs-arrl">↔</td><td className="mono">INV-3410</td><td className="mono" style={{ color: "var(--danger)", fontWeight: 700 }}>✗</td><td><Money v="SAR 17M" /></td><td><span className="cs-st bad">{tr(cst("blk"))}</span></td></tr>
            <tr><td className="mono">CR-5533</td><td className="cs-arrl">↔</td><td className="mono">PO-8860</td><td className="cs-arrl">↔</td><td className="mono">INV-3415</td><td className="mono">CC-1205</td><td><Money v="SAR 12M" /></td><td><span className="cs-st bad">{tr(cst("nc"))}</span></td></tr>
          </tbody></table>
          <div className="wb-tfoot"><span>{tr({ en: "Cash request matched to its payment order and invoice in one row; cert column blocks approval when missing.", ar: "كل طلب مطابق لأمر دفعه وفاتورته في صف واحد؛ عمود الشهادة يمنع الاعتماد عند غيابها.", zh: "每行同时对上付款单与发票;缺完工证明则在证明列阻断审批。" })}</span></div>
        </div></div>
      <div className="cs-calc"><div><div className="cl">{tr({ en: "Financial Consideration", ar: "المقابل المالي", zh: "财务对价" })}</div><div className="cs2">{tr({ en: "By order classification & agreement REDF-2024-07 · not a flat % (BR-01)", ar: "حسب التصنيف والاتفاقية · ليس نسبة ثابتة (BR-01)", zh: "按分类与协议 REDF-2024-07 计算 · 非固定百分比(BR-01)" })}</div></div><div className="cv"><Money v="SAR 312M" /></div></div>
    </React.Fragment>}

    {/* ===== MODE: UNIT COST ===== */}
    {mode === "unit" && <React.Fragment>
      <div className="wb-sech"><h2>{tr({ en: "Unit / Land Cost — distribution", ar: "تكلفة الوحدة / الأرض — التوزيع", zh: "单元 / 地块成本 — 分摊" })}</h2><div className="muted">{tr({ en: "project cost distributed by area / number of units", ar: "توزيع تكلفة المشروع حسب المساحة / عدد الوحدات", zh: "项目成本按面积 / 套数分摊" })}</div></div>
      <div className="cs-check">{tr({ en: "Project cost", ar: "تكلفة المشروع", zh: "项目成本" })} <b><Money v="SAR 2.40B" /></b> <span className="eq">= Σ {tr({ en: "unit/land cost", ar: "تكلفة الوحدة/الأرض", zh: "单元/地块成本" })}</span> <b><Money v="SAR 2.14B" /></b> <span className="eq">+ {tr({ en: "unallocated", ar: "غير موزّع", zh: "未分摊" })}</span> <b><Money v="SAR 0.26B" /></b><span className="bdg">Δ SAR 0.26B · {tr({ en: "review (BR-03)", ar: "مراجعة (BR-03)", zh: "复核(BR-03)" })}</span></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Cost distribution", ar: "توزيع التكلفة", zh: "成本分摊" })}</b><span className="wb-pm">{tr({ en: "project: Housing Cluster R-12", ar: "مشروع: مجمّع R-12", zh: "项目:Housing Cluster R-12" })}</span></div>
        <div className="wb-pb"><table className="wb-table"><thead><tr><th>{tr({ en: "COMPONENT", ar: "المكوّن", zh: "组成" })}</th><th>{tr({ en: "UNITS / AREA", ar: "وحدات / مساحة", zh: "套数 / 面积" })}</th><th>{tr({ en: "COST", ar: "التكلفة", zh: "成本" })}</th><th>{tr({ en: "PER UNIT", ar: "لكل وحدة", zh: "每单元" })}</th></tr></thead>
          <tbody>
            <tr><td>{tr({ en: "Plot A", ar: "قطعة A", zh: "地块 A" })}</td><td>{tr({ en: "320 units", ar: "320 وحدة", zh: "320 套" })}</td><td><Money v="SAR 0.78B" /></td><td><Money v="SAR 2.44M" /></td></tr>
            <tr><td>{tr({ en: "Plot B", ar: "قطعة B", zh: "地块 B" })}</td><td>{tr({ en: "260 units", ar: "260 وحدة", zh: "260 套" })}</td><td><Money v="SAR 0.61B" /></td><td><Money v="SAR 2.35M" /></td></tr>
            <tr><td>{tr({ en: "Shared infrastructure", ar: "بنية تحتية مشتركة", zh: "共用基础设施" })}</td><td>{tr({ en: "allocated", ar: "موزّع", zh: "已分摊" })}</td><td><Money v="SAR 0.45B" /></td><td>—</td></tr>
            <tr><td>{tr({ en: "Land acquisition", ar: "اقتناء الأرض", zh: "土地取得" })}</td><td>{tr({ en: "by area", ar: "حسب المساحة", zh: "按面积" })}</td><td><Money v="SAR 0.30B" /></td><td>—</td></tr>
            <tr><td style={{ color: "var(--danger)" }}>{tr({ en: "Unallocated (review)", ar: "غير موزّع (مراجعة)", zh: "未分摊(复核)" })}</td><td>—</td><td><Money v="SAR 0.26B" /></td><td>—</td></tr>
          </tbody></table></div></div>
    </React.Fragment>}

    {/* ===== MODE: FUND (industrial / real-estate) ===== */}
    {(mode === "ind" || mode === "ref") && (() => {
      const F = mode === "ind"
        ? { name: { en: "Industrial Development Fund", ar: "صندوق التنمية الصناعية", zh: "工业发展基金" }, bal: "SAR 0.54B", com: "SAR 0.40B", avl: "SAR 0.14B", idle: "SAR 0", ag: [["Current", 100, "0.42B"], ["31–60", 34, "0.07B"], ["61–90", 18, "0.03B"], ["90+", 12, "0.02B"]], match: "99%", diff: 1 }
        : { name: { en: "Real-Estate Development Fund", ar: "صندوق التطوير العقاري", zh: "房地产开发基金" }, bal: "SAR 0.92B", com: "SAR 0.64B", avl: "SAR 0.28B", idle: "SAR 85M", ag: [["Current", 100, "0.50B"], ["31–60", 42, "0.11B"], ["61–90", 30, "0.08B"], ["90+", 20, "0.05B"]], match: "98%", diff: 2 };
      return (<React.Fragment>
        <div className="wb-sech"><h2>{tr(F.name)}</h2><div className="muted">{tr({ en: "balance · aging & repayment · reconciliation", ar: "الرصيد · التقادم والسداد · المطابقة", zh: "余额 · 账龄与还款 · 对账" })}</div></div>
        <div className="cs-fcards">
          <div className="cs-fc"><div className="l">{tr({ en: "Balance", ar: "الرصيد", zh: "余额" })}</div><div className="v"><Money v={F.bal} /></div></div>
          <div className="cs-fc"><div className="l">{tr({ en: "Committed", ar: "ملتزم", zh: "已承诺" })}</div><div className="v"><Money v={F.com} /></div></div>
          <div className="cs-fc"><div className="l">{tr({ en: "Available", ar: "متاح", zh: "可用" })}</div><div className="v"><Money v={F.avl} /></div></div>
          <div className="cs-fc"><div className="l">{tr({ en: "Idle surplus", ar: "فائض خامل", zh: "闲置结余" })}</div><div className={"v" + (F.idle !== "SAR 0" ? " hot" : "")}><Money v={F.idle} /></div></div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Aging Report — loans / repayment", ar: "تقرير التقادم — القروض / السداد", zh: "Aging 报告 — 贷款 / 还款" })}</b></div>
          <div className="wb-pb">
            <div className="km-aging">{F.ag.map((b, i) => (<div className="ab" key={i}><div className="abar" style={{ background: "#ece7f5" }}><i style={{ width: b[1] + "%", background: i === 3 ? "#dc2626" : "#7c3aed" }} /></div><div className="at">{b[0]}</div><div className="av"><Money v={"SAR " + b[2]} /></div></div>))}</div>
            <div className="cs-recon"><span className="cs-st ok">{F.match} {tr({ en: "matched", ar: "مطابق", zh: "已对平" })}</span> Bank ↔ SAP ↔ docs · <span style={{ color: "#b7791f", fontWeight: 700 }}>{F.diff} {tr({ en: "difference(s) to review (BR-04)", ar: "فروق للمراجعة (BR-04)", zh: "项差异待复核(BR-04)" })}</span></div>
          </div></div>
      </React.Fragment>);
    })()}

    {/* ===== CROSS-CUTTING ===== */}
    <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Surpluses · source → destination", ar: "الفوائض · المصدر → الوجهة", zh: "结余 · 来源 → 去向" })}</b><span className="wb-pm">{tr({ en: "traceable (BR-02)", ar: "قابل للتتبع (BR-02)", zh: "可追溯(BR-02)" })}</span></div>
      <div className="wb-pb">
        <div className="cs-drill"><span className="cs-node">AO-2207 · {tr({ en: "Real-Estate Dev.", ar: "العقار", zh: "房地产" })}</span><span className="cs-arrl">→</span><span className="cs-node">{tr({ en: "Central Liquidity Pool", ar: "مجمع السيولة المركزي", zh: "中央流动性池" })}</span><span style={{ marginInlineStart: "auto", fontWeight: 800, color: "var(--danger)" }}><Money v="SAR 85M" /> {tr({ en: "idle", ar: "خامل", zh: "闲置" })}</span></div>
        <div className="wb-kk"><span>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</span><b>{tr({ en: "120 days no activity · milestone delivered", ar: "120 يوماً بلا حركة · أُنجزت المرحلة", zh: "120 天无活动 · 里程碑已交付" })}</b></div>
        <div className="wb-kk"><span>{tr({ en: "Recommendation", ar: "التوصية", zh: "建议" })}</span><b style={{ color: "var(--violet, #6d28d9)" }}>{tr({ en: "Use surplus before requesting new liquidity", ar: "استخدم الفائض قبل طلب سيولة جديدة", zh: "先用结余再申请新流动性" })}</b></div>
      </div></div>

    <div className="cs-approve">
      <button className="btn" disabled>✓ {tr({ en: "Approve assignment order", ar: "اعتماد أمر الإسناد", zh: "批准派工单" })}</button>
      <button className="btn secondary" onClick={() => pushLog({ en: "Surplus reuse recommended", ar: "تمت التوصية بإعادة استخدام الفائض", zh: "已建议复用结余" })}>{tr({ en: "Recommend use of surplus", ar: "التوصية باستخدام الفائض", zh: "建议复用结余" })}</button>
      <button className="btn ghost sm" onClick={() => pushLog({ en: "Flagged for review", ar: "وُسم للمراجعة", zh: "已标记复核" })}>⚑ {tr({ en: "Flag for review", ar: "وسم للمراجعة", zh: "标记复核" })}</button>
      <span className="cs-apnote">{tr({ en: "Approval disabled — 1 invoice missing completion certificate & 1 non-compliant cash request.", ar: "الاعتماد معطّل — فاتورة بلا شهادة وطلب غير مطابق.", zh: "审批禁用 — 1 张发票缺完工证明、1 笔现金申请不合规。" })}</span>
    </div>

    {/* MULTI-AGENT WORKSPACE */}
    <div className="wb-sech"><h2>{tr({ en: "Multi-Agent Workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</h2><div className="muted">{tr({ en: "Orchestrated agent roles & live action timeline", ar: "أدوار وكلاء منسّقة وخط زمني حي", zh: "编排的智能体角色与实时操作时间线" })}</div></div>
    <div className="wb-cols3 wb-work">
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Data Inputs · sources", ar: "مدخلات البيانات · المصادر", zh: "数据输入 · 源系统" })}</b><span className="wb-pm">{tr({ en: "9 systems", ar: "9 أنظمة", zh: "9 个系统" })}</span><button className="wb-impbtn" onClick={() => pushLog({ en: "Manual Excel / CSV / PDF import — temporary source (BR-04)", ar: "استيراد يدوي — مصدر مؤقت (BR-04)", zh: "手动导入 Excel/CSV/PDF — 临时来源(BR-04)" })} title={tr({ en: "Upload Excel/CSV/PDF when an API is unavailable", ar: "رفع ملف عند عدم توفّر الواجهة", zh: "接口不可用时上传文件(临时来源)" })}>⬆ {tr({ en: "Import Excel/CSV", ar: "استيراد Excel/CSV", zh: "导入 Excel/CSV" })}</button></div>
        <div className="wb-pb"><div className="wb-srclist">{CF_SOURCES.map((s, i) => (<div className="wb-src" key={i}><span className={"sd" + (s.s === "loading" ? " load" : "")} /><span className="sn">{s.n}</span><span className="ss">{tr(s.s === "loading" ? { en: "loading", ar: "تحميل", zh: "载入" } : { en: "synced", ar: "متزامن", zh: "已同步" })}</span></div>))}</div></div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Orchestrator · Task Board", ar: "المنسّق · لوحة المهام", zh: "编排器 · 任务板" })}</b><span className="wb-orchpill"><span className="gear">⚙</span>{tr({ en: "Auto-orchestration · 3 agents", ar: "تنسيق تلقائي · 3 وكلاء", zh: "自动编排 · 3 个智能体" })}</span></div>
        <div className="wb-pb">{CF_ROLES.map((r, i) => (<div className={"wb-role " + (r.st === "running" ? "r-violet" : "r-blue")} key={i}><div className="rl"><div className="rt">{tr(r.n)}</div><div className="rs">{tr(r.s)}</div></div>{rbadge(r.st)}</div>))}</div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Agent Timeline · Logs", ar: "خط زمن الوكلاء · السجلات", zh: "智能体时间线 · 日志" })}</b><span className="wb-pm">{tr({ en: "last 5 min", ar: "آخر 5 د", zh: "最近 5 分钟" })}</span></div>
        <div className="wb-pb"><div className="wb-tl" ref={logRef}>{feed.map((e, i) => (<div className={"wb-ev" + (i === feed.length - 1 ? " live" : "")} key={i}><span className={"wb-dot2 " + e.dot} /><div className="wb-eh"><b>{e.tm}</b> · {e.code ? ucl(e.code, tr(e.h)) : tr(e.h)}</div><div className="wb-ed">{tr(e.d)}</div></div>))}</div></div></div>
    </div>

    {/* KEY PRINCIPLE */}
    <div className="wb-keyp"><div className="wb-keyp-tag">!</div><div><div className="wb-keyp-h">{tr({ en: "Surplus traced from the original assignment order to the beneficiary project", ar: "الفائض يُتتبع من أمر الإسناد الأصلي إلى المشروع المستفيد", zh: "结余须从原派工单追溯到受益项目" })}</div><div className="wb-keyp-s">{tr({ en: "Project cost = Σ unit/land cost after adjustments; fund reports reconcile to bank statements, SAP & supporting documents (BR-02 / BR-03 / BR-04).", ar: "تكلفة المشروع = مجموع تكاليف الوحدات بعد التعديلات؛ وتقارير الصناديق تطابق كشوف البنوك وساب والمستندات.", zh: "项目成本 = 调整后各单元/地块成本之和;基金报告须与银行流水、SAP 及单据对账(BR-02 / BR-03 / BR-04)。" })}</div></div></div>

    </div>
  </div>);
}

/* ======= UC-11 · Compliance, Policies & Accounting Memos — Accounting Ruling ======= */
function ComplianceRuling() {
  const { tr, setRoute, pushLog, setDeptSub, backRoute, setBackRoute, setAlertsOpen } = useStore();
  const [caseType, setCaseType] = useState("memo");
  const [pick, setPick] = useState(null);
  const [approved, setApproved] = useState(false);
  const switchCase = (c) => { if (c === caseType) return; setCaseType(c); setPick(null); setApproved(false); };
  const decided = pick !== null;
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, PARA = { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, DOWN = { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, THISP = { en: "THIS", ar: "هذه", zh: "本环节" };
  const CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Data Consolidation & Quality", ar: "توحيد البيانات", zh: "数据整合与质量" } },
    { code: "UC-13", pos: UP, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: UP, name: { en: "Performance / Anomaly", ar: "الأداء / الانحرافات", zh: "绩效 / 异常" } },
    { code: "UC-14", pos: UP, name: { en: "Assets & Capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" } },
    { code: "UC-12", pos: PARA, name: { en: "Costs, Orders & Funds", ar: "التكاليف والصناديق", zh: "成本与资金" } },
    { code: "UC-11", here: true, pos: THISP, name: { en: "Compliance, Policies & Memos", ar: "الامتثال والمذكرات", zh: "合规与会计备忘" } },
    { code: "UC-10 / UC-03", pos: DOWN, name: { en: "Reporting / Smart Query", ar: "التقارير / الاستعلام", zh: "报告 / 智能查询" } },
  ];
  const vText = approved ? { en: "Approved", ar: "معتمد", zh: "已批准" } : decided ? { en: "Ready to approve", ar: "جاهز للاعتماد", zh: "可批准" } : { en: "Needs your call", ar: "بانتظار قرارك", zh: "待你决策" };
  const approve = () => { if (!decided || approved) return; setApproved(true); pushLog({ en: "Accounting memo approved by specialist (UC-11)", ar: "اعتُمدت المذكرة المحاسبية (UC-11)", zh: "会计备忘已由专家批准(UC-11)" }); };
  const opt = (i, sel, rec, title, desc) => (
    <div className={"cr-opt" + (sel ? " sel" : "")} onClick={() => setPick(i)}>{rec && <span className="rec">{tr({ en: "AI suggests", ar: "اقتراح AI", zh: "AI 推荐" })}</span>}
      <div className="ot"><span className="rb" /> {tr(title)}</div><div className="od">{tr(desc)}</div></div>);
  return (<div className="fade wb ws-page">
    <div className="rp-libhd">
      <div className="rp-libL">
      <div className="rp-libtitle">{backRoute && <button className="rp-backbtn" title={tr({ en: "Back", ar: "رجوع", zh: "返回" })} onClick={() => { const b = backRoute; setBackRoute(null); setRoute(b); }}>‹</button>}<div><div className="dw-eyebrow g" style={{ marginBottom: 2 }}>{tr({ en: "Department Workspace · ruling", ar: "مساحة عمل الإدارة · تحكيم", zh: "部门工作区 · 裁决" })}</div><h1 className="rp-h1">{tr({ en: "Accounting Ruling", ar: "قرار محاسبي", zh: "会计裁定" })}{SHOW_UC ? " · UC-11" : ""}</h1></div></div>
      <div className="sub muted" style={{ fontSize: 12.5, marginTop: 3 }}>{tr({ en: "Mandate: compliance, policies & accounting memos (UC-11). Workspace — oversight/ruling type: receives upstream cases, rules with cited basis, human sign-off.", ar: "المهمة: الامتثال والسياسات والمذكرات المحاسبية (UC-11). مساحة العمل — نوع رقابي/تحكيمي.", zh: "职责:合规、政策与会计备忘(UC-11)。Workspace — 监督裁决型:接收上游事项、带依据裁决、人工签核。" })}</div>
      </div>
      <div className="wb-chain rp-headchain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{CHAIN.map((c, i) => (<span className="wb-cseg" key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></span>))}</div>
    </div>
    <SmartQueryFab route="compmemo" scope={{ en: "Scope: Compliance · standards & policies", ar: "النطاق: الامتثال · المعايير", zh: "范围:合规 · 标准与政策" }} prompts={[{ en: "Which IPSAS clause supports this treatment?", ar: "أي بند IPSAS يدعم هذه المعالجة؟", zh: "哪条 IPSAS 支持此处理?" }, { en: "Resolve the useful-life policy conflict", ar: "حل تعارض سياسة العمر الإنتاجي", zh: "解决使用年限政策冲突" }, { en: "Draft a response to the audit observation", ar: "صياغة رد على ملاحظة التدقيق", zh: "起草审计观察回应" }]} />
    <div className="cr-seg">
      <button className={caseType === "memo" ? "on" : ""} onClick={() => switchCase("memo")}>{tr({ en: "Accounting memo · capitalization", ar: "مذكرة محاسبية · رسملة", zh: "会计备忘 · 资本化" })}</button>
      <button className={caseType === "obs" ? "on" : ""} onClick={() => switchCase("obs")}>{tr({ en: "Response to audit observation", ar: "الرد على ملاحظة تدقيق", zh: "回应审计观察" })}</button>
    </div>

    <div className="cr-hdr">
      <div className="cr-hl">
        <h1>{caseType === "memo" ? tr({ en: "Capitalize completed AUC — SAR 1.92B", ar: "رسملة الأصول المكتملة — 1.92 مليار", zh: "已完工在建资产资本化 — SAR 1.92B" }) : tr({ en: "Audit observation AO-22 — AUC depreciation basis", ar: "ملاحظة تدقيق AO-22 — أساس الإهلاك", zh: "审计观察 AO-22 — 在建资产折旧依据" })}</h1>
        <span className="cr-src">📎 {tr({ en: "Raised from", ar: "وارد من", zh: "来自" })} <b>Assets · UC-14</b> · {tr({ en: "auto-prefilled", ar: "تعبئة تلقائية", zh: "自动预填" })}</span><button className="al-bell" onClick={() => setAlertsOpen(true)} title={ucl("UC-02", tr({ en: "Raise / view alert", ar: "رفع / عرض تنبيه", zh: "上报 / 查看告警" }))}>🔔 {tr({ en: "Raise alert", ar: "رفع تنبيه", zh: "上报告警" })}</button>
      </div>
      <div className="cr-trust">
        <div className="cr-tw"><div className="l">{tr({ en: "Verdict", ar: "القرار", zh: "判定" })}</div><div className={"v cr-verdict" + (approved ? " ok" : "")}><span className="d" /> {tr(vText)}</div></div>
        <div className="cr-tdiv" />
        <div className="cr-tw"><div className="l">{tr({ en: "Confidence", ar: "الثقة", zh: "置信度" })}</div><div className="v"><span className="cr-ring"><i>92%</i></span></div></div>
        <div className="cr-tdiv" />
        <div className="cr-tw"><div className="l">{tr({ en: "Sources locked", ar: "مصادر مثبّتة", zh: "版本锁定" })}</div><div className="v" style={{ fontSize: 11.5 }}>🔒 IPSAS 2024 · v2.3</div></div>
      </div>
    </div>

    <div className="cr-grid">
      <div>
        {caseType === "memo" ? <React.Fragment>
          <div className="cr-hero">
            <div className="cr-cap">✦ {tr({ en: "Recommended treatment", ar: "المعالجة الموصى بها", zh: "建议会计处理" })}</div>
            <div className="cr-lead">{tr({ en: "Reclassify SAR 1.92B from assets-under-construction to in-service fixed assets, and depreciate from the in-service date under the approved capitalization policy.", ar: "إعادة تصنيف 1.92 مليار من الأصول تحت الإنشاء إلى أصول في الخدمة، مع الإهلاك من تاريخ التشغيل وفق السياسة المعتمدة.", zh: "将 SAR 1.92B 从在建资产重分类为在用固定资产,并按核定资本化政策自投入使用日起计提折旧。" })}</div>
            <div className="cr-entry">
              <div className="row"><span className="dc">DR</span><span className="acc">{tr({ en: "Fixed Assets — In service", ar: "أصول ثابتة — في الخدمة", zh: "固定资产 — 在用" })} <span className="muted" style={{ fontWeight: 600 }}>16-1200</span></span><span className="amt">1,920,000,000</span></div>
              <div className="vsep" />
              <div className="row"><span className="dc">CR</span><span className="acc">{tr({ en: "Assets under construction", ar: "أصول تحت الإنشاء", zh: "在建资产" })} <span className="muted" style={{ fontWeight: 600 }}>15-3100</span></span><span className="amt">1,920,000,000</span></div>
              <span className="cr-bal">✓ {tr({ en: "Balanced", ar: "متوازن", zh: "借贷平衡" })}</span>
            </div>
            <div className="cr-why"><div className="wl">{tr({ en: "Why — basis (tap to see the clause)", ar: "الأساس — اضغط لعرض البند", zh: "依据 — 点击查看条款" })}</div>
              <details className="cr-cite"><summary>📘 IPSAS 17 · Property, Plant &amp; Equipment <span className="ver">2024</span><span className="chev">▾</span></summary><div className="snip">{tr({ en: "Capitalize when future economic benefits are probable and cost is measurable; significant parts may be depreciated separately.", ar: "الرسملة عند احتمال المنافع وقابلية قياس التكلفة؛ ويجوز إهلاك الأجزاء الجوهرية منفصلة.", zh: "当未来经济利益很可能流入且成本可计量时予以资本化;重要组成部分可分别折旧。" })}</div></details>
              <details className="cr-cite"><summary>📗 Comprehensive Guide · §Capitalization <span className="ver">v2.3</span><span className="chev">▾</span></summary><div className="snip">{tr({ en: "AUC is reclassified to in-service once the milestone is delivered and cost finalized; depreciation begins from the in-service date.", ar: "يُعاد تصنيف الأصل عند إنجاز المرحلة وإنهاء التكلفة؛ ويبدأ الإهلاك من تاريخ التشغيل.", zh: "里程碑交付且成本确定后在建资产重分类入用;折旧自投入使用日起。" })}</div></details>
              <details className="cr-cite"><summary>📄 MoF Instruction 2023-07 <span className="ver">v1.0</span><span className="chev">▾</span></summary><div className="snip">{tr({ en: "A completion certificate is required before any capitalization posting — attached & verified.", ar: "يلزم شهادة إنجاز قبل أي ترحيل رسملة — مرفقة ومُتحقّقة.", zh: "资本化过账前需完工证明——已附并核验。" })}</div></details>
            </div>
          </div>
          <div className="cr-call">
            <div className="ch"><span className="ic">!</span> {tr({ en: "One judgement needed before this can be approved", ar: "قرار واحد مطلوب قبل الاعتماد", zh: "批准前需要你做一个判断" })}</div>
            <div className="desc">{tr({ en: "Useful-life basis conflicts. IPSAS 17 allows component depreciation; internal policy v2.3 uses a single life. The system will not decide this for you (BR-01).", ar: "تعارض في أساس العمر الإنتاجي. IPSAS 17 يسمح بإهلاك المكوّنات؛ والسياسة v2.3 تستخدم عمراً واحداً. النظام لا يقرر نيابة عنك (BR-01).", zh: "使用年限依据冲突:IPSAS 17 允许组件折旧,内部政策 v2.3 用单一年限。系统不会替你决定(BR-01)。" })}</div>
            <div className="cr-opts">
              {opt(0, pick === 0, true, { en: "Apply IPSAS 17 componentization", ar: "تطبيق إهلاك المكوّنات", zh: "采用 IPSAS 17 组件折旧" }, { en: "Depreciate significant parts separately. Aligns to the standard; updates the schedule.", ar: "إهلاك الأجزاء الجوهرية منفصلة؛ متوافق مع المعيار.", zh: "重要部分分别折旧,符合准则;更新折旧表。" })}
              {opt(1, pick === 1, false, { en: "Keep single useful life (v2.3)", ar: "الإبقاء على عمر واحد (v2.3)", zh: "保留单一使用年限(v2.3)" }, { en: "Simpler & consistent with policy, but needs a policy-update note and justification.", ar: "أبسط ومتسق مع السياسة، لكنه يتطلب مذكرة تحديث وتبريراً.", zh: "更简单且符合现行政策,但需政策更新说明与理由。" })}
            </div>
          </div>
        </React.Fragment> : <React.Fragment>
          <div className="cr-call">
            <div className="ch"><span className="ic">!</span> {tr({ en: "Audit Bureau observations to respond to", ar: "ملاحظات ديوان المراقبة", zh: "需回应的审计署观察" })}</div>
            <div className="desc">{tr({ en: "Two observations on the SAR 1.92B capitalization. Draft an initial response per observation; auto-approval is disabled (BR-01).", ar: "ملاحظتان على الرسملة. صُغ رداً أولياً لكل ملاحظة؛ الاعتماد التلقائي معطّل (BR-01).", zh: "针对 SAR 1.92B 资本化有两条观察。需逐条起草初步回应;自动批准已禁用(BR-01)。" })}</div>
            <div className="cr-obslist">
              <div className="cr-obs"><div className="oh">AO-22 · {tr({ en: "Depreciation basis", ar: "أساس الإهلاك", zh: "折旧依据" })}<span className="sev hi">{tr({ en: "high", ar: "مرتفع", zh: "高" })}</span></div><div className="ob">{tr({ en: "AUC capitalized using a single useful life; IPSAS 17 componentization not applied — justify or correct.", ar: "رُسمل الأصل بعمر واحد دون تطبيق إهلاك المكوّنات — برّر أو صحّح.", zh: "在建资产按单一年限资本化,未应用 IPSAS 17 组件折旧——请说明或更正。" })}</div></div>
              <div className="cr-obs"><div className="oh">AO-23 · {tr({ en: "In-service date", ar: "تاريخ التشغيل", zh: "投入使用日" })}<span className="sev lo">{tr({ en: "low", ar: "منخفض", zh: "低" })}</span></div><div className="ob">{tr({ en: "Depreciation start date for 2 buildings not evidenced by a handover record.", ar: "تاريخ بدء الإهلاك لمبنيين غير موثّق بسجل تسليم.", zh: "2 栋建筑折旧起始日缺交接记录佐证。" })}</div></div>
            </div>
          </div>
          <div className="cr-call v">
            <div className="ch"><span className="ic">✎</span> {tr({ en: "Recommended initial response — AO-22", ar: "الرد الأولي الموصى به — AO-22", zh: "建议初步回应 — AO-22" })}</div>
            <div className="cr-opts">
              {opt(0, pick === 0, true, { en: "Accept & correct", ar: "قبول وتصحيح", zh: "接受并更正" }, { en: "Re-run componentized depreciation under IPSAS 17 and post the adjustment; attach revised schedule.", ar: "إعادة احتساب إهلاك المكوّنات وترحيل التسوية؛ إرفاق الجدول المعدّل.", zh: "按 IPSAS 17 重算组件折旧并过账调整;附修订折旧表。" })}
              {opt(1, pick === 1, false, { en: "Justify & retain", ar: "تبرير وإبقاء", zh: "说明并保留" }, { en: "Defend single-life on materiality; raise a policy-update request.", ar: "الدفاع بالأهمية النسبية؛ ورفع طلب تحديث السياسة.", zh: "以重要性为由维持单一年限;提出政策更新申请。" })}
            </div>
          </div>
        </React.Fragment>}

        <details className="cr-ctx">
          <summary>📂 {tr({ en: "Case & source documents", ar: "الحالة والمستندات", zh: "立案与来源单据" })}<span className="sm">{tr({ en: "auto-prefilled · 3 docs", ar: "تعبئة تلقائية · 3 مستندات", zh: "自动预填 · 3 份文件" })}</span></summary>
          <div className="cr-ctxb">
            <div className="fl">{tr({ en: "Description", ar: "الوصف", zh: "描述" })}</div><p>{tr({ en: "Completed AUC (road infra SAR 0.84B, buildings SAR 0.61B, others SAR 0.47B) met milestones; reclassification AUC → in-service with depreciation from in-service date.", ar: "أصول مكتملة (طرق 0.84، مبانٍ 0.61، أخرى 0.47) أنجزت مراحلها؛ إعادة تصنيف وإهلاك من تاريخ التشغيل.", zh: "已完工在建资产(道路 0.84B、建筑 0.61B、其他 0.47B)达里程碑;重分类入用并自投入使用日折旧。" })}</p>
            <div className="fl">{tr({ en: "Supporting documents", ar: "المستندات", zh: "支持文件" })}</div>
            <div className="cr-docs"><span className="cr-doc">📄 AUC_schedule.xlsx</span><span className="cr-doc">📄 Completion_certs.pdf</span><span className="cr-doc">📄 Useful_life_policy_v2.3.pdf</span></div>
          </div>
        </details>
      </div>

      <div>
        <div className="cr-memocard">
          <div className="cr-memohd"><span>{caseType === "memo" ? "📝" : "📨"}</span><b>{caseType === "memo" ? tr({ en: "Accounting memo", ar: "مذكرة محاسبية", zh: "会计备忘" }) : tr({ en: "Initial response — AO-22", ar: "رد أولي — AO-22", zh: "初步回应 — AO-22" })}</b><span className="tag">{tr({ en: "DRAFT · updates with your decision", ar: "مسودة · تتحدّث مع قرارك", zh: "草稿 · 随你的决策更新" })}</span></div>
          {caseType === "memo" ? <div className="cr-memo">
            <h5>{tr({ en: "Background", ar: "الخلفية", zh: "背景" })}</h5><p>{tr({ en: "SAR 1.92B of completed AUC proposed for reclassification from AUC (15-3100) to in-service fixed assets (16-1200).", ar: "1.92 مليار من الأصول المكتملة لإعادة التصنيف من 15-3100 إلى 16-1200.", zh: "SAR 1.92B 已完工在建资产拟从 15-3100 重分类至在用固定资产 16-1200。" })}</p>
            <h5>{tr({ en: "Basis", ar: "الأساس", zh: "依据" })}</h5><p>{tr({ en: "IPSAS 17 & Comprehensive Guide §Capitalization (v2.3); MoF Instruction 2023-07 — certificates attached & verified.", ar: "IPSAS 17 والدليل الشامل (v2.3)؛ تعليمات 2023-07 — الشهادات مرفقة ومُتحقّقة.", zh: "IPSAS 17 与综合指南 §资本化(v2.3);财政部指示 2023-07——证明已附并核验。" })}</p>
            <h5>{tr({ en: "Treatment", ar: "المعالجة", zh: "会计处理" })}</h5><p>{tr({ en: "Post Dr 16-1200 / Cr 15-3100 SAR 1.92B.", ar: "ترحيل مدين 16-1200 / دائن 15-3100 بمبلغ 1.92 مليار.", zh: "过账 借 16-1200 / 贷 15-3100 SAR 1.92B。" })} {decided ? <span>{pick === 0 ? tr({ en: "Depreciation: componentized per IPSAS 17.", ar: "الإهلاك: بالمكوّنات وفق IPSAS 17.", zh: "折旧:按 IPSAS 17 组件法。" }) : tr({ en: "Depreciation: single useful life (policy v2.3) — policy-update note raised.", ar: "الإهلاك: عمر واحد (v2.3) — مع مذكرة تحديث.", zh: "折旧:单一年限(政策 v2.3)——已提政策更新说明。" })}</span> : <span className="pend">{tr({ en: "Depreciation method pending your decision.", ar: "طريقة الإهلاك بانتظار قرارك.", zh: "折旧方法待你决策。" })}</span>}</p>
          </div> : <div className="cr-memo">
            <h5>{tr({ en: "Observation", ar: "الملاحظة", zh: "观察" })}</h5><p>{tr({ en: "Audit Bureau: componentized depreciation (IPSAS 17) not applied to capitalized AUC.", ar: "الديوان: لم يُطبّق إهلاك المكوّنات على الأصل المرسمل.", zh: "审计署:资本化在建资产未应用组件折旧(IPSAS 17)。" })}</p>
            <h5>{tr({ en: "Our position", ar: "موقفنا", zh: "我方立场" })}</h5><p>{decided ? <span>{pick === 0 ? tr({ en: "Accept & correct: re-run componentized depreciation and post adjustment.", ar: "قبول وتصحيح: إعادة احتساب وترحيل التسوية.", zh: "接受并更正:重算组件折旧并过账调整。" }) : tr({ en: "Justify & retain: defend single-life on materiality; raise policy-update request.", ar: "تبرير وإبقاء: الدفاع بالأهمية ورفع طلب تحديث.", zh: "说明并保留:以重要性维持单一年限;提政策更新申请。" })}</span> : <span className="pend">{tr({ en: "Pending your choice above.", ar: "بانتظار اختيارك أعلاه.", zh: "待上方你的选择。" })}</span>}</p>
            <h5>{tr({ en: "Corrective action", ar: "إجراء تصحيحي", zh: "纠正措施" })}</h5><p>{tr({ en: "Target close within 10 business days; attach revised schedule & basis.", ar: "الإغلاق خلال 10 أيام عمل؛ إرفاق الجدول والأساس.", zh: "目标 10 个工作日内闭环;附修订折旧表与依据。" })}</p>
          </div>}
          <div className="cr-lock">🔒 {tr({ en: "Locked at decision: IPSAS 2024 · Guide v2.3 · CoA 2026 (retained — BR-03)", ar: "مثبّت عند القرار: IPSAS 2024 · v2.3 · دليل الحسابات 2026 (BR-03)", zh: "决策时锁定:IPSAS 2024 · 指南 v2.3 · 科目表 2026(留痕 — BR-03)" })}</div>
          <div className="cr-act">
            <div className="cr-actrow">
              <button className="cr-btn primary" disabled={!decided || approved} onClick={approve}>✓ {approved ? tr({ en: "Approved", ar: "معتمد", zh: "已批准" }) : tr({ en: "Approve", ar: "اعتماد", zh: "批准" })}</button>
              <button className="cr-btn ghost" onClick={() => pushLog({ en: "Memo sent for amendment", ar: "أُرسلت للتعديل", zh: "已退回修改" })}>✎ {tr({ en: "Amend", ar: "تعديل", zh: "修改" })}</button>
            </div>
            <div className="cr-actnote">{approved ? tr({ en: "Approved — hand-off enabled below.", ar: "معتمد — التسليم متاح أدناه.", zh: "已批准——下方交接已启用。" }) : tr({ en: "Resolve the decision above to enable approval · expert review required (BR-01).", ar: "احسم القرار أعلاه لتفعيل الاعتماد · يلزم مراجعة خبير (BR-01).", zh: "先完成上方决策以启用批准 · 需专家审阅(BR-01)。" })}</div>
            <div className="cr-hand">
              <div className="hl2">{tr({ en: "After approval · hand off downstream", ar: "بعد الاعتماد · التسليم اللاحق", zh: "批准后 · 下游交接" })}</div>
              <div className="hb">
                <span className={"cr-dbtn" + (approved ? " on" : "")} onClick={approved ? () => { setBackRoute("compmemo"); setRoute("reports"); } : undefined}><span className="uc">UC-10</span> {tr({ en: "Attach to Financial Report", ar: "إرفاق بالتقرير المالي", zh: "附入财务报告" })} →</span>
                <span className={"cr-dbtn" + (approved ? " on" : "")} onClick={approved ? () => setRoute("chat") : undefined}><span className="uc">UC-03</span> {tr({ en: "File to Audit Log", ar: "حفظ في سجل التدقيق", zh: "归入审计日志" })} →</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cr-agents">
          <div className="cr-agh">🤖 {tr({ en: "Agent assist", ar: "مساعدة الوكلاء", zh: "智能体辅助" })}<span className="tg">{tr({ en: "3 agents", ar: "3 وكلاء", zh: "3 个智能体" })}</span></div>
          <div className="cr-ag"><span className="bd run" /><div><div className="an">{tr({ en: "Compliance / Rules Agent", ar: "وكيل الامتثال / القواعد", zh: "合规 / 规则智能体" })}</div><div className="as">{tr({ en: "Grounded standards · raised the open decision for your call", ar: "أسّس المعايير · رفع القرار المفتوح لك", zh: "接地标准 · 提出待你决策项" })}</div></div></div>
          <div className="cr-ag"><span className="bd act" /><div><div className="an">{tr({ en: "Financial Reports Gen.", ar: "توليد التقارير المالية", zh: "财务报告生成" })}</div><div className="as">{tr({ en: "Drafts the memo / response; refreshes once you decide", ar: "يصيغ المذكرة / الرد ويُحدّثها بعد قرارك", zh: "起草备忘 / 回应;决策后刷新" })}</div></div></div>
          <div className="cr-ag"><span className="bd act" /><div><div className="an">{tr({ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" })}</div><div className="as">{tr({ en: "Pulled AUC schedule, certs & observations from SAP / Esnad", ar: "سحب الجدول والشهادات والملاحظات من ساب / إسناد", zh: "从 SAP / Esnad 拉取折旧表、证明与观察" })}</div></div></div>
        </div>
      </div>
    </div>
  </div>);
}

/* ======= UC-02 · Alerts & Exceptions Center (shared service — no menu entry) ======= */
const UC02_ALERTS = [
  { id: "be1", uc: "UC-17", ucc: "uc17", domain: "budgetExecution", sev: "crit", risk: { en: "Critical", ar: "حرج", zh: "严重" }, age: "18m", title: { en: "Etimad Plus and SAP difference blocks report export", ar: "فرق اعتماد بلس وساب يمنع تصدير التقرير", zh: "Etimad Plus 与 SAP 差异阻断报告导出" }, type: { en: "Reconciliation difference · SAR 52M", ar: "فرق مطابقة · 52 مليون ريال", zh: "对账差异 · SAR 52M" }, from: { en: "Budget Execution Ledger", ar: "دفتر تنفيذ الميزانية", zh: "预算执行台账" }, rec: "CT-8831 · INV-4472", view: "budexec17", cause: { en: "The invoice is posted in Etimad Plus, but the SAP payment movement is still open. Transfer and report generation should stay blocked until the source owner classifies the gap.", ar: "الفاتورة مرحلة في اعتماد بلس، لكن حركة الدفع في ساب ما زالت مفتوحة. يجب إبقاء المناقلة وإنشاء التقرير محجوبين حتى يصنف مالك المصدر الفجوة.", zh: "Etimad Plus 已登记发票，但 SAP 付款 movement 仍未关闭。来源负责人完成差异分类前，应阻断预算转移和报告导出。" }, proc: 2 },
  { id: "be2", uc: "UC-17", ucc: "uc17", domain: "budgetExecution", sev: "high", risk: { en: "High", ar: "مرتفع", zh: "高" }, age: "42m", title: { en: "Stale commitment has no invoice or payment movement", ar: "التزام متوقف بلا فاتورة أو حركة دفع", zh: "长期承诺无发票或付款 movement" }, type: { en: "Stale commitment · SAR 64M", ar: "التزام متوقف · 64 مليون ريال", zh: "长期承诺 · SAR 64M" }, from: { en: "Budget Execution Ledger", ar: "دفتر تنفيذ الميزانية", zh: "预算执行台账" }, rec: "PO-7719 · 76 days", view: "budexec-forecast", cause: { en: "The commitment has remained open for 76 days with no new invoice or payment. It should feed the future-obligation forecast before any release decision.", ar: "ظل الالتزام مفتوحاً 76 يوماً بلا فاتورة أو دفع جديد. يجب إرساله إلى تنبؤ الالتزامات المستقبلية قبل أي قرار تحرير.", zh: "该承诺已开放 76 天，未出现新发票或付款。进入释放判断前，应先送入未来义务预测。" }, proc: 2 },
  { id: "be3", uc: "UC-17", ucc: "uc17", domain: "budgetExecution", sev: "med", risk: { en: "Medium", ar: "متوسط", zh: "中" }, age: "1h", title: { en: "Available balance appears idle after April close", ar: "رصيد متاح يبدو خاملاً بعد إقفال أبريل", zh: "四月关账后存在可用但闲置余额" }, type: { en: "Idle available balance · SAR 180M", ar: "رصيد متاح خامل · 180 مليون ريال", zh: "可用但闲置余额 · SAR 180M" }, from: { en: "Availability Report", ar: "تقرير التوافر", zh: "可用性报告" }, rec: "AVL-26-04 · RSV-4417", view: "budexec-space", cause: { en: "The available balance has no invoice, claim or payment plan after April close. It is a fiscal-space candidate unless protected by future-claim signals.", ar: "الرصيد المتاح بلا فاتورة أو مطالبة أو خطة دفع بعد إقفال أبريل. هو مرشح للحيز المالي ما لم تحمه إشارات مطالبات مستقبلية.", zh: "四月关账后该可用余额没有发票、索赔或付款计划占用。若没有未来索赔信号保护，可进入财政空间候选。" }, proc: 1 },
  { id: "be4", uc: "UC-17", ucc: "uc17", domain: "budgetExecution", sev: "high", risk: { en: "High", ar: "مرتفع", zh: "高" }, age: "2h", title: { en: "SAP movement cannot be translated to PO stage", ar: "لا يمكن ترجمة حركة ساب إلى مرحلة أمر الشراء", zh: "SAP movement 无法翻译到 PO 阶段" }, type: { en: "Unclassified movement · SAR 84M", ar: "حركة غير مصنفة · 84 مليون ريال", zh: "未分类 movement · SAR 84M" }, from: { en: "SAP Movement Dictionary", ar: "قاموس حركات ساب", zh: "SAP movement 字典" }, rec: "SAP 6300 · PO missing", view: "budexec17", cause: { en: "The current dictionary cannot map two SAP rows to the required purchase-order reference. Assign a source owner and keep the line out of automated reporting.", ar: "لا يستطيع القاموس الحالي ربط صفين من ساب بمرجع أمر الشراء المطلوب. عيّن مالك مصدر واستبعد البند من التقارير الآلية.", zh: "当前字典无法将两条 SAP 行映射到所需 PO 引用。需分配来源负责人，并暂不纳入自动报告。" }, proc: 1 },
  { id: "a1", uc: "UC-04", ucc: "uc04", sev: "crit", risk: { en: "Critical", ar: "حرج", zh: "严重" }, age: "2h", title: { en: "Q4 funding pressure exceeds the warning band", ar: "ضغط تمويل الربع الرابع يتجاوز نطاق التحذير", zh: "第四季度资金压力超过预警区间" }, type: { en: "Forecast pressure · SAR 1.10B", ar: "ضغط التنبؤ · 1.10 مليار ريال", zh: "预测压力 · SAR 1.10B" }, from: { en: "Future Obligations Forecast", ar: "تنبؤ الالتزامات المستقبلية", zh: "未来义务预测" }, rec: "FC-2027-Q4", view: "plnforecast", cause: { en: "Committed payments and subsidy obligations peak in Q4 while the available cash window narrows.", ar: "تبلغ المدفوعات الملتزم بها والتزامات الدعم ذروتها في الربع الرابع مع تضيق نافذة النقد المتاح.", zh: "承诺付款和补贴义务在第四季度集中达到峰值，同时可用现金窗口收窄。" }, proc: 2 },
  { id: "a2", uc: "UC-15", ucc: "uc15", sev: "high", risk: { en: "High", ar: "مرتفع", zh: "高" }, age: "1h", title: { en: "Project cost assumptions conflict with baseline", ar: "افتراضات تكلفة المشروع تتعارض مع خط الأساس", zh: "项目成本假设与基线冲突" }, type: { en: "Cost conflict · SAR 184M exposure", ar: "تعارض تكلفة · تعرض 184 مليون ريال", zh: "成本冲突 · SAR 184M 暴露" }, from: { en: "Project Cost Drivers", ar: "محركات تكلفة المشروع", zh: "项目成本驱动分析" }, rec: "PRJ-METRO-01", view: "plncost", cause: { en: "Material and land-index assumptions are newer than the approved baseline and require reconciliation before approval.", ar: "افتراضات مؤشر المواد والأراضي أحدث من خط الأساس المعتمد وتتطلب التسوية قبل الاعتماد.", zh: "材料和土地指数假设晚于已批准基线，批准前需要完成协调。" }, proc: 1 },
  { id: "a3", uc: "UC-16", ucc: "uc16", sev: "high", risk: { en: "High", ar: "مرتفع", zh: "高" }, age: "5h", title: { en: "Housing support records incomplete in two regions", ar: "سجلات دعم الإسكان غير مكتملة في منطقتين", zh: "两个地区的住房支持记录不完整" }, type: { en: "Data completeness · 87%", ar: "اكتمال البيانات · 87٪", zh: "数据完整度 · 87%" }, from: { en: "Housing Support Impact", ar: "أثر دعم الإسكان", zh: "住房支持影响分析" }, rec: "HSP-2027-01", view: "plnhousing", cause: { en: "Beneficiary demand and delivery-capacity fields are incomplete for Asir and Al Madinah.", ar: "حقول طلب المستفيدين والقدرة على التنفيذ غير مكتملة في عسير والمدينة.", zh: "阿西尔和麦地那的受益人需求及交付能力字段不完整。" }, proc: 0 },
  { id: "a4", uc: "UC-05", ucc: "uc05", sev: "med", risk: { en: "Medium", ar: "متوسط", zh: "中" }, age: "1d", title: { en: "Recommended scenario awaits decision", ar: "السيناريو الموصى به بانتظار القرار", zh: "推荐情景等待决策" }, type: { en: "Decision pending · SAR 0.31B benefit", ar: "قرار معلق · فائدة 0.31 مليار ريال", zh: "待决策 · SAR 0.31B 收益" }, from: { en: "Scenario Decision", ar: "قرار السيناريو", zh: "财务情景决策" }, rec: "SCN-2027-BAL", view: "plnscenario", cause: { en: "The balanced package has the best benefit-to-risk ratio but still requires human approval.", ar: "تقدم الحزمة المتوازنة أفضل نسبة فائدة إلى مخاطر لكنها لا تزال تتطلب اعتماداً بشرياً.", zh: "平衡方案的收益风险比最佳，但仍需人工批准。" }, proc: 2 },
  { id: "a5", uc: "UC-07", ucc: "uc07", sev: "med", risk: { en: "Medium", ar: "متوسط", zh: "中" }, age: "3h", title: { en: "Planning baseline is not yet approved", ar: "خط أساس التخطيط لم يعتمد بعد", zh: "规划基线尚未批准" }, type: { en: "Prerequisite pending", ar: "متطلب سابق معلق", zh: "前置条件待完成" }, from: { en: "Budget Planning & Fiscal Space", ar: "تخطيط الميزانية والحيز المالي", zh: "预算规划与财政空间" }, rec: "BL-2027-DRAFT", view: "plnbudget", cause: { en: "Downstream scenario approval remains locked until the FY2027 baseline is reviewed and approved.", ar: "يبقى اعتماد السيناريو اللاحق مقفلاً حتى مراجعة واعتماد خط أساس 2027.", zh: "在 FY2027 基线完成复核和批准之前，下游情景审批保持锁定。" }, proc: 0 },
  { id: "a6", uc: "SYS", ucc: "sys", sev: "low", risk: { en: "Low", ar: "منخفض", zh: "低" }, age: "6h", title: { en: "One source extract is nearing freshness SLA", ar: "استخراج مصدر واحد يقترب من حد حداثة البيانات", zh: "一个源数据提取接近新鲜度 SLA" }, type: { en: "Data freshness · Hyperion 74%", ar: "حداثة البيانات · هايبريون 74٪", zh: "数据新鲜度 · Hyperion 74%" }, from: { en: "Financial Data Readiness", ar: "جاهزية البيانات المالية", zh: "财务数据准备" }, rec: "SRC-HYP-2027", view: "plnwork", cause: { en: "The quarterly Hyperion extract is still usable but is approaching the configured freshness threshold.", ar: "لا يزال استخراج هايبريون الفصلي صالحاً لكنه يقترب من حد الحداثة المحدد.", zh: "Hyperion 季度提取仍可使用，但正在接近配置的新鲜度阈值。" }, proc: 3 },
];
function AlertsCenter({ drawer, onClose }) {
  const { tr, setRoute, backRoute, setBackRoute, pushLog } = useStore();
  const [sel, setSel] = useState("be1");
  const a = UC02_ALERTS.find(x => x.id === sel) || UC02_ALERTS[0];
  const alertCounts = UC02_ALERTS.reduce((acc, item) => {
    acc[item.sev] = (acc[item.sev] || 0) + 1;
    acc[item.domain || "planning"] = (acc[item.domain || "planning"] || 0) + 1;
    return acc;
  }, {});
  const openCount = UC02_ALERTS.length;
  const PROC = [{ en: "Complete", ar: "إكمال", zh: "补全" }, { en: "Correct", ar: "تصحيح", zh: "更正" }, { en: "Escalate", ar: "تصعيد", zh: "升级" }, { en: "Close", ar: "إغلاق", zh: "关闭" }];
  const back = () => { const b = backRoute || "rcbench"; setBackRoute(null); setRoute(b); };
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, FD = { en: "FEEDS ↓", ar: "يغذّي", zh: "馈入↓" }, FU = { en: "FEEDS ↑", ar: "يغذّي", zh: "馈入↑" }, THISP = { en: "THIS", ar: "هذه", zh: "本环节" };
  const CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Data Consolidation", ar: "توحيد البيانات", zh: "数据整合" } },
    { code: "UC-07", pos: FD, name: { en: "Budget Baseline", ar: "خط أساس الميزانية", zh: "预算基线" } },
    { code: "UC-02", here: true, pos: THISP, name: { en: "Alerts & Exceptions", ar: "التنبيهات والاستثناءات", zh: "告警与异常" } },
    { code: "UC-15 / UC-16", name: { en: "Cost & Housing", ar: "التكلفة والإسكان", zh: "成本与住房" } },
    { code: "UC-04", name: { en: "Future Obligations", ar: "الالتزامات المستقبلية", zh: "未来义务" } },
    { code: "UC-05", pos: FU, name: { en: "Scenario Decision", ar: "قرار السيناريو", zh: "情景决策" } },
    { code: "UC-06 / UC-03", name: { en: "Performance / Smart Query", ar: "الأداء / الاستعلام", zh: "绩效 / 智能问数" } },
  ];
  return (<div className="fade wb">
    {!drawer && <div className="ws-back" onClick={back}>← {tr({ en: "Back", ar: "رجوع", zh: "返回" })}</div>}
    <div className="al-hd">
      <div>
        <div className="al-eyebrow">{ucl("UC-02", tr({ en: "Alerts & Exceptions Center", ar: "مركز التنبيهات والاستثناءات", zh: "告警与异常中心" }))}</div>
        <h1 className="al-h1">{tr({ en: `${openCount} open alerts · ${alertCounts.crit || 0} critical need action`, ar: `${openCount} تنبيهات مفتوحة · ${alertCounts.crit || 0} حرجة تتطلب إجراءً`, zh: `${openCount} 条未决告警 · ${alertCounts.crit || 0} 条严重待处理` })}</h1>
        <div className="al-inbound"><span className="al-inlab">{tr({ en: "Inbound from", ar: "وارد من", zh: "调用来源" })}</span>
          <span className="al-feeder bud">{tr({ en: "Budget execution", ar: "تنفيذ الميزانية", zh: "预算执行" })} <span className="n">{alertCounts.budgetExecution || 0}</span></span>
          <span className="al-feeder uc13">{tr({ en: "Forecast", ar: "التنبؤ", zh: "预测" })} <span className="n">1</span></span>
          <span className="al-feeder uc11">{tr({ en: "Scenarios", ar: "السيناريوهات", zh: "情景" })} <span className="n">1</span></span>
          <span className="al-feeder uc14">{tr({ en: "Housing", ar: "الإسكان", zh: "住房" })} <span className="n">1</span></span>
          <span className="al-feeder uc12">{tr({ en: "Costs", ar: "التكاليف", zh: "成本" })} <span className="n">1</span></span>
          <span className="al-feeder sys">{tr({ en: "System", ar: "النظام", zh: "系统" })} <span className="n">1</span></span>
        </div>
      </div>
      <div className="al-sevsum">
        <div className="al-sv crit"><div className="n">{alertCounts.crit || 0}</div><div className="l">{tr({ en: "Critical", ar: "حرج", zh: "严重" })}</div></div>
        <div className="al-sv high"><div className="n">{alertCounts.high || 0}</div><div className="l">{tr({ en: "High", ar: "مرتفع", zh: "高" })}</div></div>
        <div className="al-sv med"><div className="n">{alertCounts.med || 0}</div><div className="l">{tr({ en: "Medium", ar: "متوسط", zh: "中" })}</div></div>
        <div className="al-sv"><div className="n">{alertCounts.low || 0}</div><div className="l">{tr({ en: "Low", ar: "منخفض", zh: "低" })}</div></div>
      </div>
    </div>
    <div className="al-feednote">{tr({ en: "Budget execution, planning, project cost, housing support, forecasting and scenario monitoring feed this shared exception drawer. Every alert preserves its source record and can return to the originating analysis.", ar: "تغذي تنفيذ الميزانية والتخطيط وتكلفة المشاريع ودعم الإسكان والتنبؤ ومراقبة السيناريوهات درج الاستثناءات المشترك. ويحتفظ كل تنبيه بسجله المصدر ويمكن الرجوع إلى التحليل الأصلي.", zh: "预算执行、规划、项目成本、住房支持、预测和情景监控共同汇入这个共享异常抽屉。每条异常保留来源记录，并可返回原始分析。" })}</div>

    <div className="al-grid">
      <div className="al-panel">
        <div className="al-ph">{tr({ en: "Exception queue", ar: "قائمة الاستثناءات", zh: "异常队列" })}<span className="pm">{tr({ en: "ranked by severity & age", ar: "مرتّبة حسب الخطورة والعمر", zh: "按严重度与时效排序" })}</span></div>
        <div className="al-filters">
          <div className="al-fchip"><div className="k">{tr({ en: "Alert type", ar: "نوع التنبيه", zh: "告警类型" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
          <div className="al-fchip"><div className="k">{tr({ en: "Risk level", ar: "مستوى الخطر", zh: "风险等级" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
          <div className="al-fchip"><div className="k">{tr({ en: "Department", ar: "الإدارة", zh: "部门" })}</div><div className="v">{tr({ en: "All departments", ar: "كل الإدارات", zh: "全部部门" })} ▾</div></div>
        </div>
        {UC02_ALERTS.map(x => (<div className={"al-alert" + (x.id === sel ? " sel" : "")} key={x.id} onClick={() => setSel(x.id)}>
          <div className={"al-sevbar " + x.sev} />
          <div className="al-main"><div className="al-t">{SHOW_UC ? <span className={"al-uc " + x.ucc}>{x.uc}</span> : null} {tr(x.title)}</div><div className="al-s">{tr(x.type)}</div></div>
          <span className={"al-risk " + x.sev}>{tr(x.risk)}</span><span className="al-age">{x.age}</span>
        </div>))}
      </div>

      <div>
        <div className="al-panel">
          <div className="al-dhd">
            <div className="al-drow"><span className={"al-risk " + a.sev}>{tr(a.risk)}</span>{SHOW_UC ? <span className={"al-uc " + a.ucc}>{a.uc}</span> : null}</div>
            <div className="al-dt">{tr(a.title)}</div>
          </div>
          <div className="al-db">
            <div className="al-fld"><div className="al-fl">{tr({ en: "Source / lineage", ar: "المصدر / التتبع", zh: "来源 / 追溯" })}</div>
              <div className="al-lineage">← <span className="from">{tr(a.from)}</span> · {a.rec}<span className="al-viewsrc" onClick={() => { if (drawer && onClose) onClose(); setRoute(a.view); }}>{tr({ en: "View source", ar: "عرض المصدر", zh: "查看来源" })} →</span></div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Possible cause", ar: "السبب المحتمل", zh: "可能原因" })}</div>
              <div className="al-cause"><span className="ai">AI</span>{tr(a.cause)}</div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Proposed procedure", ar: "الإجراء المقترح", zh: "建议处置" })}</div>
              <div className="al-procs">{PROC.map((p, i) => (<span className={"al-proc" + (i === a.proc ? " on" : "")} key={i}>{tr(p)}{i === a.proc && <span className="rec">AI</span>}</span>))}</div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Assign official (required to escalate)", ar: "تعيين مسؤول (لازم للتصعيد)", zh: "指派负责人(升级必填)" })}</div>
              <div className="al-picker"><span>👤 {tr({ en: "Default responsible party", ar: "المسؤول الافتراضي", zh: "默认负责人" })}</span><span style={{ color: "#b9a4e6" }}>▾</span></div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Closing notes", ar: "ملاحظات الإغلاق", zh: "关闭说明" })} <span className="al-req">· {tr({ en: "justification required (BR-03)", ar: "يلزم تبرير (BR-03)", zh: "需理由(BR-03)" })}</span></div>
              <textarea className="al-cause" style={{ minHeight: 54, fontFamily: "inherit" }} placeholder={tr({ en: "Document the justification before closing…", ar: "وثّق التبرير قبل الإغلاق…", zh: "关闭前记录理由…" })} />
            </div>
          </div>
          <div className="al-acts">
            <button className="al-btn esc" onClick={() => pushLog({ en: "Alert escalated to the assigned official", ar: "تم تصعيد التنبيه للمسؤول", zh: "告警已升级至指派负责人" })}>↑ {tr({ en: "Escalate", ar: "تصعيد", zh: "升级" })}</button>
            <button className="al-btn primary" disabled>✓ {tr({ en: "Close alert", ar: "إغلاق التنبيه", zh: "关闭告警" })}</button>
            <button className="al-btn ghost" onClick={() => pushLog({ en: "Alert marked as reviewed", ar: "تم وسم التنبيه كمراجَع", zh: "告警已标记为已复核" })}>{tr({ en: "Mark as reviewed", ar: "وسم كمراجَع", zh: "标记已复核" })}</button>
            <span className="al-actnote">{tr({ en: "An alert is not a confirmed error — review & document the procedure (BR-02). Critical alerts cannot be closed without justification (BR-03).", ar: "التنبيه ليس خطأً مؤكداً — راجع ووثّق (BR-02). ولا تُغلق الحرجة دون تبرير (BR-03).", zh: "告警不等于确认错误——需复核并记录处置(BR-02);严重告警无理由不可关闭(BR-03)。" })}</span>
          </div>
        </div>
      </div>
    </div>
  </div>);
}

/* ======= UC-10 · Reporting Hub (Library + Composer drawer) ======= */
const RP_REPORTS = [
  { id: "q", name: { en: "G-06 · Revenue & Assets — Quarterly", ar: "ج-06 · الإيرادات والأصول — ربعي", zh: "G-06 · 收入与资产 — 季度" }, sub: { en: "Consolidated directorate report", ar: "تقرير موحّد للإدارة", zh: "总局综合报告" }, type: { en: "Periodic · Consolidated", ar: "دوري · موحّد", zh: "周期 · 综合" }, period: "Q2 2026", srcs: ["13", "14", "12", "11", "06"], status: "review", upd: "1h", title: { en: "G-06 · Revenue & Assets — Quarterly (FY 2026 · Q2)", ar: "ج-06 · الإيرادات والأصول — ربعي (2026 · ر2)", zh: "G-06 · 收入与资产 — 季度(FY 2026 · Q2)" } },
  { id: "rev", name: { en: "Revenue & Collections Report", ar: "تقرير الإيرادات والتحصيل", zh: "收入与征收报告" }, sub: { en: "Billing, collection, exclusions", ar: "الفوترة والتحصيل والاستبعادات", zh: "开票、征收、排除项" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["13", "02", "06"], status: "appr", upd: "today", title: { en: "Revenue & Collections Report (FY 2026 · Q2)", ar: "تقرير الإيرادات والتحصيل (2026 · ر2)", zh: "收入与征收报告(FY 2026 · Q2)" } },
  { id: "ast", name: { en: "Assets & Capitalization Report", ar: "تقرير الأصول والرسملة", zh: "资产与资本化报告" }, sub: { en: "Classification, capitalization, returns", ar: "التصنيف والرسملة والعوائد", zh: "分类、资本化、回报" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["14", "12", "11"], status: "draft", upd: "2h", title: { en: "Assets & Capitalization Report (FY 2026 · Q2)", ar: "تقرير الأصول والرسملة (2026 · ر2)", zh: "资产与资本化报告(FY 2026 · Q2)" } },
  { id: "cost", name: { en: "Costs & Funds Report", ar: "تقرير التكاليف والصناديق", zh: "成本与资金报告" }, sub: { en: "Assignment orders, unit cost, funds", ar: "أوامر الإسناد وتكلفة الوحدة والصناديق", zh: "派工单、单元成本、资金" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["12", "14"], status: "draft", upd: "3h", title: { en: "Costs & Funds Report (FY 2026 · Q2)", ar: "تقرير التكاليف والصناديق (2026 · ر2)", zh: "成本与资金报告(FY 2026 · Q2)" } },
  { id: "comp", name: { en: "Compliance & Accounting Memos Pack", ar: "حزمة الامتثال والمذكرات المحاسبية", zh: "合规与会计备忘汇编" }, sub: { en: "Memos, journal entries, references", ar: "مذكرات، قيود، مراجع", zh: "备忘、分录、依据" }, type: { en: "Compilation", ar: "تجميع", zh: "汇编" }, period: "Q2 2026", srcs: ["11", "09"], status: "review", upd: "1h", title: { en: "Compliance & Accounting Memos Pack (Q2)", ar: "حزمة الامتثال والمذكرات (ر2)", zh: "合规与会计备忘汇编(Q2)" } },
  { id: "exec", name: { en: "Executive Summary — Leadership", ar: "الملخص التنفيذي — القيادة", zh: "执行摘要 — 领导层" }, sub: { en: "One-page KPI & deviations", ar: "صفحة واحدة: مؤشرات وانحرافات", zh: "一页 KPI 与偏差" }, type: { en: "Executive", ar: "تنفيذي", zh: "执行" }, period: "Jun 2026", srcs: ["06", "13", "14", "02"], status: "issued", upd: "Jun 28", title: { en: "Executive Summary — Leadership (Jun 2026)", ar: "الملخص التنفيذي — القيادة (يونيو 2026)", zh: "执行摘要 — 领导层(2026 年 6 月)" } },
  { id: "adhoc", name: { en: "Ad-hoc · \"Overdue by Amanah\"", ar: "حسب الطلب · «التأخر حسب الأمانة»", zh: "即席 · 「按阿玛纳逾期」" }, sub: { en: "Natural-language query report", ar: "تقرير استعلام بلغة طبيعية", zh: "自然语言查询报告" }, type: { en: "Ad-hoc · NL", ar: "حسب الطلب · لغة طبيعية", zh: "即席 · 自然语言" }, period: "Q2 2026", srcs: ["13", "03"], status: "draft", upd: "10m", title: { en: "Ad-hoc · \"Overdue by Amanah\"", ar: "حسب الطلب · «التأخر حسب الأمانة»", zh: "即席 · 「按阿玛纳逾期」" } },
];
const RP_TEMPLATES = [
  { key: "q", name: { en: "G-06 Quarterly · Revenue & Assets", ar: "ج-06 ربعي · الإيرادات والأصول", zh: "G-06 季度 · 收入与资产" }, srcs: ["13", "14", "12", "11", "06"] },
  { key: "rev", name: { en: "Revenue & Collections", ar: "الإيرادات والتحصيل", zh: "收入与征收" }, srcs: ["13", "02", "06"] },
  { key: "ast", name: { en: "Assets & Capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" }, srcs: ["14", "12", "11"] },
  { key: "cost", name: { en: "Costs & Funds", ar: "التكاليف والصناديق", zh: "成本与资金" }, srcs: ["12", "14"] },
  { key: "comp", name: { en: "Compliance & Memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, srcs: ["11", "09"] },
  { key: "exec", name: { en: "Executive Summary", ar: "ملخص تنفيذي", zh: "执行摘要" }, srcs: ["06", "13", "14", "02"] },
];
const BUDGET_EXEC_REPORT_TYPES = [
  { id: "consumption-detail", name: { en: "Consumption Detail Report", ar: "تقرير تفاصيل الاستهلاك", zh: "消耗详情报告" }, sub: { en: "SAP/Asas consumption by budget line, project and period", ar: "استهلاك ساب/أساس حسب بند الميزانية والمشروع والفترة", zh: "按预算行、项目、期间拆解 SAP/Asas 消耗" } },
  { id: "reservation-funds", name: { en: "Reserved Funds Report", ar: "تقرير الأموال المحجوزة", zh: "预留资金报告" }, sub: { en: "Reservations, fund availability and release candidates", ar: "الحجوزات وتوافر التمويل ومرشحات التحرير", zh: "资金预留、可用性与释放候选" } },
  { id: "purchase-requisition", name: { en: "Purchase Requisition Report", ar: "تقرير طلبات الشراء", zh: "采购申请报告" }, sub: { en: "PR status and ageing before purchase order", ar: "حالة طلبات الشراء وتقادمها قبل أمر الشراء", zh: "PR 状态与转 PO 前账龄" } },
  { id: "purchase-order", name: { en: "Purchase Order Report", ar: "تقرير أوامر الشراء", zh: "采购订单报告" }, sub: { en: "PO linkage, missing references and execution value", ar: "ربط أوامر الشراء والمراجع المفقودة وقيمة التنفيذ", zh: "PO 关联、缺失引用与执行金额" } },
  { id: "invoice", name: { en: "Invoice Report", ar: "تقرير الفواتير", zh: "发票报告" }, sub: { en: "Invoices, claims, ageing and Etimad mapping", ar: "الفواتير والمطالبات والتقادم وربط اعتماد", zh: "发票、索赔、账龄与 Etimad 映射" } },
  { id: "contract", name: { en: "Contract Report", ar: "تقرير العقود", zh: "合同报告" }, sub: { en: "Contract commitments and remaining obligation", ar: "التزامات العقود والالتزام المتبقي", zh: "合同承诺与剩余义务" } },
  { id: "transfer", name: { en: "Transfer Report", ar: "تقرير المناقلات", zh: "转移报告" }, sub: { en: "Transfer-in/out movements and Hyperion constraints", ar: "حركات المناقلة الداخلة والخارجة وقيود هايبريون", zh: "转入/转出 movement 与 Hyperion 约束" } },
  { id: "balance-free-cost", name: { en: "Balances & Free Cost Report", ar: "تقرير الأرصدة والتكلفة الحرة", zh: "余额与自由成本报告" }, sub: { en: "Available balance, remaining approval and free-cost room", ar: "الرصيد المتاح والاعتماد المتبقي ومساحة التكلفة الحرة", zh: "可用余额、剩余批准额与自由成本空间" } },
  { id: "expenditure-rate", name: { en: "Expenditure Rate Report", ar: "تقرير معدل الصرف", zh: "支出率报告" }, sub: { en: "Spend rate by fiscal year, entity, project and supplier", ar: "معدل الصرف حسب السنة والجهة والمشروع والمورد", zh: "按财年、机构、项目、供应商统计支出率" } },
  { id: "etimad-reconciliation", name: { en: "Etimad vs Internal Systems Reconciliation Report", ar: "تقرير مطابقة اعتماد مع الأنظمة الداخلية", zh: "Etimad与内部系统对账报告" }, sub: { en: "SAP/Asas, Etimad Plus and internal reference differences", ar: "فروق ساب/أساس واعتماد بلس والمراجع الداخلية", zh: "SAP/Asas、Etimad Plus 与内部引用差异" } },
];
const BUDGET_EXEC_REPORTS = BUDGET_EXEC_REPORT_TYPES.map((type, index) => ({
  id: "bex-" + type.id,
  name: type.name,
  sub: type.sub,
  type: { en: "Budget execution · UC-10", ar: "تنفيذ الميزانية · UC-10", zh: "预算执行 · UC-10" },
  period: index < 8 ? "FY 2026 · Q2" : "FY 2026",
  srcs: ["17", "10", "04", "07"],
  status: index < 2 ? "review" : index < 6 ? "draft" : "appr",
  upd: index < 3 ? "now" : index < 7 ? "35m" : "today",
  title: {
    en: `${type.name.en} (FY 2026 · Q2)`,
    ar: `${type.name.ar} (2026 · ر2)`,
    zh: `${type.name.zh}(FY 2026 · Q2)`,
  },
}));
const BUDGET_EXEC_REPORT_TEMPLATES = BUDGET_EXEC_REPORT_TYPES.map((type) => ({
  key: type.id,
  name: type.name,
  srcs: ["17", "10", "04", "07"],
}));
const RP_STEPS = { draft: 0, review: 1, appr: 2, issued: 3 };
const REPORT_COLLECTION_TREND_DEFAULT = [{ period: "Q3-25", value: 83 }, { period: "Q4-25", value: 85 }, { period: "Q1-26", value: 85 }, { period: "Q2-26", value: 87 }];
function CollectionTrendPreview() {
  const rows = REPORT_COLLECTION_TREND_DEFAULT.map((row) => ({
    ...row,
    value: getChartNumber("reports", "collection_rate_trend", keyify(row.period), "collection_rate", row.value),
  }));
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (<div className="rp-chart">{rows.map((row) => <div className="rp-bar" key={row.period} style={{ height: Math.max(18, row.value / max * 80) + "%" }}><span>{row.value}%</span><small>{row.period}</small></div>)}</div>);
}
function ReportHub() {
  const { tr, setRoute, backRoute, setBackRoute, pushLog, route } = useStore();
  const isBudgetExecReports = route === "budexec-reports" || backRoute === "budexec17";
  const baseReports = isBudgetExecReports ? BUDGET_EXEC_REPORTS : RP_REPORTS;
  const TEMPLATES = isBudgetExecReports ? BUDGET_EXEC_REPORT_TEMPLATES : RP_TEMPLATES;
  const [reports, setReports] = useState(() => baseReports);
  const [open, setOpen] = useState(null);
  const [nw, setNw] = useState(false);
  const [nmode, setNmode] = useState("tmpl");
  const [ntmpl, setNtmpl] = useState(() => TEMPLATES[0]?.key || "q");
  const [nnl, setNnl] = useState("");
  useEffect(() => {
    setReports(baseReports);
    setOpen(null);
    setNtmpl(TEMPLATES[0]?.key || "q");
  }, [isBudgetExecReports]);
  const r = reports.find(x => x.id === open);
  const genReport = () => {
    const id = "n" + Date.now();
    let rep;
    if (nmode === "nl") { const q = nnl.trim() || tr({ en: "Ad-hoc query", ar: "استعلام", zh: "即席查询" }); rep = { id, name: "Ad-hoc · " + q, sub: { en: "Natural-language query report", ar: "تقرير استعلام بلغة طبيعية", zh: "自然语言查询报告" }, type: { en: "Ad-hoc · NL", ar: "حسب الطلب", zh: "即席 · 自然语言" }, period: "Q2 2026", srcs: isBudgetExecReports ? ["17", "10", "04", "07"] : ["13", "03"], status: "draft", upd: tr({ en: "now", ar: "الآن", zh: "刚刚" }), title: "Ad-hoc · " + q }; }
    else { const t = TEMPLATES.find(x => x.key === ntmpl) || TEMPLATES[0]; rep = { id, name: t.name, sub: { en: "Generated from template", ar: "مولّد من قالب", zh: "由模板生成" }, type: isBudgetExecReports ? { en: "Budget execution · UC-10", ar: "تنفيذ الميزانية · UC-10", zh: "预算执行 · UC-10" } : { en: "Periodic", ar: "دوري", zh: "周期" }, period: "Q2 2026", srcs: t.srcs, status: "draft", upd: tr({ en: "now", ar: "الآن", zh: "刚刚" }), title: tr(t.name) + " (FY 2026 · Q2)" }; }
    setReports([rep, ...reports]); setNw(false); setNnl(""); setOpen(id);
  };
  const ucCls = (c) => "uc" + c;
  const stLabel = (s) => ({ draft: { en: "Draft", ar: "مسودة", zh: "草稿" }, review: { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" }, appr: { en: "Approved", ar: "معتمد", zh: "已批准" }, issued: { en: "Issued", ar: "صادر", zh: "已发布" } }[s]);
  const STEPL = [{ en: "Draft", ar: "مسودة", zh: "草稿" }, { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" }, { en: "Approved", ar: "معتمد", zh: "已批准" }, { en: "Issued", ar: "صادر", zh: "已发布" }];
  const RP_PARENT = { budexec17: { en: "Budget Execution Control Tower", ar: "برج مراقبة تنفيذ الميزانية", zh: "预算执行控制塔" }, csfunds: { en: "Costs & Funds Console", ar: "وحدة التكاليف والصناديق", zh: "成本与资金控制台" }, compmemo: { en: "Accounting Ruling", ar: "قرار محاسبي", zh: "会计裁定" }, rcwork: { en: "Revenue Collection Dept", ar: "إدارة التحصيل", zh: "收入征收部" }, aswork: { en: "Assets Department", ar: "إدارة الأصول", zh: "资产部" } };
  const backTarget = backRoute || (isBudgetExecReports ? "budexec17" : "rcwork");
  const goBack = () => { setBackRoute(null); setRoute(backTarget); };
  return (<div className="fade ws-page">
    <div className="rp-libhd">
      <div className="rp-libL">
      <div className="rp-libtitle">{(backRoute || isBudgetExecReports) && <button className="rp-backbtn" title={tr({ en: "Back", ar: "رجوع", zh: "返回" })} onClick={goBack}>‹</button>}<div><div className="dw-eyebrow g" style={{ marginBottom: 2 }}>{tr({ en: isBudgetExecReports ? "General Budget Department · report output" : "Department Workspace · convergence", ar: isBudgetExecReports ? "الإدارة العامة للميزانية · مخرجات التقارير" : "مساحة عمل الإدارة · تجميعي", zh: isBudgetExecReports ? "预算总局 · 报告输出" : "部门工作区 · 汇聚" })}</div><h1 className="rp-h1">{tr(isBudgetExecReports ? { en: "Budget Execution Report Library", ar: "مكتبة تقارير تنفيذ الميزانية", zh: "预算执行报告库" } : { en: "Report Library", ar: "مكتبة التقارير", zh: "报告库" })}{SHOW_UC ? " · UC-10" : ""}</h1></div></div>
        <div className="sub muted" style={{ fontSize: 12.5, marginTop: 3 }}>{tr(isBudgetExecReports ? { en: "Mandate: generate UC-10 report outputs from UC-17 SAP/Asas execution truth, UC-04 obligation forecast and UC-07 fiscal-space analysis without leaving the General Budget Department context.", ar: "المهمة: إنشاء مخرجات UC-10 من حقيقة تنفيذ ساب/أساس في UC-17 وتنبؤ الالتزامات UC-04 وتحليل الحيز المالي UC-07 ضمن سياق الإدارة العامة للميزانية.", zh: "职责：在预算总局上下文内，基于 UC17 的 SAP/Asas 执行真相、UC04 未来义务预测与 UC07 财政空间分析生成 UC10 报告输出。" } : { en: "Mandate: generate financial/administrative reports & narrative commentary (UC-10). Workspace — convergence type: report library + contributions inbox from all departments.", ar: "المهمة: إنشاء التقارير والتعليق السردي (UC-10). مساحة العمل — نوع تجميعي: مكتبة + صندوق مساهمات.", zh: "职责:生成财务/行政报告与叙述评述(UC-10)。Workspace — 汇聚型:报告库 + 各部门贡献 inbox。" })}</div>
      </div>
        <SmartQueryFab route={isBudgetExecReports ? "budexec-reports" : "reports"} scope={isBudgetExecReports ? { en: "Scope: Budget execution reports · UC-17/04/07/10", ar: "النطاق: تقارير تنفيذ الميزانية · UC-17/04/07/10", zh: "范围:预算执行报告 · UC-17/04/07/10" } : { en: "Scope: Reporting · all sources", ar: "النطاق: التقارير · كل المصادر", zh: "范围:报告 · 全部来源" }} prompts={isBudgetExecReports ? [{ en: "Generate a consumption detail report for FY2026 Q2", ar: "أنشئ تقرير تفاصيل الاستهلاك للربع الثاني 2026", zh: "生成 FY2026 Q2 消耗详情报告" }, { en: "Show Etimad reconciliation reports pending review", ar: "اعرض تقارير مطابقة اعتماد بانتظار المراجعة", zh: "显示待复核的 Etimad 对账报告" }, { en: "Which report explains balances and free cost?", ar: "أي تقرير يشرح الأرصدة والتكلفة الحرة؟", zh: "哪个报告解释余额与自由成本？" }] : [{ en: "Which reports are pending approval?", ar: "ما التقارير بانتظار الاعتماد؟", zh: "哪些报告待审批?" }, { en: "What feeds the G-06 quarterly report?", ar: "ما الذي يغذّي تقرير ج-06 الربعي؟", zh: "G-06 季度报告由谁汇入?" }, { en: "Show overdue report sections", ar: "إظهار أقسام التقارير المتأخرة", zh: "显示逾期的报告章节" }]} />
      <div className="wb-chain rp-headchain"><span className="wb-clab">{tr(isBudgetExecReports ? { en: "G-03 CHAIN", ar: "سلسلة ج-03", zh: "G-03 链路" } : { en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>
        {(isBudgetExecReports ? [{ c: "UC-17" }, { c: "UC-04" }, { c: "UC-07" }, { c: "UC-10", here: true, pos: { en: "REPORT OUTPUT", ar: "مخرج التقرير", zh: "报告输出" } }] : [{ c: "UC-01" }, { c: "UC-13" }, { c: "UC-06/02" }, { c: "UC-14" }, { c: "UC-12/11" }, { c: "UC-10", here: true, pos: { en: "CONVERGE", ar: "تقارب", zh: "汇聚" } }]).map((n, i) => (<span className="wb-cseg" key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (n.here ? " here" : "")}>{n.pos && <span className="wb-cpos">{tr(n.pos)}</span>}{n.c}</span></span>))}
      </div>
    </div>
    <div className="rp-contrib">
      <div className="ch">{tr(isBudgetExecReports ? { en: "Recent budget-execution inputs · pushed into UC-10 report outputs", ar: "مدخلات تنفيذ الميزانية الحديثة · مدفوعة إلى مخرجات UC-10", zh: "最近预算执行输入 · 推入 UC-10 报告输出" } : { en: "Recent contributions · pushed from upstream UCs into reports", ar: "مساهمات حديثة · مدفوعة من الحالات الأعلى إلى التقارير", zh: "最近贡献 · 由上游 UC 推入报告" })}</div>
      {isBudgetExecReports ? <>
        <div className="row"><span className="rp-uc uc17">UC-17</span><span className="arr">→</span> {tr({ en: "fed", ar: "غذّى", zh: "喂入" })} <b>{tr({ en: "SAP/Asas execution ledger", ar: "دفتر تنفيذ ساب/أساس", zh: "SAP/Asas 执行台账" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "Consumption Detail Report", ar: "تقرير تفاصيل الاستهلاك", zh: "消耗详情报告" })}</span><span className="age">now</span></div>
        <div className="row"><span className="rp-uc uc04">UC-04</span><span className="arr">→</span> {tr({ en: "sent", ar: "أرسل", zh: "推送" })} <b>{tr({ en: "future obligation watch", ar: "متابعة الالتزامات المستقبلية", zh: "未来义务观察" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "Reserved Funds Report", ar: "تقرير الأموال المحجوزة", zh: "预留资金报告" })}</span><span className="age">18m</span></div>
        <div className="row"><span className="rp-uc uc07">UC-07</span><span className="arr">→</span> {tr({ en: "updated", ar: "حدّث", zh: "更新" })} <b>{tr({ en: "fiscal-space candidates", ar: "مرشحات الحيز المالي", zh: "财政空间候选" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "Balances & Free Cost Report", ar: "تقرير الأرصدة والتكلفة الحرة", zh: "余额与自由成本报告" })}</span><span className="age">35m</span></div>
        <div className="row"><span className="rp-uc uc17">UC-17</span><span className="arr">→</span> {tr({ en: "classified", ar: "صنّف", zh: "分类" })} <b>{tr({ en: "Etimad/SAP differences", ar: "فروق اعتماد/ساب", zh: "Etimad/SAP 差异" })}</b> {tr({ en: "into", ar: "في", zh: "→" })} <span className="tgt">{tr({ en: "Etimad Reconciliation Report", ar: "تقرير مطابقة اعتماد", zh: "Etimad 对账报告" })}</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
      </> : <>
        <div className="row"><span className="rp-uc uc11">UC-11</span><span className="arr">→</span> {tr({ en: "attached", ar: "أرفق", zh: "附入" })} <b>{tr({ en: "memo", ar: "مذكرة", zh: "备忘" })} MEMO-1142</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "G-06 Quarterly", ar: "G-06 الربعي", zh: "G-06 季度报" })}</span><span className="age">1h</span></div>
        <div className="row"><span className="rp-uc uc12">UC-12</span><span className="arr">→</span> {tr({ en: "sent", ar: "أرسل", zh: "推送" })} <b>{tr({ en: "costs & funds data", ar: "بيانات التكاليف والصناديق", zh: "成本与资金数据" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "Costs & Funds Report", ar: "تقرير التكاليف والصناديق", zh: "成本与资金报告" })}</span><span className="age">3h</span></div>
        <div className="row"><span className="rp-uc uc13">UC-13</span><span className="arr">→</span> {tr({ en: "fed", ar: "غذّى", zh: "喂入" })} <b>{tr({ en: "collection results & gap", ar: "نتائج التحصيل والفجوة", zh: "征收结果与缺口" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "Revenue & Collections Report", ar: "تقرير الإيرادات والتحصيل", zh: "收入与征收报告" })}</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
        <div className="row"><span className="rp-uc uc02">UC-02</span><span className="arr">→</span> {tr({ en: "flagged", ar: "رصد", zh: "标记" })} <b>{tr({ en: "1 critical alert", ar: "تنبيه حرج", zh: "1 条严重告警" })}</b> {tr({ en: "into", ar: "في", zh: "→" })} <span className="tgt">{tr({ en: "Executive Summary", ar: "الملخص التنفيذي", zh: "执行摘要" })}</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
      </>}
    </div>
    <div className="rp-filters">
      <div className="rp-fchip"><div className="k">{tr({ en: "Type", ar: "النوع", zh: "类型" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
      <div className="rp-fchip"><div className="k">{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div className="v">FY 2026 · Q2 ▾</div></div>
      <div className="rp-fchip"><div className="k">{tr({ en: "Department", ar: "الإدارة", zh: "部门" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
      <div className="rp-fchip"><div className="k">{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
      <button className="rp-newbtn" style={{ marginInlineStart: "auto" }} onClick={() => setNw(true)}>+ {tr({ en: "New report", ar: "تقرير جديد", zh: "新建报告" })}</button>
    </div>
    <div className="rp-libtbl">
      <div className="rp-libhead"><div>{tr({ en: "Report", ar: "التقرير", zh: "报告" })}</div><div>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</div><div>{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div>{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</div><div>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</div><div>{tr({ en: "Updated", ar: "محدّث", zh: "更新" })}</div></div>
      {reports.map(x => (<div className="rp-librow" key={x.id} onClick={() => setOpen(x.id)}>
        <div className="rp-rn">{tr(x.name)}<div className="sub">{tr(x.sub)}</div></div>
        <div>{tr(x.type)}</div><div>{x.period}</div>
        <div className="rp-srcs">{x.srcs.map((c, i) => <span className={"rp-uc " + ucCls(c)} key={i}>{c}</span>)}</div>
        <div><span className={"rp-st " + x.status}>{tr(stLabel(x.status))}</span></div>
        <div className="rp-upd">{x.upd}</div>
      </div>))}
    </div>

    {r && createPortal(<div className="rp-ov open" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
      <div className="rp-dw">
        <div className="rp-dwhead"><span className="rp-dwt">📄 {ucl("UC-10", tr({ en: "Report Composer", ar: "منشئ التقارير", zh: "报告编排" }))}</span><button className="rp-dwx" onClick={() => setOpen(null)}>✕ {tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button></div>
        <div className="rp-ctop">
          <div className="rp-ctl">
            <div className="rp-eyebrow">{tr({ en: "Report · view only", ar: "تقرير · للعرض فقط", zh: "报告 · 仅查看" })}{SHOW_UC ? " · UC-10" : ""}</div>
            <h2>{tr(r.title)}</h2>
            <div className="rp-asm"><span className="rp-asmlab">{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</span>{r.srcs.map((c, i) => <span className={"rp-uc " + ucCls(c)} key={i}>UC-{c}</span>)}</div>
          </div>
          <div className="rp-ctr">
            <div className="rp-status">{STEPL.map((l, i) => { const cur = RP_STEPS[r.status]; const cls = i < cur ? "done" : (i === cur ? "cur" : ""); return (<React.Fragment key={i}>{i > 0 && <span className="arr">›</span>}<span className={"s " + cls}><span className="dot" />{tr(l)}</span></React.Fragment>); })}</div>
            <div className="rp-toolbtns"><button className="rp-ebtn" onClick={() => pushLog({ en: "Exporting report to Word…", ar: "تصدير إلى وورد…", zh: "正在导出 Word…" })}>⬇ Word</button><button className="rp-ebtn" onClick={() => pushLog({ en: "Exporting report to Excel…", ar: "تصدير إلى إكسل…", zh: "正在导出 Excel…" })}>⬇ Excel</button><button className="rp-ebtn" onClick={() => pushLog({ en: "Exporting report to PDF…", ar: "تصدير إلى PDF…", zh: "正在导出 PDF…" })}>⬇ PDF</button><button className="rp-send2" onClick={() => pushLog({ en: "Report sent for approval", ar: "أُرسل التقرير للاعتماد", zh: "报告已送审" })}>{tr({ en: "Send for approval", ar: "إرسال للاعتماد", zh: "送审" })} →</button></div>
          </div>
        </div>
        <div className="rp-gate">✓ <b>{tr({ en: "Source data approved", ar: "بيانات المصدر معتمدة", zh: "来源数据已核准" })}</b> — {tr({ en: "official report can be issued (BR-01). Every figure traces to an approved dataset.", ar: "يمكن إصدار التقرير الرسمي (BR-01). كل رقم قابل للتتبع.", zh: "可签发正式报告(BR-01);每个数字均可追溯至已核准数据集。" })}</div>
        <div className="rp-doc">
          <div className="rp-dochd"><div className="rp-doctitle">{tr(r.title)}</div>
            <div className="rp-docmeta"><span>{tr({ en: "Copy No.", ar: "نسخة رقم", zh: "副本号" })} <b>FBC-2026-Q2-118</b></span><span>{tr({ en: "Owner: Financial Reporting Dept", ar: "المالك: إدارة التقارير", zh: "归属:财务报告部" })}</span><span>{tr({ en: "Issue date: pending", ar: "تاريخ الإصدار: معلّق", zh: "发布日期:待定" })}</span><span>{tr({ en: "Sources", ar: "المصادر", zh: "来源" })}: {r.srcs.length} UCs</span></div></div>
          <div className="rp-docb">
            <p className="rp-secl">{tr({ en: "Key figures & indicators · auto-filled from approved data", ar: "أرقام ومؤشرات · معبّأة تلقائياً", zh: "关键指标 · 自动取自已核准数据" })}</p>
            <table className="rp-tbl"><thead><tr><th>{tr({ en: "INDICATOR", ar: "المؤشر", zh: "指标" })}</th><th className="c">{tr({ en: "VALUE", ar: "القيمة", zh: "数值" })}</th><th>{tr({ en: "SOURCE", ar: "المصدر", zh: "来源" })}</th></tr></thead>
              <tbody>
                {isBudgetExecReports ? <>
                  <tr><td>{tr({ en: "Adjusted approved amount", ar: "مبلغ الاعتماد المعدل", zh: "调整后的批准额" })}</td><td className="num">SAR 9.06B</td><td><span className="rp-uc uc17">UC-17</span></td></tr>
                  <tr><td>{tr({ en: "Consumed amount", ar: "المبلغ المستهلك", zh: "已消耗金额" })}</td><td className="num">SAR 1.46B</td><td><span className="rp-uc uc17">UC-17</span></td></tr>
                  <tr><td>{tr({ en: "Reserved funds", ar: "الأموال المحجوزة", zh: "资金预留" })}</td><td className="num">SAR 348M</td><td><span className="rp-uc uc17">UC-17</span></td></tr>
                  <tr><td>{tr({ en: "Spend rate", ar: "معدل الصرف", zh: "支出率" })}</td><td className="num">16.1%</td><td><span className="rp-uc uc17">UC-17</span></td></tr>
                  <tr><td>{tr({ en: "Future obligations under watch", ar: "التزامات مستقبلية تحت المتابعة", zh: "纳入观察的未来义务" })}</td><td className="num">SAR 1.12B</td><td><span className="rp-uc uc04">UC-04</span></td></tr>
                  <tr><td>{tr({ en: "Fiscal-space candidates", ar: "مرشحات الحيز المالي", zh: "财政空间候选" })}</td><td className="num">SAR 712M</td><td><span className="rp-uc uc07">UC-07</span></td></tr>
                </> : <>
                  <tr><td>{tr({ en: "Net billed amount", ar: "صافي المفوتر", zh: "净开票额" })}</td><td className="num">SAR 920M</td><td><span className="rp-uc uc13">{tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })}</span></td></tr>
                  <tr><td>{tr({ en: "Collection rate", ar: "معدل التحصيل", zh: "征收率" })}</td><td className="num">87% (+2.1pp)</td><td><span className="rp-uc uc13">{tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })}</span></td></tr>
                  <tr><td>{tr({ en: "Collection gap", ar: "فجوة التحصيل", zh: "征收缺口" })}</td><td className="num">SAR 120M</td><td><span className="rp-uc uc13">{tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })}</span></td></tr>
                  <tr><td>{tr({ en: "Capitalized AUC", ar: "المرسمل", zh: "已资本化在建" })}</td><td className="num">SAR 1.92B</td><td><span className="rp-uc uc14">{tr({ en: "Assets", ar: "الأصول", zh: "资产部" })}</span></td></tr>
                  <tr><td>{tr({ en: "Allocated project cost", ar: "تكلفة المشروع الموزّعة", zh: "已分摊项目成本" })}</td><td className="num">SAR 2.14B</td><td><span className="rp-uc uc12">{tr({ en: "Cost Management", ar: "إدارة التكاليف", zh: "成本管理部" })}</span></td></tr>
                  <tr><td>{tr({ en: "Compliance memos (open)", ar: "مذكرات الامتثال (مفتوحة)", zh: "合规备忘(未结)" })}</td><td className="num">1</td><td><span className="rp-uc uc11">{tr({ en: "Compliance", ar: "الامتثال", zh: "合规部" })}</span></td></tr>
                </>}
              </tbody></table>
            <p className="rp-secl">{tr({ en: "Trend · collection rate by quarter", ar: "الاتجاه · معدل التحصيل ربعياً", zh: "趋势 · 各季度征收率" })}</p>
            <CollectionTrendPreview />
            <p className="rp-secl">{tr({ en: "Narrative commentary · auto-generated", ar: "تعليق سردي · مولّد تلقائياً", zh: "叙述评述 · 自动生成" })}</p>
            <div className="rp-narr"><span className="tag">AI</span>{tr({ en: "Collection rate rose to 87% (+2.1pp). ", ar: "ارتفع معدل التحصيل إلى 87% (+2.1). ", zh: "征收率升至 87%(环比 +2.1pp)。" })}<span className="dev">{tr({ en: "Deviation:", ar: "انحراف:", zh: "偏差:" })}</span>{tr({ en: " a SAR 120M gap remains in 3 Amanat (lease arrears >60d). SAR 1.92B of AUC was capitalized; ", ar: " تبقى فجوة 120 مليون في 3 أمانات. ورُسمل 1.92 مليار؛ ", zh: " SAR 120M 缺口集中于 3 个阿玛纳(租约逾期>60天)。已资本化 SAR 1.92B 在建资产;" })}<span className="dev">{tr({ en: "deviation:", ar: "انحراف:", zh: "偏差:" })}</span>{tr({ en: " 3 equipment items flagged for impairment. ", ar: " 3 معدات مرصودة للانخفاض. ", zh: "3 项设备标记减值。" })}<span className="dev">{tr({ en: "Open item:", ar: "بند مفتوح:", zh: "未结项:" })}</span>{tr({ en: " 1 useful-life policy conflict (UC-11) pending before issuance.", ar: " تعارض سياسة عمر إنتاجي معلّق قبل الإصدار.", zh: " 1 项使用年限政策冲突(UC-11)待解决后方可签发。" })}</div>
            <div className="rp-narrnote">{tr({ en: "Commentary explains deviations, not just numbers (BR-02) · human review required before release.", ar: "التعليق يفسّر الانحرافات لا الأرقام فقط (BR-02) · يلزم مراجعة بشرية.", zh: "评述解释偏差而非仅罗列数字(BR-02)· 签发前需人工复核。" })}</div>
            <p className="rp-secl">{tr({ en: "Data sources · lineage", ar: "مصادر البيانات · التتبع", zh: "数据来源 · 追溯" })}</p>
            <div className="rp-lin"><span className="ln">{tr({ en: "Net billed, collection, gap", ar: "المفوتر والتحصيل والفجوة", zh: "净开票、征收、缺口" })}</span><span className="src">← {tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Capitalized AUC, impairment", ar: "المرسمل والانخفاض", zh: "资本化在建、减值" })}</span><span className="src">← {tr({ en: "Assets", ar: "الأصول", zh: "资产部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Allocated cost, idle surplus", ar: "التكلفة الموزّعة والفائض", zh: "分摊成本、闲置结余" })}</span><span className="src">← {tr({ en: "Cost Management", ar: "إدارة التكاليف", zh: "成本管理部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Compliance memo & basis", ar: "مذكرة الامتثال والأساس", zh: "合规备忘与依据" })}</span><span className="src">← {tr({ en: "Compliance", ar: "الامتثال", zh: "合规部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Audit trail & permissions", ar: "سجل التدقيق والصلاحيات", zh: "审计轨迹与权限" })}</span><span className="src">← {tr({ en: "Audit / Smart Query", ar: "التدقيق / الاستعلام", zh: "审计 / 智能查询" })} →</span></div>
          </div>
        </div>
        <div className="rp-lock">🔒 {tr({ en: "Approved version saved immutably; edits create a new version (BR-04). Each copy carries number, owner, date & sources (BR-03).", ar: "النسخة المعتمدة تُحفظ دون تعديل؛ التعديل يُنشئ نسخة جديدة (BR-04). وكل نسخة تحمل رقماً ومالكاً وتاريخاً ومصادر (BR-03).", zh: "已批准版本不可变保存;修改生成新版本(BR-04)。每份副本含编号、归属、日期与来源(BR-03)。" })}</div>
      </div>
    </div>, document.body)}
    {nw && createPortal(<div className="rp-nov" onClick={(e) => { if (e.target === e.currentTarget) setNw(false); }}>
      <div className="rp-ncard">
        <div className="rp-nhd">{tr({ en: "New report", ar: "تقرير جديد", zh: "新建报告" })}<button className="x" onClick={() => setNw(false)}>✕</button></div>
        <div className="rp-nbody">
          <div className="rp-nlab">{tr({ en: "How do you want to start?", ar: "كيف تريد البدء؟", zh: "从哪种方式开始?" })}</div>
          <div className="rp-nmodes">
            <div className={"rp-nmode" + (nmode === "tmpl" ? " on" : "")} onClick={() => setNmode("tmpl")}>📋 {tr({ en: "From a template", ar: "من قالب", zh: "用模板" })}<div className="sub">{tr({ en: "Pick an approved template", ar: "اختر قالباً معتمداً", zh: "选择已批准模板" })}</div></div>
            <div className={"rp-nmode" + (nmode === "nl" ? " on" : "")} onClick={() => setNmode("nl")}>💬 {tr({ en: "Ask in natural language", ar: "بلغة طبيعية", zh: "自然语言" })}<div className="sub">{tr({ en: "Describe the report you need", ar: "صف التقرير المطلوب", zh: "描述你要的报告" })}</div></div>
          </div>
          {nmode === "tmpl"
            ? <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Template", ar: "القالب", zh: "模板" })}</div><select value={ntmpl} onChange={e => setNtmpl(e.target.value)}>{TEMPLATES.map(t => <option key={t.key} value={t.key}>{tr(t.name)}</option>)}</select></div>
            : <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Request", ar: "الطلب", zh: "请求" })}</div><input value={nnl} onChange={e => setNnl(e.target.value)} placeholder={tr({ en: "e.g. Overdue by Amanah this quarter", ar: "مثال: التأخر حسب الأمانة هذا الربع", zh: "例:本季度按阿玛纳逾期" })} /></div>}
          <div className="rp-nrow2">
            <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div className="rp-nval">FY 2026 · Q2 ▾</div></div>
            <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</div><div className="rp-nval">{tr({ en: "6 Amanat", ar: "6 أمانات", zh: "6 个阿玛纳" })} ▾</div></div>
          </div>
        </div>
        <div className="rp-nfoot"><button className="rp-ncancel" onClick={() => setNw(false)}>{tr({ en: "Cancel", ar: "إلغاء", zh: "取消" })}</button><button className="rp-ngen" onClick={genReport}>✦ {tr({ en: "Generate report", ar: "إنشاء التقرير", zh: "生成报告" })}</button></div>
      </div>
    </div>, document.body)}
  </div>);
}

/* ======= Financial Performance Analysis — workspace (Archetype B · analytical) ======= */
/* =========================================================================
   Generic department workspace (replicates the UC-13 / UC-14 reference shell)
   ========================================================================= */
function WsFlowCard({ to, title }) {
  const { tr, setRoute, route, setBackRoute } = useStore();
  return (<div className="ws-flowcard" onClick={() => { setBackRoute(route); setRoute(to || "rcdata"); }} title={tr({ en: "Open Multi-Agent Flow", ar: "فتح تدفّق الوكلاء", zh: "打开多智能体流程" })}>
    <div className="ws-flowcard-h"><span>{tr({ en: "Multi-Agent Flow", ar: "تدفّق متعدد الوكلاء", zh: "多智能体流程" })}</span><span className="ws-flowcard-hr"><span className="at-tip at-tip-r" onClick={(e) => e.stopPropagation()} aria-label={tr(title || { en: "Department multi-agent flow", ar: "تدفق الوكلاء المتعدد للإدارة", zh: "部门多智能体流程" })} tabIndex={0}>i<span className="at-tip-pop">{tr(title || { en: "Department multi-agent flow", ar: "تدفق الوكلاء المتعدد للإدارة", zh: "部门多智能体流程" })}</span></span><span className="open">↗</span></span></div>
    <svg className="ws-flowthumb" viewBox="0 0 300 44" fill="none" preserveAspectRatio="xMidYMid meet">
      <rect x="4" y="5" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="14" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="23" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="32" width="20" height="7" rx="2" fill="#eef2f7" />
      <rect x="40" y="12" width="28" height="20" rx="4" fill="#fff" stroke="#2563eb" strokeWidth="1.4" />
      <rect x="86" y="5" width="40" height="9" rx="2.5" fill="#2563eb" /><rect x="86" y="18" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" /><rect x="86" y="31" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" />
      <rect x="138" y="16" width="20" height="12" rx="3.5" fill="#eef4ff" stroke="#cdddfb" strokeWidth="0.8" />
      <rect x="172" y="9" width="50" height="26" rx="5" fill="#2563eb" /><circle cx="197" cy="22" r="4" fill="#fff" />
      <rect x="236" y="11" width="40" height="9" rx="2.5" fill="#e9f7ef" stroke="#bfe6cf" strokeWidth="0.8" /><rect x="236" y="24" width="40" height="9" rx="2.5" fill="#fdf4d9" stroke="#f0dca6" strokeWidth="0.8" />
      <g stroke="#c2cbd6" strokeWidth="1"><path d="M24 22 H40" /><path d="M68 22 H86" /><path d="M126 22 H138" /><path d="M158 22 H172" /><path d="M222 22 H236" /></g>
    </svg>
  </div>);
}

function WorkspaceQuickAction({ cfg }) {
  const { tr, setRoute, route, setBackRoute } = useStore();
  if (!cfg) return null;
  return (
    <div className={"ws-qaction" + (cfg.tone ? " " + cfg.tone : "")}>
      <div className="ws-qcopy">
        <div className="ws-qeyebrow">{tr(cfg.eyebrow || { en: "Quick entry", ar: "دخول سريع", zh: "快捷入口" })}</div>
        <div className="ws-qt">{tr(cfg.title)}</div>
        <div className="ws-qs">{tr(cfg.sub)}</div>
      </div>
      <button className="btn danger sm ws-qbtn" onClick={() => { if (!cfg.to) return; setBackRoute(route); setRoute(cfg.to); }}>
        {tr(cfg.buttonLabel || { en: "Open", ar: "فتح", zh: "打开" })} ↗
      </button>
    </div>
  );
}

function OrchChat({ cfg }) {
  const { tr, pushLog, lang } = useStore();
  const smartItems = Array.isArray(cfg.smartItems) ? cfg.smartItems : [];
  const [phase, setPhase] = useState("idle");
  const [prompt, setPrompt] = useState(tr(cfg.defaultPrompt));
  const [sent, setSent] = useState(null);
  const [queuedSmartItem, setQueuedSmartItem] = useState(null);
  const [activeSmartItem, setActiveSmartItem] = useState(null);
  const [tl, setTl] = useState(["queued", "queued", "queued", "queued"]);
  const [thk, setThk] = useState(["queued", "queued", "queued", "queued"]);
  const [stage, setStage] = useState("idle");
  const [showDiff, setShowDiff] = useState(false);
  const timersRef = useRef([]);
  const bodyRef = useRef(null);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => { if (phase === "idle") setPrompt(tr(cfg.defaultPrompt)); }, [lang]);
  useEffect(() => () => clearTimers(), []);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [tl, thk, phase, sent, showDiff, activeSmartItem]);
  const THINK_STEPS = [
    { en: "Interpreting intent", ar: "تفسير القصد", zh: "解析意图" },
    { en: "Checking permission scope", ar: "التحقق من نطاق الصلاحيات", zh: "检查权限范围" },
    { en: "Selecting agents", ar: "اختيار الوكلاء", zh: "选择智能体" },
    { en: "Planning subtasks", ar: "تخطيط المهام الفرعية", zh: "规划子任务" },
  ];
  const PH = {
    idle: { t: { en: "ready", ar: "جاهز", zh: "就绪" }, c: "var(--muted)" },
    running: { t: { en: "running", ar: "يعمل", zh: "运行中" }, c: "var(--info)" },
    review: { t: { en: "awaiting review", ar: "بانتظار المراجعة", zh: "待审批" }, c: "var(--amber)" },
    approved: { t: { en: "completed", ar: "اكتمل", zh: "已完成" }, c: "var(--green-dark)" },
    returned: { t: { en: "returned", ar: "أُعيد", zh: "已退回" }, c: "var(--danger)" },
  };
  const runOrch = () => {
    if (phase === "running" || !prompt.trim()) return;
    const matchedSmartItem = queuedSmartItem || findSmartItemForPrompt(null, prompt, smartItems) || null;
    clearTimers(); setShowDiff(false); setSent(prompt.trim()); setPhase("running"); setStage("think");
    setActiveSmartItem(matchedSmartItem);
    setThk(["think", "queued", "queued", "queued"]);
    setTl(["queued", "queued", "queued", "queued"]);
    pushLog(cfg.startLog);
    [[450, ["done", "think", "queued", "queued"]], [900, ["done", "done", "think", "queued"]], [1350, ["done", "done", "done", "think"]], [1750, ["done", "done", "done", "done"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setThk(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setStage("timeline"); setTl(["think", "queued", "queued", "queued"]); }, 1800));
    [[2500, ["done", "think", "queued", "queued"]], [3300, ["done", "done", "think", "queued"]], [4200, ["done", "done", "done", "think"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setTl(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setPhase("review"); pushLog(cfg.reviewLog); }, 4900));
  };
  const approve = () => {
    if (phase === "approved") return; clearTimers(); setPhase("approved"); setStage("result"); setTl(["done", "done", "done", "done"]);
    pushLog(cfg.approveLog);
  };
  const returnFix = () => {
    clearTimers(); setShowDiff(false); setPhase("returned"); setStage("result"); setTl(["done", "done", "done", "queued"]);
    pushLog(cfg.returnLog);
  };
  const choosePrompt = (p) => {
    const title = tr(p.t);
    const subtitle = tr(p.s);
    const matchedSmartItem = findSmartItemForPrompt(p, title, smartItems);
    setQueuedSmartItem(matchedSmartItem);
    setPrompt(subtitle && !sameSmartQuestion(title, subtitle) ? `${title} · ${subtitle}` : title);
  };
  const activeNextActions = smartActionsToOrchNext(activeSmartItem?.nextActions, cfg.nextActions);
  return (<div className="orch-cell"><div className="orch orch-chat">
    <div className="orch-h">{tr({ en: "Orchestrator", ar: "المنسّق", zh: "编排器" })} {phase === "running" && <span className="pulse" style={{ marginInlineStart: 2 }} />} <span style={{ fontSize: 12, color: PH[phase].c, fontWeight: 600, marginInlineStart: 4 }}>{tr(PH[phase].t)}</span></div>
    <div className="orch-sub">{SHOW_UC ? cfg.uc + " · " : ""}run {cfg.run} · {tr(cfg.agent)}</div>
    <div className="ctx-chips" style={{ marginBottom: 4 }}>{cfg.chips.map((c, i) => <span className="chip gray" key={i}>{c}</span>)}</div>
    <div className="orch-body" ref={bodyRef}>
      {!sent && <div className="orch-empty">
        <div>{tr({ en: "Type a request below — the orchestrator runs the agent timeline, then returns a human-in-the-loop review.", ar: "اكتب طلباً بالأسفل — يشغّل المنسّق الخط الزمني للوكلاء ثم يعيد مراجعة بشرية.", zh: "在下方输入请求——编排器会运行智能体时间线,随后返回人工审批。" })}</div>
        <div className="orch-sugs">{cfg.prompts.map((p, i) => (<button className="orch-sug" key={i} onClick={() => choosePrompt(p)}>↗ {tr(p.t)}</button>))}</div>
      </div>}
      {sent && <div className="chat-msg user"><div className="bubble">{sent}</div></div>}
      {stage === "think" && <div className="msg bot think-msg">
        <div className="av">✦</div>
        <div className="bubble"><div className="think">{THINK_STEPS.map((s, i) => { const st = thk[i]; const stt = st === "done" ? "ok" : st === "think" ? "act" : "";
          return (<div className={"tl " + stt} key={i}><span className="ti">{st === "done" ? "✓" : st === "think" ? "◐" : "○"}</span><span>{tr(s)}</span></div>); })}</div></div>
      </div>}
      {stage === "timeline" && <div className="chat-msg bot">
        <div className="ws-sec-h">{tr({ en: "Agent timeline", ar: "خط زمن الوكلاء", zh: "智能体时间线" })}</div>
        <div className="tl">{cfg.tlMeta.map((e, i) => { const st = tl[i]; const cur = st === "think";
          return (<div className={"ev" + (cur ? " cur" : "")} key={i}>
            <span className={"dotc " + (st === "done" ? "done" : st === "think" ? "think" : "")}>{st === "done" ? "✓" : st === "think" ? "◐" : ""}</span>
            <div className="et">{ucl(e.code, tr(e.t))} {st === "queued" ? <span className="chip gray">{tr({ en: "queued", ar: "في الانتظار", zh: "排队" })}</span> : st === "think" ? <span className="chip info">{tr({ en: "thinking…", ar: "يفكّر…", zh: "思考中…" })}</span> : <span className="chip">{tr({ en: "done", ar: "تم", zh: "完成" })}</span>}</div>
            <div className="es">{tr(e.s)}</div>
          </div>); })}</div>
      </div>}
      {(phase === "review" || phase === "approved" || phase === "returned") && <div className="chat-msg bot">
        {(phase === "review" || phase === "approved") && <OrchSmartResult item={activeSmartItem} />}
        {(phase === "review" || phase === "approved") && <div className="hitl">
          <div className="hh">⚑ {tr({ en: "HUMAN-IN-THE-LOOP REVIEW", ar: "مراجعة بشرية إلزامية", zh: "人工审批" })}</div>
          <div className="hb">{tr(cfg.reviewBody)}</div>
          {phase === "approved"
            ? <span className="chip">✓ {tr(cfg.approvedChip)}</span>
            : <React.Fragment><div className="hitl-btns"><button className="btn" onClick={approve}>✓ {tr(cfg.approveLabel)}</button><button className="btn danger sm" onClick={returnFix}>↺ {tr({ en: "Return for fix", ar: "إعادة للتصحيح", zh: "退回修正" })}</button><button className="btn ghost sm" onClick={() => setShowDiff(v => !v)}>⌥ {tr({ en: "View diff", ar: "عرض الفرق", zh: "查看差异" })}</button></div>
              {showDiff && <div className="diffbox">{cfg.diff.map((d, i) => (<div className={"dl " + d.k} key={i}>{d.k === "rem" ? "− " : "+ "}{tr(d.t)}</div>))}</div>}</React.Fragment>}
        </div>}
        {phase === "returned" && <div className="hitl ret">
          <div className="hh">↺ {tr({ en: "RETURNED FOR FIX", ar: "أُعيد للتصحيح", zh: "已退回修正" })}</div>
          <div className="hb">{tr(cfg.returnBody)}</div>
        </div>}
        {(phase === "review" || phase === "approved") && <OrchNext items={activeNextActions} />}
      </div>}
    </div>
    <div className="orch-bar">
      <textarea className="orch-cin" rows={1} value={prompt} disabled={phase === "running"} onChange={e => { setPrompt(e.target.value); setQueuedSmartItem(null); }} placeholder={tr(cfg.defaultPrompt)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runOrch(); } }} />
      <button className="orch-send" disabled={phase === "running" || !prompt.trim()} onClick={runOrch}>{phase === "running" ? "…" : "SEND"}</button>
    </div>
  </div></div>);
}

function DeptWorkspace({ cfg, configRoute }) {
  const { tr } = useStore();
  const headerConfig = getPageConfigComponent(configRoute, `${configRoute}.title`);
  const title = localizedComponentTitle(headerConfig, cfg.title);
  const mandate = localizedComponentNote(headerConfig, cfg.mandate);
  const smartQueryConfig = useMemo(() => getSmartQueryFabConfig(configRoute, cfg.sqScope, cfg.sqPrompts), [configRoute, cfg.sqScope, cfg.sqPrompts]);
  const orchestratorConfig = useMemo(() => ({
    ...applyOrchestratorConfig(configRoute, cfg.orch),
    smartItems: smartQueryConfig.items,
  }), [configRoute, cfg.orch, smartQueryConfig.items]);
  return (<div className="fade"><div className="card pad ws-frame">
    <div className="ws-head">
      <SmartQueryFab scope={smartQueryConfig.scope} prompts={smartQueryConfig.prompts} items={smartQueryConfig.items} />
      <div className="ws-htext"><h1 style={{ fontSize: 22 }}>{tr(title)}</h1>
        <div className="sub muted">{tr(mandate)}{SHOW_UC ? " · " + cfg.uc : ""}</div></div>
      <div className="ws-story-r">
        <div className="ws-story-h">{tr(cfg.storyTitle || { en: "Department storyline", ar: "مسار الإدارة", zh: "部门故事线" })}</div>
        <div className="flowstrip mini">{(cfg.flow || RC_FLOW).map((f, i) => (<React.Fragment key={i}>{i > 0 && <span className="farr">➜</span>}
          <div className={"fb " + f.cls}>{f.star ? "★ " : ""}{SHOW_UC ? f.code : tr(f.label)}</div></React.Fragment>))}</div>
      </div>
    </div>
    {cfg.sideAction && <WorkspaceQuickAction cfg={cfg.sideAction} />}
    <KpiCarousel tone={cfg.kpiTone} slides={cfg.kpiSlides} configRoute={configRoute} />
    <div className="ws-grid2">
      <div className="ws-left"><BusinessPlaza model={cfg.plazaModel} defaultSel={cfg.plazaSel} /></div>
      <div className="ws-right">
        <OrchChat cfg={orchestratorConfig} />
        <WsFlowCard to={cfg.flowRoute} title={cfg.flowTitle} />
      </div>
    </div>
  </div></div>);
}

/* ---- Financial Performance Analysis (UC-06) ---- */
const WS_CFG_FPA = {
  uc: "UC-06", group02: true, kpiTone: "green", flow: FLOW_FPA, plazaModel: PLAZA_G02, plazaSel: "uc06", flowRoute: "g02fpaflow",
  title: { en: "Financial Performance Analysis", ar: "تحليل الأداء المالي", zh: "财务绩效分析部" },
  mandate: { en: "Performance forecasting, execution review, exception monitoring and executive reporting, connected through a shared decision context.", ar: "التنبؤ بالأداء ومراجعة التنفيذ ومراقبة الاستثناءات والتقارير التنفيذية ضمن سياق قرار مشترك.", zh: "围绕共享决策上下文开展绩效预测、执行复盘、异常监控与管理报告。" },
  sqScope: { en: "Scope: Financial Performance · read-only", ar: "النطاق: الأداء المالي · للقراءة", zh: "范围:财务绩效 · 只读" },
  sqPrompts: [{ en: "Why is execution only 64% vs 95% target?", ar: "لماذا التنفيذ 64% فقط مقابل 95%؟", zh: "为何执行率仅 64%(目标 95%)?" }, { en: "Which Amanat are lagging spend?", ar: "ما الأمانات المتأخرة في الإنفاق؟", zh: "哪些阿玛纳支出滞后?" }, { en: "Draft the leadership one-liner", ar: "صياغة سطر للقيادة", zh: "起草给领导的一句话" }],
  kpiSlides: [
    [
      { lab: { en: "Execution Rate", ar: "معدل التنفيذ", zh: "执行率" }, v: "64.0%", d: { en: "execution is trailing the expected pace", ar: "التنفيذ أبطأ من الوتيرة المتوقعة", zh: "执行进度低于预期节奏" } },
      { lab: { en: "Commitment Utilization", ar: "استخدام الالتزامات", zh: "承诺使用率" }, v: "78%", d: { en: "approved commitments against the active ceiling", ar: "الالتزامات المعتمدة مقابل السقف النشط", zh: "已批准承诺占当前上限的比例" } },
      { lab: { en: "Plan Variance", ar: "انحراف الخطة", zh: "计划偏差" }, v: "−SAR 1.04B", d: { en: "variance against the approved FY2027 baseline", ar: "الانحراف مقابل خط أساس 2027 المعتمد", zh: "相对 FY2027 已批准基线的偏差" } },
      { lab: { en: "Remaining Balance", ar: "الرصيد المتبقي", zh: "剩余余额" }, v: "SAR 2.09B", d: { en: "balance available for staged deployment", ar: "الرصيد المتاح للتوزيع المرحلي", zh: "可供分阶段使用的余额" } },
    ],
    [
      { lab: { en: "Year-end Forecast", ar: "تنبؤ نهاية السنة", zh: "年末预测" }, v: "82%", d: { en: "current pace points to a year-end shortfall", ar: "الوتيرة الحالية تشير إلى فجوة بنهاية العام", zh: "当前节奏显示年末存在缺口" } },
      { lab: { en: "Lagging Entities", ar: "جهات متأخرة", zh: "滞后实体" }, v: "2 / 4", d: { en: "two entities need acceleration plans", ar: "جهتان تحتاجان إلى خطط تسريع", zh: "两个实体需要加速方案" } },
      { lab: { en: "Open Critical Alerts", ar: "تنبيهات حرجة مفتوحة", zh: "未结严重告警" }, v: "3", d: { en: "leadership attention is required", ar: "يلزم انتباه القيادة", zh: "需要管理层关注" } },
      { lab: { en: "Approved Scenario Tracking", ar: "تتبّع السيناريو المعتمد", zh: "已批方案跟踪" }, v: "On", d: { en: "tracking is aligned to the approved direction", ar: "التتبع متوافق مع الاتجاه المعتمد", zh: "跟踪已对齐批准方案" }, up: true },
    ],
    [
      { lab: { en: "Execution by Entity (low 3)", ar: "التنفيذ حسب الجهة (أدنى 3)", zh: "按实体执行率(最低3)" }, aging: [["Al Madinah", 49, "49%"], ["Jeddah", 50, "50%"], ["Makkah", 50, "50%"]] },
      { lab: { en: "Query Confidence", ar: "ثقة الاستعلام", zh: "查询置信度" }, v: "92%", d: { en: "financial answers remain highly traceable", ar: "الإجابات المالية ما زالت عالية القابلية للتتبع", zh: "财务问答仍保持高可追溯性" }, up: true },
      { lab: { en: "Alert Closure Time", ar: "زمن إغلاق التنبيه", zh: "告警闭环时长" }, v: "8 d", d: { en: "closure speed is within the expected range", ar: "سرعة الإغلاق ضمن النطاق المتوقع", zh: "闭环速度仍在合理范围" } },
      { lab: { en: "Highest Variance", ar: "أعلى انحراف", zh: "最高偏差领域" }, v: "Urban Services", d: { en: "the largest active variance is concentrated here", ar: "يتركز أكبر انحراف نشط هنا", zh: "当前最大活跃偏差集中于此" } },
    ],
  ],
  orch: {
    uc: "UC-06", run: "#6021", agent: { en: "Performance agent", ar: "وكيل الأداء", zh: "绩效智能体" },
    chips: ["scope: FY2027", "dept: Secretariat", "policy: target 95%"],
    defaultPrompt: { en: "Explain why execution is at 64% vs the 95% target, identify the lagging Amanat, and draft a leadership acceleration note for review.", ar: "اشرح سبب التنفيذ عند 64% مقابل هدف 95%، وحدّد الأمانات المتأخرة، وصُغ مذكرة تسريع للقيادة للمراجعة.", zh: "解释为何执行率为 64%(目标 95%),识别滞后的阿玛纳,并起草供领导复核的加速说明。" },
    startLog: { en: "Orchestrator started — analyzing execution lag & plan variance (FY2027, Secretariat)", ar: "بدأ المنسّق — تحليل تأخر التنفيذ وانحراف الخطة", zh: "编排器已启动——分析执行滞后与计划偏差(FY2027,秘书处)" },
    reviewLog: { en: "Draft ready — acceleration plan awaits leadership approval", ar: "المسودة جاهزة — خطة التسريع بانتظار اعتماد القيادة", zh: "草稿就绪——加速计划等待领导审批" },
    approveLog: { en: "Leadership approved the acceleration plan; executive note generated", ar: "اعتمدت القيادة خطة التسريع؛ وأُنشئت المذكرة", zh: "领导已批准加速计划;已生成执行说明" },
    returnLog: { en: "Acceleration plan returned to the Performance agent for rework", ar: "أُعيدت خطة التسريع لوكيل الأداء", zh: "加速计划已退回绩效智能体重新处理" },
    prompts: [{ t: { en: "Detect execution lag", ar: "كشف تأخر التنفيذ", zh: "检测执行滞后" }, s: { en: "FY2027 · Secretariat", ar: "2027 · الأمانة", zh: "FY2027 · 秘书处" } }, { t: { en: "Identify lagging Amanat", ar: "تحديد الأمانات المتأخرة", zh: "识别滞后阿玛纳" }, s: { en: "below 62% execution", ar: "أقل من 62%", zh: "执行率 < 62%" } }, { t: { en: "Draft leadership note", ar: "صياغة مذكرة للقيادة", zh: "起草领导说明" }, s: { en: "acceleration plan", ar: "خطة تسريع", zh: "加速计划" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull unified dataset", ar: "سحب البيانات الموحّدة", zh: "拉取统一数据集" }, s: { en: "FY2027 Secretariat ledger reconciled · 0.7s", ar: "دفتر الأمانة 2027 · 0.7 ث", zh: "FY2027 秘书处总账对账 · 0.7s" } },
      { code: "UC-06", t: { en: "compute execution & variance", ar: "احتساب التنفيذ والانحراف", zh: "计算执行与偏差" }, s: { en: "64% execution · −SAR 4.86B vs plan", ar: "64% · −4.86 مليار", zh: "执行 64% · 较计划 −4.86B" } },
      { code: "UC-02", t: { en: "detect lagging Amanat", ar: "كشف الأمانات المتأخرة", zh: "检测滞后阿玛纳" }, s: { en: "scanning 5 Amanat · 2 below 62%", ar: "فحص 5 أمانات · 2 دون 62%", zh: "扫描 5 阿玛纳 · 2 个 <62%" } },
      { code: "UC-06", t: { en: "draft acceleration note", ar: "صياغة مذكرة التسريع", zh: "起草加速说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "An acceleration plan for SAR 4.86B of lagging execution requires leadership sign-off before the note is issued.", ar: "تتطلب خطة تسريع لـ 4.86 مليار من التنفيذ المتأخر اعتماد القيادة قبل إصدار المذكرة.", zh: "针对 SAR 4.86B 滞后执行的加速计划需领导签核后方可发出说明。" },
    approveLabel: { en: "Approve plan", ar: "اعتماد الخطة", zh: "批准计划" },
    approvedChip: { en: "Approved · leadership note generated", ar: "معتمد · أُنشئت المذكرة", zh: "已批准 · 已生成领导说明" },
    diff: [
      { k: "rem", t: { en: "acceleration plan · none", ar: "خطة تسريع · لا شيء", zh: "加速计划 · 无" } },
      { k: "add", t: { en: "acceleration plan · Al Madinah + Jeddah", ar: "خطة تسريع · المدينة + جدة", zh: "加速计划 · 麦地那 + 吉达" } },
      { k: "rem", t: { en: "reallocation flag · none", ar: "إعادة توزيع · لا شيء", zh: "重分配标记 · 无" } },
      { k: "add", t: { en: "reallocation · +SAR 0.6B (Ch.7 → 2 & 5)", ar: "إعادة توزيع · +0.6 مليار (باب 7 ← 2 و5)", zh: "重分配 · +SAR 0.6B(第7章 → 2、5)" } },
    ],
    returnBody: { en: "Plan sent back to the Performance agent. Edit the prompt and run again.", ar: "أُعيدت الخطة لوكيل الأداء. عدّل الطلب وأعد التشغيل.", zh: "计划已退回绩效智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Approve & route acceleration plan to lagging Amanat", ar: "اعتماد وتوجيه خطة التسريع للأمانات المتأخرة", zh: "批准并下发加速计划至滞后阿玛纳" }, owner: "Faisal Al-Dossari", role: { en: "Performance Analysis Lead", ar: "قائد تحليل الأداء", zh: "绩效分析负责人" }, phone: "+966 55 271 6004" },
      { act: { en: "Brief Al Madinah & Jeddah on catch-up plan", ar: "إطلاع المدينة وجدة على خطة اللحاق", zh: "向麦地那与吉达通报追赶计划" }, owner: "Huda Al-Shehri", role: { en: "Regional Budget Officer", ar: "مسؤولة ميزانية إقليمية", zh: "区域预算专员" }, phone: "+966 50 884 2231" },
      { act: { en: "Prepare reallocation case within ceilings", ar: "إعداد ملف إعادة توزيع ضمن السقوف", zh: "在上限内准备重分配方案" }, owner: "Tariq Bin Saleh", role: { en: "FP&A Manager", ar: "مدير التخطيط المالي", zh: "FP&A 经理" }, phone: "+966 53 119 7740" },
    ],
  },
};

/* ---- Audit Department (UC-03 +UC-02) ---- */
const WS_CFG_AUDIT = {
  uc: "UC-03 (+UC-02)", kpiTone: "violet", flow: FLOW_AUD, plazaModel: PLAZA_G04, plazaSel: "uc03", flowRoute: "g04audflow",
  title: { en: "Audit Department", ar: "إدارة التدقيق", zh: "审计部" },
  mandate: { en: "Mandate: smart query, audit log & permissions + deviation oversight (UC-03/UC-02). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: الاستعلام الذكي وسجل التدقيق والصلاحيات + الرقابة على الانحرافات. مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:智能查询、审计日志与权限 + 偏差监督(UC-03/UC-02)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Audit · cross-department read-only", ar: "النطاق: التدقيق · للقراءة عبر الإدارات", zh: "范围:审计 · 跨部门只读" },
  sqPrompts: [{ en: "Who approved the AO-2207 surplus?", ar: "من اعتمد فائض AO-2207؟", zh: "谁批准了 AO-2207 结余?" }, { en: "All SAP ↔ Etimad diffs this quarter", ar: "كل فروق ساب↔اعتماد هذا الربع", zh: "本季度全部 SAP↔Etimad 差异" }, { en: "Findings overdue beyond SLA", ar: "النتائج المتأخرة عن SLA", zh: "超 SLA 的发现" }],
  kpiSlides: [
    [
      { lab: { en: "Open Exceptions", ar: "استثناءات مفتوحة", zh: "未结异常" }, v: "12", d: { en: "+3 this week (UC-02)", ar: "+3 هذا الأسبوع (UC-02)", zh: "本周 +3(UC-02)" } },
      { lab: { en: "Critical / High", ar: "حرج / مرتفع", zh: "严重 / 高" }, v: "2 / 4", d: { en: "by risk level", ar: "حسب مستوى الخطر", zh: "按风险等级" } },
      { lab: { en: "Avg Closure Time", ar: "متوسط زمن الإغلاق", zh: "平均结案时长" }, v: "8 d", d: { en: "−1 QoQ", ar: "−1 ربعياً", zh: "环比 −1" }, up: true },
      { lab: { en: "SLA Breaches", ar: "تجاوزات SLA", zh: "SLA 超期" }, v: "1", d: { en: "AO-2207 · 48h", ar: "AO-2207 · 48 س", zh: "AO-2207 · 48h" } },
    ],
    [
      { lab: { en: "Audit Log Entries", ar: "إدخالات سجل التدقيق", zh: "审计日志条目" }, v: "38", d: { en: "last 24h (UC-03)", ar: "آخر 24 س (UC-03)", zh: "近 24h(UC-03)" } },
      { lab: { en: "Answer Confidence", ar: "ثقة الإجابة", zh: "回答置信度" }, v: "92%", d: { en: "avg on queries (UC-03)", ar: "متوسط الاستعلامات", zh: "查询均值(UC-03)" }, up: true },
      { lab: { en: "Data Quality (completion)", ar: "جودة البيانات (الاكتمال)", zh: "数据质量(完整度)" }, v: "96%", d: { en: "required fields complete (UC-01)", ar: "اكتمال الحقول (UC-01)", zh: "必填字段完整(UC-01)" } },
      { lab: { en: "Cross-dept Feeds", ar: "تغذية بين الإدارات", zh: "跨部门馈入" }, v: "6", d: { en: "live sources", ar: "مصادر حية", zh: "实时来源" } },
    ],
    [
      { lab: { en: "Findings by Severity", ar: "النتائج حسب الخطورة", zh: "按严重度发现" }, aging: [["Crit", 20, "2"], ["High", 40, "4"], ["Med", 100, "6"]] },
      { lab: { en: "Overdue > SLA", ar: "متأخر عن SLA", zh: "超 SLA" }, v: "1", d: { en: "needs escalation", ar: "يحتاج تصعيد", zh: "需升级" } },
      { lab: { en: "Remediation On-time", ar: "المعالجة في الوقت", zh: "整改按时率" }, v: "92%", d: { en: "within SLA", ar: "ضمن SLA", zh: "SLA 内" }, up: true },
      { lab: { en: "Audit Coverage", ar: "تغطية التدقيق", zh: "审计覆盖" }, v: "86%", d: { en: "target 90% · −4pp", ar: "الهدف 90% · −4", zh: "目标 90% · −4pp" } },
    ],
  ],
  orch: {
    uc: "UC-03", run: "#1503", agent: { en: "Audit & Smart-Query agent", ar: "وكيل التدقيق والاستعلام", zh: "审计与智能查询智能体" },
    chips: ["scope: cross-dept", "dept: read-only", "policy: SLA 48h"],
    defaultPrompt: { en: "Trace who approved the AO-2207 idle surplus, list all findings overdue beyond SLA, and draft an escalation note for the Executive Office.", ar: "تتبّع من اعتمد فائض AO-2207 الخامل، واسرد النتائج المتأخرة عن SLA، وصُغ مذكرة تصعيد للمكتب التنفيذي.", zh: "追溯谁批准了 AO-2207 闲置结余,列出所有超 SLA 的发现,并起草发给执行办公室的升级说明。" },
    startLog: { en: "Orchestrator started — tracing AO-2207 approvals & SLA breaches (cross-dept)", ar: "بدأ المنسّق — تتبّع اعتمادات AO-2207 وتجاوزات SLA", zh: "编排器已启动——追溯 AO-2207 审批与 SLA 超期(跨部门)" },
    reviewLog: { en: "Draft ready — AO-2207 escalation awaits audit-lead authorization", ar: "المسودة جاهزة — تصعيد AO-2207 بانتظار اعتماد قائد التدقيق", zh: "草稿就绪——AO-2207 升级等待审计负责人授权" },
    approveLog: { en: "Audit Lead authorized AO-2207 escalation; routed to Executive Office", ar: "اعتمد قائد التدقيق تصعيد AO-2207؛ وأُرسل للمكتب التنفيذي", zh: "审计负责人已授权 AO-2207 升级;已转交执行办公室" },
    returnLog: { en: "Escalation note returned to the Audit agent for rework", ar: "أُعيدت مذكرة التصعيد لوكيل التدقيق", zh: "升级说明已退回审计智能体重新处理" },
    prompts: [{ t: { en: "Trace AO-2207 approvals", ar: "تتبّع اعتمادات AO-2207", zh: "追溯 AO-2207 审批" }, s: { en: "full approval chain", ar: "سلسلة الاعتماد", zh: "完整审批链" } }, { t: { en: "Findings overdue beyond SLA", ar: "نتائج متأخرة عن SLA", zh: "超 SLA 发现" }, s: { en: "this quarter", ar: "هذا الربع", zh: "本季度" } }, { t: { en: "Draft escalation note", ar: "صياغة مذكرة تصعيد", zh: "起草升级说明" }, s: { en: "to Executive Office", ar: "للمكتب التنفيذي", zh: "发执行办公室" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull cross-dept audit data", ar: "سحب بيانات التدقيق", zh: "拉取跨部门审计数据" }, s: { en: "28,140 events indexed · 0.8s", ar: "28,140 حدثاً · 0.8 ث", zh: "索引 28,140 事件 · 0.8s" } },
      { code: "UC-03", t: { en: "run smart query & audit log", ar: "تشغيل الاستعلام والسجل", zh: "运行智能查询与审计日志" }, s: { en: "AO-2207 chain reconstructed · 3 approvers", ar: "إعادة بناء سلسلة AO-2207 · 3 معتمدين", zh: "重建 AO-2207 链 · 3 名审批人" } },
      { code: "UC-02", t: { en: "score findings vs SLA", ar: "تقييم النتائج مقابل SLA", zh: "按 SLA 评估发现" }, s: { en: "12 open · 1 breached SLA", ar: "12 مفتوحة · 1 تجاوز SLA", zh: "12 未结 · 1 超 SLA" } },
      { code: "UC-03", t: { en: "draft escalation note", ar: "صياغة مذكرة التصعيد", zh: "起草升级说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "Escalating the AO-2207 critical finding to the Executive Office requires audit-lead authorization before the note is sent.", ar: "يتطلب تصعيد نتيجة AO-2207 الحرجة للمكتب التنفيذي اعتماد قائد التدقيق قبل الإرسال.", zh: "将 AO-2207 严重发现升级至执行办公室,需审计负责人授权后方可发送。" },
    approveLabel: { en: "Authorize escalation", ar: "اعتماد التصعيد", zh: "批准升级" },
    approvedChip: { en: "Authorized · routed to Exec Office", ar: "معتمد · أُرسل للمكتب التنفيذي", zh: "已授权 · 转交执行办公室" },
    diff: [
      { k: "rem", t: { en: "escalation · none", ar: "تصعيد · لا شيء", zh: "升级 · 无" } },
      { k: "add", t: { en: "escalation · AO-2207 idle surplus (48h SLA)", ar: "تصعيد · فائض AO-2207 الخامل (SLA 48 س)", zh: "升级 · AO-2207 闲置结余(48h SLA)" } },
      { k: "rem", t: { en: "remediation owner · unassigned", ar: "مسؤول المعالجة · غير معيّن", zh: "整改负责人 · 未指派" } },
      { k: "add", t: { en: "remediation owner · Cost Mgmt + Exec Office", ar: "مسؤول المعالجة · إدارة التكاليف + المكتب التنفيذي", zh: "整改负责人 · 成本管理 + 执行办公室" } },
    ],
    returnBody: { en: "Escalation sent back to the Audit agent. Edit the prompt and run again.", ar: "أُعيد التصعيد لوكيل التدقيق. عدّل الطلب وأعد التشغيل.", zh: "升级已退回审计智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Authorize AO-2207 escalation to Executive Office", ar: "اعتماد تصعيد AO-2207 للمكتب التنفيذي", zh: "批准 AO-2207 升级至执行办公室" }, owner: "Mansour Al-Harbi", role: { en: "Audit Lead", ar: "قائد التدقيق", zh: "审计负责人" }, phone: "+966 55 330 1907" },
      { act: { en: "Assign remediation owner & start 48h clock", ar: "تعيين مسؤول المعالجة وبدء ساعة 48", zh: "指派整改负责人并启动 48h 时钟" }, owner: "Reem Al-Subaie", role: { en: "Compliance Reviewer", ar: "مراجعة الامتثال", zh: "合规复核" }, phone: "+966 50 442 8853" },
      { act: { en: "Attach evidence for INV-4471 duplicate", ar: "إرفاق أدلة لتكرار INV-4471", zh: "为 INV-4471 重复项附证据" }, owner: "Yousef Al-Nasser", role: { en: "Audit Analyst", ar: "محلل تدقيق", zh: "审计分析师" }, phone: "+966 53 667 2210" },
    ],
  },
};

function BudgetExecutionTrackingPage() {
  const { tr, pushLog } = useStore();
  const [selectedId, setSelectedId] = useState("jeddah-300020200");
  const [copilotMode, setCopilotMode] = useState("explain");
  const [followUp, setFollowUp] = useState("");
  const [chatTurns, setChatTurns] = useState([
    { role: "assistant", text: { en: "Select a budget line, then use a preset question or ask directly. I will answer from SAP/Asas, Etimad and the BRD execution chain.", ar: "اختر بند ميزانية، ثم استخدم سؤالاً جاهزاً أو اسأل مباشرة. سأجيب من ساب/أساس واعتماد وسلسلة التنفيذ حسب BRD.", zh: "选择预算行后，可点击预制问题或直接追问。我会基于 SAP/Asas、Etimad 与 BRD 执行链回答。" } },
  ]);
  const chatLogRef = useRef(null);
  const defaultFilters = { fiscalYear: "all", period: "all", city: "all", project: "all", supplier: "all", planStatus: "all", status: "all" };
  const [filters, setFilters] = useState(defaultFilters);
  const pageHeaderComponent = getPageConfigComponent("budexec17", "budexec17.title");
  const pageHeader = pageHeaderComponent ? {
    title: localizedComponentTitle(pageHeaderComponent, { en: "Automated Budget Execution Monitoring & Operational Reconciliation", ar: "المراقبة الآلية لتنفيذ الميزانية والتسوية التشغيلية", zh: "预算执行监控与运营对账自动化" }),
    sub: localizedComponentNote(pageHeaderComponent, { en: "SAP/Asas financial-truth view for allocations, commitments, invoices, payments, transfers, balances and fund availability; Copilot translates raw movements into business state and reconciles Etimad / Etimad Plus signals.", ar: "منظور الحقيقة المالية من ساب/أساس للاعتمادات والالتزامات والفواتير والمدفوعات والمناقلات والأرصدة وتوافر التمويل؛ يترجم المساعد الحركات الخام إلى حالة أعمال ويطابق إشارات اعتماد / اعتماد بلس.", zh: "以 SAP/Asas 作为预算分配、承诺、发票、付款、转移、余额与资金可用性的财务真相；Copilot 将原始 movement 翻译为业务状态，并对账 Etimad / Etimad Plus 信号。" }),
  } : getPageItem("g03", "page_headers", "budexec17", {
    title: { en: "Automated Budget Execution Monitoring & Operational Reconciliation", ar: "المراقبة الآلية لتنفيذ الميزانية والتسوية التشغيلية", zh: "预算执行监控与运营对账自动化" },
    sub: { en: "SAP/Asas financial-truth view for allocations, commitments, invoices, payments, transfers, balances and fund availability; Copilot translates raw movements into business state and reconciles Etimad / Etimad Plus signals.", ar: "منظور الحقيقة المالية من ساب/أساس للاعتمادات والالتزامات والفواتير والمدفوعات والمناقلات والأرصدة وتوافر التمويل؛ يترجم المساعد الحركات الخام إلى حالة أعمال ويطابق إشارات اعتماد / اعتماد بلس.", zh: "以 SAP/Asas 作为预算分配、承诺、发票、付款、转移、余额与资金可用性的财务真相；Copilot 将原始 movement 翻译为业务状态，并对账 Etimad / Etimad Plus 信号。" },
  });

  const defaultLedgerRows = [
    {
      id: "jeddah-300020200", entity: "Jeddah Amana", fiscalYear: "FY2026", period: "Q2 · April close", city: "Jeddah", project: "Urban roads rehabilitation", supplier: "Nesma Partners", planned: 360, actual: 410, planStatus: "over", item: "300020200 · Roads maintenance", line: "SAP 5100/6200/6900 · CT-8831", original: 1840, enhancement: 320, reduction: 0, transferIn: 60, transferOut: 140, adjusted: 2080, reserved: 68, committed: 620, invoice: 410, paid: 310, available: 982, remaining: 1670, freeCost: 532, fund: 826, idle: 184, stale: 226, gap: 52, severity: "risk", prId: "PR-8831", poId: "PO-8831", contractId: "CT-8831", invoiceId: "INV-4472", reservationId: "RSV-4472", consumeDoc: "CONS-11882", paymentOrder: "PAY-11882 partial", stageIndex: 5, missingStages: ["payment"], stageLabel: { en: "Consumed, payment ageing", ar: "استهلاك مرحل وترحيل الدفع متأخر", zh: "已消耗，付款账龄观察" }, stageNote: { en: "BRD chain is complete through consumption; payment is 76 days behind commitment.", ar: "السلسلة مكتملة حتى الاستهلاك؛ الدفع متأخر 76 يوماً عن الالتزام.", zh: "BRD 链路已到消耗，付款较承诺滞后 76 天。" }, matchReason: { en: "Timing + unclassified PO linkage", ar: "توقيت + ربط أمر شراء غير مصنف", zh: "时间差 + 未分类 PO 关联" },
      tags: [{ cls: "risk", text: { en: "Risk", ar: "مخاطر", zh: "风险" } }, { cls: "warn", text: { en: "76d stale commitment", ar: "التزام متوقف 76 يوماً", zh: "承诺 76 天未推进" } }],
      explanation: { en: "SAP shows the same business event across commitment, invoice and payment movements. The commitment is still larger than the invoiced amount, and Etimad Plus has not closed the matching claim package.", ar: "تُظهر ساب الحدث التجاري نفسه عبر حركات الالتزام والفاتورة والدفع. لا يزال الالتزام أكبر من مبلغ الفواتير، ولم تغلق اعتماد بلس حزمة المطالبة المطابقة.", zh: "SAP 将同一业务事件拆成承诺、发票、付款多行 movement。当前承诺额仍明显高于发票额，Etimad Plus 的匹配索赔包尚未关闭。" },
      reason: { en: "Gap is mainly timing plus an unclassified PO linkage. The line should be owned by Budget Execution and Etimad reconciliation before any transfer is approved.", ar: "الفجوة ناتجة غالباً عن التوقيت ورابط أمر شراء غير مصنف. يجب أن تتولى تنفيذ الميزانية ومطابقة اعتماد هذا البند قبل اعتماد أي مناقلة.", zh: "差异主要来自时间差和未分类的 PO 关联。该预算行需要先由预算执行与 Etimad 对账负责人确认，再考虑转移。" },
      action: { en: "Hold transfer; request Etimad claim closure", ar: "تعليق المناقلة وطلب إغلاق مطالبة اعتماد", zh: "暂缓转移；请求关闭 Etimad 索赔包" },
      evidence: ["SAP movement 5100/6200/6900", "Etimad claim CLM-4472", "Payment order PAY-11882"],
    },
    {
      id: "asir-300040110", entity: "Asir Amana", fiscalYear: "FY2026", period: "Q2 · April close", city: "Abha", project: "Stormwater channels", supplier: "Al Yamama", planned: 210, actual: 128, planStatus: "under", item: "300040110 · Drainage works", line: "SAP 5100/6100 · CT-7719", original: 1080, enhancement: 160, reduction: 30, transferIn: 40, transferOut: 70, adjusted: 1180, reserved: 34, committed: 240, invoice: 128, paid: 92, available: 778, remaining: 1052, freeCost: 504, fund: 706, idle: 318, stale: 64, gap: -18, severity: "opportunity", prId: "PR-7719", poId: "PO-7719", contractId: "CT-7719", invoiceId: "INV-7719-04", reservationId: "RSV-7719", consumeDoc: "CONS-7719", paymentOrder: "PAY-7719", stageIndex: 6, missingStages: [], stageLabel: { en: "Consumed, idle balance available", ar: "استهلاك مرحل ورصيد خامل متاح", zh: "已消耗，存在可用闲置余额" }, stageNote: { en: "Full PR-to-consumption chain exists; free cost is a transfer candidate after obligation check.", ar: "السلسلة كاملة من طلب الشراء إلى الاستهلاك؛ التكلفة الحرة مرشحة للمناقلة بعد فحص الالتزامات.", zh: "PR 到消耗链路完整；义务检查后自由成本可作为转移候选。" }, matchReason: { en: "Etimad posted claim classification before SAP snapshot", ar: "اعتماد صنف المطالبة قبل لقطة ساب", zh: "Etimad 索赔分类早于 SAP 快照" },
      tags: [{ cls: "opportunity", text: { en: "Opportunity", ar: "فرصة", zh: "机会" } }, { cls: "idle", text: { en: "Idle budget", ar: "ميزانية خاملة", zh: "闲置预算" } }],
      explanation: { en: "The line has enough approved budget and cash headroom, but the consumption chain is moving slowly. It is a transfer candidate if future obligation checks stay clean.", ar: "يمتلك البند اعتماداً ومساحة نقدية كافية، لكن سلسلة الاستهلاك بطيئة. يمكن اعتباره مرشحاً للمناقلة إذا ظلت فحوص الالتزامات المستقبلية سليمة.", zh: "该行预算和现金空间都充足，但消费链推进较慢。如果未来义务检查无压力，可作为预算转移候选。" },
      reason: { en: "Negative gap means Etimad has slightly more recent claim classification than SAP. Treat it as a sync timing issue, not a financial break.", ar: "تعني الفجوة السالبة أن تصنيف مطالبة اعتماد أحدث قليلاً من ساب. تُعامل كفرق توقيت مزامنة لا كخلل مالي.", zh: "负差异说明 Etimad 的索赔分类略早于 SAP 入账，更像同步时点差异，不是财务断点。" },
      action: { en: "Candidate release SAR 180M after obligation check", ar: "إتاحة محتملة 180 مليون ريال بعد فحص الالتزامات", zh: "义务检查后可释放 SAR 180M" },
      evidence: ["Availability report AVL-26-04", "No open invoice above 45d", "Forecast pressure check clean"],
    },
    {
      id: "riyadh-300010090", entity: "Riyadh Region", fiscalYear: "FY2026", period: "Q2 · April close", city: "Riyadh", project: "Smart lighting rollout", supplier: "Saudi Controls", planned: 505, actual: 520, planStatus: "ontrack", item: "300010090 · Smart city Opex", line: "SAP 5100/6200/6900 · CT-6620", original: 2260, enhancement: 220, reduction: 0, transferIn: 80, transferOut: 140, adjusted: 2420, reserved: 44, committed: 760, invoice: 520, paid: 404, available: 1096, remaining: 1900, freeCost: 292, fund: 908, idle: 72, stale: 38, gap: 12, severity: "healthy", prId: "PR-6620", poId: "PO-6620", contractId: "CT-6620", invoiceId: "INV-90031", reservationId: "RSV-90031", consumeDoc: "CONS-90031", paymentOrder: "PAY-90031", stageIndex: 6, missingStages: [], stageLabel: { en: "Payment cleared, chain healthy", ar: "الدفع مسوى والسلسلة سليمة", zh: "付款已清算，链路健康" }, stageNote: { en: "Contract, invoice, reservation, consumption and payment are aligned.", ar: "العقد والفاتورة والحجز والاستهلاك والدفع متوائمة.", zh: "合同、发票、预留、消耗和付款均已对齐。" }, matchReason: { en: "Normal posting lag within threshold", ar: "تأخر ترحيل طبيعي ضمن الحد", zh: "正常过账滞后范围内" },
      tags: [{ cls: "healthy", text: { en: "Healthy chain", ar: "سلسلة سليمة", zh: "链路健康" } }],
      explanation: { en: "Contract, invoice and payment stages are aligned. The remaining available budget is still needed by the payment plan, so the line should not be treated as surplus.", ar: "مراحل العقد والفاتورة والدفع متوائمة. لا يزال الرصيد المتاح مطلوباً لخطة الدفع، لذلك لا يُعامل البند كفائض.", zh: "合同、发票、付款阶段基本一致。剩余可用预算仍被付款计划占用，不应视为可调剂空间。" },
      reason: { en: "Small gap is within normal SAP/Etimad posting lag.", ar: "الفجوة الصغيرة ضمن تأخر الترحيل الطبيعي بين ساب واعتماد.", zh: "小额差异处于 SAP/Etimad 正常过账滞后范围内。" },
      action: { en: "Keep funded; monitor payment plan", ar: "الإبقاء على التمويل ومتابعة خطة الدفع", zh: "保留资金；继续监控付款计划" },
      evidence: ["Payment plan PP-3308", "Invoice INV-90031", "SAP clearing run 2026-04"],
    },
    {
      id: "makkah-300070030", entity: "Makkah Amana", fiscalYear: "FY2026", period: "Q1 · March close", city: "Makkah", project: "Public facilities renewal", supplier: "Binladin Group", planned: 180, actual: 216, planStatus: "over", item: "300070030 · Facilities renewal", line: "SAP 5100/6300 · CT-9901", original: 980, enhancement: 180, reduction: 40, transferIn: 30, transferOut: 50, adjusted: 1100, reserved: 56, committed: 330, invoice: 216, paid: 142, available: 498, remaining: 884, freeCost: 198, fund: 404, idle: 118, stale: 172, gap: 84, severity: "risk", prId: "PR-9901", poId: "PO missing", contractId: "CT-9901", invoiceId: "INV-9901", reservationId: "RSV-9901", consumeDoc: "CONS-9901", paymentOrder: "PAY-9901", stageIndex: 3, missingStages: ["po"], stageLabel: { en: "Contract matched, PO mapping gap", ar: "العقد مطابق مع فجوة ربط أمر الشراء", zh: "合同已匹配，PO 映射缺口" }, stageNote: { en: "SAP movement is recognized as commitment, but two rows miss the PO reference required by BRD.", ar: "حركة ساب مصنفة كالتزام لكن صفين يفتقدان مرجع أمر الشراء المطلوب.", zh: "SAP movement 已识别为承诺，但两条行缺 BRD 要求的 PO 引用。" }, matchReason: { en: "Mapping difference at PO level", ar: "فرق ربط على مستوى أمر الشراء", zh: "PO 层级映射差异" },
      tags: [{ cls: "risk", text: { en: "Risk", ar: "مخاطر", zh: "风险" } }, { cls: "warn", text: { en: "Missing PO link", ar: "رابط أمر شراء مفقود", zh: "缺少 PO 关联" } }],
      explanation: { en: "SAP commitment lines cannot be fully linked to the Etimad contract package, so available balance is overstated until the PO mapping is repaired.", ar: "لا يمكن ربط خطوط الالتزام في ساب بالكامل بحزمة عقد اعتماد، لذلك يبدو الرصيد المتاح أعلى من الواقع حتى إصلاح ربط أمر الشراء.", zh: "SAP 承诺行无法完整关联到 Etimad 合同包，因此在 PO 映射修复前，可用余额可能被高估。" },
      reason: { en: "The movement dictionary translated the code group as contract commitment, but the downstream PO reference is missing in two SAP rows.", ar: "ترجم قاموس الحركات مجموعة الرموز كالتزام عقد، لكن مرجع أمر الشراء اللاحق مفقود في صفين من ساب.", zh: "movement 语义已识别为合同承诺，但两条 SAP 行缺少下游 PO 引用。" },
      action: { en: "Repair PO mapping before availability release", ar: "إصلاح ربط أمر الشراء قبل تحرير الرصيد", zh: "先修复 PO 映射再释放可用余额" },
      evidence: ["SAP rows 184221-184227", "Etimad contract CT-9901", "Mapping exception MAP-302"],
    },
    {
      id: "hq-300060010", entity: "Ministry HQ", fiscalYear: "FY2026", period: "Q4 · Liquidity view", city: "Riyadh", project: "Central services platform", supplier: "Elm", planned: 140, actual: 96, planStatus: "under", item: "300060010 · Digital services", line: "SAP 5200/6200 · CT-4417", original: 1320, enhancement: 140, reduction: 0, transferIn: 20, transferOut: 60, adjusted: 1420, reserved: 120, committed: 180, invoice: 96, paid: 64, available: 1024, remaining: 1324, freeCost: 724, fund: 652, idle: 410, stale: 52, gap: -8, severity: "pressure", prId: "PR-4417", poId: "PO-4417", contractId: "CT-4417", invoiceId: "INV-4417-Q4", reservationId: "RSV-4417", consumeDoc: "CONS-4417", paymentOrder: "PAY pending", stageIndex: 5, missingStages: ["payment"], stageLabel: { en: "Reserved against future claim", ar: "حجز مقابل مطالبة مستقبلية", zh: "已预留，应对未来索赔" }, stageNote: { en: "Looks idle in SAP, but Financial Entitlements sent a future claim signal.", ar: "يبدو خاملاً في ساب، لكن الاستحقاقات أرسلت إشارة مطالبة مستقبلية.", zh: "SAP 看似闲置，但财务权益侧发出未来索赔信号。" }, matchReason: { en: "Cross-department liquidity signal", ar: "إشارة سيولة عابرة للإدارات", zh: "跨部门流动性信号" },
      tags: [{ cls: "pressure", text: { en: "Liquidity pressure", ar: "ضغط سيولة", zh: "流动性压力" } }, { cls: "idle", text: { en: "Future claim signal", ar: "إشارة مطالبة مستقبلية", zh: "未来索赔信号" } }],
      explanation: { en: "This looks idle in SAP today, but Financial Entitlements sent an expected claim signal. The line should be protected from transfer until liquidity pressure is resolved.", ar: "يبدو البند خاملاً في ساب اليوم، لكن الاستحقاقات المالية أرسلت إشارة مطالبة متوقعة. يجب حمايته من المناقلة حتى تسوية ضغط السيولة.", zh: "该行在 SAP 当前看似闲置，但财务权益侧发来了预期索赔信号。在流动性压力解除前，不应转出。" },
      reason: { en: "Cross-department signal overrides idle-budget classification. Use the liquidity pressure route to inspect claim timing.", ar: "تتجاوز الإشارة العابرة للإدارات تصنيف الميزانية الخاملة. استخدم مسار ضغط السيولة لفحص توقيت المطالبة.", zh: "跨部门信号覆盖了“闲置预算”判断。应跳转流动性压力查看索赔时间。" },
      action: { en: "Protect line; inspect expected claim window", ar: "حماية البند وفحص نافذة المطالبة المتوقعة", zh: "保护预算行；检查预期索赔窗口" },
      evidence: ["Financial Entitlements signal FE-08-771", "Expected claim SAR 380M", "Liquidity window Q4"],
    },
    {
      id: "madinah-300030040", entity: "Madinah Region", fiscalYear: "FY2025", period: "Q4 · Year-end close", city: "Madinah", project: "Municipal operations", supplier: "Multiple vendors", planned: 110, actual: 88, planStatus: "under", item: "300030040 · Municipal operations", line: "SAP 5100/6100 · batch 2026-04", original: 780, enhancement: 120, reduction: 20, transferIn: 0, transferOut: 20, adjusted: 860, reserved: 26, committed: 224, invoice: 88, paid: 42, available: 548, remaining: 772, freeCost: 298, fund: 462, idle: 196, stale: 86, gap: 0, severity: "sync", prId: "PR-2604", poId: "PO-2604", contractId: "Multiple", invoiceId: "Invoice batch pending", reservationId: "RSV-2604", consumeDoc: "CONS-2604", paymentOrder: "PAY partial", stageIndex: 5, missingStages: ["invoice"], stageLabel: { en: "Etimad Plus invoice schema pending", ar: "بنية فواتير اعتماد بلس معلقة", zh: "Etimad Plus 发票结构待同步" }, stageNote: { en: "SAP balance is clean; invoice detail waits for Etimad Plus transition schema.", ar: "رصيد ساب سليم؛ تفاصيل الفواتير تنتظر بنية اعتماد بلس.", zh: "SAP 余额干净；发票明细等待 Etimad Plus 过渡结构。" }, matchReason: { en: "Etimad Plus transition schema", ar: "بنية انتقال اعتماد بلس", zh: "Etimad Plus 过渡结构" },
      tags: [{ cls: "sync", text: { en: "Etimad+ sync pending", ar: "مزامنة اعتماد بلس معلقة", zh: "Etimad+ 同步中" } }],
      explanation: { en: "SAP balance is clean, but the Etimad Plus transition feed has not delivered the detailed claim structure. Keep it visible as a sync-watch line.", ar: "رصيد ساب سليم، لكن تغذية انتقال اعتماد بلس لم ترسل بنية المطالبة التفصيلية. أبقه كبند مراقبة مزامنة.", zh: "SAP 余额本身干净，但 Etimad Plus 过渡接口尚未返回详细索赔结构，需作为同步观察行保留。" },
      reason: { en: "No financial mismatch yet. The risk is future comparability between historical SAP snapshots and the new Etimad Plus report shape.", ar: "لا توجد فجوة مالية حالياً. الخطر هو قابلية المقارنة المستقبلية بين لقطات ساب التاريخية وشكل تقرير اعتماد بلس الجديد.", zh: "当前暂无金额差异，主要风险是历史 SAP 快照与未来 Etimad Plus 报表结构的一致性。" },
      action: { en: "Keep in sync watch; no transfer action", ar: "إبقاؤه تحت مراقبة المزامنة دون مناقلة", zh: "保持同步观察；不做转移" },
      evidence: ["Etimad Plus transition v2", "SAP snapshot 2026-04", "No open payment block"],
    },
  ];
  const ledgerRows = getPageContent("g03", "budget_execution_ledger", defaultLedgerRows);

  const uniqueValues = (key) => Array.from(new Set(ledgerRows.map(row => row[key]))).filter(Boolean).sort();
  const planStatusMeta = {
    over: { en: "Actual over plan", ar: "الفعلي أعلى من المخطط", zh: "实际高于计划" },
    under: { en: "Actual under plan", ar: "الفعلي أقل من المخطط", zh: "实际低于计划" },
    ontrack: { en: "On track", ar: "ضمن المسار", zh: "基本按计划" },
  };
  const statusMeta = {
    risk: { en: "Risk", ar: "مخاطر", zh: "风险" },
    opportunity: { en: "Opportunity", ar: "فرصة", zh: "机会" },
    pressure: { en: "Liquidity pressure", ar: "ضغط السيولة", zh: "流动性压力" },
    sync: { en: "Sync watch", ar: "مراقبة المزامنة", zh: "同步观察" },
    healthy: { en: "Healthy", ar: "سليم", zh: "健康" },
  };
  const filteredRows = ledgerRows.filter(row =>
    (filters.fiscalYear === "all" || row.fiscalYear === filters.fiscalYear) &&
    (filters.period === "all" || row.period === filters.period) &&
    (filters.city === "all" || row.city === filters.city) &&
    (filters.project === "all" || row.project === filters.project) &&
    (filters.supplier === "all" || row.supplier === filters.supplier) &&
    (filters.planStatus === "all" || row.planStatus === filters.planStatus) &&
    (filters.status === "all" || row.severity === filters.status)
  );
  const selectedRow = filteredRows.find(row => row.id === selectedId) || filteredRows[0] || ledgerRows[0];
  useEffect(() => {
    if (!chatLogRef.current) return;
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatTurns, selectedId, copilotMode]);
  const setFilterValue = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters(defaultFilters);
  const totals = filteredRows.reduce((acc, row) => {
    acc.original += row.original; acc.adjusted += row.adjusted; acc.available += row.available; acc.actual += row.actual; acc.remaining += row.remaining; acc.reserved += row.reserved; acc.gap += row.gap;
    return acc;
  }, { original: 0, adjusted: 0, available: 0, actual: 0, remaining: 0, reserved: 0, gap: 0 });
  const fmtSar = (value) => value >= 1000 ? `SAR ${(value / 1000).toFixed(2)}B` : `SAR ${value}M`;
  const fmtSarDelta = (value) => `${value >= 0 ? "+" : "-"}${fmtSar(Math.abs(value))}`;
  const spendRate = totals.adjusted ? Math.round(totals.actual / totals.adjusted * 1000) / 10 : 0;
  const textOf = (value, key) => typeof value === "string" ? value : (value[key] || value.en || "");
  const chainStages = [
    { key: "pr", label: { en: "PR", ar: "طلب", zh: "PR" }, full: { en: "Purchase requisition", ar: "طلب الشراء", zh: "请购单" } },
    { key: "po", label: { en: "PO", ar: "أمر", zh: "PO" }, full: { en: "Purchase order", ar: "أمر الشراء", zh: "采购订单" } },
    { key: "contract", label: { en: "Contract", ar: "عقد", zh: "合同" }, full: { en: "Contract", ar: "العقد", zh: "合同" } },
    { key: "invoice", label: { en: "Invoice", ar: "فاتورة", zh: "发票" }, full: { en: "Invoice / claim", ar: "الفاتورة / المطالبة", zh: "发票 / 索赔" } },
    { key: "reservation", label: { en: "Reserve", ar: "حجز", zh: "预留" }, full: { en: "Reservation", ar: "الحجز", zh: "预留" } },
    { key: "consume", label: { en: "Consume", ar: "استهلاك", zh: "消耗" }, full: { en: "Consumption", ar: "الاستهلاك", zh: "消耗" } },
    { key: "payment", label: { en: "Payment", ar: "دفع", zh: "付款" }, full: { en: "Payment", ar: "الدفع", zh: "付款" } },
  ];
  const stageStatusFor = (row, key) => {
    if ((row.missingStages || []).includes(key)) return "missing";
    const idx = chainStages.findIndex(stage => stage.key === key);
    return idx <= row.stageIndex ? "done" : "pending";
  };
  const chainRefFor = (row, key) => ({
    pr: row.prId,
    po: row.poId,
    contract: row.contractId,
    invoice: row.invoiceId,
    reservation: row.reservationId,
    consume: row.consumeDoc,
    payment: row.paymentOrder,
  }[key] || "—");
  const chainCompleteness = (row) => Math.round(chainStages.filter(stage => stageStatusFor(row, stage.key) === "done").length / chainStages.length * 100);
  const copilotModeTitle = {
    explain: { en: "Availability answer", ar: "إجابة التوافر", zh: "可用性回答" },
    stage: { en: "Execution-stage explanation", ar: "تفسير مرحلة التنفيذ", zh: "执行阶段解释" },
    reconcile: { en: "SAP / Etimad reconciliation", ar: "مطابقة ساب / اعتماد", zh: "SAP / Etimad 对账" },
    transfer: { en: "Transfer-room assessment", ar: "تقييم مساحة المناقلة", zh: "可转移空间评估" },
    report: { en: "Management report draft", ar: "مسودة التقرير الإداري", zh: "管理报告草稿" },
  };
  const copilotPromptLabels = {
    explain: { en: "Explain availability", ar: "تفسير التوافر", zh: "解释可用性" },
    stage: { en: "Explain current stage", ar: "تفسير المرحلة الحالية", zh: "解释当前阶段" },
    reconcile: { en: "Classify difference", ar: "تصنيف الفرق", zh: "分类差异" },
    transfer: { en: "Assess transfer room", ar: "تقييم مساحة المناقلة", zh: "评估转移空间" },
    report: { en: "Draft report", ar: "صياغة تقرير", zh: "生成报告草稿" },
  };
  const detectCopilotMode = (question) => {
    const q = question.toLowerCase();
    if (/report|draft|summary|تقرير|ملخص|报告|摘要/.test(q)) return "report";
    if (/stage|chain|movement|semantic|pr|po|contract|invoice|payment|حركة|مرحلة|سلسلة|عقد|فاتورة|دفع|阶段|链路|合同|发票|付款|凭证|语义/.test(q)) return "stage";
    if (/gap|difference|match|reconcile|etimad|sap|فرق|مطابقة|اعتماد|差异|对账|匹配/.test(q)) return "reconcile";
    if (/transfer|idle|free|space|liquidity|مناقلة|خامل|سيولة|转移|闲置|自由|空间|流动性/.test(q)) return "transfer";
    return "explain";
  };
  const buildCopilotAnswer = (row, mode, question = "") => {
    const pressure = row.adjusted ? Math.round((row.actual + row.reserved + row.committed) / row.adjusted * 100) : 0;
    const tagEn = textOf(row.tags[0].text, "en");
    const tagAr = textOf(row.tags[0].text, "ar");
    const tagZh = textOf(row.tags[0].text, "zh");
    const actionEn = textOf(row.action, "en");
    const actionAr = textOf(row.action, "ar");
    const actionZh = textOf(row.action, "zh");
    if (mode === "stage") return {
      en: `${row.item} is at "${textOf(row.stageLabel, "en")}". BRD chain status: PR ${row.prId}, PO ${row.poId}, contract ${row.contractId}, invoice ${row.invoiceId}, reservation ${row.reservationId}, consumption ${row.consumeDoc}, payment ${row.paymentOrder}. Completeness is ${chainCompleteness(row)}%; ${textOf(row.stageNote, "en")}`,
      ar: `${row.item} في مرحلة "${textOf(row.stageLabel, "ar")}". حالة السلسلة حسب BRD: طلب ${row.prId}، أمر شراء ${row.poId}، عقد ${row.contractId}، فاتورة ${row.invoiceId}، حجز ${row.reservationId}، استهلاك ${row.consumeDoc}، دفع ${row.paymentOrder}. اكتمال السلسلة ${chainCompleteness(row)}%؛ ${textOf(row.stageNote, "ar")}`,
      zh: `${row.item} 当前处于“${textOf(row.stageLabel, "zh")}”。BRD 链路状态：PR ${row.prId}、PO ${row.poId}、合同 ${row.contractId}、发票 ${row.invoiceId}、预留 ${row.reservationId}、消耗 ${row.consumeDoc}、付款 ${row.paymentOrder}。链路完整度 ${chainCompleteness(row)}%；${textOf(row.stageNote, "zh")}`,
    };
    if (mode === "reconcile") return {
      en: `SAP/Asas is the financial truth for this line. The Etimad/SAP difference is ${row.gap >= 0 ? "+" : ""}${row.gap}M at item-period level; classified as ${textOf(row.matchReason, "en")}. Evidence: ${row.evidence.join(" · ")}.`,
      ar: `ساب/أساس هو مصدر الحقيقة المالية لهذا البند. فرق اعتماد/ساب هو ${row.gap >= 0 ? "+" : ""}${row.gap}M على مستوى البند والفترة؛ التصنيف: ${textOf(row.matchReason, "ar")}. الأدلة: ${row.evidence.join(" · ")}.`,
      zh: `该行以 SAP/Asas 作为财务真相。Etimad/SAP 差异为 ${row.gap >= 0 ? "+" : ""}${row.gap}M，层级是预算项 + 期间；分类为：${textOf(row.matchReason, "zh")}。证据：${row.evidence.join(" · ")}。`,
    };
    if (mode === "transfer") return {
      en: `Transfer room is ${fmtSar(row.freeCost)} free cost and ${fmtSar(row.fund)} fund availability, but the line is marked "${tagEn}". Copilot recommends: ${actionEn}. Future obligations and liquidity signals must be checked before Hyperion transfer action.`,
      ar: `مساحة المناقلة هي ${fmtSar(row.freeCost)} تكلفة حرة و${fmtSar(row.fund)} توافر تمويل، لكن البند موسوم "${tagAr}". توصية المساعد: ${actionAr}. يجب فحص الالتزامات المستقبلية وإشارات السيولة قبل إجراء المناقلة في Hyperion.`,
      zh: `可转移空间口径：自由成本 ${fmtSar(row.freeCost)}，资金可用性 ${fmtSar(row.fund)}，但该行标记为“${tagZh}”。Copilot 建议：${actionZh}。进入 Hyperion 转移前必须检查未来义务与流动性信号。`,
    };
    if (mode === "report") return {
      en: `Draft for ${row.entity}: adjusted appropriation ${fmtSar(row.adjusted)}, consumed ${fmtSar(row.actual)}, reserved ${fmtSar(row.reserved)}, committed ${fmtSar(row.committed)}, available balance ${fmtSar(row.available)}, free cost ${fmtSar(row.freeCost)}. Stage: ${textOf(row.stageLabel, "en")}. Action: ${actionEn}.`,
      ar: `مسودة لـ ${row.entity}: الاعتماد المعدل ${fmtSar(row.adjusted)}، المستهلك ${fmtSar(row.actual)}، الحجز ${fmtSar(row.reserved)}، الالتزام ${fmtSar(row.committed)}، الرصيد المتاح ${fmtSar(row.available)}، التكلفة الحرة ${fmtSar(row.freeCost)}. المرحلة: ${textOf(row.stageLabel, "ar")}. الإجراء: ${actionAr}.`,
      zh: `${row.entity} 管理报告草稿：调整后预算 ${fmtSar(row.adjusted)}，已消耗 ${fmtSar(row.actual)}，预留 ${fmtSar(row.reserved)}，承诺 ${fmtSar(row.committed)}，可用余额 ${fmtSar(row.available)}，自由成本 ${fmtSar(row.freeCost)}。当前阶段：${textOf(row.stageLabel, "zh")}。建议动作：${actionZh}。`,
    };
    return {
      en: `${question ? "Answering your question from the selected line: " : ""}${row.item} has ${fmtSar(row.available)} available balance from the SAP/Asas execution view and ${fmtSar(row.freeCost)} free cost from the Hyperion/free-cost view. Adjusted appropriation is ${fmtSar(row.adjusted)}, consumed ${fmtSar(row.actual)}, reservations ${fmtSar(row.reserved)}, commitments ${fmtSar(row.committed)}. Execution pressure is ${pressure}%.`,
      ar: `${question ? "الإجابة من البند المختار: " : ""}${row.item} لديه ${fmtSar(row.available)} رصيداً متاحاً من منظور تنفيذ ساب/أساس و${fmtSar(row.freeCost)} تكلفة حرة من منظور Hyperion/التكاليف الحرة. الاعتماد المعدل ${fmtSar(row.adjusted)}، المستهلك ${fmtSar(row.actual)}، الحجوزات ${fmtSar(row.reserved)}، الالتزامات ${fmtSar(row.committed)}. ضغط التنفيذ ${pressure}%.`,
      zh: `${question ? "基于选中预算行回答：" : ""}${row.item} 当前 SAP/Asas 执行视图可用余额 ${fmtSar(row.available)}，Hyperion/自由成本口径为 ${fmtSar(row.freeCost)}。调整后预算 ${fmtSar(row.adjusted)}，已消耗 ${fmtSar(row.actual)}，预留 ${fmtSar(row.reserved)}，承诺 ${fmtSar(row.committed)}。执行压力为 ${pressure}%。`,
    };
  };
  const appendChatTurns = (nextTurns) => setChatTurns(prev => [...prev, ...nextTurns].slice(-8));
  const selectBudgetLine = (row) => {
    setSelectedId(row.id);
    setCopilotMode("explain");
    setChatTurns([
      { role: "assistant", text: { en: `Selected ${row.item}. Choose a preset question or ask a follow-up.`, ar: `تم اختيار ${row.item}. اختر سؤالاً جاهزاً أو اطرح متابعة.`, zh: `已选中 ${row.item}。请选择预制问题，或直接追问。` } },
    ]);
    pushLog({ en: "UC-17 selected budget line — " + row.item, ar: "اختيار بند ميزانية UC-17 — " + row.item, zh: "UC-17 选中预算行 — " + row.item });
  };
  const activateCopilot = (mode) => {
    setCopilotMode(mode);
    appendChatTurns([
      { role: "user", text: tr(copilotPromptLabels[mode] || copilotPromptLabels.explain) },
      { role: "assistant", text: buildCopilotAnswer(selectedRow, mode) },
    ]);
    pushLog({ en: "UC-17 Copilot orchestration — " + mode + " · " + selectedRow.item, ar: "تنسيق مساعد UC-17 — " + mode + " · " + selectedRow.item, zh: "UC-17 Copilot 编排 — " + mode + " · " + selectedRow.item });
  };
  const submitFollowUp = () => {
    const q = followUp.trim();
    if (!q) return;
    const mode = detectCopilotMode(q);
    setCopilotMode(mode);
    appendChatTurns([
      { role: "user", text: q },
      { role: "assistant", text: buildCopilotAnswer(selectedRow, mode, q) },
    ]);
    pushLog({ en: "UC-17 Copilot Q&A — " + q, ar: "سؤال مساعد UC-17 — " + q, zh: "UC-17 Copilot 问答 — " + q });
    setFollowUp("");
  };
  const stageCards = [
    { key: "budget", label: { en: "Budget base", ar: "أساس الميزانية", zh: "预算基准" }, value: fmtSar(selectedRow.adjusted), note: { en: `orig ${fmtSar(selectedRow.original)} · net transfer ${selectedRow.transferIn - selectedRow.transferOut}M`, ar: `الأصل ${fmtSar(selectedRow.original)} · صافي المناقلة ${selectedRow.transferIn - selectedRow.transferOut}M`, zh: `原始 ${fmtSar(selectedRow.original)} · 净转移 ${selectedRow.transferIn - selectedRow.transferOut}M` } },
    { key: "consume", label: { en: "Consumed / reserved", ar: "مستهلك / محجوز", zh: "消耗 / 预留" }, value: `${fmtSar(selectedRow.actual)} / ${fmtSar(selectedRow.reserved)}`, note: { en: `${selectedRow.planStatus} vs plan`, ar: `مقابل الخطة: ${selectedRow.planStatus}`, zh: `${tr(planStatusMeta[selectedRow.planStatus])}` } },
    { key: "contract", label: { en: "Commitment / invoice", ar: "التزام / فاتورة", zh: "承诺 / 发票" }, value: `${fmtSar(selectedRow.committed)} / ${fmtSar(selectedRow.invoice)}`, note: { en: `${selectedRow.stale}M ageing watch`, ar: `مراقبة تقادم ${selectedRow.stale}M`, zh: `${selectedRow.stale}M 账龄观察` } },
    { key: "free", label: { en: "Free cost / fund", ar: "تكلفة حرة / تمويل", zh: "自由成本 / 资金" }, value: `${fmtSar(selectedRow.freeCost)} / ${fmtSar(selectedRow.fund)}`, note: { en: `gap ${selectedRow.gap >= 0 ? "+" : ""}${selectedRow.gap}M`, ar: `الفجوة ${selectedRow.gap >= 0 ? "+" : ""}${selectedRow.gap}M`, zh: `差异 ${selectedRow.gap >= 0 ? "+" : ""}${selectedRow.gap}M` } },
  ];
  const orchSteps = [
    { key: "read", label: { en: "Read selected budget line", ar: "قراءة بند الميزانية المختار", zh: "读取选中预算行" }, meta: selectedRow.line },
    { key: "explain", label: { en: "Translate SAP movement to business state", ar: "تحويل حركة ساب إلى حالة أعمال", zh: "将 SAP movement 翻译为业务状态" }, meta: { en: "contract · invoice · payment · commitment", ar: "عقد · فاتورة · دفع · التزام", zh: "合同 · 发票 · 付款 · 承诺" } },
    { key: "reconcile", label: { en: "Reconcile Etimad / Etimad Plus", ar: "مطابقة اعتماد / اعتماد بلس", zh: "对账 Etimad / Etimad Plus" }, meta: { en: "claim, PO and payment references", ar: "مراجع المطالبة وأمر الشراء والدفع", zh: "索赔、PO、付款引用" } },
    { key: "pressure", label: { en: "Check future obligation and liquidity pressure", ar: "فحص الالتزام المستقبلي وضغط السيولة", zh: "检查未来义务与流动性压力" }, meta: { en: "cross-department signal guardrail", ar: "ضابط إشارة عابر للإدارات", zh: "跨部门信号护栏" } },
    { key: "report", label: { en: "Generate management report draft", ar: "إنشاء مسودة التقرير الإداري", zh: "生成管理报告草稿" }, meta: { en: "inside Copilot flow", ar: "ضمن تدفق المساعد", zh: "在 Copilot 流程内完成" } },
    { key: "uc03", label: { en: "Budget Execution copilot explains report basis", ar: "مساعد تنفيذ الميزانية يشرح أساس التقرير", zh: "Budget Execution copilot 解释报告依据" }, meta: { en: "Q&A, evidence and audit trace", ar: "أسئلة وأدلة وأثر تدقيق", zh: "问答、证据、审计追踪" } },
  ];
  const activeStep = { explain: 1, stage: 2, reconcile: 3, transfer: 4, report: 5 }[copilotMode] || 1;
  const actionButtons = [
    { mode: "explain", label: copilotPromptLabels.explain },
    { mode: "stage", label: copilotPromptLabels.stage },
    { mode: "reconcile", label: copilotPromptLabels.reconcile },
    { mode: "report", label: copilotPromptLabels.report },
  ];

  return (
    <div className="page bex-page bex-sheet-page">
      <PageHeader
        title={tr(pageHeader.title)}
        sub={tr(pageHeader.sub)}
        right={<G03BudgetActions active="home" />}
      />
      <div className="bex-filterbar" aria-label={tr({ en: "Budget execution filters", ar: "مرشحات تنفيذ الميزانية", zh: "预算执行筛选" })}>
        <label><span>{tr({ en: "Fiscal year", ar: "السنة المالية", zh: "财年" })}</span><select value={filters.fiscalYear} onChange={e => setFilterValue("fiscalYear", e.target.value)}>
          <option value="all">{tr({ en: "All fiscal years", ar: "كل السنوات المالية", zh: "全部财年" })}</option>
          {uniqueValues("fiscalYear").map(v => <option key={v} value={v}>{v}</option>)}
        </select></label>
        <label><span>{tr({ en: "Period / close", ar: "الفترة / الإقفال", zh: "期间 / 关账" })}</span><select value={filters.period} onChange={e => setFilterValue("period", e.target.value)}>
          <option value="all">{tr({ en: "All periods", ar: "كل الفترات", zh: "全部期间" })}</option>
          {uniqueValues("period").map(v => <option key={v} value={v}>{v}</option>)}
        </select></label>
        <label><span>{tr({ en: "City", ar: "المدينة", zh: "城市" })}</span><select value={filters.city} onChange={e => setFilterValue("city", e.target.value)}>
          <option value="all">{tr({ en: "All cities", ar: "كل المدن", zh: "全部城市" })}</option>
          {uniqueValues("city").map(v => <option key={v} value={v}>{v}</option>)}
        </select></label>
        <label><span>{tr({ en: "Project", ar: "المشروع", zh: "项目" })}</span><select value={filters.project} onChange={e => setFilterValue("project", e.target.value)}>
          <option value="all">{tr({ en: "All projects", ar: "كل المشاريع", zh: "全部项目" })}</option>
          {uniqueValues("project").map(v => <option key={v} value={v}>{v}</option>)}
        </select></label>
        <label><span>{tr({ en: "Supplier", ar: "المورد", zh: "供应商" })}</span><select value={filters.supplier} onChange={e => setFilterValue("supplier", e.target.value)}>
          <option value="all">{tr({ en: "All suppliers", ar: "كل الموردين", zh: "全部供应商" })}</option>
          {uniqueValues("supplier").map(v => <option key={v} value={v}>{v}</option>)}
        </select></label>
        <label><span>{tr({ en: "Plan vs actual", ar: "المخطط مقابل الفعلي", zh: "计划 vs 实际" })}</span><select value={filters.planStatus} onChange={e => setFilterValue("planStatus", e.target.value)}>
          <option value="all">{tr({ en: "All variances", ar: "كل الانحرافات", zh: "全部偏差" })}</option>
          {Object.keys(planStatusMeta).map(k => <option key={k} value={k}>{tr(planStatusMeta[k])}</option>)}
        </select></label>
        <label><span>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</span><select value={filters.status} onChange={e => setFilterValue("status", e.target.value)}>
          <option value="all">{tr({ en: "All markers", ar: "كل الوسوم", zh: "全部标识" })}</option>
          {Object.keys(statusMeta).map(k => <option key={k} value={k}>{tr(statusMeta[k])}</option>)}
        </select></label>
        <div className="bex-filter-state">
          <span>{tr({ en: "Filtered scope", ar: "نطاق التصفية", zh: "筛选范围" })}</span>
          <b>{filteredRows.length}/{ledgerRows.length}</b>
          <button className="btn ghost sm" onClick={resetFilters}>{tr({ en: "Reset", ar: "إعادة ضبط", zh: "重置" })}</button>
        </div>
      </div>

      <div className="bp-console-kpis bex-kpi-strip">
        <div className="bp-console-kpi accent"><span>{tr({ en: "Current amount", ar: "المبلغ الحالي", zh: "现有金额" })}</span><b>{fmtSar(totals.available)}</b><small>{tr({ en: "SAP/Asas available amount", ar: "المبلغ المتاح في ساب/أساس", zh: "SAP/Asas 当前可用口径" })}</small></div>
        <div className="bp-console-kpi good"><span>{tr({ en: "Consumed amount", ar: "المبلغ المستهلك", zh: "已消耗金额" })}</span><b>{fmtSar(totals.actual)}</b><small>{tr({ en: "posted consumption documents", ar: "مستندات الاستهلاك المرحلة", zh: "已过账消耗凭证" })}</small></div>
        <div className="bp-console-kpi"><span>{tr({ en: "Balance", ar: "الرصيد", zh: "余额" })}</span><b>{fmtSar(totals.remaining)}</b><small>{tr({ en: "remaining approved amount", ar: "مبلغ الاعتماد المتبقي", zh: "剩余批准额度" })}</small></div>
        <div className="bp-console-kpi"><span>{tr({ en: "Spend rate", ar: "معدل الصرف", zh: "支出率" })}</span><b>{spendRate}%</b><small>{tr({ en: "consumed ÷ adjusted approval", ar: "المستهلك ÷ الاعتماد المعدل", zh: "已消耗 ÷ 调整后批准额" })}</small></div>
        <div className="bp-console-kpi"><span>{tr({ en: "Original approved amount", ar: "مبلغ الاعتماد الأصلي", zh: "原始批准额" })}</span><b>{fmtSar(totals.original)}</b><small>{tr({ en: "before enhancements and transfers", ar: "قبل التعزيزات والمناقلات", zh: "增强和转移前" })}</small></div>
        <div className="bp-console-kpi"><span>{tr({ en: "Adjusted approved amount", ar: "مبلغ الاعتماد المعدل", zh: "调整后的批准额" })}</span><b>{fmtSar(totals.adjusted)}</b><small>{tr({ en: "after movements and transfers", ar: "بعد الحركات والمناقلات", zh: "含 movement 与转移后" })}</small></div>
        <div className="bp-console-kpi warn"><span>{tr({ en: "Reserved funds", ar: "الأموال المحجوزة", zh: "资金预留" })}</span><b>{fmtSar(totals.reserved)}</b><small>{tr({ en: "reservation documents in ledger", ar: "مستندات الحجز في الدفتر", zh: "台账中的预留凭证" })}</small></div>
        <div className="bp-console-kpi bad"><span>{tr({ en: "Reconciliation difference", ar: "فرق المطابقة", zh: "对账差异" })}</span><b>{fmtSarDelta(totals.gap)}</b><small>{tr({ en: "net SAP/Etimad difference", ar: "صافي فرق ساب/اعتماد", zh: "SAP/Etimad 净差异" })}</small></div>
      </div>

      <div className="bex-workgrid">
        <div className="bex-sheet-panel">
          <div className="bex-panel-head">
            <div>
              <span>{tr({ en: "Execution ledger", ar: "دفتر تنفيذ الميزانية", zh: "预算执行台账" })}</span>
              <b>{tr({ en: "Budget rows with risk / opportunity marked in-sheet", ar: "بنود الميزانية مع وسم المخاطر / الفرص داخل الجدول", zh: "风险 / 机会直接标记在台账行内" })}</b>
            </div>
            <div className="bex-legend">
              <span className="risk">{tr({ en: "Risk", ar: "مخاطر", zh: "风险" })}</span>
              <span className="opportunity">{tr({ en: "Opportunity", ar: "فرصة", zh: "机会" })}</span>
              <span className="pressure">{tr({ en: "Liquidity", ar: "سيولة", zh: "流动性" })}</span>
              <span className="sync">{tr({ en: "Sync watch", ar: "مراقبة مزامنة", zh: "同步观察" })}</span>
            </div>
          </div>
          <div className="bex-ledger-wrap">
            <table className="tbl bp-table bex-ledger-table">
              <thead>
                <tr>
                  <th>{tr({ en: "Entity / period", ar: "الجهة / الفترة", zh: "机构 / 期间" })}</th>
                  <th className="bex-text-col">{tr({ en: "Budget item / scope", ar: "بند الميزانية / النطاق", zh: "预算项 / 范围" })}</th>
                  <th className="bex-text-col">{tr({ en: "Current execution stage", ar: "مرحلة التنفيذ الحالية", zh: "当前执行阶段" })}</th>
                  <th>{tr({ en: "SAP budget movement", ar: "حركة ميزانية ساب", zh: "SAP 预算口径" })}</th>
                  <th>{tr({ en: "PR / PO / contract", ar: "طلب / أمر / عقد", zh: "PR / PO / 合同" })}</th>
                  <th>{tr({ en: "Invoice / reserve / consume", ar: "فاتورة / حجز / استهلاك", zh: "发票 / 预留 / 消耗" })}</th>
                  <th>{tr({ en: "Payment / fund", ar: "الدفع / التمويل", zh: "付款 / 资金" })}</th>
                  <th>{tr({ en: "Remaining / free cost", ar: "المتبقي / التكلفة الحرة", zh: "剩余 / 自由成本" })}</th>
                  <th>{tr({ en: "SAP-Etimad match", ar: "مطابقة ساب واعتماد", zh: "SAP-Etimad 对账" })}</th>
                  <th>{tr({ en: "Status / next action", ar: "الحالة / الإجراء التالي", zh: "状态 / 下一步" })}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => {
                  const planVariance = row.actual - row.planned;
                  return (
                  <tr key={row.id} className={"bex-row-" + row.severity + (row.id === selectedRow.id ? " bp-tr-on" : "")} onClick={() => selectBudgetLine(row)}>
                    <td><div className="bp-table-main">{row.entity}</div><div className="bp-table-sub">{row.fiscalYear} · {row.period}</div></td>
                    <td className="bex-text-cell"><div className="bp-table-main">{row.item}</div><div className="bp-table-sub">{row.project} · {row.city} · {row.supplier}</div><div className="bp-table-sub">{row.line}</div></td>
                    <td className="bex-text-cell">
                      <div className="bex-stage-cell">
                        <span className={"bex-stage-chip " + row.severity}>{tr(row.stageLabel)}</span>
                        <div className="bex-mini-chain">{chainStages.map(stage => <i key={stage.key} className={stageStatusFor(row, stage.key)} title={tr(stage.full)}>{tr(stage.label)}</i>)}</div>
                        <small>{tr(row.stageNote)}</small>
                      </div>
                    </td>
                    <td><div className="bex-num-stack"><b>{fmtSar(row.adjusted)}</b><span>{tr({ en: "orig", ar: "الأصل", zh: "原始" })} {fmtSar(row.original)}</span><span>{tr({ en: "net transfer", ar: "صافي المناقلة", zh: "净转移" })} {row.transferIn - row.transferOut >= 0 ? "+" : ""}{row.transferIn - row.transferOut}M</span></div></td>
                    <td><div className="bex-ref-stack"><b>{row.contractId}</b><span>{row.prId}</span><span>{row.poId}</span><small>{fmtSar(row.committed)}</small></div></td>
                    <td><div className="bex-ref-stack"><b>{row.invoiceId}</b><span>{row.reservationId} · {fmtSar(row.reserved)}</span><span>{row.consumeDoc} · {fmtSar(row.actual)}</span><small>{planVariance >= 0 ? "+" : ""}{planVariance}M · {tr(planStatusMeta[row.planStatus])}</small></div></td>
                    <td><div className="bex-num-stack"><b>{fmtSar(row.paid)}</b><span>{row.paymentOrder}</span><span>{tr({ en: "fund", ar: "التمويل", zh: "资金" })} {fmtSar(row.fund)}</span></div></td>
                    <td><div className="bex-num-stack"><b>{fmtSar(row.remaining)}</b><span>{tr({ en: "available", ar: "متاح", zh: "可用" })} {fmtSar(row.available)}</span><span>{tr({ en: "free cost", ar: "تكلفة حرة", zh: "自由成本" })} {fmtSar(row.freeCost)}</span></div></td>
                    <td><div className="bex-match-cell"><span className={"bex-gap " + (row.gap > 40 ? "bad" : row.gap < 0 ? "good" : row.gap > 0 ? "warn" : "")}>{row.gap >= 0 ? "+" : ""}{row.gap}M</span><small>{tr(row.matchReason)}</small></div></td>
                    <td><div className="bex-tags">{row.tags.map((tag, i) => <span className={tag.cls} key={i}>{tr(tag.text)}</span>)}</div><div className="bex-action-text">{tr(row.action)}</div></td>
                  </tr>
                );})}
                {filteredRows.length === 0 && <tr className="bex-empty-row"><td colSpan={10}>{tr({ en: "No budget lines match the current filters. Reset filters or widen the fiscal period.", ar: "لا توجد بنود ميزانية تطابق المرشحات الحالية. أعد الضبط أو وسّع الفترة المالية.", zh: "当前筛选条件下没有预算行。可重置筛选或放宽财年期间。" })}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="bex-copilot">
          <div className="bex-copilot-head">
            <div>
              <span>{tr({ en: "Copilot orchestration", ar: "تنسيق المساعد", zh: "Copilot 编排" })}</span>
              <b>{tr({ en: "Budget Execution copilot", ar: "مساعد تنفيذ الميزانية", zh: "Budget Execution copilot" })}</b>
            </div>
            <span className={"bex-copilot-dot " + selectedRow.severity}>{tr(selectedRow.tags[0].text)}</span>
          </div>

          <div className="bex-copilot-body">
            <div className="bex-selected-line">
              <span>{selectedRow.entity}</span>
              <b>{selectedRow.item}</b>
              <small>{tr(selectedRow.stageLabel)} · {selectedRow.line}</small>
            </div>

            <div className="bex-qa-flow bex-bot-flow">
              <div className="bex-qa-head">
                <div className="bex-bot-title">
                  <i>AI</i>
                  <div>
                    <span>{tr({ en: "Budget Execution copilot", ar: "مساعد تنفيذ الميزانية", zh: "Budget Execution copilot" })}</span>
                    <b>{tr({ en: "Ask from the selected budget line", ar: "اسأل من بند الميزانية المختار", zh: "围绕选中预算行提问" })}</b>
                  </div>
                </div>
              </div>
              <div className="bex-qa-prompts">
                {actionButtons.map(btn => (
                  <button key={btn.mode} className={copilotMode === btn.mode ? "on" : ""} onClick={() => activateCopilot(btn.mode)}>{tr(btn.label)}</button>
                ))}
              </div>
              <div className="bex-chat-log" ref={chatLogRef} aria-live="polite">
                {chatTurns.map((turn, i) => <div key={i} className={"bex-turn " + turn.role}>{typeof turn.text === "string" ? turn.text : tr(turn.text)}</div>)}
              </div>
            </div>
          </div>

          <form className="bex-chat-input bex-chat-composer" onSubmit={e => { e.preventDefault(); submitFollowUp(); }}>
            <input value={followUp} onChange={e => setFollowUp(e.target.value)} aria-label={tr({ en: "Ask Budget Execution copilot", ar: "اسأل مساعد تنفيذ الميزانية", zh: "向 Budget Execution copilot 提问" })} placeholder={tr({ en: "Ask about stage, movement, availability or gap...", ar: "اسأل عن المرحلة أو الحركة أو التوافر أو الفرق...", zh: "追问阶段、movement、可用性或差异..." })} />
            <button className="btn sm secondary" type="submit">{tr({ en: "Ask", ar: "اسأل", zh: "提问" })}</button>
          </form>
        </aside>
      </div>
    </div>
  );
}

const G03_EXEC_PACKET = {
  source: {
    batch: "SAP-2026-04-B184320",
    rows: "184,320",
    period: "FY2026 · April close",
    dictionary: "SAP movement dictionary v3.4",
    etimadSchema: "Etimad Plus transition schema Q2",
    hyperion: "Hyperion transfer window HYP-26-Q2",
  },
  metrics: {
    adjusted: 8200,
    consumed: 5520,
    balance: 2680,
    reserved: 620,
    committed: 1260,
    unpaidInvoices: 480,
    paid: 3180,
    available: 2850,
    freeCost: 420,
    expectedClaims: 710,
    differenceRate: "4.2%",
    openExceptions: 23,
    staleCommitments: 7,
    idleLines: 11,
    reportReady: 8,
  },
  exceptionRows: [
    { type: { en: "Etimad Plus / SAP difference", ar: "فرق اعتماد بلس / ساب", zh: "Etimad Plus / SAP 差异" }, line: "300020200 · Roads maintenance", source: "CT-8831 · INV-4472", amount: "SAR 52M", reason: { en: "Invoice posted in Etimad Plus, SAP payment movement still open", ar: "فاتورة مرحلة في اعتماد بلس وحركة الدفع في ساب ما زالت مفتوحة", zh: "Etimad Plus 已登记发票，SAP 付款 movement 仍未关闭" }, status: { en: "High", ar: "مرتفع", zh: "高" }, action: { en: "Route to reconciliation owner before transfer", ar: "توجيه لمالك المطابقة قبل المناقلة", zh: "转移前先交来源对账负责人处理" }, tone: "bad" },
    { type: { en: "Stale commitment", ar: "التزام متوقف", zh: "长期未推进承诺" }, line: "300040110 · Drainage works", source: "CT-7719 · PO-7719", amount: "SAR 64M", reason: { en: "Commitment open for 76 days with no new invoice or payment", ar: "التزام مفتوح منذ 76 يوماً بلا فاتورة أو دفع جديد", zh: "承诺已开放 76 天，没有新增发票或付款" }, status: { en: "Review", ar: "مراجعة", zh: "复核" }, action: { en: "Feed obligation pressure into forecast", ar: "إرسال ضغط الالتزام إلى التنبؤ", zh: "回传到未来义务预测" }, tone: "warn" },
    { type: { en: "Idle available balance", ar: "رصيد متاح خامل", zh: "可用但闲置余额" }, line: "300060010 · Digital services", source: "AVL-26-04 · RSV-4417", amount: "SAR 180M", reason: { en: "Available balance has no invoice, claim or payment plan after April close", ar: "رصيد متاح بلا فاتورة أو مطالبة أو خطة دفع بعد إقفال أبريل", zh: "四月关账后仍无发票、索赔或付款计划占用" }, status: { en: "Opportunity", ar: "فرصة", zh: "机会" }, action: { en: "Send to fiscal-space transfer candidate list", ar: "إرساله إلى قائمة مرشحات الحيز المالي", zh: "进入财政空间转移候选清单" }, tone: "good" },
    { type: { en: "Unclassified movement", ar: "حركة غير مصنفة", zh: "未分类 SAP movement" }, line: "300070030 · Facilities renewal", source: "SAP 6300 · PO missing", amount: "SAR 84M", reason: { en: "Raw SAP rows cannot be translated to PO stage with current dictionary", ar: "لا يمكن ترجمة صفوف ساب الخام إلى مرحلة أمر الشراء بالقاموس الحالي", zh: "当前字典无法把 SAP 原始行翻译到 PO 阶段" }, status: { en: "Owner needed", ar: "يتطلب مالكاً", zh: "需分配负责人" }, action: { en: "Assign source owner and block report export", ar: "تعيين مالك مصدر ومنع تصدير التقرير", zh: "分配来源负责人并暂缓报告导出" }, tone: "bad" },
  ],
  forecastRows: [
    { period: "FY2026 Q3", commitments: "SAR 0.82B", invoices: "SAR 0.34B", claims: "SAR 0.24B", funding: "92%", gap: "SAR 0", tone: "good" },
    { period: "FY2026 Q4", commitments: "SAR 1.14B", invoices: "SAR 0.51B", claims: "SAR 0.38B", funding: "83%", gap: "SAR 310M", tone: "warn" },
    { period: "FY2027 Q1", commitments: "SAR 1.26B", invoices: "SAR 0.48B", claims: "SAR 0.71B", funding: "76%", gap: "SAR 580M", tone: "bad" },
    { period: "FY2027 Q2", commitments: "SAR 0.94B", invoices: "SAR 0.41B", claims: "SAR 0.43B", funding: "88%", gap: "SAR 190M", tone: "warn" },
  ],
  obligationRows: [
    { ref: "CT-8831", class: { en: "Approved contract", ar: "عقد معتمد", zh: "已批准合同" }, object: { en: "Urban roads rehabilitation", ar: "تأهيل الطرق الحضرية", zh: "城市道路修复" }, driver: { en: "Payment plan linked", ar: "خطة دفع مرتبطة", zh: "已挂接付款计划" }, period: "FY2026 Q4", amount: "SAR 0.31B", state: { en: "Ready", ar: "جاهز", zh: "就绪" }, tone: "good" },
    { ref: "CLM-4472", class: { en: "Expected claim", ar: "مطالبة متوقعة", zh: "预期索赔" }, object: { en: "Road maintenance claim package", ar: "حزمة مطالبة صيانة الطرق", zh: "道路维护索赔包" }, driver: { en: "Etimad Plus signal", ar: "إشارة اعتماد بلس", zh: "Etimad Plus 信号" }, period: "FY2027 Q1", amount: "SAR 0.38B", state: { en: "Pressure", ar: "ضغط", zh: "压力" }, tone: "bad" },
    { ref: "PO-7719", class: { en: "Stale commitment", ar: "التزام متوقف", zh: "长期承诺" }, object: { en: "Stormwater channels", ar: "قنوات تصريف مياه الأمطار", zh: "雨水渠工程" }, driver: { en: "No invoice after 76 days", ar: "لا فاتورة بعد 76 يوماً", zh: "76 天无发票" }, period: "FY2026 Q4", amount: "SAR 0.16B", state: { en: "Review", ar: "مراجعة", zh: "复核" }, tone: "warn" },
    { ref: "RSV-4417", class: { en: "Reservation", ar: "حجز", zh: "资金预留" }, object: { en: "Central services platform", ar: "منصة الخدمات المركزية", zh: "中央服务平台" }, driver: { en: "Future claim guardrail", ar: "ضابط مطالبة مستقبلية", zh: "未来索赔护栏" }, period: "FY2026 Q4", amount: "SAR 0.18B", state: { en: "Protected", ar: "محمي", zh: "受保护" }, tone: "warn" },
  ],
  fiscalRows: [
    { line: "300040110 · Drainage works", entity: "Asir Amana", stage: { en: "Consumed, idle balance available", ar: "استهلاك مرحل ورصيد خامل متاح", zh: "已消耗，存在可用闲置余额" }, adjusted: "SAR 1.18B", consumed: "SAR 128M", reserved: "SAR 34M", committed: "SAR 240M", available: "SAR 778M", freeCost: "SAR 504M", transfer: { en: "Release candidate", ar: "مرشح تحرير", zh: "可释放候选" }, tone: "good" },
    { line: "300020200 · Roads maintenance", entity: "Jeddah Amana", stage: { en: "Consumed, payment ageing", ar: "استهلاك مرحل وتأخر الدفع", zh: "已消耗，付款账龄观察" }, adjusted: "SAR 2.08B", consumed: "SAR 410M", reserved: "SAR 68M", committed: "SAR 620M", available: "SAR 982M", freeCost: "SAR 532M", transfer: { en: "Hold until reconciliation", ar: "تعليق حتى المطابقة", zh: "对账完成前暂缓" }, tone: "bad" },
    { line: "300060010 · Digital services", entity: "Ministry HQ", stage: { en: "Reserved against future claim", ar: "حجز مقابل مطالبة مستقبلية", zh: "已预留，应对未来索赔" }, adjusted: "SAR 1.42B", consumed: "SAR 96M", reserved: "SAR 120M", committed: "SAR 180M", available: "SAR 1.02B", freeCost: "SAR 724M", transfer: { en: "Protected by claim signal", ar: "محمي بإشارة مطالبة", zh: "受未来索赔信号保护" }, tone: "warn" },
    { line: "300010090 · Smart city Opex", entity: "Riyadh Region", stage: { en: "Payment cleared, chain healthy", ar: "الدفع مسوى والسلسلة سليمة", zh: "付款已清算，链路健康" }, adjusted: "SAR 2.42B", consumed: "SAR 520M", reserved: "SAR 44M", committed: "SAR 760M", available: "SAR 1.10B", freeCost: "SAR 292M", transfer: { en: "Keep funded", ar: "الإبقاء على التمويل", zh: "保留资金" }, tone: "good" },
  ],
  reportTypes: [
    { key: "consumption", zh: "消耗详情报告", en: "Consumption detail report", output: { en: "Budget item consumption by contract, invoice, payment and city", ar: "استهلاك بند الميزانية حسب العقد والفاتورة والدفع والمدينة", zh: "按预算项、合同、发票、付款和城市拆解消耗" }, source: "SAP consumption detail + Etimad claim package" },
    { key: "reservation", zh: "预留资金报告", en: "Reserved funds report", output: { en: "Reserved balance, future claim guardrails and release blockers", ar: "الرصيد المحجوز وضوابط المطالبات المستقبلية ومعوقات التحرير", zh: "预留余额、未来索赔护栏和释放阻断项" }, source: "SAP reservation documents + FE signal" },
    { key: "pr", zh: "采购申请报告", en: "Purchase requisition report", output: { en: "PR conversion, missing PO links and ownership", ar: "تحويل طلبات الشراء وروابط أوامر الشراء المفقودة والملكية", zh: "PR 转化、缺失 PO 关联和责任人" }, source: "SAP PR movement + procurement trail" },
    { key: "po", zh: "采购订单报告", en: "Purchase order report", output: { en: "PO status, contract linkage and unclassified movement rows", ar: "حالة أوامر الشراء وربط العقود والحركات غير المصنفة", zh: "PO 状态、合同挂接和未分类 movement 行" }, source: "SAP PO movement dictionary" },
    { key: "invoice", zh: "发票报告", en: "Invoice report", output: { en: "Invoice ageing, Etimad matching and payment readiness", ar: "أعمار الفواتير ومطابقة اعتماد وجاهزية الدفع", zh: "发票账龄、Etimad 匹配和付款就绪度" }, source: "Etimad Plus invoices + SAP invoice movement" },
    { key: "contract", zh: "合同报告", en: "Contract report", output: { en: "Contract commitment, stale status and payment plan coverage", ar: "التزام العقد وحالة التوقف وتغطية خطة الدفع", zh: "合同承诺、停滞状态和付款计划覆盖" }, source: "Etimad contracts + SAP commitments" },
    { key: "transfer", zh: "转移报告", en: "Transfer report", output: { en: "Transfer candidates, Hyperion constraints and approval notes", ar: "مرشحات المناقلة وقيود هايبريون وملاحظات الاعتماد", zh: "转移候选、Hyperion 约束和审批说明" }, source: "Fiscal-space output + Hyperion window" },
    { key: "balance", zh: "余额与自由成本报告", en: "Balance and free cost report", output: { en: "Available balance, free cost and protected rows", ar: "الرصيد المتاح والتكلفة الحرة والبنود المحمية", zh: "可用余额、自由成本和受保护预算行" }, source: "SAP availability report" },
    { key: "spend", zh: "支出率报告", en: "Spend rate report", output: { en: "Spend rate vs plan with entity, project and supplier slices", ar: "معدل الصرف مقابل الخطة حسب الجهة والمشروع والمورد", zh: "按机构、项目和供应商切分支出率 vs 计划" }, source: "SAP actuals + planning baseline" },
    { key: "recon", zh: "Etimad与内部系统对账报告", en: "Etimad and internal systems reconciliation report", output: { en: "Differences by timing, missing references and schema-transition issues", ar: "الفروق حسب التوقيت والمراجع المفقودة ومشكلات انتقال المخطط", zh: "按时间差、缺失引用和数据结构迁移问题解释差异" }, source: "SAP/Asas + Etimad Plus + dictionary evidence" },
  ],
};

function g03Money(value) {
  return value >= 1000 ? `SAR ${(value / 1000).toFixed(2)}B` : `SAR ${value}M`;
}

const G03_FLOW_STEPS = [
  { key: "home", route: "budexec17", label: { en: "Execution ledger", ar: "دفتر التنفيذ", zh: "执行台账" } },
  { key: "forecast", route: "budexec-forecast", label: { en: "Obligation forecast", ar: "تنبؤ الالتزامات", zh: "义务预测" } },
  { key: "space", route: "budexec-space", label: { en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" } },
  { key: "reports", route: "budexec-reports", label: { en: "Report generation", ar: "إنشاء التقارير", zh: "报告生成" } },
];

function g03FlowState(stepKey, active) {
  if (stepKey === active) return "focus";
  const activeIndex = G03_FLOW_STEPS.findIndex((step) => step.key === active);
  const stepIndex = G03_FLOW_STEPS.findIndex((step) => step.key === stepKey);
  return activeIndex >= 0 && stepIndex >= 0 && stepIndex < activeIndex ? "in" : "down";
}

function G03BudgetActions({ active }) {
  const { tr, route, setRoute, setDeptSub, setBackRoute, setAlertsOpen } = useStore();
  const openFlow = (item) => {
    if (!item.route || item.route === route) return;
    setBackRoute(route || "budexec17");
    setRoute(item.route);
  };
  const backToWorkspace = () => {
    setDeptSub("budgetExecution");
    setBackRoute(null);
    setRoute("buwork");
  };
  return (
    <div className="g03-header-nav">
      <div className="g03-actions">
        <button className="btn ghost sm" type="button" onClick={backToWorkspace}>← {tr({ en: "Budget Execution", ar: "تنفيذ الميزانية", zh: "预算执行部" })}</button>
        <button className="btn danger sm" type="button" onClick={() => setAlertsOpen(true)}>{tr({ en: "Exception Center", ar: "مركز الاستثناءات", zh: "异常中心" })}</button>
      </div>
      <div className="g03-flow-nav" aria-label={tr({ en: "Budget execution process navigation", ar: "تنقل عملية تنفيذ الميزانية", zh: "预算执行流程导航" })}>
        <div className="g03-flow-title">{tr({ en: "Process navigation", ar: "تنقل العملية", zh: "流程导航" })}</div>
        <div className="g03-flow-row">
          {G03_FLOW_STEPS.map((item, index) => (
            <React.Fragment key={item.key}>
              <button
                type="button"
                className={"g03-flow-step " + g03FlowState(item.key, active)}
                onClick={() => openFlow(item)}
                aria-current={item.key === active ? "step" : undefined}
              >
                {tr(item.label)}
              </button>
              {index < G03_FLOW_STEPS.length - 1 && <span className="g03-flow-arrow">-&gt;</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function G03AiNotice({ title, body, chips = [] }) {
  const { tr } = useStore();
  return (
    <section className="g03-ai-ready">
      <div>
        <span>{tr({ en: "AI data preparation", ar: "تحضير البيانات بالذكاء الاصطناعي", zh: "AI 数据准备" })}</span>
        <b>{tr(title)}</b>
        <p>{tr(body)}</p>
      </div>
      <div className="g03-ai-chips">
        {chips.map((chip, idx) => <i key={idx}>{tr(chip)}</i>)}
      </div>
    </section>
  );
}

function G03KpiGrid({ items }) {
  const { tr } = useStore();
  return (
    <div className="g03-kpi-grid">
      {items.map((item, idx) => (
        <div key={idx} className={"g03-kpi " + (item.tone || "")}>
          <span>{tr(item.label)}</span>
          <b>{item.value}</b>
          <small>{tr(item.note)}</small>
        </div>
      ))}
    </div>
  );
}

function G03Section({ title, note, right, children, className = "" }) {
  const { tr } = useStore();
  return (
    <section className={"g03-section " + className}>
      <div className="g03-section-head">
        <div>
          <h2>{tr(title)}</h2>
          {note && <p>{tr(note)}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function BudgetExecutionForecastPage() {
  const { tr, setRoute, setBackRoute } = useStore();
  const open = (nextRoute) => { setBackRoute("budexec-forecast"); setRoute(nextRoute); };
  const kpis = [
    { label: { en: "Confirmed commitments", ar: "التزامات مؤكدة", zh: "已确认承诺" }, value: g03Money(G03_EXEC_PACKET.metrics.committed), note: { en: "approved contracts from SAP/Etimad chain", ar: "عقود معتمدة من سلسلة ساب/اعتماد", zh: "来自 SAP/Etimad 链路的已批准合同" } },
    { label: { en: "Expected claims", ar: "مطالبات متوقعة", zh: "预期索赔" }, value: g03Money(G03_EXEC_PACKET.metrics.expectedClaims), note: { en: "probability-weighted Etimad Plus signals", ar: "إشارات اعتماد بلس مرجحة الاحتمال", zh: "按概率加权的 Etimad Plus 信号" }, tone: "warn" },
    { label: { en: "Unpaid invoices", ar: "فواتير غير مدفوعة", zh: "未付款发票" }, value: g03Money(G03_EXEC_PACKET.metrics.unpaidInvoices), note: { en: "invoice amount not yet cleared in SAP", ar: "مبلغ فواتير لم يُسو في ساب", zh: "SAP 中尚未清算的发票额" }, tone: "warn" },
    { label: { en: "Peak funding gap", ar: "أعلى فجوة تمويل", zh: "峰值资金缺口" }, value: "SAR 580M", note: { en: "FY2027 Q1 pressure point", ar: "نقطة ضغط الربع الأول 2027", zh: "FY2027 Q1 压力点" }, tone: "bad" },
  ];
  return (
    <div className="page g03-page">
      <PageHeader
        title={tr({ en: "Future Obligations and Liquidity Pressure Forecast", ar: "تنبؤ الالتزامات المستقبلية وضغط السيولة", zh: "未来义务与流动性压力预测" })}
        sub={tr({ en: "Use execution commitments, reservations, invoices, payments and Etimad Plus expected claims to identify when funding pressure appears.", ar: "استخدام الالتزامات والحجوزات والفواتير والمدفوعات ومطالبات اعتماد بلس المتوقعة لتحديد وقت ظهور ضغط التمويل.", zh: "基于执行侧承诺、预留、发票、付款与 Etimad Plus 预期索赔，识别资金压力出现的时间和来源。" })}
        right={<G03BudgetActions active="forecast" />}
      />
      <G03AiNotice
        title={{ en: "AI has prepared a forward-looking obligation view from execution data.", ar: "أعد الذكاء الاصطناعي عرضاً مستقبلياً للالتزامات من بيانات التنفيذ.", zh: "AI 已基于执行数据准备好前瞻义务视图。" }}
        body={{ en: "The forecast starts from SAP/Asas commitments and payment movement, then overlays Etimad Plus expected claims and stale commitments flagged by the exception center.", ar: "يبدأ التنبؤ من التزامات ساب/أساس وحركات الدفع ثم يضيف مطالبات اعتماد بلس المتوقعة والالتزامات المتوقفة من مركز الاستثناءات.", zh: "预测以 SAP/Asas 承诺与付款 movement 为起点，叠加 Etimad Plus 预期索赔和异常中心标记的长期未推进承诺。" }}
        chips={[{ en: "Commitments", ar: "التزامات", zh: "承诺" }, { en: "Invoices", ar: "فواتير", zh: "发票" }, { en: "Expected claims", ar: "مطالبات متوقعة", zh: "预期索赔" }, { en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }]}
      />
      <G03KpiGrid items={kpis} />
      <G03Section
        title={{ en: "Funding pressure timeline", ar: "خط ضغط التمويل", zh: "资金压力时间线" }}
        note={{ en: "Pressure is calculated from confirmed commitments, expected claims and available funding coverage.", ar: "يُحسب الضغط من الالتزامات المؤكدة والمطالبات المتوقعة وتغطية التمويل المتاح.", zh: "压力由已确认承诺、预期索赔与资金覆盖率共同计算。" }}
      >
        <div className="g03-timeline">
          {G03_EXEC_PACKET.forecastRows.map((row) => (
            <div key={row.period} className={"g03-timeline-row " + row.tone}>
              <b>{row.period}</b>
              <div><span>{tr({ en: "Commitments", ar: "الالتزامات", zh: "承诺" })}</span><strong>{row.commitments}</strong></div>
              <div><span>{tr({ en: "Invoices", ar: "الفواتير", zh: "发票" })}</span><strong>{row.invoices}</strong></div>
              <div><span>{tr({ en: "Expected claims", ar: "المطالبات المتوقعة", zh: "预期索赔" })}</span><strong>{row.claims}</strong></div>
              <div className="g03-coverage"><span>{tr({ en: "Funding coverage", ar: "تغطية التمويل", zh: "资金覆盖" })}</span><i><em style={{ width: row.funding }} /></i><strong>{row.funding}</strong></div>
              <div><span>{tr({ en: "Gap", ar: "الفجوة", zh: "缺口" })}</span><strong>{row.gap}</strong></div>
            </div>
          ))}
        </div>
      </G03Section>
      <div className="g03-layout-2">
        <G03Section
          title={{ en: "Obligation detail from execution chain", ar: "تفاصيل الالتزامات من سلسلة التنفيذ", zh: "来自执行链的义务明细" }}
          note={{ en: "Rows combine contracts, invoice status, payment plans and expected claim signals.", ar: "تجمع الصفوف العقود وحالة الفواتير وخطط الدفع وإشارات المطالبات المتوقعة.", zh: "明细行融合合同、发票状态、付款计划和预期索赔信号。" }}
        >
          <div className="g03-table-wrap compact">
            <table className="g03-table">
              <thead><tr><th>{tr({ en: "Reference", ar: "المرجع", zh: "引用" })}</th><th>{tr({ en: "Input class", ar: "فئة المدخل", zh: "输入类别" })}</th><th>{tr({ en: "Object", ar: "العنصر", zh: "对象" })}</th><th>{tr({ en: "Driver", ar: "المحرك", zh: "驱动因素" })}</th><th>{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</th><th>{tr({ en: "Amount", ar: "المبلغ", zh: "金额" })}</th><th>{tr({ en: "State", ar: "الحالة", zh: "状态" })}</th></tr></thead>
              <tbody>
                {G03_EXEC_PACKET.obligationRows.map((row) => <tr key={row.ref}><td><b>{row.ref}</b></td><td>{tr(row.class)}</td><td>{tr(row.object)}</td><td>{tr(row.driver)}</td><td>{row.period}</td><td>{row.amount}</td><td><span className={"g03-pill " + row.tone}>{tr(row.state)}</span></td></tr>)}
              </tbody>
            </table>
          </div>
        </G03Section>
        <G03Section
          title={{ en: "Forecast handoff", ar: "تسليم التنبؤ", zh: "预测结果传递" }}
          note={{ en: "The result becomes a constraint for fiscal-space update and a narrative block for reports.", ar: "تصبح النتيجة قيداً لتحديث الحيز المالي وكتلة سردية للتقارير.", zh: "预测结果作为财政空间更新约束，并进入报告叙述块。" }}
        >
          <div className="g03-handoff-card">
            <b>{tr({ en: "Pressure result", ar: "نتيجة الضغط", zh: "压力结果" })}</b>
            <p>{tr({ en: "FY2027 Q1 is the first material pressure point: SAR 580M gap, mainly from expected claims and unpaid invoices tied to roads maintenance.", ar: "الربع الأول 2027 هو أول نقطة ضغط جوهرية: فجوة 580 مليون ريال، أساساً من مطالبات متوقعة وفواتير غير مدفوعة مرتبطة بصيانة الطرق.", zh: "FY2027 Q1 是第一个实质压力点：SAR 580M 缺口，主要来自道路维护相关预期索赔和未付款发票。" })}</p>
            <div className="g03-card-actions">
              <button className="btn secondary sm" onClick={() => open("budexec-space")}>{tr({ en: "Update fiscal space", ar: "تحديث الحيز المالي", zh: "更新财政空间" })}</button>
              <button className="btn ghost sm" onClick={() => open("budexec-reports")}>{tr({ en: "Add to report draft", ar: "إضافة إلى مسودة التقرير", zh: "加入报告草稿" })}</button>
            </div>
          </div>
        </G03Section>
      </div>
    </div>
  );
}

function BudgetExecutionFiscalSpacePage() {
  const { tr, setRoute, setBackRoute } = useStore();
  const open = (nextRoute) => { setBackRoute("budexec-space"); setRoute(nextRoute); };
  const m = G03_EXEC_PACKET.metrics;
  const kpis = [
    { label: { en: "Adjusted approved amount", ar: "مبلغ الاعتماد المعدل", zh: "调整后批准额" }, value: g03Money(m.adjusted), note: { en: "after budget movements and transfers", ar: "بعد حركات الميزانية والمناقلات", zh: "含预算 movement 与转移后" } },
    { label: { en: "Consumed amount", ar: "المبلغ المستهلك", zh: "已消耗金额" }, value: g03Money(m.consumed), note: { en: "posted consumption detail from SAP", ar: "تفاصيل استهلاك مرحلة من ساب", zh: "SAP 已过账消耗明细" } },
    { label: { en: "Fund availability", ar: "توافر التمويل", zh: "资金可用性" }, value: g03Money(m.available), note: { en: "availability report after reservations and commitments", ar: "تقرير التوافر بعد الحجوزات والالتزامات", zh: "扣除预留与承诺后的可用性" }, tone: "good" },
    { label: { en: "Free cost", ar: "التكلفة الحرة", zh: "自由成本" }, value: g03Money(m.freeCost), note: { en: "transfer candidate pool after obligation guardrails", ar: "مجموعة مرشحة للمناقلة بعد ضوابط الالتزامات", zh: "义务护栏后的可转移候选池" }, tone: "warn" },
  ];
  return (
    <div className="page g03-page">
      <PageHeader
        title={tr({ en: "Budget Execution Fiscal Space Update", ar: "تحديث الحيز المالي لتنفيذ الميزانية", zh: "预算执行财政空间更新" })}
        sub={tr({ en: "Recompute available balance and free cost from SAP/Asas execution truth, Etimad obligations and Hyperion transfer constraints.", ar: "إعادة حساب الرصيد المتاح والتكلفة الحرة من حقيقة تنفيذ ساب/أساس والتزامات اعتماد وقيود مناقلات هايبريون.", zh: "基于 SAP/Asas 执行真相、Etimad 义务和 Hyperion 转移约束，重算可用余额与自由成本。" })}
        right={<G03BudgetActions active="space" />}
      />
      <G03AiNotice
        title={{ en: "AI has prepared fiscal-space inputs from the execution ledger.", ar: "أعد الذكاء الاصطناعي مدخلات الحيز المالي من دفتر التنفيذ.", zh: "AI 已从执行台账准备好财政空间输入。" }}
        body={{ en: "The update uses adjusted approvals, consumed amount, reservations, commitments, expected claims and transfer restrictions. Protected rows are kept out of the release pool.", ar: "يستخدم التحديث الاعتمادات المعدلة والاستهلاك والحجوزات والالتزامات والمطالبات المتوقعة وقيود المناقلة. تُستبعد البنود المحمية من مجموعة التحرير.", zh: "本更新使用调整后批准额、已消耗额、预留、承诺、预期索赔和转移限制；受保护预算行不会进入释放池。" }}
        chips={[{ en: "Availability report", ar: "تقرير التوافر", zh: "可用性报告" }, { en: "Consumption detail", ar: "تفاصيل الاستهلاك", zh: "消耗明细" }, { en: "Hyperion guardrail", ar: "ضابط هايبريون", zh: "Hyperion 约束" }]}
      />
      <div className="g03-formula" aria-label={tr({ en: "Fiscal-space input summary", ar: "ملخص مدخلات الحيز المالي", zh: "财政空间输入摘要" })}>
        <div><span>{tr({ en: "Adjusted approval", ar: "الاعتماد المعدل", zh: "调整后批准额" })}</span><b>{g03Money(m.adjusted)}</b><small>{tr({ en: "approved budget after movements", ar: "الاعتماد بعد الحركات", zh: "含 movement 后的预算口径" })}</small></div>
        <div><span>{tr({ en: "Consumed", ar: "المستهلك", zh: "已消耗" })}</span><b>{g03Money(m.consumed)}</b><small>{tr({ en: "posted consumption detail", ar: "تفاصيل استهلاك مرحلة", zh: "已过账消耗明细" })}</small></div>
        <div><span>{tr({ en: "Reserved and committed", ar: "محجوز وملتزم", zh: "预留与承诺" })}</span><b>{g03Money(m.reserved + m.committed)}</b><small>{tr({ en: "protected by execution chain", ar: "محمي بسلسلة التنفيذ", zh: "受执行链保护" })}</small></div>
        <div><span>{tr({ en: "Expected claims", ar: "مطالبات متوقعة", zh: "预期索赔" })}</span><b>{g03Money(m.expectedClaims)}</b><small>{tr({ en: "Etimad Plus pressure signal", ar: "إشارة ضغط اعتماد بلس", zh: "Etimad Plus 压力信号" })}</small></div>
        <div className="result"><span>{tr({ en: "Free cost pool", ar: "مجموعة التكلفة الحرة", zh: "自由成本池" })}</span><b>{g03Money(m.freeCost)}</b><small>{tr({ en: "candidate pool after guardrails", ar: "مجموعة مرشحة بعد الضوابط", zh: "护栏后的候选池" })}</small></div>
      </div>
      <G03KpiGrid items={kpis} />
      <G03Section
        title={{ en: "Budget rows and transfer decision", ar: "بنود الميزانية وقرار المناقلة", zh: "预算行与转移判断" }}
        note={{ en: "Rows retain Budget Execution stages, so idle balances are not released when future obligations or claim signals protect them.", ar: "تحتفظ الصفوف بمراحل تنفيذ الميزانية، فلا تُحرر الأرصدة الخاملة عندما تحميها التزامات مستقبلية أو إشارات مطالبة.", zh: "保留预算执行阶段，避免把受未来义务或索赔信号保护的闲置余额误释放。" }}
      >
        <div className="g03-table-wrap">
          <table className="g03-table">
            <thead><tr><th>{tr({ en: "Budget row", ar: "بند الميزانية", zh: "预算行" })}</th><th>{tr({ en: "Entity", ar: "الجهة", zh: "机构" })}</th><th>{tr({ en: "Execution stage", ar: "مرحلة التنفيذ", zh: "执行阶段" })}</th><th>{tr({ en: "Adjusted", ar: "معدل", zh: "调整后" })}</th><th>{tr({ en: "Consumed", ar: "مستهلك", zh: "已消耗" })}</th><th>{tr({ en: "Reserved", ar: "محجوز", zh: "预留" })}</th><th>{tr({ en: "Committed", ar: "ملتزم", zh: "承诺" })}</th><th>{tr({ en: "Available", ar: "متاح", zh: "可用" })}</th><th>{tr({ en: "Free cost", ar: "تكلفة حرة", zh: "自由成本" })}</th><th>{tr({ en: "Decision", ar: "القرار", zh: "判断" })}</th></tr></thead>
            <tbody>
              {G03_EXEC_PACKET.fiscalRows.map((row) => (
                <tr key={row.line}>
                  <td><b>{row.line}</b></td><td>{row.entity}</td><td><span className={"g03-pill " + row.tone}>{tr(row.stage)}</span></td><td>{row.adjusted}</td><td>{row.consumed}</td><td>{row.reserved}</td><td>{row.committed}</td><td>{row.available}</td><td>{row.freeCost}</td><td>{tr(row.transfer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="g03-card-actions">
          <button className="btn secondary sm" onClick={() => open("budexec-forecast")}>{tr({ en: "Refresh obligations", ar: "تحديث الالتزامات", zh: "刷新义务预测" })}</button>
          <button className="btn ghost sm" onClick={() => open("budexec-reports")}>{tr({ en: "Generate transfer report", ar: "إنشاء تقرير المناقلة", zh: "生成转移报告" })}</button>
        </div>
      </G03Section>
    </div>
  );
}

function BudgetExecutionReportsPage() {
  const { tr, pushLog } = useStore();
  const registry = useMemo(() => {
    const statuses = ["Approved", "In Review", "Draft", "Published", "Approved", "Draft", "In Review", "Approved", "Published", "Draft"];
    const reviewers = ["MOMAH Auditor", "Budget Execution Lead", "AI Copilot", "Financial Control", "Source Owner"];
    const scopes = [
      { en: "Ministry · FY2026 Q2 · SAP/Asas batch 184,320 rows", ar: "الوزارة · الربع 2 2026 · دفعة ساب/أساس 184,320 صفاً", zh: "部级 · FY2026 Q2 · SAP/Asas 184,320 行批次" },
      { en: "Riyadh Region · April close · Etimad Plus transition", ar: "منطقة الرياض · إقفال أبريل · انتقال اعتماد بلس", zh: "利雅得区域 · 四月关账 · Etimad Plus 过渡" },
      { en: "Municipal operations · open commitments and claims", ar: "العمليات البلدية · الالتزامات والمطالبات المفتوحة", zh: "市政运营 · 开放承诺与索赔" },
    ];
    return G03_EXEC_PACKET.reportTypes.map((item, index) => ({
      id: `BE-RPT-${String(index + 1).padStart(2, "0")}`,
      typeKey: item.key,
      title: { en: item.en, ar: item.en, zh: item.zh },
      package: { en: item.en, ar: item.en, zh: item.zh },
      scope: scopes[index % scopes.length],
      generatedAt: `2026-06-${String(9 + index).padStart(2, "0")} ${index % 2 ? "14:20" : "09:30"}`,
      status: statuses[index],
      reviewer: reviewers[index % reviewers.length],
      source: item.source,
      output: item.output,
      confidence: index % 3 === 0 ? "96%" : index % 3 === 1 ? "92%" : "88%",
      risk: index % 4 === 0 ? { en: "Exception locked", ar: "مقفل باستثناء", zh: "异常锁定" } : index % 4 === 1 ? { en: "Needs source review", ar: "يحتاج مراجعة المصدر", zh: "需来源复核" } : { en: "Ready for review", ar: "جاهز للمراجعة", zh: "可复核" },
      metrics: [
        { label: { en: "Adjusted approval", ar: "الاعتماد المعدل", zh: "调整后批准额" }, value: g03Money(G03_EXEC_PACKET.metrics.adjusted) },
        { label: { en: "Consumed", ar: "المستهلك", zh: "已消耗" }, value: g03Money(G03_EXEC_PACKET.metrics.consumed) },
        { label: { en: "Free cost", ar: "التكلفة الحرة", zh: "自由成本" }, value: g03Money(G03_EXEC_PACKET.metrics.freeCost) },
        { label: { en: "Evidence confidence", ar: "ثقة الأدلة", zh: "证据置信度" }, value: index % 3 === 0 ? "96%" : index % 3 === 1 ? "92%" : "88%" },
      ],
    }));
  }, []);
  const [selectedId, setSelectedId] = useState(registry[0]?.id || "");
  const [statusById, setStatusById] = useState(() => Object.fromEntries(registry.map((report) => [report.id, report.status])));
  const reports = registry.map((report) => ({ ...report, status: statusById[report.id] || report.status }));
  const selected = reports.find((report) => report.id === selectedId) || reports[0];
  const statusText = {
    Published: { en: "Published", ar: "منشور", zh: "已发布" },
    Approved: { en: "Approved", ar: "معتمد", zh: "已批准" },
    "In Review": { en: "In Review", ar: "قيد المراجعة", zh: "审核中" },
    Draft: { en: "Draft", ar: "مسودة", zh: "草稿" },
  };
  const statusClass = (status) => status === "Published" ? "published" : status === "Approved" ? "approved" : status === "In Review" ? "review" : "draft";
  const setSelectedStatus = (nextStatus) => {
    setStatusById((prev) => ({ ...prev, [selected.id]: nextStatus }));
    pushLog({ en: `${selected.id} moved to ${nextStatus}`, ar: `${selected.id} انتقل إلى ${nextStatus}`, zh: `${selected.id} 已更新为 ${nextStatus}` });
  };
  const counts = reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {});
  const nextAction = selected?.status === "Draft"
    ? { label: { en: "Submit for review", ar: "تقديم للمراجعة", zh: "提交审核" }, next: "In Review", cls: "primary" }
    : selected?.status === "In Review"
    ? { label: { en: "Audit approve report", ar: "اعتماد التقرير", zh: "审计批准报告" }, next: "Approved", cls: "secondary" }
    : selected?.status === "Approved"
    ? { label: { en: "Publish report", ar: "نشر التقرير", zh: "发布报告" }, next: "Published", cls: "primary" }
    : null;
  const exportDisabled = !["Approved", "Published"].includes(selected?.status);
  return (
    <div className="page g03-page g03-report-workspace">
      <PageHeader
        title={tr({ en: "Budget Execution Reports Workspace", ar: "مساحة تقارير تنفيذ الميزانية", zh: "预算执行报告工作台" })}
        sub={tr({ en: "Manage the report lifecycle for consumption, commitments, invoices, transfers, balances, spend-rate and Etimad reconciliation packages.", ar: "إدارة دورة حياة تقارير الاستهلاك والالتزامات والفواتير والمناقلات والأرصدة ومعدل الصرف ومطابقة اعتماد.", zh: "管理消耗、预留、采购、发票、合同、转移、余额、支出率与 Etimad 对账等报告包的生命周期。" })}
        right={<G03BudgetActions active="reports" />}
      />

      <section className="g03-reg-head">
        <div>
          <span>{tr({ en: "Budget Execution Department / Report Generation", ar: "إدارة تنفيذ الميزانية / إنشاء التقارير", zh: "预算执行部 / 报告生成" })}</span>
          <h2>{tr({ en: "Budget execution report registry", ar: "سجل تقارير تنفيذ الميزانية", zh: "预算执行报告注册台" })}</h2>
          <p>{tr({ en: `AI has prepared report inputs from ${G03_EXEC_PACKET.source.batch}, SAP movement dictionary, Etimad Plus reconciliation and Hyperion transfer guardrails.`, ar: `أعد الذكاء الاصطناعي مدخلات التقارير من ${G03_EXEC_PACKET.source.batch} وقاموس حركات ساب ومطابقة اعتماد بلس وضوابط هايبريون.`, zh: `AI 已从 ${G03_EXEC_PACKET.source.batch}、SAP movement 字典、Etimad Plus 对账与 Hyperion 转移约束中准备好报告输入。` })}</p>
        </div>
        <button className="g03-reg-create" onClick={() => { setSelectedId(reports.find((report) => report.status === "Draft")?.id || reports[0].id); pushLog({ en: "New Budget Execution report draft opened", ar: "تم فتح مسودة تقرير تنفيذ الميزانية", zh: "已打开预算执行报告草稿" }); }}>{tr({ en: "Create New Report +", ar: "إنشاء تقرير جديد +", zh: "创建新报告 +" })}</button>
      </section>

      <div className="g03-reg-kpis">
        <div><span>{tr({ en: "Total reports", ar: "إجمالي التقارير", zh: "总报告数" })}</span><b>{reports.length}</b><i>📁</i></div>
        <div><span>{tr({ en: "Published", ar: "منشور", zh: "已发布" })}</span><b>{counts.Published || 0}</b><i>✓</i></div>
        <div><span>{tr({ en: "Approved", ar: "معتمد", zh: "已批准" })}</span><b>{counts.Approved || 0}</b><i>↗</i></div>
        <div><span>{tr({ en: "Draft / In Review", ar: "مسودة / قيد المراجعة", zh: "草稿 / 审核中" })}</span><b>{(counts.Draft || 0) + (counts["In Review"] || 0)}</b><i>…</i></div>
      </div>

      <div className="g03-reg-layout">
        <section className="g03-reg-table-card">
          <div className="g03-reg-card-head">
            <div>
              <h3>{tr({ en: "Budget Execution Reports Registry", ar: "سجل تقارير تنفيذ الميزانية", zh: "预算执行报告清单" })}</h3>
              <p>{tr({ en: "Each row is a report package generated from the execution ledger and linked evidence.", ar: "كل صف حزمة تقرير مولدة من دفتر التنفيذ والأدلة المرتبطة.", zh: "每一行都是由执行台账和关联证据生成的报告包。" })}</p>
            </div>
          </div>
          <div className="g03-reg-table-wrap">
            <table className="g03-reg-table">
              <thead>
                <tr>
                  <th>{tr({ en: "Report name", ar: "اسم التقرير", zh: "报告名称" })}</th>
                  <th>{tr({ en: "Output package", ar: "حزمة المخرجات", zh: "输出包" })}</th>
                  <th>{tr({ en: "Data scope", ar: "نطاق البيانات", zh: "数据范围" })}</th>
                  <th>{tr({ en: "Created date", ar: "تاريخ الإنشاء", zh: "创建时间" })}</th>
                  <th>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</th>
                  <th>{tr({ en: "Reviewer", ar: "المراجع", zh: "复核人" })}</th>
                  <th>{tr({ en: "Actions", ar: "الإجراءات", zh: "操作" })}</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className={selected?.id === report.id ? "on" : ""} onClick={() => setSelectedId(report.id)}>
                    <td><b>{tr(report.title)}</b><small>{report.id}</small></td>
                    <td>{tr(report.package)}</td>
                    <td>{tr(report.scope)}</td>
                    <td>{report.generatedAt}</td>
                    <td><span className={"g03-reg-status " + statusClass(report.status)}>{tr(statusText[report.status])}</span></td>
                    <td>{report.reviewer}</td>
                    <td>
                      <button className="g03-reg-rowbtn" onClick={(e) => { e.stopPropagation(); setSelectedId(report.id); }}>
                        {tr(report.status === "Draft" || report.status === "In Review" ? { en: "Continue review", ar: "متابعة المراجعة", zh: "继续审核" } : { en: "View report", ar: "عرض التقرير", zh: "查看报告" })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="g03-reg-preview-card">
          <div className="g03-reg-preview-toolbar">
            <button className="g03-reg-back" onClick={() => setSelectedId(reports[0].id)}>{tr({ en: "Back to report workspace", ar: "العودة إلى مساحة التقارير", zh: "返回报告工作台" })}</button>
            <div>
              <span className={"g03-reg-status " + statusClass(selected.status)}>{tr(statusText[selected.status])}</span>
              {nextAction && <button className={"btn sm " + nextAction.cls} onClick={() => setSelectedStatus(nextAction.next)}>{tr(nextAction.label)}</button>}
              <button className="btn sm ghost" disabled={exportDisabled} title={exportDisabled ? tr({ en: "Report must be approved before export", ar: "يجب اعتماد التقرير قبل التصدير", zh: "报告需批准后才能导出" }) : ""}>{tr({ en: "Export Word", ar: "تصدير Word", zh: "导出 Word" })}</button>
            </div>
          </div>

          <div className="g03-reg-slide">
            <div className="g03-reg-watermark">{tr({ en: "Internal Demonstration Copy", ar: "نسخة عرض داخلية", zh: "内部演示副本" })}</div>
            <div className="g03-reg-slide-head">
              <span>{tr({ en: "Subject:", ar: "الموضوع:", zh: "主题：" })}</span>
              <h2>{tr(selected.title)}</h2>
              <p>{tr(selected.output)}</p>
            </div>
            <div className="g03-reg-meta">
              <div><span>{tr({ en: "Report scope", ar: "نطاق التقرير", zh: "报告范围" })}</span><b>{tr(selected.scope)}</b></div>
              <div><span>{tr({ en: "Report type", ar: "نوع التقرير", zh: "报告类型" })}</span><b>{tr(selected.package)}</b></div>
              <div><span>{tr({ en: "Evidence source", ar: "مصدر الدليل", zh: "证据来源" })}</span><b>{selected.source}</b></div>
            </div>
            <div className="g03-reg-slide-kpis">
              {selected.metrics.map((metric) => (
                <div key={tr(metric.label)}>
                  <span>{tr(metric.label)}</span>
                  <b>{metric.value}</b>
                </div>
              ))}
            </div>
            <div className="g03-reg-narrative">
              <h3>{tr({ en: "AI narrative basis", ar: "أساس السرد بالذكاء الاصطناعي", zh: "AI 叙述依据" })}</h3>
              <p>{tr({ en: `This report converts SAP/Asas movement rows into business terms, keeps Etimad Plus reconciliation differences visible, and highlights whether the selected package can move to leadership review. Current review signal: ${tr(selected.risk)}.`, ar: `يحوّل هذا التقرير حركات ساب/أساس إلى لغة أعمال، ويحافظ على وضوح فروق مطابقة اعتماد بلس، ويبرز ما إذا كانت الحزمة المختارة جاهزة لمراجعة القيادة. إشارة المراجعة الحالية: ${tr(selected.risk)}.`, zh: `本报告将 SAP/Asas movement 行翻译为业务语言，保留 Etimad Plus 对账差异，并标记所选报告包是否可进入领导复核。当前复核信号：${tr(selected.risk)}。` })}</p>
            </div>
            <div className="g03-reg-evidence-grid">
              <div><span>{tr({ en: "SAP/Asas truth", ar: "حقيقة ساب/أساس", zh: "SAP/Asas 真相" })}</span><b>{G03_EXEC_PACKET.source.batch}</b></div>
              <div><span>{tr({ en: "Movement dictionary", ar: "قاموس الحركة", zh: "Movement 字典" })}</span><b>{G03_EXEC_PACKET.source.dictionary}</b></div>
              <div><span>{tr({ en: "Integration state", ar: "حالة التكامل", zh: "集成状态" })}</span><b>{G03_EXEC_PACKET.source.etimadSchema}</b></div>
              <div><span>{tr({ en: "Transfer guardrail", ar: "ضابط المناقلة", zh: "转移约束" })}</span><b>{G03_EXEC_PACKET.source.hyperion}</b></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---- Budget Execution Department (UC-17) ---- */
const WS_CFG_BUDEXEC = {
  uc: "UC-17", kpiTone: "green", flow: FLOW_BUD, plazaModel: PLAZA_G03, plazaSel: "uc17", flowRoute: "g03flow",
  title: { en: "Budget Execution Department", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" },
  mandate: { en: "Mandate: real-time budget execution monitoring, SAP/ASAS-Etimad-Hyperion reconciliation, PR-to-consumption chain control, alert routing and auditable report generation.", ar: "المهمة: مراقبة تنفيذ الميزانية آنياً، ومطابقة ساب/أساس واعتماد وهايبريون، وضبط السلسلة من طلب الشراء إلى الاستهلاك، وتوجيه التنبيهات وإنشاء تقارير قابلة للتدقيق.", zh: "职责: 实时预算执行监控、SAP/ASAS-Etimad-Hyperion 对账、PR 到消耗全链路控制、预警分发与可审计报告生成。" },
  sqScope: { en: "Scope: Budget execution · source traceable", ar: "النطاق: تنفيذ الميزانية · قابل لتتبع المصدر", zh: "范围:预算执行 · 可追溯来源" },
  sqPrompts: [
    { en: "Why is the Etimad-SAP difference rate 4.2%?", ar: "لماذا يبلغ فرق اعتماد وساب 4.2%؟", zh: "Etimad-SAP差异率为什么是4.2%?" },
    { en: "Which lines block the PR-to-PO-to-consumption chain?", ar: "ما البنود التي تعطل السلسلة من طلب الشراء إلى الاستهلاك؟", zh: "哪些明细阻断了PR到消耗的执行链?" },
    { en: "Show available balance, free cost and open alerts by institution.", ar: "اعرض الرصيد المتاح والتكلفة الحرة والتنبيهات المفتوحة حسب الجهة.", zh: "按机构展示可用余额、自由成本和未处理预警。" },
  ],
  kpiSlides: [
    [
      { lab: { en: "Budget Execution / Consumption", ar: "تنفيذ / استهلاك الميزانية", zh: "预算执行率 / 消耗率" }, v: "67.3%", d: { en: "consumed amount ÷ adjusted approval", ar: "المبلغ المستهلك ÷ الاعتماد المعدل", zh: "已消耗额 ÷ 调整后批准额" } },
      { lab: { en: "Available Balance", ar: "الرصيد المتاح", zh: "可用余额" }, v: "SAR 2.85B", d: { en: "approval less consumption and reservations", ar: "الاعتماد ناقص الاستهلاك والحجوزات", zh: "批准额扣除消耗与预留" } },
      { lab: { en: "Spend Rate", ar: "معدل الصرف", zh: "支出率" }, v: "78.1%", d: { en: "consumption plus reservations ÷ approval", ar: "الاستهلاك والحجوزات ÷ الاعتماد", zh: "消耗 + 预留 ÷ 批准额" } },
      { lab: { en: "Etimad-SAP Difference", ar: "فرق اعتماد وساب", zh: "Etimad-SAP差异率" }, v: "4.2%", d: { en: "classification required before export", ar: "يتطلب التصنيف قبل التصدير", zh: "导出前需完成分类" }, tone: "warn" },
    ],
    [
      { lab: { en: "PR to PO Conversion", ar: "تحويل طلب الشراء إلى أمر شراء", zh: "PR→PO转化率" }, v: "82%", d: { en: "procurement chain conversion", ar: "تحويل سلسلة المشتريات", zh: "采购链路转化" }, up: true },
      { lab: { en: "Active Contracts", ar: "العقود النشطة", zh: "活跃合同数" }, v: "1,247", d: { en: "open contracts in execution chain", ar: "عقود مفتوحة ضمن سلسلة التنفيذ", zh: "执行链中的开放合同" } },
      { lab: { en: "Free Cost", ar: "التكلفة الحرة", zh: "自由成本" }, v: "SAR 420M", d: { en: "after consumed, reserved and committed", ar: "بعد المستهلك والمحجوز والملتزم", zh: "扣除消耗、预留与承诺后" } },
      { lab: { en: "Unhandled Alerts", ar: "تنبيهات غير معالجة", zh: "未处理预警" }, v: "23", d: { en: "click exception center to classify", ar: "افتح مركز الاستثناءات للتصنيف", zh: "进入异常中心分类处理" }, tone: "warn" },
    ],
    [
      { lab: { en: "Source Coverage", ar: "تغطية المصادر", zh: "来源覆盖" }, aging: [["SAP / ASAS", 99, "99.1%"], ["Etimad", 93, "93.4%"], ["Hyperion", 98, "97.8%"]] },
      { lab: { en: "Execution Chain", ar: "سلسلة التنفيذ", zh: "执行链" }, v: "6 steps", d: { en: "PR → PO → contract → invoice → reserve → consume", ar: "طلب → أمر → عقد → فاتورة → حجز → استهلاك", zh: "PR→PO→合同→发票→预留→消耗" } },
      { lab: { en: "Report Readiness", ar: "جاهزية التقرير", zh: "报告就绪度" }, v: "Draft", d: { en: "generate, review and export PDF", ar: "إنشاء ومراجعة وتصدير PDF", zh: "生成、复核并导出PDF" } },
      { lab: { en: "Fiscal-Space Refresh", ar: "تحديث الحيز المالي", zh: "财政空间刷新" }, v: "Ready", d: { en: "updates planning and obligation forecast", ar: "يحدّث التخطيط وتنبؤ الالتزامات", zh: "回传规划与义务预测" }, up: true },
    ],
  ],
  orch: {
    uc: "UC-17", run: "#8037", agent: { en: "Budget Execution agent", ar: "وكيل تنفيذ الميزانية", zh: "预算执行智能体" },
    chips: ["sources: SAP/ASAS · Etimad · Hyperion", "chain: PR→PO→contract→invoice→reserve→consume", "alerts: 23 open"],
    defaultPrompt: { en: "Reconcile the latest execution run, classify the 4.2% Etimad-SAP difference, identify chain breaks, refresh fiscal-space values and prepare the execution report for review.", ar: "طابق آخر تشغيل للتنفيذ، وصنّف فرق اعتماد وساب البالغ 4.2%، وحدد انقطاعات السلسلة، وحدّث قيم الحيز المالي، وجهز تقرير التنفيذ للمراجعة.", zh: "对账最新预算执行批次，分类4.2%的Etimad-SAP差异，识别链路断点，刷新财政空间数值，并准备执行报告复核。" },
    startLog: { en: "Orchestrator started — reconciling SAP/ASAS, Etimad and Hyperion execution data.", ar: "بدأ المنسّق — مطابقة بيانات تنفيذ ساب/أساس واعتماد وهايبريون.", zh: "编排器已启动——对账SAP/ASAS、Etimad、Hyperion预算执行数据。" },
    reviewLog: { en: "Draft ready — 23 alerts, 4.2% source difference and fiscal-space refresh await review.", ar: "المسودة جاهزة — 23 تنبيهاً وفرق مصدر 4.2% وتحديث الحيز المالي بانتظار المراجعة.", zh: "草稿就绪——23条预警、4.2%来源差异和财政空间刷新等待复核。" },
    approveLog: { en: "Execution package approved; PDF report and downstream handoff were generated.", ar: "اعتُمدت حزمة التنفيذ؛ وتم إنشاء تقرير PDF والتسليم اللاحق.", zh: "执行包已批准；PDF报告和下游回传已生成。" },
    returnLog: { en: "Execution package returned for source-owner reconciliation.", ar: "أُعيدت حزمة التنفيذ لمطابقة مالك المصدر.", zh: "执行包已退回来源负责人重新对账。" },
    prompts: [{ t: { en: "Classify source differences", ar: "تصنيف فروق المصادر", zh: "分类来源差异" }, s: { en: "Etimad-SAP 4.2%", ar: "اعتماد وساب 4.2%", zh: "Etimad-SAP 4.2%" } }, { t: { en: "Find chain breaks", ar: "العثور على انقطاعات السلسلة", zh: "查找链路断点" }, s: { en: "PR to consumption", ar: "من الطلب إلى الاستهلاك", zh: "PR到消耗" } }, { t: { en: "Generate execution report", ar: "إنشاء تقرير التنفيذ", zh: "生成执行报告" }, s: { en: "PDF and audit evidence", ar: "PDF وأدلة تدقيق", zh: "PDF与审计证据" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull unified execution data", ar: "سحب بيانات التنفيذ الموحدة", zh: "拉取统一执行数据" }, s: { en: "SAP/ASAS, Etimad, Hyperion loaded · 0.8s", ar: "تم تحميل ساب/أساس واعتماد وهايبريون · 0.8 ث", zh: "SAP/ASAS、Etimad、Hyperion 已加载 · 0.8s" } },
      { code: "UC-17", t: { en: "reconcile execution chain", ar: "مطابقة سلسلة التنفيذ", zh: "对账执行链" }, s: { en: "PR → PO → contract → invoice → reserve → consume", ar: "طلب → أمر → عقد → فاتورة → حجز → استهلاك", zh: "PR→PO→合同→发票→预留→消耗" } },
      { code: "UC-02", t: { en: "route differences and alerts", ar: "توجيه الفروق والتنبيهات", zh: "分发差异与预警" }, s: { en: "23 alerts · 4.2% source difference classified", ar: "23 تنبيهاً · تم تصنيف فرق 4.2%", zh: "23条预警 · 4.2%来源差异已分类" } },
      { code: "UC-10", t: { en: "generate report and handoff", ar: "إنشاء التقرير والتسليم", zh: "生成报告并回传" }, s: { en: "PDF ready · fiscal-space refresh sent downstream", ar: "PDF جاهز · تم إرسال تحديث الحيز المالي", zh: "PDF就绪 · 财政空间刷新已回传" } },
    ],
    reviewBody: { en: "The execution package contains 67.3% consumption, SAR 2.85B available balance, SAR 420M free cost, 23 open alerts and a 4.2% Etimad-SAP difference. Human review is required before PDF export.", ar: "تتضمن حزمة التنفيذ 67.3% استهلاكاً و2.85 مليار ريال رصيداً متاحاً و420 مليون ريال تكلفة حرة و23 تنبيهاً مفتوحاً وفرق اعتماد وساب 4.2%. تتطلب مراجعة بشرية قبل تصدير PDF.", zh: "执行包包含67.3%消耗率、SAR 2.85B可用余额、SAR 420M自由成本、23条未处理预警和4.2% Etimad-SAP差异，导出PDF前需要人工复核。" },
    approveLabel: { en: "Approve execution report", ar: "اعتماد تقرير التنفيذ", zh: "批准执行报告" },
    approvedChip: { en: "Approved · PDF exported · fiscal-space handoff sent", ar: "معتمد · تم تصدير PDF · أرسل تحديث الحيز المالي", zh: "已批准 · PDF已导出 · 财政空间已回传" },
    diff: [
      { k: "rem", t: { en: "Etimad-SAP differences · unclassified", ar: "فروق اعتماد وساب · غير مصنفة", zh: "Etimad-SAP差异 · 未分类" } },
      { k: "add", t: { en: "Etimad-SAP differences · classified for owner review", ar: "فروق اعتماد وساب · مصنفة لمراجعة المالك", zh: "Etimad-SAP差异 · 已分类待负责人复核" } },
      { k: "rem", t: { en: "fiscal-space values · stale", ar: "قيم الحيز المالي · قديمة", zh: "财政空间数值 · 未刷新" } },
      { k: "add", t: { en: "fiscal-space values · refreshed and handed off", ar: "قيم الحيز المالي · محدثة ومسلّمة", zh: "财政空间数值 · 已刷新并回传" } },
    ],
    returnBody: { en: "Execution package sent back to the Budget Execution agent. Re-run after source owners classify the gaps.", ar: "أُعيدت حزمة التنفيذ لوكيل تنفيذ الميزانية. أعد التشغيل بعد تصنيف مالكي المصادر للفجوات.", zh: "执行包已退回预算执行智能体。请在来源负责人分类缺口后重新运行。" },
    nextActions: [
      { act: { en: "Classify 23 unhandled alerts and assign source owners", ar: "تصنيف 23 تنبيهاً غير معالج وتعيين مالكي المصادر", zh: "分类23条未处理预警并分配来源负责人" }, owner: "Abdullah Al-Zahrani", role: { en: "Budget Execution Lead", ar: "قائد تنفيذ الميزانية", zh: "预算执行负责人" }, phone: "+966 55 781 3360" },
      { act: { en: "Reconcile the 4.2% Etimad-SAP difference before export", ar: "مطابقة فرق اعتماد وساب 4.2% قبل التصدير", zh: "导出前对账4.2% Etimad-SAP差异" }, owner: "Maha Al-Otaibi", role: { en: "Source Reconciliation Owner", ar: "مالكة مطابقة المصادر", zh: "来源对账负责人" }, phone: "+966 50 220 6614" },
      { act: { en: "Send available balance and free-cost refresh to planning and forecasting", ar: "إرسال تحديث الرصيد المتاح والتكلفة الحرة إلى التخطيط والتنبؤ", zh: "向规划和预测回传可用余额与自由成本刷新" }, owner: "Nawaf Al-Harthi", role: { en: "Fiscal Space Coordinator", ar: "منسق الحيز المالي", zh: "财政空间协调人" }, phone: "+966 53 905 4471" },
    ],
  },
};

/* ---- Planning Department (UC-07 +04/05) ---- */
const WS_CFG_PLANNING = {
  uc: "UC-07 (+04/05)", group02: true, kpiTone: "green", flow: FLOW_PLAN, plazaModel: PLAZA_G02, plazaSel: "uc07", flowRoute: "g02flow",
  title: { en: "Planning Department", ar: "إدارة التخطيط", zh: "规划部" },
  mandate: { en: "Budget planning, ceiling allocation, fiscal-space management, cost and housing impact inputs, and scenario decisions in one connected planning cycle.", ar: "تخطيط الميزانية وتخصيص السقوف وإدارة الحيز المالي ومدخلات أثر التكلفة والإسكان وقرارات السيناريوهات ضمن دورة تخطيط مترابطة.", zh: "在一条连贯规划链中完成预算规划、上限分配、财政空间管理、成本与住房影响输入，以及情景决策。" },
  sqScope: { en: "Scope: Planning · read-only", ar: "النطاق: التخطيط", zh: "范围:规划 · 只读" },
  sqPrompts: [{ en: "How much fiscal space is left?", ar: "كم الحيّز المالي المتبقي؟", zh: "还剩多少财政空间?" }, { en: "Compare the 3 budget scenarios", ar: "قارن السيناريوهات الثلاثة", zh: "对比 3 个预算情景" }, { en: "Which ceilings are near breach?", ar: "ما السقوف القريبة من التجاوز؟", zh: "哪些上限接近突破?" }],
  kpiSlides: [
    [
      { lab: { en: "Fiscal Space", ar: "الحيّز المالي", zh: "财政空间" }, v: "SAR 2.84B", d: { en: "available capacity for the FY2027 baseline", ar: "السعة المتاحة لخط أساس 2027", zh: "FY2027 基线可用空间" } },
      { lab: { en: "Ceiling Utilization", ar: "استخدام السقوف", zh: "上限使用率" }, v: "78%", d: { en: "2 ceiling areas need attention", ar: "منطقتان من السقوف تحتاجان الانتباه", zh: "2 个上限区间需要关注" } },
      { lab: { en: "Priority Spending Gap", ar: "فجوة الإنفاق ذي الأولوية", zh: "优先支出缺口" }, v: "SAR 0.6B", d: { en: "best handled through scenario decisions", ar: "يفضّل معالجتها عبر قرارات السيناريو", zh: "适合通过方案决策处理" }, tone: "warn" },
      { lab: { en: "Project Cost Risk", ar: "مخاطر تكلفة المشاريع", zh: "项目成本风险" }, v: "5", d: { en: "high-risk projects under review", ar: "مشاريع عالية المخاطر قيد المراجعة", zh: "高风险项目正在复核" }, tone: "warn" },
    ],
    [
      { lab: { en: "Housing Support Efficiency", ar: "كفاءة دعم الإسكان", zh: "住房支持效率" }, v: "87%", d: { en: "current support mix is performing well", ar: "مزيج الدعم الحالي يعمل بكفاءة", zh: "当前支持组合表现良好" }, up: true },
      { lab: { en: "Forecast Pressure Next Quarter", ar: "ضغط التنبؤ للربع القادم", zh: "下季度预测压力" }, v: "SAR 1.1B", d: { en: "next-quarter funding pressure is building", ar: "ضغط التمويل للربع القادم يتصاعد", zh: "下季度资金压力正在上升" } },
      { lab: { en: "Open Scenarios", ar: "سيناريوهات مفتوحة", zh: "在评情景" }, v: "3", d: { en: "one option is moving ahead", ar: "يوجد خيار واحد متقدّم", zh: "其中一个方案领先" } },
      { lab: { en: "Recommended Scenario Benefit", ar: "فائدة السيناريو الموصى", zh: "推荐情景收益" }, v: "+SAR 0.31B", d: { en: "benefit from the recommended decision package", ar: "فائدة حزمة القرار الموصى بها", zh: "推荐决策组合带来的收益" }, up: true },
    ],
    [
      { lab: { en: "Ceiling Headroom (near breach)", ar: "هامش السقوف (قرب التجاوز)", zh: "上限余量(接近突破)" }, aging: [["Cap A", 92, "92%"], ["Cap B", 88, "88%"], ["Cap C", 60, "60%"]] },
      { lab: { en: "Projected Revenue", ar: "الإيراد المتوقع", zh: "预计收入" }, v: "SAR 9.4B", d: { en: "revenue outlook remains stable", ar: "توقع الإيرادات ما زال مستقراً", zh: "收入展望保持稳定" } },
      { lab: { en: "Forecast Deviation", ar: "انحراف التنبؤ", zh: "预测偏差" }, v: "6%", d: { en: "forecast remains within target range", ar: "التنبؤ ما زال ضمن النطاق المستهدف", zh: "预测仍在目标范围内" }, up: true },
      { lab: { en: "Recommended Scenario", ar: "السيناريو الموصى", zh: "推荐情景" }, v: "Realloc.", d: { en: "ready for planning sign-off", ar: "جاهز لاعتماد التخطيط", zh: "待规划确认" }, up: true },
    ],
  ],
  orch: {
    uc: "UC-07", run: "#4055", agent: { en: "Planning agent", ar: "وكيل التخطيط", zh: "规划智能体" },
    chips: ["scope: FY2027", "dept: Secretariat", "policy: fiscal space"],
    defaultPrompt: { en: "Compare the three budget scenarios, show remaining fiscal space and ceilings near breach, and recommend a scenario to close the priority-spending gap.", ar: "قارن السيناريوهات الثلاثة، وأظهر الحيّز المالي المتبقي والسقوف القريبة من التجاوز، وأوصِ بسيناريو لإغلاق فجوة الإنفاق ذي الأولوية.", zh: "对比三个预算情景,显示剩余财政空间与接近突破的上限,并推荐弥合优先支出缺口的情景。" },
    startLog: { en: "Orchestrator started — evaluating scenarios & fiscal space (FY2027)", ar: "بدأ المنسّق — تقييم السيناريوهات والحيّز المالي", zh: "编排器已启动——评估情景与财政空间(FY2027)" },
    reviewLog: { en: "Draft ready — reallocation scenario awaits planning sign-off", ar: "المسودة جاهزة — سيناريو إعادة التوزيع بانتظار اعتماد التخطيط", zh: "草稿就绪——重分配情景等待规划签核" },
    approveLog: { en: "Reallocation scenario adopted; ceiling allocation drafted", ar: "اعتُمد سيناريو إعادة التوزيع؛ وصيغ تخصيص السقوف", zh: "重分配情景已采用;已起草上限分配" },
    returnLog: { en: "Scenario returned to the Planning agent for rework", ar: "أُعيد السيناريو لوكيل التخطيط", zh: "情景已退回规划智能体重新处理" },
    prompts: [{ t: { en: "Compare 3 scenarios", ar: "قارن 3 سيناريوهات", zh: "对比 3 情景" }, s: { en: "fiscal impact", ar: "الأثر المالي", zh: "财政影响" } }, { t: { en: "Check fiscal space", ar: "فحص الحيّز المالي", zh: "检查财政空间" }, s: { en: "ceilings near breach", ar: "سقوف قرب التجاوز", zh: "接近突破上限" } }, { t: { en: "Recommend scenario", ar: "أوصِ بسيناريو", zh: "推荐情景" }, s: { en: "close the gap", ar: "أغلق الفجوة", zh: "弥合缺口" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull planning baseline", ar: "سحب الأساس التخطيطي", zh: "拉取规划基线" }, s: { en: "ceilings & forecasts loaded · 0.6s", ar: "السقوف والتنبؤات · 0.6 ث", zh: "上限与预测加载 · 0.6s" } },
      { code: "UC-04", t: { en: "run revenue / expense forecast", ar: "تشغيل تنبؤ الإيراد / المصروف", zh: "运行收入/支出预测" }, s: { en: "94% accuracy · SAR 9.4B projected", ar: "دقة 94% · 9.4 مليار", zh: "准确度 94% · 预计 9.4B" } },
      { code: "UC-05", t: { en: "evaluate 3 scenarios", ar: "تقييم 3 سيناريوهات", zh: "评估 3 情景" }, s: { en: "reallocation closes gap · +0 fiscal", ar: "إعادة التوزيع تغلق الفجوة", zh: "重分配弥合缺口 · 财政 +0" } },
      { code: "UC-07", t: { en: "draft ceiling allocation", ar: "صياغة تخصيص السقوف", zh: "起草上限分配" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "Adopting the reallocation scenario for FY2027 (within ceilings, no extra fiscal cost) requires planning sign-off.", ar: "يتطلب اعتماد سيناريو إعادة التوزيع للسنة 2027 (ضمن السقوف، بلا كلفة إضافية) توقيع التخطيط.", zh: "采用 FY2027 重分配情景(在上限内、无额外财政成本)需规划签核。" },
    approveLabel: { en: "Adopt scenario", ar: "اعتماد السيناريو", zh: "采用情景" },
    approvedChip: { en: "Adopted · allocation drafted", ar: "معتمد · صيغ التخصيص", zh: "已采用 · 已起草分配" },
    diff: [
      { k: "rem", t: { en: "scenario · status quo (gap remains)", ar: "سيناريو · الوضع الراهن (تبقى الفجوة)", zh: "情景 · 维持现状(缺口仍在)" } },
      { k: "add", t: { en: "scenario · reallocation (gap closed)", ar: "سيناريو · إعادة توزيع (أُغلقت الفجوة)", zh: "情景 · 重分配(缺口弥合)" } },
      { k: "rem", t: { en: "ceiling Cap A · 92% (near breach)", ar: "سقف A · 92% (قرب التجاوز)", zh: "上限 Cap A · 92%(接近突破)" } },
      { k: "add", t: { en: "ceiling Cap A · within limit", ar: "سقف A · ضمن الحد", zh: "上限 Cap A · 在限内" } },
    ],
    returnBody: { en: "Scenario sent back to the Planning agent. Edit the prompt and run again.", ar: "أُعيد السيناريو لوكيل التخطيط. عدّل الطلب وأعد التشغيل.", zh: "情景已退回规划智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Adopt reallocation scenario for FY2027", ar: "اعتماد سيناريو إعادة التوزيع للسنة 2027", zh: "采用 FY2027 重分配情景" }, owner: "Salem Al-Ghamdi", role: { en: "Planning Lead", ar: "قائد التخطيط", zh: "规划负责人" }, phone: "+966 55 612 9087" },
      { act: { en: "Rebalance 2 ceilings near breach", ar: "إعادة توازن سقفين قرب التجاوز", zh: "再平衡 2 个接近突破的上限" }, owner: "Aisha Al-Dosari", role: { en: "Budget Planner", ar: "مخططة الميزانية", zh: "预算规划员" }, phone: "+966 50 771 3329" },
      { act: { en: "Lock forecast assumptions with FP&A", ar: "تثبيت افتراضات التنبؤ مع التخطيط المالي", zh: "与 FP&A 锁定预测假设" }, owner: "Hani Al-Maliki", role: { en: "Forecast Analyst", ar: "محلل التنبؤ", zh: "预测分析师" }, phone: "+966 53 448 1925" },
    ],
  },
};

const PLN_BUDGET_SCOPE_OPTIONS = [
  { key: "secretariat", label: { en: "Secretariat", ar: "الأمانة", zh: "秘书处" }, ceiling: 5.8, exclusions: 0.44, obligations: 1.26, payment: 0.68, entities: 4 },
  { key: "diwan", label: { en: "Diwan", ar: "الديوان", zh: "Diwan" }, ceiling: 2.9, exclusions: 0.19, obligations: 0.72, payment: 0.35, entities: 2 },
];
const PLN_BUDGET_SUGGESTIONS = [
  { key: "rebalance", title: { en: "Rebalance lower-priority ceilings", ar: "إعادة توازن السقوف الأقل أولوية", zh: "再平衡低优先级上限" }, impact: { en: "Release SAR 0.18B to absorb the priority-spending gap without changing the total ceiling.", ar: "تحرير 0.18 مليار ريال لامتصاص فجوة الإنفاق ذي الأولوية دون تغيير السقف الكلي.", zh: "释放 1.8 亿里亚尔弥合优先支出缺口，不改变总上限。" }, owner: { en: "Planning lead", ar: "قائد التخطيط", zh: "规划负责人" }, status: "recommended" },
  { key: "reserve", title: { en: "Lower reserve ratio for healthy entities", ar: "خفض نسبة الاحتياطي للجهات السليمة", zh: "下调健康实体预留比例" }, impact: { en: "Create SAR 0.09B of short-term headroom, but keep a monthly review checkpoint.", ar: "يوفر 0.09 مليار ريال من الهامش قصير الأجل مع نقطة مراجعة شهرية.", zh: "新增 0.9 亿里亚尔短期空间，但需保留月度复核点。" }, owner: { en: "Budget planner", ar: "مخطط الميزانية", zh: "预算规划员" }, status: "conditional" },
  { key: "defer", title: { en: "Defer non-critical payment batches", ar: "تأجيل دفعات غير حرجة", zh: "延后非关键付款批次" }, impact: { en: "Shift SAR 0.12B into the next period and protect current-year fiscal space.", ar: "ترحيل 0.12 مليار ريال إلى الفترة التالية وحماية الحيز المالي للسنة الحالية.", zh: "将 1.2 亿里亚尔转至下一期，保护本年度财政空间。" }, owner: { en: "Treasury coordination", ar: "تنسيق الخزينة", zh: "国库协调" }, status: "review" },
];
const PLN_BUDGET_WEIGHT_BASE = [
  { key: "population", label: { en: "Population weight", ar: "وزن السكان", zh: "人口权重" }, value: 35, min: 20, max: 45 },
  { key: "service", label: { en: "Service demand weight", ar: "وزن الطلب الخدمي", zh: "服务需求权重" }, value: 30, min: 20, max: 40 },
  { key: "priority", label: { en: "Strategic priority weight", ar: "وزن الأولوية الاستراتيجية", zh: "战略优先级权重" }, value: 20, min: 10, max: 30 },
  { key: "risk", label: { en: "Risk buffer weight", ar: "وزن احتياطي المخاطر", zh: "风险缓冲权重" }, value: 15, min: 10, max: 20 },
];
function budgetRiskMeta(key, tr) {
  const meta = {
    healthy: { label: { en: "Healthy", ar: "مريح", zh: "健康" }, cls: "good" },
    watch: { label: { en: "Watch", ar: "مراقبة", zh: "关注" }, cls: "warn" },
    tight: { label: { en: "Tight", ar: "ضيق", zh: "紧张" }, cls: "bad" },
  }[key] || { label: { en: "Watch", ar: "مراقبة", zh: "关注" }, cls: "warn" };
  return { text: tr(meta.label), cls: meta.cls };
}
function BudgetPlanningPage() {
  const { tr, setRoute, setDeptSub, setAlertsOpen, setBackRoute, group02, updateGroup02 } = useStore();
  const [budgetYear, setBudgetYear] = useState(group02.context.fiscalYear || "2027");
  const [scopeKey, setScopeKey] = useState(group02.context.scopeType === "Diwan" ? "diwan" : "secretariat");
  const [reserveRatio, setReserveRatio] = useState(10);
  const [obligationShield, setObligationShield] = useState(100);
  const [paymentPosture, setPaymentPosture] = useState("steady");
  const [draftState, setDraftState] = useState(() => ({ approved: "approved_as_baseline", in_review: "scenario_in_review" }[group02.baseline.status] || "planning_in_progress"));
  const [scenarioSeq, setScenarioSeq] = useState(2);
  const [baselineSeq, setBaselineSeq] = useState(3);
  const [selectedScenario, setSelectedScenario] = useState("service");
  const [drillDimension, setDrillDimension] = useState("department");
  const [detailPanel, setDetailPanel] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(1);
  const [weights, setWeights] = useState(PLN_BUDGET_WEIGHT_BASE.map((item) => ({ ...item })));
  const scope = PLN_BUDGET_SCOPE_OPTIONS.find(x => x.key === scopeKey) || PLN_BUDGET_SCOPE_OPTIONS[0];
  const reserve = +(scope.ceiling * reserveRatio / 100).toFixed(2);
  const obligations = +(scope.obligations * (obligationShield / 100)).toFixed(2);
  const paymentFactor = paymentPosture === "accelerated" ? 1.08 : paymentPosture === "deferred" ? 0.93 : 1;
  const payment = +(scope.payment * paymentFactor).toFixed(2);
  const baseFiscalSpace = +(scope.ceiling - scope.exclusions - obligations - payment - reserve).toFixed(2);
  const weightTotal = weights.reduce((sum, item) => sum + item.value, 0);
  const weightValid = weightTotal === 100;
  const strategicWeight = (weights.find((item) => item.key === "priority") || { value: 20 }).value;
  const serviceWeight = (weights.find((item) => item.key === "service") || { value: 30 }).value;
  const riskWeight = (weights.find((item) => item.key === "risk") || { value: 15 }).value;
  const compRows = [
    { key: "ceiling", label: { en: "Budget ceiling", ar: "سقف الميزانية", zh: "预算上限" }, value: scope.ceiling, tone: "base" },
    { key: "exclude", label: { en: "Exclusions", ar: "الاستبعادات", zh: "排除项" }, value: scope.exclusions, tone: "sub" },
    { key: "oblig", label: { en: "Mandatory obligations", ar: "الالتزامات الإلزامية", zh: "强制义务" }, value: obligations, tone: "sub" },
    { key: "payment", label: { en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }, value: payment, tone: "sub" },
    { key: "reserve", label: { en: "Reserve buffer", ar: "احتياطي الحماية", zh: "预留缓冲" }, value: reserve, tone: "sub" },
    { key: "space", label: { en: "Current fiscal space", ar: "الحيز المالي الحالي", zh: "当前财政空间" }, value: baseFiscalSpace, tone: "good" },
  ];
  const blockedReason = !weightValid
    ? { en: "Weights must total 100% before AI can generate a valid planning option.", ar: "يجب أن يساوي مجموع الأوزان 100٪ قبل أن يولّد الذكاء الاصطناعي خيار تخطيط صالحاً.", zh: "AI 生成有效规划方案前，权重合计必须等于 100%。" }
    : { en: "AI can now generate planning options for the selected year and scope.", ar: "يمكن للذكاء الاصطناعي الآن توليد خيارات التخطيط للسنة والنطاق المحددين.", zh: "AI 现在可以针对所选年度和范围生成规划方案。" };
  const isDirty = reserveRatio !== 10 || obligationShield !== 100 || paymentPosture !== "steady" || weights.some((item, idx) => item.value !== PLN_BUDGET_WEIGHT_BASE[idx].value);
  const scenarioOptions = useMemo(() => {
    const buildOption = (key, cfg) => {
      const fiscalSpace = +(baseFiscalSpace + cfg.spaceBoost).toFixed(2);
      const gap = +(Math.max(0, cfg.targetGap - fiscalSpace)).toFixed(2);
      return {
        key,
        title: cfg.title,
        tag: cfg.tag,
        risk: cfg.risk,
        fiscalSpace,
        gap,
        reserve: +(reserveRatio + cfg.reserveDelta).toFixed(0),
        paymentView: cfg.paymentView,
        summary: cfg.summary,
        rationale: cfg.rationale,
        actions: cfg.actions,
      };
    };
    return [
      buildOption("risk", {
        title: { en: "Risk Control", ar: "التحكم في المخاطر", zh: "风险控制" },
        tag: { en: "higher protection", ar: "حماية أعلى", zh: "更高保护" },
        risk: "healthy",
        spaceBoost: +(0.08 - riskWeight * 0.002).toFixed(2),
        targetGap: 3.7,
        reserveDelta: 2,
        paymentView: { en: "keep payments steady and protect obligations first", ar: "الحفاظ على وتيرة المدفوعات وحماية الالتزامات أولاً", zh: "保持付款节奏稳定，优先保护义务" },
        summary: { en: "AI keeps more buffer, reduces downside, and protects baseline stability.", ar: "يحتفظ الذكاء الاصطناعي بهامش حماية أكبر ويقلل المخاطر ويحافظ على استقرار خط الأساس.", zh: "AI 保留更多缓冲，降低下行风险，优先保证基线稳定。" },
        rationale: { en: "Best when leadership prefers lower volatility and tighter control over commitments.", ar: "الأفضل عندما تفضّل الإدارة تقلباً أقل وتحكماً أشد في الالتزامات.", zh: "适合管理层更重视低波动和更严格承诺控制的场景。" },
        actions: [
          { en: "Hold reserve at 12%", ar: "الإبقاء على الاحتياطي عند 12٪", zh: "将预留维持在 12%" },
          { en: "Protect mandatory obligations at full coverage", ar: "حماية الالتزامات الإلزامية بتغطية كاملة", zh: "对强制义务保持全额保障" },
        ],
      }),
      buildOption("service", {
        title: { en: "Service Priority", ar: "أولوية الخدمات", zh: "服务优先" },
        tag: { en: "AI recommended", ar: "موصى به من الذكاء الاصطناعي", zh: "AI 推荐" },
        risk: "watch",
        spaceBoost: +(0.22 + serviceWeight * 0.003).toFixed(2),
        targetGap: 3.25,
        reserveDelta: 0,
        paymentView: { en: "rebalance payment timing to support high-demand services", ar: "إعادة موازنة توقيت المدفوعات لدعم الخدمات الأعلى طلباً", zh: "重配付款节奏以支持高需求服务" },
        summary: { en: "AI shifts capacity toward frontline services while keeping the baseline broadly stable.", ar: "يوجه الذكاء الاصطناعي السعة نحو الخدمات الأمامية مع الحفاظ على استقرار عام لخط الأساس.", zh: "AI 将能力更多投向一线服务，同时保持基线整体稳定。" },
        rationale: { en: "Best trade-off for a demo because it improves visible service outcomes without over-stretching the plan.", ar: "أفضل توازن في العرض لأنه يحسن النتائج الخدمية الظاهرة دون إرهاق الخطة.", zh: "这是最适合 demo 的折中方案，在不明显拉高风险的前提下改善服务结果。" },
        actions: [
          { en: "Rebalance lower-priority envelopes", ar: "إعادة موازنة المخصصات الأقل أولوية", zh: "再平衡低优先级额度" },
          { en: "Phase selected payments into later windows", ar: "ترحيل دفعات مختارة إلى نوافذ لاحقة", zh: "将部分付款分期到后续窗口" },
        ],
      }),
      buildOption("growth", {
        title: { en: "Growth Priority", ar: "أولوية النمو", zh: "增长优先" },
        tag: { en: "more aggressive", ar: "أكثر جرأة", zh: "更积极" },
        risk: "tight",
        spaceBoost: +(0.34 + strategicWeight * 0.004).toFixed(2),
        targetGap: 2.95,
        reserveDelta: -2,
        paymentView: { en: "accelerate targeted funding to unlock program growth", ar: "تسريع التمويل المستهدف لفتح مسارات النمو", zh: "加快重点投放以释放项目增长" },
        summary: { en: "AI releases more headroom for strategic initiatives, but the fiscal posture becomes tighter.", ar: "يفرج الذكاء الاصطناعي عن هامش أكبر للمبادرات الاستراتيجية لكن الوضع المالي يصبح أكثر ضيقاً.", zh: "AI 释放更多空间给战略事项，但财政姿态会更紧。" },
        rationale: { en: "Best when leadership wants visible growth and is comfortable accepting tighter guardrails.", ar: "الأفضل عندما تريد الإدارة نمواً مرئياً وتقبل ضوابط أكثر إحكاماً.", zh: "适合管理层更强调增长结果，并接受更紧约束的场景。" },
        actions: [
          { en: "Lower reserve to 8%", ar: "خفض الاحتياطي إلى 8٪", zh: "将预留降到 8%" },
          { en: "Increase strategic-priority weighting", ar: "رفع وزن الأولوية الاستراتيجية", zh: "提高战略优先级权重" },
        ],
      }),
    ];
  }, [baseFiscalSpace, reserveRatio, riskWeight, serviceWeight, strategicWeight]);
  const activeScenario = scenarioOptions.find((item) => item.key === selectedScenario) || scenarioOptions[1];
  const detailRows = useMemo(() => {
    const reserveFactor = activeScenario.reserve / Math.max(reserveRatio, 1);
    const scopeFactor = scopeKey === "secretariat" ? 1 : 0.56;
    const targetBase = activeScenario.key === "growth" ? 0.96 : activeScenario.key === "risk" ? 0.82 : 0.9;
    const modelByDimension = {
      department: [
        { key: "sec-core", name: { en: "Secretary Office Core Programs", ar: "برامج مكتب الأمانة الأساسية", zh: "秘书处核心项目" }, base: [1.84, 0.14, 0.43, 0.24, 0.18], risk: activeScenario.key === "risk" ? "healthy" : "watch", note: { en: "Core operating and coordination envelope.", ar: "مظلة التشغيل والتنسيق الأساسية.", zh: "核心运营与协调额度。" } },
        { key: "muni", name: { en: "Municipal Services Portfolio", ar: "محفظة الخدمات البلدية", zh: "市政服务组合" }, base: [1.62, 0.09, 0.35, 0.22, 0.14], risk: activeScenario.key === "service" ? "healthy" : "watch", note: { en: "Frontline service demand and recurring city operations.", ar: "الطلب الخدمي الأمامي وعمليات المدن المتكررة.", zh: "一线服务需求与城市常规运营。" } },
        { key: "housing", name: { en: "Housing Support & Subsidy", ar: "دعم الإسكان والإعانات", zh: "住房支持与补贴" }, base: [1.18, 0.07, 0.29, 0.18, 0.11], risk: activeScenario.key === "growth" ? "watch" : "healthy", note: { en: "Subsidy commitments and targeted housing support flows.", ar: "التزامات الإعانات وتدفقات دعم الإسكان المستهدفة.", zh: "补贴承诺与定向住房支持流。" } },
        { key: "strategic", name: { en: "Strategic Growth Initiatives", ar: "مبادرات النمو الاستراتيجية", zh: "战略增长项目" }, base: [1.16, 0.08, 0.19, 0.16, 0.10], risk: activeScenario.key === "growth" ? "tight" : "watch", note: { en: "Programs that absorb additional headroom when growth is prioritized.", ar: "البرامج التي تستوعب الحيز الإضافي عند إعطاء أولوية للنمو.", zh: "在增长优先时吸收额外空间的项目。" } },
      ],
      chapter: [
        { key: "ch2", name: { en: "Chapter 2, Operating", ar: "الباب 2، تشغيلي", zh: "第2章，运营" }, base: [1.96, 0.12, 0.52, 0.30, 0.16], risk: "watch", note: { en: "Recurring operations and administrative support.", ar: "العمليات المتكررة والدعم الإداري.", zh: "经常性运营与行政支持。" } },
        { key: "ch3", name: { en: "Chapter 3, Capital", ar: "الباب 3، رأسمالي", zh: "第3章，资本" }, base: [1.78, 0.11, 0.38, 0.24, 0.17], risk: activeScenario.key === "growth" ? "tight" : "watch", note: { en: "Capital-intensive programs and infrastructure blocks.", ar: "البرامج كثيفة رأس المال وكتل البنية التحتية.", zh: "资本密集型项目与基础设施板块。" } },
        { key: "ch4", name: { en: "Chapter 4, Subsidies", ar: "الباب 4، إعانات", zh: "第4章，补贴" }, base: [1.21, 0.08, 0.31, 0.18, 0.12], risk: "healthy", note: { en: "Support and subsidy disbursement channels.", ar: "قنوات الصرف للدعم والإعانات.", zh: "支持与补贴发放渠道。" } },
      ],
      project: [
        { key: "proj-a", name: { en: "Metro Service Acceleration", ar: "تسريع الخدمة الحضرية", zh: "都市服务加速" }, base: [1.24, 0.10, 0.27, 0.17, 0.11], risk: activeScenario.key === "service" ? "healthy" : "watch", note: { en: "High-visibility urban service program cluster.", ar: "حزمة برامج حضرية عالية الظهور.", zh: "高可见度城市服务项目组。" } },
        { key: "proj-b", name: { en: "Housing Support Balance", ar: "موازنة دعم الإسكان", zh: "住房支持平衡" }, base: [1.12, 0.06, 0.28, 0.16, 0.10], risk: "healthy", note: { en: "Balanced support portfolio with stable demand.", ar: "محفظة دعم متوازنة بطلب مستقر.", zh: "需求稳定的均衡支持组合。" } },
        { key: "proj-c", name: { en: "Strategic Uplift Packages", ar: "حزم الرفع الاستراتيجي", zh: "战略提升包" }, base: [1.34, 0.09, 0.21, 0.19, 0.12], risk: activeScenario.key === "growth" ? "tight" : "watch", note: { en: "Growth-sensitive projects that absorb headroom quickly.", ar: "مشاريع حساسة للنمو تستهلك الحيز بسرعة.", zh: "对增长敏感、快速消耗空间的项目。" } },
      ],
      service: [
        { key: "srv-urban", name: { en: "Urban Services", ar: "الخدمات الحضرية", zh: "城市服务" }, base: [1.66, 0.09, 0.34, 0.22, 0.14], risk: activeScenario.key === "service" ? "healthy" : "watch", note: { en: "Operational service delivery across cities.", ar: "تقديم الخدمات التشغيلية عبر المدن.", zh: "跨城市的运营服务交付。" } },
        { key: "srv-housing", name: { en: "Housing Support Services", ar: "خدمات دعم الإسكان", zh: "住房支持服务" }, base: [1.28, 0.07, 0.30, 0.17, 0.11], risk: "healthy", note: { en: "Targeted support and subsidy services.", ar: "الخدمات المستهدفة للدعم والإعانات.", zh: "定向支持与补贴服务。" } },
        { key: "srv-strat", name: { en: "Strategic Development Services", ar: "خدمات التنمية الاستراتيجية", zh: "战略发展服务" }, base: [1.41, 0.08, 0.24, 0.18, 0.12], risk: activeScenario.key === "growth" ? "tight" : "watch", note: { en: "Development-oriented services with higher upside and variance.", ar: "خدمات تنموية بعائد أعلى وتباين أكبر.", zh: "收益和波动都更高的发展型服务。" } },
      ],
      item: [
        { key: "it-personnel", name: { en: "Personnel Item", ar: "بند الأفراد", zh: "人员项目" }, base: [1.37, 0.06, 0.39, 0.15, 0.11], risk: "healthy", note: { en: "Protected item with limited flexibility.", ar: "بند محمي ذو مرونة محدودة.", zh: "受保护且灵活性有限的项目。" } },
        { key: "it-ops", name: { en: "Operations Item", ar: "بند التشغيل", zh: "运营项目" }, base: [1.49, 0.09, 0.26, 0.22, 0.13], risk: activeScenario.key === "service" ? "healthy" : "watch", note: { en: "Flexible operating item used for rebalancing.", ar: "بند تشغيلي مرن يستخدم لإعادة الموازنة.", zh: "用于再平衡的灵活运营项目。" } },
        { key: "it-capital", name: { en: "Capital Item", ar: "بند رأسمالي", zh: "资本项目" }, base: [1.52, 0.10, 0.18, 0.20, 0.14], risk: activeScenario.key === "growth" ? "tight" : "watch", note: { en: "Capital item with larger upside and larger exposure.", ar: "بند رأسمالي بعائد أعلى وتعرض أكبر.", zh: "收益更高但暴露也更大的资本项目。" } },
      ],
    };
    return (modelByDimension[drillDimension] || modelByDimension.department).map((row) => {
      const [ceilingBase, exclusionBase, obligationBase, paymentBase, reserveBase] = row.base;
      const ceiling = ceilingBase * scopeFactor;
      const exclusions = exclusionBase * scopeFactor;
      const rowObligations = obligationBase * scopeFactor;
      const rowPayment = paymentBase * scopeFactor;
      const rowReserve = reserveBase * reserveFactor * scopeFactor;
      const computedFiscal = +(ceiling - exclusions - rowObligations - rowPayment - rowReserve).toFixed(2);
      const targetNeed = +((targetBase + reserveBase * 0.26) * scopeFactor).toFixed(2);
      const delta = +(computedFiscal - targetNeed).toFixed(2);
      return {
        ...row,
        ceiling,
        exclusions,
        obligations: rowObligations,
        payment: rowPayment,
        reserve: rowReserve,
        fiscal: computedFiscal,
        targetNeed,
        delta,
      };
    });
  }, [activeScenario, reserveRatio, scopeKey, drillDimension]);
  const positiveRows = detailRows.filter((row) => row.delta >= 0).length;
  const riskRows = detailRows.filter((row) => row.risk === "tight").length;
  const totalDelta = detailRows.reduce((sum, row) => sum + row.delta, 0);
  const headerStatusMeta = {
    planning_in_progress: { label: { en: "Planning in progress", ar: "الميزنة قيد الإعداد", zh: "预算规划中" }, cls: "warn" },
    scenario_in_review: { label: { en: "Scenario in review", ar: "السيناريو قيد المراجعة", zh: "情景待审批" }, cls: "soft" },
    approved_as_baseline: { label: { en: "Approved as baseline", ar: "اعتمد كخط أساس", zh: "已批准为基线" }, cls: "good" },
  }[draftState];
  const updateWeight = (key, delta) => {
    setWeights((prev) => prev.map((item) => {
      if (item.key !== key) return item;
      return { ...item, value: Math.min(item.max, Math.max(item.min, item.value + delta)) };
    }));
    setDraftState("planning_in_progress");
  };
  const saveDraft = () => {
    setScenarioSeq((n) => n + 1);
    setDraftState("planning_in_progress");
    updateGroup02("baseline", { status: "draft", versionId: `BL-${budgetYear}-DRAFT-0${baselineSeq}`, selectedPosture: selectedScenario, ceiling: scope.ceiling, exclusions: scope.exclusions, obligations, paymentPlan: payment, reserve, fiscalSpace: baseFiscalSpace });
  };
  const generatePlans = () => {
    setGeneratedAt((n) => n + 1);
    setScenarioSeq((n) => n + 1);
    setDraftState("planning_in_progress");
    updateGroup02("context", { fiscalYear: budgetYear, scopeType: scopeKey === "diwan" ? "Diwan" : "Secretariat", scopeId: scopeKey === "diwan" ? "DIWAN-ALL" : "SEC-ALL" });
    updateGroup02("baseline", { status: "calculated", selectedPosture: selectedScenario, ceiling: scope.ceiling, exclusions: scope.exclusions, obligations, paymentPlan: payment, reserve, fiscalSpace: baseFiscalSpace });
  };
  const submitReview = () => { setDraftState("scenario_in_review"); updateGroup02("baseline", { status: "in_review", selectedPosture: selectedScenario }); };
  const approveBaseline = () => {
    setBaselineSeq((n) => n + 1);
    setDraftState("approved_as_baseline");
    const versionId = `BL-${budgetYear}-APP-0${baselineSeq + 1}`;
    updateGroup02("baseline", { status: "approved", versionId, selectedPosture: selectedScenario, ceiling: scope.ceiling, exclusions: scope.exclusions, obligations, paymentPlan: payment, reserve, fiscalSpace: baseFiscalSpace, priorityGap: activeScenario.gap, approvedAt: "02 Jul 2026 · 10:12" }, { type: "Approval", detail: `${versionId} approved as the planning baseline.` });
    updateGroup02("context", { fiscalYear: budgetYear, scopeType: scopeKey === "diwan" ? "Diwan" : "Secretariat", scopeId: scopeKey === "diwan" ? "DIWAN-ALL" : "SEC-ALL", baselineVersionId: versionId });
  };
  const returnRevision = () => { setDraftState("planning_in_progress"); updateGroup02("baseline", { status: "returned" }, { type: "Planning", detail: "Budget baseline returned for revision." }); };
  return (
    <div className="fade">
      <PageHeader
        title={tr({ en: "Budget Planning & Fiscal Space", ar: "تخطيط الميزانية والحيز المالي", zh: "预算规划与财政空间" })}
        sub={tr({ en: "Enter the planning year and scope, let AI generate several planning postures, then choose or fine-tune the option that should move to review.", ar: "أدخل سنة التخطيط والنطاق، ودع الذكاء الاصطناعي يولّد عدة أوضاع تخطيطية، ثم اختر أو حسّن الخيار الذي سينتقل إلى المراجعة.", zh: "输入规划年度和范围，让 AI 生成多种规划姿态，再选择或微调要进入审核的方案。" })}
        right={<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn ghost sm" onClick={() => { setRoute("plnwork"); }}>‹ {tr({ en: "Planning workspace", ar: "مساحة التخطيط", zh: "规划工作台" })}</button>
          <button className="btn sm pz-expand" onClick={() => setAlertsOpen(true)}>{tr({ en: "Exception detection", ar: "كشف الاستثناءات", zh: "异常检测" })}</button>
        </div>}
      />

      <div className="bp-hero">
        <div className="bp-hcard wide bp-hero-main">
          <div className="bp-cap">{tr({ en: "Planning brief", ar: "ملخص التخطيط", zh: "规划简报" })}</div>
          <div className="bp-hv">{tr({ en: "AI-assisted budget posture generation", ar: "توليد أوضاع الميزانية بمساعدة الذكاء الاصطناعي", zh: "AI 辅助预算姿态生成" })}</div>
          <div className="bp-hsub">{tr({ en: "The AI planner uses your selected year, scope, reserve posture, payment timing, and weighting model to propose decision-ready budget options.", ar: "يستخدم مخطط الذكاء الاصطناعي السنة والنطاق ووضع الاحتياطي وتوقيت المدفوعات ونموذج الأوزان لتقديم خيارات ميزانية جاهزة للقرار.", zh: "AI 规划器会结合你选择的年度、范围、预留姿态、付款节奏和权重模型，生成可决策的预算方案。" })}</div>
        </div>
        <div className="bp-hero-side">
          <div className="bp-hcard bp-hmini"><div className="bp-cap">{tr({ en: "Budget year", ar: "سنة الميزانية", zh: "预算年度" })}</div><div className="bp-hv">FY{budgetYear}</div></div>
          <div className="bp-hcard bp-hmini"><div className="bp-cap">{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</div><div className="bp-hv">{tr(scope.label)}</div></div>
          <div className="bp-hcard bp-hmini"><div className="bp-cap">{tr({ en: "Current status", ar: "الحالة الحالية", zh: "当前状态" })}</div><div className={"bp-status " + headerStatusMeta.cls}>{tr(headerStatusMeta.label)}</div></div>
        </div>
      </div>

      <div className="bp-entry">
        <div className="bp-entry-grid">
          <label className="bp-field">
            <span>{tr({ en: "Budget year", ar: "سنة الميزانية", zh: "预算年度" })}</span>
            <input value={budgetYear} onChange={(e) => setBudgetYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))} />
          </label>
          <div className="bp-field">
            <span>{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</span>
            <div className="bp-pills">{PLN_BUDGET_SCOPE_OPTIONS.map((opt) => <button key={opt.key} className={"btn sm " + (scopeKey === opt.key ? "" : "ghost")} onClick={() => { setScopeKey(opt.key); setDraftState("planning_in_progress"); updateGroup02("context", { scopeType: opt.key === "diwan" ? "Diwan" : "Secretariat", scopeId: opt.key === "diwan" ? "DIWAN-ALL" : "SEC-ALL" }); }}>{tr(opt.label)}</button>)}</div>
          </div>
        </div>
        <div className="bp-entry-actions">
          <button className="btn ghost sm" onClick={() => setDetailPanel("params")}>{tr({ en: "Adjust parameters", ar: "ضبط المعلمات", zh: "调整参数" })}</button>
          <button className="btn sm" onClick={generatePlans} disabled={!weightValid || budgetYear.length !== 4}>{tr({ en: "Generate planning options", ar: "توليد خيارات التخطيط", zh: "生成规划方案" })}</button>
        </div>
      </div>

      <div className="bp-summary">
        <div className={"bp-strip " + (isDirty ? "warn" : "good")}>
          <div className="bp-strip-ey">{tr({ en: "AI readiness", ar: "جاهزية الذكاء الاصطناعي", zh: "AI 就绪状态" })}</div>
          <div className="bp-strip-main">
            <b>{tr(isDirty ? { en: "Custom planning posture is active", ar: "وضع تخطيط مخصص نشط", zh: "当前为自定义规划姿态" } : { en: "Default planning posture is active", ar: "وضع التخطيط الافتراضي نشط", zh: "当前为默认规划姿态" })}</b>
            <span>{tr(blockedReason)}</span>
          </div>
        </div>
        <div className="bp-strip">
          <div className="bp-strip-ey">{tr({ en: "Last AI run", ar: "آخر تشغيل للذكاء الاصطناعي", zh: "最近一次 AI 生成" })}</div>
          <div className="bp-strip-main">
            <b>{tr({ en: "Generated option set #" + generatedAt, ar: "تم توليد مجموعة الخيارات رقم " + generatedAt, zh: "已生成第 " + generatedAt + " 组方案" })}</b>
            <span>{tr({ en: "Using FY" + budgetYear + " · " + tr(scope.label) + " · current parameter posture.", ar: "باستخدام FY" + budgetYear + " · " + tr(scope.label) + " · وضع المعلمات الحالي.", zh: "基于 FY" + budgetYear + " · " + tr(scope.label) + " · 当前参数姿态。" })}</span>
          </div>
        </div>
        <div className="bp-strip">
          <div className="bp-strip-ey">{tr({ en: "Version context", ar: "سياق النسخة", zh: "版本上下文" })}</div>
          <div className="bp-strip-main">
            <b>DV-2027-06-28-A → SC-2027-REALLOC-0{scenarioSeq} → BL-2027-DRAFT-0{baselineSeq}</b>
            <span>{tr({ en: "Approved source data feeds the current scenario draft and the baseline candidate under review.", ar: "تغذّي البيانات المعتمدة مسودة السيناريو الحالية ومرشح خط الأساس قيد المراجعة.", zh: "已批准源数据进入当前情景草稿和待审基线候选版本。" })}</span>
          </div>
        </div>
      </div>

      <Section
        title={tr({ en: "Approved ceiling baseline", ar: "خط الأساس للسقف المعتمد", zh: "已批准上限基线" })}
        sub={tr({ en: "This is the approved ceiling and locked planning context. AI allocation options must stay inside this boundary.", ar: "هذا هو السقف المعتمد والسياق التخطيطي المقفل. يجب أن تبقى خيارات التوزيع بالذكاء الاصطناعي داخل هذا الحد.", zh: "这是已批准上限和锁定的规划上下文，AI 分配方案必须在这个边界内运作。" })}
        className="bp-card"
      >
        <div className="bp-approved-grid">
          {[
            { title: { en: "Approved ceiling", ar: "السقف المعتمد", zh: "已批准上限" }, value: `SAR ${scope.ceiling.toFixed(2)}B`, tone: "base" },
            { title: { en: "Locked exclusions", ar: "الاستبعادات المقفلة", zh: "锁定排除项" }, value: `SAR ${scope.exclusions.toFixed(2)}B`, tone: "soft" },
            { title: { en: "Mandatory obligations", ar: "الالتزامات الإلزامية", zh: "强制义务" }, value: `SAR ${obligations.toFixed(2)}B`, tone: "soft" },
            { title: { en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }, value: `SAR ${payment.toFixed(2)}B`, tone: "soft" },
            { title: { en: "Available planning capacity", ar: "السعة التخطيطية المتاحة", zh: "可规划空间" }, value: `SAR ${baseFiscalSpace.toFixed(2)}B`, tone: "good" },
          ].map((item, idx) => (
            <div className={"bp-approved-card " + item.tone} key={idx}>
              <span>{tr(item.title)}</span>
              <b>{item.value}</b>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={tr({ en: "AI planning options", ar: "خيارات التخطيط بالذكاء الاصطناعي", zh: "AI 规划方案" })}
        sub={tr({ en: "AI generates several budget postures for the selected year and scope. Choose one directly or adjust the parameters and regenerate.", ar: "يولّد الذكاء الاصطناعي عدة أوضاع ميزانية للسنة والنطاق المحددين. اختر أحدها مباشرة أو اضبط المعلمات وأعد التوليد.", zh: "AI 会针对所选年度和范围生成多种预算姿态。你可以直接选择，也可以调参后重新生成。" })}
        right={<button className="btn ghost sm" onClick={() => setDetailPanel("formula")}>{tr({ en: "View breakdown", ar: "عرض التفصيل", zh: "查看构成" })}</button>}
        className="bp-card"
      >
        <div className="bp-aioptions">
          {scenarioOptions.map((item) => {
            const riskMeta = budgetRiskMeta(item.risk, tr);
            return (
              <div key={item.key} className={"bp-opt " + (selectedScenario === item.key ? "on " : "") + riskMeta.cls}>
                <div className="bp-opt-top">
                  <div>
                    <div className="bp-opt-ey">{tr(item.tag)}</div>
                    <div className="bp-opt-title">{tr(item.title)}</div>
                  </div>
                  <span className={"bp-risk " + riskMeta.cls}>{riskMeta.text}</span>
                </div>
                <div className="bp-opt-kpis">
                  <div><span>{tr({ en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" })}</span><b>SAR {item.fiscalSpace.toFixed(2)}B</b></div>
                  <div><span>{tr({ en: "Gap / surplus", ar: "الفجوة / الفائض", zh: "缺口 / 结余" })}</span><b>{item.gap > 0 ? "−" : "+"} SAR {Math.abs(item.gap).toFixed(2)}B</b></div>
                  <div><span>{tr({ en: "Reserve posture", ar: "وضع الاحتياطي", zh: "预留姿态" })}</span><b>{item.reserve}%</b></div>
                </div>
                <p className="bp-opt-summary">{tr(item.summary)}</p>
                <div className="bp-opt-box">
                  <div className="bp-label">{tr({ en: "Why AI suggests this", ar: "لماذا يقترحه الذكاء الاصطناعي", zh: "AI 推荐理由" })}</div>
                  <p>{tr(item.rationale)}</p>
                </div>
                <div className="bp-opt-box">
                  <div className="bp-label">{tr({ en: "Recommended actions", ar: "الإجراءات الموصى بها", zh: "建议动作" })}</div>
                  {item.actions.map((action, idx) => <div className="bp-opt-action" key={idx}>{tr(action)}</div>)}
                </div>
                <div className="bp-opt-foot">{tr(item.paymentView)}</div>
                <div className="bp-opt-actions">
                  <button className="btn ghost sm" onClick={() => setDetailPanel("params")}>{tr({ en: "Adjust parameters", ar: "ضبط المعلمات", zh: "调整参数" })}</button>
                  <button className="btn sm" onClick={() => setSelectedScenario(item.key)}>{tr(selectedScenario === item.key ? { en: "Selected", ar: "محدد", zh: "已选择" } : { en: "Select this option", ar: "اختر هذا الخيار", zh: "选择此方案" })}</button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title={tr({ en: "Selected option drill", ar: "تفصيل الخيار المحدد", zh: "所选方案下钻" })}
        sub={tr({ en: "Open the selected allocation option by department, chapter, project, service, or item to review surplus and deficit before approval.", ar: "اعرض خيار التوزيع المحدد حسب الإدارة أو الباب أو المشروع أو الخدمة أو البند لمراجعة الفائض والعجز قبل الاعتماد.", zh: "在审批前，按部门、章节、项目、服务或项目科目查看所选分配方案的盈余和赤字。" })}
        className="bp-card"
        right={<div className="bp-pills">
          {[
            ["department", { en: "By department", ar: "حسب الإدارة", zh: "按部门" }],
            ["chapter", { en: "By chapter", ar: "حسب الباب", zh: "按章节" }],
            ["project", { en: "By project", ar: "حسب المشروع", zh: "按项目" }],
            ["service", { en: "By service", ar: "حسب الخدمة", zh: "按服务" }],
            ["item", { en: "By item", ar: "حسب البند", zh: "按项目科目" }],
          ].map(([key, label]) => <button key={key} className={"btn sm " + (drillDimension === key ? "" : "ghost")} onClick={() => setDrillDimension(key)}>{tr(label)}</button>)}
        </div>}
      >
        <div className="bp-drillhead">
          <div className="bp-approved-grid bp-approved-grid.compact">
            <div className="bp-approved-card base">
              <span>{tr({ en: "Current view", ar: "العرض الحالي", zh: "当前视图" })}</span>
              <b>{tr({
                department: { en: "Department", ar: "الإدارة", zh: "部门" },
                chapter: { en: "Chapter", ar: "الباب", zh: "章节" },
                project: { en: "Project", ar: "المشروع", zh: "项目" },
                service: { en: "Service", ar: "الخدمة", zh: "服务" },
                item: { en: "Item", ar: "البند", zh: "项目科目" },
              }[drillDimension])}</b>
            </div>
            <div className="bp-approved-card good">
              <span>{tr({ en: "Positive lines", ar: "بنود بفائض", zh: "盈余条目" })}</span>
              <b>{positiveRows}/{detailRows.length}</b>
            </div>
            <div className="bp-approved-card soft">
              <span>{tr({ en: "Net balance", ar: "الرصيد الصافي", zh: "净余额" })}</span>
              <b>{totalDelta >= 0 ? "+" : "−"} SAR {Math.abs(totalDelta).toFixed(2)}B</b>
            </div>
            <div className={"bp-approved-card " + (riskRows ? "warn" : "good")}>
              <span>{tr({ en: "High-risk lines", ar: "بنود عالية المخاطر", zh: "高风险条目" })}</span>
              <b>{riskRows}</b>
            </div>
          </div>
          <div className="bp-active-scenario">
            <div className="bp-label">{tr({ en: "Selected option", ar: "الخيار المحدد", zh: "当前方案" })}</div>
            <div className="bp-active-row">
              <div>
                <b>{tr(activeScenario.title)}</b>
                <p>{tr(activeScenario.summary)}</p>
              </div>
              <span className={"bp-risk " + budgetRiskMeta(activeScenario.risk, tr).cls}>{budgetRiskMeta(activeScenario.risk, tr).text}</span>
            </div>
          </div>
        </div>
        <div className="bp-drillhint">
          <b>{tr({
            department: { en: "Department view", ar: "عرض الإدارة", zh: "部门视图" },
            chapter: { en: "Chapter view", ar: "عرض الباب", zh: "章节视图" },
            project: { en: "Project view", ar: "عرض المشروع", zh: "项目视图" },
            service: { en: "Service view", ar: "عرض الخدمة", zh: "服务视图" },
            item: { en: "Item view", ar: "عرض البند", zh: "项目科目视图" },
          }[drillDimension])}</b> · {tr({ en: "Surplus and deficit must be reviewed at this level before the option can be confidently approved.", ar: "يجب مراجعة الفائض والعجز على هذا المستوى قبل اعتماد الخيار بثقة.", zh: "在批准方案前，必须先在这个层级审视盈余和赤字。" })}
        </div>
        <div className="bp-tablewrap">
          <table className="tbl bp-table">
            <thead>
              <tr>
                <th>{tr({
                  department: { en: "Department", ar: "الإدارة", zh: "部门" },
                  chapter: { en: "Chapter", ar: "الباب", zh: "章节" },
                  project: { en: "Project", ar: "المشروع", zh: "项目" },
                  service: { en: "Service", ar: "الخدمة", zh: "服务" },
                  item: { en: "Item", ar: "البند", zh: "项目科目" },
                }[drillDimension])}</th>
                <th>{tr({ en: "Ceiling", ar: "السقف", zh: "上限" })}</th>
                <th>{tr({ en: "Exclusions", ar: "الاستبعادات", zh: "排除项" })}</th>
                <th>{tr({ en: "Obligations", ar: "الالتزامات", zh: "义务" })}</th>
                <th>{tr({ en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" })}</th>
                <th>{tr({ en: "Reserve", ar: "الاحتياطي", zh: "预留" })}</th>
                <th>{tr({ en: "Surplus / deficit", ar: "الفائض / العجز", zh: "盈余 / 赤字" })}</th>
                <th>{tr({ en: "Risk", ar: "المخاطر", zh: "风险" })}</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row) => {
                const risk = budgetRiskMeta(row.risk, tr);
                const deltaText = row.delta >= 0 ? `+ SAR ${row.delta.toFixed(2)}B` : `− SAR ${Math.abs(row.delta).toFixed(2)}B`;
                return (
                  <tr key={row.key} onClick={() => {
                    if (drillDimension === "project") { setBackRoute("plnbudget"); updateGroup02("context", { focusTarget: `project:${row.key}` }); setRoute("plncost"); }
                    else if (row.key === "housing") { setBackRoute("plnbudget"); updateGroup02("context", { focusTarget: "program:HSP-2027-01" }); setRoute("plnhousing"); }
                  }}>
                    <td>
                      <div className="bp-table-main">{tr(row.name)}</div>
                      <div className="bp-table-sub">{tr(row.note)}</div>
                    </td>
                    <td>SAR {row.ceiling.toFixed(2)}B</td>
                    <td>SAR {row.exclusions.toFixed(2)}B</td>
                    <td>SAR {row.obligations.toFixed(2)}B</td>
                    <td>SAR {row.payment.toFixed(2)}B</td>
                    <td>SAR {row.reserve.toFixed(2)}B</td>
                    <td>
                      <div className={"bp-balance " + (row.delta >= 0 ? "good" : "bad")}>{deltaText}</div>
                      <div className="bp-table-sub">{tr({ en: "Need", ar: "الاحتياج", zh: "需求" })}: SAR {row.targetNeed.toFixed(2)}B</div>
                    </td>
                    <td><span className={"bp-risk " + risk.cls}>{risk.text}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="bp-decision-grid">
        <Section
          title={tr({ en: "Approval and next links", ar: "الاعتماد والروابط التالية", zh: "审批与下一步链接" })}
          sub={tr({ en: "Move the selected AI option into review, approve it as the new baseline, or route it to downstream teams.", ar: "انقل خيار الذكاء الاصطناعي المحدد إلى المراجعة، أو اعتمده كخط أساس جديد، أو مرّره إلى الفرق اللاحقة.", zh: "将所选 AI 方案送审、批准为新基线，或传递给下游团队。" })}
          className="bp-card"
        >
          <div className="bp-approval">
            <div className="bp-approval-copy">
              <div className="bp-label">{tr({ en: "Selected option", ar: "الخيار المحدد", zh: "当前方案" })}</div>
              <p><b>{tr(activeScenario.title)}</b> · {tr(activeScenario.summary)}</p>
            </div>
            <div className="bp-approval-actions">
              <button className="btn ghost sm" onClick={saveDraft}>{tr({ en: "Save draft", ar: "حفظ المسودة", zh: "保存草稿" })}</button>
              <button className="btn secondary sm" onClick={submitReview} disabled={!weightValid}>{tr({ en: "Submit for review", ar: "إرسال للمراجعة", zh: "提交审批" })}</button>
              <button className="btn sm" onClick={approveBaseline} disabled={draftState !== "scenario_in_review"}>{tr({ en: "Approve as baseline", ar: "اعتماد كخط أساس", zh: "批准为基线" })}</button>
              <button className="btn ghost sm" onClick={returnRevision}>{tr({ en: "Return for revision", ar: "إرجاع للتعديل", zh: "退回修改" })}</button>
            </div>
            <div className={"bp-guard " + (weightValid ? "ok" : "bad")}>{tr(blockedReason)}</div>
          </div>
          <div className="bp-next">
            <button className="bp-next-card" onClick={() => { setBackRoute("plnbudget"); setRoute("plnforecast"); }}>
              <div className="bp-next-title">{tr({ en: "Send to forecasting", ar: "الإرسال إلى التنبؤ", zh: "发送到预测" })}</div>
              <div className="bp-next-sub">{tr({ en: "Use the selected option as the starting point for future obligations forecasting.", ar: "استخدم الخيار المحدد كنقطة انطلاق لتنبؤ الالتزامات المستقبلية.", zh: "将所选方案作为未来义务预测的起点。" })}</div>
            </button>
            <button className="bp-next-card" onClick={() => { setBackRoute("plnbudget"); setRoute("plnscenario"); }}>
              <div className="bp-next-title">{tr({ en: "Send to scenario comparison", ar: "الإرسال إلى مقارنة السيناريو", zh: "发送到情景比较" })}</div>
              <div className="bp-next-sub">{tr({ en: "Use the selected budget posture as the baseline input for cross-business scenario decisions.", ar: "استخدم وضع الميزانية المحدد كمدخل أساسي لقرارات السيناريو عبر الأعمال.", zh: "将所选预算姿态作为跨业务情景决策的基线输入。" })}</div>
            </button>
            <button className="bp-next-card" onClick={() => setAlertsOpen(true)}>
              <div className="bp-next-title">{tr({ en: "Open exception review", ar: "فتح مراجعة الاستثناءات", zh: "打开异常复核" })}</div>
              <div className="bp-next-sub">{tr({ en: "Check whether this option raises any blocked assumptions or threshold breaches.", ar: "تحقق مما إذا كان هذا الخيار يثير افتراضات محجوبة أو تجاوزات للعتبات.", zh: "检查该方案是否触发受阻假设或阈值越线。" })}</div>
            </button>
          </div>
        </Section>
        <Section
          title={tr({ en: "Selected option analysis", ar: "تحليل الخيار المحدد", zh: "所选方案分析" })}
          sub={tr({ en: "A compact analysis panel for the currently selected AI option.", ar: "لوحة تحليل مدمجة للخيار المحدد حالياً من الذكاء الاصطناعي.", zh: "当前所选 AI 方案的紧凑分析面板。" })}
          className="bp-card"
        >
          <div className="bp-active-scenario">
            <div className="bp-label">{tr({ en: "Selected option", ar: "الخيار المحدد", zh: "当前方案" })}</div>
            <div className="bp-active-row">
              <div>
                <b>{tr(activeScenario.title)}</b>
                <p>{tr(activeScenario.rationale)}</p>
              </div>
              <span className={"bp-risk " + budgetRiskMeta(activeScenario.risk, tr).cls}>{budgetRiskMeta(activeScenario.risk, tr).text}</span>
            </div>
          </div>
          <div className="bp-formula bp-formula-compact">
            <div className="bp-formula-code">{tr({ en: "Fiscal Space = Ceiling - Exclusions - Obligations - Payment Plan - Reserve", ar: "الحيز المالي = السقف - الاستبعادات - الالتزامات - خطة الدفع - الاحتياطي", zh: "财政空间 = 上限 - 排除项 - 义务 - 付款计划 - 预留" })}</div>
            <div className="bp-formula-sub">{tr({ en: "Current baseline result", ar: "النتيجة الحالية لخط الأساس", zh: "当前基线结果" })}: <b>SAR {baseFiscalSpace.toFixed(2)}B</b></div>
          </div>
          <div className="bp-minirow">
            {compRows.map((row) => <div className="bp-minirow-card" key={row.key}><span>{tr(row.label)}</span><b>SAR {row.value.toFixed(2)}B</b></div>)}
          </div>
        </Section>
      </div>

      {detailPanel && createPortal(
        <div className="bp-modal-ov" onClick={() => setDetailPanel(null)}>
          <div className="bp-modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="bp-modal-head">
              <div>
                <div className="bp-cap">{tr(detailPanel === "formula" ? { en: "Breakdown", ar: "تفصيل", zh: "构成明细" } : { en: "Parameters", ar: "المعلمات", zh: "参数" })}</div>
                <div className="bp-hv" style={{ fontSize: 22 }}>{tr(detailPanel === "formula" ? { en: "Fiscal-space breakdown", ar: "تفصيل الحيز المالي", zh: "财政空间构成" } : { en: "Planning parameter setup", ar: "إعداد معلمات التخطيط", zh: "规划参数设置" })}</div>
              </div>
              <button className="btn ghost sm" onClick={() => setDetailPanel(null)}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
            </div>
            {detailPanel === "params" && (
              <div className="bp-modal-body">
                <div className="bp-ctrls">
                  <div>
                    <div className="bp-label">{tr({ en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "预留比例" })}</div>
                    <div className="bp-pills">{[8, 10, 12].map((v) => <button key={v} className={"btn sm " + (reserveRatio === v ? "" : "ghost")} onClick={() => setReserveRatio(v)}>{v}%</button>)}</div>
                  </div>
                  <div>
                    <div className="bp-label">{tr({ en: "Obligation protection", ar: "حماية الالتزامات", zh: "义务保护强度" })}</div>
                    <div className="bp-pills">{[95, 100, 105].map((v) => <button key={v} className={"btn sm " + (obligationShield === v ? "" : "ghost")} onClick={() => setObligationShield(v)}>{v}%</button>)}</div>
                  </div>
                  <div>
                    <div className="bp-label">{tr({ en: "Payment timing posture", ar: "وضع توقيت المدفوعات", zh: "付款节奏姿态" })}</div>
                    <div className="bp-pills">
                      {[
                        ["steady", { en: "Steady", ar: "مستقر", zh: "稳定" }],
                        ["deferred", { en: "Deferred", ar: "مؤجل", zh: "延后" }],
                        ["accelerated", { en: "Accelerated", ar: "متسارع", zh: "加速" }],
                      ].map(([key, label]) => <button key={key} className={"btn sm " + (paymentPosture === key ? "" : "ghost")} onClick={() => setPaymentPosture(key)}>{tr(label)}</button>)}
                    </div>
                  </div>
                  <div>
                    <div className="bp-label">{tr({ en: "Weight mix", ar: "مزيج الأوزان", zh: "权重组合" })}</div>
                    <div className="bp-weightbox">
                      {weights.map((item, idx) => <div className="bp-weightrow" key={item.key}>
                        <div>
                          <div className="bp-weightname">{tr(item.label)}</div>
                          <div className="bp-weightmeta">{tr({ en: "Bounds", ar: "الحدود", zh: "上下限" })}: {item.min}% - {item.max}%</div>
                        </div>
                        <div className="bp-weightctl">
                          <button className="btn ghost sm" onClick={() => updateWeight(item.key, -5)} disabled={item.value <= item.min}>−5</button>
                          <b>{item.value}%</b>
                          <button className="btn ghost sm" onClick={() => updateWeight(item.key, 5)} disabled={item.value >= item.max}>+5</button>
                        </div>
                        <div className={"bp-risk " + (item.value === PLN_BUDGET_WEIGHT_BASE[idx].value ? "soft" : "warn")}>
                          {item.value - PLN_BUDGET_WEIGHT_BASE[idx].value >= 0 ? "+" : ""}{item.value - PLN_BUDGET_WEIGHT_BASE[idx].value}%
                        </div>
                      </div>)}
                      <div className={"bp-weightsum " + (weightValid ? "ok" : "bad")}>
                        <span>{tr({ en: "Weight total", ar: "إجمالي الأوزان", zh: "权重合计" })}</span>
                        <b>{weightTotal}%</b>
                        <span>{tr(weightValid ? { en: "ready for AI generation", ar: "جاهز لتوليد الذكاء الاصطناعي", zh: "可用于 AI 生成" } : { en: "must equal 100%", ar: "يجب أن يساوي 100٪", zh: "必须等于 100%" })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {detailPanel === "formula" && (
              <div className="bp-modal-body">
                <p className="bp-modal-copy">{tr({ en: "This is the compact financial logic behind the AI-generated planning options. It stays available for transparency, but no longer takes over the main workspace.", ar: "هذا هو المنطق المالي المدمج خلف خيارات التخطيط المولدة بالذكاء الاصطناعي. يظل متاحاً للشفافية، لكنه لم يعد يهيمن على مساحة العمل الرئيسية.", zh: "这是 AI 生成规划方案背后的简洁财务逻辑。它会保留以便透明展示，但不再占据主工作区。" })}</p>
                <div className="bp-modal-grid">
                  {compRows.map((row) => <div className="bp-mini" key={row.key}>
                    <span>{tr(row.label)}</span>
                    <b>SAR {row.value.toFixed(2)}B</b>
                  </div>)}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function BudgetPlanningConsolePage() {
  const { tr, setRoute, setDeptSub, setAlertsOpen, setBackRoute, group02, updateGroup02 } = useStore();
  const [budgetYear, setBudgetYear] = useState(group02.context.fiscalYear || "2027");
  const [scopeKey, setScopeKey] = useState(group02.context.scopeType === "Diwan" ? "diwan" : "secretariat");
  const [reserveRatio, setReserveRatio] = useState(10);
  const [selectedPosture, setSelectedPosture] = useState("balanced");
  const [status, setStatus] = useState(() => ({ approved: "adopted", in_review: "in_review" }[group02.baseline.status] || "draft"));
  const [allocationView, setAllocationView] = useState("trust");
  const [selectedRecommendation, setSelectedRecommendation] = useState("balanced");
  const [planningTrigger, setPlanningTrigger] = useState("cycle");
  const [sourceVersion, setSourceVersion] = useState("approved");
  const [weights, setWeights] = useState([
    { key: "population", label: { en: "Population census", ar: "تعداد السكان", zh: "人口普查" }, value: 32 },
    { key: "area", label: { en: "Urban area", ar: "المساحة الحضرية", zh: "城市面积" }, value: 18 },
    { key: "revenue", label: { en: "Revenue contribution", ar: "مساهمة الإيرادات", zh: "收入贡献" }, value: 16 },
    { key: "priority", label: { en: "City priorities", ar: "أولويات المدن", zh: "城市优先事项" }, value: 24 },
    { key: "cost", label: { en: "Cost drivers", ar: "محركات التكلفة", zh: "成本驱动因素" }, value: 10 },
  ]);
  const scope = PLN_BUDGET_SCOPE_OPTIONS.find((item) => item.key === scopeKey) || PLN_BUDGET_SCOPE_OPTIONS[0];
  const exclusions = scope.exclusions;
  const commitments = scope.obligations;
  const paymentPlan = scope.payment;
  const unclassified = scopeKey === "diwan" ? 0.03 : 0.07;
  const reserve = +(scope.ceiling * reserveRatio / 100).toFixed(2);
  const fiscalSpace = +(scope.ceiling - exclusions - commitments - paymentPlan - reserve).toFixed(2);
  const weightTotal = weights.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const weightValid = weightTotal === 100;
  const riskLevel = fiscalSpace < 1.35 ? "tight" : reserveRatio < 10 ? "watch" : "healthy";
  const riskMeta = budgetRiskMeta(riskLevel, tr);
  const postureCopy = {
    balanced: {
      title: { en: "Balanced allocation", ar: "توزيع متوازن", zh: "平衡分配" },
      desc: { en: "Keep the approved reserve and redirect moderate surplus to high-priority services.", ar: "الإبقاء على الاحتياطي المعتمد وتوجيه فائض معتدل إلى الخدمات ذات الأولوية.", zh: "保留已批准储备，并将适度盈余转向高优先级服务。" },
      reserve: 10,
      lift: 0.00,
    },
    control: {
      title: { en: "Risk control", ar: "التحكم في المخاطر", zh: "风险控制" },
      desc: { en: "Increase reserve protection before opening new ceiling transfers.", ar: "زيادة حماية الاحتياطي قبل فتح تحويلات سقف جديدة.", zh: "在开放新的上限转移前提高储备保护。" },
      reserve: 12,
      lift: -0.05,
    },
    growth: {
      title: { en: "Growth priority", ar: "أولوية النمو", zh: "增长优先" },
      desc: { en: "Release more capacity for city priorities with stronger review guardrails.", ar: "إتاحة حيز أكبر لأولويات المدن مع ضوابط مراجعة أقوى.", zh: "为城市优先事项释放更多能力，并加强复核约束。" },
      reserve: 8,
      lift: 0.09,
    },
  };
  const allocationViews = [
    ["trust", { en: "By region", ar: "حسب المنطقة", zh: "按区域" }],
    ["chapter", { en: "By budget category", ar: "حسب باب الميزانية", zh: "按预算门类" }],
    ["project", { en: "By project", ar: "حسب المشروع", zh: "按项目" }],
    ["service", { en: "By service", ar: "حسب الخدمة", zh: "按服务" }],
    ["item", { en: "By item", ar: "حسب البند", zh: "按项目科目" }],
  ];
  const allocationLabel = allocationViews.find(([key]) => key === allocationView)?.[1] || allocationViews[0][1];
  const allocationBaseRows = {
    trust: [
      { id: "region-riyadh", name: { en: "Riyadh Region", ar: "منطقة الرياض", zh: "利雅得区域" }, meta: { en: "urban services and municipal delivery", ar: "الخدمات الحضرية والتنفيذ البلدي", zh: "城市服务与市政交付" }, ceiling: 1.82, need: 1.74, risk: "healthy" },
      { id: "region-makkah", name: { en: "Makkah Region", ar: "منطقة مكة", zh: "麦加区域" }, meta: { en: "housing subsidy and beneficiary support", ar: "إعانات الإسكان ودعم المستفيدين", zh: "住房补贴与受益人支持" }, ceiling: 1.21, need: 1.28, risk: "tight", target: "plnhousing" },
      { id: "region-eastern", name: { en: "Eastern Region", ar: "المنطقة الشرقية", zh: "东部区域" }, meta: { en: "capital works and infrastructure delivery", ar: "الأعمال الرأسمالية وتنفيذ البنية التحتية", zh: "资本工程与基础设施交付" }, ceiling: 1.42, need: 1.36, risk: "watch", target: "plncost" },
      { id: "region-asir", name: { en: "Asir Region", ar: "منطقة عسير", zh: "阿西尔区域" }, meta: { en: "planning data, modelling and analytics", ar: "بيانات التخطيط والنمذجة والتحليلات", zh: "规划数据、建模与分析" }, ceiling: 0.42, need: 0.36, risk: "healthy" },
    ],
    chapter: [
      { id: "ch-operating", name: { en: "Chapter 2, Operating", ar: "الباب 2، تشغيلي", zh: "第2章，运营" }, meta: { en: "recurring operations", ar: "عمليات متكررة", zh: "经常性运营" }, ceiling: 1.96, need: 1.89, risk: "healthy" },
      { id: "ch-capital", name: { en: "Chapter 3, Capital", ar: "الباب 3، رأسمالي", zh: "第3章，资本" }, meta: { en: "capital projects", ar: "مشاريع رأسمالية", zh: "资本项目" }, ceiling: 1.78, need: 1.86, risk: "tight", target: "plncost" },
      { id: "ch-subsidy", name: { en: "Chapter 4, Subsidies", ar: "الباب 4، إعانات", zh: "第4章，补贴" }, meta: { en: "housing and beneficiary support", ar: "الإسكان ودعم المستفيدين", zh: "住房与受益人支持" }, ceiling: 1.21, need: 1.15, risk: "watch", target: "plnhousing" },
      { id: "ch-shared", name: { en: "Shared planning services", ar: "خدمات التخطيط المشتركة", zh: "共享规划服务" }, meta: { en: "data, modelling and planning support", ar: "البيانات والنمذجة ودعم التخطيط", zh: "数据、建模和规划支持" }, ceiling: 0.35, need: 0.31, risk: "healthy" },
    ],
    project: [
      { id: "proj-service", name: { en: "Municipal service acceleration", ar: "تسريع الخدمات البلدية", zh: "市政服务加速" }, meta: { en: "priority city service portfolio", ar: "محفظة خدمات المدن ذات الأولوية", zh: "优先城市服务组合" }, ceiling: 1.12, need: 0.96, risk: "healthy" },
      { id: "proj-contract", name: { en: "Contract payment plan", ar: "خطة مدفوعات العقود", zh: "合同付款计划" }, meta: { en: "committed delivery claims", ar: "مطالبات التنفيذ الملتزم بها", zh: "已承诺交付索赔" }, ceiling: 0.52, need: 0.59, risk: "tight", target: "plnforecast" },
      { id: "proj-housing", name: { en: "Housing subsidy balance", ar: "موازنة دعم الإسكان", zh: "住房补贴平衡" }, meta: { en: "support model and subsidy impact", ar: "نموذج الدعم وأثر الإعانة", zh: "支持模型与补贴影响" }, ceiling: 0.74, need: 0.79, risk: "tight", target: "plnhousing" },
      { id: "proj-platform", name: { en: "Digital planning platform", ar: "منصة التخطيط الرقمية", zh: "数字规划平台" }, meta: { en: "scenario and reporting tooling", ar: "أدوات السيناريو والتقارير", zh: "情景与报告工具" }, ceiling: 0.31, need: 0.29, risk: "healthy" },
    ],
    service: [
      { id: "srv-urban", name: { en: "Urban services", ar: "الخدمات الحضرية", zh: "城市服务" }, meta: { en: "roads, permits and municipal front office", ar: "الطرق والتصاريح والخدمات الأمامية", zh: "道路、许可和市政前台" }, ceiling: 1.44, need: 1.38, risk: "watch" },
      { id: "srv-housing", name: { en: "Housing support services", ar: "خدمات دعم الإسكان", zh: "住房支持服务" }, meta: { en: "beneficiary support and eligibility", ar: "دعم المستفيدين والأهلية", zh: "受益人支持与资格" }, ceiling: 1.03, need: 1.09, risk: "tight", target: "plnhousing" },
      { id: "srv-project", name: { en: "Project delivery services", ar: "خدمات تنفيذ المشاريع", zh: "项目交付服务" }, meta: { en: "capital delivery and contractor payment", ar: "التنفيذ الرأسمالي ومدفوعات المقاولين", zh: "资本交付与承包商付款" }, ceiling: 1.28, need: 1.22, risk: "watch", target: "plncost" },
      { id: "srv-data", name: { en: "Planning data services", ar: "خدمات بيانات التخطيط", zh: "规划数据服务" }, meta: { en: "forecasting, scenario and control support", ar: "دعم التنبؤ والسيناريو والرقابة", zh: "预测、情景和控制支持" }, ceiling: 0.42, need: 0.34, risk: "healthy" },
    ],
    item: [
      { id: "item-personnel", name: { en: "Personnel item", ar: "بند الأفراد", zh: "人员项目" }, meta: { en: "protected operating item", ar: "بند تشغيلي محمي", zh: "受保护运营项目" }, ceiling: 1.37, need: 1.31, risk: "healthy" },
      { id: "item-contract", name: { en: "Contractual commitments item", ar: "بند الالتزامات التعاقدية", zh: "合同承诺项目" }, meta: { en: "signed obligations and payment plan", ar: "التزامات موقعة وخطة دفع", zh: "已签义务与付款计划" }, ceiling: 1.08, need: 1.17, risk: "tight", target: "plnforecast" },
      { id: "item-capex", name: { en: "Capital project item", ar: "بند المشاريع الرأسمالية", zh: "资本项目科目" }, meta: { en: "cost-driven delivery lines", ar: "بنود تنفيذ مدفوعة بالتكلفة", zh: "成本驱动交付条目" }, ceiling: 1.22, need: 1.14, risk: "watch", target: "plncost" },
      { id: "item-subsidy", name: { en: "Subsidy item", ar: "بند الإعانات", zh: "补贴项目" }, meta: { en: "housing support commitments", ar: "التزامات دعم الإسكان", zh: "住房支持承诺" }, ceiling: 0.86, need: 0.91, risk: "tight", target: "plnhousing" },
    ],
  };
  const postureLift = postureCopy[selectedPosture]?.lift || 0;
  const detailRows = allocationBaseRows[allocationView].map((row) => {
    const proposed = +(row.ceiling + postureLift + (selectedPosture === "control" && row.risk === "tight" ? 0.03 : 0)).toFixed(2);
    const delta = +(proposed - row.need).toFixed(2);
    return {
      ...row,
      proposed,
      delta,
      exclusions: +(proposed * 0.08).toFixed(2),
      commitments: +(row.need * 0.42).toFixed(2),
      payment: +(row.need * 0.22).toFixed(2),
      reserve: +(proposed * reserveRatio / 100).toFixed(2),
      risk: delta < -0.04 ? "tight" : delta < 0.04 ? "watch" : "healthy",
    };
  });
  const totalDelta = +detailRows.reduce((sum, row) => sum + row.delta, 0).toFixed(2);
  const totalApproved = +detailRows.reduce((sum, row) => sum + row.ceiling, 0).toFixed(2);
  const totalProposed = +detailRows.reduce((sum, row) => sum + row.proposed, 0).toFixed(2);
  const totalNeed = +detailRows.reduce((sum, row) => sum + row.need, 0).toFixed(2);
  const totalExclusions = +detailRows.reduce((sum, row) => sum + row.exclusions, 0).toFixed(2);
  const totalCommitments = +detailRows.reduce((sum, row) => sum + row.commitments, 0).toFixed(2);
  const totalPayment = +detailRows.reduce((sum, row) => sum + row.payment, 0).toFixed(2);
  const totalReserve = +detailRows.reduce((sum, row) => sum + row.reserve, 0).toFixed(2);
  const coverageRate = Math.round((totalProposed / Math.max(totalNeed, 0.01)) * 100);
  const riskRows = detailRows.filter((row) => row.risk === "tight").length;
  const positiveRows = detailRows.filter((row) => row.delta >= 0).length;
  const baselineVersion = status === "adopted" ? `BL-${budgetYear}-APP-04` : `BL-${budgetYear}-DRAFT-04`;
  const versionCompare = [
    { label: { en: "Last approved baseline", ar: "آخر خط أساس معتمد", zh: "上一批准基线" }, version: `BL-${Number(budgetYear) - 1}-APP-03`, value: scopeKey === "diwan" ? 1.54 : 2.61, note: { en: "Historical reference", ar: "مرجع تاريخي", zh: "历史参照" } },
    { label: { en: "Current imported ceiling", ar: "السقف المستورد الحالي", zh: "当前导入上限" }, version: `DV-${budgetYear}-06-28-A`, value: fiscalSpace, note: { en: "After exclusions and obligations", ar: "بعد الاستبعادات والالتزامات", zh: "扣除排除项与义务后" } },
    { label: { en: "Selected planning option", ar: "خيار التخطيط المحدد", zh: "已选规划方案" }, version: baselineVersion, value: +(fiscalSpace + postureLift).toFixed(2), note: postureCopy[selectedPosture].title },
  ];
  const gapQueue = [...detailRows]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);
  const impactMatrix = [
    { label: { en: "Fiscal impact", ar: "الأثر المالي", zh: "财政影响" }, value: `${totalDelta >= 0 ? "+" : "-"} SAR ${Math.abs(totalDelta).toFixed(2)}B`, tone: totalDelta >= 0 ? "good" : "bad", note: { en: "Net surplus or deficit after proposed allocation.", ar: "صافي الفائض أو العجز بعد التوزيع المقترح.", zh: "建议分配后的净盈余/缺口。" } },
    { label: { en: "Service coverage", ar: "تغطية الخدمات", zh: "服务覆盖" }, value: `${coverageRate}%`, tone: coverageRate >= 100 ? "good" : "warn", note: { en: "Coverage against assessed needs.", ar: "التغطية مقابل الاحتياجات المقدرة.", zh: "相对评估需求的覆盖率。" } },
    { label: { en: "Lines needing action", ar: "بنود تحتاج إجراء", zh: "需处理预算行" }, value: String(riskRows), tone: riskRows ? "bad" : "good", note: { en: "Deficit lines are highlighted before approval.", ar: "تُبرز بنود العجز قبل الاعتماد.", zh: "审批前突出缺口行。" } },
    { label: { en: "Ready for handoff", ar: "جاهز للتسليم", zh: "可交接" }, value: weightValid ? "Yes" : "No", tone: weightValid ? "good" : "bad", note: { en: "Requires valid weights and traceable source versions.", ar: "يتطلب أوزاناً صحيحة ونسخ مصدر قابلة للتتبع.", zh: "需要有效权重与可追溯来源版本。" } },
  ];
  const transferRecommendations = [
    { key: "balanced", posture: "balanced", title: { en: "Move surplus from priority city services", ar: "نقل الفائض من خدمات المدن ذات الأولوية", zh: "从优先城市服务转移盈余" }, desc: { en: "Use transferable surplus to cover contract payment deficit while keeping service impact below the review threshold.", ar: "استخدام الفائض القابل للتحويل لتغطية عجز مدفوعات العقود مع إبقاء أثر الخدمة دون حد المراجعة.", zh: "使用可转移盈余覆盖合同付款赤字，同时将服务影响保持在复核阈值以下。" }, amount: "SAR 70M" },
    { key: "control", posture: "control", title: { en: "Protect reserve and fund only verified gaps", ar: "حماية الاحتياطي وتمويل الفجوات المتحققة فقط", zh: "保护储备，仅资助已核验缺口" }, desc: { en: "AI raises reserve protection and only releases funding to tight lines with evidence-backed requirements.", ar: "يرفع الذكاء الاصطناعي حماية الاحتياطي ولا يفرج عن التمويل إلا للبنود الضيقة المدعومة بالأدلة.", zh: "AI 提高储备保护，仅向有证据支撑的紧张条目释放资金。" }, amount: "SAR 50M" },
    { key: "growth", posture: "growth", title: { en: "Release capacity for growth priorities", ar: "إتاحة السعة لأولويات النمو", zh: "为增长优先事项释放能力" }, desc: { en: "AI lowers reserve posture and expands proposed allocation for service and capital delivery lines.", ar: "يخفض الذكاء الاصطناعي وضع الاحتياطي ويوسع التوزيع المقترح لبنود الخدمات والتنفيذ الرأسمالي.", zh: "AI 降低储备姿态，并扩大服务与资本交付条目的建议分配。" }, amount: "SAR 110M" },
  ];
  const statusLabel = {
    draft: { en: "Draft", ar: "مسودة", zh: "草稿" },
    in_review: { en: "In review", ar: "قيد المراجعة", zh: "审批中" },
    adopted: { en: "Adopted", ar: "معتمد", zh: "已采纳" },
    returned: { en: "Returned", ar: "مُعاد", zh: "已退回" },
  }[status];
  const updateWeightValue = (key, value) => {
    const clean = Math.max(0, Math.min(100, Number(value || 0)));
    setWeights((prev) => prev.map((item) => item.key === key ? { ...item, value: clean } : item));
    setStatus("draft");
  };
  const choosePosture = (key) => {
    setSelectedPosture(key);
    setSelectedRecommendation(key);
    setReserveRatio(postureCopy[key].reserve);
    setStatus("draft");
  };
  const persistBaseline = (nextStatus) => {
    const versionId = nextStatus === "adopted" ? `BL-${budgetYear}-APP-04` : `BL-${budgetYear}-DRAFT-04`;
    updateGroup02("context", { fiscalYear: budgetYear, scopeType: scopeKey === "diwan" ? "Diwan" : "Secretariat", scopeId: scopeKey === "diwan" ? "DIWAN-ALL" : "SEC-ALL", baselineVersionId: versionId });
    updateGroup02("baseline", { status: nextStatus === "adopted" ? "approved" : nextStatus, versionId, selectedPosture, ceiling: scope.ceiling, exclusions, obligations: commitments, paymentPlan, reserve, fiscalSpace });
  };
  const saveScenario = () => { setStatus("draft"); persistBaseline("draft"); };
  const submitScenario = () => { if (!weightValid) return; setStatus("in_review"); persistBaseline("in_review"); };
  const adoptScenario = () => { if (!weightValid) return; setStatus("adopted"); persistBaseline("adopted"); };
  const returnScenario = () => { setStatus("returned"); persistBaseline("returned"); };
  const routeBaselineTo = (targetRoute) => {
    persistBaseline(status === "adopted" ? "adopted" : "draft");
    setBackRoute("plnbudget");
    setRoute(targetRoute);
  };
  const downstreamUse = (row) => {
    if (row.target === "plncost") return { en: "Project cost review", ar: "مراجعة تكلفة المشروع", zh: "项目成本复核" };
    if (row.target === "plnhousing") return { en: "Housing support impact", ar: "أثر دعم الإسكان", zh: "住房支持影响" };
    if (row.target === "plnforecast") return { en: "Future obligation forecast", ar: "تنبؤ الالتزامات المستقبلية", zh: "未来义务预测" };
    return { en: "Scenario comparison baseline", ar: "خط أساس مقارنة السيناريو", zh: "情景比较基线" };
  };
  const openRow = (row) => {
    if (!row.target) return;
    setBackRoute("plnbudget");
    updateGroup02("context", { focusTarget: `${row.id}` });
    setRoute(row.target);
  };

  return (
    <div className="page bp-console bp-redesign">
      <PageHeader
        title={tr({ en: "Budget Planning & Fiscal Space", ar: "تخطيط الميزانية والحيز المالي", zh: "预算规划与财政空间" })}
        sub={tr({ en: "Turn approved ceilings into an auditable planning baseline, compare AI allocation scenarios, drill into surplus or deficit, then route the selected baseline for review.", ar: "تحويل السقوف المعتمدة إلى خط أساس تخطيطي قابل للتدقيق، ومقارنة سيناريوهات التوزيع الذكية، ثم تفصيل الفائض أو العجز وتمرير الخط المختار للمراجعة.", zh: "将已批准上限转为可审计的规划基线，对比 AI 分配方案，下钻盈余/赤字，并将选定基线提交复核。" })}
        right={<div className="bp-header-side">
          <div className="bp-headactions"><button className="btn ghost sm" onClick={() => setRoute("plnwork")}>← {tr({ en: "Planning Department", ar: "إدارة التخطيط", zh: "规划部" })}</button><button className="btn danger sm" onClick={() => setAlertsOpen(true)}>{tr({ en: "Exception Detection", ar: "اكتشاف الاستثناءات", zh: "异常检测" })}</button></div>
          <G02BusinessStoryline
            tr={tr}
            current="budget"
            output={{ en: `Current: budget baseline ${baselineVersion}`, ar: `الحالي: خط أساس الميزانية ${baselineVersion}` }}
            tags={[
              { en: "Main chain starts here", ar: "تبدأ السلسلة الرئيسية هنا" },
              { en: "Cost and housing are drill-down reviews", ar: "التكلفة والإسكان مراجعات تفصيلية" },
              { en: "Funding forecast next", ar: "تنبؤ التمويل هو التالي" },
            ]}
            navigate={(targetRoute) => {
              if (targetRoute === "plnbudget") return;
              routeBaselineTo(targetRoute);
            }}
          />
        </div>}
      />

      <section className="bp-ai-ready">
        <div className="bp-ai-ready-copy">
          <span>{tr({ en: "AI data preparation", ar: "تحضير البيانات بالذكاء الاصطناعي", zh: "AI 数据准备" })}</span>
          <p>{tr({ en: `AI has prepared FY${budgetYear} financial data and completed the fiscal-space calculation trace, historical version evidence, allocation rule check, and SAP/Etimad execution-signal link.`, ar: `أعد الذكاء الاصطناعي بيانات السنة المالية ${budgetYear} وأكمل مسار احتساب الحيز المالي وأدلة النسخ التاريخية وفحص قواعد التوزيع وربط إشارات التنفيذ من SAP/Etimad.`, zh: `AI 已经准备好 FY${budgetYear} 财务数据，并完成财政空间计算链路、历史版本证据、分配规则校验和 SAP/Etimad 执行信号关联。` })}</p>
        </div>
        <div className="bp-ai-tags">
          {[
            { en: "Calculation trace ready", ar: "مسار الاحتساب جاهز", zh: "计算链路已准备" },
            { en: "Historical versions comparable", ar: "النسخ التاريخية قابلة للمقارنة", zh: "历史版本可对比" },
            { en: "Execution signals linked", ar: "إشارات التنفيذ مرتبطة", zh: "执行信号已关联" },
            { en: "Baseline can be generated", ar: "يمكن إنشاء خط الأساس", zh: "可生成预算基线" },
          ].map((tag) => <em key={tr(tag)}>{tr(tag)}</em>)}
        </div>
      </section>

      <section className="bp-command-bar">
        <label><span>{tr({ en: "Budget year", ar: "سنة الميزانية", zh: "预算年度" })}</span><select value={budgetYear} onChange={(e) => { setBudgetYear(e.target.value); setStatus("draft"); }}>{["2027", "2028", "2029", "2030"].map((year) => <option key={year} value={year}>FY{year}</option>)}</select></label>
        <label><span>{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</span><select value={scopeKey} onChange={(e) => { setScopeKey(e.target.value); setStatus("draft"); }}><option value="secretariat">{tr({ en: "All secretariats", ar: "جميع الأمانات", zh: "所有秘书处" })}</option><option value="diwan">{tr({ en: "Ministry office / Diwan", ar: "مكتب الوزارة / الديوان", zh: "部委办公室 / Diwan" })}</option></select></label>
        <label><span>{tr({ en: "Trigger", ar: "المحفز", zh: "触发原因" })}</span><select value={planningTrigger} onChange={(e) => setPlanningTrigger(e.target.value)}><option value="cycle">{tr({ en: "Budget cycle start", ar: "بدء دورة الميزانية", zh: "预算周期开始" })}</option><option value="reallocation">{tr({ en: "Ceiling reallocation request", ar: "طلب إعادة توزيع السقف", zh: "上限重分配请求" })}</option><option value="gap">{tr({ en: "Significant deficit / surplus", ar: "عجز أو فائض جوهري", zh: "重大赤字 / 盈余" })}</option></select></label>
        <label><span>{tr({ en: "Source", ar: "المصدر", zh: "来源" })}</span><select value={sourceVersion} onChange={(e) => setSourceVersion(e.target.value)}><option value="approved">Hyperion / MTFP</option><option value="notice">{tr({ en: "Budget notification draft", ar: "مسودة إشعار الميزانية", zh: "预算通知草案" })}</option><option value="history">{tr({ en: "Historical approved copy", ar: "نسخة تاريخية معتمدة", zh: "历史批准副本" })}</option></select></label>
        <div className="bp-command-state"><span>{tr({ en: "Baseline", ar: "خط الأساس", zh: "基线" })}</span><b>{tr(statusLabel)}</b></div>
      </section>

      <section className="bp-fiscal-ribbon">
        <div className="bp-fiscal-anchor">
          <span>{tr({ en: "Approved ceiling", ar: "السقف المعتمد", zh: "原始批准上限" })}</span>
          <b>SAR {scope.ceiling.toFixed(2)}B</b>
          <small>Hyperion / MTFP · FY{budgetYear}</small>
        </div>
        <div className="bp-fiscal-chain">
          {[
            [{ en: "Exclusions", ar: "الاستبعادات", zh: "排除项" }, exclusions, "minus"],
            [{ en: "Commitments", ar: "الالتزامات", zh: "承诺义务" }, commitments, "minus"],
            [{ en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }, paymentPlan, "minus"],
            [{ en: "Reserve", ar: "الاحتياطي", zh: "储备" }, reserve, "hold"],
            [{ en: "Fiscal space", ar: "الحيز المالي", zh: "可规划财政空间" }, fiscalSpace, "space"],
          ].map(([label, value, tone]) => (
            <div className={"bp-fiscal-node " + tone} key={tr(label)}>
              <span>{tr(label)}</span>
              <b>SAR {value.toFixed(2)}B</b>
            </div>
          ))}
        </div>
      </section>

      <div className="bp-insight-grid">
        <section className="bp-insight-panel">
          <div className="bp-pain-head compact">
            <div>
              <span>{tr({ en: "Historical versions and current change", ar: "النسخ التاريخية وتغيرات الدورة الحالية", zh: "历史版本与本轮变化" })}</span>
              <h3>{tr({ en: "Compare the previous baseline, imported ceiling, and selected allocation option", ar: "قارن خط الأساس السابق والسقف المستورد وخيار التوزيع المحدد", zh: "对比上一基线、当前导入上限与已选分配方案" })}</h3>
            </div>
          </div>
          <div className="bp-version-lanes">
            {versionCompare.map((item, index) => {
              const prev = index ? versionCompare[index - 1].value : item.value;
              const diff = +(item.value - prev).toFixed(2);
              return (
                <div className="bp-version-card" key={item.version}>
                  <span>{tr(item.label)}</span>
                  <b>SAR {item.value.toFixed(2)}B</b>
                  <small>{item.version}</small>
                  {index > 0 && <em className={diff >= 0 ? "good" : "bad"}>{diff >= 0 ? "+" : "-"} SAR {Math.abs(diff).toFixed(2)}B</em>}
                  <p>{typeof item.note === "string" ? item.note : tr(item.note)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bp-insight-panel">
          <div className="bp-pain-head compact">
            <div>
              <span>{tr({ en: "Surplus and deficit queue", ar: "قائمة الفائض والعجز", zh: "盈余与缺口队列" })}</span>
              <h3>{tr({ en: "Lines that need attention before approval", ar: "بنود تحتاج الانتباه قبل الاعتماد", zh: "审批前需关注的预算行" })}</h3>
            </div>
          </div>
          <div className="bp-gap-list">
            {gapQueue.map((row) => {
              const rowRisk = budgetRiskMeta(row.risk, tr);
              return (
                <button key={row.id} className={"bp-gap-row " + (row.delta >= 0 ? "good" : "bad")} onClick={() => openRow(row)}>
                  <div>
                    <b>{tr(row.name)}</b>
                    <span>{tr(row.meta)}</span>
                  </div>
                  <strong>{row.delta >= 0 ? "+" : "-"} SAR {Math.abs(row.delta).toFixed(2)}B</strong>
                  <em className={rowRisk.cls}>{rowRisk.text}</em>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="bp-impact-heading">
        <span>{tr({ en: "Impact before approval", ar: "الأثر قبل الاعتماد", zh: "审批前影响分析" })}</span>
        <p>{tr({ en: "AI summarizes the selected allocation option before it is saved as the budget baseline.", ar: "يلخص الذكاء الاصطناعي خيار التوزيع المحدد قبل حفظه كخط أساس للميزانية.", zh: "AI 在保存为预算基线前汇总当前分配方案的影响。" })}</p>
      </div>
      <section className="bp-impact-panel">
        {impactMatrix.map((item) => (
          <div className={"bp-impact-card " + item.tone} key={tr(item.label)}>
            <span>{tr(item.label)}</span>
            <b>{item.value}</b>
            <p>{tr(item.note)}</p>
          </div>
        ))}
      </section>

      <section className="bp-handoff-card">
        <div className="bp-handoff-main">
          <span>{tr({ en: "Budget baseline output", ar: "مخرج خط أساس الميزانية", zh: "预算基线输出" })}</span>
          <b>{baselineVersion}</b>
          <p>{tr({ en: "This version becomes the capacity input for funding forecasts and the baseline input for scenario comparison.", ar: "تصبح هذه النسخة مدخل السعة لتنبؤ التمويل ومدخل خط الأساس لمقارنة السيناريوهات.", zh: "该版本作为资金预测的能力输入，并作为情景比较的基线输入。" })}</p>
          <div className="bp-handoff-tags">
            <em>{tr({ en: "Feeds funding forecast", ar: "يدخل تنبؤ التمويل", zh: "进入资金预测" })}</em>
            <em>{tr({ en: "Feeds scenario comparison", ar: "يدخل مقارنة السيناريو", zh: "进入情景比较" })}</em>
          </div>
        </div>
        {[
          [{ en: "Allocation option", ar: "خيار التوزيع", zh: "分配方案" }, postureCopy[selectedPosture].title],
          [{ en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" }, `SAR ${fiscalSpace.toFixed(2)}B`],
          [{ en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "储备比例" }, `${reserveRatio}%`],
          [{ en: "Deficit lines", ar: "بنود العجز", zh: "缺口预算行" }, `${riskRows}`],
        ].map(([label, value]) => (
          <div className="bp-handoff-metric" key={tr(label)}>
            <span>{tr(label)}</span>
            <b>{typeof value === "string" ? value : tr(value)}</b>
          </div>
        ))}
      </section>

      <section className="bp-planning-shell">
        <aside className="bp-decision-rail">
          <div className="bp-rail-head">
            <span>{tr({ en: "AI planning options", ar: "خيارات التخطيط الذكية", zh: "AI 规划方案" })}</span>
            <b>{tr(postureCopy[selectedPosture].title)}</b>
          </div>
          <div className="bp-option-stack">
            {transferRecommendations.map((item) => (
              <button className={"bp-option-card " + (selectedRecommendation === item.key ? "on" : "")} key={item.key} onClick={() => choosePosture(item.posture)}>
                <span>{tr(postureCopy[item.posture].title)}</span>
                <strong>{item.amount}</strong>
              </button>
            ))}
          </div>
          <div className="bp-side-params">
            <div className="bp-side-title">
              <span>{tr({ en: "Planning parameters", ar: "معايير التخطيط", zh: "规划参数" })}</span>
            </div>
            <label className="bp-side-select"><span>{tr({ en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "储备比例" })}</span><select value={reserveRatio} onChange={(e) => { setReserveRatio(Number(e.target.value)); setStatus("draft"); }}><option value={8}>8% · growth</option><option value={10}>10% · default</option><option value={12}>12% · control</option></select></label>
            <div className="bp-side-weights">
              {weights.map((item) => <label key={item.key}><span>{tr(item.label)}</span><input type="number" min="0" max="100" value={item.value} onChange={(e) => updateWeightValue(item.key, e.target.value)} /></label>)}
            </div>
            <div className={"bp-side-total " + (weightValid ? "ok" : "bad")}><span>{tr({ en: "Weight total", ar: "مجموع الأوزان", zh: "权重合计" })}</span><b>{weightTotal}%</b></div>
            <div className="bp-side-note"><span>{tr({ en: "Unclassified", ar: "غير مصنف", zh: "未分类" })}</span><b>SAR {unclassified.toFixed(2)}B</b></div>
          </div>
        </aside>

        <main className="bp-stage-board">
          <div className="bp-stage-toolbar">
            <div>
              <span>{tr({ en: "Budget allocation stage", ar: "منصة توزيع الميزانية", zh: "预算分配舞台" })}</span>
              <h3>{tr(allocationLabel)}</h3>
            </div>
            <div className="bp-stage-tabs">{allocationViews.map(([key, label]) => <button key={key} className={allocationView === key ? "on" : ""} onClick={() => setAllocationView(key)}>{tr(label)}</button>)}</div>
          </div>

          <div className="bp-review-table">
            <div className="bp-review-head">
              <div><span>{tr({ en: "Review details", ar: "تفاصيل المراجعة", zh: "审查明细" })}</span><b>{tr({ en: "Approved ceiling allocation review", ar: "مراجعة توزيع السقف المعتمد", zh: "批准上限分配审查" })}</b></div>
              <small>{tr(postureCopy[selectedPosture].title)} · {coverageRate}% {tr({ en: "covered", ar: "تغطية", zh: "覆盖" })} · {riskRows} {tr({ en: "tight", ar: "ضيقة", zh: "紧张" })}</small>
            </div>
            <div className="bp-tablewrap">
              <table className="tbl bp-table">
                <thead><tr><th>{tr(allocationLabel)}</th><th>{tr({ en: "Scenario status", ar: "حالة السيناريو", zh: "方案状态" })}</th><th>{tr({ en: "Approved ceiling", ar: "السقف المعتمد", zh: "批准上限" })}</th><th>{tr({ en: "Need", ar: "الاحتياج", zh: "需求" })}</th><th>{tr({ en: "Coverage", ar: "التغطية", zh: "覆盖率" })}</th><th>{tr({ en: "Exclusions", ar: "الاستبعادات", zh: "排除项" })}</th><th>{tr({ en: "Commitments", ar: "الالتزامات", zh: "承诺" })}</th><th>{tr({ en: "Payment", ar: "الدفع", zh: "付款" })}</th><th>{tr({ en: "Reserve", ar: "الاحتياطي", zh: "储备" })}</th><th>{tr({ en: "Surplus / deficit", ar: "الفائض / العجز", zh: "盈余 / 赤字" })}</th><th>{tr({ en: "Used by downstream", ar: "الاستخدام اللاحق", zh: "下游用途" })}</th><th>{tr({ en: "Risk", ar: "المخاطر", zh: "风险" })}</th></tr></thead>
                <tbody>{detailRows.map((row) => {
                  const rowRisk = budgetRiskMeta(row.risk, tr);
                  const rowCoverage = Math.round((row.proposed / Math.max(row.need, 0.01)) * 100);
                  return <tr key={row.id} onClick={() => openRow(row)} className={row.target ? "bp-row-clickable" : ""}><td><div className="bp-table-main">{tr(row.name)}</div><div className="bp-table-sub">{tr(row.meta)}</div></td><td><div className="bp-table-main">{tr(postureCopy[selectedPosture].title)}</div><div className="bp-table-sub">{row.target ? tr({ en: "Drill available", ar: "التفصيل متاح", zh: "可下钻" }) : tr({ en: "Review line", ar: "بند مراجعة", zh: "审查条目" })}</div></td><td>SAR {row.ceiling.toFixed(2)}B</td><td>SAR {row.need.toFixed(2)}B</td><td>{rowCoverage}%</td><td>SAR {row.exclusions.toFixed(2)}B</td><td>SAR {row.commitments.toFixed(2)}B</td><td>SAR {row.payment.toFixed(2)}B</td><td>SAR {row.reserve.toFixed(2)}B</td><td><span className={"bp-balance " + (row.delta >= 0 ? "good" : "bad")}>{row.delta >= 0 ? "+" : "-"} SAR {Math.abs(row.delta).toFixed(2)}B</span></td><td><span className="bp-downstream-use">{tr(downstreamUse(row))}</span></td><td><span className={"bp-risk " + rowRisk.cls}>{rowRisk.text}</span></td></tr>;
                })}</tbody>
                <tfoot><tr className="bp-total-row"><td>{tr({ en: "Total", ar: "الإجمالي", zh: "合计" })}</td><td>{tr(statusLabel)}</td><td>SAR {totalApproved.toFixed(2)}B</td><td>SAR {totalNeed.toFixed(2)}B</td><td>{coverageRate}%</td><td>SAR {totalExclusions.toFixed(2)}B</td><td>SAR {totalCommitments.toFixed(2)}B</td><td>SAR {totalPayment.toFixed(2)}B</td><td>SAR {totalReserve.toFixed(2)}B</td><td><span className={"bp-balance " + (totalDelta >= 0 ? "good" : "bad")}>{totalDelta >= 0 ? "+" : "-"} SAR {Math.abs(totalDelta).toFixed(2)}B</span></td><td>{tr({ en: "Baseline handoff", ar: "تسليم خط الأساس", zh: "基线交接" })}</td><td>{riskRows} {tr({ en: "tight", ar: "ضيقة", zh: "紧张" })}</td></tr></tfoot>
              </table>
            </div>
          </div>
        </main>
      </section>

      <div className="bp-console-actions bp-action-dock">
        <div><b>{tr(postureCopy[selectedPosture].title)}</b><span>{weightValid ? tr({ en: "This selected scenario can be saved, submitted, approved or routed to downstream planning pages.", ar: "يمكن حفظ هذا السيناريو المختار أو إرساله أو اعتماده أو تمريره إلى صفحات التخطيط اللاحقة.", zh: "当前选中方案可以保存、提交、批准或传递到下游规划页面。" }) : tr({ en: "Weight total must equal 100 percent before review submission.", ar: "يجب أن يساوي مجموع الأوزان 100٪ قبل الإرسال للمراجعة.", zh: "提交审批前权重合计必须等于 100%。" })}</span></div>
        <div className="bp-approval-actions">
          <button className="btn ghost sm" onClick={saveScenario}>{tr({ en: "Save draft", ar: "حفظ المسودة", zh: "保存草稿" })}</button>
          <button className="btn secondary sm" disabled={!weightValid} onClick={submitScenario}>{tr({ en: "Submit for review", ar: "إرسال للمراجعة", zh: "提交审批" })}</button>
          <button className="btn sm" disabled={!weightValid} onClick={adoptScenario}>{tr({ en: "Approve baseline", ar: "اعتماد خط الأساس", zh: "批准基线" })}</button>
          <button className="btn ghost sm" onClick={returnScenario}>{tr({ en: "Return", ar: "إرجاع", zh: "退回" })}</button>
          <button className="btn ghost sm" onClick={() => routeBaselineTo("plnscenario")}>{tr({ en: `Use ${baselineVersion} for scenario comparison`, ar: `استخدم ${baselineVersion} لمقارنة السيناريوهات`, zh: `将 ${baselineVersion} 用于情景比较` })}</button>
          <button className="btn ghost sm" onClick={() => routeBaselineTo("plnforecast")}>{tr({ en: `Send ${baselineVersion} to funding forecast`, ar: `إرسال ${baselineVersion} إلى تنبؤ التمويل`, zh: `发送 ${baselineVersion} 到资金预测` })}</button>
        </div>
      </div>

    </div>
  );
}

const G04_PROCESS_STEPS = [
  { code: "UC-01", key: "data", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" } },
  { code: "UC-08", key: "claims", label: { en: "Claims & entitlements", ar: "المطالبات والاستحقاقات", zh: "索赔与权益" } },
  { code: "UC-02", key: "alerts", label: { en: "Exception review", ar: "مراجعة الاستثناءات", zh: "异常复核" } },
  { code: "UC-09", key: "close", label: { en: "Closing & settlement", ar: "الإقفال والتسوية", zh: "关账与结算" } },
  { code: "UC-10", key: "reports", label: { en: "Reports", ar: "التقارير", zh: "报告" } },
  { code: "UC-03", key: "query", label: { en: "Smart query & audit", ar: "الاستعلام والتدقيق", zh: "智能查询与审计" } },
];
const G04_CLAIM_ROWS = [
  { id: "CLM-3411", pay: "PAY-2026-1184", contract: "CTR-2025-8821", po: "PO-66019", status: "incomplete", reasons: ["Missing completion certificate for phase 2", "Quantity plan variance exceeds tolerance"], cert: "Completion_Cert_Ph2_missing.pdf", plan: 72, amount: 86, penalty: 12, suggestion: "return", returnReason: "", owner: "Claims officer", details: ["Phase 2 certificate not attached", "Executed quantity 72% vs planned 91%", "Penalty clause 4.2 applies pending evidence"] },
  { id: "CLM-3398", pay: "PAY-2026-1179", contract: "CTR-2024-7710", po: "PO-64044", status: "audit", reasons: ["Contract value and invoice value need review", "Late delivery deduction pending"], cert: "Completion_Cert_North_Corridor.pdf", plan: 88, amount: 52, penalty: 6, suggestion: "escalate", returnReason: "", owner: "Compliance reviewer", details: ["Invoice amount differs from purchase order by SAR 4M", "Late delivery deduction has not been posted", "Escalation required for rule interpretation"] },
  { id: "CLM-3372", pay: "PAY-2026-1162", contract: "CTR-2025-6922", po: "PO-63021", status: "approved", reasons: ["Evidence complete", "Quantity plan matched"], cert: "Completion_Cert_West_Service.pdf", plan: 100, amount: 41, penalty: 0, suggestion: "approve", returnReason: "", owner: "Entitlements lead", details: ["Completion certificate attached", "Executed quantity matches approved plan", "No penalty or deduction"] },
  { id: "CLM-3357", pay: "PAY-2026-1150", contract: "CTR-2025-6518", po: "PO-62117", status: "new", reasons: ["New claim awaiting first review", "Beneficiary bank confirmation pending"], cert: "Completion_Cert_Digital_Permit.pdf", plan: 64, amount: 33, penalty: 2, suggestion: "complete", returnReason: "", owner: "Payment operations", details: ["Initial claim package received", "Completion evidence exists but beneficiary confirmation is pending", "System recommends completing missing bank confirmation"] },
];
const G04_CLOSE_ROWS = [
  { id: "CLS-Q2-001", period: "FY2026 Q2", type: "Quarter close", account: "All accounts", validation: "exceptions", checklist: ["Missing entries: 3 payment orders", "Abnormal balances: contractor advances", "Unsettled invoices: 7"], contractAmount: 420, invoiceAmount: 411, paymentAmount: 398, diffType: "timing", pending: ["PAY-2026-1184", "PAY-2026-1179", "PAY-2026-1162"], settlement: ["Post timing adjustment SAR 13M", "Hold 2 claims for evidence", "Route exception list to audit"], monthlyPlan: ["Jul: close evidence gaps", "Aug: release approved batch", "Sep: finalize quarter narrative"], finalAccount: ["Assets payable SAR 398M", "Accrued liability SAR 13M", "Disclosure note required"], owner: "Closing lead" },
  { id: "CLS-M06-014", period: "June FY2026", type: "Monthly settlement", account: "Contract payables", validation: "clean", checklist: ["No missing entries", "No abnormal balances", "2 invoices pending normal cutoff"], contractAmount: 188, invoiceAmount: 188, paymentAmount: 181, diffType: "async source", pending: ["PAY-2026-1138", "PAY-2026-1141"], settlement: ["Adopt monthly settlement", "Carry two cutoff invoices to next period"], monthlyPlan: ["Week 1: payment release", "Week 2: cutoff confirmation", "Week 4: management report"], finalAccount: ["Payables SAR 181M", "Cutoff SAR 7M"], owner: "Settlement analyst" },
  { id: "CLS-H1-009", period: "FY2026 H1", type: "Half-year close", account: "Revenue & claims", validation: "warning", checklist: ["Missing entries: 1 revenue claim", "Abnormal balances: none", "Unsettled invoices: 4"], contractAmount: 270, invoiceAmount: 263, paymentAmount: 258, diffType: "input error", pending: ["PAY-2026-1103", "PAY-2026-1112", "PAY-2026-1127", "PAY-2026-1130"], settlement: ["Correct input mismatch SAR 5M", "Adopt settlement after correction"], monthlyPlan: ["Month 1: correct mismatch", "Month 2: verify claims", "Month 3: final account package"], finalAccount: ["Receivable adjustment SAR 5M", "Claim payable SAR 258M"], owner: "Financial controller" },
];
function G04ProcessFlow({ focus }) {
  const { tr } = useStore();
  return (
    <div className="g04-process">
      <div className="bp-flow-title">{tr({ en: "Financial Entitlements storyline", ar: "مسار الاستحقاقات المالية", zh: "财务权益链路" })}</div>
      {G04_PROCESS_STEPS.map((step, idx) => <div className={"bp-flow-pill " + (step.key === focus ? "active" : idx < G04_PROCESS_STEPS.findIndex(s => s.key === focus) ? "done" : "next")} key={step.key}><span>{idx + 1}</span><b>{SHOW_UC ? step.code + " · " : ""}{tr(step.label)}</b></div>)}
    </div>
  );
}
function G04InfoModal({ title, lines, onClose }) {
  const { tr } = useStore();
  if (!lines) return null;
  return createPortal(<div className="g04-modal-backdrop" onClick={onClose}>
    <div className="g04-modal" onClick={(e) => e.stopPropagation()}>
      <div className="g04-modal-head"><b>{title}</b><button className="pz-x" onClick={onClose}>✕</button></div>
      <div className="g04-modal-body">{lines.map((line, idx) => <div className="g04-check" key={idx}><span>{idx + 1}</span><p>{typeof line === "string" ? line : tr(line)}</p></div>)}</div>
    </div>
  </div>, document.body);
}
function G04ReportDrawer({ report, onClose, onAccept, onReject }) {
  const { tr } = useStore();
  if (!report) return null;
  const isClaim = report.kind === "claim";
  const row = report.row;
  const ref = isClaim ? row : report;
  const title = isClaim ? tr({ en: "System recommendation report", ar: "تقرير توصية النظام", zh: "系统建议报告" }) : tr(report.title);
  const lines = isClaim
    ? [
        { label: { en: "Reason list", ar: "قائمة الأسباب", zh: "理由清单" }, value: row.reasons.join(" / ") },
        { label: { en: "Completion certificate", ar: "شهادة الإنجاز", zh: "完工证书" }, value: row.cert },
        { label: { en: "Quantity plan", ar: "خطة الكميات", zh: "数量计划" }, value: row.plan + "% matched" },
        { label: { en: "Claim amount", ar: "مبلغ المطالبة", zh: "索赔金额" }, value: "SAR " + row.amount + "M" },
        { label: { en: "Penalty / deduction", ar: "الغرامة / الخصم", zh: "罚款和扣款" }, value: "SAR " + row.penalty + "M" },
      ]
    : report.lines.map((value, idx) => ({ label: { en: "Recommendation " + (idx + 1), ar: "توصية " + (idx + 1), zh: "建议 " + (idx + 1) }, value }));
  return createPortal(<div className="g04-drawer-backdrop" onClick={onClose}>
    <aside className="g04-report-drawer" onClick={(e) => e.stopPropagation()}>
      <div className="g04-modal-head"><b>{title}</b><button className="pz-x" onClick={onClose}>✕</button></div>
      <div className="g04-report-kicker">{isClaim ? ref.id + " · " + ref.pay : ref.id + " · " + ref.period}</div>
      <div className="g04-report-summary">
        {lines.map((item, idx) => <div key={idx}><span>{tr(item.label)}</span><b>{item.value}</b></div>)}
      </div>
      <div className="g04-report-note">
        <b>{tr({ en: "AI basis", ar: "أساس الذكاء الاصطناعي", zh: "AI 依据" })}</b>
        <p>{isClaim ? tr({ en: "The recommendation is generated from justification evidence, completion certificate, quantity-plan match, claim amount and penalty/deduction rules. Human review decides whether to accept the recommendation.", ar: "تُولّد التوصية من أدلة المبررات وشهادة الإنجاز ومطابقة خطة الكميات ومبلغ المطالبة وقواعد الغرامات والخصومات. تحدد المراجعة البشرية قبول التوصية.", zh: "建议基于理由证据、完工证书、数量计划匹配、索赔金额和罚款扣款规则生成，人工复核决定是否采纳。" }) : tr({ en: "The settlement report summarizes validation checklist, source differences, pending payment orders and proposed accounting action for human approval.", ar: "يلخص تقرير التسوية قائمة التحقق وفروق المصادر وأوامر الدفع المعلقة والإجراء المحاسبي المقترح للاعتماد البشري.", zh: "结算报告汇总验证清单、来源差异、待处理付款订单和建议会计动作，供人工批准。" })}</p>
      </div>
      <div className="g04-report-actions">
        <button className="btn ghost sm" onClick={onReject}>{tr({ en: "Reject / return", ar: "رفض / إرجاع", zh: "不认可 / 退回" })}</button>
        <button className="btn sm" onClick={onAccept}>{tr({ en: "Accept recommendation", ar: "قبول التوصية", zh: "认可建议" })}</button>
      </div>
    </aside>
  </div>, document.body);
}
function EntitlementsClaimsPage() {
  const { tr, setRoute, setDeptSub, setBackRoute, pushLog, setAlertsOpen } = useStore();
  const [claimQuery, setClaimQuery] = useState("");
  const [payQuery, setPayQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [report, setReport] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returned, setReturned] = useState({});
  const [reviews, setReviews] = useState({});
  const rows = G04_CLAIM_ROWS.filter(row => (!claimQuery || row.id.toLowerCase().includes(claimQuery.toLowerCase())) && (!payQuery || row.pay.toLowerCase().includes(payQuery.toLowerCase())));
  const goBack = () => { setRoute("entwork"); };
  const confirmReturn = () => {
    if (!returnTarget) return;
    const reason = returnReason.trim() || tr({ en: "Returned for evidence correction.", ar: "أُعيد لتصحيح الأدلة.", zh: "退回补正证据。" });
    setReturned(prev => ({ ...prev, [returnTarget.id]: reason }));
    pushLog({ en: "Claim returned for correction — " + returnTarget.id, ar: "أُعيدت المطالبة للتصحيح — " + returnTarget.id, zh: "索赔已退回补正 — " + returnTarget.id });
    setReturnTarget(null); setReturnReason("");
  };
  const setReview = (id, value) => { setReviews(prev => ({ ...prev, [id]: value })); pushLog({ en: "System recommendation review updated — " + id + " · " + value, ar: "تم تحديث مراجعة توصية النظام — " + id, zh: "系统建议人工审核已更新 — " + id + " · " + value }); setReport(null); };
  const statusLabel = (status) => ({ new: { en: "New", ar: "جديد", zh: "新建" }, audit: { en: "In audit", ar: "قيد التدقيق", zh: "审计中" }, incomplete: { en: "Incomplete", ar: "غير مكتمل", zh: "不完整" }, approved: { en: "Approved", ar: "معتمد", zh: "已批准" }, reviewed: { en: "Reviewed", ar: "تمت المراجعة", zh: "已审查" } }[status] || { en: status, ar: status, zh: status });
  return <div className="page g04-page">
    <PageHeader title={tr({ en: "Contracts, Claims, Disbursements and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、支付和权益" })} sub={tr({ en: "Review claim packages, evidence, quantity-plan matching and system recommendations before disbursement.", ar: "مراجعة حزم المطالبات والأدلة ومطابقة خطة الكميات وتوصيات النظام قبل الصرف.", zh: "在拨付前复核索赔包、证据、数量计划匹配和系统建议。" })} right={<div className="bp-headactions"><button className="btn ghost" onClick={goBack}>← {tr({ en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" })}</button><button className="btn secondary" onClick={() => setAlertsOpen(true)}>{tr({ en: "Exception Center", ar: "مركز الاستثناءات", zh: "异常中心" })}</button></div>} />
    <G04ProcessFlow focus="claims" />
    <section className="g04-filterbar">
      <label><span>{tr({ en: "Claim number", ar: "رقم المطالبة", zh: "索赔编号" })}</span><input value={claimQuery} onChange={e => setClaimQuery(e.target.value)} placeholder="CLM-3411" /></label>
      <label><span>{tr({ en: "Payment order number", ar: "رقم أمر الدفع", zh: "付款订单编号" })}</span><input value={payQuery} onChange={e => setPayQuery(e.target.value)} placeholder="PAY-2026-1184" /></label>
      <div className="g04-filter-state"><span>{tr({ en: "Visible claims", ar: "المطالبات الظاهرة", zh: "当前索赔" })}</span><b>{rows.length}</b></div>
    </section>
    <section className="g04-kpis">
      <div className="bp-console-kpi accent"><span>{tr({ en: "Active claims", ar: "مطالبات نشطة", zh: "在办索赔" })}</span><b>42</b><small>{tr({ en: "18 pending disbursement", ar: "18 بانتظار الصرف", zh: "18 笔待拨付" })}</small></div>
      <div className="bp-console-kpi"><span>{tr({ en: "Net due", ar: "صافي المستحق", zh: "净应付" })}</span><b>SAR 320M</b><small>{tr({ en: "verified claim amount", ar: "مبلغ المطالبات المتحقق", zh: "已核验索赔金额" })}</small></div>
      <div className="bp-console-kpi warn"><span>{tr({ en: "Evidence gaps", ar: "فجوات الأدلة", zh: "证据缺口" })}</span><b>5</b><small>{tr({ en: "2 missing completion certificates", ar: "شهادتا إنجاز مفقودتان", zh: "2 个完工证明缺失" })}</small></div>
      <div className="bp-console-kpi"><span>{tr({ en: "System recommendations", ar: "توصيات النظام", zh: "系统建议" })}</span><b>{Object.keys(reviews).length}/4</b><small>{tr({ en: "human review updates", ar: "تحديثات مراجعة بشرية", zh: "人工审核更新" })}</small></div>
    </section>
    <section className="g04-grid">
      <div className="bp-console-panel g04-main-panel">
        <div className="g04-panel-head"><div><span>{tr({ en: "Claim worklist", ar: "قائمة المطالبات", zh: "索赔列表" })}</span><b>{tr({ en: "Evidence, quantity and recommendation review", ar: "مراجعة الأدلة والكميات والتوصيات", zh: "证据、数量与建议复核" })}</b></div></div>
        <div className="bp-tablewrap g04-tablewrap"><table className="tbl bp-table g04-table">
          <thead><tr><th>{tr({ en: "Claim", ar: "المطالبة", zh: "索赔" })}</th><th>{tr({ en: "Payment order", ar: "أمر الدفع", zh: "付款订单" })}</th><th>{tr({ en: "Contract / PO", ar: "العقد / أمر الشراء", zh: "合同 / 采购订单" })}</th><th>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</th><th>{tr({ en: "Reason list", ar: "قائمة الأسباب", zh: "理由清单" })}</th><th>{tr({ en: "Completion certificate", ar: "شهادة الإنجاز", zh: "完工证书" })}</th><th>{tr({ en: "Quantity plan", ar: "خطة الكميات", zh: "数量计划" })}</th><th>{tr({ en: "Amount", ar: "المبلغ", zh: "金额" })}</th><th>{tr({ en: "Penalty / deduction", ar: "غرامة / خصم", zh: "罚款 / 扣款" })}</th><th>{tr({ en: "System recommendation", ar: "توصية النظام", zh: "系统建议" })}</th><th>{tr({ en: "Return reason", ar: "سبب الإرجاع", zh: "退回原因" })}</th><th>{tr({ en: "Action", ar: "الإجراء", zh: "操作" })}</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}><td><div className="bp-table-main">{row.id}</div><div className="bp-table-sub">{row.owner}</div></td><td>{row.pay}</td><td><div className="bp-table-main">{row.contract}</div><div className="bp-table-sub">{row.po}</div></td><td><span className={"g04-status " + row.status}>{tr(statusLabel(row.status))}</span></td><td><button className="g04-link" onClick={() => setModal({ title: row.id + " · " + tr({ en: "Reason list", ar: "قائمة الأسباب", zh: "理由清单" }), lines: row.reasons })}>{row.reasons.length} {tr({ en: "items", ar: "بنود", zh: "项" })}</button></td><td><button className="g04-link" onClick={() => setModal({ title: row.cert, lines: [tr({ en: "Completion certificate preview is available in the approved document repository.", ar: "معاينة شهادة الإنجاز متاحة في مستودع الوثائق المعتمد.", zh: "可在已批准文档库中预览完工证书。" }), row.cert] })}>{row.cert}</button></td><td><button className="g04-link" onClick={() => setModal({ title: row.id + " · " + tr({ en: "Quantity plan match", ar: "مطابقة خطة الكميات", zh: "数量计划匹配" }), lines: [`Planned quantity match: ${row.plan}%`, ...row.details] })}>{row.plan}%</button></td><td>SAR {row.amount}M</td><td>SAR {row.penalty}M</td><td><button className="g04-link strong" onClick={() => setReport({ kind: "claim", row })}>{tr({ approve: { en: "Approve", ar: "اعتماد", zh: "批准" }, return: { en: "Return", ar: "إرجاع", zh: "退回" }, complete: { en: "Complete", ar: "استكمال", zh: "完成" }, escalate: { en: "Escalate", ar: "تصعيد", zh: "上报" } }[row.suggestion])}{reviews[row.id] ? " · " + reviews[row.id] : ""}</button></td><td>{returned[row.id] || row.returnReason || "—"}</td><td><button className="btn ghost sm" onClick={() => setReturnTarget(row)}>{tr({ en: "Return correction", ar: "إرجاع للتصحيح", zh: "退回更正" })}</button></td></tr>)}</tbody>
        </table></div>
      </div>
      <aside className="bp-console-panel g04-agent-panel"><div className="g04-panel-head"><div><span>{tr({ en: "Multi-agent workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</span><b>{tr({ en: "Claim verification agents", ar: "وكلاء تحقق المطالبات", zh: "索赔核验智能体" })}</b></div></div><div className="g04-agent-list">{[
        ["Etimad / SAP", { en: "Contracts, payment orders and invoice evidence", ar: "العقود وأوامر الدفع وأدلة الفواتير", zh: "合同、付款订单与发票证据" }],
        ["Orchestrator Agent", { en: "Routes claim review and human approval tasks", ar: "يوجه مراجعة المطالبات ومهام الاعتماد البشري", zh: "编排索赔复核和人工审批任务" }],
        ["Compliance / Rules Agent", { en: "Checks completion certificates, deductions and reason lists", ar: "يفحص شهادات الإنجاز والخصومات وقوائم الأسباب", zh: "校验完工证书、扣款与理由清单" }],
        ["Anomaly Detection Agent", { en: "Flags missing evidence and quantity-plan differences", ar: "يرصد الأدلة الناقصة وفروق خطة الكميات", zh: "标记缺证和数量计划差异" }],
      ].map(([name, desc]) => <div className="g04-agent" key={name}><b>{name}</b><span>{tr(desc)}</span></div>)}</div></aside>
    </section>
    <G04InfoModal title={modal?.title} lines={modal?.lines} onClose={() => setModal(null)} />
    <G04ReportDrawer report={report} onClose={() => setReport(null)} onAccept={() => setReview(report.row.id, "accepted")} onReject={() => setReview(report.row.id, "returned")} />
    {returnTarget && createPortal(<div className="g04-modal-backdrop" onClick={() => setReturnTarget(null)}><div className="g04-modal" onClick={(e) => e.stopPropagation()}><div className="g04-modal-head"><b>{tr({ en: "Confirm return correction", ar: "تأكيد الإرجاع للتصحيح", zh: "确认退回更正" })}</b><button className="pz-x" onClick={() => setReturnTarget(null)}>✕</button></div><p className="g04-confirm-text">{returnTarget.id} · {tr({ en: "This will return the claim application and record the return reason.", ar: "سيؤدي هذا إلى إرجاع طلب المطالبة وتسجيل سبب الإرجاع.", zh: "这会退回索赔申请并记录退回原因。" })}</p><textarea className="g04-textarea" value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder={tr({ en: "Return reason", ar: "سبب الإرجاع", zh: "退回原因" })} /><div className="g04-report-actions"><button className="btn ghost sm" onClick={() => setReturnTarget(null)}>{tr({ en: "Cancel", ar: "إلغاء", zh: "取消" })}</button><button className="btn sm" onClick={confirmReturn}>{tr({ en: "Confirm return", ar: "تأكيد الإرجاع", zh: "确认退回" })}</button></div></div></div>, document.body)}
  </div>;
}
function FinancialCloseSettlementsPage() {
  const { tr, setRoute, setDeptSub, pushLog, setAlertsOpen } = useStore();
  const [period, setPeriod] = useState("all");
  const [type, setType] = useState("all");
  const [account, setAccount] = useState("all");
  const [modal, setModal] = useState(null);
  const [report, setReport] = useState(null);
  const [adopted, setAdopted] = useState({});
  const rows = G04_CLOSE_ROWS.filter(row => (period === "all" || row.period === period) && (type === "all" || row.type === type) && (account === "all" || row.account === account));
  const goBack = () => { setRoute("entwork"); };
  const adopt = (row) => { setAdopted(prev => ({ ...prev, [row.id]: true })); pushLog({ en: "Settlement adopted — " + row.id, ar: "تم اعتماد التسوية — " + row.id, zh: "已采纳结算 — " + row.id }); };
  const openReport = (row, title, lines) => setReport({ kind: "close", id: row.id, period: row.period, title, lines });
  return <div className="page g04-page">
    <PageHeader title={tr({ en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务结算、对账和清算" })} sub={tr({ en: "Validate pre-close checklist, reconcile SAP and Etimad differences, inspect payment orders and adopt settlement recommendations.", ar: "التحقق من قائمة ما قبل الإقفال ومطابقة فروق ساب واعتماد وفحص أوامر الدفع واعتماد توصيات التسوية.", zh: "校验关账前清单、对账 SAP 与 Etimad 差异、查看付款订单并采纳建议结算。" })} right={<div className="bp-headactions"><button className="btn ghost" onClick={goBack}>← {tr({ en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" })}</button><button className="btn secondary" onClick={() => setAlertsOpen(true)}>{tr({ en: "Exception Center", ar: "مركز الاستثناءات", zh: "异常中心" })}</button></div>} />
    <G04ProcessFlow focus="close" />
    <section className="g04-filterbar">
      <label><span>{tr({ en: "Fiscal period", ar: "الفترة المالية", zh: "财务期间" })}</span><select value={period} onChange={e => setPeriod(e.target.value)}><option value="all">{tr({ en: "All", ar: "الكل", zh: "全部" })}</option>{[...new Set(G04_CLOSE_ROWS.map(r => r.period))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label><span>{tr({ en: "Settlement type", ar: "نوع التسوية", zh: "结算类型" })}</span><select value={type} onChange={e => setType(e.target.value)}><option value="all">{tr({ en: "All", ar: "الكل", zh: "全部" })}</option>{[...new Set(G04_CLOSE_ROWS.map(r => r.type))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label><span>{tr({ en: "Account scope", ar: "نطاق الحساب", zh: "账户范围" })}</span><select value={account} onChange={e => setAccount(e.target.value)}><option value="all">{tr({ en: "All", ar: "الكل", zh: "全部" })}</option>{[...new Set(G04_CLOSE_ROWS.map(r => r.account))].map(v => <option key={v}>{v}</option>)}</select></label>
      <div className="g04-filter-state"><span>{tr({ en: "Settlement requests", ar: "طلبات التسوية", zh: "结算请求" })}</span><b>{rows.length}</b></div>
    </section>
    <section className="g04-kpis">
      <div className="bp-console-kpi accent"><span>{tr({ en: "Close progress", ar: "تقدم الإقفال", zh: "关账进度" })}</span><b>82%</b><small>{tr({ en: "pre-close checklist", ar: "قائمة ما قبل الإقفال", zh: "关账前清单" })}</small></div>
      <div className="bp-console-kpi"><span>{tr({ en: "Reconciliation", ar: "المطابقة", zh: "对账率" })}</span><b>98%</b><small>{tr({ en: "matched with 2 differences open", ar: "مطابق مع فرقين مفتوحين", zh: "已匹配，2项差异未结" })}</small></div>
      <div className="bp-console-kpi warn"><span>{tr({ en: "SAP vs Etimad diff", ar: "فرق ساب واعتماد", zh: "SAP和Etimad差异" })}</span><b>SAR 25M</b><small>{tr({ en: "timing, input and async source differences", ar: "فروق توقيت وإدخال ومصدر غير متزامن", zh: "时间、输入错误与异步来源差异" })}</small></div>
      <div className="bp-console-kpi"><span>{tr({ en: "Adopted settlements", ar: "تسويات معتمدة", zh: "已采纳结算" })}</span><b>{Object.keys(adopted).length}</b><small>{tr({ en: "manual adoption actions", ar: "إجراءات اعتماد بشرية", zh: "人工采纳动作" })}</small></div>
    </section>
    <section className="bp-console-panel g04-main-panel">
      <div className="g04-panel-head"><div><span>{tr({ en: "Closing and settlement worklist", ar: "قائمة الإقفال والتسوية", zh: "关账与结算列表" })}</span><b>{tr({ en: "Pre-close validation, SAP-Etimad differences and settlement recommendations", ar: "تحقق ما قبل الإقفال وفروق ساب-اعتماد وتوصيات التسوية", zh: "关账前验证、SAP-Etimad差异与建议结算" })}</b></div></div>
      <div className="bp-tablewrap g04-tablewrap"><table className="tbl bp-table g04-table g04-close-table">
        <thead><tr><th>{tr({ en: "Fiscal period", ar: "الفترة المالية", zh: "财务期间" })}</th><th>{tr({ en: "Settlement type", ar: "نوع التسوية", zh: "结算类型" })}</th><th>{tr({ en: "Account scope", ar: "نطاق الحساب", zh: "账户范围" })}</th><th>{tr({ en: "Pre-close validation", ar: "تحقق ما قبل الإقفال", zh: "结算前验证状态" })}</th><th>{tr({ en: "SAP and Etimad differences", ar: "فروق ساب واعتماد", zh: "SAP差异和Etimad" })}</th><th>{tr({ en: "Pending payment orders", ar: "أوامر دفع معلقة", zh: "待处理付款订单" })}</th><th>{tr({ en: "Recommended settlement", ar: "التسوية المقترحة", zh: "建议结算" })}</th><th>{tr({ en: "Monthly plan", ar: "الخطة الشهرية", zh: "月度计划" })}</th><th>{tr({ en: "Final account", ar: "الحساب النهائي", zh: "最终账户" })}</th><th>{tr({ en: "Action", ar: "الإجراء", zh: "操作" })}</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}><td><div className="bp-table-main">{row.period}</div><div className="bp-table-sub">{row.id}</div></td><td>{row.type}</td><td>{row.account}</td><td><button className={"g04-link strong " + row.validation} onClick={() => setModal({ title: row.id + " · " + tr({ en: "Pre-close checklist", ar: "قائمة ما قبل الإقفال", zh: "结算前验证清单" }), lines: row.checklist })}>{row.validation === "clean" ? tr({ en: "Clean", ar: "نظيف", zh: "通过" }) : row.validation === "warning" ? tr({ en: "Warning", ar: "تحذير", zh: "警告" }) : tr({ en: "Exceptions", ar: "استثناءات", zh: "异常" })}</button></td><td><div className="g04-diffbox"><b>SAR {Math.abs(row.contractAmount - row.paymentAmount)}M</b><span>{tr({ en: "Contract", ar: "عقد", zh: "合同" })}: {row.contractAmount} · {tr({ en: "Invoice", ar: "فاتورة", zh: "发票" })}: {row.invoiceAmount} · {tr({ en: "Payment", ar: "دفع", zh: "付款" })}: {row.paymentAmount}</span><small>{tr({ timing: { en: "Timing", ar: "توقيت", zh: "时间" }, "input error": { en: "Input error", ar: "خطأ إدخال", zh: "输入错误" }, "missing limit": { en: "Missing limit", ar: "حد مفقود", zh: "缺失限制" }, "async source": { en: "Async source", ar: "مصدر غير متزامن", zh: "异步来源" } }[row.diffType])}</small></div></td><td><button className="g04-link" onClick={() => setModal({ title: row.id + " · " + tr({ en: "Pending payment orders", ar: "أوامر الدفع المعلقة", zh: "待处理付款订单" }), lines: row.pending })}>{row.pending.length} {tr({ en: "orders", ar: "أوامر", zh: "笔" })}</button></td><td><button className="g04-link strong" onClick={() => openReport(row, { en: "Recommended settlement report", ar: "تقرير التسوية المقترحة", zh: "建议结算报告" }, row.settlement)}>{tr({ en: "View recommendation", ar: "عرض التوصية", zh: "查看建议" })}</button></td><td><button className="g04-link" onClick={() => openReport(row, { en: "Monthly plan report", ar: "تقرير الخطة الشهرية", zh: "月度计划报告" }, row.monthlyPlan)}>{tr({ en: "Monthly plan", ar: "الخطة الشهرية", zh: "月度计划" })}</button></td><td><button className="g04-link" onClick={() => openReport(row, { en: "Final account report", ar: "تقرير الحساب النهائي", zh: "最终账户报告" }, row.finalAccount)}>{tr({ en: "Final account", ar: "الحساب النهائي", zh: "最终账户" })}</button></td><td><button className="btn sm" disabled={!!adopted[row.id]} onClick={() => adopt(row)}>{adopted[row.id] ? tr({ en: "Adopted", ar: "معتمد", zh: "已采纳" }) : tr({ en: "Adopt settlement", ar: "اعتماد التسوية", zh: "采纳结算" })}</button></td></tr>)}</tbody>
      </table></div>
    </section>
    <G04InfoModal title={modal?.title} lines={modal?.lines} onClose={() => setModal(null)} />
    <G04ReportDrawer report={report} onClose={() => setReport(null)} onAccept={() => { if (report) adopt(G04_CLOSE_ROWS.find(row => row.id === report.id) || report); setReport(null); }} onReject={() => { pushLog({ en: "Settlement report returned — " + report?.id, ar: "أُعيد تقرير التسوية — " + report?.id, zh: "结算报告已退回 — " + report?.id }); setReport(null); }} />
  </div>;
}

/* ---- Financial Entitlements Department (UC-08) ---- */
const WS_CFG_ENT = {
  uc: "UC-08/09", kpiTone: "violet", flow: FLOW_ENT, plazaModel: PLAZA_G04, plazaSel: "uc08", flowRoute: "g04entflow",
  title: { en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" },
  mandate: { en: "Mandate: contracts, claims, disbursements, entitlements, closing, reconciliation and settlements. KPI metrics + Business Plaza for the Financial Entitlements to Audit hand-off + floating Smart Query.", ar: "المهمة: العقود والمطالبات والصرف والاستحقاقات والإقفال والمطابقة والتسويات. مؤشرات + ساحة الأعمال للتسليم من الاستحقاقات إلى التدقيق + استعلام ذكي عائم.", zh: "职责:合同、索赔、支付、权益、关账、对账与结算。关键指标 + Business Plaza 展示财务权益到审计的交付 + 浮动智能查询。" },
  sqScope: { en: "Scope: Entitlements · read-only", ar: "النطاق: الاستحقاقات", zh: "范围:财务权益 · 只读" },
  sqPrompts: [{ en: "Which claims lack completion evidence?", ar: "ما المطالبات بلا إثبات إنجاز؟", zh: "哪些索赔缺完工证明?" }, { en: "What settlement requests block the close?", ar: "ما طلبات التسوية التي تعيق الإقفال؟", zh: "哪些结算请求阻碍关账?" }, { en: "Show SAP and Etimad differences by payment order", ar: "اعرض فروق ساب واعتماد حسب أمر الدفع", zh: "按付款订单显示SAP和Etimad差异" }],
  kpiSlides: [
    [
      { lab: { en: "Active Claims", ar: "مطالبات نشطة", zh: "在办索赔" }, v: "42", d: { en: "7 this week", ar: "7 هذا الأسبوع", zh: "本周 7" } },
      { lab: { en: "Net Due", ar: "صافي المستحق", zh: "净应付" }, v: "SAR 320M", d: { en: "18 claims pending", ar: "18 مطالبة معلّقة", zh: "18 笔待付" } },
      { lab: { en: "Matching Rate", ar: "نسبة المطابقة", zh: "匹配率" }, v: "83%", d: { en: "matched ÷ claims (35/42)", ar: "مطابقة ÷ مطالبات (35/42)", zh: "已匹配 ÷ 索赔(35/42)" } },
      { lab: { en: "Close blockers", ar: "عوائق الإقفال", zh: "关账阻碍" }, v: "3", d: { en: "pre-close checklist items", ar: "بنود قائمة ما قبل الإقفال", zh: "关账前清单事项" } },
    ],
    [
      { lab: { en: "Verified", ar: "مُتحقّق", zh: "已核验" }, v: "35", d: { en: "of 42 claims", ar: "من 42", zh: "共 42 笔" } },
      { lab: { en: "Approved", ar: "معتمد", zh: "已批准" }, v: "28", d: { en: "ready to pay", ar: "جاهز للدفع", zh: "可付款" } },
      { lab: { en: "Disbursed", ar: "مصروف", zh: "已拨付" }, v: "23", d: { en: "this period", ar: "هذه الفترة", zh: "本期" } },
      { lab: { en: "Settlement Difference", ar: "فرق التسوية", zh: "结算差异" }, v: "SAR 25M", d: { en: "SAP and Etimad reconciliation", ar: "مطابقة ساب واعتماد", zh: "SAP和Etimad对账" } },
    ],
    [
      { lab: { en: "Claims by Severity", ar: "المطالبات حسب الخطورة", zh: "按严重度索赔" }, aging: [["Crit", 25, "1"], ["High", 50, "1"], ["Med/Low", 100, "3"]] },
      { lab: { en: "Missing Justifications", ar: "مبررات ناقصة", zh: "缺完工证明" }, v: "2", d: { en: "no completion evidence", ar: "بلا إثبات إنجاز", zh: "无完工证明" } },
      { lab: { en: "Quantity Differences", ar: "فروق الكمية", zh: "数量差异" }, v: "1", d: { en: "amount mismatch · SAR 28M", ar: "عدم تطابق · 28 مليون", zh: "金额不符 · SAR 28M" } },
      { lab: { en: "Late Notices", ar: "إشعارات تأخر", zh: "迟交通知" }, v: "1", d: { en: "SLA breach", ar: "تجاوز SLA", zh: "超 SLA" } },
    ],
  ],
  orch: {
    uc: "UC-08", run: "#8033", agent: { en: "Entitlements agent", ar: "وكيل الاستحقاقات", zh: "权益智能体" },
    chips: ["scope: claims", "dept: read-only", "policy: evidence req."],
    defaultPrompt: { en: "List claims missing completion evidence, summarize what is pending disbursement today, and prepare a disbursement batch of verified claims for approval.", ar: "اسرد المطالبات التي تفتقر إلى إثبات الإنجاز، ولخّص المستحق للصرف اليوم، وجهّز دفعة صرف للمطالبات المتحققة للاعتماد.", zh: "列出缺完工证明的索赔,汇总今日待拨付,并准备一批已核验索赔供审批拨付。" },
    startLog: { en: "Orchestrator started — matching claims to evidence & building batch", ar: "بدأ المنسّق — مطابقة المطالبات بالأدلة وبناء الدفعة", zh: "编排器已启动——匹配索赔与证据并构建批次" },
    reviewLog: { en: "Draft ready — disbursement batch (SAR 268M) awaits approval", ar: "المسودة جاهزة — دفعة الصرف (268 مليون) بانتظار الاعتماد", zh: "草稿就绪——拨付批次(SAR 268M)等待审批" },
    approveLog: { en: "Disbursement batch authorized; routed for payment", ar: "اعتُمدت دفعة الصرف؛ وأُرسلت للدفع", zh: "拨付批次已批准;已转交付款" },
    returnLog: { en: "Batch returned to the Entitlements agent for rework", ar: "أُعيدت الدفعة لوكيل الاستحقاقات", zh: "批次已退回权益智能体重新处理" },
    prompts: [{ t: { en: "Claims missing evidence", ar: "مطالبات بلا إثبات", zh: "缺证索赔" }, s: { en: "block disbursement", ar: "تمنع الصرف", zh: "阻断拨付" } }, { t: { en: "Pending disbursement today", ar: "المستحق للصرف اليوم", zh: "今日待拨付" }, s: { en: "by amount", ar: "حسب المبلغ", zh: "按金额" } }, { t: { en: "Prepare disbursement batch", ar: "تجهيز دفعة الصرف", zh: "准备拨付批次" }, s: { en: "verified only", ar: "المتحقق فقط", zh: "仅已核验" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull claims & contracts", ar: "سحب المطالبات والعقود", zh: "拉取索赔与合同" }, s: { en: "Etimad claims reconciled · 0.7s", ar: "مطالبات اعتماد · 0.7 ث", zh: "Etimad 索赔对账 · 0.7s" } },
      { code: "UC-08", t: { en: "match claims ↔ evidence", ar: "مطابقة المطالبات ↔ الأدلة", zh: "匹配索赔 ↔ 证据" }, s: { en: "42 claims · 35 verified", ar: "42 مطالبة · 35 متحققة", zh: "42 笔 · 35 已核验" } },
      { code: "UC-02", t: { en: "flag exceptions", ar: "رصد الاستثناءات", zh: "标记例外" }, s: { en: "5 exceptions · 2 missing evidence", ar: "5 استثناءات · 2 بلا إثبات", zh: "5 例外 · 2 缺证" } },
      { code: "UC-08", t: { en: "build disbursement batch", ar: "بناء دفعة الصرف", zh: "构建拨付批次" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "A disbursement batch of 16 verified claims (SAR 268M) requires approval; 2 claims lacking completion evidence are held for review.", ar: "تتطلب دفعة صرف من 16 مطالبة متحققة (268 مليون) اعتماداً؛ وتُحتجز مطالبتان بلا إثبات إنجاز للمراجعة.", zh: "16 笔已核验索赔(SAR 268M)的拨付批次需审批;2 笔缺完工证明的索赔留待复核。" },
    approveLabel: { en: "Authorize batch", ar: "اعتماد الدفعة", zh: "批准批次" },
    approvedChip: { en: "Authorized · batch routed for payment", ar: "معتمد · أُرسلت الدفعة للدفع", zh: "已批准 · 批次转交付款" },
    diff: [
      { k: "rem", t: { en: "CLM-3411 · disburse (no evidence)", ar: "CLM-3411 · صرف (بلا إثبات)", zh: "CLM-3411 · 拨付(缺证)" } },
      { k: "add", t: { en: "CLM-3411 · held for review", ar: "CLM-3411 · محتجز للمراجعة", zh: "CLM-3411 · 留待复核" } },
      { k: "rem", t: { en: "batch · none", ar: "دفعة · لا شيء", zh: "批次 · 无" } },
      { k: "add", t: { en: "batch · 16 claims · SAR 268M", ar: "دفعة · 16 مطالبة · 268 مليون", zh: "批次 · 16 笔 · SAR 268M" } },
    ],
    returnBody: { en: "Batch sent back to the Entitlements agent. Edit the prompt and run again.", ar: "أُعيدت الدفعة لوكيل الاستحقاقات. عدّل الطلب وأعد التشغيل.", zh: "批次已退回权益智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Authorize disbursement batch (16 claims · SAR 268M)", ar: "اعتماد دفعة الصرف (16 مطالبة · 268 مليون)", zh: "批准拨付批次(16 笔 · SAR 268M)" }, owner: "Latifa Al-Qahtani", role: { en: "Entitlements Lead", ar: "قائدة الاستحقاقات", zh: "权益负责人" }, phone: "+966 55 904 1182" },
      { act: { en: "Hold CLM-3411 & CLM-3398 for evidence", ar: "احتجاز CLM-3411 و CLM-3398 للأدلة", zh: "暂缓 CLM-3411 与 CLM-3398 待证据" }, owner: "Bandar Al-Otaibi", role: { en: "Claims Officer", ar: "مسؤول المطالبات", zh: "索赔专员" }, phone: "+966 50 337 6650" },
      { act: { en: "Request completion certificates from contractors", ar: "طلب شهادات الإنجاز من المقاولين", zh: "向承包商索取完工证明" }, owner: "Mona Al-Harbi", role: { en: "Contracts Coordinator", ar: "منسقة العقود", zh: "合同协调员" }, phone: "+966 53 220 9914" },
    ],
  },
};

/* ---- Accounting Department (UC-09 +11) ---- */
const WS_CFG_ACCT = {
  uc: "UC-09 (+11)", kpiTone: "violet", flow: FLOW_ACCT, plazaModel: PLAZA_G05, plazaSel: "uc09", flowRoute: "g05acctflow",
  title: { en: "Accounting Department", ar: "إدارة المحاسبة", zh: "会计部" },
  mandate: { en: "Mandate: financial closing, reconciliation & settlements (UC-09, +UC-11 memos). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: الإقفال المالي والتسوية والتسويات (UC-09). مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:关账、对账与结算(UC-09,+UC-11 备忘)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Accounting · read-only", ar: "النطاق: المحاسبة", zh: "范围:会计 · 只读" },
  sqPrompts: [{ en: "What blocks the period close?", ar: "ما الذي يعيق الإقفال؟", zh: "什么阻碍期末关账?" }, { en: "Show the SAP↔Etimad differences", ar: "أظهر فروق ساب↔اعتماد", zh: "显示 SAP↔Etimad 差异" }, { en: "Draft the adjusting entries", ar: "صياغة قيود التسوية", zh: "起草调整分录" }],
  kpiSlides: [
    [
      { lab: { en: "Close Progress", ar: "تقدّم الإقفال", zh: "关账进度" }, v: "82%", d: { en: "pre-close checklist (UC-09)", ar: "قائمة ما قبل الإقفال (UC-09)", zh: "关账前清单(UC-09)" }, up: true },
      { lab: { en: "Reconciliation", ar: "المطابقة", zh: "对账率" }, v: "98%", d: { en: "matched · 2 diffs open", ar: "مطابق · فرقان", zh: "已匹配 · 2 项差异" } },
      { lab: { en: "Proposed Adjustments", ar: "قيود تسوية مقترحة", zh: "建议调整分录" }, v: "2", d: { en: "entries to post (UC-09)", ar: "قيود للترحيل (UC-09)", zh: "待过账(UC-09)" } },
      { lab: { en: "Accounting Memos", ar: "مذكرات محاسبية", zh: "会计备忘" }, v: "1", d: { en: "needs review (UC-11)", ar: "للمراجعة (UC-11)", zh: "待复核(UC-11)" } },
    ],
    [
      { lab: { en: "Unmatched Difference", ar: "الفرق غير المطابق", zh: "未匹配差异" }, v: "SAR 25M", d: { en: "Esnad +15M, Tahseel +10M", ar: "إسناد +15، تحصيل +10", zh: "Esnad +15M, Tahseel +10M" } },
      { lab: { en: "SAP ↔ Etimad Diffs", ar: "فروق ساب↔اعتماد", zh: "SAP↔Etimad 差异" }, v: "2", d: { en: "open items", ar: "بنود مفتوحة", zh: "未结项" } },
      { lab: { en: "Within Tolerance", ar: "ضمن الحدود", zh: "容差内" }, v: "Yes", d: { en: "bank fees 0.4M auto", ar: "رسوم بنكية 0.4 تلقائي", zh: "银行费 0.4M 自动" }, up: true },
      { lab: { en: "Days to Close", ar: "أيام للإقفال", zh: "距关账" }, v: "1 d", d: { en: "Q2 FY2026", ar: "الربع 2 2026", zh: "FY2026 Q2" } },
    ],
    [
      { lab: { en: "Diffs by Materiality", ar: "الفروق حسب الأهمية", zh: "按重要性差异" }, aging: [["Esnad", 60, "+15M"], ["Tahseel", 40, "+10M"], ["Bank", 5, "0.4M"]] },
      { lab: { en: "IPSAS Compliant", ar: "متوافق IPSAS", zh: "符合 IPSAS" }, v: "✓", d: { en: "entries validated (UC-11)", ar: "قيود مُتحقّقة (UC-11)", zh: "分录已校验(UC-11)" }, up: true },
      { lab: { en: "Observations", ar: "ملاحظات", zh: "观察项" }, v: "1", d: { en: "initial response drafted", ar: "رد أولي مُصاغ", zh: "已起草初步回应" } },
      { lab: { en: "Memo Pending", ar: "مذكرة معلّقة", zh: "待办备忘" }, v: "1", d: { en: "legal basis attached", ar: "الأساس القانوني مرفق", zh: "附法律依据" } },
    ],
  ],
  orch: {
    uc: "UC-09", run: "#9027", agent: { en: "Accounting agent", ar: "وكيل المحاسبة", zh: "会计智能体" },
    chips: ["scope: FY2026 Q2", "dept: close", "policy: IPSAS"],
    defaultPrompt: { en: "Identify what blocks the period close, reconcile the SAP↔Etimad differences, and draft the adjusting entries to clear the SAR 25M gap for approval.", ar: "حدّد ما يعيق إقفال الفترة، وسوِّ فروق ساب↔اعتماد، وصُغ قيود التسوية لإغلاق فرق 25 مليون للاعتماد.", zh: "识别阻碍期末关账的因素,对平 SAP↔Etimad 差异,并起草调整分录以清除 SAR 25M 差异供审批。" },
    startLog: { en: "Orchestrator started — reconciling SAP↔Etimad for period close (Q2)", ar: "بدأ المنسّق — مطابقة ساب↔اعتماد للإقفال", zh: "编排器已启动——为期末关账对平 SAP↔Etimad(Q2)" },
    reviewLog: { en: "Draft ready — 2 adjusting entries await accounting approval", ar: "المسودة جاهزة — قيدا تسوية بانتظار اعتماد المحاسبة", zh: "草稿就绪——2 项调整分录等待会计审批" },
    approveLog: { en: "Adjusting entries posted; pre-close checklist cleared", ar: "رُحّلت قيود التسوية؛ وأُغلقت قائمة ما قبل الإقفال", zh: "调整分录已过账;关账前清单已清空" },
    returnLog: { en: "Entries returned to the Accounting agent for rework", ar: "أُعيدت القيود لوكيل المحاسبة", zh: "分录已退回会计智能体重新处理" },
    prompts: [{ t: { en: "What blocks the close", ar: "ما الذي يعيق الإقفال", zh: "什么阻碍关账" }, s: { en: "open items", ar: "بنود مفتوحة", zh: "未结项" } }, { t: { en: "SAP↔Etimad differences", ar: "فروق ساب↔اعتماد", zh: "SAP↔Etimad 差异" }, s: { en: "net SAR 25M", ar: "صافي 25 مليون", zh: "净 SAR 25M" } }, { t: { en: "Draft adjusting entries", ar: "صياغة قيود التسوية", zh: "起草调整分录" }, s: { en: "clear the gap", ar: "أغلق الفرق", zh: "清除差异" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull ledgers", ar: "سحب الدفاتر", zh: "拉取总账" }, s: { en: "SAP & Etimad balances loaded · 0.7s", ar: "أرصدة ساب واعتماد · 0.7 ث", zh: "SAP 与 Etimad 余额加载 · 0.7s" } },
      { code: "UC-09", t: { en: "reconcile SAP ↔ Etimad", ar: "مطابقة ساب ↔ اعتماد", zh: "对平 SAP ↔ Etimad" }, s: { en: "98% matched · SAR 25M net diff", ar: "98% مطابق · فرق 25 مليون", zh: "匹配 98% · 净差 SAR 25M" } },
      { code: "UC-11", t: { en: "check policy & memo basis", ar: "فحص السياسة وأساس المذكرة", zh: "核查政策与备忘依据" }, s: { en: "IPSAS-compliant · within tolerance", ar: "متوافق IPSAS · ضمن الحدود", zh: "符合 IPSAS · 在容差内" } },
      { code: "UC-09", t: { en: "draft adjusting entries", ar: "صياغة قيود التسوية", zh: "起草调整分录" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "Posting 2 adjusting entries to clear the SAR 25M reconciliation difference requires accounting approval before the period closes.", ar: "يتطلب ترحيل قيدي تسوية لإغلاق فرق المطابقة 25 مليون اعتماد المحاسبة قبل إقفال الفترة.", zh: "过账 2 项调整分录以清除 SAR 25M 对账差异,需会计审批后方可关账。" },
    approveLabel: { en: "Post entries", ar: "ترحيل القيود", zh: "过账分录" },
    approvedChip: { en: "Posted · pre-close checklist cleared", ar: "رُحّلت · أُغلقت قائمة ما قبل الإقفال", zh: "已过账 · 关账前清单已清空" },
    diff: [
      { k: "rem", t: { en: "Esnad assignment · SAR +15M unmatched", ar: "إسناد إسناد · +15 مليون غير مطابق", zh: "Esnad 派工 · SAR +15M 未匹配" } },
      { k: "add", t: { en: "Esnad assignment · adjusted", ar: "إسناد إسناد · مُسوّى", zh: "Esnad 派工 · 已调整" } },
      { k: "rem", t: { en: "Tahseel revenue · SAR +10M unmatched", ar: "إيراد تحصيل · +10 مليون غير مطابق", zh: "Tahseel 收入 · SAR +10M 未匹配" } },
      { k: "add", t: { en: "Tahseel revenue · adjusted", ar: "إيراد تحصيل · مُسوّى", zh: "Tahseel 收入 · 已调整" } },
    ],
    returnBody: { en: "Entries sent back to the Accounting agent. Edit the prompt and run again.", ar: "أُعيدت القيود لوكيل المحاسبة. عدّل الطلب وأعد التشغيل.", zh: "分录已退回会计智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Post 2 adjusting entries (clear SAR 25M)", ar: "ترحيل قيدي تسوية (إغلاق 25 مليون)", zh: "过账 2 项调整分录(清除 SAR 25M)" }, owner: "Nada Al-Shamrani", role: { en: "Accounting Lead", ar: "قائدة المحاسبة", zh: "会计负责人" }, phone: "+966 55 118 4420" },
      { act: { en: "Attach UC-11 memo & legal basis", ar: "إرفاق مذكرة UC-11 والأساس القانوني", zh: "附 UC-11 备忘与法律依据" }, owner: "Ibrahim Al-Faleh", role: { en: "Compliance Officer", ar: "مسؤول الامتثال", zh: "合规专员" }, phone: "+966 50 662 7781" },
      { act: { en: "Close period & issue statements", ar: "إقفال الفترة وإصدار القوائم", zh: "关闭期间并出具报表" }, owner: "Sami Al-Rashidi", role: { en: "Financial Controller", ar: "المراقب المالي", zh: "财务总监" }, phone: "+966 53 904 2216" },
    ],
  },
};


/* ===== G-05 storyline flows (Financial Reports group) ===== */
const FLOW_COST = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "in" },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "focus", star: true },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "down" },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];
const FLOW_COMP = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "focus", star: true },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "down" },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "down" },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];
const FLOW_REP = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "in" },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "in" },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "focus", star: true },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];

/* ---- Cost Management Department (UC-12 · G-05) ---- */
const WS_CFG_COST = {
  uc: "UC-12", kpiTone: "violet", flow: FLOW_COST, plazaModel: PLAZA_G05, plazaSel: "uc12", flowRoute: "g05costflow",
  title: { en: "Cost Management Department", ar: "إدارة التكاليف", zh: "成本管理部" },
  mandate: { en: "Mandate: costs, assignment orders, unit cost & funds (UC-12). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: التكاليف وأوامر الإسناد وتكلفة الوحدة والصناديق (UC-12). مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:成本、派工单、单元成本与资金(UC-12)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Cost & Funds · read-only", ar: "النطاق: التكاليف والصناديق", zh: "范围:成本与资金 · 只读" },
  sqPrompts: [{ en: "Why is AO-2207 surplus idle?", ar: "لماذا فائض AO-2207 خامل؟", zh: "AO-2207 结余为何闲置?" }, { en: "Which orders lack completion certificates?", ar: "ما الأوامر بلا شهادات إنجاز؟", zh: "哪些派工单缺完工证明?" }, { en: "Resolve the SAP ↔ Etimad difference", ar: "تسوية فرق ساب↔اعتماد", zh: "对平 SAP↔Etimad 差异" }],
  kpiSlides: [
    [
      { lab: { en: "Project Cost Allocated", ar: "تكلفة المشاريع الموزّعة", zh: "已分摊项目成本" }, v: "SAR 2.14B", d: { en: "across 1,780 units", ar: "على 1,780 وحدة", zh: "分摊至 1,780 单元" } },
      { lab: { en: "Idle Surplus", ar: "فائض خامل", zh: "闲置结余" }, v: "SAR 85M", d: { en: "AO-2207 · 120d no disb.", ar: "AO-2207 · 120 يوماً بلا صرف", zh: "AO-2207 · 120天无支付" } },
      { lab: { en: "Aged Orders (>90d)", ar: "أوامر متقادمة (>90ي)", zh: "逾期派工单 (>90天)" }, v: "9", d: { en: "missing certificates", ar: "بلا شهادات", zh: "缺完工证明" } },
      { lab: { en: "Match Rate", ar: "نسبة المطابقة", zh: "匹配率" }, v: "98%", d: { en: "SAP ↔ Etimad · 2% diff", ar: "ساب↔اعتماد · 2% فرق", zh: "SAP↔Etimad · 2% 差异" } },
    ],
    [
      { lab: { en: "Avg Unit Cost", ar: "متوسط تكلفة الوحدة", zh: "平均单元成本" }, v: "SAR 1.20M", d: { en: "land + build (UC-12)", ar: "أرض + إنشاء (UC-12)", zh: "土地+建造(UC-12)" } },
      { lab: { en: "Assignment Orders", ar: "أوامر الإسناد", zh: "派工单" }, v: "1,840", d: { en: "matched ↔ Etimad", ar: "مطابقة ↔ اعتماد", zh: "已匹配 ↔ Etimad" } },
      { lab: { en: "Funds Tracked", ar: "صناديق متتبَّعة", zh: "跟踪基金" }, v: "2", d: { en: "Industrial · Real-Estate", ar: "الصناعي · العقاري", zh: "工业 · 房地产" } },
      { lab: { en: "SAP↔Etimad Gap", ar: "فجوة ساب↔اعتماد", zh: "SAP↔Etimad 差额" }, v: "SAR 25M", d: { en: "2 reconciliation items", ar: "بندا مطابقة", zh: "2 项对账" } },
    ],
    [
      { lab: { en: "Idle Surplus by Fund", ar: "الفائض الخامل حسب الصندوق", zh: "按基金闲置结余" }, aging: [["Real-Estate", 100, "85M"], ["Industrial", 35, "30M"], ["Other", 10, "8M"]] },
      { lab: { en: "Releasable Now", ar: "قابل للإفراج الآن", zh: "可立即释放" }, v: "SAR 85M", d: { en: "AO-2207 · milestone met", ar: "AO-2207 · المرحلة منجزة", zh: "AO-2207 · 里程碑达成" }, up: true },
      { lab: { en: "Unblocked by Certs", ar: "يُفك بالشهادات", zh: "凭证释放" }, v: "SAR 60M", d: { en: "9 aged orders", ar: "9 أوامر متقادمة", zh: "9 个逾期派工单" } },
      { lab: { en: "Cost Alerts", ar: "تنبيهات التكلفة", zh: "成本告警" }, v: "1", d: { en: "dormant order (UC-02)", ar: "أمر خامل (UC-02)", zh: "休眠派工单(UC-02)" } },
    ],
  ],
  orch: {
    uc: "UC-12", run: "#1242", agent: { en: "Costs & Funds agent", ar: "وكيل التكاليف والصناديق", zh: "成本与资金智能体" },
    chips: ["scope: FY2026", "dept: Cost", "policy: Esnad/Etimad"],
    defaultPrompt: { en: "Match assignment orders to payment orders, flag idle surplus and missing completion certificates, and draft a fund-release note for review.", ar: "طابق أوامر الإسناد بأوامر الدفع، وحدّد الفائض الخامل والشهادات المفقودة، وصُغ مذكرة إفراج عن الأموال للمراجعة.", zh: "将派工单与付款单匹配,标记闲置结余与缺失完工证明,并起草供复核的资金释放说明。" },
    startLog: { en: "Orchestrator started — matching orders & tracing idle surplus (UC-12)", ar: "بدأ المنسّق — مطابقة الأوامر وتتبع الفائض الخامل", zh: "编排器已启动——匹配派工单并追溯闲置结余(UC-12)" },
    reviewLog: { en: "Draft ready — SAR 85M surplus release awaits fund-owner approval", ar: "المسودة جاهزة — الإفراج عن 85 مليون بانتظار اعتماد مالك الصندوق", zh: "草稿就绪——SAR 85M 结余释放等待基金所有者审批" },
    approveLog: { en: "Fund owner approved release; transfer routed for sign-off", ar: "اعتمد مالك الصندوق الإفراج؛ وأُرسل التحويل للتوقيع", zh: "基金所有者已批准释放;转账已转交签核" },
    returnLog: { en: "Release note returned to the Costs & Funds agent for rework", ar: "أُعيدت المذكرة لوكيل التكاليف", zh: "释放说明已退回成本与资金智能体重新处理" },
    prompts: [{ t: { en: "Match AO ↔ payment orders", ar: "مطابقة الأوامر ↔ الدفع", zh: "匹配派工单 ↔ 付款单" }, s: { en: "Esnad / Etimad / SAP", ar: "إسناد / اعتماد / ساب", zh: "Esnad / Etimad / SAP" } }, { t: { en: "Flag idle surplus & missing certs", ar: "رصد الفائض والشهادات المفقودة", zh: "标记闲置结余与缺证" }, s: { en: ">90 days", ar: "> 90 يوماً", zh: ">90 天" } }, { t: { en: "Draft fund-release note", ar: "صياغة مذكرة إفراج", zh: "起草资金释放说明" }, s: { en: "for review", ar: "للمراجعة", zh: "供复核" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull cost & order data", ar: "سحب بيانات التكلفة والأوامر", zh: "拉取成本与派工数据" }, s: { en: "1,840 orders ↔ Etimad · 0.9s", ar: "1,840 أمراً ↔ اعتماد · 0.9 ث", zh: "1,840 派工单 ↔ Etimad · 0.9s" } },
      { code: "UC-12", t: { en: "calculate unit / land cost", ar: "احتساب تكلفة الوحدة / الأرض", zh: "计算单元/地块成本" }, s: { en: "SAR 2.14B across 1,780 units", ar: "2.14 مليار على 1,780 وحدة", zh: "SAR 2.14B 分摊至 1,780 单元" } },
      { code: "UC-02", t: { en: "flag idle surplus & certs", ar: "رصد الفائض والشهادات", zh: "标记闲置结余与缺证" }, s: { en: "AO-2207 idle SAR 85M · 9 missing", ar: "AO-2207 خامل 85 مليون · 9 ناقصة", zh: "AO-2207 闲置 SAR 85M · 9 缺证" } },
      { code: "UC-12", t: { en: "draft fund-release note", ar: "صياغة مذكرة الإفراج", zh: "起草资金释放说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "Releasing the SAR 85M idle surplus on AO-2207 requires fund-owner approval before the transfer is created.", ar: "يتطلب الإفراج عن فائض 85 مليون الخامل على AO-2207 اعتماد مالك الصندوق قبل إنشاء التحويل.", zh: "释放 AO-2207 上 SAR 85M 闲置结余需基金所有者审批后方可创建转账。" },
    approveLabel: { en: "Approve release", ar: "اعتماد الإفراج", zh: "批准释放" },
    approvedChip: { en: "Approved · surplus release routed", ar: "معتمد · أُرسل الإفراج", zh: "已批准 · 结余释放已转交" },
    diff: [
      { k: "rem", t: { en: "AO-2207 surplus · idle 120d", ar: "فائض AO-2207 · خامل 120 يوماً", zh: "AO-2207 结余 · 闲置 120 天" } },
      { k: "add", t: { en: "AO-2207 · SAR 85M released to fund", ar: "AO-2207 · إفراج 85 مليون للصندوق", zh: "AO-2207 · 释放 SAR 85M 至基金" } },
      { k: "rem", t: { en: "completion certificates · 9 missing", ar: "شهادات الإنجاز · 9 ناقصة", zh: "完工证明 · 9 缺失" } },
      { k: "add", t: { en: "completion certificates · chased (9 orders)", ar: "شهادات الإنجاز · متابعة (9 أوامر)", zh: "完工证明 · 已催办(9 派工单)" } },
    ],
    returnBody: { en: "Release note sent back to the Costs & Funds agent. Edit the prompt and run again.", ar: "أُعيدت المذكرة لوكيل التكاليف. عدّل الطلب وأعد التشغيل.", zh: "释放说明已退回成本与资金智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Approve SAR 85M idle-surplus release (AO-2207)", ar: "اعتماد الإفراج عن فائض 85 مليون (AO-2207)", zh: "批准 SAR 85M 闲置结余释放(AO-2207)" }, owner: "Khalid Al-Mutlaq", role: { en: "Cost Management Lead", ar: "قائد إدارة التكاليف", zh: "成本管理负责人" }, phone: "+966 55 412 9930" },
      { act: { en: "Chase 9 completion certificates (> 90d)", ar: "متابعة 9 شهادات إنجاز (> 90 يوماً)", zh: "催办 9 份完工证明(>90天)" }, owner: "Reem Al-Juhani", role: { en: "Funds Officer", ar: "مسؤولة الصناديق", zh: "资金专员" }, phone: "+966 50 771 4408" },
      { act: { en: "Resolve SAP↔Etimad SAR 25M mismatch", ar: "حل عدم تطابق ساب↔اعتماد 25 مليون", zh: "解决 SAP↔Etimad SAR 25M 差异" }, owner: "Tariq Al-Amri", role: { en: "Reconciliation Analyst", ar: "محلل المطابقة", zh: "对账分析师" }, phone: "+966 53 668 1175" },
    ],
  },
};

/* ---- Compliance Department (UC-11 · G-05) ---- */
const WS_CFG_COMPLIANCE = {
  uc: "UC-11", kpiTone: "violet", flow: FLOW_COMP, plazaModel: PLAZA_G05, plazaSel: "uc11", flowRoute: "g05compflow",
  title: { en: "Compliance Department", ar: "إدارة الامتثال", zh: "合规部" },
  mandate: { en: "Mandate: compliance, policies & accounting memoranda (UC-11). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: الامتثال والسياسات والمذكرات المحاسبية (UC-11). مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:合规、政策与会计备忘录(UC-11)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Compliance · read-only", ar: "النطاق: الامتثال", zh: "范围:合规 · 只读" },
  sqPrompts: [{ en: "Which capitalizations breach IPSAS?", ar: "ما الرسملات المخالفة لـ IPSAS؟", zh: "哪些资本化违反 IPSAS?" }, { en: "Show the useful-life policy conflict", ar: "أظهر تعارض سياسة العمر الإنتاجي", zh: "显示使用年限政策冲突" }, { en: "Draft accounting memo MEMO-1142", ar: "صياغة المذكرة MEMO-1142", zh: "起草会计备忘 MEMO-1142" }],
  kpiSlides: [
    [
      { lab: { en: "Open Memos", ar: "مذكرات مفتوحة", zh: "未结备忘" }, v: "3", d: { en: "1 needs sign-off", ar: "1 بانتظار التوقيع", zh: "1 待签核" } },
      { lab: { en: "IPSAS Findings", ar: "نتائج IPSAS", zh: "IPSAS 发现" }, v: "2", d: { en: "componentization gaps", ar: "فجوات المكوّنات", zh: "组件折旧缺口" } },
      { lab: { en: "Policy Conflicts", ar: "تعارضات السياسات", zh: "政策冲突" }, v: "1", d: { en: "useful-life · MEMO-1142", ar: "العمر الإنتاجي · MEMO-1142", zh: "使用年限 · MEMO-1142" } },
      { lab: { en: "Compliance Score", ar: "درجة الامتثال", zh: "合规评分" }, v: "94%", d: { en: "+2pp QoQ", ar: "+2 ربعياً", zh: "环比 +2pp" }, up: true },
    ],
    [
      { lab: { en: "Proposed Entries", ar: "قيود مقترحة", zh: "建议分录" }, v: "4", d: { en: "from UC-09 close", ar: "من إقفال UC-09", zh: "来自 UC-09 关账" } },
      { lab: { en: "Observations", ar: "ملاحظات", zh: "观察项" }, v: "5", d: { en: "2 responded", ar: "2 مُجاب عنها", zh: "2 已回应" } },
      { lab: { en: "Legal Docs Logged", ar: "وثائق قانونية", zh: "法律文档" }, v: "12", d: { en: "audit-traceable", ar: "قابلة للتدقيق", zh: "可审计追溯" } },
      { lab: { en: "Rulings Issued", ar: "قرارات صادرة", zh: "已出裁定" }, v: "2", d: { en: "this period", ar: "هذه الفترة", zh: "本期" } },
    ],
    [
      { lab: { en: "Findings by Standard", ar: "النتائج حسب المعيار", zh: "按准则发现" }, aging: [["IPSAS 17", 100, "2"], ["IPSAS 1", 50, "1"], ["Policy", 50, "1"]] },
      { lab: { en: "Avg Response Time", ar: "متوسط زمن الرد", zh: "平均回应时长" }, v: "3 d", d: { en: "to observations", ar: "على الملاحظات", zh: "对观察项" }, up: true },
      { lab: { en: "Memos Approved", ar: "مذكرات معتمدة", zh: "已批准备忘" }, v: "1", d: { en: "of 3", ar: "من 3", zh: "共 3" } },
      { lab: { en: "Pending Review", ar: "بانتظار المراجعة", zh: "待复核" }, v: "2", d: { en: "memos + entries", ar: "مذكرات + قيود", zh: "备忘 + 分录" } },
    ],
  ],
  orch: {
    uc: "UC-11", run: "#1142", agent: { en: "Compliance & Memos agent", ar: "وكيل الامتثال والمذكرات", zh: "合规与备忘智能体" },
    chips: ["scope: FY2026 Q2", "dept: Compliance", "policy: IPSAS"],
    defaultPrompt: { en: "Check capitalization against IPSAS, draft the accounting memo for the useful-life policy conflict, and propose adjusting entries for review.", ar: "تحقّق من الرسملة مقابل IPSAS، وصُغ المذكرة المحاسبية لتعارض العمر الإنتاجي، واقترح قيود تسوية للمراجعة.", zh: "对照 IPSAS 检查资本化,为使用年限政策冲突起草会计备忘,并提出调整分录供复核。" },
    startLog: { en: "Orchestrator started — checking IPSAS compliance & drafting memo (UC-11)", ar: "بدأ المنسّق — فحص الامتثال لـ IPSAS وصياغة المذكرة", zh: "编排器已启动——检查 IPSAS 合规并起草备忘(UC-11)" },
    reviewLog: { en: "Draft ready — MEMO-1142 & 4 entries await compliance approval", ar: "المسودة جاهزة — MEMO-1142 و4 قيود بانتظار الاعتماد", zh: "草稿就绪——MEMO-1142 与 4 项分录等待合规审批" },
    approveLog: { en: "Compliance approved MEMO-1142; memo issued and logged", ar: "اعتمد الامتثال MEMO-1142؛ صدرت المذكرة وسُجّلت", zh: "合规已批准 MEMO-1142;备忘已出具并记录" },
    returnLog: { en: "Memo returned to the Compliance agent for rework", ar: "أُعيدت المذكرة لوكيل الامتثال", zh: "备忘已退回合规智能体重新处理" },
    prompts: [{ t: { en: "Check IPSAS compliance", ar: "فحص الامتثال لـ IPSAS", zh: "检查 IPSAS 合规" }, s: { en: "capitalization", ar: "الرسملة", zh: "资本化" } }, { t: { en: "Draft accounting memo", ar: "صياغة مذكرة محاسبية", zh: "起草会计备忘" }, s: { en: "MEMO-1142", ar: "MEMO-1142", zh: "MEMO-1142" } }, { t: { en: "Propose adjusting entries", ar: "اقتراح قيود تسوية", zh: "提出调整分录" }, s: { en: "for review", ar: "للمراجعة", zh: "供复核" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull entries & policies", ar: "سحب القيود والسياسات", zh: "拉取分录与政策" }, s: { en: "ledger + policy library · 0.7s", ar: "الدفتر + مكتبة السياسات · 0.7 ث", zh: "总账 + 政策库 · 0.7s" } },
      { code: "UC-11", t: { en: "check IPSAS rules", ar: "فحص قواعد IPSAS", zh: "检查 IPSAS 规则" }, s: { en: "2 findings · IPSAS 17 componentization", ar: "نتيجتان · IPSAS 17", zh: "2 发现 · IPSAS 17 组件" } },
      { code: "UC-02", t: { en: "flag policy conflict", ar: "رصد تعارض السياسة", zh: "标记政策冲突" }, s: { en: "useful-life · MEMO-1142", ar: "العمر الإنتاجي · MEMO-1142", zh: "使用年限 · MEMO-1142" } },
      { code: "UC-11", t: { en: "draft memo & entries", ar: "صياغة المذكرة والقيود", zh: "起草备忘与分录" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "The accounting memo MEMO-1142 (useful-life / IPSAS 17) and 4 proposed entries require compliance approval before issuance.", ar: "تتطلب المذكرة MEMO-1142 (العمر الإنتاجي / IPSAS 17) و4 قيود مقترحة اعتماد الامتثال قبل الإصدار.", zh: "会计备忘 MEMO-1142(使用年限 / IPSAS 17)与 4 项建议分录需合规审批后方可出具。" },
    approveLabel: { en: "Approve memo", ar: "اعتماد المذكرة", zh: "批准备忘" },
    approvedChip: { en: "Approved · memo issued & logged", ar: "معتمد · صدرت المذكرة", zh: "已批准 · 备忘已出具记录" },
    diff: [
      { k: "rem", t: { en: "useful-life · single life (non-compliant)", ar: "العمر الإنتاجي · عمر واحد (غير مطابق)", zh: "使用年限 · 单一年限(不合规)" } },
      { k: "add", t: { en: "useful-life · componentized per IPSAS 17", ar: "العمر الإنتاجي · مكوّنات وفق IPSAS 17", zh: "使用年限 · 按 IPSAS 17 组件化" } },
      { k: "rem", t: { en: "MEMO-1142 · draft", ar: "MEMO-1142 · مسودة", zh: "MEMO-1142 · 草稿" } },
      { k: "add", t: { en: "MEMO-1142 · approved & logged", ar: "MEMO-1142 · معتمد ومسجّل", zh: "MEMO-1142 · 已批准并记录" } },
    ],
    returnBody: { en: "Memo sent back to the Compliance agent. Edit the prompt and run again.", ar: "أُعيدت المذكرة لوكيل الامتثال. عدّل الطلب وأعد التشغيل.", zh: "备忘已退回合规智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Issue MEMO-1142 (useful-life / IPSAS 17)", ar: "إصدار MEMO-1142 (العمر الإنتاجي / IPSAS 17)", zh: "出具 MEMO-1142(使用年限 / IPSAS 17)" }, owner: "Huda Al-Faraj", role: { en: "Compliance Lead", ar: "قائدة الامتثال", zh: "合规负责人" }, phone: "+966 55 226 7781" },
      { act: { en: "Post 4 proposed adjusting entries", ar: "ترحيل 4 قيود تسوية مقترحة", zh: "过账 4 项建议调整分录" }, owner: "Yousef Al-Harbi", role: { en: "Senior Accountant", ar: "محاسب أول", zh: "高级会计" }, phone: "+966 50 339 1264" },
      { act: { en: "Log legal basis & references", ar: "تسجيل الأساس القانوني والمراجع", zh: "记录法律依据与参考" }, owner: "Sara Al-Qahtani", role: { en: "Policy Officer", ar: "مسؤولة السياسات", zh: "政策专员" }, phone: "+966 53 884 2019" },
    ],
  },
};

/* ---- Financial Reporting Department (UC-10 · G-05) ---- */
const WS_CFG_REPORTING = {
  uc: "UC-10", kpiTone: "green", flow: FLOW_REP, plazaModel: PLAZA_G05, plazaSel: "uc10", flowRoute: "g05repflow",
  title: { en: "Financial Reporting Department", ar: "إدارة التقارير المالية", zh: "财务报告部" },
  mandate: { en: "Mandate: financial & administrative reports, narrative commentary & executive dashboards (UC-10). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: التقارير المالية والإدارية والتعليق السردي ولوحات المعلومات التنفيذية (UC-10). مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:财务与行政报告、叙述性评述与执行仪表盘(UC-10)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Reporting · read-only", ar: "النطاق: التقارير", zh: "范围:财务报告 · 只读" },
  sqPrompts: [{ en: "What reports are in review?", ar: "ما التقارير قيد المراجعة؟", zh: "哪些报告在复核中?" }, { en: "Generate the quarterly narrative", ar: "إنشاء السرد الربعي", zh: "生成季度叙述" }, { en: "Prepare the executive summary", ar: "تجهيز الملخص التنفيذي", zh: "准备执行摘要" }],
  kpiSlides: [
    [
      { lab: { en: "Reports (period)", ar: "التقارير (الفترة)", zh: "本期报告" }, v: "7", d: { en: "Q2 FY2026", ar: "الربع 2 2026", zh: "FY2026 Q2" } },
      { lab: { en: "In Review", ar: "قيد المراجعة", zh: "复核中" }, v: "2", d: { en: "awaiting sign-off", ar: "بانتظار التوقيع", zh: "待签核" } },
      { lab: { en: "Approved / Issued", ar: "معتمد / صادر", zh: "已批准 / 已发布" }, v: "2", d: { en: "this period", ar: "هذه الفترة", zh: "本期" }, up: true },
      { lab: { en: "Drafts", ar: "مسودات", zh: "草稿" }, v: "3", d: { en: "auto-compiled", ar: "مجمّعة تلقائياً", zh: "自动汇编" } },
    ],
    [
      { lab: { en: "Executive Dashboards", ar: "لوحات تنفيذية", zh: "执行仪表盘" }, v: "1", d: { en: "leadership view", ar: "عرض القيادة", zh: "领导视图" } },
      { lab: { en: "Narrative Coverage", ar: "تغطية السرد", zh: "叙述覆盖" }, v: "100%", d: { en: "commentary on all KPIs", ar: "تعليق على كل المؤشرات", zh: "全部 KPI 有评述" }, up: true },
      { lab: { en: "Ad-hoc (NL)", ar: "حسب الطلب (لغة)", zh: "即席(自然语言)" }, v: "1", d: { en: "natural-language query", ar: "استعلام بلغة طبيعية", zh: "自然语言查询" } },
      { lab: { en: "Avg Turnaround", ar: "متوسط الإنجاز", zh: "平均周转" }, v: "2 d", d: { en: "request → draft", ar: "طلب ← مسودة", zh: "请求 → 草稿" } },
    ],
    [
      { lab: { en: "Reports by Status", ar: "التقارير حسب الحالة", zh: "按状态报告" }, aging: [["Issued", 100, "2"], ["Review", 50, "2"], ["Draft", 75, "3"]] },
      { lab: { en: "Sources Linked", ar: "مصادر مرتبطة", zh: "已链接来源" }, v: "6", d: { en: "traceable to UC-13/14/12/11/09/06", ar: "قابلة للتتبع", zh: "可追溯至各 UC" } },
      { lab: { en: "Auto-filled", ar: "تعبئة تلقائية", zh: "自动填充" }, v: "Yes", d: { en: "from approved data", ar: "من بيانات معتمدة", zh: "源自批准数据" }, up: true },
      { lab: { en: "On-time Issuance", ar: "الإصدار في الوقت", zh: "按时发布率" }, v: "96%", d: { en: "vs schedule", ar: "مقابل الجدول", zh: "对计划" }, up: true },
    ],
  ],
  orch: {
    uc: "UC-10", run: "#1100", agent: { en: "Reporting agent", ar: "وكيل التقارير", zh: "报告智能体" },
    chips: ["scope: Q2 2026", "dept: Reporting", "policy: templates"],
    defaultPrompt: { en: "Compile the G-06 quarterly report from approved sources, generate narrative commentary, and prepare the executive summary for review.", ar: "جمّع التقرير الربعي ج-06 من المصادر المعتمدة، وأنشئ التعليق السردي، وجهّز الملخص التنفيذي للمراجعة.", zh: "从批准来源汇编 G-06 季度报告,生成叙述性评述,并准备供复核的执行摘要。" },
    startLog: { en: "Orchestrator started — compiling quarterly report & commentary (UC-10)", ar: "بدأ المنسّق — تجميع التقرير الربعي والتعليق", zh: "编排器已启动——汇编季度报告与评述(UC-10)" },
    reviewLog: { en: "Draft ready — quarterly report & executive summary await sign-off", ar: "المسودة جاهزة — التقرير الربعي والملخص بانتظار التوقيع", zh: "草稿就绪——季度报告与执行摘要等待签核" },
    approveLog: { en: "Report approved and issued; executive summary published", ar: "اعتُمد التقرير وصدر؛ ونُشر الملخص التنفيذي", zh: "报告已批准并发布;执行摘要已发布" },
    returnLog: { en: "Report returned to the Reporting agent for rework", ar: "أُعيد التقرير لوكيل التقارير", zh: "报告已退回报告智能体重新处理" },
    prompts: [{ t: { en: "Compile quarterly report", ar: "تجميع التقرير الربعي", zh: "汇编季度报告" }, s: { en: "G-06 · Q2", ar: "ج-06 · ر2", zh: "G-06 · Q2" } }, { t: { en: "Generate narrative commentary", ar: "إنشاء التعليق السردي", zh: "生成叙述性评述" }, s: { en: "all KPIs", ar: "كل المؤشرات", zh: "全部 KPI" } }, { t: { en: "Prepare executive summary", ar: "تجهيز الملخص التنفيذي", zh: "准备执行摘要" }, s: { en: "leadership", ar: "للقيادة", zh: "面向领导" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull approved data", ar: "سحب البيانات المعتمدة", zh: "拉取批准数据" }, s: { en: "6 sources validated · 0.6s", ar: "6 مصادر مُتحقّقة · 0.6 ث", zh: "6 来源已校验 · 0.6s" } },
      { code: "UC-10", t: { en: "build report & dashboard", ar: "بناء التقرير ولوحة المعلومات", zh: "构建报告与仪表盘" }, s: { en: "tables & indicators auto-filled", ar: "جداول ومؤشرات تلقائية", zh: "表格与指标自动填充" } },
      { code: "UC-06", t: { en: "add narrative & alerts", ar: "إضافة السرد والتنبيهات", zh: "添加评述与告警" }, s: { en: "commentary + variances", ar: "تعليق + انحرافات", zh: "评述 + 偏差" } },
      { code: "UC-10", t: { en: "prepare executive summary", ar: "تجهيز الملخص التنفيذي", zh: "准备执行摘要" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "The G-06 quarterly report and executive summary require sign-off before issuance (2 reports in review).", ar: "يتطلب التقرير الربعي ج-06 والملخص التنفيذي التوقيع قبل الإصدار (تقريران قيد المراجعة).", zh: "G-06 季度报告与执行摘要需签核后方可发布(2 份报告在复核中)。" },
    approveLabel: { en: "Approve & issue", ar: "اعتماد وإصدار", zh: "批准并发布" },
    approvedChip: { en: "Approved · report issued", ar: "معتمد · صدر التقرير", zh: "已批准 · 报告已发布" },
    diff: [
      { k: "rem", t: { en: "quarterly report · draft", ar: "التقرير الربعي · مسودة", zh: "季度报告 · 草稿" } },
      { k: "add", t: { en: "quarterly report · issued (PDF/Word)", ar: "التقرير الربعي · صادر", zh: "季度报告 · 已发布(PDF/Word)" } },
      { k: "rem", t: { en: "narrative commentary · missing", ar: "التعليق السردي · مفقود", zh: "叙述性评述 · 缺失" } },
      { k: "add", t: { en: "narrative commentary · generated", ar: "التعليق السردي · مُنشأ", zh: "叙述性评述 · 已生成" } },
    ],
    returnBody: { en: "Report sent back to the Reporting agent. Edit the prompt and run again.", ar: "أُعيد التقرير لوكيل التقارير. عدّل الطلب وأعد التشغيل.", zh: "报告已退回报告智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Approve & issue G-06 quarterly report", ar: "اعتماد وإصدار التقرير الربعي ج-06", zh: "批准并发布 G-06 季度报告" }, owner: "Maha Al-Subaie", role: { en: "Reporting Lead", ar: "قائدة التقارير", zh: "报告负责人" }, phone: "+966 55 901 3326" },
      { act: { en: "Publish executive summary to leadership", ar: "نشر الملخص التنفيذي للقيادة", zh: "向领导层发布执行摘要" }, owner: "Omar Al-Bishi", role: { en: "Narrative Officer", ar: "مسؤول السرد", zh: "叙述专员" }, phone: "+966 50 447 8852" },
      { act: { en: "Link sources & record issue log", ar: "ربط المصادر وتسجيل الإصدار", zh: "链接来源并记录发布日志" }, owner: "Nada Al-Otaibi", role: { en: "Reports Analyst", ar: "محللة التقارير", zh: "报告分析师" }, phone: "+966 53 220 6691" },
    ],
  },
};


function FpaWorkspace() { return <DeptWorkspace cfg={WS_CFG_FPA} configRoute="fpawork" />; }
function AuditWorkspace() { return <DeptWorkspace cfg={WS_CFG_AUDIT} configRoute="audwork" />; }
function BudgetExecWorkspace() { return <DeptWorkspace cfg={WS_CFG_BUDEXEC} configRoute="buwork" />; }
function PlanningWorkspace() { return <DeptWorkspace cfg={WS_CFG_PLANNING} configRoute="plnwork" />; }
function EntitlementsWorkspace() { return <DeptWorkspace cfg={WS_CFG_ENT} configRoute="entwork" />; }
function AccountingWorkspace() { return <DeptWorkspace cfg={WS_CFG_ACCT} configRoute="acctwork" />; }
function CostWorkspace() { return <DeptWorkspace cfg={WS_CFG_COST} configRoute="costwork" />; }
function ComplianceWorkspace() { return <DeptWorkspace cfg={WS_CFG_COMPLIANCE} configRoute="compwork" />; }
function ReportingWorkspace() { return <DeptWorkspace cfg={WS_CFG_REPORTING} configRoute="frepwork" />; }

function Group02RoutePage({ kind }) {
  const store = useStore();
  const { tr, route, setRoute, setBackRoute, backRoute, setDeptSub, setAlertsOpen, group02, updateGroup02, setPerfJump } = store;
  const navigate = (nextRoute, focusTarget) => {
    if (focusTarget) updateGroup02("context", { focusTarget });
    setBackRoute(route);
    setRoute(nextRoute);
  };
  const onBack = () => {
    const target = backRoute || (kind === "query" ? "plnwork" : "plnwork");
    setBackRoute(null);
    setRoute(target);
  };
  const common = {
    tr,
    state: group02,
    update: updateGroup02,
    navigate,
    onBack,
    onAlerts: () => setAlertsOpen(true),
    onSmartQuery: () => navigate("g02query"),
  };
  if (kind === "cost") return <ProjectCostPage {...common} />;
  if (kind === "housing") return <HousingSupportPage {...common} />;
  if (kind === "forecast") return <FutureObligationsPage {...common} />;
  if (kind === "scenario") return <ScenarioDecisionPage {...common} openPerformance={() => { setPerfJump({ tab: "dash" }); setBackRoute("plnscenario"); setRoute("perf"); }} />;
  return <SmartQueryAuditPage {...common} />;
}

/* =========================================================================
   Reports
   ========================================================================= */
function Reports() {
  const { t, tr, reports, log } = useStore();
  const stMap = { pub: t("uc_pub"), appr: t("uc_appr"), review: t("uc_inrev") };
  return (<div className="fade">
    <PageHeader title={t("nav_reports")} sub={t("rep_sub")} />
    <Section title={t("nav_reports")}>
      {reports.length === 0 ? <div className="muted">{t("noReports")}</div>
        : (<table className="tbl"><thead><tr><th>{t("rep_title")}</th><th>{t("rep_cov")}</th><th>{t("rep_conf")}</th><th>{t("rep_time")}</th><th>{t("rep_ref")}</th></tr></thead>
          <tbody>{reports.map((r, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{t(r.name)} {r.status && <span className="tag" style={{ marginInlineStart: 6 }}>{stMap[r.status] || ""}</span>}</td><td>{tr(SCOPE)}</td><td>{r.conf === "—" ? "—" : r.conf + "%"}</td><td className="muted">{r.ts}</td><td className="wo">{r.ref}</td></tr>))}</tbody></table>)}
    </Section>
    <Section title={t("agentLog")}>{log.length === 0 ? <div className="muted">—</div>
      : (<div className="timeline">{log.slice(0, 12).map(e => (<div className="ev" key={e.id}><div style={{ fontSize: 12.5 }}><b className="mono" style={{ color: "var(--green-dark)" }}>{e.ts}</b> · {e.text}</div></div>))}</div>)}</Section>
  </div>);
}

/* =========================================================================
   App root
   ========================================================================= */
const Uc06App = React.lazy(() => import("./uc06/Uc06App.jsx"));
class EmbedErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("Embedded analysis crashed:", err, info); }
  render() {
    if (this.state.err) {
      return (<div style={{ padding: 32, fontSize: 14, color: "#b91c1c", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>{({ en: "This analysis view failed to render.", ar: "تعذّر عرض هذا التحليل.", zh: "此分析视图渲染失败。" }[(typeof document !== "undefined" && document.documentElement.lang) || "en"]) || "This analysis view failed to render."}</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#374151", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>{String((this.state.err && this.state.err.stack) || this.state.err)}</pre>
      </div>);
    }
    return this.props.children;
  }
}
function Shell() {
  const { t, tr, route, log, pushLog, lang, setRoute, setDeptSub, perfJump, setPerfJump, backRoute, setBackRoute, alertsOpen, setAlertsOpen, group02, updateGroup02 } = useStore();
  useEffect(() => { const msgs = ["log_idle", "log_scan", "log_route"]; const id = setInterval(() => pushLog(msgs[Math.floor(Math.random() * msgs.length)]), 9000); return () => clearInterval(id); }, []);
  useEffect(() => { if (log.length === 0) pushLog("log_scan"); }, []);
  // count-up the big KPI numbers on each page (skips embedded UC-06 + reduced-motion)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => {
      const els = document.querySelectorAll(".content .dw-kpi > .v, .content .kmbig, .content .wb-big");
      els.forEach(el => {
        if (el.dataset.cu || el.children.length) return;
        const raw = (el.textContent || "").trim();
        const m = raw.match(/^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
        if (!m) return;
        const pre = m[1], numStr = m[2], suf = m[3];
        const target = parseFloat(numStr.replace(/,/g, ""));
        if (!isFinite(target)) return;
        const dec = (numStr.split(".")[1] || "").length;
        el.dataset.cu = "1";
        const dur = 900, t0 = performance.now();
        const fmt = v => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + suf;
        const step = now => {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(target * e);
          if (p < 1) requestAnimationFrame(step); else { el.textContent = raw; }
        };
        requestAnimationFrame(step);
      });
    }, 90);
    return () => clearTimeout(id);
  }, [route]);
  // The embedded UC-06 module no longer mutates the global document direction,
  // but keep our own direction asserted whenever we leave the embedded routes.
  useEffect(() => { if (route !== "perf" && route !== "rcreports" && route !== "budexec") { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; } }, [route, lang]);
  // Ported colleague pages, driven by OUR sidebar (their own left menu hidden):
  //   perf      -> Financial Performance Analysis Department
  //   rcreports -> Revenue Collection Department (report registry)
  if (route === "perf" || route === "rcreports" || route === "budexec") {
    const sub = route === "rcreports" ? "revenueCollection" : route === "budexec" ? "budgetExecution" : "performanceAnalysis";
    const initTab = perfJump && perfJump.tab ? perfJump.tab : undefined;
    // When opened via a host deep-link (Open draft / Generate Executive Summary),
    // the embedded page's Back exits to the route the host recorded.
    const onBack = backRoute ? () => { const b = backRoute; setBackRoute(null); setRoute(b); } : undefined;
    return (<>
      <TopBar />
      <div className="shell" style={{ height: "calc(100vh - var(--topbar-h))", minHeight: 0, overflow: "hidden" }}>
        <Sidebar />
        <div className="uc06-root g02-performance-embed" style={{ flex: "1 1 auto", minWidth: 0, height: "100%", overflow: "hidden" }}>
          {route === "perf" && <div className="g02-performance-context">
            <div><span>{tr({ en: "Active decision context", ar: "سياق القرار النشط", zh: "当前决策上下文" })}</span><b>FY{group02.context.fiscalYear} · {group02.context.scopeType}</b></div>
            <div><span>{tr({ en: "Budget baseline", ar: "خط أساس الميزانية", zh: "预算基线" })}</span><b>{group02.baseline.versionId}</b></div>
            <div><span>{tr({ en: "Approved scenario", ar: "السيناريو المعتمد", zh: "已批准情景" })}</span><b>{group02.scenario.status === "approved" ? group02.scenario.versionId : tr({ en: "Awaiting approval", ar: "بانتظار الاعتماد", zh: "等待批准" })}</b></div>
            <div className={group02.scenario.status === "approved" ? "good" : "warn"}>{tr(group02.scenario.status === "approved" ? { en: "Execution tracking on", ar: "تتبع التنفيذ مفعل", zh: "执行跟踪已开启" } : { en: "Draft context", ar: "سياق مسودة", zh: "草稿上下文" })}</div>
            <div className="feedback"><button onClick={() => updateGroup02("baseline", { performanceFeedbackId: "PF-2027-Q2-064", priorityGap: 0.72 }, { type: "Performance feedback", detail: "UC-06 execution variance fed into the next FY2027 planning baseline." })}>{tr({ en: "Feed variance to next baseline", ar: "إرسال الانحراف إلى خط الأساس التالي", zh: "回写偏差到下一轮基线" })}</button></div>
          </div>}
          {route === "perf" && <div className="g02-performance-ai-ready">
            <span>{tr({ en: "AI data preparation", ar: "تحضير البيانات بالذكاء الاصطناعي", zh: "AI 数据准备" })}</span>
            <p>{tr({ en: `AI has prepared the performance metrics, variance drivers, lagging entities, and planning feedback reference ${group02.baseline.performanceFeedbackId || "PF-2027-Q2-064"} for leadership review.`, ar: `أعد الذكاء الاصطناعي مؤشرات الأداء ومحركات الانحراف والجهات المتأخرة ومرجع تغذية التخطيط ${group02.baseline.performanceFeedbackId || "PF-2027-Q2-064"} لمراجعة القيادة.`, zh: `AI 已经准备好绩效指标、偏差驱动、落后实体以及规划反馈编号 ${group02.baseline.performanceFeedbackId || "PF-2027-Q2-064"}，可用于领导复核。` })}</p>
          </div>}
          <div className="g02-performance-body">
            <React.Suspense fallback={<div style={{ padding: 40, fontSize: 15, color: "#4b5563" }}>Loading…</div>}>
              <EmbedErrorBoundary key={sub}>
                <Uc06App embedded subDept={sub} appLang={lang} initialTab={initTab} autoGenerate={!!(perfJump && perfJump.generate)} onBack={onBack} onConsumeJump={() => setPerfJump(null)} key={sub} />
              </EmbedErrorBoundary>
            </React.Suspense>
          </div>
        </div>
      </div>
    </>);
  }
  let page = null;
  if (route === "hub") page = <Hub />;
  else if (route === "chat") page = <ChatAnalysis />;
  else if (route === "monitor") page = <Monitoring />;
  else if (route === "budget") page = <Storyline story={STORY_BUDGET} title={t("j_bud_n")} sub={t("j_bud_b")} />;
  else if (route === "claims") page = <Storyline story={STORY_CLAIMS} title={t("j_clm_n")} sub={t("j_clm_b")} />;
  else if (route === "planning") page = <Storyline story={STORY_PLANNING} title={t("j_plan_n")} sub={t("j_plan_b")} />;
  else if (route === "plnbudget") page = <BudgetPlanningConsolePage />;
  else if (route === "budexec-space") page = <BudgetExecutionFiscalSpacePage />;
  else if (route === "plncost") page = <Group02RoutePage kind="cost" />;
  else if (route === "plnhousing") page = <Group02RoutePage kind="housing" />;
  else if (route === "plnforecast") page = <Group02RoutePage kind="forecast" />;
  else if (route === "budexec-forecast") page = <BudgetExecutionForecastPage />;
  else if (route === "plnscenario") page = <Group02RoutePage kind="scenario" />;
  else if (route === "g02query") page = <Group02RoutePage kind="query" />;
  else if (route === "reporting") page = <Storyline story={STORY_REPORTING} title={t("j_rep_n")} sub={t("j_rep_b")} />;
  else if (route === "revassets") page = <Storyline story={STORY_REVENUE_ASSETS} title={t("j_rev_n")} sub={t("j_rev_b")} />;
  else if (route === "rcwork") page = <RcWorkspace />;
  else if (route === "rcbench") page = <RcWorkbench />;
  else if (route === "rcdata") page = <RcDataFlow />;
  else if (route === "rcdatav1") page = <RcDataFlowV1 />;
  else if (route === "g02flow") page = <FlowG02 />;
  else if (route === "g02fpaflow") page = <FlowG02Fpa />;
  else if (route === "g03flow") page = <FlowG03 />;
  else if (route === "g04flow") page = <FlowG04 />;
  else if (route === "g04entflow") page = <FlowG04Ent />;
  else if (route === "g04audflow") page = <FlowG04Aud />;
  else if (route === "g05flow") page = <FlowG05 />;
  else if (route === "g05repflow") page = <FlowG05Rep />;
  else if (route === "g05compflow") page = <FlowG05Comp />;
  else if (route === "g05costflow") page = <FlowG05Cost />;
  else if (route === "g05acctflow") page = <FlowG05Acct />;
  else if (route === "aswork") page = <AssetsWorkspace />;
  else if (route === "asbench") page = <AssetsWorkbench />;
  else if (route === "csfunds") page = <CostFundsConsole />;
  else if (route === "compmemo") page = <ComplianceRuling />;
  else if (route === "alerts") page = <AlertsCenter />;
  else if (route === "budexec17") page = <BudgetExecutionTrackingPage />;
  else if (route === "entclaims08") page = <EntitlementsClaimsPage />;
  else if (route === "entclose09") page = <FinancialCloseSettlementsPage />;
  else if (route === "fpawork") page = <FpaWorkspace />;
  else if (route === "audwork") page = <AuditWorkspace />;
  else if (route === "buwork") page = <BudgetExecWorkspace />;
  else if (route === "plnwork") page = <PlanningWorkspace />;
  else if (route === "entwork") page = <EntitlementsWorkspace />;
  else if (route === "acctwork") page = <AccountingWorkspace />;
  else if (route === "costwork") page = <CostWorkspace />;
  else if (route === "compwork") page = <ComplianceWorkspace />;
  else if (route === "frepwork") page = <ReportingWorkspace />;
  else if (route === "reports") page = <ReportHub />;
  else if (route === "budexec-reports") page = <BudgetExecutionReportsPage />;
  else page = <Hub />;
  const pageSmartQuery = PAGE_SMART_QUERY[route];
  return (<><TopBar /><div className="shell"><Sidebar /><div className="content">{page}</div></div><AgentLog /><ReleaseNotes />
    {pageSmartQuery && <SmartQueryFab route={route} scope={pageSmartQuery.scope} prompts={pageSmartQuery.prompts} />}
    {alertsOpen && <div className="al-overlay" onClick={() => setAlertsOpen(false)}>
      <div className="al-drawer" onClick={e => e.stopPropagation()}><AlertsCenter drawer onClose={() => setAlertsOpen(false)} /></div>
    </div>}
  </>);
}
const RELEASES = [
  { v: "v0.9", d: "2026-06-22", cur: true, items: {
    en: ["Orchestrator turned into a chat: type a request, watch the agent timeline run, then approve / return / view-diff in a human-in-the-loop review", "AI Narratives & Q&A answers in-place; Billing-Gap Focus List rows open a contract-specific Q&A", "New Multi-Agent Flow diagram (dataset & orchestration drill-down) with faithful connector lines", "Commentary Review workspace reframed; AI Co-pilot chat now returns optimized drafts", "Sidebar locked to the two live departments; clickable release notes added"],
    ar: ["تحوّل المنسّق إلى دردشة: اكتب طلباً، وشاهد الخط الزمني للوكلاء، ثم اعتمد / أعد / اعرض الفرق ضمن مراجعة بشرية", "السرد والأسئلة يجيب في مكانه؛ صفوف قائمة فجوة الفوترة تفتح أسئلة خاصة بالعقد", "مخطط تدفّق متعدد الوكلاء جديد بخطوط ربط دقيقة", "إعادة تأطير مساحة مراجعة التعليق؛ ومساعد الدردشة يعيد مسودات محسّنة", "تقييد القائمة الجانبية بالإدارتين الفعّالتين؛ وإضافة ملاحظات الإصدار القابلة للنقر"],
    zh: ["编排器改为聊天:输入请求→观看智能体时间线运行→在人工审批中批准/退回/查看差异", "AI 叙述与问答就地作答;开票缺口重点清单的每行可打开针对该合同的问答", "新增多智能体流程图(数据集与编排下钻),连线完整还原", "评述复核工作区重新加框;AI 副驾驶聊天返回优化后的草稿", "侧栏锁定为两个上线部门;新增可点击的更新日志"] } },
  { v: "v0.8", d: "2026-06-18", items: {
    en: ["Added the Analysis Workbench: filters, multi-agent panels, results and next steps", "Two-level flow: workspace → Start analysis → workbench", "Top KPI row and 65% / 35% Agent Plaza / Orchestrator layout"],
    ar: ["إضافة منصة التحليل: عوامل تصفية، لوحات متعددة الوكلاء، نتائج وخطوات تالية", "تدفّق من مستويين: مساحة العمل ← بدء التحليل ← المنصة", "صف مؤشرات علوي وتخطيط 65٪ / 35٪"],
    zh: ["新增分析工作台:筛选、多智能体面板、结果与后续步骤", "两级流程:工作区 → 开始分析 → 工作台", "顶部 KPI 指标行与 65% / 35% 的智能体广场 / 编排器布局"] } },
  { v: "v0.7", d: "2026-06-12", items: {
    en: ["Department-accordion sidebar with the G-06 downstream storyline", "Trilingual EN / AR / ZH with ?ln= and ?uc= URL toggles", "BRD-faithful 13 agents and 13 source systems"],
    ar: ["قائمة جانبية بأكورديون الإدارات مع مسار ج-06 اللاحق", "ثلاثية اللغة EN / AR / ZH مع مفاتيح ?ln= و ?uc=", "13 وكيلاً و13 نظام مصدر وفق وثيقة المتطلبات"],
    zh: ["部门手风琴侧栏与 G-06 下游故事线", "三语 EN / AR / ZH,支持 ?ln= 与 ?uc= URL 传参", "忠于 BRD 的 13 个智能体与 13 个源系统"] } },
];
function ReleaseNotes() {
  const { tr, lang } = useStore();
  const [open, setOpen] = useState(false);
  return (<><button className="buildstamp" onClick={() => setOpen(true)} title={tr({ en: "Release notes", ar: "ملاحظات الإصدار", zh: "更新日志" })}>build {BUILD_TIME} · {RELEASES[0].v}</button>
    {open && <div className="rn-overlay" onClick={() => setOpen(false)}>
      <div className="rn-modal" onClick={e => e.stopPropagation()}>
        <div className="rn-head"><b>{tr({ en: "Release Notes", ar: "ملاحظات الإصدار", zh: "更新日志" })}</b><button className="rn-x" onClick={() => setOpen(false)}>✕</button></div>
        <div className="rn-body">{RELEASES.map((r, i) => (<div className={"rn-rel" + (r.cur ? " cur" : "")} key={i}>
          <span className="rn-dot" />
          <div className="rn-rc"><div className="rn-vh"><span className="rn-v">{r.v}</span><span className="rn-d">{r.d}</span>{r.cur && <span className="rn-badge">{tr({ en: "current", ar: "الحالي", zh: "当前" })}</span>}</div>
            <ul>{(r.items[lang] || r.items.en).map((it, j) => <li key={j}>{it}</li>)}</ul></div>
        </div>))}</div>
      </div>
    </div>}
  </>);
}
function Root() { const { user } = useStore(); return user ? <Shell /> : <Login />; }
function App() { return (<StoreProvider><Root /></StoreProvider>); }
export default App;
