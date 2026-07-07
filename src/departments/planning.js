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
    en: "Owns planning workspace, fiscal-space analysis, cost and housing planning inputs, and scenario-selection outputs.",
    ar: "يمتلك مساحة عمل التخطيط وتحليل الحيّز المالي ومدخلات تخطيط التكلفة والإسكان ومخرجات اختيار السيناريو.",
    zh: "负责规划工作台、财政空间分析、成本与住房规划输入，以及情景选择输出。",
  },
  relatedRoutes: ["plnwork", "planning", "g02flow", "plnbudget", "plncost", "plnhousing", "plnscenario"],
};

export default planningDepartment;
