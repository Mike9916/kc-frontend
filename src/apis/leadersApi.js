import { API_BASE, authHeaders } from "../api";

export async function fetchLeaderSummary(date, type) {
  const r = await fetch(`${API_BASE}/api/leader/summary?date=${date}&type=${type}`, { headers: authHeaders() });
  if (!r.ok) throw new Error("Failed to load leader summary");
  return r.json();
}

export async function leaderSubmitMissing(type, payload) {
  const r = await fetch(`${API_BASE}/api/leader/reports/${type}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("Failed to submit missing report");
  return r.json();
}

export async function forwardSummary(type, date) {
  const r = await fetch(`${API_BASE}/api/leader/forward`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ type, date }),
  });
  if (!r.ok) throw new Error("Failed to forward summary");
  return r.json();
}