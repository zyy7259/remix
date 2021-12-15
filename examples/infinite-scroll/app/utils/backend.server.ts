const items = (global.__items =
  global.__items ??
  Array.from({ length: 50_000 }, (_, i) => ({
    id: i.toString(),
    value: `Item ${i}`
  })));

export async function getItems({
  start,
  limit
}: {
  start: number;
  limit: number;
}) {
  return items.slice(start, start + limit);
}

export async function countItems() {
  return items.length;
}
