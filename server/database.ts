import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const COLLECTIONS = [
  'users',
  'tasks',
  'sops',
  'goals',
  'notifications',
  'activity_logs',
  'sales_budgets',
  'daily_sales',
  'stores',
  'product_categories',
  'products',
  'product_variants',
  'product_prices',
  'inventory',
  'inventory_movements',
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

type UserDocument = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  department?: string;
  avatar?: string;
  productivityScore?: number;
  tasksCompletedThisMonth?: number;
  lastActive?: string;
  phone?: string;
  documentNumber?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  hireDate?: string;
  pinHash?: string;
  storeIds?: string[];
};

type ProductDocument = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  unit?: string;
  imageUrl?: string;
  status?: string;
  taxRate?: number;
  regulatoryRegistration?: string;
  createdAt?: string;
  updatedAt?: string;
};

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = (
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  client = url && secretKey
    ? createClient(url, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  return client;
}

function requireClient(): SupabaseClient {
  const supabase = getClient();
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SECRET_KEY antes de usar la aplicación.',
    );
  }
  return supabase;
}

function userFromRow(row: any): UserDocument {
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
    phone: row.phone || undefined,
    documentNumber: row.document_number || undefined,
    birthDate: row.birth_date || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    hireDate: row.hire_date || undefined,
    pinHash: row.pin_hash || undefined,
    storeIds: Array.isArray(row.store_ids) ? row.store_ids : [],
  };
}

function userToRow(record: UserDocument) {
  return {
    id: record.id,
    email: record.email.trim().toLowerCase(),
    name: record.name || record.email.split('@')[0],
    role: record.role || 'vendedor',
    department: record.department || 'sales',
    avatar: record.avatar || '',
    productivity_score: Number(record.productivityScore ?? 100),
    tasks_completed_this_month: Number(record.tasksCompletedThisMonth ?? 0),
    last_active: record.lastActive || 'Ahora mismo',
    phone: record.phone || null,
    document_number: record.documentNumber || null,
    birth_date: record.birthDate || null,
    address: record.address || null,
    city: record.city || null,
    hire_date: record.hireDate || null,
    pin_hash: record.pinHash || null,
    store_ids: record.storeIds || [],
  };
}

function productFromRow(row: any): ProductDocument {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description || '',
    categoryId: row.category_id || '',
    categoryName: row.category_name || 'Sin categoría',
    brand: row.brand || '',
    unit: row.unit || 'unidad',
    imageUrl: row.image_url || undefined,
    status: row.status || 'active',
    taxRate: Number(row.tax_rate || 0),
    regulatoryRegistration: row.regulatory_registration || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function productToRow(record: ProductDocument) {
  return {
    id: record.id,
    sku: record.sku.trim(),
    name: record.name.trim(),
    description: record.description || '',
    category_id: record.categoryId || '',
    category_name: record.categoryName || 'Sin categoría',
    brand: record.brand || '',
    unit: record.unit || 'unidad',
    image_url: record.imageUrl || null,
    status: record.status || 'active',
    tax_rate: Number(record.taxRate || 0),
    regulatory_registration: record.regulatoryRegistration || null,
    created_at: record.createdAt || new Date().toISOString(),
    updated_at: record.updatedAt || new Date().toISOString(),
  };
}

export async function checkDatabase(): Promise<{ configured: boolean; connected: boolean; error?: string }> {
  const supabase = getClient();
  if (!supabase) return { configured: false, connected: false };

  const [{ error: recordsError }, { error: usersError }, { error: productsError }] = await Promise.all([
    supabase.from('app_records').select('entity_id').limit(1),
    supabase.from('users').select('id').limit(1),
    supabase.from('products').select('id').limit(1),
  ]);
  const error = recordsError || usersError || productsError;
  return error
    ? { configured: true, connected: false, error: error.message }
    : { configured: true, connected: true };
}

export async function listRecords<T>(collection: CollectionName): Promise<T[]> {
  const supabase = requireClient();

  if (collection === 'users') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`No se pudo leer users: ${error.message}`);
    return (data || []).map(userFromRow) as T[];
  }

  if (collection === 'products') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`No se pudo leer products: ${error.message}`);
    return (data || []).map(productFromRow) as T[];
  }

  const { data, error } = await supabase
    .from('app_records')
    .select('payload')
    .eq('entity_type', collection)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`No se pudo leer ${collection}: ${error.message}`);
  return (data || []).map((record) => record.payload as T);
}

export async function upsertRecord<T extends { id: string }>(collection: CollectionName, record: T): Promise<T> {
  const supabase = requireClient();

  if (collection === 'users') {
    const user = record as T & UserDocument;
    if (!user.email?.trim()) throw new Error('No se puede guardar un usuario sin correo electrónico.');
    const { error } = await supabase.from('users').upsert(userToRow(user), { onConflict: 'id' });
    if (error) throw new Error(`No se pudo guardar users: ${error.message}`);
    return record;
  }

  if (collection === 'products') {
    const product = record as T & ProductDocument;
    if (!product.name?.trim() || !product.sku?.trim()) {
      throw new Error('No se puede guardar un producto sin nombre y SKU.');
    }
    const { error } = await supabase.from('products').upsert(productToRow(product), { onConflict: 'id' });
    if (error) throw new Error(`No se pudo guardar products: ${error.message}`);
    return record;
  }

  const { error } = await supabase.from('app_records').upsert(
    {
      entity_type: collection,
      entity_id: record.id,
      payload: record,
    },
    { onConflict: 'entity_type,entity_id' },
  );

  if (error) throw new Error(`No se pudo guardar ${collection}: ${error.message}`);
  return record;
}

export async function deleteRecord(collection: CollectionName, id: string): Promise<void> {
  const supabase = requireClient();

  if (collection === 'users') {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(`No se pudo eliminar users: ${error.message}`);
    return;
  }

  if (collection === 'products') {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(`No se pudo eliminar products: ${error.message}`);
    return;
  }

  const { error } = await supabase
    .from('app_records')
    .delete()
    .eq('entity_type', collection)
    .eq('entity_id', id);

  if (error) throw new Error(`No se pudo eliminar ${collection}: ${error.message}`);
}

export async function findRecord<T extends { id: string }>(collection: CollectionName, id: string): Promise<T | null> {
  const records = await listRecords<T>(collection);
  return records.find((record) => record.id === id) || null;
}

export async function findRecordByField<T extends { id: string }>(
  collection: CollectionName,
  field: keyof T,
  value: unknown,
): Promise<T | null> {
  const records = await listRecords<T>(collection);
  return records.find((record) => record[field] === value) || null;
}

export async function applyRecordTransaction(
  upserts: Array<{ collection: CollectionName; record: { id: string } }>,
  deletes: Array<{ collection: CollectionName; id: string }> = [],
): Promise<void> {
  const supabase = requireClient();

  const { error } = await supabase.rpc('apply_app_records_transaction', {
    p_upserts: upserts.map(({ collection, record }) => ({
      entity_type: collection,
      entity_id: record.id,
      payload: record,
    })),
    p_deletes: deletes.map(({ collection, id }) => ({ entity_type: collection, entity_id: id })),
  });

  if (error) throw new Error(`No se pudo completar la transacción: ${error.message}`);
}
