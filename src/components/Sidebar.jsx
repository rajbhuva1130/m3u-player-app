import { useRef, useCallback, useMemo } from "react";
import AccordionSection from "./AccordionSection.jsx";
import ChannelRow from "./ChannelRow.jsx";
import SearchBar from "./SearchBar.jsx";

const PLAYLISTS = [
  { label: "🇺🇸 USA", value: "US", file: "US-M3u-File-1-04-11-2025.m3u" },
  { label: "🇬🇧 UK", value: "UK", file: "UK-M3u-File-1-04-11-2025.m3u" },
  { label: "🇮🇳 India", value: "IN", file: "IN-M3u-File-1-04-11-2025.m3u" },
];

function Sidebar({
  hidden,
  q, setQ,
  playlist,
  favorites,
  channels,
  activeUrl,
  currentPlaylist,
  onPlay, onFav, onSelect,
  onSelectPlaylist,
  onHideSidebar,
}) {
  const favSet = useMemo(() => new Set(favorites.map(f => f.url)), [favorites]);
  const fileRef = useRef(null);

  const handleLocalFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onSelectPlaylist({ type: "local", text });
    if (fileRef.current) fileRef.current.value = "";
  }, [onSelectPlaylist]);

  const handlePlaylistClick = useCallback((p) => {
    onSelectPlaylist({ type: "preset", playlist: p });
  }, [onSelectPlaylist]);

  return (
    <aside className={`sidebar ${hidden ? "hidden" : ""}`}>
      <div className="topbar">
        <button className="iconbtn mobile-close-btn" onClick={onHideSidebar}>✕</button>

        <div className="search-controls-wrap">
          <SearchBar value={q} onChange={setQ} />
          <label className="iconbtn upload-btn" title="Upload local .m3u">
            ⬆︎ Upload
            <input
              ref={fileRef}
              type="file"
              accept=".m3u,.m3u8"
              style={{ display: "none" }}
              onChange={handleLocalFile}
            />
          </label>
        </div>
      </div>

      <div className="sidebar-body">
        <AccordionSection defaultOpen={true} title={`Playlists (${PLAYLISTS.length})`}>
          {PLAYLISTS.map(p => (
            <div
              key={p.value}
              className={`row ${currentPlaylist === p.value ? "active" : ""}`}
              onClick={() => handlePlaylistClick(p)}
            >
              <div className="left">
                <div className="logo" />
                <div className="title">{p.label}</div>
              </div>
            </div>
          ))}
        </AccordionSection>

        <AccordionSection defaultOpen={false} title={`Favorite (${favorites.length})`}>
          {favorites.map(ch => (
            <ChannelRow
              key={ch.id}
              ch={ch}
              active={activeUrl === ch.url}
              onClick={() => onSelect(ch)}
              onPlay={onPlay}
              onFav={onFav}
              isFav
            />
          ))}
          {!favorites.length && (
            <div className="meta" style={{ padding: "6px 10px" }}>No favorites yet</div>
          )}
        </AccordionSection>

        <AccordionSection defaultOpen={false} title={`Channels (${channels.length})`}>
          {channels.map(ch => (
            <ChannelRow
              key={ch.id}
              ch={ch}
              active={activeUrl === ch.url}
              onClick={() => onSelect(ch)}
              onPlay={onPlay}
              onFav={onFav}
              isFav={favSet.has(ch.url)}
            />
          ))}
          {!channels.length && (
            <div className="meta" style={{ padding: "6px 10px" }}>
              No channels match your search
            </div>
          )}
        </AccordionSection>
      </div>
    </aside>
  );
}

export default Sidebar;
