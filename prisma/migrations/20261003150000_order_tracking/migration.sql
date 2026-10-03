-- Order tracking: customer-facing order numbers, dispatch/tracking details, and a richer status
-- flow (paid → packing → dispatched → delivered). Also replaces coupon_attempts with a generic
-- rate_limit_hits table shared by promo codes and order tracking lookups.

-- AlterTable — order_number is added nullable, backfilled for existing orders, then made required.
ALTER TABLE "orders" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "delivered_at" TIMESTAMPTZ(6),
ADD COLUMN     "dispatched_at" TIMESTAMPTZ(6),
ADD COLUMN     "order_number" TEXT,
ADD COLUMN     "tracking_number" TEXT,
ADD COLUMN     "tracking_url" TEXT;

-- Same format as src/lib/order-number.ts: "MPG-" + 6 chars, no 0/O/1/I/L lookalikes.
DO $$
DECLARE
  existing RECORD;
  alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate TEXT;
BEGIN
  FOR existing IN SELECT "id" FROM "orders" WHERE "order_number" IS NULL LOOP
    LOOP
      candidate := 'MPG-';
      FOR i IN 1..6 LOOP
        candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "orders" WHERE "order_number" = candidate);
    END LOOP;
    UPDATE "orders" SET "order_number" = candidate WHERE "id" = existing."id";
  END LOOP;
END $$;

ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;

-- "fulfilled" is replaced by dispatched/delivered. Existing fulfilled orders become dispatched
-- (no tracking details were ever recorded for them).
UPDATE "orders" SET "status" = 'dispatched', "dispatched_at" = "updated_at" WHERE "status" = 'fulfilled';

-- DropTable — held only transient failed promo-code attempts.
DROP TABLE "coupon_attempts";

-- CreateTable
CREATE TABLE "rate_limit_hits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" TEXT NOT NULL,
    "client_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_hits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_hits_scope_client_key_created_at_idx" ON "rate_limit_hits"("scope", "client_key", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- Order numbers are assigned when checkout starts (sent to PayPal as invoice_id).
ALTER TABLE "pending_checkouts" ADD COLUMN "order_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pending_checkouts_order_number_key" ON "pending_checkouts"("order_number");
