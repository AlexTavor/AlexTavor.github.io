import { useMemo, useState, useCallback, useRef } from 'react';
import { graph } from './model';
import PddGraph, { type FocusTarget } from './PddGraph';
import DetailPanel from './DetailPanel';
import Home from './Home';
import Legend from './Legend';
import Menu from './Menu';
import { VIEW_EMOJI } from './copy';
import type { Toggles } from './buildElements';

const ALL_LABELS = [...new Set(graph.nodes.map((n) => n.label))].sort();

export default function App() {
  // viewId === null is the home/overview state (no tab selected).
  const [viewId, setViewId] = useState<string | null>(null);
  const [toggles, setToggles] = useState<Toggles>({ showProvisional: true });
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const nonce = useRef(0);

  const view = useMemo(() => (viewId ? graph.views.find((v) => v.id === viewId) ?? null : null), [viewId]);
  const onSelect = useCallback((id: string | null) => setSelected(id), []);
  const flip = (k: keyof Toggles) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  // Select a tab, or toggle it off (back to home). Clear the node selection either way so the right bar
  // shows the new view's explanation, not a stale node from the previous view.
  const pickView = (id: string) => {
    setSelected(null);
    setViewId((cur) => (cur === id ? null : id));
  };
  const goHome = () => { setSelected(null); setViewId(null); };

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
          {graph.views.map((v) => {
            const [head, tail] = v.title.split('—');
            return (
              <button
                key={v.id}
                className={'tab' + (v.id === viewId ? ' active' : '')}
                onClick={() => pickView(v.id)}
                title={v.title}
                aria-label={v.title}
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
      {view ? (
        <main className="stage">
          <PddGraph view={view} toggles={toggles} onSelect={onSelect} focus={focus} />
          <DetailPanel view={view} nodeId={selected} onClose={() => setSelected(null)} />
        </main>
      ) : (
        <Home />
      )}
      <Legend />
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
