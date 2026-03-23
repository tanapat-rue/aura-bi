import { useState, useRef, useCallback } from "react";
import { useBIStore, type Pipeline } from "@/lib/store";
import { type TransformStep, executePipeline, listTables } from "@/lib/duckdb";
import { StepEditor, getStepSummary } from "./StepEditor";
import { SearchSelect, type SelectOption } from "./SearchSelect";

// ─── Step Type Registry ──────────────────────────────────────

interface StepMeta {
  type: string;
  label: string;
  desc: string;
  color: string;
  icon: string;
  category: "clean" | "transform" | "reshape" | "combine" | "advanced";
}

const STEP_TYPES: StepMeta[] = [
  // Clean
  { type: "filter", label: "Filter", desc: "Keep or remove rows", color: "#5468f6", icon: "🔍", category: "clean" },
  { type: "fill_null", label: "Fill Missing", desc: "Replace empty values", color: "#fbbf24", icon: "🩹", category: "clean" },
  { type: "deduplicate", label: "Deduplicate", desc: "Remove duplicate rows", color: "#4ade80", icon: "✨", category: "clean" },
  { type: "drop_columns", label: "Drop Columns", desc: "Remove unwanted columns", color: "#f87171", icon: "🗑️", category: "clean" },
  // Transform
  { type: "rename_column", label: "Rename", desc: "Rename a column", color: "#a78bfa", icon: "✏️", category: "transform" },
  { type: "cast_type", label: "Change Type", desc: "Convert data type", color: "#22d3ee", icon: "🔄", category: "transform" },
  { type: "calculated_field", label: "Formula", desc: "Add computed column", color: "#f472b6", icon: "🧮", category: "transform" },
  { type: "text_transform", label: "Text Transform", desc: "Uppercase, trim, replace", color: "#fb923c", icon: "Aa", category: "transform" },
  { type: "date_extract", label: "Date Parts", desc: "Extract year, month, day", color: "#818cf8", icon: "📅", category: "transform" },
  { type: "concatenate", label: "Concatenate", desc: "Merge columns together", color: "#2dd4bf", icon: "🔗", category: "transform" },
  // Reshape
  { type: "sort", label: "Sort", desc: "Order rows", color: "#fb923c", icon: "↕️", category: "reshape" },
  { type: "group_aggregate", label: "Group & Summarize", desc: "Aggregate by columns", color: "#2dd4bf", icon: "📊", category: "reshape" },
  { type: "limit", label: "Limit", desc: "Cap row count", color: "#94a3b8", icon: "✂️", category: "reshape" },
  // Combine
  { type: "join", label: "Join Tables", desc: "Combine two tables", color: "#818cf8", icon: "🔗", category: "combine" },
  // Advanced
  { type: "json_flatten", label: "JSON Flatten", desc: "Unnest array into rows", color: "#06b6d4", icon: "📋", category: "advanced" },
  { type: "json_split", label: "JSON Split", desc: "Extract JSON fields", color: "#0ea5e9", icon: "📎", category: "advanced" },
  { type: "custom_sql", label: "Custom SQL", desc: "Write raw SQL query", color: "#e879f9", icon: "💻", category: "advanced" },
  { type: "python_script", label: "Python", desc: "Run Pyodide Pandas", color: "#fbbf24", icon: "🐍", category: "advanced" },
  { type: "js_script", label: "JavaScript", desc: "Run JS transform", color: "#fde047", icon: "⚡", category: "advanced" },
];

const CATEGORIES = [
  { key: "clean", label: "Clean", icon: "🧹", desc: "Filter, fill, deduplicate" },
  { key: "transform", label: "Transform", icon: "🔄", desc: "Rename, compute, convert" },
  { key: "reshape", label: "Reshape", icon: "📊", desc: "Sort, group, limit" },
  { key: "combine", label: "Combine", icon: "🔗", desc: "Join tables" },
  { key: "advanced", label: "Advanced", icon: "🧩", desc: "SQL, scripts, JSON" },
] as const;

