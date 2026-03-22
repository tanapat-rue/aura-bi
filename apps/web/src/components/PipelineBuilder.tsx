import { useState } from "react";
import { useBIStore, type Pipeline } from "@/lib/store";
import { type TransformStep, executePipeline, listTables } from "@/lib/duckdb";
import { StepEditor } from "./StepEditor";
import { SearchSelect, type SelectOption } from "./SearchSelect";

const STEP_TYPES: { type: string; label: string; desc: string; color: string }[] = [
  { type: "filter", label: "Filter", desc: "Remove rows by condition", color: "#5468f6" },
  { type: "drop_columns", label: "Drop Columns", desc: "Remove unwanted columns", color: "#f87171" },
  { type: "rename_column", label: "Rename", desc: "Rename a column", color: "#a78bfa" },
  { type: "cast_type", label: "Cast Type", desc: "Change data type", color: "#22d3ee" },
  { type: "fill_null", label: "Fill Nulls", desc: "Replace missing values", color: "#fbbf24" },
  { type: "deduplicate", label: "Deduplicate", desc: "Remove duplicate rows", color: "#4ade80" },
  { type: "sort", label: "Sort", desc: "Order rows", color: "#fb923c" },
  { type: "calculated_field", label: "Calculate", desc: "Add computed column", color: "#f472b6" },
  { type: "group_aggregate", label: "Group By", desc: "Aggregate by columns", color: "#2dd4bf" },
  { type: "join", label: "Join", desc: "Combine two tables", color: "#818cf8" },
  { type: "json_flatten", label: "JSON Flatten", desc: "Unnest array into rows", color: "#06b6d4" },
  { type: "json_split", label: "JSON Split", desc: "Extract fields from JSON", color: "#0ea5e9" },
  { type: "limit", label: "Limit", desc: "Cap row count", color: "#94a3b8" },
  { type: "custom_sql", label: "Custom SQL", desc: "Write raw query", color: "#e879f9" },
  { type: "python_script", label: "Python Script", desc: "Run Pyodide Pandas", color: "#fbbf24" },
  { type: "js_script", label: "JS Script", desc: "Run JavaScript map", color: "#fde047" }
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
  };
  return map[type] || { type: "filter", column: "", operator: "=", value: "" };
}

function getStepMeta(type: string) {
  return STEP_TYPES.find((s) => s.type === type) || { label: type, color: "#6b7280", desc: "" };
}

