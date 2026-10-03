"use client";

import { useActionState, useState } from "react";
import { CARRIERS } from "@/lib/carriers";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { STAFF_ORDER_STATUSES, type OrderStatus } from "@/types/order";
import { updateOrderStatusAction, type OrderStatusFormState } from "./actions";
import styles from "./orders.module.scss";

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: OrderStatus;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export function OrderStatusForm({
  orderId,
  currentStatus,
  carrier,
  trackingNumber,
  trackingUrl,
}: OrderStatusFormProps) {
  const action = updateOrderStatusAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState<OrderStatusFormState, FormData>(
    action,
    {},
  );
  const [status, setStatus] = useState<OrderStatus>(currentStatus);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
        >
          {!STAFF_ORDER_STATUSES.includes(currentStatus) && (
            <option value={currentStatus} disabled>
              {ORDER_STATUS_LABELS[currentStatus]}
            </option>
          )}
          {STAFF_ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {ORDER_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      {status === "dispatched" && (
        <fieldset className={styles.dispatchFields}>
          <legend>Dispatch details</legend>
          <div className={styles.field}>
            <label htmlFor="carrier">Carrier</label>
            <select
              id="carrier"
              name="carrier"
              defaultValue={carrier ?? "royal-mail"}
              required
            >
              {CARRIERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="trackingNumber">
              Tracking number (optional for untracked post)
            </label>
            <input
              id="trackingNumber"
              name="trackingNumber"
              defaultValue={trackingNumber ?? ""}
              placeholder="e.g. AB123456789GB"
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="trackingUrl">Exact tracking link (optional)</label>
            <input
              id="trackingUrl"
              name="trackingUrl"
              type="url"
              defaultValue={trackingUrl ?? ""}
              placeholder="Leave blank to build it from the carrier and number"
            />
          </div>
        </fieldset>
      )}

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Saving…" : "Update order"}
      </button>
      {state.error && (
        <p role="alert" className={styles.formError}>
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
    </form>
  );
}
