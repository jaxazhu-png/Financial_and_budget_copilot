const financialEntitlementsDepartment = {
  id: "entitle",
  group: "g04",
  route: "entwork",
  storyRoute: "claims",
  flowRoute: "g04entflow",
  name: {
    en: "Financial Entitlements Department",
    ar: "إدارة الاستحقاقات المالية",
    zh: "财务权益部",
  },
  ownership: {
    en: "Owns claims intake, disbursement recommendations, and payable-review actions in the G-04 journey.",
    ar: "يمتلك استقبال المطالبات وتوصيات الصرف وإجراءات مراجعة المستحقات ضمن مسار G-04.",
    zh: "负责 G-04 流程中的索赔受理、支付建议与应付款复核动作。",
  },
  relatedRoutes: ["entwork", "claims", "g04entflow"],
};

export default financialEntitlementsDepartment;
