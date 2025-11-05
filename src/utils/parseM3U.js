export function parseM3U(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("#EXTINF")) {
      const title = (l.split(",")[1] || "Untitled").trim();
      const url = lines[i + 1] || "";
      if (url && !url.startsWith("#")) {
        out.push({ id: `${title}-${i}`, title, url, meta: l });
      }
    }
  }
  return out;
}

export const isM3U8 = (u) => /\.m3u8(\?|$)/i.test(u);
export const isTS = (u) => /\.ts(\?|$)/i.test(u);
