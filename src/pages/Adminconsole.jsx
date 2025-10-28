// src/pages/AdminConsole.jsx
import React, { useEffect, useState } from "react";
import { apiGet, apiPost, getProfile } from "../api";

export default function AdminConsole(){
  const role = String(getProfile()?.role||"").toUpperCase();
  const isAdmin = role==="ADMIN";
  if(!isAdmin) return <div style={{padding:16}}>Admin only.</div>;

  const [tab,setTab]=useState("whitelist");
  const tabs=["whitelist","roles","support","flags","audit"].map(t=>(
    <button key={t} style={tabBtn(tab===t)} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>
  ));

  return (
    <div style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>Admin Console</h2>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{tabs}</div>
      {tab==="whitelist" && <WhitelistTab/>}
      {tab==="roles" && <RolesTab/>}
      {tab==="support" && <SupportTab/>}
      {tab==="flags" && <FlagsTab/>}
      {tab==="audit" && <AuditTab/>}
    </div>
  );
}
const tabBtn=(active)=>({padding:"8px 12px",border:"1px solid #e5e7eb",borderRadius:10,cursor:"pointer",background:active?"#111827":"#fff",color:active?"#fff":"#111827"});

function Row({ label, children }) {
  return <div style={{display:"grid", gridTemplateColumns:"170px 1fr", alignItems:"center", gap:10}}>
    <div style={{color:"#6b7280"}}>{label}</div><div>{children}</div>
  </div>;
}
function Card({ title, children }) { return <div style={{ border:"1px solid #e5e7eb", background:"#fff", borderRadius:14, padding:14, marginBottom:12 }}>
  <h3 style={{ margin:"0 0 8px" }}>{title}</h3>{children}</div>;
}
const btn={padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:10,background:"#fff",cursor:"pointer"};
const primary={...btn,background:"#2563eb",color:"#fff",border:"none"};

function WhitelistTab(){
  const [scjId,setScjId]=useState(""); const [name,setName]=useState(""); const [phone,setPhone]=useState("");
  const [jyk,setJyk]=useState(""); const [dept,setDept]=useState(""); const [cell,setCell]=useState(""); const [role,setRole]=useState("SAINT");
  const [msg,setMsg]=useState(""),[err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2000)}; const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};
  async function upsert(e){ e.preventDefault(); try{ await apiPost("/api/admin/whitelist/upsert",{ scjId,name,phone,jyk,dept,cell,role }); toast("Whitelist updated"); }catch(e2){ oops(e2) } }
  return <Card title="Whitelist Upsert">
    {msg && <Banner ok>{msg}</Banner>}{err && <Banner>{err}</Banner>}
    <form onSubmit={upsert} style={{display:"grid",gap:10}}>
      <Row label="SCJ ID *"><input value={scjId} onChange={e=>setScjId(e.target.value)} /></Row>
      <Row label="Name *"><input value={name} onChange={e=>setName(e.target.value)} /></Row>
      <Row label="Phone"><input value={phone} onChange={e=>setPhone(e.target.value)} /></Row>
      <Row label="JYK"><input value={jyk} onChange={e=>setJyk(e.target.value)} /></Row>
      <Row label="Dept"><input value={dept} onChange={e=>setDept(e.target.value)} /></Row>
      <Row label="Cell"><input value={cell} onChange={e=>setCell(e.target.value)} /></Row>
      <Row label="Role">
        <select value={role} onChange={e=>setRole(e.target.value)}>
          {["SAINT","GYJN","JYJN","WEJANM","CHMN","DNGSN","CULTURE","COMMS","ADMIN"].map(r=><option key={r}>{r}</option>)}
        </select>
      </Row>
      <div><button style={primary} type="submit">Save</button></div>
    </form>
  </Card>;
}
function RolesTab(){
  const [scjId,setScjId]=useState(""); const [role,setRole]=useState("SAINT");
  const [msg,setMsg]=useState(""),[err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2000)}; const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};
  async function setRoleFn(e){ e.preventDefault(); try{ await apiPost("/api/admin/account/role",{ scjId, role }); toast("Role updated"); }catch(e2){ oops(e2) } }
  return <Card title="Set Account Role"><form onSubmit={setRoleFn} style={{display:"grid",gap:10}}>
    {msg && <Banner ok>{msg}</Banner>}{err && <Banner>{err}</Banner>}
    <Row label="SCJ ID *"><input value={scjId} onChange={e=>setScjId(e.target.value)} /></Row>
    <Row label="Role">
      <select value={role} onChange={e=>setRole(e.target.value)}>
        {["SAINT","GYJN","JYJN","WEJANM","CHMN","DNGSN","CULTURE","COMMS","ADMIN"].map(r=><option key={r}>{r}</option>)}
      </select>
    </Row>
    <div><button style={primary} type="submit">Update</button></div>
  </form></Card>;
}

