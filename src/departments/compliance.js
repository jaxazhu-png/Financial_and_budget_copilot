const complianceDepartment = {
  id: "comp",
  group: "g05",
  route: "compwork",
  flowRoute: "g05compflow",
  name: {
    en: "Compliance Department",
    ar: "إدارة الامتثال",
    zh: "合规部",
  },
  ownership: {
    en: "Owns IPSAS checks, policy conflicts, accounting memos, and compliance approval workflows.",
    ar: "يمتلك فحوصات IPSAS وتعارضات السياسات والمذكرات المحاسبية وتدفّقات اعتماد الامتثال.",
    zh: "负责 IPSAS 校验、政策冲突、会计备忘与合规审批流程。",
  },
  relatedRoutes: ["compwork", "compmemo", "g05compflow"],
};

export default complianceDepartment;
