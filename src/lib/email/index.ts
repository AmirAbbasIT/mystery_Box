import "server-only";
import { consoleProvider } from "./providers/console";
import { createResendProvider } from "./providers/resend";
import type { EmailMessage, EmailProvider } from "./types";

export type { EmailMessage, EmailProvider } from "./types";

/**
 * The single entry point the rest of the app uses to send email. Which service delivers it is
 * configuration only:
 *   EMAIL_PROVIDER=resend   (+ RESEND_API_KEY) — production
 *   EMAIL_PROVIDER=console  — local development, prints to the terminal
 * To add a provider: write providers/<name>.ts implementing EmailProvider, add a case below.
 */
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  switch (provider) {
    case "resend": {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey)
        throw new Error("EMAIL_PROVIDER=resend but RESEND_API_KEY is not set.");
      return createResendProvider(apiKey);
    }
    case "console":
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Emails are not configured — set EMAIL_PROVIDER (see .env.local.example).",
        );
      }
      return consoleProvider;
    default:
      throw new Error(`Unknown EMAIL_PROVIDER "${provider}".`);
  }
}

export interface SendResult {
  provider: string;
  id: string | null;
}

/** Sends one email from the shop's configured address. Throws if the provider rejects it. */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const from = process.env.EMAIL_FROM;
  if (!from)
    throw new Error(
      'EMAIL_FROM is not set (e.g. "Shop Name <orders@yourdomain.co.uk>").',
    );

  const provider = getEmailProvider();
  const { id } = await provider.send({
    ...message,
    from,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
  });
  return { provider: provider.name, id };
}
