// Shared types between web and worker

export interface User {
  id: string;
  email: string;
  displayName?: string;
  tier: "free" | "pro" | "enterprise";
}

export interface DashboardConfig {
  charts: ChartConfig[];
  layout?: GridLayout[];
}

export interface ChartConfig {
  id: string;
  type: "bar" | "line" | "pie" | "scatter";
  title: string;
  dataSource: string; // table name
  groupBy?: string;
  aggregate: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
  aggregateColumn?: string;
  limit?: number;
}

export interface GridLayout {
  chartId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DataSourceMeta {
  id: string;
  name: string;
  type: "csv" | "parquet" | "sqlite" | "postgres" | "mysql";
  columns: { name: string; type: string }[];
  rowCount: number;
}

// Environment detection
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

export function isWeb(): boolean {
  return typeof window !== "undefined" && !("__TAURI__" in window);
}
