import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { borrowingService } from "../../services/borrowingService";
import type { BorrowRequest, BorrowStatus } from "../../types";
import { BORROW_STATUS_LABELS } from "../../types";
import StatusBadge from "../../components/ui/StatusBadge";
import Alert from "../../components/ui/Alert";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { isApiError } from "../../utils/errors";
import { formatDate } from "../../utils/media";

const LIMIT = 10;

export default function AdminRequestsPage() {
  const [status, setStatus] = useState("P");
  const [username, setUsername] = useState("");
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<BorrowRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [approving, setApproving] = useState<BorrowRequest | null>(null);
  const [returning, setReturning] = useState<BorrowRequest | null>(null);
  const [deleting, setDeleting] = useState<BorrowRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const response = await borrowingService.adminListAll({
        status: status || undefined,
        user__username: username.trim() || undefined,
        limit: LIMIT,
        offset,
      });
      setItems(response.results ?? []);
      setCount(response.count ?? 0);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Unable to load requests.");
    }
  };

  useEffect(() => {
    void load();
  }, [status, offset]);

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12 max-md:px-4">
      <h1 className="font-serif text-3xl font-semibold">Borrow requests</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Approve pending loans and confirm submitted returns. The API has no reject endpoint.
        Staff return listings on `/return/` only show the current user’s own records, so this
        page uses the admin queue with `status=SR` instead.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Select
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "All statuses" },
            ...Object.entries(BORROW_STATUS_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            void load();
          }}
        >
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Filter username"
            className="h-[34px] rounded-lg border border-line px-3 text-sm"
          />
          <button type="submit" className="h-[34px] rounded-lg bg-brand px-3 text-sm text-white">
            Filter
          </button>
        </form>
      </div>

      <div className="mt-4 space-y-3">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Book</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No requests in this view.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{item.user.username}</td>
                  <td className="px-4 py-3">{item.book.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status as BorrowStatus} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(item.requested_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      {item.status === "P" ? (
                        <button type="button" className="text-brand hover:underline" onClick={() => setApproving(item)}>
                          Approve
                        </button>
                      ) : null}
                      {item.status === "SR" ? (
                        <button type="button" className="text-brand hover:underline" onClick={() => setReturning(item)}>
                          Confirm return
                        </button>
                      ) : null}
                      <button type="button" className="text-danger hover:underline" onClick={() => setDeleting(item)}>
                        Delete record
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={offset <= 0}
          onClick={() => setOffset(Math.max(0, offset - LIMIT))}
          className="h-9 rounded-lg border border-line px-3 text-sm disabled:opacity-45"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={offset + LIMIT >= count}
          onClick={() => setOffset(offset + LIMIT)}
          className="h-9 rounded-lg border border-line px-3 text-sm disabled:opacity-45"
        >
          Next
        </button>
      </div>

      <ApproveModal
        request={approving}
        onClose={() => setApproving(null)}
        onSaved={async (message) => {
          setApproving(null);
          setSuccess(message);
          await load();
        }}
      />

      <ConfirmDialog
        open={!!returning}
        title="Confirm return"
        message={`Mark “${returning?.book.title}” as returned and restore inventory?`}
        confirmLabel="Confirm return"
        busy={busy}
        onClose={() => setReturning(null)}
        onConfirm={async () => {
          if (!returning) return;
          setBusy(true);
          try {
            await borrowingService.adminConfirmReturn(returning.id);
            setSuccess("Book return confirmed. Inventory updated.");
            setReturning(null);
            await load();
          } catch (err) {
            setError(isApiError(err) ? err.message : "Unable to confirm return.");
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete borrow record"
        message="Staff delete permanently removes this borrow record."
        confirmLabel="Delete"
        danger
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await borrowingService.adminDeleteRecord(deleting.id);
            setSuccess("Borrow record deleted successfully.");
            setDeleting(null);
            await load();
          } catch (err) {
            setError(isApiError(err) ? err.message : "Unable to delete record.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </main>
  );
}

function ApproveModal({
  request,
  onClose,
  onSaved,
}: {
  request: BorrowRequest | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ approved_days: number }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reset({ approved_days: request?.requested_days ?? 15 });
    setError(null);
  }, [request, reset]);

  return (
    <Modal open={!!request} title="Approve borrow request" onClose={onClose}>
      {request ? (
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            setError(null);
            try {
              await borrowingService.adminApprove(request.id, {
                approved_days: Number(values.approved_days),
              });
              await onSaved("Borrow request approved successfully.");
            } catch (err) {
              setError(isApiError(err) ? err.message : "Unable to approve request.");
            }
          })}
        >
          <p className="text-sm text-ink-muted">
            {request.user.username} requested {request.book.title} for {request.requested_days} days.
          </p>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <label className="block text-sm font-medium">
            Approved days
            <input
              type="number"
              min={1}
              max={30}
              className="mt-1.5 h-10 w-full rounded-lg border border-line px-3"
              {...register("approved_days", {
                required: "Approved days are required.",
                valueAsNumber: true,
                min: { value: 1, message: "Minimum is 1 day." },
                max: { value: 30, message: "Maximum is 30 days." },
              })}
            />
          </label>
          {errors.approved_days ? <p className="text-sm text-danger">{errors.approved_days.message}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-line px-4 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="h-10 rounded-lg bg-brand px-4 text-sm text-white disabled:opacity-60">
              Approve
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
