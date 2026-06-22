import type { NodeType, EdgeType } from './model';

export const NODE_STYLE: Record<NodeType, { shape: string; color: string }> = {
  foundation:  { shape: 'diamond',         color: '#6b7280' },
  verb:        { shape: 'round-rectangle', color: '#2563eb' },
  pillar:      { shape: 'round-rectangle', color: '#7c3aed' },
  family:      { shape: 'round-rectangle', color: '#0891b2' },
  rule:        { shape: 'ellipse',         color: '#059669' },
  deliverable: { shape: 'round-tag',       color: '#d97706' },
  actor:       { shape: 'hexagon',         color: '#db2777' },
  failure:     { shape: 'round-octagon',   color: '#dc2626' },
  seam:        { shape: 'round-rectangle', color: '#0d9488' },
  dependent:   { shape: 'round-rectangle', color: '#b45309' },
};

export const EDGE_COLOR: Record<EdgeType, string> = {
  'flows-to':   '#3b82f6',
  contains:     '#94a3b8',
  'applies-at': '#22d3ee',
  produces:     '#f59e0b',
  'acts-at':    '#ec4899',
  cites:        '#818cf8',
  generalizes:  '#c084fc',
  mitigates:    '#22c55e',
  affects:      '#f59e0b',
};

export function cytoStylesheet(): any[] {
  const styles: any[] = [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'font-size': 10,
        'text-wrap': 'wrap',
        'text-max-width': '92px',
        'text-valign': 'center',
        'text-halign': 'center',
        color: '#f8fafc',
        'text-outline-width': 1.5,
        'text-outline-color': '#0f172a',
        width: 'label',
        height: 'label',
        padding: '9px',
        'border-width': 2,
        'border-color': '#0f172a',
      },
    },
    {
      selector: ':parent',
      style: {
        'background-opacity': 0.1,
        'border-width': 1,
        'border-color': '#475569',
        'text-valign': 'top',
        'text-halign': 'center',
        color: '#cbd5e1',
        'font-size': 12,
        'font-weight': 'bold',
        'text-outline-width': 0,
        padding: '14px',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'line-color': '#64748b',
        'target-arrow-color': '#64748b',
        'arrow-scale': 0.85,
        opacity: 0.85,
      },
    },
    {
      selector: 'edge[label]',
      style: { label: 'data(label)', 'font-size': 8, color: '#94a3b8', 'text-outline-width': 2, 'text-outline-color': '#0f172a', 'text-rotation': 'autorotate' },
    },
  ];

  for (const [type, s] of Object.entries(NODE_STYLE)) {
    styles.push({ selector: `node[type="${type}"]`, style: { 'background-color': s.color, shape: s.shape } });
  }
  for (const [type, c] of Object.entries(EDGE_COLOR)) {
    styles.push({ selector: `edge[type="${type}"]`, style: { 'line-color': c, 'target-arrow-color': c } });
  }

  styles.push({ selector: 'node[status="provisional"]', style: { 'border-width': 3, 'border-color': '#fbbf24', 'border-style': 'dashed' } });
  styles.push({ selector: 'edge[type="generalizes"]', style: { 'line-style': 'dashed' } });

  styles.push({ selector: '.faded', style: { opacity: 0.4, 'text-opacity': 0.45 } });
  styles.push({ selector: 'node.highlight', style: { 'border-color': '#f8fafc', 'border-width': 4 } });
  styles.push({ selector: 'node:selected', style: { 'border-color': '#f8fafc', 'border-width': 4 } });
  styles.push({ selector: 'edge.highlight', style: { width: 3, opacity: 1 } });
  styles.push({ selector: 'node.searchhit', style: { 'border-color': '#fde047', 'border-width': 5 } });

  return styles;
}
