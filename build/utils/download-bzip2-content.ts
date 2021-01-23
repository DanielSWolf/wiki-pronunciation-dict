import download from 'download';
import streamProgressbar from 'stream-progressbar';
import { createWriteStream, ensureDir, move } from 'fs-extra';
import { dirname } from 'path';
import unbzip2Stream from 'unbzip2-stream';

/**
 * Downloads a bzip2-compressed file, performs a streaming decompression and stores it with the
 * specified target path. Shows a progress bar during download.
 *
 * The target file is created in one atomic operation, so that if the process is terminated, the
 * target file is either complete or missing.
 */
export async function downloadBzip2Content(
  url: string,
  targetPath: string,
): Promise<void> {
  await ensureDir(dirname(targetPath));

  const tempPath = `${targetPath}~`;
  const stream = download(url)
    .pipe(streamProgressbar(':bar :percent downloaded (:etas remaining)'))
    .pipe(unbzip2Stream())
    .pipe(createWriteStream(tempPath));
  await new Promise((resolve, reject) =>
    stream.on('close', resolve).on('error', reject),
  );

  await move(tempPath, targetPath);
}
