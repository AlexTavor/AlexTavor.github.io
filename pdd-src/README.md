# PDD Explorer (source)

Source for the interactive map of **Proof-Driven Development**, served at
**https://alextavor.github.io/pdd/**.

React + Vite + TypeScript over a Cytoscape.js canvas. The methodology is one typed model
(`pdd-graph.json` + `pdd-bodies.json`); edit the JSON and the map updates. Responsive: a full
multi-panel layout on wide screens, a compact layout on phones (emoji view tabs, a collapsible
detail sheet, and an options modal holding search, the provisional toggle, the legend, and the glossary).

## Build / publish

```sh
npm install
npm run build      # writes the built site into ../pdd (the served directory)
```

`npm run dev` runs a local dev server at `/`. The production build is rooted at `/pdd/`. Commit the
resulting `../pdd/` together with any source change and push — the push is the deploy.

## Files
- `pdd-graph.json` — structural model (nodes, edges, views).
- `pdd-bodies.json` — full node text, merged onto nodes by `id`.
- `refactor-graph.json` — the code-derived blast-radius projection (`?graph=refactor`).
- `src/copy.ts` — app chrome: intro, glossary, per-view help, edge definitions, view icons.
