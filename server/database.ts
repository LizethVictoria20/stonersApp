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
  'suppliers',
  'inventory',
  'inventory_movements',
  'product_batches',
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
  pinHash?: string;
  storeIds?: string[];
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
    pin_hash: record.pinHash || null,
    store_ids: record.storeIds || [],
  };
}

export async function checkDatabase(): Promise<{ configured: boolean; connected: boolean; error?: string }> {
  const supabase = getClient();
  if (!supabase) return { configured: false, connected: false };

  const [{ error: recordsError }, { error: usersError }] = await Promise.all([
    supabase.from('app_records').select('entity_id').limit(1),
    supabase.from('users').select('id').limit(1),
  ]);
  const error = recordsError || usersError;
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
