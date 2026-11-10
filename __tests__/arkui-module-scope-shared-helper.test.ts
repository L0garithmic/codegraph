import { describe, expect, it } from 'vitest';
import { arkuiModuleScopeOf } from '../src/resolution/synth-utils';
import type { ResolutionContext } from '../src/resolution/types';

/**
 * ArkUI emitter and router passes scope a file to its workspace module. The
 * scope rule is one shared helper: the longest matching module directory wins,
 * and a file outside every module scopes to the whole project ('').
 */
describe('arkuiModuleScopeOf', () => {
  const ctx = {
    getWorkspacePackages: () => ({
      byName: new Map([
        ['ui', 'packages/ui'],
        ['core', 'packages/ui/core'],
      ]),
    }),
  } as unknown as ResolutionContext;

  it('scopes a file to its longest enclosing module directory', () => {
    const scopeOf = arkuiModuleScopeOf(ctx);
    expect(scopeOf('packages/ui/core/x.ets')).toBe('packages/ui/core');
    expect(scopeOf('packages/ui/y.ets')).toBe('packages/ui');
    expect(scopeOf('other/z.ets')).toBe('');
  });
});
