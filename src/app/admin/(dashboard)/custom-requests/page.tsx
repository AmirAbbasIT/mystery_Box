import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { listCustomRequests } from "@/admin/services/custom-requests.service";
import styles from "./custom-requests.module.scss";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  completed: "Completed",
  archived: "Archived",
};

export default async function AdminCustomRequestsPage() {
  const requests = await listCustomRequests();

  return (
    <div>
      <h1 className={styles.title}>Custom Requests</h1>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Status</th>
            <th>From</th>
            <th>Occasion</th>
            <th>Recipient</th>
            <th>Budget</th>
            <th>Submitted</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <span className={styles.statusBadge} data-status={request.status}>
                  {STATUS_LABELS[request.status] ?? request.status}
                </span>
              </td>
              <td>
                {request.contactName}
                <br />
                <span className={styles.muted}>{request.contactEmail}</span>
              </td>
              <td>{request.occasion}</td>
              <td>
                {request.recipientType === "kids" ? "Kid" : "Adult"}, age {request.ageRange}
              </td>
              <td>{formatPrice(request.budgetPence / 100)}</td>
              <td>{new Date(request.createdAt).toLocaleDateString("en-GB")}</td>
              <td>
                <Link href={`/admin/custom-requests/${request.id}`}>View</Link>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={7}>No custom requests yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
