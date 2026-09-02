export type ActiveTab =
  | 'dashboard'
  | 'sales'
  | 'stores'
  | 'products'
  | 'tasks'
  | 'sops'
  | 'kpis'
  | 'team'
  | 'exports'
  | 'supabase_cloud';

export const TAB_ROUTES: Record<ActiveTab, string> = {
  dashboard: '/dashboard',
  sales: '/ventas',
  stores: '/tiendas',
  products: '/productos',
  tasks: '/tareas',
  sops: '/manual-sops',
  kpis: '/indicadores',
  team: '/equipo',
  exports: '/reportes',
  supabase_cloud: '/base-de-datos',
};

const ROUTE_TABS = new Map(Object.entries(TAB_ROUTES).map(([tab, route]) => [route, tab as ActiveTab]));
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export const getCurrentRoute = (): string => {
  let path = window.location.pathname;
  if (BASE_PATH && path === BASE_PATH) path = '/';
  else if (BASE_PATH && path.startsWith(`${BASE_PATH}/`)) path = path.slice(BASE_PATH.length) || '/';
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
};

export const getTabFromRoute = (route: string): ActiveTab | null => {
  const normalized = route.length > 1 ? route.replace(/\/+$/, '') : route;
  if (normalized === '/') return 'dashboard';
  return ROUTE_TABS.get(normalized) || null;
};

export const getTabFromCurrentRoute = (): ActiveTab | null => getTabFromRoute(getCurrentRoute());

export const getBrowserPath = (route: string): string => `${BASE_PATH}${route}` || '/';

export const navigateToRoute = (route: string, options?: { replace?: boolean }): void => {
  const target = getBrowserPath(route);
  if (window.location.pathname !== target) {
    if (options?.replace) window.history.replaceState({}, '', target);
    else window.history.pushState({}, '', target);
  }
  window.dispatchEvent(new Event('stoners-route-change'));
};

export const navigateToTab = (tab: ActiveTab, options?: { replace?: boolean }): void => {
  navigateToRoute(TAB_ROUTES[tab], options);
};
