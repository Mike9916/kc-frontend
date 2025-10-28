// kc-frontend/src/pages/Issues.jsx
import React, { useState } from "react";
import { submitIssue } from "../api";

/**
 * Saints can anonymously send Issues/Suggestions to the Comms team.
 * - kind: "issue" | "suggestion"
 * - text: required, trimmed on submit
 * - media: optional URL (image/link). Server stores it as `media` string.
 */
export default function Issues() {
  const [kind, setKind] = useState("issue");
  const [text, setText] = useState("");
  const [media, setMedia] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const canSend = text.trim().length > 0 && !busy;

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    const clean = text.trim();
    if (!clean) {
      setErr("Please type your issue or suggestion.");
      return;
    }

    try {
      setBusy(true);
      await submitIssue({ text: clean, kind, media: media.trim() || null });
      setOk("Sent. Thank you for sharing!");
      // reset fields (keep kind as-is so the user can send similar items)
      setText("");
      setMedia("");
    } catch (e2) {
      setErr(e2?.message || "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "16px auto", padding: 12 }}>
      <h2 style={{ marginTop: 0 }}>Issues / Suggestions</h2>
      <p style={{ color: "#6b7280", marginTop: 4 }}>
        Share an issue or suggestion. Your message is sent anonymously to the
        Communication team. Optionally include a link to an image or file
        (e.g., Google Drive link or public image URL).
      </p>

      {err && (
        <div style={banner(false)} role="alert">
          {err}
        </div>
      )}
      {ok && (
        <div style={banner(true)} role="status">
          {ok}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={lbl}>Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={inp}
          >
            <option value="issue">Issue</option>
            <option value="suggestion">Suggestion</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={lbl}>Your message *</span>
          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your issue/suggestion…"
            style={{ ...inp, resize: "vertical" }}
          />
          <small style={{ color: "#6b7280" }}>
            {text.trim().length} characters
          </small>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={lbl}>Optional media link</span>
          <input
            value={media}
            onChange={(e) => setMedia(e.target.value)}
            placeholder="https://example.com/your-image-or-file"
            style={inp}
          />
          {!!media.trim() && (
            <small style={{ color: "#6b7280" }}>
              This link will be attached to your submission for the Comms team.
            </small>
          )}
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={!canSend} style={cta(canSend)}>
            {busy ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            style={ghost}
            onClick={() => {
              setText("");
              setMedia("");
              setErr("");
              setOk("");
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl = { fontSize: 12, color: "#374151" };
const inp = {
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  outline: "none",
  background: "#fff",
};
const cta = (enabled) => ({
  padding: "10px 12px",
  background: enabled ? "#111827" : "#9ca3af",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  cursor: enabled ? "pointer" : "not-allowed",
});
const ghost = {
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#fff",
  cursor: "pointer",
};
const banner = (ok) => ({
  background: ok ? "#ecfdf5" : "#fef2f2",
  border: `1px solid ${ok ? "#34d399" : "#fecaca"}`,
  color: ok ? "#065f46" : "#7f1d1d",
  padding: 10,
  borderRadius: 10,
  margin: "8px 0",
});