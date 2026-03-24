import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "./logo.png";
import { getWebSettings } from "./webSettingsCache";

const Navbar = ({ apiBase }) => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [marqueeText, setMarqueeText] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const activeCategory = new URLSearchParams(location.search).get("category") || "";
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(() => {
    if (!token) return null;
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setProfileOpen(false);
    window.dispatchEvent(new Event("user-updated"));
    navigate("/login");
  };

  useEffect(() => {
    if (!apiBase) return;
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setCategories(data))
      .catch(console.error);
  }, [apiBase]);

  useEffect(() => {
    if (!apiBase) return;
    getWebSettings(apiBase)
      .then((data) => setMarqueeText(data?.marqueeText || ""))
      .catch(console.error);
  }, [apiBase]);

  useEffect(() => {
    if (!token || !apiBase) return;
    fetch(`${apiBase}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data?.email) {
          localStorage.setItem("user", JSON.stringify(data));
          setUser(data);
          window.dispatchEvent(new Event("user-updated"));
        }
      })
      .catch(console.error);
  }, [apiBase, token]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      try {
        const next = localStorage.getItem("user");
        setUser(next ? JSON.parse(next) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", syncUser);
    window.addEventListener("user-updated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("user-updated", syncUser);
    };
  }, []);

  const goPricing = () => {
    setOpen(false);
    setProfileOpen(false);
    if (location.pathname !== "/") {
      navigate("/#pricing");
      return;
    }
    const section = document.getElementById("pricing");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <NavLink to="/" className="logo" onClick={() => setOpen(false)}>
          <img
            className="logo-mark"
            src={logo}
            alt="PuneClassifieds"
          />
          <span className="logo-text">
            Pune<span>Classifieds</span>
          </span>
        </NavLink>
        <nav className={`nav-links ${open ? "open" : ""}`}>
          <div className="mobile-menu-brand">
            <img className="logo-mark" src={logo} alt="PuneClassifieds" />
            <span className="logo-text">Pune<span>Classifieds</span></span>
            <button
              type="button"
              className="mobile-menu-close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          <button className="nav-link-button" type="button" onClick={goPricing}>Pricing</button>
          <NavLink to="/news" onClick={() => setOpen(false)}>News</NavLink>
          {categories.map((cat) => {
            const types = Array.isArray(cat.types) ? cat.types : [];
            return (
              <div className={`nav-item ${openDropdown === cat._id ? "open" : ""}`} key={cat._id}>
                <NavLink
                  to={`/posts?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => { setOpen(false); setOpenDropdown(null); }}
                  className={({ isActive }) =>
                    isActive && activeCategory === cat.name ? "active" : ""
                  }
                >
                  <span className="nav-link-label">
                    {cat.name}
                  </span>
                </NavLink>
                {types.length > 0 && (
                  <button
                    type="button"
                    className="nav-caret-btn"
                    aria-label={`Toggle ${cat.name} types`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenDropdown((prev) => (prev === cat._id ? null : cat._id));
                    }}
                  >
                    <span className="nav-caret">▾</span>
                  </button>
                )}
                {types.length > 0 && (
                  <div className="nav-dropdown">
                    {types.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          setOpenDropdown(null);
                          navigate(`/posts?category=${encodeURIComponent(cat.name)}&type=${encodeURIComponent(type)}`);
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <NavLink to="/notifications" onClick={() => setOpen(false)}>Notifications</NavLink>
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
                  <p className="profile-email">{user?.email || "user@PuneClassifieds.com"}</p>
                  <span className={`plan-badge ${user?.paid ? "paid" : "free"}`}>
                    {user?.paid ? "Paid Plan" : "Free Plan"}
                  </span>
                  <NavLink to="/my-posts" className="ghost-btn" onClick={() => setProfileOpen(false)}>
                    My Posts
                  </NavLink>
                  <NavLink to="/account" className="ghost-btn" onClick={() => setProfileOpen(false)}>
                    Settings
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
            {open ? (
              <span className="hamburger-close">×</span>
            ) : (
              <>
                <span></span>
                <span></span>
              </>
            )}
          </button>
        </div>
      </div>
      {marqueeText.trim() && (
        <div className="header-marquee" role="status" aria-live="polite">
          <div className="header-marquee-track">
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
