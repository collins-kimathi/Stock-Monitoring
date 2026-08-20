import {
  BarChart3, Boxes, History, LayoutDashboard, Printer,
  ShoppingCart, Sparkles, Truck
} from 'lucide-react';

const navItems = [
  ['dashboard',  LayoutDashboard, 'Dashboard'],
  ['inventory',  Boxes,           'Inventory'],
  ['sales',      ShoppingCart,    'Sales'],
  ['services',   Printer,         'Cyber Services'],
  ['movements',  History,         'Movements'],
  ['suppliers',  Truck,           'Suppliers'],
  ['reports',    BarChart3,       'Reports'],
];

export function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">D</div>
        <div>
          <strong>Dekar SmartPOS</strong>
          <span>Cyber &amp; Stationaries</span>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map(([key, Icon, label]) => (
          <button
            key={key}
            className={activeView === key ? 'active' : ''}
            onClick={() => setActiveView(key)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-card">
        <Sparkles size={20} />
        <strong>Smart retail mode</strong>
        <span>Stock, services, receipts, and reports in one clean workspace.</span>
      </div>
    </aside>
  );
}