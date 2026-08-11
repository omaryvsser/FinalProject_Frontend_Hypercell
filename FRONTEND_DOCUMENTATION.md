# 🎬 CinemaTicketing - Event & Cinema Ticketing Platform (Frontend Documentation)

An enterprise-grade, modern single-page web application (SPA) built with **Angular 17+ Standalone Components**, **Angular Signals**, and **Angular Material**. CinemaTicketing provides an intuitive, high-performance cinematic booking experience with real-time seat availability, scannable digital QR passes, aggregated booking management, and role-based portal access.

---

## 🎯 Project Overview

CinemaTicketing is designed to deliver a seamless movie and event ticketing experience for customers, organizers, and system administrators. Key features include:

- **Cinematic Discovery & Catalog:** Dynamic movie catalog with genre filtering, real-time search, and detailed showtime pages.
- **Seat Availability & Concurrency Guard:** Real-time seat tier selection (Standard, VIP, IMAX) backed by pessimistic database locking protection.
- **Digital Pass & QR Code Verification:** Scannable cryptographic QR pass generation for seamless digital entrance verification.
- **Aggregated Master Bookings:** Grouped booking cards with multi-ticket digital pass modal drawers.
- **Multi-Role Portals:** 
  - **Customer Portal:** Manage active and past bookings, view digital QR tickets.
  - **Organizer Portal:** Create and manage events, monitor ticket sales, view attendee lists.
  - **Admin Portal:** Platform-wide oversight of events, users, organizers, and revenue analytics.

---

## 🛠️ Technology Stack

| Layer / Feature | Technology Used |
| :--- | :--- |
| **Framework** | Angular 17+ (Standalone Components, Functional Guards & Interceptors) |
| **State Management** | Angular Signals (`signal()`, `computed()`, `update()`) |
| **UI Components** | Angular Material (`mat-card`, `mat-table`, `mat-select`, `mat-button`, `mat-dialog`) |
| **Icons & Typography** | Google Material Symbols & Roboto Font |
| **QR Code Engine** | `angularx-qrcode` |
| **HTTP & Security** | RxJS `HttpClient`, Functional Auth Interceptor (JWT Bearer tokens) |
| **Styling** | Modern CSS3 (Glassmorphism, Dark Slate `#0f172a`, Baby Blue `#38bdf8` accent) |

---

## 📂 Project Folder Structure

```
src/app/
├── core/                         # Singleton core services, models, guards, and interceptors
│   ├── guards/                   # Route protection (authGuard, roleGuard)
│   ├── interceptors/             # HTTP Auth interceptor (JWT header injection & 401/403 handling)
│   ├── models/                   # TypeScript interfaces and DTOs (event, ticket, booking, user)
│   └── services/                 # Central API services (AuthService, EventService, TicketService)
│
├── features/                     # Feature modules containing page components
│   ├── auth/                     # Authentication pages (Login, Register)
│   ├── booking/                  # Seat selection, checkout, and booking confirmation pages
│   ├── portals/                  # Role-restricted portal dashboards
│   │   ├── admin/                # Admin Management Dashboard
│   │   ├── customer/             # Customer "My Tickets" aggregated view & QR passes
│   │   └── organizer/            # Organizer Event Editor & Attendee Tracking
│   └── public/                   # Publicly accessible pages (Discover, MovieDetails, 403 Unauthorized, 404)
│
├── layouts/                      # App-wide structural layout shells (Header Navbar, Footer)
├── app.component.ts              # Root application component
├── app.config.ts                 # Global providers (routing, animations, HTTP interceptors)
└── app.routes.ts                 # Application route registry with role data metadata
```

### Folder Responsibilities:
- **`core/`**: Contains application-wide singletons including `AuthService` (JWT session management), `authGuard` / `roleGuard` (navigation access control), and `authInterceptor` (automatic Bearer token attachment).
- **`features/`**: Encapsulates self-contained views grouped by domain (Authentication, Booking Workflow, Customer Portals, Organizer Management, Admin Administration).
- **`layouts/`**: Houses global navigation bars, user profile dropdowns, and layout containers.

---

## ⚡ State Management (Angular Signals)

The application strictly utilizes **Angular Signals** for reactive state management, completely eliminating legacy RxJS `BehaviorSubject` boilerplate:

- **Reactive State (`signal`):** Local component state such as form fields, selected seat categories, quantity counters, and modal drawer visibilities are held in fine-grained signals.
  ```typescript
  readonly quantity = signal<number>(1);
  readonly selectedCategory = signal<SeatCategory | null>(null);
  ```
- **Computed Signals (`computed`):** Derived calculations like total booking price, available seat tier thresholds, and grouped booking collections recalculate automatically:
  ```typescript
  readonly totalPrice = computed(() => {
    const category = this.selectedCategory();
    return category ? category.price * this.quantity() : 0;
  });
  ```
- **Optimistic UI & Synchronization:** Upon successful booking or cancellation, signals update local state instantly before re-fetching server data for a zero-latency user experience.

---

## 🔒 Security & Role-Based Routing

Access to routes is protected by functional route guards based on JWT user roles (`CUSTOMER`, `ORGANIZER`, `ADMIN`).

### 1. Route Guards
- **`authGuard`**: Verifies that the user possesses a valid, non-expired JWT session token. Unauthenticated users are redirected to `/login?returnUrl=...`.
- **`roleGuard`**: Inspects route data attributes (e.g. `data: { roles: ['ORGANIZER', 'ADMIN'] }`). If an authenticated user attempts to access a route beyond their role permissions (e.g. a `CUSTOMER` navigating to `/admin`), the guard redirects them directly to the `/unauthorized` (HTTP 403) page.

```typescript
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data?.['roles'] as UserRole[]) || [];
  const userRole = authService.currentUser()?.role;

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }
  return router.createUrlTree(['/unauthorized']);
};
```

### 2. HTTP Interceptor
The `authInterceptor` automatically attaches the JWT header (`Authorization: Bearer <token>`) to outgoing HTTP requests (skipping `/public/` routes) and redirects to `/login` if a `401 Unauthorized` status is received.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or later
- **Angular CLI**: `v17.x` or later (`npm install -g @angular/cli`)

### Setup Instructions

1. **Clone the repository & navigate to the project directory:**
   ```bash
   git clone https://github.com/omaryvsser/FinalProject_Frontend_Hypercell.git
   cd cinema-ticketing
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   ng serve
   ```
   Navigate your browser to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

4. **Build for production:**
   ```bash
   ng build --configuration=production
   ```
   The build artifacts will be stored in the `dist/cinema-ticketing` directory.

---

## 📄 License
This project is developed as a Capstone Project for the **Hypercell Internship Program**.
