import React from "react";

const ALL = "all";

function SelectControl({ label, value, onChange, options, tr, allLabel }) {
  return (
    <label>
      <span>{tr(label)}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={ALL}>{tr(allLabel)}</option>
        {options.map((option) => <option key={option.key || option} value={option.key || option}>{tr(option.label || { en: option, ar: option, zh: option })}</option>)}
      </select>
    </label>
  );
}

/**
 * Top filters controlling the whole budget execution page.
 */
export function BudgetExecutionFilters({ tr, filters, updateFilter, periods, cities, projects, suppliers, dimensions }) {
  return (
    <section className="be17-filter-grid">
      <SelectControl
        tr={tr}
        label={{ en: "Period", ar: "الفترة", zh: "时期" }}
        value={filters.period}
        onChange={(value) => updateFilter("period", value)}
        options={periods}
        allLabel={{ en: "All periods", ar: "كل الفترات", zh: "全部时期" }}
      />
      <SelectControl
        tr={tr}
        label={{ en: "City", ar: "المدينة", zh: "城市" }}
        value={filters.city}
        onChange={(value) => updateFilter("city", value)}
        options={cities}
        allLabel={{ en: "All cities", ar: "كل المدن", zh: "全部城市" }}
      />
      <SelectControl
        tr={tr}
        label={{ en: "Project", ar: "المشروع", zh: "项目" }}
        value={filters.project}
        onChange={(value) => updateFilter("project", value)}
        options={projects}
        allLabel={{ en: "All projects", ar: "كل المشاريع", zh: "全部项目" }}
      />
      <SelectControl
        tr={tr}
        label={{ en: "Supplier", ar: "المورد", zh: "供应商" }}
        value={filters.supplier}
        onChange={(value) => updateFilter("supplier", value)}
        options={suppliers}
        allLabel={{ en: "All suppliers", ar: "كل الموردين", zh: "全部供应商" }}
      />
      <SelectControl
        tr={tr}
        label={{ en: "Analysis dimension", ar: "بعد التحليل", zh: "分析维度" }}
        value={filters.dimension}
        onChange={(value) => updateFilter("dimension", value)}
        options={dimensions}
        allLabel={{ en: "All dimensions", ar: "كل الأبعاد", zh: "全部维度" }}
      />
    </section>
  );
}
