import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import {
  User, Task, SOPProcedure, KPIMetric, Goal, NotificationItem, ActivityLog, Department,
  SalesBudget, DailySale, Store, ProductCategory, Product, ProductVariant, ProductPrice,
  InventoryItem, InventoryMovement, InventoryMovementType,
} from '../types';
import { INITIAL_KPIS } from '../data/initialData';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  fetchRecentGmailMessages, 
  GmailMessageSummary 
} from '../lib/googleAuth';
import { User as FirebaseUser } from 'firebase/auth';
import { apiRequest, apiUrl, clearApiSessionToken, getApiSessionToken, setApiSessionToken } from '../lib/api';
import { ActiveTab, getTabFromCurrentRoute, navigateToTab } from '../lib/routes';

type PersistedCollection =
  | 'users' | 'tasks' | 'sops' | 'goals' | 'notifications' | 'activity_logs'
  | 'sales_budgets' | 'daily_sales' | 'stores' | 'product_categories' | 'products'
  | 'product_variants' | 'product_prices' | 'inventory' | 'inventory_movements';

interface BootstrapPayload {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  sops: SOPProcedure[];
  goals: Goal[];
  notifications: NotificationItem[];
  activity_logs: ActivityLog[];
  sales_budgets: SalesBudget[];
  daily_sales: DailySale[];
  stores: Store[];
  product_categories: ProductCategory[];
  products: Product[];
  product_variants: ProductVariant[];
  product_prices: ProductPrice[];
  inventory: InventoryItem[];
  inventory_movements: InventoryMovement[];
}

