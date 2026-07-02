import Legend from './Legend';
import { GLOSSARY } from './copy';
import { rich } from './richText';
import type { Toggles } from './buildElements';

// Mobile-only modal: the optional bits (search, the provisional toggle, the legend, and the glossary)
// collected behind one button so the small-screen layout stays uncluttered.
interface Props {
  query: string;
  setQuery: (s: string) => void;
  runSearch: (s: string) => void;
  labels: string[];
  toggles: Toggles;
  flip: (k: keyof Toggles) => void;
  onClose: () => void;
}

export default function Menu({ query, setQuery, runSearch, labels, toggles, flip, onClose }: Props) {
  const search = (text: string) => { runSearch(text); onClose(); };
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-head">
          <b>Guide &amp; options</b>
          <button className="menu-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <input
          className="menu-search"
          list="pdd-labels-menu"
          placeholder="search nodes…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (labels.includes(e.target.value)) search(e.target.value);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') search(query); }}
        />
        <datalist id="pdd-labels-menu">{labels.map((l) => <option value={l} key={l} />)}</datalist>

        <label className="menu-toggle">
          <input type="checkbox" checked={toggles.showProvisional} onChange={() => flip('showProvisional')} />
          show provisional rules
        </label>

        <div className="menu-section">
          <b>Legend</b>
          <Legend />
        </div>

        <div className="menu-section">
          <b>Glossary</b>
          <dl className="glossary">
            {GLOSSARY.map((g) => (
              <div className="g-entry" key={g.term}><dt>{g.term}</dt><dd>{rich(g.def)}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
