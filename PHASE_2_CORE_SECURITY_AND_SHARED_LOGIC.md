# 🔐 Phase 2: Core Security & Shared UI Architecture

## 🎯 Overview
This document details the security layer, JWT session interception, role-based guard mechanics, authentication services, and shared UI design system of the **CinemaTicketing** frontend.

---

### 💡 High-Level Analogy: The Cinema Security & VIP Velvet Rope
* **`authInterceptor`** is the automated ticket scanner at the door. Every time a request leaves the browser for a private area, it attaches your official encrypted wristband (`Bearer JWT Token`). If your wristband expires mid-movie (HTTP 401/403), the scanner automatically escorts you back to the ticket booth (`/login`).
* **`roleGuard`** is the VIP door guard. Even if you have a valid wristband, if you try entering the Admin Projection Booth or Organizer Studio with a General Customer ticket, the guard stops you and points you back to the main lobby (`/discover`).

---

## 1. Functional HTTP Interceptor (`auth.interceptor.ts`)

In modern Angular, interceptors are written as lean functional pipelines rather than verbose class-based services:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. Skip attaching authorization header for public catalog endpoints
  const isPublicEndpoint = req.url.includes('/public/');

  // 2. Clone request and attach Authorization header if token exists
  const authReq = (token && !isPublicEndpoint)
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthApi = req.url.includes('/v1/auth/');

      // 3. Global 401/403 Session Expiration Handling
      if (!isAuthApi && (error.status === 401 || error.status === 403)) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
```

### Key Responsibilities:
1. **Header Injection:** Intercepts outgoing HTTP requests and appends `Authorization: Bearer <JWT>` header automatically so individual component services never deal with header formatting.
2. **Selective Bypassing:** Intelligently ignores public endpoints containing `/public/` (such as movie catalog search or category browsing).
3. **Session Expiration Guard:** Catches HTTP `401 Unauthorized` or `403 Forbidden` error responses, clears local storage tokens via `authService.logout()`, and redirects the user to `/login`.

---

## 2. Authentication Service (`auth.service.ts`)

`AuthService` serves as the single source of truth for session management, token storage, and JWT payload parsing.

### Key Capabilities:
- **Reactive Session Signal:** Stores state in `tokenSignal`, `errorSignal`, and `loadingSignal`.
- **Computed `currentUser` Signal:** Decodes the stored JWT payload reactively to expose active `userId`, `email`, and `role` without external libraries.
- **Token Storage & Parsing:** Safely decodes Base64 JWT payloads to extract user identity (`userId`, `sub`, `roles`) and manage localStorage persistence (`jwt`).

---

## 3. Role-Based Route Protection (`auth.guards.ts` & `role.guards.ts`)

### 🛡️ `authGuard`
Ensures that only authenticated users can access protected routes (`/booking`, `/my-tickets`):

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```
If unauthenticated, it captures the target URL (`state.url`) so that after logging in, the user is redirected straight back to where they were going.

---

### 🛡️ `roleGuard`
Enforces granular role-based authorization for administrative routes (`/organizer`, `/admin`):

```typescript
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data?.['roles'] as UserRole[]) || [];
  const currentUser = authService.currentUser();
  const userRole = currentUser?.role;

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Redirect role mismatch safely to main discover page
  return router.createUrlTree(['/discover']);
};
```

#### Matrix of Access:

| User Role | `/discover` | `/my-tickets` | `/organizer` | `/admin` |
| :--- | :---: | :---: | :---: | :---: |
| **Anonymous** | ✅ | ❌ Redirect `/login` | ❌ Redirect `/login` | ❌ Redirect `/login` |
| **CUSTOMER** | ✅ | ✅ | ❌ Redirect `/discover` | ❌ Redirect `/discover` |
| **ORGANIZER** | ✅ | ✅ | ✅ | ❌ Redirect `/discover` |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ |

---

## 4. Shared Cinematic UI Architecture

The project enforces a cohesive **Cinematic Dark Design System** inspired by premium streaming and cinema platforms:

- **Color Palette:**
  - Background: Deep Slate `#0f172a`
  - Cards & Drawers: Elevated Dark Slate `#1e293b` with `#334155` borders
  - Primary Accent: Neon Baby Blue `#38bdf8`
  - Text: Bright White `#ffffff` with `#94a3b8` muted captions
- **Glassmorphism & Micro-Interactions:** Subtle translucent frosted overlays (`backdrop-filter: blur(12px)`), card hover scaling (`transform: translateY(-4px)`), and smooth CSS transitions.
- **Angular Material Customization:** Forms and tables utilize custom SCSS theme tokens in `src/material-theme.scss` to replace default indigo/pink palettes with baby blue neon highlights.
