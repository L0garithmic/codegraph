import { describe, it, expect } from 'vitest';
import { classifyEffect } from '../src/ui-server/api/effects';

describe('classifyEffect: a call chain with a nested argument list', () => {
  it('classifies res.status(getCode(err)).json as a response', () => {
    const effect = classifyEffect({
      text: 'res.status(getCode(err)).json',
      kind: 'calls',
      language: 'typescript',
      project: 'api',
    });
    expect(effect?.category).toBe('response');
  });
});
