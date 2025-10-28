import React, { useEffect, useState } from "react";

export default function Announcements(){
  const [items,setItems]=useState([]);
  const [err,setErr]=useState("");

  useEffect(()=>{(async()=>{
    try{
      const r=await fetch("/api/announcements");
      const j=await r.json();
      if(!r.ok) throw new Error(j?.error||"Load failed");
      setItems(j.items||[]);
    }catch(e){ setErr(e.message||"Load failed"); }
  })()},[]);

  return (
    <div style={{padding:16}}>
      <h2 style={{marginTop:0}}>Announcements</h2>
      {err && <Box bad>{err}</Box>}
      {items.length===0 ? <div>No announcements right now.</div> : (
        <div style={{display:"grid",gap:10}}>
          {items.map(a=>(
            <div key={a.id} style={card}>
              <div style={{fontWeight:700}}>{a.title||"(No title)"}</div>
              {a.image && <img alt="" src={a.image} style={{maxWidth:"100%",borderRadius:8,margin:"6px 0"}}/>}
              <div>{a.body||""}</div>
              {a.expiresAt && (
                <div style={{fontSize:12, color:"#6b7280", marginTop:6}}>
                  Expires: {new Date(a.expiresAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const card={border:"1px solid #e5e7eb", background:"#fff", borderRadius:12, padding:12};
function Box({bad,children}){ return <div style={{
  background: bad?"#fef2f2":"#ecfdf5",
  border:`1px solid ${bad?"#fecaca":"#34d399"}`,
  color: bad?"#7f1d1d":"#065f46", padding:10, borderRadius:10, marginBottom:8
}}>{children}</div>}