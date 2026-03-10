import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PAGE_SIZE = 10;

const AdminPanel = ({ apiBase, sidebarOpen, setSidebarOpen }) => {
  const [pending, setPending] = useState({ jobs: [], properties: [], pets: [], posts: [] });
  const [approved, setApproved] = useState({ jobs: [], properties: [], pets: [], posts: [] });
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [noteList, setNoteList] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [newsForm, setNewsForm] = useState({ title: "", category: "", description: "", image: "", imageData: "", date: "" });
  const [noteForm, setNoteForm] = useState({ title: "", description: "", category: "", pdfFile: "", pdfData: "", notificationDate: "" });
  const [settings, setSettings] = useState({ heroImage: "", contactEmail: "" });
  const [status, setStatus] = useState("");
  const [active, setActive] = useState("dashboard");
  const [editPost, setEditPost] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", category: "", description: "", contactName: "", phone: "", imageData: "", userEmail: "" });
  const [editUploader, setEditUploader] = useState({ name: "", email: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [pdfReady, setPdfReady] = useState(true);

  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [notesPage, setNotesPage] = useState(1);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const token = localStorage.getItem("adminToken");

  const pushToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  };

  const withLoading = async (fn, successMessage) => {
    try {
      setLoading(true);
      const result = await fn();
      if (successMessage) pushToast(successMessage);
      return result;
    } catch (err) {
      pushToast(err.message || "Action failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [p, a, u, s, c, n, nt, tr] = await Promise.all([
        fetch(`${apiBase}/api/admin/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json()),
        fetch(`${apiBase}/api/admin/approved`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json()),
        fetch(`${apiBase}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json()),
        fetch(`${apiBase}/api/settings/web`).then((r) => r.json()),
        fetch(`${apiBase}/api/categories`).then((r) => r.json()),
        fetch(`${apiBase}/api/news`).then((r) => r.json()),
        fetch(`${apiBase}/api/notifications`).then((r) => r.json()),
        fetch(`${apiBase}/api/admin/trending`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json())
      ]);
      setPending(p);
      setApproved(a);
      setUsers(u);
      setCategories(c);
      setNewsList(n);
      setNoteList(nt);
      setTrending(tr || []);
      setSettings({
        heroImage: s?.heroImage || "",
        contactEmail: s?.contactEmail || ""
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiBase]);

  const approve = async (type, id) => {
    await withLoading(async () => {
      await fetch(`${apiBase}/api/${type}/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadData();
    }, "Approved successfully");
  };

  const remove = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/${type}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadData();
    }, "Deleted successfully");
  };

  const removeUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadData();
    }, "User removed");
  };

  const addCategory = async (e) => {
    e.preventDefault();
    setStatus("");
    await withLoading(async () => {
      const res = await fetch(`${apiBase}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });
      if (!res.ok) throw new Error("Failed to add category.");
      setCategoryForm({ name: "", description: "" });
      await loadData();
    }, "Category added");
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadData();
    }, "Category deleted");
  };

  const addNews = async (e) => {
    e.preventDefault();
    setStatus("");
    await withLoading(async () => {
      const res = await fetch(`${apiBase}/api/news`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newsForm)
      });
      if (!res.ok) throw new Error("Failed to add news.");
      setNewsForm({ title: "", category: "", description: "", image: "", imageData: "", date: "" });
      await loadData();
    }, "News added");
  };

  const deleteNews = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news item?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/news/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadData();
    }, "News deleted");
  };

  const addNotification = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!noteForm.pdfData && !noteForm.pdfFile) {
      pushToast("Please upload a PDF or add a PDF URL.");
      return false;
    }
    if (!pdfReady) {
      pushToast("Please wait for the PDF to finish loading.");
      return false;
    }
    return await withLoading(async () => {
      const res = await fetch(`${apiBase}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(noteForm)
      });
      if (!res.ok) throw new Error("Failed to add notification.");
      setNoteForm({ title: "", description: "", category: "", pdfFile: "", pdfData: "", notificationDate: "" });
      setPdfReady(true);
      await loadData();
      return true;
    }, "Notification added");
  };

  const deleteNotification = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadData();
    }, "Notification deleted");
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      const res = await fetch(`${apiBase}/api/settings/web`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error("Failed to update settings.");
      await loadData();
    }, "Settings updated");
  };

  const handleNewsImage = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewsForm((prev) => ({ ...prev, imageData: reader.result }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const handlePdfUpload = (file) => {
    setPdfReady(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNoteForm((prev) => ({ ...prev, pdfData: reader.result }));
      setPdfReady(true);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleEditImage = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm((prev) => ({ ...prev, imageData: reader.result }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const startEdit = async (post) => {
    setEditPost(post._id);
    try {
      const res = await fetch(`${apiBase}/api/admin/posts/${post._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEditForm({
        title: data.post.title,
        category: data.post.category,
        description: data.post.description,
        contactName: data.post.contactName || "",
        phone: data.post.phone || "",
        imageData: data.post.imageData || "",
        userEmail: data.post.userEmail || ""
      });
      setEditUploader({ name: data.user?.name || "", email: data.user?.email || "" });
      setEditOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      const res = await fetch(`${apiBase}/api/admin/posts/${editPost}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error("Failed to save changes.");
      setEditPost(null);
      setEditOpen(false);
      await loadData();
    }, "Post updated");
  };

  const renderItems = (items, type, pendingView) => (
    <div className="grid">
      {items.map((item) => (
        <div key={item._id} className="card">
          <h4>{item.jobTitle || item.propertyTitle || item.petName || item.title}</h4>
          <p>{item.description || item.location || item.breed || item.category}</p>
          <div className="action-row">
            {pendingView && (
              <button className="primary-btn" onClick={() => approve(type, item._id)}>
                Approve
              </button>
            )}
            {!pendingView && type === "posts" && (
              <button className="ghost-btn" onClick={() => startEdit(item)}>
                Edit
              </button>
            )}
            <button className="ghost-btn" onClick={() => remove(type, item._id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const paginate = (items, page) => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  };

  const renderPager = (items, page, setPage) => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1);
    return (
      <div className="pagination">
        {pages.map((num) => (
          <button
            key={num}
            className={`page-btn ${page === num ? "active" : ""}`}
            onClick={() => setPage(num)}
          >
            {num}
          </button>
        ))}
        {totalPages > 4 && (
          <button className="page-btn" onClick={() => setPage(page + 1)}>Next</button>
        )}
      </div>
    );
  };

  const allPostsCount = approved.posts.length + pending.posts.length;
  const allUsersCount = users.length;
  const categoryCounts = categories.map((cat) => ({
    ...cat,
    count: approved.posts.filter((p) => p.category === cat.name).length
  }));
  const chartSource = trending.length ? trending : categoryCounts;

  const pendingPageItems = useMemo(() => paginate(pending.posts, pendingPage), [pending.posts, pendingPage]);
  const approvedPageItems = useMemo(() => paginate(approved.posts, approvedPage), [approved.posts, approvedPage]);
  const usersPageItems = useMemo(() => paginate(users, usersPage), [users, usersPage]);
  const categoriesPageItems = useMemo(() => paginate(categories, categoriesPage), [categories, categoriesPage]);
  const newsPageItems = useMemo(() => paginate(newsList, newsPage), [newsList, newsPage]);
  const notesPageItems = useMemo(() => paginate(noteList, notesPage), [noteList, notesPage]);

  useEffect(() => {
    if (!chartRef.current || active !== "dashboard") return;
    const labels = chartSource.map((c) => c.name || c.category);
    const data = chartSource.map((c) => c.count || 0);
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Searches",
            data,
            backgroundColor: "rgba(27, 43, 58, 0.7)",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }, [active, chartSource]);

  return (
    <main className="admin-page">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
        </div>
      )}
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((toast) => (
            <div key={toast.id} className="toast">{toast.message}</div>
          ))}
        </div>
      )}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>Admin Console</h2>
        <button className={active === "dashboard" ? "active" : ""} onClick={() => { setActive("dashboard"); setSidebarOpen(false); }}>
          Dashboard
        </button>
        <button className={active === "pending" ? "active" : ""} onClick={() => { setActive("pending"); setSidebarOpen(false); }}>
          Pending Posts
        </button>
        <button className={active === "approved" ? "active" : ""} onClick={() => { setActive("approved"); setSidebarOpen(false); }}>
          Approved Posts
        </button>
        <button className={active === "users" ? "active" : ""} onClick={() => { setActive("users"); setSidebarOpen(false); }}>
          Control Users
        </button>
        <button className={active === "categories" ? "active" : ""} onClick={() => { setActive("categories"); setSidebarOpen(false); }}>
          Categories
        </button>
        <button className={active === "news" ? "active" : ""} onClick={() => { setActive("news"); setSidebarOpen(false); }}>
          Upload News
        </button>
        <button className={active === "notifications" ? "active" : ""} onClick={() => { setActive("notifications"); setSidebarOpen(false); }}>
          Notifications
        </button>
        <button className={active === "settings" ? "active" : ""} onClick={() => { setActive("settings"); setSidebarOpen(false); }}>
          Web Settings
        </button>
      </aside>

      <section className="admin-content">
        {active === "dashboard" && (
          <div className="admin-topbar dashboard-hero">
            <div>
              <h1>Admin Dashboard</h1>
              <p>System insights, activity performance, and category trends.</p>
            </div>
          </div>
        )}
        {status && <p className="success">{status}</p>}

        {active === "dashboard" && (
          <section className="dashboard-grid">
            <div className="dash-card">
              <h3>All Users</h3>
              <div className="bar-row">
                <span>{allUsersCount}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(allUsersCount * 10, 100)}%` }}></div>
                </div>
              </div>
            </div>
            <div className="dash-card">
              <h3>All Posts</h3>
              <div className="bar-row">
                <span>{allPostsCount}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill accent"
                    style={{ width: `${Math.min(allPostsCount * 8, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="dash-card">
              <h3>Trending Categories</h3>
              <canvas ref={chartRef} height="180"></canvas>
            </div>
          </section>
        )}

        {active === "pending" && (
          <section className="section">
            <div className="section-head">
              <h2>Pending Listings</h2>
            </div>
            <h3 className="subhead">Community Posts</h3>
            {renderItems(pendingPageItems, "posts", true)}
            {renderPager(pending.posts, pendingPage, setPendingPage)}
          </section>
        )}

        {active === "approved" && (
          <section className="section">
            <div className="section-head">
              <h2>Approved Listings</h2>
            </div>
            <h3 className="subhead">Community Posts</h3>
            {renderItems(approvedPageItems, "posts", false)}
            {renderPager(approved.posts, approvedPage, setApprovedPage)}
          </section>
        )}

        {editOpen && (
          <div className="modal-overlay" onClick={() => setEditOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit Approved Post</h3>
                <button className="ghost-btn" onClick={() => setEditOpen(false)}>Close</button>
              </div>
              <p className="muted">Uploaded by: {editUploader.name} ({editUploader.email})</p>
              <form className="form-card" onSubmit={saveEdit}>
                <input
                  type="text"
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Posted By (Email)"
                  value={editForm.userEmail}
                  onChange={(e) => setEditForm({ ...editForm, userEmail: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={editForm.contactName}
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditImage(e.target.files[0])}
                />
                {editForm.imageData && (
                  <img className="preview-image" src={editForm.imageData} alt="Preview" />
                )}
                <button className="primary-btn" type="submit">Save Changes</button>
              </form>
            </div>
          </div>
        )}

        {active === "users" && (
          <section className="section">
            <div className="section-head">
              <h2>Control Users</h2>
            </div>
            <div className="grid">
              {usersPageItems.map((user) => (
                <div key={user._id} className="card">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => removeUser(user._id)}>
                      Remove User
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(users, usersPage, setUsersPage)}
          </section>
        )}

        {active === "categories" && (
          <section className="section">
            <div className="section-head">
              <h2>Category Manager</h2>
              <button className="primary-btn" onClick={() => setCategoryOpen(true)}>Add Category</button>
            </div>
            <div className="grid">
              {categoriesPageItems.map((cat) => (
                <div key={cat._id} className="card">
                  <h4>{cat.name}</h4>
                  <p>{cat.description || ""}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => deleteCategory(cat._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(categories, categoriesPage, setCategoriesPage)}
          </section>
        )}

        {categoryOpen && (
          <div className="modal-overlay" onClick={() => setCategoryOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Add Category</h3>
                <button className="ghost-btn" onClick={() => setCategoryOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={(e) => { addCategory(e); setCategoryOpen(false); }}>
                <input
                  type="text"
                  placeholder="Category Name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
                <button className="primary-btn" type="submit">Add Category</button>
              </form>
            </div>
          </div>
        )}

        {active === "news" && (
          <section className="section">
            <div className="section-head">
              <h2>News Manager</h2>
              <button className="primary-btn" onClick={() => setNewsOpen(true)}>Add News</button>
            </div>
            <div className="grid">
              {newsPageItems.map((item) => (
                <div key={item._id} className="card">
                  <h4>{item.title}</h4>
                  <p>{item.category}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => deleteNews(item._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(newsList, newsPage, setNewsPage)}
          </section>
        )}

        {newsOpen && (
          <div className="modal-overlay" onClick={() => setNewsOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Add News</h3>
                <button className="ghost-btn" onClick={() => setNewsOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={(e) => { addNews(e); setNewsOpen(false); }}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newsForm.category}
                  onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Description"
                  value={newsForm.description}
                  onChange={(e) => setNewsForm({ ...newsForm, description: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newsForm.image}
                  onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNewsImage(e.target.files[0])}
                />
                <input
                  type="date"
                  value={newsForm.date}
                  onChange={(e) => setNewsForm({ ...newsForm, date: e.target.value })}
                  required
                />
                <button className="primary-btn" type="submit">Add News</button>
              </form>
            </div>
          </div>
        )}

        {active === "notifications" && (
          <section className="section">
            <div className="section-head">
              <h2>Notification Manager</h2>
              <button className="primary-btn" onClick={() => setNotifOpen(true)}>Add Notification</button>
            </div>
            <div className="grid">
              {notesPageItems.map((item) => (
                <div key={item._id} className="card">
                  <h4>{item.title}</h4>
                  <p>{item.category}</p>
                  <p className="muted">{item.notificationDate}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => deleteNotification(item._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(noteList, notesPage, setNotesPage)}
          </section>
        )}

        {notifOpen && (
          <div className="modal-overlay" onClick={() => setNotifOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Add Notification</h3>
                <button className="ghost-btn" onClick={() => setNotifOpen(false)}>Close</button>
              </div>
              <form
                className="form-card"
                onSubmit={async (e) => {
                  const ok = await addNotification(e);
                  if (ok) setNotifOpen(false);
                }}
              >
                <input
                  type="text"
                  placeholder="Title"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={noteForm.category}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Description"
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="PDF URL"
                  value={noteForm.pdfFile}
                  onChange={(e) => setNoteForm({ ...noteForm, pdfFile: e.target.value })}
                />
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handlePdfUpload(e.target.files[0])}
                />
                <input
                  type="date"
                  value={noteForm.notificationDate}
                  onChange={(e) => setNoteForm({ ...noteForm, notificationDate: e.target.value })}
                  required
                />
                <button className="primary-btn" type="submit">Add Notification</button>
              </form>
            </div>
          </div>
        )}

        {active === "settings" && (
          <section className="section form-section">
            <div className="section-head">
              <h2>Web Settings</h2>
            </div>
            <form className="form-card" onSubmit={saveSettings}>
              <input
                type="text"
                placeholder="Hero Image URL"
                value={settings.heroImage}
                onChange={(e) => setSettings({ ...settings, heroImage: e.target.value })}
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
              <button className="primary-btn" type="submit">Save Settings</button>
            </form>
          </section>
        )}
      </section>
    </main>
  );
};

export default AdminPanel;
