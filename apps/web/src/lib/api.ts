const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("aura_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, displayName?: string) =>
      request<{ token: string; user: any }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      }),
    me: () => request<{ user: any }>("/api/auth/me"),
  },
  dashboards: {
    list: () => request<{ dashboards: any[] }>("/api/dashboards"),
    get: (id: string) => request<{ dashboard: any }>(`/api/dashboards/${id}`),
    create: (data: { title: string; description?: string; config?: any }) =>
      request<any>("/api/dashboards", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/dashboards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/api/dashboards/${id}`, { method: "DELETE" }),
  },
  share: {
    create: (dashboardId: string, expiresInDays?: number) =>
      request<{ shareId: string }>("/api/share", {
        method: "POST",
        body: JSON.stringify({ dashboardId, expiresInDays }),
      }),
    get: (id: string) => request<{ dashboard: any }>(`/api/share/${id}`),
  },
};
