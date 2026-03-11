import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Navbar = ({ apiBase }) => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setProfileOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    if (!apiBase) return;
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setCategories(data))
      .catch(console.error);
  }, [apiBase]);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="logo" onClick={() => setOpen(false)}>
          <span className="logo-mark">pc</span>
          <span className="logo-text">PUneClass</span>
        </NavLink>
        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/news" onClick={() => setOpen(false)}>News</NavLink>
          {categories.map((cat) => (
            <NavLink
              key={cat._id}
              to={`/posts?category=${encodeURIComponent(cat.name)}`}
              onClick={() => setOpen(false)}
            >
              {cat.name}
            </NavLink>
          ))}
          <NavLink to="/notifications" onClick={() => setOpen(false)}>Government Notifications</NavLink>
          <NavLink to="/contact" onClick={() => setOpen(false)}>Contact</NavLink>
        </nav>
        <div className="nav-actions">
          {token ? (
            <div className="profile-wrap">
              <button
                className="profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Open profile menu"
              >
                <span className="profile-avatar">
                  {(user?.name || "U").slice(0, 1).toUpperCase()}
                </span>
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <p className="profile-name">{user?.name || "Community Member"}</p>
                  <p className="profile-email">{user?.email || "user@puneclassifieds.com"}</p>
                  <NavLink to="/my-posts" className="ghost-btn" onClick={() => setProfileOpen(false)}>
                    My Posts
                  </NavLink>
                  <button className="ghost-btn" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/login" className="nav-cta" onClick={() => setOpen(false)}>
              Login
            </NavLink>
          )}
          <button
            className={`hamburger ${open ? "active" : ""}`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
