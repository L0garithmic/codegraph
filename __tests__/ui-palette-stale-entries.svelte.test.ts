/**
 * When two entry-point loads overlap (a sync asks for a reload while the first is
 * still in flight), the newer answer wins even if the older one resolves last.
 */
import { describe, it, expect, vi } from 'vitest';

const pending: Array<{ resolve: (v: unknown) => void }> = [];
vi.mock('../ui/src/lib/api', () => ({
  fetchEntryPoints: vi.fn(() => new Promise((resolve) => { pending.push({ resolve }); })),
  fetchSearch: vi.fn(),
}));

import { palette } from '../ui/src/lib/palette.svelte';

describe('palette entry points', () => {
  it('keeps the newer entry-points answer when an older load resolves after it', async () => {
    const older = palette.reloadEntries();
    const newer = palette.reloadEntries();
    expect(pending).toHaveLength(2);
    pending[1]!.resolve({ entries: ['new'] });
    await newer;
    pending[0]!.resolve({ entries: ['old'] });
    await older;
    expect(palette.entries).toEqual({ entries: ['new'] });
  });
});
