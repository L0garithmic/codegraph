/**
 * Business calls inside an inline Express handler keep their calls edge.
 *
 * The reserved-name filter matched the bare method name, so
 * `userRepository.find(...)` was dropped because `find` is a reserved array
 * method. Only reserved names on framework receivers are noise.
 */

import { describe, it, expect } from 'vitest';
import { expressResolver } from '../src/resolution/frameworks/express';

describe('Express inline handlers keep business calls on non-framework receivers', () => {
  it('records a calls reference for userRepository.find inside the handler', () => {
    const src = [
      "const app = express();",
      "app.get('/users/:id', async (req, res) => {",
      "  const user = await userRepository.find({ id: req.params.id });",
      "  res.json(user);",
      "});",
      '',
    ].join('\n');
    const result = expressResolver.extract!('src/routes.ts', src);
    const calls = result.references.filter((r) => r.referenceKind === 'calls').map((r) => r.referenceName);
    expect(calls).toContain('find');
    expect(calls).not.toContain('json');
  });
});
