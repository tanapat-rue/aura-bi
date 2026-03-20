import { useState } from "react";
import { executeSQL, listTables } from "@/lib/duckdb";
import { useBIStore } from "@/lib/store";

export function SQLEditor() {
  const { setTables, project, addSQLSnippet, updateSQLSnippet, removeSQLSnippet } = useBIStore();
  const snippets = project.sqlSnippets;
  const [activeSnippetId, setActiveSnippetId] = useState(snippets[0]?.id || "");
  const activeSnippet = snippets.find((s) => s.id === activeSnippetId);

  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sql = activeSnippet?.sql || "";

  const setSQL = (val: string) => {
    if (activeSnippetId) updateSQLSnippet(activeSnippetId, { sql: val });
  };

  const execute = async () => {
    if (!sql.trim()) return;
    setLoading(true); setError(""); setMessage("");
    try {
      const result = await executeSQL(sql);
      setColumns(result.columns);
      setRows(result.rows);
      setMessage(`${result.rows.length} rows returned`);
      if (/^\s*(CREATE|INSERT|DROP|ALTER)/i.test(sql)) {
        setTables(await listTables());
        setMessage("Query executed. Tables refreshed.");
      }
    } catch (err: any) {
      setError(err.message);
      setColumns([]); setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Snippet tabs */}
      <div className="flex items-center gap-1">
        {snippets.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSnippetId(s.id)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              activeSnippetId === s.id ? "text-aura-300" : "text-gray-500 hover:text-gray-300"
            }`}
            style={activeSnippetId === s.id ? {
              background: "rgba(84,104,246,0.1)", border: "1px solid rgba(84,104,246,0.2)",
            } : { border: "1px solid transparent" }}
          >
            {s.name}
            {snippets.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); removeSQLSnippet(s.id); if (activeSnippetId === s.id) setActiveSnippetId(snippets.find((x) => x.id !== s.id)?.id || ""); }}
                className="text-gray-600 hover:text-red-400 transition"
              >&times;</span>
            )}
          </button>
        ))}
        <button
          onClick={() => {
            addSQLSnippet(`Query ${snippets.length + 1}`);
            const newId = useBIStore.getState().project.sqlSnippets.at(-1)?.id;
            if (newId) setActiveSnippetId(newId);
          }}
          className="text-gray-600 hover:text-gray-400 w-6 h-6 rounded-lg hover:bg-white/[0.04] flex items-center justify-center transition text-sm"
        >+</button>
      </div>

      {/* Editor */}
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

      {error && <div className="text-red-400/90 text-sm rounded-xl px-4 py-3" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.1)" }}>{error}</div>}
      {message && !error && <div className="text-accent-green/90 text-sm rounded-xl px-4 py-3" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.1)" }}>{message}</div>}

      {rows.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: "rgba(14,14,20,0.95)" }}>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase whitespace-nowrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.015] transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
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
