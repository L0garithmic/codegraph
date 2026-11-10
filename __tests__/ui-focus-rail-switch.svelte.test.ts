/**
 * Switching rails lands on the first row of the other rail, even when the
 * keyboard was on a later row (the old code kept an out-of-range index).
 */
import { describe, it, expect } from 'vitest';
import { railFocus } from '../ui/src/lib/focus.svelte';

describe('railFocus.switchTo', () => {
  it('lands on row 0 of the other rail, not the previous row index', () => {
    railFocus.move('left', 5);
    railFocus.switchTo('right');
    expect(railFocus.rail).toBe('right');
    expect(railFocus.index).toBe(0);
  });
});
