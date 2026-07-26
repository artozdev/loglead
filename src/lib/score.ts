// Deterministic per-content score /100 (stand-in until real scoring exists).
// Shared by the dashboard and the calendar so a given content always shows the
// same score everywhere.
export function contentScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 62 + (h % 37); // 62..98
}
