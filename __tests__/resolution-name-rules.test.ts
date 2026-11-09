import { describe, it, expect } from 'vitest';
import { isJsBuiltinMemberCall, JS_BUILT_INS } from '../src/resolution/js-builtins';
import { existenceNameFor } from '../src/resolution';

describe('JS built-in member calls', () => {
  it('treats member calls on the console, Math and JSON globals as built-ins', () => {
    expect(isJsBuiltinMemberCall('console.log')).toBe(true);
    expect(isJsBuiltinMemberCall('Math.floor')).toBe(true);
    expect(isJsBuiltinMemberCall('JSON.parse')).toBe(true);
  });

  it('is derived from the same owner as the global list, and does not match lookalikes', () => {
    expect(JS_BUILT_INS.has('JSON')).toBe(true);
    expect(isJsBuiltinMemberCall('JSONish.parse')).toBe(false);
    expect(isJsBuiltinMemberCall('console')).toBe(false);
    expect(isJsBuiltinMemberCall('myMath.floor')).toBe(false);
  });
});

describe('existence name for a reference', () => {
  it('strips the leading dot from an ArkTS chained attribute', () => {
    expect(existenceNameFor({ language: 'arkts', referenceName: '.titleStyle' })).toBe('titleStyle');
  });

  it('strips the Erlang call-site arity', () => {
    expect(existenceNameFor({ language: 'erlang', referenceName: 'f/1' })).toBe('f');
    expect(existenceNameFor({ language: 'erlang', referenceName: 'mod::f/2' })).toBe('mod::f');
  });

  it('leaves other references unchanged', () => {
    expect(existenceNameFor({ language: 'typescript', referenceName: '.keep' })).toBe('.keep');
    expect(existenceNameFor({ language: 'erlang', referenceName: 'plain' })).toBe('plain');
  });
});
