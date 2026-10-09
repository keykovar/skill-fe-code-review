export function createSession(readCurrentToken, authenticate) {
  return {
    enter() {
      return authenticate(readCurrentToken());
    },
  };
}
