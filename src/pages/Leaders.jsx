// src/pages/Leaders.jsx
import React, { useEffect, useState } from 'react';
import {
  me,
  getLeaderSummary,
  leaderFill,
  leaderForward,
  leaderVerify,
  leaderReturn,
  downloadLeaderExport,
} from '../api';
import Modal from '../components/Modal.jsx';
import LeaderSummary from './LeaderSummary.jsx'; // ⬅️ NEW

const today = () => new Date().toISOString().slice(0, 10);

export default function Leaders() {
  const [auth, setAuth] = useState(null);
  const [date, setDate] = useState(today());
  const [type, setType] = useState('service');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [view, setView] = useState('reports'); // ⬅️ NEW: 'reports' | 'summary'

  useEffect(() => {
    (async () => {
      try { setAuth(await me()); } catch { setAuth(null); }
    })();
  }, []);

  async function load() {
    setBusy(true); setErr('');
    try { setData(await getLeaderSummary(date, type)); }
    catch (e) { setErr(e.message || 'Load failed'); }
    finally { setBusy(false); }
  }

  useEffect(() => { load(); /* initial */ }, []); // eslint-disable-line

  const role = (auth?.role || '').toUpperCase();
  const isLeader = ['GYJN','JYJN','WEJANM','NEMOBU','CHMN','DNGSN','ADMIN'].includes(role);
  const canFill = role === 'GYJN';
if (auth && !isLeader) {
  return (
    <div className="leaders-page" style={{ padding: 8 }}>
      <h2 style={{ marginTop: 0 }}>Leaders</h2>
      <Banner>Restricted to leaders only.</Banner>
    </div>
  );
}

return (
  <div className="leaders-page" style={{ padding: 8 }}>
    <h2 style={{ marginTop: 0 }}>Leaders</h2>

      {/* ⬇️ NEW: simple tab switcher */}
      {auth && (
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <button
            onClick={() => setView('reports')}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb',
                     background: view==='reports' ? '#111827' : '#fff',
                     color: view==='reports' ? '#fff' : '#111827' }}>
            Reports
          </button>
          <button
            onClick={() => setView('summary')}
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb',
                     background: view==='summary' ? '#111827' : '#fff',
                     color: view==='summary' ? '#fff' : '#111827' }}>
            Summary
          </button>
        </div>
      )}

      {auth && view==='reports' && (
        <Header
          auth={auth}
          data={data}
          date={date} setDate={setDate}
          type={type} setType={setType}
          onLoad={load}
          onExport={(fmt)=>downloadLeaderExport(fmt,{date,type})}
          onForward={()=>forwardSummary({auth, date, type, data, setErr, onAfter:load})}
          onVerify={()=>verifySummary({date, type, setErr, onAfter:load})}
          onReturn={()=>returnSummary({date, type, setErr, onAfter:load})}
        />
      )}

      {view==='reports' && err && <Banner>{err}</Banner>}
      {view==='reports' && busy && <Banner ok>Loading…</Banner>}

      {view==='reports' && data && <SummaryStrip data={data} type={type} />}
      {view==='reports' && data && <Table type={type} rows={data.rows||[]} canFill={canFill} date={date} onFilled={load} />}

      {/* ⬇️ NEW: Summary view */}
      {view==='summary' && (
        <div style={{ marginTop: 8 }}>
          {/* Reuse the same date/type pickers so results match exactly */}
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom: 8 }}>
            <label>Date: <input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
            <label>Type:{' '}
              <select value={type} onChange={e=>setType(e.target.value)}>
                <option value="service">Service</option>
                <option value="education">Education</option>
                <option value="evangelism">Evangelism</option>
                <option value="offering">Offering</option>
              </select>
            </label>
            <button onClick={load}>Load</button>
            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
              <button onClick={()=>downloadLeaderExport('xlsx',{date,type})}>Export Excel</button>
              <button onClick={()=>downloadLeaderExport('csv',{date,type})}>Export CSV</button>
            </div>
          </div>

          {/* Summary component renders the grouped tables/KPIs */}
          <LeaderSummary date={date} type={type} />
        </div>
      )}
    </div>
  );
}

