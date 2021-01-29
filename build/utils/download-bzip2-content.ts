import download from 'download';
import streamProgressbar from 'stream-progressbar';
import { createWriteStream, ensureDir, existsSync, move } from 'fs-extra';
import { dirname, basename } from 'path';
import unbzip2Stream from 'unbzip2-stream';

interface FileDownloadOptions {
  description?: string;
  decompressBzip2?: boolean;
  skipIfExists?: boolean;
}

/**
 * Performs a streaming file download, optionally combined with streaming bzip2 decompression, and
 * stores the result with the specified target path. Shows a progress bar during download.
 *
 * The target file is created in one atomic operation, so that if the process is terminated, the
 * target file is either complete or missing.
 */
export async function downloadFile(
  url: string,
  targetPath: string,
  options?: FileDownloadOptions,
): Promise<void> {
  await ensureDir(dirname(targetPath));

  if (options?.skipIfExists && existsSync(targetPath)) {
    return;
  }

  const description = options?.description ?? basename(targetPath);
  console.log(`Downloading ${description}.`);

  const tempPath = `${targetPath}~`;
  let stream: NodeJS.ReadWriteStream = download(url).pipe(
    streamProgressbar(':bar :percent downloaded (:etas remaining)'),
  );
  if (options?.decompressBzip2) {
    stream = stream.pipe(unbzip2Stream());
  }
  stream.pipe(createWriteStream(tempPath));
  await new Promise((resolve, reject) =>
    stream.on('close', resolve).on('error', reject),
  );

  await move(tempPath, targetPath);
}
