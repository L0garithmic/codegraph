import { describe, it, expect } from 'vitest';
import { isTestPath } from '../src/search/query-utils';

describe('isTestPath: test directories at the project root', () => {
  it.each([
    '__tests__/helpers.ts',
    'testing/helpers.ts',
    'testlib/helpers.ts',
    'pkg/__tests__/helpers.ts',
    'pkg/testing/helpers.ts',
    'pkg/testlib/helpers.ts',
  ])('classifies %s as a test whether it is root-level or nested', (filePath) => {
    expect(isTestPath(filePath)).toBe(true);
  });
});
