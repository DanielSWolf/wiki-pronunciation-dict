import { performance } from 'perf_hooks';

export function timeAction<T>(name: string, action: () => T): T {
  console.log(`Starting ${name}.`);
  const start = performance.now();
  const result = action();

  function onDone() {
    const end = performance.now();
    console.log(`Finished ${name} in ${formatDuration(end - start)}.\n`);
  }

  if (isPromise(result)) {
    return (result.then(actualResult => {
      onDone();
      return actualResult;
    }) as unknown) as T;
  } else {
    onDone();
    return result;
  }
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.trunc(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} s`;
}

export function isPromise(value: unknown): value is Promise<any> {
  return (
    value instanceof Promise ||
    ((typeof value === 'object' || typeof value === 'function') &&
      value !== null &&
      'then' in value &&
      typeof (value as any).then === 'function' &&
      'catch' in value &&
      typeof (value as any).catch === 'function')
  );
}
