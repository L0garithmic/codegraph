/**
 * A class-level [Route] prefix applies only to the actions of its own class.
 *
 * The C# extractor took the first [Route] class in the file and applied its
 * prefix to every HttpGet/HttpPost action in the file, so B's action came out
 * under A's route.
 */

import { describe, it, expect } from 'vitest';
import { aspnetResolver } from '../src/resolution/frameworks/csharp';

describe('C# attribute routes take the prefix of their own class', () => {
  it('gives each action the [Route] of the class it sits in', () => {
    const src = [
      '[Route("a")]',
      'public class A : ControllerBase {',
      '  [HttpGet("x")]',
      '  public IActionResult X() { return Ok(); }',
      '}',
      '[Route("b")]',
      'public class B : ControllerBase {',
      '  [HttpGet("y")]',
      '  public IActionResult Y() { return Ok(); }',
      '}',
      '',
    ].join('\n');
    const result = aspnetResolver.extract!('Controllers/Mixed.cs', src);
    const names = result.nodes.filter((n) => n.kind === 'route').map((n) => n.name);
    expect(names).toEqual(['GET /a/x', 'GET /b/y']);
  });
});
