export function createSession(readCurrentToken, authenticate) {
  const cachedToken = readCurrentToken();
  return {
    enter({ resume }) {
      return authenticate(resume ? cachedToken : readCurrentToken());
    },
  };
}
