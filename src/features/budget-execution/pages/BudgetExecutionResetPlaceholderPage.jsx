import React from "react";

const PAGE_META = {
  "budexec-data": {
    title: { en: "Unified Budget Execution Data", ar: "بيانات تنفيذ الميزانية الموحدة", zh: "预算执行统一数据" },
    sub: { en: "The previous page implementation has been removed and is ready for the new budget execution redesign.", ar: "تمت إزالة تنفيذ الصفحة السابق وهي جاهزة لإعادة تصميم تنفيذ الميزانية.", zh: "旧页面实现已删除，等待按新的预算执行方案重做。" },
  },
  budexec17: {
    title: { en: "Automated Budget Execution Monitoring and Reconciliation", ar: "المراقبة الآلية لتنفيذ الميزانية والمطابقة التشغيلية", zh: "自动化预算执行监控与运营对账" },
    sub: { en: "The old budget execution control tower has been cleared for rebuild.", ar: "تمت تهيئة برج مراقبة تنفيذ الميزانية السابق لإعادة البناء.", zh: "旧预算执行控制塔已清空，等待重建。" },
  },
  "budexec-alerts": {
    title: { en: "Budget Execution Exception Handling", ar: "معالجة استثناءات تنفيذ الميزانية", zh: "预算执行异常处理" },
    sub: { en: "The previous exception page has been removed from the budget execution feature bundle.", ar: "تمت إزالة صفحة الاستثناءات السابقة من حزمة تنفيذ الميزانية.", zh: "旧异常处理页已从预算执行模块中移除。" },
  },
  "budexec-forecast": {
    title: { en: "Future Obligations and Liquidity Pressure", ar: "الالتزامات المستقبلية وضغط السيولة", zh: "未来义务与流动性压力" },
    sub: { en: "This route is reserved for the rebuilt budget execution forecast page.", ar: "هذا المسار مخصص لصفحة توقع تنفيذ الميزانية المعاد بناؤها.", zh: "该路由预留给重做后的预算执行预测页。" },
  },
  "budexec-space": {
    title: { en: "Fiscal Space and Transfer Candidates", ar: "الحيز المالي ومرشحات المناقلة", zh: "财政空间与转移候选" },
    sub: { en: "The old fiscal-space implementation has been cleared.", ar: "تمت إزالة تنفيذ الحيز المالي السابق.", zh: "旧财政空间实现已清理。" },
  },
  "budexec-query": {
    title: { en: "Budget Execution Smart Query and Audit", ar: "الاستعلام الذكي والتدقيق لتنفيذ الميزانية", zh: "预算执行智能问数与审计" },
    sub: { en: "The prior query and audit page has been removed for the new interaction design.", ar: "تمت إزالة صفحة الاستعلام والتدقيق السابقة للتصميم الجديد.", zh: "旧问数审计页已删除，等待新的交互设计。" },
  },
  "budexec-reports": {
    title: { en: "Budget Execution Report Generation", ar: "إنشاء تقارير تنفيذ الميزانية", zh: "预算执行报告生成" },
    sub: { en: "The previous report generation page has been cleared.", ar: "تمت إزالة صفحة إنشاء التقارير السابقة.", zh: "旧报告生成页已清理。" },
  },
};

/**
 * Temporary clean slate after removing the old Budget Execution implementation.
 */
export function BudgetExecutionResetPlaceholderPage({ store }) {
  const { tr, route, setRoute, setBackRoute } = store;
  const meta = PAGE_META[route] || PAGE_META.budexec17;

  return (
    <div className="g03-page">
      <div className="page-h">
        <div>
          <h1>{tr(meta.title)}</h1>
          <div className="sub">{tr(meta.sub)}</div>
        </div>
        <div className="bp-headactions">
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setBackRoute(null);
              setRoute("buwork");
            }}
          >
            {tr({ en: "Back to Budget Execution Department", ar: "العودة إلى إدارة تنفيذ الميزانية", zh: "返回预算执行部工作台" })}
          </button>
        </div>
      </div>

      <section className="card" style={{ padding: 18 }}>
        <div className="dw-eyebrow g" style={{ marginBottom: 8 }}>
          {tr({ en: "Budget execution rebuild placeholder", ar: "عنصر مؤقت لإعادة بناء تنفيذ الميزانية", zh: "预算执行重做占位" })}
        </div>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          {tr({
            en: "Old budget execution page code has been removed. Use this route as the mount point for the new implementation.",
            ar: "تمت إزالة كود صفحات تنفيذ الميزانية القديم. استخدم هذا المسار كنقطة تركيب للتنفيذ الجديد.",
            zh: "当前预算执行旧页面代码已删除。后续可以直接基于这个路由挂载新的页面实现。",
          })}
        </p>
      </section>
    </div>
  );
}
