import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";
import { isM3U8, isTS } from "../utils/parseM3U";

const Player = forwardRef(({ url }, ref) => {
  const localRef = useRef(null);
  const engineRef = useRef(null);
  
  useImperativeHandle(ref, () => localRef.current);

  useEffect(() => {
    const video = localRef.current;
    if (!video) return;

    if (engineRef.current) {
      try { engineRef.current.destroy?.(); } catch {}
      engineRef.current = null;
    }

    if (!url) return;
    
    video.pause();

    if (isM3U8(url) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      engineRef.current = hls;
    } else if (isTS(url) && mpegts.getFeatureList().mseLivePlayback) {
      const player = mpegts.createPlayer({ type: "mpegts", isLive: true, url });
      player.attachMediaElement(video);
      player.load();
      player.play().catch(() => {});
      engineRef.current = player;
    } else {
      video.src = url;
      video.play().catch(() => {});
    }

    return () => {
      if (engineRef.current) {
        try { engineRef.current.destroy?.(); } catch {}
        engineRef.current = null;
      }
    };
  }, [url]);

  return <video ref={localRef} className="video" controls playsInline />;
});

export default Player;