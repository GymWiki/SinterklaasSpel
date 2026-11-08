export const GENERAL_TARGET = 'Algemeen / De hele groep';
export const MAX_PLAYERS = 16;
export const MAX_CONTENT = 400;
export const MIN_CONTENT_CHARS = 15;
export const MIN_CONTENT_WORDS = 3;

export function countWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
export function contentOk(typed: string) {
  const t = typed.trim();
  return t.length >= MIN_CONTENT_CHARS && countWords(t) >= MIN_CONTENT_WORDS;
}
/** Plakt aanloopzin en eigen tekst aan elkaar tot één zin voor het Grote Boek. */
export function composeContent(lead: string, typed: string) {
  let t = typed.trim();
  if (!/[.!?…"”)]$/.test(t)) t += '.';
  return lead ? `${lead.trim()} ${t}` : t;
}
