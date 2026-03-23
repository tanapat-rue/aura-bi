import { useState, useEffect, useCallback } from "react";
import type { TransformStep } from "@/lib/duckdb";
import { getDistinctValues } from "@/lib/duckdb";
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

// ─── Friendly Operators for Filter ──────────────────────────

const FRIENDLY_OPERATORS: SelectOption[] = [
  { value: "=", label: "equals" },
  { value: "!=", label: "does not equal" },
  { value: ">", label: "is greater than" },
  { value: "<", label: "is less than" },
  { value: ">=", label: "is at least" },
  { value: "<=", label: "is at most" },
  { value: "LIKE", label: "contains", sublabel: "use %text%" },
  { value: "STARTS", label: "starts with" },
  { value: "ENDS", label: "ends with" },
  { value: "IN", label: "is one of", sublabel: "multiple values" },
  { value: "IS NULL", label: "is empty" },
  { value: "IS NOT NULL", label: "is not empty" },
];

const DATA_TYPES: SelectOption[] = [
  { value: "VARCHAR", label: "Text", sublabel: "VARCHAR" },
  { value: "INTEGER", label: "Whole Number", sublabel: "INTEGER" },
  { value: "BIGINT", label: "Large Number", sublabel: "BIGINT" },
  { value: "DOUBLE", label: "Decimal Number", sublabel: "DOUBLE" },
  { value: "FLOAT", label: "Float", sublabel: "FLOAT32" },
  { value: "BOOLEAN", label: "True / False", sublabel: "BOOLEAN" },
  { value: "DATE", label: "Date", sublabel: "yyyy-mm-dd" },
  { value: "TIMESTAMP", label: "Date & Time", sublabel: "TIMESTAMP" },
  { value: "DECIMAL(10,2)", label: "Money", sublabel: "DECIMAL" },
];

const FILL_STRATEGIES: SelectOption[] = [
  { value: "value", label: "Fixed Value" },
  { value: "mean", label: "Average (mean)" },
  { value: "median", label: "Middle value (median)" },
  { value: "mode", label: "Most frequent (mode)" },
];

const SORT_DIRS: SelectOption[] = [
  { value: "ASC", label: "Ascending (A→Z, 0→9)" },
  { value: "DESC", label: "Descending (Z→A, 9→0)" },
];

const JOIN_TYPES: { value: string; label: string; desc: string; icon: string }[] = [
  { value: "INNER", label: "Inner", desc: "Only matching rows", icon: "⊕" },
  { value: "LEFT", label: "Left", desc: "All left + matching right", icon: "⊖" },
  { value: "RIGHT", label: "Right", desc: "All right + matching left", icon: "⊗" },
  { value: "FULL", label: "Full", desc: "All rows from both", icon: "⊞" },
];

const AGG_FUNCS: SelectOption[] = [
  { value: "COUNT", label: "Count" },
  { value: "SUM", label: "Sum" },
  { value: "AVG", label: "Average" },
  { value: "MIN", label: "Minimum" },
  { value: "MAX", label: "Maximum" },
  { value: "MEDIAN", label: "Median" },
  { value: "STDDEV", label: "Std Deviation" },
];

const TEXT_OPS: SelectOption[] = [
  { value: "UPPER", label: "UPPERCASE", sublabel: "abc → ABC" },
  { value: "LOWER", label: "lowercase", sublabel: "ABC → abc" },
  { value: "TRIM", label: "Trim spaces", sublabel: "both sides" },
  { value: "LTRIM", label: "Trim left", sublabel: "left side" },
  { value: "RTRIM", label: "Trim right", sublabel: "right side" },
  { value: "TITLE", label: "Title Case", sublabel: "abc → Abc" },
  { value: "REPLACE", label: "Find & Replace", sublabel: "swap text" },
];

const DATE_PARTS: SelectOption[] = [
  { value: "YEAR", label: "Year", sublabel: "2024" },
  { value: "MONTH", label: "Month", sublabel: "1-12" },
  { value: "DAY", label: "Day", sublabel: "1-31" },
  { value: "DOW", label: "Day of Week", sublabel: "0-6" },
  { value: "HOUR", label: "Hour", sublabel: "0-23" },
  { value: "MINUTE", label: "Minute", sublabel: "0-59" },
  { value: "QUARTER", label: "Quarter", sublabel: "1-4" },
];

