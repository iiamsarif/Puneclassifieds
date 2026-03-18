import React, { useEffect, useState } from "react";

const MyPosts = ({ apiBase }) => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [imageNotice, setImageNotice] = useState("");
  const [imageReady, setImageReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    type: "",
    label: "",
    breed: "",
    age: "",
    gender: "",
    size: "",
    vaccinationStatus: "",
    medicalHistory: "",
    temperament: "",
    adoptionConditions: "",
    contactDetails: "",
    location: "",
    description: "",
    contactName: "",
    phone: "",
    imageData: "",
    imageUrl: "",
    imageUrls: []
  });
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
    if ((form.imageUrls || []).length + imageFiles.length > maxImages) {
      const allowedNew = Math.max(0, maxImages - (form.imageUrls || []).length);
      const trimmed = imageFiles.slice(0, allowedNew);
      setImageFiles(trimmed);
      setImagePreviews(trimmed.map((file) => URL.createObjectURL(file)));
      setImageNotice(`You can upload up to ${maxImages} images.`);
    }
  }, [maxImages]);

  const load = () => {
    fetch(`${apiBase}/api/my-posts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error);
  };

  useEffect(() => {
    load();
  }, [apiBase]);

  useEffect(() => {
    if (!token || !apiBase) return;
    fetch(`${apiBase}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data?.email) {
          localStorage.setItem("user", JSON.stringify(data));
          setUser(data);
        }
      })
      .catch(console.error);
  }, [apiBase, token]);

  useEffect(() => {
    fetch(`${apiBase}/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, [apiBase]);

  useEffect(() => {
    fetch(`${apiBase}/api/locations`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setLocations(data))
      .catch(console.error);
  }, [apiBase]);

  const handleEditImages = (e) => {
    setImageReady(true);
    const incoming = Array.from(e?.target?.files || []);
    if (!incoming.length) return;
    const allowed = Math.max(0, maxImages - (form.imageUrls || []).length);
    setImageFiles((prev) => {
      const combined = [...prev, ...incoming];
      if (combined.length > allowed) {
        setImageNotice(`You can upload up to ${maxImages} images.`);
      } else {
        setImageNotice("");
      }
      const trimmed = combined.slice(0, allowed);
      setImagePreviews(trimmed.map((file) => URL.createObjectURL(file)));
      return trimmed;
    });
    if (e?.target) {
      e.target.value = "";
    }
  };

  const removeNewImage = (idx) => {
    const nextFiles = imageFiles.filter((_, i) => i !== idx);
    setImageFiles(nextFiles);
    setImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const removeExistingImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== idx)
    }));
  };

  const startEdit = (post) => {
    setEditing(post._id);
    setForm({
      title: post.title,
      category: post.category,
      type: post.type || "",
      label: post.label || "",
      breed: post.breed || "",
      age: post.age || "",
      gender: post.gender || "",
      size: post.size || "",
      vaccinationStatus: post.vaccinationStatus || "",
      medicalHistory: post.medicalHistory || "",
      temperament: post.temperament || "",
      adoptionConditions: post.adoptionConditions || "",
      contactDetails: post.contactDetails || "",
      location: post.location || "",
      description: post.description,
      contactName: post.contactName,
      phone: post.phone,
      imageData: post.imageData || "",
      imageUrl: post.imageUrl || "",
      imageUrls: Array.isArray(post.imageUrls) && post.imageUrls.length
        ? post.imageUrls
        : (post.imageUrl ? [post.imageUrl] : [])
    });
    setImageFiles([]);
    setImagePreviews([]);
    setImageReady(true);
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setStatus("");
    setImageNotice("");
    if (!imageReady) {
      setStatus("Please wait for the image to finish loading.");
      return;
    }
    if (form.description.trim().split(/\s+/).filter(Boolean).length > maxWords) {
      setStatus(`Description exceeds ${maxWords} words.`);
      return;
    }
    if ((form.imageUrls || []).length + imageFiles.length > maxImages) {
      setStatus(`You can upload up to ${maxImages} images.`);
      return;
    }
    const editingId = editing;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("type", form.type || "");
      formData.append("label", form.label || "");
      formData.append("breed", form.breed || "");
      formData.append("age", form.age || "");
      formData.append("gender", form.gender || "");
      formData.append("size", form.size || "");
      formData.append("vaccinationStatus", form.vaccinationStatus || "");
      formData.append("medicalHistory", form.medicalHistory || "");
      formData.append("temperament", form.temperament || "");
      formData.append("adoptionConditions", form.adoptionConditions || "");
      formData.append("contactDetails", form.contactDetails || "");
      formData.append("location", form.location || "");
      formData.append("description", form.description);
      formData.append("contactName", form.contactName);
      formData.append("phone", form.phone);
      formData.append("existingImages", JSON.stringify(form.imageUrls || []));
      imageFiles.forEach((file) => formData.append("images", file));
      const res = await fetch(`${apiBase}/api/posts/${editingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setEditing(null);
      setEditOpen(false);
      setStatus("Updated successfully.");
      setPosts((prev) =>
        prev.map((post) =>
          post._id === editingId ? { ...post, ...form, imageUrls: form.imageUrls } : post
        )
      );
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editCategory = categories.find(
    (cat) => cat.name && form.category && cat.name.toLowerCase() === form.category.toLowerCase()
  );
  const labelOptions = editCategory && form.type
    ? (editCategory.labelsByType && editCategory.labelsByType[form.type]) || []
    : [];

  return (
    <main className="page">
      <section className="section-head-block">
        <h1>My Posts</h1>
        <p>Manage and update your submitted listings.</p>
      </section>
      <section className="grid">
        {posts.map((post) => (
          <div key={post._id} className="card">
            <h4>{post.title}</h4>
            <p className="clamp-2">{post.description}</p>
            {post.location && <p className="muted">Location: {post.location}</p>}
            <p className="muted">Posted by: {post.userEmail || "You"}</p>
            <div className="action-row">
              <button className="ghost-btn" onClick={() => startEdit(post)}>Edit</button>
            </div>
          </div>
        ))}
      </section>
      {status && <p className={status.includes("success") ? "success" : "error"}>{status}</p>}

      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit My Post</h3>
              <button className="ghost-btn" onClick={() => setEditOpen(false)}>Close</button>
            </div>
            <form className="form-card" onSubmit={saveEdit}>
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
              {(() => {
                const match = categories.find(
                  (cat) => cat.name && form.category && cat.name.toLowerCase() === form.category.toLowerCase()
                );
                const types = match && Array.isArray(match.types) ? match.types : [];
                const labels = match && form.type
                  ? (match.labelsByType && match.labelsByType[form.type]) || []
                  : [];
                if (types.length === 0) return null;
                return (
                  <>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value, label: "" })}
                    >
                      <option value="">Select Type</option>
                      {types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {labels.length > 0 && (
                      <select
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        required
                      >
                        <option value="">Select Label</option>
                        {labels.map((label) => (
                          <option key={label} value={label}>{label}</option>
                        ))}
                      </select>
                    )}
                  </>
                );
              })()}
              {form.category.toLowerCase() === "pets" && (
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
                rows="3"
                placeholder={`Description (max ${maxWords} words)`}
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
              {form.category.toLowerCase() === "pets" && (
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
                onChange={handleEditImages}
              />
              <small className="muted">Selected: {(form.imageUrls || []).length + imagePreviews.length}/{maxImages}</small>
              {imageNotice && <small className="error">{imageNotice}</small>}
              <small className="muted">Tip: Use Ctrl/Shift to select multiple images.</small>
              {Array.isArray(form.imageUrls) && form.imageUrls.length > 0 && (
                <div className="image-preview-grid">
                  {form.imageUrls.map((src, idx) => (
                    <div key={`${src}-${idx}`} className="image-preview-item">
                      <img className="preview-image" src={src} alt={`Existing ${idx + 1}`} />
                      <button type="button" className="ghost-btn" onClick={() => removeExistingImage(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imagePreviews.length > 0 && (
                <div className="image-preview-grid">
                  {imagePreviews.map((src, idx) => (
                    <div key={`${src}-${idx}`} className="image-preview-item">
                      <img className="preview-image" src={src} alt={`Preview ${idx + 1}`} />
                      <button type="button" className="ghost-btn" onClick={() => removeNewImage(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
          {saving && (
            <div className="loading-overlay">
              <div className="loading-card">
                <span className="loader-dot"></span>
                <span className="loader-dot"></span>
                <span className="loader-dot"></span>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default MyPosts;


