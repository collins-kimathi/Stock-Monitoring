import { CheckCircle2 } from 'lucide-react';

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="alert" aria-live="polite">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}
