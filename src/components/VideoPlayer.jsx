import { useRef, useEffect } from "react";
import Hls from "hls.js";

export default function IPTVPlayer({ url }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!url || !videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play();
      });

      return () => hls.destroy();
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = url;
    }
  }, [url]);

  return (
    <video ref={videoRef} controls autoPlay style={{ width: "100%", height: "auto" }} />
  );
}
