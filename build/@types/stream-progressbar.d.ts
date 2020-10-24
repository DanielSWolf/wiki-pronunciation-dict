declare module 'stream-progressbar' {
  import type { ProgressBarOptions } from 'progress';

  /**
   * Displays a stream progress bar.
   *
   * @param tokens - Progress bar tokens. See https://www.npmjs.com/package/progress#user-content-tokens.
   * @param options - Progress bar options. Make sure `total` is set unless the stream contains length information.
   */
  export default function streamProgressbar(tokens: string, options?: ProgressBarOptions): NodeJS.ReadWriteStream;
}
