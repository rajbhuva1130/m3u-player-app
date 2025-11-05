import classNames from "classnames";

function getHost(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

export default function ChannelRow({ ch, active, onClick, onPlay, onFav, isFav }) {
  const metaText = getHost(ch.url);

  return (
    <div className={classNames("row", { active })} onClick={onClick}>
      <div className="left">
        <div className="logo" />
        <div>
          <div className="title">{ch.title}</div>
          <div className="meta">{metaText}</div>
        </div>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        {/* Favorite Button */}
        <button className="favbtn" onClick={(e)=>{e.stopPropagation(); onFav(ch);}}>
          {isFav ? "★" : "☆"}
        </button>
        {/* Play Button */}
        <button className="playbtn" onClick={(e)=>{e.stopPropagation(); onPlay(ch);}}>▶ Play</button>
      </div>
    </div>
  );
}