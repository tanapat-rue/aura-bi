import { useState } from "react";
import { createPortal } from "react-dom";
import type { WidgetType } from "@/lib/widget-types";

// ─── SVG Mini Chart Previews ──────────────────────────────────
const C = "#5468f6";
const C2 = "#a78bfa";
const C3 = "#f472b6";
const C4 = "#fb923c";

function ChartPreviewLine() {
  const pts = "0,55 18,40 36,48 54,22 72,35 90,12 108,28 126,10";
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <polyline points={pts} stroke={C} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {pts.split(" ").map((p, i) => { const [x, y] = p.split(","); return <circle key={i} cx={x} cy={y} r="2.5" fill={C} />; })}
    </svg>
  );
}

function ChartPreviewArea() {
  const pts = "0,55 18,40 36,48 54,22 72,35 90,12 108,28 126,10";
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C} stopOpacity="0.5"/><stop offset="100%" stopColor={C} stopOpacity="0.03"/></linearGradient>
      </defs>
      <polygon points={`0,70 ${pts} 126,70`} fill="url(#ag)" />
      <polyline points={pts} stroke={C} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ChartPreviewStackedArea() {
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <polygon points="0,70 0,45 20,40 45,38 70,35 100,32 130,28 130,70" fill={C} opacity="0.6" />
      <polygon points="0,70 0,55 20,52 45,47 70,43 100,38 130,32 130,70" fill={C2} opacity="0.5" />
      <polygon points="0,70 0,65 20,62 45,58 70,54 100,49 130,45 130,70" fill={C3} opacity="0.4" />
    </svg>
  );
}

function ChartPreviewColumn() {
  const bars = [30, 55, 40, 65, 48, 72, 35];
  const colors = [C, C2, C3, C4, C, C2, C3];
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {bars.map((h, i) => (
        <rect key={i} x={i * 18 + 3} y={70 - h} width="13" height={h} rx="2" fill={colors[i]} opacity="0.85" />
      ))}
    </svg>
  );
}

function ChartPreviewBar() {
  const bars = [60, 40, 75, 50, 65, 30];
  const colors = [C, C2, C3, C4, C, C2];
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {bars.map((w, i) => (
        <rect key={i} x={0} y={i * 11 + 2} width={w} height="9" rx="2" fill={colors[i]} opacity="0.85" />
      ))}
    </svg>
  );
}

function ChartPreviewStackedColumn() {
  const data = [[20, 25, 15], [30, 20, 18], [25, 28, 20], [15, 30, 22]];
  const cols = [C, C2, C3];
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {data.map((seg, i) => {
        let y = 70;
        return seg.map((h, j) => { y -= h; return <rect key={`${i}-${j}`} x={i * 32 + 4} y={y} width="25" height={h} fill={cols[j]} opacity="0.85" />; });
      })}
    </svg>
  );
}

function ChartPreviewStackedBar() {
  const rows = [[45, 30, 25], [35, 40, 25], [50, 25, 25]];
  const cols = [C, C2, C3];
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {rows.map((seg, i) => {
        let x = 0;
        return seg.map((w, j) => { const el = <rect key={`${i}-${j}`} x={x} y={i * 22 + 4} width={w * 1.3} height="16" fill={cols[j]} opacity="0.85" />; x += w * 1.3; return el; });
      })}
    </svg>
  );
}

function ChartPreviewPie() {
  return (
    <svg viewBox="0 0 70 70" fill="none" className="w-full h-full">
      <circle cx="35" cy="35" r="30" fill="none" stroke={C} strokeWidth="60" strokeDasharray="70 190" strokeDashoffset="0" />
      <circle cx="35" cy="35" r="30" fill="none" stroke={C2} strokeWidth="60" strokeDasharray="55 205" strokeDashoffset="-70" />
      <circle cx="35" cy="35" r="30" fill="none" stroke={C3} strokeWidth="60" strokeDasharray="45 215" strokeDashoffset="-125" />
      <circle cx="35" cy="35" r="30" fill="none" stroke={C4} strokeWidth="60" strokeDasharray="90 170" strokeDashoffset="-170" />
    </svg>
  );
}

function ChartPreviewDonut() {
  return (
    <svg viewBox="0 0 70 70" fill="none" className="w-full h-full">
      <circle cx="35" cy="35" r="25" fill="none" stroke={C} strokeWidth="14" strokeDasharray="60 157" strokeDashoffset="0" />
      <circle cx="35" cy="35" r="25" fill="none" stroke={C2} strokeWidth="14" strokeDasharray="40 177" strokeDashoffset="-60" />
      <circle cx="35" cy="35" r="25" fill="none" stroke={C3} strokeWidth="14" strokeDasharray="57 143" strokeDashoffset="-100" />
      <circle cx="35" cy="35" r="10" fill="rgba(18,18,30,0.9)" />
    </svg>
  );
}

