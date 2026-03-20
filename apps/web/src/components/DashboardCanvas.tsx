import { useState, useCallback } from "react";
import type { Widget, WidgetFilter, WidgetType } from "@/lib/widget-types";
import { WIDGET_CATALOG, createDefaultWidget } from "@/lib/widget-types";
import { WidgetRenderer } from "./WidgetRenderer";
import { WidgetConfigPanel } from "./WidgetConfigPanel";
import { useBIStore } from "@/lib/store";

export function DashboardCanvas() {
  const { activeTable, tables } = useBIStore();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [globalFilters, setGlobalFilters] = useState<WidgetFilter[]>([]);
  const [crossFilters, setCrossFilters] = useState<WidgetFilter[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dashTitle, setDashTitle] = useState("Untitled Dashboard");

  const editingWidget = editingId ? widgets.find((w) => w.id === editingId) : null;

  const allFilters = [...globalFilters.filter((f) => f.column), ...crossFilters.filter((f) => f.column)];

  const addWidget = (type: WidgetType) => {
    const ds = activeTable || tables[0]?.name || "";
    const w = createDefaultWidget(type, ds);
    setWidgets([...widgets, w]);
    setEditingId(w.id);
    setShowAddMenu(false);
  };

  const updateWidget = (updated: Widget) => {
    setWidgets(widgets.map((w) => (w.id === updated.id ? updated : w)));
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleCrossFilter = useCallback((filter: WidgetFilter | null) => {
    if (filter) {
      setCrossFilters((prev) => {
        const existing = prev.findIndex((f) => f.column === filter.column);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = filter;
          return updated;
        }
        return [...prev, filter];
      });
    } else {
      setCrossFilters([]);
    }
  }, []);

  const globalTable = tables.find((t) =>
    widgets.length > 0 ? t.name === widgets[0].dataSource : t.name === activeTable
  );
  const globalColumns = globalTable?.columns || [];

  const categories = [
    { key: "kpi", label: "KPI", types: WIDGET_CATALOG.filter((c) => c.category === "kpi") },
    { key: "chart", label: "Charts", types: WIDGET_CATALOG.filter((c) => c.category === "chart") },
    { key: "table", label: "Table", types: WIDGET_CATALOG.filter((c) => c.category === "table") },
    { key: "filter", label: "Controls", types: WIDGET_CATALOG.filter((c) => c.category === "filter") },
    { key: "text", label: "Text", types: WIDGET_CATALOG.filter((c) => c.category === "text") },
  ];

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] bg-surface-1/80 backdrop-blur-sm">
          {/* Title */}
          <input
            value={dashTitle}
            onChange={(e) => setDashTitle(e.target.value)}
            className="bg-transparent text-sm font-semibold text-gray-200 border-none outline-none min-w-0 w-48"
          />

          <div className="h-4 w-px bg-white/[0.06]" />

          {/* Global Filters */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {globalFilters.map((f, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <select value={f.column} onChange={(e) => {
                  const filters = [...globalFilters];
                  filters[i] = { ...f, column: e.target.value };
                  setGlobalFilters(filters);
                }} className="select-sm">
                  <option value="">Column</option>
                  {globalColumns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select value={f.operator} onChange={(e) => {
                  const filters = [...globalFilters];
                  filters[i] = { ...f, operator: e.target.value as any };
                  setGlobalFilters(filters);
                }} className="select-sm w-12">
                  {["=", "!=", ">", "<", "LIKE", "IN"].map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
                <input value={f.value} onChange={(e) => {
                  const filters = [...globalFilters];
                  filters[i] = { ...f, value: e.target.value };
                  setGlobalFilters(filters);
                }} className="input-sm w-20" placeholder="value" />
                <button onClick={() => setGlobalFilters(globalFilters.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 text-xs px-1 transition">&times;</button>
              </div>
            ))}
            <button onClick={() => setGlobalFilters([...globalFilters, { column: "", operator: "=", value: "" }])} className="btn-ghost text-xs shrink-0">
              + Filter
            </button>
          </div>

          {/* Cross-filter indicator */}
          {crossFilters.length > 0 && (
            <button
              onClick={() => setCrossFilters([])}
              className="flex items-center gap-1.5 text-xs bg-aura-600/15 text-aura-300 border border-aura-500/20 rounded-lg px-2.5 py-1 hover:bg-aura-600/25 transition shrink-0"
            >
              <span>{crossFilters.length} cross-filter{crossFilters.length > 1 ? "s" : ""}</span>
              <span className="text-aura-400">&times;</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/[0.06]" />

          {/* Add Widget */}
          <div className="relative shrink-0">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn-primary text-xs py-1.5">
              + Add Widget
            </button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface-2 border border-white/[0.06] rounded-xl shadow-xl z-50 py-2 animate-slide-up">
                  {categories.map((cat) => (
                    <div key={cat.key}>
                      <div className="text-[10px] text-gray-600 uppercase tracking-wider px-3 pt-2 pb-1">{cat.label}</div>
                      {cat.types.map((c) => (
                        <button
                          key={c.type}
                          onClick={() => addWidget(c.type)}
                          className="w-full text-left px-3 py-1.5 text-[13px] text-gray-300 hover:bg-white/[0.04] hover:text-white transition flex items-center gap-2"
                        >
                          <WidgetIcon type={c.type} />
                          {c.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Widget grid */}
        <div className="flex-1 overflow-auto p-5 bg-surface-0">
          {widgets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-aura-600/20 to-aura-800/10 border border-aura-500/10 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-aura-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">Build your dashboard</p>
                  <p className="text-xs text-gray-600 mt-1 max-w-[260px]">
                    Add scorecards, charts, tables, and filters. Click any chart to cross-filter.
                  </p>
                </div>
                <button onClick={() => setShowAddMenu(true)} className="btn-primary text-xs">
                  + Add your first widget
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {widgets.map((w) => (
                <div key={w.id} style={{ gridColumn: `span ${w.w}` }}>
                  <WidgetRenderer
                    widget={w}
                    globalFilters={allFilters}
                    onEdit={() => setEditingId(editingId === w.id ? null : w.id)}
                    onRemove={() => removeWidget(w.id)}
                    isEditing={editingId === w.id}
                    onCrossFilter={handleCrossFilter}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Config panel */}
      {editingWidget && (
        <WidgetConfigPanel
          widget={editingWidget}
          onChange={updateWidget}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function WidgetIcon({ type }: { type: WidgetType }) {
  const iconMap: Record<string, string> = {
    scorecard: "123", column: "|||", bar: "=", line: "~", area: "^",
    pie: "O", donut: "()O", scatter: ".:.", table: "T",
    treemap: "[]", funnel: "V", gauge: "G", heatmap: "H",
    combo: "M", stacked_column: "|||+", stacked_bar: "=+", stacked_area: "^+",
    filter_dropdown: "v", filter_date_range: "D", text: "Aa",
  };
  return (
    <span className="w-5 h-5 rounded bg-white/[0.04] text-[9px] text-gray-500 flex items-center justify-center font-mono">
      {iconMap[type] || "?"}
    </span>
  );
}