function SupportTab(){
  const [items,setItems]=useState([]);
  const [msg,setMsg]=useState("");
  const [err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2000)};
  const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};

  function StatusBadge({ value }) {
  const status = String(value || "Pending").trim();
  const isResolved = status.toLowerCase() === "resolved";
  return (
    <span
      style={{
        color: isResolved ? "#065f46" : "#7f1d1d",
        background: isResolved ? "#ecfdf5" : "#fef2f2",
        border: `1px solid ${isResolved ? "#34d399" : "#fecaca"}`,
        borderRadius: 6,
        padding: "2px 6px",
        fontSize: 12,
      }}
    >
      {status}
    </span>
  );
}

  async function load(){
    try{
      const r=await apiGet("/api/admin/support/inbox");
      setItems(r?.items||[]);
    }catch(e){oops(e)}
  }
  useEffect(()=>{ load() },[]);

  // ✅ Admin override: reset password to 0000
  async function override(rec){
    try{
      await apiPost("/api/admin/support/override",{
        name:rec.name,
        scjId:rec.scjId,
        phone:rec.phone,
        jyk:rec.jyk||"",
        dept:rec.dept||"",
        cell:rec.cell||"",
        role:"SAINT"
      });
      toast(`Password reset to default (0000) for ${rec.name}`);
      load();
    }catch(e){oops(e)}
  }
  async function setStatus(rec, status){
  try {
    await apiPost("/api/admin/support/status", { id: rec.id, status });
    toast(`Marked ${status}`);
    load();
  } catch(e){ oops(e); }
}

