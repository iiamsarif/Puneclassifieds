const CACHE_TTL_MS = 60 * 1000;
const memoryCache = new Map();

const cacheKey = (apiBase) => `pc_web_settings_${apiBase || ""}`;

const readLocal = (apiBase) => {
  try {
    const raw = localStorage.getItem(cacheKey(apiBase));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeLocal = (apiBase, data) => {
  const payload = { ts: Date.now(), data };
  memoryCache.set(apiBase, payload);
  try {
    localStorage.setItem(cacheKey(apiBase), JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
};

const isFresh = (payload) => {
  if (!payload || !payload.ts) return false;
  return Date.now() - payload.ts < CACHE_TTL_MS;
};

export const getWebSettings = async (apiBase, options = {}) => {
  const force = !!options.force;

  if (!force) {
    const mem = memoryCache.get(apiBase);
    if (isFresh(mem)) return mem.data;

    const local = readLocal(apiBase);
    if (isFresh(local)) {
      memoryCache.set(apiBase, local);
      return local.data;
    }
  }

  const res = await fetch(`${apiBase}/api/settings/web`);
  const data = await res.json();
  writeLocal(apiBase, data);
  return data;
};

export const invalidateWebSettingsCache = (apiBase) => {
  memoryCache.delete(apiBase);
  try {
    localStorage.removeItem(cacheKey(apiBase));
  } catch {
    // ignore storage errors
  }
};

