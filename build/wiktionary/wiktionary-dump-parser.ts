import { Saxophone } from 'saxophone-ts';
import { createReadStream, statSync } from 'fs-extra';
import streamProgressbar from 'stream-progressbar';
import { isEqual } from 'lodash';
import { decodeXML } from 'entities';
import { WiktionaryEdition } from './wiktionary-edition';
import { getWiktionaryDumpFilePath } from './wiktionary-dump-download';

/** A Wiktionary page from a specific edition */
export interface WiktionaryPage {
  edition: WiktionaryEdition;
  title: string;
  text: string;
}

/** Parses a MediaWiki dump file, calling a callback on each page. */
export async function parseWiktionaryDump(edition: WiktionaryEdition, onPage: (page: WiktionaryPage) => void): Promise<void> {
  const xmlStream = new Saxophone();
  const openTags: string[] = []; // A stack of all open tags
  let currentTitle: string | null = null;

  xmlStream.on('tagOpen', tagNode => {
    if (!tagNode.isSelfClosing) {
      openTags.push(tagNode.name);
    }
  });

  xmlStream.on('tagClose', () => openTags.pop());

  xmlStream.on('text', textNode => {
    const nodeText = decodeXML(textNode.contents);
    if (isEqual(openTags, ['mediawiki', 'page', 'title'])) {
      // We're in a page title element
      currentTitle = nodeText;
    } else if (isEqual(openTags, ['mediawiki', 'page', 'revision', 'text'])) {
      // We're in a page text element
      if (!currentTitle) return;

      const page: WiktionaryPage = { edition, title: currentTitle, text: nodeText };
      onPage(page);
    }
  });

  const dumpFilePath = await getWiktionaryDumpFilePath(edition);
  const fileStream = createReadStream(dumpFilePath);

  fileStream
    .pipe(streamProgressbar(':bar :percent processed (:etas remaining)', { total: statSync(dumpFilePath).size }))
    .pipe(xmlStream as any);

  await new Promise((resolve, reject) => fileStream.on('close', resolve).on('error', reject));
}
