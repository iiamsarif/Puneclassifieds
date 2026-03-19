const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");
const { spawn } = require("child_process");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "community_portal";
const jwtSecret = process.env.JWT_SECRET || "secret";
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_SQHLLEV5FDWHor";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "bocNb5CJgijW795LHBuytf6w";
const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
};
const parseTypes = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
};

const parseLabelsMap = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const defaultLocations = [
  "Agarkar Nagar",
  "Camp",
  "Bajirao Road",
  "Nana Peth",
  "Khadki",
  "Deccan Gymkhana",
  "Shivajinagar",
  "Ganeshkhind",
  "Aundh",
  "Pimpri Colony",
  "Kalewadi",
  "Chinchwad East",
  "Bhosari",
  "Sangvi",
  "Kothrud",
  "Bhusari Colony",
  "Akurdi",
  "Baner",
  "PCNT",
  "Yamunanagar",
  "Hadapsar",
  "Bibvewadi",
  "Market Yard",
  "Wanowarie",
  "Vadgaon Budruk",
  "Dhankawadi",
  "Ambegaon BK",
  "Wakad",
  "Anandnagar",
  "Dehu Road",
  "Khadakwasla",
  "Chakan"
];

const client = new MongoClient(uri);
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = (file.originalname || "file").replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  }
});
const pdfUpload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });
const videoUpload = multer({ storage, limits: { fileSize: 150 * 1024 * 1024 } });
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const maybePdfSingle = (field) => (req, res, next) => {
  if (req.is("multipart/form-data")) {
    return pdfUpload.single(field)(req, res, next);
  }
  return next();
};
const maybeVideoSingle = (field) => (req, res, next) => {
  if (req.is("multipart/form-data")) {
    return videoUpload.single(field)(req, res, next);
  }
  return next();
};
const maybeImageSingle = (field) => (req, res, next) => {
  if (req.is("multipart/form-data")) {
    return imageUpload.single(field)(req, res, next);
  }
  return next();
};
const maybeImageArray = (field, max) => (req, res, next) => {
  if (req.is("multipart/form-data")) {
    return imageUpload.array(field, max)(req, res, next);
  }
  return next();
};
const fileUrl = (req, file) =>
  file ? `${req.protocol}://${req.get("host")}/uploads/${file.filename}` : "";
const saveWebpImage = async (req, file) => {
  if (!file || !file.buffer) return "";
  const baseName = (path.parse(file.originalname || "image").name || "image").replace(/\s+/g, "-");
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}.webp`;
  const outputPath = path.join(uploadDir, filename);
  await sharp(file.buffer).webp({ quality: 95 }).toFile(outputPath);
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
};
const convertVideoToWebm = (inputPath) =>
  new Promise((resolve, reject) => {
    const outputName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webm`;
    const outputPath = path.join(uploadDir, outputName);
    const args = [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libvpx-vp9",
      "-lossless",
      "1",
      "-c:a",
      "libopus",
      outputPath
    ];
    const ffmpeg = spawn("ffmpeg", args);
    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    ffmpeg.on("error", (err) => {
      reject(err);
    });
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(stderr || "Video conversion failed"));
      }
    });
  });
const getUploadPath = (url) => {
  if (!url || typeof url !== "string" || !url.includes("/uploads/")) return null;
  try {
    const pathname = new URL(url).pathname || "";
    if (!pathname.includes("/uploads/")) return null;
    const rel = pathname.split("/uploads/")[1];
    return rel ? path.join(uploadDir, rel) : null;
  } catch {
    const rel = url.split("/uploads/")[1];
    return rel ? path.join(uploadDir, rel) : null;
  }
};
const deleteUpload = async (url) => {
  const filePath = getUploadPath(url);
  if (!filePath || !fs.existsSync(filePath)) return;
  await fs.promises.unlink(filePath).catch(() => {});
};
let isConnected = false;

app.use("/uploads", express.static(uploadDir));

const getDb = async () => {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return client.db(dbName);
};

