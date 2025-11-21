// src/LeadersSummary.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { getLeaderSummary } from "../api"; // uses your existing API wrapper

function fmt(n, digits = 1) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  const num = Number(n);
  // big numbers (e.g., KSh) – compact formatting
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(digits) + "M";
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(digits) + "K";
  return num.toFixed(digits).replace(/\.0+$/, "");
}
function pct(n, d, digits = 1) {
  const den = Number(d) || 0;
  if (!den) return "0%";
  return ((Number(n) * 100) / den).toFixed(digits) + "%";
}
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Column presets per report type (only totals/summary columns; no member rows)
const COLS = {
  service: [
    { key: "members", label: "Members", align: "right" },
    { key: "reported", label: "Reported", align: "right", withPct: "members" },
    { key: "physical", label: "Physical", align: "right", withPct: "members" },
    { key: "online", label: "Online", align: "right", withPct: "members" },
    { key: "other", label: "Other", align: "right", withPct: "members" },
    { key: "notAttended", label: "Not Attended", align: "right", withPct: "members" },
  ],
  education: [
    { key: "members", label: "Members", align: "right" },
    { key: "reported", label: "Reported", align: "right", withPct: "members" },
    { key: "physical", label: "Physical", align: "right", withPct: "members" },
    { key: "online", label: "Online", align: "right", withPct: "members" },
    { key: "other", label: "Other", align: "right", withPct: "members" },
    { key: "notAttended", label: "Not Attended", align: "right", withPct: "members" },
  ],
  evangelism: [
    { key: "members", label: "Members", align: "right" },
    { key: "reported", label: "Reported", align: "right", withPct: "members" },
    { key: "participated", label: "Participated", align: "right", withPct: "members" },
    { key: "F", label: "F", align: "right" },
    { key: "NFP", label: "NFP", align: "right" },
    { key: "RP", label: "RP", align: "right" },
    { key: "BB", label: "BB", align: "right" },
    { key: "avgFPerReporter", label: "Avg F/Rep", align: "right" },
  ],
  offering: [
    { key: "members", label: "Members", align: "right" },
    { key: "reported", label: "Reported", align: "right", withPct: "members" },
    { key: "offeredCount", label: "Offered (count)", align: "right", withPct: "members" },
    { key: "notOffered", label: "Not Offered", align: "right", withPct: "members" },
    { key: "totalAmount", label: "Total (KSh)", align: "right", money: true },
    { key: "avgPerReporter", label: "Avg/Rep (KSh)", align: "right", money: true },
  ],
};

// If backend provides pct.* already we'll show it; if not, compute from counts.
function renderCell(val, col, row) {
  if (col.money) return fmt(val, 0);
  if (col.withPct) {
    // use backend-provided pct if available (perfect match to Leaders page),
    // else compute on the fly against the referenced denominator
    const denKey = col.withPct;
    const showPct =
      row.pct && typeof row.pct[col.key] === "number"
        ? row.pct[col.key].toFixed(1) + "%"
        : pct(val, row[denKey], 1);
    return (
      <span title={`${val} of ${row[denKey]}`}>
        {fmt(val, 0)} <span style={{ opacity: 0.7 }}>({showPct})</span>
      </span>
    );
  }
  return fmt(val, col.key === "members" ? 0 : 0);
}

