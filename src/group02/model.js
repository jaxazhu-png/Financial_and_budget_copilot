import { getPageContent } from "../data/presentationConfig.js";

const firstConfigured = (route, collectionKey, fallback) => getPageContent(route, collectionKey, [fallback])[0] || fallback;

const G02_COPY_DEFAULT = {
  context: {
    en: "FY2027 · Secretariat · approved planning context",
    ar: "السنة المالية 2027 · الأمانة · سياق تخطيط معتمد",
    zh: "FY2027 · 秘书处 · 已批准规划上下文",
  },
};

export const G02_COPY = firstConfigured("g02", "copy", G02_COPY_DEFAULT);
export const G02_PAGE_HEADERS = getPageContent("g02", "page_headers", []);

const G02_PROJECTS_DEFAULT = [
  {
    id: "PRJ-2027-041",
    name: { en: "Municipal service acceleration", ar: "تسريع الخدمات البلدية", zh: "市政服务加速项目" },
    entity: { en: "Municipal services portfolio", ar: "محفظة الخدمات البلدية", zh: "市政服务组合" },
    service: { en: "Urban services", ar: "الخدمات الحضرية", zh: "城市服务" },
    location: { en: "Eastern sector", ar: "القطاع الشرقي", zh: "东部片区" },
    quantity: 24,
    area: "184,000 m²",
    allocation: 0.4,
    currentEstimate: 0.42,
    benchmarkEstimate: 0.372,
    recommendedEstimate: 0.388,
    confidence: 86,
  },
  {
    id: "PRJ-2027-052",
    name: { en: "Stormwater resilience package", ar: "حزمة مرونة تصريف السيول", zh: "雨洪韧性项目包" },
    entity: { en: "Infrastructure portfolio", ar: "محفظة البنية التحتية", zh: "基础设施组合" },
    service: { en: "Drainage services", ar: "خدمات تصريف المياه", zh: "排水服务" },
    location: { en: "Central sector", ar: "القطاع الأوسط", zh: "中部片区" },
    quantity: 18,
    area: "96,000 m²",
    allocation: 0.31,
    currentEstimate: 0.348,
    benchmarkEstimate: 0.319,
    recommendedEstimate: 0.326,
    confidence: 79,
  },
  {
    id: "PRJ-2027-063",
    name: { en: "Neighborhood landscape renewal", ar: "تجديد المشهد الحضري للأحياء", zh: "社区景观更新" },
    entity: { en: "Quality of life portfolio", ar: "محفظة جودة الحياة", zh: "生活质量组合" },
    service: { en: "Public realm", ar: "المجال العام", zh: "公共空间" },
    location: { en: "Northern sector", ar: "القطاع الشمالي", zh: "北部片区" },
    quantity: 12,
    area: "71,500 m²",
    allocation: 0.22,
    currentEstimate: 0.238,
    benchmarkEstimate: 0.226,
    recommendedEstimate: 0.229,
    confidence: 91,
  },
];

export const G02_PROJECTS = getPageContent("g02", "projects", G02_PROJECTS_DEFAULT);

const G02_COST_DRIVERS_DEFAULT = [
  { id: "quantity", name: { en: "Construction quantity", ar: "كميات التنفيذ", zh: "工程量" }, unit: "m²", quantity: 184000, current: 782, historical: 720, market: 738, low: 704, high: 752, amount: 0.144, variance: 8.3, confidence: 91 },
  { id: "material", name: { en: "Materials and equipment", ar: "المواد والمعدات", zh: "材料与设备" }, unit: "package", quantity: 24, current: 4.9, historical: 4.3, market: 4.45, low: 4.18, high: 4.62, amount: 0.118, variance: 10.1, confidence: 88 },
  { id: "region", name: { en: "Regional price factor", ar: "معامل السعر الإقليمي", zh: "区域价格系数" }, unit: "index", quantity: 1, current: 1.12, historical: 1.05, market: 1.07, low: 1.03, high: 1.09, amount: 0.052, variance: 4.7, confidence: 82 },
  { id: "design", name: { en: "Design complexity", ar: "تعقيد التصميم", zh: "设计复杂度" }, unit: "index", quantity: 1, current: 1.18, historical: 1.1, market: 1.12, low: 1.06, high: 1.14, amount: 0.061, variance: 5.4, confidence: 76 },
  { id: "schedule", name: { en: "Schedule acceleration", ar: "تسريع الجدول الزمني", zh: "工期加速" }, unit: "months", quantity: 4, current: 5.1, historical: 4.3, market: 4.5, low: 4.1, high: 4.7, amount: 0.02, variance: 8.9, confidence: 73 },
  { id: "contingency", name: { en: "Risk contingency", ar: "احتياطي المخاطر", zh: "风险准备" }, unit: "%", quantity: 6, current: 6, historical: 4.5, market: 5, low: 4, high: 5.2, amount: 0.025, variance: 15.4, confidence: 69 },
];

