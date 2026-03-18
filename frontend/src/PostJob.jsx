import React, { useEffect, useState } from "react";

const PostJob = ({ apiBase }) => {
  const [form, setForm] = useState({
    jobTitle: "",
    description: "",
    location: "",
    label: "",
    phone: "",
    whatsapp: ""
  });
  const [locations, setLocations] = useState([]);
  const [labels, setLabels] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/locations`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setLocations(data))
      .catch(console.error);
  }, [apiBase]);

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then((data) => {
        const match = (Array.isArray(data) ? data : []).find(
          (cat) => cat.name && cat.name.toLowerCase() === "jobs"
        );
        if (match && match.labelsByType) {
          const all = Object.values(match.labelsByType).flat();
          setLabels(Array.from(new Set(all)));
        } else {
          setLabels([]);
        }
      })
      .catch(console.error);
  }, [apiBase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setStatus("Submitted. Awaiting admin approval.");
      setForm({ jobTitle: "", description: "", location: "", label: "", phone: "", whatsapp: "" });
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Post a Job / Service</h1>
        <p>Listings are reviewed by admins before going live.</p>
      </section>
      <section className="form-section">
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Job Title"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            required
          />
          <textarea
            rows="4"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <select
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          >
            <option value="">Select Location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {labels.length > 0 && (
            <select
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            >
              <option value="">Select Label</option>
              {labels.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            required
          />
          <button className="primary-btn" type="submit">Submit Listing</button>
          {status && <p className="success">{status}</p>}
        </form>
      </section>
    </main>
  );
};

export default PostJob;


