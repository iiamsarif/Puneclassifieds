import React, { useEffect, useState } from "react";

const Footer = ({ apiBase }) => {
  const [contactEmail, setContactEmail] = useState("support@puneclassifieds.com");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/api/settings/web`);
        const data = await res.json();
        if (data.contactEmail) setContactEmail(data.contactEmail);
      } catch (err) {
        console.error(err);
      }
    };
    if (apiBase) load();
  }, [apiBase]);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">PUneClass</div>
          <p className="footer-text">
            A premium community marketplace for verified local news, listings, and civic updates.
          </p>
        </div>
        <div className="footer-links">
          <a href="/news">News</a>
          <a href="/services">Services</a>
          <a href="/posts">Posts</a>
          <a href="/notifications">Notifications</a>
          <a href="/contact">Contact</a>
        </div>
        <div className="footer-meta">
          <p>Contact: {contactEmail}</p>
          <p>© 2026 PUneClass. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