async function del(rec){
  if (!confirm("Delete this ticket now?")) return;
  try {
    await apiPost("/api/admin/support/delete", { id: rec.id });
    toast("Deleted");
    load();
  } catch(e){ oops(e); }
}

  // ✅ Admin create-account override (auto-creates account for non-registered saint)
  async function createAccount(rec){
    try{
      await apiPost("/api/admin/whitelist/upsert",{
        scjId:rec.scjId, name:rec.name, phone:rec.phone,
        jyk:rec.jyk||"", dept:rec.dept||"", cell:rec.cell||"", role:"SAINT"
      });
      await apiPost("/api/admin/support/override",{
        name:rec.name, scjId:rec.scjId, phone:rec.phone,
        jyk:rec.jyk||"", dept:rec.dept||"", cell:rec.cell||"", role:"SAINT"
      });
      toast(`Account auto-created for ${rec.name} (default password 0000)`);
      load();
    }catch(e){oops(e)}
  }

  // ✅ Quick communication helpers
  const openWhatsApp = (num,name)=>window.open(`https://wa.me/${num.replace(/\D/g,'')}?text=Hi ${encodeURIComponent(name)}, this is Admin Support from KC regarding your account.`, "_blank");
  const openSMS = (num,name)=>window.open(`sms:${num}?&body=Hi ${encodeURIComponent(name)}, this is Admin Support from KC regarding your account.`, "_self");
  const openCall = (num)=>window.open(`tel:${num}`,"_self");
  const openTelegram = (num)=>window.open(`https://t.me/${num.replace(/\D/g,'')}`,"_blank");

  return (
    <Card title="Support Inbox">
      {msg && <Banner ok>{msg}</Banner>}
      {err && <Banner>{err}</Banner>}
      {items.length===0 ? (
        <div>No support tickets at the moment.</div>
      ) : (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead style={{background:"#f9fafb"}}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>SCJ ID</th>
                <th style={th}>Phone</th>
                <th style={th}>JYK</th>
                <th style={th}>Dept</th>
                <th style={th}>Cell</th>
                <th style={th}>Issue</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
           <tbody>
  {items.map(x => (
    <tr key={x.id}>
      <td style={td}>{x.name || "-"}</td>
      <td style={td}>{x.scjId || "-"}</td>
      <td style={td}>{x.phone || "-"}</td>
      <td style={td}>{x.jyk || "-"}</td>
      <td style={td}>{x.dept || "-"}</td>
      <td style={td}>{x.cell || "-"}</td>
      <td style={td}>{x.details || x.type || "—"}</td>

      {/* STATUS badge — simple and safe */}
      <td style={td}>
        <StatusBadge value={x.status} />
      </td>

      {/* ACTIONS */}
      <td style={td}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Quick contact */}
          {x.phone && (
            <>
              <button title="Call" style={btn} onClick={() => openCall(x.phone)}>📞</button>
              <button title="SMS" style={btn} onClick={() => openSMS(x.phone, x.name)}>✉</button>
              <button title="WhatsApp" style={btn} onClick={() => openWhatsApp(x.phone, x.name)}>🟢</button>
              <button title="Telegram" style={btn} onClick={() => openTelegram(x.phone)}>📨</button>
            </>
          )}

          {/* Admin actions */}
          <button title="Reset password to 0000" style={primary} onClick={() => override(x)}>Reset 🔄</button>
          <button title="Auto-create account" style={btn} onClick={() => createAccount(x)}>Create 👤</button>

          {String(x.status || "Pending").toLowerCase() === "resolved" ? (
            <button title="Mark Pending" style={btn} onClick={() => setStatus(x, "Pending")}>Pending ⏳</button>
          ) : (
            <button title="Mark Resolved" style={btn} onClick={() => setStatus(x, "Resolved")}>Resolved ✅</button>
          )}

          <button title="Delete ticket" style={btn} onClick={() => del(x)}>Delete 🗑</button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// helper styles for table cells
const th={textAlign:"left",padding:"8px",borderBottom:"1px solid #e5e7eb"};
const td={padding:"8px",borderBottom:"1px solid #f3f4f6"};
function FlagsTab(){
  const [flags,setFlags]=useState({}); const [loaded,setLoaded]=useState(false); const [msg,setMsg]=useState(""),[err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2000)}; const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};
  useEffect(()=>{(async()=>{try{ const r=await apiGet("/api/admin/flags"); setFlags(r||{}); setLoaded(true);}catch(e){oops(e)}})()},[]);
  async function save(){ try{ await apiPost("/api/admin/flags", flags); toast("Flags saved"); }catch(e){ oops(e) } }
  if(!loaded) return <Card title="Feature Flags">Loading…</Card>;
  return <Card title="Feature Flags">
    {msg && <Banner ok>{msg}</Banner>}{err && <Banner>{err}</Banner>}
    <label><input type="checkbox" checked={!!flags.jykActivities} onChange={e=>setFlags({...flags,jykActivities:e.target.checked})}/> Enable JYK Activities</label>
    <div style={{marginTop:8}}><button style={primary} onClick={save}>Save</button></div>
  </Card>;
}
function AuditTab(){
  const [items,setItems]=useState([]); const [err,setErr]=useState("");
  useEffect(()=>{(async()=>{try{ const r=await apiGet("/api/admin/audit?limit=200"); setItems(r?.items||[]);}catch(e){setErr(e?.message||"Error")}})()},[]);
  return <Card title="Audit Log">
    {err? <div style={{color:"#7f1d1d"}}>{err}</div> : items.length===0? <div>No entries.</div> :
      <ul>{items.map(a=><li key={a.id}>{a.ts} — {a.actorId||"-"} — {a.action} {a.entity}/{a.entityId}</li>)}</ul>}
  </Card>;
}
function Banner({ok,children}){return <div style={{background:ok?"#ecfdf5":"#fef2f2",border:`1px solid ${ok?"#34d399":"#fecaca"}`,color:ok?"#065f46":"#7f1d1d",padding:10,borderRadius:10,marginBottom:8}}>{children}</div>}