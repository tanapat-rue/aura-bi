import { useState, useCallback } from "react";
import { useBIStore } from "@/lib/store";
import { executeSQL } from "@/lib/duckdb";
import { WIDGET_CATALOG } from "@/lib/widget-types";
import type { Widget } from "@/lib/widget-types";

// ─── Constants ───────────────────────────────────────────────

const VALID_TYPES = new Set(WIDGET_CATALOG.map((c) => c.type));

const COLOR_PALETTES = ["aura", "ocean", "sunset", "neon", "mono", "nord", "pastel", "earth", "cyberpunk", "retro", "business"];

const TEMPLATES = [
  {
    key: "full",
    label: "Full Dashboard",
    desc: "KPIs + charts + table",
    instructions: `Generate a comprehensive analytics dashboard with:
- Row 1: 3–4 scorecards (w=1 each) showing the most important numeric KPIs
- Row 2: 1 column or line chart (w=2) for a key trend or distribution + 1 bar chart (w=2) for a category breakdown
- Row 3: 1 wide data table (w=3 or 4) showing detailed records
- Optional: 1 filter_dropdown (w=1) for a key categorical column at the very top`,
  },
  {
    key: "kpi",
    label: "KPI Overview",
    desc: "Scorecards and gauges",
    instructions: `Generate a KPI-focused executive dashboard with:
- 4 scorecards (w=1 each) for the most important numeric totals/counts
- 1 gauge (w=1) for a ratio, percentage, or utilization metric
- 1 donut or pie chart (w=1) for the primary category breakdown
- 1 column chart (w=2) showing top N items by a key metric`,
  },
  {
    key: "trend",
    label: "Trend Analysis",
    desc: "Time-series line/area charts",
    instructions: `Generate a trend analysis dashboard focused on change over time:
- 2 scorecards (w=1 each) for current period totals
- 1 large area or line chart (w=4) showing the primary metric over time — use a DATE/TIMESTAMP column as the dimension
- 1 stacked_area or stacked_column chart (w=2) breaking down a metric by category over time
- 1 table (w=2) showing recent records sorted by date DESC
Note: Only use date/time columns as time-axis dimensions.`,
  },
  {
    key: "distribution",
    label: "Distribution",
    desc: "Pie, bar, treemap breakdowns",
    instructions: `Generate a distribution and breakdown dashboard:
- 2 scorecards (w=1 each) for total counts/sums
- 1 pie or donut (w=1) for the primary category split
- 1 bar chart (w=2) for top categories ranked by a metric
- 1 treemap (w=2) for hierarchical or proportional breakdown
- 1 funnel (w=1) if there are ordered stages or ranked groups`,
  },
];

// ─── Prompt Builder ───────────────────────────────────────────