/* ===== (everything below here is your original file, unchanged) ===== */

function Header({ auth, data, date, setDate, type, setType, onLoad, onExport, onForward, onVerify, onReturn }){
  const wf = data?.workflow || {};
  const forwardTo = data?.forwardTo || {};

  // Prefer backend-computed role to avoid GYJN default
  const displayRole = data?.role || auth?.role || '—';

  // Robust name extraction for the next leader chip
  const forwardRole = forwardTo?.role || '';
  const forwardName =
    forwardTo?.name ||
    forwardTo?.leaderName ||
    forwardTo?.leader?.name ||
    data?.nextLeaderName ||
    data?.next?.name ||
    '';

  const myRole = (auth?.role||'').toUpperCase();
  const reviewer = ['JYJN','WEJANM','NEMOBU','CHMN','DNGSN','ADMIN'].includes(myRole);

  // Per-day attempts UI (reset when date changes)
  const wfDate = wf?.date || null;
  const isSameDate = wfDate === date;
  const usedAttempts = isSameDate ? (wf.forwardAttempts || 0) : 0;
  const attemptsRemaining = Math.max(0, 3 - usedAttempts);

  // Forward button logic:
  // - Must verify first if reviewer & needsVerify
  // - Enabled if attemptsRemaining > 0 for selected date (resets on date change)
  const needsVerify = reviewer && wf.needsVerify;
  const canForwardUI = !needsVerify && attemptsRemaining > 0;
  const forwardDisabled = !canForwardUI;

  const forwardHint = needsVerify
    ? 'Verify first before forwarding'
    : (attemptsRemaining === 0 ? 'No more attempts' : '');

  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div><strong>Name:</strong> {auth.user?.name || '—'}</div>
        <div><strong>Title:</strong> {displayRole} {auth.scope?.label ? `(${auth.scope.label})` : ''}</div>

        <label>Date: <input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
        <label>Type:{' '}
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="service">Service</option>
            <option value="education">Education</option>
            <option value="evangelism">Evangelism</option>
            <option value="offering">Offering</option>
          </select>
        </label>

        <button onClick={onLoad}>Load</button>

        {/* Reviewer actions */}
        {reviewer && (
          <>
            <button
              onClick={onVerify}
              style={{ background:'#059669', color:'#fff', border:'none', padding:'8px 12px', borderRadius:10, cursor:'pointer' }}
              disabled={wf.status==='Verified'}
              title={wf.status==='Verified' ? 'Already verified' : 'Mark this summary as verified'}
            >
              {wf.status==='Verified' ? 'Verified' : 'Verify'}
            </button>
            <button
              onClick={onReturn}
              style={{ background:'#b91c1c', color:'#fff', border:'none', padding:'8px 12px', borderRadius:10, cursor:'pointer' }}
              title="Return for corrections (resets forward attempts)"
            >
              Return
            </button>
          </>
        )}

        {/* Forward */}
        <button
          onClick={()=>{
            if (forwardDisabled) { alert(forwardHint || 'Limit reached'); return; }
            onForward();
          }}
          style={{ background: forwardDisabled ? '#9ca3af' : '#10b981', color:'#fff', border:'none', padding:'8px 12px', borderRadius:10, cursor:'pointer' }}
          disabled={forwardDisabled}
          title={forwardHint}
        >
          Forward Summary
        </button>

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={()=>onExport('xlsx')}>Export Excel</button>
          <button onClick={()=>onExport('csv')}>Export CSV</button>
        </div>
      </div>

      {/* Helper chips */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:6 }}>
        <small style={{ color:'#065f46', background:'#ecfdf5', border:'1px solid #34d399', borderRadius:8, padding:'4px 8px' }}>
          Forward attempts: used {usedAttempts} / 3 — {attemptsRemaining} remaining
        </small>

        {['JYJN','WEJANM','NEMOBU','CHMN','DNGSN','ADMIN'].includes((auth?.role||'').toUpperCase()) && (
          <small style={{
            color: wf.status==='Verified' ? '#065f46' : (wf.status==='Returned' ? '#7f1d1d' : '#1f2937'),
            background: wf.status==='Verified' ? '#ecfdf5' : (wf.status==='Returned' ? '#fef2f2' : '#eef2ff'),
            border:`1px solid ${wf.status==='Verified' ? '#34d399' : (wf.status==='Returned' ? '#fecaca' : '#c7d2fe')}`,
            borderRadius:8, padding:'4px 8px'
          }}>
            Status: {wf.status} {wf.returns ? `(returns: ${wf.returns})` : ''}
          </small>
        )}

        {/* Next leader chip */}
        {forwardRole && (
          <small style={{ color:'#1f2937', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:8, padding:'4px 8px' }}>
            Next: {forwardRole}{forwardName ? ` (${forwardName})` : ''}
          </small>
        )}
      </div>
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

