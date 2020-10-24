import { getAlpha2Code } from '@cospired/i18n-iso-languages';
import { Language } from "./language";
import { PageParser, splitIntoLines, findTemplates, findLastTemplate } from "./page-parser";
import {
  missingLanguageBeforePronunciationError,
  unexpectedPronunciationLineFormatError,
  unexpectedTemplateArgumentCountError,
  unsupportedLanguageNameError,
} from "./parse-errors";

const backupLanguages = new Map<string, Language>([
  // Workaround for https://github.com/cospired/i18n-iso-languages/issues/30
  ['Aserbaidschanisch', 'az'],
  ['Haitianisch', 'ht'],
  ['Ido', 'io'],
  ['Indonesisch', 'id'],
  ['Irisch', 'ga'],
  ['Maori', 'mi'],
  ['Mazedonisch', 'mk'],
  ['Nauruisch', 'na'],
  ['Panjabi', 'pa'],
  ['Schottisch-gälisch', 'gd'],
  ['Sesotho', 'st'],
  ['Thai', 'th'],
  ['Walisisch', 'cy'],

  // Aliases
  ['Neugriechisch', 'el'],      // alias for 'Griechisch'
  ['Pandschabi', 'pa'],         // alias for 'Panjabi'
  ['Scots', 'en'],              // variaty of English
  ['Suaheli', 'sw'],            // alias for 'Swahili'
  ['Westfriesisch', 'fy'],      // alias for 'Friesisch'
].map(([name, language]) => [name.toLowerCase(), language]));

const ignoredLanguageNames = new Set<string>([
  'akkadisch',                      // dead
  'altenglisch',                    // dead
  'altgriechisch',                  // dead
  'asturisch',                      // no ISO 639-1 code
  'balinesisch',                    // no ISO 639-1 code
  'faliskisch',                     // dead
  'friaulisch',                     // no ISO 639-1 code
  'frühneuhochdeutsch',             // dead
  'gotisch',                        // dead
  'hawaiianisch',                   // no ISO 639-1 code
  'huastekisches zentral-nahuatl',  // no ISO 639-1 code
  'international',                  // not a language
  'klassisches nahuatl',            // dead
  'krimtatarisch',                  // no ISO 639-1 code
  'lettgallisch',                   // dead
  'mittelhochdeutsch',              // dead
  'niederdeutsch',                  // no ISO 639-1 code
  'niedersorbisch',                 // no ISO 639-1 code
  'obersorbisch',                   // no ISO 639-1 code
  'papiamentu',                     // no ISO 639-1 code
  'prußisch',                       // no ISO 639-1 code
  'sumerisch',                      // dead
  'südpikenisch',                   // dead
  'umschrift',                      // not a language
  'venezianisch',                   // no ISO 639-1 code
  'zentral-nahuatl',                // no ISO 639-1 code
]);

function parseGermanLanguageName(languageName: string): Language | null {
  return getAlpha2Code(languageName, 'de')
    ?? backupLanguages.get(languageName.toLowerCase())
    ?? null;
}

export const parseGerman: PageParser<'de'> = function*(page) {
  const UninitializedLanguage = Symbol();
  const UnknownLanguage = Symbol();

  let language: Language | typeof UninitializedLanguage | typeof UnknownLanguage = UninitializedLanguage;

  for (const line of splitIntoLines(page)) {
    // Parse language information
    const languageTemplate = findLastTemplate('Sprache', line.text);
    if (languageTemplate) {
      if (languageTemplate.length !== 1) {
        yield unexpectedTemplateArgumentCountError(languageTemplate, line);
        language = UnknownLanguage;
      } else {
        const languageName = languageTemplate[0];
        if (ignoredLanguageNames.has(languageName.toLowerCase())) {
          language = UnknownLanguage;
        } else {
          language = parseGermanLanguageName(languageName) ?? UnknownLanguage;
          if (language === UnknownLanguage) {
            yield unsupportedLanguageNameError(languageName, line);
          }
        }
      }
    }

    // Parse pronunciation information
    const pronunciationTemplates = findTemplates('Lautschrift', line.text);
    if (pronunciationTemplates.length > 0) {
      // Check that line adheres to expected format
      const regex = /^:\{\{IPA\}\} \{\{Lautschrift|[^}]+\}\}(, \{\{Lautschrift|[^}]+\}\})*$/;
      if (!regex.test(line.text)) {
        yield unexpectedPronunciationLineFormatError(line);
      } else {
        if (language === UninitializedLanguage) {
          yield missingLanguageBeforePronunciationError(line);
        } else if (language === UnknownLanguage) {
          // No need to yield a second error
        } else {
          for (const template of pronunciationTemplates) {
            if (template.length !== 1) {
              yield unexpectedTemplateArgumentCountError(template, line)
            } else {
              const pronunciation = template[0];
              if (pronunciation.length > 0) {
                // Some articles contain empty pronunciation placeholders
                yield { sourceEdition: 'de', language: language, word: page.name, pronunciation: pronunciation };
              }
            }
          }
        }
      }
    }
  }
};
