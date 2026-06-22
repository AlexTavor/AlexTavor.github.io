// User-facing copy for the explorer: the home/about text, a glossary of the terms the graph uses, a
// one-line help per view, and what each edge type means. Kept here (not in pdd-graph.json) because it
// is app chrome, not graph data.

export const PDD_INTRO =
  "PDD is Proof-Driven Development: a method for changing code you do not fully trust (legacy or AI-generated) without breaking it. It runs in five moves. MAP recovers what the code actually does. PIN locks that behavior in tests. CARVE cuts the work into small, de-risked units. SHIP makes each change under mechanical gates. PROVE shows the behavior was preserved and the debt burned down. The bet behind it: writing code is cheap and expert attention is the bottleneck, so the method spends proof where a mistake would be expensive and skips it where it would not.";

export interface GlossaryEntry { term: string; def: string; }

export const GLOSSARY: GlossaryEntry[] = [
  { term: "The five moves (verbs)", def: "MAP recovers ground truth, PIN locks current behavior, CARVE sizes and de-risks the work, SHIP changes under gates, PROVE shows behavior preserved. The graph calls these 'verbs'." },
  { term: "Pillar, family, rule", def: "The rules are grouped: a pillar is a top-level theme, a family is a set of related rules under it, and a rule is one checkable constraint." },
  { term: "Deliverable", def: "A concrete artifact a move produces, such as the System Truth Atlas or a characterization suite." },
  { term: "Actor", def: "A role in an engagement: the operator (the human owner whose attention is the bottleneck), the builder (the agent doing the work), and the auditor." },
  { term: "Failure", def: "A way things go wrong that a rule exists to prevent, such as an adequacy gap or behavior drift. The Threat view links each failure to the rules that defend against it." },
  { term: "Status: core, provisional, candidate", def: "core is audited and proven; provisional is integrated but not yet proven on enough real projects, drawn dashed; candidate is proposed but not yet accepted." },
];

export const INSTRUCTIONS: string[] = [
  "Pick a view from the tabs above. Click the active tab again to come back to this overview.",
  "Click any node to read its full text and relationships. Double-click a node to zoom to its neighborhood; double-click the background to zoom back out.",
  "Click an edge to see what the relationship means. Use search to jump to a node by name.",
  "Toggle 'provisional' to show or hide newer, not-yet-proven rules.",
];

// One help line per view (keyed by view id), shown in the right bar when a view is open but no node is
// selected. Says what the view shows and what its edges mean.
export const VIEW_HELP: Record<string, string> = {
  flow: "How an engagement runs. The five moves in order, the deliverables each one produces, and the actors involved. Follow the arrows from left to right to read the lifecycle.",
  taxonomy: "What the rules are. Every rule, nested into its family and pillar. A box inside a box means 'is part of'. This is the table of contents for the method.",
  application: "Which gates fire when. Each rule is linked to the move where it applies. Use it to see what discipline a given move demands. Rules with no move assignment are hidden here.",
  dependency: "How rules reinforce each other. A 'cites' link means one rule builds on another; 'generalizes' means one is the broader form of the other. Rules in no such relationship are hidden here.",
  threat: "What each gate defends against. Each failure mode is linked by 'mitigates' to the rules that prevent it, so you can see why a rule exists. Rules tied to no failure are hidden here.",
};

// What each edge TYPE means, shown when an edge is clicked (a definition of the relationship, so it
// reads correctly whichever way the edge points).
export const EDGE_HELP: Record<string, string> = {
  "flows-to": "One move leads to the next in the engagement.",
  contains: "The first is made up of the second: a pillar holds families, a family holds rules.",
  "applies-at": "A rule applies at the move it is connected to.",
  produces: "A move produces this deliverable.",
  "acts-at": "An actor acts at this move.",
  cites: "One rule builds on another.",
  generalizes: "One rule is the broader form of another.",
  mitigates: "A rule defends against this failure.",
  affects: "A change to this seam affects this dependent (its blast radius).",
};

// Compact icon per view, shown on the tabs when the screen is too narrow for the text label.
export const VIEW_EMOJI: Record<string, string> = {
  flow: "🔀",
  taxonomy: "🗂️",
  application: "🎯",
  dependency: "🕸️",
  threat: "🛡️",
  blast: "💥",
};
