import { graph, type GraphEdge, type GraphView } from './model';
import { buildElements, type Toggles } from './buildElements';
import { VIEW_HELP, EDGE_HELP, VIEW_EMOJI } from './copy';

const labelOf = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;
const headOf = (v: GraphView) => v.title.split('—')[0].trim();

// The structural projections worth jumping between for a single rule: where it sits (taxonomy) and what
// it builds on (dependency). A target is only offered when it's a different view AND actually renders the
// node — dependency hides rules with no cites/generalizes edge, so the button must not lead to an empty stage.
const CROSS_VIEW_IDS = ['taxonomy', 'dependency'];

function crossViewsFor(nodeId: string, currentViewId: string | undefined, toggles: Toggles): GraphView[] {
  return graph.views.filter(
    (v) =>
      CROSS_VIEW_IDS.includes(v.id) &&
      v.id !== currentViewId &&
      buildElements(v, toggles).nodes.some((n) => n.data.id === nodeId),
  );
}

function group(list: GraphEdge[], dir: 'out' | 'in') {
  const m = new Map<string, string[]>();
  for (const e of list) {
    const other = dir === 'out' ? e.target : e.source;
    const arrow = dir === 'out' ? '→' : '←';
    const key = dir === 'out' ? e.type : `${e.type} (in)`;
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(`${arrow} ${labelOf(other)}${e.label ? ` (${e.label})` : ''}`);
  }
  return [...m.entries()];
}

export default function DetailPanel({ view, nodeId, toggles, onShowIn, onClose }: { view: GraphView | null; nodeId: string | null; toggles: Toggles; onShowIn: (viewId: string, nodeId: string) => void; onClose: () => void }) {
  // 1. a node is selected -> its full detail
  const node = nodeId ? graph.nodes.find((n) => n.id === nodeId) : null;
  if (node) {
    const groups = [
      ...group(graph.edges.filter((e) => e.source === node.id), 'out'),
      ...group(graph.edges.filter((e) => e.target === node.id), 'in'),
    ];
    const crossViews = node.type === 'rule' ? crossViewsFor(node.id, view?.id, toggles) : [];
    return (
      <aside className="panel panel-open">
        <div className="panel-mobilebar"><button className="panel-close" onClick={onClose} aria-label="Close details">×</button></div>
        <h2>{node.label}</h2>
        <div className="badges">
          <span className="badge">{node.type}</span>
          <span className={'badge ' + node.status}>{node.status}</span>
          {node.layer && <span className="badge">{node.layer}</span>}
          {node.tags?.map((t) => <span className="badge" key={t}>{t}</span>)}
        </div>
        {crossViews.length > 0 && (
          <div className="crossview">
            <span className="crossview-label">trace this rule</span>
            <div className="crossview-btns">
              {crossViews.map((v) => (
                <button key={v.id} className="crossview-btn" onClick={() => onShowIn(v.id, node.id)} title={v.title}>
                  <span aria-hidden="true">{VIEW_EMOJI[v.id] ?? '•'}</span> {headOf(v)}
                </button>
              ))}
            </div>
          </div>
        )}
        {node.status === 'provisional' && node.confirmWhen && (
          <div className="confirm-when">
            <span className="confirm-when-label">confirm when</span>
            <p>{node.confirmWhen}</p>
          </div>
        )}
        {node.confirmedBy && (
          <div className="confirmed-by">
            <span className="confirmed-by-label">confirmed</span>
            <p>{node.confirmedBy}</p>
          </div>
        )}
        {node.summary && <p className="summary">{node.summary}</p>}
        {node.body && <div className="body">{node.body}</div>}
        {groups.length > 0 && <div className="rel-head">relationships</div>}
        {groups.map(([title, items]) => (
          <div className="edges-group" key={title}>
            <h4>{title}</h4>
            <ul>{items.map((it, j) => <li key={j}>{it}</li>)}</ul>
          </div>
        ))}
      </aside>
    );
  }

  // 2. an edge is selected -> explain the relationship (was the old "Unknown node." dead end)
  const edge = nodeId ? graph.edges.find((e) => e.id === nodeId) : null;
  if (edge) {
    return (
      <aside className="panel panel-open">
        <div className="panel-mobilebar"><button className="panel-close" onClick={onClose} aria-label="Close details">×</button></div>
        <h2>Relationship</h2>
        <div className="badges">
          <span className="badge">{edge.type}</span>
          {edge.label && <span className="badge">{edge.label}</span>}
        </div>
        <p className="summary">{labelOf(edge.source)} → {labelOf(edge.target)}</p>
        <p className="viewhelp">{EDGE_HELP[edge.type] ?? `A "${edge.type}" relationship.`}</p>
        <p className="hint">An edge is a relationship between two nodes. Click either node to read it in full.</p>
      </aside>
    );
  }

  // 3. a view is open but nothing is selected -> explain the view
  if (view) {
    const [head, tail] = view.title.split('—');
    return (
      <aside className="panel">
        <h2>{head.trim()}</h2>
        {tail && <p className="summary">{tail.trim()}</p>}
        <p className="viewhelp">{VIEW_HELP[view.id] ?? ''}</p>
        <p className="hint">Click any node to inspect it. Double-click a node to zoom in; double-click the background to zoom out. The “Read me” tab has the overview and glossary.</p>
      </aside>
    );
  }

  // 4. fallback (the no-view home is rendered by App, not here)
  return <aside className="panel empty">Pick a view to begin.</aside>;
}
