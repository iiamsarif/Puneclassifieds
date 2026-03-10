import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const Notifications = ({ apiBase }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/api/notifications`)
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error);
  }, [apiBase]);

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Government Notifications</h1>
        <p>Verified notices and public updates from civic authorities.</p>
      </section>
      <section className="grid">
        {items.map((item) => (
          <NavLink key={item._id} to={`/notifications/${item._id}`} className="card">
            <span className="badge">{item.category}</span>
            <h4>{item.title}</h4>
            <p className="muted">{item.notificationDate}</p>
          </NavLink>
        ))}
      </section>
    </main>
  );
};

export default Notifications;
