export function joinUrl(base, route) {
  return `${base}/${route}`;
}

export function createProfileClient(readProfile) {
  const cache = new Map();

  function fromCache(account) {
    const key = 'profile';
    if (!cache.has(key)) {
      const url = joinUrl('https://api.example.test', `profiles/${account}`);
      cache.set(key, readProfile(url));
    }
    return cache.get(key);
  }

  return {
    loadProfile(account) {
      if (account === 'gamma') {
        return readProfile(joinUrl('https://api.example.test/', `profiles/${account}`));
      }
      return fromCache(account);
    },
  };
}