function SummaryStrip({ data, type }){
  const t = data?.totals || {};
  const members = Number.isFinite(t.members) ? t.members : (t.count || 0);

  let kpis = [
    { title: 'Role', value: data?.role || '—' },
    { title: 'Members', value: members }
  ];

  if (type === 'service' || type === 'education') {
    const physical = Number(t.physical || 0);
    const online   = Number(t.online   || 0);
    const other    = Number(t.other    || 0);
    const attended = physical + online + other;
    const pct = members ? Math.round((attended / members) * 100) : 0;
    kpis.push({ title: 'Attendance', value: `${attended} / ${members} = ${pct}%` });
  }

  if (type === 'evangelism') {
    const participated = Number(t.participated || 0);
    const pct = members ? Math.round((participated / members) * 100) : 0;
    kpis.push({ title: 'Participated', value: `${participated} / ${members} = ${pct}%` });
  }

  if (type === 'offering') {
    const totalAmount = Number(t.amount || 0);
    const offeredCount = Number(t.offeredCount || 0);
    const pct = members ? Math.round((offeredCount / members) * 100) : 0;
    kpis.push(
      { title: 'Total Amount', value: totalAmount },
      { title: 'Offered', value: `${offeredCount} / ${members} = ${pct}%` }
    );
  }

  return (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
      {kpis.map((k) => <Kpi key={k.title} title={k.title} value={k.value} />)}
      {Array.isArray(data?.warnings) && data.warnings.length>0 && (
        <Banner>{data.warnings[0]}{data.warnings.length>1?` (+${data.warnings.length-1} more)`:''}</Banner>
      )}
    </div>
  );
}
function Kpi({ title, value }){ return (
  <div style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:10, background:'#fff' }}>
    <div style={{ fontSize:12, color:'#6b7280' }}>{title}</div>
    <div style={{ fontSize:18, fontWeight:700 }}>{value}</div>
  </div>
);}

