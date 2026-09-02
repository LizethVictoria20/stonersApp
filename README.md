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

`SUPABASE_URL` y `SUPABASE_SECRET_KEY` son obligatorias también en desarrollo. La aplicación no utiliza almacenamiento temporal en memoria: si Supabase no está configurado o no responde, `/api/health` devuelve estado degradado y la API rechaza lecturas y escrituras para evitar datos que desaparezcan al reiniciar.

## Preparar Supabase

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**.
3. Ejecuta el contenido de `supabase/schema.sql`.
4. Copia **Project URL** y una clave secreta `sb_secret_…` desde **Settings → API Keys**.

La clave secreta es exclusiva del backend. Nunca debe guardarse en variables `VITE_*`, GitHub Pages, código fuente o `localStorage`.

Si el proyecto de Supabase ya existía, vuelve a ejecutar `supabase/schema.sql`: el script amplía la restricción de colecciones y crea la función transaccional usada por ventas e inventario, sin borrar los registros existentes.

### Migración de usuarios

Los perfiles de usuario se guardan en `public.users`; ya no se almacenan como documentos dentro de `app_records`. Para una instalación existente ejecuta en **SQL Editor**:

```text
supabase/migrations/20260818_create_users_table.sql
```

La migración copia los usuarios existentes, conserva roles, tiendas y hashes de PIN, elimina únicamente los documentos de usuario ya migrados desde `app_records` y puede ejecutarse nuevamente de forma segura. Los usuarios autenticados con Google siguen utilizando Firebase como proveedor de identidad, pero su perfil operativo queda en `public.users`.

## Catálogo, inventario y ventas

El módulo **Productos e Inventario** incluye catálogo, categorías, precios, existencias por tienda y movimientos. Los permisos son:

- **Administrador:** crea y modifica productos y stock.

Los datos generales de cada producto se almacenan en la tabla normalizada `public.products`. Las variantes, precios, existencias y movimientos permanecen como colecciones separadas para conservar una estructura ordenada y evitar duplicar información.

## Rutas de los módulos

- `/dashboard`: resumen general.
- `/ventas`: ventas y presupuestos.
- `/tiendas`: sedes y tiendas.
- `/productos`: productos e inventario.
- `/tareas`: controlador de tareas.
- `/manual-sops`: procedimientos operativos.
- `/indicadores`: metas e indicadores.
- `/equipo`: usuarios y permisos.
- `/reportes`: reportes y exportación.
- `/base-de-datos`: configuración de Supabase.

La navegación utiliza el historial del navegador y el despliegue de GitHub Pages genera `404.html` como respaldo para admitir la carga directa de estas rutas.
- **Contador:** consulta costos, valor del inventario, ventas y utilidad.
- **Vendedor:** consulta precio y disponibilidad; registra ventas únicamente en sus tiendas asignadas.

Las ventas con productos validan el stock en Express y guardan venta, descuento de inventario y movimientos en una sola transacción de PostgreSQL. Al editar o eliminar una venta, las existencias se recalculan o se devuelven.

Para importar productos usa un `.xlsx`, `.xls` o `.csv` con estas columnas. `nombre` y `sku` son obligatorias:

```text
nombre, sku, codigo_barras, categoria, marca, unidad, descripcion,
costo, precio_venta, iva, presentacion, registro_sanitario
```

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
