# DaxCloud Mobile

App móvil para consumidores finales de negocios que usan DaxCloud.

## Tecnologías

- **Expo SDK 52** + **Expo Router 4** (file-based navigation)
- **React Native 0.76**
- **Zustand** para estado global
- **TanStack Query** para fetching y cache
- **Expo SecureStore** para JWT
- **Expo Notifications** para push

## Estructura

```
app/
  _layout.tsx          # Root layout con QueryClient
  index.tsx            # Redirect según auth state
  auth/
    _layout.tsx
    select-tenant.tsx  # Buscar negocio o QR
    login.tsx
    register.tsx       # (por implementar)
    magic-link.tsx     # (por implementar)
  tabs/
    _layout.tsx        # Bottom tab bar
    home.tsx           # Puntos + fidelización
    catalog.tsx        # Productos del negocio
    history.tsx        # Historial de compras
    profile.tsx        # Perfil + logout

src/
  services/
    api.ts             # Axios con JWT interceptor
    authService.ts     # Login, register, magic link
    tenantService.ts   # Buscar negocios
    customerService.ts # Perfil, historial, catálogo
  store/
    authStore.ts       # Zustand: user, tenant, token
  types/
    theme.ts           # Colors, Spacing, Typography
```

## Setup

```bash
cd apps/mobile
npm install
npx expo start
```

Para Android:
```bash
npm run android
```

Para iOS:
```bash
npm run ios
```

## Agregar al monorepo

En `package.json` raíz del monorepo, agregar `apps/mobile` a workspaces:
```json
{
  "workspaces": ["apps/web", "apps/api", "apps/mobile"]
}
```

## Endpoints nuevos necesarios en la API

Los siguientes endpoints aún no existen y deben crearse en `apps/api`:

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/customers/auth/login` | Login de cliente final |
| POST | `/customers/auth/register` | Registro de cliente |
| POST | `/customers/auth/magic-link` | Enviar magic link |
| GET | `/tenants/search?q=` | Buscar negocios |
| GET | `/tenants/:slug` | Info de un negocio |
| GET | `/customers/me` | Perfil + puntos del cliente |
| GET | `/customers/me/purchases` | Historial de compras |

Los endpoints de `/products` ya existen — solo verificar que sean públicos (sin auth de admin).

## Build para producción

```bash
# Instalar EAS CLI
npm install -g eas-cli
eas login

# Configurar proyecto
eas build:configure

# Build
eas build --platform all
```
