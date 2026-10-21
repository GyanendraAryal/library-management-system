import { BORROW_STATUS_LABELS, type BorrowStatus } from "../../types";

const STATUS_CLASS: Record<BorrowStatus, string> = {
  P: "bg-pending-bg text-pending-text",
  A: "bg-active-bg text-active-text",
  SR: "bg-sr-bg text-sr-text",
  R: "bg-danger-bg text-danger",
  C: "bg-out-bg text-out-text",
  RT: "bg-ok-bg text-ok-text",
};

export default function StatusBadge({ status }: { status: BorrowStatus }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[status]}`}>
      {BORROW_STATUS_LABELS[status]}
    </span>
  );
}
