import { describe, it, expect } from 'vitest';
import { djangoResolver } from '../src/resolution/frameworks/python';

describe('djangoResolver: empty root path route', () => {
  it("path('', views.index) produces a route node and a handler reference", () => {
    const src = "from django.urls import path\nfrom . import views\nurlpatterns = [path('', views.index, name='home')]\n";
    const { nodes, references } = djangoResolver.extract!('app/urls.py', src);
    expect(nodes.filter((n) => n.kind === 'route')).toHaveLength(1);
    expect(references.some((r) => r.referenceName === 'index')).toBe(true);
  });
});
