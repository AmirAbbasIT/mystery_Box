"use client";

import { useActionState } from "react";
import type { CustomRequestRecord } from "@/admin/services/custom-requests.service";
import type { CustomRequestUpdateState } from "./actions";
import styles from "./custom-requests.module.scss";

const STATUS_OPTIONS = ["new", "contacted", "quoted", "completed", "archived"] as const;

interface CustomRequestDetailFormProps {
  request: CustomRequestRecord;
  action: (state: CustomRequestUpdateState, formData: FormData) => Promise<CustomRequestUpdateState>;
}

export function CustomRequestDetailForm({ request, action }: CustomRequestDetailFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={styles.updateForm}>
      <div className={styles.field}>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={request.status}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="staffNotes">Staff notes</label>
        <textarea
          id="staffNotes"
          name="staffNotes"
          rows={4}
          defaultValue={request.staffNotes ?? ""}
          placeholder="Internal notes — quote sent, follow-up date, etc."
        />
      </div>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
