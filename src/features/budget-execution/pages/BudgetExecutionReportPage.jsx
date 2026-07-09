import React, { useState } from "react";
import { BudgetExecutionSmartQuery } from "../components/BudgetExecutionSmartQuery.jsx";
import { BudgetExecutionStoryline } from "../components/BudgetExecutionStoryline.jsx";
import { UC17_BUDGET_ROWS } from "../data/uc17BudgetExecutionData.js";
import { formatSar } from "../hooks/useBudgetExecutionMonitoring.js";

const sumMetric = (key) => UC17_BUDGET_ROWS.reduce((total, row) => total + (row.metrics[key] || 0), 0);

const reportSourceLabels = {
  17: { en: "Execution ledger", ar: "دفتر التنفيذ", zh: "执行台账" },
  "02": { en: "Warning queue", ar: "قائمة التحذيرات", zh: "预警队列" },
  "04": { en: "Rolling forecast", ar: "التنبؤ المتجدد", zh: "滚动预测" },
  10: { en: "Report generation", ar: "إنشاء التقارير", zh: "报告生成" },
};

/**
 * Report generation page seeded by the current execution ledger.
 */
export function BudgetExecutionReportPage({ store }) {
  const { tr, route, setRoute, setBackRoute, pushLog } = store;
  const riskRows = UC17_BUDGET_ROWS.filter((row) => row.status === "risk");
  const [status, setStatus] = useState("review");
  const openRoute = (targetRoute, logText) => {
    setBackRoute(route || "budexec-reports");
    pushLog?.(logText);
    setRoute(targetRoute);
  };
  const navigateStory = (targetRoute) => {
    if (targetRoute === "budexec-reports") return;
    openRoute(targetRoute, `Report generation opened ${targetRoute}`);
  };
  const reportRows = [
    { label: { en: "Total budget", ar: "إجمالي الميزانية", zh: "预算总额" }, value: formatSar(sumMetric("budget")), source: "SAP/Asas budget ledger" },
    { label: { en: "Committed amount", ar: "المبلغ الملتزم", zh: "已承诺金额" }, value: formatSar(sumMetric("committed")), source: "SAP/Asas commitments" },
    { label: { en: "Total invoices", ar: "إجمالي الفواتير", zh: "收票总额" }, value: formatSar(sumMetric("invoice")), source: "Etimad + SAP invoices" },
    { label: { en: "Actual payment", ar: "الدفع الفعلي", zh: "实际付款" }, value: formatSar(sumMetric("paid")), source: "SAP payment movement" },
    { label: { en: "Available funds", ar: "الأموال المتاحة", zh: "可用资金" }, value: formatSar(sumMetric("available")), source: "Availability report" },
  ];
  const statusLabel = {
    draft: { en: "Draft", ar: "مسودة", zh: "草稿" },
    review: { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" },
    appr: { en: "Approved", ar: "معتمد", zh: "已批准" },
    issued: { en: "Issued", ar: "صادر", zh: "已发布" },
  };
  const reportList = [
    {
      id: "uc17-exec",
      name: { en: "Budget Execution Report", ar: "تقرير تنفيذ الميزانية", zh: "预算执行报告" },
      sub: { en: "Execution ledger, warnings and forecast-ready evidence", ar: "دفتر التنفيذ والتحذيرات وأدلة التنبؤ", zh: "执行台账、预警与预测依据" },
      type: { en: "Operational · Management", ar: "تشغيلي · إداري", zh: "运营 · 管理" },
      period: "FY2026 Q2-Q4",
      srcs: ["17", "02", "04", "10"],
      status,
      upd: { en: "now", ar: "الآن", zh: "刚刚" },
    },
    {
      id: "uc17-warnings",
      name: { en: "Warning Appendix", ar: "ملحق التحذيرات", zh: "预警附录" },
      sub: { en: "Risk budget lines and transfer-path notes", ar: "بنود المخاطر ومسارات المناقلة", zh: "风险预算行与转移路径说明" },
      type: { en: "Appendix", ar: "ملحق", zh: "附录" },
      period: "Current cycle",
      srcs: ["17", "02"],
      status: "draft",
      upd: { en: "now", ar: "الآن", zh: "刚刚" },
    },
    {
      id: "uc17-forecast",
      name: { en: "Forecast Evidence Pack", ar: "حزمة أدلة التنبؤ", zh: "预测依据包" },
      sub: { en: "Execution-to-forecast bridge", ar: "جسر التنفيذ إلى التنبؤ", zh: "执行到预测的输入" },
      type: { en: "Evidence pack", ar: "حزمة أدلة", zh: "证据包" },
      period: "FY2026-FY2027",
      srcs: ["17", "04"],
      status: "review",
      upd: { en: "today", ar: "اليوم", zh: "今天" },
    },
  ];
  const stepIndex = { draft: 0, review: 1, appr: 2, issued: 3 }[status];
  const steps = [
    { en: "Draft", ar: "مسودة", zh: "草稿" },
    { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" },
    { en: "Approved", ar: "معتمد", zh: "已批准" },
    { en: "Issued", ar: "صادر", zh: "已发布" },
  ];
  const sourceClass = (code) => `uc${code}`;
  const sourceLabel = (code) => reportSourceLabels[code] || { en: "Source", ar: "مصدر", zh: "来源" };
  const approve = () => {
    setStatus("appr");
    pushLog?.({ en: "Execution report package approved", ar: "تم اعتماد تقرير التنفيذ", zh: "执行报告包已批准" });
  };

  return (
    <div className="fade ws-page be17-page">
      <div className="rp-libhd">
        <div className="rp-libL">
          <div className="rp-libtitle">
            <button className="rp-backbtn" title={tr({ en: "Back", ar: "رجوع", zh: "返回" })} type="button" onClick={() => openRoute("budexec17", "Back to execution ledger")}>‹</button>
            <div>
              <div className="dw-eyebrow g" style={{ marginBottom: 2 }}>{tr({ en: "Department Workspace · convergence", ar: "مساحة عمل الإدارة · تجميعي", zh: "Department Workspace · convergence" })}</div>
              <h1 className="rp-h1">{tr({ en: "Report Library", ar: "مكتبة التقارير", zh: "报告库" })}</h1>
            </div>
          </div>
          <div className="sub muted" style={{ fontSize: 12.5, marginTop: 3 }}>
            {tr({ en: "The library, inbox and report document are populated with the current execution ledger, warning data and forecast evidence.", ar: "تمتلئ المكتبة وصندوق الوارد ووثيقة التقرير بدفتر التنفيذ والتحذيرات وأدلة التنبؤ الحالية.", zh: "报告库、收件箱与报告文档均基于当前执行台账、预警数据与预测依据生成。" })}
          </div>
        </div>
        <div className="rp-headchain be17-chain">
          <BudgetExecutionStoryline tr={tr} current="reports" onNavigate={navigateStory} />
        </div>
      </div>

      <div className="rp-contrib">
        <div className="ch">{tr({ en: "Recent contributions · execution evidence into report generation", ar: "مساهمات حديثة · أدلة التنفيذ إلى إنشاء التقرير", zh: "最近贡献 · 执行证据进入报告生成" })}</div>
        <div className="row"><span className="rp-uc uc17">{tr(reportSourceLabels[17])}</span><span className="arr">→</span> {tr({ en: "sent", ar: "أرسل", zh: "推送" })} <b>{UC17_BUDGET_ROWS.length} {tr({ en: "execution rows", ar: "بنود تنفيذ", zh: "条执行预算行" })}</b> <span className="tgt">{tr({ en: "Budget Execution Report", ar: "تقرير تنفيذ الميزانية", zh: "预算执行报告" })}</span><span className="age">{tr({ en: "now", ar: "الآن", zh: "刚刚" })}</span></div>
        <div className="row"><span className="rp-uc uc02">{tr(reportSourceLabels["02"])}</span><span className="arr">→</span> {tr({ en: "flagged", ar: "رصد", zh: "标记" })} <b>{riskRows.length} {tr({ en: "warning rows", ar: "تحذيرات", zh: "条预警" })}</b> <span className="tgt">{tr({ en: "Executive summary", ar: "الملخص التنفيذي", zh: "执行摘要" })}</span><span className="age">{tr({ en: "now", ar: "الآن", zh: "刚刚" })}</span></div>
        <div className="row"><span className="rp-uc uc04">{tr(reportSourceLabels["04"])}</span><span className="arr">→</span> {tr({ en: "attached", ar: "أرفق", zh: "附入" })} <b>{tr({ en: "forecast funding gap", ar: "فجوة التمويل المتوقعة", zh: "预测资金缺口" })} SAR 230M</b> <span className="tgt">{tr({ en: "Forecast implication", ar: "أثر التنبؤ", zh: "预测影响" })}</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
      </div>

      <div className="rp-filters">
        <div className="rp-fchip"><div className="k">{tr({ en: "Type", ar: "النوع", zh: "类型" })}</div><select className="wb-ssel" value="operational" readOnly><option value="operational">{tr({ en: "Operational", ar: "تشغيلي", zh: "运营" })}</option></select></div>
        <div className="rp-fchip"><div className="k">{tr({ en: "Department", ar: "الإدارة", zh: "部门" })}</div><select className="wb-ssel" value="g03" readOnly><option value="g03">{tr({ en: "Budget Execution", ar: "تنفيذ الميزانية", zh: "预算执行" })}</option></select></div>
        <div className="rp-fchip"><div className="k">{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</div><select className="wb-ssel" value={status} onChange={(event) => setStatus(event.target.value)}>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{tr(label)}</option>)}</select></div>
        <button className="rp-newbtn" style={{ marginInlineStart: "auto" }} type="button" onClick={() => pushLog?.({ en: "Execution report draft regenerated", ar: "أعيد إنشاء مسودة تقرير التنفيذ", zh: "执行报告草稿已重新生成" })}>✦ {tr({ en: "Regenerate draft", ar: "إعادة توليد المسودة", zh: "重新生成草稿" })}</button>
      </div>

      <div className="rp-libtbl">
        <div className="rp-libhead"><div>{tr({ en: "Report", ar: "التقرير", zh: "报告" })}</div><div>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</div><div>{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div>{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</div><div>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</div><div>{tr({ en: "Updated", ar: "محدّث", zh: "更新" })}</div></div>
        {reportList.map((item) => <div className="rp-librow" key={item.id}>
          <div className="rp-rn">{tr(item.name)}<div className="sub">{tr(item.sub)}</div></div>
          <div>{tr(item.type)}</div>
          <div>{item.period}</div>
          <div className="rp-srcs">{item.srcs.map((code) => <span className={`rp-uc ${sourceClass(code)}`} key={code}>{tr(sourceLabel(code))}</span>)}</div>
          <div><span className={`rp-st ${item.status}`}>{tr(statusLabel[item.status])}</span></div>
          <div className="rp-upd">{tr(item.upd)}</div>
        </div>)}
      </div>

      <div className="rp-dw be17-report-inline">
        <div className="rp-dwhead"><span className="rp-dwt">📄 {tr({ en: "Report Composer", ar: "منشئ التقرير", zh: "报告编排" })}</span><button className="rp-dwx" type="button" onClick={() => openRoute("budexec-forecast", "Open forecast evidence")}>{tr({ en: "Check forecast basis", ar: "فحص أساس التنبؤ", zh: "查看预测依据" })}</button></div>
        <div className="rp-ctop">
          <div className="rp-ctl">
            <div className="rp-eyebrow">{tr({ en: "Report · execution source package", ar: "تقرير · حزمة مصادر التنفيذ", zh: "报告 · 执行来源包" })}</div>
            <h2>{tr({ en: "Budget Execution Monitoring Report", ar: "تقرير مراقبة تنفيذ الميزانية", zh: "预算执行监控报告" })}</h2>
            <div className="rp-asm"><span className="rp-asmlab">{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</span>{["17", "02", "04", "10"].map((code) => <span className={`rp-uc ${sourceClass(code)}`} key={code}>{tr(sourceLabel(code))}</span>)}</div>
          </div>
          <div className="rp-ctr">
            <div className="rp-status">{steps.map((label, index) => <React.Fragment key={tr(label)}>{index > 0 && <span className="arr">›</span>}<span className={`s ${index < stepIndex ? "done" : index === stepIndex ? "cur" : ""}`}><span className="dot" />{tr(label)}</span></React.Fragment>)}</div>
            <div className="rp-toolbtns"><button className="rp-ebtn" type="button">⬇ Word</button><button className="rp-ebtn" type="button">⬇ Excel</button><button className="rp-ebtn" type="button">⬇ PDF</button><button className="rp-send2" type="button" onClick={approve}>{status === "appr" ? tr({ en: "Approved ✓", ar: "معتمد ✓", zh: "已批准 ✓" }) : tr({ en: "Send for approval", ar: "إرسال للاعتماد", zh: "送审" }) + " →"}</button></div>
          </div>
        </div>
        <div className="rp-gate">✓ <b>{tr({ en: "Execution source data ready", ar: "بيانات التنفيذ جاهزة", zh: "执行来源数据已就绪" })}</b> — {tr({ en: "report values trace to current execution ledger, warnings and forecast evidence.", ar: "القيم قابلة للتتبع.", zh: "报告数值可追溯到当前执行台账、预警与预测依据。" })}</div>
        <div className="rp-doc">
          <div className="rp-dochd"><div className="rp-doctitle">{tr({ en: "Budget Execution Monitoring Report", ar: "تقرير مراقبة تنفيذ الميزانية", zh: "预算执行监控报告" })}</div><div className="rp-docmeta"><span>{tr({ en: "Copy No.", ar: "نسخة رقم", zh: "副本号" })} <b>BUD-EXEC-2026-Q2-01</b></span><span>{tr({ en: "Owner: Budget Execution Department", ar: "المالك: تنفيذ الميزانية", zh: "归属:预算执行部" })}</span><span>{tr({ en: "Sources", ar: "المصادر", zh: "来源" })}: {tr(reportSourceLabels[17])} / {tr(reportSourceLabels["02"])} / {tr(reportSourceLabels["04"])}</span></div></div>
          <div className="rp-docb">
            <p className="rp-secl">{tr({ en: "Key figures & indicators · auto-filled from execution ledger", ar: "أرقام ومؤشرات من دفتر التنفيذ", zh: "关键指标 · 自动取自执行台账" })}</p>
            <table className="rp-tbl"><thead><tr><th>{tr({ en: "Indicator", ar: "المؤشر", zh: "指标" })}</th><th className="c">{tr({ en: "Value", ar: "القيمة", zh: "数值" })}</th><th>{tr({ en: "Source", ar: "المصدر", zh: "来源" })}</th></tr></thead><tbody>{reportRows.map((row) => <tr key={row.source}><td>{tr(row.label)}</td><td className="num">{row.value}</td><td><span className="rp-uc uc17">{row.source}</span></td></tr>)}</tbody></table>
            <p className="rp-secl">{tr({ en: "Execution pressure by period", ar: "ضغط التنفيذ حسب الفترة", zh: "按期间的执行压力" })}</p>
            <div className="rp-chart"><div className="rp-bar" style={{ height: "56%" }}><span>SAR 990M</span><small>Q3-26</small></div><div className="rp-bar" style={{ height: "82%" }}><span>SAR 1.26B</span><small>Q4-26</small></div><div className="rp-bar" style={{ height: "76%" }}><span>SAR 1.18B</span><small>Q1-27</small></div><div className="rp-bar" style={{ height: "62%" }}><span>SAR 930M</span><small>Q2-27</small></div></div>
            <p className="rp-secl">{tr({ en: "Narrative commentary · auto-generated", ar: "تعليق سردي · مولّد", zh: "叙述评述 · 自动生成" })}</p>
            <div className="rp-narr"><span className="tag">AI</span>{tr({ en: `Execution monitoring covers ${UC17_BUDGET_ROWS.length} budget lines. `, ar: `تغطي مراقبة التنفيذ ${UC17_BUDGET_ROWS.length} بنود. `, zh: `执行监控当前覆盖 ${UC17_BUDGET_ROWS.length} 条预算行。` })}<span className="dev">{tr({ en: "Deviation:", ar: "انحراف:", zh: "偏差:" })}</span>{tr({ en: ` ${riskRows.length} warning rows require owner review before release or transfer. Forecast evidence shows a SAR 230M funding gap, so the report keeps forecast implication and warning handling in the executive summary.`, ar: ` ${riskRows.length} تحذيرات تتطلب مراجعة.`, zh: ` ${riskRows.length} 条预警预算行需要负责人复核后再释放或转移。预测依据显示 SAR 230M 资金缺口，因此报告在执行摘要中保留预测影响与预警处置路径。` })}</div>
            <div className="rp-narrnote">{tr({ en: "Generated from current execution data, not from a static Excel export.", ar: "مولّد من بيانات التنفيذ الحالية وليس من إكسل ثابت.", zh: "基于当前执行数据生成，而不是静态 Excel 导出。" })}</div>
            <p className="rp-secl">{tr({ en: "Data sources · lineage", ar: "مصادر البيانات · التتبع", zh: "数据来源 · 追溯" })}</p>
            <div className="rp-lin"><span className="ln">{tr({ en: "Budget line movement, committed, invoice, payment, balance", ar: "حركة البند والالتزامات والفواتير", zh: "预算行 movement、承诺、发票、付款、余额" })}</span><span className="src">← {tr(reportSourceLabels[17])} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Warning classification and handling path", ar: "تصنيف التحذير ومسار المعالجة", zh: "预警分类与处理路径" })}</span><span className="src">← {tr(reportSourceLabels["02"])} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Forecast funding gap and pressure period", ar: "فجوة التنبؤ وفترة الضغط", zh: "预测资金缺口与压力期间" })}</span><span className="src">← {tr(reportSourceLabels["04"])} →</span></div>
          </div>
        </div>
        <div className="rp-lock">🔒 {tr({ en: "Approved report versions are immutable; edits create a new report copy with owner, date and source lineage.", ar: "النسخ المعتمدة غير قابلة للتعديل.", zh: "已批准报告版本不可变；修改会生成新的报告副本并保留负责人、日期和来源链路。" })}</div>
      </div>
      <BudgetExecutionSmartQuery tr={tr} pushLog={pushLog} page="uc10" />
    </div>
  );
}
