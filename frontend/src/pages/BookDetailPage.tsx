import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { booksService } from "../services/booksService";
import type { Book } from "../types";
import { isApiError } from "../utils/errors";
import { mediaUrl } from "../utils/media";
import Alert from "../components/ui/Alert";
import BorrowModal from "../components/BorrowModal";
import { isBookAvailable } from "../utils/media";
import { useAuth } from "../hooks/useAuth";

export default function BookDetailPage() {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookId = Number(id);
    if (!bookId) {
      setError("Invalid book id.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await booksService.getBook(bookId);
        if (!cancelled) setBook(data);
      } catch (err) {
        if (!cancelled) setError(isApiError(err) ? err.message : "Book not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const cover = mediaUrl(book?.book_image);

  return (
    <main className="mx-auto max-w-[860px] px-6 py-12 max-md:px-4">
      <Link to="/catalogue" className="text-sm text-brand no-underline hover:underline">
        Back to catalogue
      </Link>
      {loading ? <p className="mt-6 text-ink-muted">Loading book…</p> : null}
      {error ? <div className="mt-6"><Alert tone="error">{error}</Alert></div> : null}
      {success ? <div className="mt-6"><Alert tone="success">{success}</Alert></div> : null}

      {book ? (
        <article className="mt-6 grid gap-8 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-[180px_1fr]">
          <div className="flex justify-center">
            {cover ? (
              <img src={cover} alt="" className="h-60 w-40 rounded-md object-cover" />
            ) : (
              <div className="flex h-60 w-40 items-center justify-center rounded-md bg-brand p-4 text-center text-white">
                {book.title}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold">{book.title}</h1>
            <p className="mt-2 text-brand">{book.author.author_name}</p>
            <p className="mt-1 text-sm text-ink-muted">{book.genre?.title ?? "Uncategorised"} · ISBN {book.isbn_number}</p>
            <p className="mt-4 leading-relaxed text-ink-muted">{book.description}</p>
            <p className="mt-4 text-sm">
              {book.available_quantity} of {book.quantity} copies available
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {isBookAvailable(book) ? (
                <button
                  type="button"
                  onClick={() => setBorrowOpen(true)}
                  className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
                >
                  Borrow book
                </button>
              ) : (
                <button type="button" disabled className="h-10 cursor-not-allowed rounded-lg border border-line px-4 text-sm text-ink-muted">
                  No copies available
                </button>
              )}
              {isStaff ? (
                <Link
                  to="/admin/books"
                  className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm no-underline hover:bg-surface-muted"
                >
                  Manage books
                </Link>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}

      <BorrowModal
        book={borrowOpen ? book : null}
        onClose={() => setBorrowOpen(false)}
        onSuccess={(message) => {
          setBorrowOpen(false);
          setSuccess(message);
        }}
      />
    </main>
  );
}
