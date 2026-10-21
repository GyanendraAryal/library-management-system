import { useForm } from "react-hook-form";
import Modal from "./ui/Modal";
import Alert from "./ui/Alert";
import type { Book } from "../types";
import { borrowingService } from "../services/borrowingService";
import { isApiError } from "../utils/errors";
import { useState } from "react";

interface BorrowForm {
  requested_days: number;
}

interface BorrowModalProps {
  book: Book | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function BorrowModal({ book, onClose, onSuccess }: BorrowModalProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BorrowForm>({
    defaultValues: { requested_days: 15 },
  });

  const onSubmit = async (values: BorrowForm) => {
    if (!book) return;
    setApiError(null);
    try {
      await borrowingService.submitBorrowRequest({
        book_id: book.id,
        requested_days: Number(values.requested_days),
      });
      onSuccess("Borrow request submitted successfully.");
    } catch (error) {
      setApiError(isApiError(error) ? error.message : "Unable to submit borrow request.");
    }
  };

  return (
    <Modal open={!!book} title="Request this book" onClose={onClose}>
      {book ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <p className="text-sm text-ink-muted">
            Request <span className="font-medium text-ink">{book.title}</span> for between 1 and 30 days.
          </p>
          {apiError ? <Alert tone="error">{apiError}</Alert> : null}
          <label className="block text-sm font-medium text-ink">
            Requested days
            <input
              type="number"
              min={1}
              max={30}
              className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-ink outline-none focus:border-brand"
              {...register("requested_days", {
                required: "Requested days are required.",
                valueAsNumber: true,
                min: { value: 1, message: "Minimum is 1 day." },
                max: { value: 30, message: "Maximum is 30 days." },
              })}
            />
          </label>
          {errors.requested_days ? (
            <p className="text-sm text-danger">{errors.requested_days.message}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-line px-4 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {isSubmitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
