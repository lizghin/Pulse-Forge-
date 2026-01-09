const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
const DASHBOARD_KEY = "pulse-forge-dashboard-2024";

export interface DashboardStats {
  summary: {
    total_runs: number;
    avg_score: number;
    total_blueprints: number;
    period_days: number;
  };
  death_causes: Array<{ cause: string; count: number }>;
  segment_distribution: Array<{ segment: number; count: number }>;
  score_distribution: Array<{ bucket: string; count: number }>;
  upgrade_picks: Array<{
    upgrade_id: string;
    rarity: string;
    category: string;
    picks: number;
  }>;
  blueprints_distribution: Array<{ bucket: string; count: number }>;
  recent_runs: Array<{
    _id: string;
    run_id: string;
    player_id: string;
    ts: string;
    app_version: string;
    platform: string;
    score: number;
    duration: number;
    segment_reached: number;
    death_cause: string | null;
    perfect_count: number;
    near_miss_count: number;
    blueprints_earned_total: number;
  }>;
  recent_purchases: Array<{
    _id: string;
    ts: string;
    player_id: string;
    item_type: string;
    item_id: string;
    cost: number;
    platform: string;
  }>;
}

export interface FilterOptions {
  app_versions: string[];
  platforms: string[];
}

export async function fetchDashboardStats(
  days: number = 7,
  appVersion?: string,
  platform?: string
): Promise<DashboardStats> {
  const params = new URLSearchParams({ days: days.toString() });
  if (appVersion) params.append("app_version", appVersion);
  if (platform) params.append("platform", platform);

  const res = await fetch(`${API_BASE}/analytics/dashboard/stats?${params}`, {
    headers: { "X-API-Key": DASHBOARD_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const res = await fetch(`${API_BASE}/analytics/dashboard/filters`, {
    headers: { "X-API-Key": DASHBOARD_KEY },
  });

  if (!res.ok) throw new Error("Failed to fetch filters");
  return res.json();
}

export async function generateDemoData(
  days: number = 7,
  runsPerDay: number = 50
): Promise<{ success: boolean }> {
  const params = new URLSearchParams({
    days: days.toString(),
    runs_per_day: runsPerDay.toString(),
  });

  const res = await fetch(`${API_BASE}/analytics/demo/generate?${params}`, {
    method: "POST",
    headers: { "X-API-Key": DASHBOARD_KEY },
  });

  if (!res.ok) throw new Error("Failed to generate demo data");
  return res.json();
}

export async function clearDemoData(): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/analytics/demo/clear`, {
    method: "DELETE",
    headers: { "X-API-Key": DASHBOARD_KEY },
  });

  if (!res.ok) throw new Error("Failed to clear demo data");
  return res.json();
}

export function getExportUrl(
  days: number,
  appVersion?: string,
  platform?: string
): string {
  const params = new URLSearchParams({ days: days.toString() });
  if (appVersion) params.append("app_version", appVersion);
  if (platform) params.append("platform", platform);
  return `${API_BASE}/analytics/dashboard/export/runs?${params}`;
}
