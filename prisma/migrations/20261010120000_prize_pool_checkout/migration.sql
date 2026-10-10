-- AlterTable
ALTER TABLE "prize_items" ADD COLUMN     "stock" INTEGER;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "item_type" TEXT NOT NULL DEFAULT 'product',
ADD COLUMN     "prize_pool_id" UUID;

-- CreateTable
CREATE TABLE "order_prizes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_item_id" UUID NOT NULL,
    "prize_item_id" UUID,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "weight" DECIMAL NOT NULL,
    "total_weight" DECIMAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_prizes_order_item_id_idx" ON "order_prizes"("order_item_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_prize_pool_id_fkey" FOREIGN KEY ("prize_pool_id") REFERENCES "prize_pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_prizes" ADD CONSTRAINT "order_prizes_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_prizes" ADD CONSTRAINT "order_prizes_prize_item_id_fkey" FOREIGN KEY ("prize_item_id") REFERENCES "prize_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
