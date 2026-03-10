import React, { useEffect, useState } from "react";

const PostService = ({ apiBase }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    contactName: "",
    phone: "",
    imageData: ""
  });
  const [status, setStatus] = useState("");
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  const handleImage = (file) => {
    setImageReady(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, imageData: reader.result }));
      setImageReady(true);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.imageData) {
      setStatus("Please wait for the image to finish loading.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/api/posts`, {
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
      setForm({ title: "", category: "", description: "", contactName: "", phone: "", imageData: "" });
      setImageReady(false);
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <main className="page center-page">
      <section className="section-head-block">
        <h1>Post a Service</h1>
        <p>Submit your listing for admin review.</p>
      </section>
      <section className="form-section">
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <textarea
            rows="4"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Contact Name"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImage(e.target.files[0])}
            required
          />
          {form.imageData && (
            <img className="preview-image" src={form.imageData} alt="Preview" />
          )}
          <button className="primary-btn" type="submit">Submit Listing</button>
          {status && <p className="success">{status}</p>}
        </form>
      </section>
    </main>
  );
};

export default PostService;
