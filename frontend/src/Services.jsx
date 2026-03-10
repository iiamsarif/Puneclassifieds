import React, { useEffect, useState } from "react";

const Services = ({ apiBase }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Services</h1>
        <p>Browse service categories curated by the admin team.</p>
      </section>
      <section className="grid">
        {categories.map((cat) => (
          <div key={cat._id} className="card category-card">
            <h4>{cat.name}</h4>
            <p>{cat.description || "Explore verified posts in this category."}</p>
            <a className="ghost-btn" href={`/posts?category=${encodeURIComponent(cat.name)}`}>View Posts</a>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Services;
