// src/pages/Home.jsx
import React from "react";
import { getProfile } from "../api";

export default function Home({ go }) {
  const profile = getProfile();
  const isAdmin = String(profile?.role||"").toUpperCase()==="ADMIN";
  const grid = { display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))" };
  const tile = { textAlign:"left", padding:16, border:"1px solid #e5e7eb", borderRadius:12, background:"#fff", cursor:"pointer" };
  const Tile = ({title,hint,screen}) => (
    <button style={tile} onClick={()=>go(screen)}>
      <div style={{fontWeight:700}}>{title}</div>
      <div style={{color:"#64748b", fontSize:12, marginTop:4}}>{hint}</div>
    </button>
  );
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Home</h2>
      <div style={grid}>
        <Tile title="Reports" hint="Service • Education • Evangelism • Offering" screen="reports" />
        <Tile title="Evangelism Media" hint="Upload and view JYK media" screen="media" />
        <Tile title="Leaders" hint="Leader tools" screen="leaders" />
        <Tile title="Settings" hint="Profile • Language • Backups • Logout" screen="settings" />
        {isAdmin && <Tile title="Admin Console" hint="Whitelist • Roles • Support • Flags • Audit" screen="admin" />}
      </div>
    </div>
  );
}