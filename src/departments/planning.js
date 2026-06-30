const planningDepartment = {
  id: "plan",
  group: "g02",
  route: "plnwork",
  storyRoute: "planning",
  flowRoute: "g02flow",
  name: {
    en: "Planning Department",
    ar: "إدارة التخطيط",
    zh: "规划部",
  },
  ownership: {
    en: "Owns planning workspace, fiscal-space analysis, forecasting, and scenario-selection outputs.",
    ar: "يمتلك مساحة عمل التخطيط وتحليل الحيّز المالي والتنبؤات ومخرجات اختيار السيناريو.",
    zh: "负责规划工作台、财政空间分析、预测与情景选择输出。",
  },
  relatedRoutes: ["plnwork", "planning", "g02flow"],
};

export default planningDepartment;
