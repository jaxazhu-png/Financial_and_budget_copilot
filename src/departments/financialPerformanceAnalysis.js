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
    en: "Owns future-obligation forecasting, performance review, exception monitoring, smart query, and executive reporting hand-off.",
    ar: "يمتلك تنبؤ الالتزامات المستقبلية ومراجعة الأداء ومراقبة الاستثناءات والاستعلام الذكي وتسليم التقارير التنفيذية.",
    zh: "负责未来义务预测、绩效复盘、异常监控、智能问数和管理报告交接。",
  },
  relatedRoutes: ["fpawork", "perf", "g02fpaflow", "plnforecast", "alerts", "g02query"],
};

export default financialPerformanceAnalysisDepartment;
