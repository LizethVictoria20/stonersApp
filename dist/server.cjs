var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// server/database.ts
var import_supabase_js = require("@supabase/supabase-js");
var COLLECTIONS = [
  "users",
  "tasks",
  "sops",
  "goals",
  "notifications",
  "activity_logs",
  "sales_budgets",
  "daily_sales",
  "stores",
  "product_categories",
  "products",
  "product_variants",
  "product_prices",
  "inventory",
  "inventory_movements"
];
var client;
function getClient() {
  if (client !== void 0) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  client = url && secretKey ? (0, import_supabase_js.createClient)(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  }) : null;
  return client;
}
function requireClient() {
  const supabase = getClient();
  if (!supabase) {
    throw new Error(
      "Supabase no est\xE1 configurado. Define SUPABASE_URL y SUPABASE_SECRET_KEY antes de usar la aplicaci\xF3n."
    );
  }
  return supabase;
}
function userFromRow(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    department: row.department,
    avatar: row.avatar,
    productivityScore: row.productivity_score,
    tasksCompletedThisMonth: row.tasks_completed_this_month,
    lastActive: row.last_active,
    phone: row.phone || void 0,
    pinHash: row.pin_hash || void 0,
    storeIds: Array.isArray(row.store_ids) ? row.store_ids : []
  };
}
function userToRow(record) {
  return {
    id: record.id,
    email: record.email.trim().toLowerCase(),
    name: record.name || record.email.split("@")[0],
    role: record.role || "vendedor",
    department: record.department || "sales",
    avatar: record.avatar || "",
    productivity_score: Number(record.productivityScore ?? 100),
    tasks_completed_this_month: Number(record.tasksCompletedThisMonth ?? 0),
    last_active: record.lastActive || "Ahora mismo",
    phone: record.phone || null,
    pin_hash: record.pinHash || null,
    store_ids: record.storeIds || []
  };
}
function productFromRow(row) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description || "",
    categoryId: row.category_id || "",
    categoryName: row.category_name || "Sin categor\xEDa",
    brand: row.brand || "",
    unit: row.unit || "unidad",
    imageUrl: row.image_url || void 0,
    status: row.status || "active",
    taxRate: Number(row.tax_rate || 0),
    regulatoryRegistration: row.regulatory_registration || void 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function productToRow(record) {
  return {
    id: record.id,
    sku: record.sku.trim(),
    name: record.name.trim(),
    description: record.description || "",
    category_id: record.categoryId || "",
    category_name: record.categoryName || "Sin categor\xEDa",
    brand: record.brand || "",
    unit: record.unit || "unidad",
    image_url: record.imageUrl || null,
    status: record.status || "active",
    tax_rate: Number(record.taxRate || 0),
    regulatory_registration: record.regulatoryRegistration || null,
    created_at: record.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: record.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function checkDatabase() {
  const supabase = getClient();
  if (!supabase) return { configured: false, connected: false };
  const [{ error: recordsError }, { error: usersError }, { error: productsError }] = await Promise.all([
    supabase.from("app_records").select("entity_id").limit(1),
    supabase.from("users").select("id").limit(1),
    supabase.from("products").select("id").limit(1)
  ]);
  const error = recordsError || usersError || productsError;
  return error ? { configured: true, connected: false, error: error.message } : { configured: true, connected: true };
}
async function listRecords(collection) {
  const supabase = requireClient();
  if (collection === "users") {
    const { data: data2, error: error2 } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (error2) throw new Error(`No se pudo leer users: ${error2.message}`);
    return (data2 || []).map(userFromRow);
  }
  if (collection === "products") {
    const { data: data2, error: error2 } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error2) throw new Error(`No se pudo leer products: ${error2.message}`);
    return (data2 || []).map(productFromRow);
  }
  const { data, error } = await supabase.from("app_records").select("payload").eq("entity_type", collection).order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudo leer ${collection}: ${error.message}`);
  return (data || []).map((record) => record.payload);
}
async function upsertRecord(collection, record) {
  const supabase = requireClient();
  if (collection === "users") {
    const user = record;
    if (!user.email?.trim()) throw new Error("No se puede guardar un usuario sin correo electr\xF3nico.");
    const { error: error2 } = await supabase.from("users").upsert(userToRow(user), { onConflict: "id" });
    if (error2) throw new Error(`No se pudo guardar users: ${error2.message}`);
    return record;
  }
  if (collection === "products") {
    const product = record;
    if (!product.name?.trim() || !product.sku?.trim()) {
      throw new Error("No se puede guardar un producto sin nombre y SKU.");
    }
    const { error: error2 } = await supabase.from("products").upsert(productToRow(product), { onConflict: "id" });
    if (error2) throw new Error(`No se pudo guardar products: ${error2.message}`);
    return record;
  }
  const { error } = await supabase.from("app_records").upsert(
    {
      entity_type: collection,
      entity_id: record.id,
      payload: record
    },
    { onConflict: "entity_type,entity_id" }
  );
  if (error) throw new Error(`No se pudo guardar ${collection}: ${error.message}`);
  return record;
}
async function deleteRecord(collection, id) {
  const supabase = requireClient();
  if (collection === "users") {
    const { error: error2 } = await supabase.from("users").delete().eq("id", id);
    if (error2) throw new Error(`No se pudo eliminar users: ${error2.message}`);
    return;
  }
  if (collection === "products") {
    const { error: error2 } = await supabase.from("products").delete().eq("id", id);
    if (error2) throw new Error(`No se pudo eliminar products: ${error2.message}`);
    return;
  }
  const { error } = await supabase.from("app_records").delete().eq("entity_type", collection).eq("entity_id", id);
  if (error) throw new Error(`No se pudo eliminar ${collection}: ${error.message}`);
}
async function findRecord(collection, id) {
  const records = await listRecords(collection);
  return records.find((record) => record.id === id) || null;
}
async function findRecordByField(collection, field, value) {
  const records = await listRecords(collection);
  return records.find((record) => record[field] === value) || null;
}
async function applyRecordTransaction(upserts, deletes = []) {
  const supabase = requireClient();
  const { error } = await supabase.rpc("apply_app_records_transaction", {
    p_upserts: upserts.map(({ collection, record }) => ({
      entity_type: collection,
      entity_id: record.id,
      payload: record
    })),
    p_deletes: deletes.map(({ collection, id }) => ({ entity_type: collection, entity_id: id }))
  });
  if (error) throw new Error(`No se pudo completar la transacci\xF3n: ${error.message}`);
}

// server.ts
var sseClients = /* @__PURE__ */ new Map();
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "stoners-local-development-secret" : "");
  if (!secret) throw new Error("SESSION_SECRET no est\xE1 configurado en Render.");
  return secret;
}
function signSession(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1e3) + 12 * 60 * 60
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = import_crypto.default.createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}
function verifySession(token) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = import_crypto.default.createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !import_crypto.default.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload.exp > Math.floor(Date.now() / 1e3) ? payload : null;
  } catch {
    return null;
  }
}
async function verifyFirebaseIdToken(idToken) {
  const serverApiKey = process.env.FIREBASE_API_KEY?.trim();
  const frontendApiKey = process.env.VITE_FIREBASE_API_KEY?.trim();
  const apiKey = process.env.NODE_ENV === "production" ? serverApiKey : frontendApiKey || serverApiKey;
  if (!apiKey) {
    throw new Error(
      process.env.NODE_ENV === "production" ? "FIREBASE_API_KEY no est\xE1 configurado en Render." : "Falta VITE_FIREBASE_API_KEY o FIREBASE_API_KEY en el archivo .env local."
    );
  }
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  const body = await response.json();
  const firebaseUser = body.users?.[0];
  if (!response.ok || !firebaseUser?.email || firebaseUser.emailVerified === false) {
    const firebaseError = String(body.error?.message || "INVALID_ID_TOKEN");
    console.error(`Firebase rechaz\xF3 el token: ${firebaseError}`);
    throw new Error(`El token de Google/Firebase no es v\xE1lido (${firebaseError}).`);
  }
  return {
    email: String(firebaseUser.email).toLowerCase(),
    name: firebaseUser.displayName || String(firebaseUser.email).split("@")[0],
    avatar: firebaseUser.photoUrl || "",
    uid: firebaseUser.localId
  };
}
function normalizeDepartment(value) {
  return value === "admin" || value === "accounting" || value === "sales" ? value : "sales";
}
function normalizeUserRole(value) {
  return value === "admin" || value === "contador" || value === "vendedor" ? value : "vendedor";
}
function hashPin(pin) {
  const salt = import_crypto.default.randomBytes(16).toString("hex");
  const hash = import_crypto.default.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPin(pin, user) {
  if (user.pinHash) {
    const [salt, savedHash] = user.pinHash.split(":");
    if (!salt || !savedHash) return false;
    const actual = Buffer.from(import_crypto.default.scryptSync(pin, salt, 64).toString("hex"));
    const expected = Buffer.from(savedHash);
    return actual.length === expected.length && import_crypto.default.timingSafeEqual(actual, expected);
  }
  return Boolean(user.pinCode && pin === user.pinCode);
}
function sanitizeUser(user) {
  const { pinCode: _pinCode, pinHash: _pinHash, ...safeUser } = user;
  return safeUser;
}
function sanitizeSaleForRole(sale, role) {
  if (!sale || role !== "vendedor") return sale;
  return {
    ...sale,
    costTotal: void 0,
    items: sale.items?.map((item) => ({ ...item, unitCost: 0 }))
  };
}
function broadcastSyncEvent(eventType, payload) {
  sseClients.forEach((role, client2) => {
    let safePayload = payload;
    if (role === "vendedor" && eventType === "DATA_UPSERTED") {
      if (payload.collection === "inventory_movements") return;
      if (payload.collection === "product_prices") {
        const { cost: _cost, ...record } = payload.record;
        safePayload = { ...payload, record };
      }
    }
    if (role === "vendedor" && (eventType === "SALE_RECORDED" || eventType === "SALE_DELETED")) {
      safePayload = { ...payload, sale: sanitizeSaleForRole(payload.sale, role), movements: [] };
    }
    const data = JSON.stringify({ type: eventType, payload: safePayload, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    client2.write(`data: ${data}

`);
  });
}
var aiClient = null;
function getGenAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new import_genai.GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  app.use(import_express.default.json({ limit: "10mb" }));
  const asyncRoute = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
  app.get("/api/health", asyncRoute(async (_req, res) => {
    const database = await checkDatabase();
    const status = database.connected ? "ok" : "degraded";
    res.status(status === "ok" ? 200 : 503).json({
      status,
      system: "Stoners Colombia - Control Operativo",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: {
        provider: database.configured ? "supabase-postgresql" : "not-configured",
        connected: database.connected,
        error: database.error
      }
    });
  }));
  app.get("/api/auth/status", asyncRoute(async (_req, res) => {
    const users = await listRecords("users");
    res.json({ hasUsers: users.length > 0 });
  }));
  app.post("/api/auth/google", asyncRoute(async (req, res) => {
    const identity = await verifyFirebaseIdToken(String(req.body.idToken || ""));
    const users = await listRecords("users");
    const existing = users.find((user2) => user2.email.toLowerCase() === identity.email);
    const user = existing ? { ...existing, name: identity.name, avatar: identity.avatar || existing.avatar, lastActive: "Ahora mismo" } : {
      id: `usr-g-${identity.uid.slice(0, 12)}`,
      name: identity.name,
      email: identity.email,
      role: users.length === 0 ? "admin" : "vendedor",
      department: users.length === 0 ? "admin" : "sales",
      avatar: identity.avatar,
      productivityScore: 100,
      tasksCompletedThisMonth: 0,
      lastActive: "Ahora mismo",
      storeIds: []
    };
    await upsertRecord("users", user);
    const safeUser = sanitizeUser(user);
    broadcastSyncEvent(existing ? "USER_UPDATED" : "USER_CREATED", safeUser);
    res.json({ user: safeUser, token: signSession(user) });
  }));
  app.post("/api/auth/pin", asyncRoute(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const pin = String(req.body.pin || "");
    const user = await findRecordByField("users", "email", email);
    if (!user || !verifyPin(pin, user)) {
      return res.status(401).json({ error: "Correo o PIN incorrecto." });
    }
    res.json({ user: sanitizeUser(user), token: signSession(user) });
  }));
  app.use("/api", (req, res, next) => {
    const headerToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
    const queryToken = typeof req.query.token === "string" ? req.query.token : "";
    const session = verifySession(headerToken || queryToken);
    if (!session) return res.status(401).json({ error: "Sesi\xF3n inv\xE1lida o vencida." });
    res.locals.session = session;
    next();
  });
  app.get("/api/bootstrap", asyncRoute(async (_req, res) => {
    const session = res.locals.session;
    const currentUser = await findRecord("users", session.sub);
    const entries = await Promise.all(
      COLLECTIONS.map(async (collection) => {
        let records = await listRecords(collection);
        if (collection === "users") records = records.map(sanitizeUser);
        if (currentUser?.role === "vendedor") {
          if (collection === "product_prices") {
            records = records.map(({ cost: _cost, ...price }) => price);
          }
          if (collection === "inventory_movements") {
            records = [];
          }
          if (collection === "daily_sales") {
            records = records.map((sale) => sanitizeSaleForRole(sale, currentUser.role));
          }
        }
        return [collection, records];
      })
    );
    const state = Object.fromEntries(entries);
    res.json({ ...state, currentUser: currentUser ? sanitizeUser(currentUser) : null });
  }));
  const productWriteCollections = [
    "product_categories",
    "products",
    "product_variants",
    "product_prices",
    "inventory",
    "inventory_movements",
    "daily_sales"
  ];
  const requireAdminForProductWrite = async (collection, res) => {
    if (!productWriteCollections.includes(collection)) return true;
    const session = res.locals.session;
    const actor = await findRecord("users", session.sub);
    if (actor?.role === "admin") return true;
    res.status(403).json({ error: "Solo un Administrador puede modificar cat\xE1logo e inventario." });
    return false;
  };
  const getAdminActor = async (res) => {
    const session = res.locals.session;
    const actor = await findRecord("users", session.sub);
    if (!actor || actor.role !== "admin") {
      res.status(403).json({ error: "Solo un Administrador puede realizar esta operaci\xF3n." });
      return null;
    }
    return actor;
  };
  app.put("/api/data/:collection/:id", asyncRoute(async (req, res) => {
    const collection = req.params.collection;
    if (!COLLECTIONS.includes(collection)) {
      return res.status(404).json({ error: "Colecci\xF3n no encontrada" });
    }
    if (!await requireAdminForProductWrite(collection, res)) return;
    let record = { ...req.body, id: req.params.id };
    if (collection === "users") {
      const existing = await findRecord("users", req.params.id);
      record = {
        ...existing,
        ...record,
        ...req.body.pinCode ? { pinHash: hashPin(String(req.body.pinCode)) } : existing?.pinHash ? { pinHash: existing.pinHash } : {}
      };
      delete record.pinCode;
    }
    await upsertRecord(collection, record);
    const responseRecord = collection === "users" ? sanitizeUser(record) : record;
    broadcastSyncEvent("DATA_UPSERTED", { collection, record: responseRecord });
    res.json(responseRecord);
  }));
  app.delete("/api/data/:collection/:id", asyncRoute(async (req, res) => {
    const collection = req.params.collection;
    if (!COLLECTIONS.includes(collection)) {
      return res.status(404).json({ error: "Colecci\xF3n no encontrada" });
    }
    if (!await requireAdminForProductWrite(collection, res)) return;
    await deleteRecord(collection, req.params.id);
    broadcastSyncEvent("DATA_DELETED", { collection, id: req.params.id });
    res.json({ success: true, id: req.params.id });
  }));
  app.post("/api/products/bundle", asyncRoute(async (req, res) => {
    if (!await getAdminActor(res)) return;
    const product = req.body.product;
    const variant = req.body.variant;
    const price = req.body.price;
    if (!product?.id || !product.name?.trim() || !variant?.id || !variant.sku?.trim() || !price?.id) {
      return res.status(400).json({ error: "Nombre, SKU y precio son obligatorios." });
    }
    if (Number(price.cost) < 0 || Number(price.salePrice) < 0) {
      return res.status(400).json({ error: "Los precios no pueden ser negativos." });
    }
    const variants = await listRecords("product_variants");
    const duplicate = variants.find((item) => item.id !== variant.id && (item.sku.toLowerCase() === variant.sku.toLowerCase() || Boolean(variant.barcode && item.barcode === variant.barcode)));
    if (duplicate) return res.status(409).json({ error: "El SKU o c\xF3digo de barras ya est\xE1 registrado." });
    await applyRecordTransaction([
      { collection: "products", record: product },
      { collection: "product_variants", record: variant },
      { collection: "product_prices", record: price }
    ]);
    const [savedProduct, savedVariant, savedPrice] = await Promise.all([
      findRecord("products", product.id),
      findRecord("product_variants", variant.id),
      findRecord("product_prices", price.id)
    ]);
    if (!savedProduct || !savedVariant || !savedPrice) {
      throw new Error("Supabase no confirm\xF3 el guardado completo del producto.");
    }
    broadcastSyncEvent("DATA_UPSERTED", { collection: "products", record: savedProduct });
    broadcastSyncEvent("DATA_UPSERTED", { collection: "product_variants", record: savedVariant });
    broadcastSyncEvent("DATA_UPSERTED", { collection: "product_prices", record: savedPrice });
    res.status(201).json({ product: savedProduct, variant: savedVariant, price: savedPrice });
  }));
  const deleteProductsCompletely = async (requestedIds) => {
    const productIds = new Set(requestedIds);
    const [products, variants, prices, inventoryItems, movements] = await Promise.all([
      listRecords("products"),
      listRecords("product_variants"),
      listRecords("product_prices"),
      listRecords("inventory"),
      listRecords("inventory_movements")
    ]);
    const selectedProducts = products.filter((item) => productIds.has(item.id));
    const selectedProductIds = new Set(selectedProducts.map((item) => item.id));
    const productVariants = variants.filter((item) => selectedProductIds.has(item.productId));
    const variantIds = new Set(productVariants.map((item) => item.id));
    const productPrices = prices.filter((item) => selectedProductIds.has(item.productId) || variantIds.has(item.variantId));
    const productInventory = inventoryItems.filter((item) => selectedProductIds.has(item.productId) || variantIds.has(item.variantId));
    const productMovements = movements.filter((item) => selectedProductIds.has(item.productId) || variantIds.has(item.variantId));
    const deletes = [
      ...productMovements.map((item) => ({ collection: "inventory_movements", id: item.id })),
      ...productInventory.map((item) => ({ collection: "inventory", id: item.id })),
      ...productPrices.map((item) => ({ collection: "product_prices", id: item.id })),
      ...productVariants.map((item) => ({ collection: "product_variants", id: item.id })),
      ...selectedProducts.map((item) => ({ collection: "products", id: item.id }))
    ];
    await applyRecordTransaction([], deletes);
    deletes.forEach(({ collection, id }) => broadcastSyncEvent("DATA_DELETED", { collection, id }));
    return {
      productIds: selectedProducts.map((item) => item.id),
      variantIds: productVariants.map((item) => item.id),
      priceIds: productPrices.map((item) => item.id),
      inventoryIds: productInventory.map((item) => item.id),
      movementIds: productMovements.map((item) => item.id)
    };
  };
  app.post("/api/products/bulk-delete", asyncRoute(async (req, res) => {
    if (!await getAdminActor(res)) return;
    const productIds = Array.isArray(req.body.productIds) ? [...new Set(req.body.productIds.map((id) => String(id).trim()).filter((id) => Boolean(id)))] : [];
    if (!productIds.length) return res.status(400).json({ error: "Selecciona al menos un producto." });
    if (productIds.length > 500) return res.status(400).json({ error: "Solo puedes eliminar hasta 500 productos por operaci\xF3n." });
    const result = await deleteProductsCompletely(productIds);
    if (!result.productIds.length) return res.status(404).json({ error: "No se encontraron los productos seleccionados." });
    res.json(result);
  }));
  app.delete("/api/products/:id", asyncRoute(async (req, res) => {
    if (!await getAdminActor(res)) return;
    const result = await deleteProductsCompletely([req.params.id]);
    if (!result.productIds.length) return res.status(404).json({ error: "Producto no encontrado." });
    res.json(result);
  }));
  app.post("/api/inventory/adjust", asyncRoute(async (req, res) => {
    const actor = await getAdminActor(res);
    if (!actor) return;
    const requested = req.body.inventory;
    const quantityDelta = Number(req.body.quantityDelta);
    const reason = String(req.body.reason || "").trim();
    const type = req.body.type || "adjustment";
    if (!requested?.storeId || !requested?.variantId || !Number.isFinite(quantityDelta) || !reason) {
      return res.status(400).json({ error: "Producto, tienda, cantidad y motivo son obligatorios." });
    }
    const [store, variant, existingItems] = await Promise.all([
      findRecord("stores", requested.storeId),
      findRecord("product_variants", requested.variantId),
      listRecords("inventory")
    ]);
    if (!store?.active || !variant?.active) return res.status(400).json({ error: "La tienda o el producto no est\xE1n activos." });
    const product = await findRecord("products", variant.productId);
    if (!product) return res.status(400).json({ error: "Producto no encontrado." });
    const existing = existingItems.find((item) => item.storeId === store.id && item.variantId === variant.id);
    const previousQuantity = existing?.quantity || 0;
    if (previousQuantity + quantityDelta < 0) return res.status(409).json({ error: `El ajuste dejar\xEDa el inventario negativo. Disponible: ${previousQuantity}.` });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      ...requested,
      ...existing,
      id: existing?.id || `${store.id}:${variant.id}`,
      storeId: store.id,
      storeName: store.name,
      productId: product.id,
      variantId: variant.id,
      sku: variant.sku,
      productName: product.name,
      quantity: previousQuantity + quantityDelta,
      reservedQuantity: existing?.reservedQuantity || 0,
      updatedAt: now
    };
    const movement = {
      id: `mov-${Date.now()}-${import_crypto.default.randomBytes(3).toString("hex")}`,
      inventoryId: record.id,
      storeId: store.id,
      storeName: store.name,
      productId: product.id,
      variantId: variant.id,
      sku: variant.sku,
      productName: product.name,
      type,
      quantity: quantityDelta,
      previousQuantity,
      newQuantity: record.quantity,
      reason,
      userId: actor.id,
      userName: actor.name,
      timestamp: now
    };
    await applyRecordTransaction([
      { collection: "inventory", record },
      { collection: "inventory_movements", record: movement }
    ]);
    broadcastSyncEvent("DATA_UPSERTED", { collection: "inventory", record });
    broadcastSyncEvent("DATA_UPSERTED", { collection: "inventory_movements", record: movement });
    res.status(201).json({ inventory: record, movement });
  }));
  const prepareSale = async (body, session, existingSale) => {
    const actor = await findRecord("users", session.sub);
    if (!actor) throw new Error("El usuario de la sesi\xF3n ya no existe.");
    if (actor.role === "contador") throw new Error("El rol Contador solo puede consultar las ventas.");
    if (existingSale && actor.role !== "admin" && existingSale.sellerId !== actor.id) {
      throw new Error("Solo puedes modificar tus propias ventas.");
    }
    const storeId = String(body.storeId || "");
    if (!storeId) throw new Error("Selecciona una tienda para registrar la venta.");
    const store = await findRecord("stores", storeId);
    if (!store || !store.active) throw new Error("La tienda seleccionada no est\xE1 activa.");
    if (actor.role === "vendedor" && !actor.storeIds?.includes(storeId) && !store.assignedSellerIds?.includes(actor.id)) {
      throw new Error("No est\xE1s asignado a la tienda seleccionada.");
    }
    const seller = actor.role === "admin" && body.sellerId ? await findRecord("users", String(body.sellerId)) || actor : actor;
    const products = await listRecords("products");
    const variants = await listRecords("product_variants");
    const prices = await listRecords("product_prices");
    const inventory = await listRecords("inventory");
    const inventoryMap = new Map(inventory.map((item) => [item.id, { ...item }]));
    const saleItems = [];
    const changedInventory = [];
    const movements = [];
    for (const oldItem of existingSale?.items || []) {
      const stock = inventory.find((item) => item.storeId === existingSale?.storeId && item.variantId === oldItem.variantId);
      if (stock) {
        const restored = inventoryMap.get(stock.id);
        restored.quantity += oldItem.quantity;
        changedInventory.push(restored);
      }
    }
    const saleId = existingSale?.id || body.id || `sale-${Date.now()}`;
    for (const requested of Array.isArray(body.items) ? body.items : []) {
      const variant = variants.find((item) => item.id === requested.variantId && item.active);
      if (!variant) throw new Error("Una variante seleccionada ya no est\xE1 disponible.");
      const product = products.find((item) => item.id === variant.productId && item.status === "active");
      if (!product) throw new Error(`El producto ${variant.sku} no est\xE1 activo.`);
      const price = prices.find((item) => item.variantId === variant.id && item.storeId === storeId) || prices.find((item) => item.variantId === variant.id && !item.storeId);
      if (!price) throw new Error(`El producto ${variant.sku} no tiene precio configurado.`);
      const quantity = Math.max(1, Math.floor(Number(requested.quantity) || 1));
      const storedInventory = inventory.find((item) => item.storeId === storeId && item.variantId === variant.id);
      const stock = storedInventory ? inventoryMap.get(storedInventory.id) : void 0;
      const inventoryId = stock?.id || `${storeId}:${variant.id}`;
      const available = stock ? stock.quantity - stock.reservedQuantity : 0;
      if (!stock || available < quantity) {
        throw new Error(actor.role === "vendedor" ? `Stock insuficiente para ${product.name}. Reduce la cantidad solicitada.` : `Stock insuficiente para ${product.name}. Disponible: ${Math.max(0, available)}.`);
      }
      const previousQuantity = stock.quantity;
      stock.quantity -= quantity;
      stock.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const lineBase = price.salePrice * quantity;
      const discountAmount2 = Math.min(lineBase, Math.max(0, Number(requested.discountAmount) || 0));
      const taxableAmount = lineBase - discountAmount2;
      const taxAmount2 = Math.round(taxableAmount * ((price.taxRate ?? product.taxRate) / 100));
      saleItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity,
        unitPrice: price.salePrice,
        unitCost: price.cost,
        discountAmount: discountAmount2,
        taxAmount: taxAmount2,
        subtotal: lineBase
      });
      if (!changedInventory.some((item) => item.id === stock.id)) changedInventory.push(stock);
      movements.push({
        id: `mov-${Date.now()}-${movements.length}`,
        inventoryId,
        storeId,
        storeName: stock.storeName,
        productId: product.id,
        variantId: variant.id,
        sku: variant.sku,
        productName: product.name,
        type: "sale",
        quantity: -quantity,
        previousQuantity,
        newQuantity: stock.quantity,
        reason: existingSale ? "Actualizaci\xF3n de venta" : "Venta registrada",
        referenceId: saleId,
        userId: actor.id,
        userName: actor.name,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = saleItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const taxAmount = saleItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const amount = saleItems.length ? subtotal - discountAmount + taxAmount : Number(body.amount) || 0;
    if (amount <= 0) throw new Error("La venta debe tener un valor mayor a cero.");
    const sale = {
      ...existingSale,
      id: saleId,
      sellerId: seller.id,
      sellerName: seller.name,
      storeId,
      storeName: store.name,
      date: body.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      amount,
      channel: body.channel || "tienda",
      clientName: body.clientName,
      description: body.description,
      timestamp: existingSale?.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      items: saleItems,
      subtotal,
      discountAmount,
      taxAmount,
      costTotal: saleItems.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
    };
    return { sale, inventory: changedInventory, movements };
  };
  app.post("/api/sales", asyncRoute(async (req, res) => {
    const session = res.locals.session;
    const result = await prepareSale(req.body, session);
    await applyRecordTransaction([
      { collection: "daily_sales", record: result.sale },
      ...result.inventory.map((record) => ({ collection: "inventory", record })),
      ...result.movements.map((record) => ({ collection: "inventory_movements", record }))
    ]);
    broadcastSyncEvent("SALE_RECORDED", result);
    const actor = await findRecord("users", session.sub);
    res.status(201).json(actor?.role === "vendedor" ? { ...result, sale: sanitizeSaleForRole(result.sale, actor.role), movements: [] } : result);
  }));
  app.put("/api/sales/:id", asyncRoute(async (req, res) => {
    const existing = await findRecord("daily_sales", req.params.id);
    if (!existing) return res.status(404).json({ error: "Venta no encontrada." });
    const session = res.locals.session;
    const result = await prepareSale({ ...req.body, id: existing.id }, session, existing);
    await applyRecordTransaction([
      { collection: "daily_sales", record: result.sale },
      ...result.inventory.map((record) => ({ collection: "inventory", record })),
      ...result.movements.map((record) => ({ collection: "inventory_movements", record }))
    ]);
    broadcastSyncEvent("SALE_RECORDED", result);
    const actor = await findRecord("users", session.sub);
    res.json(actor?.role === "vendedor" ? { ...result, sale: sanitizeSaleForRole(result.sale, actor.role), movements: [] } : result);
  }));
  app.delete("/api/sales/:id", asyncRoute(async (req, res) => {
    const sale = await findRecord("daily_sales", req.params.id);
    if (!sale) return res.status(404).json({ error: "Venta no encontrada." });
    const session = res.locals.session;
    const actor = await findRecord("users", session.sub);
    if (!actor || actor.role === "contador") return res.status(403).json({ error: "No tienes permiso para eliminar ventas." });
    if (actor.role !== "admin" && sale.sellerId !== actor.id) return res.status(403).json({ error: "Solo puedes eliminar tus propias ventas." });
    const inventory = await listRecords("inventory");
    const restored = [];
    const movements = [];
    for (const item of sale.items || []) {
      const stock = inventory.find((record) => record.storeId === sale.storeId && record.variantId === item.variantId);
      if (!stock) continue;
      const inventoryId = stock.id;
      const updated = { ...stock, quantity: stock.quantity + item.quantity, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      restored.push(updated);
      movements.push({
        id: `mov-${Date.now()}-${movements.length}`,
        inventoryId,
        storeId: updated.storeId,
        storeName: updated.storeName,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        type: "return",
        quantity: item.quantity,
        previousQuantity: stock.quantity,
        newQuantity: updated.quantity,
        reason: "Venta eliminada; inventario restaurado",
        referenceId: sale.id,
        userId: actor?.id || session.sub,
        userName: actor?.name || session.email,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    await applyRecordTransaction([
      ...restored.map((record) => ({ collection: "inventory", record })),
      ...movements.map((record) => ({ collection: "inventory_movements", record }))
    ], [{ collection: "daily_sales", id: sale.id }]);
    broadcastSyncEvent("SALE_DELETED", { id: sale.id, inventory: restored, movements });
    res.json({ success: true, id: sale.id, inventory: restored, movements: actor.role === "vendedor" ? [] : movements });
  }));
  app.get("/api/sync", asyncRoute(async (req, res) => {
    const session = res.locals.session;
    const actor = await findRecord("users", session.sub);
    if (!actor) return res.status(401).json({ error: "El usuario de la sesi\xF3n ya no existe." });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: "INIT_CONNECTED", message: "Sincronizaci\xF3n en tiempo real activa" })}

`);
    const heartbeat = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 25e3);
    sseClients.set(res, actor.role);
    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  }));
  app.get("/api/users", asyncRoute(async (_req, res) => {
    res.json((await listRecords("users")).map(sanitizeUser));
  }));
  app.post("/api/users", asyncRoute(async (req, res) => {
    const normalizedEmail = String(req.body.email || "empleado@stonerscolombia.com").toLowerCase();
    const existing = await findRecordByField("users", "email", normalizedEmail);
    if (existing) {
      const updated = {
        ...existing,
        ...req.body,
        id: existing.id,
        email: normalizedEmail,
        role: normalizeUserRole(req.body.role ?? existing.role),
        department: normalizeDepartment(req.body.department ?? existing.department),
        ...req.body.pinCode ? { pinHash: hashPin(String(req.body.pinCode)) } : {}
      };
      delete updated.pinCode;
      await upsertRecord("users", updated);
      const safeUser2 = sanitizeUser(updated);
      broadcastSyncEvent("USER_UPDATED", safeUser2);
      return res.json(safeUser2);
    }
    const newUser = {
      id: req.body.id || `usr-${Date.now()}`,
      name: req.body.name || "Nuevo Empleado",
      email: normalizedEmail,
      role: normalizeUserRole(req.body.role),
      department: normalizeDepartment(req.body.department),
      avatar: req.body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
      productivityScore: 100,
      tasksCompletedThisMonth: 0,
      lastActive: "Ahora mismo",
      phone: req.body.phone || "+57 300 000 0000",
      pinHash: req.body.pinCode ? hashPin(String(req.body.pinCode)) : void 0,
      storeIds: req.body.storeIds || []
    };
    await upsertRecord("users", newUser);
    const safeUser = sanitizeUser(newUser);
    broadcastSyncEvent("USER_CREATED", safeUser);
    res.status(201).json(safeUser);
  }));
  app.get("/api/tasks", asyncRoute(async (_req, res) => {
    res.json(await listRecords("tasks"));
  }));
  app.post("/api/tasks", asyncRoute(async (req, res) => {
    const users = await listRecords("users");
    const newTask = {
      id: req.body.id || `task-${Date.now()}`,
      code: req.body.code || `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: req.body.title || "Nueva Tarea Operativa",
      description: req.body.description || "",
      department: normalizeDepartment(req.body.department),
      priority: req.body.priority || "medium",
      status: req.body.status || "pending",
      assignedToId: req.body.assignedToId || users[0]?.id || "",
      assignedToName: req.body.assignedToName || users[0]?.name || "Sin asignar",
      assignedToAvatar: req.body.assignedToAvatar,
      assignedById: req.body.assignedById || "usr-1",
      assignedByName: req.body.assignedByName || "Admin Stoners",
      createdDate: req.body.createdDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: req.body.dueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      estimatedHours: Number(req.body.estimatedHours) || 2,
      actualHours: Number(req.body.actualHours) || 0,
      subtasks: req.body.subtasks || [],
      sopId: req.body.sopId,
      sopTitle: req.body.sopTitle,
      notes: req.body.notes || [],
      isDaily: Boolean(req.body.isDaily),
      dailyStartTime: req.body.dailyStartTime,
      dailyEndTime: req.body.dailyEndTime,
      lastCompletedDate: req.body.lastCompletedDate
    };
    await upsertRecord("tasks", newTask);
    const notif = {
      id: `notif-${Date.now()}`,
      userId: newTask.assignedToId,
      title: "Nueva Tarea Asignada",
      message: `Se te ha asignado la tarea: ${newTask.title}`,
      timestamp: "Ahora mismo",
      type: "task_assigned",
      read: false,
      linkId: newTask.id
    };
    await upsertRecord("notifications", notif);
    broadcastSyncEvent("TASK_CREATED", newTask);
    broadcastSyncEvent("NOTIFICATION_NEW", notif);
    res.status(201).json(newTask);
  }));
  app.put("/api/tasks/:id", asyncRoute(async (req, res) => {
    const taskId = req.params.id;
    const task = await findRecord("tasks", taskId);
    if (!task) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    const updated = { ...task, ...req.body, id: task.id };
    await upsertRecord("tasks", updated);
    broadcastSyncEvent("TASK_UPDATED", updated);
    res.json(updated);
  }));
  app.delete("/api/tasks/:id", asyncRoute(async (req, res) => {
    const taskId = req.params.id;
    await deleteRecord("tasks", taskId);
    broadcastSyncEvent("TASK_DELETED", { id: taskId });
    res.json({ success: true, id: taskId });
  }));
  app.get("/api/sops", asyncRoute(async (_req, res) => {
    res.json(await listRecords("sops"));
  }));
  app.post("/api/sops", asyncRoute(async (req, res) => {
    const newSOP = {
      id: req.body.id || `sop-${Date.now()}`,
      code: req.body.code || `SOP-${(req.body.department || "DISP").substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      title: req.body.title || "Nuevo Protocolo Operativo",
      department: normalizeDepartment(req.body.department),
      minRoleRequired: normalizeUserRole(req.body.minRoleRequired),
      version: req.body.version || "1.0",
      lastUpdated: req.body.lastUpdated || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      summary: req.body.summary || "",
      category: req.body.category || "General",
      steps: req.body.steps || [],
      acknowledgedBy: req.body.acknowledgedBy || []
    };
    await upsertRecord("sops", newSOP);
    broadcastSyncEvent("SOP_CREATED", newSOP);
    res.status(201).json(newSOP);
  }));
  app.get("/api/kpis", asyncRoute(async (_req, res) => {
    res.json({
      kpis: [],
      goals: await listRecords("goals")
    });
  }));
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { prompt, actionType, contextData } = req.body;
      const ai = getGenAI();
      let systemPrompt = `Eres el Asistente Virtual de Operaciones e Inteligencia de Ventas de Stoners Colombia.
Tu objetivo es ayudar a los empleados y vendedores a conocer exactamente qu\xE9 tareas tienen pendientes, cu\xE1ntas ventas o dinero les falta para alcanzar su meta de ventas, y brindar recomendaciones estrat\xE9gicas y de productividad.
Responde de forma clara, directa, profesional, motivadora y estructurada en espa\xF1ol. Utiliza emojis y vi\xF1etas para que la informaci\xF3n sea f\xE1cil de leer.`;
      if (contextData) {
        systemPrompt += `

--- DATOS Y METRICAS EN TIEMPO REAL DEL VENDEDOR / USUARIO ---
- Usuario Activo: ${contextData.userName || "Vendedor"} (${contextData.userRole || "Empleado"}, \xC1rea: ${contextData.department || "Ventas"})

\u{1F4CB} RESUMEN DE TAREAS PENDIENTES (${contextData.pendingTasksCount || 0} tareas en total):
${contextData.pendingTasksSummary || "\u2022 No tiene tareas pendientes en este momento."}

\u{1F4B0} METRICAS Y META DE VENTAS DEL MES ACTUAL:
- Presupuesto / Meta de Ventas Mensual: ${contextData.salesBudgetFormatted || "$0 COP"}
- Ventas Logradas a la Fecha: ${contextData.totalSalesFormatted || "$0 COP"} (${contextData.salesCount || 0} ventas/transacciones registradas)
- Porcentaje de Cumplimiento: ${contextData.progressPercentage || 0}%
- Dinero Faltante para Lograr la Meta: ${contextData.missingMoneyFormatted || "$0 COP"}
- Ticket Promedio por Venta: ${contextData.avgTicketFormatted || "$0 COP"}
- Estimaci\xF3n de Ventas Requeridas Faltantes: ${contextData.missingSalesCount || 0} ventas (basado en el ticket promedio)
- D\xEDas Restantes del Mes: ${contextData.daysRemainingInMonth || 1} d\xEDas
- Venta Diaria Promedio Requerida: ${contextData.requiredDailySalesAmountFormatted || "$0 COP"} por d\xEDa

Instrucciones espec\xEDficas para responder:
1. Si te preguntan sobre tareas pendientes, enumera exactamente sus tareas, indicando claramente si hay tareas diarias activas (6am a 9pm) y su prioridad.
2. Si te preguntan sobre su meta de ventas, dinero o ventas faltantes, da las cifras exactas con formato de pesos colombianos ($ COP), menciona cu\xE1ntas ventas le faltan por hacer aproximadamente y cu\xE1nto debe vender al d\xEDa.
3. Si solicitan sugerencias o estrategias, dales 2 a 3 t\xE1cticas clave de ventas (ej: seguimiento a clientes de WhatsApp, venta cruzada en tienda, promocionar productos de mayor rotaci\xF3n).`;
      }
      if (actionType === "generate_sop") {
        systemPrompt += " Genera un objeto JSON estricto con las propiedades 'title', 'summary', 'category', 'steps' (array con stepNumber, title, description, isCritical).";
      }
      if (!ai) {
        let simResponse = "";
        if (contextData) {
          const name = contextData.userName || "Vendedor";
          const pendingCount = contextData.pendingTasksCount || 0;
          const missingMoney = contextData.missingMoneyFormatted || "$0 COP";
          const missingSales = contextData.missingSalesCount || 0;
          const dailyTarget = contextData.requiredDailySalesAmountFormatted || "$0 COP";
          if (prompt.toLowerCase().includes("tarea")) {
            simResponse = `Hola ${name}, aqu\xED tienes el desglose de tus tareas pendientes:

\u{1F4CB} Tienes **${pendingCount} tareas pendientes** asignadas:
` + (contextData.pendingTasksSummary || "No hay tareas pendientes en este momento.") + `

\u{1F4A1} **Recomendaci\xF3n:** Prioriza completar primero las tareas marcadas como 'Diaria (6am-9pm)' antes del cierre del turno.`;
          } else if (prompt.toLowerCase().includes("dinero") || prompt.toLowerCase().includes("meta") || prompt.toLowerCase().includes("ventas")) {
            simResponse = `Hola ${name}, este es el estado de tu objetivo de ventas:

\u{1F3AF} **Meta Mensual:** ${contextData.salesBudgetFormatted || "$0 COP"}
\u{1F4B5} **Vendido a la fecha:** ${contextData.totalSalesFormatted || "$0 COP"} (${contextData.progressPercentage || 0}% completado)
\u{1F6A9} **Dinero faltante:** ${missingMoney}
\u{1F6CD}\uFE0F **Ventas faltantes estimadas:** ~${missingSales} ventas (a un ticket promedio de ${contextData.avgTicketFormatted || "$0 COP"})
\u{1F4C5} **Cuota diaria requerida:** ${dailyTarget}/d\xEDa para los ${contextData.daysRemainingInMonth || 1} d\xEDas restantes.

\u{1F680} **Estrategia sugerida:** Impulsa combos y ventas por WhatsApp para cerrar m\xE1s r\xE1pido la diferencia.`;
          } else {
            simResponse = `Hola ${name}, con gusto te ayudo. Actualmente tienes ${pendingCount} tareas pendientes y te faltan ${missingMoney} (~${missingSales} ventas) para alcanzar tu meta de ventas del mes.`;
          }
        } else {
          simResponse = "Asistente Operativo listo. \xBFEn qu\xE9 puedo colaborarte hoy?";
        }
        return res.json({
          result: simResponse,
          generatedSOP: actionType === "generate_sop" ? {
            title: `SOP: ${prompt}`,
            summary: "Procedimiento operativo est\xE1ndar para control de calidad en Stoners Colombia.",
            steps: [
              { stepNumber: 1, title: "Inspecci\xF3n de Bioseguridad", description: "Verificar equipos de protecci\xF3n.", isCritical: true },
              { stepNumber: 2, title: "Registro en Bit\xE1cora", description: "Anotar hora y personal encargado.", isCritical: false },
              { stepNumber: 3, title: "Verificaci\xF3n del producto", description: "Confirmar c\xF3digo de barras y empaque.", isCritical: true }
            ]
          } : null
        });
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt
        }
      });
      const responseText = response.text || "No se pudo generar respuesta de IA.";
      res.json({
        result: responseText,
        actionType
      });
    } catch (err) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Error procesando solicitud de IA", details: err.message });
    }
  });
  app.use("/api", (err, _req, res, _next) => {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    console.error("API Error:", err);
    res.status(500).json({ error: message });
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Ruta de API no encontrada." });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const frontendUrl = process.env.FRONTEND_URL || "https://lizethvictoria20.github.io/stonersApp/";
    app.get("*", (req, res) => {
      const relativePath = req.path === "/" ? "" : req.path.replace(/^\//, "");
      res.redirect(302, new URL(relativePath, frontendUrl).toString());
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Stoners Colombia Ops Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
