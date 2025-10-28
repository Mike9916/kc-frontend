import React, { useEffect, useState } from "react";
import { apiGet, apiPost, getProfile } from "../api";

export default function Culture(){
  const role = String(getProfile()?.role||"").toUpperCase();
  if (!["CULTURE","ADMIN"].includes(role)) {
    return <div style={{padding:16}}>Restricted to Culture only.</div>;
  }

  const [items,setItems]=useState([]);
  const [err,setErr]=useState("");
  const [msg,setMsg]=useState("");

  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");
  const [postNow,setPostNow]=useState(true); // publish immediately or save as draft

  async function load(){
    setErr("");
    try{
      const r = await apiGet("/api/culture/announcements");
      setItems(r?.items || []);
    }catch(e){
      setErr(e?.message || "Load failed");
    }
  }
  useEffect(()=>{ load(); },[]);

  async function create(e){
    e.preventDefault();
    setErr(""); setMsg("");
    try{
      if(!title.trim() && !body.trim()) throw new Error("Write a title or body.");
      await apiPost("/api/culture/announcement", { title, body, status: postNow ? "posted" : "draft" });
      setTitle(""); setBody(""); setPostNow(true);
      setMsg(postNow ? "Announcement posted." : "Draft saved.");
      load();
    }catch(e){
      setErr(e?.message || "Create failed");
    }
  }

  async function setStatus(a, status){
    setErr(""); setMsg("");
    try{
      await apiPost("/api/culture/announcement/status", { id:a.id, status });
      setMsg(status==="posted" ? "Published." : "Moved to draft.");
      load();
    }catch(e){ setErr(e?.message || "Update failed"); }
  }

  async function del(a){
    if(!confirm("Delete this announcement?")) return;
    setErr(""); setMsg("");
    try{
      await apiPost("/api/culture/announcement/delete", { id:a.id });
      setMsg("Deleted.");
      load();
    }catch(e){ setErr(e?.message || "Delete failed"); }
  }

  return (
    <div style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>Culture — Announcements</h2>

      {msg && <Box>{msg}</Box>}
      {err && <Box bad>{err}</Box>}

      <div style={card}>
        <h3 style={{margin:"0 0 8px"}}>New Announcement</h3>
        <form onSubmit={create} style={{display:"grid", gap:8}}>
          <label>Title
            <input value={title} onChange={e=>setTitle(e.target.value)} style={inp}/>
          </label>
          <label>Body
            <textarea rows={4} value={body} onChange={e=>setBody(e.target.value)} style={inp}/>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="checkbox" checked={postNow} onChange={e=>setPostNow(e.target.checked)}/>
            Publish immediately (otherwise save as Draft)
          </label>
          <div>
            <button style={primary} type="submit">{postNow ? "Post" : "Save Draft"}</button>
          </div>
          <small style={{color:"#6b7280"}}>
            Posted announcements auto-expire after 72 hours.
          </small>
        </form>
      </div>

      <div style={card}>
        <h3 style={{margin:"0 0 8px"}}>All Announcements</h3>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead style={{background:"#f9fafb"}}>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><Td colSpan={5}>No announcements yet.</Td></tr>
              ) : items.map(a=>(
                <tr key={a.id}>
                  <Td>
                    <div style={{fontWeight:600}}>{a.title || "(no title)"}</div>
                    {a.body && <div style={{whiteSpace:"pre-wrap", color:"#374151"}}>{a.body}</div>}
                  </Td>
                  <Td><StatusBadge value={a.status}/></Td>
                  <Td>{a.ts ? new Date(a.ts).toLocaleString() : "—"}</Td>
                  <Td>{a.expiresAt ? new Date(a.expiresAt).toLocaleString() : "—"}</Td>
                  <Td>
                    <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                      {a.status==="posted" ? (
                        <button style={btn} onClick={()=>setStatus(a,"draft")}>Unpublish</button>
                      ) : (
                        <button style={btn} onClick={()=>setStatus(a,"posted")}>Publish</button>
                      )}
                      <button style={btn} onClick={()=>del(a)}>Delete</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ value }){
  const v = String(value||"draft").toLowerCase();
  const posted = v==="posted";
  return (
    <span style={{
      color: posted ? "#065f46" : "#7f1d1d",
      background: posted ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${posted ? "#34d399" : "#fecaca"}`,
      borderRadius: 8, padding: "2px 8px", fontSize: 12
    }}>{posted ? "Posted" : "Draft"}</span>
  );
}

const inp={ padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8, outline:"none" };
const card={ border:"1px solid #e5e7eb", background:"#fff", borderRadius:12, padding:12, marginBottom:12 };
const btn={ padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", cursor:"pointer" };
const primary={ ...btn, background:"#2563eb", color:"#fff", border:"none" };
const Th=({children})=><th style={{textAlign:"left", padding:8, borderBottom:"1px solid #e5e7eb"}}>{children}</th>;
const Td=({children, colSpan})=><td colSpan={colSpan} style={{padding:8, borderBottom:"1px solid #f3f4f6"}}>{children}</td>;
function Box({bad,children}){ return <div style={{
  background: bad?"#fef2f2":"#ecfdf5", border:`1px solid ${bad?"#fecaca":"#34d399"}`,
  color: bad?"#7f1d1d":"#065f46", padding:10, borderRadius:10, marginBottom:8
}}>{children}</div> }