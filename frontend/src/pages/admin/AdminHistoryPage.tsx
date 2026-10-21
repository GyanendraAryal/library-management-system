import { useEffect, useState } from "react";
import { borrowingService } from "../../services/borrowingService";
import type { BorrowRequest } from "../../types";
import StatusBadge from "../../components/ui/StatusBadge";
import Alert from "../../components/ui/Alert";
import { isApiError } from "../../utils/errors";
import { formatDate } from "../../utils/media";

const LIMIT = 10;

export default function AdminHistoryPage() {
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<BorrowRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await borrowingService.adminHistory({ limit: LIMIT, offset });
        if (cancelled) return;
        setItems(response.results ?? []);
        setCount(response.count ?? 0);
      } catch (err) {
        if (!cancelled) setError(isApiError(err) ? err.message : "Unable to load history.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [offset]);

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12 max-md:px-4">
      <h1 className="font-serif text-3xl font-semibold">Borrowing history</h1>
      <p className="mt-2 text-sm text-ink-muted">
        History includes returned books (`RT`) and rejected requests (`R`). Rejection cannot be
        performed from this UI because the backend never sets that status.
      </p>
      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-line bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Book</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium">Returned</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No history yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{item.user.username}</td>
                  <td className="px-4 py-3">{item.book.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(item.requested_at)}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(item.returned_at)}</td>
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
    </main>
  );
}
