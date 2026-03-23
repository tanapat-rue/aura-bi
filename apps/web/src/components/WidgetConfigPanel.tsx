import { useState } from "react";
import type { Widget } from "@/lib/widget-types";
import { WIDGET_CATALOG, COLOR_PALETTES } from "@/lib/widget-types";
import { useBIStore } from "@/lib/store";
import { SearchSelect, type SelectOption } from "./SearchSelect";

interface Props {
  widget: Widget;
  onChange: (w: Widget) => void;
  onClose: () => void;
}

const AGG_OPTIONS: SelectOption[] = [
  { value: "COUNT", label: "COUNT", sublabel: "Row count" },
  { value: "COUNT_DISTINCT", label: "COUNT DISTINCT", sublabel: "Unique values" },
  { value: "SUM", label: "SUM", sublabel: "Total sum" },
  { value: "AVG", label: "AVG", sublabel: "Average" },
  { value: "MIN", label: "MIN", sublabel: "Smallest" },
  { value: "MAX", label: "MAX", sublabel: "Largest" },
  { value: "MEDIAN", label: "MEDIAN", sublabel: "Middle value" },
];

const FORMAT_OPTIONS: SelectOption[] = [
  { value: "number", label: "Number", sublabel: "1,234" },
  { value: "compact", label: "Compact", sublabel: "1.2K / 3.4M" },
  { value: "currency", label: "Currency", sublabel: "$1,234.00" },
  { value: "percent", label: "Percent", sublabel: "12.5%" },
];

const OPERATOR_OPTIONS: SelectOption[] = [
  { value: "=", label: "equals (=)" },
  { value: "!=", label: "not equals (!=)" },
  { value: ">", label: "greater than (>)" },
  { value: "<", label: "less than (<)" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "LIKE", label: "contains (LIKE)" },
  { value: "IN", label: "in list (IN)" },
  { value: "IS NULL", label: "is empty" },
  { value: "IS NOT NULL", label: "is not empty" },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: "", label: "Default order" },
  { value: "ASC", label: "A → Z (Ascending)" },
  { value: "DESC", label: "Z → A (Descending)" },
];

const WIDTH_OPTIONS: SelectOption[] = [
  { value: "1", label: "Narrow", sublabel: "1/4 of row" },
  { value: "2", label: "Half", sublabel: "1/2 of row" },
  { value: "3", label: "Wide", sublabel: "3/4 of row" },
  { value: "4", label: "Full", sublabel: "Full row" },
];

const HEIGHT_OPTIONS: SelectOption[] = [
  { value: "80", label: "XS", sublabel: "80px" },
  { value: "160", label: "SM", sublabel: "160px" },
  { value: "240", label: "MD", sublabel: "240px" },
  { value: "340", label: "LG", sublabel: "340px" },
  { value: "480", label: "XL", sublabel: "480px" },
];

