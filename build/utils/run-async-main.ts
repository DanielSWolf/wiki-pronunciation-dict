/**
 * Prevents Node from exiting prematurely.
 * See https://stackoverflow.com/questions/46914025
 */
export function runAsyncMain(main: () => Promise<void>) {
  const maxInt32 = 2 ** 31 - 1;
  const timeoutId = setTimeout(() => {}, maxInt32);
  main().then(() => clearTimeout(timeoutId));
}
