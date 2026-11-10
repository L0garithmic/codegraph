/**
 * Expo Router screen paths and href matching:
 *  - only the project's own app root yields screens (a nested `app/` folder
 *    under `src/` is not a route);
 *  - a templated href segment (`${kind}`) does not match a literal route
 *    segment, so an ambiguous href stays unresolved rather than guessed.
 */

import { describe, expect, it } from 'vitest';
import { matchRoute, routePathForFile, type RouteTable } from '../src/resolution/frameworks/expo-router';
import type { Node } from '../src/types';

function routeNode(name: string): Node {
  return {
    id: `route:${name}`,
    kind: 'route',
    name,
    qualifiedName: name,
    filePath: 'app/settings/[id].tsx',
    language: 'typescript',
    startLine: 1,
    endLine: 1,
    startColumn: 0,
    endColumn: 0,
    updatedAt: 0,
  } as Node;
}

describe('expo-router screens and href matching', () => {
  it('does not treat a nested app/ folder under src/ as the app root', () => {
    expect(routePathForFile('src/features/app/Shell.tsx')).toBeNull();
    expect(routePathForFile('src/app/settings.tsx')).toBe('/settings');
  });

  it('does not match a templated href segment against a literal route segment', () => {
    const table: RouteTable = {
      source: [],
      exact: new Map(),
      dynamic: [{ node: routeNode('/settings/[id]'), segs: ['settings', '[id]'] }],
    };

    // `/${section}/42` arrives as a '*' hole in the first slot.
    expect(matchRoute(['*', '42'], table)).toBeNull();
    // A literal href still matches the dynamic route.
    expect(matchRoute(['settings', '42'], table)?.name).toBe('/settings/[id]');
  });
});
