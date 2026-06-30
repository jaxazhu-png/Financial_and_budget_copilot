import accountingDepartment from "./accounting";
import assetsDepartment from "./assets";
import auditDepartment from "./audit";
import budgetExecutionDepartment from "./budgetExecution";
import complianceDepartment from "./compliance";
import costManagementDepartment from "./costManagement";
import financialEntitlementsDepartment from "./financialEntitlements";
import financialPerformanceAnalysisDepartment from "./financialPerformanceAnalysis";
import financialReportingDepartment from "./financialReporting";
import planningDepartment from "./planning";
import revenueCollectionDepartment from "./revenueCollection";

export const DEPARTMENT_FILES = [
  financialPerformanceAnalysisDepartment,
  planningDepartment,
  budgetExecutionDepartment,
  financialEntitlementsDepartment,
  auditDepartment,
  financialReportingDepartment,
  complianceDepartment,
  costManagementDepartment,
  accountingDepartment,
  revenueCollectionDepartment,
  assetsDepartment,
];

export const DEPARTMENT_GROUPS = [
  {
    key: "g02",
    name: {
      en: "General Directorate of Planning and Financial Performance",
      ar: "الإدارة العامة للتخطيط والأداء المالي",
      zh: "规划与财务绩效总局",
    },
    subs: [financialPerformanceAnalysisDepartment, planningDepartment],
  },
  {
    key: "g03",
    name: {
      en: "General Budget Department",
      ar: "الإدارة العامة للميزانية",
      zh: "预算总局",
    },
    subs: [budgetExecutionDepartment],
  },
  {
    key: "g04",
    name: {
      en: "General Administration of Affairs Finance",
      ar: "الإدارة العامة للشؤون المالية",
      zh: "财务事务总局",
    },
    subs: [financialEntitlementsDepartment, auditDepartment],
  },
  {
    key: "g05",
    name: {
      en: "General Directorate of Financial Reporting",
      ar: "الإدارة العامة للتقارير المالية",
      zh: "财务报告总局",
    },
    subs: [
      financialReportingDepartment,
      complianceDepartment,
      costManagementDepartment,
      accountingDepartment,
    ],
  },
  {
    key: "g06",
    name: {
      en: "General Directorate of Revenues and Assets",
      ar: "الإدارة العامة للإيرادات والأصول",
      zh: "收入与资产总局",
    },
    subs: [revenueCollectionDepartment, assetsDepartment],
  },
];

export const ACTIVE_DEPARTMENT_IDS = new Set(
  DEPARTMENT_FILES.map((department) => department.id),
);

export const DEPARTMENT_BY_ID = Object.fromEntries(
  DEPARTMENT_FILES.map((department) => [department.id, department]),
);

export const DEPARTMENT_BY_ROUTE = Object.fromEntries(
  DEPARTMENT_FILES.flatMap((department) =>
    (department.relatedRoutes || []).map((route) => [route, department]),
  ),
);
