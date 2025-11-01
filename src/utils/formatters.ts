export function truncateAddress(addr?: string, size = 4) {
  if (!addr) return '';
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

export function formatDate(ts: bigint | number | string) {
  let ms: number;
  if (typeof ts === 'bigint') {
    // assume seconds if small, or ms if large
    const n = Number(ts);
    ms = n > 1e12 ? n : n * 1000;
  } else if (typeof ts === 'string') {
    const n = Number(ts);
    ms = n > 1e12 ? n : n * 1000;
  } else {
    ms = ts > 1e12 ? ts : ts * 1000;
  }
  const d = new Date(ms);
  return d.toLocaleString();
}
