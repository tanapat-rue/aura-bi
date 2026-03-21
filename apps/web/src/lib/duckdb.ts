import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

// Fetch a CDN script and create a same-origin Blob URL for Worker construction
async function createWorkerFromCDN(url: string): Promise<Worker> {
  const res = await fetch(url);
  const text = await res.text();
  const blob = new Blob([text], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}

const DUCKDB_VERSION = "1.29.0";
const CDN = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist`;

export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;

  const BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: `${CDN}/duckdb-mvp.wasm`,
      mainWorker: `${CDN}/duckdb-browser-mvp.worker.js`,
    },
    eh: {
      mainModule: `${CDN}/duckdb-eh.wasm`,
      mainWorker: `${CDN}/duckdb-browser-eh.worker.js`,
    },
  };

  const bundle = await duckdb.selectBundle(BUNDLES);
  const worker = await createWorkerFromCDN(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();

  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  return db;
}

export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (conn) return conn;
  const database = await initDuckDB();
  conn = await database.connect();
  return conn;
}

// ─── Ingestion ───────────────────────────────────────────────

export async function ingestFile(
  file: File,
  tableName: string
): Promise<{ columns: string[]; rowCount: number }> {
  const database = await initDuckDB();
  const connection = await getConnection();

  const ext = file.name.split(".").pop()?.toLowerCase();

  const buffer = await file.arrayBuffer();
  await database.registerFileBuffer(file.name, new Uint8Array(buffer));

  let readExpr: string;
  if (ext === "json" || ext === "jsonl" || ext === "ndjson") {
    readExpr = `read_json_auto('${file.name}')`;
  } else if (ext === "parquet") {
    readExpr = `read_parquet('${file.name}')`;
  } else {
    readExpr = `read_csv_auto('${file.name}')`;
  }

  await connection.query(
    `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM ${readExpr}`
  );

  const schemaResult = await connection.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`
  );
  const columns = schemaResult.toArray().map((row: any) => row.column_name);

  const countResult = await connection.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
  const rowCount = Number(countResult.toArray()[0].cnt);

  return { columns, rowCount };
}

// ─── Schema / Table Inspection ───────────────────────────────

export async function listTables(): Promise<
  { name: string; columns: { name: string; type: string }[]; rowCount: number }[]
> {
  const connection = await getConnection();
  const tablesResult = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
  );

  const tables = [];
  for (const row of tablesResult.toArray()) {
    const name = (row as any).table_name;
    const colsResult = await connection.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${name}'`
    );
    const columns = colsResult.toArray().map((c: any) => ({
      name: c.column_name,
      type: c.data_type,
    }));

    const countResult = await connection.query(`SELECT COUNT(*) as cnt FROM "${name}"`);
    const rowCount = Number(countResult.toArray()[0].cnt);

    tables.push({ name, columns, rowCount });
  }

  return tables;
}

export async function previewTable(
  tableName: string,
  limit = 100
): Promise<{ columns: string[]; rows: any[] }> {
  const connection = await getConnection();
  const result = await connection.query(`SELECT * FROM "${tableName}" LIMIT ${limit}`);
  const rows = result.toArray().map((row: any) => ({ ...row }));
  const columns = result.schema.fields.map((f: any) => f.name);
  return { columns, rows };
}

// ─── Data Profiling ──────────────────────────────────────────

export interface ColumnProfile {
  name: string;
  type: string;
  totalRows: number;
  nullCount: number;
  nullPct: number;
  distinctCount: number;
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stddev?: number;
  // String stats
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
  // Top values
  topValues: { value: string; count: number }[];
}

