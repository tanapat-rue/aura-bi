import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TransformStep, ColumnProfile } from "./duckdb";
import type { Widget, WidgetFilter } from "./widget-types";

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

const IS_DEV = import.meta.env.DEV;
const DEV_USER: User = { id: "dev-user", email: "dev@aura.bi", displayName: "Developer", tier: "enterprise" };

export const useAuthStore = create<AuthStore>((set) => ({
  user: IS_DEV ? DEV_USER : null,
  token: IS_DEV ? "dev-token" : null,
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
    if (IS_DEV) { set({ user: DEV_USER, token: "dev-token" }); return; }
    const token = localStorage.getItem("aura_token");
    const userStr = localStorage.getItem("aura_user");
    if (token && userStr) set({ token, user: JSON.parse(userStr) });
  },
}));

// ─── Types ───────────────────────────────────────────────────

export interface DataColumn { name: string; type: string; }
export interface DataTable { name: string; columns: DataColumn[]; rowCount: number; }

export interface Pipeline {
  id: string;
  name: string;
  sourceTable: string;
  steps: TransformStep[];
  outputTable?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  widgets: Widget[];
  globalFilters: WidgetFilter[];
}

export interface SQLSnippet {
  id: string;
  name: string;
  sql: string;
}

export interface DataSourceRef {
  name: string;
  fileName: string;
  fileType: string;
  rowCount: number;
  columns: DataColumn[];
}

// ─── Project ─────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  dataSources: DataSourceRef[];
  pipelines: Pipeline[];
  dashboards: Dashboard[];
  sqlSnippets: SQLSnippet[];
  activeDashboardId: string | null;
  activePipelineId: string | null;
}

function createEmptyProject(name = "Untitled Project"): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    dataSources: [],
    pipelines: [],
    dashboards: [{ id: crypto.randomUUID(), title: "Dashboard 1", widgets: [], globalFilters: [] }],
    sqlSnippets: [{ id: crypto.randomUUID(), name: "Scratch", sql: "" }],
    activeDashboardId: null,
    activePipelineId: null,
  };
}

// ─── Main BI Store ───────────────────────────────────────────

type ViewMode = "data" | "profile" | "pipeline" | "chart" | "sql";

interface BIStore {
  // ─── Runtime (not persisted) ────────────────
  tables: DataTable[];
  activeTable: string | null;
  isProcessing: boolean;
  profiles: Record<string, ColumnProfile[]>;
  previewData: { columns: string[]; rows: any[]; rowCount: number; sql: string } | null;

  setTables: (tables: DataTable[]) => void;
  setActiveTable: (name: string | null) => void;
  setProcessing: (v: boolean) => void;
  setProfiles: (table: string, profiles: ColumnProfile[]) => void;
  setPreviewData: (data: { columns: string[]; rows: any[]; rowCount: number; sql: string } | null) => void;

  // ─── View ───────────────────────────────────
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // ─── Project (persisted) ────────────────────
  project: Project;
  savedProjects: Project[];

  // Project CRUD
  newProject: (name?: string) => void;
  renameProject: (name: string) => void;
  saveProject: () => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  exportProject: () => string;
  importProject: (json: string) => void;

  // Data sources
  addDataSource: (ds: DataSourceRef) => void;
  removeDataSource: (name: string) => void;

  // Pipelines
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => void;
  removePipeline: (id: string) => void;
  setActivePipeline: (id: string | null) => void;

  // Pipeline steps
  addStep: (pipelineId: string, step: TransformStep) => void;
  updateStep: (pipelineId: string, index: number, step: TransformStep) => void;
  removeStep: (pipelineId: string, index: number) => void;
  reorderSteps: (pipelineId: string, from: number, to: number) => void;

  // Dashboards
  addDashboard: (title: string) => void;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  removeDashboard: (id: string) => void;
  setActiveDashboard: (id: string | null) => void;
  getActiveDashboard: () => Dashboard | undefined;

  // SQL Snippets
  addSQLSnippet: (name: string) => void;
  updateSQLSnippet: (id: string, updates: Partial<SQLSnippet>) => void;
  removeSQLSnippet: (id: string) => void;
}

function touchProject(p: Project): Project {
  return { ...p, updatedAt: new Date().toISOString() };
}

