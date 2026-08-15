# Stoners Colombia — Control Operativo

Arquitectura de producción:

```text
GitHub Pages (React/Vite)
          ↓ HTTPS
Render (Express/API)
          ↓ service_role privada
Supabase (PostgreSQL)
```

## Desarrollo local

1. Copia `.env.example` como `.env` y completa las variables.
2. Ejecuta `npm ci`.
3. Ejecuta `npm run dev`.

Si `SUPABASE_URL` y `SUPABASE_SECRET_KEY` están vacías, Express usa memoria solamente en desarrollo. En producción, `/api/health` devuelve estado degradado hasta que PostgreSQL esté configurado.

## Preparar Supabase

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**.
3. Ejecuta el contenido de `supabase/schema.sql`.
4. Copia **Project URL** y una clave secreta `sb_secret_…` desde **Settings → API Keys**.

La clave secreta es exclusiva del backend. Nunca debe guardarse en variables `VITE_*`, GitHub Pages, código fuente o `localStorage`.

## Desplegar la API en Render

El archivo `render.yaml` crea el servicio. Configura en Render:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `FIREBASE_API_KEY` (la misma Web API Key configurada en Firebase)
- `GEMINI_API_KEY` (opcional)

Render genera `SESSION_SECRET` automáticamente desde `render.yaml`. La API valida el token de Firebase para el acceso con Google y entrega una sesión firmada de 12 horas; el acceso con PIN también se valida dentro de Express.

Después del despliegue, verifica:

```text
https://TU-SERVICIO.onrender.com/api/health
```

Debe responder con `status: "ok"` y `database.connected: true`.

## Desplegar el frontend en GitHub Pages

En el repositorio de GitHub configura el secreto:

- `VITE_API_URL=https://TU-SERVICIO.onrender.com`

Completa también los secretos Firebase usados por `.github/workflows/deploy.yml`. En **Settings → Pages → Build and deployment → Source**, elige **GitHub Actions** y ejecuta el workflow de despliegue.
