/**
 * Panel — a card-style container with a header.
 * `accent` is optional; the CSS handles the default indigo styling.
 */
export function Panel({ title, icon: Icon, children, className = '' }) {
  return (
    <article className={`panel ${className}`}>
      <div className="panel-header">
        <h2>
          <Icon size={18} />
          {title}
        </h2>
      </div>
      {children}
    </article>
  );
}
