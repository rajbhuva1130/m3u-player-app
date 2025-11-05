export default function ChannelGrid({ channels, onSelect, onToggleFav, favorites, activeId }) {
  if (!channels?.length) {
    return (
      <div className="text-white/70 py-20 text-center">Load an M3U to see channels.</div>
    );
  }

  const isFav = (id) => !!favorites?.includes(id);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {channels.map((ch) => (
        <div
          key={ch.id}
          className={`group rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 transition shadow-lg border ${activeId===ch.id ? 'border-red-500' : 'border-white/10'}`}
          title={ch.name}
        >
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFav(ch.id); }}
              className={`absolute top-2 right-2 text-lg leading-none rounded-full px-2 py-1 backdrop-blur bg-black/40 hover:bg-black/60 transition ${isFav(ch.id) ? 'text-red-500' : 'text-white/80'}`}
              aria-label="Toggle Favorite"
              title={isFav(ch.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFav(ch.id) ? '❤️' : '♡'}
            </button>
            <button onClick={() => onSelect(ch)} className="w-full">
              <div className="aspect-video bg-black/40 grid place-items-center overflow-hidden">
                {ch.logo ? (
                  <img src={ch.logo} alt={ch.name} className="object-contain w-full h-full" loading="lazy" />
                ) : (
                  <div className="text-white/40 text-sm">No Logo</div>
                )}
              </div>
            </button>
          </div>
          <div className="p-3">
            <div className="text-sm font-semibold line-clamp-2 group-hover:text-white">{ch.name}</div>
            <div className="text-xs text-white/50 mt-1">{ch.group}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
