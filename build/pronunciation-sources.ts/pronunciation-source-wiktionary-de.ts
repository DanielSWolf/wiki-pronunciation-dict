import { getAlpha2Code } from '@cospired/i18n-iso-languages';
import { Language } from "../language";
import { findTemplates, parseWiktionaryPage, isHeading } from "../wiktionary/wiktionary-page-parser";
import {
  unexpectedLanguageLineFormatError,
  mismatchingRedundantWordInfoError,
  pronunciationOutsideOfLanguageSectionError,
  unexpectedPronunciationLineFormatError,
  unexpectedTemplateArgumentCountError,
  unsupportedLanguageNameError,
  pronunciationOutsideOfPronunciationSectionError,
} from "./pronunciation-retrieval-errors";
import { WiktionaryEdition } from "../wiktionary/wiktionary-edition";
import { PronunciationResultCallback, PronunciationSource } from "./pronunciation-source";
import { parseWiktionaryDump, WiktionaryPage } from '../wiktionary/wiktionary-dump-parser';
import { pageTitleIsSingleWord } from '../wiktionary/page-title-is-single-word';

const languageAliases = new Map<string, Language>([
  ['Thai', 'th'],               // alias for 'Thailändisch'
  ['Neugriechisch', 'el'],      // alias for 'Griechisch'
  ['Pandschabi', 'pa'],         // alias for 'Panjabi'
  ['Scots', 'en'],              // variety of English
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
    ?? languageAliases.get(languageName.toLowerCase())
    ?? null;
}

function getPronunciationsFromPage(page: WiktionaryPage, onPronunciationResult: PronunciationResultCallback): void {
  if (!pageTitleIsSingleWord(page.title)) return;

  const Invalid = Symbol();

  let language: Language | null | typeof Invalid = null;
  let inPronunciationBlock = false;

  for (const line of parseWiktionaryPage(page)) {
    if (isHeading(line)) {
      // heading

      inPronunciationBlock = false;

      if (line.level === 2) {
        // expecting word (redundantly) and language

        language = Invalid;

        const regex = /^(.+)\(\{\{Sprache\|([^}]+)\}\}\)$/;
        const match = line.title.match(regex);
        if (!match) {
          onPronunciationResult(unexpectedLanguageLineFormatError(line));
        } else {
          const redundantWord = match[1].trim();
          if (redundantWord !== page.title) {
            onPronunciationResult(mismatchingRedundantWordInfoError(line));
          } else {
            const languageName = match[2].trim();
            if (!ignoredLanguageNames.has(languageName.toLowerCase())) {
              const newLanguage = parseGermanLanguageName(languageName);
              if (newLanguage === null) {
                onPronunciationResult(unsupportedLanguageNameError(languageName, line));
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
          onPronunciationResult(pronunciationOutsideOfPronunciationSectionError(line));
        } else if (language === null) {
          onPronunciationResult(pronunciationOutsideOfLanguageSectionError(line));
        } else if (language === Invalid) {
          // No need to yield another error
        } else if (!line.text.startsWith(':{{IPA}}')) {
          onPronunciationResult(unexpectedPronunciationLineFormatError(line));
        } else {
          // Stop parsing the line once pronunciations get prefixed with qualifiers such as "plural"
          const unqualifiedText = line.text.match(/:\{\{IPA\}\}\s*(\{\{Lautschrift\|.*?\}\},?\s*)*/)?.[0] ?? '';
          const pronunciationTemplates = findTemplates('Lautschrift', unqualifiedText);

          for (const template of pronunciationTemplates) {
            if (template.length !== 1) {
              onPronunciationResult(unexpectedTemplateArgumentCountError(template, line));
            } else {
              const pronunciation = template[0];
              if (pronunciation.length > 0) {
                // Some articles contain empty pronunciation placeholders
                onPronunciationResult({ sourceEdition: page.edition, language: language, word: page.title, pronunciation });
              }
            }
          }
        }
      }
    }
  }
}

export const pronunciationSourceWiktionaryDe: PronunciationSource = {
  name: 'German Wiktionary edition',
  getPronunciations: onPronunciationResult => parseWiktionaryDump(
    WiktionaryEdition.German,
    page => getPronunciationsFromPage(page, onPronunciationResult),
  ),
}
