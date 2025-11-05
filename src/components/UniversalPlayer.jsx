import { useEffect, useRef } from "react";
import Hls from "hls.js";

// DASH & FLV are loaded lazily to keep initial bundle small
let dashjs; // dynamic import cached
let flvjs;  // dynamic import cached

function canNativePlayHls(video) {
  return video && video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl");
}

function getTypeFromUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    if (p.endsWith(".m3u8")) return "hls";
    if (p.endsWith(".mpd")) return "dash";
    if (p.endsWith(".flv")) return "flv";
    if (p.endsWith(".mp4")) return "mp4";
    if (p.endsWith(".ts")) return "ts"; // will attempt via HLS engine
  } catch {}
  return "unknown";
}

export default function UniversalPlayer({ url, autoPlay = true, onPlayState }) {
  const videoRef = useRef(null);
  const engineRef = useRef({ type: null, destroy: null });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    // Cleanup any previous playback engine
    if (engineRef.current.destroy) {
      try { engineRef.current.destroy(); } catch {}
      engineRef.current = { type: null, destroy: null };
    }

    const type = getTypeFromUrl(url);

    async function setup() {
      if (type === "hls" || type === "ts" || type === "unknown") {
        // Prefer Hls.js for wide support; fallback to native on Safari/iOS
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.LEVEL_LOADED, () => { if (autoPlay) video.play().catch(()=>{}); });
          engineRef.current = { type: "hls", destroy: () => hls.destroy() };
        } else if (canNativePlayHls(video)) {
          video.src = url;
          if (autoPlay) video.play().catch(()=>{});
          engineRef.current = { type: "native", destroy: () => { video.removeAttribute("src"); video.load(); } };
        } else {
          // As a last resort, try dashjs if URL was mis-labeled
          dashjs = dashjs || (await import("dashjs"));
          const player = dashjs.MediaPlayer().create();
          player.initialize(video, url, autoPlay);
          engineRef.current = { type: "dash", destroy: () => player.reset() };
        }
        return;
      }

      if (type === "dash") {
        dashjs = dashjs || (await import("dashjs"));
        const player = dashjs.MediaPlayer().create();
        player.initialize(video, url, autoPlay);
        engineRef.current = { type: "dash", destroy: () => player.reset() };
        return;
      }

      if (type === "flv") {
        flvjs = flvjs || (await import("flv.js"));
        if (flvjs.isSupported()) {
          const flvPlayer = flvjs.createPlayer({ type: "flv", url });
          flvPlayer.attachMediaElement(video);
          flvPlayer.load();
          if (autoPlay) flvPlayer.play();
          engineRef.current = { type: "flv", destroy: () => flvPlayer.destroy() };
          return;
        }
      }

      if (type === "mp4") {
        video.src = url;
        if (autoPlay) video.play().catch(()=>{});
        engineRef.current = { type: "native", destroy: () => { video.removeAttribute("src"); video.load(); } };
        return;
      }
    }

    setup();

    const onPlay = () => onPlayState?.(true);
    const onPause = () => onPlayState?.(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      if (engineRef.current.destroy) {
        try { engineRef.current.destroy(); } catch {}
      }
    };
  }, [url, autoPlay, onPlayState]);

  return (
    <video
      ref={videoRef}
      className="video"
      controls
      playsInline
      // don’t set autoPlay attr directly — some browsers block it; we call play() instead
      style={{ width: "100%", height: "100%" }}
    />
  );
}
