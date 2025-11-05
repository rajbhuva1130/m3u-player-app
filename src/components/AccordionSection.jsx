import { useState } from "react";

export default function AccordionSection({ title, children, defaultOpen = false, extraRight }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className="section-hd" onClick={() => setOpen(!open)} style={{cursor:"pointer"}}>
        <div>{title}</div>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          {extraRight}
          <span style={{opacity:.7}}>{open ? "▾" : "▸"}</span>
        </div>
      </div>
      {open && <div className="section-bd">{children}</div>}
    </div>
  );
}