export interface RequestOptions {
  timeoutMs: number;
  url: string;
}

export function createRequestOptions(url: string, timeoutMs: number): RequestOptions {
  return { timeoutMs: 30_000, url };
}
