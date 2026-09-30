import "server-only";
import { SITE_NAME } from "@/lib/constants";

/**
 * Server-only PayPal REST client (Orders v2 + webhook verification) over plain fetch — no SDK
 * dependency. PAYPAL_CLIENT_SECRET never leaves the server; the browser only ever gets the public
 * client ID (for the JS SDK buttons) and PayPal order IDs.
 */

const API_BASE = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
} as const;

export class PayPalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issue: string | null,
    readonly debugId: string | null,
  ) {
    super(message);
    this.name = "PayPalApiError";
  }
}

function getConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are missing — set them in .env.local (see .env.local.example).",
    );
  }
  const environment = process.env.PAYPAL_ENVIRONMENT === "live" ? "live" : "sandbox";
  return { clientId, clientSecret, baseUrl: API_BASE[environment] };
}

const globalForPayPal = globalThis as unknown as {
  paypalToken?: { value: string; expiresAt: number };
};

async function getAccessToken(): Promise<string> {
  const cached = globalForPayPal.paypalToken;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const { clientId, clientSecret, baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PayPalApiError(
      "PayPal authentication failed.",
      response.status,
      null,
      null,
    );
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  globalForPayPal.paypalToken = {
    value: data.access_token,
    // Refresh a minute early so a token never expires mid-request.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

async function paypalRequest<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: string; requestId?: string },
): Promise<T> {
  const { baseUrl } = getConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await getAccessToken()}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (init.requestId) headers["PayPal-Request-Id"] = init.requestId;

  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method,
    headers,
    body: init.body,
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const issue: string | null = data?.details?.[0]?.issue ?? data?.name ?? null;
    throw new PayPalApiError(
      `PayPal ${init.method} ${path.split("?")[0]} failed (${response.status}${issue ? `: ${issue}` : ""}).`,
      response.status,
      issue,
      data?.debug_id ?? null,
    );
  }

  return data as T;
}

export interface PayPalMoney {
  currency_code: string;
  value: string;
}

export interface PayPalCapture {
  id: string;
  status:
    "COMPLETED" | "PENDING" | "DECLINED" | "FAILED" | "PARTIALLY_REFUNDED" | "REFUNDED";
  amount: PayPalMoney;
}

export interface PayPalOrder {
  id: string;
  status:
    "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  payment_source?: {
    card?: {
      authentication_result?: {
        liability_shift?: "POSSIBLE" | "YES" | "NO" | "UNKNOWN";
        three_d_secure?: { enrollment_status?: string; authentication_status?: string };
      };
    };
  };
  purchase_units?: Array<{
    amount: PayPalMoney;
    shipping?: {
      name?: { full_name?: string };
      address?: {
        address_line_1?: string;
        address_line_2?: string;
        admin_area_2?: string;
        admin_area_1?: string;
        postal_code?: string;
        country_code?: string;
      };
    };
    payments?: { captures?: PayPalCapture[] };
  }>;
}

export interface CreatePayPalOrderInput {
  items: Array<{ sku: string; name: string; unitPricePence: number; quantity: number }>;
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  shipping: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    postcode: string;
  };
  /** "card" = our Card Fields form; "paypal" = the PayPal / Pay Later buttons. */
  paymentSource: "paypal" | "card";
  requestId: string;
}

export function penceToValue(pence: number): string {
  return (pence / 100).toFixed(2);
}

/** Exact string -> integer pence (no float maths), e.g. "12.30" -> 1230. Returns NaN if malformed. */
export function valueToPence(value: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return Number.NaN;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

const gbp = (pence: number): PayPalMoney => ({
  currency_code: "GBP",
  value: penceToValue(pence),
});

export async function createPayPalOrder(
  input: CreatePayPalOrderInput,
): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    requestId: input.requestId,
    body: JSON.stringify({
      intent: "CAPTURE",
      ...(input.paymentSource === "card"
        ? {
            // 3-D Secure whenever the issuer/SCA rules require it (always for most UK cards).
            // The result is enforced server-side before capture — see src/lib/orders.ts.
            payment_source: {
              card: { attributes: { verification: { method: "SCA_WHEN_REQUIRED" } } },
            },
          }
        : {
            // SET_PROVIDED_ADDRESS: PayPal shows the address entered on /checkout and doesn't
            // let the buyer switch it, so what we recorded is where the parcel actually goes.
            application_context: {
              brand_name: SITE_NAME,
              shipping_preference: "SET_PROVIDED_ADDRESS",
            },
          }),
      purchase_units: [
        {
          amount: {
            ...gbp(input.totalPence),
            breakdown: {
              item_total: gbp(input.subtotalPence),
              shipping: gbp(input.shippingPence),
            },
          },
          items: input.items.map((item) => ({
            name: item.name.slice(0, 127),
            sku: item.sku,
            quantity: String(item.quantity),
            unit_amount: gbp(item.unitPricePence),
            category: "PHYSICAL_GOODS",
          })),
          shipping: {
            type: "SHIPPING",
            name: { full_name: input.shipping.name },
            address: {
              address_line_1: input.shipping.line1,
              ...(input.shipping.line2 ? { address_line_2: input.shipping.line2 } : {}),
              admin_area_2: input.shipping.city,
              postal_code: input.shipping.postcode,
              country_code: "GB",
            },
          },
        },
      ],
    }),
  });
}

export async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
    },
  );
}

/**
 * requestId makes the capture idempotent at PayPal's end — the browser's onApprove and the
 * CHECKOUT.ORDER.APPROVED webhook can both call this for the same order and only one capture
 * ever happens; the second call gets the first call's response back.
 */
export async function capturePayPalOrder(
  orderId: string,
  requestId: string,
): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    { method: "POST", requestId },
  );
}

/**
 * Verifies a webhook really came from PayPal for our webhook ID. The raw body is spliced in
 * verbatim rather than JSON.parse/stringify round-tripped, since the signature covers PayPal's
 * exact bytes.
 */
export async function verifyPayPalWebhook(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const fields = {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
  };
  if (Object.values(fields).some((value) => !value)) return false;

  const body = `${JSON.stringify(fields).slice(0, -1)},"webhook_event":${rawBody}}`;
  const result = await paypalRequest<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    { method: "POST", body },
  );
  return result.verification_status === "SUCCESS";
}
