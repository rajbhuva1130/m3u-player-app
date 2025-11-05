export default function PlayerControls({
  onPrev, onPlayPause, onNext, onFullscreen, playing, canPrev, canNext
}) {
  return (
    <>
      <button className="btn" disabled={!canPrev} onClick={onPrev}>⏮ Prev</button>
      <button className="btn" onClick={onPlayPause}>{playing ? "⏸ Pause" : "▶️ Play"}</button>
      <button className="btn" disabled={!canNext} onClick={onNext}>⏭ Next</button>
      <div className="spacer" />
      <button className="btn" onClick={onFullscreen}>⛶ Fullscreen</button>
    </>
  );
}
