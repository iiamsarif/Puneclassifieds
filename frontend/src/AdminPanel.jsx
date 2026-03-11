import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PAGE_SIZE = 10;

const safeJson = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { invalid: true, message: "Invalid server response", raw: text };
  }
};

const fetchJson = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
};

const AdminPanel = ({ apiBase, sidebarOpen, setSidebarOpen }) => {
  const [pending, setPending] = useState({ jobs: [], properties: [], pets: [], posts: [] });
  const [approved, setApproved] = useState({ jobs: [], properties: [], pets: [], posts: [] });
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [noteList, setNoteList] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", iconUrl: "", iconData: "" });
  const [newsForm, setNewsForm] = useState({ title: "", category: "", description: "", image: "", imageData: "", date: "" });
  const [noteForm, setNoteForm] = useState({ title: "", description: "", category: "", pdfFile: "", pdfData: "", notificationDate: "" });
  const [settings, setSettings] = useState({ heroImage: "", contactEmail: "" });
  const [status, setStatus] = useState("");
  const [active, setActive] = useState("dashboard");
  const [editPost, setEditPost] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", category: "", location: "", description: "", contactName: "", phone: "", imageData: "", imageUrl: "", userEmail: "" });
  const [editUploader, setEditUploader] = useState({ name: "", email: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryEditOpen, setCategoryEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [pdfReady, setPdfReady] = useState(true);
  const [categoryFile, setCategoryFile] = useState(null);
  const [newsImageFile, setNewsImageFile] = useState(null);
  const [notePdfFile, setNotePdfFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [notesPage, setNotesPage] = useState(1);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const hasLoadedRef = useRef(false);

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

  const clampPage = (len, page, setPage) => {
    const pages = Math.max(1, Math.ceil(len / PAGE_SIZE));
    if (page > pages) setPage(pages);
  };

  const cacheKey = "adminCacheV1";

  const loadCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.pending) setPending(parsed.pending);
      if (parsed.approved) setApproved(parsed.approved);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.newsList) setNewsList(parsed.newsList);
      if (parsed.noteList) setNoteList(parsed.noteList);
      if (parsed.trending) setTrending(parsed.trending);
      if (parsed.settings) setSettings(parsed.settings);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error(err);
    }
  };

  const saveCache = (snapshot) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ...snapshot, ts: Date.now() }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveCache({
      pending,
      approved,
      users,
      categories,
      newsList,
      noteList,
      trending,
      settings
    });
  }, [pending, approved, users, categories, newsList, noteList, trending, settings]);

  const loadData = async (section = "dashboard") => {
    try {
      const baseHeaders = { Authorization: `Bearer ${token}` };
      const jobs = [];

      const isAll = section === "all";

      if (isAll || section === "dashboard" || section === "pending" || section === "approved") {
        jobs.push(
          fetchJson(`${apiBase}/api/admin/pending`, { headers: baseHeaders }).then((data) => {
            if (data && data.posts) setPending(data);
          })
        );
        jobs.push(
          fetchJson(`${apiBase}/api/admin/approved`, { headers: baseHeaders }).then((data) => {
            if (data && data.posts) setApproved(data);
          })
        );
      }
      if (isAll || section === "dashboard" || section === "users") {
        jobs.push(
          fetchJson(`${apiBase}/api/admin/users`, { headers: baseHeaders }).then((data) => {
            if (Array.isArray(data)) setUsers(data);
          })
        );
      }
      if (isAll || section === "dashboard" || section === "categories") {
        jobs.push(
          fetchJson(`${apiBase}/api/categories`).then((data) => {
            if (Array.isArray(data)) setCategories(data);
          })
        );
      }
      if (isAll || section === "news" || section === "dashboard") {
        jobs.push(
          fetchJson(`${apiBase}/api/news`).then((data) => {
            if (Array.isArray(data)) setNewsList(data);
          })
        );
      }
      if (isAll || section === "notifications" || section === "dashboard") {
        jobs.push(
          fetchJson(`${apiBase}/api/notifications`).then((data) => {
            if (Array.isArray(data)) setNoteList(data);
          })
        );
      }
      if (isAll || section === "settings" || section === "dashboard") {
        jobs.push(
          fetchJson(`${apiBase}/api/settings/web`).then((s) =>
            setSettings({ heroImage: s?.heroImage || "", contactEmail: s?.contactEmail || "" })
          )
        );
      }
      if (isAll || section === "dashboard") {
        jobs.push(
          fetchJson(`${apiBase}/api/admin/trending`, { headers: baseHeaders }).then((tr) => {
            if (Array.isArray(tr)) setTrending(tr);
          })
        );
      }

      await Promise.allSettled(jobs);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCache();
    loadData("all");
    const interval = setInterval(() => {
      if (!loading) loadData(active);
    }, 25000);
    return () => clearInterval(interval);
  }, [apiBase, loading, active]);

  useEffect(() => {
    if (!loading) loadData(active);
  }, [active]);

  const approve = async (type, id) => {
    await withLoading(async () => {
      let approvedItem = null;
      setPending((prev) => {
        approvedItem = prev[type].find((item) => item._id === id) || null;
        return {
          ...prev,
          [type]: prev[type].filter((item) => item._id !== id)
        };
      });
      if (approvedItem) {
        setApproved((prev) => ({
          ...prev,
          [type]: [{ ...approvedItem, status: "approved" }, ...prev[type]]
        }));
      }
      await fetch(`${apiBase}/api/${type}/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (type === "posts") {
        clampPage(pending.posts.length - 1, pendingPage, setPendingPage);
        clampPage(approved.posts.length + 1, approvedPage, setApprovedPage);
      }
      void loadData(active);
    }, "Approved successfully");
  };

  const remove = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    await withLoading(async () => {
      if (type === "posts" || type === "jobs" || type === "properties" || type === "pets") {
        setPending((prev) => ({ ...prev, [type]: prev[type].filter((item) => item._id !== id) }));
        setApproved((prev) => ({ ...prev, [type]: prev[type].filter((item) => item._id !== id) }));
      }
      await fetch(`${apiBase}/api/${type}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (type === "posts") {
        clampPage(pending.posts.length - 1, pendingPage, setPendingPage);
        clampPage(approved.posts.length - 1, approvedPage, setApprovedPage);
      }
      void loadData(active);
    }, "Deleted successfully");
  };

  const removeUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await withLoading(async () => {
      setUsers((prev) => prev.filter((user) => user._id !== id));
      await fetch(`${apiBase}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      clampPage(users.length - 1, usersPage, setUsersPage);
      void loadData(active);
    }, "User removed");
  };

  const addCategory = async (e) => {
    e.preventDefault();
    setStatus("");
    await withLoading(async () => {
      const tempId = `temp-${Date.now()}`;
      const tempItem = {
        _id: tempId,
        name: categoryForm.name,
        description: categoryForm.description || "",
        iconUrl: categoryForm.iconUrl,
        iconData: categoryForm.iconData
      };
      setCategories((prev) => [tempItem, ...prev]);
      setCategoriesPage(1);
      const formData = new FormData();
      formData.append("name", categoryForm.name);
      formData.append("description", categoryForm.description || "");
      if (categoryForm.iconUrl.trim()) formData.append("iconUrl", categoryForm.iconUrl.trim());
      if (categoryFile) formData.append("icon", categoryFile);
      const res = await fetch(`${apiBase}/api/categories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to add category.");
      if (data.item) {
        setCategories((prev) => prev.map((cat) => (cat._id === tempId ? data.item : cat)));
      }
      setCategoryForm({ name: "", description: "", iconUrl: "", iconData: "" });
      setCategoryFile(null);
      void loadData(active);
    }, "Category added");
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat._id);
    setCategoryForm({
      name: cat.name,
      description: cat.description || "",
      iconUrl: cat.iconUrl || "",
      iconData: cat.iconData || ""
    });
    setCategoryFile(null);
    setCategoryEditOpen(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      setCategories((prev) =>
        prev.map((cat) => (cat._id === editingCategory ? { ...cat, ...categoryForm } : cat))
      );
      const formData = new FormData();
      formData.append("name", categoryForm.name);
      formData.append("description", categoryForm.description || "");
      if (categoryForm.iconUrl.trim()) formData.append("iconUrl", categoryForm.iconUrl.trim());
      if (categoryFile) formData.append("icon", categoryFile);
      const res = await fetch(`${apiBase}/api/categories/${editingCategory}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to update category.");
      setCategoryEditOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", iconUrl: "", iconData: "" });
      setCategoryFile(null);
      clampPage(categories.length, categoriesPage, setCategoriesPage);
      void loadData(active);
    }, "Category updated");
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      clampPage(categories.length - 1, categoriesPage, setCategoriesPage);
      void loadData(active);
    }, "Category deleted");
  };

  const addNews = async (e) => {
    e.preventDefault();
    setStatus("");
    await withLoading(async () => {
      const tempId = `temp-${Date.now()}`;
      const tempItem = {
        _id: tempId,
        title: newsForm.title,
        category: newsForm.category,
        description: newsForm.description,
        image: newsForm.image,
        imageData: newsForm.imageData,
        date: newsForm.date
      };
      setNewsList((prev) => [tempItem, ...prev]);
      setNewsPage(1);
      const formData = new FormData();
      formData.append("title", newsForm.title);
      formData.append("category", newsForm.category);
      formData.append("description", newsForm.description);
      formData.append("date", newsForm.date);
      if (newsForm.image.trim()) formData.append("image", newsForm.image.trim());
      if (newsImageFile) formData.append("image", newsImageFile);
      const res = await fetch(`${apiBase}/api/news`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to add news.");
      if (data.item) {
        setNewsList((prev) => prev.map((item) => (item._id === tempId ? data.item : item)));
      }
      setNewsForm({ title: "", category: "", description: "", image: "", imageData: "", date: "" });
      setNewsImageFile(null);
      void loadData(active);
    }, "News added");
  };

  const deleteNews = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news item?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/news/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewsList((prev) => prev.filter((item) => item._id !== id));
      clampPage(newsList.length - 1, newsPage, setNewsPage);
      void loadData(active);
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
      const tempId = `temp-${Date.now()}`;
      const tempItem = {
        _id: tempId,
        title: noteForm.title,
        description: noteForm.description,
        category: noteForm.category,
        pdfFile: noteForm.pdfFile,
        pdfData: noteForm.pdfData,
        notificationDate: noteForm.notificationDate
      };
      setNoteList((prev) => [tempItem, ...prev]);
      setNotesPage(1);
      const formData = new FormData();
      formData.append("title", noteForm.title);
      formData.append("description", noteForm.description);
      formData.append("category", noteForm.category);
      formData.append("notificationDate", noteForm.notificationDate);
      if (noteForm.pdfFile.trim()) formData.append("pdfFile", noteForm.pdfFile.trim());
      if (notePdfFile) formData.append("pdf", notePdfFile);
      const res = await fetch(`${apiBase}/api/notifications`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to add notification.");
      if (data.item) {
        setNoteList((prev) => prev.map((item) => (item._id === tempId ? data.item : item)));
      }
      setNoteForm({ title: "", description: "", category: "", pdfFile: "", pdfData: "", notificationDate: "" });
      setNotePdfFile(null);
      setPdfReady(true);
      void loadData(active);
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
      setNoteList((prev) => prev.filter((item) => item._id !== id));
      clampPage(noteList.length - 1, notesPage, setNotesPage);
      void loadData(active);
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
      void loadData(active);
    }, "Settings updated");
  };

  const handleNewsImage = (file) => {
    if (!file) {
      setNewsImageFile(null);
      setNewsForm((prev) => ({ ...prev, imageData: "" }));
      return;
    }
    setNewsImageFile(file);
    setNewsForm((prev) => ({ ...prev, imageData: URL.createObjectURL(file) }));
  };

  const handleCategoryIcon = (file) => {
    if (!file) {
      setCategoryFile(null);
      setCategoryForm((prev) => ({ ...prev, iconData: "" }));
      return;
    }
    setCategoryFile(file);
    setCategoryForm((prev) => ({ ...prev, iconData: URL.createObjectURL(file), iconUrl: "" }));
  };

  const handlePdfUpload = (file) => {
    setPdfReady(false);
    if (!file) {
      setNotePdfFile(null);
      setNoteForm((prev) => ({ ...prev, pdfData: "" }));
      setPdfReady(true);
      return;
    }
    setNotePdfFile(file);
    setNoteForm((prev) => ({ ...prev, pdfData: file.name }));
    setPdfReady(true);
  };

  const handleEditImage = (file) => {
    if (!file) {
      setEditImageFile(null);
      return;
    }
    setEditImageFile(file);
    setEditForm((prev) => ({ ...prev, imageData: URL.createObjectURL(file), imageUrl: "" }));
  };

  const startEdit = async (post) => {
    setEditPost(post._id);
    setEditForm({
      title: post.title || "",
      category: post.category || "",
      location: post.location || "",
      description: post.description || "",
      contactName: post.contactName || "",
      phone: post.phone || "",
      imageData: post.imageData || "",
      imageUrl: post.imageUrl || "",
      userEmail: post.userEmail || ""
    });
    setEditUploader({ name: post.contactName || "", email: post.userEmail || "" });
    setEditImageFile(null);
    setEditOpen(true);
    setEditLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/posts/${post._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEditForm({
        title: data.post.title,
        category: data.post.category,
        location: data.post.location || "",
        description: data.post.description,
        contactName: data.post.contactName || "",
        phone: data.post.phone || "",
        imageData: data.post.imageData || "",
        imageUrl: data.post.imageUrl || "",
        userEmail: data.post.userEmail || ""
      });
      setEditUploader({ name: data.user?.name || "", email: data.user?.email || "" });
      setEditLoading(false);
    } catch (err) {
      console.error(err);
      setEditLoading(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      setApproved((prev) => ({
        ...prev,
        posts: prev.posts.map((item) => (item._id === editPost ? { ...item, ...editForm } : item))
      }));
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("category", editForm.category);
      formData.append("location", editForm.location || "");
      formData.append("description", editForm.description);
      formData.append("contactName", editForm.contactName);
      formData.append("phone", editForm.phone);
      formData.append("userEmail", editForm.userEmail || "");
      if (editForm.imageUrl) formData.append("imageUrl", editForm.imageUrl);
      if (editImageFile) formData.append("image", editImageFile);
      const res = await fetch(`${apiBase}/api/admin/posts/${editPost}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save changes.");
      setEditPost(null);
      setEditOpen(false);
      void loadData(active);
    }, "Post updated");
  };

  const renderItems = (items, type, pendingView) => (
    <div className="grid">
      {items.map((item) => (
        <div key={item._id} className="card">
          <h4>{item.jobTitle || item.propertyTitle || item.petName || item.title}</h4>
          <p>{item.description || item.location || item.breed || item.category}</p>
          {item.location && <p className="muted">Location: {item.location}</p>}
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

      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
        </div>
      )}
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
              {editLoading && <p className="muted">Loading details...</p>}
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
                  type="text"
                  placeholder="Location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
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
                {(editForm.imageData || editForm.imageUrl) && (
                  <img className="preview-image" src={editForm.imageData || editForm.imageUrl} alt="Preview" />
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
                  {(cat.iconData || cat.iconUrl) && (
                    <img
                      className="category-icon"
                      src={cat.iconData || cat.iconUrl}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                  <h4>{cat.name}</h4>
                  <p>{cat.description || ""}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => startEditCategory(cat)}>Edit</button>
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
                <input
                  type="text"
                  placeholder="Icon URL"
                  value={categoryForm.iconUrl}
                  onChange={(e) => {
                    setCategoryFile(null);
                    setCategoryForm({ ...categoryForm, iconUrl: e.target.value, iconData: "" });
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCategoryIcon(e.target.files[0])}
                />
                {(categoryForm.iconData || categoryForm.iconUrl) && (
                  <img
                    className="preview-image"
                    src={categoryForm.iconData || categoryForm.iconUrl}
                    alt="Category Icon"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <button className="primary-btn" type="submit">Add Category</button>
              </form>
            </div>
          </div>
        )}

        {categoryEditOpen && (
          <div className="modal-overlay" onClick={() => setCategoryEditOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit Category</h3>
                <button className="ghost-btn" onClick={() => setCategoryEditOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={saveCategory}>
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
                <input
                  type="text"
                  placeholder="Icon URL"
                  value={categoryForm.iconUrl}
                  onChange={(e) => {
                    setCategoryFile(null);
                    setCategoryForm({ ...categoryForm, iconUrl: e.target.value, iconData: "" });
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCategoryIcon(e.target.files[0])}
                />
                {(categoryForm.iconData || categoryForm.iconUrl) && (
                  <img
                    className="preview-image"
                    src={categoryForm.iconData || categoryForm.iconUrl}
                    alt="Category Icon"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <button className="primary-btn" type="submit">Save Changes</button>
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
                  onChange={(e) => {
                    setNewsImageFile(null);
                    setNewsForm({ ...newsForm, image: e.target.value, imageData: "" });
                  }}
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
                  onChange={(e) => {
                    setNotePdfFile(null);
                    setNoteForm({ ...noteForm, pdfFile: e.target.value, pdfData: "" });
                  }}
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


