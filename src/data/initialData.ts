import {
  ActivityLog,
  DailySale,
  Goal,
  KPIMetric,
  NotificationItem,
  SalesBudget,
  SOPProcedure,
  Store,
  Task,
  User,
} from '../types';

// The application now starts with a clean dataset. Real records can be
// imported or created from the portal after the first administrator signs in.
export const INITIAL_STORES: Store[] = [];
export const INITIAL_USERS: User[] = [];
export const INITIAL_SOPS: SOPProcedure[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_KPIS: KPIMetric[] = [];
export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
export const INITIAL_SALES_BUDGETS: SalesBudget[] = [];
export const INITIAL_DAILY_SALES: DailySale[] = [];
