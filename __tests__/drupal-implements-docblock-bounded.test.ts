/**
 * A Drupal `@Implements hook_X()` docblock must attach to the function that
 * directly follows ITS OWN docblock. An unrelated docblock before it must not
 * let the match run across that docblock's `*\/` and tag the wrong function.
 */

import { describe, expect, it } from 'vitest';
import { drupalResolver } from '../src/resolution/frameworks/drupal';

describe('drupal @Implements docblocks', () => {
  it('does not attach a hook to a function that follows an unrelated docblock', () => {
    const src = [
      '<?php',
      '',
      '/** @Implements hook_cron() */',
      '/** plain helper */',
      'function other() {}',
      '',
      '/**',
      ' * Implements hook_cron().',
      ' */',
      'function mymodule_cron() {}',
      '',
    ].join('\n');
    const lines = src.split('\n');
    const otherLine = lines.findIndex((l) => l.startsWith('function other')) + 1;
    const ownLine = lines.findIndex((l) => l.startsWith('function mymodule_cron')) + 1;

    const { references } = drupalResolver.extract!('web/modules/custom/mymodule/mymodule.module', src);
    const cronRefs = references.filter((r) => r.referenceName === 'hook_cron');

    expect(cronRefs.map((r) => r.line)).toEqual([ownLine]);
    expect(cronRefs.some((r) => r.line === otherLine)).toBe(false);
  });
});
