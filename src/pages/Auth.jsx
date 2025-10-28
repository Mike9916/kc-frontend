// kc-frontend/src/pages/Auth.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { loginJSON, signupJSON, setProfile } from "../api";
import { startRecovery, resetPassword } from "../api";
import Modal from "../components/Modal.jsx";
// Labels for built-in recovery questions
const RECOVERY_LABELS = {
  Q1:"What month were you baptized?",
  Q2:"Who first invited you to church?",
  Q3:"What is your favorite Bible book?",
  Q4:"What was the theme of your first retreat?",
  Q5:"Which JYK did you first attend?",
  Q6:"What is your mother’s middle name?",
  Q7:"What is your childhood nickname?",
  Q8:"What is the name of your first teacher?",
  Q9:"What city were you born in?",
  Q10:"What is your favorite hymn?",
};

export default function Auth({ onDone }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Forgot password modal state
const [showForgot, setShowForgot] = useState(false);
const [fpScjId, setFpScjId] = useState("");
const [rq, setRq] = useState(null);     // { questionId, question }
const [answer, setAnswer] = useState("");
const [newPw, setNewPw] = useState("");

  // Shared fields
  const [scjId, setScjId] = useState("");
  const [password, setPassword] = useState("");

  // Signup-only fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function doLogin(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await loginJSON({ scjId, password });
      onDone?.();
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally { setBusy(false); }
  }

  async function doSignup(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      // signup validates against whitelist (scjId + name, phone optional if enabled on server)
      const data = await signupJSON({ scjId, name, phone, password });
      if (data?.profile) setProfile(data.profile);
      onDone?.();
    } catch (e) {
      setErr(e?.message || "Signup failed");
    } finally { setBusy(false); }
  }
// ---- Forgot password flow (must be INSIDE the component) ----
  async function startRecoveryFlow(e){
    e.preventDefault();
    setErr(""); setBusy(true);
    try{
      const r = await startRecovery(fpScjId); // returns {questionId, question}
      setRq(r);
    } catch (e2){
      setRq(null);
      setErr(e2?.message || "Could not start recovery");
    } finally { setBusy(false); }
  }

  async function finishRecoveryFlow(e){
    e.preventDefault();
    setErr(""); setBusy(true);
    try{
      await resetPassword({ scjId: fpScjId, answer, newPassword: newPw });
      alert("Password reset. You can sign in now.");
      // clean up & close
      setShowForgot(false);
      setRq(null); setAnswer(""); setNewPw(""); setFpScjId("");
    } catch (e2){
      setErr(e2?.message || "Reset failed");
    } finally { setBusy(false); }
  }
  return (
    <div style={wrap}>
      <div style={card}>
      {showForgot && (
  <Modal title="Reset password" onClose={()=>setShowForgot(false)}>
    {err && (
  <div style={errorBox} role="alert">{err}</div>
)}

{!rq ? (
  // Step 1: ask for SCJ ID and fetch question
  <form onSubmit={startRecoveryFlow} style={{ display:"grid", gap:10 }}>
    <label style={{display:"grid", gap:6}}>
      <span style={{fontSize:12,color:"#374151"}}>SCJ ID</span>
      <input value={fpScjId} onChange={e=>setFpScjId(e.target.value)} style={inp} required />
    </label>
    <button disabled={busy} type="submit" style={cta}>
      {busy ? "…" : "Continue"}
    </button>
  </form>
) : (
  // Step 2: only show question UI if a question actually exists
 <form onSubmit={finishRecoveryFlow} style={{ display:"grid", gap:10 }}>
  <div>
    <b>Question:</b>{" "}
    {rq?.question || (rq?.questionId ? RECOVERY_LABELS[rq.questionId] : "") || "(no recovery question set)"}
  </div>
  <label style={{display:"grid", gap:6}}>
    <span style={{fontSize:12,color:"#374151"}}>Answer</span>
    <input value={answer} onChange={e=>setAnswer(e.target.value)} style={inp} required />
  </label>
    <label style={{display:"grid", gap:6}}>
      <span style={{fontSize:12,color:"#374151"}}>New password</span>
      <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} style={inp} required />
    </label>

    <button disabled={busy} type="submit" style={cta}>
      {busy ? "…" : "Reset Password"}
    </button>
  </form>
)}
  </Modal>
)}
        <div style={tabs}>
          <button
            onClick={() => setMode("login")}
            style={{...tabBtn, ...(mode==="login"?tabActive:{} )}}
          >{t("auth.login") || "Login"}</button>
          <button
            onClick={() => setMode("signup")}
            style={{...tabBtn, ...(mode==="signup"?tabActive:{} )}}
          >{t("auth.signup") || "Create account"}</button>
        </div>
