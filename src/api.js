// kc-frontend/src/api.js
// Choose API base from env; fall back to localhost for dev
export const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    // support either VITE_API_BASE or VITE_API_BASE_URL
    (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL)) ||
  'http://localhost:3000';

  console.log('API_BASE in this build =', API_BASE);

// -------------------- Token / Profile storage --------------------
const LS_TOKEN = "kc_token";
const LS_PROFILE = "kc_profile";

export function getToken() {
  try { return localStorage.getItem(LS_TOKEN) || ""; } catch { return ""; }
}
export function setToken(tok) {
  try { tok ? localStorage.setItem(LS_TOKEN, tok) : localStorage.removeItem(LS_TOKEN); } catch {}
}
export function getProfile() {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setProfile(p) {
  try { p ? localStorage.setItem(LS_PROFILE, JSON.stringify(p)) : localStorage.removeItem(LS_PROFILE); } catch {}
}
export function isLoggedIn() { return !!getToken(); }
export function logout() { setToken(""); setProfile(null); }

// -------------------- Headers & fetch wrappers --------------------
export function authHeaders(extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra };
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  return headers;
}

// Safe response handler (won’t crash on non-JSON)
async function handle(path, r) {
  const ct = r.headers.get("content-type") || "";
  const text = await r.text(); // read exactly once

  let data = null;
  if (text) {
    const looksJson = ct.includes("application/json") || /^[\[{]/.test(text.trim());
    if (looksJson) { try { data = JSON.parse(text); } catch {} }
  }

  if (!r.ok) {
    let msg =
      (data && (data.error || data.message)) ||
      (text && !/<!doctype/i.test(text) ? text : "") ||
      `HTTP ${r.status}`;
    if (r.status === 401) logout();
    throw new Error(msg);
  }
  return data ?? null;
}

export async function apiGet(path) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: authHeaders(),
    // NOTE: removed credentials:"include" to avoid strict CORS requirement
  });
  return handle(path, r);
}

export async function apiPost(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    // NOTE: removed credentials:"include" to avoid strict CORS requirement
    body: JSON.stringify(body || {}),
  });
  return handle(path, r);
}

// -------------------- Auth --------------------
export async function loginJSON({ scjId, password }) {
  const data = await apiPost("/api/auth/login-json", { scjId, password });
  if (!data || !data.token) throw new Error("Login failed");
  setToken(data.token);
  setProfile(data.profile || null);
  return data;
}
export async function signupJSON(payload) {
  const data = await apiPost("/api/auth/signup", payload);
  if (data?.token) setToken(data.token);
  if (data?.profile) setProfile(data.profile);
  return data;
}
export async function me() {
  const data = await apiGet("/api/me");
  const u = data?.user || {};
  return {
    user: { id: u.id, scjId: u.scjId, name: u.name || "" },
    role: String(u.role || "").toUpperCase(),
    scope: {
      label: [u.jyk, u.dept, u.cell].filter(Boolean).join(" / "),
      department: u.dept || undefined,
      centers: u.jyk ? [u.jyk] : [],
      cells: u.cell ? [u.cell] : [],
    },
  };
}

// -------------------- Recovery / Password --------------------
export async function setRecovery(payload) {
  const { qid, questionId, answer, password } = payload || {};
  const body = {
    qid: qid ?? questionId ?? null,
    answer: answer ?? null,
    ...(password ? { password } : {}),
  };
  return apiPost("/api/auth/recovery/set", body);
}

export async function changePassword(payload) {
  const { current, next, oldPassword, newPassword } = payload || {};
  const body = {
    current: current ?? oldPassword ?? null,
    next:    next    ?? newPassword ?? null,
  };
  return apiPost("/api/auth/password/change", body);
}
export async function resetByRecovery(payload) {
  return apiPost("/api/auth/password/reset-by-recovery", payload);
}
// Auth.jsx helpers (names you already use)
export async function startRecovery(scjId) {
  return apiPost("/api/auth/recovery-start", { scjId });
}
export async function resetPassword(body) {
  return apiPost("/api/auth/recovery-reset", body);
}

// -------------------- Public Support --------------------
export async function submitSupport(payload) {
  return apiPost("/api/support", payload);
}

// -------------------- Issues --------------------
export async function submitIssue({ text, imageUrl }) {
  return apiPost("/api/issues", { text, image: imageUrl || null });
}
export async function myIssues() { return apiGet("/api/issues/mine"); }

