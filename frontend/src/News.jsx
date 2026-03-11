import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const fallbackImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80";

const News = ({ apiBase }) => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/api/news`)
      .then((r) => r.json())
      .then(setNews)
      .catch(console.error);
  }, [apiBase]);

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>News & Updates</h1>
        <p>Curated local updates and important announcements.</p>
      </section>
      <section className="grid">
        {news.map((item) => (
          <NavLink key={item._id} to={`/news/${item._id}`} className="card media-card">
            <img src={item.imageData || item.image || fallbackImage} alt={item.title} loading="lazy" />
            <div>
              <span className="badge">{item.category}</span>
              <h4>{item.title}</h4>
              <p className="muted">{item.date}</p>
            </div>
          </NavLink>
        ))}
      </section>
    </main>
  );
};

export default News;
