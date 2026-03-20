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
  { value: "COUNT", label: "COUNT" },
  { value: "COUNT_DISTINCT", label: "COUNT DISTINCT" },
  { value: "SUM", label: "SUM" },
  { value: "AVG", label: "AVG" },
  { value: "MIN", label: "MIN" },
  { value: "MAX", label: "MAX" },
  { value: "MEDIAN", label: "MEDIAN" },
];

const FORMAT_OPTIONS: SelectOption[] = [
  { value: "number", label: "# Number" },
  { value: "compact", label: "K/M Compact" },
  { value: "currency", label: "$ Currency" },
  { value: "percent", label: "% Percent" },
];

const OPERATOR_OPTIONS: SelectOption[] = [
  { value: "=", label: "=" },
  { value: "!=", label: "!=" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "LIKE", label: "LIKE" },
  { value: "IN", label: "IN" },
  { value: "IS NULL", label: "IS NULL" },
  { value: "IS NOT NULL", label: "IS NOT NULL" },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: "", label: "Default" },
  { value: "ASC", label: "A-Z (ascending)" },
  { value: "DESC", label: "Z-A (descending)" },
];

const WIDTH_OPTIONS: SelectOption[] = [
  { value: "1", label: "1/4 width" },
  { value: "2", label: "Half" },
  { value: "3", label: "3/4 width" },
  { value: "4", label: "Full width" },
];

const HEIGHT_OPTIONS: SelectOption[] = [
  { value: "80", label: "XS (80px)" },
  { value: "160", label: "SM (160px)" },
  { value: "240", label: "MD (240px)" },
  { value: "340", label: "LG (340px)" },
  { value: "480", label: "XL (480px)" },
];

