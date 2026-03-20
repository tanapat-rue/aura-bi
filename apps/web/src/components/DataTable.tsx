import { useEffect, useState } from "react";
import { previewTable } from "@/lib/duckdb";
import { useBIStore } from "@/lib/store";

export function DataTable() {
  const { activeTable } = useBIStore();
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTable) return;
    setLoading(true);
    previewTable(activeTable, 100)
      .then(({ columns, rows }) => { setColumns(columns); setRows(rows); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTable]);

  if (!activeTable) return <EmptyMessage text="Select a table to preview data" />;
  if (loading) return <EmptyMessage text="Loading..." />;

  return (
    <div className="rounded-xl border border-white/[0.04] overflow-hidden animate-fade-in">
      <div className="overflow-auto max-h-[calc(100vh-12rem)]">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-2/95 backdrop-blur-sm">
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-white/[0.04]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 whitespace-nowrap max-w-[240px] truncate">
                    {row[col] == null
                      ? <span className="text-gray-600/50 italic text-xs">null</span>
                      : typeof row[col] === "number"
                        ? <span className="text-gray-300 font-mono tabular-nums text-xs">{Number(row[col]).toLocaleString()}</span>
                        : <span className="text-gray-300">{String(row[col])}</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-[11px] text-gray-600 bg-surface-2/50 border-t border-white/[0.04]">
        Showing {rows.length} of {rows.length}+ rows from <span className="text-gray-400 font-medium">{activeTable}</span>
      </div>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return <div className="text-gray-600 text-sm text-center py-16">{text}</div>;
}
