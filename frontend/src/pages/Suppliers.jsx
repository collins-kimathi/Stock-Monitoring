import { useState } from 'react';
import { Contact, Plus, Search, Truck, X } from 'lucide-react';
import { Panel } from '../components/Panel';
import { Modal } from '../components/Modal';
import { Field } from '../components/Field';
import { EmptyState } from '../components/EmptyState';

const blank = { name: '', category: '', contactPerson: '', phone: '', email: '', location: '' };

export function Suppliers({ suppliers, onAddSupplier, onRemoveSupplier }) {
    const [query, setQuery] = useState('');
  const [form, setForm] = useState(blank);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const filtered = suppliers.filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || String(s.category || '').toLowerCase().includes(q);
  });

    const submit = async (event) => {
    event.preventDefault();
    await onAddSupplier({ ...form, category: form.category || null });
    setForm(blank);
    setIsAdding(false);
  };

  return (
    <section className="view-stack">
      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search suppliers" />
        </label>
                  <button className="secondary-button" onClick={() => { setForm(blank); setIsAdding(true); }}><Plus size={17} /> Add supplier</button>
      </div>

      {filtered.length === 0 ? (
        <Panel title="Suppliers" icon={Truck}>
          <EmptyState
            title={suppliers.length ? 'No suppliers match' : 'No suppliers yet'}
            hint={suppliers.length ? 'Try a different search.' : 'Add the suppliers you buy stock from so items can be linked for reordering.'}
            action={suppliers.length ? null : <button className="secondary-button" onClick={() => { setForm(blank); setIsAdding(true); }}>Add a supplier</button>}
          />
        </Panel>
      ) : (
        <div className="supplier-grid">
          {filtered.map((s) => (
            <article className="supplier-card" key={s.id}>
              <div className="supplier-head">
                <div className="supplier-mark">{s.name.slice(0, 1).toUpperCase()}</div>
                <button className="icon-button danger" aria-label="Remove" title="Remove" onClick={() => setConfirmId(s.id)}>
                  <X size={15} />
                </button>
              </div>
              <strong>{s.name}</strong>
              <span>{s.category || 'General supply'}</span>
              <div className="supplier-lines">
                {s.contactPerson ? <p><Contact size={14} /> {s.contactPerson}</p> : null}
                {s.phone ? <p>{s.phone}</p> : null}
                {s.email ? <p>{s.email}</p> : null}
                {s.location ? <p>{s.location}</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}
{isAdding ? (
        <Modal
          title="Add supplier"
          icon={Plus}
          onClose={() => { setForm(blank); setIsAdding(false); }}
          footer={<button className="primary-button" form="supplier-form" type="submit">Save supplier</button>}
        >
          <form id="supplier-form" className="modal-form" onSubmit={submit}>
            <Field label="Company / supplier name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <div className="field-row">
              <Field label="Category they supply"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Books" /></Field>
              <Field label="Contact person"><input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></Field>
            </div>
            <div className="field-row">
              <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            </div>
            <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Nairobi" /></Field>
          </form>
        </Modal>
      ) : null}

      {confirmId ? (
        <Modal
          title="Remove supplier"
          onClose={() => setConfirmId(null)}
          footer={
            <>
              <button className="secondary-button" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="danger-button" onClick={() => { onRemoveSupplier(confirmId); setConfirmId(null); }}>Remove</button>
            </>
          }
        >
          <p className="modal-note">This hides the supplier. Items already linked to them keep their history.</p>
        </Modal>
      ) : null}
    </section>
  );
}