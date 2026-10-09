export default async function* report(events) {
  for await (const event of events) {
    yield `${JSON.stringify(event, (_key, value) => value instanceof Error
      ? Object.fromEntries(Object.getOwnPropertyNames(value).map((key) => [key, value[key]]))
      : value)}\n`;
  }
}
