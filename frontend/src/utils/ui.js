export function pretty(data) {
  return JSON.stringify(data, null, 2);
}

export function toNumberOrNull(value) {
  if (value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}
