/**
 * An Error subclass with a throwing `name` getter must not stop the fatal
 * handler: it logs a fallback line and still exits 1.
 */
import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'events';
import { describeFatal, installFatalHandlers } from '../src/bin/fatal-handler';

class HostileError extends Error {
  get name(): string {
    throw new Error('name getter exploded');
  }
}

describe('fatal handler survives a throwing Error getter', () => {
  it('describeFatal falls back instead of throwing', () => {
    expect(describeFatal(new HostileError('boom'))).toBe('Error');
  });

  it('an unhandled rejection with such an Error still logs and exits 1', () => {
    const target = new EventEmitter();
    const lines: string[] = [];
    const codes: number[] = [];
    installFatalHandlers({
      target,
      exit: (code) => codes.push(code),
      write: (line) => lines.push(line),
    });

    target.emit('unhandledRejection', new HostileError('boom'));

    expect(lines).toEqual(['[CodeGraph] Unhandled rejection: Error\n']);
    expect(codes).toEqual([1]);
  });
});
