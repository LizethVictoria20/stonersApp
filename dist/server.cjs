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
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// src/data/initialData.ts
var INITIAL_USERS = [];
var INITIAL_SOPS = [];
var INITIAL_TASKS = [];
var INITIAL_KPIS = [];
var INITIAL_GOALS = [];
var INITIAL_NOTIFICATIONS = [];
var INITIAL_ACTIVITY_LOGS = [];

// server.ts
var dbUsers = [...INITIAL_USERS];
var dbTasks = [...INITIAL_TASKS];
var dbSOPs = [...INITIAL_SOPS];
var dbKPIs = [...INITIAL_KPIS];
var dbGoals = [...INITIAL_GOALS];
var dbNotifications = [...INITIAL_NOTIFICATIONS];
var dbActivityLogs = [...INITIAL_ACTIVITY_LOGS];
var sseClients = /* @__PURE__ */ new Set();
function normalizeDepartment(value) {
  return value === "admin" || value === "accounting" || value === "sales" ? value : "sales";
}
function normalizeUserRole(value) {
  return value === "admin" || value === "contador" || value === "vendedor" ? value : "vendedor";
}
function broadcastSyncEvent(eventType, payload) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  sseClients.forEach((client) => {
    client.write(`data: ${data}

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
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      system: "Stoners Colombia - Control Operativo",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      activeTasks: dbTasks.length,
      activeUsers: dbUsers.length
    });
  });
  app.get("/api/sync", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: "INIT_CONNECTED", message: "Sincronizaci\xF3n en tiempo real activa" })}

`);
    const heartbeat = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 25e3);
    sseClients.add(res);
    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });
  app.get("/api/users", (req, res) => {
    res.json(dbUsers);
  });
  app.post("/api/users", (req, res) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      name: req.body.name || "Nuevo Empleado",
      email: req.body.email || "empleado@stonerscolombia.com",
      role: normalizeUserRole(req.body.role),
      department: normalizeDepartment(req.body.department),
      avatar: req.body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
      productivityScore: 100,
      tasksCompletedThisMonth: 0,
      lastActive: "Ahora mismo",
      phone: req.body.phone || "+57 300 000 0000",
      pinCode: req.body.pinCode || "1234"
    };
    dbUsers.push(newUser);
    broadcastSyncEvent("USER_CREATED", newUser);
    res.status(201).json(newUser);
  });
  app.get("/api/tasks", (req, res) => {
    res.json(dbTasks);
  });
  app.post("/api/tasks", (req, res) => {
    const newTask = {
      id: `task-${Date.now()}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: req.body.title || "Nueva Tarea Operativa",
      description: req.body.description || "",
      department: normalizeDepartment(req.body.department),
      priority: req.body.priority || "medium",
      status: req.body.status || "pending",
      assignedToId: req.body.assignedToId || dbUsers[0]?.id || "",
      assignedToName: req.body.assignedToName || dbUsers[0]?.name || "Sin asignar",
      assignedToAvatar: req.body.assignedToAvatar,
      assignedById: req.body.assignedById || "usr-1",
      assignedByName: req.body.assignedByName || "Admin Stoners",
      createdDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: req.body.dueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      estimatedHours: Number(req.body.estimatedHours) || 2,
      actualHours: 0,
      subtasks: req.body.subtasks || [],
      sopId: req.body.sopId,
      sopTitle: req.body.sopTitle,
      notes: []
    };
    dbTasks.unshift(newTask);
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
    dbNotifications.unshift(notif);
    broadcastSyncEvent("TASK_CREATED", newTask);
    broadcastSyncEvent("NOTIFICATION_NEW", notif);
    res.status(201).json(newTask);
  });
  app.put("/api/tasks/:id", (req, res) => {
    const taskId = req.params.id;
    const index = dbTasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }
    dbTasks[index] = { ...dbTasks[index], ...req.body };
    broadcastSyncEvent("TASK_UPDATED", dbTasks[index]);
    res.json(dbTasks[index]);
  });
  app.delete("/api/tasks/:id", (req, res) => {
    const taskId = req.params.id;
    dbTasks = dbTasks.filter((t) => t.id !== taskId);
    broadcastSyncEvent("TASK_DELETED", { id: taskId });
    res.json({ success: true, id: taskId });
  });
  app.get("/api/sops", (req, res) => {
    res.json(dbSOPs);
  });
  app.post("/api/sops", (req, res) => {
    const newSOP = {
      id: `sop-${Date.now()}`,
      code: `SOP-${(req.body.department || "DISP").substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      title: req.body.title || "Nuevo Protocolo Operativo",
      department: normalizeDepartment(req.body.department),
      minRoleRequired: normalizeUserRole(req.body.minRoleRequired),
      version: "1.0",
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      summary: req.body.summary || "",
      category: req.body.category || "General",
      steps: req.body.steps || [],
      acknowledgedBy: []
    };
    dbSOPs.unshift(newSOP);
    broadcastSyncEvent("SOP_CREATED", newSOP);
    res.status(201).json(newSOP);
  });
  app.get("/api/kpis", (req, res) => {
    res.json({
      kpis: dbKPIs,
      goals: dbGoals
    });
  });
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
              { stepNumber: 3, title: "Verificaci\xF3n de Lote", description: "Confirmar c\xF3digo de barras y empaque.", isCritical: true }
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Stoners Colombia Ops Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
