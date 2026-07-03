import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import guideData from '../guide.json';
import entitiesData from '../entities.json';
import { guideRich, type RefToken } from './guideRich';

// The guide view: the narrative layer over the same registry the graph views use. Each entity
// ref resolves to a behavior by its TYPE, never per-link, so a reader learns the affordances
// once: term → hover tooltip, source → new tab (explorer nodes jump in-app instead), artifact
// → snapshot modal (placeholder until snapshots are minted), concept → popover menu.

interface Entity {
  id: string;
  type: 'term' | 'source' | 'artifact' | 'concept';
  label: string;
  gloss?: string;
  source?: string;
  target?: string;
  targets?: string[];
  payload?: string;
  renderer?: string;
  snapshotHow?: string;
  oneLine?: string;
  summary?: string;
}

interface Block { kind: 'p' | 'ul' | 'ol'; text?: string; items?: string[] }
interface Section { id: string; title: string; subtitle?: string; blocks: Block[] }

const ENTITIES: Map<string, Entity> = new Map(
  (entitiesData.entities as Entity[]).map((e) => [e.id, e]),
);
const SECTIONS = guideData.sections as Section[];

// The section ids double as the guide's deep-link vocabulary (#guide/<id>); App validates
// hashes against this list the same way graph views validate node ids.
export const SECTION_IDS: string[] = SECTIONS.map((s) => s.id);

// An explorer entity's target is a production URL (#<view>/<node>); inside the app we jump
// to the node directly instead of opening a second copy of ourselves.
function explorerHash(e: Entity): { viewId: string; nodeId: string } | null {
  const hash = e.target?.split('#')[1];
  if (!hash) return null;
  const [viewId, nodeId] = hash.split('/');
  return viewId && nodeId ? { viewId, nodeId } : null;
}

interface Props {
  onJump: (viewId: string, nodeId: string) => void;
  section: string | null; // deep-linked / index-selected section (#guide/<id>)
  onSection: (id: string) => void; // mirror the reading position back into the hash
}

