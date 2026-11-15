import { GST_RATE } from './brand';

// Menu prices are treated as pre-tax; GST is added on top and split into CGST + SGST.
// Works in paise internally so totals never drift.
export function computeBill(orders) {
  const subP = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.unitPrice * i.qty, 0), 0) * 100;
  const halfP = Math.round((subP * GST_RATE) / 200);
  return { subtotal: subP / 100, cgst: halfP / 100, sgst: halfP / 100, rate: GST_RATE / 2, total: (subP + 2 * halfP) / 100 };
}
export const money = (n) => Number(n).toFixed(2);
