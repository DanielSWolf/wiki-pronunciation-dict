/**
 * Returns a decomposed version of the specified IPA string that guarantees that IPA letters and
 * their diacritics and suprasegmentals are represented as separate Unicode code points.
 */
export function decomposeIpaString(s: string): string {
  let result = s;

  // Perform canonical decomposition. This cleanly separates most diacritics and suprasegmentals
  // from the letters.
  result = s.normalize('NFD');

  // Re-compose the c cedilla letter. This is the only IPA letter that is affected by canonical
  // decomposition.
  result = result.replaceAll('c\u0327', 'ç');

  // Manually perform some IPA-specific decomposition
  result = result.replaceAll('ɚ', 'ə\u02DE');
  result = result.replaceAll('ɝ', 'ɜ\u02DE');
  result = result.replaceAll('ɫ', 'l\u0334');

  return result;
}
