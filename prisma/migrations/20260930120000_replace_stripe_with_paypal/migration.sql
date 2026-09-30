-- Stripe -> PayPal. Adds a NOT NULL paypal_order_id to orders, so this only applies cleanly while
-- the orders table is empty (true when written: no live orders had been taken yet).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "orders") THEN
    RAISE EXCEPTION 'orders is not empty — backfill paypal_order_id before applying this migration';
  END IF;
END $$;
-- DropIndex
DROP INDEX "orders_stripe_checkout_session_id_key";

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "free_shipping_threshold_pence" INTEGER,
ADD COLUMN     "shipping_flat_pence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "stripe_checkout_session_id",
ADD COLUMN     "paypal_capture_id" TEXT,
ADD COLUMN     "paypal_order_id" TEXT NOT NULL,
ADD COLUMN     "shipping_pence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "pending_checkouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paypal_order_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal_pence" INTEGER NOT NULL,
    "shipping_pence" INTEGER NOT NULL,
    "total_pence" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_checkouts_paypal_order_id_key" ON "pending_checkouts"("paypal_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_paypal_order_id_key" ON "orders"("paypal_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_paypal_capture_id_key" ON "orders"("paypal_capture_id");
