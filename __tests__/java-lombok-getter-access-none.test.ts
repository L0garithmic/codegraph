import { describe, it, expect, beforeAll } from 'vitest';
import { extractFromSource } from '../src/extraction/tree-sitter';
import { initGrammars, loadAllGrammars } from '../src/extraction/grammars';

beforeAll(async () => {
  await initGrammars();
  await loadAllGrammars();
});

describe('Lombok @Getter(AccessLevel.NONE) under @Data', () => {
  it('generates no getter for the field, but still generates its setter', () => {
    const source = [
      'import lombok.AccessLevel;',
      'import lombok.Data;',
      'import lombok.Getter;',
      '@Data',
      'public class User {',
      '  @Getter(AccessLevel.NONE) private String secret;',
      '  private String name;',
      '}',
    ].join('\n');
    const methods = extractFromSource('User.java', source).nodes
      .filter((n) => n.kind === 'method')
      .map((n) => n.name);
    expect(methods).not.toContain('getSecret');
    expect(methods).toContain('setSecret');
    expect(methods).toContain('getName');
  });
});