const ensureLocations = async (db) => {
  if (!defaultLocations.length) return;
  const existing = await db
    .collection("locations")
    .find({ name: { $in: defaultLocations } })
    .toArray();
  const existingNames = new Set(existing.map((item) => item.name));
  const payload = defaultLocations
    .filter((name) => !existingNames.has(name))
    .map((name) => ({ name, createdAt: new Date() }));
  if (payload.length) {
    await db.collection("locations").insertMany(payload);
  }
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  const db = await getDb();
  const existing = await db.collection("users").find({ email }).toArray();
  if (existing.length) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const hash = await bcrypt.hash(password, 10);
  await db.collection("users").insertOne({
    name,
    email,
    password: hash,
    paid: false,
    paidUntil: null,
    createdAt: new Date()
  });
  return res.json({ message: "Signup successful" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing credentials" });
  const db = await getDb();
  const users = await db.collection("users").find({ email }).toArray();
  const user = users[0];
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });
  const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: "7d" });
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      paid: !!user.paid,
      paidUntil: user.paidUntil || null
    }
  });
});

app.post("/api/admin/login", async (req, res) => {
  const { adminId, password } = req.body;
  if (adminId !== process.env.ADMIN_ID || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
  const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "12h" });
  return res.json({ token });
});

const createListing = (collection) => async (req, res) => {
  const payload = { ...req.body, status: "pending", createdAt: new Date(), userId: req.user.id };
  const db = await getDb();
  await db.collection(collection).insertOne(payload);
  return res.json({ message: "Submitted" });
};

const listItems = (collection) => async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  const db = await getDb();
  const items = await db.collection(collection).find(query).sort({ createdAt: -1 }).toArray();
  return res.json(items);
};

const approveItem = (collection) => async (req, res) => {
  const db = await getDb();
  await db.collection(collection).updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { status: "approved", approvedAt: new Date() } }
  );
  return res.json({ message: "Approved" });
};

const deleteItem = (collection) => async (req, res) => {
  const db = await getDb();
  await db.collection(collection).deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "Deleted" });
};

app.get("/api/jobs", listItems("jobs"));
app.post("/api/jobs", authMiddleware, createListing("jobs"));
app.put("/api/jobs/:id/approve", adminMiddleware, approveItem("jobs"));
app.delete("/api/jobs/:id", adminMiddleware, deleteItem("jobs"));

app.get("/api/properties", listItems("properties"));
app.post("/api/properties", authMiddleware, createListing("properties"));
app.put("/api/properties/:id/approve", adminMiddleware, approveItem("properties"));
app.delete("/api/properties/:id", adminMiddleware, deleteItem("properties"));

app.get("/api/pets", listItems("pets"));
app.post("/api/pets", authMiddleware, createListing("pets"));
app.put("/api/pets/:id/approve", adminMiddleware, approveItem("pets"));
app.delete("/api/pets/:id", adminMiddleware, deleteItem("pets"));

app.get("/api/news", listItems("news"));
app.post("/api/news", adminMiddleware, maybeImageSingle("image"), async (req, res) => {
  const db = await getDb();
  const imageUrl = (await saveWebpImage(req, req.file)) || (req.body.image || "");
  const payload = {
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    image: imageUrl || "",
    imageData: imageUrl ? "" : (req.body.imageData || ""),
    date: req.body.date,
    createdAt: new Date()
  };
  const result = await db.collection("news").insertOne(payload);
  return res.json({ message: "News added", item: { ...payload, _id: result.insertedId } });
});
app.get("/api/news/:id", async (req, res) => {
  const db = await getDb();
  const item = await db.collection("news").find({ _id: new ObjectId(req.params.id) }).toArray();
  return res.json(item[0]);
});
app.put("/api/news/:id", adminMiddleware, maybeImageSingle("image"), async (req, res) => {
  const db = await getDb();
  const existing = await db.collection("news").find({ _id: new ObjectId(req.params.id) }).toArray();
  const current = existing[0] || {};
  const imageUrl = (await saveWebpImage(req, req.file)) || req.body.image || current.image || "";
  const payload = {
    title: req.body.title || current.title,
    category: req.body.category || current.category,
    description: req.body.description || current.description,
    image: imageUrl,
    imageData: imageUrl ? "" : (req.body.imageData || current.imageData || ""),
    date: req.body.date || current.date,
    updatedAt: new Date()
  };
  await db.collection("news").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: payload }
  );
  return res.json({ message: "News updated" });
});
app.delete("/api/news/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("news").deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "News deleted" });
});

