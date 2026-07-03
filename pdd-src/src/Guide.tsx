import { useMemo, useState } from 'react';
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

// An explorer entity's target is a production URL (#<view>/<node>); inside the app we jump
// to the node directly instead of opening a second copy of ourselves.
function explorerHash(e: Entity): { viewId: string; nodeId: string } | null {
  const hash = e.target?.split('#')[1];
  if (!hash) return null;
  const [viewId, nodeId] = hash.split('/');
  return viewId && nodeId ? { viewId, nodeId } : null;
}

interface Props { onJump: (viewId: string, nodeId: string) => void }

export default function Guide({ onJump }: Props) {
  const [modal, setModal] = useState<Entity | null>(null);
  const [openConcept, setOpenConcept] = useState<string | null>(null);

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
  const scrollTo = (id: string) => document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <main className="guide" onClick={(e) => {
      // click-away closes an open concept menu; clicks inside it are handled before bubbling here
      if (!(e.target as HTMLElement).closest('.ent-concept-wrap')) setOpenConcept(null);
    }}>
      <nav className="guide-index" aria-label="Sections">
        {index.map((c) => (
          <button key={c.id} onClick={() => scrollTo(c.id)}>{c.title.replace(/ — .*$/, '')}</button>
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