// -------------------- Culture (team-only) --------------------
export async function cultureList() { return apiGet("/api/culture/manage"); }
export async function cultureCreate({ title, body, attachmentUrl, draft = false }) {
  return apiPost("/api/culture/announcement", { title, body, attachmentUrl, draft });
}
export async function cultureDelete(id) { return apiPost("/api/culture/announcement/delete", { id }); }
export async function culturePublish(id) { return apiPost("/api/culture/announcement/publish", { id }); }

// -------------------- Communication (team-only) --------------------
export async function commListIssues() { return apiGet("/api/comm/issues"); }
export async function commSetStatus({ id, status }) {
  return apiPost("/api/comm/issues/status", { id, status });
}

// -------------------- Media --------------------
export async function mediaList() { return apiGet("/api/media"); }
export async function mediaAdd({ type, url, sizeBytes }) {
  return apiPost("/api/media", { type, url, sizeBytes });
}
export async function mediaDelete(id) { return apiPost("/api/media/delete", { id }); }

// -------------------- Announcements (public saints view, optional) --------------------
export async function listAnnouncements() { return apiGet("/api/announcements"); }
export async function createAnnouncement({ title, body, attachmentUrl }) {
  return apiPost("/api/admin/announcements", { title, body, attachmentUrl });
}

// -------------------- Leaders (unchanged) --------------------
const LEADER_BASE = "/api/leader";
export async function getLeaderSummary(date, type) {
  const p = new URLSearchParams({ date, type }).toString();
  try {
    return await apiGet(`${LEADER_BASE}/summary?${p}`);
  } catch (e) {
    if (String(e.message || "").includes("404")) {
      return apiGet(`/api/leaders/summary?${p}`);
    }
    throw e;
  }
}
export async function leaderFill(type, payload) {
  return apiPost(`${LEADER_BASE}/reports/${encodeURIComponent(type)}`, payload);
}
export async function leaderForward(type, payload) {
  return apiPost(`${LEADER_BASE}/forward/${encodeURIComponent(type)}`, payload);
}
export async function leaderVerify(type, payload) {
  return apiPost(`${LEADER_BASE}/verify/${encodeURIComponent(type)}`, payload);
}
export async function leaderReturn(type, payload) {
  return apiPost(`${LEADER_BASE}/return/${encodeURIComponent(type)}`, payload);
}
export async function downloadLeaderExport(fmt, { date, type }) {
  const qs = new URLSearchParams();
  if (date) qs.set("date", date);
  if (type) qs.set("type", type);

  const tok = getToken();
  const headers = tok ? { Authorization: `Bearer ${tok}` } : {};

  let res = await fetch(`${API_BASE}${LEADER_BASE}/export.${fmt}?${qs}`, { headers });
  if (!res.ok && res.status === 404) {
    res = await fetch(`${API_BASE}/api/leaders/export.${fmt}?${qs}`, { headers });
  }
  if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);

  const disp = res.headers.get("Content-Disposition") || "";
  let filename = `kc_export_${type || "all"}_${date || "date"}.${fmt}`;
  const mUtf = /filename\*=UTF-8''([^;]+)/i.exec(disp);
  const mBasic = /filename="?([^"]+)"?/i.exec(disp);
  if (mUtf && mUtf[1]) filename = decodeURIComponent(mUtf[1]);
  else if (mBasic && mBasic[1]) filename = mBasic[1];

  const blob = await res.blob();
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// -------------------- Admin --------------------
export async function adminSetRole({ scjId, role }) {
  return apiPost("/api/admin/account/role", { scjId, role });
}
export async function adminWhitelistUpsert(entry) {
  return apiPost("/api/admin/whitelist/upsert", entry);
}
export async function adminSupportInbox() {
  return apiGet("/api/admin/support/inbox");
}
export async function adminSupportOverride(payload) {
  return apiPost("/api/admin/support/override", payload);
}
export async function adminSupportSetStatus({ id, status }) {
  return apiPost("/api/admin/support/status", { id, status });
}
export async function adminSupportDelete({ id }) {
  return apiPost("/api/admin/support/delete", { id });
}
export async function adminListAnnouncements() {
  return apiGet("/api/admin/announcements");
}
export async function adminGetFlags() {
  return apiGet("/api/admin/flags");
}
export async function adminSetFlags(flagsObj) {
  return apiPost("/api/admin/flags", flagsObj);
}
export async function adminAuditList(limit = 100) {
  return apiGet(`/api/admin/audit?limit=${limit}`);
}

// -------------------- Light polling --------------------
export function subscribe(fn, ms = 10000) {
  let t = setInterval(() => fn?.(), ms);
  return () => { clearInterval(t); t = null; };
}