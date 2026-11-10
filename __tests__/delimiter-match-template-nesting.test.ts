/**
 * One shared delimiter matcher skips nested template literals in `${…}`.
 *
 * Express and Expo Router each kept a copy. The Express copy closed a template at
 * the first backtick, so a `)` inside a nested template in an interpolation
 * ended the outer call early. matchDelim now lives in one module.
 */

import { describe, it, expect } from 'vitest';
import { matchDelim } from '../src/resolution/delimiter-match';

describe('matchDelim skips nested template literals', () => {
  it('finds the call-closing paren past a nested template that holds a paren', () => {
    const s = 'f(`${g(`)`)}`)';
    expect(matchDelim(s, 1, '(', ')')).toBe(s.length - 1);
  });
});
