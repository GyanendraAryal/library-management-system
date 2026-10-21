import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router";

function Layout() {
  const [isDark, setIsDark] = useState(false);
  return (
    <div className={`min-h-screen bg-paper font-sans text-ink ${isDark ? "dark" : ""}`}>
      <Header dark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
      <Outlet />
      <Footer />
    </div>
  );
}

export default Layout;
