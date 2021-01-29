export function executeWithoutConsole<TResult>(action: () => TResult): TResult {
  const { log, error } = console;

  const noOp = () => {};
  console.log = noOp;
  console.error = noOp;

  try {
    return action();
  } finally {
    console.log = log;
    console.error = error;
  }
}
