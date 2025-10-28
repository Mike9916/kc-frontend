// src/pages/Support.jsx
import { apiPost } from "../api";
import React, { useEffect, useState } from "react";

export default function Support(){
  // Form fields
  const [name, setName]   = useState("");
  const [scjId, setScjId] = useState("");
  const [phone, setPhone] = useState("");
  const [jyk, setJyk]     = useState("");
  const [dept, setDept]   = useState("");
  const [cell, setCell]   = useState("");
  const [type, setType]   = useState("forgot_password");
  const [details, setDetails] = useState("");

  // Dropdown data (loaded from backend)
  const [depts, setDepts] = useState([]);

  // UI state
  const [busy, setBusy] = useState(false);
  const [ok, setOk]     = useState("");
  const [err, setErr]   = useState("");

  // Button enabled only when all required fields present
  const canSend = name && scjId && phone && jyk && dept && cell;

  // Safe JSON helper (avoids “Unexpected end of JSON input”)
  async function safeJson(res){
    const text = await res.text();
    try { return text ? JSON.parse(text) : {}; } catch { return {}; }
  }

  // Load dropdowns
  useEffect(() => {
    (async () => {   
      try {
        const r2 = await fetch("/api/meta/departments");
        const j2 = await safeJson(r2);
        // Fallback if server meta not available
        const fallback = ["Men", "Young Adults", "Women"];
        setDepts(Array.isArray(j2.items) && j2.items.length ? j2.items : fallback);
      } catch {
        setDepts(["Men", "Young Adults", "Women"]);
      }
    })();
  }, []);

  // Submit to backend (correct path: /api/support)
 async function submit(e){
  e.preventDefault();
  setBusy(true); setErr(""); setOk("");

  try{
    await apiPost("/api/support", {
      name, scjId, phone, jyk, dept, cell, type, details
    });
    setOk("Your request was sent to Admin Support. We’ll contact you shortly.");
    setName(""); setScjId(""); setPhone(""); setJyk(""); setDept(""); setCell(""); setDetails("");
  }catch(e2){
    setErr(e2?.message || "Submit failed");
  }finally{
    setBusy(false);
  }
}
  return (
    <div style={{maxWidth:560, margin:"24px auto", padding:"16px"}}>
      <h2 style={{marginTop:0}}>Need Help?</h2>
      <p>If you can’t sign in or create an account, send your details to the Admin Support team.</p>

      {ok  && <Banner ok>{ok}</Banner>}
      {err && <Banner>{err}</Banner>}

      <form onSubmit={submit} style={{display:"grid", gap:10}}>
        <Row label="Name *"><input value={name} onChange={e=>setName(e.target.value)} /></Row>
        <Row label="SCJ ID *"><input value={scjId} onChange={e=>setScjId(e.target.value)} /></Row>
        <Row label="Phone *"><input value={phone} onChange={e=>setPhone(e.target.value)} /></Row>

        <Row label="JYK *">
  <input value={jyk} onChange={e=>setJyk(e.target.value)} placeholder="Type your JYK name" />
</Row>

<Row label="Department *">
  <select value={dept} onChange={e=>setDept(e.target.value)}>
    <option value="">Select Department</option>
    <option value="Men">Men</option>
    <option value="Young Adults">Young Adults</option>
    <option value="Women">Women</option>
  </select>
</Row>

        <Row label="Cell *">
          <input value={cell} onChange={e=>setCell(e.target.value)} placeholder="e.g., Cell 1" />
        </Row>

        <Row label="Issue Type">
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="forgot_password">Forgot password</option>
            <option value="create_account">Can’t create account</option>
            <option value="other">Other</option>
          </select>
        </Row>

        <Row label="Details">
          <textarea rows={3} value={details} onChange={e=>setDetails(e.target.value)} placeholder="(Optional) briefly describe the issue"/>
        </Row>

        <div>
          <button
            type="submit"
            disabled={!canSend || busy}
            style={{
              padding:"8px 12px", border:"none", borderRadius:10,
              background: canSend? "#2563eb":"#9ca3af",
              color:"#fff", cursor: canSend? "pointer":"not-allowed"
            }}>
            {busy? "Sending…" : "Send to Admin"}
          </button>
        </div>
      </form>

      <p style={{marginTop:12, color:"#6b7280"}}>
        We won’t receive or read your messages from WhatsApp, Telegram, or SMS inside this app.
        Admin will contact you directly using the phone number you provided.
      </p>
    </div>
  );
}

function Row({label,children}){ return (
  <div style={{display:"grid", gridTemplateColumns:"140px 1fr", gap:10, alignItems:"center"}}>
    <div style={{color:"#6b7280"}}>{label}</div>
    <div>{children}</div>
  </div>
);}

function Banner({ok,children}){
  return (
    <div style={{
      background: ok ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${ok ? "#34d399" : "#fecaca"}`,
      color: ok ? "#065f46" : "#7f1d1d",
      padding:10, borderRadius:10, margin:"8px 0"
    }}>{children}</div>
  );
}