const TABS = [
  { key: "data", label: "Data", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
  { key: "appearance", label: "Style", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { key: "layout", label: "Layout", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function WidgetConfigPanel({ widget, onChange, onClose }: Props) {
  const { tables } = useBIStore();
  const [activeTab, setActiveTab] = useState<TabKey>("data");

  const table = tables.find((t) => t.name === widget.dataSource);
  const columns = table?.columns || [];
  const colOptions: SelectOption[] = columns.map((c) => ({ value: c.name, label: c.name, sublabel: c.type }));
  const colOptionsWithAll: SelectOption[] = [{ value: "*", label: "* (all rows)", sublabel: "Count everything" }, ...colOptions];
  const tableOptions: SelectOption[] = tables.map((t) => ({ value: t.name, label: t.name, sublabel: `${t.rowCount.toLocaleString()} rows` }));

  const isFilterWidget = widget.type === "filter_dropdown" || widget.type === "filter_date_range";
  const isTextWidget = widget.type === "text";
  const isDataWidget = !isFilterWidget && !isTextWidget && widget.dataSource;

  return (
    <div className="w-[400px] border-l border-white/[0.04] flex flex-col overflow-hidden shrink-0" style={{ background: "linear-gradient(180deg, #0e0e16 0%, #0a0a12 100%)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">Configure Widget</div>
            <input
              value={widget.title}
              onChange={(e) => onChange({ ...widget, title: e.target.value })}
              className="text-sm font-semibold text-gray-200 bg-transparent border-none outline-none w-full mt-0.5"
              placeholder="Widget title..."
            />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 w-7 h-7 rounded-md hover:bg-white/[0.05] flex items-center justify-center transition shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                activeTab === tab.key ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
              style={activeTab === tab.key ? {
                background: "linear-gradient(135deg, rgba(84,104,246,0.25) 0%, rgba(84,104,246,0.12) 100%)",
                border: "1px solid rgba(84,104,246,0.3)",
              } : undefined}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* ══ DATA TAB ══════════════════════════════════════════ */}
        {activeTab === "data" && (
          <>
            {/* Data Source */}
            <Section label="Data Source" hint="Which table to query">
              <SearchSelect
                value={widget.dataSource}
                onChange={(v) => onChange({ ...widget, dataSource: v, dimensions: [], metrics: [], filters: [] })}
                options={tableOptions}
                placeholder="Select table..."
                size="md"
                allowEmpty={false}
              />
            </Section>

            {/* Text widget */}
            {isTextWidget && (
              <Section label="Content" hint="Supports plain text and markdown">
                <textarea
                  value={widget.content || ""}
                  onChange={(e) => onChange({ ...widget, content: e.target.value })}
                  className="input w-full h-32 resize-none text-sm"
                  placeholder="Write your note here..."
                />
              </Section>
            )}

            {/* Filter widget */}
            {isFilterWidget && (
              <Section label="Filter Column" hint="Which column this control filters">
                <SearchSelect
                  value={widget.filterColumn || ""}
                  onChange={(v) => onChange({ ...widget, filterColumn: v })}
                  options={colOptions}
                  placeholder="Select column..."
                  size="md"
                />
              </Section>
            )}

            {/* Data widgets */}
            {isDataWidget && (
              <>
                {/* Dimensions */}
                <Section
                  label="Dimensions"
                  hint="Group rows by these columns (X-axis / legend)"
                  action={<AddBtn onClick={() => onChange({ ...widget, dimensions: [...widget.dimensions, { column: "" }] })} />}
                >
                  {widget.dimensions.length === 0 && (
                    <EmptySlot icon="M4 6h16M4 12h8m-8 6h16">Add a dimension to group your data</EmptySlot>
                  )}
                  {widget.dimensions.map((dim, i) => (
                    <div key={i} className="mb-2 rounded-xl p-3 space-y-2 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-1">
                        <div className="text-[9px] text-aura-400 font-bold uppercase tracking-wider">Dimension {i + 1}</div>
                        <div className="flex-1" />
                        <RemoveBtn onClick={() => onChange({ ...widget, dimensions: widget.dimensions.filter((_, j) => j !== i) })} />
                      </div>
                      <SearchSelect
                        value={dim.column}
                        onChange={(v) => { const d = [...widget.dimensions]; d[i] = { ...dim, column: v }; onChange({ ...widget, dimensions: d }); }}
                        options={colOptions}
                        placeholder="Select column..."
                        size="md"
                      />
                      <SearchSelect
                        value={dim.sortDirection || ""}
                        onChange={(v) => { const d = [...widget.dimensions]; d[i] = { ...dim, sortDirection: (v || undefined) as any }; onChange({ ...widget, dimensions: d }); }}
                        options={SORT_OPTIONS}
                        allowEmpty={false}
                        size="md"
                      />
                    </div>
                  ))}
                </Section>

                {/* Metrics */}
                <Section
                  label="Metrics"
                  hint="Values to calculate (Y-axis / numbers)"
                  action={<AddBtn onClick={() => onChange({ ...widget, metrics: [...widget.metrics, { column: "*", aggregate: "COUNT" }] })} />}
                >
                  {widget.metrics.length === 0 && (
                    <EmptySlot icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">Add a metric to measure values</EmptySlot>
                  )}
                  {widget.metrics.map((met, i) => (
                    <div key={i} className="mb-2 rounded-xl p-3 space-y-2 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-1">
                        <div className="text-[9px] text-aura-400 font-bold uppercase tracking-wider">Metric {i + 1}</div>
                        <div className="flex-1" />
                        <RemoveBtn onClick={() => onChange({ ...widget, metrics: widget.metrics.filter((_, j) => j !== i) })} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                        <div>
                          <div className="text-[9px] text-gray-600 mb-1 font-semibold uppercase">Function</div>
                          <SearchSelect
                            value={met.aggregate}
                            onChange={(v) => { const m = [...widget.metrics]; m[i] = { ...met, aggregate: v as any }; onChange({ ...widget, metrics: m }); }}
                            options={AGG_OPTIONS}
                            allowEmpty={false}
                            size="md"
                          />
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-600 mb-1 font-semibold uppercase">Column</div>
                          <SearchSelect
                            value={met.column}
                            onChange={(v) => { const m = [...widget.metrics]; m[i] = { ...met, column: v }; onChange({ ...widget, metrics: m }); }}
                            options={colOptionsWithAll}
                            allowEmpty={false}
                            size="md"
                          />
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-600 mb-1 font-semibold uppercase">Display Label</div>
                          <input
                            value={met.label || ""}
                            onChange={(e) => { const m = [...widget.metrics]; m[i] = { ...met, label: e.target.value }; onChange({ ...widget, metrics: m }); }}
                            className="input-sm w-full"
                            placeholder={`${met.aggregate}(${met.column})`}
                          />
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-600 mb-1 font-semibold uppercase">Format</div>
                          <SearchSelect
                            value={met.format || "number"}
                            onChange={(v) => { const m = [...widget.metrics]; m[i] = { ...met, format: v as any }; onChange({ ...widget, metrics: m }); }}
                            options={FORMAT_OPTIONS}
                            allowEmpty={false}
                            size="md"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </Section>

                {/* Filters */}
                <Section
                  label="Filters"
                  hint="Narrow down data before aggregating"
                  action={<AddBtn onClick={() => onChange({ ...widget, filters: [...widget.filters, { column: "", operator: "=", value: "" }] })} />}
                >
                  {widget.filters.length === 0 && (
                    <EmptySlot icon="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z">No filters — showing all rows</EmptySlot>
                  )}
                  {widget.filters.map((f, i) => (
                    <div key={i} className="mb-2 rounded-xl p-3 space-y-2 animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-1">
                        <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Where</div>
                        <div className="flex-1" />
                        <RemoveBtn onClick={() => onChange({ ...widget, filters: widget.filters.filter((_, j) => j !== i) })} />
                      </div>
                      <SearchSelect
                        value={f.column}
                        onChange={(v) => { const fl = [...widget.filters]; fl[i] = { ...f, column: v }; onChange({ ...widget, filters: fl }); }}
                        options={colOptions}
                        placeholder="Select column..."
                        size="md"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SearchSelect
                            value={f.operator}
                            onChange={(v) => { const fl = [...widget.filters]; fl[i] = { ...f, operator: v as any }; onChange({ ...widget, filters: fl }); }}
                            options={OPERATOR_OPTIONS}
                            allowEmpty={false}
                            size="md"
                          />
                        </div>
                        {!["IS NULL", "IS NOT NULL"].includes(f.operator) && (
                          <input
                            value={f.value}
                            onChange={(e) => { const fl = [...widget.filters]; fl[i] = { ...f, value: e.target.value }; onChange({ ...widget, filters: fl }); }}
                            className="input-sm w-24"
                            placeholder="Value..."
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </Section>
              </>
            )}
          </>
        )}

        {/* ══ APPEARANCE TAB ════════════════════════════════════ */}
        {activeTab === "appearance" && (
          <>
            <Section label="Color Palette" hint="Colors used for chart series">
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                  <button
                    key={name}
                    onClick={() => onChange({ ...widget, style: { ...widget.style, colorPalette: name } })}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150"
                    style={widget.style.colorPalette === name ? {
                      background: "rgba(84,104,246,0.1)",
                      border: "1px solid rgba(84,104,246,0.3)",
                    } : {
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="flex gap-0.5">
                      {colors.slice(0, 5).map((c, j) => (
                        <div key={j} className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-[9px] font-medium capitalize" style={{ color: widget.style.colorPalette === name ? "#818cf8" : "#6b7280" }}>{name}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Options" hint="Toggle visual elements">
              <div className="space-y-3 py-1">
                <Toggle label="Show Legend" value={widget.style.showLegend !== false} onChange={(v) => onChange({ ...widget, style: { ...widget.style, showLegend: v } })} />
                <Toggle label="Show Data Labels" value={widget.style.showLabels === true} onChange={(v) => onChange({ ...widget, style: { ...widget.style, showLabels: v } })} />
                <Toggle label="Smooth Lines" value={widget.style.smooth !== false} onChange={(v) => onChange({ ...widget, style: { ...widget.style, smooth: v } })} />
                <Toggle label="Gradient Fill" value={widget.style.gradientFill !== false} onChange={(v) => onChange({ ...widget, style: { ...widget.style, gradientFill: v } })} />
              </div>
            </Section>
          </>
        )}

        {/* ══ LAYOUT TAB ════════════════════════════════════════ */}
        {activeTab === "layout" && (
          <>
            <Section label="Width" hint="How many columns the widget spans">
              <div className="grid grid-cols-4 gap-1.5">
                {WIDTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ ...widget, w: parseInt(opt.value) })}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all text-center"
                    style={String(widget.w) === opt.value ? {
                      background: "rgba(84,104,246,0.12)",
                      border: "1px solid rgba(84,104,246,0.3)",
                    } : {
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* Mini width visualizer */}
                    <div className="w-full flex gap-0.5 h-4 items-end">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="flex-1 rounded-sm h-full transition-colors" style={{
                          background: j < parseInt(opt.value) ? "rgba(84,104,246,0.6)" : "rgba(255,255,255,0.06)"
                        }} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold ${String(widget.w) === opt.value ? "text-aura-300" : "text-gray-500"}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Height" hint="Pixel height of the widget card">
              <div className="grid grid-cols-5 gap-1.5">
                {HEIGHT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ ...widget, h: parseInt(opt.value) })}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                    style={String(widget.h) === opt.value ? {
                      background: "rgba(84,104,246,0.12)",
                      border: "1px solid rgba(84,104,246,0.3)",
                    } : {
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="flex items-end justify-center w-full px-2">
                      <div className="w-4 rounded-sm" style={{
                        height: `${Math.round(parseInt(opt.value) / 16)}px`,
                        background: String(widget.h) === opt.value ? "rgba(84,104,246,0.6)" : "rgba(255,255,255,0.08)"
                      }} />
                    </div>
                    <span className={`text-[10px] font-bold ${String(widget.h) === opt.value ? "text-aura-300" : "text-gray-500"}`}>{opt.label}</span>
                    <span className="text-[8px] text-gray-700">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Row Limit" hint="Maximum number of data rows to display">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={widget.limit || ""}
                  onChange={(e) => onChange({ ...widget, limit: parseInt(e.target.value) || undefined })}
                  className="input-sm flex-1"
                  placeholder="No limit (show all)"
                  min={1}
                />
                {widget.limit && (
                  <button onClick={() => onChange({ ...widget, limit: undefined })} className="text-gray-600 hover:text-gray-400 text-xs transition">Clear</button>
                )}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ label, hint, children, action }: { label: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <label className="text-[11px] text-gray-300 font-semibold uppercase tracking-wider">{label}</label>
          {hint && <div className="text-[10px] text-gray-600 mt-0.5">{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-[11px] font-semibold text-aura-400 hover:text-aura-300 transition px-2 py-1 rounded-lg hover:bg-aura-500/10 border border-transparent hover:border-aura-500/20">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      Add
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-gray-600 hover:text-red-400 w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/10 transition shrink-0">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  );
}

function EmptySlot({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}>
      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
      </svg>
      <span className="text-[11px] text-gray-600">{children}</span>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-[12px] text-gray-400 group-hover:text-gray-300 transition">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full transition-all duration-200 relative shrink-0"
        style={{
          background: value ? "linear-gradient(135deg, #5468f6, #4352eb)" : "rgba(255,255,255,0.08)",
          boxShadow: value ? "0 0 10px rgba(84,104,246,0.2)" : "inset 0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200 shadow-sm ${value ? "left-[19px]" : "left-[3px]"}`} />
      </button>
    </label>
  );
}
