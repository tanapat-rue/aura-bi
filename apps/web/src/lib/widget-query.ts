import { getConnection } from "./duckdb";
import type { Widget, WidgetFilter, Metric } from "./widget-types";

function buildFilterClause(filters: WidgetFilter[]): string {
  const valid = filters.filter((f) => f.column);
  if (valid.length === 0) return "";
  const conditions = valid.map((f) => {
    const col = `"${f.column}"`;
    if (f.operator === "IS NULL") return `${col} IS NULL`;
    if (f.operator === "IS NOT NULL") return `${col} IS NOT NULL`;
    if (f.operator === "IN") {
      const vals = f.value.split(",").map((v) => `'${v.trim()}'`).join(",");
      return `${col} IN (${vals})`;
    }
    if (f.operator === "BETWEEN") {
      const [a, b] = f.value.split(",").map((v) => v.trim());
      return `${col} BETWEEN '${a}' AND '${b}'`;
    }
    if (f.operator === "LIKE") return `${col} LIKE '${f.value}'`;
    const isNum = f.value !== "" && !isNaN(Number(f.value));
    const val = isNum ? f.value : `'${f.value}'`;
    return `${col} ${f.operator} ${val}`;
  });
  return `WHERE ${conditions.join(" AND ")}`;
}

function metricExpr(m: Metric): string {
  const col = m.column === "*" ? "*" : `"${m.column}"`;
  if (m.aggregate === "COUNT_DISTINCT") return `COUNT(DISTINCT ${col})`;
  return `${m.aggregate}(${col})`;
}

function metricAlias(m: Metric, index: number): string {
  return m.label || `${m.aggregate.toLowerCase()}_${m.column === "*" ? "all" : m.column}`;
}

export interface WidgetQueryResult {
  columns: string[];
  rows: any[];
  scalar?: number;
  comparisonScalar?: number;
}

