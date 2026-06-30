const financialPerformanceAnalysisDepartment = {
  id: "fpa",
  group: "g02",
  route: "fpawork",
  embeddedRoute: "perf",
  subDept: "performanceAnalysis",
  name: {
    en: "Financial Performance Analysis Department",
    ar: "إدارة تحليل الأداء المالي",
    zh: "财务绩效分析部",
  },
  ownership: {
    en: "Owns UC-06 embedded analysis, executive summary generation, and performance-analysis hand-off.",
    ar: "يمتلك التحليل المضمّن UC-06 وتوليد الملخص التنفيذي وتسليمات تحليل الأداء.",
    zh: "负责 UC-06 嵌入式分析、执行摘要生成和绩效分析交接。",
  },
  relatedRoutes: ["fpawork", "perf", "g02fpaflow"],
};

export default financialPerformanceAnalysisDepartment;
