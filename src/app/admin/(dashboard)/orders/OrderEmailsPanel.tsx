"use client";

import { useActionState } from "react";
import type { OrderEmailRecord } from "@/admin/services/orders.service";
import type { OrderEmailKind } from "@/lib/order-emails";
import { resendOrderEmailAction, type OrderStatusFormState } from "./actions";
import styles from "./orders.module.scss";

const KIND_LABELS: Record<OrderEmailKind, string> = {
  confirmation: "Order confirmation",
  dispatched: "Dispatch notice",
  delivered: "Delivered notice",
};

function ResendButton({ orderId, kind }: { orderId: string; kind: OrderEmailKind }) {
  const action = resendOrderEmailAction.bind(null, orderId, kind);
  const [state, formAction, pending] = useActionState<OrderStatusFormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className={styles.resendForm}>
      <button type="submit" disabled={pending} className={styles.resendButton}>
        {pending ? "Sending…" : `Resend ${KIND_LABELS[kind].toLowerCase()}`}
      </button>
      {state.error && (
        <span role="alert" className={styles.formError}>
          {state.error}
        </span>
      )}
      {state.success && <span role="status">{state.success}</span>}
    </form>
  );
}

interface OrderEmailsPanelProps {
  orderId: string;
  emails: OrderEmailRecord[];
  /** Which kinds make sense to resend for this order's current status. */
  resendable: OrderEmailKind[];
}

export function OrderEmailsPanel({ orderId, emails, resendable }: OrderEmailsPanelProps) {
  return (
    <section className={styles.emailsPanel}>
      <h2>Customer emails</h2>
      {emails.length === 0 ? (
        <p>No emails sent yet.</p>
      ) : (
        <ul className={styles.emailLog}>
          {emails.map((email) => (
            <li key={email.id}>
              <span
                className={styles.statusBadge}
                data-status={email.status === "sent" ? "delivered" : "cancelled"}
              >
                {email.status}
              </span>{" "}
              {KIND_LABELS[email.kind as OrderEmailKind] ?? email.kind} ·{" "}
              {new Date(email.createdAt).toLocaleString("en-GB")} · via {email.provider}
              {email.error && <div className={styles.formError}>{email.error}</div>}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.resendRow}>
        {resendable.map((kind) => (
          <ResendButton key={kind} orderId={orderId} kind={kind} />
        ))}
      </div>
    </section>
  );
}
