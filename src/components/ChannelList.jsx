import classNames from "classnames";

export default function ChannelList({
  channels,
  activeUrl,
  onSelect,
  onFav,
  favorites
}) {
  const favSet = new Set(favorites.map(f => f.url));
  return (
    <div className="list">
      {channels.map(ch => (
        <div
          key={ch.id}
          className={classNames("item", { active: ch.url === activeUrl })}
          onClick={() => onSelect(ch)}
          title={ch.url}
        >
          <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
            <div>
              <div style={{ fontWeight:600 }}>{ch.title}</div>
              <div className="small badge">{ch.meta.replace("#EXTINF:", "INF: ")}</div>
            </div>
            <button
              className="button"
              onClick={(e) => { e.stopPropagation(); onFav(ch); }}
            >
              {favSet.has(ch.url) ? "★" : "☆"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
