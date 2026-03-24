import React, { useEffect, useState } from "react";
import { getWebSettings } from "./webSettingsCache";

const Contact = ({ apiBase }) => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getWebSettings(apiBase);
        setContactEmail(data.contactEmail || "");
      } catch (err) {
        console.error(err);
      }
    };
    if (apiBase) load();
  }, [apiBase]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent("PuneClassifieds Contact Request");
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );
    const targetEmail = contactEmail || "support@PuneClassifieds.com";
    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <main className="page center-page">
      <section className="section-head-block">
        <h1>Contact Us</h1>
        <p>Reach the community support team for any assistance.</p>
        {contactEmail && (
          <p className="muted">Email: {contactEmail}</p>
        )}
      </section>
      <section className="form-section">
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <textarea
            rows="4"
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
          <button className="primary-btn" type="submit">Send Message</button>
          {sent && <p className="success">Thanks! We will reply within 24 hours.</p>}
        </form>
      </section>
    </main>
  );
};

export default Contact;


