/**
 * Parsing helpers for CLI options that promise a whole number or a directory.
 *
 * `parseInt` reads `1.5` as 1 and `8garbage` as 8, so an option that promises a
 * whole number must reject those here instead of quietly taking the prefix.
 */

/** A plain non-negative integer, or NaN for anything else (fraction, junk, sign, empty). */
export function parseWholeNumber(raw: string): number {
  const value = /^\d+$/.test(raw) ? Number(raw) : NaN;
  return Number.isSafeInteger(value) ? value : NaN;
}

/**
 * Keep the files under a directory. The boundary is a `/`, so `src` takes
 * `src/a.ts` but not `src-old/a.ts` or `src2/a.ts`.
 */
export function filterFilesUnderDir<T extends { path: string }>(files: T[], dir: string): T[] {
  const prefix = dir.replace(/^\.\//, '').replace(/\/+$/, '');
  if (!prefix || prefix === '.') return files;
  return files.filter((f) => {
    const path = f.path.replace(/^\.\//, '');
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}