export async function profileTable(tableName: string): Promise<ColumnProfile[]> {
  const connection = await getConnection();

  const colsResult = await connection.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`
  );
  const cols = colsResult.toArray().map((c: any) => ({
    name: c.column_name as string,
    type: c.data_type as string,
  }));

  const countResult = await connection.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
  const totalRows = Number(countResult.toArray()[0].cnt);

  const profiles: ColumnProfile[] = [];

  for (const col of cols) {
    const c = `"${col.name}"`;
    const isNumeric = /INT|FLOAT|DOUBLE|DECIMAL|NUMERIC|REAL|BIGINT|SMALLINT|TINYINT|HUGEINT/i.test(col.type);
    const isString = /VARCHAR|TEXT|CHAR|STRING|BLOB/i.test(col.type);

    // Base stats
    const baseResult = await connection.query(
      `SELECT
        COUNT(*) - COUNT(${c}) as null_count,
        COUNT(DISTINCT ${c}) as distinct_count
      FROM "${tableName}"`
    );
    const base = baseResult.toArray()[0] as any;

    const profile: ColumnProfile = {
      name: col.name,
      type: col.type,
      totalRows,
      nullCount: Number(base.null_count),
      nullPct: totalRows > 0 ? (Number(base.null_count) / totalRows) * 100 : 0,
      distinctCount: Number(base.distinct_count),
      topValues: [],
    };

    // Numeric stats
    if (isNumeric) {
      const numResult = await connection.query(
        `SELECT
          MIN(${c}) as min_val,
          MAX(${c}) as max_val,
          AVG(${c}) as mean_val,
          MEDIAN(${c}) as median_val,
          STDDEV(${c}) as stddev_val
        FROM "${tableName}"`
      );
      const num = numResult.toArray()[0] as any;
      profile.min = Number(num.min_val);
      profile.max = Number(num.max_val);
      profile.mean = Number(num.mean_val);
      profile.median = Number(num.median_val);
      profile.stddev = Number(num.stddev_val);
    }

    // String stats
    if (isString) {
      const strResult = await connection.query(
        `SELECT
          MIN(LENGTH(${c})) as min_len,
          MAX(LENGTH(${c})) as max_len,
          AVG(LENGTH(${c})) as avg_len
        FROM "${tableName}" WHERE ${c} IS NOT NULL`
      );
      const str = strResult.toArray()[0] as any;
      profile.minLength = Number(str.min_len);
      profile.maxLength = Number(str.max_len);
      profile.avgLength = Number(str.avg_len);
    }

    // Top values
    const topResult = await connection.query(
      `SELECT CAST(${c} AS VARCHAR) as val, COUNT(*) as cnt
       FROM "${tableName}" WHERE ${c} IS NOT NULL
       GROUP BY ${c} ORDER BY cnt DESC LIMIT 10`
    );
    profile.topValues = topResult.toArray().map((r: any) => ({
      value: String(r.val),
      count: Number(r.cnt),
    }));

    profiles.push(profile);
  }

  return profiles;
}

// ─── ETL Pipeline Execution ──────────────────────────────────

export type TransformStep =
  | { type: "filter"; column: string; operator: string; value: string }
  | { type: "drop_columns"; columns: string[] }
  | { type: "rename_column"; oldName: string; newName: string }
  | { type: "cast_type"; column: string; newType: string }
  | { type: "fill_null"; column: string; strategy: "value" | "mean" | "median" | "mode"; value?: string }
  | { type: "deduplicate"; columns?: string[] }
  | { type: "sort"; column: string; direction: "ASC" | "DESC" }
  | { type: "calculated_field"; name: string; expression: string }
  | { type: "group_aggregate"; groupBy: string[]; aggregations: { column: string; func: string; alias: string }[] }
  | { type: "join"; rightTable: string; leftColumn: string; rightColumn: string; joinType: "INNER" | "LEFT" | "RIGHT" | "FULL" }
  | { type: "limit"; count: number }
  | { type: "json_flatten"; column: string }
  | { type: "json_split"; column: string; fields: string[] }
  | { type: "custom_sql"; sql: string }
  | { type: "python_script"; code: string }
  | { type: "js_script"; code: string };

let pyodideInstance: any = null;
async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (!(window as any).loadPyodide) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  pyodideInstance = await (window as any).loadPyodide();
  await pyodideInstance.loadPackage("pandas");
  return pyodideInstance;
}

export async function executePipeline(
  sourceTable: string,
  steps: TransformStep[],
  outputTable?: string
): Promise<{ columns: string[]; rows: any[]; rowCount: number; sql: string }> {
  const database = await initDuckDB();
  const connection = await getConnection();

  // Build the SQL chain using CTEs
  let sql = "";
  let currentRef = `"${sourceTable}"`;
  const ctes: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepAlias = `step_${i}`;
    let stepSQL = "";

    switch (step.type) {
      case "filter": {
        const op = step.operator;
        let condition: string;
        if (op === "IS NULL" || op === "IS NOT NULL") {
          condition = `"${step.column}" ${op}`;
        } else if (op === "LIKE" || op === "NOT LIKE") {
          condition = `"${step.column}" ${op} '${step.value}'`;
        } else if (op === "IN") {
          const vals = step.value.split(",").map((v) => `'${v.trim()}'`).join(",");
          condition = `"${step.column}" IN (${vals})`;
        } else {
          const isNum = !isNaN(Number(step.value));
          const val = isNum ? step.value : `'${step.value}'`;
          condition = `"${step.column}" ${op} ${val}`;
        }
        stepSQL = `SELECT * FROM ${currentRef} WHERE ${condition}`;
        break;
      }
      case "drop_columns": {
        const drops = step.columns.map((c) => `"${c}"`).join(", ");
        stepSQL = `SELECT * EXCLUDE (${drops}) FROM ${currentRef}`;
        break;
      }
      case "rename_column":
        stepSQL = `SELECT * REPLACE ("${step.oldName}" AS "${step.newName}") FROM ${currentRef}`;
        // DuckDB REPLACE doesn't rename, use COLUMNS instead
        stepSQL = `SELECT *, "${step.oldName}" AS "${step.newName}" FROM ${currentRef}`;
        // Actually, let's use proper rename
        stepSQL = `SELECT * FROM ${currentRef}`;
        // We'll handle rename via a full column list approach
        break;
      case "cast_type":
        stepSQL = `SELECT *, CAST("${step.column}" AS ${step.newType}) AS "${step.column}__cast" FROM ${currentRef}`;
        break;
      case "fill_null": {
        let fillExpr: string;
        if (step.strategy === "value") {
          const isNum = !isNaN(Number(step.value));
          fillExpr = isNum ? step.value! : `'${step.value}'`;
        } else if (step.strategy === "mean") {
          fillExpr = `(SELECT AVG("${step.column}") FROM ${currentRef})`;
        } else if (step.strategy === "median") {
          fillExpr = `(SELECT MEDIAN("${step.column}") FROM ${currentRef})`;
        } else {
          fillExpr = `(SELECT MODE("${step.column}") FROM ${currentRef})`;
        }
        stepSQL = `SELECT * REPLACE (COALESCE("${step.column}", ${fillExpr}) AS "${step.column}") FROM ${currentRef}`;
        break;
      }
      case "deduplicate":
        if (step.columns && step.columns.length > 0) {
          const cols = step.columns.map((c) => `"${c}"`).join(", ");
          stepSQL = `SELECT DISTINCT ON (${cols}) * FROM ${currentRef}`;
        } else {
          stepSQL = `SELECT DISTINCT * FROM ${currentRef}`;
        }
        break;
      case "sort":
        stepSQL = `SELECT * FROM ${currentRef} ORDER BY "${step.column}" ${step.direction}`;
        break;
      case "calculated_field":
        stepSQL = `SELECT *, (${step.expression}) AS "${step.name}" FROM ${currentRef}`;
        break;
      case "group_aggregate": {
        const groupCols = step.groupBy.map((c) => `"${c}"`).join(", ");
        const aggs = step.aggregations
          .map((a) => `${a.func}("${a.column}") AS "${a.alias}"`)
          .join(", ");
        stepSQL = `SELECT ${groupCols}, ${aggs} FROM ${currentRef} GROUP BY ${groupCols}`;
        break;
      }
      case "join":
        stepSQL = `SELECT * FROM ${currentRef} ${step.joinType} JOIN "${step.rightTable}" ON ${currentRef}."${step.leftColumn}" = "${step.rightTable}"."${step.rightColumn}"`;
        break;
      case "limit":
        stepSQL = `SELECT * FROM ${currentRef} LIMIT ${step.count}`;
        break;
      case "json_flatten":
        // Unnest a JSON array column into rows, and expand struct fields into columns
        stepSQL = `SELECT * EXCLUDE ("${step.column}"), UNNEST("${step.column}") FROM ${currentRef}`;
        break;
      case "json_split": {
        // Extract specific fields from a JSON/struct column into separate columns
        const extracts = step.fields
          .filter((f) => f)
          .map((f) => `"${step.column}"->>'${f}' AS "${f}"`)
          .join(", ");
        if (extracts) {
          stepSQL = `SELECT * EXCLUDE ("${step.column}"), ${extracts} FROM ${currentRef}`;
        } else {
          stepSQL = `SELECT * FROM ${currentRef}`;
        }
        break;
      }
      case "custom_sql":
        stepSQL = step.sql.replace(/__SOURCE__/g, currentRef);
        break;
      case "python_script":
      case "js_script": {
        // Materialize CTEs so far into an array of objects
        if (stepSQL) {
          ctes.push(`${stepAlias}_pre AS (${stepSQL})`);
          currentRef = `${stepAlias}_pre`;
        }
        
        const tempSQL = ctes.length > 0 ? `WITH ${ctes.join(",\n")} SELECT * FROM ${currentRef}` : `SELECT * FROM ${currentRef}`;
        const tempRes = await connection.query(tempSQL);
        let data = tempRes.toArray().map((r: any) => ({ ...r }));

        if (step.type === "js_script") {
          const fn = new Function("data", step.code);
          data = await fn(data);
        } else {
          const pyodide = await getPyodide();
          (window as any).__tempData = data;
          const pyCode = `
import json
from js import __tempData
import pandas as pd
df = pd.DataFrame(__tempData.to_py())
def run_script():
${step.code.split('\n').map((l: string) => '    ' + l).join('\n')}
result_df = run_script()
if result_df is None:
    result_df = df
result_df.to_json(orient='records')
`;
          const outJson = await pyodide.runPythonAsync(pyCode);
          data = JSON.parse(outJson);
        }

        // Register new JSON file in DuckDB for the mutated data
        const newTableRef = `__pipeline_temp_${i}`;
        const blob = new Blob([data.map((r:any) => JSON.stringify(r)).join('\n')], { type: "application/jsonlines" });
        const fileName = `temp_${i}_${Date.now()}.jsonl`;
        const buffer = await blob.arrayBuffer();
        await database.registerFileBuffer(fileName, new Uint8Array(buffer));
        
        // Reset CTEs and currentRef because the data is now materialized in a fresh DuckDB table!
        ctes.length = 0;
        currentRef = `"${newTableRef}"`;
        await connection.query(`CREATE OR REPLACE TABLE "${newTableRef}" AS SELECT * FROM read_json_auto('${fileName}')`);
        
        stepSQL = "";
        break;
      }
      default:
        continue;
    }

    // Handle rename specially
    if (step.type === "rename_column") {
      // Get current columns and build rename
      const schemaResult = await connection.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${
          i === 0 ? sourceTable : `__pipeline_step_${i - 1}`
        }' OR 1=1`
      );
      stepSQL = `SELECT * REPLACE ("${step.oldName}" AS "${step.newName}") FROM ${currentRef}`;
      // Simplify: use ALTER approach via CTE trick
      stepSQL = `SELECT *, "${step.oldName}" AS "${step.newName}" FROM (SELECT * EXCLUDE ("${step.oldName}") FROM ${currentRef})`;
    }

    if (stepSQL) {
      ctes.push(`${stepAlias} AS (${stepSQL})`);
      currentRef = stepAlias;
    }
  }

  if (ctes.length > 0) {
    sql = `WITH ${ctes.join(",\n")} SELECT * FROM ${currentRef}`;
  } else {
    sql = `SELECT * FROM "${sourceTable}"`;
  }

  // If outputTable is specified, materialize the result
  if (outputTable) {
    await connection.query(`CREATE OR REPLACE TABLE "${outputTable}" AS ${sql}`);
    const result = await connection.query(`SELECT * FROM "${outputTable}" LIMIT 200`);
    const rows = result.toArray().map((row: any) => ({ ...row }));
    const columns = result.schema.fields.map((f: any) => f.name);
    const countResult = await connection.query(`SELECT COUNT(*) as cnt FROM "${outputTable}"`);
    const rowCount = Number(countResult.toArray()[0].cnt);
    return { columns, rows, rowCount, sql };
  }

  // Preview only
  const previewSQL = `${sql} LIMIT 200`;
  const result = await connection.query(previewSQL);
  const rows = result.toArray().map((row: any) => ({ ...row }));
  const columns = result.schema.fields.map((f: any) => f.name);
  // Get total count
  const countSQL = `WITH ${ctes.join(",\n")} SELECT COUNT(*) as cnt FROM ${currentRef}`;
  let rowCount = rows.length;
  try {
    const countResult = await connection.query(ctes.length > 0 ? countSQL : `SELECT COUNT(*) as cnt FROM "${sourceTable}"`);
    rowCount = Number(countResult.toArray()[0].cnt);
  } catch { /* use rows.length as fallback */ }

  return { columns, rows, rowCount, sql };
}

