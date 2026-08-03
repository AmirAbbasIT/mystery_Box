import "server-only";
import { getPrismaClient } from "@/lib/db/client";

export type CustomRequestStatus = "new" | "contacted" | "quoted" | "completed" | "archived";

export interface CustomRequestRecord {
  id: string;
  recipientType: "kids" | "adult";
  ageRange: string;
  occasion: string;
  themePreference: string | null;
  budgetPence: number;
  notes: string | null;
  contactName: string;
  contactEmail: string;
  status: CustomRequestStatus;
  staffNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

function toRecord(row: {
  id: string;
  recipientType: string;
  ageRange: string;
  occasion: string;
  themePreference: string | null;
  budgetPence: number;
  notes: string | null;
  contactName: string;
  contactEmail: string;
  status: string;
  staffNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomRequestRecord {
  return {
    id: row.id,
    recipientType: row.recipientType === "adult" ? "adult" : "kids",
    ageRange: row.ageRange,
    occasion: row.occasion,
    themePreference: row.themePreference,
    budgetPence: row.budgetPence,
    notes: row.notes,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    status: row.status as CustomRequestStatus,
    staffNotes: row.staffNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCustomRequests(): Promise<CustomRequestRecord[]> {
  const rows = await getPrismaClient().customRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getCustomRequest(id: string): Promise<CustomRequestRecord | null> {
  const row = await getPrismaClient().customRequest.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function updateCustomRequestStatus(
  id: string,
  status: CustomRequestStatus,
  staffNotes: string | null,
): Promise<void> {
  await getPrismaClient().customRequest.update({
    where: { id },
    data: { status, staffNotes },
  });
}
