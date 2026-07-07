const budgetExecutionDepartment = {
  id: "budexec",
  group: "g03",
  route: "buwork",
  embeddedRoute: "budexec",
  subDept: "budgetExecution",
  storyRoute: "budget",
  flowRoute: "g03flow",
  name: {
    en: "Budget Execution Department",
    ar: "إدارة تنفيذ الميزانية",
    zh: "预算执行部",
  },
  ownership: {
    en: "Owns budget-execution workspace, chapter execution follow-up, reallocation drafts, and transfer approvals.",
    ar: "يمتلك مساحة تنفيذ الميزانية ومتابعة تنفيذ الأبواب ومسودات إعادة التوزيع واعتمادات المناقلات.",
    zh: "负责预算执行工作台、章节执行跟进、重分配草稿与转移审批。",
  },
  relatedRoutes: ["buwork", "budexec17", "budexec", "budget", "g03flow", "budexec-forecast", "budexec-space", "budexec-reports"],
};

export default budgetExecutionDepartment;