app.get("/api/notifications", listItems("notifications"));
app.post("/api/notifications", adminMiddleware, maybePdfSingle("pdf"), async (req, res) => {
  const db = await getDb();
  const pdfUrl = fileUrl(req, req.file) || (req.body.pdfFile || "");
  const payload = {
    serialNo: req.body.serialNo || "",
    subject: req.body.subject || "",
    department: req.body.department || "",
    title: req.body.title,
    summary: req.body.summary || req.body.description || "",
    refNumber: req.body.refNumber || "",
    dateOfIssue: req.body.dateOfIssue || req.body.notificationDate || "",
    category: req.body.department || req.body.category || "",
    pdfFile: pdfUrl || "",
    pdfData: pdfUrl ? "" : (req.body.pdfData || ""),
    notificationDate: req.body.notificationDate || req.body.dateOfIssue || "",
    createdAt: new Date()
  };
  const result = await db.collection("notifications").insertOne(payload);
  return res.json({ message: "Notification added", item: { ...payload, _id: result.insertedId } });
});
app.get("/api/notifications/:id", async (req, res) => {
  const db = await getDb();
  const item = await db.collection("notifications").find({ _id: new ObjectId(req.params.id) }).toArray();
  return res.json(item[0]);
});
app.put("/api/notifications/:id", adminMiddleware, maybePdfSingle("pdf"), async (req, res) => {
  const db = await getDb();
  const existing = await db.collection("notifications").find({ _id: new ObjectId(req.params.id) }).toArray();
  const current = existing[0] || {};
  const pdfUrl = fileUrl(req, req.file) || req.body.pdfFile || current.pdfFile || "";
  const payload = {
    serialNo: req.body.serialNo || current.serialNo || "",
    subject: req.body.subject || current.subject || "",
    department: req.body.department || current.department || "",
    title: req.body.title || current.title,
    summary: req.body.summary || req.body.description || current.summary || current.description || "",
    refNumber: req.body.refNumber || current.refNumber || "",
    dateOfIssue: req.body.dateOfIssue || req.body.notificationDate || current.dateOfIssue || current.notificationDate || "",
    category: req.body.department || req.body.category || current.category || "",
    pdfFile: pdfUrl,
    pdfData: pdfUrl ? "" : (req.body.pdfData || current.pdfData || ""),
    notificationDate: req.body.notificationDate || req.body.dateOfIssue || current.notificationDate,
    updatedAt: new Date()
  };
  await db.collection("notifications").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: payload }
  );
  return res.json({ message: "Notification updated" });
});
app.delete("/api/notifications/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("notifications").deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "Notification deleted" });
});

app.get("/api/categories", async (req, res) => {
  const db = await getDb();
  const items = await db.collection("categories").find({}).toArray();
  return res.json(items);
});

app.post("/api/categories", adminMiddleware, maybeImageSingle("icon"), async (req, res) => {
  const db = await getDb();
  const iconUrl = (await saveWebpImage(req, req.file)) || (req.body.iconUrl || "");
  const types = parseTypes(req.body.types);
  const labelsByType = parseLabelsMap(req.body.labelsByType);
  const payload = {
    name: req.body.name,
    description: req.body.description || "",
    iconUrl,
    iconData: iconUrl ? "" : (req.body.iconData || ""),
    types,
    labelsByType,
    createdAt: new Date()
  };
  const result = await db.collection("categories").insertOne(payload);
  return res.json({ message: "Category added", item: { ...payload, _id: result.insertedId } });
});

app.delete("/api/categories/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("categories").deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "Category deleted" });
});

