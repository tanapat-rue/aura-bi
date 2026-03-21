import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { queryForChart } from "@/lib/duckdb";
import { useBIStore } from "@/lib/store";

type ChartType = "bar" | "line" | "pie" | "scatter";

export function ChartBuilder() {
  const { activeTable, tables } = useBIStore();
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [groupBy, setGroupBy] = useState("");
  const [aggregate, setAggregate] = useState("COUNT");
  const [aggColumn, setAggColumn] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);

  const currentTable = tables.find((t) => t.name === activeTable);
  const columns = currentTable?.columns || [];
  const numericColumns = columns.filter((c) =>
    /INT|FLOAT|DOUBLE|DECIMAL|NUMERIC|REAL|BIGINT|SMALLINT|TINYINT|HUGEINT/i.test(c.type)
  );

  useEffect(() => {
    if (!activeTable || !groupBy) return;
    queryForChart(activeTable, {
      groupBy,
      aggregate,
      aggregateColumn: aggColumn || undefined,
      orderBy: "value DESC",
      limit: 20,
    })
      .then(setChartData)
      .catch(console.error);
  }, [activeTable, groupBy, aggregate, aggColumn]);

  if (!activeTable) return null;

  const labels = chartData.map((d) => String(d.label));
  const values = chartData.map((d) => Number(d.value));

  const getOption = () => {
    const base = {
      backgroundColor: "transparent",
      textStyle: { fontFamily: "Inter, sans-serif", color: "#9ca3af" },
      tooltip: { 
        trigger: chartType === "pie" ? "item" : ("axis" as const),
        backgroundColor: "rgba(14, 14, 20, 0.8)",
        borderColor: "rgba(255,255,255,0.08)",
        textStyle: { color: "#e5e7eb" },
        borderRadius: 8,
        backdropFilter: "blur(12px)"
      },
      grid: { left: "5%", right: "5%", top: "10%", bottom: "10%", containLabel: true },
    };

    if (chartType === "pie") {
      return {
        ...base,
        series: [{
          type: "pie",
          radius: ["50%", "80%"],
          itemStyle: {
            borderRadius: 6,
            borderColor: "#08080d",
            borderWidth: 2,
            shadowBlur: 20,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          },
          data: chartData.map((d) => ({ name: String(d.label), value: Number(d.value) })),
          label: { color: "#d1d5db" },
        }],
      };
    }

    return {
      ...base,
      xAxis: { 
        type: "category" as const, 
        data: labels, 
        axisLabel: { rotate: 45, color: "#6b7280" },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } }
      },
      yAxis: { 
        type: "value" as const, 
        axisLabel: { color: "#6b7280" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)" } }
      },
      series: [{
        type: chartType,
        data: values,
        smooth: chartType === "line",
        symbolSize: 8,
        itemStyle: {
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#a78bfa" }, { offset: 1, color: "#5468f6" }] },
          shadowBlur: 10,
          shadowColor: "rgba(167, 139, 250, 0.3)"
        },
        areaStyle: chartType === "line" ? {
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(84, 104, 246, 0.2)" }, { offset: 1, color: "rgba(84, 104, 246, 0)" }] }
        } : undefined,
      }],
    };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap gap-4 p-5 rounded-2xl glass">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)} className="select w-full">
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
            <option value="scatter">Scatter</option>
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Group By</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="select w-full">
            <option value="">Select column...</option>
            {columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Aggregate</label>
          <select value={aggregate} onChange={(e) => setAggregate(e.target.value)} className="select w-full">
            {["COUNT", "SUM", "AVG", "MIN", "MAX"].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {aggregate !== "COUNT" && (
          <div className="flex-1 min-w-[120px]">
             <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Column</label>
            <select value={aggColumn} onChange={(e) => setAggColumn(e.target.value)} className="select w-full">
              <option value="">Select...</option>
              {numericColumns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl glass relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-aura-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <ReactECharts option={getOption()} style={{ height: 400 }} />
        </div>
      )}
    </div>
  );
}
