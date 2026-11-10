/**
 * A smart-pointer return type unwraps to its pointee even when the pointee is
 * itself a template: `std::unique_ptr<Box<int>>` is a call on `Box`, not on
 * the invalid fragment `Box<int` that an unbalanced match used to leave.
 */
import { describe, it, expect } from 'vitest';
import { normalizeCppReturnType } from '../src/extraction/languages/c-cpp';

describe('C++ smart-pointer return types unwrap nested template arguments', () => {
  it('std::unique_ptr<Box<int>> normalizes to the pointee Box', () => {
    expect(normalizeCppReturnType('std::unique_ptr<Box<int>>')).toBe('Box');
  });
});
