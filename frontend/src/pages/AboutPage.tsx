export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-16 max-md:px-4">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">About</p>
      <h1 className="font-serif text-4xl font-semibold">The library desk, online</h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        This application is the member and staff interface for the Library Management System API.
        Members can browse books, submit borrow requests, and ask to return titles they currently hold.
        Staff can maintain the catalogue, approve loans, and confirm returns.
      </p>
    </main>
  );
}
