import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const useQuery = () => new URLSearchParams(useLocation().search);

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
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  useEffect(() => {
    fetch(`${apiBase}/api/settings/web`)
      .then((r) => r.json())
      .then((settings) => setBanner(settings?.banner3 || ""))
      .catch(console.error);
  }, [apiBase]);

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
  }, [page, search, category, type, label, location]);

  useEffect(() => {
    const newCategory = query.get("category") || "";
    const newType = query.get("type") || "";
    setCategory(newCategory);
    setType(newType);
    setLabel("");
    setPage(1);
  }, [query.toString()]);

  const typeOptions = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return [];
    if (category) {
      const match = categories.find(
        (cat) => cat.name && cat.name.toLowerCase() === category.toLowerCase()
      );
      return match && Array.isArray(match.types) ? match.types : [];
    }
    const allTypes = categories.flatMap((cat) => (Array.isArray(cat.types) ? cat.types : []));
    return Array.from(new Set(allTypes));
  }, [categories, category]);

  const labelOptions = useMemo(() => {
    if (!category || !type) return [];
    const match = categories.find(
      (cat) => cat.name && cat.name.toLowerCase() === category.toLowerCase()
    );
    if (!match || !match.labelsByType) return [];
    const labels = match.labelsByType[type] || [];
    return Array.isArray(labels) ? labels : [];
  }, [categories, category, type]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: Math.min(pages, 4) }, (_, i) => i + 1);
  }, [pages]);

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

      <section className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); }}
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setType(""); setLabel(""); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
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
          <select
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <button
            className="primary-btn"
            onClick={async () => {
              await logSearch();
              setSearch(searchInput);
              setPage(1);
            }}
          >
            Search
          </button>
        </div>
      </section>

      <section className="grid">
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


