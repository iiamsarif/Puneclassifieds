import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getWebSettings } from "./webSettingsCache";

const fallbackHero = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const Home = ({ apiBase }) => {
  const [query, setQuery] = useState("");
  const [news, setNews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [latestPetPosts, setLatestPetPosts] = useState([]);
  const [premiumPosts, setPremiumPosts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [heroImage, setHeroImage] = useState(() => {
    try {
      return localStorage.getItem("heroImageCache") || "";
    } catch {
      return "";
    }
  });
  const [heroVideo, setHeroVideo] = useState(() => {
    try {
      return localStorage.getItem("heroVideoCache") || "";
    } catch {
      return "";
    }
  });
  const [heroMediaMode, setHeroMediaMode] = useState(() => {
    try {
      return localStorage.getItem("heroMediaModeCache") || "image";
    } catch {
      return "image";
    }
  });
  const [popupVideo, setPopupVideo] = useState("");
  const [popupLink, setPopupLink] = useState("");
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [heroBg, setHeroBg] = useState(() => {
    try {
      return localStorage.getItem("heroBgCache") || "";
    } catch {
      return "";
    }
  });
  const [heroBgList, setHeroBgList] = useState(() => {
    try {
      const raw = localStorage.getItem("heroBgListCache");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [heroBgVersion, setHeroBgVersion] = useState(() => {
    try {
      return Number(localStorage.getItem("heroBgVersionCache") || "0");
    } catch {
      return 0;
    }
  });
  const [heroSlide, setHeroSlide] = useState({
    current: 0,
    previous: null,
    animating: false,
    direction: "ltr"
  });
  const heroCurrentRef = useRef(0);
  const [sideAds, setSideAds] = useState({ sideAd1: "", sideAd2: "", sideAd3: "" });
  const [homeWideAd, setHomeWideAd] = useState("");
  const [banners, setBanners] = useState({ banner1: "", banner2: "", banner3: "", banner4: "" });
  const [stats, setStats] = useState({ citizens: 0, listings: 0, updates: 0, satisfaction: 0 });
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);
  const categoriesRef = useRef(null);
  const parallaxRef = useRef(null);
  const popupShownRef = useRef(false);
  const cleanText = (value) => (value || '').replace(/\\r?\\n/g, ' ').trim();
  const withCacheVersion = (url, version) => {
    if (!url) return "";
    if (!version) return url;
    const hasQuery = url.includes("?");
    return `${url}${hasQuery ? "&" : "?"}v=${version}`;
  };
  const truncateWords = (value, limit = 12) => {
    const words = cleanText(value).split(/\s+/).filter(Boolean);
    if (words.length <= limit) return words.join(" ");
    return `${words.slice(0, limit).join(" ")}...`;
  };
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
  const [heroNewsIndex, setHeroNewsIndex] = useState(0);
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
  const [petIndex, setPetIndex] = useState(0);
  const [petCardWidth, setPetCardWidth] = useState(300);
  const [heroNoticeIndex, setHeroNoticeIndex] = useState(0);
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const petPosts = useMemo(() => {
    if (Array.isArray(latestPetPosts) && latestPetPosts.length > 0) {
      return latestPetPosts.slice(0, 10);
    }
    return posts
      .filter((item) => String(item.category || "").toLowerCase() === "pets")
      .slice(0, 10);
  }, [posts, latestPetPosts]);
  const formatTimeAgo = (value) => {
    if (!value) return "Just now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";
    const diff = Date.now() - date.getTime();
    const mins = Math.max(1, Math.floor(diff / 60000));
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };
  const getPetOffset = (index, total) => {
    if (!total) return 0;
    let offset = index - petIndex;
    const half = Math.floor(total / 2);
    if (offset > half) offset -= total;
    if (offset < -half) offset += total;
    return offset;
  };
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [n, g, c, p, premium, petsLatest, settings] = await Promise.all([
          fetch(`${apiBase}/api/news`).then((r) => r.json()),
          fetch(`${apiBase}/api/notifications`).then((r) => r.json()),
          fetch(`${apiBase}/api/categories`).then((r) => r.json()),
          fetch(`${apiBase}/api/posts?status=approved&limit=15`).then((r) => r.json()),
          fetch(`${apiBase}/api/posts?status=approved&paid=true&limit=6`).then((r) => r.json()),
          fetch(`${apiBase}/api/posts?status=approved&category=Pets&limit=10`).then((r) => r.json()),
          getWebSettings(apiBase)
        ]);
        if (!mounted) return;
        setNews(Array.isArray(n) ? n : []);
        setNotifications(Array.isArray(g) ? g : []);
        setCategories(Array.isArray(c) ? c : []);
        setPosts(p?.items || []);
        setPremiumPosts(premium?.items || []);
        setLatestPetPosts(petsLatest?.items || []);
        const nextHeroImage = settings?.heroImage || "";
        const nextHeroVideo = settings?.heroVideo || "";
        const nextHeroMediaMode = settings?.heroMediaMode || "image";
        const nextPopupVideo = settings?.popupVideo || "";
        const nextPopupLink = settings?.popupLink || "";
        const nextPopupEnabled = !!settings?.popupEnabled;
        const nextHeroBgVersion = Number(settings?.heroBgVersion || 0);
        const nextHeroBgRaw = settings?.heroBg || "";
        const nextHeroBg = withCacheVersion(nextHeroBgRaw, nextHeroBgVersion);
        const nextHeroBgListRaw = [
          settings?.heroBg1 || "",
          settings?.heroBg2 || "",
          settings?.heroBg3 || "",
          settings?.heroBg4 || ""
        ]
          .filter(Boolean)
          .map((url) => withCacheVersion(String(url).trim(), nextHeroBgVersion));
        const nextHeroBgList = Array.from(new Set(nextHeroBgListRaw));
        setHeroHeading(settings?.heroHeading || "");
        setHeroSubheading(settings?.heroSubheading || "");
        if (nextHeroImage && nextHeroImage !== heroImage) {
          setHeroImage(nextHeroImage);
          try {
            localStorage.setItem("heroImageCache", nextHeroImage);
          } catch {}
        }
        if (nextHeroVideo !== heroVideo) {
          setHeroVideo(nextHeroVideo);
          try {
            localStorage.setItem("heroVideoCache", nextHeroVideo || "");
          } catch {}
        }
        if (nextHeroMediaMode !== heroMediaMode) {
          setHeroMediaMode(nextHeroMediaMode);
          try {
            localStorage.setItem("heroMediaModeCache", nextHeroMediaMode);
          } catch {}
        }
        setPopupVideo(nextPopupVideo);
        setPopupLink(nextPopupLink);
        setPopupEnabled(nextPopupEnabled);
        if (nextPopupEnabled && nextPopupVideo && !popupShownRef.current) {
          setShowPopup(true);
          popupShownRef.current = true;
        }
        setHeroBgVersion(nextHeroBgVersion);
        try {
          localStorage.setItem("heroBgVersionCache", String(nextHeroBgVersion || 0));
        } catch {}

        if (nextHeroBg !== heroBg) {
          setHeroBg(nextHeroBg);
          try {
            localStorage.setItem("heroBgCache", nextHeroBg || "");
          } catch {}
        }
        setHeroBgList((prev) => {
          const same = JSON.stringify(prev) === JSON.stringify(nextHeroBgList);
          if (same) return prev;
          setHeroSlide({
            current: 0,
            previous: null,
            animating: false,
            direction: "ltr"
          });
          try {
            localStorage.setItem("heroBgListCache", JSON.stringify(nextHeroBgList));
          } catch {}
          return nextHeroBgList;
        });
        setBanners({
          banner1: settings?.banner1 || "",
          banner2: settings?.banner2 || "",
          banner3: settings?.banner3 || "",
          banner4: settings?.banner4 || ""
        });
        setSideAds({
          sideAd1: settings?.sideAd1 || "",
          sideAd2: settings?.sideAd2 || "",
          sideAd3: settings?.sideAd3 || ""
        });
        setHomeWideAd(settings?.homeWideAd || "");
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
    heroCurrentRef.current = heroSlide.current;
  }, [heroSlide.current]);

  useEffect(() => {
    // Warm browser cache for all hero background slides on first load/update.
    const urls = (heroBgList.length ? heroBgList : [heroBg]).filter(Boolean);
    const preloaders = urls.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = src;
      return img;
    });
    return () => {
      preloaders.forEach((img) => {
        img.src = "";
      });
    };
  }, [heroBgList, heroBg]);

  useEffect(() => {
    const urls = [heroImage, banners.banner1, banners.banner2, banners.banner3, banners.banner4].filter(Boolean);
    const preloaders = urls.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = src;
      return img;
    });
    return () => {
      preloaders.forEach((img) => {
        img.src = "";
      });
    };
  }, [heroImage, banners]);

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
    if (notifications.length <= 1) return;
    const timer = setInterval(() => {
      setHeroNoticeIndex((prev) => (prev + 1) % notifications.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [notifications.length]);

  useEffect(() => {
    if (petPosts.length <= 1) return;
    const timer = setInterval(() => {
      setPetIndex((prev) => (prev + 1) % petPosts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [petPosts.length]);

  useEffect(() => {
    if (!petPosts.length) {
      setPetIndex(0);
      return;
    }
    setPetIndex((prev) => (prev >= petPosts.length ? 0 : prev));
  }, [petPosts.length]);

  useEffect(() => {
    const updateCardWidth = () => {
      if (window.innerWidth <= 768) {
        setPetCardWidth(Math.round(window.innerWidth * 0.78));
      } else if (window.innerWidth <= 1024) {
        setPetCardWidth(260);
      } else {
        setPetCardWidth(300);
      }
    };
    updateCardWidth();
    window.addEventListener("resize", updateCardWidth);
    return () => window.removeEventListener("resize", updateCardWidth);
  }, []);

  useEffect(() => {
    const handleHeroZoom = () => {
      const hero = document.querySelector(".hero-section");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = Math.min(Math.max((viewport - rect.top) / viewport, 0), 1);
      const scale = 1 + progress * 0.4;
      hero.style.setProperty("--hero-zoom", scale.toFixed(3));
    };
    handleHeroZoom();
    window.addEventListener("scroll", handleHeroZoom, { passive: true });
    window.addEventListener("resize", handleHeroZoom);
    return () => {
      window.removeEventListener("scroll", handleHeroZoom);
      window.removeEventListener("resize", handleHeroZoom);
    };
  }, []);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const items = el.querySelectorAll("[data-speed], .parallax-media");
    let ticking = false;
    let active = false;

    const applyStatic = () => {
      items.forEach((node) => {
        node.style.transform = "translateY(0px)";
      });
    };

    const onScroll = () => {
      if (!active) return;
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

    const updateMode = () => {
      const allow = window.innerWidth > 800;
      active = allow;
      if (!allow) {
        applyStatic();
      } else {
        onScroll();
      }
    };

    updateMode();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMode);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMode);
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
  const heroNewsItems = useMemo(() => {
    if (!Array.isArray(news) || !news.length) return [];
    const sorted = [...news].sort((a, b) => {
      const da = new Date(a?.date || a?.createdAt || 0).getTime();
      const db = new Date(b?.date || b?.createdAt || 0).getTime();
      return db - da;
    });
    return sorted.slice(0, 10);
  }, [news]);
  const latestNews = heroNewsItems[heroNewsIndex] || null;
  const sideAdList = useMemo(
    () => [sideAds.sideAd1, sideAds.sideAd2, sideAds.sideAd3].filter(Boolean),
    [sideAds]
  );

  useEffect(() => {
    if (!heroNewsItems.length) return;
    if (heroNewsIndex < heroNewsItems.length) return;
    setHeroNewsIndex(0);
  }, [heroNewsItems.length, heroNewsIndex]);

  useEffect(() => {
    if (heroNewsItems.length <= 1) return;
    const timer = setInterval(() => {
      setHeroNewsIndex((prev) => (prev + 1) % heroNewsItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroNewsItems.length]);
  const heroSlides = heroBgList.length ? heroBgList : [heroBg].filter(Boolean);
  const currentHeroBg = heroSlides[heroSlide.current] || "";
  useEffect(() => {
    if (!heroSlides.length) return;
    if (heroSlide.current < heroSlides.length) return;
    setHeroSlide((prev) => ({
      ...prev,
      current: 0,
      previous: null,
      animating: false
    }));
  }, [heroSlides.length, heroSlide.current]);

  const startHeroSlide = (targetIndex, direction = "ltr") => {
    if (!heroSlides.length) return;
    const clamped = ((targetIndex % heroSlides.length) + heroSlides.length) % heroSlides.length;
    const currentIndex = heroCurrentRef.current;
    if (clamped === currentIndex) return;
    setHeroSlide((prev) => ({
      ...prev,
      current: clamped,
      previous: null,
      animating: false,
      direction
    }));
  };

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroSlide((prev) => ({
        ...prev,
        current: (prev.current + 1) % heroSlides.length,
        previous: null,
        animating: false,
        direction: "ltr"
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <main className="page home-page">
      {showPopup && popupEnabled && popupVideo && (
        <div className="popup-modal" onClick={() => setShowPopup(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="popup-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopup(false);
              }}
              type="button"
            >
              ✕
            </button>
            <video className="popup-video" src={popupVideo} autoPlay loop muted playsInline controls />
            {popupLink && (
              <div className="popup-actions">
                <a className="popup-readmore" href={popupLink} target="_blank" rel="noreferrer">
                  Read More
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      <section
        className="hero-section"
        style={{
          "--hero-bg": "none"
        }}
      >
        <div className="hero-bg-stack" aria-hidden="true">
          <div
            className="hero-bg-layer single"
            style={{ backgroundImage: currentHeroBg ? `url(${currentHeroBg})` : "none" }}
          />
        </div>
        {heroSlides.length > 1 && (
          <div className="hero-bg-nav" aria-label="Hero background controls">
            <button
              type="button"
              className="hero-bg-arrow left"
              onClick={() => {
                if (heroSlide.animating) return;
                startHeroSlide(heroSlide.current - 1, "rtl");
              }}
              disabled={heroSlide.animating}
              aria-label="Previous background"
            >
              &lt;
            </button>
            <button
              type="button"
              className="hero-bg-arrow right"
              onClick={() => {
                if (heroSlide.animating) return;
                startHeroSlide(heroSlide.current + 1, "ltr");
              }}
              disabled={heroSlide.animating}
              aria-label="Next background"
            >
              &gt;
            </button>
          </div>
        )}
        <div className="container hero-layout">
          <div className="hero-content">
            <div className="hero-tag section-label">Trusted Community Marketplace</div>
            <h1 className="hero-title hero-fall">
              {(heroHeading || "")
                .split(" ")
                .map((word, idx) => (
                <span className="hero-word" key={`${word}-${idx}`}>
                  {word}{" "}
                </span>
              ))}
            </h1>
            <p className="hero-subtitle">
              {heroSubheading ||
                "PuneClassifieds is a premium civic portal where citizens explore government updates, post community services, and access curated listings with confidence."}
            </p>
            <div className="hero-actions">
              <NavLink to="/post-service" className="primary-btn">Post a Service</NavLink>
            </div>
          </div>
          <div className="hero-visual">
            {heroMediaMode === "video" && heroVideo ? (
              <video
                className="hero-video"
                src={heroVideo}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              heroImage && (
                <img
                  className="hero-image"
                  src={heroImage}
                  alt="Community"
                  loading="lazy"
                />
              )
            )}
            {notifications.length > 0 && (
              <div className="hero-breaking">
              <div className="hero-breaking-badge">
                <span className="breaking-text">
                  {notifications[heroNoticeIndex]?.category ||
                    notifications[heroNoticeIndex]?.department ||
                    "BREAKING NEWS"}
                </span>
              </div>
              <div className="hero-breaking-window">
                <div
                  className="hero-breaking-track"
                  style={{ transform: `translateX(-${heroNoticeIndex * 100}%)` }}
                >
                  {notifications.map((item) => (
                    <NavLink
                      key={item._id}
                      to={`/notifications/${item._id}`}
                      className="hero-breaking-item"
                    >
                      <div className="hero-breaking-headline">
                        {truncateWords(item.title || "", 12)}
                      </div>
                        <div className="hero-breaking-ticker">
                          <span className="hero-breaking-desc">
                            {truncateWords(item.summary || item.description || "", 10)}
                          </span>
                        </div>
                    </NavLink>
                  ))}
                </div>
              </div>
              </div>
            )}
            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      {homeWideAd && (
        <section className="section home-wide-ad-section">
          <div className="container">
            <div className="home-wide-ad-card">
              <img src={homeWideAd} alt="Home banner ad" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      {(latestNews || sideAdList.length > 0) && (
        <section className="section hero-news-ad-section">
          <div className="container hero-news-ad-layout">
            {latestNews && (
              <div className="hero-news-feature-wrap">
                <NavLink to={`/news/${latestNews._id}`} className="hero-news-feature">
                  <div className="hero-news-copy">
                    <div className="section-label">Latest News</div>
                    <h2>{latestNews.title || "Community Update"}</h2>
                    <p>{truncateWords(latestNews.description || latestNews.summary || "", 34)}</p>
                  </div>
                  {(latestNews.imageData || latestNews.image) && (
                    <img
                      src={latestNews.imageData || latestNews.image}
                      alt={latestNews.title || "Latest news"}
                      loading="lazy"
                    />
                  )}
                </NavLink>
                {heroNewsItems.length > 1 && (
                  <div className="hero-news-nav">
                    <button
                      type="button"
                      className="hero-news-arrow"
                      onClick={() =>
                        setHeroNewsIndex((prev) => (prev - 1 + heroNewsItems.length) % heroNewsItems.length)
                      }
                      aria-label="Previous news"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      className="hero-news-arrow"
                      onClick={() => setHeroNewsIndex((prev) => (prev + 1) % heroNewsItems.length)}
                      aria-label="Next news"
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </div>
            )}

            {sideAdList.length > 0 && (
              <aside className="hero-side-ads" aria-label="Home side ads">
                {sideAdList.map((ad, idx) => (
                  <div key={`${ad}-${idx}`} className="hero-side-ad-card">
                    <img src={ad} alt={`Banner ad ${idx + 1}`} loading="lazy" />
                  </div>
                ))}
              </aside>
            )}
          </div>
        </section>
      )}

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
                <p className="clamp-2">{cleanText(premiumPosts[premiumIndex].description)}</p>
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
            <p>Search all posts of any category.</p>
          </div>
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search listings, services, or Jobs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="primary-btn">Search</button>
            </div>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((item, idx) => (
                  <div
                    key={item._id || item.title}
                    className="card media-card post-card"
                    data-no={`NO. ${String(idx + 1).padStart(2, "0")}`}
                    onClick={() => item?._id && navigate(`/posts/${item._id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && item?._id) navigate(`/posts/${item._id}`);
                    }}
                  >
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
            {posts.slice(0, 15).map((item, idx) => (
              <article
                key={item._id}
                className="card media-card featured-card post-card"
                data-no={`NO. ${String(idx + 1).padStart(2, "0")}`}
                onClick={() => navigate(`/posts/${item._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/posts/${item._id}`);
                }}
              >
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
            {news.slice(0, 3).map((item, idx) => (
              <NavLink
                key={item._id}
                to={`/news/${item._id}`}
                className="card media-card post-card news-card"
                data-no={`NO. ${String(idx + 1).padStart(2, "0")}`}
              >
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

      {petPosts.length > 0 && (
        <section className="section pets-spotlight-section">
          <div className="container">
            <div className="section-head pets-spotlight-head">
              <div>
                <div className="section-label">PETS</div>
                <h2>Latest Pet Adoption Listings</h2>
                <p>Freshly posted pets ready for loving homes.</p>
              </div>
              <div className="pets-spotlight-nav">
                <button
                  type="button"
                  onClick={() => setPetIndex((prev) => (prev - 1 + petPosts.length) % petPosts.length)}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setPetIndex((prev) => (prev + 1) % petPosts.length)}
                >
                  →
                </button>
              </div>
            </div>

            <div
              className="pets-spotlight-carousel"
              style={{ "--pet-card-width": `${petCardWidth}px` }}
            >
              <div className="pets-spotlight-track">
                {petPosts.map((item, idx) => {
                  const offset = getPetOffset(idx, petPosts.length);
                  const shift = 0.75;
                  const translateX = offset * shift * petCardWidth;
                  const absOffset = Math.abs(offset);
                  const scale = 1 - Math.min(absOffset * 0.08, 0.32);
                  const opacity = absOffset > 2 ? 0 : 1 - Math.min(absOffset * 0.18, 0.7);
                  const zIndex = 10 - absOffset;
                  const pointerEvents = absOffset > 2 ? "none" : "auto";
                  return (
                  <NavLink
                    key={item._id}
                    to={`/posts/${item._id}`}
                    className="pets-spotlight-card"
                    style={{
                      transform: `translateX(-50%) translateX(${translateX}px) scale(${scale})`,
                      opacity,
                      zIndex,
                      pointerEvents
                    }}
                  >
                    <div className="pets-spotlight-image">
                      <img
                        src={
                          (item.imageUrls && item.imageUrls[0]) ||
                          item.imageUrl ||
                          item.imageData ||
                          fallbackHero
                        }
                        alt={item.title}
                        loading="lazy"
                      />
                      <span className="pets-spotlight-posted">Posted: {formatTimeAgo(item.createdAt)}</span>
                    </div>
                    <div className="pets-spotlight-body">
                      <h4>{item.title}</h4>
                      <div className="pets-spotlight-tags">
                        {item.type && <span>{item.type}</span>}
                        {item.gender && <span>{item.gender}</span>}
                        {item.age && <span>{item.age}</span>}
                      </div>
                      {item.location && (
                        <p className="pets-spotlight-meta">Location: {item.location}</p>
                      )}
                      <div className="pets-spotlight-owner">
                        <span>{item.contactName || "Community Desk"}</span>
                      </div>
                    </div>
                  </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="pets-spotlight-dots">
              {petPosts.slice(0, 6).map((_, idx) => (
                <span key={`pet-dot-${idx}`} className={idx === petIndex ? "active" : ""} />
              ))}
            </div>
          </div>
        </section>
      )}

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









