import { useEffect, useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

export function Topbar({ mode }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString('en-KE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const timeStr = now.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Dekar Cyber and Stationaries Limited</p>
        <h1>Business Inventory Command Center</h1>
      </div>
      <div className="topbar-right">
        <div className="status-pill">
          <span className={mode === 'mysql' ? 'dot live' : 'dot'} />
          {mode === 'mysql' ? (
            <>
              <CheckCircle2 size={13} />
              Connected to Supabase
            </>
          ) : (
            <>
              <Zap size={13} />
              Frontend only
            </>
          )}
        </div>
        <span className="topbar-clock">{dateStr} · {timeStr}</span>
      </div>
    </header>
  );
}
