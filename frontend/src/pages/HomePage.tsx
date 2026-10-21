import { Link } from "react-router";
import { ArrowLeftRight, Library, Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const FEATURES = [
  {
    Icon: Library,
    title: "Browse the catalogue",
    body: "Search titles, authors, and genres, then request a copy when it is available.",
  },
  {
    Icon: ArrowLeftRight,
    title: "Borrow and return",
    body: "Members submit requests. Staff approve loans and confirm returns.",
  },
  {
    Icon: Search,
    title: "Staff tools",
    body: "Librarians manage books, authors, members, and the full request queue.",
  },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-16 max-md:px-4">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
        Library Management System
      </p>
      <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight max-md:text-[28px]">
        {isAuthenticated ? `Welcome back, ${user?.first_name || user?.username}.` : "A quiet place for every curious mind."}
      </h1>
      <p className="mt-3 max-w-[520px] text-ink-muted">
        Track the collection, request loans, and manage returns through the existing library API.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/catalogue"
          className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-white no-underline hover:bg-brand-hover"
        >
          Browse catalogue
        </Link>
        {!isAuthenticated ? (
          <Link
            to="/login"
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink no-underline hover:bg-surface-muted"
          >
            Sign in
          </Link>
        ) : (
          <Link
            to="/borrowings"
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-ink no-underline hover:bg-surface-muted"
          >
            My borrowings
          </Link>
        )}
      </div>

      <ul className="mt-14 grid gap-5 sm:grid-cols-3">
        {FEATURES.map(({ Icon, title, body }) => (
          <li key={title} className="rounded-xl border border-line bg-surface p-5">
            <Icon className="text-brand" size={22} />
            <h2 className="mt-3 font-serif text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
