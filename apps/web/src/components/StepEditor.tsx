import type { TransformStep } from "@/lib/duckdb";
import type { DataTable } from "@/lib/store";
import { SearchSelect, type SelectOption } from "./SearchSelect";

interface Props {
  step: TransformStep;
  tables: DataTable[];
  sourceTable: string;
  onChange: (step: TransformStep) => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">{children}</label>;
}

function useColumnOptions(tables: DataTable[], sourceTable: string): SelectOption[] {
  const table = tables.find((t) => t.name === sourceTable);
  return (table?.columns || []).map((c) => ({ value: c.name, label: c.name, sublabel: c.type }));
}

function ColSelect({ value, onChange, sourceTable, tables, label }: {
  value: string; onChange: (v: string) => void; sourceTable: string; tables: DataTable[]; label?: string;
}) {
  const options = useColumnOptions(tables, sourceTable);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <SearchSelect value={value} onChange={onChange} options={options} placeholder="Select column..." allowEmpty={false} />
    </div>
  );
}

const OPERATORS: SelectOption[] = [
  { value: "=", label: "= (equals)" },
  { value: "!=", label: "!= (not equal)" },
  { value: ">", label: "> (greater)" },
  { value: "<", label: "< (less)" },
  { value: ">=", label: ">= (gte)" },
  { value: "<=", label: "<= (lte)" },
  { value: "LIKE", label: "LIKE (pattern)" },
  { value: "NOT LIKE", label: "NOT LIKE" },
  { value: "IN", label: "IN (list)" },
  { value: "IS NULL", label: "IS NULL" },
  { value: "IS NOT NULL", label: "IS NOT NULL" },
];

const DATA_TYPES: SelectOption[] = [
  { value: "VARCHAR", label: "VARCHAR", sublabel: "text" },
  { value: "INTEGER", label: "INTEGER", sublabel: "int32" },
  { value: "BIGINT", label: "BIGINT", sublabel: "int64" },
  { value: "DOUBLE", label: "DOUBLE", sublabel: "float64" },
  { value: "FLOAT", label: "FLOAT", sublabel: "float32" },
  { value: "BOOLEAN", label: "BOOLEAN", sublabel: "true/false" },
  { value: "DATE", label: "DATE", sublabel: "yyyy-mm-dd" },
  { value: "TIMESTAMP", label: "TIMESTAMP", sublabel: "datetime" },
  { value: "DECIMAL(10,2)", label: "DECIMAL(10,2)", sublabel: "fixed" },
];

const FILL_STRATEGIES: SelectOption[] = [
  { value: "value", label: "Fixed Value" },
  { value: "mean", label: "Mean (average)" },
  { value: "median", label: "Median" },
  { value: "mode", label: "Mode (most frequent)" },
];

const SORT_DIRS: SelectOption[] = [
  { value: "ASC", label: "Ascending (A-Z, 0-9)" },
  { value: "DESC", label: "Descending (Z-A, 9-0)" },
];

const JOIN_TYPES: SelectOption[] = [
  { value: "INNER", label: "Inner Join", sublabel: "only matching" },
  { value: "LEFT", label: "Left Join", sublabel: "keep all left" },
  { value: "RIGHT", label: "Right Join", sublabel: "keep all right" },
  { value: "FULL", label: "Full Outer Join", sublabel: "keep all" },
];

const AGG_FUNCS: SelectOption[] = [
  { value: "COUNT", label: "COUNT" },
  { value: "SUM", label: "SUM" },
  { value: "AVG", label: "AVG" },
  { value: "MIN", label: "MIN" },
  { value: "MAX", label: "MAX" },
  { value: "MEDIAN", label: "MEDIAN" },
  { value: "STDDEV", label: "STDDEV" },
];