export async function queryWidget(
  widget: Widget,
  globalFilters: WidgetFilter[] = []
): Promise<WidgetQueryResult> {
  if (!widget.dataSource) return { columns: [], rows: [] };

  const connection = await getConnection();
  const allFilters = [...globalFilters.filter((f) => f.column), ...widget.filters.filter((f) => f.column)];
  const whereClause = buildFilterClause(allFilters);
  const table = `"${widget.dataSource}"`;
  const dims = widget.dimensions.filter((d) => d.column);
  const mets = widget.metrics.filter((m) => m.column);

  // Text widget - no query
  if (widget.type === "text") return { columns: [], rows: [] };

  // Filter controls - return distinct values
  if (widget.type === "filter_dropdown" || widget.type === "filter_date_range") {
    if (!widget.filterColumn) return { columns: [], rows: [] };
    const sql = `SELECT DISTINCT "${widget.filterColumn}" as value FROM ${table} WHERE "${widget.filterColumn}" IS NOT NULL ORDER BY value`;
    const result = await connection.query(sql);
    const rows = result.toArray().map((r: any) => ({ ...r }));
    return { columns: ["value"], rows };
  }

  // Scorecard
  if (widget.type === "scorecard") {
    const m = mets[0];
    const expr = m ? metricExpr(m) : "COUNT(*)";
    const sql = `SELECT ${expr} as value FROM ${table} ${whereClause}`;
    const result = await connection.query(sql);
    const val = Number(result.toArray()[0].value);

    let comparisonScalar: number | undefined;
    if (widget.comparisonMetric?.column) {
      const csql = `SELECT ${metricExpr(widget.comparisonMetric)} as value FROM ${table} ${whereClause}`;
      const cresult = await connection.query(csql);
      comparisonScalar = Number(cresult.toArray()[0].value);
    }

    return { columns: ["value"], rows: [{ value: val }], scalar: val, comparisonScalar };
  }

  // Gauge - same as scorecard
  if (widget.type === "gauge") {
    const m = mets[0];
    const expr = m ? metricExpr(m) : "COUNT(*)";
    const sql = `SELECT ${expr} as value FROM ${table} ${whereClause}`;
    const result = await connection.query(sql);
    const val = Number(result.toArray()[0].value);
    return { columns: ["value"], rows: [{ value: val }], scalar: val };
  }

  // Table
  if (widget.type === "table") {
    if (dims.length === 0 && mets.length === 0) {
      const sql = `SELECT * FROM ${table} ${whereClause} LIMIT ${widget.limit || 100}`;
      const result = await connection.query(sql);
      return {
        columns: result.schema.fields.map((f: any) => f.name),
        rows: result.toArray().map((r: any) => ({ ...r })),
      };
    }

    const dimCols = dims.map((d) => `CAST("${d.column}" AS VARCHAR) AS "${d.label || d.column}"`);
    const metCols = mets.map((m, i) => `${metricExpr(m)} AS "${metricAlias(m, i)}"`);

    if (metCols.length > 0 && dimCols.length > 0) {
      const groupBy = dims.map((d) => `"${d.column}"`).join(", ");
      let sql = `SELECT ${[...dimCols, ...metCols].join(", ")} FROM ${table} ${whereClause} GROUP BY ${groupBy}`;
      if (widget.sortBy?.column) sql += ` ORDER BY "${widget.sortBy.column}" ${widget.sortBy.direction}`;
      else if (dims[0]?.sortDirection) sql += ` ORDER BY "${dims[0].column}" ${dims[0].sortDirection}`;
      if (widget.limit) sql += ` LIMIT ${widget.limit}`;
      const result = await connection.query(sql);
      return {
        columns: result.schema.fields.map((f: any) => f.name),
        rows: result.toArray().map((r: any) => ({ ...r })),
      };
    }

    const cols = dimCols.length > 0 ? dimCols : ["*"];
    let sql = `SELECT ${cols.join(", ")} FROM ${table} ${whereClause}`;
    if (widget.sortBy?.column) sql += ` ORDER BY "${widget.sortBy.column}" ${widget.sortBy.direction}`;
    sql += ` LIMIT ${widget.limit || 100}`;
    const result = await connection.query(sql);
    return {
      columns: result.schema.fields.map((f: any) => f.name),
      rows: result.toArray().map((r: any) => ({ ...r })),
    };
  }

  // Heatmap needs 2 dimensions + 1 metric
  if (widget.type === "heatmap" && dims.length >= 2) {
    const m = mets[0] || { column: "*", aggregate: "COUNT" as const };
    const sql = `SELECT CAST("${dims[0].column}" AS VARCHAR) as x, CAST("${dims[1].column}" AS VARCHAR) as y, ${metricExpr(m)} as value
      FROM ${table} ${whereClause}
      GROUP BY "${dims[0].column}", "${dims[1].column}"
      ORDER BY x, y`;
    const result = await connection.query(sql);
    return {
      columns: ["x", "y", "value"],
      rows: result.toArray().map((r: any) => ({ ...r })),
    };
  }

  // All other chart types
  const activeMets = mets.length > 0 ? mets : [{ column: "*", aggregate: "COUNT" as const }];

  if (dims.length === 0) {
    const metCols = activeMets.map((m, i) => `${metricExpr(m)} AS "${metricAlias(m, i)}"`);
    const sql = `SELECT ${metCols.join(", ")} FROM ${table} ${whereClause}`;
    const result = await connection.query(sql);
    return {
      columns: result.schema.fields.map((f: any) => f.name),
      rows: result.toArray().map((r: any) => ({ ...r })),
    };
  }

  const dimExprs = dims.map((d) => `"${d.column}"`);
  const dimAliases = dims.map((d) => `CAST("${d.column}" AS VARCHAR) AS "${d.label || d.column}"`);
  const metCols = activeMets.map((m, i) => `${metricExpr(m)} AS "${metricAlias(m, i)}"`);

  let sql = `SELECT ${[...dimAliases, ...metCols].join(", ")} FROM ${table} ${whereClause} GROUP BY ${dimExprs.join(", ")}`;

  if (widget.sortBy?.column) {
    sql += ` ORDER BY "${widget.sortBy.column}" ${widget.sortBy.direction}`;
  } else if (activeMets.length > 0) {
    sql += ` ORDER BY "${metricAlias(activeMets[0], 0)}" DESC`;
  }

  sql += ` LIMIT ${dims[0]?.limit || widget.limit || 25}`;

  const result = await connection.query(sql);
  return {
    columns: result.schema.fields.map((f: any) => f.name),
    rows: result.toArray().map((r: any) => ({ ...r })),
  };
}

// Get distinct values for a column (for filter dropdowns)
export async function getDistinctValues(table: string, column: string): Promise<string[]> {
  const connection = await getConnection();
  const result = await connection.query(
    `SELECT DISTINCT CAST("${column}" AS VARCHAR) as val FROM "${table}" WHERE "${column}" IS NOT NULL ORDER BY val LIMIT 500`
  );
  return result.toArray().map((r: any) => String(r.val));
}
