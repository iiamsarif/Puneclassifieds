import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getWebSettings } from "./webSettingsCache";

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const useQuery = () => new URLSearchParams(useLocation().search);

const pickCategoryAds = (settings, categoryName) => {
  const key = String(categoryName || "").toLowerCase();
  const mapping = {
    jobs: {
      wide: "jobsWideAd",
      side1: "jobsSideAd1",
      side2: "jobsSideAd2",
      side3: "jobsSideAd3"
    },
    property: {
      wide: "propertyWideAd",
      side1: "propertySideAd1",
      side2: "propertySideAd2",
      side3: "propertySideAd3"
    },
    pets: {
      wide: "petsWideAd",
      side1: "petsSideAd1",
      side2: "petsSideAd2",
      side3: "petsSideAd3"
    },
    services: {
      wide: "servicesWideAd",
      side1: "servicesSideAd1",
      side2: "servicesSideAd2",
      side3: "servicesSideAd3"
    }
  };
  const m = mapping[key];
  if (!m) {
    return {
      wide: "",
      sideAd1: "",
      sideAd2: "",
      sideAd3: ""
    };
  }
  return {
    wide: settings?.[m.wide] || "",
    sideAd1: settings?.[m.side1] || "",
    sideAd2: settings?.[m.side2] || "",
    sideAd3: settings?.[m.side3] || ""
  };
};