export const G02_COST_DRIVERS = getPageContent("g02", "cost_drivers", G02_COST_DRIVERS_DEFAULT);

const G02_HOUSING_OPTIONS_DEFAULT = [
  {
    id: "access",
    name: { en: "Access first", ar: "أولوية الوصول", zh: "覆盖优先" },
    financial: 70,
    inKind: 30,
    ownership: 3.8,
    beneficiaries: 42100,
    costPer: 34.8,
    efficiency: 76,
    fundingNeed: 1.76,
    gap: 0.32,
    risk: "watch",
  },
  {
    id: "balanced",
    name: { en: "Balanced mix", ar: "مزيج متوازن", zh: "平衡组合" },
    financial: 50,
    inKind: 50,
    ownership: 3.2,
    beneficiaries: 37600,
    costPer: 31.4,
    efficiency: 82,
    fundingNeed: 1.62,
    gap: 0.24,
    risk: "healthy",
  },
  {
    id: "resilience",
    name: { en: "Fiscal resilience", ar: "المرونة المالية", zh: "财政韧性" },
    financial: 35,
    inKind: 65,
    ownership: 2.4,
    beneficiaries: 32900,
    costPer: 29.7,
    efficiency: 86,
    fundingNeed: 1.48,
    gap: 0.16,
    risk: "healthy",
  },
];

export const G02_HOUSING_OPTIONS = getPageContent("g02", "housing_options", G02_HOUSING_OPTIONS_DEFAULT);

const G02_HOUSING_REGIONS_DEFAULT = [
  { id: "east", name: { en: "Eastern sector", ar: "القطاع الشرقي", zh: "东部片区" }, investment: 410, output: 88, beneficiaries: 12400, ownership: 3.8, completion: 91, efficiency: 86 },
  { id: "central", name: { en: "Central sector", ar: "القطاع الأوسط", zh: "中部片区" }, investment: 360, output: 72, beneficiaries: 10800, ownership: 3.1, completion: 82, efficiency: 78 },
  { id: "north", name: { en: "Northern sector", ar: "القطاع الشمالي", zh: "北部片区" }, investment: 248, output: 61, beneficiaries: 7900, ownership: 2.7, completion: 76, efficiency: 81 },
  { id: "south", name: { en: "Southern sector", ar: "القطاع الجنوبي", zh: "南部片区" }, investment: 162, output: 39, beneficiaries: 6500, ownership: 2.2, completion: 64, efficiency: 69 },
];

export const G02_HOUSING_REGIONS = getPageContent("g02", "housing_regions", G02_HOUSING_REGIONS_DEFAULT);

