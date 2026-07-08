import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import * as RC from "recharts";
import { findPageConfigComponent, getPageConfigComponent, localizedComponentNote, localizedComponentTitle } from "../data/presentationConfig.js";
import {
  G02_COST_DRIVERS,
  G02_FORECAST_ITEMS,
  G02_FORECAST_TIMELINE,
  G02_HOUSING_OPTIONS,
  G02_HOUSING_REGIONS,
  G02_PAGE_HEADERS,
  G02_PROJECTS,
} from "./model";

const COPY = {
  back: { en: "Planning workspace", ar: "مساحة عمل التخطيط", zh: "规划工作台" },
  exceptions: { en: "Exception detection", ar: "كشف الاستثناءات", zh: "异常检测" },
  smart: { en: "Smart query", ar: "الاستعلام الذكي", zh: "智能问数" },
  close: { en: "Close", ar: "إغلاق", zh: "关闭" },
  source: { en: "Source & confidence", ar: "المصدر والثقة", zh: "来源与置信度" },
};

const fmtB = (value) => `SAR ${Number(value).toFixed(2)}B`;
const fmtM = (value) => `SAR ${Math.round(Number(value) * 1000)}M`;
const shiftForecastPeriod = (period, offset) => period.replace(/^(\d{4})\s(Q|M)(\d+)/, (_, year, type, index) => `${Number(year) + offset} ${type}${index}`);
const shiftForecastRef = (id, baselineYear) => id.replace("2027", String(baselineYear)).replace("2026", String(baselineYear - 1));
const riskCopy = {
  healthy: { en: "Low risk", ar: "مخاطر منخفضة", zh: "低风险" },
  watch: { en: "Needs attention", ar: "يتطلب الانتباه", zh: "需要关注" },
  tight: { en: "High risk", ar: "مخاطر مرتفعة", zh: "高风险" },
};
function pageHeader(pageKey, fallback) {
  const configured = getPageConfigComponent(pageKey, `${pageKey}.title`);
  if (configured) {
    return {
      id: pageKey,
      title: localizedComponentTitle(configured, fallback.title),
      sub: localizedComponentNote(configured, fallback.sub),
    };
  }
  return (G02_PAGE_HEADERS || []).find((item) => item.id === pageKey) || fallback;
}
function G02Header({ tr, title, sub, onBack, onAlerts, backLabel, storyline }) {
  return (
    <div className="g2-pagehead">
      <div className="g2-pagecopy">
        <div className="g2-titlebar"><button className="pg-back" onClick={onBack}>‹</button><h1>{tr(title)}</h1></div>
        <p>{tr(sub)}</p>
      </div>
      <div className="g2-header-side">
        <div className="g2-headactions">
          <button className="btn danger sm" onClick={onAlerts}>{tr(COPY.exceptions)}</button>
        </div>
        {storyline}
      </div>
    </div>
  );
}

