import { Link } from "react-router";
import type { Book } from "../types";
import { isBookAvailable, mediaUrl } from "../utils/media";

interface BookCardProps {
  book: Book;
  onBorrow?: (book: Book) => void;
  showBorrow?: boolean;
}

export default function BookCard({ book, onBorrow, showBorrow = true }: BookCardProps) {
  const available = isBookAvailable(book);
  const cover = mediaUrl(book.book_image);

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex h-[170px] items-center justify-center bg-surface-muted px-4">
        {cover ? (
          <img src={cover} alt="" className="h-[136px] w-[100px] rounded-sm object-cover shadow-[0_6px_16px_rgba(0,0,0,0.12)]" />
        ) : (
          <div className="flex h-[136px] w-[100px] flex-col gap-1.5 overflow-hidden rounded-sm bg-brand p-2.5 text-[#f6f1e4] shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
            <span className="text-[7px] font-bold uppercase leading-tight tracking-[0.08em]">
              {book.author.author_name}
            </span>
            <span className="font-serif text-[13px] leading-[1.15]">{book.title}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-[18px] pb-5 pt-[18px]">
        <h3 className="font-serif text-lg font-semibold leading-snug">
          <Link to={`/books/${book.id}`} className="text-ink no-underline hover:text-brand">
            {book.title}
          </Link>
        </h3>
        <p className="text-[13px] text-brand">{book.author.author_name}</p>

        <div className="mb-3 mt-3.5 flex items-center justify-between gap-2">
          <span className="text-[13px] text-ink-muted">{book.genre?.title ?? "Uncategorised"}</span>
          <span
            className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] ${
              available ? "bg-ok-bg text-ok-text" : "bg-out-bg text-out-text"
            }`}
          >
            {available
              ? `Available · ${book.available_quantity} ${book.available_quantity === 1 ? "copy" : "copies"}`
              : "Checked out · 0 copies"}
          </span>
        </div>

        {showBorrow ? (
          available ? (
            <button
              type="button"
              onClick={() => onBorrow?.(book)}
              className="mt-auto h-[38px] rounded-lg bg-brand font-medium text-white hover:bg-brand-hover"
            >
              Borrow book
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="mt-auto h-[38px] cursor-not-allowed rounded-lg border border-line bg-transparent text-ink-muted"
            >
              No copies available
            </button>
          )
        ) : null}
      </div>
    </li>
  );
}
