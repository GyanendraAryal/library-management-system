import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { booksService } from "../../services/booksService";
import type { Author } from "../../types";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Alert from "../../components/ui/Alert";
import { isApiError } from "../../utils/errors";

type AuthorForm = {
  author_name: string;
  authors_biography: string;
};

export default function ManageAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Author | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Author | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setAuthors(await booksService.listAuthors());
    } catch (err) {
      setError(isApiError(err) ? err.message : "Unable to load authors.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-12 max-md:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Authors</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Add author
        </button>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Authors cannot be deleted if they still have books (the API protects those records).
      </p>
      <div className="mt-4 space-y-3">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
      </div>

      {authors.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">No authors yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {authors.map((author) => (
            <li key={author.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-medium">{author.author_name}</p>
                <p className="mt-1 text-sm text-ink-muted">{author.authors_biography || "No biography"}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <button type="button" className="text-brand hover:underline" onClick={() => setEditing(author)}>
                  Edit
                </button>
                <button type="button" className="text-danger hover:underline" onClick={() => setDeleting(author)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AuthorFormModal
        open={creating || !!editing}
        author={editing}
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
        title="Delete author"
        message={`Delete “${deleting?.author_name}”? This fails if books still reference them.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          setError(null);
          try {
            await booksService.deleteAuthor(deleting.id);
            setSuccess("Author deleted successfully");
            setDeleting(null);
            await load();
          } catch (err) {
            setError(isApiError(err) ? err.message : "Unable to delete author. They may still have books.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </main>
  );
}

function AuthorFormModal({
  open,
  author,
  onClose,
  onSaved,
}: {
  open: boolean;
  author: Author | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthorForm>();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    reset({
      author_name: author?.author_name ?? "",
      authors_biography: author?.authors_biography ?? "",
    });
    setFormError(null);
  }, [author, open, reset]);

  return (
    <Modal open={open} title={author ? "Edit author" : "Add author"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          try {
            if (author) {
              await booksService.updateAuthor(author.id, values);
              await onSaved("Author updated successfully");
            } else {
              await booksService.createAuthor(values);
              await onSaved("Author created successfully");
            }
          } catch (err) {
            if (isApiError(err)) {
              if (err.fields.author_name) setError("author_name", { message: err.fields.author_name });
              else setFormError(err.message);
              return;
            }
            setFormError("Unable to save author.");
          }
        })}
      >
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        <label className="block text-sm font-medium">
          Name
          <input
            className="mt-1.5 h-10 w-full rounded-lg border border-line px-3"
            {...register("author_name", { required: "Author name is required.", maxLength: 100 })}
          />
        </label>
        {errors.author_name ? <p className="text-sm text-danger">{errors.author_name.message}</p> : null}
        <label className="block text-sm font-medium">
          Biography
          <textarea
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2"
            {...register("authors_biography")}
          />
        </label>
        <div className="flex justify-end gap-2">
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
    </Modal>
  );
}