app.put("/api/categories/:id", adminMiddleware, maybeImageSingle("icon"), async (req, res) => {
  const db = await getDb();
  const existing = await db.collection("categories").find({ _id: new ObjectId(req.params.id) }).toArray();
  const current = existing[0] || {};
  const iconUrl = (await saveWebpImage(req, req.file)) || req.body.iconUrl || current.iconUrl || "";
  const types = parseTypes(req.body.types);
  const labelsByType = Object.keys(parseLabelsMap(req.body.labelsByType)).length
    ? parseLabelsMap(req.body.labelsByType)
    : (current.labelsByType || {});
  await db.collection("categories").updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        name: req.body.name,
        description: req.body.description || "",
        iconUrl,
        iconData: iconUrl ? "" : (req.body.iconData || current.iconData || ""),
        types,
        labelsByType,
        updatedAt: new Date()
      }
    }
  );
  return res.json({ message: "Category updated" });
});

app.get("/api/posts", async (req, res) => {
  const db = await getDb();
  const { status, category, search, type, paid, label } = req.query;
  const { location } = req.query;
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "6", 10);
  const and = [];
  if (status) and.push({ status });
  if (status === "approved") {
    const now = new Date();
    and.push({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: now } }
      ]
    });
  }
  if (category) {
    and.push({ category: { $regex: `^${escapeRegex(category)}$`, $options: "i" } });
  }
  if (type) {
    and.push({ type: { $regex: `^${escapeRegex(type)}$`, $options: "i" } });
  }
  if (label) {
    and.push({ label: { $regex: `^${escapeRegex(label)}$`, $options: "i" } });
  }
  if (paid === "true") {
    and.push({ paid: true });
  } else if (paid === "false") {
    and.push({ $or: [{ paid: { $exists: false } }, { paid: false }] });
  }
  if (location) and.push({ location });
  if (search) {
    and.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ]
    });
  }
  const query = and.length ? { $and: and } : {};
  const total = await db.collection("posts").find(query).toArray();
  const items = await db
    .collection("posts")
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
  return res.json({ items, page, pages: Math.ceil(total.length / limit) || 1 });
});

app.get("/api/posts/:id", async (req, res) => {
  const db = await getDb();
  const item = await db.collection("posts").find({ _id: new ObjectId(req.params.id) }).toArray();
  return res.json(item[0]);
});

app.get("/api/locations", async (req, res) => {
  const db = await getDb();
  await ensureLocations(db);
  const items = await db.collection("locations").find({}).sort({ name: 1 }).toArray();
  return res.json(items);
});

app.get("/api/admin/locations", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await ensureLocations(db);
  const items = await db.collection("locations").find({}).sort({ name: 1 }).toArray();
  return res.json(items);
});

app.post("/api/admin/locations", adminMiddleware, async (req, res) => {
  const name = (req.body.name || "").trim();
  const pinCode = (req.body.pinCode || "").trim();
  if (!name) return res.status(400).json({ message: "Location name required." });
  if (!pinCode) return res.status(400).json({ message: "Pin code required." });
  const db = await getDb();
  const existing = await db.collection("locations").find({ name }).toArray();
  if (existing.length) return res.status(409).json({ message: "Location already exists." });
  const payload = { name, pinCode, createdAt: new Date() };
  const result = await db.collection("locations").insertOne(payload);
  return res.json({ message: "Location added", item: { ...payload, _id: result.insertedId } });
});

app.put("/api/admin/locations/:id", adminMiddleware, async (req, res) => {
  const name = (req.body.name || "").trim();
  const pinCode = (req.body.pinCode || "").trim();
  if (!name) return res.status(400).json({ message: "Location name required." });
  if (!pinCode) return res.status(400).json({ message: "Pin code required." });
  const db = await getDb();
  await db.collection("locations").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { name, pinCode, updatedAt: new Date() } }
  );
  return res.json({ message: "Location updated" });
});

app.delete("/api/admin/locations/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("locations").deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "Location deleted" });
});

app.get("/api/admin/posts/:id/details", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const posts = await db.collection("posts").find({ _id: new ObjectId(req.params.id) }).toArray();
  const post = posts[0];
  if (!post) return res.status(404).json({ message: "Not found" });
  let user = null;
  if (post.userId && ObjectId.isValid(post.userId)) {
    const users = await db.collection("users").find({ _id: new ObjectId(post.userId) }).toArray();
    user = users[0]
      ? { name: users[0].name, email: users[0].email, paid: !!users[0].paid, paidUntil: users[0].paidUntil || null }
      : null;
  }
  if (!user && post.userEmail) {
    const users = await db.collection("users").find({ email: post.userEmail }).toArray();
    user = users[0]
      ? { name: users[0].name, email: users[0].email, paid: !!users[0].paid, paidUntil: users[0].paidUntil || null }
      : null;
  }
  return res.json({ post, user });
});

