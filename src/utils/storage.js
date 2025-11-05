const KEY = "iptv_favorites_v1";
export const loadFavorites = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
export const saveFavorites = (list) => localStorage.setItem(KEY, JSON.stringify(list));
export const toggleFavorite = (favs, ch) => {
  const exists = favs.find(f => f.url === ch.url);
  return exists ? favs.filter(f => f.url !== ch.url) : [...favs, ch];
};
