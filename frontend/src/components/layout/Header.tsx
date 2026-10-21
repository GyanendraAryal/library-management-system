import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  CircleUserRound,
  Menu,
  Moon,
  Search,
  Sun,
  X,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useAppDispatch, useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import { clearCredentials } from "../../store/authSlice";

interface HeaderProps {
  dark: boolean;
  onToggleTheme: () => void;
}

const MEMBER_NAV = [
  { to: "/catalogue", label: "Catalogue" },
  { to: "/borrowings", label: "My Borrowings" },
  { to: "/admin/authors", label: "Authors" },
];

const STAFF_NAV = [
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/history", label: "History" },
  { to: "/admin/books", label: "Books" },
  { to: "/admin/users", label: "Members" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm no-underline transition-colors duration-200
   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand
   ${
     isActive
       ? "bg-surface-muted font-semibold text-brand"
       : "font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
   }`;

export default function Header({ dark, onToggleTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isStaff, user } = useAuth();
  const dispatch = useAppDispatch();

  const navItems = isAuthenticated
    ? isStaff
      ? [...MEMBER_NAV, ...STAFF_NAV]
      : MEMBER_NAV
    : [
        { to: "/catalogue", label: "Catalogue" },
        { to: "/about", label: "About" },
      ];

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      searchInputRef.current?.focus();
      return;
    }
    setSearchOpen(false);
    navigate(`/catalogue?search=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Token may already be invalid; still clear local session.
    }
    dispatch(clearCredentials());
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:min-h-[72px] lg:px-8">
          <div className="flex min-w-0 items-center gap-4 xl:gap-8">
            <Link to="/" aria-label="Library home" className="inline-flex shrink-0 items-center gap-2.5 no-underline">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#03593D] text-white shadow-sm">
                <BookOpen size={22} strokeWidth={2} />
              </span>
              <span className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                Library<span className="text-brand">.</span>
              </span>
            </Link>

            <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex xl:gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
              aria-label="Search catalogue"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand max-sm:size-10 max-sm:px-0"
            >
              <Search size={18} />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] lg:inline">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              className="inline-flex size-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  aria-label="My profile"
                  className="hidden size-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-brand sm:inline-flex"
                >
                  <CircleUserRound size={22} strokeWidth={1.8} />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink sm:inline-flex"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-white no-underline hover:bg-brand-hover sm:inline-flex"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                setSearchOpen(false);
                setMenuOpen((open) => !open);
              }}
              className="inline-flex size-10 items-center justify-center rounded-xl text-ink hover:bg-surface-muted lg:hidden"
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <div className={`lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
          className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className={`fixed inset-y-0 right-0 z-[70] flex h-dvh w-[min(85vw,360px)] flex-col overflow-y-auto border-l border-line bg-surface p-5 shadow-2xl transition-transform duration-300 ease-out sm:p-6 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-7 flex items-center justify-between border-b border-line pb-5">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-2.5 font-bold text-ink no-underline"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#03593D] text-white">
                <BookOpen size={20} />
              </span>
              <span>
                Library<span className="text-brand">.</span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="flex size-10 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted"
            >
              <X size={21} />
            </button>
          </div>

          {user ? (
            <p className="mb-4 px-3 text-sm text-ink-muted">Signed in as {user.username}</p>
          ) : null}

          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="my-5 border-t border-line" />

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-muted no-underline hover:bg-surface-muted hover:text-ink"
              >
                <CircleUserRound size={19} />
                My Profile
                <ArrowRight className="ml-auto" size={16} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                <LogOut size={19} />
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-brand px-3 py-3 text-center text-sm font-medium text-white no-underline"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-sm sm:pt-[20vh]">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalogue-search-title"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            <div className="border-b border-line p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="catalogue-search-title" className="text-base font-semibold text-ink">
                  Search the catalogue
                </h2>
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className="flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                >
                  <X size={19} />
                </button>
              </div>
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted/50 px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                  <Search size={19} className="shrink-0 text-ink-muted" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search books, authors, or genre..."
                    aria-label="Search books, authors, or genre"
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                  />
                  <button
                    type="submit"
                    aria-label="Submit search"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white hover:opacity-85"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
