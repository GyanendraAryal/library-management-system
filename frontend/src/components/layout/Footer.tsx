import { NavLink } from "react-router";

const FOOTER_LINKS = [
  { to: "/catalogue", label: "Browse catalogue" },
  { to: "/login", label: "Sign in" },
  { to: "/about", label: "About" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand text-white">
      <div className="container px-8 py-12 max-md:px-4 max-md:py-8">
        <h2 className="text-xl font-semibold">Library Management System</h2>
        <p className="mt-2 text-sm text-white/80">A quiet place for every curious mind.</p>

        <nav className="mt-6 flex flex-col gap-3">
          {FOOTER_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} className="text-sm text-white no-underline hover:underline">
              {item.label}
            </NavLink>
          ))}
        </nav>

        <p className="mt-8 text-xs text-white/70">© {year} Library Management System</p>
      </div>
    </footer>
  );
}
