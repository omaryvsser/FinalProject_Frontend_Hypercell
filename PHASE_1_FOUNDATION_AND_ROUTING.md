# 🏛️ Phase 1: Foundation & Routing Architecture

## 🎯 Overview
This document details the bootstrap architecture, standalone component configuration, and root routing system of the **CinemaTicketing** frontend.

---

### 💡 High-Level Analogy: The Multiplex Cinema
Think of our Angular application as a state-of-the-art **Multiplex Cinema**:
* **`main.ts`** is the main power switch that powers on the entire building.
* **`app.config.ts`** is the central control desk that sets up security scanner lines, ticket booths, and global lighting rules.
* **`app.routes.ts`** is the main hallway with directional signage that routes moviegoers to the exact auditorium room they are authorized to enter (Public Cinema, Customer Lounge, Organizer Studio, or Admin Control Room).

---

## 1. The Modern Bootstrap Process (Standalone Architecture)

Unlike legacy Angular applications that relied on complex, monolithic `@NgModule` declarations, this project is built using modern **Angular 17+ Standalone Component Architecture**.

### 🛠️ `main.ts` — The Launcher
The entry point of the entire application is minimalist and clean:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

- **`bootstrapApplication(App, appConfig)`**: Directly mounts our root component (`App`) into the DOM's `<app-root>` element, supplying all application-wide services defined in `appConfig`.

---

### ⚙️ `app.config.ts` — Central Provider Registry
In standalone Angular, `app.config.ts` replaces the old `AppModule` by serving as the unified configuration object for global Dependency Injection (DI) providers:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { floatLabel: 'always', appearance: 'outline' }
    }
  ]
};
```

#### Key Functional Providers:
1. **`provideHttpClient(withInterceptors([authInterceptor]))`**: Configures Angular's HTTP client with a functional interceptor (`authInterceptor`) that automatically injects JWT Bearer tokens into outgoing HTTP requests and handles session expiration.
2. **`provideRouter(routes)`**: Enables Single Page Application (SPA) client-side routing.
3. **`MAT_FORM_FIELD_DEFAULT_OPTIONS`**: Enforces a consistent, high-end design system across all Angular Material inputs by defaulting to `appearance: 'outline'`.

---

## 2. Root Routing Architecture (`app.routes.ts`)

The application routing is organized into **3 distinct access tiers** plus public fallback routes:

```
app.routes.ts
├── 🌐 Public Tier (Discover, Movie Details, Login, Register)
├── 🎟️ Customer Tier (My Tickets, Seat Selection, Booking Page, Booking Success) [authGuard]
├── 🎬 Organizer Tier (Organizer Dashboard, Event Editor, Attendees Roster) [authGuard + roleGuard: ORGANIZER|ADMIN]
├── 🛡️ Admin Tier (Admin Analytics Dashboard) [authGuard + roleGuard: ADMIN]
└── ❓ Fallback Tier (Wildcard ** ➔ NotFound)
```

---

### 🚀 Performance Optimization: Dynamic Lazy Loading
Every major page in the application uses dynamic ES module imports with `loadComponent`:

```typescript
{
  path: 'organizer',
  canActivate: [authGuard, roleGuard],
  data: { roles: ['ORGANIZER', 'ADMIN'] },
  loadComponent: () =>
    import('./features/portals/organizer/dashboard/dashboard').then((m) => m.Dashboard),
}
```

#### Why this matters for Capstone Grading:
- **Instant First Page Load:** The browser only downloads the tiny root JavaScript bundle upon initial visit.
- **On-Demand Code Splitting:** Large feature components (like the Admin Dashboard or Digital QR Code engine) are split into separate lazy chunks (`chunk-*.js`) and downloaded *only when the user navigates to that route*.

---

### 🛡️ Route Access Control & Guards
Routes combine two functional guard mechanisms to enforce security:

1. **`authGuard`**: Verifies that the user has an active JWT session. Unauthenticated users attempting to access `/booking` or `/my-tickets` are intercepted and redirected to `/login?returnUrl=...`.
2. **`roleGuard` & Route Metadata (`data: { roles: [...] }`)**: Reads the authorized roles array from the route definition. If a user logged in as a `CUSTOMER` manually types `/admin` or `/organizer` in the URL bar:
   - `roleGuard` inspects their decoded JWT role.
   - Detects the role mismatch (`CUSTOMER` !== `ADMIN`/`ORGANIZER`).
   - Immediately cancels the navigation and redirects them back to the main discovery catalog (`/discover`).

---

### 🧭 Summary of Phase 1
- **Architecture:** 100% Standalone (zero legacy `NgModule`s).
- **Bootstrapping:** `main.ts` mounts `App` with global providers registered in `app.config.ts`.
- **Routing:** Fully lazy-loaded routes protected by functional `authGuard` and `roleGuard` with graceful fallback navigation.
