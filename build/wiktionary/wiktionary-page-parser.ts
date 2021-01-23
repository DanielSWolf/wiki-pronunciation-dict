import { WiktionaryEdition } from './wiktionary-edition';
import { WiktionaryPage } from './wiktionary-dump-parser';

/** Information on a single source line from a Wiktionary page */
export interface WiktionaryLine {
  edition: WiktionaryEdition;
  pageTitle: string;

  /** The zero-based line index. Add 1 to get the line number. */
  index: number;

  /** The line text */
  text: string;
}

export interface Heading extends WiktionaryLine {
  level: number;
  title: string;
}

export function isHeading(line: Heading | WiktionaryLine): line is Heading {
  return 'level' in line;
}

export function* parseWiktionaryPage(
  page: WiktionaryPage,
): Iterable<Heading | WiktionaryLine> {
  for (const line of splitIntoLines(page)) {
    const isHeading = line.text.startsWith('=') && line.text.endsWith('=');
    yield isHeading ? getHeading(line) : line;
  }
}

function getHeading(line: WiktionaryLine): Heading {
  const maxLevel = Math.floor((line.text.length - 1) / 2);
  let level = 0;
  while (
    line.text[level] === '=' &&
    line.text[line.text.length - 1 - level] === '=' &&
    level + 1 < maxLevel
  ) {
    level++;
  }

  const title = line.text.substring(level, line.text.length - level).trim();

  return { ...line, level, title };
}

export function splitIntoLines(page: WiktionaryPage): WiktionaryLine[] {
  const texts = page.text.split('\n');
  return texts.map((text, index) => ({
    edition: page.edition,
    pageTitle: page.title,
    index,
    text,
  }));
}

export function findTemplates(
  templateName: string,
  text: string,
): TemplateArgs[] {
  const regex = new RegExp(`\\{\\{${templateName}\\|(.*?)\\}\\}`, 'g');
  const matches = text.matchAll(regex);
  return [...matches].map(match => {
    const templateArgs = match[1]
      .split('|')
      .map(argument => argument.trim())
      .filter(argument => !/^\w+=/.test(argument)); // Omit named arguments
    return templateArgs;
  });
}

export function findLastTemplate(
  templateName: string,
  text: string,
): TemplateArgs | null {
  const templates = findTemplates(templateName, text);
  return templates.length > 0 ? templates[templates.length - 1] : null;
}

export type TemplateArgs = string[];