function ChartPreviewScatter() {
  const pts = [[10,55],[25,35],[40,60],[55,20],[70,45],[85,30],[100,55],[115,15],[50,50],[30,22]];
  const c = [C, C2, C3, C4, C, C2, C3, C4, C, C2];
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={c[i]} opacity="0.8" />)}
    </svg>
  );
}

function ChartPreviewTreemap() {
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <rect x="1" y="1" width="75" height="45" rx="2" fill={C} opacity="0.7" />
      <rect x="78" y="1" width="51" height="45" rx="2" fill={C2} opacity="0.7" />
      <rect x="1" y="48" width="45" height="21" rx="2" fill={C3} opacity="0.7" />
      <rect x="48" y="48" width="35" height="21" rx="2" fill={C4} opacity="0.7" />
      <rect x="85" y="48" width="44" height="21" rx="2" fill={C} opacity="0.5" />
    </svg>
  );
}

function ChartPreviewFunnel() {
  const layers = [{ w: 110, y: 2 }, { w: 88, y: 16 }, { w: 66, y: 30 }, { w: 44, y: 44 }, { w: 22, y: 58 }];
  const colors = [C, C2, C3, C4, "#fbbf24"];
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {layers.map((l, i) => <rect key={i} x={(130 - l.w) / 2} y={l.y} width={l.w} height="11" rx="3" fill={colors[i]} opacity="0.8" />)}
    </svg>
  );
}

function ChartPreviewGauge() {
  return (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <path d="M 10 55 A 40 40 0 0 1 90 55" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
      <path d="M 10 55 A 40 40 0 0 1 73 21" stroke={C} strokeWidth="10" strokeLinecap="round" />
      <path d="M50 55 L65 26" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="55" r="4" fill={C} />
    </svg>
  );
}

function ChartPreviewHeatmap() {
  const rows = 4; const cols = 6;
  const vals = Array.from({ length: rows * cols }, () => Math.random());
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {vals.map((v, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        return <rect key={i} x={c * 21 + 2} y={r * 17 + 1} width="19" height="15" rx="2" fill={C} opacity={0.15 + v * 0.75} />;
      })}
    </svg>
  );
}

function ChartPreviewCombo() {
  const bars = [40, 55, 48, 65, 52];
  const line = "10,50 36,30 62,40 88,18 114,28";
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {bars.map((h, i) => <rect key={i} x={i * 24 + 4} y={70 - h} width="16" height={h} rx="2" fill={C2} opacity="0.5" />)}
      <polyline points={line} stroke={C3} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {line.split(" ").map((p, i) => { const [x, y] = p.split(","); return <circle key={i} cx={x} cy={y} r="2.5" fill={C3} />; })}
    </svg>
  );
}

function ChartPreviewTable() {
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <rect x="2" y="2" width="126" height="13" rx="2" fill={C} opacity="0.3" />
      {[18, 34, 50].map((y) => (
        <g key={y}>
          <rect x="2" y={y} width="126" height="13" rx="2" fill="rgba(255,255,255,0.03)" />
          {[2, 45, 90].map((x) => <rect key={x} x={x + 3} y={y + 3} width="30" height="6" rx="1" fill="rgba(255,255,255,0.1)" />)}
        </g>
      ))}
    </svg>
  );
}

function ChartPreviewScorecard() {
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      {/* Label */}
      <text x="65" y="16" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="sans-serif" letterSpacing="1">TOTAL REVENUE</text>
      {/* Main number */}
      <text x="65" y="42" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="sans-serif">$1,234</text>
      {/* Trend pill background */}
      <rect x="40" y="50" width="50" height="14" rx="7" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.3)" strokeWidth="0.5" />
      {/* Trend arrow + text inside pill */}
      <text x="65" y="60.5" textAnchor="middle" fill="#6ee7b7" fontSize="7" fontFamily="sans-serif">▲ 12.5% vs prev</text>
    </svg>
  );
}

function ChartPreviewText() {
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <rect x="10" y="15" width="90" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
      <rect x="10" y="27" width="110" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="10" y="36" width="100" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="10" y="45" width="75" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}

