const financialReportingDepartment = {
  id: "frep",
  group: "g05",
  route: "frepwork",
  storyRoute: "reporting",
  flowRoute: "g05repflow",
  name: {
    en: "Financial Reporting Department",
    ar: "إدارة التقارير المالية",
    zh: "财务报告部",
  },
  ownership: {
    en: "Owns formal reporting, narrative generation, executive summaries, and report-issuance workflows.",
    ar: "يمتلك التقارير الرسمية وتوليد السرد والملخصات التنفيذية وتدفّقات إصدار التقارير.",
    zh: "负责正式报告、叙述生成、执行摘要与报告发布流程。",
  },
  relatedRoutes: ["frepwork", "reporting", "g05repflow", "reports"],
};

export default financialReportingDepartment;
