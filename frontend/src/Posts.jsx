import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

const useQuery = () => new URLSearchParams(useLocation().search);

const Posts = ({ apiBase }) => {
  const query = useQuery();
  const initialCategory = query.get("category") || "";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);
  const [locations] = useState([
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
  ]);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  const loadPosts = async (pageNum) => {
    const params = new URLSearchParams();
    params.set("status", "approved");
    params.set("page", pageNum.toString());
    params.set("limit", "6");
    if (search) params.set("search", search);
    if (category) params.set("category", category);
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
  }, [page, search, category, location]);

  useEffect(() => {
    const newCategory = query.get("category") || "";
    setCategory(newCategory);
    setPage(1);
  }, [query.toString()]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: Math.min(pages, 4) }, (_, i) => i + 1);
  }, [pages]);

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Community Posts</h1>
        <p>Explore verified listings across all service categories.</p>
      </section>

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
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
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
        {posts.map((post) => (
          <article key={post._id} className="card media-card">
            <img src={post.imageData || fallbackImage} alt={post.title} loading="lazy" />
            <div>
              <span className="badge">{post.category}</span>
              <h4>{post.title}</h4>
              <p>{post.description}</p>
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
