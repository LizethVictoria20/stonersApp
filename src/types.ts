export type UserRole = 'admin' | 'vendedor' | 'contador';

export type Department = 
  | 'sales'
  | 'admin'
  | 'accounting';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'overdue';

export interface Store {
  id: string;
  name: string;
  city: 'Pereira' | 'Medellín' | 'Manizales' | 'Armenia' | string;
  code: string;
  address: string;
  phone?: string;
  assignedSellerIds: string[];
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  avatar: string;
  productivityScore: number; // 0 - 100
  tasksCompletedThisMonth: number;
  lastActive: string;
  phone?: string;
  pinCode?: string;
  storeIds?: string[]; // Tiendas asignadas al vendedor
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskNote {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  code: string; // e.g., TSK-101
  title: string;
  description: string;
  department: Department;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToId: string;
  assignedToName: string;
  assignedToAvatar?: string;
  assignedById: string;
  assignedByName: string;
  createdDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  subtasks: Subtask[];
  sopId?: string; // Link to SOP procedure
  sopTitle?: string;
  attachments?: string[];
  notes: TaskNote[];

  // Tarea Diaria Recurrente (6am - 9pm)
  isDaily?: boolean;
  dailyStartTime?: string; // Default: '06:00'
  dailyEndTime?: string; // Default: '21:00'
  lastCompletedDate?: string; // YYYY-MM-DD fecha en que se realizó por última vez
}

export interface SOPStep {
  stepNumber: number;
  title: string;
  description: string;
  isCritical: boolean;
}

export interface SOPProcedure {
  id: string;
  code: string; // e.g., SOP-DISP-01
  title: string;
  department: Department;
  minRoleRequired: UserRole;
  version: string;
  lastUpdated: string;
  summary: string;
  steps: SOPStep[];
  acknowledgedBy: {
    userId: string;
    userName: string;
    timestamp: string;
  }[];
  category: string;
  iconName?: string;
}

export interface KPIMetric {
  id: string;
  title: string;
  department: Department | 'all';
  currentValue: number;
  targetValue: number;
  unit: string; // '%', 'hrs', 'unidades', etc.
  period: string; // 'Mensual', 'Semanal'
  trend: 'up' | 'down' | 'stable';
  status: 'on_track' | 'warning' | 'critical';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  department: Department | 'all';
  targetDate: string;
  progressPercentage: number;
  status: 'active' | 'completed' | 'at_risk';
  metricType: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'task_due' | 'task_assigned' | 'sop_update' | 'kpi_alert' | 'system';
  read: boolean;
  linkId?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  department: Department;
}

export type SalesChannel = 'whatsapp' | 'tienda' | 'otro';

export interface SalesBudget {
  id: string;
  sellerId: string;
  sellerName: string;
  storeId?: string;
  storeName?: string;
  month: string; // e.g., '2026-08'
  targetAmount: number; // Presupuesto mensual en COP
  notes?: string;
}

export interface DailySale {
  id: string;
  sellerId: string;
  sellerName: string;
  storeId?: string;
  storeName?: string;
  date: string; // e.g., '2026-08-03'
  amount: number; // Monto vendido en COP
  channel: SalesChannel; // 'whatsapp' | 'tienda' | 'otro'
  description?: string;
  clientName?: string;
  timestamp: string;
  items?: SaleItem[];
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  costTotal?: number;
}

export type ProductStatus = 'active' | 'out_of_stock' | 'suspended' | 'discontinued';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  unit: string;
  imageUrl?: string;
  status: ProductStatus;
  taxRate: number;
  regulatoryRegistration?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>;
  active: boolean;
}

export interface ProductPrice {
  id: string;
  productId: string;
  variantId: string;
  storeId?: string;
  cost: number;
  salePrice: number;
  promoPrice?: number;
  promoStart?: string;
  promoEnd?: string;
  taxRate: number;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  minStock: number;
  maxStock: number;
  location?: string;
  updatedAt: string;
}

export type InventoryMovementType = 'entry' | 'sale' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'return';

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  storeId: string;
  storeName: string;
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId?: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface SaleItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
}
