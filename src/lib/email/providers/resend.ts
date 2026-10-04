import "server-only";
import type { EmailProvider, OutgoingEmail } from "../types";

/**
 * Resend adapter (https://resend.com/docs/api-reference/emails/send-email) over plain fetch — no
 * SDK dependency. RESEND_API_KEY stays server-side; use a "Sending access" key restricted to the
 * shop's domain so a leaked key can't do anything else.
 */
export function createResendProvider(apiKey: string): EmailProvider {
  return {
    name: "resend",
    async send(email: OutgoingEmail) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      // Resend de-duplicates repeats of the same key for 24 hours.
      if (email.idempotencyKey)
        headers["Idempotency-Key"] = email.idempotencyKey.slice(0, 256);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          subject: email.subject,
          html: email.html,
          text: email.text,
          ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        }),
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
        name?: string;
      };
      if (!response.ok) {
        throw new Error(
          `Resend rejected the email (${response.status}${data.name ? ` ${data.name}` : ""}): ${data.message ?? "no details"}`,
        );
      }
      return { id: data.id ?? null };
    },
  };
}
