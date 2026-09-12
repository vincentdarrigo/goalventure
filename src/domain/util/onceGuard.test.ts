import { onceGuard } from './onceGuard';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('onceGuard', () => {
  test('collapses overlapping calls into a single underlying invocation', async () => {
    const d = deferred<string>();
    const fn = jest.fn(() => d.promise);
    const guarded = onceGuard(fn);

    const call1 = guarded();
    const call2 = guarded(); // arrives while call1 is still in flight

    expect(fn).toHaveBeenCalledTimes(1);

    d.resolve('done');
    await expect(call1).resolves.toBe('done');
    await expect(call2).resolves.toBe('done'); // both callers see the same result
  });

  test('a call after the previous one settles invokes the action again', async () => {
    const fn = jest.fn(async () => 'ok');
    const guarded = onceGuard(fn);

    await guarded();
    await guarded();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('forwards arguments to the underlying action', async () => {
    const fn = jest.fn(async (a: number, b: number) => a + b);
    const guarded = onceGuard(fn);

    await expect(guarded(2, 3)).resolves.toBe(5);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  test('a rejection clears the in-flight lock, so the next call can retry', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');
    const guarded = onceGuard(fn);

    await expect(guarded()).rejects.toThrow('boom');
    await expect(guarded()).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
