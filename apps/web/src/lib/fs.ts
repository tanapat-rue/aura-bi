import * as fflate from "fflate";

// ─── OPFS Wrapper (Origin Private File System) ───────────────────

export const opfs = {
  async getDirectory(): Promise<FileSystemDirectoryHandle> {
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle("aurabi_data", { create: true });
  },

  async saveFile(fileName: string, data: Uint8Array): Promise<void> {
    const dir = await this.getDirectory();
    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    // Writable stream
    // @ts-ignore - TS standard library doesn't always have createWritable
    const writable = await fileHandle.createWritable();
    // @ts-ignore - Uint8Array is valid but TS 5.x types clash with ArrayBufferLike
    await writable.write(data);
    await writable.close();
  },

  async getFile(fileName: string): Promise<Uint8Array | null> {
    try {
      const dir = await this.getDirectory();
      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (err) {
      if ((err as Error).name === "NotFoundError") return null;
      throw err;
    }
  },

  async listFiles(): Promise<{ name: string; handle: FileSystemFileHandle }[]> {
    const dir = await this.getDirectory();
    const files = [];
    // @ts-ignore - Async iterator over directory handle
    for await (const entry of dir.values()) {
      if (entry.kind === "file") {
        files.push({ name: entry.name, handle: entry });
      }
    }
    return files;
  },

  async deleteFile(fileName: string): Promise<void> {
    const dir = await this.getDirectory();
    await dir.removeEntry(fileName);
  },

  async clearAll(): Promise<void> {
    const dir = await this.getDirectory();
    // @ts-ignore
    for await (const entry of dir.values()) {
      await dir.removeEntry(entry.name, { recursive: true });
    }
  }
};

// ─── Desktop-like Project Export / Import ────────────────────────

/**
 * Downloads the data as an `.aurabi` file to the user's filesystem.
 * Uses window.showSaveFilePicker if available (Chrome/Edge "Desktop App" mode),
 * otherwise falls back to standard download.
 */
export async function downloadAurabiFile(
  projectName: string,
  projectMetadataJson: string,
  includeData: boolean
) {
  let fileData: Uint8Array;

  if (includeData) {
    // 1. We need to zip the metadata AND the OPFS data files
    const zipData: Record<string, Uint8Array> = {
      "metadata.json": new TextEncoder().encode(projectMetadataJson)
    };

    const files = await opfs.listFiles();
    for (const f of files) {
      const data = await opfs.getFile(f.name);
      if (data) {
        zipData[`data/${f.name}`] = data;
      }
    }

    // Compress using fflate
    fileData = fflate.zipSync(zipData, { level: 6 });
  } else {
    // 2. No data included, just JSON text
    fileData = new TextEncoder().encode(projectMetadataJson);
  }

  const suggestedName = `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.aurabi`;
  
  // Try File System Access API
  if ("showSaveFilePicker" in window) {
    try {
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{
          description: "Aura BI Project",
          accept: { "application/octet-stream": [".aurabi"] }
        }]
      });
      // @ts-ignore
      const writable = await handle.createWritable();
      await writable.write(fileData);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === "AbortError") return; // User cancelled
      console.warn("showSaveFilePicker failed, falling back to download", err);
    }
  }

  // Fallback to traditional download
  // @ts-ignore
  const blob = new Blob([fileData], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportedProject {
  metadataJson: string;
  filesToRestore?: { name: string; data: Uint8Array }[];
}

/**
 * Parses an imported `.aurabi` file.
 * Returns the project metadata JSON and any raw data files that need to be restored to OPFS.
 */
export async function parseAurabiFile(file: File): Promise<ImportedProject> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  
  // Check if it's a ZIP by looking at the magic number (PK\x03\x04)
  const isZip = uint8[0] === 0x50 && uint8[1] === 0x4B && uint8[2] === 0x03 && uint8[3] === 0x04;
  
  if (isZip) {
    const unzipped = fflate.unzipSync(uint8);
    const metadataRaw = unzipped["metadata.json"];
    if (!metadataRaw) throw new Error("Invalid .aurabi file: missing metadata.json");
    
    const metadataJson = new TextDecoder().decode(metadataRaw);
    
    // Extract everything in the data/ folder
    const filesToRestore: { name: string; data: Uint8Array }[] = [];
    for (const [path, data] of Object.entries(unzipped)) {
      if (path.startsWith("data/") && path !== "data/") {
        const name = path.replace("data/", "");
        if (data.length > 0) {
          filesToRestore.push({ name, data });
        }
      }
    }
    
    return { metadataJson, filesToRestore };
  } else {
    // Pure JSON
    const metadataJson = new TextDecoder().decode(uint8);
    return { metadataJson };
  }
}