<button
  type="button"
  onClick={() => { window.location.hash = "#/support"; }}
  style={{ padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", cursor:"pointer", marginBottom:8 }}
>
  Support
</button>
        {mode === "login" ? (
          <form onSubmit={doLogin} style={form}>
            <Field label="SCJ ID">
              <input value={scjId} onChange={e=>setScjId(e.target.value)} required style={inp}/>
            </Field>
            <Field label="PIN / Password">
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={inp}/>
            </Field>
            {err && <div style={errorBox}>{err}</div>}
            <button disabled={busy} type="submit" style={cta}>
              {busy ? "…" : (t("auth.login") || "Login")}
            </button>
            <button
  type="button"
  onClick={()=>{ setErr(""); setRq(null); setAnswer(""); setNewPw(""); setFpScjId(scjId || ""); setShowForgot(true); }}
  style={{ ...cta, background:"#6b7280", marginTop:8 }}
>
  Forgot password?
</button>

<p style={{marginTop:12}}>
  Trouble signing in? <a href="#/support">Get help</a>
</p>
          </form>
        ) : (
          <form onSubmit={doSignup} style={form}>
            <Field label="SCJ ID (must be whitelisted)">
              <input value={scjId} onChange={e=>setScjId(e.target.value)} required style={inp}/>
            </Field>
            <Field label="Full name (exactly as in whitelist)">
              <input value={name} onChange={e=>setName(e.target.value)} required style={inp}/>
            </Field>
            <Field label="Phone (optional unless server requires)">
              <input value={phone} onChange={e=>setPhone(e.target.value)} style={inp}/>
            </Field>
            <Field label="Choose PIN (4–6 digits)">
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={inp}/>
            </Field>
            {err && <div style={errorBox}>{err}</div>}
            <button disabled={busy} type="submit" style={cta}>
              {busy ? "…" : (t("auth.signup") || "Create account")}
            </button>
            <p style={{fontSize:12,color:"#6b7280",marginTop:8}}>
              Your details must match the whitelist (ask admin to add/correct if needed).
            </p>
          <p style={{marginTop:12}}>
  Need help creating an account? <a href="#/support">Get help</a>
</p>
          </form>
        )}
      </div>
    </div>
  );
}

// ---- Forgot password flow ----

function Field({ label, children }) {
  return (
    <label style={{display:"grid", gap:6}}>
      <span style={{fontSize:12,color:"#374151"}}>{label}</span>
      {children}
    </label>
  );
}

// styles
const wrap = { display:"grid", placeItems:"center", minHeight:"60vh" };
const card = { width:"100%", maxWidth:380, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16, boxShadow:"0 1px 2px rgba(0,0,0,0.04)" };
const tabs = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 };
const tabBtn = { padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", cursor:"pointer" };
const tabActive = { background:"#111827", color:"#fff" };
const form = { display:"grid", gap:12 };
const inp = { padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8, outline:"none" };
const cta = { padding:"10px 12px", background:"#111827", color:"#fff", border:"none", borderRadius:10, cursor:"pointer" };
const errorBox = { padding:10, background:"#fef2f2", color:"#991b1b", border:"1px solid #fecaca", borderRadius:8 };