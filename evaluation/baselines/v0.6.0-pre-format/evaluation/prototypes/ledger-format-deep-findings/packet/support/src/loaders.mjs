export function createLoaders(fetcher, options) {
  return {
    loadProfile: () => fetcher('/profile', options.requestOptions(1500)),
    loadActivity: () => fetcher('/activity', options.requestOptions(8000)),
    listInbox: () => fetcher('/inbox', options.pageOptions(20)),
  };
}
