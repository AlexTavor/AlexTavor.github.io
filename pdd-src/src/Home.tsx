import { PDD_INTRO, GLOSSARY, INSTRUCTIONS } from './copy';

// Shown when no view (tab) is selected: what PDD is, how to use the explorer, and a glossary of the
// terms the graph uses.
export default function Home() {
  return (
    <div className="home">
      <div className="home-inner">
        <h1>PDD Explorer</h1>
        <p className="lead">{PDD_INTRO}</p>

        <h2>How to use this</h2>
        <ul className="instructions">
          {INSTRUCTIONS.map((s, i) => <li key={i}>{s}</li>)}
        </ul>

        <h2>Glossary</h2>
        <dl className="glossary">
          {GLOSSARY.map((g) => (
            <div className="g-entry" key={g.term}>
              <dt>{g.term}</dt>
              <dd>{g.def}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
