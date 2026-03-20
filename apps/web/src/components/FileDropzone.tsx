import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ingestFile, listTables } from "@/lib/duckdb";
import { useBIStore } from "@/lib/store";

export function FileDropzone() {
  const [status, setStatus] = useState<string>("");
  const { setTables, setActiveTable, setProcessing, addDataSource } = useBIStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        setProcessing(true);
        setStatus(`Loading ${file.name}...`);
        try {
          const tableName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
          const ext = file.name.split(".").pop()?.toLowerCase() || "csv";
          const result = await ingestFile(file, tableName);
          setStatus(`${result.rowCount.toLocaleString()} rows loaded`);

          const tables = await listTables();
          setTables(tables);
          setActiveTable(tableName);

          const tableInfo = tables.find((t) => t.name === tableName);
          addDataSource({
            name: tableName,
            fileName: file.name,
            fileType: ext,
            rowCount: result.rowCount,
            columns: tableInfo?.columns || [],
          });
        } catch (err: any) {
          setStatus(`Error: ${err.message}`);
        } finally {
          setProcessing(false);
        }
      }
    },
    [setTables, setActiveTable, setProcessing, addDataSource]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/json": [".json"],
      "application/x-ndjson": [".jsonl", ".ndjson"],
      "application/vnd.apache.parquet": [".parquet"],
    },
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`rounded-xl p-3 text-center cursor-pointer transition-all duration-200 border border-dashed ${
          isDragActive
            ? "border-aura-500/50 bg-aura-500/[0.06]"
            : "border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.03]"
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-sm">
          {isDragActive ? (
            <span className="text-aura-400 font-medium">Drop here</span>
          ) : (
            <>
              <div className="text-gray-400 font-medium">Drop files</div>
              <div className="text-[10px] text-gray-600 mt-0.5">CSV, JSON, Parquet</div>
            </>
          )}
        </div>
      </div>
      {status && <p className="text-[11px] text-gray-500 px-1 truncate">{status}</p>}
    </div>
  );
}
