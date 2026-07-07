const costManagementDepartment = {
  id: "cost",
  group: "g05",
  route: "costwork",
  consoleRoute: "csfunds",
  flowRoute: "g05costflow",
  name: {
    en: "Cost Management Department",
    ar: "إدارة التكاليف",
    zh: "成本管理部",
  },
  ownership: {
    en: "Owns cost and fund analysis, assignment-order follow-up, and surplus-release recommendations.",
    ar: "يمتلك تحليل التكاليف والصناديق ومتابعة أوامر الإسناد وتوصيات الإفراج عن الفوائض.",
    zh: "负责成本与基金分析、派工单跟进和结余释放建议。",
  },
  relatedRoutes: ["costwork", "csfunds", "g05costflow"],
};

export default costManagementDepartment;
