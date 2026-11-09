/**
 * Explore session state keeps a project's call count past the LRU bound.
 *
 * Eviction drops a project's detail, never its counters: decay (CG-19) reads
 * `callCount`, and a project that comes back must continue its count.
 */
import { describe, it, expect } from 'vitest';
import { ExploreSessionState, EXPLORE_SESSION_LIMITS } from '../src/mcp/explore-session-state';

const emit = (projectRoot: string) => ({ projectRoot, query: 'q', files: [], sourceBytes: 0, responseBytes: 1 });

describe('ExploreSessionState eviction', () => {
  it('keeps the call count of an evicted project when it is queried again', () => {
    const state = new ExploreSessionState();
    const roots = ['/p/a', '/p/b', '/p/c', '/p/d', '/p/e'].slice(0, EXPLORE_SESSION_LIMITS.MAX_PROJECTS + 1);
    for (const r of roots) state.record(emit(r));
    // roots[0] has been evicted by now; its first call must still be counted.
    state.record(emit(roots[0]!));
    expect(state.callCount(roots[0]!)).toBe(2);
  });
});
