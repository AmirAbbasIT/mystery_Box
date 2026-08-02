-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "active_color_palette" TEXT NOT NULL DEFAULT 'blush-rose',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