function Table({ type, rows, canFill, date, onFilled }){
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
      <table
        className="leaders-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead style={{ background: "#fafafa" }}>
          <tr>
            <Th>Name / Group</Th>

            <Th>Status</Th>
            {(type==='service' || type==='education') && <>
              <Th>Physical</Th><Th>Online</Th><Th>Other</Th><Th>Not Attended</Th>
            </>}
            {type==='evangelism' && <Th>Details</Th>}
            {type==='offering' && <><Th>Offered</Th><Th>Method</Th><Th>Amount</Th></>}
            {canFill && <Th>Action</Th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.id} type={type} row={r} canFill={canFill} date={date} onFilled={onFilled}/>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Th({ children }){ return <th style={{ textAlign:'left', padding:'10px 12px', borderBottom:'1px solid #eee', fontWeight:600 }}>{children}</th>; }
function Td({ children }){ return <td style={{ padding:'10px 12px', borderBottom:'1px solid #f3f4f6', verticalAlign:'top' }}>{children}</td>; }

function Row({ type, row, canFill, date, onFilled }){
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  const svc = row.service, edu = row.education, evg = row.evangelism, off = row.offering;

  return (
    <tr>
      <Td>
        <div style={{ fontWeight:600 }}>{row.displayName || row.name}</div>
        {'contact' in row && row.contact && (
          <div style={{ fontSize:12 }}>
            <button onClick={()=>setShow(s=>!s)} style={{ fontSize:12, padding:'2px 6px' }}>{show?'Hide':'Show'} contacts</button>
            {show && <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' }}>
              {row.contact.phone && <>
                <a href={`tel:${row.contact.phone}`}>📞 Call</a>
                <a href={`sms:${row.contact.phone}?&body=Hi ${encodeURIComponent(row.name||'')}`}>✉️ SMS</a>
                <a href={`https://wa.me/${row.contact.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">🟢 WhatsApp</a>
                <a href={`https://t.me/${(row.contact.phone||'').replace(/\D/g,'')}`} target="_blank" rel="noreferrer">📨 Telegram</a>
              </>}
              {row.contact.email && <a href={`mailto:${row.contact.email}`}>📧 Email</a>}
            </div>}
          </div>
        )}
      </Td>

      <Td><StatusPill v={row.status}/></Td>

      {(type==='service' || type==='education') && <>
        <Td>{svc || edu ? ( (svc||edu).method==='physical' && !(svc||edu).notAttended ? '✓' : '' ) : ''}</Td>
        <Td>{svc || edu ? ( (svc||edu).method==='online' && !(svc||edu).notAttended ? '✓' : '' ) : ''}</Td>
        <Td>{svc || edu ? ( (svc||edu).method==='other' && !(svc||edu).notAttended ? (`✓ ${ (svc||edu).realization ? `(${(svc||edu).realization})` : '' }`) : '' ) : ''}</Td>
        <Td>{svc || edu ? ( (svc||edu).notAttended ? '✓' : '' ) : ''}</Td>
      </>}

      {type==='evangelism' && <Td>
        {evg ? (evg.participated ? `(findings:${evg.findings||0}, nfp:${evg.nfp||0}, rp:${evg.rp||0}, bb:${evg.bb||0})` : 'Not Participated') : ''}
      </Td>}

      {type==='offering' && <>
        <Td>{off ? (off.notOffered ? 'No' : 'Yes') : ''}</Td>
        <Td>{off ? (off.notOffered ? '—' : (off.channel||'—')) : ''}</Td>
        <Td>{off ? (off.notOffered ? '0' : (off.amount ?? '—')) : ''}</Td>
      </>}

     {canFill && <Td>
  {row.kind === 'saint' && row.status === 'Missing' && (
    <button onClick={() => setOpen({ mode: 'create' })}>Fill Missing</button>
  )}

  {row.kind === 'saint' && row.status === 'Submitted' && (
    <button onClick={() => setOpen({
      mode: 'edit',
      initial:
        type === 'service'    ? (row.service    || null) :
        type === 'education'  ? (row.education  || null) :
        type === 'evangelism' ? (row.evangelism || null) :
        type === 'offering'   ? (row.offering   || null) :
        null
    })}>
      Edit
    </button>
  )}

  {(!(row.kind === 'saint' && (row.status === 'Missing' || row.status === 'Submitted'))) && (
    <span style={{ opacity: 0.5 }}>—</span>
  )}

  {open && (
    <FillModal
      type={type}
      member={row}
      date={date}
      mode={open.mode || 'create'}
      initial={open.initial || null}
      onClose={() => setOpen(false)}
      onSaved={() => { setOpen(false); onFilled?.(); }}
    />
  )}
</Td>}
    </tr>
  );
}

function StatusPill({ v }){
  const ok = v==='Submitted';
  return <span style={{ padding:'2px 8px', borderRadius:999, fontSize:12,
    background: ok? '#ecfdf5':'#fef2f2', border:`1px solid ${ok? '#34d399':'#fecaca'}`, color: ok? '#065f46':'#7f1d1d' }}>
    {v}
  </span>;
}

/* ------- Fill Missing Modal (GYJN only) ------- */
function FillModal({ type, member, date, onClose, onSaved, mode = 'create', initial = null }){
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // shared
  const [scjDate, setScjDate] = useState(date);

  // service
  const [svc_notAtt, setSvcNot] = useState(false);
  const [svc_method, setSvcMethod] = useState('physical');
  const [svc_real, setSvcReal] = useState('');

  // education
  const [edu_session, setEduSession] = useState('ALL_SUN');
  const [edu_notAtt, setEduNot] = useState(false);
  const [edu_method, setEduMethod] = useState('physical');
  const [edu_real, setEduReal] = useState('');

  // evangelism
  const [evg_part, setEvgPart] = useState(false);
  const [evg_find, setEvgFind] = useState(0);
  const [evg_nfp, setEvgNfp] = useState(0);
  const [evg_rp, setEvgRp] = useState(0);
  const [evg_bb, setEvgBb] = useState(0);

  // offering
  const [off_not, setOffNot] = useState(false);
  const [off_channel, setOffChannel] = useState('cash');
  const [off_amount, setOffAmount] = useState(0);
  const offInvalid = !off_not && Number(off_amount) < 5; // Offered must be ≥ 5

useEffect(() => {
  if (!initial) return;

  // If backend returns scjDate on the record, honor it; otherwise keep selected day
  if (initial.scjDate) setScjDate(initial.scjDate);

  if (type === 'service') {
    setSvcNot(!!initial.notAttended);
    setSvcMethod(initial.method || 'physical');
    setSvcReal(initial.realization || '');
  }

  if (type === 'education') {
    setEduSession(initial.session || 'ESTF_MON');
    setEduNot(!!initial.notAttended);
    setEduMethod(initial.method || 'physical');
    setEduReal(initial.realization || '');
  }

  if (type === 'evangelism') {
    setEvgPart(!!initial.participated);
    setEvgFind(String(initial.findings ?? ''));
    setEvgNfp(String(initial.nfp ?? ''));
    setEvgRp(String(initial.rp ?? ''));
    setEvgBb(String(initial.bb ?? ''));
  }

  if (type === 'offering') {
    setOffNot(!!initial.notOffered);
    setOffChannel(initial.channel || 'M_PESA');
    setOffAmount(String(initial.amount ?? ''));
  }
}, [initial, type]);

  async function submit(e){
    e.preventDefault(); setBusy(true); setErr('');
    try{
      let body = { scjId: member.id, scjDate };
      if (type==='service') {
        body = { ...body, notAttended: svc_notAtt, method: svc_method, realization: svc_real };
      } else if (type==='education') {
        body = { ...body, session: edu_session, notAttended: edu_notAtt, method: edu_method, realization: edu_real };
      } else if (type==='evangelism') {
        body = { ...body, participated: evg_part, findings:+evg_find||0, nfp:+evg_nfp||0, rp:+evg_rp||0, bb:+evg_bb||0 };
      } else if (type==='offering') {
        body = { ...body, notOffered: off_not, channel: off_not ? null : off_channel, amount: off_not ? 0 : (+off_amount||0) };
      }
      if (mode === 'edit') body._edit = true; // harmless hint if server ignores it
      await leaderFill(type, body);
      onSaved?.();
    } catch(e2){ setErr(e2.message || 'Submit failed'); }
    finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose} title={`${mode === 'edit' ? 'Edit Report' : 'Fill Missing'} — ${member.name}`}>
      {err && <Banner>{err}</Banner>}
      <form onSubmit={submit} style={{ display:'grid', gap:10 }}>
        <label>SCJ Date <input type="date" value={scjDate} onChange={e=>setScjDate(e.target.value)} /></label>

        {type==='service' && <>
          <label><input type="checkbox" checked={svc_notAtt} onChange={e=>setSvcNot(e.target.checked)} /> Not Attended</label>
          <label>Method{' '}
            <select value={svc_method} onChange={e=>setSvcMethod(e.target.value)} disabled={svc_notAtt}>
              <option value="physical">Physical</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Realization (optional)
            <textarea rows={2} value={svc_real} onChange={e=>setSvcReal(e.target.value)} />
          </label>
        </>}

        {type==='education' && <>
          <label>Session{' '}
            <select value={edu_session} onChange={e=>setEduSession(e.target.value)}>
              <option value="ESTF_MON">ESTF Monday</option>
              <option value="ALL_THU">All Saints Thursday</option>
              <option value="ALL_SUN">All Saints Sunday</option>
            </select>
          </label>
          <label><input type="checkbox" checked={edu_notAtt} onChange={e=>setEduNot(e.target.checked)} /> Not Attended</label>
          <label>Method{' '}
            <select value={edu_method} onChange={e=>setEduMethod(e.target.value)} disabled={edu_notAtt}>
              <option value="physical">Physical</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Realization (optional)
            <textarea rows={2} value={edu_real} onChange={e=>setEduReal(e.target.value)} />
          </label>
        </>}

        {type==='evangelism' && <>
          <label><input type="checkbox" checked={evg_part} onChange={e=>setEvgPart(e.target.checked)} /> Participated</label>
          {evg_part && <>
            <label>Findings <input type="number" min="0" value={evg_find} onChange={e=>setEvgFind(e.target.value)} /></label>
            <label>NFP <input type="number" min="0" value={evg_nfp} onChange={e=>setEvgNfp(e.target.value)} /></label>
            <label>RP <input type="number" min="0" value={evg_rp} onChange={e=>setEvgRp(e.target.value)} /></label>
            <label>BB <input type="number" min="0" value={evg_bb} onChange={e=>setEvgBb(e.target.value)} /></label>
          </>}
        </>}

        {type==='offering' && <>
          <label><input type="checkbox" checked={off_not} onChange={e=>setOffNot(e.target.checked)} /> Not Offered</label>
          <label>Channel{' '}
            <select value={off_channel} onChange={e=>setOffChannel(e.target.value)} disabled={off_not}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Amount <input type="number" min="0" value={off_amount} onChange={e=>setOffAmount(e.target.value)} disabled={off_not}/></label>
          {!off_not && Number(off_amount) < 5 && (
            <small style={{ color:'#b91c1c' }}>Amount must be at least 5 when Offered.</small>
          )}
        </>}

        <div style={{ display:'flex', gap:8, marginTop:4 }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy || (type==='offering' && (!off_not && Number(off_amount) < 5))}
            style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:8, padding:'8px 12px' }}>
             {busy ? (mode === 'edit' ? 'Saving…' : 'Submitting…') : (mode === 'edit' ? 'Save Changes' : 'Submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

async function forwardSummary({ auth, date, type, data, setErr, onAfter }){
  try {
    const counts = data?.totals || {};
    await leaderForward(type, { scjDate: date, counts, scopeLabel: auth?.scope?.label || '' });
    alert(`Forwarded ${type} summary for ${date}.`);
    onAfter?.();
  } catch (e) { setErr(e.message || 'Forward failed'); }
}
async function verifySummary({ date, type, setErr, onAfter }){
  try { await leaderVerify(type, { scjDate: date }); onAfter?.(); }
  catch (e) { setErr(e.message || 'Verify failed'); }
}
async function returnSummary({ date, type, setErr, onAfter }){
  try {
    const note = prompt('Return note (optional):') || '';
    await leaderReturn(type, { scjDate: date, note });
    onAfter?.();
  } catch (e) { setErr(e.message || 'Return failed'); }
}