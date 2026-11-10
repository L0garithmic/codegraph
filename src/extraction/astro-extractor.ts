import { Node, Edge, ExtractionResult, ExtractionError, UnresolvedReference } from '../types';
import { generateNodeId } from './tree-sitter-helpers';
import { TreeSitterExtractor } from './tree-sitter';
import { isLanguageSupported } from './grammars';

/**
 * Astro built-in components — compiler-provided (`<Fragment>`) or shipped by
 * `astro:components` (`<Code>`, `<Debug>`), not user code.
 */
const ASTRO_BUILTIN_COMPONENTS = new Set(['Fragment', 'Code', 'Debug']);

/**
 * AstroExtractor - Extracts code relationships from Astro component files
 *
 * Astro files are multi-language: a TypeScript frontmatter block fenced by
 * `---` lines, a JSX-like HTML template, and optional <script>/<style> blocks.
 * Rather than parsing a full Astro grammar, we extract the frontmatter and
 * <script> contents and delegate them to the TypeScript TreeSitterExtractor
 * (Astro processes both as TypeScript by default — no `lang` attr needed).
 *
 * Also extracts function calls from template expressions (`{fn(...)}`) and
 * component usages (`<PascalCase>`) so cross-file edges are captured even
 * when the only reference lives in markup.
 *
 * Every .astro file produces a component node (Astro components are always
 * importable).
 */
export class AstroExtractor {
  private filePath: string;
  private source: string;
  private nodes: Node[] = [];
  private edges: Edge[] = [];
  private unresolvedReferences: UnresolvedReference[] = [];
  private errors: ExtractionError[] = [];

  constructor(filePath: string, source: string) {
    this.filePath = filePath;
    this.source = source;
  }