app.get("/api/my-posts", authMiddleware, async (req, res) => {
  const db = await getDb();
  const items = await db.collection("posts").find({
    $or: [{ userEmail: req.user.email }, { userId: req.user.id }]
  }).sort({ createdAt: -1 }).toArray();
  return res.json(items);
});

app.post("/api/posts", authMiddleware, maybeImageArray("images", 5), async (req, res) => {
  const db = await getDb();
  const users = await db.collection("users").find({ _id: new ObjectId(req.user.id) }).toArray();
  const user = users[0];
  const now = new Date();
  const isPaid = !!(user?.paid && user?.paidUntil && new Date(user.paidUntil) > now);
  const maxImages = isPaid ? 5 : 3;
  const maxWords = isPaid ? 350 : 150;

  if (isPaid) {
    const startDay = new Date(now);
    startDay.setHours(0, 0, 0, 0);
    const postsToday = await db.collection("posts").countDocuments({
      userId: req.user.id,
      createdAt: { $gte: startDay }
    });
    if (postsToday >= 50) {
      return res.status(400).json({ message: "Daily post limit reached (50)." });
    }
  }

  const description = req.body.description || "";
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > maxWords) {
    return res.status(400).json({ message: `Description exceeds ${maxWords} words.` });
  }

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length > maxImages) {
    return res.status(400).json({ message: `You can upload up to ${maxImages} images.` });
  }

  const imageUrls = [];
  for (const file of files) {
    const url = await saveWebpImage(req, file);
    if (url) imageUrls.push(url);
  }

  const payload = {
    title: req.body.title,
    category: req.body.category,
    type: req.body.type || "",
    label: req.body.label || "",
    location: req.body.location || "",
    pinCode: req.body.pinCode || "",
    description,
    contactName: req.body.contactName,
    phone: req.body.phone,
    breed: req.body.breed || "",
    age: req.body.age || "",
    gender: req.body.gender || "",
    size: req.body.size || "",
    vaccinationStatus: req.body.vaccinationStatus || "",
    medicalHistory: req.body.medicalHistory || "",
    temperament: req.body.temperament || "",
    adoptionConditions: req.body.adoptionConditions || "",
    contactDetails: req.body.contactDetails || "",
    imageUrls,
    imageUrl: imageUrls[0] || "",
    imageData: "",
    paid: isPaid,
    status: "pending",
    createdAt: now,
    expiresAt: isPaid ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    userId: req.user.id,
    userEmail: req.user.email || ""
  };
  await db.collection("posts").insertOne(payload);
  return res.json({ message: "Submitted" });
});

