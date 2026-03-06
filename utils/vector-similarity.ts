export function cosineSimilarity(
  left: Record<string, number> | undefined | null,
  right: Record<string, number> | undefined | null,
): number {
  const keys = new Set([...Object.keys(left || {}), ...Object.keys(right || {})]);
  let dot = 0;
  let leftMag = 0;
  let rightMag = 0;

  for (const key of keys) {
    const l = (left || {})[key] ?? 0;
    const r = (right || {})[key] ?? 0;
    dot += l * r;
    leftMag += l * l;
    rightMag += r * r;
  }

  if (!leftMag || !rightMag) return 0;
  return dot / (Math.sqrt(leftMag) * Math.sqrt(rightMag));
}
