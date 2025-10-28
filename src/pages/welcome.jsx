// src/pages/Welcome.jsx
import React from "react";

export default function Welcome({ go }) {
  const grid = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))" };
  const tile = { textAlign: "left", padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", cursor: "pointer" };
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Welcome</h2>
      <p>Choose an option to continue.</p>
      <div style={grid}>
        <button style={tile} onClick={() => go("auth", { tab: "signup" })}>
          <div style={{ fontWeight: 700 }}>Create Account</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>New saint signup</div>
        </button>
        <button style={tile} onClick={() => go("auth", { tab: "login" })}>
          <div style={{ fontWeight: 700 }}>Log In</div>
          <div style={{ color: "#64748b", fontSize: 12 }}>Sign in to your account</div>
        </button>
      </div>
    </div>
  );
}