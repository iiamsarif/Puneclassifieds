import React, { useEffect, useState } from "react";

const PostService = ({ apiBase }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    location: "",
    description: "",
    contactName: "",
    phone: "",
    imagePreview: ""
  });
  const [status, setStatus] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  const handleImage = (file) => {
    if (!file) {
      setImageFile(null);
      setForm((prev) => ({ ...prev, imagePreview: "" }));
      return;
    }
    setImageFile(file);
    setForm((prev) => ({ ...prev, imagePreview: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("location", form.location || "");
      formData.append("description", form.description);
      formData.append("contactName", form.contactName);
      formData.append("phone", form.phone);
      if (imageFile) formData.append("image", imageFile);
      const res = await fetch(`${apiBase}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setStatus("Submitted. Awaiting admin approval.");
      setForm({ title: "", category: "", location: "", description: "", contactName: "", phone: "", imagePreview: "" });
      setImageFile(null);
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
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
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
          {form.imagePreview && (
            <img className="preview-image" src={form.imagePreview} alt="Preview" />
          )}
          <button className="primary-btn" type="submit">Submit Listing</button>
          {status && <p className="success">{status}</p>}
        </form>
      </section>
    </main>
  );
};

export default PostService;


