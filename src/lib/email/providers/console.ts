import "server-only";
import type { EmailProvider, OutgoingEmail } from "../types";

/**
 * Development adapter: prints emails to the server console instead of sending them, so the whole
 * order flow can be tested locally without a provider account. Never used in production — see
 * getEmailProvider() in ../index.ts.
 */
export const consoleProvider: EmailProvider = {
  name: "console",
  async send(email: OutgoingEmail) {
    console.info(
      [
        "──── Email (console provider — not actually sent) ────",
        `From: ${email.from}`,
        `To: ${email.to}`,
        email.replyTo ? `Reply-To: ${email.replyTo}` : null,
        `Subject: ${email.subject}`,
        "",
        email.text,
        "──────────────────────────────────────────────────────",
      ]
        .filter((line) => line !== null)
        .join("\n"),
    );
    return { id: null };
  },
};
