import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Panel } from '../components/Panel';
import { ReceiptPreview } from '../components/ReceiptPreview';
import { money } from '../lib/format';

export function Sales({ products, onRecordSale }) {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const selected = products.find((product) => product.id === productId) || products[0];
  const total = Number(quantity) * Number(selected?.sellingPrice || 0);

  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id);
  }, [products, productId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    await onRecordSale({
      type: 'product',
      productId: selected.id,
      itemName: selected.name,
      quantity,
      unitPrice: selected.sellingPrice,
      costPrice: selected.buyingPrice,
      paymentMethod
    });
  };

  return (
    <section className="split-view">
      <Panel title="Quick Sale" icon={ShoppingCart}>
        <form className="sale-box" onSubmit={submit}>
          <select value={productId} onChange={(event) => setProductId(event.target.value)}>
            {products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}
          </select>
          <input type="number" min="1" max={selected?.quantity || 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option>Cash</option><option>M-Pesa</option><option>Card</option><option>Bank</option>
          </select>
          <div className="total-strip"><span>Total</span><strong>{money(total)}</strong></div>
          <button className="primary-button" type="submit">Complete sale</button>
        </form>
      </Panel>
      <ReceiptPreview title={selected?.name} quantity={quantity} total={total} paymentMethod={paymentMethod} />
    </section>
  );
}
