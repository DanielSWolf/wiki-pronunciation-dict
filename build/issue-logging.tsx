import { emptyDirSync, writeFileSync } from 'fs-extra';
import React, { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { join as joinPaths } from 'path';
import camelCase from 'camelcase';
import { issueLogDir } from './directories';
import { DefaultMap } from './utils/default-map';
import { createGroupedMap } from './utils/create-grouped-map';
import { orderBy, zip } from 'lodash';
import { executeWithoutConsole } from './utils/execute-without-console';

/**
 * A non-fatal error that occurs during processing and needs to be logged
 */
export interface Issue {
  /**
   * A message common to all issues of this type.
   * Issues are grouped by this message, so it shouldn't contain any instance-specific data.
   */
  readonly message: string;

  readonly severity: IssueSeverity;

  /** The file name of this log file, without path or extension */
  readonly logFileName: string;

  /** Data to be logged */
  readonly cells: Cell[];
}

export interface Cell {
  /** The column title */
  readonly title: string;

  /** The cell value */
  readonly value: ReactNode;

  /**
   * To order issues of the same type within a table, they are sorted in ascending order by their
   * cell values, starting with the first.
   * To compare cells by different values, an array of zero or more comparison values can be
   * specified here.
   */
  readonly comparisonValues?: unknown[];
}

/** The severity of an issue */
export enum IssueSeverity {
  /**
   * This issue is expected to occur frequently during processing.
   * It needs to be logged, but manual action is only required if the issue occurs too often.
   */
  Normal = 0,

  /**
   * This issue shouldn't occur during regular processing.
   * It isn't a fatal eror but should be checked manually.
   */
  High = 1,
}

const issuesByLogFile = new DefaultMap<string, Issue[]>(() => []);

export function log(issue: Issue) {
  issuesByLogFile.get(issue.logFileName).push(issue);
}

export async function createIssueLogFiles(): Promise<void> {
  const issueCount = [...issuesByLogFile.values()]
    .map(list => list.length)
    .reduce((a, b) => a + b, 0);
  console.log(`${issueCount} total issues.`);

  const problematicLogFileNames = [...issuesByLogFile.keys()].filter(logFile =>
    issuesByLogFile
      .get(logFile)!
      .some(issue => issue.severity === IssueSeverity.High),
  );
  for (const logFileName of problematicLogFileNames) {
    console.error(`  => Severe issues in file ${logFileName}.`);
  }

  emptyDirSync(issueLogDir);
  await Promise.all(
    [...issuesByLogFile].map(([logFile, issues]) =>
      createIssueLogFile(logFile, issues),
    ),
  );
}

async function createIssueLogFile(logFileName: string, issues: Issue[]) {
  const filePath = joinPaths(issueLogDir, `${logFileName}.html`);

  // Suppress React warnings regarding missing keys on list elements
  const element = executeWithoutConsole(() => (
    <html lang="en">
      <head>
        <title>Issues regarding {logFileName}</title>
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <h1>
          Issues regarding <code>{logFileName}</code>
        </h1>
        {renderIssues(issues)}
      </body>
    </html>
  ));
  const html = `<!DOCTYPE html>${renderToStaticMarkup(element)}`;

  writeFileSync(filePath, html);
}

function renderIssues(issues: Issue[]): ReactNode {
  const issuesByMessage = createGroupedMap(issues, issue => issue.message);
  const sortedMessages = orderBy(
    [...issuesByMessage],
    [
      ([message, issues]) => issues[0].severity,
      ([message, issues]) => issues.length,
    ],
    ['desc', 'desc'],
  ).map(([message]) => message);
  return (
    <>
      <table
        className="table table-bordered"
        style={{ width: 'auto !important' }}
      >
        <tr>
          <th>Issue type</th>
          <th className="text-right">Number of occurrences</th>
        </tr>
        {sortedMessages.map(message => (
          <tr>
            <td>
              <a href={`#${camelCase(message)}`}>{message}</a>
            </td>
            <td>{issuesByMessage.get(message)!.length}</td>
          </tr>
        ))}
      </table>

      {sortedMessages.map(message => (
        <>
          <h3 id={camelCase(message)}>
            {message} ({issuesByMessage.get(message)!.length} issues)
          </h3>
          {renderIssueTable(issuesByMessage.get(message)!)}
        </>
      ))}
    </>
  );
}

function renderIssueTable(issues: Issue[]): ReactNode {
  const sortedIssues = [...issues].sort(compareIssues);
  return (
    <table
      className="table table-bordered"
      style={{ tableLayout: 'fixed', overflowWrap: 'break-word' }}
    >
      <tr>
        {sortedIssues[0].cells.map(cell => (
          <th>{cell.title}</th>
        ))}
      </tr>
      {sortedIssues.map(issue => (
        <tr>
          {issue.cells.map(cell => (
            <td>{cell.value}</td>
          ))}
        </tr>
      ))}
    </table>
  );
}

function compareIssues(a: Issue, b: Issue): number {
  for (const [cell1, cell2] of zip(a.cells, b.cells)) {
    const comparisonResult = compareCells(cell1!, cell2!);
    if (comparisonResult !== 0) return comparisonResult;
  }
  return 0;
}

function compareCells(cell1: Cell, cell2: Cell): number {
  if (cell1.comparisonValues && cell2.comparisonValues) {
    for (const [a, b] of zip(cell1.comparisonValues, cell2.comparisonValues)) {
      const comparisonResult = compareValues(a, b);
      if (comparisonResult !== 0) return comparisonResult;
    }
    return 0;
  } else {
    return compareValues(cell1.value, cell2.value);
  }
}

const collator = new Intl.Collator('en-us');

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return collator.compare(a, b);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return collator.compare(JSON.stringify(a), JSON.stringify(b));
}