const G02_FORECAST_TIMELINE_DEFAULT = [
  { period: "2027 Q1", capacity: 1.48, confirmed: 0.91, probable: 0.12, carryover: 0.09, project: 0.08, housing: 0.07, gap: 0 },
  { period: "2027 Q2", capacity: 1.52, confirmed: 1.02, probable: 0.14, carryover: 0.07, project: 0.1, housing: 0.08, gap: 0 },
  { period: "2027 Q3", capacity: 1.46, confirmed: 1.04, probable: 0.16, carryover: 0.06, project: 0.11, housing: 0.09, gap: 0 },
  { period: "2027 Q4", capacity: 1.42, confirmed: 1.09, probable: 0.17, carryover: 0.05, project: 0.12, housing: 0.1, gap: 0.11 },
  { period: "2028 Q1", capacity: 1.39, confirmed: 1.12, probable: 0.18, carryover: 0.05, project: 0.13, housing: 0.11, gap: 0.2 },
  { period: "2028 Q2", capacity: 1.36, confirmed: 1.13, probable: 0.19, carryover: 0.04, project: 0.14, housing: 0.12, gap: 0.26 },
  { period: "2028 Q3", capacity: 1.33, confirmed: 1.16, probable: 0.2, carryover: 0.04, project: 0.15, housing: 0.13, gap: 0.35 },
  { period: "2028 Q4", capacity: 1.31, confirmed: 1.19, probable: 0.2, carryover: 0.03, project: 0.16, housing: 0.14, gap: 0.41 },
  { period: "2029 Q1", capacity: 1.29, confirmed: 1.22, probable: 0.21, carryover: 0.03, project: 0.17, housing: 0.14, gap: 0.58 },
  { period: "2029 Q2", capacity: 1.34, confirmed: 1.18, probable: 0.2, carryover: 0.02, project: 0.15, housing: 0.13, gap: 0.34 },
  { period: "2029 Q3", capacity: 1.41, confirmed: 1.14, probable: 0.19, carryover: 0.02, project: 0.13, housing: 0.12, gap: 0.19 },
  { period: "2029 Q4", capacity: 1.46, confirmed: 1.1, probable: 0.17, carryover: 0.01, project: 0.12, housing: 0.11, gap: 0.05 },
  { period: "2030 Q1", capacity: 1.43, confirmed: 1.08, probable: 0.18, carryover: 0.01, project: 0.16, housing: 0.1, gap: 0.1 },
  { period: "2030 Q2", capacity: 1.5, confirmed: 1.04, probable: 0.16, carryover: 0.01, project: 0.15, housing: 0.09, gap: 0 },
  { period: "2030 Q3", capacity: 1.55, confirmed: 1.01, probable: 0.15, carryover: 0, project: 0.13, housing: 0.08, gap: 0 },
  { period: "2030 Q4", capacity: 1.58, confirmed: 0.98, probable: 0.14, carryover: 0, project: 0.12, housing: 0.07, gap: 0 },
];

export const G02_FORECAST_TIMELINE = getPageContent("g02", "forecast_timeline", G02_FORECAST_TIMELINE_DEFAULT);

const G02_FORECAST_ITEMS_DEFAULT = [
  { id: "CT-5520", type: { en: "Confirmed contract", ar: "عقد مؤكد", zh: "确定合同" }, object: { en: "Municipal service acceleration", ar: "تسريع الخدمات البلدية", zh: "市政服务加速项目" }, period: "2029 Q1", amount: 0.21, probability: 100, owner: { en: "Municipal services", ar: "الخدمات البلدية", zh: "市政服务" } },
  { id: "TN-2088", type: { en: "Pipeline contract", ar: "عقد قيد الإجراء", zh: "在途合同" }, object: { en: "Stormwater package phase 2", ar: "المرحلة الثانية لحزمة تصريف السيول", zh: "雨洪项目二期" }, period: "2029 Q1", amount: 0.18, probability: 72, owner: { en: "Infrastructure", ar: "البنية التحتية", zh: "基础设施" } },
  { id: "HSP-2027-01", type: { en: "Housing commitment", ar: "التزام دعم إسكان", zh: "住房支持义务" }, object: { en: "Balanced housing support", ar: "دعم الإسكان المتوازن", zh: "平衡住房支持" }, period: "2029 Q1", amount: 0.14, probability: 100, owner: { en: "Housing support", ar: "دعم الإسكان", zh: "住房支持" } },
  { id: "CO-2026-19", type: { en: "Carryover debt", ar: "دين مرحل", zh: "结转债务" }, object: { en: "Prior-year certified invoices", ar: "فواتير معتمدة من السنة السابقة", zh: "上年已认证发票" }, period: "2029 Q1", amount: 0.03, probability: 100, owner: { en: "Treasury coordination", ar: "تنسيق الخزينة", zh: "国库协调" } },
  { id: "PRJ-2027-041", type: { en: "Future project cost", ar: "تكلفة مشروع مستقبلية", zh: "未来项目成本" }, object: { en: "Municipal service acceleration", ar: "تسريع الخدمات البلدية", zh: "市政服务加速项目" }, period: "2029 Q1", amount: 0.17, probability: 88, owner: { en: "Planning", ar: "التخطيط", zh: "规划" } },
];

