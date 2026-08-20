export function Topbar({ mode }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Dekar Cyber and Stationaries Limited</p>
        <h1>Business Inventory Command Center</h1>
      </div>
      <div className="status-pill">
        <span className={mode === 'mysql' ? 'dot live' : 'dot'} />
        {mode === 'mysql' ? 'MySQL connected' : 'Frontend only'}
      </div>
    </header>
  );
}
