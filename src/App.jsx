import { useEffect, useMemo, useRef, useState } from "react";
import { parseM3U } from "./utils/parseM3U.js";
import { loadFavorites, saveFavorites, toggleFavorite } from "./utils/storage.js";
import Sidebar from "./components/Sidebar.jsx";
import Player from "./components/Player.jsx";
import PlayerControls from "./components/PlayerControls.jsx";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [raw, setRaw] = useState("");
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [favorites, setFavorites] = useState(loadFavorites());
  const [current, setCurrent] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState("UK");
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // --- Playlist Loading Logic ---
  const initialLoad = useRef(true);

  async function handlePlaylistSelect({ type, text, playlist }) {
    if (type === "preset" && playlist?.file) {
      setCurrentPlaylist(playlist.value);
      const filePath = `/${playlist.file}`;
      try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`Failed to load ${filePath}`);
        text = await res.text();
      } catch (e) {
        console.error("Error loading preset:", e);
        text = "";
      }
    }

    setRaw(text || "");
    setCurrent(null);

    // FIX: Do NOT reset search on playlist change or typing breaks input focus
    // setQ("");
  }

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      const INDIA_PLAYLIST_DATA = { label: "🇮🇳 India", value: "IN", file: "IN-M3u-File-1-04-11-2025.m3u" };
      handlePlaylistSelect({ type: "preset", playlist: INDIA_PLAYLIST_DATA });
    }
  }, []);

  // Parse M3U
  useEffect(() => { setAll(parseM3U(raw)); }, [raw]);

  // Auto-select first channel
  useEffect(() => {
    if (!current && all.length > 0) setCurrent(all[0]);
  }, [all]);

  const filtered = useMemo(() => {
    if (!q.trim()) return all;
    const s = q.toLowerCase();
    return all.filter(c =>
      c.title.toLowerCase().includes(s) ||
      c.url.toLowerCase().includes(s)
    );
  }, [all, q]);

  const idx = filtered.findIndex(c => c.url === current?.url);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < filtered.length - 1;

  function select(ch) { setCurrent(ch); }

  function play(ch) {
    setCurrent(ch);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
          .then(() => setPlaying(true))
          .catch(e => console.error("Play failed:", e));
      }
    }, 50);
  }

  function fav(ch) {
    const next = toggleFavorite(favorites, ch);
    setFavorites(next);
    saveFavorites(next);
  }

  function onPrev() { if (canPrev) setCurrent(filtered[idx - 1]); }
  function onNext() { if (canNext) setCurrent(filtered[idx + 1]); }

  function onPlayPause() {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(e => console.error("Play failed:", e));
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  function onFullscreen() {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    videoElement.addEventListener('play', onPlay);
    videoElement.addEventListener('pause', onPause);

    return () => {
      videoElement.removeEventListener('play', onPlay);
      videoElement.removeEventListener('pause', onPause);
    };
  }, [current]);

  // Mobile: collapse sidebar initially
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    if (mq.matches) setSidebarOpen(false);
  }, []);

  return (
    <div className="app">
      <Sidebar
        hidden={!sidebarOpen}
        q={q}
        setQ={setQ}
        playlist={[]}                // keep empty or use real playlists if you have them
        favorites={favorites}
        channels={filtered}          // ✅ Pass filtered list, not all
        activeUrl={current?.url}
        currentPlaylist={currentPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onPlay={play}
        onFav={fav}
        onSelect={select}
        onHideSidebar={() => setSidebarOpen(false)}
      />


      <div className="right">
        <div className="right-hd">
          {!sidebarOpen && (
            <button className="iconbtn sidebar-show-toggle" onClick={() => setSidebarOpen(true)}>
              ☰ Show
            </button>
          )}
          <div className="right-title">{current?.title || "Select a channel"}</div>
          {current && <div className="right-sub"> {current.url}</div>}
        </div>

        <div className="player-wrap">
          {current
            ? <Player url={current.url} ref={videoRef} />
            : <div style={{ color: "var(--sub)", padding: 20, fontSize: '1.2em' }}>Load an M3U and pick a channel</div>
          }
        </div>

        <div className="controls">
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
    </div>
  );
}
