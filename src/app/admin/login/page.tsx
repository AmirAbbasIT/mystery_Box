"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import styles from "./login.module.scss";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className={styles.page}>
      <form action={formAction} className={styles.form}>
        <h1 className={styles.title}>Admin sign in</h1>
        <label htmlFor="pin" className={styles.label}>
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          className={styles.input}
        />
        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
