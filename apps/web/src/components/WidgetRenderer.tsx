import { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { Widget, WidgetFilter } from "@/lib/widget-types";
import { COLOR_PALETTES } from "@/lib/widget-types";
import { queryWidget, getDistinctValues, type WidgetQueryResult } from "@/lib/widget-query";

interface Props {
  widget: Widget;
  globalFilters: WidgetFilter[];
  onEdit: () => void;
  onRemove: () => void;
  isEditing: boolean;
  onCrossFilter?: (filter: WidgetFilter | null) => void;
}

export function WidgetRenderer({ widget, globalFilters, onEdit, onRemove, isEditing, onCrossFilter }: Props) {
  const [data, setData] = useState<WidgetQueryResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!widget.dataSource) return;
    if (widget.type === "text") return;
    setLoading(true);
    setError("");
    queryWidget(widget, globalFilters)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [widget, globalFilters]);

  const palette = COLOR_PALETTES[widget.style.colorPalette || "aura"];

  // Filter controls render differently
  if (widget.type === "filter_dropdown") {
    return <FilterDropdown widget={widget} data={data} onCrossFilter={onCrossFilter} onEdit={onEdit} onRemove={onRemove} isEditing={isEditing} />;
  }

  return (
    <div
      className={`group relative rounded-2xl flex flex-col transition-all duration-400
        ${isEditing ? "ring-2 ring-aura-500/50 -translate-y-1 shadow-glow" : "hover:-translate-y-1 hover:shadow-card-hover hover:ring-1 hover:ring-white/[0.1]"}
        border border-white/[0.05]`}
      style={{ height: widget.h, background: "linear-gradient(135deg, rgba(20,20,28,0.9) 0%, rgba(14,14,20,0.95) 100%)", boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)" }}
    >
      {/* Widget header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <span className="text-[13px] font-semibold text-gray-200 truncate">{widget.title}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={onEdit} className="text-[11px] text-gray-500 hover:text-aura-400 px-2 py-1 rounded-md hover:bg-white/[0.05] transition">
            Configure
          </button>
          <button onClick={onRemove} className="text-[11px] text-gray-500 hover:text-red-400 px-2 py-1 rounded-md hover:bg-white/[0.05] transition">
            Remove
          </button>
        </div>
      </div>

      {/* Body - takes all remaining space */}
      <div className="px-3 pb-3 flex-1 min-h-0 overflow-hidden">
        {loading && <LoadingSkeleton type={widget.type} />}
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
            <svg className="w-8 h-8 text-red-500/80 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="text-red-400 font-semibold text-[11px] uppercase tracking-wider mb-1">Query Error</div>
            <div className="text-gray-500 text-[10px] leading-relaxed max-w-full overflow-hidden text-ellipsis display-webkit-box webkit-line-clamp-3 webkit-box-orient-vertical">
              {error.includes("does not exist") ? (
                <>The table <span className="text-gray-300 font-mono">"{widget.dataSource}"</span> is missing or hasn't been imported.<br/><br/><button onClick={onEdit} className="font-bold text-aura-400 hover:text-aura-300 hover:underline px-3 py-1.5 rounded-md bg-aura-500/10 border border-aura-500/20 transition cursor-pointer">Reconfigure Data Source</button></>
              ) : error}
            </div>
          </div>
        )}
        {!loading && !error && data && renderContent(widget, data, palette, onCrossFilter)}
        {!loading && !error && !data && (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-600 text-xs">Configure this widget</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton({ type }: { type: string }) {
  return (
    <div className="animate-pulse space-y-2 py-4">
      {type === "scorecard" ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-24 bg-white/[0.04] rounded" />
          <div className="h-3 w-16 bg-white/[0.03] rounded" />
        </div>
      ) : (
        <>
          <div className="h-4 w-1/3 bg-white/[0.04] rounded" />
          <div className="flex items-end gap-1 h-32">
            {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-white/[0.03] rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function renderContent(widget: Widget, data: WidgetQueryResult, palette: string[], onCrossFilter?: (f: WidgetFilter | null) => void) {
  switch (widget.type) {
    case "scorecard": return <Scorecard widget={widget} data={data} />;
    case "gauge": return <GaugeChart widget={widget} data={data} palette={palette} />;
    case "table": return <TableWidget data={data} />;
    case "text": return <div className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{widget.content || ""}</div>;
    case "pie":
    case "donut": return <PieChart widget={widget} data={data} palette={palette} onCrossFilter={onCrossFilter} />;
    case "treemap": return <TreemapChart widget={widget} data={data} palette={palette} />;
    case "funnel": return <FunnelChart widget={widget} data={data} palette={palette} />;
    case "heatmap": return <HeatmapChart widget={widget} data={data} palette={palette} />;
    default: return <StandardChart widget={widget} data={data} palette={palette} onCrossFilter={onCrossFilter} />;
  }
}

// ─── Scorecard ───────────────────────────────────────────────

function Scorecard({ widget, data }: { widget: Widget; data: WidgetQueryResult }) {
  const value = data.scalar ?? 0;
  const m = widget.metrics.find((m) => m.column);
  const label = m ? (m.label || `${m.aggregate}(${m.column})`) : "Total Rows";
  const format = m?.format;

  let formatted: string;
  if (format === "currency") formatted = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  else if (format === "percent") formatted = `${(value * 100).toFixed(1)}%`;
  else if (format === "compact") {
    if (value >= 1_000_000) formatted = `${(value / 1_000_000).toFixed(1)}M`;
    else if (value >= 1_000) formatted = `${(value / 1_000).toFixed(1)}K`;
    else formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } else {
    formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  const comp = data.comparisonScalar;
  const delta = comp != null ? value - comp : null;
  const deltaPct = comp != null && comp !== 0 ? ((value - comp) / Math.abs(comp)) * 100 : null;

  return (
    <div className="flex flex-col items-center justify-center py-3 animate-fade-in">
      <div className="text-4xl font-bold text-white tracking-tight">{formatted}</div>
      <div className="text-xs text-gray-500 mt-1.5 font-medium uppercase tracking-wider">{label}</div>
      {delta != null && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${delta >= 0 ? "text-accent-green" : "text-accent-red"}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d={delta >= 0 ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
          {deltaPct != null ? `${Math.abs(deltaPct).toFixed(1)}%` : Math.abs(delta).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ─── Gauge ───────────────────────────────────────────────────

function GaugeChart({ widget, data, palette }: { widget: Widget; data: WidgetQueryResult; palette: string[] }) {
  const value = data.scalar ?? 0;
  const m = widget.metrics.find((m) => m.column);
  const max = widget.limit || Math.ceil(value * 1.5) || 100;

  return (
    <ReactECharts
      style={{ height: "100%" }}
      option={{
        backgroundColor: "transparent",
        series: [{
          type: "gauge",
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max,
          pointer: { show: false },
          progress: {
            show: true,
            width: 14,
            roundCap: true,
            itemStyle: { color: palette[0] },
          },
          axisLine: { lineStyle: { width: 14, color: [[1, "rgba(255,255,255,0.04)"]] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 28,
            fontWeight: 700,
            color: "#fff",
            offsetCenter: [0, "10%"],
            formatter: (v: number) => v.toLocaleString(),
          },
          title: {
            show: true,
            offsetCenter: [0, "40%"],
            fontSize: 11,
            color: "#6b7280",
            text: m?.label || m?.column || "Value",
          },
          data: [{ value }],
        }],
      }}
    />
  );
}

// ─── Table ───────────────────────────────────────────────────

function TableWidget({ data }: { data: WidgetQueryResult }) {
  if (data.rows.length === 0) return <EmptyState />;
  return (
    <div className="overflow-auto rounded-lg text-xs h-full">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-surface-3/90 backdrop-blur-sm">
            {data.columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-white/[0.04]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
              {data.columns.map((c) => (
                <td key={c} className="px-3 py-2 text-gray-300 whitespace-nowrap">
                  {row[c] == null
                    ? <span className="text-gray-600/60 italic">null</span>
                    : typeof row[c] === "number"
                      ? <span className="font-mono tabular-nums">{Number(row[c]).toLocaleString()}</span>
                      : String(row[c])
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Standard Charts (bar, column, line, area, stacked, combo, scatter) ──

function StandardChart({ widget, data, palette, onCrossFilter }: {
  widget: Widget; data: WidgetQueryResult; palette: string[];
  onCrossFilter?: (f: WidgetFilter | null) => void;
}) {
  if (data.rows.length === 0) return <EmptyState />;

  const isHorizontal = widget.type === "bar" || widget.type === "stacked_bar";
  const isStacked = widget.type.startsWith("stacked_");
  const smooth = widget.style.smooth !== false;
  const gradient = widget.style.gradientFill !== false;

  // Scatter
  if (widget.type === "scatter") {
    const xCol = data.columns[0];
    const yCol = data.columns[1] || xCol;
    return (
      <ReactECharts
        style={{ height: "100%" }}
        option={{
          backgroundColor: "transparent",
          tooltip: { trigger: "item", backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.08)", textStyle: { color: "#e5e7eb" } },
          grid: { left: "10%", right: "6%", bottom: "12%", top: "6%" },
          xAxis: { type: "value", name: xCol, ...axisStyle() },
          yAxis: { type: "value", name: yCol, ...axisStyle() },
          series: [{ type: "scatter", data: data.rows.map((r) => [Number(r[xCol]), Number(r[yCol])]), symbolSize: 8, itemStyle: { color: palette[0], shadowBlur: 6, shadowColor: palette[0] + "40" } }],
        }}
      />
    );
  }

  const chartTypeMap: Record<string, string> = {
    bar: "bar", column: "bar", stacked_bar: "bar", stacked_column: "bar",
    line: "line", area: "line", stacked_area: "line", combo: "bar",
  };

  const getSeriesStyle = (type: string, isArea: boolean, color: string) => ({
    stack: isStacked ? "total" : undefined,
    smooth,
    symbol: type === "line" ? "circle" : undefined,
    symbolSize: type === "line" ? 4 : undefined,
    areaStyle: isArea ? { opacity: 0.15, color: gradient ? { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + "40" }, { offset: 1, color: color + "05" }] } : color + "20" } : undefined,
    itemStyle: {
      color: gradient && type === "bar" ? { type: "linear", x: 0, y: isHorizontal ? 0 : 1, x2: isHorizontal ? 1 : 0, y2: 0, colorStops: [{ offset: 0, color: color + "cc" }, { offset: 1, color }] } : color,
      borderRadius: type === "bar" ? (isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) : undefined,
      shadowBlur: type === "bar" ? 4 : 0,
      shadowColor: color + "30",
    },
    lineStyle: type === "line" ? { width: 2.5, shadowBlur: 6, shadowColor: color + "40" } : undefined,
    emphasis: { itemStyle: { shadowBlur: 12, shadowColor: color + "60" } },
  });

  const activeDims = widget.dimensions.filter((d) => d.column);
  let labels: string[] = [];
  let seriesNames: string[] = [];
  let series: any[] = [];

  if (activeDims.length >= 2) {
    const dimCol1 = data.columns[0];
    const dimCol2 = data.columns[1];
    const metricCol = data.columns[2] || data.columns[1];
    
    labels = [...new Set(data.rows.map((r) => String(r[dimCol1])))];
    seriesNames = [...new Set(data.rows.map((r) => String(r[dimCol2])))];
    
    series = seriesNames.map((sName, i) => {
      let type = chartTypeMap[widget.type] || "bar";
      if (widget.type === "combo" && i > 0) type = "line";
      const isArea = widget.type === "area" || widget.type === "stacked_area" || (widget.type === "combo" && i > 0);
      const color = palette[i % palette.length];

      const sData = labels.map((lbl) => {
        const row = data.rows.find((r) => String(r[dimCol1]) === lbl && String(r[dimCol2]) === sName);
        return row ? Number(row[metricCol]) : 0;
      });

      return { name: sName, type, data: sData, ...getSeriesStyle(type, isArea, color) };
    });
  } else {
    const dimCol = data.columns[0] || "total";
    const metricCols = data.columns.slice(1);
    const mCols = metricCols.length > 0 ? metricCols : [dimCol];
    seriesNames = mCols;
    
    labels = data.rows.map((r) => String(r[dimCol]));
    
    series = mCols.map((col, i) => {
      let type = chartTypeMap[widget.type] || "bar";
      if (widget.type === "combo" && i > 0) type = "line";
      const isArea = widget.type === "area" || widget.type === "stacked_area" || (widget.type === "combo" && i > 0);
      const color = palette[i % palette.length];

      return { name: col, type, data: data.rows.map((r) => Number(r[col])), ...getSeriesStyle(type, isArea, color) };
    });
  }

  const categoryAxis = {
    type: "category" as const,
    data: labels,
    axisLabel: { color: "#6b7280", fontSize: 11, rotate: !isHorizontal && labels.length > 8 ? 35 : 0 },
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
    axisTick: { show: false },
  };
  const valueAxis = {
    type: "value" as const,
    ...axisStyle(),
  };

  return (
    <ReactECharts
      style={{ height: "100%" }}
      onEvents={onCrossFilter ? {
        click: (params: any) => {
          const dim = widget.dimensions.find((d) => d.column);
          if (dim && params.name) {
            onCrossFilter({ column: dim.column, operator: "=", value: params.name });
          }
        },
      } : undefined}
      option={{
        backgroundColor: "transparent",
        tooltip: {
          trigger: "axis",
          backgroundColor: "#1a1a24",
          borderColor: "rgba(255,255,255,0.08)",
          textStyle: { color: "#e5e7eb", fontSize: 12 },
          axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.02)" } },
        },
        legend: widget.style.showLegend && seriesNames.length > 1 ? {
          data: seriesNames,
          textStyle: { color: "#9ca3af", fontSize: 11 },
          bottom: 0,
          itemWidth: 12,
          itemHeight: 8,
          itemGap: 16,
        } : undefined,
        grid: {
          left: "8%", right: "4%",
          bottom: seriesNames.length > 1 && widget.style.showLegend ? "18%" : "10%",
          top: "8%",
          containLabel: true,
        },
        xAxis: isHorizontal ? valueAxis : categoryAxis,
        yAxis: isHorizontal ? categoryAxis : valueAxis,
        series,
      }}
    />
  );
}

// ─── Pie / Donut ─────────────────────────────────────────────

// (handled in StandardChart fallback, but let me keep it in renderContent)
// Actually, pie/donut fall through to StandardChart which doesn't handle them.
// Let me fix renderContent above. Actually they go to default case in renderContent -> StandardChart.
// We need to handle them. Let me add to renderContent above by checking widget type in StandardChart.

// Actually let me just handle pie/donut in the StandardChart function:
// Wait, I handle it via default -> StandardChart. Let me check...
// The issue is StandardChart tries to make bar/line but pie needs different handling.
// Let me add pie/donut handling:

// ─── Pie / Donut ─────────────────────────────────────────────

function PieChart({ widget, data, palette, onCrossFilter }: {
  widget: Widget; data: WidgetQueryResult; palette: string[];
  onCrossFilter?: (f: WidgetFilter | null) => void;
}) {
  if (data.rows.length === 0) return <EmptyState />;
  const dimCol = data.columns[0];
  const metCol = data.columns[1] || dimCol;
  const isDonut = widget.type === "donut";

  return (
    <ReactECharts
      style={{ height: "100%" }}
      onEvents={onCrossFilter ? {
        click: (params: any) => {
          const dim = widget.dimensions.find((d) => d.column);
          if (dim && params.name) {
            onCrossFilter({ column: dim.column, operator: "=", value: params.name });
          }
        },
      } : undefined}
      option={{
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          backgroundColor: "#1a1a24",
          borderColor: "rgba(255,255,255,0.08)",
          textStyle: { color: "#e5e7eb" },
        },
        legend: widget.style.showLegend ? {
          orient: "vertical" as const,
          right: "4%",
          top: "center",
          textStyle: { color: "#9ca3af", fontSize: 11 },
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 8,
        } : undefined,
        series: [{
          type: "pie",
          radius: isDonut ? ["50%", "78%"] : ["0%", "78%"],
          center: widget.style.showLegend ? ["35%", "50%"] : ["50%", "50%"],
          data: data.rows.map((r, i) => ({
            name: String(r[dimCol]),
            value: Number(r[metCol]),
            itemStyle: { color: palette[i % palette.length] },
          })),
          label: {
            show: widget.style.showLabels,
            color: "#d1d5db",
            fontSize: 11,
          },
          itemStyle: { borderColor: "#14141c", borderWidth: 3, borderRadius: 4 },
          emphasis: { scaleSize: 6 },
        }],
        color: palette,
      }}
    />
  );
}

// ─── Treemap ─────────────────────────────────────────────────

function TreemapChart({ widget, data, palette }: { widget: Widget; data: WidgetQueryResult; palette: string[] }) {
  if (data.rows.length === 0) return <EmptyState />;
  const dimCol = data.columns[0];
  const metCol = data.columns[1] || dimCol;

  return (
    <ReactECharts
      style={{ height: "100%" }}
      option={{
        backgroundColor: "transparent",
        tooltip: { backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.08)", textStyle: { color: "#e5e7eb" } },
        series: [{
          type: "treemap",
          data: data.rows.map((r, i) => ({
            name: String(r[dimCol]),
            value: Number(r[metCol]),
            itemStyle: { color: palette[i % palette.length], borderColor: "#14141c", borderWidth: 2 },
          })),
          label: { color: "#fff", fontSize: 11, fontWeight: 500 },
          breadcrumb: { show: false },
          itemStyle: { borderRadius: 4 },
        }],
      }}
    />
  );
}

// ─── Funnel ──────────────────────────────────────────────────

function FunnelChart({ widget, data, palette }: { widget: Widget; data: WidgetQueryResult; palette: string[] }) {
  if (data.rows.length === 0) return <EmptyState />;
  const dimCol = data.columns[0];
  const metCol = data.columns[1] || dimCol;

  return (
    <ReactECharts
      style={{ height: "100%" }}
      option={{
        backgroundColor: "transparent",
        tooltip: { backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.08)", textStyle: { color: "#e5e7eb" } },
        series: [{
          type: "funnel",
          left: "10%",
          width: "80%",
          sort: "descending",
          gap: 4,
          label: { color: "#e5e7eb", fontSize: 12 },
          itemStyle: { borderColor: "#14141c", borderWidth: 2 },
          data: data.rows.map((r, i) => ({
            name: String(r[dimCol]),
            value: Number(r[metCol]),
            itemStyle: { color: palette[i % palette.length] },
          })),
        }],
      }}
    />
  );
}

// ─── Heatmap ─────────────────────────────────────────────────

function HeatmapChart({ widget, data, palette }: { widget: Widget; data: WidgetQueryResult; palette: string[] }) {
  if (data.rows.length === 0) return <EmptyState />;

  const xLabels = [...new Set(data.rows.map((r) => String(r.x)))];
  const yLabels = [...new Set(data.rows.map((r) => String(r.y)))];
  const values = data.rows.map((r) => Number(r.value));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const heatData = data.rows.map((r) => [
    xLabels.indexOf(String(r.x)),
    yLabels.indexOf(String(r.y)),
    Number(r.value),
  ]);

  return (
    <ReactECharts
      style={{ height: "100%" }}
      option={{
        backgroundColor: "transparent",
        tooltip: { backgroundColor: "#1a1a24", borderColor: "rgba(255,255,255,0.08)", textStyle: { color: "#e5e7eb" } },
        grid: { left: "12%", right: "12%", bottom: "15%", top: "4%" },
        xAxis: { type: "category", data: xLabels, axisLabel: { color: "#6b7280", fontSize: 10, rotate: 35 }, axisTick: { show: false }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } } },
        yAxis: { type: "category", data: yLabels, axisLabel: { color: "#6b7280", fontSize: 10 }, axisTick: { show: false }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } } },
        visualMap: { min: minVal, max: maxVal, show: false, inRange: { color: ["#14141c", palette[0]] } },
        series: [{
          type: "heatmap",
          data: heatData,
          label: { show: heatData.length < 50, color: "#e5e7eb", fontSize: 10 },
          itemStyle: { borderColor: "#0e0e14", borderWidth: 2, borderRadius: 2 },
        }],
      }}
    />
  );
}

// ─── Filter Dropdown ─────────────────────────────────────────

function FilterDropdown({ widget, data, onCrossFilter, onEdit, onRemove, isEditing }: {
  widget: Widget; data: WidgetQueryResult | null;
  onCrossFilter?: (f: WidgetFilter | null) => void;
  onEdit: () => void; onRemove: () => void; isEditing: boolean;
}) {
  const [selected, setSelected] = useState<string>("");

  const values = data?.rows.map((r) => String(r.value)) || [];

  const handleChange = (val: string) => {
    setSelected(val);
    if (onCrossFilter && widget.filterColumn) {
      if (val) {
        onCrossFilter({ column: widget.filterColumn, operator: "=", value: val });
      } else {
        onCrossFilter(null);
      }
    }
  };

  return (
    <div className={`group rounded-xl overflow-hidden transition-all duration-300 bg-surface-2/80 backdrop-blur-sm border border-white/[0.04] hover:border-white/[0.08] shadow-card px-4 py-3 ${isEditing ? "ring-2 ring-aura-500/60" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[11px] text-gray-500 font-medium mb-1">{widget.title}</div>
          <select
            value={selected}
            onChange={(e) => handleChange(e.target.value)}
            className="select text-sm w-full"
          >
            <option value="">All</option>
            {values.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="text-[10px] text-gray-600 hover:text-aura-400 px-1.5 py-0.5 rounded">Edit</button>
          <button onClick={onRemove} className="text-[10px] text-gray-600 hover:text-red-400 px-1.5 py-0.5 rounded">Del</button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[80px]">
      <div className="text-center">
        <div className="text-gray-600 text-xs">Add dimensions & metrics</div>
      </div>
    </div>
  );
}

function axisStyle() {
  return {
    axisLabel: { color: "#6b7280", fontSize: 11 },
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } },
  };
}