export default function LeadersSummary() {
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState("service"); // "service" | "education" | "evangelism" | "offering"
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [role, setRole] = useState(""); // GYJN | JYJN | WEJANM | NEMOBU | CHMN | DNGSN (if backend returns)
  const [rows, setRows] = useState([]); // array of group rows
  const [totals, setTotals] = useState(null); // totals object
  const [auto, setAuto] = useState(false);
  const timerRef = useRef(null);

  const cols = COLS[type];

  useEffect(() => {
    if (!auto) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => doLoad(false), 30000); // refresh every 30s
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, date, type]);

  async function doLoad(showSpinner = true) {
    try {
      showSpinner && setLoading(true);
      setErr("");
      // Call your backend summary endpoint via api.js wrapper
      const data = await getLeaderSummary(date, type);
      // Expecting shape:
      // { role, type, date, rows: [...], totals: {...} }
      setRole(String(data?.role || ""));
      const rx = Array.isArray(data?.rows) ? data.rows : [];
      const tx = data?.totals || null;

      // If backend hasn't added percentages yet, compute minimum ones used in columns
      const patchPct = (r) => {
        r.pct = r.pct || {};
        cols.forEach((c) => {
          if (c.withPct && typeof r.pct[c.key] !== "number") {
            const den = r[c.withPct] || 0;
            r.pct[c.key] = den ? (r[c.key] * 100) / den : 0;
          }
        });
      };
      rx.forEach(patchPct);
      if (tx) {
        tx.pct = tx.pct || {};
        cols.forEach((c) => {
          if (c.withPct && typeof tx.pct[c.key] !== "number") {
            const den = tx[c.withPct] || 0;
            tx.pct[c.key] = den ? (tx[c.key] * 100) / den : 0;
          }
        });
      }

      setRows(rx);
      setTotals(tx);
    } catch (e) {
      setErr(e?.message || "Failed to load summary");
    } finally {
      showSpinner && setLoading(false);
    }
  }

  // load once on mount
  useEffect(() => {
    doLoad(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showGroupCol = useMemo(() => {
    // If there are multiple groups (JYJN/WEJANM/NEMOBU), show the "Group" column.
    // If GYJN (single-row), backend may still return one row; we hide label if only 1.
    return (rows?.length || 0) > 1;
  }, [rows]);

  const titleByType = {
    service: "Service Summary",
    education: "Education Summary",
    evangelism: "Evangelism Summary",
    offering: "Offering Summary",
  };

  return (
    <div className="w-full mx-auto max-w-[1200px]">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select
            className="border rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="service">Service</option>
            <option value="education">Education</option>
            <option value="evangelism">Evangelism</option>
            <option value="offering">Offering</option>
          </select>
        </div>
        <button
          className="px-4 py-2 rounded bg-black text-white"
          onClick={() => doLoad(true)}
          disabled={loading}
          title="Load summary"
        >
          {loading ? "Loading…" : "Load"}
        </button>

        <label className="inline-flex items-center gap-2 ml-auto text-sm">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
          Auto-refresh (30s)
        </label>
      </div>

      {/* Header */}
      <div className="mb-2">
        <div className="text-lg font-semibold">
          {titleByType[type]}
          {role ? <span className="ml-2 text-sm font-normal opacity-70">({role})</span> : null}
        </div>
        <div className="text-sm opacity-70">For: {date}</div>
      </div>

      {/* Error */}
      {err ? (
        <div className="p-3 rounded bg-red-50 text-red-700 mb-4">{err}</div>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {showGroupCol && <th className="text-left px-3 py-2">Group</th>}
              {cols.map((c) => (
                <th key={c.key} className={`px-3 py-2 ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {(rows || []).map((r, i) => (
              <tr key={i} className="border-t">
                {showGroupCol && (
                  <td className="px-3 py-2">
                    {/* Prefer backend-provided label; else construct from keys */}
                    {r.label ||
                      [r?.key?.jyk, r?.key?.dept, r?.key?.cell]
                        .filter(Boolean)
                        .join(" • ") ||
                      "My Scope"}
                  </td>
                )}
                {cols.map((c) => (
                  <td key={c.key} className={`px-3 py-2 ${c.align === "right" ? "text-right" : ""}`}>
                    {renderCell(r[c.key] ?? 0, c, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {/* Totals footer */}
          {totals && (
            <tfoot>
              <tr className="border-t bg-gray-50 font-semibold">
                {showGroupCol && <td className="px-3 py-2">TOTAL</td>}
                {cols.map((c) => (
                  <td key={c.key} className={`px-3 py-2 ${c.align === "right" ? "text-right" : ""}`}>
                    {renderCell(totals[c.key] ?? 0, c, totals)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Empty state */}
      {!loading && (!rows || rows.length === 0) && (
        <div className="text-sm opacity-70 mt-3">
          No groups in scope yet. Ensure whitelist is synced for your role.
        </div>
      )}

      {/* Hint */}
      <div className="text-xs opacity-60 mt-3">
        Tips: This summary is **pre-filled from whitelist groups**. If no reports are submitted yet,
        rows still appear and percentages reflect 0 activity (e.g., 100% Not Attended for Service/Education).
        As reports arrive, click Load or enable Auto-refresh.
      </div>
    </div>
  );
}