import { emptyDirSync, writeFileSync } from 'fs-extra';
import { join as joinPaths } from 'path';
import { orderBy } from 'lodash';
import pretty from 'pretty';
import inspect from 'object-inspect';
import { stripIndents, safeHtml } from 'common-tags';
import { Edition, editionToString } from "./editions";
import { Language } from "./language";
import { isParseError, ParseResult } from "./page-parser";
import { ParseError } from "./parse-errors";
import { DefaultMap } from "./utils";

interface EditionRecord {
  rawPronunciationCounts: DefaultMap<Language, number>;
  errorGroups: DefaultMap<string, ParseError[]>;
}

export function createStats(parseResults: ParseResult[]) {
  const stats = new DefaultMap<Edition, EditionRecord>(() => ({
    rawPronunciationCounts: new DefaultMap<Language, number>(() => 0),
    errorGroups: new DefaultMap<string, ParseError[]>(() => []),
  }));

  for (const result of parseResults) {
    if (isParseError(result)) {
      // Result is error
      stats.get(result.line.edition).errorGroups.get(result.code).push(result);
    } else {
      // Result is word pronunciation
      const rawPronunciationCounts = stats.get(result.sourceEdition).rawPronunciationCounts;
      rawPronunciationCounts.set(result.language, rawPronunciationCounts.get(result.language) + 1);
    }
  }

  const statsDir = 'stats';
  emptyDirSync(statsDir);

  for (const [edition, { rawPronunciationCounts, errorGroups }] of stats) {
    const rawPronunciations = stripIndents`
      <table class="table table-bordered" style="width: auto !important;">
        <tr>
          <th>Language</th>
          <th class="text-right">Raw pronunciations</th>
        </tr>
        ${
          orderBy([...rawPronunciationCounts], ([_, count]) => count, 'desc')
            .slice(0, 10)
            .map(([language, count]) => stripIndents`
              <tr>
                <td>${language}</td>
                <td class="text-right">${count.toLocaleString('en-US')}</td>
              </tr>
            `)
            .join('\n')
        }
        <tr>
          <td colspan="2">...</td>
        </tr>
      </table>
    `;

    const sortedErrorGroups = orderBy([...errorGroups], ([_, instances]) => instances.length, 'desc');
    const errorOverview = stripIndents`
      <table class="table table-bordered" style="width: auto !important;">
        <tr>
          <th>Error code</th>
          <th class="text-right">Number of occurrences</th>
        </tr>
        ${
          sortedErrorGroups
            .map(([code, instances]) => stripIndents`
              <tr>
                <td><a href="#${code}">${code}</a></td>
                <td>${instances.length.toLocaleString('en-US')}</td>
              </tr>
            `)
            .join('\n')
        }
      </table>
    `;

    const errorDetails = sortedErrorGroups
      .map(([code, errors]) => {
        return stripIndents`
          <h3 id="${code}">Error ${code} (${errors.length} x)</h3>

          <table class="table table-bordered" style="overflow-wrap: break-word;">
            <tr>
              <th>Data</th>
              <th>Word</th>
              <th>Line</th>
              <th>MediaWiki code</th>
            </tr>
            ${
              orderBy(errors, [error => inspect(error.data), error => error.line.pageName, error => error.line.index])
                .map(error => safeHtml`
                  <tr>
                    <td><p class="text-monospace">${error.data !== undefined ? inspect(error.data) : ''}</p></td>
                    <td><a href="https://${error.line.edition}.wiktionary.org/wiki/${error.line.pageName}">${error.line.pageName}</a></td>
                    <td>${error.line.index + 1}</td>
                    <td><p class="text-monospace">${error.line.text}</p></td>
                  </tr>
                `)
                .join('\n')
            }
          </table>
        `;
      })
      .join('\n\n');

    const title = `Statistics for ${editionToString(edition)}`;

    writeFileSync(joinPaths(statsDir, `${edition}-wiktionary.html`), pretty(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${title}</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
        </head>
        <body>
          <h1>${title}</h1>

          <h2>Raw pronunciations</h2>

          ${rawPronunciations}

          <h2>Errors</h2>

          ${errorOverview}

          ${errorDetails}
        </body>
      </html>
    `));
  }
}
