// Phase 2c — a plain email-deduped record captured at checkout time, not an authenticated account
// (guest checkout only — see .claude/docs/10-admin-panel.md's Phase 2c note). Upserted by email in
// src/lib/orders.ts each time a PayPal payment is captured.

export interface Customer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