function getDefaultStep(type: string): TransformStep {
  const map: Record<string, TransformStep> = {
    filter: { type: "filter", column: "", operator: "=", value: "" },
    drop_columns: { type: "drop_columns", columns: [] },
    rename_column: { type: "rename_column", oldName: "", newName: "" },
    cast_type: { type: "cast_type", column: "", newType: "VARCHAR" },
    fill_null: { type: "fill_null", column: "", strategy: "value", value: "" },
    deduplicate: { type: "deduplicate" },
    sort: { type: "sort", column: "", direction: "ASC" },
    calculated_field: { type: "calculated_field", name: "", expression: "" },
    group_aggregate: { type: "group_aggregate", groupBy: [], aggregations: [] },
    join: { type: "join", rightTable: "", leftColumn: "", rightColumn: "", joinType: "INNER" },
    json_flatten: { type: "json_flatten", column: "" },
    json_split: { type: "json_split", column: "", fields: [""] },
    limit: { type: "limit", count: 1000 },
    custom_sql: { type: "custom_sql", sql: "" },
    python_script: { type: "python_script", code: "" },
    js_script: { type: "js_script", code: "" },
    concatenate: { type: "concatenate", columns: [], separator: " ", newName: "" },
    text_transform: { type: "text_transform", column: "", operation: "UPPER" },
    date_extract: { type: "date_extract", column: "", part: "YEAR", newName: "" },
  };
  return map[type] || { type: "filter", column: "", operator: "=", value: "" };
}

function getStepMeta(type: string): StepMeta {
  return STEP_TYPES.find((s) => s.type === type) || { type, label: type, color: "#6b7280", desc: "", icon: "❓", category: "advanced" };
}

// ─── Save As Table Dialog ────────────────────────────────────

function SaveAsTableDialog({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="absolute right-0 top-full mt-2 z-50 p-3 rounded-xl animate-fade-in w-64"
      style={{ background: "linear-gradient(135deg, #18182a, #12121e)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Save as New Table</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-sm w-full mb-2"
        placeholder="table_name"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSave(name.trim()); }}
      />
      <div className="flex gap-1.5">
        <button onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim()} className="btn-primary text-[11px] py-1.5 px-3 flex-1">Save</button>
        <button onClick={onCancel} className="btn-ghost text-[11px] py-1.5 px-3">Cancel</button>
      </div>
    </div>
  );
}

// ─── Step Category Picker ────────────────────────────────────

