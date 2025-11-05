import AccordionSection from "./AccordionSection.jsx";
import ChannelRow from "./ChannelRow.jsx";

const PLAYLISTS = [
  { label: "🇺🇸 USA", value: "US", file: "US-M3u-File-1-04-11-2025.m3u" },
  { label: "🇬🇧 UK", value: "UK", file: "UK-M3u-File-1-04-11-2025.m3u" },
  { label: "🇮🇳 India", value: "IN", file: "IN-M3u-File-1-04-11-2025.m3u" },
];

export default function Sidebar({
  q, setQ,
  favorites,
  channels,
  activeUrl,
  currentPlaylist,
  onPlay, onFav, onSelect,
  onSelectPlaylist,
  onClose,            // provided by overlay
  overlay = false,    // true when shown as overlay (iPad/Desktop)
}) {
  return (
    <aside className={`sidebar ${overlay ? "is-overlay" : ""}`}>
      {/* No header here on desktop/ipad to avoid duplication.
          Close button is not needed; backdrop handles click-to-close.
          (If you still want a close 'X', uncomment the block below) */}
      {false && overlay && (
        <div className="overlay-hd">
          <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
          <div className="title">Browse</div>
          <div style={{ inlineSize: "2rem" }} />
        </div>
      )}

      {/* Search at TOP of sidebar (single source of truth) */}
      <div className="sidebar-search">
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

      <div className="sidebar-body">
        <AccordionSection defaultOpen={true} title={`Playlists (${PLAYLISTS.length})`}>
          {PLAYLISTS.map((p) => (
            <div
              key={p.value}
              className={`row ${currentPlaylist === p.value ? "active" : ""}`}
              onClick={() => onSelectPlaylist({ type: "preset", playlist: p })}
              tabIndex={0}
              onKeyDown={(e)=>{ if (e.key === "Enter") onSelectPlaylist({ type: "preset", playlist: p }); }}
            >
              <div className="left">
                <div className="logo" />
                <div className="title">{p.label}</div>
              </div>
            </div>
          ))}
        </AccordionSection>

        <AccordionSection defaultOpen={false} title={`Favorite (${favorites.length})`}>
          {favorites.map((ch) => (
            <ChannelRow
              key={ch.id}
              ch={ch}
              index={0}
              active={activeUrl === ch.url}
              onClick={() => onSelect(ch)}
              onPlay={onPlay}
              onFav={onFav}
              isFav
            />
          ))}
          {!favorites.length && (
            <div className="meta" style={{ padding: "0.5rem" }}>No favorites yet</div>
          )}
        </AccordionSection>

        <AccordionSection defaultOpen={false} title={`Channels (${channels.length})`}>
          {channels.map((ch) => (
            <ChannelRow
              key={ch.id}
              ch={ch}
              index={0}
              active={activeUrl === ch.url}
              onClick={() => onSelect(ch)}
              onPlay={onPlay}
              onFav={onFav}
              isFav={(favorites || []).some(f => f.url === ch.url)}
            />
          ))}
          {!channels.length && (
            <div className="meta" style={{ padding: "0.5rem" }}>
              No channels match your search
            </div>
          )}
        </AccordionSection>
      </div>
    </aside>
  );
}
