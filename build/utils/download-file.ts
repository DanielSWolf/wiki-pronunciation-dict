import streamProgressbar from 'stream-progressbar';
import { createWriteStream, ensureDir, existsSync, move } from 'fs-extra';
import { dirname, basename } from 'path';
import unbzip2Stream from 'unbzip2-stream';
import { promisify } from 'util';
import stream from 'stream';
import got from 'got';
import zlib from 'zlib';

const pipeline = promisify(stream.pipeline);

interface FileDownloadOptions {
  description?: string;
  decompressBzip2?: boolean;
  decompressGzip?: boolean;
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
  await pipeline(
    got.stream(url),
    streamProgressbar(':bar :percent downloaded (:etas remaining)'),
    ...(options?.decompressBzip2 ? [unbzip2Stream()] : []),
    ...(options?.decompressGzip ? [zlib.createGunzip()] : []),
    createWriteStream(tempPath),
  );

  await move(tempPath, targetPath);
}
