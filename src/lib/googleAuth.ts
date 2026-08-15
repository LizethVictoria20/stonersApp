import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Provider with Scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to indicate if sign-in popup is in progress
let isSigningIn = false;
// In-memory access token cache (NOT stored in localStorage as per security rules)
let cachedAccessToken: string | null = null;

export interface GoogleAuthResult {
  user: FirebaseUser;
  accessToken: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
  internalDate?: string;
}

/**
 * Convert Firebase Auth errors into actionable messages for the UI.
 */
export const getGoogleAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'este dominio';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `El dominio "${hostname}" no está autorizado en Firebase. Agrégalo en Firebase Console → Authentication → Settings → Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'El acceso con Google no está habilitado. Actívalo en Firebase Console → Authentication → Sign-in method → Google.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio e inténtalo de nuevo.';
    case 'auth/popup-closed-by-user':
      return 'La ventana de Google se cerró antes de completar el acceso.';
    case 'auth/cancelled-popup-request':
      return 'La solicitud anterior fue cancelada. Espera un momento e inténtalo nuevamente.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Google. Revisa tu conexión a internet e inténtalo nuevamente.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo usando otro método de acceso.';
    default:
      return code
        ? `No fue posible iniciar sesión con Google (${code}).`
        : 'No fue posible iniciar sesión con Google. Inténtalo de nuevo.';
  }
};

/**
 * Initialize auth state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign-In with popup
 */
export const googleSignIn = async (): Promise<GoogleAuthResult> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      // Fallback: If credential token is not direct, still return authenticated user
      console.warn('Google credential access token not returned directly from result');
    }

    cachedAccessToken = credential?.accessToken || null;
    return {
      user: result.user,
      accessToken: cachedAccessToken || ''
    };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve current cached access token in memory
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out of Google session
 */
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Helper to fetch recent Gmail operational emails using access token
 */
export const fetchRecentGmailMessages = async (accessToken: string, maxResults = 10): Promise<GmailMessageSummary[]> => {
  if (!accessToken) return [];

  try {
    // 1. List messages
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!listRes.ok) {
      console.warn('Gmail API list error:', await listRes.text());
      return [];
    }

    const listData = await listRes.json();
    if (!listData.messages || !Array.isArray(listData.messages)) {
      return [];
    }

    // 2. Fetch details for each message
    const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: { id: string; threadId: string }) => {
      try {
        const itemRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
          }
        });
        if (!itemRes.ok) return null;
        const itemData = await itemRes.json();
        
        const headers = itemData.payload?.headers || [];
        const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject');
        const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === 'from');
        const dateHeader = headers.find((h: any) => h.name?.toLowerCase() === 'date');

        return {
          id: itemData.id,
          threadId: itemData.threadId,
          snippet: itemData.snippet || '',
          subject: subjectHeader ? subjectHeader.value : '(Sin Asunto)',
          from: fromHeader ? fromHeader.value : 'Desconocido',
          date: dateHeader ? dateHeader.value : '',
          internalDate: itemData.internalDate
        } as GmailMessageSummary;
      } catch (e) {
        return null;
      }
    });

    const messages = await Promise.all(messagePromises);
    return messages.filter((m): m is GmailMessageSummary => m !== null);
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
};
