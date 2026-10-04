-- CreateTable
CREATE TABLE "order_emails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_emails_order_id_idx" ON "order_emails"("order_id");

-- AddForeignKey
ALTER TABLE "order_emails" ADD CONSTRAINT "order_emails_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