app.put("/api/posts/:id", authMiddleware, maybeImageArray("images", 5), async (req, res) => {
  const db = await getDb();
  const item = await db.collection("posts").find({ _id: new ObjectId(req.params.id) }).toArray();
  if (!item[0]) return res.status(404).json({ message: "Not found" });
  const ownsById = item[0].userId === req.user.id;
  const ownsByEmail = item[0].userEmail && item[0].userEmail === req.user.email;
  if (!ownsById && !ownsByEmail) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const users = await db.collection("users").find({ _id: new ObjectId(req.user.id) }).toArray();
  const user = users[0];
  const now = new Date();
  const isPaid = !!(user?.paid && user?.paidUntil && new Date(user.paidUntil) > now);
  const maxImages = isPaid ? 5 : 3;
  const maxWords = isPaid ? 350 : 150;
  const description = req.body.description || item[0].description || "";
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > maxWords) {
    return res.status(400).json({ message: `Description exceeds ${maxWords} words.` });
  }
  const existingImages = parseList(req.body.existingImages);
  const currentImages = Array.isArray(item[0].imageUrls) && item[0].imageUrls.length
    ? item[0].imageUrls
    : (item[0].imageUrl ? [item[0].imageUrl] : []);
  const removedImages = currentImages.filter((url) => !existingImages.includes(url));
  await Promise.all(removedImages.map((url) => deleteUpload(url)));
  const files = Array.isArray(req.files) ? req.files : [];
  if (existingImages.length + files.length > maxImages) {
    return res.status(400).json({ message: `You can upload up to ${maxImages} images.` });
  }
  const newUrls = [];
  for (const file of files) {
    const url = await saveWebpImage(req, file);
    if (url) newUrls.push(url);
  }
  const imageUrls = [...existingImages, ...newUrls];
  let expiresAt = req.body.expiresAt || null;
  if (expiresAt) {
    const parsed = new Date(expiresAt);
    expiresAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const paid = req.body.paid === "true" ? true : req.body.paid === "false" ? false : (item[0].paid || isPaid);
  const payload = {
    ...req.body,
    paid,
    expiresAt,
    label: req.body.label || item[0].label || "",
    pinCode: req.body.pinCode || item[0].pinCode || "",
    imageUrls,
    imageUrl: imageUrls[0] || "",
    imageData: ""
  };
  await db.collection("posts").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { ...payload, updatedAt: new Date() } }
  );
  return res.json({ message: "Updated" });
});

app.put("/api/admin/posts/:id", adminMiddleware, maybeImageArray("images", 5), async (req, res) => {
  const db = await getDb();
  const existing = await db.collection("posts").find({ _id: new ObjectId(req.params.id) }).toArray();
  const current = existing[0] || {};
  const existingImages = parseList(req.body.existingImages);
  const currentImages = Array.isArray(current.imageUrls) && current.imageUrls.length
    ? current.imageUrls
    : (current.imageUrl ? [current.imageUrl] : []);
  const removedImages = currentImages.filter((url) => !existingImages.includes(url));
  await Promise.all(removedImages.map((url) => deleteUpload(url)));
  const files = Array.isArray(req.files) ? req.files : [];
  const newUrls = [];
  for (const file of files) {
    const url = await saveWebpImage(req, file);
    if (url) newUrls.push(url);
  }
  const imageUrls = [...existingImages, ...newUrls].filter(Boolean);
  let expiresAt = req.body.expiresAt || null;
  if (expiresAt) {
    const parsed = new Date(expiresAt);
    expiresAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const paid = req.body.paid === "true" ? true : req.body.paid === "false" ? false : (current.paid || false);
  const payload = {
    ...req.body,
    paid,
    expiresAt,
    label: req.body.label || current.label || "",
    pinCode: req.body.pinCode || current.pinCode || "",
    imageUrls,
    imageUrl: imageUrls[0] || current.imageUrl || "",
    imageData: ""
  };
  await db.collection("posts").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { ...payload, updatedAt: new Date() } }
  );
  return res.json({ message: "Updated" });
});

app.put("/api/posts/:id/approve", adminMiddleware, approveItem("posts"));
app.delete("/api/posts/:id", adminMiddleware, deleteItem("posts"));

app.put("/api/admin/posts/:id/approve", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const posts = await db.collection("posts").find({ _id: new ObjectId(req.params.id) }).toArray();
  const post = posts[0];
  if (!post) return res.status(404).json({ message: "Not found" });
  let user = null;
  if (post.userId && ObjectId.isValid(post.userId)) {
    const users = await db.collection("users").find({ _id: new ObjectId(post.userId) }).toArray();
    user = users[0] || null;
  } else if (post.userEmail) {
    const users = await db.collection("users").find({ email: post.userEmail }).toArray();
    user = users[0] || null;
  }
  const isPaid = !!(user?.paid && user?.paidUntil && new Date(user.paidUntil) > new Date());
  let expiresAt = post.expiresAt || null;
  if (req.body.expiresAt) {
    expiresAt = new Date(req.body.expiresAt);
  }
  if (isPaid && !expiresAt) {
    return res.status(400).json({ message: "Expiry date required for paid users." });
  }
  await db.collection("posts").updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        status: "approved",
        approvedAt: new Date(),
        expiresAt: expiresAt || null
      }
    }
  );
  return res.json({ message: "Approved" });
});

