import React, { useEffect, useState } from "react";

const MyPosts = ({ apiBase }) => {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [imageReady, setImageReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    location: "",
    description: "",
    contactName: "",
    phone: "",
    imageData: ""
  });
  const token = localStorage.getItem("token");

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

  const handleEditImage = (file) => {
    setImageReady(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, imageData: reader.result }));
      setImageReady(true);
    };
    if (file) reader.readAsDataURL(file);
  };

  const startEdit = (post) => {
    setEditing(post._id);
    setForm({
      title: post.title,
      category: post.category,
      location: post.location || "",
      description: post.description,
      contactName: post.contactName,
      phone: post.phone,
      imageData: post.imageData || ""
    });
    setImageReady(true);
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!imageReady) {
      setStatus("Please wait for the image to finish loading.");
      return;
    }
    const editingId = editing;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/posts/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setEditing(null);
      setEditOpen(false);
      setStatus("Updated successfully.");
      setPosts((prev) => prev.map((post) => (post._id === editingId ? { ...post, ...form } : post)));
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSaving(false);
    }
  };

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
            <p>{post.description}</p>
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
              <input
                type="text"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
              <textarea
                rows="3"
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
                onChange={(e) => handleEditImage(e.target.files[0])}
              />
              {form.imageData && (
                <img className="preview-image" src={form.imageData} alt="Preview" />
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
