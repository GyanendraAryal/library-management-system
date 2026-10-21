import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { booksService } from "../../services/booksService";
import type { Author, Book, PaginatedResponse } from "../../types";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Alert from "../../components/ui/Alert";
import { isApiError } from "../../utils/errors";

type BookForm = {
  title: string;
  description: string;
  isbn_number: string;
  author_id: string;
  genre_id: string;
  quantity: number;
  book_image?: FileList;
};

export default function ManageBooksPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Book> | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Book | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Book | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [books, authorList] = await Promise.all([
        booksService.listBooks({ page, size: 10 }),
        booksService.listAuthors(),
      ]);
      setData(books);
      setAuthors(authorList);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Unable to load books.");
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  const pageCount = Math.max(1, Math.ceil((data?.count ?? 0) / 10));

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12 max-md:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Manage books</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Add book
        </button>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Genre IDs are optional because the API has no genre list endpoint. Create genres in Django admin,
        then enter the ID here. Available quantity is set by the server and cannot be edited.
      </p>
      <div className="mt-4 space-y-3">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-line bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Genre</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.results ?? []).map((book) => (
              <tr key={book.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{book.title}</td>
                <td className="px-4 py-3">{book.author.author_name}</td>
                <td className="px-4 py-3">{book.genre?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  {book.available_quantity}/{book.quantity}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button type="button" className="text-brand hover:underline" onClick={() => setEditing(book)}>
                      Edit
                    </button>
                    <button type="button" className="text-danger hover:underline" onClick={() => setDeleting(book)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="h-9 rounded-lg border border-line px-3 text-sm disabled:opacity-45"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => setPage((p) => p + 1)}
          className="h-9 rounded-lg border border-line px-3 text-sm disabled:opacity-45"
        >
          Next
        </button>
      </div>

      <BookFormModal
        open={creating || !!editing}
        book={editing}
        authors={authors}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async (message) => {
          setCreating(false);
          setEditing(null);
          setSuccess(message);
          await load();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete book"
        message={`Delete “${deleting?.title}”? Existing borrow records may block this.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await booksService.deleteBook(deleting.id);
            setSuccess("Book deleted.");
            setDeleting(null);
            await load();
          } catch (err) {
            setError(isApiError(err) ? err.message : "Unable to delete book.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </main>
  );
}

function BookFormModal({
  open,
  book,
  authors,
  onClose,
  onSaved,
}: {
  open: boolean;
  book: Book | null;
  authors: Author[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookForm>();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    reset({
      title: book?.title ?? "",
      description: book?.description ?? "",
      isbn_number: book?.isbn_number ?? "",
      author_id: book ? String(book.author.id) : "",
      genre_id: book?.genre ? String(book.genre.id) : "",
      quantity: book?.quantity ?? 10,
    });
    setFormError(null);
  }, [book, open, reset]);

  return (
    <Modal open={open} title={book ? "Edit book" : "Add book"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          const payload = new FormData();
          payload.append("title", values.title);
          payload.append("description", values.description);
          payload.append("isbn_number", values.isbn_number);
          payload.append("author_id", values.author_id);
          payload.append("quantity", String(values.quantity));
          if (values.genre_id) payload.append("genre_id", values.genre_id);
          if (values.book_image?.[0]) payload.append("book_image", values.book_image[0]);
          try {
            if (book) {
              await booksService.updateBook(book.id, payload);
              await onSaved("Book updated successfully");
            } else {
              await booksService.createBook(payload);
              await onSaved("Book created successfully");
            }
          } catch (err) {
            if (isApiError(err)) {
              const keys = ["title", "description", "isbn_number", "author_id", "genre_id", "quantity"] as const;
              let assigned = false;
              for (const key of keys) {
                if (err.fields[key]) {
                  setError(key, { message: err.fields[key] });
                  assigned = true;
                }
              }
              if (!assigned) setFormError(err.message);
              return;
            }
            setFormError("Unable to save book.");
          }
        })}
      >
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        {authors.length === 0 ? (
          <Alert tone="info">Create an author first. Books require an author_id.</Alert>
        ) : null}

        <label className="block text-sm font-medium">
          Title
          <input className="mt-1.5 h-10 w-full rounded-lg border border-line px-3" {...register("title", { required: "Title is required.", maxLength: 200 })} />
        </label>
        {errors.title ? <p className="text-sm text-danger">{errors.title.message}</p> : null}

        <label className="block text-sm font-medium">
          Description
          <textarea rows={4} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2" {...register("description", { required: "Description is required." })} />
        </label>
        {errors.description ? <p className="text-sm text-danger">{errors.description.message}</p> : null}

        <label className="block text-sm font-medium">
          ISBN
          <input className="mt-1.5 h-10 w-full rounded-lg border border-line px-3" {...register("isbn_number", { required: "ISBN is required.", maxLength: 50 })} />
        </label>
        {errors.isbn_number ? <p className="text-sm text-danger">{errors.isbn_number.message}</p> : null}

        <label className="block text-sm font-medium">
          Author
          <select className="mt-1.5 h-10 w-full rounded-lg border border-line px-3" {...register("author_id", { required: "Author is required." })}>
            <option value="">Select author</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.author_name}
              </option>
            ))}
          </select>
        </label>
        {errors.author_id ? <p className="text-sm text-danger">{errors.author_id.message}</p> : null}

        <label className="block text-sm font-medium">
          Genre ID (optional)
          <input className="mt-1.5 h-10 w-full rounded-lg border border-line px-3" {...register("genre_id")} />
        </label>
        {errors.genre_id ? <p className="text-sm text-danger">{errors.genre_id.message}</p> : null}

        <label className="block text-sm font-medium">
          Quantity
          <input type="number" min={0} className="mt-1.5 h-10 w-full rounded-lg border border-line px-3" {...register("quantity", { valueAsNumber: true, min: 0 })} />
        </label>

        <label className="block text-sm font-medium">
          Cover image
          <input type="file" accept="image/*" className="mt-1.5 text-sm" {...register("book_image")} />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-line px-4 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="h-10 rounded-lg bg-brand px-4 text-sm text-white disabled:opacity-60">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