export function WidgetConfigPanel({ widget, onChange, onClose }: Props) {
  const { tables } = useBIStore();
  const table = tables.find((t) => t.name === widget.dataSource);
  const columns = table?.columns || [];

  const colOptions: SelectOption[] = columns.map((c) => ({ value: c.name, label: c.name, sublabel: c.type }));
  const colOptionsWithAll: SelectOption[] = [{ value: "*", label: "* (all rows)" }, ...colOptions];
  const tableOptions: SelectOption[] = tables.map((t) => ({ value: t.name, label: t.name, sublabel: `${t.rowCount.toLocaleString()} rows` }));

  const isFilterWidget = widget.type === "filter_dropdown" || widget.type === "filter_date_range";

  const categories = [
    { key: "kpi", label: "KPI" },
    { key: "chart", label: "Charts" },
    { key: "table", label: "Table" },
    { key: "filter", label: "Controls" },
    { key: "text", label: "Text" },
  ];

  return (
    <div className="w-[320px] border-l border-white/[0.04] flex flex-col overflow-hidden shrink-0 animate-slide-in-right" style={{ background: "linear-gradient(180deg, #0e0e16 0%, #0a0a12 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <span className="text-sm font-semibold text-gray-200">Configure</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 w-6 h-6 rounded-md hover:bg-white/[0.05] flex items-center justify-center transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Title */}
        <Section label="Title">
          <input value={widget.title} onChange={(e) => onChange({ ...widget, title: e.target.value })} className="input w-full" />
        </Section>

        {/* Widget Type */}
        <Section label="Type">
          {categories.map((cat) => {
            const items = WIDGET_CATALOG.filter((c) => c.category === cat.key);
            if (items.length === 0) return null;
            return (
              <div key={cat.key} className="mb-2.5">
                <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5 font-semibold">{cat.label}</div>
                <div className="flex flex-wrap gap-1">
                  {items.map((c) => (
                    <button
                      key={c.type}
                      onClick={() => onChange({ ...widget, type: c.type, w: c.defaultW, h: c.defaultH })}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-all duration-150 font-medium ${
                        widget.type === c.type ? "text-aura-300" : "text-gray-500"
                      }`}
                      style={widget.type === c.type ? {
                        background: "rgba(84,104,246,0.12)",
                        border: "1px solid rgba(84,104,246,0.25)",
                        boxShadow: "0 0 8px rgba(84,104,246,0.1)",
                      } : {
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </Section>

        {/* Data Source */}
        <Section label="Data Source">
          <SearchSelect
            value={widget.dataSource}
            onChange={(v) => onChange({ ...widget, dataSource: v, dimensions: [], metrics: [], filters: [] })}
            options={tableOptions}
            placeholder="Select table..."
            size="md"
            allowEmpty={false}
          />
        </Section>

        {/* Filter widget column */}
        {isFilterWidget && (
          <Section label="Filter Column">
            <SearchSelect
              value={widget.filterColumn || ""}
              onChange={(v) => onChange({ ...widget, filterColumn: v })}
              options={colOptions}
              placeholder="Select column..."
              size="md"
            />
          </Section>
        )}

        {/* Text content */}
        {widget.type === "text" && (
          <Section label="Content">
            <textarea value={widget.content || ""} onChange={(e) => onChange({ ...widget, content: e.target.value })} className="input w-full h-24 resize-none" />
          </Section>
        )}

        {!isFilterWidget && widget.type !== "text" && widget.dataSource && (
          <>
            {/* Dimensions */}
            <Section label="Dimensions" action={
              <AddBtn onClick={() => onChange({ ...widget, dimensions: [...widget.dimensions, { column: "" }] })} />
            }>
              {widget.dimensions.length === 0 && <Hint>Group your data by a column</Hint>}
              {widget.dimensions.map((dim, i) => (
                <div key={i} className="flex gap-1.5 mb-2 animate-fade-in">
                  <div className="flex-1">
                    <SearchSelect
                      value={dim.column}
                      onChange={(v) => { const d = [...widget.dimensions]; d[i] = { ...dim, column: v }; onChange({ ...widget, dimensions: d }); }}
                      options={colOptions}
                      placeholder="Column..."
                    />
                  </div>
                  <div className="w-[80px]">
                    <SearchSelect
                      value={dim.sortDirection || ""}
                      onChange={(v) => { const d = [...widget.dimensions]; d[i] = { ...dim, sortDirection: (v || undefined) as any }; onChange({ ...widget, dimensions: d }); }}
                      options={SORT_OPTIONS}
                      allowEmpty={false}
                    />
                  </div>
                  <RemoveBtn onClick={() => onChange({ ...widget, dimensions: widget.dimensions.filter((_, j) => j !== i) })} />
                </div>
              ))}
            </Section>

            {/* Metrics */}
            <Section label="Metrics" action={
              <AddBtn onClick={() => onChange({ ...widget, metrics: [...widget.metrics, { column: "*", aggregate: "COUNT" }] })} />
            }>
              {widget.metrics.length === 0 && <Hint>Defaults to COUNT(*)</Hint>}
              {widget.metrics.map((met, i) => (
                <div key={i} className="space-y-1.5 mb-3 p-2.5 rounded-xl animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="flex gap-1.5">
                    <div className="w-[110px]">
                      <SearchSelect
                        value={met.aggregate}
                        onChange={(v) => { const m = [...widget.metrics]; m[i] = { ...met, aggregate: v as any }; onChange({ ...widget, metrics: m }); }}
                        options={AGG_OPTIONS}
                        allowEmpty={false}
                      />
                    </div>
                    <div className="flex-1">
                      <SearchSelect
                        value={met.column}
                        onChange={(v) => { const m = [...widget.metrics]; m[i] = { ...met, column: v }; onChange({ ...widget, metrics: m }); }}
                        options={colOptionsWithAll}
                        allowEmpty={false}
                      />
                    </div>
                    <RemoveBtn onClick={() => onChange({ ...widget, metrics: widget.metrics.filter((_, j) => j !== i) })} />
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      value={met.label || ""}
                      onChange={(e) => { const m = [...widget.metrics]; m[i] = { ...met, label: e.target.value }; onChange({ ...widget, metrics: m }); }}
                      className="input-sm flex-1"
                      placeholder="Label (optional)"
                    />
                    <div className="w-[100px]">
                      <SearchSelect
                        value={met.format || "number"}
                        onChange={(v) => { const m = [...widget.metrics]; m[i] = { ...met, format: v as any }; onChange({ ...widget, metrics: m }); }}
                        options={FORMAT_OPTIONS}
                        allowEmpty={false}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Section>

            {/* Filters */}
            <Section label="Filters" action={
              <AddBtn onClick={() => onChange({ ...widget, filters: [...widget.filters, { column: "", operator: "=", value: "" }] })} />
            }>
              {widget.filters.map((f, i) => (
                <div key={i} className="flex gap-1.5 mb-2 animate-fade-in">
                  <div className="flex-1">
                    <SearchSelect
                      value={f.column}
                      onChange={(v) => { const fl = [...widget.filters]; fl[i] = { ...f, column: v }; onChange({ ...widget, filters: fl }); }}
                      options={colOptions}
                      placeholder="Column..."
                    />
                  </div>
                  <div className="w-[70px]">
                    <SearchSelect
                      value={f.operator}
                      onChange={(v) => { const fl = [...widget.filters]; fl[i] = { ...f, operator: v as any }; onChange({ ...widget, filters: fl }); }}
                      options={OPERATOR_OPTIONS}
                      allowEmpty={false}
                    />
                  </div>
                  {!["IS NULL", "IS NOT NULL"].includes(f.operator) && (
                    <input value={f.value} onChange={(e) => {
                      const fl = [...widget.filters]; fl[i] = { ...f, value: e.target.value }; onChange({ ...widget, filters: fl });
                    }} className="input-sm w-[70px]" placeholder="val" />
                  )}
                  <RemoveBtn onClick={() => onChange({ ...widget, filters: widget.filters.filter((_, j) => j !== i) })} />
                </div>
              ))}
            </Section>

            {/* Style */}
            <Section label="Appearance">
              <div className="mb-3">
                <div className="text-[10px] text-gray-600 mb-1.5 font-semibold">Color Palette</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                    <button
                      key={name}
                      onClick={() => onChange({ ...widget, style: { ...widget.style, colorPalette: name } })}
                      className="flex gap-0.5 p-1.5 rounded-lg transition-all duration-150"
                      title={name}
                      style={widget.style.colorPalette === name ? {
                        background: "rgba(84,104,246,0.08)",
                        border: "1px solid rgba(84,104,246,0.25)",
                      } : {
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {colors.slice(0, 5).map((c, j) => (
                        <div key={j} className="w-3.5 h-3.5 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Toggle label="Show Legend" value={widget.style.showLegend !== false} onChange={(v) => onChange({ ...widget, style: { ...widget.style, showLegend: v } })} />
                <Toggle label="Show Labels" value={widget.style.showLabels === true} onChange={(v) => onChange({ ...widget, style: { ...widget.style, showLabels: v } })} />
                <Toggle label="Smooth Lines" value={widget.style.smooth !== false} onChange={(v) => onChange({ ...widget, style: { ...widget.style, smooth: v } })} />
                <Toggle label="Gradient Fill" value={widget.style.gradientFill !== false} onChange={(v) => onChange({ ...widget, style: { ...widget.style, gradientFill: v } })} />
              </div>
            </Section>

            {/* Size & Limit */}
            <Section label="Layout">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] text-gray-600 mb-1 font-semibold">Width</div>
                  <SearchSelect value={String(widget.w)} onChange={(v) => onChange({ ...widget, w: parseInt(v) })} options={WIDTH_OPTIONS} allowEmpty={false} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 mb-1 font-semibold">Height</div>
                  <SearchSelect value={String(widget.h)} onChange={(v) => onChange({ ...widget, h: parseInt(v) })} options={HEIGHT_OPTIONS} allowEmpty={false} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 mb-1 font-semibold">Limit</div>
                  <input type="number" value={widget.limit || ""} onChange={(e) => onChange({ ...widget, limit: parseInt(e.target.value) || undefined })} className="input-sm w-full" placeholder="25" />
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-[11px] text-aura-400 hover:text-aura-300 flex items-center gap-0.5 transition font-medium">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      Add
    </button>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-gray-600 hover:text-red-400 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.04] transition shrink-0 self-end">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-gray-600 italic">{children}</div>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-xs text-gray-400 group-hover:text-gray-300 transition">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full transition-all duration-200 relative"
        style={{
          background: value ? "linear-gradient(135deg, #5468f6, #4352eb)" : "rgba(255,255,255,0.08)",
          boxShadow: value ? "0 0 10px rgba(84,104,246,0.2)" : "inset 0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200 shadow-sm ${
          value ? "left-[19px]" : "left-[3px]"
        }`} />
      </button>
    </label>
  );
}
