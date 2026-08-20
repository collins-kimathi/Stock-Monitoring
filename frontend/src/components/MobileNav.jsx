import { useState } from 'react';
import {
  BarChart3, Boxes, History, LayoutDashboard,
  Menu, Truck, X, Sparkles
} from 'lucide-react';

const navItems = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['inventory', Boxes, 'Inventory Catalog'],
  ['movements', History, 'Stock Movements'],
  ['suppliers', Truck, 'Suppliers & Vendors'],
  ['reports', BarChart3, 'Stock Valuation']
];

export function MobileNav({ activeView, setActiveView, mode }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNav = (key) => {
    setActiveView(key);
    setIsOpen(false);
  };

  return (
    <>
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <div className="brand-mark small">D</div>
          <div className="mobile-brand-title">
            <strong>Dekar IMS</strong>
            <span>Inventory System</span>
          </div>
        </div>

        <div className="mobile-top-actions">
          <div className="status-pill small">
            <span className={mode === 'mysql' ? 'dot live' : 'dot'} />
            <span>{mode === 'mysql' ? 'Supabase' : 'Offline'}</span>
          </div>

          <button
            className="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-block">
                <div className="brand-mark">D</div>
                <div>
                  <strong>Dekar SmartPOS</strong>
                  <span>Inventory Command Center</span>
                </div>
              </div>
              <button className="icon-button" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              {navItems.map(([key, Icon, label]) => (
                <button
                  key={key}
                  className={`mobile-drawer-btn ${activeView === key ? 'active' : ''}`}
                  onClick={() => handleNav(key)}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="mobile-drawer-footer">
              <div className="sidebar-card">
                <Sparkles size={18} />
                <strong>Mobile Ready</strong>
                <span>Optimized for smartphones and tablet barcode workflows.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
