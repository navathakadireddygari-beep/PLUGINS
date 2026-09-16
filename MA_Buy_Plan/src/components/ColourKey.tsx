export default function ColourKey() {
  return (
    <div className="bp-colour-key">
      <span className="bp-colour-key-label">Colour Key</span>
      <div className="bp-key-item">
        <div className="bp-swatch bp-swatch--purple" />
        <span className="bp-key-text">
          <strong>Purple</strong> — Populated from Data Lake (Oracle)
        </span>
      </div>
      <div className="bp-key-item">
        <div className="bp-swatch bp-swatch--blue" />
        <span className="bp-key-text">
          <strong>Blue</strong> — Populated from Financial Evaluation (GIS)
        </span>
      </div>
    </div>
  );
}
