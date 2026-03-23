import { useBIStore } from "@/lib/store";

export function TableList() {
  const { tables, activeTable, setActiveTable } = useBIStore();
  if (tables.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1.5 flex justify-between items-center">
        <span>Tables</span>
      </h3>
      {tables.map((t) => (
        <div key={t.name} className="flex gap-1 items-center group">
          <button
            onClick={() => setActiveTable(t.name)}
            className={`flex-1 text-left px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
              activeTable === t.name
                ? "bg-aura-600/15 text-aura-300 border border-aura-500/15"
                : "text-gray-400 hover:bg-white/[0.03] border border-transparent hover:text-gray-300"
            }`}
          >
            <div className="font-medium truncate">{t.name}</div>
            <div className="text-[11px] text-gray-600 mt-0.5">
              {t.rowCount.toLocaleString()} rows &middot; {t.columns.length} cols
            </div>
          </button>
          
          <button
            onClick={() => {
              if (window.confirm(`Delete table "${t.name}"? This will permanently remove its data from storage.`)) {
                useBIStore.getState().removeTable(t.name);
              }
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete table"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
