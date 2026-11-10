import { describe, it, expect } from 'vitest';
import { extractFromSource } from '../src/extraction/tree-sitter';

describe('MyBatis statement preview with a > inside a tag attribute', () => {
  it('does not leak the attribute fragment into the SQL preview', () => {
    const xml =
      '<mapper namespace="com.example.FooMapper">' +
      '<select id="find">SELECT * FROM t <if test="a > b"> AND x = 1 </if></select>' +
      '</mapper>';
    const node = extractFromSource('FooMapper.xml', xml).nodes.find(
      (n) => n.kind === 'method' && n.name === 'find',
    );
    expect(node?.docstring).toContain('AND x = 1');
    expect(node?.docstring).not.toContain('b">');
  });
});
