// Phase 2c — a plain email-deduped record captured at checkout time, not an authenticated account
// (guest checkout only — see claude/10-admin-panel.md's Phase 2c note). Upserted by email in
// src/lib/orders.ts each time a Stripe checkout.session.completed webhook fires.

export interface Customer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
