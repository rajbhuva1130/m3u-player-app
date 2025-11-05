import { useEffect, useRef } from "react";

export default function QRModal({ open, text, onClose }) {
  const imgRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const QR = await import("qrcode");
      const dataUrl = await QR.toDataURL(text || "");
      if (imgRef.current) imgRef.current.src = dataUrl;
    })();
  }, [open, text]);

  if (!open) return null;
  return (
    <div className="qr-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e)=>e.stopPropagation()}>
        <h3>Scan to share a playlist URL</h3>
        <img ref={imgRef} alt="QR" style={{ width: 240, height: 240 }} />
        <div className="meta" style={{ wordBreak: "break-all" }}>{text}</div>
        <button className="btn" onClick={onClose} style={{ marginTop: 10 }}>Close</button>
      </div>
    </div>
  );
}

