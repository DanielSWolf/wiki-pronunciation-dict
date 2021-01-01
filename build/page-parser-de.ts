import { getAlpha2Code } from '@cospired/i18n-iso-languages';
import { Language } from "./language";
import { PageParser, findTemplates, parseWikitext, isHeading } from "./page-parser";
import {
  unexpectedLanguageLineFormatError,
  mismatchingRedundantWordInfoError,
  pronunciationOutsideOfLanguageSectionError,
  unexpectedPronunciationLineFormatError,
  unexpectedTemplateArgumentCountError,
  unsupportedLanguageNameError,
  pronunciationOutsideOfPronunciationSectionError,
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
  const Invalid = Symbol();

  let language: Language | null | typeof Invalid = null;
  let inPronunciationBlock = false;

  for (const line of parseWikitext(page)) {
    if (isHeading(line)) {
      // heading

      inPronunciationBlock = false;

      if (line.level === 2) {
        // expecting word (redundantly) and language

        language = Invalid;

        const regex = /^(.+)\(\{\{Sprache\|([^}]+)\}\}\)$/;
        const match = line.title.match(regex);
        if (!match) {
          yield unexpectedLanguageLineFormatError(line);
        } else {
          const redundantWord = match[1].trim();
          if (redundantWord !== page.name) {
            yield mismatchingRedundantWordInfoError(line);
          } else {
            const languageName = match[2].trim();
            if (!ignoredLanguageNames.has(languageName.toLowerCase())) {
              const newLanguage = parseGermanLanguageName(languageName);
              if (newLanguage === null) {
                yield unsupportedLanguageNameError(languageName, line);
              } else {
                language = newLanguage;
              }
            }
          }
        }
      }
    } else {
      // content line

      if (line.text === '{{Aussprache}}') {
        inPronunciationBlock = true;
      } else if (!line.text.startsWith(':')) {
        inPronunciationBlock = false;
      }

      // Parse pronunciation information
      if (line.text.includes('{{Lautschrift')) {
        if (!inPronunciationBlock) {
          yield pronunciationOutsideOfPronunciationSectionError(line);
        } else if (language === null) {
          yield pronunciationOutsideOfLanguageSectionError(line);
        } else if (language === Invalid) {
          // No need to yield another error
        } else if (!line.text.startsWith(':{{IPA}}')) {
          yield unexpectedPronunciationLineFormatError(line);
        } else {
          // Stop parsing the line once pronunciations get prefixed with qualifiers such as "plural"
          const unqualifiedText = line.text.match(/:\{\{IPA\}\}\s*(\{\{Lautschrift\|.*?\}\},?\s*)*/)?.[0] ?? '';
          const pronunciationTemplates = findTemplates('Lautschrift', unqualifiedText);

          for (const template of pronunciationTemplates) {
            if (template.length !== 1) {
              yield unexpectedTemplateArgumentCountError(template, line)
            } else {
              const pronunciation = template[0];
              if (pronunciation.length > 0) {
                // Some articles contain empty pronunciation placeholders
                yield { sourceEdition: 'de', language: language, word: page.name, pronunciation };
              }
            }
          }
        }
      }
    }
  }
};
