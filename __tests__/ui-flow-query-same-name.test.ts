/**
 * "X reaches Y" with two different dotted symbols that share a last segment is a
 * flow question, not a self-flow: `Service.load` and `Repo.load` are two symbols.
 */
import { describe, it, expect } from 'vitest';
import { parseFlowQuery } from '../ui/src/lib/search-model';

describe('parseFlowQuery with shared last segments', () => {
  it('keeps a flow question between two different methods with the same name', () => {
    expect(parseFlowQuery('how does Service.load reach Repo.load')).not.toBeNull();
  });

  it('still refuses a question whose two ends are the same name', () => {
    expect(parseFlowQuery('how does Service.load reach Service.load')).toBeNull();
  });
});
