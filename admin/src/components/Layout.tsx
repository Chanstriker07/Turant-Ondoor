import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

const nav = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/bookings", label: "Bookings", icon: "📅" },
  { to: "/services", label: "Services", icon: "🛠️" },
  { to: "/providers", label: "Providers", icon: "👷" },
  { to: "/businesses", label: "Listings", icon: "🏪" },
  { to: "/listing-categories", label: "Listing categories", icon: "🗂️" },
  { to: "/users", label: "Users", icon: "👥" },
  { to: "/reviews", label: "Reviews", icon: "⭐" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div>
            <strong>Turant Ondoor</strong>
            <small>Admin</small>
          </div>
        </div>
        <nav>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>
            <strong>{user?.name ?? "Admin"}</strong>
            <small>+91 {user?.phone}</small>
          </div>
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
