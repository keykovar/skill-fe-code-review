import { requestConfig } from './request-config.ts';

export function buildUrl(_baseUrl: string, path: string): string {
  return `${requestConfig.apiBaseUrl}/${path}`;
}