// ─── Common formula functions for Calculated Field ──────────

const FORMULA_FUNCTIONS = [
  { label: "ROUND", template: 'ROUND("col", 2)', desc: "Round number" },
  { label: "ABS", template: 'ABS("col")', desc: "Absolute value" },
  { label: "UPPER", template: 'UPPER("col")', desc: "Uppercase text" },
  { label: "LOWER", template: 'LOWER("col")', desc: "Lowercase text" },
  { label: "LENGTH", template: 'LENGTH("col")', desc: "Text length" },
  { label: "TRIM", template: 'TRIM("col")', desc: "Remove spaces" },
  { label: "YEAR", template: 'YEAR("col")', desc: "Extract year" },
  { label: "MONTH", template: 'MONTH("col")', desc: "Extract month" },
  { label: "CONCAT", template: "CONCAT(\"col1\", ' ', \"col2\")", desc: "Join text" },
  { label: "COALESCE", template: "COALESCE(\"col\", 'default')", desc: "Fill empty" },
  { label: "CAST", template: "CAST(\"col\" AS INTEGER)", desc: "Change type" },
  { label: "CASE", template: "CASE WHEN \"col\" > 0 THEN 'yes' ELSE 'no' END", desc: "If/else logic" },
];

// ─── Toggle chip (shared) ───────────────────────────────────

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

// ─── Smart Value Picker for Filter ──────────────────────────

