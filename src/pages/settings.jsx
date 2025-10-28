// kc-frontend/src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile, logout, setRecovery, changePassword } from "../api";
import { getLangPref, setLangPref } from "../i18n";

export default function Settings(){
  const { t } = useTranslation();
  const [profile, setP] = useState(getProfile());
  const [lang, setLang] = useState(getLangPref());
  const [msg, setMsg] = useState("");
  // Recovery question state
  const [rqId, setRqId] = useState("Q1");    // an id you can use if you like
  const [rqQuestion, setRqQuestion] = useState(""); // custom text if not using a fixed list
  const [rqAnswer, setRqAnswer] = useState("");

  // Change password state
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

// Save recovery Q&A
async function onSaveRecovery(e){
  e.preventDefault();
  setBusy(true); setErr(""); setMsg("");
  try {
    if (!rqAnswer.trim() || (!rqId && !rqQuestion.trim())) {
      throw new Error("Choose a question and provide an answer.");
    }
    await setRecovery({ questionId: rqId, question: rqQuestion, answer: rqAnswer });
    setMsg("Recovery question saved.");
    setRqAnswer("");
  } catch (e2) {
    setErr(e2?.message || "Failed to save recovery question");
  } finally { setBusy(false); }
}

// Change password
async function onChangePassword(e){
  e.preventDefault();
  setBusy(true); setErr(""); setMsg("");
  try {
    if (!oldPw || !newPw) throw new Error("Provide both current and new password.");
    await changePassword({ oldPassword: oldPw, newPassword: newPw });
    setMsg("Password updated.");
    setOldPw(""); setNewPw("");
  } catch (e2) {
    setErr(e2?.message || "Failed to change password");
  } finally { setBusy(false); }
}

  useEffect(()=>{ setP(getProfile()); },[]);

  function saveLang(v){
    setLang(v);
    setLangPref(v);           // updates i18next + saves to localStorage
    setMsg(t("settings.saved"));
    setTimeout(()=>setMsg(""), 1500);
  }
  function onLogout(){
    logout();
    window.location.href = "/"; // back to welcome/auth
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop:0 }}>{t("settings.session")} & {t("settings.language")}</h2>

      {msg && <Banner ok>{msg}</Banner>}

      <Card title={t("settings.profile")}>
        <div><b>{t("settings.name")}:</b> {profile?.name || "-"}</div>
        <div><b>SCJ ID:</b> {profile?.scjId || "-"}</div>
        <div><b>{t("settings.role")}:</b> {profile?.role || "SAINT"}</div>
        <div><b>JYK:</b> {profile?.jyk || "-"} <b>Dept:</b> {profile?.dept || "-"} <b>Cell:</b> {profile?.cell || "-"}</div>
      </Card>

      <Card title={t("settings.language")}>
        <select value={lang} onChange={e=>saveLang(e.target.value)}>
          <option value="en">English</option>
          <option value="ko">한국어</option>
        </select>
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
          {/* Developer tip: press F12 to see any missing translation keys in the console */}
          {/* Missing keys are collected in window.__i18nMissing */}
        </div>
      </Card>

      {/* Recovery Question */}
<Card title="Account Recovery">
  {err && <Banner>{err}</Banner>}
  {msg && <Banner ok>{msg}</Banner>}

  <form onSubmit={onSaveRecovery} style={{ display:"grid", gap:10 }}>
    <div style={{ fontSize:12, color:"#6b7280" }}>
      Set a recovery question & answer. You’ll use this to reset your password if you forget it.
    </div>

    {/* Option 1: pick from a fixed list (use rqId) */}
    <label>Question (choose one)
      <select value={rqId} onChange={e=>setRqId(e.target.value)}>
        <option value="Q1">What month were you baptized?</option>
        <option value="Q2">Who first invited you to church?</option>
        <option value="Q3">What is your favorite Bible book?</option>
        <option value="Q4">What was the theme of your first retreat?</option>
        <option value="Q5">Which JYK did you first attend?</option>
        <option value="Q6">What is your mother’s middle name?</option>
        <option value="Q7">What is your childhood nickname?</option>
        <option value="Q8">What is the name of your first teacher?</option>
        <option value="Q9">What city were you born in?</option>
        <option value="Q10">What is your favorite hymn?</option>
      </select>
    </label>

    {/* Option 2: custom question (optional). If you don’t want custom, hide this. */}
    <label>Or write your own question (optional)
      <input value={rqQuestion} onChange={e=>setRqQuestion(e.target.value)} placeholder="Custom question (optional)"/>
    </label>

    <label>Answer *
      <input value={rqAnswer} onChange={e=>setRqAnswer(e.target.value)} />
    </label>

    <div><button disabled={busy} style={primary} type="submit">{busy? "Saving..." : "Save Recovery Question"}</button></div>
  </form>
</Card>

{/* Change Password */}
<Card title="Change Password">
  {err && <Banner>{err}</Banner>}
  {msg && <Banner ok>{msg}</Banner>}

  <form onSubmit={onChangePassword} style={{ display:"grid", gap:10 }}>
    <label>Current Password *
      <input type="password" value={oldPw} onChange={e=>setOldPw(e.target.value)} />
    </label>
    <label>New Password *
      <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} />
    </label>
    <div><button disabled={busy} style={primary} type="submit">{busy? "Updating..." : "Update Password"}</button></div>
  </form>
</Card>

      <Card title={t("settings.backups")}>
        <div>Coming soon.</div>
      </Card>

      <Card title={t("settings.session")}>
        <button style={danger} onClick={onLogout}>🚪 {t("settings.logout")}</button>
      </Card>
    </div>
  );
}

function Card({title,children}){
  return (
    <div style={{border:"1px solid #e5e7eb",background:"#fff",borderRadius:14,padding:14,marginBottom:12}}>
      <h3 style={{margin:"0 0 8px"}}>{title}</h3>
      {children}
    </div>
  );
}
function Banner({ok,children}){
  return (
    <div style={{
      background: ok ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${ok ? "#34d399" : "#fecaca"}`,
      color: ok ? "#065f46" : "#7f1d1d",
      padding: 10, borderRadius: 10, marginBottom: 8
    }}>{children}</div>
  );
}
// Button style helpers (add these above const danger = ...)
const btn = {
  padding: "8px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#fff",
  cursor: "pointer",
};

const primary = {
  ...btn,
  background: "#2563eb",
  color: "#fff",
  border: "none",
};
const danger={padding:"8px 12px", border:"none", borderRadius:10, background:"#ef4444", color:"#fff", cursor:"pointer"};