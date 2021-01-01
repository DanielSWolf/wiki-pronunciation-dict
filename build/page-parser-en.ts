import * as languages from "@cospired/i18n-iso-languages";
import { Language } from "./language";
import { PageParser, findTemplates, parseWikitext, isHeading } from "./page-parser";
import {
  unexpectedTemplateArgumentCountError,
  pronunciationOutsideOfPronunciationSectionError,
  unsupportedLanguageCodeError,
} from "./parse-errors";

function strip(value: string, start: string, end: string) {
  return value.startsWith(start) && value.endsWith(end)
    ? value.substring(start.length, value.length - end.length)
    : value;
}

const ignoredLanguages = new Set<Language>([
  'sh', // deprecated, ambiguous
]);

// The English Wiktionary uses a large number of templates to denote pronunciation.
// See https://en.wiktionary.org/wiki/Category:Pronunciation_templates

export const parseEnglish: PageParser<'en'> = function*(page) {
  let inPronunciationSection = false;

  for (const line of parseWikitext(page)) {
    if (isHeading(line)) {
      inPronunciationSection = line.title === 'Pronunciation';
    } else {
      // About 14% of English pronunciations in the English Wiktionary use the enPR system instead
      // of IPA.
      // For details, see https://en.wiktionary.org/wiki/Appendix:English_pronunciation
      // We're skipping them because converting them to IPA (especially with correct stress marks)
      // is not trivial.

      const ipaTemplates = findTemplates('IPA', line.text);
      if (ipaTemplates.length > 0) {
        if (!inPronunciationSection) {
          yield pronunciationOutsideOfPronunciationSectionError(line);
        } else {
          for (const template of ipaTemplates) {
            if (template.length < 2) {
              yield unexpectedTemplateArgumentCountError(template, line)
            } else {
              const [language, ...pronunciations] = template;
              if (language.length !== 2) {
                // probably a dead language
              } else if (ignoredLanguages.has(language)) {
                // ignore
              } else if (!languages.isValid(language)) {
                yield unsupportedLanguageCodeError(language, line);
              } else {
                for (const pronunciation of pronunciations) {
                  const strippedPronunciation = strip(strip(pronunciation, '/', '/'), '[', ']');
                  // Some articles contain empty pronunciation placeholders
                  if (strippedPronunciation.length === 0) continue;

                  yield {
                    sourceEdition: 'en',
                    language: language,
                    word: page.name,
                    pronunciation: strippedPronunciation,
                  };
                }
              }
            }
          }
        }
      }
    }
  }
};