function SmartValueInput({ tableName, column, value, onChange, operator }: {
  tableName: string; column: string; value: string; onChange: (v: string) => void; operator: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadSuggestions = useCallback(async () => {
    if (!column || !tableName) return;
    const values = await getDistinctValues(tableName, column, 50);
    setSuggestions(values);
  }, [tableName, column]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  if (operator === "IS NULL" || operator === "IS NOT NULL") return null;

  return (
    <div className="relative">
      <Label>{operator === "IN" ? "Values (comma-separated)" : "Value"}</Label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="input-sm w-full pr-8"
          placeholder={operator === "IN" ? "value1, value2, ..." : "Type or pick a value..."}
        />
        {suggestions.length > 0 && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-aura-400 transition p-1 rounded"
            title="Show values from data"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-lg animate-fade-in"
          style={{ background: "linear-gradient(135deg, #18182a, #12121e)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (operator === "IN") {
                  const existing = value ? value.split(",").map((v) => v.trim()) : [];
                  if (!existing.includes(s)) onChange([...existing, s].join(", "));
                } else {
                  onChange(s);
                }
                setShowSuggestions(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.04] transition truncate"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Formula Builder for Calculated Field ───────────────────

function FormulaBuilder({ expression, onChange, columns }: {
  expression: string; onChange: (expr: string) => void; columns: SelectOption[];
}) {
  const [showFunctions, setShowFunctions] = useState(false);

  const insertText = (text: string) => {
    onChange(expression ? `${expression} ${text}` : text);
  };

  return (
    <div className="space-y-2">
      <Label>Formula</Label>

      {/* Column chips */}
      <div>
        <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Click a column to insert</div>
        <div className="flex flex-wrap gap-1">
          {columns.map((col) => (
            <button
              key={col.value}
              onClick={() => insertText(`"${col.value}"`)}
              className="text-[10px] px-2 py-1 rounded-md text-aura-300 transition-all duration-150 hover:scale-105"
              style={{ background: "rgba(84,104,246,0.1)", border: "1px solid rgba(84,104,246,0.2)" }}
            >
              {col.value}
              {col.sublabel && <span className="text-gray-600 ml-1">{col.sublabel}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Operator buttons */}
      <div className="flex items-center gap-1">
        {["+", "-", "×", "÷", "(", ")"].map((op) => (
          <button
            key={op}
            onClick={() => insertText(op === "×" ? "*" : op === "÷" ? "/" : op)}
            className="w-8 h-8 rounded-lg text-sm font-mono font-bold text-gray-300 hover:text-white transition-all duration-150 hover:scale-110"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {op}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowFunctions(!showFunctions)}
          className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg text-accent-cyan hover:bg-accent-cyan/10 transition"
          style={{ border: "1px solid rgba(34,211,238,0.2)" }}
        >
          ƒ Functions
        </button>
      </div>

      {/* Function palette */}
      {showFunctions && (
        <div className="grid grid-cols-3 gap-1 p-2 rounded-lg animate-fade-in"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {FORMULA_FUNCTIONS.map((fn) => (
            <button
              key={fn.label}
              onClick={() => { insertText(fn.template); setShowFunctions(false); }}
              className="text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-white/[0.04] transition group"
            >
              <span className="font-mono font-semibold text-accent-cyan group-hover:text-white transition">{fn.label}</span>
              <span className="text-gray-600 ml-1.5 text-[10px]">{fn.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Expression textarea */}
      <textarea
        value={expression}
        onChange={(e) => onChange(e.target.value)}
        className="input-sm w-full h-20 font-mono resize-none"
        placeholder={'"price" * "quantity"'}
        spellCheck={false}
      />
      {expression && (
        <div className="text-[10px] text-gray-600 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-mono">{expression}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Main StepEditor Component ───────────────────────────────
// ═══════════════════════════════════════════════════════════════

export function StepEditor({ step, tables, sourceTable, onChange }: Props) {
  const colOptions = useColumnOptions(tables, sourceTable);

  switch (step.type) {
    // ─── Filter (No-Code) ────────────────────────
    case "filter": {
      // Map friendly operator to SQL operator for storage
      const handleOperatorChange = (friendlyOp: string) => {
        let sqlOp = friendlyOp;
        let currentValue = step.value;
        if (friendlyOp === "STARTS") {
          sqlOp = "LIKE";
          if (currentValue && !currentValue.endsWith("%")) currentValue = currentValue + "%";
        } else if (friendlyOp === "ENDS") {
          sqlOp = "LIKE";
          if (currentValue && !currentValue.startsWith("%")) currentValue = "%" + currentValue;
        }
        onChange({ ...step, operator: sqlOp, value: currentValue });
      };

      // Determine friendly operator from SQL operator
      const getFriendlyOp = () => {
        if (step.operator === "LIKE" && step.value && step.value.startsWith("%") && !step.value.endsWith("%")) return "ENDS";
        if (step.operator === "LIKE" && step.value && step.value.endsWith("%") && !step.value.startsWith("%")) return "STARTS";
        return step.operator;
      };

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Column" />
            <div>
              <Label>Condition</Label>
              <SearchSelect
                value={getFriendlyOp()}
                onChange={handleOperatorChange}
                options={FRIENDLY_OPERATORS}
                allowEmpty={false}
              />
            </div>
          </div>
          <SmartValueInput
            tableName={sourceTable}
            column={step.column}
            value={step.value}
            onChange={(v) => onChange({ ...step, value: v })}
            operator={step.operator}
          />
        </div>
      );
    }

    // ─── Drop Columns ────────────────────────────
    case "drop_columns": {
      const table = tables.find((t) => t.name === sourceTable);
      return (
        <div>
          <Label>Click columns to remove</Label>
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

    // ─── Rename ──────────────────────────────────
    case "rename_column":
      return (
        <div className="grid grid-cols-2 gap-2.5 items-end">
          <ColSelect value={step.oldName} onChange={(v) => onChange({ ...step, oldName: v })} sourceTable={sourceTable} tables={tables} label="Original Column" />
          <div>
            <Label>New Name</Label>
            <input value={step.newName} onChange={(e) => onChange({ ...step, newName: e.target.value })} className="input-sm w-full" placeholder="new_column_name" />
          </div>
        </div>
      );

    // ─── Cast Type ───────────────────────────────
    case "cast_type":
      return (
        <div className="grid grid-cols-2 gap-2.5">
          <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Column" />
          <div>
            <Label>Convert To</Label>
            <SearchSelect value={step.newType} onChange={(v) => onChange({ ...step, newType: v })} options={DATA_TYPES} allowEmpty={false} />
          </div>
        </div>
      );

    // ─── Fill Null ───────────────────────────────
    case "fill_null":
      return (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Column with missing values" />
            <div>
              <Label>Fill Strategy</Label>
              <SearchSelect value={step.strategy} onChange={(v) => onChange({ ...step, strategy: v as any })} options={FILL_STRATEGIES} allowEmpty={false} />
            </div>
          </div>
          {step.strategy === "value" && (
            <div>
              <Label>Replace empty with</Label>
              <input value={step.value || ""} onChange={(e) => onChange({ ...step, value: e.target.value })} className="input-sm w-full" placeholder="0 or N/A or Unknown..." />
            </div>
          )}
        </div>
      );

    // ─── Deduplicate ─────────────────────────────
    case "deduplicate": {
      const table = tables.find((t) => t.name === sourceTable);
      return (
        <div>
          <Label>Deduplicate by (leave empty = all columns)</Label>
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

    // ─── Sort ────────────────────────────────────
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

    // ─── Calculated Field (Formula Builder) ──────
    case "calculated_field":
      return (
        <div className="space-y-3">
          <div>
            <Label>New Column Name</Label>
            <input value={step.name} onChange={(e) => onChange({ ...step, name: e.target.value })} className="input-sm w-full" placeholder="e.g. total_revenue" />
          </div>
          <FormulaBuilder
            expression={step.expression}
            onChange={(expr) => onChange({ ...step, expression: expr })}
            columns={colOptions}
          />
        </div>
      );

    // ─── Group & Aggregate ───────────────────────
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
            <Label>Measures</Label>
            {step.aggregations.map((agg, i) => (
              <div key={i} className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                  {i === 0 && <div className="text-[9px] text-gray-600 mb-1">Function</div>}
                  <SearchSelect value={agg.func} onChange={(v) => { const a = [...step.aggregations]; a[i] = { ...agg, func: v }; onChange({ ...step, aggregations: a }); }} options={AGG_FUNCS} allowEmpty={false} />
                </div>
                <div className="flex-1">
                  {i === 0 && <div className="text-[9px] text-gray-600 mb-1">Column</div>}
                  <SearchSelect value={agg.column} onChange={(v) => { const a = [...step.aggregations]; a[i] = { ...agg, column: v }; onChange({ ...step, aggregations: a }); }} options={colOptions} placeholder="Column..." />
                </div>
                <div className="flex-1">
                  {i === 0 && <div className="text-[9px] text-gray-600 mb-1">Name as</div>}
                  <input value={agg.alias} onChange={(e) => { const a = [...step.aggregations]; a[i] = { ...agg, alias: e.target.value }; onChange({ ...step, aggregations: a }); }} className="input-sm w-full" placeholder="alias" />
                </div>
                <button onClick={() => onChange({ ...step, aggregations: step.aggregations.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400 transition p-1.5 rounded-md hover:bg-white/[0.04] mb-[1px]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={() => onChange({ ...step, aggregations: [...step.aggregations, { func: "COUNT", column: "", alias: "count" }] })} className="text-[11px] text-aura-400 hover:text-aura-300 transition font-medium">+ Add measure</button>
          </div>
        </div>
      );
    }

    // ─── Join (Visual) ───────────────────────────
    case "join": {
      const tableOptions: SelectOption[] = tables.filter((t) => t.name !== sourceTable).map((t) => ({ value: t.name, label: t.name, sublabel: `${t.rowCount} rows` }));
      return (
        <div className="space-y-3">
          {/* Join type visual selector */}
          <div>
            <Label>Join Type</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {JOIN_TYPES.map((jt) => (
                <button
                  key={jt.value}
                  onClick={() => onChange({ ...step, joinType: jt.value as any })}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all duration-200 ${
                    step.joinType === jt.value ? "text-aura-300 scale-[1.02]" : "text-gray-400"
                  }`}
                  style={step.joinType === jt.value ? {
                    background: "rgba(84,104,246,0.1)",
                    border: "1px solid rgba(84,104,246,0.3)",
                    boxShadow: "0 0 12px rgba(84,104,246,0.1)",
                  } : {
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="text-lg">{jt.icon}</span>
                  <span className="text-[11px] font-semibold">{jt.label}</span>
                  <span className="text-[9px] text-gray-600">{jt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table and key selection */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label>Join With Table</Label>
              <SearchSelect value={step.rightTable} onChange={(v) => onChange({ ...step, rightTable: v })} options={tableOptions} placeholder="Select table..." />
            </div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <ColSelect value={step.leftColumn} onChange={(v) => onChange({ ...step, leftColumn: v })} sourceTable={sourceTable} tables={tables} label={`Key from ${sourceTable}`} />
            {step.rightTable && (
              <ColSelect value={step.rightColumn} onChange={(v) => onChange({ ...step, rightColumn: v })} sourceTable={step.rightTable} tables={tables} label={`Key from ${step.rightTable}`} />
            )}
          </div>
        </div>
      );
    }

    // ─── Concatenate (NEW) ───────────────────────
    case "concatenate": {
      const table = tables.find((t) => t.name === sourceTable);
      return (
        <div className="space-y-2.5">
          <div>
            <Label>Columns to merge</Label>
            <div className="flex flex-wrap gap-1.5">
              {table?.columns.map((c) => (
                <ToggleChip key={c.name} selected={step.columns.includes(c.name)} onClick={() => {
                  const cols = step.columns.includes(c.name) ? step.columns.filter((x) => x !== c.name) : [...step.columns, c.name];
                  onChange({ ...step, columns: cols });
                }}>{c.name}</ToggleChip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label>Separator</Label>
              <input value={step.separator} onChange={(e) => onChange({ ...step, separator: e.target.value })} className="input-sm w-full" placeholder="space, comma, dash..." />
            </div>
            <div>
              <Label>New Column Name</Label>
              <input value={step.newName} onChange={(e) => onChange({ ...step, newName: e.target.value })} className="input-sm w-full" placeholder="merged_column" />
            </div>
          </div>
          {step.columns.length >= 2 && (
            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: "rgba(84,104,246,0.06)" }}>
              <span className="text-aura-400">Preview:</span>
              <span className="font-mono">{step.columns.map((c) => `{${c}}`).join(step.separator || " ")}</span>
            </div>
          )}
        </div>
      );
    }

    // ─── Text Transform (NEW) ────────────────────
    case "text_transform":
      return (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Column" />
            <div>
              <Label>Operation</Label>
              <SearchSelect value={step.operation} onChange={(v) => onChange({ ...step, operation: v as any })} options={TEXT_OPS} allowEmpty={false} />
            </div>
          </div>
          {step.operation === "REPLACE" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label>Find</Label>
                <input value={step.find || ""} onChange={(e) => onChange({ ...step, find: e.target.value })} className="input-sm w-full" placeholder="text to find" />
              </div>
              <div>
                <Label>Replace With</Label>
                <input value={step.replace || ""} onChange={(e) => onChange({ ...step, replace: e.target.value })} className="input-sm w-full" placeholder="replacement text" />
              </div>
            </div>
          )}
        </div>
      );

    // ─── Date Extract (NEW) ──────────────────────
    case "date_extract":
      return (
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2.5">
            <ColSelect value={step.column} onChange={(v) => onChange({ ...step, column: v })} sourceTable={sourceTable} tables={tables} label="Date Column" />
            <div>
              <Label>Extract</Label>
              <SearchSelect value={step.part} onChange={(v) => onChange({ ...step, part: v as any })} options={DATE_PARTS} allowEmpty={false} />
            </div>
            <div>
              <Label>New Column Name</Label>
              <input
                value={step.newName}
                onChange={(e) => onChange({ ...step, newName: e.target.value })}
                className="input-sm w-full"
                placeholder={step.column ? `${step.column}_${(step.part || "year").toLowerCase()}` : "column_year"}
              />
            </div>
          </div>
        </div>
      );

    // ─── JSON Flatten ────────────────────────────
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

    // ─── JSON Split ──────────────────────────────
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
                  onChange={(e) => { const fields = [...step.fields]; fields[i] = e.target.value; onChange({ ...step, fields }); }}
                  className="input-sm flex-1"
                  placeholder="field_name"
                />
                <button onClick={() => onChange({ ...step, fields: step.fields.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400 transition p-1.5 rounded-md hover:bg-white/[0.04]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button onClick={() => onChange({ ...step, fields: [...step.fields, ""] })} className="text-[11px] text-aura-400 hover:text-aura-300 transition font-medium">+ Add field</button>
          </div>
        </div>
      );

    // ─── Limit ───────────────────────────────────
    case "limit":
      return (
        <div>
          <Label>Max Rows</Label>
          <input type="number" value={step.count} onChange={(e) => onChange({ ...step, count: parseInt(e.target.value) || 0 })} className="input-sm w-40" />
        </div>
      );

    // ─── Custom SQL ──────────────────────────────
    case "custom_sql":
      return (
        <div>
          <Label>SQL (use __SOURCE__ for current data)</Label>
          <textarea value={(step as any).sql} onChange={(e) => onChange({ ...step, sql: e.target.value } as any)} className="input-sm w-full h-32 font-mono resize-none" placeholder="SELECT *, UPPER(name) as name_upper FROM __SOURCE__" />
        </div>
      );

    // ─── Python Script ───────────────────────────
    case "python_script":
      return (
        <div>
          <Label>Python Script (Pyodide + Pandas)</Label>
          <div className="text-[10px] text-gray-500 mb-2">
            Input dataframe is <code className="text-accent-amber">df</code>. Return a DataFrame.
          </div>
          <textarea value={(step as any).code} onChange={(e) => onChange({ ...step, code: e.target.value } as any)} className="input-sm w-full h-40 font-mono resize-none bg-[#0e0e14] text-aura-300" placeholder={"# df is already populated\ndf['new'] = df['id'] + 1\nreturn df"} spellCheck={false} />
        </div>
      );

    // ─── JS Script ───────────────────────────────
    case "js_script":
      return (
        <div>
          <Label>JavaScript Script</Label>
          <div className="text-[10px] text-gray-500 mb-2">
            Input is <code className="text-accent-amber">data</code> (array of objects). Return an array.
          </div>
          <textarea value={(step as any).code} onChange={(e) => onChange({ ...step, code: e.target.value } as any)} className="input-sm w-full h-40 font-mono resize-none bg-[#0e0e14] text-accent-cyan" placeholder={"return data.map(r => ({\n  ...r,\n  new_col: r.id + 1\n}))"} spellCheck={false} />
        </div>
      );

    default:
      return <div className="text-gray-500 text-sm">Unknown step type</div>;
  }
}

// ─── Step Summary Labels ────────────────────────────────────

export function getStepSummary(step: TransformStep): string {
  switch (step.type) {
    case "filter":
      if (!step.column) return "Configure filter...";
      const opLabel = FRIENDLY_OPERATORS.find((o) => o.value === step.operator)?.label || step.operator;
      if (step.operator === "IS NULL" || step.operator === "IS NOT NULL") return `${step.column} ${opLabel}`;
      return `${step.column} ${opLabel} ${step.value || "?"}`;
    case "drop_columns":
      return step.columns.length > 0 ? `Remove: ${step.columns.join(", ")}` : "Select columns to remove...";
    case "rename_column":
      return step.oldName && step.newName ? `${step.oldName} → ${step.newName}` : "Configure rename...";
    case "cast_type":
      return step.column ? `${step.column} → ${step.newType}` : "Configure type change...";
    case "fill_null":
      return step.column ? `Fill empty ${step.column} with ${step.strategy}` : "Configure...";
    case "deduplicate":
      return step.columns?.length ? `By: ${step.columns.join(", ")}` : "Remove all duplicate rows";
    case "sort":
      return step.column ? `${step.column} ${step.direction === "ASC" ? "↑" : "↓"}` : "Configure sort...";
    case "calculated_field":
      return step.name ? `${step.name} = ${step.expression || "..."}` : "Configure formula...";
    case "group_aggregate":
      return step.groupBy.length ? `By ${step.groupBy.join(", ")} → ${step.aggregations.map((a) => a.alias || a.func).join(", ")}` : "Configure...";
    case "join":
      return step.rightTable ? `${step.joinType} join with ${step.rightTable}` : "Configure join...";
    case "concatenate":
      return step.columns.length >= 2 ? `Merge ${step.columns.join(" + ")} → ${step.newName || "..."}` : "Select columns to merge...";
    case "text_transform":
      return step.column ? `${step.operation} on ${step.column}` : "Configure transform...";
    case "date_extract":
      return step.column ? `Extract ${step.part} from ${step.column}` : "Configure...";
    case "limit":
      return `Top ${step.count} rows`;
    case "json_flatten":
      return step.column ? `Flatten ${step.column}` : "Select column...";
    case "json_split":
      return step.column ? `Split ${step.column} → ${step.fields.filter(Boolean).join(", ") || "..."}` : "Configure...";
    case "custom_sql":
      return (step as any).sql ? "Custom SQL query" : "Write SQL...";
    case "python_script":
      return "Python script";
    case "js_script":
      return "JavaScript script";
    default:
      return "Unknown step";
  }
}
