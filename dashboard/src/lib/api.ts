// Dashboard runs on its own port so needs full backend URL
const API_BASE = 'http://localhost:8001';
const DASHBOARD_KEY = 'pulse-forge-dashboard-2024';

export async function fetchDashboardStats(
  days: number = 7,
  appVersion?: string,
  platform?: string,
  hideDemo: boolean = true
) {
  const params = new URLSearchParams({
    days: days.toString(),
    hide_demo: hideDemo.toString(),
  });
  if (appVersion) params.append('app_version', appVersion);
  if (platform) params.append('platform', platform);

  const res = await fetch(`${API_BASE}/api/analytics/dashboard/stats?${params}`, {
    headers: {
      'X-API-Key': DASHBOARD_KEY,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE}/api/analytics/dashboard/filters`, {
    headers: {
      'X-API-Key': DASHBOARD_KEY,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch filters');
  return res.json();
}

export async function generateDemoData(days: number = 7, runsPerDay: number = 50) {
  const res = await fetch(
    `${API_BASE}/api/analytics/demo/generate?days=${days}&runs_per_day=${runsPerDay}`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': DASHBOARD_KEY,
      },
    }
  );

  if (!res.ok) throw new Error('Failed to generate demo data');
  return res.json();
}

export async function clearDemoData() {
  const res = await fetch(`${API_BASE}/api/analytics/demo/clear`, {
    method: 'DELETE',
    headers: {
      'X-API-Key': DASHBOARD_KEY,
    },
  });

  if (!res.ok) throw new Error('Failed to clear demo data');
  return res.json();
}

export function getExportUrl(
  days: number,
  appVersion?: string,
  platform?: string,
  hideDemo: boolean = true
) {
  const params = new URLSearchParams({
    days: days.toString(),
    hide_demo: hideDemo.toString(),
  });
  if (appVersion) params.append('app_version', appVersion);
  if (platform) params.append('platform', platform);

  // Note: X-API-Key needs to be in URL for download links
  // In production, use a different approach (cookie auth, etc.)
  return `${API_BASE}/api/analytics/dashboard/export/runs?${params}`;
}