function buildSchemaSection(tables: ReturnType<typeof useBIStore.getState>["tables"], selected: string[]) {
  return selected
    .map((name) => {
      const tbl = tables.find((t) => t.name === name);
      if (!tbl) return "";
      const colRows = tbl.columns.map((c) => `  - ${c.name} (${c.type})`).join("\n");
      return `### Table: "${name}"  (${tbl.rowCount.toLocaleString()} rows)\n${colRows}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildSampleSection(samples: Record<string, { columns: string[]; rows: any[] }>) {
  return Object.entries(samples)
    .map(([name, { columns, rows }]) => {
      if (!rows.length) return "";
      const header = columns.join(" | ");
      const sep = columns.map(() => "---").join(" | ");
      const body = rows.map((r) => columns.map((c) => String(r[c] ?? "")).join(" | ")).join("\n");
      return `#### Sample rows from "${name}"\n| ${header} |\n| ${sep} |\n${rows.map((r) => `| ${columns.map((c) => String(r[c] ?? "")).join(" | ")} |`).join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildFullPrompt(
  templateInstructions: string,
  schemaSection: string,
  sampleSection: string,
) {
  return `You are an expert data analyst generating a JSON dashboard configuration for AuraBi — a browser-based BI and analytics tool.

## YOUR TASK
${templateInstructions}

## DATA SCHEMA
${schemaSection}
${sampleSection ? `\n## SAMPLE DATA\n${sampleSection}` : ""}

## WIDGET TYPES REFERENCE
| Type | Category | Best for | Needs dimensions | Needs metrics |
|------|----------|----------|-----------------|---------------|
| scorecard | KPI | Single metric highlight | 0 | 1 |
| gauge | KPI | Ratio / percentage | 0 | 1 |
| table | table | Detailed records | 0–N | 0–N |
| column | chart | Category comparison (vertical bars) | 1 | 1+ |
| bar | chart | Category comparison (horizontal bars) | 1 | 1+ |
| stacked_column | chart | Multi-metric comparison (stacked vertical) | 1 | 2+ |
| stacked_bar | chart | Multi-metric comparison (stacked horizontal) | 1 | 2+ |
| line | chart | Trend over time | 1 | 1+ |
| area | chart | Trend with volume feel | 1 | 1+ |
| stacked_area | chart | Multiple series trend | 1 | 2+ |
| pie | chart | Part-of-whole split | 1 | 1 |
| donut | chart | Part-of-whole split (modern) | 1 | 1 |
| scatter | chart | Correlation between two metrics | 0–1 | 2 |
| heatmap | chart | Two-dimensional frequency | 2 | 1 |
| combo | chart | Bar + line overlay | 1 | 2+ |
| treemap | chart | Hierarchical proportions | 1 | 1 |
| funnel | chart | Ordered stages / conversion | 1 | 1 |
| text | text | Markdown notes / headers | — | — |
| filter_dropdown | filter | Categorical column filter | — | — |
| filter_date_range | filter | Date/time column filter | — | — |

## GRID LAYOUT SYSTEM
The dashboard uses a **4-column grid**. Widgets appear top-to-bottom, left-to-right in array order.
- w=1 → 25% width   (use for: scorecards, gauges, filters, small charts)
- w=2 → 50% width   (use for: most charts, medium tables)
- w=3 → 75% width   (use for: wide charts or tables)
- w=4 → 100% width  (use for: full-width charts, large tables)

**Layout tip:** To create a 4-KPI row, use four widgets with w=1. To create a 2-chart row, use two widgets with w=2. Rows fill left-to-right; a new row starts when columns sum to 4.

## HEIGHT GUIDE (pixels)
- Scorecards / filters: 120–180
- Gauges / small charts: 220–260
- Standard charts: 300–360
- Large charts / tables: 380–480

## AGGREGATE FUNCTIONS
COUNT | COUNT_DISTINCT | SUM | AVG | MIN | MAX | MEDIAN

## METRIC FORMAT OPTIONS
number | currency | percent | compact

## COLOR PALETTES
${COLOR_PALETTES.join(" | ")}

## OUTPUT FORMAT
Return ONLY valid JSON — no markdown fences, no explanation, no text before or after the JSON object.

\`\`\`json
{
  "title": "Dashboard Title",
  "widgets": [
    {
      "type": "scorecard",
      "title": "Widget Title",
      "dataSource": "table_name",
      "w": 1,
      "h": 160,
      "dimensions": [{ "column": "col_name", "label": "optional display label" }],
      "metrics": [
        {
          "column": "col_name",
          "aggregate": "SUM",
          "label": "optional label",
          "format": "number",
          "color": "#5468f6"
        }
      ],
      "filters": [{ "column": "col_name", "operator": "=", "value": "some_value" }],
      "sortBy": { "column": "col_name", "direction": "DESC" },
      "limit": 20,
      "style": {
        "colorPalette": "aura",
        "showLegend": true,
        "showLabels": false,
        "showGrid": true,
        "smooth": true,
        "gradientFill": true
      },
      "content": "## Markdown (text widget only)",
      "filterColumn": "column_name (filter controls only)"
    }
  ]
}
\`\`\`

## STRICT RULES
1. Use ONLY column names that exist in the provided schema
2. Use ONLY table names from the schema
3. **Each widget can use a DIFFERENT dataSource** — you can mix tables across widgets in the same dashboard
4. For categorical dimensions: prefer VARCHAR/TEXT columns
5. For time-series dimensions: prefer DATE/TIMESTAMP columns
6. For numeric metrics: prefer INTEGER/DOUBLE/FLOAT/DECIMAL/HUGEINT columns
7. w must be 1, 2, 3, or 4
8. h must be a positive integer in pixels
9. Widgets render in array order — put filters first, then KPIs, then charts, then tables
10. Vary colorPalettes for visual interest across widgets
11. text widgets need only "content" (markdown) — no dataSource, dimensions, or metrics required
12. filter_dropdown and filter_date_range need only "filterColumn" — set dataSource to the table containing that column
13. Every widget MUST have: type, title, dataSource (except text widgets), w, h, dimensions[], metrics[], filters[]`;
}

// ─── Validation & Application ─────────────────────────────────

function parseAndValidate(code: string): { title: string; widgets: Widget[] } {
  const stripped = code.trim();
  // Strip markdown fences if present
  const fenceMatch = stripped.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : stripped;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e: any) {
    throw new Error(`JSON parse error: ${e.message}`);
  }

  if (!parsed || typeof parsed !== "object") throw new Error("Expected a JSON object");
  if (!Array.isArray(parsed.widgets)) throw new Error('Missing "widgets" array in JSON');

  const widgets: Widget[] = parsed.widgets.map((w: any, i: number) => {
    const n = i + 1;
    if (!w.type) throw new Error(`Widget ${n}: missing "type"`);
    if (!VALID_TYPES.has(w.type)) throw new Error(`Widget ${n}: unknown type "${w.type}"`);
    if (w.type !== "text" && !w.dataSource) throw new Error(`Widget ${n} (${w.type}): missing "dataSource"`);
    if (!w.title) throw new Error(`Widget ${n}: missing "title"`);
    if (typeof w.w !== "number" || w.w < 1 || w.w > 4) throw new Error(`Widget ${n}: "w" must be 1–4, got ${w.w}`);
    if (typeof w.h !== "number" || w.h < 50) throw new Error(`Widget ${n}: "h" must be >= 50, got ${w.h}`);

    return {
      id: crypto.randomUUID(),
      type: w.type,
      title: w.title,
      dataSource: w.dataSource ?? "",
      dimensions: Array.isArray(w.dimensions) ? w.dimensions : [],
      metrics: Array.isArray(w.metrics) ? w.metrics : [],
      filters: Array.isArray(w.filters) ? w.filters : [],
      sortBy: w.sortBy ?? undefined,
      limit: typeof w.limit === "number" ? w.limit : undefined,
      w: w.w,
      h: w.h,
      style: {
        colorPalette: w.style?.colorPalette ?? "aura",
        showLegend: w.style?.showLegend ?? true,
        showLabels: w.style?.showLabels ?? false,
        showGrid: w.style?.showGrid ?? true,
        smooth: w.style?.smooth ?? true,
        gradientFill: w.style?.gradientFill ?? true,
      },
      content: w.content,
      filterColumn: w.filterColumn,
      comparisonMetric: w.comparisonMetric,
    };
  });

  return { title: parsed.title || "AI Generated Dashboard", widgets };
}

// ─── Component ────────────────────────────────────────────────

export function AgentMode() {
  const { tables, addDashboard, updateDashboard, setViewMode } = useBIStore();
  const project = useBIStore((s) => s.project);

  const [selectedTables, setSelectedTables] = useState<string[]>(tables.map((t) => t.name));
  const [templateKey, setTemplateKey] = useState("full");
  const [includeSample, setIncludeSample] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const [code, setCode] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const template = TEMPLATES.find((t) => t.key === templateKey) ?? TEMPLATES[0];

  const toggleTable = (name: string) =>
    setSelectedTables((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );

  const handleGeneratePrompt = useCallback(async () => {
    if (!selectedTables.length) return;
    setIsGenerating(true);
    try {
      const schemaSection = buildSchemaSection(tables, selectedTables);
      let sampleSection = "";
      if (includeSample) {
        const samples: Record<string, { columns: string[]; rows: any[] }> = {};
        for (const name of selectedTables) {
          try {
            const result = await executeSQL(`SELECT * FROM "${name}" LIMIT 10`);
            samples[name] = result;
          } catch {
            // skip if table fails
          }
        }
        sampleSection = buildSampleSection(samples);
      }
      setGeneratedPrompt(buildFullPrompt(template.instructions, schemaSection, sampleSection));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTables, tables, includeSample, template]);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleApply = useCallback(async () => {
    if (!code.trim()) return;
    setApplyError("");
    setApplySuccess("");
    setIsApplying(true);
    try {
      const { title, widgets } = parseAndValidate(code);
      // Create the dashboard and immediately set its widgets
      addDashboard(title);
      // addDashboard sets activeDashboardId synchronously — grab it
      const newId = useBIStore.getState().project.activeDashboardId!;
      updateDashboard(newId, { widgets });
      setApplySuccess(`Dashboard "${title}" created with ${widgets.length} widget${widgets.length !== 1 ? "s" : ""}!`);
      // Navigate to dashboard view after short delay
      setTimeout(() => setViewMode("chart"), 800);
    } catch (e: any) {
      setApplyError(e.message);
    } finally {
      setIsApplying(false);
    }
  }, [code, addDashboard, updateDashboard, setViewMode]);

  return (
    <div className="flex h-full overflow-hidden gap-0">

      {/* ─── LEFT: PROMPT BUILDER ─── */}
      <div className="flex flex-col w-[420px] flex-shrink-0 border-r border-white/[0.04] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.04]" style={{ background: "linear-gradient(135deg, rgba(84,104,246,0.06) 0%, rgba(14,14,20,0.4) 100%)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(84,104,246,0.15)", border: "1px solid rgba(84,104,246,0.2)" }}>🤖</div>
            <div>
              <div className="text-sm font-bold text-gray-100">Prompt Generator</div>
              <div className="text-[11px] text-gray-500">For ChatGPT, Claude, Gemini, etc.</div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Table Selection */}
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Include Tables</div>
            {tables.length === 0 ? (
              <div className="text-[12px] text-gray-600 italic">No tables loaded</div>
            ) : (
              <div className="space-y-1.5">
                {tables.map((t) => (
                  <label key={t.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.03]" style={{ border: "1px solid rgba(255,255,255,0.05)", background: selectedTables.includes(t.name) ? "rgba(84,104,246,0.06)" : "rgba(255,255,255,0.02)" }}>
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(t.name)}
                      onChange={() => toggleTable(t.name)}
                      className="w-3.5 h-3.5 accent-aura-500 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-200 truncate">{t.name}</div>
                      <div className="text-[10px] text-gray-500">{t.rowCount.toLocaleString()} rows · {t.columns.length} cols</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Template Selector */}
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Prompt Template</div>
            <div className="space-y-1.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.key}
                  onClick={() => setTemplateKey(tmpl.key)}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    border: `1px solid ${templateKey === tmpl.key ? "rgba(84,104,246,0.5)" : "rgba(255,255,255,0.05)"}`,
                    background: templateKey === tmpl.key ? "rgba(84,104,246,0.08)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-200">{tmpl.label}</span>
                    {templateKey === tmpl.key && <div className="w-1.5 h-1.5 rounded-full bg-aura-400" />}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{tmpl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Data Toggle */}
          <label className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div className="text-xs font-semibold text-gray-200">Include sample data</div>
              <div className="text-[10px] text-gray-500">First 10 rows of each table</div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeSample(!includeSample)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${includeSample ? "bg-aura-500" : "bg-surface-3"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${includeSample ? "translate-x-4" : ""}`} />
            </button>
          </label>

          {/* Generate Button */}
          <button
            onClick={handleGeneratePrompt}
            disabled={isGenerating || selectedTables.length === 0}
            className="w-full btn-primary py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Building prompt…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate Prompt
              </>
            )}
          </button>

          {/* Generated Prompt Output */}
          {generatedPrompt && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Generated Prompt</div>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ background: promptCopied ? "rgba(74,222,128,0.1)" : "rgba(84,104,246,0.1)", border: `1px solid ${promptCopied ? "rgba(74,222,128,0.3)" : "rgba(84,104,246,0.2)"}`, color: promptCopied ? "#4ade80" : "#a78bfa" }}
                >
                  {promptCopied ? (
                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                  )}
                </button>
              </div>
              <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
                <textarea
                  readOnly
                  value={generatedPrompt}
                  className="w-full h-48 p-3 text-[10px] font-mono text-gray-400 bg-transparent resize-none focus:outline-none leading-relaxed"
                />
              </div>
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(84,104,246,0.06)", border: "1px solid rgba(84,104,246,0.12)" }}>
                <svg className="w-3.5 h-3.5 text-aura-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[10px] text-gray-500 leading-relaxed">Copy this prompt into ChatGPT, Claude, or any LLM. Then paste the JSON response into the editor on the right.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: CODE EDITOR ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(14,14,20,0.6) 0%, rgba(14,14,20,0.4) 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)" }}>📋</div>
            <div>
              <div className="text-sm font-bold text-gray-100">Dashboard Code Editor</div>
              <div className="text-[11px] text-gray-500">Paste JSON from your LLM — or write it by hand</div>
            </div>
          </div>
          <button
            onClick={handleApply}
            disabled={isApplying || !code.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #5468f6 0%, #7c5af6 100%)", boxShadow: "0 4px 12px rgba(84,104,246,0.3)" }}
          >
            {isApplying ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Applying…</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Apply Dashboard</>
            )}
          </button>
        </div>

        {/* Status banners */}
        {applyError && (
          <div className="mx-5 mt-4 flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="text-[12px] font-semibold text-red-400">Validation Error</div>
              <div className="text-[11px] text-red-400/80 mt-0.5 font-mono">{applyError}</div>
            </div>
            <button onClick={() => setApplyError("")} className="ml-auto text-red-400/60 hover:text-red-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {applySuccess && (
          <div className="mx-5 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="text-[12px] font-semibold text-green-400">{applySuccess}</div>
            <div className="text-[11px] text-green-400/60 ml-auto">Redirecting to Dashboard…</div>
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col p-5 gap-4 overflow-hidden">
          <div className="flex-1 relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
            {/* Line numbers gutter hint */}
            <div className="absolute top-0 left-0 bottom-0 w-10 border-r border-white/[0.04] pointer-events-none" style={{ background: "rgba(0,0,0,0.2)" }} />
            <textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); setApplyError(""); setApplySuccess(""); }}
              placeholder={`Paste JSON from your LLM here…\n\nExpected format:\n{\n  "title": "My Dashboard",\n  "widgets": [\n    {\n      "type": "scorecard",\n      "title": "Total Revenue",\n      "dataSource": "sales",\n      "w": 1,\n      "h": 160,\n      "dimensions": [],\n      "metrics": [{ "column": "amount", "aggregate": "SUM" }],\n      "filters": [],\n      "style": { "colorPalette": "aura" }\n    }\n  ]\n}`}
              className="absolute inset-0 w-full h-full pl-12 pr-4 pt-4 pb-4 text-[12px] font-mono text-gray-300 bg-transparent resize-none focus:outline-none leading-relaxed placeholder-gray-700"
              spellCheck={false}
            />
          </div>

          {/* Quick reference */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            <div className="px-3 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Widget Types</div>
              <div className="flex flex-wrap gap-1">
                {Array.from(VALID_TYPES).map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: "rgba(84,104,246,0.1)", color: "#a78bfa" }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="px-3 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">Color Palettes</div>
              <div className="flex flex-wrap gap-1">
                {COLOR_PALETTES.map((p) => (
                  <span key={p} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24" }}>{p}</span>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1">Aggregates</div>
              <div className="flex flex-wrap gap-1">
                {["COUNT","COUNT_DISTINCT","SUM","AVG","MIN","MAX","MEDIAN"].map((a) => (
                  <span key={a} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: "rgba(34,211,238,0.08)", color: "#22d3ee" }}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
