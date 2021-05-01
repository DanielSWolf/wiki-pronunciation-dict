import { Language } from '../language';
import {
  findTemplates,
  parseWiktionaryPage,
  isHeading,
} from '../wiktionary/wiktionary-page-parser';
import { WiktionaryEdition } from '../wiktionary/wiktionary-edition';
import { PronunciationSource, WordPronunciation } from './pronunciation-source';
import {
  parseWiktionaryDump,
  WiktionaryPage,
} from '../wiktionary/wiktionary-dump-parser';
import { log } from '../issue-logging';
import {
  PronunciationOutsideOfLanguageSectionIssue,
  MissingTemplateArgumentIssue,
} from './pronunciation-retrieval-issues';

async function* getPronunciationsFromPage(
  page: WiktionaryPage,
): AsyncIterable<WordPronunciation> {
  if (page.isSpecial) return;

  let language: Language | null = null;

  for (const line of parseWiktionaryPage(page)) {
    if (isHeading(line)) {
      if (line.level === 2) {
        // Try to find language
        const regex = /\{\{-(\w+)-\}\}/;
        const match = line.title.match(regex);
        language = match?.[1] ?? null;
      }
    } else {
      // content line

      // Parse pronunciation information
      if (line.text.includes('{{IPA|')) {
        if (language === null) {
          log(new PronunciationOutsideOfLanguageSectionIssue(line));
        } else {
          const pronunciationTemplates = findTemplates(
            'IPA',
            ['pronunciation'],
            line.text,
          );

          for (const template of pronunciationTemplates) {
            const { pronunciation } = template;
            if (pronunciation === undefined) {
              log(
                new MissingTemplateArgumentIssue(
                  template,
                  'pronunciation',
                  line,
                ),
              );
              continue;
            }

            if (pronunciation.length === 0) {
              // Some articles contain empty pronunciation placeholders
              continue;
            }

            yield {
              sourceEdition: page.edition,
              language,
              word: page.title,
              pronunciation,
            };
          }
        }
      }
    }
  }
}

export const pronunciationSourceWiktionaryIt: PronunciationSource = {
  edition: WiktionaryEdition.Italian,
  getPronunciations: async function* () {
    for await (const page of parseWiktionaryDump(WiktionaryEdition.Italian)) {
      yield* getPronunciationsFromPage(page);
    }
  },
};