export const G02_FORECAST_ITEMS = getPageContent("g02", "forecast_items", G02_FORECAST_ITEMS_DEFAULT);

const G02_FORECAST_INPUTS_DEFAULT = [
  { id: "CT-5520", className: { en: "Approved contract", ar: "عقد معتمد", zh: "已批准合同" }, object: { en: "Municipal service acceleration", ar: "تسريع الخدمات البلدية", zh: "市政服务加速项目" }, plan: { en: "Payment plan linked", ar: "خطة الدفع مرتبطة", zh: "已关联付款计划" }, period: "2029 Q1", amount: 0.21, status: "complete" },
  { id: "CT-5904", className: { en: "Approved contract", ar: "عقد معتمد", zh: "已批准合同" }, object: { en: "Road maintenance framework", ar: "إطار صيانة الطرق", zh: "道路维护框架" }, plan: { en: "Missing payment plan", ar: "خطة الدفع مفقودة", zh: "缺少付款计划" }, period: "2028 Q4", amount: 0.16, status: "missing" },
  { id: "TN-2088", className: { en: "In-progress contract", ar: "عقد قيد الإجراء", zh: "在途合同" }, object: { en: "Stormwater package phase 2", ar: "المرحلة الثانية لحزمة تصريف السيول", zh: "雨洪项目二期" }, plan: { en: "Probability-weighted from Etimad trail", ar: "مرجح بالاحتمال من مسار اعتماد", zh: "按 Etimad 链路概率加权" }, period: "2029 Q1", amount: 0.18, status: "review" },
  { id: "CD-7712", className: { en: "Cost-driver update", ar: "تحديث محرّك تكلفة", zh: "成本驱动更新" }, object: { en: "Material index refresh", ar: "تحديث مؤشر المواد", zh: "材料指数刷新" }, plan: { en: "Stale driver prompt", ar: "تنبيه محرّك قديم", zh: "滞后驱动提示" }, period: "2028 Q3", amount: 0.07, status: "review" },
];

export const G02_FORECAST_INPUTS = getPageContent("g02", "forecast_inputs", G02_FORECAST_INPUTS_DEFAULT);

const G02_SCENARIOS_DEFAULT = [
  { id: "baseline", name: { en: "Approved baseline", ar: "خط الأساس المعتمد", zh: "已批准基线" }, fiscal: 2.84, gap: 0.58, saving: 0, housing: 2.1, service: 0, risk: "watch", locked: true },
  { id: "balanced", name: { en: "AI recommended: balanced", ar: "موصى به بالذكاء الاصطناعي: متوازن", zh: "AI 推荐：平衡" }, fiscal: 3.15, gap: 0.22, saving: 0.032, housing: 3.2, service: 4.1, risk: "watch", recommended: true },
  { id: "resilience", name: { en: "Fiscal resilience", ar: "المرونة المالية", zh: "财政韧性" }, fiscal: 3.27, gap: 0.12, saving: 0.044, housing: 2.4, service: -1.8, risk: "healthy" },
  { id: "service", name: { en: "Service priority", ar: "أولوية الخدمات", zh: "服务优先" }, fiscal: 3.08, gap: 0.31, saving: 0.02, housing: 3.8, service: 6.2, risk: "tight" },
];

export const G02_SCENARIOS = getPageContent("g02", "scenarios", G02_SCENARIOS_DEFAULT);

