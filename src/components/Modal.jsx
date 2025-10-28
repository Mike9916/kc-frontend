import React from "react";

export default function Modal({ title, onClose, children }) {
  return (
    <div role="dialog" aria-modal="true"
         style={{
           position:'fixed', inset:0, background:'rgba(0,0,0,.35)',
           display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
         }}
         onClick={onClose}>
      <div style={{
        width:'min(680px, 92vw)', maxHeight:'88vh', overflow:'auto',
        background:'#fff', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,.2)',
        padding:16
      }}
      onClick={(e)=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
          <h3 style={{ margin:0, flex:1 }}>{title || 'Modal'}</h3>
          <button onClick={onClose} aria-label="Close" style={{ fontSize:18, lineHeight:1 }}>✖</button>
        </div>
        {children}
      </div>
    </div>
  );
}