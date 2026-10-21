import { BASE_URL } from "../services/api";
import type { Book } from "../types";

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function isBookAvailable(book: Book) {
  return book.available_quantity > 0;
}
