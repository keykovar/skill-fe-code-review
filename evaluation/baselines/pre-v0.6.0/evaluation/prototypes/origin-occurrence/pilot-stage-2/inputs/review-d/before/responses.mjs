export function applyResponses(order) {
  let revision = 0;
  for (const response of order) revision = Math.max(revision, response);
  return revision;
}
