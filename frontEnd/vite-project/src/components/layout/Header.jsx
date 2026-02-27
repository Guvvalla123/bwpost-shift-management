import { Link } from "react-router-dom";

export default function Header() {
  const user = false; // replace later with auth check

  const navItem =
    "relative text-gray-700 hover:text-blue-700 transition duration-200 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full";

  return (
    <header className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-blue-700"
        >
          BW<span className="text-indigo-600">POST</span>
        </Link>

        {/* NAVIGATION */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className={navItem}>Home</Link>
          <Link to="/" className={navItem}>Products</Link>
          <Link to="/" className={navItem}>Digital Shipping</Link>
          <Link to="/" className={navItem}>Services</Link>
          <Link to="/" className={navItem}>Jobs</Link>
          <Link to="/" className={navItem}>About Us</Link>
          <Link to="/" className={navItem}>Contact Us</Link>
        </nav>

        {/* AUTH BUTTONS */}
        {!user && (
          <div className="flex items-center gap-3">

            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
            >
              Register
            </Link>

            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
            >
              Login
            </Link>

          </div>
        )}
      </div>
    </header>
  );
}
