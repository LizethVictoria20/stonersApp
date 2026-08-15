import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { INITIAL_USERS, INITIAL_TASKS, INITIAL_SOPS, INITIAL_KPIS, INITIAL_GOALS, INITIAL_NOTIFICATIONS, INITIAL_ACTIVITY_LOGS } from "./src/data/initialData";
import { Task, SOPProcedure, User, Goal, NotificationItem, ActivityLog, Department, UserRole } from "./src/types";

// In-memory data store for Express server endpoints
let dbUsers: User[] = [...INITIAL_USERS];
let dbTasks: Task[] = [...INITIAL_TASKS];
let dbSOPs: SOPProcedure[] = [...INITIAL_SOPS];
let dbKPIs = [...INITIAL_KPIS];
let dbGoals: Goal[] = [...INITIAL_GOALS];
let dbNotifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let dbActivityLogs: ActivityLog[] = [...INITIAL_ACTIVITY_LOGS];

// Connected SSE clients for real-time sync
const sseClients = new Set<express.Response>();

function normalizeDepartment(value: unknown): Department {
  return value === "admin" || value === "accounting" || value === "sales" ? value : "sales";
}

function normalizeUserRole(value: unknown): UserRole {
  return value === "admin" || value === "contador" || value === "vendedor" ? value : "vendedor";
}

function broadcastSyncEvent(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() });
  sseClients.forEach((client) => {
    client.write(`data: ${data}\n\n`);
  });
}

