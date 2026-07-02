import type { ReactNode } from 'react';

// The named moves of the method. Wherever these keywords appear in copy, `rich` gives them one
// consistent inline identity (see `.term` in styles.css), so a reader recognizes the same move on
// every mention rather than seeing it styled one way here and plain there.
const TERMS = ['MAP', 'PIN', 'CARVE', 'SHIP', 'PROVE'];
const TERM_RE = /\b(MAP|PIN|CARVE|SHIP|PROVE)\b/;

// Render a plain copy string as rich text: each move keyword becomes a styled token, everything else
// is left verbatim. Copy stays plain strings in copy.ts (greppable, one source) and the styling lives
// here, so any surface that renders copy through `rich` shows the terms identically.
export function rich(text: string): ReactNode[] {
  return text
    .split(TERM_RE)
    .map((part, i) => (TERMS.includes(part) ? <span className="term" key={i}>{part}</span> : part));
}
