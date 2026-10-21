import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useSearchParams } from "react-router";
import type { Availability, Book, SortOption } from "../types";
import BookCard from "../components/BookCard";
import Select from "../components/ui/Select";
import BorrowModal from "../components/BorrowModal";
import Alert from "../components/ui/Alert";
import { booksService } from "../services/booksService";
import { isApiError } from "../utils/errors";
import { isBookAvailable } from "../utils/media";

const PAGE_SIZES = [10, 20, 50];

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const [books, setBooks] = useState<Book[]>([]);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [genre, setGenre] = useState("");
  const [availability, setAvailability] = useState<Availability>("all");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    const next = searchParams.get("search") ?? "";
    setQuery(next);
    setAppliedSearch(next);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await booksService.listBooks({
          search: appliedSearch || undefined,
          genre: genre.trim() || undefined,
          page,
          size: pageSize,
        });
        if (cancelled) return;
        setBooks(response.results ?? []);
        setCount(response.count ?? 0);
      } catch (err) {
        if (cancelled) return;
        setError(isApiError(err) ? err.message : "Unable to load the catalogue.");
        setBooks([]);
        setCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [appliedSearch, genre, page, pageSize]);

  const visible = useMemo(() => {
    let result = [...books];
    if (availability === "available") result = result.filter(isBookAvailable);
    if (availability === "unavailable") result = result.filter((book) => !isBookAvailable(book));
    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "author") result.sort((a, b) => a.author.author_name.localeCompare(b.author.author_name));
    if (sort === "availability") result.sort((a, b) => b.available_quantity - a.available_quantity);
    return result;
  }, [books, availability, sort]);

  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, count);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    setPage(1);
    setAppliedSearch(next);
    setSearchParams(next ? { search: next } : {});
  };

  return (
    <div className="min-h-[70vh] bg-paper font-sans text-sm text-ink">
      <main className="mx-auto max-w-[1080px] px-6 pb-8 pt-12 max-md:px-4">
        <section>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
            Explore the collection
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight max-md:text-[28px]">
            Find your next great read
          </h1>
          <p className="mt-2.5 max-w-[460px] leading-normal text-ink-muted">
            Search uses the library API. Availability and sort apply to the current page of results.
          </p>
        </section>

        <div className="mt-7 flex flex-col gap-3">
          <form className="flex gap-2.5" onSubmit={submitSearch}>
            <label className="flex h-10 flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 text-ink-muted focus-within:border-brand">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search by title, author, or genre"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-ink outline-none placeholder:text-ink-muted"
              />
            </label>
            <button type="submit" className="h-10 rounded-lg bg-brand px-4 font-medium text-white hover:bg-brand-hover">
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2.5">
              <label className="flex h-[34px] items-center rounded-lg border border-line bg-surface px-3">
                <input
                  value={genre}
                  onChange={(e) => {
                    setGenre(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter genre"
                  className="w-36 bg-transparent text-ink outline-none placeholder:text-ink-muted"
                />
              </label>
              <Select
                value={availability}
                onChange={(v) => setAvailability(v as Availability)}
                options={[
                  { value: "all", label: "All availability" },
                  { value: "available", label: "Available now" },
                  { value: "unavailable", label: "Checked out" },
                ]}
              />
            </div>
            <Select
              value={sort}
              onChange={(v) => setSort(v as SortOption)}
              options={[
                { value: "relevance", label: "Sort: Relevance" },
                { value: "title", label: "Sort: Title" },
                { value: "author", label: "Sort: Author" },
                { value: "availability", label: "Sort: Availability" },
              ]}
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {error ? <Alert tone="error">{error}</Alert> : null}
          {success ? <Alert tone="success">{success}</Alert> : null}
        </div>

        {loading ? (
          <p className="mt-10 text-ink-muted">Loading catalogue…</p>
        ) : visible.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2.5 py-12 text-ink-muted">
            <BookOpen size={28} />
            <p>No books match your search.</p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((book) => (
              <BookCard key={book.id} book={book} onBorrow={setSelectedBook} />
            ))}
          </ul>
        )}

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <span className="text-[13px] text-ink-muted">
            {count === 0 ? "0 of 0" : `${start}–${rangeEnd} of ${count}`}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] text-ink-muted">Page size</span>
            <Select
              compact
              value={String(pageSize)}
              onChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
            />
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="inline-flex h-[34px] cursor-pointer items-center gap-1 rounded-lg border border-line bg-surface px-3 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="inline-flex h-[34px] cursor-pointer items-center gap-1 rounded-lg border border-line bg-surface px-3 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </main>

      <BorrowModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onSuccess={(message) => {
          setSelectedBook(null);
          setSuccess(message);
        }}
      />
    </div>
  );
}
