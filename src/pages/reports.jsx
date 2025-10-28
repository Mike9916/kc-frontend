// src/pages/Reports.jsx
import React, { useState } from "react";
import { apiPost } from "../api";

const today = () => new Date().toISOString().slice(0,10);

export default function Reports(){
  return (
    <div style={{ padding:16 }}>
      <h2 style={{ marginTop:0 }}>Reports</h2>
      <ServiceCard/>
      <EducationCard/>
      <EvangelismCard/>
      <OfferingCard/>
    </div>
  );
}

function Banner({ ok, children }) {
  return <div style={{
    background: ok ? "#ecfdf5" : "#fef2f2",
    border: `1px solid ${ok ? "#34d399" : "#fecaca"}`,
    color: ok ? "#065f46" : "#7f1d1d",
    padding: 10, borderRadius: 10, marginBottom: 8
  }}>{children}</div>;
}
function Row({ label, children }) {
  return <div style={{display:"grid", gridTemplateColumns:"170px 1fr", alignItems:"center", gap:10}}>
    <div style={{color:"#6b7280"}}>{label}</div><div>{children}</div>
  </div>;
}
const btn = { padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", cursor:"pointer" };
const primary = { ...btn, background:"#2563eb", color:"#fff", border:"none" };

function ServiceCard(){
  const [scjDate,setScjDate]=useState(today());
  const [method,setMethod]=useState("physical");
  const [notAttended,setNotAttended]=useState(false);
  const [realization,setRealization]=useState("");
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2200)}; const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};

  async function submit(e){e.preventDefault(); setBusy(true); setMsg(""); setErr("");
    try{
      await apiPost("/api/reports/service",{ scjDate, method, notAttended, realization });
      toast("Service submitted.");
    }catch(e2){ oops(e2) }finally{ setBusy(false) }
  }
  return(
    <div style={{ border:"1px solid #e5e7eb", borderRadius:14, padding:14, marginBottom:12, background:"#fff" }}>
      <h3 style={{margin:"0 0 8px"}}>Service</h3>
      {msg && <Banner ok>{msg}</Banner>}
      {err && <Banner>{err}</Banner>}
      <form onSubmit={submit} style={{display:"grid", gap:10}}>
        <Row label="SCJ Date"><input type="date" value={scjDate} onChange={e=>setScjDate(e.target.value)} /></Row>
        <Row label="Method">
          <select value={method} onChange={e=>setMethod(e.target.value)}>
            <option value="physical">Physical</option>
            <option value="online">Online</option>
            <option value="other">Other (specify in Realization)</option>
          </select>
        </Row>
        <Row label="Not Attended"><input type="checkbox" checked={notAttended} onChange={e=>setNotAttended(e.target.checked)} /></Row>
        <Row label="Realization (optional)"><textarea rows={2} value={realization} onChange={e=>setRealization(e.target.value)} /></Row>
        <div><button type="submit" disabled={busy} style={primary}>{busy?"Submitting…":"Submit Service"}</button></div>
      </form>
    </div>
  );
}

function EducationCard(){
  const [scjDate,setScjDate]=useState(today());
  const [session,setSession]=useState("ALL_SUN");
  const [method,setMethod]=useState("physical");
  const [notAttended,setNotAttended]=useState(false);
  const [realization,setRealization]=useState("");
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2200)}; const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};

  async function submit(e){e.preventDefault(); setBusy(true); setMsg(""); setErr("");
    try{
      await apiPost("/api/reports/education",{ scjDate, session, method, notAttended, realization });
      toast("Education submitted.");
    }catch(e2){ oops(e2) }finally{ setBusy(false) }
  }
  return(
    <div style={{ border:"1px solid #e5e7eb", borderRadius:14, padding:14, marginBottom:12, background:"#fff" }}>
      <h3 style={{margin:"0 0 8px"}}>Education</h3>
      {msg && <Banner ok>{msg}</Banner>}
      {err && <Banner>{err}</Banner>}
      <form onSubmit={submit} style={{display:"grid", gap:10}}>
        <Row label="SCJ Date"><input type="date" value={scjDate} onChange={e=>setScjDate(e.target.value)} /></Row>
        <Row label="Session">
          <select value={session} onChange={e=>setSession(e.target.value)}>
            <option value="ESTF_MON">ESTF Monday</option>
            <option value="ALL_THU">All Saints Thursday</option>
            <option value="ALL_SUN">All Saints Sunday</option>
          </select>
        </Row>
        <Row label="Method">
          <select value={method} onChange={e=>setMethod(e.target.value)}>
            <option value="physical">Physical</option>
            <option value="online">Online</option>
            <option value="other">Other (specify in Realization)</option>
          </select>
        </Row>
        <Row label="Not Attended"><input type="checkbox" checked={notAttended} onChange={e=>setNotAttended(e.target.checked)} /></Row>
        <Row label="Realization (optional)"><textarea rows={2} value={realization} onChange={e=>setRealization(e.target.value)} /></Row>
        <div><button type="submit" disabled={busy} style={primary}>{busy?"Submitting…":"Submit Education"}</button></div>
      </form>
    </div>
  );
}

