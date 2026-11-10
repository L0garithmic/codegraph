/**
 * "Same directory" means the caller's own directory, not a path prefix: a
 * prefix-sharing sibling (`src/widgets-other`) must not win over the real
 * sibling (`src/widgets`).
 */
import { describe, it, expect } from 'vitest';
import { svelteResolver } from '../src/resolution/frameworks/svelte';
import { vueResolver } from '../src/resolution/frameworks/vue';
import type { UnresolvedRef } from '../src/types';

describe('component resolution prefers the true sibling directory', () => {
  const ref = (filePath: string): UnresolvedRef =>
    ({ referenceName: 'Button', referenceKind: 'calls', filePath, language: 'svelte', line: 1, column: 0 }) as any;

  it('svelte and vue skip a prefix-sharing directory', () => {
    const svelteComponents = [
      { id: 'svelte-other', kind: 'component', name: 'Button', filePath: 'src/widgets-other/Button.svelte' },
      { id: 'svelte-sibling', kind: 'component', name: 'Button', filePath: 'src/widgets/Button.svelte' },
    ];
    const svelteContext = {
      readFile: () => null,
      getAllFiles: () => [],
      getNodesInFile: () => [],
      getNodesByName: (name: string) => svelteComponents.filter((n) => n.name === name),
    } as any;
    const svelteHit = svelteResolver.resolve(ref('src/widgets/Card.svelte'), svelteContext);
    expect(svelteHit?.targetNodeId).toBe('svelte-sibling');

    const vueFiles = ['src/widgets-other/Button.vue', 'src/widgets/Button.vue'];
    const vueContext = {
      readFile: () => null,
      getAllFiles: () => vueFiles,
      getNodesInFile: (file: string) => [
        { id: `vue:${file}`, kind: 'component', name: 'Button', filePath: file },
      ],
      getNodesByName: () => [],
    } as any;
    const vueRef = { ...ref('src/widgets/Card.vue'), language: 'vue' } as UnresolvedRef;
    const vueHit = vueResolver.resolve(vueRef, vueContext);
    expect(vueHit?.targetNodeId).toBe('vue:src/widgets/Button.vue');
  });
});
