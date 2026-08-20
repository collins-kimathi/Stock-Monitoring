import { PackageOpen } from 'lucide-react';

export function EmptyState({ title = 'Nothing here yet', hint, action }) {
  return (
    <div className="empty-state">
      <PackageOpen size={34} />
      <strong>{title}</strong>
      {hint ? <span>{hint}</span> : null}
      {action ? <div className="empty-actions">{action}</div> : null}
    </div>
  );
}