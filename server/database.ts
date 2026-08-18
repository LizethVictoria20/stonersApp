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

const memoryStore = new Map<CollectionName, Map<string, Record<string, unknown>>>(
  COLLECTIONS.map((collection) => [collection, new Map()]),
);

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

function assertDevelopmentFallback(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PostgreSQL no está configurado. Define SUPABASE_URL y SUPABASE_SECRET_KEY en Render.');
  }
}

export async function checkDatabase(): Promise<{ configured: boolean; connected: boolean; error?: string }> {
  const supabase = getClient();
  if (!supabase) return { configured: false, connected: false };

  const { error } = await supabase.from('app_records').select('entity_id').limit(1);
  return error
    ? { configured: true, connected: false, error: error.message }
    : { configured: true, connected: true };
}

export async function listRecords<T>(collection: CollectionName): Promise<T[]> {
  const supabase = getClient();
  if (!supabase) {
    assertDevelopmentFallback();
    return Array.from(memoryStore.get(collection)!.values()) as T[];
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
  const supabase = getClient();
  if (!supabase) {
    assertDevelopmentFallback();
    memoryStore.get(collection)!.set(record.id, record as unknown as Record<string, unknown>);
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
  const supabase = getClient();
  if (!supabase) {
    assertDevelopmentFallback();
    memoryStore.get(collection)!.delete(id);
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
  const supabase = getClient();
  if (!supabase) {
    assertDevelopmentFallback();
    upserts.forEach(({ collection, record }) => memoryStore.get(collection)!.set(record.id, record));
    deletes.forEach(({ collection, id }) => memoryStore.get(collection)!.delete(id));
    return;
  }

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
