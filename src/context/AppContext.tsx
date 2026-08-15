import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, SOPProcedure, KPIMetric, Goal, NotificationItem, ActivityLog, Department, SalesBudget, DailySale, Store } from '../types';
import { INITIAL_USERS, INITIAL_TASKS, INITIAL_SOPS, INITIAL_KPIS, INITIAL_GOALS, INITIAL_NOTIFICATIONS, INITIAL_ACTIVITY_LOGS, INITIAL_SALES_BUDGETS, INITIAL_DAILY_SALES, INITIAL_STORES } from '../data/initialData';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  fetchRecentGmailMessages, 
  GmailMessageSummary 
} from '../lib/googleAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'productivityScore' | 'tasksCompletedThisMonth' | 'lastActive'>) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'code' | 'createdDate' | 'actualHours' | 'notes'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  importTasksFromExcel: (newTasks: Task[]) => void;
  sops: SOPProcedure[];
  addSOP: (sop: Omit<SOPProcedure, 'id' | 'code' | 'lastUpdated' | 'acknowledgedBy'>) => void;
  acknowledgeSOP: (sopId: string) => void;
  kpis: KPIMetric[];
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'progressPercentage' | 'status'>) => void;
  salesBudgets: SalesBudget[];
  addOrUpdateSalesBudget: (budget: Omit<SalesBudget, 'id'>) => void;
  deleteSalesBudget: (id: string) => void;
  dailySales: DailySale[];
  addDailySale: (sale: Omit<DailySale, 'id' | 'timestamp'>) => void;
  updateDailySale: (id: string, updates: Partial<DailySale>) => void;
  deleteDailySale: (id: string) => void;
  stores: Store[];
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  assignSellersToStore: (storeId: string, sellerIds: string[]) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markAsRead: (notifId: string) => void;
  markAllAsRead: () => void;
  activityLogs: ActivityLog[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTab: 'dashboard' | 'tasks' | 'sops' | 'kpis' | 'team' | 'exports' | 'supabase_cloud' | 'sales' | 'stores';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'sops' | 'kpis' | 'team' | 'exports' | 'supabase_cloud' | 'sales' | 'stores') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDeptFilter: Department | 'all';
  setSelectedDeptFilter: (dept: Department | 'all') => void;
  isSyncing: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;

  // Google & Gmail Integration
  googleUser: FirebaseUser | null;
  googleAccessToken: string | null;
  isGoogleLoading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutGoogle: () => Promise<void>;
  gmailMessages: GmailMessageSummary[];
  refreshGmailMessages: () => Promise<void>;
  isFetchingGmail: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CLEAN_DATA_VERSION = 'verified-data-v1';
const DATA_STORAGE_KEYS = [
  'stoners_users',
  'stoners_active_user',
  'stoners_tasks',
  'stoners_sops',
  'stoners_notifications',
  'stoners_activities',
  'stoners_goals',
  'stoners_sales_budgets',
  'stoners_daily_sales',
  'stoners_stores',
];

const BOOTSTRAP_USER: User = {
  id: 'bootstrap-user',
  name: 'Configuración inicial',
  email: '',
  role: 'admin',
  department: 'admin',
  avatar: '',
  productivityScore: 0,
  tasksCompletedThisMonth: 0,
  lastActive: 'Pendiente de acceso',
  storeIds: [],
};