app.get("/api/settings/web", async (req, res) => {
  const db = await getDb();
  const settings = await db.collection("settings").find({ key: "web" }).toArray();
  let web = settings[0];
  if (!web) {
    const legacy = await db.collection("settings").find({ key: "hero" }).toArray();
    web = legacy[0] || {};
  }
  return res.json({
    heroHeading: web.heroHeading || "",
    heroSubheading: web.heroSubheading || "",
    heroImage: web.heroImage || "",
    heroVideo: web.heroVideo || "",
    heroMediaMode: web.heroMediaMode || "image",
    popupVideo: web.popupVideo || "",
    popupLink: web.popupLink || "",
    popupEnabled: web.popupEnabled || false,
    heroBg: web.heroBg || "",
    contactEmail: web.contactEmail || "",
    banner1: web.banner1 || "",
    banner2: web.banner2 || "",
    banner3: web.banner3 || "",
    banner4: web.banner4 || ""
  });
});

app.put("/api/settings/web", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: "web" },
    {
      $set: {
        key: "web",
        heroHeading: req.body.heroHeading || "",
        heroSubheading: req.body.heroSubheading || "",
        heroImage: req.body.heroImage || "",
        heroVideo: req.body.heroVideo || "",
        heroMediaMode: req.body.heroMediaMode || "image",
        popupVideo: req.body.popupVideo || "",
        popupLink: req.body.popupLink || "",
        popupEnabled: !!req.body.popupEnabled,
        heroBg: req.body.heroBg || "",
        contactEmail: req.body.contactEmail || "",
        banner1: req.body.banner1 || "",
        banner2: req.body.banner2 || "",
        banner3: req.body.banner3 || "",
        banner4: req.body.banner4 || "",
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  return res.json({ message: "Settings updated" });
});

