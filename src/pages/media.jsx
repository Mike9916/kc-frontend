// kc-frontend/src/pages/Media.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, getToken, getProfile, mediaDelete, subscribe } from "../api";

// --- tiny helpers ---
const isElevated = (role) => {
  const r = String(role || "").toUpperCase();
  return ["CULTURE","COMMS","NEMOBU","CHMN","WEJANM","DNGSN","ADMIN"].includes(r);
};
const canSeeAll = isElevated;
const canModerate = (role) => {
  const r = String(role || "").toUpperCase();
  // culture can delete/flag; admin can do anything
  return r === "CULTURE" || r === "ADMIN";
};
const canDeleteAny = canModerate;

// turn /uploads/x into absolute URL
function absUrl(path){
  if(!path) return "";
  if(/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}/${String(path).replace(/^\/+/, "")}`;
}

// file download utility (single item)
async function downloadToDevice(item){
  const url = absUrl(item.url);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if(!r.ok) throw new Error(`Download failed (HTTP ${r.status})`);
  const blob = await r.blob();
  const a = document.createElement("a");
  const filename = (item.title || item.caption || item.id || "media")
    .toString().replace(/[^\w.-]+/g,"_");
  const ext = (item.type||"").startsWith("video") ? ".mp4" : ".jpg";
  const dlUrl = URL.createObjectURL(blob);
  a.href = dlUrl;
  a.download = filename.endsWith(ext) ? filename : (filename + ext);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(dlUrl);
}

export default function Media(){
  const { t } = useTranslation();
  const profile = getProfile(); // { scjId, name, role, jyk, dept, cell }
  const meId = String(profile?.scjId || "");
  const myJyk = String(profile?.jyk || "");
  const myRole = String(profile?.role || "").toUpperCase();

  const [items, setItems] = useState([]);      // server list
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Filters/UI
  const [tab, setTab] = useState("jyk");       // "jyk" | "mine"
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");  // newest | oldest | type

  // URL-add (legacy)
  const [urlType, setUrlType] = useState("image");
  const [urlValue, setUrlValue] = useState("");
  const [urlSize, setUrlSize] = useState("");

  // File upload
  const [file, setFile] = useState(null);

  // Modal (viewer with swipe)
  const [viewer, setViewer] = useState({ open:false, index:-1 }); // index inside "view" list
  const viewerRef = useRef(null);

  // Multi-select via long-press
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(()=>new Set());
  const longPressTimers = useRef({}); // id -> timer

  // Local download state (lazy download when visible or opened)
  const [loadedBlob, setLoadedBlob] = useState(()=>new Map()); // id -> objectURL
  const observerRef = useRef(null);

  useEffect(() => {
    load();
    const stop = subscribe(() => load(false), 12000);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(showSpinner = true){
    if (showSpinner) setLoading(true);
    setErr("");
    try{
      // Server endpoint already filters by JYK for non-elevated;
      // elevated roles see ALL JYKs.
      const r = await fetch(`${API_BASE}/api/media/jyk`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error || `HTTP ${r.status}`);
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
      setSelected(new Set());
      setSelectMode(false);
    }catch(e){ setErr(String(e.message || e)); }
    finally{ if (showSpinner) setLoading(false); }
  }

  // ---- URL add (JSON) ------------------------------------------------
  async function addByUrl(e){
    e.preventDefault();
    setErr(""); setMsg("");
    try{
      if(!urlValue.trim()) throw new Error("Enter a URL");
      const r = await fetch(`${API_BASE}/api/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: urlType,
          url: urlValue.trim(),
          sizeBytes: Number(urlSize) || 0
        })
      });
      if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error || `HTTP ${r.status}`);
      setUrlValue(""); setUrlSize("");
      setMsg("Saved.");
      await load();
    }catch(e){ setErr(String(e.message || e)); }
  }

  // ---- File upload (multipart) --------------------------------------
  async function uploadFile(e){
    e.preventDefault();
    setErr(""); setMsg("");
    try{
      if(!file) throw new Error("Choose a file first.");
      const isVideo = (file.type || "").startsWith("video");
      const max = isVideo ? 1024*1024*1024 : 15*1024*1024; // 1GB / 15MB
      if(file.size > max){
        throw new Error(isVideo ? "Video must be ≤ 1 GB" : "Image must be ≤ 15 MB");
      }
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API_BASE}/api/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd
      });
      if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error || `HTTP ${r.status}`);
      setFile(null);
      (e.target && e.target.reset && e.target.reset());
      setMsg("Uploaded.");
      await load();
    }catch(e){ setErr(String(e.message || e)); }
  }

  // ---- Delete (owner OR moderator) ----------------------------------
  async function onDelete(id, ownerScjId){
    if(!id) return;
    const owner = String(ownerScjId) === meId;
    if (!owner && !canDeleteAny(myRole)) {
      setErr("You can only delete your own uploads.");
      return;
    }
    setErr(""); setMsg("");
    try{
      await mediaDelete(id);
      setMsg("Deleted.");
      await load();
    }catch(e){ setErr(String(e.message || e)); }
  }

  // ---- Flag / Unflag (Culture/Admin) --------------------------------
  async function flagItems(ids, flag=true){
    if (!canModerate(myRole)) { setErr("Only Culture/Admin can flag."); return; }
    if (!ids?.length) return;
    setErr(""); setMsg("");
    try{
      const path = flag ? "/api/media/flag" : "/api/media/unflag";
      const r = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type":"application/json" },
        body: JSON.stringify({ ids })
      });
      if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error || `HTTP ${r.status}`);
      setMsg(flag ? "Flagged." : "Unflagged.");
      await load();
    }catch(e){ setErr(String(e.message || e)); }
  }

  // ---- Save to device (multi) ---------------------------------------
  async function saveSelected(){
    const ids = [...selected];
    if (ids.length === 0) return;
    setErr(""); setMsg("");
    try{
      const mapById = new Map(items.map(x=>[x.id,x]));
      for (const id of ids) {
        const itm = mapById.get(id);
        if (itm) await downloadToDevice(itm);
      }
      setMsg("Saved to device.");
    }catch(e){ setErr(String(e.message || e)); }
  }

  // ---- Long-press select --------------------------------------------
  const onTilePressStart = (id) => {
    const timer = setTimeout(() => {
      setSelectMode(true);
      setSelected(prev => {
        const s = new Set(prev);
        s.add(id);
        return s;
      });
    }, 500); // long press 500ms
    longPressTimers.current[id] = timer;
  };
  const onTilePressEnd = (id) => {
    const t = longPressTimers.current[id];
    if (t) { clearTimeout(t); delete longPressTimers.current[id]; }
  };
  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // ---- Derived filtered/sorted "view" list --------------------------
  const view = useMemo(() => {
    let list = Array.from(items);
    // Saints default tab "jyk"; "mine" is personal uploads
    if (tab === "mine") list = list.filter(x => String(x.scjId) === meId);
    // search
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      list = list.filter(x =>
        String(x.type || "").toLowerCase().includes(qq) ||
        String(x.title || "").toLowerCase().includes(qq) ||
        String(x.caption || "").toLowerCase().includes(qq) ||
        String(x.name || "").toLowerCase().includes(qq) ||
        String(x.jyk || "").toLowerCase().includes(qq) ||
        String(x.dept || "").toLowerCase().includes(qq) ||
        String(x.cell || "").toLowerCase().includes(qq)
      );
    }
    // sort
    if (sort === "newest") list.sort((a,b)=> (new Date(b.ts||0)) - (new Date(a.ts||0)));
    if (sort === "oldest") list.sort((a,b)=> (new Date(a.ts||0)) - (new Date(b.ts||0)));
    if (sort === "type")   list.sort((a,b)=> String(a.type||"").localeCompare(String(b.type||"")));
    return list;
  }, [items, tab, q, sort, meId]);

  // ---- Lazy-load thumbnails: only set "src" when visible ------------
  const [visibleIds, setVisibleIds] = useState(()=>new Set());
  const tileRefs = useRef(new Map());

  useEffect(() => {
    observerRef.current?.disconnect?.();
    const obs = new IntersectionObserver((entries) => {
      const toAdd = [];
      entries.forEach(e => {
        const id = e.target.getAttribute("data-id");
        if (id && e.isIntersecting) toAdd.push(id);
      });
      if (toAdd.length) {
        setVisibleIds(prev => {
          const s = new Set(prev);
          toAdd.forEach(x => s.add(x));
          return s;
        });
      }
    }, { root: null, threshold: 0.2 });
    observerRef.current = obs;
    // attach
    tileRefs.current.forEach((el) => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [view]);

  const openViewer = (index) => setViewer({ open:true, index });
  const closeViewer = () => setViewer({ open:false, index:-1 });

  // swipe logic (no external lib) in modal
  const startX = useRef(0);
  const deltaX = useRef(0);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { deltaX.current = e.touches[0].clientX - startX.current; };
  const onTouchEnd   = () => {
    const d = deltaX.current;
    deltaX.current = 0;
    if (Math.abs(d) < 40) return;
    if (d < 0 && viewer.index < view.length - 1) setViewer(v => ({ ...v, index: v.index + 1 }));
    if (d > 0 && viewer.index > 0)               setViewer(v => ({ ...v, index: v.index - 1 }));
  };

  // auto-download when navigating to a not-yet-downloaded item (WhatsApp-like)
  const ensureBlobForIndex = useCallback(async (idx) => {
    const it = view[idx];
    if (!it || loadedBlob.has(it.id)) return;
    try{
      const r = await fetch(absUrl(it.url), { headers: { Authorization: `Bearer ${getToken()}` } });
      if(!r.ok) return; // silent
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setLoadedBlob(prev => {
        const m = new Map(prev); m.set(it.id, url); return m;
      });
    }catch{ /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, loadedBlob, setLoadedBlob]);

  useEffect(() => {
    if (viewer.open && viewer.index >= 0) ensureBlobForIndex(viewer.index);
  }, [viewer, ensureBlobForIndex]);

  useEffect(() => {
    // also attempt prefetch next on change
    if (viewer.open && viewer.index < view.length - 1) ensureBlobForIndex(viewer.index + 1);
  }, [viewer, view.length, ensureBlobForIndex]);

  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ marginTop: 0 }}>
        {t("media.gallery")} — {canSeeAll(myRole) ? "All JYKs" : (myJyk || "JYK")}
      </h2>

      {msg && <Banner ok>{msg}</Banner>}
      {err && <Banner>{err}</Banner>}

      {/* Controls */}
      <div style={controls}>
        <div style={btnGroup}>
          <button onClick={()=>setTab("jyk")}  style={tabBtn(tab==="jyk")}>Feed</button>
          <button onClick={()=>setTab("mine")} style={tabBtn(tab==="mine")}>My Uploads</button>
        </div>
        <input
          placeholder="Search (type/title/caption/uploader/jyk/dept/cell)"
          value={q}
          onChange={e=>setQ(e.target.value)}
          style={inp}
        />
        <select value={sort} onChange={e=>setSort(e.target.value)} style={inp}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="type">Type</option>
        </select>
        <button onClick={()=>load()} style={btnGhost}>↻ Refresh</button>
      </div>

      {/* Elevated bar for selection actions */}
      {selectMode && (
        <div style={{ ...BannerStyle, background:"#eef2ff", borderColor:"#c7d2fe", color:"#1f2937" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <strong>{selected.size}</strong> selected
            <button style={btnGhost} onClick={()=>{ setSelected(new Set()); setSelectMode(false); }}>Clear</button>
            <button style={btnPrimary} onClick={saveSelected}>Save to device</button>
            {canModerate(myRole) && (
              <>
                <button style={btnDanger} onClick={()=>flagItems([...selected], true)}>Flag</button>
                <button style={btnGhost}  onClick={()=>flagItems([...selected], false)}>Unflag</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Uploader & URL add */}
      <div style={twoCol}>
        <Card title="Upload (image/video)">
          <form onSubmit={uploadFile}>
            <input type="file" accept="image/*,video/*"
              onChange={(e)=>setFile(e.target.files?.[0] || null)} />
            <div style={{ fontSize:12, color:"#6b7280", marginTop:6 }}>
              Images ≤ 15 MB, Videos ≤ 1 GB.
            </div>
            <div style={{ marginTop: 8 }}>
              <button type="submit" style={btnPrimary}>Upload</button>
            </div>
          </form>
        </Card>

        <Card title={t("media.add_media")}>
          <form onSubmit={addByUrl} style={{ display:"grid", gap:8 }}>
            <label style={labelRow}>
              <span style={label}>{t("media.type")}:</span>
              <select value={urlType} onChange={e=>setUrlType(e.target.value)}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label style={labelRow}>
              <span style={label}>{t("media.url")}:</span>
              <input value={urlValue} onChange={e=>setUrlValue(e.target.value)} placeholder="https://..." />
            </label>
            <label style={labelRow}>
              <span style={label}>{t("media.size_bytes")}:</span>
              <input value={urlSize} onChange={e=>setUrlSize(e.target.value)} placeholder="(optional)" />
            </label>
            <div><button type="submit" style={btnPrimary}>{t("media.save")}</button></div>
          </form>
        </Card>
      </div>

      {/* Gallery */}
      <div style={grid}>
        {loading && <div>Loading…</div>}
        {!loading && view.length === 0 && (
          <div style={{ color:"#6b7280" }}>{t("media.no_items")}</div>
        )}
        {!loading && view.map((m, idx) => {
          const thumbVisible = visibleIds.has(m.id);
          // expiry countdown
          const hoursLeft = (() => {
            if(!m.expiresAt) return null;
            const diff = (new Date(m.expiresAt).getTime() - Date.now()) / 36e5;
            return Math.max(0, Math.floor(diff));
          })();
          return (
            <div
              key={m.id}
              data-id={m.id}
              ref={(el)=>{ if(el) tileRefs.current.set(m.id, el); }}
              style={tile}
              onPointerDown={()=>onTilePressStart(m.id)}
              onPointerUp={()=>onTilePressEnd(m.id)}
              onPointerLeave={()=>onTilePressEnd(m.id)}
            >
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <small style={{ color:"#6b7280" }}>
                  {new Date(m.ts || Date.now()).toLocaleString()}
                  {" • "}{String(m.type||"").toUpperCase()}
                  {m.jyk ? ` • ${m.jyk}` : ""}
                  {m.dept ? ` • ${m.dept}` : ""}
                  {m.cell ? ` • ${m.cell}` : ""}
                </small>
                <small style={{ color:"#6b7280" }}>
                  {m.name ? m.name : (m.scjId || "")}
                </small>
              </div>

              {/* Flag + Expiry badges */}
              <div style={{ position:"relative" }}>
                {m.flagged && (
                  <div title="Flagged" style={{
                    position:"absolute", top:8, left:8, background:"#fee2e2",
                    color:"#991b1b", border:"1px solid #fecaca", borderRadius:6, padding:"2px 6px", zIndex:2, fontSize:12
                  }}>🚩 Flagged</div>
                )}
                {hoursLeft!=null && (
                  <div title="Auto-deletes after 72h" style={{
                    position:"absolute", top:8, right:8, background:"#eef2ff",
                    color:"#1f2937", border:"1px solid #c7d2fe", borderRadius:6, padding:"2px 6px", zIndex:2, fontSize:12
                  }}>⏳ {hoursLeft}h left</div>
                )}

                <div
                  style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", cursor:"zoom-in" }}
                  onClick={()=>{
                    if (selectMode) { toggleSelect(m.id); return; }
                    openViewer(idx);
                  }}
                  title={selectMode ? "Select" : "Click to preview"}
                >
                  {/* Lazy: show blurred box until visible then set src */}
                  {String(m.type).startsWith("video") || m.type === "video" ? (
                    thumbVisible ? (
                      <video style={{ width:"100%", display:"block" }} src={absUrl(m.url)} />
                    ) : (
                      <div style={{ width:"100%", paddingTop:"56%", background:"#f3f4f6" }} />
                    )
                  ) : (
                    thumbVisible ? (
                      <img alt={m.title || ""} style={{ width:"100%", display:"block" }} src={absUrl(m.url)} />
                    ) : (
                      <div style={{ width:"100%", paddingTop:"100%", background:"#f3f4f6" }} />
                    )
                  )}
                </div>
              </div>

              {(m.title || m.caption) && (
                <div style={{ marginTop:8 }}>
                  {m.title && <div style={{ fontWeight:600 }}>{m.title}</div>}
                  {m.caption && <div style={{ color:"#374151", fontSize:14 }}>{m.caption}</div>}
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, alignItems:"center" }}>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={()=>toggleSelect(m.id)}
                    />
                  )}
                  {String(m.scjId) === meId ? (
                    <>
                      <button onClick={()=>downloadToDevice(m)} style={btnGhost}>⬇️ Save</button>
                      <button onClick={()=>onDelete(m.id, m.scjId)} style={btnDanger}>🗑 Delete</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>downloadToDevice(m)} style={btnGhost}>⬇️ Save</button>
                      {canDeleteAny(myRole) && (
                        <button onClick={()=>onDelete(m.id, m.scjId)} style={btnDanger}>🗑 Delete</button>
                      )}
                    </>
                  )}
                </div>
                <button
                  style={btnLink}
                  onClick={()=>{
                    // quick open in new tab
                    window.open(absUrl(m.url), "_blank", "noopener,noreferrer");
                  }}
                >
                  Open
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal viewer with swipe + auto-download next */}
      {viewer.open && view[viewer.index] && (
        <Modal onClose={closeViewer}>
          <div
            ref={viewerRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ maxWidth: "92vw", maxHeight: "82vh" }}
          >
            <div style={{ marginBottom: 8, color:"#6b7280", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                {new Date(view[viewer.index].ts || Date.now()).toLocaleString()}
                {" • "}{view[viewer.index].type?.toUpperCase()}
                {view[viewer.index].jyk ? ` • ${view[viewer.index].jyk}` : ""}
              </div>
              <div style={{display:"flex", gap:8}}>
                <button
                  disabled={viewer.index<=0}
                  onClick={()=>setViewer(v=>({...v, index:v.index-1}))}
                  style={btnGhost}
                >←</button>
                <button
                  disabled={viewer.index>=view.length-1}
                  onClick={()=>setViewer(v=>({...v, index:v.index+1}))}
                  style={btnGhost}
                >→</button>
              </div>
            </div>

            {(() => {
              const it = view[viewer.index];
              const local = loadedBlob.get(it.id);
              const src = local || absUrl(it.url);
              return (String(it.type).startsWith("video") || it.type === "video") ? (
                <video controls style={{ width:"100%", height:"auto" }} src={src} />
              ) : (
                <img alt={it.title || ""} style={{ maxWidth:"100%", height:"auto" }} src={src} />
              );
            })()}

            <div style={{ marginTop: 8 }}>
              {view[viewer.index].title && <div style={{ fontWeight: 600 }}>{view[viewer.index].title}</div>}
              {view[viewer.index].caption && <div style={{ color:"#374151" }}>{view[viewer.index].caption}</div>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// -------- small UI bits ----------
function Card({ title, children }){
  return (
    <div style={{ border:"1px solid #e5e7eb", background:"#fff", borderRadius:14, padding:14, marginBottom:12 }}>
      <h3 style={{ margin:"0 0 8px" }}>{title}</h3>
      {children}
    </div>
  );
}
function Banner({ ok, children }){
  return <div style={{ ...BannerStyle, background: ok ? "#ecfdf5" : "#fef2f2", borderColor: ok ? "#34d399" : "#fecaca", color: ok ? "#065f46" : "#7f1d1d" }}>{children}</div>;
}
const BannerStyle = {
  padding: 10, borderRadius: 10, marginBottom: 8, border: "1px solid"
};
function Modal({ children, onClose }){
  return (
    <div style={modalWrap} onClick={onClose}>
      <div style={modalBox} onClick={(e)=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={onClose} style={btnGhost}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const modalWrap = {
  position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
  display:"grid", placeItems:"center", padding:14, zIndex: 50
};
const modalBox = {
  width:"min(920px, 96vw)", maxHeight:"90vh", overflow:"auto",
  background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:12
};

const controls = { display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:8, alignItems:"center", marginBottom:10 };
const btnGroup = { display:"flex", gap:6 };
const tabBtn = (active) => ({
  padding:"8px 10px",
  border:"1px solid #e5e7eb",
  borderRadius:10,
  background: active ? "#111827" : "#fff",
  color: active ? "#fff" : "#111827",
  cursor:"pointer"
});
const grid = { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:12 };
const tile = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:10, position:"relative" };
const labelRow = { display:"grid", gridTemplateColumns:"120px 1fr", gap:8, alignItems:"center" };
const label = { fontSize:12, color:"#6b7280" };
const inp = { padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:10 };
const btnPrimary = { padding:"8px 12px", border:"1px solid #111827", background:"#111827", color:"#fff", borderRadius:8, cursor:"pointer" };
const btnGhost   = { padding:"6px 10px", border:"1px solid #e5e7eb", background:"#fff", color:"#111827", borderRadius:8, cursor:"pointer" };
const btnDanger  = { padding:"6px 10px", border:"1px solid #ef4444", background:"#fff", color:"#ef4444", borderRadius:8, cursor:"pointer" };
const btnLink    = { padding:"6px 10px", border:"1px solid #e5e7eb", background:"#fff", color:"#111827", borderRadius:8, cursor:"pointer", textDecoration:"none" };
const twoCol     = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:12 };