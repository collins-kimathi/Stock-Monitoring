import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Printer } from 'lucide-react';
import { Panel } from '../components/Panel';
import { money } from '../lib/format';

export function Services({ services, onRecordSale }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const selected = services.find((service) => service.id === serviceId) || services[0];
  const total = Number(quantity) * Number(selected?.price || 0);

  useEffect(() => {
    if (!serviceId && services[0]) setServiceId(services[0].id);
  }, [services, serviceId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    await onRecordSale({
      type: 'service',
      itemName: selected.name,
      quantity,
      unitPrice: selected.price,
      costPrice: 0,
      paymentMethod: 'M-Pesa'
    });
  };

  return (
    <section className="split-view">
      <Panel title="Cyber Service Sale" icon={BriefcaseBusiness}>
        <form className="sale-box" onSubmit={submit}>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            {services.map((service) => <option value={service.id} key={service.id}>{service.name} - {money(service.price)}</option>)}
          </select>
          <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          <div className="total-strip"><span>Total</span><strong>{money(total)}</strong></div>
          <button className="primary-button" type="submit">Record service</button>
        </form>
      </Panel>
      <Panel title="Service Menu" icon={Printer}>
        <div className="service-grid">
          {services.map((service) => (
            <button key={service.id} onClick={() => setServiceId(service.id)}>
              <span>{service.category}</span>
              <strong>{service.name}</strong>
              <b>{money(service.price)} / {service.unit}</b>
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}
