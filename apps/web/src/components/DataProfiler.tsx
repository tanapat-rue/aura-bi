import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { profileTable, type ColumnProfile } from "@/lib/duckdb";
import { useBIStore } from "@/lib/store";

export function DataProfiler() {
  const { activeTable, profiles, setProfiles } = useBIStore();
  const [loading, setLoading] = useState(false);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);

  const tableProfiles = activeTable ? profiles[activeTable] : null;

  useEffect(() => {
    if (!activeTable || profiles[activeTable]) return;
    setLoading(true);
    profileTable(activeTable)
      .then((p) => setProfiles(activeTable, p))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTable, profiles, setProfiles]);

  if (!activeTable) return <EmptyMsg text="Select a table to profile" />;
  if (loading) return <LoadingState />;
  if (!tableProfiles) return null;

  const totalRows = tableProfiles[0]?.totalRows ?? 0;
  const colsWithNulls = tableProfiles.filter((c) => c.nullCount > 0).length;
  const totalNulls = tableProfiles.reduce((sum, c) => sum + c.nullCount, 0);
  const completeness = totalRows > 0 ? ((totalRows * tableProfiles.length - totalNulls) / (totalRows * tableProfiles.length)) * 100 : 100;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Rows" value={totalRows.toLocaleString()} accent="#5468f6" />
        <KpiCard label="Columns" value={String(tableProfiles.length)} accent="#2dd4bf" />
        <KpiCard label="Completeness" value={`${completeness.toFixed(1)}%`} accent={completeness > 90 ? "#4ade80" : completeness > 70 ? "#fbbf24" : "#f87171"} />
        <KpiCard label="Null Columns" value={`${colsWithNulls} / ${tableProfiles.length}`} accent={colsWithNulls === 0 ? "#4ade80" : "#fbbf24"} />
      </div>

      {/* Column Profiles */}
      <div className="space-y-2">
        {tableProfiles.map((col) => (
          <ColumnCard
            key={col.name}
            col={col}
            expanded={expandedCol === col.name}
            onToggle={() => setExpandedCol(expandedCol === col.name ? null : col.name)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={{
      background: `linear-gradient(135deg, ${accent}12 0%, transparent 60%)`,
      border: `1px solid ${accent}15`,
    }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.05]" style={{ background: accent, filter: "blur(20px)" }} />
      <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `${accent}aa` }}>{label}</div>
      <div className="text-2xl font-bold text-white mt-1 tabular-nums">{value}</div>
    </div>
  );
}

// ─── Column Card ─────────────────────────────────────────────

function ColumnCard({ col, expanded, onToggle }: { col: ColumnProfile; expanded: boolean; onToggle: () => void }) {
  const qualityColor = col.nullPct === 0 ? "#4ade80" : col.nullPct < 10 ? "#fbbf24" : "#f87171";
  const qualityLabel = col.nullPct === 0 ? "Clean" : col.nullPct < 10 ? "Good" : col.nullPct < 50 ? "Warn" : "Poor";
  const isNumeric = col.min != null;
  const isString = col.minLength != null;

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200" style={{
      background: "linear-gradient(135deg, rgba(20,20,28,0.8) 0%, rgba(14,14,20,0.9) 100%)",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>
      {/* Header row */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
        {/* Column name + type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-[13px] text-gray-100">{col.name}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md tracking-wide" style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#9ca3af",
            }}>{col.type}</span>
          </div>
        </div>

        {/* Quality badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ background: qualityColor, boxShadow: `0 0 6px ${qualityColor}40` }} />
          <span className="text-[11px] font-medium" style={{ color: qualityColor }}>{qualityLabel}</span>
        </div>

        {/* Completeness bar */}
        <div className="w-28 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Filled</span>
            <span className="text-[10px] font-medium tabular-nums" style={{ color: qualityColor }}>
              {(100 - col.nullPct).toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${Math.max(100 - col.nullPct, 1)}%`,
              background: `linear-gradient(90deg, ${qualityColor}cc, ${qualityColor})`,
              boxShadow: `0 0 8px ${qualityColor}30`,
            }} />
          </div>
        </div>

        {/* Distinct */}
        <div className="text-right shrink-0 w-20">
          <div className="text-[10px] text-gray-500">Distinct</div>
          <div className="text-[13px] font-semibold text-gray-300 tabular-nums">{col.distinctCount.toLocaleString()}</div>
        </div>

        {/* Expand icon */}
        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-white/[0.03] animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Stats */}
            <div className="space-y-3">
              {/* Numeric stats */}
              {isNumeric && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Statistics</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { l: "Min", v: col.min?.toFixed(2) },
                      { l: "Max", v: col.max?.toFixed(2) },
                      { l: "Mean", v: col.mean?.toFixed(2) },
                      { l: "Median", v: col.median?.toFixed(2) },
                      { l: "Std Dev", v: col.stddev?.toFixed(2) },
                      { l: "Nulls", v: col.nullCount.toLocaleString() },
                    ].map((s) => (
                      <div key={s.l} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                        <span className="text-[11px] text-gray-500">{s.l}</span>
                        <span className="text-[12px] font-mono font-medium text-gray-200 tabular-nums">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* String stats */}
              {isString && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Length</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { l: "Min", v: col.minLength },
                      { l: "Max", v: col.maxLength },
                      { l: "Avg", v: col.avgLength?.toFixed(1) },
                    ].map((s) => (
                      <div key={s.l} className="text-center px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div className="text-[10px] text-gray-500">{s.l}</div>
                        <div className="text-sm font-mono font-medium text-gray-200 mt-0.5">{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isNumeric && !isString && (
                <div className="text-xs text-gray-600">
                  {col.nullCount.toLocaleString()} null values out of {col.totalRows.toLocaleString()} rows
                </div>
              )}
            </div>

            {/* Right: Top Values Chart */}
            <div>
              {col.topValues.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Distribution (Top Values)</div>
                  <ReactECharts
                    style={{ height: 180 }}
                    option={{
                      backgroundColor: "transparent",
                      tooltip: { trigger: "axis", backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.08)", textStyle: { color: "#e5e7eb", fontSize: 11 } },
                      grid: { left: 4, right: 12, top: 4, bottom: 4, containLabel: true },
                      xAxis: { type: "value", show: false },
                      yAxis: {
                        type: "category",
                        data: col.topValues.slice(0, 8).map((t) => t.value.length > 18 ? t.value.slice(0, 18) + "..." : t.value).reverse(),
                        axisLine: { show: false },
                        axisTick: { show: false },
                        axisLabel: { color: "#9ca3af", fontSize: 10, width: 80, overflow: "truncate" },
                      },
                      series: [{
                        type: "bar",
                        data: col.topValues.slice(0, 8).map((t) => t.count).reverse(),
                        barWidth: 12,
                        itemStyle: {
                          borderRadius: [0, 4, 4, 0],
                          color: {
                            type: "linear", x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: [{ offset: 0, color: "#5468f6" + "80" }, { offset: 1, color: "#5468f6" }],
                          },
                        },
                        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(84,104,246,0.3)" } },
                      }],
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <div className="text-gray-600 text-sm text-center py-20">{text}</div>;
}

function LoadingState() {
  return (
    <div className="space-y-3 animate-pulse py-4">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }} />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }} />
      ))}
    </div>
  );
}
