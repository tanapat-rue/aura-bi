export type WidgetType =
  | "scorecard"
  | "table"
  | "bar"
  | "column"
  | "stacked_bar"
  | "stacked_column"
  | "line"
  | "area"
  | "stacked_area"
  | "pie"
  | "donut"
  | "scatter"
  | "combo"
  | "treemap"
  | "funnel"
  | "gauge"
  | "heatmap"
  | "text"
  // Interactive filter controls (like Looker Studio)
  | "filter_dropdown"
  | "filter_date_range";

export interface Metric {
  column: string;
  aggregate: "COUNT" | "COUNT_DISTINCT" | "SUM" | "AVG" | "MIN" | "MAX" | "MEDIAN";
  label?: string;
  format?: "number" | "currency" | "percent" | "compact";
  color?: string;
}

export interface Dimension {
  column: string;
  label?: string;
  sortDirection?: "ASC" | "DESC";
  limit?: number;
}

export interface WidgetFilter {
  column: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "IS NULL" | "IS NOT NULL" | "BETWEEN";
  value: string;
}

export interface WidgetStyle {
  colorPalette?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  smooth?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
  innerRadius?: number;
  gradientFill?: boolean;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  dimensions: Dimension[];
  metrics: Metric[];
  filters: WidgetFilter[];
  sortBy?: { column: string; direction: "ASC" | "DESC" };
  limit?: number;
  w: number;
  h: number;
  style: WidgetStyle;
  // Scorecard
  comparisonMetric?: Metric;
  // Text
  content?: string;
  // Filter control
  filterColumn?: string;
  filterValues?: string[];
  // Grid position (set after first drag; auto-packed when missing)
  x?: number;
  y?: number;
}

export interface DashboardState {
  id: string;
  title: string;
  widgets: Widget[];
  globalFilters: WidgetFilter[];
}

export const COLOR_PALETTES: Record<string, string[]> = {
  aura: ["#5468f6", "#a78bfa", "#f472b6", "#fb923c", "#fbbf24", "#4ade80", "#22d3ee", "#f87171"],
  ocean: ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e", "#84cc16", "#a3e635", "#d9f99d"],
  sunset: ["#f43f5e", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4"],
  neon: ["#c084fc", "#e879f9", "#f472b6", "#fb7185", "#f97316", "#fbbf24", "#a3e635", "#4ade80"],
  mono: ["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a"],
  nord: ["#88c0d0", "#81a1c1", "#5e81ac", "#b48ead", "#a3be8c", "#ebcb8b", "#d08770", "#bf616a"],
  pastel: ["#fbcfe8", "#fde047", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#cffafe", "#ffedd5"],
  earth: ["#b45309", "#d97706", "#f59e0b", "#166534", "#15803d", "#22c55e", "#4d7c0f"],
  cyberpunk: ["#fde047", "#f97316", "#ef4444", "#ec4899", "#d946ef", "#8b5cf6", "#0ea5e9"],
  retro: ["#ea580c", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#6366f1", "#d946ef"],
  business: ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"],
};

export const WIDGET_CATALOG: {
  type: WidgetType;
  label: string;
  category: "kpi" | "chart" | "table" | "filter" | "text";
  icon: string;
  defaultW: number;
  defaultH: number;
}[] = [
  // KPIs
  { type: "scorecard", label: "Scorecard", category: "kpi", icon: "123", defaultW: 1, defaultH: 160 },
  { type: "gauge", label: "Gauge", category: "kpi", icon: "gauge", defaultW: 1, defaultH: 240 },
  // Tables
  { type: "table", label: "Table", category: "table", icon: "table", defaultW: 2, defaultH: 360 },
  // Charts
  { type: "column", label: "Column", category: "chart", icon: "column", defaultW: 2, defaultH: 340 },
  { type: "bar", label: "Bar", category: "chart", icon: "bar", defaultW: 2, defaultH: 340 },
  { type: "stacked_column", label: "Stacked Column", category: "chart", icon: "stacked", defaultW: 2, defaultH: 340 },
  { type: "stacked_bar", label: "Stacked Bar", category: "chart", icon: "stacked-h", defaultW: 2, defaultH: 340 },
  { type: "line", label: "Line", category: "chart", icon: "line", defaultW: 2, defaultH: 340 },
  { type: "area", label: "Area", category: "chart", icon: "area", defaultW: 2, defaultH: 340 },
  { type: "stacked_area", label: "Stacked Area", category: "chart", icon: "stacked-area", defaultW: 2, defaultH: 340 },
  { type: "pie", label: "Pie", category: "chart", icon: "pie", defaultW: 1, defaultH: 340 },
  { type: "donut", label: "Donut", category: "chart", icon: "donut", defaultW: 1, defaultH: 340 },
  { type: "treemap", label: "Treemap", category: "chart", icon: "treemap", defaultW: 2, defaultH: 340 },
  { type: "funnel", label: "Funnel", category: "chart", icon: "funnel", defaultW: 1, defaultH: 340 },
  { type: "scatter", label: "Scatter", category: "chart", icon: "scatter", defaultW: 2, defaultH: 340 },
  { type: "heatmap", label: "Heatmap", category: "chart", icon: "heatmap", defaultW: 2, defaultH: 340 },
  { type: "combo", label: "Combo", category: "chart", icon: "combo", defaultW: 2, defaultH: 340 },
  // Filters
  { type: "filter_dropdown", label: "Dropdown Filter", category: "filter", icon: "filter", defaultW: 1, defaultH: 80 },
  { type: "filter_date_range", label: "Date Range", category: "filter", icon: "calendar", defaultW: 1, defaultH: 80 },
  // Text
  { type: "text", label: "Text / Note", category: "text", icon: "text", defaultW: 1, defaultH: 100 },
];

export function createDefaultWidget(type: WidgetType, dataSource: string): Widget {
  const catalog = WIDGET_CATALOG.find((c) => c.type === type)!;
  return {
    id: crypto.randomUUID(),
    type,
    title: catalog.label,
    dataSource,
    dimensions: [],
    metrics: [],
    filters: [],
    w: catalog.defaultW,
    h: catalog.defaultH,
    style: {
      colorPalette: "aura",
      showLegend: true,
      showLabels: false,
      showGrid: true,
      smooth: true,
      gradientFill: true,
    },
  };
}