function EvangelismCard(){
  const [scjDate,setScjDate]=useState(today());
  const [participated,setParticipated]=useState(false);
  const [findings,setFindings]=useState(0), [nfp,setNfp]=useState(0), [rp,setRp]=useState(0), [bb,setBb]=useState(0);
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2200)}; const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};

  async function submit(e){e.preventDefault(); setBusy(true); setMsg(""); setErr("");
    try{
      await apiPost("/api/reports/evangelism",{ scjDate, participated, findings: +findings||0, nfp: +nfp||0, rp: +rp||0, bb: +bb||0 });
      toast("Evangelism submitted.");
    }catch(e2){ oops(e2) }finally{ setBusy(false) }
  }
  return(
    <div style={{ border:"1px solid #e5e7eb", borderRadius:14, padding:14, marginBottom:12, background:"#fff" }}>
      <h3 style={{margin:"0 0 8px"}}>Evangelism</h3>
      {msg && <Banner ok>{msg}</Banner>}
      {err && <Banner>{err}</Banner>}
      <form onSubmit={submit} style={{display:"grid", gap:10}}>
        <Row label="SCJ Date"><input type="date" value={scjDate} onChange={e=>setScjDate(e.target.value)} /></Row>
        <Row label="Participated"><input type="checkbox" checked={participated} onChange={e=>setParticipated(e.target.checked)} /></Row>
        {participated && <>
          <Row label="Findings"><input type="number" min="0" value={findings} onChange={e=>setFindings(e.target.value)} /></Row>
          <Row label="NFP"><input type="number" min="0" value={nfp} onChange={e=>setNfp(e.target.value)} /></Row>
          <Row label="RP"><input type="number" min="0" value={rp} onChange={e=>setRp(e.target.value)} /></Row>
          <Row label="BB"><input type="number" min="0" value={bb} onChange={e=>setBb(e.target.value)} /></Row>
        </>}
        <div><button type="submit" disabled={busy} style={primary}>{busy?"Submitting…":"Submit Evangelism"}</button></div>
      </form>
    </div>
  );
}

function OfferingCard(){
  const [scjDate,setScjDate]=useState(today());
  const [channel,setChannel]=useState("cash");
  const [amount,setAmount]=useState(0);
  const [busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
  const toast=(m)=>{setMsg(m); setTimeout(()=>setMsg(""),2200)}; const oops=(e)=>{setErr(typeof e==="string"?e:(e?.message||"Error")); setTimeout(()=>setErr(""),3000)};

  async function submit(e){e.preventDefault(); setBusy(true); setMsg(""); setErr("");
    try{
      await apiPost("/api/reports/offering",{ scjDate, channel, amount: +amount||0 });
      toast("Offering submitted.");
    }catch(e2){ oops(e2) }finally{ setBusy(false) }
  }
  return(
    <div style={{ border:"1px solid #e5e7eb", borderRadius:14, padding:14, marginBottom:12, background:"#fff" }}>
      <h3 style={{margin:"0 0 8px"}}>Offering</h3>
      {msg && <Banner ok>{msg}</Banner>}
      {err && <Banner>{err}</Banner>}
      <form onSubmit={submit} style={{display:"grid", gap:10}}>
        <Row label="SCJ Date"><input type="date" value={scjDate} onChange={e=>setScjDate(e.target.value)} /></Row>
        <Row label="Channel">
          <select value={channel} onChange={e=>setChannel(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank</option>
          </select>
        </Row>
        <Row label="Amount"><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} /></Row>
        <div><button type="submit" disabled={busy} style={primary}>{busy?"Submitting…":"Submit Offering"}</button></div>
      </form>
    </div>
  );
}