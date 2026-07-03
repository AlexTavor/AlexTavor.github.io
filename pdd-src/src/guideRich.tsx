import type { ReactNode } from 'react';

// The guide's inline grammar, kept deliberately small: [[entity.id|label]] refs, `code`,
// **bold**, *em*. Block structure (paragraphs, lists, sections) lives in guide.json as data,
// so this parser never has to understand layout — only inline marks. Refs are handed to the
// caller's renderer, so the behavior-per-entity-type logic stays in Guide.tsx.

export interface RefToken { id: string; label: string }

const REF_RE = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;

// Split one ref-free segment on `code`, then **bold**, then *em*. Order matters: code wins
// over emphasis so a literal `*` inside code never opens an em span.
function marks(text: string, key: number): ReactNode[] {
  const out: ReactNode[] = [];
  const codeParts = text.split(/(`[^`]+`)/);
  codeParts.forEach((part, i) => {
    const k = `${key}.${i}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(<code key={k}>{part.slice(1, -1)}</code>);
      return;
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/);
    boldParts.forEach((bp, j) => {
      const bk = `${k}.${j}`;
      if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
        out.push(<strong key={bk}>{bp.slice(2, -2)}</strong>);
        return;
      }
      const emParts = bp.split(/(\*[^*]+\*)/);
      emParts.forEach((ep, m) => {
        if (ep.startsWith('*') && ep.endsWith('*') && ep.length > 2) {
          out.push(<em key={`${bk}.${m}`}>{ep.slice(1, -1)}</em>);
        } else if (ep) {
          out.push(ep);
        }
      });
    });
  });
  return out;
}

// Render a story text run: entity refs go through `renderRef`, everything else through the
// inline marks above.
export function guideRich(text: string, renderRef: (ref: RefToken, key: string) => ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(REF_RE)) {
    if (m.index! > last) out.push(...marks(text.slice(last, m.index), n++));
    out.push(renderRef({ id: m[1], label: m[2] }, `ref${n++}`));
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(...marks(text.slice(last), n));
  return out;
}
