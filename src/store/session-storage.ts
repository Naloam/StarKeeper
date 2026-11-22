// Preserve active sessions on upgrade while removing the old persistent credential copy.
export function moveToSessionStorage(key: string, beforeMove?: (value: string) => void) {
  try {
    const previous = localStorage.getItem(key);
    if (previous) {
      beforeMove?.(previous);
      if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, previous);
      localStorage.removeItem(key);
    }
  } catch {
    // If browser storage is unavailable, the in-memory store can still be used.
  }
}
