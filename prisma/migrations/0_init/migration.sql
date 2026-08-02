-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "hero_image" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color_swatch" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_pence" INTEGER NOT NULL,
    "category_id" UUID NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "age_suitability" TEXT[],
    "what_could_be_inside" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_themes" (
    "product_id" UUID NOT NULL,
    "theme_id" UUID NOT NULL,

    CONSTRAINT "product_themes_pkey" PRIMARY KEY ("product_id","theme_id")
);

-- CreateTable
CREATE TABLE "prize_pools" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" INTEGER,
    "price_pence" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prize_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prize_pool_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "weight" DECIMAL NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prize_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_packages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_from_pence" INTEGER NOT NULL,
    "age_range" TEXT,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birthday_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_package_includes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "birthday_package_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "birthday_package_includes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_package_themes" (
    "birthday_package_id" UUID NOT NULL,
    "theme_id" UUID NOT NULL,

    CONSTRAINT "birthday_package_themes_pkey" PRIMARY KEY ("birthday_package_id","theme_id")
);

-- CreateTable
CREATE TABLE "seasonal_collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starts_at" DATE NOT NULL,
    "ends_at" DATE NOT NULL,
    "hero_image" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasonal_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_collection_products" (
    "seasonal_collection_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,

    CONSTRAINT "seasonal_collection_products_pkey" PRIMARY KEY ("seasonal_collection_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "themes_slug_key" ON "themes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "prize_pools_slug_key" ON "prize_pools"("slug");

-- CreateIndex
CREATE INDEX "prize_items_prize_pool_id_idx" ON "prize_items"("prize_pool_id");

-- CreateIndex
CREATE UNIQUE INDEX "birthday_packages_slug_key" ON "birthday_packages"("slug");

-- CreateIndex
CREATE INDEX "birthday_package_includes_birthday_package_id_idx" ON "birthday_package_includes"("birthday_package_id");

-- CreateIndex
CREATE UNIQUE INDEX "seasonal_collections_slug_key" ON "seasonal_collections"("slug");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_themes" ADD CONSTRAINT "product_themes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_themes" ADD CONSTRAINT "product_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_items" ADD CONSTRAINT "prize_items_prize_pool_id_fkey" FOREIGN KEY ("prize_pool_id") REFERENCES "prize_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_package_includes" ADD CONSTRAINT "birthday_package_includes_birthday_package_id_fkey" FOREIGN KEY ("birthday_package_id") REFERENCES "birthday_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_package_themes" ADD CONSTRAINT "birthday_package_themes_birthday_package_id_fkey" FOREIGN KEY ("birthday_package_id") REFERENCES "birthday_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_package_themes" ADD CONSTRAINT "birthday_package_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_collection_products" ADD CONSTRAINT "seasonal_collection_products_seasonal_collection_id_fkey" FOREIGN KEY ("seasonal_collection_id") REFERENCES "seasonal_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_collection_products" ADD CONSTRAINT "seasonal_collection_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

