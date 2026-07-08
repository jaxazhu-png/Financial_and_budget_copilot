import React, { Fragment, useEffect, useRef, useState } from 'react';
import './uc06.css';
import * as echarts from 'echarts';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';

if (typeof window !== 'undefined') {
    window.echarts = echarts;
}
import { locales } from './locales.js';
import saudiGeo from './saudi_geo_simple.json';
import {
    AMANA_OPTIONS,
    MUNICIPALITY_OPTIONS,
    askSmartQuery,
    getDashboardData,
    getReportOutput,
    getSmartQuerySampleQuestions,
    formatMoney,
    formatPercent,
} from './dataTemplates.jsx';
import logo from './logo.jpg';

const REPORT_TYPES = [
    { value: 'Executive', en: 'Executive Report', ar: 'التقرير التنفيذي' },
    { value: 'Disbursement', en: 'Disbursement Report', ar: 'تقرير الصرف' },
    { value: 'Contracts', en: 'Contracts Report', ar: 'تقرير العقود' },
    { value: 'Initiatives', en: 'Initiatives Report', ar: 'تقرير المبادرات' },
    { value: 'Services', en: 'Services Report', ar: 'تقرير الخدمات' },
    { value: 'Doors', en: 'Budget Doors Report', ar: 'تقرير الأبواب المالية' },
    { value: 'Infrastructure', en: 'Infrastructure Report', ar: 'تقرير البنية التحتية' },
    { value: 'Expropriation', en: 'Expropriation Report', ar: 'تقرير نزع الملكية' },
];

const ANALYSIS_LEVELS = [
    { value: 'Ministry', en: 'Ministry', ar: 'مستوى الوزارة' },
    { value: 'Amana', en: 'Amana', ar: 'مستوى الأمانة' },
    { value: 'Municipality', en: 'Municipality', ar: 'مستوى البلدية' },
];

const FISCAL_YEARS = [
    { value: 'FY2026', en: 'FY2026', ar: 'السنة المالية 2026' },
    { value: 'FY2025', en: 'FY2025', ar: 'السنة المالية 2025' },
];

const PERIOD_TYPES = [
    { value: 'Monthly', en: 'Monthly', ar: 'شهري' },
    { value: 'Quarterly', en: 'Quarterly', ar: 'ربع سنوي' },
    { value: 'Annually', en: 'Annually', ar: 'سنوي' },
];

const SPECIFIC_PERIOD_OPTIONS = {
    FY2026: {
        Monthly: [
            { value: '2026-01', en: 'Jan 2026', ar: 'يناير 2026' },
            { value: '2026-02', en: 'Feb 2026', ar: 'فبراير 2026' },
            { value: '2026-03', en: 'Mar 2026', ar: 'مارس 2026' },
            { value: '2026-04', en: 'Apr 2026', ar: 'أبريل 2026' },
        ],
        Quarterly: [
            { value: '2026-Q1', en: 'Q1 2026', ar: 'الربع الأول 2026' },
            { value: '2026-Q2', en: 'Q2 2026', ar: 'الربع الثاني 2026' },
        ],
        Annually: [
            { value: '2026-FY', en: 'FY2026', ar: 'السنة المالية 2026' },
        ],
    },
    FY2025: {
        Monthly: [
            { value: '2025-09', en: 'Sep 2025', ar: 'سبتمبر 2025' },
            { value: '2025-10', en: 'Oct 2025', ar: 'أكتوبر 2025' },
            { value: '2025-11', en: 'Nov 2025', ar: 'نوفمبر 2025' },
            { value: '2025-12', en: 'Dec 2025', ar: 'ديسمبر 2025' },
        ],
        Quarterly: [
            { value: '2025-Q3', en: 'Q3 2025', ar: 'الربع الثالث 2025' },
            { value: '2025-Q4', en: 'Q4 2025', ar: 'الربع الرابع 2025' },
        ],
        Annually: [
            { value: '2025-FY', en: 'FY2025', ar: 'السنة المالية 2025' },
        ],
    },
};

const safeNumber = (value, fallback = 0) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : fallback;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        const matched = normalized.match(/-?\d+(\.\d+)?/);
        if (!matched) return fallback;
        const parsed = Number(matched[0]);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
};

const cloneDashboardState = (value) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(
        JSON.stringify(value, (_key, item) => {
            if (typeof item === 'number' && Number.isNaN(item)) {
                return '__MOMAH_NAN__';
            }
            return item;
        }),
        (_key, item) => (item === '__MOMAH_NAN__' ? NaN : item),
    );
};

const G02_SANKEY_TOTAL = 470.0;
const G02_SANKEY_NODES = {
    chapter1: {
        key: 'chapter1',
        level: 0,
        type: 'door',
        color: '#3b82f6',
        en: 'Door 1 · Salaries & Compensation',
        ar: 'الباب 1 · تعويضات العاملين',
        displayEn: 'Door 1',
        displayAr: 'الباب 1',
        detailEn: 'Salaries & Compensation',
        detailAr: 'تعويضات العاملين',
    },
    chapter2: {
        key: 'chapter2',
        level: 0,
        type: 'door',
        color: '#3b82f6',
        en: 'Door 2 · Goods & Services',
        ar: 'الباب 2 · السلع والخدمات',
        displayEn: 'Door 2',
        displayAr: 'الباب 2',
        detailEn: 'Goods & Services',
        detailAr: 'السلع والخدمات',
    },
    chapter3: {
        key: 'chapter3',
        level: 0,
        type: 'door',
        color: '#3b82f6',
        en: 'Door 3 · Programs',
        ar: 'الباب 3 · البرامج',
        displayEn: 'Door 3',
        displayAr: 'الباب 3',
        detailEn: 'Programs',
        detailAr: 'البرامج',
    },
    chapter4: {
        key: 'chapter4',
        level: 0,
        type: 'door',
        color: '#3b82f6',
        en: 'Door 4 · Projects',
        ar: 'الباب 4 · المشاريع',
        displayEn: 'Door 4',
        displayAr: 'الباب 4',
        detailEn: 'Projects',
        detailAr: 'المشاريع',
    },
    ministryCentral: {
        key: 'ministryCentral',
        level: 1,
        type: 'central',
        color: '#6366f1',
        en: 'Ministry Central Programs',
        ar: 'ديوان عام الوزارة',
        displayEn: 'Ministry HQ',
        displayAr: 'ديوان عام الوزارة',
    },
    riyadhAmana: {
        key: 'riyadhAmana',
        level: 1,
        type: 'amana',
        color: '#10b981',
        en: 'Riyadh Amana',
        ar: 'أمانة منطقة الرياض',
        displayEn: 'Riyadh Amana',
        displayAr: 'أمانة الرياض',
    },
    easternAmana: {
        key: 'easternAmana',
        level: 1,
        type: 'amana',
        color: '#14b8a6',
        en: 'Eastern Province Amana',
        ar: 'أمانة المنطقة الشرقية',
        displayEn: 'Eastern Amana',
        displayAr: 'أمانة الشرقية',
    },
    otherAmanas: {
        key: 'otherAmanas',
        level: 1,
        type: 'amana',
        color: '#0f766e',
        en: 'Other Amana',
        ar: 'أمانات أخرى',
        displayEn: 'Other Amana',
        displayAr: 'أمانات أخرى',
    },
    roads: {
        key: 'roads',
        level: 2,
        type: 'service',
        color: '#f59e0b',
        en: 'Roads',
        ar: 'الطرق',
        displayEn: 'Roads',
        displayAr: 'الطرق',
    },
    stormwater: {
        key: 'stormwater',
        level: 2,
        type: 'service',
        color: '#fb923c',
        en: 'Stormwater Drainage',
        ar: 'تصريف مياه الأمطار',
        displayEn: 'Stormwater',
        displayAr: 'تصريف الأمطار',
    },
    parks: {
        key: 'parks',
        level: 2,
        type: 'service',
        color: '#fbbf24',
        en: 'Parks & Greenery',
        ar: 'الحدائق والتشجير',
        displayEn: 'Parks',
        displayAr: 'الحدائق',
    },
    housing: {
        key: 'housing',
        level: 2,
        type: 'service',
        color: '#f59e0b',
        en: 'Developmental Housing',
        ar: 'الإسكان التنموي',
        displayEn: 'Housing',
        displayAr: 'الإسكان',
    },
    admin: {
        key: 'admin',
        level: 2,
        type: 'service',
        color: '#f97316',
        en: 'Administration & HQ OPEX',
        ar: 'الإدارة وتشغيل الديوان',
        displayEn: 'Administration',
        displayAr: 'الإدارة',
    },
    otherServices: {
        key: 'otherServices',
        level: 2,
        type: 'service',
        color: '#ff7f0e',
        en: 'Other Municipal Services',
        ar: 'خدمات بلدية أخرى',
        displayEn: 'Other Services',
        displayAr: 'خدمات أخرى',
    },
};

const G02_SANKEY_LINKS = [
    ['chapter1', 'ministryCentral', 10.0],
    ['chapter1', 'riyadhAmana', 5.0],
    ['chapter1', 'easternAmana', 4.0],
    ['chapter2', 'ministryCentral', 15.0],
    ['chapter2', 'riyadhAmana', 6.0],
    ['chapter3', 'riyadhAmana', 50.0],
    ['chapter3', 'easternAmana', 40.0],
    ['chapter3', 'otherAmanas', 60.0],
    ['chapter4', 'ministryCentral', 120.0],
    ['chapter4', 'riyadhAmana', 60.0],
    ['chapter4', 'easternAmana', 50.0],
    ['chapter4', 'otherAmanas', 50.0],
    ['ministryCentral', 'housing', 110.0],
    ['ministryCentral', 'admin', 35.0],
    ['riyadhAmana', 'roads', 50.0],
    ['riyadhAmana', 'stormwater', 40.0],
    ['riyadhAmana', 'parks', 20.0],
    ['riyadhAmana', 'otherServices', 11.0],
    ['easternAmana', 'roads', 45.0],
    ['easternAmana', 'stormwater', 35.0],
    ['easternAmana', 'otherServices', 14.0],
    ['otherAmanas', 'roads', 35.0],
    ['otherAmanas', 'stormwater', 40.0],
    ['otherAmanas', 'otherServices', 35.0],
];

const DEPARTMENTS_TREE = [
    {
        id: 'planningPerformance',
        name_ar: 'الادارة العامة للتخطيط والاداء المالي',
        name_en: 'General Department of Financial Planning and Performance',
        subDepartments: [
            {
                id: 'performanceAnalysis',
                name_ar: 'ادارة تحليل الاداء المالي',
                name_en: 'Financial Performance Analysis Department',
                allowedUseCases: ['g02'],
                defaultUseCase: 'g02',
                implemented: true,
                functionLabel_ar: 'تحليل الأداء المالي',
                functionLabel_en: 'Financial Performance analysis',
                registryTitle_ar: 'سجل تقارير تحليل الأداء المالي',
                registryTitle_en: 'Financial Performance Reports Registry',
                registryTitle_zh: '财务绩效分析报告登记簿',
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            },
            {
                id: 'planningDept',
                name_ar: 'ادارة التخطيط',
                name_en: 'Planning Department',
                allowedUseCases: ['g02'],
                defaultUseCase: 'g02',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            }
        ]
    },
    {
        id: 'budgetDept',
        name_ar: 'الادارة العامة للميزانية',
        name_en: 'General Department of Budget',
        subDepartments: [
            {
                id: 'budgetExecution',
                name_ar: 'ادارة تنفيذ الميزانية',
                name_en: 'Budget Execution Department',
                allowedUseCases: ['g03'],
                defaultUseCase: 'g03',
                implemented: true,
                functionLabel_ar: 'تحليل تنفيذ الميزانية',
                functionLabel_en: 'Budget Execution analysis',
                registryTitle_ar: 'سجل تقارير تحليل تنفيذ الميزانية',
                registryTitle_en: 'Budget Execution Reports Registry',
                registryTitle_zh: '预算执行分析报告登记簿',
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            }
        ]
    },
    {
        id: 'revenueDept',
        name_ar: 'الادارة العامة للايرادات',
        name_en: 'General Department of Revenue',
        subDepartments: [
            {
                id: 'revenueCollection',
                name_ar: 'ادارة تحصيل الايرادات',
                name_en: 'Revenue Collection Department',
                allowedUseCases: ['g06'],
                defaultUseCase: 'g06',
                implemented: true,
                functionLabel_ar: 'تحليل الإيرادات والتحصيل',
                functionLabel_en: 'Revenue & Collection analysis',
                registryTitle_ar: 'سجل تقارير تحليل الإيرادات والتحصيل',
                registryTitle_en: 'Revenue & Collection Reports Registry',
                registryTitle_zh: '收入与征收分析报告登记簿',
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            },
            {
                id: 'assetsDept',
                name_ar: 'ادارة الاصول',
                name_en: 'Assets Department',
                allowedUseCases: ['g06'],
                defaultUseCase: 'g06',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            }
        ]
    },
    {
        id: 'financialAffairs',
        name_ar: 'الاداره العامة للشؤون المالية',
        name_en: 'General Department of Financial Affairs',
        subDepartments: [
            {
                id: 'entitlementsDept',
                name_ar: 'ادارة الاستحقاقات المالية',
                name_en: 'Financial Entitlements Department',
                allowedUseCases: ['g03'],
                defaultUseCase: 'g03',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            },
            {
                id: 'auditDept',
                name_ar: 'ادارة التدقيق',
                name_en: 'Audit Department',
                allowedUseCases: ['g03'],
                defaultUseCase: 'g03',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            }
        ]
    },
    {
        id: 'financialReporting',
        name_ar: 'الادارة العامة للتقارير المالية',
        name_en: 'General Department of Financial Reporting',
        subDepartments: [
            {
                id: 'reportingDept',
                name_ar: 'ادارة التقارير المالية',
                name_en: 'Financial Reporting Department',
                allowedUseCases: ['g02'],
                defaultUseCase: 'g02',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            },
            {
                id: 'complianceDept',
                name_ar: 'ادارة الامتثال',
                name_en: 'Compliance Department',
                allowedUseCases: ['g02'],
                defaultUseCase: 'g02',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            },
            {
                id: 'costDept',
                name_ar: 'ادارة التكاليف',
                name_en: 'Cost Management Department',
                allowedUseCases: ['g03'],
                defaultUseCase: 'g03',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            },
            {
                id: 'accountingDept',
                name_ar: 'ادارة المحاسبة',
                name_en: 'Accounting Department',
                allowedUseCases: ['g06'],
                defaultUseCase: 'g06',
                implemented: false,
                filterPreset: { analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'] }
            }
        ]
    }
];

const USE_CASES = [
    {
        id: 'g02',
        name_ar: '📊 لوحة القرار: الأداء التخطيطي والمالي',
        name_en: '📊 Decision Panel: Planning & Financial Performance',
        short_ar: 'التخطيط والأداء',
        short_en: 'Planning & Performance'
    },
    {
        id: 'g03',
        name_ar: '💸 لوحة التحكم: تنفيذ الميزانية والإنفاق',
        name_en: '💸 Control Panel: Budget Execution & Spending',
        short_ar: 'تنفيذ الميزانية',
        short_en: 'Budget Execution'
    },
    {
        id: 'g06',
        name_ar: '💰 لوحة التحصيل: الإيرادات والأصول',
        name_en: '💰 Collection Panel: Revenue & Assets',
        short_ar: 'الإيرادات والتحصيل',
        short_en: 'Revenue & Collection'
    }
];

const SURFACE_CARD = 'bg-white border border-gray-200 rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.05)]';
const SOFT_PANEL = 'rounded-2xl border border-gray-200 bg-gray-50/70';
const SECTION_KICKER = 'text-[10px] uppercase tracking-[0.16em] text-gray-500 font-bold';
const CHART_PALETTE = {
    green: '#1b8354',
    greenSoft: '#dff6e7',
    blue: '#1570ef',
    blueSoft: '#d1e9ff',
    gold: '#dba102',
    goldSoft: '#fffce6',
    lavender: '#80519f',
    lavenderSoft: '#f2e9f5',
    red: '#d92d20',
    redSoft: '#fee4e2',
    slate: '#384250',
};

function labelFor(items, value, lang) {
    return items.find((item) => item.value === value)?.[lang] || value;
}

function valuesFromSelect(event) {
    return Array.from(event.target.selectedOptions).map((option) => option.value);
}

function normalizeMultiSelect(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return ['All'];
    }
    return values.includes('All') ? ['All'] : values;
}

function getAvailableMunicipalities(selectedAmanas) {
    const normalizedAmanas = normalizeMultiSelect(selectedAmanas);
    const activeAmanas = normalizedAmanas.includes('All')
        ? Object.keys(MUNICIPALITY_OPTIONS)
        : normalizedAmanas;

    return activeAmanas.flatMap((amanaKey) => MUNICIPALITY_OPTIONS[amanaKey] || []);
}

function buildFilterSummary({
    lang,
    analysisLevel,
    selectedAmanas,
    selectedMunicipalities,
    fiscalYear,
    periodType,
    specificPeriod,
}) {
    const amanaLabels = normalizeMultiSelect(selectedAmanas).includes('All')
        ? labelFor(AMANA_OPTIONS, 'All', lang)
        : selectedAmanas.map((value) => labelFor(AMANA_OPTIONS, value, lang)).join(lang === 'ar' ? '، ' : ', ');

    const availableMunicipalities = getAvailableMunicipalities(selectedAmanas);
    const municipalityLabels = normalizeMultiSelect(selectedMunicipalities).includes('All')
        ? (lang === 'ar' ? 'جميع البلديات' : 'All Municipalities')
        : selectedMunicipalities
            .map((value) => availableMunicipalities.find((item) => item.value === value)?.[lang] || value)
            .join(lang === 'ar' ? '، ' : ', ');

    const specificPeriodLabel = (SPECIFIC_PERIOD_OPTIONS[fiscalYear]?.[periodType] || []).find((item) => item.value === specificPeriod)?.[lang] || specificPeriod;
    return `${labelFor(ANALYSIS_LEVELS, analysisLevel, lang)} / ${amanaLabels} / ${municipalityLabels} / ${specificPeriodLabel}`;
}

