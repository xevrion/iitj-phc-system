const store = new Map();

export const cache = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  set(key, value, ttlMs) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  },

  async getOrSet(key, ttlMs, loadValue) {
    const cachedValue = this.get(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const value = await loadValue();
    return this.set(key, value, ttlMs);
  },

  del(key) {
    store.delete(key);
  },

  delPrefix(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};
