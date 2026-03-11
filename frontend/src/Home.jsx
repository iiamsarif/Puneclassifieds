import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const fallbackHero = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const Home = ({ apiBase }) => {
  const [query, setQuery] = useState("");
  const [news, setNews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [heroImage, setHeroImage] = useState("");
  const [stats, setStats] = useState({ citizens: 0, listings: 0, updates: 0, satisfaction: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [n, g, c, p, settings] = await Promise.all([
          fetch(`${apiBase}/api/news`).then((r) => r.json()),
          fetch(`${apiBase}/api/notifications`).then((r) => r.json()),
          fetch(`${apiBase}/api/categories`).then((r) => r.json()),
          fetch(`${apiBase}/api/posts?status=approved&limit=15`).then((r) => r.json()),
          fetch(`${apiBase}/api/settings/web`).then((r) => r.json())
        ]);
        if (!mounted) return;
        setNews(n);
        setNotifications(g);
        setCategories(c);
        setPosts(p.items || []);
        if (settings?.heroImage) {
          setHeroImage(settings.heroImage);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const handleFocus = () => load();
    load();
    const interval = setInterval(load, 20000);
    window.addEventListener("focus", handleFocus);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [apiBase]);

  useEffect(() => {
    if (location.hash === "#categories") {
      const el = document.getElementById("categories");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  useEffect(() => {
    const targets = { citizens: 12000, listings: 3500, updates: 580, satisfaction: 92 };
    const start = performance.now();
    const duration = 1600;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setStats({
        citizens: Math.round(targets.citizens * ease),
        listings: Math.round(targets.listings * ease),
        updates: Math.round(targets.updates * ease),
        satisfaction: Math.round(targets.satisfaction * ease)
      });
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matchesPost = (item) =>
      [item.title, item.category, item.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q));
    return posts.filter(matchesPost).slice(0, 8);
  }, [query, news, posts, notifications]);

  const goToCategory = (name) => {
    navigate(`/posts?category=${encodeURIComponent(name)}`);
  };

  return (
    <main className="page home-page">
      <section className="hero-section">
        <div className="container hero-layout">
          <div className="hero-content">
            <div className="hero-tag section-label">Trusted Community Marketplace</div>
            <h1 className="hero-title">Discover verified local news, listings, and opportunities in Pune.</h1>
            <p className="hero-subtitle">
              PUneClass is a premium civic portal where citizens explore government updates,
              post community services, and access curated listings with confidence.
            </p>
            <div className="hero-actions">
              <NavLink to="/post-service" className="primary-btn">Post a Service</NavLink>
              <NavLink to="/posts" className="ghost-btn">View Posts</NavLink>
            </div>
          </div>
          <div className="hero-visual">
            {heroImage && (
              <img
                className="hero-image"
                src={heroImage}
                alt="Community"
                loading="lazy"
              />
            )}
            <div className="floating-card card-a">
              <p>Verified Services</p>
              <span>1.2k active</span>
            </div>
            <div className="floating-card card-b">
              <p>Community Posts</p>
              <span>Updated daily</span>
            </div>
            <div className="floating-card card-c">
              <p>Gov Notifications</p>
              <span>Live updates</span>
            </div>
            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      <section className="section" id="categories">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-label">CATEGORIES</div>
              <h2>Service Categories</h2>
            </div>
            <NavLink to="/services">View all</NavLink>
          </div>
          <div className="services-grid">
            {categories.slice(0, 6).map((cat, idx) => (
              <div key={cat._id} className="card category-card">
                {(cat.iconData || cat.iconUrl) && (
                  <img
                    className="category-icon"
                    src={cat.iconData || cat.iconUrl}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="service-number">{String(idx + 1).padStart(2, "0")}</div>
                <h4>{cat.name}</h4>
                <p>{cat.description || "Explore verified listings."}</p>
                <button className="ghost-btn" onClick={() => goToCategory(cat.name)}>View Posts</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-label">SEARCH</div>
              <h2>Global Search</h2>
            </div>
            <p>Search news, posts, and notifications in one place.</p>
          </div>
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search listings, services, or updates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="primary-btn">Search</button>
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((item) => (
                  <div key={item._id || item.title} className="card media-card">
                    {item.imageData && (
                      <img src={item.imageData} alt={item.title} loading="lazy" />
                    )}
                    <div>
                      <h4>{item.title || item.name}</h4>
                      {item.location && <p className="muted">Location: {item.location}</p>}
                      <NavLink className="ghost-btn" to={`/posts/${item._id}`}>Reach Out</NavLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-label">FEATURED</div>
              <h2>Featured Posts</h2>
            </div>
            <NavLink to="/posts">View all</NavLink>
          </div>
          <div className="grid featured-grid">
            {posts.slice(0, 15).map((item) => (
              <article key={item._id} className="card media-card featured-card">
                <img src={item.imageData || fallbackHero} alt={item.title} loading="lazy" />
                <div>
                  <span className="badge">{item.category}</span>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  {item.location && <p className="muted">Location: {item.location}</p>}
                  <NavLink className="ghost-btn" to={`/posts/${item._id}`}>Reach Out</NavLink>
                </div>
              </article>
            ))}
            <NavLink to="/posts" className="card featured-viewall">
              <h4>View All Posts</h4>
              <p>Browse the complete marketplace feed.</p>
              <span className="ghost-btn">View All</span>
            </NavLink>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-label">NEWS</div>
              <h2>Latest News</h2>
            </div>
            <NavLink to="/news">View all</NavLink>
          </div>
          <div className="grid">
            {news.slice(0, 3).map((item) => (
              <NavLink key={item._id} to={`/news/${item._id}`} className="card media-card">
                <img src={item.imageData || item.image || fallbackHero} alt={item.title} loading="lazy" />
                <div>
                  <span className="badge">{item.category}</span>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-label">ALERTS</div>
              <h2>Government Notifications</h2>
            </div>
            <NavLink to="/notifications">View all</NavLink>
          </div>
          <div className="grid">
            {notifications.slice(0, 3).map((item) => (
              <NavLink key={item._id} to={`/notifications/${item._id}`} className="card">
                <span className="badge">{item.category}</span>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container about-layout">
          <div>
            <div className="section-label">ABOUT</div>
            <h2>Community Services</h2>
            <p>
              Verified professionals, local services, and trusted vendors in one curated marketplace.
              Find the right support quickly with community-rated insights.
            </p>
            <div className="about-visual">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
                alt="Community"
                loading="lazy"
              />
            </div>
          </div>
          <div className="stat-grid">
            <div className="card float-card">
              <h3>98%</h3>
              <p>Verification success rate</p>
            </div>
            <div className="card float-card">
              <h3>24 hrs</h3>
              <p>Average approval time</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-label">WHY US</div>
              <h2>Why Use PUneClass</h2>
            </div>
            <p>Minimal, curated, and trusted community updates.</p>
          </div>
          <div className="section-visual">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
              alt="Why us"
              loading="lazy"
            />
          </div>
          <div className="services-grid">
            <div className="card">
              <div className="service-number">01</div>
              <h4>Verified Content</h4>
              <p>Admin approval ensures every listing matches community standards.</p>
            </div>
            <div className="card">
              <div className="service-number">02</div>
              <h4>Unified Search</h4>
              <p>Search across services, posts, and news instantly.</p>
            </div>
            <div className="card">
              <div className="service-number">03</div>
              <h4>Secure Access</h4>
              <p>JWT authentication keeps your listings and profile protected.</p>
            </div>
            <div className="card">
              <div className="service-number">04</div>
              <h4>Premium Support</h4>
              <p>Community-first support with fast resolution times.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-head">
            <div className="section-label">STATS</div>
            <h2>User Statistics</h2>
          </div>
          <div className="section-visual align-right">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80"
              alt="Stats"
              loading="lazy"
            />
          </div>
          <div className="stats-grid">
            <div className="card">
              <div className="stat-number">{(stats.citizens / 1000).toFixed(1)}k+</div>
              <p>Active citizens</p>
            </div>
            <div className="card">
              <div className="stat-number">{(stats.listings / 1000).toFixed(1)}k</div>
              <p>Verified listings</p>
            </div>
            <div className="card">
              <div className="stat-number">{stats.updates}</div>
              <p>Weekly updates</p>
            </div>
            <div className="card">
              <div className="stat-number">{stats.satisfaction}%</div>
              <p>Satisfaction score</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-label">PROCESS</div>
            <h2>How It Works</h2>
          </div>
          <div className="section-visual align-left">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"
              alt="Process"
              loading="lazy"
            />
          </div>
          <div className="services-grid">
            <div className="card">
              <div className="service-number">01</div>
              <h4>Create Account</h4>
              <p>Sign up securely with your email and verify instantly.</p>
            </div>
            <div className="card">
              <div className="service-number">02</div>
              <h4>Post Service</h4>
              <p>Submit listings with categories and images.</p>
            </div>
            <div className="card">
              <div className="service-number">03</div>
              <h4>Get Approved</h4>
              <p>Admins review listings before they go live.</p>
            </div>
            <div className="card">
              <div className="service-number">04</div>
              <h4>Connect</h4>
              <p>Reach out to verified providers with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-head">
            <div className="section-label">TESTIMONIALS</div>
            <h2>Community Testimonials</h2>
          </div>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="testimonial-avatar">AK</div>
              <p>"Premium layout and verified listings make everything feel trustworthy."</p>
              <span>- Aditi K.</span>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-avatar">RM</div>
              <p>"Posted a service and got approved fast. Super smooth."</p>
              <span>- Rahul M.</span>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-avatar">SP</div>
              <p>"The government updates section keeps me informed daily."</p>
              <span>- Sneha P.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-label">FAQS</div>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-grid">
            <div className="card faq-card">
              <h4>How are listings verified?</h4>
              <p>Admins review every submission before it appears publicly.</p>
            </div>
            <div className="card faq-card">
              <h4>How long does approval take?</h4>
              <p>Most listings are approved within 24 hours.</p>
            </div>
            <div className="card faq-card">
              <h4>Can I edit a post after approval?</h4>
              <p>Yes, you can edit your posts from the profile menu.</p>
            </div>
            <div className="card faq-card">
              <h4>Is my data secure?</h4>
              <p>We use JWT authentication and admin approvals for safety.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
