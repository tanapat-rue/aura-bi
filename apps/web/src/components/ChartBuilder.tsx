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
      textStyle: { color: "#9ca3af" },
      tooltip: { trigger: chartType === "pie" ? "item" : ("axis" as const) },
      grid: { left: "10%", right: "10%", bottom: "15%", containLabel: true },
    };

    if (chartType === "pie") {
      return {
        ...base,
        series: [{
          type: "pie",
          radius: ["40%", "70%"],
          data: chartData.map((d) => ({ name: String(d.label), value: Number(d.value) })),
          label: { color: "#d1d5db" },
        }],
      };
    }

    return {
      ...base,
      xAxis: { type: "category" as const, data: labels, axisLabel: { rotate: 45, color: "#9ca3af" } },
      yAxis: { type: "value" as const, axisLabel: { color: "#9ca3af" } },
      series: [{
        type: chartType,
        data: values,
        itemStyle: {
          color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#5c7cfa" }, { offset: 1, color: "#4263eb" }] },
        },
      }],
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
            <option value="scatter">Scatter</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Group By</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
            <option value="">Select column...</option>
            {columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Aggregate</label>
          <select value={aggregate} onChange={(e) => setAggregate(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
            {["COUNT", "SUM", "AVG", "MIN", "MAX"].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {aggregate !== "COUNT" && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Column</label>
            <select value={aggColumn} onChange={(e) => setAggColumn(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
              <option value="">Select...</option>
              {numericColumns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
          <ReactECharts option={getOption()} style={{ height: 400 }} />
        </div>
      )}
    </div>
  );
}
