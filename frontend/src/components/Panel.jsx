export function Panel({ title, icon: Icon, children, className = '' }) {
  return (
    <article className={`panel ${className}`}>
      <div className="panel-header">
        <h2><Icon size={20} />{title}</h2>
      </div>
      {children}
    </article>
  );
}
