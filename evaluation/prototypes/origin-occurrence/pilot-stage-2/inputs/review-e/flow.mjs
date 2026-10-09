export function openAccount(createSession, { resume }) {
  let activeToken = 'previous-account-token';
  const session = createSession(
    () => activeToken,
    (token) => token === activeToken ? 200 : 401,
  );
  activeToken = 'current-account-token';
  return session.enter({ resume });
}
