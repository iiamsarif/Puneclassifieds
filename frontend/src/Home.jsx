import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const fallbackHero = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const Home = ({ apiBase }) => {
  const [query, setQuery] = useState("");
  const [news, setNews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [premiumPosts, setPremiumPosts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [heroImage, setHeroImage] = useState(() => {
    try {
      return localStorage.getItem("heroImageCache") || "";
    } catch {
      return "";
    }
  });
  const [heroBg, setHeroBg] = useState(() => {
    try {
      return localStorage.getItem("heroBgCache") || "";
    } catch {
      return "";
    }
  });
  const [banners, setBanners] = useState({ banner1: "", banner2: "", banner3: "", banner4: "" });
  const [stats, setStats] = useState({ citizens: 0, listings: 0, updates: 0, satisfaction: 0 });
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);
  const categoriesRef = useRef(null);
  const parallaxRef = useRef(null);
  const cleanText = (value) => (value || '').replace(/\\r?\\n/g, ' ').trim();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(() => {
    if (!token) return null;
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return null;
    }
  });
  const [showCongrats, setShowCongrats] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonials = [
    {
      name: "Aditi K.",
      role: "Kothrud Resident",
      quote: "The portal feels curated. I can trust the listings and notices I see.",
      avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=140&q=80"
    },
    {
      name: "Rahul M.",
      role: "Baner Resident",
      quote: "Posting a service was smooth and approval was fast. The team is helpful.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=140&q=80"
    },
    {
      name: "Sneha P.",
      role: "Shivaji Nagar Resident",
      quote: "Government updates are concise and easy to download from the same place.",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=140&q=80"
    }
  ];
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [premiumIndex, setPremiumIndex] = useState(0);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [n, g, c, p, premium, settings] = await Promise.all([
          fetch(`${apiBase}/api/news`).then((r) => r.json()),
          fetch(`${apiBase}/api/notifications`).then((r) => r.json()),
          fetch(`${apiBase}/api/categories`).then((r) => r.json()),
          fetch(`${apiBase}/api/posts?status=approved&limit=15`).then((r) => r.json()),
          fetch(`${apiBase}/api/posts?status=approved&paid=true&limit=6`).then((r) => r.json()),
          fetch(`${apiBase}/api/settings/web`).then((r) => r.json())
        ]);
        if (!mounted) return;
        setNews(Array.isArray(n) ? n : []);
        setNotifications(Array.isArray(g) ? g : []);
        setCategories(Array.isArray(c) ? c : []);
        setPosts(p?.items || []);
        setPremiumPosts(premium?.items || []);
        const nextHeroImage = settings?.heroImage || "";
        const nextHeroBg = settings?.heroBg || "";
        if (nextHeroImage && nextHeroImage !== heroImage) {
          setHeroImage(nextHeroImage);
          try {
            localStorage.setItem("heroImageCache", nextHeroImage);
          } catch {}
        }
        if (nextHeroBg && nextHeroBg !== heroBg) {
          setHeroBg(nextHeroBg);
          try {
            localStorage.setItem("heroBgCache", nextHeroBg);
          } catch {}
        }
        setBanners({
          banner1: settings?.banner1 || "",
          banner2: settings?.banner2 || "",
          banner3: settings?.banner3 || "",
          banner4: settings?.banner4 || ""
        });
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
    if (premiumPosts.length <= 1) return;
    const timer = setInterval(() => {
      setPremiumIndex((prev) => (prev + 1) % premiumPosts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [premiumPosts.length]);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const items = el.querySelectorAll("[data-speed], .parallax-media");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const view = window.innerHeight || 0;
        const progress = Math.min(Math.max((view - rect.top) / (view + rect.height), 0), 1);
        items.forEach((node) => {
          const speed = parseFloat(node.getAttribute("data-speed") || "0.6");
          const offset = (progress - 0.5) * speed * 320;
          node.style.transform = `translateY(${offset}px)`;
        });
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!statsStarted) return;
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
  }, [statsStarted]);

  const [categoriesVisible, setCategoriesVisible] = useState(false);
  useEffect(() => {
    const section = categoriesRef.current;
    if (!section) return;
    const reveal = () => {
      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
      if (inView && !categoriesVisible) {
        setCategoriesVisible(true);
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCategoriesVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(section);
    const onScroll = () => reveal();
    const onLoad = () => reveal();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", onLoad);
    reveal();
    return () => observer.disconnect();
  }, [categoriesVisible]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
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

  useEffect(() => {
    if (location.hash === "#pricing") {
      const section = document.getElementById("pricing");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePurchase = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    const ready = await loadRazorpay();
    if (!ready) {
      alert("Payment system failed to load.");
      return;
    }
    try {
      const orderRes = await fetch(`${apiBase}/api/payments/create-order`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || "Order creation failed");
      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "PuneClassifieds",
        description: "Monthly Premium Plan",
        order_id: orderData.order.id,
        handler: async (response) => {
          const verifyRes = await fetch(`${apiBase}/api/payments/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(response)
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed");
          const nextUser = { ...(user || {}), paid: true, paidUntil: verifyData.paidUntil };
          localStorage.setItem("user", JSON.stringify(nextUser));
          window.dispatchEvent(new Event("user-updated"));
          setUser(nextUser);
          setPaymentInfo({
            amount: "₹350",
            paidUntil: verifyData.paidUntil,
            plan: "Monthly Premium"
          });
          setShowCongrats(true);
        },
        theme: { color: "#0B163B" }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.message || "Payment failed");
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const term = query.trim();
    const run = async () => {
      try {
        const params = new URLSearchParams();
        params.set("status", "approved");
        params.set("search", term);
        params.set("limit", "24");
        const res = await fetch(`${apiBase}/api/posts?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        setSearchResults(data.items || []);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    };
    const timer = setTimeout(run, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [apiBase, query]);

  const goToCategory = (name) => {
    navigate(`/posts?category=${encodeURIComponent(name)}`);
  };

  return (
    <main className="page home-page">
      <section
        className="hero-section"
        style={{
          backgroundImage: heroBg ? `url(${heroBg})` : undefined
        }}
      >
        <div className="container hero-layout">
          <div className="hero-content">
            <div className="hero-tag section-label">Trusted Community Marketplace</div>
            <h1 className="hero-title">Discover verified local news, listings, and opportunities in Pune.</h1>
            <p className="hero-subtitle">
              PuneClassifieds is a premium civic portal where citizens explore government updates,
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

      <section className="section" id="categories" ref={categoriesRef}>
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
              <div
                key={cat._id}
                className={`card category-card ${categoriesVisible ? "jump-in" : ""}`}
                style={{ animationDelay: `${idx * 0.12}s` }}
              >
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

      {premiumPosts.length > 0 && (
        <section className="section premium-posts-section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="section-label">PREMIUM</div>
                <h2>Latest Premium Posts</h2>
                <p>Exclusive listings from paid members.</p>
              </div>
              <div className="premium-nav">
                <button
                  type="button"
                  onClick={() =>
                    setPremiumIndex((prev) => (prev - 1 + premiumPosts.length) % premiumPosts.length)
                  }
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setPremiumIndex((prev) => (prev + 1) % premiumPosts.length)}
                >
                  →
                </button>
              </div>
            </div>
            <div className="premium-card">
              <div className="premium-media">
                <img
                  src={
                    (premiumPosts[premiumIndex].imageUrls && premiumPosts[premiumIndex].imageUrls[0]) ||
                    premiumPosts[premiumIndex].imageUrl ||
                    premiumPosts[premiumIndex].imageData ||
                    fallbackHero
                  }
                  alt={premiumPosts[premiumIndex].title}
                />
              </div>
              <div className="premium-info">
                <div className="premium-meta">
                  <span className="badge">{premiumPosts[premiumIndex].category}</span>
                  <span className="muted">{premiumPosts[premiumIndex].location || "Premium Listing"}</span>
                </div>
                <h3>{premiumPosts[premiumIndex].title}</h3>
                <p className="clamp-3">{cleanText(premiumPosts[premiumIndex].description)}</p>
                <NavLink className="ghost-btn" to={`/posts/${premiumPosts[premiumIndex]._id}`}>
                  Read More →
                </NavLink>
              </div>
            </div>
          </div>
        </section>
      )}

      {banners.banner1 && (
        <section className="section banner-section">
          <div className="container">
            <div className="mid-banner">
              <img className="banner-image" src={banners.banner1} alt="Community banner" loading="lazy" />
            </div>
          </div>
        </section>
      )}

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
                    {((item.imageUrls && item.imageUrls[0]) || item.imageUrl || item.imageData) && (
                      <img
                        src={(item.imageUrls && item.imageUrls[0]) || item.imageUrl || item.imageData}
                        alt={item.title}
                        loading="lazy"
                      />
                    )}
                    <div>
                      <h4>{item.title || item.name}</h4>
                      <p className="clamp-2">{cleanText(item.description)}</p>
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

      <section className="section section-light news-section">
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
                <img src={(item.imageUrls && item.imageUrls[0]) || item.imageUrl || item.imageData || fallbackHero} alt={item.title} loading="lazy" />
                <div>
                  <span className="badge">{item.category}</span>
                  <h4>{item.title}</h4>
                  <p className="clamp-2">{cleanText(item.description)}</p>
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

      

      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="section-label">PRICING</div>
              <h2>Monthly Premium Plan</h2>
            </div>
            <p>Unlock higher limits and featured visibility.</p>
          </div>
          <div className="pricing-grid">
            <div className="card pricing-card">
              <h3>₹350 / month</h3>
              <p>Best for citizens posting services regularly.</p>
              <ul className="pricing-list">
                <li>Upload up to 5 photos per listing</li>
                <li>350 words max description</li>
                <li>Up to 50 posts per day</li>
                <li>Admin sets listing expiry on approval</li>
              </ul>
              <button className="primary-btn" onClick={handlePurchase} disabled={user?.paid}>
                {user?.paid ? "Plan Active" : "Purchase Now"}
              </button>
            </div>
            <div className="card pricing-card subtle">
              <h3>Free Plan</h3>
              <p>Perfect for occasional community listings.</p>
              <ul className="pricing-list">
                <li>Upload up to 3 photos per listing</li>
                <li>150 words max description</li>
                <li>Posts auto-expire after 30 days</li>
              </ul>
              <span className="plan-note">
                Current plan: {user?.paid ? "Paid" : "Free"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light featured-section">
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
                  <p className="clamp-2">{cleanText(item.description)}</p>
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
                <p className="clamp-2">{cleanText(item.description)}</p>
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
            <div className="about-visual parallax-media" data-speed="0.8">
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
              <h2>Why Use PuneClassifieds</h2>
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

      <section className="section parallax-section" ref={parallaxRef}>
        <div className="container">
          <div className="parallax-grid">
            <div className="parallax-tile media" data-speed="1.1">
              <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80" alt="Pet collars" />
            </div>
            <div className="parallax-tile media" data-speed="0.8">
              <img src="https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80" alt="Adoption" />
            </div>
            <div className="parallax-tile text">
              <span className="section-label">COMMUNITY PICK</span>
              <h2>Trusted Pet Care & Adoption</h2>
              <p>Verified pet listings, shelters, and care services curated for Pune residents.</p>
              <NavLink to="/posts?category=Pets" className="ghost-btn">Explore Pets</NavLink>
            </div>
            <div className="parallax-tile media" data-speed="1.2">
              <img src="https://images.pexels.com/photos/208984/pexels-photo-208984.jpeg?_gl=1*1dind9k*_ga*MTM2NDg4Njc4Ny4xNzcyODY2ODE5*_ga_8JE65Q40S6*czE3NzMzMDYwNDEkbzEyJGcxJHQxNzczMzA2MTUwJGo0MSRsMCRoMA.." alt="Pet care" />
            </div>
            <div className="parallax-tile text">
              <span className="section-label">LOCAL SERVICES</span>
              <h2>Care, Grooming, & Essentials</h2>
              <p>Discover community-rated trainers, groomers, and pet-friendly services.</p>
              <NavLink to="/services" className="ghost-btn">Explore Categories</NavLink>
            </div>
            <div className="parallax-tile media" data-speed="0.9">
              <img src="https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=1200&q=80" alt="Pet lifestyle" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light stats-process-section" ref={statsRef}>
        <div className="container">
          <div className="stats-strip">
            <div className="stat-item">
              <div className="stat-number">{(stats.citizens / 1000).toFixed(1)}k+</div>
              <p>Active citizens exploring verified updates daily.</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">{(stats.listings / 1000).toFixed(1)}k</div>
              <p>Approved listings across services and opportunities.</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.updates}</div>
              <p>Weekly community updates and public notices.</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.satisfaction}%</div>
              <p>Resident satisfaction with verified information.</p>
            </div>
          </div>

          <div className="process-block">
            <div className="section-label">PROCESS</div>
            <h2>A calm four-step workflow that keeps community content trusted.</h2>
            <div className="process-line">
              <div className="process-step">
                <span>01</span>
                <h4>Create Account</h4>
                <p>Sign up securely and build your citizen profile.</p>
              </div>
              <div className="process-step">
                <span>02</span>
                <h4>Submit Listing</h4>
                <p>Post services, jobs, or property listings with details.</p>
              </div>
              <div className="process-step">
                <span>03</span>
                <h4>Admin Review</h4>
                <p>Every submission is checked for clarity and accuracy.</p>
              </div>
              <div className="process-step">
                <span>04</span>
                <h4>Connect Locally</h4>
                <p>Reach trusted providers with verified contact info.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section testimonials-section">
        <div className="container">
          <div className="trusted-strip">
            <div className="section-label">TRUSTED BY</div>
            <h2>Selected civic teams, service networks, and local partners.</h2>
            <div className="trusted-logos">
              <div className="trusted-track">
                <span>PUNE COUNCIL</span>
                <span>URBAN CARE</span>
                <span>CIVIC CONNECT</span>
                <span>NEIGHBOR HOUSING</span>
                <span>PUBLIC SAFETY</span>
                <span>COMMUNITY HUB</span>
                <span>PUNE COUNCIL</span>
                <span>URBAN CARE</span>
                <span>CIVIC CONNECT</span>
                <span>NEIGHBOR HOUSING</span>
                <span>PUBLIC SAFETY</span>
                <span>COMMUNITY HUB</span>
              </div>
            </div>
          </div>

          <div className="testimonial-split">
            <div className="testimonial-left">
              <div className="testimonial-left-inner">
                <div className="section-label">OUR TESTIMONIALS</div>
                <h2>Customers talk about us</h2>
                <p>Real residents sharing the value of verified community updates.</p>
              </div>
            </div>
            <div className="testimonial-right">
              <div className="testimonial-top">
                <div className="testimonial-person">
                  <img
                    src={testimonials[testimonialIndex].avatar}
                    alt="Resident"
                  />
                  <div>
                    <h4>{testimonials[testimonialIndex].name}</h4>
                    <span>{testimonials[testimonialIndex].role}</span>
                  </div>
                </div>
                <div className="testimonial-nav">
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length)}
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="testimonial-quotes">
                <div key={testimonialIndex} className="testimonial-quote manual-fade">
                  <span className="quote-mark">“</span>
                  <p>{testimonials[testimonialIndex].quote}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light faq-section">
        <div className="container">
          <div className="section-head">
            <div className="section-label">FAQS</div>
            
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

      

      {showCongrats && (
        <div className="modal-overlay" onClick={() => setShowCongrats(false)}>
          <div className="modal-card congrats-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-tick">
              <span>✓</span>
            </div>
            <h2>Congratulations!</h2>
            <p>You are now on the Premium plan.</p>
            <div className="payment-summary">
              <div>
                <span>Plan</span>
                <strong>{paymentInfo?.plan || "Premium"}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{paymentInfo?.amount || "₹350"}</strong>
              </div>
              <div>
                <span>Valid Until</span>
                <strong>{paymentInfo?.paidUntil ? new Date(paymentInfo.paidUntil).toLocaleDateString() : "—"}</strong>
              </div>
            </div>
            <button className="primary-btn" onClick={() => setShowCongrats(false)}>Continue</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;










