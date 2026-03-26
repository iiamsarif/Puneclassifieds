import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import dashboardIcon from "./images/admin-icons/dashboard.svg";
import pendingIcon from "./images/admin-icons/pending.svg";
import approvedIcon from "./images/admin-icons/approved.svg";
import usersIcon from "./images/admin-icons/users.svg";
import categoriesIcon from "./images/admin-icons/categories.svg";
import locationsIcon from "./images/admin-icons/locations.svg";
import newsIcon from "./images/admin-icons/news.svg";
import notificationsIcon from "./images/admin-icons/notifications.svg";
import settingsIcon from "./images/admin-icons/settings.svg";
import { invalidateWebSettingsCache } from "./webSettingsCache";

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
  const [locations, setLocations] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [noteList, setNoteList] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    iconUrl: "",
    iconData: "",
    types: []
  });
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelCategoryId, setLabelCategoryId] = useState("");
  const [labelType, setLabelType] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [labelDraft, setLabelDraft] = useState({});
  const [locationForm, setLocationForm] = useState({ name: "", pinCode: "" });
  const [locationEditOpen, setLocationEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [typeInput, setTypeInput] = useState("");
  const [newsForm, setNewsForm] = useState({
    title: "",
    category: "",
    description1: "",
    description2: "",
    heading2: "",
    description3: "",
    youtubeLink: "",
    videoUrl: "",
    description4: "",
    image: "",
    imageData: "",
    image2: "",
    image2Data: "",
    date: ""
  });
  const [noteForm, setNoteForm] = useState({
    serialNo: "",
    subject: "",
    department: "",
    title: "",
    summary: "",
    refNumber: "",
    dateOfIssue: "",
    pdfFile: "",
    pdfData: ""
  });
  const [editNewsOpen, setEditNewsOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [editNewsForm, setEditNewsForm] = useState({
    title: "",
    category: "",
    description1: "",
    description2: "",
    heading2: "",
    description3: "",
    youtubeLink: "",
    videoUrl: "",
    description4: "",
    image: "",
    imageData: "",
    image2: "",
    image2Data: "",
    date: ""
  });
  const [editNewsFile1, setEditNewsFile1] = useState(null);
  const [editNewsFile2, setEditNewsFile2] = useState(null);
  const [editNewsVideoFile, setEditNewsVideoFile] = useState(null);
  const [editNewsVideoPreview, setEditNewsVideoPreview] = useState("");
  const [editNewsRemoveVideo, setEditNewsRemoveVideo] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteForm, setEditNoteForm] = useState({
    serialNo: "",
    subject: "",
    department: "",
    title: "",
    summary: "",
    refNumber: "",
    dateOfIssue: "",
    pdfFile: "",
    pdfData: ""
  });
  const [editNoteFile, setEditNoteFile] = useState(null);
  const [settings, setSettings] = useState({
    heroHeading: "",
    heroSubheading: "",
    heroImage: "",
    heroVideo: "",
    heroMediaMode: "image",
    popupVideo: "",
    popupLink: "",
    popupEnabled: false,
    heroBg: "",
    heroBg1: "",
    heroBg2: "",
    heroBg3: "",
    heroBg4: "",
    marqueeText: "",
    contactEmail: "",
    banner1: "",
    banner2: "",
    banner3: "",
    banner4: "",
    homeWideAd: "",
    sideAd1: "",
    sideAd2: "",
    sideAd3: "",
    newsWideAd: "",
    newsSideAd1: "",
    newsSideAd2: "",
    newsSideAd3: "",
    jobsWideAd: "",
    jobsSideAd1: "",
    jobsSideAd2: "",
    jobsSideAd3: "",
    propertyWideAd: "",
    propertySideAd1: "",
    propertySideAd2: "",
    propertySideAd3: "",
    petsWideAd: "",
    petsSideAd1: "",
    petsSideAd2: "",
    petsSideAd3: "",
    servicesWideAd: "",
    servicesSideAd1: "",
    servicesSideAd2: "",
    servicesSideAd3: ""
  });
  const [heroVideoFile, setHeroVideoFile] = useState(null);
  const [popupVideoFile, setPopupVideoFile] = useState(null);
  const [status, setStatus] = useState("");
  const [active, setActive] = useState("dashboard");
  const [editPost, setEditPost] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    type: "",
    label: "",
    paid: false,
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
    pinCode: "",
    description: "",
    contactName: "",
    phone: "",
    expiresAt: "",
    imageData: "",
    imageUrl: "",
    imageUrls: [],
    userEmail: ""
  });
  const [editUploader, setEditUploader] = useState({ name: "", email: "" });
  const [editUserDetails, setEditUserDetails] = useState(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveExpiry, setApproveExpiry] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryEditOpen, setCategoryEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [pdfReady, setPdfReady] = useState(true);
  const [categoryFile, setCategoryFile] = useState(null);
  const [newsImageFile1, setNewsImageFile1] = useState(null);
  const [newsImageFile2, setNewsImageFile2] = useState(null);
  const [newsVideoFile, setNewsVideoFile] = useState(null);
  const [newsVideoPreview, setNewsVideoPreview] = useState("");
  const [notePdfFile, setNotePdfFile] = useState(null);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const [editImageNotice, setEditImageNotice] = useState("");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsTab, setSettingsTab] = useState("home");
  const settingsDirtyRef = useRef(false);

  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [locationsPage, setLocationsPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [notesPage, setNotesPage] = useState(1);
  const [pendingSearch, setPendingSearch] = useState("");
  const [approvedSearch, setApprovedSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [categoriesSearch, setCategoriesSearch] = useState("");
  const [locationsSearch, setLocationsSearch] = useState("");
  const [newsSearch, setNewsSearch] = useState("");
  const [notesSearch, setNotesSearch] = useState("");
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", paid: false, paidUntil: "" });

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const hasLoadedRef = useRef(false);

  const token = localStorage.getItem("adminToken");

  useEffect(() => () => {
    if (newsVideoPreview) URL.revokeObjectURL(newsVideoPreview);
    if (editNewsVideoPreview) URL.revokeObjectURL(editNewsVideoPreview);
  }, [newsVideoPreview, editNewsVideoPreview]);

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
      if (parsed.locations) setLocations(parsed.locations);
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
    settingsDirtyRef.current = settingsDirty;
  }, [settingsDirty]);

  useEffect(() => {
    if (active !== "settings") setSettingsDirty(false);
  }, [active]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveCache({
      pending,
      approved,
      users,
      categories,
      locations,
      newsList,
      noteList,
      trending,
      settings
    });
  }, [pending, approved, users, categories, locations, newsList, noteList, trending, settings]);

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
      if (isAll || section === "dashboard" || section === "locations") {
        jobs.push(
          fetchJson(`${apiBase}/api/admin/locations`, { headers: baseHeaders }).then((data) => {
            if (Array.isArray(data)) setLocations(data);
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
              !settingsDirtyRef.current &&
              setSettings({
                heroHeading: s?.heroHeading || "",
                heroSubheading: s?.heroSubheading || "",
                heroImage: s?.heroImage || "",
                heroVideo: s?.heroVideo || "",
                heroMediaMode: s?.heroMediaMode || "image",
                popupVideo: s?.popupVideo || "",
                popupLink: s?.popupLink || "",
                popupEnabled: !!s?.popupEnabled,
                heroBg: s?.heroBg || "",
                heroBg1: s?.heroBg1 || s?.heroBg || "",
                heroBg2: s?.heroBg2 || "",
                heroBg3: s?.heroBg3 || "",
                heroBg4: s?.heroBg4 || "",
                marqueeText: s?.marqueeText || "",
                contactEmail: s?.contactEmail || "",
                banner1: s?.banner1 || "",
                banner2: s?.banner2 || "",
                banner3: s?.banner3 || "",
                banner4: s?.banner4 || "",
                homeWideAd: s?.homeWideAd || "",
                sideAd1: s?.sideAd1 || "",
                sideAd2: s?.sideAd2 || "",
                sideAd3: s?.sideAd3 || "",
                newsWideAd: s?.newsWideAd || "",
                newsSideAd1: s?.newsSideAd1 || "",
                newsSideAd2: s?.newsSideAd2 || "",
                newsSideAd3: s?.newsSideAd3 || "",
                jobsWideAd: s?.jobsWideAd || "",
                jobsSideAd1: s?.jobsSideAd1 || "",
                jobsSideAd2: s?.jobsSideAd2 || "",
                jobsSideAd3: s?.jobsSideAd3 || "",
                propertyWideAd: s?.propertyWideAd || "",
                propertySideAd1: s?.propertySideAd1 || "",
                propertySideAd2: s?.propertySideAd2 || "",
                propertySideAd3: s?.propertySideAd3 || "",
                petsWideAd: s?.petsWideAd || "",
                petsSideAd1: s?.petsSideAd1 || "",
                petsSideAd2: s?.petsSideAd2 || "",
                petsSideAd3: s?.petsSideAd3 || "",
                servicesWideAd: s?.servicesWideAd || "",
                servicesSideAd1: s?.servicesSideAd1 || "",
                servicesSideAd2: s?.servicesSideAd2 || "",
                servicesSideAd3: s?.servicesSideAd3 || ""
              })
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

  const openApproveModal = (post) => {
    setApproveTarget(post);
    setApproveExpiry("");
    setApproveOpen(true);
  };

  const approvePostWithExpiry = async () => {
    if (!approveTarget) return;
    if (approveTarget.isPaidUser && !approveExpiry) {
      pushToast("Set an expiry date for paid users.");
      return;
    }
    await withLoading(async () => {
      let approvedItem = approveTarget;
      setPending((prev) => ({
        ...prev,
        posts: prev.posts.filter((item) => item._id !== approveTarget._id)
      }));
      setApproved((prev) => ({
        ...prev,
        posts: [{ ...approvedItem, status: "approved", expiresAt: approveExpiry || approvedItem.expiresAt }, ...prev.posts]
      }));
      const res = await fetch(`${apiBase}/api/admin/posts/${approveTarget._id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ expiresAt: approveExpiry || null })
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to approve post.");
      clampPage(pending.posts.length - 1, pendingPage, setPendingPage);
      clampPage(approved.posts.length + 1, approvedPage, setApprovedPage);
      setApproveOpen(false);
      setApproveTarget(null);
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
        iconData: categoryForm.iconData,
        types: categoryForm.types || []
      };
      setCategories((prev) => [tempItem, ...prev]);
      setCategoriesPage(1);
      const formData = new FormData();
      formData.append("name", categoryForm.name);
      formData.append("description", categoryForm.description || "");
      formData.append("types", JSON.stringify(categoryForm.types || []));
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
      setCategoryForm({ name: "", description: "", iconUrl: "", iconData: "", types: [] });
      setTypeInput("");
      setCategoryFile(null);
      void loadData(active);
    }, "Category added");
  };

  const startEditUser = (user) => {
    setEditingUser(user._id);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      paid: !!user.paid,
      paidUntil: user.paidUntil ? new Date(user.paidUntil).toISOString().slice(0, 10) : ""
    });
    setUserEditOpen(true);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        paid: userForm.paid,
        paidUntil: userForm.paid ? (userForm.paidUntil ? `${userForm.paidUntil}T00:00` : null) : null
      };
      const res = await fetch(`${apiBase}/api/admin/users/${editingUser}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to update user.");
      setUsers((prev) =>
        prev.map((u) => (u._id === editingUser ? { ...u, ...payload } : u))
      );
      setUserEditOpen(false);
      setEditingUser(null);
      void loadData(active);
    }, "User updated");
  };

  const startEditCategory = (cat) => {
    setEditingCategory(cat._id);
    setCategoryForm({
      name: cat.name,
      description: cat.description || "",
      iconUrl: cat.iconUrl || "",
      iconData: cat.iconData || "",
      types: Array.isArray(cat.types) ? cat.types : []
    });
    setTypeInput("");
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
      formData.append("types", JSON.stringify(categoryForm.types || []));
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
      setCategoryForm({ name: "", description: "", iconUrl: "", iconData: "", types: [] });
      setTypeInput("");
      setCategoryFile(null);
      clampPage(categories.length, categoriesPage, setCategoriesPage);
      void loadData(active);
    }, "Category updated");
  };

  const addType = () => {
    const value = typeInput.trim();
    if (!value) return;
    setCategoryForm((prev) => {
      const next = Array.isArray(prev.types) ? prev.types.slice() : [];
      if (!next.includes(value)) next.push(value);
      return { ...prev, types: next };
    });
    setTypeInput("");
  };

  const removeType = (value) => {
    setCategoryForm((prev) => ({
      ...prev,
      types: (prev.types || []).filter((t) => t !== value)
    }));
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

  const openLabelManager = () => {
    const first = categories[0];
    if (first) {
      setLabelCategoryId(first._id);
      setLabelDraft(first.labelsByType || {});
      const types = Array.isArray(first.types) ? first.types : [];
      setLabelType(types[0] || "");
    }
    setLabelModalOpen(true);
  };

  useEffect(() => {
    if (!labelCategoryId) return;
    const selected = categories.find((cat) => cat._id === labelCategoryId);
    if (!selected) return;
    setLabelDraft(selected.labelsByType || {});
    const types = Array.isArray(selected.types) ? selected.types : [];
    if (types.length && !types.includes(labelType)) {
      setLabelType(types[0]);
    }
  }, [labelCategoryId, categories]);

  const addLabel = () => {
    const value = labelInput.trim();
    if (!value || !labelType) return;
    setLabelDraft((prev) => {
      const next = { ...prev };
      const list = Array.isArray(next[labelType]) ? next[labelType].slice() : [];
      if (!list.includes(value)) list.push(value);
      next[labelType] = list;
      return next;
    });
    setLabelInput("");
  };

  const removeLabel = (value) => {
    if (!labelType) return;
    setLabelDraft((prev) => {
      const next = { ...prev };
      next[labelType] = (next[labelType] || []).filter((item) => item !== value);
      return next;
    });
  };

  const saveLabels = async (e) => {
    e.preventDefault();
    const selected = categories.find((cat) => cat._id === labelCategoryId);
    if (!selected) return;
    await withLoading(async () => {
      const formData = new FormData();
      formData.append("name", selected.name);
      formData.append("description", selected.description || "");
      formData.append("types", JSON.stringify(selected.types || []));
      formData.append("labelsByType", JSON.stringify(labelDraft || {}));
      if (selected.iconUrl) formData.append("iconUrl", selected.iconUrl);
      const res = await fetch(`${apiBase}/api/categories/${labelCategoryId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to update labels.");
      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === labelCategoryId ? { ...cat, labelsByType: labelDraft } : cat
        )
      );
      setLabelModalOpen(false);
    }, "Labels updated");
  };

  const addLocation = async (e) => {
    e.preventDefault();
    const name = locationForm.name.trim();
    const pinCode = locationForm.pinCode.trim();
    if (!name || !pinCode) return;
    await withLoading(async () => {
      const res = await fetch(`${apiBase}/api/admin/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, pinCode })
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to add location.");
      if (data.item) setLocations((prev) => [data.item, ...prev]);
      setLocationsPage(1);
      setLocationForm({ name: "", pinCode: "" });
      void loadData(active);
    }, "Location added");
  };

  const startEditLocation = (loc) => {
    setEditingLocation(loc._id);
    setLocationForm({ name: loc.name || "", pinCode: loc.pinCode || "" });
    setLocationEditOpen(true);
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    const name = locationForm.name.trim();
    const pinCode = locationForm.pinCode.trim();
    if (!name || !pinCode) return;
    await withLoading(async () => {
      const res = await fetch(`${apiBase}/api/admin/locations/${editingLocation}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, pinCode })
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to update location.");
      setLocations((prev) =>
        prev.map((loc) => (loc._id === editingLocation ? { ...loc, name, pinCode } : loc))
      );
      setLocationEditOpen(false);
      setEditingLocation(null);
      setLocationForm({ name: "", pinCode: "" });
      void loadData(active);
    }, "Location updated");
  };

  const deleteLocation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;
    await withLoading(async () => {
      await fetch(`${apiBase}/api/admin/locations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations((prev) => prev.filter((loc) => loc._id !== id));
      clampPage(locations.length - 1, locationsPage, setLocationsPage);
      void loadData(active);
    }, "Location deleted");
  };

  const addNews = async (e) => {
    e.preventDefault();
    setStatus("");
    return await withLoading(async () => {
      const tempId = `temp-${Date.now()}`;
      const tempItem = {
        _id: tempId,
        title: newsForm.title,
        category: newsForm.category,
        description: newsForm.description1,
        description1: newsForm.description1,
        description2: newsForm.description2,
        heading2: newsForm.heading2,
        description3: newsForm.description3,
        youtubeLink: newsForm.youtubeLink,
        videoUrl: newsForm.videoUrl,
        description4: newsForm.description4,
        image: newsForm.image,
        imageData: newsForm.imageData,
        image2: newsForm.image2,
        image2Data: newsForm.image2Data,
        date: newsForm.date
      };
      setNewsList((prev) => [tempItem, ...prev]);
      setNewsPage(1);
      const formData = new FormData();
      formData.append("title", newsForm.title);
      formData.append("category", newsForm.category);
      formData.append("description1", newsForm.description1);
      formData.append("description2", newsForm.description2);
      formData.append("heading2", newsForm.heading2);
      formData.append("description3", newsForm.description3);
      formData.append("youtubeLink", newsForm.youtubeLink.trim());
      formData.append("videoUrl", newsForm.videoUrl.trim());
      formData.append("description4", newsForm.description4);
      formData.append("date", newsForm.date);
      if (newsForm.image.trim()) formData.append("image", newsForm.image.trim());
      if (newsForm.image2.trim()) formData.append("image2", newsForm.image2.trim());
      if (newsImageFile1) formData.append("image1File", newsImageFile1);
      if (newsImageFile2) formData.append("image2File", newsImageFile2);
      if (newsVideoFile) formData.append("video", newsVideoFile);
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
      setNewsForm({
        title: "",
        category: "",
        description1: "",
        description2: "",
        heading2: "",
        description3: "",
        youtubeLink: "",
        videoUrl: "",
        description4: "",
        image: "",
        imageData: "",
        image2: "",
        image2Data: "",
        date: ""
      });
      setNewsImageFile1(null);
      setNewsImageFile2(null);
      setNewsVideoFile(null);
      if (newsVideoPreview) URL.revokeObjectURL(newsVideoPreview);
      setNewsVideoPreview("");
      void loadData(active);
      return true;
    }, "News added");
  };

  const handleEditNewsImage = (file, key = "image1") => {
    if (!file) {
      if (key === "image1") {
        setEditNewsFile1(null);
        setEditNewsForm((prev) => ({ ...prev, imageData: "" }));
      } else {
        setEditNewsFile2(null);
        setEditNewsForm((prev) => ({ ...prev, image2Data: "" }));
      }
      return;
    }
    if (key === "image1") {
      setEditNewsFile1(file);
      setEditNewsForm((prev) => ({ ...prev, imageData: URL.createObjectURL(file) }));
    } else {
      setEditNewsFile2(file);
      setEditNewsForm((prev) => ({ ...prev, image2Data: URL.createObjectURL(file) }));
    }
  };

  const startEditNews = (item) => {
    setEditingNews(item._id);
    setEditNewsForm({
      title: item.title || "",
      category: item.category || "",
      description1: item.description1 || item.description || "",
      description2: item.description2 || "",
      heading2: item.heading2 || "",
      description3: item.description3 || "",
      youtubeLink: item.youtubeLink || "",
      videoUrl: item.videoUrl || "",
      description4: item.description4 || "",
      image: item.image || "",
      imageData: item.imageData || "",
      image2: item.image2 || "",
      image2Data: item.image2Data || "",
      date: item.date || ""
    });
    setEditNewsFile1(null);
    setEditNewsFile2(null);
    setEditNewsVideoFile(null);
    if (editNewsVideoPreview) URL.revokeObjectURL(editNewsVideoPreview);
    setEditNewsVideoPreview("");
    setEditNewsRemoveVideo(false);
    setEditNewsOpen(true);
  };

  const saveEditNews = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      const formData = new FormData();
      formData.append("title", editNewsForm.title);
      formData.append("category", editNewsForm.category);
      formData.append("description1", editNewsForm.description1);
      formData.append("description2", editNewsForm.description2);
      formData.append("heading2", editNewsForm.heading2);
      formData.append("description3", editNewsForm.description3);
      formData.append("youtubeLink", editNewsForm.youtubeLink.trim());
      formData.append("videoUrl", editNewsForm.videoUrl.trim());
      formData.append("removeVideo", editNewsRemoveVideo ? "1" : "0");
      formData.append("description4", editNewsForm.description4);
      formData.append("date", editNewsForm.date);
      if (editNewsForm.image.trim()) formData.append("image", editNewsForm.image.trim());
      if (editNewsForm.image2.trim()) formData.append("image2", editNewsForm.image2.trim());
      if (editNewsFile1) formData.append("image1File", editNewsFile1);
      if (editNewsFile2) formData.append("image2File", editNewsFile2);
      if (editNewsVideoFile) formData.append("video", editNewsVideoFile);
      const res = await fetch(`${apiBase}/api/news/${editingNews}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to update news.");
      setNewsList((prev) =>
        prev.map((n) => (n._id === editingNews ? { ...n, ...editNewsForm, description: editNewsForm.description1 } : n))
      );
      setEditNewsOpen(false);
      setEditingNews(null);
      setEditNewsFile1(null);
      setEditNewsFile2(null);
      setEditNewsVideoFile(null);
      if (editNewsVideoPreview) URL.revokeObjectURL(editNewsVideoPreview);
      setEditNewsVideoPreview("");
      setEditNewsRemoveVideo(false);
      void loadData(active);
    }, "News updated");
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
        serialNo: noteForm.serialNo,
        subject: noteForm.subject,
        department: noteForm.department,
        title: noteForm.title,
        summary: noteForm.summary,
        refNumber: noteForm.refNumber,
        dateOfIssue: noteForm.dateOfIssue,
        pdfFile: noteForm.pdfFile,
        pdfData: noteForm.pdfData,
        category: noteForm.department
      };
      setNoteList((prev) => [tempItem, ...prev]);
      setNotesPage(1);
      const formData = new FormData();
      formData.append("serialNo", noteForm.serialNo);
      formData.append("subject", noteForm.subject);
      formData.append("department", noteForm.department);
      formData.append("title", noteForm.title);
      formData.append("summary", noteForm.summary);
      formData.append("refNumber", noteForm.refNumber);
      formData.append("dateOfIssue", noteForm.dateOfIssue);
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
      setNoteForm({
        serialNo: "",
        subject: "",
        department: "",
        title: "",
        summary: "",
        refNumber: "",
        dateOfIssue: "",
        pdfFile: "",
        pdfData: ""
      });
      setNotePdfFile(null);
      setPdfReady(true);
      void loadData(active);
      return true;
    }, "Notification added");
  };

  const handleEditNoteFile = (file) => {
    if (!file) {
      setEditNoteFile(null);
      setEditNoteForm((prev) => ({ ...prev, pdfData: "" }));
      return;
    }
    setEditNoteFile(file);
    setEditNoteForm((prev) => ({ ...prev, pdfData: file.name }));
  };

  const startEditNotification = (item) => {
    setEditingNote(item._id);
    setEditNoteForm({
      serialNo: item.serialNo || "",
      subject: item.subject || "",
      department: item.department || item.category || "",
      title: item.title || "",
      summary: item.summary || item.description || "",
      refNumber: item.refNumber || "",
      dateOfIssue: item.dateOfIssue || item.notificationDate || "",
      pdfFile: item.pdfFile || "",
      pdfData: item.pdfData || ""
    });
    setEditNoteFile(null);
    setEditNoteOpen(true);
  };

  const saveEditNotification = async (e) => {
    e.preventDefault();
    await withLoading(async () => {
      const formData = new FormData();
      formData.append("serialNo", editNoteForm.serialNo);
      formData.append("subject", editNoteForm.subject);
      formData.append("department", editNoteForm.department);
      formData.append("title", editNoteForm.title);
      formData.append("summary", editNoteForm.summary);
      formData.append("refNumber", editNoteForm.refNumber);
      formData.append("dateOfIssue", editNoteForm.dateOfIssue);
      if (editNoteForm.pdfFile.trim()) formData.append("pdfFile", editNoteForm.pdfFile.trim());
      if (editNoteFile) formData.append("pdf", editNoteFile);
      const res = await fetch(`${apiBase}/api/notifications/${editingNote}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (data.invalid) throw new Error("API base misconfigured. Update VITE_API_BASE for production.");
      if (!res.ok) throw new Error(data.message || "Failed to update notification.");
      setNoteList((prev) =>
        prev.map((n) => (n._id === editingNote ? { ...n, ...editNoteForm } : n))
      );
      setEditNoteOpen(false);
      setEditingNote(null);
      setEditNoteFile(null);
      void loadData(active);
    }, "Notification updated");
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
    if (e?.preventDefault) e.preventDefault();
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
      setSettingsDirty(false);
      invalidateWebSettingsCache(apiBase);
      void loadData(active);
    }, "Settings updated");
  };

  const uploadSettingsImage = async (field, file) => {
    if (!file) return;
    await withLoading(async () => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${apiBase}/api/settings/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to upload image.");
      const nextUrl = data.imageUrl || "";
      if (!nextUrl) throw new Error("Upload failed: no image URL returned.");
      setSettings((prev) => ({ ...prev, [field]: nextUrl, ...(field === "heroBg1" ? { heroBg: nextUrl } : {}) }));
      setSettingsDirty(true);
    }, "Image uploaded. Save settings to apply.");
  };

  const uploadHeroVideo = async () => {
    if (!heroVideoFile) {
      pushToast("Select a video to upload.");
      return;
    }
    await withLoading(async () => {
      const formData = new FormData();
      formData.append("video", heroVideoFile);
      const res = await fetch(`${apiBase}/api/settings/hero-video`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to upload video.");
      setSettings((prev) => ({ ...prev, heroVideo: data.heroVideo || prev.heroVideo }));
      setHeroVideoFile(null);
    }, "Hero video updated");
  };

  const uploadPopupVideo = async () => {
    if (!popupVideoFile) {
      pushToast("Select a popup video to upload.");
      return;
    }
    await withLoading(async () => {
      const formData = new FormData();
      formData.append("video", popupVideoFile);
      const res = await fetch(`${apiBase}/api/settings/popup-video`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to upload popup video.");
      setSettings((prev) => ({ ...prev, popupVideo: data.popupVideo || prev.popupVideo }));
      setPopupVideoFile(null);
    }, "Popup video updated");
  };

  const handleNewsImage = (file, key = "image1") => {
    if (!file) {
      if (key === "image1") {
        setNewsImageFile1(null);
        setNewsForm((prev) => ({ ...prev, imageData: "" }));
      } else {
        setNewsImageFile2(null);
        setNewsForm((prev) => ({ ...prev, image2Data: "" }));
      }
      return;
    }
    if (key === "image1") {
      setNewsImageFile1(file);
      setNewsForm((prev) => ({ ...prev, imageData: URL.createObjectURL(file) }));
    } else {
      setNewsImageFile2(file);
      setNewsForm((prev) => ({ ...prev, image2Data: URL.createObjectURL(file) }));
    }
  };

  const handleNewsVideo = (file) => {
    if (!file) {
      setNewsVideoFile(null);
      if (newsVideoPreview) URL.revokeObjectURL(newsVideoPreview);
      setNewsVideoPreview("");
      return;
    }
    if (newsVideoPreview) URL.revokeObjectURL(newsVideoPreview);
    const preview = URL.createObjectURL(file);
    setNewsVideoFile(file);
    setNewsVideoPreview(preview);
    setNewsForm((prev) => ({ ...prev, videoUrl: "" }));
  };

  const handleEditNewsVideo = (file) => {
    if (!file) {
      setEditNewsVideoFile(null);
      if (editNewsVideoPreview) URL.revokeObjectURL(editNewsVideoPreview);
      setEditNewsVideoPreview("");
      return;
    }
    if (editNewsVideoPreview) URL.revokeObjectURL(editNewsVideoPreview);
    const preview = URL.createObjectURL(file);
    setEditNewsVideoFile(file);
    setEditNewsVideoPreview(preview);
    setEditNewsRemoveVideo(false);
    setEditNewsForm((prev) => ({ ...prev, videoUrl: "" }));
  };

  const clearEditNewsVideo = () => {
    setEditNewsVideoFile(null);
    if (editNewsVideoPreview) URL.revokeObjectURL(editNewsVideoPreview);
    setEditNewsVideoPreview("");
    setEditNewsRemoveVideo(true);
    setEditNewsForm((prev) => ({ ...prev, videoUrl: "" }));
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

  const handleEditImages = (e) => {
    const incoming = Array.from(e?.target?.files || []);
    if (!incoming.length) return;
    const existingCount = (editForm.imageUrls || []).length;
    const allowed = Math.max(0, 5 - existingCount);
    setEditImageFiles((prev) => {
      const combined = [...prev, ...incoming];
      if (combined.length > allowed) {
        setEditImageNotice("You can upload up to 5 images.");
      } else {
        setEditImageNotice("");
      }
      const trimmed = combined.slice(0, allowed);
      setEditImagePreviews(trimmed.map((file) => URL.createObjectURL(file)));
      return trimmed;
    });
    if (e?.target) {
      e.target.value = "";
    }
  };

  const removeEditExistingImage = (idx) => {
    setEditForm((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== idx)
    }));
  };

  const removeEditNewImage = (idx) => {
    const nextFiles = editImageFiles.filter((_, i) => i !== idx);
    setEditImageFiles(nextFiles);
    setEditImagePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const startEdit = async (post) => {
    setEditPost(post._id);
    setEditForm({
      title: post.title || "",
      category: post.category || "",
      type: post.type || "",
      label: post.label || "",
      paid: !!post.paid,
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
      pinCode: post.pinCode || "",
      description: post.description || "",
      contactName: post.contactName || "",
      phone: post.phone || "",
      expiresAt: post.expiresAt ? new Date(post.expiresAt).toISOString().slice(0, 16) : "",
      imageData: post.imageData || "",
      imageUrl: post.imageUrl || "",
      imageUrls: Array.isArray(post.imageUrls) && post.imageUrls.length
        ? post.imageUrls
        : (post.imageUrl ? [post.imageUrl] : []),
      userEmail: post.userEmail || ""
    });
    setEditUploader({ name: post.contactName || "", email: post.userEmail || "" });
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setEditImageNotice("");
    setEditUserDetails(null);
    setEditUserOpen(false);
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
        type: data.post.type || "",
        label: data.post.label || "",
        paid: !!data.post.paid,
        breed: data.post.breed || "",
        age: data.post.age || "",
        gender: data.post.gender || "",
        size: data.post.size || "",
        vaccinationStatus: data.post.vaccinationStatus || "",
        medicalHistory: data.post.medicalHistory || "",
        temperament: data.post.temperament || "",
        adoptionConditions: data.post.adoptionConditions || "",
        contactDetails: data.post.contactDetails || "",
        location: data.post.location || "",
        pinCode: data.post.pinCode || "",
        description: data.post.description,
        contactName: data.post.contactName || "",
        phone: data.post.phone || "",
        expiresAt: data.post.expiresAt ? new Date(data.post.expiresAt).toISOString().slice(0, 16) : "",
        imageData: data.post.imageData || "",
        imageUrl: data.post.imageUrl || "",
        imageUrls: Array.isArray(data.post.imageUrls) && data.post.imageUrls.length
          ? data.post.imageUrls
          : (data.post.imageUrl ? [data.post.imageUrl] : []),
        userEmail: data.post.userEmail || ""
      });
      setEditUploader({ name: data.user?.name || "", email: data.user?.email || "" });
      setEditUserDetails(data.user || null);
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
      formData.append("type", editForm.type || "");
      formData.append("label", editForm.label || "");
      formData.append("breed", editForm.breed || "");
      formData.append("age", editForm.age || "");
      formData.append("gender", editForm.gender || "");
      formData.append("size", editForm.size || "");
      formData.append("vaccinationStatus", editForm.vaccinationStatus || "");
      formData.append("medicalHistory", editForm.medicalHistory || "");
      formData.append("temperament", editForm.temperament || "");
      formData.append("adoptionConditions", editForm.adoptionConditions || "");
      formData.append("contactDetails", editForm.contactDetails || "");
      formData.append("location", editForm.location || "");
      formData.append("pinCode", editForm.pinCode || "");
      formData.append("description", editForm.description);
      formData.append("contactName", editForm.contactName);
      formData.append("phone", editForm.phone);
      formData.append("userEmail", editForm.userEmail || "");
      formData.append("paid", editForm.paid ? "true" : "false");
      if (editForm.expiresAt) formData.append("expiresAt", new Date(editForm.expiresAt).toISOString());
      formData.append("existingImages", JSON.stringify(editForm.imageUrls || []));
      editImageFiles.forEach((file) => formData.append("images", file));
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
          <p className="clamp-2">{item.description || item.location || item.breed || item.category}</p>
          {type === "posts" && item.isPaidUser && (
            <span className="plan-badge paid">Paid User</span>
          )}
          {item.location && <p className="muted">Location: {item.location}</p>}
          <div className="action-row">
            {pendingView && type === "posts" && (
              <button className="primary-btn" onClick={() => openApproveModal(item)}>
                Approve
              </button>
            )}
            {pendingView && type !== "posts" && (
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

  const editCategoryTypes = useMemo(() => {
    if (!editForm.category) return [];
    const match = categories.find(
      (cat) => cat.name && cat.name.toLowerCase() === editForm.category.toLowerCase()
    );
    return match && Array.isArray(match.types) ? match.types : [];
  }, [categories, editForm.category]);

  const editCategoryLabels = useMemo(() => {
    if (!editForm.category || !editForm.type) return [];
    const match = categories.find(
      (cat) => cat.name && cat.name.toLowerCase() === editForm.category.toLowerCase()
    );
    if (!match || !match.labelsByType) return [];
    const labels = match.labelsByType[editForm.type] || [];
    return Array.isArray(labels) ? labels : [];
  }, [categories, editForm.category, editForm.type]);

  const showEditPetFields = editForm.category.toLowerCase() === "pets";

  const matchesSearch = (item, query) => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return true;
    const combined = Object.values(item || {})
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => value !== null && value !== undefined)
      .map((value) => String(value).toLowerCase())
      .join(" ");
    return combined.includes(q);
  };

  const allPostsCount = approved.posts.length + pending.posts.length;
  const allUsersCount = users.length;
  const categoryCounts = categories.map((cat) => ({
    ...cat,
    count: approved.posts.filter((p) => p.category === cat.name).length
  }));
  const chartSource = trending.length ? trending : categoryCounts;

  const filteredPendingPosts = useMemo(
    () => pending.posts.filter((item) => matchesSearch(item, pendingSearch)),
    [pending.posts, pendingSearch]
  );
  const filteredApprovedPosts = useMemo(
    () => approved.posts.filter((item) => matchesSearch(item, approvedSearch)),
    [approved.posts, approvedSearch]
  );
  const filteredUsers = useMemo(
    () => users.filter((item) => matchesSearch(item, usersSearch)),
    [users, usersSearch]
  );
  const filteredCategories = useMemo(
    () => categories.filter((item) => matchesSearch(item, categoriesSearch)),
    [categories, categoriesSearch]
  );
  const filteredLocations = useMemo(
    () => locations.filter((item) => matchesSearch(item, locationsSearch)),
    [locations, locationsSearch]
  );
  const filteredNews = useMemo(
    () => newsList.filter((item) => matchesSearch(item, newsSearch)),
    [newsList, newsSearch]
  );
  const filteredNotes = useMemo(
    () => noteList.filter((item) => matchesSearch(item, notesSearch)),
    [noteList, notesSearch]
  );

  const pendingPageItems = useMemo(() => paginate(filteredPendingPosts, pendingPage), [filteredPendingPosts, pendingPage]);
  const approvedPageItems = useMemo(() => paginate(filteredApprovedPosts, approvedPage), [filteredApprovedPosts, approvedPage]);
  const usersPageItems = useMemo(() => paginate(filteredUsers, usersPage), [filteredUsers, usersPage]);
  const categoriesPageItems = useMemo(() => paginate(filteredCategories, categoriesPage), [filteredCategories, categoriesPage]);
  const locationsPageItems = useMemo(() => paginate(filteredLocations, locationsPage), [filteredLocations, locationsPage]);
  const newsPageItems = useMemo(() => paginate(filteredNews, newsPage), [filteredNews, newsPage]);
  const notesPageItems = useMemo(() => paginate(filteredNotes, notesPage), [filteredNotes, notesPage]);
  const selectedLabelCategory = categories.find((cat) => cat._id === labelCategoryId);
  const labelTypes = Array.isArray(selectedLabelCategory?.types) ? selectedLabelCategory.types : [];
  const labelList = labelType ? (labelDraft[labelType] || []) : [];

  useEffect(() => setPendingPage(1), [pendingSearch]);
  useEffect(() => setApprovedPage(1), [approvedSearch]);
  useEffect(() => setUsersPage(1), [usersSearch]);
  useEffect(() => setCategoriesPage(1), [categoriesSearch]);
  useEffect(() => setLocationsPage(1), [locationsSearch]);
  useEffect(() => setNewsPage(1), [newsSearch]);
  useEffect(() => setNotesPage(1), [notesSearch]);

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

  const renderImageSetting = (label, key, placeholder) => (
    <div className="settings-field" key={key}>
      <label className="field-label">{label}</label>
      <input
        type="text"
        placeholder={placeholder || label}
        value={settings[key] || ""}
        onChange={(e) => {
          const value = e.target.value;
          setSettings((prev) => ({ ...prev, [key]: value, ...(key === "heroBg1" ? { heroBg: value } : {}) }));
          setSettingsDirty(true);
        }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => uploadSettingsImage(key, e.target.files?.[0])}
      />
      {settings[key] && (
        <div className="settings-image-preview">
          <img src={settings[key]} alt={label} loading="lazy" />
        </div>
      )}
    </div>
  );

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
          <span className="admin-nav-icon"><img src={dashboardIcon} alt="" aria-hidden="true" /></span>
          Dashboard
        </button>
        <button className={active === "pending" ? "active" : ""} onClick={() => { setActive("pending"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={pendingIcon} alt="" aria-hidden="true" /></span>
          Pending Posts
        </button>
        <button className={active === "approved" ? "active" : ""} onClick={() => { setActive("approved"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={approvedIcon} alt="" aria-hidden="true" /></span>
          Approved Posts
        </button>
        <button className={active === "users" ? "active" : ""} onClick={() => { setActive("users"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={usersIcon} alt="" aria-hidden="true" /></span>
          Control Users
        </button>
        <button className={active === "categories" ? "active" : ""} onClick={() => { setActive("categories"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={categoriesIcon} alt="" aria-hidden="true" /></span>
          Categories
        </button>
        <button className={active === "locations" ? "active" : ""} onClick={() => { setActive("locations"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={locationsIcon} alt="" aria-hidden="true" /></span>
          Locations
        </button>
        <button className={active === "news" ? "active" : ""} onClick={() => { setActive("news"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={newsIcon} alt="" aria-hidden="true" /></span>
          Upload News
        </button>
        <button className={active === "notifications" ? "active" : ""} onClick={() => { setActive("notifications"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={notificationsIcon} alt="" aria-hidden="true" /></span>
          Notifications
        </button>
        <button className={active === "settings" ? "active" : ""} onClick={() => { setActive("settings"); setSidebarOpen(false); }}>
          <span className="admin-nav-icon"><img src={settingsIcon} alt="" aria-hidden="true" /></span>
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
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search pending posts..."
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
            />
            <h3 className="subhead">Community Posts</h3>
            {renderItems(pendingPageItems, "posts", true)}
            {renderPager(filteredPendingPosts, pendingPage, setPendingPage)}
          </section>
        )}

        {active === "approved" && (
          <section className="section">
            <div className="section-head">
              <h2>Approved Listings</h2>
            </div>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search approved posts..."
              value={approvedSearch}
              onChange={(e) => setApprovedSearch(e.target.value)}
            />
            <h3 className="subhead">Community Posts</h3>
            {renderItems(approvedPageItems, "posts", false)}
            {renderPager(filteredApprovedPosts, approvedPage, setApprovedPage)}
          </section>
        )}

        {editOpen && (
          <div className="modal-overlay" onClick={() => setEditOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit Approved Post</h3>
                <div className="modal-actions">
                  <button className="ghost-btn" onClick={() => setEditUserOpen((v) => !v)}>
                    Settings
                  </button>
                  <button className="ghost-btn" onClick={() => setEditOpen(false)}>Close</button>
                </div>
              </div>
              {editLoading && <p className="muted">Loading details...</p>}
              <p className="muted">Uploaded by: {editUploader.name} ({editUploader.email})</p>
              {editUserOpen && (
                <div className="user-settings-card">
                  <div>
                    <h4>User Details</h4>
                    <p className="muted">Name: {editUserDetails?.name || "N/A"}</p>
                    <p className="muted">Email: {editUserDetails?.email || editForm.userEmail || "N/A"}</p>
                    <p className="muted">Contact Name: {editForm.contactName || "N/A"}</p>
                    <p className="muted">Phone: {editForm.phone || "N/A"}</p>
                  </div>
                  <div className="plan-summary">
                    <h4>Plan</h4>
                    <span className={`plan-badge ${editUserDetails?.paid ? "paid" : "free"}`}>
                      {editUserDetails?.paid ? "Paid Plan" : "Free Plan"}
                    </span>
                    <p className="muted">
                      Paid Until: {editUserDetails?.paidUntil ? new Date(editUserDetails.paidUntil).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="muted">
                      Post Expiry: {editForm.expiresAt ? new Date(editForm.expiresAt).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                </div>
              )}
              <form className="form-card" onSubmit={saveEdit}>
                <label className="field-label">Plan Type</label>
                <select
                  value={editForm.paid ? "paid" : "free"}
                  onChange={(e) => setEditForm({ ...editForm, paid: e.target.value === "paid" })}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                <input
                  type="text"
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value, type: "" })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {editCategoryTypes.length > 0 && (
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value, label: "" })}
                  >
                    <option value="">Select Type</option>
                    {editCategoryTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                )}
                {editCategoryLabels.length > 0 && (
                  <select
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  >
                    <option value="">Select Label</option>
                    {editCategoryLabels.map((label) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
                )}
                {showEditPetFields && (
                  <>
                    <input
                      type="text"
                      placeholder="Breed"
                      value={editForm.breed}
                      onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Age"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Gender"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Size"
                      value={editForm.size}
                      onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Vaccination Status"
                      value={editForm.vaccinationStatus}
                      onChange={(e) => setEditForm({ ...editForm, vaccinationStatus: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Medical History"
                      value={editForm.medicalHistory}
                      onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Temperament"
                      value={editForm.temperament}
                      onChange={(e) => setEditForm({ ...editForm, temperament: e.target.value })}
                    />
                  </>
                )}
                <textarea
                  rows="3"
                  placeholder="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                />
                <div className="location-field">
                  <input
                    type="text"
                    list="admin-location-options"
                    placeholder="Select Location"
                    value={editForm.location}
                    onChange={(e) => {
                      const value = e.target.value;
                      const match = locations.find(
                        (loc) => loc.name && loc.name.toLowerCase() === value.toLowerCase()
                      );
                      setEditForm({ ...editForm, location: value, pinCode: match?.pinCode || "" });
                    }}
                    required
                  />
                  <datalist id="admin-location-options">
                    {locations.map((loc) => (
                      <option key={loc._id || loc.name} value={loc.name} />
                    ))}
                  </datalist>
                </div>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={editForm.pinCode}
                  readOnly
                />
                {showEditPetFields && (
                  <>
                    <input
                      type="text"
                      placeholder="Adoption Conditions"
                      value={editForm.adoptionConditions}
                      onChange={(e) => setEditForm({ ...editForm, adoptionConditions: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Contact Details"
                      value={editForm.contactDetails}
                      onChange={(e) => setEditForm({ ...editForm, contactDetails: e.target.value })}
                    />
                  </>
                )}
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
                <label className="field-label">Expire Date</label>
                <input
                  type="date"
                  value={editForm.expiresAt ? editForm.expiresAt.split("T")[0] : ""}
                  onChange={(e) => {
                    const next = e.target.value ? `${e.target.value}T00:00` : "";
                    setEditForm({ ...editForm, expiresAt: next });
                  }}
                />
                <label className="field-label">Upload Images (max 5)</label>
                <input
                  type="file"
                  accept="image/*"
                  name="images"
                  multiple
                  onChange={handleEditImages}
                />
                <small className="muted">Selected: {(editForm.imageUrls || []).length + editImagePreviews.length}/5</small>
                {editImageNotice && <small className="error">{editImageNotice}</small>}
                <small className="muted">Tip: Use Ctrl/Shift to select multiple images.</small>
                {Array.isArray(editForm.imageUrls) && editForm.imageUrls.length > 0 && (
                  <div className="image-preview-grid">
                    {editForm.imageUrls.map((src, idx) => (
                      <div key={`${src}-${idx}`} className="image-preview-item">
                        <img className="preview-image" src={src} alt={`Existing ${idx + 1}`} />
                        <button type="button" className="ghost-btn" onClick={() => removeEditExistingImage(idx)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editImagePreviews.length > 0 && (
                  <div className="image-preview-grid">
                    {editImagePreviews.map((src, idx) => (
                      <div key={`${src}-${idx}`} className="image-preview-item">
                        <img className="preview-image" src={src} alt={`Preview ${idx + 1}`} />
                        <button type="button" className="ghost-btn" onClick={() => removeEditNewImage(idx)}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
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
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search users by name or email..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
            />
            <div className="grid">
              {usersPageItems.map((user) => (
                <div key={user._id} className="card">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => startEditUser(user)}>
                      Edit
                    </button>
                    <button className="ghost-btn" onClick={() => removeUser(user._id)}>
                      Remove User
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(filteredUsers, usersPage, setUsersPage)}
          </section>
        )}

        {userEditOpen && (
          <div className="modal-overlay" onClick={() => setUserEditOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit User</h3>
                <button className="ghost-btn" onClick={() => setUserEditOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={saveUser}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
                <label className="field-label">Plan Type</label>
                <select
                  value={userForm.paid ? "paid" : "free"}
                  onChange={(e) => setUserForm({ ...userForm, paid: e.target.value === "paid" })}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                {userForm.paid && (
                  <>
                    <label className="field-label">Plan Expiry Date</label>
                    <input
                      type="date"
                      value={userForm.paidUntil}
                      onChange={(e) => setUserForm({ ...userForm, paidUntil: e.target.value })}
                      required
                    />
                  </>
                )}
                <button className="primary-btn" type="submit">Save Changes</button>
              </form>
            </div>
          </div>
        )}

        {active === "categories" && (
          <section className="section">
            <div className="section-head">
              <h2>Category Manager</h2>
              <div className="action-row">
                <button className="ghost-btn" onClick={openLabelManager}>Manage Labels</button>
                <button className="primary-btn" onClick={() => setCategoryOpen(true)}>Add Category</button>
              </div>
            </div>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search categories..."
              value={categoriesSearch}
              onChange={(e) => setCategoriesSearch(e.target.value)}
            />
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
            {renderPager(filteredCategories, categoriesPage, setCategoriesPage)}
          </section>
        )}

        {active === "locations" && (
          <section className="section">
            <div className="section-head">
              <h2>Location Manager</h2>
            </div>
            <form className="form-card" onSubmit={addLocation}>
              <input
                type="text"
                placeholder="Location Name"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Pincode"
                value={locationForm.pinCode}
                onChange={(e) => setLocationForm({ ...locationForm, pinCode: e.target.value })}
                required
              />
              <button className="primary-btn" type="submit">Add Location</button>
            </form>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search locations by name or pincode..."
              value={locationsSearch}
              onChange={(e) => setLocationsSearch(e.target.value)}
            />
            <div className="grid">
              {locationsPageItems.map((loc) => (
                <div key={loc._id} className="card">
                  <h4>{loc.name}</h4>
                  {loc.pinCode && <p className="muted">Pincode: {loc.pinCode}</p>}
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => startEditLocation(loc)}>Edit</button>
                    <button className="ghost-btn" onClick={() => deleteLocation(loc._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(filteredLocations, locationsPage, setLocationsPage)}
          </section>
        )}

        {locationEditOpen && (
          <div className="modal-overlay" onClick={() => setLocationEditOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit Location</h3>
                <button className="ghost-btn" onClick={() => setLocationEditOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={saveLocation}>
                <input
                  type="text"
                  placeholder="Location Name"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={locationForm.pinCode}
                  onChange={(e) => setLocationForm({ ...locationForm, pinCode: e.target.value })}
                  required
                />
                <button className="primary-btn" type="submit">Save Location</button>
              </form>
            </div>
          </div>
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
                <div className="type-row">
                  <input
                    type="text"
                    placeholder="Add Type (e.g., Dog)"
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addType();
                      }
                    }}
                  />
                  <button className="ghost-btn" type="button" onClick={addType}>+</button>
                </div>
                {categoryForm.types && categoryForm.types.length > 0 && (
                  <div className="type-list">
                    {categoryForm.types.map((type) => (
                      <div key={type} className="type-chip">
                        <span>{type}</span>
                        <button type="button" onClick={() => removeType(type)}>x</button>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className="type-row">
                  <input
                    type="text"
                    placeholder="Add Type (e.g., Dog)"
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addType();
                      }
                    }}
                  />
                  <button className="ghost-btn" type="button" onClick={addType}>+</button>
                </div>
                {categoryForm.types && categoryForm.types.length > 0 && (
                  <div className="type-list">
                    {categoryForm.types.map((type) => (
                      <div key={type} className="type-chip">
                        <span>{type}</span>
                        <button type="button" onClick={() => removeType(type)}>x</button>
                      </div>
                    ))}
                  </div>
                )}
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
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search news by title, category, or description..."
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
            />
            <div className="grid">
              {newsPageItems.map((item) => (
                <div key={item._id} className="card">
                  <h4>{item.title}</h4>
                  <p>{item.category}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => startEditNews(item)}>Edit</button>
                    <button className="ghost-btn" onClick={() => deleteNews(item._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(filteredNews, newsPage, setNewsPage)}
          </section>
        )}

        {newsOpen && (
          <div className="modal-overlay" onClick={() => setNewsOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Add News</h3>
                <button className="ghost-btn" onClick={() => setNewsOpen(false)}>Close</button>
              </div>
              <form
                className="form-card"
                onSubmit={async (e) => {
                  const ok = await addNews(e);
                  if (ok) setNewsOpen(false);
                }}
              >
                <input
                  type="text"
                  placeholder="Heading"
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
                  placeholder="Description 1"
                  value={newsForm.description1}
                  onChange={(e) => setNewsForm({ ...newsForm, description1: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Description 2"
                  value={newsForm.description2}
                  onChange={(e) => setNewsForm({ ...newsForm, description2: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Heading 2"
                  value={newsForm.heading2}
                  onChange={(e) => setNewsForm({ ...newsForm, heading2: e.target.value })}
                />
                <textarea
                  rows="3"
                  placeholder="Description 3"
                  value={newsForm.description3}
                  onChange={(e) => setNewsForm({ ...newsForm, description3: e.target.value })}
                />
                <input
                  type="url"
                  placeholder="YouTube Video Link (optional)"
                  value={newsForm.youtubeLink}
                  onChange={(e) => setNewsForm({ ...newsForm, youtubeLink: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Video URL (optional)"
                  value={newsForm.videoUrl}
                  onChange={(e) => {
                    setNewsVideoFile(null);
                    setNewsForm({ ...newsForm, videoUrl: e.target.value });
                  }}
                />
                {!newsVideoFile && (
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleNewsVideo(e.target.files[0])}
                  />
                )}
                {(newsVideoPreview || newsForm.videoUrl) && (
                  <video className="preview-video" controls src={newsVideoPreview || newsForm.videoUrl} />
                )}
                {newsVideoFile && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleNewsVideo(null)}
                  >
                    Remove Uploaded Video
                  </button>
                )}
                <textarea
                  rows="3"
                  placeholder="Description 4"
                  value={newsForm.description4}
                  onChange={(e) => setNewsForm({ ...newsForm, description4: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Image URL 1 (Main)"
                  value={newsForm.image}
                  onChange={(e) => {
                    setNewsImageFile1(null);
                    setNewsForm({ ...newsForm, image: e.target.value, imageData: "" });
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNewsImage(e.target.files[0], "image1")}
                />
                {(newsForm.imageData || newsForm.image) && (
                  <img className="preview-image" src={newsForm.imageData || newsForm.image} alt="Main news preview" />
                )}
                <input
                  type="text"
                  placeholder="Image URL 2"
                  value={newsForm.image2}
                  onChange={(e) => {
                    setNewsImageFile2(null);
                    setNewsForm({ ...newsForm, image2: e.target.value, image2Data: "" });
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNewsImage(e.target.files[0], "image2")}
                />
                {(newsForm.image2Data || newsForm.image2) && (
                  <img className="preview-image" src={newsForm.image2Data || newsForm.image2} alt="Secondary news preview" />
                )}
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

        {labelModalOpen && (
          <div className="modal-overlay" onClick={() => setLabelModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Manage Labels</h3>
                <button className="ghost-btn" onClick={() => setLabelModalOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={saveLabels}>
                <label className="field-label">Select Category</label>
                <select
                  value={labelCategoryId}
                  onChange={(e) => setLabelCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <label className="field-label">Select Type</label>
                <select
                  value={labelType}
                  onChange={(e) => setLabelType(e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  {labelTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="type-row">
                  <input
                    type="text"
                    placeholder="Add Label"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLabel();
                      }
                    }}
                  />
                  <button className="ghost-btn" type="button" onClick={addLabel}>+</button>
                </div>
                {labelList.length > 0 && (
                  <div className="type-list">
                    {labelList.map((label) => (
                      <div key={label} className="type-chip">
                        <span>{label}</span>
                        <button type="button" onClick={() => removeLabel(label)}>x</button>
                      </div>
                    ))}
                  </div>
                )}
                <button className="primary-btn" type="submit">Save Labels</button>
              </form>
            </div>
          </div>
        )}

        {approveOpen && (
          <div className="modal-overlay" onClick={() => setApproveOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Approve Post</h3>
                <button className="ghost-btn" onClick={() => setApproveOpen(false)}>Close</button>
              </div>
              <p className="muted">
                {approveTarget?.isPaidUser ? "Paid user: set expiry date before approval." : "Free user: expires in 30 days automatically."}
              </p>
              {approveTarget?.isPaidUser && (
                <input
                  type="date"
                  className="date-input"
                  value={approveExpiry}
                  onChange={(e) => setApproveExpiry(e.target.value)}
                  required
                />
              )}
              <button className="primary-btn" onClick={approvePostWithExpiry}>Confirm Approval</button>
            </div>
          </div>
        )}

        {editNewsOpen && (
          <div className="modal-overlay" onClick={() => setEditNewsOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit News</h3>
                <button className="ghost-btn" onClick={() => setEditNewsOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={saveEditNews}>
                <input
                  type="text"
                  placeholder="Title"
                  value={editNewsForm.title}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, title: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={editNewsForm.category}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, category: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Description 1"
                  value={editNewsForm.description1}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, description1: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Description 2"
                  value={editNewsForm.description2}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, description2: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Heading 2"
                  value={editNewsForm.heading2}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, heading2: e.target.value })}
                />
                <textarea
                  rows="3"
                  placeholder="Description 3"
                  value={editNewsForm.description3}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, description3: e.target.value })}
                />
                <input
                  type="url"
                  placeholder="YouTube Video Link (optional)"
                  value={editNewsForm.youtubeLink}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, youtubeLink: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Video URL (optional)"
                  value={editNewsForm.videoUrl}
                  onChange={(e) => {
                    setEditNewsVideoFile(null);
                    setEditNewsRemoveVideo(false);
                    setEditNewsForm({ ...editNewsForm, videoUrl: e.target.value });
                  }}
                />
                {!editNewsVideoFile && (
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleEditNewsVideo(e.target.files[0])}
                  />
                )}
                {(editNewsVideoPreview || editNewsForm.videoUrl) && (
                  <video
                    className="preview-video"
                    controls
                    src={editNewsVideoPreview || editNewsForm.videoUrl}
                  />
                )}
                {(editNewsVideoFile || editNewsForm.videoUrl) && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={clearEditNewsVideo}
                  >
                    Remove Video
                  </button>
                )}
                <textarea
                  rows="3"
                  placeholder="Description 4"
                  value={editNewsForm.description4}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, description4: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Image URL 1 (Main)"
                  value={editNewsForm.image}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, image: e.target.value, imageData: "" })}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditNewsImage(e.target.files[0], "image1")}
                />
                {(editNewsForm.imageData || editNewsForm.image) && (
                  <img className="preview-image" src={editNewsForm.imageData || editNewsForm.image} alt="Preview" />
                )}
                <input
                  type="text"
                  placeholder="Image URL 2"
                  value={editNewsForm.image2}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, image2: e.target.value, image2Data: "" })}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditNewsImage(e.target.files[0], "image2")}
                />
                {(editNewsForm.image2Data || editNewsForm.image2) && (
                  <img className="preview-image" src={editNewsForm.image2Data || editNewsForm.image2} alt="Secondary preview" />
                )}
                <input
                  type="date"
                  value={editNewsForm.date}
                  onChange={(e) => setEditNewsForm({ ...editNewsForm, date: e.target.value })}
                  required
                />
                <button className="primary-btn" type="submit">Save Changes</button>
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
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search notifications by title, department, summary, ref no..."
              value={notesSearch}
              onChange={(e) => setNotesSearch(e.target.value)}
            />
            <div className="grid">
              {notesPageItems.map((item) => (
                <div key={item._id} className="card">
                  <h4>{item.title}</h4>
                  <p>{item.department || item.category}</p>
                  <p className="muted">{item.dateOfIssue || item.notificationDate}</p>
                  <div className="action-row">
                    <button className="ghost-btn" onClick={() => startEditNotification(item)}>Edit</button>
                    <button className="ghost-btn" onClick={() => deleteNotification(item._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {renderPager(filteredNotes, notesPage, setNotesPage)}
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
                  placeholder="Serial No"
                  value={noteForm.serialNo}
                  onChange={(e) => setNoteForm({ ...noteForm, serialNo: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={noteForm.subject}
                  onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={noteForm.department}
                  onChange={(e) => setNoteForm({ ...noteForm, department: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Summary"
                  value={noteForm.summary}
                  onChange={(e) => setNoteForm({ ...noteForm, summary: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Ref Number"
                  value={noteForm.refNumber}
                  onChange={(e) => setNoteForm({ ...noteForm, refNumber: e.target.value })}
                  required
                />
                <label className="field-label">Date of Issue</label>
                <input
                  type="date"
                  value={noteForm.dateOfIssue}
                  onChange={(e) => setNoteForm({ ...noteForm, dateOfIssue: e.target.value })}
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
                <button className="primary-btn" type="submit">Add Notification</button>
              </form>
            </div>
          </div>
        )}

        {editNoteOpen && (
          <div className="modal-overlay" onClick={() => setEditNoteOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit Notification</h3>
                <button className="ghost-btn" onClick={() => setEditNoteOpen(false)}>Close</button>
              </div>
              <form className="form-card" onSubmit={saveEditNotification}>
                <input
                  type="text"
                  placeholder="Serial No"
                  value={editNoteForm.serialNo}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, serialNo: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={editNoteForm.subject}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, subject: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={editNoteForm.department}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, department: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={editNoteForm.title}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, title: e.target.value })}
                  required
                />
                <textarea
                  rows="3"
                  placeholder="Summary"
                  value={editNoteForm.summary}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, summary: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Ref Number"
                  value={editNoteForm.refNumber}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, refNumber: e.target.value })}
                  required
                />
                <label className="field-label">Date of Issue</label>
                <input
                  type="date"
                  value={editNoteForm.dateOfIssue}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, dateOfIssue: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="PDF URL"
                  value={editNoteForm.pdfFile}
                  onChange={(e) => setEditNoteForm({ ...editNoteForm, pdfFile: e.target.value, pdfData: "" })}
                />
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleEditNoteFile(e.target.files[0])}
                />
                <button className="primary-btn" type="submit">Save Changes</button>
              </form>
            </div>
          </div>
        )}

        {active === "settings" && (
          <section className="section settings-page-section">
            <div className="section-head">
              <h2>Web Settings</h2>
            </div>
            <div className="settings-layout">
              <aside className="settings-nav">
                <button className={settingsTab === "home" ? "active" : ""} onClick={() => setSettingsTab("home")}>Home Page <span>{">"}</span></button>
                <button className={settingsTab === "news" ? "active" : ""} onClick={() => setSettingsTab("news")}>News Ads <span>{">"}</span></button>
                <button className={settingsTab === "jobs" ? "active" : ""} onClick={() => setSettingsTab("jobs")}>Jobs Ads <span>{">"}</span></button>
                <button className={settingsTab === "property" ? "active" : ""} onClick={() => setSettingsTab("property")}>Property Ads <span>{">"}</span></button>
                <button className={settingsTab === "pets" ? "active" : ""} onClick={() => setSettingsTab("pets")}>Pets Ads <span>{">"}</span></button>
                <button className={settingsTab === "services" ? "active" : ""} onClick={() => setSettingsTab("services")}>Services Ads <span>{">"}</span></button>
                <button className={settingsTab === "banners" ? "active" : ""} onClick={() => setSettingsTab("banners")}>Banners Ads <span>{">"}</span></button>
              </aside>

              <div className="settings-panel form-card" onChangeCapture={() => setSettingsDirty(true)}>
                {settingsTab === "home" && (
                  <>
                    <h3>Home Page</h3>
                    <label className="field-label">Hero Heading</label>
                    <input type="text" value={settings.heroHeading} onChange={(e) => setSettings({ ...settings, heroHeading: e.target.value })} />
                    <label className="field-label">Hero Subheading</label>
                    <textarea rows="2" value={settings.heroSubheading} onChange={(e) => setSettings({ ...settings, heroSubheading: e.target.value })} />

                    {renderImageSetting("Hero Background Image URL 1", "heroBg1", "Hero Background Image URL 1")}
                    {renderImageSetting("Hero Background Image URL 2", "heroBg2", "Hero Background Image URL 2")}
                    {renderImageSetting("Hero Background Image URL 3", "heroBg3", "Hero Background Image URL 3")}
                    {renderImageSetting("Hero Background Image URL 4", "heroBg4", "Hero Background Image URL 4")}
                    {renderImageSetting("Hero Foreground Image URL", "heroImage", "Hero Foreground Image URL")}

                    <label className="field-label">Hero Media Mode</label>
                    <div className="toggle-row">
                      <label className="toggle-option"><input type="radio" name="heroMediaMode" value="image" checked={settings.heroMediaMode === "image"} onChange={() => setSettings({ ...settings, heroMediaMode: "image" })} />Photo</label>
                      <label className="toggle-option"><input type="radio" name="heroMediaMode" value="video" checked={settings.heroMediaMode === "video"} onChange={() => setSettings({ ...settings, heroMediaMode: "video" })} />Video</label>
                    </div>

                    <label className="field-label">Upload Hero Video (converts to WebM)</label>
                    <input type="file" accept="video/*" onChange={(e) => setHeroVideoFile(e.target.files[0])} />
                    <button type="button" className="primary-btn" onClick={uploadHeroVideo}>Upload Video</button>
                    {settings.heroVideo && <div className="media-preview"><video src={settings.heroVideo} controls muted /></div>}

                    <label className="field-label">Popup Video Enable</label>
                    <label className="toggle-option"><input type="checkbox" checked={!!settings.popupEnabled} onChange={(e) => setSettings({ ...settings, popupEnabled: e.target.checked })} /><span>Show popup video on homepage</span></label>
                    <label className="field-label">Popup Read More Link</label>
                    <input type="text" value={settings.popupLink} onChange={(e) => setSettings({ ...settings, popupLink: e.target.value })} />
                    <label className="field-label">Upload Popup Video (converts to WebM)</label>
                    <input type="file" accept="video/*" onChange={(e) => setPopupVideoFile(e.target.files[0])} />
                    <button type="button" className="primary-btn" onClick={uploadPopupVideo}>Upload Popup Video</button>
                    {settings.popupVideo && <div className="media-preview"><video src={settings.popupVideo} controls muted /></div>}

                    <label className="field-label">Header Marquee Text</label>
                    <textarea rows="3" value={settings.marqueeText} onChange={(e) => setSettings({ ...settings, marqueeText: e.target.value })} />
                    <label className="field-label">Support / Contact Email</label>
                    <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />

                    {renderImageSetting("Home Wide Banner Ad URL (Home: above latest news section)", "homeWideAd")}
                    {renderImageSetting("Banner Ad Side 1 URL (Home: right side square)", "sideAd1")}
                    {renderImageSetting("Banner Ad Side 2 URL (Home: right side square)", "sideAd2")}
                    {renderImageSetting("Banner Ad Side 3 URL (Home: right side square)", "sideAd3")}
                    <button className="primary-btn" type="button" onClick={saveSettings}>Save Home Settings</button>
                  </>
                )}

                {settingsTab === "news" && (
                  <>
                    <h3>News Page Ads</h3>
                    {renderImageSetting("News Wide Banner Ad URL", "newsWideAd")}
                    {renderImageSetting("News Side Ad 1 URL", "newsSideAd1")}
                    {renderImageSetting("News Side Ad 2 URL", "newsSideAd2")}
                    {renderImageSetting("News Side Ad 3 URL", "newsSideAd3")}
                    <button className="primary-btn" type="button" onClick={saveSettings}>Save News Settings</button>
                  </>
                )}

                {settingsTab === "jobs" && (
                  <>
                    <h3>Jobs Category Ads</h3>
                    {renderImageSetting("Jobs Wide Banner Ad URL", "jobsWideAd")}
                    {renderImageSetting("Jobs Side Ad 1 URL", "jobsSideAd1")}
                    {renderImageSetting("Jobs Side Ad 2 URL", "jobsSideAd2")}
                    {renderImageSetting("Jobs Side Ad 3 URL", "jobsSideAd3")}
                    <button className="primary-btn" type="button" onClick={saveSettings}>Save Jobs Settings</button>
                  </>
                )}

                {settingsTab === "property" && (
                  <>
                    <h3>Property Category Ads</h3>
                    {renderImageSetting("Property Wide Banner Ad URL", "propertyWideAd")}
                    {renderImageSetting("Property Side Ad 1 URL", "propertySideAd1")}
                    {renderImageSetting("Property Side Ad 2 URL", "propertySideAd2")}
                    {renderImageSetting("Property Side Ad 3 URL", "propertySideAd3")}
                    <button className="primary-btn" type="button" onClick={saveSettings}>Save Property Settings</button>
                  </>
                )}

                {settingsTab === "pets" && (
                  <>
                    <h3>Pets Category Ads</h3>
                    {renderImageSetting("Pets Wide Banner Ad URL", "petsWideAd")}
                    {renderImageSetting("Pets Side Ad 1 URL", "petsSideAd1")}
                    {renderImageSetting("Pets Side Ad 2 URL", "petsSideAd2")}
                    {renderImageSetting("Pets Side Ad 3 URL", "petsSideAd3")}
                    <button className="primary-btn" type="button" onClick={saveSettings}>Save Pets Settings</button>
                  </>
                )}

                {settingsTab === "services" && (
                  <>
                    <h3>Services Category Ads</h3>
                    {renderImageSetting("Services Wide Banner Ad URL", "servicesWideAd")}
                    {renderImageSetting("Services Side Ad 1 URL", "servicesSideAd1")}
                    {renderImageSetting("Services Side Ad 2 URL", "servicesSideAd2")}
                    {renderImageSetting("Services Side Ad 3 URL", "servicesSideAd3")}
                    <button className="primary-btn" type="button" onClick={saveSettings}>Save Services Settings</button>
                  </>
                )}

                {settingsTab === "banners" && (
                  <>
                    <h3>Banners Ads</h3>
                    {renderImageSetting("Banner 1 Image URL (Home: below Categories)", "banner1")}
                    {renderImageSetting("Banner 2 Image URL (News page)", "banner2")}
                    {renderImageSetting("Banner 3 Image URL (Community Posts page)", "banner3")}
                    {renderImageSetting("Banner 4 Image URL (Government Notifications page)", "banner4")}
                    <button className="primary-btn" type="button" onClick={saveSettings}>Save Banner Settings</button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

export default AdminPanel;