const Posts = ({ apiBase }) => {
  const query = useQuery();
  const initialCategory = query.get("category") || "";
  const initialType = query.get("type") || "";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState(initialType);
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [banner, setBanner] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [homeWideAd, setHomeWideAd] = useState("");
  const [sideAds, setSideAds] = useState({ sideAd1: "", sideAd2: "", sideAd3: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  useEffect(() => {
    getWebSettings(apiBase)
      .then((settings) => {
        setBanner(settings?.banner3 || "");
        const ads = pickCategoryAds(settings, category);
        setHomeWideAd(ads.wide);
        setSideAds({
          sideAd1: ads.sideAd1,
          sideAd2: ads.sideAd2,
          sideAd3: ads.sideAd3
        });
      })
      .catch(console.error);
  }, [apiBase, category]);

  useEffect(() => {
    fetch(`${apiBase}/api/locations`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setLocations(data))
      .catch(console.error);
  }, [apiBase]);

  const loadPosts = async (pageNum) => {
    const params = new URLSearchParams();
    params.set("status", "approved");
    params.set("page", pageNum.toString());
    params.set("limit", "6");
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (label) params.set("label", label);
    if (location) params.set("location", location);
    if (pinCode) params.set("pinCode", pinCode);
    const res = await fetch(`${apiBase}/api/posts?${params.toString()}`);
    const data = await res.json();
    setPosts(data.items || []);
    setPages(data.pages || 1);
  };

  const logSearch = async () => {
    try {
      await fetch(`${apiBase}/api/search-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category || "All", query: searchInput })
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPosts(page);
  }, [page, search, category, type, label, location, pinCode]);

  useEffect(() => {
    const newCategory = query.get("category") || "";
    const newType = query.get("type") || "";
    setCategory(newCategory);
    setType(newType);
    setLabel("");
    setPage(1);
  }, [query.toString()]);

  const locationOptions = useMemo(() => {
    return Array.isArray(locations) ? locations : [];
  }, [locations]);

  const handleLocationInput = (value) => {
    setLocation(value);
    const match = locationOptions.find(
      (loc) => loc.name && loc.name.toLowerCase() === value.toLowerCase()
    );
    setPinCode(match?.pinCode || "");
  };

  const activeCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter((cat) => {
      if (!cat) return false;
      if (cat.isActive === false) return false;
      if (cat.active === false) return false;
      const status = String(cat.status || "").toLowerCase();
      if (status === "inactive" || status === "disabled") return false;
      return true;
    });
  }, [categories]);

  useEffect(() => {
    if (category) return;
    if (!activeCategories.length) return;
    setCategory(activeCategories[0].name);
  }, [activeCategories, category]);

  const selectedCategoryObj = useMemo(() => {
    if (!activeCategories.length) return null;
    const match = activeCategories.find(
      (cat) => cat.name && cat.name.toLowerCase() === String(category || "").toLowerCase()
    );
    return match || activeCategories[0];
  }, [activeCategories, category]);

  const categorySelectOptions = useMemo(
    () => (selectedCategoryObj ? [selectedCategoryObj] : []),
    [selectedCategoryObj]
  );

  const typeOptions = useMemo(() => {
    if (!Array.isArray(activeCategories) || activeCategories.length === 0) return [];
    if (category) {
      const match = activeCategories.find(
        (cat) => cat.name && cat.name.toLowerCase() === category.toLowerCase()
      );
      return match && Array.isArray(match.types) ? match.types : [];
    }
    const allTypes = activeCategories.flatMap((cat) => (Array.isArray(cat.types) ? cat.types : []));
    return Array.from(new Set(allTypes));
  }, [activeCategories, category]);

  const labelOptions = useMemo(() => {
    if (!category || !type) return [];
    const match = activeCategories.find(
      (cat) => cat.name && cat.name.toLowerCase() === category.toLowerCase()
    );
    if (!match || !match.labelsByType) return [];
    const labels = match.labelsByType[type] || [];
    return Array.isArray(labels) ? labels : [];
  }, [activeCategories, category, type]);

  const activeCategory = category || "";
  const activeType = type || "";
  const activeLabel = label || "";
  const categoryChips = selectedCategoryObj?.name ? [selectedCategoryObj.name] : [];
  const typeChips = useMemo(() => {
    return ["All Types", ...typeOptions];
  }, [typeOptions]);
  const labelChips = useMemo(() => ["All Labels", ...labelOptions], [labelOptions]);

  useEffect(() => {
    if (type && !typeOptions.includes(type)) {
      setType("");
    }
  }, [typeOptions, type]);

  useEffect(() => {
    if (label && !labelOptions.includes(label)) {
      setLabel("");
    }
  }, [labelOptions, label]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: Math.min(pages, 4) }, (_, i) => i + 1);
  }, [pages]);

  const sideAdList = useMemo(
    () => [sideAds.sideAd1, sideAds.sideAd2, sideAds.sideAd3].filter(Boolean),
    [sideAds]
  );

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Community Posts</h1>
        <p>Explore verified listings across all service categories.</p>
      </section>

      {banner && (
        <section className="section banner-section">
          <div className="container">
            <div className="mid-banner">
              <img className="banner-image" src={banner} alt="Community posts banner" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      {homeWideAd && (
        <section className="section home-wide-ad-section">
          <div className="container">
            <div className="home-wide-ad-card">
              <img src={homeWideAd} alt="Community posts wide ad" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      <section className="search-section">
        <div className="filter-panel">
          <div className="filter-column">
            <div className="filter-title">Categories</div>
            <div className="filter-list">
              {categoryChips.map((cat) => (
                <button
                  key={cat}
                  className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => { setCategory(cat); setType(""); setLabel(""); setPage(1); }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-column">
            <div className="filter-title">Types</div>
            <div className="filter-list">
              {typeChips.map((t) => (
                <button
                  key={t}
                  className={`filter-chip ${t === "All Types" ? (!activeType ? "active" : "") : (activeType === t ? "active" : "")}`}
                  onClick={() => { setType(t === "All Types" ? "" : t); setLabel(""); setPage(1); }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-column">
            <div className="filter-title">Labels</div>
            <div className="filter-list">
              {labelChips.map((lbl) => (
                <button
                  key={lbl}
                  className={`filter-chip ${lbl === "All Labels" ? (!activeLabel ? "active" : "") : (activeLabel === lbl ? "active" : "")}`}
                  onClick={() => { setLabel(lbl === "All Labels" ? "" : lbl); setPage(1); }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value || "";
              setSearchInput(value);
              setSearch(value.trim());
              setPage(1);
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                await logSearch();
                setSearch((searchInput || "").trim());
                setPage(1);
              }
            }}
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setType(""); setLabel(""); setPage(1); }}
          >
            {categorySelectOptions.map((cat) => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setLabel(""); setPage(1); }}
            disabled={typeOptions.length === 0}
          >
            <option value="">All Types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={label}
            onChange={(e) => { setLabel(e.target.value); setPage(1); }}
            disabled={labelOptions.length === 0}
          >
            <option value="">All Labels</option>
            {labelOptions.map((lbl) => (
              <option key={lbl} value={lbl}>{lbl}</option>
            ))}
          </select>
          <div className="location-field">
            <input
              type="text"
              list="location-options"
              placeholder="All Locations"
              value={location}
              onChange={(e) => { handleLocationInput(e.target.value); setPage(1); }}
            />
            <datalist id="location-options">
              {locationOptions.map((loc) => (
                <option key={loc._id || loc.name} value={loc.name} />
              ))}
            </datalist>
          </div>
          <input
            type="text"
            placeholder="Pincode"
            value={pinCode}
            readOnly
          />
          <button
            className="primary-btn"
            onClick={async () => {
              await logSearch();
              setSearch((searchInput || "").trim());
              setPage(1);
            }}
          >
            Search
          </button>
        </div>
      </section>

      <section className={`container ${sideAdList.length > 0 ? "hero-news-ad-layout" : ""}`}>
        <div className="grid">
          {posts.map((post, idx) => (
            <article
              key={post._id}
              className="card media-card post-card"
              data-no={`NO. ${String(idx + 1 + (page - 1) * 6).padStart(2, "0")}`}
              onClick={() => navigate(`/posts/${post._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/posts/${post._id}`);
              }}
            >
              <img src={(post.imageUrls && post.imageUrls[0]) || post.imageUrl || post.imageData || fallbackImage} alt={post.title} loading="lazy" />
              <div>
                <span className="badge">{post.category}</span>
                <h4>{post.title}</h4>
                <p className="clamp-2">{post.description}</p>
                {post.location && <p className="muted">Location: {post.location}</p>}
                <p className="muted">Posted by: {post.userEmail || "Community Member"}</p>
                <button className="ghost-btn" onClick={() => navigate(`/posts/${post._id}`)}>
                  Reach Out
                </button>
              </div>
            </article>
          ))}
        </div>
        {sideAdList.length > 0 && (
          <aside className="hero-side-ads" aria-label="Community posts side ads">
            {sideAdList.map((ad, idx) => (
              <div key={`posts-side-ad-${idx}`} className="hero-side-ad-card">
                <img src={ad} alt={`Community posts ad ${idx + 1}`} loading="lazy" />
              </div>
            ))}
          </aside>
        )}
      </section>

      <div className="pagination">
        {pageNumbers.map((num) => (
          <button
            key={num}
            className={`page-btn ${page === num ? "active" : ""}`}
            onClick={() => setPage(num)}
          >
            {num}
          </button>
        ))}
        {pages > 4 && (
          <button className="page-btn" onClick={() => setPage(page + 1)}>Next</button>
        )}
      </div>
    </main>
  );
};

export default Posts;


