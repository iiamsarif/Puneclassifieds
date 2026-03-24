import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { getWebSettings } from "./webSettingsCache";

const fallbackImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80";
const PAGE_SIZE = 10;

const News = ({ apiBase }) => {
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [banner, setBanner] = useState("");
  const [homeWideAd, setHomeWideAd] = useState("");
  const [sideAds, setSideAds] = useState({ sideAd1: "", sideAd2: "", sideAd3: "" });

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/api/news`).then((r) => r.json()),
      getWebSettings(apiBase)
    ])
      .then(([newsData, settings]) => {
        setNews(Array.isArray(newsData) ? newsData : []);
        setBanner(settings?.banner2 || "");
        setHomeWideAd(settings?.newsWideAd || "");
        setSideAds({
          sideAd1: settings?.newsSideAd1 || "",
          sideAd2: settings?.newsSideAd2 || "",
          sideAd3: settings?.newsSideAd3 || ""
        });
      })
      .catch(console.error);
  }, [apiBase]);

  const filtered = useMemo(() => {
    if (!query.trim()) return news;
    const q = query.toLowerCase();
    return news.filter((item) =>
      [item.title, item.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [news, query]);

  useEffect(() => {
    setPage(1);
  }, [filtered.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1);
  }, [totalPages]);
  const sideAdList = useMemo(
    () => [sideAds.sideAd1, sideAds.sideAd2, sideAds.sideAd3].filter(Boolean),
    [sideAds]
  );

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>News & Updates</h1>
        <p>Curated local updates and important announcements.</p>
      </section>

      {banner && (
        <section className="section banner-section">
          <div className="container">
            <div className="mid-banner">
              <img className="banner-image" src={banner} alt="News banner" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      {homeWideAd && (
        <section className="section home-wide-ad-section">
          <div className="container">
            <div className="home-wide-ad-card">
              <img src={homeWideAd} alt="News wide ad" loading="lazy" />
            </div>
          </div>
        </section>
      )}

      <section className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search news by title or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <section className={`container ${sideAdList.length > 0 ? "hero-news-ad-layout" : ""}`}>
        <div className="grid">
          {pageItems.map((item, idx) => (
            <NavLink
              key={item._id}
              to={`/news/${item._id}`}
              className="card media-card post-card news-card"
              data-no={`NO. ${String(idx + 1 + (page - 1) * PAGE_SIZE).padStart(2, "0")}`}
            >
              <img src={item.imageData || item.image || fallbackImage} alt={item.title} loading="lazy" />
              <div>
                <span className="badge">{item.category}</span>
                <h4>{item.title}</h4>
                <p className="muted">{item.date}</p>
              </div>
            </NavLink>
          ))}
        </div>
        {sideAdList.length > 0 && (
          <aside className="hero-side-ads" aria-label="News side ads">
            {sideAdList.map((ad, idx) => (
              <div key={`news-side-ad-${idx}`} className="hero-side-ad-card">
                <img src={ad} alt={`News ad ${idx + 1}`} loading="lazy" />
              </div>
            ))}
          </aside>
        )}
      </section>

      {totalPages > 1 && (
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
          {totalPages > 4 && (
            <button className="page-btn" onClick={() => setPage(Math.min(page + 1, totalPages))}>
              Next
            </button>
          )}
        </div>
      )}
    </main>
  );
};

export default News;


