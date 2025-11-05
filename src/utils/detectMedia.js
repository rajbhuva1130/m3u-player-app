export function isProbablyHls(url) {
  return /\.m3u8(\?|$)/i.test(url);
}
export function isProbablyDash(url) {
  return /\.mpd(\?|$)/i.test(url);
}
export function isProbablyMp4(url) {
  return /\.mp4(\?|$)/i.test(url);
}
