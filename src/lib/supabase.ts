import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('stoners_supabase_url') || '' : '';
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('stoners_supabase_key') || '' : '';

  const url = localUrl || envUrl;
  const key = localKey || envKey;

  return { url, key, isLocalOverride: Boolean(localUrl && localKey) };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url !== 'https://your-project.supabase.co');
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (customUrl?: string, customKey?: string): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  const activeUrl = customUrl || url;
  const activeKey = customKey || key;

  if (!activeUrl || !activeKey || activeUrl === 'https://your-project.supabase.co') {
    return null;
  }
  
  return createClient(activeUrl, activeKey);
};

export const checkSupabaseConnection = async (customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> => {
  const { url, key } = getSupabaseConfig();
  const activeUrl = customUrl || url;
  const activeKey = customKey || key;

  if (!activeUrl || !activeKey || activeUrl === 'https://your-project.supabase.co') {
    return {
      success: false,
      message: 'Supabase no está configurado aún. La aplicación sigue funcionando normalmente en modo local con almacenamiento interno. Puedes ingresar tus credenciales abajo o agregarlas en el archivo .env cuando las tengas.'
    };
  }

  try {
    const client = createClient(activeUrl, activeKey);
    if (!client) {
      return { success: false, message: 'No se pudo inicializar el cliente de Supabase con los datos provistos.' };
    }
    
    // Quick probe query to check connectivity
    const { error } = await client.from('tasks').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, connection works!
      if (error.message?.includes('relation "public.tasks" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: '¡Conexión a Supabase exitosa! (Nota: Las tablas aún no han sido creadas. Copia y ejecuta el Script SQL en el editor de Supabase para crearlas).'
        };
      }
      return {
        success: false,
        message: `Error al conectar con Supabase: ${error.message}`
      };
    }

    return {
      success: true,
      message: '¡Conexión exitosa a la base de datos Supabase! La conexión está lista y verificada.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Excepción al verificar conexión: ${err.message || 'Error de red o URL inválida'}`
    };
  }
};