export function PipelineBuilder() {
  const {
    activeTable, tables, project,
    addPipeline, addStep, removeStep, setActivePipeline,
    previewData, setPreviewData, setProcessing, setTables,
    updatePipeline,
  } = useBIStore();
  const pipelines = project.pipelines;
  const activePipelineId = project.activePipelineId;
  const [showAddStep, setShowAddStep] = useState(false);
  const [error, setError] = useState("");

  const activePipeline = pipelines.find((p) => p.id === activePipelineId);

  const createPipeline = () => {
    if (!activeTable) return;
    const count = pipelines.filter(p => p.sourceTable === activeTable).length + 1;
    addPipeline({ id: crypto.randomUUID(), name: `${activeTable} Transformation ${count}`, sourceTable: activeTable, steps: [] });
  };

  const runPreview = async () => {
    if (!activePipeline) return;
    setProcessing(true); setError("");
    try { setPreviewData(await executePipeline(activePipeline.sourceTable, activePipeline.steps)); }
    catch (e: any) { setError(e.message); }
    finally { setProcessing(false); }
  };

  const materialize = async () => {
    if (!activePipeline) return;
    const outputName = `${activePipeline.sourceTable}_clean`;
    setProcessing(true); setError("");
    try {
      const result = await executePipeline(activePipeline.sourceTable, activePipeline.steps, outputName);
      setPreviewData(result);
      updatePipeline(activePipeline.id, { outputTable: outputName });
      setTables(await listTables());
    } catch (e: any) { setError(e.message); }
    finally { setProcessing(false); }
  };

  if (!activeTable) return <div className="text-gray-600 text-sm text-center py-20">Select a table to build a pipeline</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Pipeline selector */}
      <div className="flex flex-col gap-1.5 bg-surface-1/50 p-4 rounded-xl border border-white/[0.04]">
        <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Pipeline Flow</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchSelect
              value={activePipelineId || ""}
              onChange={(v) => setActivePipeline(v || null)}
              options={pipelines.filter((p) => p.sourceTable === activeTable).map((p, index) => ({ value: p.id, label: p.name || `${activeTable} Flow ${index + 1}`, sublabel: `${p.steps.length} steps` }))}
              placeholder="Select or create a transformation pipeline..."
              size="md"
            />
          </div>
          <button onClick={createPipeline} className="btn-primary">New Transformation</button>
        </div>
      </div>

      {activePipeline && (
        <>
          {/* Source badge */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(84,104,246,0.08) 0%, transparent 60%)", border: "1px solid rgba(84,104,246,0.1)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(84,104,246,0.15)" }}>
              <svg className="w-4 h-4 text-aura-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Source Table</div>
              <div className="text-sm font-semibold text-gray-200">{activePipeline.sourceTable}</div>
            </div>
            <div className="text-xs text-gray-500">
              {activePipeline.steps.length} step{activePipeline.steps.length !== 1 ? "s" : ""}
            </div>
            {activePipeline.outputTable && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                <span className="text-sm font-semibold text-accent-green">{activePipeline.outputTable}</span>
              </div>
            )}
            
            <div className="w-px h-6 bg-white/[0.06] mx-1" />
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to delete this entire transformation pipeline?")) {
                  useBIStore.getState().removePipeline(activePipeline.id);
                }
              }}
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition"
              title="Delete Pipeline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>

          {/* Steps - visual flow */}
          <div className="relative">
            {/* Vertical line */}
            {activePipeline.steps.length > 0 && (
              <div className="absolute left-[23px] top-0 bottom-0 w-px" style={{ background: "linear-gradient(to bottom, rgba(84,104,246,0.3), rgba(84,104,246,0.05))" }} />
            )}

            <div className="space-y-3 relative">
              {activePipeline.steps.map((step, index) => {
                const meta = getStepMeta(step.type);
                return (
                  <div key={index} className="flex gap-4 animate-fade-in">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center shrink-0 pt-4">
                      <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white z-10"
                        style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}40` }}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Step card */}
                    <div className={`flex-1 rounded-xl transition-all duration-200 hover:border-white/[0.08] relative ${step.hidden ? 'opacity-50 grayscale bg-black/40' : ''}`}
                      style={{ background: step.hidden ? undefined : "linear-gradient(135deg, rgba(20,20,28,0.9) 0%, rgba(14,14,20,0.95) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1.5 h-5 rounded-full" style={{ background: meta.color }} />
                          <div>
                            <div className="text-[13px] font-semibold text-gray-200">{meta.label} {step.hidden && <span className="text-[10px] ml-2 text-aura-400 font-normal italic">(Hidden)</span>}</div>
                            <div className="text-[10px] text-gray-500">{meta.desc}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => useBIStore.getState().updateStep(activePipeline.id, index, { ...step, hidden: !step.hidden })} className="text-gray-500 hover:text-aura-400 transition p-1.5 rounded-md hover:bg-white/[0.04]">
                            {step.hidden ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                          <button onClick={() => removeStep(activePipeline.id, index)} className="text-gray-500 hover:text-red-400 transition p-1.5 rounded-md hover:bg-white/[0.04]">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      {!step.hidden && (
                        <div className="px-4 pb-4 border-t border-white/[0.03] pt-3">
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

          {/* Add step */}
          {showAddStep ? (
            <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, rgba(20,20,28,0.9) 0%, rgba(14,14,20,0.95) 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Choose Transform</div>
              <div className="grid grid-cols-3 gap-2">
                {STEP_TYPES.map((st) => (
                  <button
                    key={st.type}
                    onClick={() => { addStep(activePipeline.id, getDefaultStep(st.type)); setShowAddStep(false); }}
                    className="text-left px-3.5 py-2.5 rounded-xl transition-all duration-150 group/step"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = st.color + "30";
                      e.currentTarget.style.background = st.color + "08";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 rounded-full" style={{ background: st.color }} />
                      <div>
                        <div className="text-[12px] font-semibold text-gray-200">{st.label}</div>
                        <div className="text-[10px] text-gray-500">{st.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddStep(false)} className="text-xs text-gray-500 mt-3 hover:text-gray-300 transition">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddStep(true)}
              className="w-full py-3.5 rounded-xl text-sm text-gray-400 hover:text-gray-200 transition-all duration-200"
              style={{ border: "2px dashed rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(84,104,246,0.3)"; e.currentTarget.style.background = "rgba(84,104,246,0.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}
            >
              + Add Transform Step
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={runPreview} className="btn-secondary flex-1">Preview Result</button>
            <button onClick={materialize} className="btn-primary flex-1">Materialize as Table</button>
          </div>

          {error && <div className="text-red-400/90 text-sm rounded-xl px-4 py-3" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.1)" }}>{error}</div>}

          {/* Generated SQL */}
          {previewData?.sql && (
            <details className="text-sm group">
              <summary className="text-gray-500 cursor-pointer hover:text-gray-300 transition text-xs font-medium">Show generated SQL</summary>
              <pre className="mt-2 rounded-xl p-4 text-xs font-mono text-gray-400 overflow-auto" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>{previewData.sql}</pre>
            </details>
          )}

          {/* Preview table */}
          {previewData && previewData.rows.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                Result: {previewData.rowCount.toLocaleString()} rows, {previewData.columns.length} columns
              </div>
              <div className="overflow-auto max-h-72">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ background: "rgba(14,14,20,0.95)" }}>
                      {previewData.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.015] transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                        {previewData.columns.map((col) => (
                          <td key={col} className="px-3 py-1.5 text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                            {row[col] == null ? <span className="text-gray-600 italic text-xs">null</span> : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
