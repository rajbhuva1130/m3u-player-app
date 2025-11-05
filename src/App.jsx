import { useEffect, useMemo, useRef, useState } from "react";
import { parseM3U } from "./utils/parseM3U.js";
import { loadFavorites, saveFavorites, toggleFavorite } from "./utils/storage.js";
import Sidebar from "./components/Sidebar.jsx";
import UniversalPlayer from "./components/UniversalPlayer.jsx";
import PlayerControls from "./components/PlayerControls.jsx";
import "./index.css";

/** Phones-only compact detector (iPad behaves like desktop) */
function useCompactPhone() {
  const Q = "(max-width: 47.999rem)"; // ~<=768px phones
  const [compact, setCompact] = useState(() => matchMedia(Q).matches);
  useEffect(() => {
    const mq = matchMedia(Q);
    const on = (e) => setCompact(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return compact;
}

/** Safe public path resolver (works in dev, prod, GitHub Pages) */
function publicUrl(pathFromPublic) {
  const clean = String(pathFromPublic || "").replace(/^\/+/, "");
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "/");
  return `${base}${clean}`;
}

/** Utility: are we typing in an input/textarea/contenteditable? */
function isTypingAnywhere() {
  const ae = document.activeElement;
  if (!ae) return false;
  const tag = ae.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (ae.getAttribute && ae.getAttribute("contenteditable") === "true") return true;
  return !!ae.closest?.('input, textarea, [contenteditable="true"]');
}

export default function App() {
  const compact = useCompactPhone();       // true on phones only
  const [sidebarOpen, setSidebarOpen] = useState(false); // iPad/Desktop overlay

  // Core state
  const [raw, setRaw] = useState("");
  const [all, setAll] = useState([]);
  const [q, setQ] = useState(""); // search lives in sidebar / sheet
  const [favorites, setFavorites] = useState(loadFavorites());
  const [current, setCurrent] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState("IN");
  const [playing, setPlaying] = useState(false);

  // Mobile bottom sheet (phones)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState("channels"); // playlists | favorites | channels

  const videoEl = useRef(null);
  const first = useRef(true);

  // On ultra-wide displays, start with sidebar open
  useEffect(() => {
    const mq = matchMedia("(min-width: 110rem) and (min-height: 60rem)");
    const setFromMQ = () => setSidebarOpen(mq.matches);
    setFromMQ();
    mq.addEventListener("change", setFromMQ);
    return () => mq.removeEventListener("change", setFromMQ);
  }, []);

  async function handlePlaylistSelect({ type, text, playlist }) {
    if (type === "preset" && playlist?.file) {
      setCurrentPlaylist(playlist.value);
      const filePath = publicUrl(`m3u/${playlist.file}`); // /public/m3u/*
      try {
        const res = await fetch(filePath, { cache: "no-cache" });
        if (!res.ok) throw new Error(`Failed ${filePath}: ${res.status}`);
        text = await res.text();
      } catch (e) {
        console.error(e);
        text = "";
      }
    }
    setRaw(text || "");
    setCurrent(null);
  }

  // Initial load a default playlist
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    const INDIA = { label: "🇮🇳 India", value: "IN", file: "IN-M3u-File-1-04-11-2025.m3u" };
    handlePlaylistSelect({ type: "preset", playlist: INDIA });
  }, []);

  // Parse M3U and select initial channel
  useEffect(() => { setAll(parseM3U(raw)); }, [raw]);
  useEffect(() => { if (!current && all.length) setCurrent(all[0]); }, [all, current]);

  // Filtered channels by sidebar query
  const filtered = useMemo(() => {
    if (!q.trim()) return all;
    const s = q.toLowerCase();
    return all.filter(c => c.title.toLowerCase().includes(s) || c.url.toLowerCase().includes(s));
  }, [all, q]);

  const idx = filtered.findIndex(c => c.url === current?.url);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < filtered.length - 1;

  function select(ch) { setCurrent(ch); if (compact) setSheetOpen(false); }
  function play(ch)   { setCurrent(ch); if (compact) setSheetOpen(false); }
  function fav(ch) {
    const next = toggleFavorite(favorites, ch);
    setFavorites(next); saveFavorites(next);
  }

  function onPrev() { if (canPrev) setCurrent(filtered[idx - 1]); }
  function onNext() { if (canNext) setCurrent(filtered[idx + 1]); }

  // Player controls
  function onPlayPause() {
    const v = videoEl.current; if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(()=>{});
    else { v.pause(); setPlaying(false); }
  }
  function onFullscreen() {
    const v = videoEl.current; if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen?.();
  }

  // Capture real <video> element
  useEffect(() => {
    const id = setInterval(() => {
      const el = document.querySelector("video.video");
      if (el) { videoEl.current = el; clearInterval(id); }
    }, 150);
    return () => clearInterval(id);
  }, [current]);

  // Keyboard / Remote — skip when typing (fixes spacebar-in-search)
  useEffect(() => {
    const onKey = (e) => {
      if (isTypingAnywhere()) return; // do nothing if focused in inputs
      const v = videoEl.current; if (!v) return;
      switch (e.key) {
        case " ":
          e.preventDefault(); onPlayPause(); break;
        case "f": case "F": onFullscreen(); break;
        case "ArrowRight": v.currentTime = Math.min(v.duration || 1e9, v.currentTime + 10); break;
        case "ArrowLeft":  v.currentTime = Math.max(0, v.currentTime - 10); break;
        case "ArrowUp":    v.volume = Math.min(1, v.volume + 0.05); break;
        case "ArrowDown":  v.volume = Math.max(0, v.volume - 0.05); break;
        case "MediaPlayPause": onPlayPause(); break;
        case "MediaTrackNext": onNext(); break;
        case "MediaTrackPrevious": onPrev(); break;
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onNext]);

  const favSet = useMemo(() => new Set(favorites.map(f => f.url)), [favorites]);

  // --- Mobile Bottom Sheet Content (phones) ---
  function SheetContent() {
    return (
      <div className="sheet-bd">
        {/* Search inside sheet (phones) */}
        <div className="sheet-search">
          <div className="search-input">
            <span className="loupe">🔍</span>
            <input
              aria-label="Search channels"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Search channels or URLs"
              autoComplete="off" autoCorrect="off" spellCheck="false"
            />
            {!!q && <button className="clear" onClick={()=>setQ("")} aria-label="Clear">✕</button>}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {["playlists","favorites","channels"].map(t => (
            <button
              key={t}
              className={`tab ${sheetTab === t ? "active" : ""}`}
              onClick={() => setSheetTab(t)}
            >
              {t === "playlists" ? "Playlists" : t === "favorites" ? "Favorites" : "Channels"}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div className="panel">
          {sheetTab === "playlists" && (
            <div className="list">
              {[
                { label: "🇺🇸 USA", value: "US", file: "US-M3u-File-1-04-11-2025.m3u" },
                { label: "🇬🇧 UK", value: "UK", file: "UK-M3u-File-1-04-11-2025.m3u" },
                { label: "🇮🇳 India", value: "IN", file: "IN-M3u-File-1-04-11-2025.m3u" },
              ].map(p => (
                <div
                  key={p.value}
                  className={`row ${currentPlaylist === p.value ? "active" : ""}`}
                  onClick={() => handlePlaylistSelect({ type: "preset", playlist: p })}
                >
                  <div className="left">
                    <div className="logo" />
                    <div className="title">{p.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sheetTab === "favorites" && (
            <div className="list">
              {favorites.map((ch) => (
                <div
                  key={ch.id}
                  className={`row ${current?.url === ch.url ? "active" : ""}`}
                  onClick={() => select(ch)}
                >
                  <div className="left">
                    <div className="logo" />
                    <div>
                      <div className="title">{ch.title}</div>
                      <div className="meta">{new URL(ch.url).hostname}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button className="favbtn" onClick={(e)=>{e.stopPropagation(); fav(ch);}}>
                      ★
                    </button>
                    <button className="playbtn" onClick={(e)=>{e.stopPropagation(); play(ch);}}>
                      ▶
                    </button>
                  </div>
                </div>
              ))}
              {!favorites.length && <div className="meta" style={{ padding:"0.5rem" }}>No favorites yet</div>}
            </div>
          )}

          {sheetTab === "channels" && (
            <div className="list">
              {filtered.map((ch) => (
                <div
                  key={ch.id}
                  className={`row ${current?.url === ch.url ? "active" : ""}`}
                  onClick={() => select(ch)}
                >
                  <div className="left">
                    <div className="logo" />
                    <div>
                      <div className="title">{ch.title}</div>
                      <div className="meta">{(() => { try { return new URL(ch.url).hostname; } catch { return ch.url; } })()}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button className="favbtn" onClick={(e)=>{e.stopPropagation(); fav(ch);}}>
                      {favSet.has(ch.url) ? "★" : "☆"}
                    </button>
                    <button className="playbtn" onClick={(e)=>{e.stopPropagation(); play(ch);}}>
                      ▶
                    </button>
                  </div>
                </div>
              ))}
              {!filtered.length && <div className="meta" style={{ padding:"0.5rem" }}>No channels match your search</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Helper to extract hostname (for H2 header)
  const host = (() => {
    try { return current ? new URL(current.url).hostname : ""; }
    catch { return ""; }
  })();

  return (
    <div className={`app ${compact ? "compact" : "desktop"}`}>
      {/* iPad/Desktop: overlay sidebar & backdrop */}
      {!compact && (
        <>
          <div
            className={`backdrop ${sidebarOpen ? "show" : ""}`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden={!sidebarOpen}
          />
          <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}>
            <Sidebar
              q={q}
              setQ={setQ}
              favorites={favorites}
              channels={filtered}
              activeUrl={current?.url}
              currentPlaylist={currentPlaylist}
              onSelectPlaylist={handlePlaylistSelect}
              onPlay={play}
              onFav={fav}
              onSelect={(ch) => { select(ch); setSidebarOpen(false); }}
              onClose={() => setSidebarOpen(false)}
              overlay
            />
          </div>
        </>
      )}

      {/* Right/content */}
      <div className="right">
        {/* Header (H2: toggle + title + hostname) */}
        <div className="right-hd">
          {!compact && (
            <button
              className="iconbtn hdr-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
          )}
          <div className="right-title">{current?.title || "Select a channel"}</div>
          {!compact && current && <div className="right-sub">{host}</div>}
          {compact && (
            <button
              className="btn"
              onClick={() => { setSheetTab("channels"); setSheetOpen(true); }}
              aria-label="Browse"
            >
              ☰ Browse
            </button>
          )}
        </div>

        <div className="player-wrap" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {current ? (
            <UniversalPlayer url={current.url} onPlayState={setPlaying} />
          ) : (
            <div className="empty-state">Load an M3U and pick a channel</div>
          )}
        </div>

        <div className="controls" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <PlayerControls
            onPrev={onPrev}
            onPlayPause={onPlayPause}
            onNext={onNext}
            onFullscreen={onFullscreen}
            playing={playing}
            canPrev={canPrev}
            canNext={canNext}
          />
        </div>
      </div>

      {/* Phones: bottom sheet navigator */}
      {compact && (
        <div
          className={`sheet ${sheetOpen ? "open" : ""}`}
          onClick={(e)=>{ if (e.target.classList.contains("sheet")) setSheetOpen(false); }}
          style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
        >
          <div className="sheet-wrap">
            {/* NOTE: header only on phones to avoid duplicate UI on desktop */}
            <div className="sheet-hd">
              <button className="iconbtn" onClick={()=>setSheetOpen(false)} aria-label="Close">✕</button>
              <div className="title">Browse</div>
              <div style={{ inlineSize: "2rem" }} />
            </div>
            <SheetContent />
          </div>
        </div>
      )}
    </div>
  );
}
