export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function call(path, body) {
  const r = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: body ? {"Content-Type": "application/json"} : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(Array.isArray(j.detail) ? j.detail.map(d => d.msg).join(" • ") : (j.detail || "خطأ " + r.status));
  return j;
}

export const fmt = n => typeof n === "number" ? n.toLocaleString("en-US", {maximumFractionDigits: 2}) : (n ?? "—");

const KEY = "acctiq_history_v1";
export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveHistory(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200))); } catch { /* storage unavailable */ }
}
