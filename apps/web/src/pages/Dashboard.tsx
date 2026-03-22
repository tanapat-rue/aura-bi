import { FileDropzone } from "@/components/FileDropzone";
import { DataTable } from "@/components/DataTable";
import { DataProfiler } from "@/components/DataProfiler";
import { PipelineBuilder } from "@/components/PipelineBuilder";
import { DashboardCanvas } from "@/components/DashboardCanvas";
import { SQLEditor } from "@/components/SQLEditor";
import { TableList } from "@/components/TableList";
import { ProjectPanel } from "@/components/ProjectPanel";
import { useBIStore } from "@/lib/store";

const TABS = [
  { key: "data", label: "Data", icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "profile", label: "Profile", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { key: "pipeline", label: "ETL", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { key: "chart", label: "Dashboard", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" },
  { key: "sql", label: "SQL", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
] as const;

export function Dashboard() {
  const { tables, viewMode, setViewMode, isProcessing, isSidebarCollapsed, toggleSidebar } = useBIStore();
  const isFullWidth = viewMode === "chart";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] relative overflow-hidden bg-surface-0">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-aura-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-purple/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Sidebar */}
      <aside className={`border-r border-white-[0.03] bg-surface-1/40 backdrop-blur-3xl flex flex-col overflow-hidden shrink-0 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 ${isSidebarCollapsed ? 'w-0 border-none' : 'w-64'}`}>
        <div className="p-4 border-b border-white/[0.04] min-w-[16rem]">
          <FileDropzone />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4 min-w-[16rem]">
          <TableList />
          <div className="border-t border-white/[0.04] pt-3">
            <ProjectPanel />
          </div>
        </div>
        {isProcessing && (
          <div className="p-3 border-t border-white/[0.04] flex items-center gap-2 text-[13px] text-aura-400 min-w-[16rem]">
            <div className="w-3 h-3 border-2 border-aura-400 border-t-transparent rounded-full animate-spin" />
            Processing...
          </div>
        )}
      </aside>

      {/* Toggle Button */}
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 z-30 transition-all duration-300 ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-64'}`}>
        <button
          onClick={toggleSidebar}
          className="w-5 h-16 bg-surface-2/95 hover:bg-surface-3 border border-white/[0.08] border-l-0 rounded-r-xl flex items-center justify-center text-gray-500 hover:text-aura-400 transition shadow-lg backdrop-blur-md cursor-pointer group"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? (
            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          )}
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Tabs */}
        <div className="border-b border-white/[0.03] px-3 flex gap-1 bg-surface-0/20 backdrop-blur-xl">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setViewMode(t.key)}
              className={`flex items-center gap-2.5 px-4 py-3.5 text-[13px] font-semibold transition-all duration-300 border-b-2 -mb-px relative overflow-hidden group ${
                viewMode === t.key
                  ? "border-aura-500 text-aura-300"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:border-white/[0.08]"
              }`}
            >
              {viewMode === t.key && (
                <div className="absolute inset-0 bg-gradient-to-t from-aura-500/10 to-transparent pointer-events-none" />
              )}
              <svg className={`w-4 h-4 transition-colors duration-300 ${viewMode === t.key ? "text-aura-400" : "text-gray-500 group-hover:text-gray-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tables.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-surface-3 to-surface-2 border border-white/[0.04] flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-gray-200">Drop a CSV to get started</p>
                <p className="text-[13px] text-gray-500 mt-2 max-w-[320px] mx-auto leading-relaxed">
                  Profile, clean, transform, and build dashboards - all processing happens locally in your browser.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-xs mx-auto">
                {["Profile", "ETL", "Filter", "Join", "Aggregate", "Dashboard", "SQL"].map(
                  (s) => <span key={s} className="chip text-[10px]">{s}</span>
                )}
              </div>
            </div>
          </div>
        ) : isFullWidth ? (
          <div className="flex-1 overflow-hidden">
            <DashboardCanvas />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-5 bg-surface-0">
            {viewMode === "data" && <DataTable />}
            {viewMode === "profile" && <DataProfiler />}
            {viewMode === "pipeline" && <PipelineBuilder />}
            {viewMode === "sql" && <SQLEditor />}
          </div>
        )}
      </div>
    </div>
  );
}
