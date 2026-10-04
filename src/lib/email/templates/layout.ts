/**
 * Shared building blocks for order emails. Templates are pure functions of plain data (no DB or
 * provider imports) so they can be previewed or tested in isolation. Inline styles + tables
 * because email clients ignore most CSS.
 */

export interface ShopDetails {
  name: string;
  /** Legal trading name, required in order confirmations (Consumer Contracts Regs 2013). */
  legalName: string;
  /** Geographic business address — also legally required; a PO box alone isn't enough. */
  address: string;
  contactEmail: string;
  /** Absolute origin for links, e.g. "https://mysterypickedgifts.co.uk" (no trailing slash). */
  siteUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Every customer-supplied or DB value goes through this before entering HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

export function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );
}

const BRAND = "#7a3dc2";

export function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:${BRAND};color:#ffffff;font-weight:700;text-decoration:none">${escapeHtml(label)}</a>`;
}

/** Wraps body HTML in the branded shell with the legally required business details footer. */
export function layout(shop: ShopDetails, title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en-GB">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f6f1fb;font-family:Arial,Helvetica,sans-serif;color:#2b2233">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1fb;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;padding:32px 24px">
        <tr><td style="font-size:20px;font-weight:800;color:${BRAND};padding-bottom:16px">${escapeHtml(shop.name)}</td></tr>
        <tr><td style="font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
        <tr><td style="font-size:12px;line-height:1.5;color:#6d6475;padding:16px 8px;text-align:center">
          ${escapeHtml(shop.legalName)} · ${escapeHtml(shop.address)}<br>
          Questions? Reply to this email or contact <a href="mailto:${escapeHtml(shop.contactEmail)}" style="color:#6d6475">${escapeHtml(shop.contactEmail)}</a>.<br>
          This is a service email about your order — it isn't marketing.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function textFooter(shop: ShopDetails): string {
  return [
    "—",
    `${shop.legalName}, ${shop.address}`,
    `Questions? Reply to this email or contact ${shop.contactEmail}.`,
  ].join("\n");
}
