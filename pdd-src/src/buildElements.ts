import { graph, type GraphView } from './model';
import type { ElementDefinition } from 'cytoscape';

export interface Toggles {
  showProvisional: boolean;
}

export interface TargetElements {
  nodes: ElementDefinition[];
  edges: ElementDefinition[];
}

function visibleNodeIds(view: GraphView, toggles: Toggles): Set<string> {
  const allowed = view.nodeTypes ? new Set(view.nodeTypes) : null;
  const ids = new Set<string>();
  for (const n of graph.nodes) {
    if (n.status === 'provisional' && !toggles.showProvisional) continue;
    if (allowed && !allowed.has(n.type)) continue;
    ids.add(n.id);
  }
  return ids;
}

export function buildElements(view: GraphView, toggles: Toggles): TargetElements {
  const nodeVisible = visibleNodeIds(view, toggles);
  const edgeTypes = new Set<string>(view.edgeTypes);

  const edges = graph.edges.filter(
    (e) => edgeTypes.has(e.type) && nodeVisible.has(e.source) && nodeVisible.has(e.target),
  );

  let nodeIds = nodeVisible;
  if (view.overlay) {
    const endpoints = new Set<string>();
    edges.forEach((e) => { endpoints.add(e.source); endpoints.add(e.target); });
    nodeIds = endpoints;
  }

  // taxonomy nesting: contains-edges become parent relationships, not drawn edges
  const parentOf = new Map<string, string>();
  if (view.grouping) {
    for (const e of graph.edges) {
      if (e.type === 'contains' && nodeIds.has(e.source) && nodeIds.has(e.target)) {
        parentOf.set(e.target, e.source);
      }
    }
  }

  const nodes: ElementDefinition[] = graph.nodes
    .filter((n) => nodeIds.has(n.id))
    .map((n) => ({
      data: {
        id: n.id,
        label: n.label,
        type: n.type,
        status: n.status,
        ...(parentOf.has(n.id) ? { parent: parentOf.get(n.id)! } : {}),
      },
    }));

  const edgeEls: ElementDefinition[] = edges
    .filter((e) => !(view.grouping && e.type === 'contains'))
    .map((e) => ({
      data: { id: e.id, source: e.source, target: e.target, type: e.type, ...(e.label ? { label: e.label } : {}) },
    }));

  return { nodes, edges: edgeEls };
}

export function layoutFor(view: GraphView): any {
  const base = { animate: true, animationDuration: 200, fit: true, padding: 38 };
  switch (view.layout) {
    case 'dagre-lr':
      return { ...base, name: 'dagre', rankDir: 'LR', nodeSep: 28, rankSep: 80 };
    case 'layered-dag':
      return { ...base, name: 'dagre', rankDir: 'TB', nodeSep: 24, rankSep: 60 };
    case 'bipartite':
      return { ...base, name: 'dagre', rankDir: 'LR', nodeSep: 16, rankSep: 240 };
    case 'compound-nested':
      return {
        ...base,
        name: 'fcose',
        quality: 'proof',
        randomize: false, // deterministic: same input -> same layout, so Taxonomy stops re-shuffling
        nodeDimensionsIncludeLabels: true, // key fix: size boxes to their labels so groups don't overlap
        packComponents: true,
        nodeSeparation: 150,
        nodeRepulsion: 9000,
        gravity: 0.2,
        gravityCompound: 1.4,
        gravityRangeCompound: 1.6,
        tile: true,
        animationDuration: 250,
      };
    case 'inherit':
    default:
      return { ...base, name: 'dagre', rankDir: 'LR', nodeSep: 24, rankSep: 90 };
  }
}