export const useBIStore = create<BIStore>()(
  persist(
    (set, get) => ({
      // ─── Runtime ──────────────────────────────
      tables: [],
      activeTable: null,
      isProcessing: false,
      profiles: {},
      previewData: null,

      setTables: (tables) => set({ tables }),
      setActiveTable: (name) => set({ activeTable: name }),
      setProcessing: (v) => set({ isProcessing: v }),
      setProfiles: (table, profiles) => set((s) => ({ profiles: { ...s.profiles, [table]: profiles } })),
      setPreviewData: (data) => set({ previewData: data }),

      // ─── View ─────────────────────────────────
      viewMode: "data",
      setViewMode: (mode) => set({ viewMode: mode }),
      isSidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

      // ─── Project ──────────────────────────────
      project: createEmptyProject(),
      savedProjects: [],

      newProject: (name) => set({ project: createEmptyProject(name) }),

      renameProject: (name) => set((s) => ({ project: touchProject({ ...s.project, name }) })),

      saveProject: () => {
        const { project, savedProjects } = get();
        const updated = touchProject(project);
        const exists = savedProjects.findIndex((p) => p.id === updated.id);
        if (exists >= 0) {
          const list = [...savedProjects];
          list[exists] = updated;
          set({ project: updated, savedProjects: list });
        } else {
          set({ project: updated, savedProjects: [...savedProjects, updated] });
        }
      },

      loadProject: (id) => {
        const p = get().savedProjects.find((p) => p.id === id);
        if (p) set({ project: { ...p } });
      },

      deleteProject: (id) => set((s) => ({
        savedProjects: s.savedProjects.filter((p) => p.id !== id),
      })),

      exportProject: () => JSON.stringify(get().project, null, 2),

      importProject: (json) => {
        const p = JSON.parse(json) as Project;
        p.id = crypto.randomUUID(); // new ID to avoid conflicts
        p.updatedAt = new Date().toISOString();
        set({ project: p });
      },

      // ─── Data Sources ─────────────────────────
      addDataSource: (ds) => set((s) => ({
        project: touchProject({
          ...s.project,
          dataSources: [...s.project.dataSources.filter((d) => d.name !== ds.name), ds],
        }),
      })),

      removeDataSource: (name) => set((s) => ({
        project: touchProject({
          ...s.project,
          dataSources: s.project.dataSources.filter((d) => d.name !== name),
        }),
      })),

      // ─── Pipelines ────────────────────────────
      addPipeline: (pipeline) => set((s) => ({
        project: touchProject({
          ...s.project,
          pipelines: [...s.project.pipelines, pipeline],
          activePipelineId: pipeline.id,
        }),
      })),

      updatePipeline: (id, updates) => set((s) => ({
        project: touchProject({
          ...s.project,
          pipelines: s.project.pipelines.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }),
      })),

      removePipeline: (id) => set((s) => ({
        project: touchProject({
          ...s.project,
          pipelines: s.project.pipelines.filter((p) => p.id !== id),
          activePipelineId: s.project.activePipelineId === id ? null : s.project.activePipelineId,
        }),
      })),

      setActivePipeline: (id) => set((s) => ({
        project: { ...s.project, activePipelineId: id },
      })),

      // ─── Steps ────────────────────────────────
      addStep: (pipelineId, step) => set((s) => ({
        project: touchProject({
          ...s.project,
          pipelines: s.project.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, steps: [...p.steps, step] } : p
          ),
        }),
      })),

      updateStep: (pipelineId, index, step) => set((s) => ({
        project: touchProject({
          ...s.project,
          pipelines: s.project.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, steps: p.steps.map((st, i) => (i === index ? step : st)) } : p
          ),
        }),
      })),

      removeStep: (pipelineId, index) => set((s) => ({
        project: touchProject({
          ...s.project,
          pipelines: s.project.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, steps: p.steps.filter((_, i) => i !== index) } : p
          ),
        }),
      })),

      reorderSteps: (pipelineId, from, to) => set((s) => ({
        project: touchProject({
          ...s.project,
          pipelines: s.project.pipelines.map((p) => {
            if (p.id !== pipelineId) return p;
            const steps = [...p.steps];
            const [moved] = steps.splice(from, 1);
            steps.splice(to, 0, moved);
            return { ...p, steps };
          }),
        }),
      })),

      // ─── Dashboards ───────────────────────────
      addDashboard: (title) => {
        const id = crypto.randomUUID();
        set((s) => ({
          project: touchProject({
            ...s.project,
            dashboards: [...s.project.dashboards, { id, title, widgets: [], globalFilters: [] }],
            activeDashboardId: id,
          }),
        }));
      },

      updateDashboard: (id, updates) => set((s) => ({
        project: touchProject({
          ...s.project,
          dashboards: s.project.dashboards.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }),
      })),

      removeDashboard: (id) => set((s) => ({
        project: touchProject({
          ...s.project,
          dashboards: s.project.dashboards.filter((d) => d.id !== id),
          activeDashboardId: s.project.activeDashboardId === id ? null : s.project.activeDashboardId,
        }),
      })),

      setActiveDashboard: (id) => set((s) => ({
        project: { ...s.project, activeDashboardId: id },
      })),

      getActiveDashboard: () => {
        const { project } = get();
        return project.dashboards.find((d) => d.id === project.activeDashboardId) || project.dashboards[0];
      },

      // ─── SQL Snippets ─────────────────────────
      addSQLSnippet: (name) => {
        const id = crypto.randomUUID();
        set((s) => ({
          project: touchProject({
            ...s.project,
            sqlSnippets: [...s.project.sqlSnippets, { id, name, sql: "" }],
          }),
        }));
      },

      updateSQLSnippet: (id, updates) => set((s) => ({
        project: touchProject({
          ...s.project,
          sqlSnippets: s.project.sqlSnippets.map((sn) => (sn.id === id ? { ...sn, ...updates } : sn)),
        }),
      })),

      removeSQLSnippet: (id) => set((s) => ({
        project: touchProject({
          ...s.project,
          sqlSnippets: s.project.sqlSnippets.filter((sn) => sn.id !== id),
        }),
      })),
    }),
    {
      name: "aura-bi-store",
      partialize: (state) => ({
        project: state.project,
        savedProjects: state.savedProjects,
        viewMode: state.viewMode,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
