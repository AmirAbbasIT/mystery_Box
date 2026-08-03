"use client";

import { useActionState } from "react";
import type { OrderStatus } from "@/types/order";
import { updateOrderStatusAction, type OrderStatusFormState } from "./actions";
import styles from "./orders.module.scss";

const STATUSES: OrderStatus[] = ["paid", "fulfilled", "cancelled"];

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
  const action = updateOrderStatusAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState<OrderStatusFormState, FormData>(action, {});

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={currentStatus}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Saving…" : "Update status"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
