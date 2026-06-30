const auditDepartment = {
  id: "audit",
  group: "g04",
  route: "audwork",
  flowRoute: "g04audflow",
  name: {
    en: "Audit Department",
    ar: "إدارة التدقيق",
    zh: "审计部",
  },
  ownership: {
    en: "Owns duplicate detection follow-up, audit trails, exception escalation, and cross-department smart-query oversight.",
    ar: "يمتلك متابعة التكرار وسجلات التدقيق وتصعيد الاستثناءات والرقابة على الاستعلام الذكي عبر الإدارات.",
    zh: "负责重复项跟进、审计轨迹、异常升级与跨部门智能查询监管。",
  },
  relatedRoutes: ["audwork", "g04audflow", "alerts"],
};

export default auditDepartment;