function StepCategoryPicker({ onSelect, onCancel }: { onSelect: (type: string) => void; onCancel: () => void }) {
  const [activeCategory, setActiveCategory] = useState<string>("clean");

  const stepsInCategory = STEP_TYPES.filter((s) => s.category === activeCategory);

  return (
    <div className="rounded-2xl overflow-hidden animate-slide-up"
      style={{ background: "linear-gradient(135deg, rgba(20,20,28,0.98) 0%, rgba(14,14,20,0.99) 100%)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>

      {/* Category tabs */}
      <div className="flex border-b border-white/[0.04]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-center transition-all duration-200 relative ${
              activeCategory === cat.key ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {activeCategory === cat.key && (
              <div className="absolute inset-0 bg-gradient-to-t from-aura-500/10 to-transparent pointer-events-none" />
            )}
            <span className="text-base">{cat.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">{cat.label}</span>
            {activeCategory === cat.key && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-aura-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Steps grid */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {stepsInCategory.map((st) => (
            <button
              key={st.type}
              onClick={() => onSelect(st.type)}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group text-left"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = st.color + "40";
                e.currentTarget.style.background = st.color + "0a";
                e.currentTarget.style.boxShadow = `0 0 16px ${st.color}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                style={{ background: st.color + "12", border: `1px solid ${st.color}20` }}>
                {st.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-gray-200 group-hover:text-white transition">{st.label}</div>
                <div className="text-[10px] text-gray-500 truncate">{st.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3">
        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-300 transition">Cancel</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Main PipelineBuilder Component ──────────────────────────
// ═══════════════════════════════════════════════════════════════

export function PipelineBuilder() {
  const {
    activeTable, tables, project,
    addPipeline, addStep, removeStep, setActivePipeline,
    previewData, setPreviewData, setProcessing, setTables,
    updatePipeline, saveStageAsTable,
  } = useBIStore();
  const pipelines = project.pipelines;
  const activePipelineId = project.activePipelineId;
  const [showAddStep, setShowAddStep] = useState(false);
  const [error, setError] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [savingAtStep, setSavingAtStep] = useState<number | null>(null);
  const [showFinalSave, setShowFinalSave] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId);

  const createPipeline = () => {
    if (!activeTable) return;
    const count = pipelines.filter(p => p.sourceTable === activeTable).length + 1;
    addPipeline({ id: crypto.randomUUID(), name: `${activeTable} Pipeline ${count}`, sourceTable: activeTable, steps: [] });
  };

  const runPreview = async () => {
    if (!activePipeline) return;
    setProcessing(true); setError("");
    try { setPreviewData(await executePipeline(activePipeline.sourceTable, activePipeline.steps)); }
    catch (e: any) { setError(e.message); }
    finally { setProcessing(false); }
  };

  const handleFinalSave = async (name: string) => {
    if (!activePipeline) return;
    setProcessing(true); setError(""); setShowFinalSave(false);
    try {
      const result = await executePipeline(activePipeline.sourceTable, activePipeline.steps, name);
      setPreviewData(result);
      updatePipeline(activePipeline.id, { outputTable: name });
      setTables(await listTables());
    } catch (e: any) { setError(e.message); }
    finally { setProcessing(false); }
  };

  const handleSaveStage = async (stepIndex: number, tableName: string) => {
    if (!activePipeline) return;
    await saveStageAsTable(activePipeline.id, stepIndex, tableName);
    setSavingAtStep(null);
  };

  // ─── Drag & Drop ──────────────────────────────

  const handleDragStart = (index: number) => { setDragIndex(index); };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex && activePipeline) {
      useBIStore.getState().reorderSteps(activePipeline.id, dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (!activeTable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in h-full">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-3 to-surface-2 border border-white/[0.04] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <p className="text-gray-400 font-medium">Select a table to start transforming</p>
        <p className="text-gray-600 text-sm mt-1">Pick a data source from the sidebar first</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      
      {/* ─── LEFT PANE: DATA PREVIEW (MAIN AREA) ─── */}
      <div className="flex-1 flex flex-col min-w-0 p-6 relative">
        {/* Header / Toggle Config */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 border border-white/[0.05]">
                <svg className="w-4 h-4 text-aura-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
             </div>
             <div>
                <div className="text-sm font-semibold text-gray-200 truncate">{activePipeline?.sourceTable || activeTable}</div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {previewData ? `${previewData.rowCount.toLocaleString()} rows · ${previewData.columns.length} columns` : "Preview not run"}
                </div>
             </div>
          </div>
          <button
             onClick={() => setIsConfigOpen(!isConfigOpen)}
             className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-white bg-surface-1 hover:bg-surface-2 border border-white/[0.05] transition-colors"
          >
             <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isConfigOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
             {isConfigOpen ? 'Hide Pipeline' : 'Show Pipeline'}
          </button>
        </div>

        {/* Data Table Area */}
        <div className="flex-1 rounded-2xl border border-white/[0.05] overflow-hidden flex flex-col relative bg-surface-1/50 shadow-inner">
          {!previewData ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
               <svg className="w-12 h-12 mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
               <p>Run Preview to see transformed data</p>
               {activePipeline && (
                  <button onClick={runPreview} className="mt-4 btn-secondary text-xs px-4 py-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Run Preview Now
                  </button>
               )}
             </div>
          ) : (
             <div className="flex-1 overflow-auto">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ background: "rgba(14,14,20,0.95)", backdropFilter: "blur(8px)" }}>
                      {previewData.columns.map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        {previewData.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-gray-300 whitespace-nowrap max-w-[300px] truncate">
                            {row[col] == null ? <span className="text-gray-600 italic text-xs">null</span> : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}

          {/* Generated SQL Overlay */}
          {previewData?.sql && (
             <div className="absolute bottom-4 right-4 max-w-lg z-20">
                <details className="text-sm group bg-surface-2/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                  <summary className="text-gray-400 cursor-pointer hover:text-gray-200 transition text-xs font-semibold uppercase tracking-wider flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.04]">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    View Generated SQL
                  </summary>
                  <div className="p-4 border-t border-white/10 max-h-64 overflow-auto bg-black/20">
                     <pre className="text-[11px] font-mono text-gray-400 leading-relaxed">{previewData.sql}</pre>
                  </div>
                </details>
             </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANE: PIPELINE BUILDER (SIDEBAR) ─── */}
      <div 
        className={`flex-shrink-0 bg-surface-1 border-l border-white/[0.04] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden shadow-[-20px_0_40px_rgba(0,0,0,0.2)] z-10 flex flex-col`}
        style={{ width: isConfigOpen ? '420px' : '0px' }}
      >
        <div className="w-[420px] flex-1 overflow-y-auto p-5 space-y-5">
      {/* Pipeline selector */}
      <div className="flex flex-col gap-2 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(84,104,246,0.04) 0%, rgba(14,14,20,0.4) 60%)", border: "1px solid rgba(84,104,246,0.08)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: "rgba(84,104,246,0.12)" }}>
            🔬
          </div>
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Data Pipeline</div>
        </div>
        <SearchSelect
          value={activePipelineId || ""}
          onChange={(v) => setActivePipeline(v || null)}
          options={pipelines.filter((p) => p.sourceTable === activeTable).map((p, index) => ({ value: p.id, label: p.name || `Pipeline ${index + 1}`, sublabel: `${p.steps.length} steps` }))}
          placeholder="Select or create a pipeline..."
          size="md"
        />
        <button onClick={createPipeline} className="btn-primary text-[12px] py-2 w-full">
          + New Pipeline
        </button>
      </div>


      {activePipeline && (
        <>
          {/* ─── Source Table Node ──────────────────── */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(84,104,246,0.06) 0%, transparent 60%)", border: "1px solid rgba(84,104,246,0.12)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(84,104,246,0.12)", border: "1px solid rgba(84,104,246,0.2)" }}>
                <svg className="w-5 h-5 text-aura-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Source</div>
                <div className="text-sm font-semibold text-gray-200 truncate">{activePipeline.sourceTable}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {tables.find(t => t.name === activePipeline.sourceTable)?.rowCount.toLocaleString() || "?"} rows
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm("Delete this entire pipeline?")) {
                  useBIStore.getState().removePipeline(activePipeline.id);
                }
              }}
              className="text-gray-600 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition shrink-0"
              title="Delete Pipeline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>

          {/* ─── Steps Flow ────────────────────────── */}
          <div className="relative">
            {/* Vertical connector line */}
            {activePipeline.steps.length > 0 && (
              <div className="absolute left-6 top-0 bottom-4 w-px" style={{ background: "linear-gradient(to bottom, rgba(84,104,246,0.25), rgba(84,104,246,0.05))" }} />
            )}

            <div className="space-y-2 relative">
              {activePipeline.steps.map((step, index) => {
                const meta = getStepMeta(step.type);
                const isExpanded = expandedStep === index;
                const isDragging = dragIndex === index;
                const isDragOver = dragOverIndex === index;
                const summary = getStepSummary(step);

                return (
                  <div
                    key={index}
                    className={`flex gap-3 transition-all duration-200 ${isDragging ? "opacity-40" : ""} ${isDragOver ? "pt-8" : ""}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Step node indicator */}
                    <div className="flex flex-col items-center shrink-0 pt-3.5 cursor-grab active:cursor-grabbing">
                      <div className="w-[28px] h-[28px] rounded-xl flex items-center justify-center text-sm z-10 transition-transform duration-200 hover:scale-110"
                        style={{ background: `${meta.color}20`, border: `1.5px solid ${meta.color}40`, boxShadow: `0 0 12px ${meta.color}15` }}>
                        {meta.icon}
                      </div>
                    </div>

                    {/* Step card */}
                    <div className={`flex-1 rounded-2xl transition-all duration-200 overflow-hidden ${step.hidden ? 'opacity-40 grayscale' : ''}`}
                      style={{
                        background: isExpanded
                          ? "linear-gradient(135deg, rgba(20,20,30,0.95) 0%, rgba(14,14,22,0.98) 100%)"
                          : "linear-gradient(135deg, rgba(20,20,28,0.8) 0%, rgba(14,14,20,0.9) 100%)",
                        border: isExpanded ? `1px solid ${meta.color}25` : "1px solid rgba(255,255,255,0.04)",
                        boxShadow: isExpanded ? `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${meta.color}08` : "none",
                      }}>

                      {/* Header — always visible */}
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : index)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left group"
                      >
                        <div className="w-1 h-6 rounded-full shrink-0" style={{ background: meta.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-gray-200">{meta.label}</span>
                            {step.hidden && <span className="text-[9px] text-gray-600 italic">(hidden)</span>}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5 font-mono">{summary}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Save as table */}
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSavingAtStep(savingAtStep === index ? null : index); }}
                              className="text-gray-600 hover:text-accent-green transition p-1.5 rounded-lg hover:bg-accent-green/10"
                              title="Save up to this step as a new table"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                            </button>
                            {savingAtStep === index && (
                              <SaveAsTableDialog
                                onSave={(name) => handleSaveStage(index, name)}
                                onCancel={() => setSavingAtStep(null)}
                              />
                            )}
                          </div>
                          {/* Toggle visibility */}
                          <button
                            onClick={(e) => { e.stopPropagation(); useBIStore.getState().updateStep(activePipeline.id, index, { ...step, hidden: !step.hidden }); }}
                            className="text-gray-600 hover:text-aura-400 transition p-1.5 rounded-lg hover:bg-white/[0.04]"
                          >
                            {step.hidden ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStep(activePipeline.id, index); if (expandedStep === index) setExpandedStep(null); }}
                            className="text-gray-600 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-500/10"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          {/* Chevron */}
                          <svg className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </button>

                      {/* Expanded editor */}
                      {isExpanded && !step.hidden && (
                        <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 animate-fade-in">
                          <StepEditor
                            step={step}
                            tables={tables}
                            sourceTable={activePipeline.sourceTable}
                            onChange={(updated) => useBIStore.getState().updateStep(activePipeline.id, index, updated)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Add Step Button ────────────────────── */}
          {showAddStep ? (
            <StepCategoryPicker
              onSelect={(type) => {
                addStep(activePipeline.id, getDefaultStep(type));
                setShowAddStep(false);
                setExpandedStep(activePipeline.steps.length); // auto-expand the new step
              }}
              onCancel={() => setShowAddStep(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddStep(true)}
              className="w-full py-4 rounded-2xl text-sm font-medium text-gray-400 hover:text-white transition-all duration-300 group relative overflow-hidden"
              style={{ border: "2px dashed rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(84,104,246,0.35)"; e.currentTarget.style.background = "rgba(84,104,246,0.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-aura-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Transform Step
              </span>
            </button>
          )}

          {/* ─── Action Buttons ───────────────────────── */}
          <div className="flex gap-3">
            <button onClick={runPreview} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Preview Result
            </button>
            <div className="flex-1 relative">
              <button onClick={() => setShowFinalSave(!showFinalSave)} className="btn-primary w-full flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Save as New Table
              </button>
              {showFinalSave && (
                <SaveAsTableDialog
                  onSave={handleFinalSave}
                  onCancel={() => setShowFinalSave(false)}
                />
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 text-red-400/90 text-sm rounded-xl px-4 py-3" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.1)" }}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              <span>{error}</span>
            </div>
          )}
        </>
      )}
        </div>
      </div>

    </div>
  );
}
