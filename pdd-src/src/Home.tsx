import { PDD_INTRO, PDD_INTRO_HIGHLIGHT, EXPLORER_ABOUT, GLOSSARY, INSTRUCTIONS } from './copy';
import { rich } from './richText';

// Split the intro on the highlighted phrase so it can be wrapped for emphasis without duplicating the
// text. If the phrase ever stops matching, `after` is undefined and the intro renders unchanged.
const [introBefore, introAfter] = PDD_INTRO.split(PDD_INTRO_HIGHLIGHT);

// The content of the default "Read me" tab (viewId === README_ID): what PDD is, how to use the
// explorer, and a glossary of the terms the graph uses.
export default function Home() {
  return (
    <div className="home">
      <div className="home-inner">
        <h1>PDD Explorer</h1>
        <p className="lead">
          {rich(introBefore)}
          <strong className="hl">{PDD_INTRO_HIGHLIGHT}</strong>
          {rich(introAfter)}
        </p>
        <p className="about">{rich(EXPLORER_ABOUT)}</p>

        <h2>How to use this</h2>
        <ul className="instructions">
          {INSTRUCTIONS.map((s, i) => <li key={i}>{rich(s)}</li>)}
        </ul>

        <h2>Glossary</h2>
        <dl className="glossary">
          {GLOSSARY.map((g) => (
            <div className="g-entry" key={g.term}>
              <dt>{g.term}</dt>
              <dd>{rich(g.def)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
