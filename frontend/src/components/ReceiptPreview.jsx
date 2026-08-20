import { useMemo } from 'react';
import { ReceiptText } from 'lucide-react';
import { money } from '../lib/format';
import { Panel } from './Panel';

export function ReceiptPreview({ title, quantity, total, paymentMethod }) {
  const receiptNo = useMemo(() => `DKR-${String(Date.now()).slice(-6)}`, [title, quantity, total]);

  return (
    <Panel title="Receipt Preview" icon={ReceiptText}>
      <div className="receipt">
        <strong>Dekar Cyber and Stationaries Limited</strong>
        <span>Receipt #{receiptNo}</span>
        <hr />
        <p>{title || 'Select item'}</p>
        <div><span>Quantity</span><b>{quantity}</b></div>
        <div><span>Payment</span><b>{paymentMethod}</b></div>
        <div><span>Total</span><b>{money(total)}</b></div>
      </div>
    </Panel>
  );
}