export default function Guide({ onJump, section, onSection }: Props) {
  const [modal, setModal] = useState<Entity | null>(null);
  const [openConcept, setOpenConcept] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  // Which section the scroll-spy last reported. The scroll effect skips when the incoming
  // `section` came from the spy itself, so reading never fights programmatic scrolling.
  const spyRef = useRef<string | null>(null);
  const throttle = useRef(0);
  const sectionRef = useRef(section); sectionRef.current = section;
  const onSectionRef = useRef(onSection); onSectionRef.current = onSection;

  // Deep link / index click → scroll. Runs on mount too, so #guide/prove opens at PROVE.
  // behavior 'auto', deliberately: a deep link into a long document should position instantly
  // (smooth over thousands of pixels is seconds of crawl, and never completes in a hidden tab).
  useEffect(() => {
    if (!section || section === spyRef.current) return;
    document.getElementById(`guide-${section}`)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [section]);

  // Scroll-spy: the hash follows the reading position (last section whose heading passed the
  // sticky index), so copying the address bar shares the spot being read. Timeout throttle,
  // not rAF — rAF is suspended in hidden tabs, and 80ms is imperceptible for hash updates.
  const onScroll = () => {
    clearTimeout(throttle.current);
    throttle.current = window.setTimeout(() => {
      const m = mainRef.current;
      if (!m) return;
      const threshold = m.getBoundingClientRect().top + 72;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(`guide-${s.id}`);
        if (el && el.getBoundingClientRect().top <= threshold) current = s.id;
      }
      // At the very bottom the last section may be too short to cross the threshold; reading
      // the end of the document is reading the last section.
      if (m.scrollTop >= m.scrollHeight - m.clientHeight - 2) current = SECTIONS[SECTIONS.length - 1].id;
      if (current !== sectionRef.current) {
        spyRef.current = current;
        onSectionRef.current(current);
      }
    }, 80);
  };

  // One renderer per entity type. A ref to an id missing from the registry renders visibly
  // broken (dev aid) rather than silently as plain text.
  const renderRef = (ref: RefToken, key: string): ReactNode => {
    const e = ENTITIES.get(ref.id);
    if (!e) return <span key={key} className="ent ent-missing" title={`missing entity: ${ref.id}`}>{ref.label}</span>;
    if (e.type === 'term') {
      return <span key={key} className="ent ent-term" tabIndex={0} data-gloss={e.gloss ?? ''}>{ref.label}</span>;
    }
    if (e.type === 'artifact') {
      return <button key={key} className="ent ent-artifact" onClick={() => setModal(e)}>{ref.label}</button>;
    }
    if (e.type === 'concept') {
      const open = openConcept === e.id;
      return (
        <span key={key} className="ent-concept-wrap">
          <button className="ent ent-concept" aria-expanded={open} onClick={() => setOpenConcept(open ? null : e.id)}>
            {ref.label}<span className="chev" aria-hidden="true">{open ? ' ▴' : ' ▾'}</span>
          </button>
          {open && (
            <span className="concept-menu" role="menu">
              {(e.targets ?? []).map((tid) => {
                const t = ENTITIES.get(tid);
                if (!t) return null;
                return <span key={tid} className="concept-item">{renderRef({ id: tid, label: t.label }, `${key}.${tid}`)}</span>;
              })}
            </span>
          )}
        </span>
      );
    }
    // source: explorer nodes jump in-app; docs/code open a new tab
    const jump = e.id.startsWith('explorer.') ? explorerHash(e) : null;
    if (jump) {
      return <button key={key} className="ent ent-jump" title={e.summary || e.label} onClick={() => onJump(jump.viewId, jump.nodeId)}>{ref.label}</button>;
    }
    return <a key={key} className="ent ent-src" href={e.target} target="_blank" rel="noreferrer" title={e.oneLine || e.target}>{ref.label}</a>;
  };

  const rich = (text: string) => guideRich(text, renderRef);

  // The index: section titles as in-page navigation. The verbs double as graph links via the
  // refs inside the sections themselves.
  const index = useMemo(() => SECTIONS.map((c) => ({ id: c.id, title: c.title })), []);
  const active = section ?? SECTIONS[0].id;

  return (
    <main ref={mainRef} className="guide" onScroll={onScroll} onClick={(e) => {
      // click-away closes an open concept menu; clicks inside it are handled before bubbling here
      if (!(e.target as HTMLElement).closest('.ent-concept-wrap')) setOpenConcept(null);
    }}>
      <nav className="guide-index" aria-label="Sections">
        {index.map((c) => (
          <button
            key={c.id}
            className={c.id === active ? 'active' : undefined}
            aria-current={c.id === active ? 'true' : undefined}
            onClick={() => { spyRef.current = null; onSection(c.id); }}
          >{c.title.replace(/ — .*$/, '')}</button>
        ))}
      </nav>
      <article>
        {SECTIONS.map((c) => (
          <section key={c.id} id={`guide-${c.id}`} className="guide-section">
            <h2>{rich(c.title)}</h2>
            {c.subtitle && <p className="guide-subtitle">{rich(c.subtitle)}</p>}
            {c.blocks.map((b, i) => {
              if (b.kind === 'p') return <p key={i}>{rich(b.text ?? '')}</p>;
              const List = b.kind === 'ul' ? 'ul' : 'ol';
              return <List key={i}>{(b.items ?? []).map((it, j) => <li key={j}>{rich(it)}</li>)}</List>;
            })}
          </section>
        ))}
      </article>
      {modal && (
        <div className="guide-modal-backdrop" onClick={() => setModal(null)}>
          <div className="guide-modal" role="dialog" aria-label={modal.label} onClick={(e) => e.stopPropagation()}>
            <button className="guide-modal-close" onClick={() => setModal(null)} aria-label="Close">×</button>
            <h3>{modal.label}</h3>
            {modal.payload && <p><strong>Payload:</strong> {modal.payload}</p>}
            {modal.renderer && <p><strong>Rendered by:</strong> {modal.renderer}</p>}
            <p className="guide-modal-note">Snapshot pending — this modal will render a dated static snapshot of the real artifact.</p>
          </div>
        </div>
      )}
    </main>
  );
}
