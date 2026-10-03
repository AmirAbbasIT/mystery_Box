-- AlterTable
ALTER TABLE "pending_checkouts" ADD COLUMN     "coupon_code" TEXT,
ADD COLUMN     "coupon_id" UUID,
ADD COLUMN     "discount_pence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_discount_pence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "coupon_code" TEXT,
ADD COLUMN     "coupon_id" UUID,
ADD COLUMN     "discount_pence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_discount_pence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "note" TEXT,
    "discount_type" TEXT NOT NULL,
    "percent_off" INTEGER,
    "amount_off_pence" INTEGER,
    "max_discount_pence" INTEGER,
    "min_subtotal_pence" INTEGER,
    "usage_limit" INTEGER,
    "per_customer_limit" INTEGER,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupon_attempts_client_key_created_at_idx" ON "coupon_attempts"("client_key", "created_at");

-- CreateIndex
CREATE INDEX "orders_coupon_id_idx" ON "orders"("coupon_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
