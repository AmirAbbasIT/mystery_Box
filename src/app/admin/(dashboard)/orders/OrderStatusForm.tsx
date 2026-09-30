"use client";

import { useActionState } from "react";
import { STAFF_ORDER_STATUSES, type OrderStatus } from "@/types/order";
import { updateOrderStatusAction, type OrderStatusFormState } from "./actions";
import styles from "./orders.module.scss";

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
          {!STAFF_ORDER_STATUSES.includes(currentStatus) && (
            <option value={currentStatus} disabled>
              {currentStatus}
            </option>
          )}
          {STAFF_ORDER_STATUSES.map((status) => (
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
