export function pageTitleIsSingleWord(s: string) {
  // Exclude special pages such as templates
  if (s.includes(':')) return false;

  // Exclude pages containing spaces or dashes.
  // The latter also excludes suffix pages ("-ibus").
  if (s.includes(' ') || s.includes('-')) return false;

  return true;
}