app.post("/api/settings/hero-video", adminMiddleware, maybeVideoSingle("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Video file required" });
  }
  const db = await getDb();
  try {
    const convertedPath = await convertVideoToWebm(req.file.path);
    await fs.promises.unlink(req.file.path).catch(() => {});
    const url = fileUrl(req, { filename: path.basename(convertedPath) });
    await db.collection("settings").updateOne(
      { key: "web" },
      {
        $set: {
          key: "web",
          heroVideo: url,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    return res.json({ message: "Hero video updated", heroVideo: url });
  } catch (err) {
    // Fallback: if ffmpeg is missing, keep the original upload
    const fallbackUrl = fileUrl(req, req.file);
    await db.collection("settings").updateOne(
      { key: "web" },
      {
        $set: {
          key: "web",
          heroVideo: fallbackUrl,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    return res.json({
      message: "FFmpeg not available. Using original video upload.",
      heroVideo: fallbackUrl
    });
  }
});

app.post("/api/settings/popup-video", adminMiddleware, maybeVideoSingle("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Video file required" });
  }
  const db = await getDb();
  try {
    const convertedPath = await convertVideoToWebm(req.file.path);
    await fs.promises.unlink(req.file.path).catch(() => {});
    const url = fileUrl(req, { filename: path.basename(convertedPath) });
    await db.collection("settings").updateOne(
      { key: "web" },
      {
        $set: {
          key: "web",
          popupVideo: url,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    return res.json({ message: "Popup video updated", popupVideo: url });
  } catch (err) {
    const fallbackUrl = fileUrl(req, req.file);
    await db.collection("settings").updateOne(
      { key: "web" },
      {
        $set: {
          key: "web",
          popupVideo: fallbackUrl,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    return res.json({
      message: "FFmpeg not available. Using original video upload.",
      popupVideo: fallbackUrl
    });
  }
});

app.get("/api/admin/pending", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const [jobs, properties, pets, posts, users] = await Promise.all([
    db.collection("jobs").find({ status: "pending" }).sort({ createdAt: -1 }).toArray(),
    db.collection("properties").find({ status: "pending" }).sort({ createdAt: -1 }).toArray(),
    db.collection("pets").find({ status: "pending" }).sort({ createdAt: -1 }).toArray(),
    db.collection("posts").find({ status: "pending" }).sort({ createdAt: -1 }).toArray(),
    db.collection("users").find({}, { projection: { password: 0 } }).toArray()
  ]);
  const userMapById = new Map(users.map((u) => [String(u._id), u]));
  const userMapByEmail = new Map(users.map((u) => [u.email, u]));
  const enrichedPosts = posts.map((post) => {
    const user = userMapById.get(String(post.userId)) || userMapByEmail.get(post.userEmail) || null;
    const isPaidUser = !!(user?.paid && user?.paidUntil && new Date(user.paidUntil) > new Date());
    return { ...post, isPaidUser, paidUntil: user?.paidUntil || null };
  });
  return res.json({ jobs, properties, pets, posts: enrichedPosts });
});

app.get("/api/admin/approved", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const [jobs, properties, pets, posts] = await Promise.all([
    db.collection("jobs").find({ status: "approved" }).sort({ createdAt: -1 }).toArray(),
    db.collection("properties").find({ status: "approved" }).sort({ createdAt: -1 }).toArray(),
    db.collection("pets").find({ status: "approved" }).sort({ createdAt: -1 }).toArray(),
    db.collection("posts").find({ status: "approved" }).sort({ createdAt: -1 }).toArray()
  ]);
  return res.json({ jobs, properties, pets, posts });
});

app.get("/api/admin/users", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const users = await db.collection("users").find({}, { projection: { password: 0 } }).toArray();
  return res.json(users);
});

app.put("/api/admin/users/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const { name, email, paid, paidUntil } = req.body;
  const payload = {
    updatedAt: new Date()
  };
  if (name !== undefined) payload.name = name;
  if (email !== undefined) payload.email = email;
  if (paid !== undefined) payload.paid = !!paid;
  if (paidUntil !== undefined) {
    payload.paidUntil = paidUntil ? new Date(paidUntil) : null;
  }
  await db.collection("users").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: payload }
  );
  return res.json({ message: "User updated" });
});

app.post("/api/search-log", async (req, res) => {
  const db = await getDb();
  await db.collection("search_logs").insertOne({
    category: req.body.category || "All",
    query: req.body.query || "",
    createdAt: new Date()
  });
  return res.json({ message: "Logged" });
});

app.get("/api/admin/trending", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const logs = await db.collection("search_logs").find({}).toArray();
  const counts = {};
  logs.forEach((log) => {
    const key = log.category || "All";
    counts[key] = (counts[key] || 0) + 1;
  });
  const items = Object.entries(counts).map(([name, count]) => ({ name, count }));
  items.sort((a, b) => b.count - a.count);
  return res.json(items);
});

app.post("/api/payments/create-order", authMiddleware, async (req, res) => {
  try {
    const amount = 35000;
    const payload = {
      amount,
      currency: "INR",
      receipt: `puneclass_${Date.now()}`,
      payment_capture: 1
    };
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ message: data.error?.description || "Order creation failed" });
    }
    return res.json({ order: data, keyId: razorpayKeyId });
  } catch (err) {
    return res.status(500).json({ message: "Payment order failed" });
  }
});

app.post("/api/payments/verify", authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment verification details" });
  }
  const generated = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (generated !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }
  const db = await getDb();
  const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.collection("users").updateOne(
    { _id: new ObjectId(req.user.id) },
    { $set: { paid: true, paidUntil, updatedAt: new Date() } }
  );
  await db.collection("payments").insertOne({
    userId: req.user.id,
    email: req.user.email,
    amount: 350,
    currency: "INR",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    paidUntil,
    createdAt: new Date()
  });
  return res.json({ message: "Payment verified", paidUntil });
});

app.delete("/api/admin/users/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "User removed" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", authMiddleware, async (req, res) => {
  const db = await getDb();
  const users = await db.collection("users").find({ _id: new ObjectId(req.user.id) }).toArray();
  const user = users[0];
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    paid: !!user.paid,
    paidUntil: user.paidUntil || null
  });
});

app.get("/api/me/payments", authMiddleware, async (req, res) => {
  const db = await getDb();
  const items = await db
    .collection("payments")
    .find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .toArray();
  return res.json(items);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
