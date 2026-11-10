import { describe, it, expect } from 'vitest';
import { extractProseCandidates } from '../src/search/identifier-segments';

describe('prose candidates are Unicode-normalization-stable', () => {
  it('yields the same candidates for precomposed and decomposed "résolution"', () => {
    const precomposed = 'the résolution path'.normalize('NFC');
    const decomposed = 'the résolution path';
    expect(extractProseCandidates(decomposed)).toEqual(extractProseCandidates(precomposed));
    expect(extractProseCandidates(decomposed)).toContain('resolution');
  });
});
