import { useState, useCallback } from "react";
import type { Widget, WidgetFilter, WidgetType } from "@/lib/widget-types";
import { WIDGET_CATALOG, createDefaultWidget } from "@/lib/widget-types";
import { WidgetRenderer } from "./WidgetRenderer";
import { WidgetConfigPanel } from "./WidgetConfigPanel";
import { WidgetPicker } from "./WidgetPicker";
import { useBIStore } from "@/lib/store";

export function DashboardCanvas() {
  const { activeTable, tables, project, addDashboard, updateDashboard, removeDashboard, setActiveDashboard, getActiveDashboard } = useBIStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [crossFilters, setCrossFilters] = useState<WidgetFilter[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDashList, setShowDashList] = useState(false);

  const dashboard = getActiveDashboard();
  const widgets = dashboard?.widgets || [];
  const globalFilters = dashboard?.globalFilters || [];
  const dashTitle = dashboard?.title || "Untitled";

  const editingWidget = editingId ? widgets.find((w) => w.id === editingId) : null;
  const allFilters = [...globalFilters.filter((f) => f.column), ...crossFilters.filter((f) => f.column)];

  const update = (updates: Partial<{ title: string; widgets: Widget[]; globalFilters: WidgetFilter[] }>) => {
    if (dashboard) updateDashboard(dashboard.id, updates);
  };

  const addWidget = (type: WidgetType) => {
    const ds = activeTable || tables[0]?.name || "";
    const w = createDefaultWidget(type, ds);
    update({ widgets: [...widgets, w] });
    setEditingId(w.id);
    setShowAddMenu(false);
  };

  const updateWidget = (updated: Widget) => {
    update({ widgets: widgets.map((w) => (w.id === updated.id ? updated : w)) });
  };

  const removeWidget = (id: string) => {
    update({ widgets: widgets.filter((w) => w.id !== id) });
    if (editingId === id) setEditingId(null);
  };

  const handleCrossFilter = useCallback((filter: WidgetFilter | null) => {
    if (filter) {
      setCrossFilters((prev) => {
        const i = prev.findIndex((f) => f.column === filter.column);
        if (i >= 0) { const u = [...prev]; u[i] = filter; return u; }
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04] bg-surface-1/80 backdrop-blur-sm">
          {/* Dashboard tabs */}
          <div className="relative flex items-center gap-1 shrink-0">
            {project.dashboards.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDashboard(d.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                  dashboard?.id === d.id
                    ? "text-aura-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                style={dashboard?.id === d.id ? {
                  background: "rgba(84,104,246,0.1)",
                  border: "1px solid rgba(84,104,246,0.2)",
                } : { border: "1px solid transparent" }}
              >
                {d.title}
              </button>
            ))}
            <button
              onClick={() => addDashboard(`Dashboard ${project.dashboards.length + 1}`)}
              className="text-gray-600 hover:text-gray-400 w-6 h-6 rounded-lg hover:bg-white/[0.04] flex items-center justify-center transition text-sm"
            >+</button>
          </div>

          <div className="h-4 w-px bg-white/[0.06]" />

          {/* Title editor */}
          {dashboard && (
            <input
              value={dashTitle}
              onChange={(e) => update({ title: e.target.value })}
              className="bg-transparent text-sm font-semibold text-gray-200 border-none outline-none min-w-0 w-40"
            />
          )}

          <div className="flex-1" />

          {/* Global Filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {globalFilters.map((f, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <select value={f.column} onChange={(e) => {
                  const fl = [...globalFilters]; fl[i] = { ...f, column: e.target.value }; update({ globalFilters: fl });
                }} className="select-sm">
                  <option value="">Col</option>
                  {globalColumns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select value={f.operator} onChange={(e) => {
                  const fl = [...globalFilters]; fl[i] = { ...f, operator: e.target.value as any }; update({ globalFilters: fl });
                }} className="select-sm w-12">
                  {["=", "!=", ">", "<", "LIKE", "IN"].map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
                <input value={f.value} onChange={(e) => {
                  const fl = [...globalFilters]; fl[i] = { ...f, value: e.target.value }; update({ globalFilters: fl });
                }} className="input-sm w-20" placeholder="val" />
                <button onClick={() => update({ globalFilters: globalFilters.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400 text-xs px-1 transition">&times;</button>
              </div>
            ))}
            <button onClick={() => update({ globalFilters: [...globalFilters, { column: "", operator: "=", value: "" }] })} className="btn-ghost text-xs shrink-0">+ Filter</button>
          </div>

          {crossFilters.length > 0 && (
            <button onClick={() => setCrossFilters([])} className="flex items-center gap-1.5 text-xs bg-aura-600/15 text-aura-300 border border-aura-500/20 rounded-lg px-2.5 py-1 hover:bg-aura-600/25 transition shrink-0">
              {crossFilters.length} cross-filter{crossFilters.length > 1 ? "s" : ""} <span className="text-aura-400">&times;</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/[0.06]" />

          {/* Add Widget */}
          <div className="relative shrink-0">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn-primary text-xs py-1.5">+ Widget</button>
          </div>
        </div>

        {showAddMenu && <WidgetPicker onAdd={addWidget} onClose={() => setShowAddMenu(false)} />}

        {/* Grid */}
        <div className="flex-1 overflow-auto p-5 bg-surface-0">
          {widgets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-aura-600/20 to-aura-800/10 border border-aura-500/10 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-aura-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" /></svg>
                </div>
                <p className="text-sm font-medium text-gray-300">Add widgets to this dashboard</p>
                <button onClick={() => setShowAddMenu(true)} className="btn-primary text-xs">+ Add widget</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {widgets.map((w) => (
                <div key={w.id} style={{ gridColumn: `span ${w.w}` }}>
                  <WidgetRenderer widget={w} globalFilters={allFilters} onEdit={() => setEditingId(editingId === w.id ? null : w.id)} onRemove={() => removeWidget(w.id)} isEditing={editingId === w.id} onCrossFilter={handleCrossFilter} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingWidget && <WidgetConfigPanel widget={editingWidget} onChange={updateWidget} onClose={() => setEditingId(null)} />}
    </div>
  );
}