interface AuthResponse {
  user: User;
  token: string;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  hasRegisteredUsers: boolean;
  isAuthenticated: boolean;
  addUser: (user: Omit<User, 'id' | 'productivityScore' | 'tasksCompletedThisMonth' | 'lastActive'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User>;
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
  addOrUpdateSalesBudget: (budget: Omit<SalesBudget, 'id'>) => Promise<SalesBudget>;
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
  productCategories: ProductCategory[];
  products: Product[];
  productVariants: ProductVariant[];
  productPrices: ProductPrice[];
  inventory: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  saveCategory: (category: ProductCategory) => Promise<void>;
  saveProductBundle: (product: Product, variant: ProductVariant, price: ProductPrice) => Promise<void>;
  deactivateProduct: (productId: string) => void;
  deleteProduct: (productId: string) => Promise<void>;
  deleteProducts: (productIds: string[]) => Promise<number>;
  adjustInventory: (inventory: InventoryItem, quantityDelta: number, reason: string, type?: InventoryMovementType) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markAsRead: (notifId: string) => void;
  markAllAsRead: () => void;
  activityLogs: ActivityLog[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab, options?: { replace?: boolean }) => void;
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
  signInWithPin: (email: string, pin: string) => Promise<User>;
  signOutGoogle: () => Promise<void>;
  gmailMessages: GmailMessageSummary[];
  refreshGmailMessages: () => Promise<void>;
  isFetchingGmail: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CLEAN_DATA_VERSION = 'postgresql-source-v2';
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

const reportPersistenceError = (action: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`${action}:`, error);
  window.alert(`${action}. El cambio no quedó guardado en Supabase.\n\n${message}`);
};

const persistRecord = <T extends { id: string }>(collection: PersistedCollection, record: T) => {
  void apiRequest(`/api/data/${collection}/${encodeURIComponent(record.id)}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  }).catch((error) => reportPersistenceError(`No se pudo guardar ${collection}`, error));
};

const removeRecord = (collection: PersistedCollection, id: string) => {
  void apiRequest(`/api/data/${collection}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch((error) => reportPersistenceError(`No se pudo eliminar ${collection}`, error));
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  clearLegacyDemoData();

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(BOOTSTRAP_USER);
  const [tasks, setTasks] = useState<Task[]>([]);

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

  const [sops, setSops] = useState<SOPProcedure[]>([]);

  const [kpis] = useState<KPIMetric[]>(INITIAL_KPIS);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [salesBudgets, setSalesBudgets] = useState<SalesBudget[]>([]);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('stoners_theme') as 'dark' | 'light') || 'light';
  });

  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromCurrentRoute() || 'dashboard');
  const setActiveTab = useCallback((tab: ActiveTab, options?: { replace?: boolean }) => {
    setActiveTabState(tab);
    navigateToTab(tab, options);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<Department | 'all'>('all');
  const [isSyncing, setIsSyncing] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasRegisteredUsers, setHasRegisteredUsers] = useState(users.length > 0);
  const [apiSessionToken, setApiSessionTokenState] = useState(getApiSessionToken);

  useEffect(() => {
    const syncTabFromBrowser = () => {
      const tab = getTabFromCurrentRoute();
      if (tab) setActiveTabState(tab);
    };
    window.addEventListener('popstate', syncTabFromBrowser);
    return () => window.removeEventListener('popstate', syncTabFromBrowser);
  }, []);

  useEffect(() => {
    const expireSession = () => {
      setApiSessionTokenState('');
      setCurrentUser(BOOTSTRAP_USER);
      setUsers([]);
    };
    window.addEventListener('stoners-session-expired', expireSession);
    return () => window.removeEventListener('stoners-session-expired', expireSession);
  }, []);

  useEffect(() => {
    apiRequest<{ hasUsers: boolean }>('/api/auth/status')
      .then(({ hasUsers }) => setHasRegisteredUsers(hasUsers))
      .catch((error) => console.warn('No se pudo consultar el estado de usuarios:', error));
  }, []);

  // PostgreSQL es la fuente de verdad; localStorage queda únicamente como caché de interfaz.
  useEffect(() => {
    if (!apiSessionToken) {
      setIsSyncing(false);
      return;
    }
    let cancelled = false;
    apiRequest<BootstrapPayload>('/api/bootstrap')
      .then((data) => {
        if (cancelled) return;
        if (data.currentUser) setCurrentUser(data.currentUser);
        setUsers(data.users || []);
        setTasks(data.tasks || []);
        setSops(data.sops || []);
        setGoals(data.goals || []);
        setNotifications(data.notifications || []);
        setActivityLogs(data.activity_logs || []);
        setSalesBudgets(data.sales_budgets || []);
        setDailySales(data.daily_sales || []);
        setStores(data.stores || []);
        setProductCategories(data.product_categories || []);
        setProducts(data.products || []);
        setProductVariants(data.product_variants || []);
        setProductPrices(data.product_prices || []);
        setInventory(data.inventory || []);
        setInventoryMovements(data.inventory_movements || []);
        setIsSyncing(true);
      })
      .catch((error) => {
        console.warn('No se pudo cargar el estado desde PostgreSQL:', error);
        setIsSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiSessionToken]);

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

      const idToken = await result.user.getIdToken();
      const authResponse = await apiRequest<AuthResponse>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      setApiSessionToken(authResponse.token);
      setApiSessionTokenState(authResponse.token);
      const matchedUser = authResponse.user;
      setUsers(prev => [matchedUser, ...prev.filter(user => user.id !== matchedUser.id)]);
      setCurrentUser(matchedUser);
      setHasRegisteredUsers(true);

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
      persistRecord('notifications', notif);

      return matchedUser;
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const signInWithPin = async (email: string, pin: string): Promise<User> => {
    const authResponse = await apiRequest<AuthResponse>('/api/auth/pin', {
      method: 'POST',
      body: JSON.stringify({ email, pin }),
    });
    setApiSessionToken(authResponse.token);
    setApiSessionTokenState(authResponse.token);
    setCurrentUser(authResponse.user);
    setUsers(prev => [authResponse.user, ...prev.filter(user => user.id !== authResponse.user.id)]);
    return authResponse.user;
  };

  // Google Sign Out action
  const signOutGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await googleSignOut();
      clearApiSessionToken();
      setApiSessionTokenState('');
      setGoogleUser(null);
      setGoogleAccessToken(null);
      setGmailMessages([]);
      setCurrentUser(BOOTSTRAP_USER);
      setUsers([]);
      setTasks([]);
      setSops([]);
      setGoals([]);
      setNotifications([]);
      setActivityLogs([]);
      setSalesBudgets([]);
      setDailySales([]);
      setStores([]);
      setProductCategories([]);
      setProducts([]);
      setProductVariants([]);
      setProductPrices([]);
      setInventory([]);
      setInventoryMovements([]);
    } catch (err) {
      console.error('Error al cerrar sesión de Google:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
      const sessionToken = apiSessionToken;
      if (!sessionToken) {
        setIsSyncing(false);
        return;
      }
      eventSource = new EventSource(`${apiUrl('/api/sync')}?token=${encodeURIComponent(sessionToken)}`);
      eventSource.onopen = () => setIsSyncing(true);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TASK_CREATED') {
            setTasks(prev => [data.payload, ...prev.filter(t => t.id !== data.payload.id)]);
          } else if (data.type === 'TASK_UPDATED') {
            setTasks(prev => prev.map(t => t.id === data.payload.id ? data.payload : t));
          } else if (data.type === 'TASK_DELETED') {
            setTasks(prev => prev.filter(t => t.id !== data.payload.id));
          } else if (data.type === 'NOTIFICATION_NEW') {
            setNotifications(prev => [data.payload, ...prev.filter(item => item.id !== data.payload.id)]);
          } else if (data.type === 'USER_CREATED' || data.type === 'USER_UPDATED') {
            setUsers(prev => [data.payload, ...prev.filter(item => item.id !== data.payload.id)]);
          } else if (data.type === 'SOP_CREATED') {
            setSops(prev => [data.payload, ...prev.filter(item => item.id !== data.payload.id)]);
          } else if (data.type === 'SALE_RECORDED') {
            setDailySales(prev => [data.payload.sale, ...prev.filter(item => item.id !== data.payload.sale.id)]);
            setInventory(prev => {
              const changed = new Map<string, InventoryItem>(data.payload.inventory.map((item: InventoryItem) => [item.id, item]));
              return [...changed.values(), ...prev.filter(item => !changed.has(item.id))];
            });
            setInventoryMovements(prev => [...data.payload.movements, ...prev]);
          } else if (data.type === 'SALE_DELETED') {
            setDailySales(prev => prev.filter(item => item.id !== data.payload.id));
            setInventory(prev => {
              const changed = new Map<string, InventoryItem>(data.payload.inventory.map((item: InventoryItem) => [item.id, item]));
              return [...changed.values(), ...prev.filter(item => !changed.has(item.id))];
            });
            setInventoryMovements(prev => [...data.payload.movements, ...prev]);
          } else if (data.type === 'DATA_UPSERTED') {
            const { collection, record } = data.payload;
            const upsert = <T extends { id: string }>(items: T[]) => [record, ...items.filter(item => item.id !== record.id)];
            if (collection === 'users') setUsers(upsert);
            if (collection === 'tasks') setTasks(upsert);
            if (collection === 'sops') setSops(upsert);
            if (collection === 'goals') setGoals(upsert);
            if (collection === 'notifications') setNotifications(upsert);
            if (collection === 'activity_logs') setActivityLogs(upsert);
            if (collection === 'sales_budgets') setSalesBudgets(upsert);
            if (collection === 'daily_sales') setDailySales(upsert);
            if (collection === 'stores') setStores(upsert);
            if (collection === 'product_categories') setProductCategories(upsert);
            if (collection === 'products') setProducts(upsert);
            if (collection === 'product_variants') setProductVariants(upsert);
            if (collection === 'product_prices') setProductPrices(upsert);
            if (collection === 'inventory') setInventory(upsert);
            if (collection === 'inventory_movements') setInventoryMovements(upsert);
          } else if (data.type === 'DATA_DELETED') {
            const { collection, id } = data.payload;
            if (collection === 'users') setUsers(prev => prev.filter(item => item.id !== id));
            if (collection === 'tasks') setTasks(prev => prev.filter(item => item.id !== id));
            if (collection === 'sops') setSops(prev => prev.filter(item => item.id !== id));
            if (collection === 'goals') setGoals(prev => prev.filter(item => item.id !== id));
            if (collection === 'notifications') setNotifications(prev => prev.filter(item => item.id !== id));
            if (collection === 'activity_logs') setActivityLogs(prev => prev.filter(item => item.id !== id));
            if (collection === 'sales_budgets') setSalesBudgets(prev => prev.filter(item => item.id !== id));
            if (collection === 'daily_sales') setDailySales(prev => prev.filter(item => item.id !== id));
            if (collection === 'stores') setStores(prev => prev.filter(item => item.id !== id));
            if (collection === 'product_categories') setProductCategories(prev => prev.filter(item => item.id !== id));
            if (collection === 'products') setProducts(prev => prev.filter(item => item.id !== id));
            if (collection === 'product_variants') setProductVariants(prev => prev.filter(item => item.id !== id));
            if (collection === 'product_prices') setProductPrices(prev => prev.filter(item => item.id !== id));
            if (collection === 'inventory') setInventory(prev => prev.filter(item => item.id !== id));
            if (collection === 'inventory_movements') setInventoryMovements(prev => prev.filter(item => item.id !== id));
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
  }, [apiSessionToken]);

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
    persistRecord('activity_logs', newAct);
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

    logActivity('Creación de Tarea', `Creó la tarea ${newTask.code}: ${newTask.title}`, newTask.department);

    // Call server API asynchronously
    apiRequest<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask)
    }).catch(error => reportPersistenceError('No se pudo guardar la tarea', error));
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

    apiRequest<Task>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }).catch(error => reportPersistenceError('No se pudo actualizar la tarea', error));
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      logActivity('Tarea Eliminada', `Eliminó la tarea ${taskToDelete.code}`, taskToDelete.department);
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));

    apiRequest<{ success: boolean }>(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    }).catch(error => reportPersistenceError('No se pudo eliminar la tarea', error));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);

        const updatedTask: Task = {
          ...t,
          subtasks: updatedSubtasks,
          status: allDone ? 'completed' : (t.status === 'completed' ? 'in_progress' : t.status),
          lastCompletedDate: allDone ? todayStr : (t.lastCompletedDate === todayStr && !allDone ? '' : t.lastCompletedDate)
        };
        persistRecord('tasks', updatedTask);
        return updatedTask;
      }
      return t;
    }));
  };

  const importTasksFromExcel = (importedTasks: Task[]) => {
    setTasks(prev => [...importedTasks, ...prev]);
    importedTasks.forEach(task => persistRecord('tasks', task));
    logActivity('Importación Masiva', `Importó ${importedTasks.length} tareas desde Excel/CSV`, currentUser.department);
  };

  const addUser = async (userData: Omit<User, 'id' | 'productivityScore' | 'tasksCompletedThisMonth' | 'lastActive'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      productivityScore: 100,
      tasksCompletedThisMonth: 0,
      lastActive: 'Nuevo ingreso'
    };
    const saved = await apiRequest<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });
    setUsers(prev => [...prev.filter(user => user.id !== saved.id), saved]);
    logActivity('Usuario Creado', `Registró al colaborador ${saved.name} como ${saved.role}`, saved.department);
    return saved;
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const existing = users.find(user => user.id === id);
    if (!existing) throw new Error('El vendedor ya no existe.');
    const updated = await apiRequest<User>(`/api/data/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...existing, ...updates, id }),
    });
    setUsers(previous => previous.map(user => user.id === id ? updated : user));
    if (currentUser.id === id) setCurrentUser(updated);
    logActivity('Perfil actualizado', `Actualizó los datos personales de ${updated.name}`, 'admin');
    return updated;
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
    void apiRequest<SOPProcedure>('/api/sops', {
      method: 'POST',
      body: JSON.stringify(newSOP),
    }).catch(error => reportPersistenceError('No se pudo guardar el SOP', error));
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
        const updatedSOP = { ...sop, acknowledgedBy: updatedAck };
        persistRecord('sops', updatedSOP);
        return updatedSOP;
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
    persistRecord('goals', newGoal);
  };

  const addOrUpdateSalesBudget = async (budgetData: Omit<SalesBudget, 'id'>) => {
    const existing = salesBudgets.find(budget => budget.sellerId === budgetData.sellerId && budget.month === budgetData.month);
    const budget: SalesBudget = existing
      ? { ...existing, ...budgetData }
      : { ...budgetData, id: `bg-${Date.now()}` };
    const saved = await apiRequest<SalesBudget>(`/api/data/sales_budgets/${encodeURIComponent(budget.id)}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    });
    setSalesBudgets(previous => [saved, ...previous.filter(item => item.id !== saved.id)]);
    logActivity('Presupuesto Asignado', `Asignó presupuesto mensual de ${budgetData.targetAmount.toLocaleString()} COP a ${budgetData.sellerName}`, 'admin');
    return saved;
  };

  const deleteSalesBudget = (id: string) => {
    setSalesBudgets(prev => prev.filter(b => b.id !== id));
    removeRecord('sales_budgets', id);
    logActivity('Presupuesto Eliminado', `Eliminó registro de presupuesto ID ${id}`, 'admin');
  };

  const addDailySale = (saleData: Omit<DailySale, 'id' | 'timestamp'>) => {
    const newSale: DailySale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    void apiRequest<{ sale: DailySale; inventory: InventoryItem[]; movements: InventoryMovement[] }>('/api/sales', {
      method: 'POST', body: JSON.stringify(newSale),
    }).then(result => {
      setDailySales(prev => [result.sale, ...prev.filter(sale => sale.id !== result.sale.id)]);
      setInventory(prev => [...result.inventory, ...prev.filter(item => !result.inventory.some(changed => changed.id === item.id))]);
      setInventoryMovements(prev => [...result.movements, ...prev]);
      logActivity('Registro de Venta', `Vendedor ${result.sale.sellerName} registró venta de $${result.sale.amount.toLocaleString()}`, 'sales');
    }).catch(error => window.alert(error instanceof Error ? error.message : 'No se pudo registrar la venta.'));
  };

  const updateDailySale = (id: string, updates: Partial<DailySale>) => {
    const existing = dailySales.find(sale => sale.id === id);
    if (!existing) return;
    void apiRequest<{ sale: DailySale; inventory: InventoryItem[]; movements: InventoryMovement[] }>(`/api/sales/${id}`, {
      method: 'PUT', body: JSON.stringify({ ...existing, ...updates }),
    }).then(result => {
      setDailySales(prev => [result.sale, ...prev.filter(sale => sale.id !== result.sale.id)]);
      setInventory(prev => [...result.inventory, ...prev.filter(item => !result.inventory.some(changed => changed.id === item.id))]);
      setInventoryMovements(prev => [...result.movements, ...prev]);
      logActivity('Venta Actualizada', `Modificó datos de venta ID ${id}`, 'sales');
    }).catch(error => window.alert(error instanceof Error ? error.message : 'No se pudo actualizar la venta.'));
  };

  const deleteDailySale = (id: string) => {
    void apiRequest<{ id: string; inventory: InventoryItem[]; movements: InventoryMovement[] }>(`/api/sales/${id}`, {
      method: 'DELETE',
    }).then(result => {
      setDailySales(prev => prev.filter(s => s.id !== id));
      setInventory(prev => [...result.inventory, ...prev.filter(item => !result.inventory.some(changed => changed.id === item.id))]);
      setInventoryMovements(prev => [...result.movements, ...prev]);
      logActivity('Venta Eliminada', `Eliminó registro de venta ID ${id}`, 'sales');
    }).catch(error => window.alert(error instanceof Error ? error.message : 'No se pudo eliminar la venta.'));
  };

  const addStore = (storeData: Omit<Store, 'id'>) => {
    const newStore: Store = {
      ...storeData,
      id: `str-${Date.now()}`
    };
    setStores(prev => [...prev, newStore]);
    persistRecord('stores', newStore);
    logActivity('Sede Creada', `Registró la sede ${newStore.name} (${newStore.city})`, 'admin');
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    setStores(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      persistRecord('stores', updated);
      return updated;
    }));
    logActivity('Sede Actualizada', `Actualizó información de la sede ID ${id}`, 'admin');
  };

  const deleteStore = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
    removeRecord('stores', id);
    logActivity('Sede Eliminada', `Eliminó la sede ID ${id}`, 'admin');
  };

  const assignSellersToStore = (storeId: string, sellerIds: string[]) => {
    const targetStore = stores.find(s => s.id === storeId);
    if (!targetStore) return;

    // Update store assigned sellers
    setStores(prev => prev.map(s => {
      if (s.id !== storeId) return s;
      const updated = { ...s, assignedSellerIds: sellerIds };
      persistRecord('stores', updated);
      return updated;
    }));

    // Also update users storeIds
    setUsers(prev => prev.map(u => {
      const currentStoreIds = u.storeIds || [];
      let updatedUser = u;
      if (sellerIds.includes(u.id)) {
        if (!currentStoreIds.includes(storeId)) {
          updatedUser = { ...u, storeIds: [...currentStoreIds, storeId] };
        }
      } else {
        if (currentStoreIds.includes(storeId)) {
          updatedUser = { ...u, storeIds: currentStoreIds.filter(id => id !== storeId) };
        }
      }
      if (updatedUser !== u) persistRecord('users', updatedUser);
      return updatedUser;
    }));

    logActivity('Asignación de Vendedores', `Actualizó vendedores asignados a ${targetStore.name} (${sellerIds.length} vendedores)`, 'admin');
  };

  const saveCategory = async (category: ProductCategory) => {
    await apiRequest(`/api/data/product_categories/${encodeURIComponent(category.id)}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    setProductCategories(prev => [category, ...prev.filter(item => item.id !== category.id)]);
    logActivity('Categoría guardada', `Guardó la categoría de productos ${category.name}`, 'admin');
  };

  const saveProductBundle = async (product: Product, variant: ProductVariant, price: ProductPrice) => {
    const result = await apiRequest<{ product: Product; variant: ProductVariant; price: ProductPrice }>('/api/products/bundle', {
      method: 'POST', body: JSON.stringify({ product, variant, price }),
    });
    setProducts(prev => [result.product, ...prev.filter(item => item.id !== result.product.id)]);
    setProductVariants(prev => [result.variant, ...prev.filter(item => item.id !== result.variant.id)]);
    setProductPrices(prev => [result.price, ...prev.filter(item => item.id !== result.price.id)]);
    logActivity('Producto guardado', `Guardó ${result.product.name} (${result.variant.sku}) en el catálogo`, 'admin');
  };

  const deactivateProduct = (productId: string) => {
    const product = products.find(item => item.id === productId);
    if (!product) return;
    const updated: Product = { ...product, status: 'discontinued', updatedAt: new Date().toISOString() };
    setProducts(prev => prev.map(item => item.id === productId ? updated : item));
    setProductVariants(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const variant = { ...item, active: false };
      persistRecord('product_variants', variant);
      return variant;
    }));
    persistRecord('products', updated);
    logActivity('Producto descontinuado', `Descontinuó ${product.name} sin borrar su historial`, 'admin');
  };

  const deleteProducts = async (productIds: string[]) => {
    const uniqueIds = [...new Set(productIds)];
    const selectedProducts = products.filter(item => uniqueIds.includes(item.id));
    if (!selectedProducts.length) return 0;
    const result = await apiRequest<{
      productIds: string[];
      variantIds: string[];
      priceIds: string[];
      inventoryIds: string[];
      movementIds: string[];
    }>('/api/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ productIds: uniqueIds }),
    });

    const deletedProductIds = new Set(result.productIds);
    const variantIds = new Set(result.variantIds);
    const priceIds = new Set(result.priceIds);
    const inventoryIds = new Set(result.inventoryIds);
    const movementIds = new Set(result.movementIds);
    setProducts(prev => prev.filter(item => !deletedProductIds.has(item.id)));
    setProductVariants(prev => prev.filter(item => !variantIds.has(item.id)));
    setProductPrices(prev => prev.filter(item => !priceIds.has(item.id)));
    setInventory(prev => prev.filter(item => !inventoryIds.has(item.id)));
    setInventoryMovements(prev => prev.filter(item => !movementIds.has(item.id)));
    const names = selectedProducts.filter(item => deletedProductIds.has(item.id)).map(item => item.name);
    logActivity(
      names.length === 1 ? 'Producto eliminado' : 'Productos eliminados',
      `Eliminó definitivamente ${names.join(', ')} del catálogo y del inventario`,
      'admin',
    );
    return result.productIds.length;
  };

  const deleteProduct = async (productId: string) => {
    await deleteProducts([productId]);
  };

  const adjustInventory = (
    inventoryItem: InventoryItem,
    quantityDelta: number,
    reason: string,
    type: InventoryMovementType = 'adjustment',
  ) => {
    void apiRequest<{ inventory: InventoryItem; movement: InventoryMovement }>('/api/inventory/adjust', {
      method: 'POST', body: JSON.stringify({ inventory: inventoryItem, quantityDelta, reason, type }),
    }).then(result => {
      setInventory(prev => [result.inventory, ...prev.filter(item => item.id !== result.inventory.id)]);
      setInventoryMovements(prev => [result.movement, ...prev.filter(item => item.id !== result.movement.id)]);
      logActivity('Ajuste de inventario', `${result.inventory.productName}: ${quantityDelta >= 0 ? '+' : ''}${quantityDelta} en ${result.inventory.storeName}`, 'admin');
    }).catch(error => window.alert(error instanceof Error ? error.message : 'No se pudo ajustar el inventario.'));
  };

  const markAsRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.id !== notifId) return n;
      const updated = { ...n, read: true };
      persistRecord('notifications', updated);
      return updated;
    }));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => {
      const updated = { ...n, read: true };
      persistRecord('notifications', updated);
      return updated;
    }));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read && n.userId === currentUser.id).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        hasRegisteredUsers,
        isAuthenticated: Boolean(apiSessionToken && currentUser.id !== BOOTSTRAP_USER.id),
        addUser,
        updateUser,
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
        productCategories,
        products,
        productVariants,
        productPrices,
        inventory,
        inventoryMovements,
        saveCategory,
        saveProductBundle,
        deactivateProduct,
        deleteProduct,
        deleteProducts,
        adjustInventory,
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
        signInWithPin,
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