const clearLegacyDemoData = () => {
  if (localStorage.getItem('stoners_data_version') === CLEAN_DATA_VERSION) return;
  DATA_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem('stoners_data_version', CLEAN_DATA_VERSION);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  clearLegacyDemoData();

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('stoners_users');
    if (saved) {
      try {
        return JSON.parse(saved) as User[];
      } catch (e) {}
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('stoners_active_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as User;
      } catch (e) {}
    }
    return BOOTSTRAP_USER;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('stoners_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // Daily Tasks Auto-Reset Effect for new calendar days
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => {
      if (t.isDaily && t.lastCompletedDate && t.lastCompletedDate !== todayStr) {
        // Reset task for the new day
        return {
          ...t,
          status: 'pending',
          subtasks: t.subtasks.map(s => ({ ...s, completed: false }))
        };
      }
      return t;
    }));
  }, []);

  const [sops, setSops] = useState<SOPProcedure[]>(() => {
    const saved = localStorage.getItem('stoners_sops');
    return saved ? JSON.parse(saved) : INITIAL_SOPS;
  });

  const [kpis] = useState<KPIMetric[]>(INITIAL_KPIS);

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('stoners_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [salesBudgets, setSalesBudgets] = useState<SalesBudget[]>(() => {
    const saved = localStorage.getItem('stoners_sales_budgets');
    return saved ? JSON.parse(saved) : INITIAL_SALES_BUDGETS;
  });

  const [dailySales, setDailySales] = useState<DailySale[]>(() => {
    const saved = localStorage.getItem('stoners_daily_sales');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_SALES;
  });

  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('stoners_stores');
    return saved ? JSON.parse(saved) : INITIAL_STORES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('stoners_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('stoners_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('stoners_theme') as 'dark' | 'light') || 'light';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'sops' | 'kpis' | 'team' | 'exports' | 'supabase_cloud' | 'sales' | 'stores'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<Department | 'all'>('all');
  const [isSyncing, setIsSyncing] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Google Auth & Gmail Integration State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [isFetchingGmail, setIsFetchingGmail] = useState<boolean>(false);

  // Fetch operational emails from Gmail
  const refreshGmailMessages = async () => {
    if (!googleAccessToken) return;
    setIsFetchingGmail(true);
    try {
      const msgs = await fetchRecentGmailMessages(googleAccessToken, 10);
      setGmailMessages(msgs);
    } catch (err) {
      console.error('Error al obtener correos de Gmail:', err);
    } finally {
      setIsFetchingGmail(false);
    }
  };

  // Setup Firebase Auth listener on startup
  useEffect(() => {
    const unsubscribe = initAuth(
      (fbUser, token) => {
        setGoogleUser(fbUser);
        if (token) {
          setGoogleAccessToken(token);
          fetchRecentGmailMessages(token, 8).then(msgs => {
            if (msgs && msgs.length > 0) setGmailMessages(msgs);
          }).catch(console.error);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setGmailMessages([]);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Google Sign In action
  const signInWithGoogle = async (): Promise<User | null> => {
    setIsGoogleLoading(true);
    try {
      const result = await googleSignIn();
      setGoogleUser(result.user);
      if (result.accessToken) {
        setGoogleAccessToken(result.accessToken);
        fetchRecentGmailMessages(result.accessToken, 10).then(setGmailMessages).catch(console.error);
      }

      const email = (result.user.email || '').toLowerCase();
      const displayName = result.user.displayName || 'Usuario Google';
      const photoURL = result.user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';

      // Check if user already exists
      let matchedUser = users.find(u => u.email.toLowerCase() === email || u.name.toLowerCase() === displayName.toLowerCase());

      // The first real account bootstraps the clean workspace as administrator.
      const isAdminEmail = users.length === 0 || email.includes('liz') || email.includes('santiago') || email === 'lizethvictoria755@gmail.com' || displayName.toLowerCase().includes('liz') || displayName.toLowerCase().includes('santiago');

      if (matchedUser) {
        // Upgrade / Update user details
        const updated: User = {
          ...matchedUser,
          avatar: photoURL || matchedUser.avatar,
          role: isAdminEmail ? 'admin' : matchedUser.role,
          department: isAdminEmail ? 'admin' : matchedUser.department
        };
        setCurrentUser(updated);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        matchedUser = updated;
      } else {
        // Create new user linked to Google Account
        const newUser: User = {
          id: `usr-g-${result.user.uid.slice(0, 8)}`,
          name: displayName,
          email: result.user.email || 'usuario@stonerscolombia.com',
          role: isAdminEmail ? 'admin' : 'vendedor',
          department: isAdminEmail ? 'admin' : 'sales',
          avatar: photoURL,
          productivityScore: 100,
          tasksCompletedThisMonth: 0,
          lastActive: 'Ahora mismo',
          phone: result.user.phoneNumber || '+57 300 000 0000',
          pinCode: '1234',
          storeIds: []
        };
        setUsers(prev => [newUser, ...prev]);
        setCurrentUser(newUser);
        matchedUser = newUser;
      }

      // Add audit log and notification
      const notif: NotificationItem = {
        id: `notif-g-${Date.now()}`,
        userId: matchedUser.id,
        title: 'Inicio de Sesión con Google',
        message: `Autenticación exitosa con la cuenta de Gmail (${result.user.email}).`,
        timestamp: 'Ahora mismo',
        type: 'system',
        read: false
      };
      setNotifications(prev => [notif, ...prev]);

      return matchedUser;
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google Sign Out action
  const signOutGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      setGmailMessages([]);
    } catch (err) {
      console.error('Error al cerrar sesión de Google:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('stoners_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('stoners_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser.id === BOOTSTRAP_USER.id) {
      localStorage.removeItem('stoners_active_user');
    } else {
      localStorage.setItem('stoners_active_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('stoners_sops', JSON.stringify(sops));
  }, [sops]);

  useEffect(() => {
    localStorage.setItem('stoners_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('stoners_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('stoners_sales_budgets', JSON.stringify(salesBudgets));
  }, [salesBudgets]);

  useEffect(() => {
    localStorage.setItem('stoners_daily_sales', JSON.stringify(dailySales));
  }, [dailySales]);

  useEffect(() => {
    localStorage.setItem('stoners_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('stoners_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Connect to SSE Server for real-time multi-device sync
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync');
      eventSource.onopen = () => setIsSyncing(true);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TASK_CREATED') {
            setTasks(prev => [data.payload, ...prev.filter(t => t.id !== data.payload.id)]);
          } else if (data.type === 'TASK_UPDATED') {
            setTasks(prev => prev.map(t => t.id === data.payload.id ? data.payload : t));
          } else if (data.type === 'NOTIFICATION_NEW') {
            setNotifications(prev => [data.payload, ...prev]);
          }
        } catch (e) {
          console.warn('SSE Parse error', e);
        }
      };
      eventSource.onerror = () => {
        setIsSyncing(false);
      };
    } catch (err) {
      setIsSyncing(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const logActivity = (action: string, details: string, dept: Department) => {
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      timestamp: new Date().toLocaleString('es-CO'),
      department: dept
    };
    setActivityLogs(prev => [newAct, ...prev]);
  };

  const addTask = (newTaskData: Omit<Task, 'id' | 'code' | 'createdDate' | 'actualHours' | 'notes'>) => {
    const codeNumber = Math.floor(100 + Math.random() * 900);
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      code: `TSK-${codeNumber}`,
      createdDate: new Date().toISOString().split('T')[0],
      actualHours: 0,
      notes: []
    };

    setTasks(prev => [newTask, ...prev]);

    // Send notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: newTask.assignedToId,
      title: 'Nueva Tarea Asignada',
      message: `Se te ha asignado la tarea: ${newTask.title}`,
      timestamp: 'Ahora mismo',
      type: 'task_assigned',
      read: false,
      linkId: newTask.id
    };
    setNotifications(prev => [newNotif, ...prev]);

    logActivity('Creación de Tarea', `Creó la tarea ${newTask.code}: ${newTask.title}`, newTask.department);

    // Call server API asynchronously
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    }).catch(e => console.warn('Server sync error', e));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const todayStr = new Date().toISOString().split('T')[0];

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        let finalUpdates = { ...updates };
        if (updates.status === 'completed') {
          finalUpdates.lastCompletedDate = todayStr;
        } else if (updates.status && t.isDaily) {
          if (t.lastCompletedDate === todayStr) {
            finalUpdates.lastCompletedDate = '';
          }
        }

        const updated = { ...t, ...finalUpdates };
        if (updates.status === 'completed' && t.status !== 'completed') {
          logActivity('Tarea Completada', `Marcó como completada la tarea ${t.code}`, t.department);
        }
        return updated;
      }
      return t;
    }));

    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(e => console.warn('Server sync error', e));
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      logActivity('Tarea Eliminada', `Eliminó la tarea ${taskToDelete.code}`, taskToDelete.department);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));

    fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    }).catch(e => console.warn('Server sync error', e));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);

        return {
          ...t,
          subtasks: updatedSubtasks,
          status: allDone ? 'completed' : (t.status === 'completed' ? 'in_progress' : t.status),
          lastCompletedDate: allDone ? todayStr : (t.lastCompletedDate === todayStr && !allDone ? '' : t.lastCompletedDate)
        };
      }
      return t;
    }));
  };

  const importTasksFromExcel = (importedTasks: Task[]) => {
    setTasks(prev => [...importedTasks, ...prev]);
    logActivity('Importación Masiva', `Importó ${importedTasks.length} tareas desde Excel/CSV`, currentUser.department);
  };

  const addUser = (userData: Omit<User, 'id' | 'productivityScore' | 'tasksCompletedThisMonth' | 'lastActive'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      productivityScore: 100,
      tasksCompletedThisMonth: 0,
      lastActive: 'Nuevo ingreso'
    };
    setUsers(prev => [...prev, newUser]);
    logActivity('Usuario Creado', `Registró al colaborador ${newUser.name} como ${newUser.role}`, newUser.department);
  };

  const addSOP = (sopData: Omit<SOPProcedure, 'id' | 'code' | 'lastUpdated' | 'acknowledgedBy'>) => {
    const code = `SOP-${sopData.department.substring(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newSOP: SOPProcedure = {
      ...sopData,
      id: `sop-${Date.now()}`,
      code,
      lastUpdated: new Date().toISOString().split('T')[0],
      acknowledgedBy: []
    };
    setSops(prev => [newSOP, ...prev]);
    logActivity('Nuevo SOP Publicado', `Publicó el manual ${newSOP.code}: ${newSOP.title}`, newSOP.department);
  };

  const acknowledgeSOP = (sopId: string) => {
    setSops(prev => prev.map(sop => {
      if (sop.id === sopId) {
        const already = sop.acknowledgedBy.some(a => a.userId === currentUser.id);
        if (already) return sop;
        const updatedAck = [
          ...sop.acknowledgedBy,
          { userId: currentUser.id, userName: currentUser.name, timestamp: new Date().toLocaleString('es-CO') }
        ];
        return { ...sop, acknowledgedBy: updatedAck };
      }
      return sop;
    }));
    logActivity('Firma de Conformidad SOP', `Firmó conformidad para el manual ${sopId}`, currentUser.department);
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'progressPercentage' | 'status'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      progressPercentage: 0,
      status: 'active'
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const addOrUpdateSalesBudget = (budgetData: Omit<SalesBudget, 'id'>) => {
    setSalesBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.sellerId === budgetData.sellerId && b.month === budgetData.month);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          targetAmount: budgetData.targetAmount,
          notes: budgetData.notes,
          sellerName: budgetData.sellerName
        };
        return updated;
      } else {
        const newBudget: SalesBudget = {
          ...budgetData,
          id: `bg-${Date.now()}`
        };
        return [newBudget, ...prev];
      }
    });

    logActivity('Presupuesto Asignado', `Asignó presupuesto mensual de ${budgetData.targetAmount.toLocaleString()} COP a ${budgetData.sellerName}`, 'admin');
  };

  const deleteSalesBudget = (id: string) => {
    setSalesBudgets(prev => prev.filter(b => b.id !== id));
    logActivity('Presupuesto Eliminado', `Eliminó registro de presupuesto ID ${id}`, 'admin');
  };

  const addDailySale = (saleData: Omit<DailySale, 'id' | 'timestamp'>) => {
    const newSale: DailySale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      timestamp: new Date().toLocaleString('es-CO')
    };
    setDailySales(prev => [newSale, ...prev]);
    logActivity('Registro de Venta', `Vendedor ${saleData.sellerName} registró venta de $${saleData.amount.toLocaleString()} por canal ${saleData.channel}`, 'sales');
  };

  const updateDailySale = (id: string, updates: Partial<DailySale>) => {
    setDailySales(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logActivity('Venta Actualizada', `Modificó datos de venta ID ${id}`, 'sales');
  };

  const deleteDailySale = (id: string) => {
    setDailySales(prev => prev.filter(s => s.id !== id));
    logActivity('Venta Eliminada', `Eliminó registro de venta ID ${id}`, 'sales');
  };

  const addStore = (storeData: Omit<Store, 'id'>) => {
    const newStore: Store = {
      ...storeData,
      id: `str-${Date.now()}`
    };
    setStores(prev => [...prev, newStore]);
    logActivity('Sede Creada', `Registró la sede ${newStore.name} (${newStore.city})`, 'admin');
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    logActivity('Sede Actualizada', `Actualizó información de la sede ID ${id}`, 'admin');
  };

  const deleteStore = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
    logActivity('Sede Eliminada', `Eliminó la sede ID ${id}`, 'admin');
  };

  const assignSellersToStore = (storeId: string, sellerIds: string[]) => {
    const targetStore = stores.find(s => s.id === storeId);
    if (!targetStore) return;

    // Update store assigned sellers
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, assignedSellerIds: sellerIds } : s));

    // Also update users storeIds
    setUsers(prev => prev.map(u => {
      const currentStoreIds = u.storeIds || [];
      if (sellerIds.includes(u.id)) {
        if (!currentStoreIds.includes(storeId)) {
          return { ...u, storeIds: [...currentStoreIds, storeId] };
        }
      } else {
        if (currentStoreIds.includes(storeId)) {
          return { ...u, storeIds: currentStoreIds.filter(id => id !== storeId) };
        }
      }
      return u;
    }));

    logActivity('Asignación de Vendedores', `Actualizó vendedores asignados a ${targetStore.name} (${sellerIds.length} vendedores)`, 'admin');
  };

  const markAsRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read && n.userId === currentUser.id).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        addUser,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleSubtask,
        importTasksFromExcel,
        sops,
        addSOP,
        acknowledgeSOP,
        kpis,
        goals,
        addGoal,
        salesBudgets,
        addOrUpdateSalesBudget,
        deleteSalesBudget,
        dailySales,
        addDailySale,
        updateDailySale,
        deleteDailySale,
        stores,
        addStore,
        updateStore,
        deleteStore,
        assignSellersToStore,
        notifications,
        unreadNotificationCount,
        markAsRead,
        markAllAsRead,
        activityLogs,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedDeptFilter,
        setSelectedDeptFilter,
        isSyncing,
        soundEnabled,
        setSoundEnabled,
        googleUser,
        googleAccessToken,
        isGoogleLoading,
        signInWithGoogle,
        signOutGoogle,
        gmailMessages,
        refreshGmailMessages,
        isFetchingGmail
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
