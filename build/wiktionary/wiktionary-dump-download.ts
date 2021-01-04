import download from 'download';
import unbzip2Stream from 'unbzip2-stream';
import streamProgressbar from 'stream-progressbar';
import { createWriteStream, ensureDir, existsSync, move } from 'fs-extra';
import { join as joinPaths } from 'path';
import { throwError } from '../utils/throw-error';
import { WiktionaryEdition, wiktionaryEditionToString } from './wiktionary-edition';

async function getWiktionaryDownloadUrl(edition: WiktionaryEdition): Promise<string> {
  const baseUrl = 'https://dumps.wikimedia.org';
  const artifactId = `${edition}wiktionary`;

  // Determine timestamp of latest dump
  const backupIndex = (await download(`${baseUrl}/backup-index.html`)).toString();
  const timestamp = backupIndex.match(new RegExp(`<a href="${artifactId}/(\\d+)"`))?.[1]
    ?? throwError(`No backup found for ${wiktionaryEditionToString(edition)}.`);

  return `${baseUrl}/${artifactId}/${timestamp}/${artifactId}-${timestamp}-pages-articles.xml.bz2`;
}

const downloadsDir = 'downloads';

function getXmlFilePath(edition: WiktionaryEdition): string {
  return joinPaths(downloadsDir, `${edition}.xml`);
}

function getTempFilePath(edition: WiktionaryEdition): string {
  return getXmlFilePath(edition) + '~';
}

async function downloadWiktionaryXmlFile(edition: WiktionaryEdition): Promise<void> {
  console.log(`Downloading dump for ${wiktionaryEditionToString(edition)}.`);

  const url = await getWiktionaryDownloadUrl(edition);
  await ensureDir(downloadsDir);
  const tempFilePath = getTempFilePath(edition);
  const stream = download(url)
    .pipe(streamProgressbar(':bar :percent downloaded (:etas remaining)'))
    .pipe(unbzip2Stream())
    .pipe(createWriteStream(tempFilePath));
  await new Promise((resolve, reject) => stream.on('close', resolve).on('error', reject));

  await move(tempFilePath, getXmlFilePath(edition));
}

export async function getWiktionaryDumpFilePath(edition: WiktionaryEdition): Promise<string> {
  const filePath = getXmlFilePath(edition);
  if (!existsSync(filePath)) {
    await downloadWiktionaryXmlFile(edition);
  }

  return filePath;
}
