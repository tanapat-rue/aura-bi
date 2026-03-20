import { useBIStore } from "@/lib/store";

export function TableList() {
  const { tables, activeTable, setActiveTable } = useBIStore();
  if (tables.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1.5">
        Tables
      </h3>
      {tables.map((t) => (
        <button
          key={t.name}
          onClick={() => setActiveTable(t.name)}
          className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
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
      ))}
    </div>
  );
}
