/**
 * `members` in [workspace] must not be read from `default-members`, even when
 * `default-members` is listed first.
 */
import { describe, it, expect } from 'vitest';
import { getCargoWorkspaceCrateMap } from '../src/resolution/frameworks/cargo-workspace';

describe('cargo workspace members', () => {
  it('reads members, not default-members, when default-members comes first', () => {
    const files: Record<string, string> = {
      'Cargo.toml': '[workspace]\ndefault-members = ["crates/app"]\nmembers = ["crates/app", "crates/lib"]\n',
      'crates/app/Cargo.toml': '[package]\nname = "app"\n',
      'crates/lib/Cargo.toml': '[package]\nname = "lib"\n',
    };
    const ctx = { readFile: (p: string) => files[p] ?? null } as any;
    const paths = [...getCargoWorkspaceCrateMap(ctx).values()];
    expect(paths).toContain('crates/lib');
  });
});
