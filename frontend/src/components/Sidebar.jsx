import { BarChart3, Boxes, LayoutDashboard, Printer, ShoppingCart, Sparkles } from 'lucide-react';

const navItems = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['inventory', Boxes, 'Inventory'],
  ['sales', ShoppingCart, 'Sales'],
  ['services', Printer, 'Cyber Services'],
  ['reports', BarChart3, 'Reports']
];

export function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="sidebar">

      <div className="brand-block">
        <div className="brand-mark">D</div>
        <div>
          <strong>Dekar SmartPOS</strong>
          <span>Cyber & Stationaries</span>
        </div>
      </div>
      <nav className="nav-list">
        {navItems.map(([key, Icon, label]) => (
          <button className={activeView === key ? 'active' : ''} key={key} onClick={() => setActiveView(key)}>
            <Icon size={19} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <Sparkles size={22} />
        <strong>Smart retail mode</strong>
        <span>Stock, services, receipts, and reports in one clean workspace.</span>
      </div>
    </aside>
  );
} 