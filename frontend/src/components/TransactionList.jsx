import { money } from '../lib/format';

export function TransactionList({ sales }) {
  return (
    <div className="transaction-list">
      {sales.map((sale) => (
        <div className="transaction-row" key={sale.id}>
          <div>
            <strong>{sale.itemName}</strong>
            <span>{sale.quantity} x {money(sale.unitPrice)} - {sale.paymentMethod}</span>
          </div>
          <b>{money(sale.total)}</b>
        </div>
      ))}
    </div>
  );
}
