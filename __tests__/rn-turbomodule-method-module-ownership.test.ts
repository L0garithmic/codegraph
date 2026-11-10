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

describe('TurboModule spec methods bind only to their own module native implementation', () => {
  it('does not attribute ModuleB.sync to the native sync that belongs to ModuleA', () => {
    const syncA = node('sync:', 'objc', 'ModuleA.m');
    const files = {
      'package.json': '{"dependencies":{"react-native":"^0.73"}}',
      'ModuleA.m': '@implementation ModuleA\nRCT_EXPORT_MODULE(ModuleA)\nRCT_EXPORT_METHOD(sync:(id)x) {}\n@end',
      'ModuleB.m': '@implementation ModuleB\nRCT_EXPORT_MODULE(ModuleB)\nRCT_EXPORT_METHOD(other:(id)x) {}\n@end',
      'SpecA.ts': "import { TurboModuleRegistry } from 'react-native';\nexport interface Spec extends TurboModule {\n  sync(): void;\n}\nexport default TurboModuleRegistry.getEnforcing<Spec>('ModuleA');",
      'SpecB.ts': "import { TurboModuleRegistry } from 'react-native';\nexport interface Spec extends TurboModule {\n  sync(): void;\n}\nexport default TurboModuleRegistry.getEnforcing<Spec>('ModuleB');",
    };
    const ctx = makeContext([syncA], files);
    const wrong = reactNativeBridgeResolver.resolve(ref('NativeModules.ModuleB.sync'), ctx);
    expect(wrong?.targetNodeId).toBeUndefined();
    const right = reactNativeBridgeResolver.resolve(ref('NativeModules.ModuleA.sync'), ctx);
    expect(right?.targetNodeId).toBe(syncA.id);
  });
});
