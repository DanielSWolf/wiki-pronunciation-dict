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
    const trimmedText = line.text.trim();
    const isHeading = trimmedText.startsWith('=') && trimmedText.endsWith('=');
    yield isHeading ? getHeading(line) : line;
  }
}

function getHeading(line: WiktionaryLine): Heading {
  const maxLevel = Math.floor((line.text.length - 1) / 2);
  const trimmedText = line.text.trim();
  let level = 0;
  while (
    trimmedText[level] === '=' &&
    trimmedText[trimmedText.length - 1 - level] === '=' &&
    level + 1 < maxLevel
  ) {
    level++;
  }

  const title = trimmedText.substring(level, trimmedText.length - level).trim();

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

export function findTemplates<TArgumentName extends string>(
  templateName: string,
  argumentNames: TArgumentName[],
  text: string,
): Array<Partial<Record<TArgumentName, string>>> {
  const regex = new RegExp(`\\{\\{${templateName}\\|(.*?)\\}\\}`, 'g');
  const matches = text.matchAll(regex);
  return [...matches].map(match => {
    const template = {} as Partial<Record<TArgumentName, string>>;
    match[1]
      .split('|')
      .map(argument => argument.trim())
      .forEach((argument, index) => {
        const argumentParts = argument.split('=');
        if (argumentParts.length === 1) {
          // Positional argument
          const key = argumentNames[index] ?? index;
          template[key] = argument;
        } else {
          // Named argument
          const [key, value] = argument;
          template[key as TArgumentName] = value;
        }
      });
    return template;
  });
}

export function findLastTemplate<TArgumentName extends string>(
  templateName: string,
  argumentNames: TArgumentName[],
  text: string,
): Partial<Record<TArgumentName, string>> | null {
  const templates = findTemplates(templateName, argumentNames, text);
  return templates.length > 0 ? templates[templates.length - 1] : null;
}
