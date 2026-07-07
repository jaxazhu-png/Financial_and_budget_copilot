const accountingDepartment = {
  id: "acct",
  group: "g05",
  route: "acctwork",
  flowRoute: "g05acctflow",
  name: {
    en: "Accounting Department",
    ar: "إدارة المحاسبة",
    zh: "会计部",
  },
  ownership: {
    en: "Owns reconciliation closure, adjusting-entry review, and accounting-ruling outputs.",
    ar: "يمتلك إقفال التسويات ومراجعة قيود المعالجة ومخرجات القرار المحاسبي.",
    zh: "负责对账关账、调整分录复核与会计裁定输出。",
  },
  relatedRoutes: ["acctwork", "g05acctflow", "compmemo"],
};

export default accountingDepartment;