function ContextBar({ tr, state, status, statusTone = "good", extra }) {
  const context = state.context;
  return (
    <div className="g2-contextbar">
      <div><span>{tr({ en: "Planning cycle", ar: "دورة التخطيط", zh: "规划周期" })}</span><b>FY{context.fiscalYear}</b></div>
      <div><span>{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</span><b>{context.scopeType}</b></div>
      <div><span>{tr({ en: "Data version", ar: "نسخة البيانات", zh: "数据版本" })}</span><b>{context.dataVersionId}</b></div>
      <div><span>{tr({ en: "Budget baseline", ar: "خط أساس الميزانية", zh: "预算基线" })}</span><b>{state.baseline.versionId}</b></div>
      {extra}
      <div className="g2-context-status"><span>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</span><strong className={`g2-state ${statusTone}`}>{status}</strong></div>
    </div>
  );
}

function KpiStrip({ items, onSelect, active, configRoute }) {
  const resolvedItems = configRoute ? items.map((item, index) => {
    const configured = findPageConfigComponent(configRoute, {
      componentKeys: [`kpi.${index + 1}`, item.id],
      label: item.label,
      types: ["kpi_card", "carousel_metric"],
    });
    if (!configured) return item;
    return {
      ...item,
      label: localizedComponentTitle(configured, item.label),
      value: configured.value || item.value,
      note: localizedComponentNote(configured, item.note),
    };
  }) : items;
  return (
    <div className="g2-kpis">
      {resolvedItems.map((item) => (
        <button key={item.id} className={`g2-kpi ${item.tone || ""} ${active === item.id ? "on" : ""}`} onClick={() => onSelect && onSelect(item.id)}>
          <span>{item.label}</span>
          <b>{item.value}</b>
          <small>{item.note}</small>
        </button>
      ))}
    </div>
  );
}

function RiskPill({ tr, risk }) {
  return <span className={`g2-risk ${risk}`}>{tr(riskCopy[risk] || riskCopy.watch)}</span>;
}

function G02Section({ title, sub, right, children, className = "" }) {
  return (
    <section className={`g2-section ${className}`}>
      <div className="g2-section-head">
        <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
        {right && <div className="g2-section-actions">{right}</div>}
      </div>
      {children}
    </section>
  );
}

function G02Modal({ tr, title, sub, onClose, children, wide = false }) {
  return createPortal(
    <div className="g2-modal-overlay" onClick={onClose}>
      <div className={`g2-modal ${wide ? "wide" : ""}`} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="g2-modal-head">
          <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
          <button className="btn ghost sm" onClick={onClose}>{tr(COPY.close)}</button>
        </div>
        <div className="g2-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function DecisionFooter({ children, guard, guardTone = "ok" }) {
  return (
    <div className="g2-decision-footer">
      <div className={`g2-guard ${guardTone}`}>{guard}</div>
      <div className="g2-footer-actions">{children}</div>
    </div>
  );
}

function AIReadyNotice({ tr, children, tags = [] }) {
  return (
    <div className="g2-ai-ready">
      <div className="g2-ai-ready-copy">
        <span>{tr({ en: "AI data preparation", ar: "تحضير البيانات بالذكاء الاصطناعي", zh: "AI 数据准备" })}</span>
        <p>{children}</p>
      </div>
      {tags.length > 0 && <div className="g2-ai-tags">{tags.map((tag) => <em key={tr(tag)}>{tr(tag)}</em>)}</div>}
    </div>
  );
}

const STORYLINE_FOUNDATION = { id: "data", route: "bench01", label: { en: "Unified data (UC-01)", ar: "بيانات موحّدة (UC-01)", zh: "统一数据 (UC-01)" } };
const STORYLINE_MAIN_STEPS = [
  { id: "budget", route: "plnbudget", label: { en: "Budget planning", ar: "تخطيط الميزانية", zh: "预算规划" } },
  { id: "forecast", route: "plnforecast", label: { en: "Funding forecast", ar: "تنبؤ التمويل", zh: "资金预测" } },
  { id: "scenario", route: "plnscenario", label: { en: "Scenario simulation", ar: "محاكاة السيناريو", zh: "情景模拟" } },
  { id: "performance", route: "perf", label: { en: "Performance reports", ar: "الأداء والتقارير", zh: "绩效报告" } },
];
const STORYLINE_DRILL_STEPS = [
  { id: "cost", route: "plncost", label: { en: "Cost impact", ar: "أثر التكلفة", zh: "成本影响" } },
  { id: "housing", route: "plnhousing", label: { en: "Housing impact", ar: "أثر الإسكان", zh: "住房影响" } },
];
const STORYLINE_ORDER = ["budget", "forecast", "scenario", "performance"];
function storylineState(id, current) {
  if (id === current) return "focus";
  if ((current === "cost" || current === "housing") && id === "budget") return "in";
  const currentIndex = STORYLINE_ORDER.indexOf(current);
  const stepIndex = STORYLINE_ORDER.indexOf(id);
  if (currentIndex >= 0 && stepIndex >= 0 && stepIndex < currentIndex) return "in";
  return "down";
}
export function G02BusinessStoryline({ tr, current, navigate, className = "" }) {
  const POS = { up: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, here: { en: "THIS", ar: "هذه", zh: "本环节" }, down: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" } };
  const go = (route) => { if (navigate && route) navigate(route); };
  const STEPS = [STORYLINE_FOUNDATION, STORYLINE_MAIN_STEPS[0], ...STORYLINE_DRILL_STEPS, ...STORYLINE_MAIN_STEPS.slice(1)];
  const curIdx = STEPS.findIndex((step) => step.id === current);
  const posOf = (i) => (curIdx < 0 ? "down" : i < curIdx ? "up" : i === curIdx ? "here" : "down");
  return (
    <div className={`wb-chain g2-wb-chain ${className}`}>
      <span className="wb-clab">{tr({ en: "G-02 CHAIN", ar: "سلسلة ج-02", zh: "G-02 链路" })}</span>
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          {i > 0 && <span className="wb-carr">→</span>}
          <span className={"wb-cpill g2-cpill" + (i === curIdx ? " here" : "")} onClick={() => go(step.route)} title={tr(step.label)}>
            <span className="wb-cpos">{tr(POS[posOf(i)])}</span>{tr(step.label)}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function DataReadinessDrawer({ tr, state, onClose, onAlerts }) {
  const readiness = state.readiness;
  const status = readiness.status === "ready_with_exceptions"
    ? tr({ en: "Ready with exceptions", ar: "جاهز مع استثناءات", zh: "存在例外但可用" })
    : tr({ en: "Ready", ar: "جاهز", zh: "已就绪" });
  return createPortal(
    <div className="g2-drawer-overlay" onClick={onClose}>
      <aside className="g2-drawer" onClick={(event) => event.stopPropagation()} aria-label={tr({ en: "Data readiness details", ar: "تفاصيل جاهزية البيانات", zh: "数据就绪详情" })}>
        <div className="g2-drawer-head">
          <div>
            <span>{tr({ en: "Planning context", ar: "سياق التخطيط", zh: "规划上下文" })}</span>
            <h2>{tr({ en: "Data readiness & quality", ar: "جاهزية البيانات وجودتها", zh: "数据就绪与质量" })}</h2>
          </div>
          <button className="btn ghost sm" onClick={onClose}>{tr(COPY.close)}</button>
        </div>
        <div className="g2-drawer-body">
          <div className="g2-readiness-hero">
            <div><span>{tr({ en: "Current status", ar: "الحالة الحالية", zh: "当前状态" })}</span><b>{status}</b></div>
            <strong>{readiness.completeness}%</strong>
          </div>
          <div className="g2-mini-grid three">
            <div><span>{tr({ en: "Completeness", ar: "الاكتمال", zh: "完整率" })}</span><b>{readiness.completeness}%</b></div>
            <div><span>{tr({ en: "Freshness", ar: "حداثة البيانات", zh: "新鲜度" })}</span><b>{readiness.freshness}%</b></div>
            <div><span>{tr({ en: "Source coverage", ar: "تغطية المصادر", zh: "来源覆盖" })}</span><b>{readiness.coverage}%</b></div>
          </div>
          <G02Section title={tr({ en: "Source systems", ar: "أنظمة المصدر", zh: "来源系统" })}>
            <div className="g2-source-list">
              {readiness.sources.map((source) => (
                <div key={source.id} className="g2-source-row">
                  <div><b>{source.name}</b><span>{tr({ en: "Daily planning feed", ar: "تغذية تخطيط يومية", zh: "每日规划数据" })}</span></div>
                  <strong>{source.freshness}%</strong>
                  <span className={`g2-state ${source.status === "ready" ? "good" : "warn"}`}>{source.status === "ready" ? tr({ en: "Ready", ar: "جاهز", zh: "就绪" }) : tr({ en: "Exception", ar: "استثناء", zh: "例外" })}</span>
                </div>
              ))}
            </div>
          </G02Section>
          <G02Section title={tr({ en: "Approved exceptions", ar: "الاستثناءات المعتمدة", zh: "已批准例外" })}>
            <div className="g2-callout warn">
              <b>{readiness.exceptions} {tr({ en: "exceptions do not block planning", ar: "استثناءان لا يمنعان التخطيط", zh: "项例外不阻断规划" })}</b>
              <p>{tr({ en: "Two project-intake records use the last approved market benchmark. Cost analysis will show reduced confidence until an analyst validates the new pack.", ar: "يستخدم سجلان من طلبات المشاريع آخر مرجع سوقي معتمد. سيعرض تحليل التكلفة مستوى ثقة أقل حتى يعتمد المحلل الحزمة الجديدة.", zh: "两条项目受理记录使用上一版已批准市场基准，成本分析会降低置信度，直到分析师确认新基准包。" })}</p>
            </div>
          </G02Section>
          <button className="btn sm" onClick={() => { onClose(); onAlerts(); }}>{tr({ en: "Review related exceptions", ar: "مراجعة الاستثناءات المرتبطة", zh: "查看相关异常" })}</button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

export function ProjectCostPage({ tr, state, update, navigate, onBack, onAlerts, onSmartQuery }) {
  const [projectId, setProjectId] = useState(state.cost.projectId || G02_PROJECTS[0].id);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [assumptionOpen, setAssumptionOpen] = useState(false);
  const [adjustment, setAdjustment] = useState(0);
  const [focusKpi, setFocusKpi] = useState("variance");
  const project = G02_PROJECTS.find((item) => item.id === projectId) || G02_PROJECTS[0];
  const currentEstimate = +(project.currentEstimate * (1 + adjustment / 100)).toFixed(3);
  const variance = +(((currentEstimate - project.benchmarkEstimate) / project.benchmarkEstimate) * 100).toFixed(1);
  const recommended = +(project.recommendedEstimate * (1 + adjustment / 200)).toFixed(3);
  const fiscalImpact = +(project.allocation - currentEstimate).toFixed(3);
  const driverDelta = [0.018, 0.014, 0.011, 0.009, 0.006, -0.01];
  const costVersionId = `CA-2027-${project.id.slice(-3)}-02`;
  const hasActiveCostReview = state.cost.versionId && state.cost.projectId === project.id;
  const pageCopy = pageHeader("plncost", {
    title: { en: "Project cost driver analysis", ar: "تحليل محركات تكلفة المشروع", zh: "项目成本驱动分析" },
    sub: { en: "Test whether the project estimate is reasonable, explain the drivers, and carry the reviewed amount into the funding forecast.", ar: "اختبر معقولية تقدير المشروع، واشرح المحركات، وانقل المبلغ المراجع إلى تنبؤ التمويل.", zh: "判断项目估算是否合理，解释成本驱动，并将评审金额带入资金预测。" },
  });

  const recordDecision = (decision, amount, nextStatus = "reviewed") => {
    update("cost", { status: nextStatus, versionId: costVersionId, projectId, decision, approvedEstimate: amount }, {
      type: "Project cost",
      detail: `${project.id} ${decision} at ${fmtM(amount)}.`,
    });
    update("context", { costAnalysisVersionId: costVersionId });
  };

  const includeCostInForecast = () => {
    if (state.cost.conflict) {
      recordDecision("escalated", null, "escalated");
      return;
    }
    if (!hasActiveCostReview) recordDecision("recommended_estimate", recommended);
    navigate("plnforecast", `cost:${hasActiveCostReview ? state.cost.versionId : costVersionId}`);
  };

  return (
    <div className="g2-page fade">
	      <G02Header
	        tr={tr}
	        title={pageCopy.title}
	        sub={pageCopy.sub}
        onBack={onBack}
        onAlerts={onAlerts}
        onSmartQuery={onSmartQuery}
        storyline={<G02BusinessStoryline
          tr={tr}
          current="cost"
          output={{ en: `Current: cost impact ${costVersionId}`, ar: `الحالي: أثر التكلفة ${costVersionId}` }}
          tags={[
            { en: "Budget baseline drill-down", ar: "تفصيل من خط أساس الميزانية" },
            { en: "Reviewed delta prepared", ar: "تم إعداد الفرق المراجع" },
          ]}
          navigate={navigate}
        />}
	      />
      <div className="g2-project-brief">
        <div className="g2-project-select">
          <span>{tr({ en: "Project request", ar: "طلب المشروع", zh: "项目申请" })}</span>
          <select value={projectId} onChange={(event) => { setProjectId(event.target.value); setAdjustment(0); }}>
            {G02_PROJECTS.map((item) => <option key={item.id} value={item.id}>{item.id} · {tr(item.name)}</option>)}
          </select>
        </div>
        <div className="g2-brief-meta"><span>{tr({ en: "Entity", ar: "الجهة", zh: "机构" })}</span><b>{tr(project.entity)}</b></div>
        <div className="g2-brief-meta"><span>{tr({ en: "Service", ar: "الخدمة", zh: "服务" })}</span><b>{tr(project.service)}</b></div>
        <div className="g2-brief-meta"><span>{tr({ en: "Location", ar: "الموقع", zh: "区域" })}</span><b>{tr(project.location)}</b></div>
        <div className="g2-brief-meta"><span>{tr({ en: "Scope", ar: "النطاق", zh: "规模" })}</span><b>{project.quantity} packages · {project.area}</b></div>
      </div>

      <AIReadyNotice
        tr={tr}
        tags={[
          { en: "Budget allocation linked", ar: "المخصص الميزاني مرتبط", zh: "预算额度已关联" },
          { en: "Historical projects benchmarked", ar: "تمت مقارنة المشاريع التاريخية", zh: "历史项目已对标" },
          { en: "Market reference matched", ar: "تمت مطابقة مرجع السوق", zh: "市场基准已匹配" },
          { en: "Delta can feed forecast", ar: "يمكن إدخال الفرق في التنبؤ", zh: "差额可进入预测" },
        ]}
      >
        {tr({ en: `AI has linked the budget baseline allocation and prepared historical project benchmarks, market references, cost drivers, and the funding-forecast handoff package for ${project.id}.`, ar: `ربط الذكاء الاصطناعي مخصص خط أساس الميزانية وأعد مقارنات المشاريع التاريخية ومراجع السوق ومحركات التكلفة وحزمة التسليم لتنبؤ التمويل لـ ${project.id}.`, zh: `AI 已关联预算基线额度，并为 ${project.id} 完成历史项目、市场价格、成本驱动和资金预测交接包准备。` })}
      </AIReadyNotice>

      <KpiStrip
        configRoute="plncost"
        active={focusKpi}
        onSelect={setFocusKpi}
        items={[
          { id: "current", label: tr({ en: "Current estimate", ar: "التقدير الحالي", zh: "当前估算" }), value: fmtM(currentEstimate), note: tr({ en: "submitted project amount", ar: "قيمة المشروع المقدمة", zh: "项目申报金额" }) },
          { id: "benchmark", label: tr({ en: "Benchmark estimate", ar: "التقدير المرجعي", zh: "基准估算" }), value: fmtM(project.benchmarkEstimate), note: tr({ en: "history + market pack", ar: "السجل + حزمة السوق", zh: "历史 + 市场基准" }) },
          { id: "variance", label: tr({ en: "Cost variance", ar: "انحراف التكلفة", zh: "成本偏差" }), value: `+${variance}%`, note: tr({ en: "above benchmark", ar: "فوق المرجع", zh: "高于基准" }), tone: "warn" },
          { id: "recommended", label: tr({ en: "Recommended estimate", ar: "التقدير الموصى", zh: "建议估算" }), value: fmtM(recommended), note: tr({ en: "normalized driver set", ar: "محركات مطبعة", zh: "校正后的驱动集" }), tone: "good" },
          { id: "impact", label: tr({ en: "Fiscal impact vs allocation", ar: "الأثر المالي مقابل المخصص", zh: "相对额度财政影响" }), value: `${fiscalImpact < 0 ? "−" : "+"}${fmtM(Math.abs(fiscalImpact)).replace("SAR ", "SAR ")}`, note: tr({ en: "provisional allocation", ar: "المخصص المبدئي", zh: "相对暂定额度" }), tone: fiscalImpact < 0 ? "bad" : "good" },
          { id: "confidence", label: tr({ en: "Analysis confidence", ar: "ثقة التحليل", zh: "分析置信度" }), value: `${project.confidence}%`, note: tr({ en: "one benchmark exception", ar: "استثناء مرجعي واحد", zh: "一项基准例外" }) },
        ]}
      />

      <div className="g2-two-col cost">
        <G02Section title={tr({ en: "Cost variance bridge", ar: "جسر انحراف التكلفة", zh: "成本偏差桥" })} sub={tr({ en: "How the estimate moves from the benchmark to the submitted amount.", ar: "كيف ينتقل التقدير من المرجع إلى القيمة المقدمة.", zh: "展示估算如何从基准变化到申报金额。" })}>
          <div className="g2-waterfall">
            <div className="g2-waterfall-total"><span>{tr({ en: "Benchmark", ar: "المرجع", zh: "基准" })}</span><b>{fmtM(project.benchmarkEstimate)}</b></div>
            {G02_COST_DRIVERS.map((driver, index) => (
              <button key={driver.id} onClick={() => setSelectedDriver(driver)} className={driverDelta[index] < 0 ? "down" : "up"}>
                <span>{tr(driver.name)}</span><i style={{ width: `${Math.abs(driverDelta[index]) * 2200}px` }} /><b>{driverDelta[index] > 0 ? "+" : "−"}{fmtM(Math.abs(driverDelta[index]))}</b>
              </button>
            ))}
            <div className="g2-waterfall-total current"><span>{tr({ en: "Current estimate", ar: "التقدير الحالي", zh: "当前估算" })}</span><b>{fmtM(currentEstimate)}</b></div>
          </div>
        </G02Section>

        <G02Section title={tr({ en: "Benchmark position", ar: "الموقع مقابل المرجع", zh: "基准位置" })} sub={tr({ en: "Current unit prices against the approved reasonable range.", ar: "أسعار الوحدات الحالية مقابل النطاق المعقول المعتمد.", zh: "当前单价相对已批准合理区间的位置。" })} right={<button className="btn ghost sm" onClick={() => setAssumptionOpen(true)}>{tr({ en: "Adjust assumptions", ar: "ضبط الافتراضات", zh: "调整假设" })}</button>}>
          <div className="g2-benchmark-list">
            {G02_COST_DRIVERS.slice(0, 5).map((driver) => {
              const position = Math.min(98, Math.max(2, ((driver.current - driver.low) / (driver.high - driver.low)) * 100));
              return (
                <button key={driver.id} onClick={() => setSelectedDriver(driver)}>
                  <div><b>{tr(driver.name)}</b><span>{driver.low} - {driver.high}</span></div>
                  <div className="g2-range"><i /><strong style={{ insetInlineStart: `${position}%` }} /></div>
                  <em>{driver.current}</em>
                </button>
              );
            })}
          </div>
        </G02Section>
      </div>

      <G02Section title={tr({ en: "Cost driver detail", ar: "تفاصيل محركات التكلفة", zh: "成本驱动明细" })} sub={tr({ en: "Select a row to inspect historical projects, market sources, and applicability.", ar: "اختر صفاً لفحص المشاريع التاريخية ومصادر السوق ومدى الانطباق.", zh: "选择一行查看历史项目、市场来源和适用性。" })}>
        <div className="g2-table-wrap"><table className="g2-table"><thead><tr>
          <th>{tr({ en: "Cost driver", ar: "محرك التكلفة", zh: "成本驱动" })}</th><th>{tr({ en: "Unit", ar: "الوحدة", zh: "单位" })}</th><th>{tr({ en: "Quantity", ar: "الكمية", zh: "数量" })}</th><th>{tr({ en: "Current", ar: "الحالي", zh: "当前单价" })}</th><th>{tr({ en: "Historical", ar: "التاريخي", zh: "历史均价" })}</th><th>{tr({ en: "Market", ar: "السوق", zh: "市场参考" })}</th><th>{tr({ en: "Variance", ar: "الانحراف", zh: "偏差" })}</th><th>{tr({ en: "Confidence", ar: "الثقة", zh: "置信度" })}</th>
        </tr></thead><tbody>{G02_COST_DRIVERS.map((driver) => <tr key={driver.id} onClick={() => setSelectedDriver(driver)}>
          <td><b>{tr(driver.name)}</b></td><td>{driver.unit}</td><td>{driver.quantity.toLocaleString()}</td><td>{driver.current}</td><td>{driver.historical}</td><td>{driver.market}</td><td className="num bad">+{driver.variance}%</td><td className="num">{driver.confidence}%</td>
        </tr>)}</tbody></table></div>
      </G02Section>

      <div className="g2-two-col review">
        <G02Section title={tr({ en: "Budget-baseline impact", ar: "الأثر على خط أساس الميزانية", zh: "对预算基线的影响" })}>
          <div className="g2-impact-compare">
            <div><span>{tr({ en: "Provisional allocation", ar: "المخصص المبدئي", zh: "暂定额度" })}</span><b>{fmtM(project.allocation)}</b></div>
            <div className="bad"><span>{tr({ en: "Current estimate pressure", ar: "ضغط التقدير الحالي", zh: "当前估算压力" })}</span><b>−{fmtM(Math.max(0, currentEstimate - project.allocation))}</b></div>
            <div className="good"><span>{tr({ en: "Recommended release", ar: "الوفر الموصى", zh: "建议释放" })}</span><b>+{fmtM(Math.max(0, project.allocation - recommended))}</b></div>
          </div>
          <button className="g2-text-link" onClick={() => navigate("plnbudget", `project:${project.id}`)}>{tr({ en: "View this allocation in the budget baseline", ar: "عرض هذا المخصص في خط أساس الميزانية", zh: "在预算基线中查看此额度" })} →</button>
        </G02Section>
        <G02Section title={tr({ en: "Review decision", ar: "قرار المراجعة", zh: "评审决策" })}>
          <div className="g2-review-stack">
            <div><span>{tr({ en: "Technical review", ar: "المراجعة الفنية", zh: "技术评审" })}</span><b>{tr({ en: "Adjust schedule premium", ar: "تعديل علاوة تسريع الجدول", zh: "调整工期溢价" })}</b></div>
            <div><span>{tr({ en: "Financial review", ar: "المراجعة المالية", zh: "财务评审" })}</span><b>{tr({ en: "Approve normalized estimate", ar: "اعتماد التقدير المطبّع", zh: "批准校正后估算" })}</b></div>
            <div className="ai"><span>{tr({ en: "AI recommendation · 86% confidence", ar: "توصية الذكاء الاصطناعي · ثقة 86٪", zh: "AI 建议 · 86% 置信度" })}</span><b>{tr({ en: "Use SAR 388M and retain a quarterly market check.", ar: "استخدم 388 مليون ريال مع مراجعة سوقية ربع سنوية.", zh: "采用 SAR 388M，并保留季度市场复核。" })}</b></div>
          </div>
          <label className="g2-check"><input type="checkbox" checked={state.cost.conflict} onChange={(event) => update("cost", { conflict: event.target.checked })} /> {tr({ en: "Record a technical-financial conflict", ar: "تسجيل تعارض فني مالي", zh: "记录技术与财务冲突" })}</label>
        </G02Section>
      </div>

      <G02Section title={tr({ en: "Funding forecast handoff package", ar: "حزمة التسليم لتنبؤ التمويل", zh: "资金预测交接包" })} sub={tr({ en: "Only the reviewed cost delta is sent to the funding forecast, so the budget baseline is not deducted twice.", ar: "يُرسل إلى تنبؤ التمويل فرق التكلفة المراجع فقط، حتى لا يُخصم خط الأساس الميزاني مرتين.", zh: "仅将评审后的成本差额传入资金预测，避免从预算基线重复扣减。" })}>
        <div className="g2-transfer-grid">
          <div><span>{tr({ en: "Reviewed estimate", ar: "التقدير المراجع", zh: "评审估算" })}</span><b>{fmtM(recommended)}</b><small>{costVersionId}</small></div>
          <div className={fiscalImpact < 0 ? "bad" : "good"}><span>{tr({ en: "Delta vs allocation", ar: "الفرق مقابل المخصص", zh: "相对额度差额" })}</span><b>{fiscalImpact < 0 ? "-" : "+"}{fmtM(Math.abs(fiscalImpact))}</b><small>{tr({ en: "carried as forecast delta", ar: "ينتقل كفرق للتنبؤ", zh: "作为预测差额传递" })}</small></div>
          <div><span>{tr({ en: "Evidence confidence", ar: "ثقة الأدلة", zh: "证据置信度" })}</span><b>{project.confidence}%</b><small>{tr({ en: "history + market pack", ar: "السجل + حزمة السوق", zh: "历史 + 市场包" })}</small></div>
          <div className={state.cost.conflict ? "bad" : "good"}><span>{tr({ en: "Review gate", ar: "بوابة المراجعة", zh: "复核门禁" })}</span><b>{tr(state.cost.conflict ? { en: "Escalate", ar: "تصعيد", zh: "升级" } : { en: "Ready", ar: "جاهز", zh: "就绪" })}</b><small>{tr({ en: "technical and finance sign-off", ar: "اعتماد فني ومالي", zh: "技术与财务确认" })}</small></div>
        </div>
      </G02Section>

      <DecisionFooter guard={state.cost.conflict ? tr({ en: "Gate blocked: technical and finance reviews conflict. Escalate before feeding the funding forecast.", ar: "البوابة مغلقة: توجد تعارضات بين المراجعة الفنية والمالية. صعّد قبل إدخالها في تنبؤ التمويل.", zh: "存在技术财务冲突，需升级复核后才能进入资金预测。" }) : tr({ en: "Gate clear: no review conflict. The reviewed amount will be carried as a forecast delta, not deducted twice from the baseline.", ar: "البوابة جاهزة: لا يوجد تعارض مراجعة. سيُنقل المبلغ المراجع كفرق تنبؤ ولن يُخصم مرتين من خط الأساس.", zh: "无冲突，可进入预测；评审金额按差额传递，不会从基线中重复扣减。" })} guardTone={state.cost.conflict ? "bad" : "ok"}>
        <button className="btn ghost sm" onClick={() => recordDecision("current_estimate", currentEstimate)}>{tr({ en: "Approve current estimate", ar: "اعتماد التقدير الحالي", zh: "批准当前估算" })}</button>
        <button className="btn sm" disabled={state.cost.conflict} onClick={() => recordDecision("recommended_estimate", recommended)}>{tr({ en: "Approve recommended estimate", ar: "اعتماد التقدير الموصى", zh: "批准建议估算" })}</button>
        <button className="btn secondary sm" onClick={includeCostInForecast}>{tr(state.cost.conflict ? { en: "Escalate review", ar: "تصعيد المراجعة", zh: "升级评审" } : { en: "Include in forecast", ar: "الإدراج في التنبؤ", zh: "加入预测" })}</button>
      </DecisionFooter>

      {selectedDriver && <G02Modal tr={tr} title={tr(selectedDriver.name)} sub={tr({ en: "Benchmark evidence and applicability", ar: "أدلة المرجع ومدى الانطباق", zh: "基准证据与适用性" })} onClose={() => setSelectedDriver(null)}>
        <div className="g2-mini-grid three">
          <div><span>{tr({ en: "Historical average", ar: "المتوسط التاريخي", zh: "历史均价" })}</span><b>{selectedDriver.historical}</b></div>
          <div><span>{tr({ en: "Market reference", ar: "مرجع السوق", zh: "市场参考" })}</span><b>{selectedDriver.market}</b></div>
          <div><span>{tr({ en: "Confidence", ar: "الثقة", zh: "置信度" })}</span><b>{selectedDriver.confidence}%</b></div>
        </div>
        <div className="g2-evidence-list">
          <div><b>PRJ-2025-118 · Eastern sector</b><span>{tr({ en: "Completed comparable project · indexed to Jun 2026", ar: "مشروع مكتمل قابل للمقارنة · مفهرس إلى يونيو 2026", zh: "已完工可比项目 · 指数更新至 2026 年 6 月" })}</span></div>
          <div><b>Market study MS-2026-Q2</b><span>{tr({ en: "Approved cost research pack · regional applicability 88%", ar: "حزمة بحث تكلفة معتمدة · ملاءمة إقليمية 88٪", zh: "已批准成本研究包 · 区域适用性 88%" })}</span></div>
        </div>
      </G02Modal>}

      {assumptionOpen && <G02Modal tr={tr} title={tr({ en: "Project assumptions", ar: "افتراضات المشروع", zh: "项目假设" })} sub={tr({ en: "Changes create a new working analysis version.", ar: "تنشئ التغييرات نسخة تحليل عمل جديدة.", zh: "调整会生成新的分析草稿版本。" })} onClose={() => setAssumptionOpen(false)}>
        <div className="g2-adjuster">
          <span>{tr({ en: "Estimate adjustment", ar: "تعديل التقدير", zh: "估算调整" })}</span>
          <div><button className="btn ghost sm" onClick={() => setAdjustment((value) => Math.max(-10, value - 1))}>−1%</button><b>{adjustment > 0 ? "+" : ""}{adjustment}%</b><button className="btn ghost sm" onClick={() => setAdjustment((value) => Math.min(10, value + 1))}>+1%</button></div>
        </div>
        <div className="g2-modal-actions"><button className="btn sm" onClick={() => setAssumptionOpen(false)}>{tr({ en: "Recalculate analysis", ar: "إعادة احتساب التحليل", zh: "重新计算分析" })}</button></div>
      </G02Modal>}
    </div>
  );
}

export function HousingSupportPage({ tr, state, update, navigate, onBack, onAlerts, onSmartQuery }) {
  const [optionId, setOptionId] = useState(state.housing.optionId || "balanced");
  const [regionId, setRegionId] = useState("east");
  const [mixOpen, setMixOpen] = useState(false);
  const [financialRatio, setFinancialRatio] = useState(50);
  const selected = G02_HOUSING_OPTIONS.find((item) => item.id === optionId) || G02_HOUSING_OPTIONS[1];
  const selectedRegion = G02_HOUSING_REGIONS.find((item) => item.id === regionId) || G02_HOUSING_REGIONS[0];
  const approvedHousingAllocation = +(selected.fundingNeed - selected.gap).toFixed(2);
  const housingVersionId = "HA-2027-01-02";
  const hasActiveHousingReview = state.housing.versionId
    && state.housing.optionId === optionId
    && state.housing.financialRatio === selected.financial
    && state.housing.inKindRatio === selected.inKind;
  const pageCopy = pageHeader("plnhousing", {
    title: { en: "Housing support impact analysis", ar: "تحليل أثر دعم الإسكان", zh: "住房支持影响分析" },
    sub: { en: "Compare financial, in-kind, and blended support to balance ownership outcomes with long-term funding sustainability.", ar: "قارن الدعم المالي والعيني والمختلط لتحقيق التوازن بين نتائج التملك واستدامة التمويل طويل الأجل.", zh: "比较财务、实物和混合支持，在住房拥有率与长期资金可持续性之间取得平衡。" },
  });
  const saveAnalysis = () => {
    update("housing", { status: "reviewed", versionId: housingVersionId, optionId, financialRatio: selected.financial, inKindRatio: selected.inKind }, {
      type: "Housing support",
      detail: `${selected.id} support mix reviewed with ${selected.efficiency}/100 resource efficiency.`,
    });
    update("context", { housingAnalysisVersionId: housingVersionId });
  };
  const includeHousingInForecast = () => {
    if (!state.housing.dataComplete) return;
    if (!hasActiveHousingReview) saveAnalysis();
    navigate("plnforecast", `housing:${hasActiveHousingReview ? state.housing.versionId : housingVersionId}`);
  };

  return (
    <div className="g2-page fade">
	      <G02Header
	        tr={tr}
	        title={pageCopy.title}
	        sub={pageCopy.sub}
        onBack={onBack}
        onAlerts={onAlerts}
        onSmartQuery={onSmartQuery}
        storyline={<G02BusinessStoryline
          tr={tr}
          current="housing"
          output={{ en: `Current: housing impact ${housingVersionId}`, ar: `الحالي: أثر الإسكان ${housingVersionId}` }}
          tags={[
            { en: "Budget allocation drill-down", ar: "تفصيل من مخصص الميزانية" },
            { en: "Support mix reviewed", ar: "تمت مراجعة مزيج الدعم" },
          ]}
          navigate={navigate}
        />}
	      />
      <div className="g2-filterbar">
        <label><span>{tr({ en: "Support program", ar: "برنامج الدعم", zh: "支持计划" })}</span><select><option>HSP-2027-01 · {tr({ en: "Housing support balance", ar: "توازن دعم الإسكان", zh: "住房支持平衡" })}</option></select></label>
        <label><span>{tr({ en: "Analysis period", ar: "فترة التحليل", zh: "分析周期" })}</span><select><option>FY2027 - FY2031</option></select></label>
        <label><span>{tr({ en: "Target segment", ar: "الشريحة المستهدفة", zh: "目标群体" })}</span><select><option>{tr({ en: "Eligible households", ar: "الأسر المؤهلة", zh: "符合条件家庭" })}</option></select></label>
        <label><span>{tr({ en: "Region", ar: "المنطقة", zh: "区域" })}</span><select value={regionId} onChange={(event) => setRegionId(event.target.value)}>{G02_HOUSING_REGIONS.map((region) => <option key={region.id} value={region.id}>{tr(region.name)}</option>)}</select></label>
      </div>

      <AIReadyNotice
        tr={tr}
        tags={[
          { en: "Budget allocation linked", ar: "المخصص الميزاني مرتبط", zh: "预算额度已关联" },
          state.housing.dataComplete ? { en: "Data completeness 96%", ar: "اكتمال البيانات 96٪", zh: "数据完整率 96%" } : { en: "Source pack incomplete", ar: "حزمة المصدر غير مكتملة", zh: "来源包待补齐" },
          { en: "Support mix adjustable", ar: "مزيج الدعم قابل للتعديل", zh: "支持组合可调整" },
          { en: "Five-year gap feeds forecast", ar: "فجوة خمس سنوات تدخل التنبؤ", zh: "五年缺口进入预测" },
        ]}
      >
        {tr({ en: `AI has linked the housing support budget allocation and prepared beneficiary eligibility, regional demand, support-mix assumptions, and five-year funding-gap data for ${tr(selectedRegion.name)}.`, ar: `ربط الذكاء الاصطناعي مخصص دعم الإسكان وأعد بيانات الأهلية والطلب الإقليمي وافتراضات مزيج الدعم وفجوة التمويل لخمس سنوات لـ ${tr(selectedRegion.name)}.`, zh: `AI 已关联住房支持预算额度，并为 ${tr(selectedRegion.name)} 准备好受益人资格、区域需求、支持组合假设和五年资金缺口数据。` })}
      </AIReadyNotice>

      <div className="g2-inline-metrics">
        <div><span>{tr({ en: "Approved allocation", ar: "المخصص المعتمد", zh: "已批准额度" })}</span><b>{fmtB(approvedHousingAllocation)}</b></div>
        <div><span>{tr({ en: "Current option need", ar: "احتياج الخيار الحالي", zh: "当前方案资金需求" })}</span><b>{fmtB(selected.fundingNeed)}</b></div>
        <div className="warn"><span>{tr({ en: "Five-year funding gap", ar: "فجوة التمويل لخمس سنوات", zh: "五年资金缺口" })}</span><b>{fmtB(selected.gap)}</b></div>
      </div>

      <KpiStrip configRoute="plnhousing" items={[
        { id: "ownership", label: tr({ en: "Expected ownership uplift", ar: "الزيادة المتوقعة في التملك", zh: "预计拥有率提升" }), value: `+${selected.ownership} pp`, note: tr({ en: "five-year outcome", ar: "نتيجة خمس سنوات", zh: "五年结果" }), tone: "good" },
        { id: "beneficiaries", label: tr({ en: "Eligible beneficiaries", ar: "المستفيدون المؤهلون", zh: "符合条件受益人" }), value: selected.beneficiaries.toLocaleString(), note: tr({ en: "current program reach", ar: "نطاق البرنامج الحالي", zh: "当前计划覆盖" }) },
        { id: "cost", label: tr({ en: "Cost per beneficiary", ar: "التكلفة لكل مستفيد", zh: "人均成本" }), value: `SAR ${selected.costPer}K`, note: tr({ en: "support cost ÷ beneficiaries", ar: "تكلفة الدعم ÷ المستفيدين", zh: "支持成本 ÷ 受益人数" }) },
        { id: "efficiency", label: tr({ en: "Resource efficiency", ar: "كفاءة الموارد", zh: "资源效率" }), value: `${selected.efficiency}/100`, note: tr({ en: "input-to-outcome score", ar: "درجة المدخلات إلى النتائج", zh: "投入产出评分" }), tone: "good" },
        { id: "need", label: tr({ en: "Five-year funding need", ar: "احتياج التمويل لخمس سنوات", zh: "五年资金需求" }), value: fmtB(selected.fundingNeed), note: tr({ en: "nominal requirement", ar: "الاحتياج الاسمي", zh: "名义需求" }) },
        { id: "gap", label: tr({ en: "Five-year funding gap", ar: "فجوة التمويل لخمس سنوات", zh: "五年资金缺口" }), value: fmtB(selected.gap), note: tr({ en: "housing pressure input to funding forecast", ar: "مدخل ضغط الإسكان لتنبؤ التمويل", zh: "作为住房压力输入进入资金预测" }), tone: "warn" },
      ]} />

      <G02Section title={tr({ en: "Support mix comparison", ar: "مقارنة مزيج الدعم", zh: "支持组合比较" })} sub={tr({ en: "Choose a policy posture, or adjust the financial and in-kind share manually.", ar: "اختر توجهاً للسياسة أو عدّل حصة الدعم المالي والعيني يدوياً.", zh: "选择政策姿态，或手动调整财务与实物支持比例。" })} right={<button className="btn ghost sm" onClick={() => { setFinancialRatio(selected.financial); setMixOpen(true); }}>{tr({ en: "Adjust support mix", ar: "ضبط مزيج الدعم", zh: "调整支持组合" })}</button>}>
        <div className="g2-option-cards housing">
          {G02_HOUSING_OPTIONS.map((option) => <button key={option.id} className={optionId === option.id ? "on" : ""} onClick={() => setOptionId(option.id)}>
            <div className="g2-option-top"><div><span>{option.id === "balanced" ? tr({ en: "AI recommended", ar: "موصى به بالذكاء الاصطناعي", zh: "AI 推荐" }) : tr({ en: "Policy option", ar: "خيار سياسة", zh: "政策方案" })}</span><h3>{tr(option.name)}</h3></div><RiskPill tr={tr} risk={option.risk} /></div>
            <div className="g2-mixbar"><i style={{ width: `${option.financial}%` }} /><b>{option.financial}%</b><em>{option.inKind}%</em></div>
            <div className="g2-option-metrics"><div><span>{tr({ en: "Ownership", ar: "التملك", zh: "拥有率" })}</span><b>+{option.ownership} pp</b></div><div><span>{tr({ en: "Efficiency", ar: "الكفاءة", zh: "效率" })}</span><b>{option.efficiency}/100</b></div><div><span>{tr({ en: "Funding gap", ar: "فجوة التمويل", zh: "资金缺口" })}</span><b>{fmtB(option.gap)}</b></div></div>
          </button>)}
        </div>
      </G02Section>

      <div className="g2-two-col housing">
        <G02Section title={tr({ en: "Regional effectiveness", ar: "الفعالية الإقليمية", zh: "区域效果" })} sub={tr({ en: "Investment against policy output. Select a region to filter the detail table.", ar: "الاستثمار مقابل مخرجات السياسة. اختر منطقة لتصفية جدول التفاصيل.", zh: "投入金额与政策产出对比，选择区域后联动明细表。" })}>
          <div className="g2-quadrant">
            <div className="g2-quadrant-label q1">{tr({ en: "High input · high output", ar: "مدخلات عالية · مخرجات عالية", zh: "高投入 · 高产出" })}</div>
            <div className="g2-quadrant-label q2">{tr({ en: "Lower input · high output", ar: "مدخلات أقل · مخرجات عالية", zh: "低投入 · 高产出" })}</div>
            <div className="g2-quadrant-label q3">{tr({ en: "Lower input · lower output", ar: "مدخلات أقل · مخرجات أقل", zh: "低投入 · 低产出" })}</div>
            <div className="g2-quadrant-label q4">{tr({ en: "High input · lower output", ar: "مدخلات عالية · مخرجات أقل", zh: "高投入 · 低产出" })}</div>
            {G02_HOUSING_REGIONS.map((region) => <button key={region.id} className={regionId === region.id ? "on" : ""} style={{ insetInlineStart: `${Math.min(88, region.investment / 5)}%`, bottom: `${Math.min(82, region.output)}%` }} onClick={() => setRegionId(region.id)}><span>{tr(region.name)}</span><b>{region.efficiency}</b></button>)}
          </div>
        </G02Section>
        <G02Section title={tr({ en: "AI recommendation", ar: "توصية الذكاء الاصطناعي", zh: "AI 建议" })}>
          <div className="g2-ai-brief">
            <span>{tr({ en: "Recommended policy posture · 88% confidence", ar: "التوجه الموصى للسياسة · ثقة 88٪", zh: "推荐政策姿态 · 88% 置信度" })}</span>
            <h3>{tr(selected.name)}</h3>
            <p>{tr({ en: "The balanced mix protects near-term access while reducing the five-year funding gap by SAR 80M compared with the access-first option.", ar: "يحمي المزيج المتوازن الوصول على المدى القريب ويخفض فجوة التمويل لخمس سنوات بمقدار 80 مليون ريال مقارنة بخيار أولوية الوصول.", zh: "平衡组合兼顾近期覆盖，相比覆盖优先方案将五年资金缺口减少 SAR 80M。" })}</p>
            <div className="g2-ai-facts"><div><span>{tr({ en: "Expected improvement", ar: "التحسن المتوقع", zh: "预计改善" })}</span><b>+{selected.ownership} pp</b></div><div><span>{tr({ en: "Main risk", ar: "الخطر الرئيسي", zh: "主要风险" })}</span><b>{tr({ en: "In-kind delivery capacity", ar: "قدرة تسليم الدعم العيني", zh: "实物支持交付能力" })}</b></div></div>
          </div>
          <div className={`g2-callout ${state.housing.dataComplete ? "good" : "warn"}`}><b>{state.housing.dataComplete ? tr({ en: "Source pack complete", ar: "حزمة المصادر مكتملة", zh: "来源包完整" }) : tr({ en: "In-kind source incomplete", ar: "مصدر الدعم العيني غير مكتمل", zh: "实物支持来源不完整" })}</b><p>{tr({ en: "Beneficiary registry, policy package, and regional delivery data are linked to this analysis.", ar: "سجل المستفيدين وحزمة السياسة وبيانات التسليم الإقليمية مرتبطة بهذا التحليل.", zh: "受益人登记、政策包和区域交付数据已关联到本次分析。" })}</p></div>
        </G02Section>
      </div>

      <G02Section title={`${tr(selectedRegion.name)} · ${tr({ en: "segment detail", ar: "تفاصيل الشرائح", zh: "群体明细" })}`}>
        <div className="g2-table-wrap"><table className="g2-table"><thead><tr><th>{tr({ en: "Segment", ar: "الشريحة", zh: "群体" })}</th><th>{tr({ en: "Support budget", ar: "ميزانية الدعم", zh: "支持预算" })}</th><th>{tr({ en: "Beneficiaries", ar: "المستفيدون", zh: "受益人数" })}</th><th>{tr({ en: "Cost / beneficiary", ar: "التكلفة / المستفيد", zh: "人均成本" })}</th><th>{tr({ en: "Ownership uplift", ar: "زيادة التملك", zh: "拥有率提升" })}</th><th>{tr({ en: "Target achievement", ar: "تحقيق الهدف", zh: "目标完成率" })}</th></tr></thead><tbody>
          {[{ name: { en: "First-home households", ar: "أسر المسكن الأول", zh: "首套住房家庭" }, share: 0.46, uplift: 4.1 }, { name: { en: "Low-income households", ar: "الأسر منخفضة الدخل", zh: "低收入家庭" }, share: 0.34, uplift: 3.5 }, { name: { en: "Priority municipal workforce", ar: "القوى العاملة البلدية ذات الأولوية", zh: "重点市政人员" }, share: 0.2, uplift: 2.2 }].map((row) => <tr key={row.share}><td><b>{tr(row.name)}</b></td><td className="num">SAR {Math.round(selectedRegion.investment * row.share)}M</td><td className="num">{Math.round(selectedRegion.beneficiaries * row.share).toLocaleString()}</td><td className="num">SAR {selected.costPer}K</td><td className="num good">+{row.uplift} pp</td><td className="num">{Math.round(selectedRegion.completion * (0.94 + row.share / 10))}%</td></tr>)}
        </tbody></table></div>
      </G02Section>

      <DecisionFooter guard={state.housing.dataComplete ? tr({ en: "Ready to feed funding forecast: support-mix assumptions and five-year funding gap will be passed together.", ar: "جاهز لإدخال تنبؤ التمويل: ستنتقل افتراضات مزيج الدعم وفجوة التمويل لخمس سنوات معاً.", zh: "可进入资金预测：将支持组合假设和五年资金缺口一并传入。" }) : tr({ en: "Complete the in-kind source pack before formal review.", ar: "أكمل حزمة مصدر الدعم العيني قبل المراجعة الرسمية.", zh: "正式评审前需要补齐实物支持来源包。" })} guardTone={state.housing.dataComplete ? "ok" : "bad"}>
        <button className="btn ghost sm" onClick={() => update("housing", { dataComplete: !state.housing.dataComplete })}>{tr(state.housing.dataComplete ? { en: "Simulate missing source", ar: "محاكاة مصدر مفقود", zh: "模拟来源缺失" } : { en: "Restore source pack", ar: "استعادة حزمة المصدر", zh: "恢复来源包" })}</button>
        <button className="btn sm" disabled={!state.housing.dataComplete} onClick={saveAnalysis}>{tr({ en: "Confirm support analysis", ar: "تأكيد تحليل الدعم", zh: "确认支持分析" })}</button>
        <button className="btn secondary sm" disabled={!state.housing.dataComplete} onClick={includeHousingInForecast}>{tr({ en: "Include in forecast", ar: "الإدراج في التنبؤ", zh: "加入预测" })}</button>
      </DecisionFooter>

      {mixOpen && <G02Modal tr={tr} title={tr({ en: "Adjust support mix", ar: "ضبط مزيج الدعم", zh: "调整支持组合" })} sub={tr({ en: "Financial and in-kind support must total 100%.", ar: "يجب أن يساوي مجموع الدعم المالي والعيني 100٪.", zh: "财务支持与实物支持合计必须为 100%。" })} onClose={() => setMixOpen(false)}>
        <div className="g2-adjuster"><span>{tr({ en: "Financial support", ar: "الدعم المالي", zh: "财务支持" })}</span><div><button className="btn ghost sm" onClick={() => setFinancialRatio((value) => Math.max(0, value - 5))}>−5</button><b>{financialRatio}%</b><button className="btn ghost sm" onClick={() => setFinancialRatio((value) => Math.min(100, value + 5))}>+5</button></div></div>
        <div className="g2-adjuster"><span>{tr({ en: "In-kind support", ar: "الدعم العيني", zh: "实物支持" })}</span><b>{100 - financialRatio}%</b></div>
        <div className="g2-modal-actions"><button className="btn sm" onClick={() => { const nearest = [...G02_HOUSING_OPTIONS].sort((a, b) => Math.abs(a.financial - financialRatio) - Math.abs(b.financial - financialRatio))[0]; setOptionId(nearest.id); setMixOpen(false); }}>{tr({ en: "Apply and recalculate", ar: "تطبيق وإعادة الاحتساب", zh: "应用并重新计算" })}</button></div>
      </G02Modal>}
    </div>
  );
}

export function FutureObligationsPage({ tr, state, update, navigate, onBack, onAlerts, onSmartQuery }) {
  const baselineYear = Number(state.context.fiscalYear || "2027");
  const yearOffset = baselineYear - 2027;
  const forecastTimeline = useMemo(() => G02_FORECAST_TIMELINE.map((entry) => ({ ...entry, period: shiftForecastPeriod(entry.period, yearOffset) })), [yearOffset]);
  const forecastItems = useMemo(() => G02_FORECAST_ITEMS.map((entry) => ({ ...entry, id: shiftForecastRef(entry.id, baselineYear), period: shiftForecastPeriod(entry.period, yearOffset) })), [baselineYear, yearOffset]);
  const peakGap = useMemo(() => forecastTimeline.reduce((peak, item) => (item.gap > peak.gap ? item : peak), forecastTimeline[0]), [forecastTimeline]);
  const firstGap = useMemo(() => forecastTimeline.find((entry) => entry.gap >= 0.3) || forecastTimeline.find((entry) => entry.gap > 0) || forecastTimeline[0], [forecastTimeline]);
  const initialSelectedPeriod = state.forecast.status !== "not_started" && state.forecast.selectedPeriod ? state.forecast.selectedPeriod : peakGap.period;
  const [selectedPeriod, setSelectedPeriod] = useState(initialSelectedPeriod);
  const [includeProbable, setIncludeProbable] = useState(state.forecast.includeProbable !== false);
  const [granularity, setGranularity] = useState("quarterly");
  const [horizon, setHorizon] = useState(String(baselineYear + 3));
  const [entity, setEntity] = useState("all");
  const [service, setService] = useState("all");
  const [chapter, setChapter] = useState("all");
  const [item, setItem] = useState("all");
  const [sourceOpen, setSourceOpen] = useState(false);
  const timelineByHorizon = forecastTimeline.filter((entry) => Number(entry.period.slice(0, 4)) <= Number(horizon));
  const chartTimeline = useMemo(() => {
    if (granularity === "annual") {
      const buckets = timelineByHorizon.reduce((acc, item) => {
        const year = item.period.slice(0, 4);
        const current = acc[year] || { period: `FY${year}`, capacity: 0, confirmed: 0, probable: 0, carryover: 0, project: 0, housing: 0, gap: 0, count: 0 };
        current.capacity += item.capacity;
        current.confirmed += item.confirmed;
        current.probable += item.probable;
        current.carryover += item.carryover;
        current.project += item.project;
        current.housing += item.housing;
        current.gap = Math.max(current.gap, item.gap);
        current.count += 1;
        acc[year] = current;
        return acc;
      }, {});
      return Object.values(buckets).map((bucket) => ({ ...bucket, capacity: +(bucket.capacity / bucket.count).toFixed(2) }));
    }
    if (granularity === "monthly") {
      return timelineByHorizon.flatMap((quarter) => {
        const [year, q] = quarter.period.split(" Q");
        return [1, 2, 3].map((month) => ({
          period: `${year} M${(Number(q) - 1) * 3 + month}`,
          capacity: +(quarter.capacity / 3).toFixed(2),
          confirmed: +(quarter.confirmed / 3).toFixed(2),
          probable: +(quarter.probable / 3).toFixed(2),
          carryover: +(quarter.carryover / 3).toFixed(2),
          project: +(quarter.project / 3).toFixed(2),
          housing: +(quarter.housing / 3).toFixed(2),
          gap: +(quarter.gap / 3).toFixed(2),
        }));
      });
	    }
	    return timelineByHorizon;
	  }, [granularity, timelineByHorizon]);
  useEffect(() => {
    const maxHorizon = baselineYear + 3;
    const minHorizon = baselineYear + 2;
    const numericHorizon = Number(horizon);
    if (numericHorizon < minHorizon || numericHorizon > maxHorizon) setHorizon(String(maxHorizon));
  }, [baselineYear, horizon]);
  useEffect(() => {
    if (!forecastTimeline.some((entry) => entry.period === selectedPeriod)) setSelectedPeriod(peakGap.period);
  }, [forecastTimeline, peakGap.period, selectedPeriod]);
	  const selectedTimeline = forecastTimeline.find((item) => item.period === selectedPeriod) || chartTimeline.find((item) => item.period === selectedPeriod) || peakGap;
	  const periodItems = forecastItems.filter((item) => item.period === selectedPeriod);
		  const baselineApproved = state.baseline.status === "approved";
		  const horizonLabel = `FY${baselineYear} - FY${horizon}`;
		  const forecastVersionId = `FV-${baselineYear}-QTR-03`;
		  const filterSummary = `${horizonLabel} · ${entity === "all" ? "All entities" : entity} · ${service === "all" ? "All services" : service} · ${chapter === "all" ? "All chapters" : chapter} · ${item === "all" ? "All items" : item}`;
  const pageCopy = pageHeader("plnforecast", {
    title: { en: "Future obligations & funding needs forecast", ar: "توقع الالتزامات المستقبلية واحتياجات التمويل", zh: "未来义务与资金需求预测" },
    sub: { en: "See when funding pressure appears, which obligations drive it, and which action should move into scenario testing.", ar: "اعرف متى يظهر ضغط التمويل، وما الالتزامات التي تقوده، وما الإجراء الذي يجب نقله إلى اختبار السيناريو.", zh: "判断资金压力何时出现、由哪些义务驱动，以及哪些动作需要进入情景测试。" },
  });
		  const confirmForecast = () => {
	    const versionId = forecastVersionId;
	    update("forecast", { status: "confirmed", versionId, selectedPeriod, includeProbable }, { type: "Forecast", detail: `${horizonLabel} funding forecast confirmed at 84% confidence.` });
	    update("context", { forecastVersionId: versionId });
	  };

  return (
	    <div className="g2-page fade">
			      <G02Header
            tr={tr}
            title={pageCopy.title}
            sub={pageCopy.sub}
            onBack={onBack}
            onAlerts={onAlerts}
            onSmartQuery={onSmartQuery}
            storyline={<G02BusinessStoryline
              tr={tr}
              current="forecast"
              output={{ en: `Current: funding forecast ${forecastVersionId}`, ar: `الحالي: تنبؤ التمويل ${forecastVersionId}` }}
              tags={[
                { en: "Budget baseline referenced", ar: "تم ربط خط أساس الميزانية" },
                { en: "Scenario simulation next", ar: "محاكاة السيناريو هي الخطوة التالية" },
              ]}
              navigate={navigate}
            />}
          />
		      {!baselineApproved && <div className="g2-callout warn top"><b>{tr({ en: "Draft baseline preview", ar: "معاينة خط أساس مسودة", zh: "草稿基线预览" })}</b><p>{tr({ en: "You can inspect the forecast, but formal confirmation remains locked until the budget baseline is approved.", ar: "يمكنك فحص التنبؤ، لكن التأكيد الرسمي سيبقى مقفلاً حتى اعتماد خط أساس الميزانية.", zh: "可以查看预测，但预算基线批准前不能正式确认预测版本。" })}</p><button className="g2-text-link" onClick={() => navigate("plnbudget")}>{tr({ en: "Return to budget approval", ar: "العودة إلى اعتماد الميزانية", zh: "返回预算审批" })} →</button></div>}

      <AIReadyNotice
        tr={tr}
        tags={[
          { en: "Budget baseline linked", ar: "خط أساس الميزانية مرتبط", zh: "预算基线已关联" },
          { en: "Cost delta included", ar: "فرق التكلفة مدرج", zh: "成本差额已纳入" },
          { en: "Housing pressure included", ar: "ضغط الإسكان مدرج", zh: "住房压力已纳入" },
          { en: "SAP/Etimad obligations synced", ar: "التزامات SAP/Etimad متزامنة", zh: "SAP / Etimad 义务已同步" },
        ]}
      >
        {tr({ en: `AI has integrated the budget baseline, project-cost delta, housing support pressure, and SAP/Etimad obligation pipeline to generate ${forecastVersionId}.`, ar: `دمج الذكاء الاصطناعي خط أساس الميزانية وفرق تكلفة المشروع وضغط دعم الإسكان وسلسلة الالتزامات من SAP/Etimad لإنشاء ${forecastVersionId}.`, zh: `AI 已整合预算基线、项目成本差额、住房支持压力和 SAP / Etimad 义务管道，生成 ${forecastVersionId}。` })}
      </AIReadyNotice>

      <div className="g2-filterbar forecast">
        <label><span>{tr({ en: "Entity / scope", ar: "الجهة / النطاق", zh: "实体 / 范围" })}</span><select value={entity} onChange={(event) => setEntity(event.target.value)}><option value="all">{tr({ en: "All Secretariat entities", ar: "كل جهات الأمانة", zh: "全部秘书处实体" })}</option><option value="Riyadh Amana">Riyadh Amana</option><option value="Jeddah Municipality">Jeddah Municipality</option><option value="Makkah Municipality">Makkah Municipality</option></select></label>
        <label><span>{tr({ en: "Service", ar: "الخدمة", zh: "服务" })}</span><select value={service} onChange={(event) => setService(event.target.value)}><option value="all">{tr({ en: "All services", ar: "كل الخدمات", zh: "全部服务" })}</option><option value="Urban services">Urban services</option><option value="Housing support">Housing support</option><option value="Infrastructure">Infrastructure</option></select></label>
        <label><span>{tr({ en: "Chapter", ar: "الباب", zh: "章节" })}</span><select value={chapter} onChange={(event) => setChapter(event.target.value)}><option value="all">{tr({ en: "All chapters", ar: "كل الأبواب", zh: "全部章节" })}</option><option value="Chapter 2">Chapter 2 · Opex</option><option value="Chapter 3">Chapter 3 · Capex</option><option value="Chapter 4">Chapter 4 · Subsidies</option></select></label>
        <label><span>{tr({ en: "Item", ar: "البند", zh: "项目" })}</span><select value={item} onChange={(event) => setItem(event.target.value)}><option value="all">{tr({ en: "All items", ar: "كل البنود", zh: "全部项目" })}</option><option value="Contracts">Contracts</option><option value="Payment plan">Payment plan</option><option value="Carryover debt">Carryover debt</option></select></label>
	        <label><span>{tr({ en: "Forecast horizon", ar: "أفق التنبؤ", zh: "预测区间" })}</span><select value={horizon} onChange={(event) => setHorizon(event.target.value)}><option value={String(baselineYear + 2)}>FY{baselineYear} - FY{baselineYear + 2}</option><option value={String(baselineYear + 3)}>FY{baselineYear} - FY{baselineYear + 3}</option></select></label>
        <div className="g2-filter-buttons"><span>{tr({ en: "Granularity", ar: "مستوى التفصيل", zh: "时间粒度" })}</span>{[["monthly", { en: "Monthly", ar: "شهري", zh: "月度" }], ["quarterly", { en: "Quarterly", ar: "ربع سنوي", zh: "季度" }], ["annual", { en: "Annual", ar: "سنوي", zh: "年度" }]].map(([id, label]) => <button key={id} className={`btn sm ${granularity === id ? "" : "ghost"}`} onClick={() => setGranularity(id)}>{tr(label)}</button>)}</div>
        <label className="g2-check wide"><input type="checkbox" checked={includeProbable} onChange={(event) => setIncludeProbable(event.target.checked)} /> {tr({ en: "Include probability-weighted pipeline", ar: "تضمين العقود المرجحة بالاحتمال", zh: "包含概率加权在途合同" })}</label>
      </div>

      <KpiStrip configRoute="plnforecast" items={[
	        { id: "confirmed", label: tr({ en: "Confirmed obligations", ar: "الالتزامات المؤكدة", zh: "确定义务" }), value: "SAR 4.26B", note: tr({ en: "approved contracts", ar: "العقود المعتمدة", zh: "已批准合同" }) },
	        { id: "pipeline", label: tr({ en: "Probability-weighted pipeline", ar: "العقود المرجحة بالاحتمال", zh: "概率加权在途合同" }), value: includeProbable ? "SAR 710M" : "Excluded", note: tr({ en: "not a confirmed obligation", ar: "ليست التزاماً مؤكداً", zh: "不属于确定义务" }) },
		        { id: "first", label: tr({ en: "First material gap", ar: "أول فجوة جوهرية", zh: "首次显著缺口" }), value: `FY${firstGap.period}`, note: tr({ en: "early warning point", ar: "نقطة الإنذار المبكر", zh: "提前预警点" }), tone: "warn" },
	        { id: "peak", label: tr({ en: "Peak funding gap", ar: "ذروة فجوة التمويل", zh: "最大资金缺口" }), value: fmtB(peakGap.gap), note: tr({ en: `Scenario input · FY${peakGap.period}`, ar: `مدخل السيناريو · FY${peakGap.period}`, zh: `将作为情景模拟输入 · FY${peakGap.period}` }), tone: "bad" },
	        { id: "coverage", label: tr({ en: "Funding coverage", ar: "تغطية التمويل", zh: "资金覆盖率" }), value: "86%", note: horizonLabel },
	        { id: "confidence", label: tr({ en: "Forecast confidence", ar: "ثقة التنبؤ", zh: "预测置信度" }), value: `${state.forecast.confidence}%`, note: tr({ en: "source coverage 92%", ar: "تغطية المصادر 92٪", zh: "来源覆盖 92%" }), tone: "good" },
	      ]} />

	      <G02Section title={tr({ en: "Funding pressure timeline", ar: "الخط الزمني لضغط التمويل", zh: "资金压力时间线" })} sub={tr({ en: "Select a quarter to filter the obligation detail below.", ar: "اختر ربعاً لتصفية تفاصيل الالتزامات أدناه.", zh: "选择季度后联动下方义务明细。" })} right={<button className="btn ghost sm" onClick={() => setSourceOpen(true)}>{tr(COPY.source)}</button>}>
        <div className="g2-ai-summary">{tr({ en: `AI identifies the peak gap as the combined effect of contract payment plans, probability-weighted pipeline obligations, and housing support pressure.`, ar: `يحدد الذكاء الاصطناعي ذروة الفجوة كنتيجة مشتركة لخطط دفع العقود والالتزامات المرجحة بالاحتمال وضغط دعم الإسكان.`, zh: `AI 识别峰值缺口主要来自合同付款计划、概率加权在途义务和住房支持压力叠加。` })}</div>
        <div className="g2-filter-note">{filterSummary}</div>
        <div className="g2-chart-wrap">
          <RC.ResponsiveContainer width="100%" height={330}>
            <RC.ComposedChart data={chartTimeline} onClick={(event) => event && event.activeLabel && setSelectedPeriod(event.activeLabel)} margin={{ top: 16, right: 18, left: 4, bottom: 8 }}>
              <RC.CartesianGrid stroke="#e8eee9" strokeDasharray="3 3" vertical={false} />
              <RC.XAxis dataKey="period" tick={{ fontSize: 11, fill: "#66756c" }} interval={1} />
              <RC.YAxis tick={{ fontSize: 11, fill: "#66756c" }} tickFormatter={(value) => `${value.toFixed(1)}B`} />
              <RC.Tooltip formatter={(value, name) => [fmtB(value), name]} contentStyle={{ borderRadius: 12, border: "1px solid #dfe7e2", boxShadow: "0 12px 32px rgba(16,33,28,.12)" }} />
              <RC.Area type="monotone" dataKey="confirmed" stackId="need" fill="#a8d5bd" stroke="#188653" name={tr({ en: "Confirmed obligations", ar: "الالتزامات المؤكدة", zh: "确定义务" })} />
              {includeProbable && <RC.Area type="monotone" dataKey="probable" stackId="need" fill="#f6c98f" stroke="#dc8b2b" name={tr({ en: "Probable pipeline", ar: "العقود الاحتمالية", zh: "概率义务" })} />}
              <RC.Line type="monotone" dataKey="capacity" stroke="#244f3d" strokeWidth={3} dot={false} name={tr({ en: "Funding capacity", ar: "القدرة التمويلية", zh: "资金能力" })} />
              <RC.Bar dataKey="gap" fill="#d95b52" radius={[4, 4, 0, 0]} name={tr({ en: "Funding gap", ar: "فجوة التمويل", zh: "资金缺口" })} />
            </RC.ComposedChart>
          </RC.ResponsiveContainer>
        </div>
        <div className="g2-chart-legend"><span className="confirmed">{tr({ en: "Confirmed obligations", ar: "التزامات مؤكدة", zh: "确定义务" })}</span><span className="probable">{tr({ en: "Probability-weighted", ar: "مرجحة بالاحتمال", zh: "概率加权" })}</span><span className="capacity">{tr({ en: "Funding capacity", ar: "القدرة التمويلية", zh: "资金能力" })}</span><span className="gap">{tr({ en: "Gap", ar: "الفجوة", zh: "缺口" })}</span></div>
      </G02Section>

      <div className="g2-obligation-strip">
        {[{ label: { en: "Confirmed contracts", ar: "العقود المؤكدة", zh: "确定合同" }, value: 4.26 }, { label: { en: "Pipeline contracts", ar: "العقود قيد الإجراء", zh: "在途合同" }, value: 0.71 }, { label: { en: "Carryover debt", ar: "الدين المرحل", zh: "结转债务" }, value: 0.33 }, { label: { en: "Future project cost", ar: "تكلفة المشاريع المستقبلية", zh: "未来项目成本" }, value: 0.48 }, { label: { en: "Housing commitments", ar: "التزامات الإسكان", zh: "住房义务" }, value: 0.56 }].map((item) => <div key={item.value}><span>{tr(item.label)}</span><b>{fmtB(item.value)}</b></div>)}
      </div>

	      <G02Section title={`FY${selectedPeriod} · ${selectedPeriod === peakGap.period ? tr({ en: "peak gap obligation detail", ar: "تفاصيل التزامات ذروة الفجوة", zh: "峰值缺口义务明细" }) : tr({ en: "obligation detail", ar: "تفاصيل الالتزامات", zh: "义务明细" })}`} sub={tr({ en: `Selected period inside ${horizonLabel}. Gap: ${fmtB(selectedTimeline.gap)}.`, ar: `الفترة المحددة ضمن ${horizonLabel}. الفجوة: ${fmtB(selectedTimeline.gap)}.`, zh: `${horizonLabel} 内所选期间。缺口：${fmtB(selectedTimeline.gap)}。` })}>
	        <div className="g2-table-wrap"><table className="g2-table"><thead><tr><th>{tr({ en: "Reference", ar: "المرجع", zh: "编号" })}</th><th>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</th><th>{tr({ en: "Object", ar: "العنصر", zh: "对象" })}</th><th>{tr({ en: "Nominal amount", ar: "المبلغ الاسمي", zh: "名义金额" })}</th><th>{tr({ en: "Probability", ar: "الاحتمال", zh: "概率" })}</th><th>{tr({ en: "Weighted amount", ar: "المبلغ المرجح", zh: "加权金额" })}</th><th>{tr({ en: "Owner", ar: "المالك", zh: "负责人" })}</th></tr></thead><tbody>
	          {(periodItems.length ? periodItems : forecastItems.slice(0, 3)).map((item) => <tr key={item.id}><td><b>{item.id}</b></td><td>{tr(item.type)}</td><td>{tr(item.object)}</td><td className="num">{fmtB(item.amount)}</td><td className="num">{item.probability}%</td><td className="num">{fmtB(item.amount * item.probability / 100)}</td><td>{tr(item.owner)}</td></tr>)}
	        </tbody></table></div>
	      </G02Section>

      <div className="g2-two-col forecast">
        <G02Section title={tr({ en: "Change since prior forecast", ar: "التغير منذ التنبؤ السابق", zh: "相对上一预测的变化" })}>
          <div className="g2-change-list"><div><span>{tr({ en: "New pipeline contracts", ar: "عقود جديدة قيد الإجراء", zh: "新增在途合同" })}</span><b className="bad">+SAR 120M</b></div><div><span>{tr({ en: "Project cost normalization", ar: "تطبيع تكلفة المشروع", zh: "项目成本校正" })}</span><b className="good">−SAR 32M</b></div><div><span>{tr({ en: "Housing support mix", ar: "مزيج دعم الإسكان", zh: "住房支持组合" })}</span><b className="good">−SAR 80M</b></div><div><span>{tr({ en: "Payment schedule shift", ar: "تحول جدول المدفوعات", zh: "付款计划调整" })}</span><b>+SAR 44M</b></div></div>
        </G02Section>
	        <G02Section title={tr({ en: "Downstream handoff for scenario testing", ar: "تسليم لاحق لاختبار السيناريو", zh: "下游情景试算交接" })} sub={tr({ en: "This is not an approval. It sends the approved budget baseline and current funding gap to scenario comparison.", ar: "هذا ليس اعتماداً. يرسل خط أساس الميزانية المعتمد وفجوة التمويل الحالية إلى مقارنة السيناريوهات.", zh: "这里不是审批动作，而是把已批准预算基线和当前资金缺口发送到情景比较。" })}>
	          <div className="g2-action-list">
	            <button onClick={() => navigate("plnscenario", `forecast:${state.forecast.versionId || forecastVersionId}:baseline:${state.baseline.versionId}`)}><div><b>{tr({ en: "Send current forecast to scenario comparison", ar: "إرسال التنبؤ الحالي إلى مقارنة السيناريوهات", zh: "发送当前预测到情景比较" })}</b><span>{tr({ en: "Input: approved budget baseline plus this funding forecast. Output: decision-ready scenario package.", ar: "المدخل: خط أساس الميزانية المعتمد مع تنبؤ التمويل الحالي. المخرج: حزمة سيناريو جاهزة للقرار.", zh: "输入：已批准预算基线 + 当前资金预测；输出：可决策的情景方案包。" })}</span></div><strong>→</strong></button>
	          </div>
	        </G02Section>
      </div>

      <G02Section title={tr({ en: "Mitigation queue", ar: "قائمة إجراءات المعالجة", zh: "资金缓释队列" })} sub={tr({ en: "These are candidate actions generated from the gap drivers. They are not approvals; they become scenario inputs after confirmation.", ar: "هذه إجراءات مرشحة من محركات الفجوة وليست اعتمادات؛ تصبح مدخلات سيناريو بعد التأكيد.", zh: "这些是由缺口驱动生成的候选动作，不是审批结果；确认后进入情景输入。" })}>
        <div className="g2-transfer-grid">
          <div className="warn"><span>{tr({ en: "Rephase payments", ar: "إعادة جدولة المدفوعات", zh: "重排付款" })}</span><b>+SAR 160M</b><small>{tr({ en: "timing relief only", ar: "تخفيف زمني فقط", zh: "仅时点缓释" })}</small></div>
          <div className="good"><span>{tr({ en: "Normalize project cost", ar: "تطبيع تكلفة المشروع", zh: "校正项目成本" })}</span><b>+SAR 32M</b><small>{state.cost.versionId || "working estimate"}</small></div>
          <div className="good"><span>{tr({ en: "Adjust housing mix", ar: "تعديل مزيج الإسكان", zh: "调整住房组合" })}</span><b>+SAR 80M</b><small>{state.housing.versionId || "support draft"}</small></div>
          <div className="warn"><span>{tr({ en: "Reserve tolerance", ar: "تحمل الاحتياطي", zh: "预留容忍度" })}</span><b>Policy</b><small>{tr({ en: "requires committee review", ar: "يتطلب مراجعة اللجنة", zh: "需要委员会复核" })}</small></div>
        </div>
      </G02Section>

      <DecisionFooter guard={baselineApproved ? tr({ en: "The approved baseline is linked. This forecast can be confirmed and used in formal scenario comparison.", ar: "خط الأساس المعتمد مرتبط. يمكن تأكيد هذا التنبؤ واستخدامه في مقارنة السيناريو الرسمية.", zh: "已关联批准基线，可确认预测并用于正式情景比较。" }) : tr({ en: "Preview only. Approve the budget baseline before confirming this forecast.", ar: "معاينة فقط. اعتمد خط أساس الميزانية قبل تأكيد التنبؤ.", zh: "当前仅预览，请先批准预算基线再确认预测。" })} guardTone={baselineApproved ? "ok" : "bad"}>
        <button className="btn ghost sm" onClick={() => update("forecast", { selectedPeriod, includeProbable })}>{tr({ en: "Save forecast draft", ar: "حفظ مسودة التنبؤ", zh: "保存预测草稿" })}</button>
        <button className="btn sm" disabled={!baselineApproved} onClick={confirmForecast}>{tr({ en: "Confirm forecast", ar: "تأكيد التنبؤ", zh: "确认预测" })}</button>
        <button className="btn secondary sm" disabled={!state.forecast.versionId} onClick={() => navigate("plnscenario", `forecast:${state.forecast.versionId}`)}>{tr({ en: "Send to scenario comparison", ar: "إرسال إلى مقارنة السيناريو", zh: "发送到情景比较" })}</button>
      </DecisionFooter>

	      {sourceOpen && <G02Modal tr={tr} title={tr({ en: "Forecast sources & confidence", ar: "مصادر التنبؤ والثقة", zh: "预测来源与置信度" })} sub={`${forecastVersionId} · 84%`} onClose={() => setSourceOpen(false)}>
        <div className="g2-source-list compact"><div className="g2-source-row"><div><b>SAP</b><span>{tr({ en: "Approved contracts and obligations", ar: "العقود والالتزامات المعتمدة", zh: "已批准合同与义务" })}</span></div><strong>99%</strong></div><div className="g2-source-row"><div><b>Etimad</b><span>{tr({ en: "Payment schedule and pipeline", ar: "جدول المدفوعات والعقود قيد الإجراء", zh: "付款计划与在途合同" })}</span></div><strong>97%</strong></div><div className="g2-source-row"><div><b>Project Intake</b><span>{tr({ en: "Future project cost assumptions", ar: "افتراضات تكلفة المشاريع المستقبلية", zh: "未来项目成本假设" })}</span></div><strong>88%</strong></div></div>
      </G02Modal>}
    </div>
  );
}

export function ScenarioDecisionPage({ tr, state, update, navigate, onBack, onAlerts, onSmartQuery, openPerformance }) {
  const [selectedId, setSelectedId] = useState(state.scenario.selectedId || "balanced");
  const [assumptionOpen, setAssumptionOpen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState("financial");
  const baselineYear = Number(state.context.fiscalYear || 2027);
  const forecastOffset = baselineYear - 2027;
  const forecastTimeline = useMemo(
    () => G02_FORECAST_TIMELINE.map((entry) => ({ ...entry, period: shiftForecastPeriod(entry.period, forecastOffset) })),
    [forecastOffset],
  );
  const peakGap = useMemo(
    () => forecastTimeline.reduce((peak, item) => (item.gap > peak.gap ? item : peak), forecastTimeline[0]),
    [forecastTimeline],
  );
  const firstGap = useMemo(
    () => forecastTimeline.find((item) => item.gap >= 0.1) || peakGap,
    [forecastTimeline, peakGap],
  );
  const baselineApproved = state.baseline.status === "approved";
  const forecastReady = state.forecast.status === "confirmed";
  const baseFiscalSpace = Number(state.baseline.fiscalSpace || 2.84);
  const basePeakGap = Number(peakGap?.gap || 0.58);
  const forecastVersionId = state.forecast.versionId || `FV-${baselineYear}-QTR-03-DRAFT`;
  const baselineVersionId = state.baseline.versionId || `BL-${baselineYear}-DRAFT`;
  const horizonLabel = `FY${baselineYear} - FY${baselineYear + 3}`;
  const scenarioOptions = useMemo(() => {
    const clampGap = (reduction) => Math.max(0, Number((basePeakGap - reduction).toFixed(2)));
    const option = ({
      id,
      code,
      name,
      shortName,
      type,
      tag,
      summary,
      risk,
      fiscalLift,
      deficitReduction,
      liquidityImpact,
      serviceImpact,
      confidence,
      assumptions,
      contributions,
      recommendation,
      tradeoff,
      approval,
      locked = false,
      recommended = false,
      manual = false,
    }) => ({
      id,
      code,
      name,
      shortName,
      type,
      tag,
      summary,
      risk,
      confidence,
      assumptions,
      contributions,
      recommendation,
      tradeoff,
      approval,
      locked,
      recommended,
      manual,
      fiscalSpace: Number((baseFiscalSpace + fiscalLift).toFixed(2)),
      peakGapAfter: clampGap(deficitReduction),
      deficitReduction,
      liquidityImpact,
      serviceImpact,
    });

    return [
      option({
        id: "baseline",
        code: "BAS",
        name: { en: "Baseline carry-forward", ar: "ترحيل خط الأساس", zh: "基线延续方案" },
        shortName: { en: "Baseline", ar: "خط الأساس", zh: "基线" },
        type: { en: "No action", ar: "دون إجراء", zh: "不干预" },
        tag: { en: "Locked allocation baseline", ar: "خط أساس توزيع مقفل", zh: "锁定分配基线" },
        summary: { en: "Carries the approved allocation into the funding forecast without mitigation.", ar: "ينقل التوزيع المعتمد إلى تنبؤ التمويل دون معالجة.", zh: "将已批准分配直接带入资金预测，不做缓释。" },
        risk: "tight",
        fiscalLift: 0,
        deficitReduction: 0,
        liquidityImpact: 0,
        serviceImpact: 0,
        confidence: 84,
        locked: true,
        assumptions: [
          { id: "reserve", label: { en: "Reserve policy", ar: "سياسة الاحتياطي", zh: "预留政策" }, current: fmtB(state.baseline.reserve), scenario: { en: "No release", ar: "دون تحرير", zh: "不释放" }, effect: "0.00B", source: { en: "Locked allocation baseline", ar: "خط أساس التوزيع المقفل", zh: "锁定分配基线" } },
          { id: "payment", label: { en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }, current: fmtB(state.baseline.paymentPlan), scenario: { en: "Original phasing", ar: "الجدولة الأصلية", zh: "原始节奏" }, effect: "0.00B", source: { en: "Funding forecast", ar: "تنبؤ التمويل", zh: "资金预测" } },
          { id: "revenue", label: { en: "Revenue plan", ar: "خطة الإيرادات", zh: "收入计划" }, current: { en: "Approved plan", ar: "الخطة المعتمدة", zh: "已批准计划" }, scenario: { en: "No uplift", ar: "دون زيادة", zh: "无增长" }, effect: "0.00B", source: { en: "Approved data version", ar: "نسخة البيانات المعتمدة", zh: "已批准数据版本" } },
        ],
        contributions: [
          { id: "payment", label: { en: "Payment timing", ar: "توقيت الدفع", zh: "付款节奏" }, amount: 0, kind: "timing", note: { en: "No change", ar: "دون تغيير", zh: "未调整" } },
          { id: "reserve", label: { en: "Reserve release", ar: "تحرير الاحتياطي", zh: "释放预留" }, amount: 0, kind: "transfer", note: { en: "No release", ar: "دون تحرير", zh: "未释放" } },
          { id: "revenue", label: { en: "Revenue assumption", ar: "افتراض الإيرادات", zh: "收入假设" }, amount: 0, kind: "real", note: { en: "Base plan", ar: "الخطة الأساسية", zh: "基准计划" } },
        ],
        recommendation: { en: "Use only as the comparison baseline; it leaves the peak funding gap unresolved.", ar: "استخدمه فقط كخط أساس للمقارنة لأنه يترك ذروة فجوة التمويل دون معالجة.", zh: "仅作为对比基线使用，因为峰值资金缺口未被处理。" },
        tradeoff: { en: "No policy disruption, but no liquidity relief.", ar: "لا يسبب اضطراباً سياسياً لكنه لا يخفف السيولة.", zh: "政策扰动最低，但没有流动性缓释。" },
        approval: { en: "Not approvable as mitigation", ar: "غير قابل للاعتماد كمعالجة", zh: "不能作为缓释方案审批" },
      }),
      option({
        id: "balanced",
        code: "BAL",
        name: { en: "Balanced liquidity mitigation", ar: "معالجة سيولة متوازنة", zh: "平衡流动性缓释方案" },
        shortName: { en: "Balanced", ar: "متوازن", zh: "平衡" },
        type: { en: "Most likely", ar: "الأكثر احتمالاً", zh: "最可能方案" },
        tag: { en: "Recommended", ar: "موصى به", zh: "推荐" },
        summary: { en: "Combines moderate reserve release, payment rephasing, and revenue upside while protecting service delivery.", ar: "يجمع تحريراً متوسطاً للاحتياطي وإعادة جدولة الدفع وتحسن الإيرادات مع حماية تقديم الخدمات.", zh: "组合适度释放预留、付款后移和收入上行情景，同时保护服务交付。" },
        risk: "watch",
        fiscalLift: 0.31,
        deficitReduction: 0.36,
        liquidityImpact: 0.28,
        serviceImpact: 2.8,
        confidence: 89,
        recommended: true,
        assumptions: [
          { id: "reserve", label: { en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "预留比例" }, current: "10.0%", scenario: "9.2%", effect: "+0.08B", source: { en: "Committee-adjustable policy", ar: "سياسة قابلة للتعديل من اللجنة", zh: "委员会可调政策" } },
          { id: "payment", label: { en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }, current: { en: "Steady phasing", ar: "جدولة ثابتة", zh: "平稳支付" }, scenario: { en: "+1 quarter for low-risk contracts", ar: "+ربع واحد للعقود منخفضة المخاطر", zh: "低风险合同后移 1 季度" }, effect: "+0.16B", source: { en: "Obligation payment curve", ar: "منحنى سداد الالتزامات", zh: "义务付款曲线" } },
          { id: "revenue", label: { en: "Revenue plan", ar: "خطة الإيرادات", zh: "收入计划" }, current: { en: "Base plan", ar: "الخطة الأساسية", zh: "基准计划" }, scenario: "+1.2%", effect: "+0.05B", source: { en: "Approved revenue sensitivity", ar: "حساسية الإيرادات المعتمدة", zh: "已批准收入敏感性" } },
          { id: "city", label: { en: "City priority", ar: "أولوية المدينة", zh: "城市优先级" }, current: { en: "Even split", ar: "توزيع متساو", zh: "均衡分配" }, scenario: { en: "Shift to pressure cities", ar: "تحويل إلى المدن ذات الضغط", zh: "转向压力城市" }, effect: "+0.07B", source: { en: "Allocation priority weights", ar: "أوزان أولوية التوزيع", zh: "分配优先级权重" } },
        ],
        contributions: [
          { id: "payment", label: { en: "Payment timing", ar: "توقيت الدفع", zh: "付款节奏" }, amount: 0.16, kind: "timing", note: { en: "Liquidity timing, not real saving", ar: "توقيت سيولة لا وفر حقيقي", zh: "流动性时点调整，非真实节约" } },
          { id: "reserve", label: { en: "Reserve release", ar: "تحرير الاحتياطي", zh: "释放预留" }, amount: 0.08, kind: "transfer", note: { en: "Requires committee tolerance", ar: "يتطلب تحمل اللجنة", zh: "需要委员会容忍度" } },
          { id: "city", label: { en: "City-priority reallocation", ar: "إعادة تخصيص حسب أولوية المدينة", zh: "按城市优先级再分配" }, amount: 0.07, kind: "service", note: { en: "Protects high-pressure cities", ar: "يحمي المدن ذات الضغط العالي", zh: "保护高压力城市" } },
          { id: "revenue", label: { en: "Revenue upside", ar: "تحسن الإيرادات", zh: "收入上行" }, amount: 0.05, kind: "real", note: { en: "Scenario assumption", ar: "افتراض سيناريو", zh: "情景假设" } },
        ],
        recommendation: { en: "Recommended for committee review because it materially reduces the peak funding gap without turning service impact negative.", ar: "موصى به لمراجعة اللجنة لأنه يخفض ذروة فجوة التمويل بشكل ملموس دون تحويل أثر الخدمات إلى سلبي.", zh: "建议提交委员会评审，因为它显著降低峰值资金缺口，同时不让服务影响转负。" },
        tradeoff: { en: "SAR 80M reserve release needs explicit tolerance and quarterly monitoring.", ar: "تحرير 80 مليون ريال من الاحتياطي يحتاج إلى قبول صريح ومتابعة ربع سنوية.", zh: "释放 SAR 80M 预留需要明确容忍度，并进行季度监控。" },
        approval: { en: "Ready for financial committee review", ar: "جاهز لمراجعة اللجنة المالية", zh: "可提交财务委员会评审" },
      }),
      option({
        id: "reserve_guard",
        code: "RSV",
        name: { en: "Reserve-protected scenario", ar: "سيناريو حماية الاحتياطي", zh: "预留保护方案" },
        shortName: { en: "Reserve guard", ar: "حماية الاحتياطي", zh: "预留保护" },
        type: { en: "Best case for liquidity", ar: "الأفضل للسيولة", zh: "流动性最优" },
        tag: { en: "Low financial risk", ar: "مخاطر مالية منخفضة", zh: "财务风险低" },
        summary: { en: "Keeps reserve discipline and uses stronger payment rephasing plus revenue upside to protect liquidity.", ar: "يحافظ على انضباط الاحتياطي ويستخدم إعادة جدولة أقوى للدفع وتحسن الإيرادات لحماية السيولة.", zh: "保持预留纪律，通过更强付款后移和收入上行情景保护流动性。" },
        risk: "healthy",
        fiscalLift: 0.42,
        deficitReduction: 0.46,
        liquidityImpact: 0.35,
        serviceImpact: -1.2,
        confidence: 86,
        assumptions: [
          { id: "reserve", label: { en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "预留比例" }, current: "10.0%", scenario: "10.0%", effect: "+0.00B", source: { en: "Policy preserved", ar: "السياسة محفوظة", zh: "政策保持" } },
          { id: "payment", label: { en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }, current: { en: "Steady phasing", ar: "جدولة ثابتة", zh: "平稳支付" }, scenario: { en: "+2 quarters for deferrable packages", ar: "+ربعان للحزم القابلة للتأجيل", zh: "可延期包后移 2 季度" }, effect: "+0.24B", source: { en: "Contract priority screen", ar: "فرز أولوية العقود", zh: "合同优先级筛选" } },
          { id: "revenue", label: { en: "Revenue plan", ar: "خطة الإيرادات", zh: "收入计划" }, current: { en: "Base plan", ar: "الخطة الأساسية", zh: "基准计划" }, scenario: "+1.8%", effect: "+0.10B", source: { en: "Optimistic sensitivity", ar: "حساسية متفائلة", zh: "乐观敏感性" } },
          { id: "service", label: { en: "Service priority", ar: "أولوية الخدمات", zh: "服务优先级" }, current: "30%", scenario: "27%", effect: "+0.12B", source: { en: "Manual committee assumption", ar: "افتراض يدوي من اللجنة", zh: "委员会手工假设" } },
        ],
        contributions: [
          { id: "payment", label: { en: "Payment timing", ar: "توقيت الدفع", zh: "付款节奏" }, amount: 0.24, kind: "timing", note: { en: "Largest impact, defers pressure", ar: "الأثر الأكبر ويؤجل الضغط", zh: "影响最大，后移压力" } },
          { id: "service", label: { en: "Service-priority trade-off", ar: "مفاضلة أولوية الخدمة", zh: "服务优先权衡" }, amount: 0.12, kind: "service", note: { en: "Negative service effect", ar: "أثر خدمي سلبي", zh: "服务影响为负" } },
          { id: "revenue", label: { en: "Revenue upside", ar: "تحسن الإيرادات", zh: "收入上行" }, amount: 0.1, kind: "real", note: { en: "Optimistic", ar: "متفائل", zh: "偏乐观" } },
        ],
        recommendation: { en: "Financially strong, but should not be selected without explicit service-impact acceptance.", ar: "قوي مالياً، لكن لا ينبغي اختياره دون قبول صريح لأثر الخدمة.", zh: "财务上更强，但需明确接受服务影响后才可选择。" },
        tradeoff: { en: "Protects reserve but pushes more obligation pressure into later quarters.", ar: "يحمي الاحتياطي لكنه يدفع ضغط التزامات أكبر إلى أرباع لاحقة.", zh: "保护预留，但把更多义务压力推向后续季度。" },
        approval: { en: "Requires service-impact waiver", ar: "يتطلب استثناء لأثر الخدمة", zh: "需要服务影响豁免" },
      }),
      option({
        id: "service_continuity",
        code: "SRV",
        name: { en: "Service-continuity scenario", ar: "سيناريو استمرارية الخدمات", zh: "服务连续性方案" },
        shortName: { en: "Service first", ar: "الخدمة أولاً", zh: "服务优先" },
        type: { en: "Service priority", ar: "أولوية الخدمة", zh: "服务优先" },
        tag: { en: "High service outcome", ar: "أثر خدمة مرتفع", zh: "服务结果高" },
        summary: { en: "Keeps high-priority service commitments intact and uses smaller liquidity levers.", ar: "يحافظ على التزامات الخدمات عالية الأولوية ويستخدم أدوات سيولة أصغر.", zh: "保留高优先级服务承诺，只使用较小的流动性杠杆。" },
        risk: "watch",
        fiscalLift: 0.2,
        deficitReduction: 0.24,
        liquidityImpact: 0.16,
        serviceImpact: 4.4,
        confidence: 88,
        assumptions: [
          { id: "reserve", label: { en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "预留比例" }, current: "10.0%", scenario: "9.6%", effect: "+0.04B", source: { en: "Limited policy release", ar: "تحرير محدود للسياسة", zh: "有限政策释放" } },
          { id: "payment", label: { en: "Payment plan", ar: "خطة الدفع", zh: "付款计划" }, current: { en: "Steady phasing", ar: "جدولة ثابتة", zh: "平稳支付" }, scenario: { en: "+1 quarter only outside critical services", ar: "+ربع واحد خارج الخدمات الحرجة", zh: "仅非关键服务后移 1 季度" }, effect: "+0.09B", source: { en: "Criticality filter", ar: "مرشح الأهمية", zh: "关键性筛选" } },
          { id: "city", label: { en: "City priority", ar: "أولوية المدينة", zh: "城市优先级" }, current: { en: "Even split", ar: "توزيع متساو", zh: "均衡分配" }, scenario: { en: "Protect Riyadh and Makkah pressure lines", ar: "حماية بنود ضغط الرياض ومكة", zh: "保护 Riyadh 和 Makkah 压力行" }, effect: "+0.07B", source: { en: "Allocation priority weights", ar: "أوزان أولوية التوزيع", zh: "分配优先级权重" } },
          { id: "cost", label: { en: "Unit cost benchmark", ar: "معيار تكلفة الوحدة", zh: "单位成本基准" }, current: { en: "Base benchmark", ar: "المعيار الأساسي", zh: "基准成本" }, scenario: "-2.0%", effect: "+0.04B", source: { en: "Manual assumption, review required", ar: "افتراض يدوي يتطلب مراجعة", zh: "手工假设，需要复核" } },
        ],
        contributions: [
          { id: "payment", label: { en: "Payment timing", ar: "توقيت الدفع", zh: "付款节奏" }, amount: 0.09, kind: "timing", note: { en: "Limited to non-critical lines", ar: "محدود للبنود غير الحرجة", zh: "仅非关键项" } },
          { id: "city", label: { en: "City-priority reallocation", ar: "إعادة تخصيص حسب أولوية المدينة", zh: "按城市优先级再分配" }, amount: 0.07, kind: "service", note: { en: "Raises service score", ar: "يرفع درجة الخدمة", zh: "提升服务得分" } },
          { id: "reserve", label: { en: "Reserve release", ar: "تحرير الاحتياطي", zh: "释放预留" }, amount: 0.04, kind: "transfer", note: { en: "Small release", ar: "تحرير صغير", zh: "小幅释放" } },
          { id: "cost", label: { en: "Unit cost assumption", ar: "افتراض تكلفة الوحدة", zh: "单位成本假设" }, amount: 0.04, kind: "real", note: { en: "Needs source tag", ar: "يحتاج وسم مصدر", zh: "需要来源标记" } },
        ],
        recommendation: { en: "Useful when leadership prioritizes visible service continuity over maximum liquidity relief.", ar: "مفيد عندما تعطي القيادة أولوية لاستمرارية الخدمة المرئية على أعلى تخفيف للسيولة.", zh: "适合领导更重视服务连续性而不是最大化流动性缓释的情况。" },
        tradeoff: { en: "Peak gap remains higher than the recommended scenario.", ar: "تبقى ذروة الفجوة أعلى من السيناريو الموصى به.", zh: "峰值缺口仍高于推荐方案。" },
        approval: { en: "Reviewable with liquidity note", ar: "قابل للمراجعة مع ملاحظة سيولة", zh: "可评审，但需附流动性说明" },
      }),
      option({
        id: "custom_stress",
        code: "CST",
        name: { en: "Custom stress draft", ar: "مسودة ضغط مخصصة", zh: "自定义压力草稿" },
        shortName: { en: "Custom", ar: "مخصص", zh: "自定义" },
        type: { en: "Manual assumption", ar: "افتراض يدوي", zh: "手工假设" },
        tag: { en: "Needs justification", ar: "يتطلب مبرراً", zh: "需要理由" },
        summary: { en: "A what-if package with manual assumptions clearly tagged for review.", ar: "حزمة ماذا لو بافتراضات يدوية موسومة بوضوح للمراجعة.", zh: "带明确手工假设标记的 what-if 方案包。" },
        risk: "tight",
        fiscalLift: 0.12,
        deficitReduction: 0.17,
        liquidityImpact: 0.08,
        serviceImpact: 1.1,
        confidence: 73,
        manual: true,
        assumptions: [
          { id: "reserve", label: { en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "预留比例" }, current: "10.0%", scenario: "8.8%", effect: "+0.12B", source: { en: "Manual, requires reason", ar: "يدوي ويتطلب سبباً", zh: "手工，需要理由" } },
          { id: "revenue", label: { en: "Revenue plan", ar: "خطة الإيرادات", zh: "收入计划" }, current: { en: "Base plan", ar: "الخطة الأساسية", zh: "基准计划" }, scenario: "-0.6%", effect: "-0.04B", source: { en: "Stress assumption", ar: "افتراض ضغط", zh: "压力假设" } },
          { id: "cost", label: { en: "Unit cost benchmark", ar: "معيار تكلفة الوحدة", zh: "单位成本基准" }, current: { en: "Base benchmark", ar: "المعيار الأساسي", zh: "基准成本" }, scenario: "+3.0%", effect: "-0.03B", source: { en: "Manual, source missing", ar: "يدوي ومصدره مفقود", zh: "手工，缺少来源" } },
        ],
        contributions: [
          { id: "reserve", label: { en: "Reserve release", ar: "تحرير الاحتياطي", zh: "释放预留" }, amount: 0.12, kind: "transfer", note: { en: "High policy exposure", ar: "تعرض سياسي عال", zh: "政策暴露较高" } },
          { id: "payment", label: { en: "Payment timing", ar: "توقيت الدفع", zh: "付款节奏" }, amount: 0.05, kind: "timing", note: { en: "Manual phasing", ar: "جدولة يدوية", zh: "手工节奏" } },
        ],
        recommendation: { en: "Keep as a workshop what-if only until every manual assumption has an owner, date, and source.", ar: "أبقِه كحالة ماذا لو في ورشة العمل فقط حتى يكون لكل افتراض يدوي مالك وتاريخ ومصدر.", zh: "仅作为 workshop what-if 保留，直到每个手工假设都有负责人、日期和来源。" },
        tradeoff: { en: "Lower confidence because several assumptions are manually entered.", ar: "ثقة أقل لأن عدة افتراضات مدخلة يدوياً.", zh: "多个假设手工录入，置信度较低。" },
        approval: { en: "Cannot submit until justified", ar: "لا يمكن إرساله حتى يبرر", zh: "补充理由前不可提交" },
      }),
    ];
  }, [baseFiscalSpace, basePeakGap, state.baseline.paymentPlan, state.baseline.reserve]);
  const selected = scenarioOptions.find((scenario) => scenario.id === selectedId) || scenarioOptions[1];
  const blocking = !baselineApproved || !forecastReady || selected.manual;
  const status = state.scenario.status === "approved" ? tr({ en: "Approved", ar: "معتمد", zh: "已批准" }) : state.scenario.status === "in_review" ? tr({ en: "In review", ar: "قيد المراجعة", zh: "待审批" }) : tr({ en: "Scenario draft", ar: "مسودة سيناريو", zh: "情景草稿" });
  const comparisonRows = [
    {
      id: "fiscal",
      label: { en: "Fiscal space after simulation", ar: "الحيز المالي بعد المحاكاة", zh: "模拟后财政空间" },
      value: (scenario) => fmtB(scenario.fiscalSpace),
    },
    {
      id: "gap",
      label: { en: "Peak funding gap after actions", ar: "ذروة فجوة التمويل بعد الإجراءات", zh: "动作后峰值资金缺口" },
      value: (scenario) => fmtB(scenario.peakGapAfter),
    },
    {
      id: "reduction",
      label: { en: "Gap reduction vs forecast", ar: "خفض الفجوة مقابل التنبؤ", zh: "相对预测的缺口降低" },
      value: (scenario) => fmtB(scenario.deficitReduction),
    },
    {
      id: "liquidity",
      label: { en: "Liquidity impact", ar: "أثر السيولة", zh: "流动性影响" },
      value: (scenario) => `${scenario.liquidityImpact >= 0 ? "+" : "-"}${fmtB(Math.abs(scenario.liquidityImpact))}`,
    },
    {
      id: "service",
      label: { en: "Service impact", ar: "أثر الخدمات", zh: "服务影响" },
      value: (scenario) => `${scenario.serviceImpact > 0 ? "+" : ""}${scenario.serviceImpact.toFixed(1)}%`,
    },
    {
      id: "risk",
      label: { en: "Decision risk", ar: "مخاطر القرار", zh: "决策风险" },
      value: (scenario) => tr(riskCopy[scenario.risk] || riskCopy.watch),
    },
  ];
  const chartData = scenarioOptions.slice(0, 4).map((scenario) => ({
    name: tr(scenario.shortName),
    fiscalSpace: scenario.fiscalSpace,
    peakGap: scenario.peakGapAfter,
    deficitReduction: scenario.deficitReduction,
  }));
  const maxContribution = Math.max(0.01, ...selected.contributions.map((item) => item.amount));
  const pageCopy = pageHeader("plnscenario", {
    title: { en: "Financial scenario simulation & alternatives comparison", ar: "محاكاة السيناريوهات المالية ومقارنة البدائل", zh: "财务情景模拟与备选方案比较" },
    sub: { en: "Mix the approved budget allocation baseline with the obligation forecast, test assumption packages, then prepare a reviewable scenario decision.", ar: "اخلط خط أساس توزيع الميزانية المعتمد مع تنبؤ الالتزامات، واختبر حزم الافتراضات، ثم جهز قرار سيناريو قابل للمراجعة.", zh: "把已批准预算分配基线与义务预测混合，试算多组假设包，并形成可评审的情景决策。" },
  });

  const submit = () => update("scenario", { status: "in_review", selectedId, submittedAt: "05 Jul 2026 · 15:20" }, { type: "Scenario", detail: `${selected.code} scenario submitted for financial committee review.` });
  const approve = () => {
    const versionId = `SC-${baselineYear}-${selected.code}-01`;
    update("scenario", { status: "approved", versionId, selectedId, approvedAt: "05 Jul 2026 · 15:32" }, { type: "Approval", detail: `${selected.code} approved as the scenario package for execution tracking.` });
    update("context", { scenarioVersionId: versionId });
  };

  return (
    <div className="g2-page g2-uc05-page fade">
      <G02Header
        tr={tr}
        title={pageCopy.title}
        sub={pageCopy.sub}
        onBack={onBack}
        onAlerts={onAlerts}
        onSmartQuery={onSmartQuery}
        storyline={<G02BusinessStoryline
          tr={tr}
          current="scenario"
          output={{ en: `Current: scenario package SC-${baselineYear}-${selected.code}-01`, ar: `الحالي: حزمة السيناريو SC-${baselineYear}-${selected.code}-01` }}
          tags={[
            { en: "Budget baseline referenced", ar: "تم ربط خط أساس الميزانية" },
            { en: "Funding forecast referenced", ar: "تم ربط تنبؤ التمويل" },
            { en: "Performance reports next", ar: "الأداء والتقارير لاحقاً" },
          ]}
          navigate={navigate}
        />}
      />
      {!baselineApproved && <div className="g2-callout warn top"><b>{tr({ en: "Budget allocation baseline is not approved", ar: "خط أساس توزيع الميزانية غير معتمد", zh: "预算分配基线尚未批准" })}</b><p>{tr({ en: "Scenario simulation can be previewed, but the decision package cannot be submitted until the allocation baseline is locked.", ar: "يمكن معاينة محاكاة السيناريو، لكن لا يمكن إرسال حزمة القرار حتى يقفل خط أساس التوزيع.", zh: "可以预览情景模拟，但分配基线锁定前不能提交决策包。" })}</p></div>}
      {baselineApproved && !forecastReady && <div className="g2-callout warn top"><b>{tr({ en: "Funding forecast is still a working run", ar: "تنبؤ التمويل ما زال نسخة عمل", zh: "资金预测仍是工作版" })}</b><p>{tr({ en: "The page shows the simulation structure, but committee submission stays locked until the forecast run is confirmed.", ar: "تعرض الصفحة بنية المحاكاة، لكن إرسال اللجنة يبقى مقفلاً حتى يتم تأكيد تشغيل التنبؤ.", zh: "页面展示模拟结构，但预测版本确认前，委员会提交仍锁定。" })}</p></div>}

      <section className="g2-uc05-foundation">
        <div className="g2-uc05-foundation-copy">
          <span>{tr({ en: "Simulation foundation", ar: "أساس المحاكاة", zh: "模拟基础" })}</span>
          <h2>{tr({ en: "Approved budget baseline plus funding-pressure forecast", ar: "خط أساس الميزانية المعتمد مع تنبؤ ضغط التمويل", zh: "已批准预算基线 + 资金压力预测" })}</h2>
          <p>{tr({ en: "This workspace does not recalculate the baseline or forecast. It tests policy and economic assumptions against those two versioned results.", ar: "لا تعيد مساحة العمل هذه احتساب خط الأساس أو التنبؤ، بل تختبر الافتراضات الاقتصادية والسياسية مقابل هاتين النتيجتين ذواتي النسخة.", zh: "此工作台不重新计算基线或预测，而是在这两个有版本的结果之上测试政策与经济假设。" })}</p>
        </div>
        <div className="g2-uc05-foundation-grid">
          <button onClick={() => navigate("plnbudget")} className="g2-uc05-basis-card">
            <span>{tr({ en: "Budget baseline", ar: "خط أساس الميزانية", zh: "预算基线" })}</span>
            <b>{tr({ en: "Approved allocation baseline", ar: "خط أساس التوزيع المعتمد", zh: "已批准分配基线" })}</b>
            <small>{baselineVersionId} · FY{baselineYear}</small>
            <div><strong>{fmtB(baseFiscalSpace)}</strong><em>{tr({ en: "fiscal space", ar: "حيز مالي", zh: "财政空间" })}</em></div>
            <div><strong>{fmtB(state.baseline.reserve)}</strong><em>{tr({ en: "reserve", ar: "احتياطي", zh: "预留" })}</em></div>
          </button>
          <button onClick={() => navigate("plnforecast", `period:${peakGap.period}`)} className="g2-uc05-basis-card pressure">
            <span>{tr({ en: "Funding forecast", ar: "تنبؤ التمويل", zh: "资金预测" })}</span>
            <b>{tr({ en: "Future obligation forecast", ar: "تنبؤ الالتزامات المستقبلية", zh: "未来义务预测" })}</b>
            <small>{forecastVersionId} · {horizonLabel}</small>
            <div><strong>{fmtB(basePeakGap)}</strong><em>{tr({ en: `peak gap FY${peakGap.period}`, ar: `ذروة الفجوة FY${peakGap.period}`, zh: `峰值缺口 FY${peakGap.period}` })}</em></div>
            <div><strong>FY{firstGap.period}</strong><em>{tr({ en: "first material gap", ar: "أول فجوة جوهرية", zh: "首次显著缺口" })}</em></div>
          </button>
          <div className="g2-uc05-rule-card">
            <span>{tr({ en: "Decision control", ar: "ضابط القرار", zh: "决策控制点" })}</span>
            <b>{tr({ en: "Scenario is not a final decision", ar: "السيناريو ليس قراراً نهائياً", zh: "情景不是最终财务决策" })}</b>
            <p>{tr({ en: "Every scenario keeps owner, date, source versions, assumption list, and audit trail before approval.", ar: "يحتفظ كل سيناريو بالمالك والتاريخ ونسخ المصدر وقائمة الافتراضات ومسار التدقيق قبل الاعتماد.", zh: "每个情景在审批前必须保留负责人、日期、来源版本、假设清单和审计轨迹。" })}</p>
          </div>
        </div>
      </section>

      <AIReadyNotice
        tr={tr}
        tags={[
          { en: "Budget baseline locked", ar: "خط أساس الميزانية مقفل", zh: "预算基线已锁定" },
          { en: "Funding forecast referenced", ar: "تنبؤ التمويل مستند إليه", zh: "资金预测已引用" },
          { en: "Assumption package explainable", ar: "حزمة الافتراضات قابلة للتفسير", zh: "假设包可解释" },
          { en: "Decision package can be generated", ar: "يمكن إنشاء حزمة قرار", zh: "可生成决策包" },
        ]}
      >
        {tr({ en: `AI has prepared scenario assumptions, comparison outputs, recommendation rationale, and review evidence from the approved budget baseline and funding forecast for ${selected.name.en}.`, ar: `أعد الذكاء الاصطناعي افتراضات السيناريو ومخرجات المقارنة ومبررات التوصية وأدلة المراجعة من خط أساس الميزانية المعتمد وتنبؤ التمويل لـ ${selected.name.ar}.`, zh: `AI 已基于预算基线和资金压力预测，为${selected.name.zh}准备好情景假设、方案对比结果、推荐理由和复核证据。` })}
      </AIReadyNotice>

      <div className="g2-uc05-layout">
        <aside className="g2-uc05-scenario-list">
          <div className="g2-uc05-list-head">
            <span>{tr({ en: "Scenario package", ar: "حزمة السيناريو", zh: "情景包" })}</span>
            <b>{scenarioOptions.length} {tr({ en: "options", ar: "خيارات", zh: "个方案" })}</b>
          </div>
          {scenarioOptions.map((scenario) => (
            <button key={scenario.id} className={`${selected.id === scenario.id ? "on" : ""} ${scenario.locked ? "locked" : ""}`} onClick={() => setSelectedId(scenario.id)}>
              <div>
                <span>{tr(scenario.tag)}</span>
                <b>{tr(scenario.name)}</b>
                <small>{tr(scenario.summary)}</small>
              </div>
              <RiskPill tr={tr} risk={scenario.risk} />
            </button>
          ))}
          <button className="g2-uc05-create" onClick={() => { setSelectedId("custom_stress"); setAssumptionOpen(true); }}>+ {tr({ en: "Create what-if", ar: "إنشاء ماذا لو", zh: "创建 what-if" })}</button>
        </aside>

        <main className="g2-uc05-main">
          <KpiStrip configRoute="plnscenario" items={[
            { id: "fiscal", label: tr({ en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" }), value: fmtB(selected.fiscalSpace), note: `${selected.fiscalSpace - baseFiscalSpace >= 0 ? "+" : "-"}${fmtB(Math.abs(selected.fiscalSpace - baseFiscalSpace))} ${tr({ en: "vs baseline", ar: "مقابل خط الأساس", zh: "相对基线" })}`, tone: selected.fiscalSpace >= baseFiscalSpace ? "good" : "warn" },
            { id: "gap", label: tr({ en: "Peak gap after scenario", ar: "ذروة الفجوة بعد السيناريو", zh: "情景后峰值缺口" }), value: fmtB(selected.peakGapAfter), note: `FY${peakGap.period}`, tone: selected.peakGapAfter > 0.3 ? "warn" : "good" },
            { id: "reduction", label: tr({ en: "Deficit reduction", ar: "خفض العجز", zh: "缺口降低" }), value: fmtB(selected.deficitReduction), note: tr({ en: "vs funding forecast", ar: "مقابل تنبؤ التمويل", zh: "相对资金预测" }), tone: selected.deficitReduction > 0 ? "good" : "" },
            { id: "liquidity", label: tr({ en: "Liquidity impact", ar: "أثر السيولة", zh: "流动性影响" }), value: `${selected.liquidityImpact >= 0 ? "+" : "-"}${fmtB(Math.abs(selected.liquidityImpact))}`, note: tr({ en: "near-term headroom", ar: "هامش قريب الأجل", zh: "近期空间" }), tone: selected.liquidityImpact >= 0 ? "good" : "warn" },
            { id: "service", label: tr({ en: "Service impact", ar: "أثر الخدمات", zh: "服务影响" }), value: `${selected.serviceImpact > 0 ? "+" : ""}${selected.serviceImpact.toFixed(1)}%`, note: tr(selected.type), tone: selected.serviceImpact < 0 ? "warn" : "good" },
            { id: "confidence", label: tr({ en: "Model confidence", ar: "ثقة النموذج", zh: "模型置信度" }), value: `${selected.confidence}%`, note: tr({ en: "source and assumption quality", ar: "جودة المصدر والافتراض", zh: "来源与假设质量" }), tone: selected.confidence < 80 ? "warn" : "good" },
          ]} />

          <G02Section title={tr({ en: "Scenario assumption workbench", ar: "مساحة عمل افتراضات السيناريو", zh: "情景假设工作台" })} sub={tr({ en: "The selected scenario is a package of adjustable assumptions applied on top of the approved baseline and forecast.", ar: "السيناريو المحدد هو حزمة افتراضات قابلة للتعديل تطبق فوق خط الأساس المعتمد والتنبؤ.", zh: "所选情景是一组作用在已批准基线和预测之上的可调整假设包。" })} right={<button className="btn ghost sm" disabled={selected.locked} onClick={() => setAssumptionOpen(true)}>{tr({ en: "Edit package", ar: "تعديل الحزمة", zh: "编辑假设包" })}</button>}>
            <div className="g2-uc05-workbench">
              <div className="g2-uc05-selected">
                <span>{tr(selected.type)}</span>
                <h2>{tr(selected.name)}</h2>
                <p>{tr(selected.summary)}</p>
                <div className="g2-ai-summary compact">{tr({ en: "AI recommends this option because it materially reduces the peak funding gap while keeping service impact from turning negative.", ar: "يوصي الذكاء الاصطناعي بهذا الخيار لأنه يخفض ذروة فجوة التمويل بشكل ملموس مع منع أثر الخدمة من التحول إلى سلبي.", zh: "AI 推荐该方案，因为它显著降低峰值资金缺口，同时不让服务影响转为负值。" })}</div>
                <div className="g2-uc05-status-row">
                  <strong>{tr(selected.approval)}</strong>
                  <RiskPill tr={tr} risk={selected.risk} />
                </div>
              </div>
              <div className="g2-uc05-assumption-list">
                {selected.assumptions.map((assumption) => (
                  <div key={assumption.id} className="g2-uc05-assumption-row">
                    <div>
                      <span>{tr(assumption.label)}</span>
                      <b>{typeof assumption.current === "string" ? assumption.current : tr(assumption.current)}</b>
                    </div>
                    <strong>{typeof assumption.scenario === "string" ? assumption.scenario : tr(assumption.scenario)}</strong>
                    <em>{assumption.effect}</em>
                    <small>{tr(assumption.source)}</small>
                  </div>
                ))}
              </div>
            </div>
          </G02Section>

          <G02Section title={tr({ en: "Alternatives comparison", ar: "مقارنة البدائل", zh: "备选方案比较" })} sub={tr({ en: "Compare multiple scenarios from the same baseline and forecast run. Values are outputs, not new source data.", ar: "قارن عدة سيناريوهات من نفس خط الأساس وتشغيل التنبؤ. القيم مخرجات وليست بيانات مصدر جديدة.", zh: "从同一个基线与预测版本生成多个情景比较。表中数值是输出，不是新的源数据。" })} right={<div className="g2-segmented"><button className={comparisonMode === "financial" ? "on" : ""} onClick={() => setComparisonMode("financial")}>{tr({ en: "Financial", ar: "مالي", zh: "财务" })}</button><button className={comparisonMode === "service" ? "on" : ""} onClick={() => setComparisonMode("service")}>{tr({ en: "Service", ar: "خدمي", zh: "服务" })}</button></div>}>
            <div className="g2-uc05-compare-grid">
              <div className="g2-uc05-chart">
                <RC.ResponsiveContainer width="100%" height={260}>
                  <RC.BarChart data={chartData} margin={{ top: 12, right: 14, left: 0, bottom: 6 }}>
                    <RC.CartesianGrid stroke="#e8eee9" strokeDasharray="3 3" vertical={false} />
                    <RC.XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64736b" }} />
                    <RC.YAxis tick={{ fontSize: 10, fill: "#64736b" }} tickFormatter={(value) => `${value.toFixed(1)}B`} />
                    <RC.Tooltip formatter={(value, name) => [fmtB(value), name]} contentStyle={{ borderRadius: 12, border: "1px solid #dfe7e2", boxShadow: "0 12px 32px rgba(16,33,28,.12)" }} />
                    <RC.Bar dataKey={comparisonMode === "financial" ? "fiscalSpace" : "deficitReduction"} fill={comparisonMode === "financial" ? "#1b8354" : "#4b6f95"} radius={[7, 7, 0, 0]} name={comparisonMode === "financial" ? tr({ en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" }) : tr({ en: "Gap reduction", ar: "خفض الفجوة", zh: "缺口降低" })} />
                    <RC.Bar dataKey="peakGap" fill="#dc8b2b" radius={[7, 7, 0, 0]} name={tr({ en: "Peak gap", ar: "ذروة الفجوة", zh: "峰值缺口" })} />
                  </RC.BarChart>
                </RC.ResponsiveContainer>
              </div>
              <div className="g2-table-wrap">
                <table className="g2-table compare">
                  <thead><tr><th>{tr({ en: "Output metric", ar: "مقياس المخرجات", zh: "输出指标" })}</th>{scenarioOptions.slice(0, 4).map((scenario) => <th key={scenario.id} className={scenario.id === selected.id ? "selected" : ""}>{tr(scenario.shortName)}</th>)}</tr></thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.id}>
                        <td><b>{tr(row.label)}</b></td>
                        {scenarioOptions.slice(0, 4).map((scenario) => <td key={scenario.id} className={row.id === "risk" ? "" : "num"}>{row.value(scenario)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </G02Section>

          <G02Section title={tr({ en: "Assumption contribution", ar: "مساهمة الافتراضات", zh: "假设贡献拆解" })} sub={tr({ en: "Each assumption shows its individual and combined effect. Timing shifts are separated from real savings.", ar: "يعرض كل افتراض أثره المنفرد والمجمع. يتم فصل تحولات التوقيت عن الوفورات الحقيقية.", zh: "每个假设都展示单项与组合影响，并区分时间后移和真实节约。" })}>
            <div className="g2-uc05-contribution">
              {selected.contributions.map((item, index) => (
                <div key={item.id}>
                  <span>{index + 1}</span>
                  <b>{tr(item.label)}</b>
                  <div><i className={item.kind} style={{ width: `${Math.max(4, (item.amount / maxContribution) * 100)}%` }} /></div>
                  <strong>{fmtB(item.amount)}</strong>
                  <em>{tr(item.note)}</em>
                </div>
              ))}
              <div className="total">
                <span>=</span>
                <b>{tr({ en: "Combined gap reduction", ar: "خفض الفجوة المجمع", zh: "组合缺口降低" })}</b>
                <div><i style={{ width: "100%" }} /></div>
                <strong>{fmtB(selected.deficitReduction)}</strong>
                <em>{tr({ en: "scenario output", ar: "مخرج السيناريو", zh: "情景输出" })}</em>
              </div>
            </div>
          </G02Section>
        </main>

        <aside className="g2-uc05-decision-panel">
          <span>{tr({ en: `Scenario copilot · ${selected.confidence}% confidence`, ar: `مساعد السيناريو · ثقة ${selected.confidence}%`, zh: `情景助手 · ${selected.confidence}% 置信度` })}</span>
          <h2>{tr(selected.name)}</h2>
          <p>{tr(selected.recommendation)}</p>
          <div className="g2-uc05-copilot-block">
            <b>{tr({ en: "Inputs used", ar: "المدخلات المستخدمة", zh: "使用的输入" })}</b>
            <div><span>{tr({ en: "Budget baseline", ar: "خط أساس الميزانية", zh: "预算基线" })}</span><strong>{baselineVersionId}</strong></div>
            <div><span>{tr({ en: "Funding forecast", ar: "تنبؤ التمويل", zh: "资金预测" })}</span><strong>{forecastVersionId}</strong></div>
            <div><span>{tr({ en: "Owner", ar: "المالك", zh: "负责人" })}</span><strong>FPA · Financial Committee</strong></div>
          </div>
          <div className="g2-uc05-copilot-block warn">
            <b>{tr({ en: "Trade-off", ar: "المفاضلة", zh: "权衡" })}</b>
            <p>{tr(selected.tradeoff)}</p>
          </div>
          <div className="g2-uc05-copilot-block">
            <b>{tr({ en: "Readiness checks", ar: "فحوص الجاهزية", zh: "就绪检查" })}</b>
            <ul>
              <li className={baselineApproved ? "ok" : "bad"}>{tr(baselineApproved ? { en: "Budget baseline locked", ar: "خط أساس الميزانية مقفل", zh: "预算基线已锁定" } : { en: "Budget baseline pending", ar: "خط أساس الميزانية معلق", zh: "预算基线待批准" })}</li>
              <li className={forecastReady ? "ok" : "bad"}>{tr(forecastReady ? { en: "Funding forecast confirmed", ar: "تنبؤ التمويل مؤكد", zh: "资金预测已确认" } : { en: "Funding forecast pending", ar: "تنبؤ التمويل معلق", zh: "资金预测待确认" })}</li>
              <li className={!selected.manual ? "ok" : "bad"}>{tr(!selected.manual ? { en: "Assumptions have source tags", ar: "للافتراضات وسوم مصدر", zh: "假设已有来源标记" } : { en: "Manual assumptions need justification", ar: "الافتراضات اليدوية تحتاج مبرراً", zh: "手工假设需要理由" })}</li>
            </ul>
          </div>
          <div className="g2-approval-log"><span>{tr({ en: "Approval state", ar: "حالة الاعتماد", zh: "审批状态" })}</span><b>{status}</b>{state.scenario.submittedAt && <small>{state.scenario.submittedAt}</small>}{state.scenario.approvedAt && <small>{state.scenario.approvedAt}</small>}</div>
        </aside>
      </div>

      <DecisionFooter guard={blocking ? tr({ en: "Gate blocked: approve the budget baseline, confirm the funding forecast, and justify manual assumptions before submission.", ar: "البوابة مغلقة: اعتمد خط أساس الميزانية وأكد تنبؤ التمويل وبرر الافتراضات اليدوية قبل الإرسال.", zh: "门禁未通过：需批准预算基线、确认资金预测并说明手工假设后才能提交。" }) : tr({ en: "Budget baseline approved · funding forecast confirmed · assumptions explained · ready for human review.", ar: "خط أساس الميزانية معتمد · تنبؤ التمويل مؤكد · الافتراضات مفسرة · جاهز للمراجعة البشرية.", zh: "预算基线已批准 · 资金预测已确认 · 假设已解释 · 可提交复核。" })} guardTone={blocking ? "bad" : "ok"}>
        <span className="g2-footer-note">{tr({ en: "Output: scenario decision package for performance tracking and management reporting.", ar: "المخرج: حزمة قرار سيناريو لمتابعة الأداء والتقارير الإدارية.", zh: "输出：情景决策包，进入绩效跟踪与管理报告。" })}</span>
        <button className="btn ghost sm" onClick={() => update("scenario", { status: "draft", selectedId }, { type: "Scenario", detail: `${selected.code} saved as a scenario draft.` })}>{tr({ en: "Save scenario copy", ar: "حفظ نسخة السيناريو", zh: "保存情景副本" })}</button>
        <button className="btn secondary sm" disabled={blocking || state.scenario.status === "approved"} onClick={submit}>{tr({ en: "Submit for review", ar: "إرسال للمراجعة", zh: "提交审批" })}</button>
        <button className="btn sm" disabled={state.scenario.status !== "in_review"} onClick={approve}>{tr({ en: "Approve scenario", ar: "اعتماد السيناريو", zh: "批准情景" })}</button>
        <button className="btn ghost sm" disabled={state.scenario.status !== "approved"} onClick={openPerformance}>{tr({ en: "Track execution", ar: "متابعة التنفيذ", zh: "跟踪执行" })}</button>
      </DecisionFooter>

      {assumptionOpen && <G02Modal tr={tr} title={tr({ en: "Scenario assumptions", ar: "افتراضات السيناريو", zh: "情景假设" })} sub={tr({ en: "Changes apply to a new draft and keep the approved baseline locked.", ar: "تنطبق التغييرات على مسودة جديدة مع إبقاء خط الأساس المعتمد مقفلاً.", zh: "调整写入新草稿，批准基线保持锁定。" })} onClose={() => setAssumptionOpen(false)} wide>
        <div className="g2-assumption-grid">{[
          [{ en: "Scenario name", ar: "اسم السيناريو", zh: "情景名称" }, tr(selected.name), "Custom committee draft"],
          [{ en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "预留比例" }, "10.0%", selected.id === "reserve_guard" ? "10.0%" : selected.id === "service_continuity" ? "9.6%" : "9.2%"],
          [{ en: "Payment timing", ar: "توقيت المدفوعات", zh: "付款节奏" }, "Funding forecast curve", selected.id === "reserve_guard" ? "+2 quarters" : "+1 quarter"],
          [{ en: "Revenue plan", ar: "خطة الإيرادات", zh: "收入计划" }, "Approved plan", selected.id === "reserve_guard" ? "+1.8%" : "+1.2%"],
          [{ en: "City priority", ar: "أولوية المدينة", zh: "城市优先级" }, "Allocation weights", selected.id === "service_continuity" ? "Protect pressure cities" : "Balanced pressure shift"],
          [{ en: "Unit cost benchmark", ar: "معيار تكلفة الوحدة", zh: "单位成本基准" }, "Base benchmark", selected.id === "custom_stress" ? "Manual stress" : "No unapproved override"],
        ].map(([label, from, to]) => <div key={`${tr(label)}-${from}`}><span>{tr(label)}</span><small>{from}</small><b>→ {to}</b><input placeholder={tr({ en: "Owner, date, and reason", ar: "المالك والتاريخ والسبب", zh: "负责人、日期和理由" })} /></div>)}</div>
        <div className="g2-modal-actions"><button className="btn sm" onClick={() => { setAssumptionOpen(false); update("scenario", { status: "draft", selectedId }, { type: "Scenario assumptions", detail: `${selected.code} assumption package updated as draft.` }); }}>{tr({ en: "Apply to draft package", ar: "تطبيق على حزمة المسودة", zh: "应用到草稿包" })}</button></div>
      </G02Modal>}
    </div>
  );
}

const QUERY_PRESETS = [
  { id: "fiscal", q: { en: "How much fiscal space is left?", ar: "كم يتبقى من الحيز المالي؟", zh: "还剩多少财政空间？" } },
  { id: "project", q: { en: "Which project has the highest cost variance?", ar: "أي مشروع لديه أعلى انحراف في التكلفة؟", zh: "哪个项目成本偏差最高？" } },
  { id: "gap", q: { en: "When does the first funding gap appear?", ar: "متى تظهر أول فجوة تمويل؟", zh: "首次资金缺口何时出现？" } },
  { id: "assumption", q: { en: "Which assumption has the largest impact?", ar: "أي افتراض له أكبر أثر؟", zh: "哪个假设影响最大？" } },
];

export function SmartQueryAuditPage({ tr, state, update, navigate, onBack, onAlerts }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const pageCopy = pageHeader("g02query", {
    title: { en: "Smart query & audit", ar: "الاستعلام الذكي والتدقيق", zh: "智能问数与审计" },
    sub: { en: "Ask within the current planning context, inspect the source behind every number, and review the decision audit trail.", ar: "اسأل ضمن سياق التخطيط الحالي، وافحص مصدر كل رقم، وراجع مسار تدقيق القرارات.", zh: "在当前规划上下文中提问，查看每个数字的来源，并审阅决策审计轨迹。" },
  });
  const runQuery = (text) => {
    const normalized = text.toLowerCase();
    let result;
    if (normalized.includes("project") || normalized.includes("مشروع") || normalized.includes("项目")) result = { text: { en: "PRJ-2027-041 has the highest reviewed variance at +12.9%. The recommended estimate is SAR 388M.", ar: "لدى المشروع PRJ-2027-041 أعلى انحراف مراجع بنسبة +12.9٪، والتقدير الموصى به 388 مليون ريال.", zh: "PRJ-2027-041 的评审偏差最高，为 +12.9%，建议估算为 SAR 388M。" }, route: "plncost", label: { en: "Open project cost", ar: "فتح تكلفة المشروع", zh: "打开项目成本" }, source: "CA-2027-041-02 · 86%" };
    else if (normalized.includes("gap") || normalized.includes("فجوة") || normalized.includes("缺口")) result = { text: { en: "The first material funding gap appears in FY2028 Q3. It peaks at SAR 580M in FY2029 Q1.", ar: "تظهر أول فجوة تمويل جوهرية في الربع الثالث 2028، وتبلغ ذروتها 580 مليون ريال في الربع الأول 2029.", zh: "首次显著资金缺口出现在 FY2028 Q3，并在 FY2029 Q1 达到 SAR 580M。" }, route: "plnforecast", label: { en: "Open funding forecast", ar: "فتح تنبؤ التمويل", zh: "打开资金预测" }, source: "FV-2027-QTR-03 · 84%" };
    else if (normalized.includes("assumption") || normalized.includes("افتراض") || normalized.includes("假设")) result = { text: { en: "Payment timing has the largest modeled impact at SAR 180M, but it shifts pressure rather than reducing the obligation.", ar: "لتوقيت المدفوعات أكبر أثر مقدر بقيمة 180 مليون ريال، لكنه ينقل الضغط ولا يخفض الالتزام.", zh: "付款节奏的模型影响最大，为 SAR 180M，但它只是转移压力，并未减少义务。" }, route: "plnscenario", label: { en: "Open sensitivity analysis", ar: "فتح تحليل الحساسية", zh: "打开敏感性分析" }, source: "SC-2027-BAL-04 · 89%" };
    else result = { text: { en: "Current fiscal space is SAR 2.84B under the approved ceiling context. The balanced scenario increases it to SAR 3.15B.", ar: "الحيز المالي الحالي 2.84 مليار ريال ضمن سياق السقف المعتمد، ويرفعه السيناريو المتوازن إلى 3.15 مليار ريال.", zh: "批准上限口径下当前财政空间为 SAR 2.84B，平衡情景可提升至 SAR 3.15B。" }, route: "plnbudget", label: { en: "Open fiscal-space breakdown", ar: "فتح تفصيل الحيز المالي", zh: "打开财政空间构成" }, source: "BL-2027-APP-04 · 94%" };
    setAnswer(result);
    update("audit", null, { type: "Smart query", detail: text });
  };
	  return (
	    <div className="g2-page fade">
	      <G02Header tr={tr} title={pageCopy.title} sub={pageCopy.sub} onBack={onBack} onAlerts={onAlerts} onSmartQuery={() => {}} />
      <ContextBar tr={tr} state={state} status={tr({ en: "Read-only", ar: "للقراءة فقط", zh: "只读" })} statusTone="good" />
      <div className="g2-query-layout">
        <section className="g2-query-main">
          <div className="g2-query-box"><span>{tr({ en: "Ask about this planning cycle", ar: "اسأل عن دورة التخطيط هذه", zh: "询问当前规划周期" })}</span><div><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && query.trim()) runQuery(query.trim()); }} placeholder={tr({ en: "Ask a financial question", ar: "اطرح سؤالاً مالياً", zh: "输入财务问题" })} /><button className="btn sm" disabled={!query.trim()} onClick={() => runQuery(query.trim())}>{tr({ en: "Ask", ar: "اسأل", zh: "提问" })}</button></div></div>
          <div className="g2-query-presets">{QUERY_PRESETS.map((preset) => <button key={preset.id} onClick={() => { const text = tr(preset.q); setQuery(text); runQuery(text); }}>{tr(preset.q)}</button>)}</div>
          {answer ? <div className="g2-answer"><span>{tr({ en: "Answer · source-backed", ar: "إجابة · مدعومة بالمصدر", zh: "回答 · 可追溯" })}</span><p>{tr(answer.text)}</p><div><small>{answer.source}</small><button className="btn ghost sm" onClick={() => navigate(answer.route)}>{tr(answer.label)} →</button></div></div> : <div className="g2-query-empty"><b>{tr({ en: "The answer will stay inside the active FY2027 Secretariat context.", ar: "ستبقى الإجابة ضمن سياق الأمانة النشط للسنة المالية 2027.", zh: "回答将限定在当前 FY2027 Secretariat 上下文中。" })}</b><p>{tr({ en: "Every answer includes a version, confidence score, and a route to the supporting analysis.", ar: "تتضمن كل إجابة نسخة ودرجة ثقة ومساراً إلى التحليل الداعم.", zh: "每条回答都包含版本、置信度和支持分析的下钻入口。" })}</p></div>}
        </section>
        <G02Section className="g2-audit-panel" title={tr({ en: "Audit trail", ar: "مسار التدقيق", zh: "审计轨迹" })} sub={tr({ en: "Planning, analysis, query, and approval events.", ar: "أحداث التخطيط والتحليل والاستعلام والاعتماد.", zh: "规划、分析、问数和审批事件。" })}>
          <div className="g2-audit-list">{state.audit.map((event) => <div key={event.id}><span>{event.type}</span><b>{event.detail}</b><small>{event.at} · {event.id}</small></div>)}</div>
        </G02Section>
      </div>
    </div>
  );
}
