const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "community_portal";
const jwtSecret = process.env.JWT_SECRET || "secret";

const client = new MongoClient(uri);
let isConnected = false;

const getDb = async () => {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return client.db(dbName);
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
  await db.collection("users").insertOne({ name, email, password: hash, createdAt: new Date() });
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
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
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
  const items = await db.collection(collection).find(query).toArray();
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
app.post("/api/news", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const payload = {
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    image: req.body.image || "",
    imageData: req.body.imageData || "",
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
app.delete("/api/news/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("news").deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "News deleted" });
});

app.get("/api/notifications", listItems("notifications"));
app.post("/api/notifications", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const payload = {
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    pdfFile: req.body.pdfFile || "",
    pdfData: req.body.pdfData || "",
    notificationDate: req.body.notificationDate,
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

app.post("/api/categories", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const payload = {
    name: req.body.name,
    description: req.body.description || "",
    iconUrl: req.body.iconUrl || "",
    iconData: req.body.iconData || "",
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

app.put("/api/categories/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("categories").updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        name: req.body.name,
        description: req.body.description || "",
        iconUrl: req.body.iconUrl || "",
        iconData: req.body.iconData || "",
        updatedAt: new Date()
      }
    }
  );
  return res.json({ message: "Category updated" });
});

app.get("/api/posts", async (req, res) => {
  const db = await getDb();
  const { status, category, search } = req.query;
  const { location } = req.query;
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "6", 10);
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (location) query.location = location;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }
  const total = await db.collection("posts").find(query).toArray();
  const items = await db
    .collection("posts")
    .find(query)
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
  const items = await db.collection("posts").find({ status: "approved" }).toArray();
  const locations = Array.from(
    new Set(
      items
        .map((item) => (item.location || "").trim())
        .filter((value) => value)
    )
  );
  return res.json(locations);
});

app.get("/api/admin/posts/:id/details", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const posts = await db.collection("posts").find({ _id: new ObjectId(req.params.id) }).toArray();
  const post = posts[0];
  if (!post) return res.status(404).json({ message: "Not found" });
  let user = null;
  if (post.userId && ObjectId.isValid(post.userId)) {
    const users = await db.collection("users").find({ _id: new ObjectId(post.userId) }).toArray();
    user = users[0] ? { name: users[0].name, email: users[0].email } : null;
  }
  return res.json({ post, user });
});

app.get("/api/my-posts", authMiddleware, async (req, res) => {
  const db = await getDb();
  const items = await db.collection("posts").find({
    $or: [{ userEmail: req.user.email }, { userId: req.user.id }]
  }).toArray();
  return res.json(items);
});

app.post("/api/posts", authMiddleware, async (req, res) => {
  const payload = {
    title: req.body.title,
    category: req.body.category,
    location: req.body.location || "",
    description: req.body.description,
    contactName: req.body.contactName,
    phone: req.body.phone,
    imageData: req.body.imageData,
    status: "pending",
    createdAt: new Date(),
    userId: req.user.id,
    userEmail: req.user.email || ""
  };
  const db = await getDb();
  await db.collection("posts").insertOne(payload);
  return res.json({ message: "Submitted" });
});

app.put("/api/posts/:id", authMiddleware, async (req, res) => {
  const db = await getDb();
  const item = await db.collection("posts").find({ _id: new ObjectId(req.params.id) }).toArray();
  if (!item[0]) return res.status(404).json({ message: "Not found" });
  const ownsById = item[0].userId === req.user.id;
  const ownsByEmail = item[0].userEmail && item[0].userEmail === req.user.email;
  if (!ownsById && !ownsByEmail) {
    return res.status(403).json({ message: "Forbidden" });
  }
  await db.collection("posts").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { ...req.body, updatedAt: new Date() } }
  );
  return res.json({ message: "Updated" });
});

app.put("/api/admin/posts/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("posts").updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { ...req.body, updatedAt: new Date() } }
  );
  return res.json({ message: "Updated" });
});

app.put("/api/posts/:id/approve", adminMiddleware, approveItem("posts"));
app.delete("/api/posts/:id", adminMiddleware, deleteItem("posts"));

app.get("/api/settings/web", async (req, res) => {
  const db = await getDb();
  const settings = await db.collection("settings").find({ key: "web" }).toArray();
  let web = settings[0];
  if (!web) {
    const legacy = await db.collection("settings").find({ key: "hero" }).toArray();
    web = legacy[0] || {};
  }
  return res.json({ heroImage: web.heroImage || "", contactEmail: web.contactEmail || "" });
});

app.put("/api/settings/web", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: "web" },
    {
      $set: {
        key: "web",
        heroImage: req.body.heroImage || "",
        contactEmail: req.body.contactEmail || "",
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  return res.json({ message: "Settings updated" });
});

app.get("/api/admin/pending", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const [jobs, properties, pets, posts] = await Promise.all([
    db.collection("jobs").find({ status: "pending" }).toArray(),
    db.collection("properties").find({ status: "pending" }).toArray(),
    db.collection("pets").find({ status: "pending" }).toArray(),
    db.collection("posts").find({ status: "pending" }).toArray()
  ]);
  return res.json({ jobs, properties, pets, posts });
});

app.get("/api/admin/approved", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const [jobs, properties, pets, posts] = await Promise.all([
    db.collection("jobs").find({ status: "approved" }).toArray(),
    db.collection("properties").find({ status: "approved" }).toArray(),
    db.collection("pets").find({ status: "approved" }).toArray(),
    db.collection("posts").find({ status: "approved" }).toArray()
  ]);
  return res.json({ jobs, properties, pets, posts });
});

app.get("/api/admin/users", adminMiddleware, async (req, res) => {
  const db = await getDb();
  const users = await db.collection("users").find({}, { projection: { password: 0 } }).toArray();
  return res.json(users);
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

app.delete("/api/admin/users/:id", adminMiddleware, async (req, res) => {
  const db = await getDb();
  await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
  return res.json({ message: "User removed" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
