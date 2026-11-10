/**
 * A code-based route whose parent chain is deeper than the walk limit must not
 * be emitted with a truncated address.
 */
import { describe, it, expect } from 'vitest';
import { parseTanstackRoutes } from '../src/resolution/frameworks/tanstack-router';

describe('tanstack: an over-deep parent chain emits no truncated route', () => {
  it('drops routes whose composed address exceeds the walk limit', () => {
    // r0 has no parent; each rN is the child of r(N-1). Only 24 hops are walked,
    // so only r0..r23 compose a complete address.
    const lines = ["import { createRoute } from '@tanstack/react-router';"];
    for (let i = 0; i < 30; i++) {
      const parent = i === 0 ? '' : `  getParentRoute: () => r${i - 1},\n`;
      lines.push(`const r${i} = createRoute({\n${parent}  path: 'seg${i}',\n});`);
    }
    const entries = parseTanstackRoutes(lines.join('\n'));
    expect(entries).toHaveLength(24);
    expect(entries.every((e) => e.path.split('/').filter(Boolean).length <= 24)).toBe(true);
  });
});