  /**
   * Extract from Astro source
   */
  extract(): ExtractionResult {
    const startTime = Date.now();

    try {
      // Create component node for the .astro file itself
      const componentNode = this.createComponentNode();

      // Extract and process the frontmatter block (--- fenced, TypeScript)
      const frontmatter = this.extractFrontmatter();
      if (frontmatter) {
        this.processScriptContent(frontmatter, componentNode.id, 'frontmatter');
      }

      // The frontmatter is code, not markup: blank it out (keeping offsets and
      // line numbers) so a <script> string inside it is not delegated again.
      const markup = this.maskSpans(this.source, this.frontmatterSpans(frontmatter));

      // Extract and process <script> blocks (client-side, TypeScript-capable)
      for (const block of this.extractScriptBlocks(markup)) {
        this.processScriptContent(block, componentNode.id, 'script');
      }

      // The template scans read the markup with only the <script>/<style> spans
      // blanked; other text on those lines is still template.
      const template = this.maskSpans(markup, this.embeddedBlockSpans(markup));

      // Extract function calls from template expressions ({fn(...)})
      this.extractTemplateCalls(componentNode.id, template);

      // Extract component usages from template (<ComponentName>)
      this.extractTemplateComponents(componentNode.id, template);
    } catch (error) {
      this.errors.push({
        message: `Astro extraction error: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
        code: 'parse_error',
      });
    }

    return {
      nodes: this.nodes,
      edges: this.edges,
      unresolvedReferences: this.unresolvedReferences,
      errors: this.errors,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Create a component node for the .astro file
   */
  private createComponentNode(): Node {
    const lines = this.source.split('\n');
    const fileName = this.filePath.split(/[/\\]/).pop() || this.filePath;
    const componentName = fileName.replace(/\.astro$/, '');
    const id = generateNodeId(this.filePath, 'component', componentName, 1);

    const node: Node = {
      id,
      kind: 'component',
      name: componentName,
      qualifiedName: `${this.filePath}::${componentName}`,
      filePath: this.filePath,
      language: 'astro',
      startLine: 1,
      endLine: lines.length,
      startColumn: 0,
      endColumn: lines[lines.length - 1]?.length || 0,
      isExported: true, // Astro components are always importable
      updatedAt: Date.now(),
    };

    this.nodes.push(node);
    return node;
  }

  /**
   * Extract the frontmatter block: the content between the opening `---`
   * fence (first non-blank line of the file) and the closing `---` fence.
   * An unclosed fence is treated as "no frontmatter" rather than swallowing
   * the whole template as TypeScript.
   *
   * Returns the content plus its 0-indexed start line, or null.
   */
  private extractFrontmatter(): { content: string; startLine: number; endLine: number } | null {
    const lines = this.source.split('\n');

    // Opening fence must be the first non-blank line
    let openIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i]!.trim();
      if (trimmed === '') continue;
      if (trimmed === '---') openIdx = i;
      break;
    }
    if (openIdx === -1) return null;

    // Closing fence
    let closeIdx = -1;
    for (let i = openIdx + 1; i < lines.length; i++) {
      if (lines[i]!.trim() === '---') {
        closeIdx = i;
        break;
      }
    }
    if (closeIdx === -1) return null;

    return {
      content: lines.slice(openIdx + 1, closeIdx).join('\n'),
      startLine: openIdx + 1, // 0-indexed line where content starts
      endLine: closeIdx, // 0-indexed line of the closing fence
    };
  }

  /**
   * Extract <script> blocks from the template portion
   */
  private extractScriptBlocks(source: string): Array<{ content: string; startLine: number }> {
    const blocks: Array<{ content: string; startLine: number }> = [];

    const scriptRegex = /<script(\s[^>]*)?>(?<content>[\s\S]*?)<\/script>/g;
    let match;

    while ((match = scriptRegex.exec(source)) !== null) {
      const content = match.groups?.content || match[2] || '';

      // Calculate the 0-indexed line where the content begins. The content
      // starts right after the opening tag's `>` — its leading `\n` is part
      // of the content, so relative line 1 sits ON the tag's closing line
      // (do not add 1 here; that double-counts the embedded newline).
      const beforeScript = source.substring(0, match.index);
      const scriptTagLine = (beforeScript.match(/\n/g) || []).length;
      const openingTag = match[0].substring(0, match[0].indexOf('>') + 1);
      const openingTagLines = (openingTag.match(/\n/g) || []).length;
      const contentStartLine = scriptTagLine + openingTagLines; // 0-indexed

      blocks.push({ content, startLine: contentStartLine });
    }

    return blocks;
  }

  /**
   * Process frontmatter / script content by delegating to TreeSitterExtractor.
   * Astro treats both as TypeScript by default.
   */
  private processScriptContent(
    block: { content: string; startLine: number },
    componentNodeId: string,
    label: 'frontmatter' | 'script'
  ): void {
    if (!isLanguageSupported('typescript')) {
      this.errors.push({
        message: `Parser for typescript not available, cannot parse Astro ${label} block`,
        severity: 'warning',
      });
      return;
    }

    // Delegate to TreeSitterExtractor
    const extractor = new TreeSitterExtractor(this.filePath, block.content, 'typescript');
    const result = extractor.extract();

    // Offset line numbers from the block back to .astro file positions
    for (const node of result.nodes) {
      node.startLine += block.startLine;
      node.endLine += block.startLine;
      node.language = 'astro'; // Mark as astro, not TS

      this.nodes.push(node);

      // Add containment edge from component to this node
      this.edges.push({
        source: componentNodeId,
        target: node.id,
        kind: 'contains',
      });
    }

    // Offset edges (they reference line numbers)
    for (const edge of result.edges) {
      if (edge.line) {
        edge.line += block.startLine;
      }
      this.edges.push(edge);
    }

    // Offset unresolved references
    for (const ref of result.unresolvedReferences) {
      ref.line += block.startLine;
      ref.filePath = this.filePath;
      ref.language = 'astro';
      this.unresolvedReferences.push(ref);
    }

    // Carry over errors
    for (const error of result.errors) {
      if (error.line) {
        error.line += block.startLine;
      }
      this.errors.push(error);
    }
  }

  /**
   * Character spans [start, end) of the frontmatter block, fences included.
   */
  private frontmatterSpans(frontmatter: { startLine: number; endLine: number } | null): Array<[number, number]> {
    if (!frontmatter) return [];
    // From the opening fence line through the closing fence line
    return [[this.lineOffset(frontmatter.startLine - 1), this.lineOffset(frontmatter.endLine + 1)]];
  }

  /**
   * Character spans [start, end) of every <script>/<style> element in `text`.
   */
  private embeddedBlockSpans(text: string): Array<[number, number]> {
    const spans: Array<[number, number]> = [];
    const tagRegex = /<(script|style)(\s[^>]*)?>[\s\S]*?<\/\1>/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(text)) !== null) {
      spans.push([tagMatch.index, tagMatch.index + tagMatch[0].length]);
    }
    return spans;
  }

  /**
   * Replace the given spans with spaces, keeping newlines, so every other
   * character keeps its offset and line number.
   */
  private maskSpans(text: string, spans: Array<[number, number]>): string {
    let masked = '';
    let pos = 0;
    for (const [start, end] of spans) {
      masked += text.slice(pos, start) + text.slice(start, end).replace(/[^\n]/g, ' ');
      pos = end;
    }
    return masked + text.slice(pos);
  }

  /**
   * Character offset where 0-indexed line `lineIdx` starts (clamped to the source length).
   */
  private lineOffset(lineIdx: number): number {
    const lines = this.source.split('\n');
    let offset = 0;
    for (let i = 0; i < lineIdx && i < lines.length; i++) offset += lines[i]!.length + 1;
    return Math.min(offset, this.source.length);
  }

  /**
   * Extract function calls from Astro template expressions.
   *
   * Astro templates embed JSX-like expressions (`{formatDate(post.date)}`,
   * `class:list={cn(...)}`), so calls frequently live in markup rather than
   * the frontmatter. We scan template lines for `{expression}` groups and
   * extract call patterns from them. A `{` group left open at end-of-line
   * (the pervasive `{posts.map((post) => (` pattern) contributes the calls
   * on its opening line.
   */
  private extractTemplateCalls(componentNodeId: string, template: string): void {
    const lines = template.split('\n');
    // Complete groups: {...} — excluding JSX comments ({/* ... */})
    const exprRegex = /\{([^}/][^}]*)\}/g;
    // A group opened but not closed on this line
    const openExprRegex = /\{([^}/][^}]*)$/;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]!;
      const exprs: Array<{ text: string; offset: number }> = [];

      let exprMatch;
      while ((exprMatch = exprRegex.exec(line)) !== null) {
        exprs.push({ text: exprMatch[1]!, offset: exprMatch.index });
      }
      const openMatch = openExprRegex.exec(line.replace(exprRegex, ''));
      if (openMatch) {
        exprs.push({ text: openMatch[1]!, offset: line.lastIndexOf('{') });
      }

      for (const expr of exprs) {
        // Extract function calls: identifiers followed by (
        // Matches: cn(...), formatDate(...), obj.method(...)
        const callRegex = /\b([a-zA-Z_$][\w$.]*)\s*\(/g;
        let callMatch;
        while ((callMatch = callRegex.exec(expr.text)) !== null) {
          const calleeName = callMatch[1]!;
          // Skip control-flow keywords valid inside expressions
          if (calleeName === 'if' || calleeName === 'await' || calleeName === 'function') continue;

          this.unresolvedReferences.push({
            fromNodeId: componentNodeId,
            referenceName: calleeName,
            referenceKind: 'calls',
            line: lineIdx + 1, // 1-indexed
            column: expr.offset + callMatch.index,
            filePath: this.filePath,
            language: 'astro',
          });
        }
      }
    }
  }

  /**
   * Extract component usages from the Astro template.
   *
   * PascalCase tags like <Layout>, <PostCard /> represent component
   * instantiations — analogous to function calls in imperative code.
   * Lowercase tags are native HTML (Astro does not register kebab-case
   * components the way Vue does, so those are real custom elements and
   * are skipped).
   */
  private extractTemplateComponents(componentNodeId: string, template: string): void {
    const lines = template.split('\n');
    // Opening/self-closing tags (closing tags </Foo> start with </ so won't match)
    const componentTagRegex = /<([A-Z][a-zA-Z0-9_$]*)\b/g;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]!;
      let match;
      while ((match = componentTagRegex.exec(line)) !== null) {
        const componentName = match[1]!;
        if (ASTRO_BUILTIN_COMPONENTS.has(componentName)) continue;

        this.unresolvedReferences.push({
          fromNodeId: componentNodeId,
          referenceName: componentName,
          referenceKind: 'references',
          line: lineIdx + 1, // 1-indexed
          column: match.index + 1,
          filePath: this.filePath,
          language: 'astro',
        });
      }
    }
  }
}
