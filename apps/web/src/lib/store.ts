import { create } from "zustand";
import type { TransformStep, ColumnProfile } from "./duckdb";

// ─── Auth Store ──────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  displayName?: string;
  tier: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem("aura_token", token);
    localStorage.setItem("aura_user", JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem("aura_token");
    localStorage.removeItem("aura_user");
    set({ user: null, token: null });
  },
  hydrate: () => {
    const token = localStorage.getItem("aura_token");
    const userStr = localStorage.getItem("aura_user");
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },
}));

// ─── Data Column / Table Types ───────────────────────────────

export interface DataColumn {
  name: string;
  type: string;
}

export interface DataTable {
  name: string;
  columns: DataColumn[];
  rowCount: number;
}

// ─── Pipeline (ETL) Store ────────────────────────────────────

export interface Pipeline {
  id: string;
  name: string;
  sourceTable: string;
  steps: TransformStep[];
  outputTable?: string;
}

// ─── Main BI Store ───────────────────────────────────────────

type ViewMode = "data" | "profile" | "pipeline" | "chart" | "sql";

interface BIStore {
  // Tables
  tables: DataTable[];
  activeTable: string | null;
  setTables: (tables: DataTable[]) => void;
  setActiveTable: (name: string | null) => void;

  // Processing state
  isProcessing: boolean;
  setProcessing: (v: boolean) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Profiling
  profiles: Record<string, ColumnProfile[]>;
  setProfiles: (table: string, profiles: ColumnProfile[]) => void;

  // Pipelines (ETL)
  pipelines: Pipeline[];
  activePipelineId: string | null;
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => void;
  removePipeline: (id: string) => void;
  setActivePipeline: (id: string | null) => void;

  // Pipeline step editing
  addStep: (pipelineId: string, step: TransformStep) => void;
  updateStep: (pipelineId: string, index: number, step: TransformStep) => void;
  removeStep: (pipelineId: string, index: number) => void;
  reorderSteps: (pipelineId: string, from: number, to: number) => void;

  // Pipeline preview
  previewData: { columns: string[]; rows: any[]; rowCount: number; sql: string } | null;
  setPreviewData: (data: { columns: string[]; rows: any[]; rowCount: number; sql: string } | null) => void;
}

export const useBIStore = create<BIStore>((set, get) => ({
  // Tables
  tables: [],
  activeTable: null,
  setTables: (tables) => set({ tables }),
  setActiveTable: (name) => set({ activeTable: name }),

  // Processing
  isProcessing: false,
  setProcessing: (v) => set({ isProcessing: v }),

  // View mode
  viewMode: "data",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Profiling
  profiles: {},
  setProfiles: (table, profiles) =>
    set((s) => ({ profiles: { ...s.profiles, [table]: profiles } })),

  // Pipelines
  pipelines: [],
  activePipelineId: null,
  addPipeline: (pipeline) =>
    set((s) => ({ pipelines: [...s.pipelines, pipeline], activePipelineId: pipeline.id })),
  updatePipeline: (id, updates) =>
    set((s) => ({
      pipelines: s.pipelines.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  removePipeline: (id) =>
    set((s) => ({
      pipelines: s.pipelines.filter((p) => p.id !== id),
      activePipelineId: s.activePipelineId === id ? null : s.activePipelineId,
    })),
  setActivePipeline: (id) => set({ activePipelineId: id }),

  // Steps
  addStep: (pipelineId, step) =>
    set((s) => ({
      pipelines: s.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, steps: [...p.steps, step] } : p
      ),
    })),
  updateStep: (pipelineId, index, step) =>
    set((s) => ({
      pipelines: s.pipelines.map((p) =>
        p.id === pipelineId
          ? { ...p, steps: p.steps.map((st, i) => (i === index ? step : st)) }
          : p
      ),
    })),
  removeStep: (pipelineId, index) =>
    set((s) => ({
      pipelines: s.pipelines.map((p) =>
        p.id === pipelineId ? { ...p, steps: p.steps.filter((_, i) => i !== index) } : p
      ),
    })),
  reorderSteps: (pipelineId, from, to) =>
    set((s) => ({
      pipelines: s.pipelines.map((p) => {
        if (p.id !== pipelineId) return p;
        const steps = [...p.steps];
        const [moved] = steps.splice(from, 1);
        steps.splice(to, 0, moved);
        return { ...p, steps };
      }),
    })),

  // Preview
  previewData: null,
  setPreviewData: (data) => set({ previewData: data }),
}));
