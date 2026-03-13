import React, { useEffect, useState } from "react";

const PostService = ({ apiBase }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    type: "",
    breed: "",
    age: "",
    gender: "",
    size: "",
    vaccinationStatus: "",
    medicalHistory: "",
    temperament: "",
    location: "",
    adoptionConditions: "",
    contactDetails: "",
    description: "",
    contactName: "",
    phone: "",
    imagePreview: ""
  });
  const [status, setStatus] = useState("");
  const [imageNotice, setImageNotice] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(() => {
    if (!token) return null;
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return null;
    }
  });
  const isPaid = !!(user?.paid && user?.paidUntil && new Date(user.paidUntil) > new Date());
  const maxImages = isPaid ? 5 : 3;
  const maxWords = isPaid ? 350 : 150;

  useEffect(() => {
    if (imageFiles.length > maxImages) {
      const trimmed = imageFiles.slice(0, maxImages);
      setImageFiles(trimmed);
      setImagePreviews(trimmed.map((file) => URL.createObjectURL(file)));
      setImageNotice(`You can upload up to ${maxImages} images.`);
    }
  }, [maxImages]);

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  const handleImages = (e) => {
    const incoming = Array.from(e?.target?.files || []);
    if (!incoming.length) return;
    setImageFiles((prev) => {
      const combined = [...prev, ...incoming];
      if (combined.length > maxImages) {
        setImageNotice(`You can upload up to ${maxImages} images.`);
      } else {
        setImageNotice("");
      }
      const trimmed = combined.slice(0, maxImages);
      setImagePreviews(trimmed.map((file) => URL.createObjectURL(file)));
      return trimmed;
    });
    if (e?.target) {
      e.target.value = "";
    }
  };

  const removeImage = (idx) => {
    const nextFiles = imageFiles.filter((_, i) => i !== idx);
    setImageFiles(nextFiles);
    setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setImageNotice("");
    try {
      if (form.description.trim().split(/\s+/).filter(Boolean).length > maxWords) {
        setStatus(`Description exceeds ${maxWords} words.`);
        return;
      }
      if (imageFiles.length > maxImages) {
        setStatus(`You can upload up to ${maxImages} images.`);
        return;
      }
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("type", form.type || "");
      formData.append("breed", form.breed || "");
      formData.append("age", form.age || "");
      formData.append("gender", form.gender || "");
      formData.append("size", form.size || "");
      formData.append("vaccinationStatus", form.vaccinationStatus || "");
      formData.append("medicalHistory", form.medicalHistory || "");
      formData.append("temperament", form.temperament || "");
      formData.append("location", form.location || "");
      formData.append("adoptionConditions", form.adoptionConditions || "");
      formData.append("contactDetails", form.contactDetails || "");
      formData.append("description", form.description);
      formData.append("contactName", form.contactName);
      formData.append("phone", form.phone);
      imageFiles.forEach((file) => formData.append("images", file));
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
      setForm({
        title: "",
        category: "",
        type: "",
        breed: "",
        age: "",
        gender: "",
        size: "",
        vaccinationStatus: "",
        medicalHistory: "",
        temperament: "",
        location: "",
        adoptionConditions: "",
        contactDetails: "",
        description: "",
        contactName: "",
        phone: "",
        imagePreview: ""
      });
      setImageFiles([]);
      setImagePreviews([]);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.name && form.category && cat.name.toLowerCase() === form.category.toLowerCase()
  );
  const categoryTypes = selectedCategory && Array.isArray(selectedCategory.types)
    ? selectedCategory.types
    : [];
  const showPetFields = form.category.toLowerCase() === "pets";

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
            onChange={(e) => setForm({ ...form, category: e.target.value, type: "" })}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          {categoryTypes.length > 0 && (
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              {categoryTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
          {showPetFields && (
            <>
              <input
                type="text"
                placeholder="Breed"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
              />
              <input
                type="text"
                placeholder="Age"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
              <input
                type="text"
                placeholder="Gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              />
              <input
                type="text"
                placeholder="Size"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
              <input
                type="text"
                placeholder="Vaccination Status"
                value={form.vaccinationStatus}
                onChange={(e) => setForm({ ...form, vaccinationStatus: e.target.value })}
              />
              <input
                type="text"
                placeholder="Medical History"
                value={form.medicalHistory}
                onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
              />
              <input
                type="text"
                placeholder="Temperament"
                value={form.temperament}
                onChange={(e) => setForm({ ...form, temperament: e.target.value })}
              />
            </>
          )}
          <textarea
            rows="4"
            placeholder={`Description (max ${maxWords} words)`}
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
          {showPetFields && (
            <>
              <input
                type="text"
                placeholder="Adoption Conditions"
                value={form.adoptionConditions}
                onChange={(e) => setForm({ ...form, adoptionConditions: e.target.value })}
              />
              <input
                type="text"
                placeholder="Contact Details"
                value={form.contactDetails}
                onChange={(e) => setForm({ ...form, contactDetails: e.target.value })}
              />
            </>
          )}
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
          <label className="field-label">Upload Images (max {maxImages})</label>
          <input
            type="file"
            accept="image/*"
            name="images"
            multiple
            onChange={handleImages}
          />
          <small className="muted">Selected: {imagePreviews.length}/{maxImages}</small>
          {imageNotice && <small className="error">{imageNotice}</small>}
          <small className="muted">Tip: Use Ctrl/Shift to select multiple images.</small>
          {imagePreviews.length > 0 && (
            <div className="image-preview-grid">
              {imagePreviews.map((src, idx) => (
                <div key={`${src}-${idx}`} className="image-preview-item">
                  <img className="preview-image" src={src} alt={`Preview ${idx + 1}`} />
                  <button type="button" className="ghost-btn" onClick={() => removeImage(idx)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="primary-btn" type="submit">Submit Listing</button>
          {status && <p className="success">{status}</p>}
        </form>
      </section>
    </main>
  );
};

export default PostService;
