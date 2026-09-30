-- Checkout now collects customer + delivery details before payment. Unfinished checkouts started
-- before this change have no such details and can never complete, so they're cleared first — they
-- hold no customer data and never took payment (every paid checkout has a matching orders row).
DELETE FROM "pending_checkouts"
WHERE "paypal_order_id" NOT IN (SELECT "paypal_order_id" FROM "orders");

-- AlterTable
ALTER TABLE "pending_checkouts" ADD COLUMN     "customer_email" TEXT NOT NULL,
ADD COLUMN     "customer_name" TEXT NOT NULL,
ADD COLUMN     "customer_phone" TEXT,
ADD COLUMN     "shipping_city" TEXT NOT NULL,
ADD COLUMN     "shipping_line1" TEXT NOT NULL,
ADD COLUMN     "shipping_line2" TEXT,
ADD COLUMN     "shipping_name" TEXT NOT NULL,
ADD COLUMN     "shipping_postcode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "contact_phone" TEXT;