function ToggleChip({ selected, onClick, children, variant = "default" }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; variant?: "default" | "danger";
}) {
  const activeColor = variant === "danger" ? "248,113,113" : "84,104,246";
  return (
    <button onClick={onClick} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
      selected ? (variant === "danger" ? "text-red-300" : "text-aura-300") : "text-gray-400"
    }`} style={selected ? {
      background: `rgba(${activeColor},0.12)`,
      border: `1px solid rgba(${activeColor},0.25)`,
      boxShadow: `0 0 8px rgba(${activeColor},0.1)`,
    } : {
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
    }}>{children}</button>
  );
}

export function StepEditor({ step, tables, sourceTable, onChange }: Props) {
  const colOptions = useColumnOptions(tables, sourceTable);

  switch (step.type) {
    case "filter":
      return (
        <div className="grid grid-cols-3 gap-2.5">
          <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Column" />
          <div>
            <Label>Operator</Label>
            <SearchSelect value={step.operator} onChange={(v) => onChange({ ...step, operator: v })} options={OPERATORS} allowEmpty={false} />
          </div>
          {step.operator !== "IS NULL" && step.operator !== "IS NOT NULL" && (
            <div>
              <Label>Value</Label>
              <input value={step.value} onChange={(e) => onChange({ ...step, value: e.target.value })} className="input-sm w-full" placeholder={step.operator === "IN" ? "a, b, c" : "value"} />
            </div>
          )}
        </div>
      );

    case "drop_columns": {
      const table = tables.find((t) => t.name === sourceTable);
      return (
        <div>
          <Label>Select columns to drop</Label>
          <div className="flex flex-wrap gap-1.5">
            {table?.columns.map((c) => (
              <ToggleChip key={c.name} variant="danger" selected={step.columns.includes(c.name)} onClick={() => {
                const cols = step.columns.includes(c.name) ? step.columns.filter((x) => x !== c.name) : [...step.columns, c.name];
                onChange({ ...step, columns: cols });
              }}>{c.name}</ToggleChip>
            ))}
          </div>
        </div>
      );
    }

    case "rename_column":
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <ColSelect value={step.oldName} onChange={(v) => onChange({ ...step, oldName: v })} sourceTable={sourceTable} tables={tables} label="Original" />
          <div>
            <Label>New Name</Label>
            <input value={step.newName} onChange={(e) => onChange({ ...step, newName: e.target.value })} className="input-sm w-full" placeholder="new_name" />
          </div>
        </div>
      );

    case "cast_type":
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Column" />
          <div>
            <Label>New Type</Label>
            <SearchSelect value={step.newType} onChange={(v) => onChange({ ...step, newType: v })} options={DATA_TYPES} allowEmpty={false} />
          </div>
        </div>
      );

    case "fill_null":
      return (
        <div className="grid grid-cols-3 gap-2.5">
          <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Column" />
          <div>
            <Label>Strategy</Label>
            <SearchSelect value={step.strategy} onChange={(v) => onChange({ ...step, strategy: v as any })} options={FILL_STRATEGIES} allowEmpty={false} />
          </div>
          {step.strategy === "value" && (
            <div>
              <Label>Fill With</Label>
              <input value={step.value || ""} onChange={(e) => onChange({ ...step, value: e.target.value })} className="input-sm w-full" placeholder="0 or N/A" />
            </div>
          )}
        </div>
      );

    case "deduplicate": {
      const table = tables.find((t) => t.name === sourceTable);
      return (
        <div>
          <Label>Deduplicate by (empty = all columns)</Label>
          <div className="flex flex-wrap gap-1.5">
            {table?.columns.map((c) => (
              <ToggleChip key={c.name} selected={(step.columns || []).includes(c.name)} onClick={() => {
                const cols = step.columns || [];
                onChange({ ...step, columns: cols.includes(c.name) ? cols.filter((x) => x !== c.name) : [...cols, c.name] });
              }}>{c.name}</ToggleChip>
            ))}
          </div>
        </div>
      );
    }

    case "sort":
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Sort By" />
          <div>
            <Label>Direction</Label>
            <SearchSelect value={step.direction} onChange={(v) => onChange({ ...step, direction: v as "ASC" | "DESC" })} options={SORT_DIRS} allowEmpty={false} />
          </div>
        </div>
      );

    case "calculated_field":
      return (
        <div className="space-y-2.5">
          <div>
            <Label>Column Name</Label>
            <input value={step.name} onChange={(e) => onChange({ ...step, name: e.target.value })} className="input-sm w-full" placeholder="new_column" />
          </div>
          <div>
            <Label>Expression</Label>
            <input value={step.expression} onChange={(e) => onChange({ ...step, expression: e.target.value })} className="input-sm w-full font-mono" placeholder={'"price" * "quantity"'} />
          </div>
        </div>
      );

    case "group_aggregate": {
      const table = tables.find((t) => t.name === sourceTable);
      return (
        <div className="space-y-3">
          <div>
            <Label>Group By</Label>
            <div className="flex flex-wrap gap-1.5">
              {table?.columns.map((c) => (
                <ToggleChip key={c.name} selected={step.groupBy.includes(c.name)} onClick={() => {
                  const cols = step.groupBy.includes(c.name) ? step.groupBy.filter((x) => x !== c.name) : [...step.groupBy, c.name];
                  onChange({ ...step, groupBy: cols });
                }}>{c.name}</ToggleChip>
              ))}
            </div>
          </div>
          <div>
            <Label>Aggregations</Label>
            {step.aggregations.map((agg, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                <SearchSelect value={agg.func} onChange={(v) => { const a = [...step.aggregations]; a[i] = { ...agg, func: v }; onChange({ ...step, aggregations: a }); }} options={AGG_FUNCS} allowEmpty={false} />
                <SearchSelect value={agg.column} onChange={(v) => { const a = [...step.aggregations]; a[i] = { ...agg, column: v }; onChange({ ...step, aggregations: a }); }} options={colOptions} placeholder="Column..." />
                <input value={agg.alias} onChange={(e) => { const a = [...step.aggregations]; a[i] = { ...agg, alias: e.target.value }; onChange({ ...step, aggregations: a }); }} className="input-sm" placeholder="alias" />
                <button onClick={() => onChange({ ...step, aggregations: step.aggregations.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400 transition p-1.5 rounded-md hover:bg-white/[0.04] self-end mb-[1px]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={() => onChange({ ...step, aggregations: [...step.aggregations, { func: "COUNT", column: "", alias: "count" }] })} className="text-[11px] text-aura-400 hover:text-aura-300 transition font-medium">+ Add aggregation</button>
          </div>
        </div>
      );
    }

    case "join": {
      const tableOptions: SelectOption[] = tables.filter((t) => t.name !== sourceTable).map((t) => ({ value: t.name, label: t.name, sublabel: `${t.rowCount} rows` }));
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <Label>Join Type</Label>
            <SearchSelect value={step.joinType} onChange={(v) => onChange({ ...step, joinType: v as any })} options={JOIN_TYPES} allowEmpty={false} />
          </div>
          <div>
            <Label>Right Table</Label>
            <SearchSelect value={step.rightTable} onChange={(v) => onChange({ ...step, rightTable: v })} options={tableOptions} placeholder="Select table..." />
          </div>
          <ColSelect value={step.leftColumn} onChange={(v) => onChange({ ...step, leftColumn: v })} sourceTable={sourceTable} tables={tables} label="Left Key" />
          {step.rightTable && (
            <ColSelect value={step.rightColumn} onChange={(v) => onChange({ ...step, rightColumn: v })} sourceTable={step.rightTable} tables={tables} label="Right Key" />
          )}
        </div>
      );
    }

    case "json_flatten":
      return (
        <div>
          <Label>Column to flatten (JSON array or struct)</Label>
          <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} />
          <div className="text-[10px] text-gray-600 mt-2 leading-relaxed">
            Unnests a JSON array column so each element becomes its own row. Struct fields are expanded into separate columns.
          </div>
        </div>
      );

    case "json_split":
      return (
        <div className="space-y-2.5">
          <div>
            <Label>JSON / Struct column</Label>
            <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} />
          </div>
          <div>
            <Label>Fields to extract</Label>
            {step.fields.map((field, i) => (
              <div key={i} className="flex gap-1.5 mb-1.5">
                <input
                  value={field}
                  onChange={(e) => {
                    const fields = [...step.fields];
                    fields[i] = e.target.value;
                    onChange({ ...step, fields });
                  }}
                  className="input-sm flex-1"
                  placeholder="field_name"
                />
                <button
                  onClick={() => onChange({ ...step, fields: step.fields.filter((_, j) => j !== i) })}
                  className="text-gray-600 hover:text-red-400 transition p-1.5 rounded-md hover:bg-white/[0.04]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ ...step, fields: [...step.fields, ""] })}
              className="text-[11px] text-aura-400 hover:text-aura-300 transition font-medium"
            >
              + Add field
            </button>
          </div>
          <div className="text-[10px] text-gray-600 leading-relaxed">
            Extracts named fields from a JSON/struct column into separate columns using -&gt;&gt; operator.
          </div>
        </div>
      );

    case "limit":
      return (
        <div>
          <Label>Max Rows</Label>
          <input type="number" value={step.count} onChange={(e) => onChange({ ...step, count: parseInt(e.target.value) || 0 })} className="input-sm w-40" />
        </div>
      );

    case "custom_sql":
      return (
        <div>
          <Label>SQL (use __SOURCE__ for current data)</Label>
          <textarea value={step.sql} onChange={(e) => onChange({ ...step, sql: e.target.value })} className="input-sm w-full h-20 font-mono resize-none" placeholder="SELECT *, UPPER(name) as name_upper FROM __SOURCE__" />
        </div>
      );

    default:
      return <div className="text-gray-500 text-sm">Unknown step</div>;
  }
}
