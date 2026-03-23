import { useState, useRef } from "react";
import { useBIStore } from "@/lib/store";

export function ProjectPanel() {
  const {
    project, savedProjects,
    renameProject, saveProject, loadProject, deleteProject, newProject,
    exportProjectFile, importProjectFile,
  } = useBIStore();
  const [showList, setShowList] = useState(false);
  const [showStatus, setShowStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    saveProject();
    setShowStatus("Saved");
    setTimeout(() => setShowStatus(""), 2000);
  };

  const handleExport = async () => {
    const includeData = window.confirm("Include raw data in the .aurabi file? This makes the file larger but self-contained.");
    setShowStatus("Exporting...");
    try {
      await exportProjectFile(includeData);
      setShowStatus("Exported");
    } catch (err) {
      console.error(err);
      setShowStatus("Export failed");
    }
    setTimeout(() => setShowStatus(""), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setShowStatus("Importing...");
    try {
      await importProjectFile(file);
      setShowStatus("Imported");
    } catch (err) {
      console.error(err);
      setShowStatus("Invalid file");
    }
    setTimeout(() => setShowStatus(""), 2000);
  };

  const stats = [
    { label: "Sources", count: project.dataSources.length },
    { label: "Pipelines", count: project.pipelines.length },
    { label: "Dashboards", count: project.dashboards.length },
    { label: "SQL", count: project.sqlSnippets.length },
  ];

  return (
    <div className="space-y-3">
      {/* Project name */}
      <div>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Project</div>
        <input
          value={project.name}
          onChange={(e) => renameProject(e.target.value)}
          className="input-sm w-full font-semibold"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5">
        {stats.map((s) => (
          <div key={s.label} className="text-center py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
            <div className="text-sm font-bold text-gray-200">{s.count}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-1.5">
        <button onClick={handleSave} className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Save Project
        </button>

        {showStatus && (
          <div className="text-center text-[10px] font-medium text-accent-green animate-fade-in">{showStatus}</div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setShowList(!showList)} className="btn-ghost text-[11px] py-1.5 w-full justify-center flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Open
            {savedProjects.length > 0 && <span className="text-gray-600">({savedProjects.length})</span>}
          </button>
          <button onClick={() => newProject()} className="btn-ghost text-[11px] py-1.5 w-full justify-center flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={handleExport} className="btn-ghost text-[11px] py-1.5 w-full justify-center flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-[11px] py-1.5 w-full justify-center flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json,.aurabi" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {/* Saved projects list */}
      {showList && (
        <div className="rounded-xl overflow-hidden animate-fade-in" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            Saved Projects
          </div>
          {savedProjects.length === 0 ? (
            <div className="px-3 py-4 text-center text-[11px] text-gray-600">No saved projects</div>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {savedProjects.map((p) => (
                <div key={p.id} className={`flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors ${project.id === p.id ? "bg-aura-500/[0.05]" : ""}`}>
                  <button onClick={() => { loadProject(p.id); setShowList(false); }} className="flex-1 text-left min-w-0">
                    <div className="text-[12px] font-medium text-gray-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {p.pipelines.length}P &middot; {p.dashboards.length}D &middot; {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button onClick={() => deleteProject(p.id)} className="text-gray-600 hover:text-red-400 p-1 rounded hover:bg-white/[0.04] transition shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data sources in project */}
      {project.dataSources.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Data Sources</div>
          {project.dataSources.map((ds) => (
            <div key={ds.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
              <span className="text-gray-300 truncate flex-1">{ds.fileName}</span>
              <span className="text-gray-600 shrink-0">{ds.fileType}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
