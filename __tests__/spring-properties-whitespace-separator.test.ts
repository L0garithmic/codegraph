/**
 * A Java properties line may separate its key from its value by whitespace alone
 * (`server.port 8080`), as well as by `=` or `:`. Such keys must become config leaves.
 */
import { describe, it, expect } from 'vitest';
import { springResolver } from '../src/resolution/frameworks/java';

describe('springResolver properties separators', () => {
  it('extracts a key separated from its value by whitespace', () => {
    const { nodes } = springResolver.extract!('application.properties', 'server.port 8080\n');
    expect(nodes.map((n) => n.qualifiedName)).toEqual(['server.port']);
  });

  it('still extracts keys separated by = and :', () => {
    const { nodes } = springResolver.extract!('application.properties', 'a.b = 1\nc.d:2\n');
    expect(nodes.map((n) => n.qualifiedName)).toEqual(['a.b', 'c.d']);
  });
});
