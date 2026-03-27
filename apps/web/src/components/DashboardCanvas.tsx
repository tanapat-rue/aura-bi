import { useState, useCallback } from "react";
import type { Widget, WidgetFilter, WidgetType } from "@/lib/widget-types";
import { WIDGET_CATALOG, createDefaultWidget } from "@/lib/widget-types";
import { WidgetRenderer } from "./WidgetRenderer";
import { WidgetConfigPanel } from "./WidgetConfigPanel";
import { WidgetPicker } from "./WidgetPicker";
import { useBIStore } from "@/lib/store";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function DashboardCanvas() {
  const { activeTable, tables, project, addDashboard, updateDashboard, removeDashboard, setActiveDashboard, getActiveDashboard } = useBIStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [crossFilters, setCrossFilters] = useState<WidgetFilter[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // Collect columns from every table used by any widget in this dashboard
  const usedTableNames = new Set(widgets.map((w) => w.dataSource).filter(Boolean));
  if (usedTableNames.size === 0 && activeTable) usedTableNames.add(activeTable);
  const globalColumns = tables
    .filter((t) => usedTableNames.has(t.name))
    .flatMap((t) => t.columns.map((c) => ({ ...c, table: t.name })))
    .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i); // dedupe by name

  const captureCanvas = async () => {
    const el = document.getElementById("dashboard-export-area");
    if (!el) throw new Error("Dashboard area not found");
    return html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#0e0e16",
      logging: false,
      // Force canvas elements to be captured correctly
      allowTaint: true,
      foreignObjectRendering: false,
    });
  };

  const handleExport = async (format: "png" | "pdf" | "html") => {
    setShowExportMenu(false);
    setIsExporting(true);

    try {
      const canvas = await captureCanvas();
      const imgData = canvas.toDataURL("image/png");

      if (format === "png") {
        const link = document.createElement("a");
        link.download = `${dashTitle.replace(/\s+/g, "_")}.png`;
        link.href = imgData;
        link.click();
      } else if (format === "pdf") {
        // Use landscape letter-size page and scale image to fit
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "a4",
        });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const aspectRatio = canvas.height / canvas.width;
        const imgH = pageW * aspectRatio;
        const extraPages = Math.ceil(imgH / pageH);
        let yOffset = 0;
        for (let page = 0; page < extraPages; page++) {
          if (page > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, -yOffset, pageW, pageW * aspectRatio);
          yOffset += pageH;
        }
        pdf.save(`${dashTitle.replace(/\s+/g, "_")}.pdf`);
      } else if (format === "html") {
        const w = canvas.width / 2;
        const h = canvas.height / 2;
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${dashTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0e0e16; display: flex; flex-direction: column; align-items: center; padding: 24px; min-height: 100vh; font-family: system-ui, sans-serif; }
    h1 { color: #e5e7eb; font-size: 20px; margin-bottom: 20px; text-align: center; }
    img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 40px rgba(0,0,0,0.6); }
    footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${dashTitle}</h1>
  <img src="${imgData}" width="${w}" height="${h}" alt="Dashboard" />
  <footer>Generated by AuraBI &mdash; ${new Date().toLocaleString()}</footer>
</body>
</html>`;
        const blob = new Blob([html], { type: "text/html" });
        const link = document.createElement("a");
        link.download = `${dashTitle.replace(/\s+/g, "_")}.html`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

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
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04] bg-surface-1/80 backdrop-blur-sm relative z-20">
          {/* Dashboard tabs */}
          <div className="relative flex items-center gap-1 shrink-0">
            {project.dashboards.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDashboard(d.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${dashboard?.id === d.id
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
                  {globalColumns.map((c) => <option key={`${c.table}.${c.name}`} value={c.name}>{usedTableNames.size > 1 ? `${c.table}.${c.name}` : c.name}</option>)}
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

          {/* Export Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || widgets.length === 0}
              className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border transition ${isExporting
                  ? "bg-white/[0.02] border-white/[0.04] text-gray-500 cursor-not-allowed"
                  : "bg-surface-2 border-white/[0.08] hover:bg-surface-3 text-gray-300 hover:text-white cursor-pointer"
                }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {isExporting ? "Exporting..." : "Export"}
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-44 bg-surface-2 border border-white/[0.08] rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-fade-in">
                  <div className="px-4 py-1.5 text-[10px] text-gray-600 font-semibold uppercase tracking-wider">Export Dashboard</div>
                  <div className="h-px bg-white/[0.04] mx-2 mb-1" />
                  <button onClick={() => handleExport("png")} className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.04] transition">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Image (PNG)
                  </button>
                  <button onClick={() => handleExport("pdf")} className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.04] transition">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    PDF Document
                  </button>
                  <button onClick={() => handleExport("html")} className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.04] transition">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    HTML Page
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-white/[0.06]" />

          {/* Add Widget */}
          <div className="relative shrink-0">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn-primary text-xs py-1.5 px-4 shadow-lg shadow-aura-500/20">+ Widget</button>
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
            <div id="dashboard-export-area" className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
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
