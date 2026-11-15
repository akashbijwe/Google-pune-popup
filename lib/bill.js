import { GST_RATE } from './brand';

// Menu prices are treated as pre-tax. A quiz discount reduces the taxable amount, then GST is
// added and split into CGST + SGST. Works in paise internally so totals never drift.
export function computeBill(orders, discount = 0) {
  const subP = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.unitPrice * i.qty, 0), 0) * 100;
  const discP = Math.min(Math.max(0, Math.round(discount * 100)), subP);
  const taxP = subP - discP;
  const halfP = Math.round((taxP * GST_RATE) / 200);
  return {
    subtotal: subP / 100, discount: discP / 100,
    cgst: halfP / 100, sgst: halfP / 100, rate: GST_RATE / 2,
    total: (taxP + 2 * halfP) / 100,
  };
}
export const money = (n) => Number(n).toFixed(2);
