import Semaphore from 'semaphore-async-await'

/**
 * Class that implements the `AsyncIterable` interface and receives its items through explicit calls.
 */
export class AsyncIterableAdapter<T> implements AsyncIterable<T> {
  // The next message to be consumed
  private message: Message<T> | null = null;

  // Can be acquired if the message has been consumed and a new message can be set
  private producerLock = new Semaphore(1);

  // Can be acquired if a message for consumption exists
  private consumerLock = new Semaphore(0);

  // Indicates whether an iterator has already been created
  private iteratorCreated = false;

  async signalValue(value: T): Promise<void> {
    await this.producerLock.wait();
    this.message = { type: 'value', value };
    this.consumerLock.signal();
  }

  async signalError(error: Error): Promise<void> {
    await this.producerLock.wait();
    this.message = { type: 'error', error };
    this.consumerLock.signal();
  }

  async signalDone(): Promise<void> {
    await this.producerLock.wait();
    this.message = { type: 'done' };
    this.consumerLock.signal();
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    if (this.iteratorCreated) {
      throw new Error('AsyncIterableAdapter can be iterated only once.');
    }

    this.iteratorCreated = true;

    async function* generator(this: AsyncIterableAdapter<T>) {
      let done = false;
      while (!done) {
        await this.consumerLock.wait();
        const message = this.message!;
        this.message = null;
        this.producerLock.signal();

        switch (message.type) {
          case 'value':
            yield message.value;
            break;
          case 'error':
            throw message.error;
          case 'done':
            done = true;
            break;
        }
      }
    }
    return generator.bind(this)();
  }
}

type Message<T> = {
  type: 'value';
  value: T;
} | {
  type: 'error';
  error: Error;
} | {
  type: 'done';
}
