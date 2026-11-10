/**
 * A scoped `module.M:child` reference binds only to a `module "M"` declared in
 * the reference's own directory. A same-named module declared only in a
 * sibling directory must not be accepted.
 */
import { describe, it, expect } from 'vitest';
import { terraformResolver } from '../src/resolution/frameworks/terraform';

describe('terraform: a scoped module reference stays in its directory', () => {
  it('does not bind to a module declared only in a sibling directory', () => {
    const context = {
      getNodesByQualifiedName: (qname: string) =>
        qname === 'module.net'
          ? [{ id: 'module-legacy', kind: 'module', name: 'net', qualifiedName: 'module.net', filePath: 'legacy/main.tf', startLine: 1, endLine: 3 }]
          : [],
      getFileLines: () => ['module "net" {', '  source = "./net"', '}'],
      readFile: () => null,
      getAllFiles: () => ['legacy/net/main.tf'],
      getNodesInFile: () => [{ id: 'file-net', kind: 'file', name: 'main.tf', filePath: 'legacy/net/main.tf' }],
    } as any;
    const ref = {
      referenceName: 'module.net:file',
      referenceKind: 'references',
      filePath: 'envs/prod/main.tf',
      language: 'terraform',
      line: 1,
      column: 0,
    } as any;
    expect(terraformResolver.resolve(ref, context)).toBeNull();
  });
});
