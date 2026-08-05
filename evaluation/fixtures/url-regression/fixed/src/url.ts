import { requestConfig } from './request-config.ts';

export function buildUrl(baseUrl: string | undefined, path: string): string {
  const resolvedBaseUrl = baseUrl ?? requestConfig.apiBaseUrl;
  return `${resolvedBaseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
