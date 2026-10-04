/**
 * Provider-neutral email contract. Nothing outside src/lib/email/providers/ knows which service
 * actually delivers mail — to switch from Resend to another provider, add an adapter implementing
 * EmailProvider and register it in src/lib/email/index.ts. Templates, order logic and the admin
 * never change.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative — improves deliverability and accessibility. */
  text: string;
  /**
   * Stable key for this specific email (e.g. "order-confirmation/<orderId>/<attemptId>"), so a
   * retried request can't send it twice. Providers that support idempotency use it; others ignore it.
   */
  idempotencyKey?: string;
}

/** What a provider adapter receives: the message plus the configured sender details. */
export interface OutgoingEmail extends EmailMessage {
  /** e.g. "Mystery Packed Gifts <orders@example.co.uk>" */
  from: string;
  replyTo?: string;
}

export interface EmailProvider {
  /** Recorded alongside each send, e.g. "resend". */
  readonly name: string;
  /** Resolves with the provider's message id; throws on failure. */
  send(email: OutgoingEmail): Promise<{ id: string | null }>;
}
