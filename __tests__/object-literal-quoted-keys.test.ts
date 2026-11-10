/**
 * An object literal's quoted keys are read as fields, so `{'path': '/users'}`
 * yields its `path` field the same way `{path: '/users'}` does.
 */
import { describe, it, expect } from 'vitest';
import { readFields } from '../src/resolution/frameworks/object-literal';

describe('object-literal: quoted keys', () => {
  it('reads a depth-1 quoted key followed by a colon as a field', () => {
    const s = "{'path': '/users', \"component\": Users, plain: 1}";
    const fields = readFields(s, 0, s.length - 1);
    expect(fields.get('path')?.text.trim()).toBe("'/users'");
    expect(fields.get('component')?.text.trim()).toBe('Users');
    expect(fields.get('plain')?.text.trim()).toBe('1');
  });

  it('still steps over a quoted value that has no colon after it', () => {
    const s = "{ label: 'a', 'b' }";
    const fields = readFields(s, 0, s.length - 1);
    expect([...fields.keys()]).toEqual(['label']);
  });
});
