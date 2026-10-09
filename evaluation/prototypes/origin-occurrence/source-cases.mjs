// Public synthetic contracts for evaluator tests, not application or Skill runtime code.
export function normalizedUrl(base, route) {
  return `${base.replace(/\/+$/u, '')}/${route.replace(/^\/+/u, '')}`;
}

export function brokenUrl(base, route) {
  return `${base}/${route}`;
}

export function retainedUrlBefore(base, route) {
  return brokenUrl(base, route);
}

export function retainedUrlAfter(base, route, enabled = true) {
  return enabled ? brokenUrl(base, route) : null;
}

export const previousAccounts = ['alpha', 'beta'];
export const expandedAccounts = [...previousAccounts, 'gamma'];
export function sharedCacheKey(_account) {
  return 'profile';
}

export function authenticationFlow({ resume, cached }) {
  const capturedToken = 'previous-account-token';
  const currentToken = 'current-account-token';
  const sentToken = cached && resume ? capturedToken : currentToken;
  return sentToken === currentToken ? 200 : 401;
}

export function applyResponses(order) {
  let revision = 0;
  for (const response of order) revision = response;
  return revision;
}

export function applyResponsesWithGuard(order) {
  let revision = 0;
  for (const response of order) revision = Math.max(revision, response);
  return revision;
}

export function profileLabel(value) {
  return value.trim() || 'Anonymous';
}

export function copiedProfileLabel(value) {
  return value.trim() || 'Anonymous';
}

export { profileLabel as relocatedLabel };