const G02_SENSITIVITY_DEFAULT = [
  { id: "payment", name: { en: "Payment timing", ar: "توقيت المدفوعات", zh: "付款节奏" }, impact: 0.18, kind: "timing" },
  { id: "project", name: { en: "Project cost normalization", ar: "تطبيع تكلفة المشروع", zh: "项目成本校正" }, impact: 0.12, kind: "real" },
  { id: "housing", name: { en: "Housing support mix", ar: "مزيج دعم الإسكان", zh: "住房支持组合" }, impact: 0.09, kind: "real" },
  { id: "reserve", name: { en: "Reserve ratio", ar: "نسبة الاحتياطي", zh: "预留比例" }, impact: 0.07, kind: "transfer" },
  { id: "allocation", name: { en: "Service allocation weights", ar: "أوزان تخصيص الخدمات", zh: "服务分配权重" }, impact: 0.05, kind: "service" },
];

export const G02_SENSITIVITY = getPageContent("g02", "sensitivity", G02_SENSITIVITY_DEFAULT);

export const createInitialGroup02State = () => ({
  context: {
    fiscalYear: "2027",
    periodType: "Quarterly",
    period: "FY2027 Q2",
    scopeType: "Secretariat",
    scopeId: "SEC-ALL",
    dataVersionId: "DV-2027-06-28-A",
    baselineVersionId: "BL-2027-DRAFT-03",
    costAnalysisVersionId: null,
    housingAnalysisVersionId: null,
    forecastVersionId: null,
    scenarioVersionId: null,
    focusTarget: null,
  },
  readiness: {
    status: "ready_with_exceptions",
    completeness: 96,
    freshness: 94,
    coverage: 92,
    criticalIssues: 0,
    exceptions: 2,
    sources: [
      { id: "sap", name: "SAP", freshness: 99, status: "ready" },
      { id: "etimad", name: "Etimad", freshness: 97, status: "ready" },
      { id: "balady", name: "Balady", freshness: 94, status: "ready" },
      { id: "project", name: "Project Intake", freshness: 88, status: "exception" },
    ],
  },
  baseline: {
    status: "draft",
    versionId: "BL-2027-DRAFT-03",
    selectedPosture: "service",
    ceiling: 5.8,
    exclusions: 0.44,
    obligations: 1.26,
    paymentPlan: 0.68,
    reserve: 0.58,
    fiscalSpace: 2.84,
    priorityGap: 0.6,
    approvedAt: null,
  },
  cost: {
    status: "not_started",
    versionId: null,
    projectId: "PRJ-2027-041",
    decision: null,
    approvedEstimate: null,
    conflict: false,
  },
  housing: {
    status: "not_started",
    versionId: null,
    optionId: "balanced",
    dataComplete: true,
  },
  forecast: {
    status: "not_started",
    versionId: null,
    confidence: 84,
    selectedPeriod: "2029 Q1",
    includeProbable: true,
  },
  scenario: {
    status: "draft",
    versionId: "SC-2027-BAL-D03",
    selectedId: "balanced",
    comparedIds: ["baseline", "balanced", "resilience"],
    submittedAt: null,
    approvedAt: null,
  },
  audit: [
    { id: "AUD-1048", at: "02 Jul 2026 · 09:24", type: "Context", detail: "Approved data version loaded for FY2027 Secretariat planning." },
    { id: "AUD-1051", at: "02 Jul 2026 · 09:31", type: "Planning", detail: "Balanced service posture selected for the budget baseline draft." },
  ],
});

export function mergeStoredGroup02State(stored) {
  const base = createInitialGroup02State();
  if (!stored || typeof stored !== "object") return base;
  return {
    ...base,
    ...stored,
    context: { ...base.context, ...(stored.context || {}) },
    readiness: { ...base.readiness, ...(stored.readiness || {}) },
    baseline: { ...base.baseline, ...(stored.baseline || {}) },
    cost: { ...base.cost, ...(stored.cost || {}) },
    housing: { ...base.housing, ...(stored.housing || {}) },
    forecast: { ...base.forecast, ...(stored.forecast || {}) },
    scenario: { ...base.scenario, ...(stored.scenario || {}) },
    audit: Array.isArray(stored.audit) ? stored.audit : base.audit,
  };
}
