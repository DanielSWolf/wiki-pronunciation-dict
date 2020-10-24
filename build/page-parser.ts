import { Edition } from "./editions";
import { Language } from './language';
import { ParseError } from './parse-errors';

/** A function that knows how to extract pronunciation entries from a specific Wiktionary edition */
export type PageParser<TEdition extends Edition> = (page: Page<TEdition>) => Iterable<ParseResult>;

/** A word-pronunciation pair for a given language */
export interface WordPronunciation {
  sourceEdition: Edition;
  language: Language;
  word: string;
  pronunciation: string;
}

export type ParseResult = WordPronunciation | ParseError;

/** A Wiktionary page from a specific edition */
export interface Page<TEdition extends Edition> {
  edition: TEdition;
  name: string;
  text: string;
}

/** Information on a single source line from a Wiktionary page */
export interface Line {
  edition: Edition;
  pageName: string;

  /** The zero-based line index. Add 1 to get the line number. */
  index: number;

  /** The line text */
  text: string;
}

export function splitIntoLines<TEdition extends Edition>(page: Page<TEdition>): Line[] {
  const texts = page.text.split('\n');
  return texts.map((text, index) => ({
    edition: page.edition,
    pageName: page.name,
    index,
    text,
  }));
}

export function findTemplates(templateName: string, text: string): TemplateArgs[] {
  const regex = new RegExp(`\\{\\{${templateName}\\|(.*?)\\}\\}`, 'g');
  const matches = text.matchAll(regex);
  return [...matches].map(match => {
    const templateArgs = match[1]
      .split('|')
      .map(argument => argument.trim());
    return templateArgs;
  })
}

export function findLastTemplate(templateName: string, text: string): TemplateArgs | null {
  const templates = findTemplates(templateName, text);
  return templates.length > 0 ? templates[templates.length - 1] : null;
}

export type TemplateArgs = string[];
