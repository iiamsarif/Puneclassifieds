import React, { useEffect, useState } from "react";

const PostProperty = ({ apiBase }) => {
  const [form, setForm] = useState({
    propertyTitle: "",
    saleType: "Sale",
    price: "",
    location: "",
    label: "",
    photos: "",
    contactNumber: "",
    whatsapp: ""
  });
  const [status, setStatus] = useState("");
  const [locations, setLocations] = useState([]);
  const [labels, setLabels] = useState([]);

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
          (cat) => cat.name && cat.name.toLowerCase() === "property"
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
      const res = await fetch(`${apiBase}/api/properties`, {
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
      setForm({ propertyTitle: "", saleType: "Sale", price: "", location: "", label: "", photos: "", contactNumber: "", whatsapp: "" });
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>Post Property Listing</h1>
        <p>Upload verified property details for review.</p>
      </section>
      <section className="form-section">
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Property Title"
            value={form.propertyTitle}
            onChange={(e) => setForm({ ...form, propertyTitle: e.target.value })}
            required
          />
          <select
            value={form.saleType}
            onChange={(e) => setForm({ ...form, saleType: e.target.value })}
          >
            <option>Sale</option>
            <option>Rent</option>
          </select>
          <input
            type="text"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
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
            placeholder="Photos (URL)"
            value={form.photos}
            onChange={(e) => setForm({ ...form, photos: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Contact Number"
            value={form.contactNumber}
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
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

export default PostProperty;


