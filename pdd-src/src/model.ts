import { z } from 'zod';
import rawGraph from '../pdd-graph.json';
import rawRefactor from '../refactor-graph.json';
import rawBodies from '../pdd-bodies.json';

const NodeSchema = z.object({
  id: z.string(),
  // 'seam'/'dependent' added for the Phase-2 refactor projection (a code-derived blast radius);
  // the rest are the methodology graph's node types.
  type: z.enum(['foundation', 'verb', 'pillar', 'family', 'rule', 'deliverable', 'actor', 'failure', 'seam', 'dependent']),
  label: z.string(),
  summary: z.string().optional().default(''),
  status: z.enum(['core', 'provisional', 'candidate']),
  body: z.string().optional(),
  layer: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // For provisional rules: the strict, observable evidence that would confirm the rule (promote it to core).
  confirmWhen: z.string().optional(),
  // For rules promoted from provisional: the real-run evidence that confirmed them (why this rule is core).
  confirmedBy: z.string().optional(),
});

const EdgeSchema = z.object({
  id: z.string(),
  type: z.enum(['flows-to', 'contains', 'applies-at', 'produces', 'acts-at', 'cites', 'generalizes', 'mitigates', 'affects']),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  note: z.string().optional(),
});

const ViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  edgeTypes: z.array(z.string()),
  layout: z.string(),
  nodeTypes: z.array(z.string()).optional(),
  grouping: z.string().optional(),
  lanesBy: z.string().optional(),
  overlay: z.boolean().optional(),
  defaultGranularity: z.string().optional(),
});

const GraphSchema = z.object({
  meta: z.any(),
  nodeTypes: z.any().optional(),
  edgeTypes: z.any().optional(),
  statuses: z.any().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  views: z.array(ViewSchema),
});

export type NodeType = z.infer<typeof NodeSchema>['type'];
export type EdgeType = z.infer<typeof EdgeSchema>['type'];
export type Status = z.infer<typeof NodeSchema>['status'];
export type GraphNode = z.infer<typeof NodeSchema>;
export type GraphEdge = z.infer<typeof EdgeSchema>;
export type GraphView = z.infer<typeof ViewSchema>;
export type Graph = z.infer<typeof GraphSchema>;

function loadGraph(): Graph {
  // ?graph=refactor renders the code-derived blast-radius projection; default is the methodology graph.
  const which = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('graph');
  const source = which === 'refactor' ? rawRefactor : rawGraph;
  const parsed = GraphSchema.safeParse(source);
  if (!parsed.success) {
    console.error('pdd-graph.json failed validation:', parsed.error.format());
    throw new Error('pdd-graph.json failed schema validation — see console.');
  }
  const ids = new Set(parsed.data.nodes.map((n) => n.id));
  for (const e of parsed.data.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) {
      throw new Error(`Edge ${e.id} references a missing node: ${e.source} / ${e.target}`);
    }
  }
  // merge full body text from the separate content file
  const bodies = rawBodies as Record<string, string>;
  parsed.data.nodes = parsed.data.nodes.map((n) => ({ ...n, body: bodies[n.id] ?? n.body }));
  return parsed.data;
}

export const graph = loadGraph();

// A rule with no cites/generalizes edge silently vanishes from the Dependency view (overlay:true). That
// is only acceptable when it's a deliberate axiom — so require such rules to be tagged "independent".
// Anything neither linked nor tagged is an authoring gap: warned here and surfaced as a toast in the app.
function findOrphanRules(g: Graph): string[] {
  const linked = new Set<string>();
  for (const e of g.edges) {
    if (e.type === 'cites' || e.type === 'generalizes') { linked.add(e.source); linked.add(e.target); }
  }
  return g.nodes
    .filter((n) => n.type === 'rule' && !linked.has(n.id) && !(n.tags ?? []).includes('independent'))
    .map((n) => n.id);
}

export const orphanRules = findOrphanRules(graph);
if (orphanRules.length) {
  console.warn(
    `[pdd] ${orphanRules.length} rule(s) are neither linked in the dependency graph nor tagged "independent" — ` +
      `they will not appear in the Dependency view:`,
    orphanRules,
  );
}
