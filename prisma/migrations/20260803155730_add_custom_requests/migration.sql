-- CreateTable
CREATE TABLE "custom_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipient_type" TEXT NOT NULL,
    "age_range" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "theme_preference" TEXT,
    "budget_pence" INTEGER NOT NULL,
    "notes" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "staff_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "custom_requests_pkey" PRIMARY KEY ("id")
);
