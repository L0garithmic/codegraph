/**
 * `--target` flag resolution: repeated ids, the wording of unknown-id
 * errors, and the single list of target ids.
 */
import { describe, it, expect } from 'vitest';
import { resolveTargetFlag, ALL_TARGETS, listTargetIds } from '../src/installer/targets/registry';
import { TARGET_IDS } from '../src/installer/targets/types';

const loc = 'global' as const;

describe('--target csv resolution', () => {
  it('returns a repeated id once, not once per repetition', () => {
    const ids = resolveTargetFlag('claude,claude', loc).map((t) => t.id);
    expect(ids).toEqual(['claude']);
  });

  it('says auto/all/none are only accepted as the whole value when one appears in a csv list', () => {
    expect(() => resolveTargetFlag('claude,all', loc)).toThrow(/only accepted as the whole value/);
  });

  it('keeps every registered target id in the single TARGET_IDS list, and no other', () => {
    expect([...listTargetIds()].sort()).toEqual([...TARGET_IDS].sort());
    expect(ALL_TARGETS.length).toBe(TARGET_IDS.length);
  });
});
