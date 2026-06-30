const revenueCollectionDepartment = {
  id: "revcol",
  group: "g06",
  route: "rcwork",
  benchRoute: "rcbench",
  flowRoute: "rcdata",
  legacyFlowRoute: "rcdatav1",
  embeddedRoute: "rcreports",
  subDept: "revenueCollection",
  storyRoute: "revassets",
  name: {
    en: "Revenue Collection Department",
    ar: "إدارة التحصيل",
    zh: "收入征收部",
  },
  ownership: {
    en: "Owns collection analysis, exclusions, billing-gap workbench, and executive-summary launch into UC-06.",
    ar: "يمتلك تحليل التحصيل والاستبعادات ومنصة فجوة الفوترة وإطلاق الملخص التنفيذي إلى UC-06.",
    zh: "负责征收分析、排除项、开票缺口工作台以及进入 UC-06 的执行摘要入口。",
  },
  relatedRoutes: ["rcwork", "rcbench", "rcdata", "rcdatav1", "rcreports", "revassets"],
};

export default revenueCollectionDepartment;