// Lazy initialization for Gemini AI SDK
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // 1. API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      system: "Stoners Colombia - Control Operativo",
      timestamp: new Date().toISOString(),
      activeTasks: dbTasks.length,
      activeUsers: dbUsers.length
    });
  });

  // 2. Real-time Synchronization SSE Stream
  app.get("/api/sync", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send initial ping
    res.write(`data: ${JSON.stringify({ type: "INIT_CONNECTED", message: "Sincronización en tiempo real activa" })}\n\n`);

    sseClients.add(res);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  // 3. User Endpoints
  app.get("/api/users", (req, res) => {
    res.json(dbUsers);
  });

  app.post("/api/users", (req, res) => {
    const newUser: User = {
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

  // 4. Task Endpoints
  app.get("/api/tasks", (req, res) => {
    res.json(dbTasks);
  });

  app.post("/api/tasks", (req, res) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: req.body.title || "Nueva Tarea Operativa",
      description: req.body.description || "",
      department: normalizeDepartment(req.body.department),
      priority: req.body.priority || "medium",
      status: req.body.status || "pending",
      assignedToId: req.body.assignedToId || dbUsers[0]?.id || '',
      assignedToName: req.body.assignedToName || dbUsers[0]?.name || 'Sin asignar',
      assignedToAvatar: req.body.assignedToAvatar,
      assignedById: req.body.assignedById || "usr-1",
      assignedByName: req.body.assignedByName || "Admin Stoners",
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: req.body.dueDate || new Date().toISOString().split("T")[0],
      estimatedHours: Number(req.body.estimatedHours) || 2,
      actualHours: 0,
      subtasks: req.body.subtasks || [],
      sopId: req.body.sopId,
      sopTitle: req.body.sopTitle,
      notes: []
    };

    dbTasks.unshift(newTask);

    // Create Notification for assigned user
    const notif: NotificationItem = {
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

  // 5. SOP Procedures Endpoints
  app.get("/api/sops", (req, res) => {
    res.json(dbSOPs);
  });

  app.post("/api/sops", (req, res) => {
    const newSOP: SOPProcedure = {
      id: `sop-${Date.now()}`,
      code: `SOP-${(req.body.department || "DISP").substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      title: req.body.title || "Nuevo Protocolo Operativo",
      department: normalizeDepartment(req.body.department),
      minRoleRequired: normalizeUserRole(req.body.minRoleRequired),
      version: "1.0",
      lastUpdated: new Date().toISOString().split("T")[0],
      summary: req.body.summary || "",
      category: req.body.category || "General",
      steps: req.body.steps || [],
      acknowledgedBy: []
    };

    dbSOPs.unshift(newSOP);
    broadcastSyncEvent("SOP_CREATED", newSOP);
    res.status(201).json(newSOP);
  });

  // 6. KPIs & Goals
  app.get("/api/kpis", (req, res) => {
    res.json({
      kpis: dbKPIs,
      goals: dbGoals
    });
  });

  // 7. Gemini AI Assistant Endpoint
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { prompt, actionType, contextData } = req.body;
      const ai = getGenAI();

      let systemPrompt = `Eres el Asistente Virtual de Operaciones e Inteligencia de Ventas de Stoners Colombia.
Tu objetivo es ayudar a los empleados y vendedores a conocer exactamente qué tareas tienen pendientes, cuántas ventas o dinero les falta para alcanzar su meta de ventas, y brindar recomendaciones estratégicas y de productividad.
Responde de forma clara, directa, profesional, motivadora y estructurada en español. Utiliza emojis y viñetas para que la información sea fácil de leer.`;

      if (contextData) {
        systemPrompt += `\n\n--- DATOS Y METRICAS EN TIEMPO REAL DEL VENDEDOR / USUARIO ---
- Usuario Activo: ${contextData.userName || 'Vendedor'} (${contextData.userRole || 'Empleado'}, Área: ${contextData.department || 'Ventas'})

📋 RESUMEN DE TAREAS PENDIENTES (${contextData.pendingTasksCount || 0} tareas en total):
${contextData.pendingTasksSummary || '• No tiene tareas pendientes en este momento.'}

💰 METRICAS Y META DE VENTAS DEL MES ACTUAL:
- Presupuesto / Meta de Ventas Mensual: ${contextData.salesBudgetFormatted || '$0 COP'}
- Ventas Logradas a la Fecha: ${contextData.totalSalesFormatted || '$0 COP'} (${contextData.salesCount || 0} ventas/transacciones registradas)
- Porcentaje de Cumplimiento: ${contextData.progressPercentage || 0}%
- Dinero Faltante para Lograr la Meta: ${contextData.missingMoneyFormatted || '$0 COP'}
- Ticket Promedio por Venta: ${contextData.avgTicketFormatted || '$0 COP'}
- Estimación de Ventas Requeridas Faltantes: ${contextData.missingSalesCount || 0} ventas (basado en el ticket promedio)
- Días Restantes del Mes: ${contextData.daysRemainingInMonth || 1} días
- Venta Diaria Promedio Requerida: ${contextData.requiredDailySalesAmountFormatted || '$0 COP'} por día

Instrucciones específicas para responder:
1. Si te preguntan sobre tareas pendientes, enumera exactamente sus tareas, indicando claramente si hay tareas diarias activas (6am a 9pm) y su prioridad.
2. Si te preguntan sobre su meta de ventas, dinero o ventas faltantes, da las cifras exactas con formato de pesos colombianos ($ COP), menciona cuántas ventas le faltan por hacer aproximadamente y cuánto debe vender al día.
3. Si solicitan sugerencias o estrategias, dales 2 a 3 tácticas clave de ventas (ej: seguimiento a clientes de WhatsApp, venta cruzada en tienda, promocionar productos de mayor rotación).`;
      }

      if (actionType === "generate_sop") {
        systemPrompt += " Genera un objeto JSON estricto con las propiedades 'title', 'summary', 'category', 'steps' (array con stepNumber, title, description, isCritical).";
      }

      if (!ai) {
        // Fallback intelligent simulation response if Gemini API key is not present
        let simResponse = "";
        if (contextData) {
          const name = contextData.userName || "Vendedor";
          const pendingCount = contextData.pendingTasksCount || 0;
          const missingMoney = contextData.missingMoneyFormatted || "$0 COP";
          const missingSales = contextData.missingSalesCount || 0;
          const dailyTarget = contextData.requiredDailySalesAmountFormatted || "$0 COP";

          if (prompt.toLowerCase().includes("tarea")) {
            simResponse = `Hola ${name}, aquí tienes el desglose de tus tareas pendientes:\n\n` +
              `📋 Tienes **${pendingCount} tareas pendientes** asignadas:\n` +
              (contextData.pendingTasksSummary || "No hay tareas pendientes en este momento.") +
              `\n\n💡 **Recomendación:** Prioriza completar primero las tareas marcadas como 'Diaria (6am-9pm)' antes del cierre del turno.`;
          } else if (prompt.toLowerCase().includes("dinero") || prompt.toLowerCase().includes("meta") || prompt.toLowerCase().includes("ventas")) {
            simResponse = `Hola ${name}, este es el estado de tu objetivo de ventas:\n\n` +
              `🎯 **Meta Mensual:** ${contextData.salesBudgetFormatted || '$0 COP'}\n` +
              `💵 **Vendido a la fecha:** ${contextData.totalSalesFormatted || '$0 COP'} (${contextData.progressPercentage || 0}% completado)\n` +
              `🚩 **Dinero faltante:** ${missingMoney}\n` +
              `🛍️ **Ventas faltantes estimadas:** ~${missingSales} ventas (a un ticket promedio de ${contextData.avgTicketFormatted || '$0 COP'})\n` +
              `📅 **Cuota diaria requerida:** ${dailyTarget}/día para los ${contextData.daysRemainingInMonth || 1} días restantes.\n\n` +
              `🚀 **Estrategia sugerida:** Impulsa combos y ventas por WhatsApp para cerrar más rápido la diferencia.`;
          } else {
            simResponse = `Hola ${name}, con gusto te ayudo. Actualmente tienes ${pendingCount} tareas pendientes y te faltan ${missingMoney} (~${missingSales} ventas) para alcanzar tu meta de ventas del mes.`;
          }
        } else {
          simResponse = "Asistente Operativo listo. ¿En qué puedo colaborarte hoy?";
        }

        return res.json({
          result: simResponse,
          generatedSOP: actionType === "generate_sop" ? {
            title: `SOP: ${prompt}`,
            summary: "Procedimiento operativo estándar para control de calidad en Stoners Colombia.",
            steps: [
              { stepNumber: 1, title: "Inspección de Bioseguridad", description: "Verificar equipos de protección.", isCritical: true },
              { stepNumber: 2, title: "Registro en Bitácora", description: "Anotar hora y personal encargado.", isCritical: false },
              { stepNumber: 3, title: "Verificación de Lote", description: "Confirmar código de barras y empaque.", isCritical: true }
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

    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Error procesando solicitud de IA", details: err.message });
    }
  });

  // Mount Vite Middleware for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Stoners Colombia Ops Server running on http://localhost:${PORT}`);
  });
}

startServer();
