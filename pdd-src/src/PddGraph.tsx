import { useEffect, useRef } from 'react';
import cytoscape, { type Core } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import fcose from 'cytoscape-fcose';
import { cytoStylesheet } from './cytoStyle';
import { buildElements, layoutFor, type Toggles } from './buildElements';
import type { GraphView } from './model';

try { cytoscape.use(dagre); } catch { /* already registered */ }
try { cytoscape.use(fcose); } catch { /* already registered */ }

export interface FocusTarget { id: string; nonce: number; }

interface Props {
  view: GraphView;
  toggles: Toggles;
  onSelect: (id: string | null) => void;
  focus: FocusTarget | null;
}

/** Diff the current graph toward the target so persistent nodes keep identity and animate (morph). */
function morphTo(cy: Core, view: GraphView, toggles: Toggles) {
  const { nodes, edges } = buildElements(view, toggles);
  const targetIds = new Set(nodes.map((n) => n.data.id as string));

  cy.batch(() => {
    cy.edges().remove();

    // 1. add nodes that don't exist yet (without parent — parents wired in step 2)
    for (const nd of nodes) {
      if (cy.getElementById(nd.data.id as string).empty()) {
        const { parent, ...data } = nd.data as any;
        cy.add({ group: 'nodes', data });
      }
    }
    // 2. re-parent every target node BEFORE removing old parents (so survivors aren't deleted with them)
    for (const nd of nodes) {
      const ele = cy.getElementById(nd.data.id as string);
      const want = ((nd.data as any).parent ?? null) as string | null;
      const cur = ele.parent().nonempty() ? (ele.parent() as any).id() as string : null;
      if (cur !== want) ele.move({ parent: want });
    }
    // 3. remove nodes no longer in the target (their target children already moved out)
    cy.nodes().filter((n) => !targetIds.has(n.id())).remove();
    // 4. add the target edges
    cy.add(edges.map((e) => ({ group: 'edges' as const, data: e.data })));
  });

  cy.layout(layoutFor(view)).run();
}

function rebuild(cy: Core, view: GraphView, toggles: Toggles) {
  const { nodes, edges } = buildElements(view, toggles);
  cy.elements().remove();
  cy.add([...nodes, ...edges]);
  cy.layout(layoutFor(view)).run();
}

export default function PddGraph({ view, toggles, onSelect, focus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: cytoStylesheet() as any,
      wheelSensitivity: 2,        // faster wheel zoom (was sluggish at 0.2)
      minZoom: 0.1,
      maxZoom: 4,
    });
    cyRef.current = cy;

    // single tap = select / deselect; double tap = zoom in (node) / zoom out (background)
    let lastTime = 0;
    let lastId = '';
    cy.on('tap', (evt: any) => {
      const isBg = evt.target === cy;
      const id = isBg ? '__bg__' : evt.target.id();
      const now = Date.now();
      const isDouble = now - lastTime < 300 && id === lastId;
      lastTime = now;
      lastId = id;
      if (isDouble) {
        if (isBg) {
          cy.animate({ fit: { eles: cy.elements(), padding: 40 } }, { duration: 180 });
        } else {
          cy.animate({ fit: { eles: evt.target.closedNeighborhood(), padding: 70 } }, { duration: 180 });
        }
        return;
      }
      onSelectRef.current(isBg ? null : id);
    });

    // gentle hover: dim non-neighbours but spare the group boxes; highlight the neighbourhood
    cy.on('mouseover', 'node', (evt: any) => {
      const node = evt.target;
      const nh = node.closedNeighborhood();
      cy.elements().difference(nh).not(':parent').addClass('faded');
      node.addClass('highlight');
      nh.connectedEdges().addClass('highlight');
    });
    cy.on('mouseout', 'node', () => cy.elements().removeClass('faded highlight'));

    return () => { cy.destroy(); cyRef.current = null; };
  }, []);

  // Render the new view/toggles. The dagre views REBUILD (clear + re-add in the graph's fixed element
  // order) so the live dagre layout is deterministic — the same input order yields the same layout, so a
  // view no longer reshuffles when you revisit it. fcose (Taxonomy) keeps the incremental morph, which
  // preserves its already-good positions. Both paths run a real layout, which is what reliably repaints.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    try {
      if (view.layout === 'compound-nested') morphTo(cy, view, toggles);
      else rebuild(cy, view, toggles);
    } catch (e) {
      console.warn('layout failed; rebuilding view', e);
      rebuild(cy, view, toggles);
    }
  }, [view, toggles]);

  // search / focus: center + zoom on a node, highlight it
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !focus) return;
    const ele = cy.getElementById(focus.id);
    if (ele.nonempty()) {
      cy.animate({ fit: { eles: ele.closedNeighborhood(), padding: 90 } }, { duration: 200 });
      cy.elements().removeClass('searchhit');
      ele.addClass('searchhit');
    }
  }, [focus]);

  return <div ref={containerRef} className="cy-canvas" />;
}
