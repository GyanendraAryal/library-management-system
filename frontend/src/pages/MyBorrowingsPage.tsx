import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { borrowingService } from "../services/borrowingService";
import type { BorrowRequest } from "../types";
import StatusBadge from "../components/ui/StatusBadge";
import Alert from "../components/ui/Alert";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { isApiError } from "../utils/errors";
import { formatDate } from "../utils/media";

export default function MyBorrowingsPage() {
  const [items, setItems] = useState<BorrowRequest[]>([]);
  const [returns, setReturns] = useState<BorrowRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BorrowRequest | null>(null);
  const [returnTarget, setReturnTarget] = useState<BorrowRequest | null>(null);
  const [cancelReturnTarget, setCancelReturnTarget] = useState<BorrowRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, pendingReturns] = await Promise.all([
        borrowingService.myBorrowings(),
        borrowingService.myReturns(),
      ]);
      setItems(mine.data);
      setReturns(pendingReturns.data);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Unable to load borrowings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12 max-md:px-4">
      <h1 className="font-serif text-3xl font-semibold">My borrowings</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Pending requests can change requested days. Approved loans can be submitted for return.
        There is no cancel-pending endpoint on the API.
      </p>

      <div className="mt-5 space-y-3">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
      </div>

      {loading ? (
        <p className="mt-8 text-ink-muted">Loading…</p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="font-serif text-xl font-semibold">All requests</h2>
            {items.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">You have not requested any books yet.</p>
            ) : (
              <RequestTable
                items={items}
                onEdit={setEditing}
                onReturn={setReturnTarget}
                onCancelReturn={setCancelReturnTarget}
              />
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-xl font-semibold">Return requests awaiting confirmation</h2>
            {returns.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">No submitted returns right now.</p>
            ) : (
              <RequestTable items={returns} onCancelReturn={setCancelReturnTarget} />
            )}
          </section>
        </>
      )}

      <EditPendingModal
        request={editing}
        onClose={() => setEditing(null)}
        onSaved={async (message) => {
          setEditing(null);
          setSuccess(message);
          await load();
        }}
      />

      <ConfirmDialog
        open={!!returnTarget}
        title="Submit return request"
        message={`Ask staff to confirm the return of “${returnTarget?.book.title}”?`}
        confirmLabel="Submit return"
        busy={busy}
        onClose={() => setReturnTarget(null)}
        onConfirm={async () => {
          if (!returnTarget) return;
          setBusy(true);
          try {
            await borrowingService.submitReturn(returnTarget.id);
            setSuccess("Return request submitted successfully. Awaiting admin confirmation.");
            setReturnTarget(null);
            await load();
          } catch (err) {
            setError(isApiError(err) ? err.message : "Unable to submit return.");
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={!!cancelReturnTarget}
        title="Cancel return request"
        message="This reverts the loan to Approved. You will still hold the book."
        confirmLabel="Cancel return"
        danger
        busy={busy}
        onClose={() => setCancelReturnTarget(null)}
        onConfirm={async () => {
          if (!cancelReturnTarget) return;
          setBusy(true);
          try {
            await borrowingService.cancelReturn(cancelReturnTarget.id);
            setSuccess("Return request cancelled. You still hold the book.");
            setCancelReturnTarget(null);
            await load();
          } catch (err) {
            setError(isApiError(err) ? err.message : "Unable to cancel return.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </main>
  );
}

function RequestTable({
  items,
  onEdit,
  onReturn,
  onCancelReturn,
}: {
  items: BorrowRequest[];
  onEdit?: (item: BorrowRequest) => void;
  onReturn?: (item: BorrowRequest) => void;
  onCancelReturn?: (item: BorrowRequest) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line bg-surface-muted text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Book</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Days</th>
            <th className="px-4 py-3 font-medium">Requested</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">{item.book.title}</td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                {item.approved_days ?? item.requested_days}
              </td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(item.requested_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {item.status === "P" && onEdit ? (
                    <button type="button" className="text-brand hover:underline" onClick={() => onEdit(item)}>
                      Edit days
                    </button>
                  ) : null}
                  {item.status === "A" && onReturn ? (
                    <button type="button" className="text-brand hover:underline" onClick={() => onReturn(item)}>
                      Request return
                    </button>
                  ) : null}
                  {item.status === "SR" && onCancelReturn ? (
                    <button type="button" className="text-danger hover:underline" onClick={() => onCancelReturn(item)}>
                      Cancel return
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditPendingModal({
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
  } = useForm<{ requested_days: number }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (request) {
      reset({ requested_days: request.requested_days });
      setError(null);
    }
  }, [request, reset]);

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
      <form
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-5"
        onSubmit={handleSubmit(async (values) => {
          setError(null);
          try {
            await borrowingService.updatePendingRequest(request.id, {
              requested_days: Number(values.requested_days),
            });
            await onSaved("Request updated successfully.");
          } catch (err) {
            setError(isApiError(err) ? err.message : "Unable to update request.");
          }
        })}
      >
        <h2 className="font-serif text-xl font-semibold">Update pending request</h2>
        <p className="mt-1 text-sm text-ink-muted">{request.book.title}</p>
        {error ? <div className="mt-3"><Alert tone="error">{error}</Alert></div> : null}
        <label className="mt-4 block text-sm font-medium">
          Requested days
          <input
            type="number"
            min={1}
            max={30}
            className="mt-1.5 h-10 w-full rounded-lg border border-line px-3"
            {...register("requested_days", {
              required: "Required",
              valueAsNumber: true,
              min: { value: 1, message: "Minimum is 1 day." },
              max: { value: 30, message: "Maximum is 30 days." },
            })}
          />
        </label>
        {errors.requested_days ? <p className="mt-1 text-sm text-danger">{errors.requested_days.message}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-line px-4 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 rounded-lg bg-brand px-4 text-sm text-white disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
