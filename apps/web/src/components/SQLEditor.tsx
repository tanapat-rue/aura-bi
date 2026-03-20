import { useState } from "react";
import { executeSQL, listTables } from "@/lib/duckdb";
import { useBIStore } from "@/lib/store";

export function SQLEditor() {
  const { setTables } = useBIStore();
  const [sql, setSQL] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const execute = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await executeSQL(sql);
      setColumns(result.columns);
      setRows(result.rows);
      setMessage(`${result.rows.length} rows returned`);
      if (/^\s*(CREATE|INSERT|DROP|ALTER)/i.test(sql)) {
        const tables = await listTables();
        setTables(tables);
        setMessage("Query executed. Tables refreshed.");
      }
    } catch (err: any) {
      setError(err.message);
      setColumns([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="relative">
        <textarea
          value={sql}
          onChange={(e) => setSQL(e.target.value)}
          placeholder="SELECT * FROM your_table LIMIT 10&#10;&#10;-- Full DuckDB SQL: CTEs, window functions, JOINs, JSON..."
          className="input w-full h-36 font-mono text-[13px] resize-none !rounded-xl"
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") execute(); }}
        />
        <button onClick={execute} disabled={loading} className="absolute bottom-3 right-3 btn-primary text-xs py-1.5 px-4 disabled:opacity-50">
          {loading ? "Running..." : "Run"}
        </button>
        <div className="absolute bottom-3 right-24 text-[10px] text-gray-600">Cmd+Enter</div>
      </div>

      {error && <div className="text-red-400/90 text-sm bg-red-500/[0.06] border border-red-500/10 rounded-xl px-4 py-3">{error}</div>}
      {message && !error && <div className="text-accent-green/90 text-sm bg-accent-green/[0.06] border border-accent-green/10 rounded-xl px-4 py-3">{message}</div>}

      {rows.length > 0 && (
        <div className="rounded-xl border border-white/[0.04] overflow-hidden">
          <div className="overflow-auto max-h-80">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-2/95 backdrop-blur-sm">
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase whitespace-nowrap border-b border-white/[0.04]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2 text-gray-300 whitespace-nowrap">{String(row[col] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
