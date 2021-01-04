export function pageTitleIsSingleWord(s: string) {
  // Exclude special pages such as templates
  if (s.includes(':')) return false;

  // Exclude pages containing spaces
  if (s.includes(' ')) return false;

  // Exclude suffix pages
  if (s.startsWith('-')) return false;

  return true;
}
