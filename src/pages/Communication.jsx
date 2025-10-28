import React, { useEffect, useState } from "react";
import { apiGet, apiPost, getProfile } from "../api";

export default function Communication(){
  const role = String(getProfile()?.role||"").toUpperCase();
  if (!["COMMS","ADMIN"].includes(role)) {
    return <div style={{padding:16}}>Restricted to Communication only.</div>;
  }

  const [items,setItems]=useState([]);
  const [msg,setMsg]=useState("");
  const [err,setErr]=useState("");

  async function load(){
    setErr("");
    try{
      const r = await apiGet("/api/comm/issues");
      setItems(r?.items || []);
    }catch(e){
      setErr(e?.message || "Load failed");
    }
  }
  useEffect(()=>{ load(); },[]);

  async function setStatus(rec, status){
    setErr(""); setMsg("");
    try{
      await apiPost("/api/comm/issues/status", { id: rec.id, status });
      setMsg(`Marked ${status}.`);
      load();
    }catch(e){ setErr(e?.message || "Update failed"); }
  }

  async function del(rec){
    if(!confirm("Delete this issue?")) return;
    setErr(""); setMsg("");
    try{
      await apiPost("/api/comm/issues/delete", { id: rec.id });
      setMsg("Deleted.");
      load();
    }catch(e){ setErr(e?.message || "Delete failed"); }
  }

  return (
    <div style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>Communication — Issues/Suggestions</h2>

      {msg && <Box>{msg}</Box>}
      {err && <Box bad>{err}</Box>}

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead style={{background:"#f9fafb"}}>
            <tr>
              <Th>Text</Th>
              <Th>Created</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length===0 ? (
              <tr><Td colSpan={4}>No issues yet.</Td></tr>
            ) : items.map(x=>(
              <tr key={x.id}>
                <Td>
                  <div style={{whiteSpace:"pre-wrap"}}>{x.text || "—"}</div>
                </Td>
                <Td>{x.ts ? new Date(x.ts).toLocaleString() : "—"}</Td>
                <Td><StatusBadge value={x.status}/></Td>
                <Td>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {String(x.status||"").toLowerCase()==="resolved" ? (
                      <button style={btn} onClick={()=>setStatus(x,"Pending")}>Mark Pending</button>
                    ) : (
                      <button style={btn} onClick={()=>setStatus(x,"Resolved")}>Mark Resolved</button>
                    )}
                    <button style={btn} onClick={()=>del(x)}>Delete</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ value }){
  const v = String(value||"Pending").trim();
  const isResolved = v.toLowerCase()==="resolved";
  return (
    <span style={{
      color: isResolved ? "#065f46" : "#7f1d1d",
      background: isResolved ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${isResolved ? "#34d399" : "#fecaca"}`,
      borderRadius: 8, padding: "2px 8px", fontSize: 12
    }}>{v || "Pending"}</span>
  );
}

const Th=({children})=><th style={{textAlign:"left", padding:8, borderBottom:"1px solid #e5e7eb"}}>{children}</th>;
const Td=({children, colSpan})=><td colSpan={colSpan} style={{padding:8, borderBottom:"1px solid #f3f4f6"}}>{children}</td>;
const btn={ padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", cursor:"pointer" };
function Box({bad,children}){ return <div style={{
  background: bad?"#fef2f2":"#ecfdf5", border:`1px solid ${bad?"#fecaca":"#34d399"}`,
  color: bad?"#7f1d1d":"#065f46", padding:10, borderRadius:10, marginBottom:8
}}>{children}</div> }