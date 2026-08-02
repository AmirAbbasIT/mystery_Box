// Phase 2 entity — not wired to any UI yet (no backend/checkout in Phase 1).
// Kept here so the shape is agreed before the API layer is built.

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
}
