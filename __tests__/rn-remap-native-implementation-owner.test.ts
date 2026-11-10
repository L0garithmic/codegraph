import { describe, it, expect } from 'vitest';
import { reactNativeBridgeResolver } from '../src/resolution/frameworks/react-native';
import type { Node, Language } from '../src/types';
import type { ResolutionContext, UnresolvedRef } from '../src/resolution/types';

function node(name: string, language: Language, filePath: string): Node {
  return {
    id: `${language}:${filePath}:${name}`,
    kind: 'method',
    name,
    qualifiedName: `${filePath}::${name}`,
    filePath,
    language,
    startLine: 10,
    endLine: 15,
    startColumn: 0,
    endColumn: 0,
    updatedAt: Date.now(),
  } as Node;
}

function makeContext(nodes: Node[], files: Record<string, string>): ResolutionContext {
  const allFiles = [...new Set([...nodes.map((n) => n.filePath), ...Object.keys(files)])];
  return {
    getNodesInFile: (fp: string) => nodes.filter((n) => n.filePath === fp),
    getNodesByName: (name: string) => nodes.filter((n) => n.name === name),
    getNodesByQualifiedName: () => { throw new Error('not used'); },
    getNodesByKind: (kind: string) => nodes.filter((n) => n.kind === kind),
    getNodesByLowerName: () => { throw new Error('not used'); },
    fileExists: (fp: string) => allFiles.includes(fp),
    readFile: (fp: string) => files[fp] ?? null,
    getProjectRoot: () => '/test',
    getAllFiles: () => allFiles,
    getImportMappings: () => [],
  } as ResolutionContext;
}

function ref(name: string): UnresolvedRef {
  return { fromNodeId: 'x', referenceName: name, referenceKind: 'calls', line: 1, column: 0, filePath: 'App.js', language: 'javascript' } as UnresolvedRef;
}

describe('RCT_REMAP_METHOD binds only to its own file implementation', () => {
  it('does not bind jsName to a same-named native method in another file', () => {
    const elsewhere = node('nativeName:', 'objc', 'Other.m');
    const ctx = makeContext([elsewhere], {
      'package.json': '{"dependencies":{"react-native":"^0.73"}}',
      'Mod.m': '@implementation Mod\nRCT_EXPORT_MODULE()\nRCT_REMAP_METHOD(jsFoo, nativeName:(NSDictionary *)opts) {}\n@end',
    });
    const result = reactNativeBridgeResolver.resolve(ref('jsFoo'), ctx);
    expect(result?.targetNodeId).toBeUndefined();
  });

  it('binds jsName to the implementation in its own file when the names differ', () => {
    const local = node('nativeName:', 'objc', 'Mod.m');
    const ctx = makeContext([local], {
      'package.json': '{"dependencies":{"react-native":"^0.73"}}',
      'Mod.m': '@implementation Mod\nRCT_EXPORT_MODULE()\nRCT_REMAP_METHOD(jsFoo, nativeName:(NSDictionary *)opts) {}\n@end',
    });
    const result = reactNativeBridgeResolver.resolve(ref('jsFoo'), ctx);
    expect(result?.targetNodeId).toBe(local.id);
  });
});
