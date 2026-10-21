import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-[640px] px-6 py-16 text-center">
      <h1 className="font-serif text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-ink-muted">That route does not exist in this application.</p>
      <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm text-white no-underline">
        Go home
      </Link>
    </main>
  );
}