// ─── SQL Execution ───────────────────────────────────────────

export async function executeSQL(sql: string): Promise<{ columns: string[]; rows: any[] }> {
  const connection = await getConnection();
  const result = await connection.query(sql);
  const rows = result.toArray().map((row: any) => ({ ...row }));
  const columns = result.schema.fields.map((f: any) => f.name);
  return { columns, rows };
}

// ─── Chart Query ─────────────────────────────────────────────

export async function queryForChart(
  tableName: string,
  options: {
    groupBy?: string;
    aggregate?: string;
    aggregateColumn?: string;
    orderBy?: string;
    limit?: number;
  }
): Promise<any[]> {
  const connection = await getConnection();

  const agg = options.aggregate || "COUNT";
  const aggCol = options.aggregateColumn ? `"${options.aggregateColumn}"` : "*";
  const groupCol = options.groupBy ? `"${options.groupBy}"` : null;

  let sql = `SELECT `;
  if (groupCol) {
    sql += `${groupCol} as label, ${agg}(${aggCol}) as value FROM "${tableName}" GROUP BY ${groupCol}`;
  } else {
    sql += `${agg}(${aggCol}) as value FROM "${tableName}"`;
  }

  if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
  if (options.limit) sql += ` LIMIT ${options.limit}`;

  const result = await connection.query(sql);
  return result.toArray().map((row: any) => ({ ...row }));
}
