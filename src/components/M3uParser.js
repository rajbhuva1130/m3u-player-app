export function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF')) {
      // #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="News",Channel Name
      const meta = line;
      const nameMatch = meta.split(',').pop()?.trim();
      const logoMatch = /tvg-logo="([^"]+)"/.exec(meta)?.[1] || '';
      const groupMatch = /group-title="([^"]+)"/.exec(meta)?.[1] || 'Other';
      const idMatch = /tvg-id="([^"]+)"/.exec(meta)?.[1] || '';

      const uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      current = { id: idMatch || uid, name: nameMatch || 'Unknown', logo: logoMatch, group: groupMatch, url: '' };
    } else if (current && !line.startsWith('#')) {
      current.url = line;
      if (/^https?:\/\//i.test(current.url) || /\.m3u8($|\?)/i.test(current.url)) {
        channels.push(current);
      }
      current = null;
    }
  }

  return channels;
}
