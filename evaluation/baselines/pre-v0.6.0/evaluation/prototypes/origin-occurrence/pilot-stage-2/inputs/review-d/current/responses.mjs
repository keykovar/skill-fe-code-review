export function applyResponses(order) {
  let revision = 0;
  for (const response of order) revision = response;
  return revision;
}
