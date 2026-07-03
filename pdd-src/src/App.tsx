import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { graph, orphanRules } from './model';
import PddGraph, { type FocusTarget } from './PddGraph';
import DetailPanel from './DetailPanel';
import Home from './Home';
import Guide, { SECTION_IDS } from './Guide';
import Legend from './Legend';
import Menu from './Menu';
import { VIEW_EMOJI } from './copy';
import type { Toggles } from './buildElements';

const ALL_LABELS = [...new Set(graph.nodes.map((n) => n.label))].sort();

// The "Read me" tab is selected on load and always available. It shows the overview + glossary
// (the Home component) rather than a graph view, so there is never a blank no-tab-selected state.
const README_ID = 'readme';

// The guide tab: what PDD does, how, and why — documentation rendered from guide.json +
// entities.json. Not a graph view — its sections are the method's moves.
const GUIDE_ID = 'guide';

// Deep links: #<viewId>[/<nodeId>] — the URL names a view and optionally a node in it, so external
// documents can link straight to a node (e.g. #flow/verb.map). The current view/selection is mirrored
// back into the hash with replaceState (no history spam; copying the address bar shares the spot).
// An invalid view or node degrades to the Read-me tab / no selection, never an error.
function parseHash(h: string): { viewId: string; nodeId: string | null } | null {
  const raw = h.replace(/^#/, '');
  if (!raw) return null;
  const [v, n] = raw.split('/').map((s) => decodeURIComponent(s));
  const viewOk = v === README_ID || v === GUIDE_ID || graph.views.some((view) => view.id === v);
  if (!viewOk) return null;
  // The second segment is a node id on graph views, a section id on the guide.
  const nodeId = v === GUIDE_ID
    ? (n && SECTION_IDS.includes(n) ? n : null)
    : (n && graph.nodes.some((node) => node.id === n) ? n : null);
  return { viewId: v, nodeId };
}

export default function App() {
  // Lazy initializers read the hash ONCE so a deep-linked view/node is the first render, not a flash
  // of Read-me. The initial focus rides the same parse; PddGraph defers the fit until layoutstop.
  const initialRef = useRef(parseHash(typeof window !== 'undefined' ? window.location.hash : ''));
  const [viewId, setViewId] = useState<string>(initialRef.current?.viewId ?? README_ID);
  const [toggles, setToggles] = useState<Toggles>({ showProvisional: true });
  const [selected, setSelected] = useState<string | null>(initialRef.current?.nodeId ?? null);
  const [focus, setFocus] = useState<FocusTarget | null>(
    initialRef.current?.nodeId && initialRef.current.viewId !== GUIDE_ID
      ? { id: initialRef.current.nodeId, nonce: 1 }
      : null,
  );
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [orphanToast, setOrphanToast] = useState(orphanRules.length > 0);
  const nonce = useRef(1);

  // Mirror view/selection into the hash. replaceState never fires hashchange, so this cannot loop
  // with the listener below.
  useEffect(() => {
    const hash = viewId === README_ID ? '' : `#${viewId}${selected ? '/' + encodeURIComponent(selected) : ''}`;
    const current = window.location.hash;
    if (hash === current || (!hash && !current)) return;
    history.replaceState(null, '', hash || window.location.pathname + window.location.search);
  }, [viewId, selected]);

  // Manual hash edits / links clicked inside the page: apply them as a view+select+center jump.
  useEffect(() => {
    const onHash = () => {
      const p = parseHash(window.location.hash);
      if (!p) { setSelected(null); setViewId(README_ID); return; }
      setViewId(p.viewId);
      setSelected(p.nodeId);
      if (p.nodeId && p.viewId !== GUIDE_ID) setFocus({ id: p.nodeId, nonce: ++nonce.current });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const view = useMemo(
    () => (viewId === README_ID ? null : graph.views.find((v) => v.id === viewId) ?? null),
    [viewId],
  );
  const onSelect = useCallback((id: string | null) => setSelected(id), []);
  const flip = (k: keyof Toggles) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  // Jump to another view with the same node still selected and centered. Used by the detail panel's
  // cross-view buttons, so a rule you're reading in one projection can be traced into another.
  const showInView = useCallback((targetViewId: string, nodeId: string) => {
    setViewId(targetViewId);
    setSelected(nodeId);
    setFocus({ id: nodeId, nonce: ++nonce.current });
  }, []);

  // Switch to a tab. There is always exactly one tab selected (the "Read me" tab by default), so a
  // click just selects it — no toggle-off-to-blank. Clear the node selection so the right bar shows
  // the new view's explanation, not a stale node from the previous view.
  const pickView = (id: string) => {
    setSelected(null);
    setViewId(id);
  };
  const goHome = () => { setSelected(null); setViewId(README_ID); };

  const runSearch = (text: string) => {
    const q = text.trim().toLowerCase();
    if (!q) return;
    const hit =
      graph.nodes.find((n) => n.label.toLowerCase() === q) ??
      graph.nodes.find((n) => n.label.toLowerCase().includes(q));
    if (hit) {
      setSelected(hit.id);
      setFocus({ id: hit.id, nonce: ++nonce.current });
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={goHome} title="What PDD is, glossary, and how to use this">PDD Explorer</button>
        <nav className="tabs">
          <button
            className={'tab' + (viewId === README_ID ? ' active' : '')}
            onClick={() => pickView(README_ID)}
            title="Read me: what PDD is and how to use this explorer"
            aria-label="Read me"
            aria-current={viewId === README_ID ? 'page' : undefined}
          >
            <span className="tab-emoji" aria-hidden="true">{VIEW_EMOJI[README_ID]}</span>
            <span className="tab-text">Read me<small>start here</small></span>
          </button>
          <button
            className={'tab' + (viewId === GUIDE_ID ? ' active' : '')}
            onClick={() => pickView(GUIDE_ID)}
            title="Guide: what PDD does, how, and why — with links into everything"
            aria-label="Guide"
            aria-current={viewId === GUIDE_ID ? 'page' : undefined}
          >
            <span className="tab-emoji" aria-hidden="true">📘</span>
            <span className="tab-text">Guide<small>how PDD works</small></span>
          </button>
          {graph.views.map((v) => {
            const [head, tail] = v.title.split('—');
            return (
              <button
                key={v.id}
                className={'tab' + (v.id === viewId ? ' active' : '')}
                onClick={() => pickView(v.id)}
                title={v.title}
                aria-label={v.title}
                aria-current={v.id === viewId ? 'page' : undefined}
              >
                <span className="tab-emoji" aria-hidden="true">{VIEW_EMOJI[v.id] ?? '•'}</span>
                <span className="tab-text">{head.trim()}{tail && <small>{tail.trim()}</small>}</span>
              </button>
            );
          })}
        </nav>
        <input
          className="search"
          list="pdd-labels"
          placeholder="search nodes…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (ALL_LABELS.includes(e.target.value)) runSearch(e.target.value);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch(query); }}
        />
        <datalist id="pdd-labels">
          {ALL_LABELS.map((l) => <option value={l} key={l} />)}
        </datalist>
        <div className="toggles">
          <label><input type="checkbox" checked={toggles.showProvisional} onChange={() => flip('showProvisional')} /> provisional</label>
        </div>
      </header>
      {viewId === GUIDE_ID ? (
        <Guide onJump={showInView} section={selected} onSection={(id) => setSelected(id)} />
      ) : view ? (
        <main className="stage">
          <PddGraph view={view} toggles={toggles} onSelect={onSelect} focus={focus} />
          <DetailPanel view={view} nodeId={selected} toggles={toggles} onShowIn={showInView} onClose={() => setSelected(null)} />
        </main>
      ) : (
        <Home />
      )}
      <Legend />
      {orphanToast && (
        <div className="toast" role="status">
          <span>⚠ {orphanRules.length} rule{orphanRules.length > 1 ? 's' : ''} missing from the dependency graph (no cites/generalizes link, not tagged independent).</span>
          <button className="toast-close" onClick={() => setOrphanToast(false)} aria-label="Dismiss">×</button>
        </div>
      )}
      <button className="menu-trigger" onClick={() => setMenuOpen(true)}>Guide &amp; options</button>
      {menuOpen && (
        <Menu
          query={query}
          setQuery={setQuery}
          runSearch={runSearch}
          labels={ALL_LABELS}
          toggles={toggles}
          flip={flip}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
