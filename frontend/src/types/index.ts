export interface PublicUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface User {
  id: number;
  phone: string | null;
  image: string | null;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  username: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  message: string;
  data: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface Author {
  id: number;
  author_name: string;
  authors_biography: string | null;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  title: string;
  description: string;
  isbn_number: string;
  book_image: string | null;
  genre: Genre | null;
  quantity: number;
  available_quantity: number;
  user: PublicUser | null;
  author: Author;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type BorrowStatus = "P" | "A" | "SR" | "R" | "C" | "RT";

export const BORROW_STATUS_LABELS: Record<BorrowStatus, string> = {
  P: "Pending",
  A: "Approved",
  SR: "Submitted for Return",
  R: "Rejected",
  C: "Cancelled",
  RT: "Returned",
};

export interface BorrowRequest {
  id: number;
  user: PublicUser;
  book: Book;
  requested_days: number;
  status: BorrowStatus;
  approved_days: number | null;
  requested_at: string;
  approved_at: string | null;
  returned_at: string | null;
  approved_by: PublicUser | null;
}

export interface BorrowRequestPayload {
  book_id: number;
  requested_days: number;
}

export interface ApprovePayload {
  approved_days: number;
}

export type Availability = "all" | "available" | "unavailable";
export type SortOption = "relevance" | "title" | "author" | "availability";
