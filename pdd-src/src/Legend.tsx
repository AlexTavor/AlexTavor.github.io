import { NODE_STYLE, EDGE_COLOR } from './cytoStyle';

export default function Legend() {
  return (
    <div className="legend">
      <div className="group">
        <b>nodes</b>
        {Object.entries(NODE_STYLE).map(([t, s]) => (
          <span className="item" key={t}><span className="swatch" style={{ background: s.color }} />{t}</span>
        ))}
      </div>
      <div className="group">
        <b>edges</b>
        {Object.entries(EDGE_COLOR).map(([t, c]) => (
          <span className="item" key={t}><span className="swatch line" style={{ background: c }} />{t}</span>
        ))}
      </div>
      <div className="group">
        <b>status</b>
        <span className="item"><span className="swatch" style={{ background: '#475569', border: '2px dashed #fbbf24' }} />provisional</span>
      </div>
    </div>
  );
}
