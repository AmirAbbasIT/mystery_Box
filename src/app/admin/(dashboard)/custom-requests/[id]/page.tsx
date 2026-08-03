import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { getCustomRequest } from "@/admin/services/custom-requests.service";
import { updateCustomRequestAction } from "../actions";
import { CustomRequestDetailForm } from "../CustomRequestDetailForm";
import styles from "../custom-requests.module.scss";

export default async function CustomRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getCustomRequest(id);

  if (!request) notFound();

  return (
    <div>
      <h1 className={styles.title}>Custom Request</h1>

      <dl className={styles.detailGrid}>
        <div>
          <dt>Contact</dt>
          <dd>
            {request.contactName} — {request.contactEmail}
          </dd>
        </div>
        <div>
          <dt>Recipient</dt>
          <dd>
            {request.recipientType === "kids" ? "Kid" : "Adult"}, age {request.ageRange}
          </dd>
        </div>
        <div>
          <dt>Occasion</dt>
          <dd>{request.occasion}</dd>
        </div>
        <div>
          <dt>Theme preference</dt>
          <dd>{request.themePreference || "—"}</dd>
        </div>
        <div>
          <dt>Budget for the box</dt>
          <dd>{formatPrice(request.budgetPence / 100)}</dd>
        </div>
        <div>
          <dt>Notes from customer</dt>
          <dd>{request.notes || "—"}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{new Date(request.createdAt).toLocaleString("en-GB")}</dd>
        </div>
      </dl>

      <CustomRequestDetailForm
        request={request}
        action={updateCustomRequestAction.bind(null, id)}
      />
    </div>
  );
}
