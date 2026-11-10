/**
 * Nuxt's root page is `pages/index.vue`. It must be a route at `/`, whether the
 * path is project-relative (`pages/index.vue`) or nested (`src/pages/index.vue`),
 * not `/index` and not skipped.
 */

import { describe, expect, it } from 'vitest';
import { vueResolver } from '../src/resolution/frameworks/vue';

function routeNames(filePath: string): string[] {
  const { nodes } = vueResolver.extract!(filePath, '');
  return nodes.filter((n) => n.kind === 'route').map((n) => n.name);
}

describe('vue (Nuxt) pages routes', () => {
  it('maps a bare and a src/ pages/index.vue to the root route', () => {
    expect(routeNames('pages/index.vue')).toEqual(['/']);
    expect(routeNames('src/pages/index.vue')).toEqual(['/']);
  });

  it('keeps nested index pages at their parent route', () => {
    expect(routeNames('src/pages/blog/index.vue')).toEqual(['/blog']);
  });
});