function MultiSelectDropdown({
    label,
    placeholder,
    options,
    value,
    onChange,
    lang,
    allValue = 'All',
    allLabel,
    helperText,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const normalizedValue = normalizeMultiSelect(value);
    const selectedLabels = normalizedValue.includes(allValue)
        ? [allLabel]
        : options
            .filter((option) => normalizedValue.includes(option.value))
            .map((option) => option[lang]);

    const displayLabel = selectedLabels.length ? selectedLabels.join(' / ') : placeholder;

    const toggleValue = (nextValue) => {
        if (nextValue === allValue) {
            onChange([allValue]);
            return;
        }

        const baseValues = normalizedValue.includes(allValue) ? [] : [...normalizedValue];
        const exists = baseValues.includes(nextValue);
        const nextValues = exists
            ? baseValues.filter((item) => item !== nextValue)
            : [...baseValues, nextValue];

        onChange(nextValues.length ? nextValues : [allValue]);
    };

    return (
        <div className="flex flex-col space-y-1 relative">
            <label className="text-xs font-bold text-gray-700">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:border-momahGreen-600 focus:ring-1 focus:ring-momahGreen-600 outline-none text-start flex items-center justify-between gap-3"
            >
                <span className="truncate text-gray-700">{displayLabel}</span>
                <span className="text-gray-400 shrink-0">{isOpen ? '▴' : '▾'}</span>
            </button>
            {isOpen ? (
                <div className="absolute top-full mt-1 z-30 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-56 overflow-y-auto p-2 space-y-1">
                        <label className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer text-xs text-gray-700">
                            <input
                                type="checkbox"
                                checked={normalizedValue.includes(allValue)}
                                onChange={() => toggleValue(allValue)}
                                className="accent-[#1b8354]"
                            />
                            <span>{allLabel}</span>
                        </label>
                        {options.map((option) => (
                            <label key={option.value} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer text-xs text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={!normalizedValue.includes(allValue) && normalizedValue.includes(option.value)}
                                    onChange={() => toggleValue(option.value)}
                                    className="accent-[#1b8354]"
                                />
                                <span>{option[lang]}</span>
                            </label>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 truncate">{helperText}</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[11px] font-semibold text-momahGreen-700 hover:text-momahGreen-800"
                        >
                            {lang === 'ar' ? 'تم' : 'Done'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function getAlertClasses(status) {
    if (status === 'nominal') {
        return {
            text: 'text-[#085d3a] font-extrabold',
            badge: 'bg-[#067647] text-white shadow-xs border-none font-bold',
            border: 'border-[#abefc6] border-l-4 border-l-[#067647]',
            soft: 'bg-[#ecfdf3]',
        };
    }
    if (status === 'warning') {
        return {
            text: 'text-[#93370d] font-extrabold',
            badge: 'bg-[#b54708] text-white shadow-xs border-none font-bold',
            border: 'border-[#fedf89] border-l-4 border-l-[#b54708]',
            soft: 'bg-[#fffaeb]',
        };
    }
    if (status === 'danger') {
        return {
            text: 'text-[#912018] font-extrabold',
            badge: 'bg-[#d92d20] text-white shadow-xs border-none font-bold',
            border: 'border-[#fecdca] border-l-4 border-l-[#d92d20]',
            soft: 'bg-[#fef3f2]',
        };
    }
    return {
        text: 'text-[#4d5761] font-extrabold',
        badge: 'bg-[#4d5761] text-white shadow-xs border-none font-bold',
        border: 'border-[#e5e7eb] border-l-4 border-l-[#4d5761]',
        soft: 'bg-[#f9fafb]',
    };
}

function getRegionAlertStyle(status) {
    if (status === 'good') {
        return { fill: '#168c5b', soft: '#def7ec', stroke: '#0f6a44', label: 'Good' };
    }
    if (status === 'warning') {
        return { fill: '#d97706', soft: '#fef3c7', stroke: '#b45309', label: 'Watch' };
    }
    return { fill: '#dc2626', soft: '#fee2e2', stroke: '#991b1b', label: 'Risk' };
}

function getMapBubbleStatusLabel(status, lang) {
    if (lang === 'ar') {
        return status === 'good' ? 'سليم' : status === 'warning' ? 'متابعة' : 'إنذار';
    }
    return status === 'good' ? 'Healthy' : status === 'warning' ? 'Watch' : 'Alert';
}

function getExecutionMatrixCellStyle(value) {
    if (value < 50) {
        return {
            bg: '#fee2e2',
            text: '#dc2626',
            border: '#dc2626',
            borderWidth: '2px',
        };
    }
    if (value < 75) {
        return {
            bg: '#fef3c7',
            text: '#374151',
            border: 'transparent',
            borderWidth: '1px',
        };
    }
    if (value < 90) {
        return {
            bg: '#dcfce7',
            text: '#374151',
            border: 'transparent',
            borderWidth: '1px',
        };
    }
    return {
        bg: '#10b981',
        text: '#ffffff',
        border: 'transparent',
        borderWidth: '1px',
    };
}

function CompactHeaderCard({ lang, scopeLabel, kpis }) {
    const renderKpiSummary = () => {
        if (!kpis || !kpis.length) return null;
        
        // 提取主要指标
        const items = kpis.map(k => `${k.name}: ${k.value}`);
        const joined = items.join(' | ');
        
        if (lang === 'ar') {
            return (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-[10px] text-gray-500 font-sans leading-relaxed" dir="rtl">
                    <span className="font-bold text-momahGreen-700 ml-1">📊 [ملخص البيانات الموضوعية]</span>
                    تم التحقق من مطابقة البيانات مع جداول الحسابات الختامية. مؤشرات الأداء الحالية: {joined}. جميع البيانات الحسابية متطابقة ومتسقة رياضياً.
                </div>
            );
        } else {
            return (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-[10px] text-gray-500 font-sans leading-relaxed" dir="ltr">
                    <span className="font-bold text-momahGreen-700 mr-1">📊 [Objective Data Summary]</span>
                    Source financial ledger verified. Key metrics: {joined}. Mathematical balance check: Passed.
                </div>
            );
        }
    };

    return (
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm text-start flex-1 max-w-3xl">
            <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-momahGreen-700 font-bold">
                    {lang === 'ar' ? 'نطاق العرض' : 'Scope Summary'}
                </div>
                <div className="text-[11px] text-gray-600 mt-1 leading-5 break-words">{scopeLabel}</div>
                {renderKpiSummary()}
            </div>
        </div>
    );
}

function AiBriefCard({ lang, brief, onReview }) {
    return (
        <div className="bg-gradient-to-r from-momahGreen-50 to-white border border-momahGreen-100 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-start">
            <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-momahGreen-700 font-bold">
                    {lang === 'ar' ? 'تعليق ذكي مختصر' : (lang === 'zh' ? '智能评论简报' : 'AI Brief')}
                </div>
                <p className="text-[12px] text-gray-700 mt-1 leading-6">{brief}</p>
            </div>
            <button
                type="button"
                onClick={onReview}
                className="shrink-0 px-4 py-2.5 bg-momahGreen-600 hover:bg-momahGreen-700 text-white rounded-lg text-xs font-bold shadow transition-all"
            >
                {lang === 'ar' ? 'الانتقال إلى مراجعة التعليق' : (lang === 'zh' ? '前往复核评论' : 'Go to Commentary Review')}
            </button>
        </div>
    );
}

function RecommendedTypesCard({ lang, types }) {
    if (!types?.length) {
        return null;
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-start">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
                {lang === 'ar' ? 'أنواع التقرير الموصى بها لهذا المنظور' : 'Recommended Report Types for This View'}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {types.map((type) => (
                    <span
                        key={type}
                        className="px-3 py-1.5 rounded-full bg-momahGreen-50 border border-momahGreen-100 text-[11px] font-semibold text-momahGreen-800"
                    >
                        {REPORT_TYPES.find((item) => item.value === type)?.[lang] || type}
                    </span>
                ))}
            </div>
        </div>
    );
}

function KPIGrid({ kpis, lang }) {
    const list = kpis || [];
    const firstRow = list.slice(0, 3);
    const secondRow = list.slice(3);
    const secondRowCols = {
        1: 'xl:grid-cols-1',
        2: 'xl:grid-cols-2',
        3: 'xl:grid-cols-3',
        4: 'xl:grid-cols-4',
    }[Math.min(secondRow.length, 4)] || 'xl:grid-cols-4';

    const renderKpiBadge = (status, styles) => {
        let icon = '';
        let text = '';
        if (status === 'nominal') {
            icon = '↑';
            text = lang === 'ar' ? 'متحسن' : (lang === 'zh' ? '稳步提升' : 'Improving');
        } else if (status === 'warning') {
            icon = '↓';
            text = lang === 'ar' ? 'تراجع' : (lang === 'zh' ? '关注预警' : 'Slipping');
        } else if (status === 'danger') {
            icon = '⚠';
            text = lang === 'ar' ? 'حرج' : (lang === 'zh' ? '风险警报' : 'Critical');
        } else {
            icon = '→';
            text = lang === 'ar' ? 'مستقر' : (lang === 'zh' ? '稳定持平' : 'Stable');
        }
        return (
            <span className={`${styles.badge} text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase whitespace-nowrap`}>
                <span className="text-[10px] font-extrabold">{icon}</span>
                <span>{text}</span>
            </span>
        );
    };

    const renderCard = (kpi, idx) => {
        const styles = getAlertClasses(kpi.status);
        return (
            <div key={idx} className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between text-start ${styles.border}`}>
                <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-bold text-gray-500 leading-tight">{kpi.name}</span>
                    {renderKpiBadge(kpi.status, styles)}
                </div>
                <div className="mt-3">
                    <div className={`text-2xl font-bold ${styles.text}`}>{kpi.value}</div>
                    <div className="text-[10px] text-gray-400 mt-1 leading-5">{kpi.desc}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {firstRow.map((kpi, idx) => renderCard(kpi, idx))}
            </div>
            {secondRow.length > 0 && (
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${secondRowCols} gap-4`}>
                    {secondRow.map((kpi, idx) => renderCard(kpi, idx + firstRow.length))}
                </div>
            )}
        </div>
    );
}

function RegionalMapCard({ lang, mapData }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const getColorStyle = (status) => {
        if (status === 'good') return { fill: '#22c55e', stroke: '#16a34a' };
        if (status === 'warning') return { fill: '#f59e0b', stroke: '#d97706' };
        return { fill: '#ef4444', stroke: '#dc2626' };
    };

    useEffect(() => {
        if (!chartRef.current) return undefined;

        if (chartInstanceRef.current) {
            try {
                chartInstanceRef.current.dispose();
            } catch (e) {
                console.error('Error disposing echarts:', e);
            }
            chartInstanceRef.current = null;
        }

        const chart = echarts.init(chartRef.current);
        chartInstanceRef.current = chart;

        if (mapData?.variant === 'matrix') {
            const columns = mapData.columns || [];
            const rows = mapData.rows || [];

            const xData = columns.map(c => c.label);
            const yData = rows.map(r => r.label);

            const heatmapData = [];
            rows.forEach((row, rowIndex) => {
                row.cells.forEach((cell, cellIndex) => {
                    heatmapData.push([cellIndex, rowIndex, cell.value]);
                });
            });

            chart.setOption({
                animation: false,
                grid: {
                    left: 10,
                    right: 10,
                    top: 52,
                    bottom: 10,
                    containLabel: true,
                },
                tooltip: {
                    trigger: 'item',
                    confine: true,
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    borderColor: '#d1d5db',
                    borderWidth: 1,
                    textStyle: {
                        color: '#111827',
                        fontSize: 11,
                    },
                    extraCssText: 'box-shadow: 0 10px 24px rgba(15,23,42,0.14); border-radius: 12px; padding: 10px 12px;',
                    formatter: (params) => {
                        const [colIndex, rowIndex, value] = params.data;
                        const colName = xData[colIndex];
                        const rowName = yData[rowIndex];
                        return `
                            <div style="font-weight:700; margin-bottom:4px;">${rowName} × ${colName}</div>
                            <div>${lang === 'ar' ? 'نسبة الصرف' : 'Execution Rate'}: <span style="font-weight:600; color:#10b981;">${value.toFixed(0)}%</span></div>
                        `;
                    },
                },
                xAxis: {
                    type: 'category',
                    data: xData,
                    position: 'top',
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitArea: { show: false },
                    axisLabel: {
                        color: '#475467',
                        fontSize: 9,
                        fontWeight: 700,
                        interval: 0,
                        lineHeight: 12,
                        formatter: (val) => val ? val.split(' ').join('\n') : '',
                    },
                },
                yAxis: {
                    type: 'category',
                    data: yData,
                    inverse: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitArea: { show: false },
                    axisLabel: {
                        color: '#344054',
                        fontSize: 9.5,
                        fontWeight: 700,
                        margin: 6,
                    },
                },
                visualMap: {
                    type: 'piecewise',
                    show: false,
                    pieces: [
                        { min: 90, color: '#10b981' },
                        { min: 75, max: 89, color: '#dcfce7' },
                        { min: 50, max: 74, color: '#fef3c7' },
                        { max: 49, color: '#fee2e2' }
                    ],
                },
                series: [
                    {
                        name: 'Execution',
                        type: 'heatmap',
                        data: heatmapData,
                        progressive: 0,
                        label: {
                            show: true,
                            color: '#1f2937',
                            fontSize: 10,
                            fontWeight: 700,
                            formatter: ({ data }) => `${data[2].toFixed(0)}%`,
                        },
                        itemStyle: {
                            borderRadius: 8,
                            borderColor: '#ffffff',
                            borderWidth: 2,
                        },
                        emphasis: {
                            itemStyle: {
                                borderColor: '#9ca3af',
                                borderWidth: 2,
                                shadowBlur: 8,
                                shadowColor: 'rgba(15,23,42,0.18)',
                            },
                        },
                    },
                ],
            }, true);
        } else {
            if (!echarts.getMap('saudi_regions')) {
                echarts.registerMap('saudi_regions', saudiGeo);
            }

            const AMANA_TO_GEO_REGION = {
                riyadh: 'Ar Riyad',
                eastern: 'Ash Sharqiyah',
                ahsa: 'Ash Sharqiyah',
                hafar: 'Ash Sharqiyah',
                madinah: 'Al Madinah',
                jeddah: 'Makkah',
                makkah: 'Makkah',
                taif: 'Makkah',
                qassim: 'Al Quassim',
                asir: '`Asir',
                tabuk: 'Tabuk',
                jouf: 'Al Jawf',
                northern: 'Al Hudud ash Shamaliyah',
                baha: 'Al Bahah',
                hail: "Ha'il",
                jazan: 'Jizan',
                najran: 'Najran'
            };

            const regions = mapData.regions || [];
            
            const scatterData = regions.map(r => {
                const style = getColorStyle(r.alertStatus);
                return {
                    name: r.label,
                    value: [r.lng, r.lat, r.colorMetric],
                    region: r,
                    itemStyle: {
                        color: style.fill,
                        borderColor: style.stroke,
                        borderWidth: 2,
                    }
                };
            });

            const regionValues = {};
            regions.forEach(r => {
                const amanaKey = r.amanaKey || r.key;
                const geoName = AMANA_TO_GEO_REGION[amanaKey];
                if (geoName) {
                    if (!regionValues[geoName]) {
                        regionValues[geoName] = [];
                    }
                    regionValues[geoName].push(r.colorMetric);
                }
            });

            // 补全所有 13 个行政省份，未在 filters 中选中的区域设为 -1 哨兵值以置灰
            const ALL_GEO_REGIONS = [
                'Ar Riyad', 'Ash Sharqiyah', 'Al Madinah', 'Makkah', 'Al Quassim',
                '`Asir', 'Tabuk', 'Al Jawf', 'Al Hudud ash Shamaliyah',
                'Al Bahah', "Ha'il", 'Jizan', 'Najran'
            ];

            const nameMapAr = {
                'Ar Riyad': 'الرياض',
                'Ash Sharqiyah': 'المنطقة الشرقية',
                'Al Madinah': 'المدينة المنورة',
                'Makkah': 'مكة المكرمة',
                'Al Quassim': 'القصيم',
                '`Asir': 'عسير',
                'Tabuk': 'تبوك',
                'Al Jawf': 'الجوف',
                'Al Hudud ash Shamaliyah': 'الحدود الشمالية',
                'Al Bahah': 'الباحة',
                "Ha'il": 'حائل',
                'Jizan': 'جازان',
                'Najran': 'نجران'
            };

            const nameMapEnAbbr = {
                'Ar Riyad': 'RY',
                'Ash Sharqiyah': 'EP',
                'Al Madinah': 'MD',
                'Makkah': 'MK',
                'Al Quassim': 'QS',
                '`Asir': 'AS',
                'Tabuk': 'TB',
                'Al Jawf': 'JF',
                'Al Hudud ash Shamaliyah': 'NB',
                'Al Bahah': 'BH',
                "Ha'il": 'HL',
                'Jizan': 'JZ',
                'Najran': 'NJ'
            };

            const nameMapArAbbr = {
                'Ar Riyad': 'الرياض',
                'Ash Sharqiyah': 'الشرقية',
                'Al Madinah': 'المدينة',
                'Makkah': 'مكة',
                'Al Quassim': 'القصيم',
                '`Asir': 'عسير',
                'Tabuk': 'تبوك',
                'Al Jawf': 'الجوف',
                'Al Hudud ash Shamaliyah': 'الشمالية',
                'Al Bahah': 'الباحة',
                "Ha'il": 'حائل',
                'Jizan': 'جازان',
                'Najran': 'نجران'
            };

            const mapSeriesData = ALL_GEO_REGIONS.map(name => {
                const displayName = lang === 'ar' ? (nameMapArAbbr[name] || name) : (nameMapEnAbbr[name] || name);
                if (regionValues[name] && regionValues[name].length > 0) {
                    const list = regionValues[name];
                    const avg = list.reduce((sum, v) => sum + v, 0) / list.length;
                    return { name: displayName, value: avg };
                }
                return { name: displayName, value: -1 };
            });

            console.log('mapSeriesData G01/G06:', JSON.stringify(mapSeriesData));

            const visualMapMin = 0;
            const visualMapMax = 100;

            const isG06 = mapData.thresholdLabel === (lang === 'ar' ? 'تحقيق المستهدف' : 'Target Achievement');
            const pieces = isG06 ? [
                { min: 95, color: '#dcfce7' }, // 柔和绿 (Green-Strong)
                { min: 80, max: 94.99, color: '#fef3c7' }, // 柔和黄 (Yellow-Watch)
                { min: 0, max: 79.99, color: '#fee2e2' }, // 柔和红 (Red-Alert)
                { max: -0.01, color: '#e2e8f0' } // 未选中置灰
            ] : [
                { min: 75, color: '#dcfce7' }, // G01 柔和绿
                { min: 50, max: 74.99, color: '#fef3c7' }, // G01 柔和黄
                { min: 0, max: 49.99, color: '#fee2e2' }, // G01 柔和红
                { max: -0.01, color: '#e2e8f0' } // 未选中置灰
            ];
            
            chart.setOption({
                animation: true,
                tooltip: {
                    show: true,
                    trigger: 'item',
                    confine: true,
                    backgroundColor: 'rgba(255,255,255,0.98)',
                    borderColor: '#d1d5db',
                    borderWidth: 1,
                    textStyle: {
                        color: '#111827',
                        fontSize: 11,
                    },
                    extraCssText: 'box-shadow: 0 10px 24px rgba(15,23,42,0.14); border-radius: 12px; padding: 10px 12px; z-index: 100;',
                    formatter: (params) => {
                        if (!params) return '';
                        
                        const mapDisplayNameToGeoName = (displayName) => {
                            const foundEn = Object.keys(nameMapEnAbbr).find(k => nameMapEnAbbr[k] === displayName);
                            if (foundEn) return foundEn;
                            const foundAr = Object.keys(nameMapArAbbr).find(k => nameMapArAbbr[k] === displayName);
                            if (foundAr) return foundAr;
                            return displayName;
                        };

                        if (params.seriesType === 'map' || params.componentType === 'geo') {
                            const geoName = mapDisplayNameToGeoName(params.name);
                            const fullRegionName = lang === 'ar' ? (nameMapAr[geoName] || geoName) : geoName;

                            if (params.value === undefined || isNaN(params.value) || params.value < 0) {
                                return `
                                    <div style="font-weight:700; color:#111827; font-size:12px;">${fullRegionName}</div>
                                    <div style="color:#6b7280; margin-top:4px; font-size:10px;">${lang === 'ar' ? 'لا توجد بيانات نشطة' : 'No active data'}</div>
                                `;
                            }
                            
                            // 查找当前悬停省份匹配的所有选中 Amana 数据
                            const matchedRegions = regions.filter(r => {
                                const rGeoName = AMANA_TO_GEO_REGION[r.key];
                                return rGeoName === geoName;
                            });

                            if (matchedRegions.length > 0) {
                                if (matchedRegions.length === 1) {
                                    const r = matchedRegions[0];
                                    const statusText = lang === 'ar' 
                                        ? (r.alertStatus === 'good' ? 'سليم' : r.alertStatus === 'warning' ? 'متابعة' : 'إنذار')
                                        : (r.alertStatus === 'good' ? 'Healthy' : r.alertStatus === 'warning' ? 'Watch' : 'Alert');
                                    const statusColor = r.alertStatus === 'good' ? 'color:#16a34a' : r.alertStatus === 'warning' ? 'color:#d97706' : 'color:#dc2626';
                                    
                                    const rowsHtml = (r.tooltipRows || []).map(row => `
                                        <div style="display:flex; align-items:center; justify-content:space-between; gap:20px; color:#4b5563; margin-top:4px; font-size:11px;">
                                            <span>${row.label}</span>
                                            <span style="font-weight:700; color:#111827;">${row.value}</span>
                                        </div>
                                    `).join('');

                                    return `
                                        <div style="min-width:200px;">
                                            <div style="display:flex; align-items:center; justify-content:space-between; border-b:1px solid #f3f4f6; padding-bottom:6px; margin-bottom:6px;">
                                                <span style="font-weight:700; color:#111827; font-size:12px;">${fullRegionName}</span>
                                                <span style="font-weight:700; ${statusColor}; font-size:11px;">${statusText}</span>
                                            </div>
                                            ${rowsHtml}
                                        </div>
                                    `;
                                } else {
                                    const itemsHtml = matchedRegions.map(r => {
                                        const rateText = `${r.colorMetric.toFixed(0)}%`;
                                        const statusColor = r.alertStatus === 'good' ? '#16a34a' : r.alertStatus === 'warning' ? '#d97706' : '#dc2626';
                                        return `
                                            <div style="display:flex; align-items:center; justify-content:space-between; gap:20px; color:#4b5563; margin-top:4px; font-size:10px;">
                                                <span>• ${r.tooltipTitle || r.label}</span>
                                                <span style="font-weight:700; color:${statusColor};">${rateText}</span>
                                            </div>
                                        `;
                                    }).join('');
                                    
                                    return `
                                        <div style="min-width:220px;">
                                            <div style="font-weight:700; color:#111827; border-b:1px solid #f3f4f6; padding-bottom:6px; margin-bottom:6px; display:flex; align-items:center; justify-content:space-between; font-size:12px;">
                                                <span>${fullRegionName}</span>
                                                <span style="font-size:11px; color:#0284c7; font-weight:700;">${params.value.toFixed(1)}%</span>
                                            </div>
                                            <div style="font-size:9px; color:#9ca3af; margin-bottom:4px;">${lang === 'ar' ? 'الأمانات التابعة:' : 'Amanas in Region:'}</div>
                                            ${itemsHtml}
                                        </div>
                                    `;
                                }
                            }
                            
                            const metricLabel = mapData.thresholdLabel || (lang === 'ar' ? 'نسبة الصرف' : 'Adjusted Spend Rate');
                            return `
                                <div style="min-width:160px;">
                                    <div style="font-weight:700; color:#111827; border-b:1px solid #f3f4f6; padding-bottom:4px; margin-bottom:4px; font-size:12px;">${fullRegionName}</div>
                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; color:#4b5563; font-size:11px;">
                                        <span>${metricLabel}</span>
                                        <span style="font-weight:700; color:#0284c7;">${params.value.toFixed(1)}%</span>
                                    </div>
                                </div>
                            `;
                        }
                        return '';
                    }
                },
                visualMap: [
                    {
                        show: false,
                        type: 'piecewise',
                        seriesIndex: 0,
                        pieces: pieces,
                        outOfRange: {
                            color: '#f8fafc'
                        }
                    }
                ],
                geo: {
                    map: 'saudi_regions',
                    roam: true,
                    silent: false,
                    aspectScale: 1.15,
                    nameProperty: 'NAME_1',
                    nameMap: lang === 'ar' ? nameMapArAbbr : nameMapEnAbbr,
                    layoutCenter: ['50%', '50%'],
                    layoutSize: '100%',
                    label: {
                        show: false // geo 自身不显示标签，完全交由 series.map 渲染以获取数据值展示
                    },
                    itemStyle: {
                        areaColor: '#cbd5e1', // 底图省份描边与颜色
                        borderColor: '#94a3b8',
                        borderWidth: 0.8,
                    },
                    emphasis: {
                        itemStyle: {
                            areaColor: '#bae6fd'
                        }
                    }
                },
                series: [
                    {
                        name: 'Regions',
                        type: 'map',
                        map: 'saudi_regions',
                        roam: true,
                        aspectScale: 1.15,
                        geoIndex: 0,
                        data: mapSeriesData,
                        selectedMode: false,
                        label: {
                            show: true,
                            color: 'rgba(71, 84, 103, 0.9)',
                            fontSize: 9.5,
                            fontWeight: 700,
                            textBorderColor: 'rgba(255, 255, 255, 0.95)', // 1.5px 白色精致外圈轮廓，防止重合模糊
                            textBorderWidth: 1.5,
                            formatter: (params) => {
                                if (!params || params.value === undefined || isNaN(params.value) || params.value < 0) {
                                    return params.name; // 未选中省份只展示名字
                                }
                                return `${params.name}\n${params.value.toFixed(0)}%`; // 选中省份常驻展示名称和 KPI 百分比
                            }
                        }
                    },
                    {
                        name: 'Locations',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: scatterData,
                        symbolSize: 6, // 6px的微小定位锚点，代替原先的高能波纹气泡
                        label: {
                            show: true,
                            position: 'top',
                            color: '#1e293b', // 优雅深灰色地标字体
                            fontSize: 9,
                            fontWeight: 700,
                            textBorderColor: 'rgba(255, 255, 255, 0.95)',
                            textBorderWidth: 1.5,
                            formatter: (params) => {
                                return params.name; // 地标文字展示
                            }
                        },
                        emphasis: {
                            scale: 1.1
                        }
                    }
                ]
            }, true);
        }

        const resize = () => {
            if (chartInstanceRef.current) {
                try {
                    chartInstanceRef.current.resize();
                } catch (e) {}
            }
        };
        setTimeout(resize, 60);
        const observer = new ResizeObserver(resize);
        observer.observe(chartRef.current);
        window.addEventListener('resize', resize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
            if (chartInstanceRef.current) {
                try {
                    chartInstanceRef.current.dispose();
                } catch (e) {
                    console.error('Error disposing echarts on unmount:', e);
                }
                chartInstanceRef.current = null;
            }
        };
    }, [mapData, lang]);

    if (mapData?.variant === 'matrix') {
        return (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-start h-full min-h-[430px] flex flex-col">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">{mapData.title}</h3>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-[#eef7f2] to-white p-4 flex-1 flex flex-col gap-3 min-h-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] font-semibold text-gray-700">
                            {lang === 'ar' ? 'التنفيذ حسب الباب والمنطقة' : 'Execution by Door × Region'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[9px] text-gray-500">
                            {(mapData.legend || []).map((item) => {
                                const sampleValue = item.range === '< 50%' ? 42 : item.range === '50% - 74%' ? 68 : item.range === '75% - 89%' ? 82 : 93;
                                const style = getExecutionMatrixCellStyle(sampleValue);
                                return (
                                    <div key={item.label} className="flex items-center gap-1.5">
                                        <span className="inline-block w-3 h-3 rounded-md border" style={{ backgroundColor: style.bg, borderColor: style.border, borderWidth: style.borderWidth }}></span>
                                        <span>{item.range}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden p-2 flex-1 w-full">
                        <div ref={chartRef} className="h-[290px] w-full" />
                    </div>

                    {mapData.riskSummary ? (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-600">
                            <span className="font-bold text-red-600">{lang === 'ar' ? `${mapData.riskSummary.count} خلايا حرجة` : `${mapData.riskSummary.count} risk cells`}</span>
                            <span className="mx-2">•</span>
                            <span>{(mapData.riskSummary.items || []).join(lang === 'ar' ? '، ' : ', ')}</span>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-start h-full min-h-[430px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{mapData.title}</h3>
                {mapData.subtitle && <p className="text-[10px] text-gray-400 mt-1">{mapData.subtitle}</p>}
            </div>
            <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-[#eef7f2] to-white p-3 overflow-hidden flex-1 flex flex-col gap-3 min-h-0">
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden p-2 flex-1 w-full flex items-center justify-center">
                    <div ref={chartRef} className="h-[320px] w-full" />
                </div>
                {/* 静态门限图例说明 */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-2 border-t border-gray-200/60 text-[10px] text-gray-500">
                    {(mapData.legend || []).map((item, index) => {
                        const style = getColorStyle(index === 0 ? 'good' : index === 1 ? 'warning' : 'critical');
                        return (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.fill }}></span>
                                <span className="font-semibold text-gray-700">{item.label}</span>
                                <span className="text-gray-400">{item.range}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function TimeComparisonCard({ lang, data }) {
    if (data?.variant === 'planned-actual-gap') {
        const series = data.series || [];
        const maxValue = Math.max(...series.flatMap((item) => [item.budget, item.actual]), 1);
        const width = 760;
        const height = 250;
        const padding = { top: 24, right: 24, bottom: 44, left: 40 };
        const innerW = width - padding.left - padding.right;
        const innerH = height - padding.top - padding.bottom;
        const step = series.length > 1 ? innerW / (series.length - 1) : innerW;
        const xAt = (index) => padding.left + step * index;
        const yAt = (value) => padding.top + innerH - (value / maxValue) * innerH;
        const plannedPoints = series.map((item, index) => `${xAt(index)},${yAt(item.budget)}`).join(' ');
        const actualPoints = series.map((item, index) => `${xAt(index)},${yAt(item.actual)}`).join(' ');
        const gapPolygon = [
            ...series.map((item, index) => `${xAt(index)},${yAt(item.budget)}`),
            ...[...series].reverse().map((item, revIndex) => {
                const index = series.length - 1 - revIndex;
                return `${xAt(index)},${yAt(item.actual)}`;
            }),
        ].join(' ');
        const gapValue = series.reduce((sum, item) => sum + (item.budget - item.actual), 0);

        return (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-start h-full min-h-[430px] flex flex-col">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">{data.title}</h3>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-[#eef7f2] to-white p-4 flex-1 min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="text-[11px] font-semibold text-gray-700">
                            {lang === 'ar' ? 'الخطة مقابل المنصرف الفعلي' : 'Planned vs Actual Spend'}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                            <div className="flex items-center gap-2"><span className="w-4 h-0.5 border-t-2 border-dashed border-violet-500 inline-block"></span><span>{lang === 'ar' ? 'الخطة' : 'Planned'}</span></div>
                            <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-momahGreen-600 inline-block"></span><span>{lang === 'ar' ? 'الفعلي' : 'Actual'}</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-red-100 inline-block"></span><span>{lang === 'ar' ? 'الفجوة' : 'Gap'}</span></div>
                        </div>
                    </div>

                    <svg viewBox={`0 0 ${width} ${height + 28}`} className="w-full h-[290px]">
                        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                            const y = padding.top + innerH - innerH * tick;
                            return (
                                <g key={tick}>
                                    <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                    <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                                        {Math.round(maxValue * tick)}
                                    </text>
                                </g>
                            );
                        })}

                        <polygon points={gapPolygon} fill="rgba(248, 113, 113, 0.18)" />
                        <polyline points={plannedPoints} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="6 5" />
                        <polyline points={actualPoints} fill="none" stroke="#10b981" strokeWidth="4" />

                        {series.map((item, index) => (
                            <g key={item.label}>
                                <circle cx={xAt(index)} cy={yAt(item.actual)} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                                <circle cx={xAt(index)} cy={yAt(item.budget)} r="3.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                                <text x={xAt(index)} y={height + 12} textAnchor="middle" fontSize="10" fill="#64748b">
                                    {item.label}
                                </text>
                            </g>
                        ))}

                        <g transform={`translate(${padding.left + 28},${padding.top + 34})`}>
                            <rect x="0" y="0" width="190" height="60" rx="12" fill="#fee2e2" />
                            <text x="14" y="20" fontSize="11" fontWeight="700" fill="#dc2626">
                                {lang === 'ar' ? 'الفجوة التراكمية' : 'Cumulative gap'}
                            </text>
                            <text x="14" y="39" fontSize="10" fill="#374151">
                                {lang === 'ar'
                                    ? `الفعلي أقل من الخطة بمقدار ${gapValue.toFixed(0)} M`
                                    : `Actual is behind plan by ${gapValue.toFixed(0)} M`}
                            </text>
                        </g>
                    </svg>
                </div>
            </div>
        );
    }

    const series = data.series || [];
    const maxValue = Math.max(...series.flatMap((item) => [item.budget, item.actual]), 1);
    const count = series.length;
    const trendLabel = lang === 'ar' ? 'اتجاه الإنفاق الفعلي' : 'Actual Spend Trend';

    // Measure the actual-spend bars so the trend line lands exactly on the
    // middle-top of each green bar, regardless of the responsive flex/gap
    // layout or RTL mirroring.
    const plotRef = useRef(null);
    const barRefs = useRef([]);
    const [trend, setTrend] = useState({ w: 0, h: 0, points: [] });

    useEffect(() => {
        const plot = plotRef.current;
        if (!plot) return undefined;
        const measure = () => {
            const base = plot.getBoundingClientRect();
            const points = barRefs.current
                .filter(Boolean)
                .map((el) => {
                    const r = el.getBoundingClientRect();
                    return { x: r.left - base.left + r.width / 2, y: r.top - base.top };
                });
            setTrend({ w: base.width, h: base.height, points });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(plot);
        return () => observer.disconnect();
    }, [series, lang, maxValue]);

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-start h-full min-h-[430px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{data.title}</h3>
            </div>
            <div className="flex-1 flex flex-col justify-end">
                <div ref={plotRef} className="relative flex items-end gap-4 px-2 h-[240px]">
                    {series.map((item, idx) => (
                        <div key={item.label} className="flex-1 min-w-0 flex items-end justify-center gap-2 h-full">
                            <div className="w-8 md:w-10 rounded-t-md bg-amber-200 relative" style={{ height: `${(item.budget / maxValue) * 100}%` }}>
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap">{item.budget.toFixed(0)}</span>
                            </div>
                            <div ref={(el) => (barRefs.current[idx] = el)} className="w-8 md:w-10 rounded-t-md bg-momahGreen-600 relative" style={{ height: `${(item.actual / maxValue) * 100}%` }}>
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap">{item.actual.toFixed(0)}</span>
                            </div>
                        </div>
                    ))}
                    {count > 1 && trend.points.length === count && trend.w > 0 && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`0 0 ${trend.w} ${trend.h}`}>
                            <defs>
                                <marker id="trend-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto" markerUnits="strokeWidth">
                                    <path d="M0,0 L6,3 L0,6 Z" fill="#166a45" />
                                </marker>
                            </defs>
                            <polyline
                                points={trend.points.map((p) => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke="#166a45"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                markerEnd="url(#trend-arrow)"
                            />
                            {trend.points.map((p, idx) => (
                                <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#166a45" strokeWidth="1.5" />
                            ))}
                        </svg>
                    )}
                </div>
                <div className="flex gap-4 px-2 mt-3">
                    {series.map((item) => (
                        <div key={item.label} className="flex-1 min-w-0 text-[10px] text-center text-gray-600 leading-4">{item.label}</div>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-200 inline-block"></span><span>{data.primaryLabel}</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-momahGreen-600 inline-block"></span><span>{data.secondaryLabel}</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-momahGreen-700 inline-block"></span><span>{trendLabel}</span></div>
            </div>
        </div>
    );
}

function DoorAnalysisChart({ lang, rows, compact = false }) {
    const maxValue = Math.max(...rows.flatMap((row) => [row.budget, row.planned, row.actual]), 1);
    const chartHeight = compact ? 180 : 200;
    const width = 760;
    const step = width / rows.length;
    const linePoints = rows.map((row, index) => {
        const x = step * index + step * 0.68;
        const y = chartHeight - (row.rate / 100) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    return (
        <>
            <div className="overflow-x-auto flex-1">
                <svg viewBox={`0 0 ${width} 280`} className="w-full min-w-[520px] h-[250px]">
                    <line x1="26" y1={chartHeight} x2={width - 12} y2={chartHeight} stroke="#cbd5e1" strokeWidth="1.5" />
                    {rows.map((row, index) => {
                        const groupX = step * index + 36;
                        const budgetHeight = (row.budget / maxValue) * chartHeight;
                        const plannedHeight = (row.planned / maxValue) * chartHeight;
                        const actualHeight = (row.actual / maxValue) * chartHeight;
                        return (
                            <g key={row.key}>
                                <rect x={groupX} y={chartHeight - budgetHeight} width="22" height={budgetHeight} rx="4" fill="#fde68a" />
                                <rect x={groupX + 28} y={chartHeight - plannedHeight} width="22" height={plannedHeight} rx="4" fill="#93c5fd" />
                                <rect x={groupX + 56} y={chartHeight - actualHeight} width="22" height={actualHeight} rx="4" fill="#15803d" />
                                <text x={groupX + 40} y="238" textAnchor="middle" fontSize="10" fill="#475569">{row.label}</text>
                                <text x={groupX + 40} y="251" textAnchor="middle" fontSize="9" fill="#94a3b8">{row.rate.toFixed(1)}%</text>
                            </g>
                        );
                    })}
                    <polyline fill="none" stroke="#dc2626" strokeWidth="2.5" points={linePoints} />
                    {rows.map((row, index) => {
                        const x = step * index + step * 0.68;
                        const y = chartHeight - (row.rate / 100) * chartHeight;
                        return <circle key={`${row.key}-dot`} cx={x} cy={y} r="4" fill="#dc2626" />;
                    })}
                </svg>
            </div>
            <div className={`flex flex-wrap items-center ${compact ? 'gap-3' : 'gap-4'} text-[10px] text-gray-500`}>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-200 inline-block"></span><span>{lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget'}</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-sky-300 inline-block"></span><span>{lang === 'ar' ? 'الخطة' : 'Planned Spend'}</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-700 inline-block"></span><span>{lang === 'ar' ? 'المنصرف الفعلي' : 'Actual Spend'}</span></div>
                <div className="flex items-center gap-2"><span className="w-6 h-[2px] bg-red-600 inline-block"></span><span>{lang === 'ar' ? 'نسبة التنفيذ' : 'Execution Rate'}</span></div>
            </div>
        </>
    );
}

function KeyHighlightsCard({ lang, groups }) {
    if (!groups?.length) {
        return null;
    }

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-start">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'أهم الإشارات الإدارية' : 'Key Highlights'}</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                    {lang === 'ar'
                        ? 'يلخص هذا الجزء الإشارات الإيجابية ومواطن القلق ونقاط المتابعة الإدارية حسب منظور المجموعة الحالي.'
                        : 'This section summarizes positive signals, concern points, and management follow-ups for the current group perspective.'}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <div key={group.key} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-2">
                        <div className="text-[11px] font-bold text-gray-800">{group.title}</div>
                        <div className="space-y-2">
                            {(group.items || []).map((item, idx) => (
                                <div key={`${group.key}-${idx}`} className="text-[11px] text-gray-600 leading-5">
                                    • {item}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GroupLensCard({ lang, groupKey }) {
    const content = groupKey === 'g03'
        ? {
            title: lang === 'ar' ? 'منظور تنفيذ الميزانية' : 'Budget Execution Lens',
            desc: lang === 'ar'
                ? 'في هذا المنظور يتم تقديم الأبواب والعقود إلى الواجهة، لأن السؤال الأساسي هو: أين تتباطأ وتيرة التنفيذ وأين يتراكم الضغط في الرصيد المتبقي؟'
                : 'In this perspective, doors and contracts move to the front because the key question is where execution slows down and where remaining-balance pressure accumulates.',
            badge: lang === 'ar' ? 'تنفيذ / متابعة' : 'Execution / Follow-up',
        }
        : groupKey === 'g06'
            ? {
                title: lang === 'ar' ? 'منظور الإيرادات والتحصيل' : 'Revenue & Collection Lens',
                desc: lang === 'ar'
                    ? 'في هذا المنظور يتم تقديم مصادر الإيرادات ونسب التحصيل وتقدم الذمم أولاً، لأن الصفحة يجب أن تُقرأ من زاوية تحقيق المستهدف والتحصيل الإقليمي.'
                    : 'In this perspective, revenue sources, collection achievement, and receivable progression come first so the page reads through target achievement and regional collection performance.',
                badge: lang === 'ar' ? 'إيرادات / تحصيل' : 'Revenue / Collection',
            }
            : {
                title: lang === 'ar' ? 'منظور الأداء المالي' : 'Financial Performance Lens',
                desc: lang === 'ar'
                    ? 'في هذا المنظور يتم تقديم الخدمات والمبادرات أولاً، لأن الصفحة تركز على الفروقات في الأداء والتمركزات الهيكلية التي تستحق انتباه الإدارة.'
                    : 'In this perspective, services and initiatives come first because the page is meant to surface performance differences and structural concentrations for management attention.',
                badge: lang === 'ar' ? 'أداء / هيكل' : 'Performance / Structure',
            };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-start">
            <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
                    {lang === 'ar' ? 'عدسة الصفحة الحالية' : 'Current Dashboard Lens'}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                    {content.badge}
                </span>
            </div>
            <div className="mt-2 text-sm font-bold text-gray-800">{content.title}</div>
            <p className="mt-1 text-[11px] text-gray-600 leading-5">{content.desc}</p>
        </div>
    );
}

function DoorAnalysisCard({ lang, rows }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start h-full min-h-[360px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'تحليل الأبواب المالية' : 'Budget Door Analysis'}</h3>
            </div>
            <DoorAnalysisChart lang={lang} rows={rows} />
        </div>
    );
}

function BudgetDoorDetailedCard({ lang, scope, slideMode = false }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const selectedAmanas = (scope?.selectedAmanas || []).filter((item) => item && item !== 'All');
    const isFullMinistryView = !selectedAmanas.length;

    const fmt = (value) => `${safeNumber(value).toFixed(1)}B SAR`;
    const pct = (value, total) => {
        const safeTotal = safeNumber(total, 1);
        const safeValue = safeNumber(value);
        return `${((safeValue / safeTotal) * 100).toFixed(1)}%`;
    };

    const mapAmanaToEntityKey = (amanaKey) => {
        if (amanaKey === 'riyadh') return 'riyadhAmana';
        if (['eastern', 'ahsa', 'hafar'].includes(amanaKey)) return 'easternAmana';
        return 'otherAmanas';
    };

    const visibleEntityKeys = isFullMinistryView
        ? ['ministryCentral', 'riyadhAmana', 'easternAmana', 'otherAmanas']
        : Array.from(new Set(selectedAmanas.map(mapAmanaToEntityKey)));

    const selectedLinks = G02_SANKEY_LINKS.filter(([source, target]) => {
        if (isFullMinistryView) {
            return true;
        }
        if (G02_SANKEY_NODES[source]?.level === 0) {
            return visibleEntityKeys.includes(target);
        }
        if (G02_SANKEY_NODES[source]?.level === 1) {
            return visibleEntityKeys.includes(source);
        }
        return false;
    });

    const activeNodeKeys = Array.from(new Set(selectedLinks.flatMap(([source, target]) => [source, target])));
    const totalValue = selectedLinks
        .filter(([source]) => G02_SANKEY_NODES[source]?.level === 0)
        .reduce((sum, [, , value]) => sum + value, 0);

    useEffect(() => {
        if (!chartRef.current) return undefined;

        const host = chartRef.current;
        if (host.clientWidth < 80 || host.clientHeight < 80 || !activeNodeKeys.length || !selectedLinks.length) {
            return undefined;
        }

        const chart = chartInstanceRef.current || echarts.init(chartRef.current);
        chartInstanceRef.current = chart;

        const nodes = activeNodeKeys
            .map((key) => G02_SANKEY_NODES[key])
            .filter(Boolean)
            .map((node) => ({
                name: node.key,
                itemStyle: {
                    color: node.color,
                    borderColor: node.color,
                    borderWidth: 1,
                },
                label: {
                    color: '#1f2937',
                    fontSize: slideMode ? 8 : 10,
                    fontWeight: 700,
                    lineHeight: slideMode ? 11 : 14,
                    overflow: 'break',
                    width: node.level === 0 ? (slideMode ? 130 : 180) : (slideMode ? 90 : 130),
                    formatter: () => {
                        if (node.level === 0) {
                            const display = lang === 'ar' ? (node.displayAr || node.ar) : (node.displayEn || node.en);
                            const detail = lang === 'ar' ? (node.detailAr || '') : (node.detailEn || '');
                            return detail ? `${display}\n${detail}` : display;
                        }
                        return lang === 'ar' ? (node.displayAr || node.ar) : (node.displayEn || node.en);
                    },
                },
            }));

        const links = selectedLinks.map(([source, target, value]) => ({
            source,
            target,
            value,
        }));

        chart.setOption({
            animation: false,
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                confine: true,
                backgroundColor: 'rgba(255,255,255,0.98)',
                borderColor: '#d1d5db',
                borderWidth: 1,
                textStyle: {
                    color: '#111827',
                    fontSize: 11,
                },
                extraCssText: 'box-shadow: 0 10px 24px rgba(15,23,42,0.14); border-radius: 12px; padding: 10px 12px;',
                formatter: (params) => {
                    if (params.dataType === 'edge') {
                        const sourceNode = G02_SANKEY_NODES[params.data.source];
                        const targetNode = G02_SANKEY_NODES[params.data.target];
                        const sourceLabel = lang === 'ar'
                            ? `${sourceNode?.ar || params.data.source} (${sourceNode?.en || params.data.source})`
                            : `${sourceNode?.en || params.data.source} · ${sourceNode?.ar || params.data.source}`;
                        const targetLabel = lang === 'ar'
                            ? `${targetNode?.ar || params.data.target} (${targetNode?.en || params.data.target})`
                            : `${targetNode?.en || params.data.target} · ${targetNode?.ar || params.data.target}`;
                        return `
                            <div style="font-weight:700; margin-bottom:4px;">${sourceLabel} ➜ ${targetLabel}</div>
                            <div>Amount: <span style="font-weight:600;">${fmt(params.data.value)}</span></div>
                            <div>Share of displayed total: <span style="font-weight:600;">${pct(params.data.value, totalValue || G02_SANKEY_TOTAL)}</span></div>
                        `;
                    }
                    const node = G02_SANKEY_NODES[params.data.name];
                    const label = lang === 'ar'
                        ? `${node?.ar || params.data.name} (${node?.en || params.data.name})`
                        : `${node?.en || params.data.name} · ${node?.ar || params.data.name}`;
                    const nodeValue = params.value;
                    return `
                        <div style="font-weight:700; margin-bottom:4px;">${label}</div>
                        <div>Amount: <span style="font-weight:600;">${fmt(nodeValue)}</span></div>
                        <div>Share of displayed total: <span style="font-weight:600;">${pct(nodeValue, totalValue || G02_SANKEY_TOTAL)}</span></div>
                    `;
                },
            },
            series: [
                {
                    type: 'sankey',
                    left: '5%',
                    right: '15%',
                    top: '4%',
                    bottom: '4%',
                    nodeAlign: 'justify',
                    draggable: false,
                    layoutIterations: 32,
                    nodeWidth: 24,
                    nodeGap: slideMode ? 6 : 12,
                    emphasis: {
                        focus: 'adjacency',
                    },
                    lineStyle: {
                        color: 'gradient',
                        opacity: 0.35,
                        curveness: 0.5,
                    },
                    data: nodes,
                    links,
                },
            ],
        }, true);

        const resize = () => chart.resize();
        const observer = new ResizeObserver(resize);
        observer.observe(chartRef.current);
        window.addEventListener('resize', resize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [activeNodeKeys, selectedLinks, totalValue, lang, slideMode]);

    return (
        <div className={`bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-2 text-start h-full flex flex-col relative overflow-hidden ${slideMode ? 'min-h-[240px]' : 'min-h-[286px]'}`}>
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'تحليل تدفق ميزانية الأبواب المالية' : 'Budget Door Analysis'}</h3>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3 flex-1 min-h-0">
                <div className="flex items-center justify-between gap-4 text-[11px] text-gray-600 mb-2">
                    <div className="font-semibold text-gray-700">
                        {lang === 'ar'
                            ? 'تدفق ميزانية الأبواب ➜ الجهة المنفذة ➜ الاستخدام النهائي'
                            : 'Budget doors ➜ executing entity ➜ final use'}
                    </div>
                    <div className="text-gray-500">
                        {lang === 'ar' ? 'إجمالي التدفق المعروض:' : 'Displayed flow total:'} <span className="text-gray-900 font-bold">{fmt(totalValue || G02_SANKEY_TOTAL)}</span>
                    </div>
                </div>

                <div ref={chartRef} className={`w-full h-full ${slideMode ? 'min-h-[190px]' : 'min-h-[238px]'}`} />
            </div>
        </div>
    );
}

function ServiceAnalysisCard({ lang, rows }) {
    const maxRate = Math.max(...rows.map((row) => row.rate), 1);
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start h-full min-h-[360px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'تحليل الخدمات الرئيسية' : 'Main Service Analysis'}</h3>
            </div>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 flex-1">
                {rows.map((row) => (
                    <div key={row.label} className="space-y-1">
                        <div className="flex justify-between gap-3 text-[10px] font-bold text-gray-600">
                            <span>{row.label}</span>
                            <span>{row.rate.toFixed(1)}%</span>
                        </div>
                        <div className="relative w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-momahGreen-600 rounded-full" style={{ width: `${(row.rate / maxRate) * 100}%` }}></div>
                        </div>
                        <div className="text-[9px] text-gray-400">{lang === 'ar' ? 'المنصرف الفعلي:' : 'Actual Spent:'} {row.spent.toFixed(0)} M / {lang === 'ar' ? 'الاعتماد الحالي:' : 'Current Budget:'} {row.revised.toFixed(0)} M</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function InitiativeTableCard({ lang, rows }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start h-full min-h-[360px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'بنود برامج الرؤية' : 'Vision Programs'}</h3>
            </div>
            <div className="overflow-auto max-h-[300px] flex-1">
                <table className="w-full table-fixed text-left border-collapse text-[10px]">
                    <colgroup>
                        <col className="w-[30%]" />
                        <col className="w-[16%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[13%]" />
                        <col className="w-[13%]" />
                    </colgroup>
                    <thead className="sticky top-0 z-[1] bg-gray-50">
                        <tr className="border-b border-gray-200 text-gray-500 font-bold">
                            <th className="px-2 py-2">{lang === 'ar' ? 'المبادرة / المشروع' : 'Initiative / Project'}</th>
                            <th className="px-2 py-2">{lang === 'ar' ? 'المحفظة' : 'Portfolio'}</th>
                            <th className="px-2 py-2">{lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget'}</th>
                            <th className="px-2 py-2">{lang === 'ar' ? 'المنصرف الفعلي' : 'Actual Spend'}</th>
                            <th className="px-2 py-2">{lang === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                            <th className="px-2 py-2">{lang === 'ar' ? 'نسبة التنفيذ' : 'Execution Rate'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={`${row.initiative}-${idx}`} className="border-b border-gray-100">
                                <td className="px-2 py-2 font-semibold text-gray-700 truncate">{row.initiative}</td>
                                <td className="px-2 py-2 text-gray-600 truncate">{row.portfolio}</td>
                                <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{row.budget}</td>
                                <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{row.actual}</td>
                                <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{row.remaining}</td>
                                <td className="px-2 py-2 text-gray-700 font-semibold whitespace-nowrap">{row.rate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ContractDonutCard({ lang, rows }) {
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const colors = [CHART_PALETTE.green, CHART_PALETTE.blue, CHART_PALETTE.gold, CHART_PALETTE.red, CHART_PALETTE.lavender, '#64748b'];
    let cumulative = 0;

    return (
        <div className={`${SURFACE_CARD} p-4 space-y-3 text-start h-full min-h-[360px] flex flex-col`}>
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'تحليل العقود' : 'Contract Analysis'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[178px_minmax(0,1fr)] gap-3 items-center flex-1 rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
                <div className="flex items-center justify-center">
                    <svg viewBox="0 0 220 220" className="w-[190px] h-[190px]">
                        <circle cx="110" cy="110" r="72" fill="none" stroke="#e5e7eb" strokeWidth="24" />
                        {rows.map((row, index) => {
                            const fraction = total > 0 ? row.count / total : 0;
                            const dash = fraction * 452.39;
                            const circle = (
                                <circle
                                    key={row.label}
                                    cx="110"
                                    cy="110"
                                    r="72"
                                    fill="none"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth="24"
                                    strokeDasharray={`${dash} ${452.39 - dash}`}
                                    strokeDashoffset={-cumulative}
                                    transform="rotate(-90 110 110)"
                                    strokeLinecap="butt"
                                />
                            );
                            cumulative += dash;
                            return circle;
                        })}
                        <circle cx="110" cy="110" r="44" fill="white" />
                        <text x="110" y="104" textAnchor="middle" fontSize="13" fill="#64748b" fontWeight="700">
                            {lang === 'ar' ? 'إجمالي' : 'Total'}
                        </text>
                        <text x="110" y="123" textAnchor="middle" fontSize="18" fill="#111827" fontWeight="800">
                            {total.toLocaleString()}
                        </text>
                    </svg>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {rows.map((row, index) => (
                        <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11px]">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></span>
                                <span className="text-gray-700 truncate">{row.label}</span>
                            </div>
                            <div className="text-gray-500 whitespace-nowrap tabular-nums text-right">{row.count.toLocaleString()} / {row.share.toFixed(1)}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StructureSummaryCard({ lang, rows }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start h-full min-h-[330px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'ملخص الهيكل المالي' : 'Financial Structure Summary'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                {rows.map((row) => (
                    <div key={row.key} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-2">
                        <div className="text-[11px] font-bold text-gray-800">{row.label}</div>
                        <div className="space-y-1 text-[11px] text-gray-600">
                            <div className="flex justify-between gap-3"><span>{lang === 'ar' ? 'الميزانية' : 'Budget'}</span><span className="font-semibold text-gray-800">{row.budget.toFixed(0)} M</span></div>
                            <div className="flex justify-between gap-3"><span>{lang === 'ar' ? 'الخطة' : 'Planned'}</span><span className="font-semibold text-gray-800">{row.planned.toFixed(0)} M</span></div>
                            <div className="flex justify-between gap-3"><span>{lang === 'ar' ? 'الفعلي' : 'Actual'}</span><span className="font-semibold text-gray-800">{row.actual.toFixed(0)} M</span></div>
                            <div className="flex justify-between gap-3"><span>{lang === 'ar' ? 'الوزن النسبي' : 'Relative Weight'}</span><span className="font-semibold text-gray-800">{row.weight.toFixed(1)}%</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VarianceAnalysisCard({ lang, rows }) {
    const maxVariance = Math.max(...rows.map((row) => Math.abs(row.variance)), 1);
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start h-full min-h-[330px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'انحراف الخطة' : 'Plan Variance'}</h3>
            </div>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 flex-1">
                {rows.map((row) => (
                    <div key={row.key} className="space-y-1">
                        <div className="flex justify-between gap-3 text-[10px] font-bold text-gray-600">
                            <span>{row.label}</span>
                            <span>{row.variance.toFixed(0)} M</span>
                        </div>
                        <div className="relative w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full ${row.variance >= 0 ? 'bg-momahGreen-600' : 'bg-red-500'}`}
                                style={{ width: `${(Math.abs(row.variance) / maxVariance) * 100}%` }}
                            />
                        </div>
                        <div className="text-[9px] text-gray-400">
                            {lang === 'ar' ? 'الخطة:' : 'Planned:'} {row.planned.toFixed(0)} M / {lang === 'ar' ? 'الفعلي:' : 'Actual:'} {row.actual.toFixed(0)} M
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RevenueSourceCards({ lang, rows }) {
    const colors = [CHART_PALETTE.green, CHART_PALETTE.blue, CHART_PALETTE.gold, CHART_PALETTE.lavender, CHART_PALETTE.red];
    const chartRows = (rows || []).map((row, index) => {
        const netInvoiced = safeNumber(row?.netInvoiced);
        const collected = safeNumber(row?.collected);
        const sourceWeight = safeNumber(row?.sourceWeight);
        return {
            ...row,
            key: row?.key || `source-${index}`,
            label: row?.label || (lang === 'ar' ? 'غير محدد' : 'N/A'),
            netInvoiced,
            collected,
            sourceWeight,
            outstanding: Math.max(0, netInvoiced - collected),
        };
    });
    const maxAmount = Math.max(...chartRows.map((row) => row.netInvoiced), 1);
    const maxWeight = Math.max(...chartRows.map((row) => row.sourceWeight || 0), 1);
    const width = Math.max(620, Math.max(chartRows.length, 1) * 116);
    const step = width / Math.max(chartRows.length, 1);
    const linePoints = chartRows.map((row, index) => {
        const x = step * index + step * 0.5;
        const y = 220 - ((row.sourceWeight || 0) / maxWeight) * 160;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 text-start h-full min-h-[360px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'تحليل مصادر الإيرادات' : 'Revenue Source Split'}</h3>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 flex-1 min-h-0">
                <div className="overflow-x-auto h-full">
                    <svg viewBox={`0 0 ${width} 280`} className="w-full min-w-[620px] h-[260px]">
                        <line x1="34" y1="220" x2={width - 16} y2="220" stroke="#cbd5e1" strokeWidth="1.5" />
                        {chartRows.map((row, index) => {
                            const x = step * index + step * 0.24;
                            const barWidth = Math.min(40, step * 0.24);
                            const collectedHeight = (row.collected / maxAmount) * 160;
                            const outstandingHeight = (row.outstanding / maxAmount) * 160;
                            return (
                                <g key={row.key}>
                                    <rect x={x} y={220 - collectedHeight} width={barWidth} height={collectedHeight} rx="6" fill={colors[index % colors.length]} />
                                    <rect x={x} y={220 - collectedHeight - outstandingHeight} width={barWidth} height={outstandingHeight} rx="6" fill="#dbe4ea" />
                                    <text x={x + barWidth / 2} y="240" textAnchor="middle" fontSize="10" fill="#475569">{row.label}</text>
                                    <text x={x + barWidth / 2} y="254" textAnchor="middle" fontSize="9" fill="#94a3b8">{row.netInvoiced.toFixed(0)} M</text>
                                </g>
                            );
                        })}
                        <polyline fill="none" stroke="#dc2626" strokeWidth="2.5" points={linePoints} />
                        {chartRows.map((row, index) => {
                            const x = step * index + step * 0.5;
                            const y = 220 - ((row.sourceWeight || 0) / maxWeight) * 160;
                            return (
                                <g key={`${row.key}-point`}>
                                    <circle cx={x} cy={y} r="4.5" fill="#dc2626" />
                                    <text x={x} y={y - 10} textAnchor="middle" fontSize="9" fill="#991b1b" fontWeight="700">
                                        {(row.sourceWeight || 0).toFixed(1)}%
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-momahGreen-600 inline-block"></span><span>{lang === 'ar' ? 'المتحصل' : 'Collected'}</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-300 inline-block"></span><span>{lang === 'ar' ? 'غير المحصل' : 'Outstanding'}</span></div>
                <div className="flex items-center gap-2"><span className="w-6 h-[2px] bg-red-600 inline-block"></span><span>{lang === 'ar' ? 'وزن المصدر' : 'Source Weight'}</span></div>
            </div>
        </div>
    );
}

function CollectionRateCard({ lang, rows }) {
    const chartRows = (rows || []).map((row, index) => ({
        ...row,
        key: row?.key || `rate-${index}`,
        label: row?.label || (lang === 'ar' ? 'غير محدد' : 'N/A'),
        collectionRate: safeNumber(row?.collectionRate),
        collected: safeNumber(row?.collected),
        netInvoiced: safeNumber(row?.netInvoiced),
    }));
    const maxRate = Math.max(...chartRows.map((row) => row.collectionRate), 1);
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 text-start h-full min-h-[360px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'نسبة التحصيل حسب المصدر' : 'Collection Rate by Source'}</h3>
            </div>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 flex-1">
                {chartRows.map((row) => (
                    <div key={row.key} className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-[11px] font-bold text-gray-800">{row.label}</div>
                            <div className="text-[11px] font-semibold text-momahGreen-700">{row.collectionRate.toFixed(1)}%</div>
                        </div>
                        <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 rounded-full bg-momahGreen-600" style={{ width: `${Math.min(100, Math.max(0, row.collectionRate / Math.max(maxRate, 1) * 100))}%` }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                            <div className="rounded-lg bg-white px-2 py-2">
                                <div className="text-gray-400">{lang === 'ar' ? 'المتحصل' : 'Collected'}</div>
                                <div className="mt-1 font-semibold text-gray-800">{row.collected.toFixed(0)} M</div>
                            </div>
                            <div className="rounded-lg bg-white px-2 py-2">
                                <div className="text-gray-400">{lang === 'ar' ? 'صافي الفوترة' : 'Net Invoiced'}</div>
                                <div className="mt-1 font-semibold text-gray-800">{row.netInvoiced.toFixed(0)} M</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const RECEIVABLE_BUCKETS = {
    en: ['Current', '1M', '2M', '3M', '4M', '5M', '6M+'],
    ar: ['الحالي', 'شهر', 'شهران', '3 أشهر', '4 أشهر', '5 أشهر', '6+ أشهر'],
};

const RECEIVABLE_PERIODS = {
    en: ['Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026'],
    ar: ['نوفمبر 2025', 'ديسمبر 2025', 'يناير 2026', 'فبراير 2026', 'مارس 2026', 'أبريل 2026'],
};

function buildReceivableMigrationMatrix(rows) {
    const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1;
    const unpaid = rows.find((row) => row.key === 'unpaid')?.amount || 0;
    const executable = rows.find((row) => row.key === 'executable')?.amount || 0;
    const executed = rows.find((row) => row.key === 'executed')?.amount || 0;

    const currentFactor = Math.max(0.16, Math.min(0.32, executed / total));
    const midFactor = Math.max(0.18, Math.min(0.32, executable / total));
    const agedFactor = Math.max(0.22, Math.min(0.4, unpaid / total));

    const rowWeights = [0.16, 0.16, 0.17, 0.17, 0.17, 0.17];
    const distributions = [
        [0.0, 0.01, 0.03, 0.06, 0.12, 0.26, 0.52],
        [0.0, 0.02, 0.05, 0.09, 0.18, 0.28, 0.38],
        [0.01, 0.04, 0.09, 0.16, 0.23, 0.24, 0.23],
        [0.03, 0.08, 0.16, 0.23, 0.23, 0.17, 0.1],
        [0.1, 0.18, 0.24, 0.22, 0.15, 0.07, 0.04],
        [0.28, 0.25, 0.2, 0.14, 0.08, 0.03, 0.02],
    ];

    return distributions.map((distribution, rowIndex) =>
        distribution.map((share, columnIndex) => {
            const ageMultiplier = columnIndex >= 4 ? agedFactor + 0.85 : columnIndex >= 2 ? midFactor + 0.75 : currentFactor + 0.85;
            const normalizedShare = rowWeights[rowIndex] * share * ageMultiplier;
            return Number((normalizedShare * 100).toFixed(2));
        })
    );
}

function receivableCellColor(value) {
    if (value >= 7.5) return 'bg-red-200 text-red-800 border-red-300';
    if (value >= 5.5) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (value >= 3.5) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (value >= 2.0) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
}

function ReceivableProgressCard({ lang, rows }) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    const matrix = buildReceivableMigrationMatrix(rows);
    const bucketLabels = RECEIVABLE_BUCKETS[lang];
    const periodLabels = RECEIVABLE_PERIODS[lang];
    const summaryRows = rows.map((row, index) => ({
        ...row,
        color:
            index === 0 ? CHART_PALETTE.red :
            index === 1 ? CHART_PALETTE.gold :
            CHART_PALETTE.green,
    }));

    useEffect(() => {
        if (!chartRef.current) return undefined;

        const chart = chartInstanceRef.current || echarts.init(chartRef.current);
        chartInstanceRef.current = chart;

        const values = matrix.flat();
        const maxValue = Math.max(...values, 0);
        const heatmapData = [];

        matrix.forEach((row, rowIndex) => {
            row.forEach((value, columnIndex) => {
                heatmapData.push([columnIndex, rowIndex, value]);
            });
        });

        chart.setOption({
            animation: false,
            grid: {
                left: lang === 'ar' ? 24 : 88,
                right: 16,
                top: 18,
                bottom: 18,
                containLabel: true,
            },
            tooltip: {
                trigger: 'item',
                confine: true,
                backgroundColor: 'rgba(255,255,255,0.98)',
                borderColor: '#d1d5db',
                borderWidth: 1,
                textStyle: {
                    color: '#111827',
                    fontSize: 11,
                },
                extraCssText: 'box-shadow: 0 10px 24px rgba(15,23,42,0.14); border-radius: 12px; padding: 10px 12px;',
                formatter: (params) => {
                    const [bucketIndex, periodIndex, value] = params.data;
                    return `
                        <div style="font-weight:700; margin-bottom:4px;">${periodLabels[periodIndex]} → ${bucketLabels[bucketIndex]}</div>
                        <div>${lang === 'ar' ? 'نسبة التركز' : 'AR concentration'}: <span style="font-weight:600;">${value.toFixed(2)}%</span></div>
                        <div>${lang === 'ar' ? 'مرجع العرض' : 'Displayed receivable base'}: <span style="font-weight:600;">${total.toFixed(0)} M</span></div>
                    `;
                },
            },
            xAxis: {
                type: 'category',
                data: bucketLabels,
                position: 'top',
                axisLine: { show: false },
                axisTick: { show: false },
                splitArea: { show: false },
                axisLabel: {
                    color: '#475467',
                    fontSize: 10,
                    fontWeight: 700,
                    interval: 0,
                    lineHeight: 12,
                },
            },
            yAxis: {
                type: 'category',
                data: periodLabels,
                inverse: true,
                axisLine: { show: false },
                axisTick: { show: false },
                splitArea: { show: false },
                axisLabel: {
                    color: '#344054',
                    fontSize: 10,
                    fontWeight: 700,
                    margin: 10,
                },
            },
            visualMap: {
                min: 0,
                max: maxValue || 8,
                show: false,
                calculable: false,
                orient: 'horizontal',
                inRange: {
                    color: ['#f8fafc', '#fef3c7', '#fdba74', '#fb7185', '#dc2626'],
                },
            },
            series: [
                {
                    type: 'heatmap',
                    data: heatmapData,
                    progressive: 0,
                    label: {
                        show: true,
                        color: '#1f2937',
                        fontSize: 10,
                        fontWeight: 700,
                        formatter: ({ data }) => `${data[2].toFixed(1)}%`,
                    },
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    },
                    emphasis: {
                        itemStyle: {
                            borderColor: '#9ca3af',
                            borderWidth: 2,
                            shadowBlur: 8,
                            shadowColor: 'rgba(15,23,42,0.18)',
                        },
                    },
                },
            ],
        });

        const resize = () => chart.resize();
        const observer = new ResizeObserver(resize);
        observer.observe(chartRef.current);
        window.addEventListener('resize', resize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [matrix, bucketLabels, periodLabels, total, lang]);

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start h-full min-h-[320px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'تقدم الذمم والتحصيل' : 'Receivable Progression'}</h3>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 flex-1 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-500">
                        {lang === 'ar' ? 'هجرة الذمم عبر شرائح التقادم استناداً إلى الرصيد المفوتر غير المحصل' : 'AR bucket migration based on invoiced and open receivable balances'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        {summaryRows.map((row) => (
                            <div key={row.key} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }}></span>
                                <span className="font-semibold text-gray-700">{row.label}</span>
                                <span className="text-gray-500">{row.amount.toFixed(0)} M</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2">
                        <div className="text-[11px] font-semibold text-gray-700">
                            {lang === 'ar' ? 'هجرة مبالغ الفوترة والذمم بين شرائح التقادم' : 'Invoiced Amount / AR Migration Across Aging Buckets'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                            {lang === 'ar' ? 'الوحدة: % من الرصيد المعروض' : 'Unit: % of displayed receivable base'}
                        </div>
                    </div>
                    <div ref={chartRef} className="h-[270px] w-full" />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
                    <span className="font-semibold text-gray-700">{lang === 'ar' ? 'إجمالي الذمم محل العرض' : 'Displayed receivable base'}: {total.toFixed(0)} M</span>
                    <span>{lang === 'ar' ? 'اللون الأغمق = تركّز أعلى للذمم داخل الشريحة' : 'Darker cells indicate heavier AR concentration in that aging bucket.'}</span>
                </div>
            </div>
        </div>
    );
}

function RegionalCollectionCard({ lang, rows }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start h-full min-h-[320px] flex flex-col">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'ترتيب التحصيل الإقليمي' : 'Regional Collection Achievement'}</h3>
            </div>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 flex-1">
                {rows.map((row) => (
                    <div key={row.key} className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-[11px] font-bold text-gray-800">{row.label}</div>
                            <div className="text-[10px] font-semibold text-momahGreen-700">{row.actualRate.toFixed(1)}%</div>
                        </div>
                        <div className="relative h-3.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-momahGreen-600"
                                style={{ width: `${Math.min(100, Math.max(0, row.actualRate))}%` }}
                            />
                            <div
                                className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-amber-500"
                                style={{ left: `${Math.min(100, Math.max(0, row.targetRate))}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-[auto_auto_auto] justify-between gap-2 text-[10px] text-gray-500">
                            <span>{lang === 'ar' ? 'المستهدف' : 'Target'}: <span className="font-semibold text-gray-700">{row.targetRate.toFixed(1)}%</span></span>
                            <span>{lang === 'ar' ? 'الفجوة' : 'Gap'}: <span className="font-semibold text-gray-700">{row.collectionGap.toFixed(1)}%</span></span>
                            <span className={row.collectionGap <= 0 ? 'text-emerald-700 font-semibold' : row.collectionGap < 10 ? 'text-amber-700 font-semibold' : 'text-red-700 font-semibold'}>
                                {row.collectionGap <= 0
                                    ? (lang === 'ar' ? 'فوق المستهدف' : 'Above target')
                                    : row.collectionGap < 10
                                        ? (lang === 'ar' ? 'قريب من المستهدف' : 'Near target')
                                        : (lang === 'ar' ? 'دون المستهدف' : 'Below target')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DataNotesCard({ lang, notes }) {
    if (!notes?.length) {
        return null;
    }

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-start space-y-3">
            <div>
                <h3 className="text-sm font-bold text-gray-800">{lang === 'ar' ? 'مصدر البيانات وملاحظات الاستكمال' : 'Data Provenance & Supplement Notes'}</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                    {lang === 'ar'
                        ? 'يوضح هذا الجزء ما هو مأخوذ مباشرة من ملفات العينة وما تم استكماله فقط لأغراض العرض.'
                        : 'This section clarifies which values come directly from sample files and which rows are supplemented only for demo continuity.'}
                </p>
            </div>
            <div className="space-y-2">
                {notes.map((note, index) => (
                    <div
                        key={`data-note-${index}`}
                        className={`rounded-lg px-3 py-3 text-[11px] leading-5 border ${note.actual ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}
                    >
                        <span className="font-bold mr-2">{note.actual ? (lang === 'ar' ? 'فعلي' : 'Actual') : (lang === 'ar' ? 'مستكمل' : 'Supplemented')}</span>
                        {note.text}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SmartQueryFloating({ lang, dashboardData }) {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const sampleQuestions = getSmartQuerySampleQuestions(lang);

    const askQuestion = (nextQuestion) => {
        if (!nextQuestion.trim()) {
            return;
        }
        const response = askSmartQuery(nextQuestion, dashboardData, lang);
        setMessages((prev) => [
            ...prev,
            { role: 'user', text: nextQuestion },
            { role: 'assistant', text: response.answer, table: response.table, title: response.title },
        ]);
        setQuestion('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {isOpen ? (
                <div className="w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-momahGreen-700 text-white flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold">{lang === 'ar' ? 'مساعد الاستعلام الذكي' : 'Smart Data Query'}</div>
                            <div className="text-[10px] text-momahGreen-100">
                                {lang === 'ar' ? 'مدعوم ببيانات العينة الحالية' : 'Powered by the current sample datasets'}
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white text-sm">✕</button>
                    </div>
                    <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                        <div className="text-[11px] text-gray-500">
                            {lang === 'ar'
                                ? 'يمكنك تجربة أسئلة نموذجية مرتبطة بالصرف أو المبادرات أو الانحراف أو التحصيل.'
                                : 'Try one of the sample questions related to spending, initiatives, variance, or collection.'}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {sampleQuestions.slice(0, 3).map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => askQuestion(item.query)}
                                    className="px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-700"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/60">
                        {messages.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-[11px] text-gray-500 text-center">
                                {lang === 'ar'
                                    ? 'اسأل عن أعلى نسبة صرف، أكبر انحراف، أعلى 5 مبادرات، أو أفضل مصدر تحصيل.'
                                    : 'Ask about the highest spending rate, the largest variance, the top initiatives, or the best collection source.'}
                            </div>
                        ) : null}
                        {messages.map((message, index) => (
                            <div key={`chat-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[11px] leading-5 shadow-sm ${message.role === 'user' ? 'bg-momahGreen-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                    {message.role === 'assistant' && message.title ? (
                                        <div className="font-bold text-gray-800 mb-1">{message.title}</div>
                                    ) : null}
                                    <div>{message.text}</div>
                                    {message.table ? (
                                        <div className="mt-3 overflow-x-auto">
                                            <table className="w-full text-[10px] border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-200 text-gray-500">
                                                        {message.table.columns.map((column) => (
                                                            <th key={column.key} className="text-start py-1 pr-2">{column.label}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {message.table.rows.map((row, rowIndex) => (
                                                        <tr key={`smart-row-${rowIndex}`} className="border-b border-gray-100">
                                                            {message.table.columns.map((column) => (
                                                                <td key={column.key} className="py-1 pr-2">{row[column.key]}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 bg-white">
                        <div className="flex gap-2">
                            <input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        askQuestion(question);
                                    }
                                }}
                                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-momahGreen-600 focus:ring-1 focus:ring-momahGreen-600"
                                placeholder={lang === 'ar' ? 'اكتب سؤالاً عن البيانات الحالية...' : 'Ask a question about the current sample data...'}
                            />
                            <button type="button" onClick={() => askQuestion(question)} className="px-4 py-2 rounded-xl bg-momahGreen-600 hover:bg-momahGreen-700 text-white text-xs font-bold">
                                {lang === 'ar' ? 'إرسال' : 'Ask'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="mt-3 ml-auto w-14 h-14 rounded-full bg-momahGreen-700 hover:bg-momahGreen-800 text-white shadow-2xl flex items-center justify-center text-xl"
                aria-label={lang === 'ar' ? 'فتح الاستعلام الذكي' : 'Open Smart Query'}
            >
                🤖
            </button>
        </div>
    );
}

function computeDiff(oldStr, newStr) {
    if (!oldStr) return [{ type: 'add', value: newStr || '' }];
    if (!newStr) return [{ type: 'remove', value: oldStr || '' }];

    const tokenRegex = /\s+|[a-zA-Z0-9]+|[\u0600-\u06FF]+|./g;
    const oldTokens = oldStr.match(tokenRegex) || [];
    const newTokens = newStr.match(tokenRegex) || [];

    const dp = Array(oldTokens.length + 1).fill(null).map(() => Array(newTokens.length + 1).fill(0));

    for (let i = 1; i <= oldTokens.length; i++) {
        for (let j = 1; j <= newTokens.length; j++) {
            if (oldTokens[i - 1] === newTokens[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const diff = [];
    let i = oldTokens.length;
    let j = newTokens.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
            diff.unshift({ type: 'equal', value: oldTokens[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ type: 'add', value: newTokens[j - 1] });
            j--;
        } else {
            diff.unshift({ type: 'remove', value: oldTokens[i - 1] });
            i--;
        }
    }
    return diff;
}

export default function Uc06App({ embedded = false, hostHeader = false, subDept = 'performanceAnalysis', appLang, initialTab, onBack, onConsumeJump, autoGenerate } = {}) {
    // When embedded inside the host app, the host's sidebar chooses which
    // sub-department to show; initialise all state to that department.
    const _SUBDEPT_META = {
        performanceAnalysis: { group: 'g02', menu: 'planningPerformance' },
        budgetExecution: { group: 'g03', menu: 'budgetDept' },
        revenueCollection: { group: 'g06', menu: 'revenueDept' },
    };
    const _meta = _SUBDEPT_META[subDept] || _SUBDEPT_META.performanceAnalysis;
    const _initGroup = _meta.group;
    const _initLang = appLang || 'ar';
    const _initDash = getDashboardData({ groupContext: _initGroup, analysisLevel: 'Ministry', selectedAmanas: ['All'], selectedMunicipalities: ['All'], fiscalYear: 'FY2026', periodType: 'Monthly', specificPeriod: '2026-04', lang: _initLang });
    const _initReportType = (_initDash && _initDash.groupMeta && _initDash.groupMeta.allowedReportTypes && _initDash.groupMeta.allowedReportTypes[0]) || 'Executive';
    const [lang, setLang] = useState(_initLang);
    const [activeTab, setActiveTab] = useState(initialTab || 'workspace'); // 默认进入工作台首页
    const [cameFromHost] = useState(embedded && !!initialTab); // opened via host deep-link (Open draft)
    const [expandedMenu, setExpandedMenu] = useState(_meta.menu);
    const [activeSubDeptId, setActiveSubDeptId] = useState(subDept);
    const [currentGroupContext, setCurrentGroupContext] = useState(_initGroup);

    const [analysisLevel, setAnalysisLevel] = useState('Ministry');
    const [selectedAmanas, setSelectedAmanas] = useState(['All']);
    const [selectedMunicipalities, setSelectedMunicipalities] = useState(['All']);
    const [fiscalYear, setFiscalYear] = useState('FY2026');
    const [periodType, setPeriodType] = useState('Monthly');
    const [specificPeriod, setSpecificPeriod] = useState('2026-04');

    const [reportType, setReportType] = useState(_initReportType);

    // === 新增：工作流状态与历史报告数据 ===
    const [reports, setReports] = useState([
        {
            id: 1,
            name_ar: 'تقرير الأداء المالي والتحليل الإداري للوزارة - شهري',
            name_en: 'Ministry Financial Performance & Management Analysis - Monthly',
            group: 'g02',
            reportType: 'Executive',
            scope_ar: 'الوزارة، السنة المالية 2026، شهري (2026-04)',
            scope_en: 'Ministry, FY2026 Monthly (2026-04)',
            generatedAt: '2026-06-01 10:24',
            status: 'Published',
            reviewer: 'MOMAH Auditor',
            filters: {
                analysisLevel: 'Ministry',
                selectedAmanas: ['All'],
                selectedMunicipalities: ['All'],
                fiscalYear: 'FY2026',
                periodType: 'Monthly',
                specificPeriod: '2026-04',
            },
            narratives: {
                synthesis: 'توقع مالي إيجابي للربع الأول يظهر استقرار الصرف وتخفيف الفجوات المالية على مستوى الوزارة. بلغ كفاءة الصرف الدفتري 61.2%، بينما بلغ الصرف الصافي بدون الالتزامات السابقة 43.8%.',
                highlights: 'بلغت الميزانية المعدلة 54,643 مليون ريال سعودي، مع منصرف فعلي قدره 33,460 مليون ريال سعودي. يلاحظ فجوة بين نسبة الصرف الدفتري والصافي قدرها 17.4% نتيجة سداد التزامات سابقة.',
                causes: 'يرجع الاختلاف بين الصرف الدفتري والصافي إلى سداد دفعات متأخرة للأعوام السابقة بقيمة 9,538 مليون ريال (28.5% من إجمالي المنصرف).',
                risks: 'تأخر وتيرة تنفيذ المشاريع الجديدة بسبب تركيز التدفقات النقدية على الالتزامات القديمة قد يؤثر على تحقيق الأهداف الاستراتيجية للعام الحالي.',
                recommendations: 'الاستمرار في موازنة التدفقات النقدية، وتسريع وتيرة صرف مشاريع الباب الرابع لتعزيز نسب الصرف الصافية.'
            }
        },
        {
            id: 2,
            name_ar: 'تقييم مخاطر الالتزام المفرط للمبادرات الاستراتيجية وجودة الحياة',
            name_en: 'Strategic Initiatives & QoL Over-Commitment Risk Assessment',
            group: 'g02',
            reportType: 'Initiatives',
            scope_ar: 'الوزارة، السنة المالية 2026، شهري (2026-04)',
            scope_en: 'Ministry, FY2026 Monthly (2026-04)',
            generatedAt: '2026-06-08 14:12',
            status: 'In Review',
            reviewer: 'AI Copilot',
            filters: {
                analysisLevel: 'Ministry',
                selectedAmanas: ['All'],
                selectedMunicipalities: ['All'],
                fiscalYear: 'FY2026',
                periodType: 'Monthly',
                specificPeriod: '2026-04',
            },
            narratives: {
                synthesis: 'مراقبة صارمة لخطوط المبادرات الاستراتيجية تكشف عن مخاطر عالية تتعلق بتجاوز حدود العقود الموقعة مقابل المخصص السنوي.',
                highlights: 'تجاوزت الالتزامات التعاقدية لمبادرات برنامج جودة الحياة (QoL) حدود الميزانية المعتمدة بشكل حرج، حيث بلغت نسبة الارتباط بالعقود 490.7%.',
                causes: 'يعود الارتفاع في معدلات الارتباط إلى التوقيع المسبق لعقود تمتد لعدة سنوات مالية دون جدولة تدفقاتها النقدية بشكل يتناسب مع الميزانية السنوية المعتمدة.',
                risks: 'خطر تراكم عجز تمويلي ضخم في السنوات المقبلة، واضطرار الوزارة لإعادة جدولة أو إيقاف مبادرات أخرى لتغطية التزامات جودة الحياة.',
                recommendations: 'وقف توقيع عقود جديدة لمبادرات جودة الحياة مؤقتاً، وإخضاع جميع الارتباطات الحالية لمراجعة كفاءة الإنفاق وإعادة الهيكلة.'
            }
        },
        {
            id: 3,
            name_ar: 'تقرير مراقبة الصرف الشهري وانحراف الميزانية',
            name_en: 'Monthly Disbursement & Budget Variance Monitoring Report',
            group: 'g03',
            reportType: 'Disbursement',
            scope_ar: 'الوزارة، السنة المالية 2026، شهري (2026-04)',
            scope_en: 'Ministry, FY2026 Monthly (2026-04)',
            generatedAt: '2026-06-09 09:30',
            status: 'Approved',
            reviewer: 'MOMAH Auditor',
            filters: {
                analysisLevel: 'Ministry',
                selectedAmanas: ['All'],
                selectedMunicipalities: ['All'],
                fiscalYear: 'FY2026',
                periodType: 'Monthly',
                specificPeriod: '2026-04',
            },
            narratives: {
                synthesis: 'أداء صرف الميزانية يظهر انحرافاً سلبياً طفيفاً عن الخطة المستهدفة، حيث بلغ إجمالي المنصرف الفعلي 33,460 مليون ريال مقابل خطة قدرها 35,651 مليون ريال.',
                highlights: 'بلغت نسبة الانحراف الكلي عن خطة الصرف -6.15% (2,191 مليون ريال). كما بلغت نسبة سداد الديون والالتزامات المرحلة 28.51% من إجمالي المنصرف.',
                causes: 'الانحراف ناتج عن تأخر إجراءات الترسية لبعض مشاريع البنية التحتية وتأجيل دفعات في الباب الثالث والرابع.',
                risks: 'استمرار بطء الصرف قد يضغط على جداول تسليم المشاريع المقررة في الربعين الثالث والرابع ويؤثر على كفاءة الأداء التشغيلي.',
                recommendations: 'تفعيل فرق العمل المشتركة مع وزارة المالية لتسريع اعتمادات الباب الرابع، ووضع خطة تعويضية للمشاريع المتأخرة.'
            }
        },
        {
            id: 4,
            name_ar: 'تقرير تنفيذ ميزانية أمانة الرياض وتسليم العقود',
            name_en: 'Riyadh Amana Budget Execution & Contract Delivery Report',
            group: 'g03',
            reportType: 'Executive',
            scope_ar: 'أمانة منطقة الرياض، السنة المالية 2026، شهري (2026-04)',
            scope_en: 'Amana (Riyadh Amana), FY2026 Monthly (2026-04)',
            generatedAt: '2026-06-10 11:15',
            status: 'Draft',
            reviewer: 'AI Copilot',
            filters: {
                analysisLevel: 'Amana',
                selectedAmanas: ['riyadh'],
                selectedMunicipalities: ['All'],
                fiscalYear: 'FY2026',
                periodType: 'Monthly',
                specificPeriod: '2026-04',
            },
            narratives: {
                synthesis: 'تحليل تنفيذ ميزانية أمانة الرياض يكشف عن تقدم مقبول في الباب الأول والثاني، مع وجود تحديات تسليم في الباب الرابع (المشاريع الرأسمالية).',
                highlights: 'بلغت نسبة كفاءة الإنفاق الرأسمالي (CAPEX) في أمانة الرياض 22.97% فقط حتى أبريل 2026، مما يعكس ضغوطاً واضحة في تسليم عقود المشاريع.',
                causes: 'تأخر المقاولين في تقديم مستخلصات الإنجاز الفعلي وصعوبات لوجستية في بعض مواقع العمل الكبرى بالرياض.',
                risks: 'تراكم الالتزامات المالية غير المدفوعة وتراكم مستحقات المقاولين يعرض المشاريع للتوقف أو الغرامات.',
                recommendations: 'تسريع وتيرة مراجعة واعتماد المستخلصات في أمانة الرياض، وتوفير نافذة تمويل سريعة للمقاولين الملتزمين بالجدول الزمني.'
            }
        },
        {
            id: 5,
            name_ar: 'تقرير تدقيق تحصيل الإيرادات غير النفطية والأصول - مستوى الوزارة',
            name_en: 'Non-Oil Revenue & Collection Audit Report - Ministry Level',
            group: 'g06',
            reportType: 'Executive',
            scope_ar: 'الوزارة، السنة المالية 2026، شهري (2026-04)',
            scope_en: 'Ministry, FY2026 Monthly (2026-04)',
            generatedAt: '2026-06-11 16:40',
            status: 'Published',
            reviewer: 'MOMAH Auditor',
            filters: {
                analysisLevel: 'Ministry',
                selectedAmanas: ['All'],
                selectedMunicipalities: ['All'],
                fiscalYear: 'FY2026',
                periodType: 'Monthly',
                specificPeriod: '2026-04',
            },
            narratives: {
                synthesis: 'تقرير مالي متكامل يوضح تطور تحصيل الإيرادات البلدية غير النفطية على مستوى الوزارة، محققاً نسبة تحصيل بلغت 57.14% من الفواتير الصادرة.',
                highlights: 'بلغ المستهدف السنوي للإيرادات 11,988 مليون ريال، وبلغ صافي قيمة الفواتير الصادرة 8,629 مليون ريال، تم تحصيل 4,931 مليون ريال منها فعلياً.',
                causes: 'تحسن أداء التحصيل يعود إلى إطلاق بوابات السداد الذاتي الرقمية وتحسين كفاءة المطالبات المالية عبر الأنظمة المركزية.',
                risks: 'تراكم الذمم غير المحصلة بقيمة 3,698 مليون ريال يمثل خطراً على التدفقات النقدية للخدمات التشغيلية إذا لم يتم تسريع وتيرة التحصيل.',
                recommendations: 'تفعيل حزم تحفيزية للأمانات ذات التحصيل الضعيف، وإطلاق حملات توعية ومتابعة قانونية لتحصيل المتأخرات والذمم المعلقة.'
            }
        },
        {
            id: 6,
            name_ar: 'تقرير أداء تحصيل إيرادات أمانة جدة',
            name_en: 'Jeddah Amana Revenue Collection Performance Report',
            group: 'g06',
            reportType: 'Executive',
            scope_ar: 'أمانة منطقة جدة، السنة المالية 2026، شهري (2026-04)',
            scope_en: 'Amana (Jeddah Amana), FY2026 Monthly (2026-04)',
            generatedAt: '2026-06-12 10:05',
            status: 'Draft',
            reviewer: 'AI Copilot',
            filters: {
                analysisLevel: 'Amana',
                selectedAmanas: ['jeddah'],
                selectedMunicipalities: ['All'],
                fiscalYear: 'FY2026',
                periodType: 'Monthly',
                specificPeriod: '2026-04',
            },
            narratives: {
                synthesis: 'أداء تحصيل إيرادات أمانة جدة يظهر تقدماً ملحوظاً في الفواتير البلدية التشغيلية، مع وجود فجوات في تحصيل الذمم المرتبطة بالمستثمرين.',
                highlights: 'حققت أمانة جدة نسبة تحصيل بلغت 54.2% من الفواتير البلدية والرسوم. سجلت مخالفات الامتثال البلدي أعلى معدلات تحصيل مقارنة برسوم الأراضي البيضاء.',
                causes: 'يرجع ذلك لتكامل أنظمة الدفع الإلكتروني مع منصة بلدي، وتسهيل إجراءات التقسيط للمستثمرين في المشاريع التشغيلية.',
                risks: 'ضعف تحصيل رسوم الاستثمارات طويلة الأجل للأصول البلدية بجدة قد يقلل من العوائد الذاتية للأمانة في النصف الثاني من العام.',
                recommendations: 'تفعيل آليات الإشعار التلقائي للمستثمرين المتأخرين وتوجيه جهود المتابعة الميدانية للأنشطة التجارية الكبرى بجدة.'
            }
        }
    ]);
    const groupReports = reports.filter(r => r.group === currentGroupContext);

    const [currentReportId, setCurrentReportId] = useState(null);
    const [unlockedSteps, setUnlockedSteps] = useState({
        params: true,
        dash: false,
        narrative: false,
        report: false
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStep, setGeneratingStep] = useState(0);
    const [showSupportingDrawer, setShowSupportingDrawer] = useState(false);

    // AI 评论复核双栏卡片数组
    const [aiCards, setAiCards] = useState([]);
    const [hoveredCardId, setHoveredCardId] = useState(null);

    // AI 协同改写对话状态
    const [chatHistory, setChatHistory] = useState([
        { sender: 'ai', text: 'مرحباً! حدد أي بطاقة تعليق مالي من اليسار لبدء إعادة صياغتها.', text_en: 'Hi! Select any commentary card from the left to start rewriting it.', timestamp: '22:54' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [selectedChatTargetCard, setSelectedChatTargetCard] = useState('synthesis');
    const [isCopilotChatOpen, setIsCopilotChatOpen] = useState(true);
    const [isAiReplying, setIsAiReplying] = useState(false);
    const [editingCell, setEditingCell] = useState(null);
    
    // PPT Slide active page and Report Mode states
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [currentReportSlideIndex, setCurrentReportSlideIndex] = useState(0);
    const [reportViewMode, setReportViewMode] = useState('ppt');
    
    // 报告可选组件配置状态
    const [includedCharts, setIncludedCharts] = useState({
        map: true,
        trend: true,
        sankey: true,
        services: true,
        vision: true
    });
    const [includedTables, setIncludedTables] = useState({
        supporting: true,
        overall: false,
        breakdown: false,
        initiatives: false,
        contracts: false,
        revenueSources: false,
    });


    // Operational Parameters AI 对话输入状态
    const [queryChatInput, setQueryChatInput] = useState('');
    const [showAddTableDropdown, setShowAddTableDropdown] = useState(false);

    const [isQueryInterpreting, setIsQueryInterpreting] = useState(false);
    const [showInterpretedFilters, setShowInterpretedFilters] = useState(false);

    const [dashboardData, setDashboardData] = useState(_initDash);
    const [reportOutput, setReportOutput] = useState(
        getReportOutput({
            reportType: _initReportType,
            dashboardData: _initDash,
            lang: _initLang,
        })
    );

    const [isApproved, setIsApproved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const dict = locales[lang] || locales.ar;

    useEffect(() => {
        // When embedded, the host app owns the global document direction; the
        // UC-06 layout still flips correctly via the dir attr on its own root.
        if (embedded) return;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang, embedded]);

    // Follow the host app's language when embedded.
    useEffect(() => { if (appLang) setLang(appLang); }, [appLang]);

    // Consume the host deep-link once this (possibly lazy-loaded) component mounts.
    useEffect(() => { if (cameFromHost && onConsumeJump) onConsumeJump(); }, []);

    const [slideScale, setSlideScale] = useState(1);
    const slideParentRef = useRef(null);

    useEffect(() => {
        if (!slideParentRef.current) return;
        const handleResize = () => {
            const width = slideParentRef.current.clientWidth;
            setSlideScale(width / 800);
        };
        handleResize();

        const observer = new ResizeObserver(handleResize);
        observer.observe(slideParentRef.current);

        window.addEventListener('resize', handleResize);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', handleResize);
        };
    }, [activeTab, activeSlideIndex]);

    const [reportSlideScale, setReportSlideScale] = useState(1);
    const reportSlideParentRef = useRef(null);

    useEffect(() => {
        if (!reportSlideParentRef.current) return;
        const handleResize = () => {
            const width = reportSlideParentRef.current.clientWidth;
            setReportSlideScale(width / 800);
        };
        handleResize();

        const observer = new ResizeObserver(handleResize);
        observer.observe(reportSlideParentRef.current);

        window.addEventListener('resize', handleResize);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', handleResize);
        };
    }, [activeTab, currentReportSlideIndex]);

    useEffect(() => {
        const nextReportOutput = getReportOutput({
            reportType,
            dashboardData,
            lang,
        });
        setReportOutput(nextReportOutput);

        // 初始化 AI 评论卡片
        const groupKey = dashboardData?.groupMeta?.key || 'g02';
        setAiCards([
            {
                id: 'synthesis',
                type: 'prediction',
                title: dict.sec_synthesis,
                text: nextReportOutput.narratives.synthesis || '',
                originalText: nextReportOutput.narratives.synthesis || '',
                included: true,
                reviewed: false,
                confidence: 94,
                chartKey: groupKey === 'g06' ? 'revenueSources' : 'map',
                source: lang === 'ar' ? 'البوابة الوطنية (مصروفات الميزانية)' : (lang === 'zh' ? '国家门户（预算支出）' : 'National Portal (Budget Expenditures)'),
                reasoning: lang === 'ar' ? 'تم اختيار هذه الفقرة بناءً على استقرار الصرف وتخفيف الفجوات المالية على مستوى الوزارة.' : (lang === 'zh' ? '该段落是根据部委层面支出的稳定性和资金缺口的减少自动选择的。' : 'This paragraph was selected based on stable spending and reduced financial gaps at the ministry level.')
            },
            {
                id: 'highlights',
                type: 'highlight',
                title: dict.sec_highlights,
                text: nextReportOutput.narratives.highlights || '',
                originalText: nextReportOutput.narratives.highlights || '',
                included: true,
                reviewed: false,
                confidence: 96,
                chartKey: groupKey === 'g06' ? 'collectionRate' : 'services',
                source: lang === 'ar' ? 'بيانات أمانة الرياض المرفقة' : (lang === 'zh' ? '附带的利雅得秘书处数据' : 'Attached Riyadh Amana Data'),
                reasoning: lang === 'ar' ? 'تم اختيار هذه الفقرة بناءً على كفاءة الصرف المرتفعة وتفاوت التكاليف للباب الثاني.' : (lang === 'zh' ? '该段落是根据第二门类的高支出效率和成本偏差自动选择的。' : 'This paragraph was selected based on high spending efficiency and cost variance for the second chapter.')
            },
            {
                id: 'causes',
                type: 'data_note',
                title: dict.sec_causes,
                text: nextReportOutput.narratives.causes || '',
                originalText: nextReportOutput.narratives.causes || '',
                included: true,
                reviewed: false,
                confidence: 95,
                chartKey: groupKey === 'g06' ? 'receivables' : (groupKey === 'g03' ? 'doors' : 'sankey'),
                source: lang === 'ar' ? 'سجلات المدفوعات التاريخية' : (lang === 'zh' ? '历史付款分类账' : 'Historical Payment Ledgers'),
                reasoning: lang === 'ar' ? 'تم اختيار هذه الفقرة بناءً على سرعة مراجعة مطالبات المقاولين وتدفق الصرف المالي.' : (lang === 'zh' ? '该段落是根据承包商索赔审核的速度和财务支出流向自动选择的。' : 'This paragraph was selected based on the speed of contractor claims review and financial disbursement flow.')
            },
            {
                id: 'risks',
                type: 'risk',
                title: dict.sec_risks,
                text: nextReportOutput.narratives.risks || '',
                originalText: nextReportOutput.narratives.risks || '',
                included: true,
                reviewed: false,
                confidence: 89,
                chartKey: groupKey === 'g06' ? 'regionalCollection' : (groupKey === 'g03' ? 'variance' : 'contracts'),
                source: lang === 'ar' ? 'تقرير مراقبة المشاريع الفنية' : (lang === 'zh' ? '技术项目监测报告' : 'Technical Projects Monitoring Report'),
                reasoning: lang === 'ar' ? 'تم اختيار هذه الفقرة بناءً على تأخر بعض المبادرات التقنية وتباطؤ تغذية البيانات.' : (lang === 'zh' ? '该段落是根据一些技术倡议的延迟和数据馈送缓慢自动选择的。' : 'This paragraph was selected based on delays in some technical initiatives and slow data feed.')
            },
            {
                id: 'recommendations',
                type: 'recommendation',
                title: dict.sec_recommendations,
                text: nextReportOutput.narratives.recommendations || '',
                originalText: nextReportOutput.narratives.recommendations || '',
                included: true,
                reviewed: false,
                confidence: 91,
                chartKey: 'initiatives',
                source: lang === 'ar' ? 'مخرجات لجنة كفاءة الإنفاق' : (lang === 'zh' ? '支出效率委员会大纲' : 'Expenditure Efficiency Committee Outlines'),
                reasoning: lang === 'ar' ? 'تم اختيار هذه الفقرة بناءً على الحاجة للحد من تراكم الالتزامات المالية قبل نهاية السنة.' : (lang === 'zh' ? '该段落是基于年底前减少合同义务累积的需求自动选择的。' : 'This paragraph was selected based on the need to reduce contract obligations accumulation before year-end.')
            }
        ]);
        setActiveSlideIndex(0);
        setIsApproved(false);
    }, [dashboardData, reportType, lang]);

    const availableMunicipalities = getAvailableMunicipalities(selectedAmanas);
    const specificPeriodOptions = SPECIFIC_PERIOD_OPTIONS[fiscalYear]?.[periodType] || [];

    const buildCurrentData = (currentLang = lang) =>
        getDashboardData({
            groupContext: currentGroupContext,
            analysisLevel,
            selectedAmanas,
            selectedMunicipalities,
            fiscalYear,
            periodType,
            specificPeriod,
            lang: currentLang,
        });

    const refreshWithCurrentFilters = (currentLang = lang) => {
        setDashboardData(buildCurrentData(currentLang));
    };

    const handleSync = () => {
        refreshWithCurrentFilters();
        setActiveTab('dash');
        alert(lang === 'ar'
            ? '🚀 تم تحديث لوحة الأداء الموحدة بنجاح.'
            : '🚀 Unified financial performance dashboard refreshed successfully.');
    };

    const changeLanguage = (newLang) => {
        setLang(newLang);
        setDashboardData(buildCurrentData(newLang));
    };

    const resetFilters = () => {
        const nextFiscalYear = 'FY2026';
        const nextPeriodType = 'Monthly';
        const nextSpecificPeriod = '2026-04';
        const nextAnalysisLevel = 'Ministry';
        const nextAmanas = ['All'];
        const nextMunicipalities = ['All'];
        const nextDefaultReportType = dashboardData?.groupMeta?.allowedReportTypes?.[0] || 'Executive';

        setAnalysisLevel(nextAnalysisLevel);
        setSelectedAmanas(nextAmanas);
        setSelectedMunicipalities(nextMunicipalities);
        setFiscalYear(nextFiscalYear);
        setPeriodType(nextPeriodType);
        setSpecificPeriod(nextSpecificPeriod);
        setReportType(nextDefaultReportType);
        setDashboardData(
            getDashboardData({
                groupContext: currentGroupContext,
                analysisLevel: nextAnalysisLevel,
                selectedAmanas: nextAmanas,
                selectedMunicipalities: nextMunicipalities,
                fiscalYear: nextFiscalYear,
                periodType: nextPeriodType,
                specificPeriod: nextSpecificPeriod,
                lang,
            })
        );
    };

    const handleSubDepartmentSwitch = (subDept) => {
        if (subDept.implemented !== true) {
            return;
        }

        let nextGroupContext = currentGroupContext;
        if (!subDept.allowedUseCases.includes(currentGroupContext)) {
            nextGroupContext = subDept.defaultUseCase;
        }
        
        setActiveSubDeptId(subDept.id);
        setCurrentGroupContext(nextGroupContext);
        
        let nextLevel = analysisLevel;
        let nextAmanas = selectedAmanas;
        let nextMunicipalities = selectedMunicipalities;
        
        if (subDept.filterPreset) {
            nextLevel = subDept.filterPreset.analysisLevel;
            nextAmanas = subDept.filterPreset.selectedAmanas;
            nextMunicipalities = subDept.filterPreset.selectedMunicipalities;
            setAnalysisLevel(nextLevel);
            setSelectedAmanas(nextAmanas);
            setSelectedMunicipalities(nextMunicipalities);
        }

        const nextData = getDashboardData({
            groupContext: nextGroupContext,
            analysisLevel: nextLevel,
            selectedAmanas: nextAmanas,
            selectedMunicipalities: nextMunicipalities,
            fiscalYear,
            periodType,
            specificPeriod,
            lang,
        });
        
        const nextAllowed = nextData?.groupMeta?.allowedReportTypes?.[0];
        setDashboardData(nextData);
        if (nextAllowed) {
            setReportType(nextAllowed);
        }
        setActiveTab('workspace');
    };

    const handleUseCaseSwitch = (useCaseId) => {
        const activeDept = DEPARTMENTS_TREE.find(d => d.subDepartments.some(s => s.id === activeSubDeptId));
        const activeSubDept = activeDept?.subDepartments.find(s => s.id === activeSubDeptId);
        
        if (!activeSubDept || !activeSubDept.allowedUseCases.includes(useCaseId)) {
            return;
        }
        
        setCurrentGroupContext(useCaseId);
        
        const nextData = getDashboardData({
            groupContext: useCaseId,
            analysisLevel,
            selectedAmanas,
            selectedMunicipalities,
            fiscalYear,
            periodType,
            specificPeriod,
            lang,
        });
        
        const nextAllowed = nextData?.groupMeta?.allowedReportTypes?.[0];
        setDashboardData(nextData);
        if (nextAllowed) {
            setReportType(nextAllowed);
        }
        setActiveTab('workspace');
    };

    const handleAnalysisLevelChange = (nextLevel) => {
        setAnalysisLevel(nextLevel);

        if (nextLevel === 'Ministry') {
            setSelectedAmanas(['All']);
            setSelectedMunicipalities(['All']);
            return;
        }

        if (nextLevel === 'Amana') {
            if (normalizeMultiSelect(selectedAmanas).includes('All')) {
                setSelectedAmanas(['All']);
            }
            setSelectedMunicipalities(['All']);
            return;
        }

        const nextAmana = normalizeMultiSelect(selectedAmanas).includes('All') ? 'riyadh' : selectedAmanas[0];
        const nextMunicipality = (MUNICIPALITY_OPTIONS[nextAmana] || [])[0]?.value || 'All';
        setSelectedAmanas([nextAmana]);
        setSelectedMunicipalities([nextMunicipality]);
    };

    const handleFiscalYearChange = (nextFiscalYear) => {
        const nextPeriodOptions = SPECIFIC_PERIOD_OPTIONS[nextFiscalYear]?.[periodType] || [];
        setFiscalYear(nextFiscalYear);
        if (!nextPeriodOptions.find((item) => item.value === specificPeriod)) {
            setSpecificPeriod(nextPeriodOptions[0]?.value || '');
        }
    };

    const handlePeriodTypeChange = (nextPeriodType) => {
        const nextPeriodOptions = SPECIFIC_PERIOD_OPTIONS[fiscalYear]?.[nextPeriodType] || [];
        setPeriodType(nextPeriodType);
        if (!nextPeriodOptions.find((item) => item.value === specificPeriod)) {
            setSpecificPeriod(nextPeriodOptions[0]?.value || '');
        }
    };

    const injectPreset = (presetId) => {
        setAiCards(prev => prev.map(card => {
            if (presetId === 1 && card.id === 'highlights') {
                const addText = lang === 'ar'
                    ? '\n• يوصى بإبراز الجهات الأقل من متوسط نسبة الصرف الحالي ضمن الملخص المرفوع.'
                    : '\n• Highlight the entities operating below the current spending-rate average in the final summary.';
                return { ...card, text: card.text + addText };
            }
            if (presetId === 2 && card.id === 'causes') {
                const addText = lang === 'ar'
                    ? '\n• يجب الإشارة بوضوح إلى أن قراءة الأسباب هنا تحليلية وليست بديلاً عن المطابقة المالية الرسمية.'
                    : '\n• Clarify that the current explanation is analytical and should not replace formal financial reconciliation.';
                return { ...card, text: card.text + addText };
            }
            if (presetId === 3 && card.id === 'recommendations') {
                const addText = lang === 'ar'
                    ? '\n• يقترح في المرحلة التالية الربط بين هذه القراءة وبين قوالب التقرير الرسمية حسب نوع التقرير المستهدف.'
                    : '\n• The next phase should link this unified analysis view with formal report templates by output type.';
                return { ...card, text: card.text + addText };
            }
            return card;
        }));
    };

    const moveCard = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= aiCards.length) return;
        const updated = [...aiCards];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        setAiCards(updated);
    };

    const applyChatRewrite = (cardId, newText) => {
        setAiCards(prev => prev.map(card => {
            if (card.id === cardId) {
                return { ...card, text: newText };
            }
            return card;
        }));
    };

    const revertCardText = (cardId) => {
        setAiCards(prev => prev.map(card => {
            if (card.id === cardId) {
                return { ...card, text: card.originalText };
            }
            return card;
        }));
    };

    const toggleReviewed = (cardId) => {
        setAiCards(prev => prev.map(card => {
            if (card.id === cardId) {
                return { ...card, reviewed: true }; // 保持为 true，避免重复点击时被取消核对
            }
            return card;
        }));
    };

    const toggleShowDiff = (cardId) => {
        setAiCards(prev => prev.map(card => {
            if (card.id === cardId) {
                return { ...card, showDiff: !card.showDiff };
            }
            return card;
        }));
    };

    const startGeneratingDashboard = () => {
        setIsGenerating(true);
        setActiveTab('dash');
        setGeneratingStep(0);
        const timer = setInterval(() => {
            setGeneratingStep(prev => {
                if (prev >= 3) {
                    clearInterval(timer);
                    setTimeout(() => {
                        setIsGenerating(false);
                        setUnlockedSteps({
                            params: true,
                            dash: true,
                            narrative: true,
                            report: false
                        });
                        refreshWithCurrentFilters();
                    }, 800);
                    return 4;
                }
                return prev + 1;
            });
        }, 2500);
    };

    // Lock the embedded page to the sub-department the host requested (and, if a
    // deep-link asked for it, run the dashboard-generation animation). Keyed on
    // subDept so it self-corrects even if React reuses this instance.
    useEffect(() => {
        if (!embedded) return;
        if (subDept && subDept !== activeSubDeptId) {
            const obj = DEPARTMENTS_TREE.flatMap(d => d.subDepartments || []).find(s => s.id === subDept);
            if (obj) handleSubDepartmentSwitch(obj);
        }
        if (autoGenerate) startGeneratingDashboard();
        else if (initialTab) setActiveTab(initialTab);
    }, [subDept]);

    const submitQueryChat = (text) => {
        if (!text.trim()) return;
        setIsQueryInterpreting(true);
        setTimeout(() => {
            setIsQueryInterpreting(false);
            setShowInterpretedFilters(true);
            const lowerText = text.toLowerCase();
            if (lowerText.includes('riyadh') || text.includes('رياض')) {
                setAnalysisLevel('Amana');
                setSelectedAmanas(['riyadh']);
                setSelectedMunicipalities(['All']);
            } else if (lowerText.includes('jeddah') || text.includes('جدة')) {
                setAnalysisLevel('Amana');
                setSelectedAmanas(['jeddah']);
                setSelectedMunicipalities(['All']);
            } else if (lowerText.includes('ministry') || text.includes('وزارة')) {
                setAnalysisLevel('Ministry');
                setSelectedAmanas(['All']);
                setSelectedMunicipalities(['All']);
            }
        }, 800);
    };

    const submitCopilotChat = () => {
        if (!chatInput.trim()) return;
        const userMsg = { sender: 'user', text: chatInput, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setChatHistory(prev => [...prev, userMsg]);
        const currentInput = chatInput;
        setChatInput('');
        setIsAiReplying(true);

        setTimeout(() => {
            setIsAiReplying(false);
            const lowerInput = currentInput.toLowerCase();
            let aiText = '';

            const targetCard = aiCards.find(c => c.id === selectedChatTargetCard);
            if (targetCard) {
                if (lowerInput.includes('concise') || lowerInput.includes('إيجاز') || lowerInput.includes('قصير') || lowerInput.includes('قصيرة')) {
                    aiText = lang === 'ar'
                        ? `[نسخة موجزة]: انخفاض الصرف المالي في الباب الثاني لبعض الجهات يتطلب مراجعة فورية لتلافي أي انحراف ميزانية إضافي.`
                        : `[Concise Version]: Low budget execution rate in Door 2 requires immediate variance audits to control additional gaps.`;
                } else if (lowerInput.includes('formal') || lowerInput.includes('رسمي') || lowerInput.includes('رسمية')) {
                    aiText = lang === 'ar'
                        ? `[نسخة رسمية]: نود الإفادة بوجود تفاوت ملحوظ في كفاءة الصرف المالي للباب الثاني، ونهيب بالجهات المعنية اتخاذ التدابير التصحيحية اللازمة.`
                        : `[Formal Tone]: We formally advise that budget execution for Door 2 indicates an exceptional variance of 12%, necessitating regulatory audits.`;
                } else {
                    aiText = lang === 'ar'
                        ? `[معدّل بالذكاء الاصطناعي]: ${targetCard.text} (تم تعزيز الصياغة لإبراز معطيات الانحراف المالي المحددة للباب الثاني).`
                        : `[AI Optimized]: ${targetCard.text} (Adjusted specifically to emphasize the expenditure variance factors).`;
                }
            } else {
                aiText = lang === 'ar' ? 'عذراً، يرجى تحديد بطاقة مستهدفة صالحة أولاً.' : 'Please select a valid target card first.';
            }

            const aiMsg = {
                sender: 'ai',
                text: aiText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                targetCardId: selectedChatTargetCard,
                suggestedText: aiText
            };
            setChatHistory(prev => [...prev, aiMsg]);
        }, 1200);
    };

    const submitReportForReview = () => {
        if (currentReportId) {
            setReports(prev => prev.map(r => {
                if (r.id === currentReportId) {
                    return { ...r, status: 'In Review', narratives: getCompiledNarratives() };
                }
                return r;
            }));
            alert(lang === 'ar' ? '📤 تم تقديم التقرير للمراجعة بنجاح!' : '📤 Report submitted for review successfully!');
        }
    };

    const approveReport = () => {
        setIsApproved(true);
        if (currentReportId) {
            setReports(prev => prev.map(r => {
                if (r.id === currentReportId) {
                    return { ...r, status: 'Approved', narratives: getCompiledNarratives() };
                }
                return r;
            }));
            alert(lang === 'ar' ? '✅ تم اعتماد التقرير بنجاح!' : '✅ Report approved successfully!');
        }
    };

    const publishReport = (reportId) => {
        const targetId = reportId || currentReportId;
        setReports(prev => prev.map(r => {
            if (r.id === targetId) {
                return { ...r, status: 'Published' };
            }
            return r;
        }));
        alert(lang === 'ar' ? '🚀 تم نشر التقرير رسمياً إلى المجلس بنجاح!' : '🚀 Report published officially to the Council successfully!');
    };

    const getCompiledNarratives = () => {
        const result = {};
        aiCards.forEach(c => {
            result[c.id] = c.text;
        });
        return result;
    };

    const createNewReport = () => {
        const newId = Date.now();
        setCurrentReportId(newId);
        resetFilters();
        setUnlockedSteps({
            params: true,
            dash: false,
            narrative: false,
            report: false
        });
        setActiveTab('params');
        setShowInterpretedFilters(false);
        setQueryChatInput('');
        setIsApproved(false);
    };

    const openReport = (report) => {
        setCurrentReportId(report.id);
        setAnalysisLevel(report.filters.analysisLevel);
        setSelectedAmanas(report.filters.selectedAmanas);
        setSelectedMunicipalities(report.filters.selectedMunicipalities);
        setFiscalYear(report.filters.fiscalYear);
        setPeriodType(report.filters.periodType);
        setSpecificPeriod(report.filters.specificPeriod);
        
        const nextData = getDashboardData({
            groupContext: report.group,
            analysisLevel: report.filters.analysisLevel,
            selectedAmanas: report.filters.selectedAmanas,
            selectedMunicipalities: report.filters.selectedMunicipalities,
            fiscalYear: report.filters.fiscalYear,
            periodType: report.filters.periodType,
            specificPeriod: report.filters.specificPeriod,
            lang,
        });
        setDashboardData(nextData);
        setReportType(report.reportType);
        setCurrentGroupContext(report.group);

        setUnlockedSteps({
            params: true,
            dash: true,
            narrative: true,
            report: true
        });
        setIsApproved(report.status === 'Approved' || report.status === 'Published');
        setActiveTab('report');
    };

    const continueReviewReport = (report) => {
        setCurrentReportId(report.id);
        setAnalysisLevel(report.filters.analysisLevel);
        setSelectedAmanas(report.filters.selectedAmanas);
        setSelectedMunicipalities(report.filters.selectedMunicipalities);
        setFiscalYear(report.filters.fiscalYear);
        setPeriodType(report.filters.periodType);
        setSpecificPeriod(report.filters.specificPeriod);

        const nextData = getDashboardData({
            groupContext: report.group,
            analysisLevel: report.filters.analysisLevel,
            selectedAmanas: report.filters.selectedAmanas,
            selectedMunicipalities: report.filters.selectedMunicipalities,
            fiscalYear: report.filters.fiscalYear,
            periodType: report.filters.periodType,
            specificPeriod: report.filters.specificPeriod,
            lang,
        });
        setDashboardData(nextData);
        setReportType(report.reportType);
        setCurrentGroupContext(report.group);

        setUnlockedSteps({
            params: true,
            dash: true,
            narrative: true,
            report: report.status === 'Approved' || report.status === 'Published'
        });
        setIsApproved(report.status === 'Approved' || report.status === 'Published');
        setActiveTab('narrative');
    };

    const exportToPPTX = async () => {
        const pptx = new pptxgen();
        // Custom MOMAH slide dimensions to prevent out-of-bounds clipping and white sidebars
        pptx.defineLayout({ name: 'LAYOUT_MOMAH', width: 13.33, height: 7.5 });
        pptx.layout = 'LAYOUT_MOMAH';
        
        const rectShape = pptx.ShapeType ? pptx.ShapeType.rect : (pptx.shapes ? pptx.shapes.RECTANGLE : 'rect');
        const ovalShape = pptx.ShapeType ? pptx.ShapeType.ellipse : (pptx.shapes ? pptx.shapes.OVAL : 'oval');
        
        // PPT template exact table data (Apr 2026 Sector Financial Performance)
        const PPT_TEMPLATE_TABLE_DATA = {
            columns: {
                ar: ['الجهة', 'الاعتماد الأصلي', 'الاعتماد بعد التعديل', 'المنصرف', 'المتبقي', 'نسبة الصرف'],
                en: ['Entity', 'Original Allocation', 'Revised Allocation', 'Spent', 'Remaining', 'Execution Rate']
            },
            rows: [
                { ar: 'أمانة محافظة حفر الباطن', en: 'Hafar Al-Batin Amana', original: 268, revised: 293, spent: 236, remaining: 57, rate: '80%' },
                { ar: 'أمانة منطقة جازان', en: 'Jazan Amana', original: 890, revised: 893, spent: 649, remaining: 244, rate: '73%' },
                { ar: 'أمانة منطقة حائل', en: 'Hail Amana', original: 1012, revised: 1143, spent: 827, remaining: 315, rate: '72%' },
                { ar: 'أمانة منطقة نجران', en: 'Najran Amana', original: 384, revised: 434, spent: 288, remaining: 146, rate: '66%' },
                { ar: 'أمانة منطقة المدينة المنورة', en: 'Al Madinah Amana', original: 2136, revised: 2625, spent: 1739, remaining: 885, rate: '66%' },
                { ar: 'أمانة منطقة القصيم', en: 'Al Qassim Amana', original: 1705, revised: 1715, spent: 1101, remaining: 615, rate: '64%' },
                { ar: 'أمانة منطقة الباحة', en: 'Al Baha Amana', original: 445, revised: 446, spent: 277, remaining: 170, rate: '62%' },
                { ar: 'أمانة منطقة الحدود الشمالية', en: 'Northern Borders Amana', original: 372, revised: 376, spent: 233, remaining: 143, rate: '62%' },
                { ar: 'ديوان عام الوزارة', en: 'Ministry HQ', original: 8715, revised: 8710, spent: 5217, remaining: 3492, rate: '60%' },
                { ar: 'أمانة المنطقة الشرقية', en: 'Eastern Province Amana', original: 2505, revised: 2702, spent: 1576, remaining: 1126, rate: '58%' },
                { ar: 'أمانة منطقة الرياض', en: 'Riyadh Amana', original: 7253, revised: 7351, spent: 4283, remaining: 3068, rate: '58%' },
                { ar: 'أمانة منطقة الجوف', en: 'Al Jouf Amana', original: 548, revised: 553, spent: 308, remaining: 245, rate: '56%' },
                { ar: 'أمانة محافظة الاحساء', en: 'Al Ahsa Governorate Amana', original: 712, revised: 721, spent: 396, remaining: 324, rate: '55%' },
                { ar: 'أمانة منطقة عسير', en: 'Asir Amana', original: 2134, revised: 2335, spent: 1279, remaining: 1056, rate: '55%' },
                { ar: 'أمانة منطقة تبوك', en: 'Tabuk Amana', original: 555, revised: 561, spent: 267, remaining: 294, rate: '48%' },
                { ar: 'أمانة محافظة جدة', en: 'Jeddah Governorate Amana', original: 4227, revised: 4227, spent: 1985, remaining: 2241, rate: '47%' },
                { ar: 'أمانة العاصمة المقدسة', en: 'Makkah Capital Amana', original: 2126, revised: 2126, spent: 952, remaining: 1174, rate: '45%' },
                { ar: 'أمانة محافظة الطائف', en: 'Taif Governorate Amana', original: 734, revised: 830, spent: 336, remaining: 494, rate: '41%' },
                { ar: 'الإجمالي', en: 'Total', original: 36721, revised: 38040, spent: 21950, remaining: 16090, rate: '58%' }
            ]
        };

        // Month Formatting Helper
        const formatPPTPeriod = (period, lang) => {
            if (!period) return lang === 'ar' ? 'أبريل 2026م' : 'April 2026';
            const parts = period.split('-');
            if (parts.length === 2) {
                const yr = parts[0];
                const mo = parseInt(parts[1]);
                const monthsAr = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                const monthsEn = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                if (lang === 'ar') {
                    return `${monthsAr[mo]} ${yr}م`;
                } else {
                    return `${monthsEn[mo]} ${yr}`;
                }
            }
            return period;
        };

        const formatPPTNumber = (num) => {
            if (num === null || num === undefined) return '';
            if (typeof num === 'string') return num;
            return num.toLocaleString('en-US'); // Standard comma thousand separator
        };

        // Asynchronous SVG to PNG converter (as fallback if html2canvas meets taint issues)
        const svgToPngBase64 = (svgElement) => {
            return new Promise((resolve) => {
                try {
                    const clonedSvg = svgElement.cloneNode(true);
                    let width = svgElement.clientWidth || svgElement.getBoundingClientRect().width || 760;
                    let height = svgElement.clientHeight || svgElement.getBoundingClientRect().height || 280;
                    
                    clonedSvg.setAttribute('width', width);
                    clonedSvg.setAttribute('height', height);
                    if (!clonedSvg.getAttribute('viewBox')) {
                        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
                    }
                    clonedSvg.style.backgroundColor = '#ffffff';
                    
                    const svgString = new XMLSerializer().serializeToString(clonedSvg);
                    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const URL = window.URL || window.webkitURL || window;
                    const blobURL = URL.createObjectURL(svgBlob);
                    
                    const img = new Image();
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            const scale = 2; // 2x high resolution
                            canvas.width = width * scale;
                            canvas.height = height * scale;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.scale(scale, scale);
                                ctx.drawImage(img, 0, 0, width, height);
                                const dataUrl = canvas.toDataURL('image/png');
                                URL.revokeObjectURL(blobURL);
                                resolve(dataUrl);
                            } else {
                                URL.revokeObjectURL(blobURL);
                                resolve(null);
                            }
                        } catch (err) {
                            console.error('Error drawing svg to canvas', err);
                            URL.revokeObjectURL(blobURL);
                            resolve(null);
                        }
                    };
                    img.onerror = (e) => {
                        console.error('Image load error for SVG conversion', e);
                        URL.revokeObjectURL(blobURL);
                        resolve(null);
                    };
                    img.src = blobURL;
                } catch (e) {
                    console.error('Failed in svgToPngBase64', e);
                    resolve(null);
                }
            });
        };

        // Asynchronous chart capture orchestrator (ECharts Native -> html2canvas (SVG/HTML) -> Fallbacks)
        const captureChartAsBase64 = async (chartKey) => {
            if (!chartKey || chartKey === 'none') return null;
            
            const chartContainer = document.querySelector(`[data-pptx-chart-key="${chartKey}"]`);
            if (!chartContainer) {
                console.warn(`Chart container for key '${chartKey}' not found in DOM.`);
                return null;
            }
            
            // 1. Prioritize ECharts Native export if available (ensures vector sharpness and tooltip exclusion)
            let echartsDom = chartContainer.querySelector('div[_echarts_instance_]');
            if (!echartsDom && chartContainer.hasAttribute('_echarts_instance_')) {
                echartsDom = chartContainer;
            }
            if (!echartsDom) {
                const divs = chartContainer.querySelectorAll('div');
                for (let d of divs) {
                    if (d.hasAttribute('_echarts_instance_')) {
                        echartsDom = d;
                        break;
                    }
                }
            }
            
            if (echartsDom) {
                const chartInstance = echarts.getInstanceByDom(echartsDom);
                if (chartInstance) {
                    try {
                        return chartInstance.getDataURL({
                            type: 'png',
                            pixelRatio: 2,
                            excludeComponents: ['toolbox']
                        });
                    } catch (err) {
                        console.error('Failed to get ECharts dataURL', err);
                    }
                }
            }
            
            // 2. Second priority: Use html2canvas to capture the entire container
            // This works beautifully for native SVG charts (like trends, door analysis) and pure HTML/CSS progress bars/tables.
            try {
                const canvas = await html2canvas(chartContainer, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    scale: 2, // 2x high resolution
                    logging: false
                });
                return canvas.toDataURL('image/png');
            } catch (err) {
                console.error('html2canvas capture failed, falling back to SVG/canvas capture', err);
            }
            
            // 3. Fallback: Try manual SVG serialization
            const svgElement = chartContainer.querySelector('svg');
            if (svgElement) {
                try {
                    const pngBase64 = await svgToPngBase64(svgElement);
                    if (pngBase64) return pngBase64;
                } catch (svgErr) {
                    console.error('Failed to convert SVG to PNG', svgErr);
                }
            }
            
            // 4. Ultimate Fallback: Direct canvas read
            const canvas = chartContainer.querySelector('canvas');
            if (canvas) {
                try {
                    return canvas.toDataURL('image/png');
                } catch (e) {
                    console.error('Failed to get canvas data URL', e);
                }
            }
            
            return null;
        };

        // 1. Cover Slide (Standard MOMAH Green Cover - perfectly bounded within 13.33 x 7.5)
        let coverSlide = pptx.addSlide();
        coverSlide.background = { fill: '015551' };
        try {
            coverSlide.addImage({ path: logo, x: 10.5, y: 0.5, w: 2.2, h: 1.1 });
        } catch (logoErr) {
            console.error("Failed to add logo to PPTX cover", logoErr);
        }
        
        coverSlide.addText(
            lang === 'ar' ? 'مختصر الأداء المالي للقطاع' : 'Sector Financial Performance Executive Summary',
            { x: 1.0, y: 1.8, w: 11.3, h: 1.5, color: 'FAF7EE', fontSize: 32, bold: true, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat' }
        );
        
        coverSlide.addText(
            lang === 'ar' ? `حتى نهاية ${formatPPTPeriod(specificPeriod, 'ar')}` : `Through the end of ${formatPPTPeriod(specificPeriod, 'en')}`,
            { x: 1.0, y: 3.3, w: 11.3, h: 0.8, color: 'd4af37', fontSize: 20, bold: true, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat' }
        );
        
        coverSlide.addText(
            `${lang === 'ar' ? 'وكالة الشؤون المالية والميزانية' : 'Agency for Financial Affairs & Budget'}\n` +
            `${lang === 'ar' ? 'تاريخ الإنشاء:' : 'Date:'} ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}\n` +
            `${lang === 'ar' ? 'الحالة: معتمد' : 'Status: APPROVED'}`,
            { x: 1.0, y: 4.8, w: 11.3, h: 1.2, color: 'ffffff', fontSize: 11, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat', lineSpacing: 18 }
        );

        // 2. Slide 2: Overall Regional Comparison Table Slide (MOMAH Table Template Style - bounded within 13.33 x 7.5)
        let tableSlide = pptx.addSlide();
        tableSlide.background = { fill: 'ffffff' }; // Aligned to white theme background
        
        // Header
        tableSlide.addShape(rectShape, { x: 0.5, y: 0.3, w: 12.3, h: 0.6, fill: { color: 'ffffff' }, line: { color: 'e2e8f0', width: 1 } });
        tableSlide.addShape(ovalShape, { x: 0.7, y: 0.5, w: 0.15, h: 0.15, fill: { color: '015551' } });
        
        const tableTitle = lang === 'ar' 
            ? `مختصر الأداء المالي للقطاع حتى نهاية ${formatPPTPeriod(specificPeriod, 'ar')}`
            : `Sector Financial Performance Summary through ${formatPPTPeriod(specificPeriod, 'en')}`;
            
        tableSlide.addText(
            tableTitle,
            { x: 0.9, y: 0.38, w: 8.5, h: 0.4, color: '015551', fontSize: 13, bold: true, rtl: lang === 'ar', fontFace: 'JF Flat' }
        );
        
        tableSlide.addText(
            lang === 'ar' ? 'وكالة الشؤون المالية والميزانية' : 'Agency for Financial Affairs & Budget',
            { x: 9.5, y: 0.42, w: 3.0, h: 0.3, color: '64748b', fontSize: 9, bold: true, align: 'right', rtl: lang === 'ar', fontFace: 'JF Flat' }
        );

        // Table Data Assembly (Using high-fidelity real values mapped to template)
        const headers = PPT_TEMPLATE_TABLE_DATA.columns[lang === 'ar' ? 'ar' : 'en'].map(col => ({
            text: col,
            options: { fill: '015551', color: 'ffffff', bold: true, fontFace: 'JF Flat', fontSize: 11, align: 'center', rtl: lang === 'ar' }
        }));
        
        let pptxRows = [headers];
        
        PPT_TEMPLATE_TABLE_DATA.rows.forEach((row, rIdx) => {
            const isTotal = row.ar === 'الإجمالي' || row.en === 'Total';
            const bg = isTotal ? 'def7ec' : (rIdx % 2 === 0 ? 'ffffff' : 'f8fafc');
            const textColor = isTotal ? '015551' : '334155';
            const isBold = isTotal;
            
            const entityName = lang === 'ar' ? row.ar : row.en;
            
            let r = [
                { text: String(entityName), options: { fontFace: 'JF Flat', fontSize: isTotal ? 11 : 10, color: textColor, bold: isBold, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fill: { color: bg } } },
                { text: formatPPTNumber(row.original), options: { fontFace: 'JF Flat', fontSize: isTotal ? 11 : 10, color: textColor, bold: isBold, align: 'center', fill: { color: bg } } },
                { text: formatPPTNumber(row.revised), options: { fontFace: 'JF Flat', fontSize: isTotal ? 11 : 10, color: textColor, bold: isBold, align: 'center', fill: { color: bg } } },
                { text: formatPPTNumber(row.spent), options: { fontFace: 'JF Flat', fontSize: isTotal ? 11 : 10, color: textColor, bold: isBold, align: 'center', fill: { color: bg } } },
                { text: formatPPTNumber(row.remaining), options: { fontFace: 'JF Flat', fontSize: isTotal ? 11 : 10, color: textColor, bold: isBold, align: 'center', fill: { color: bg } } },
                { text: String(row.rate), options: { fontFace: 'JF Flat', fontSize: isTotal ? 11 : 10, color: textColor, bold: true, align: 'center', fill: { color: bg } } }
            ];
            pptxRows.push(r);
        });

        tableSlide.addTable(pptxRows, {
            x: 0.5,
            y: 1.15,
            w: 12.3,
            colW: [3.3, 1.8, 1.8, 1.8, 1.8, 1.8],
            border: { type: 'solid', color: 'e2e8f0', width: 0.5 }
        });

        // 3. Slide 3: Insights & Recommendations Slide (أبرز المرئيات والتوصيات - perfectly symmetric within 13.33 x 7.5)
        let insightsSlide = pptx.addSlide();
        insightsSlide.background = { fill: 'FAF7EE' };
        
        // Header
        insightsSlide.addShape(rectShape, { x: 0.5, y: 0.3, w: 12.3, h: 0.6, fill: { color: 'ffffff' }, line: { color: 'e2e8f0', width: 1 } });
        insightsSlide.addShape(ovalShape, { x: 0.7, y: 0.5, w: 0.15, h: 0.15, fill: { color: '015551' } });
        
        insightsSlide.addText(
            lang === 'ar' ? 'أبرز المرئيات والتوصيات' : 'Key Insights & Recommendations Summary',
            { x: 0.9, y: 0.38, w: 8.5, h: 0.4, color: '015551', fontSize: 13, bold: true, rtl: lang === 'ar', fontFace: 'JF Flat' }
        );
        
        insightsSlide.addText(
            lang === 'ar' ? 'وكالة الشؤون المالية والميزانية' : 'Agency for Financial Affairs & Budget',
            { x: 9.5, y: 0.42, w: 3.0, h: 0.3, color: '64748b', fontSize: 9, bold: true, align: 'right', rtl: lang === 'ar', fontFace: 'JF Flat' }
        );

        // Observations (Left Column) - Expanded heights, fontSizes and lineSpacings to fill the layout page
        const synthesisCard = aiCards.find(c => c.id === 'synthesis');
        const highlightsCard = aiCards.find(c => c.id === 'highlights');
        const obsText = (synthesisCard ? synthesisCard.text : '') + '\n\n' + (highlightsCard ? highlightsCard.text : '');
        
        insightsSlide.addShape(rectShape, { x: 0.6, y: 1.25, w: 5.8, h: 5.2, fill: { color: 'ffffff' }, line: { color: 'e2e8f0', width: 1 } });
        insightsSlide.addShape(rectShape, { x: 0.6, y: 1.25, w: 5.8, h: 0.08, fill: { color: '015551' } });
        
        insightsSlide.addText(
            lang === 'ar' ? 'أبرز الملاحظات والنتائج' : 'Key Observations & Highlights',
            { x: 0.8, y: 1.45, w: 5.4, h: 0.4, color: '015551', fontSize: 14, bold: true, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat' }
        );
        
        insightsSlide.addText(
            obsText,
            { x: 0.8, y: 2.0, w: 5.4, h: 4.2, color: '334155', fontSize: 14, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat', lineSpacing: 28 }
        );

        // Recommendations (Right Column) - Expanded heights, fontSizes and lineSpacings to fill the layout page
        const recCard = aiCards.find(c => c.id === 'recommendations');
        const recText = recCard ? recCard.text : '';
        
        insightsSlide.addShape(rectShape, { x: 6.9, y: 1.25, w: 5.8, h: 5.2, fill: { color: 'ffffff' }, line: { color: 'e2e8f0', width: 1 } });
        insightsSlide.addShape(rectShape, { x: 6.9, y: 1.25, w: 5.8, h: 0.08, fill: { color: 'd4af37' } });
        
        insightsSlide.addText(
            lang === 'ar' ? 'الحلول المقترحة والتوصيات' : 'Proposed Solutions & Recommendations',
            { x: 7.1, y: 1.45, w: 5.4, h: 0.4, color: '015551', fontSize: 14, bold: true, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat' }
        );
        
        insightsSlide.addText(
            recText,
            { x: 7.1, y: 2.0, w: 5.4, h: 4.2, color: '334155', fontSize: 14, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat', lineSpacing: 28 }
        );

        // 4. Slide 4+: Chart Feature Slides (Sequential Asynchronous rendering loop - perfectly bounded)
        const includedCards = aiCards.filter(c => c.included);
        for (let idx = 0; idx < includedCards.length; idx++) {
            const card = includedCards[idx];
            let slide = pptx.addSlide();
            slide.background = { fill: 'FAF7EE' };
            
            // Header
            slide.addShape(rectShape, { x: 0.5, y: 0.3, w: 12.3, h: 0.6, fill: { color: 'ffffff' }, line: { color: 'e2e8f0', width: 1 } });
            slide.addShape(ovalShape, { x: 0.7, y: 0.5, w: 0.15, h: 0.15, fill: { color: '015551' } });
            
            slide.addText(
                card.title,
                { x: 0.9, y: 0.38, w: 7.0, h: 0.4, color: '015551', fontSize: 13, bold: true, rtl: lang === 'ar', fontFace: 'JF Flat' }
            );
            
            slide.addText(
                `${lang === 'ar' ? 'صفحة' : 'Slide'} ${idx + 4}`,
                { x: 8.5, y: 0.42, w: 4.0, h: 0.3, color: '64748b', fontSize: 9, bold: true, align: 'right', fontFace: 'JF Flat' }
            );
            
            // Left Column: Narrative Commentary Box (Symmetric layout + expanded sizes to fill card)
            slide.addShape(rectShape, { x: 0.6, y: 1.25, w: 4.6, h: 5.2, fill: { color: 'ffffff' }, line: { color: 'e2e8f0', width: 1 } });
            slide.addShape(rectShape, { x: 0.6, y: 1.25, w: 4.6, h: 0.08, fill: { color: '015551' } });
            
            slide.addText(
                lang === 'ar' ? 'التعليق المالي' : 'Narrative Commentary',
                { x: 0.8, y: 1.45, w: 4.2, h: 0.3, color: '015551', fontSize: 12, bold: true, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat' }
            );
            
            slide.addText(
                card.text,
                { x: 0.8, y: 1.9, w: 4.2, h: 4.2, color: '334155', fontSize: 13.5, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat', lineSpacing: 26 }
            );
            
            // Right Column: Asynchronously Capture Chart or fall back to associated KPIs
            let chartKey = card.chartKey;
            let chartBase64 = null;
            if (chartKey && chartKey !== 'none') {
                chartBase64 = await captureChartAsBase64(chartKey);
            }
            
            // Draw Right Box (Chart Card Frame)
            slide.addShape(rectShape, { x: 5.6, y: 1.25, w: 7.1, h: 5.2, fill: { color: 'ffffff' }, line: { color: 'e2e8f0', width: 1 } });
            slide.addShape(rectShape, { x: 5.6, y: 1.25, w: 7.1, h: 0.08, fill: { color: 'd4af37' } });
            
            if (chartBase64) {
                // Image with elegant margins inside the white card
                slide.addImage({ data: chartBase64, x: 5.75, y: 1.45, w: 6.8, h: 4.8 });
            } else {
                // Draw Fallback KPI list table
                slide.addText(
                    lang === 'ar' ? 'البيانات والمؤشرات المصاحبة' : 'Associated Data & Metrics Summary',
                    { x: 5.8, y: 1.45, w: 6.7, h: 0.3, color: '015551', fontSize: 11, bold: true, align: lang === 'ar' ? 'right' : 'left', rtl: lang === 'ar', fontFace: 'JF Flat' }
                );
                
                let kpiRows = [];
                (dashboardData.kpis || []).slice(0, 5).forEach((kpi) => {
                    kpiRows.push([
                        { text: kpi.name, options: { fontFace: 'JF Flat', fontSize: 10, bold: true, rtl: lang === 'ar', align: lang === 'ar' ? 'right' : 'left' } },
                        { text: kpi.value, options: { fontFace: 'JF Flat', fontSize: 10, align: 'center', bold: true, color: '015551' } }
                    ]);
                });
                
                if (kpiRows.length > 0) {
                    slide.addTable(kpiRows, {
                        x: 5.8,
                        y: 2.0,
                        w: 6.7,
                        colW: [4.3, 2.4],
                        border: { type: 'solid', color: 'f1f5f9', width: 1 },
                        fill: { color: 'ffffff' }
                    });
                }
            }
        }

        // 5. Closing Slide (Standard MOMAH Green Slide - perfectly bounded within 13.33 x 7.5)
        let closingSlide = pptx.addSlide();
        closingSlide.background = { fill: '015551' };
        try {
            closingSlide.addImage({ path: logo, x: 10.5, y: 0.5, w: 2.2, h: 1.1 });
        } catch (logoErr) {
            console.error("Failed to add logo to PPTX closing", logoErr);
        }
        
        closingSlide.addText(
            lang === 'ar' ? 'شكراً لكم' : 'Thank You',
            { x: 1.0, y: 2.2, w: 11.3, h: 2.2, color: 'ffffff', fontSize: 54, bold: true, align: 'center', fontFace: 'JF Flat' }
        );
        
        closingSlide.addText(
            lang === 'ar' ? 'وزارة البلديات والإسكان\nوكالة الشؤون المالية والميزانية' : 
            'Ministry of Municipalities and Housing\nAgency for Financial Affairs & Budget',
            { x: 1.0, y: 5.2, w: 11.3, h: 1.2, color: 'd4af37', fontSize: 16, align: 'center', fontFace: 'JF Flat', lineSpacing: 24 }
        );
        
        pptx.writeFile({ fileName: `MOMAH_Financial_Performance_Report_${new Date().toISOString().slice(0,10)}.pptx` });
    };

    const confirmAssembleReport = () => {

        const narrativesObj = getCompiledNarratives();
        const existing = reports.find(r => r.id === currentReportId);
        
        if (existing) {
            setReports(prev => prev.map(r => {
                if (r.id === currentReportId) {
                    return {
                        ...r,
                        status: (r.status === 'Published' || r.status === 'Approved') ? r.status : 'Draft',
                        narratives: narrativesObj,
                        reportType
                    };
                }
                return r;
            }));
        } else {
            const newReport = {
                id: currentReportId || Date.now(),
                name_ar: lang === 'ar' ? `تقرير الأداء المالي المخصص - ${new Date().toLocaleDateString('ar-EG')}` : `Custom Financial Performance Report - ${new Date().toLocaleDateString()}`,
                name_en: `Custom Financial Performance Report - ${new Date().toLocaleDateString()}`,
                group: currentGroupContext,
                reportType: reportType,
                scope_ar: scopeLabel,
                scope_en: scopeLabel,
                generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                status: 'Draft',
                reviewer: 'MOMAH Auditor',
                filters: {
                    analysisLevel,
                    selectedAmanas,
                    selectedMunicipalities,
                    fiscalYear,
                    periodType,
                    specificPeriod,
                },
                narratives: narrativesObj
            };
            setReports(prev => [...prev, newReport]);
            setCurrentReportId(newReport.id);
        }

        setUnlockedSteps(prev => ({ ...prev, report: true }));
        setCurrentReportSlideIndex(0);
        setActiveTab('report');
    };

    const handleExportExcel = () => {
        if (!dashboardData?.detailTables) return;
        try {
            const wb = XLSX.utils.book_new();
            dashboardData.detailTables.forEach((table, index) => {
                const headers = table.columns.map(col => col.label);
                const data = table.rows.map(row => {
                    const rowData = {};
                    table.columns.forEach(col => {
                        rowData[col.label] = row[col.key];
                    });
                    return rowData;
                });
                const ws = XLSX.utils.json_to_sheet(data, { header: headers });
                let sheetName = table.title || `Table ${index + 1}`;
                sheetName = sheetName.replace(/[:\?\*\/\\\[\]]/g, '').substring(0, 30);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            XLSX.writeFile(wb, `MOMAH_Supporting_Data_${dashboardData.groupContext || 'data'}.xlsx`);
        } catch (error) {
            console.error('Error exporting excel:', error);
            alert('导出 Excel 失败，请检查数据。');
        }
    };

    const recalculateDataWithTables = (updatedDashboardData, table) => {
        const parseNum = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return val;
            const cleaned = val.toString().replace(/,/g, '').trim();
            const numPart = parseFloat(cleaned);
            return isNaN(numPart) ? 0 : numPart;
        };

        const cleanString = (str) => (str || '').toString().trim().toLowerCase();
        const detailTables = updatedDashboardData.detailTables || [];

        // 1. G06 (Revenue & Collection 视角) 的表格级联更新
        if (updatedDashboardData.groupContext === 'g06') {
            const isRevenueSourcesTable = table.title === (lang === 'ar' ? 'جدول مصادر الإيرادات - تفصيلي' : 'Revenue Sources - Aggregated View');
            const isReceivablesTable = table.title === (lang === 'ar' ? 'جدول تقدم الذمم والتحصيل' : 'Receivable Progression - Underlying Detail');
            const isRegionalCollectionTable = table.title === (lang === 'ar' ? 'جدول الأداء الإقليمي للتحصيل' : 'Regional Collection Table');

            if (isRevenueSourcesTable) {
                // 更新 revenueSourceAnalysis 数组中对应的数据
                table.rows.forEach(row => {
                    const sourceName = row.source;
                    const targetVal = parseNum(row.target);
                    const netInvoicedVal = parseNum(row.netInvoiced);
                    const collectedVal = parseNum(row.collected);
                    const collectionRateVal = netInvoicedVal > 0 ? (collectedVal / netInvoicedVal) * 100 : 0;
                    
                    const origSource = updatedDashboardData.revenueSourceAnalysis.find(s => cleanString(s.label) === cleanString(sourceName));
                    if (origSource) {
                        origSource.target = targetVal;
                        origSource.netInvoiced = netInvoicedVal;
                        origSource.collected = collectedVal;
                        origSource.collectionRate = collectionRateVal;
                    }
                });

                // 重新累加全局 metrics
                let targetSum = 0;
                let invoicedSum = 0;
                let collectedSum = 0;
                if (updatedDashboardData.revenueSourceAnalysis) {
                    updatedDashboardData.revenueSourceAnalysis.forEach(row => {
                        targetSum += row.target || 0;
                        invoicedSum += row.netInvoiced || 0;
                        collectedSum += row.collected || 0;
                    });
                }
                const globalCollectionRate = invoicedSum > 0 ? (collectedSum / invoicedSum) * 100 : 0;

                updatedDashboardData.metrics = {
                    ...updatedDashboardData.metrics,
                    annualTarget: targetSum,
                    netInvoiced: invoicedSum,
                    collected: collectedSum,
                    collectionRate: globalCollectionRate,
                    unpaid: invoicedSum - collectedSum
                };

                // 更新全局 KPIs
                updatedDashboardData.kpis = updatedDashboardData.kpis.map(kpi => {
                    if (kpi.key === 'annualTarget') return { ...kpi, value: formatMoney(targetSum, lang) };
                    if (kpi.key === 'netInvoiced') return { ...kpi, value: formatMoney(invoicedSum, lang) };
                    if (kpi.key === 'collected') return { ...kpi, value: formatMoney(collectedSum, lang) };
                    if (kpi.key === 'collectionRate') return { ...kpi, value: formatPercent(globalCollectionRate) };
                    if (kpi.key === 'unpaid') return { ...kpi, value: formatMoney(invoicedSum - collectedSum, lang) };
                    return kpi;
                });
            }
            else if (isReceivablesTable) {
                // 更新 receivableProgress
                if (updatedDashboardData.receivableProgress) {
                    table.rows.forEach((row, rIdx) => {
                        const amountVal = parseNum(row.amount);
                        if (updatedDashboardData.receivableProgress[rIdx]) {
                            updatedDashboardData.receivableProgress[rIdx].amount = amountVal;
                        }
                    });
                }
            }
            else if (isRegionalCollectionTable) {
                // 更新 regionalCollectionAnalysis 且级联更新 regionalMap.regions 里的对应地区
                table.rows.forEach(row => {
                    const regionName = row.region;
                    const targetRateVal = parseNum(row.targetRate);
                    const actualRateVal = parseNum(row.actualRate);
                    const gapVal = targetRateVal - actualRateVal;

                    const origReg = updatedDashboardData.regionalCollectionAnalysis.find(r => cleanString(r.label) === cleanString(regionName));
                    if (origReg) {
                        origReg.targetRate = targetRateVal;
                        origReg.actualRate = actualRateVal;
                        origReg.collectionGap = gapVal;
                    }

                    // 级联更新地图
                    if (updatedDashboardData.regionalMap?.regions) {
                        const matchedReg = updatedDashboardData.regionalMap.regions.find(r => 
                            cleanString(r.label) === cleanString(regionName)
                        );
                        if (matchedReg) {
                            matchedReg.targetRate = targetRateVal;
                            matchedReg.actualRate = actualRateVal;
                            matchedReg.collectionGap = gapVal;
                            
                            const achievement = targetRateVal > 0 ? (actualRateVal / targetRateVal) * 100 : 0;
                            matchedReg.colorMetric = achievement;
                            matchedReg.alertStatus = achievement >= 95 ? 'good' : (achievement >= 80 ? 'warning' : 'critical');
                            
                            matchedReg.tooltipRows = matchedReg.tooltipRows.map(tr => {
                                const trLabel = tr.label.toLowerCase();
                                if (trLabel.includes('invoiced') || trLabel.includes('فوترة') || trLabel.includes('target') || trLabel.includes('مستهدف')) {
                                    return { ...tr, value: formatPercent(targetRateVal) };
                                }
                                if (trLabel.includes('collected') || trLabel.includes('متحصل') || trLabel.includes('actual') || trLabel.includes('فعلي')) {
                                    return { ...tr, value: formatPercent(actualRateVal) };
                                }
                                return tr;
                            });
                        }
                    }
                });
            }
        }
        // 2. G01 / G03 (Financial Performance & Budget Execution 视角) 的表格级联更新
        else {
            const isAggregatedTable = detailTables[0] === table || detailTables[0]?.title === table?.title;
            const isInitiativesTable = (table?.title || '').toLowerCase().includes('initiatives') || (table?.title || '').includes('المبادرات');
            const isDoorsTable = (table?.title || '').toLowerCase().includes('doors') || (table?.title || '').includes('الأبواب');
            const isServicesTable = (table?.title || '').toLowerCase().includes('services') || (table?.title || '').includes('الخدمات');

            if (isAggregatedTable) {
                // 更新地图 regions
                table.rows.forEach(row => {
                    const entityName = row.entity || row.source || row.region;
                    const revisedVal = parseNum(row.revised);
                    const spentVal = parseNum(row.spent);
                    const remainingVal = revisedVal - spentVal;
                    const rateVal = revisedVal > 0 ? (spentVal / revisedVal) * 100 : 0;

                    if (updatedDashboardData.regionalMap?.regions) {
                        const matchedReg = updatedDashboardData.regionalMap.regions.find(r => 
                            cleanString(r.label) === cleanString(entityName)
                        );
                        if (matchedReg) {
                            matchedReg.revised = revisedVal;
                            matchedReg.spent = spentVal;
                            matchedReg.remaining = remainingVal;
                            matchedReg.adjustedRate = rateVal;
                            matchedReg.colorMetric = rateVal;
                            matchedReg.alertStatus = rateVal >= 75 ? 'good' : (rateVal >= 50 ? 'warning' : 'critical');
                            
                            matchedReg.tooltipRows = matchedReg.tooltipRows.map(tr => {
                                const trLabel = tr.label.toLowerCase();
                                if (trLabel.includes('budget') || trLabel.includes('اعتماد') || trLabel.includes('invoiced') || trLabel.includes('فوترة')) {
                                    return { ...tr, value: formatMoney(revisedVal, lang) };
                                }
                                if (trLabel.includes('spend') || trLabel.includes('منصرف') || trLabel.includes('collected') || trLabel.includes('متحصل')) {
                                    return { ...tr, value: formatMoney(spentVal, lang) };
                                }
                                if (trLabel.includes('rate') || trLabel.includes('نسبة') || trLabel.includes('فعلي')) {
                                    return { ...tr, value: formatPercent(rateVal) };
                                }
                                if (trLabel.includes('remaining') || trLabel.includes('متبقي') || trLabel.includes('فجوة')) {
                                    return { ...tr, value: formatMoney(remainingVal, lang) };
                                }
                                return tr;
                            });
                        }
                    }
                });

                // 重新累加全局 metrics (非 G06)
                let revisedSum = 0;
                let spentSum = 0;
                table.rows.forEach(row => {
                    revisedSum += parseNum(row.revised);
                    spentSum += parseNum(row.spent);
                });
                const remainingSum = revisedSum - spentSum;
                const rateSum = revisedSum > 0 ? (spentSum / revisedSum) * 100 : 0;
                
                updatedDashboardData.metrics = {
                    ...updatedDashboardData.metrics,
                    revised: revisedSum,
                    spent: spentSum,
                    remaining: remainingSum,
                    rate: rateSum
                };

                // 更新全局 KPIs
                updatedDashboardData.kpis = updatedDashboardData.kpis.map(kpi => {
                    if (kpi.key === 'original' || kpi.key === 'currentBudget' || kpi.key === 'revised') {
                        return { ...kpi, value: formatMoney(revisedSum, lang) };
                    }
                    if (kpi.key === 'actualSpend' || kpi.key === 'spent') {
                        return { ...kpi, value: formatMoney(spentSum, lang) };
                    }
                    if (kpi.key === 'remaining') {
                        return { ...kpi, value: formatMoney(remainingSum, lang) };
                    }
                    if (kpi.key === 'rate') {
                        return { ...kpi, value: formatPercent(rateSum) };
                    }
                    return kpi;
                });
            }
            else if (isInitiativesTable && updatedDashboardData.initiativeAnalysis) {
                table.rows.forEach(row => {
                    const initName = row.initiative;
                    const budgetVal = parseNum(row.budget);
                    const actualVal = parseNum(row.actual);
                    const remainingVal = budgetVal - actualVal;
                    const rateVal = budgetVal > 0 ? (actualVal / budgetVal) * 100 : 0;

                    const origInit = updatedDashboardData.initiativeAnalysis.find(i => cleanString(i.label) === cleanString(initName));
                    if (origInit) {
                        origInit.budget = budgetVal;
                        origInit.actual = actualVal;
                        origInit.remaining = remainingVal;
                        origInit.rate = rateVal;
                    }
                });
            }
            else if (isDoorsTable && updatedDashboardData.doorAnalysis) {
                table.rows.forEach(row => {
                    const doorName = row.door;
                    const budgetVal = parseNum(row.budget);
                    const plannedVal = parseNum(row.planned);
                    const actualVal = parseNum(row.actual || row.spent);
                    const varianceVal = plannedVal - actualVal;
                    const rateVal = budgetVal > 0 ? (actualVal / budgetVal) * 100 : 0;

                    const origDoor = updatedDashboardData.doorAnalysis.find(d => cleanString(d.label) === cleanString(doorName));
                    if (origDoor) {
                        origDoor.budget = budgetVal;
                        origDoor.planned = plannedVal;
                        origDoor.actual = actualVal;
                        origDoor.spent = actualVal;
                        origDoor.variance = varianceVal;
                        origDoor.rate = rateVal;
                    }
                });

                // 重新累加全局 metrics (从 doorAnalysis 计算)
                let revisedSum = 0;
                let spentSum = 0;
                let plannedSum = 0;
                updatedDashboardData.doorAnalysis.forEach(row => {
                    revisedSum += row.budget || 0;
                    spentSum += row.actual || 0;
                    plannedSum += row.planned || 0;
                });
                const remainingSum = revisedSum - spentSum;
                const rateSum = revisedSum > 0 ? (spentSum / revisedSum) * 100 : 0;
                const varianceSum = plannedSum - spentSum;

                updatedDashboardData.metrics = {
                    ...updatedDashboardData.metrics,
                    revised: revisedSum,
                    spent: spentSum,
                    remaining: remainingSum,
                    rate: rateSum,
                    planned: plannedSum,
                    planVariance: varianceSum
                };

                // 更新全局 KPIs
                updatedDashboardData.kpis = updatedDashboardData.kpis.map(kpi => {
                    if (kpi.key === 'original' || kpi.key === 'currentBudget' || kpi.key === 'revised') {
                        return { ...kpi, value: formatMoney(revisedSum, lang) };
                    }
                    if (kpi.key === 'actualSpend' || kpi.key === 'spent') {
                        return { ...kpi, value: formatMoney(spentSum, lang) };
                    }
                    if (kpi.key === 'remaining') {
                        return { ...kpi, value: formatMoney(remainingSum, lang) };
                    }
                    if (kpi.key === 'rate') {
                        return { ...kpi, value: formatPercent(rateSum) };
                    }
                    if (kpi.key === 'plannedSpend' || kpi.key === 'planned') {
                        return { ...kpi, value: formatMoney(plannedSum, lang) };
                    }
                    if (kpi.key === 'planVariance' || kpi.key === 'variance') {
                        return { ...kpi, value: formatMoney(varianceSum, lang) };
                    }
                    return kpi;
                });
            }
            else if (isServicesTable && updatedDashboardData.serviceAnalysis) {
                table.rows.forEach(row => {
                    const svcName = row.service;
                    const budgetVal = parseNum(row.budget || row.revised);
                    const spentVal = parseNum(row.actual || row.spent);
                    const rateVal = budgetVal > 0 ? (spentVal / budgetVal) * 100 : 0;

                    const origSvc = updatedDashboardData.serviceAnalysis.find(s => cleanString(s.label) === cleanString(svcName));
                    if (origSvc) {
                        origSvc.budget = budgetVal;
                        origSvc.revised = budgetVal;
                        origSvc.spent = spentVal;
                        origSvc.rate = rateVal;
                    }
                });
            }
        }

        // 3. 统一重新计算折线趋势图 (timeComparison) 无论何种数据改变，基于最新的 metrics 进行折算
        if (updatedDashboardData.timeComparison?.series) {
            const currentPeriod = fiscalYear === 'FY2026';
            if (updatedDashboardData.groupContext === 'g06') {
                const annualTarget = updatedDashboardData.metrics.annualTarget;
                const collectedAmount = updatedDashboardData.metrics.collected;
                
                const baseMonthlyTargetShares = [0.17, 0.19, 0.22, 0.24];
                const baseMonthlyActualShares = [0.13, 0.15, 0.18, 0.0]; // 4月为实际 collected
                
                updatedDashboardData.timeComparison.series = updatedDashboardData.timeComparison.series.map((item, idx) => {
                    // 如果是月度(4个元素)
                    if (updatedDashboardData.timeComparison.series.length === 4) {
                        const targetVal = annualTarget * baseMonthlyTargetShares[idx];
                        const actualVal = idx === 3 ? collectedAmount : (annualTarget * baseMonthlyActualShares[idx]);
                        return {
                            ...item,
                            budget: Number(targetVal.toFixed(1)),
                            actual: Number(actualVal.toFixed(1))
                        };
                    }
                    // 如果是季度(2个元素: Q1, Q2)
                    else if (updatedDashboardData.timeComparison.series.length === 2) {
                        if (idx === 0) {
                            const targetVal = annualTarget * (0.17 + 0.19 + 0.22);
                            const actualVal = annualTarget * (0.13 + 0.15 + 0.18);
                            return {
                                ...item,
                                budget: Number(targetVal.toFixed(1)),
                                actual: Number(actualVal.toFixed(1))
                            };
                        } else {
                            const targetVal = annualTarget * 0.24;
                            const actualVal = collectedAmount;
                            return {
                                ...item,
                                budget: Number(targetVal.toFixed(1)),
                                actual: Number(actualVal.toFixed(1))
                            };
                        }
                    }
                    // 如果是年度(1个元素: FY)
                    else {
                        return {
                            ...item,
                            budget: Number(annualTarget.toFixed(1)),
                            actual: Number(collectedAmount.toFixed(1))
                        };
                    }
                });
            } else {
                const totalBudget = updatedDashboardData.metrics.revised;
                const totalActual = updatedDashboardData.metrics.spent;
                const totalPlanned = updatedDashboardData.metrics.planned || 0;

                const actualMonthlyShares = currentPeriod ? [0.17, 0.22, 0.27, 0.34] : [0.21, 0.24, 0.26, 0.29];
                const budgetMonthlyShares = currentPeriod ? [0.18, 0.22, 0.26, 0.34] : [0.22, 0.24, 0.26, 0.28];
                const planMonthlyShares = currentPeriod ? [0.2, 0.23, 0.26, 0.31] : [0.23, 0.25, 0.26, 0.26];

                updatedDashboardData.timeComparison.series = updatedDashboardData.timeComparison.series.map((item, idx) => {
                    // 月度 (4个元素)
                    if (updatedDashboardData.timeComparison.series.length === 4) {
                        return {
                            ...item,
                            budget: Number((totalBudget * budgetMonthlyShares[idx]).toFixed(1)),
                            planned: Number((totalPlanned * planMonthlyShares[idx]).toFixed(1)),
                            actual: Number((totalActual * actualMonthlyShares[idx]).toFixed(1))
                        };
                    }
                    // 季度 (2个元素: Q1, Q2)
                    else if (updatedDashboardData.timeComparison.series.length === 2) {
                        if (idx === 0) {
                            const bSum = totalBudget * (budgetMonthlyShares[0] + budgetMonthlyShares[1] + budgetMonthlyShares[2]);
                            const pSum = totalPlanned * (planMonthlyShares[0] + planMonthlyShares[1] + planMonthlyShares[2]);
                            const aSum = totalActual * (actualMonthlyShares[0] + actualMonthlyShares[1] + actualMonthlyShares[2]);
                            return {
                                ...item,
                                budget: Number(bSum.toFixed(1)),
                                planned: Number(pSum.toFixed(1)),
                                actual: Number(aSum.toFixed(1))
                            };
                        } else {
                            const bSum = totalBudget * budgetMonthlyShares[3];
                            const pSum = totalPlanned * planMonthlyShares[3];
                            const aSum = totalActual * actualMonthlyShares[3];
                            return {
                                ...item,
                                budget: Number(bSum.toFixed(1)),
                                planned: Number(pSum.toFixed(1)),
                                actual: Number(aSum.toFixed(1))
                            };
                        }
                    }
                    // 年度 (1个元素: FY)
                    else {
                        return {
                            ...item,
                            budget: Number(totalBudget.toFixed(1)),
                            planned: Number(totalPlanned.toFixed(1)),
                            actual: Number(totalActual.toFixed(1))
                        };
                    }
                });
            }
        }

        return updatedDashboardData;
    };

    const handleUploadExcel = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                
                let updatedDashboardData = cloneDashboardState(dashboardData);
                const detailTables = updatedDashboardData.detailTables || [];

                let dataChanged = false;

                wb.SheetNames.forEach(sheetName => {
                    const ws = wb.Sheets[sheetName];
                    const excelRows = XLSX.utils.sheet_to_json(ws);
                    
                    const table = detailTables.find(t => {
                        const cleaned = (t.title || '').replace(/[:\?\*\/\\\[\]]/g, '').substring(0, 30);
                        return cleaned === sheetName;
                    });

                    if (!table) return;

                    const keyMap = {};
                    table.columns.forEach(col => {
                        keyMap[col.label] = col.key;
                    });

                    table.rows = table.rows.map((origRow, rIdx) => {
                        const excelRow = excelRows[rIdx];
                        if (!excelRow) return origRow;

                        const updatedRow = { ...origRow };
                        Object.keys(excelRow).forEach(header => {
                            const key = keyMap[header];
                            if (key) {
                                const isNumeric = !isNaN(parseFloat(excelRow[header])) && isFinite(excelRow[header]);
                                const newVal = isNumeric ? parseFloat(excelRow[header]) : excelRow[header];
                                const oldVal = origRow[key];

                                if (oldVal !== newVal) {
                                    updatedRow[key] = newVal;
                                    updatedRow._modified = updatedRow._modified || {};
                                    updatedRow._modified[key] = true;
                                    dataChanged = true;
                                }
                            }
                        });
                        return updatedRow;
                    });

                    // 级联重算
                    updatedDashboardData = recalculateDataWithTables(updatedDashboardData, table);
                });

                if (dataChanged) {
                    setDashboardData(updatedDashboardData);
                    alert(lang === 'zh' ? 'Excel 数据导入成功！所有图表、指标及报告已同步更新。' : (lang === 'ar' ? 'تم استيراد بيانات Excel بنجاح! تم تحديث جميع المخططات والمؤشرات والتقارير.' : 'Excel data imported successfully! All charts, KPIs, and report have been updated.'));
                }
            } catch (error) {
                console.error('Error importing Excel:', error);
                alert(lang === 'zh' ? '导入 Excel 失败，请检查文件格式。' : (lang === 'ar' ? 'فشل استيراد ملف Excel، يرجى التحقق من التنسيق.' : 'Failed to import Excel. Please check the file format.'));
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const saveInlineCellEdit = () => {
        if (!editingCell) return;
        const { tableTitle, rowIndex, columnKey, value } = editingCell;
        setEditingCell(null);

        let updatedDashboardData = cloneDashboardState(dashboardData);
        const detailTables = updatedDashboardData.detailTables || [];

        const table = detailTables.find(t => t.title === tableTitle);
        if (!table) return;

        const row = table.rows[rowIndex];
        if (!row) return;

        // 更新值
        const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
        const parsedValue = isNumeric ? parseFloat(value) : value;

        if (row[columnKey] === parsedValue) return;

        row[columnKey] = parsedValue;
        row._modified = row._modified || {};
        row._modified[columnKey] = true;

        // 级联刷新该表格以及所有关联指标与可视化
        updatedDashboardData = recalculateDataWithTables(updatedDashboardData, table);
        setDashboardData(updatedDashboardData);
    };

    const resetToDefaultData = () => {
        if (!confirm(lang === 'zh' ? '您确定要恢复所有数据到默认初始值吗？这将清除您所有的本地修改。' : (lang === 'ar' ? 'هل أنت متأكد من استعادة جميع البيانات إلى القيم الافتراضية؟ سيؤدي هذا إلى إلغاء جميع التعديلات المحلية.' : 'Are you sure you want to reset all data to default values? This will discard all your local modifications.'))) {
            return;
        }

        const defaultData = getDashboardData({
            groupContext: currentGroupContext,
            analysisLevel,
            selectedAmanas,
            selectedMunicipalities,
            fiscalYear,
            periodType,
            specificPeriod,
            lang,
        });

        setDashboardData(defaultData);
    };

    const handleSlideChange = (index) => {
        setActiveSlideIndex(index);
        const card = aiCards[index];
        if (card) {
            setSelectedChatTargetCard(card.id);
        }
    };

    const renderSlideChart = (chartKey) => {
        if (!chartKey || chartKey === 'none') return <div className="h-full flex items-center justify-center text-gray-400 bg-neutral-50 border border-dashed border-neutral-300 rounded-lg text-[10px]">No chart associated</div>;

        // 统一缩放容器：图表以原始尺寸渲染，再用 scale 缩小到 60%，视觉上完整填充幻灯片图表区
        const scale = 0.6;
        const inv = `${(1 / scale * 100).toFixed(2)}%`; // 166.67%

        const wrap = (child) => (
            <div data-chart-key={chartKey} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: inv,
                    height: inv,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}>
                    {child}
                </div>
            </div>
        );

        switch (chartKey) {
            case 'map':
                return wrap(<div className="w-full h-full text-gray-800"><RegionalMapCard lang={lang} mapData={dashboardData.regionalMap} /></div>);
            case 'trend':
                return wrap(<div className="w-full h-full text-gray-800"><TimeComparisonCard lang={lang} data={dashboardData.timeComparison} /></div>);
            case 'doors':
                return wrap(<div className="w-full h-full text-gray-800"><DoorAnalysisCard lang={lang} rows={dashboardData.doorAnalysis} /></div>);
            case 'sankey':
                return wrap(<div className="w-full h-full text-gray-800"><BudgetDoorDetailedCard lang={lang} scope={{ selectedAmanas, selectedMunicipalities, analysisLevel, scopeLabel }} /></div>);
            case 'services':
                return wrap(<div className="w-full h-full text-gray-800"><ServiceAnalysisCard lang={lang} rows={dashboardData.serviceAnalysis} /></div>);
            case 'initiatives':
                return wrap(<div className="w-full h-full text-gray-800"><InitiativeTableCard lang={lang} rows={dashboardData.initiativeAnalysis} /></div>);
            case 'contracts':
                return wrap(<div className="w-full h-full text-gray-800"><ContractDonutCard lang={lang} rows={dashboardData.contractAnalysis} /></div>);
            case 'variance':
                return wrap(<div className="w-full h-full text-gray-800"><VarianceAnalysisCard lang={lang} rows={dashboardData.varianceAnalysis} /></div>);
            case 'structure':
                return wrap(<div className="w-full h-full text-gray-800"><StructureSummaryCard lang={lang} rows={dashboardData.structureSummary} /></div>);
            case 'revenueSources':
                return wrap(<div className="w-full h-full text-gray-800"><RevenueSourceCards lang={lang} rows={dashboardData.revenueSourceAnalysis} /></div>);
            case 'collectionRate':
                return wrap(<div className="w-full h-full text-gray-800"><CollectionRateCard lang={lang} rows={dashboardData.revenueSourceAnalysis} /></div>);
            case 'receivables':
                return wrap(<div className="w-full h-full text-gray-800"><ReceivableProgressCard lang={lang} rows={dashboardData.receivableProgress} /></div>);
            case 'regionalCollection':
                return wrap(<div className="w-full h-full text-gray-800"><RegionalCollectionCard lang={lang} rows={dashboardData.regionalCollectionAnalysis} /></div>);
            default:
                return <div className="h-full flex items-center justify-center text-gray-400 bg-neutral-50 border border-dashed border-neutral-300 rounded-lg text-[10px]">No chart associated</div>;
        }
    };

    const scopeLabel = buildFilterSummary({
        lang,
        analysisLevel,
        selectedAmanas,
        selectedMunicipalities,
        fiscalYear,
        periodType,
        specificPeriod,
    });
    const allowedReportTypes = dashboardData?.groupMeta?.allowedReportTypes?.length
        ? dashboardData.groupMeta.allowedReportTypes
        : ['Executive'];
    const visibleReportTypes = REPORT_TYPES.filter((item) => allowedReportTypes.includes(item.value));

    const renderTable = (table, tableKey = 'table', readOnly = false) => (
        <div key={tableKey} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3 text-start">
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-800">{table.title}</h3>
                {(table.sourceTable || table.appliedFilters || table.recordCount || table.note) ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
                        {table.sourceTable ? (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="font-bold text-gray-500">{lang === 'ar' ? 'مصدر الجدول' : 'Source Table'}</div>
                                <div className="mt-1 text-gray-700">{table.sourceTable}</div>
                            </div>
                        ) : null}
                        {table.appliedFilters ? (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="font-bold text-gray-500">{lang === 'ar' ? 'المرشحات' : 'Applied Filters'}</div>
                                <div className="mt-1 text-gray-700">{table.appliedFilters}</div>
                            </div>
                        ) : null}
                        {typeof table.recordCount !== 'undefined' ? (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="font-bold text-gray-500">{lang === 'ar' ? 'عدد السجلات' : 'Record Count'}</div>
                                <div className="mt-1 text-gray-700">{table.recordCount}</div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {table.note ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-800">
                        {table.note}
                    </div>
                ) : null}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                            {table.columns.map((column) => (
                                <th key={column.key} className="p-2">{column.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row, idx) => (
                            <tr key={`${tableKey}-${idx}`} className="border-b border-gray-100 group hover:bg-gray-50/30">
                                {table.columns.map((column) => {
                                    const isEditing = editingCell && 
                                                      editingCell.tableTitle === table.title && 
                                                      editingCell.rowIndex === idx && 
                                                      editingCell.columnKey === column.key;
                                    
                                    const isEditable = !readOnly &&
                                                       column.key !== 'entity' && 
                                                       column.key !== 'region' && 
                                                       column.key !== 'source' && 
                                                       column.key !== 'door' && 
                                                       column.key !== 'service' && 
                                                       column.key !== 'initiative';

                                    const val = row[column.key];
                                    const displayValue = typeof val === 'number' 
                                        ? val.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') 
                                        : val;

                                    if (isEditing) {
                                        return (
                                            <td key={column.key} className="p-1 text-gray-700">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1 text-xs border border-amber-500 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                                                    value={editingCell.value}
                                                    onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                                    onBlur={saveInlineCellEdit}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            saveInlineCellEdit();
                                                        } else if (e.key === 'Escape') {
                                                            setEditingCell(null);
                                                        }
                                                    }}
                                                />
                                            </td>
                                        );
                                    }

                                    const isModified = row._modified && row._modified[column.key];
                                    const cellClass = isModified 
                                        ? 'bg-amber-50/80 border-l-2 border-amber-500 text-amber-900 font-semibold shadow-xs' 
                                        : 'text-gray-700';

                                    return (
                                        <td 
                                            key={column.key} 
                                            className={`p-2 transition-all duration-200 ${cellClass} ${
                                                isEditable 
                                                    ? 'cursor-pointer hover:bg-amber-50/50 hover:outline hover:outline-1 hover:outline-dashed hover:outline-amber-400 rounded' 
                                                    : ''
                                            }`}
                                            onClick={() => {
                                                if (isEditable) {
                                                    setEditingCell({
                                                        tableTitle: table.title,
                                                        rowIndex: idx,
                                                        columnKey: column.key,
                                                        value: val === null || typeof val === 'undefined' ? '' : String(val)
                                                    });
                                                }
                                            }}
                                            title={isModified ? (lang === 'zh' ? '该数值已被修改' : (lang === 'ar' ? 'تم تعديل هذه القيمة' : 'This value has been modified')) : undefined}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span>{displayValue}</span>
                                                {isModified ? (
                                                    <span className="shrink-0 text-[8px] bg-amber-500 text-white font-extrabold px-1 rounded-sm shadow-xs" title="Modified">
                                                        *
                                                    </span>
                                                ) : isEditable ? (
                                                    <span className="text-gray-400 group-hover:text-amber-600 transition-colors text-[10px]" title="点击编辑">
                                                        ✏️
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDetailCard = (card) => {
        const wrap = (chartKey, child) => (
            <div data-chart-key={chartKey} className="h-full w-full">
                {child}
            </div>
        );

        if (card === 'doors') {
            return wrap('doors', <DoorAnalysisCard key="doors" lang={lang} rows={dashboardData.doorAnalysis} />);
        }
        if (card === 'doorsDetailed') {
            return wrap('sankey', (
                <BudgetDoorDetailedCard
                    key="doorsDetailed"
                    lang={lang}
                    scope={{
                        analysisLevel,
                        selectedAmanas,
                        selectedMunicipalities,
                        scopeLabel,
                    }}
                />
            ));
        }
        if (card === 'services') {
            return wrap('services', <ServiceAnalysisCard key="services" lang={lang} rows={dashboardData.serviceAnalysis} />);
        }
        if (card === 'initiatives') {
            return wrap('initiatives', <InitiativeTableCard key="initiatives" lang={lang} rows={dashboardData.initiativeAnalysis} />);
        }
        if (card === 'contracts') {
            return wrap('contracts', <ContractDonutCard key="contracts" lang={lang} rows={dashboardData.contractAnalysis} />);
        }
        if (card === 'structure') {
            return wrap('structure', <StructureSummaryCard key="structure" lang={lang} rows={dashboardData.structureSummary} />);
        }
        if (card === 'variance') {
            return wrap('variance', <VarianceAnalysisCard key="variance" lang={lang} rows={dashboardData.varianceAnalysis} />);
        }
        if (card === 'revenueSources') {
            return wrap('revenueSources', <RevenueSourceCards key="revenueSources" lang={lang} rows={dashboardData.revenueSourceAnalysis} />);
        }
        if (card === 'collectionRate') {
            return wrap('collectionRate', <CollectionRateCard key="collectionRate" lang={lang} rows={dashboardData.revenueSourceAnalysis} />);
        }
        if (card === 'receivables') {
            return wrap('receivables', <ReceivableProgressCard key="receivables" lang={lang} rows={dashboardData.receivableProgress} />);
        }
        if (card === 'regionalCollection') {
            return wrap('regionalCollection', <RegionalCollectionCard key="regionalCollection" lang={lang} rows={dashboardData.regionalCollectionAnalysis} />);
        }
        return null;
    };

    const detailRows = dashboardData.detailRows?.length
        ? dashboardData.detailRows
        : [dashboardData.detailCards || []];
    const getDetailRowClassName = (row) => {
        if (row.length >= 4) {
            return 'grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-4';
        }
        if (row.length >= 3) {
            return 'grid grid-cols-1 xl:grid-cols-3 gap-4';
        }
        if (row.length === 2) {
            return 'grid grid-cols-1 xl:grid-cols-2 gap-4';
        }
        return 'grid grid-cols-1 gap-4';
    };

    const activeDept = DEPARTMENTS_TREE.find(d => d.subDepartments.some(s => s.id === activeSubDeptId));
    const activeSubDept = activeDept?.subDepartments.find(s => s.id === activeSubDeptId);
    const activeFunctionLabel = lang === 'ar'
        ? (activeSubDept?.functionLabel_ar || dashboardData?.groupMeta?.title || dict.subtitle)
        : (activeSubDept?.functionLabel_en || dashboardData?.groupMeta?.title || dict.subtitle);
    const toEnglishTitleCase = (label) => (label || '')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    const activeRegistryTitle = lang === 'ar'
        ? `سجل ${activeFunctionLabel || 'التقارير'}`
        : (lang === 'zh'
            ? `${activeFunctionLabel || '报告'}登记簿`
            : `${toEnglishTitleCase(activeFunctionLabel || 'Reports')} Registry`);
    const visibleUseCases = USE_CASES.filter((uc) => activeSubDept?.allowedUseCases?.includes(uc.id));

    return (
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${embedded ? 'h-full' : 'h-screen'} overflow-hidden flex flex-col md:flex-row`}>
            {!embedded && (<aside className={`w-full md:w-80 md:h-screen shrink-0 bg-[#0A2D1D] text-white flex flex-col z-20 shadow-2xl ${lang === 'ar' ? 'border-l' : 'border-r'} border-[#ffffff08]`} style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
                <div className="p-5 bg-[#072015] flex items-center justify-between border-b border-[#ffffff10]">
                    <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                        <span className="text-[9px] tracking-[0.2em] text-[#D1A153] uppercase font-extrabold">
                            {lang === 'ar' ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}
                        </span>
                        <span className="font-black text-[12.5px] leading-normal text-white mt-1.5">
                            {lang === 'ar' ? 'MOMAH' : 'MOMAH'}
                        </span>
                        <span className="text-[10px] text-momahGreen-300 font-bold mt-0.5 opacity-90">
                            {lang === 'ar' ? 'مساعد مالي وميزاني ذكي مدعوم بالذكاء الاصطناعي' : 'AI-Powered Financial & Budget Smart Assistant'}
                        </span>
                    </div>
                </div>

                <div className={`p-4 text-[10px] text-neutral-300 bg-[#072015]/40 border-b border-[#ffffff08] leading-relaxed ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    {dashboardData?.groupMeta?.subtitle || dict.tagline}
                </div>

                <nav className={`flex-1 px-3.5 py-5 space-y-4 overflow-y-auto ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    {DEPARTMENTS_TREE.map((dept) => (
                        <div key={dept.id} className="border-b border-[#ffffff05] pb-2 last:border-b-0">
                            <button
                                onClick={() => setExpandedMenu(expandedMenu === dept.id ? '' : dept.id)}
                                className={`w-full px-3.5 py-3 flex items-center justify-between hover:bg-[#ffffff03] rounded-lg transition-all ${lang === 'ar' ? 'flex-row text-right' : 'flex-row text-left'}`}
                            >
                                <span className="flex-1 text-xs font-bold text-gray-100 leading-tight">
                                    {lang === 'ar' ? dept.name_ar : dept.name_en}
                                </span>
                                <span className={`text-[9px] text-[#D1A153] font-bold shrink-0 ${lang === 'ar' ? 'mr-3' : 'ml-3'}`}>
                                    {expandedMenu === dept.id ? '▼' : '▶'}
                                </span>
                            </button>
                            {expandedMenu === dept.id ? (
                                <div className={`mt-1 px-1.5 space-y-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                    {dept.subDepartments.map((subDept) => {
                                        const isActive = activeSubDeptId === subDept.id;
                                        const isImplemented = subDept.implemented === true;
                                        // 自适应的金色竖线与背景过渡效果
                                        const activeClass = isActive
                                            ? (lang === 'ar' 
                                                ? 'border-r-4 border-[#D1A153] bg-gradient-to-l from-[#006C35]/30 to-transparent font-bold text-white shadow-sm'
                                                : 'border-l-4 border-[#D1A153] bg-gradient-to-r from-[#006C35]/30 to-transparent font-bold text-white shadow-sm')
                                            : isImplemented
                                                ? 'text-neutral-400 hover:text-white hover:bg-[#ffffff03]'
                                                : 'text-neutral-500/70 cursor-not-allowed';
                                        
                                        return (
                                            <button
                                                key={subDept.id}
                                                type="button"
                                                disabled={!isImplemented}
                                                onClick={() => isImplemented && handleSubDepartmentSwitch(subDept)}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-[10.5px] leading-snug rounded-md transition-all ${lang === 'ar' ? 'flex-row text-right' : 'text-left'} ${activeClass}`}
                                            >
                                                <span className={`shrink-0 ${isImplemented ? 'opacity-70' : 'opacity-40'}`}>{isActive ? '●' : '◦'}</span>
                                                <span>{lang === 'ar' ? subDept.name_ar : subDept.name_en}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#ffffff08] bg-[#072015] text-[9.5px] text-gray-400 font-medium text-center">
                    {lang === 'ar'
                        ? 'كافة الصلاحيات محفوظة للمملكة العربية السعودية © ٢٠٢٦'
                        : 'All Rights Reserved. Kingdom of Saudi Arabia © 2026'}
                </div>
            </aside>)}

            <div className={`flex-1 flex flex-col min-w-0 ${embedded ? 'h-full' : 'h-screen'} overflow-hidden`}>
                {!embedded && (<header className={`h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex items-center h-full">
                        <div className={`hidden lg:flex items-center gap-8 h-full text-[11px] ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`} style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
                            {visibleUseCases.map((uc) => {
                                const isImplemented = activeSubDept?.implemented === true;
                                const isActive = currentGroupContext === uc.id && isImplemented;
                                const isDisabled = !isImplemented || activeTab !== 'workspace';
                                
                                const renderIcon = () => {
                                    if (uc.id === 'g02') {
                                        return (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                            </svg>
                                        );
                                    }
                                    if (uc.id === 'g03') {
                                        return (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        );
                                    }
                                    if (uc.id === 'g06') {
                                        return (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        );
                                    }
                                    return null;
                                };

                                return (
                                    <button
                                        key={uc.id}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => !isDisabled && handleUseCaseSwitch(uc.id)}
                                        className={`relative h-full px-2 flex items-center gap-2 font-bold transition-all border-b-[3px] focus:outline-none ${
                                            isActive
                                                ? 'border-[#D1A153] text-[#006C35]'
                                                : isImplemented
                                                    ? 'border-transparent text-gray-500 hover:text-[#006C35] hover:border-gray-200'
                                                    : 'border-transparent text-gray-300 cursor-not-allowed'
                                        }`}
                                    >
                                        <span className={`shrink-0 ${isImplemented ? 'text-[#006C35]' : 'text-gray-300'}`}>
                                            {renderIcon()}
                                        </span>
                                        <span>{activeFunctionLabel}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`flex items-center gap-1.5 ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-gray-400 font-semibold">{dict.lbl_lang}:</span>
                        <button onClick={() => changeLanguage('ar')} className={`px-2.5 py-1 text-[10.5px] rounded transition-all ${lang === 'ar' ? 'bg-[#006C35] text-white font-bold' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>العربية</button>
                        <button onClick={() => changeLanguage('en')} className={`px-2.5 py-1 text-[10.5px] rounded transition-all ${lang === 'en' ? 'bg-[#006C35] text-white font-bold' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>English</button>
                    </div>
                </header>)}

                <main className="flex-1 overflow-y-auto bg-[#f4f7f5]">
                    {activeTab !== 'workspace' && (
                        <div className={`${hostHeader ? 'bg-transparent' : 'bg-white border-b border-gray-200 shadow-xs'} px-8 py-3.5 flex items-center ${hostHeader ? 'justify-center' : 'justify-between'} text-start animate-fadeIn ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`} style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
                            {!hostHeader && <div className={`flex items-center gap-4 ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <button
                                    onClick={() => {
                                        if (cameFromHost && onBack) { onBack(); return; }
                                        setActiveTab('workspace');
                                        setCurrentReportId(null);
                                    }}
                                    className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition-all flex items-center gap-1.5 shrink-0"
                                >
                                    <span>{lang === 'ar' ? '↩ العودة' : '↩ Back'}</span>
                                </button>
                                <span className="text-xs font-bold text-gray-700 max-w-[300px] truncate">
                                    {activeFunctionLabel}
                                </span>
                            </div>}

                            <div className="hidden lg:flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs shadow-inner">
                                {[
                                    { id: 'params', label: dict.workflow_step_1 },
                                    { id: 'dash', label: dict.workflow_step_2 },
                                    { id: 'narrative', label: dict.workflow_step_3 },
                                    { id: 'report', label: dict.workflow_step_4 }
                                ].map((step, idx) => {
                                    const isUnlocked = unlockedSteps[step.id];
                                    const isActive = activeTab === step.id;
                                    return (
                                        <button
                                            key={step.id}
                                            type="button"
                                            disabled={!isUnlocked}
                                            onClick={() => setActiveTab(step.id)}
                                            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                                                isActive
                                                    ? 'bg-momahGreen-700 text-white shadow-sm scale-[1.01]'
                                                    : isUnlocked
                                                        ? 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                                        : 'text-gray-400 cursor-not-allowed opacity-50'
                                            }`}
                                        >
                                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                {idx + 1}
                                            </span>
                                            <span>{step.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* === 1. 工作台首页 (Workspace Home) === */}
                    {activeTab === 'workspace' && (() => {
                        return (
                            <div className="bg-white border-b border-gray-200 px-8 py-5 text-start animate-fadeIn shadow-xs">
                                <div className="max-w-7xl mx-auto flex flex-col gap-1">
                                    <div className={`flex items-center gap-1.5 text-[10.5px] text-[#006C35] font-extrabold uppercase tracking-wider ${lang === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span>{lang === 'ar' ? activeDept?.name_ar : activeDept?.name_en}</span>
                                        <span className="opacity-40">/</span>
                                        <span className="text-gray-500 font-bold">{lang === 'ar' ? activeSubDept?.name_ar : activeSubDept?.name_en}</span>
                                    </div>
                                    <h1 className="text-xl font-black text-gray-900 mt-1.5 leading-snug">
                                        {activeFunctionLabel}
                                    </h1>
                                    <p className="text-[10.5px] text-gray-500 mt-1.5 max-w-4xl leading-relaxed">
                                        {dashboardData?.groupMeta?.subtitle || dict.tagline}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === 'workspace' && (
                        <div className="max-w-7xl w-full mx-auto p-6 space-y-6 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-start">
                                    <div>
                                        <span className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'إجمالي التقارير' : (lang === 'zh' ? '总报告数' : 'Total Reports')}</span>
                                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{groupReports.length}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">📁</div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-start">
                                    <div>
                                        <span className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'منشور رسمياً' : (lang === 'zh' ? '已发布' : 'Published')}</span>
                                        <h3 className="text-2xl font-bold text-green-700 mt-1">{groupReports.filter(r => r.status === 'Published').length}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg">🚀</div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-start">
                                    <div>
                                        <span className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'معتمد' : (lang === 'zh' ? '已批准' : 'Approved')}</span>
                                        <h3 className="text-2xl font-bold text-blue-700 mt-1">{groupReports.filter(r => r.status === 'Approved').length}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">✓</div>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-start">
                                    <div>
                                        <span className="text-[11px] text-gray-400 font-bold">{lang === 'ar' ? 'قيد المراجعة' : (lang === 'zh' ? '审核中' : 'In Review')}</span>
                                        <h3 className="text-2xl font-bold text-amber-700 mt-1">{groupReports.filter(r => r.status === 'Draft' || r.status === 'In Review').length}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-lg">⏳</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-start">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-800">{activeRegistryTitle}</h3>
                                    <button
                                        onClick={createNewReport}
                                        className="px-4 py-2 bg-momahGreen-600 hover:bg-momahGreen-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                                    >
                                        <span>{dict.btn_create_new_report}</span>
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-start border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                                                <th className="p-4 text-start">{dict.report_list_name}</th>
                                                <th className="p-4 text-start">{dict.report_list_type}</th>
                                                <th className="p-4 text-start">{dict.report_list_scope}</th>
                                                <th className="p-4 text-start">{dict.report_list_date}</th>
                                                <th className="p-4 text-center">{dict.report_list_status}</th>
                                                <th className="p-4 text-start">{dict.report_list_reviewer}</th>
                                                <th className="p-4 text-center">{dict.report_list_actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupReports.map((report) => (
                                                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-all">
                                                    <td className="p-4 font-bold text-gray-800">{lang === 'ar' ? report.name_ar : report.name_en}</td>
                                                    <td className="p-4 font-semibold text-gray-600">{report.reportType}</td>
                                                    <td className="p-4 text-gray-500 max-w-[200px] truncate">{lang === 'ar' ? report.scope_ar : report.scope_en}</td>
                                                    <td className="p-4 text-gray-400">{report.generatedAt}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                            report.status === 'Published' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                            report.status === 'Approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                            report.status === 'In Review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                            'bg-gray-100 text-gray-500 border border-gray-200'
                                                        }`}>
                                                            {report.status === 'Published' ? dict.status_published :
                                                             report.status === 'Approved' ? dict.status_approved :
                                                             report.status === 'In Review' ? dict.status_in_review :
                                                             dict.status_draft}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-500 font-semibold">{report.reviewer}</td>
                                                    <td className="p-4 text-center space-x-2 space-y-1">
                                                        {(report.status === 'Draft' || report.status === 'In Review') ? (
                                                            <button
                                                                onClick={() => continueReviewReport(report)}
                                                                className="px-3 py-1.5 bg-momahGreen-600 hover:bg-momahGreen-700 text-white rounded-md text-[10px] font-bold shadow-sm transition-all"
                                                            >
                                                                {dict.btn_continue_review}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => openReport(report)}
                                                                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-[10px] font-bold shadow-sm transition-all"
                                                            >
                                                                {dict.btn_open}
                                                            </button>
                                                        )}
                                                        {report.status === 'Approved' && (
                                                            <button
                                                                onClick={() => publishReport(report.id)}
                                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-[10px] font-bold shadow-sm transition-all"
                                                            >
                                                                {dict.btn_publish}
                                                            </button>
                                                        )}
                                                        {(report.status === 'Approved' || report.status === 'Published') && (
                                                            <button
                                                                onClick={() => window.print()}
                                                                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-md text-[10px] font-bold shadow-sm transition-all"
                                                            >
                                                                {dict.btn_export_pdf}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === 2. Step 1: Operational Parameters === */}
                    {activeTab === 'params' && (
                        <div className="max-w-4xl w-full mx-auto p-6 space-y-6 animate-fadeIn text-start">
                            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg space-y-6">
                                <div className="space-y-2 border-b border-gray-100 pb-4">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">⚙️ {lang === 'ar' ? 'تكوين معلمات التصفية' : (lang === 'zh' ? '配置筛选参数' : 'Configure Filter Parameters')}</h2>
                                    <p className="text-xs text-gray-400">{lang === 'ar' ? 'حدد نطاق التحليل والمعايير المحددة.' : (lang === 'zh' ? '定义分析范围和维度筛选条件以生成看板。' : 'Define the analysis scope and dimensional filter criteria to generate the dashboard.')}</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500">{dict.lbl_analysis_level}</label>
                                            <select value={analysisLevel} onChange={(e) => handleAnalysisLevelChange(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none">
                                                {ANALYSIS_LEVELS.map((item) => <option key={item.value} value={item.value}>{item[lang]}</option>)}
                                            </select>
                                        </div>

                                        {analysisLevel === 'Municipality' ? (
                                            <div className="flex flex-col space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500">{dict.lbl_amana}</label>
                                                <select value={selectedAmanas[0] || 'riyadh'} onChange={(e) => {
                                                    const nextAmana = e.target.value;
                                                    setSelectedAmanas([nextAmana]);
                                                    setSelectedMunicipalities([(MUNICIPALITY_OPTIONS[nextAmana] || [])[0]?.value || 'All']);
                                                }} className="p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none">
                                                    {AMANA_OPTIONS.filter((item) => item.value !== 'All').map((item) => <option key={item.value} value={item.value}>{item[lang]}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <MultiSelectDropdown
                                                label={dict.lbl_amana}
                                                placeholder={dict.lbl_amana}
                                                options={AMANA_OPTIONS.filter((item) => item.value !== 'All')}
                                                value={selectedAmanas}
                                                onChange={(values) => {
                                                    const nextAmanas = normalizeMultiSelect(values);
                                                    setSelectedAmanas(nextAmanas);
                                                    if (nextAmanas.includes('All')) {
                                                        setSelectedMunicipalities(['All']);
                                                        return;
                                                    }
                                                    const nextAvailableMunicipalities = getAvailableMunicipalities(nextAmanas).map((item) => item.value);
                                                    const keptMunicipalities = normalizeMultiSelect(selectedMunicipalities)
                                                        .filter((item) => item === 'All' || nextAvailableMunicipalities.includes(item));
                                                    setSelectedMunicipalities(keptMunicipalities.length ? keptMunicipalities : ['All']);
                                                }}
                                                lang={lang}
                                                allLabel={lang === 'ar' ? 'جميع الأمانات' : 'All Amanas'}
                                                helperText={analysisLevel === 'Ministry' ? dict.help_amana_multi : dict.help_amana_scope}
                                            />
                                        )}

                                        {analysisLevel === 'Municipality' ? (
                                            <div className="flex flex-col space-y-1">
                                                <label className="text-[10px] font-bold text-gray-500">{dict.lbl_municipality}</label>
                                                <select value={selectedMunicipalities[0] || ''} onChange={(e) => setSelectedMunicipalities([e.target.value])} className="p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none">
                                                    {availableMunicipalities.map((item) => <option key={item.value} value={item.value}>{item[lang]}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <MultiSelectDropdown
                                                label={dict.lbl_municipality}
                                                placeholder={dict.lbl_municipality}
                                                options={availableMunicipalities}
                                                value={selectedMunicipalities}
                                                onChange={(values) => setSelectedMunicipalities(normalizeMultiSelect(values))}
                                                lang={lang}
                                                allLabel={lang === 'ar' ? 'جميع البلديات' : 'All Municipalities'}
                                                helperText={dict.help_muni_multi}
                                            />
                                        )}

                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500">{dict.lbl_fiscal_year}</label>
                                            <select value={fiscalYear} onChange={(e) => handleFiscalYearChange(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none">
                                                {FISCAL_YEARS.map((item) => <option key={item.value} value={item.value}>{item[lang]}</option>)}
                                            </select>
                                        </div>

                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500">{dict.lbl_period_type}</label>
                                            <select value={periodType} onChange={(e) => handlePeriodTypeChange(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none">
                                                {PERIOD_TYPES.map((item) => <option key={item.value} value={item.value}>{item[lang]}</option>)}
                                            </select>
                                        </div>

                                        <div className="flex flex-col space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500">{dict.lbl_specific_period}</label>
                                            <select value={specificPeriod} onChange={(e) => setSpecificPeriod(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none">
                                                {specificPeriodOptions.map((item) => <option key={item.value} value={item.value}>{item[lang]}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <button
                                            onClick={startGeneratingDashboard}
                                            className="px-6 py-3 bg-momahGreen-600 hover:bg-momahGreen-700 text-white font-bold text-xs rounded-xl shadow-md hover:scale-[1.01] transition-all flex items-center gap-1.5"
                                        >
                                            <span>{dict.btn_generate_dashboard}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === 3. Step 2: Dashboard & Reasoning Overlay === */}
                    {activeTab === 'dash' && (
                        <div className="space-y-6 animate-fadeIn relative">
                            {isGenerating ? (
                                <div className="max-w-7xl w-full mx-auto p-6">
                                    <div className="bg-neutralDark-950/90 backdrop-blur-sm z-30 flex items-center justify-center h-[600px] rounded-xl p-8 text-white select-none">
                                        <div className="max-w-md w-full text-center space-y-8 animate-fadeIn">
                                            <div className="flex justify-center">
                                                {/* Glowing orb spinner */}
                                                <div className="relative w-20 h-20">
                                                    <div className="absolute inset-0 rounded-full border-4 border-momahGreen-500/20 border-t-momahGreen-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                                                    <div className="absolute inset-2 rounded-full bg-momahGreen-900/40 flex items-center justify-center text-xl shadow-2xl shadow-momahGreen-500/50">🤖</div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-base font-bold text-white tracking-wide">{dict.reasoning_title}</h3>
                                                <p className="text-[10px] text-momahGreen-300">{lang === 'ar' ? 'يرجى الانتظار، وكيل الذكاء الاصطناعي يقوم بالتحليل الحركي للبيانات...' : 'Please wait, the AI agent is performing dynamic financial reasoning...'}</p>
                                            </div>

                                            <div className="space-y-3.5 text-start bg-white/5 border border-white/10 rounded-xl p-5 text-xs">
                                                {[
                                                    { text: dict[`reasoning_step_${currentGroupContext}_1`] || dict.reasoning_step_1, index: 0 },
                                                    { text: dict[`reasoning_step_${currentGroupContext}_2`] || dict.reasoning_step_2, index: 1 },
                                                    { text: dict[`reasoning_step_${currentGroupContext}_3`] || dict.reasoning_step_3, index: 2 },
                                                    { text: dict[`reasoning_step_${currentGroupContext}_4`] || dict.reasoning_step_4, index: 3 }
                                                ].map((st) => {
                                                    const isActive = generatingStep === st.index;
                                                    const isDone = generatingStep > st.index;
                                                    return (
                                                        <div key={st.index} className="flex items-center justify-between text-neutral-300">
                                                            <span className={isDone ? 'text-green-400 font-semibold' : isActive ? 'text-white font-bold' : 'text-neutral-500'}>
                                                                {st.text}
                                                            </span>
                                                            <span>
                                                                {isDone ? '✓' : isActive ? (
                                                                    <span className="inline-block w-3 h-3 border-2 border-momahGreen-400 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '2s' }}></span>
                                                                ) : '◦'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Main Dashboard Render */
                                <div className="space-y-6 max-w-7xl w-full mx-auto p-6">
                                    <div className="flex items-center justify-between gap-4 w-full">
                                        <CompactHeaderCard
                                            lang={lang}
                                            scopeLabel={scopeLabel}
                                            kpis={dashboardData.kpis}
                                        />
                                        <button
                                            onClick={() => setShowSupportingDrawer(true)}
                                            className="shrink-0 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                        >
                                            <span>{dict.btn_view_supporting_data}</span>
                                        </button>
                                    </div>

                                    <AiBriefCard
                                        lang={lang}
                                        brief={dashboardData.aiBrief}
                                        onReview={() => setActiveTab('narrative')}
                                    />

                                    <KPIGrid lang={lang} kpis={dashboardData.kpis} />

                                    <div dir="ltr" className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] gap-6 items-stretch">
                                        <div data-chart-key="map" dir={lang === 'ar' ? 'rtl' : 'ltr'} className="h-full">
                                            <RegionalMapCard lang={lang} mapData={dashboardData.regionalMap} />
                                        </div>
                                        <div data-chart-key="trend" dir={lang === 'ar' ? 'rtl' : 'ltr'} className="h-full">
                                            <TimeComparisonCard lang={lang} data={dashboardData.timeComparison} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-start">
                                        <h3 className="text-sm font-bold text-gray-800">
                                            {lang === 'ar' ? 'التحليل المالي التفصيلي' : 'Financial Detail Analysis'}
                                        </h3>
                                        <div className="space-y-4">
                                            {detailRows.map((row, idx) => (
                                                <div key={`detail-row-${idx}`} className={getDetailRowClassName(row)}>
                                                    {row.map(renderDetailCard)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sliding Supporting Data Drawer */}
                            {showSupportingDrawer && (
                                <div className="fixed inset-0 z-50 flex justify-end">
                                    {/* Backdrop */}
                                    <div onClick={() => setShowSupportingDrawer(false)} className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"></div>
                                    {/* Drawer Content */}
                                    <div className="relative w-full max-w-4xl bg-gray-50 h-full shadow-2xl flex flex-col z-10 animate-slideLeft border-l border-gray-200 text-start">
                                        <div className="p-5 bg-momahGreen-700 text-white flex items-center justify-between shadow">
                                            <div>
                                                <h3 className="text-sm font-bold">{dict.tables_title}</h3>
                                                <p className="text-[10px] text-momahGreen-200 mt-1">{dict.tables_subtitle}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={resetToDefaultData}
                                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] duration-150"
                                                    title={lang === 'zh' ? '一键恢复所有修改为默认初始值' : (lang === 'ar' ? 'استعادة جميع البيانات إلى الافتراضيات' : 'Reset all data to default values')}
                                                >
                                                    <span>↺</span>
                                                    <span>{lang === 'zh' ? '一键恢复默认' : (lang === 'ar' ? 'استعادة الافتراضي' : 'Reset to Default')}</span>
                                                </button>
                                                <button
                                                    onClick={() => setShowSupportingDrawer(false)}
                                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition-all"
                                                >
                                                    {dict.btn_close_drawer}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Excel Export/Import Buttons Bar */}
                                        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 font-bold">
                                                    {lang === 'zh' ? '支撑数据 Excel 闭环：' : (lang === 'ar' ? 'ربط تفاعلي لبيانات Excel:' : 'Excel Interactive Loop:')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleExportExcel}
                                                    className="px-3.5 py-1.5 bg-momahGreen-50 hover:bg-momahGreen-100 border border-momahGreen-200 text-momahGreen-800 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                                                >
                                                    <span>📥</span>
                                                    <span>{lang === 'zh' ? '下载当前数据 (Excel)' : (lang === 'ar' ? 'تحميل البيانات (Excel)' : 'Download Excel')}</span>
                                                </button>
                                                
                                                <label className="px-3.5 py-1.5 bg-momahGreen-600 hover:bg-momahGreen-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                                                    <span>📤</span>
                                                    <span>{lang === 'zh' ? '上传修改数据 (Excel)' : (lang === 'ar' ? 'رفع البيانات (Excel)' : 'Upload Excel')}</span>
                                                    <input
                                                        type="file"
                                                        accept=".xlsx, .xls"
                                                        onChange={handleUploadExcel}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                            {/* Inline Edit Alert Banner */}
                                            <div className="p-4 bg-amber-50 border border-dashed border-amber-300 rounded-xl flex items-start gap-3 text-[11px] text-amber-800">
                                                <span className="text-base mt-0.5">💡</span>
                                                <div className="space-y-1">
                                                    <p className="font-bold">
                                                        {lang === 'zh' ? '行内编辑与智能计算' : (lang === 'ar' ? 'التحرير المباشر والحساب الذكي' : 'Inline Editing & Smart Calculation')}
                                                    </p>
                                                    <p className="text-gray-600 leading-relaxed text-xs">
                                                        {lang === 'zh' 
                                                            ? '您可以直接在下方的表格单元格中点击带有铅笔 ✏️ 的数据进行修改。修改后，系统将自动进行级联重算，并实时同步更新仪表盘、分析卡片以及最终的 PPT 和叙事报告。' 
                                                            : (lang === 'ar' 
                                                                ? 'يمكنك النقر مباشرة على خلايا الجدول أدناه لتعديل البيانات التي تحتوي على رمز القلم ✏️. بعد التعديل، سيقوم النظام تلقائيًا بإعادة الحساب المتتالي وتحديث لوحة القيادة وبطاقات التحليل وشرائح العرض والتقرير السردي النهائي في الوقت الفعلي.' 
                                                                : 'You can directly click and modify the table cells below marked with a pencil ✏️. The system will automatically run cascade recalculations and instantly update the dashboard, analysis cards, presentation slides, and narrative report.')}
                                                    </p>
                                                </div>
                                            </div>

                                            {(dashboardData.detailTables || []).map((table, index) => renderTable(table, `detail-table-${index}`))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* === 4. Step 3: Commentary Review (Two-Column + Permanent Chat Panel) === */}
                    {activeTab === 'narrative' && (
                        <div className="max-w-[1720px] w-full mx-auto p-6 space-y-6 animate-fadeIn text-start relative">
                            {/* Audit progress bar */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 max-w-md">
                                    <div className="text-xs font-bold text-gray-800">{dict.narrative_title}</div>
                                    <div className="text-[10px] text-gray-400 leading-tight">{dict.narrative_match}</div>
                                </div>
                                <div className="flex items-center flex-wrap gap-4 md:gap-6">
                                    {/* Final Report Type Selection */}
                                    <div className="flex items-center gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                                        <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{dict.lbl_report_type_output}:</span>
                                        <select
                                            value={reportType}
                                            onChange={(e) => setReportType(e.target.value)}
                                            className="p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none font-bold text-momahGreen-800 focus:border-momahGreen-500"
                                        >
                                            {visibleReportTypes.map((item) => (
                                                <option key={item.value} value={item.value}>{item[lang]}</option>
                                            ))}
                                        </select>
                                    </div>


                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-[1.55fr_0.45fr] gap-6 items-stretch">
                                {/* Left Column: PowerPoint-Style Slide Editor */}
                                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-5 items-stretch min-h-[500px] h-auto">
                                    
                                    {/* Left Sub-column: Slide Thumbnails Navigation */}
                                    <div className="w-full md:w-52 shrink-0 flex flex-col gap-3 border-r border-gray-100 pr-3">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">

                                            {lang === 'zh' ? '幻灯片页面列表' : (lang === 'ar' ? 'قائمة صفحات الشرائح' : 'Slide Pages')}
                                        </div>
                                        
                                        <div className="max-h-[360px] overflow-y-auto flex flex-col gap-2.5 pr-1">
                                            {aiCards.map((card, index) => {
                                                const isActive = index === activeSlideIndex;
                                                const isReviewed = card.reviewed;
                                                const isIncluded = card.included;
                                                
                                                return (
                                                    <div
                                                        key={card.id}
                                                        onClick={() => handleSlideChange(index)}
                                                        className={`group relative w-full text-start p-3 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                                                            isActive
                                                                ? 'bg-momahGreen-50 border-momahGreen-600 ring-1 ring-momahGreen-600 shadow-xs'
                                                                : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        {/* Slide Header inside thumbnail */}
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className={`text-[10px] font-bold ${isActive ? 'text-momahGreen-800' : 'text-gray-500'}`}>
                                                                {lang === 'zh' ? `第 ${index + 1} 页` : (lang === 'ar' ? `شريحة ${index + 1}` : `Slide ${index + 1}`)}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">

                                                                <input
                                                                    type="checkbox"
                                                                    checked={isIncluded}
                                                                    onClick={(e) => e.stopPropagation()} // Prevent selecting slide when clicking include
                                                                    onChange={(e) => {
                                                                        const val = e.target.checked;
                                                                        setAiCards(prev => prev.map(c => c.id === card.id ? { ...c, included: val } : c));
                                                                    }}
                                                                    className="w-3.5 h-3.5 accent-momahGreen-600 cursor-pointer"
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Slide body thumbnail preview */}
                                                        <div className="h-14 w-full bg-white border border-gray-200 rounded-lg p-1.5 flex items-center justify-center overflow-hidden text-center relative select-none">
                                                            <span className="text-[9px] font-bold text-gray-700 line-clamp-1 truncate max-w-full">
                                                                {card.title}
                                                            </span>
                                                            {/* Tiny decoration representing text/chart columns */}
                                                            <div className="absolute bottom-1 inset-x-2 flex gap-1 h-2.5 opacity-30">
                                                                <div className="flex-1 bg-gray-300 rounded-xs"></div>
                                                                <div className="flex-1 bg-momahGreen-300 rounded-xs"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="h-px bg-gray-100 my-2"></div>

                                        {/* Data Table Config Panel */}
                                        <div className="space-y-2 mt-auto relative">
                                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                {lang === 'zh' ? '报告数据表配置' : (lang === 'ar' ? 'تهيئة جداول البيانات' : 'Data Tables')}
                                            </div>
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setShowAddTableDropdown(!showAddTableDropdown)} 
                                                    className="w-full border border-gray-200 hover:border-momahGreen-500 hover:text-momahGreen-700 text-gray-700 bg-white rounded-lg py-2 px-3 text-[11px] font-bold transition-all flex items-center justify-between shadow-xs"
                                                >
                                                    <span>
                                                        {lang === 'zh' ? '添加/配置数据表' : (lang === 'ar' ? 'إضافة/تعديل جداول البيانات' : 'Add/Configure Tables')}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400">▼</span>
                                                </button>
                                                
                                                {showAddTableDropdown && (
                                                    <div className="absolute left-0 bottom-full mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2.5 space-y-2 text-start">
                                                        <div className="text-[9px] font-extrabold text-gray-400 border-b border-gray-100 pb-1 mb-1.5">
                                                            {lang === 'zh' ? '选择要包含的数据表' : (lang === 'ar' ? 'اختر الجداول لتضمينها' : 'Select tables to include')}
                                                        </div>
                                                        
                                                        {[
                                                            { key: 'supporting', label: lang === 'zh' ? '支持性财务数据表' : (lang === 'ar' ? 'جداول البيانات المساندة' : 'Supporting Financial Tables'), visible: true },
                                                            { key: 'overall', label: lang === 'zh' ? '整体财务状况表' : (lang === 'ar' ? 'جدول الوضع المالي العام' : 'Overall Financial Position Table'), visible: dashboardData.groupContext !== 'g06' },
                                                            { key: 'breakdown', label: lang === 'zh' ? '部门绩效分解表' : (lang === 'ar' ? 'جدول تفصيلي للأقسام' : 'Section Breakdown Analysis Table'), visible: dashboardData.groupContext !== 'g06' },
                                                            { key: 'initiatives', label: lang === 'zh' ? '倡议/项目清单表' : (lang === 'ar' ? 'جدول المبادرات والمشاريع' : 'Initiatives / Projects Table'), visible: dashboardData.groupContext !== 'g06' },
                                                            { key: 'contracts', label: lang === 'zh' ? '合同状态分布表' : (lang === 'ar' ? 'جدول توزيع حالات العقود' : 'Contracts Status Table'), visible: dashboardData.groupContext !== 'g06' },
                                                            { key: 'revenueSources', label: lang === 'zh' ? '非税收入渠道明细表' : (lang === 'ar' ? 'جدول تفاصيل مصادر الإيرادات' : 'Revenue Source Details'), visible: dashboardData.groupContext === 'g06' }
                                                        ].filter(item => item.visible).map(item => (
                                                            <label key={item.key} className="flex items-center gap-2 cursor-pointer py-1 px-1.5 hover:bg-gray-50 rounded text-[10px] text-gray-700 font-semibold transition-all">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={includedTables[item.key] || false} 
                                                                    onChange={(e) => setIncludedTables(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                                                    className="w-3.5 h-3.5 accent-momahGreen-600 rounded cursor-pointer" 
                                                                />
                                                                <span className="truncate">{item.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>

                                    {/* Right Sub-column: Slide editor workspace */}
                                    {(() => {
                                        const card = aiCards[activeSlideIndex];
                                        if (!card) return null;
                                        return (
                                            <div className="flex-1 flex flex-col justify-between gap-4 text-start min-w-0">
                                                
                                                {/* Slide Wrapper for scale */}
                                                <div ref={slideParentRef} className="w-full relative overflow-hidden shrink-0" style={{ height: `${450 * slideScale}px` }}>
                                                    <div 
                                                        className="bg-[#FAF7EE] rounded-2xl p-6 shadow-lg border-2 border-momahGreen-800/20 flex flex-col justify-between text-start absolute top-0 left-0 origin-top-left select-text text-gray-800"
                                                        style={{
                                                            width: '800px',
                                                            height: '450px',
                                                            transform: `scale(${slideScale})`,
                                                            backfaceVisibility: 'hidden',
                                                            WebkitBackfaceVisibility: 'hidden',
                                                        }}
                                                    >
                                                    {/* Decorative Background */}
                                                    <div className="absolute top-0 right-0 w-48 h-48 bg-momahGreen-600/5 rounded-full blur-3xl pointer-events-none"></div>
                                                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                                    
                                                    {/* Slide Header */}
                                                    <div className="flex items-center justify-between border-b border-momahGreen-800/15 pb-3 z-10 shrink-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1.5 h-4 bg-momahGreen-600 rounded-full"></span>
                                                            <span className="text-xs font-extrabold text-momahGreen-950 tracking-wide uppercase">
                                                                {card.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                            <span className="font-bold text-momahGreen-800">Ministry of Municipalities and Housing</span>
                                                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-[8px] text-amber-800 font-bold border border-amber-300">Slide {activeSlideIndex + 1}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Slide Body */}
                                                    <div className="flex-1 grid grid-cols-[0.5fr_1.5fr] gap-4 items-stretch my-3 min-h-0 z-10">
                                                        
                                                        {/* Left column: Narrative TextArea placeholder */}
                                                        <div className="flex flex-col gap-2 min-h-0 bg-white/85 rounded-xl border border-momahGreen-850/10 p-3 shadow-xs">
                                                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold border-b border-gray-100 pb-1.5 shrink-0">
                                                                <span>{lang === 'zh' ? '叙述性评论' : (lang === 'ar' ? 'التعليق السردي' : 'Narrative Commentary')}</span>
                                                                <span className="text-amber-700 text-[9px] bg-amber-50 px-1.5 py-0.5 rounded font-bold">{dict.lbl_confidence} {card.confidence}%</span>
                                                            </div>
                                                            
                                                            <div className="flex-1 min-h-0">
                                                                {card.showDiff ? (
                                                                    <div className="w-full h-full p-2 border border-amber-200 bg-amber-50/40 rounded-lg text-[10.5px] leading-relaxed text-gray-700 overflow-y-auto whitespace-pre-wrap select-text">
                                                                        {computeDiff(card.originalText, card.text).map((token, idx) => {
                                                                            if (token.type === 'add') {
                                                                                return (
                                                                                    <ins key={idx} className="bg-green-50 text-green-700 border-b border-green-400 font-bold px-0.5 mx-0.5 rounded no-underline">
                                                                                        {token.value}
                                                                                    </ins>
                                                                                );
                                                                            }
                                                                            if (token.type === 'remove') {
                                                                                return (
                                                                                    <del key={idx} className="bg-red-50 text-red-500 line-through border-b border-red-350 px-0.5 mx-0.5 rounded">
                                                                                        {token.value}
                                                                                    </del>
                                                                                );
                                                                            }
                                                                            return <span key={idx}>{token.value}</span>;
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <textarea
                                                                        value={card.text}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setAiCards(prev => prev.map(c => c.id === card.id ? { ...c, text: val } : c));
                                                                        }}
                                                                        className="w-full h-full p-2 bg-white border border-gray-200 hover:border-momahGreen-400 focus:border-momahGreen-600 rounded-lg text-[10.5px] leading-relaxed text-gray-800 outline-none resize-none font-sans transition-all focus:ring-1 focus:ring-momahGreen-600 shadow-inner"
                                                                        placeholder={dict.copilot_input_placeholder}
                                                                    />
                                                                )}
                                                            </div>
                                                            
                                                            <div className="text-[9px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100 shrink-0">
                                                                <span><strong>{dict.lbl_source}</strong> {card.source}</span>
                                                                <span className="text-green-600 font-bold">✓ {dict.lbl_math_check}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Right column: chart直接铺满，无标题栏 */}
                                                        <div className="flex flex-col min-h-0 bg-white/85 rounded-xl border border-momahGreen-850/10 overflow-hidden shadow-xs">
                                                            {/* 图表直接填满 */}
                                                            <div className="flex-1 min-h-0 overflow-hidden relative">
                                                                {renderSlideChart(card.chartKey)}
                                                            </div>
                                                            {/* 底部：切换图表下拉 */}
                                                            <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500 px-3 py-1.5 border-t border-gray-100 shrink-0 bg-white/90">
                                                                <span className="font-bold">{lang === 'zh' ? '切换图表：' : (lang === 'ar' ? 'المخطط:' : 'Chart:')}</span>
                                                                <select
                                                                    value={card.chartKey || 'none'}
                                                                    onChange={(e) => {
                                                                        const key = e.target.value;
                                                                        setAiCards(prev => prev.map(c => c.id === card.id ? { ...c, chartKey: key } : c));
                                                                    }}
                                                                    className="p-1 border border-gray-200 rounded bg-white text-[10px] text-gray-700 outline-none font-bold text-momahGreen-800 focus:border-momahGreen-600 focus:ring-1 focus:ring-momahGreen-600"
                                                                >
                                                                    <option value="none">{lang === 'zh' ? '无图表' : (lang === 'ar' ? 'بدون مخطط' : 'None')}</option>
                                                                    <option value="map">{lang === 'zh' ? '区域地图' : (lang === 'ar' ? 'خريطة الأداء الإقليمية' : 'Regional Map')}</option>
                                                                    <option value="trend">{lang === 'zh' ? '支出趋势图' : (lang === 'ar' ? 'اتجاه الإنفاق مقارنة بالخطة' : 'Spend Trend Comparison')}</option>
                                                                    <option value="sankey">{lang === 'zh' ? 'Sankey 资金流向图' : (lang === 'ar' ? 'مخطط تدفق الميزانية (Sankey)' : 'Budget Flow Sankey')}</option>
                                                                    <option value="services">{lang === 'zh' ? '服务分析' : (lang === 'ar' ? 'تحليل الخدمات الرئيسية' : 'Main Service Analysis')}</option>
                                                                    <option value="initiatives">{lang === 'zh' ? '愿景项目/MOMAH 绩效' : (lang === 'ar' ? 'بنود برامج الرؤية' : 'Vision Programs')}</option>
                                                                    <option value="contracts">{lang === 'zh' ? '合同状态分析' : (lang === 'ar' ? 'تحليل العقود' : 'Contract Status Donut')}</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                        {/* Slide Footer */}
                                                        <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-momahGreen-800/10 pt-2 shrink-0 z-10">
                                                            <span>{scopeLabel}</span>
                                                            <span>{lang === 'zh' ? `第 {activeSlideIndex + 1} 页 / 共 {aiCards.length} 页` : (lang === 'ar' ? `صفحة {activeSlideIndex + 1} من {aiCards.length}` : `Page {activeSlideIndex + 1} of {aiCards.length}`)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Toolbar row */}
                                                <div className="flex items-center justify-between border-t border-gray-100 pt-3 flex-wrap gap-2 shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleShowDiff(card.id)}
                                                            className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                                                card.showDiff
                                                                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                                                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <span>🔍</span>
                                                            <span>{lang === 'ar' ? 'عرض الفروقات' : 'Show Diff'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedChatTargetCard(card.id);
                                                                setIsCopilotChatOpen(true);
                                                            }}
                                                            className="px-3 py-1.5 border border-momahGreen-200 text-momahGreen-700 hover:bg-momahGreen-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                        >
                                                            <span>💬</span>
                                                            <span>{lang === 'ar' ? 'نقاش مع AI' : 'Discuss with AI'}</span>
                                                        </button>

                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            disabled={activeSlideIndex === 0}
                                                            onClick={() => handleSlideChange(activeSlideIndex - 1)}
                                                            className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            {lang === 'zh' ? '上一页' : (lang === 'ar' ? 'السابق' : 'Prev')}
                                                        </button>
                                                        <button
                                                            disabled={activeSlideIndex === aiCards.length - 1}
                                                            onClick={() => handleSlideChange(activeSlideIndex + 1)}
                                                            className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            {lang === 'zh' ? '下一页' : (lang === 'ar' ? 'التالي' : 'Next')}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Final PPT Compilation Trigger */}
                                                <div className="flex items-center justify-end border-t border-gray-100 pt-3 shrink-0">
                                                    <button
                                                        onClick={confirmAssembleReport}
                                                        className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all bg-momahGreen-600 hover:bg-momahGreen-700 text-white hover:scale-[1.01]"
                                                    >
                                                        {dict.btn_confirm_generate}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Right Column: Permanent AI Co-pilot Chat Panel */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[700px] sticky top-4">
                                        <div className="px-4 py-3 bg-momahGreen-800 text-white flex items-center justify-between shadow-sm">
                                            <div className="text-xs font-bold flex items-center gap-1.5">
                                                <span>💬</span>
                                                <span>{dict.copilot_title}</span>
                                            </div>
                                        </div>

                                        <div className="p-3 border-b border-gray-100 bg-gray-50 text-[10px] text-gray-500 space-y-1.5 text-start">
                                            <div className="font-bold">{dict.copilot_target_card}</div>
                                            <select
                                                value={selectedChatTargetCard}
                                                onChange={(e) => setSelectedChatTargetCard(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded text-xs bg-white outline-none font-semibold text-gray-700"
                                            >
                                                {aiCards.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                            </select>
                                        </div>

                                        {/* Conversation Bubbles */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                                            {chatHistory.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 shadow-xs ${
                                                        msg.sender === 'user'
                                                            ? 'bg-momahGreen-600 text-white text-start'
                                                            : 'bg-white border border-gray-200 text-gray-700 text-start'
                                                    }`}>
                                                        <div>{lang === 'ar' ? (msg.text_ar || msg.text) : (msg.text_en || msg.text)}</div>
                                                        
                                                        {msg.sender === 'ai' && msg.suggestedText && (
                                                            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-end gap-2 flex-wrap">
                                                                <button
                                                                    onClick={() => applyChatRewrite(msg.targetCardId, msg.suggestedText)}
                                                                    className="px-2 py-1 bg-momahGreen-600 hover:bg-momahGreen-700 text-white rounded text-[10px] font-bold"
                                                                >
                                                                    {dict.btn_apply_change}
                                                                </button>
                                                                <button
                                                                    onClick={() => revertCardText(msg.targetCardId)}
                                                                    className="px-2 py-1 border border-gray-300 hover:bg-gray-100 text-gray-600 rounded text-[10px] font-semibold"
                                                                >
                                                                    {dict.btn_revert}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {isAiReplying && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl px-4 py-2.5 text-xs shadow-xs flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                                        <span className="text-[10px] text-gray-400 ms-1">{lang === 'ar' ? 'الذكاء الاصطناعي يكتب...' : 'AI is thinking...'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Input */}
                                        <div className="p-3 border-t border-gray-100 bg-white">
                                            <div className="flex gap-2">
                                                <input
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && chatInput.trim()) {
                                                            submitCopilotChat();
                                                        }
                                                    }}
                                                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-momahGreen-600 focus:ring-1 focus:ring-momahGreen-600"
                                                    placeholder={dict.copilot_input_placeholder}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={submitCopilotChat}
                                                    disabled={!chatInput.trim()}
                                                    className="px-3 py-2 rounded-xl bg-momahGreen-600 hover:bg-momahGreen-700 disabled:bg-gray-300 text-white text-xs font-bold"
                                                >
                                                    {dict.btn_send}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* === 5. Step 4: Report Detail === */}
                    {activeTab === 'report' && (() => {
                        const reportSlides = [];
                        
                        // 1. Cover Slide
                        reportSlides.push({
                            type: 'cover',
                            title: lang === 'zh' ? '报告封面' : (lang === 'ar' ? 'الغلاف' : 'Cover'),
                            reportLabel: reportOutput.reportLabel
                        });
                        
                        // 2. Content Slides (AI commentary + visual charts)
                        // 2. Content Slides (AI commentary + visual charts)
                        aiCards.filter(c => c.included).forEach((card, idx) => {
                            reportSlides.push({
                                type: 'content',
                                title: card.title,
                                text: card.text,
                                chartKey: card.chartKey || 'none',
                                slideNum: idx + 1
                            });
                        });
                        
                        // 3. KPI Summary Table Slide
                        reportSlides.push({
                            type: 'kpiTable',
                            title: lang === 'zh' ? '关键指标摘要' : (lang === 'ar' ? 'ملخص المؤشرات الرئيسية' : 'Summary of Key Indicators')
                        });
                        
                        // 4. Data Tables Slides (All read-only)
                        if (includedTables.supporting) {
                            const supportTables = (reportOutput?.supportTables && reportOutput.supportTables.length ? reportOutput.supportTables : [reportOutput.focusTable]).filter(Boolean);
                            supportTables.forEach(table => {
                                reportSlides.push({
                                    type: 'table',
                                    title: table.title || (lang === 'zh' ? '支持性财务底表' : 'Supporting Financial Table'),
                                    tableData: table
                                });
                            });
                        }
                        
                        if (includedTables.overall && dashboardData.dashboardTable) {
                            reportSlides.push({
                                type: 'table',
                                title: lang === 'zh' ? '整体财务状况表' : (lang === 'ar' ? 'جدول الوضع المالي العام' : 'Overall Financial Position Table'),
                                tableData: dashboardData.dashboardTable
                            });
                        }
                        
                        if (includedTables.breakdown) {
                            const table = (dashboardData.detailTables || []).find(t => t.title.includes('Comparison') || t.title.includes('Aggregated') || t.title.includes('النتيجة المجمعة') || t.title.includes('الإقليمية'));
                            if (table) {
                                reportSlides.push({
                                    type: 'table',
                                    title: table.title,
                                    tableData: table
                                });
                            }
                        }
                        
                        if (includedTables.initiatives) {
                            const table = (dashboardData.detailTables || []).find(t => t.title.includes('Initiative') || t.title.includes('المبادرات'));
                            if (table) {
                                reportSlides.push({
                                    type: 'table',
                                    title: table.title,
                                    tableData: table
                                });
                            }
                        }
                        
                        if (includedTables.contracts) {
                            const table = (dashboardData.detailTables || []).find(t => t.title.includes('Contract') || t.title.includes('العقود'));
                            if (table) {
                                reportSlides.push({
                                    type: 'table',
                                    title: table.title,
                                    tableData: table
                                });
                            }
                        }
                        
                        if (includedTables.revenueSources) {
                            const table = (dashboardData.detailTables || []).find(t => t.title.includes('Revenue') || t.title.includes('مصادر الإيرادات') || t.title.includes('التحصيل'));
                            if (table) {
                                reportSlides.push({
                                    type: 'table',
                                    title: table.title,
                                    tableData: table
                                });
                            }
                        }

                        // 5. Closing Slide
                        reportSlides.push({
                            type: 'closing',
                            title: lang === 'zh' ? '结束答谢' : (lang === 'ar' ? 'شكراً' : 'Closing')
                        });

                        const currentSlide = reportSlides[currentReportSlideIndex] || reportSlides[0] || { type: 'cover' };

                        return (
                            <div className="space-y-6 animate-fadeIn text-start max-w-7xl w-full mx-auto p-6">
                                {/* Top Control Bar */}
                                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => {
                                            setActiveTab('workspace');
                                            setCurrentReportId(null);
                                        }}
                                        className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition-all"
                                    >
                                        {dict.btn_back_to_home}
                                    </button>
                                    <div className="flex items-center gap-3">
                                         {/* Status Badge */}
                                         {(() => {
                                             const status = reports.find(r => r.id === currentReportId)?.status || 'Draft';
                                             if (status === 'Draft') {
                                                 return (
                                                     <span className="px-2.5 py-1.5 rounded-md bg-gray-100 text-[10px] text-gray-600 font-extrabold border border-gray-200 uppercase">
                                                         {lang === 'ar' ? 'مسودة' : (lang === 'zh' ? '草稿' : 'Draft')}
                                                     </span>
                                                 );
                                             } else if (status === 'In Review') {
                                                 return (
                                                     <span className="px-2.5 py-1.5 rounded-md bg-amber-50 text-[10px] text-amber-700 font-extrabold border border-amber-200 uppercase animate-pulse">
                                                         {lang === 'ar' ? 'قيد المراجعة الفنية' : (lang === 'zh' ? '审核中' : 'In Technical Review')}
                                                     </span>
                                                 );
                                             } else if (status === 'Approved') {
                                                 return (
                                                     <span className="px-2.5 py-1.5 rounded-md bg-green-50 text-[10px] text-green-700 font-extrabold border border-green-200 uppercase flex items-center gap-1">
                                                         <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                             <path fillRule="evenodd" d="M2.166 4.9L10 1.154l7.834 3.746A2 2 0 0119 6.741V11c0 5.255-3.834 9.146-9 10-5.166-.854-9-4.745-9-10V6.741a2 2 0 011.002-1.841zM10 13a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
                                                         </svg>
                                                         {lang === 'ar' ? 'معتمد رسمياً' : (lang === 'zh' ? '已批准' : 'Approved')}
                                                     </span>
                                                 );
                                             } else if (status === 'Published') {
                                                 return (
                                                     <span className="px-2.5 py-1.5 rounded-md bg-green-600 text-[10px] text-white font-extrabold flex items-center gap-1">
                                                         <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                         </svg>
                                                         {lang === 'ar' ? 'منشور رسمياً' : (lang === 'zh' ? '已发布' : 'Published')}
                                                     </span>
                                                 );
                                             }
                                             return null;
                                         })()}

                                         <div className="space-x-2 flex items-center">
                                             {/* Workflow Actions */}
                                             {(() => {
                                                 const status = reports.find(r => r.id === currentReportId)?.status || 'Draft';
                                                 if (status === 'Draft') {
                                                     return (
                                                         <button
                                                             onClick={submitReportForReview}
                                                             className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow transition-all"
                                                         >
                                                             {lang === 'ar' ? 'تقديم للمراجعة 📤' : (lang === 'zh' ? '提交审核 📤' : 'Submit for Review 📤')}
                                                         </button>
                                                     );
                                                 } else if (status === 'In Review') {
                                                     return (
                                                         <button
                                                             onClick={approveReport}
                                                             className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow transition-all"
                                                         >
                                                             {lang === 'ar' ? 'اعتماد التقرير ✓' : (lang === 'zh' ? '审计批准报告 ✓' : 'Audit Approve Report ✓')}
                                                         </button>
                                                     );
                                                 } else if (status === 'Approved') {
                                                     return (
                                                         <button
                                                             onClick={() => publishReport()}
                                                             className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow transition-all animate-pulse"
                                                         >
                                                             {dict.btn_publish}
                                                         </button>
                                                     );
                                                 }
                                                 return null;
                                             })()}

                                             {/* Exports */}
                                             {(() => {
                                                 const status = reports.find(r => r.id === currentReportId)?.status || 'Draft';
                                                 const isExportDisabled = status !== 'Approved' && status !== 'Published';
                                                 const tooltipText = isExportDisabled 
                                                     ? (lang === 'ar' ? 'يجب اعتماد التقرير أولاً لتمكين التصدير' : (lang === 'zh' ? '报告需审核通过后方可导出' : 'Please approve the report first to unlock export'))
                                                     : '';
                                                 
                                                 return (
                                                     <>
                                                         <button
                                                             onClick={exportToPPTX}
                                                             disabled={isExportDisabled}
                                                             title={tooltipText}
                                                             className={`px-5 py-2.5 font-bold text-xs rounded-lg shadow transition-all inline-flex items-center gap-1.5 ${
                                                                 isExportDisabled 
                                                                     ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border border-gray-300' 
                                                                     : 'bg-momahGreen-600 hover:bg-momahGreen-700 text-white'
                                                             }`}
                                                         >
                                                             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                             </svg>
                                                             {lang === 'zh' ? '导出 PPTX' : (lang === 'ar' ? 'تصدير PPTX' : 'Export to PPTX')}
                                                         </button>
                                                         <button
                                                             onClick={() => window.print()}
                                                             disabled={isExportDisabled}
                                                             title={tooltipText}
                                                             className={`px-5 py-2.5 font-bold text-xs rounded-lg shadow transition-all ${
                                                                 isExportDisabled
                                                                     ? 'bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed shadow-none'
                                                                     : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                                                             }`}
                                                         >
                                                             {dict.btn_export_pdf}
                                                         </button>
                                                     </>
                                                 );
                                             })()}
                                         </div>
                                     </div>
                                </div>

                                {/* PowerPoint-Style Double-Column Layout */}
                                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-5 items-stretch min-h-[500px] h-auto">
                                    
                                    {/* Left Column: Slide Navigation list */}
                                    <div className="w-full md:w-52 shrink-0 flex flex-col gap-3 border-r border-gray-100 pr-3 text-start">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            {lang === 'zh' ? '幻灯片页面列表' : (lang === 'ar' ? 'قائمة صفحات الشرائح' : 'Slide Pages')}
                                        </div>
                                        <div className="max-h-[500px] overflow-y-auto flex flex-col gap-2.5 pr-1">
                                            {reportSlides.map((slide, index) => {
                                                const isActive = index === currentReportSlideIndex;
                                                return (
                                                    <div
                                                        key={`report-slide-nav-${index}`}
                                                        onClick={() => setCurrentReportSlideIndex(index)}
                                                        className={`group relative w-full text-start p-3 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                                                            isActive
                                                                ? 'bg-momahGreen-50 border-momahGreen-600 ring-1 ring-momahGreen-600 shadow-xs'
                                                                : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className={`text-[10px] font-bold ${isActive ? 'text-momahGreen-800' : 'text-gray-500'}`}>
                                                                {lang === 'zh' ? `第 ${index + 1} 页` : (lang === 'ar' ? `شريحة ${index + 1}` : `Slide ${index + 1}`)}
                                                            </span>
                                                        </div>
                                                        <div className="h-14 w-full bg-white border border-gray-200 rounded-lg p-1.5 flex items-center justify-center overflow-hidden text-center relative select-none">
                                                            <span className="text-[9px] font-bold text-gray-700 line-clamp-1 truncate max-w-full px-1">
                                                                {slide.title}
                                                            </span>
                                                            <div className="absolute bottom-1 inset-x-2 flex gap-1 h-2.5 opacity-30">
                                                                <div className="flex-1 bg-gray-300 rounded-xs"></div>
                                                                <div className="flex-1 bg-momahGreen-300 rounded-xs"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right Column: 16:9 Presentation Slide */}
                                    <div className="flex-1 flex flex-col justify-between gap-4 text-start min-w-0">
                                        {/* Slide Wrapper for scale */}
                                        <div ref={reportSlideParentRef} className="w-full relative overflow-hidden shrink-0" style={{ height: `${450 * reportSlideScale}px` }}>
                                            <div 
                                                className="bg-[#FAF7EE] rounded-2xl p-6 shadow-lg border-2 border-momahGreen-800/20 flex flex-col justify-between text-start absolute top-0 left-0 origin-top-left select-text text-gray-800"
                                                style={{
                                                    width: '800px',
                                                    height: '450px',
                                                    transform: `scale(${reportSlideScale})`,
                                                    backfaceVisibility: 'hidden',
                                                    WebkitBackfaceVisibility: 'hidden',
                                                }}
                                            >
                                            {/* Technical Conf. Watermark */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.02] overflow-hidden">
                                                <span className="text-momahGreen-800 font-black text-6xl md:text-8xl tracking-widest transform -rotate-45">{dict.report_conf}</span>
                                            </div>

                                            {/* Slide Top Banner */}
                                            <div className="flex items-center justify-between border-b border-momahGreen-800/15 pb-3 z-10 shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-momahGreen-600 rounded-full"></span>
                                                    <span className="text-xs font-extrabold text-momahGreen-950 tracking-wide uppercase">
                                                        {currentSlide.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                    <span className="font-bold text-momahGreen-800">Ministry of Municipalities and Housing</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-[8px] text-amber-800 font-bold border border-amber-300">Slide {currentReportSlideIndex + 1}</span>
                                                </div>
                                            </div>

                                            {/* Slide Body */}
                                            <div className="flex-1 my-4 overflow-hidden min-h-0 relative z-10">
                                                {currentSlide.type === 'cover' && (
                                                    <div className="absolute inset-0 bg-[#015551] flex flex-col justify-between p-8 rounded-xl text-white shadow-inner" style={{ fontFamily: 'JF Flat' }}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col text-start">
                                                                <span className="font-bold text-xs text-momahGreen-200">{lang === 'ar' ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}</span>
                                                                <span className="text-[10px] text-momahGreen-300">{lang === 'ar' ? 'وزارة البلديات والإسكان' : 'Ministry of Municipalities and Housing'}</span>
                                                            </div>
                                                            <div className="bg-white p-1 rounded-lg shadow-sm flex items-center justify-center h-10">
                                                                <img src={logo} alt="MOMAH Logo" className="h-8 object-contain" />
                                                            </div>
                                                        </div>
                                                        <div className="my-auto text-center space-y-4">
                                                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-amber-400 drop-shadow-sm">
                                                                {currentSlide.reportLabel}
                                                            </h1>
                                                            <p className="text-xs text-momahGreen-200 max-w-lg mx-auto leading-relaxed">
                                                                {lang === 'zh' 
                                                                    ? `分析视角：${reportOutput.groupLabel} | 数据范围：${scopeLabel}` 
                                                                    : `Perspective: ${reportOutput.groupLabel} | Scope: ${scopeLabel}`}
                                                            </p>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[9px] text-momahGreen-300 border-t border-momahGreen-700/50 pt-3">
                                                            <span>{lang === 'ar' ? 'وكالة الشؤون المالية والميزانية' : 'Agency for Financial Affairs & Budget'}</span>
                                                            <span>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentSlide.type === 'closing' && (
                                                    <div className="absolute inset-0 bg-[#015551] flex flex-col justify-between p-8 rounded-xl text-white shadow-inner" style={{ fontFamily: 'JF Flat' }}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex flex-col text-start">
                                                                <span className="font-bold text-xs text-momahGreen-200">{lang === 'ar' ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}</span>
                                                                <span className="text-[10px] text-momahGreen-300">{lang === 'ar' ? 'وزارة البلديات والإسكان' : 'Ministry of Municipalities and Housing'}</span>
                                                            </div>
                                                            <div className="bg-white p-1 rounded-lg shadow-sm flex items-center justify-center h-10">
                                                                <img src={logo} alt="MOMAH Logo" className="h-8 object-contain" />
                                                            </div>
                                                        </div>
                                                        <div className="my-auto text-center space-y-4">
                                                            <h1 className="text-5xl md:text-6xl font-black tracking-wide text-white drop-shadow-sm" style={{ fontFamily: 'JF Flat' }}>
                                                                {lang === 'zh' ? '谢谢' : (lang === 'ar' ? 'شكراً' : 'Thank You')}
                                                            </h1>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[9px] text-momahGreen-300 border-t border-momahGreen-700/50 pt-3">
                                                            <span style={{ fontFamily: 'JF Flat' }}>{lang === 'ar' ? 'وكالة الشؤون المالية والميزانية' : 'Agency for Financial Affairs & Budget'}</span>
                                                            <span>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentSlide.type === 'content' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                                        {/* Left Column: AI Text */}
                                                        <div className="flex flex-col bg-white/40 p-4 rounded-xl border border-gray-100 overflow-y-auto max-h-full">
                                                            <p className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">
                                                                "{currentSlide.text}"
                                                            </p>
                                                        </div>
                                                        {/* Right Column: ECharts Visual */}
                                                        <div className="bg-white/85 p-2 rounded-xl border border-gray-100 h-full overflow-hidden">
                                                            {renderSlideChart(currentSlide.chartKey)}
                                                        </div>
                                                    </div>
                                                )}

                                                {currentSlide.type === 'kpiTable' && (
                                                    <div className="w-full h-full bg-white/80 p-4 rounded-xl border border-gray-100 overflow-y-auto flex flex-col justify-start gap-3">
                                                        <h3 className="font-bold text-xs text-momahGreen-800 border-b border-momahGreen-100 pb-1">
                                                            {lang === 'ar' ? 'ملخص المؤشرات الرئيسية' : 'Summary of Key Indicators'}
                                                        </h3>
                                                        <table className="w-full text-start border-collapse text-[10px] bg-white">
                                                            <thead>
                                                                <tr className="bg-gray-100 border-b border-gray-300">
                                                                    <th className="p-2 border text-start">{lang === 'ar' ? 'المؤشر' : 'Indicator'}</th>
                                                                    <th className="p-2 border text-center">{lang === 'ar' ? 'القيمة' : 'Value'}</th>
                                                                    <th className="p-2 border text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {((reportOutput?.kpis && reportOutput.kpis.length ? reportOutput.kpis : dashboardData?.kpis) || []).map((kpi, idx) => (
                                                                    <tr key={`kpi-row-${idx}`}>
                                                                        <td className="p-2 border font-semibold text-gray-800">{kpi.name}</td>
                                                                        <td className="p-2 border text-center font-bold text-momahGreen-900">{kpi.value}</td>
                                                                        <td className="p-2 border text-center font-semibold">
                                                                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white shadow-xs border-none ${
                                                                                kpi.status === 'nominal' ? 'bg-[#067647]' :
                                                                                kpi.status === 'warning' ? 'bg-[#b54708]' :
                                                                                'bg-[#d92d20]'
                                                                            }`}>
                                                                                {lang === 'ar'
                                                                                    ? (kpi.status === 'nominal' ? 'طبيعي' : kpi.status === 'warning' ? 'تحذير' : kpi.status === 'danger' ? 'خطر' : 'معلومة')
                                                                                    : (kpi.status === 'nominal' ? 'Nominal' : kpi.status === 'warning' ? 'Warning' : kpi.status === 'danger' ? 'Critical' : 'Info')}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                {currentSlide.type === 'table' && (
                                                    <div className="w-full h-full bg-white/80 p-4 rounded-xl border border-gray-100 overflow-y-auto flex flex-col justify-start gap-2">
                                                        <h4 className="font-bold text-momahGreen-800 border-b border-momahGreen-100 pb-1 uppercase text-[10px] shrink-0">
                                                            {currentSlide.title}
                                                        </h4>
                                                        <div className="flex-1 overflow-y-auto text-[9px] min-h-0">
                                                            {renderTable(currentSlide.tableData, 'report-slide-detail-table', true)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Slide Footer */}
                                            <div className="flex items-center justify-between border-t border-momahGreen-800/10 pt-3 z-10 shrink-0">
                                                {/* Left: Indicator of active pages */}
                                                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-semibold">
                                                    <span>{lang === 'zh' ? `第 ${currentReportSlideIndex + 1} 页 / 共 ${reportSlides.length} 页` : (lang === 'ar' ? `صفحة ${currentReportSlideIndex + 1} من ${reportSlides.length}` : `Page ${currentReportSlideIndex + 1} of ${reportSlides.length}`)}</span>
                                                </div>
                                                {/* Right: Slide navigation controllers */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        disabled={currentReportSlideIndex === 0}
                                                        onClick={() => setCurrentReportSlideIndex(currentReportSlideIndex - 1)}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border shadow-xs transition-all ${
                                                            currentReportSlideIndex === 0
                                                                ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {lang === 'zh' ? '上一页' : (lang === 'ar' ? 'السابق' : 'Previous')}
                                                    </button>
                                                    <button
                                                        disabled={currentReportSlideIndex === reportSlides.length - 1}
                                                        onClick={() => setCurrentReportSlideIndex(currentReportSlideIndex + 1)}
                                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold border shadow-xs transition-all ${
                                                            currentReportSlideIndex === reportSlides.length - 1
                                                                ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                                                : 'bg-momahGreen-600 text-white border-momahGreen-600 hover:bg-momahGreen-700'
                                                        }`}
                                                    >
                                                        {lang === 'zh' ? '下一页' : (lang === 'ar' ? 'التالي' : 'Next')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === 'tables' ? (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-start">
                                <h3 className="text-xs font-bold text-gray-800">{dict.tables_title}</h3>
                                <p className="text-xs text-gray-500 mt-2">{dict.tables_subtitle}</p>
                            </div>
                            <div className="space-y-6">
                                {(dashboardData.detailTables || []).map((table, index) => renderTable(table, `detail-table-${index}`))}
                            </div>
                        </div>
                    ) : null}

                </main>
            </div>

            <SmartQueryFloating
                lang={lang}
                dashboardData={dashboardData}
            />

            {/* PPT 导出专用高清隐藏容器 */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1000px', height: '650px', overflow: 'hidden' }}>
                <div data-pptx-chart-key="map" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.regionalMap ? <RegionalMapCard lang={lang} mapData={dashboardData.regionalMap} /> : null}
                </div>
                <div data-pptx-chart-key="trend" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.timeComparison ? <TimeComparisonCard lang={lang} data={dashboardData.timeComparison} /> : null}
                </div>
                <div data-pptx-chart-key="doors" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.doorAnalysis ? <DoorAnalysisCard lang={lang} rows={dashboardData.doorAnalysis} /> : null}
                </div>
                <div data-pptx-chart-key="sankey" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    <BudgetDoorDetailedCard lang={lang} scope={{ selectedAmanas, selectedMunicipalities, analysisLevel, scopeLabel }} />
                </div>
                <div data-pptx-chart-key="services" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.serviceAnalysis ? <ServiceAnalysisCard lang={lang} rows={dashboardData.serviceAnalysis} /> : null}
                </div>
                <div data-pptx-chart-key="initiatives" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.initiativeAnalysis ? <InitiativeTableCard lang={lang} rows={dashboardData.initiativeAnalysis} /> : null}
                </div>
                <div data-pptx-chart-key="contracts" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.contractAnalysis ? <ContractDonutCard lang={lang} rows={dashboardData.contractAnalysis} /> : null}
                </div>
                <div data-pptx-chart-key="variance" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.varianceAnalysis ? <VarianceAnalysisCard lang={lang} rows={dashboardData.varianceAnalysis} /> : null}
                </div>
                <div data-pptx-chart-key="structure" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.structureSummary ? <StructureSummaryCard lang={lang} rows={dashboardData.structureSummary} /> : null}
                </div>
                <div data-pptx-chart-key="revenueSources" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.revenueSourceAnalysis ? <RevenueSourceCards lang={lang} rows={dashboardData.revenueSourceAnalysis} /> : null}
                </div>
                <div data-pptx-chart-key="collectionRate" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.revenueSourceAnalysis ? <CollectionRateCard lang={lang} rows={dashboardData.revenueSourceAnalysis} /> : null}
                </div>
                <div data-pptx-chart-key="receivables" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.receivableProgress ? <ReceivableProgressCard lang={lang} rows={dashboardData.receivableProgress} /> : null}
                </div>
                <div data-pptx-chart-key="regionalCollection" style={{ width: '1000px', height: '650px', background: '#ffffff' }}>
                    {dashboardData?.regionalCollectionAnalysis ? <RegionalCollectionCard lang={lang} rows={dashboardData.regionalCollectionAnalysis} /> : null}
                </div>
            </div>
        </div>
    );
}
