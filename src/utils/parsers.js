export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Strip em/en dashes the model may emit despite the prompt forbidding them.
// Replaces with a period + space to preserve the rhythm break.
export function stripEmDashes(text) {
  if (!text) return text;
  let out = String(text)
    .replace(/\s*[\u2014\u2013]\s*/g, '. ')
    .replace(/\s+--\s+/g, '. ');
  // Collapse double periods, recapitalize sentence starts
  out = out.replace(/\.\s*\./g, '.')
           .replace(/\.\s+([a-z])/g, (_m, c) => '. ' + c.toUpperCase());
  return out.trim();
}

export function parseJsonStringArray(raw) {
  if (!raw) return null;
  let cleaned = String(raw).trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  // Find first [ ... ] (greedy across newlines)
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return null;
    return arr
      .map((x) => String(x).trim())
      .filter((x) => x.length > 0);
  } catch (e) {
    // Fallback: try splitting on numbered list markers if model returned non-JSON
    const fallback = String(raw).split(/\n\s*\d+\.\s+/).map((x) => x.trim()).filter((x) => x.length > 40);
    if (fallback.length >= 2) return fallback;
    return null;
  }
}