/**
 * An endpoint group's RoutePrefix is read from its own class, not the whole file.
 *
 * The first RoutePrefix literal in a file was applied to every endpoint group in
 * it, and postExtract skipped any file that declared one at all, so a group with
 * no RoutePrefix lost its /api prefix.
 */

import { describe, it, expect } from 'vitest';
import { aspnetResolver } from '../src/resolution/frameworks/csharp';
import type { Node } from '../src/types';
import type { ResolutionContext } from '../src/resolution/types';

const SRC = [
  'public class A {',
  '  public static string RoutePrefix => "/a";',
  '  public static void Map(RouteGroupBuilder group) { group.MapGet(Handler); }',
  '}',
  'public class B : IEndpointGroup {',
  '  public static void Map(RouteGroupBuilder group) { group.MapPost(Create); }',
  '}',
  '// registration: app.MapGroup($"/api/{groupName}")',
  '',
].join('\n');

describe('C# endpoint groups use their own class RoutePrefix', () => {
  it('extracts the group without RoutePrefix under its class name', () => {
    const result = aspnetResolver.extract!('Endpoints/Groups.cs', SRC);
    const names = result.nodes.filter((n) => n.kind === 'route').map((n) => n.name);
    expect(names).toEqual(['GET /a', 'POST /B']);
  });

  it('postExtract prefixes the group that has no RoutePrefix and leaves the one that declares it', () => {
    const extracted = aspnetResolver.extract!('Endpoints/Groups.cs', SRC);
    const routes: Node[] = extracted.nodes.filter((n) => n.kind === 'route');
    const context = {
      getAllFiles: () => ['Endpoints/Groups.cs'],
      readFile: () => SRC,
      getNodesByKind: () => routes,
    } as unknown as ResolutionContext;
    const updates = aspnetResolver.postExtract!(context);
    expect(updates.map((n) => n.name)).toEqual(['POST /api/B']);
  });
});
