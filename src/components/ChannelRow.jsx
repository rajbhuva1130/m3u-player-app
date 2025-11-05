import classNames from "classnames";

function getHost(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

export default function ChannelRow({ ch, active, onClick, onPlay, onFav, isFav, index }) {
  const metaText = getHost(ch.url);
  return (
    <div
      className={classNames("row", { active })}
      onClick={onClick}
      tabIndex={0}
      data-index={index}
      onKeyDown={(e)=>{
        if (e.key === "Enter") onPlay(ch);
        if (e.key === " ") { e.preventDefault(); onFav(ch); }
      }}
    >
      <div className="left">
        <div className="logo" />
        <div>
          <div className="title">{ch.title}</div>
          <div className="meta">{metaText}</div>
        </div>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <button className="favbtn" onClick={(e)=>{e.stopPropagation(); onFav(ch);}}>
          {isFav ? "★" : "☆"}
        </button>
        <button className="playbtn" onClick={(e)=>{e.stopPropagation(); onPlay(ch);}}>▶ Play</button>
      </div>
    </div>
  );
}