function ChartPreviewFilterDropdown() {
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <rect x="10" y="22" width="110" height="26" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="22" y="40" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="sans-serif">Select value...</text>
      <path d="M108 32 L113 38 L118 32" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ChartPreviewDateRange() {
  return (
    <svg viewBox="0 0 130 70" fill="none" className="w-full h-full">
      <rect x="8" y="15" width="52" height="42" rx="5" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="70" y="15" width="52" height="42" rx="5" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {[0,1,2,3,4,5].map((i) => <rect key={i} x={10 + (i % 3) * 17} y={28 + Math.floor(i / 3) * 16} width="13" height="11" rx="2" fill="rgba(84,104,246,0.3)" />)}
      <rect x="10" y="28" width="13" height="11" rx="2" fill={C} opacity="0.8" />
    </svg>
  );
}

const PREVIEW_MAP: Record<string, React.FC> = {
  line: ChartPreviewLine,
  area: ChartPreviewArea,
  stacked_area: ChartPreviewStackedArea,
  column: ChartPreviewColumn,
  bar: ChartPreviewBar,
  stacked_column: ChartPreviewStackedColumn,
  stacked_bar: ChartPreviewStackedBar,
  pie: ChartPreviewPie,
  donut: ChartPreviewDonut,
  scatter: ChartPreviewScatter,
  treemap: ChartPreviewTreemap,
  funnel: ChartPreviewFunnel,
  gauge: ChartPreviewGauge,
  heatmap: ChartPreviewHeatmap,
  combo: ChartPreviewCombo,
  table: ChartPreviewTable,
  scorecard: ChartPreviewScorecard,
  text: ChartPreviewText,
  filter_dropdown: ChartPreviewFilterDropdown,
  filter_date_range: ChartPreviewDateRange,
};

const WIDGET_GROUPS = [
  {
    key: "kpi",
    label: "KPI & Metrics",
    description: "Single number highlights",
    items: [
      { type: "scorecard" as WidgetType, label: "Scorecard", desc: "Big number with trend" },
      { type: "gauge" as WidgetType, label: "Gauge", desc: "Progress toward target" },
    ],
  },
  {
    key: "distribution",
    label: "Distribution",
    description: "Compare values across categories",
    items: [
      { type: "column" as WidgetType, label: "Column Chart", desc: "Vertical bars per category" },
      { type: "bar" as WidgetType, label: "Bar Chart", desc: "Horizontal bars per category" },
      { type: "stacked_column" as WidgetType, label: "Stacked Column", desc: "Stacked vertical segments" },
      { type: "stacked_bar" as WidgetType, label: "Stacked Bar", desc: "Stacked horizontal segments" },
    ],
  },
  {
    key: "trend",
    label: "Trends Over Time",
    description: "Show how values change",
    items: [
      { type: "line" as WidgetType, label: "Line Chart", desc: "Connected trend over time" },
      { type: "area" as WidgetType, label: "Area Chart", desc: "Filled area under trend" },
      { type: "stacked_area" as WidgetType, label: "Stacked Area", desc: "Layered area breakdown" },
      { type: "combo" as WidgetType, label: "Combo Chart", desc: "Bar + line combination" },
    ],
  },
  {
    key: "part_of_whole",
    label: "Part of Whole",
    description: "Show composition",
    items: [
      { type: "pie" as WidgetType, label: "Pie Chart", desc: "Proportional slices" },
      { type: "donut" as WidgetType, label: "Donut Chart", desc: "Pie with center hole" },
      { type: "treemap" as WidgetType, label: "Treemap", desc: "Nested rectangles by size" },
      { type: "funnel" as WidgetType, label: "Funnel", desc: "Staged conversion flow" },
    ],
  },
  {
    key: "relationships",
    label: "Relationships & Patterns",
    description: "Uncover correlation and density",
    items: [
      { type: "scatter" as WidgetType, label: "Scatter Plot", desc: "X vs Y correlation" },
      { type: "heatmap" as WidgetType, label: "Heatmap", desc: "Color-coded value matrix" },
    ],
  },
  {
    key: "data",
    label: "Data Grid",
    description: "Raw tabular data",
    items: [
      { type: "table" as WidgetType, label: "Table", desc: "Sortable data grid" },
    ],
  },
  {
    key: "controls",
    label: "Controls & Text",
    description: "Filters and annotations",
    items: [
      { type: "filter_dropdown" as WidgetType, label: "Dropdown Filter", desc: "Interactive value filter" },
      { type: "filter_date_range" as WidgetType, label: "Date Range", desc: "From / To date picker" },
      { type: "text" as WidgetType, label: "Text / Note", desc: "Markdown annotation block" },
    ],
  },
];

interface WidgetPickerProps {
  onAdd: (type: WidgetType) => void;
  onClose: () => void;
}

export function WidgetPicker({ onAdd, onClose }: WidgetPickerProps) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const searchQuery = search.toLowerCase().trim();

  // Flat list filtered by search across all groups
  const allItems = WIDGET_GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, groupLabel: g.label })));
  const searchResults = searchQuery
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery) ||
        item.desc.toLowerCase().includes(searchQuery) ||
        item.groupLabel.toLowerCase().includes(searchQuery)
      )
    : null;

  const filteredGroups = searchResults
    ? [] // searching mode — use searchResults instead
    : activeGroup
      ? WIDGET_GROUPS.filter((g) => g.key === activeGroup)
      : WIDGET_GROUPS;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-[900px] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-fade-in"
        style={{ background: "linear-gradient(145deg, #16162a 0%, #0f0f1e 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.015)" }}>
          <div className="flex-1">
            <h2 className="font-display font-semibold text-base text-white">Add Widget</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">Choose a chart type for your dashboard</p>
          </div>
          {/* Search */}
          <div className="relative w-52">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              autoFocus
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value) setActiveGroup(null); }}
              placeholder="Search chart types..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white/[0.04] border border-white/[0.08] text-gray-200 placeholder-gray-600 rounded-lg focus:outline-none focus:border-aura-500/50 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition">×</button>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-gray-500 hover:text-gray-300 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar nav */}
          <div className="w-44 shrink-0 border-r border-white/[0.05] p-2 overflow-y-auto">
            <button
              onClick={() => setActiveGroup(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition mb-1 ${!activeGroup ? "bg-aura-600/20 text-aura-300 border border-aura-500/20" : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"}`}
            >All Types</button>
            {WIDGET_GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => setActiveGroup(activeGroup === g.key ? null : g.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition mb-0.5 ${activeGroup === g.key ? "bg-aura-600/20 text-aura-300 border border-aura-500/20" : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"}`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Search results */}
            {searchResults && (
              <div>
                <div className="mb-3">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                    {searchResults.length === 0 ? "No results" : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${search}"`}
                  </div>
                </div>
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {searchResults.map(({ type, label, desc }) => {
                      const Preview = PREVIEW_MAP[type];
                      const isHovered = hovered === type;
                      return (
                        <button
                          key={type}
                          onClick={() => { onAdd(type); onClose(); }}
                          onMouseEnter={() => setHovered(type)}
                          onMouseLeave={() => setHovered(null)}
                          className="group text-left rounded-xl overflow-hidden transition-all duration-200"
                          style={{
                            background: isHovered ? "linear-gradient(135deg, rgba(84,104,246,0.12) 0%, rgba(84,104,246,0.05) 100%)" : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                            border: isHovered ? "1px solid rgba(84,104,246,0.4)" : "1px solid rgba(255,255,255,0.05)",
                            boxShadow: isHovered ? "0 4px 20px rgba(84,104,246,0.12)" : "none",
                            transform: isHovered ? "translateY(-2px)" : "none",
                          }}
                        >
                          <div className="h-[80px] p-3 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            {Preview && <Preview />}
                          </div>
                          <div className="px-3 py-2.5">
                            <div className={`text-[12px] font-semibold transition-colors ${isHovered ? "text-aura-300" : "text-gray-200"}`}>{label}</div>
                            <div className="text-[10px] text-gray-600 mt-0.5 leading-tight">{desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Category groups */}
            {filteredGroups.map((group) => (
              <div key={group.key}>
                <div className="mb-3">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{group.label}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{group.description}</div>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {group.items.map(({ type, label, desc }) => {
                    const Preview = PREVIEW_MAP[type];
                    const isHovered = hovered === type;
                    return (
                      <button
                        key={type}
                        onClick={() => { onAdd(type); onClose(); }}
                        onMouseEnter={() => setHovered(type)}
                        onMouseLeave={() => setHovered(null)}
                        className="group text-left rounded-xl overflow-hidden transition-all duration-200"
                        style={{
                          background: isHovered ? "linear-gradient(135deg, rgba(84,104,246,0.12) 0%, rgba(84,104,246,0.05) 100%)" : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                          border: isHovered ? "1px solid rgba(84,104,246,0.4)" : "1px solid rgba(255,255,255,0.05)",
                          boxShadow: isHovered ? "0 4px 20px rgba(84,104,246,0.12)" : "none",
                          transform: isHovered ? "translateY(-2px)" : "none",
                        }}
                      >
                        {/* Preview area */}
                        <div className="h-[80px] p-3 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          {Preview && <Preview />}
                        </div>
                        {/* Label area */}
                        <div className="px-3 py-2.5">
                          <div className={`text-[12px] font-semibold transition-colors ${isHovered ? "text-aura-300" : "text-gray-200"}`}>{label}</div>
                          <div className="text-[10px] text-gray-600 mt-0.5 leading-tight">{desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
