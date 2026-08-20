import {
  BarChart3, Boxes, History, LayoutDashboard,
  Sparkles, Truck
} from 'lucide-react';

const navItems = [
  ['dashboard', LayoutDashboard, 'Dashboard & Alerts'],
  ['inventory', Boxes,           'Inventory Catalog'],
  ['movements', History,         'Stock Movements'],
  ['suppliers', Truck,           'Suppliers & Vendors'],
  ['reports',   BarChart3,       'Stock Valuation']
];

export function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">D</div>
        <div>
          <strong>Dekar IMS</strong>
          <span>Enterprise Inventory</span>
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
        <strong>Enterprise Inventory</strong>
        <span>Stock tracking, bulk CSV, reorder alerts, and audit logs.</span>
      </div>
    </aside>
  );
}