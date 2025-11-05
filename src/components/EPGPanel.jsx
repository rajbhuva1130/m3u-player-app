import { useState } from "react";
import { XMLParser } from "fast-xml-parser";

// Minimal XMLTV support: user pastes an EPG XML URL; we try to match by name
export default function EPGPanel({ currentChannel }) {
  const [url, setUrl] = useState("");
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("Paste XMLTV URL and Load");

  async function loadEPG() {
    if (!url) return;
    setStatus("Loading EPG…");
    try {
      const res = await fetch(url);
      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const data = parser.parse(xml);
      const progs = data?.tv?.programme || [];
      const name = (currentChannel?.title || "").toLowerCase();

      // best-effort match on channel "display-name" or channel attribute
      const matched = progs.filter(p => {
        const chId = (p["@_channel"] || "").toString().toLowerCase();
        const disp = []
          .concat((data?.tv?.channel || []).filter(c => c["@_id"] === p["@_channel"])
            .map(c => c["display-name"]))
          .flat()
          .map(x => (typeof x === "string" ? x : x?.["#text"]))
          .filter(Boolean)
          .map(s => s.toLowerCase());

        return name && (chId.includes(name) || disp.some(d => d.includes(name)));
      }).slice(0, 20);

      setEntries(matched);
      setStatus(matched.length ? `Loaded ${matched.length} entries` : "No matching EPG found");
    } catch (e) {
      setStatus("Failed to load EPG (CORS or invalid XML)");
    }
  }

  return (
    <div className="epg">
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <input
          className="input" placeholder="EPG XMLTV URL"
          value={url} onChange={e => setUrl(e.target.value)}
          style={{ flex:1 }}
        />
        <button className="button" onClick={loadEPG}>Load</button>
      </div>
      <div className="small">{status}</div>
      {entries.map((p, i) => (
        <div key={i} style={{ padding:"8px 0", borderBottom:"1px dashed #223" }}>
          <div style={{ fontWeight:600 }}>
            {p.title?.[0]?.["#text"] || p.title || "Program"}
          </div>
          <div className="small">
            {fmtTime(p["@_start"])} – {fmtTime(p["@_stop"])}
          </div>
          <div>{p.desc?.[0]?.["#text"] || p.desc || ""}</div>
        </div>
      ))}
    </div>
  );
}

function fmtTime(v) {
  if (!v) return "";
  // XMLTV format: YYYYMMDDHHMMSS + tz
  const m = String(v).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return v;
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00`;
  try { return new Date(iso).toLocaleString(); } catch { return v; }
}
