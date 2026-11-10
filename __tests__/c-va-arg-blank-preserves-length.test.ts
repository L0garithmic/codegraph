/**
 * Blanking a qualified va_arg type argument keeps the source's length and
 * offsets. A space between `va_arg` and `(` is part of the matched text and
 * must survive the rewrite, or every later declaration shifts.
 */
import { describe, it, expect } from 'vitest';
import { blankCVaArgQualifiedTypeArgs } from '../src/extraction/languages/c-cpp';

describe('C va_arg blanking preserves source offsets', () => {
  it('keeps the length and the offset of the next declaration when va_arg has a space before (', () => {
    const source = 'void f(void) {\n  int n = va_arg (ap, const char *);\n}\nint after;\n';
    const blanked = blankCVaArgQualifiedTypeArgs(source);
    expect(blanked.length).toBe(source.length);
    expect(blanked.indexOf('int after')).toBe(source.indexOf('int after'));
  });
});
