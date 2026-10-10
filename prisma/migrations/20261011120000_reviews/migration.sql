-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_name" TEXT NOT NULL,
    "location" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "product_id" UUID,
    "order_id" UUID,
    "source" TEXT NOT NULL,
    "reviewed_on" DATE NOT NULL,
    "consent_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_product_id_idx" ON "reviews"("product_id");

-- CreateIndex
CREATE INDEX "reviews_published_featured_idx" ON "reviews"("published", "featured");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforced in the database too (not only the admin UI), so no code path or manual edit can publish
-- a placeholder or unconsented review, or feature an unpublished one.
ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "reviews_publish_requires_real_consented" CHECK (NOT "published" OR ("consent_confirmed" AND "source" <> 'placeholder')),
  ADD CONSTRAINT "reviews_featured_requires_published" CHECK (NOT "featured" OR "published");

-- The site's original example testimonials, kept for reference only. source = 'placeholder' and
-- unpublished: the admin service refuses to publish placeholder reviews, so these can never be
-- shown as genuine (DMCC Act 2024 bans fake reviews).
INSERT INTO "reviews" ("author_name", "location", "rating", "body", "source", "reviewed_on", "consent_confirmed", "published", "featured", "updated_at") VALUES
  ('Chloe', 'Manchester', 5, 'The egg reveal genuinely made my little sister''s birthday — she screamed at the golden egg!', 'placeholder', CURRENT_DATE, false, false, false, CURRENT_TIMESTAMP),
  ('Priya', 'London', 5, 'Ordered the Y2K jewellery box for myself as a treat and it did not disappoint.', 'placeholder', CURRENT_DATE, false, false, false, CURRENT_TIMESTAMP),
  ('Amelia', 'Leeds', 5, 'Booked the hen party box for six of us — such a fun way to kick off the night.', 'placeholder', CURRENT_DATE, false, false, false, CURRENT_TIMESTAMP);
